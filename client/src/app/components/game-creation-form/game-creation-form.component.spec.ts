/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-throw-literal */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { HttpClientModule, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import {
    ALLOWED_RADIUS,
    DEFAULT_RADIUS,
    ERROR_MESSAGE_DISPLAYED_TIME,
    MAX_TITLE_LENGTH,
    // bug de prettier qui rentre en conflit avec eslint (pas de virgule pour le dernier élément d'un tableau)
    // eslint-disable-next-line prettier/prettier
    SUCCESS_MESSAGE_DISPLAYED_TIME
} from '@app/constants/utils-constants';
import { CommunicationService } from '@app/services/communication.service';
import ValidateImageService from '@app/services/validate-image.service';
import { GameCreationFormComponent } from './game-creation-form.component';

const PATH_TO_VALID_IMAGE = '/assets/test-assets/image_empty.bmp';
const VALID_IMAGE_ID = 1999;

describe('GameCreationFormComponent', () => {
    let component: GameCreationFormComponent;
    let fixture: ComponentFixture<GameCreationFormComponent>;

    let validImgInput: HTMLInputElement;
    let validImgFile: File;

    let httpError: HttpErrorResponse;
    let routerSpy: jasmine.Spy;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GameCreationFormComponent],
            imports: [HttpClientModule, RouterTestingModule],
            providers: [CommunicationService, ValidateImageService],
        }).compileComponents();

        fixture = TestBed.createComponent(GameCreationFormComponent);
        component = fixture.componentInstance;

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
    });

    it('should have 3 as default radius', () => {
        expect(component.differenceRadius).toEqual(3);
    });

    describe('submitNewGame', () => {
        it('should create new game with correct parameters', async () => {
            const createGameSpy = spyOn(component.communication, 'postRequest').and.returnValue(Promise.resolve(new HttpResponse({ body: {} })));
            component.title = 'test';
            component.differenceRadius = 3;
            component.originalImageId = VALID_IMAGE_ID;
            component.altImageId = VALID_IMAGE_ID;
            await component.submitNewGame();
            expect(createGameSpy).toHaveBeenCalledWith('games', {
                name: component.title,
                radius: component.differenceRadius,
                imageMain: component.originalImageId,
                imageAlt: component.altImageId,
            });
        });

        it("should call showErrorMessage when component doesn't have all the required information", async () => {
            const showErrorMessageSpy = spyOn(component, 'showErrorMessage').and.callFake(() => {});
            await component.submitNewGame();
            expect(showErrorMessageSpy).toHaveBeenCalled();
        });

        it('should call showErrorMessage when server returns error', async () => {
            component.title = 'test';
            component.differenceRadius = 3;
            component.originalImageId = VALID_IMAGE_ID;
            component.altImageId = VALID_IMAGE_ID;
            const showErrorMessageSpy = spyOn(component, 'showErrorMessage').and.callFake(() => {});
            spyOn(component.communication, 'postRequest').and.callFake(() => {
                throw httpError;
            });
            await component.submitNewGame();
            expect(showErrorMessageSpy).toHaveBeenCalled();
        });

        it('should call showErrorMessages when client throws an error', async () => {
            component.title = 'test';
            component.differenceRadius = 3;
            component.originalImageId = VALID_IMAGE_ID;
            component.altImageId = VALID_IMAGE_ID;
            const showErrorMessageSpy = spyOn(component, 'showErrorMessage').and.callFake(() => {});
            spyOn(component.communication, 'postRequest').and.callFake(() => {
                throw new Error();
            });
            await component.submitNewGame();
            expect(showErrorMessageSpy).toHaveBeenCalled();
        });

        it('should navigate back to config page after successful game creation', fakeAsync(() => {
            spyOn(component.communication, 'postRequest').and.returnValue(Promise.resolve(new HttpResponse({ body: {} })));
            component.title = 'test';
            component.differenceRadius = 3;
            component.originalImageId = VALID_IMAGE_ID;
            component.altImageId = VALID_IMAGE_ID;
            component.submitNewGame();
            tick(3000);
            expect(routerSpy).toHaveBeenCalledWith(['/config']);
            flush();
        }));

        it('should call showErrorMessages when the title is not valid', async () => {
            const showErrorMessageSpy = spyOn(component, 'showErrorMessage').and.callFake(() => {});
            const validateTitleSpy = spyOn(component, 'validateTitle').and.returnValue(false);
            component.title = 'test';
            component.differenceRadius = 3;
            component.originalImageId = VALID_IMAGE_ID;
            component.altImageId = VALID_IMAGE_ID;
            await component.submitNewGame();
            expect(validateTitleSpy).toHaveBeenCalled();
            expect(showErrorMessageSpy).toHaveBeenCalled();
        });
    });

    describe('validateImageDifferences', () => {
        let compareImageResult;
        let saveImageSpy: jasmine.Spy;
        let compareImagesSpy: jasmine.Spy;

        beforeEach(() => {
            compareImageResult = {
                isValid: true,
                originalImageId: VALID_IMAGE_ID,
                altImageId: VALID_IMAGE_ID,
                isHard: false,
                differenceCount: 9,
                differenceImageId: VALID_IMAGE_ID,
            };
            saveImageSpy = spyOn(component.communication, 'saveImage');
            saveImageSpy.and.returnValue(Promise.resolve(VALID_IMAGE_ID));
            compareImagesSpy = spyOn(component.communication, 'compareImages');
            compareImagesSpy.and.returnValue(Promise.resolve(compareImageResult));

            component.originalImage = validImgFile;
            component.altImage = validImgFile;
        });

        it('should call saveImage', async () => {
            await component.validateImageDifferences();
            expect(saveImageSpy).toHaveBeenCalledWith(component.originalImage);
            expect(saveImageSpy).toHaveBeenCalledWith(component.altImage);
        });

        it('should call compareImages', async () => {
            saveImageSpy.and.returnValue(VALID_IMAGE_ID);
            await component.validateImageDifferences();
            expect(compareImagesSpy).toHaveBeenCalledWith(component.originalImageId, component.altImageId, component.differenceRadius);
        });

        it('should call showSuccessMessage', async () => {
            const showSuccessMessageSpy = spyOn(component, 'showSuccessMessage').and.callFake(() => {});
            await component.validateImageDifferences();
            expect(showSuccessMessageSpy).toHaveBeenCalled();
        });

        it('should call showErrorMessage, clearOriginalImage & clearAltImage when server returns an error', () => {
            const showErrorMessageSpy = spyOn(component, 'showErrorMessage').and.callFake(() => {});
            const clearOriginalImageSpy = spyOn(component, 'clearOriginalImage').and.callFake(() => {});
            const clearAltImageSpy = spyOn(component, 'clearAltImage').and.callFake(() => {});
            saveImageSpy.and.callFake(() => {
                throw httpError;
            });

            component.validateImageDifferences();
            expect(showErrorMessageSpy).toHaveBeenCalled();
            expect(clearOriginalImageSpy).toHaveBeenCalled();
            expect(clearAltImageSpy).toHaveBeenCalled();
        });

        it('should call showErrorMessage when there is no image uploaded', () => {
            const showErrorMessageSpy = spyOn(component, 'showErrorMessage').and.callFake(() => {});
            component.originalImage = null;
            component.altImage = null;
            component.validateImageDifferences();
            expect(showErrorMessageSpy).toHaveBeenCalled();
        });

        it('should call showErrorMessage when the images are not valid', async () => {
            const showErrorMessageSpy = spyOn(component, 'showErrorMessage').and.callFake(() => {});
            const clearOriginalImageSpy = spyOn(component, 'clearOriginalImage').and.callFake(() => {});
            const clearAltImageSpy = spyOn(component, 'clearAltImage').and.callFake(() => {});

            compareImageResult = {
                isValid: false,
                originalImageId: VALID_IMAGE_ID,
                altImageId: VALID_IMAGE_ID,
                isHard: false,
                differenceCount: 9,
                differenceImageId: VALID_IMAGE_ID,
            };
            compareImagesSpy.and.returnValue(Promise.resolve(compareImageResult));
            await component.validateImageDifferences();
            expect(showErrorMessageSpy).toHaveBeenCalled();
            expect(clearOriginalImageSpy).toHaveBeenCalled();
            expect(clearAltImageSpy).toHaveBeenCalled();
        });
    });

    describe('validateUploadedImage', () => {
        it('should return true when image is valid', async () => {
            spyOn(component.validateImage, 'validateImage').and.returnValue(Promise.resolve(true));
            expect(await component.validateUploadedImage(validImgFile)).toBeTrue();
        });
        it('should return false & show error message when image is invalid', async () => {
            spyOn(component.validateImage, 'validateImage').and.returnValue(Promise.resolve(false));
            expect(await component.validateUploadedImage(validImgFile)).toBeFalse();
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

    describe('clearOrignialImage', () => {
        it('should reset originalImage related attributes & invalidate the game', () => {
            component.clearOriginalImage();
            expect(component.originalImage).toEqual(null);
            expect(component.originalImageURL).toEqual(undefined);
            expect(component.originalImageId).toEqual(undefined);
            expect(component.isValid).toEqual(false);
        });
    });

    describe('clearAltImage', () => {
        it('should reset altImage related attributes & invalidate the game', () => {
            component.clearAltImage();
            expect(component.altImage).toEqual(null);
            expect(component.altImageURL).toEqual(undefined);
            expect(component.altImageId).toEqual(undefined);
            expect(component.isValid).toEqual(false);
        });
    });

    describe('handleOriginalImageUpload', () => {
        let validateUploadSpy: jasmine.Spy;
        beforeEach(() => {
            validateUploadSpy = spyOn(component, 'validateUploadedImage').and.callThrough();
        });

        it('should give value to originalImage related attributes when image is valid', async () => {
            validateUploadSpy.and.returnValue(true);
            await component.handleOriginalImageUpload(validImgFile);
            expect(component.originalImage).toEqual(validImgFile);
            expect(component.originalImageURL).toBeTruthy();
        });

        it('should invalidate the game when image is uploaded', async () => {
            validateUploadSpy.and.returnValue(true);
            component.isValid = true;
            await component.handleOriginalImageUpload(validImgFile);
            expect(component.isValid).toEqual(false);
        });

        it('should not give value to originalImage related attributes when image is not valid', async () => {
            validateUploadSpy.and.returnValue(false);
            await component.handleOriginalImageUpload(validImgFile);
            expect(component.originalImage).toEqual(null);
            expect(component.originalImageURL).toEqual(undefined);
        });
    });

    describe('handleAltImageUpload', () => {
        let validateUploadSpy: jasmine.Spy;
        beforeEach(() => {
            validateUploadSpy = spyOn(component, 'validateUploadedImage').and.callThrough();
        });

        it('should give value to altImage related attributes when image is valid', async () => {
            validateUploadSpy.and.returnValue(true);
            await component.handleAltImageUpload(validImgFile);
            expect(component.altImage).toEqual(validImgFile);
            expect(component.altImageURL).toBeTruthy();
        });

        it('should invalidate the game when image is uploaded', async () => {
            validateUploadSpy.and.returnValue(true);
            component.isValid = true;
            await component.handleAltImageUpload(validImgFile);
            expect(component.isValid).toEqual(false);
        });

        it('should not give value to altImage related attributes when image is not valid', async () => {
            validateUploadSpy.and.returnValue(false);
            await component.handleAltImageUpload(validImgFile);
            expect(component.altImage).toEqual(null);
            expect(component.altImageURL).toEqual(undefined);
        });
    });

    describe('setBothImages', () => {
        let handleAltSpy: jasmine.Spy;
        let handleOriginalSpy: jasmine.Spy;

        beforeEach(() => {
            handleAltSpy = spyOn(component, 'handleAltImageUpload').and.callThrough();
            handleOriginalSpy = spyOn(component, 'handleOriginalImageUpload').and.callThrough();
        });

        it('should call handleAltImageUpload & handleOriginalImageUpload', async () => {
            await component.setBothImages(validImgInput);
            expect(handleAltSpy).toHaveBeenCalled();
            expect(handleOriginalSpy).toHaveBeenCalled();
        });

        it('should not call handleAltImageUpload & handleOriginalImageUpload when input is empty', async () => {
            const emptyInput = document.createElement('input');
            emptyInput.type = 'files';
            await component.setBothImages(emptyInput);
            expect(handleAltSpy).not.toHaveBeenCalled();
            expect(handleOriginalSpy).not.toHaveBeenCalled();
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
});
