import { LeagueItemDTO } from ".";

export interface LeagueListDTO {
    leagueId: string;
    tier: string;
    name: string;
    queue: string;
    entries: LeagueItemDTO[];
}
