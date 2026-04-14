# Day 11 — JavaScript Mixins (All Types)

## Adobe Commerce Developer Professional Exam — Study Notes

---

## Table of Contents

1. [What Is a JavaScript Mixin in Commerce?](#1-what-is-a-javascript-mixin-in-commerce)
2. [Mixins vs. Path Overrides — The Critical Distinction](#2-mixins-vs-path-overrides--the-critical-distinction)
3. [How RequireJS Works (Backend Dev Primer)](#3-how-requirejs-works-backend-dev-primer)
4. [Component Mixins — The `config.mixins` Approach](#4-component-mixins--the-configmixins-approach)
5. [Widget Mixins — Extending jQuery Widgets](#5-widget-mixins--extending-jquery-widgets)
6. [Multiple Mixins Stacking on the Same Component](#6-multiple-mixins-stacking-on-the-same-component)
7. [Using `this._super()` to Call Parent Methods](#7-using-this_super-to-call-parent-methods)
8. [Hands-On: Mixin for `price-box` Component](#8-hands-on-mixin-for-price-box-component)
9. [Verifying Your Mixin Executes](#9-verifying-your-mixin-executes)
10. [Common Mistakes and Gotchas](#10-common-mistakes-and-gotchas)
11. [Mental Models and Analogies for Backend Devs](#11-mental-models-and-analogies-for-backend-devs)
12. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. What Is a JavaScript Mixin in Commerce?

### The Plain-English Definition

A **JavaScript mixin** in Adobe Commerce/Magento 2 is a mechanism that lets you **add to or modify the behaviour of an existing JavaScript component or widget without replacing the original file**.

Think of it like a PHP plugin (interceptor) but for JavaScript. The original file stays untouched; your mixin code *wraps around* or *extends* it.

> **Exam focus:** A mixin **extends** (wraps) the target component. It does **not** replace it. The original component's code still runs. This is the single most important concept for exam questions.

### The Problem Mixins Solve

Without mixins, your only option would be to copy the entire original JS file into your module and change the `requirejs-config.js` path to point to your copy. That is called a **path override** and has serious drawbacks (you lose upstream updates, you own the entire file).

Mixins solve this by letting multiple modules each contribute small, focused changes to the same component — all of them active at once.

### Where Mixins Live in the Codebase

```
app/code/Vendor/Module/
  view/
    frontend/
      requirejs-config.js          <-- registers the mixin
      web/
        js/
          mixins/
            my-component-mixin.js  <-- the mixin file itself
```

> **Exam focus:** The `requirejs-config.js` file must be at `view/frontend/requirejs-config.js` (or `view/adminhtml/` for admin). The mixin JS file lives under `view/frontend/web/js/`.

---

## 2. Mixins vs. Path Overrides — The Critical Distinction

This is **heavily tested**. Memorise this table.

| Feature | Mixin (`config.mixins`) | Path Override (`config.paths` or `config.map`) |
|---|---|---|
| Original file runs? | **Yes** — original still executes | **No** — original is replaced entirely |
| Multiple modules can apply? | **Yes** — they stack | **No** — last one wins (conflict) |
| Original code maintained? | Yes, only your delta changes | No, you own the whole file |
| Risk of upgrade breakage? | Low | High |
| Use case | Add/modify specific methods | Completely replace a component |
| Key in `requirejs-config.js` | `config.mixins` | `config.paths` or `config.map` |

### Path Override Example (What You Are NOT Doing)

```javascript
// requirejs-config.js — PATH OVERRIDE (replaces the whole file)
var config = {
    map: {
        '*': {
            'Magento_Catalog/js/price-box': 'Vendor_Module/js/price-box'
        }
    }
};
```

This **replaces** the original. If another module also overrides it, only one survives.

### Mixin Example (What You ARE Doing)

```javascript
// requirejs-config.js — MIXIN (wraps, does not replace)
var config = {
    config: {
        mixins: {
            'Magento_Catalog/js/price-box': {
                'Vendor_Module/js/mixins/price-box-mixin': true
            }
        }
    }
};
```

Both the original AND your mixin run. Another vendor's mixin also runs. They stack.

> **Exam focus:** `config.mixins` is nested inside the outer `config` key. The structure is `config.config.mixins`. This double-nesting trips up many candidates.

---

## 3. How RequireJS Works (Backend Dev Primer)

Since you are primarily a backend developer, here is the minimum RequireJS knowledge needed for exam questions.

### RequireJS in One Paragraph

RequireJS is a JavaScript module loader. Instead of `<script>` tags everywhere, modules declare their dependencies and RequireJS loads them on demand. In Commerce, almost all JavaScript uses RequireJS modules.

### The AMD Module Pattern

```javascript
// AMD = Asynchronous Module Definition
define([
    'jquery',               // dependency 1
    'uiComponent'           // dependency 2
], function ($, Component) {
    // $ is jQuery, Component is the uiComponent constructor
    'use strict';

    return Component.extend({
        // your code here
    });
});
```

**Anatomy:**
- `define([...], function(...) {...})` — declares a module
- The array lists **dependencies** (other module names)
- The function receives those dependencies as arguments
- `return` exports what this module provides

### The `requirejs-config.js` File

This is Commerce's configuration file for RequireJS. It must export a `var config = {...}` object.

```javascript
var config = {
    // 'paths' — alias a module name to a file path
    paths: {},

    // 'map' — redirect one module name to another
    map: {},

    // 'config' — pass configuration data TO modules
    config: {
        mixins: {}   // <-- this is where mixins are registered
    },

    // 'deps' — load these modules on every page
    deps: [],

    // 'shim' — configure non-AMD scripts
    shim: {}
};
```

> **Exam focus:** Know the difference between the outer `config` variable (always named `config`) and the inner `config` key inside it. The mixin registration path is `config.config.mixins`.

---

## 4. Component Mixins — The `config.mixins` Approach

This is the **primary mixin type** for Commerce JS components (UI Components, plain AMD modules, etc.).

### Step 1 — Register in `requirejs-config.js`

```javascript
// app/code/Vendor/Module/view/frontend/requirejs-config.js

var config = {
    config: {
        mixins: {
            // KEY: the module you are targeting (full RequireJS module ID)
            'Magento_Catalog/js/price-box': {
                // VALUE: object of {mixin-module-path: enabled}
                'Vendor_Module/js/mixins/price-box-mixin': true
            }
        }
    }
};
```

**Key points:**
- The target module key uses the **RequireJS module ID** (not a file path, no `.js` extension)
- The mixin value is an object where keys are mixin module IDs and values are `true`/`false`
- Setting the value to `false` disables a mixin (useful for disabling third-party mixins)

> **Exam focus:** Module IDs follow the pattern `Vendor_Module/js/filename` where `Vendor_Module` maps to `view/frontend/web/js/`. There is no `web/js/` in the module ID — that part is implicit.

### Step 2 — Write the Mixin File

The mixin function signature is the most-tested piece of syntax:

```javascript
// app/code/Vendor/Module/view/frontend/web/js/mixins/price-box-mixin.js

define([], function () {
    'use strict';

    // The mixin is a FUNCTION that receives the target component
    // and returns a MODIFIED version of it.
    return function (TargetComponent) {

        // .extend() creates a new "class" based on TargetComponent
        return TargetComponent.extend({

            // Override an existing method
            reloadPrice: function () {
                console.log('Mixin: reloadPrice called!');

                // Call the original method on the parent
                this._super();
            },

            // Add a brand-new method
            myNewMethod: function () {
                console.log('Mixin: this is a new method');
            }

        });
    };
});
```

**Critical anatomy of a mixin:**
```
define(dependencies, function() {
    return function(TargetComponent) {    // <-- receives the original
        return TargetComponent.extend({  // <-- returns the extended version
            // method overrides and additions
        });
    };
});
```

> **Exam focus:** A mixin **must** return a function. That function receives one argument (the original component) and must return the extended component. If it returns nothing, or returns the original unchanged, the mixin does nothing.

### How Commerce Applies the Mixin Internally

When Commerce loads `Magento_Catalog/js/price-box`, the mixin system intercepts the module resolution:

```
[RequireJS loads price-box]
        |
        v
[Mixin system checks config.mixins for 'Magento_Catalog/js/price-box']
        |
        v
[Finds: Vendor_Module/js/mixins/price-box-mixin: true]
        |
        v
[Calls mixin function with original price-box as argument]
        |
        v
[Replaces the module with TargetComponent.extend({...}) result]
        |
        v
[Consumer code gets the extended version]
```

---

## 5. Widget Mixins — Extending jQuery Widgets

### What Is a jQuery Widget?

jQuery UI widgets are UI components built using `$.widget()`. In Commerce, things like the `accordion`, `collapsible`, `tabs`, and `modal` are jQuery widgets.

They look like this internally:

```javascript
// Example: how a jQuery widget is defined (simplified)
$.widget('mage.priceBox', {
    options: {
        priceConfig: null
    },
    _create: function () {
        // initialisation logic
    },
    reloadPrice: function () {
        // price update logic
    }
});
```

### Approach 1 — Widget Mixin via `$.widget` Prototype Extension

For jQuery widgets, you extend via `$.widget` directly, NOT via `TargetComponent.extend()`.

```javascript
// app/code/Vendor/Module/view/frontend/web/js/mixins/widget-mixin.js

define(['jquery'], function ($) {
    'use strict';

    return function () {
        // Extend the existing widget prototype DIRECTLY
        // Syntax: $.widget('widgetNamespace.widgetName', { overrides })
        $.widget('mage.priceBox', $.mage.priceBox, {

            // Override a method
            reloadPrice: function () {
                console.log('Widget mixin: before reloadPrice');

                // Call original widget method
                this._super();

                console.log('Widget mixin: after reloadPrice');
            }

        });
    };
});
```

**Differences from component mixins:**

| Aspect | Component Mixin | Widget Mixin |
|---|---|---|
| Function signature | `function(TargetComponent)` receives arg | `function()` receives NO argument |
| Extension method | `TargetComponent.extend({...})` | `$.widget('ns.name', $.ns.name, {...})` |
| Targeting | Via the returned extended class | By referencing `$.mage.widgetName` directly |
| Return value | Must return extended component | Must call `$.widget(...)` then return `true`/nothing |

> **Exam focus:** Widget mixin functions take **no arguments**. Component mixin functions take **one argument** (the target). This is a common exam trap.

### Approach 2 — Widget Mixin via `requirejs-config.js` (Hybrid)

You can also register a widget mixin in `requirejs-config.js` exactly like a component mixin:

```javascript
// requirejs-config.js
var config = {
    config: {
        mixins: {
            'Magento_Catalog/js/price-box': {
                'Vendor_Module/js/mixins/price-box-widget-mixin': true
            }
        }
    }
};
```

But the mixin file itself uses the `$.widget` approach:

```javascript
// price-box-widget-mixin.js
define(['jquery'], function ($) {
    'use strict';

    return function (targetWidget) {
        // targetWidget here is the price-box module
        // but we override via $.widget directly
        $.widget('mage.priceBox', $.mage.priceBox, {
            reloadPrice: function () {
                this._super();
                console.log('Extended!');
            }
        });

        return targetWidget;
    };
});
```

---

## 6. Multiple Mixins Stacking on the Same Component

One of Commerce's key advantages: multiple mixins can all target the same component and they all run.

### Registration — Multiple Mixins on One Component

```javascript
// Module A — requirejs-config.js
var config = {
    config: {
        mixins: {
            'Magento_Catalog/js/price-box': {
                'VendorA_Module/js/mixins/price-box-mixin-a': true
            }
        }
    }
};
```

```javascript
// Module B — requirejs-config.js (different module, same target)
var config = {
    config: {
        mixins: {
            'Magento_Catalog/js/price-box': {
                'VendorB_Module/js/mixins/price-box-mixin-b': true
            }
        }
    }
};
```

Commerce merges these configurations. Both mixins apply.

### How Stacking Works (Chain of Extends)

```
Original price-box
      |
      | price-box-mixin-a applies
      v
Extended-by-A price-box
      |
      | price-box-mixin-b applies
      v
Extended-by-A-and-B price-box   <-- what consumers receive
```

Each mixin receives the already-extended version from the previous mixin as its `TargetComponent`. This is a **chain**.

```javascript
// Mixin A
return function (TargetComponent) {
    return TargetComponent.extend({
        reloadPrice: function () {
            console.log('Mixin A: before');
            this._super();   // calls ORIGINAL reloadPrice
            console.log('Mixin A: after');
        }
    });
};

// Mixin B (receives the A-extended version as TargetComponent)
return function (TargetComponent) {
    return TargetComponent.extend({
        reloadPrice: function () {
            console.log('Mixin B: before');
            this._super();   // calls MIXIN A's reloadPrice (not original!)
            console.log('Mixin B: after');
        }
    });
};

// Execution order output:
// "Mixin B: before"
// "Mixin A: before"
// [original reloadPrice]
// "Mixin A: after"
// "Mixin B: after"
```

> **Exam focus:** The **order** of mixin application is determined by module load order (which depends on module sequence in `etc/module.xml`). However, for most exam questions, the key point is simply that all mixins run — not which runs first.

### Disabling a Mixin

To disable a mixin (e.g., a third-party mixin causing issues):

```javascript
var config = {
    config: {
        mixins: {
            'Magento_Catalog/js/price-box': {
                'ThirdParty_Module/js/mixins/price-box-mixin': false  // disabled!
            }
        }
    }
};
```

> **Exam focus:** Setting a mixin value to `false` disables it. This is how you turn off third-party mixins without modifying their code.

---

## 7. Using `this._super()` to Call Parent Methods

### What Is `this._super()`?

In Magento's UI Component system (built on `mage/utils/wrapper` and `underscore`), `this._super()` is the mechanism to call the method on the **parent class** — the version of the method you are overriding.

This is analogous to:
- PHP: `parent::methodName()`
- Java: `super.methodName()`

### Usage in a Component Mixin

```javascript
define([], function () {
    'use strict';

    return function (TargetComponent) {
        return TargetComponent.extend({

            // Example: add logging around an existing method
            initialize: function () {
                console.log('Mixin: initialize START');

                // MUST call this._super() to run the parent's initialize
                // Without this, the original initialize never runs!
                this._super();

                console.log('Mixin: initialize END');
            },

            // Example: modify arguments before passing to parent
            updatePrice: function (prices) {
                // Do something with prices first
                prices.modified = true;

                // Pass (possibly modified) args to parent
                this._super(prices);
            },

            // Example: use parent's return value
            getPrice: function () {
                var originalPrice = this._super();
                return originalPrice * 1.1;  // add 10%
            }

        });
    };
});
```

### What Happens If You Omit `this._super()`?

```javascript
// DANGEROUS — parent method never runs
reloadPrice: function () {
    console.log('My logic only');
    // No this._super() — the original reloadPrice is SKIPPED
}
```

If the original method had critical logic (event binding, state setting, etc.), omitting `this._super()` breaks it. You are effectively replacing rather than extending.

> **Exam focus:** Always call `this._super()` in a mixin unless you **intentionally** want to prevent the original method from executing. Forgetting it is the most common mixin bug.

### `this._super()` in jQuery Widgets

jQuery UI widgets also support `this._super()` with identical semantics:

```javascript
$.widget('mage.priceBox', $.mage.priceBox, {
    reloadPrice: function () {
        // Call the original widget's reloadPrice
        this._super();
        console.log('Widget extended!');
    }
});
```

---

## 8. Hands-On: Mixin for `price-box` Component

Let us build a complete, working mixin from scratch. We will extend `Magento_Catalog/js/price-box`.

### Module Structure

```
app/code/Vendor/PriceMixin/
  registration.php
  etc/
    module.xml
  view/
    frontend/
      requirejs-config.js
      web/
        js/
          mixins/
            price-box-mixin.js
```

### File 1 — `registration.php`

```php
<?php
use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::MODULE,
    'Vendor_PriceMixin',
    __DIR__
);
```

### File 2 — `etc/module.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="Vendor_PriceMixin" setup_version="1.0.0"/>
</config>
```

### File 3 — `view/frontend/requirejs-config.js`

```javascript
/**
 * RequireJS configuration for Vendor_PriceMixin module
 * Registers a mixin for Magento_Catalog/js/price-box
 */
var config = {
    config: {
        mixins: {
            'Magento_Catalog/js/price-box': {
                'Vendor_PriceMixin/js/mixins/price-box-mixin': true
            }
        }
    }
};
```

### File 4 — `view/frontend/web/js/mixins/price-box-mixin.js`

```javascript
/**
 * Mixin for Magento_Catalog/js/price-box
 *
 * Demonstrates:
 * 1. Correct mixin function signature
 * 2. Method extension using this._super()
 * 3. Adding a new method
 */
define([
    'jquery'
], function ($) {
    'use strict';

    // The mixin: a function that receives the target component
    // and returns an extended version of it.
    return function (priceBox) {

        return priceBox.extend({

            /**
             * Override the reloadPrice method.
             * Always call this._super() to preserve original behaviour.
             */
            reloadPrice: function () {
                // Custom logic BEFORE the original method
                console.log('[PriceMixin] reloadPrice triggered');
                console.log('[PriceMixin] Element:', this.element);

                // Call the original reloadPrice
                this._super();

                // Custom logic AFTER the original method
                console.log('[PriceMixin] reloadPrice complete');
            },

            /**
             * Override initialize to add setup logic.
             * initialize() runs when the component first loads.
             */
            initialize: function () {
                // Run original initialize first
                this._super();

                // Then add our custom initialisation
                console.log('[PriceMixin] Price box initialised with config:', this.options);

                return this;
            },

            /**
             * Brand-new method — does not exist in original.
             */
            getFormattedPrice: function (price) {
                return '$' + parseFloat(price).toFixed(2);
            }

        });
    };
});
```

### File 5 — Enable the Module

```bash
# From Magento root directory
bin/magento module:enable Vendor_PriceMixin
bin/magento setup:upgrade
bin/magento cache:flush

# In developer mode, also:
bin/magento setup:static-content:deploy -f
```

> **Exam focus:** After adding or modifying `requirejs-config.js`, you must flush the cache and in production mode re-deploy static content. In developer mode, you only need to flush cache.

---

## 9. Verifying Your Mixin Executes

### Method 1 — Browser DevTools Console

Navigate to any product page. Open DevTools (F12) → Console tab. You should see:

```
[PriceMixin] Price box initialised with config: {priceConfig: {...}}
```

When price changes (e.g., selecting a configurable option):

```
[PriceMixin] reloadPrice triggered
[PriceMixin] Element: [object Object]
[PriceMixin] reloadPrice complete
```

### Method 2 — Network Tab / Source Check

In DevTools → Sources, search for `price-box-mixin.js`. If it appears in the loaded files list, RequireJS loaded it.

### Method 3 — RequireJS Inspection in Console

```javascript
// In browser console, check what price-box has become:
require(['Magento_Catalog/js/price-box'], function(priceBox) {
    console.log(priceBox);
    // Should show the extended version with your methods
});
```

### Method 4 — Checking Static Files in Developer Mode

```bash
# In developer mode, static files are generated on-the-fly
# Check if requirejs-config.js is merged correctly:
cat pub/static/frontend/Magento/luma/en_US/requirejs-config.js | grep price-box-mixin
```

### Troubleshooting — Mixin Not Running?

| Symptom | Likely Cause | Fix |
|---|---|---|
| No console output | Cache not flushed | `bin/magento cache:flush` |
| 404 for mixin file | Wrong file path | Check module ID matches file location |
| `TargetComponent.extend is not a function` | Target is not a UI Component | Use `$.widget` approach instead |
| Mixin runs but `_super` fails | Method doesn't exist on parent | Check the actual method name in original |
| Module not found | Module not enabled | `bin/magento module:enable` + `setup:upgrade` |

---

## 10. Common Mistakes and Gotchas

### Mistake 1 — Wrong Nesting in `requirejs-config.js`

```javascript
// WRONG — missing the outer 'config' key
var config = {
    mixins: {  // <-- this is wrong, mixins must be inside config
        'Magento_Catalog/js/price-box': {
            'Vendor_Module/js/mixins/mixin': true
        }
    }
};

// CORRECT
var config = {
    config: {        // <-- outer 'config' key required
        mixins: {
            'Magento_Catalog/js/price-box': {
                'Vendor_Module/js/mixins/mixin': true
            }
        }
    }
};
```

> **Exam focus:** The structure `config.config.mixins` — the double nesting — is the #1 syntax error in exam questions.

### Mistake 2 — Including `.js` Extension in Module IDs

```javascript
// WRONG
'Magento_Catalog/js/price-box.js': { ... }

// CORRECT
'Magento_Catalog/js/price-box': { ... }
```

### Mistake 3 — Including `web/js/` in Module ID

```javascript
// WRONG — do not include web/js/ prefix
'Vendor_Module/web/js/mixins/mixin': true

// CORRECT — web/js/ is implicit
'Vendor_Module/js/mixins/mixin': true
```

### Mistake 4 — Not Returning the Extended Component

```javascript
// WRONG — returns nothing
return function (TargetComponent) {
    TargetComponent.extend({  // result not returned!
        reloadPrice: function () { this._super(); }
    });
};

// CORRECT
return function (TargetComponent) {
    return TargetComponent.extend({  // must return!
        reloadPrice: function () { this._super(); }
    });
};
```

### Mistake 5 — Not Returning a Function at All

```javascript
// WRONG — returns an object, not a function
return {
    reloadPrice: function () { ... }
};

// CORRECT — must return a function
return function (TargetComponent) {
    return TargetComponent.extend({ ... });
};
```

### Mistake 6 — Using Path Override When Mixin Is Needed

```javascript
// WRONG for "extending" (this replaces, causing conflicts)
var config = {
    map: {
        '*': {
            'Magento_Catalog/js/price-box': 'Vendor_Module/js/price-box'
        }
    }
};

// CORRECT for "extending"
var config = {
    config: {
        mixins: {
            'Magento_Catalog/js/price-box': {
                'Vendor_Module/js/mixins/price-box-mixin': true
            }
        }
    }
};
```

---

## 11. Mental Models and Analogies for Backend Devs

Since you come from a PHP/backend background, here are direct analogies.

### Mixins ≈ PHP Plugins (Interceptors)

| PHP Plugin | JS Mixin |
|---|---|
| `etc/di.xml` `<plugin>` entry | `requirejs-config.js` `config.mixins` entry |
| Plugin class file | Mixin JS file |
| `beforeMethodName()` | Code before `this._super()` in the mixin |
| `afterMethodName()` | Code after `this._super()` in the mixin |
| `aroundMethodName()` | Entire method with `this._super()` in the middle |
| `$proceed(...$args)` | `this._super(args)` |
| Multiple plugins stack | Multiple mixins stack |
| Plugin disabled in `di.xml` | Mixin set to `false` in `requirejs-config.js` |

### Path Overrides ≈ Class Rewrites (Legacy Magento 1)

Just as Magento 1's class rewrites were a source of conflicts (last-one-wins), JS path overrides have the same problem. Mixins solve this the same way plugins solved class rewrite conflicts in Magento 2.

### `TargetComponent.extend()` ≈ PHP Class Inheritance

```javascript
// JS mixin
return TargetComponent.extend({
    reloadPrice: function() { this._super(); }
});
```

```php
// PHP equivalent thinking
class MyPriceBox extends OriginalPriceBox {
    public function reloadPrice() {
        parent::reloadPrice();
    }
}
```

The key difference is that JS mixins create this "subclass" dynamically at runtime and inject it transparently — you never change the `require()` call that loads `price-box`.

### The Module ID Convention

```
'Magento_Catalog/js/price-box'
  ^            ^  ^
  |            |  |--- path inside web/js/ (no .js extension)
  |            |------ separator (maps to web/js/ directory)
  |-------------------- Module name (Vendor_ModuleName)
```

File on disk:
```
app/code/Magento/Catalog/view/frontend/web/js/price-box.js
```

---

## Quick-Reference Checklist

### Core Concepts

- [ ] A mixin **extends** a component — the original still runs
- [ ] A path override **replaces** a component — original does not run
- [ ] Multiple mixins can target the same component — they all run (stacking)
- [ ] Setting a mixin to `false` disables it
- [ ] Mixins are registered in `view/frontend/requirejs-config.js` (or `adminhtml`)

### `requirejs-config.js` Syntax

- [ ] Structure: `var config = { config: { mixins: { ... } } }`
- [ ] The double nesting `config.config.mixins` is mandatory — not `config.mixins`
- [ ] Target key: RequireJS module ID, no `.js` extension, no `web/js/` prefix
- [ ] Value: object of `{ 'mixin-module-id': true/false }`
- [ ] Module IDs use `/` not `\` and follow `Vendor_Module/js/path` pattern

### Mixin File Signature (Component Mixin)

- [ ] File is an AMD module: `define([deps], function(deps) { return ...; })`
- [ ] Returns a **function** (not an object, not a class)
- [ ] That function takes **one argument**: the target component
- [ ] That function returns `TargetComponent.extend({ ... })`
- [ ] Methods inside `.extend({})` can call `this._super()` for the parent version

### Mixin File Signature (Widget Mixin)

- [ ] Function takes **no arguments** (unlike component mixin)
- [ ] Uses `$.widget('mage.widgetName', $.mage.widgetName, { ... })` syntax
- [ ] Must `define(['jquery'], ...)` to access `$`
- [ ] `this._super()` works inside widget overrides too

### `this._super()`

- [ ] Calls the parent/original version of the current method
- [ ] Analogous to PHP `parent::method()` or `$proceed()` in a plugin
- [ ] Can pass arguments: `this._super(arg1, arg2)`
- [ ] Omitting it causes the original method to be **skipped entirely**
- [ ] In a mixin chain, `_super` calls the **previous mixin's** version (not always the original)

### Differences Table (Must Memorise)

- [ ] `config.mixins` = wrap/extend (original runs, multiple can apply)
- [ ] `config.map` or `config.paths` = replace (original does not run, last wins)
- [ ] Mixin value `true` = enabled; `false` = disabled
- [ ] Component mixin: `function(Target) { return Target.extend({}) }`
- [ ] Widget mixin: `function() { $.widget(...); }` (no argument)

### File Location Rules

- [ ] `requirejs-config.js` at `view/frontend/requirejs-config.js`
- [ ] Mixin JS at `view/frontend/web/js/` (the `web/js/` is implicit in module ID)
- [ ] Admin mixins go in `view/adminhtml/requirejs-config.js`

### After Making Changes

- [ ] Run `bin/magento cache:flush` after `requirejs-config.js` changes
- [ ] Run `bin/magento setup:upgrade` after enabling a new module
- [ ] In production: run `bin/magento setup:static-content:deploy`
- [ ] In developer mode: cache flush is sufficient (static files auto-generated)

### Exam Traps to Avoid

- [ ] Do NOT put `mixins` at the top level of `var config` — it must be inside `config.config`
- [ ] Do NOT include `.js` extension in module IDs
- [ ] Do NOT include `web/js/` in module IDs
- [ ] Do NOT forget to `return` inside the mixin function (both the function and the `.extend()` call)
- [ ] Do NOT confuse mixin (extends) with path override (replaces)
- [ ] Do NOT use `config.map` when the question asks about extending/wrapping
