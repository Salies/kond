use rusqlite::{Connection, Result, params};
use nanoid::nanoid;

pub fn insert_match(conn: &mut Connection, match_data: &super::model::MatchDataIn) -> Result<super::model::MatchDataOut> {
    let tx = conn.transaction().expect("Failed to start transaction");

    let id = nanoid!();

    // Insert into match table
    tx.execute(
        "INSERT INTO match (id, hash, map, team_a_name, team_b_name, team_a_score, team_b_score,
                            team_a_score_first_half, team_b_score_first_half, 
                            team_a_score_second_half, team_b_score_second_half,
                            team_a_overtime_rounds_won, team_b_overtime_rounds_won)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
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
            match_data.team_b_overtime_rounds_won
        ],
    )?;

    // Insert player data
    for (steam_id, player) in &match_data.player_data {
        tx.execute(
            "INSERT INTO player_match (match_id, steam_id, final_team, kills, deaths, diff, kpr, dpr, 
                                       adr, pct_rounds_with_mk, opening_kills_per_round, win_pct_after_opening_kill, 
                                       impact, kast, rating) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            params![
                id, // Foreign key reference to match
                steam_id,
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
    Ok(super::model::MatchDataOut {
        id
    })
}
