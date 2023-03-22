import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { ChatService } from '@app/services/chat.service';

describe('SidebarComponent', () => {
    let component: SidebarComponent;
    let fixture: ComponentFixture<SidebarComponent>;
    let chatServiceSpy: jasmine.SpyObj<ChatService>;

    const exampleTime = 1234;
    const exampleMessage = 'blah';
    beforeEach(async () => {
        chatServiceSpy = jasmine.createSpyObj('ChatService', ['sendMessage', 'start', 'giveNameToServer', 'readSystemMessage']);

        await TestBed.configureTestingModule({
            providers: [{ provide: ChatService, useValue: chatServiceSpy }],
            declarations: [SidebarComponent],
            imports: [ReactiveFormsModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SidebarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('formattedTime should call Date.toUTCString', () => {
        const dateSpy = spyOn(Date.prototype, 'toUTCString');
        const result = component.formatedTime(exampleTime);
        expect(dateSpy).toHaveBeenCalled();
        expect(result).toEqual(new Date(exampleTime).toUTCString());
    });

    it('send should not call sendMessage if the messageText is empty', () => {
        component.messageForm.value.text = '';
        component.send();
        expect(chatServiceSpy.sendMessage).not.toHaveBeenCalled();
    });

    it('send should call sendMessage', () => {
        component.messageForm.value.text = exampleMessage;
        spyOn(Date.prototype, 'getTime').and.callFake(() => {
            return exampleTime;
        });
        component.send();

        expect(chatServiceSpy.sendMessage).toHaveBeenCalledWith({
            isFromSystem: false,
            socketId: 'unknown',
            sessionID: component.sessionID,
            author: component.playerName,
            time: 1234,
            message: 'blah',
        });
    });

    it('scrollTobottom should call scrollIntoView', () => {
        const scrollIntoViewSpy = spyOn(component.formElement.nativeElement, 'scrollIntoView');

        component.scrollToBottom();
        expect(scrollIntoViewSpy).toHaveBeenCalled();
    });
});
