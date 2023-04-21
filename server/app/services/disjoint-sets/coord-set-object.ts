export interface CoordSetObject {
    x: number;
    y: number;
    setId?: number;
}

export const DIRECT_NEIGHBORS_COORDINATES: CoordSetObject[] = [
    { x: -1, y: -1 },
    { x: 0, y: -1 },
    { x: +1, y: -1 },
    { x: -1, y: 0 },
    { x: +1, y: 0 },
    { x: -1, y: +1 },
    { x: 0, y: +1 },
    { x: +1, y: +1 },
];
