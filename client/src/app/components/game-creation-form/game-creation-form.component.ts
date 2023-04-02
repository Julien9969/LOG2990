import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DrawBottomBarComponent } from '@app/components/draw-bottom-bar/draw-bottom-bar.component';
import { UploadImageSquareComponent } from '@app/components/upload-image-square/upload-image-square.component';
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
import { ActiveCanvas } from '@app/interfaces/active-canvas';
import { CommunicationService } from '@app/services/communication/communication.service';
import { DrawService } from '@app/services/draw/draw.service';
import ValidateImageService from '@app/services/validate-server/validate-image.service';
import { Coordinate } from '@common/coordinate';

@Component({
    selector: 'app-game-creation-form',
    templateUrl: './game-creation-form.component.html',
    styleUrls: ['./game-creation-form.component.scss'],
    providers: [CommunicationService, ValidateImageService],
})
export class GameCreationFormComponent implements AfterViewInit, OnDestroy {
    @Input() id: string;
    @ViewChild('mainImageSquare') mainImageSquare: UploadImageSquareComponent;
    @ViewChild('altImageSquare') altImageSquare: UploadImageSquareComponent;
    @ViewChild('drawBar') drawBar: DrawBottomBarComponent;

    errorMessage: string;
    errorMessageTimeout: ReturnType<typeof setTimeout>;
    successMessage: string;
    successMessageTimeout: ReturnType<typeof setTimeout>;

    title: string;
    differenceRadius: number = DEFAULT_RADIUS;

    isValid: boolean = false;
    differencesImageUrl: string | undefined;
    nbDifferences: number | undefined;
    isHard: boolean;

    shiftPressed: boolean = false;

    constructor(readonly drawService: DrawService, readonly communication: CommunicationService, readonly router: Router) {}

    ngAfterViewInit() {
        this.drawService.mainImageComponent = this.mainImageSquare;
        this.drawService.altImageComponent = this.altImageSquare;
        document.addEventListener('keydown', this.keyBinds);
        document.addEventListener('keyup', this.shiftUnBind);
    }

    async submitNewGame() {
        if (!this.validateTitle()) {
            this.showErrorMessage(`Erreur: veuillez entrer un titre valide [Permit: a-z, A-Z, 0-9, espace et longueur max: ${MAX_TITLE_LENGTH}]`);
            return;
        }

        const formData = await this.buildGameCreationForm();
        try {
            await this.communication.postRequest('games', formData);
            this.showSuccessMessage('Bravo! Ton jeu a été ajouté');
            setTimeout(() => {
                this.router.navigate(['/config']);
            }, TIME_BEFORE_REDIRECT);
        } catch (errorResponse: unknown) {
            if (errorResponse instanceof Error) this.showErrorMessage('Erreur: ' + errorResponse.message);
            else if (errorResponse instanceof HttpErrorResponse) this.showErrorMessage('Erreur: ' + errorResponse.error.message);
        }
    }

    async buildGameCreationForm() {
        const originalImage = await this.mainImageSquare.getImageFile();
        const altImage = await this.altImageSquare.getImageFile();

        const formData: FormData = new FormData();
        formData.append('mainFile', originalImage, originalImage.name);
        formData.append('altFile', altImage, altImage.name);
        formData.append('name', this.title);
        formData.append('radius', this.differenceRadius.toString());

        return formData;
    }

    async compareImages() {
        const originalImage = await this.mainImageSquare.getImageFile();
        const altImage = await this.altImageSquare.getImageFile();
        let result;

        try {
            result = await this.communication.compareImages(originalImage, altImage, this.differenceRadius);
        } catch (errorResponse: unknown) {
            if (errorResponse instanceof HttpErrorResponse) {
                const errMessage = errorResponse.error.message ? errorResponse.error.message : 'Le serveur ne répond pas.';
                this.showErrorMessage('Erreur: ' + errMessage);
            }
            return;
        }

        if (!result.isValid) {
            this.showErrorMessage('Erreur: Nombre de différences invalides');
            return;
        }
        this.isValid = result.isValid;
        this.isHard = result.isHard;
        this.differencesImageUrl = result.differenceImageBase64;
        this.nbDifferences = result.differenceCount;
        this.showSuccessMessage('Super, ton jeu est valide');
    }

    showInvalidImageMessage() {
        this.showErrorMessage('Erreur: Veuillez vous assurer que vos images respectent le format: BMP 24-bit 640x480');
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

    async setBothImages(imgInput: HTMLInputElement) {
        this.mainImageSquare.loadBackground(imgInput);
        this.altImageSquare.loadBackground(imgInput);
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

    keyBinds = (event: KeyboardEvent) => {
        this.shiftPressed = event.shiftKey;
        if (event.ctrlKey && event.key.toLowerCase() === 'z') {
            if (event.shiftKey) this.redo();
            else this.undo();
        }
    };

    shiftUnBind = (event: KeyboardEvent) => {
        this.shiftPressed = event.shiftKey;
    };

    undo() {
        this.drawService.undo();
    }

    redo() {
        this.drawService.redo();
    }

    replaceMainForeground() {
        this.drawService.replaceForeground(ActiveCanvas.Main);
    }

    replaceAltForeground() {
        this.drawService.replaceForeground(ActiveCanvas.Alt);
    }

    clearMainForeground() {
        this.drawService.clearForeground(ActiveCanvas.Main);
    }

    clearAltForeground() {
        this.drawService.clearForeground(ActiveCanvas.Alt);
    }

    mainCanvasMouseDown(coord: Coordinate) {
        this.drawService.startAction(coord, ActiveCanvas.Main);
    }

    altCanvasMouseDown(coord: Coordinate) {
        this.drawService.startAction(coord, ActiveCanvas.Alt);
    }

    mainCanvasMouseMove(coord: Coordinate) {
        this.drawService.onMouseMove(coord, ActiveCanvas.Main, this.shiftPressed);
    }

    altCanvasMouseMove(coord: Coordinate) {
        this.drawService.onMouseMove(coord, ActiveCanvas.Alt, this.shiftPressed);
    }

    onMouseUp() {
        this.drawService.cancelAction();
    }

    ngOnDestroy() {
        document.removeEventListener('keydown', this.keyBinds);
        document.removeEventListener('keyup', this.shiftUnBind);
    }
}
