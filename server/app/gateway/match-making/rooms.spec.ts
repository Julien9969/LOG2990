import { Rooms } from '@app/gateway/match-making/rooms';
import { Test, TestingModule } from '@nestjs/testing';

describe('Rooms', () => {
    let rooms: Rooms;
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [Rooms],
        }).compile();

        rooms = module.get<Rooms>(Rooms);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(rooms).toBeDefined();
    });

    it('length getter should return the length of the rooms array', () => {
        expect(rooms.length).toEqual(0);
        rooms.push({ gameId: 'gameId', roomId: 'roomId' });
        expect(rooms.length).toEqual(1);
    });

    it('push should add a room to the rooms array', () => {
        expect(rooms.length).toEqual(0);
        rooms.push({ gameId: 'gameId', roomId: 'roomId' });
        expect(rooms.length).toEqual(1);
    });

    it('forEach should call the callback for each room in the rooms array', () => {
        const callback = jest.fn();
        rooms.forEach(callback);
        expect(callback).not.toHaveBeenCalled();
        rooms.push({ gameId: 'gameId', roomId: 'roomId' });
        rooms.push({ gameId: 'gameId', roomId: 'roomId' });
        rooms.forEach(callback);
        expect(callback).toHaveBeenCalledTimes(2);
    });

    it('insertSortByDate should insert the room in the rooms array sorted by date (last number) at beginning if oldest', () => {
        rooms.push({ gameId: 'gameId', roomId: 'roomId-1-134' });
        rooms.push({ gameId: 'gameId', roomId: 'roomId-3-135' });
        rooms.insertSortByDate('gameId', 'roomId-1-133');
        expect(rooms.length).toEqual(3);
        expect(rooms['rooms'][0].roomId).toEqual('roomId-1-133');
    });

    it('insertSortByDate should insert a room in the rooms array sorted by date (last number) at the end if newest', () => {
        rooms.push({ gameId: 'gameId', roomId: 'roomId-1-134' });
        rooms.push({ gameId: 'gameId', roomId: 'roomId-3-135' });
        rooms.insertSortByDate('gameId', 'roomId-1-136');
        expect(rooms.length).toEqual(3);
        expect(rooms['rooms'][2].roomId).toEqual('roomId-1-136');
    });

    it('filterRoomsByGameId should return an array of rooms filtered by gameId', () => {
        rooms.push({ gameId: 'gameId', roomId: 'roomId-1-134' });
        rooms.push({ gameId: 'gameId', roomId: 'roomId-3-135' });
        rooms.push({ gameId: 'gameId2', roomId: 'roomId-1-133' });
        expect(rooms.filterRoomsByGameId('gameId').length).toEqual(2);
        expect(rooms.filterRoomsByGameId('gameId2').length).toEqual(1);
    });

    it('removeThisRooms should remove a room from the rooms array', () => {
        rooms.push({ gameId: 'gameId', roomId: 'roomId-1-134' });
        rooms.push({ gameId: 'gameId', roomId: 'roomId-3-135' });
        rooms.push({ gameId: 'gameId2', roomId: 'roomId-1-133' });
        expect(rooms.length).toEqual(3);
        rooms.removeThisRoom('roomId-1-133');
        expect(rooms.length).toEqual(2);
    });

    it('getDateFromRoomId should return a date from a roomId', () => {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(rooms['getDateFromRoomId']('roomId-1-134')).toEqual(new Date(134));
    });
});
