/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ErrorDuringLoadingComponent } from '@app/components/error-during-loading/error-during-loading.component';
import { NameFormDialogComponent } from '@app/components/name-form-dialog/name-form-dialog.component';
import { SquareInterfaceComponent } from '@app/components/square-interface/square-interface.component';
import { CommunicationService } from '@app/services/communication.service';
import { GameService } from '@app/services/game.service';
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
            imports: [MatCardModule, MatStepperModule, MatGridListModule, BrowserAnimationsModule, MatIconModule, ],
        }).compileComponents();
    });

    beforeEach(() => {
        testGame = {
            id: 1,
            name: '',
            imageMain: 0,
            imageAlt: 0,
            scoreBoardSolo: [['', 0]],
            scoreBoardMulti: [['', 0]],
            isValid: false,
            isHard: false,
            differenceCount: 0,
            time: 0,
            penalty: 0,
            reward: 0,
        };

        fixture = TestBed.createComponent(SquareInterfaceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
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
        spyOn(component, 'openFormDialog').and.callThrough();

        component.openFormDialog(testGame);
        expect(component['dialog'].closeAll).toHaveBeenCalled();
        expect(component['dialog'].open).toHaveBeenCalledWith(NameFormDialogComponent, {
            closeOnNavigation: true,
            autoFocus: false,
            data: testGame.id,
        });
    });
});
