import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AudioService } from '@app/services/audio/audio.service';
import { ImageOperationService } from '@app/services/image-operation/image-operation.service';
import { PopupDialogComponent } from './popup-dialog.component';

describe('PopupDialogComponent', () => {
    let component: PopupDialogComponent;
    let fixture: ComponentFixture<PopupDialogComponent>;
    const audioServiceSpy = jasmine.createSpyObj('AudioService', ['playAudio']);
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PopupDialogComponent>>;
    let imageOperationServiceSpy: jasmine.SpyObj<ImageOperationService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        dialogRefSpy = jasmine.createSpyObj('DialogRef', ['close']);
        imageOperationServiceSpy = jasmine.createSpyObj('ImageOperationServiceMock', ['clearAllIntervals']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            declarations: [PopupDialogComponent],
            imports: [MatDialogModule],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: AudioService, useValue: audioServiceSpy },
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: ImageOperationService, useValue: imageOperationServiceSpy },
                { provide: Router, useValue: routerSpy },
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
});
