/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, max-lines  */
import { ImageService } from '@app/services/images/image.service';
import { ImageComparisonResult } from '@common/image-comparison-result';
import { HttpException, HttpStatus, StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Promise } from 'mongoose';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { ImageController } from './images.controller';
import { exampleImage, exampleImageComparisonInput, exampleStringId, stubFile } from './images.controller.spec.const';
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

    it('addNewImage should call saveImage and return the id ', async () => {
        const spy = jest.spyOn(controller['imageService'], 'saveImage').mockImplementation(() => {
            return 12;
        });
        const returnedValue = controller.addNewImage(stubFile);
        expect(spy).toHaveBeenCalled();
        expect(returnedValue).toEqual(12);
    });
    it('deleteIage should call Service.deleteImage', () => {
        const spy = jest.spyOn(controller['imageService'], 'deleteImage').mockImplementation(() => {});
        controller.deleteImage(exampleStringId);
        expect(spy).toHaveBeenCalled();
    });
    it('deleteIage should handle an error', () => {
        const spy = jest.spyOn(controller['imageService'], 'deleteImage').mockImplementation(() => {
            throw new Error('exampleError');
        });
        expect(() => {
            controller.deleteImage(exampleStringId);
        }).toThrowError(new Error('exampleError'));
        expect(spy).toHaveBeenCalled();
    });

    it('compareImages should return a result when comparison is valid', async () => {
        jest.spyOn(controller['imageService'], 'compareImages').mockImplementation(() => {
            throw new Error('Image ID pas trouve.');
        });
        try {
            await controller.compareImages(exampleImageComparisonInput);
        } catch (e) {
            expect(e.getStatus()).toEqual(HttpStatus.BAD_REQUEST);
            expect(e.getResponse()).toEqual('Image ID pas trouve.');
        }
    });

    it('compareImages should return an error if image isnt found', async () => {
        const validResult: ImageComparisonResult = {
            isValid: true,
            isHard: false,
            differenceCount: 0,
        };
        jest.spyOn(controller['imageService'], 'compareImages').mockImplementation(() => {
            return new Promise((resolve) => {
                resolve(validResult);
            });
        });
        const result = await controller.compareImages(exampleImageComparisonInput);
        expect(result).toEqual(validResult);
    });
    it('compareImages should return an error if it lacks some info', async () => {
        const invalidInput = JSON.parse(JSON.stringify(exampleImageComparisonInput));
        invalidInput.imageMain = undefined;
        invalidInput.imageAlt = undefined;
        invalidInput.radius = undefined;
        try {
            await controller.compareImages(invalidInput);
        } catch (e) {
            expect(e.getStatus()).toEqual(HttpStatus.BAD_REQUEST);
            expect(e.getResponse()).toEqual('Il manque des parametres dans le body.');
        }
    });
    it('compareImages should throw the correct error if find IMages encounter a problem', async () => {
        jest.spyOn(controller['imageService'], 'compareImages').mockImplementation(() => {
            throw new Error('example Error');
        });
        let error: HttpException;

        try {
            await controller.compareImages(exampleImageComparisonInput);
        } catch (e) {
            error = e;
        }
        expect(error.getResponse()).toEqual('example Error');
    });
});
