import { Injectable } from '@angular/core';
import { MouseButton } from '@app/constants/utils-constants';
import { Coordinate } from '@common/coordinate';

@Injectable({
    providedIn: 'root',
})
export class MouseService {
    mousePosition: Coordinate = { x: 0, y: 0 };

    /**
     * Traite le click de la souris et sauvegarde la position du click
     *
     * @param event evenement de souris
     */
    clickProcessing(event: MouseEvent) {
        if (event.button === MouseButton.Left) {
            this.mousePosition = { x: event.offsetX, y: event.offsetY };
        }
    }
}
