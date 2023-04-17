/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any -- Any utilisé pour créer notre propre mock */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { GameService } from '@app/services/game/game.service';
import { TimeConstantsComponent } from './time-constants.component';

describe('TimeConstantsComponent', () => {
    let component: TimeConstantsComponent;
    let fixture: ComponentFixture<TimeConstantsComponent>;
    let gameServiceMock: GameService;
    let gameServiceGetConstantsSpy: jasmine.Spy;
    let dialogMock: MatDialog;
    let mockPopup: PopupDialogComponent;

    beforeEach(async () => {
        gameServiceMock = {
            getGameConstants: async () => {
                return {};
            },
            updateGameConstants: async () => {},
            resetTimeConstants: async () => {},
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
            declarations: [TimeConstantsComponent],
            imports: [MatIconModule],
            providers: [
                { provide: GameService, useValue: gameServiceMock },
                { provide: MatDialog, useValue: dialogMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TimeConstantsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        gameServiceGetConstantsSpy = spyOn(gameServiceMock, 'getGameConstants').and.callFake(async () => {
            return {
                time: 10,
                penalty: 10,
                reward: 10,
            };
        });
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should get gameService constants', async () => {
        await component.ngOnInit();

        expect(gameServiceMock.getGameConstants).toHaveBeenCalled();
    });

    it('ngOnInit should set empty gameConstants when server returns undefined', async () => {
        gameServiceGetConstantsSpy.and.callFake(() => {
            return undefined;
        });

        component.gameConstants = {
            time: 1,
            reward: 1,
            penalty: 1,
        };

        await component.ngOnInit();
        expect(gameServiceGetConstantsSpy).toHaveBeenCalled();
        expect(component.gameConstants).toEqual({});
    });

    it('ngOnInit should set empty gameConstants when server throws', async () => {
        gameServiceGetConstantsSpy.and.callFake(() => {
            throw new Error();
        });

        component.gameConstants = {
            time: 1,
            reward: 1,
            penalty: 1,
        };

        await component.ngOnInit();
        expect(gameServiceGetConstantsSpy).toHaveBeenCalled();
        expect(component.gameConstants).toEqual({});
    });

    it('resetTimeConstants opens a popup dialog and sets callback to gameService resetTimeConstants', () => {
        const openDialogSpy = spyOn(dialogMock, 'open').and.callFake(() => {
            return { componentInstance: mockPopup } as any;
        });
        component.resetTimeConstants();

        expect(openDialogSpy).toHaveBeenCalled();
        expect(mockPopup.buttonCallback).toEqual(gameServiceMock.resetTimeConstants);
    });

    it('openEditPopup opens a TimeConstantsPopupComponent popup', () => {
        const openDialogSpy = spyOn(dialogMock, 'open').and.callFake(() => {
            return { componentInstance: mockPopup } as any;
        });
        component.openEditPopup();

        expect(openDialogSpy).toHaveBeenCalled();
    });
});
