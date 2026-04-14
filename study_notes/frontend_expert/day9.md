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
@import 'source/_variables';       // imports _variables.less
@import (reference) 'source/lib'; // imports but does NOT output CSS — only makes mixins/vars available
```

**Exam focus:** `@import (reference)` is critically important in Magento. It pulls in the UI library's mixins and variables WITHOUT generating any CSS output. This prevents duplicate CSS.

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
|   +-- lib/                  <-- The UI Library components live here
|   |   +-- _actions-toolbar.less
|   |   +-- _breadcrumbs.less
|   |   +-- _buttons.less
|   |   +-- _dropdowns.less
|   |   +-- _forms.less
|   |   +-- _grids.less
|   |   +-- _icons.less
|   |   +-- _layout.less
|   |   +-- _list.less
|   |   +-- _loaders.less
|   |   +-- _messages.less
|   |   +-- _modals.less
|   |   +-- _navigation.less
|   |   +-- _pages.less        (pagination)
|   |   +-- _popups.less
|   |   +-- _rating.less
|   |   +-- _resets.less
|   |   +-- _responsive.less
|   |   +-- _sections.less     (tabs/accordions)
|   |   +-- _table.less
|   |   +-- _tooltips.less
|   |   +-- _typography.less
|   |   +-- _utilities.less
|   |   +-- _variables.less    <-- Default variable definitions
|   +-- _lib.less              <-- Master import file for all lib components
+-- _styles.less               <-- Entry point, imports _lib.less
```

**Exam focus:** The UI library lives at `lib/web/css/source/lib/`. It is **not** inside any theme directory. Do not confuse it with `app/design/frontend/<Vendor>/<theme>/web/css/`.

---

## 3. UI Library File Structure

### 3.1 The Entry Point Chain

Understanding how LESS files chain together is essential:

```
pub/static/frontend/<Vendor>/<theme>/en_US/css/styles-m.css
        ^
        | compiled from
        |
app/design/frontend/<Vendor>/<theme>/web/css/styles-m.less
        |
        | @import 'source/_theme'   (theme-level overrides)
        | @import (reference) 'source/lib'  (UI library, reference only)
        |
lib/web/css/source/_lib.less   (master import)
        |
        | @import 'lib/_variables'
        | @import 'lib/_buttons'
        | @import 'lib/_forms'
        | ... (all components)
```

### 3.2 `lib/web/css/source/_lib.less`

This is the master file that imports every component. When a theme imports `(reference) 'source/lib'`, it gains access to all variable defaults and all mixins without emitting any CSS.

### 3.3 `lib/web/css/source/lib/_variables.less`

This file contains *every* configurable variable for the entire UI library — colors, typography, spacing, breakpoints, component-specific settings. It uses a naming convention:

```
@component__property
@component__property--modifier
@component-sub-element__property
```

Examples:

```less
//  Buttons
@button__font-size:                  @font-size__base;
@button__line-height:                @line-height__base;
@button__background:                 @color-gray-darken0;
@button__border:                     1px solid @button__border-color;
@button__border-color:               @color-gray-darken3;
@button__color:                      @text__color;
@button__padding:                    7px 15px;
@button__margin:                     0;
@button__cursor:                     pointer;
@button__font-family:                @font-family__base;
@button__font-weight:                @font-weight__semibold;

//  Primary button
@button-primary__background:         @color-blue-darken1;
@button-primary__border:             1px solid @button-primary__border-color;
@button-primary__border-color:       @color-blue-darken1;
@button-primary__color:              @color-white;
```

**Exam focus:** Variable overrides must be declared *before* the component's LESS is loaded. The correct place is your theme's `web/css/source/_variables.less`.

---

## 4. Available UI Library Components

Here is the full picture of what the UI library provides and where each lives:

