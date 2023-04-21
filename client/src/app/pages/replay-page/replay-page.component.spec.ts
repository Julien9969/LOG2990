/*
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { GameActionLoggingService } from '@app/services/game-action-logging/game-action-logging.service';
import { ReplayPageComponent } from './replay-page.component';

fdescribe('ReplayPageComponent', () => {
    let component: ReplayPageComponent;
    let loggingService: GameActionLoggingService;
    let matDialog: MatDialog;
    // let fixture: ComponentFixture<ReplayPageComponent>;

    beforeEach(async () => {
        loggingService = new GameActionLoggingService();
        matDialog = new MatDialog();
        component = new ReplayPageComponent(loggingService, matDialog);
        await TestBed.configureTestingModule({
            declarations: [ReplayPageComponent],
        }).compileComponents();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should redirect to home if gameId is undefined', () => {
        spyOn(window.location, 'replace');

        component.ngOnInit();

        expect(window.location.replace).toHaveBeenCalledWith('/home');
    });
});
*/
