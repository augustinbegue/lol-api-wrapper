import axios, {
    AxiosError,
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
} from "axios";
import * as dotenv from "dotenv";
import type {
    CurrentGameInfo,
    LeagueEntryDTO,
    MatchDTO,
    MatchTimelineDTO,
    SummonerDTO,
} from "../types";

dotenv.config();

class DDragonWrapper {
    private dataendpoint: string;
    private dataconfig: AxiosRequestConfig;
    private datareq: AxiosInstance;

    // Cached DDragon data
    protected champions: any;

    protected static async getLatestVersion(): Promise<string> {
        const response = await axios.get(
            "https://ddragon.leagueoflegends.com/api/versions.json",
        );
        return response.data[0];
    }

    private async RIOTDataRequest(
        path: string,
    ): Promise<AxiosResponse | undefined> {
        try {
            const response = await this.datareq.get(path);
            return response;
        } catch (error) {
            const err = error as AxiosError;
            console.error(`Error on ${path}:`, err.message);
        }
        return undefined;
    }

    protected async cacheChampions() {
        const response = await this.RIOTDataRequest("champion.json");
        return response?.data.data;
    }

    getChampionById(id: number) {
        if (!this.champions) {
            console.error(
                "cache not populated, please build this class first.",
            );
            return;
        }

        for (const championName in this.champions) {
            const champion = this.champions[championName];

            if (parseInt(champion.key) === id) {
                return champion;
            }
        }
    }

    constructor(version: string) {
        this.dataendpoint = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/`;
        this.dataconfig = {
            baseURL: this.dataendpoint,
        };
        this.datareq = axios.create(this.dataconfig);
    }
}

export class RiotWrapper extends DDragonWrapper {
    private async ApiRequest(
        path: string,
        instance: AxiosInstance,
    ): Promise<AxiosResponse | undefined> {
        try {
            const response = await instance.get(path);
            return response;
        } catch (error) {
            const err = error as AxiosError;

            if (err.response?.status && err.response.status != 404) {
                console.error(
                    `Error on ${path} with status`,
                    err.response.status,
                    ":",
                );
                if (err.response) {
                    console.error(err.response.data.status.message);
                } else {
                    console.error(err.message);
                }
            }
            return undefined;
        }
    }

    private apiKey = "";
    private euw1endpoint = "https://euw1.api.riotgames.com";
    private euw1config: AxiosRequestConfig;
    euw1req: AxiosInstance;
    private europeendpoint = "https://europe.api.riotgames.com";
    private europeconfig: AxiosRequestConfig;
    europereq: AxiosInstance;

    private async EUW1ApiRequest(
        path: string,
    ): Promise<AxiosResponse | undefined> {
        return this.ApiRequest(path, this.euw1req);
    }

    private async EUROPEApiRequest(
        path: string,
    ): Promise<AxiosResponse | undefined> {
        return this.ApiRequest(path, this.europereq);
    }

    async getSummonerIdsByName(name: string): Promise<SummonerDTO | undefined> {
        name = encodeURI(name);
        const response = await this.EUW1ApiRequest(
            `/lol/summoner/v4/summoners/by-name/${name}`,
        );

        return response?.data;
    }

    async getLeagueEntryBySummonerId(
        summonerId: string,
    ): Promise<LeagueEntryDTO[] | undefined> {
        const response = await this.EUW1ApiRequest(
            `/lol/league/v4/entries/by-summoner/${summonerId}`,
        );

        return response?.data;
    }

    async getActiveGame(summonerId: string): Promise<CurrentGameInfo> {
        const response = await this.EUW1ApiRequest(
            `/lol/spectator/v4/active-games/by-summoner/${summonerId}`,
        );

        return response?.data;
    }

    async getMatchById(matchId: string): Promise<MatchDTO> {
        const response = await this.EUROPEApiRequest(
            `/lol/match/v5/matches/${matchId}`,
        );

        return response?.data;
    }

    async getMatchTimelineById(matchId: string): Promise<MatchTimelineDTO> {
        const response = await this.EUROPEApiRequest(
            `/lol/match/v5/matches/${matchId}/timeline`,
        );

        return response?.data;
    }

    constructor(version: string) {
        super(version);

        if (process.env.RIOT_API_KEY === undefined) {
            console.error("No RIOT_API_KEY found in .env file.");
            throw new Error("No RIOT_API_KEY found in .env file.");
        } else {
            this.apiKey = process.env.RIOT_API_KEY;

            this.europeconfig = {
                baseURL: this.europeendpoint,
                headers: {
                    "X-Riot-Token": this.apiKey,
                },
            };

            this.euw1config = {
                baseURL: this.euw1endpoint,
                headers: {
                    "X-Riot-Token": this.apiKey,
                },
            };

            this.euw1req = axios.create(this.euw1config);
            this.europereq = axios.create(this.europeconfig);
        }
    }

    static async build() {
        const version = await this.getLatestVersion();
        const built = new this(version);

        built.champions = await built.cacheChampions();

        return built;
    }
}
