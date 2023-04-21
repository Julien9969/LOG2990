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
    mainImageComponent: UploadImageSquareComponent;
    altImageComponent: UploadImageSquareComponent;

    mode = DrawMode.PENCIL;

    color = '#000000';
    toolSize = DEFAULT_TOOL_SIZE;

    private startCoordinate: Coordinate = { x: 0, y: 0 };
    private lastPos: Coordinate = { x: 0, y: 0 };

    private activeCanvas = ActiveCanvas.None;
    private startCanvasData: ImageData;
    private startForegroundData: ImageData;

    private mainUndoStack: ImageData[] = [];
    private mainRedoStack: ImageData[] = [];
    private altUndoStack: ImageData[] = [];
    private altRedoStack: ImageData[] = [];

    startAction(coordinate: Coordinate, canvas: ActiveCanvas) {
        if (this.activeCanvas !== ActiveCanvas.None) this.cancelAction();
        this.saveStateToStacks(this.mainUndoStack, this.altUndoStack);
        this.activeCanvas = canvas;
        this.startCoordinate = coordinate;
        this.lastPos = coordinate;
        if (this.mode === DrawMode.RECTANGLE) {
            const activeComponent = canvas === ActiveCanvas.Main ? this.mainImageComponent : this.altImageComponent;
            this.startCanvasData = activeComponent.canvasContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
            this.startForegroundData = activeComponent.foregroundContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
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
        // "pure" dessin sur l'avant plan LOCAL du canvas
        switch (this.mode) {
            case DrawMode.PENCIL:
                this.drawLine(coordinate, activeComponent.canvasContext);
                this.drawLine(coordinate, activeComponent.foregroundContext);
                break;
            case DrawMode.RECTANGLE:
                // Retourne à l'état de départ pour re-render le rectangle ou le carré
                activeComponent.canvasContext.putImageData(this.startCanvasData, 0, 0);
                activeComponent.foregroundContext.putImageData(this.startForegroundData, 0, 0);
                this.drawRectangle(coordinate, activeComponent.canvasContext, shiftPressed);
                this.drawRectangle(coordinate, activeComponent.foregroundContext, shiftPressed);
                break;
            case DrawMode.ERASER:
                this.replace(coordinate, activeComponent.canvasContext, activeComponent.backgroundImage);
                this.erase(coordinate, activeComponent.foregroundContext);
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

        const mainForeground = this.mainImageComponent.foregroundContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        const altForeground = this.altImageComponent.foregroundContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

        this.mainImageComponent.foregroundContext.putImageData(altForeground, 0, 0);
        this.altImageComponent.foregroundContext.putImageData(mainForeground, 0, 0);

        this.renderStates();
    }

    replaceForeground(canvas: ActiveCanvas) {
        this.saveStateToStacks(this.mainUndoStack, this.altUndoStack);
        this.clearRedoHistory();
        if (canvas === ActiveCanvas.Main) {
            const altForeground = this.altImageComponent.foregroundContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
            this.mainImageComponent.foregroundContext.putImageData(altForeground, 0, 0);
        } else if (canvas === ActiveCanvas.Alt) {
            const mainForeground = this.mainImageComponent.foregroundContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
            this.altImageComponent.foregroundContext.putImageData(mainForeground, 0, 0);
        }

        this.renderStates();
    }

    clearForeground(canvas: ActiveCanvas) {
        this.saveStateToStacks(this.mainUndoStack, this.altUndoStack);
        this.clearRedoHistory();
        const activeContext = canvas === ActiveCanvas.Main ? this.mainImageComponent.foregroundContext : this.altImageComponent.foregroundContext;
        activeContext.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

        this.renderStates();
    }

    private clearRedoHistory() {
        this.mainRedoStack = [];
        this.altRedoStack = [];
    }

    private saveStateToStacks(mainStack: ImageData[], altStack: ImageData[]) {
        // On sauvegarde le nouvel état de l'avant-plan des 2 images
        mainStack.push(this.mainImageComponent.foregroundContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT));
        altStack.push(this.altImageComponent.foregroundContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT));
    }

    private loadStateFromStacks(mainStack: ImageData[], altStack: ImageData[]) {
        this.mainImageComponent.foregroundContext.putImageData(mainStack.pop() as ImageData, 0, 0);
        this.altImageComponent.foregroundContext.putImageData(altStack.pop() as ImageData, 0, 0);
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
        canvasContext.fill(); // Render la page
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
        if (start.x === end.x && start.y === end.y) {
            return [{ ...start }];
        }

        const xDirection = Math.sign(end.x - start.x);
        const yDirection = Math.sign(end.y - start.y);
        if (xDirection === 0 || yDirection === 0) {
            return this.computeStraightPath(start, end);
        }

        return this.computeSlopedPath(start, end);
    }

    private computeStraightPath(start: Coordinate, end: Coordinate): Coordinate[] {
        const path: Coordinate[] = [];

        if (end.x === start.x) {
            const yDirection = Math.sign(end.y - start.y);
            for (let y = start.y; y !== end.y; y += Math.sign(yDirection)) {
                path.push({ x: start.x, y });
            }
        } else if (end.y === start.y) {
            const xDirection = Math.sign(end.x - start.x);
            for (let x = start.x; x !== end.x; x += Math.sign(xDirection)) {
                path.push({ x, y: start.y });
            }
        } else {
            return [];
        }

        path.push({ ...end });
        return path;
    }

    private computeSlopedPath(start: Coordinate, end: Coordinate): Coordinate[] {
        const path: Coordinate[] = [];
        const xDirection = Math.sign(end.x - start.x);
        const yDirection = Math.sign(end.y - start.y);
        const deltaX: number = Math.abs(end.x - start.x);
        const deltaY: number = Math.abs(end.y - start.y);

        if (deltaX >= deltaY) {
            const slopeY = (yDirection * deltaY) / deltaX;
            let y = start.y;
            for (let x = start.x; x !== end.x; x += xDirection) {
                path.push({ x: Math.floor(x), y: Math.floor(y) });
                y += slopeY;
            }
        } else {
            const slopeX = (xDirection * deltaX) / deltaY;
            let x = start.x;
            for (let y = start.y; y !== end.y; y += yDirection) {
                path.push({ x: Math.floor(x), y: Math.floor(y) });
                x += slopeX;
            }
        }

        path.push({ ...end });
        return path;
    }
}
