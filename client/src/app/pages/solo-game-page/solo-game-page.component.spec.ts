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
import { PlayImageComponent } from '@app/components/play-image-limited-time/play-image-limited-time.component';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { CommunicationService } from '@app/services/communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { WinnerInfo } from '@common/winner-info';
import { of } from 'rxjs';
import { SoloGamePageComponent } from './solo-game-page.component';

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

describe('SoloGamePageComponent', () => {
    let component: SoloGamePageComponent;
    let fixture: ComponentFixture<SoloGamePageComponent>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let playImageComponentSpy: jasmine.SpyObj<StubPlayImageComponent>;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;
    let socketServiceSpy: jasmine.SpyObj<SocketClientService>;

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
                time: 0,
                penalty: 0,
                reward: 0,
            }),
        );
        socketServiceSpy = jasmine.createSpyObj('SocketClientService', ['send', 'on', 'sendAndCallBack', 'connect', 'isSocketAlive']);

        playImageComponentSpy = jasmine.createSpyObj('PlayImageComponentMock', ['playAudio']);
        dialogSpy = jasmine.createSpyObj('DialogMock', ['open', 'closeAll']);

        TestBed.configureTestingModule({
            declarations: [SoloGamePageComponent, StubPlayImageComponent, StubAppSidebarComponent],
            imports: [MatIconModule, MatToolbarModule],
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                { provide: PlayImageComponent, useValue: playImageComponentSpy },
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: SocketClientService, useValue: socketServiceSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        window.history.pushState({ isSolo: true, gameID: 0, playerName: 'test', opponentName: 'test2', sessionId: 1 }, '', '');
        fixture = TestBed.createComponent(SoloGamePageComponent);
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
        const newComponent = TestBed.createComponent(SoloGamePageComponent);
        expect(newComponent.componentInstance.opponentName).toBeDefined();
    });
    describe('onInit', () => {
        it('should call  getGameInfos, ', () => {
            spyOn(component['socket'], 'listenOpponentLeaves').and.callFake(() => {
                return;
            });
            component.sessionId = 123;
            component.gameID = '123';
            spyOn(component, 'getGameInfos');
            component.ngOnInit();
            expect(component.getGameInfos).toHaveBeenCalled();
            expect(component.gameInfos).toBeDefined();
        });
        it('should call listenProvideName', () => {
            const listenProvideNameSpy = spyOn(component['socket'], 'listenProvideName').and.callFake(() => {});
            component.ngOnInit();

            expect(listenProvideNameSpy).toHaveBeenCalledWith(component.playerName);
        });
        it('should get the socketId', fakeAsync(() => {
            const socketId = 'socketId';
            const socketRetrieveSocketIdSpy = spyOn(component['socket'], 'retrieveSocketId').and.callFake(async () => {
                return Promise.resolve(socketId);
            });
            component.ngOnInit();
            tick(3000);
            expect(socketRetrieveSocketIdSpy).toHaveBeenCalled();
            expect(component.userSocketId).toEqual(socketId);
            flush();
        }));
        it('should listen for opponent leaving', () => {
            const listenOpponentLeaves = spyOn(component['socket'], 'listenOpponentLeaves').and.callFake((callback: () => void) => {
                callback();
            });
            const openDialogSpy = spyOn(component, 'openDialog').and.callFake(() => {});
            component.ngOnInit();

            expect(listenOpponentLeaves).toHaveBeenCalled();
            expect(openDialogSpy).toHaveBeenCalled();
        });
        it('should listen for a player winning', () => {
            const listenPlayerWonSpy = spyOn(component['socket'], 'listenPlayerWon').and.callFake((callback: (winnerInfo: WinnerInfo) => void) => {
                callback({ name: 'name', socketId: 'socketId' });
            });
            const endGameDialogSpy = spyOn(component, 'endGameDialog').and.callFake(() => {});
            component.ngOnInit();

            expect(listenPlayerWonSpy).toHaveBeenCalled();
            expect(endGameDialogSpy).toHaveBeenCalledWith({ name: 'name', socketId: 'socketId' });
        });
        it('should listen for time update', () => {
            const listenTimerUpdateSpy = spyOn(component['socket'], 'listenTimerUpdate').and.callFake((callback: (time: string) => void) => {
                callback('35:12');
            });
            component.time = '31:12';
            component.ngOnInit();

            expect(listenTimerUpdateSpy).toHaveBeenCalled();
            expect(component.time).toEqual('35:12');
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
            time: 0,
            penalty: 0,
            reward: 0,
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

    it('clue button should open clue dialog', () => {
        const clueButton = fixture.debugElement.query(By.css('#clue-button'));
        clueButton.triggerEventHandler('click', null);
        expect(dialogSpy.open).toHaveBeenCalledWith(PopupDialogComponent, {
            closeOnNavigation: true,
            autoFocus: false,
            data: ['clue'],
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
        it('openDialog with "clue" as argument call dialog.open with right args', () => {
            component.openDialog('clue');
            expect(dialogSpy.open).toHaveBeenCalledWith(PopupDialogComponent, { closeOnNavigation: true, autoFocus: false, data: ['clue'] });
        });

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
    it('ngOnDestroy should call socketClientService with leaveRoom', () => {
        socketServiceSpy.send.and.callFake(<T>() => {});
        component.ngOnDestroy();
        expect(socketServiceSpy.send).toHaveBeenCalledWith('leaveRoom');
    });
});
