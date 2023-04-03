/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-throw-literal, max-lines */
import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PATH_TO_VALID_IMAGE } from '@app/constants/utils-constants';
import { CommunicationService } from '@app/services/communication/communication.service';
import { communicationMessage } from '@common/communicationMessage';
import { Game } from '@common/game';
import { GameConstants } from '@common/game-constants';
import { GameHistory } from '@common/game-history';
import { ImageComparisonResult } from '@common/image-comparison-result';

describe('CommunicationService', () => {
    let httpMock: HttpTestingController;
    let service: CommunicationService;
    let baseUrl: string;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(CommunicationService);
        httpMock = TestBed.inject(HttpTestingController);
        baseUrl = service['baseUrl'];
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return expected message (HttpClient called once)', () => {
        const expectedMessage: communicationMessage = { body: 'Hello', title: 'World' };

        // check the content of the mocked call
        service.basicGet().subscribe({
            next: (response: communicationMessage) => {
                expect(response.title).toEqual(expectedMessage.title);
                expect(response.body).toEqual(expectedMessage.body);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/example`);
        expect(req.request.method).toBe('GET');
        // actually send the request
        req.flush(expectedMessage);
    });

    it('should not return any message when sending a POST request (HttpClient called once)', () => {
        const sentMessage: communicationMessage = { body: 'Hello', title: 'World' };
        // subscribe to the mocked call
        service.basicPost(sentMessage).subscribe({
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            next: () => {},
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/example/send`);
        expect(req.request.method).toBe('POST');
        // actually send the request
        req.flush(sentMessage);
    });

    it('should handle http error safely', () => {
        service.basicGet().subscribe({
            next: (response: communicationMessage) => {
                expect(response).toBeUndefined();
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/example`);
        expect(req.request.method).toBe('GET');
        req.error(new ProgressEvent('Random error occurred'));
    });

    describe('postRequest', () => {
        let pathExtension: string;
        let body: object;
        let headers: HttpHeaders;

        beforeEach(() => {
            pathExtension = 'test';
            body = { test: 'test' };
            headers = new HttpHeaders();
        });

        it('should send a POST request to the given server route with the given payload', async () => {
            service.postRequest(pathExtension, body);
            const req = httpMock.expectOne(`${baseUrl}/${pathExtension}`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(body);
            req.flush(null, { status: 200, statusText: 'Ok' });
        });

        it('should send a POST request to the given server route with the given payload and headers', async () => {
            service.postRequest(pathExtension, body, headers);
            const req = httpMock.expectOne(`${baseUrl}/${pathExtension}`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(body);
            expect(req.request.headers).toEqual(headers);
            req.flush(null, { status: 200, statusText: 'Ok' });
        });
    });

    describe('deleteRequest', () => {
        let pathExtension: string;
        let headers: HttpHeaders;

        beforeEach(() => {
            pathExtension = 'test';
            headers = new HttpHeaders();
        });

        it('should send a DELETE request to the given server route with the given payload', async () => {
            service.deleteRequest(pathExtension);
            const req = httpMock.expectOne(`${baseUrl}/${pathExtension}`);
            expect(req.request.method).toBe('DELETE');
            expect(req.request.body).toBeFalsy();
            req.flush(null, { status: 200, statusText: 'Ok' });
        });

        it('should send a DELETE request to the given server route with the given payload and headers', async () => {
            service.deleteRequest(pathExtension, headers);
            const req = httpMock.expectOne(`${baseUrl}/${pathExtension}`);
            expect(req.request.method).toBe('DELETE');
            expect(req.request.body).toBeFalsy();
            expect(req.request.headers).toEqual(headers);
            req.flush(null, { status: 200, statusText: 'Ok' });
        });
    });

    describe('compareImages', () => {
        let validFile: File;
        let radius: number;

        let postRequestSpy: jasmine.Spy;
        let validServerResponse: HttpResponse<object>;

        beforeEach(async () => {
            validFile = new File([await (await fetch(PATH_TO_VALID_IMAGE)).blob()], 'valid-image.BMP', { type: 'image/bmp' });
            radius = 3;

            validServerResponse = new HttpResponse({
                status: 200,
                body: {
                    isValid: true,
                    isHard: true,
                    differenceCount: 3,
                    differenceImageId: 3333,
                },
            });
            postRequestSpy = spyOn(service, 'postRequest').and.callFake(async () => Promise.resolve(validServerResponse));
        });

        it('should call postRequest', async () => {
            await service.compareImages(validFile, validFile, radius);
            expect(postRequestSpy).toHaveBeenCalled();
        });

        it('should throw error if response is not ok', async () => {
            postRequestSpy.and.callFake(() => new HttpErrorResponse({ status: 400, statusText: 'Test-Bad Request' }));
            try {
                await service.compareImages(validFile, validFile, radius);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

        it('should throw error if response body is not valid', async () => {
            postRequestSpy.and.callFake(async () => Promise.resolve(new HttpResponse({ status: 200, body: {} })));
            try {
                await service.compareImages(validFile, validFile, radius);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });
    });

    describe('getImageURL', () => {
        it('should return the correct URL', () => {
            const imageId = 1111;
            const expectedURL = `${baseUrl}/images/${imageId}`;
            expect(service.getImageURL(imageId)).toEqual(expectedURL);
        });
    });

    it('customPost should return expected message (HttpClient called once)', () => {
        const expectedMessage = 1;
        service.customPost('session/1').subscribe((response: number) => {
            expect(response).toEqual(expectedMessage);
        });

        const req = httpMock.expectOne(`${baseUrl}/session/1`);
        expect(req.request.method).toBe('POST');
        req.flush(1);
    });

    it('customPost should handle http error', () => {
        service.customPost('session/1').subscribe({
            next: (response: number) => {
                expect(response).toBeUndefined();
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/session/1`);
        expect(req.request.method).toBe('POST');
        req.error(new ProgressEvent('Random error occurred'));
    });

    it('sendCoordinates should return expected message (HttpClient called once)', () => {
        const expectedMessage = { body: { correct: true, alreadyFound: false, differenceNum: 1 } };

        service.sendCoordinates(1, { x: 1, y: 2 }).subscribe((response) => {
            expect(response.body).toEqual(expectedMessage);
        });

        const req = httpMock.expectOne(`${baseUrl}/session/1/guess`);
        expect(req.request.method).toBe('POST');
        req.flush(expectedMessage);
    });

    it('sendCoordinates should handle http error', () => {
        service.sendCoordinates(1, { x: 1, y: 2 }).subscribe({
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            next: () => {},
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/session/1/guess`);
        expect(req.request.method).toBe('POST');
        req.flush({ x: 1, y: 2 });
    });

    it('gameInfoGet should return expected message (HttpClient called once)', () => {
        const expectedMessage: Game = {
            id: '0',
            name: '',
            imageMain: 0,
            imageAlt: 0,
            scoreBoardSolo: [['', 0]],
            scoreBoardMulti: [['', 0]],
            isValid: true,
            isHard: false,
            differenceCount: 0,
        };

        service.gameInfoGet('1').subscribe({
            next: (response) => {
                expect(response).toEqual(expectedMessage);
            },
        });

        const req = httpMock.expectOne(`${baseUrl}/games/1`);
        expect(req.request.method).toBe('GET');
        req.flush(expectedMessage);
    });

    it('gameInfoGet should handle http error', () => {
        service.gameInfoGet('1').subscribe({
            next: (response: Game) => {
                expect(response).toBeUndefined();
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/games/1`);
        expect(req.request.method).toBe('GET');
        req.error(new ProgressEvent('Random error occurred'));
    });

    it('getRequest should all games', async () => {
        const expectedGames: Game[] = [
            {
                id: '0',
                name: '',
                imageMain: 0,
                imageAlt: 0,
                scoreBoardSolo: [['', 0]],
                scoreBoardMulti: [['', 0]],
                isValid: true,
                isHard: false,
                differenceCount: 0,
            },
        ];

        service.getRequest('test').then((games) => {
            expect(games).toEqual(expectedGames);
        });

        const req = httpMock.expectOne(`${baseUrl}/test`);
        expect(req.request.method).toEqual('GET');
        req.flush(expectedGames);
    });

    it('getRequest should handle http error', () => {
        service.getRequest('test').then((games) => {
            expect(games).toBeUndefined();
        });

        const req = httpMock.expectOne(`${baseUrl}/test`);
        expect(req.request.method).toEqual('GET');
        req.error(new ProgressEvent('Random error occurred'));
    });

    it('getImageURL should return correct image URL', () => {
        const id = 123;
        const expectedUrl = `${baseUrl}/images/${id}`;
        const url = service.getImageURL(id);
        expect(url).toEqual(expectedUrl);
    });

    it('postNewHistoryEntry should post a new history entry', () => {
        const historyEntry: GameHistory = {
            gameId: '1',
            gameMode: 'solo',
            playerOne: 'player1',
            playerTwo: 'player2',
            startDateTime: '12/12/12',
            duration: '0.1',
        };
        const expectedUrl = `${baseUrl}/history/`;
        service.postNewHistoryEntry(historyEntry);
        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toEqual('POST');
        req.flush(null, { status: 200, statusText: 'Ok' });
    });

    it('getHistory should return a list of history entries', () => {
        const expectedHistory: GameHistory[] = [
            {
                gameId: '1',
                gameMode: 'solo',
                playerOne: 'player1',
                playerTwo: 'player2',
                startDateTime: '12/12/12',
                duration: '0.1',
            },
        ];
        const expectedUrl = `${baseUrl}/history`;
        service.getHistory().then((history) => {
            expect(history).toEqual(expectedHistory);
        });
        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toEqual('GET');
        req.flush(expectedHistory);
    });

    it('deleteHistory should delete a history entry', () => {
        const expectedUrl = `${baseUrl}/history`;
        service.deleteHistory();
        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toEqual('DELETE');
        req.flush(null, { status: 200, statusText: 'Ok' });
    });

    describe('getGameConstants', () => {
        it('should return received constants', async () => {
            const expectedConstants: GameConstants = {
                time: 100,
                penalty: 10,
                reward: 10,
            };

            service.getGameConstants().then((games) => {
                expect(games).toEqual(expectedConstants);
            });

            const req = httpMock.expectOne(`${baseUrl}/games/constants`);
            expect(req.request.method).toEqual('GET');
            req.flush(expectedConstants);
        });

        it('should handle http error', () => {
            service.getGameConstants().then((games) => {
                expect(games).toBeUndefined();
            });

            const req = httpMock.expectOne(`${baseUrl}/games/constants`);
            expect(req.request.method).toEqual('GET');
            req.error(new ProgressEvent('Random error occurred'));
        });
    });

    describe('patchGameConstants', () => {
        const gameConsts: GameConstants = {
            time: 100,
            penalty: 10,
            reward: 10,
        };

        it('should send PATCH to correct path', async () => {
            service.patchGameConstants(gameConsts);

            const req = httpMock.expectOne(`${baseUrl}/games/constants`);
            expect(req.request.method).toBe('PATCH');
            expect(req.request.body).toEqual(gameConsts);
            req.flush(null, undefined);
        });

        it('should handle http error', async () => {
            service.patchGameConstants(gameConsts);

            const req = httpMock.expectOne(`${baseUrl}/games/constants`);
            expect(req.request.method).toEqual('PATCH');
            req.error(new ProgressEvent('Random error occurred'));
        });
    });

    describe('instanceOfImageComparisonResult', () => {
        it('should return true if the object is an instance of ImageComparisonResult', () => {
            const object: ImageComparisonResult = {
                isValid: true,
                isHard: false,
                differenceCount: 0,
                differenceImageBase64: '',
            };
            expect(service['instanceOfImageComparisonResult'](object)).toBeTrue();
        });

        it('should return false if not an instance of ImageComparisonResult', () => {
            const nullInput = null;
            expect(service['instanceOfImageComparisonResult'](nullInput)).toBeFalse();
        });
    });
});
