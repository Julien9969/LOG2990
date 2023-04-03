/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { HistoryService } from '@app/services/history.service';
import { CommunicationService } from './communication/communication.service';

describe('HistoryService', () => {
    let service: HistoryService;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;
    let dateSpy: jasmine.SpyObj<Date>;

    beforeEach(async () => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationServiceSpy', ['getHistory', 'deleteHistory', 'postNewHistoryEntry']);
        communicationServiceSpy.getHistory.and.returnValue(Promise.resolve([]));
        dateSpy = jasmine.createSpyObj('DateSpy', ['toLocaleDateString', 'toLocaleTimeString']);
        dateSpy.toLocaleDateString.and.returnValue('date');
        dateSpy.toLocaleTimeString.and.returnValue('time');

        TestBed.configureTestingModule({
            providers: [
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: Date, useValue: dateSpy },
            ],
        });
        service = TestBed.inject(HistoryService);
        service['currentGame'] = { startDateTime: '', gameId: '', duration: '', gameMode: '', playerOne: 'jose', playerTwo: 'bob' };
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('set gameId should set currentGame.gameId', () => {
        const gameId = '42';
        service.gameId = gameId;
        expect(service['currentGame'].gameId).toEqual(gameId);
    });

    it('getHistory should call communicationService.getHistory', async () => {
        const id = '42';
        const result = await Promise.resolve(service.getHistory(id));
        expect(communicationServiceSpy.getHistory).toHaveBeenCalledWith(id);
        expect(result).toEqual([]);
    });

    it('deleteHistory should call communicationService.deleteHistory', () => {
        const gameId = '42';
        service.deleteHistory(gameId);
        expect(communicationServiceSpy.deleteHistory).toHaveBeenCalledWith(gameId);
    });

    it('initHistory should call setStartDateTime', () => {
        spyOn(service, 'setStartDateTime' as any).and.callFake(() => {});
        service.initHistory();
        expect(service['setStartDateTime']).toHaveBeenCalled();
    });

    it('setGameMode should set currentGame.gameMode to solo if isSolo is true', () => {
        const gameMode = '42';
        const isSolo = true;
        service.setGameMode(gameMode, isSolo);
        expect(service['currentGame'].gameMode).toEqual(gameMode + ' solo');
    });

    it('setGameMode should set currentGame.gameMode to multi if isSolo is false', () => {
        const gameMode = '42';
        const isSolo = false;
        service.setGameMode(gameMode, isSolo);
        expect(service['currentGame'].gameMode).toEqual(gameMode + ' multi');
    });

    it('setPlayers should set currentGame.playerOne', () => {
        const playerOne = '42';
        service.setPlayers(playerOne);
        expect(service['currentGame'].playerOne).toEqual(playerOne);
    });

    it('setPlayers should set currentGame.playerTwo', () => {
        const playerTwo = '42';
        service.setPlayers('', playerTwo);
        expect(service['currentGame'].playerTwo).toEqual(playerTwo);
    });

    it('playerWon should set currentGame.duration', () => {
        const duration = '42';
        service.playerWon(duration);
        expect(service['currentGame'].duration).toEqual(duration);
    });

    it('playerWon should add <b> around currentGame.playerOne', () => {
        const playerOne = '42';
        service.playerWon(playerOne);
        expect(service['currentGame'].playerOne).toEqual('<b>' + 'jose' + '</b>');
    });

    it('playerQuit should set currentGame.duration', () => {
        const duration = '42';
        service.playerQuit(duration);
        expect(service['currentGame'].duration).toEqual(duration);
    });

    it('playerQuit should add <s> around currentGame.playerTwo', () => {
        service.playerQuit('', false);
        expect(service['currentGame'].playerTwo).toEqual('<s>' + 'bob' + '</s>');
    });

    it('playerQuit should set currentGame.playerOne', () => {
        service.playerQuit('', true);
        expect(service['currentGame'].playerOne).toEqual('<s>' + 'jose' + '</s>');
    });

    it('postHistory should call communicationService.postNewHistoryEntry', () => {
        service['postHistory']();
        expect(communicationServiceSpy.postNewHistoryEntry).toHaveBeenCalledWith(service['currentGame']);
    });

    it('setStartDateTime should set currentGame.startDateTime', () => {
        service['setStartDateTime']();
        const expectedStartDateTime = dateSpy.toLocaleDateString() + ' ' + dateSpy.toLocaleTimeString();
        expect(service['currentGame'].startDateTime).toEqual(expectedStartDateTime);
    });
});
