import type React from "react";
import type { BaseToolProps } from "../base-tool";
import { SingleInputOutputTool } from "../single-input-output-tool";

export const LowercaseToolComponent: React.FC<BaseToolProps> = (props) => {
  return (
    <SingleInputOutputTool
      {...props}
      inputPlaceholder="Enter text to convert to lowercase..."
      outputPlaceholder="Lowercase text will appear here..."
    />
  );
};
