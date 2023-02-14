/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-magic-numbers */
// eslint-disable-next-line max-classes-per-file
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { GameSelectionPageComponent } from './game-selection-page.component';

@Component({
    selector: 'app-square-interface',
    template: '',
    styleUrls: [],
})
export class StubSquareInterfaceComponent {
    @Input() configPage: boolean = false;
}

describe('GameSelectionPageComponent', () => {
    let component: GameSelectionPageComponent;
    let fixture: ComponentFixture<GameSelectionPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GameSelectionPageComponent, StubSquareInterfaceComponent],
            imports: [MatIconModule, MatToolbarModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GameSelectionPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
