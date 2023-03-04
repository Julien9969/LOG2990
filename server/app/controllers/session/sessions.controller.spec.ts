/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, max-lines  */
import { exampleGame } from '@app/controllers/games/games.controller.spec.const';
import { GameService } from '@app/services/game/game.service';
import { Session } from '@app/services/session/session';
import { SessionService } from '@app/services/session/session.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createStubInstance, SinonStubbedInstance } from 'sinon';

import { SessionController } from './sessions.controller';
import { exampleCoordinate, exampleSession } from './sessions.controller.spec.const';
describe('SessionController tests', () => {
    let controller: SessionController;
    let sessionService: SinonStubbedInstance<SessionService>;
    let gameService: SinonStubbedInstance<GameService>;

    beforeEach(async () => {
        sessionService = createStubInstance(SessionService);
        gameService = createStubInstance(GameService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SessionController],
            providers: [
                {
                    provide: SessionService,
                    useValue: sessionService,
                },
                {
                    provide: GameService,
                    useValue: gameService,
                },
            ],
        }).compile();
        controller = module.get<SessionController>(SessionController);
    });
    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    it('getAllActiveSession should call getAll', async () => {
        const spy = jest.spyOn(controller['sessionService'], 'getAll').mockImplementation(() => {
            return [];
        });
        controller.getAllActiveSession();
        expect(spy).toHaveBeenCalled();
    });
    it('deleteGame should call delete', async () => {
        const spy = jest.spyOn(controller['sessionService'], 'delete').mockImplementation(() => {});
        await controller.deleteGame('12');
        expect(spy).toHaveBeenCalled();
    });
    it('newGame should throw an error if it doesnt find an image', async () => {
        const spy = jest.spyOn(controller['gameService'], 'findById').mockImplementation(() => {
            return null;
        });
        let error: HttpException;
        try {
            await controller.newGame('12');
        } catch (e) {
            error = e;
        }
        expect(spy).toHaveBeenCalled();
        expect(error.getStatus()).toEqual(HttpStatus.NOT_FOUND);
        expect(error.getResponse()).toEqual('Jeu non existant.');
    });
    it('newGame should call create if valid', async () => {
        const spy1 = jest.spyOn(controller['gameService'], 'findById').mockReturnValue(Promise.resolve(exampleGame));
        const spy2 = jest.spyOn(controller['sessionService'], 'create').mockReturnValue(12);
        await controller.newGame('12');
        expect(spy1).toHaveBeenCalled();
        expect(spy2).toHaveBeenCalled();
    });
    it('guess should call findById and tryGuess', () => {
        const spy1 = jest.spyOn(controller['sessionService'], 'findById').mockReturnValue(exampleSession);
        const spy2 = jest.spyOn(Session.prototype, 'tryGuess').mockReturnValue(null);

        controller.guess('12', exampleCoordinate);
        expect(spy1).toHaveBeenCalled();
        expect(spy2).toHaveBeenCalled();
    });

    it('guess should throw an error if the session isnt found', () => {
        const spy = jest.spyOn(controller['sessionService'], 'findById').mockImplementation(() => {
            return null;
        });

        let e: HttpException;
        try {
            controller.guess('12', exampleCoordinate);
        } catch (error) {
            e = error;
        }
        expect(spy).toHaveBeenCalled();
        expect(e.getStatus()).toEqual(HttpStatus.NOT_FOUND);
        expect(e.getResponse()).toEqual('Session non existante.');
    });

    it('guess should throw an error guess fails', () => {
        const spy = jest.spyOn(controller['sessionService'], 'findById').mockImplementation(() => {
            return exampleSession;
        });

        let e: HttpException;
        try {
            controller.guess('12', exampleCoordinate);
        } catch (error) {
            e = error;
        }
        expect(spy).toHaveBeenCalled();
        expect(e.getStatus()).toEqual(HttpStatus.BAD_REQUEST);
    });

    it('get session should return the session if found', () => {
        const spy = jest.spyOn(controller['sessionService'], 'findById').mockImplementation(() => {
            return exampleSession;
        });
        const result = controller.getSession(12);

        expect(spy).toHaveBeenCalled();
        expect(result).toEqual(exampleSession);
    });

    it('get session should throw an error if the session isnt found', () => {
        const spy = jest.spyOn(controller['sessionService'], 'findById').mockImplementation(() => {
            return null;
        });
        let error: HttpException;
        try {
            controller.getSession(12);
        } catch (e) {
            error = e;
        }
        expect(spy).toHaveBeenCalled();
        expect(error.getStatus()).toEqual(HttpStatus.NOT_FOUND);
        expect(error.getResponse()).toEqual('Session non existante.');
    });
});
