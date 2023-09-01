const { RiotApiWrapper, RateLimitHandler } = require("../dist");

const rateLimitHandler = new RateLimitHandler({
    logLevel: "info",
});
const api = new RiotApiWrapper(process.env.RIOT_API_KEY, {
    rateLimitHandler
});

api.getSummonerByName("EUW1", "Tagueo")
    .then((summoner) => {
        console.log(summoner);

        api.getMatchIdsByPuuid("EUROPE", summoner.puuid, {
            count: 100,
        })
            .then(async (matchIds) => {
                console.log(matchIds);

                for (let i = 0; i < matchIds.length; i++) {
                    const matchId = matchIds[i];

                    const match = await api.getMatchByMatchId("EUROPE", matchId);

                    console.log(`Match ${i + 1}/${matchIds.length}: ${matchId} - ${match.info.gameDuration}s`);
                }
            });
    })
    .catch((err) => {
        console.log(err);
    });
