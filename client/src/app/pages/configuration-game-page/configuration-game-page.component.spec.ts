/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-magic-numbers */
// eslint-disable-next-line max-classes-per-file
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ConfigurationGameComponent } from './configuration-game-page.component';
@Component({
    selector: 'app-square-interface',
    template: '',
    styleUrls: [],
})
export class StubSquareInterfaceComponent {
    @Input() configPage: boolean = false;
}

describe('ConfigurationGameComponent', () => {
    let component: ConfigurationGameComponent;
    let fixture: ComponentFixture<ConfigurationGameComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConfigurationGameComponent, StubSquareInterfaceComponent],
            imports: [MatIconModule, MatToolbarModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfigurationGameComponent);
        fixture = TestBed.createComponent(ConfigurationGameComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
