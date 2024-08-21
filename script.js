let selectedColor = "000000"; // Default color

document.querySelectorAll(".c-option--hidden").forEach((input) => {
  console.log("Adding event listener to input:", input); // Debug log
  input.addEventListener("change", function () {
    console.log("Input changed:", this); // Debug log
    if (this.checked) {
      selectedColor = this.getAttribute("data-color").substring(1);
      console.log("Selected color:", selectedColor);
      fetchArtworksByColor(selectedColor);
    }
  });
});

document.getElementById("time-period").addEventListener("change", function () {
  const selectedPeriod = this.value;
  console.log("Selected period:", selectedPeriod); // Debug log
  if (selectedPeriod == 0) {
    fetchArtworksByColor(selectedColor);
  } else {
    fetchArtworksByPeriodAndColor(selectedPeriod, selectedColor);
  }
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

  // Zorg ervoor dat de grid-items goed passen
  imagesLoaded(container, resizeAllGridItems);
}

function resizeAllGridItems() {
  const allItems = document.querySelectorAll(".c-artwork");
  allItems.forEach((item) => {
    resizeGridItem(item);
  });
}

function resizeGridItem(item) {
  const grid = document.querySelector(".c-artwork-container");
  const rowHeight = parseInt(
    window.getComputedStyle(grid).getPropertyValue("grid-auto-rows")
  );
  const rowGap = parseInt(
    window.getComputedStyle(grid).getPropertyValue("grid-row-gap")
  );
  const rowSpan = Math.ceil(
    (item.querySelector("img").getBoundingClientRect().height +
      item.querySelector(".c-artwork-title").getBoundingClientRect().height +
      rowGap) /
      (rowHeight + rowGap)
  );
  item.style.gridRowEnd = "span " + rowSpan;
}

window.addEventListener("resize", resizeAllGridItems);

function imagesLoaded(container, callback) {
  const images = container.querySelectorAll("img");
  let loaded = 0;

  images.forEach((image) => {
    if (image.complete) {
      loaded++;
      if (loaded === images.length) callback();
    } else {
      image.addEventListener("load", () => {
        loaded++;
        if (loaded === images.length) callback();
      });
    }
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
const allowedColors = ["#261808", "#3E2A1C", "#595145"];
applyColorFilter(
  "https://lh3.googleusercontent.com/SsEIJWka3_cYRXXSE8VD3XNOgtOxoZhqW1uB6UFj78eg8gq3G4jAqL4Z_5KwA12aD7Leqp27F653aBkYkRBkEQyeKxfaZPyDx0O8CzWg=w800",
  allowedColors
);
