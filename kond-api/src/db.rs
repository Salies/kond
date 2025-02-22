use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::Connection;

pub fn init_db(db_url: &str) -> SqliteConnectionManager {
    let conn = Connection::open(db_url).expect("Failed to open database");
    conn.execute(
        "
        CREATE TABLE IF NOT EXISTS match (
            id TEXT PRIMARY KEY,
            hash TEXT UNIQUE NOT NULL,
            map TEXT NOT NULL,
            team_a_name TEXT NOT NULL,
            team_b_name TEXT NOT NULL,
            team_a_score INTEGER NOT NULL,
            team_b_score INTEGER NOT NULL,
            team_a_score_first_half INTEGER NOT NULL,
            team_b_score_first_half INTEGER NOT NULL,
            team_a_score_second_half INTEGER NOT NULL,
            team_b_score_second_half INTEGER NOT NULL,
            team_a_overtime_rounds_won INTEGER NOT NULL,
            team_b_overtime_rounds_won INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );",
        (),
    )
    .expect("Failed to create tables");

    conn.execute(
        "CREATE TABLE IF NOT EXISTS player_match (
                match_id TEXT NOT NULL,
                steam_id TEXT NOT NULL,
                player_name TEXT NOT NULL,
                final_team INTEGER NOT NULL,
                kills INTEGER NOT NULL,
                deaths INTEGER NOT NULL,
                diff INTEGER NOT NULL,
                kpr REAL NOT NULL,
                dpr REAL NOT NULL,
                adr REAL NOT NULL,
                pct_rounds_with_mk REAL NOT NULL,
                opening_kills_per_round REAL NOT NULL,
                win_pct_after_opening_kill REAL NOT NULL,
                impact REAL NOT NULL,
                kast REAL NOT NULL,
                rating REAL NOT NULL,
                PRIMARY KEY(match_id, steam_id)
            );",
        (),
    )
    .expect("Failed to create tables");

    conn.close().expect("Failed to close connection");

    return SqliteConnectionManager::file("data.db");
}
