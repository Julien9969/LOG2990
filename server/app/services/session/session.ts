import { DifferenceValidationService } from '@app/services/difference-validation/difference-validation.service';
import { Coordinate } from '@common/coordinate';
import { GuessResult } from '@common/guess-result';

export class Session {
    gameID: number;
    id: number;
    nGuesses: number = 0;
    nPenalties: number = 0;
    differencesFound: number[] = [];

    /**
     * Traite un essai de différence du jeu dans la session courante
     *
     * @param guess La coordonnée de l'essai
     * @returns Le résultat de l'essai
     */
    tryGuess(guess: Coordinate): GuessResult {
        const diffValidationService = new DifferenceValidationService();
        let diffNum: number;
        let diffPixelList: Coordinate[] = [];
        if (!diffValidationService.validateGuess(guess)) {
            throw new Error('Mauvais format de guess.');
        }
        try {
            // Vérification de la différence dans les données de jeu
            diffValidationService.loadDifferences(this.gameID.toString());
            diffNum = diffValidationService.checkDifference(guess.x, guess.y);
            if (diffNum !== undefined) {
                diffPixelList = diffValidationService.getDifferencePixelList(diffNum);
            }
        } catch (error) {
            throw new Error(error.message);
        }

        // Formation de l'objet resultat
        const result: GuessResult = {
            correct: diffNum !== undefined,
            differenceNum: diffNum,
            alreadyFound: this.differencesFound.some((diff) => diff === diffNum),
            differencePixelList: diffPixelList,
        };

        // Traitement des pénalités, le cas échéant
        if (!result.alreadyFound) {
            this.nGuesses++;
            if (result.correct) {
                this.differencesFound.push(diffNum);
            } else {
                this.nPenalties++;
            }
        }

        return result;
    }
}
