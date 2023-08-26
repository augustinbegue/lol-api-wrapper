# lol-api-wrapper
NodeJS wrapper for the League of Legends and Summoner parts of the RIOT Games API (https://developer.riotgames.com/)

## Documentation

This wrapper is still a work in progress. It currently implements the following APIs:

* Summoner V4 (https://developer.riotgames.com/apis#summoner-v4)
* League V4 (https://developer.riotgames.com/apis#league-v4)
* Match V5 (https://developer.riotgames.com/apis#match-v5)
* Spectator V4 (https://developer.riotgames.com/apis#spectator-v4)

## Usage

``sh
npm install lol-api-wrapper
``

```js
const { RiotApiWrapper } = require('lol-api-wrapper');

const api = new RiotApiWrapper("RIOT-API-KEY");

// Get summoner by name
api.getSummonerByName("EUW1", "SummonerName").then((summoner) => {
    console.log(summoner);
}).catch((err) => {
    console.log(err);
});
```