| Component | File | Key Mixin(s) |
|---|---|---|
| Buttons | `_buttons.less` | `.lib-button()`, `.lib-button-primary()`, `.lib-button-secondary()`, `.lib-button-reset()` |
| Forms | `_forms.less` | `.lib-form-field()`, `.lib-form-element-input()`, `.lib-form-element-select()` |
| Typography | `_typography.less` | `.lib-font-size()`, `.lib-heading()`, `.lib-link()` |
| Icons | `_icons.less` | `.lib-icon-font()`, `.lib-icon-image()` |
| Grids | `_grids.less` | `.lib-vendor-prefix-display()`, grid layout mixins |
| Modals | `_modals.less` | Variables only; JS handles modal behavior |
| Tooltips | `_tooltips.less` | `.lib-tooltip()` |
| Messages | `_messages.less` | `.lib-message()`, `.lib-message-icon-inner()` |
| Navigation | `_navigation.less` | `.lib-main-navigation()` |
| Breadcrumbs | `_breadcrumbs.less` | `.lib-breadcrumbs()` |
| Dropdowns | `_dropdowns.less` | `.lib-dropdown()` |
| Tables | `_table.less` | `.lib-table()`, `.lib-table-bordered()` |
| Sections | `_sections.less` | `.lib-accordion()`, `.lib-tabs()` |
| Pages | `_pages.less` | `.lib-pager()` |
| Rating | `_rating.less` | `.lib-rating()`, `.lib-rating-summary()` |
| Loaders | `_loaders.less` | `.lib-loading-mask()` |
| Responsive | `_responsive.less` | `.lib-css()`, media query variables |
| Utilities | `_utilities.less` | `.lib-clearfix()`, `.lib-visually-hidden()`, `.lib-css()` |

**Exam focus:** Know that ALL of these components are mixin-based — you opt in by *calling* the mixin, rather than inheriting CSS automatically. The library itself emits no CSS unless the mixin is called.

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
The mixin reads from global `@variables`. You customize by overriding those variables.

```less
// The mixin internally uses @button__background, @button__color, etc.
.lib-button() {
    background: @button__background;
    border: @button__border;
    color: @button__color;
    // ...
}

// To customize, just override the variable BEFORE the import:
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

**Exam focus:** Most Magento UI library mixins are variable-driven. The correct customization approach is to override variables in `source/_variables.less`, not to pass parameters directly to the mixin.

### 5.3 The `.lib-css()` Utility Mixin

`lib-css()` is a special utility that conditionally outputs a CSS property only if the value is not `false`. This is used throughout the library to allow "disabling" a property.

```less
// Definition (conceptual)
.lib-css(@property, @value, @enabled: 1) {
    & when not (@value = false) and (@enabled = 1) {
        @{property}: @value;
    }
}

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

### 6.1 Theme Directory Structure (Recap)

```
app/design/frontend/<Vendor>/<Theme>/
+-- web/
|   +-- css/
|   |   +-- styles-m.less          <-- Entry point for mobile styles
|   |   +-- styles-l.less          <-- Entry point for desktop styles
|   |   +-- source/
|   |   |   +-- _theme.less        <-- Theme-wide overrides
|   |   |   +-- _variables.less    <-- YOUR variable overrides go here
|   |   |   +-- _extend.less       <-- Extend/override specific component styles
|   |   |   +-- components/
|   |   |   |   +-- _buttons.less  <-- Component-specific overrides
```

### 6.2 `styles-m.less` — The Entry Point

```less
// app/design/frontend/MyVendor/mytheme/web/css/styles-m.less

@import 'source/_variables';    // 1. Load YOUR variable overrides first
@import (reference) 'source/lib';  // 2. Load UI library (reference = no CSS output)
@import 'source/_theme';        // 3. Load theme-level styles
@import 'source/_extend';       // 4. Extend/override specific components
```

> **Why `(reference)` matters:** Without it, importing `source/lib` would dump ALL library CSS into your stylesheet immediately. With `(reference)`, you get the mixins and variables available to call, but zero CSS is emitted until you explicitly call a mixin.

### 6.3 Calling a Library Mixin in Your Component File

```less
// app/design/frontend/MyVendor/mytheme/web/css/source/components/_buttons.less

// You do NOT need to re-import the library here — it's already
// available as a (reference) from styles-m.less.

.action.tocart {
    .lib-button-primary();     // Apply primary button styling
    width: 100%;               // Add extra styles on top
}

.action.secondary {
    .lib-button();             // Apply base button styling
    .lib-button-secondary();   // Then layer secondary styles
}
```

**Exam focus:** You call library mixins *without* re-importing the library file in every component. The `(reference)` import in the entry point makes mixins available globally within that compilation pass.

---

