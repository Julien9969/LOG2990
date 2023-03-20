/* eslint-disable @typescript-eslint/no-empty-function */
import { TestBed } from '@angular/core/testing';
import { AudioService } from './audio.service';

describe('AudioService', () => {
    let service: AudioService;
    let playSpy: jasmine.Spy;
    let srcSpy: jasmine.Spy;
    beforeEach(() => {
        playSpy = spyOn(Audio.prototype, 'play').and.callFake(() => {});
        srcSpy = spyOnProperty(Audio.prototype, 'src', 'set');
        TestBed.configureTestingModule({});
        service = TestBed.inject(AudioService);
    });

    it('playAudio with "success" should set right src', () => {
        service.playAudio('success');
        expect(playSpy).toHaveBeenCalled();
        expect(srcSpy).toHaveBeenCalledWith('assets/sounds/Success sound.mp3');
    });

    it('playAudio with "error" should set right src', () => {
        service.playAudio('error');
        expect(srcSpy).toHaveBeenCalledWith('assets/sounds/Windows XP Error Sound.mp3');
        expect(playSpy).toHaveBeenCalled();
    });

    it('playAudio with "manyErrors" should set right src', () => {
        service.playAudio('manyErrors');
        expect(srcSpy).toHaveBeenCalledWith('assets/sounds/Come on man Joe Biden.mp3');
        expect(playSpy).toHaveBeenCalled();
    });

    it('playAudio with any string should set default src ("")', () => {
        service.playAudio('potatoes');
        expect(srcSpy).toHaveBeenCalledWith('');
        expect(playSpy).toHaveBeenCalled();
    });

    it('playAudio with "win" should set right src', () => {
        service.playAudio('win');
        expect(srcSpy).toHaveBeenCalledWith('assets/sounds/win Sound.mp3');
        expect(playSpy).toHaveBeenCalled();
    });
});
