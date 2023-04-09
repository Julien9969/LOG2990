/* eslint-disable @typescript-eslint/no-empty-function */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MAX_GAME_TIME, MAX_PENALTY_TIME, MAX_REWARD_TIME, MIN_GAME_TIME, MIN_PENALTY_TIME, MIN_REWARD_TIME } from '@app/constants/utils-constants';
import { GameService } from '@app/services/game/game.service';
import { TimeConstantsComponent } from './time-constants.component';

describe('TimeConstantsComponent', () => {
    let component: TimeConstantsComponent;
    let fixture: ComponentFixture<TimeConstantsComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

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

    it('ngOnInit should get gameService constants', async () => {
        await component.ngOnInit();

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

    describe('validateGameConstants', () => {
        it('checks if formControls have no error', () => {
            const formControlIsValidSpy = spyOn(component, 'formControlIsValid').and.callFake(() => true);

            expect(component.validateGameConstants()).toBeTrue();

            formControlIsValidSpy.and.callFake(() => false);
            expect(component.validateGameConstants()).toBeFalse();
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

    it('convertToNumber wraps around basic Number()', () => {
        expect(component.convertToNumber('0')).toEqual(Number('0'));
        expect(component.convertToNumber('0')).toEqual(0);
        expect(component.convertToNumber('1')).toEqual(Number('1'));
        expect(component.convertToNumber('1')).toEqual(1);
        expect(component.convertToNumber('a')).toEqual(Number('a'));
    });
});
