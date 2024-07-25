# Fluidic Workflows

A browser extension for creating new automated workflows.

## Building

We use [WXT](https://wxt.dev/) to give room for cross-platform functionality,
though currently efforts are focused on Chrome and Chromium-based browsers. To
build and run, use:

```bash
$ pnpm install
$ pnpm dev
```

## Formatting

Formatting depends on [prettier](https://prettier.io/). A `pre-commit` hook is
included in `.githooks` that can be used to format all `*.jsx?` and `*.tsx?`
files prior to commit. Install via:
```bash
$ git config --local core.hooksPath .githooks/
```
