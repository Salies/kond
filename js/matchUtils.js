
function pageAppear(){
  $('#loading').classList.add('hidden');
  $('main').classList.remove('hidden');
}

function fillArray(n, startWord) {
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

  let idx = 0;
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

      let idxClass = "odd";
      if(idx % 2 == 0) idxClass = "even";

      idx++;

      return `<tr class=${idxClass}>
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