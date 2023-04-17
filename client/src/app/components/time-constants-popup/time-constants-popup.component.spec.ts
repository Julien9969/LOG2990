/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any -- Any utilisé pour créer notre propre mock */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { GameService } from '@app/services/game/game.service';
import { MAX_GAME_TIME, MAX_PENALTY_TIME, MAX_REWARD_TIME, MIN_GAME_TIME, MIN_PENALTY_TIME, MIN_REWARD_TIME } from '@common/game-constants-values';
import { TimeConstantsPopupComponent } from './time-constants-popup.component';

describe('TimeConstantsPopupComponent', () => {
    let component: TimeConstantsPopupComponent;
    let fixture: ComponentFixture<TimeConstantsPopupComponent>;
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
            reloadWindow: () => {},
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
            declarations: [TimeConstantsPopupComponent],
            imports: [MatDialogModule, MatFormFieldModule, FormsModule, BrowserAnimationsModule, ReactiveFormsModule, MatInputModule],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: GameService, useValue: gameServiceMock },
                { provide: MatDialog, useValue: dialogMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TimeConstantsPopupComponent);
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
});