/* eslint-disable @typescript-eslint/no-empty-function */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { GameService } from '@app/services/game/game.service';
import { PopupDialogComponent } from '../popup-dialog/popup-dialog.component';
import { DataResetComponent } from './data-reset.component';

describe('DataResetComponent', () => {
    let component: DataResetComponent;
    let fixture: ComponentFixture<DataResetComponent>;
    let gameServiceMock: GameService;
    let dialogMock: MatDialog;
    let mockPopup: PopupDialogComponent;

    beforeEach(async () => {
        gameServiceMock = {
            deleteAllGames: async () => {
                return {};
            },
            resetAllLeaderboards: async () => {},
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Any utilisé pour créer notre propre mock
        } as any;

        mockPopup = {} as PopupDialogComponent;
        dialogMock = {
            open: (component, action) => { 
                return {
                    componentInstance: mockPopup
                } as any;
            },
            closeAll: () => {},
        } as MatDialog;

        await TestBed.configureTestingModule({
            declarations: [DataResetComponent],
            imports: [MatIconModule],
            providers: [{ provide: GameService, useValue: gameServiceMock }, { provide: MatDialog, useValue: dialogMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(DataResetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('deleteAllGames opens a popup dialog and sets callback to gameService deleteAllGames', () => {
        const openDialogSpy = spyOn(dialogMock, 'open').and.callFake(() => {
            return {componentInstance: mockPopup} as any;
        });
        component.deleteAllGames();

        expect(openDialogSpy).toHaveBeenCalled();
        expect(mockPopup.buttonCallback).toEqual(gameServiceMock.deleteAllGames);
    });

    it('resetAllLeaderboards opens a popup dialog and sets callback to gameService resetAllLeaderboards', () => {
        const openDialogSpy = spyOn(dialogMock, 'open').and.callFake(() => {
            return {componentInstance: mockPopup} as any;
        });
        component.resetAllLeaderboards();

        expect(openDialogSpy).toHaveBeenCalled();
        expect(mockPopup.buttonCallback).toEqual(gameServiceMock.resetAllLeaderboards);
    });

});
