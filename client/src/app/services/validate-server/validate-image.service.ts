import { Injectable } from '@angular/core';
import { BIT_PER_BYTE, IMAGE_HEIGHT, IMAGE_WIDTH, PERMITTED_BITE_SIZE } from '@app/constants/utils-constants';

@Injectable({
    providedIn: 'root',
})
export default class ValidateImageService {
    /**
     * @param imageElement l'element HTML sur lequel l'image est affiché
     * @param userUpload l'input contenant l'image a upload
     */
    async validateImage(userUpload: HTMLInputElement | File) {
        const image = await this.generateImage(userUpload);
        if (userUpload instanceof HTMLInputElement) {
            if (userUpload.files?.length) userUpload = userUpload.files[0];
            else return false;
        }

        return (await this.validateBitDepth(userUpload)) && (await this.validateResolution(image));
    }

    /**
     * vérifie la hauteur et la largeur en pixel de l'image
     *
     * @param imageURL le url de l'image à valider
     * @returns bool de si l'image est de la bonne hauteur et largeur en pixels
     */
    validateResolution(image: HTMLImageElement) {
        return image.naturalWidth === IMAGE_WIDTH && image.naturalHeight === IMAGE_HEIGHT;
    }

    /**
     * calcule l'espace d'une image (bit) et vérifie
     * si elle est de 24-bit
     *
     * @param imageFile le fichier contenant l'image à valider
     * @returns bool de si la grosseur en espace mémoire de l'image est permit
     */
    async validateBitDepth(imageFile: File) {
        const image = await this.generateImage(imageFile);
        return Math.floor((imageFile.size / image.naturalWidth / image.naturalHeight) * BIT_PER_BYTE) === PERMITTED_BITE_SIZE;
    }

    /**
     * Converts an input[type=file] or a File into an image
     *
     * @param imgInput HTMLInputElement or File to convert
     * @returns the image generated from the imgInput
     */
    async generateImage(imgInput: HTMLInputElement | File): Promise<HTMLImageElement> {
        const image = new Image();
        if (imgInput instanceof File) {
            image.src = URL.createObjectURL(imgInput);
        } else if (imgInput.files?.length) {
            image.src = URL.createObjectURL(imgInput.files[0]);
        } else return image;
        await image.decode();
        return image;
    }
}
