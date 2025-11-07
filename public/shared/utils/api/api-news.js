export async function fetchNews(section, limit) {
  const response = await fetch(
    `/.netlify/functions/api-fetchNews?section=${section}&limit=${limit}`
  );
  const data = await response.json();
  return data;
}

function selectElements(prefix, index) {
  const container = document.querySelectorAll(`.${prefix}-nav ul`)[index];
  if (!container) {
    console.warn(`Container not found for prefix: ${prefix}, index: ${index}`);
    return {};
  }

  return {
    titleLink: container.querySelector(`.${prefix}-link`),
    titleText: container.querySelector(`.${prefix}-title`),
    thumbImg: container.querySelector(`.${prefix}-img`),
    paragraph: container.querySelector(`.${prefix}-paragraph`),
  };
}

function updateElementsForArticle(elements, index, article) {
  const { titleLink, titleText, thumbImg, paragraph } = elements;

  if (titleLink && titleText) {
    titleLink.href = article.webUrl;
    titleText.textContent = article.webTitle;
  }

  if (thumbImg && article.fields?.thumbnail) {
    thumbImg.src = article.fields.thumbnail;
    thumbImg.alt = article.webTitle;
  }

  if (paragraph) {
    paragraph.textContent = article.fields?.trailText || "";
  }
}

export async function populateExisting(sectionName, prefix, limit = 4) {
  try {
    const data = await fetchNews(sectionName, limit);

    if (!data.results || data.results.length === 0) {
      console.warn(`No articles found for section: ${sectionName}`);
      return;
    }

    for (let i = 0; i < Math.min(limit, data.results.length); i++) {
      const elements = selectElements(prefix, i);
      updateElementsForArticle(elements, i, data.results[i]);
    }

    console.log(`Successfully populated ${sectionName} news`);
  } catch (error) {
    console.error(`Error populating ${sectionName} news:`, error);
  }
}

export async function displayNewsToExisting() {
  try {
    await Promise.all([
      populateExisting("technology", "tech", 4),
      populateExisting("sport", "sports", 4),
      populateExisting("science", "science", 4),
      populateExisting("business", "business", 4),
    ]);
  } catch (error) {
    console.error("Error displaying news:", error);
  }
}

function initNewsPopulation() {
  const runPopulate = () => {
    requestAnimationFrame(() => {
      displayNewsToExisting();
    });
  };
  if (
    document.querySelector(".tech-nav") ||
    document.querySelector(".news-display")
  ) {
    runPopulate();
    return;
  }

  document.addEventListener(
    "newsInjected",
    () => {
      runPopulate();
    },
    { once: true }
  );

  setTimeout(() => {
    if (
      !document.querySelector(".tech-nav") &&
      !document.querySelector(".news-display")
    ) {
      runPopulate();
    }
  }, 2000);
}

initNewsPopulation();
