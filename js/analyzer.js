function parseDemo(data) {
    //console.log(wasm_bindgen.listGameEvents(data));

    const allEvents = wasm_bindgen.parseEvents(
        data,
        ["player_death", "cs_win_panel_match", "round_officially_ended"],
        ["team_num"], ["total_rounds_played", "round_win_status"]
    );

    //console.log(allEvents)

    // getting last tick of the match and number of rounds played
    const endMatchEvent = allEvents.filter(event => event.get("event_name") === "cs_win_panel_match")[0];
    const endMatchTick = endMatchEvent.get("tick");
    const gameRoundsPlayed = endMatchEvent.get("total_rounds_played");

    console.log(endMatchTick, gameRoundsPlayed)

    // get player data from last tick
    const playerEvents = ["kills_total", "deaths_total", "damage_total", "round_win_status"];
    let playerData = wasm_bindgen.parseTicks(data, playerEvents, [endMatchTick]);
    /*for(let i = 0; i < player_data.length; i++) {
        player_data[i].set("kpr", player_data[i].get("kills_total") / game_rounds_played);
        player_data[i].set("dpr", player_data[i].get("deaths_total") / game_rounds_played);
        player_data[i].set("adr", player_data[i].get("damage_total") / game_rounds_played);
    }*/

    console.log(playerData[0])

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
    console.log(roundWinEvents)

    // now let's get data from the death events
    const deathEvents = allEvents.filter(event => event.get("event_name") === "player_death");
    /*console.log(death_events)

    // setting up our data structures
    const multikills = new Map(), openers = new Map(), kastData = new Map();
    for (let i = 0; i < gameRoundsPlayed; i++) {
        kastData.set(i, new Map());
        for(let j = 0; j < playerData.length; j++) {
            kastData.get(i).set(playerData[j].get("steamid"), false);
        }
    }

    console.log(kastData)

    for(let i = 0; i < playerData.length; i++) {
        multikills.set(playerData[i].get("steamid"), 0);
        openers.set(playerData[i].get("steamid"), {
            total: 0,
            converted: 0
        });
    }
    let currentRound = -1, attackerVictimMap = new Map(), multikillers = new Map();

    // now let's iterate through the deaths and get a bunch of data!
    for(let i = 0; i < death_events.length; i++) {
        //console.log(death_events[i])
        const attacker = death_events[i].get("attacker_steamid");
        const victim = death_events[i].get("user_steamid");

        //console.log(attacker, victim)

        // skip suicides and deaths from the world
        if (attacker === victim || attacker === undefined || victim === undefined) continue;

        const round = death_events[i].get("total_rounds_played");
        if (round !== currentRound) {
            // if the round change, then this is the first kill of the round!
            // let's register it as an opener
            const openerSet = openers.get(attacker);
            openerSet.total += 1;
            // will their team win this round?
            // TODO: change this, it's unsafe
            //const roundWinner = roundWinEvents[round].get("round_win_status");
            const roundWinner = roundWinEvents.filter(
                event => event.get("total_rounds_played") === round + 1
            )[0].get("round_win_status");
            const playerTeam = death_events[i].get("attacker_team_num");
            if (roundWinner === playerTeam) openerSet.converted += 1;
            openers.set(attacker, openerSet);
            console.log("OPENER", attacker, roundWinner === playerTeam)

            currentRound = round;
            attackerVictimMap = new Map();
            multikillers = new Map();
        }

        // check if attacker is already in the map
        // if so, add 1 to multikill
        if (attackerVictimMap.has(attacker)) {
            if (!multikillers.has(attacker)) {
                multikills.set(attacker, multikills.get(attacker) + 1);
                multikillers.set(attacker, true);
            }
        } else { 
            attackerVictimMap.set(attacker, victim);
        }
    }

    console.log(multikills);
    console.log(openers)*/

    proccessKillfeed(playerData, deathEvents, roundWinEvents, gameRoundsPlayed);
}

function proccessKillfeed(playerData, killfeed, roundWinEvents, totalRoundsPlayed) {
    const roundWinners = new Map();
    for(let i = 0; i < roundWinEvents.length; i++) {
        roundWinners.set(roundWinEvents[i].get("total_rounds_played") - 1, roundWinEvents[i].get("round_win_status"));
    }

    let currentRound = -1, roundKillers = [], roundMultikillers = [], multikillCount = {},
    openers = {},
    lastAttacker = null, lastVictim = null, kastData = {}, players = [];

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

    console.log(multikillCount)
    console.log(openers)
    console.log(kastData)
}