import type {
    CurrentGameInfo,
    LeagueEntryDTO,
    LeagueListDTO,
    LeagueQueue,
    LeagueTier,
    MatchDTO,
    MatchTimelineDTO,
    SummonerDTO,
} from "../types";
import { RiotApiError } from "./RiotApiError";
import { RiotPlatform, RiotRegion } from ".";
import { RateLimitHandler } from "./RateLimitHandler";

interface ApiRequestInternal {
    prefix: RiotPlatform | RiotRegion;
    path: string;
    callback: (response: Response) => void;
}

export class RiotApiWrapper {
    protected static readonly hostname = "api.riotgames.com";

    private readonly apiKey: string;
    private rateLimitHandler: RateLimitHandler;

    constructor(
        apiKey: string,
        options?: { rateLimitHandler?: RateLimitHandler },
    ) {
        if (apiKey === undefined) {
            throw new Error("[lol-api-wrapper] No apiKey was provided.");
        } else {
            this.apiKey = apiKey;
        }

        if (options?.rateLimitHandler !== undefined) {
            this.rateLimitHandler = options.rateLimitHandler;
        }
    }

    requestQueue: ApiRequestInternal[] = [];

    private async processRequestQueue(): Promise<void> {
        if (this.requestQueue.length === 0) {
            return;
        }

        const request = this.requestQueue[0];

        if (this.rateLimitHandler !== undefined) {
            const rateLimitMethod =
                await this.rateLimitHandler.checkForRateLimit(
                    request.prefix,
                    request.path,
                );

            if (rateLimitMethod) {
                // Skip this request and try again later
                this.requestQueue.shift();
                this.requestQueue.push(request);

                if (this.requestQueue.length === 1) {
                    // If this is the only request in the queue, wait for the rate limit to reset
                    await this.rateLimitHandler.waitForRateLimitReset(
                        rateLimitMethod,
                    );
                } else {
                    // Otherwise, process the next request in the queue
                    this.processRequestQueue();
                    return;
                }
            }
        }

        const res = await fetch(
            `https://${encodeURIComponent(request.prefix)}.${
                RiotApiWrapper.hostname
            }${request.path}`,
            {
                method: "GET",
                headers: {
                    "X-Riot-Token": this.apiKey,
                },
            },
        );

        if (this.rateLimitHandler) {
            const rateLimited =
                await this.rateLimitHandler.handleRateLimitHeaders(
                    request.prefix,
                    request.path,
                    res.headers,
                );

            if (rateLimited) {
                // Skip this request and try again later
                this.requestQueue.shift();
                this.requestQueue.push(request);
                this.processRequestQueue();
                return;
            }
        }

        request.callback(res);

        this.requestQueue.shift();
        this.processRequestQueue();
    }

    async ApiRequest(
        prefix: RiotPlatform | RiotRegion,
        path: string,
    ): Promise<Response> {
        return new Promise(async (resolve, reject) => {
            const request: ApiRequestInternal = {
                prefix,
                path,
                callback: (response: Response) => {
                    if (response.status === 200) {
                        resolve(response);
                    } else {
                        reject(new RiotApiError(path, response));
                    }
                },
            };

            this.requestQueue.push(request);

            if (this.requestQueue.length === 1) {
                this.processRequestQueue();
            }
        });
    }

    /*
     * summoner-v4
     */
    async getSummonerByAccountId(
        platform: RiotPlatform,
        accountId: string,
    ): Promise<SummonerDTO> {
        const response = await this.ApiRequest(
            platform,
            `/lol/summoner/v4/summoners/by-account/${accountId}`,
        );

        return await response.json();
    }

    async getSummonerByName(
        platform: RiotPlatform,
        name: string,
    ): Promise<SummonerDTO> {
        name = encodeURI(name);
        const response = await this.ApiRequest(
            platform,
            `/lol/summoner/v4/summoners/by-name/${name}`,
        );

        return await response.json();
    }

    async getSummonerByPuuid(
        platform: RiotPlatform,
        puuid: string,
    ): Promise<SummonerDTO> {
        const response = await this.ApiRequest(
            platform,
            `/lol/summoner/v4/summoners/by-puuid/${puuid}`,
        );

        return await response.json();
    }

    async getSummonerBySummonerId(
        platform: RiotPlatform,
        summonerId: string,
    ): Promise<SummonerDTO> {
        const response = await this.ApiRequest(
            platform,
            `/lol/summoner/v4/summoners/${summonerId}`,
        );

        return await response.json();
    }

    /*
     * league-v4
     */
    async getLeagueEntriesBySummonerId(
        platform: RiotPlatform,
        summonerId: string,
    ): Promise<LeagueEntryDTO[]> {
        const response = await this.ApiRequest(
            platform,
            `/lol/league/v4/entries/by-summoner/${summonerId}`,
        );

        return response.json();
    }

    async getLeagueEntries(
        platform: RiotPlatform,
        queue: LeagueQueue,
        tier: "IRON" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND",
        division: LeagueTier,
    ): Promise<LeagueEntryDTO[]> {
        const response = await this.ApiRequest(
            platform,
            `/lol/league/v4/entries/${queue}/${tier}/${division}`,
        );

        return response.json();
    }

    async getLeagueListEntries(
        platform: RiotPlatform,
        queue: LeagueQueue,
        tier: "MASTER" | "GRANDMASTER" | "CHALLENGER",
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
            `/lol/league/v4/${list}/by-queue/${queue}`,
        );

        return response.json();
    }

    /*
     * spectator-v4
     */
    async getActiveGameBySummonerId(
        platform: RiotPlatform,
        summonerId: string,
    ): Promise<CurrentGameInfo> {
        const response = await this.ApiRequest(
            platform,
            `/lol/spectator/v4/active-games/by-summoner/${summonerId}`,
        );

        return response.json();
    }

    /*
     * match-v5
     */
    async getMatchByMatchId(
        region: RiotRegion,
        matchId: string,
    ): Promise<MatchDTO> {
        const response = await this.ApiRequest(
            region,
            `/lol/match/v5/matches/${matchId}`,
        );

        return response.json();
    }

    async getMatchTimelineByMatchId(
        region: RiotRegion,
        matchId: string,
    ): Promise<MatchTimelineDTO> {
        const response = await this.ApiRequest(
            region,
            `/lol/match/v5/matches/${matchId}/timeline`,
        );

        return response.json();
    }

    async getMatchIdsByPuuid(
        region: RiotRegion,
        puuid: string,
        options?: {
            startDate?: Date;
            endDate?: Date;
            queue?: number;
            type?: string;
            start?: number;
            count?: number;
        },
    ): Promise<string[]> {
        let query = "";

        if (options) {
            if (options.startDate !== undefined) {
                query += `&startTime=${options.startDate.getTime() / 1000}`;
            }

            if (options.endDate !== undefined) {
                query += `&endTime=${options.endDate.getTime() / 1000}`;
            }

            if (options.queue !== undefined) {
                query += `&queue=${options.queue}`;
            }

            if (options.type !== undefined) {
                query += `&type=${options.type}`;
            }

            if (options.start !== undefined) {
                query += `&start=${options.start}`;
            }

            if (options.count !== undefined) {
                query += `&count=${options.count}`;
            }

            if (query !== "") {
                query = "?" + query.substring(1);
            }
        }

        const response = await this.ApiRequest(
            region,
            `/lol/match/v5/matches/by-puuid/${puuid}/ids${query}`,
        );

        return response.json();
    }
}
