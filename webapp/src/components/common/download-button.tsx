import { DownloadIcon } from "@chakra-ui/icons";
import { Button, type ButtonProps, useToast } from "@chakra-ui/react";
import type React from "react";

export interface DownloadButtonProps {
  /** Content to download */
  content: string;
  /** Filename for the download (e.g., "output.json") */
  filename: string;
  /** Button size */
  size?: ButtonProps["size"];
  /** Button variant */
  variant?: ButtonProps["variant"];
  /** Disabled state */
  disabled?: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  content,
  filename,
  size = "sm",
  variant = "outline",
  disabled = false,
}) => {
  const toast = useToast();

  const handleDownload = () => {
    if (!content || !content.trim()) {
      toast({
        title: "Nothing to download",
        description: "The output is empty",
        status: "warning",
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
      return;
    }

    try {
      // Create a blob from the content
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });

      // Create a temporary download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      // Trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded",
        description: `${filename} downloaded successfully`,
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download file",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  };

  return (
    <Button
      leftIcon={<DownloadIcon />}
      onClick={handleDownload}
      size={size}
      variant={variant}
      isDisabled={disabled || !content || !content.trim()}
      aria-label="Download file"
    >
      Download
    </Button>
  );
};
