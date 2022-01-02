import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import dotenv from 'dotenv';
import type { CurrentGameInfo, SummonerDTO } from '../types';

dotenv.config();

export class DDragonWrapper {
    private dataendpoint: string;
    private dataconfig: AxiosRequestConfig;
    private datareq: AxiosInstance;

    // Cached DDragon data
    protected champions: any;

    protected static async getLatestVersion(): Promise<string> {
        const response = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json');
        return response.data[0];
    }

    private async RIOTDataRequest(path: string): Promise<AxiosResponse> {
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
        const response = await this.RIOTDataRequest('champion.json');
        return response.data.data;
    }

    getChamptionById(id: number) {
        if (!this.champions) {
            console.error('cache not populated, please build this class first.');
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
    private apiendpoint = 'https://euw1.api.riotgames.com';
    private apiconfig: AxiosRequestConfig = {
        baseURL: this.apiendpoint,
        headers: {
            'X-Riot-Token': process.env.RIOT_API_KEY,
        },
    };
    apireq: AxiosInstance;

    private async RIOTApiRequest(path: string): Promise<AxiosResponse> {
        try {
            const response = await this.apireq.get(path);
            return response;
        } catch (error) {
            const err = error as AxiosError;
            console.error(`Error on ${path} with status`, err.response.status, ':');
            if (err.response) {
                console.error(err.response.data.status.message);
            } else {
                console.error(err.message);
            }
            return undefined;
        }
    }

    async getSummonerByName(name: string): Promise<SummonerDTO | undefined> {
        name = encodeURI(name);
        const response = await this.RIOTApiRequest(`/lol/summoner/v4/summoners/by-name/${name}`);

        return response.data;
    }

    async getActiveGame(summonerId: string): Promise<CurrentGameInfo> {
        const response = await this.RIOTApiRequest(`/lol/spectator/v4/active-games/by-summoner/${summonerId}`);

        return response.data;
    }

    constructor(version: string) {
        super(version);
        this.apireq = axios.create(this.apiconfig);
    }

    static async build() {
        const version = await this.getLatestVersion();
        const built = new this(version);

        built.champions = await built.cacheChampions();

        return built;
    }
}

(async () => {
    const wrapper = await RiotWrapper.build();
    const summoner = await wrapper.getSummonerByName('Ăzs');
    const game = await wrapper.getActiveGame(summoner.id);

    if (!game) {
        console.log('No active game found.');
        return;
    }

    const summonerTeamId = game.participants.find(p => p.summonerName === summoner.name)?.teamId;

    console.log('Sardoche is currently in a game!');
    console.log('Sardoche\'s team:');
    game.participants.forEach(p => {
        if (p.teamId === summonerTeamId) {
            console.log(`\t${p.summonerName} (${wrapper.getChamptionById(p.championId)?.id})`);
        }
    });
    console.log('Opponent\'s team:');
    game.participants.forEach(p => {
        if (p.teamId !== summonerTeamId) {
            console.log(`\t${p.summonerName} (${wrapper.getChamptionById(p.championId)?.id})`);
        }
    });
})();