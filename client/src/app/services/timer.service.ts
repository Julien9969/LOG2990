import { TIME_CONST } from '@app/constants/utils-constants';

export class Timer {
    intervalId: number;
    counter: number;
    errorGuess: boolean = false;
    pixelBlinkIntervalId: number[];

    get formatTime(): string {
        return this.timeFormat(this.counter);
    }

    errorTimer() {
        this.errorGuess = true;
        window.setTimeout(() => {
            this.errorGuess = false;
        }, TIME_CONST.secInMs);
    }

    startGameTimer(seconds: number) {
        this.counter = seconds;

        this.intervalId = window.setInterval(() => {
            this.counter++;
        }, TIME_CONST.secInMs);
    }

    stopGameTimer() {
        window.clearInterval(this.intervalId);
    }

    /**
     * format the time in seconds to a string of the format 'mm:ss'
     *
     * @param seconds seconds to format
     * @returns string of the format 'mm:ss'
     */
    private timeFormat(seconds: number): string {
        const minutes = Math.floor(seconds / TIME_CONST.minInSec);
        const secondsLeft = seconds - TIME_CONST.minInSec * minutes;
        return minutes + ':' + secondsLeft.toString().padStart(2, '0');
    }
}
