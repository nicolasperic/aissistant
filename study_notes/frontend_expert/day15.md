# Day 15 — jQuery Widgets in Adobe Commerce

## Table of Contents
1. [What Is the jQuery Widget Factory?](#1-what-is-the-jquery-widget-factory)
2. [Widget Anatomy: Options, Methods, and Events](#2-widget-anatomy-options-methods-and-events)
3. [Widget Lifecycle Methods](#3-widget-lifecycle-methods)
4. [Magento's Built-In Widgets](#4-magentos-built-in-widgets)
5. [Initializing Widgets: data-mage-init](#5-initializing-widgets-data-mage-init)
6. [Initializing Widgets: x-magento-init](#6-initializing-widgets-x-magento-init)
7. [data-mage-init vs x-magento-init — Key Differences](#7-data-mage-init-vs-x-magento-init--key-differences)
8. [Extending an Existing Widget](#8-extending-an-existing-widget)
9. [Hands-On Examples](#9-hands-on-examples)
10. [How Magento Loads Widgets (The Bootstrap Chain)](#10-how-magento-loads-widgets-the-bootstrap-chain)
11. [Common Mistakes and Gotchas](#11-common-mistakes-and-gotchas)
12. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. What Is the jQuery Widget Factory?

### Background for Backend Developers

Think of the jQuery Widget Factory as a **class system for UI components**, similar to how you define a PHP class with properties (options), methods, and a constructor. Instead of `new MyClass()`, you call a jQuery plugin method on a DOM element.

> **Analogy:** `$.widget(...)` is like `class MyWidget extends ParentWidget { ... }` in PHP terms — it defines a reusable, inheritable UI component that attaches to a DOM element.

### The Core Syntax

```javascript
// $.widget( 'namespace.widgetName', [parentWidget], { definition } )
$.widget('mage.myWidget', {

    // Default options (like class properties with default values)
    options: {
        speed: 300,
        autoOpen: false
    },

    // Constructor — runs once when widget is first created
    _create: function () {
        console.log('Widget created on element:', this.element);
    },

    // Initializer — runs on create AND every subsequent call
    _init: function () {
        if (this.options.autoOpen) {
            this.open();
        }
    },

    // Public method — callable from outside
    open: function () {
        this.element.show(this.options.speed);
    },

    // Private method — convention is underscore prefix
    _doInternalWork: function () {
        // not part of the public API
    }
});
```

### How to Call It (Instantiation)

```javascript
// Attach the widget to a jQuery-selected DOM element
$('#my-element').myWidget();

// Attach with custom options (override defaults)
$('#my-element').myWidget({ speed: 500, autoOpen: true });

// Call a public method after creation
$('#my-element').myWidget('open');

// Get an option value
var speed = $('#my-element').myWidget('option', 'speed');

// Set an option value
$('#my-element').myWidget('option', 'speed', 700);
```

**Exam focus:**
- The widget namespace is `mage` for Magento core widgets (e.g., `mage.accordion`). Your custom widgets should use a **custom namespace** (e.g., `vendorName.myWidget`).
- The widget name in `$.widget` uses dot notation: `'namespace.name'` — but it becomes a jQuery plugin with just the name part: `$(el).widgetName()`.

---

## 2. Widget Anatomy: Options, Methods, and Events

### 2.1 Options

Options are the configuration properties of a widget. They work like a PHP array of defaults that can be overridden at runtime.

```javascript
$.widget('mage.accordion', {

    options: {
        active: false,        // which panel is open by default
        collapsible: true,    // can all panels be closed?
        animate: { duration: 300 },
        icons: {
            activeHeader: 'ui-icon-triangle-1-s',
            header: 'ui-icon-triangle-1-e'
        }
    },

    // _setOption is called automatically when .widget('option', key, val) is used
    _setOption: function (key, value) {
        // Handle option changes dynamically
        if (key === 'collapsible' && !value && this.options.active === false) {
            this._activate(0);
        }
        // Always call the parent implementation
        this._super(key, value);
    }
});
```

### 2.2 Methods

```javascript
$.widget('mage.myWidget', {
    options: { message: 'Hello' },

    // Public method (no underscore) — accessible via $el.myWidget('greet')
    greet: function () {
        alert(this.options.message);
    },

    // Private method (underscore prefix) — NOT accessible from outside
    _buildMarkup: function () {
        return '<div class="widget-inner"></div>';
    },

    // _super() calls the parent widget's same-named method
    _create: function () {
        this._super(); // call parent _create if extending
        this._buildMarkup();
    }
});
```

### 2.3 Events

Widgets can **trigger custom events** and **bind to DOM events** in a managed way.

```javascript
$.widget('mage.myWidget', {

    _create: function () {
        // Bind a DOM event — _on manages cleanup automatically on destroy()
        this._on(this.element, {
            'click .toggle-btn': '_handleToggle',
            'keydown': '_handleKeydown'
        });
    },

    _handleToggle: function (event) {
        event.preventDefault();
        // Trigger a custom event — becomes 'mymywidgettoggle' on the element
        this._trigger('toggle', event, { isOpen: true });
    },

    _handleKeydown: function (event) {
        if (event.key === 'Escape') {
            this.close();
        }
    }
});

// Listening to the custom event from outside:
$('#el').on('mymywidgettoggle', function (event, data) {
    console.log('Toggled! isOpen:', data.isOpen);
});
```

**Exam focus:**
- `_on()` is preferred over `$(el).on()` because `_on()` **automatically unbinds events** when `destroy()` is called.
- `_trigger('eventName', event, data)` fires a namespaced custom event. The full event name is: `widgetName` + `eventName` (e.g., `mymywidgettoggle`).

---

## 3. Widget Lifecycle Methods

This is a critical area — understand the difference between each lifecycle hook.

```
Widget Lifecycle:
+---------------------------+
|  $el.myWidget()  called   |  <-- First time
+---------------------------+
         |
         v
+---------------------------+
|       _create()           |  Runs ONCE — set up DOM, bind events
+---------------------------+
         |
         v
+---------------------------+
|        _init()            |  Runs on creation AND re-initialization
+---------------------------+

Later: $el.myWidget() called again (re-init):
         |
         v
+---------------------------+
|        _init()            |  Runs again (NOT _create)
+---------------------------+

Widget destroyed:
+---------------------------+
|       destroy()           |  Clean up DOM changes, event bindings
+---------------------------+
```

### Detailed Breakdown

| Method | When It Runs | Typical Use |
|---|---|---|
| `_create()` | **Once**, on first instantiation | Set up DOM structure, cache elements, bind events |
| `_init()` | On create AND on every re-call | Apply initial state, open/close based on options |
| `_setOption(key, val)` | When `option()` method is called | React to runtime option changes |
| `destroy()` | When `$(el).myWidget('destroy')` is called | Remove DOM changes, classes, data attributes |

```javascript
$.widget('mage.myWidget', {

    _create: function () {
        // Cache DOM references (do this once — it's expensive)
        this._button = this.element.find('.my-btn');
        this._panel = this.element.find('.my-panel');

        // Add a CSS class to the root element
        this.element.addClass('my-widget-initialized');

        // Bind events once
        this._on(this._button, {
            click: '_handleClick'
        });
    },

    _init: function () {
        // Apply initial state based on options
        if (this.options.autoOpen) {
            this._panel.show();
        } else {
            this._panel.hide();
        }
    },

    _handleClick: function (event) {
        this._panel.toggle();
    },

    destroy: function () {
        // Remove classes and DOM changes we added
        this.element.removeClass('my-widget-initialized');

        // MUST call parent destroy — it handles _off() and cleans up $.data
        this._super();
    }
});
```

**Exam focus:**
- `_create()` runs **once**. `_init()` runs **every time** the widget is initialized (including first time).
- Always call `this._super()` in `destroy()` to ensure proper cleanup.
- If you only override `_init()` and not `_create()`, your code will re-run on every re-initialization call.

---

## 4. Magento's Built-In Widgets

All core widgets live under `Magento_Ui/js/` or in `lib/web/mage/`. Here are the most important ones.

### 4.1 `mage.accordion`

**File:** `lib/web/mage/accordion.js`

```javascript
// Key options
{
    active: 0,          // Index of initially active panel (false = none)
    collapsible: false, // Allow all panels to be collapsed
    openedState: 'active',
    animate: { duration: 300 }
}
```

```html
<!-- HTML structure expected by mage.accordion -->
<div data-mage-init='{"mage/accordion": {"active": 0, "collapsible": true}}'>
    <div data-role="collapsible">
        <div data-role="trigger"><span>Section 1</span></div>
        <div data-role="content">Content of section 1</div>
    </div>
    <div data-role="collapsible">
        <div data-role="trigger"><span>Section 2</span></div>
        <div data-role="content">Content of section 2</div>
    </div>
</div>
```

### 4.2 `mage.tabs`

**File:** `lib/web/mage/tabs.js`

```html
<div data-mage-init='{"mage/tabs": {"active": 0}}'>
    <ul>
        <li data-role="collapsible">
            <a data-toggle="trigger" href="#tab1">Tab 1</a>
        </li>
        <li data-role="collapsible">
            <a data-toggle="trigger" href="#tab2">Tab 2</a>
        </li>
    </ul>
    <div id="tab1" data-role="content">Tab 1 content</div>
    <div id="tab2" data-role="content">Tab 2 content</div>
</div>
```

### 4.3 `mage.dropdown`

**File:** `lib/web/mage/dropdown.js`
Used for dropdown menus, typically in the header.

```javascript
// Key options
{
    parent: '',              // Selector for parent element
    autoclose: true,         // Close when clicking outside
    btnArrow: '.arrow',      // Arrow element selector
    appendTo: false          // Move dropdown to this element
}
```

### 4.4 `mage.modal`

**File:** `lib/web/mage/modal.js`
One of the most commonly used widgets.

```javascript
// Key options
{
    type: 'popup',          // 'popup', 'slide', 'custom'
    title: '',              // Modal title
    modalClass: '',         // Additional CSS class
    buttons: [],            // Array of button config objects
    responsive: true,
    innerScroll: false,
    trigger: '',            // Selector of trigger element
    autoOpen: false         // Open immediately on init
}
```

```html
<!-- Basic modal example -->
<div data-mage-init='{
    "Magento_Ui/js/modal/modal": {
        "type": "popup",
        "title": "My Modal",
        "buttons": [{
            "text": "Close",
            "class": "action-primary",
            "click": "closeModal"
        }]
    }
}'>
    <p>Modal content goes here.</p>
</div>
```

### 4.5 `mage.loader`

**File:** `lib/web/mage/loader.js`
Shows/hides a loading spinner overlay.

```javascript
// Show the loader
$('body').loader('show');

// Hide the loader
$('body').loader('hide');
```

```html
<!-- Initialize loader on body -->
<script type="text/x-magento-init">
{
    "body": {
        "mage/loader": {}
    }
}
</script>
```

**Exam focus:**
- `mage.modal` has three types: `popup`, `slide`, `custom`. Know them.
- `mage.loader` is initialized on `body` and controlled programmatically via `show`/`hide` methods.
- `data-role` attributes are used by `accordion` and `tabs` to identify trigger/content elements.

---

## 5. Initializing Widgets: `data-mage-init`

### What It Is

`data-mage-init` is an **HTML attribute** placed directly on a DOM element. It tells Magento's JavaScript bootstrapper to initialize one or more widgets on that specific element.

### Syntax

```html
data-mage-init='{"requirejs/module/path": { "option1": "value1", "option2": "value2" }}'
```

> **Key rule:** The JSON must be **valid JSON** — use double quotes for keys and string values. Single quotes wrap the attribute value in HTML.

### Basic Example

```html
<!-- Initialize mage/accordion on this specific <div> -->
<div id="my-accordion" data-mage-init='{"mage/accordion": {"collapsible": true, "active": 0}}'>
    <div data-role="collapsible">
        <div data-role="trigger">Title 1</div>
        <div data-role="content">Body 1</div>
    </div>
</div>
```

### Multiple Widgets on One Element

```html
<!-- You can initialize multiple widgets on the same element -->
<div data-mage-init='{
    "mage/accordion": {"collapsible": true},
    "Vendor_Module/js/my-widget": {"speed": 200}
}'>
    ...
</div>
```

### How Magento Processes It

```
Page Load
    |
    v
RequireJS loads 'mage/apply/main.js'
    |
    v
Scans all DOM elements with [data-mage-init]
    |
    v
For each element:
    - Parses JSON value
    - For each module in JSON:
        - Loads module via RequireJS
        - Calls module as jQuery widget on the element
```

**Exam focus:**
- `data-mage-init` is **bound to the element it is placed on**. The widget's `this.element` will be that DOM element.
- The module path follows **RequireJS module ID** format (e.g., `mage/accordion`, `Magento_Ui/js/modal/modal`).
- Values must be valid JSON. A common mistake is using single quotes inside the JSON.

---

## 6. Initializing Widgets: `x-magento-init`

### What It Is

`x-magento-init` is a **`<script>` tag** with a special `type` attribute. It is used when:
- You need to initialize a widget on an element you **cannot directly modify** (e.g., an element generated by another template).
- You need to initialize a **non-widget JavaScript component** (like a KnockoutJS component).
- You need to initialize something on `body` or `*` (all elements).

### Syntax

```html
<script type="text/x-magento-init">
{
    "CSS_SELECTOR": {
        "requirejs/module/path": {
            "option1": "value1"
        }
    }
}
</script>
```

> The outer key is a **CSS selector string** that identifies the target element(s).

### Examples

```html
<!-- Initialize on a specific element by ID -->
<script type="text/x-magento-init">
{
    "#my-dropdown": {
        "mage/dropdown": {
            "autoclose": true,
            "btnArrow": ".arrow-icon"
        }
    }
}
</script>

<!-- Initialize on all elements with a class -->
<script type="text/x-magento-init">
{
    ".product-item": {
        "Vendor_Module/js/product-widget": {
            "addToCartUrl": "https://example.com/checkout/cart/add"
        }
    }
}
</script>

<!-- Initialize on body (common for loader, form-key, etc.) -->
<script type="text/x-magento-init">
{
    "body": {
        "mage/loader": {}
    }
}
</script>

<!-- The wildcard selector '*' — applies to document/window level components -->
<script type="text/x-magento-init">
{
    "*": {
        "Magento_Ui/js/core/app": {
            "components": { }
        }
    }
}
</script>
```

### The `*` (Wildcard) Selector

When the selector is `"*"`, Magento **does not apply the component to all DOM elements**. Instead, it calls the JavaScript module directly without a DOM context. This is used for:
- KnockoutJS UI components (`Magento_Ui/js/core/app`)
- Global event listeners
- Non-DOM-attached initializations

**Exam focus:**
- `x-magento-init` script blocks can appear **anywhere in the HTML** — they don't need to be adjacent to the target element.
- The selector `"*"` does NOT mean every element — it means **no specific DOM context** (the module is called without a jQuery element).
- `x-magento-init` supports **multiple selectors** in one block.

---

## 7. `data-mage-init` vs `x-magento-init` — Key Differences

This is a heavily tested topic. Study this table carefully.

| Feature | `data-mage-init` | `x-magento-init` |
|---|---|---|
| **Where placed** | As an HTML attribute on the target element | In a `<script type="text/x-magento-init">` tag anywhere in HTML |
| **Target element** | Always the element carrying the attribute | Any element specified by a CSS selector string |
| **Can target elements you don't control** | No | Yes |
| **Multiple targets in one block** | No (one element per attribute) | Yes (multiple selectors per script block) |
| **Supports `*` (no DOM context)** | No | Yes |
| **JSON validity required** | Yes (valid JSON, HTML-entity-encoded if needed) | Yes |
| **`this.element` in widget** | The element with the attribute | The element(s) matching the selector |
| **Typical use case** | Element you write directly in your template | Elements from other templates, `body`, `*` |
| **KnockoutJS UI components** | Not suitable | Yes, via `"*"` selector |

### Side-by-Side Code Comparison

```html
<!-- METHOD 1: data-mage-init — element must be the one you write -->
<div id="my-modal-content"
     data-mage-init='{"Magento_Ui/js/modal/modal": {"type": "popup", "title": "Hello"}}'>
    <p>I am the modal content.</p>
</div>
```

```html
<!-- METHOD 2: x-magento-init — can target any element by selector -->
<div id="my-modal-content">
    <p>I am the modal content.</p>
</div>

<script type="text/x-magento-init">
{
    "#my-modal-content": {
        "Magento_Ui/js/modal/modal": {
            "type": "popup",
            "title": "Hello"
        }
    }
}
</script>
```

Both examples achieve the same result. The difference is **where you can place the initialization code**.

**Exam focus:**
- Use `data-mage-init` when you **own the element's markup** and it's simpler.
- Use `x-magento-init` when you need to target **elements outside your template**, or when initializing **non-DOM components** with `"*"`.
- Both are processed by the same underlying Magento JS bootstrapper (`mage/apply/main.js`).
- `x-magento-init` is the **only way** to use the `"*"` selector.

---

## 8. Extending an Existing Widget

### The Inheritance Syntax

```javascript
// $.widget( 'namespace.newName', parentWidget, { overrides } )
$.widget('mage.myAccordion', $.mage.accordion, {

    // Override default options (merged with parent's options)
    options: {
        collapsible: true,  // change default
        myNewOption: 'hello'
    },

    // Override _create — always call _super() to run parent logic
    _create: function () {
        this._super(); // runs $.mage.accordion._create()
        console.log('My custom accordion created!');
    },

    // Add a brand new method
    openAll: function () {
        this.element.find('[data-role="collapsible"]').each(function () {
            $(this).addClass('active');
        });
    }
});
```

### Real-World Example: Extending `mage.dropdown`

```javascript
// File: Vendor_Module/view/frontend/web/js/my-dropdown.js
define([
    'jquery',
    'mage/dropdown'   // <-- loads and registers $.mage.dropdown
], function ($) {
    'use strict';

    $.widget('vendorModule.myDropdown', $.mage.dropdown, {

        // Extend default options
        options: {
            autoclose: true,
            highlightClass: 'is-highlighted',
            myCustomDelay: 200
        },

        // Override _create to add extra behavior
        _create: function () {
            // Call parent _create first
            this._super();

            // Add our custom initialization
            this.element.addClass('custom-dropdown');
            this._bindCustomEvents();
        },

        // Private method — not in parent
        _bindCustomEvents: function () {
            var self = this;
            this._on(this.element, {
                'mouseenter': function () {
                    self.element.addClass(self.options.highlightClass);
                },
                'mouseleave': function () {
                    self.element.removeClass(self.options.highlightClass);
                }
            });
        },

        // Override destroy to clean up our additions
        destroy: function () {
            this.element.removeClass('custom-dropdown');
            this.element.removeClass(this.options.highlightClass);
            this._super(); // parent destroy cleans up events
        }
    });

    return $.vendorModule.myDropdown;
});
```

**Exam focus:**
- The parent widget reference uses the **full dotted name**: `$.mage.accordion`, `$.mage.dropdown`, `$.mage.modal`.
- Always call `this._super()` when overriding `_create()`, `_init()`, and `destroy()`.
- The new widget's namespace should be **your vendor namespace**, not `mage` (which is reserved for core).
- After `$.widget()` defines it, access the constructor as `$.vendorName.widgetName` (namespace becomes a property of `$`).

---

## 9. Hands-On Examples

### Example 1: Modal Widget via `data-mage-init`

Create a custom template with a button that opens a modal.

**Template file:** `Vendor/Module/view/frontend/templates/my-modal.phtml`

```html
<!-- my-modal.phtml -->
<button id="open-my-modal" type="button" class="action primary">
    Open Modal
</button>

<div id="my-modal-container"
     data-mage-init='{
         "Magento_Ui/js/modal/modal": {
             "type": "popup",
             "title": "Custom Modal Title",
             "trigger": "#open-my-modal",
             "responsive": true,
             "innerScroll": true,
             "buttons": [
                 {
                     "text": "<?= __('OK') ?>",
                     "class": "action-primary action-accept",
                     "click": "closeModal"
                 },
                 {
                     "text": "<?= __('Cancel') ?>",
                     "class": "action-secondary action-dismiss",
                     "click": "closeModal"
                 }
             ]
         }
     }'>
    <p><?= __('This is the modal body content.') ?></p>
    <p><?= __('You can put any HTML here.') ?></p>
</div>
```

> **Note:** The `trigger` option binds an external button to open the modal. The widget initializes on `#my-modal-container` but the trigger is `#open-my-modal`.

### Example 2: Custom Widget Extending `mage.dropdown`

**JS file:** `Vendor/Module/view/frontend/web/js/vendor-dropdown.js`

```javascript
define([
    'jquery',
    'mage/dropdown'
], function ($) {
    'use strict';

    /**
     * Custom dropdown widget that extends mage.dropdown
     * Adds animated open/close and a badge counter
     */
    $.widget('vendorModule.vendorDropdown', $.mage.dropdown, {

        options: {
            animationSpeed: 250,       // ms for open/close animation
            badgeSelector: '.badge',   // selector for a badge element
            autoclose: true
        },

        /**
         * _create: runs once on widget initialization
         */
        _create: function () {
            // Run parent setup first (binds core dropdown events)
            this._super();

            // Cache our badge element
            this._badge = this.element.find(this.options.badgeSelector);

            // Add our identifying class
            this.element.addClass('vendor-dropdown--initialized');

            console.log('vendorDropdown created. Badge found:', this._badge.length > 0);
        },

        /**
         * Override open to add animation
         */
        open: function () {
            var dropdown = this.element.find('[data-target="dropdown"]');

            // Animate open instead of instant show
            dropdown.slideDown(this.options.animationSpeed);

            // Call parent open logic for proper state tracking
            this._super();

            // Hide badge when menu is open
            this._badge.hide();
        },

        /**
         * Override close to add animation
         */
        close: function () {
            var dropdown = this.element.find('[data-target="dropdown"]');

            dropdown.slideUp(this.options.animationSpeed);
            this._super();

            // Show badge when menu is closed
            this._badge.show();
        },

        /**
         * Custom public method to update badge count
         * Usage: $el.vendorDropdown('setBadgeCount', 5)
         */
        setBadgeCount: function (count) {
            if (this._badge.length) {
                this._badge.text(count).toggle(count > 0);
            }
        },

        /**
         * destroy: cleanup
         */
        destroy: function () {
            this.element.removeClass('vendor-dropdown--initialized');
            this._super();
        }
    });

    // Return the constructor for use as a RequireJS module
    return $.vendorModule.vendorDropdown;
});
```

**Usage in a template with `data-mage-init`:**

```html
<div class="my-dropdown-wrapper"
     data-mage-init='{
         "Vendor_Module/js/vendor-dropdown": {
             "animationSpeed": 300,
             "badgeSelector": ".notification-count",
             "autoclose": true
         }
     }'>

    <button class="dropdown-trigger">
        Notifications
        <span class="notification-count badge">3</span>
    </button>

    <ul data-target="dropdown" style="display:none;">
        <li>Notification 1</li>
        <li>Notification 2</li>
        <li>Notification 3</li>
    </ul>
</div>
```

### Example 3: Passing Options via JSON in `data-mage-init`

Demonstrates various data types you can pass:

```html
<div id="options-demo"
     data-mage-init='{
         "Vendor_Module/js/demo-widget": {
             "stringOption": "hello world",
             "numberOption": 42,
             "boolOption": true,
             "arrayOption": ["item1", "item2", "item3"],
             "objectOption": {
                 "key1": "value1",
                 "key2": 100
             },
             "urlOption": "<?= $block->getUrl('catalog/product/view') ?>"
         }
     }'>
</div>
```

> **Important:** PHP `$block->getUrl()` and other PHP expressions are evaluated server-side before the JSON reaches the browser. This is the correct way to pass dynamic server-side data to a widget.

### Example 4: Same Widget via `x-magento-init` (Equivalent to Example 3)

```html
<div id="options-demo">
    <!-- element content -->
</div>

<script type="text/x-magento-init">
{
    "#options-demo": {
        "Vendor_Module/js/demo-widget": {
            "stringOption": "hello world",
            "numberOption": 42,
            "boolOption": true,
            "arrayOption": ["item1", "item2", "item3"],
            "objectOption": {
                "key1": "value1",
                "key2": 100
            }
        }
    }
}
</script>
```

---

## 10. How Magento Loads Widgets (The Bootstrap Chain)

Understanding this helps when debugging why a widget doesn't initialize.

```
Browser loads page HTML
        |
        v
RequireJS loads and executes
        |
        v
'mage/bootstrap' is required (in Magento_Theme layout XML)
        |
        v
'mage/apply/main' scans the DOM for:
  [1] <script type="text/x-magento-init">  blocks
  [2] Elements with [data-mage-init] attributes
        |
        v
For each found component:
  - Parses the JSON configuration
  - Requires the module via RequireJS
  - When module loads: calls widget initializer on target element
        |
        v
Widget _create() and _init() run
        |
        v
UI is interactive
```

### RequireJS Module Path Mapping

Magento maps short module paths to full file paths in `requirejs-config.js`:

```javascript
// Example: lib/web/mage/requirejs-config.js or module's requirejs-config.js
var config = {
    map: {
        '*': {
            // Short alias -> full path
            'accordion':    'mage/accordion',
            'dropdown':     'mage/dropdown',
            'tabs':         'mage/tabs',
            'modal':        'Magento_Ui/js/modal/modal'
        }
    }
};
```

**Exam focus:**
- Widget initialization is **asynchronous** — it happens after RequireJS loads all dependencies.
- Do not expect widgets to be available synchronously after DOM load without RequireJS wrapping.
- `mage/apply/main` is the bootstrapper that processes both `data-mage-init` and `x-magento-init`.

---

## 11. Common Mistakes and Gotchas

### Mistake 1: Invalid JSON in `data-mage-init`

```html
<!-- WRONG: single quotes in JSON are invalid -->
<div data-mage-init="{'mage/accordion': {'collapsible': true}}">

<!-- CORRECT: double quotes in JSON, single quotes wrap attribute -->
<div data-mage-init='{"mage/accordion": {"collapsible": true}}'>

<!-- ALSO CORRECT: HTML entities for quotes if needed -->
<div data-mage-init="{&quot;mage/accordion&quot;: {&quot;collapsible&quot;: true}}">
```

### Mistake 2: Forgetting `_super()` in Overrides

```javascript
// WRONG: parent _create never runs — widget may break
_create: function () {
    this.element.addClass('my-class');
    // parent setup is skipped!
},

// CORRECT: run parent first, then add your code
_create: function () {
    this._super();  // parent sets up its DOM, events, etc.
    this.element.addClass('my-class');
},
```

### Mistake 3: Modifying Options Without `_setOption`

```javascript
// WRONG: directly mutating options — widget doesn't react
this.options.speed = 500;

// CORRECT: use option() method — triggers _setOption handler
this.option('speed', 500);
```

### Mistake 4: Using `$(el).on()` Instead of `this._on()`

```javascript
// WRONG: event is NOT cleaned up when widget is destroyed
this.element.on('click', this._handleClick.bind(this));

// CORRECT: _on tracks bindings and removes them on destroy()
this._on(this.element, { 'click': '_handleClick' });
```

### Mistake 5: Wrong Module Path Format

```html
<!-- WRONG: PHP class-style path -->
<div data-mage-init='{"Vendor\\Module\\view\\frontend\\web\\js\\widget": {}}'>

<!-- CORRECT: RequireJS module ID format (forward slashes, no .js extension) -->
<div data-mage-init='{"Vendor_Module/js/widget": {}}'>
```

---

## Quick-Reference Checklist

### Widget Factory

- [ ] `$.widget('namespace.name', { ... })` defines a widget
- [ ] `$.widget('namespace.name', $.mage.parentWidget, { ... })` extends a widget
- [ ] Widget becomes a jQuery plugin: `$(el).widgetName(options)`
- [ ] Call public method: `$(el).widgetName('methodName', args)`
- [ ] Get option: `$(el).widgetName('option', 'key')`
- [ ] Set option: `$(el).widgetName('option', 'key', value)`
- [ ] Destroy: `$(el).widgetName('destroy')`

### Lifecycle Methods

- [ ] `_create()` — runs **once** on first init; use for DOM setup and event binding
- [ ] `_init()` — runs on **every** initialization (first time AND re-call)
- [ ] `destroy()` — cleans up DOM changes; must call `this._super()`
- [ ] `_setOption(key, val)` — handles runtime option changes; must call `this._super()`

### Built-In Widgets (Know These)

- [ ] `mage/accordion` — uses `data-role="collapsible|trigger|content"`
- [ ] `mage/tabs` — tabbed interface, similar data-role structure
- [ ] `mage/dropdown` — dropdown menus, `autoclose` option
- [ ] `Magento_Ui/js/modal/modal` — types: `popup`, `slide`, `custom`
- [ ] `mage/loader` — `show()` / `hide()` methods, typically on `body`

### `data-mage-init`

- [ ] HTML attribute on the **target element itself**
- [ ] Value must be **valid JSON** (double-quoted keys/values)
- [ ] Format: `'{"requirejs/path": { "option": "value" }}'`
- [ ] Multiple widgets: `'{"module1": {}, "module2": {}}'`
- [ ] `this.element` = the element with the attribute
- [ ] PHP expressions evaluated server-side before JSON reaches browser

### `x-magento-init`

- [ ] `<script type="text/x-magento-init">` placed **anywhere** in HTML
- [ ] Outer key is a **CSS selector string** for target element(s)
- [ ] Can target elements in other templates
- [ ] `"*"` selector = **no DOM context** (used for KnockoutJS UI components)
- [ ] `"body"` selector commonly used for `mage/loader`, `mage/form-key`
- [ ] Can have **multiple selectors** in one block

### data-mage-init vs x-magento-init

- [ ] `data-mage-init`: attribute on element you **directly write** in your template
- [ ] `x-magento-init`: script block when element is **outside your template** or selector-targeted
- [ ] Both processed by `mage/apply/main.js` bootstrapper
- [ ] Only `x-magento-init` supports `"*"` and multi-selector targeting
- [ ] Both require valid JSON; same RequireJS module path format

### Extending Widgets

- [ ] Syntax: `$.widget('vendor.name', $.mage.existingWidget, { ... })`
- [ ] Parent widget options are **merged** with child defaults
- [ ] Access parent widget via: `$.mage.widgetName` (e.g., `$.mage.dropdown`)
- [ ] Override methods and call parent with `this._super()`
- [ ] New widget available as: `$.vendorNamespace.widgetName`
- [ ] Return `$.vendorNamespace.widgetName` from RequireJS `define()` block

### Events and Best Practices

- [ ] Use `this._on(element, { 'event': 'handler' })` not `$(el).on()`
- [ ] Use `this._trigger('name', event, data)` to fire custom events
- [ ] Custom event name = widget name + event name (auto-namespaced)
- [ ] Cache DOM lookups in `_create()` (`this._myEl = this.element.find(...)`)
- [ ] Use `this._super()` in every overridden lifecycle method
- [ ] Private methods/properties prefixed with `_` by convention

### Exam Traps to Watch For

- [ ] `_create` vs `_init`: re-calling the widget runs `_init` **not** `_create`
- [ ] `"*"` in `x-magento-init` ≠ all elements; it means **no DOM binding**
- [ ] Module paths use **forward slashes** and **no `.js` extension**
- [ ] `data-mage-init` JSON must use **double quotes** — not single quotes
- [ ] `this._super()` in `destroy()` is **required** for proper cleanup
- [ ] `mage/modal` type options are: `popup`, `slide`, `custom` (not `dialog`)
