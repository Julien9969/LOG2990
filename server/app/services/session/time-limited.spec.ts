/* eslint-disable @typescript-eslint/no-magic-numbers */
import { DifferenceValidationService } from '@app/services/difference-validation/difference-validation.service';
import { GameService } from '@app/services/game/game.service';
import { Game } from '@common/game';
import { Player } from '@common/player';
import mongoose from 'mongoose';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { LimitedTimeSession } from './time-limited-session';

jest.mock('mongoose');

describe('Session tests', () => {
    let soloSession: LimitedTimeSession;
    let multiSession: LimitedTimeSession;
    let differenceValidationService: SinonStubbedInstance<DifferenceValidationService>;
    // let session: SinonStubbedInstance<Session>;
    let gameServiceStub: GameService;
    let multiPlayers: Player[];

    beforeEach(async () => {
        differenceValidationService = createStubInstance<DifferenceValidationService>(DifferenceValidationService);
        differenceValidationService.differenceCoordLists = [[{ x: 0, y: 0 }]];

        gameServiceStub = jest.createMockFromModule<GameService>('@app/services/game/game.service');
        gameServiceStub.getGameConstants = jest.fn().mockReturnValue({
            time: 100,
            penalty: 5,
            reward: 10,
        });

        gameServiceStub.getRandomGame = jest.fn().mockReturnValue({
            id: 'gameId',
        } as Game);

        gameServiceStub.findAll = jest.fn();

        jest.spyOn(mongoose, 'isValidObjectId').mockReturnValue(true);

        jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
            DifferenceValidationService.prototype.differenceCoordLists = [[]];
        });
        const soloPlayer = [
            {
                name: 'name',
                socketId: 'firstSocketId',
                differencesFound: [23],
            },
        ];
        soloSession = new LimitedTimeSession(gameServiceStub as GameService, soloPlayer);
        soloSession.differenceValidationService = differenceValidationService;
        multiPlayers = [
            {
                name: 'name',
                socketId: 'firstSocketId',
                differencesFound: [23],
            },
            {
                name: 'name',
                socketId: 'secondSocketId',
                differencesFound: [23],
            },
        ];
        multiSession = new LimitedTimeSession(gameServiceStub as GameService, multiPlayers);
        multiSession.differenceValidationService = differenceValidationService;
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(soloSession).toBeDefined();
        expect(multiSession).toBeDefined();
    });

    it('get isSolo should return true if there is only one player', () => {
        expect(soloSession.isSolo).toBeTruthy();
    });

    it('get isSolo should return false if there is more than one player', () => {
        expect(multiSession.isSolo).toBeFalsy();
    });

    it('get allGameDifferences should return the differenceCoordLists', () => {
        expect(soloSession.allGameDifferences).toEqual([[{ x: 0, y: 0 }]]);
    });

    it('get allGameDifferences should return the differenceCoordLists', () => {
        expect(multiSession.allGameDifferences).toEqual([[{ x: 0, y: 0 }]]);
    });

    it('tryGuess should return a GuessResult with isCorrect true if the guess is correct', async () => {
        differenceValidationService.checkDifference.returns(0);
        jest.spyOn(soloSession.differenceValidationService, 'validateGuess').mockImplementation(() => {
            return true;
        });

        differenceValidationService.getDifferencePixelList.returns([{ x: 0, y: 0 }]);
        const guessResult = await soloSession.tryGuess({ x: 0, y: 0 });
        expect(guessResult).toBeTruthy();
        expect(guessResult).toEqual({
            isCorrect: true,
            differencesByPlayer: [],
            differencePixelList: [{ x: 0, y: 0 }],
            winnerName: '',
        });
    });

    it('tryGuess should return a GuessResult with isCorrect false if the guess is incorrect', async () => {
        differenceValidationService.checkDifference.returns(undefined);
        jest.spyOn(soloSession.differenceValidationService, 'validateGuess').mockImplementation(() => {
            return true;
        });

        differenceValidationService.getDifferencePixelList.returns([{ x: 0, y: 0 }]);
        const guessResult = await soloSession.tryGuess({ x: 0, y: 0 });
        expect(guessResult).toBeTruthy();
        expect(guessResult).toEqual({
            isCorrect: false,
            differencesByPlayer: [],
            differencePixelList: [{ x: 0, y: 0 }],
            winnerName: '',
        });
    });

    it('tryGuess should return throw an error if guess is invalid', async () => {
        differenceValidationService.checkDifference.returns(undefined);
        jest.spyOn(soloSession.differenceValidationService, 'validateGuess').mockImplementation(() => {
            return false;
        });

        differenceValidationService.getDifferencePixelList.returns([{ x: 0, y: 0 }]);
        await expect(soloSession.tryGuess({ x: 0, y: 0 })).rejects.toThrow();
    });

    it('build guess result should return a GuessResult with isCorrect true if the guess is correct', () => {
        const pixList = [{ x: 0, y: 0 }];
        const guessResult = soloSession.buildGuessResult(true, pixList);
        expect(guessResult).toBeTruthy();
        expect(guessResult).toEqual({
            isCorrect: true,
            differencesByPlayer: [],
            differencePixelList: pixList,
            winnerName: '',
        });
    });

    it('build guess result should return a GuessResult with isCorrect false if the guess is incorrect', () => {
        const guessResult = soloSession.buildGuessResult(false, []);
        expect(guessResult).toBeTruthy();
        expect(guessResult).toEqual({
            isCorrect: false,
            differencesByPlayer: [],
            differencePixelList: [],
            winnerName: '',
        });
    });

    it('decideNewGame should return a game if there still game not played and update playedGame id list', async () => {
        soloSession.playedGames = [];
        jest.spyOn(soloSession, 'hasGameBeenPlayed').mockReturnValueOnce(true);
        jest.spyOn(soloSession, 'noMoreGames').mockReturnValue(Promise.resolve(false));
        const game = await soloSession.decideNewGame();
        expect(game).toBeTruthy();
        expect(game).toEqual({ id: 'gameId' });
        expect(soloSession.playedGames).toEqual(['gameId']);
    });

    it('decideNewGame should call decideNewGame if an error is throw by differenceValidationService.loadDifferences', async () => {
        soloSession.playedGames = [];
        jest.spyOn(soloSession, 'noMoreGames').mockReturnValue(Promise.resolve(false));
        jest.spyOn(soloSession.differenceValidationService, 'loadDifferences').mockImplementationOnce(() => {
            jest.spyOn(soloSession, 'decideNewGame').mockImplementation(async (): Promise<Game> => {
                return;
            });
            throw new Error('error');
        });
        await soloSession.decideNewGame();
        expect(soloSession.playedGames).toEqual(['gameId']);
        // On attend un seul appel car le spy est crée pendant l'éxecution du 1er appel de la fonction
        expect(soloSession.decideNewGame).toHaveBeenCalledTimes(1);
    });

    it('decideNewGame should return undefined if there is no more game to play', async () => {
        soloSession.playedGames = ['gameId'];
        jest.spyOn(soloSession, 'noMoreGames').mockReturnValue(Promise.resolve(true));
        const game = await soloSession.decideNewGame();
        expect(game).toBeUndefined();
    });

    it('noMoreGames should return true if all games have been played', async () => {
        soloSession.playedGames = ['gameId'];
        jest.spyOn(soloSession.gameService, 'findAll').mockReturnValue(Promise.resolve([{ id: 'gameId' }] as Game[]));
        const game = await soloSession.noMoreGames();
        expect(game).toBeTruthy();
    });

    it('noMoreGames should return false if all games have not been played', async () => {
        soloSession.playedGames = [];
        jest.spyOn(soloSession.gameService, 'findAll').mockReturnValue(Promise.resolve([{ id: 'gameId' }] as Game[]));
        const game = await soloSession.noMoreGames();
        expect(game).toBeFalsy();
    });

    it('hasGameBeenPlayed should return true if the game has been played', () => {
        soloSession.playedGames = ['gameId'];
        const game = soloSession.hasGameBeenPlayed({ id: 'gameId' } as Game);
        expect(game).toBeTruthy();
    });

    it('hasGameBeenPlayed should return false if the game has not been played', () => {
        soloSession.playedGames = [];
        const game = soloSession.hasGameBeenPlayed({ id: 'gameId' } as Game);
        expect(game).toBeFalsy();
    });

    it('timerFinished should return true if the timer is finished', () => {
        soloSession.time = 0;
        const timerFinished = soloSession.timerFinished();
        expect(timerFinished).toBeTruthy();
    });

    it('timerFinished should return false if the timer is not finished', () => {
        soloSession.time = 1;
        const timerFinished = soloSession.timerFinished();
        expect(timerFinished).toBeFalsy();
    });

    it('deletePlayer should delete the other player from the session', () => {
        multiSession.deletePlayer('secondSocketId');
        expect(multiSession.players).toEqual([
            {
                name: 'name',
                socketId: 'firstSocketId',
                differencesFound: [23],
            },
        ]);
    });

    it('deletePlayer should delete the player from the session', () => {
        multiSession.deletePlayer('firstSocketId');
        expect(multiSession.players).toEqual([
            {
                name: 'name',
                socketId: 'secondSocketId',
                differencesFound: [23],
            },
        ]);
    });

    it('handleClueRequest should return true if the player use less that 3 clues', () => {
        soloSession.nbCluesRequested = 2;
        const clueRequest = soloSession.handleClueRequest();
        expect(clueRequest).toBeTruthy();
    });

    it('handleClueRequest should return false if the player use more that 3 clues', () => {
        soloSession.nbCluesRequested = 3;
        const clueRequest = soloSession.handleClueRequest();
        expect(clueRequest).toBeFalsy();
    });
});
