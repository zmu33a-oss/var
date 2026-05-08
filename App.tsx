import "react-native-gesture-handler";
import "./global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppShell from "./src/AppShell";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppShell />
    </GestureHandlerRootView>
  );
}
