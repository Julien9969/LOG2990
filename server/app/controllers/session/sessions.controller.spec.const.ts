/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Session } from '@app/services/session/session';

export const exampleCoordinate = {
    x: 12,
    y: 13,
};
export const exampleSession = new Session();
exampleSession.gameID = 12;
exampleSession.id = 15;
exampleSession.nGuesses = 0;
exampleSession.nPenalties = 0;
exampleSession.differencesFound = [];
