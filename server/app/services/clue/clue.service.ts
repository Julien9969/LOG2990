import { DIVIDER_SECOND_CLUE, IMAGE_HEIGHT, IMAGE_WIDTH } from '@app/services/constants/services.const';
import { Session } from '@app/services/session/session';
import { Clue } from '@common/clue';
import { Coordinate } from '@common/coordinate';
import { Injectable } from '@nestjs/common';

@Injectable({})
export class ClueService {
    generateClue(session: Session): Clue {
        if (!session.handleClueRequest()) return;
        const cluePosition = this.getRandomCluePosition(session);

        if (session.nbCluesRequested <= 1) return this.getFirstClue(cluePosition);
        else if (session.nbCluesRequested === 2) return this.getSecondClue(cluePosition);
        return this.getLastClue(cluePosition);
    }

    private getRandomCluePosition(session: Session): Coordinate {
        const allDiffLeftToFind = session.getNotFoundDifferences();
        const randomIndex = Math.floor(Math.random() * allDiffLeftToFind.length);
        return allDiffLeftToFind[randomIndex][0];
    }

    private getFirstClue(cluePosition: Coordinate): Clue {
        const coordinates = this.provideCoordinates(cluePosition, DIVIDER_SECOND_CLUE);
        return {
            coordinates,
            nbCluesLeft: 2,
        } as Clue;
    }

    private getSecondClue(cluePosition: Coordinate): Clue {
        const coordinates = this.provideCoordinates(cluePosition, DIVIDER_SECOND_CLUE);
        return {
            coordinates,
            nbCluesLeft: 1,
        } as Clue;
    }

    private getLastClue(cluePosition: Coordinate): Clue {
        return {
            coordinates: [cluePosition],
            nbCluesLeft: 0,
        } as Clue;
    }

    private buildSquareMatrix(cluePosition: Coordinate, dimension: number): number[][] {
        const matrix = Array.from({ length: dimension }, () => Array.from({ length: dimension }, () => 0));
        const xIndex = Math.floor(cluePosition.x / (IMAGE_HEIGHT / dimension));
        const yIndex = Math.floor(cluePosition.x / (IMAGE_HEIGHT / dimension));
        matrix[yIndex][xIndex] = 1;
        return matrix;
    }

    private provideCoordinates(cluePosition: Coordinate, dimension: number): Coordinate[] {
        const matrix = this.buildSquareMatrix(cluePosition, dimension);
        let xPos = 0;
        let yPos = 0;

        for (let j = 0; j < matrix.length; j++) {
            if (1 in matrix[j]) yPos = j;
            for (let i = 0; i < matrix[0].length; i++) {
                if (1 === matrix[j][i]) xPos = i;
            }
        }

        const startCoordinate = {
            x: (IMAGE_WIDTH / dimension) * xPos,
            y: (IMAGE_HEIGHT / dimension) * yPos,
        } as Coordinate;

        const endCoordinate = {
            x: IMAGE_WIDTH / dimension + startCoordinate.x - 1,
            y: IMAGE_HEIGHT / dimension + startCoordinate.x - 1,
        } as Coordinate;

        const coords: Coordinate[] = [];

        for (let j = startCoordinate.y; j < endCoordinate.y; j++) {
            for (let i = startCoordinate.x; i < endCoordinate.x; i++) {
                coords.push({ x: i, y: j });
            }
        }

        return coords;
    }
}
