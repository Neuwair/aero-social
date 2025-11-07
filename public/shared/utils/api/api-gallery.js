function enableGalleryNavigation() {
  const imagesPerPage = 4;

  const viewGalleryBtn = document.getElementById("viewGalleryBtn");
  const closeGalleryBtn = document.getElementById("closeGalleryBtn");
  const galleryDisplay = document.querySelector(".gallery-display");
  const mediaStorageGallery = document.querySelector(".mediaStorageGallery");
  const leftBtn = document.getElementById("leftBtn");
  const rightBtn = document.getElementById("rightBtn");

  if (
    !viewGalleryBtn ||
    !closeGalleryBtn ||
    !galleryDisplay ||
    !mediaStorageGallery ||
    !leftBtn ||
    !rightBtn
  ) {
    console.warn("Gallery elements not found - skipping gallery setup.");
    return;
  }

  let allImages = [];
  let currentIndex = 0;

  setupGalleryButtons();

  const galleryErrorMatchers = [
    {
      match: (msg) => msg.includes("NetworkError"),
      message: "Network error. Please check your connection.",
    },
    {
      match: (msg) => msg.includes("timeout"),
      message: "Request timed out. Please try again.",
    },
    {
      match: (msg) => msg.includes("No images found"),
      message: "<p>No images found</p>",
    },
  ];

  async function fetchFoodImages() {
    try {
      const response = await fetch(
        `/.netlify/functions/api-fetchGallery?q=food&per_page=30`
      );
      const data = await response.json();
      if (data.hits && data.hits.length > 0) {
        allImages = data.hits;
      } else {
        let errorMsg = "No images found";
        let displayMsg = "<p>No images found</p>";
        for (const matcher of galleryErrorMatchers) {
          if (matcher.match(errorMsg)) {
            displayMsg = matcher.message;
            break;
          }
        }
        mediaStorageGallery.innerHTML = displayMsg;
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      let errorMsg =
        error.message || "Failed to load images. Please try again later.";
      let displayMsg = "<p>Failed to load images. Please try again later.</p>";
      for (const matcher of galleryErrorMatchers) {
        if (matcher.match(errorMsg)) {
          displayMsg = `<p>${matcher.message}</p>`;
          break;
        }
      }
      mediaStorageGallery.innerHTML = displayMsg;
    }
  }

  function renderImages() {
    const slice = allImages.slice(currentIndex, currentIndex + imagesPerPage);
    mediaStorageGallery.innerHTML = slice
      .map(
        (img) =>
          `<img src="${img.webformatURL}" alt="${img.tags}" loading="lazy">`
      )
      .join("");
  }

  function setupGalleryButtons() {
    viewGalleryBtn.addEventListener("click", async () => {
      galleryDisplay.classList.add("active");
      if (allImages.length === 0) {
        await fetchFoodImages();
        renderImages();
      }
    });

    closeGalleryBtn.addEventListener("click", () => {
      galleryDisplay.classList.remove("active");
    });

    leftBtn.addEventListener("click", () => {
      if (currentIndex >= imagesPerPage) {
        currentIndex -= imagesPerPage;
        renderImages();
      }
    });

    rightBtn.addEventListener("click", () => {
      if (currentIndex + imagesPerPage < allImages.length) {
        currentIndex += imagesPerPage;
        renderImages();
      }
    });
  }

  document.addEventListener("mousedown", (e) => {
    if (
      galleryDisplay.classList.contains("active") &&
      !galleryDisplay.contains(e.target) &&
      e.target !== viewGalleryBtn
    ) {
      galleryDisplay.classList.remove("active");
    }
  });
}

export { enableGalleryNavigation };
