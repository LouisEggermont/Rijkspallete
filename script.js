let selectedColor = "E09714"; // Default color
let applyFilter = false; // Default: Do not apply filter
let currentPage = 1; // Track the current page
let currentPeriod = 0;
let colorChartInstance = null;

// Update the filter status when checkbox changes
document.getElementById("apply-filter").addEventListener("change", function () {
  applyFilter = this.checked;
  console.log("Apply Filter:", applyFilter); // Debug log
  resizeAllGridItems();

  currentPage = 1;
  fetchArtworksByColor(selectedColor, true);
});

document.querySelectorAll(".c-option--hidden").forEach((input) => {
  input.addEventListener("change", function () {
    if (this.checked) {
      selectedColor = this.getAttribute("data-color").substring(1);
      currentPage = 1;
      fetchArtworksByColor(selectedColor, true);
      console.log("Selected Color:", selectedColor); // Debug log
    }
  });
});

document.getElementById("time-period").addEventListener("change", function () {
  currentPeriod = this.value;
  currentPage = 1;
  if (currentPeriod == 0) {
    fetchArtworksByColor(selectedColor, true);
  } else {
    fetchArtworksByPeriodAndColor(currentPeriod, selectedColor, true);
  }
});

function fetchArtworksByColor(hexColor, replace = false) {
  const apiKey = "sNp968L7"; // Replace with your actual API key
  const url = `https://www.rijksmuseum.nl/api/en/collection?key=${apiKey}&format=json&f.normalized32Colors.hex=%23${hexColor}&imgonly=True&p=${currentPage}&ps=10`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      displayArtworks(data.artObjects, replace);
    })
    .catch((error) => {
      console.error("Error fetching artworks:", error);
    });
}

function fetchArtworksByPeriodAndColor(period, hexColor, replace = false) {
  const apiKey = "sNp968L7"; // Replace with your actual API key
  const url = `https://www.rijksmuseum.nl/api/en/collection?key=${apiKey}&format=json&f.dating.period=${period}&f.normalized32Colors.hex=%23${hexColor}&imgonly=True&p=${currentPage}&ps=10`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      displayArtworks(data.artObjects, replace);
    })
    .catch((error) => console.error("Error fetching artworks:", error));
}

function fetchArtworkDetails(objectNumber, image) {
  const apiKey = "sNp968L7"; // Replace with your actual API key
  const url = `https://www.rijksmuseum.nl/api/en/collection/${objectNumber}?key=${apiKey}&format=json`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      // console.log("Artwork Details:", data); // Debug
      const artwork = data.artObject;
      // console.log("Artwork:", artwork); // Debug

      // document.querySelector(".modal-details").innerHTML = `
      //   <h2>${artwork.title}</h2>
      //   <p>${artwork.principalOrFirstMaker}, ${artwork.dating.sortingDate} </p>
      //   <p>${artwork.description || "No description available."}</p>
      //   <canvas id="colorChart"></canvas>
      // `;
      document.querySelector(".modal-details").innerHTML = `
        <h2>${artwork.title}</h2>
        <p>${artwork.principalOrFirstMaker}, ${artwork.dating.sortingDate} </p>
        <canvas id="colorChart"></canvas>
      `;
      const colors = data.artObject.colors.map((color) => color.hex);
      const percentages = data.artObject.colors.map(
        (color) => color.percentage
      );
      console.log(document.getElementById("colorChart"));
      createColorChart(colors, percentages);

      console.log(image);
      openModal(image);
    })
    .catch((error) => console.error("Error fetching artwork details:", error));
}

