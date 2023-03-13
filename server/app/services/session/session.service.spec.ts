/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, max-lines, no-restricted-imports, max-len */
import { SessionService } from './session.service';
let sessionService: SessionService;
// let session: Session;

describe('Session tests', () => {
    beforeAll(async () => {
        sessionService = new SessionService();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('service should be defined', async () => {
        expect(sessionService).toBeDefined();
    });

    //     describe('tryGuess function', () => {
    //         it('tryguess should throw error if validateGuess returns false', () => {
    //             jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
    //                 return false;
    //             });
    //             let error: Error;

    //             try {
    //                 session.tryGuess({ x: 12, y: 13 });
    //             } catch (e) {
    //                 error = e;
    //             }
    //             expect(error).toEqual(new Error('Mauvais format de guess.'));
    //         });

    //         it('tryguess should throw error if differences cant be loaded', () => {
    //             jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
    //                 return true;
    //             });
    //             jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
    //                 throw new Error();
    //             });

    //             expect(() => {
    //                 session.tryGuess({ x: 12, y: 13 });
    //             }).toThrow();
    //         });

    //         it('tryguess should return a guessResult with correct as true if it is not in the list of differecnes found', () => {
    //             jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
    //                 return true;
    //             });
    //             jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
    //                 return null;
    //             });
    //             jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
    //                 return 5;
    //             });
    //             jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockImplementation(() => {
    //                 return [{ x: 11, y: 10 }];
    //             });
    //             session.differencesFound = [];

    //             const result = session.tryGuess({ x: 11, y: 10 });
    //             expect(result.alreadyFound).toEqual(false);
    //             expect(result.correct).toEqual(true);
    //         });

    //         it('tryguess detects when difference already found', () => {
    //             jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
    //                 return true;
    //             });
    //             jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
    //                 return null;
    //             });
    //             jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
    //                 return 5;
    //             });
    //             jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockImplementation(() => {
    //                 return [{ x: 11, y: 10 }];
    //             });
    //             session.differencesFound = [5];

    //             const result = session.tryGuess({ x: 11, y: 10 });
    //             expect(result.alreadyFound).toEqual(true);
    //             expect(result.correct).toEqual(true);
    //         });

    //         it('tryguess returns incorrect result when no difference', () => {
    //             jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
    //                 return true;
    //             });
    //             jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
    //                 return null;
    //             });
    //             jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
    //                 return undefined;
    //             });
    //             jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockImplementation(() => {
    //                 return [{ x: 11, y: 10 }];
    //             });
    //             session.differencesFound = [5];

    //             const result = session.tryGuess({ x: 11, y: 10 });
    //             expect(result.alreadyFound).toEqual(false);
    //             expect(result.correct).toEqual(false);
    //         });
    //     });
    // });

    // describe('Session Service tests', () => {
    //     beforeAll(async () => {
    //         sessionService = new SessionService();
    //     });

    //     afterEach(() => {
    //         jest.restoreAllMocks();
    //         jest.clearAllMocks();
    //     });
    //     it('create should return a number and call addToList', () => {
    //         const spy = jest.spyOn(sessionService, 'addToList').mockImplementation((newSession) => {
    //             newSession.id = 1;
    //         });
    //         const result = sessionService.createNewSession('12');
    //         expect(result).toEqual(1);
    //         expect(spy).toHaveBeenCalled();
    //     });
    //     it('addToList should push a new session to the list of activesessions', () => {
    //         const spy = jest.spyOn(sessionService['activeSessions'], 'push').mockImplementation(() => {
    //             return null;
    //         });
    //         const exampleSession = new Session();
    //         sessionService.addToList(exampleSession);
    //         expect(spy).toHaveBeenCalledWith(exampleSession);
    //     });
    //     it('getAllShould return a list of Sessions', () => {
    //         expect(Array.isArray(sessionService.getAll())).toEqual(true);
    //     });
    //     it('delete should throw an error if it is invalid', () => {
    //         jest.spyOn(sessionService['activeSessions'], 'indexOf').mockImplementation(() => {
    //             return null;
    //         });
    //         jest.spyOn(sessionService['activeSessions'], 'splice').mockImplementation(() => {
    //             return null;
    //         });
    //         jest.spyOn(sessionService['activeSessions'], 'indexOf').mockImplementation(() => {
    //             return null;
    //         });
    //         let error: Error;

    //         try {
    //             sessionService.delete(12);
    //         } catch (e) {
    //             error = e;
    //         }
    //         expect(error).toBeDefined();
    //         expect(error).toEqual(new Error('Aucune session trouvee avec ce ID.'));
    //     });
    //     it('delete should remove the correct session', () => {
    //         jest.spyOn(sessionService['activeSessions'], 'indexOf').mockImplementation(() => {
    //             return 12;
    //         });
    //         const spy = jest.spyOn(sessionService['activeSessions'], 'splice').mockImplementation(() => {
    //             return null;
    //         });
    //         let error: Error;

    //         try {
    //             sessionService.delete(13);
    //         } catch (e) {
    //             error = e;
    //         }
    //         expect(error).not.toBeDefined();
    //         expect(spy).toHaveBeenCalledWith(12, 1);
    //     });
    //     it('findById should return the Session with the correct id', () => {
    //         const testSession = new Session();
    //         testSession.id = 12;
    //         sessionService.activeSessions = [testSession];
    //         const result = sessionService.findById(12);
    //         expect(result).toBeDefined();
    //         expect(result.id).toEqual(12);
    //     });
});
