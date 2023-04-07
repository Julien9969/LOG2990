import { DIVIDER_FIRST_CLUE, DIVIDER_SECOND_CLUE, IMAGE_HEIGHT, IMAGE_WIDTH } from '@app/services/constants/services.const';
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
        const coordinates = this.provideCoordinates(cluePosition, DIVIDER_FIRST_CLUE);
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
        // const matrix = this.buildSquareMatrix(cluePosition, dimension);
        // let xPos = 0;
        // let yPos = 0;

        // for (let j = 0; j < matrix.length; j++) {
        //     if (1 in matrix[j]) yPos = j;
        //     for (let i = 0; i < matrix[0].length; i++) {
        //         if (1 === matrix[j][i]) xPos = i;
        //     }
        // }

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

    private buildRectangleCoordinates(topLeft: Coordinate, bottomRight: Coordinate): Coordinate[] {
        const coordinates = [];

        // Iterate over x and y values of each coordinate
        for (let x = topLeft.x; x <= bottomRight.x; x++) {
            for (let y = topLeft.y; y <= bottomRight.y; y++) {
                if (x < topLeft.x + 5 || x > bottomRight.x - 5) coordinates.push({ x, y });
                else if (y < topLeft.y + 5 || y > bottomRight.y - 5) coordinates.push({ x, y });
            }
        }

        return coordinates;

        // const coordinates: Coordinate[] = [];

        // for (let i = startCoord.x; i <= startCoord.x + 5; i++) {
        //     for (let j = startCoord.y; j <= endCoord.y; j++) {
        //         coordinates.push({ x: i, y: j });
        //     }
        // }

        // for (let i = startCoord.x + IMAGE_HEIGHT / dimension; i <= startCoord.x - 5 + IMAGE_HEIGHT / dimension; i++) {
        //     for (let j = startCoord.y; j <= endCoord.y; j++) {
        //         coordinates.push({ x: i, y: j });
        //     }
        // }
        // return coordinates;
    }
}
