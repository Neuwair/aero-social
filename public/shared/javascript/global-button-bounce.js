const animationClass = "button-bounce-active";
const animationName = "button-bounce";
let initialized = false;

const isDisabled = (element) => {
  if (element instanceof HTMLButtonElement) {
    return element.disabled;
  }
  const ariaDisabled = element.getAttribute("aria-disabled");
  return ariaDisabled === "true";
};

const findTarget = (source) => {
  if (!(source instanceof Element)) {
    return null;
  }
  return source.closest("button, [role='button']");
};

const triggerAnimation = (element) => {
  element.classList.remove(animationClass);
  void element.offsetWidth;
  element.classList.add(animationClass);
};

const handleClick = (event) => {
  const target = findTarget(event.target);
  if (!target) {
    return;
  }
  if (isDisabled(target)) {
    return;
  }
  triggerAnimation(target);
};

const handleAnimationEnd = (event) => {
  if (event.animationName !== animationName) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  if (target.classList.contains(animationClass)) {
    target.classList.remove(animationClass);
  }
};

const initGlobalButtonBounce = () => {
  if (initialized) {
    return;
  }
  if (typeof document === "undefined") {
    return;
  }
  document.addEventListener("click", handleClick);
  document.addEventListener("animationend", handleAnimationEnd);
  initialized = true;
};

export { initGlobalButtonBounce };
