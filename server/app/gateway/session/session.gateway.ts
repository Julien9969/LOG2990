/* eslint-disable max-lines */
import { SECOND_IN_MILLISECONDS } from '@app/gateway/constants/utils-constants';
import { GameService } from '@app/services/game/game.service';
import { ClassicSession } from '@app/services/session/classic-session';
import { Session } from '@app/services/session/session';
import { SessionService } from '@app/services/session/session.service';
import { LimitedTimeSession } from '@app/services/session/time-limited-session';
import { Coordinate } from '@common/coordinate';
import { FinishedGame } from '@common/finishedGame';
import { GuessResult } from '@common/guess-result';
import { SessionEvents } from '@common/session.gateway.events';
import { StartSessionData } from '@common/start-session-data';
import { WinnerInfo } from '@common/winner-info';
import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class SessionGateway {
    @WebSocketServer() private server: Server;

    constructor(private readonly logger: Logger, private readonly sessionService: SessionService, private readonly gameService: GameService) {}
    @SubscribeMessage(SessionEvents.GiveName)
    getNewName(client: Socket, name: string) {
        this.logger.log('added new name to dict');
        this.sessionService.addName(client.id, name);
    }

    /**
     *
     * @param client
     * @returns
     */
    @SubscribeMessage(SessionEvents.GetClientId)
    getClientId(client: Socket) {
        this.logger.log(`Client ${client.id} has requested his socket Id`);
        return client.id;
    }

    /**
     * Permet de fermer une session
     *
     * @param id L'identifiant de la session à supprimer
     */
    @SubscribeMessage(SessionEvents.CloseSession)
    closeSession(sessionId: number) {
        try {
            this.sessionService.delete(sessionId);
        } catch (error) {
            this.logger.error(error);
        }
        return sessionId;
    }

    /**
     * Lorsqu'un joueur entre dans une salle solo ou lorsque 2 joueurs rentres dans
     * une salle multijoueur et le créateur envoie une requête, une session est crée
     * et son identifiant (id) est envoyé à tout les joueurs dans la salle.
     *
     * @param client Le client qui a fait la demande d'un identifiant (id) de session
     * @param gameId L'identifiant du jeu que le client veut jouer
     */
    @SubscribeMessage(SessionEvents.StartClassicSession)
    async startClassicSession(client: Socket, data: StartSessionData) {
        console.log('on rentre dans le startClassicSession');

        // eslint-disable-next-line prefer-const
        let { gameId, isSolo } = data;

        this.logger.log(`Client ${client.id} asked for session id`);
        if (isSolo) {
            const sessionId = this.sessionService.createNewClassicSession(gameId, client.id);
            this.startSessionTimer(client, sessionId);
            this.logger.log(`solo session ${sessionId} was created by ${client.id}`);
            return sessionId;
        }
        client.rooms.forEach(async (roomId) => {
            if (roomId.startsWith('gameRoom')) {
                const clientsInRoom = await this.server.in(roomId).allSockets();
                if (clientsInRoom.size === 2) {
                    const [firstClientId, secondClientId] = clientsInRoom;
                    const sessionId = this.sessionService.createNewClassicSession(gameId, firstClientId, secondClientId);
                    this.startSessionTimer(client, sessionId);
                    this.server.to(roomId).emit(SessionEvents.SessionId, sessionId);
                    this.logger.log(`multiplayer session ${sessionId} was created by client ${client.id}`);
                }
            }
        });
    }

    /**
     * Lorsqu'un joueur entre dans une salle solo ou lorsque 2 joueurs rentres dans
     * une salle multijoueur et le créateur envoie une requête, une session est crée
     * et son identifiant (id) est envoyé à tout les joueurs dans la salle.
     *
     * @param client Le client qui a fait la demande d'un identifiant (id) de session
     * @param gameId L'identifiant du jeu que le client veut jouer
     */
    @SubscribeMessage(SessionEvents.StartLimitedTimeSession)
    async startLimitedTimeSession(client: Socket, isSolo: boolean) {
        console.log('on rentre dans le startLimitedTimeSession');
        this.logger.log(`Client ${client.id} asked for session id`);
        if (isSolo) {
            console.log('we enter in the isSolo = true part if startLimitedTimeSession');
            const sessionId = this.sessionService.createNewLimitedTimeSession(client.id);
            this.startSessionTimer(client, sessionId);
            this.logger.log(`solo session ${sessionId} was created by ${client.id}`);
            return sessionId;
        }
        client.rooms.forEach(async (roomId) => {
            if (roomId.startsWith('gameRoom')) {
                const clientsInRoom = await this.server.in(roomId).allSockets();
                if (clientsInRoom.size === 2) {
                    const [firstClientId, secondClientId] = clientsInRoom;
                    const sessionId = this.sessionService.createNewLimitedTimeSession(firstClientId, secondClientId);
                    this.startSessionTimer(client, sessionId);
                    this.server.to(roomId).emit(SessionEvents.SessionId, sessionId);
                    this.logger.log(`multiplayer session ${sessionId} was created by client ${client.id}`);
                }
            }
        });
    }

    @SubscribeMessage(SessionEvents.LeaveRoom)
    leaveRoom(client: Socket) {
        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                client.leave(roomId);
                this.sessionService.removeName(client.id);
            }
        });
    }

    /**
     * Lorsqu'un joueur clic sur l'une des images, les coordonnés de ce clic sont envoyés
     * par websocket avec ce message. Permet de vérifier la découverte d'une différence
     * et mise a jour du score du/des joueur(s).
     *
     * @param client Le client qui a fait la soumission d'une coordonnée
     * @param data contient le sessionId et la coordonnée soumise
     * @returns le résultat s'il n'y a qu'un joueur dans la salle
     */
    @SubscribeMessage(SessionEvents.SubmitCoordinatesSoloGame)
    handleCoordinatesSubmissionSolo(client: Socket, data: [number, Coordinate]) {
        const [sessionId, coordinates] = data;
        let result: GuessResult;
        let session: ClassicSession;

        try {
            session = this.getSession(sessionId) as ClassicSession;
            result = session.tryGuess(coordinates, client.id);
            if (result.isCorrect) {
                this.sendSystemMessage(client, 'guess_good');
                if (result.winnerName) this.playerWon(client, sessionId, session.isSolo);
            } else {
                this.logger.log(`Client ${client.id} submitted a wrong guess`);
                this.sendSystemMessage(client, 'guess_bad');
            }
            return result;
        } catch (error) {
            this.logger.log(`Client ${client.id} submitted coordinates but coordinates are invalid or session is invalid`);
        }
    }

    @SubscribeMessage(SessionEvents.SubmitCoordinatesMultiGame)
    handleCoordinatesSubmissionMulti(client: Socket, data: [number, Coordinate]) {
        const [sessionId, coordinates] = data;
        let result: GuessResult;
        let session: ClassicSession;

        try {
            session = this.getSession(sessionId) as ClassicSession;
            result = session.tryGuess(coordinates, client.id);
            if (result.isCorrect) {
                this.notifyPlayersOfDiffFound(client, result);
                this.sendSystemMessage(client, 'guess_good');

                if (result.winnerName) this.playerWon(client, sessionId, session.isSolo);
            } else {
                this.logger.log(`Client ${client.id} submitted a wrong guess`);
                client.emit(SessionEvents.DifferenceFound, result);
            }
        } catch (error) {
            this.logger.log(`Client ${client.id} submitted coordinates but coordinates are invalid or session is invalid`);
        }
    }

    @SubscribeMessage(SessionEvents.SubmitCoordinatesLimitedTime)
    async handleCoordinatesSubmissionLimitedTime(client: Socket, data: [number, Coordinate]) {
        const [sessionId, coordinates] = data;
        let result: GuessResult;
        let session: LimitedTimeSession;

        try {
            session = this.getSession(sessionId) as LimitedTimeSession;
            result = await session.tryGuess(coordinates, client.id);
            if (result.isCorrect) {
                this.notifyPlayersOfDiffFound(client, result);
                this.sendSystemMessage(client, 'guess_good');
                client.rooms.forEach((roomId) => {
                    if (roomId.startsWith('gameRoom')) {
                        this.server.to(roomId).except(client.id).emit(SessionEvents.DifferenceFound, result);
                        this.logger.log(`Client ${client.id} emited that he found a difference to the room: ${roomId}`);
                    }
                });
                this.sendNewGame(client, session);
            } else {
                this.logger.log(`Client ${client.id} submitted a wrong guess`);
            }
            client.emit(SessionEvents.DifferenceFound, result);
        } catch (error) {
            this.logger.log(`Client ${client.id} submitted coordinates but coordinates are invalid or session is invalid`);
        }
    }

    /**
     * Récuperer la liste des différences non trouvées dans une session
     *
     * @param _ client (ne sert pas)
     * @param sessionId l'id de la session
     * @returns les différences non trouvées
     */
    @SubscribeMessage(SessionEvents.CheatGetAllDifferences)
    cheatGetAllDifferences(_: Socket, sessionId: number) {
        const session: ClassicSession = this.sessionService.findBySessionId(sessionId) as ClassicSession;

        if (session) {
            return session.getNotFoundDifferences();
        }
    }

    /**
     * Lorsqu'un client quitte une partie, il envoie un message pour prévenir les autres
     *
     * @param client Le client qui a quitté la partie
     */
    @SubscribeMessage(SessionEvents.PlayerLeft)
    playerLeft(client: Socket, sessionId: number) {
        this.logger.log(`Client ${client.id} exited the game`);
        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                this.logger.log(`Client ${client.id} emited that he left the game to ${roomId}`);
                this.sendSystemMessage(client, 'userDisconnected');
                this.server.to(roomId).except(client.id).emit(SessionEvents.OpponentLeftGame);
                this.sendSystemMessage(client, 'userDisconnected');
                this.server.socketsLeave(roomId);
            }
        });
        if (this.sessionService.findBySessionId(sessionId)) {
            try {
                this.sessionService.delete(sessionId);
            } catch (error) {
                this.logger.error(error);
            }
        }
        client.disconnect();
    }

    async sendNewGame(client: Socket, session: LimitedTimeSession) {
        // const allGames: Promise<Game[]> = this.gameService.findAll();
        // const newGame: Game = allGames[0];
        console.log(session.id);
        const chosenGame = await session.decideNewGame();
        if (!chosenGame) {
            this.limitedTimeGameEnded(client, false);
        }
        this.logger.log(`client ${client.id} is receiving a new game`);
        this.logger.log(`this is the main image id: ${chosenGame.imageMain}`);

        // return await this.gameService.findAll();
        // return chosenGame;
        client.emit(SessionEvents.NewGame, chosenGame);
        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                this.logger.log(`Room ${roomId} is receiving a new game`);
                this.server.to(roomId).except(client.id).emit(SessionEvents.NewGame, chosenGame);
            }
        });
    }

    /**
     * Commence le timer pour une session donnée, stocke l'id du timer dans la session
     * et envoie le temps (toutes les secondes) aux joueurs dans la session
     *
     * @param client Le client qui a fait la demande de démarrage du timer
     * @param sessionId L'identifiant de la session pour laquelle le timer doit être démarré
     */
    startSessionTimer(client: Socket, sessionId: number) {
        this.logger.log(`Client ${client.id} started the timer`);
        const session = this.sessionService.findBySessionId(sessionId);
        if (session) {
            if (session.isSolo) {
                session.timerId = setInterval(() => {
                    session.time++;
                    client.emit(SessionEvents.TimerUpdate, session.formatedTime);
                }, SECOND_IN_MILLISECONDS);
            } else {
                client.rooms.forEach((roomId) => {
                    if (roomId.startsWith('gameRoom')) {
                        session.timerId = setInterval(() => {
                            session.time++;
                            this.server.to(roomId).emit(SessionEvents.TimerUpdate, session.formatedTime);
                        }, SECOND_IN_MILLISECONDS);
                    }
                });
            }
        }
    }

    /**
     * Envoie les différences trouvées à tous les joueurs d'une salle
     *
     *
     * @param client
     * @param differenceFound
     */
    notifyPlayersOfDiffFound(client: Socket, differenceFound: GuessResult) {
        this.logger.log(`Client ${client.id} found a difference`);
        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                this.server.to(roomId).emit(SessionEvents.DifferenceFound, differenceFound);
                this.logger.log(`Client ${client.id} emited that he found a difference to the room: ${roomId}`);
            }
        });
    }

    /**
     * Envoie aux joueurs d'une partie que la partie est finie
     *
     * @param client socket du client qui a gagné
     * @param sessionId id de la session
     * @param isSolo true si la partie est solo et false si c'est multijoueur
     */
    async playerWon(client: Socket, sessionId: number, isSolo: boolean) {
        let winnerName: string;
        const session = this.sessionService.findBySessionId(sessionId);
        const seconds = session.time;
        const gameId = session.gameID;
        session.stopTimer();

        client.emit(SessionEvents.ProvideName);
        client.on(SessionEvents.PlayerName, (playerName: string) => {
            winnerName = playerName;
            const winnerInfo: WinnerInfo = { name: playerName, socketId: client.id };
            const finishedGame: FinishedGame = { winner: winnerName, time: seconds, solo: isSolo } as FinishedGame;
            try {
                this.gameService.addToScoreboard(gameId, finishedGame);
            } catch (error) {
                this.logger.error('error while adding to scoreboard : game is deleted');
            }

            if (isSolo) {
                this.logger.log(`Client ${client.id}  won the game`);
                this.server.to(client.id).emit(SessionEvents.PlayerWon, winnerInfo);
            } else {
                client.rooms.forEach((roomId) => {
                    if (roomId.startsWith('gameRoom')) {
                        this.logger.log(`Someone in Client ${client.id}'s room won the game`);
                        this.server.to(roomId).emit(SessionEvents.PlayerWon, winnerInfo);
                        this.server.socketsLeave(roomId);
                    }
                });
            }
        });
    }

    getGameRoom(client: Socket): string {
        let correctRoom = client.id;
        client.rooms.forEach((room: string) => {
            if (room.startsWith('gameRoom')) {
                correctRoom = room;
            }
        });
        return correctRoom;
    }

    getRoomId(client: Socket): string {
        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                return roomId;
            }
        });
        return;
    }

    sendSystemMessage(client: Socket, systemCode: string) {
        const playerName: string = this.sessionService.getName(client.id);
        this.server.to(this.getGameRoom(client)).emit('systemMessageFromServer', { playerName, systemCode });
    }

    limitedTimeGameEnded(client: Socket, timer?: boolean) {
        client.emit(SessionEvents.EndedGame, timer);
        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                this.logger.log('EndedGame has been sent: ' + client.id);
                this.server.to(roomId).emit(SessionEvents.EndedGame, timer);
            }
        });
    }

    handleDisconnect(client: Socket) {
        this.logger.log('Client disconnected : ' + client.id);
        try {
            const session = this.sessionService.findByClientId(client.id);
            if (!session) return;
            this.sessionService.delete(session.id);
            this.logger.log(`Session with client ${client.id} has been deleted`);
        } catch (error) {
            this.logger.error(error);
        }
    }

    getSession(sessionId: number): Session {
        const session = this.sessionService.findBySessionId(sessionId);
        if (!session) {
            throw new Error();
        }
        return session;
    }
}
