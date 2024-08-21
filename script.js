let selectedColor = "000000"; // Default color

document.querySelectorAll(".c-option--hidden").forEach((input) => {
  console.log("Adding event listener to input:", input); // Debug log
  input.addEventListener("change", function () {
    console.log("Input changed:", this); // Debug log
    if (this.checked) {
      const label = this.nextElementSibling;
      const bgColor = window.getComputedStyle(label).backgroundColor;
      const borderColor = getContrastColor(bgColor);
      label.style.border = `4px solid ${borderColor}`;

      selectedColor = this.getAttribute("data-color").substring(1);
      console.log("Selected color:", selectedColor);
      fetchArtworksByColor(selectedColor);
    }
  });
});

document.getElementById("time-period").addEventListener("change", function () {
  const selectedPeriod = this.value;
  console.log("Selected period:", selectedPeriod); // Debug log
  fetchArtworksByPeriodAndColor(selectedPeriod, selectedColor);
});

function getContrastColor(bgColor) {
  const rgb = bgColor.match(/\d+/g);
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return luminance > 0.5 ? "black" : "white";
}

function fetchArtworksByColor(hexColor) {
  const apiKey = "sNp968L7"; // Replace with your actual API key
  const url = `https://www.rijksmuseum.nl/api/en/collection?key=${apiKey}&format=json&f.normalized32Colors.hex=%23${hexColor}&imgonly=True`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      console.log("Fetched artworks:", data.artObjects); // Debug log
      displayArtworks(data.artObjects);
    })
    .catch((error) => {
      console.error("Error fetching artworks:", error);
    });
}

function fetchArtworkData(objectNumber) {
  const apiKey = "sNp968L7"; // Vervang dit door je eigen API-sleutel
  const url = `https://www.rijksmuseum.nl/api/nl/collection/${objectNumber}?key=${apiKey}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      const colors = data.artObject.colors.map((color) => color.hex);
      const percentages = data.artObject.colors.map(
        (color) => color.percentage
      );
      createColorChart(colors, percentages);
    })
    .catch((error) => console.error("Error fetching artwork data:", error));
}

function fetchArtworksByPeriodAndColor(period, hexColor) {
  const apiKey = "sNp968L7"; // Replace with your actual API key
  const url = `https://www.rijksmuseum.nl/api/en/collection?key=${apiKey}&format=json&f.dating.period=${period}&f.normalized32Colors.hex=%23${hexColor}&imgonly=True`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      console.log("Fetched artworks:", data.artObjects); // Debug log
      displayArtworks(data.artObjects);
    })
    .catch((error) => console.error("Error fetching artworks:", error));
}

function displayArtworks(artworks) {
  const container = document.getElementById("artwork-container");
  container.innerHTML = ""; // Clear previous results

  // const colorDistribution = calculateColorDistribution(artworks);

  // visualizeColorDistribution(colorDistribution);

  artworks.forEach((artwork) => {
    const artworkDiv = document.createElement("div");
    artworkDiv.classList.add("c-artwork");

    const img = document.createElement("img");
    img.src = artwork.webImage.url;
    img.alt = artwork.title;

    const title = document.createElement("p");
    title.classList.add("c-artwork-title");
    title.textContent = artwork.title;

    artworkDiv.appendChild(img);
    artworkDiv.appendChild(title);
    container.appendChild(artworkDiv);
  });
}

// function calculateColorDistribution(artworks) {
//   const colorMap = {};
//   artworks.forEach((artwork) => {
//     if (artwork.colors && Array.isArray(artwork.colors)) {
//       artwork.colors.forEach((color) => {
//         colorMap[color] = (colorMap[color] || 0) + 1;
//       });
//     } else {
//       console.warn("Artwork has no colors or colors is not an array:", artwork); // Debug log
//     }
//   });
//   return colorMap;
// }

// function visualizeColorDistribution(colorMap) {
//   const ctx = document
//     .getElementById("colorDistributionChart")
//     .getContext("2d");
//   new Chart(ctx, {
//     type: "pie",
//     data: {
//       labels: Object.keys(colorMap),
//       datasets: [
//         {
//           data: Object.values(colorMap),
//           backgroundColor: Object.keys(colorMap),
//         },
//       ],
//     },
//     options: {
//       responsive: true,
//       plugins: {
//         legend: {
//           position: "top",
//         },
//         tooltip: {
//           callbacks: {
//             label: function (tooltipItem) {
//               return `${tooltipItem.label}: ${tooltipItem.raw}`;
//             },
//           },
//         },
//       },
//     },
//   });
// }
function createColorChart(colors, percentages) {
  const ctx = document.getElementById("colorChart").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: colors, // Kleuren als labels
      datasets: [
        {
          data: percentages, // Percentage per kleur
          backgroundColor: colors, // Kleuren gebruiken als achtergrondkleur
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return `${tooltipItem.label}: ${tooltipItem.raw}%`;
            },
          },
        },
      },
    },
  });
}

fetchArtworkData("SK-C-5");

function applyColorFilter(imageUrl, allowedColors, tolerance = 30) {
  const canvas = document.getElementById("filteredArtwork");
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.crossOrigin = "Anonymous"; // Om CORS-problemen te voorkomen

  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      let matchFound = false;

      for (const color of allowedColors) {
        const [allowedR, allowedG, allowedB] = hexToRgb(color);
        if (
          Math.abs(r - allowedR) <= tolerance &&
          Math.abs(g - allowedG) <= tolerance &&
          Math.abs(b - allowedB) <= tolerance
        ) {
          matchFound = true;
          break;
        }
      }

      if (!matchFound) {
        // Dim non-matching colors (e.g., convert to grayscale)
        const avg = (r + g + b) / 3;
        data[i] = avg; // Red
        data[i + 1] = avg; // Green
        data[i + 2] = avg; // Blue
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  img.src = imageUrl;
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.substring(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

// Test de functie met een afbeelding en kleuren
const allowedColors = ["#261808", "#3E2A1C", "#595145"]; // Top 3 dominante kleuren
applyColorFilter(
  "https://lh3.googleusercontent.com/SsEIJWka3_cYRXXSE8VD3XNOgtOxoZhqW1uB6UFj78eg8gq3G4jAqL4Z_5KwA12aD7Leqp27F653aBkYkRBkEQyeKxfaZPyDx0O8CzWg=w800",
  allowedColors
);
