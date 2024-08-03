# Fluidic Workflows

![chromium](https://img.shields.io/badge/supported-chromium-blue)
![chrome](https://img.shields.io/badge/supported-chrome-blue)
![firefox](https://img.shields.io/badge/pending-firefox-orange)
![safari](https://img.shields.io/badge/pending-safari-orange)
![edge](https://img.shields.io/badge/pending-edge-orange)

**Note**: This project is currently in alpha and prone to breaking changes.

## Overview

`Fluidic Workflows` is a browser extension for creating web-based automations
on the fly. Capture different actions automatically for later replay or create
fine-tuned steps in an intuitive, no-code way.

## Usage

Because this project is still early on, we have not released it on the various
extension platforms. Load the extension manually instead.

### Building

We use [pnpm](https://pnpm.io/) to build the project and manage dependencies.
Install and run the following:

```bash
$ pnpm install
$ pnpm dev
```

This will produce a `dist` directory containing the unpacked extension. Navigate
to `Chrome > Manage Extensions > Load unpacked` and select this directory.
Consider pinning the newly installed extension.

### Actions

The side panel contains four top-level tabs. We touch on each in turn.

#### Builder

![Screenshot from 2024-08-02 18-49-18](https://github.com/user-attachments/assets/4206bb0d-3ad0-4011-b9d3-f1912168f5ee)

This is the primary workhorse of the application. Here you can provide a sequence
of actions that can be replayed automatically later on. As of now, we have the
following actions available:

---

*Extracting*

![Screenshot from 2024-08-02 18-45-48](https://github.com/user-attachments/assets/f1f149c7-077e-4d29-bbc1-e5d562b46fc8)

Triggering this action converts your cursor to a crosshair and shows outlines
around elements you hover over. On each click, the plugin will record which element
you targeted. Name each capture you perform in this way for interpolating into
subsequent steps.

---

*Navigating*

![Screenshot from 2024-08-02 18-44-57](https://github.com/user-attachments/assets/ef71f4d3-ffae-4bac-8550-6403fb16db83)

Very simply navigates to the specified URL. You can use interpolated values in
the required field. For example, you can specify a URL like:

```
https://github.com/{PROFILE}
```

if you have a `PROFILE` interpolation available to you.

---

*OpenAI*

![Screenshot from 2024-08-02 18-46-53](https://github.com/user-attachments/assets/c3394c3a-ae2c-4539-8aea-46295a71172d)

Allows sending a custom chat completion request to [OpenAI](https://openai.com/).
The response is always formatted as a JSON object, though you are free to specify
what the keys of the object are. These key/value pairs will be available for
interpolating into subsequent steps.

Furthermore, you can use any interpolated values already available in both the
system and user prompt.

---

*Recording*

![Screenshot from 2024-08-02 18-47-21](https://github.com/user-attachments/assets/26116954-d78f-454a-bbfb-aaa64e68aacd)

Allows interacting with the webpage as normal, but captures clicks and key presses
automatically.

---

#### Library

![Screenshot from 2024-08-02 18-48-13](https://github.com/user-attachments/assets/af06935d-5ea9-4de5-8406-4b55e100350d)

A repository of all previously saved workflows. From here you can edit, delete, or
execute (i.e. *run*) the workflow.

#### Runner

![Screenshot from 2024-08-02 18-48-52](https://github.com/user-attachments/assets/f9cc2e3a-0102-4cdb-b514-e4259ff1a59b)

After running a workflow from your library, this tab will populate with details on
each step as they execute. It will also surface any errors encountered during.

#### Settings

![Screenshot from 2024-08-02 18-49-51](https://github.com/user-attachments/assets/d405f663-e8d3-4288-9f1d-a8964dc4b057)

One particular action available in the builder tab is the `OpenAI` action. This
sends a custom chat completion request to [OpenAI](https://openai.com/), but
requires an API key. You can configure the API key from here.

## Development

We use the [WXT](https://wxt.dev/) framework to give room for cross-platform
functionality, though efforts are currently focused on Chrome and Chromium-based
browsers. As such, organization of files mirror WXT's recommendations:

* `assets`
  * A collection of [Tailwind](https://tailwindcss.com/) layers.
* `components/ui`
  * We use the [shadcn/ui](https://ui.shadcn.com/) component framework. If
    looking to contribute, confirm any custom components do not have functional
    equivalents already available. A list of available components can be found
    [here](https://ui.shadcn.com/docs/components/).
* `components/icons`
  * SVG wrapped within a React component.
* `entrypoints/background.ts`
  * Corresponds to our service worker.
* `entrypoints/*.content`
  * Our content scripts. Fluidic works by injecting three different scripts into
    every page. The scripts themselves do not do meaningful work unless certain
    actions are invoked from the side panel.
* `entrypoints/sidepanel`
  * The primary entrypoint of the project. Contains most UI elements and
    recording/replaying functionality.
* `public`
  * Browser extension icons.
* `utils`
  * A collection of utility functions/types that can be useful across entrypoints.

### Formatting

Formatting depends on [prettier](https://prettier.io/). A `pre-commit` hook is
included in `.githooks` that can be used to format all `*.jsx?` and `*.tsx?`
files prior to commit. Install via:
```bash
$ git config --local core.hooksPath .githooks/
```
