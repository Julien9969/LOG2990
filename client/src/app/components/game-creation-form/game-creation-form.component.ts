import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
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
    MAX_TITLE_LENGTH,
    MESSAGE_DISPLAYED_TIME,
    // bug de prettier qui rentre en conflit avec eslint (pas de virgule pour le dernier élément d'un tableau)
    // eslint-disable-next-line prettier/prettier
    TIME_BEFORE_REDIRECT,
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

    errorMessage: string;
    successMessage: string;

    title: string;
    differenceRadius: number = DEFAULT_RADIUS;

    isValid: boolean = false;
    differencesImageUrl: string | undefined;
    nbDifferences: number | undefined;
    isHard: boolean;

    private messageTimeout: ReturnType<typeof setTimeout>;

    private shiftPressed: boolean = false;

    constructor(readonly drawService: DrawService, readonly communication: CommunicationService, readonly router: Router) {}

    ngAfterViewInit() {
        this.drawService.mainImageComponent = this.mainImageSquare;
        this.drawService.altImageComponent = this.altImageSquare;
        document.addEventListener('keydown', this.bindsKey);
        document.addEventListener('keyup', this.shiftUnBind);
    }

    async submitNewGame() {
        if (!this.validateTitle()) {
            this.showMessages(`Erreur: veuillez entrer un titre valide [Permit: a-z, A-Z, 0-9, espace et longueur max: ${MAX_TITLE_LENGTH}]`, true);
            return;
        }

        const formData = await this.buildGameCreationForm();
        try {
            await this.communication.postRequest('games', formData);
            this.showMessages('Bravo! Ton jeu a été ajouté');
            setTimeout(() => {
                this.router.navigate(['/config']);
            }, TIME_BEFORE_REDIRECT);
        } catch (errorResponse: unknown) {
            if (errorResponse instanceof Error) this.showMessages('Erreur: ' + errorResponse.message, true);
            else if (errorResponse instanceof HttpErrorResponse) this.showMessages('Erreur: ' + errorResponse.error.message, true);
        }
    }

    async buildGameCreationForm() {
        const originalImage = this.mainImageSquare.getImageFile();
        const altImage = this.altImageSquare.getImageFile();

        const formData: FormData = new FormData();
        formData.append('mainFile', originalImage, originalImage.name);
        formData.append('altFile', altImage, altImage.name);
        formData.append('name', this.title);
        formData.append('radius', this.differenceRadius.toString());

        return formData;
    }

    async compareImages() {
        const originalImage = this.mainImageSquare.getImageFile();
        const altImage = this.altImageSquare.getImageFile();
        let result;

        try {
            result = await this.communication.compareImages(originalImage, altImage, this.differenceRadius);
        } catch (errorResponse: unknown) {
            if (errorResponse instanceof HttpErrorResponse) {
                const errMessage = errorResponse.error.message ? errorResponse.error.message : 'Le serveur ne répond pas.';
                this.showMessages('Erreur: ' + errMessage, true);
            }
            return;
        }

        if (!result.isValid) {
            this.showMessages('Erreur: Nombre de différences invalides', true);
            return;
        }
        this.isValid = result.isValid;
        this.isHard = result.isHard;
        this.differencesImageUrl = result.differenceImageBase64;
        this.nbDifferences = result.differenceCount;
        this.showMessages('Super, ton jeu est valide');
    }

    showInvalidImageMessage() {
        this.showMessages('Erreur: Veuillez vous assurer que vos images respectent le format: BMP 24-bit 640x480', true);
    }

    showMessages(message: string, isError?: boolean) {
        this.errorMessage = '';
        this.successMessage = '';

        if (isError) {
            this.errorMessage = message;
        } else {
            this.successMessage = message;
        }
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }
        this.messageTimeout = setTimeout(() => {
            this.errorMessage = '';
            this.successMessage = '';
        }, MESSAGE_DISPLAYED_TIME);
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
            if (this.isAsciiCorrectLetter(codeAscii)) {
                return false;
            }
        }
        return true;
    }

    isAsciiCorrectLetter(codeAscii: number) {
        return (
            !(codeAscii >= ASCII_START_LOWERCASE_LETTERS && codeAscii <= ASCII_END_LOWERCASE_LETTERS) &&
            !(codeAscii >= ASCII_START_UPPERCASE_LETTERS && codeAscii <= ASCII_END_UPPERCASE_LETTERS) &&
            !(codeAscii >= ASCII_START_NUMBERS && codeAscii <= ASCII_END_NUMBERS) &&
            codeAscii !== ASCII_SPACE
        );
    }

    setRadius(index: string) {
        if (ALLOWED_RADIUS.length > Number(index)) {
            this.differenceRadius = ALLOWED_RADIUS[Number(index)];
        } else {
            this.errorMessage = `Error: invalid difference radius entered\n (please use the slider) ${Number(index)}`;
        }
        this.isValid = false;
    }

    bindsKey = (event: KeyboardEvent) => {
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

    startMouseDownMainCanvas(coord: Coordinate) {
        this.drawService.startAction(coord, ActiveCanvas.Main);
    }

    startMouseDownAltCanvas(coord: Coordinate) {
        this.drawService.startAction(coord, ActiveCanvas.Alt);
    }

    startMouseMoveMainCanvas(coord: Coordinate) {
        this.drawService.onMouseMove(coord, ActiveCanvas.Main, this.shiftPressed);
    }

    startMouseMoveAltCanvas(coord: Coordinate) {
        this.drawService.onMouseMove(coord, ActiveCanvas.Alt, this.shiftPressed);
    }

    onMouseUp() {
        this.drawService.cancelAction();
    }

    ngOnDestroy() {
        document.removeEventListener('keydown', this.bindsKey);
        document.removeEventListener('keyup', this.shiftUnBind);
    }
}
