import { ImageService } from '@app/services/images/image.service';
import { Utils } from '@app/services/utils/utils.service';
import { ImageComparisonInput } from '@common/image-comparison-input';
import { ImageComparisonResult } from '@common/image-comparison-result';
import { Body, Controller, Delete, Get, Header, HttpCode, Param, Post, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums';
import { HttpException } from '@nestjs/common/exceptions';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('images')
export class ImageController {
    constructor(private readonly imageService: ImageService) {}
    /**
     * Retourne la liste des ID d'images
     *
     * @returns une liste des éléments images.
     */
    @Get()
    getAll() {
        return this.imageService.getAllImageIds();
    }

    /**
     * Renvoie une image pour affichage
     *
     * @param params l'id de l'image
     * @returns une réponse avec le content-type image-bmp et le buffer de l'image.
     * le path de l'api est utilisable directement comme source dans une balise img.
     */
    @Get('/:id')
    @Header('content-type', 'image/bmp')
    serveImage(@Param('id') id: string): StreamableFile {
        const idInt = Utils.convertToInt(id);
        const file = this.imageService.getImage(idInt);
        if (!file) {
            throw new HttpException('Image ' + id + ' non existante', HttpStatus.NOT_FOUND);
        }
        return new StreamableFile(file);
    }

    /**
     * Télécharge une nouvelle image
     *
     * @param file Le fichier binaire envoyé directement à travers l'attribut 'file' d'un form html
     * @returns l'id de l'image crée
     */
    @Post()
    @Header('content-type', 'image/bmp')
    @UseInterceptors(FileInterceptor('file'))
    addNewImage(@UploadedFile() file: Express.Multer.File) {
        const newImageId = this.imageService.saveImage(file.buffer);
        return newImageId;
    }

    /**
     * Détruit une image spécifique dans la mémoire serveur et dans la permanence
     *
     * @param params id de l'image
     * @returns Un message d'erreur si il y en a une, NO CONTENT en cas de succès
     */
    @Delete('/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteImage(@Param('id') stringId: string) {
        const id = Utils.convertToInt(stringId);
        try {
            this.imageService.deleteImage(id);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Compare 2 images selon un rayon d'elargissement, en fonction des règles du jeu
     *  comme le nombre minimal et maximal de différences
     *
     * @param body Contient les id des images principale et alternative, ainsi que le rayon
     * @returns Un résultat de type ImageComparisonResult, avec les infos comme la validité et la difficulté
     */
    @Post('/compare')
    @HttpCode(HttpStatus.OK)
    async compareImages(@Body() body: ImageComparisonInput): Promise<ImageComparisonResult> {
        if (!body.imageMain || !body.imageAlt || body.radius === undefined) {
            throw new HttpException('Il manque des parametres dans le body.', HttpStatus.BAD_REQUEST);
        }

        let result: ImageComparisonResult;
        try {
            result = await this.imageService.compareImages(body.imageMain, body.imageAlt, body.radius);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }

        return result;
    }
}
