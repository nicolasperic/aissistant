import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding AI practice tests...");

  const certId = "cert-ad0-e727";
  const [secTheme, secLayouts, secJs] = await Promise.all([
    prisma.certSection.findUniqueOrThrow({ where: { id: "sec-theme-design" } }),
    prisma.certSection.findUniqueOrThrow({ where: { id: "sec-layouts" } }),
    prisma.certSection.findUniqueOrThrow({ where: { id: "sec-js-ui" } }),
  ]);

  // ─── Clean up old AI placeholder questions ─────────────────────────────────

  const oldAiIds = ["q-ai-th-001", "q-ai-ly-001", "q-ai-js-001", "q-ai-ch-001"];
  await prisma.practiceTestQuestion.deleteMany({ where: { practiceTestId: "pt-ai-e727-v1" } });
  for (const id of oldAiIds) {
    await prisma.questionOption.deleteMany({ where: { questionId: id } });
    await prisma.question.deleteMany({ where: { id } });
  }

  // ─── Upsert helper ─────────────────────────────────────────────────────────

  async function upsertQ(data: {
    id: string; text: string; type: "SINGLE" | "MULTIPLE";
    sectionId: string; explanation: string;
    options: { id: string; text: string; isCorrect: boolean }[];
  }) {
    const q = await prisma.question.upsert({
      where: { id: data.id },
      update: { text: data.text, type: data.type, explanation: data.explanation, certSectionId: data.sectionId },
      create: {
        id: data.id, certificationId: certId, certSectionId: data.sectionId,
        text: data.text, type: data.type, source: "AI_GENERATED", explanation: data.explanation,
      },
    });
    for (const opt of data.options) {
      await prisma.questionOption.upsert({
        where: { id: opt.id },
        update: { text: opt.text, isCorrect: opt.isCorrect },
        create: { id: opt.id, questionId: q.id, text: opt.text, isCorrect: opt.isCorrect },
      });
    }
    return q;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AI EXAM #1
  // ═══════════════════════════════════════════════════════════════════════════

  const exam1Qs = await Promise.all([

    // Q1 — Theme
    upsertQ({
      id: "q-ai1-001", type: "SINGLE", sectionId: secTheme.id,
      text: "A developer creates a frontend theme at `app/design/frontend/MyVendor/mytheme/`. What is the correct second argument to pass to `ComponentRegistrar::register()` inside `registration.php`?",
      explanation: "The second argument follows the pattern `<area>/<Vendor>/<theme>`. It is not a filesystem path — do not include `app/design/`. The area prefix (`frontend/`) is required.",
      options: [
        { id: "q-ai1-001-a", text: "`'app/design/frontend/MyVendor/mytheme'`", isCorrect: false },
        { id: "q-ai1-001-b", text: "`'frontend/MyVendor/mytheme'`", isCorrect: true },
        { id: "q-ai1-001-c", text: "`'MyVendor/mytheme'`", isCorrect: false },
      ],
    }),

    // Q2 — Theme (MULTIPLE)
    upsertQ({
      id: "q-ai1-002", type: "MULTIPLE", sectionId: secTheme.id,
      text: "A developer creates a new theme with all required files and directory structure. After deploying, the theme does NOT appear in **Admin > Content > Design > Configuration**. Which TWO are the most likely causes? (Choose two.)",
      explanation: "The theme must appear in DB (requires `bin/magento setup:upgrade`) and `registration.php` must have the exact path matching the filesystem directory.",
      options: [
        { id: "q-ai1-002-a", text: "The second argument in `registration.php` does not exactly match the filesystem directory path", isCorrect: true },
        { id: "q-ai1-002-b", text: "The `etc/view.xml` file is missing from the theme root", isCorrect: false },
        { id: "q-ai1-002-c", text: "`bin/magento setup:upgrade` was not run after creating the theme files", isCorrect: true },
        { id: "q-ai1-002-d", text: "The `<parent>` element is missing from `theme.xml`", isCorrect: false },
      ],
    }),

    // Q3 — Theme
    upsertQ({
      id: "q-ai1-003", type: "SINGLE", sectionId: secTheme.id,
      text: "When Magento resolves a `.phtml` template file, in which order does it search the fallback chain?",
      explanation: "Magento searches from most-specific to least-specific: active theme → parent theme(s) → module `view/frontend/` → `lib/web/`. Templates are replaced (first match wins); layout XML is merged.",
      options: [
        { id: "q-ai1-003-a", text: "Module `view/frontend/` directory → Active theme → Parent theme(s) → `lib/web/`", isCorrect: false },
        { id: "q-ai1-003-b", text: "Active theme → Parent theme(s) → Module `view/frontend/` directory → `lib/web/`", isCorrect: true },
        { id: "q-ai1-003-c", text: "`lib/web/` → Module `view/frontend/` directory → Parent theme(s) → Active theme", isCorrect: false },
      ],
    }),

    // Q4 — Layouts
    upsertQ({
      id: "q-ai1-004", type: "SINGLE", sectionId: secLayouts.id,
      text: "A developer needs to move an existing block from its current container to a different container without creating a new block or deleting the original. Which Layout XML instruction achieves this?",
      explanation: "`<move>` is the only Layout XML instruction that relocates an existing element to a different parent. `<referenceBlock>` modifies but cannot change parent; `<update>` includes another handle's instructions.",
      options: [
        { id: "q-ai1-004-a", text: "`<referenceBlock>`", isCorrect: false },
        { id: "q-ai1-004-b", text: "`<update>`", isCorrect: false },
        { id: "q-ai1-004-c", text: "`<move>`", isCorrect: true },
      ],
    }),

    // Q5 — Layouts
    upsertQ({
      id: "q-ai1-005", type: "SINGLE", sectionId: secLayouts.id,
      text: "A developer adds the following to a layout XML file:\n\n```xml\n<block class=\"Vendor\\Module\\Block\\Banner\"\n       name=\"promo.banner\"\n       template=\"Vendor_Module::banner.phtml\"\n       before=\"-\"/>\n```\n\nWhere will this block be positioned relative to its siblings?",
      explanation: "`before=\"-\"` is a sentinel value meaning \"place this element FIRST among its siblings.\" Symmetrically, `after=\"-\"` means last.",
      options: [
        { id: "q-ai1-005-a", text: "As the last child of its parent container", isCorrect: false },
        { id: "q-ai1-005-b", text: "As the first child of its parent container", isCorrect: true },
        { id: "q-ai1-005-c", text: "Immediately before a block whose name is the literal string `\"-\"`", isCorrect: false },
      ],
    }),

    // Q6 — Layouts (MULTIPLE)
    upsertQ({
      id: "q-ai1-006", type: "MULTIPLE", sectionId: secLayouts.id,
      text: "Which TWO attributes are valid on a `<container>` element in Layout XML but are **NOT** valid on a `<block>` element? (Choose two.)",
      explanation: "`<container>` has unique HTML output attributes: `htmlTag`, `htmlClass`, and `htmlId`. `<block>` has `class` (PHP class) and `template` — neither valid on a container.",
      options: [
        { id: "q-ai1-006-a", text: "`htmlTag`", isCorrect: true },
        { id: "q-ai1-006-b", text: "`template`", isCorrect: false },
        { id: "q-ai1-006-c", text: "`htmlClass`", isCorrect: true },
        { id: "q-ai1-006-d", text: "`class`", isCorrect: false },
      ],
    }),

    // Q7 — Layouts
    upsertQ({
      id: "q-ai1-007", type: "SINGLE", sectionId: secLayouts.id,
      text: "A developer wants to add a custom promotional banner block to **every page** of the storefront. In which layout XML file should the block declaration be placed?",
      explanation: "`default.xml` is loaded on every single page request regardless of route. `cms_index_index.xml` is homepage only; `catalog_product_view.xml` is product pages only.",
      options: [
        { id: "q-ai1-007-a", text: "`cms_index_index.xml`", isCorrect: false },
        { id: "q-ai1-007-b", text: "`default.xml`", isCorrect: true },
        { id: "q-ai1-007-c", text: "`catalog_product_view.xml`", isCorrect: false },
      ],
    }),

    // Q8 — Layouts
    upsertQ({
      id: "q-ai1-008", type: "SINGLE", sectionId: secLayouts.id,
      text: "A template file is located at:\n`app/code/MyVendor/Promotions/view/frontend/templates/banner/hero.phtml`\n\nWhat is the correct template reference string to use in Layout XML?",
      explanation: "Format is `<Vendor_Module>::<relative/path.phtml>`. Underscore separator, no `templates/` prefix in path, `::` between module and path.",
      options: [
        { id: "q-ai1-008-a", text: "`'MyVendor/Promotions::banner/hero.phtml'`", isCorrect: false },
        { id: "q-ai1-008-b", text: "`'MyVendor_Promotions::templates/banner/hero.phtml'`", isCorrect: false },
        { id: "q-ai1-008-c", text: "`'MyVendor_Promotions::banner/hero.phtml'`", isCorrect: true },
      ],
    }),

    // Q9 — Layouts
    upsertQ({
      id: "q-ai1-009", type: "SINGLE", sectionId: secLayouts.id,
      text: "A developer working inside a custom theme needs to completely **replace** (not just extend) the core Layout XML file `Magento_Catalog/view/frontend/layout/catalog_product_view.xml`. In which directory should the override file be placed?",
      explanation: "To completely replace a layout file from within a theme, place the file in `{Module}/layout/override/base/`. Option A is the standard extension/merge path, not a replacement.",
      options: [
        { id: "q-ai1-009-a", text: "`app/design/frontend/Vendor/mytheme/Magento_Catalog/layout/`", isCorrect: false },
        { id: "q-ai1-009-b", text: "`app/design/frontend/Vendor/mytheme/Magento_Catalog/layout/override/base/`", isCorrect: true },
        { id: "q-ai1-009-c", text: "`app/design/frontend/Vendor/mytheme/layout/override/base/Magento_Catalog/`", isCorrect: false },
      ],
    }),

    // Q10 — Layouts (MULTIPLE)
    upsertQ({
      id: "q-ai1-010", type: "MULTIPLE", sectionId: secLayouts.id,
      text: "A developer is outputting a product name retrieved from an API call in a `.phtml` template. Which TWO of the following correctly apply XSS output escaping? (Choose two.)",
      explanation: "`$block->escapeHtml()` and `$escaper->escapeHtml()` are identical — `$escaper` is an auto-injected `Magento\\Framework\\Escaper` instance in 2.4. `escapeUrl()` is for URLs; raw `htmlspecialchars()` is insufficient.",
      options: [
        { id: "q-ai1-010-a", text: "`<?= $block->escapeHtml($productName) ?>`", isCorrect: true },
        { id: "q-ai1-010-b", text: "`<?= $block->escapeUrl($productName) ?>`", isCorrect: false },
        { id: "q-ai1-010-c", text: "`<?= $escaper->escapeHtml($productName) ?>`", isCorrect: true },
        { id: "q-ai1-010-d", text: "`<?= htmlspecialchars($productName) ?>`", isCorrect: false },
      ],
    }),

    // Q11 — Theme (Styles)
    upsertQ({
      id: "q-ai1-011", type: "SINGLE", sectionId: secTheme.id,
      text: "A developer is building a child theme that extends `Magento/luma`. They want to override the `@primary__color` LESS variable. In which file should this override be declared?",
      explanation: "`_theme.less` is imported after the full variable stack, so LESS lazy evaluation ensures your declaration wins. `_variables.less` would replace the parent's entire file, losing all other variables.",
      options: [
        { id: "q-ai1-011-a", text: "`web/css/source/_variables.less`", isCorrect: false },
        { id: "q-ai1-011-b", text: "`web/css/source/_extend.less`", isCorrect: false },
        { id: "q-ai1-011-c", text: "`web/css/source/_theme.less`", isCorrect: true },
      ],
    }),

    // Q12 — Theme (Styles)
    upsertQ({
      id: "q-ai1-012", type: "SINGLE", sectionId: secTheme.id,
      text: "Where does the Magento UI Library (containing all `.lib-*` mixin definitions) reside in the codebase?",
      explanation: "The UI Library is part of the Magento framework itself, not any theme. It lives outside `app/design/` entirely at `lib/web/css/source/lib/`, accessible to all themes without special configuration.",
      options: [
        { id: "q-ai1-012-a", text: "`vendor/magento/theme-frontend-blank/web/css/source/lib/`", isCorrect: false },
        { id: "q-ai1-012-b", text: "`lib/web/css/source/lib/`", isCorrect: true },
        { id: "q-ai1-012-c", text: "`app/design/frontend/Magento/blank/web/css/source/lib/`", isCorrect: false },
      ],
    }),

    // Q13 — Theme (Styles)
    upsertQ({
      id: "q-ai1-013", type: "SINGLE", sectionId: secTheme.id,
      text: "A developer writes the following LESS directive:\n\n```less\n@import (reference) 'source/lib/_lib';\n```\n\nWhat is the effect of using the `(reference)` keyword?",
      explanation: "`@import (reference)` pulls in a file's mixins and variables so you can call them, but does NOT output any CSS into the compiled stylesheet. A regular `@import` would both import AND emit all CSS rules.",
      options: [
        { id: "q-ai1-013-a", text: "Imports the file's CSS rules and outputs them in the compiled stylesheet", isCorrect: false },
        { id: "q-ai1-013-b", text: "Imports mixins and variables from the file without emitting any CSS output", isCorrect: true },
        { id: "q-ai1-013-c", text: "Creates a LESS variable that holds a reference to the file path", isCorrect: false },
      ],
    }),

    // Q14 — Theme (Styles)
    upsertQ({
      id: "q-ai1-014", type: "SINGLE", sectionId: secTheme.id,
      text: "A developer has the following in two different LESS files that are both imported into the same compilation context:\n\n```less\n// File A (imported first):\n@button__background: #0000ff;\n\n// File B (imported second, from _theme.less):\n@button__background: #ff0000;\n```\n\nWhich color will the compiled CSS use for `@button__background`?",
      explanation: "LESS uses **lazy evaluation** — the last definition of a variable in scope wins regardless of import order. This is the mechanism that makes `_theme.less` overrides work.",
      options: [
        { id: "q-ai1-014-a", text: "`#0000ff` (blue) — the first declaration wins", isCorrect: false },
        { id: "q-ai1-014-b", text: "`#ff0000` (red) — the last declaration wins due to LESS lazy evaluation", isCorrect: true },
        { id: "q-ai1-014-c", text: "The result is a compilation error due to duplicate variable declaration", isCorrect: false },
      ],
    }),

    // Q15 — JS
    upsertQ({
      id: "q-ai1-015", type: "SINGLE", sectionId: secJs.id,
      text: "Every `requirejs-config.js` file in Adobe Commerce exports a configuration object. What MUST the top-level JavaScript variable holding that object be named?",
      explanation: "The variable MUST be named exactly `config`. Commerce's build system specifically looks for `var config = {...}`. Any other name is silently ignored.",
      options: [
        { id: "q-ai1-015-a", text: "`module`", isCorrect: false },
        { id: "q-ai1-015-b", text: "`requireConfig`", isCorrect: false },
        { id: "q-ai1-015-c", text: "`config`", isCorrect: true },
      ],
    }),

    // Q16 — JS
    upsertQ({
      id: "q-ai1-016", type: "SINGLE", sectionId: secJs.id,
      text: "A developer needs to make a third-party charting library (a new `.js` file) available to other modules via the alias `my-charts`. Which key in `requirejs-config.js` should register this new alias-to-file mapping?",
      explanation: "`paths` registers new alias → file location mappings. `map` redirects existing aliases. `deps` auto-loads modules on page load.",
      options: [
        { id: "q-ai1-016-a", text: "`map`", isCorrect: false },
        { id: "q-ai1-016-b", text: "`deps`", isCorrect: false },
        { id: "q-ai1-016-c", text: "`paths`", isCorrect: true },
      ],
    }),

    // Q17 — JS
    upsertQ({
      id: "q-ai1-017", type: "SINGLE", sectionId: secJs.id,
      text: "A developer wants every module that requests `Magento_Checkout/js/view/form/element/email` to receive their custom replacement module instead, ensuring the original Magento file is never loaded. Which key in `requirejs-config.js` correctly achieves this?",
      explanation: "`map` with `'*'` wildcard means \"when ANY module requests this alias, give it the replacement.\" Mixins extend the original (both run). `paths` declares location but `map` is the canonical approach for module replacement.",
      options: [
        { id: "q-ai1-017-a", text: "`config.mixins`", isCorrect: false },
        { id: "q-ai1-017-b", text: "`paths`", isCorrect: false },
        { id: "q-ai1-017-c", text: "`map`", isCorrect: true },
      ],
    }),

    // Q18 — JS
    upsertQ({
      id: "q-ai1-018", type: "SINGLE", sectionId: secJs.id,
      text: "A developer registers a JavaScript mixin. In which nested location inside `requirejs-config.js` is the mixin declared?",
      explanation: "The double-nesting is commonly missed: outer `config` is the required variable name; inner `config` is a RequireJS key; `mixins` is the special key within that inner `config` recognized by Commerce's mixin system.",
      options: [
        { id: "q-ai1-018-a", text: "At `config.mixins`", isCorrect: false },
        { id: "q-ai1-018-b", text: "At `config.config.mixins`", isCorrect: true },
        { id: "q-ai1-018-c", text: "At `config.map.mixins`", isCorrect: false },
      ],
    }),

    // Q19 — JS
    upsertQ({
      id: "q-ai1-019", type: "SINGLE", sectionId: secJs.id,
      text: "A developer writes a JS mixin file for a UI Component. What is the correct top-level structure the mixin module must export?",
      explanation: "A mixin module must export a **function** that receives the original component as its argument and returns `TargetComponent.extend({...})`. A plain object or direct `.extend()` call cannot be applied by the mixin system.",
      options: [
        { id: "q-ai1-019-a", text: "A plain object containing the new and overridden methods to be merged into the target component", isCorrect: false },
        { id: "q-ai1-019-b", text: "A function that receives the original component as an argument and returns an extended version of it", isCorrect: true },
        { id: "q-ai1-019-c", text: "A direct call to `TargetComponent.extend({})` that replaces the original component's prototype", isCorrect: false },
      ],
    }),

    // Q20 — JS
    upsertQ({
      id: "q-ai1-020", type: "SINGLE", sectionId: secJs.id,
      text: "A developer declares a Knockout observable in JavaScript: `var productName = ko.observable('Widget Pro');` Later in the same JS code (outside of a Knockout template), they want to read the current value. Which syntax is correct?",
      explanation: "In Knockout.js, an observable is a **function**. To read its value in JavaScript, you invoke it with `()`. Without parentheses you get the function object itself, not the value.",
      options: [
        { id: "q-ai1-020-a", text: "`productName.value`", isCorrect: false },
        { id: "q-ai1-020-b", text: "`productName.get()`", isCorrect: false },
        { id: "q-ai1-020-c", text: "`productName()`", isCorrect: true },
      ],
    }),

    // Q21 — JS (MULTIPLE)
    upsertQ({
      id: "q-ai1-021", type: "MULTIPLE", sectionId: secJs.id,
      text: "Which TWO Knockout.js binding types **remove the element from the DOM** entirely when their condition evaluates to false? (Choose two.)",
      explanation: "`if` and `ifnot` physically remove elements from the DOM and destroy nested bindings. `visible` only toggles `display: none` — element stays in DOM. `css` adds/removes CSS classes.",
      options: [
        { id: "q-ai1-021-a", text: "`visible`", isCorrect: false },
        { id: "q-ai1-021-b", text: "`if`", isCorrect: true },
        { id: "q-ai1-021-c", text: "`ifnot`", isCorrect: true },
        { id: "q-ai1-021-d", text: "`css`", isCorrect: false },
      ],
    }),

    // Q22 — JS
    upsertQ({
      id: "q-ai1-022", type: "SINGLE", sectionId: secJs.id,
      text: "A `.phtml` template contains the following HTML attribute on a `<div>`:\n\n```html\n<div data-mage-init='{\"Vendor_Module/js/promo-widget\": {\"color\": \"red\"}}'>\n```\n\nWhat does Magento's JavaScript bootstrap do when it processes this attribute at page load?",
      explanation: "`data-mage-init` is processed by `mage/apply/main.js` which loads the RequireJS module and calls the component/widget constructor with the JSON config AND the DOM element as context.",
      options: [
        { id: "q-ai1-022-a", text: "Inlines a `<script>` tag containing the JSON config next to the element in the DOM", isCorrect: false },
        { id: "q-ai1-022-b", text: "Loads the `Vendor_Module/js/promo-widget` module via RequireJS and initializes it on that element, passing `{\"color\": \"red\"}` as configuration", isCorrect: true },
        { id: "q-ai1-022-c", text: "Registers `Vendor_Module/js/promo-widget` as a RequireJS path alias named `promo-widget`", isCorrect: false },
      ],
    }),

    // Q23 — JS
    upsertQ({
      id: "q-ai1-023", type: "SINGLE", sectionId: secJs.id,
      text: "What is the purpose of the `deps` key in `requirejs-config.js`?",
      explanation: "`deps` is an array of RequireJS module IDs that Commerce loads automatically on every page before any other code runs — think of it as \"boot scripts.\" It is not the same as `define(['dep'], ...)` which declares per-module dependencies.",
      options: [
        { id: "q-ai1-023-a", text: "Declaring which modules a specific UI Component depends on in its `define()` call", isCorrect: false },
        { id: "q-ai1-023-b", text: "Automatically loading a list of module IDs on every page before any other code runs", isCorrect: true },
        { id: "q-ai1-023-c", text: "Registering the dependencies that a mixin requires before it can execute", isCorrect: false },
      ],
    }),

    // Q24 — JS
    upsertQ({
      id: "q-ai1-024", type: "SINGLE", sectionId: secJs.id,
      text: "A developer adds a `jsLayout` argument to a block declaration in Layout XML like this:\n\n```xml\n<block class=\"Magento\\Checkout\\Block\\Onepage\" name=\"checkout.root\">\n    <arguments>\n        <argument name=\"jsLayout\" xsi:type=\"array\">\n            <!-- nested items -->\n        </argument>\n    </arguments>\n</block>\n```\n\nWhat is the primary purpose of `jsLayout`?",
      explanation: "`jsLayout` is a nested `xsi:type=\"array\"` argument the block converts to PHP array → JSON → `x-magento-init`, which then drives `Magento_Ui/js/core/app` to instantiate UI Components. Most heavily used in `checkout_index_index.xml`.",
      options: [
        { id: "q-ai1-024-a", text: "To declare which JavaScript file the block should load via RequireJS", isCorrect: false },
        { id: "q-ai1-024-b", text: "To pass a nested configuration structure (PHP array serialized to JSON) that configures UI Components on the page", isCorrect: true },
        { id: "q-ai1-024-c", text: "To set the RequireJS module ID that maps to this block's template file", isCorrect: false },
      ],
    }),

    // Q25 — JS (MULTIPLE)
    upsertQ({
      id: "q-ai1-025", type: "MULTIPLE", sectionId: secJs.id,
      text: "Which TWO mechanisms does Adobe Commerce use to wire JavaScript components or widgets to specific DOM elements in the storefront? (Choose two.)",
      explanation: "`data-mage-init` (attribute on element, handled by `mage/apply/main.js`) and `<script type=\"text/x-magento-init\">` (handled by `mage/apply/scripts.js`) are both valid. The others do not exist in Commerce.",
      options: [
        { id: "q-ai1-025-a", text: "`data-mage-init` HTML attribute on a DOM element", isCorrect: true },
        { id: "q-ai1-025-b", text: "`data-requirejs-config` HTML attribute", isCorrect: false },
        { id: "q-ai1-025-c", text: "`<script type=\"text/x-magento-init\">` inline script tag", isCorrect: true },
        { id: "q-ai1-025-d", text: "`data-ko-bind` HTML attribute", isCorrect: false },
      ],
    }),

    // Q26 — JS (Admin/PB)
    upsertQ({
      id: "q-ai1-026", type: "SINGLE", sectionId: secJs.id,
      text: "How does Page Builder store its content after an admin user saves a CMS page?",
      explanation: "Page Builder saves output as regular HTML with `data-content-type` attributes (e.g., `<div data-content-type=\"row\">`) stored in the standard `content` column. On the storefront this HTML is rendered as-is — no Page Builder JS engine runs on the frontend.",
      options: [
        { id: "q-ai1-026-a", text: "As a JSON structure in a dedicated `page_builder_content` database table", isCorrect: false },
        { id: "q-ai1-026-b", text: "As annotated HTML (with `data-content-type` attributes) in a standard `text`/`html` database column", isCorrect: true },
        { id: "q-ai1-026-c", text: "As XML configuration that is transformed into HTML at storefront render time", isCorrect: false },
      ],
    }),

    // Q27 — JS (Admin/PB)
    upsertQ({
      id: "q-ai1-027", type: "SINGLE", sectionId: secJs.id,
      text: "Every Page Builder content type has TWO template files. Which pair correctly identifies them?",
      explanation: "`preview.html` is rendered in the Admin stage while editing (with Knockout live bindings). `master.html` is what gets serialized into the database and rendered to shoppers on the storefront.",
      options: [
        { id: "q-ai1-027-a", text: "`edit.html` (used in the admin settings panel) and `render.html` (used on the storefront)", isCorrect: false },
        { id: "q-ai1-027-b", text: "`preview.html` (rendered in the Admin stage while editing) and `master.html` (output to the storefront/database)", isCorrect: true },
        { id: "q-ai1-027-c", text: "`draft.html` (unpublished state) and `live.html` (published state)", isCorrect: false },
      ],
    }),

    // Q28 — JS (Admin/PB)
    upsertQ({
      id: "q-ai1-028", type: "SINGLE", sectionId: secJs.id,
      text: "In which directory is a custom Page Builder content type's XML configuration file placed?",
      explanation: "Page Builder is an Admin-side feature. All its configuration lives under `view/adminhtml/` — not `view/frontend/`. The XML config goes in `view/adminhtml/pagebuilder/content_type/<name>.xml`.",
      options: [
        { id: "q-ai1-028-a", text: "`view/frontend/pagebuilder/content_type/`", isCorrect: false },
        { id: "q-ai1-028-b", text: "`etc/pagebuilder/content_type/`", isCorrect: false },
        { id: "q-ai1-028-c", text: "`view/adminhtml/pagebuilder/content_type/`", isCorrect: true },
      ],
    }),

    // Q29 — JS (Admin/PB, MULTIPLE)
    upsertQ({
      id: "q-ai1-029", type: "MULTIPLE", sectionId: secJs.id,
      text: "When setting up Grunt for LESS compilation in an Adobe Commerce installation, which TWO files must be copied from their `.sample` versions before running `npm install`? (Choose two.)",
      explanation: "Commerce ships `package.json.sample` and `Gruntfile.js.sample` at the project root. Both must be copied before `npm install`. `composer.json` is already present (not a sample); `grunt-config.js.sample` does not exist.",
      options: [
        { id: "q-ai1-029-a", text: "`package.json.sample` → `package.json`", isCorrect: true },
        { id: "q-ai1-029-b", text: "`Gruntfile.js.sample` → `Gruntfile.js`", isCorrect: true },
        { id: "q-ai1-029-c", text: "`composer.json.sample` → `composer.json`", isCorrect: false },
        { id: "q-ai1-029-d", text: "`grunt-config.js.sample` → `grunt-config.js`", isCorrect: false },
      ],
    }),

    // Q30 — JS (Admin/PB)
    upsertQ({
      id: "q-ai1-030", type: "SINGLE", sectionId: secJs.id,
      text: "The Admin UI SDK in Adobe Commerce allows developers to extend the Admin panel interface. What technology stack does it use?",
      explanation: "The Admin UI SDK is an out-of-process extension model. Extensions are built with React, deployed to Adobe I/O Runtime (serverless), and connected via App Builder — not traditional PHP/XML/Knockout patterns.",
      options: [
        { id: "q-ai1-030-a", text: "PHP plugins and XML configuration (the traditional Magento module pattern)", isCorrect: false },
        { id: "q-ai1-030-b", text: "React-based micro-frontend applications deployed via Adobe I/O Runtime / App Builder", isCorrect: true },
        { id: "q-ai1-030-c", text: "Knockout.js components registered through `adminhtml` Layout XML files", isCorrect: false },
      ],
    }),

  ]); // end exam1Qs

  console.log(`AI Exam #1: ${exam1Qs.length} questions created.`);

  // ═══════════════════════════════════════════════════════════════════════════
  // AI EXAM #2
  // ═══════════════════════════════════════════════════════════════════════════

  const exam2Qs = await Promise.all([

    upsertQ({
      id: "q-ai2-001", type: "SINGLE", sectionId: secTheme.id,
      text: "What is the primary purpose of the `etc/view.xml` file inside a custom theme?",
      explanation: "`etc/view.xml` controls product image configuration — types (roles like `image`, `small_image`, `thumbnail`), pixel dimensions, and aspect ratios. A child theme's `view.xml` completely replaces the parent's, unlike layout XML which is merged.",
      options: [
        { id: "q-ai2-001-a", text: "It declares the parent theme name and builds the fallback inheritance chain", isCorrect: false },
        { id: "q-ai2-001-b", text: "It configures product image dimensions and roles (e.g., thumbnail, small_image, base image)", isCorrect: true },
        { id: "q-ai2-001-c", text: "It maps LESS variable names to their default color values for the theme", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-002", type: "SINGLE", sectionId: secTheme.id,
      text: "A store has the phrase \"Add to Cart\" translated in three places: the module's `i18n/en_US.csv`, the active theme's `i18n/en_US.csv`, and via Admin > Stores > Configuration (database override). Which source takes precedence at runtime?",
      explanation: "Translation priority from highest to lowest: Database (Admin inline translations) → Theme i18n → Module i18n → Language packages. Database always wins — a common exam trap.",
      options: [
        { id: "q-ai2-002-a", text: "The theme-level `i18n/en_US.csv` — theme files always win", isCorrect: false },
        { id: "q-ai2-002-b", text: "The Admin database override — it always has the highest priority", isCorrect: true },
        { id: "q-ai2-002-c", text: "The module `i18n/en_US.csv` — module translations are the canonical source", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-003", type: "SINGLE", sectionId: secTheme.id,
      text: "A developer is building a custom transactional email template and needs to output the store name from system configuration. Which email template directive retrieves a system configuration value?",
      explanation: "`{{config path=\"...\"}}` reads from the store's system configuration using the config path. `{{var}}` outputs passed template variables. `{{trans}}` is for translatable strings, not config values.",
      options: [
        { id: "q-ai2-003-a", text: "`{{var store.name}}`", isCorrect: false },
        { id: "q-ai2-003-b", text: "`{{trans \"general/store_information/name\"}}`", isCorrect: false },
        { id: "q-ai2-003-c", text: "`{{config path=\"general/store_information/name\"}}`", isCorrect: true },
      ],
    }),

    upsertQ({
      id: "q-ai2-004", type: "SINGLE", sectionId: secLayouts.id,
      text: "What is the root XML element of a **page layout** file (such as `2columns-left.xml`) in Adobe Commerce?",
      explanation: "Page layout files use `<layout>` as root (validates against `page_layout.xsd`). Page configuration files use `<page>` as root (`page_configuration.xsd`). Classic exam trap — similar files, different root elements.",
      options: [
        { id: "q-ai2-004-a", text: "`<page>`", isCorrect: false },
        { id: "q-ai2-004-b", text: "`<structure>`", isCorrect: false },
        { id: "q-ai2-004-c", text: "`<layout>`", isCorrect: true },
      ],
    }),

    upsertQ({
      id: "q-ai2-005", type: "SINGLE", sectionId: secLayouts.id,
      text: "A developer sets `cacheable=\"false\"` on a block in layout XML. What is the scope of this setting?",
      explanation: "`cacheable=\"false\"` is a page-level setting. When ANY block on a page has it, the **entire page** is excluded from Varnish/FPC — not just that block. Use it only on blocks requiring per-request data.",
      options: [
        { id: "q-ai2-005-a", text: "Only that block's PHP output is excluded from the block HTML cache", isCorrect: false },
        { id: "q-ai2-005-b", text: "The entire page containing this block is excluded from Full Page Cache (Varnish/FPC)", isCorrect: true },
        { id: "q-ai2-005-c", text: "Only that block's database queries are excluded from the object cache", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-006", type: "SINGLE", sectionId: secLayouts.id,
      text: "A developer needs to pass an array of configuration values as an `<argument>` to a block in layout XML. Which `xsi:type` and structure is correct?",
      explanation: "`xsi:type=\"array\"` with nested `<item name=\"...\" xsi:type=\"...\">` elements is the correct structure. `list` and `collection` are not valid Magento Layout XML types.",
      options: [
        { id: "q-ai2-006-a", text: "`xsi:type=\"list\"` with nested `<value>` elements", isCorrect: false },
        { id: "q-ai2-006-b", text: "`xsi:type=\"array\"` with nested `<item name=\"...\" xsi:type=\"...\">` elements", isCorrect: true },
        { id: "q-ai2-006-c", text: "`xsi:type=\"collection\"` with nested `<entry>` elements", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-007", type: "MULTIPLE", sectionId: secLayouts.id,
      text: "Which TWO statements correctly describe the difference between `remove=\"true\"` and `display=\"false\"` on a `<referenceBlock>` in layout XML? (Choose two.)",
      explanation: "`remove=\"true\"` completely removes the block from the layout tree — child layouts cannot re-enable it. `display=\"false\"` hides rendering but keeps it in the tree, allowing child layouts to re-enable or reference it.",
      options: [
        { id: "q-ai2-007-a", text: "`remove=\"true\"` removes the block completely from the layout tree — child layouts cannot re-enable it", isCorrect: true },
        { id: "q-ai2-007-b", text: "`display=\"false\"` hides the block from rendering but keeps it in the layout tree, allowing child blocks to still reference it", isCorrect: true },
        { id: "q-ai2-007-c", text: "`display=\"false\"` permanently removes the block from the DOM output", isCorrect: false },
        { id: "q-ai2-007-d", text: "`remove=\"true\"` simply adds a CSS `display: none` style to the block's rendered output", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-008", type: "SINGLE", sectionId: secLayouts.id,
      text: "A developer creates a new custom page layout file `full-width-promo.xml` inside their theme. Where must this layout be **registered** for Magento to recognize and offer it?",
      explanation: "Custom page layouts must be declared in `Magento_Theme/layouts.xml` inside the theme directory. Without this registration the layout file exists but is never discovered and won't appear in Admin dropdowns.",
      options: [
        { id: "q-ai2-008-a", text: "In `Magento_Theme/layout/default.xml` as a new layout handle", isCorrect: false },
        { id: "q-ai2-008-b", text: "In `Magento_Theme/layouts.xml` inside the theme directory", isCorrect: true },
        { id: "q-ai2-008-c", text: "In `Magento_Theme/page_layout/layouts.xml` inside the theme directory", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-009", type: "SINGLE", sectionId: secLayouts.id,
      text: "What does the `<update handle=\"customer_account\"/>` instruction do in a layout XML file?",
      explanation: "`<update>` is an include mechanism — it merges all layout XML instructions defined under the named handle into the current page. It's like `@include` for layout handles, used to share layout fragments across pages.",
      options: [
        { id: "q-ai2-009-a", text: "Creates a new layout handle named `customer_account` that can be used elsewhere", isCorrect: false },
        { id: "q-ai2-009-b", text: "Merges all layout instructions from the `customer_account` handle into the current page's layout", isCorrect: true },
        { id: "q-ai2-009-c", text: "Restricts the current layout file to only load when a customer is logged in", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-010", type: "SINGLE", sectionId: secLayouts.id,
      text: "A developer outputs a dynamic CSS class name as an HTML attribute value in a `.phtml` template. Which escaping method is appropriate for this context?",
      explanation: "`escapeHtmlAttr()` is for HTML attribute values — it correctly encodes `\"` as `&quot;`. `escapeHtml()` is for between-tag content. `escapeJs()` is for JavaScript string contexts.",
      options: [
        { id: "q-ai2-010-a", text: "`<div class=\"<?= $block->escapeHtml($cssClass) ?>\">`", isCorrect: false },
        { id: "q-ai2-010-b", text: "`<div class=\"<?= $block->escapeJs($cssClass) ?>\">`", isCorrect: false },
        { id: "q-ai2-010-c", text: "`<div class=\"<?= $block->escapeHtmlAttr($cssClass) ?>\">`", isCorrect: true },
      ],
    }),

    upsertQ({
      id: "q-ai2-011", type: "SINGLE", sectionId: secTheme.id,
      text: "What is the LESS variable name that defines the **tablet breakpoint** (768px) in Magento's UI Library?",
      explanation: "Magento's LESS breakpoint variables follow `@screen__<size>` with double underscores. `@screen__m` = 768px (tablet). Defined in `lib/web/css/source/lib/variables/_responsive.less`.",
      options: [
        { id: "q-ai2-011-a", text: "`@screen__tablet`", isCorrect: false },
        { id: "q-ai2-011-b", text: "`@screen__m`", isCorrect: true },
        { id: "q-ai2-011-c", text: "`@breakpoint__medium`", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-012", type: "SINGLE", sectionId: secTheme.id,
      text: "What is the distinction between `styles-m.less` and `styles-l.less` in a Magento theme?",
      explanation: "`styles-m.less` is the mobile-first **base stylesheet** applied to ALL screen sizes. `styles-l.less` contains **only desktop-specific additions** — it is not a full standalone stylesheet.",
      options: [
        { id: "q-ai2-012-a", text: "`styles-m.less` is for screens between 320px–768px only; `styles-l.less` is for screens 769px and above", isCorrect: false },
        { id: "q-ai2-012-b", text: "`styles-m.less` is the mobile-first base stylesheet applied to all screen sizes; `styles-l.less` contains desktop-only additions", isCorrect: true },
        { id: "q-ai2-012-c", text: "`styles-m.less` compiles module-level styles; `styles-l.less` compiles library-level styles", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-013", type: "SINGLE", sectionId: secTheme.id,
      text: "A developer working in a custom theme wants to override specific CSS rules from the `Magento_Navigation` module without replacing any template files. Where should they place these theme-specific style overrides?",
      explanation: "`Magento_Navigation/web/css/source/_extend.less` inside the theme is the intended customization point — imported after `_module.less`, so styles override without replacing everything. The theme-root `_extend.less` is for global additions.",
      options: [
        { id: "q-ai2-013-a", text: "`web/css/source/_extend.less` at the theme root", isCorrect: false },
        { id: "q-ai2-013-b", text: "`Magento_Navigation/web/css/source/_module.less` inside the theme", isCorrect: false },
        { id: "q-ai2-013-c", text: "`Magento_Navigation/web/css/source/_extend.less` inside the theme", isCorrect: true },
      ],
    }),

    upsertQ({
      id: "q-ai2-014", type: "MULTIPLE", sectionId: secTheme.id,
      text: "Which TWO statements about LESS compilation in Adobe Commerce **developer mode** are correct? (Choose two.)",
      explanation: "In developer mode, LESS is compiled server-side via PHP on first request. `less.js` browser compilation requires explicit Admin configuration. `grunt watch` auto-recompiles on file save. `setup:static-content:deploy` is NOT required in developer mode.",
      options: [
        { id: "q-ai2-014-a", text: "LESS is compiled server-side using PHP (`less.php`) on the first request — client-side `less.js` is NOT active by default", isCorrect: true },
        { id: "q-ai2-014-b", text: "LESS is compiled automatically in the browser using `less.js` whenever developer mode is enabled", isCorrect: false },
        { id: "q-ai2-014-c", text: "Running `grunt watch` in developer mode automatically recompiles LESS files when changes are detected", isCorrect: true },
        { id: "q-ai2-014-d", text: "Developer mode requires running `bin/magento setup:static-content:deploy` before LESS changes are visible", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-015", type: "SINGLE", sectionId: secJs.id,
      text: "In jQuery Widget Factory, what is the difference between `_create()` and `_init()`?",
      explanation: "`_create()` runs **once** on first instantiation (DOM setup, event binding). `_init()` runs on first creation AND every subsequent re-call of the widget method — useful for applying initial state that may be reset.",
      options: [
        { id: "q-ai2-015-a", text: "`_create()` runs every time the widget is called; `_init()` runs only during the first initialization", isCorrect: false },
        { id: "q-ai2-015-b", text: "`_create()` runs only once on first instantiation; `_init()` runs on first creation AND on every subsequent re-call of the widget method", isCorrect: true },
        { id: "q-ai2-015-c", text: "`_create()` initializes widget options; `_init()` sets up DOM event bindings", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-016", type: "SINGLE", sectionId: secJs.id,
      text: "A developer defines a custom widget with `$.widget('mage.promoSlider', {...})`. How is this widget invoked on a jQuery-selected DOM element?",
      explanation: "The widget is invoked using just the **widget name part** after the dot — the namespace (`mage`) is for internal event namespacing, not for calling. Same pattern: `$(el).accordion()`, `$(el).tabs()`, `$(el).modal()`.",
      options: [
        { id: "q-ai2-016-a", text: "`$(el).mage.promoSlider()`", isCorrect: false },
        { id: "q-ai2-016-b", text: "`$(el).promoSlider()`", isCorrect: true },
        { id: "q-ai2-016-c", text: "`$(el).widget('mage.promoSlider')`", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-017", type: "SINGLE", sectionId: secJs.id,
      text: "Why is `this._on(element, events)` preferred over `$(element).on(events)` when binding DOM events inside a jQuery widget?",
      explanation: "`this._on()` is widget-managed. All events registered via `_on()` are **automatically unbound** when `destroy()` is called. With `$(el).on()`, you must manually call `.off()` in `destroy()` — forgetting causes memory leaks.",
      options: [
        { id: "q-ai2-017-a", text: "`this._on()` is faster because it bypasses jQuery's event delegation layer", isCorrect: false },
        { id: "q-ai2-017-b", text: "`this._on()` automatically unbinds all registered events when the widget's `destroy()` method is called", isCorrect: true },
        { id: "q-ai2-017-c", text: "`this._on()` supports modern shadow DOM event capturing which `$(el).on()` cannot handle", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-018", type: "SINGLE", sectionId: secJs.id,
      text: "A developer needs to integrate a legacy third-party JavaScript library that does NOT use the AMD `define()` pattern. Which key in `requirejs-config.js` is designed for configuring non-AMD scripts?",
      explanation: "`shim` is specifically designed for **non-AMD legacy scripts**. It lets you declare what dependencies to load before the script and what global variable it exports. Without `shim`, RequireJS would try to load it as AMD and fail silently.",
      options: [
        { id: "q-ai2-018-a", text: "`deps`", isCorrect: false },
        { id: "q-ai2-018-b", text: "`shim`", isCorrect: true },
        { id: "q-ai2-018-c", text: "`map`", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-019", type: "SINGLE", sectionId: secJs.id,
      text: "A developer has `var cartItems = ko.observableArray(['item1', 'item2'])`. They want to add a new item and have the bound UI update automatically. Which call is correct?",
      explanation: "With `ko.observableArray`, array mutation methods must be called **directly on the observable** — not on the unwrapped native array. Calling `cartItems().push()` modifies the native array, bypassing KO's change detection entirely.",
      options: [
        { id: "q-ai2-019-a", text: "`cartItems().push('item3')`", isCorrect: false },
        { id: "q-ai2-019-b", text: "`cartItems['item3'] = true`", isCorrect: false },
        { id: "q-ai2-019-c", text: "`cartItems.push('item3')`", isCorrect: true },
      ],
    }),

    upsertQ({
      id: "q-ai2-020", type: "SINGLE", sectionId: secJs.id,
      text: "A developer declares:\n```javascript\nvar fullName = ko.computed(function() {\n    return firstName() + ' ' + lastName();\n});\n```\nWhat is the defining behavior of `ko.computed`?",
      explanation: "`ko.computed` creates a derived value that recalculates automatically. KO tracks which observables were read during execution and subscribes to all of them — whenever any changes, the computed re-runs.",
      options: [
        { id: "q-ai2-020-a", text: "It runs the function once on declaration and permanently caches the result", isCorrect: false },
        { id: "q-ai2-020-b", text: "It automatically re-evaluates and updates whenever any observable it reads (`firstName`, `lastName`) changes", isCorrect: true },
        { id: "q-ai2-020-c", text: "It creates a two-way observable with built-in input validation", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-021", type: "SINGLE", sectionId: secJs.id,
      text: "Inside a Knockout `foreach` binding looping over cart items, a developer needs a \"Remove\" button to call a `removeItem` method that belongs to the **immediate parent** ViewModel — not the item itself. Which binding is correct?",
      explanation: "Inside `foreach`, `$parent` refers to the immediate parent binding context. `$root` is the top-level ViewModel. `$data` is the current item. The question asks for **immediate parent** → `$parent` is the precise answer.",
      options: [
        { id: "q-ai2-021-a", text: "`data-bind=\"click: $root.removeItem\"`", isCorrect: false },
        { id: "q-ai2-021-b", text: "`data-bind=\"click: $parent.removeItem\"`", isCorrect: true },
        { id: "q-ai2-021-c", text: "`data-bind=\"click: $data.removeItem\"`", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-022", type: "SINGLE", sectionId: secJs.id,
      text: "A developer uses `<script type=\"text/x-magento-init\">` with `\"*\"` as the selector key:\n\n```html\n<script type=\"text/x-magento-init\">\n{\n    \"*\": {\n        \"Vendor_Module/js/global-tracker\": { \"key\": \"value\" }\n    }\n}\n</script>\n```\n\nWhat does the `\"*\"` selector mean in this context?",
      explanation: "The `\"*\"` key means **no element** — the component initializes globally without being bound to any DOM element. The component receives `config` but no `element` parameter. Used for analytics, global state, etc.",
      options: [
        { id: "q-ai2-022-a", text: "The component is applied to every individual DOM element on the page", isCorrect: false },
        { id: "q-ai2-022-b", text: "The component initializes globally with no specific DOM element context", isCorrect: true },
        { id: "q-ai2-022-c", text: "The component targets all elements that have a `data-role` attribute", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-023", type: "SINGLE", sectionId: secJs.id,
      text: "In AMD module loading within Adobe Commerce, what is the correct distinction between `define()` and `require()`?",
      explanation: "`define()` declares a reusable module that returns a value for other modules to consume. `require()` is for one-time execution/side effects that don't need to be consumed by other modules. Both are asynchronous.",
      options: [
        { id: "q-ai2-023-a", text: "`define()` declares a reusable module that other modules can depend on; `require()` is used for one-time execution that does not need to be consumed by other modules", isCorrect: true },
        { id: "q-ai2-023-b", text: "`require()` loads files synchronously; `define()` loads files asynchronously", isCorrect: false },
        { id: "q-ai2-023-c", text: "`define()` is for `.phtml` templates; `require()` is for standalone `.js` files", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-024", type: "SINGLE", sectionId: secJs.id,
      text: "A developer discovers that a third-party module has registered a mixin on `Magento_Checkout/js/view/minicart` that conflicts with their customization. They want to **disable** that specific mixin from their theme. What is the correct approach?",
      explanation: "Setting the mixin's value to `false` in `config.config.mixins` in the theme's `requirejs-config.js` disables it — the official clean way. You cannot delete vendor files (overwritten by Composer); `config.exclude` doesn't exist.",
      options: [
        { id: "q-ai2-024-a", text: "Delete the third-party mixin file from the theme's override directory", isCorrect: false },
        { id: "q-ai2-024-b", text: "Set the mixin's value to `false` in `config.config.mixins` in their theme's `requirejs-config.js`", isCorrect: true },
        { id: "q-ai2-024-c", text: "Add the mixin module ID to a `config.exclude` array in `requirejs-config.js`", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-025", type: "MULTIPLE", sectionId: secJs.id,
      text: "Which TWO statements about Knockout.js bindings are correct? (Choose two.)",
      explanation: "`text` HTML-escapes output (XSS-safe); `html` renders raw HTML. `value` provides two-way binding for form inputs. `attr` sets HTML attributes (not CSS classes). `css` adds/removes CSS classes (not attributes).",
      options: [
        { id: "q-ai2-025-a", text: "The `text` binding HTML-escapes output; the `html` binding renders raw HTML without escaping", isCorrect: true },
        { id: "q-ai2-025-b", text: "The `value` binding provides two-way data binding for form input elements (reads and writes the observable)", isCorrect: true },
        { id: "q-ai2-025-c", text: "The `attr` binding is used to add/remove CSS class names based on boolean conditions", isCorrect: false },
        { id: "q-ai2-025-d", text: "The `css` binding is used to dynamically set HTML attribute values like `href` and `src`", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-026", type: "SINGLE", sectionId: secJs.id,
      text: "A developer is actively modifying LESS files and wants them recompiled automatically every time a file is saved, without running a command each time. Which Grunt command enables this continuous watch workflow?",
      explanation: "`grunt watch` monitors LESS source files and triggers recompilation on every save. `grunt less` compiles once and exits. `grunt exec` runs a shell command task.",
      options: [
        { id: "q-ai2-026-a", text: "`grunt less`", isCorrect: false },
        { id: "q-ai2-026-b", text: "`grunt exec`", isCorrect: false },
        { id: "q-ai2-026-c", text: "`grunt watch`", isCorrect: true },
      ],
    }),

    upsertQ({
      id: "q-ai2-027", type: "SINGLE", sectionId: secJs.id,
      text: "In the Edge Delivery Services (EDS) boilerplate architecture, how is a \"block\" defined from a content authoring perspective?",
      explanation: "EDS uses the Franklin/Helix document-based authoring model. Blocks are authored as **tables in Word or Google Docs** — the table name becomes the block name. EDS syncs to Git as Markdown and a matching JS function decorates the block's DOM.",
      options: [
        { id: "q-ai2-027-a", text: "Blocks are defined as Knockout.js components registered in a central `blocks.json` manifest file", isCorrect: false },
        { id: "q-ai2-027-b", text: "Blocks are authored as structured tables in Word or Google Docs and rendered on the frontend by a matching JavaScript decoration function", isCorrect: true },
        { id: "q-ai2-027-c", text: "Blocks are PHP class files that extend Magento's core block system and are discovered at deployment time", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-028", type: "MULTIPLE", sectionId: secJs.id,
      text: "Which TWO settings in the Adobe Commerce Admin panel can directly reduce frontend page load time by consolidating static asset requests? (Choose two.)",
      explanation: "Both CSS Merge (Admin > Stores > Config > Advanced > Developer > CSS Settings) and JS Merge (JavaScript Settings) combine multiple files into one HTTP request. Page Builder Stage Caching and LESS Settings are not real Admin settings.",
      options: [
        { id: "q-ai2-028-a", text: "Merge CSS Files (Admin > Stores > Configuration > Advanced > Developer > CSS Settings)", isCorrect: true },
        { id: "q-ai2-028-b", text: "Enable Page Builder Stage Caching (Admin > Content > Configuration)", isCorrect: false },
        { id: "q-ai2-028-c", text: "Merge JavaScript Files (Admin > Stores > Configuration > Advanced > Developer > JavaScript Settings)", isCorrect: true },
        { id: "q-ai2-028-d", text: "Compile LESS on Save (Admin > Stores > Configuration > Advanced > Developer > LESS Settings)", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai2-029", type: "SINGLE", sectionId: secJs.id,
      text: "When registering a custom Page Builder content type in its XML configuration file, which attribute controls which **panel group** the new content type appears in on the Admin stage (e.g., \"Layout\", \"Elements\", \"Media\")?",
      explanation: "`menu_section` controls the panel group. Valid values: `layout`, `elements`, `media`, `add_content`. Not `panel_group` or `category` — those attributes don't exist.",
      options: [
        { id: "q-ai2-029-a", text: "`panel_group`", isCorrect: false },
        { id: "q-ai2-029-b", text: "`category`", isCorrect: false },
        { id: "q-ai2-029-c", text: "`menu_section`", isCorrect: true },
      ],
    }),

    upsertQ({
      id: "q-ai2-030", type: "MULTIPLE", sectionId: secJs.id,
      text: "The Admin UI SDK provides extension points for customizing the Adobe Commerce Admin UI. Which TWO are valid Admin UI SDK extension points? (Choose two.)",
      explanation: "Valid Admin UI SDK extension points include adding items to the Admin navigation menu and to grid mass action menus. Injecting PHP block output into grid cells is the traditional approach; Knockout widgets via layout XML is the old pattern.",
      options: [
        { id: "q-ai2-030-a", text: "Adding custom items to the Admin navigation **menu**", isCorrect: true },
        { id: "q-ai2-030-b", text: "Injecting custom PHP block output into Admin grid column cells", isCorrect: false },
        { id: "q-ai2-030-c", text: "Adding items to grid **mass action** menus", isCorrect: true },
        { id: "q-ai2-030-d", text: "Registering custom Knockout.js widgets for Admin forms via `adminhtml` layout XML", isCorrect: false },
      ],
    }),

  ]); // end exam2Qs

  console.log(`AI Exam #2: ${exam2Qs.length} questions created.`);

  // ═══════════════════════════════════════════════════════════════════════════
  // AI EXAM #3
  // ═══════════════════════════════════════════════════════════════════════════

  const exam3Qs = await Promise.all([

    upsertQ({
      id: "q-ai3-001", type: "SINGLE", sectionId: secTheme.id,
      text: "A developer needs to output a translated string inside a RequireJS JavaScript module. Which approach correctly retrieves a translated phrase in a `.js` file?",
      explanation: "Inside an AMD module, use `mage/translate` as a dependency with the `$t()` alias. The PHP `__()` helper doesn't exist in the browser; `Mage.translate()` is a Magento 1 pattern.",
      options: [
        { id: "q-ai3-001-a", text: "`var label = __('Add to Cart');`", isCorrect: false },
        { id: "q-ai3-001-b", text: "`define(['mage/translate'], function($t) { var label = $t('Add to Cart'); });`", isCorrect: true },
        { id: "q-ai3-001-c", text: "`var label = Mage.translate('Add to Cart');`", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-002", type: "SINGLE", sectionId: secTheme.id,
      text: "A developer needs to include the standard Magento email header inside a custom transactional email template. Which directive correctly includes another email template file?",
      explanation: "`{{include}}` embeds another template file inline. `{{extend}}` and `{{import}}` do not exist as valid email directives in Magento 2.",
      options: [
        { id: "q-ai3-002-a", text: "`{{extend template=\"Magento_Email::header.html\"}}`", isCorrect: false },
        { id: "q-ai3-002-b", text: "`{{import template=\"Magento_Email::header.html\"}}`", isCorrect: false },
        { id: "q-ai3-002-c", text: "`{{include template=\"Magento_Email::header.html\"}}`", isCorrect: true },
      ],
    }),

    upsertQ({
      id: "q-ai3-003", type: "SINGLE", sectionId: secTheme.id,
      text: "A developer creates a custom theme to be distributed via Magento Marketplace. What must the `\"type\"` field be set to in the theme's `composer.json` for Composer to correctly identify and install it?",
      explanation: "Themes must use exactly `\"magento2-theme\"`. `\"magento2-module\"` is for modules. `\"magento-theme\"` (missing the `2`) is not a valid Magento Composer type.",
      options: [
        { id: "q-ai3-003-a", text: "`\"magento2-module\"`", isCorrect: false },
        { id: "q-ai3-003-b", text: "`\"magento-theme\"`", isCorrect: false },
        { id: "q-ai3-003-c", text: "`\"magento2-theme\"`", isCorrect: true },
      ],
    }),

    upsertQ({
      id: "q-ai3-004", type: "SINGLE", sectionId: secLayouts.id,
      text: "A `.phtml` template calls `$block->getChildHtml('sidebar')`. The child block in layout XML is declared with `name=\"vendor.module.sidebar.block\"`. What attribute must be added to the block declaration for `getChildHtml('sidebar')` to find it?",
      explanation: "`getChildHtml('sidebar')` looks up a child block by its **alias**, set via the `as` attribute. There is no `id` attribute on layout blocks; `alias` is not the correct attribute name.",
      options: [
        { id: "q-ai3-004-a", text: "`id=\"sidebar\"`", isCorrect: false },
        { id: "q-ai3-004-b", text: "`as=\"sidebar\"`", isCorrect: true },
        { id: "q-ai3-004-c", text: "`alias=\"sidebar\"`", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-005", type: "SINGLE", sectionId: secLayouts.id,
      text: "A developer declares a block in layout XML with the attribute `ifconfig=\"catalog/frontend/list_allow_all\"`. What is the effect of this attribute?",
      explanation: "`ifconfig` accepts a system configuration path. At render time, Magento evaluates the config value — if truthy (e.g., `1`, `true`), the block renders; if falsy, it is skipped entirely. Has no relation to ACL or page sections.",
      options: [
        { id: "q-ai3-005-a", text: "The block only renders if the current customer has the ACL resource `catalog/frontend/list_allow_all`", isCorrect: false },
        { id: "q-ai3-005-b", text: "The block only renders if the system configuration path `catalog/frontend/list_allow_all` returns a truthy value", isCorrect: true },
        { id: "q-ai3-005-c", text: "The block only renders on pages within the catalog frontend section", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-006", type: "SINGLE", sectionId: secLayouts.id,
      text: "A developer needs to add a JavaScript file to all product detail pages using layout XML. Which instruction correctly adds it to the page `<head>`?",
      explanation: "In a page configuration layout XML file, static assets are added directly inside the `<head>` node. `head` is not a named container; `head.scripts` is not the correct block name.",
      options: [
        { id: "q-ai3-006-a", text: "`<referenceContainer name=\"head\"><script src=\"Vendor_Module::js/custom.js\"/></referenceContainer>`", isCorrect: false },
        { id: "q-ai3-006-b", text: "`<head><script src=\"Vendor_Module::js/custom.js\"/></head>`", isCorrect: true },
        { id: "q-ai3-006-c", text: "`<referenceBlock name=\"head.scripts\"><script src=\"Vendor_Module::js/custom.js\"/></referenceBlock>`", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-007", type: "SINGLE", sectionId: secLayouts.id,
      text: "A developer places a file at `app/design/frontend/Vendor/mytheme/Magento_Catalog/templates/product/view.phtml`. What happens to the original template at `vendor/magento/module-catalog/view/frontend/templates/product/view.phtml`?",
      explanation: "Template fallback is **winner-takes-all** — first match in the chain is used exclusively. The original module template is completely bypassed. Contrast with Layout XML which IS merged across the chain.",
      options: [
        { id: "q-ai3-007-a", text: "Both files are merged — the theme's output is appended after the module's output", isCorrect: false },
        { id: "q-ai3-007-b", text: "The original module template is completely ignored — only the theme file is used", isCorrect: true },
        { id: "q-ai3-007-c", text: "The theme file is only used if explicitly registered in `layouts.xml`", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-008", type: "MULTIPLE", sectionId: secLayouts.id,
      text: "Which TWO variables are automatically available in every `.phtml` template in Adobe Commerce 2.4? (Choose two.)",
      explanation: "`$block` (Block instance, always available) and `$escaper` (auto-injected `Magento\\Framework\\Escaper` since 2.4) are both automatic. `$layout` is accessed via `$block->getLayout()`, not auto-injected. `$view` doesn't exist.",
      options: [
        { id: "q-ai3-008-a", text: "`$block` — the Block instance associated with the template", isCorrect: true },
        { id: "q-ai3-008-b", text: "`$layout` — the global Layout object for the page", isCorrect: false },
        { id: "q-ai3-008-c", text: "`$escaper` — an instance of `Magento\\Framework\\Escaper`", isCorrect: true },
        { id: "q-ai3-008-d", text: "`$view` — the View rendering object", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-009", type: "SINGLE", sectionId: secLayouts.id,
      text: "A developer wants to add a `<meta>` tag to the HTML `<head>` on every page by adding a child block. Which existing named block should they target with `<referenceBlock>`?",
      explanation: "`head.additional` is the named block specifically designed to accept additional `<meta>` tags, `<link>` tags, and other head elements. `head.container` and `page.head.meta` are not standard named blocks.",
      options: [
        { id: "q-ai3-009-a", text: "`head.container`", isCorrect: false },
        { id: "q-ai3-009-b", text: "`head.additional`", isCorrect: true },
        { id: "q-ai3-009-c", text: "`page.head.meta`", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-010", type: "SINGLE", sectionId: secLayouts.id,
      text: "A developer outputs a PHP value directly into a `<script>` block in a `.phtml` template:\n\n```php\n<script>\n    var config = { name: \"<?= /* output here */ $name ?>\" };\n</script>\n```\n\nWhich escaping method is appropriate for this JavaScript string context?",
      explanation: "`escapeJs()` escapes characters special within JavaScript strings (backslashes, quotes, newlines). `escapeHtml()` is for HTML contexts; `escapeHtmlAttr()` is for HTML attribute values — neither is safe for JS string injection.",
      options: [
        { id: "q-ai3-010-a", text: "`$block->escapeHtml($name)`", isCorrect: false },
        { id: "q-ai3-010-b", text: "`$block->escapeHtmlAttr($name)`", isCorrect: false },
        { id: "q-ai3-010-c", text: "`$block->escapeJs($name)`", isCorrect: true },
      ],
    }),

    upsertQ({
      id: "q-ai3-011", type: "SINGLE", sectionId: secTheme.id,
      text: "What is the purpose of a `_module.less` file found in `<Vendor_Module>/web/css/source/` inside a Magento module?",
      explanation: "`_module.less` contains base CSS styles for that specific module, automatically compiled as part of the theme's LESS build — no explicit `@import` required. The master entry point is `styles-m.less`; variable files are `_variables.less`.",
      options: [
        { id: "q-ai3-011-a", text: "It is the master entry point that imports all LESS files for the entire theme", isCorrect: false },
        { id: "q-ai3-011-b", text: "It contains base CSS styles for that specific module, automatically compiled as part of the theme's LESS build", isCorrect: true },
        { id: "q-ai3-011-c", text: "It declares LESS variables for the module that must be overridden in `_theme.less`", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-012", type: "SINGLE", sectionId: secTheme.id,
      text: "What is the purpose of `print.less` in a Magento theme?",
      explanation: "`print.less` is compiled into `print.css` with a `media=\"print\"` attribute — styles apply only when the page is printed. `styles-m.less` is the primary entry point; Grunt debug output is unrelated.",
      options: [
        { id: "q-ai3-012-a", text: "It generates Grunt debug output for LESS compilation errors during development", isCorrect: false },
        { id: "q-ai3-012-b", text: "It is the primary entry point that imports all other LESS partials before compilation", isCorrect: false },
        { id: "q-ai3-012-c", text: "It contains styles that are applied only when the page is printed (print media context)", isCorrect: true },
      ],
    }),

    upsertQ({
      id: "q-ai3-013", type: "MULTIPLE", sectionId: secTheme.id,
      text: "A developer wants to add brand-new CSS rules to their custom theme — not override variables, but add actual new styles. Which TWO files are the correct locations? (Choose two.)",
      explanation: "`_extend.less` is the designated location for extending/adding CSS rules. At theme root for global additions; at `Magento_Module/web/css/source/_extend.less` inside the theme for module-specific additions. `_theme.less` is for variable overrides; `lib/web/` should not be modified.",
      options: [
        { id: "q-ai3-013-a", text: "`web/css/source/_theme.less` (at theme root)", isCorrect: false },
        { id: "q-ai3-013-b", text: "`web/css/source/_extend.less` (at theme root)", isCorrect: true },
        { id: "q-ai3-013-c", text: "`Magento_Module/web/css/source/_extend.less` (inside the theme, for module-specific additions)", isCorrect: true },
        { id: "q-ai3-013-d", text: "`lib/web/css/source/_extend.less`", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-014", type: "SINGLE", sectionId: secTheme.id,
      text: "A developer wants to apply Magento's standard button styles to a custom element using the UI Library. Which LESS syntax correctly calls the button mixin?",
      explanation: "Magento's UI Library uses standard LESS mixin call syntax with a leading dot (`.`). All library mixins follow `.lib-*()`. `@include` is SASS syntax; `#lib-button()` uses `#` which denotes a LESS namespace.",
      options: [
        { id: "q-ai3-014-a", text: "`@include lib-button();`", isCorrect: false },
        { id: "q-ai3-014-b", text: "`#lib-button();`", isCorrect: false },
        { id: "q-ai3-014-c", text: "`.lib-button();`", isCorrect: true },
      ],
    }),

    upsertQ({
      id: "q-ai3-015", type: "SINGLE", sectionId: secJs.id,
      text: "After a jQuery widget is already initialized on an element, how does external code read the current value of its `speed` option?",
      explanation: "After initialization, interact with the widget by calling its method with string commands. `'option'` reads or writes option values: `$(el).myWidget('option', 'speed')`. Accessing `.myWidget.options` directly is invalid — `myWidget` is a method, not a property.",
      options: [
        { id: "q-ai3-015-a", text: "`$(el).myWidget.options.speed`", isCorrect: false },
        { id: "q-ai3-015-b", text: "`$(el).myWidget('option', 'speed')`", isCorrect: true },
        { id: "q-ai3-015-c", text: "`$(el).myWidget.speed`", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-016", type: "SINGLE", sectionId: secJs.id,
      text: "Inside an overridden widget method, a developer calls `this._super()`. What does this do?",
      explanation: "`this._super()` calls the **parent widget's version of the same method** being overridden, in the context of the current instance. It does not destroy or reinstantiate anything — it simply delegates to the parent method.",
      options: [
        { id: "q-ai3-016-a", text: "Destroys the current widget instance and reinstantiates the parent widget", isCorrect: false },
        { id: "q-ai3-016-b", text: "Creates a new instance of the parent widget class on the same element", isCorrect: false },
        { id: "q-ai3-016-c", text: "Calls the parent widget's version of the same method being overridden", isCorrect: true },
      ],
    }),

    upsertQ({
      id: "q-ai3-017", type: "SINGLE", sectionId: secJs.id,
      text: "Both a custom module and the active theme have a `requirejs-config.js` file that configure the same key. Which file takes precedence in the merged configuration?",
      explanation: "The active theme has the highest priority in the merge order: core modules → third-party modules → custom modules → **active theme** (wins). The theme is the final customization layer.",
      options: [
        { id: "q-ai3-017-a", text: "The module-level file — modules are processed first and take priority", isCorrect: false },
        { id: "q-ai3-017-b", text: "The theme-level file — the active theme has the highest priority in the merge order", isCorrect: true },
        { id: "q-ai3-017-c", text: "The file belonging to the module with the highest `sortOrder` in `module.xml`", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-018", type: "SINGLE", sectionId: secJs.id,
      text: "In an AMD module defined as `define(['jquery'], function($) { return { ... }; })`, what does the `return` statement represent?",
      explanation: "In AMD, the `return` value is the module's **exported value** — what gets injected as an argument into any module that declares this one as a dependency. It is not initialization code (that runs before `return`) and doesn't auto-register as a jQuery plugin.",
      options: [
        { id: "q-ai3-018-a", text: "Initialization code that runs immediately when RequireJS loads the file", isCorrect: false },
        { id: "q-ai3-018-b", text: "The value (object, function, or class) passed as an argument to any module that declares this one as a dependency", isCorrect: true },
        { id: "q-ai3-018-c", text: "The jQuery plugin object that gets registered on `$.fn`", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-019", type: "SINGLE", sectionId: secJs.id,
      text: "A developer has `var tags = ko.observableArray(['js', 'php'])`. They call `tags.removeAll()`. What is the result?",
      explanation: "`removeAll()` empties the array entirely and triggers KO's change notification, causing all bound UI elements to update. The observable itself remains functional (now wrapping `[]`); items are not set to `null`.",
      options: [
        { id: "q-ai3-019-a", text: "The observable itself is destroyed and all KO bindings using it throw an error", isCorrect: false },
        { id: "q-ai3-019-b", text: "All items are cleared from the array and all bound UI elements update automatically", isCorrect: true },
        { id: "q-ai3-019-c", text: "All items are set to `null` but the array length remains the same", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-020", type: "SINGLE", sectionId: secJs.id,
      text: "Inside a Knockout `foreach` binding, a developer needs to display a 1-based item counter (1, 2, 3...) for each item. Which binding expression is correct?",
      explanation: "`$index` is an observable — must call `$index()` to get the value. Add 1 to convert zero-based to 1-based. `$count` doesn't exist as a KO context variable.",
      options: [
        { id: "q-ai3-020-a", text: "`data-bind=\"text: $index\"`", isCorrect: false },
        { id: "q-ai3-020-b", text: "`data-bind=\"text: $count()\"`", isCorrect: false },
        { id: "q-ai3-020-c", text: "`data-bind=\"text: $index() + 1\"`", isCorrect: true },
      ],
    }),

    upsertQ({
      id: "q-ai3-021", type: "SINGLE", sectionId: secJs.id,
      text: "A developer needs to initialize TWO different widgets on the same HTML element using `data-mage-init`. Which approach is correct?",
      explanation: "`data-mage-init` accepts a single JSON object where each key is a widget module path and the value is its config. Multiple widgets = multiple keys in one object. A second `data-mage-init` attribute would silently override the first.",
      options: [
        { id: "q-ai3-021-a", text: "Add a second `data-mage-init` attribute to the same element with the second widget config", isCorrect: false },
        { id: "q-ai3-021-b", text: "Include both widget configurations as separate keys within the single JSON object value", isCorrect: true },
        { id: "q-ai3-021-c", text: "Use a `data-mage-init-2` attribute for the second widget", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-022", type: "SINGLE", sectionId: secJs.id,
      text: "When the Knockout `visible` binding evaluates to `false`, what exactly happens to the bound element?",
      explanation: "`visible` toggles CSS visibility by setting/removing `style=\"display: none;\"` inline. The element **remains in the DOM** with all child bindings intact. DOM removal is the behavior of `if`/`ifnot` bindings.",
      options: [
        { id: "q-ai3-022-a", text: "The element is removed from the DOM entirely and all child bindings are destroyed", isCorrect: false },
        { id: "q-ai3-022-b", text: "The element remains in the DOM but has `display: none` applied inline via CSS", isCorrect: true },
        { id: "q-ai3-022-c", text: "The element is moved to a hidden `<template>` buffer until the value becomes truthy", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-023", type: "SINGLE", sectionId: secJs.id,
      text: "Two separate modules both register mixins targeting the same Commerce JS component. What happens when the component is loaded?",
      explanation: "Commerce's mixin system fully supports multiple mixins on the same component. Each mixin receives the result of the previous one — they chain together in registration order, each returning an extended version that the next further extends.",
      options: [
        { id: "q-ai3-023-a", text: "A JavaScript error is thrown — only one mixin can target a component at a time", isCorrect: false },
        { id: "q-ai3-023-b", text: "The last registered mixin wins — it completely replaces all previously registered mixins", isCorrect: false },
        { id: "q-ai3-023-c", text: "Both mixins are applied in sequence — they chain together, each receiving the previous result", isCorrect: true },
      ],
    }),

    upsertQ({
      id: "q-ai3-024", type: "SINGLE", sectionId: secJs.id,
      text: "A developer wants to create a jQuery widget that **inherits** from Magento's built-in `mage.collapsible` widget. Which `$.widget()` call correctly establishes this inheritance?",
      explanation: "jQuery Widget Factory supports prototype-based inheritance by passing the parent widget object as the **second argument** to `$.widget()`. `'mage.myPanel extends mage.collapsible'` is not valid syntax; `_super` is not a config key.",
      options: [
        { id: "q-ai3-024-a", text: "`$.widget('mage.myPanel extends mage.collapsible', { ... })`", isCorrect: false },
        { id: "q-ai3-024-b", text: "`$.widget('mage.myPanel', $.mage.collapsible, { ... })`", isCorrect: true },
        { id: "q-ai3-024-c", text: "`$.widget('mage.myPanel', { _super: $.mage.collapsible, ... })`", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-025", type: "MULTIPLE", sectionId: secJs.id,
      text: "Which TWO statements correctly describe how Commerce **merges** multiple `requirejs-config.js` files from different modules and the active theme? (Choose two.)",
      explanation: "Objects (`map`, `config`) are merged recursively — keys from all files combined. Arrays (`deps`) are concatenated. Scalar values use the last-defined (highest priority) value, not first. `paths` is merged, not replaced wholesale.",
      options: [
        { id: "q-ai3-025-a", text: "Objects (such as `map` and `config`) are merged recursively — keys from all files are combined", isCorrect: true },
        { id: "q-ai3-025-b", text: "Arrays (such as `deps`) are concatenated — items from all files are accumulated", isCorrect: true },
        { id: "q-ai3-025-c", text: "Scalar values use the first-defined value — the lowest-priority file wins", isCorrect: false },
        { id: "q-ai3-025-d", text: "A `paths` object in a theme completely replaces any `paths` objects from all modules", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-026", type: "SINGLE", sectionId: secJs.id,
      text: "What is the purpose of the `grunt-exec` plugin in Adobe Commerce's Grunt setup?",
      explanation: "`grunt-exec` runs arbitrary shell commands as Grunt tasks (e.g., `bin/magento cache:flush`). LESS compilation is `grunt-contrib-less`; file watching is `grunt-contrib-watch`.",
      options: [
        { id: "q-ai3-026-a", text: "It executes the LESS-to-CSS compilation for the theme", isCorrect: false },
        { id: "q-ai3-026-b", text: "It watches for file changes and triggers other Grunt tasks automatically", isCorrect: false },
        { id: "q-ai3-026-c", text: "It runs arbitrary shell commands as Grunt tasks, such as clearing the Magento cache via `bin/magento`", isCorrect: true },
      ],
    }),

    upsertQ({
      id: "q-ai3-027", type: "SINGLE", sectionId: secJs.id,
      text: "In a Page Builder content type XML configuration file, what is the purpose of the `<appearances>` node?",
      explanation: "`<appearances>` maps Admin form field values to HTML element attributes/CSS properties, specifies which `preview.html` and `master.html` templates to use, and supports multiple appearances per content type.",
      options: [
        { id: "q-ai3-027-a", text: "It controls the light/dark theme of the content type's settings panel in Admin", isCorrect: false },
        { id: "q-ai3-027-b", text: "It maps form field values to HTML element attributes and styles, and specifies which preview/master templates to use — a single content type can have multiple appearances", isCorrect: true },
        { id: "q-ai3-027-c", text: "It lists the CSS class options available in the content type's style dropdown", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-028", type: "SINGLE", sectionId: secJs.id,
      text: "Which statement accurately describes a key difference between an **Edge Delivery Services (EDS)** storefront and a traditional Adobe Commerce storefront?",
      explanation: "EDS uses no Magento theme system, no LESS compilation, and no PHP page rendering. Content is authored in Word/Google Docs, delivered as fast static HTML, enhanced with vanilla JS. It connects to Commerce for data via APIs.",
      options: [
        { id: "q-ai3-028-a", text: "EDS uses the standard Magento theme system but serves all static assets from a CDN edge network", isCorrect: false },
        { id: "q-ai3-028-b", text: "EDS storefronts do not use Magento themes, LESS compilation, or PHP page rendering — content is authored in documents and delivered as fast static HTML with lightweight vanilla JavaScript", isCorrect: true },
        { id: "q-ai3-028-c", text: "EDS is an Adobe Commerce feature only available on the B2B edition", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-029", type: "SINGLE", sectionId: secJs.id,
      text: "Adobe Commerce on Cloud infrastructure includes Fastly as a bundled service. What is Fastly's primary role?",
      explanation: "Fastly is the edge layer: CDN (serving static assets globally), Full Page Cache (caching entire HTML pages at the edge), and DDoS/WAF protection. APM is New Relic; DB optimization is separate.",
      options: [
        { id: "q-ai3-029-a", text: "Application performance monitoring and error tracking (APM)", isCorrect: false },
        { id: "q-ai3-029-b", text: "CDN, full-page caching, and DDoS/WAF protection for the storefront", isCorrect: true },
        { id: "q-ai3-029-c", text: "Database query optimization and connection pooling", isCorrect: false },
      ],
    }),

    upsertQ({
      id: "q-ai3-030", type: "MULTIPLE", sectionId: secJs.id,
      text: "A developer needs to add a new custom attribute (field) to an existing Page Builder content type such as the built-in \"Banner\". Which TWO files must be created or modified? (Choose two.)",
      explanation: "Two files are required: the content type's XML config (declares the binding between form field and HTML output in `<appearances>`) and a UI Component form XML file (adds the input field to the settings panel). `di.xml` plugins and `requirejs-config.js` are not involved.",
      options: [
        { id: "q-ai3-030-a", text: "The content type's XML configuration file — to declare the new attribute mapping between the form field and the HTML output", isCorrect: true },
        { id: "q-ai3-030-b", text: "The module's `etc/di.xml` — to register a plugin on the Page Builder renderer class", isCorrect: false },
        { id: "q-ai3-030-c", text: "A UI Component form XML file — to add the new input field to the content type's settings panel", isCorrect: true },
        { id: "q-ai3-030-d", text: "A new `requirejs-config.js` entry — to register the new attribute as a RequireJS module alias", isCorrect: false },
      ],
    }),

  ]); // end exam3Qs

  console.log(`AI Exam #3: ${exam3Qs.length} questions created.`);

  // ═══════════════════════════════════════════════════════════════════════════
  // Practice Tests
  // ═══════════════════════════════════════════════════════════════════════════

  const tests = [
    { id: "pt-ai-e727-v1", title: "AI Practice Test #1", qs: exam1Qs },
    { id: "pt-ai-e727-v2", title: "AI Practice Test #2", qs: exam2Qs },
    { id: "pt-ai-e727-v3", title: "AI Practice Test #3", qs: exam3Qs },
  ];

  for (const t of tests) {
    await prisma.practiceTestQuestion.deleteMany({ where: { practiceTestId: t.id } });

    await prisma.practiceTest.upsert({
      where: { id: t.id },
      update: { title: t.title, questionCount: t.qs.length },
      create: {
        id: t.id,
        certificationId: certId,
        title: t.title,
        type: "AI_GENERATED",
        questionCount: t.qs.length,
      },
    });

    for (let i = 0; i < t.qs.length; i++) {
      await prisma.practiceTestQuestion.create({
        data: { practiceTestId: t.id, questionId: t.qs[i].id, position: i + 1 },
      });
    }

    console.log(`Linked ${t.qs.length} questions to ${t.title}.`);
  }

  console.log("AI practice tests seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
