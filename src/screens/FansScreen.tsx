import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import type { FanClubId } from "../app.types";
import { createCompatStyleSheet } from "../lib/crossPlatformStyles";
import FansAssociationCard from "./fans/FansAssociationCard";
import FansSupportTongue, {
  FANS_TONGUE_RESERVED_HEIGHT,
} from "./fans/FansSupportTongue";

type FansScreenProps = {
  isLoggedIn: boolean;
  supporters: Record<FanClubId, number>;
  supportedTeams: FanClubId[];
  onRequireAuth: (message?: string) => void;
  onToggleSupport: (clubId: FanClubId) => void;
};

export default function FansScreen(props: FansScreenProps) {
  return (
    <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.screenContent,
            styles.screenContentWithTongue,
          ]}
        >
          <FansAssociationCard supporters={props.supporters} />
        </ScrollView>

        <View style={styles.tongueOverlayHost} pointerEvents="box-none">
          <FansSupportTongue
            supporters={props.supporters}
            supportedTeams={props.supportedTeams}
            isLoggedIn={props.isLoggedIn}
            onRequireAuth={props.onRequireAuth}
            onToggleSupport={props.onToggleSupport}
          />
        </View>
      </View>
  );
}

const styles = createCompatStyleSheet({
  root: {
    flex: 1,
    backgroundColor: "#04070C",
    position: "relative",
  },
  tongueOverlayHost: {
    position: "absolute",
    top: 18,
    left: 0,
    right: 0,
    zIndex: 30,
    alignItems: "center",
  },
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 32,
  },
  screenContentWithTongue: {
    paddingTop: 18 + FANS_TONGUE_RESERVED_HEIGHT + 8,
  },
});
