import { Audio, AVPlaybackStatus } from "expo-av";
import { Vibration, Platform } from "react-native";

let soundInstance: Audio.Sound | null = null;

// Long buzz/pause pattern so it's unmistakably an alarm, not a regular
// notification buzz. Repeated via Vibration.vibrate(pattern, true).
const VIBRATION_PATTERN = [0, 800, 400, 800, 400, 800];

/**
 * Starts the loud, looping alarm: audio (loaded from the bundled alarm.wav
 * asset) + a repeating vibration pattern. This is the in-app fallback for
 * when the app is foregrounded; when backgrounded/locked, the FCM
 * notification channel itself (configured with sound: 'alarm', see
 * notifications.ts) is what actually makes noise on the OS level.
 */
export async function startAlarm(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
    });

    if (!soundInstance) {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/alarm.wav"),
        { isLooping: true, volume: 1.0, shouldPlay: true }
      );
      soundInstance = sound;
    } else {
      await soundInstance.setPositionAsync(0);
      await soundInstance.playAsync();
    }
  } catch (err) {
    console.warn("[alarm] Failed to play alarm sound:", err);
  }

  if (Platform.OS === "android") {
    Vibration.vibrate(VIBRATION_PATTERN, true);
  } else {
    // iOS ignores custom patterns for repeat; use a simple repeating buzz.
    Vibration.vibrate(VIBRATION_PATTERN);
  }
}

export async function stopAlarm(): Promise<void> {
  Vibration.cancel();
  try {
    if (soundInstance) {
      const status: AVPlaybackStatus = await soundInstance.getStatusAsync();
      if (status.isLoaded) {
        await soundInstance.stopAsync();
      }
    }
  } catch (err) {
    console.warn("[alarm] Failed to stop alarm sound:", err);
  }
}

export async function unloadAlarm(): Promise<void> {
  Vibration.cancel();
  if (soundInstance) {
    await soundInstance.unloadAsync();
    soundInstance = null;
  }
}
