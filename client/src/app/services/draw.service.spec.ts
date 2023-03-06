/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
import { TestBed } from '@angular/core/testing';

// import { Coordinate } from '@common/coordinate';
import { DrawService } from './draw.service';

describe('DrawService', () => {
    let service: DrawService;
    // let startPosition: Coordinate;
    // let endPosition: Coordinate;

    // We have no dependencies to other classes or Angular Components
    // but we can still let Angular handle the objet creation
    beforeEach(() => TestBed.configureTestingModule({}));

    // This runs before each test so we put variables we reuse here
    beforeEach(() => {
        service = TestBed.inject(DrawService);
        // startPosition = { x: 0, y: 0 };
        // endPosition = { x: 3, y: 4 };
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
