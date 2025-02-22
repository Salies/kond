const $ = document.querySelector.bind(document);

const matchId = new URLSearchParams(window.location.search).get("id");
if (!matchId) {
  window.location.href = "/";
}

function fillArray(n, startWord) {
  //const opposite = startWord == "ct" ? "terror" : "ct";
  let array = new Array(n);
  const words = ["terror", "ct"];
  let idx = words.indexOf(startWord);

  for (let i = 0; i < n; i++) {
    if(i % 2 != 0) {
      idx = idx == 0 ? 1 : 0;
    }

    array[i] = words[idx];
  }

  return array;
}

function sanitizeNickname(nickname) {
    return nickname.replace("<", "").replace(">", "");
}

function processRealName(realName, nickname) {
  // if real name is undefined, return the nickname
  if (!realName) return nickname;

  let nameParts = realName.split(" ");
  if (nameParts.length < 2) return nickname;
  return `${nameParts[0]} "<b>${nickname}</b>" ${
    nameParts[nameParts.length - 1]
  }`;
}

function tbodyBuilder(players) {
  // first, sort the players by rating
  players.sort((a, b) => {
    return b.rating - a.rating;
  });

  return players
    .map((player) => {
      const playerName = processRealName(
        player.real_name,
        sanitizeNickname(player.name)
      );

      let flag = "";
      if (player.country) {
        flag = `<img
                    class="flag"
                    src="https://flagcdn.com/w20/${player.country.toLowerCase()}.png"
                    width="16"
                    height="12"
                    alt="${player.country}"
                />`;
      }

      let colorClass = "";
      if(player.diff > 0)
        colorClass = "winner";
      else if(player.diff < 0)
        colorClass = "loser";

      return `<tr>
            <td class="player-name">${flag}<a href="${
              player.profile_url
            }" target="_blank">${playerName}</a></td>
            <td class="tg-0lax">${player.kills}-${player.deaths}</td>
            <td class="tg-0lax ${colorClass}">
              ${player.diff > 0 ? "+" : ""}${player.diff}
            </td>
            <td class="tg-0lax">${parseFloat(player.adr).toFixed(1)}</td>
            <td class="tg-0lax">${parseFloat(player.kast * 100).toFixed(
              1
            )}%</td>
            <td class="tg-0lax">${parseFloat(player.rating).toFixed(2)}</td>
        </tr>`;
    })
    .join("");
}

function linePlayerBuilder(players) {
  return players.map((player) => {
    let flag = "";
    if (player.country) {
      flag = `<img
                    class="flag"
                    src="https://flagcdn.com/w20/${player.country.toLowerCase()}.png"
                    width="16"
                    height="12"
                    alt="${player.country}"
                />`;
    }

    return `<div class="line-player">
            <img
              src="${player.avatar}"
            />
            <span>${flag} ${sanitizeNickname(player.name)}</span>
          </div>`;
  });
}

function getTeams(playerData) {
  const teamA = new Array();
  const teamB = new Array();

  for (p in playerData) {
    if (playerData[p].final_team == 2) {
      teamA.push(playerData[p]);
      continue;
    }

    teamB.push(playerData[p]);
  }

  return [teamA, teamB];
}

function getTeamsTbody(teamA, teamB) {
  const teamATbody = tbodyBuilder(teamA);
  const teamBTbody = tbodyBuilder(teamB);

  return [teamATbody, teamBTbody];
}

fetch(`http://127.0.0.1:8080/matches/${matchId}`)
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

    $("#map-name").innerText = match.map;

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
    fetch(`http://127.0.0.1:8080/players`, {
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
        }

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
          }
        }

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

        $("#best-player-potm").innerHTML = `<img
            src="${bestPlayer.avatar}"
            alt="Player of the match">`;
      })
      .catch((error) => {
        console.error(error);
      });
  })
  .catch((error) => {
    console.error(error);
    window.location.href = "/";
  });
