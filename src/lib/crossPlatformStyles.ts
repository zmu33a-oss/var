import { Platform, StyleSheet } from "react-native";
import type { ImageStyle, TextStyle, ViewStyle } from "react-native";

type PointerEventsValue = "auto" | "none" | "box-none" | "box-only";

function clampOpacity(value: number) {
  return Math.max(0, Math.min(1, value));
}

function expandHex(color: string) {
  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }

  return color;
}

function withOpacity(color: string, opacity: number) {
  const normalizedColor = color.trim();
  const normalizedOpacity = clampOpacity(opacity);

  if (!normalizedColor) {
    return `rgba(0, 0, 0, ${normalizedOpacity})`;
  }

  if (normalizedColor.startsWith("#")) {
    const expandedColor = expandHex(normalizedColor);

    if (expandedColor.length === 7) {
      const red = Number.parseInt(expandedColor.slice(1, 3), 16);
      const green = Number.parseInt(expandedColor.slice(3, 5), 16);
      const blue = Number.parseInt(expandedColor.slice(5, 7), 16);

      return `rgba(${red}, ${green}, ${blue}, ${normalizedOpacity})`;
    }
  }

  if (normalizedColor.startsWith("rgb(")) {
    return normalizedColor.replace(
      /^rgb\((.+)\)$/i,
      `rgba($1, ${normalizedOpacity})`,
    );
  }

  return normalizedColor;
}

export function createShadowStyle(input: {
  color: string;
  x: number;
  y: number;
  blur: number;
  opacity: number;
  spread?: number;
  elevation?: number;
}) {
  if (Platform.OS === "web") {
    const spread = input.spread ?? 0;

    return {
      boxShadow: `${input.x}px ${input.y}px ${input.blur}px ${spread}px ${withOpacity(input.color, input.opacity)}`,
    } as ViewStyle;
  }

  const shadowStyle: ViewStyle = {
    shadowColor: input.color,
    shadowOffset: { width: input.x, height: input.y },
    shadowOpacity: input.opacity,
    shadowRadius: input.blur,
  };

  if (typeof input.elevation === "number") {
    shadowStyle.elevation = input.elevation;
  }

  return shadowStyle;
}

export function createTextShadowStyle(input: {
  color: string;
  x: number;
  y: number;
  blur: number;
}) {
  if (Platform.OS === "web") {
    return {
      textShadow: `${input.x}px ${input.y}px ${input.blur}px ${input.color}`,
    } as TextStyle;
  }

  return {
    textShadowColor: input.color,
    textShadowOffset: { width: input.x, height: input.y },
    textShadowRadius: input.blur,
  } as TextStyle;
}

export function getWebPointerEventsStyle(value: PointerEventsValue) {
  if (Platform.OS !== "web") {
    return {} as ViewStyle;
  }

  if (value === "auto" || value === "none") {
    return { pointerEvents: value } as ViewStyle;
  }

  return {} as ViewStyle;
}

export function getNativePointerEventsProps(value: PointerEventsValue) {
  return { pointerEvents: value };
}

type CompatStyle = ViewStyle | TextStyle | ImageStyle;
type CompatNamedStyles<T> = { [P in keyof T]: CompatStyle };

function transformCompatStyle(style: CompatStyle) {
  if (Platform.OS !== "web") {
    return style;
  }

  const nextStyle = { ...style } as Record<string, unknown>;
  const shadowColor =
    typeof nextStyle.shadowColor === "string" ? nextStyle.shadowColor : "";
  const shadowOffset =
    nextStyle.shadowOffset && typeof nextStyle.shadowOffset === "object"
      ? (nextStyle.shadowOffset as { width?: unknown; height?: unknown })
      : null;
  const shadowOpacity =
    typeof nextStyle.shadowOpacity === "number" ? nextStyle.shadowOpacity : 0;
  const shadowRadius =
    typeof nextStyle.shadowRadius === "number" ? nextStyle.shadowRadius : 0;

  if (shadowColor || shadowOffset || shadowOpacity || shadowRadius) {
    const shadowX =
      typeof shadowOffset?.width === "number" ? shadowOffset.width : 0;
    const shadowY =
      typeof shadowOffset?.height === "number" ? shadowOffset.height : 0;
    nextStyle.boxShadow = `${shadowX}px ${shadowY}px ${shadowRadius}px 0px ${withOpacity(shadowColor, shadowOpacity)}`;
    delete nextStyle.shadowColor;
    delete nextStyle.shadowOffset;
    delete nextStyle.shadowOpacity;
    delete nextStyle.shadowRadius;
  }

  const textShadowColor =
    typeof nextStyle.textShadowColor === "string"
      ? nextStyle.textShadowColor
      : "";
  const textShadowOffset =
    nextStyle.textShadowOffset && typeof nextStyle.textShadowOffset === "object"
      ? (nextStyle.textShadowOffset as { width?: unknown; height?: unknown })
      : null;
  const textShadowRadius =
    typeof nextStyle.textShadowRadius === "number"
      ? nextStyle.textShadowRadius
      : 0;

  if (textShadowColor || textShadowOffset || textShadowRadius) {
    const textShadowX =
      typeof textShadowOffset?.width === "number" ? textShadowOffset.width : 0;
    const textShadowY =
      typeof textShadowOffset?.height === "number"
        ? textShadowOffset.height
        : 0;
    nextStyle.textShadow = `${textShadowX}px ${textShadowY}px ${textShadowRadius}px ${textShadowColor}`;
    delete nextStyle.textShadowColor;
    delete nextStyle.textShadowOffset;
    delete nextStyle.textShadowRadius;
  }

  return nextStyle as CompatStyle;
}

export function createCompatStyleSheet<T extends CompatNamedStyles<T>>(
  styles: T,
) {
  if (Platform.OS !== "web") {
    return StyleSheet.create(styles);
  }

  const nextStyles = Object.fromEntries(
    Object.entries(styles).map(([styleName, styleValue]) => [
      styleName,
      transformCompatStyle(styleValue as CompatStyle),
    ]),
  ) as T;

  return StyleSheet.create(nextStyles);
}
