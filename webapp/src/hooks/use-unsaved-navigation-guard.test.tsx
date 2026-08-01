import { act, render, screen } from "@testing-library/react";
import type React from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useUnsavedNavigationGuard } from "./use-unsaved-navigation-guard";

type GuardApi = ReturnType<typeof useUnsavedNavigationGuard>;

const GuardHarness: React.FC<{
  when: boolean;
  onReady: (guard: GuardApi) => void;
}> = ({ when, onReady }) => {
  const guard = useUnsavedNavigationGuard(when);
  const location = useLocation();
  onReady(guard);
  return <output aria-label="Current route">{location.pathname}</output>;
};

describe("useUnsavedNavigationGuard", () => {
  afterEach(() => vi.restoreAllMocks());

  it("warns on refresh and exposes an accessible confirmation state", () => {
    vi.spyOn(window.history, "back").mockImplementation(() => undefined);
    let guard: GuardApi | undefined;
    render(
      <MemoryRouter initialEntries={["/pipes"]}>
        <GuardHarness
          when
          onReady={(next) => {
            guard = next;
          }}
        />
      </MemoryRouter>,
    );

    const beforeUnload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(beforeUnload);
    expect(beforeUnload.defaultPrevented).toBe(true);

    act(() => expect(guard?.requestNavigation("/cli")).toBe(false));
    expect(guard?.pendingNavigation).toEqual({ kind: "route", to: "/cli" });
    act(() => guard?.cancelNavigation());
    expect(guard?.isNavigationBlocked).toBe(false);
    expect(guard?.requestNavigation("/pipes")).toBe(true);
  });

  it("continues the requested route after confirmation", () => {
    vi.spyOn(window.history, "back").mockImplementation(() => undefined);
    let guard: GuardApi | undefined;
    render(
      <MemoryRouter initialEntries={["/pipes"]}>
        <GuardHarness
          when
          onReady={(next) => {
            guard = next;
          }}
        />
      </MemoryRouter>,
    );

    act(() => guard?.requestNavigation("/cli"));
    act(() => guard?.confirmNavigation());
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));

    expect(screen.getByLabelText("Current route")).toHaveTextContent("/cli");
  });

  it("intercepts browser back and restores the guard when cancelled", () => {
    vi.spyOn(window.history, "back").mockImplementation(() => undefined);
    const pushState = vi.spyOn(window.history, "pushState");
    let guard: GuardApi | undefined;
    render(
      <MemoryRouter initialEntries={["/pipes"]}>
        <GuardHarness
          when
          onReady={(next) => {
            guard = next;
          }}
        />
      </MemoryRouter>,
    );

    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    expect(guard?.pendingNavigation).toEqual({ kind: "back" });
    act(() => guard?.cancelNavigation());
    expect(pushState).toHaveBeenCalledTimes(2);
  });
});
