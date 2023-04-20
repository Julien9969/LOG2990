import { Injectable } from '@angular/core';
import { CommunicationService } from '@app/services/communication/communication.service';
import { GameHistory } from '@common/game-history';

@Injectable({
    providedIn: 'root',
})
export class HistoryService {
    private currentGame: GameHistory;
    private date: Date;
    private hasBeenSend: boolean;

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

    initHistory(mode: string, isSolo: boolean): void {
        this.date = new Date();
        this.hasBeenSend = false;
        this.currentGame = {
            startDateTime: '',
            gameId: '',
            duration: '',
            gameMode: mode + (isSolo ? ' solo' : ' multi'),
            playerOne: '',
            playerTwo: '',
        };
        this.setStartDateTime();
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

    setLimitedTimeHistory(duration: string): void {
        this.currentGame.duration = duration;
        this.postHistory();
    }

    private postHistory(): void {
        if (!this.hasBeenSend) {
            this.communicationService.postNewHistoryEntry(this.currentGame);
        }
        this.hasBeenSend = true;
    }

    private setStartDateTime(): void {
        this.currentGame.startDateTime = this.date.toLocaleDateString() + ' ' + this.date.toLocaleTimeString();
    }
}
