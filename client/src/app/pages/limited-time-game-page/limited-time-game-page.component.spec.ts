/* eslint-disable max-lines, max-len */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-with */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-vars */
/* eslint-disable max-classes-per-file */
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { By } from '@angular/platform-browser';
import { PlayImageLimitedTimeComponent } from '@app/components/play-image/play-image-limited-time/play-image-limited-time.component';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
// import { PlayImageLimitedTimeComponent } from '@app/components/play-image/play-image-limited-time/play-image-limited-time.component';
import { LimitedTimeGamePageComponent } from '@app/pages/limited-time-game-page/limited-time-game-page.component';
// import { CommunicationService } from '@app/services/communication/communication.service';
import { GameService } from '@app/services/game/game.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { Coordinate } from '@common/coordinate';
// import { SocketClientService } from '@app/services/socket-client/socket-client.service';
// import { of } from 'rxjs';

@Component({
    selector: 'app-play-image-limited-time',
    template: '<img>',
})
export class StubPlayImageComponent {
    @Input() imageMainId!: string;
    @Input() imageAltId!: string;
    @Input() sessionID!: number;
    playerName: string;
    handleClue = (nbCluesLeft: number, coordinates: Coordinate[]) => {};
}

@Component({
    selector: 'app-sidebar',
    template: '<div></div>',
})
export class StubAppSidebarComponent {
    @Input()
    playerName: string;
    @Input()
    sessionID: number;
    @Input()
    isSolo: boolean;
}

