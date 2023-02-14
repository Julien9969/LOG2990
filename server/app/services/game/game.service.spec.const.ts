/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Game } from '@common/game';
import { InputGame } from '@common/input-game';

export const stubInputGame: InputGame = {
    name: 'gamename',
    imageMain: 0,
    imageAlt: 0,
    radius: 0,
};
export const stubGame: Game = {
    id: 0,
    name: 'gamename',
    imageMain: 0,
    imageAlt: 0,
    radius: 0,
    differenceCount: 0,
    isHard: false,
    isValid: true,
    scoreBoardSolo: undefined,
    scoreBoardMulti: undefined,
    penalty: undefined,
    reward: undefined,
    time: undefined,
};
export const stubGameWithScore: Game = {
    id: 0,
    name: 'gamename',
    imageMain: 0,
    imageAlt: 0,
    radius: 0,
    differenceCount: 0,
    isHard: false,
    isValid: true,
    scoreBoardSolo: [
        ['Bowser', 150],
        ['Peach', 250],
        ['Mario', 780],
    ],
    scoreBoardMulti: undefined,
    penalty: undefined,
    reward: undefined,
    time: undefined,
};
export const gameListStub: Game[] = [
    {
        ...stubGame,
        id: 3,
    },
    {
        ...stubGame,
        id: 2,
    },
    {
        ...stubGame,
        id: 1,
    },
    {
        ...stubGame,
        id: 0,
    },
];

export const gameListStubWithout3: Game[] = [
    {
        ...stubGame,
        id: 2,
    },
    {
        ...stubGame,
        id: 1,
    },
    {
        ...stubGame,
        id: 0,
    },
];

export const gameListStubWithout3Nor0: Game[] = [
    {
        ...stubGame,
        id: 2,
    },
    {
        ...stubGame,
        id: 1,
    },
];
