const { RiotApiWrapper, RateLimitHandler, RiotApiError } = require("../dist");
const { writeFile, readFile } = require("fs/promises");

const rateLimitHandler = new RateLimitHandler({
    logLevel: "error",
    storeRateLimitsFunction: async (method, rateLimitEnd, rateLimit, rateLimitCount) => {
        const rateLimitsJson = JSON.parse((await readFile("./rate-limits.json")).toString());
        rateLimitsJson[method] = {
            rateLimitEnd,
            rateLimit,
            rateLimitCount
        };

        await writeFile("./rate-limits.json", JSON.stringify(rateLimitsJson, null, 4));
    },
    getRateLimitsFunction: async (method) => {
        return JSON.parse((await readFile("./rate-limits.json")).toString())[method] ?? null;
    },
    getRateLimitTypesFunction: async () => {
        const rateLimits = JSON.parse((await readFile("./rate-limits.json")).toString());

        return Object.keys(rateLimits);
    }
});
const api = new RiotApiWrapper(process.env.RIOT_API_KEY, {
    rateLimitHandler
});

(async () => {
    const leagueList = await api.getLeagueListEntries("EUW1", "RANKED_SOLO_5x5", "CHALLENGER");

    console.log(`Received ${leagueList.entries.length} entries`);

    const leaderboard = leagueList.entries.sort((a, b) => b.leaguePoints - a.leaguePoints);

    for (let i = 0; i < leaderboard.length; i++) {
        const entry = leaderboard[i];

        // console.log(`#${(i + 1).toString().padEnd(3, " ")} - ${entry.summonerName} (${entry.leaguePoints} LP)`);

        try {
            const activeGame = await api.getActiveGameBySummonerId("EUW1", entry.summonerId);

            if (activeGame) {
                console.log(`${entry.summonerName}: ${activeGame.gameMode} - ${activeGame.gameType} - ${activeGame.gameLength}s`);
            }
        } catch (error) { }
    }
})();
