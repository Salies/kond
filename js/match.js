const $ = document.querySelector.bind(document);

const matchId = new URLSearchParams(window.location.search).get("id");
if (!matchId) {
  window.location.href = "./";
}

fetch(`${BASE_URL}/matches/${matchId}`)
  .then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error("Failed to fetch match data");
    }
  })
  .then((match) => {
    console.log(match);

    $("#match-id").innerText = matchId;
    $("#file-hash").innerText = match.file_hash;
    const matchAddedDate = new Date(match.created_at).toLocaleString();
    $("#created-at").innerText = matchAddedDate;

    $("#map-name").innerText = match.map;
    applyMap(match.map);

    // set title meta
    const _desc = `${match.map} (${match.team_a_score}-${match.team_b_score}) - ${matchAddedDate}`;
    $('meta[property="og:title"]').setAttribute("content", _desc);
    $('title').innerText = 'kond - ' + _desc;

    $("#team-a-score").innerText = match.team_a_score;
    $("#team-b-score").innerText = match.team_b_score;

    const winner = match.team_a_score > match.team_b_score ? "a" : "b";
    const loser = winner == "a" ? "b" : "a";

    const [teamA, teamB] = getTeams(match.player_data);

    $(`#team-${winner}-score`).classList.add("winner");
    $(`#team-${loser}-score`).classList.add("loser");

    $("#team-a-name").innerText = match.team_a_name;
    $("#team-b-name").innerText = match.team_b_name;

    $("#team-a-line-title").innerText = match.team_a_name;
    $("#team-b-line-title").innerText = match.team_b_name;

    // inserting and color half scores
    const halfScores = [
      match.team_a_score_first_half,
      match.team_b_score_first_half,
      match.team_a_score_second_half,
      match.team_b_score_second_half,
    ];

    let halfScoresColors = [];
    let j = 4;
    if(match.team_b_overtime_rounds_won !== 0 && match.team_a_overtime_rounds_won !== 0) {
      halfScoresColors = ["neutral", "neutral"];
      halfScores.push(match.team_a_overtime_rounds_won);
      halfScores.push(match.team_b_overtime_rounds_won);
    }

    // 3 = CT, 2 = TR
    let finalColor = teamB[0].final_team == 2 ? "terror" : "ct";
    halfScoresColors = fillArray(j, finalColor).concat(halfScoresColors);

    let halfScoresHtml = "(";
    halfScoresHtml += `<span class="${halfScoresColors[0]}">${halfScores[0]}</span>;`;
    halfScoresHtml += `<span class="${halfScoresColors[1]}">${halfScores[1]}</span>)`;
    halfScoresHtml += ` (<span class="${halfScoresColors[2]}">${halfScores[2]}</span>;`;
    halfScoresHtml += `<span class="${halfScoresColors[3]}">${halfScores[3]}</span>)`;

    if(match.team_b_overtime_rounds_won !== 0 && match.team_a_overtime_rounds_won !== 0) {
      halfScoresHtml += `<span class="neutral"> (${match.team_a_overtime_rounds_won};${match.team_b_overtime_rounds_won})</span>`;
    }

    $("#half-scores").innerHTML = halfScoresHtml;

    // get data from steam
    const steamIds = Object.keys(match.player_data);
    fetch(`${BASE_URL}/players`, {
      method: "POST",
      body: JSON.stringify({ players: steamIds }),
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Failed to fetch player data");
        }
      })
      .then((playerData) => {
        const players = playerData.response.players;
        let avgs = {
          kpr: 0,
          dpr: 0,
          kast: 0,
          impact: 0,
          adr: 0,
          rating: 0,
        };

        let std = structuredClone(avgs);

        for (let i = 0; i < players.length; i++) {
          const player = players[i];
          match.player_data[player.steamid].name = player.personaname;
          match.player_data[player.steamid].avatar = player.avatarfull;
          if(!match.player_data[player.steamid].avatar) {
            match.player_data[player.steamid].avatar = "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/6f/6f982210fe9a377fdb74d9a836e4d670f0fd68fc_full.jpg";
          }
          match.player_data[player.steamid].country = player.loccountrycode;
          match.player_data[player.steamid].profile_url = player.profileurl;
          match.player_data[player.steamid].real_name = player.realname;

          avgs.kpr += match.player_data[player.steamid].kpr;
          avgs.dpr += match.player_data[player.steamid].dpr;
          avgs.kast += match.player_data[player.steamid].kast;
          avgs.impact += match.player_data[player.steamid].impact;
          avgs.adr += match.player_data[player.steamid].adr;
          avgs.rating += match.player_data[player.steamid].rating;
        }

        avgs.kpr /= players.length;
        avgs.dpr /= players.length;
        avgs.kast /= players.length;
        avgs.impact /= players.length;
        avgs.adr /= players.length;
        avgs.rating /= players.length;

        console.log('avg', avgs);

        const teamsTbody = getTeamsTbody(teamA, teamB);
        $("#team-a-players").innerHTML = teamsTbody[0];
        $("#team-b-players").innerHTML = teamsTbody[1];

        const teamALinePlayers = linePlayerBuilder(teamA);
        const teamBLinePlayers = linePlayerBuilder(teamB);

        $("#team-a-line").innerHTML = teamALinePlayers.join("");
        $("#team-b-line").innerHTML = teamBLinePlayers.join("");

        // get player with biggest rating
        let bestPlayer = null;
        let bestRating = 0;
        for (p in match.player_data) {
          if (match.player_data[p].rating > bestRating) {
            bestRating = match.player_data[p].rating;
            bestPlayer = match.player_data[p];

            // add to std
            std.kpr += Math.pow(match.player_data[p].kpr - avgs.kpr, 2);
            std.dpr += Math.pow(match.player_data[p].dpr - avgs.dpr, 2);
            std.kast += Math.pow(match.player_data[p].kast - avgs.kast, 2);
            std.impact += Math.pow(match.player_data[p].impact - avgs.impact, 2);
            std.adr += Math.pow(match.player_data[p].adr - avgs.adr, 2);
            std.rating += Math.pow(match.player_data[p].rating - avgs.rating, 2);
          }
        }

        std.kpr = Math.sqrt(std.kpr / players.length);
        std.dpr = Math.sqrt(std.dpr / players.length);
        std.kast = Math.sqrt(std.kast / players.length);
        std.impact = Math.sqrt(std.impact / players.length);
        std.adr = Math.sqrt(std.adr / players.length);
        std.rating = Math.sqrt(std.rating / players.length);

        console.log('best', bestPlayer)

        console.log('std', std)

        updatePotm({
          kpr: bestPlayer.kpr,
          dpr: bestPlayer.dpr,
          kast: bestPlayer.kast,
          impact: bestPlayer.impact,
          adr: bestPlayer.adr,
          rating: bestPlayer.rating,
        }, avgs, std);

        $("#best-player-name").innerHTML = processRealName(
          bestPlayer.real_name,
          sanitizeNickname(bestPlayer.name)
        );

        if(bestPlayer.country) {
            $("#best-player-flag").innerHTML = `<img
            src="https://flagcdn.com/${bestPlayer.country.toLowerCase()}.svg"
            width="24"
            alt="${bestPlayer.country}">`;
        }

        if(bestPlayer.avatar) $("#best-player-potm > img").src = bestPlayer.avatar;

        pageAppear();
      })
      .catch((error) => {
        console.error(error);
        pageAppear(); // non-blocking error
      });
  })
  .catch((error) => {
    console.error(error);
    window.location.href = "./";
  });
