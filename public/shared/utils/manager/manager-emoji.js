export const initEmojiPicker = (triggerBtnId, storageId, textAreaId) => {
  const emojiTrigger = document.getElementById(triggerBtnId);
  const pickerStorage = document.getElementById(storageId);
  const pickerWrapper = pickerStorage?.querySelector(".emoji_wrapper");
  const textArea = document.getElementById(textAreaId);

  if (!emojiTrigger || !pickerStorage || !pickerWrapper || !textArea) return;

  let isOpen = false;

  emojiTrigger.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isOpen) {
      pickerStorage.style.display = "none";
      isOpen = false;
      return;
    }

    pickerStorage.style.display = "flex";
    isOpen = true;

    pickerWrapper.innerHTML = "";

    const picker = new window.EmojiMart.Picker({
      data: async () => {
        const response = await fetch(
          "https://cdn.jsdelivr.net/npm/@emoji-mart/data"
        );
        return response.json();
      },
      set: "native",
      emojiVersion: "14",
      theme: "light",
      onEmojiSelect: (emoji) => {
        textArea.value += emoji.native;
      },
    });

    pickerWrapper.appendChild(picker);
  });

  document.addEventListener("click", (event) => {
    if (
      isOpen &&
      !pickerStorage.contains(event.target) &&
      !emojiTrigger.contains(event.target)
    ) {
      pickerStorage.style.display = "none";
      isOpen = false;
    }
  });
};

export const initEmojiPickerWriter = () =>
  initEmojiPicker("emojiWriterBtn", "emojiStorageWriter", "postTextArea");

export const initEmojiPickerBio = () =>
  initEmojiPicker("emojiBioBtn", "emojiStorageBio", "bioTextArea");
