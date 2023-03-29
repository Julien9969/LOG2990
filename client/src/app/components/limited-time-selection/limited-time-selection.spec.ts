import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import { LimitedTimeSelectionComponent } from '@app/components/limited-time-selection/limited-time-selection.component';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { of } from 'rxjs';

class MockRouter {
    events = of(new NavigationEnd(0, 'http://localhost:4200/', 'http://localhost:4200/'));
    navigateByUrl(url: string) {
        return url;
    }
}

describe('LimitedTimeSelectionComponent', () => {
    let component: LimitedTimeSelectionComponent;
    let fixture: ComponentFixture<LimitedTimeSelectionComponent>;
    const routerSpy: MockRouter = new MockRouter();
    let socketClientSpy: jasmine.SpyObj<SocketClientService>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<LimitedTimeSelectionComponent>>;

    beforeEach(async () => {
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        dialogRefSpy = jasmine.createSpyObj('MatDialogRefMock', ['close']);
        socketClientSpy = jasmine.createSpyObj('SocketClientServiceMock', [
            'connect',
            'send',
            'on',
            'sendAndCallBack',
            'disconnect',
            'isSocketAlive',
        ]);

        await TestBed.configureTestingModule({
            declarations: [LimitedTimeSelectionComponent],
            imports: [MatDialogModule],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: Router, useValue: routerSpy },
                { provide: SocketClientService, useValue: socketClientSpy },
                { provide: MatDialog, useValue: dialogSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LimitedTimeSelectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should subscribe to router events', () => {
        expect(routerSpy.events).toBeTruthy();
    });

    it('ngOnInit should call socketService.connect', () => {
        expect(socketClientSpy.connect).toHaveBeenCalled();
    });

    it('OnInit should call socketService.send with a callback that set templateName to noGame if the parameter was false', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socketClientSpy.send.and.callFake((eventName, callback: any) => {
            callback(false);
        });
        component.getIfGameExist();

        expect(component.templateName).toBe('noGame');
    });

    it('openMatchMaking should call dialog.open', () => {
        component.openMatchMaking(true);
        expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
            closeOnNavigation: true,
            disableClose: true,
            autoFocus: false,
            data: Object({ isSolo: true, id: 'limited-time' }),
        });
    });
});
