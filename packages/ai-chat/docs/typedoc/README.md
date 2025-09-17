# Custom TypeDoc Theme for Carbon AI Chat

This workspace ships a fully custom TypeDoc theme that mirrors the upstream
`default` theme and layers Carbon Design System primitives on top. All theme
files live under `packages/ai-chat/docs/typedoc/theme/`.

## Theme structure

```
packages/ai-chat/docs/typedoc/theme/
├── helpers/              # Additional render utilities (e.g. Carbon side nav)
├── layouts/              # The default layout rewritten with Carbon UI Shell
├── templates/            # Page templates (document, reflection, index, ...)
├── utils/                # Local helpers that wrap TypeDoc behaviour
├── assets/               # Carbon-specific JS + CSS copied to the output
└── index.js              # Theme entry point extending TypeDoc's DefaultTheme
```

`layouts/default.js` is the HTML shell. It renders Carbon `<cds-header>`,
`<cds-side-nav>`, and `<cds-content>` elements directly and feeds them the data
that TypeDoc normally sends to its Handlebars templates. The helper
`helpers/carbonNavigation.js` reads TypeDoc's navigation tree and emits Carbon
side-nav markup without any post-render DOM rewriting.

Templates in `templates/` started as copies of TypeDoc's defaults
(`node_modules/typedoc/dist/lib/output/themes/default/templates`). We keep them
locally so future tweaks (for example, Carbon-specific typography wrappers) can
be made without touching `node_modules`.

Theme assets are copied at build time by `carbonThemePlugin.js`:

- `assets/carbonTheme.css` – Carbon look & feel, nav scroll behaviour, hiding
  the legacy `.site-menu` block for crawlers.
- `assets/carbonSearch.js` / `assets/carbonSearchModal.js` – wraps TypeDoc's
  search UI in a Carbon modal.
- `assets/redirectToOverview.js`, `assets/cookiePreferences.js` – IBM-specific
  behaviour carried over from the previous docs site.

## How TypeDoc loads the theme

`packages/ai-chat/typedoc.json` points at the local plugin and selects the
`carbon` theme. The plugin registers our `CarbonTheme` subclass (which extends
TypeDoc's `DefaultTheme`) so TypeDoc reads templates and layouts from this
folder. Rendering still uses TypeDoc's JSX renderer; no Handlebars files are
involved in this configuration.

## Useful references

- TypeDoc theme basics: https://typedoc.org/guides/themes/
- Default theme source: https://github.com/TypeStrong/typedoc/tree/master/src/lib/output/themes/default
- Carbon Web Components UI Shell: https://web-components.carbondesignsystem.com/?path=/docs/components-ui-shell--overview
- IBM cookie preferences guidance: https://www.ibm.com/trust/consent

Keeping the upstream theme handy makes it easier to diff future TypeDoc
upgrades. When updating TypeDoc, recopy the relevant default files and reapply
our overrides.
