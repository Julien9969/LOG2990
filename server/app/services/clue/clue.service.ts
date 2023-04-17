import { CLUE_BORDER_WIDTH, DIVIDER_FIRST_CLUE, DIVIDER_SECOND_CLUE, IMAGE_HEIGHT, IMAGE_WIDTH } from '@app/services/constants/services.const';
import { Session } from '@app/services/session/session';
import { Clue } from '@common/clue';
import { Coordinate } from '@common/coordinate';
import { Injectable } from '@nestjs/common';
import { ClassicSession } from '../session/classic-session';
import { LimitedTimeSession } from '../session/time-limited-session';

@Injectable()
export class ClueService {
    /**
     * Génère un indice afin de trouver l'une des différence toujours manquante
     *
     * @param session
     * @returns
     */
    generateClue(session: Session): Clue {
        if (!(session instanceof ClassicSession || session instanceof ClassicSession)) return;
        if (!session.handleClueRequest()) return;
        const cluePosition = this.getRandomCluePosition(session);

        if (session.nbCluesRequested <= 1) return this.getFirstClue(cluePosition);
        else if (session.nbCluesRequested === 2) return this.getSecondClue(cluePosition);
        return this.getLastClue(cluePosition);
    }

    /**
     * Cherche une coordonné aléatoire dans la liste des pixels de différences
     *
     * @param session l'objet session entié où l'on veut trouver un indice
     * @returns un pixel d'un indice aléatoirement séléctionné
     */
    private getRandomCluePosition(session: Session): Coordinate {
        let allDiffLeftToFind: Coordinate[][];
        if (session instanceof ClassicSession) allDiffLeftToFind = session.getNotFoundDifferences();
        else if (session instanceof LimitedTimeSession) allDiffLeftToFind = session.allGameDifferences;
        const randomIndex = Math.floor(Math.random() * allDiffLeftToFind.length);
        const randomDifference = allDiffLeftToFind[randomIndex];
        return randomDifference[0];
    }

    /**
     * Génère le premier indice (cadre d'un quart de l'image)
     *
     * @param cluePosition l'une des coordonnées de différence
     * @returns l'indice résultant
     */
    private getFirstClue(cluePosition: Coordinate): Clue {
        const coordinates = this.provideCoordinates(cluePosition, DIVIDER_FIRST_CLUE);
        return {
            coordinates,
            nbCluesLeft: 2,
        } as Clue;
    }

    /**
     * Génère le deuxième indice (cadre 1/16 de l'image)
     *
     * @param cluePosition l'une des coordonnées de différence
     * @returns l'indice résultant
     */
    private getSecondClue(cluePosition: Coordinate): Clue {
        const coordinates = this.provideCoordinates(cluePosition, DIVIDER_SECOND_CLUE);
        return {
            coordinates,
            nbCluesLeft: 1,
        } as Clue;
    }

    /**
     * Génère le dernier indice (indice spéciale qui n'est pas comme les autres)
     *
     * @param cluePosition l'une des coordonnées de différence
     * @returns l'indice résultant
     */
    private getLastClue(cluePosition: Coordinate): Clue {
        return {
            coordinates: [cluePosition],
            nbCluesLeft: 0,
        } as Clue;
    }

    /**
     * Produit les coordonnées pour afficher l'indice
     *
     * @param cluePosition une coordonnée d'une différence qui reste à trouver
     * @param dimension le diviseur permettant de séparer l'écran en sections
     * @returns Les coordonnées qui forme l'indice
     */
    private provideCoordinates(cluePosition: Coordinate, dimension: number): Coordinate[] {
        const pixelsPerHeightSector = IMAGE_HEIGHT / dimension;
        const pixelsPerWidthSector = IMAGE_WIDTH / dimension;

        const startCoord: Coordinate = {
            x: cluePosition.x - (cluePosition.x % pixelsPerWidthSector),
            y: cluePosition.y - (cluePosition.y % pixelsPerHeightSector),
        };

        const endCoord: Coordinate = {
            x: startCoord.x + pixelsPerWidthSector,
            y: startCoord.y + pixelsPerHeightSector,
        };

        return this.buildRectangleCoordinates(startCoord, endCoord);
    }

    /**
     * produit une liste de coordonnées qui forment un rectangle vide
     *
     * @param topLeft la position du point en haut à gauche du rectangle
     * @param bottomRight la position en bas à droite du rectangle
     * @returns La liste des coordonnées qui forme le rectangle
     */
    private buildRectangleCoordinates(topLeft: Coordinate, bottomRight: Coordinate): Coordinate[] {
        const coordinates = [];

        for (let x = topLeft.x - CLUE_BORDER_WIDTH; x <= bottomRight.x + CLUE_BORDER_WIDTH; x++) {
            for (let y = topLeft.y - CLUE_BORDER_WIDTH; y <= bottomRight.y + CLUE_BORDER_WIDTH; y++) {
                if (x < topLeft.x || x > bottomRight.x) coordinates.push({ x, y });
                else if (y < topLeft.y || y > bottomRight.y) coordinates.push({ x, y });
            }
        }

        return coordinates;
    }
}
