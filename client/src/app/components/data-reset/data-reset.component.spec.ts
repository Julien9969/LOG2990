/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any -- Any utilisé pour créer notre propre mock */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { GameService } from '@app/services/game/game.service';
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
        } as any;

        mockPopup = {} as PopupDialogComponent;
        dialogMock = {
            // eslint-disable-next-line no-unused-vars -- Le parametere est necessaire pour coller au typage de la fonction
            open: (comp, action) => {
                return {
                    componentInstance: mockPopup,
                } as any;
            },
            closeAll: () => {},
        } as MatDialog;

        await TestBed.configureTestingModule({
            declarations: [DataResetComponent],
            imports: [MatIconModule],
            providers: [
                { provide: GameService, useValue: gameServiceMock },
                { provide: MatDialog, useValue: dialogMock },
            ],
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
            return { componentInstance: mockPopup } as any;
        });
        component.deleteAllGames();

        expect(openDialogSpy).toHaveBeenCalled();
        expect(mockPopup.buttonCallback).toEqual(gameServiceMock.deleteAllGames);
    });

    it('resetAllLeaderboards opens a popup dialog and sets callback to gameService resetAllLeaderboards', () => {
        const openDialogSpy = spyOn(dialogMock, 'open').and.callFake(() => {
            return { componentInstance: mockPopup } as any;
        });
        component.resetAllLeaderboards();

        expect(openDialogSpy).toHaveBeenCalled();
        expect(mockPopup.buttonCallback).toEqual(gameServiceMock.resetAllLeaderboards);
    });
});
