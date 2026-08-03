import { renderHook } from "@testing-library/react";
import { useAdaptivePerformance } from "./useAdaptivePerformance";

describe("useAdaptivePerformance", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns false initially", () => {
    const { result } = renderHook(() => useAdaptivePerformance());
    expect(result.current).toBe(false);
  });
});
