import { TestBed } from '@angular/core/testing';
import { SocketTestHelper } from '@common/socket-test-helper';
import { Socket } from 'socket.io-client';
import { SocketClientService } from './socket-client.service';

describe('SocketClientService', () => {
    let service: SocketClientService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SocketClientService);
        service['socket'] = new SocketTestHelper() as unknown as Socket;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should disconnect', () => {
        const spy = spyOn(service['socket'], 'disconnect');
        service.disconnect();
        expect(spy).toHaveBeenCalled();
    });

    it('isSocketAlive should return true if the socket is still connected', () => {
        service['socket'].connected = true;
        const isAlive = service.isSocketAlive();
        expect(isAlive).toBeTruthy();
    });

    it('isSocketAlive should return false if the socket is no longer connected', () => {
        service['socket'].connected = false;
        const isAlive = service.isSocketAlive();
        expect(isAlive).toBeFalsy();
    });

    it('isSocketAlive should return false if the socket is not defined', () => {
        (service['socket'] as unknown) = undefined;
        const isAlive = service.isSocketAlive();
        expect(isAlive).toBeFalsy();
    });

    it('should call socket.on with an event', () => {
        const event = 'helloWorld';
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const action = () => {};
        const spy = spyOn(service['socket'], 'on');
        service.on(event, action);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(event, jasmine.any(Function));
    });

    it('should call emit with data when using send', () => {
        const event = 'helloWorld';
        const data = 42;
        const spy = spyOn(service['socket'], 'emit');
        service.send(event, data);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(event, data);
    });

    it('sendAndCallBack should call emit with data and callback when using send', () => {
        const event = 'helloWorld';
        const data = 42;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const action = () => {};
        const spy = spyOn(service['socket'], 'emit');
        service.sendAndCallBack(event, data, action);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(event, data, jasmine.any(Function));
    });

    it('should call emit without data when using send if data is undefined', () => {
        const event = 'helloWorld';
        const data = undefined;
        const spy = spyOn(service['socket'], 'emit');
        service.send(event, data);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(event);
    });
});
