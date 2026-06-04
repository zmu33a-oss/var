import {
  getMembershipCardTheme,
  getMembershipCardTierLabel,
  type MembershipCardTier,
} from "../../lib/membershipCardTier";
import {
  buildVarQrPayload,
  generateTightVarQrDataUrl,
  scaleVarQrDisplaySize,
  VAR_QR_DARK_COLOR,
} from "./profileCardConnect.utils";

type CanvasGradientColors = readonly [string, string, ...string[]];

const CARD_ASPECT_RATIO = 0.57;
const CARD_BORDER_RADIUS = 14;
const CARD_PADDING = 18;
const MIN_CARD_WIDTH = 320;
const MAX_CARD_WIDTH = 440;
const QR_DARK_COLOR = VAR_QR_DARK_COLOR;

type WebFileShareData = {
  files?: File[];
  text?: string;
  title?: string;
};

type NavigatorWithFileShare = Navigator & {
  canShare?: (data: WebFileShareData) => boolean;
  share?: (data: WebFileShareData) => Promise<void>;
};

type VarFrontCardImageOptions = {
  cardTier: MembershipCardTier;
  displayVarId: string;
  width: number;
};

export type VarFrontCardShareResult = "shared" | "downloaded" | "unsupported";

export async function shareVarFrontCardImage(
  options: VarFrontCardImageOptions,
): Promise<VarFrontCardShareResult> {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return "unsupported";
  }

  const dataUrl = await createVarFrontCardJpegDataUrl(options);
  const displayId = normalizeDisplayVarId(options.displayVarId);
  const fileName = buildCardImageFileName(displayId);
  const file = dataUrlToFile(dataUrl, fileName);
  const webNavigator = navigator as NavigatorWithFileShare;

  if (typeof webNavigator.share === "function") {
    const shareData: WebFileShareData = {
      files: [file],
      title: "بطاقة VAR",
      text: `بطاقة VAR ${displayId}`,
    };

    const canShareFile =
      typeof webNavigator.canShare !== "function" ||
      webNavigator.canShare({ files: [file] });

    if (canShareFile) {
      try {
        await webNavigator.share({ files: [file] });
        return "shared";
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") {
          throw error;
        }
      }

      try {
        await webNavigator.share(shareData);
        return "shared";
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") {
          throw error;
        }
      }
    }
  }

  downloadDataUrl(dataUrl, fileName);
  return "downloaded";
}

async function createVarFrontCardJpegDataUrl(
  options: VarFrontCardImageOptions,
) {
  const theme = getMembershipCardTheme(options.cardTier);
  const logicalWidth = Math.round(
    clamp(options.width || MAX_CARD_WIDTH, MIN_CARD_WIDTH, MAX_CARD_WIDTH),
  );
  const logicalHeight = Math.round(logicalWidth * CARD_ASPECT_RATIO);
  const pixelRatio = clamp(window.devicePixelRatio || 2, 2, 3);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(logicalWidth * pixelRatio);
  canvas.height = Math.round(logicalHeight * pixelRatio);

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not available.");
  }

  context.scale(pixelRatio, pixelRatio);
  drawCardShell(context, logicalWidth, logicalHeight, theme);
  await drawCardFrontContent(context, logicalWidth, logicalHeight, options);

  return canvas.toDataURL("image/jpeg", 0.96);
}

function drawCardShell(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: ReturnType<typeof getMembershipCardTheme>,
) {
  context.save();
  roundedRectPath(context, 0, 0, width, height, CARD_BORDER_RADIUS);
  context.clip();

  context.fillStyle = createLinearGradientFill(
    context,
    theme.frontGradient,
    0,
    0,
    width,
    height,
  );
  context.fillRect(0, 0, width, height);

  context.fillStyle = createLinearGradientFill(
    context,
    theme.sheenGradient,
    0,
    0,
    width,
    height,
  );
  context.fillRect(0, 0, width, height);

  context.fillStyle = theme.watermark;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = buildCanvasFont(120, 900);
  context.fillText("VAR", width / 2, height / 2 + 2);
  context.restore();

  context.save();
  roundedRectPath(context, 0.5, 0.5, width - 1, height - 1, CARD_BORDER_RADIUS);
  context.strokeStyle = theme.borderColor;
  context.lineWidth = 1;
  context.stroke();
  context.restore();
}

async function drawCardFrontContent(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: VarFrontCardImageOptions,
) {
  const displayId = normalizeDisplayVarId(options.displayVarId);
  const theme = getMembershipCardTheme(options.cardTier);
  const compact = width < 360;
  const qrSize = scaleVarQrDisplaySize(compact ? 58 : 66);
  const qrPlateSize = qrSize;
  const logoTop = CARD_PADDING + 35;
  const qrPlateLeft = width - CARD_PADDING - qrPlateSize;
  const qrPlateTop = logoTop + 28;

  context.fillStyle = theme.primaryText;
  context.textAlign = "left";
  context.textBaseline = "top";
  context.font = buildCanvasFont(12, 800);
  drawSpacedText(
    context,
    getMembershipCardTierLabel(options.cardTier),
    20,
    18,
    1.4,
  );

  context.fillStyle = theme.primaryText;
  context.font = buildCanvasFont(38, 900);
  drawSpacedText(context, "VAR", CARD_PADDING + 4, logoTop, -1);

  context.fillStyle = theme.secondaryText;
  context.font = buildCanvasFont(8.5, 700);
  drawSpacedText(
    context,
    "VAR BANK FOR FANS",
    CARD_PADDING + 4,
    logoTop + 38,
    0.3,
  );

  const qrPayload = buildVarQrPayload(displayId);
  const qrImage = await loadCanvasImage(
    await generateTightVarQrDataUrl(qrPayload, qrSize),
  );

  context.drawImage(qrImage, qrPlateLeft, qrPlateTop, qrSize, qrSize);

  if (options.cardTier === "classic") {
    drawClassicIdBadge(context, width, height, displayId, theme.idBadgeText);
    return;
  }

  drawPremiumIdBlock(context, width, height, displayId, theme);
}

