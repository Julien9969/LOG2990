import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { PlayImage } from '@app/components/play-image/play-image';
import { AudioService } from '@app/services/audio/audio.service';
import { CommunicationService } from '@app/services/communication/communication.service';
import { ImageOperationService } from '@app/services/image-operation/image-operation.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { MouseService } from '@app/services/mouse/mouse.service';
import { Coordinate } from '@common/coordinate';
import { GuessResult } from '@common/guess-result';

@Component({
    selector: 'app-play-image-classic',
    templateUrl: '../play-image.component.html',
    styleUrls: ['../play-image.component.scss'],
})
export class PlayImageClassicComponent extends PlayImage implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild('canvas1', { static: false }) imageCanvas1!: ElementRef<HTMLCanvasElement>;
    @ViewChild('canvas2', { static: false }) imageCanvas2!: ElementRef<HTMLCanvasElement>;

    @Input() sessionID!: number;
    @Input() imageMainId!: number;
    @Input() imageAltId!: number;
    @Input() isSolo: boolean;

    @Output() diffFoundUpdate: EventEmitter<[string, number][]> = new EventEmitter<[string, number][]>();

    errorMsgPosition: Coordinate;
    errorCounter: number = 0;
    lastDifferenceFound: GuessResult = {
        isCorrect: false,
        differencesByPlayer: [],
        differencePixelList: [{ x: 0, y: 0 }],
        winnerName: undefined,
    };

    // eslint-disable-next-line max-params -- necéssaire pour le fonctionnement
    constructor(
        protected readonly mouseService: MouseService,
        protected readonly communicationService: CommunicationService,
        protected readonly audioService: AudioService,
        protected readonly imageOperationService: ImageOperationService,
        protected readonly socket: InGameService,
    ) {
        super(mouseService, communicationService, audioService, imageOperationService, socket);
    }

    @HostListener('window:keydown.t', ['$event'])
    async handleCheat() {
        await this.imageOperationService.handleCheat(this.sessionID);
    }

    ngOnInit(): void {
        this.errorCounter = 0;
        this.lastDifferenceFound = {
            isCorrect: false,
            differencesByPlayer: [],
            differencePixelList: [{ x: 0, y: 0 }],
            winnerName: undefined,
        };
        this.socket.listenDifferenceFound((differenceFound: GuessResult) => {
            this.updateDiffFound(differenceFound);
        });
    }
    sendPosition(event: MouseEvent): void {
        this.mouseService.clickProcessing(event);
        if (this.isSolo) {
            this.socket
                .submitCoordinatesSolo(this.sessionID, this.mouseService.mousePosition)
                .then((response: GuessResult) => {
                    this.updateDiffFound(response);
                })
                .catch((e) => {
                    alert(e.message);
                });
        } else {
            this.socket.submitCoordinatesMulti(this.sessionID, this.mouseService.mousePosition);
        }
    }

    /**
     * Met a jours les scores lorsque l'utilisateur locale trouve une différence
     *
     * @param guessResult résultat du serveur après avoir demander de valider les coordonnés de la différence trouvé
     */
    updateDiffFound(guessResult: GuessResult): void {
        if (guessResult.isCorrect && this.hasNbDifferencesChanged(guessResult.differencesByPlayer)) {
            this.lastDifferenceFound = guessResult;
            this.audioService.playAudio('success');
            this.diffFoundUpdate.emit(this.lastDifferenceFound.differencesByPlayer);
            this.errorCounter = 0;
            this.imageOperationService.pixelBlink(guessResult.differencePixelList);
        } else {
            this.handleErrorGuess();
        }
    }

    hasNbDifferencesChanged(differencesByPlayer: [userSocketId: string, nDifferences: number][]): boolean {
        if (this.lastDifferenceFound.differencesByPlayer.length < differencesByPlayer.length) {
            return true;
        }
        if (this.lastDifferenceFound.differencesByPlayer.length === differencesByPlayer.length) {
            for (let i = 0; i < differencesByPlayer.length; i++) {
                if (this.lastDifferenceFound.differencesByPlayer[i][1] !== differencesByPlayer[i][1]) {
                    return true;
                }
            }
        }
        return false;
    }

    ngAfterViewInit(): void {
        this.afterViewInit();
    }

    ngOnDestroy(): void {
        this.onDestroy();
    }
}
