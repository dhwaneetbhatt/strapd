import { CheckIcon, CopyIcon } from "@chakra-ui/icons";
import { Button, type ButtonProps, useClipboard } from "@chakra-ui/react";
import type React from "react";

interface CopyButtonProps extends Omit<ButtonProps, "onClick" | "value"> {
  value: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ value, ...props }) => {
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
      {...props}
    >
      {hasCopied ? "Copied!" : "Copy"}
    </Button>
  );
};
