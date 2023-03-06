import { Injectable } from '@angular/core';
import { UploadImageSquareComponent } from '@app/components/upload-image-square/upload-image-square.component';
import { DEFAULT_TOOL_SIZE, IMAGE_HEIGHT, IMAGE_WIDTH } from '@app/constants/utils-constants';
import { ActiveCanvas } from '@app/interfaces/active-canvas';
import { DrawMode } from '@app/interfaces/draw-mode';
import { Coordinate } from '@common/coordinate';

@Injectable({
    providedIn: 'root',
})
export class DrawService {
    startCoordinate: Coordinate = { x: 0, y: 0 };
    lastPos: Coordinate = { x: 0, y: 0 };
    mode = DrawMode.PENCIL;

    toolSize = DEFAULT_TOOL_SIZE;
    color = '#000000';

    mainUndoStack: ImageData[] = [];
    mainRedoStack: ImageData[] = [];
    altUndoStack: ImageData[] = [];
    altRedoStack: ImageData[] = [];

    activeCanvas = ActiveCanvas.None;
    startCanvasData: ImageData;
    startFgData: ImageData;

    mainImageComponent: UploadImageSquareComponent;
    altImageComponent: UploadImageSquareComponent;

    startAction(coordinate: Coordinate, canvas: ActiveCanvas) {
        // check if this still works with cheap mouse out of window stuff!
        if (this.activeCanvas !== ActiveCanvas.None) this.cancelAction();
        this.saveStateToStacks(this.mainUndoStack, this.altUndoStack);
        this.activeCanvas = canvas;
        this.startCoordinate = coordinate;
        this.lastPos = coordinate;
        if (this.mode === DrawMode.RECTANGLE) {
            const activeComponent = canvas === ActiveCanvas.Main ? this.mainImageComponent : this.altImageComponent;
            this.startCanvasData = activeComponent.canvasContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
            this.startFgData = activeComponent.fgContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        }
    }

    onMouseMove(coordinate: Coordinate, canvas: ActiveCanvas, shiftPressed: boolean) {
        if (this.activeCanvas === ActiveCanvas.None) return;
        if (canvas === this.activeCanvas) {
            const activeComponent = canvas === ActiveCanvas.Main ? this.mainImageComponent : this.altImageComponent;
            this.performAction(coordinate, activeComponent, shiftPressed);
        }
        this.lastPos = coordinate;
    }

    performAction(coordinate: Coordinate, activeComponent: UploadImageSquareComponent, shiftPressed: boolean) {
        // "pure" drawing on LOCAL foreground canvas
        switch (this.mode) {
            case DrawMode.PENCIL:
                this.drawLine(coordinate, activeComponent.canvasContext);
                this.drawLine(coordinate, activeComponent.fgContext);
                break;
            case DrawMode.RECTANGLE:
                // Reset a l'etat de depart pour re-render le rectangle ou carré
                activeComponent.canvasContext.putImageData(this.startCanvasData, 0, 0);
                activeComponent.fgContext.putImageData(this.startFgData, 0, 0);
                this.drawRectangle(coordinate, activeComponent.canvasContext, shiftPressed);
                this.drawRectangle(coordinate, activeComponent.fgContext, shiftPressed);
                break;
            case DrawMode.ERASER:
                this.replace(coordinate, activeComponent.canvasContext, activeComponent.bgImage);
                this.erase(coordinate, activeComponent.fgContext);
                break;
        }
    }

    cancelAction() {
        if (this.activeCanvas === ActiveCanvas.None) return;
        // Une action a été effectuée, on ne peut plus retourner aux états annulés
        this.clearRedoHistory();
        this.activeCanvas = ActiveCanvas.None;
    }

    undo() {
        if (this.mainUndoStack.length === 0 || this.altUndoStack.length === 0 || this.activeCanvas !== ActiveCanvas.None) return;

        this.saveStateToStacks(this.mainRedoStack, this.altRedoStack);
        this.loadStateFromStacks(this.mainUndoStack, this.altUndoStack);
        this.renderStates();
    }

    redo() {
        if (this.mainRedoStack.length === 0 || this.altRedoStack.length === 0 || this.activeCanvas !== ActiveCanvas.None) return;

        this.saveStateToStacks(this.mainUndoStack, this.altUndoStack);
        this.loadStateFromStacks(this.mainRedoStack, this.altRedoStack);
        this.renderStates();
    }

    swapForegrounds() {
        this.saveStateToStacks(this.mainUndoStack, this.altUndoStack);
        this.clearRedoHistory();

        const mainFg = this.mainImageComponent.fgContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        const altFg = this.altImageComponent.fgContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

        this.mainImageComponent.fgContext.putImageData(altFg, 0, 0);
        this.altImageComponent.fgContext.putImageData(mainFg, 0, 0);

        this.renderStates();
    }

