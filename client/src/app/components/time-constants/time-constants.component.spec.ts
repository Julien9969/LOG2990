/* eslint-disable @typescript-eslint/no-empty-function */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MAX_GAME_TIME, MAX_PENALTY_TIME, MAX_REWARD_TIME, MIN_GAME_TIME, MIN_PENALTY_TIME, MIN_REWARD_TIME } from '@app/constants/utils-constants';
import { GameService } from '@app/services/game/game.service';
import { TimeConstantsComponent } from './time-constants.component';

describe('TimeConstantsComponent', () => {
    let component: TimeConstantsComponent;
    let fixture: ComponentFixture<TimeConstantsComponent>;
    let gameServiceMock: GameService;
    let gameServiceGetConstantsSpy: jasmine.Spy;
    let gameServiceUpdateConstantsSpy: jasmine.Spy;

    beforeEach(async () => {
        gameServiceMock = {
            getGameConstants: async () => {
                return {};
            },
            updateGameConstants: async () => {},
        } as any;
        
        await TestBed.configureTestingModule({
            declarations: [TimeConstantsComponent],
            imports: [MatIconModule],
            providers: [{ provide: GameService, useValue: gameServiceMock }],
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
            }
        });
        gameServiceUpdateConstantsSpy = spyOn(gameServiceMock, 'updateGameConstants').and.callFake(async () => {})
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
                hasError: (code: string) => false
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
