export interface CurrentGameInfo {
    gameId: number;
    gameType: string;
    gameStartTime: number;
    mapId: number;
    gameLength: number;
    platformId: string;
    gameMode: string;
    bannedChampions: BannedChampion[];
    gameQueueConfigId: number;
    observers: Observer;
    participants: CurrentGameParticipant[];
}

export interface BannedChampion {
    pickturn: number;
    championId: number;
    teamId: number;
}

export interface Observer {
    encryptionKey: string;
}

export interface CurrentGameParticipant {
    championId: number;
    perks: Perks;
    profileIconId: number;
    bot: boolean;
    teamId: number;
    summonerName: string;
    summonerId: string;
    spell1Id: number;
    spell2Id: number;
    gameCustomizationObjects: GameCustomizationObject[];
}

export interface Perks {
    perkIds: number[];
    perkStyle: number;
    perkSubStyle: number;
}

export interface GameCustomizationObject {
    category: string;
    content: string;
}