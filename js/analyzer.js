function calcImpact(propRoundsWithMultikill, openinKillsPerRound, winPctAfterOpeningKill) {
    return (
        (propRoundsWithMultikill * 3.73761914) +
        (openinKillsPerRound * 2.886383) +
        (winPctAfterOpeningKill * 0.09009486) +
        0.07304849
    )
}

function calcRating(kast, kpr, dpr, impact, adr) {
    return (
        (kast * 0.79697728) +
        (kpr * 0.42331173) +
        (dpr * -0.39860167) +
        (impact * 0.2394093) +
        (adr * 0.00280917) -
        0.00879399
    )
}

function parseDemo(data) {
    const allEvents = wasm_bindgen.parseEvents(
        data,
        ["player_death", "cs_win_panel_match", "round_officially_ended"],
        ["team_num"], ["total_rounds_played", "round_win_status"]
    );

    // getting last tick of the match and number of rounds played
    const endMatchEvent = allEvents.filter(event => event.get("event_name") === "cs_win_panel_match")[0];
    const endMatchTick = endMatchEvent.get("tick");
    const gameRoundsPlayed = endMatchEvent.get("total_rounds_played");

    // get player data from last tick
    const playerEvents = [
        "kills_total", "deaths_total", "damage_total",
        "round_win_status", "team_num", "team_rounds_total",
        "team_score_first_half", "team_score_second_half", "team_name"];
    let playerData = wasm_bindgen.parseTicks(data, playerEvents, [endMatchTick]);

    // before getting the death events, let's get the round win events
    // those will be useful later
    const roundWinEvents = allEvents.filter(event => event.get("event_name") === "round_officially_ended")
    // for some reason, this doesn't get the last round win event
    // add from playerEvents
    const lastRoundWinner = playerData[0].get("round_win_status");
    const lastRoundWinMap = new Map();
    lastRoundWinMap.set("tick", endMatchTick);
    lastRoundWinMap.set("event_name", "round_officially_ended");
    lastRoundWinMap.set("total_rounds_played", gameRoundsPlayed);
    lastRoundWinMap.set("round_win_status", lastRoundWinner);
    roundWinEvents.push(lastRoundWinMap);

    // now let's get data from the death events
    const deathEvents = allEvents.filter(event => event.get("event_name") === "player_death");

    const killFeedData = proccessKillfeed(playerData, deathEvents, roundWinEvents, gameRoundsPlayed);

    const playerOutput = {};
    for(let i = 0; i < playerData.length; i++) {
        const steamid = playerData[i].get("steamid");
        const name = playerData[i].get("name");
        const finalTeam = playerData[i].get("team_num");
        const kills = playerData[i].get("kills_total");
        const deaths = playerData[i].get("deaths_total");
        const kpr = kills / gameRoundsPlayed;
        const dpr = deaths / gameRoundsPlayed;
        const diff = kills - deaths;
        const adr = playerData[i].get("damage_total") / gameRoundsPlayed;

        const pctRoundsWithMk = killFeedData.multikillCount[steamid] / gameRoundsPlayed;
        const openingKillsPerRound = killFeedData.openers[steamid].total / gameRoundsPlayed;
        const winPctAfterOpeningKill = killFeedData.openers[steamid].converted / gameRoundsPlayed;

        const impact = calcImpact(pctRoundsWithMk, openingKillsPerRound, winPctAfterOpeningKill);

        const kast = killFeedData.playerKastCount[steamid] / gameRoundsPlayed;

        const rating = calcRating(kast, kpr, dpr, impact, adr);

        playerOutput[steamid] =  {
            final_team: finalTeam,
            name,
            kills,
            deaths,
            diff,
            kpr,
            dpr,
            adr,
            pct_rounds_with_mk: pctRoundsWithMk,
            opening_kills_per_round: openingKillsPerRound,
            win_pct_after_opening_kill: winPctAfterOpeningKill,
            impact,
            kast,
            rating
        };
    }

    // getting additional data from the match
    const headerData = wasm_bindgen.parseHeader(data);
    const matchData = {};
   // matchData.set("map", headerData.get("map_name"));
    matchData.map = headerData.get("map_name");
    const teamAData = playerData.filter(player => player.get("team_num") === 2)[0];
    const teamBData = playerData.filter(player => player.get("team_num") === 3)[0];

    // check for overtime rounds
    const teamARounds = teamAData.get("team_rounds_total");
    const teamBRounds = teamBData.get("team_rounds_total");
    let teamAOvertimeRoundsWon = 0, teamBOvertimeRoundsWon = 0;
    if (gameRoundsPlayed > 24) {
        teamAOvertimeRoundsWon = teamARounds - 12;
        teamBOvertimeRoundsWon = teamBRounds - 12;
    }

    /*matchData.set("teamAName", teamAData.get("team_name"));
    matchData.set("teamBName", teamBData.get("team_name"));
    matchData.set("teamAPoints", teamAData.get("team_rounds_total"));
    matchData.set("teamBPoints", teamBData.get("team_rounds_total"));
    matchData.set("teamAScoreFirstHalf", teamAData.get("team_score_first_half"));
    matchData.set("teamBScoreFirstHalf", teamBData.get("team_score_first_half"));
    matchData.set("teamAScoreSecondHalf", teamAData.get("team_score_second_half"));
    matchData.set("teamBScoreSecondHalf", teamBData.get("team_score_second_half"));
    matchData.set("teamAOvertimeRoundsWon", teamAOvertimeRoundsWon);
    matchData.set("teamBOvertimeRoundsWon", teamBOvertimeRoundsWon);
    matchData.set("playerData", playerOutput);*/

    matchData.team_a_name = teamAData.get("team_name");
    matchData.team_b_name = teamBData.get("team_name");
    matchData.team_a_score = teamAData.get("team_rounds_total");
    matchData.team_b_score = teamBData.get("team_rounds_total");
    matchData.team_a_score_first_half = teamAData.get("team_score_first_half");
    matchData.team_b_score_first_half = teamBData.get("team_score_first_half");
    matchData.team_a_score_second_half = teamAData.get("team_score_second_half");
    matchData.team_b_score_second_half = teamBData.get("team_score_second_half");
    matchData.team_a_overtime_rounds_won = teamAOvertimeRoundsWon;
    matchData.team_b_overtime_rounds_won = teamBOvertimeRoundsWon;
    matchData.player_data = playerOutput;

    return matchData;
}

