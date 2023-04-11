/* eslint-disable @typescript-eslint/no-empty-function */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatIconModule } from '@angular/material/icon';
import { DataResetComponent } from './data-reset.component';

describe('DataResetComponent', () => {
    let component: DataResetComponent;
    let fixture: ComponentFixture<DataResetComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DataResetComponent],
            imports: [MatIconModule],
            providers: [],
        }).compileComponents();

        fixture = TestBed.createComponent(DataResetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    
});
