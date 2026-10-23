import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { AlertProvider } from "./src/context/AlertContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { AppTabs } from "./src/navigation/AppTabs";
import { AlertOverlay } from "./src/screens/AlertOverlay";
import { colors } from "./src/theme";

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.panel, border: colors.hairline },
};

function RootNavigation() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.safe} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <AppTabs /> : <LoginScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <StatusBar style="light" />
        <RootNavigation />
        {/* Rendered outside NavigationContainer's screen stack so it overlays any tab */}
        <AlertOverlay />
      </AlertProvider>
    </AuthProvider>
  );
}
