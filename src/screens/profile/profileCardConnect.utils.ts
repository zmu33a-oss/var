import QRCodeCreator from "qrcode";
import { normalizeAppwriteDisplayVarId } from "../../lib/appwrite";

const QR_ERROR_CORRECTION = "M";

export const VAR_QR_DARK_COLOR = "#111111";
export const VAR_QR_LIGHT_COLOR = "#F8F5ED";
/** Transparent modules — no white plate behind the QR. */
export const VAR_QR_TRANSPARENT_LIGHT = "rgba(255,255,255,0)";
/** Slightly smaller QR on the card after tight crop. */
export const VAR_QR_DISPLAY_SCALE = 0.88;

export function scaleVarQrDisplaySize(baseSize: number): number {
  return Math.max(40, Math.round(baseSize * VAR_QR_DISPLAY_SCALE));
}

type Rgb = { r: number; g: number; b: number };

function parseHexColor(hex: string): Rgb {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function colorDistance(
  r: number,
  g: number,
  b: number,
  target: Rgb,
): number {
  const dr = r - target.r;
  const dg = g - target.g;
  const db = b - target.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function isQrInkPixel(
  r: number,
  g: number,
  b: number,
  light: Rgb,
  dark: Rgb,
): boolean {
  return colorDistance(r, g, b, dark) < colorDistance(r, g, b, light);
}

function isQrBackgroundPixel(
  r: number,
  g: number,
  b: number,
  light: Rgb,
): boolean {
  return colorDistance(r, g, b, light) < 36;
}

function stripQrPlateBackground(
  context: CanvasRenderingContext2D,
  size: number,
  light: Rgb,
) {
  const imageData = context.getImageData(0, 0, size, size);

  for (let index = 0; index < imageData.data.length; index += 4) {
    const r = imageData.data[index];
    const g = imageData.data[index + 1];
    const b = imageData.data[index + 2];

    if (isQrBackgroundPixel(r, g, b, light)) {
      imageData.data[index + 3] = 0;
    }
  }

  context.putImageData(imageData, 0, 0);
}

async function cropQrDataUrlToInkBounds(
  dataUrl: string,
  displaySize: number,
  lightColor: string,
  darkColor: string,
): Promise<string | null> {
  if (typeof document === "undefined") {
    return null;
  }

  const light = parseHexColor(lightColor);
  const dark = parseHexColor(darkColor);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scratch = document.createElement("canvas");
      scratch.width = image.width;
      scratch.height = image.height;
      const scratchContext = scratch.getContext("2d");

      if (!scratchContext) {
        resolve(null);
        return;
      }

      scratchContext.drawImage(image, 0, 0);
      const pixels = scratchContext.getImageData(
        0,
        0,
        image.width,
        image.height,
      ).data;

      let minX = image.width;
      let minY = image.height;
      let maxX = -1;
      let maxY = -1;

      for (let y = 0; y < image.height; y += 1) {
        for (let x = 0; x < image.width; x += 1) {
          const index = (y * image.width + x) * 4;
          if (pixels[index + 3] < 24) {
            continue;
          }

          if (
            isQrInkPixel(
              pixels[index],
              pixels[index + 1],
              pixels[index + 2],
              light,
              dark,
            )
          ) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
      }

      if (maxX < minX || maxY < minY) {
        resolve(null);
        return;
      }

      const cropWidth = maxX - minX + 1;
      const cropHeight = maxY - minY + 1;
      const output = document.createElement("canvas");
      output.width = displaySize;
      output.height = displaySize;
      const outputContext = output.getContext("2d");

      if (!outputContext) {
        resolve(null);
        return;
      }

      outputContext.clearRect(0, 0, displaySize, displaySize);
      outputContext.imageSmoothingEnabled = false;
      outputContext.drawImage(
        image,
        minX,
        minY,
        cropWidth,
        cropHeight,
        0,
        0,
        displaySize,
        displaySize,
      );
      stripQrPlateBackground(outputContext, displaySize, light);

      resolve(output.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("Failed to load QR image"));
    image.src = dataUrl;
  });
}

/** PNG where the white plate matches the QR square (no extra quiet-zone padding). */
export async function generateTightVarQrDataUrl(
  payload: string,
  displaySize: number,
): Promise<string> {
  const renderSize = Math.max(Math.round(displaySize * 10), 420);
  const dataUrl = await QRCodeCreator.toDataURL(payload, {
    errorCorrectionLevel: QR_ERROR_CORRECTION,
    margin: 0,
    width: renderSize,
    color: {
      dark: VAR_QR_DARK_COLOR,
      light: VAR_QR_LIGHT_COLOR,
    },
  });

  const tightCrop = await cropQrDataUrlToInkBounds(
    dataUrl,
    displaySize,
    VAR_QR_LIGHT_COLOR,
    VAR_QR_DARK_COLOR,
  );

  if (tightCrop) {
    return tightCrop;
  }

  return QRCodeCreator.toDataURL(payload, {
    errorCorrectionLevel: QR_ERROR_CORRECTION,
    margin: 0,
    width: displaySize,
    color: {
      dark: VAR_QR_DARK_COLOR,
      light: VAR_QR_LIGHT_COLOR,
    },
  });
}

export type QrTightCropLayout = {
  moduleCount: number;
  minRow: number;
  minCol: number;
  activeSize: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  sourceX: number;
  sourceY: number;
  sourceSize: number;
};

function scanQrDarkBounds(modules: {
  size: number;
  get: (row: number, col: number) => boolean;
}) {
  const moduleCount = modules.size;
  let minRow = moduleCount;
  let minCol = moduleCount;
  let maxRow = -1;
  let maxCol = -1;

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (modules.get(row, col)) {
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
      }
    }
  }

  if (maxRow < 0) {
    return null;
  }

  const activeSize = Math.max(maxCol - minCol + 1, maxRow - minRow + 1);

  return {
    moduleCount,
    minRow,
    minCol,
    activeSize,
  };
}

