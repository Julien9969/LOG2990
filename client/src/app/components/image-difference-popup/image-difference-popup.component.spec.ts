import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ERROR_MESSAGE_DISPLAYED_TIME } from '@app/constants/utils-constants';
import { ImageDifferencePopupComponent } from './image-difference-popup.component';

describe('image-difference-popup', () => {
    let component: ImageDifferencePopupComponent;
    let fixture: ComponentFixture<ImageDifferencePopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ImageDifferencePopupComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ImageDifferencePopupComponent);
        component = fixture.componentInstance;
    });

    describe('dispatchGameCreationRequest', () => {
        it('should emit createGame event', () => {
            const emitSpy = spyOn(component.createGame, 'emit');
            component.dispatchGameCreationRequest();
            expect(emitSpy).toHaveBeenCalled();
        });

        it('shoudl set isPressed to true the false after a certain period of time', fakeAsync(() => {
            component.dispatchGameCreationRequest();
            expect(component.isPressed).toBeTrue();
            tick(ERROR_MESSAGE_DISPLAYED_TIME);
            expect(component.isPressed).toBeFalse();
        }));
    });
});
