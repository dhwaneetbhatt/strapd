import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type PendingNavigation = { kind: "route"; to: string } | { kind: "back" };

const GUARD_STATE_KEY = "strapdPipeEditGuard";

export const useUnsavedNavigationGuard = (when: boolean) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation>();
  const hasGuardEntry = useRef(false);
  const allowNextPop = useRef(false);
  const navigateAfterPop = useRef<string>();

  useEffect(() => {
    if (!when || hasGuardEntry.current) return;
    window.history.pushState(
      { [GUARD_STATE_KEY]: true },
      "",
      window.location.href,
    );
    hasGuardEntry.current = true;
  }, [when]);

  useEffect(() => {
    if (when || !hasGuardEntry.current) return;
    hasGuardEntry.current = false;
    allowNextPop.current = true;
    window.history.back();
  }, [when]);

  useEffect(() => {
    if (!when) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [when]);

  useEffect(() => {
    const handlePopState = () => {
      if (allowNextPop.current) {
        allowNextPop.current = false;
        const destination = navigateAfterPop.current;
        navigateAfterPop.current = undefined;
        if (destination) navigate(destination);
        return;
      }
      if (!when) return;
      hasGuardEntry.current = false;
      setPendingNavigation({ kind: "back" });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, when]);

  const requestNavigation = useCallback(
    (to: string): boolean => {
      if (!when || to === location.pathname) return true;
      setPendingNavigation({ kind: "route", to });
      return false;
    },
    [location.pathname, when],
  );

  const cancelNavigation = useCallback(() => {
    if (pendingNavigation?.kind === "back" && !hasGuardEntry.current) {
      window.history.pushState(
        { [GUARD_STATE_KEY]: true },
        "",
        window.location.href,
      );
      hasGuardEntry.current = true;
    }
    setPendingNavigation(undefined);
  }, [pendingNavigation]);

  const confirmNavigation = useCallback(() => {
    if (!pendingNavigation) return;
    const destination =
      pendingNavigation.kind === "route" ? pendingNavigation.to : undefined;
    setPendingNavigation(undefined);

    if (hasGuardEntry.current) {
      hasGuardEntry.current = false;
      allowNextPop.current = true;
      navigateAfterPop.current = destination;
      window.history.back();
      return;
    }

    if (destination) {
      navigate(destination);
      return;
    }
    allowNextPop.current = true;
    window.history.back();
  }, [navigate, pendingNavigation]);

  return {
    isNavigationBlocked: Boolean(pendingNavigation),
    pendingNavigation,
    requestNavigation,
    cancelNavigation,
    confirmNavigation,
  };
};
