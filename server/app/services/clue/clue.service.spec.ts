import { ClassicSession } from '@app/services/session/classic-session';
import { LimitedTimeSession } from '@app/services/session/time-limited-session';
import { Clue } from '@common/clue';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { ClueService } from './clue.service';
import { MAX_NB_CLUES_REQUESTED, MIN_NB_CLUES_REQUESTED } from './clue.service.spec.consts';

const stubCoordinates = [
    [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
    ],
    [
        { x: 5, y: 0 },
        { x: 5, y: 1 },
    ],
];

describe('ClueService', () => {
    let clueService: ClueService;
    let stubClassicSession: SinonStubbedInstance<ClassicSession>;
    let stubLimitedTimeSession: SinonStubbedInstance<LimitedTimeSession>;

    beforeEach(async () => {
        stubClassicSession = createStubInstance<ClassicSession>(ClassicSession);
        stubLimitedTimeSession = createStubInstance<LimitedTimeSession>(LimitedTimeSession);
        const module: TestingModule = await Test.createTestingModule({
            providers: [ClueService],
        }).compile();

        clueService = module.get<ClueService>(ClueService);

        jest.spyOn(stubClassicSession, 'handleClueRequest').mockReturnValue(true);
        jest.spyOn(stubLimitedTimeSession, 'handleClueRequest').mockReturnValue(true);

        jest.spyOn(stubClassicSession, 'getNotFoundDifferences').mockReturnValue(stubCoordinates);
        jest.spyOn(stubLimitedTimeSession, 'allGameDifferences', 'get').mockReturnValue(stubCoordinates);
    });

    describe('generateClue', () => {
        it('should always return clue for Classic Session', () => {
            for (let i = MAX_NB_CLUES_REQUESTED; i >= MIN_NB_CLUES_REQUESTED; i--) {
                stubClassicSession.nbCluesRequested = i;
                const result: Clue = clueService.generateClue(stubClassicSession);
                expect(result).toBeTruthy();
            }
        });

        it('should always return a clue for limitedTimeSession', () => {
            for (let i = MAX_NB_CLUES_REQUESTED; i >= MIN_NB_CLUES_REQUESTED; i--) {
                stubLimitedTimeSession.nbCluesRequested = i;
                const result: Clue = clueService.generateClue(stubLimitedTimeSession);
                expect(result).toBeTruthy();
            }
        });

        it("should return nothing if the session doesn't permit more clues", () => {
            jest.spyOn(stubClassicSession, 'handleClueRequest').mockReturnValue(false);
            const result = clueService.generateClue(stubClassicSession);
            expect(result).toBeFalsy();
        });
    });
});
