import { Component } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
// import { MatDialog } from '@angular/material/dialog';
import { MAX_GAME_TIME, MAX_PENALTY_TIME, MAX_REWARD_TIME, MIN_GAME_TIME, MIN_PENALTY_TIME, MIN_REWARD_TIME } from '@app/constants/utils-constants';
import { GameService } from '@app/services/game.service';
import { GameConstants } from '@common/game-constants';

@Component({
    selector: 'app-time-constants',
    templateUrl: './time-constants.component.html',
    styleUrls: ['./time-constants.component.scss'],
})
export class TimeConstantsComponent {
    gameConstants: GameConstants;
    modifiedGameConstants: GameConstants;
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

    constructor(readonly gameService: GameService) {
        this.loadGameConstants();
    }

    get timeConstantBounds() {
        return {
            MIN_GAME_TIME,
            MAX_GAME_TIME,
            MIN_PENALTY_TIME,
            MAX_PENALTY_TIME,
            MIN_REWARD_TIME,
            MAX_REWARD_TIME,
        } 
    }
    
    loadGameConstants() {
        // TODO: CALL COMM SERVICE
        this.gameConstants = {
            time: Math.random(),
            penalty: 30,
            reward: 30,
        }
        this.modifiedGameConstants = {};
    }

    openEditPopup(): void {
        this.modifiedGameConstants = {};
        this.editingConstants = true;
    }

    cancelConstantsEdit(): void {
        this.editingConstants = false;
        this.modifiedGameConstants = this.gameConstants
    }

    updateDisplay(updatedGameConsts: GameConstants) {
        this.gameConstants = updatedGameConsts;
    }

    // Fonctions pour le popup de modification de constantes

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
    
    updateGameConstants() {
        alert("updating constants");

        // if(!this.validateGameConstants()) return;

        alert('valid constants')

        // this.modifiedGameConstants = {
        //     time: 125,
        //     penalty: 100,
        //     reward: 999,
        // }
        // this.data.gameConsts.time = 6666;

        this.gameConstants = {...this.gameConstants, ...this.modifiedGameConstants};
        this.editingConstants = false;
    }

    parseInt(value: string): number {
        return parseInt(value);
    }

    isNumber(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            return isNaN(parseInt(control.value))? {value: control.value} : null;
          };
    }

    private isInRange(value: number | undefined, min: number, max: number): boolean {
        // Si la valeur n'est pas définie, alors elle n'est pas modifiée donc reste valide.
        console.log(value);
        if(value === undefined) {
            return true;
        }
        return isNaN(value) || (value >= min && value <= max);
    }

}