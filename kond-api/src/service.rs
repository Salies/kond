use crate::model::SteamPlayers;

use super::model::{MatchData, MatchDataOut, Player, MatchCreate};
use nanoid::nanoid;
use rusqlite::{params, Connection};
use std::collections::HashMap;
use std::env;
use serde_json::Value;
use chrono::Utc;

pub fn insert_match(conn: &mut Connection, match_data: &MatchCreate) -> rusqlite::Result<MatchDataOut> {
    let tx = conn.transaction().expect("Failed to start transaction");

    let id = nanoid!();
    let created_at = Utc::now().to_rfc3339();
    let updated_at = created_at.clone();

    // Insert into match table
    tx.execute(
        "INSERT INTO match (id, hash, map, team_a_name, team_b_name, team_a_score, team_b_score,
                            team_a_score_first_half, team_b_score_first_half, 
                            team_a_score_second_half, team_b_score_second_half,
                            team_a_overtime_rounds_won, team_b_overtime_rounds_won,
                            created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
        params![
            id,
            match_data.file_hash,
            match_data.map,
            match_data.team_a_name,
            match_data.team_b_name,
            match_data.team_a_score,
            match_data.team_b_score,
            match_data.team_a_score_first_half,
            match_data.team_b_score_first_half,
            match_data.team_a_score_second_half,
            match_data.team_b_score_second_half,
            match_data.team_a_overtime_rounds_won,
            match_data.team_b_overtime_rounds_won,
            created_at,
            updated_at
        ],
    )?;

    // Insert player data
    for (steam_id, player) in &match_data.player_data {
        tx.execute(
            "INSERT INTO player_match (match_id, steam_id, player_name, final_team, kills, deaths, diff, kpr, dpr, 
                                       adr, pct_rounds_with_mk, opening_kills_per_round, win_pct_after_opening_kill, 
                                       impact, kast, rating) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
            params![
                id, // Foreign key reference to match
                steam_id,
                player.name,
                player.final_team,
                player.kills,
                player.deaths,
                player.diff,
                player.kpr,
                player.dpr,
                player.adr,
                player.pct_rounds_with_mk,
                player.opening_kills_per_round,
                player.win_pct_after_opening_kill,
                player.impact,
                player.kast,
                player.rating
            ],
        )?;
    }

    tx.commit().expect("Failed to commit transaction");
    Ok(MatchDataOut { id })
}

pub fn retrieve_match_by_id(conn: &mut Connection, match_id: &str) -> rusqlite::Result<MatchData> {
    let mut stmt = conn.prepare("SELECT * FROM match WHERE id = ?1")?;

    let match_data = stmt.query_row([match_id], |row| {
        Ok(MatchData {
            file_hash: row.get(1)?,
            map: row.get(2)?,
            team_a_name: row.get(3)?,
            team_b_name: row.get(4)?,
            team_a_score: row.get(5)?,
            team_b_score: row.get(6)?,
            team_a_score_first_half: row.get(7)?,
            team_b_score_first_half: row.get(8)?,
            team_a_score_second_half: row.get(9)?,
            team_b_score_second_half: row.get(10)?,
            team_a_overtime_rounds_won: row.get(11)?,
            team_b_overtime_rounds_won: row.get(12)?,
            created_at: row.get(13)?,
            updated_at: row.get(14)?,
            player_data: HashMap::new(), // we'll fill this later
        })
    })?;

    let mut player_data = HashMap::new();
    let mut stmt = conn.prepare("SELECT * FROM player_match WHERE match_id = ?1")?;

    let player_iter = stmt.query_map([match_id], |row| {
        Ok((
            row.get::<_, String>(1)?, // steam_id
            Player {
                final_team: row.get(3)?,
                name: row.get(2)?,
                kills: row.get(4)?,
                deaths: row.get(5)?,
                diff: row.get(6)?,
                kpr: row.get(7)?,
                dpr: row.get(8)?,
                adr: row.get(9)?,
                pct_rounds_with_mk: row.get(10)?,
                opening_kills_per_round: row.get(11)?,
                win_pct_after_opening_kill: row.get(12)?,
                impact: row.get(13)?,
                kast: row.get(14)?,
                rating: row.get(15)?,
            },
        ))
    })?;

    for player in player_iter {
        let (steam_id, player) = player?;
        player_data.insert(steam_id, player);
    }

    // Update the match data with the player data
    let mut match_data = match_data;
    match_data.player_data = player_data;

    // Return the populated MatchData
    Ok(match_data)
}

pub fn retrieve_match_id_by_file_hash(conn: &mut Connection, file_hash: &str) -> rusqlite::Result<MatchDataOut> {
    let mut stmt = conn.prepare("SELECT id FROM match WHERE hash = ?1")?;

    let match_id = stmt.query_row([file_hash], |row| {
        Ok(MatchDataOut {
            id: row.get(0)?,
        })
    })?;

    Ok(match_id)
}

pub async fn get_players_from_steam(players_data: &SteamPlayers) -> Result<HashMap<String, Value>, Box<dyn std::error::Error>> {
    let steam_ids = &players_data.players.join(",");
    let steam_api_key = env::var("STEAM_API_KEY").expect("STEAM_API_KEY must be set");

    let url = format!(
        "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002?key={}&steamids={}",
        steam_api_key, steam_ids
    );

    let resp = reqwest::get(url)
        .await?
        .json::<HashMap<String, Value>>()
        .await?;

    Ok(resp)
}
