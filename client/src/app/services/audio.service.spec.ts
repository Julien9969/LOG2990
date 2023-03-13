import { TestBed } from '@angular/core/testing';
import { AudioService } from './audio.service';

describe('AudioService', () => {
    let service: AudioService;
    const audioSpy = jasmine.createSpyObj('Audio', ['play', 'load', 'pause']);

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: Audio, useValue: audioSpy }],
        });
        service = TestBed.inject(AudioService);
        service['audioPlayer'] = audioSpy;
    });

    it('playAudio should call audioPlayer.play, load, pause', () => {
        service.playAudio('test');
        expect(audioSpy.pause).toHaveBeenCalled();
        expect(audioSpy.load).toHaveBeenCalled();
        expect(audioSpy.play).toHaveBeenCalled();
    });

    it('playAudio with "success" should set right src', () => {
        service.playAudio('success');
        expect(audioSpy.src).toEqual('assets/sounds/Success sound.mp3');
    });

    it('playAudio with "error" should set right src', () => {
        service.playAudio('error');
        expect(audioSpy.src).toEqual('assets/sounds/Windows XP Error Sound.mp3');
    });

    it('playAudio with "manyErrors" should set right src', () => {
        service.playAudio('manyErrors');
        expect(audioSpy.src).toEqual('assets/sounds/Come on man Joe Biden.mp3');
    });

    it('playAudio with any string should set default src ("")', () => {
        service.playAudio('potatoes');
        expect(audioSpy.src).toEqual('');
    });

    it('playAudio with "win" should set right src', () => {
        service.playAudio('win');
        expect(audioSpy.src).toEqual('assets/sounds/win Sound.mp3');
    });
});
