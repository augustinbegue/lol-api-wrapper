import type {
    CurrentGameInfo,
    LeagueEntryDTO,
    LeagueListDTO,
    LeagueDivision,
    LeagueQueue,
    LeagueTier,
    MatchDTO,
    MatchTimelineDTO,
    SummonerDTO
} from "../types";
import { RiotApiError } from "./RiotApiError";
import { RiotPlatform, RiotRegion } from ".";


export class RiotApiWrapper {
    protected static readonly hostname = "api.riotgames.com";
    private readonly apiKey: string;

    constructor(apiKey: string) {
        if (apiKey === undefined) {
            throw new Error(`[lol-api-wrapper] No apiKey was provided.`);
        } else {
            this.apiKey = apiKey;
        }
    }

    async ApiRequest(
        prefix: RiotPlatform | RiotRegion,
        path: string
    ): Promise<Response> {
        const res = await fetch(`https://${encodeURIComponent(prefix)}.${RiotApiWrapper.hostname}${path}`,
            {
                method: "GET",
                headers: {
                    "X-Riot-Token": this.apiKey,
                },
            }
        );

        if (!res.ok) {
            throw new RiotApiError(res.url, res.status, res.statusText);
        }

        return res;
    }

    /*
     * summoner-v4
    */
    async getSummonerByAccountId(
        platform: RiotPlatform,
        accountId: string
    ): Promise<SummonerDTO> {
        const response = await this.ApiRequest(
            platform,
            `/lol/summoner/v4/summoners/by-account/${accountId}`
        );

        return await response.json();
    }

    async getSummonerByName(platform: RiotPlatform, name: string): Promise<SummonerDTO> {
        name = encodeURI(name);
        const response = await this.ApiRequest(
            platform,
            `/lol/summoner/v4/summoners/by-name/${name}`
        );

        return await response.json();
    }

    async getSummonerByPuuid(platform: RiotPlatform, puuid: string): Promise<SummonerDTO> {
        const response = await this.ApiRequest(
            platform,
            `/lol/summoner/v4/summoners/by-puuid/${puuid}`
        );

        return await response.json();
    }

    async getSummonerBySummonerId(platform: RiotPlatform, summonerId: string): Promise<SummonerDTO> {
        const response = await this.ApiRequest(
            platform,
            `/lol/summoner/v4/summoners/${summonerId}`
        );

        return await response.json();
    }

    /*
    * league-v4
    */
    async getLeagueEntriesBySummonerId(
        platform: RiotPlatform,
        summonerId: string
    ): Promise<LeagueEntryDTO[]> {
        const response = await this.ApiRequest(
            platform,
            `/lol/league/v4/entries/by-summoner/${summonerId}`
        );

        return response.json();
    }

    async getLeagueEntries(
        platform: RiotPlatform,
        queue: LeagueQueue,
        tier: "IRON" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND",
        division: LeagueTier
    ): Promise<LeagueEntryDTO[]> {
        const response = await this.ApiRequest(
            platform,
            `/lol/league/v4/entries/${queue}/${tier}/${division}`
        );

        return response.json();
    }

    async getLeagueListEntries(
        platform: RiotPlatform,
        queue: LeagueQueue,
        tier: "MASTER" | "GRANDMASTER" | "CHALLENGER"
    ): Promise<LeagueListDTO> {
        let list = "";

        switch (tier) {
            case "MASTER":
                list = "masterleagues";
                break;
            case "GRANDMASTER":
                list = "grandmasterleagues";
                break;
            case "CHALLENGER":
                list = "challengerleagues";
                break;
        }

        const response = await this.ApiRequest(
            platform,
            `/lol/league/v4/${list}/by-queue/${queue}`
        );

        return response.json();
    }

    /*
    * spectator-v4
    */
    async getActiveGameBySummonerId(platform: RiotPlatform, summonerId: string): Promise<CurrentGameInfo> {
        const response = await this.ApiRequest(
            platform,
            `/lol/spectator/v4/active-games/by-summoner/${summonerId}`
        );

        return response.json();
    }

    /*
    * match-v5
    */
    async getMatchByMatchId(region: RiotRegion, matchId: string): Promise<MatchDTO> {
        const response = await this.ApiRequest(
            region,
            `/lol/match/v5/matches/${matchId}`
        );

        return response.json();
    }

    async getMatchTimelineByMatchId(region: RiotRegion, matchId: string): Promise<MatchTimelineDTO> {
        const response = await this.ApiRequest(
            region,
            `/lol/match/v5/matches/${matchId}/timeline`
        );

        return response.json();
    }

    async getMatchIdsByPuuid(region: RiotRegion, puuid: string): Promise<string[]> {
        const response = await this.ApiRequest(
            region,
            `/lol/match/v5/matches/by-puuid/${puuid}/ids`
        );

        return response.json();
    }
}
