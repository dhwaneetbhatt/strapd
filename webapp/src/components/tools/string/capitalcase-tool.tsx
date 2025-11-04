import type React from "react";
import type { BaseToolProps } from "../base-tool";
import { SingleInputOutputTool } from "../single-input-output-tool";

export const CapitalcaseToolComponent: React.FC<BaseToolProps> = (props) => {
  return (
    <SingleInputOutputTool
      {...props}
      inputPlaceholder="Enter text to convert to capitalcase..."
      outputPlaceholder="Capitalcase text will appear here..."
    />
  );
};
