# Day 19 — Full Exam Section Review & Cheat Sheet Finalization

## Adobe Commerce Front-End Developer Professional (AD0-E720) — Comprehensive Study Notes

---

## Table of Contents

1. [Exam Overview & Section Weights](#1-exam-overview--section-weights)
2. [Section 1 (10%) — Themes, Email Templates & Translations](#2-section-1-10--themes-email-templates--translations)
3. [Section 2 (22%) — Layout XML, Templates & Escaping](#3-section-2-22--layout-xml-templates--escaping)
4. [Section 3 (12%) — LESS, UI Library & Responsive](#4-section-3-12--less-ui-library--responsive)
5. [Section 4 (36%) — RequireJS, Mixins, KO, jQuery & JS via Layout XML](#5-section-4-36--requirejs-mixins-ko-jquery--js-via-layout-xml)
6. [Section 5 (20%) — Page Builder, Admin UI SDK, Grunt & Optimization](#6-section-5-20--page-builder-admin-ui-sdk-grunt--optimization)
7. [Cheat Sheet: LESS File Names & Roles](#7-cheat-sheet-less-file-names--roles)
8. [Cheat Sheet: requirejs-config.js Annotated Reference](#8-cheat-sheet-requirejs-configjs-annotated-reference)
9. [Cheat Sheet: Layout XML Instruction Reference Table](#9-cheat-sheet-layout-xml-instruction-reference-table)
10. [Cheat Sheet: data-mage-init vs x-magento-init](#10-cheat-sheet-data-mage-init-vs-x-magento-init)
11. [Cheat Sheet: Template Escaping Method Reference](#11-cheat-sheet-template-escaping-method-reference)
12. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Exam Overview & Section Weights

```
+-------------------------------------------+--------+------------+
| Section                                   | Weight | ~Questions |
+-------------------------------------------+--------+------------+
| 1. Theme Structure & Customization        |  10%   |     5      |
| 2. Layout XML & Templates                 |  22%   |    11      |
| 3. LESS / CSS & Responsive Design         |  12%   |     6      |
| 4. JavaScript (RequireJS, KO, jQuery)     |  36%   |    18      |
| 5. Admin, Optimization & Page Builder     |  20%   |    10      |
+-------------------------------------------+--------+------------+
| Total (50 questions, 68-minute exam)      | 100%   |    50      |
+-------------------------------------------+--------+------------+
```

> **Study time allocation today:**
> - Section 4 (JS): ~40 minutes
> - Sections 2 & 5: ~15 minutes each
> - Sections 1 & 3: ~10 minutes each

---

## 2. Section 1 (10%) — Themes, Email Templates & Translations

### 2.1 Theme Directory Structure

```
app/design/frontend/<Vendor>/<theme>/
|
+-- etc/
|   +-- view.xml                  # Image configuration (sizes, roles)
|
+-- web/
|   +-- css/
|   |   +-- source/               # LESS source files
|   +-- fonts/
|   +-- images/
|   +-- js/
|
+-- <Vendor_Module>/
|   +-- layout/                   # Module-specific layout overrides
|   +-- templates/                # Module-specific template overrides
|   +-- web/
|
+-- media/
|   +-- preview.jpg               # Theme preview image in Admin
|
+-- composer.json                 # Required for Composer-managed themes
+-- registration.php              # Registers the theme with Magento
+-- theme.xml                     # Theme declaration (name, parent)
```

**Exam focus:**
- `theme.xml` declares the theme name and parent; `registration.php` registers it via `\Magento\Framework\Component\ComponentRegistrar::register()`
- `view.xml` controls image roles (`small_image`, `thumbnail`, `image`) and their pixel dimensions
- `preview.jpg` must be exactly **800×600 px** at `<theme>/media/preview.jpg`

### 2.2 theme.xml Structure

```xml
<!-- app/design/frontend/Vendor/mytheme/theme.xml -->
<theme xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:noNamespaceSchemaLocation="urn:magento:framework:Config/etc/theme.xsd">
    <title>Vendor My Theme</title>
    <parent>Magento/luma</parent>   <!-- or Magento/blank -->
    <media>
        <preview_image>media/preview.jpg</preview_image>
    </media>
</theme>
```

**Exam focus:**
- A theme with no `<parent>` is a standalone (root) theme — rare in practice
- Parent theme fallback chain: `Vendor/mytheme` → `Magento/luma` → `Magento/blank` → `lib/web`
- **Magento/blank** is the foundational theme; **Magento/luma** extends it

### 2.3 registration.php

```php
<?php
use \Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::THEME,          // Type: THEME, MODULE, LIBRARY, LANGUAGE
    'frontend/Vendor/mytheme',          // Area + Vendor + Theme name
    __DIR__
);
```

### 2.4 Parent Theme File Fallback

```
Request for template/layout/static file
         |
         v
[Vendor/mytheme] -- found? --> SERVE IT
         |
         | not found
         v
[Magento/luma]   -- found? --> SERVE IT
         |
         | not found
         v
[Magento/blank]  -- found? --> SERVE IT
         |
         | not found
         v
[Module view/ directory]    --> SERVE IT
         |
         | not found
         v
[lib/web/]                  --> SERVE IT
```

**Exam focus:**
- File fallback applies to templates (`.phtml`), layout XML, and static assets (JS, CSS, images)
- **Layout XML is merged** (not replaced) through the fallback chain — multiple files can contribute
- Static files are **symlinked** in `pub/static/` during deployment

### 2.5 Email Templates

```
app/design/frontend/<Vendor>/<theme>/
  <Vendor_Module>/email/
    template_name.html         # Override module email template

-- OR --

app/design/email/
  template.html                # Global email override (older pattern)
```

**Key email template directives:**

```html
<!-- Variable output -->
{{var customer.name}}
{{var order.increment_id}}

<!-- Conditional block -->
{{depend store.is_active}}
    Store is active
{{/depend}}

<!-- Include another template -->
{{include template="Magento_Email::header.html"}}

<!-- Translate -->
{{trans "Hello, %name" name=$customer.name}}

<!-- Store config value -->
{{config path="general/store_information/name"}}

<!-- CSS inliner — wraps <style> blocks inline -->
{{inlinecss file="css/email.css"}}
```

**Exam focus:**
- Email templates use `{{var}}`, `{{trans}}`, `{{depend}}`, `{{config}}`, `{{inlinecss}}` directives — **not** PHP
- Custom email templates are registered via `Vendor_Module/email/` path under the theme
- `{{inlinecss}}` converts `<style>` blocks to inline styles for email client compatibility
- Email templates can be overridden in **Admin > Marketing > Email Templates** (database override takes precedence over file override)

### 2.6 Translations

**Translation fallback chain (highest to lowest priority):**
```
1. Database (Admin > Stores > Configuration translations)
2. Theme i18n/ directory:   app/design/frontend/<Vendor>/<theme>/i18n/en_US.csv
3. Module i18n/ directory:  app/code/<Vendor>/<Module>/i18n/en_US.csv
4. Language package:        app/i18n/<Vendor>/<language>/
```

**CSV format:**

```csv
"Add to Cart","Add to Bag"
"Search","Find Products"
"Default Welcome msg!","Welcome to Our Store!"
```

**PHP usage in templates:**

```php
// Simple translation
<?= __('Add to Cart') ?>

// With placeholder
<?= __('Hello, %1', $customer->getName()) ?>

// Escape after translation
<?= $block->escapeHtml(__('Welcome to %1', $storeName)) ?>
```

**JavaScript translation:**

```javascript
// In .js file after translation dict is loaded
var text = $.mage.__('Add to Cart');

// Or using mage/translate
define(['mage/translate'], function($t) {
    return $t('Add to Cart');
});
```

**Exam focus:**
- Translation CSV files live in `i18n/` with locale filename (e.g., `en_US.csv`, `fr_FR.csv`)
- The `__()` function is available in PHP templates via `$block`; use `$.mage.__()` in JS
- Database translations override file-based translations — set via Admin UI
- Language packs in `app/i18n/` provide bulk locale files across all modules

---

## 3. Section 2 (22%) — Layout XML, Templates & Escaping

### 3.1 Layout XML File Types

| File Type | Location | Purpose |
|-----------|----------|---------|
| `default.xml` | `<theme>/<Vendor_Module>/layout/` | Applied to every page |
| `<route_id>_<controller>_<action>.xml` | Same as above | Applied to specific page |
| `catalog_product_view.xml` | Example of route-based | Product detail page |
| `cms_index_index.xml` | Example of route-based | CMS home page |

**Exam focus:**
- Layout handle = `route_controller_action` (all lowercase, underscores)
- `default.xml` instructions apply to **all** pages
- Layout files in themes **extend** module layout files by default (they are merged)

### 3.2 Core Layout XML Instructions

#### `<block>` — Create a Block

```xml
<block class="Magento\Catalog\Block\Product\View"
       name="product.info"
       template="Magento_Catalog::product/view.phtml"
       before="-"
       after="product.info.main">
    <arguments>
        <argument name="css_class" xsi:type="string">custom-class</argument>
        <argument name="some_array" xsi:type="array">
            <item name="key1" xsi:type="string">value1</item>
        </argument>
        <argument name="is_enabled" xsi:type="boolean">true</argument>
        <argument name="count" xsi:type="number">5</argument>
    </arguments>
</block>
```

#### `<container>` — Structural Element

```xml
<container name="my.container"
           htmlTag="div"
           htmlClass="my-container-class"
           htmlId="my-container-id"
           label="My Container"
           before="-"
           after="-">
</container>
```

**Exam focus:**
- `<container>` has no template and no PHP class — purely structural
- `htmlTag`, `htmlClass`, `htmlId` control rendered HTML wrapper
- `before="-"` means "first" and `after="-"` means "last" in the parent container
- `<block>` requires a `class` attribute pointing to a Block PHP class

#### `<referenceBlock>` and `<referenceContainer>`

```xml
<!-- Modify an existing block -->
<referenceBlock name="product.info.price">
    <action method="setTemplate">
        <argument name="template" xsi:type="string">
            Vendor_Module::product/custom_price.phtml
        </argument>
    </action>
    <arguments>
        <argument name="new_arg" xsi:type="string">value</argument>
    </arguments>
</referenceBlock>

<!-- Add child to existing container -->
<referenceContainer name="content">
    <block class="Vendor\Module\Block\Custom"
           name="custom.block"
           template="Vendor_Module::custom.phtml"/>
</referenceContainer>
```

#### `<move>` — Relocate a Block

```xml
<!-- Move block named "catalog.compare.sidebar" after "cart_sidebar" -->
<move element="catalog.compare.sidebar"
      destination="sidebar.main"
      before="cart_sidebar"
      after="-"/>
```

**Exam focus:**
- `<move>` changes a block's parent container without re-declaring the block
- `destination` is the target container name
- `before` and `after` are sibling element names (or `-` for first/last)

#### `<remove>` — Remove a Block

```xml
<referenceBlock name="catalog.compare.sidebar" remove="true"/>
<!-- Note: Use remove="true" attribute on referenceBlock, NOT a <remove> tag -->
```

**Exam focus:**
- Blocks are removed via `remove="true"` on `<referenceBlock>`, not a separate `<remove>` element
- `display="false"` hides a block from rendering but keeps it in the layout tree (can still be referenced by child blocks)

#### `<update>` — Include Another Layout Handle

```xml
<!-- Apply instructions from another layout handle -->
<update handle="customer_account"/>
```

#### `<action>` — Call Block Method

```xml
<referenceBlock name="head.additional">
    <action method="addCss">
        <argument name="file" xsi:type="string">css/custom.css</argument>
    </action>
</referenceBlock>
```

**Exam focus:**
- `<action>` calls public methods on Block classes
- Discouraged in modern Magento; prefer `<arguments>` with getter methods
- `addCss`, `addJs` are common `<action>` targets on `Magento_Theme::head` blocks

### 3.3 Page Layouts

Page layouts define the **skeleton** HTML structure (number of columns, header/footer wrappers):

```xml
<!-- Magento_Theme/page_layout/2columns-left.xml -->
<layout xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_layout.xsd">
    <update handle="empty"/>
    <update handle="1column"/>
    <container name="page.wrapper" htmlTag="div" htmlClass="page-wrapper">
        ...
    </container>
</layout>
```

**Available page layouts:**

| Layout | Columns |
|--------|---------|
| `empty` | No header/footer wrapper |
| `1column` | Single content column |
| `2columns-left` | Content + left sidebar |
| `2columns-right` | Content + right sidebar |
| `3columns` | Left sidebar + content + right sidebar |

**Set page layout in layout XML:**

```xml
<page layout="2columns-left"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <!-- layout instructions -->
    </body>
</page>
```

**Exam focus:**
- Page layout files live in `<Vendor_Module>/page_layout/` — distinct from regular layout XML
- The `layout` attribute on `<page>` determines the structural template used
- Custom page layouts must be registered in `layouts.xml`

### 3.4 Extend vs Override — Templates & Layout

```
EXTEND (default behavior):
  Theme layout XML files are MERGED with module layout XML
  Multiple files contribute instructions to the same handle
  Use: <referenceBlock>, <referenceContainer>, <move>, <update>

OVERRIDE (replace entirely):
  Copy file to exact path in theme; the original is ignored
  Layout override: app/design/frontend/<V>/<T>/<Vendor_Module>/layout/override/
  Template override: app/design/frontend/<V>/<T>/<Vendor_Module>/templates/
```

**Template override path mapping:**

```
Module template:
  app/code/Vendor/Module/view/frontend/templates/product/view.phtml

Theme override path:
  app/design/frontend/<Vendor>/<theme>/Vendor_Module/templates/product/view.phtml
```

**Layout override path mapping:**

```
Module base layout:
  app/code/Vendor/Module/view/frontend/layout/catalog_product_view.xml

Theme override (COMPLETE REPLACEMENT):
  app/design/frontend/<Vendor>/<theme>/Vendor_Module/layout/override/base/catalog_product_view.xml

Module-specific theme override:
  app/design/frontend/<Vendor>/<theme>/Vendor_Module/layout/override/theme/<Vendor>/<theme>/catalog_product_view.xml
```

**Exam focus:**
- Template files are **always overrides** when placed in the theme — the module's original is ignored
- Layout files in themes **extend by default** (merged); use `override/base/` path to completely replace
- The `override/` subdirectory makes layout replacement explicit and intentional

### 3.5 Template Variables & PHP in Templates

```php
<?php
// $block is the Block instance automatically injected
// $escaper is the Escaper utility (Magento 2.4+)

// Get block data
$title = $block->getTitle();
$cssClass = $block->getData('css_class');

// Child blocks
echo $block->getChildHtml('child.block.name');
echo $block->getChildHtml('child.block.name', false); // false = no caching

// URL generation
$url = $block->getUrl('catalog/product/view', ['id' => 123]);

// Asset URL
$logoUrl = $block->getViewFileUrl('images/logo.svg');
?>
```

### 3.6 Template Escaping

**Always escape output to prevent XSS:**

```php
// HTML context — most common
<?= $block->escapeHtml($block->getTitle()) ?>

// HTML attribute context
<div class="<?= $block->escapeHtmlAttr($cssClass) ?>">

// URL context
<a href="<?= $block->escapeUrl($url) ?>">

// JavaScript context (outputs JSON-safe string)
<script>var x = <?= $block->escapeJs($value) ?>;</script>

// CSS context
<style>.class { color: <?= $block->escapeCss($color) ?>; }</style>

// Allows specific HTML tags (whitelist)
<?= $block->escapeHtml($html, ['b', 'strong', 'i', 'a']) ?>

// Raw output — ONLY when content is already safe/escaped
<?= /* @noEscape */ $safeContent ?>

// Block HTML output (trusted block rendering)
<?= $block->getChildHtml('block.name') ?>
```

**Escaper class (Magento 2.4.x direct injection):**

```php
// In Block constructor or template via $escaper variable
use Magento\Framework\Escaper;

// In templates (Magento 2.4+), $escaper is auto-injected
<?= $escaper->escapeHtml($value) ?>
<?= $escaper->escapeHtmlAttr($value) ?>
<?= $escaper->escapeUrl($value) ?>
<?= $escaper->escapeJs($value) ?>
```

**Exam focus:**
- `escapeHtml()` is for **HTML content** between tags (not attributes)
- `escapeHtmlAttr()` is for **HTML attribute values**
- `escapeUrl()` is for **href, src** attribute values
- `escapeJs()` is for **JavaScript string values**
- `$block->escapeHtml($html, ['b', 'em'])` allows safe HTML tags — second param is whitelist
- Never use `echo $value` without escaping — always use an escape method
- `/* @noEscape */` comment suppresses static analysis warnings for pre-escaped content

---

## 4. Section 3 (12%) — LESS, UI Library & Responsive

### 4.1 LESS Compilation Flow

```
Theme LESS Source
      |
      v
  _module.less        <-- Entry point per module (auto-imported)
      |
      v
  _extend.less        <-- Theme extension of module styles
      |
      v
  styles-m.less       <-- Mobile styles (compiled output)
  styles-l.less       <-- Desktop styles (compiled output)
      |
      v
  pub/static/         <-- Deployed/compiled CSS
      frontend/<V>/<T>/<locale>/css/
          styles-m.css
          styles-l.css
```

### 4.2 LESS File Hierarchy — Complete Reference

**Theme-level source files:**

```
web/css/
  source/
    _theme.less           # Theme variable overrides (MOST IMPORTANT)
    _extend.less          # Extend/add global styles
    _widgets.less         # Widget-specific overrides
    _icons.less           # Icon overrides

web/css/
  styles-m.less           # Mobile-first stylesheet entry point
  styles-l.less           # Large (desktop) stylesheet entry point
  print.less              # Print stylesheet
  _styles.less            # Shared imports (imported by both m and l)
```

**Module-level source files:**

```
<Vendor_Module>/web/css/source/
  _module.less            # Module's base styles
  _extend.less            # Module extension point (theme overrides here)
  _widgets.less           # Module widget styles
```

**UI Library source (Magento/blank):**

```
lib/web/css/source/
  lib/
    variables/
      _colors.less        # Color variables
      _typography.less    # Font variables
      _layout.less        # Layout variables (breakpoints, grid)
      _icons.less         # Icon variables
    _actions-toolbar.less
    _breadcrumbs.less
    _buttons.less
    _dropdowns.less
    _forms.less
    _grids.less
    _icons.less
    _layout.less
    _list.less
    _loaders.less
    _messages.less
    _navigation.less
    _pages.less
    _popups.less
    _rating.less
    _resets.less
    _responsive.less
    _sections.less
    _tables.less
    _tooltips.less
    _typography.less
    _utilities.less
    _variables.less       # Master variable file (all defaults)
```

**Exam focus:**
- `_theme.less` is where you override UI Library variables (colors, fonts, spacing)
- `_extend.less` at module level is the intended override point for module styles
- `styles-m.less` = mobile-first; `styles-l.less` = desktop additions only
- `lib/web/css/source/lib/_variables.less` contains ALL default variable definitions

### 4.3 Variable Override Pattern

```less
// web/css/source/_theme.less

// Override primary button color
@button__color: #ffffff;
@button__background: @color-blue-1;
@button__border: 1px solid @color-blue-1;

// Override primary color
@color-blue-1: #007bff;
@link__color: @color-blue-1;
@link__hover__color: darken(@color-blue-1, 10%);

// Override typography
@font-family__base: 'Roboto', sans-serif;
@font-size__base: 16px;
@font-weight__regular: 400;

// Override layout
@layout__max-width: 1280px;
@layout-indent__width: 20px;

// Override header
@header__background-color: #ffffff;
@navigation__background: @color-blue-1;
```

**Exam focus:**
- Variables in `_theme.less` override `lib/web/css/source/lib/_variables.less` defaults
- LESS variables use `@` prefix; overriding requires re-declaring the same variable name
- Variable override works because `_theme.less` is imported **before** the library components that use those variables

### 4.4 UI Library Mixins

```less
// Button mixin
.lib-button(
    @_button-font-color: @button__color,
    @_button-background: @button__background,
    @_button-border: @button__border
);

// Typography mixin
.lib-font-size(
    @_font-size: 14px,
    @_line-height: 20px
);

// Link mixin
.lib-link(
    @_link-color: @link__color,
    @_link-color-visited: @link__visited__color,
    @_link-color-hover: @link__hover__color
);

// Icon mixin
.lib-icon-font(
    @_icon-font-content: @icon-wishlist-empty,
    @_icon-font-size: 28px,
    @_icon-font-color: @primary__color
);

// Responsive
.lib-css(margin-bottom, @indent__base);
```

### 4.5 Responsive Design (Mobile-First)

**Breakpoint variables:**

```less
// From _variables.less
@screen__xxs: 320px;
@screen__xs:  480px;
@screen__s:   640px;
@screen__m:   768px;   // Tablet breakpoint
@screen__l:   1024px;  // Desktop breakpoint
@screen__xl:  1440px;

// Common media query shorthand
@media-common: true;        // Styles applied to all screen sizes
@media-target: 'all';       // Can be 'all', 'desktop', 'mobile'
```

**Responsive mixin usage:**

```less
// Mobile-first approach (styles-m.less context)
.product-name {
    font-size: 14px;    // Mobile default

    .lib-min-screen-s({
        font-size: 16px;    // Small screens+
    });

    .lib-min-screen-m({
        font-size: 18px;    // Tablet+
    });

    .lib-min-screen-l({
        font-size: 20px;    // Desktop+
    });
}

// Desktop-specific in styles-l.less
& when (@media-target = 'desktop'), (@media-target = 'all') {
    .product-name {
        font-size: 22px;
    }
}
```

**Exam focus:**
- `styles-m.less` uses `@media-target = 'mobile'` context — mobile-first base styles
- `styles-l.less` uses `@media-target = 'desktop'` context — desktop additions
- `.lib-min-screen-m()` mixin generates `@media all and (min-width: 768px)` breakpoints
- Responsive mixins are defined in `lib/web/css/source/lib/_responsive.less`

### 4.6 LESS Compilation Methods

| Method | Command | When to Use |
|--------|---------|-------------|
| Grunt | `grunt less` | Development — compiles LESS to CSS |
| Client-side LESS.js | Browser only | Dev mode with `less.js` |
| PHP compilation | `bin/magento setup:static-content:deploy` | Production deployment |

**Grunt workflow:**

```bash
# Initial setup (run once)
npm install

# Watch for LESS changes
grunt watch

# Compile specific theme LESS
grunt less --theme="Vendor/mytheme"

# Full refresh
grunt exec:Vendor_mytheme
grunt less:Vendor_mytheme
```

**Exam focus:**
- Grunt is used for **development** LESS compilation — not production
- Production uses `setup:static-content:deploy` to compile and deploy
- Client-side LESS compilation (`less.js`) only works when `MAGE_MODE=developer`

---

## 5. Section 4 (36%) — RequireJS, Mixins, KO, jQuery & JS via Layout XML

> **⚠ Exam focus:** This section is worth **36%** of the exam. Master every subsection below.

### 5.1 RequireJS Configuration

#### requirejs-config.js Structure

```javascript
// app/design/frontend/<Vendor>/<theme>/requirejs-config.js
// -- OR --
// app/code/<Vendor>/<Module>/view/frontend/requirejs-config.js

var config = {

    // -----------------------------------------------
    // 1. MAP: Alias an existing module path
    // -----------------------------------------------
    map: {
        '*': {
            // Alias -> actual module path (no .js extension)
            'jquery':          'jquery/jquery.min',
            'catalogAddToCart': 'Magento_Catalog/js/catalog-add-to-cart',

            // Override a core module with custom version
            'Magento_Ui/js/modal/modal': 'Vendor_Module/js/modal/custom-modal',
        }
    },

    // -----------------------------------------------
    // 2. PATHS: Define module locations
    // -----------------------------------------------
    paths: {
        // name -> path relative to baseUrl (web/ dir)
        // Do NOT include .js extension
        'jquery/ui-modules/widget': 'jquery/jquery-ui'
    },

    // -----------------------------------------------
    // 3. SHIM: Configure non-AMD scripts
    // -----------------------------------------------
    shim: {
        'legacy-plugin': {
            deps: ['jquery'],           // Dependencies to load first
            exports: 'LegacyPlugin'    // Global variable to use as module value
        },
        'bootstrapjs': {
            deps: ['jquery']
        }
    },

    // -----------------------------------------------
    // 4. DEPS: Auto-load modules (no explicit require)
    // -----------------------------------------------
    deps: [
        'jquery',
        'Vendor_Module/js/auto-init'   // Loaded on every page automatically
    ],

    // -----------------------------------------------
    // 5. CONFIG: Pass configuration to modules
    // -----------------------------------------------
    config: {
        mixins: {
            // Mixin target -> mixin module(s)
            'Magento_Checkout/js/view/minicart': {
                'Vendor_Module/js/minicart-mixin': true
            },
            'mage/validation': {
                'Vendor_Module/js/validation-mixin': true
            }
        }
    }
};
```

**Exam focus:**
- `map: {'*': {...}}` — the `'*'` key means the mapping applies to ALL requesting modules
- `paths` defines where to find a module; `map` creates an alias pointing to another module
- `shim` is for **non-AMD (non-define())** legacy scripts that don't use RequireJS natively
- `deps` auto-loads listed modules on every page — use sparingly for performance
- Mixins are declared under `config.mixins`, **NOT** under `map`

### 5.2 RequireJS Module Patterns

#### AMD define() pattern:

```javascript
// Vendor_Module/view/frontend/web/js/my-module.js
define([
    'jquery',                                    // jQuery alias
    'mage/translate',                            // Translation utility
    'Magento_Ui/js/lib/core/element/element',   // UI component base
    'ko'                                         // Knockout.js
], function ($, $t, Element, ko) {
    'use strict';

    return {
        // Return an object (singleton pattern)
        init: function (config, element) {
            var self = this;
            console.log($t('Hello World'));
            $(element).on('click', function () {
                self.handleClick();
            });
        },
        handleClick: function () {
            console.log('Clicked!');
        }
    };
});
```

#### Factory function pattern:

```javascript
define(['jquery'], function ($) {
    'use strict';

    return function (config, element) {
        // Directly callable function
        $(element).addClass(config.cssClass);
    };
});
```

#### Return a Constructor pattern:

```javascript
define(['jquery'], function ($) {
    'use strict';

    function MyWidget(config, element) {
        this.config = config;
        this.$el = $(element);
        this._init();
    }

    MyWidget.prototype._init = function () {
        this.$el.on('click', this._handleClick.bind(this));
    };

    MyWidget.prototype._handleClick = function () {
        console.log('Widget clicked');
    };

    return MyWidget;
});
```

**Exam focus:**
- `define([deps], function(args){})` is the AMD module definition syntax
- `require([deps], function(args){})` is for one-time execution (not reusable)
- Module path follows the `baseUrl` which is `<theme>/web/` or `<module>/view/frontend/web/`
- `'use strict'` is always required in Magento JS files

### 5.3 JS Mixins

Mixins extend existing JavaScript modules **without overriding** them:

```javascript
// Vendor_Module/view/frontend/web/js/catalog-add-to-cart-mixin.js
define(['jquery'], function ($) {
    'use strict';

    return function (originalComponent) {

        // Extend the original component's prototype/object
        return originalComponent.extend({

            // Override a method
            submitForm: function (form) {
                console.log('Mixin: before submitForm');

                // Call the original method
                this._super();

                console.log('Mixin: after submitForm');
            },

            // Add a new method
            customMethod: function () {
                return 'custom behavior';
            }
        });
    };
});
```

**Mixin for plain objects (not UI components):**

```javascript
// Mixin for a module that returns a plain object
define([], function () {
    'use strict';

    return function (originalModule) {
        var originalMethod = originalModule.someMethod;

        originalModule.someMethod = function () {
            console.log('Before original');
            originalMethod.apply(this, arguments);
            console.log('After original');
        };

        return originalModule;
    };
});
```

**Register the mixin in requirejs-config.js:**

```javascript
var config = {
    config: {
        mixins: {
            // The target module path
            'Magento_Catalog/js/catalog-add-to-cart': {
                // The mixin module path: true to enable, false to disable
                'Vendor_Module/js/catalog-add-to-cart-mixin': true
            }
        }
    }
};
```

**Exam focus:**
- Mixin receives the **original module/constructor** as its argument and returns an **extended version**
- Use `this._super()` in UI component mixins to call the original method (uiElement pattern)
- For plain object mixins, manually wrap and call original methods
- Mixins are non-destructive — original code remains; your code wraps it
- Multiple mixins can target the same module (they chain)
- `true` enables the mixin; `false` disables it (useful in child themes)

### 5.4 data-mage-init vs x-magento-init

#### data-mage-init (HTML attribute on specific element)

```html
<!-- Applied directly to the element -->
<div class="product-list"
     data-mage-init='{"Vendor_Module/js/product-list": {"maxItems": 10, "sortable": true}}'>
    <!-- Widget receives this element as its DOM context -->
</div>

<!-- Multiple widgets on same element -->
<div data-mage-init='{
    "mage/collapsible": {"active": false},
    "Vendor_Module/js/tracker": {"eventName": "product-list"}
}'>
</div>

<!-- Simple jQuery widget -->
<select data-mage-init='{"selectmenu": {}}'>
    <option>Option 1</option>
</select>
```

#### x-magento-init (script tag, decoupled from element)

```html
<!-- No element binding required; can target any selector or be global -->
<script type="text/x-magento-init">
{
    "#target-element": {
        "Vendor_Module/js/my-component": {
            "config": "value",
            "another": true
        }
    }
}
</script>

<!-- Multiple selectors -->
<script type="text/x-magento-init">
{
    ".product-item": {
        "Magento_Catalog/js/product/view/provider": {}
    },
    "[data-role='tocart-form']": {
        "Magento_Catalog/js/catalog-add-to-cart": {}
    }
}
</script>

<!-- Global (no DOM element) — use "*" as selector -->
<script type="text/x-magento-init">
{
    "*": {
        "Vendor_Module/js/global-init": {
            "someConfig": "value"
        }
    }
}
</script>
```

**Side-by-side comparison:**

```
data-mage-init                    x-magento-init
----------------------------      ----------------------------
Attribute on the target element   <script> tag anywhere in page
Element IS the widget's context   Element found via CSS selector
Coupled to HTML structure         Decoupled from HTML structure
Simpler syntax                    More flexible targeting
Good for single, specific elem    Good for dynamic/multiple elements
Parsed by mage/apply/main.js      Parsed by mage/apply/scripts.js
```

**Exam focus:**
- `data-mage-init` — widget's `element` parameter = the DOM element with the attribute
- `x-magento-init` — widget initialized for each matched element via CSS selector
- `"*"` selector in `x-magento-init` runs with no element context (global initialization)
- Both are parsed automatically by `mage/apply/main.js` on `DOMContentLoaded`
- JSON in `data-mage-init` must be **valid JSON** (double quotes, no trailing commas)

### 5.5 jQuery Widgets (jQuery UI Widget Factory)

```javascript
// Vendor_Module/view/frontend/web/js/my-widget.js
define([
    'jquery',
    'jquery-ui-modules/widget'    // jQuery UI Widget Factory
], function ($) {
    'use strict';

    $.widget('mage.myWidget', {   // Namespace: mage, Name: myWidget

        // Default options
        options: {
            triggerSelector: '.trigger',
            activeClass: 'active',
            animationDuration: 300
        },

        // Called on widget initialization
        _create: function () {
            this._bindEvents();
        },

        // Private: bind DOM events
        _bindEvents: function () {
            var self = this;
            this._on({
                // 'eventName selector': handler
                'click .trigger': '_onTriggerClick',
                'mouseenter': function (e) {
                    self._handleHover(e);
                }
            });
        },

        _onTriggerClick: function (event) {
            event.preventDefault();
            this.element.toggleClass(this.options.activeClass);
            this._trigger('toggle', event, { active: this.element.hasClass('active') });
        },

        _handleHover: function (event) {
            this.element.addClass('hover');
        },

        // Public method — callable externally
        refresh: function () {
            this.destroy();
            this._create();
        },

        // Called on widget destruction
        _destroy: function () {
            this.element.removeClass(this.options.activeClass);
        }
    });

    return $.mage.myWidget;   // Return the widget constructor
});
```

**Using jQuery widgets:**

```javascript
// Programmatic initialization
require(['jquery', 'Vendor_Module/js/my-widget'], function($) {
    $('#my-element').myWidget({
        triggerSelector: '.btn',
        activeClass: 'open'
    });

    // Call public method
    $('#my-element').myWidget('refresh');

    // Get widget instance
    var instance = $('#my-element').data('mage-myWidget');
});
```

**Via data-mage-init:**

```html
<div id="my-element"
     data-mage-init='{"Vendor_Module/js/my-widget": {"triggerSelector": ".btn"}}'>
</div>
```

**Exam focus:**
- Widget namespace convention: `mage.widgetName` → accessed as `$.mage.widgetName`
- `_create()` is the initialization hook (like a constructor)
- `_destroy()` is the cleanup hook
- `_on()` is the preferred event binding method (auto-cleaned on destroy)
- `this._trigger('eventName')` fires a custom event (`mageEventname` on the element)
- `this.options` holds configuration; `this.element` is the jQuery-wrapped DOM element
- Widget data key: `$el.data('mage-widgetName')` returns the instance

### 5.6 Knockout.js Bindings in Magento

#### Core KO Bindings

```html
<!-- Text and HTML output -->
<span data-bind="text: productName"></span>
<div data-bind="html: descriptionHtml"></div>

<!-- Visibility -->
<div data-bind="visible: isLoading">Loading...</div>
<div data-bind="hidden: isLoading">Content loaded</div>

<!-- CSS classes -->
<button data-bind="css: {'active': isActive, 'disabled': isDisabled}"></button>
<div data-bind="css: currentCssClass"></div>

<!-- Attributes -->
<img data-bind="attr: {src: imageUrl, alt: imageAlt}"/>

<!-- Click events -->
<button data-bind="click: addToCart">Add to Cart</button>
<a data-bind="click: $parent.removeItem.bind($parent, $index())">Remove</a>

<!-- Form bindings -->
<input data-bind="value: searchQuery" type="text"/>
<input data-bind="checked: isChecked" type="checkbox"/>
<select data-bind="options: categories, value: selectedCategory, optionsText: 'label'">
</select>

<!-- Foreach loop -->
<ul data-bind="foreach: items">
    <li>
        <span data-bind="text: name"></span>
        <span data-bind="text: $index()"></span>      <!-- Current index -->
        <span data-bind="text: $parent.storeName"></span>  <!-- Parent context -->
        <span data-bind="text: $root.globalConfig"></span> <!-- Root context -->
    </li>
</ul>

<!-- If/ifnot conditionals -->
<div data-bind="if: isLoggedIn">Welcome back!</div>
<div data-bind="ifnot: isLoggedIn">Please log in</div>

<!-- With context -->
<div data-bind="with: currentProduct">
    <span data-bind="text: name"></span>
    <span data-bind="text: price"></span>
</div>

<!-- Template binding -->
<div data-bind="template: {name: 'my-template', data: templateData}"></div>
<script type="text/html" id="my-template">
    <div data-bind="text: label"></div>
</script>

<!-- Component binding -->
<div data-bind="component: {name: 'Vendor_Module/js/my-component', config: {}}"></div>
```

**Exam focus:**
- `data-bind` attribute is the KO binding mechanism
- `foreach` creates a new scope; use `$parent`, `$root`, `$index()`, `$data` for context access
- `text:` escapes HTML automatically; `html:` renders raw HTML (use carefully)
- `visible:` toggles CSS `display`; `if:` adds/removes DOM element entirely
- `value:` is two-way binding (form inputs); `text:` is one-way (read-only display)

#### KO Observables

```javascript
define(['ko'], function (ko) {
    'use strict';

    return {
        // Observable (single value)
        count: ko.observable(0),
        name: ko.observable(''),
        isVisible: ko.observable(true),

        // Observable Array
        items: ko.observableArray([]),
        cartItems: ko.observableArray([{id: 1, qty: 2}]),

        // Computed observable (derived from other observables)
        totalItems: ko.computed(function () {
            return this.cartItems().length;
        }, this),

        fullName: ko.computed(function () {
            return this.firstName() + ' ' + this.lastName();
        }, this),

        // Writable computed
        fullNameWritable: ko.pureComputed({
            read: function () {
                return this.firstName() + ' ' + this.lastName();
            },
            write: function (value) {
                var parts = value.split(' ');
                this.firstName(parts[0]);
                this.lastName(parts[1] || '');
            },
            owner: this
        }),

        // Read an observable
        getCurrentCount: function () {
            return this.count();  // Call as function to read
        },

        // Write to an observable
        increment: function () {
            this.count(this.count() + 1);  // Call with argument to write
        },

        // Subscribe to changes
        init: function () {
            this.count.subscribe(function (newValue) {
                console.log('Count changed to:', newValue);
            });
        }
    };
});
```

#### Magento UI Component Pattern

```javascript
// Vendor_Module/view/frontend/web/js/view/my-component.js
define([
    'uiComponent',          // Base: Magento_Ui/js/lib/core/element/element
    'ko'
], function (Component, ko) {
    'use strict';

    return Component.extend({

        defaults: {
            template: 'Vendor_Module/my-component',   // KO template path
            isVisible: true,
            items: [],
            tracks: {
                isVisible: true   // Auto-tracks as observable
            }
        },

        initialize: function () {
            this._super();    // Call parent initialize
            this.initObservables();
            return this;
        },

        initObservables: function () {
            this._super();
            this.observe([    // Make these properties observable
                'isVisible',
                'items',
                'selectedItem'
            ]);
            return this;
        },

        toggleVisibility: function () {
            this.isVisible(!this.isVisible());
        }
    });
});
```

**Exam focus:**
- UI components extend `uiComponent` (alias for `Magento_Ui/js/lib/core/element/element`)
- `this._super()` calls the parent class method (like `parent::method()` in PHP)
- `this.observe(['prop1', 'prop2'])` converts listed properties to KO observables
- `defaults` sets initial values; `tracks` auto-observes listed properties
- KO template path: `Vendor_Module/my-component` → `web/template/my-component.html`

### 5.7 JS Initialization via Layout XML

#### Method 1: `data-mage-init` via layout XML block

```xml
<!-- catalog_product_view.xml -->
<block class="Magento\Framework\View\Element\Template"
       name="product.custom.js"
       template="Vendor_Module::js/init.phtml"/>
```

```php
<!-- Vendor_Module/templates/js/init.phtml -->
<div data-mage-init='{"Vendor_Module/js/product-widget": <?= /* @noEscape */ $block->getJsonConfig() ?>}'>
</div>
```

#### Method 2: `x-magento-init` via layout XML block

```xml
<block class="Magento\Catalog\Block\Product\View"
       name="custom.js.init"
       template="Vendor_Module::js/x-magento-init.phtml"/>
```

```php
<!-- Vendor_Module/templates/js/x-magento-init.phtml -->
<script type="text/x-magento-init">
{
    "*": {
        "Vendor_Module/js/global-widget": <?= /* @noEscape */ $block->getJsonConfig() ?>
    }
}
</script>
```

#### Method 3: `pageLayout` JS config via layout XML

```xml
<!-- Pass JS config through block arguments -->
<block class="Vendor\Module\Block\MyBlock"
       name="my.js.block"
       template="Vendor_Module::my-block.phtml">
    <arguments>
        <argument name="js_config" xsi:type="array">
            <item name="component" xsi:type="string">Vendor_Module/js/my-component</item>
            <item name="template" xsi:type="string">Vendor_Module/my-component</item>
        </argument>
    </arguments>
</block>
```

#### Method 4: Adding JS files via layout XML

```xml
<!-- Add a JS file to page head -->
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <head>
        <!-- Add script (loads via RequireJS) -->
        <script src="Vendor_Module::js/my-script.js"/>

        <!-- Add external script -->
        <script src="https://cdn.example.com/lib.js" src_type="url"/>

        <!-- Add CSS -->
        <css src="Vendor_Module::css/custom.css"/>

        <!-- Remove a default script -->
        <remove src="jquery/jquery.min.js"/>

        <!-- Link tag -->
        <link src="Vendor_Module::fonts/custom.woff" as="font" crossorigin=""/>
    </head>
</page>
```

**Exam focus:**
- `<script>` in `<head>` layout XML adds scripts to page; handled by `Magento\Theme\Block\Html\Head\Script`
- `src` attribute follows module notation: `Vendor_Module::path/to/file.js`
- JS added via `<head><script>` is loaded as a `require()` call — still managed by RequireJS
- `<remove src="..."/>` removes a previously added resource

### 5.8 JS Component Scope Summary

```
Layout XML <head><script>   ->  Global page-level include
                                (use sparingly, prefer lazy require())

data-mage-init              ->  Widget bound to specific DOM element
                                (inline, coupled to markup)

x-magento-init              ->  Widget bound via selector
                                (decoupled, flexible targeting)

requirejs-config.js deps    ->  Auto-loaded global scripts
                                (use very sparingly)

require([...], fn)          ->  Lazy load on demand
                                (best for conditional logic)

define([...], fn)           ->  Module definition (reusable)
                                (always use this pattern for new JS)
```

---

## 6. Section 5 (20%) — Page Builder, Admin UI SDK, Grunt & Optimization

### 6.1 Page Builder

**Content type registration:**

```xml
<!-- Vendor_Module/etc/adminhtml/pagebuilder/content_type/my_type.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_PageBuilder:etc/content_type.xsd">
    <type name="my-type"
          label="My Custom Type"
          component="Vendor_Module/js/content-type/my-type/collection"
          preview_component="Vendor_Module/js/content-type/my-type/preview"
          master_component="Vendor_Module/js/content-type/my-type/master"
          form="Vendor_Module/form/pagebuilder/my_type"
          menu_section="layout"
          icon="Vendor_Module_icon-my-type"
          sortOrder="10"
          translate="label">
        <children default_policy="deny"/>
        <appearances>
            <appearance name="default"
                        default="true"
                        preview_template="Vendor_Module/content-type/my-type/default/preview"
                        master_template="Vendor_Module/content-type/my-type/default/master"
                        reader="Magento_PageBuilder/js/master-format/read/configurable">
                <elements>
                    <element name="main">
                        <style name="text_align" source="text_align"/>
                        <attribute name="name" source="data-content-type" value="my-type"/>
                    </element>
                </elements>
            </appearance>
        </appearances>
    </type>
</config>
```

**Page Builder template locations:**

```
Vendor_Module/view/adminhtml/web/template/content-type/my-type/
  default/
    preview.html    # KO template shown in Admin page builder
    master.html     # KO template for saved/rendered output

Vendor_Module/view/frontend/web/template/content-type/my-type/
  default/
    master.html     # Storefront rendering template
```

**Exam focus:**
- Page Builder content types need: `preview_component`, `master_component`, preview/master templates
- Menu sections: `layout`, `elements`, `media`, `add-content`
- `form` attribute points to a UI component form for the content type's settings
- `children default_policy="deny"` prevents child content types by default
- Page Builder stores content as HTML with data attributes (`data-content-type`, `data-appearance`, etc.)

### 6.2 Admin UI SDK

The Adobe Commerce Admin UI SDK allows external apps to extend the Admin via **IFrame-based App Builder apps**:

```javascript
// app-builder-extension/src/actions/products/index.js

// Register a menu item
const registration = {
    id: 'vendor-app',
    title: 'My App',
    menu: [
        {
            id: 'vendor-app-products',
            label: 'My Products',
            parent: 'Magento_Catalog::products',
            url: `${process.env.BASE_URL}/index.html#/products`
        }
    ]
};
```

**Admin UI SDK extension points:**

| Extension Point | Description |
|----------------|-------------|
| `menu` | Add items to Admin navigation |
| `page` | Add new admin pages (IFrame) |
| `mass_action` | Add mass actions to grids |
| `grid_column` | Add columns to product/order grids |
| `banner` | Add banner notifications in Admin |
| `order_view_button` | Add buttons to order detail view |

**Exam focus:**
- Admin UI SDK is for **Adobe Commerce Cloud** integration with **App Builder** (not for local customization)
- Extensions render as **IFrames** — they are sandboxed from core Magento Admin
- Configuration is through `ExtensionRegistration` component in the React/Preact app
- This is part of Adobe's **API-first / headless** extensibility model

### 6.3 Grunt — Development Workflow

**Gruntfile.js tasks for theme development:**

```bash
# Install Node dependencies
npm install

# Register a new theme in Grunt (add to dev/tools/grunt/configs/themes.js)
# Then run:

# Clean generated files for a theme
grunt clean:Vendor_mytheme

# Execute (collect and symlink files)
grunt exec:Vendor_mytheme

# Compile LESS to CSS
grunt less:Vendor_mytheme

# Watch for changes (LESS + templates)
grunt watch:Vendor_mytheme

# Run all steps in sequence
grunt clean:Vendor_mytheme && grunt exec:Vendor_mytheme && grunt less:Vendor_mytheme
```

**Theme registration in Grunt config:**

```javascript
// dev/tools/grunt/configs/themes.js
module.exports = {
    blank: { ... },          // Magento/blank config
    luma: { ... },           // Magento/luma config

    // Add your custom theme:
    mytheme: {
        area: 'frontend',
        name: 'Vendor/mytheme',
        locale: 'en_US',
        files: [
            'css/styles-m',
            'css/styles-l',
            'css/print'
        ],
        dsl: 'less'
    }
};
```

**Exam focus:**
- Grunt `less` task compiles LESS → CSS and places output in `pub/static/`
- `grunt exec` collects and symlinks static files (replaces `setup:static-content:deploy` for dev)
- Must register custom themes in `dev/tools/grunt/configs/themes.js` before Grunt will process them
- `grunt watch` monitors file changes and recompiles automatically — ideal for development

### 6.4 Static Content Deployment & Optimization

**`setup:static-content:deploy` flags:**

```bash
# Deploy all themes for all locales
bin/magento setup:static-content:deploy

# Deploy specific locale(s)
bin/magento setup:static-content:deploy en_US fr_FR

# Deploy specific theme
bin/magento setup:static-content:deploy --theme Vendor/mytheme

# Deploy specific area
bin/magento setup:static-content:deploy --area frontend

# Use multiple jobs (parallel processing)
bin/magento setup:static-content:deploy -j 4

# Force redeploy (even if files exist)
bin/magento setup:static-content:deploy -f

# Skip compact (full deployment)
bin/magento setup:static-content:deploy --no-html-minify

# Specify strategy
bin/magento setup:static-content:deploy --strategy compact
# Strategies: compact (default), standard, quick
```

**Deployment strategies:**

| Strategy | Description | Best For |
|----------|-------------|----------|
| `standard` | Full deploy for all packages | Reliability |
| `compact` | Only files needed for current locale/theme | Disk space |
| `quick` | Fastest, skips per-theme processing | CI/CD speed |

**Exam focus:**
- Must run `setup:static-content:deploy` before switching to `production` mode
- `-j` flag enables parallel processing (jobs) — speeds up deployment
- Deployed files go to `pub/static/frontend/<Vendor>/<theme>/<locale>/`
- **CSS merging** (`Stores > Config > Advanced > Developer > CSS Settings > Merge CSS`): combines CSS files into one request
- **JS merging** similarly combines JS files (not recommended with HTTP/2)
- **JS bundling**: combines JS into fewer files (deprecated in favor of HTTP/2)

### 6.5 Cache Management for Frontend Development

```bash
# Clear all caches
bin/magento cache:clean

# Flush cache storage
bin/magento cache:flush

# Clear specific cache types
bin/magento cache:clean layout block_html full_page

# Disable caches for development
bin/magento cache:disable full_page block_html

# View cache status
bin/magento cache:status
```

**Cache types relevant to frontend:**

| Cache Type | Tag | What it Caches |
|------------|-----|---------------|
| `layout` | `LAYOUT_GENERAL_CACHE_TAG` | Parsed layout XML |
| `block_html` | `BLOCK_HTML` | Individual block HTML output |
| `full_page` | `FPC` | Full page cache (Varnish/built-in) |
| `config` | `CONFIG` | System configuration |
| `translate` | `TRANSLATE` | Translation strings |

**Exam focus:**
- Clear `layout` cache after changing layout XML files
- Clear `block_html` after changing block PHP or template files
- Clear `full_page` after any frontend change in production
- `cache:clean` = clean Magento cache; `cache:flush` = flush underlying storage (Redis, Memcached)

### 6.6 Edge Delivery Services (Headless/EDS)

Adobe Commerce Edge Delivery Services (EDS) decouples the storefront from the Commerce backend:

```
Commerce Backend          Edge Delivery (CDN-first)
+----------------+        +------------------------+
| Catalog API    | -----> | Document-based Authoring|
| Cart/Checkout  | -----> | (Google Docs/SharePoint)|
| Customer API   | -----> | Auto-generated HTML     |
| Order API      |        | 100 Lighthouse Score    |
+----------------+        +------------------------+
```

**Key concepts:**

| Concept | Description |
|---------|-------------|
| Boilerplate | Starter kit for EDS storefront (`github.com/adobe/aem-eds-storefront`) |
| Blocks | Functional components (like Page Builder blocks) — plain HTML/CSS/JS |
| Auto-blocking | Content in Docs auto-converts to semantic HTML blocks |
| Sidekick | Browser extension for authors to preview and publish |
| RUM (Real User Monitoring) | Built-in performance tracking |

**Exam focus:**
- EDS stores content in **Google Docs or SharePoint** — not CMS blocks
- EDS achieves **100 Lighthouse score** target through CDN-first architecture
- Blocks in EDS = directories with `block-name.js` and `block-name.css` files
- EDS is a **separate storefront** from the Magento frontend theme system — themes don't apply

---

## 7. Cheat Sheet: LESS File Names & Roles

| File | Location | Role |
|------|----------|------|
| `_theme.less` | `web/css/source/` | **PRIMARY**: Override all UI Library variables |
| `_extend.less` | `web/css/source/` | Add/extend global theme styles |
| `_widgets.less` | `web/css/source/` | Override widget-specific styles |
| `_icons.less` | `web/css/source/` | Override icon styles |
| `styles-m.less` | `web/css/` | Mobile stylesheet entry point (compiled output) |
| `styles-l.less` | `web/css/` | Desktop stylesheet entry point (compiled output) |
| `print.less` | `web/css/` | Print stylesheet |
| `_styles.less` | `web/css/` | Shared imports (used by both m and l) |
| `_module.less` | `<Module>/web/css/source/` | Module's own base styles |
| `_extend.less` | `<Module>/web/css/source/` | Module extension point for theme overrides |
| `_variables.less` | `lib/web/css/source/lib/` | ALL UI Library default variable values |
| `_responsive.less` | `lib/web/css/source/lib/` | Responsive breakpoint mixins |
| `_buttons.less` | `lib/web/css/source/lib/` | Button component styles and mixins |
| `_typography.less` | `lib/web/css/source/lib/` | Typography styles and mixins |
| `_forms.less` | `lib/web/css/source/lib/` | Form element styles and mixins |
| `_navigation.less` | `lib/web/css/source/lib/` | Navigation component styles |
| `_icons.less` | `lib/web/css/source/lib/` | Icon font styles and mixins |

**Key rules:**
- **Always start variable overrides in `_theme.less`** — it's the first file checked in the import chain
- Module's `_extend.less` is the recommended place for theme-specific module overrides
- `lib/web/css/source/lib/_variables.less` is read-only reference — override in theme's `_theme.less`

---

## 8. Cheat Sheet: requirejs-config.js Annotated Reference

```javascript
// File: app/design/frontend/<Vendor>/<theme>/requirejs-config.js
// OR:   app/code/<Vendor>/<Module>/view/frontend/requirejs-config.js
// Configs from all files are MERGED by Magento

var config = {

    // -----------------------------------------------------------
    // MAP: Redirect module requests to different paths
    // '*' = applies to all requesting modules (universal alias)
    // -----------------------------------------------------------
    map: {
        '*': {
            // ALIAS: short-name -> full module path
            'catalogGallery':    'Magento_Catalog/js/gallery',

            // OVERRIDE: replace a core module entirely
            'Magento_Checkout/js/view/minicart':
                'Vendor_Module/js/view/minicart-custom',

            // SWAP jquery versions or implementations
            'jquery':            'jquery/jquery.min'
        }
    },

    // -----------------------------------------------------------
    // PATHS: Define base path locations for modules
    // Relative to baseUrl (pub/static/.../web/)
    // Do NOT include .js extension
    // -----------------------------------------------------------
    paths: {
        'jquery/jquery-ui': 'jquery/jquery-ui-1.13.2.min'
    },

    // -----------------------------------------------------------
    // SHIM: Configure non-AMD legacy scripts
    // deps: load these first; exports: global variable to export
    // -----------------------------------------------------------
    shim: {
        'jquery/bootstrap': {
            deps: ['jquery'],
            exports: 'Bootstrap'
        },
        'jquery/legacy-analytics': {
            deps: ['jquery', 'domReady!']  // domReady! = wait for DOM
        }
    },

    // -----------------------------------------------------------
    // DEPS: Auto-load these modules on every page load
    // Use sparingly — impacts performance
    // -----------------------------------------------------------
    deps: [
        'Vendor_Module/js/auto-include'
    ],

    // -----------------------------------------------------------
    // CONFIG: Module-specific configuration
    // Includes MIXINS registration
    // -----------------------------------------------------------
    config: {
        mixins: {
            // Target module -> {mixin module: true/false}
            'Magento_Checkout/js/action/place-order': {
                'Vendor_Module/js/mixin/place-order-mixin': true
            },
            'mage/validation': {
                'Vendor_Module/js/mixin/validation-mixin': true
            }
        },

        // Pass config to a specific module (accessed via module.config())
        'Vendor_Module/js/my-module': {
            apiEndpoint: '/api/custom',
            maxRetries: 3
        }
    },

    // -----------------------------------------------------------
    // WAITFOR: Ensures specific scripts load before requirejs init
    // -----------------------------------------------------------
    waitSeconds: 30,   // Timeout for script loading

    // -----------------------------------------------------------
    // BUNDLES: Define script bundles (legacy optimization)
    // -----------------------------------------------------------
    bundles: {
        'Vendor_Module/js/bundle': [
            'Vendor_Module/js/component-a',
            'Vendor_Module/js/component-b'
        ]
    }
};
```

**Quick rules:**
- `map` → redirect/alias; `paths` → location; `shim` → non-AMD; `deps` → auto-load; `config.mixins` → extend
- Multiple `requirejs-config.js` files are **merged** — you don't overwrite core, you extend it
- Module path resolution: `<module-name>` → `baseUrl/<paths entry>/<name>.js`

---

## 9. Cheat Sheet: Layout XML Instruction Reference Table

| Instruction | Required Attrs | Optional Attrs | Purpose |
|-------------|---------------|----------------|---------|
| `<block>` | `class`, `name` | `template`, `before`, `after`, `as`, `cacheable`, `aclResource` | Create a new block |
| `<container>` | `name` | `htmlTag`, `htmlClass`, `htmlId`, `label`, `before`, `after`, `as` | Create structural container |
| `<referenceBlock>` | `name` | `remove`, `display` | Modify existing block |
| `<referenceContainer>` | `name` | `remove`, `display` | Modify existing container |
| `<move>` | `element`, `destination` | `before`, `after`, `as` | Relocate block/container |
| `<update>` | `handle` | — | Include another layout handle |
| `<action>` | `method` | `ifconfig`, `translate` | Call block method |
| `<arguments>` | — | — | Wrap argument elements |
| `<argument>` | `name`, `xsi:type` | `translate` | Define a block argument |
| `<head>` | — | — | Page `<head>` resources wrapper |
| `<script>` | `src` | `src_type`, `defer`, `async` | Add JS file to head |
| `<css>` | `src` | `src_type`, `media` | Add CSS file to head |
| `<remove>` | `src` | — | Remove head resource |
| `<link>` | `src` | `src_type`, `rel`, `as` | Add `<link>` tag to head |
| `<meta>` | `name`, `content` | `http-equiv` | Add `<meta>` to head |
| `<title>` | — | — | Set page `<title>` |
| `<attribute>` | `name`, `value` | — | Set `<body>` attribute |
| `<body>` | — | — | Page body instructions wrapper |

**Argument xsi:type values:**

| Type | Example |
|------|---------|
| `string` | `<argument name="x" xsi:type="string">value</argument>` |
| `boolean` | `<argument name="x" xsi:type="boolean">true</argument>` |
| `number` | `<argument name="x" xsi:type="number">42</argument>` |
| `array` | Contains `<item>` children |
| `object` | `<argument name="x" xsi:type="object">Vendor\Module\Model\X</argument>` |
| `url` | `<argument name="x" xsi:type="url" path="catalog/category/view"/>` |
| `options` | `<argument name="x" xsi:type="options" model="Vendor\Module\Model\Source\X"/>` |
| `helper` | `<argument name="x" xsi:type="helper" helper="Vendor\Module\Helper\Data::getMethod"/>` |
| `const` | `<argument name="x" xsi:type="const">Vendor\Module\Model\Config::CONST_NAME</argument>` |
| `null` | `<argument name="x" xsi:type="null"/>` |

---

## 10. Cheat Sheet: data-mage-init vs x-magento-init

### data-mage-init

```html
<!-- SYNTAX: attribute on the target element -->
<!-- Value is JSON with: {"module/path": {options}} -->

<div class="product-gallery"
     data-mage-init='{
         "Magento_Catalog/js/gallery": {
             "mixins": ["Magento_ProductVideo/js/fotorama-add-video-events"],
             "allowfullscreen": true
         }
     }'>
</div>

<!-- Rules:
     - Attribute value MUST be valid JSON
     - Module receives this element as its DOM context
     - Multiple widgets: comma-separate module entries
     - Widget's element = the div with data-mage-init
-->
```

### x-magento-init

```html
<!-- SYNTAX: script tag with type="text/x-magento-init" -->
<!-- Structure: {"selector": {"module/path": {options}}} -->

<script type="text/x-magento-init">
{
    ".product-gallery": {
        "Magento_Catalog/js/gallery": {
            "allowfullscreen": true
        }
    },
    "[data-role='main-container']": {
        "Vendor_Module/js/main": {}
    },
    "*": {
        "Vendor_Module/js/global": {
            "trackingId": "UA-12345"
        }
    }
}
</script>

<!-- Rules:
     - Can be placed anywhere in the page
     - "*" = no element context (global init)
     - Each key is a CSS selector
     - Widget initialized once per matched element
     - Can target elements not yet in DOM (if deferred)
-->
```

### Comparison Matrix

```
Feature               data-mage-init          x-magento-init
--------------------  ----------------------  ----------------------
Placement             On target element        <script> tag anywhere
Element binding       Always (the element)     Via CSS selector
Global init           Not supported            Use "*" selector
Multiple widgets      Yes (JSON object)        Yes (multiple selectors)
Decoupled from HTML   No                       Yes
Dynamic elements      Less flexible            More flexible
Template usage        Common in .phtml         Common in .phtml
Config from PHP       Needs <?= ?> inline      Needs <?= ?> inline
Module receives       this.element = the div   this.element = matched el
Use case              Simple element widget    Complex or global init
```

---

## 11. Cheat Sheet: Template Escaping Method Reference

### Complete Escaping Method Reference

| Method | Context | When to Use | Example |
|--------|---------|-------------|---------|
| `escapeHtml($str)` | HTML content | Text between tags | `<p><?= $block->escapeHtml($title) ?></p>` |
| `escapeHtml($str, $allowedTags)` | HTML content (with tags) | Allow specific HTML | `<?= $block->escapeHtml($content, ['b', 'em', 'strong']) ?>` |
| `escapeHtmlAttr($str)` | HTML attribute value | Inside attribute quotes | `<div class="<?= $block->escapeHtmlAttr($class) ?>">` |
| `escapeUrl($str)` | URL in href/src | Link and image URLs | `<a href="<?= $block->escapeUrl($url) ?>">` |
| `escapeJs($str)` | JavaScript string | JS variable values | `var x = '<?= $block->escapeJs($val) ?>';` |
| `escapeCss($str)` | CSS property value | Inline style values | `style="color: <?= $block->escapeCss($color) ?>"` |
| `$escaper->escapeHtml()` | HTML content | Magento 2.4+ direct | `<?= $escaper->escapeHtml($title) ?>` |

### Escaping Code Examples

```php
<?php
// ------------------------------------------------
// 1. HTML content escaping (most common)
// ------------------------------------------------
<h1><?= $block->escapeHtml($block->getTitle()) ?></h1>
<p><?= $block->escapeHtml($block->getDescription()) ?></p>

// With allowed tags (whitelist)
<div class="description">
    <?= $block->escapeHtml($block->getHtmlDescription(), ['b', 'strong', 'em', 'i', 'a', 'p', 'br']) ?>
</div>

// ------------------------------------------------
// 2. HTML attribute escaping
// ------------------------------------------------
<input type="text"
       name="<?= $block->escapeHtmlAttr($block->getFieldName()) ?>"
       placeholder="<?= $block->escapeHtmlAttr(__('Enter search term')) ?>"
       class="input-text <?= $block->escapeHtmlAttr($block->getData('css_class')) ?>"/>

// ------------------------------------------------
// 3. URL escaping
// ------------------------------------------------
<a href="<?= $block->escapeUrl($block->getProductUrl()) ?>">View Product</a>
<img src="<?= $block->escapeUrl($block->getImageUrl()) ?>"
     alt="<?= $block->escapeHtmlAttr($block->getImageAlt()) ?>"/>

// ------------------------------------------------
// 4. JavaScript context
// ------------------------------------------------
<script>
    var productData = {
        name: '<?= $block->escapeJs($product->getName()) ?>',
        sku:  '<?= $block->escapeJs($product->getSku()) ?>'
    };
</script>

// Better: use JSON encoding for complex data
<script>
    var config = <?= /* @noEscape */ $block->getJsonConfig() ?>;
    //  ^ getJsonConfig() already returns json_encode() output
</script>

// ------------------------------------------------
// 5. Suppress escaping warnings (pre-escaped content)
// ------------------------------------------------
<?= /* @noEscape */ $alreadyEscapedHtml ?>
<?= /** @noEscape */ $jsonConfig ?>

// ------------------------------------------------
// 6. Child block HTML (always safe — block renders its own output)
// ------------------------------------------------
<?= $block->getChildHtml('child.block.name') ?>
// ^ No escaping needed — child block manages its own output

// ------------------------------------------------
// 7. Magento 2.4+ $escaper (injected automatically)
// ------------------------------------------------
<?= $escaper->escapeHtml($title) ?>
<?= $escaper->escapeHtmlAttr($attrValue) ?>
<?= $escaper->escapeUrl($url) ?>
<?= $escaper->escapeJs($jsString) ?>
```

**Exam focus:**
- **Never** use `echo $var` without an escape method
- `getChildHtml()` output does **not** need escaping — blocks manage their own output
- `/* @noEscape */` is a static analysis suppression comment — only use when content is truly safe
- `$block->getJsonConfig()` uses `json_encode()` internally and is safe to output without escaping (use `/* @noEscape */`)
- `escapeHtmlAttr()` vs `escapeHtml()`: attr escapes quotes; html escapes `<`, `>`, `&`
- `escapeUrl()` encodes special URL characters; also validates scheme (blocks `javascript:`)

---

## Quick-Reference Checklist

### Section 1 — Themes, Email Templates & Translations

- [ ] Theme files: `theme.xml` (name + parent), `registration.php` (ComponentRegistrar::THEME), `view.xml` (image roles)
- [ ] `preview.jpg` is 800×600 px at `media/preview.jpg`
- [ ] File fallback: `Vendor/theme` → parent → `Magento/blank` → module `view/` → `lib/web/`
- [ ] Layout XML **merges** through fallback; templates and static files **replace**
- [ ] Email directives: `{{var}}`, `{{trans}}`, `{{depend}}`, `{{config}}`, `{{inlinecss}}`, `{{include}}`
- [ ] `{{inlinecss}}` converts stylesheets to inline styles for email client compatibility
- [ ] DB translations override file translations; file priority: theme > module > language pack
- [ ] Translation CSV format: `"Original","Translated"` in `i18n/en_US.csv`
- [ ] PHP translation: `__('string')` or `__('Hello %1', $name)`
- [ ] JS translation: `$.mage.__('string')` or `$t('string')` via `mage/translate`

### Section 2 — Layout XML, Templates & Escaping

- [ ] Layout handle = `route_controller_action` (lowercase underscores)
- [ ] `default.xml` applies to all pages
- [ ] `<block>` requires `class` and `name`; `<container>` has no class/template
- [ ] `before="-"` = first; `after="-"` = last in parent container
- [ ] `<move element="" destination="" before="" after="">` relocates blocks
- [ ] `remove="true"` on `<referenceBlock>` removes block; `display="false"` hides only
- [ ] Template override: `<theme>/<Vendor_Module>/templates/path/to/file.phtml`
- [ ] Layout override (replace): `<theme>/<Vendor_Module>/layout/override/base/handle.xml`
- [ ] Layout in theme extends by default; `override/base/` path replaces entirely
- [ ] Page layouts: `empty`, `1column`, `2columns-left`, `2columns-right`, `3columns`
- [ ] `escapeHtml()` = HTML content; `escapeHtmlAttr()` = attribute values; `escapeUrl()` = URLs; `escapeJs()` = JS strings
- [ ] `getChildHtml('name')` output does not need escaping
- [ ] `/* @noEscape */` suppresses static analysis for pre-escaped content
- [ ] `xsi:type` values: `string`, `boolean`, `number`, `array`, `object`, `url`, `options`, `helper`, `const`, `null`

### Section 3 — LESS, UI Library & Responsive

- [ ] `_theme.less` = primary variable override file in theme
- [ ] `_extend.less` = add/extend styles at theme or module level
- [ ] `_variables.less` in `lib/web/css/source/lib/` = all default UI Library variables
- [ ] `styles-m.less` = mobile-first entry; `styles-l.less` = desktop additions
- [ ] Override UI Library variable: re-declare `@variable-name: new-value;` in `_theme.less`
- [ ] `@screen__m: 768px` (tablet); `@screen__l: 1024px` (desktop) breakpoints
- [ ] `.lib-min-screen-m()` generates `@media all and (min-width: 768px)` media queries
- [ ] Grunt commands: `grunt less`, `grunt exec`, `grunt watch`, `grunt clean`
- [ ] Register theme in `dev/tools/grunt/configs/themes.js` for Grunt to process it
- [ ] Production compilation: `bin/magento setup:static-content:deploy`
- [ ] `_module.less` in module = module's base styles; `_extend.less` = theme override point

### Section 4 — RequireJS, Mixins, KO, jQuery & JS (MOST IMPORTANT — 36%)

- [ ] `requirejs-config.js` keys: `map`, `paths`, `shim`, `deps`, `config`
- [ ] `map: {'*': {alias: 'actual/path'}}` — universal alias/redirect
- [ ] `shim` is for non-AMD scripts; `deps` array lists auto-loaded modules
- [ ] Mixins declared under `config.mixins`, NOT under `map`
- [ ] Mixin receives original module as argument; must return wrapped/extended version
- [ ] `this._super()` in UI component mixins calls the original method
- [ ] Multiple `requirejs-config.js` files are merged — not replaced
- [ ] `define([deps], function(args){})` = module definition; `require([deps], fn)` = one-time use
- [ ] `data-mage-init`: JSON attribute on element; element IS the widget's `this.element`
- [ ] `x-magento-init`: `<script>` tag with CSS selector keys; `"*"` = global (no element)
- [ ] `data-mage-init` requires valid JSON (double quotes, no trailing commas)
- [ ] Both parsed automatically by `mage/apply/main.js` on DOM ready
- [ ] jQuery widget: `$.widget('mage.name', { _create, _destroy, options, _on })` 
- [ ] Widget namespace: `mage.widgetName` → `$.mage.widgetName`
- [ ] Widget instance: `$el.data('mage-widgetName')`
- [ ] `_on()` for event binding (auto-cleaned); `this._trigger()` for custom events
- [ ] KO `data-bind` attribute; `observable()`, `observableArray()`, `computed()`
- [ ] KO contexts: `$parent`, `$root`, `$index()`, `$data` in `foreach` loops
- [ ] `text:` escapes HTML; `html:` renders raw HTML; `value:` is two-way
- [ ] `visible:` toggles display; `if:` adds/removes DOM; `foreach:` iterates arrays
- [ ] UI component: `Component.extend({defaults, initialize, initObservables})`
- [ ] `this.observe(['prop'])` makes properties KO observables
- [ ] JS via layout XML: `<head><script src="Vendor_Module::js/file.js"/>` in page config
- [ ] Module path notation in `src`: `Vendor_Module::path/to/file.js`

### Section 5 — Page Builder, Admin UI SDK, Grunt & Optimization

- [ ] Page Builder content types: `preview_component`, `master_component`, preview/master templates
- [ ] Content type templates: `adminhtml/web/template/content-type/<name>/default/preview.html`
- [ ] Page Builder stores content as HTML with `data-content-type` attributes
- [ ] Menu sections: `layout`, `elements`, `media`, `add-content`
- [ ] Admin UI SDK = IFrame-based App Builder integration (not local PHP customization)
- [ ] Admin UI SDK extension points: `menu`, `page`, `mass_action`, `grid_column`, `banner`
- [ ] `setup:static-content:deploy` flags: `--theme`, `--area`, `-j` (jobs), `-f` (force), `--strategy`
- [ ] Strategies: `standard` (full), `compact` (locale-specific), `quick` (fastest)
- [ ] Deployed files: `pub/static/frontend/<Vendor>/<theme>/<locale>/`
- [ ] Clear `layout` cache after layout XML changes; `block_html` after template changes; `full_page` in production
- [ ] `cache:clean` = Magento cache clean; `cache:flush` = underlying storage flush
- [ ] EDS (Edge Delivery Services) = document-based authoring (Google Docs/SharePoint), CDN-first, 100 Lighthouse score target
- [ ] EDS blocks = directories with `block-name.js` + `block-name.css` (not Magento blocks)
- [ ] EDS is separate from the Magento theme system — themes do not apply to EDS
- [ ] Grunt workflow: `npm install` → register theme → `grunt exec` → `grunt less` → `grunt watch`

---

*End of Day 19 Study Notes — Full Exam Section Review & Cheat Sheet Finalization*

*Next: Day 20 — Practice exam simulation and weak area re-study*
