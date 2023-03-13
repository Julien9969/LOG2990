// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// import { NavigationEnd, Router } from '@angular/router';
// import { CommunicationService } from '@app/services/communication.service';
// import { MatchMakingService } from '@app/services/match-making.service';
// import { of } from 'rxjs';
// import { MatchMakingDialogComponent } from './match-making-dialog.component';

// class MockRouter {
//     events = of(new NavigationEnd(0, 'http://localhost:4200/', 'http://localhost:4200/'));
//     navigateByUrl(url: string) {
//         return url;
//     }
// }

// describe('MatchMakingDialogComponent', () => {
//     let component: MatchMakingDialogComponent;
//     let fixture: ComponentFixture<MatchMakingDialogComponent>;
//     const routerSpy: MockRouter = new MockRouter();
//     let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;
//     let dialogRefSpy: jasmine.SpyObj<MatDialogRef<MatchMakingDialogComponent>>;
//     let matchMakingSpy: jasmine.SpyObj<MatchMakingService>;
//     const gameId = '10';

//     beforeEach(async () => {
//         // routerSpy = jasmine.createSpyObj('RouterMock', ['navigateByUrl', 'events']);
//         matchMakingSpy = jasmine.createSpyObj('MatchMakingServiceMock', [
//             'connect',
//             'leaveWaiting',
//             'someOneWaiting',
//             'startMatchmaking',
//             'joinRoom',
//             'iVeBeenAccepted',
//             'iVeBeenRejected',
//             'acceptOpponent',
//             'askForSessionId',
//             'rejectOpponent',
//             'sessionIdReceived',
//             'opponentJoined',
//             'opponentLeft',
//             'roomReachable',
//             'updateRoomView',
//         ]);

//         matchMakingSpy['socketService'] = jasmine.createSpyObj('SocketServiceMock', ['on']);

//         communicationServiceSpy = jasmine.createSpyObj('CommunicationServiceMock', ['customPost', 'sendCoordinates']);
//         dialogRefSpy = jasmine.createSpyObj('MatDialogRefMock', ['close']);
//         communicationServiceSpy.customPost.and.returnValue(of(0));

//         await TestBed.configureTestingModule({
//             declarations: [MatchMakingDialogComponent],
//             imports: [MatDialogModule, MatFormFieldModule, FormsModule, BrowserAnimationsModule, ReactiveFormsModule, MatInputModule],
//             providers: [
//                 { provide: MAT_DIALOG_DATA, useValue: { id: gameId, isSolo: true } },
//                 { provide: MatDialogRef, useValue: dialogRefSpy },
//                 { provide: Router, useValue: routerSpy },
//                 { provide: CommunicationService, useValue: communicationServiceSpy },
//                 { provide: MatchMakingService, useValue: matchMakingSpy },
//             ],
//         }).compileComponents();
//     });

