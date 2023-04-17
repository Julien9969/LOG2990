/* eslint-disable @typescript-eslint/no-empty-function */
import { HttpClient, HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Game } from '@common/game';
import { GameConstants } from '@common/game-constants';
import { DEFAULT_GAME_TIME, DEFAULT_PENALTY_TIME, DEFAULT_REWARD_TIME } from '@common/game-constants-values';
import { GameService } from './game.service';

describe('GameService', () => {
    let service: GameService;
    let gameStub: Game;
    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [{ provide: HttpClient, useValue: HttpClientTestingModule }],
        });
        service = TestBed.inject(GameService);
        gameStub = {
            id: '0',
            name: '',
            imageMain: 0,
            imageAlt: 0,
            scoreBoardSolo: [],
            scoreBoardMulti: [],
            isValid: false,
            isHard: false,
            differenceCount: 0,
        };
        spyOn<any>(service, 'reloadWindow').and.callFake(() => {});
    });
    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('getData() should call the communicationService function with the good parameters', () => {
        const parameter = 'games';
        spyOn(service['communicationService'], 'getRequest').and.stub();
        service.getData();
        expect(service['communicationService'].getRequest).toHaveBeenCalledWith(parameter);
    });
    it('getGroupedData() should call the getData() and create the good group', async () => {
        const gameArrayStub: Game[] = [gameStub, gameStub, gameStub, gameStub, gameStub, gameStub, gameStub, gameStub, gameStub];
        const shouldBeReturned: Game[][] = [[gameStub, gameStub, gameStub, gameStub], [gameStub, gameStub, gameStub, gameStub], [gameStub]];
        spyOn(service, 'getData').and.returnValue(Promise.resolve(gameArrayStub));
        const returned: Game[][] = await Promise.resolve(service.getGroupedData());
        expect(service.getData).toHaveBeenCalled();
        expect(returned).toEqual(shouldBeReturned);
    });

    it('getMainImageURL(game) should call the the getImageURL with the right parameter', () => {
        spyOn(service, 'getMainImageURL').and.callThrough();
        spyOn(service['communicationService'], 'getImageURL').and.stub();
        service.getMainImageURL(gameStub);
        expect(service['communicationService'].getImageURL).toHaveBeenCalledWith(gameStub.imageMain);
    });
    it('getMainImageURL should catch an error sent by getImageURL', () => {
        const getMainImageURLStub = () => {
            throw new Error();
        };
        spyOn(service['communicationService'], 'getImageURL').and.callFake(getMainImageURLStub);
        const returned: string = service.getMainImageURL(gameStub);
        expect(returned).toEqual('');
    });

    it('deleteGame should call the communicationService.deleteRequest function with games/id', () => {
        const gameId = '0';
        spyOn(service['communicationService'], 'deleteRequest').and.stub();
        service.deleteGame('0');
        expect(service['communicationService'].deleteRequest).toHaveBeenCalledWith('games/' + gameId);
    });

    it('getGameConstants returns communicationService game constant result', async () => {
        const stubGameConstants: GameConstants = {
            time: 100,
            penalty: 10,
            reward: 10,
        };
        const getGameConstantsSpy = spyOn(service['communicationService'], 'getGameConstants').and.callFake(async () => stubGameConstants);

        const result = await service.getGameConstants();

        expect(getGameConstantsSpy).toHaveBeenCalled();
        expect(result).toEqual(stubGameConstants);
    });

    it('updateGameConstants calls communicationService patchGameConstants', async () => {
        const stubGameConstants: GameConstants = {
            time: 100,
            penalty: 10,
            reward: 10,
        };
        const patchGameConstantsSpy = spyOn(service['communicationService'], 'patchGameConstants').and.callFake(async () => {});

        await service.updateGameConstants(stubGameConstants);

        expect(patchGameConstantsSpy).toHaveBeenCalled();
    });

    it('resetLeaderboard sends deleteRequest to leaderboards api path', async () => {
        const stubId = "test-id";
        const deleteSpy = spyOn(service['communicationService'], 'deleteRequest').and.callFake(async () => {
            return new HttpResponse<void>()
        });

        await service.resetLeaderboard(stubId);
        
        expect(deleteSpy).toHaveBeenCalledWith('games/leaderboards/' + stubId);
    });

    it('resetAllLeaderboards sends deleteRequest to games api path', async () => {
        const deleteSpy = spyOn(service['communicationService'], 'deleteRequest').and.callFake(async () => {
            return new HttpResponse<void>()
        });

        await service.resetAllLeaderboards();
        
        expect(deleteSpy).toHaveBeenCalledWith('games/leaderboards');
    });

    it('deleteAllGames sends deleteRequest to games api path', async () => {
        const deleteSpy = spyOn(service['communicationService'], 'deleteRequest').and.callFake(async () => {
            return new HttpResponse<void>()
        });

        await service.deleteAllGames();
        
        expect(deleteSpy).toHaveBeenCalledWith('games');
    });

    it('resetTimeConstants patches game constants to default values', async () => {
        const patchGameconstantsSpy = spyOn(service['communicationService'], 'patchGameConstants').and.callFake(async () => {
            return new HttpResponse<void>()
        });
        const expectedDefaultGameConsts: GameConstants = {
            time: DEFAULT_GAME_TIME,
            reward: DEFAULT_REWARD_TIME,
            penalty: DEFAULT_PENALTY_TIME,
        }

        await service.resetTimeConstants();
        
        expect(patchGameconstantsSpy).toHaveBeenCalledWith(expectedDefaultGameConsts);        
    });
});
