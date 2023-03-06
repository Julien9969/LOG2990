/* eslint-disable @typescript-eslint/no-empty-function */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { PATH_TO_VALID_IMAGE } from '@app/constants/utils-constants';
import { UploadImageSquareComponent } from './upload-image-square.component';

describe('UploadImageSquareComponent', () => {
    let component: UploadImageSquareComponent;
    let fixture: ComponentFixture<UploadImageSquareComponent>;
    let validInput: HTMLInputElement;
    // let validURL: string;
    let emptyInput: HTMLInputElement;

    // let uploadImageEventSpy: jasmine.Spy;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [UploadImageSquareComponent],
            imports: [MatIconModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(UploadImageSquareComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    beforeEach(async () => {
        validInput = document.createElement('input');
        validInput.type = 'file';
        const validFile = new File([await (await fetch(PATH_TO_VALID_IMAGE)).blob()], 'valid-image.BMP', { type: 'image/bmp' });
        const dataTransfer = new DataTransfer();

        dataTransfer.items.add(validFile);
        validInput.files = dataTransfer.files;
        // validURL = URL.createObjectURL(validFile);

        emptyInput = document.createElement('input');
        emptyInput.type = 'file';
    });

    beforeEach(() => {
        // uploadImageEventSpy = spyOn(component.uploadImage, 'emit').and.callThrough();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    // describe('dispatchUploadEvent', () => {
    //     it('should emit uploadImage event when there is an image', () => {
    //         component.dispatchUploadEvent(validInput);
    //         expect(uploadImageEventSpy).toHaveBeenCalled();
    //     });

    //     it('should not emit uploadImage event when there is no image', () => {
    //         component.dispatchUploadEvent(emptyInput);
    //         expect(emptyInput.files?.length).toBeFalsy();
    //         expect(uploadImageEventSpy).not.toHaveBeenCalled();
    //     });

    //     it('should not emit uploadImage event when input is not of type file', () => {
    //         validInput.type = 'text';
    //         component.dispatchUploadEvent(validInput);
    //         expect(uploadImageEventSpy).not.toHaveBeenCalled();
    //     });
    // });

    // describe('getImageURL', () => {
    //     it('should return an usable URL of an image', () => {
    //         component.imageURL = validURL;
    //         expect(component.getImageURL().toString().includes(validURL)).toBeTrue();
    //     });
    // });

    // describe('dispatchClearImage', () => {
    //     it('should emit clearImage event', () => {
    //         const clearImageEventSpy = spyOn(component.clearImage, 'emit').and.callFake(() => {});
    //         component.dispatchClearImage();
    //         expect(clearImageEventSpy).toHaveBeenCalled();
    //     });

    //     it('should clear the input value', () => {
    //         component.imageInput.value = 'test';
    //         component.dispatchClearImage();
    //         expect(component.imageInput.value).toBe('');
    //     });
    // });
});
