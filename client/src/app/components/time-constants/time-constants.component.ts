import { Component } from '@angular/core';
import { GameService } from '@app/services/game.service';
import { GameConstants } from '@common/game-constants';

@Component({
    selector: 'app-time-constants',
    templateUrl: './time-constants.component.html',
    styleUrls: ['./time-constants.component.scss'],
})
export class TimeConstantsComponent {
    gameConstants: GameConstants;

    constructor(readonly gameService: GameService) {
        this.loadGameConstants();
    }

    loadGameConstants() {
        this.gameConstants = {
            time: 30,
            penalty: 30,
            reward: 30,
        }
    }
}
