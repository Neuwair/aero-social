export function validateMediaDimensions(file) {
  return new Promise((resolve) => {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      resolve({ isValid: true });
      return;
    }
    const element = isImage ? new Image() : document.createElement("video");
    const url = URL.createObjectURL(file);
    const cleanup = () => {
      URL.revokeObjectURL(url);
      if (isImage) {
        element.onload = null;
        element.onerror = null;
        element.src = "";
      } else {
        element.onloadedmetadata = null;
        element.onerror = null;
        element.src = "";
      }
    };
    const handleSuccess = () => {
      const maxWidth = 2048;
      const maxHeight = 2048;
      const maxPixels = 4194304;
      const width = isImage ? element.width : element.videoWidth;
      const height = isImage ? element.height : element.videoHeight;
      if (width > maxWidth || height > maxHeight) {
        cleanup();
        resolve({
          isValid: false,
          reason: `Media dimensions too large. Maximum: ${maxWidth}x${maxHeight}px`,
        });
        return;
      }
      if (width * height > maxPixels) {
        cleanup();
        resolve({
          isValid: false,
          reason: `Media has too many pixels. Maximum: ${Math.round(
            maxPixels / 1000000
          )}MP`,
        });
        return;
      }
      cleanup();
      resolve({ isValid: true });
    };
    const handleError = () => {
      cleanup();
      resolve({
        isValid: false,
        reason: "Unable to read media file or media is corrupted.",
      });
    };
    if (isImage) {
      element.onload = handleSuccess;
      element.onerror = handleError;
      element.src = url;
    } else {
      element.onloadedmetadata = handleSuccess;
      element.onerror = handleError;
      element.src = url;
    }
  });
}
