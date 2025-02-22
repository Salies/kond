const goat = document.getElementById("goat");

const goats = [
    "7998/s1mple",
    "21167/donk",
    "2023/fallen",
    "7592/device",
    "11893/zywoo",
    "3055/flusha",
    // "3741/niko", nik0la 0 major
  ];
  
  const randomGoat = goats[Math.floor(Math.random() * goats.length)];
  goat.href = `https://www.hltv.org/player/${randomGoat}`;