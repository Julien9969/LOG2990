import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavigationEnd, Router } from '@angular/router';
import { CommunicationService } from '@app/services/communication.service';
import { of } from 'rxjs';
import { MatchMakingDialogComponent } from './match-making-dialog.component';

class MockRouter {
    events = of(new NavigationEnd(0, 'http://localhost:4200/', 'http://localhost:4200/'));
    navigateByUrl(url: string) {
        return url;
    }
}

describe('NameFormDialogComponent', () => {
    let component: MatchMakingDialogComponent;
    let fixture: ComponentFixture<MatchMakingDialogComponent>;
    const routerSpy: MockRouter = new MockRouter();
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<MatchMakingDialogComponent>>;

    beforeEach(async () => {
        // routerSpy = jasmine.createSpyObj('RouterMock', ['navigateByUrl', 'events']);

        communicationServiceSpy = jasmine.createSpyObj('CommunicationServiceMock', ['customPost', 'sendCoordinates']);
        dialogRefSpy = jasmine.createSpyObj('MatDialogRefMock', ['close']);
        communicationServiceSpy.customPost.and.returnValue(of(0));

        await TestBed.configureTestingModule({
            declarations: [MatchMakingDialogComponent],
            imports: [MatDialogModule, MatFormFieldModule, FormsModule, BrowserAnimationsModule, ReactiveFormsModule, MatInputModule],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: { id: 10, isSolo: true } },
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: Router, useValue: routerSpy },
                { provide: CommunicationService, useValue: communicationServiceSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MatchMakingDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('component should get the id passed in the data', () => {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(component.gameInfo.id).toEqual(10);
    });

    it('nameFormControl should valid correct name', () => {
        expect(component.nameFormControl.valid).toBeFalsy();
        component.nameFormControl.setValue('test');
        expect(component.nameFormControl.valid).toBeTruthy();
    });

    it('nameFormControl should not valid incorrect name', () => {
        expect(component.nameFormControl.valid).toBeFalsy();
        component.nameFormControl.setValue('test!');
        expect(component.nameFormControl.valid).toBeFalsy();
    });

    it('nameFormControl should not valid name with length less than 3', () => {
        expect(component.nameFormControl.valid).toBeFalsy();
        component.nameFormControl.setValue('te');
        expect(component.nameFormControl.valid).toBeFalsy();
    });

    it('nameFormControl should not valid name with length more than 15', () => {
        expect(component.nameFormControl.valid).toBeFalsy();
        component.nameFormControl.setValue('testtesttesttesttest');
        expect(component.nameFormControl.valid).toBeFalsy();
    });

    it('navigateToSoloGame should call router.navigateByUrl', () => {
        spyOn(routerSpy, 'navigateByUrl');
        component.navigateToSoloGame();
        expect(routerSpy.navigateByUrl).toHaveBeenCalled();
    });
});
