import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AudioService } from '@app/services/audio.service';
import { PopupDialogComponent } from './popup-dialog.component';

describe('PopupDialogComponent', () => {
    let component: PopupDialogComponent;
    let fixture: ComponentFixture<PopupDialogComponent>;
    const audioServiceSpy = jasmine.createSpyObj('AudioService', ['playAudio']);
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PopupDialogComponent>>;

    beforeEach(async () => {
        dialogRefSpy = jasmine.createSpyObj('DialogRef', ['close']);

        await TestBed.configureTestingModule({
            declarations: [PopupDialogComponent],
            imports: [MatDialogModule],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: AudioService, useValue: audioServiceSpy },
                { provide: MatDialogRef, useValue: dialogRefSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PopupDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('onInit should call playWinSound if templateName is endGame', () => {
        component.templateName = 'endGame';
        component.ngOnInit();
        expect(audioServiceSpy.playAudio).toHaveBeenCalled();
    });

    it('getClueNumber should return 10', () => {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(component.getClueNumber()).toEqual(10);
    });
});
