# Day 9 — Working with LESS & UI Library Components

## Table of Contents

- [1. LESS Fundamentals for Magento Developers](#1-less-fundamentals-for-magento-developers)
- [2. Magento UI Library Overview](#2-magento-ui-library-overview)
- [3. UI Library File Structure](#3-ui-library-file-structure)
- [4. Available UI Library Components](#4-available-ui-library-components)
- [5. How LESS Mixins Work in Magento](#5-how-less-mixins-work-in-magento)
- [6. Including UI Library Mixins in Your Theme](#6-including-ui-library-mixins-in-your-theme)
- [7. Customizing via Variable Overrides](#7-customizing-via-variable-overrides)
- [8. Responsive Design with LESS Breakpoints](#8-responsive-design-with-less-breakpoints)
- [9. Hands-On: Button Style Customization](#9-hands-on-button-style-customization)
- [10. Hands-On: Breakpoint Override](#10-hands-on-breakpoint-override)
- [11. CE vs EE UI Library Differences](#11-ce-vs-ee-ui-library-differences)
- [12. Quick-Reference Checklist](#12-quick-reference-checklist)

---

## 1. LESS Fundamentals for Magento Developers

LESS (Leaner Style Sheets) is a CSS pre-processor that extends CSS with variables, mixins, nesting, functions, and operations. Magento's frontend theming system is built entirely around LESS. If your background is backend PHP/XML, this section gives you the minimum mental model needed.

### 1.1 Variables

```less
// Declare a variable with @
@primary__color: #eb5202;
@font-size__base: 14px;

// Use it anywhere below
body {
    color: @primary__color;
    font-size: @font-size__base;
}
```

**Exam focus:** Magento variable names use double underscores as a namespace separator (e.g. `@button__background`, `@font-size__base`). This is a convention, not a LESS requirement.

### 1.2 Mixins

A mixin is a reusable block of CSS rules that you can "call" from anywhere. Think of it like a PHP function that outputs CSS.

```less
// Define a mixin
.border-radius(@radius: 4px) {
    border-radius: @radius;
    -webkit-border-radius: @radius;
}

// Call it
.my-button {
    .border-radius(6px);
    background: #fff;
}
```

Compiled output:

```css
.my-button {
    border-radius: 6px;
    -webkit-border-radius: 6px;
    background: #fff;
}
```

### 1.3 Nesting

```less
.nav {
    background: #333;

    li {
        display: inline-block;
    }

    a {
        color: white;

        &:hover {
            color: #eb5202;   // & refers to parent selector
        }
    }
}
```

### 1.4 Operations and Functions

```less
@base-padding: 10px;

.container {
    padding: @base-padding * 2;      // 20px
    margin: @base-padding + 5px;     // 15px
    background: lighten(#eb5202, 20%);
}
```

### 1.5 `@import` Directives

```less
@import 'source/_variables';       // imports _variables.less and outputs its CSS
@import (reference) 'source/lib'; // imports but does NOT output CSS — only makes mixins/vars available
```

**Exam focus:** `@import (reference)` is a LESS keyword that pulls in another file's mixins and variables WITHOUT emitting any CSS output. This is useful when you want to use a library's tools without dumping its raw CSS into your stylesheet.

### 1.6 LESS Lazy Evaluation — Last Definition Wins

Unlike most programming languages, LESS resolves variables lazily. The **last** declaration of a variable in scope wins, regardless of order:

```less
@color: red;
@color: blue;  // This wins — compiled output uses blue
```

This is why `_theme.less` (imported last) can override variables defined earlier in the chain.

---

## 2. Magento UI Library Overview

The **Magento UI Library** is a collection of reusable LESS mixins and variables that provide a consistent, themeable component system. It ships with Magento core and lives entirely under:

```
lib/web/css/
```

This path is *outside* any theme — it is part of the Magento framework itself and is available to every theme automatically.

```
lib/web/css/
+-- source/
|   +-- lib/                      <-- The UI Library lives here
|   |   +-- _lib.less             <-- Master import (imports all component files)
|   |   +-- _buttons.less         <-- Button mixin definitions
|   |   +-- _forms.less
|   |   +-- _typography.less
|   |   +-- _icons.less
|   |   +-- _responsive.less      <-- Responsive mixin definitions
|   |   +-- _variables.less       <-- Imports all variable files
|   |   +-- ... (one file per component, all flat — no subdirectories)
|   |   +-- variables/            <-- Per-component variable defaults
|   |       +-- _buttons.less
|   |       +-- _colors.less
|   |       +-- _typography.less
|   |       +-- _responsive.less  <-- Breakpoint variable definitions
|   |       +-- ...
```

**Exam focus:** The UI library lives at `lib/web/css/source/lib/`. It is **not** inside any theme directory. Do not confuse it with `app/design/frontend/<Vendor>/<theme>/web/css/`. There is no `mixins/` subdirectory — all component files are flat inside `lib/`.

---

## 3. UI Library File Structure

### 3.1 The Actual Directory Layout (verified against 2.4.8-p3)

```
lib/web/css/source/lib/
+-- _lib.less              <- Master import: pulls in all component files below
+-- _actions-toolbar.less
+-- _breadcrumbs.less
+-- _buttons.less          <- Button mixin definitions
+-- _dropdowns.less
+-- _forms.less
+-- _grids.less
+-- _icons.less
+-- _layout.less
+-- _loaders.less
+-- _messages.less
+-- _navigation.less
+-- _pages.less            <- Pagination
+-- _popups.less
+-- _rating.less
+-- _resets.less
+-- _responsive.less       <- Responsive mixin definitions
+-- _sections.less         <- Tabs / Accordions
+-- _tables.less
+-- _tooltips.less
+-- _typography.less
+-- _utilities.less
+-- _variables.less        <- Imports all files from variables/ subdirectory
+-- variables/             <- Per-component variable defaults
    +-- _buttons.less
    +-- _colors.less
    +-- _components.less
    +-- _layout.less
    +-- _responsive.less   <- Breakpoint variable definitions (@screen__m, etc.)
    +-- _typography.less
    +-- ... (one file per component)
```

**Important:** All component `.less` files are flat inside `lib/` — there is no `mixins/` subdirectory. The `variables/` subdirectory holds only default variable declarations.

### 3.2 `lib/web/css/source/lib/_lib.less`

This is the master file that imports every component. It is what gets pulled into the theme via `_styles.less`. Since every file it imports only *defines* mixins and variables (no direct CSS output), importing it does not emit CSS by itself.

### 3.3 How the Library Is Imported by Themes

The Blank/Luma theme imports `_lib.less` via a regular `@import` (not `reference`) inside `_styles.less`:

```less
// vendor/magento/theme-frontend-blank/web/css/_styles.less
@import 'source/lib/_lib.less'; // Global lib
@import 'source/_sources.less'; // Theme styles
@import 'source/_components.less'; // Components styles
```

This works without `(reference)` because the lib files only define mixins and variables — they don't contain direct CSS rules that would be emitted. CSS is only output when theme files *call* a mixin.

### 3.4 Variable Override File in Your Theme

For **child themes** (extending Blank or Luma), the correct place for variable overrides is `_theme.less`:

```
app/design/frontend/<Vendor>/<theme>/
+-- web/
    +-- css/
        +-- source/
            +-- _theme.less        <-- YOUR variable overrides go here (child themes)
            +-- _extend.less       <-- Extend/override specific component CSS rules
```

**Why not `_variables.less`?** The fallback mechanism replaces files whole — your `_variables.less` would completely replace the parent theme's (Luma/Blank), wiping out variables they define. `_theme.less` is imported after the full variable stack is loaded, so LESS lazy evaluation lets your declarations override the parent's without losing anything.

---

## 4. Available UI Library Components

Here is the full picture of what the UI library provides and where each lives:

| Component | File | Key Mixin(s) |
|---|---|---|
| Buttons | `_buttons.less` | `.lib-button()`, `.lib-button-primary()`, `.lib-button-reset()`, `.lib-button-as-link()` |
| Forms | `_forms.less` | `.lib-form-field()`, `.lib-form-element-input()`, `.lib-form-element-select()` |
| Typography | `_typography.less` | `.lib-font-size()`, `.lib-heading()`, `.lib-link()` |
| Icons | `_icons.less` | `.lib-icon-font()`, `.lib-icon-image()` |
| Grids | `_grids.less` | `.lib-column-wrapper()`, `.lib-inline-column-wrapper()` |
| Tooltips | `_tooltips.less` | `.lib-tooltip()` |
| Messages | `_messages.less` | `.lib-message()`, `.lib-message-icon-inner()` |
| Navigation | `_navigation.less` | `.lib-main-navigation()` |
| Breadcrumbs | `_breadcrumbs.less` | `.lib-breadcrumbs()` |
| Dropdowns | `_dropdowns.less` | `.lib-dropdown()` |
| Tables | `_tables.less` | `.lib-table()`, `.lib-table-bordered()` |
| Sections | `_sections.less` | `.lib-accordion()`, `.lib-tabs()` |
| Pages | `_pages.less` | `.lib-pager()` |
| Rating | `_rating.less` | `.lib-rating()`, `.lib-rating-summary()` |
| Loaders | `_loaders.less` | `.lib-loading-mask()` |
| Responsive | `_responsive.less` | `.media-width()`, breakpoint variables |
| Utilities | `_utilities.less` | `.lib-clearfix()`, `.lib-visually-hidden()`, `.lib-css()` |

**Note:** There is no `_modals.less` in the UI library. Modal CSS is handled by module-level LESS files, and modal behavior is JavaScript-driven.

**Exam focus:** Know that ALL of these components are mixin-based — you opt in by *calling* the mixin, rather than inheriting CSS automatically. The library itself emits no CSS unless called.

---

## 5. How LESS Mixins Work in Magento

### 5.1 The `.lib-*` Naming Convention

All Magento UI library mixins are prefixed with `.lib-`. This distinguishes them from third-party or custom mixins.

```less
// Example: applying the button mixin
.my-custom-button {
    .lib-button();
}

// Example: applying primary button styling
.action.primary {
    .lib-button-primary();
}
```

### 5.2 Mixins with Parameters vs. Variable-Driven Mixins

Magento UI library mixins come in two flavors:

**Type 1 — Variable-driven** (no arguments needed):
The mixin reads from global `@variables`. You customize by overriding those variables in `_theme.less`.

```less
// The mixin internally uses @button__background, @button__color, etc.
.lib-button() {
    background: @button__background;
    border: @button__border;
    color: @button__color;
    // ...
}

// To customize, override the variable in your _theme.less:
@button__background: #ff0000;
```

**Type 2 — Parameterized** (accepts arguments):
You pass values directly when calling the mixin.

```less
// lib-font-size accepts a direct value
.lib-font-size(
    @_font-size: @font-size__base
);
```

**Exam focus:** Most Magento UI library mixins are variable-driven. The correct customization approach is to override variables in your theme's `_theme.less`, not to pass parameters directly to the mixin (unless you need a one-off override for a specific selector).

### 5.3 The `.lib-css()` Utility Mixin

`lib-css()` is a special utility that conditionally outputs a CSS property only if the value is not `false`. This is used throughout the library to allow "disabling" a property.

```less
// Usage
.lib-css(color, @link__color);
.lib-css(font-weight, @link__font-weight);
```

Setting a variable to `false` disables that CSS property entirely:

```less
@link__font-weight: false; // This property will NOT be output
```

**Exam focus:** `false` as a variable value is a Magento convention to suppress CSS property output via `.lib-css()`. This is a common exam topic.

---

## 6. Including UI Library Mixins in Your Theme

### 6.1 How `styles-m.less` and `styles-l.less` Relate

A common misconception: `styles-l.less` does **not** import `styles-m.less`. Both are independent entry points that both import the same shared base `_styles.less`:

```
styles-m.less                         styles-l.less
+-- @import 'source/_reset.less'       +-- @import '_styles.less'  (same shared base)
+-- @import '_styles.less'             +-- //@magento_import '_module.less'
|   +-- source/lib/_lib.less           +-- @import 'source/_theme.less'
|   +-- source/_sources.less           +-- //@magento_import '_extend.less'
|   +-- source/_components.less        +-- @import 'source/lib/_responsive.less'
+-- //@magento_import '_module.less'   +-- @media-target: 'desktop'
+-- //@magento_import '_widgets.less'  +-- @media-common: false
+-- @import 'source/_theme.less'
+-- //@magento_import '_extend.less'
+-- @import 'source/lib/_responsive.less'
+-- @media-target: 'mobile'
```

The key difference is `@media-target` and `@media-common` — these flags tell the responsive mixin system which breakpoint blocks to emit in each file.

### 6.1.1 How `@media-target` Controls Output — Under the Hood

`@media-target` is not a CSS feature — it is a **LESS compile-time conditional**. The responsive mixin file (`lib/web/css/source/lib/_responsive.less`) wraps every breakpoint block with a `when` guard that checks the value of this variable at compile time:

```less
// lib/web/css/source/lib/_responsive.less (simplified)

& when (@media-target = 'mobile'), (@media-target = 'all') {

    @media only screen and (max-width: (@screen__m - 1)) {
        .media-width('max', @screen__m);    // calls any consumer that declared this breakpoint
    }

    @media all and (min-width: @screen__s) {
        .media-width('min', @screen__s);
    }
}

& when (@media-target = 'desktop'), (@media-target = 'all') {

    @media all and (min-width: @screen__m),
    print {
        .media-width('min', @screen__m);    // only compiled when target = desktop
    }

    @media all and (min-width: @screen__xl),
    print {
        .media-width('min', @screen__xl);
    }
}
```

When `styles-m.less` sets `@media-target: 'mobile'`, the LESS compiler evaluates those `when` guards and **skips the entire desktop block**. The desktop breakpoint wrappers never make it into `styles-m.css` at all — there is no JavaScript or runtime switching involved. It is purely a compile-time decision.

When `styles-l.less` sets `@media-target: 'desktop'`, the mobile block is skipped and only desktop breakpoints are compiled.

The value `'all'` (used in development/non-split setups) matches both guards and emits everything.

### 6.1.2 How `@media-common` Works

`@media-common` controls styles that are **not breakpoint-specific** — base rules that need to be in both the mobile and desktop compiled files.

```less
// Pattern used throughout the theme and modules:
& when (@media-common = true) {
    .my-element {
        border: 1px solid @border-color__base;
        padding: @indent__s;
    }
}
```

- In `styles-m.less`: `@media-common: true` → this block **is compiled**
- In `styles-l.less`: `@media-common: false` → this block **is skipped**

This prevents those base styles from being emitted twice. Since `styles-m.css` is loaded on all devices, common styles only need to live there. `styles-l.css` is loaded only on desktop, so it only needs the desktop-specific overrides.

### 6.1.3 How `.media-width()` Actually Works — `min` vs `max` and the -1px Rule

The `.media-width()` mixin is called by **your code**, but the `@media` wrapper around it is defined **inside `_responsive.less`**. Look at how the system works together:

```less
// _responsive.less — the framework side:
@media only screen and (max-width: (@screen__s - 1)) {
    .media-width('max', @screen__s);      // calls anything declared with ('max', @screen__s)
}

@media all and (min-width: @screen__m) {
    .media-width('min', @screen__m);      // calls anything declared with ('min', @screen__m)
}
```

```less
// Your code — the consumer side:
.media-width('max', @screen__s) {
    .navigation li { display: block; }    // your styles, injected into the framework's wrapper
}

.media-width('min', @screen__m) {
    .navigation li { display: inline-block; }
}
```

The `@screen__s` or `@screen__m` you pass is not the pixel value that ends up in the CSS — it is a **lookup key** that matches the entry point defined in `_responsive.less`. The framework has already applied the correct `max-width: (@screen__s - 1)` around it.

**Why `min` uses the exact value but `max` uses -1px:**

| Call | CSS emitted | Meaning |
|---|---|---|
| `.media-width('min', @screen__m)` | `min-width: 768px` | 768px and above |
| `.media-width('max', @screen__s)` | `max-width: 639px` | up to 639px, not including 640px |

For `min`, the exact value is the correct inclusive lower bound — no adjustment needed.

For `max`, Magento applies the **exclusive upper bound** convention: when you say "max at `@screen__s`" you mean "everything *below* `@screen__s`", not "everything up to and including `@screen__s`". The `-1` is baked into `_responsive.less` so you do not have to think about it.

This also solves the **1px gap/overlap problem**: if both a `max` and a `min` rule used the exact same pixel value (640px), a device at exactly 640px would match *both* queries simultaneously. By emitting `max-width: 639px` and `min-width: 640px`, the ranges are cleanly adjacent with zero overlap and zero gap.

```
Device width:   ...638px   639px | 640px   641px...
max (@screen__s):  ✓        ✓   |   ✗       ✗
min (@screen__s):  ✗        ✗   |   ✓       ✓
                              ^
                         clean boundary
```

**Exam focus:** You never write the pixel value directly in your `.media-width()` call — you pass the variable name as a lookup key. The offset logic lives inside `_responsive.less`, not in your code.

### 6.2 Calling a Library Mixin in Your Component File

Since `_lib.less` is already imported by `_styles.less` (part of the compilation chain), all `.lib-*` mixins are available in any file that gets compiled as part of that chain.

```less
// app/design/frontend/MyVendor/mytheme/web/css/source/_extend.less

// No need to re-import the library — it's already loaded via _styles.less

.action.tocart {
    .lib-button-primary();   // Apply primary button styling
    width: 100%;
}

.action.secondary {
    .lib-button();           // Apply base button styling
}

.action.remove {
    .lib-button-as-link();   // Strip button styling, make it look like a link
    color: @link__color;
}
```

**Exam focus:** You do not re-import the library in every component file. The import chain from `styles-m.less` → `_styles.less` → `_lib.less` makes all mixins available throughout the compilation.

---

## 7. Customizing Library Components via Variable Overrides

### 7.1 The Override Mechanism

Variable overrides work because of LESS lazy evaluation — the **last definition wins**. Your `_theme.less` is imported after all lib and parent theme variables, so your declarations override without you needing to copy anything:

```
Import order (Blank/Luma):
  1. lib variables (defaults)         -- @button__background: @color-gray95
  2. parent theme _variables.less     -- may override some lib defaults
  3. //@magento_import _module.less   -- module component styles
  4. @import source/_theme.less       -- YOUR overrides win here (last definition)
  5. //@magento_import _extend.less   -- CSS rule additions (after variables are resolved)
```

> **Never edit** `lib/web/css/source/lib/variables/*.less` directly — these are framework files overwritten on upgrade.

### 7.2 Your Theme's `source/_theme.less`

```less
// app/design/frontend/MyVendor/mytheme/web/css/source/_theme.less

//  =============================================
//  Typography
//  =============================================
@font-family__base:           'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
@font-size__base:             14px;
@font-size__xl:               ceil((@font-size__base * 1.5));
@font-weight__regular:        400;
@font-weight__semibold:       600;
@font-weight__bold:           700;
@line-height__base:           1.428571429;

//  =============================================
//  Color Palette
//  =============================================
@color-orange-red1:           #eb5202;
@color-orange-red2:           #ba4218;

//  =============================================
//  Primary Palette (Semantic names)
//  =============================================
@primary__color:              @color-orange-red1;
@link__color:                 @color-orange-red1;
@link__color-alt:             @color-orange-red2;

//  =============================================
//  Buttons
//  =============================================
@button-primary__background:         @color-orange-red1;
@button-primary__border:             1px solid @color-orange-red2;
@button-primary__color:              #ffffff;

@button-primary__hover__background:  @color-orange-red2;
@button-primary__hover__color:       #ffffff;

@button__border-radius:              4px;
@button__font-size:                  @font-size__base;
@button__font-weight:                @font-weight__semibold;

//  =============================================
//  Forms
//  =============================================
@form-element-input__border:              1px solid #cccccc;
@form-element-input__border-color-focus:  @primary__color;
@form-element-input__border-radius:       3px;
```

### 7.3 Variable Naming Pattern Reference

```
@[component]__[property]
@[component]__[state]__[property]
@[component]-[sub-element]__[property]

Examples:
@button__background           -> button, background property
@button__hover__background    -> button, hover state, background
@button-primary__background   -> button variant "primary", background
@form-element-input__border   -> form's input element, border property
```

**Exam focus:** Know the double-underscore naming convention. State segments (`hover`, `active`, `focus`) use double underscores too: `@button__hover__background`, `@button-primary__hover__background`.

---

## 8. Responsive Design with LESS Breakpoints

### 8.1 The Responsive System Files

```
lib/web/css/source/lib/
+-- _responsive.less              <- Responsive MIXIN definitions (.media-width())
+-- variables/
    +-- _responsive.less          <- Breakpoint VARIABLE definitions (@screen__m, etc.)
```

Both files work together — the variable file defines the pixel values, the mixin file uses them.

### 8.2 Breakpoint Variables (verified against 2.4.8-p3)

Defined in `lib/web/css/source/lib/variables/_responsive.less`:

```less
@screen__xxs:  320px;
@screen__xs:   480px;
@screen__s:    640px;
@screen__m:    768px;   // Main mobile/desktop threshold
@screen__l:    1024px;  // Large desktop
@screen__xl:   1440px;
```

**Exam focus:** `@screen__m: 768px` is the primary breakpoint dividing mobile from desktop styles. Know all six values.

### 8.3 Media Query Strategy Variables

The responsive system uses two boolean flags to control which CSS goes into which compiled file:

```less
// Set in styles-m.less:
@media-target: 'mobile';   // Output mobile-targeted blocks
@media-common: true;        // Output common (all-screen) blocks

// Set in styles-l.less:
@media-target: 'desktop';  // Output desktop-targeted blocks
@media-common: false;       // Skip common blocks (already in styles-m.css)
```

| File | `@media-target` | `@media-common` | Contains |
|---|---|---|---|
| `styles-m.less` | `'mobile'` | `true` | Common CSS + mobile-specific |
| `styles-l.less` | `'desktop'` | `false` | Desktop overrides only |

### 8.4 The `.media-width()` Mixin

```less
// lib/web/css/source/lib/_responsive.less defines:
.media-width(@extremum, @break) { ... }

// Usage examples:
.media-width('min', @screen__m) {
    // Applied at >= 768px (tablet and up)
    .navigation li { display: inline-block; }
}

.media-width('max', @screen__s) {
    // Applied at <= 639px (small mobile only)
    .navigation li { display: block; }
}
```

### 8.5 `@media-common` — Styles That Apply Everywhere

```less
// Pattern for styles that should output in BOTH mobile and desktop files:
& when (@media-common = true) {
    .my-element {
        color: red;
    }
}
```

### 8.6 Full Responsive Pattern in Practice

```less
// app/design/frontend/MyVendor/mytheme/Magento_Catalog/web/css/source/_extend.less

//  Common styles (output in both styles-m.css and styles-l.css)
& when (@media-common = true) {
    .product-item {
        border: 1px solid @border-color__base;
        padding: @indent__s;
    }
}

//  Mobile-specific (max-width)
& when (@media-target = 'mobile'), (@media-target = 'all') {
    @media all and (max-width: (@screen__m - 1)) {
        .product-item {
            width: 100%;
        }
    }
}

//  Tablet and up (min-width: 768px)
& when (@media-target = 'desktop'), (@media-target = 'all') {
    @media all and (min-width: @screen__m) {
        .product-item {
            width: 50%;
            float: left;
        }
    }
}

//  Large desktop (min-width: 1024px)
& when (@media-target = 'desktop'), (@media-target = 'all') {
    @media all and (min-width: @screen__l) {
        .product-item {
            width: 25%;
        }
    }
}
```

**Exam focus:** The mobile-first split is `styles-m.less` for mobile/common + `styles-l.less` for desktop. `@screen__m` (768px) is the main threshold. `@media-common` controls what outputs into BOTH files.

---

## 9. Hands-On: Button Style Customization

### 9.1 Goal

Customize the primary "Add to Cart" button to use a brand orange color with hover state and rounded corners.

### 9.2 Step 1 — Override Variables in `_theme.less`

```less
// app/design/frontend/MyVendor/mytheme/web/css/source/_theme.less

//  =============================================
//  Custom Brand Colors
//  =============================================
@brand-orange:                       #e07b39;
@brand-orange-dark:                  #c4622d;

//  =============================================
//  Primary Button Overrides
//  =============================================
@button-primary__background:         @brand-orange;
@button-primary__border:             1px solid @brand-orange-dark;
@button-primary__color:              #ffffff;

@button-primary__hover__background:  @brand-orange-dark;
@button-primary__hover__border:      1px solid darken(@brand-orange-dark, 5%);
@button-primary__hover__color:       #ffffff;

@button-primary__active__background: darken(@brand-orange-dark, 8%);
@button-primary__active__border:     1px solid darken(@brand-orange-dark, 10%);
@button-primary__active__color:      #ffffff;

//  Base button border radius (applies to all buttons)
@button__border-radius:              4px;
```

### 9.3 Step 2 — Apply the Mixin (Optional Extra Customization)

If variable overrides alone are not sufficient (for example, you need completely custom structure for a specific selector), explicitly call the mixin:

```less
// app/design/frontend/MyVendor/mytheme/web/css/source/_extend.less

& when (@media-common = true) {

    //  "Add to Cart" specific overrides
    .action.tocart {
        .lib-button-primary();   // Apply all primary button variables

        // Extra styles on top of the mixin output
        width: 100%;
        display: block;
        text-align: center;
        margin-top: 10px;
    }

    //  Reset button styling (remove all decoration, look like a link)
    .action.remove {
        .lib-button-as-link();
        color: @link__color;

        &:hover {
            text-decoration: underline;
        }
    }
}
```

### 9.4 What `.lib-button-primary()` Does Under the Hood

```less
.lib-button-primary() {
    .lib-button();     // Base button styles first

    .lib-css(background, @button-primary__background);
    .lib-css(border, @button-primary__border);
    .lib-css(color, @button-primary__color);

    &:focus,
    &:active {
        .lib-css(background, @button-primary__active__background);
        .lib-css(border, @button-primary__active__border);
        .lib-css(color, @button-primary__active__color);
    }

    &:hover {
        .lib-css(background, @button-primary__hover__background);
        .lib-css(border, @button-primary__hover__border);
        .lib-css(color, @button-primary__hover__color);
    }
}
```

**Exam focus:** `.lib-button-primary()` calls `.lib-button()` internally — you get ALL base button styles plus the primary overrides. You do not need to call both.

### 9.5 Deploy and Verify

```bash
# Developer mode — clear compiled assets then reload the page
rm -rf pub/static/frontend/
rm -rf var/view_preprocessed/
bin/magento cache:flush

# Production mode — full static deploy
bin/magento setup:static-content:deploy -f -t MyVendor/mytheme en_US
```

---

## 10. Hands-On: Breakpoint Override

### 10.1 Goal

Change the main mobile/desktop breakpoint from 768px to 800px.

### 10.2 Override the Breakpoint Variable in `_theme.less`

```less
// app/design/frontend/MyVendor/mytheme/web/css/source/_theme.less

//  Override: shift the main breakpoint from 768px to 800px
@screen__m: 800px;

//  Optionally adjust the large breakpoint too
@screen__l: 1100px;
```

### 10.3 What Changes Automatically

Because the entire UI library references `@screen__m` in media queries, changing this one variable cascades throughout every component:

```
Before (768px):                      After (800px):
@media (min-width: 768px) {    -->   @media (min-width: 800px) {
    .navigation li { ... }               .navigation li { ... }
}                                    }
```

Components that use `@screen__m`:
- Navigation (mobile nav trigger threshold)
- Header layout (logo positioning, search bar)
- Product grid columns
- Footer columns
- Checkout layout

### 10.4 Verify the Change

```bash
# Redeploy
bin/magento setup:static-content:deploy -f -t MyVendor/mytheme en_US

# Confirm the new value appears in compiled CSS
grep "min-width: 800px" pub/static/frontend/MyVendor/mytheme/en_US/css/styles-l.css | head -5
```

**Exam focus:** Overriding `@screen__m` cascades to ALL components using that breakpoint. You do not need to update each component individually.

---

## 11. CE vs EE UI Library Differences

### 11.1 Comparison Overview

| Aspect | CE (Community Edition) | EE (Enterprise Edition) |
|---|---|---|
| `lib/web/css/source/lib/` | Full UI library | Identical — same library |
| Additional UI components | — | Gift registry, reward points, store credit, B2B company styles |
| `_variables.less` defaults | Standard | Same defaults |
| Admin-specific LESS | `app/design/adminhtml/` | Additional EE admin module files |
| Frontend module LESS | Standard modules | Additional EE module `_module.less` files |

### 11.2 Where EE Adds Frontend Styles

EE does **not** modify `lib/web/css/`. Instead, EE modules add their own LESS files under `vendor/magento/module-*/view/frontend/web/css/source/`:

```
vendor/magento/module-b2b/view/frontend/web/css/source/_module.less
vendor/magento/module-company/view/frontend/web/css/source/_module.less
vendor/magento/module-company-shipping/view/frontend/web/css/source/_module.less
vendor/magento/module-company-credit/view/frontend/web/css/source/_module.less
vendor/magento/module-checkout-address-search-gift-registry/view/frontend/web/css/source/_module.less
```

They use the same `.lib-*` mixins and the same `@variable` system — fully integrated into the theme.

### 11.3 Key Takeaway for the Exam

**Exam focus:** The `lib/web/css/source/lib/` UI library is **identical** in CE and EE. EE's additional UI is provided by separate module-level LESS files that integrate with the same mixin system. The exam may ask whether EE has a "different" UI library — the answer is no, EE extends through module LESS, not by modifying the core library.

---

## 12. Quick-Reference Checklist

### Core Paths

- [ ] UI Library location: **`lib/web/css/source/lib/`**
- [ ] Library master import file: **`lib/web/css/source/lib/_lib.less`**
- [ ] Default variable files: **`lib/web/css/source/lib/variables/`** (one file per component)
- [ ] Breakpoint definitions: **`lib/web/css/source/lib/variables/_responsive.less`**
- [ ] Your theme variable overrides: **`web/css/source/_theme.less`** (child themes — NOT `_variables.less`)
- [ ] Entry points: **`styles-m.less`** (mobile+common) and **`styles-l.less`** (desktop only)

### Import Behavior

- [ ] `@import 'file.less'` — standard import, outputs CSS rules if any are present
- [ ] `@import (reference) 'file.less'` — imports mixins/variables only, no CSS output
- [ ] Lib files (`_lib.less` and all components) contain only mixin/variable definitions — no direct CSS output regardless of import mode
- [ ] `styles-l.less` and `styles-m.less` are **independent** — both import `_styles.less` as a shared base. `styles-l.less` does NOT import `styles-m.less`

### LESS Variable Conventions

- [ ] Double underscore separates component from property: `@button__background`
- [ ] State segment also uses double underscore: `@button__hover__background`, `@button-primary__hover__background`
- [ ] Sub-element / variant uses single dash: `@button-primary__background`
- [ ] Setting a variable to **`false`** suppresses that CSS property via `.lib-css()`
- [ ] **Last definition wins** (lazy evaluation) — `_theme.less` imported last overrides everything above

### Mixin System

- [ ] All UI library mixins are prefixed: **`.lib-*`**
- [ ] Button variants: `.lib-button()`, `.lib-button-primary()`, `.lib-button-reset()`, `.lib-button-as-link()`
- [ ] `.lib-button-primary()` **includes** `.lib-button()` internally — no need to call both
- [ ] `.lib-css(@property, @value)` — **conditionally outputs** CSS only if value is not `false`
- [ ] No `.lib-button-secondary()` exists — use `.lib-button()` with variable overrides for secondary variants

### Responsive System

- [ ] `@screen__xxs`: 320px, `@screen__xs`: 480px, `@screen__s`: 640px
- [ ] `@screen__m`: **768px** (main mobile/desktop breakpoint)
- [ ] `@screen__l`: **1024px**, `@screen__xl`: 1440px
- [ ] All breakpoints defined in: `lib/web/css/source/lib/variables/_responsive.less`
- [ ] `@media-common: true` — styles output in **both** compiled CSS files
- [ ] `@media-target: 'mobile'` — styles only in `styles-m.css`
- [ ] `@media-target: 'desktop'` — styles only in `styles-l.css`
- [ ] Overriding `@screen__m` in your `_theme.less` cascades to ALL components using that breakpoint

### Available Components (know the file names)

- [ ] `_buttons.less` — `.lib-button()`, `.lib-button-primary()`, `.lib-button-reset()`, `.lib-button-as-link()`
- [ ] `_forms.less` — `.lib-form-field()`, `.lib-form-element-input()`
- [ ] `_typography.less` — `.lib-font-size()`, `.lib-heading()`, `.lib-link()`
- [ ] `_icons.less` — `.lib-icon-font()`, `.lib-icon-image()`
- [ ] `_tooltips.less` — `.lib-tooltip()`
- [ ] `_messages.less` — `.lib-message()`
- [ ] `_sections.less` — `.lib-tabs()`, `.lib-accordion()`
- [ ] `_utilities.less` — `.lib-clearfix()`, `.lib-visually-hidden()`, `.lib-css()`
- [ ] **No `_modals.less`** in lib — modal CSS lives in module-level LESS, behavior is JS-driven

### CE vs EE

- [ ] `lib/web/css/source/lib/` is **identical** in CE and EE
- [ ] EE adds styles via **module-level LESS** in `vendor/magento/module-*/view/frontend/web/css/`
- [ ] EE modules use the same `.lib-*` mixins and `@variable` system
- [ ] EE modules with notable LESS: B2b, Company, CompanyCredit, GiftRegistry, GiftCard

### Customization Workflow

- [ ] **Never** edit `lib/web/css/source/lib/` files directly
- [ ] **Never** edit parent theme LESS files directly
- [ ] Correct workflow: **override variables in `_theme.less`** → clear caches → verify
- [ ] Developer mode: `rm -rf pub/static/frontend/ var/view_preprocessed/ && bin/magento cache:flush`
- [ ] Production mode: `bin/magento setup:static-content:deploy -f -t Vendor/theme en_US`
