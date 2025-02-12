mod db;
mod model;
mod service;

use actix_web::{post, web, App, HttpResponse, HttpServer, Responder};
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;

#[post("/upload")]
async fn upload_data(
    data: web::Json<model::MatchDataIn>, 
    pool: web::Data<Pool<SqliteConnectionManager>>
) -> impl Responder {
    let mut conn = pool.get().expect("Failed to get DB connection");

    match service::insert_match(&mut *conn, &data) { // Explicit mutable borrow
        Ok(result) => HttpResponse::Ok().json(result),
        Err(e) => {
            eprintln!("Database error: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let db_url = "data.db";
    let manager = db::init_db(db_url);
    let pool = Pool::new(manager).expect("Failed to create pool");
    let pool_wrapped = web::Data::new(pool);

    HttpServer::new(move || {
        App::new()
            .app_data(pool_wrapped.clone()) // Pass the connection pool
            .service(upload_data)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
