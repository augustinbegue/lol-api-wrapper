import { RiotApiWrapper } from "./RiotApiWrapper";
import { RiotApiError } from "./RiotApiError";
import { RateLimitHandler } from "./RateLimitHandler";

export type RiotPlatform =
    | "BR1"
    | "EUN1"
    | "EUW1"
    | "JP1"
    | "KR"
    | "LA1"
    | "LA2"
    | "NA1"
    | "OC1"
    | "TR1"
    | "RU"
    | "PH2"
    | "SG2"
    | "TH2"
    | "VN2";

export type RiotRegion = "AMERICAS" | "ASIA" | "EUROPE" | "SEA";

export { RiotApiWrapper, RiotApiError, RateLimitHandler };
