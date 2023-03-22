import {
    BLACK_RGBA,
    DIFFERENCE_LISTS_FOLDER,
    DIFFERENCE_LISTS_PREFIX,
    GAME_MAX_DIFF_COUNT,
    GAME_MIN_DIFF_COUNT,
    HARD_GAME_MAX_DIFF_PROPORTION,
    HARD_GAME_MIN_DIFF_COUNT,
    IMAGE_HEIGHT,
    IMAGE_WIDTH,
    VALID_RADIUS_LIST,
    // bug de prettier qui rentre en conflit avec eslint (pas de virgule pour le dernier élément d'un tableau)
    // eslint-disable-next-line prettier/prettier
    WHITE_RGBA
} from '@app/services/constants/services.const';
import { CoordSetObject } from '@app/services/disjoint-sets/coord-set-object';
import { DisjointSet } from '@app/services/disjoint-sets/disjoint-sets';
import { Coordinate } from '@common/coordinate';
import { ImageComparisonResult } from '@common/image-comparison-result';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as Jimp from 'jimp';

/**
 * Service d'analyse des différences entre 2 images.
 */
@Injectable()
export class DifferenceDetectionService {
    readonly directNeighboursCoordinates: CoordSetObject[] = [
        { x: -1, y: -1 },
        { x: 0, y: -1 },
        { x: +1, y: -1 },
        { x: -1, y: 0 },
        { x: +1, y: 0 },
        { x: -1, y: +1 },
        { x: 0, y: +1 },
        { x: +1, y: +1 },
    ];

    mainImage: Jimp;
    altImage: Jimp;

    // Rayon d'élargissement de détection de différences
    radius: number = 0;
    // Difficulté des différences
    isDifficult: boolean = false;
    // Image des différences brutes de pixels entre les 2 images originales
    rawDiffImage: Jimp;
    diffProportion: number;
    // Tableau des coordonnées de pixels différents suite à l'élargissement
    //      Contient un objet nul lorsque le pixel n'est pas une difference
    extendedDiffs: CoordSetObject[][];
    // Structure d'ensembles disjoints, contenant les pixels d'une même
    //      différence contigue dans le même ensemble
    contiguousDifferencesSet: DisjointSet;

    extensionCoordinates: CoordSetObject[] = null;

    /**
     * Compare 2 images, établissement leurs différences contigues
     *
     * @param mainImage L'image principale
     * @param altImage L'image secondaire à comparer
     */
    compareImages(mainImageBitmap: Buffer, altImageBitmap: Buffer, extensionRadius: number = 0) {
        // eslint-disable-next-line -- La fonction vide est indispensable pour le constructeur de Jimp
        const mainImage = new Jimp({ data: mainImageBitmap, width: IMAGE_WIDTH, height: IMAGE_HEIGHT }, () => {});
        // eslint-disable-next-line -- La fonction vide est indispensable pour le constructeur de Jimp
        const altImage = new Jimp({ data: altImageBitmap, width: IMAGE_WIDTH, height: IMAGE_HEIGHT }, () => {});

        // Initialisation des objets et des images
        this.differenceInitialization(extensionRadius);
        this.loadImages(mainImage, altImage);

        // Calcul des différences entre les 2 images
        this.computeRawDifferences(); // Recherche des différences brutes entres les 2 images
        this.extendRawDifferences(); // Application du rayon d'élargissement
        this.computeContiguousDifferences(); // Recherche des différences contigues (ensembles)

        this.setDifficulty();
    }

    /**
     * Calcule la difficulté d'un
     */
    setDifficulty() {
        this.isDifficult = this.getDifferenceCount() >= HARD_GAME_MIN_DIFF_COUNT && this.diffProportion <= HARD_GAME_MAX_DIFF_PROPORTION;
    }

