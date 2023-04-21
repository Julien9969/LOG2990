import { Component } from '@angular/core';
import { DECIMAL_BASE } from '@app/constants/utils-constants';
import { DrawMode } from '@app/interfaces/draw-mode';
import { DrawService } from '@app/services/draw/draw.service';

@Component({
    selector: 'app-draw-bottom-bar',
    templateUrl: './draw-bottom-bar.component.html',
    styleUrls: ['./draw-bottom-bar.component.scss'],
})
export class DrawBottomBarComponent {
    constructor(readonly drawService: DrawService) {}

    setDrawMode() {
        this.drawService.mode = DrawMode.PENCIL;
    }

    setRectangleMode() {
        this.drawService.mode = DrawMode.RECTANGLE;
    }

    setEraseMode() {
        this.drawService.mode = DrawMode.ERASER;
    }

    setColor(color: string) {
        this.drawService.color = color;
    }

    setToolSize(size: string) {
        this.drawService.toolSize = parseInt(size, DECIMAL_BASE);
    }

    isDrawModeActive() {
        return this.drawService.mode === DrawMode.PENCIL;
    }

    isRectangleModeActive() {
        return this.drawService.mode === DrawMode.RECTANGLE;
    }

    isEraseModeActive() {
        return this.drawService.mode === DrawMode.ERASER;
    }

    undo() {
        this.drawService.undo();
    }

    redo() {
        this.drawService.redo();
    }

    swapForegrounds() {
        this.drawService.swapForegrounds();
    }
}
