function biographyHandler() {
  const bioEditBtn = document.getElementById("bioEdit");
  const bioDisplay = document.getElementById("bioDisplay");
  const bioTextArea = document.getElementById("bioTextArea");
  const bioCancel = document.getElementById("bioTrashCan");
  const bioAccept = document.getElementById("bioAccept");
  const bioStorage = document.getElementById("bioStorage");
  const BIO_KEY = "userBio";
  let isBioOpen = false;

  function loadSavedBio() {
    const savedBio = localStorage.getItem(BIO_KEY);
    if (savedBio) {
      bioStorage.textContent = savedBio;
    }
  }

  function showBioEditor() {
    bioTextArea.value = bioStorage.textContent;
    bioDisplay.classList.add("open");
    isBioOpen = true;
  }

  function cancelBioEdit() {
    bioTextArea.value = "";
    bioDisplay.classList.remove("open");
    isBioOpen = false;
  }

  function acceptBioEdit() {
    const newBio = bioTextArea.value.trim();
    bioStorage.textContent = newBio;
    localStorage.setItem(BIO_KEY, newBio);
    bioDisplay.classList.remove("open");
    isBioOpen = false;
  }

  function setupEventListeners() {
    bioEditBtn.addEventListener("click", showBioEditor);
    bioCancel.addEventListener("click", cancelBioEdit);
    bioAccept.addEventListener("click", acceptBioEdit);
  }
  document.addEventListener("click", (event) => {
    if (
      isBioOpen &&
      !bioDisplay.contains(event.target) &&
      !bioEditBtn.contains(event.target)
    ) {
      cancelBioEdit();
    }
  });

  loadSavedBio();
  setupEventListeners();
}

export { biographyHandler };
