/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-empty-function */
import { HttpClientModule, HttpResponse } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PlayImageClassicComponent } from '@app/components/play-image/play-image-classic/play-image-classic.component';
import { AudioService } from '@app/services/audio/audio.service';
import { CommunicationService } from '@app/services/communication/communication.service';
import { ImageOperationService } from '@app/services/image-operation/image-operation.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { MouseService } from '@app/services/mouse/mouse.service';
import { GuessResult } from '@common/guess-result';
import { of } from 'rxjs';

export class StubImage {
    src: string;
    crossOrigin: string;
    onload: GlobalEventHandlers['onload'];
}

describe('PlayImageComponent', () => {
    let component: PlayImageClassicComponent;
    let fixture: ComponentFixture<PlayImageClassicComponent>;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;
    let mouseServiceSpy: jasmine.SpyObj<MouseService>;
    let imageOperationServiceSpy: jasmine.SpyObj<ImageOperationService>;
    let audioServiceSpy: jasmine.SpyObj<AudioService>;
    let inGameServiceSpy: jasmine.SpyObj<InGameService>;

    beforeEach(async () => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationServiceMock', ['customPost', 'sendCoordinates', 'getImageURL']);
        communicationServiceSpy.customPost.and.returnValue(of(0));
        communicationServiceSpy.getImageURL.and.returnValue('assets/tests/image.bmp');
        audioServiceSpy = jasmine.createSpyObj('AudioServiceMock', ['playAudio']);
        inGameServiceSpy = jasmine.createSpyObj('InGameServiceMock', [
            'submitCoordinatesSolo',
            'submitCoordinatesMulti',
            'retrieveSocketId',
            'sendDifferenceFound',
            'listenDifferenceFound',
            'connect',
            'playerExited',
            'listenOpponentLeaves',
            'playerWon',
        ]);

        inGameServiceSpy.socketService = jasmine.createSpyObj('SocketServiceMock', ['on']);

        const fakeResponse = {
            body: {
                correct: true,
                alreadyFound: false,
                differenceNum: 0,
            },
            statusText: 'OK',
        };
        communicationServiceSpy.sendCoordinates.and.returnValue(
            of(new HttpResponse<object>({ status: 201, statusText: 'Created', body: fakeResponse })),
        );

        mouseServiceSpy = jasmine.createSpyObj('MouseServiceMock', ['clickProcessing']);
        mouseServiceSpy.mousePosition = { x: 0, y: 0 };

        imageOperationServiceSpy = jasmine.createSpyObj('ImageOperationServiceMock', [
            'pixelBlink',
            'restorePixel',
            'originalImgContext',
            'modifiedImgContext',
            'setCanvasContext',
            'disableCheat',
            'handleCheat',
            'handleClue',
        ]);
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            declarations: [PlayImageClassicComponent],
            providers: [
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: MouseService, useValue: mouseServiceSpy },
                { provide: ImageOperationService, useValue: imageOperationServiceSpy },
                { provide: Image, useValue: StubImage },
                { provide: AudioService, useValue: audioServiceSpy },
                { provide: InGameService, useValue: inGameServiceSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlayImageClassicComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    beforeEach(() => {
        component.imageCanvas1.nativeElement = document.createElement('canvas');
        component.imageCanvas2.nativeElement = document.createElement('canvas');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('handleClue should call imageOperationService.handleClue', () => {
        imageOperationServiceSpy.handleClue.and.returnValue(Promise.resolve());
        component.handleClue(1, [{ x: 0, y: 0 }]);
        expect(imageOperationServiceSpy.handleClue).toHaveBeenCalled();
    });

    it('handleCheat should call imageOperationService.handleCheat', async () => {
        imageOperationServiceSpy.handleCheat.and.returnValue(Promise.resolve());
        await component.handleCheat();
        expect(imageOperationServiceSpy.handleCheat).toHaveBeenCalled();
    });

    describe('get', () => {
        it('mouse should return mouseService', () => {
            expect(component['mouseService']).toEqual(mouseServiceSpy);
        });

        it('canvasContext1 should return canvas context', () => {
            expect(component.canvasContext1).toEqual(component.imageCanvas1.nativeElement.getContext('2d') as CanvasRenderingContext2D);
        });

        it('canvasContext2 should return canvas context', () => {
            expect(component.canvasContext2).toEqual(component.imageCanvas2.nativeElement.getContext('2d') as CanvasRenderingContext2D);
        });
    });

    it('ngOnInit should set error counter to 0 and listen to differences found', () => {
        component.errorCounter = 3;
        inGameServiceSpy.listenDifferenceFound.and.callFake((callback: (guess: GuessResult) => void) => {
            callback({ isCorrect: false, differencesByPlayer: [], differencePixelList: [], winnerName: 'winnerName' });
        });
        const updateDiffFoundSpy = spyOn(component, 'updateDiffFound').and.callFake(() => {});
        component.ngOnInit();
        expect(component.errorCounter).toEqual(0);
        expect(inGameServiceSpy.listenDifferenceFound).toHaveBeenCalled();
        expect(updateDiffFoundSpy).toHaveBeenCalledWith({
            isCorrect: false,
            differencesByPlayer: [],
            differencePixelList: [],
            winnerName: 'winnerName',
        });
    });

    it('ngAfterViewInit should call getContext and loadImage', () => {
        spyOn(component, 'loadImage');
        component.ngAfterViewInit();
        expect(component.loadImage).toHaveBeenCalledTimes(1);
    });

    describe('sendPosition', () => {
        it('sendPosition should call submitCoordinatesSolo is isolo is true', fakeAsync(() => {
            component.isSolo = true;
            const event = new MouseEvent('event');
            const updateDiffFoundSpy = spyOn(component, 'updateDiffFound').and.callFake(() => {});
            inGameServiceSpy.submitCoordinatesSolo.and.callFake(async () => {
                return Promise.resolve({ isCorrect: false, differencesByPlayer: [], differencePixelList: [], winnerName: 'winnerName' });
            });
            component.sendPosition(event);

            tick(3000);

            expect(mouseServiceSpy.clickProcessing).toHaveBeenCalledWith(event);
            expect(updateDiffFoundSpy).toHaveBeenCalledWith({
                isCorrect: false,
                differencesByPlayer: [],
                differencePixelList: [],
                winnerName: 'winnerName',
            });
        }));

        it('sendPosition should call submitCoordinatesMulti is isSolo is false', fakeAsync(() => {
            component.isSolo = false;
            const event = new MouseEvent('event');
            inGameServiceSpy.submitCoordinatesMulti.and.callFake(async () => {});
            component.sendPosition(event);

            tick(3000);

            expect(mouseServiceSpy.clickProcessing).toHaveBeenCalledWith(event);
        }));
    });

    describe('updateDiffFound', () => {
        it('should the right functions and make errorCounter = 0 when guessResult is correct and the score has changed', () => {
            const guessResult: GuessResult = { isCorrect: true, differencesByPlayer: [], differencePixelList: [], winnerName: 'winnerName' };
            spyOn(component, 'hasNbDifferencesChanged').and.callFake(() => {
                return true;
            });
            const diffFoundUpdateEmitSpy = spyOn(component['diffFoundUpdate'], 'emit').and.callFake(() => {});
            component.updateDiffFound(guessResult);

            expect(component.lastDifferenceFound).toEqual(guessResult);
            expect(audioServiceSpy.playAudio).toHaveBeenCalledWith('success');
            expect(diffFoundUpdateEmitSpy).toHaveBeenCalledWith(component.lastDifferenceFound.differencesByPlayer);
            expect(component.errorCounter).toEqual(0);
            expect(imageOperationServiceSpy.pixelBlink).toHaveBeenCalledWith(guessResult.differencePixelList);
        });
        it('should handle a false guess', () => {
            const guessResult: GuessResult = { isCorrect: false, differencesByPlayer: [], differencePixelList: [], winnerName: 'winnerName' };
            spyOn(component, 'hasNbDifferencesChanged').and.callFake(() => {
                return true;
            });
            const diffFoundUpdateEmitSpy = spyOn(component['diffFoundUpdate'], 'emit').and.callFake(() => {});
            const handleErrorGuessSpy = spyOn(component, 'handleErrorGuess').and.callFake(() => {});
            component.updateDiffFound(guessResult);

            expect(component.lastDifferenceFound).not.toEqual(guessResult);
            expect(audioServiceSpy.playAudio).not.toHaveBeenCalledWith('success');
            expect(diffFoundUpdateEmitSpy).not.toHaveBeenCalledWith(component.lastDifferenceFound.differencesByPlayer);
            expect(imageOperationServiceSpy.pixelBlink).not.toHaveBeenCalledWith(guessResult.differencePixelList);
            expect(handleErrorGuessSpy).toHaveBeenCalled();
        });
        it('should handle a difference already received', () => {
            const guessResult: GuessResult = { isCorrect: true, differencesByPlayer: [], differencePixelList: [], winnerName: 'winnerName' };
            spyOn(component, 'hasNbDifferencesChanged').and.callFake(() => {
                return false;
            });
            const diffFoundUpdateEmitSpy = spyOn(component['diffFoundUpdate'], 'emit').and.callFake(() => {});
            const handleErrorGuessSpy = spyOn(component, 'handleErrorGuess').and.callFake(() => {});
            component.updateDiffFound(guessResult);

            expect(component.lastDifferenceFound).not.toEqual(guessResult);
            expect(audioServiceSpy.playAudio).not.toHaveBeenCalledWith('success');
            expect(diffFoundUpdateEmitSpy).not.toHaveBeenCalledWith(component.lastDifferenceFound.differencesByPlayer);
            expect(imageOperationServiceSpy.pixelBlink).not.toHaveBeenCalledWith(guessResult.differencePixelList);
            expect(handleErrorGuessSpy).toHaveBeenCalled();
        });
    });

    describe('hasNbDifferencesChanged', () => {
        it('should return false when did not changed', () => {
            component.lastDifferenceFound.differencesByPlayer = [
                ['socket1', 1],
                ['socket2', 2],
            ];
            const differenceByPlayer: [string, number][] = [
                ['socket1', 1],
                ['socket2', 2],
            ];
            const result: boolean = component.hasNbDifferencesChanged(differenceByPlayer);
            expect(result).toEqual(false);
        });
        it('should return true when changed', () => {
            component.lastDifferenceFound.differencesByPlayer = [
                ['socket1', 1],
                ['socket2', 2],
            ];
            const differenceByPlayer: [string, number][] = [
                ['socket1', 1],
                ['socket2', 3],
            ];
            const result: boolean = component.hasNbDifferencesChanged(differenceByPlayer);
            expect(result).toEqual(true);
        });
        it('should return true when changed', () => {
            component.lastDifferenceFound.differencesByPlayer = [['socket1', 1]];
            const differenceByPlayer: [string, number][] = [
                ['socket1', 1],
                ['socket2', 1],
            ];
            const result: boolean = component.hasNbDifferencesChanged(differenceByPlayer);
            expect(result).toEqual(true);
        });
    });

    describe('handleErrorGuess', () => {
        it('handleErrorGuess should set errorMsgPosition, call errorTimer and increment errorCounter and set errorGuess to false after 1s', () => {
            jasmine.clock().install();
            component.errorCounter = 0;
            // component['mouseService'].mousePosition = { x: 0, y: 1 };
            component.handleErrorGuess({ x: 0, y: 1 });
            expect(component.errorGuess).toEqual(true);
            jasmine.clock().tick(1000);
            expect(component.errorMsgPosition).toEqual({ x: 0, y: 1 });
            expect(component.errorCounter).toEqual(1);
            expect(component.errorGuess).toEqual(false);
            jasmine.clock().uninstall();
        });

        it('handleErrorGuess should call playAudio with "error" when errorCounter is less than 3', () => {
            component.errorCounter = 1; // will be incremented to 2 in handleErrorGuess
            component.handleErrorGuess({ x: 0, y: 1 });
            expect(audioServiceSpy.playAudio).toHaveBeenCalledWith('error');
            expect(component.errorCounter).toEqual(2);
        });

        it('handleErrorGuess should call playAudio with "manyErrors" when errorCounter is equal to 3 and reset the count', () => {
            component.errorCounter = 2;
            component.handleErrorGuess({ x: 0, y: 1 });
            expect(audioServiceSpy.playAudio).toHaveBeenCalledWith('manyErrors');
            expect(component.errorCounter).toEqual(0);
        });
    });

    it('loadImage should load image on canvas', async () => {
        spyOn(component, 'drawImageOnCanvas');
        await component.loadImage(component.canvasContext1, 0);
        expect(component.drawImageOnCanvas).toHaveBeenCalledWith(component.canvasContext1, jasmine.any(Image));
        expect(communicationServiceSpy.getImageURL).toHaveBeenCalled();
    });

    it('drawImageOnCanvas should call drawImage function', () => {
        const drawSpy = spyOn(component.canvasContext1, 'drawImage');
        component.drawImageOnCanvas(component.canvasContext1, new Image());
        expect(drawSpy).toHaveBeenCalled();
    });

    it('ngOnDestroy should call imageOperationService.disableCheat', () => {
        component.ngOnDestroy();
        expect(imageOperationServiceSpy.disableCheat).toHaveBeenCalled();
    });
});
