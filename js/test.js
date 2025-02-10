console.log("sou o teste")


async function run_wasm() {
    await wasm_bindgen('./js/lib/demoparser2_bg.wasm');
    console.log("wasm loaded")

    document.getElementById("demoFile").addEventListener("change", async function(event) {
        const file = event.target.files[0]; // Get the selected file
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = function (event) {
            const data = new Uint8Array(event.target.result);
            const playerSpawns = wasm_bindgen.parseEvent(data, "round_freeze_end");
            console.log(playerSpawns);
        };
    
        reader.readAsArrayBuffer(file);
    });
}
run_wasm();