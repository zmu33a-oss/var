import "react-native-gesture-handler";
import "./global.css";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, StyleSheet, type ViewStyle } from "react-native";
import AppShell from "./src/AppShell";
import { redirectExpoAdminPathToAdminServer } from "./src/appshell/appshell.helpers";

if (Platform.OS === "web") {
  redirectExpoAdminPathToAdminServer();
}

export default function App() {
  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const viewportContent =
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=overlays-content";
    const existingViewportMeta = document.querySelector(
      'meta[name="viewport"]',
    );
    const viewportMeta = existingViewportMeta ?? document.createElement("meta");
    const previousViewportContent = viewportMeta.getAttribute("content");

    if (!existingViewportMeta) {
      viewportMeta.setAttribute("name", "viewport");
      document.head.appendChild(viewportMeta);
    }

    viewportMeta.setAttribute("content", viewportContent);

    const preventGestureZoom = (event: Event) => {
      event.preventDefault();
    };

    const preventPinchTouchZoom = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    };

    const preventWheelZoom = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    };

    document.addEventListener("gesturestart", preventGestureZoom, {
      passive: false,
    });
    document.addEventListener("gesturechange", preventGestureZoom, {
      passive: false,
    });
    document.addEventListener("touchmove", preventPinchTouchZoom, {
      passive: false,
    });
    window.addEventListener("wheel", preventWheelZoom, {
      passive: false,
    });

    void import("./src/lib/appwrite-web")
      .then(({ client }) => client.ping())
      .catch(() => undefined);

    return () => {
      document.removeEventListener("gesturestart", preventGestureZoom);
      document.removeEventListener("gesturechange", preventGestureZoom);
      document.removeEventListener("touchmove", preventPinchTouchZoom);
      window.removeEventListener("wheel", preventWheelZoom);

      if (existingViewportMeta) {
        if (previousViewportContent) {
          viewportMeta.setAttribute("content", previousViewportContent);
        } else {
          viewportMeta.removeAttribute("content");
        }

        return;
      }

      viewportMeta.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView
      style={[styles.appRoot, Platform.OS === "web" ? webAppRoot : null]}
    >
      <AppShell />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: "#04070D",
  },
});

const webAppRoot = {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: "100%",
  overflow: "hidden",
} as unknown as ViewStyle;
