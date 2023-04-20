/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines, max-len */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-empty-function */
import { HttpClientModule, HttpResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayImageLimitedTimeComponent } from '@app/components/play-image/play-image-limited-time/play-image-limited-time.component';
import { AudioService } from '@app/services/audio/audio.service';
import { CommunicationService } from '@app/services/communication/communication.service';
import { ImageOperationService } from '@app/services/image-operation/image-operation.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { MouseService } from '@app/services/mouse/mouse.service';
import { Game } from '@common/game';
import { GuessResult } from '@common/guess-result';
import { of } from 'rxjs';

export class StubImage {
    src: string;
    crossOrigin: string;
    onload: GlobalEventHandlers['onload'];
}

describe('PlayImageComponent', () => {
    let component: PlayImageLimitedTimeComponent;
    let fixture: ComponentFixture<PlayImageLimitedTimeComponent>;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;
    let mouseServiceSpy: jasmine.SpyObj<MouseService>;
    let imageOperationServiceSpy: jasmine.SpyObj<ImageOperationService>;
    let audioServiceSpy: jasmine.SpyObj<AudioService>;
    let inGameServiceSpy: jasmine.SpyObj<InGameService>;
    let game: Game;

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
            'listenNewGame',
            'submitCoordinatesLimitedTime',
        ]);

        inGameServiceSpy.socketService = jasmine.createSpyObj('SocketServiceMock', ['on']);

        game = {
            id: '1',
            name: 'testName',
            imageMain: 1,
            imageAlt: 1,
            scoreBoardSolo: [['Bob', 1]],
            scoreBoardMulti: [['Bob', 1]],
            isValid: false,
            isHard: false,
            differenceCount: 2,
        };

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
            declarations: [PlayImageLimitedTimeComponent],
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
        fixture = TestBed.createComponent(PlayImageLimitedTimeComponent);
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

    it('ngOnInit should listen to newGame that call receiveNewGame in call back', () => {
        const data = [{}, 1];
        const receiveNewGameSpy = spyOn(component, 'receiveNewGame' as any).and.callFake(() => {});
        component.ngOnInit();
        expect(inGameServiceSpy.listenNewGame).toHaveBeenCalled();
        inGameServiceSpy.listenNewGame.calls.mostRecent().args[0](data as any);
        expect(receiveNewGameSpy).toHaveBeenCalled();
    });

    it('ngAfterViewInit should call getContext and loadImage', () => {
        spyOn(component, 'afterViewInit');
        component.ngAfterViewInit();
        expect(component.afterViewInit).toHaveBeenCalled();
    });

    it('submitLimitedTimeCoordinates should call socket.submitCoordinatesLimitedTime', async () => {
        component.submitLimitedTimeCoordinates();
        expect(inGameServiceSpy.submitCoordinatesLimitedTime).toHaveBeenCalled();
    });

    it('handle clue should call imageOperationService.handleClue', async () => {
        await component.handleClue(1, [{ x: 0, y: 0 }]);
        expect(imageOperationServiceSpy.handleClue).toHaveBeenCalled();
    });

    describe('sendPosition', () => {
        it('should call mouseService.clickProcessing', () => {
            spyOn(component, 'submitLimitedTimeCoordinates').and.callFake(() => {});
            const mouseEvent = new MouseEvent('click');
            component.sendPosition(mouseEvent);
            expect(mouseServiceSpy.clickProcessing).toHaveBeenCalled();
        });

        it('should call submitLimitedTimeCoordinates', () => {
            spyOn(component, 'submitLimitedTimeCoordinates').and.callFake(() => {});
            const mouseEvent = new MouseEvent('click');
            component.sendPosition(mouseEvent);
            expect(component.submitLimitedTimeCoordinates).toHaveBeenCalled();
        });
    });

    describe('updateDiffFound', () => {
        it('should call the right functions and make errorCounter = 0 when guessResult is correct', () => {
            const guessResult: GuessResult = { isCorrect: true, differencesByPlayer: [], differencePixelList: [], winnerName: 'winnerName' };
            component.updateDiffFound(guessResult);

            expect(audioServiceSpy.playAudio).toHaveBeenCalledWith('success');
            expect(component.errorCounter).toEqual(0);
        });
        it('should handle a wrong guess', () => {
            const guessResult: GuessResult = { isCorrect: false, differencesByPlayer: [], differencePixelList: [], winnerName: 'winnerName' };
            const handleErrorGuessSpy = spyOn(component, 'handleErrorGuess').and.callFake(() => {});
            component.updateDiffFound(guessResult);

            expect(audioServiceSpy.playAudio).not.toHaveBeenCalledWith('success');
            expect(handleErrorGuessSpy).toHaveBeenCalled();
        });
    });

    describe('receiveNewGame', () => {
        it('should call loadImage and setCanvasContext', async () => {
            const loadImageSpy = spyOn(component, 'loadImage' as any).and.callFake(() => {});
            await component.receiveNewGame(game);
            expect(loadImageSpy).toHaveBeenCalled();
            expect(imageOperationServiceSpy.setCanvasContext).toHaveBeenCalled();
        });

        it('should not call loadImage and setCanvasContext if game is invalid', async () => {
            const loadImageSpy = spyOn(component, 'loadImage' as any).and.callFake(() => {});
            await component.receiveNewGame(undefined as any);
            expect(loadImageSpy).not.toHaveBeenCalled();
            expect(imageOperationServiceSpy.setCanvasContext).not.toHaveBeenCalled();
        });
    });

    it('ngOnDestroy should call onDestroy', () => {
        spyOn(component, 'onDestroy').and.callFake(() => {});
        component.ngOnDestroy();
        expect(component.onDestroy).toHaveBeenCalled();
    });
});
