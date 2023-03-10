import { INDEX_NOT_FOUND } from '@app/gateway/constants/utils-constants';

export interface Room {
    gameId: string;
    roomId: string;
}

export class Rooms {
    private rooms: Room[] = [];

    get length(): number {
        return this.rooms.length;
    }

    push(room: Room): void {
        this.rooms.push(room);
    }

    forEach(callback: (room: Room) => void): void {
        this.rooms.forEach(callback);
    }

    insertSortByDate(gameId: string, roomId: string) {
        const index = this.rooms.findIndex((room) => this.getDateFromRoomId(roomId) < this.getDateFromRoomId(room.roomId)); // Sort by date
        if (index !== INDEX_NOT_FOUND) {
            this.rooms.splice(index, 0, { gameId, roomId });
        } else {
            this.rooms.push({ gameId, roomId });
        }
    }

    filterRoomsByGameId(gameId: string): Room[] {
        return this.rooms.filter((room) => room.gameId === gameId);
    }

    removeThisRoom(roomId: string) {
        this.rooms = this.rooms.filter((room) => room.roomId !== roomId);
    }

    private getDateFromRoomId(roomId: string) {
        return new Date(parseInt(roomId.split('-')[2], 10));
    }
}
