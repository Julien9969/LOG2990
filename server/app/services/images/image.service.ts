import { IMAGE_FOLDER_PATH, IMAGE_FORMAT, IMAGE_ID_CAP } from '@app/services/constants/services.const';
import { DifferenceDetectionService } from '@app/services/difference-detection/difference-detection.service';
import { ImageComparisonResult } from '@common/image-comparison-result';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as Jimp from 'jimp';

@Injectable()
export class ImageService {
    /**
     * Retourne la liste des IDs des images dans la persistance
     *
     * @returns Liste des IDs d'images existants
     */
    getAllImageIds(): number[] {
        const fileNames: string[] = fs.readdirSync(IMAGE_FOLDER_PATH);
        const imageIds = fileNames.map((name: string) => {
            return parseInt(name.split('.')[0], 10);
        });
        return imageIds;
    }

    /**
     * Retourne une image en fonction de son id
     *
     * @param id
     */
    getImage(id: number): Buffer {
        if (this.imageExists(id)) {
            return fs.readFileSync(this.getPath(id));
        }
    }

    /**
     * Sauvegarde une image en persistance
     *
     * @param imageData Le buffer contenant l'image
     */
    saveImage(imageData: Buffer): number {
        const newImageId = this.generateId();
        const imagePath = this.getPath(newImageId);

        fs.writeFileSync(imagePath, imageData);

        return newImageId;
    }

    /**
     * Supprime une image de la persistance
     *
     * @param id Le ID de l'image à supprimer
     */
    deleteImage(id: number) {
        if (this.imageExists(id)) {
            fs.unlinkSync(this.getPath(id));
        } else {
            throw new Error('Image non existante.');
        }
    }

    /**
     * Compare 2 images sans créer de jeu, en suivant les règles de comparaison
     *
     * @param mainId L'ID de l'image principale
     * @param altId L'ID de l'image alternative
     * @param radius Le rayon d'élargissement
     * @returns Le résultat de la comparaison
     */
    async compareImages(mainId: number, altId: number, radius: number): Promise<ImageComparisonResult> {
        if (!this.imageExists(mainId) || !this.imageExists(altId)) {
            throw new Error('Image ID pas trouve.');
        } else {
            const diffDetectionService: DifferenceDetectionService = new DifferenceDetectionService();
            await diffDetectionService.compareImagePaths(this.getPath(mainId), this.getPath(altId), radius);

            // Création de l'objet résultat et sauvegarde des différences
            const result: ImageComparisonResult = diffDetectionService.getComparisonResult();
            if (result.isValid) {
                this.saveDifferenceImage(result, diffDetectionService);
            }

            return result;
        }
    }

    /**
     * Retourne le chemin d'une image en fonction de son identifiant.
     *
     * @param imageId L'identifiant de l'image
     * @returns Le chemin de l'image
     */
    getPath(imageId: number): string {
        return IMAGE_FOLDER_PATH + '/' + imageId + '.' + IMAGE_FORMAT;
    }

    /**
     * Vérifie si une image d'un certain identifiant existe
     *
     * @param findID L'identifiant de l'image recherchée
     * @returns Si l'image de cet identifiant existe ou non.
     */
    imageExists(findID: number): boolean {
        const imageList: number[] = this.getAllImageIds();
        return imageList.includes(findID);
    }

    /**
     * Génère un identifiant aléatoire et unique pour une nouvelle image.
     *
     * @returns L'identifiant généré
     */
    generateId(): number {
        let id: number;
        while (id === undefined || this.imageExists(id)) {
            id = Math.floor(Math.random() * IMAGE_ID_CAP);
        }
        return id;
    }

    private saveDifferenceImage(result: ImageComparisonResult, diffDetectionService: DifferenceDetectionService) {
        // On sauvegarde l'image de difference pour pouvoir la renvoyer au client
        const diffImage: Jimp = diffDetectionService.generateDifferenceImage();
        const newImageId = this.generateId();

        diffImage.write(this.getPath(newImageId));
        result.differenceImageId = newImageId;
    }
}
