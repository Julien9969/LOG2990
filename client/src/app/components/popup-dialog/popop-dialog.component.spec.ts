// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
// import { PopupDialogComponent } from './popup-dialog.component';

// describe('PopupDialogComponent', () => {
//     let component: PopupDialogComponent;
//     let fixture: ComponentFixture<PopupDialogComponent>;

//     beforeEach(async () => {
//         await TestBed.configureTestingModule({
//             declarations: [PopupDialogComponent],
//             imports: [MatDialogModule],
//             providers: [{ provide: MAT_DIALOG_DATA, useValue: {} }],
//         }).compileComponents();
//     });

//     beforeEach(() => {
//         fixture = TestBed.createComponent(PopupDialogComponent);
//         component = fixture.componentInstance;
//         component.audioPlayer = jasmine.createSpyObj('AudioPlayerMock', ['play', 'pause', 'load']);
//         fixture.detectChanges();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it('onInit should call playWinSound if templateName is endGame', () => {
//         spyOn(component, 'playWinSound');
//         component.templateName = 'endGame';
//         component.ngOnInit();
//         expect(component.playWinSound).toHaveBeenCalled();
//     });

//     it('playWinSound should use right src, call load and call play with audioPlayer', () => {
//         component.playWinSound();
//         expect(component.audioPlayer.src).toEqual('assets/sounds/win Sound.mp3');
//         expect(component.audioPlayer.load).toHaveBeenCalled();
//         expect(component.audioPlayer.play).toHaveBeenCalled();
//     });

//     it('getClueNumber should return 10', () => {
//         // eslint-disable-next-line @typescript-eslint/no-magic-numbers
//         expect(component.getClueNumber()).toEqual(10);
//     });
// });
