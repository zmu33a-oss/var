import { useEffect, useMemo, useRef } from "react";
import { Image, Platform } from "react-native";

const CLICK_SOUND = require("../../../assets/audio/click.mp3.mp3");

type WebAudioInstance = {
  currentTime: number;
  pause?: () => void;
  play?: () => Promise<void> | void;
  preload: string;
};

type WebAudioConstructor = new (src?: string) => WebAudioInstance;

function resolveClickSoundUri() {
  try {
    const resolvedSource = Image.resolveAssetSource(CLICK_SOUND);

    if (resolvedSource?.uri) {
      return resolvedSource.uri;
    }
  } catch {
    // Ignore asset resolution failures on unsupported platforms.
  }

  return typeof CLICK_SOUND === "string" ? CLICK_SOUND : null;
}

/** صوت نقرة «شجع» — يُحمَّل مسبقاً على الويب داخل user gesture. */
export function useCheerClickSound() {
  const clickSoundRef = useRef<WebAudioInstance | null>(null);
  const clickSoundUri = useMemo(() => resolveClickSoundUri(), []);

  useEffect(() => {
    if (Platform.OS !== "web" || !clickSoundUri) {
      clickSoundRef.current = null;
      return;
    }

    const audioConstructor = (
      globalThis as typeof globalThis & { Audio?: WebAudioConstructor }
    ).Audio;

    if (!audioConstructor) {
      clickSoundRef.current = null;
      return;
    }

    const sound = new audioConstructor(clickSoundUri);
    sound.preload = "auto";
    clickSoundRef.current = sound;

    return () => {
      try {
        sound.pause?.();
      } catch {
        // Ignore teardown failures.
      }

      clickSoundRef.current = null;
    };
  }, [clickSoundUri]);

  const playCheerClickSound = async () => {
    const sound = clickSoundRef.current;

    if (!sound) {
      return;
    }

    try {
      sound.currentTime = 0;
      const playback = sound.play?.();

      if (
        playback &&
        typeof playback === "object" &&
        "catch" in playback &&
        typeof playback.catch === "function"
      ) {
        await playback.catch(() => undefined);
      }
    } catch {
      // Ignore playback failures so swipe feedback still completes.
    }
  };

  return playCheerClickSound;
}
