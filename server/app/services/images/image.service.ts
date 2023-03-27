import { IMAGE_FOLDER_PATH, IMAGE_FORMAT, IMAGE_HEIGHT, IMAGE_ID_CAP, IMAGE_WIDTH } from '@app/services/constants/services.const';
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
     * @param imageData Le buffer contenant les données bitmap de l'image
     */
    saveImage(imageData: Buffer): number {
        const newImageId = this.generateId();
        const imagePath = this.getPath(newImageId);

        // eslint-disable-next-line -- La fonction vide est indispensable pour le constructeur de Jimp
        const image = new Jimp({ data: imageData, width: IMAGE_WIDTH, height: IMAGE_HEIGHT }, () => {});
        image.write(imagePath);
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
            throw new Error('Image non existante');
        }
    }

    /**
     * Compare 2 images sans créer de jeu, en suivant les règles de comparaison
     *
     * @param mainImageBitmap Les données bitmap de l'image principale
     * @param altImageBitmap Les données bitmap de l'image alternative
     * @param radius Le rayon d'élargissement
     * @returns Le résultat de la comparaison
     */
    async compareImages(mainImageBitmap: Buffer, altImageBitmap: Buffer, radius: number): Promise<ImageComparisonResult> {
        const diffDetectionService: DifferenceDetectionService = new DifferenceDetectionService();
        await diffDetectionService.compareImages(mainImageBitmap, altImageBitmap, radius);

        // Création de l'objet résultat et sauvegarde des différences
        const result: ImageComparisonResult = diffDetectionService.getComparisonResult();
        if (result.isValid) {
            const diffImage = diffDetectionService.generateDifferenceImage();

            result.differenceImageBase64 = await this.imageToBase64(diffImage);
        }

        return result;
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
    private imageExists(findID: number): boolean {
        const imageList: number[] = this.getAllImageIds();
        return imageList.includes(findID);
    }

    /**
     * Génère un identifiant aléatoire et unique pour une nouvelle image.
     *
     * @returns L'identifiant généré
     */
    private generateId(): number {
        let id: number;
        while (id === undefined || this.imageExists(id)) {
            id = Math.floor(Math.random() * IMAGE_ID_CAP);
        }
        return id;
    }

    private async imageToBase64(image: Jimp): Promise<string> {
        return new Promise((resolve, reject) => {
            image.getBase64(Jimp.MIME_PNG, (err, base64Str) => {
                if (err) reject(err);
                resolve(base64Str);
            });
        });
    }
}
