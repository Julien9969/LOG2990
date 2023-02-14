/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Game } from '@common/game';
export const exampleScoreBoard: [string, number][] = [
    ['Bowser', 150],
    ['Peach', 250],
    ['Mario', 780],
];

export const exampleGame: Game = {
    id: 8861,
    name: 'Ingenieur logiciel au travail',
    imageMain: 9205,
    imageAlt: 6752,
    scoreBoardSolo: [
        ['Bowser', 150],
        ['Peach', 250],
        ['Mario', 780],
    ],
    scoreBoardMulti: [
        ['Bowser', 150],
        ['Peach', 250],
        ['Mario', 780],
    ],
    isValid: true,
    isHard: true,
    differenceCount: 7,
    radius: 3,
    penalty: 0,
    reward: 0,
    time: 0,
};

export const exampleInputGame = {
    name: 'Ingenieur logiciel au travail',
    imageMain: 9205,
    imageAlt: 6752,
    radius: 3,
};
