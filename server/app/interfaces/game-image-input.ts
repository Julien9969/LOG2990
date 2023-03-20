// Cette interface est basée sur le format de fichiers donné par le décorateur @UploadedFiles de NestJS.
export interface GameImageInput {
    mainFile: Express.Multer.File[];
    altFile: Express.Multer.File[];
}
