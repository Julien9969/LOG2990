/* eslint-disable @typescript-eslint/no-empty-function */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { DrawMode } from '@app/interfaces/draw-mode';

import { DrawBottomBarComponent } from './draw-bottom-bar.component';

class MockDrawService {}

describe('DrawSidebarComponent', () => {
    let component: DrawBottomBarComponent;
    let fixture: ComponentFixture<DrawBottomBarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DrawBottomBarComponent],
            imports: [MatIconModule],
            providers: [MockDrawService],
        }).compileComponents();

        fixture = TestBed.createComponent(DrawBottomBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('mode setting functions', () => {
        it('setDrawMode should set drawService mode to pencil', () => {
            component.setDrawMode();

            expect(component.drawService.mode).toEqual(DrawMode.PENCIL);
        });

        it('setRectangleMode should set drawService mode to rectangle', () => {
            component.setRectangleMode();

            expect(component.drawService.mode).toEqual(DrawMode.RECTANGLE);
        });

        it('setEraseMode should set drawService mode to erase', () => {
            component.setEraseMode();

            expect(component.drawService.mode).toEqual(DrawMode.ERASER);
        });
    });

    describe('tool editing functions', () => {
        it('setColor should set drawService color', () => {
            const color = 'color';
            component.setColor(color);

            expect(component.drawService.color).toEqual(color);
        });

        it('setToolSize should set drawService toolSize parsed to number', () => {
            const toolSize = 5;
            component.setToolSize(toolSize.toString());

            expect(component.drawService.toolSize).toEqual(toolSize);
        });
    });

    describe('active mode tracking', () => {
        it('isdrawModeActive returns true when draw service mode is pencil', () => {
            component.drawService.mode = DrawMode.PENCIL;
            expect(component.isDrawModeActive()).toBeTrue();
        });

        it('isdrawModeActive returns false when draw service mode is not pencil', () => {
            component.drawService.mode = DrawMode.RECTANGLE;
            expect(component.isDrawModeActive()).toBeFalse();
        });

        it('isrectangleModeActive returns true when draw service mode is rectangle', () => {
            component.drawService.mode = DrawMode.RECTANGLE;
            expect(component.isRectangleModeActive()).toBeTrue();
        });

        it('isrectangleModeActive returns false when draw service mode is not rectangle', () => {
            component.drawService.mode = DrawMode.ERASER;
            expect(component.isRectangleModeActive()).toBeFalse();
        });

        it('iseraseModeActive returns true when draw service mode is eraser', () => {
            component.drawService.mode = DrawMode.ERASER;
            expect(component.isEraseModeActive()).toBeTrue();
        });

        it('iseraseModeActive returns false when draw service mode is not eraser', () => {
            component.drawService.mode = DrawMode.PENCIL;
            expect(component.isEraseModeActive()).toBeFalse();
        });
    });

    describe('foreground commands', () => {
        it('undo calls drawService undo', () => {
            const undoSpy = spyOn(component.drawService, 'undo').and.callFake(() => {});
            component.undo();

            expect(undoSpy).toHaveBeenCalled();
        });

        it('redo calls drawService redo', () => {
            const redoSpy = spyOn(component.drawService, 'redo').and.callFake(() => {});
            component.redo();

            expect(redoSpy).toHaveBeenCalled();
        });

        it('swapForegrounds calls drawService swapForegrounds', () => {
            const swapForegroundsSpy = spyOn(component.drawService, 'swapForegrounds').and.callFake(() => {});
            component.swapForegrounds();

            expect(swapForegroundsSpy).toHaveBeenCalled();
        });
    });
});
