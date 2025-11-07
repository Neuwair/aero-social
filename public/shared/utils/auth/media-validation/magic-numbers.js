export function validateMediaMagicNumbers(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      const uint8Array = new Uint8Array(arrayBuffer);
      const header = Array.from(uint8Array.slice(0, 12))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      const magicNumbers = {
        ffd8ff: "image/jpeg",
        "89504e47": "image/png",
        47494638: "image/gif",
        "424d": "image/bmp",
        52494646: "video/avi",
        "000001ba": "video/mpeg",
        "000001b3": "video/mpeg",
        66747970: "video/mp4",
        "1a45dfa3": "video/mkv",
        fff1: "audio/aac",
        fff9: "audio/aac",
        494433: "audio/mp3",
      };
      const detectedType = Object.keys(magicNumbers).find((magic) =>
        header.startsWith(magic.toLowerCase())
      );
      if (!detectedType) {
        resolve({
          isValid: false,
          reason: "File signature not recognized or file may be corrupted.",
        });
        return;
      }
      const expectedMimeType = magicNumbers[detectedType];
      if (!file.type.startsWith(expectedMimeType.split("/")[0])) {
        resolve({
          isValid: false,
          reason: "File signature does not match declared file type.",
        });
        return;
      }
      resolve({ isValid: true });
    };
    reader.onerror = () => {
      resolve({
        isValid: false,
        reason: "Unable to read file for validation.",
      });
    };
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}
