import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { getAchievements, markAchievementsSeen } from "../../../services/api/achievements";
import { mockThemeValue } from "../../../test/mockTheme";
import { AchievementCelebration } from "../AchievementCelebration";
import { resetAchievementCelebrationState, useAchievementCelebration } from "../useAchievementCelebration";

jest.mock("../../theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../motion/useReducedMotion", () => ({ useReducedMotion: () => true }));
jest.mock("expo-router", () => {
  const React = jest.requireActual("react");
  return { useFocusEffect: (effect: () => void | (() => void)) => React.useEffect(effect, [effect]) };
});
jest.mock("../../../services/api/achievements", () => ({
  getAchievements: jest.fn(),
  markAchievementsSeen: jest.fn(),
}));

const getMock = getAchievements as jest.Mock;
const seenMock = markAchievementsSeen as jest.Mock;

const badge = (id: number, title: string) => ({
  id, code: `b${id}`, title, description: "İlk antrenmanını tamamladın.", icon: "workouts", points: 50, earned: true, earnedAt: "2026-10-29T08:00:00Z",
});

function Host() {
  const { current, dismiss } = useAchievementCelebration();
  return <AchievementCelebration achievement={current} onClose={dismiss} />;
}

describe("useAchievementCelebration", () => {
  beforeEach(() => {
    resetAchievementCelebrationState();
    getMock.mockReset();
    seenMock.mockReset().mockResolvedValue(undefined);
  });

  it("yeni rozetleri sirayla gosterir ve her birini gosterildiginde bir kez 'goruldu' isaretler", async () => {
    getMock.mockResolvedValue({ earnedCount: 2, totalCount: 5, achievements: [], newlyEarned: [badge(1, "İlk Adım"), badge(2, "Seri")] });
    render(<Host />);

    expect(await screen.findByText("İlk Adım")).toBeTruthy();
    expect(screen.getByText("+50 MB FIT puanı")).toBeTruthy();
    expect(seenMock).toHaveBeenCalledWith([1]);

    fireEvent.press(screen.getByTestId("achievement-celebration-close"));
    expect(await screen.findByText("Seri")).toBeTruthy();
    expect(seenMock).toHaveBeenCalledWith([2]);

    fireEvent.press(screen.getByTestId("achievement-celebration-close"));
    await waitFor(() => expect(screen.queryByTestId("achievement-celebration")).toBeNull());
    expect(seenMock).toHaveBeenCalledTimes(2);
  });

  it("ayni rozeti ayni oturumda tekrar gostermez ve kontrolu sik tekrarlamaz", async () => {
    getMock.mockResolvedValue({ earnedCount: 1, totalCount: 5, achievements: [], newlyEarned: [badge(1, "İlk Adım")] });
    const first = render(<Host />);
    await screen.findByText("İlk Adım");
    fireEvent.press(screen.getByTestId("achievement-celebration-close"));
    first.unmount();

    render(<Host />);
    await act(async () => undefined);
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("achievement-celebration")).toBeNull();
  });

  it("yeni rozet yoksa hicbir sey gostermez", async () => {
    getMock.mockResolvedValue({ earnedCount: 0, totalCount: 5, achievements: [], newlyEarned: [] });
    render(<Host />);
    await act(async () => undefined);
    expect(screen.queryByTestId("achievement-celebration")).toBeNull();
    expect(seenMock).not.toHaveBeenCalled();
  });
});
