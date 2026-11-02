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

// Ana gorunum, 351 px navbar: 2 yuvarlak menu (56) + aksiyon butonu (56) + 3 bosluk (6) = 186 px; secili hap 165 px.
// Sekmeler arasi adim 56 + 6 = 62 px.
const BAR_WIDTH = 351;

function setup(active: NavTab | null = "home") {
  const onChange = jest.fn();
  const utils = render(<BottomNavigation active={active} onChange={onChange} />);
  act(() => {
    fireEvent(screen.getByTestId("navbar-bar"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: BAR_WIDTH, height: 56 } } });
  });
  return { onChange, ...utils };
}

describe("BottomNavigation", () => {
  it("uc ana menu ve ayri bir Store yuvarlak butonu gosterir; Profilim menusu yoktur", () => {
    setup();
    for (const id of ["home", "workouts", "nutrition"]) expect(screen.getByTestId(`nav-${id}`)).toBeTruthy();
    expect(screen.getByTestId("nav-circle")).toBeTruthy();
    expect(screen.queryByTestId("nav-progress")).toBeNull();
    expect(screen.queryByTestId("nav-profile")).toBeNull();
    expect(screen.getByLabelText("MB Shop")).toBeTruthy();
  });

  it("Store gorunumunde Anasayfa, Kategoriler, Sepetim ve uygulamaya donus butonunu gosterir", () => {
    const onChange = jest.fn();
    render(<BottomNavigation variant="store" active="cart" onChange={onChange} />);
    for (const id of ["store", "categories", "cart"]) expect(screen.getByTestId(`nav-${id}`)).toBeTruthy();
    expect(screen.queryByTestId("nav-orders")).toBeNull();
    expect(screen.queryByTestId("nav-profile")).toBeNull();
    expect(screen.getByTestId("nav-cart").props.accessibilityState.selected).toBe(true);
    fireEvent.press(screen.getByTestId("nav-circle"));
    expect(onChange).toHaveBeenLastCalledWith("home");
  });

  it("dokunma ile secim degistirir ve Store yuvarlak butonu bagimsiz calisir", () => {
    const { onChange } = setup();
    fireEvent.press(screen.getByTestId("nav-nutrition"));
    expect(onChange).toHaveBeenLastCalledWith("nutrition");
    fireEvent.press(screen.getByTestId("nav-workouts"));
    expect(onChange).toHaveBeenLastCalledWith("workouts");
    fireEvent.press(screen.getByTestId("nav-circle"));
    expect(onChange).toHaveBeenLastCalledWith("store");
  });

  it("secili menuyu erisilebilirlik durumunda isaretler", () => {
    const { rerender, onChange } = setup("nutrition");
    expect(screen.getByTestId("nav-nutrition").props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId("nav-home").props.accessibilityState.selected).toBe(false);

    rerender(<BottomNavigation active="workouts" onChange={onChange} />);
    expect(screen.getByTestId("nav-workouts").props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId("nav-nutrition").props.accessibilityState.selected).toBe(false);

    // Profil sayfasindayken (navbar'da karsiligi yok) hicbir menu secili gorunmez.
    rerender(<BottomNavigation active="profile" onChange={onChange} />);
    for (const id of ["home", "workouts", "nutrition"]) expect(screen.getByTestId(`nav-${id}`).props.accessibilityState.selected).toBe(false);
  });

  it("secili menuyu genis hap olarak, digerlerini etiketsiz yuvarlak buton olarak gosterir", () => {
    setup("workouts");
    expect(screen.getByText("Antrenman")).toBeTruthy();
    expect(screen.queryByText("Ana Sayfa")).toBeNull();
    expect(screen.queryByText("Beslenme")).toBeNull();
  });

  it("hapi surukleyip birakinca en yakin menuyu secer", async () => {
    const { onChange } = setup("home");
    // Hap Ana Sayfa'da (x: 0..165). Tutulup ~2 adim (124 px) saga surulur.
    act(() => {
      fireGestureHandler(getByGestureTestId("navbar-pan"), [
        { x: 44, translationX: 0, velocityX: 0 },
        { x: 100, translationX: 56, velocityX: 0 },
        { x: 168, translationX: 124, velocityX: 0 },
      ]);
    });
    // Gesture Handler/Worklets mock'unda UI->JS gecisi microtask ile calisir.
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("nutrition"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("hapi sinirlarin otesine surukleyince son menuye oturur", async () => {
    const { onChange } = setup("home");
    act(() => {
      fireGestureHandler(getByGestureTestId("navbar-pan"), [
        { x: 44, translationX: 0, velocityX: 0 },
        { x: 400, translationX: 900, velocityX: 0 },
      ]);
    });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("nutrition"));
  });

  it("hap disindan baslayan kaydirma menuyu degistirmez", async () => {
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
