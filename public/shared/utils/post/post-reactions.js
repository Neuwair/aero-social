import {
  startLikeSimulationForPost,
  startNavSimulationForPost,
  stopLikeSimulationForPost,
  stopNavSimulationForPost,
  updatePostButtonAlignment,
} from "../simulation/simulation-posts.js";

function setupHeartButton(postElement) {
  const heartBtn = postElement.querySelector(".heartPostBtn");
  const heartCounter = postElement.querySelector(".heart-up-counter");
  if (!heartBtn) return;
  let liked = false;
  heartBtn.addEventListener("click", (e) => {
    e.preventDefault();
    liked = !liked;
    try {
      heartBtn.style.transform = "scale(1.2)";
    } catch (e) {}
    heartBtn.classList.toggle("active", liked);
    let count = parseInt(heartCounter.textContent) || 0;
    heartCounter.textContent = liked ? count + 1 : count - 1;
    try {
      updatePostButtonAlignment(postElement);
    } catch (e) {}
    setTimeout(() => {
      try {
        heartBtn.style.transform = "scale(1)";
      } catch (e) {}
    }, 330);
  });
}

const likeObserver = (function createLikeObserver() {
  try {
    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const timeElem = entry.target;
          const postElement = timeElem.closest(".post-display");
          if (!postElement) return;
          if (entry.isIntersecting) {
            startLikeSimulationForPost(postElement, timeElem);
            try {
              startNavSimulationForPost(postElement, timeElem);
            } catch (e) {}
          } else {
            stopLikeSimulationForPost(postElement);
            try {
              stopNavSimulationForPost(postElement);
            } catch (e) {}
          }
        });
      },
      { threshold: 0.1 }
    );
  } catch (e) {
    return {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {},
    };
  }
})();

export { setupHeartButton, likeObserver };
