import { timeObserver } from "../performance/time-observer.js";
import { likeObserver } from "./post-reactions.js";
import { stopNavSimulationForPost } from "../simulation/simulation-posts.js";

function setupDeleteButton(postElement, postURLs, createdURLs) {
  const timeElem = postElement.querySelector(".time-counter-storage-post");
  const deleteBtn = postElement.querySelector(".postTrashCan");
  if (!deleteBtn) return;
  deleteBtn.addEventListener("click", () => {
    postElement.classList.remove("show");
    postElement.style.transform = "translateY(-20px) scale(0.95)";
    postElement.style.opacity = "0";
    setTimeout(() => {
      if (timeElem && timeElem._intervalId) {
        clearInterval(timeElem._intervalId);
        timeElem._intervalId = null;
      }
      if (timeElem) {
        try {
          timeObserver.unobserve(timeElem);
        } catch (e) {}
        try {
          if (likeObserver && typeof likeObserver.unobserve === "function") {
            likeObserver.unobserve(timeElem);
          }
        } catch (e) {}
      }
      if (postElement && postElement._likeSim) {
        try {
          if (postElement._likeSim.timeoutId)
            clearTimeout(postElement._likeSim.timeoutId);
        } catch (e) {}
        postElement._likeSim = null;
      }
      try {
        if (postElement && typeof stopNavSimulationForPost === "function") {
          try {
            stopNavSimulationForPost(postElement);
          } catch (e) {}
        }
      } catch (e) {}
      postURLs.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
        if (Array.isArray(createdURLs)) {
          const index = createdURLs.indexOf(url);
          if (index !== -1) createdURLs.splice(index, 1);
        }
      });
      postElement.remove();
    }, 330);
  });
}

export { setupDeleteButton };