    replaceForeground(canvas: ActiveCanvas) {
        this.saveStateToStacks(this.mainUndoStack, this.altUndoStack);
        this.clearRedoHistory();
        if (canvas === ActiveCanvas.Main) {
            const altFg = this.altImageComponent.fgContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
            this.mainImageComponent.fgContext.putImageData(altFg, 0, 0);
        } else if (canvas === ActiveCanvas.Alt) {
            const mainFg = this.mainImageComponent.fgContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
            this.altImageComponent.fgContext.putImageData(mainFg, 0, 0);
        }

        this.renderStates();
    }

    clearForeground(canvas: ActiveCanvas) {
        this.saveStateToStacks(this.mainUndoStack, this.altUndoStack);
        this.clearRedoHistory();
        const activeContext = canvas === ActiveCanvas.Main ? this.mainImageComponent.fgContext : this.altImageComponent.fgContext;
        activeContext.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

        this.renderStates();
    }

    private clearRedoHistory() {
        this.mainRedoStack = [];
        this.altRedoStack = [];
    }

    private saveStateToStacks(mainStack: ImageData[], altStack: ImageData[]) {
        // On sauvegarde le nouvel état de l'avant-plan des 2 images
        mainStack.push(this.mainImageComponent.fgContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT));
        altStack.push(this.altImageComponent.fgContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT));
    }

    private loadStateFromStacks(mainStack: ImageData[], altStack: ImageData[]) {
        this.mainImageComponent.fgContext.putImageData(mainStack.pop() as ImageData, 0, 0);
        this.altImageComponent.fgContext.putImageData(altStack.pop() as ImageData, 0, 0);
    }

    private renderStates() {
        this.mainImageComponent.updateCanvas();
        this.altImageComponent.updateCanvas();
    }

    private drawLine(coordinate: Coordinate, canvasContext: CanvasRenderingContext2D) {
        canvasContext.fillStyle = this.color;
        canvasContext.beginPath(); // Start a new path

        this.getPixelsInPath(this.lastPos, coordinate).forEach((coord) => {
            // Taille divisée par 2 pour avoir le rayon
            canvasContext.arc(coord.x, coord.y, this.toolSize / 2, 0, Math.PI * 2);
        });
        canvasContext.fill(); // Render the path
    }

    private drawRectangle(coordinate: Coordinate, canvasContext: CanvasRenderingContext2D, shiftPressed: boolean) {
        canvasContext.fillStyle = this.color;
        const size = {
            x: coordinate.x - this.startCoordinate.x,
            y: coordinate.y - this.startCoordinate.y,
        };
        if (shiftPressed) {
            const squareSize = Math.min(Math.abs(size.x), Math.abs(size.y));
            size.x = Math.sign(size.x) * squareSize;
            size.y = Math.sign(size.y) * squareSize;
        }
        canvasContext.fillRect(this.startCoordinate.x, this.startCoordinate.y, size.x, size.y);
    }

    private replace(coordinate: Coordinate, canvasContext: CanvasRenderingContext2D, backgroundImage: HTMLImageElement) {
        this.getPixelsInPath(this.lastPos, coordinate).forEach((coord) => {
            canvasContext.drawImage(
                backgroundImage,
                coord.x - this.toolSize / 2,
                coord.y - this.toolSize / 2,
                this.toolSize,
                this.toolSize,
                coord.x - this.toolSize / 2,
                coord.y - this.toolSize / 2,
                this.toolSize,
                this.toolSize,
            );
        });
    }

    private erase(coordinate: Coordinate, canvasContext: CanvasRenderingContext2D) {
        this.getPixelsInPath(this.lastPos, coordinate).forEach((coord) => {
            canvasContext.clearRect(coord.x - this.toolSize / 2, coord.y - this.toolSize / 2, this.toolSize, this.toolSize);
        });
    }

    private getPixelsInPath(start: Coordinate, end: Coordinate): Coordinate[] {
        const path: Coordinate[] = [{ ...start }];

        if (start.x === end.x && start.y === end.y) {
            return path;
        }

        const xDirection = Math.sign(end.x - start.x);
        if (xDirection === 0) {
            for (let y = start.y; y !== end.y; y += Math.sign(end.y - start.y)) {
                path.push({ x: start.x, y });
            }
            return path;
        }

        const yDirection = Math.sign(end.y - start.y);
        if (yDirection === 0) {
            for (let x = start.x; x !== end.x; x += xDirection) {
                path.push({ x, y: start.y });
            }
            return path;
        }

        const deltaX: number = Math.abs(end.x - start.x);
        const deltaY: number = Math.abs(end.y - start.y);

        if (deltaX >= deltaY) {
            const slopeY = (yDirection * deltaY) / deltaX;
            let y = start.y;
            for (let x = start.x; x !== end.x; x += xDirection) {
                y += slopeY;
                path.push({ x: Math.floor(x), y: Math.floor(y) });
            }
        } else {
            const slopeX = (xDirection * deltaX) / deltaY;
            let x = start.x;
            for (let y = start.y; y !== end.y; y += yDirection) {
                x += slopeX;
                path.push({ x: Math.floor(x), y: Math.floor(y) });
            }
        }

        return path;
    }
}