//     beforeEach(() => {
//         fixture = TestBed.createComponent(MatchMakingDialogComponent);
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it('component should get the id passed in the data', () => {
//         // eslint-disable-next-line @typescript-eslint/no-magic-numbers
//         expect(component.gameInfo.id).toEqual('10');
//     });

//     it('ngOnInit should subscribe to router events', () => {
//         expect(routerSpy.events).toBeTruthy();
//     });

//     it('ngAfterViewInit should call matchMaking.connect and commonMatchMakingFeatures', () => {
//         spyOn(component, 'commonMatchMakingFeatures');
//         component.ngAfterViewInit();
//         expect(component.commonMatchMakingFeatures).toHaveBeenCalled();
//     });

//     describe('nameFormControl', () => {
//         it('should valid correct name', () => {
//             expect(component.nameFormControl.valid).toBeFalsy();
//             component.nameFormControl.setValue('test');
//             expect(component.nameFormControl.valid).toBeTruthy();
//         });

//         it('should not valid incorrect name', () => {
//             expect(component.nameFormControl.valid).toBeFalsy();
//             component.nameFormControl.setValue('test!');
//             expect(component.nameFormControl.valid).toBeFalsy();
//         });

//         it('should not valid name with length less than 3', () => {
//             expect(component.nameFormControl.valid).toBeFalsy();
//             component.nameFormControl.setValue('te');
//             expect(component.nameFormControl.valid).toBeFalsy();
//         });

//         it('nameFormControl should not valid name with length more than 15', () => {
//             expect(component.nameFormControl.valid).toBeFalsy();
//             component.nameFormControl.setValue('testtesttesttesttest');
//             expect(component.nameFormControl.valid).toBeFalsy();
//         });
//     });

//     it('joinGame should call createGameAndWait if matchMaking.someOneWaiting return false', async () => {
//         matchMakingSpy.someOneWaiting.and.returnValue(
//             new Promise<boolean>((resolve) => {
//                 resolve(false);
//             }),
//         );
//         spyOn(component, 'createGameAndWait');
//         await component.joinGame();
//         expect(component.createGameAndWait).toHaveBeenCalled();
//     });

//     it('joinGame should call joinGameIfSomeoneWaiting if matchMaking.someOneWaiting return true', async () => {
//         matchMakingSpy.someOneWaiting.and.returnValue(
//             new Promise<boolean>((resolve) => {
//                 resolve(true);
//             }),
//         );
//         spyOn(component, 'askToJoin');
//         await component.joinGame();
//         expect(component.askToJoin).toHaveBeenCalled();
//     });

//     it('createGameAndWait should call matchMaking.startMatchmaking and set template to waitingRoom', () => {
//         component.createGameAndWait();
//         expect(component.matchMaking.startMatchmaking).toHaveBeenCalled();
//         expect(component.dialogInfos.template).toEqual('waitingRoom');
//     });

//     it('askToJoin should call matchMaking.joinRoom and set template to waitingRoom', () => {
//         component.askToJoin();
//         expect(component.matchMaking.joinRoom).toHaveBeenCalled();
//         expect(component.dialogInfos.template).toEqual('waitingRoom');
//         expect(component.dialogInfos.message).toEqual("Attente d'acceptation par l'adversaire");
//     });

//     it('askToJoin should call iVeBeenAccepted and iVeBeenRejected with a callback', () => {
//         component.askToJoin();
//         expect(component.matchMaking.iVeBeenAccepted).toHaveBeenCalledWith(jasmine.any(Function));
//         expect(component.matchMaking.iVeBeenRejected).toHaveBeenCalledWith(jasmine.any(Function));
//     });

//     describe('acceptOpponent', () => {
//         it('should call matchMaking.acceptOpponent and set template to waitingRoom if matchMaking.acceptOpponent return false', async () => {
//             matchMakingSpy.acceptOpponent.and.returnValue(
//                 new Promise<boolean>((resolve) => {
//                     resolve(false);
//                 }),
//             );
//             await component.acceptOpponent();
//             expect(component.matchMaking.acceptOpponent).toHaveBeenCalled();
//             expect(component.dialogInfos.template).toEqual('waitingRoom');
//             expect(component.dialogInfos.message).toEqual("l'adversaire précendent a quitté la recherche");
//         });

//         it('should call matchMaking.acceptOpponent and set template to waitingRoom if matchMaking.acceptOpponent return true', async () => {
//             matchMakingSpy.acceptOpponent.and.returnValue(
//                 new Promise<boolean>((resolve) => {
//                     resolve(true);
//                 }),
//             );
//             await component.acceptOpponent();
//             expect(component.matchMaking.acceptOpponent).toHaveBeenCalled();
//             expect(component.matchMaking.askForSessionId).toHaveBeenCalled();
//         });
//     });

//     it('rejectOpponent should call matchMaking.rejectOpponent and set template to waitingRoom', () => {
//         component.rejectOpponent();
//         expect(component.matchMaking.rejectOpponent).toHaveBeenCalled();
//         expect(component.dialogInfos.template).toEqual('waitingRoom');
//     });

//     it('leaveWaiting should call matchMaking.leaveWaiting with the gameId', () => {
//         component.leaveWaiting();
//         expect(component.matchMaking.leaveWaiting).toHaveBeenCalledWith(gameId);
//     });

//     it('navigateToMultiGame should call router.navigateByUrl', () => {
//         const sessionId = 0;
//         spyOn(routerSpy, 'navigateByUrl');
//         component.navigateToMultiGame(sessionId);
//         expect(routerSpy.navigateByUrl).toHaveBeenCalled();
//     });

//     it('navigateToSoloGame should call router.navigateByUrl', () => {
//         spyOn(routerSpy, 'navigateByUrl');
//         component.navigateToSoloGame();
//         expect(routerSpy.navigateByUrl).toHaveBeenCalled();
//     });

//     describe('commonMatchMakingFeatures', () => {
//         it('test', () => {
//             const playerName = 'Player 1';
//             matchMakingSpy.iVeBeenRejected.calls.mostRecent().args[0](playerName);
//             expect(component.opponentName).toEqual(playerName);
//         });

//         it('should call matchMaking.sessionIdReceived with a callback that call navigateToMultiGame', () => {
//             const sessionId = 0;
//             spyOn(component, 'navigateToMultiGame');
//             component.commonMatchMakingFeatures();
//             expect(component.matchMaking.sessionIdReceived).toHaveBeenCalledWith(jasmine.any(Function));
//             matchMakingSpy.sessionIdReceived.calls.mostRecent().args[0](sessionId);
//             expect(component.navigateToMultiGame).toHaveBeenCalledWith(sessionId);
//         });

//         it('should call matchMaking.opponentJoined with a callback that set opponentName', () => {
//             const playerName = 'Player 1';
//             component.commonMatchMakingFeatures();
//             expect(component.matchMaking.opponentJoined).toHaveBeenCalledWith(jasmine.any(Function));
//             matchMakingSpy.opponentJoined.calls.mostRecent().args[0](playerName);
//             expect(component.opponentName).toEqual(playerName);
//             expect(component.dialogInfos.template).toEqual('acceptPairing');
//         });

//         it('should call matchMaking.opponentLeft with a callback that dialogInfo to waitingRoom', () => {
//             component.commonMatchMakingFeatures();
//             expect(component.matchMaking.opponentLeft).toHaveBeenCalledWith(jasmine.any(Function));
//             matchMakingSpy.opponentLeft.calls.mostRecent().args[0]();
//             expect(component.dialogInfos.template).toEqual('waitingRoom');
//             expect(component.dialogInfos.message).toEqual("l'adversaire précendent a quitté la recherche");
//         });

//         it('should call matchMaking.roomReachable with a callback that call joinGame if template is waitingRoom', () => {
//             spyOn(component, 'joinGame');
//             component.dialogInfos.template = 'waitingRoom';
//             component.commonMatchMakingFeatures();
//             expect(component.matchMaking.roomReachable).toHaveBeenCalledWith(jasmine.any(Function));
//             matchMakingSpy.roomReachable.calls.mostRecent().args[0]();
//             expect(component.joinGame).toHaveBeenCalled();
//         });

//         it('should call matchMaking.roomReachable with a callback that not call joinGame if template is not waitingRoom', () => {
//             spyOn(component, 'joinGame');
//             component.dialogInfos.template = 'notWaitingRoom';
//             component.commonMatchMakingFeatures();
//             expect(component.matchMaking.roomReachable).toHaveBeenCalledWith(jasmine.any(Function));
//             matchMakingSpy.roomReachable.calls.mostRecent().args[0]();
//             expect(component.joinGame).not.toHaveBeenCalled();
//         });

//         it('should call matchMaking.iVeBeenAccepted with a callback that set the opponentName', () => {
//             const playerName = 'Player 1';
//             component.commonMatchMakingFeatures();
//             expect(component.matchMaking.iVeBeenAccepted).toHaveBeenCalledWith(jasmine.any(Function));
//             matchMakingSpy.iVeBeenAccepted.calls.mostRecent().args[0](playerName);
//             expect(component.opponentName).toEqual(playerName);
//         });

//         it('should call matchMaking.iVeBeenRejected with a callback that set the opponentName and template to rejected', () => {
//             const playerName = 'Player 1';
//             component.commonMatchMakingFeatures();
//             expect(component.matchMaking.iVeBeenRejected).toHaveBeenCalledWith(jasmine.any(Function));
//             matchMakingSpy.iVeBeenRejected.calls.mostRecent().args[0](playerName);
//             expect(component.opponentName).toEqual(playerName);
//             expect(component.dialogInfos.template).toEqual('rejected');
//             expect(component.dialogInfos.message).toEqual('');
//         });
//     });
// });