function proccessKillfeed(playerData, killfeed, roundWinEvents, totalRoundsPlayed) {
    const roundWinners = new Map();
    for(let i = 0; i < roundWinEvents.length; i++) {
        roundWinners.set(roundWinEvents[i].get("total_rounds_played") - 1, roundWinEvents[i].get("round_win_status"));
    }

    let currentRound = -1, roundKillers = [], roundMultikillers = [], multikillCount = {},
    openers = {},
    lastAttacker = null, lastVictim = null, kastData = {}, players = [], playerKastCount = {};

    for(let i = 0; i < playerData.length; i++) {
        const steamid = playerData[i].get("steamid");
        players.push(steamid);
        multikillCount[steamid] = 0;
        openers[steamid] = {
            total: 0,
            converted: 0
        };

        for(let j = 0; j < totalRoundsPlayed; j++) {
            if (!kastData[j]) kastData[j] = {};
            kastData[j][steamid] = false;
        }
    }

    let survivors = players.slice();
    for(let i = 0 ; i < killfeed.length; i++) {
        const attacker = killfeed[i].get("attacker_steamid");
        const victim = killfeed[i].get("user_steamid");

        survivors = survivors.filter(player => player !== victim);

        if (attacker === victim || attacker === undefined || victim === undefined) continue;

        const round = killfeed[i].get("total_rounds_played");
        if (round !== currentRound) {
            // if it's the round just change, then this kill is an opener!
            openers[attacker].total += 1;
            if (roundWinners.get(round) === killfeed[i].get("attacker_team_num")) {
                openers[attacker].converted += 1;
            }

            // if survived
            for(let j = 0; j < survivors.length; j++) {
                kastData[round][survivors[j]] = true;
            }

            roundKillers = [];
            roundMultikillers = [];
            currentRound = round;
            lastAttacker = null;
            lastVictim = null;
            survivors = players.slice();
        }

        if (roundKillers.includes(attacker)) {
            if (!roundMultikillers.includes(attacker)) {
                multikillCount[attacker] += 1;
                roundMultikillers.push(attacker);
            }
        } else {
            roundKillers.push(attacker);
        }

        // if killed someone
        kastData[round][attacker] = true;
        // if assisted
        const assister = killfeed[i].get("assister_steamid");
        if (assister) kastData[round][assister] = true;

        // if traded
        if (lastAttacker === victim) {
            // last victim was traded
            kastData[round][lastVictim] = true;
        }

        lastAttacker = attacker;
        lastVictim = victim;
    }

    for(const roundData in kastData) {
        for(const player in kastData[roundData]) {
            if (kastData[roundData][player]) {
                if (!playerKastCount[player]) playerKastCount[player] = 0;
                playerKastCount[player] += 1;
            }
        }
    }

    return {multikillCount, openers, playerKastCount};
}