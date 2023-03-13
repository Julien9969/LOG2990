import { GameService } from '@app/services/game/game.service';
import { SessionService } from '@app/services/session/session.service';
import { AskSessionIdData } from '@common/askSessionIdData';
import { Coordinate } from '@common/coordinate';
import { GuessResult } from '@common/guess-result';
import { NewScore } from '@common/new-score';
import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionEvents } from './session.gateway.events';

@WebSocketGateway({ cors: true })
export class SessionGateway {
    @WebSocketServer() private server: Server;

    constructor(private readonly logger: Logger, private readonly sessionService: SessionService, private readonly gameService: GameService) {}

    @SubscribeMessage(SessionEvents.GetClientId)
    getClientId(client: Socket) {
        this.logger.log(`Client ${client.id} has requested his socket Id`);
        return client.id;
    }

    /**
     * Récupérer toutes les sessions de jeu active
     *
     * @returns La liste des sessions de jeu
     */
    @SubscribeMessage(SessionEvents.GetAllSessions)
    getAllActiveSession() {
        return this.sessionService.getAll();
    }

    /**
     * Récupère les informations d'une session en cours
     *
     * @param id L'identifiant de la session
     * @returns La session recherchée
     */
    @SubscribeMessage(SessionEvents.GetSession)
    getSessionById(client: Socket, sessionId: number) {
        const session = this.sessionService.findById(sessionId);
        return session;
    }

    /**
     * Permet de fermer une session
     *
     * @param id L'identifiant de la session à supprimer
     */
    @SubscribeMessage(SessionEvents.CloseSession)
    deleteGame(sessionId: number) {
        this.sessionService.delete(sessionId);
        return sessionId;
    }

    /**
     * Lorsqu'un joueur entre dans une salle solo ou lorsque 2 joueurs rentres dans
     * une salle multijoueur et le créateur envoie uen requête, une session est crée
     * et son identifiant (id) est envoyé à tout les joueurs dans la salle.
     *
     * @param client Le client qui a fait la demande d'un identifiant (id) de session
     * @param gameId L'identifiant du jeu que le client veut jouer
     */
    @SubscribeMessage(SessionEvents.AskForSessionId)
    async askForSessionId(client: Socket, askSessionIdData: AskSessionIdData) {
        const { gameId, isSolo } = askSessionIdData;
        this.logger.log(`Client ${client.id} asked for session id`);
        if (isSolo) {
            const sessionId = this.sessionService.createNewSession(gameId, client.id);
            this.logger.log(`solo session ${sessionId} was created by ${client.id}`);
            return sessionId;
        }
        client.rooms.forEach(async (roomId) => {
            if (roomId.startsWith('gameRoom')) {
                const clientsInRoom = await this.server.in(roomId).allSockets();
                if (clientsInRoom.size === 2) {
                    const [firstClientId, secondClientId] = clientsInRoom;
                    const sessionId = this.sessionService.createNewSession(gameId, firstClientId, secondClientId);
                    this.server.to(roomId).emit('sessionId', sessionId);
                    this.logger.log(`multiplayer session ${sessionId} was created by client ${client.id}`);
                }
            }
        });
    }

    @SubscribeMessage('leaveRoom')
    leaveRoom(client: Socket) {
        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                client.leave(roomId);
            }
        });
    }
    // TODO : DELETE
    // afterInit() {
    //     setInterval(() => {
    //         this.emitTime();
    //     }, DELAY_BEFORE_EMITTING_TIME);
    // }

    /**
     * Lorsqu'un joueur clic sur l'une des images, les coordonnés de ce clic sont envoyés
     * par websocket avec ce message. Permet de vérifier la découverte d'une différence
     * et mise a jour du score du/des joueur(s).
     *
     * @param client Le client qui a fait la soumission d'une coordonnée
     * @param data contient le sessionId et la coordonnée soumise
     * @returns le résultat s'il n'y a qu'un joueur dans la salle
     */
    @SubscribeMessage(SessionEvents.SubmitCoordinates)
    handleCoordinatesSubmission(client: Socket, data: GuessResult) {
        const sessionId: number = data[0];
        const coordinates: Coordinate = data[1];
        const session = this.sessionService.findById(sessionId);
        let result: NewScore;
        this.logger.log(`Client ${client.id} submitted coordinates`);
        if (!session) {
            this.logger.log(`Client ${client.id} submitted coordinates but session is invalid`);
        }
        try {
            result = session.tryGuess(coordinates, client.id);
            if (result.guessResult.isCorrect) {
                this.notifyPlayersOfDiffFound(client, result.guessResult);
                if (result.gameWonBy !== 'No winner') {
                    this.playerWon(client, result.gameWonBy, session.getNbPlayers() === 1);
                }
            } else {
                this.logger.log(`Client ${client.id} submitted a wrong guess`);
                client.emit('differenceFound', result.guessResult);
            }
        } catch (error) {
            this.logger.log(`Client ${client.id} submitted coordinates but coordinates are invalid`);
        }
        if (session.getNbPlayers() === 1) {
            return result.guessResult;
        }
    }

    /**
     * Lorsqu'un client quitte une partie, il envoie un message pour prévenir les autres
     *
     * @param client Le client qui a quitté la partie
     */
    @SubscribeMessage(SessionEvents.PlayerLeft)
    playerLeft(client: Socket) {
        this.logger.log(`Client ${client.id} exited the game`);
        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                this.logger.log(`Client ${client.id} emited that he left the game to ${roomId}`);
                this.server.to(roomId).except(client.id).emit('opponentLeftGame');
                this.server.socketsLeave(roomId);
            }
        });
        client.disconnect();
    }

    /**
     * S'il y a d'autres joueurs dans la salle, leur envoie les
     * nouvelles différences trouvé
     *
     * @param client
     * @param differenceFound
     */
    notifyPlayersOfDiffFound(client: Socket, differenceFound: GuessResult) {
        this.logger.log(`Client ${client.id} found a difference`);
        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                this.server.to(roomId).emit('differenceFound', differenceFound);
                this.logger.log(`Client ${client.id} emited that he found a difference to the room: ${roomId}`);
            }
        });
    }
    /**
     * Envoie aux joueurs d'une partie que la partie est finie
     *
     * @param client
     * @param differenceFound
     */
    playerWon(client: Socket, winnerName: string, isSolo: boolean) {
        if (isSolo) {
            this.logger.log(`Client ${client.id}  won the game`);
            this.server.to(client.id).emit('playerWon', winnerName);
        } else {
            client.rooms.forEach((roomId) => {
                if (roomId.startsWith('gameRoom')) {
                    this.logger.log(`Someone in Client ${client.id}'s room won the game`);
                    this.logger.log(`Client ${client.id} made the players leave the game ${roomId}`);
                    this.server.to(roomId).emit('playerWon', winnerName);
                    this.server.socketsLeave(roomId);
                }
            });
        }
    }
}
