# Demo site MCP App integration

## Summary

Integrate a **mock MCP App** into the demo site in **all three render modes**
(`inline`, `fullscreen`, `pip`) for both the **React** and **Web Components**
versions of the demo site. The exact app content is **TBD** and should be decided
within this issue.

## Goals

- Demonstrate MCP App rendering in **inline**, **fullscreen**, and **pip** modes.
- Support both React and Web Components demo site variants.
- Provide a simple mock MCP App that clearly shows rendering + lifecycle.

## Non-Goals

- Connecting to a real MCP server (mock only).
- Production styling or final visual design.

## Open decisions

- What should the mock MCP App display? (Pick a simple UI that tests resizing,
  input, and events.)

## Implementation outline

- Build a static mock MCP App HTML page.
- Wire mock `mcp_app` items for each display mode.
- Add demo controls to switch modes and simulate tool input/result.
- Ensure behavior is consistent across React + Web Components demos.

## Acceptance criteria

- Demo site shows MCP App in all 3 modes for both React and Web Components.
- Mock app content is finalized and documented.
- Demo includes basic controls for mode switching.