    /**
     * Permet de sauvegarder les résultats de l'analyse des différences dans le serveur
     *
     * @param gameId L'identifiant unique du jeu (permet d'identifier la paire d'images)
     */
    saveDifferenceLists(gameId: string) {
        const differenceLists: Coordinate[][] = this.contiguousDifferencesSet.getSetLists().map((coordList: CoordSetObject[]) => {
            return coordList.map((coord) => {
                return {
                    x: coord.x,
                    y: coord.y,
                };
            });
        });
        const diffJson: string = JSON.stringify(differenceLists);
        fs.writeFileSync(`${DIFFERENCE_LISTS_FOLDER}/${DIFFERENCE_LISTS_PREFIX}${gameId}.json`, diffJson);
    }

    /**
     * Récupère le résultat du calcul de différence
     *
     * @returns Le résultat de la comparaison d'images
     */
    getComparisonResult(): ImageComparisonResult {
        return {
            isValid: this.isValidGame(),
            differenceCount: this.getDifferenceCount(),
            isHard: this.isDifficultGame(),
        };
    }

    /**
     * @returns Le nombre de différences dans l'image
     */
    getDifferenceCount(): number {
        return this.contiguousDifferencesSet.getSetLists().length;
    }

    /**
     * @returns Difficulté du jeu
     */
    isDifficultGame(): boolean {
        return this.isDifficult;
    }

    /**
     * @returns Validité du jeu selon les contraintes d'images
     */
    isValidGame(): boolean {
        const diffNumber = this.getDifferenceCount();
        return diffNumber >= GAME_MIN_DIFF_COUNT && diffNumber <= GAME_MAX_DIFF_COUNT;
    }

    /**
     * Génère l'image de différences, en noir sur blanc, en fonction des images comparées.
     *
     * @returns L'image de différences
     */
    generateDifferenceImage(): Jimp {
        const differencesImage: Jimp = new Jimp(IMAGE_WIDTH, IMAGE_HEIGHT, WHITE_RGBA);
        const differences: { x: number; y: number }[][] = this.contiguousDifferencesSet.getSetLists();

        const differenceColour: number = BLACK_RGBA;
        differences.forEach((diff) => {
            // differenceColour = ((idx + 1) * 0x325253ff) % 0xffffffff;
            diff.forEach((pixel) => {
                if (pixel) {
                    differencesImage.setPixelColour(differenceColour, pixel.x, pixel.y);
                }
            });
        });

        return differencesImage;
    }

    private computeRawDifferences() {
        // Calcule les pixels différents entre les 2 images, en noir sur blanc
        this.rawDiffImage = new Jimp(IMAGE_WIDTH, IMAGE_HEIGHT, WHITE_RGBA);
        let differencePixelCount = 0;

        this.rawDiffImage.scan(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT, (x: number, y: number) => {
            // Operation bitwise ( | 0xFF ) qui permet d'ignorer la composante de transparence alpha,
            // qui n'est pas utilisée dans les images venues du client
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers, no-bitwise
            if ((this.mainImage.getPixelColor(x, y) | 0xff) !== (this.altImage.getPixelColor(x, y) | 0xff)) {
                this.rawDiffImage.setPixelColor(BLACK_RGBA, x, y);
                differencePixelCount++;
            }
        });
        this.diffProportion = differencePixelCount / (IMAGE_WIDTH * IMAGE_HEIGHT);
    }

    private loadImages(mainImage: Jimp, altImage: Jimp) {
        if (mainImage.getWidth() !== IMAGE_WIDTH || mainImage.getHeight() !== IMAGE_HEIGHT) {
            throw new Error('Dimensions images invalides.');
        }
        this.mainImage = mainImage;
        this.altImage = altImage;
    }

    /* Fonction d'initialisation, avant de comparer 2 images */
    private differenceInitialization(extensionRadius: number) {
        if (!VALID_RADIUS_LIST.includes(extensionRadius)) {
            throw new Error('Rayon elargissement invalide.');
        }
        this.radius = extensionRadius;
        this.extensionCoordinates = this.computeRadiusExtension(extensionRadius);
        this.extendedDiffs = this.emptyImageArray();
        this.contiguousDifferencesSet = new DisjointSet();
    }

