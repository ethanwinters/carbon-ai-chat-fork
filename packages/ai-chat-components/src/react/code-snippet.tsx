/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import { createComponent } from "@lit/react";
import React from "react";
import { CarbonIcon } from "@carbon/web-components/es/globals/internal/icon-loader-utils.js";

// Export the actual class for the component that will *directly* be wrapped with React.
import CDSAIChatCodeSnippet from "../components/code-snippet/src/code-snippet.js";
import { withWebComponentBridge } from "./utils/withWebComponentBridge";
import { transformReactIconToCarbonIcon } from "./utils/iconTransform.js";

// Re-export the Action interface from the web component
export type { Action } from "../components/code-snippet/src/code-snippet.js";

/**
 * React-specific Action interface that accepts both CarbonIcon and React icon components.
 * This allows React developers to use @carbon/icons-react directly.
 */
export interface ReactAction {
  text: string;
  icon: CarbonIcon | React.ComponentType<any>;
  size?: string;
  fixed?: boolean;
  onClick: () => void;
}

// Base code snippet component from @lit/react
const BaseCodeSnippet = withWebComponentBridge(
  createComponent({
    tagName: "cds-aichat-code-snippet",
    elementClass: CDSAIChatCodeSnippet,
    react: React,
    events: {
      onChange: "content-change",
    },
  }),
);

/**
 * CodeSnippet component with automatic icon transformation support.
 *
 * Accepts actions with either CarbonIcon objects or React icon components from @carbon/icons-react.
 * React icons are automatically transformed to the CarbonIcon format expected by the web component.
 *
 * @example
 * ```tsx
 * import { Download } from '@carbon/icons-react';
 * import CodeSnippet from '@carbon/ai-chat-components/react/code-snippet';
 *
 * const actions = [
 *   { text: 'Download', icon: Download, onClick: () => console.log('Download') }
 * ];
 *
 * <CodeSnippet language="typescript" highlight actions={actions} overflow>
 *   {code}
 * </CodeSnippet>
 * ```
 */
const CodeSnippet = React.forwardRef<any, any>((props, ref) => {
  const { actions, ...restProps } = props;

  // Transform action icons if actions are provided
  const transformedActions = React.useMemo(() => {
    if (!actions) {
      return undefined;
    }

    return actions.map((action: ReactAction) => ({
      ...action,
      icon: transformReactIconToCarbonIcon(action.icon, 16),
    }));
  }, [actions]);

  return (
    <BaseCodeSnippet ref={ref} actions={transformedActions} {...restProps} />
  );
});

CodeSnippet.displayName = "CodeSnippet";

export default CodeSnippet;

// Made with Bob