/** Crop QR quiet zone by aligning to the dark-module bounding box. */
export function getQrTightCropLayout(
  payload: string,
  displaySize: number,
): QrTightCropLayout {
  const fallback: QrTightCropLayout = {
    moduleCount: 1,
    minRow: 0,
    minCol: 0,
    activeSize: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    sourceX: 0,
    sourceY: 0,
    sourceSize: displaySize,
  };

  try {
    const { modules } = QRCodeCreator.create(payload, {
      errorCorrectionLevel: QR_ERROR_CORRECTION,
    });
    const bounds = scanQrDarkBounds(modules);
    if (!bounds) {
      return fallback;
    }

    const { moduleCount, minRow, minCol, activeSize } = bounds;
    const scale = moduleCount / activeSize;
    const modulePx = displaySize / moduleCount;
    const renderSize = displaySize * scale;
    const sourceX = (minCol * renderSize) / moduleCount;
    const sourceY = (minRow * renderSize) / moduleCount;
    const sourceSize = (activeSize * renderSize) / moduleCount;

    return {
      moduleCount,
      minRow,
      minCol,
      activeSize,
      scale,
      offsetX: -minCol * modulePx * scale,
      offsetY: -minRow * modulePx * scale,
      sourceX,
      sourceY,
      sourceSize,
    };
  } catch {
    return fallback;
  }
}

function resolveVarQrAppUrl() {
  const configuredAppUrl = process.env.EXPO_PUBLIC_APP_URL?.trim();

  if (configuredAppUrl) {
    return configuredAppUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return "";
}

export function buildVarQrPayload(displayVarId: string) {
  const id = displayVarId.trim();
  if (!id) {
    return "VAR";
  }

  const appUrl = resolveVarQrAppUrl();
  return appUrl ? `${appUrl}/add/${encodeURIComponent(id)}` : id;
}

export function buildVarCardShareMessage(displayVarId: string) {
  const shareUrl = buildVarQrPayload(displayVarId);
  const displayId = displayVarId.trim() || "VAR-0000000";

  return {
    displayId,
    shareUrl,
    message: ["بطاقة VAR — الوجه الأمامي", displayId, shareUrl].join("\n"),
  };
}

export function parseVarIdFromScannedValue(raw: string) {
  const trimmed = raw.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const addPathMatch = trimmed.match(/\/add\/([^/?#]+)/i);

    if (addPathMatch?.[1]) {
      return normalizeAppwriteDisplayVarId(decodeURIComponent(addPathMatch[1]));
    }
  } catch {
    // Fall through to direct VAR ID normalization.
  }

  return normalizeAppwriteDisplayVarId(trimmed);
}
