function addShowClassWithAnimation(element) {
  requestAnimationFrame(() => {
    element.classList.add("show");
  });
}

function removeShowClassWithDelay(element, delay = 330) {
  element.classList.remove("show");
  setTimeout(() => {
    element.style.display = "none";
  }, delay);
}

function animateElementsSequentially(
  elements,
  className = "show",
  delay = 100
) {
  elements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add(className);
    }, index * delay);
  });
}

export {
  addShowClassWithAnimation,
  removeShowClassWithDelay,
  animateElementsSequentially,
};
