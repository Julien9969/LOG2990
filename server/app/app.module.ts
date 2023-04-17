import { GamesController } from '@app/controllers/games/games.controller';
import { ImageController } from '@app/controllers/images/images.controller';
import { gameSchema } from '@app/Schemas/game/game.schema';
import { GameService } from '@app/services/game/game.service';
import { ImageService } from '@app/services/images/image.service';
import { SessionService } from '@app/services/session/session.service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { ChatGateway } from '@app/gateway/chat/chat.gateway';
import { MatchmakingGateway } from '@app/gateway/match-making/match-making.gateway';
import { SessionGateway } from '@app/gateway/session/session.gateway';
import { historySchema } from '@app/Schemas/history/history.schema';
import { HistoryController } from './controllers/history/history.controller';
import { ClueService } from './services/clue/clue.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forFeature([{ name: 'Game', schema: gameSchema }]),
        MongooseModule.forFeature([{ name: 'GameHistory', schema: historySchema }]),
        MongooseModule.forRoot(process.env.DATABASE_CONNECTION_STRING),
    ],
    controllers: [GamesController, ImageController, HistoryController],
    providers: [GameService, ImageService, SessionService, Logger, MatchmakingGateway, SessionGateway, ChatGateway, ClueService],
})
export class AppModule {}
