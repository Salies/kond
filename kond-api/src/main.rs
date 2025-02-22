mod db;
mod model;
mod service;

use actix_cors::Cors;
use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use dotenv::dotenv;
use model::SteamPlayers;
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;

// upload match
#[post("/upload")]
async fn upload_data(
    data: web::Json<model::MatchData>,
    pool: web::Data<Pool<SqliteConnectionManager>>,
) -> impl Responder {
    let mut conn = pool.get().expect("Failed to get DB connection");

    match service::insert_match(&mut *conn, &data) {
        // Explicit mutable borrow
        Ok(result) => HttpResponse::Ok().json(result),
        Err(e) => {
            eprintln!("Database error: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

// retrieve match by id
#[get("/matches/{match_id}")]
async fn retrieve_match(
    path: web::Path<String>,
    pool: web::Data<Pool<SqliteConnectionManager>>,
) -> impl Responder {
    let mut conn = pool.get().expect("Failed to get DB connection");
    let match_id = path.into_inner();

    match service::retrieve_match_by_id(&mut *conn, &match_id) {
        Ok(result) => HttpResponse::Ok().json(result),
        Err(e) => {
            eprintln!("Database error: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

// try to retrieve match id by demo hash
#[get("/demo/{demo_hash}")]
async fn retrieve_match_id_by_file_hash(
        path: web::Path<String>,
        pool: web::Data<Pool<SqliteConnectionManager>>,
    ) -> impl Responder {

    let mut conn = pool.get().expect("Failed to get DB connection");
    let demo_hash = path.into_inner();

    match service::retrieve_match_id_by_file_hash(&mut *conn, &demo_hash) {
        Ok(result) => HttpResponse::Ok().json(result),
        Err(e) => {
            eprintln!("Database error: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

// get players data from Steam
#[post("/players")]
async fn get_players_from_steam_endpoint(players: web::Json<SteamPlayers>) -> impl Responder {
    match service::get_players_from_steam(&players).await {
        Ok(result) => HttpResponse::Ok().json(result),
        Err(e) => {
            eprintln!("Steam API error: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    let db_url = "data.db";
    let manager = db::init_db(db_url);
    let pool = Pool::new(manager).expect("Failed to create pool");
    let pool_wrapped = web::Data::new(pool);

    HttpServer::new(move || {
        App::new()
            .wrap(
                Cors::default()
                    .allow_any_origin() // Allows requests from any origin (for development)
                    .allow_any_method()
                    .allow_any_header(),
            )
            .app_data(pool_wrapped.clone()) // Pass the connection pool
            .service(upload_data)
            .service(retrieve_match)
            .service(get_players_from_steam_endpoint)
            .service(retrieve_match_id_by_file_hash)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
