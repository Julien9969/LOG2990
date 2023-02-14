// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// import { Router } from '@angular/router';
// import { CommunicationService } from '@app/services/communication.service';
// import { of } from 'rxjs';
// import { NameFormDialogComponent } from './name-form-dialog.component';

// describe('NameFormDialogComponent', () => {
//     let component: NameFormDialogComponent;
//     let fixture: ComponentFixture<NameFormDialogComponent>;
//     let routerSpy: jasmine.SpyObj<Router>;
//     let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;

//     beforeEach(async () => {
//         routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
//         communicationServiceSpy = jasmine.createSpyObj('CommunicationServiceMock', ['customPost', 'sendCoordinates']);

//         communicationServiceSpy.customPost.and.returnValue(of(0));

//         await TestBed.configureTestingModule({
//             declarations: [NameFormDialogComponent],
//             imports: [MatDialogModule, MatFormFieldModule, FormsModule, BrowserAnimationsModule, ReactiveFormsModule, MatInputModule],
//             providers: [
//                 { provide: MAT_DIALOG_DATA, useValue: {} },
//                 { provide: Router, useValue: routerSpy },
//                 { provide: CommunicationService, useValue: communicationServiceSpy },
//             ],
//         }).compileComponents();
//     });

//     beforeEach(() => {
//         fixture = TestBed.createComponent(NameFormDialogComponent);
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it('navigateToGame should call router.navigateByUrl', () => {
//         component.navigateToGame();
//         expect(routerSpy.navigateByUrl).toHaveBeenCalled();
//     });
// });
