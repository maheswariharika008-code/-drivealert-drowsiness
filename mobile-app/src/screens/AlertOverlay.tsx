import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { useAlert } from "../context/AlertContext";
import { colors } from "../theme";

/**
 * Rendered at the root of the app (see App.tsx) so it can pop over any
 * screen the driver happens to be on. Visibility is driven entirely by
 * AlertContext, which is set by the FCM notification listener regardless
 * of which tab is active.
 */
export function AlertOverlay() {
  const { activeAlert, dismissAlert } = useAlert();

  return (
    <Modal visible={!!activeAlert} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>⚠</Text>
          </View>
          <Text style={styles.title}>Wake Up!</Text>
          <Text style={styles.subtitle}>You appear to be sleepy.</Text>
          {activeAlert && (
            <Text style={styles.detail}>Fatigue score: {activeAlert.fatigueScore}</Text>
          )}
          <Text style={styles.instruction}>
            Pull over to a safe location as soon as possible and take a break before continuing.
          </Text>
          <TouchableOpacity style={styles.button} onPress={dismissAlert}>
            <Text style={styles.buttonText}>I'm awake — stop alarm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(251,65,65,0.25)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.panel,
    borderWidth: 2,
    borderColor: colors.danger,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(251,65,65,0.15)",
    borderWidth: 2,
    borderColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  icon: { fontSize: 28 },
  title: { color: colors.danger, fontSize: 30, fontWeight: "800", marginBottom: 4 },
  subtitle: { color: colors.textPrimary, fontSize: 17, marginBottom: 10 },
  detail: { color: colors.textMuted, fontSize: 13, marginBottom: 12 },
  instruction: { color: colors.textMuted, fontSize: 13, textAlign: "center", lineHeight: 19, marginBottom: 24 },
  button: {
    backgroundColor: colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: "100%",
    alignItems: "center",
  },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
