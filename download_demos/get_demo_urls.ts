import { HLTV } from "hltv";

function download_event(event_id: number) {
  HLTV.getResults({ pages: 1, eventId: event_id }).then(results => {
    for (let result of results) {
      HLTV.getMatch({ id: result.id }).then(match => {
        let demo = match.demos
          .filter(demo => {
            return demo.name === "GOTV Demo";
          })
          .map(demo => {
            return demo.link;
          });
        if (demo.length != 1) {
          console.log("### Demo files couldn't be found for ", match.id);
        } else {
          console.log(
            JSON.stringify({
              event: match.event.name,
              team1: match.team1.name,
              team2: match.team2.name,
              date: match.date,
              url: "https://www.hltv.org" + demo[0]
            })
          );
        }
      });
    }
  });
}

download_event(parseInt(process.argv[2]));
