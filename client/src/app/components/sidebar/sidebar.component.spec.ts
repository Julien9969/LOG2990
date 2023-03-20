import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
describe('SidebarComponent', () => {
    let component: SidebarComponent;
    let fixture: ComponentFixture<SidebarComponent>;
    const exampleTime = 1234;
    const exampleMessage = 'blah';
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [FormBuilder],
            declarations: [SidebarComponent],
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
        // staging
        const spy = spyOn(Date.prototype, 'toUTCString');
        // acting
        const result = component.formatedTime(exampleTime);
        // testing
        expect(spy).toHaveBeenCalled();
        expect(result).toEqual(new Date(exampleTime).toUTCString());
    });

    it('send should not call sendMessage if the messageText is empty', () => {
        // staging
        const spy = spyOn(component.chatService, 'sendMessage');
        component.messageForm.value.text = '';
        // acting
        component.send();
        // testing
        expect(spy).not.toHaveBeenCalled();
    });

    it('send should call sendMessage', () => {
        // staging
        const spy = spyOn(component.chatService, 'sendMessage');
        component.messageForm.value.text = exampleMessage;
        spyOn(Date.prototype, 'getTime').and.callFake(() => {
            return exampleTime;
        });
        // acting
        component.send();

        // testing
        expect(spy).toHaveBeenCalledWith({
            isFromSystem: false,
            socketId: 'unknown',
            sessionID: component.sessionID,
            author: component.playerName,
            time: 1234,
            message: 'blah',
        });
    });

    it('scrollTobottom should call scrollIntoView', () => {
        // staging
        const spy = spyOn(component.formElement.nativeElement, 'scrollIntoView');

        // acting
        component.scrollToBottom();
        // testing
        expect(spy).toHaveBeenCalled();
    });
});
