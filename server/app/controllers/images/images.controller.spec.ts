/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, max-lines  */
import { stubGameFileInput } from '@app/services/game/game.service.spec.const';
import { ImageService } from '@app/services/images/image.service';
import { HttpException, HttpStatus, StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { ImageController } from './images.controller';
import { exampleImage, exampleImageComparisonInput, exampleStringId, exampleValidOutput } from './images.controller.spec.const';
describe('ImageController tests', () => {
    let controller: ImageController;
    let imageService: SinonStubbedInstance<ImageService>;

    beforeEach(async () => {
        imageService = createStubInstance(ImageService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ImageController],
            providers: [
                {
                    provide: ImageService,
                    useValue: imageService,
                },
            ],
        }).compile();

        controller = module.get<ImageController>(ImageController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('getAll should call getAllImageIds', async () => {
        const spy = jest.spyOn(controller['imageService'], 'getAllImageIds').mockImplementation(() => {
            return [];
        });
        controller.getAll();
        expect(spy).toHaveBeenCalled();
    });

    it('serveImage should call getImage and return the correct image', async () => {
        const spy = jest.spyOn(controller['imageService'], 'getImage').mockImplementation(() => {
            return exampleImage;
        });
        const returnedValue = controller.serveImage(exampleStringId);
        expect(spy).toHaveBeenCalled();
        expect(JSON.stringify(returnedValue)).toEqual(JSON.stringify(new StreamableFile(exampleImage)));
        // le JSON.stringify() permet d'accéler drastiquement la comparaison (de 75 SECONDES a 0.3 secondes)
    });

    it('serveImage should return an error if getImage returns null', async () => {
        const spy = jest.spyOn(controller['imageService'], 'getImage').mockImplementation(() => {
            return null;
        });
        expect(() => {
            controller.serveImage(exampleStringId);
        }).toThrowError(new HttpException('Image 12 non existante', HttpStatus.NOT_FOUND));
        expect(spy).toHaveBeenCalled();
    });

    describe('compareImages', () => {
        it('compareImages should return a result when comparison is valid', async () => {
            jest.spyOn(controller['imageService'], 'compareImages').mockImplementation(async () => Promise.resolve(exampleValidOutput));
            const result = await controller.compareImages(stubGameFileInput, exampleImageComparisonInput);
            expect(result).toEqual(exampleValidOutput);
        });

        it('compareImages should return an error if it lacks radius', async () => {
            const invalidInput = JSON.parse(JSON.stringify(exampleImageComparisonInput));
            invalidInput.radius = undefined;
            try {
                await controller.compareImages(stubGameFileInput, invalidInput);
            } catch (e) {
                expect(e.getStatus()).toEqual(HttpStatus.BAD_REQUEST);
                expect(e.getResponse()).toEqual('Il manque des parametres dans le body.');
            }
        });
        it('compareImages should throw the correct error if find Images encounter a problem', async () => {
            jest.spyOn(controller['imageService'], 'compareImages').mockImplementation(() => {
                throw new Error('example Error');
            });
            let error: HttpException;

            try {
                await controller.compareImages(stubGameFileInput, exampleImageComparisonInput);
            } catch (e) {
                error = e;
            }
            expect(error.getResponse()).toEqual('example Error');
        });
    });
});
