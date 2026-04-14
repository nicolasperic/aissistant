# Day 10 — RequireJS: Configuration & Usage
### Adobe Commerce Frontend Developer Certification Study Notes

---

## Table of Contents

1. [Why This Section Matters](#1-why-this-section-matters)
2. [What is RequireJS? (AMD Module System)](#2-what-is-requirejs-amd-module-system)
3. [How Adobe Commerce Uses RequireJS](#3-how-adobe-commerce-uses-requirejs)
4. [The `requirejs-config.js` File](#4-the-requirejs-configjs-file)
   - [File Locations & Load Order](#file-locations--load-order)
   - [Core Structure](#core-structure)
   - [Merge Behavior](#merge-behavior)
5. [Key Configuration Keys In Depth](#5-key-configuration-keys-in-depth)
   - [`paths`](#paths)
   - [`map`](#map)
   - [`deps`](#deps)
   - [`shim`](#shim)
   - [`config`](#config)
6. [Defining a Module with `define()`](#6-defining-a-module-with-define)
7. [Requiring a Module with `require([])`](#7-requiring-a-module-with-require)
8. [Loading Modules on a Page](#8-loading-modules-on-a-page)
   - [Via Layout XML `<script>` Tag](#via-layout-xml-script-tag)
   - [Via `data-mage-init`](#via-data-mage-init)
   - [Via `text/x-magento-init`](#via-textx-magento-init)
9. [Hands-On: Full Working Example](#9-hands-on-full-working-example)
10. [Common Patterns & Gotchas](#10-common-patterns--gotchas)
11. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Why This Section Matters

JavaScript makes up **36% of the Adobe Commerce Frontend Developer exam** — approximately **18 out of 50 questions**. RequireJS is the **foundation layer** that every other JS topic (UI Components, widgets, `data-mage-init`, mixins, etc.) builds upon.

```
Exam Weight Breakdown (approximate)
+-------------------------------------+--------+
| Topic                               | Weight |
+-------------------------------------+--------+
| JavaScript (entire section 4)       |  36%   |
|   - RequireJS config & usage        | heavy  |
|   - UI Components                   | heavy  |
|   - Widgets & jQuery                | medium |
|   - KnockoutJS basics               | medium |
+-------------------------------------+--------+
| CSS/LESS                            |  ~16%  |
| Layouts, Blocks, Templates          |  ~18%  |
| Other topics                        |  ~30%  |
+-------------------------------------+--------+
```

> As a backend developer, think of RequireJS as **Composer for JavaScript** — it resolves dependencies, loads files in the right order, and gives modules aliases so you reference them by name instead of file path.

---

## 2. What is RequireJS? (AMD Module System)

### The Problem RequireJS Solves

In a traditional PHP application you control load order with `require_once`. In a browser, if you drop 30 `<script>` tags on a page, you have:

- **Race conditions** — script B needs script A, but A hasn't loaded yet
- **Global namespace pollution** — every library dumps variables into `window`
- **No clear dependency declaration** — impossible to know what needs what

### AMD — Asynchronous Module Definition

AMD is a **JavaScript specification** (not a library) that defines:

1. A standard way to **declare** a module and its dependencies
2. A standard way to **load** modules asynchronously (without blocking the page)

```
AMD Module Pattern

  define(['dep1', 'dep2'], function(dep1, dep2) {
      // module body
      return { ... };   // <-- this is what OTHER modules receive
  });
```

RequireJS is the **most widely used AMD loader**. Adobe Commerce ships it as a core dependency.

**Exam focus:**
- AMD = Asynchronous Module Definition
- RequireJS is an **AMD loader** — not AMD itself
- Commerce uses RequireJS because it handles async loading + dependency resolution

### Key Vocabulary

| Term | Meaning |
|---|---|
| **AMD** | The module specification/standard |
| **RequireJS** | The library that implements AMD |
| **Module** | A JS file that uses `define()` to export functionality |
| **Alias / ID** | A short name for a module path (e.g. `jquery` instead of `/pub/static/.../jquery.js`) |
| **Dependency** | A module that must be loaded before the current module runs |

---

## 3. How Adobe Commerce Uses RequireJS

Commerce loads RequireJS via a `<script>` tag in the page head and then merges all `requirejs-config.js` files server-side:

```
Page Load Sequence (simplified)

  Browser loads page HTML
       |
       v
  <script src="requirejs/require.js"> loaded from head
       |
       v
  Commerce merges ALL requirejs-config.js files
  (from Magento core + all modules + active theme)
       |
       v
  RequireJS configuration is applied globally
       |
       v
  Modules declared in layout XML / data-mage-init are loaded
       |
       v
  Your custom JS runs
```

The merged config is available in every page's HTML source. Open DevTools → view source and search for `require.config(` to see the full merged output.

**Exam focus:**
- Commerce **automatically merges** all `requirejs-config.js` files — you never manually include them
- The merge happens server-side during static content deployment (or on-the-fly in developer mode)

---

## 4. The `requirejs-config.js` File

### File Locations & Load Order

The file must be named exactly `requirejs-config.js` and can exist in these locations:

```
Priority (highest wins in case of conflict)
+---+----------------------------------------------------------+
| 1 | Theme (active)                                           |
|   | app/design/frontend/<Vendor>/<theme>/requirejs-config.js |
+---+----------------------------------------------------------+
| 2 | Theme Module Override                                    |
|   | app/design/frontend/<Vendor>/<theme>/<Module_Name>/      |
|   |   requirejs-config.js                                    |
+---+----------------------------------------------------------+
| 3 | Custom Module                                            |
|   | app/code/<Vendor>/<Module>/view/frontend/                |
|   |   requirejs-config.js                                    |
+---+----------------------------------------------------------+
| 4 | Magento Core Module                                      |
|   | vendor/magento/module-*/view/frontend/                   |
|   |   requirejs-config.js                                    |
+---+----------------------------------------------------------+
```

**Exam focus:**
- Theme-level `requirejs-config.js` has **highest priority**
- Module-level `requirejs-config.js` lives at `view/frontend/requirejs-config.js`
- All files are merged — **nothing is overwritten at the file level**, only at the key level

### Core Structure

Every `requirejs-config.js` follows this exact wrapper:

```javascript
var config = {
    // all configuration goes inside this object
};
```

That's it. No `module.exports`, no `define()`, no function wrapper. Just a plain `var config = { ... }` object. Commerce's build system picks it up automatically.

**Exam focus:**
- The variable MUST be named **`config`** — any other name will be ignored
- The file does NOT use `define()` or `require()` itself
- It is a **configuration file**, not a module

### Merge Behavior

When Commerce processes multiple `requirejs-config.js` files, it performs a **deep merge**:

```
File 1 (core module):              File 2 (your theme):
var config = {                     var config = {
    map: {                             map: {
        '*': {                             '*': {
            'jquery': 'jquery/jquery'          'jquery': 'my-jquery'
        }                              }
    }                              }
};                                 };

Result after merge:
var config = {
    map: {
        '*': {
            'jquery': 'my-jquery'   // <-- theme wins (last write wins)
        }
    }
};
```

**Rules:**
- Objects are merged recursively
- Arrays are concatenated
- Scalar values — last one wins (theme > module > core)

---

## 5. Key Configuration Keys In Depth

### `paths`

**Purpose:** Maps a module **alias** (ID) to a file path. The path is relative to the RequireJS `baseUrl` (which Commerce sets to the `pub/static` directory).

```javascript
var config = {
    paths: {
        // alias: 'path/to/file'  (NO .js extension!)
        'my-library': 'Vendor_Module/js/my-library',
        'chartjs':    'Vendor_Module/js/vendor/chart.min'
    }
};
```

**Key rules for `paths`:**
- Path values must **NOT include `.js`** — RequireJS adds it automatically
- Path values are relative to `baseUrl` (the static files root)
- Once registered, any module can `require(['my-library'])` without knowing the file location

**Exam focus:**
- `paths` registers a **new alias** pointing to a file
- No `.js` extension in the path value
- Used for **adding** new modules or **registering third-party libraries**

---

### `map`

**Purpose:** Tells RequireJS "when module X asks for alias Y, give it Z instead." This is the primary mechanism for **overriding/replacing** existing modules.

```javascript
var config = {
    map: {
        // '*' means "apply to ALL modules that request this alias"
        '*': {
            // 'alias-being-requested': 'replacement-module-id'
            'Magento_Checkout/js/view/form/element/email':
                'Vendor_Module/js/view/form/element/email'
        }
    }
};
```

**The `*` wildcard explained:**

```
map: {
    '*': { 'A': 'B' }
}
Means: "Every module that requests A gets B instead"

map: {
    'moduleX': { 'A': 'B' }
}
Means: "Only when moduleX requests A, give it B"
(All other modules still get the real A)
```

**Exam focus:**
- `map` is the correct way to **override/replace** an existing module
- The `'*'` context means the replacement applies **globally** (for all requesting modules)
- `map` does NOT rename a file — it redirects module resolution
- `map` takes **module IDs** (aliases), NOT file paths
- This is different from `paths` — `paths` declares where a file lives, `map` redirects requests

**Comparison: `paths` vs `map`**

| | `paths` | `map` |
|---|---|---|
| Purpose | Register alias -> file location | Redirect alias -> different alias |
| Use case | Add new module | Override existing module |
| Values | File paths (no `.js`) | Module IDs (aliases) |
| Scope | Global | Per-requesting-module or `*` |

---

### `deps`

**Purpose:** An array of module IDs that should be **loaded immediately** when the page loads, before any other code runs. Think of it as "auto-require on page load."

```javascript
var config = {
    deps: [
        'Vendor_Module/js/my-auto-loaded-script',
        'Vendor_Module/js/analytics-init'
    ]
};
```

**When to use `deps`:**
- Polyfills that need to run before anything else
- Global initialization scripts
- Analytics or tracking code that runs on every page

**Exam focus:**
- `deps` modules are loaded **globally on every page** — use sparingly
- They are loaded automatically — no `require()` call needed in templates
- Order within `deps` is not guaranteed (they load asynchronously)

---

### `shim`

**Purpose:** Provides AMD compatibility for **legacy JavaScript libraries** that don't use `define()`. It tells RequireJS "this old library exports a global variable, and it depends on these other libraries."

```javascript
var config = {
    shim: {
        'legacy-slider': {
            // What global variable this library creates on window
            exports: 'LegacySlider',
            // Dependencies that must load before this library
            deps:    ['jquery']
        },
        'old-plugin': {
            exports: 'OldPlugin',
            deps:    ['jquery', 'legacy-slider']
        }
    }
};
```

**Without shim (broken):**
```javascript
// legacy-slider.js (NOT AMD-compatible)
var LegacySlider = function() { /* ... */ };  // pollutes window
// No define() call -- RequireJS doesn't know what it exports
```

**With shim (fixed):**
```javascript
// requirejs-config.js tells RequireJS:
// "After loading legacy-slider.js, grab window.LegacySlider
//  and treat it as this module's export"
shim: {
    'legacy-slider': { exports: 'LegacySlider', deps: ['jquery'] }
}
```

**Exam focus:**
- `shim` is for **non-AMD** (legacy) libraries only
- If a library already uses `define()`, you do NOT need `shim`
- `exports` = the global variable name the library creates
- `deps` inside `shim` ensures load order for non-AMD code

---

### `config`

**Purpose:** Passes **static configuration data** to specific modules. The receiving module reads it using RequireJS's `module.config()` method.

```javascript
// requirejs-config.js — passing config TO a module
var config = {
    config: {
        'Vendor_Module/js/my-component': {
            apiEndpoint: 'https://api.example.com/v1',
            debug:       true,
            maxItems:    10
        }
    }
};
```

```javascript
// my-component.js — reading config FROM requirejs-config.js
define(['module'], function(module) {
    'use strict';

    // module.config() reads the data passed from requirejs-config.js
    var options = module.config();
    // options = { apiEndpoint: '...', debug: true, maxItems: 10 }

    return {
        init: function() {
            console.log('API:', options.apiEndpoint);
        }
    };
});
```

**Exam focus:**
- The `config` key uses the **full module path as the key** (not an alias)
- The module must `require` the special `'module'` dependency to read its config
- This is how Commerce passes PHP-generated data to JS modules (e.g., store URLs, flags)

---

## 6. Defining a Module with `define()`

`define()` is the AMD function for creating a reusable module.

### Syntax

```javascript
define(id?, dependencies?, factory);
//      ^         ^            ^
//   optional  optional     required
//   (string)  (array)    (function or object)
```

In practice, Commerce modules **never hardcode the `id`** — RequireJS infers it from the file path. So you always see:

```javascript
define(dependencies, factory);
// OR
define(factory);  // if no dependencies
```

### Example 1: Simple Module (No Dependencies)

```javascript
// File: app/code/Vendor/Module/view/frontend/web/js/greeting.js

define([], function() {
    'use strict';

    // This is the module's "export" — what other modules receive
    return {
        greet: function(name) {
            return 'Hello, ' + name + '!';
        },
        shout: function(name) {
            return 'HELLO, ' + name.toUpperCase() + '!';
        }
    };
});
```

### Example 2: Module With Dependencies

```javascript
// File: app/code/Vendor/Module/view/frontend/web/js/price-formatter.js

define([
    'jquery',                          // core Commerce alias
    'mage/translate',                  // Commerce i18n helper
    'Vendor_Module/js/greeting'        // our custom module above
], function($, $t, greeting) {
    'use strict';

    // Parameters match the dependency array positions:
    // $ = jquery, $t = mage/translate, greeting = our module

    return {
        format: function(price) {
            var label = $t('Price');
            return label + ': $' + parseFloat(price).toFixed(2);
        },
        greetWithPrice: function(name, price) {
            return greeting.greet(name) + ' Your total: ' + this.format(price);
        }
    };
});
```

### Example 3: Module Returning a Constructor (Class-like Pattern)

```javascript
// File: app/code/Vendor/Module/view/frontend/web/js/my-widget-logic.js

define(['jquery'], function($) {
    'use strict';

    // Constructor function
    function MyWidgetLogic(element, options) {
        this.element = $(element);
        this.options = $.extend({
            color: 'blue',
            size:  'medium'
        }, options);

        this._init();
    }

    MyWidgetLogic.prototype._init = function() {
        this.element.css('color', this.options.color);
    };

    MyWidgetLogic.prototype.destroy = function() {
        this.element.css('color', '');
    };

    // Export the constructor
    return MyWidgetLogic;
});
```

**Exam focus:**
- The `factory` function's **return value** is what other modules receive as the dependency
- Dependencies in the array must **match** the factory function parameters **by position**
- `'use strict'` is a Commerce coding standard requirement — always include it
- Never hardcode the module `id` as the first string argument — let RequireJS infer it

---

## 7. Requiring a Module with `require()`

`require()` is for **consuming** a module when you don't need to export anything — typically used at the "end of the chain."

### Syntax

```javascript
require(['dep1', 'dep2'], function(dep1, dep2) {
    // Code runs after dep1 and dep2 are loaded
    // Nothing is returned — this is a "consumer", not a "producer"
});
```

### `define()` vs `require()` — The Key Difference

```
define()                           require()
+---------------------------+      +---------------------------+
| Creates a REUSABLE module |      | CONSUMES modules          |
| Returns a value (export)  |      | Returns nothing useful    |
| Lazy-loaded when needed   |      | Executes immediately      |
| Used in .js module files  |      | Used in inline scripts or |
+---------------------------+      | at the "edge" of your app |
                                   +---------------------------+
```

**Exam focus:**
- `define()` = create/export a module (used in `.js` files)
- `require()` = use/consume modules (used in inline scripts, entry points)
- Both take the same `[dependencies], callback` signature
- You CAN nest `require()` inside `define()` for conditional/lazy loading

### Practical `require()` Examples

```javascript
// Inline script in a .phtml template (consume-only, no export needed)
require(['jquery', 'Vendor_Module/js/greeting'], function($, greeting) {
    'use strict';

    $(document).ready(function() {
        console.log(greeting.greet('World'));
    });
});
```

```javascript
// Lazy/conditional loading inside a define()
define(['jquery'], function($) {
    'use strict';

    return {
        loadChart: function() {
            // Only load heavy library when actually needed
            require(['chartjs'], function(Chart) {
                new Chart(document.getElementById('myChart'), { /* ... */ });
            });
        }
    };
});
```

---

## 8. Loading Modules on a Page

Commerce provides three ways to load and initialize JS modules. Each has distinct use cases.

### Via Layout XML `<script>` Tag

The correct way to load a JS file via Layout XML is using the `<head>` section with a `<script>` tag:

```xml
<!-- app/code/Vendor/Module/view/frontend/layout/cms_index_index.xml -->
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <head>
        <!-- Add a JS file to the page head -->
        <script src="Vendor_Module/js/my-init-script.js"/>
    </head>
</page>
```

```xml
<!-- Add to all pages via default.xml -->
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <head>
        <script src="Vendor_Module/js/my-global-script.js"/>
    </head>
    <body>
        <referenceContainer name="before.body.end">
            <block class="Magento\Framework\View\Element\Template"
                   name="vendor.module.custom.script"
                   template="Vendor_Module::custom-script.phtml"/>
        </referenceContainer>
    </body>
</page>
```

**Exam focus:** `<head><script src="..."/></head>` is the correct Layout XML syntax to add a JS file. The `src` value is a module path relative to `web/` (e.g. `Vendor_Module/js/file.js`).

---

### Via `data-mage-init`

The most common Commerce pattern. Initializes a **jQuery widget or JS component** on a specific **DOM element**.

```html
<!-- In a .phtml template -->

<!-- Basic syntax -->
<div data-mage-init='{"aliasOrPath": {}}'>
    <!-- Widget is initialized on THIS element -->
</div>

<!-- With options -->
<div id="my-accordion"
     data-mage-init='{"Vendor_Module/js/accordion": {"active": 0, "collapsible": true}}'>
    <div class="section">...</div>
</div>
```

```html
<!-- Real Commerce example: tooltip widget -->
<span data-mage-init='{"tooltip": {"trigger": "#tooltip-label", "position": "top"}}'>
    Hover me
</span>
```

**How `data-mage-init` works internally:**

```
Commerce scans DOM on page load
    |
    v
Finds elements with data-mage-init attribute
    |
    v
Parses the JSON value to get { 'componentAlias': optionsObject }
    |
    v
require(['componentAlias'], function(Component) {
    // For jQuery widgets:
    $(element).componentAlias(optionsObject);
    // For plain components:
    new Component(optionsObject, element);
})
```

**Exam focus:**
- `data-mage-init` value is **valid JSON** — use double quotes inside, single quotes on the attribute
- The component is initialized **on that specific DOM element**
- Multiple components can be initialized on the same element:
  ```html
  <div data-mage-init='{"tooltip": {}, "Vendor_Module/js/tracker": {"event": "view"}}'>
  ```

---

### Via `text/x-magento-init`

Used when you need to initialize a component **without tying it to a specific DOM element**, or when you want to target an element by CSS selector.

```html
<!-- In a .phtml template -->
<script type="text/x-magento-init">
{
    "#my-element": {
        "Vendor_Module/js/my-component": {
            "option1": "value1",
            "option2": true
        }
    }
}
</script>
```

```html
<!-- Target ALL elements matching selector -->
<script type="text/x-magento-init">
{
    ".product-item": {
        "Vendor_Module/js/product-tracker": {
            "endpoint": "/track"
        }
    }
}
</script>
```

```html
<!-- No DOM element (use "*" as selector) -->
<script type="text/x-magento-init">
{
    "*": {
        "Vendor_Module/js/global-init": {
            "storeCode": "default"
        }
    }
}
</script>
```

**Comparison: `data-mage-init` vs `text/x-magento-init`**

| Feature | `data-mage-init` | `text/x-magento-init` |
|---|---|---|
| Tied to DOM element | Yes (the element itself) | Via CSS selector or `*` |
| Location | HTML attribute | `<script>` tag |
| Valid JSON required | Yes | Yes |
| Multiple components | Yes | Yes |
| No DOM target | No | Yes (use `"*"`) |
| Works in `.phtml` | Yes | Yes |

---

## 9. Hands-On: Full Working Example

Let's build a complete working feature: a "Back to Top" button that smoothly scrolls the page up when clicked.

### Step 1: Create the JS Module

```javascript
// File: app/code/Vendor/Learning/view/frontend/web/js/back-to-top.js

define([
    'jquery',
    'domReady!'        // Special RequireJS plugin: waits for DOM ready
], function($) {
    'use strict';

    /**
     * BackToTop component
     * Initializes a button that scrolls the page to the top when clicked.
     *
     * @param {Object} config - Configuration options
     * @param {HTMLElement} element - The DOM element to attach to
     */
    return function(config, element) {
        var $button    = $(element);
        var $window    = $(window);
        var threshold  = config.threshold || 300;  // px from top before showing

        // Show/hide button based on scroll position
        $window.on('scroll', function() {
            if ($window.scrollTop() > threshold) {
                $button.fadeIn(300);
            } else {
                $button.fadeOut(300);
            }
        });

        // Scroll to top on click
        $button.on('click', function(e) {
            e.preventDefault();
            $('html, body').animate({ scrollTop: 0 }, 600);
        });

        // Initially hidden
        $button.hide();

        console.log('[BackToTop] Initialized with threshold:', threshold);
    };
});
```

### Step 2: Register the Module in `requirejs-config.js`

```javascript
// File: app/code/Vendor/Learning/view/frontend/requirejs-config.js

var config = {
    paths: {
        // Register a short alias for our module
        'backToTop': 'Vendor_Learning/js/back-to-top'
    }
};
```

### Step 3: Create the Template

```html
<!-- File: app/code/Vendor/Learning/view/frontend/templates/back-to-top.phtml -->

<button id="back-to-top-btn"
        title="<?= $block->escapeHtml(__('Back to Top')) ?>"
        data-mage-init='{"backToTop": {"threshold": 400}}'>
    <?= $block->escapeHtml(__('^ Top')) ?>
</button>

<style>
    /* Inline styles for demo — in production use LESS files */
    #back-to-top-btn {
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 999;
        padding: 10px 15px;
        background: #007bdb;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: none; /* JS will control visibility */
    }
</style>
```

### Step 4: Add the Block via Layout XML

```xml
<!-- File: app/code/Vendor/Learning/view/frontend/layout/default.xml -->
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="before.body.end">
            <block class="Magento\Framework\View\Element\Template"
                   name="vendor.learning.back.to.top"
                   template="Vendor_Learning::back-to-top.phtml"/>
        </referenceContainer>
    </body>
</page>
```

### Step 5: Register the Module (module.xml + registration.php)

```xml
<!-- File: app/code/Vendor/Learning/etc/module.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="Vendor_Learning"/>
</config>
```

> **Note:** `setup_version` attribute is **not used in Magento 2.4.x** — it was deprecated when declarative schema replaced `InstallSchema`/`UpgradeSchema`. Do not add it.

```php
<?php
// File: app/code/Vendor/Learning/registration.php

use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::MODULE,
    'Vendor_Learning',
    __DIR__
);
```

### Step 6: Enable and Deploy

```bash
# Enable the module
php bin/magento module:enable Vendor_Learning

# Run setup upgrade
php bin/magento setup:upgrade

# Deploy static content (production mode)
php bin/magento setup:static-content:deploy -f

# If in developer mode, just clear cache
php bin/magento cache:clean
php bin/magento cache:flush
```

### Alternative: Load Using `text/x-magento-init`

```html
<!-- Alternative to data-mage-init when you want to separate JS from HTML -->
<button id="back-to-top-btn">^ Top</button>

<script type="text/x-magento-init">
{
    "#back-to-top-btn": {
        "backToTop": {
            "threshold": 400
        }
    }
}
</script>
```

---

## 10. Common Patterns & Gotchas

### Gotcha 1: The `.js` Extension

```javascript
// WRONG — RequireJS will look for 'my-module.js.js'
paths: { 'my-module': 'Vendor_Module/js/my-module.js' }

// CORRECT
paths: { 'my-module': 'Vendor_Module/js/my-module' }
```

### Gotcha 2: `map` vs `paths` Confusion

```javascript
// WRONG use of map (paths don't belong here)
map: {
    '*': {
        'my-module': 'Vendor_Module/js/my-module'  // This is a PATH
    }
}

// CORRECT — paths registers file location
paths: {
    'my-module': 'Vendor_Module/js/my-module'
}

// CORRECT — map redirects one alias to another already-registered alias
map: {
    '*': {
        'old-module-alias': 'new-module-alias'
    }
}
```

### Gotcha 3: JSON Must Be Valid in `data-mage-init`

```html
<!-- WRONG — single quotes inside JSON -->
<div data-mage-init="{'tooltip': {'content': 'Hello'}}">

<!-- CORRECT — double quotes inside JSON, single quotes on attribute -->
<div data-mage-init='{"tooltip": {"content": "Hello"}}'>

<!-- ALSO CORRECT — HTML entities for double quotes -->
<div data-mage-init="{&quot;tooltip&quot;: {}}">
```

### Gotcha 4: `domReady!` Plugin

```javascript
// Without domReady! — element may not exist yet when module runs
define(['jquery'], function($) {
    $('#my-element').hide();  // MIGHT FAIL if DOM not ready
});

// With domReady! — guaranteed DOM is ready
define(['jquery', 'domReady!'], function($) {
    $('#my-element').hide();  // Safe
});

// Note the exclamation mark — it's part of the plugin syntax
```

**Exam focus:**
- `domReady!` (with `!`) is a RequireJS plugin — the `!` triggers the plugin
- Without `!`, it would just be the `domReady` module itself

### Gotcha 5: Overriding a Core Module

```javascript
// WRONG — using paths to override (creates a second alias, doesn't replace)
paths: {
    'Magento_Checkout/js/view/shipping': 'Vendor_Module/js/view/shipping'
}

// CORRECT — using map to redirect all requests to the new module
map: {
    '*': {
        'Magento_Checkout/js/view/shipping': 'Vendor_Module/js/view/shipping'
    }
}
```

### Pattern: Mixin (Advanced — Preview)

While mixins are a Day 11+ topic, here's how they relate to `requirejs-config.js`:

```javascript
// requirejs-config.js
var config = {
    config: {
        mixins: {
            'Magento_Catalog/js/price-box': {
                'Vendor_Module/js/price-box-mixin': true
            }
        }
    }
};
```

**Exam focus:** Mixins use the **`config`** key with a special `mixins` sub-key — they do NOT use `map`.

### Common Module Aliases You Must Know

```javascript
// These aliases are pre-registered by Commerce core — no paths needed
'jquery'         // jQuery library (self-registered by lib/web/jquery.js)
'underscore'     // Underscore.js (self-registered — uses define('underscore', ...))
'ko'             // KnockoutJS (mapped to knockoutjs/knockout)
'knockout'       // Same as ko — alias for KnockoutJS
'mage/translate' // Commerce i18n ($t function) — referenced by path
'domReady'       // DOM ready plugin (mapped to requirejs/domReady)
'uiComponent'    // Maps to Magento_Ui/js/lib/core/collection
'uiElement'      // Maps to Magento_Ui/js/lib/core/element/element
'uiCollection'   // Maps to Magento_Ui/js/lib/core/collection (same as uiComponent)
'mageUtils'      // Maps to mage/utils/main
```

---

## Quick-Reference Checklist

### RequireJS Fundamentals
- [ ] AMD = Asynchronous Module Definition (specification, not a library)
- [ ] RequireJS is an **AMD loader** — Commerce uses it for all JS dependencies
- [ ] Think of RequireJS as "Composer for JavaScript"

### `requirejs-config.js` File
- [ ] Variable name MUST be `var config = { ... }` — no other name works
- [ ] Located at: `view/frontend/requirejs-config.js` (module) or `<theme-root>/requirejs-config.js` (theme)
- [ ] Theme level has **highest priority** in merge order
- [ ] All files are **deep merged** — never manually included
- [ ] The file itself does NOT use `define()` or `require()`

### The Five Config Keys
- [ ] **`paths`** — Maps alias -> file path (no `.js` extension); used to ADD new modules
- [ ] **`map`** — Redirects alias -> different alias; used to OVERRIDE existing modules; `'*'` = apply to all modules
- [ ] **`deps`** — Array of modules to auto-load on every page; use sparingly
- [ ] **`shim`** — AMD compatibility for non-AMD (legacy) libraries; uses `exports` and `deps` sub-keys
- [ ] **`config`** — Passes static data to specific modules; module reads it with `module.config()`

### `paths` vs `map`
- [ ] `paths`: registers WHERE a file is -> use for new/third-party modules
- [ ] `map`: redirects WHICH module is served -> use for overriding existing modules
- [ ] `map` values are module IDs (aliases), NOT file paths
- [ ] `paths` values are file paths (no `.js`), NOT module IDs

### `define()` vs `require()`
- [ ] `define([deps], factory)` — creates a reusable module, exports a value via `return`
- [ ] `require([deps], callback)` — consumes modules, no meaningful return value
- [ ] Both take `(array, function)` signature
- [ ] Parameters in factory function match dependency array **by position**
- [ ] Never hardcode the module ID as the first `define()` argument
- [ ] Always include `'use strict'`

### Loading Modules on Pages
- [ ] **`<head><script src="..."/></head>`** in Layout XML — adds JS file to page head
- [ ] **`data-mage-init`** — HTML attribute; initializes component on that specific DOM element; value is JSON
- [ ] **`text/x-magento-init`** — `<script>` tag; targets element by CSS selector; use `"*"` for no DOM element
- [ ] `data-mage-init` JSON: double quotes inside, single quotes on the attribute

### Critical Gotchas
- [ ] NO `.js` extension in `paths` values
- [ ] To override a core module: use `map`, NOT `paths`
- [ ] `domReady!` (with `!`) is a plugin — guarantees DOM is ready
- [ ] `data-mage-init` value must be **valid JSON** (double-quoted keys and strings)
- [ ] Mixins use `config: { mixins: { ... } }` — NOT `map`
- [ ] `deps` loads modules on **every page** — be careful with performance
- [ ] `setup_version` is deprecated in Magento 2.4.x — do not use in `module.xml`

### Know These Core Aliases
- [ ] `jquery` — jQuery (self-registers as AMD module)
- [ ] `underscore` — Underscore.js (self-registers as AMD module)
- [ ] `ko` / `knockout` — KnockoutJS
- [ ] `mage/translate` — i18n `$t()` function
- [ ] `domReady` — DOM ready RequireJS plugin (path: `requirejs/domReady`)
- [ ] `uiComponent` — maps to `Magento_Ui/js/lib/core/collection`
- [ ] `uiElement` — maps to `Magento_Ui/js/lib/core/element/element`

### Deployment Commands
- [ ] `php bin/magento setup:upgrade` — after enabling a new module
- [ ] `php bin/magento setup:static-content:deploy -f` — deploy JS in production mode
- [ ] `php bin/magento cache:clean` — required after any JS/layout change in dev mode
