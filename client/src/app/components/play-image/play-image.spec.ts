/* eslint-disable max-lines, max-len */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-empty-function */
import { HttpResponse } from '@angular/common/http';
import { ElementRef } from '@angular/core';
import { PlayImage } from '@app/components/play-image/play-image';
import { AudioService } from '@app/services/audio/audio.service';
import { CommunicationService } from '@app/services/communication/communication.service';
import { ImageOperationService } from '@app/services/image-operation/image-operation.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { MouseService } from '@app/services/mouse/mouse.service';
import { of } from 'rxjs';

export class StubImage {
    src: string;
    crossOrigin: string;
    onload: GlobalEventHandlers['onload'];
}

describe('PlayImageComponent', () => {
    let component: PlayImage;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;
    let mouseServiceSpy: jasmine.SpyObj<MouseService>;
    let imageOperationServiceSpy: jasmine.SpyObj<ImageOperationService>;
    let audioServiceSpy: jasmine.SpyObj<AudioService>;
    let inGameServiceSpy: jasmine.SpyObj<InGameService>;
    let imageCanvas1: ElementRef<HTMLCanvasElement>;
    let imageCanvas2: ElementRef<HTMLCanvasElement>;

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
            'handleCheat',
        ]);

        imageCanvas1 = new ElementRef(document.createElement('canvas'));
        imageCanvas2 = new ElementRef(document.createElement('canvas'));
    });

    beforeEach(() => {
        component = new PlayImage(mouseServiceSpy, communicationServiceSpy, audioServiceSpy, imageOperationServiceSpy, inGameServiceSpy);
        component.imageCanvas1 = imageCanvas1;
        component.imageCanvas2 = imageCanvas2;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('get', () => {
        it('canvasContext1 should return canvas context', () => {
            expect(component.canvasContext1).toEqual(component.imageCanvas1.nativeElement.getContext('2d') as CanvasRenderingContext2D);
        });

        it('canvasContext2 should return canvas context', () => {
            expect(component.canvasContext2).toEqual(component.imageCanvas2.nativeElement.getContext('2d') as CanvasRenderingContext2D);
        });
    });

    it('AfterViewInit should call getContext and loadImage and imageOperationService.setCanvasContext', async () => {
        spyOn(component, 'loadImage').and.callFake(async () => {
            return Promise.resolve();
        });
        await component.afterViewInit();
        expect(component.loadImage).toHaveBeenCalledTimes(2);
        expect(imageOperationServiceSpy.setCanvasContext).toHaveBeenCalled();
    });

    it('handleCheat should call imageOperationService.handleCheat', async () => {
        imageOperationServiceSpy.handleCheat.and.returnValue(Promise.resolve());
        await component.handleCheat();
        expect(imageOperationServiceSpy.handleCheat).toHaveBeenCalled();
    });

    describe('handleErrorGuess', () => {
        it('handleErrorGuess should set errorMsgPosition, call errorTimer and increment errorCounter and set errorGuess to false after 1s', () => {
            jasmine.clock().install();
            component.errorCounter = 0;
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
            component.handleErrorGuess({ x: 0, y: 0 });
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

    it('OnDestroy should call imageOperationService.disableCheat', () => {
        component.onDestroy();
        expect(imageOperationServiceSpy.disableCheat).toHaveBeenCalled();
    });
});
