/* eslint-disable no-unused-vars, @typescript-eslint/no-empty-function */
import { Session } from '@app/services/session/session';
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

export const stubSession: Session = {
    timeElapsed: 100,
    gameID: 'game-id',
    stopTimer: () => {},
    tryGuess: (coord, id) => {},
} as Session;
