import type { FluidicElement } from "./dom"

// An enumeration of ARIA roles. We ignore the notion of required states and
// properties throughout.
const ROLES: {
  [key: string]: {
    // HTML elements implicitly grouped into this role.
    html?: {
      name: string
      // Optional attributes an element must match.
      attrs?: Record<string, string | null>
    }[]
    // Other roles this one is implicitly grouped into.
    suproles?: string[]
    // Other roles implicitly grouped into this one.
    subroles?: string[]
    // An HTMLElement satisfies this role iff it is nested within one of the
    // specified elements. An empty (or undefined) list means there is no
    // context to consider.
    context?: string[]
    // An HTMLElement satisfies this role iff at least one member of the list
    // is a proper descendant.
    owns?: string[]
  }
} = {
  // https://www.w3.org/TR/wai-aria-1.2/#alert
  alert: {
    suproles: ["section"],
    subroles: ["alertdialog"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#alertdialog
  alertdialog: {
    suproles: ["alert", "dialog"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#application
  application: {
    suproles: ["application"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#article
  article: {
    html: [{ name: "article" }],
    suproles: ["document"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#banner
  banner: {
    suproles: ["landmark"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#blockquote
  blockquote: {
    html: [{ name: "blockquote" }],
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#button
  button: {
    html: [{ name: "button" }, { name: "input", attrs: { type: "button" } }],
    suproles: ["command"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#caption
  caption: {
    html: [{ name: "caption" }, { name: "figcaption" }],
    suproles: ["section"],
    context: ["figure", "grid", "table", "treegrid"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#cell
  cell: {
    html: [{ name: "td" }],
    suproles: ["section"],
    subroles: ["columnheader", "gridcell", "rowheader"],
    context: ["row"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#checkbox
  checkbox: {
    html: [{ name: "input", attrs: { type: "checkbox" } }],
    suproles: ["input"],
    subroles: ["switch"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#code
  code: {
    html: [{ name: "code" }],
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#columnheader
  columnheader: {
    html: [{ name: "th", attrs: { scope: "col" } }],
    suproles: ["cell", "gridcell", "sectionhead"],
    context: ["row"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#combobox
  combobox: {
    html: [{ name: "select" }],
    suproles: ["input"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#command
  command: {
    suproles: ["widget"],
    subroles: ["button", "link", "menuitem"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#complementary
  complementary: {
    suproles: ["landmark"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#composite
  composite: {
    suproles: ["widget"],
    subroles: ["grid", "select", "spinbutton", "tablist"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#contentinfo
  contentinfo: {
    suproles: ["landmark"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#definition
  definition: {
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#deletion
  deletion: {
    html: [{ name: "del" }],
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#dialog
  dialog: {
    suproles: ["window"],
    subroles: ["alertdialog"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#directory
  directory: {
    suproles: ["list"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#document
  document: {
    suproles: ["structure"],
    subroles: ["article"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#emphasis
  emphasis: {
    html: [{ name: "em" }],
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#feed
  feed: {
    suproles: ["list"],
    owns: ["article"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#figure
  figure: {
    html: [{ name: "figure" }],
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#form
  form: {
    html: [{ name: "form" }],
    suproles: ["landmark"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#generic
  generic: {
    html: [{ name: "div" }, { name: "span" }],
    suproles: ["structure"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#grid
  grid: {
    html: [{ name: "table" }],
    suproles: ["composite", "table"],
    subroles: ["treegrid"],
    owns: ["row"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#gridcell
  gridcell: {
    html: [{ name: "td" }],
    suproles: ["cell", "widget"],
    subroles: ["columnheader", "rowheader"],
    context: ["row"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#group
  group: {
    html: [{ name: "fieldset" }],
    suproles: ["section"],
    subroles: ["row", "select", "toolbar"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#heading
  heading: {
    html: [
      { name: "h1" },
      { name: "h2" },
      { name: "h3" },
      { name: "h4" },
      { name: "h5" },
      { name: "h6" },
    ],
    suproles: ["sectionhead"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#img
  img: {
    html: [{ name: "img" }],
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#input
  input: {
    suproles: ["widget"],
    subroles: [
      "checkbox",
      "combobox",
      "option",
      "radio",
      "slider",
      "spinbutton",
      "textbox",
    ],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#insertion
  insertion: {
    html: [{ name: "ins" }],
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#landmark
  landmark: {
    suproles: ["section"],
    subroles: [
      "banner",
      "complementary",
      "contentinfo",
      "form",
      "main",
      "navigation",
      "region",
      "search",
    ],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#link
  link: {
    html: [{ name: "a" }, { name: "link" }],
    suproles: ["command"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#list
  list: {
    html: [{ name: "ol" }, { name: "ul" }],
    suproles: ["section"],
    subroles: ["directory", "feed"],
    owns: ["listitem"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#listbox
  listbox: {
    html: [{ name: "select" }],
    suproles: ["select"],
    owns: ["option"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#listitem
  listitem: {
    html: [{ name: "li" }],
    suproles: ["section"],
    subroles: ["treeitem"],
    context: ["directory", "list"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#log
  log: {
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#main
  main: {
    suproles: ["landmark"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#marquee
  marquee: {
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#math
  math: {
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#meter
  meter: {
    html: [{ name: "meter" }],
    suproles: ["range"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#menu
  menu: {
    suproles: ["select"],
    subroles: ["menubar"],
    owns: ["menuitem", "menuitemradio", "menuitemcheckbox"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#menubar
  menubar: {
    suproles: ["menu"],
    owns: ["menuitem", "menuitemradio", "menuitemcheckbox"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#menuitem
  menuitem: {
    suproles: ["command"],
    subroles: ["menuitemcheckbox"],
    context: ["group", "menu", "menubar"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#menuitemcheckbox
  menuitemcheckbox: {
    suproles: ["menuitem"],
    subroles: ["menuitemradio"],
    context: ["group", "menu", "menubar"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#menuitemradio
  menuitemradio: {
    suproles: ["menuitemcheckbox"],
    context: ["group", "menu", "menubar"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#navigation
  navigation: {
    html: [{ name: "nav" }],
    suproles: ["landmark"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#none
  none: {},
  // https://www.w3.org/TR/wai-aria-1.2/#note
  note: {
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#option
  option: {
    html: [{ name: "option" }],
    suproles: ["input"],
    subroles: ["treeitem"],
    context: ["group", "listbox"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#paragraph
  paragraph: {
    html: [{ name: "p" }],
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#presentation
  presentation: {
    suproles: ["structure"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#progressbar
  progressbar: {
    suproles: ["range", "widget"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#radio
  radio: {
    html: [{ name: "input", attrs: { type: "radio" } }],
    suproles: ["input"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#radiogroup
  radiogroup: {
    suproles: ["select"],
    owns: ["radio"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#range
  range: {
    suproles: ["structure"],
    subroles: ["meter", "progressbar", "scrollbar", "slider", "spinbutton"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#region
  region: {
    html: [{ name: "section" }],
    suproles: ["landmark"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#roletype
  roletype: {
    subroles: ["structure", "widget", "window"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#row
  row: {
    html: [{ name: "tr" }],
    suproles: ["group", "widget"],
    context: ["grid", "rowgroup", "table", "treegrid"],
    owns: ["cell", "columnheader", "gridcell", "rowheader"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#rowgroup
  rowgroup: {
    html: [{ name: "tbody" }, { name: "tfoot" }, { name: "thead" }],
    suproles: ["structure"],
    context: ["grid", "table", "treegrid"],
    owns: ["row"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#rowheader
  rowheader: {
    html: [{ name: "th", attrs: { scope: "row" } }],
    suproles: ["cell", "gridcell", "sectionhead"],
    context: ["row"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#scrollbar
  scrollbar: {
    suproles: ["range", "widget"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#search
  search: {
    suproles: ["landmark"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#searchbox
  searchbox: {
    html: [{ name: "input", attrs: { type: "search" } }],
    suproles: ["textbox"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#section
  section: {
    suproles: ["structure"],
    subroles: [
      "alert",
      "blockquote",
      "caption",
      "cell",
      "code",
      "definition",
      "deletion",
      "emphasis",
      "figure",
      "group",
      "img",
      "insertion",
      "landmark",
      "list",
      "listitem",
      "log",
      "marquee",
      "math",
      "note",
      "paragraph",
      "status",
      "strong",
      "subscript",
      "superscript",
      "table",
      "tabpanel",
      "term",
      "time",
      "tooltip",
    ],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#sectionhead
  sectionhead: {
    suproles: ["structure"],
    subroles: ["columnheader", "heading", "rowheader", "tab"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#select
  select: {
    suproles: ["composite", "group"],
    subroles: ["listbox", "menu", "radiogroup", "tree"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#separator
  separator: {
    html: [{ name: "hr" }],
    suproles: ["structure", "widget"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#slider
  slider: {
    suproles: ["input", "range"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#spinbutton
  spinbutton: {
    suproles: ["composite", "input", "range"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#status
  status: {
    suproles: ["section"],
    subroles: ["timer"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#strong
  strong: {
    html: [{ name: "strong" }],
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#structure
  structure: {
    suproles: ["roletype"],
    subroles: [
      "application",
      "document",
      "generic",
      "presentation",
      "range",
      "rowgroup",
      "section",
      "sectionhead",
      "separator",
    ],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#subscript
  subscript: {
    html: [{ name: "sub" }],
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#superscript
  superscript: {
    html: [{ name: "sup" }],
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#switch
  switch: {
    suproles: ["checkbox"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#tab
  tab: {
    suproles: ["sectionhead", "widget"],
    context: ["tablist"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#table
  table: {
    html: [{ name: "table" }],
    suproles: ["section"],
    subroles: ["grid"],
    owns: ["row"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#tablist
  tablist: {
    suproles: ["composite"],
    owns: ["tab"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#tabpanel
  tabpanel: {
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#term
  term: {
    html: [{ name: "dfn" }],
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#textbox
  textbox: {
    html: [
      { name: "textarea" },
      { name: "input", attrs: { type: null } },
      { name: "input", attrs: { type: "date" } },
      { name: "input", attrs: { type: "datetime-local" } },
      { name: "input", attrs: { type: "email" } },
      { name: "input", attrs: { type: "month" } },
      { name: "input", attrs: { type: "number" } },
      { name: "input", attrs: { type: "password" } },
      { name: "input", attrs: { type: "tel" } },
      { name: "input", attrs: { type: "text" } },
      { name: "input", attrs: { type: "time" } },
    ],
    suproles: ["input"],
    subroles: ["searchbox"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#time
  time: {
    html: [{ name: "time" }],
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#timer
  timer: {
    suproles: ["status"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#toolbar
  toolbar: {
    suproles: ["group"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#tooltip
  tooltip: {
    suproles: ["section"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#tree
  tree: {
    suproles: ["select"],
    subroles: ["treegrid"],
    owns: ["treeitem"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#treegrid
  treegrid: {
    suproles: ["grid", "tree"],
    owns: ["row"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#treeitem
  treeitem: {
    suproles: ["listitem", "option"],
    context: ["group", "tree"],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#widget
  widget: {
    suproles: ["roletype"],
    subroles: [
      "command",
      "composite",
      "gridcell",
      "input",
      "progressbar",
      "row",
      "scrollbar",
      "separator",
      "tab",
    ],
  },
  // https://www.w3.org/TR/wai-aria-1.2/#window
  window: {
    suproles: ["roletype"],
    subroles: ["dialog"],
  },
}

export const getRole = (el: FluidicElement): string | undefined => {
  const roleAttr = el.getAttribute("role")
  if (roleAttr) {
    return roleAttr
  }

  // TODO: We should take into account `context` and `owns`.
  const tagName = el.tagName.toLowerCase()
  for (const [role, value] of Object.entries(ROLES)) {
    for (const html of value.html ?? []) {
      if (tagName !== html.name) {
        continue
      }
      if (!html.attrs) {
        return role
      }
      let failed = false
      for (const [attrKey, attrVal] of Object.entries(html.attrs)) {
        if (el.getAttribute(attrKey) !== attrVal) {
          failed = true
          break
        }
      }
      if (failed) {
        continue
      }
      return role
    }
  }

  return undefined
}

export const subrolesOf = (role: string): string[] => {
  const subroles = []

  const pending = [role]
  while (pending.length > 0) {
    const next = pending.shift()!
    pending.push(...(ROLES[next]?.subroles ?? []))
    // Even if `next` isn't in ROLES, push anyways. This accounts for cases
    // where a site specifies an unknown role - we can still match on it.
    subroles.push(next)
  }

  return subroles
}
