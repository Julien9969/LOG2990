import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import {
    ALLOWED_RADIUS,
    ASCII_END_LOWERCASE_LETTERS,
    ASCII_END_NUMBERS,
    ASCII_END_UPPERCASE_LETTERS,
    ASCII_SPACE,
    ASCII_START_LOWERCASE_LETTERS,
    ASCII_START_NUMBERS,
    ASCII_START_UPPERCASE_LETTERS,
    DEFAULT_RADIUS,
    ERROR_MESSAGE_DISPLAYED_TIME,
    MAX_TITLE_LENGTH,
    SUCCESS_MESSAGE_DISPLAYED_TIME,
    // bug de prettier qui rentre en conflit avec eslint (pas de virgule pour le dernier élément d'un tableau)
    // eslint-disable-next-line prettier/prettier
    TIME_BEFORE_REDIRECT
} from '@app/constants/utils-constants';
import { CommunicationService } from '@app/services/communication.service';
import ValidateImageService from '@app/services/validate-image.service';

@Component({
    selector: 'app-game-creation-form',
    templateUrl: './game-creation-form.component.html',
    styleUrls: ['./game-creation-form.component.scss'],
    providers: [CommunicationService, ValidateImageService],
})
export class GameCreationFormComponent {
    @Input() id: string;

    errorMessage: string;
    errorMessageTimeout: ReturnType<typeof setTimeout>;
    successMessage: string;
    successMessageTimeout: ReturnType<typeof setTimeout>;

    title: string;
    differenceRadius: number = DEFAULT_RADIUS;

    originalImage: File | null = null;
    originalImageURL: string | undefined;
    originalImageId: number | undefined;

    altImage: File | null = null;
    altImageURL: string | undefined;
    altImageId: number | undefined;

    isValid: boolean = false;
    differencesImageUrl: string | undefined;
    nbDifferences: number | undefined;
    isHard: boolean;

    constructor(readonly communication: CommunicationService, readonly validateImage: ValidateImageService, readonly router: Router) {}

    async submitNewGame() {
        if (!(this.differenceRadius && this.originalImageId && this.altImageId)) {
            this.showErrorMessage('Erreur: informations manquantes pour créer un jeu');
            return;
        }
        if (!this.validateTitle()) {
            this.showErrorMessage(`Erreur: veuillez entrer un titre valide [Permit: a-z, A-Z, 0-9, espace et longueur max: ${MAX_TITLE_LENGTH}]`);
            return;
        }
        const game = {
            name: this.title,
            radius: this.differenceRadius,
            imageMain: this.originalImageId,
            imageAlt: this.altImageId,
        };
        try {
            await this.communication.postRequest('games', game);
            this.showSuccessMessage('Bravo! Ton jeu a été ajouté');
            setTimeout(() => {
                this.router.navigate(['/config']);
            }, TIME_BEFORE_REDIRECT);
        } catch (errorResponse: unknown) {
            if (errorResponse instanceof Error) this.showErrorMessage('Erreur: ' + errorResponse.message);
            else if (errorResponse instanceof HttpErrorResponse) this.showErrorMessage('Erreur: ' + errorResponse.error.message);
        }
    }

    async validateImageDifferences() {
        if (this.originalImage !== null && this.altImage !== null) {
            let result;
            let originalImageId;
            let altImageId;
            try {
                originalImageId = await this.communication.saveImage(this.originalImage);
                altImageId = await this.communication.saveImage(this.altImage);
                result = await this.communication.compareImages(originalImageId, altImageId, this.differenceRadius);
            } catch (errorResponse: unknown) {
                if (errorResponse instanceof HttpErrorResponse) {
                    this.showErrorMessage('Erreur: ' + errorResponse.error.message);
                    this.clearOriginalImage();
                    this.clearAltImage();
                }
                return;
            }
            if (!result.isValid) {
                this.showErrorMessage('Erreur: Nombre de différences invalides');
                this.clearOriginalImage();
                this.clearAltImage();
                return;
            }
            this.isValid = result.isValid;
            this.originalImageId = originalImageId;
            this.altImageId = altImageId;
            this.isHard = result.isHard;
            this.differencesImageUrl = this.communication.getImageURL(result.differenceImageId);
            this.nbDifferences = result.differenceCount;
            this.showSuccessMessage('Super, ton jeu est valide');
        } else this.showErrorMessage("Erreur: Veuillez entrer 2 images pour commencer l'analyse");
    }

