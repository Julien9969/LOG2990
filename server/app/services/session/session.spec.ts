/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, max-lines, no-restricted-imports, max-len */

import { Player } from '@common/player';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { DifferenceValidationService } from '../difference-validation/difference-validation.service';
import { Session } from './session';

describe('Session tests', () => {
    let session: Session;
    let differenceValidationService: SinonStubbedInstance<DifferenceValidationService>;

    beforeAll(async () => {
        differenceValidationService = createStubInstance<DifferenceValidationService>(DifferenceValidationService);
        differenceValidationService.differenceCoordLists = [[{ x: 0, y: 0 }]];

        const moduleRef: TestingModule = await Test.createTestingModule({
            providers: [
                Session,
                {
                    provide: DifferenceValidationService,
                    useValue: differenceValidationService,
                },
            ],
        }).compile();

        session = moduleRef.get<Session>(Session);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    describe('isSolo', () => {
        it('returns true when one player', () => {
            const playerStub: Player = { name: 'name', socketId: 'socketId', differencesFound: [] };
            session.players = [playerStub];
            expect(session.isSolo).toEqual(true);
        });
    });

    describe('formatedTime', () => {
        it('returns the right time', () => {
            session.time = 1234;
            expect(session.formatedTime).toEqual('20:34');
        });
    });

    describe('stopTime', () => {
        it('should call clearInterval', () => {
            session.timerId = setInterval(() => {
                return false;
            }, 10);
            const oldTimerId = session.timerId;
            session.stopTimer();
            expect(session.timerId).toEqual(oldTimerId);
        });
    });
});
