let selectedColor = "E09714"; // Default color
let applyFilter = false; // Default: Do not apply filter

// Update the filter status when checkbox changes
document.getElementById("apply-filter").addEventListener("change", function () {
  applyFilter = this.checked;
  console.log("Apply Filter:", applyFilter); // Debug log
  resizeAllGridItems();
  // Refetch and display artworks with/without filter
  if (applyFilter) {
    fetchArtworksByColor(selectedColor);
  } else {
    fetchArtworksByColor(selectedColor);
  }
});

document.querySelectorAll(".c-option--hidden").forEach((input) => {
  input.addEventListener("change", function () {
    if (this.checked) {
      selectedColor = this.getAttribute("data-color").substring(1);
      fetchArtworksByColor(selectedColor);
      console.log("Selected Color:", selectedColor); // Debug log
    }
  });
});

document.getElementById("time-period").addEventListener("change", function () {
  const selectedPeriod = this.value;
  if (selectedPeriod == 0) {
    fetchArtworksByColor(selectedColor);
  } else {
    fetchArtworksByPeriodAndColor(selectedPeriod, selectedColor);
  }
});

function fetchArtworksByColor(hexColor) {
  const apiKey = "sNp968L7"; // Replace with your actual API key
  const url = `https://www.rijksmuseum.nl/api/en/collection?key=${apiKey}&format=json&f.normalized32Colors.hex=%23${hexColor}&imgonly=True`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      displayArtworks(data.artObjects);
    })
    .catch((error) => {
      console.error("Error fetching artworks:", error);
    });
}

function fetchArtworksByPeriodAndColor(period, hexColor) {
  const apiKey = "sNp968L7"; // Replace with your actual API key
  const url = `https://www.rijksmuseum.nl/api/en/collection?key=${apiKey}&format=json&f.dating.period=${period}&f.normalized32Colors.hex=%23${hexColor}&imgonly=True`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
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

    const canvas = document.createElement("canvas");
    canvas.classList.add("filtered-artwork");
    artworkDiv.appendChild(canvas);

    const title = document.createElement("p");
    title.classList.add("c-artwork-title");
    title.textContent = artwork.title;

    artworkDiv.appendChild(title);
    container.appendChild(artworkDiv);

    if (applyFilter) {
      applySingleColorFilter(
        artwork.webImage.url,
        `#${selectedColor}`,
        75,
        canvas
      );
    } else {
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resizeAllGridItems(); // Ensure grid items resize correctly
      };
      img.src = artwork.webImage.url;
    }
  });

  imagesLoaded(container, resizeAllGridItems);
}

function applySingleColorFilter(
  imageUrl,
  selectedColor,
  tolerance = 30,
  canvas
) {
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.crossOrigin = "Anonymous"; // Prevent CORS issues

  img.onload = function () {
    // Set the canvas size to match the image size
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the image onto the canvas
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const [targetR, targetG, targetB] = hexToRgb(selectedColor);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (
        Math.abs(r - targetR) > tolerance ||
        Math.abs(g - targetG) > tolerance ||
        Math.abs(b - targetB) > tolerance
      ) {
        const avg = (r + g + b) / 3;
        data[i] = avg; // Red
        data[i + 1] = avg; // Green
        data[i + 2] = avg; // Blue
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Trigger a grid layout recalculation after the filter is applied
    resizeAllGridItems();
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
    (item.querySelector("canvas").getBoundingClientRect().height +
      item.querySelector(".c-artwork-title").getBoundingClientRect().height +
      rowGap) /
      (rowHeight + rowGap)
  );
  item.style.gridRowEnd = "span " + rowSpan;
}

function imagesLoaded(container, callback) {
  const images = container.querySelectorAll("canvas");
  let loaded = 0;
  if (images.length === 0) {
    callback();
  }
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

window.addEventListener("resize", resizeAllGridItems);

document.addEventListener("DOMContentLoaded", function () {
  // Select a random radio button
  const radioButtons = document.querySelectorAll('input[name="color"]');
  const randomIndex = Math.floor(Math.random() * radioButtons.length);
  const randomRadio = radioButtons[randomIndex];

  // Set the selected color based on the random radio button
  selectedColor = randomRadio.getAttribute("data-color").substring(1);

  // Check the random radio button
  randomRadio.checked = true;

  // Trigger the change event to load artworks for the selected color
  randomRadio.dispatchEvent(new Event("change"));

  // Recalculate grid layout after all content is loaded
  imagesLoaded(
    document.getElementById("artwork-container"),
    resizeAllGridItems
  );
});
