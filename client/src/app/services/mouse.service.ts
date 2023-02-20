import { Injectable } from '@angular/core';
import { MouseButton } from '@app/constants/utils-constants';
import { Coordinate } from '@common/coordinate';

@Injectable({
    providedIn: 'root',
})
export class MouseService {
    mousePosition: Coordinate = { x: 0, y: 0 };

    /**
     * Process the click event and save the correct position of the mouse depending on the devicePixelRatio
     *
     * @param event mouse event
     */
    clickProcessing(event: MouseEvent) {
        if (event.button === MouseButton.Left) {
            this.mousePosition = { x: event.offsetX, y: event.offsetY };
        }
    }
}
