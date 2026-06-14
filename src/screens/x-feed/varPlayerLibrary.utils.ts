import { Platform } from "react-native";
import { isAppwriteStorageViewUrl } from "../../lib/appwrite/appwrite.storage";
import type { AppwriteVarLibraryRecord } from "../../lib/appwrite/appwrite.types";
import {
  X_POST_MEDIA_EXPORT_WIDTH,
} from "./x-feed.media.constants";
import { clampLibraryMediaAspectRatio } from "./x-feed.media.utils";
import {
  VAR_LIBRARY_BRAND_MARK,
  type VarLibraryPublishInput,
  type VarPlayerLibraryEntry,
} from "./varPlayerLibrary.constants";

export function resolveVarPlayerPortraitUri(portraitSeed: string) {
  const seed = encodeURIComponent(portraitSeed.trim() || "var-player");
  return `https://api.dicebear.com/7.x/personas/png?seed=${seed}&backgroundColor=0a0f1c,111827,1e293b&size=512`;
}

export function resolveVarLibraryEntryImageUri(entry: VarPlayerLibraryEntry) {
  const uploadedUri = entry.imageUri?.trim();

  if (uploadedUri) {
    return uploadedUri;
  }

  if (entry.portraitSeed?.trim()) {
    return resolveVarPlayerPortraitUri(entry.portraitSeed);
  }

  return resolveVarPlayerPortraitUri(entry.id);
}

export function mapAppwriteRecordToLibraryEntry(
  record: AppwriteVarLibraryRecord,
): VarPlayerLibraryEntry {
  return {
    id: record.id,
    name: record.name,
    club: record.club,
    position: record.position || "لاعب",
    imageUri: record.imageUri,
    fromAppwrite: true,
  };
}

function loadImageFromSrc(
  src: string,
  crossOrigin?: "anonymous",
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    if (crossOrigin) {
      image.crossOrigin = crossOrigin;
    }

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("تعذر تحميل صورة اللاعب."));
    image.src = src;
  });
}

async function loadImageElement(uri: string): Promise<{
  image: HTMLImageElement;
  revoke?: () => void;
}> {
  if (uri.startsWith("data:") || uri.startsWith("blob:")) {
    return { image: await loadImageFromSrc(uri) };
  }

  try {
    const response = await fetch(uri, {
      mode: "cors",
      credentials: "omit",
    });

    if (response.ok) {
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const image = await loadImageFromSrc(objectUrl);

      return {
        image,
        revoke: () => URL.revokeObjectURL(objectUrl),
      };
    }
  } catch {
    // Fall through to direct image load below.
  }

  if (isAppwriteStorageViewUrl(uri)) {
    try {
      return {
        image: await loadImageFromSrc(uri, "anonymous"),
      };
    } catch {
      throw new Error(
        "تعذر تحميل الصورة من التخزين. سيتم النشر بالصورة الأصلية.",
      );
    }
  }

  return {
    image: await loadImageFromSrc(uri, "anonymous"),
  };
}

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  if (typeof context.roundRect === "function") {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fill();
    return;
  }

  context.fillRect(x, y, width, height);
}

function strokeRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  if (typeof context.roundRect === "function") {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.stroke();
    return;
  }

  context.strokeRect(x, y, width, height);
}

export function drawVarLibraryCornerStamp(
  context: CanvasRenderingContext2D,
  anchorX: number,
  anchorY: number,
  scale = 1,
) {
  const paddingX = 14 * scale;
  const verifySize = 28 * scale;
  const gap = 8 * scale;
  const fontSize = 24 * scale;
  const radius = 14 * scale;

  context.font = `900 ${fontSize}px Arial, Helvetica, sans-serif`;
  const brandWidth = context.measureText(VAR_LIBRARY_BRAND_MARK).width;
  const stampWidth = paddingX * 2 + brandWidth + gap + verifySize;
  const stampHeight = Math.max(verifySize + 16, 42 * scale);
  const stampX = anchorX - stampWidth;
  const stampY = anchorY;
  const verifyCenterX = stampX + paddingX + brandWidth + gap + verifySize / 2;
  const verifyCenterY = stampY + stampHeight / 2;

  context.fillStyle = "rgba(15, 23, 42, 0.82)";
  fillRoundedRect(context, stampX, stampY, stampWidth, stampHeight, radius);

  context.strokeStyle = "rgba(148, 163, 184, 0.35)";
  context.lineWidth = 1.5 * scale;
  strokeRoundedRect(context, stampX, stampY, stampWidth, stampHeight, radius);

  context.fillStyle = "#FFFFFF";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText(
    VAR_LIBRARY_BRAND_MARK,
    stampX + paddingX,
    verifyCenterY,
  );

  context.beginPath();
  context.arc(verifyCenterX, verifyCenterY, verifySize / 2, 0, Math.PI * 2);
  context.fillStyle = "#FACC15";
  context.fill();

  context.strokeStyle = "#0F172A";
  context.lineWidth = 3 * scale;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(verifyCenterX - verifySize * 0.18, verifyCenterY + verifySize * 0.02);
  context.lineTo(
    verifyCenterX - verifySize * 0.04,
    verifyCenterY + verifySize * 0.18,
  );
  context.lineTo(
    verifyCenterX + verifySize * 0.2,
    verifyCenterY - verifySize * 0.16,
  );
  context.stroke();
}

export async function composeVarLibraryPostImage(
  input: VarLibraryPublishInput,
): Promise<string> {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return input.imageUri;
  }

  let loadedImage: Awaited<ReturnType<typeof loadImageElement>> | null = null;

  try {
    loadedImage = await loadImageElement(input.imageUri);
  } catch {
    return input.imageUri;
  }

  const width = X_POST_MEDIA_EXPORT_WIDTH;
  const image = loadedImage.image;
  const aspectRatio = clampLibraryMediaAspectRatio(image.width / image.height);
  const height = Math.max(1, Math.round(width / aspectRatio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    loadedImage.revoke?.();
    return input.imageUri;
  }

  try {
    context.drawImage(image, 0, 0, width, height);
    drawVarLibraryCornerStamp(context, width - 36, 36, 1);
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return input.imageUri;
  } finally {
    loadedImage.revoke?.();
  }
}
