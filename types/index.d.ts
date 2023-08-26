import type { CurrentGameInfo } from './CurrentGameInfo';
import type { SummonerDTO } from './SummonerDTO';
import type { LeagueEntryDTO } from './LeagueEntryDTO';
import type { MatchDTO } from './MatchDTO';
import type { MatchTimelineDTO } from './MatchTimelineDTO';
import type { MiniSeriesDTO } from './MiniSeriesDTO';
import type { LeagueListDTO } from './LeagueListDTO';
import type { LeagueItemDTO } from './LeagueItemDTO';

type LeagueDivision = "I" | "II" | "III" | "IV";
type LeagueTier = "IRON" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND" | "MASTER" | "GRANDMASTER" | "CHALLENGER";
type LeagueQueue = "RANKED_SOLO_5x5" | "RANKED_FLEX_SR" | "RANKED_FLEX_TT";


export {
    LeagueDivision,
    LeagueTier,
    LeagueQueue,
    LeagueListDTO,
    LeagueItemDTO,
    CurrentGameInfo,
    SummonerDTO,
    LeagueEntryDTO,
    MatchDTO,
    MatchTimelineDTO,
    MiniSeriesDTO,
};
