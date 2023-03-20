export interface Message {
    socketId: string;
    isFromSystem: boolean;
    sessionID: number;
    author: string;
    time: number;
    message: string;
}
