/* eslint-disable max-lines */
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
import { PlayImageClassicComponent } from '@app/components/play-image-classic/play-image-classic.component';
import { PlayImageLimitedTimeComponent } from '@app/components/play-image-limited-time/play-image-limited-time.component';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { CommunicationService } from '@app/services/communication/communication.service';
import { GameService } from '@app/services/game/game.service';
import { HistoryService } from '@app/services/history.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { Clue } from '@common/clue';
import { GameConstants } from '@common/game-constants';
import { of } from 'rxjs';
import { ReplayPageComponent } from './replay-page.component';

@Component({
    selector: 'app-play-image',
    template: '<img>',
})
export class StubPlayImageComponent {
    @Input() imageMainId!: string;
    @Input() imageAltId!: string;
    @Input() sessionID!: number;
    playerName: string;
    handleClue() {}
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

describe('ReplayPageComponent', () => {
    let component: ReplayPageComponent;
    let fixture: ComponentFixture<ReplayPageComponent>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let playImageComponentSpy: jasmine.SpyObj<StubPlayImageComponent>;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;
    let inGameServiceSpy: jasmine.SpyObj<InGameService>;
    let socketClientServiceSpy: jasmine.SpyObj<SocketClientService>;
    let historyServiceSpy: jasmine.SpyObj<HistoryService>;
    let gameService: jasmine.SpyObj<GameService>;

    beforeEach(async () => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationServiceMock', ['gameInfoGet', 'customGet', 'getGameConstants']);
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
        gameService = jasmine.createSpyObj('gameServiceSpy', ['getGameConstants']);
        gameService.getGameConstants.and.returnValue(
            Promise.resolve({
                time: 100,
                penalty: 5,
                reward: 5,
            } as GameConstants),
        );
        dialogSpy = jasmine.createSpyObj('DialogMock', ['open', 'closeAll']);

        TestBed.configureTestingModule({
            declarations: [ReplayPageComponent, StubPlayImageComponent, StubAppSidebarComponent],
            imports: [MatIconModule, MatToolbarModule],
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                { provide: PlayImageLimitedTimeComponent, useValue: playImageComponentSpy },
                { provide: PlayImageClassicComponent, useValue: playImageComponentSpy },
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: InGameService, useValue: inGameServiceSpy },
                { provide: SocketClientService, useValue: socketClientServiceSpy },
                { provide: HistoryService, useValue: historyServiceSpy },
                { provide: GameService, useValue: gameService },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        window.history.pushState({ isSolo: true, gameID: 0, playerName: 'test', opponentName: 'test2', sessionId: 1 }, '', '');
        fixture = TestBed.createComponent(ReplayPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    fdescribe('onInit', () => {
        it('should call  getGameInfos, ', () => {
            component.sessionId = 123;
            component.gameId = '123';
            spyOn(component, 'getGameInfos');
            component.ngOnInit();
            expect(component.getGameInfos).toHaveBeenCalled();
            expect(component.gameInfos).toBeDefined();
        });
    });

    fit('getGameInfos should call communicationService.gameInfoGet and set the gameInfos attribute', () => {
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

    fdescribe('openDialog', () => {
        it('openDialog with "quit" as argument call dialog.open with right args', () => {
            component.openDialog('quit');
            expect(dialogSpy.open).toHaveBeenCalledWith(PopupDialogComponent, { closeOnNavigation: true, autoFocus: false, data: ['quit'] });
        });
    });

    it('ngOnDestroy should call InGameService with disconnect', () => {
        component.ngOnDestroy();
        expect(inGameServiceSpy).toHaveBeenCalledWith('disconnect');
    });
});
