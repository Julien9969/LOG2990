/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-vars */
/* eslint-disable max-classes-per-file */
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { By } from '@angular/platform-browser';
import { PlayImageComponent } from '@app/components/play-image/play-image.component';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { CommunicationService } from '@app/services/communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Timer } from '@app/services/timer.service';
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
export class StubAppSidebarComponent {}

describe('SoloGamePageComponent', () => {
    let component: SoloGamePageComponent;
    let fixture: ComponentFixture<SoloGamePageComponent>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let playImageComponentSpy: jasmine.SpyObj<StubPlayImageComponent>;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;
    let timerSpy: jasmine.SpyObj<Timer>;
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
        timerSpy = jasmine.createSpyObj('TimerMock', ['stopGameTimer', 'startGameTimer']);
        dialogSpy = jasmine.createSpyObj('DialogMock', ['open', 'closeAll']);

        TestBed.configureTestingModule({
            declarations: [SoloGamePageComponent, StubPlayImageComponent, StubAppSidebarComponent],
            imports: [MatIconModule, MatToolbarModule],
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                { provide: PlayImageComponent, useValue: playImageComponentSpy },
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: Timer, useValue: timerSpy },
                { provide: SocketClientService, useValue: socketServiceSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        window.history.pushState({ isSolo: true, gameID: 0, playerName: 'test', opponentName: 'test2', sessionId: 1 }, '', '');
        fixture = TestBed.createComponent(SoloGamePageComponent);
        component = fixture.componentInstance;
        component['timer'] = timerSpy;
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

    it('onInit should call getGameInfo and startTimer', () => {
        spyOn(component, 'getGameInfos');
        component.ngOnInit();
        expect(component.getGameInfos).toHaveBeenCalled();
        expect(component.gameInfos).toBeDefined();
        expect(component['timer'].startGameTimer).toHaveBeenCalled();
    });

    it('getTimer should return a defined Timer', () => {
        expect(component.getTimer).toBeDefined();
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

    // it('incrementDiff should increment nDiffFound ', () => {
    //     component.incrementDiff();
    //     expect(component.nDiffFound).toEqual(1);
    //     component.incrementDiff();
    //     expect(component.nDiffFound).toEqual(2);
    // });

    // it('incrementDiff open the endGame dialog if all differences were found', () => {
    //     component.gameInfos.differenceCount = 7;
    //     component.nDiffFound = 7;
    //     component.incrementDiff();
    //     expect(dialogSpy.open).toHaveBeenCalledWith(PopupDialogComponent, {
    //         closeOnNavigation: true,
    //         disableClose: true,
    //         autoFocus: false,
    //         data: 'endGame',
    //     });
    // });

    it('openDialog with "clue" as argument call dialog.open with right args', () => {
        component.openDialog('clue');
        expect(dialogSpy.open).toHaveBeenCalledWith(PopupDialogComponent, { closeOnNavigation: true, autoFocus: false, data: ['clue'] });
    });

    it('openDialog with "quit" as argument call dialog.open with right args', () => {
        component.openDialog('quit');
        expect(dialogSpy.open).toHaveBeenCalledWith(PopupDialogComponent, { closeOnNavigation: true, autoFocus: false, data: ['quit'] });
    });

    it('openDialog with "endGame" as argument call dialog.open with right args', () => {
        component.openDialog('endGame');
        expect(dialogSpy.open).toHaveBeenCalledWith(PopupDialogComponent, {
            closeOnNavigation: true,
            disableClose: true,
            autoFocus: false,
            data: ['endGame'],
        });
    });

    it('ngOnDestroy should call socketClientService with leaveRoom', () => {
        socketServiceSpy.send.and.callFake(<T>() => {});
        component.ngOnDestroy();
        expect(socketServiceSpy.send).toHaveBeenCalledWith('leaveRoom');
    });
});
