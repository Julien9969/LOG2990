import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Coordinate } from '@common/coordinate';

import { ImgCompareRes, instanceOfImgCompareRes } from '@app/interfaces/image-comparison-response';
import { Game } from '@common/game';
import { Message } from '@common/message';
import { firstValueFrom, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CommunicationService {
    private readonly baseUrl: string = environment.serverUrl;

    constructor(readonly http: HttpClient) {}

    /**
     * get a message from the server
     *
     * @returns a message from the server
     */
    basicGet(): Observable<Message> {
        return this.http.get<Message>(`${this.baseUrl}/example`).pipe(catchError(this.handleError<Message>('basicGet')));
    }

    /**
     * send a post to the server and get a number as response
     *
     * @param path the path of a server route
     * @returns a number
     */
    customPost(path: string): Observable<number> {
        return this.http.post<number>(`${this.baseUrl}/${path}`, {}).pipe(catchError(this.handleError<number>('customGet')));
    }

    /**
     * send a post request to the server.
     *
     * @param message send a message to the server
     * @returns HttpResponse<string> the response of the server
     */
    basicPost(message: Message): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/example/send`, message, { observe: 'response', responseType: 'text' });
    }

    /**
     * Send the coordinates of a guess to the server
     *
     * @param gameSession the id of the game session
     * @param coordinates the coordinates of the guess
     * @returns result of the guess
     */
    sendCoordinates(gameSession: number, coordinates: Coordinate): Observable<HttpResponse<object>> {
        return this.http.post(`${this.baseUrl}/session/${gameSession}/guess`, coordinates, { observe: 'response', responseType: 'json' });
    }

    /**
     * Get the game information from the server using his id
     *
     * @param gameId the id of the game
     * @returns the game infos
     */
    gameInfoGet(gameId: number): Observable<Game> {
        return this.http.get<Game>(`${this.baseUrl}/games/${gameId}`).pipe(catchError(this.handleError<Game>('error getting game info')));
    }

    /**
     * Sends a POST request to the server using the path of the server route & the payload of the request
     *
     * @param pathExtension Path to the correct server route
     * @param body Payload to send to the server
     * @param headers (optional) headers of the request
     * @returns the first value returned by the server
     */
    async postRequest(pathExtension: string, body: object, headers: HttpHeaders | undefined = undefined): Promise<HttpResponse<object | number>> {
        let observer: Observable<HttpResponse<object>>;
        if (headers) observer = this.http.post(`${this.baseUrl}/${pathExtension}`, body, { headers, observe: 'response' });
        else observer = this.http.post(`${this.baseUrl}/${pathExtension}`, body, { observe: 'response' });
        return await firstValueFrom(observer);
    }

    // Images route methods

    /**
     * sends a request to the server to compare the differences in 2 images already saved on the server
     *
     * @param originalImageId id of the original image saved on the server
     * @param altImageId id of the modified image saved on the server
     * @param radius radius of the circles used to analyse the differences between the 2 images
     * @returns response if the server returns the right information or throws error if not
     */
    async compareImages(originalImageId: number, altImageId: number, radius: number): Promise<ImgCompareRes> {
        if (typeof originalImageId === 'number' && typeof altImageId === 'number') {
            const body = { imageMain: originalImageId, imageAlt: altImageId, radius };
            const response = await this.postRequest('images/compare', body);
            if (response instanceof HttpResponse && typeof response.body === 'object') {
                if (response.ok && instanceOfImgCompareRes(response.body)) return response.body;
            }
        }
        throw new Error("l'image n'a pas pu être comparé");
    }

    /**
     * Send & save an image to the server
     *
     * @param imageToSave File to send & save to the server
     * @returns id of the saved image from the server or error message
     */
    async saveImage(imageToSave: File): Promise<number> {
        const formData: FormData = new FormData();
        formData.append('file', imageToSave, imageToSave.name);
        const headers = new HttpHeaders();
        headers.append('content-type', 'image/bmp');
        headers.append('Accept', 'application/json');

        const response = await this.postRequest('images', formData, headers);
        if (response.ok && typeof response.body === 'number') return response.body;
        throw new Error("l'image n'a pas pu être enregistrer");
    }
    /* Sends a GET request to the server using the path of the server route & the payload of the request
     *
     * @param pathExtension Path to the correct server route
     * @param headers (optional) headers of the request
     * @returns the first value returned by the server
     */
    async getRequest(pathExtension: string): Promise<Game[]> {
        const observer = this.http.get<Game[]>(`${this.baseUrl}/${pathExtension}`).pipe(catchError(this.handleError<Game[]>('error getting games')));
        return firstValueFrom(observer);
    }

    /**
     * create stream of the image url to get image from server
     *
     * @param id id of the image to get the url
     * @returns the url of the image
     */
    getImageURL(id: number) {
        return `${this.baseUrl}/images/${id}`;
    }

    /**
     * Handle Http operation that failed.
     *
     * @param request request that failed
     * @param result error message
     * @returns error message
     */
    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
