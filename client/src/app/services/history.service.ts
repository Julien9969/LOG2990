import { Injectable } from '@angular/core';
import { CommunicationService } from '@app/services/communication/communication.service';
import { GameHistory } from '@common/game-history';

@Injectable({
    providedIn: 'root',
})
export class HistoryService {
    private currentGame: GameHistory;
    private date: Date = new Date();
    constructor(private readonly communicationService: CommunicationService) {}

    set gameId(gameId: string) {
        this.currentGame.gameId = gameId;
    }

    async getHistory(): Promise<GameHistory[]> {
        return await this.communicationService.getHistory();
    }

    deleteHistory(): void {
        this.communicationService.deleteHistory();
    }

    initHistory(): void {
        this.currentGame = { startDateTime: '', gameId: '', duration: '', gameMode: '', playerOne: '', playerTwo: '' };
        this.setStartDateTime();
    }

    setGameMode(gameMode: string, isSolo: boolean): void {
        this.currentGame.gameMode = gameMode + (isSolo ? ' solo' : ' multi');
    }

    setPlayers(playerOne: string, playerTwo?: string): void {
        this.currentGame.playerOne = playerOne;
        if (playerTwo) {
            this.currentGame.playerTwo = playerTwo;
        }
    }

    setPlayerWon(duration: string): void {
        this.currentGame.duration = duration;
        this.currentGame.playerOne = '<b>' + this.currentGame.playerOne + '</b>';
        this.postHistory();
    }

    setPlayerQuit(duration: string, isolo?: boolean): void {
        this.currentGame.duration = duration;
        if (!isolo) {
            this.currentGame.playerTwo = '<s>' + this.currentGame.playerTwo + '</s>';
        } else {
            this.currentGame.playerOne = '<s>' + this.currentGame.playerOne + '</s>';
        }
        this.postHistory();
    }

    private postHistory(): void {
        this.communicationService.postNewHistoryEntry(this.currentGame);
    }

    private setStartDateTime(): void {
        this.currentGame.startDateTime = this.date.toLocaleDateString() + ' ' + this.date.toLocaleTimeString();
    }
}
