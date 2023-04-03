import { Component } from '@angular/core';
import { GameService } from '@app/services/game.service';
import { GameConstants } from '@common/game-constants';

@Component({
    selector: 'app-upload-image-square',
    templateUrl: './upload-image-square.component.html',
    styleUrls: ['./upload-image-square.component.scss'],
})
export class TimeConstantsDisplay {

    gameConstants: GameConstants;
    constructor(readonly gameService: GameService) {}
}
