/* eslint-disable @typescript-eslint/no-empty-function */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MAX_GAME_TIME, MAX_PENALTY_TIME, MAX_REWARD_TIME, MIN_GAME_TIME, MIN_PENALTY_TIME, MIN_REWARD_TIME } from '@app/constants/utils-constants';
import { GameService } from '@app/services/game.service';
import { GameConstants } from '@common/game-constants';
import { TimeConstantsComponent } from './time-constants.component';

fdescribe('UploadImageSquareComponent', () => {
    let component: TimeConstantsComponent;
    let fixture: ComponentFixture<TimeConstantsComponent>;
    let gameServiceSpy: GameService;

    beforeEach(async () => {
        gameServiceSpy = jasmine.createSpyObj('GameServiceMock', ['getGameConstants', 'updateGameConstants']);
        await TestBed.configureTestingModule({
            declarations: [TimeConstantsComponent],
            imports: [MatIconModule],
            providers: [{ provide: GameService, useValue: gameServiceSpy }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TimeConstantsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('loadGameConstants should get gameService constants', async () => {
        await component.loadGameConstants();

        expect(gameServiceSpy.getGameConstants).toHaveBeenCalled();
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

    it('updateDisplay sets gameConstants', () => {
        const stubConsts: GameConstants = {
            time: 100,
            penalty: 10,
            reward: 10,
        };
        component.gameConstants = {};

        component.updateDisplay(stubConsts);
        expect(component.gameConstants).toEqual(stubConsts);
    });

    describe('validateGameConstants', () => {
        it('checks if numbers valid and in range', () => {
            const constantsAreValidNumbersSpy = spyOn(component, 'constantsAreValidNumbers').and.callFake(() => true);
            const constantsAreInRangeSpy = spyOn(component, 'constantsAreInRange').and.callFake(() => true);

            expect(component.validateGameConstants()).toBeTrue();

            constantsAreValidNumbersSpy.and.callFake(() => false);
            constantsAreInRangeSpy.and.callFake(() => true);

            expect(component.validateGameConstants()).toBeFalse();
        });

        describe('constantsAreInRange', () => {
            it('returns true when values are all in bounds (or undefined)', () => {
                component.modifiedGameConstants = {
                    time: undefined,
                    penalty: MIN_PENALTY_TIME + 1,
                    reward: MAX_REWARD_TIME,
                };

                expect(component.constantsAreInRange()).toBeTrue();
            });

            it('returns false when values are out of bounds', () => {
                component.modifiedGameConstants = {
                    time: MIN_GAME_TIME - 1,
                    penalty: MIN_PENALTY_TIME,
                    reward: MAX_REWARD_TIME,
                };

                expect(component.constantsAreInRange()).toBeFalse();

                component.modifiedGameConstants = {
                    time: MIN_GAME_TIME,
                    penalty: MIN_PENALTY_TIME,
                    reward: MAX_REWARD_TIME + 1,
                };

                expect(component.constantsAreInRange()).toBeFalse();
            });
        });

        describe('constantsAreValidNumbers', () => {
            it('returns true when all consts are numbers or undefined', () => {
                component.modifiedGameConstants = {
                    time: undefined,
                    penalty: 0,
                    reward: 0,
                };

                expect(component.constantsAreValidNumbers()).toBeTrue();
            });

            it('returns false when a constant is not a number', () => {
                component.modifiedGameConstants = {
                    time: NaN,
                    penalty: NaN,
                    reward: 0,
                };

                expect(component.constantsAreValidNumbers()).toBeFalse();
            });
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

            expect(gameServiceSpy.updateGameConstants).toHaveBeenCalledWith(component.modifiedGameConstants);
        });

        it('does not call gameService when invalid constants', () => {
            spyOn(component, 'validateGameConstants').and.callFake(() => false);

            component.updateGameConstants();

            expect(gameServiceSpy.updateGameConstants).not.toHaveBeenCalled();
        });
    });

    it('parseInt wraps around basic parseInt', () => {
        expect(component.parseInt('0')).toEqual(parseInt('0', 10));
        expect(component.parseInt('0')).toEqual(0);
        expect(component.parseInt('1')).toEqual(parseInt('1', 10));
        expect(component.parseInt('1')).toEqual(1);
        expect(component.parseInt('a')).toEqual(parseInt('a', 10));
    });
});
