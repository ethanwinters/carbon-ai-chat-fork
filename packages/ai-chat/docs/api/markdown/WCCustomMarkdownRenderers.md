# WCCustomMarkdownRenderers

**Experimental.**

- Kind: Interface
- Category: Web component
- Reference: https://chat.carbondesignsystem.com/tag/latest/docs/interfaces/Type_reference.WCCustomMarkdownRenderers.html

The web-component analogue of CustomMarkdownRenderers — same shape,
but each callback returns an `HTMLElement` (or `null`) instead of a React
node. Return `null` to opt out for a specific descriptor and use the
default Carbon rendering instead.

Callbacks fire once per matching element per render pass; return the same
element reference across renders to avoid unnecessary DOM churn.

## Signature

```ts
interface WCCustomMarkdownRenderers
```

## Members

### codeBlock

`codeBlock?: (args: MarkdownRendererCodeBlockArgs) => HTMLElement`

**Experimental.**

Override the default rendering for fenced code blocks. Receives parsed
code-block data; return `null` to fall back to the default Carbon code
snippet renderer.

[Reference](https://chat.carbondesignsystem.com/tag/latest/docs/interfaces/Type_reference.WCCustomMarkdownRenderers.html#codeblock)

### table

`table?: (args: MarkdownRendererTableArgs) => HTMLElement`

**Experimental.**

Override the default rendering for markdown tables. Receives parsed table
data; return `null` to fall back to the default Carbon table renderer.

[Reference](https://chat.carbondesignsystem.com/tag/latest/docs/interfaces/Type_reference.WCCustomMarkdownRenderers.html#table)

## Related

- [CustomMarkdownRenderers](./CustomMarkdownRenderers.md)
