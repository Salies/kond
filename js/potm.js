const keyNames = {
  kpr: "KPR",
  dpr: "DPR",
  adr: "ADR",
  impact: "Impact",
  kast: "KAST",
  rating: "Rating 2.1",
};

function zScore(value, avg, std) {
  return (value - avg) / std;
}

function updatePotm(bestValues, avg, std) {
  // Sample Z-score normalized data (these could be any real Z-scores)
  const data = new Array();
  for (const key in bestValues) {
    data.push(zScore(bestValues[key], avg[key], std[key]));
  }

  const refs = Object.keys(bestValues);

  console.log(data);

  // Get the chart container
  const chart = document.getElementById("chart");
  const legend = document.getElementById("legend");
  const legendNames = document.getElementById("legend-names");

  // Find the max absolute Z-score to scale bars properly
  const maxAbsZ = Math.max(...data.map(Math.abs));

  let i = 0;
  // Generate bars dynamically
  data.forEach((value) => {
    const bar = document.createElement("div");
    bar.classList.add("bar");

    const realValue = bestValues[refs[i]];
    let vPrint = realValue.toFixed(2);
    if (refs[i] == "kast") vPrint = (realValue * 100).toFixed(1) + "%";
    if (refs[i] == "adr") vPrint = realValue.toFixed(1);

    if (refs[i] !== "dpr") {
      if (realValue < avg[refs[i]] - std[refs[i]]) {
        bar.classList.add("potm-bad");
      } else if (realValue > avg[refs[i]] + std[refs[i]]) {
        bar.classList.add("potm-verygood");
      }
    } else {
      if (realValue > avg[refs[i]] - std[refs[i]]) {
        bar.classList.add("potm-bad");
      } else if (realValue < avg[refs[i]] + std[refs[i]]) {
        bar.classList.add("potm-verygood");
      }
    }

    const legendName = document.createElement("span");
    legendName.innerText = keyNames[refs[i]];
    legendNames.appendChild(legendName);

    // Normalize height (Z-scores centered at zero)
    const barHeight = (Math.abs(value) / maxAbsZ) * 100; // Scale to fit container

    // Position bars (positive values go up, negative values go down)
    bar.style.height = `${barHeight}%`;
    bar.style.transform = `translateY(${value < 0 ? 100 - barHeight : 0}%)`; // Push negative bars downward

    const legendBar = document.createElement("div");
    legendBar.style.height = `${barHeight}%`;
    legendBar.style.transform = `translateY(${
      value < 0 ? 100 - barHeight : 0
    }%)`;
    legendBar.innerHTML = `<span>${vPrint}</span>`;

    // Append to chart
    chart.appendChild(bar);
    legend.appendChild(legendBar);

    i++;
  });
}