## 7. Customizing Library Components via Variable Overrides

### 7.1 The Override Mechanism

The override flow works because of LESS variable scoping rules and the **import order**:

```
styles-m.less import order:
  1. source/_variables.less   <-- YOUR overrides (e.g., @button__background: red)
  2. source/lib               <-- Library defaults (@button__background: gray) — but yours wins!
  3. source/_theme.less
```

Wait — actually in LESS, variables use *lazy evaluation*, meaning the **last** definition in scope wins (unlike most programming languages). So the order that actually matters is:

```
In LESS: the LAST definition of a variable wins within a scope.
```

This means your `_variables.less` could technically come after the library import and still work. However, Magento convention is to load `_variables.less` first for clarity.

> **Important:** In Magento's actual compiled output, the theme-level `_variables.less` is what controls the final values. The key rule is: **never edit** `lib/web/css/source/lib/_variables.less` directly.

### 7.2 Your Theme's `source/_variables.less`

```less
// app/design/frontend/MyVendor/mytheme/web/css/source/_variables.less

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
@primary__color__dark:        darken(@primary__color, 10%);
@link__color:                 @color-orange-red1;
@link__color-alt:             @color-orange-red2;

//  =============================================
//  Buttons
//  =============================================
@button-primary__background:         @color-orange-red1;
@button-primary__border-color:       @color-orange-red2;
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
@button__background           -> button, background
@button__hover__background    -> button, hover state, background
@button-primary__background   -> button of type primary, background
@form-element-input__border   -> form element input sub-element, border
```

**Exam focus:** Know the double-underscore naming convention. The exam tests whether you know to override `@button-primary__background` (not `@button__primary-background` or some other variant).

---

## 8. Responsive Design with LESS Breakpoints

### 8.1 The Responsive System File

```
lib/web/css/source/lib/_responsive.less
```

This file defines:
1. **Breakpoint variables** — numeric pixel values
2. **Media query variables** — boolean flags controlling what CSS goes where
3. **Utility mixins** for responsive CSS output

### 8.2 Breakpoint Variables (verified against Magento 2.4.x)

```less
//  Breakpoints (defined in lib/web/css/source/lib/_variables.less)
@screen__xxs:  320px;
@screen__xs:   480px;
@screen__s:    640px;
@screen__m:    768px;
@screen__l:    1024px;
@screen__xl:   1440px;
```

### 8.3 Media Query Strategy Variables

Magento uses a mobile-first approach with two LESS compilation entry points:

| File | Purpose | Contains |
|---|---|---|
| `styles-m.less` | Mobile styles | Common CSS + mobile-specific |
| `styles-l.less` | Desktop styles | Desktop overrides only |

The responsive system uses these boolean flag variables:

```less
// These are set differently in styles-m.less vs styles-l.less
@media-common: true;   // Applies everywhere (both files)
@media-target: 'mobile'; // or 'desktop' or 'all'
```

### 8.4 The `media-queries.less` Mixin Pattern

```less
// lib/web/css/source/lib/_responsive.less
// Defines the .media-width() mixin:

.media-width(@extremum, @break) {
    // Outputs CSS inside the correct media query
}
```

In practice, Magento component files use this pattern:

```less
// In any component's .less file:

//  Mobile (max-width breakpoint)
& when (@media-target = 'mobile'), (@media-target = 'all') {
    @media all and (max-width: (@screen__m - 1)) {
        .navigation li {
            display: block;
        }
    }
}

//  Desktop (min-width breakpoint)
& when (@media-target = 'desktop'), (@media-target = 'all') {
    @media all and (min-width: @screen__m) {
        .navigation li {
            display: inline-block;
        }
    }
}
```

### 8.5 `@media-common` — Styles That Apply Everywhere

```less
// Pattern for styles that should go in BOTH mobile and desktop:
& when (@media-common = true) {
    .my-element {
        color: red;       // This CSS goes into both styles-m.css and styles-l.css
    }
}
```

### 8.6 Practical Responsive LESS in a Theme File

