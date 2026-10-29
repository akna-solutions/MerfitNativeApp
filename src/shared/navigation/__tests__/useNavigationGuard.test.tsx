import { act, renderHook } from "@testing-library/react-native";

import { NAVIGATION_GUARD_MS, useNavigationGuard } from "../useNavigationGuard";

describe("useNavigationGuard", () => {
  it("hizli ikinci dokunusu yok sayar, sure gecince tekrar izin verir", () => {
    const now = jest.spyOn(Date, "now").mockReturnValue(10_000);
    const push = jest.fn();
    const { result } = renderHook(() => useNavigationGuard());
    const onPress = result.current(push);

    act(() => {
      onPress("a");
      onPress("b");
    });
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("a");

    now.mockReturnValue(10_000 + NAVIGATION_GUARD_MS);
    act(() => onPress("c"));
    expect(push).toHaveBeenCalledTimes(2);
    now.mockRestore();
  });
});