function displayArtworks(artworks, replace = false) {
  const container = document.getElementById("artwork-container");
  if (replace) container.innerHTML = "";

  artworks.forEach((artwork) => {
    const button = document.createElement("button");
    button.classList.add("c-artwork");
    button.setAttribute("id", artwork.objectNumber);
    button.setAttribute("aria-label", `View details of ${artwork.title}`);
    button.addEventListener("click", () =>
      handleImageClick(button.querySelector("canvas"))
    );
    button.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        handleImageClick(button.querySelector("canvas"));
      }
    });

    const canvas = document.createElement("canvas");
    canvas.classList.add("filtered-artwork", "artwork-thumbnail", "thumbnail");
    canvas.setAttribute("data-thumbID", artwork.objectNumber);
    canvas.setAttribute("view-transition-name", "artwork-image");

    const title = document.createElement("p");
    title.classList.add("c-artwork-title");
    title.textContent = artwork.title;

    button.appendChild(canvas);
    button.appendChild(title);
    button.classList.add("o-button-reset");
    container.appendChild(button);

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

  const canvas = item.querySelector("canvas");
  const title = item.querySelector(".c-artwork-title");

  if (canvas && title) {
    // Check if both elements exist
    const rowSpan = Math.ceil(
      (canvas.getBoundingClientRect().height +
        title.getBoundingClientRect().height +
        rowGap) /
        (rowHeight + rowGap)
    );
    item.style.gridRowEnd = "span " + rowSpan;
  }
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

document.getElementById("load-more").addEventListener("click", function () {
  currentPage++; // Increment the page number
  if (currentPeriod == 0) {
    fetchArtworksByColor(selectedColor);
  } else {
    fetchArtworksByPeriodAndColor(currentPeriod, selectedColor);
  }
});

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

const thumbs = document.querySelectorAll(".thumbnail");
const modal = document.querySelector(".modal");
const modalImgContainer = document.querySelector(".modal-img");

// thumbs.forEach((thumb) => {
//   thumb.addEventListener("click", (e) => {
//     const image = e.target;

//     // Set the viewTransitionName to the selected image
//     image.style.viewTransitionName = "artwork-image";

//     document.startViewTransition(() => {
//       openModal(image);
//     });
//   });
// });
function handleImageClick(image) {
  const objectNumber = image.getAttribute("data-thumbID");
  image.style.viewTransitionName = "artwork-image";

  // Start the view transition first
  document.startViewTransition(() => {
    // Open the modal with a loading state
    openModal(image, true);

    // Fetch the artwork details asynchronously
    fetchArtworkDetails(objectNumber, image);
  });
}

thumbs.forEach((thumb) => {
  thumb.addEventListener("click", (e) => {
    handleImageClick(e.target);
  });
});

function openModal(image) {
  const modal = document.querySelector(".modal");
  const modalImgContainer = document.querySelector(".modal-img");
  modalImgContainer.appendChild(image); // Move the image to the modal
  modal.classList.add("visible");
  modal.classList.remove("hidden");
}

function closeModal(image) {
  const galleryParentID = image.getAttribute("data-thumbID");
  const galleryParent = document.getElementById(galleryParentID);

  if (galleryParent) {
    galleryParent.appendChild(image); // Move the image back to its original location
  }

  const modal = document.querySelector(".modal");
  modal.classList.add("hidden");
  modal.classList.remove("visible");

  // modalImgContainer.innerHTML = "";
  document.querySelector(".modal-details").innerHTML =
    '<canvas id="colorChart"></canvas>';

  // Remove the viewTransitionName after the transition
  image.style.viewTransitionName = "";
}

document.querySelector(".modal").addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    const image = document.querySelector(".modal-img canvas");
    document.startViewTransition(() => {
      closeModal(image);
    });
  }
});

document.addEventListener("keydown", (e) => {
  if (
    e.key === "Escape" &&
    document.querySelector(".modal").classList.contains("visible")
  ) {
    const image = document.querySelector(".modal-img canvas");
    document.startViewTransition(() => {
      closeModal(image);
    });
  }
});

function createColorChart(colors, percentages) {
  console.log(document.getElementById("colorChart"));
  const ctx = document.getElementById("colorChart").getContext("2d");

  if (colorChartInstance) {
    colorChartInstance.destroy();
  }

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
      responsive: false,
      plugins: {
        legend: {
          position: "right",
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
