use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct Player {
    pub final_team: u8,
    pub name: String,
    pub kills: u32,
    pub deaths: u32,
    pub diff: i32,
    pub kpr: f32,
    pub dpr: f32,
    pub adr: f32,
    pub pct_rounds_with_mk: f32,
    pub opening_kills_per_round: f32,
    pub win_pct_after_opening_kill: f32,
    pub impact: f32,
    pub kast: f32,
    pub rating: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MatchCreate{
    pub file_hash: String,
    pub map: String,
    pub team_a_name: String,
    pub team_b_name: String,
    pub team_a_score: u8,
    pub team_b_score: u8,
    pub team_a_score_first_half: u8,
    pub team_b_score_first_half: u8,
    pub team_a_score_second_half: u8,
    pub team_b_score_second_half: u8,
    pub team_a_overtime_rounds_won: u8,
    pub team_b_overtime_rounds_won: u8,
    pub player_data: HashMap<String, Player>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MatchData {
    pub file_hash: String,
    pub map: String,
    pub team_a_name: String,
    pub team_b_name: String,
    pub team_a_score: u8,
    pub team_b_score: u8,
    pub team_a_score_first_half: u8,
    pub team_b_score_first_half: u8,
    pub team_a_score_second_half: u8,
    pub team_b_score_second_half: u8,
    pub team_a_overtime_rounds_won: u8,
    pub team_b_overtime_rounds_won: u8,
    pub created_at: String,
    pub updated_at: String,
    pub player_data: HashMap<String, Player>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MatchDataOut {
    pub id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SteamPlayers {
    pub players: Vec<String>,
}