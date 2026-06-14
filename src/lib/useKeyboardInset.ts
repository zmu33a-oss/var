import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

function readWebKeyboardInset() {
  if (typeof window === "undefined" || !window.visualViewport) {
    return 0;
  }

  const viewport = window.visualViewport;
  return Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
}

/** ارتفاع الكيبورد من أسفل الشاشة — لرفع شريط الكتابة دون تحريك الناف بار. */
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (Platform.OS === "web") {
      const update = () => {
        setInset(Math.round(readWebKeyboardInset()));
      };

      update();
      window.visualViewport?.addEventListener("resize", update);
      window.visualViewport?.addEventListener("scroll", update);

      return () => {
        window.visualViewport?.removeEventListener("resize", update);
        window.visualViewport?.removeEventListener("scroll", update);
      };
    }

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setInset(Math.round(event.endCoordinates.height));
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setInset(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return inset;
}
