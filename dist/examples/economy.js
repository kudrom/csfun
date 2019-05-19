"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const assert = require("assert");
const demofile = require("../demo");
const elasticsearch_1 = require("@elastic/elasticsearch");
const client = new elasticsearch_1.Client({ node: "http://localhost:9200" });
let round = 1;
let map;
let winner;
let start_match;
let event_name;
let accounts_start = [];
function parseDemoFile(path) {
    event_name = path.split("/")[path.split("/").length - 2];
    start_match = new Date(parseInt(path.split("/")[path.split("/").length - 1].split("#")[0]));
    fs.readFile(path, (err, buffer) => {
        assert.ifError(err);
        const demoFile = new demofile.DemoFile();
        function index_budget() {
            for (let team of demoFile.teams) {
                if (team.teamName === "CT" || team.teamName === "TERRORIST") {
                    for (let player of team.members) {
                        const doc = {
                            index: "csfun-v1",
                            body: {
                                event: event_name,
                                start_match: start_match,
                                map: map,
                                clan: team.clanName,
                                clan_score: team.score,
                                team: team.teamName,
                                player: player.name,
                                round: round,
                                money_spent: player.cashSpendThisRound,
                                money_start_round: accounts_start[player.index],
                                money_remaining: accounts_start[player.index] - player.cashSpendThisRound,
                                winner_team: winner.teamName
                            }
                        };
                        client.index(doc);
                    }
                }
            }
        }
        demoFile.on("start", () => {
            map = demoFile.header.mapName;
        });
        demoFile.gameEvents.on("round_start", () => {
            for (let player of demoFile.players) {
                if (player.team && player.team.teamName.toUpperCase() !== "SPECTATOR") {
                    accounts_start[player.index] = player.account;
                }
            }
        });
        demoFile.gameEvents.on("round_end", e => {
            console.log("Round %d", round);
            winner = demoFile.teams[e.winner];
            index_budget();
            round += 1;
        });
        demoFile.parse(buffer);
    });
}
fs.readdir(process.argv[2], (err, files) => {
    for (let demo_file of files.filter((f) => { return f.endsWith('.dem'); })) {
        console.log("Indexing", demo_file);
        parseDemoFile(process.argv[2] + demo_file);
    }
});
//# sourceMappingURL=economy.js.map