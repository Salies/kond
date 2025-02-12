const fileArea = document.getElementsByClassName("file-area")[0];
const fileInput = document.getElementById("demoFile");
let fileAreaDragOver = false;

async function processFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    hashwasm.md5(data).then((hash) => {
      console.log("MD5: ", hash);
      let demoData = parseDemo(data);
      demoData.file_hash = hash;
      const body = JSON.stringify(demoData);

      console.log("Enviando...");
      fetch("http://127.0.0.1:8080/upload", {
        method: "POST",
        body: body,
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.text()) // Read as text instead of JSON
        .then((text) => {
          console.log("Raw response:", text);
          return JSON.parse(text); // Try parsing manually
        })
        .then((data) => {
            console.log("Parsed JSON:", data);
            const matchId = data.id;
            // redirect to /match?id=matchId
            window.location.href = `/match?id=${matchId}`;
        })
        .catch((error) => console.error("Error:", error));
    });
  };

  reader.readAsArrayBuffer(file);
}

async function run_wasm() {
  await wasm_bindgen("./js/lib/demoparser2_bg.wasm");
  console.log("wasm loaded");

  fileArea.addEventListener("change", processFile);
}

function dropHandler(ev) {
  ev.preventDefault();
  dragLeaveHandler(ev);

  const file = ev.dataTransfer.files[0];
  if (!file) return;

  console.log("File dropped: ", file.name);
  processFile(file);
}

function dragOverHandler(ev) {
  ev.preventDefault();

  if (fileAreaDragOver) {
    return;
  }

  fileAreaDragOver = true;
  fileArea.classList.add("biggie");
}

function dragLeaveHandler(ev) {
  ev.preventDefault();
  fileAreaDragOver = false;

  fileArea.classList.remove("biggie");
}

run_wasm();
