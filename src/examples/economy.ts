import fs = require("fs");
import assert = require("assert");
import demofile = require("../demo");
import { Client, ApiResponse, RequestParams } from "@elastic/elasticsearch";
import { Team } from "../entities/team";

const client = new Client({ node: "http://localhost:9200" });
let round: number = 1;
let map: string;
let winner: Team;
let start_match: Date;
let event_name: string;
let accounts_start: Array<number> = [];

function parseDemoFile(path: string) {
  event_name = path.split("/")[path.split("/").length - 1].split("#")[0];
  start_match = new Date(
    parseInt(path.split("/")[path.split("/").length - 1].split("#")[1]) * 1000
  );
  fs.readFile(path, (err, buffer) => {
    assert.ifError(err);
    const demoFile = new demofile.DemoFile();

    function index_budget() {
      for (let team of demoFile.teams) {
        if (team.teamName === "CT" || team.teamName === "TERRORIST") {
          for (let player of team.members) {
            const doc: RequestParams.Index = {
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
                money_remaining:
                  accounts_start[player.index] - player.cashSpendThisRound,
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

parseDemoFile(process.argv[2]);
