import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Coordinate } from '@common/coordinate';
import { ImageComparisonResult } from '@common/image-comparison-result';
import { communicationMessage } from '@common/communicationMessage';
import { Game } from '@common/game';
import { GameConstants } from '@common/game-constants';
import { firstValueFrom, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { GameHistory } from '@common/game-history';

@Injectable({
    providedIn: 'root',
})
export class CommunicationService {
    private readonly baseUrl: string = environment.serverUrl;

    constructor(readonly http: HttpClient) {}

    /**
     * Réquête GET pour récupérer un message du serveur
     *
     * @returns message du serveur
     */
    basicGet(): Observable<communicationMessage> {
        return this.http.get<communicationMessage>(`${this.baseUrl}/example`).pipe(catchError(this.handleError<communicationMessage>('basicGet')));
    }

    /**
     * envoie une requête POST au serveur et récupère un nombre en réponse
     *
     * @param path chemin de la route du serveur
     * @returns nombre reçu du serveur
     */
    customPost(path: string): Observable<number> {
        return this.http.post<number>(`${this.baseUrl}/${path}`, {}).pipe(catchError(this.handleError<number>('customGet')));
    }

    /**
     * envoie une requête POST au serveur.
     *
     * @param message envoie un message au serveur
     * @returns HttpResponse<string> la réponse du serveur
     */
    basicPost(message: communicationMessage): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/example/send`, message, { observe: 'response', responseType: 'text' });
    }

    /**
     * Envoie une requête POST au serveur en utilisant le chemin de la route du serveur et le payload de la requête
     *
     * @param pathExtension chemin vers la bonne route du serveur
     * @param body Payload a envoyer au serveur
     * @param headers (optional) entêtes de la requête
     * @returns la première valeur retournée par le serveur
     */
    async postRequest(pathExtension: string, body: object, headers: HttpHeaders | undefined = undefined): Promise<HttpResponse<object | number>> {
        let observer: Observable<HttpResponse<object>>;
        if (headers) observer = this.http.post(`${this.baseUrl}/${pathExtension}`, body, { headers, observe: 'response' });
        else observer = this.http.post(`${this.baseUrl}/${pathExtension}`, body, { observe: 'response' });
        return await firstValueFrom(observer);
    }

    /**
     * Envoie une requête GET au serveur en utilisant le chemin de la route du serveur et le payload de la requête
     *
     * @param pathExtension Chemin vers la bonne route du serveur
     * @param headers (optional) entêtes de la requête
     * @returns Première valeur retournée par le serveur
     */
    async getRequest(pathExtension: string): Promise<Game[]> {
        const observer = this.http.get<Game[]>(`${this.baseUrl}/${pathExtension}`).pipe(catchError(this.handleError<Game[]>('error getting games')));
        return firstValueFrom(observer);
    }

    /**
     * Envoie une requête DELETE au serveur en utilisant le chemin de la route du serveur et le payload de la requête
     *
     * @param pathExtension chemin vers la bonne route du serveur
     * @param headers (optional) entêtes de la requête
     * @returns la première valeur retournée par le serveur
     */
    async deleteRequest(pathExtension: string, headers: HttpHeaders | undefined = undefined): Promise<HttpResponse<void>> {
        let observer: Observable<HttpResponse<void>>;
        if (headers)
            observer = this.http
                .delete<void>(`${this.baseUrl}/${pathExtension}`, { headers, observe: 'response' })
                .pipe(catchError(this.handleError<HttpResponse<void>>('Erreur lors de la supression de jeu.')));
        else observer = this.http.delete<void>(`${this.baseUrl}/${pathExtension}`, { observe: 'response' });
        return await firstValueFrom(observer);
    }

    /**
     * Récupère les informations du jeu depuis le serveur à partir de son id
     *
     * @param gameId id du jeu
     * @returns les informations du jeu
     */
    gameInfoGet(gameId: string): Observable<Game> {
        return this.http.get<Game>(`${this.baseUrl}/games/${gameId}`).pipe(catchError(this.handleError<Game>('error getting game info')));
    }

    /**
     * Envoie les coordonnées de la tentative de différenciation au serveur
     *
     * @param gameSession l'id de la session de jeu
     * @param coordinates Les coordonnées de la tentative
     * @returns le resultat de la tentative
     */
    sendCoordinates(gameSession: number, coordinates: Coordinate): Observable<HttpResponse<object>> {
        return this.http.post(`${this.baseUrl}/session/${gameSession}/guess`, coordinates, { observe: 'response', responseType: 'json' });
    }

    /**
     * Crée un stream d'une image à partir de son id
     *
     * @param id l'id de l'image à récupérer l'url
     * @returns l'url de l'image
     */
    getImageURL(id: number) {
        return `${this.baseUrl}/images/${id}`;
    }

    async postNewHistoryEntry(newEntry: GameHistory): Promise<HttpResponse<object>> {
        const observer = this.http.post<GameHistory>(`${this.baseUrl}/history/`, newEntry, {
            observe: 'response',
            responseType: 'json',
        });
        return await firstValueFrom(observer);
    }

    async getHistory(gameId: string): Promise<GameHistory[]> {
        const observer = this.http
            .get<GameHistory[]>(`${this.baseUrl}/history/${gameId}`)
            .pipe(catchError(this.handleError<GameHistory[]>('error getting history')));
        return await firstValueFrom(observer);
    }

    async deleteHistory(gameId: string) {
        const observer = this.http.delete(`${this.baseUrl}/history/${gameId}`, { observe: 'response' });
        return await firstValueFrom(observer);
    }

    /**
     * envoie une requête au serveur pour comparer les différences entre 2 images déjà sauvegardées sur le serveur
     *
     * @param originalImageId l'id de l'image originale sauvegardée sur le serveur
     * @param altImageId l'id de l'image alternative sauvegardée sur le serveur
     * @param radius le rayon des cercles à utiliser pour la comparaison
     * @returns response if the server returns the right information or throws error if not
     */
    async compareImages(originalImage: File, altImage: File, radius: number): Promise<ImageComparisonResult> {
        const formData: FormData = new FormData();
        formData.append('mainFile', originalImage, originalImage.name);
        formData.append('altFile', altImage, altImage.name);
        formData.append('radius', radius.toString());

        const headers = new HttpHeaders();
        headers.append('content-type', 'multipart/form-data');
        headers.append('Accept', 'application/json');

        const response = await this.postRequest('images/compare', formData, headers);
        if (response instanceof HttpResponse && typeof response.body === 'object') {
            if (response.ok && this.instanceOfImageComparisonResult(response.body)) return response.body;
        }
        throw new Error("l'image n'a pas pu être comparé");
    }

    async getGameConstants(): Promise<GameConstants> {
        const observer = this.http.get<GameConstants>(`${this.baseUrl}/games/constants`).pipe(catchError(this.handleError<GameConstants>('error getting games')));
        return firstValueFrom(observer);
    }

    async patchGameConstants(gameConsts: GameConstants) {
        const observer = this.http.patch<GameConstants>(`${this.baseUrl}/games/constants`, gameConsts, { observe: 'response' });
        return await firstValueFrom(observer);
    }

    /**
     * Support d'une erreur HTTP
     *
     * @param request request that failed
     * @param result error message
     * @returns error message
     */
    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }

    private instanceOfImageComparisonResult(object: object | null): object is ImageComparisonResult {
        if (object) return 'isValid' in object && 'isHard' in object && 'differenceCount' in object;
        return false;
    }
}
