const fileArea = document.getElementsByClassName("file-area")[0];
const fileInput = document.getElementById("demoFile");
const insertFileArea = document.getElementById("insert-file-area");
const loadingBar = document.getElementById("loading-bar");

let fileAreaDragOver = false;

function showErrorToast() {
  loadingBar.classList.add("hidden");
  fileArea.classList.remove("hidden");
  insertFileArea.classList.remove("hidden");

  Toastify({
    text: "Error parsing demo.",
    duration: 3000,
    close: true,
    gravity: "top",
    position: "center",
    style: {
      background: "#FF5555",
    },
  }).showToast();
}

function parsingDemoToast() {
  // show loading bar
  loadingBar.classList.remove("hidden");
  insertFileArea.classList.add("hidden");
  fileArea.classList.add("hidden");

  Toastify({
    text: "Parsing demo. Please wait...",
    duration: 5000,
    close: true,
    gravity: "top",
    position: "center",
    style: {
      background: "#FFB86C",
    },
  }).showToast();
}

function parsingSuccessToast() {
  loadingBar.classList.add("hidden");

  Toastify({
    text: "Demo processed successfully! Redirecting...",
    duration: 10000,
    close: true,
    gravity: "top",
    position: "center",
    style: {
      background: "#50FA7B",
    },
  }).showToast();
}

async function processFile(file) {
  parsingDemoToast();
  // wait 1.5 seconds to show the toast
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    hashwasm.md5(data).then((hash) => {
      // check if demo was already parsed
      fetch(`${BASE_URL}/demo/${hash}`)
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("Failed to fetch demo data");
          }
        })
        .then((data) => {
          const matchId = data.id;
          // redirect to /match?id=matchId
          window.location.href = `/match.html?id=${matchId}`;
        });
      // no need to catch error, we just proceed to parse the demo

      let demoData;
      try {
        demoData = parseDemo(data);
      } catch (e) {
        console.error("Error parsing demo:", e);
        showErrorToast();
        return;
      }
      demoData.file_hash = hash;
      const body = JSON.stringify(demoData);

      fetch(`${BASE_URL}/upload`, {
        method: "POST",
        body: body,
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.text())
        .then((text) => {
          return JSON.parse(text);
        })
        .then((data) => {
          parsingSuccessToast();
          console.log("Parsed JSON:", data);
          const matchId = data.id;
          // redirect to /match?id=matchId
          window.location.href = `/match.html?id=${matchId}`;
        })
        .catch((error) => {
          console.error("API Error:", error);
          showErrorToast();
        });
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
