import fs = require("fs");
import assert = require("assert");
import demofile = require("demofile");

let round:number = 1;
let accounts_start:Array<number> = [];

function parseDemoFile(path: string){
  fs.readFile(path, (err, buffer) => {
    assert.ifError(err);
    const demoFile = new demofile.DemoFile();

    function print_budget(){
      for(let team of demoFile.teams){
        if(team.teamName === "CT" || team.teamName === "TERRORIST"){
          for(let player of team.members){
            console.log(
              "%s [%s] starts round %d with $%d and spends $%d = %d",
              player.name, team.teamName, round,
              accounts_start[player.index], player.cashSpendThisRound,
              accounts_start[player.index] - player.cashSpendThisRound
            );
          }
        }
      };
    }
    
    demoFile.on("start", () => {
      console.log("Started: ", demoFile.header);
    });

    demoFile.gameEvents.on("round_start", e => {
      for(let player of demoFile.players){
        if(player.team && player.team.teamName.toUpperCase() !== 'SPECTATOR'){
          accounts_start[player.index] = player.account;
        }
      }
    });

    demoFile.gameEvents.on("round_end", e=> {
      console.log("ROUND %d ENDS, %s [%s] wins",
        round, demoFile.teams[e.winner].clanName,
        demoFile.teams[e.winner].teamName);
      print_budget();
      round += 1;
    });

    demoFile.parse(buffer);
  });
}

parseDemoFile(process.argv[2]);