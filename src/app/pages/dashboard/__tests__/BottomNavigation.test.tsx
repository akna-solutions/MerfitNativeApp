import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";

import { mockThemeValue } from "../../../../test/mockTheme";
import { BottomNavigation, NavTab } from "../components/BottomNavigation";

jest.mock("../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("../../../../shared/profile/ProfileContext", () => ({ useProfile: () => ({ profile: { firstName: "Reis" } }) }));
jest.mock("../../../../shared/motion/useReducedMotion", () => ({ useReducedMotion: () => true }));
// Gesture Handler'in yerel modulu jest'te yok; jestSetup.js'in yaptigi gibi bos bir modulle degistirilir
// (jest-utils'in fireGestureHandler'i jest tarafindaki kayit defterini kullanir).
jest.mock("react-native-gesture-handler/lib/commonjs/RNGestureHandlerModule", () => ({ __esModule: true, default: { install: () => undefined, attachGestureHandler: () => undefined, createGestureHandler: () => undefined, dropGestureHandler: () => undefined, updateGestureHandler: () => undefined, flushOperations: () => undefined } }));
jest.mock("react-native-gesture-handler/lib/module/RNGestureHandlerModule", () => ({ __esModule: true, default: { install: () => undefined, attachGestureHandler: () => undefined, createGestureHandler: () => undefined, dropGestureHandler: () => undefined, updateGestureHandler: () => undefined, flushOperations: () => undefined } }));
jest.mock("react-native-worklets", () => jest.requireActual("react-native-worklets/src/mock"));
jest.mock("react-native-reanimated", () => jest.requireActual("react-native-reanimated/mock"));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: () => null }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }) }));

// 4 sekme x 80 px + 2 x 4 px dolgu = 328 px genisliginde kapsul.
const PILL_WIDTH = 328;

function setup(active: NavTab | null = "home") {
  const onChange = jest.fn();
  const utils = render(<BottomNavigation active={active} onChange={onChange} />);
  act(() => {
    fireEvent(screen.getByTestId("navbar-pill"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: PILL_WIDTH, height: 64 } } });
  });
  return { onChange, ...utils };
}

describe("BottomNavigation", () => {
  it("dort ana menu ve ayri bir Store yuvarlak butonu gosterir", () => {
    setup();
    for (const id of ["home", "workouts", "nutrition", "profile"]) expect(screen.getByTestId(`nav-${id}`)).toBeTruthy();
    expect(screen.getByTestId("nav-circle")).toBeTruthy();
    expect(screen.queryByTestId("nav-progress")).toBeNull();
    expect(screen.getByLabelText("MB Shop")).toBeTruthy();
    expect(screen.getByLabelText("Profilim")).toBeTruthy();
  });

  it("Store gorunumunde Store menulerini ve uygulamaya donus butonunu gosterir", () => {
    const onChange = jest.fn();
    render(<BottomNavigation variant="store" active="orders" onChange={onChange} />);
    for (const id of ["store", "categories", "orders", "profile"]) expect(screen.getByTestId(`nav-${id}`)).toBeTruthy();
    expect(screen.getByTestId("nav-orders").props.accessibilityState.selected).toBe(true);
    fireEvent.press(screen.getByTestId("nav-circle"));
    expect(onChange).toHaveBeenLastCalledWith("home");
  });

  it("dokunma ile secim degistirir ve Store yuvarlak butonu bagimsiz calisir", () => {
    const { onChange } = setup();
    fireEvent.press(screen.getByTestId("nav-profile"));
    expect(onChange).toHaveBeenLastCalledWith("profile");
    fireEvent.press(screen.getByTestId("nav-workouts"));
    expect(onChange).toHaveBeenLastCalledWith("workouts");
    fireEvent.press(screen.getByTestId("nav-circle"));
    expect(onChange).toHaveBeenLastCalledWith("store");
  });

  it("secili menuyu erisilebilirlik durumunda isaretler", () => {
    const { rerender, onChange } = setup("nutrition");
    expect(screen.getByTestId("nav-nutrition").props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId("nav-home").props.accessibilityState.selected).toBe(false);

    rerender(<BottomNavigation active="profile" onChange={onChange} />);
    expect(screen.getByTestId("nav-profile").props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId("nav-nutrition").props.accessibilityState.selected).toBe(false);
  });

  it("gostergeyi surukleyip birakinca en yakin menuyu secer", async () => {
    const { onChange } = setup("home");
    // Gosterge Ana Sayfa hucresinde (x: 4..84). Orta noktadan tutulur, ~2.2 hucre saga surulur.
    act(() => {
      fireGestureHandler(getByGestureTestId("navbar-pan"), [
        { x: 44, translationX: 0, velocityX: 0 },
        { x: 100, translationX: 56, velocityX: 0 },
        { x: 220, translationX: 176, velocityX: 0 },
      ]);
    });
    // Gesture Handler/Worklets mock'unda UI->JS gecisi microtask ile calisir.
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("nutrition"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("gostergeyi sinirlarin otesine surukleyince son menuye oturur", async () => {
    const { onChange } = setup("home");
    act(() => {
      fireGestureHandler(getByGestureTestId("navbar-pan"), [
        { x: 44, translationX: 0, velocityX: 0 },
        { x: 400, translationX: 900, velocityX: 0 },
      ]);
    });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("profile"));
  });

  it("gosterge disindan baslayan kaydirma menuyu degistirmez", async () => {
    const { onChange } = setup("home");
    act(() => {
      fireGestureHandler(getByGestureTestId("navbar-pan"), [
        { x: 250, translationX: 0, velocityX: 0 },
        { x: 100, translationX: -150, velocityX: 0 },
      ]);
    });
    await act(async () => {});
    expect(onChange).not.toHaveBeenCalled();
  });
});
