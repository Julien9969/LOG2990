import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { GameService } from '@app/services/game/game.service';
import { GameConstants } from '@common/game-constants';
import { MAX_GAME_TIME, MAX_PENALTY_TIME, MAX_REWARD_TIME, MIN_GAME_TIME, MIN_PENALTY_TIME, MIN_REWARD_TIME } from '@common/game-constants-values';
;

@Component({
    selector: 'app-time-constants',
    templateUrl: './time-constants.component.html',
    styleUrls: ['./time-constants.component.scss'],
})
export class TimeConstantsComponent implements OnInit {
    gameConstants: GameConstants = {};
    modifiedGameConstants: GameConstants = {};
    editingConstants = false;

    // eslint-disable-next-line prettier/prettier -- Le linter crée des lignes trop longues avec les Validators
    timeFormControl = new FormControl('', [
        Validators.pattern('[0-9]*'),
        Validators.min(MIN_GAME_TIME),
        Validators.max(MAX_GAME_TIME),
    ]);

    // eslint-disable-next-line prettier/prettier
    rewardFormControl = new FormControl('', [
        Validators.pattern('[0-9]*'),
        Validators.min(MIN_REWARD_TIME),
        Validators.max(MAX_REWARD_TIME),
    ]);

    // eslint-disable-next-line prettier/prettier
    penaltyFormControl = new FormControl('', [
        Validators.pattern('[0-9]*'),
        Validators.min(MIN_PENALTY_TIME),
        Validators.max(MAX_PENALTY_TIME),
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
        return (
            this.formControlIsValid(this.timeFormControl) &&
            this.formControlIsValid(this.rewardFormControl) &&
            this.formControlIsValid(this.penaltyFormControl)
        );
    }

    formControlIsValid(formControl: FormControl): boolean {
        return !formControl.hasError('pattern') && !formControl.hasError('min') && !formControl.hasError('max');
    }

    async updateGameConstants() {
        if (!this.validateGameConstants()) return;

        await this.gameService.updateGameConstants({ ...this.gameConstants, ...this.modifiedGameConstants });
        this.gameConstants = await this.gameService.getGameConstants();
        this.editingConstants = false;
    }

    // Wrapper de Number pour y acceder dans le HTML
    convertToNumber(value: string): number | undefined {
        // La fonction Number convertit une chaine vide en 0, mais undefined est plus approprié dans notre cas
        if (value === '') return undefined;
        return Number(value);
    }
}
