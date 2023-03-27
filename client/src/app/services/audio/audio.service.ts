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
    async playAudio(soundId: string): Promise<void> {
        const audioPlayer = new Audio();
        audioPlayer.volume = 0.5;
        switch (soundId) {
            case SoundId.Success:
                audioPlayer.src = 'assets/sounds/Success sound.mp3';
                break;
            case SoundId.Error:
                audioPlayer.src = 'assets/sounds/Windows XP Error Sound.mp3';
                break;
            case SoundId.ManyErrors:
                audioPlayer.src = 'assets/sounds/Come on man Joe Biden.mp3';
                break;
            case SoundId.Win:
                audioPlayer.src = 'assets/sounds/win Sound.mp3';
                break;
            default:
                audioPlayer.src = '';
                break;
        }
        await audioPlayer.play();
    }
}
