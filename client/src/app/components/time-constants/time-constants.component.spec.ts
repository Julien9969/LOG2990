/* eslint-disable @typescript-eslint/no-empty-function */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { TimeConstantsComponent } from './time-constants.component';

describe('UploadImageSquareComponent', () => {
    let component: TimeConstantsComponent;
    let fixture: ComponentFixture<TimeConstantsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TimeConstantsComponent],
            imports: [MatIconModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TimeConstantsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });


    it('should create the component', () => {
        expect(component).toBeTruthy();
    });
});