```less
// app/design/frontend/MyVendor/mytheme/web/css/source/_theme.less

//  Common styles (output in both files)
& when (@media-common = true) {
    .page-header {
        background: @header__background;
        padding: 0 @layout__width-xs-indent;
    }
}

//  Mobile-only styles
& when (@media-target = 'mobile'), (@media-target = 'all') {
    @media all and (max-width: (@screen__m - 1)) {
        .page-header {
            position: sticky;
            top: 0;
        }
    }
}

//  Tablet and up
& when (@media-target = 'desktop'), (@media-target = 'all') {
    @media all and (min-width: @screen__m) {
        .page-header {
            padding: 0 @layout__width-indent;
        }
    }
}

//  Large desktop
& when (@media-target = 'desktop'), (@media-target = 'all') {
    @media all and (min-width: @screen__l) {
        .page-header {
            max-width: @layout__max-width;
        }
    }
}
```

**Exam focus:** The mobile-first split is `styles-m.less` for mobile/common + `styles-l.less` for desktop. The `@media-common` variable controls what outputs into BOTH files. `@screen__m` (768px) is the main mobile/desktop breakpoint.

---

## 9. Hands-On: Button Style Customization

### 9.1 Goal

Customize the primary "Add to Cart" button to use a brand orange color, with a hover state and rounded corners.

### 9.2 Step 1 — Override Variables

```less
// app/design/frontend/MyVendor/mytheme/web/css/source/_variables.less

//  =============================================
//  Custom Brand Colors
//  =============================================
@brand-orange:                       #e07b39;
@brand-orange-dark:                  #c4622d;
@brand-orange-text:                  #ffffff;

//  =============================================
//  Primary Button Overrides
//  =============================================
@button-primary__background:         @brand-orange;
@button-primary__border:             1px solid @brand-orange-dark;
@button-primary__border-color:       @brand-orange-dark;
@button-primary__color:              @brand-orange-text;
@button-primary__cursor:             pointer;
@button-primary__font-size:          @font-size__base;
@button-primary__font-weight:        @font-weight__semibold;
@button-primary__padding:            10px 20px;
@button-primary__border-radius:      4px;

//  Hover state
@button-primary__hover__background:  @brand-orange-dark;
@button-primary__hover__border:      1px solid darken(@brand-orange-dark, 5%);
@button-primary__hover__color:       @brand-orange-text;

//  Active state
@button-primary__active__background: darken(@brand-orange-dark, 8%);
@button-primary__active__border:     1px solid darken(@brand-orange-dark, 10%);
@button-primary__active__color:      @brand-orange-text;

//  Base button (non-primary) border radius
@button__border-radius:              3px;
```

### 9.3 Step 2 — Apply the Mixin (Optional Extra Customization)

If variable overrides alone are not sufficient (for example, you need completely custom structure), you can explicitly call the mixin with a wrapper:

```less
// app/design/frontend/MyVendor/mytheme/web/css/source/components/_buttons.less

//  "Add to Cart" specific overrides
.action.tocart {
    .lib-button-primary();   // Apply all primary button variables

    // Extra styles on top of the mixin
    width: 100%;
    display: block;
    text-align: center;
    margin-top: 10px;
}

//  "Proceed to Checkout" button - also primary
.action.primary.checkout {
    .lib-button-primary();
    min-width: 200px;
}

//  Reset button styling (remove all decoration)
.action.remove {
    .lib-button-reset();
    color: @link__color;
    padding: 0;

    &:hover {
        color: @link__color-alt;
        text-decoration: underline;
    }
}
```

### 9.4 Step 3 — Include in Entry Point

Make sure your `source/_extend.less` or `_theme.less` imports the buttons file:

```less
// app/design/frontend/MyVendor/mytheme/web/css/source/_extend.less

@import 'components/_buttons';
```

### 9.5 What `.lib-button-primary()` Does Under the Hood

Looking at `lib/web/css/source/lib/_buttons.less`, the mixin expands to approximately:

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

**Exam focus:** `.lib-button-primary()` calls `.lib-button()` internally, so you get ALL base button styles plus the primary overrides. You do not need to call both.

### 9.6 Deploy and Verify

```bash
# Clean generated CSS
bin/magento cache:clean
bin/magento setup:static-content:deploy -f -t MyVendor/mytheme en_US

# In developer mode, you can also use:
bin/magento dev:source-files:status

# Check the output file
ls -la pub/static/frontend/MyVendor/mytheme/en_US/css/styles-m.css
```

---

## 10. Hands-On: Breakpoint Override

