import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ChatService } from '@app/services/chat.service';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements AfterViewInit {
    @Input()
    playerName: string;
    @Input()
    sessionID: number;
    @Input()
    isSolo: boolean;
    @ViewChild('chatContainer') chatContainer: ElementRef<HTMLDivElement>;
    @ViewChild('formGroup') formElement: ElementRef<HTMLFormElement>;

    messageForm = this.formBuilder.group({
        text: '',
    });

    constructor(private formBuilder: FormBuilder, public chatService: ChatService) {
        this.chatService.formElement = this.formElement;
        this.chatService.start();
    }

    ngAfterViewInit() {
        this.chatService.giveNameToServer(this.playerName);
    }
    formatedTime(time: number): string {
        return new Date(time).toUTCString();
    }

    send() {
        const messageText: string = this.messageForm.value.text ?? '';
        const currentTime: number = new Date().getTime();
        if (messageText !== '') {
            this.chatService.sendMessage({
                socketId: 'unknown',
                isFromSystem: false,
                sessionID: this.sessionID,
                author: this.playerName,
                time: currentTime,
                message: messageText,
            });
        }
        this.messageForm.reset();
    }

    scrollToBottom() {
        this.formElement.nativeElement.scrollIntoView();
    }
}