    async validateUploadedImage(imgInput: HTMLInputElement | File): Promise<boolean> {
        if (!(await this.validateImage.validateImage(imgInput))) {
            this.showErrorMessage('Erreur: Veuillez vous assurer que vos images respectent le format: BMP 24-bit 640x480');
            return false;
        }
        return true;
    }

    showSuccessMessage(message: string) {
        this.successMessage = message;
        if (this.successMessageTimeout) {
            clearTimeout(this.successMessageTimeout);
        }
        this.successMessageTimeout = setTimeout(() => {
            this.successMessage = '';
        }, SUCCESS_MESSAGE_DISPLAYED_TIME);
    }
    showErrorMessage(message: string) {
        this.errorMessage = message;
        if (this.errorMessageTimeout) {
            clearTimeout(this.errorMessageTimeout);
        }
        this.errorMessageTimeout = setTimeout(() => {
            this.errorMessage = '';
        }, ERROR_MESSAGE_DISPLAYED_TIME);
    }

    clearOriginalImage() {
        this.originalImage = null;
        this.originalImageURL = undefined;
        this.originalImageId = undefined;
        this.isValid = false;
    }
    clearAltImage() {
        this.altImage = null;
        this.altImageURL = undefined;
        this.altImageId = undefined;
        this.isValid = false;
    }

    async handleOriginalImageUpload(image: File) {
        if (await this.validateUploadedImage(image)) {
            this.originalImage = image;
            this.originalImageURL = URL.createObjectURL(image);
            this.isValid = false;
        }
    }
    async handleAltImageUpload(image: File) {
        if (await this.validateUploadedImage(image)) {
            this.altImage = image;
            this.altImageURL = URL.createObjectURL(image);
            this.isValid = false;
        }
    }

    async setBothImages(imgInput: HTMLInputElement) {
        if (imgInput.files?.length) {
            this.handleAltImageUpload(imgInput.files[0]);
            this.handleOriginalImageUpload(imgInput.files[0]);
        }
        imgInput.value = '';
    }
    setTitle(title: string) {
        this.title = title;
    }
    validateTitle() {
        if (!this.title) return false;
        if (this.title.length > MAX_TITLE_LENGTH) return false;
        if (this.title.charCodeAt(0) === ASCII_SPACE || this.title.charCodeAt(this.title.length - 1) === ASCII_SPACE) return false;

        for (let i = 0; i < this.title.length; i++) {
            const codeAscii = this.title.charCodeAt(i);
            if (
                !(codeAscii >= ASCII_START_LOWERCASE_LETTERS && codeAscii <= ASCII_END_LOWERCASE_LETTERS) &&
                !(codeAscii >= ASCII_START_UPPERCASE_LETTERS && codeAscii <= ASCII_END_UPPERCASE_LETTERS) &&
                !(codeAscii >= ASCII_START_NUMBERS && codeAscii <= ASCII_END_NUMBERS) &&
                codeAscii !== ASCII_SPACE
            ) {
                return false;
            }
        }
        return true;
    }
    setRadius(index: string) {
        if (ALLOWED_RADIUS.length > Number(index)) {
            this.differenceRadius = ALLOWED_RADIUS[Number(index)];
        } else {
            this.errorMessage = `Error: invalid difference radius entered\n (please use the slider) ${Number(index)}`;
        }
        this.isValid = false;
    }
}
