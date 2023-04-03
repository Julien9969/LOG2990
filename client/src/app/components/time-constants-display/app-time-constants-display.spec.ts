/* eslint-disable @typescript-eslint/no-empty-function */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { TimeConstantsDisplay } from './app-time-constants-display';

describe('UploadImageSquareComponent', () => {
    let component: TimeConstantsDisplay;
    let fixture: ComponentFixture<TimeConstantsDisplay>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TimeConstantsDisplay],
            imports: [MatIconModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TimeConstantsDisplay);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });


    it('should create the component', () => {
        expect(component).toBeTruthy();
    });
});
