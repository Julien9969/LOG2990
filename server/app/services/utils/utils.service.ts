import { HttpException, HttpStatus } from '@nestjs/common';

export class Utils {
    /**
     * Convertit une chaine en nombre avec une gestion d'erreur en cas de mauvais format
     *
     * @param input La chaine de caractere à convertir en nombre
     * @returns Le nombre convertit
     */
    static convertToInt(input: string) {
        const num = parseInt(input, 10);
        if (Number.isNaN(num)) {
            throw new HttpException('Entree doit etre un nombre.', HttpStatus.BAD_REQUEST);
        }
        return num;
    }
}
