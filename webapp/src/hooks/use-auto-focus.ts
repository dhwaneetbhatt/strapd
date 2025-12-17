import { useEffect, useRef } from "react";

export const useAutoFocus = <T extends HTMLElement>() => {
  const inputRef = useRef<T>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return inputRef;
};
