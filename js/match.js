const $ = document.querySelector.bind(document);

const matchId = new URLSearchParams(window.location.search).get("id");
if(!matchId) {
    window.location.href = "/";
}

console.log(matchId)

fetch(`http://127.0.0.1:8080/matches/${matchId}`).then(response => {
    if(response.ok) {
        return response.json();
    } else {
        throw new Error("Failed to fetch match data");
    }
}).then(match => {
    console.log(match)

    $("#match-id").innerText = matchId;
    $("#file-hash").innerText = match.file_hash;

    $("#map-name").innerText = match.map;

    $("#team-a-score").innerText = match.team_a_score;
    $("#team-b-score").innerText = match.team_b_score;

    
}).catch(error => {
    console.error(error);
    //window.location.href = "/";
});