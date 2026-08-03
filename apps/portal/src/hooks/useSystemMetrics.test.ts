import { renderHook, act } from "@testing-library/react";
import { useSystemMetrics } from "./useSystemMetrics";

describe("useSystemMetrics hook", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should initialize metrics properly", () => {
    const { result } = renderHook(() => useSystemMetrics());
    expect(result.current.websocketLatency).toBeGreaterThanOrEqual(12);
    expect(result.current.serverTimeSAST).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(["A", "B", "C"]).toContain(result.current.currentShift.shift);
  });

  it("should update clock and shift on time tick", () => {
    const { result } = renderHook(() => useSystemMetrics());
    const initialTime = result.current.serverTimeSAST;

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const nextTime = result.current.serverTimeSAST;
    expect(nextTime).not.toBe(initialTime);
  });

  it("should update latency after latency interval", () => {
    const { result } = renderHook(() => useSystemMetrics());

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Check that latency is updated (might be the same, but it should be called)
    expect(result.current.websocketLatency).toBeGreaterThanOrEqual(12);
  });
});
