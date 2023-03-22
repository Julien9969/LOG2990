/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-empty-function */
import { HttpClientModule, HttpResponse } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AudioService } from '@app/services/audio.service';
import { CommunicationService } from '@app/services/communication.service';
import { ImageOperationService } from '@app/services/image-operation.service';
import { InGameService } from '@app/services/in-game.service';
import { MouseService } from '@app/services/mouse.service';
import { GuessResult } from '@common/guess-result';
// import { GuessResult } from '@common/guess-result';
import { of } from 'rxjs';
import { PlayImageComponent } from './play-image.component';

export class StubImage {
    src: string;
    crossOrigin: string;
    onload: GlobalEventHandlers['onload'];
}

describe('PlayImageComponent', () => {
    let component: PlayImageComponent;
    let fixture: ComponentFixture<PlayImageComponent>;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;
    let mouseServiceSpy: jasmine.SpyObj<MouseService>;
    let imageOperationServiceSpy: jasmine.SpyObj<ImageOperationService>;
    // let fakeGuessResult: GuessResult;
    let audioServiceSpy: jasmine.SpyObj<AudioService>;
    let inGameServiceSpy: jasmine.SpyObj<InGameService>;

    beforeEach(async () => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationServiceMock', ['customPost', 'sendCoordinates', 'getImageURL']);
        communicationServiceSpy.customPost.and.returnValue(of(0));
        communicationServiceSpy.getImageURL.and.returnValue('assets/tests/image.bmp');
        audioServiceSpy = jasmine.createSpyObj('AudioServiceMock', ['playAudio']);
        inGameServiceSpy = jasmine.createSpyObj('InGameServiceMock', [
            'submitCoordinates',
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
        ]);
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            declarations: [PlayImageComponent],
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
        fixture = TestBed.createComponent(PlayImageComponent);
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

    describe('get', () => {
        it('mouse should return mouseService', () => {
            expect(component.mouse).toEqual(mouseServiceSpy);
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
        // const setCanvasContextSpy = spyOn(component['imageOperationService'], 'setCanvasContext');
        component.ngAfterViewInit();
        expect(component.loadImage).toHaveBeenCalledTimes(2);
        expect(imageOperationServiceSpy.setCanvasContext).toHaveBeenCalled();
    });

    describe('sendPosition', () => {
        it('sendPosition should call the right functions', fakeAsync(() => {
            const event = new MouseEvent('event');
            const updateDiffFoundSpy = spyOn(component, 'updateDiffFound').and.callFake(() => {});
            inGameServiceSpy.submitCoordinates.and.callFake(async () => {
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
        it('sendPosition should catch the error in the promise', fakeAsync(() => {
            const event = new MouseEvent('event');
            inGameServiceSpy.submitCoordinates.and.callFake(async () => {
                throw new Error();
            });
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
    // it('should sendDiffFound emit an event with "data"', fakeAsync(() => {
    //     spyOn(component.diffFound, 'emit');
    //     component.sendDiffFound();
    //     expect(component.diffFound.emit).toHaveBeenCalledWith('data');
    // }));

    // describe('sendPosition', () => {
    //     it('should call sendCoordinates, clickProcessing and handle correct response', () => {
    //         spyOn(component, 'isRightDiff');
    //         component.sendPosition(new MouseEvent('click', { clientX: 0, clientY: 0 }));
    //         expect(mouseServiceSpy.clickProcessing).toHaveBeenCalled();
    //         expect(communicationServiceSpy.sendCoordinates).toHaveBeenCalled();
    //         expect(component.isRightDiff).toHaveBeenCalled();
    //     });

    //     it('should call sendCoordinates, clickProcessing and handle incorrect response', () => {
    //         communicationServiceSpy.sendCoordinates.and.returnValue(throwError(() => new Error('test')));
    //         spyOn(component, 'isRightDiff');
    //         component.sendPosition(new MouseEvent('click', { clientX: 0, clientY: 0 }));
    //         expect(mouseServiceSpy.clickProcessing).toHaveBeenCalled();
    //         expect(communicationServiceSpy.sendCoordinates).toHaveBeenCalled();
    //         expect(component.isRightDiff).not.toHaveBeenCalled();
    //     });

    //     it('should not call sendCoordinates and clickProcessing if timer.error.errorGuess is true', () => {
    //         component.timerService.errorGuess = true;
    //         component.sendPosition(new MouseEvent('click', { clientX: 0, clientY: 0 }));
    //         expect(mouseServiceSpy.clickProcessing).not.toHaveBeenCalled();
    //         expect(communicationServiceSpy.sendCoordinates).not.toHaveBeenCalled();
    //     });
    // });

    // describe('isRightDiff', () => {
    //     it('should emit diffFound event when difference is found', () => {
    //         spyOn(component, 'sendDiffFound');
    //         fakeGuessResult = { correct: true, alreadyFound: false, differenceNum: 0, differencePixelList: [{ x: 0, y: 0 }] };
    //         component.isRightDiff(fakeGuessResult);
    //         expect(component.sendDiffFound).toHaveBeenCalled();
    //     });

    //     it('should call imageOperationService.pixelBlink function when difference is found', () => {
    //         fakeGuessResult = { correct: true, alreadyFound: false, differenceNum: 0, differencePixelList: [{ x: 0, y: 0 }] };
    //         component.isRightDiff(fakeGuessResult);
    //         expect(imageOperationServiceSpy.pixelBlink).toHaveBeenCalled();
    //     });

    //     it('should call playAudio with "success" when difference is found', () => {
    //         fakeGuessResult = { correct: true, alreadyFound: false, differenceNum: 0, differencePixelList: [{ x: 0, y: 0 }] };
    //         component.isRightDiff(fakeGuessResult);
    //         expect(audioServiceSpy.playAudio).toHaveBeenCalledWith('success');
    //     });

    //     it('should reset error counter when difference is found', () => {
    //         component.errorCounter = 3;
    //         fakeGuessResult = { correct: true, alreadyFound: false, differenceNum: 0, differencePixelList: [{ x: 0, y: 0 }] };
    //         component.isRightDiff(fakeGuessResult);
    //         expect(component.errorCounter).toEqual(0);
    //     });

    //     it('should call handleErrorGuess when the guess is not good or it has already been found', () => {
    //         spyOn(component, 'handleErrorGuess');
    //         fakeGuessResult = { correct: false, alreadyFound: false, differenceNum: 0, differencePixelList: [{ x: 0, y: 0 }] };
    //         component.isRightDiff(fakeGuessResult);
    //         expect(component.handleErrorGuess).toHaveBeenCalled();
    //         fakeGuessResult = { correct: true, alreadyFound: true, differenceNum: 0, differencePixelList: [{ x: 0, y: 0 }] };
    //         component.isRightDiff(fakeGuessResult);
    //         expect(component.handleErrorGuess).toHaveBeenCalled();
    //     });
    // });

    describe('handleErrorGuess', () => {
        it('handleErrorGuess should set errorMsgPosition, call errorTimer and increment errorCounter', () => {
            component.errorCounter = 0;
            component.mouse.mousePosition = { x: 0, y: 1 };
            component.handleErrorGuess();
            expect(component.errorMsgPosition).toEqual({ x: 0, y: 1 });
            // sera retiré quand ce test sera corrigé
            // expect(timerSpy.errorTimer).toHaveBeenCalled();
            expect(component.errorCounter).toEqual(1);
        });

        it('handleErrorGuess should call playAudio with "error" when errorCounter is less than 3', () => {
            component.errorCounter = 1; // will be incremented to 2 in handleErrorGuess
            component.handleErrorGuess();
            expect(audioServiceSpy.playAudio).toHaveBeenCalledWith('error');
            expect(component.errorCounter).toEqual(2);
        });

        it('handleErrorGuess should call playAudio with "manyErrors" when errorCounter is equal to 3 and reset the count', () => {
            component.errorCounter = 2;
            component.handleErrorGuess();
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
