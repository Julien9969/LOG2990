import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawBottomBarComponent } from './draw-bottom-bar.component';

describe('DrawSidebarComponent', () => {
    let component: DrawBottomBarComponent;
    let fixture: ComponentFixture<DrawBottomBarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DrawBottomBarComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DrawBottomBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
