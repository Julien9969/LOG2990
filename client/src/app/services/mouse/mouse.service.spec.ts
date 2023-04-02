import { TestBed } from '@angular/core/testing';
import { MouseButton } from '@app/constants/utils-constants';
import { MouseService } from './mouse.service';

describe('MouseService', () => {
    let service: MouseService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MouseService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('Should save the event position with no change if devicePixelRatio is less than 1.25 ', () => {
        const event = new MouseEvent('click', { button: MouseButton.Left, clientX: 10, clientY: 10 });
        Object.defineProperty(window, 'devicePixelRatio', { value: 1 });
        service.clickProcessing(event);
        expect(service.mousePosition).toEqual({ x: 10, y: 10 });

        Object.defineProperty(window, 'devicePixelRatio', { value: -1 });
        service.clickProcessing(event);
        expect(service.mousePosition).toEqual({ x: 10, y: 10 });
    });

    it('Should not save the position when the button is not left', () => {
        const event = new MouseEvent('click', { button: MouseButton.Right, clientX: 10, clientY: 10 });
        service.clickProcessing(event);
        expect(service.mousePosition).toEqual({ x: 0, y: 0 });
    });
});
