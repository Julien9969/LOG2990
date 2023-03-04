export interface unsavedGame {
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

export interface Game extends unsavedGame {
    id: string;
}
