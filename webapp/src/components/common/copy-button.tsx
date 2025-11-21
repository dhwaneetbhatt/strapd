import { CheckIcon, CopyIcon } from "@chakra-ui/icons";
import { Button, useClipboard } from "@chakra-ui/react";
import type React from "react";

interface CopyButtonProps {
  value: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ value }) => {
  const { hasCopied, onCopy } = useClipboard(value);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onCopy();
    }
  };

  return (
    <Button
      type="button"
      variant="copy"
      leftIcon={hasCopied ? <CheckIcon /> : <CopyIcon />}
      onClick={onCopy}
      onKeyDown={handleKeyDown}
      isDisabled={!value}
    >
      {hasCopied ? "Copied!" : "Copy"}
    </Button>
  );
};
