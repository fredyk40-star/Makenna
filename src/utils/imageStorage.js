/**
 * Downscale canvas data URLs before persisting them in local storage.
 * Falls back to the original image when canvas is unavailable.
 */
export const createThumbnail = (dataURL, maxWidth = 480, maxHeight = 320, quality = 0.72) => (
  new Promise((resolve) => {
    if (!dataURL || typeof document === 'undefined' || typeof Image === 'undefined') {
      resolve(dataURL || '');
      return;
    }

    const image = new Image();
    let settled = false;
    const finish = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext?.('2d');
        if (!ctx || !image.width || !image.height) {
          finish(dataURL);
          return;
        }

        const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL('image/jpeg', quality));
      } catch (error) {
        finish(dataURL);
      }
    };
    image.onerror = () => finish(dataURL);
    image.src = dataURL;
  })
);

export default createThumbnail;
