import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import { registerForPushNotifications } from "../services/notifications";
import * as authApi from "../api/authApi";
import { colors } from "../theme";

export function HomeScreen() {
  const { user } = useAuth();
  const [pushStatus, setPushStatus] = useState<"registering" | "active" | "failed">("registering");

  useEffect(() => {
    (async () => {
      try {
        const token = await registerForPushNotifications();
        if (!token) {
          setPushStatus("failed");
          return;
        }
        await authApi.registerDeviceToken(token);
        setPushStatus("active");
      } catch (err) {
        console.warn("[home] Failed to register device for push:", err);
        setPushStatus("failed");
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? "?"}</Text>
      </View>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.vehicle}>Vehicle {user?.vehicleNumber}</Text>

      <View style={styles.statusCard}>
        {pushStatus === "registering" && (
          <>
            <ActivityIndicator color={colors.safe} />
            <Text style={styles.statusText}>Connecting to alert service…</Text>
          </>
        )}
        {pushStatus === "active" && (
          <>
            <View style={[styles.statusDot, { backgroundColor: colors.safe }]} />
            <Text style={styles.statusText}>Ready — you'll be alerted here if drowsiness is detected.</Text>
          </>
        )}
        {pushStatus === "failed" && (
          <>
            <View style={[styles.statusDot, { backgroundColor: colors.danger }]} />
            <Text style={styles.statusText}>
              Push notifications unavailable. Enable notifications in system settings, or use a
              physical device (not a simulator).
            </Text>
          </>
        )}
      </View>

      <Text style={styles.hint}>
        Keep this app installed and notifications enabled while driving. The alarm will sound and
        the phone will vibrate automatically if the in-car camera detects signs of drowsiness —
        no need to keep this screen open.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, alignItems: "center", paddingTop: 60 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(34,211,176,0.15)",
    borderWidth: 1,
    borderColor: "rgba(34,211,176,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: { color: colors.safe, fontSize: 28, fontWeight: "700" },
  name: { color: colors.textPrimary, fontSize: 20, fontWeight: "700" },
  vehicle: { color: colors.textMuted, fontSize: 14, marginTop: 2, marginBottom: 24 },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 14,
    padding: 16,
    width: "100%",
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { color: colors.textPrimary, fontSize: 13, flex: 1, lineHeight: 18 },
  hint: { color: colors.textMuted, fontSize: 13, textAlign: "center", marginTop: 28, lineHeight: 19 },
});
