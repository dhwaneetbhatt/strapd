import { AttachmentIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  type ButtonProps,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useRef, useState } from "react";

export interface FileUploadButtonProps {
  /** Callback when file is successfully loaded */
  onFileLoad: (content: string, filename: string) => void;
  /** Accepted file extensions (e.g., ['.json', '.xml', '.yaml']) */
  acceptedExtensions?: string[];
  /** Maximum file size in bytes (default: 10MB) */
  maxSizeInBytes?: number;
  /** Button size */
  size?: ButtonProps["size"];
  /** Button variant */
  variant?: ButtonProps["variant"];
  /** Show drag and drop area instead of just button */
  showDropZone?: boolean;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_EXTENSIONS = [".json", ".xml", ".yaml", ".yml", ".txt"];

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileLoad,
  acceptedExtensions = DEFAULT_EXTENSIONS,
  maxSizeInBytes = DEFAULT_MAX_SIZE,
  size = "sm",
  variant = "outline",
  showDropZone = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSizeInBytes) {
      const sizeMB = (maxSizeInBytes / (1024 * 1024)).toFixed(1);
      return `File size exceeds ${sizeMB}MB limit`;
    }

    // Check file extension
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!acceptedExtensions.includes(fileExtension)) {
      return `Unsupported file type. Accepted: ${acceptedExtensions.join(", ")}`;
    }

    return null;
  };

  const handleFile = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Invalid file",
        description: validationError,
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom-right",
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onFileLoad(content, file.name);
        toast({
          title: "File loaded",
          description: `${file.name} loaded successfully`,
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "bottom-right",
        });
      }
    };

    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "Failed to read file contents",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom-right",
      });
    };

    reader.readAsText(file, "UTF-8");
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  if (showDropZone) {
    return (
      <VStack spacing={2} w="full">
        <Box
          w="full"
          p={4}
          border="2px dashed"
          borderColor={isDragging ? "brand.500" : "border.muted"}
          borderRadius="md"
          bg={isDragging ? "brand.50" : "transparent"}
          cursor="pointer"
          transition="all 0.2s"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleButtonClick}
          _hover={{
            borderColor: "brand.400",
            bg: "gray.50",
          }}
        >
          <VStack spacing={2}>
            <AttachmentIcon boxSize={5} color="text.secondary" />
            <Text fontSize="sm" color="text.secondary" textAlign="center">
              Drag and drop a file here, or click to browse
            </Text>
            <Text fontSize="xs" color="text.tertiary">
              Accepted: {acceptedExtensions.join(", ")} (max{" "}
              {(maxSizeInBytes / (1024 * 1024)).toFixed(1)}MB)
            </Text>
          </VStack>
        </Box>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedExtensions.join(",")}
          onChange={handleFileInputChange}
          style={{ display: "none" }}
          aria-label="Upload file"
        />
      </VStack>
    );
  }

  return (
    <>
      <Button
        leftIcon={<AttachmentIcon />}
        onClick={handleButtonClick}
        size={size}
        variant={variant}
        aria-label="Upload file"
      >
        Upload File
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedExtensions.join(",")}
        onChange={handleFileInputChange}
        style={{ display: "none" }}
        aria-label="Upload file input"
      />
    </>
  );
};
