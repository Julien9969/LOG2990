import { GamesController } from '@app/controllers/games/games.controller';
import { GameService } from '@app/services/game/game.service';
import { ImageService } from '@app/services/images/image.service';
import { SessionService } from '@app/services/session/session.service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ImageController } from './controllers/images/images.controller';
import { SessionController } from './controllers/session/sessions.controller';
@Module({
    imports: [ConfigModule.forRoot({ isGlobal: true })],
    controllers: [GamesController, ImageController, SessionController],
    providers: [GameService, ImageService, SessionService, Logger],
})
export class AppModule {}
