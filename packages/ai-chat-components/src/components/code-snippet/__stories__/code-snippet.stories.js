/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import "../src/code-snippet";
import { html } from "lit";
import { fn } from "storybook/test";

const javascriptCode = `function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return true;
}

greet("World");`;

const pythonCode = `def calculate_sum(a, b):
    """Calculate the sum of two numbers."""
    result = a + b
    print(f"The sum is: {result}")
    return result

total = calculate_sum(5, 3)`;

const longCode = `import React, { useState, useEffect } from 'react';

function UserDashboard({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(\`/api/users/\${userId}\`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div className="user-dashboard">
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </div>
  );
}

export default UserDashboard;`;

const inlineCode = `npm install carbon-ai-chat`;

export default {
  title: "Components/Code Snippet",
  argTypes: {
    type: {
      control: "select",
      options: ["single", "multi", "inline"],
      description: "The type of code snippet",
    },
    language: {
      control: "text",
      description: "Programming language for syntax highlighting",
    },
    dark: {
      control: "boolean",
      description: "Use dark theme",
    },
    editable: {
      control: "boolean",
      description: "Enable editing",
    },
    highlight: {
      control: "boolean",
      description: "Enable syntax highlighting",
    },
    disabled: {
      control: "boolean",
      description: "Disable the snippet",
    },
    hideCopyButton: {
      control: "boolean",
      description: "Hide the copy button",
    },
    wrapText: {
      control: "boolean",
      description: "Wrap text instead of scrolling",
    },
    maxCollapsedNumberOfRows: {
      control: "number",
      description: "Maximum rows when collapsed (multi-line only)",
    },
    minCollapsedNumberOfRows: {
      control: "number",
      description: "Minimum rows when collapsed (multi-line only)",
    },
    maxExpandedNumberOfRows: {
      control: "number",
      description: "Maximum rows when expanded (multi-line only)",
    },
    minExpandedNumberOfRows: {
      control: "number",
      description: "Minimum rows when expanded (multi-line only)",
    },
    showMoreText: {
      control: "text",
      description: "Text for expand button",
    },
    showLessText: {
      control: "text",
      description: "Text for collapse button",
    },
    tooltipContent: {
      control: "text",
      description: "Tooltip text for copy button",
    },
    feedback: {
      control: "text",
      description: "Feedback text after copying",
    },
    feedbackTimeout: {
      control: "number",
      description: "Duration to show feedback (ms)",
    },
    onContentChange: { action: "onContentChange" },
  },
};

export const Default = {
  args: {
    type: "single",
    language: "javascript",
    highlight: true,
    dark: false,
    editable: false,
    disabled: false,
    hideCopyButton: false,
    wrapText: false,
  },
  render: (args) => html`
    <cds-aichat-code-snippet
      type=${args.type}
      language=${args.language}
      ?dark=${args.dark}
      ?editable=${args.editable}
      ?highlight=${args.highlight}
      ?disabled=${args.disabled}
      ?hide-copy-button=${args.hideCopyButton}
      ?wrap-text=${args.wrapText}
    >
      ${javascriptCode}
    </cds-aichat-code-snippet>
  `,
};

export const MultiLine = {
  args: {
    type: "multi",
    language: "javascript",
    highlight: true,
    dark: false,
    editable: false,
    disabled: false,
    hideCopyButton: false,
    wrapText: false,
    maxCollapsedNumberOfRows: 15,
    minCollapsedNumberOfRows: 3,
    maxExpandedNumberOfRows: 0,
    minExpandedNumberOfRows: 16,
    showMoreText: "Show more",
    showLessText: "Show less",
  },
  render: (args) => html`
    <cds-aichat-code-snippet
      type=${args.type}
      language=${args.language}
      ?dark=${args.dark}
      ?editable=${args.editable}
      ?highlight=${args.highlight}
      ?disabled=${args.disabled}
      ?hide-copy-button=${args.hideCopyButton}
      ?wrap-text=${args.wrapText}
      max-collapsed-number-of-rows=${args.maxCollapsedNumberOfRows}
      min-collapsed-number-of-rows=${args.minCollapsedNumberOfRows}
      max-expanded-number-of-rows=${args.maxExpandedNumberOfRows}
      min-expanded-number-of-rows=${args.minExpandedNumberOfRows}
      show-more-text=${args.showMoreText}
      show-less-text=${args.showLessText}
    >
      ${longCode}
    </cds-aichat-code-snippet>
  `,
};

