import { Document } from 'mongoose';
import { GameHistory } from '@common/game-history';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type HistoryDocument = GameHistory & Document;

@Schema()
export class HistoryClass extends Document implements GameHistory {
    @Prop({ required: true })
    gameId: string;
    @Prop({ required: true })
    startDateTime: string;
    @Prop({ required: true })
    duration: string;
    @Prop({ required: true })
    gameMode: string;
    @Prop({ required: true })
    playerOne: string;
    @Prop({ required: false })
    playerTwo: string;
}
export const historySchema = SchemaFactory.createForClass(HistoryClass);
