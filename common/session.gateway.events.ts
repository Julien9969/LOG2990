export enum SessionEvents {
    GetClientId = 'getClientId',
    GetAllSessions = 'getAllSessions',
    GetSession = 'getSession',
    CloseSession = 'closeSession',
    StartClassicSession = 'startClassicSession',
    StartLimitedTimeSession = 'startLimitedTimeSession',
    SubmitCoordinatesSoloGame = 'submitCoordinatesSolo',
    SubmitCoordinatesMultiGame = 'submitCoordinatesMulti',
    PlayerLeft = 'playerLeft',
    LeaveRoom = 'leaveRoom',
    TimerUpdate = 'timerUpdate',
    DifferenceFound = 'differenceFound',
    OpponentLeftGame = 'opponentLeftGame',
    ProvideName = 'provideName',
    PlayerName = 'playerName',
    PlayerWon = 'playerWon',
    SessionId = 'sessionId',
    CheatGetAllDifferences = 'cheatGetAllDifferences',
    GiveName = 'giveName',
    GameDeleted = "gameDeleted",
    EndedGame = "endedGame",
    NewGame = "newGame",
    SubmitCoordinatesLimitedTime = "submitCoordinatesLimitedTime"
}