export const Inline = {
  args: {
    type: "inline",
    disabled: false,
    tooltipContent: "Copy to clipboard",
  },
  render: (args) => html`
    <p>
      To install the package, run
      <cds-aichat-code-snippet
        type=${args.type}
        ?disabled=${args.disabled}
        tooltip-content=${args.tooltipContent}
      >
        ${inlineCode}
      </cds-aichat-code-snippet>
      in your terminal.
    </p>
  `,
};

export const DarkTheme = {
  args: {
    type: "multi",
    language: "python",
    dark: true,
    highlight: true,
    editable: false,
    disabled: false,
    hideCopyButton: false,
    wrapText: false,
  },
  render: (args) => html`
    <div style="background: #161616; padding: 1rem;">
      <cds-aichat-code-snippet
        type=${args.type}
        language=${args.language}
        ?dark=${args.dark}
        ?editable=${args.editable}
        ?highlight=${args.highlight}
        ?disabled=${args.disabled}
        ?hide-copy-button=${args.hideCopyButton}
        ?wrap-text=${args.wrapText}
      >
        ${pythonCode}
      </cds-aichat-code-snippet>
    </div>
  `,
};

export const Editable = {
  args: {
    type: "multi",
    language: "javascript",
    highlight: true,
    dark: false,
    editable: true,
    disabled: false,
    hideCopyButton: false,
    wrapText: false,
    onContentChange: fn(),
  },
  render: (args) => html`
    <cds-aichat-code-snippet
      type=${args.type}
      language=${args.language}
      ?dark=${args.dark}
      ?editable=${args.editable}
      ?highlight=${args.highlight}
      ?disabled=${args.disabled}
      ?hide-copy-button=${args.hideCopyButton}
      ?wrap-text=${args.wrapText}
      .onContentChange=${args.onContentChange}
    >
      ${javascriptCode}
    </cds-aichat-code-snippet>
  `,
};

export const WithoutSyntaxHighlighting = {
  args: {
    type: "multi",
    language: "",
    highlight: false,
    dark: false,
    editable: false,
    disabled: false,
    hideCopyButton: false,
    wrapText: false,
  },
  render: (args) => html`
    <cds-aichat-code-snippet
      type=${args.type}
      ?dark=${args.dark}
      ?editable=${args.editable}
      ?highlight=${args.highlight}
      ?disabled=${args.disabled}
      ?hide-copy-button=${args.hideCopyButton}
      ?wrap-text=${args.wrapText}
    >
      ${javascriptCode}
    </cds-aichat-code-snippet>
  `,
};

export const Disabled = {
  args: {
    type: "single",
    language: "javascript",
    highlight: true,
    dark: false,
    editable: false,
    disabled: true,
    hideCopyButton: false,
    wrapText: false,
  },
  render: (args) => html`
    <cds-aichat-code-snippet
      type=${args.type}
      language=${args.language}
      ?dark=${args.dark}
      ?editable=${args.editable}
      ?highlight=${args.highlight}
      ?disabled=${args.disabled}
      ?hide-copy-button=${args.hideCopyButton}
      ?wrap-text=${args.wrapText}
    >
      ${javascriptCode}
    </cds-aichat-code-snippet>
  `,
};

export const WithTextWrapping = {
  args: {
    type: "multi",
    language: "javascript",
    highlight: true,
    dark: false,
    editable: false,
    disabled: false,
    hideCopyButton: false,
    wrapText: true,
  },
  render: (args) => html`
    <cds-aichat-code-snippet
      type=${args.type}
      language=${args.language}
      ?dark=${args.dark}
      ?editable=${args.editable}
      ?highlight=${args.highlight}
      ?disabled=${args.disabled}
      ?hide-copy-button=${args.hideCopyButton}
      ?wrap-text=${args.wrapText}
    >
      ${longCode}
    </cds-aichat-code-snippet>
  `,
};

export const NoCopyButton = {
  args: {
    type: "single",
    language: "javascript",
    highlight: true,
    dark: false,
    editable: false,
    disabled: false,
    hideCopyButton: true,
    wrapText: false,
  },
  render: (args) => html`
    <cds-aichat-code-snippet
      type=${args.type}
      language=${args.language}
      ?dark=${args.dark}
      ?editable=${args.editable}
      ?highlight=${args.highlight}
      ?disabled=${args.disabled}
      ?hide-copy-button=${args.hideCopyButton}
      ?wrap-text=${args.wrapText}
    >
      ${javascriptCode}
    </cds-aichat-code-snippet>
  `,
};
