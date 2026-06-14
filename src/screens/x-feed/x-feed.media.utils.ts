import { useEffect, useState } from "react";
import { Image } from "react-native";
import { X_POST_MEDIA_ASPECT_RATIO } from "./x-feed.media.constants";

const MAX_LIBRARY_MEDIA_ASPECT_RATIO = 16 / 9;
const MIN_LIBRARY_MEDIA_ASPECT_RATIO = 0.62;

export function clampLibraryMediaAspectRatio(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return X_POST_MEDIA_ASPECT_RATIO;
  }

  return Math.min(
    MAX_LIBRARY_MEDIA_ASPECT_RATIO,
    Math.max(MIN_LIBRARY_MEDIA_ASPECT_RATIO, value),
  );
}

export function useRemoteImageAspectRatio(
  mediaUri: string,
  enabled: boolean,
  fallbackAspectRatio = X_POST_MEDIA_ASPECT_RATIO,
) {
  const [aspectRatio, setAspectRatio] = useState(fallbackAspectRatio);

  useEffect(() => {
    if (!enabled) {
      setAspectRatio(fallbackAspectRatio);
      return;
    }

    const trimmedUri = mediaUri.trim();

    if (!trimmedUri) {
      setAspectRatio(fallbackAspectRatio);
      return;
    }

    let cancelled = false;

    Image.getSize(
      trimmedUri,
      (width, height) => {
        if (cancelled || width <= 0 || height <= 0) {
          return;
        }

        setAspectRatio(clampLibraryMediaAspectRatio(width / height));
      },
      () => {
        if (!cancelled) {
          setAspectRatio(fallbackAspectRatio);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [enabled, fallbackAspectRatio, mediaUri]);

  return aspectRatio;
}
