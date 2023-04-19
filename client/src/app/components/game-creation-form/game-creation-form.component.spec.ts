/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-throw-literal */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { HttpClientModule, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { RouterTestingModule } from '@angular/router/testing';
import { UploadImageSquareComponent } from '@app/components/upload-image-square/upload-image-square.component';
import {
    ALLOWED_RADIUS,
    DEFAULT_RADIUS,
    ERROR_MESSAGE_DISPLAYED_TIME,
    MAX_TITLE_LENGTH,
    // bug de prettier qui rentre en conflit avec eslint (pas de virgule pour le dernier élément d'un tableau)
    // eslint-disable-next-line prettier/prettier
    SUCCESS_MESSAGE_DISPLAYED_TIME
} from '@app/constants/utils-constants';
import { ActiveCanvas } from '@app/interfaces/active-canvas';
import { CommunicationService } from '@app/services/communication/communication.service';
import ValidateImageService from '@app/services/validate-server/validate-image.service';
import { ImageComparisonResult } from '@common/image-comparison-result';
import { GameCreationFormComponent } from './game-creation-form.component';

const PATH_TO_VALID_IMAGE = '/assets/test-assets/image_empty.bmp';

describe('GameCreationFormComponent', () => {
    let component: GameCreationFormComponent;
    let fixture: ComponentFixture<GameCreationFormComponent>;

    let validImgInput: HTMLInputElement;
    let validImgFile: File;

    let httpError: HttpErrorResponse;
    let routerSpy: jasmine.Spy;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GameCreationFormComponent, UploadImageSquareComponent],
            imports: [HttpClientModule, RouterTestingModule, MatIconModule],
            providers: [CommunicationService, ValidateImageService],
        }).compileComponents();

        fixture = TestBed.createComponent(GameCreationFormComponent);
        component = fixture.componentInstance;

        component.mainImageSquare = TestBed.createComponent(UploadImageSquareComponent).componentInstance;
        component.altImageSquare = TestBed.createComponent(UploadImageSquareComponent).componentInstance;

        routerSpy = spyOn(component.router, 'navigate').and.callFake(async () => {
            return Promise.resolve(true);
        });
    });

    beforeEach(async () => {
        validImgFile = new File([await (await fetch(PATH_TO_VALID_IMAGE)).blob()], 'valid-image.BMP', { type: 'image/bmp' });
        const dataTransfer = new DataTransfer();
        validImgInput = document.createElement('input');
        validImgInput.type = 'file';
        dataTransfer.items.add(validImgFile);
        validImgInput.files = dataTransfer.files;

        httpError = new HttpErrorResponse({ error: { message: 'test' }, status: 400, statusText: 'Bad Request' });
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
        expect(component.mainImageSquare).toBeTruthy();
        expect(component.altImageSquare).toBeTruthy();
    });

    it('should have 3 as default radius', () => {
        expect(component.differenceRadius).toEqual(3);
    });

    describe('ngAfterViewInit', () => {
        it('sets drawService images', () => {
            spyOn(document, 'addEventListener').and.callFake(() => {});
            component.ngAfterViewInit();

            expect(component.drawService.mainImageComponent).toBeDefined();
            expect(component.drawService.altImageComponent).toBeDefined();
            expect(component.drawService.mainImageComponent).toEqual(component.mainImageSquare);
            expect(component.drawService.altImageComponent).toEqual(component.altImageSquare);
        });

        it('adds key listeners', () => {
            const addEventListenerSpy = spyOn(document, 'addEventListener').and.callFake(() => {});
            component.ngAfterViewInit();

            expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('submitNewGame', () => {
        let stubForm: FormData;
        let buildGameCreationFormSpy: jasmine.Spy;
        beforeEach(() => {
            stubForm = new FormData();
            buildGameCreationFormSpy = spyOn(component, 'buildGameCreationForm').and.callFake(
                async () => new Promise((resolve) => resolve(stubForm)),
            );
        });

        it('should create new game with correct parameters', async () => {
            const createGameSpy = spyOn(component.communication, 'postRequest').and.returnValue(Promise.resolve(new HttpResponse({ body: {} })));
            const validateTitleSpy = spyOn(component, 'validateTitle').and.callFake(() => true);
            await component.submitNewGame();
            expect(validateTitleSpy).toHaveBeenCalled();
            expect(buildGameCreationFormSpy).toHaveBeenCalled();
            expect(createGameSpy).toHaveBeenCalledWith('games', stubForm);
        });

        it('should call showErrorMessage when server returns error', async () => {
            spyOn(component, 'validateTitle').and.callFake(() => true);
            const showErrorMessageSpy = spyOn(component, 'showErrorMessage').and.callFake(() => {});
            spyOn(component.communication, 'postRequest').and.callFake(() => {
                throw httpError;
            });
            await component.submitNewGame();
            expect(showErrorMessageSpy).toHaveBeenCalled();
        });

        it('should call showErrorMessages when client throws an error', async () => {
            spyOn(component, 'validateTitle').and.callFake(() => true);
            const showErrorMessageSpy = spyOn(component, 'showErrorMessage').and.callFake(() => {});
            spyOn(component.communication, 'postRequest').and.callFake(() => {
                throw new Error();
            });
            await component.submitNewGame();
            expect(showErrorMessageSpy).toHaveBeenCalled();
        });

        it('should navigate back to config page after successful game creation', fakeAsync(() => {
            spyOn(component.communication, 'postRequest').and.returnValue(Promise.resolve(new HttpResponse({ body: {} })));
            spyOn(component, 'validateTitle').and.callFake(() => true);
            component.submitNewGame();
            tick(3000);
            expect(routerSpy).toHaveBeenCalledWith(['/config']);
            flush();
        }));

        it('should call showErrorMessages when the title is not valid', async () => {
            const showErrorMessageSpy = spyOn(component, 'showErrorMessage').and.callFake(() => {});
            const validateTitleSpy = spyOn(component, 'validateTitle').and.callFake(() => false);
            await component.submitNewGame();
            expect(validateTitleSpy).toHaveBeenCalled();
            expect(showErrorMessageSpy).toHaveBeenCalled();
        });
    });

    describe('buildGameCreationForm', () => {
        it('gets both images', async () => {
            const mainImageSpy = spyOn(component.mainImageSquare, 'getImageFile').and.callFake(() => validImgFile);
            const altImageSpy = spyOn(component.altImageSquare, 'getImageFile').and.callFake(() => validImgFile);
            await component.buildGameCreationForm();

            expect(mainImageSpy).toHaveBeenCalled();
            expect(altImageSpy).toHaveBeenCalled();
        });

        it('creates form data with correct body', async () => {
            spyOn(component.mainImageSquare, 'getImageFile').and.callFake(() => validImgFile);
            spyOn(component.altImageSquare, 'getImageFile').and.callFake(() => validImgFile);

            const result = await component.buildGameCreationForm();
            expect(result.has('name')).toBeTruthy();
            expect(result.has('mainFile')).toBeTruthy();
            expect(result.has('altFile')).toBeTruthy();
            expect(result.has('radius')).toBeTruthy();
        });
    });

    describe('compareImages', () => {
        let compareImageResult: ImageComparisonResult;
        let mainImageSpy: jasmine.Spy;
        let altImageSpy: jasmine.Spy;

        beforeEach(() => {
            compareImageResult = {
                isValid: true,
                isHard: false,
                differenceCount: 9,
                differenceImageBase64: '',
            };
            mainImageSpy = spyOn(component.mainImageSquare, 'getImageFile').and.callFake(() => validImgFile);
            altImageSpy = spyOn(component.altImageSquare, 'getImageFile').and.callFake(() => validImgFile);
        });

        it('should get image files and call showSuccessMessage when successful', async () => {
            const compareImagesSpy = spyOn(component.communication, 'compareImages').and.callFake(async () => Promise.resolve(compareImageResult));
            const showSuccessMessageSpy = spyOn(component, 'showSuccessMessage').and.callFake(() => {});
            await component.compareImages();
            expect(compareImagesSpy).toHaveBeenCalled();
            expect(mainImageSpy).toHaveBeenCalled();
            expect(altImageSpy).toHaveBeenCalled();
            expect(showSuccessMessageSpy).toHaveBeenCalled();
        });

        it('should call showErrorMessage, when server returns an error', async () => {
            const showErrorMessageSpy = spyOn(component, 'showErrorMessage').and.callFake(() => {});
            spyOn(component.communication, 'compareImages').and.callFake(() => {
                throw httpError;
            });

            await component.compareImages();
            expect(showErrorMessageSpy).toHaveBeenCalled();
        });

        it('should call showErrorMessage, even when no error message', async () => {
            const showErrorMessageSpy = spyOn(component, 'showErrorMessage').and.callFake(() => {});
            spyOn(component.communication, 'compareImages').and.callFake(() => {
                throw new HttpErrorResponse({ error: { message: undefined } });
            });

            await component.compareImages();
            expect(showErrorMessageSpy).toHaveBeenCalled();
        });

        it('should call showErrorMessage when the images are not valid', async () => {
            const showErrorMessageSpy = spyOn(component, 'showErrorMessage').and.callFake(() => {});

            compareImageResult = {
                isValid: false,
                isHard: false,
                differenceCount: 9,
                differenceImageBase64: '',
            };
            spyOn(component.communication, 'compareImages').and.callFake(async () => Promise.resolve(compareImageResult));
            await component.compareImages();

            expect(showErrorMessageSpy).toHaveBeenCalled();
        });
    });

    describe('showInvalidImageMessage', () => {
        it('shows an error message', () => {
            const showErrorMessageSpy = spyOn(component, 'showErrorMessage').and.callFake(() => {});
            component.showInvalidImageMessage();

            expect(showErrorMessageSpy).toHaveBeenCalled();
        });
    });

    describe('showSuccessMessage', () => {
        it('should set successMessage to the correct message', () => {
            const message = 'This is a test success message';
            component.showSuccessMessage(message);
            expect(component.successMessage).toEqual(message);
        });

        it('should clear successMessage after a certain time', fakeAsync(() => {
            const message = 'This is a test success message';
            component.showSuccessMessage(message);
            tick(SUCCESS_MESSAGE_DISPLAYED_TIME);
            expect(component.successMessage).toEqual('');
        }));

        it('should clear successMessage when a new message is set', () => {
            const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callFake(() => {});
            component.successMessageTimeout = setTimeout(() => {}, 100000);
            const message = 'This is a test success message';
            component.showSuccessMessage(message);
            expect(clearTimeoutSpy).toHaveBeenCalled();
        });
    });

    describe('showErrorMessage', () => {
        it('should set errorMessage to the correct message', () => {
            const message = 'This is a test error message';
            component.showErrorMessage(message);
            expect(component.errorMessage).toEqual(message);
        });

        it('should clear errorMessage after a certain time', fakeAsync(() => {
            const message = 'This is a test error message';
            component.showErrorMessage(message);
            tick(ERROR_MESSAGE_DISPLAYED_TIME);
            expect(component.errorMessage).toEqual('');
        }));

        it('should clear errorMessage when a new message is set', () => {
            const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callFake(() => {});
            component.errorMessageTimeout = setTimeout(() => {}, 100000);
            const message = 'This is a test success message';
            component.showErrorMessage(message);
            expect(clearTimeoutSpy).toHaveBeenCalled();
        });
    });

    describe('setBothImages', () => {
        it('should call loadBackground on both squares', async () => {
            const loadOriginalSpy = spyOn(component.altImageSquare, 'loadBackground').and.callFake(
                async () =>
                    new Promise<void>((resolve) => {
                        resolve();
                    }),
            );
            const loadAltSpy = spyOn(component.mainImageSquare, 'loadBackground').and.callFake(
                async () =>
                    new Promise<void>((resolve) => {
                        resolve();
                    }),
            );
            await component.setBothImages(validImgInput);

            expect(loadAltSpy).toHaveBeenCalled();
            expect(loadOriginalSpy).toHaveBeenCalled();
        });
    });

    describe('setTitle', () => {
        it('should change title with correct value', () => {
            const input = 'newTitle';
            component.setTitle(input);
            expect(component.title).toEqual(input);
        });
    });

    describe('validateTitle', () => {
        it('should return true when title characters are valid', () => {
            component.title = 'valid title';
            expect(component.validateTitle()).toBeTrue();

            component.title = 'VALID TITLE';
            expect(component.validateTitle()).toBeTrue();

            component.title = '0123456789';
            expect(component.validateTitle()).toBeTrue();

            component.title = 'a'.repeat(MAX_TITLE_LENGTH);
        });

        it('should return false when title characters are invalid', () => {
            component.title = '';
            expect(component.validateTitle()).toBeFalse();

            component.title = '$#@!';
            expect(component.validateTitle()).toBeFalse();

            component.title = ' e x a m p l e';
            expect(component.validateTitle()).toBeFalse();

            component.title = 'e x a m p l e ';
            expect(component.validateTitle()).toBeFalse();
        });

        it('should return false when title is too long', () => {
            component.title = 'a'.repeat(MAX_TITLE_LENGTH + 1);
            expect(component.validateTitle()).toBeFalse();
        });
    });

    describe('setRadius', () => {
        it('should change the radius for valid input', () => {
            const validIndex = 1;
            component.setRadius(String(validIndex));
            expect(component.differenceRadius).toEqual(ALLOWED_RADIUS[validIndex]);
        });

        it('should not change the radius for invalid input', () => {
            const validIndex = 4;
            component.setRadius(String(validIndex));
            expect(component.differenceRadius).toEqual(DEFAULT_RADIUS);
            expect(component.errorMessage).toBeTruthy();
        });
    });

    describe('keyBinds', () => {
        let undoSpy: jasmine.Spy;
        let redoSpy: jasmine.Spy;

        beforeEach(() => {
            undoSpy = spyOn(component, 'undo').and.callFake(() => {});
            redoSpy = spyOn(component, 'redo').and.callFake(() => {});
        });

        it('updates shiftPressed to when shift pressed', () => {
            component.keyBinds(new KeyboardEvent('keydown', { key: ' ', shiftKey: true }));
            expect(component.shiftPressed).toEqual(true);

            component.keyBinds(new KeyboardEvent('keydown', { key: ' ', shiftKey: false }));
            expect(component.shiftPressed).toEqual(false);
        });

        it('calls undo when ctrl z pressed and not redo', () => {
            component.keyBinds(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));

            expect(undoSpy).toHaveBeenCalled();
            expect(redoSpy).not.toHaveBeenCalled();
        });

        it('calls redo when ctrl shift z pressed, and not undo', () => {
            component.keyBinds(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true }));

            expect(undoSpy).not.toHaveBeenCalled();
            expect(redoSpy).toHaveBeenCalled();
        });
    });

    describe('shiftUnBind', () => {
        it('updates shiftPressed to when shift pressed', () => {
            component.shiftUnBind(new KeyboardEvent('keydown', { key: ' ', shiftKey: true }));
            expect(component.shiftPressed).toEqual(true);

            component.shiftUnBind(new KeyboardEvent('keydown', { key: ' ', shiftKey: false }));
            expect(component.shiftPressed).toEqual(false);
        });
    });

    describe('undo and redo', () => {
        it('undo calls drawService undo', () => {
            const undoSpy = spyOn(component.drawService, 'undo').and.callFake(() => {});
            component.undo();

            expect(undoSpy).toHaveBeenCalled();
        });

        it('redo calls drawService redo', () => {
            const redoSpy = spyOn(component.drawService, 'redo').and.callFake(() => {});
            component.redo();

            expect(redoSpy).toHaveBeenCalled();
        });
    });

    describe('foreground commands', () => {
        it('replaceMainForeground calls drawService replaceForeground with correct params', () => {
            const replaceForegroundSpy = spyOn(component.drawService, 'replaceForeground').and.callFake(() => {});
            component.replaceMainForeground();

            expect(replaceForegroundSpy).toHaveBeenCalledWith(ActiveCanvas.Main);
        });

        it('replaceAltForeground calls drawService replaceForeground with correct params', () => {
            const replaceForegroundSpy = spyOn(component.drawService, 'replaceForeground').and.callFake(() => {});
            component.replaceAltForeground();

            expect(replaceForegroundSpy).toHaveBeenCalledWith(ActiveCanvas.Alt);
        });

        it('clearMainForeground calls drawService clearForeground with correct params', () => {
            const clearForegroundSpy = spyOn(component.drawService, 'clearForeground').and.callFake(() => {});
            component.clearMainForeground();

            expect(clearForegroundSpy).toHaveBeenCalledWith(ActiveCanvas.Main);
        });

        it('clearAltForeground calls drawService clearForeground with correct params', () => {
            const clearForegroundSpy = spyOn(component.drawService, 'clearForeground').and.callFake(() => {});
            component.clearAltForeground();

            expect(clearForegroundSpy).toHaveBeenCalledWith(ActiveCanvas.Alt);
        });
    });

    describe('mouse movements', () => {
        const stubCoord = { x: 1, y: 1 };
        it('mainCanvasMouseDown calls drawService startAction with correct params', () => {
            const startActionSpy = spyOn(component.drawService, 'startAction').and.callFake(() => {});
            component.mainCanvasMouseDown(stubCoord);

            expect(startActionSpy).toHaveBeenCalledWith(stubCoord, ActiveCanvas.Main);
        });

        it('altCanvasMouseDown calls drawService startAction with correct params', () => {
            const startActionSpy = spyOn(component.drawService, 'startAction').and.callFake(() => {});
            component.altCanvasMouseDown(stubCoord);

            expect(startActionSpy).toHaveBeenCalledWith(stubCoord, ActiveCanvas.Alt);
        });

        it('mainCanvasMouseMove calls drawService onMouseMove with correct params', () => {
            const onMouseMoveSpy = spyOn(component.drawService, 'onMouseMove').and.callFake(() => {});
            component.mainCanvasMouseMove(stubCoord);

            expect(onMouseMoveSpy).toHaveBeenCalledWith(stubCoord, ActiveCanvas.Main, false);
        });

        it('altCanvasMouseMove calls drawService onMouseMove with correct params', () => {
            const onMouseMoveSpy = spyOn(component.drawService, 'onMouseMove').and.callFake(() => {});
            component.altCanvasMouseMove(stubCoord);

            expect(onMouseMoveSpy).toHaveBeenCalledWith(stubCoord, ActiveCanvas.Alt, false);
        });

        it('onMouseUp calls drawService cancelAction', () => {
            const cancelActionSpy = spyOn(component.drawService, 'cancelAction').and.callFake(() => {});
            component.onMouseUp();

            expect(cancelActionSpy).toHaveBeenCalled();
        });
    });
});