describe('LimitedTimeGamePageComponent', () => {
    let component: LimitedTimeGamePageComponent;
    let fixture: ComponentFixture<LimitedTimeGamePageComponent>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let playImageComponentSpy: jasmine.SpyObj<StubPlayImageComponent>;
    // let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;
    // let socketServiceSpy: jasmine.SpyObj<SocketClientService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let inGameSocketSpy: jasmine.SpyObj<InGameService>;

    const game = {
        id: '1',
        name: 'testName',
        imageMain: 1,
        imageAlt: 1,
        scoreBoardSolo: [['Bob', 1]],
        scoreBoardMulti: [['Bob', 1]],
        isValid: false,
        isHard: false,
        differenceCount: 2,
        time: 0,
        penalty: 0,
        reward: 0,
    };

    const gameConstants = {
        time: 0,
        penalty: 0,
        reward: 0,
    };

    beforeEach(async () => {
        // socketServiceSpy = jasmine.createSpyObj('SocketClientService', ['send', 'on', 'sendAndCallBack', 'connect', 'isSocketAlive']);

        dialogSpy = jasmine.createSpyObj('DialogMock', ['open', 'closeAll']);

        gameServiceSpy = jasmine.createSpyObj('GameService', ['getGameById', 'getGameConstants']);
        inGameSocketSpy = jasmine.createSpyObj('InGameService', [
            'listenNewGame',
            'listenProvideName',
            'retrieveSocketId',
            'listenOpponentLeaves',
            'listenGameEnded',
            'listenTimerUpdate',
            'disconnect',
            'playerExited',
            'retrieveClue',
        ]);

        inGameSocketSpy.retrieveSocketId.and.returnValue(new Promise((resolve) => resolve('socketId')));

        gameServiceSpy.getGameConstants.and.returnValue(
            new Promise((resolve) => {
                resolve(gameConstants);
            }),
        );

        TestBed.configureTestingModule({
            declarations: [LimitedTimeGamePageComponent, StubPlayImageComponent, StubAppSidebarComponent],
            imports: [MatIconModule, MatToolbarModule],
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                // { provide: SocketClientService, useValue: socketServiceSpy },
                { provide: InGameService, useValue: inGameSocketSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: PlayImageLimitedTimeComponent, useValue: playImageComponentSpy },
            ],
        }).compileComponents();
    });

    beforeEach(async () => {
        window.history.pushState({ isSolo: true, gameID: 0, playerName: 'test', opponentName: 'test2', sessionId: 1 }, '', '');
        fixture = TestBed.createComponent(LimitedTimeGamePageComponent);
        fixture.detectChanges();
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('constructor should call not define opponentName if isSolo is true', () => {
        expect(component.opponentName).toBeUndefined();
    });

    it('constructor should define opponentName if isSolo is false', () => {
        window.history.pushState({ isSolo: false, gameID: 0, playerName: 'test', opponentName: 'test2', sessionId: 1 }, '', '');
        const newComponent = TestBed.createComponent(LimitedTimeGamePageComponent);
        expect(newComponent.componentInstance.opponentName).toBeDefined();
    });
    describe('onInit', () => {
        it('should listen listenNewGame that call a callback that set nDiffFound ', () => {
            const data = [game, 1];
            component.ngOnInit();
            expect(inGameSocketSpy.listenNewGame).toHaveBeenCalled();
            inGameSocketSpy.listenNewGame.calls.mostRecent().args[0](data as any);
            expect(component.nDiffFound).toEqual(1);
        });
        it('should call listenProvideName', () => {
            component.ngOnInit();
            expect(inGameSocketSpy.listenProvideName).toHaveBeenCalledWith(component.playerName);
        });
        it('should get the socketId', async () => {
            const socketId = 'socketId';
            await component.ngOnInit();
            expect(inGameSocketSpy.retrieveSocketId).toHaveBeenCalled();
            expect(component.userSocketId).toEqual(socketId);
        });
        it('should listen for opponent leaving should set isSolo to true', () => {
            component.ngOnInit();
            expect(inGameSocketSpy.listenOpponentLeaves).toHaveBeenCalled();
            inGameSocketSpy.listenOpponentLeaves.calls.mostRecent().args[0]();
            expect(component.isSolo).toEqual(true);
        });
        it('should listen listenGameEnded should call endGameDialog in callback', () => {
            component.ngOnInit();

            expect(inGameSocketSpy.listenGameEnded).toHaveBeenCalled();
            inGameSocketSpy.listenGameEnded.calls.mostRecent().args[0](false);
            expect(dialogSpy.open).toHaveBeenCalled();
        });
        it('should listen listenTimerUpdate that update time', () => {
            component.time = '31:12';
            component.ngOnInit();
            expect(inGameSocketSpy.listenTimerUpdate).toHaveBeenCalled();
            inGameSocketSpy.listenTimerUpdate.calls.mostRecent().args[0]('32:13');
            expect(component.time).toEqual('32:13');
        });
    });

    it('playerExited should call inGameSocket.playerExited', () => {
        component.playerExited();
        expect(inGameSocketSpy.playerExited).toHaveBeenCalled();
    });

    describe('handleClueRequest', () => {
        beforeEach(() => {
            component.nbCluesLeft = 3;
            inGameSocketSpy.retrieveClue.and.returnValue(new Promise((resolve) => resolve({ coordinates: [{ x: 2, y: 2 }], nbCluesLeft: 3 })));
        });

        it('should call retrieveClue', async () => {
            component.playImageComponent = new StubPlayImageComponent() as any;
            spyOn(component.playImageComponent, 'handleClue').and.returnValue(new Promise((resolve) => resolve()));
            component.handleClueRequest();
            expect(inGameSocketSpy.retrieveClue).toHaveBeenCalled();
            expect(component.nbCluesLeft).toEqual(3);
        });

        it('should not call retrieveClue when nbCluesLeft <= 0', () => {
            component.nbCluesLeft = 0;
            component.handleClueRequest();
            expect(inGameSocketSpy.retrieveClue).not.toHaveBeenCalled();
        });
    });

    describe('endGameDialog', () => {
        it('should set the message to "vous n avez plus de Temps..." if timerFinished is true', () => {
            component.endGameDialog(true);
            expect(dialogSpy.open).toHaveBeenCalledWith(PopupDialogComponent, {
                closeOnNavigation: true,
                disableClose: true,
                autoFocus: false,
                data: ['endGame', `Vous n'avez plus de temps, vous avez trouvé ${component.nDiffFound} différences`],
            });
        });
        it('should set the message to "Vous avez joué à tous..." if timerFinished is false', () => {
            component.endGameDialog(false);
            expect(dialogSpy.open).toHaveBeenCalledWith(PopupDialogComponent, {
                closeOnNavigation: true,
                disableClose: true,
                autoFocus: false,
                data: ['endGame', `Vous avez joué à tous les jeux, vous avez trouvé ${component.nDiffFound + 1} différences`],
            });
        });
    });

    it('quit button should open quit dialog', () => {
        const quitButton = fixture.debugElement.query(By.css('#quit-button'));
        quitButton.triggerEventHandler('click', null);
        expect(dialogSpy.open).toHaveBeenCalledWith(PopupDialogComponent, {
            closeOnNavigation: true,
            autoFocus: false,
            data: ['quit'],
        });
    });

    // Can't test by dispatching event because it will reload the page and make the test crash
    it('unloadNotification should set event.returnValue to true', () => {
        const event = new Event('beforeunload');
        component.unloadNotification(event);
        // eslint-disable-next-line deprecation/deprecation
        expect(event.returnValue).toEqual(true);
    });

    describe('openDialog', () => {
        it('openDialog with "quit" as argument call dialog.open with right args', () => {
            component.openDialog('quit');
            expect(dialogSpy.open).toHaveBeenCalledWith(PopupDialogComponent, { closeOnNavigation: true, autoFocus: false, data: ['quit'] });
        });
        it('openDialog with "opponentLeftGame" as argument call dialog.open with right args', () => {
            component.openDialog('opponentLeftGame');
            expect(dialogSpy.open).toHaveBeenCalledWith(PopupDialogComponent, {
                closeOnNavigation: true,
                disableClose: true,
                autoFocus: false,
                data: ['opponentLeft'],
            });
        });
    });
    it('ngOnDestroy should call playerExited and inGameSocket.disconnect', () => {
        spyOn(component, 'playerExited');
        component.ngOnDestroy();
        expect(component.playerExited).toHaveBeenCalled();
        expect(inGameSocketSpy.disconnect).toHaveBeenCalled();
    });
});
