import { render, screen } from "@testing-library/react-native";

import { mockThemeValue } from "../../../../../test/mockTheme";
import { GOAL_ILLUSTRATION_TEXT, GoalIllustration } from "../GoalIllustration";

jest.mock("../../../../../shared/theme/ThemeContext", () => ({ useTheme: () => mockThemeValue }));
jest.mock("../../../../../shared/motion/useReducedMotion", () => ({ useReducedMotion: () => true }));

describe("GoalIllustration", () => {
  it.each(["build_muscle", "get_stronger", "lose_weight"] as const)("%s icin kendi sahnesini ve metnini gosterir", (goal) => {
    render(<GoalIllustration goal={goal} />);
    expect(screen.getByTestId(`goal-illustration-${goal}`)).toBeTruthy();
    expect(screen.getByText(GOAL_ILLUSTRATION_TEXT[goal].text)).toBeTruthy();
  });

  it("eski hedef kodlarini ana hedefe esler, hedef yoksa yonlendirme metni gosterir", () => {
    const { rerender } = render(<GoalIllustration goal="maintain_weight" />);
    expect(screen.getByTestId("goal-illustration-build_muscle")).toBeTruthy();
    rerender(<GoalIllustration goal={null} />);
    expect(screen.getByTestId("goal-illustration-none")).toBeTruthy();
  });

  it("sonuc garantisi vermez", () => {
    for (const { text } of Object.values(GOAL_ILLUSTRATION_TEXT)) {
      expect(text).not.toMatch(/garanti|kesin|kesinlikle|\d+\s*(kg|gün|hafta)/i);
    }
  });
});
