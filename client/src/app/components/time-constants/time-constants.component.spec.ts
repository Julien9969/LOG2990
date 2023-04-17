/* eslint-disable @typescript-eslint/no-empty-function */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { GameService } from '@app/services/game/game.service';
import { MAX_GAME_TIME, MAX_PENALTY_TIME, MAX_REWARD_TIME, MIN_GAME_TIME, MIN_PENALTY_TIME, MIN_REWARD_TIME } from '@common/game-constants-values';
import { PopupDialogComponent } from '../popup-dialog/popup-dialog.component';
import { TimeConstantsComponent } from './time-constants.component';

describe('TimeConstantsComponent', () => {
    let component: TimeConstantsComponent;
    let fixture: ComponentFixture<TimeConstantsComponent>;
    let gameServiceMock: GameService;
    let gameServiceGetConstantsSpy: jasmine.Spy;
    let gameServiceUpdateConstantsSpy: jasmine.Spy;
    let dialogMock: MatDialog;
    let mockPopup: PopupDialogComponent;

    beforeEach(async () => {
        gameServiceMock = {
            getGameConstants: async () => {
                return {};
            },
            updateGameConstants: async () => {},
            resetTimeConstants: async () => {},
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
            declarations: [TimeConstantsComponent],
            imports: [MatIconModule],
            providers: [{ provide: GameService, useValue: gameServiceMock }, { provide: MatDialog, useValue: dialogMock }],
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
        gameServiceUpdateConstantsSpy = spyOn(gameServiceMock, 'updateGameConstants').and.callFake(async () => {});
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should get gameService constants', async () => {
        await component.ngOnInit();

        expect(gameServiceMock.getGameConstants).toHaveBeenCalled();
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

    it('openEditPopup sets editingConstants to true', async () => {
        await component.openEditPopup();

        expect(component.editingConstants).toBeTrue();
    });

    it('cancelConstantsEdit sets editingConstants to false', async () => {
        await component.cancelConstantsEdit();

        expect(component.editingConstants).toBeFalse();
    });

    it('timeConstantBounds returns all constants', () => {
        expect(Object.values(component.timeConstantBounds)).toEqual([
            MIN_GAME_TIME,
            MAX_GAME_TIME,
            MIN_PENALTY_TIME,
            MAX_PENALTY_TIME,
            MIN_REWARD_TIME,
            MAX_REWARD_TIME,
        ]);
    });

    describe('validateGameConstants', () => {
        it('checks if formControls have no error', () => {
            const formControlIsValidSpy = spyOn(component, 'formControlIsValid').and.callFake(() => true);

            expect(component.validateGameConstants()).toBeTrue();

            formControlIsValidSpy.and.callFake(() => false);
            expect(component.validateGameConstants()).toBeFalse();
        });
    });

    describe('formControlIsValid', () => {
        it('checks if pattern, min and max validators have no error', () => {
            const stubFormControl: FormControl = {
                // eslint-disable-next-line no-unused-vars -- Le parametere est necessaire pour coller au typage de la fonction
                hasError: (code: string) => false,
            } as FormControl;
            const hasErrorSpy = spyOn(stubFormControl, 'hasError');

            const result = component.formControlIsValid(stubFormControl);

            expect(result).toEqual(true);

            expect(hasErrorSpy).toHaveBeenCalledTimes(3);
            expect(hasErrorSpy).toHaveBeenCalledWith('pattern');
            expect(hasErrorSpy).toHaveBeenCalledWith('min');
            expect(hasErrorSpy).toHaveBeenCalledWith('max');
        });
    });

    describe('updateGameConstants', () => {
        it('calls gameService updateGameConstants with updatedConstants when present', () => {
            spyOn(component, 'validateGameConstants').and.callFake(() => true);
            component.gameConstants = {
                time: undefined,
                penalty: undefined,
                reward: undefined,
            };

            component.modifiedGameConstants = {
                time: 100,
                penalty: 10,
                reward: 10,
            };

            component.updateGameConstants();

            expect(gameServiceUpdateConstantsSpy).toHaveBeenCalledWith(component.modifiedGameConstants);
        });

        it('does not call gameService when invalid constants', () => {
            spyOn(component, 'validateGameConstants').and.callFake(() => false);

            component.updateGameConstants();

            expect(gameServiceUpdateConstantsSpy).not.toHaveBeenCalled();
        });
    });

    it('convertToNumber wraps around basic Number()', () => {
        expect(component.convertToNumber('0')).toEqual(Number('0'));
        expect(component.convertToNumber('0')).toEqual(0);
        expect(component.convertToNumber('1')).toEqual(Number('1'));
        expect(component.convertToNumber('1')).toEqual(1);
        expect(component.convertToNumber('a')).toEqual(Number('a'));
    });

    it('convertToNumber returns undefined when empty input', () => {
        expect(component.convertToNumber('')).toEqual(undefined);
    });

    it('resetTimeConstants opens a popup dialog and sets callback to gameService resetTimeConstants', () => {
        const openDialogSpy = spyOn(dialogMock, 'open').and.callFake(() => {
            return {componentInstance: mockPopup} as any;
        });
        component.resetTimeConstants();

        expect(openDialogSpy).toHaveBeenCalled();
        expect(mockPopup.buttonCallback).toEqual(gameServiceMock.resetTimeConstants);
    });
});
