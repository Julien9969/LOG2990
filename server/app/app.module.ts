import { GamesController } from '@app/controllers/games/games.controller';
import { ImageController } from '@app/controllers/images/images.controller';
import { SessionController } from '@app/controllers/session/sessions.controller';
import { gameSchema } from '@app/Schemas/game/game.schema';
import { GameService } from '@app/services/game/game.service';
import { ImageService } from '@app/services/images/image.service';
import { SessionService } from '@app/services/session/session.service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { MainGateway } from '@app/gateway/main.gateway';
import { MatchmakingGateway } from '@app/gateway/match-making/match-making.gateway';
import { SessionGateway } from '@app/gateway/session/session.gateway';
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forFeature([{ name: 'Game', schema: gameSchema }]),
        MongooseModule.forRoot(process.env.DATABASE_CONNECTION_STRING),
    ],
    controllers: [GamesController, ImageController, SessionController],
    providers: [GameService, ImageService, SessionService, Logger, MatchmakingGateway, MainGateway, SessionGateway],
})
export class AppModule {}
