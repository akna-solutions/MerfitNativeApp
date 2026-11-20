import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

import { parseStoredState, StepState } from "./stepState";

/**
 * Adim verisinin cihazdaki kalici kopyasi. Saatlik kovalar SecureStore'un boyut sinirini asabilecegi icin
 * uygulamanin belge klasorunde (yedeklenen, sistemce silinmeyen alan) tek bir JSON dosyasinda tutulur; web'de
 * localStorage. Okuma/yazma hatasi uygulamayi bozmaz: bellekteki durum calismaya devam eder.
 */
const FILE_NAME = "mbfit-steps.json";
const WEB_KEY = "merfit.steps";

function stepFile(): File {
  return new File(Paths.document, FILE_NAME);
}

export async function loadStepState(): Promise<StepState | null> {
  try {
    if (Platform.OS === "web") {
      return parseStoredState(typeof window !== "undefined" ? window.localStorage?.getItem(WEB_KEY) ?? null : null);
    }
    const file = stepFile();
    if (!file.exists) return null;
    return parseStoredState(await file.text());
  } catch {
    return null;
  }
}

export async function saveStepState(state: StepState): Promise<void> {
  const raw = JSON.stringify(state);
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") window.localStorage?.setItem(WEB_KEY, raw);
      return;
    }
    const file = stepFile();
    if (!file.exists) file.create({ intermediates: true });
    await file.write(raw);
  } catch {
    // Bir sonraki kayitta tekrar denenir.
  }
}

/** Cikis yapildiginda cihazdaki adim verisini siler (baska kullanici gormesin). */
export async function clearStepState(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") window.localStorage?.removeItem(WEB_KEY);
      return;
    }
    const file = stepFile();
    if (file.exists) file.delete();
  } catch {
    // Yoksay.
  }
}