    /* Génère un tableau 2D vide pour contenir les pixels */
    private emptyImageArray(): { x: number; y: number }[][] {
        const emptyArray: { x: number; y: number }[][] = new Array();
        for (let i = 0; i < IMAGE_WIDTH; i++) {
            emptyArray.push(new Array());
            for (let j = 0; j < IMAGE_HEIGHT; j++) {
                emptyArray[i].push(undefined);
            }
        }

        return emptyArray;
    }

    /* Calcule toutes les différences contigues, en fonction du rayon d'élargissement */
    private computeContiguousDifferences() {
        // Itère à travers les différences élargies:
        this.extendedDiffs.forEach((ligne) => {
            ligne.forEach((pixel) => {
                // Lorsqu'on est sur un pixel de différence
                if (pixel) {
                    this.contiguousDifferencesSet.add(pixel);
                    this.getDirectNeighbours(pixel).forEach((neighbourCoords) => {
                        const neighbour = this.extendedDiffs[neighbourCoords.x][neighbourCoords.y];
                        if (neighbour) {
                            this.contiguousDifferencesSet.add(neighbour);
                            this.contiguousDifferencesSet.union(pixel, neighbour);
                        }
                    });
                }
            });
        });
    }

    /* Trouve tous les pixels comptant comme des différences après élargissement */
    private extendRawDifferences() {
        // Rajoute les pixels différents {x: number, y: number} à extendedDiffs, en élargissant par le rayon demandé
        this.rawDiffImage.scan(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT, (x: number, y: number) => {
            const pixel = { x, y };
            if (this.isDifferent(pixel)) {
                this.extendedDiffs[x][y] = pixel;
                this.getExtensionNeighbours(pixel).forEach((neighbour) => {
                    this.extendedDiffs[neighbour.x][neighbour.y] = neighbour;
                });
            }
        });
    }

    /* Détermine si un pixel est une différence brute entre les 2 images */
    private isDifferent(pixel: CoordSetObject): boolean {
        // Si la couleur est pas noire (donc RGBA == 00 00 00 FF), alors c'est une différence
        return this.rawDiffImage.getPixelColour(pixel.x, pixel.y) === BLACK_RGBA;
    }

    /* Calcule les voisins relatifs d'un pixel, en fonction du rayon d'élargissement */
    private computeRadiusExtension(radius: number) {
        const extensionCoords = [];
        for (let y = -radius; y <= radius; y++) {
            for (let x = -radius; x <= radius; x++) {
                // On exclue la valeur (0,0)
                const distance: number = Math.sqrt(x ** 2 + y ** 2);
                if (distance > 0 && distance < radius + 1) {
                    extensionCoords.push({ x, y });
                }
            }
        }

        return extensionCoords;
    }

    /* Détermine la liste des pixels directement adjacents à un certain pixel */
    private getDirectNeighbours(pixel: CoordSetObject): CoordSetObject[] {
        return this.getNeighbours(pixel, this.directNeighboursCoordinates);
    }

    /* Détermine la liste des pixels à l'intérieur du cercle d'élargissement d'un certain pixel */
    private getExtensionNeighbours(pixel: CoordSetObject): CoordSetObject[] {
        // Si le rayon est de 0, alors on n'élargit pas
        if (this.radius === 0) {
            return [];
        }
        return this.getNeighbours(pixel, this.extensionCoordinates);
    }

    /* Calcule les pixels voisins en fonction de coordonées relatives */
    private getNeighbours(pixel: CoordSetObject, relativeCoordinates): CoordSetObject[] {
        // On rajoute les pixels adjacents, le pixel {x, y} sera donc le centre du rayon
        const neighbours: CoordSetObject[] = relativeCoordinates.map(({ x, y }) => {
            return {
                x: x + pixel.x,
                y: y + pixel.y,
            };
        });

        // Filtrer valeurs qui dépassent l'image
        return neighbours.filter((pix) => this.pixelInBound(pix));
    }

    private pixelInBound(pixel: Coordinate): boolean {
        return pixel.x >= 0 && pixel.x < IMAGE_WIDTH && pixel.y >= 0 && pixel.y < IMAGE_HEIGHT;
    }
}
