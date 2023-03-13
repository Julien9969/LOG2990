import { Injectable } from '@angular/core';

enum SoundId {
    Success = 'success',
    Error = 'error',
    ManyErrors = 'manyErrors',
    Win = 'win',
}

@Injectable({
    providedIn: 'root',
})
export class AudioService {
    private audioPlayer = new Audio();

    async playAudio(soundId: string): Promise<void> {
        this.audioPlayer.pause();
        switch (soundId) {
            case SoundId.Success:
                this.audioPlayer.src = 'assets/sounds/Success sound.mp3';
                break;
            case SoundId.Error:
                this.audioPlayer.src = 'assets/sounds/Windows XP Error Sound.mp3';
                break;
            case SoundId.ManyErrors:
                this.audioPlayer.src = 'assets/sounds/Come on man Joe Biden.mp3';
                break;
            case SoundId.Win:
                this.audioPlayer.src = 'assets/sounds/win Sound.mp3';
                break;
            default:
                this.audioPlayer.src = '';
                break;
        }
        this.audioPlayer.load();
        this.audioPlayer.play();
    }
}
