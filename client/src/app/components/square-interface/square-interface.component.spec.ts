/* eslint-disable prettier/prettier, no-unused-vars, @typescript-eslint/no-empty-function */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ErrorDuringLoadingComponent } from '@app/components/error-during-loading/error-during-loading.component';
import { MatchMakingDialogComponent } from '@app/components/match-making-dialog/match-making-dialog.component';
import { SquareInterfaceComponent } from '@app/components/square-interface/square-interface.component';
import { DELAY_BEFORE_BUTTONS_UPDATE, GAMES_PER_PAGE } from '@app/constants/utils-constants';
import { CommunicationService } from '@app/services/communication/communication.service';
import { GameService } from '@app/services/game/game.service';
import { Game } from '@common/game';

describe('SquareInterfaceComponent', () => {
    let component: SquareInterfaceComponent;
    let fixture: ComponentFixture<SquareInterfaceComponent>;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;
    const dialogSpy = jasmine.createSpyObj('DialogMock', ['open', 'closeAll']);
    let testGame: Game;

    beforeEach(async () => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationServiceMock', ['getRequest', 'getImageURL']);
        await TestBed.configureTestingModule({
            declarations: [SquareInterfaceComponent],
            providers: [
                { provide: GameService },
                { provide: MatDialog, useValue: dialogSpy },
                { provide: CommunicationService, useValue: communicationServiceSpy },
            ],
            imports: [MatCardModule, MatStepperModule, MatGridListModule, BrowserAnimationsModule, MatIconModule],
        }).compileComponents();
    });

    beforeEach(() => {
        testGame = {
            id: '1',
            name: '',
            imageMain: 0,
            imageAlt: 0,
            scoreBoardSolo: [['', 0]],
            scoreBoardMulti: [['', 0]],
            isValid: false,
            isHard: false,
            differenceCount: 0,
        };

        fixture = TestBed.createComponent(SquareInterfaceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngAfterViewInit should call reachableGames after 100ms', () => {
        spyOn(component, 'reachableGames').and.stub();
        jasmine.clock().install();
        component.ngAfterViewInit();
        jasmine.clock().tick(DELAY_BEFORE_BUTTONS_UPDATE);
        expect(component.reachableGames).toHaveBeenCalled();
        jasmine.clock().uninstall();
    });

    it('this.getImage should call the GameService function', () => {
        spyOn(component['gameService'], 'getMainImageURL').and.stub();
        component.getImage(testGame);
        expect(component['gameService'].getMainImageURL).toHaveBeenCalledWith(testGame);
    });

    it('get groups should call getGroupedData and initialize groupedGameList', () => {
        spyOn(component['gameService'], 'getGroupedData').and.stub();
        component.getGroups();
        expect(component['gameService'].getGroupedData).toHaveBeenCalled();
        expect(component.groupedGames).toBeDefined();
    });

    it('get groups should catch an error sent by getGroupedData', () => {
        const getGroupedData = () => {
            throw new Error();
        };
        spyOn(component['gameService'], 'getGroupedData').and.callFake(getGroupedData);
        component.getGroups();
        expect(component['dialog'].closeAll).toHaveBeenCalled();
        // eslint-disable-next-line no-undef
        expect(component['dialog'].open).toHaveBeenCalledWith(ErrorDuringLoadingComponent);
    });

    it('getImage() should catch an error sent by getMainImageURL()', () => {
        const getMainImageURLStub = () => {
            throw new Error();
        };
        spyOn(component, 'getImage').and.callThrough();
        spyOn(component['gameService'], 'getMainImageURL').and.callFake(getMainImageURLStub);
        const returned: string = component.getImage(testGame);
        expect(returned).toEqual('');
    });

    it('openFormDialog() should call the right function with the right parameters', () => {

        component.openFormDialog(testGame, true);
        expect(component['dialog'].closeAll).toHaveBeenCalled();
        expect(component['dialog'].open).toHaveBeenCalledWith(MatchMakingDialogComponent, {
            closeOnNavigation: true,
            disableClose: true,
            autoFocus: false,
            data: { id: testGame.id, isSolo: true },
        });
    });

    it('baseMatchMakingFeatures should call matchMaking.updateRoomView with a callback that call reachableGames', () => {
        const updateRoomSpy = spyOn(component['matchMaking'], 'updateRoomView');
        spyOn(component, 'reachableGames').and.stub();
        component.baseMatchMakingFeatures();
        updateRoomSpy.calls.mostRecent().args[0]();
        expect(component['matchMaking'].updateRoomView).toHaveBeenCalled();
        expect(component.reachableGames).toHaveBeenCalled();
    });

    it('reachableGames should call matchMaking.roomCreatedForThisGame and update someoneWaiting List', () => {
        for (let i = 0; i < GAMES_PER_PAGE; i++) {
            component.groupedGames[0].push(testGame);
        }
        
        spyOn(component['matchMaking'], 'roomCreatedForThisGame').and.returnValue(Promise.resolve(true));
        component.reachableGames();
        expect(component['matchMaking'].roomCreatedForThisGame).toHaveBeenCalled();
        expect(component.someoneWaiting).toBeTruthy();
    });

    it('deleteGame calls game service delete and reloads page', async () => {
        const deleteSpy = spyOn(component['gameService'], 'deleteGame').and.callFake(async () => {});
        // eslint-disable-next-line -- Le any sert à mock une fonction privée
        const reloadSpy = spyOn(component, 'reloadWindow' as any).and.callFake(() => {});
        await component.deleteGame('');

        expect(deleteSpy).toHaveBeenCalled();
        expect(reloadSpy).toHaveBeenCalled();
    });
});
