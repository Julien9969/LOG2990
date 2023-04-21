/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-with */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-vars */
/* eslint-disable max-classes-per-file */
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Clue } from '@common/clue';
import { Coordinate } from '@common/coordinate';
import { ReplayPageComponent } from './replay-page.component';
import { GameActionLoggingService } from '@app/services/game-action-logging/game-action-logging.service';
import { InGameService } from '@app/services/in-game/in-game.service';

@Component({
    selector: 'app-play-image-classic',
    template: '<img>',
})
export class StubPlayImageComponent {
    @Input() imageMainId!: string;
    @Input() imageAltId!: string;
    @Input() sessionID!: number;
    @Input() isSolo!: boolean;
    @Input() isReplayed: boolean;
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
    @Input() isReplayed: boolean;
}

fdescribe('GamePageComponent', () => {
    let component: ReplayPageComponent;
    let fixture: ComponentFixture<ReplayPageComponent>;
    let gameActionLoggingServiceSpy: jasmine.SpyObj<GameActionLoggingService>;
    let inGameServiceSpy: jasmine.SpyObj<InGameService>;

    beforeEach(async () => {
        inGameServiceSpy = jasmine.createSpyObj('inGameServiceMock', [
            'retrieveClue',
            'retrieveSocketId',
            'listenOpponentLeaves',
            'listenPlayerWon',
            'listenTimerUpdate',
            'listenProvideName',
            'playerExited',
            'disconnect',
            'socketService',
            'retrieveClue',
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
        gameActionLoggingServiceSpy = jasmine.createSpyObj('GameActionLoggingServiceMock', [
            'logAction',
            'setTimeZero',
            'getTimeSinceStart',
            'replayAction',
            'replayAllAction',
            'clearReplayAll',
            'replayActionsToTime',
        ]);

        gameActionLoggingServiceSpy.gameInfos = {
            name: 'true',
        } as any;

        TestBed.configureTestingModule({
            declarations: [ReplayPageComponent, StubPlayImageComponent, StubAppSidebarComponent],
            imports: [MatIconModule, MatToolbarModule],
            providers: [
                { provide: GameActionLoggingService, useValue: gameActionLoggingServiceSpy },
                { provide: InGameService, useValue: inGameServiceSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        window.history.pushState({ isSolo: true, gameId: '1', playerName: 'test', opponentName: 'test2', sessionId: 1 }, '', '');
        fixture = TestBed.createComponent(ReplayPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component['playImageComponent'] = {
            reset: async () => {},
            imageOperationService: {
                clearAllIntervals: () => {},
                cheatBlink: () => {},
                cheatInterval: 1,
            },
        } as any;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('resetAndReplay should call replay and setReplaySpeed', async () => {
        spyOn(component, 'setReplaySpeed').and.callThrough();
        spyOn(component, 'replay').and.callThrough();
        await component.resetAndReplay();
        expect(component.setReplaySpeed).toHaveBeenCalled();
        expect(component.replay).toHaveBeenCalled();
    });

    it('handleUnpause should set wasCheatBlinkingBeforePause to false', () => {
        component['wasCheatBlinkingBeforePause'] = true;
        component['loggingService'].speedMultiplier = 1;
        spyOn(component, 'setReplaySpeed').and.callThrough();
        component.handleUnpause();
        expect(component['wasCheatBlinkingBeforePause']).toEqual(false);
    });

    it('pause should call setReplaySpeed if speedMultiplier', () => {
        component['loggingService'].speedMultiplier = 0;
        spyOn(component, 'setReplaySpeed').and.callThrough();
        component.pause();
        expect(component.setReplaySpeed).toHaveBeenCalled();
    });

    it('pause should call setReplaySpeed if speedMultiplier is not 0', () => {
        component['loggingService'].speedMultiplier = 1;
        spyOn(component, 'setReplaySpeed').and.callThrough();
        component.pause();
        expect(component.setReplaySpeed).toHaveBeenCalled();
    });

    it('ngOndestroy should call disconnect', () => {
        component.ngOnDestroy();
        expect(inGameServiceSpy.disconnect).toHaveBeenCalled();
    });
});
