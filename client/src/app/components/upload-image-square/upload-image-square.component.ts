import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'app-upload-image-square',
    templateUrl: './upload-image-square.component.html',
    styleUrls: ['./upload-image-square.component.scss'],
})
export class UploadImageSquareComponent {
    @ViewChild('imageInput') imageInput: HTMLInputElement;
    @Input() id: string;
    @Input() title: string;
    @Input() imageURL: string;

    @Output() uploadImage: EventEmitter<File> = new EventEmitter<File>();
    @Output() clearImage: EventEmitter<undefined> = new EventEmitter<undefined>();
    component: HTMLInputElement;

    constructor(private sanitizer: DomSanitizer) {}

    dispatchUploadEvent(imageInput: HTMLInputElement) {
        if (imageInput.files?.length) {
            this.uploadImage.emit(imageInput.files[0]);
        }
        imageInput.value = '';
    }
    getImageURL() {
        return this.sanitizer.bypassSecurityTrustUrl(this.imageURL);
    }

    dispatchClearImage() {
        this.clearImage.emit();
        this.imageInput.value = '';
    }
}
