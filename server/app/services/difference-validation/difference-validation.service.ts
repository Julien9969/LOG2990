import * as fs from 'fs';

import { DIFFERENCE_LISTS_FOLDER, DIFFERENCE_LISTS_PREFIX, IMAGE_HEIGHT, IMAGE_WIDTH } from '@app/services/constants/services.const';
import { Coordinate } from '@common/coordinate';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DifferenceValidationService {
    differenceCoordLists: Coordinate[][];

    /**
     * Permet de charger les listes de différences d'un jeu de la persistance
     *
     * @param gameId L'identifiant unique du jeu
     */
    loadDifferences(gameId: string) {
        const differencePath = `${DIFFERENCE_LISTS_FOLDER}/${DIFFERENCE_LISTS_PREFIX}${gameId}.json`;
        try {
            this.differenceCoordLists = JSON.parse(fs.readFileSync(differencePath).toString());
        } catch (error) {
            throw new Error('Donnees de jeu non trouvees.');
        }
        if (!this.differenceCoordLists || this.differenceCoordLists.length === 0) {
            throw new Error('Données du jeu inexistantes ou corrompues.');
        }
    }

    /**
     * Vérifie si un certain pixel est une différence lors d'une partie
     *
     * @param x Coordonée X du pixel
     * @param y Coordonée Y du pixel
     * @returns Numéro de la différence du pixel, ou undefined s'il n'est pas une différence
     */
    checkDifference(x: number, y: number) {
        let differenceNumber: number;
        if (!this.differenceCoordLists) {
            throw new Error('Données de differences non trouvées ou corrompues.');
        }

        this.differenceCoordLists.forEach((differenceCoords, diffNumber) => {
            if (
                differenceCoords.find((coord) => {
                    return coord.x === x && coord.y === y;
                })
            ) {
                differenceNumber = diffNumber;
            }
        });
        return differenceNumber;
    }

    /**
     * Valide le format et les valeurs x, y d'un essai de recherche de différence
     *
     * @param guess Les coordonnées de l'essai
     * @returns Booléen indiquant la validité de l'essai
     */
    validateGuess(guess: Coordinate) {
        return (
            // L'objet doit être bien défini -- 0 est une valeur valide
            guess &&
            guess.x !== null &&
            guess.y !== null &&
            guess.x !== undefined &&
            guess.y !== undefined &&
            // Le pixel cliqué doit être dans les bornes
            guess.x >= 0 &&
            guess.x < IMAGE_WIDTH &&
            guess.y >= 0 &&
            guess.y < IMAGE_HEIGHT
        );
    }

    /**
     * @param diffNum Le numéro identifiant la différence parmi la liste de différences
     * @returns La liste des pixels inclus dans cette différence
     */
    getDifferencePixelList(diffNum: number): Coordinate[] {
        return this.differenceCoordLists[diffNum];
    }
}
