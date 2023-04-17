/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-with */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-vars */
/* eslint-disable max-classes-per-file */
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { By } from '@angular/platform-browser';
import { PlayImageClassicComponent } from '@app/components/play-image/play-image-classic/play-image-classic.component';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { CommunicationService } from '@app/services/communication/communication.service';
import { HistoryService } from '@app/services/history.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { Clue } from '@common/clue';
import { WinnerInfo } from '@common/winner-info';
import { of } from 'rxjs';
import { GamePageComponent } from './game-page.component';

@Component({
    selector: 'app-play-image',
    template: '<img>',
})
export class StubPlayImageComponent {
    @Input() imageMainId!: string;
    @Input() imageAltId!: string;
    @Input() sessionID!: number;
    playerName: string;
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

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let playImageComponentSpy: jasmine.SpyObj<StubPlayImageComponent>;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;
    let inGameServiceSpy: jasmine.SpyObj<InGameService>;
    let socketClientServiceSpy: jasmine.SpyObj<SocketClientService>;
    let historyServiceSpy: jasmine.SpyObj<HistoryService>;

    beforeEach(async () => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationServiceMock', ['gameInfoGet', 'customGet']);
        communicationServiceSpy.gameInfoGet.and.returnValue(
            of({
                id: '1',
                name: 'testName',
                imageMain: 1,
                imageAlt: 1,
                scoreBoardSolo: [['Bob', 1]],
                scoreBoardMulti: [['Bob', 1]],
                isValid: false,
                isHard: false,
                differenceCount: 2,
            }),
        );
        inGameServiceSpy = jasmine.createSpyObj('inGameService', [
            'retrieveClue',
            'retrieveSocketId',
            'listenOpponentLeaves',
            'listenPlayerWon',
            'listenTimerUpdate',
            'listenProvideName',
            'playerExited',
            'disconnect',
            'socketService',
        ]);
        inGameServiceSpy.retrieveSocketId.and.callFake(async () => {
            return Promise.resolve('socketId');
        });
        inGameServiceSpy.retrieveClue.and.callFake(async () => {
            return Promise.resolve({
                coordinates: [{ x: 0, y: 0 }],
                nbCluesLeft: 0,
            } as Clue);
        });

        socketClientServiceSpy = jasmine.createSpyObj('SocketClientMock', ['send']);
        historyServiceSpy = jasmine.createSpyObj('historyServiceSpy', ['initHistory', 'setGameMode', 'setPlayers', 'playerWon', 'playerQuit']);

        playImageComponentSpy = jasmine.createSpyObj('PlayImageComponentMock', ['playAudio']);
        dialogSpy = jasmine.createSpyObj('DialogMock', ['open', 'closeAll']);

        TestBed.configureTestingModule({
            declarations: [GamePageComponent, StubPlayImageComponent, StubAppSidebarComponent],
            imports: [MatIconModule, MatToolbarModule],
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                { provide: PlayImageClassicComponent, useValue: playImageComponentSpy },
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: InGameService, useValue: inGameServiceSpy },
                { provide: SocketClientService, useValue: socketClientServiceSpy },
                { provide: HistoryService, useValue: historyServiceSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        window.history.pushState({ isSolo: true, gameID: 0, playerName: 'test', opponentName: 'test2', sessionId: 1 }, '', '');
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('constructor should call not define opponentName if isSolo is true', () => {
        expect(component.opponentName).toBeUndefined();
    });

    it('constructor should define opponentName if isSolo is false', () => {
        window.history.pushState({ isSolo: false, gameID: 0, playerName: 'test', opponentName: 'test2', sessionId: 1 }, '', '');
        const newComponent = TestBed.createComponent(GamePageComponent);
        expect(newComponent.componentInstance.opponentName).toBeDefined();
    });

    describe('onInit', () => {
        it('should call  getGameInfos, ', () => {
            component.sessionId = 123;
            component.gameID = '123';
            spyOn(component, 'getGameInfos');
            component.ngOnInit();
            expect(component.getGameInfos).toHaveBeenCalled();
            expect(component.gameInfos).toBeDefined();
        });

        it('should call listenProvideName', () => {
            component.ngOnInit();
            expect(inGameServiceSpy.listenProvideName).toHaveBeenCalledWith(component.playerName);
        });

        it('should get the socketId', fakeAsync(() => {
            const socketId = 'socketId';
            inGameServiceSpy.retrieveSocketId.and.returnValue(Promise.resolve(socketId));
            component.ngOnInit();
            tick(3000);
            expect(inGameServiceSpy.retrieveSocketId).toHaveBeenCalled();
            expect(component.userSocketId).toEqual(socketId);
            flush();
        }));

        it('should listen for opponent leaving', () => {
            inGameServiceSpy.listenOpponentLeaves.and.callFake((callback: () => void) => {
                callback();
            });
            const openDialogSpy = spyOn(component, 'openDialog').and.callFake(() => {});
            component.ngOnInit();

            expect(inGameServiceSpy.listenOpponentLeaves).toHaveBeenCalled();
            expect(openDialogSpy).toHaveBeenCalled();
        });

        it('should listen for a player winning', () => {
            inGameServiceSpy.listenPlayerWon.and.callFake((callback: (winnerInfo: WinnerInfo) => void) => {
                callback({ name: 'name', socketId: 'socketId' });
            });
            const endGameDialogSpy = spyOn(component, 'endGameDialog').and.callFake(() => {});
            component.ngOnInit();

            expect(inGameServiceSpy.listenPlayerWon).toHaveBeenCalled();
            expect(endGameDialogSpy).toHaveBeenCalledWith({ name: 'name', socketId: 'socketId' });
        });

        it('should listen for time update', () => {
            inGameServiceSpy.listenTimerUpdate.and.callFake((callback: (time: string) => void) => {
                callback('35:12');
            });
            component.time = '31:12';
            component.ngOnInit();

            expect(inGameServiceSpy.listenTimerUpdate).toHaveBeenCalled();
            expect(component.time).toEqual('35:12');
        });
        it('should call initHistory', () => {
            component.ngOnInit();
            expect(historyServiceSpy.initHistory).toHaveBeenCalled();
        });
    });

    describe('handleDiffFoundUpdate', () => {
        it('solo: should give the right value to n.DiffFoundMainPlayer', () => {
            const diffFound: [string, number][] = [['socketId', 2]];
            component.isSolo = true;
            component.nDiffFoundMainPlayer = 0;
            component.handleDiffFoundUpdate(diffFound);
            expect(component.nDiffFoundMainPlayer).toEqual(2);
        });
        it('multi: should give the right value to n.DiffFoundMainPlayer', () => {
            const diffFound: [string, number][] = [
                ['socketId', 2],
                ['socketId2', 3],
            ];
            component.userSocketId = 'socketId2';
            component.isSolo = false;
            component.nDiffFoundMainPlayer = 0;
            component.handleDiffFoundUpdate(diffFound);
            expect(component.nDiffFoundMainPlayer).toEqual(3);
            expect(component.nDiffFoundOpponent).toEqual(2);
        });
    });

    describe('endGameDialog', () => {
        it('solo: when this client is the winner should give the winner s message', () => {
            const winnerInfo: WinnerInfo = { name: 'name', socketId: 'socketId' };
            component.userSocketId = 'socketId';
            component.time = '9:14';
            component.isSolo = true;

            component.endGameDialog(winnerInfo);
            expect(dialogSpy.open).toHaveBeenCalledWith(PopupDialogComponent, {
                closeOnNavigation: true,
                disableClose: true,
                autoFocus: false,
                data: ['endGame', `Bravo! Vous avez gagné avec un temps de ${component.time}`],
            });
        });
        it('multi: when this client is the winner should give the winner s message', () => {
            const winnerInfo: WinnerInfo = { name: 'name', socketId: 'socketId' };
            component.userSocketId = 'socketId';
            component.time = '9:14';
            component.isSolo = false;

            component.endGameDialog(winnerInfo);
            expect(dialogSpy.open).toHaveBeenCalledWith(PopupDialogComponent, {
                closeOnNavigation: true,
                disableClose: true,
                autoFocus: false,
                data: ['endGame', `Vous avez gagné, ${winnerInfo.name} est le vainqueur`],
            });
        });
        it('multi: when this client is the loser should give the loser s message', () => {
            const winnerInfo: WinnerInfo = { name: 'name', socketId: 'socketId2' };
            component.userSocketId = 'socketId';
            component.time = '9:14';
            component.isSolo = false;

            component.endGameDialog(winnerInfo);
            expect(dialogSpy.open).toHaveBeenCalledWith(PopupDialogComponent, {
                closeOnNavigation: true,
                disableClose: true,
                autoFocus: false,
                data: ['endGame', `Vous avez perdu, ${winnerInfo.name} remporte la victoire`],
            });
        });

        it('should call history.playerWon if client is winner', () => {
            const winnerInfo: WinnerInfo = { name: 'name', socketId: 'socketId' };
            component.userSocketId = 'socketId';
            component.time = '9:14';
            component.isSolo = true;

            component.endGameDialog(winnerInfo);
            expect(historyServiceSpy.playerWon).toHaveBeenCalledWith('9:14');
        });
    });

    it('getGameInfos should call communicationService.gameInfoGet and set the gameInfos attribute', () => {
        component.getGameInfos();
        expect(communicationServiceSpy.gameInfoGet).toHaveBeenCalled();
        expect(component.gameInfos).toEqual({
            id: '1',
            name: 'testName',
            imageMain: 1,
            imageAlt: 1,
            scoreBoardSolo: [['Bob', 1]],
            scoreBoardMulti: [['Bob', 1]],
            isValid: false,
            isHard: false,
            differenceCount: 2,
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
    it('unloadHandler should set event.returnValue to true', () => {
        const event = new Event('beforeunload');
        component.unloadHandler(event);
        // eslint-disable-next-line deprecation/deprecation
        expect(event.returnValue).toEqual(true);
    });

    describe('handleClueRequest', () => {
        beforeEach(() => {
            component.nbCluesLeft = 3;
        });

        it('should call retrieveClue', async () => {
            await component.handleClueRequest();
            expect(inGameServiceSpy.retrieveClue).toHaveBeenCalled();
            expect(component.nbCluesLeft).toEqual(0);
        });

        it('should not call retrieveClue when nbCluesLeft <= 0', () => {
            component.nbCluesLeft = 0;
            component.handleClueRequest();
            expect(inGameServiceSpy.retrieveClue).not.toHaveBeenCalled();
        });
    });

    it('unloadHandler should call historyService.playerQuit is in solo and game not over', () => {
        const event = new Event('beforeunload');
        component.isSolo = true;
        component.unloadHandler(event);
        expect(historyServiceSpy.playerQuit).toHaveBeenCalled();
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

    it('initHistory should call historyService.initHistory , setPlayer and set gameMode', () => {
        component['initHistory']();
        expect(historyServiceSpy.initHistory).toHaveBeenCalled();
        expect(historyServiceSpy.setPlayers).toHaveBeenCalled();
        expect(historyServiceSpy.setGameMode).toHaveBeenCalled();
    });

    it('ngOnDestroy should call socketClientService with leaveRoom', () => {
        component.ngOnDestroy();
        expect(socketClientServiceSpy.send).toHaveBeenCalledWith('leaveRoom');
    });
});
