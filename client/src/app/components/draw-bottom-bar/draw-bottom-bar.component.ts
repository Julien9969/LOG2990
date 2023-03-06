import { Component } from '@angular/core';
import { DrawMode } from '@app/interfaces/draw-mode';
import { DrawService } from '@app/services/draw.service';

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

    setColor(color: string) {
        this.drawService.color = color;
    }

    setToolSize(size: string) {
        this.drawService.toolSize = parseInt(size, 10);
    }

    drawModeActive() {
        return this.drawService.mode === DrawMode.PENCIL;
    }

    setRectangleMode() {
        this.drawService.mode = DrawMode.RECTANGLE;
    }

    rectangleModeActive() {
        return this.drawService.mode === DrawMode.RECTANGLE;
    }

    setEraseMode() {
        this.drawService.mode = DrawMode.ERASER;
    }

    eraseModeActive() {
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
