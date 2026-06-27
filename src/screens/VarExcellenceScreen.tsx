import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const HILAL_LOGO = require("../../assets/clubs/saudi/hilal.png");

export default function VarExcellenceScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#000000", "#0a0a0a", "#000000"]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.header}>
        <Image source={HILAL_LOGO} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>لوحة فار للتميز</Text>
        <Text style={styles.subtitle}>VAR Excellence Panel</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* التوقع الأكثر صحيحة */}
        <View style={styles.leaderCard}>
          <View style={styles.leaderHeader}>
            <Ionicons name="star" size={24} color="#F4C565" />
            <Text style={styles.leaderTitle}>التوقع الأكثر صحيحة</Text>
          </View>
          <View style={styles.leaderContent}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={32} color="#F4C565" />
            </View>
            <Text style={styles.leaderName}>VAR-User1234</Text>
            <Text style={styles.leaderValue}>87 توقع صحيح</Text>
            <Text style={styles.leaderSubtext}>نسبة النجاح: 92%</Text>
          </View>
        </View>

        {/* التغريدة الأكثر انتشاراً */}
        <View style={styles.leaderCard}>
          <View style={styles.leaderHeader}>
            <Ionicons name="repeat" size={24} color="#22C55E" />
            <Text style={styles.leaderTitle}>التغريدة الأكثر انتشاراً</Text>
          </View>
          <View style={styles.leaderContent}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="chatbubble" size={32} color="#22C55E" />
            </View>
            <Text style={styles.leaderName}>@var_hero</Text>
            <Text style={styles.leaderValue}>2,847 إعادة نشر</Text>
            <Text style={styles.tweetPreview}>"الهلال الأقوى في آسيا 🔥"</Text>
          </View>
        </View>

        {/* الرابطة الأكثر تفاعلاً */}
        <View style={styles.leaderCard}>
          <View style={styles.leaderHeader}>
            <Ionicons name="flame" size={24} color="#FB7185" />
            <Text style={styles.leaderTitle}>الرابطة الأكثر تفاعلاً</Text>
          </View>
          <View style={styles.leaderContent}>
            <Image source={HILAL_LOGO} style={styles.clubLogo} resizeMode="contain" />
            <Text style={styles.leaderName}>رابطة الهلال</Text>
            <Text style={styles.leaderValue}>24,903 تفاعل</Text>
            <Text style={styles.leaderSubtext}>أكثر رابطة نشاطاً هذا الأسبوع</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "center",
  },
  logo: {
    width: 48,
    height: 48,
    marginBottom: 12,
  },
  title: {
    color: "#F4C565",
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "rgba(244,197,101,0.1)",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(244,197,101,0.3)",
    marginBottom: 20,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  cardText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  statsRow: {
    flexDirection: "row-reverse",
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  statNumber: {
    color: "#F4C565",
    fontSize: 28,
    fontWeight: "bold",
  },
  statLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 4,
  },
  leaderCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  leaderHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingBottom: 12,
  },
  leaderTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  leaderContent: {
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(244,197,101,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  leaderName: {
    color: "#F4C565",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  leaderValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  leaderSubtext: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
  },
  tweetPreview: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
  },
  clubLogo: {
    width: 64,
    height: 64,
    marginBottom: 12,
  },
});