### 10.1 Goal

Change the tablet/desktop breakpoint from the default 768px to 800px, and verify that responsive behavior shifts accordingly.

### 10.2 Override the Breakpoint Variable

```less
// app/design/frontend/MyVendor/mytheme/web/css/source/_variables.less

//  =============================================
//  Breakpoint Overrides
//  =============================================
//  Default: @screen__m: 768px
//  Override: shift the main breakpoint to 800px
@screen__m: 800px;

//  Adjust the large breakpoint as well if needed
//  Default: @screen__l: 1024px
@screen__l: 1100px;
```

### 10.3 What Changes Automatically

Because the entire UI library references `@screen__m` in media queries, changing this one variable cascades throughout:

```
Before override (768px):             After override (800px):
-------------------------------      --------------------------------
@media (min-width: 768px) {  -->     @media (min-width: 800px) {
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
# Redeploy static content
bin/magento setup:static-content:deploy -f -t MyVendor/mytheme en_US

# Search for the breakpoint in compiled CSS
grep -n "min-width: 800px" pub/static/frontend/MyVendor/mytheme/en_US/css/styles-l.css | head -20

# Also verify mobile file doesn't include desktop breakpoints incorrectly
grep -n "min-width" pub/static/frontend/MyVendor/mytheme/en_US/css/styles-m.css | head -20
```

**Exam focus:** Overriding `@screen__m` in your theme's `_variables.less` changes ALL components that use that breakpoint — navigation collapse, grid layout, header switches. You do not need to update each component individually.

### 10.5 Layout XML and Breakpoints (Connection Point)

For backend developers: breakpoints defined in LESS match the `default_head_blocks.xml` viewport configuration. The LESS breakpoints and the JavaScript breakpoint (`breakpoints` RequireJS config) should stay in sync.

```xml
<!-- Magento's built-in viewport meta tag comes from layout XML -->
<!-- lib/internal/Magento/Framework/View/Layout/etc/default_head_blocks.xml -->
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
```

---

## 11. CE vs EE UI Library Differences

### 11.1 Comparison Overview

| Aspect | CE (Community Edition) | EE (Enterprise Edition) |
|---|---|---|
| `lib/web/css/source/lib/` | Full UI library | Identical — same library |
| Additional UI components | — | Gift registry, reward points, store credit, B2B company styles |
| `_variables.less` defaults | Standard | Same defaults |
| Admin-specific LESS | `app/design/adminhtml/` | Additional EE admin modules |
| Frontend module LESS | Standard modules | Additional EE module `_module.less` files |

### 11.2 Where EE Adds Frontend Styles

EE does **not** modify `lib/web/css/`. Instead, EE modules add their own LESS files in module directories:

```
app/code/Magento/<EE_Module>/view/frontend/web/css/
app/code/Magento/<EE_Module>/view/frontend/web/css/source/
    _module.less     <-- Module-specific component styles
    _extend.less     <-- Module overrides of base theme components
```

Examples of EE-specific module LESS (from 2.4.8-p3 codebase):

```
app/code/Magento/GiftRegistry/view/frontend/web/css/source/_module.less
app/code/Magento/GiftCard/view/frontend/web/css/source/_module.less
app/code/Magento/Reward/view/frontend/web/css/source/_module.less
app/code/Magento/CustomerBalance/view/frontend/web/css/source/_module.less
app/code/Magento/B2b/view/frontend/web/css/source/_module.less
app/code/Magento/Company/view/frontend/web/css/source/_module.less
app/code/Magento/SharedCatalog/view/frontend/web/css/source/_module.less
```

### 11.3 What EE Modules LESS Files Typically Do

```less
// Example pattern in an EE module's _module.less
// app/code/Magento/Reward/view/frontend/web/css/source/_module.less

& when (@media-common = true) {

    //  Reward points balance display
    .reward-info {
        .lib-css(margin, @indent__base 0);

        .reward-balance {
            .lib-font-size(@font-size__base);
            .lib-css(color, @text__color);
        }
    }

    //  Points slider
    .reward-points-slider {
        .lib-css(margin, @indent__s 0);
    }
}
```

They use the same `.lib-*` mixins and the same `@variables` — they are fully integrated into the theme system.

### 11.4 Key Takeaway for the Exam

