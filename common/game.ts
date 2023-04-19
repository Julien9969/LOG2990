export interface UnsavedGame {
    name: string;
    imageMain: number;
    imageAlt: number;
    scoreBoardSolo: [string, number][];
    scoreBoardMulti: [string, number][];
    isValid: boolean;
    isHard: boolean;
    differenceCount: number;
    radius?: number;
}

export interface Game extends UnsavedGame {
    id: string;
}
