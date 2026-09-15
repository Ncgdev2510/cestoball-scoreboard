import { MatchState } from '../types/match';

/**
 * Resizes and compresses an image (File or Base64 Data URL) into a compact Base64 Data URL.
 * Keeps aspect ratio and scales down to maxDim (default 240px).
 */
export async function compressImageBase64(
  input: File | string,
  maxDim = 240,
  quality = 0.8
): Promise<string> {
  let dataUrl: string;

  if (typeof input !== 'string') {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(input);
    });
  } else {
    dataUrl = input;
  }

  if (!dataUrl || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }

  // If already an SVG or extremely small, no need to redraw to canvas
  if (dataUrl.includes('image/svg+xml') || dataUrl.length < 15000) {
    return dataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width <= 0 || height <= 0) {
          return resolve(dataUrl);
        }

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(dataUrl);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first for maximum compression; if it fails or produces empty, use png
        let compressed = canvas.toDataURL('image/webp', quality);
        if (!compressed.startsWith('data:image/webp')) {
          compressed = canvas.toDataURL('image/png');
        }

        // Return compressed only if it is actually smaller
        resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Checks if the state contains oversized logo data (> 40 KB) and compresses it in-place.
 */
export async function sanitizeMatchStateLogos(state: MatchState): Promise<MatchState> {
  const OVERSIZED_LIMIT = 40000;
  let homeLogo = state.home.logo;
  let awayLogo = state.away.logo;
  let changed = false;

  if (homeLogo && homeLogo.length > OVERSIZED_LIMIT) {
    homeLogo = await compressImageBase64(homeLogo, 240, 0.8);
    changed = true;
  }

  if (awayLogo && awayLogo.length > OVERSIZED_LIMIT) {
    awayLogo = await compressImageBase64(awayLogo, 240, 0.8);
    changed = true;
  }

  if (!changed) return state;

  return {
    ...state,
    home: { ...state.home, logo: homeLogo },
    away: { ...state.away, logo: awayLogo },
  };
}

