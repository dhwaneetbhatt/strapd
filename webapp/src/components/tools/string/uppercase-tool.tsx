import type React from "react";
import type { BaseToolProps } from "../base-tool";
import { SingleInputOutputTool } from "../single-input-output-tool";

export const UppercaseToolComponent: React.FC<BaseToolProps> = (props) => {
  return (
    <SingleInputOutputTool
      {...props}
      inputPlaceholder="Enter text to convert to uppercase..."
      outputPlaceholder="Uppercase text will appear here..."
    />
  );
};
