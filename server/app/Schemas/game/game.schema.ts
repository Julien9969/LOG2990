import { Game, UnsavedGame } from '@common/game';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GameDocument = Game & Document;

// j'ai besoin d'utiliser l'attribut _id de mongoose
// pour le transformer en id (d'où le eslint-disable)
const transform = (doc, ret) => {
    // eslint-disable-next-line no-underscore-dangle
    ret.id = ret._id.toString();
    // eslint-disable-next-line no-underscore-dangle
    delete ret._id;
};

@Schema({
    toJSON: { transform },
    toObject: { transform },
})
export class GameClass extends Document implements UnsavedGame {
    @Prop({ required: true })
    name: string;
    @Prop({ required: true })
    imageMain: number;
    @Prop({ required: true })
    imageAlt: number;
    @Prop({ required: true })
    scoreBoardSolo: [string, number][];
    @Prop({ required: true })
    scoreBoardMulti: [string, number][];
    @Prop({ required: true })
    isValid: boolean;
    @Prop({ required: true })
    isHard: boolean;
    @Prop({ required: true })
    differenceCount: number;
    @Prop({ required: true })
    radius?: number;
}

export const gameSchema = SchemaFactory.createForClass(GameClass);
