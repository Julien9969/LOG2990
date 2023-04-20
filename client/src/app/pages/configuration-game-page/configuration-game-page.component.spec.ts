/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-magic-numbers */
// eslint-disable-next-line max-classes-per-file
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HistoryPopupComponent } from '@app/components/history-popup/history-popup.component';
import { CommunicationService } from '@app/services/communication/communication.service';
import { ConfigurationGameComponent } from './configuration-game-page.component';
@Component({
    selector: 'app-square-interface',
    template: '',
    styleUrls: [],
})
export class StubSquareInterfaceComponent {
    @Input() configPage: boolean = false;
}

@Component({
    selector: 'app-time-constants',
    template: '<span></span>',
})
class StubTimeConstantsComponent {}

@Component({
    selector: 'app-data-reset',
    template: '<span></span>',
})
class StubDataResetComponent {}

describe('ConfigurationGameComponent', () => {
    let component: ConfigurationGameComponent;
    let fixture: ComponentFixture<ConfigurationGameComponent>;
    const dialogSpy = jasmine.createSpyObj('DialogMock', ['open', 'closeAll']);
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConfigurationGameComponent, StubTimeConstantsComponent, StubDataResetComponent, StubSquareInterfaceComponent],
            imports: [MatIconModule, MatToolbarModule],
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                { provide: CommunicationService, useValue: communicationServiceSpy },
            ],
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

    it('openHistoryDialog should call closeAll and open with the right parameters', () => {
        component.openHistoryDialog();
        expect(component['dialog'].closeAll).toHaveBeenCalled();
        expect(component['dialog'].open).toHaveBeenCalledWith(HistoryPopupComponent, {
            closeOnNavigation: true,
            disableClose: true,
            autoFocus: false,
        });
    });
});
