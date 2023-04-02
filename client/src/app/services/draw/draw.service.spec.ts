/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@app/constants/utils-constants';
import { ActiveCanvas } from '@app/interfaces/active-canvas';
import { DrawMode } from '@app/interfaces/draw-mode';
import { DrawService } from './draw.service';

@Component({
    selector: 'app-upload-image-square',
    template: '',
})
export class StubUploadImageSquareComponent {
    fgContext = CanvasTestHelper.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
    canvasContext = CanvasTestHelper.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
    updateCanvas(): void {}
}

describe('DrawService', () => {
    let service: DrawService;
    const mainImageComponentMock = new StubUploadImageSquareComponent();
    const altImageComponentMock = new StubUploadImageSquareComponent();

    beforeEach(async () => {
        TestBed.configureTestingModule({});
    });

    beforeEach(() => {
        service = TestBed.inject(DrawService);
        service.mainImageComponent = mainImageComponentMock as any;
        service.altImageComponent = altImageComponentMock as any;
        service['startCoordinate'] = { x: 0, y: 0 };
        service['lastPos'] = { x: 3, y: 4 };
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('action tracking', () => {
        describe('startAction', () => {
            it('cancels other active actions if active canvas is not none', () => {
                service.activeCanvas = ActiveCanvas.Alt;
                spyOn(service, 'cancelAction');
                service.startAction({ x: 0, y: 0 }, ActiveCanvas.Main);
                expect(service.cancelAction).toHaveBeenCalled();
            });

            it('saves draw state', () => {
                spyOn(service, 'saveStateToStacks' as any);
                service.startAction({ x: 0, y: 0 }, ActiveCanvas.None);
                expect(service['saveStateToStacks']).toHaveBeenCalled();
            });

            it('updates coordinates and canvas', () => {
                const coordinates = { x: 1, y: 0 };
                expect(service.activeCanvas).not.toEqual(ActiveCanvas.Main);
                service.startAction(coordinates, ActiveCanvas.Main);
                expect(service.activeCanvas).toEqual(ActiveCanvas.Main);
                expect(service['startCoordinate']).toEqual(coordinates);
                expect(service['lastPos']).toEqual(coordinates);
            });

            it('updates startCanvasData and startFgData with altImageComponent when rectangle mode and activeCanvas is not Main', () => {
                service.mode = DrawMode.RECTANGLE;
                service.startAction({ x: 0, y: 0 }, ActiveCanvas.None);
                expect(service.startCanvasData).toEqual(altImageComponentMock.canvasContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT));
                expect(service.startFgData).toEqual(altImageComponentMock.fgContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT));
            });

            it('updates startCanvasData and startFgData with mainImageComponent when rectangle mode and activeCanvas is Main', () => {
                service.mode = DrawMode.RECTANGLE;
                service.startAction({ x: 0, y: 0 }, ActiveCanvas.Main);
                expect(service.startCanvasData).toEqual(mainImageComponentMock.canvasContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT));
                expect(service.startFgData).toEqual(mainImageComponentMock.fgContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT));
            });
        });

        describe('onMouseMove', () => {
            it('calls performAction on active canvas if active canvas is main and the same as mouseMove canvas', () => {
                spyOn(service, 'performAction');
                service.activeCanvas = ActiveCanvas.Main;

                service.onMouseMove({ x: 0, y: 0 }, ActiveCanvas.Main, false);
                expect(service.performAction).toHaveBeenCalled();
            });

            it('calls performAction on active canvas if active canvas is alt and the same as mouseMove canvas', () => {
                spyOn(service, 'performAction');
                service.activeCanvas = ActiveCanvas.Alt;

                service.onMouseMove({ x: 0, y: 0 }, ActiveCanvas.Alt, false);
                expect(service.performAction).toHaveBeenCalled();
            });

            it('updates lastPos', () => {
                service.activeCanvas = ActiveCanvas.Main;
                const coordinates = { x: 1, y: 0 };
                service.onMouseMove(coordinates, ActiveCanvas.Main, false);
                expect(service['lastPos']).toEqual(coordinates);
            });

            it('does not call performAction when no active canvas', () => {
                spyOn(service, 'performAction');
                service.activeCanvas = ActiveCanvas.None;

                service.onMouseMove({ x: 0, y: 0 }, ActiveCanvas.None, false);
                expect(service.performAction).not.toHaveBeenCalled();
            });
        });

        describe('performAction', () => {
            it('calls correct function when pencil mode', () => {
                service.mode = DrawMode.PENCIL;
                spyOn(service, 'drawLine' as any);
                service.performAction({ x: 0, y: 0 }, mainImageComponentMock as any, false);
                expect(service['drawLine']).toHaveBeenCalledTimes(2);
            });

            it('calls correct function when rectangle mode and loads start state', () => {
                const putImageDataSpy = new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT);
                service.startCanvasData = putImageDataSpy;
                service.startFgData = putImageDataSpy;
                spyOn(CanvasRenderingContext2D.prototype, 'putImageData' as any).and.callFake((imageData: ImageData, x: number, y: number) => {
                    expect(imageData).toEqual(putImageDataSpy);
                    expect(x).toEqual(0);
                    expect(y).toEqual(0);
                });

                service.mode = DrawMode.RECTANGLE;
                spyOn(service, 'drawRectangle' as any);
                service.performAction({ x: 0, y: 0 }, mainImageComponentMock as any, false);
                expect(service['drawRectangle']).toHaveBeenCalledTimes(2);
            });

            it('calls correct function when eraser mode', () => {
                service.mode = DrawMode.ERASER;
                spyOn(service, 'replace' as any);
                spyOn(service, 'erase' as any);
                service.performAction({ x: 0, y: 0 }, mainImageComponentMock as any, false);
                expect(service['erase']).toHaveBeenCalled();
                expect(service['replace']).toHaveBeenCalled();
            });
        });

        describe('cancelAction', () => {
            it('clears redo history and active canvas', () => {
                spyOn(service, 'clearRedoHistory' as any);
                service.activeCanvas = ActiveCanvas.Main;
                service.cancelAction();
                expect(service['clearRedoHistory']).toHaveBeenCalled();
                expect(service.activeCanvas).toEqual(2); // Can't use ActiveCanvas.None (type error)
            });

            it('does not clear redo history when no active canvas', () => {
                service.activeCanvas = ActiveCanvas.None;
                spyOn(service, 'clearRedoHistory' as any);
                service.cancelAction();
                expect(service['clearRedoHistory']).not.toHaveBeenCalled();
            });
        });
    });

    describe('state tracking', () => {
        describe('undo', () => {
            it('loads state from undo stack and saves to redo stack', () => {
                spyOn(service, 'loadStateFromStacks' as any);
                spyOn(service, 'saveStateToStacks' as any);
                service['mainUndoStack'] = [new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT)];
                service['altUndoStack'] = [new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT)];

                service.undo();
                expect(service['loadStateFromStacks']).toHaveBeenCalled();
                expect(service['saveStateToStacks']).toHaveBeenCalled();
            });

            it('render states when undone', () => {
                spyOn(service, 'renderStates' as any);
                service['mainUndoStack'] = [new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT)];
                service['altUndoStack'] = [new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT)];

                service.undo();
                expect(service['renderStates']).toHaveBeenCalled();
            });

            it('does not change states when nothing to undo', () => {
                spyOn(service, 'loadStateFromStacks' as any);
                spyOn(service, 'saveStateToStacks' as any);
                service['mainUndoStack'] = [];
                service['altUndoStack'] = [];

                service.undo();
                expect(service['loadStateFromStacks']).not.toHaveBeenCalled();
                expect(service['saveStateToStacks']).not.toHaveBeenCalled();
            });
        });

        describe('redo', () => {
            it('loads state from redo stack and saves to undo stack', () => {
                spyOn(service, 'loadStateFromStacks' as any);
                spyOn(service, 'saveStateToStacks' as any);
                service['mainRedoStack'] = [new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT)];
                service['altRedoStack'] = [new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT)];

                service.redo();
                expect(service['loadStateFromStacks']).toHaveBeenCalled();
                expect(service['saveStateToStacks']).toHaveBeenCalled();
            });

            it('render states when redone', () => {
                spyOn(service, 'renderStates' as any);
                service['mainRedoStack'] = [new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT)];
                service['altRedoStack'] = [new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT)];

                service.redo();
                expect(service['renderStates']).toHaveBeenCalled();
            });

            it('does not change states when nothing to redo', () => {
                spyOn(service, 'loadStateFromStacks' as any);
                spyOn(service, 'saveStateToStacks' as any);
                service['mainRedoStack'] = [];
                service['altRedoStack'] = [];

                service.redo();
                expect(service['loadStateFromStacks']).not.toHaveBeenCalled();
                expect(service['saveStateToStacks']).not.toHaveBeenCalled();
            });
        });

        describe('clearRedoHistory', () => {
            it('should clears redo stacks', () => {
                service['mainRedoStack'] = [new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT)];
                service['altRedoStack'] = [new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT)];

                service['clearRedoHistory']();
                expect(service['mainRedoStack']).toEqual([]);
                expect(service['altRedoStack']).toEqual([]);
            });
        });

        describe('saveStateToStacks', () => {
            it('saves image data to stacks', () => {
                const imageData = new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT);
                spyOn(CanvasRenderingContext2D.prototype, 'getImageData').and.returnValue(imageData);

                service['saveStateToStacks'](service['mainUndoStack'], service['altUndoStack']);
                expect(service['mainUndoStack']).toEqual([imageData]);
                expect(service['altUndoStack']).toEqual([imageData]);
            });
        });

        describe('loadStateFromStacks', () => {
            it('loads image data from stacks', () => {
                const imageData = new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT);
                service['mainUndoStack'].push(imageData);
                service['altUndoStack'].push(imageData);

                spyOn(CanvasRenderingContext2D.prototype, 'putImageData').and.callFake((imageD: ImageData, x: number, y: number) => {
                    expect(imageD).toEqual(imageData);
                    expect(x).toEqual(0);
                    expect(y).toEqual(0);
                });

                const popSpy = spyOn(Array.prototype, 'pop').and.callThrough();

                service['loadStateFromStacks'](service['mainUndoStack'], service['altUndoStack']);
                expect(service['mainUndoStack'].length).toEqual(0);
                expect(service['altUndoStack'].length).toEqual(0);
                expect(popSpy).toHaveBeenCalled();
            });
        });

        describe('renderStates', () => {
            it('calls updateCanvas on both canvas', () => {
                const updateSpy = spyOn(StubUploadImageSquareComponent.prototype, 'updateCanvas').and.callFake(() => {});
                service['mainUndoStack'] = [new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT)];
                service['altUndoStack'] = [new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT)];

                service['renderStates']();
                expect(updateSpy).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('foreground transformations', () => {
        describe('swapForegrounds', () => {
            it('saves state to undoStack and clears redo history', () => {
                spyOn(service, 'saveStateToStacks' as any);
                spyOn(service, 'clearRedoHistory' as any);

                service.swapForegrounds();
                expect(service['saveStateToStacks']).toHaveBeenCalled();
                expect(service['clearRedoHistory']).toHaveBeenCalled();
            });

            it('swaps image data of canvases and call renderStates', () => {
                spyOn(service, 'renderStates' as any);
                const mainFg = mainImageComponentMock.fgContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
                const altFg = altImageComponentMock.fgContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

                service.swapForegrounds();

                expect(mainImageComponentMock.fgContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT)).toEqual(altFg);
                expect(altImageComponentMock.fgContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT)).toEqual(mainFg);
            });
        });

        describe('replaceForeground', () => {
            it('should call saves state, clears redo history and renders state', () => {
                spyOn(service, 'saveStateToStacks' as any);
                spyOn(service, 'clearRedoHistory' as any);
                spyOn(service, 'renderStates' as any);

                service.replaceForeground(ActiveCanvas.None);
                expect(service['saveStateToStacks']).toHaveBeenCalled();
                expect(service['clearRedoHistory']).toHaveBeenCalled();
                expect(service['renderStates']).toHaveBeenCalled();
            });

            it('replaces proper canvas when active canvas is main', () => {
                const imageData = new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT);
                spyOn(CanvasRenderingContext2D.prototype, 'getImageData').and.returnValue(imageData);

                service.replaceForeground(ActiveCanvas.Main);
                expect(mainImageComponentMock.fgContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT)).toEqual(imageData);
            });

            it('replaces proper canvas when active canvas is alternative', () => {
                const imageData = new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT);
                spyOn(CanvasRenderingContext2D.prototype, 'getImageData').and.returnValue(imageData);

                service.replaceForeground(ActiveCanvas.Alt);
                expect(altImageComponentMock.fgContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT)).toEqual(imageData);
            });

            it('does not replace a canvas when active canvas is none', () => {
                const getImageDataSpy = spyOn(CanvasRenderingContext2D.prototype, 'getImageData');
                const putImageDataSpy = spyOn(CanvasRenderingContext2D.prototype, 'putImageData');
                spyOn(service, 'saveStateToStacks' as any).and.callFake(() => {});

                service.replaceForeground(ActiveCanvas.None);
                expect(getImageDataSpy).not.toHaveBeenCalled();
                expect(putImageDataSpy).not.toHaveBeenCalled();
            });
        });

        describe('clearForeground', () => {
            it('saves state, clears redo history and renders state', () => {
                spyOn(service, 'saveStateToStacks' as any);
                spyOn(service, 'clearRedoHistory' as any);
                spyOn(service, 'renderStates' as any);

                service.clearForeground(ActiveCanvas.None);
                expect(service['saveStateToStacks']).toHaveBeenCalled();
                expect(service['clearRedoHistory']).toHaveBeenCalled();
                expect(service['renderStates']).toHaveBeenCalled();
            });

            it('clears proper canvas when active canvas is main', () => {
                const clearRectSpy = spyOn(CanvasRenderingContext2D.prototype, 'clearRect').and.callFake(() => {});
                service.clearForeground(ActiveCanvas.Main);
                expect(clearRectSpy).toHaveBeenCalledWith(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
            });

            it('clears proper canvas when active canvas is alternative', () => {
                const clearRectSpy = spyOn(CanvasRenderingContext2D.prototype, 'clearRect').and.callFake(() => {});
                service.clearForeground(ActiveCanvas.Alt);
                expect(clearRectSpy).toHaveBeenCalledWith(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
            });
        });
    });

    describe('canvas drawing', () => {
        describe('drawLine', () => {
            it('sets color and begins canvas path', () => {
                const beginPathSpy = spyOn(CanvasRenderingContext2D.prototype, 'beginPath').and.callFake(() => {});
                service['color'] = 'red';
                service['drawLine']({ x: 0, y: 1 }, mainImageComponentMock.fgContext);

                expect(mainImageComponentMock.fgContext.fillStyle).toEqual('#ff0000');
                expect(beginPathSpy).toHaveBeenCalled();
            });

            it('draws a circle of correct size for each pixel in path then fills', () => {
                const fillSpy = spyOn(CanvasRenderingContext2D.prototype, 'fill').and.callFake(() => {});
                const arcSpy = spyOn(CanvasRenderingContext2D.prototype, 'arc').and.callFake(() => {});
                const path = [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                    { x: 2, y: 2 },
                ];
                spyOn(service, 'getPixelsInPath' as any).and.returnValue(path);

                service['drawLine']({ x: 0, y: 1 }, mainImageComponentMock.fgContext);

                expect(fillSpy).toHaveBeenCalled();
                expect(arcSpy).toHaveBeenCalledTimes(path.length);
                expect(arcSpy).toHaveBeenCalledWith(0, 0, 2.5, 0, 2 * Math.PI);
                expect(arcSpy).toHaveBeenCalledWith(1, 1, 2.5, 0, 2 * Math.PI);
                expect(arcSpy).toHaveBeenCalledWith(2, 2, 2.5, 0, 2 * Math.PI);
                expect(service['getPixelsInPath']).toHaveBeenCalledWith(service['lastPos'], { x: 0, y: 1 });
            });
        });

        describe('drawRectangle', () => {
            it('sets proper color', () => {
                service['color'] = 'red';
                service['drawRectangle']({ x: 0, y: 1 }, mainImageComponentMock.fgContext, false);
                expect(mainImageComponentMock.fgContext.fillStyle).toEqual('#ff0000');
            });

            it('draws rectangle in proper coordinates', () => {
                service['startCoordinate'] = { x: 4, y: 5 };
                const fillRectSpy = spyOn(CanvasRenderingContext2D.prototype, 'fillRect').and.callFake(() => {});
                service['drawRectangle']({ x: 0, y: 0 }, mainImageComponentMock.fgContext, false);
                expect(fillRectSpy).toHaveBeenCalledWith(4, 5, -4, -5);
            });

            it('draws square when shift pressed', () => {
                service['startCoordinate'] = { x: 4, y: 5 };
                const fillRectSpy = spyOn(CanvasRenderingContext2D.prototype, 'fillRect').and.callFake(() => {});
                service['drawRectangle']({ x: 12, y: 30 }, mainImageComponentMock.fgContext, true);
                expect(fillRectSpy).toHaveBeenCalledWith(4, 5, 8, 8);
            });
        });

        describe('replace', () => {
            it('draws background image on each pixels in path', () => {
                const putImageDataSpy = spyOn(CanvasRenderingContext2D.prototype, 'drawImage').and.callFake(() => {});
                const path = [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                    { x: 2, y: 2 },
                ];
                spyOn(service, 'getPixelsInPath' as any).and.returnValue(path);
                const image = new Image();
                image.width = 1;
                image.height = 1;
                service['replace']({ x: 0, y: 1 }, mainImageComponentMock.fgContext, image);

                expect(service['getPixelsInPath']).toHaveBeenCalledWith(service['lastPos'], { x: 0, y: 1 });
                expect(putImageDataSpy).toHaveBeenCalledTimes(path.length);
                expect(putImageDataSpy).toHaveBeenCalledWith(image, -2.5, -2.5, 5, 5, -2.5, -2.5, 5, 5);
                expect(putImageDataSpy).toHaveBeenCalledWith(image, -1.5, -1.5, 5, 5, -1.5, -1.5, 5, 5);
                expect(putImageDataSpy).toHaveBeenCalledWith(image, -0.5, -0.5, 5, 5, -0.5, -0.5, 5, 5);
            });
        });

        describe('erase', () => {
            it('erases rectangle of correct size on each pixels in path', () => {
                const clearRectSpy = spyOn(CanvasRenderingContext2D.prototype, 'clearRect').and.callFake(() => {});
                const path = [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                    { x: 2, y: 2 },
                ];
                spyOn(service, 'getPixelsInPath' as any).and.returnValue(path);
                service['erase']({ x: 0, y: 1 }, mainImageComponentMock.fgContext);

                expect(service['getPixelsInPath']).toHaveBeenCalledWith(service['lastPos'], { x: 0, y: 1 });
                expect(clearRectSpy).toHaveBeenCalledTimes(path.length);
                expect(clearRectSpy).toHaveBeenCalledWith(-2.5, -2.5, 5, 5);
                expect(clearRectSpy).toHaveBeenCalledWith(-1.5, -1.5, 5, 5);
                expect(clearRectSpy).toHaveBeenCalledWith(-0.5, -0.5, 5, 5);
            });
        });

        describe('pixel path computing', () => {
            describe('getPixelsInPath', () => {
                let computeStraightPathSpy: jasmine.Spy;
                let computeSlopedPathSpy: jasmine.Spy;
                beforeEach(() => {
                    computeStraightPathSpy = spyOn(service as any, 'computeStraightPath').and.callFake(() => []);
                    computeSlopedPathSpy = spyOn(service as any, 'computeSlopedPath').and.callFake(() => []);
                });
                it('returns current position when start and end positions are the same', () => {
                    const coord = { x: 1, y: 2 };
                    const path = service['getPixelsInPath'](coord, coord);

                    expect(path.length).toEqual(1);
                    expect(path[0]).toEqual(coord);
                    expect(computeStraightPathSpy).not.toHaveBeenCalled();
                    expect(computeSlopedPathSpy).not.toHaveBeenCalled();
                });

                it('calls computeStraightPath when start and end have same x', () => {
                    const startCoord = { x: 1, y: 2 };
                    const endCoord = { x: 1, y: 5 };
                    service['getPixelsInPath'](startCoord, endCoord);

                    expect(computeStraightPathSpy).toHaveBeenCalled();
                });

                it('calls computeStraightPath when start and end have same y', () => {
                    const startCoord = { x: 2, y: 1 };
                    const endCoord = { x: 5, y: 1 };
                    service['getPixelsInPath'](startCoord, endCoord);

                    expect(computeStraightPathSpy).toHaveBeenCalled();
                });
            });

            describe('computeStraightPath', () => {
                it('returns vertical path when start and end positions have the same x', () => {
                    const startCoord = { x: 1, y: 2 };
                    const endCoord = { x: 1, y: 5 };

                    const path = service['computeStraightPath'](startCoord, endCoord);

                    expect(path.length).toEqual(4);
                    expect(path).toEqual([
                        { x: 1, y: 2 },
                        { x: 1, y: 3 },
                        { x: 1, y: 4 },
                        { x: 1, y: 5 },
                    ]);
                });

                it('returns horizontal path when start and end positions have the same y', () => {
                    const startCoord = { x: 2, y: 1 };
                    const endCoord = { x: 5, y: 1 };

                    const path = service['computeStraightPath'](startCoord, endCoord);

                    expect(path.length).toEqual(4);
                    expect(path).toEqual([
                        { x: 2, y: 1 },
                        { x: 3, y: 1 },
                        { x: 4, y: 1 },
                        { x: 5, y: 1 },
                    ]);
                });

                it('returns empty path when not straight', () => {
                    const startCoord = { x: 2, y: 1 };
                    const endCoord = { x: 5, y: 0 };

                    const path = service['computeStraightPath'](startCoord, endCoord);

                    expect(path).toEqual([]);
                });
            });

            describe('computeSlopedPath', () => {
                it('returns a path between 2 points', () => {
                    const startCoord = { x: 1, y: 1 };
                    const endCoord = { x: 5, y: 5 };

                    const path = service['computeSlopedPath'](startCoord, endCoord);
                    expect(path.length).toEqual(5);
                    expect(path).toEqual([
                        { x: 1, y: 1 },
                        { x: 2, y: 2 },
                        { x: 3, y: 3 },
                        { x: 4, y: 4 },
                        { x: 5, y: 5 },
                    ]);
                });
            });
        });
    });
});
