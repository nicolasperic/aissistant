# Day 14 — Week 2 Review + Second Practice Test
### Magento 2 Certified Frontend Developer Exam Prep

---

## Table of Contents

1. [Week 2 Core Topics Overview](#1-week-2-core-topics-overview)
2. [LESS Architecture Deep Review](#2-less-architecture-deep-review)
3. [RequireJS Configuration Deep Review](#3-requirejs-configuration-deep-review)
4. [Mixins — JS and LESS](#4-mixins--js-and-less)
5. [Knockout.js Bindings and uiComponent](#5-knockoutjs-bindings-and-uicomponent)
6. [Second Practice Test Strategy](#6-second-practice-test-strategy)
7. [Score Tracking and Gap Analysis](#7-score-tracking-and-gap-analysis)
8. [Week 3 Planning — Sections Needing Attention](#8-week-3-planning--sections-needing-attention)
9. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Week 2 Core Topics Overview

Week 2 covered the **styling layer and JavaScript framework** that underpins all Magento 2 frontend development. These topics consistently appear across **Sections 1, 2, and 3** of the certification exam.

```
+----------------------------------------------------------+
|               WEEK 2 KNOWLEDGE MAP                       |
+----------------------------------------------------------+
|  LESS / CSS         |  JavaScript Layer                  |
|  -------------      |  -------------------------         |
|  lib/web/css        |  RequireJS (AMD loader)            |
|  _module.less       |  requirejs-config.js               |
|  _extend.less       |  JS Mixins (map/override)          |
|  UI Library         |  uiComponent / uiElement           |
|  Compiled vs Partial|  Knockout.js bindings              |
+----------------------------------------------------------+
```

**Why this matters for the exam:**
- LESS questions appear in **Section 2 (Theming)** — file locations, import order, override strategy
- RequireJS / Mixin questions appear in **Section 3 (JavaScript)** — config keys, AMD syntax, mixin declarations
- Knockout questions appear in **Section 3** — binding syntax, `data-bind`, observable declarations

---

## 2. LESS Architecture Deep Review

### 2.1 The LESS Compilation Pipeline

Magento 2 compiles LESS files in two modes:

| Mode | Trigger | Output Location | Use Case |
|------|---------|-----------------|----------|
| **Server-side (PHP)** | `bin/magento setup:static-content:deploy` | `pub/static/` | Production |
| **Client-side (Less.js)** | Developer mode, browser request | Browser memory | Active development |
| **Grunt (local)** | `grunt watch` / `grunt less` | `pub/static/` | Development workflow |

**Exam focus:** In **developer mode**, LESS is compiled **client-side by the browser** using `less.js`. In **production mode**, LESS must be pre-compiled via `setup:static-content:deploy` or Grunt.

### 2.2 Compiled vs Partial Files

```
+------------------------------+
|  Compiled File (entry point) |  <-- Has NO leading underscore
|  e.g. styles-m.less          |      Magento resolves this file
+------------------------------+
           |
           | @import
           v
+------------------------------+
|  Partial File (fragment)     |  <-- Has leading underscore
|  e.g. _variables.less        |      Never compiled directly
|       _buttons.less          |
+------------------------------+
```

**Compiled (entry-point) files** — no underscore prefix, directly imported by `default_head_blocks.xml`:

```xml
<!-- Magento_Theme/layout/default_head_blocks.xml -->
<head>
    <css src="css/styles-m.css"/>
    <css src="css/styles-l.css" media="screen and (min-width: 768px)"/>
</head>
```

**Partial files** — prefixed with `_`, imported via `@import`:

```less
// styles-m.less  (compiled entry point)
@import '_variables.less';
@import '_typography.less';
@import '_buttons.less';
```

**Exam focus:** Files prefixed with `_` are **partials** — they are **never compiled independently**. Only un-prefixed `.less` files are valid compilation entry points.

### 2.3 LESS File Hierarchy and Override Strategy

```
app/design/frontend/<Vendor>/<theme>/
  |
  +-- web/css/
  |     +-- styles-m.less          (compiled entry point — override here)
  |     +-- _theme.less            (theme variable overrides)
  |     +-- source/
  |           +-- _variables.less  (full variable override)
  |
  +-- Magento_Catalog/
        +-- web/css/
              +-- source/
                    +-- _module.less   (module-specific styles)
```

The **override priority** from lowest to highest:

```
lib/web/css/          (Magento UI Library - base)
      |
      v
Blank Theme source/   (Blank theme defaults)
      |
      v
Custom Theme source/  (Your _theme.less, _variables.less)
      |
      v
Module web/css/source/_module.less  (Per-module overrides)
      |
      v
Module web/css/source/_extend.less  (Extend without replacing)
```

**Exam focus:** `_module.less` **replaces** module styles entirely. `_extend.less` **appends** additional rules without replacing existing ones. Use `_extend.less` when you want to add rules while preserving the module's original styles.

### 2.4 The Magento UI Library

Located at: `lib/web/css/source/`

Key mixins provided by the UI Library:

```less
// Typography
.lib-font-size(@_font-size: @font-size__base);
.lib-line-height(@_line-height: @line-height__base);

// Layout
.lib-css(property, value);
.lib-vendor-prefix-display(@_display: flex);

// Component shortcuts
.lib-button();
.lib-input-style();
.lib-dropdown();
.lib-clearfix();
```

**Exam focus:** The Magento UI Library is **exclusively LESS-based** and lives in `lib/web/css/`. It is **not** a third-party library — it is Magento's own component-level mixin set. Custom themes inherit it automatically through Blank theme.

### 2.5 LESS Variables — Override Pattern

```less
// lib/web/css/source/lib/variables/_colors.less (DO NOT EDIT)
@color-black: #000000;
@primary__color: #333333;

// YOUR THEME: web/css/source/_variables.less (OVERRIDE HERE)
@primary__color: #cc0000;   // Override Magento default
@button__background: @primary__color;
```

**Variable naming conventions:**

| Pattern | Meaning |
|---------|---------|
| `@component__property` | Component-specific (e.g., `@button__background`) |
| `@component__property__state` | State variant (e.g., `@button__background__hover`) |
| `@global__property` | Global design token (e.g., `@primary__color`) |

**Exam focus:** Variable override files go in `web/css/source/_variables.less` inside your theme. **Never** edit `lib/web/css/` directly — that breaks upgradability.

---

## 3. RequireJS Configuration Deep Review

### 3.1 requirejs-config.js Location and Scope

```
app/design/frontend/<Vendor>/<theme>/requirejs-config.js   (Theme scope)
app/code/<Vendor>/<Module>/view/frontend/requirejs-config.js (Module scope)
app/code/<Vendor>/<Module>/view/base/requirejs-config.js    (All areas)
```

**Exam focus:** Multiple `requirejs-config.js` files are **merged** at build time — they do not override each other. All configs from theme and modules are combined into a single `requirejs-config.js` in `pub/static/`.

### 3.2 RequireJS Config Object Keys

```javascript
// requirejs-config.js — complete structure reference
var config = {

    // 1. PATHS — Map a module ID to a file path (no .js extension)
    paths: {
        'Vendor_Module/js/component': 'Vendor_Module/js/component-v2'
    },

    // 2. MAP — Redirect one module ID to another, scoped by consumer
    map: {
        '*': {
            // For ALL modules: when 'jquery/ui' is required, load 'jquery-ui-modules/core'
            'jquery/ui': 'jquery-ui-modules/core'
        },
        'Vendor_Module/js/specific-component': {
            // Only for this specific module: remap 'underscore' to lodash
            'underscore': 'Vendor_Module/js/lodash'
        }
    },

    // 3. SHIM — Wrap non-AMD scripts, declare deps + exports
    shim: {
        'legacy-plugin': {
            deps: ['jquery'],
            exports: 'LegacyPlugin'
        }
    },

    // 4. DEPS — Auto-require these modules on every page
    deps: [
        'Magento_Theme/js/theme'
    ],

    // 5. CONFIG — Pass data to a module (accessed via module.config())
    config: {
        mixins: {
            // JS MIXIN DECLARATION (see Section 4)
            'Magento_Checkout/js/view/form/element/email': {
                'Vendor_Module/js/email-mixin': true
            }
        }
    }
};
```

**Key differences — paths vs map:**

| Key | What it does | Scope |
|-----|-------------|-------|
| `paths` | Alias a module ID to a physical file path | Global |
| `map` | Redirect a required module ID to a different module ID | Per-consumer (`*` = global) |
| `shim` | Make non-AMD scripts work with RequireJS | Global |
| `deps` | Pre-load modules before page execution | Global |
| `config.mixins` | Register JS mixins for a target module | Global |

**Exam focus:** `map` with `'*'` applies the redirect **globally** (all requesting modules). `map` with a specific module ID applies **only when that specific module** makes the require call. This is the most commonly tested `map` distinction.

### 3.3 AMD Module Syntax

```javascript
// Standard AMD module definition
define([
    'jquery',                              // alias resolved via paths
    'Magento_Ui/js/lib/core/element/element', // module path
    'uiComponent'                          // short alias for Magento_Ui/js/lib/core/component
], function ($, Element, Component) {
    'use strict';

    return Component.extend({
        defaults: {
            template: 'Vendor_Module/my-template'
        },

        initialize: function () {
            this._super();
            console.log('Component initialized');
            return this;
        }
    });
});
```

```javascript
// require() — execute code, no return value needed
require([
    'jquery',
    'domReady!'           // special plugin — waits for DOM ready
], function ($) {
    'use strict';
    $('body').addClass('loaded');
});
```

**Exam focus:** `define()` is used to **create reusable modules**. `require()` is used to **execute code**. `define()` **must** have a return value for other modules to consume it. The `domReady!` plugin (note the `!`) is a RequireJS loader plugin, not a regular module.

---

## 4. Mixins — JS and LESS

### 4.1 JavaScript Mixins

JS Mixins allow you to **extend or override** an existing Magento JS module **without replacing it**.

**Step 1 — Declare the mixin in requirejs-config.js:**

```javascript
// app/code/Vendor/Module/view/frontend/requirejs-config.js
var config = {
    config: {
        mixins: {
            // TARGET module: { MIXIN module: true/false }
            'Magento_Checkout/js/view/form/element/email': {
                'Vendor_Module/js/mixin/email-mixin': true
            },
            'Magento_Catalog/js/price-utils': {
                'Vendor_Module/js/mixin/price-utils-mixin': true
            }
        }
    }
};
```

**Step 2 — Write the mixin module:**

```javascript
// app/code/Vendor/Module/view/frontend/web/js/mixin/email-mixin.js
define([], function () {
    'use strict';

    return function (target) {
        // target = the original module's prototype or object

        // PATTERN 1: Wrap/override a method
        var originalSetEmail = target.prototype.setEmail;

        target.prototype.setEmail = function (value) {
            console.log('Email being set:', value);
            // Call original method
            return originalSetEmail.apply(this, arguments);
        };

        // PATTERN 2: Add a new method
        target.prototype.validateEmailDomain = function () {
            return this.email().indexOf('@company.com') > -1;
        };

        return target;  // MUST return the modified target
    };
});
```

**Exam focus:** A JS mixin module **must return a function** that accepts `target` and **returns the modified target**. If you forget to return `target`, the original module breaks for all consumers. Setting the mixin value to `false` **disables** it.

### 4.2 LESS Mixins (UI Library Pattern)

LESS mixins in Magento follow the **parametric mixin** pattern:

```less
// DEFINING a mixin (in lib or custom _mixins.less)
.lib-custom-card(
    @_background: @color-white,
    @_border: 1px solid @border-color__base,
    @_padding: @indent__base
) {
    background: @_background;
    border: @_border;
    padding: @_padding;
    border-radius: 3px;
}

// USING the mixin
.product-card {
    .lib-custom-card(
        @_background: @color-gray95,
        @_padding: @indent__s
    );
    // Additional rules
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

**Exam focus:** Magento UI Library mixin parameters are **prefixed with `@_`** (single underscore after `@`) by convention. Global LESS variables use `@` directly (e.g., `@primary__color`). This naming distinction appears in exam questions.

### 4.3 LESS Extend vs Mixin

```less
// MIXIN — copies rules into each selector (increases CSS output size)
.clearfix-mixin() {
    &:after {
        content: '';
        display: table;
        clear: both;
    }
}
.header { .clearfix-mixin(); }
.footer { .clearfix-mixin(); }
// Output: .header:after {...}  .footer:after {...}  (duplicated)

// EXTEND — groups selectors (smaller CSS output)
.clearfix-base {
    &:after {
        content: '';
        display: table;
        clear: both;
    }
}
.header:extend(.clearfix-base all) {}
.footer:extend(.clearfix-base all) {}
// Output: .clearfix-base:after, .header:after, .footer:after {...} (shared)
```

**Exam focus:** `&:extend()` produces **smaller CSS output** by grouping selectors. Mixins produce **larger output** by duplicating rules. The exam may ask which approach is more performant for shared rules.

---

## 5. Knockout.js Bindings and uiComponent

### 5.1 Knockout.js Core Binding Types

All KO bindings use the `data-bind` attribute in `.html` templates:

```html
<!-- TEXT BINDINGS -->
<span data-bind="text: productName"></span>
<span data-bind="html: productDescriptionHtml"></span>

<!-- ATTRIBUTE / CSS BINDINGS -->
<img data-bind="attr: { src: imageUrl, alt: productName }"/>
<div data-bind="css: { 'active': isActive, 'loading': isLoading }"></div>
<div data-bind="style: { color: textColor, fontSize: fontSize }"></div>

<!-- VISIBILITY BINDINGS -->
<div data-bind="visible: isLoggedIn"></div>
<div data-bind="if: hasItems">...</div>
<div data-bind="ifnot: cartIsEmpty">...</div>

<!-- LOOP BINDING -->
<ul data-bind="foreach: cartItems">
    <li>
        <!-- $data = current item, $index = current index -->
        <span data-bind="text: $data.name"></span>
        <span data-bind="text: $index()"></span>
        <!-- $parent = parent context -->
        <button data-bind="click: $parent.removeItem">Remove</button>
    </li>
</ul>

<!-- FORM BINDINGS -->
<input data-bind="value: emailAddress"/>
<input data-bind="textInput: searchQuery"/>   <!-- updates on every keystroke -->
<input type="checkbox" data-bind="checked: isSubscribed"/>
<select data-bind="options: availableCountries,
                   optionsText: 'name',
                   optionsValue: 'code',
                   value: selectedCountry"></select>

<!-- EVENT BINDINGS -->
<button data-bind="click: handleClick"></button>
<button data-bind="event: { mouseover: showTooltip, mouseout: hideTooltip }"></button>

<!-- COMPONENT BINDING -->
<div data-bind="component: {
    name: 'Vendor_Module/js/view/my-component',
    params: { title: 'Hello' }
}"></div>
```

**Exam focus:** `value` updates on **blur** (when the input loses focus). `textInput` updates on **every keystroke**. This distinction is frequently tested. The `html` binding renders **raw HTML** and is an XSS risk if not sanitized.

### 5.2 KO Observables

```javascript
define(['ko'], function (ko) {
    'use strict';

    // OBSERVABLE — single value, notifies on change
    var name = ko.observable('John');
    name('Jane');          // setter
    console.log(name());   // getter — called as function

    // OBSERVABLE ARRAY — array with change notifications
    var items = ko.observableArray(['a', 'b', 'c']);
    items.push('d');
    items.remove('a');
    items()[0];            // access element (no change tracking here)

    // COMPUTED OBSERVABLE — derived value, auto-updates
    var fullName = ko.computed(function () {
        return firstName() + ' ' + lastName();
    });

    // PURE COMPUTED — no side effects, more performant
    var displayName = ko.pureComputed(function () {
        return name().toUpperCase();
    });
});
```

**Exam focus:** An observable **must be called as a function** to get or set its value (`name()` not `name`). Forgetting the `()` is the most common KO bug and appears in exam "what is wrong with this code?" questions. `ko.observableArray` wraps a standard JS array — direct index access (`items()[0]`) does **not** trigger change notifications.

### 5.3 uiComponent Integration

`uiComponent` is the base class for Magento's JS UI components (checkout, product forms, etc.).

```javascript
// app/code/Vendor/Module/view/frontend/web/js/view/my-component.js
define([
    'uiComponent',    // alias for Magento_Ui/js/lib/core/component
    'ko'
], function (Component, ko) {
    'use strict';

    return Component.extend({

        // defaults: declarative property initialization (merged, not overridden)
        defaults: {
            template: 'Vendor_Module/my-component',
            title: 'Default Title',
            isVisible: true,
            items: []
        },

        initialize: function () {
            // ALWAYS call _super() first
            this._super();
            // this.items is auto-converted to ko.observableArray
            // this.isVisible is auto-converted to ko.observable
            this._initObservables();
            return this;
        },

        _initObservables: function () {
            // Manual observable if needed
            this.searchQuery = ko.observable('');
        },

        // Public method callable from template
        toggleVisibility: function () {
            this.isVisible(!this.isVisible());
        }
    });
});
```

```html
<!-- app/code/Vendor/Module/view/frontend/web/template/my-component.html -->
<!-- scope: 'Vendor_Module/js/view/my-component' binds this template to that JS component -->
<div class="my-component" data-bind="scope: 'vendor_module.my_component'">
    <!-- getTemplate() loads the template declared in defaults.template -->
    <!-- ko template: getTemplate() --><!-- /ko -->
</div>
```

**XML layout declaration for uiComponent:**

```xml
<!-- view/frontend/layout/catalog_product_view.xml -->
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <uiComponent name="vendor_module_my_component"/>
        </referenceContainer>
    </body>
</page>
```

```xml
<!-- view/frontend/ui_component/vendor_module_my_component.xml -->
<uiComponent xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Ui:etc/ui_configuration.xsd">
    <argument name="data" xsi:type="array">
        <item name="js_config" xsi:type="array">
            <item name="component" xsi:type="string">Vendor_Module/js/view/my-component</item>
        </item>
    </argument>
</uiComponent>
```

**Exam focus:** `defaults` in a uiComponent are **deep-merged**, not replaced — a child component can declare only the properties it changes. Properties declared in `defaults` are **automatically tracked as observables** by the uiRegistry system. Always call `this._super()` in `initialize()` — omitting it breaks the component initialization chain.

### 5.4 KO Context Variables

When inside a `foreach` binding, these special variables are available:

| Variable | Description |
|----------|-------------|
| `$data` | The current loop item |
| `$index` | Current index (observable — call as `$index()`) |
| `$parent` | The parent binding context |
| `$parents[n]` | n-levels up in the binding tree |
| `$root` | The top-level view model |
| `$component` | The containing uiComponent |

```html
<!-- Example: nested foreach with $parent -->
<tbody data-bind="foreach: orders">
    <tr data-bind="foreach: items">
        <td data-bind="text: name"></td>
        <!-- Access parent order ID from child item context -->
        <td data-bind="text: $parent.orderId"></td>
        <!-- Access root-level method -->
        <button data-bind="click: $root.cancelAll">Cancel All</button>
    </tr>
</tbody>
```

**Exam focus:** `$parent` goes **one level up** in the context. `$root` goes to the **top-level view model** regardless of nesting depth. This distinction appears in exam questions about nested `foreach` bindings.

---

## 6. Second Practice Test Strategy

### 6.1 Pre-Test Checklist

Before starting the timed test:

```
[ ] Review your Week 1 incorrect answers list
[ ] Skim LESS file hierarchy diagram (Section 2.3 above)
[ ] Glance at RequireJS config key table (Section 3.2 above)
[ ] Confirm you know observable getter/setter syntax
[ ] Set timer for 90 minutes (same as real exam)
[ ] No notes during the test — simulate real conditions
```

### 6.2 Per-Section Focus Areas

| Section | Topic | Key Week 2 Contributions |
|---------|-------|--------------------------|
| Section 1 | Theming Fundamentals | LESS compilation modes, file structure |
| Section 2 | CSS/LESS Styling | `_module.less` vs `_extend.less`, UI Library mixins |
| Section 3 | JavaScript | RequireJS keys, JS mixins, KO bindings |
| Section 4 | jQuery Widgets | *(Week 3 topic — flag gaps here)* |
| Section 5 | Page Builder | *(Week 3 topic — flag gaps here)* |
| Section 6 | Admin UI | *(Week 3 topic — flag gaps here)* |

### 6.3 Question Approach Framework

```
READ the question fully
       |
       v
ELIMINATE obviously wrong answers first
       |
       v
APPLY the "Exam Focus" rules from your notes
       |
       v
For file path questions: visualize the directory tree
       |
       v
For code questions: trace execution mentally
       |
       v
FLAG uncertain questions — don't get stuck
       |
       v
REVIEW flagged questions in remaining time
```

---

## 7. Score Tracking and Gap Analysis

### 7.1 Score Comparison Template

Fill this in after completing your second practice test:

```
+---------------------------------------------------------------+
|  SCORE TRACKING                                               |
+---------------------------------------------------------------+
|  Section          | Week 1 Score | Week 2 Score | Delta       |
+---------------------------------------------------------------+
|  1. Theming       |    __ / __   |    __ / __   |   +/-__     |
|  2. CSS/LESS      |    __ / __   |    __ / __   |   +/-__     |
|  3. JavaScript    |    __ / __   |    __ / __   |   +/-__     |
|  4. jQuery        |    __ / __   |    __ / __   |   +/-__     |
|  5. Page Builder  |    __ / __   |    __ / __   |   +/-__     |
|  6. Admin UI      |    __ / __   |    __ / __   |   +/-__     |
+---------------------------------------------------------------+
|  TOTAL            |    __ / __   |    __ / __   |   +/-__     |
+---------------------------------------------------------------+
```

**Expected improvement after Week 2 study:**
- **Sections 1–3:** Should show measurable improvement (these were Week 2 focus areas)
- **Sections 4–6:** May still be weak — that is normal and expected

### 7.2 Incorrect Answer Log Template

For each wrong answer, log:

```
Question #: ___
Section:    ___
My Answer:  ___
Correct:    ___
Concept I missed: ________________________________
Source/Review:    ________________________________
Week 3 priority:  [ ] High  [ ] Medium  [ ] Low
```

### 7.3 Minimum Target Thresholds

| Checkpoint | Target Score | Meaning |
|-----------|-------------|---------|
| Week 1 baseline | 40–50% | No preparation, raw knowledge |
| Week 2 test (today) | 55–65% | LESS + JS concepts absorbed |
| Week 3 test | 70–78% | jQuery + Admin + Page Builder added |
| Pre-exam final | 80%+ | Ready to sit the real exam |

**Exam focus:** The real exam passing score is approximately **64% (around 53/83 questions)**. Track your practice scores against this target — you need a comfortable buffer above 64% before booking.

---

## 8. Week 3 Planning — Sections Needing Attention

### 8.1 Remaining Topics Inventory

Use your incorrect answer log to rank these by priority:

```
+------------------------------------------------------------------+
|  WEEK 3 TOPIC AREAS — PRIORITY RANKING                          |
+------------------------------------------------------------------+
|  Topic                  | Exam Weight | My Confidence  | Action  |
+------------------------------------------------------------------+
|  jQuery Widgets         |  ~15%       |   ___/10       |  ____   |
|  Page Builder           |  ~10%       |   ___/10       |  ____   |
|  Admin UI Components    |  ~12%       |   ___/10       |  ____   |
|  Grunt / Build Tools    |  ~8%        |   ___/10       |  ____   |
|  Layout XML (advanced)  |  ~12%       |   ___/10       |  ____   |
|  UI Components (forms)  |  ~10%       |   ___/10       |  ____   |
+------------------------------------------------------------------+
```

### 8.2 jQuery Widgets Preview (Week 3 Day 1)

Key areas to cover in Week 3:

```javascript
// jQuery Widget Factory — pattern to recognize
$.widget('mage.widgetName', {
    options: {
        defaultOption: 'value'
    },
    _create: function () {
        // Initialization — called once
    },
    _destroy: function () {
        // Cleanup
    },
    publicMethod: function () {
        // Callable externally: $(el).widgetName('publicMethod')
    },
    _privateMethod: function () {
        // Convention: underscore = private
    }
});
```

**Study focus for Week 3:** How Magento extends jQuery widgets, `_super()` in widget context, and the `data-mage-init` attribute.

### 8.3 Grunt Build Tools Preview (Week 3 focus)

```bash
# Commands to know cold:
grunt less                  # Compile LESS -> CSS
grunt watch                 # Watch for LESS changes + auto-compile
grunt clean                 # Remove compiled static files
grunt exec:<theme>          # Deploy specific theme
grunt --help                # List all available tasks
```

**Files to study:**
- `Gruntfile.js` — task definitions
- `dev/tools/grunt/configs/themes.js` — register your theme for Grunt

### 8.4 Page Builder Preview (Week 3 focus)

Page Builder content types to understand:
- Content type registration (`content_type.xml`)
- Preview component (JavaScript)
- Master format (storefront rendering)
- Form component (admin editing UI)

### 8.5 Week 3 Daily Focus Plan

| Day | Topic | Goal |
|-----|-------|------|
| Day 15 | jQuery Widget Factory | Widget lifecycle, `data-mage-init`, `x-magento-init` |
| Day 16 | Grunt + Build Pipeline | Full build workflow, theme registration |
| Day 17 | Layout XML Advanced | `<move>`, `<remove>`, `<referenceBlock>` edge cases |
| Day 18 | Admin UI + Forms | `ui_component` forms, fieldsets, admin grid |
| Day 19 | Page Builder | Content types, preview vs master, storefront |
| Day 20 | Cumulative Review | Focus on Section 4–6 weak areas from today's test |
| Day 21 | Third Practice Test | Aim for 70%+ total score |

---

## Quick-Reference Checklist

### LESS Architecture
- [ ] **Compiled files** have no underscore prefix (e.g., `styles-m.less`) — these are entry points
- [ ] **Partial files** are prefixed with `_` (e.g., `_variables.less`) — never compiled directly
- [ ] In **developer mode**, LESS is compiled client-side by `less.js` in the browser
- [ ] In **production mode**, LESS must be pre-compiled via `setup:static-content:deploy` or Grunt
- [ ] `_module.less` **replaces** existing module CSS entirely
- [ ] `_extend.less` **appends** rules to existing module CSS (non-destructive)
- [ ] The Magento UI Library lives at `lib/web/css/source/` — never edit directly
- [ ] Variable override file: `web/css/source/_variables.less` inside your theme
- [ ] UI Library mixin parameters use `@_` prefix (e.g., `@_background`)
- [ ] `&:extend()` produces smaller CSS output than mixins (shared selectors vs duplicated rules)

### RequireJS Configuration
- [ ] Multiple `requirejs-config.js` files are **merged**, not overridden
- [ ] `paths` — maps a module ID alias to a physical file path
- [ ] `map` with `'*'` — global redirect of one module ID to another
- [ ] `map` with specific ID — redirect applies only when that specific module is the requester
- [ ] `shim` — wraps non-AMD scripts with dependency declarations and exports
- [ ] `deps` — pre-loads modules before page execution (no explicit require needed)
- [ ] `config.mixins` — declares JS mixin targets and their mixin modules
- [ ] `define()` creates a reusable module with a **return value**
- [ ] `require()` executes code; no return value needed
- [ ] `domReady!` (with `!`) is a loader plugin, waits for DOM ready

### JavaScript Mixins
- [ ] Declare mixins under `config: { mixins: { 'target': { 'mixin': true } } }`
- [ ] Mixin module **must return a function** that accepts `target` and **returns modified `target`**
- [ ] Set mixin value to `false` to disable it
- [ ] Mixin wraps the original module — original is still accessible via closure

### Knockout.js
- [ ] `ko.observable()` — single reactive value; called as **function** to get/set
- [ ] `ko.observableArray()` — reactive array; use `.push()`, `.remove()`, etc. for notifications
- [ ] `ko.computed()` — derived value; auto-recalculates when dependencies change
- [ ] `ko.pureComputed()` — same but no side effects; more efficient
- [ ] `value` binding updates on **blur**; `textInput` binding updates on every **keystroke**
- [ ] `html` binding renders **raw HTML** (XSS risk if unsanitized)
- [ ] `foreach` context variables: `$data`, `$index()`, `$parent`, `$parents[n]`, `$root`
- [ ] `$parent` goes **one level up**; `$root` goes to the **top-level view model**

### uiComponent
- [ ] `defaults` properties are **deep-merged** across parent/child components
- [ ] Properties in `defaults` are **automatically converted to observables**
- [ ] Always call `this._super()` first in `initialize()` — omitting it breaks the chain
- [ ] `template` property in `defaults` points to the `.html` Knockout template
- [ ] Declared in layout XML via `<uiComponent name="..."/>` tag
- [ ] `scope` binding in HTML connects the template to its JS component by name

### Exam Score Targets
- [ ] **Today (Week 2 test):** Target 55–65% overall
- [ ] Sections 1–3 should show improvement over Week 1 baseline
- [ ] Sections 4–6 weakness is expected — log wrong answers for Week 3 targeting
- [ ] **Real exam passing threshold:** ~64% (approximately 53/83 questions)
- [ ] **Pre-exam target:** 80%+ on practice tests before booking

### Build Tools (Preview for Week 3)
- [ ] `grunt less` — compile LESS to CSS
- [ ] `grunt watch` — watch for changes and auto-compile
- [ ] `grunt clean` — remove cached/compiled static files
- [ ] Theme must be registered in `dev/tools/grunt/configs/themes.js` for Grunt to process it
- [ ] `bin/magento setup:static-content:deploy` is the production-equivalent of Grunt
