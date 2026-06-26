# LayoutConfig

- Kind: Interface
- Category: Config
- Reference: https://chat.carbondesignsystem.com/tag/latest/docs/interfaces/Type_reference.LayoutConfig.html

## Signature

```ts
interface LayoutConfig
```

## Members

### corners

`corners?: PerCornerConfig | CornersType`

Controls the corner style of the chat component.

Can be a simple CornersType value to apply to all corners:
```typescript
corners: CornersType.ROUND
```

Or a PerCornerConfig object to control each corner individually:
```typescript
corners: {
  startStart: CornersType.ROUND,  // top-left in LTR
  startEnd: CornersType.ROUND,    // top-right in LTR
  endStart: CornersType.SQUARE,   // bottom-left in LTR
  endEnd: CornersType.SQUARE      // bottom-right in LTR
}
```

Undefined corners in PerCornerConfig will fall back to CornersType.ROUND.

[Reference](https://chat.carbondesignsystem.com/tag/latest/docs/interfaces/Type_reference.LayoutConfig.html#corners)

### customProperties

`customProperties?: Partial<Record<LayoutCustomProperties, string>>`

CSS variable overrides for the chat UI. This is a convienience method, you may also set these properties via CSS.

Keys correspond to values from `LayoutCustomProperties` (e.g. `LayoutCustomProperties.height`),
which map to the underlying `--cds-aichat-…` custom properties.
Values are raw CSS values such as `"420px"`, `"9999"`, etc.

Example:
{ height: "560px", width: "420px" }

[Reference](https://chat.carbondesignsystem.com/tag/latest/docs/interfaces/Type_reference.LayoutConfig.html#customproperties)

### hasContentMaxWidth

`hasContentMaxWidth?: boolean`

Indicates if content inside the Carbon AI Chat widget should be constrained to a max-width.

At larger widths the card, carousel, options and conversational search response types
have pending issues.

[Reference](https://chat.carbondesignsystem.com/tag/latest/docs/interfaces/Type_reference.LayoutConfig.html#hascontentmaxwidth)

### showFrame

`showFrame?: boolean`

Indicates if the Carbon AI Chat widget should keep its border and box-shadow.

[Reference](https://chat.carbondesignsystem.com/tag/latest/docs/interfaces/Type_reference.LayoutConfig.html#showframe)