**Exam focus:** The `lib/web/css/source/lib/` UI library is **identical** in CE and EE. EE's additional UI is provided by separate module-level LESS files that integrate with the same mixin system. The exam may ask whether EE has a "different" UI library — the answer is no, EE extends through module LESS, not by modifying the core library.

---

## 12. Quick-Reference Checklist

### Core Paths

- [ ] UI Library location: **`lib/web/css/source/lib/`**
- [ ] Library master import file: **`lib/web/css/source/_lib.less`**
- [ ] Default variable definitions: **`lib/web/css/source/lib/_variables.less`**
- [ ] Your theme variable overrides: **`web/css/source/_variables.less`** (inside your theme)
- [ ] Breakpoint definitions: **`lib/web/css/source/lib/_responsive.less`**
- [ ] Entry points: **`styles-m.less`** (mobile+common) and **`styles-l.less`** (desktop)

### Import Syntax

- [ ] `@import (reference) 'source/lib'` — imports UI library as **reference only** (no CSS output, mixins available)
- [ ] Without `(reference)` — would dump ALL library CSS into output immediately
- [ ] Variable overrides go in `_variables.less` and must be loaded before (or LESS lazy evaluation resolves them last)

### LESS Variable Conventions

- [ ] Double underscore separates component from property: `@button__background`
- [ ] State: `@button__hover__background`, `@button__active__background`
- [ ] Sub-element: `@button-primary__background`
- [ ] Setting a variable to **`false`** suppresses that CSS property via `.lib-css()`

### Mixin System

- [ ] All UI library mixins are prefixed: **`.lib-*`**
- [ ] `.lib-button-primary()` **includes** `.lib-button()` internally — no need to call both
- [ ] `.lib-css(@property, @value)` — **conditionally outputs** CSS only if value is not `false`
- [ ] Call mixins in component files; no need to re-import the library per file

### Responsive System

- [ ] `@screen__xxs`: 320px, `@screen__xs`: 480px, `@screen__s`: 640px
- [ ] `@screen__m`: **768px** (main mobile/desktop breakpoint)
- [ ] `@screen__l`: **1024px**, `@screen__xl`: 1440px
- [ ] `@media-common: true` — styles output in **both** `styles-m.css` and `styles-l.css`
- [ ] `@media-target: 'mobile'` — styles only in `styles-m.css`
- [ ] `@media-target: 'desktop'` — styles only in `styles-l.css`
- [ ] Overriding `@screen__m` in your `_variables.less` cascades to ALL components using that breakpoint

### Available Components (know the file names)

- [ ] `_buttons.less` — `.lib-button()`, `.lib-button-primary()`, `.lib-button-reset()`
- [ ] `_forms.less` — `.lib-form-field()`, `.lib-form-element-input()`
- [ ] `_typography.less` — `.lib-font-size()`, `.lib-heading()`, `.lib-link()`
- [ ] `_icons.less` — `.lib-icon-font()`, `.lib-icon-image()`
- [ ] `_modals.less` — variable-driven (no standalone mixin to call for full modal)
- [ ] `_tooltips.less` — `.lib-tooltip()`
- [ ] `_messages.less` — `.lib-message()`
- [ ] `_sections.less` — `.lib-tabs()`, `.lib-accordion()`
- [ ] `_utilities.less` — `.lib-clearfix()`, `.lib-visually-hidden()`, `.lib-css()`

### CE vs EE

- [ ] `lib/web/css/source/lib/` is **identical** in CE and EE
- [ ] EE adds styles via **module-level LESS** in `app/code/Magento/<Module>/view/frontend/web/css/`
- [ ] EE modules use the same `.lib-*` mixins and `@variable` system
- [ ] EE modules with notable LESS: GiftRegistry, GiftCard, Reward, CustomerBalance, B2b, Company

### Customization Workflow

- [ ] **Never** edit `lib/web/css/source/lib/_variables.less` directly
- [ ] **Never** edit parent theme LESS files directly
- [ ] Correct workflow: **override variables** → redeploy static content → verify
- [ ] Deploy command: `bin/magento setup:static-content:deploy -f -t Vendor/theme en_US`
- [ ] In developer mode, static content regenerates automatically on page load (with `bin/magento deploy:mode:set developer`)
