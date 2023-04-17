/* eslint-disable no-unused-vars, @typescript-eslint/no-empty-function */
import { ClassicSession } from '@app/services/session/classic-session';
import { Socket } from 'socket.io';

export const stubSocket: Socket = {
    id: 'socket-id',
    rooms: new Set(['gameRoom-room1', 'room2', 'room3', 'room4']),
    emit: (event) => {},
    on: (event, callback) => {},
    leave: (roomId) => {},
    disconnect: () => {},
} as Socket;

export const secondStubSocket: Socket = {
    id: 'second-socket-id',
} as Socket;

export const stubGameId = 11;

export const stubSession: ClassicSession = {
    time: 100,
    gameID: 'game-id',
    stopTimer: () => {},
    tryGuess: (coord) => {},
    getClue: () => {},
    id: 0,
    nGuesses: 0,
    nPenalties: 0,
} as unknown as ClassicSession;
