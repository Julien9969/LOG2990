import { GameImageInput } from '@app/interfaces/game-image-input';
import { ImageService } from '@app/services/images/image.service';
import { Utils } from '@app/services/utils/utils.service';
import { ImageComparisonResult } from '@common/image-comparison-result';
import { Body, Controller, Get, Header, HttpCode, Param, Post, StreamableFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums';
import { HttpException } from '@nestjs/common/exceptions';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

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
     * Compare 2 images selon un rayon d'elargissement, en fonction des règles du jeu
     *  comme le nombre minimal et maximal de différences
     *
     * @param input Contient le rayon d'elargissement
     * @param files Contient les données bitmap des images principale et alternative
     * @returns Un résultat de type ImageComparisonResult, avec les infos comme la validité et la difficulté
     */
    @Post('/compare')
    @HttpCode(HttpStatus.OK)
    @Header('content-type', 'application/json')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'mainFile', maxCount: 1 },
            { name: 'altFile', maxCount: 1 },
        ]),
    )
    async compareImages(@UploadedFiles() files: GameImageInput, @Body() input: { radius: string }): Promise<ImageComparisonResult> {
        if (this.notValidGameImageInput(files) || this.notValidRadius(input)) {
            throw new HttpException('Il manque des parametres dans le body.', HttpStatus.BAD_REQUEST);
        }
        const mainImageBitmap = files.mainFile[0].buffer;
        const altImageBitmap = files.altFile[0].buffer;
        const radius = Utils.convertToInt(input.radius);

        let result: ImageComparisonResult;
        try {
            result = await this.imageService.compareImages(mainImageBitmap, altImageBitmap, radius);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }

        return result;
    }

    private notValidGameImageInput(files: GameImageInput): boolean {
        return !files || !files.mainFile || !files.altFile;
    }

    private notValidRadius(radius: { radius: string }): boolean {
        return !radius || !radius.radius;
    }
}
