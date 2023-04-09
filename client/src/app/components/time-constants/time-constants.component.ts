import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAX_GAME_TIME, MAX_PENALTY_TIME, MAX_REWARD_TIME, MIN_GAME_TIME, MIN_PENALTY_TIME, MIN_REWARD_TIME } from '@app/constants/utils-constants';
import { GameService } from '@app/services/game/game.service';
import { GameConstants } from '@common/game-constants';

@Component({
    selector: 'app-time-constants',
    templateUrl: './time-constants.component.html',
    styleUrls: ['./time-constants.component.scss'],
})
export class TimeConstantsComponent implements OnInit {
    gameConstants: GameConstants = {};
    modifiedGameConstants: GameConstants = {};
    editingConstants = false;

    timeFormControl = new FormControl('', [
        Validators.pattern('[0-9]*'),
        Validators.min(MIN_GAME_TIME),
        Validators.max(MAX_GAME_TIME),
        this.isNumber(),
    ]);

    rewardFormControl = new FormControl('', [
        Validators.pattern('[0-9]*'),
        Validators.min(MIN_REWARD_TIME),
        Validators.max(MAX_REWARD_TIME),
        this.isNumber(),
    ]);

    penaltyFormControl = new FormControl('', [
        Validators.pattern('[0-9]*'),
        Validators.min(MIN_PENALTY_TIME),
        Validators.max(MAX_PENALTY_TIME),
        this.isNumber(),
    ]);

    constructor(private readonly gameService: GameService) {}

    // Pour y avoir accès dans le code html, qui affiche les bornes de chaque valeur
    get timeConstantBounds() {
        return {
            minTime: MIN_GAME_TIME,
            maxTime: MAX_GAME_TIME,
            minPenalty: MIN_PENALTY_TIME,
            maxPenalty: MAX_PENALTY_TIME,
            minReward: MIN_REWARD_TIME,
            maxReward: MAX_REWARD_TIME,
        };
    }

    async ngOnInit() {
        try {
            this.gameConstants = await this.gameService.getGameConstants();
        } catch (err) {
            this.gameConstants = {};
        }
    }

    openEditPopup(): void {
        this.modifiedGameConstants = {};
        this.editingConstants = true;
    }

    cancelConstantsEdit(): void {
        this.editingConstants = false;
        this.modifiedGameConstants = this.gameConstants;
    }

    validateGameConstants(): boolean {
        return this.constantsAreValidNumbers() && this.constantsAreInRange();
    }

    constantsAreInRange(): boolean {
        return (
            this.isInRange(this.modifiedGameConstants.time, MIN_GAME_TIME, MAX_GAME_TIME) &&
            this.isInRange(this.modifiedGameConstants.penalty, MIN_PENALTY_TIME, MAX_PENALTY_TIME) &&
            this.isInRange(this.modifiedGameConstants.reward, MIN_REWARD_TIME, MAX_REWARD_TIME)
        );
    }

    constantsAreValidNumbers(): boolean {
        return (
            (this.modifiedGameConstants.time === undefined || !isNaN(this.modifiedGameConstants.time)) &&
            (this.modifiedGameConstants.reward === undefined || !isNaN(this.modifiedGameConstants.reward)) &&
            (this.modifiedGameConstants.penalty === undefined || !isNaN(this.modifiedGameConstants.penalty))
        );
    }

    async updateGameConstants() {
        if (!this.validateGameConstants()) return;

        this.gameConstants = { ...this.gameConstants, ...this.modifiedGameConstants };
        await this.gameService.updateGameConstants(this.gameConstants);
        this.editingConstants = false;
    }

    // Wrapper de parseInt pour y acceder dans le HTML
    parseInt(value: string): number {
        return parseInt(value, 10);
    }

    isNumber(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            return isNaN(parseInt(control.value, 10)) ? { value: control.value } : null;
        };
    }

    private isInRange(value: number | undefined, min: number, max: number): boolean {
        // Si la valeur n'est pas définie, alors elle n'est pas modifiée donc reste valide.
        if (value === undefined) {
            return true;
        }
        return isNaN(value) || (value >= min && value <= max);
    }
}
