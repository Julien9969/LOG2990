import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ERROR_MESSAGE_DISPLAYED_TIME } from '@app/constants/utils-constants';

@Component({
    selector: 'app-image-difference-popup',
    templateUrl: './image-difference-popup.component.html',
    styleUrls: ['./image-difference-popup.component.scss'],
})
export class ImageDifferencePopupComponent {
    @Input() imgDifferencesUrl: string;
    @Input() nbDifferences: number | undefined;
    @Input() isHard: boolean;
    @Output() cancelGamCreation: EventEmitter<undefined> = new EventEmitter<undefined>();
    @Output() createGame: EventEmitter<undefined> = new EventEmitter<undefined>();

    isPressed: boolean = false;

    dispatchGameCreationRequest() {
        this.createGame.emit();
        this.isPressed = true;
        setTimeout(() => {
            this.isPressed = false;
        }, ERROR_MESSAGE_DISPLAYED_TIME);
    }
}
