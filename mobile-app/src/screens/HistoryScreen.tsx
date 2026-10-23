import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import * as alertApi from "../api/alertApi";
import type { AlertRecord } from "../types";
import { colors } from "../theme";

const STATUS_COLOR: Record<string, string> = {
  Safe: colors.safe,
  Warning: colors.warn,
  Drowsy: colors.danger,
};

export function HistoryScreen() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await alertApi.fetchAlertHistory("week");
      setAlerts(result);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Alert History</Text>
      <Text style={styles.subheader}>Last 7 days</Text>

      {!loading && alerts.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No alerts this week. Drive safe out there.</Text>
        </View>
      )}

      <FlatList
        data={alerts}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.safe} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[item.status] }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {item.status} — Score {item.fatigueScore}
              </Text>
              <Text style={styles.rowSubtitle}>
                {new Date(item.timestamp).toLocaleString()}
              </Text>
              {item.reasons.length > 0 && (
                <Text style={styles.rowReasons}>{item.reasons.join(", ")}</Text>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20, paddingTop: 60 },
  header: { color: colors.textPrimary, fontSize: 24, fontWeight: "700" },
  subheader: { color: colors.textMuted, fontSize: 13, marginBottom: 20 },
  empty: { paddingVertical: 40, alignItems: "center" },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  rowTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: "600" },
  rowSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  rowReasons: { color: colors.textMuted, fontSize: 12, marginTop: 4, fontStyle: "italic" },
});
