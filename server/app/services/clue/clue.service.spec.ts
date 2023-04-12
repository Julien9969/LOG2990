import { Session } from '@app/services/session/session';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { ClueService } from './clue.service';
import { MAX_NB_CLUES_REQUESTED, MIN_NB_CLUES_REQUESTED } from './clue.service.spec.consts';

describe('ClueService', () => {
    let clueService: ClueService;
    const stubSession: SinonStubbedInstance<Session> = createStubInstance<Session>(Session);

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ClueService],
        }).compile();

        clueService = module.get<ClueService>(ClueService);
        jest.spyOn(stubSession, 'handleClueRequest').mockImplementation(() => {
            return true;
        });
        jest.spyOn(stubSession, 'getNotFoundDifferences').mockImplementation(() => {
            return [
                [
                    { x: 0, y: 0 },
                    { x: 0, y: 1 },
                ],
                [
                    { x: 5, y: 0 },
                    { x: 5, y: 1 },
                ],
            ];
        });
    });

    describe('generateClue', () => {
        it('should always return a clue', () => {
            for (let i = MAX_NB_CLUES_REQUESTED; i >= MIN_NB_CLUES_REQUESTED; i--) {
                stubSession.nbCluesRequested = i;
                clueService.generateClue(stubSession);
                expect(stubSession).toBeTruthy();
            }
        });
    });
});
