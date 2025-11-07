function showAlert(element, message) {
  if (!element) {
    console.warn("Cannot show alert: element is undefined");
    return;
  }
  element.innerHTML = message;
  element.style.display = "flex";
}

function hideAlert(element) {
  if (!element) {
    console.warn("Cannot hide alert: element is undefined");
    return;
  }
  element.innerHTML = "";
  element.style.display = "none";
}

export { showAlert, hideAlert };
