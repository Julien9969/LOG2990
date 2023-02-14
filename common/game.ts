export interface Game {
    id: number;
    name: string;
    imageMain: number;
    imageAlt: number;
    scoreBoardSolo: [string, number][];
    scoreBoardMulti: [string, number][];
    isValid: boolean;
    isHard: boolean;
    differenceCount: number;
    radius?: number;
    time: number;
    penalty: number;
    reward: number;
}