function drawClassicIdBadge(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  displayId: string,
  textColor: string,
) {
  context.save();
  context.font = buildCanvasFont(12, 800);
  const textWidth = context.measureText(displayId).width;
  const badgeWidth = textWidth + 16;
  const badgeHeight = 24;
  const badgeLeft = width - 20 - badgeWidth;
  const badgeTop = height - 18 - badgeHeight;
  roundedRectPath(context, badgeLeft, badgeTop, badgeWidth, badgeHeight, 4);
  context.fillStyle = "#050505";
  context.fill();
  context.fillStyle = textColor;
  context.textAlign = "center";
  context.textBaseline = "middle";
  drawSpacedText(
    context,
    displayId,
    badgeLeft + badgeWidth / 2,
    badgeTop + badgeHeight / 2,
    0.8,
    "center",
  );
  context.restore();
}

function drawPremiumIdBlock(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  displayId: string,
  theme: ReturnType<typeof getMembershipCardTheme>,
) {
  const textRight = width - 20;
  context.save();
  context.textAlign = "right";
  context.textBaseline = "bottom";
  context.fillStyle = theme.idBadgeText;
  context.font = buildCanvasFont(12.5, 700);
  drawSpacedText(context, displayId, textRight, height - 28, 0.8, "right");
  context.fillStyle = theme.mutedText;
  context.font = buildCanvasFont(8, 700);
  drawSpacedText(context, "VAR ID", textRight, height - 18, 0.6, "right");
  context.restore();
}

function createLinearGradientFill(
  context: CanvasRenderingContext2D,
  colors: CanvasGradientColors,
  startLeft: number,
  startTop: number,
  endLeft: number,
  endTop: number,
) {
  const gradient = context.createLinearGradient(
    startLeft,
    startTop,
    endLeft,
    endTop,
  );
  const finalStopIndex = Math.max(1, colors.length - 1);

  colors.forEach((color, colorIndex) => {
    gradient.addColorStop(colorIndex / finalStopIndex, color);
  });

  return gradient;
}

function roundedRectPath(
  context: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
  radius: number,
) {
  const cornerRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(left + cornerRadius, top);
  context.lineTo(left + width - cornerRadius, top);
  context.quadraticCurveTo(left + width, top, left + width, top + cornerRadius);
  context.lineTo(left + width, top + height - cornerRadius);
  context.quadraticCurveTo(
    left + width,
    top + height,
    left + width - cornerRadius,
    top + height,
  );
  context.lineTo(left + cornerRadius, top + height);
  context.quadraticCurveTo(
    left,
    top + height,
    left,
    top + height - cornerRadius,
  );
  context.lineTo(left, top + cornerRadius);
  context.quadraticCurveTo(left, top, left + cornerRadius, top);
  context.closePath();
}

function drawSpacedText(
  context: CanvasRenderingContext2D,
  text: string,
  left: number,
  top: number,
  letterSpacing: number,
  align: CanvasTextAlign = "left",
) {
  if (!letterSpacing) {
    context.textAlign = align;
    context.fillText(text, left, top);
    return;
  }

  const characters = Array.from(text);
  const measuredWidth = characters.reduce(
    (totalWidth, character, characterIndex) =>
      totalWidth +
      context.measureText(character).width +
      (characterIndex < characters.length - 1 ? letterSpacing : 0),
    0,
  );
  const startLeft =
    align === "right"
      ? left - measuredWidth
      : align === "center"
        ? left - measuredWidth / 2
        : left;
  let currentLeft = startLeft;

  context.textAlign = "left";
  characters.forEach((character, characterIndex) => {
    context.fillText(character, currentLeft, top);
    currentLeft +=
      context.measureText(character).width +
      (characterIndex < characters.length - 1 ? letterSpacing : 0);
  });
}

function buildCanvasFont(size: number, weight: number) {
  return `${weight} ${size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
}

function loadCanvasImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load card QR image."));
    image.src = source;
  });
}

function dataUrlToFile(dataUrl: string, fileName: string) {
  const [header = "", base64Data = ""] = dataUrl.split(",");
  const mimeMatch = header.match(/^data:(.+);base64$/);
  const mimeType = mimeMatch?.[1] || "image/png";
  const binaryString = atob(base64Data);
  const byteArray = new Uint8Array(binaryString.length);

  for (let byteIndex = 0; byteIndex < binaryString.length; byteIndex += 1) {
    byteArray[byteIndex] = binaryString.charCodeAt(byteIndex);
  }

  return new File([byteArray], fileName, { type: mimeType });
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function buildCardImageFileName(displayVarId: string) {
  const safeDisplayId = displayVarId.replace(/[^A-Za-z0-9-]+/g, "-");
  return `${safeDisplayId || "VAR-card"}-front.jpg`;
}

function normalizeDisplayVarId(displayVarId: string) {
  return displayVarId.trim() || "VAR-0000000";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
