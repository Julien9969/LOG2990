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
     * Réquête GET pour récupérer un message du serveur
     *
     * @returns message du serveur
     */
    basicGet(): Observable<Message> {
        return this.http.get<Message>(`${this.baseUrl}/example`).pipe(catchError(this.handleError<Message>('basicGet')));
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
    basicPost(message: Message): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/example/send`, message, { observe: 'response', responseType: 'text' });
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
     * Récupère les informations du jeu depuis le serveur à partir de son id
     *
     * @param gameId id du jeu
     * @returns les informations du jeu
     */
    gameInfoGet(gameId: string): Observable<Game> {
        return this.http.get<Game>(`${this.baseUrl}/games/${gameId}`).pipe(catchError(this.handleError<Game>('error getting game info')));
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

    // Images route methods

    /**
     * envoie une requête au serveur pour comparer les différences entre 2 images déjà sauvegardées sur le serveur
     *
     * @param originalImageId l'id de l'image originale sauvegardée sur le serveur
     * @param altImageId l'id de l'image alternative sauvegardée sur le serveur
     * @param radius le rayon des cercles à utiliser pour la comparaison
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
     * Envoyer une requête POST au serveur pour sauvegarder une image sur le serveur
     *
     * @param imageToSave Le fichier image à sauvegarder
     * @returns l'id de l'image sauvegardée ou une erreur si la sauvegarde a échoué
     */
    async saveImage(imageToSave: File): Promise<number> {
        const formData: FormData = new FormData();
        formData.append('file', imageToSave, imageToSave.name);
        const headers = new HttpHeaders();
        headers.append('content-type', 'image/png');
        headers.append('Accept', 'application/json');

        const response = await this.postRequest('images', formData, headers);
        if (response.ok && typeof response.body === 'number') return response.body;
        throw new Error("l'image n'a pas pu être enregistrer");
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
     * Crée un stream d'une image à partir de son id
     *
     * @param id l'id de l'image à récupérer l'url
     * @returns l'url de l'image
     */
    getImageURL(id: number) {
        return `${this.baseUrl}/images/${id}`;
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
}
