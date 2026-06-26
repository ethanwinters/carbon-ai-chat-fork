# CustomMarkdownRenderers

**Experimental.**

- Kind: Interface
- Category: React
- Reference: https://chat.carbondesignsystem.com/tag/latest/docs/interfaces/Type_reference.CustomMarkdownRenderers.html

Per-element renderer overrides for the React `ChatContainer`. Each callback
receives the parsed token data and returns a `ReactNode` that renders in
place of the default Carbon rendering. Return `null` to opt out of the
override for that particular descriptor — the default Carbon rendering
runs unchanged.

Callbacks fire once per matching element per render pass, including every
streaming chunk that adds or changes the element's contents. When the
underlying element stays in the document but its data changes (a new table
row, more code lines), the same `slotName` is reused and the callback is
invoked again with the updated payload.

## Signature

```ts
interface CustomMarkdownRenderers
```

## Members

### codeBlock

`codeBlock?: (args: MarkdownRendererCodeBlockArgs) => ReactNode`

**Experimental.**

Override the default rendering for fenced code blocks. Receives parsed
code-block data; return `null` to fall back to the default Carbon code
snippet renderer.

[Reference](https://chat.carbondesignsystem.com/tag/latest/docs/interfaces/Type_reference.CustomMarkdownRenderers.html#codeblock)

### table

`table?: (args: MarkdownRendererTableArgs) => ReactNode`

**Experimental.**

Override the default rendering for markdown tables. Receives parsed table
data; return `null` to fall back to the default Carbon table renderer.

[Reference](https://chat.carbondesignsystem.com/tag/latest/docs/interfaces/Type_reference.CustomMarkdownRenderers.html#table)
