import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HistoryPopupComponent } from './history-popup.component';
import { HistoryService } from '@app/services/history.service';

describe('HistoryPopupComponent', () => {
    let component: HistoryPopupComponent;
    let fixture: ComponentFixture<HistoryPopupComponent>;
    const historyServiceSpy = jasmine.createSpyObj('historyServiceSpy', [
        'getHistory',
        'deleteHistory',
        'initHistory',
        'setGameMode',
        'setPlayers',
        'playerWon',
        'playerQuit',
    ]);
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<HistoryPopupComponent>>;

    beforeEach(async () => {
        dialogRefSpy = jasmine.createSpyObj('DialogRef', ['close']);

        await TestBed.configureTestingModule({
            declarations: [HistoryPopupComponent],
            imports: [MatDialogModule],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: HistoryService, useValue: historyServiceSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HistoryPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('onInit should call getHistory', () => {
        component.ngOnInit();
        expect(historyServiceSpy.getHistory).toHaveBeenCalled();
    });
});
