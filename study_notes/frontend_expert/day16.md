# Day 16 — JS Components via Layout XML

## Table of Contents
- [1. Overview & Why This Matters](#1-overview--why-this-matters)
- [2. How Magento Loads JavaScript — The Big Picture](#2-how-magento-loads-javascript--the-big-picture)
- [3. Adding JS Files via Layout XML](#3-adding-js-files-via-layout-xml)
  - [3.1 `<head><script>` — Require a JS File](#31-headscript--require-a-js-file)
  - [3.2 `<head><link>` — Link a CSS/Resource File](#32-headlink--link-a-cssresource-file)
  - [3.3 Layout Handle Targeting](#33-layout-handle-targeting)
- [4. `data-mage-init` — Inline Widget Configuration](#4-data-mage-init--inline-widget-configuration)
  - [4.1 What `data-mage-init` Does](#41-what-data-mage-init-does)
  - [4.2 Connecting Layout Blocks to `data-mage-init` in Templates](#42-connecting-layout-blocks-to-data-mage-init-in-templates)
- [5. `jsLayout` Argument in Layout XML](#5-jslayout-argument-in-layout-xml)
  - [5.1 What `jsLayout` Is](#51-what-jslayout-is)
  - [5.2 Structure of `jsLayout` in XML](#52-structure-of-jslayout-in-xml)
  - [5.3 How PHP Passes `jsLayout` to the Template](#53-how-php-passes-jslayout-to-the-template)
- [6. `Magento_Ui/js/core/app` — The UI Component Initializer](#6-magento_uijscoreapp--the-ui-component-initializer)
  - [6.1 What It Does](#61-what-it-does)
  - [6.2 How It Is Invoked](#62-how-it-is-invoked)
- [7. `<item name="component">` — Mapping XML to a JS Module](#7-item-namecomponent--mapping-xml-to-a-js-module)
- [8. Static vs Dynamic Component Initialization](#8-static-vs-dynamic-component-initialization)
- [9. Hands-On Walkthrough](#9-hands-on-walkthrough)
  - [9.1 Add a Custom JS File to a Specific Page](#91-add-a-custom-js-file-to-a-specific-page)
  - [9.2 Pass Configuration via `jsLayout`](#92-pass-configuration-via-jslayout)
  - [9.3 Verify in Browser DevTools](#93-verify-in-browser-devtools)
- [10. The Full Data Flow — End-to-End Diagram](#10-the-full-data-flow--end-to-end-diagram)
- [11. Common Mistakes & Gotchas](#11-common-mistakes--gotchas)
- [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Overview & Why This Matters

In Magento 2, **Layout XML is the central configuration layer** for everything that appears on a page — blocks, templates, and JavaScript components. For the exam (Section 4: JavaScript, 36% weight), you must understand not just how to write JavaScript, but **how Magento wires JS components to pages through XML**.

This topic is a cross-section of:

| Area | Relevant Concept |
|---|---|
| Layout XML (Section 2) | `<head>`, `<block>`, `<argument>`, `<referenceBlock>` |
| JavaScript (Section 4) | RequireJS, `data-mage-init`, UI Components, `x-magento-init` |

> **As a backend developer**, think of this like dependency injection but for the frontend: Layout XML is the `di.xml` for JavaScript components.

---

## 2. How Magento Loads JavaScript — The Big Picture

Before diving into specifics, understand the two distinct JS loading systems Magento uses:

```
+-----------------------------------------------+
|              Layout XML / PHP                 |
|                                               |
|  <head><script>  -->  RequireJS loads file    |
|                                               |
|  <block> + jsLayout argument                  |
|       |                                       |
|       v                                       |
|  Template (.phtml)                            |
|       |                                       |
|  data-mage-init / x-magento-init              |
|       |                                       |
|       v                                       |
|  Magento_Ui/js/core/app  (UI components)      |
|  OR                                           |
|  mage/apply/scripts.js   (widgets/simple)     |
+-----------------------------------------------+
```

There are **two initialization systems** running in parallel:

1. **`data-mage-init` / `x-magento-init`** — For jQuery widgets and simple RequireJS components
2. **`Magento_Ui/js/core/app`** — For full UI Components (Knockout.js-based, used heavily in checkout)

**Exam focus:** Know which system is used for which scenario. UI Components use `Magento_Ui/js/core/app`; standard widgets use `data-mage-init`.

---

## 3. Adding JS Files via Layout XML

### 3.1 `<head><script>` — Require a JS File

The `<head><script>` instruction tells Magento to include a JavaScript file on the page. It uses **RequireJS module paths**, not raw file paths.

```xml
<!-- File: view/frontend/layout/catalog_product_view.xml -->
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <head>
        <!-- Add a JS file from your module -->
        <script src="Vendor_Module::js/my-component.js"/>

        <!-- Add a JS file from a theme -->
        <script src="js/my-theme-script.js"/>

        <!-- Add an external JS file (full URL) -->
        <script src="https://example.com/external.js"/>
    </head>
</page>
```

**Key points about `<head><script>`:**

| Attribute | Purpose | Example |
|---|---|---|
| `src` | RequireJS/file path to the JS file | `Vendor_Module::js/custom.js` |
| No `type` needed | Magento handles RequireJS wrapping | — |

The `Vendor_Module::js/my-component.js` notation resolves to:
```
app/code/Vendor/Module/view/frontend/web/js/my-component.js
```

**Exam focus:** `<head><script>` loads a JS file globally on the matched page handle. It does **not** pass configuration — it just makes the file available.

### 3.2 `<head><link>` — Link a CSS/Resource File

```xml
<head>
    <!-- Link a CSS file -->
    <link src="Vendor_Module::css/my-styles.css"/>

    <!-- Remove a default Magento JS file -->
    <remove src="mage/bootstrap.js"/>
</head>
```

**Exam focus:** `<head><link>` is primarily for CSS. `<head><script>` is for JS. `<remove>` removes a previously declared resource by its `src` value.

### 3.3 Layout Handle Targeting

This is where the **backend mental model maps directly**: layout handles are like route-specific configuration files.

```
catalog_product_view.xml     -->  Runs on ALL product pages
catalog_product_view_id_42.xml --> Runs on product with ID 42 only
cms_index_index.xml          -->  Runs on the CMS homepage only
checkout_index_index.xml     -->  Runs on the checkout page only
default.xml                  -->  Runs on ALL pages
```

```xml
<!-- Only load my JS on the product detail page -->
<!-- File: view/frontend/layout/catalog_product_view.xml -->
<page ...>
    <head>
        <script src="Vendor_Module::js/product-customizer.js"/>
    </head>
</page>
```

**Exam focus:** A layout handle file name corresponds directly to a route (`frontName_controllerName_actionName`). Scripts added to a handle file only load on pages matched by that handle.

---

## 4. `data-mage-init` — Inline Widget Configuration

### 4.1 What `data-mage-init` Does

`data-mage-init` is an **HTML data attribute** placed on a DOM element in a `.phtml` template. When Magento's JS bootstrap runs, it scans all DOM elements for this attribute and **initializes the specified component on that element**.

Think of it like `__construct()` arguments for JavaScript: the JSON value is the configuration passed to the component.

```html
<!-- Basic syntax in a .phtml template -->
<div data-mage-init='{"Vendor_Module/js/my-widget": {"option1": "value1", "option2": true}}'>
    Content here
</div>
```

The string `"Vendor_Module/js/my-widget"` is a **RequireJS module path** — not a URL, not a class name.

**What happens at runtime:**
```
Page loads
    |
    v
mage/apply/scripts.js scans DOM
    |
    v
Finds data-mage-init attribute
    |
    v
RequireJS loads "Vendor_Module/js/my-widget"
    |
    v
Calls widget/component constructor with the JSON config
    AND
    passes the DOM element as context
```

**Exam focus:** `data-mage-init` is **element-scoped** — the component is bound to the specific HTML element the attribute sits on. The JSON value is the config object passed to the component.

### 4.2 Connecting Layout Blocks to `data-mage-init` in Templates

The typical workflow is:

**Step 1 — Layout XML declares the block:**
```xml
<!-- view/frontend/layout/catalog_product_view.xml -->
<body>
    <referenceContainer name="content">
        <block class="Vendor\Module\Block\Product\CustomBlock"
               name="vendor.module.custom.block"
               template="Vendor_Module::product/custom-block.phtml"/>
    </referenceContainer>
</body>
```

**Step 2 — The Block PHP class provides data:**
```php
<?php
// Block/Product/CustomBlock.php
namespace Vendor\Module\Block\Product;

use Magento\Framework\View\Element\Template;

class CustomBlock extends Template
{
    public function getWidgetConfig(): array
    {
        return [
            'productId' => $this->getProduct()->getId(),
            'ajaxUrl'   => $this->getUrl('vendor_module/ajax/endpoint'),
        ];
    }
}
```

**Step 3 — The `.phtml` template uses `data-mage-init`:**
```php
<?php
// Template: view/frontend/templates/product/custom-block.phtml
/** @var \Vendor\Module\Block\Product\CustomBlock $block */
$config = $block->getWidgetConfig();
?>
<div class="vendor-custom-block"
     data-mage-init='<?= $block->escapeHtmlAttr(json_encode([
         "Vendor_Module/js/custom-widget" => $config
     ])) ?>'>
    <p>Custom content here</p>
</div>
```

**Exam focus:** The **block class** bridges PHP data and JS configuration. The template renders the `data-mage-init` attribute dynamically using block methods. Always use `escapeHtmlAttr` around `json_encode` output.

---

## 5. `jsLayout` Argument in Layout XML

### 5.1 What `jsLayout` Is

`jsLayout` is a **special `<argument>` passed to a block** in Layout XML. It is a nested XML structure that gets **serialized to a PHP array** by the block, then **encoded to JSON** and output in the template — usually inside a `data-mage-init` or `<script type="text/x-magento-init">` tag.

It is the primary mechanism for configuring **UI Components from Layout XML** — most heavily used in **checkout** (`checkout_index_index.xml`).

> **Backend analogy:** `jsLayout` in XML is like constructor arguments in `di.xml`, but for JavaScript components instead of PHP classes.

### 5.2 Structure of `jsLayout` in XML

```xml
<!-- view/frontend/layout/checkout_index_index.xml -->
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceBlock name="checkout.root">
            <arguments>
                <argument name="jsLayout" xsi:type="array">

                    <!-- Top-level key: "components" is the standard entry point -->
                    <item name="components" xsi:type="array">

                        <item name="checkout" xsi:type="array">

                            <!-- The JS module path for this component -->
                            <item name="component" xsi:type="string">
                                Vendor_Module/js/view/my-checkout-component
                            </item>

                            <!-- Children components -->
                            <item name="children" xsi:type="array">

                                <item name="my-step" xsi:type="array">
                                    <item name="component" xsi:type="string">
                                        Vendor_Module/js/view/my-step
                                    </item>
                                    <item name="config" xsi:type="array">
                                        <item name="title" xsi:type="string">
                                            My Custom Step
                                        </item>
                                        <item name="isVisible" xsi:type="boolean">
                                            true
                                        </item>
                                    </item>
                                </item>

                            </item><!-- /children -->

                        </item><!-- /checkout -->

                    </item><!-- /components -->

                </argument>
            </arguments>
        </referenceBlock>
    </body>
</page>
```

**Exam focus:** The `jsLayout` argument is **always `xsi:type="array"`**. Individual items use `xsi:type` of `string`, `boolean`, `number`, or `array`. The `<item name="component">` value is always a **RequireJS module path**.

### 5.3 How PHP Passes `jsLayout` to the Template

The base class `Magento\Framework\View\Element\Template` automatically exposes `jsLayout` to templates via `getJsLayout()`:

```php
<?php
// This is inside Magento core — shown for understanding
// Magento\Framework\View\Element\Template

public function getJsLayout()
{
    return json_encode($this->jsLayout);
}
```

In the template (e.g., `checkout_onepage.phtml`):

```php
<?php
/** @var \Magento\Checkout\Block\Onepage $block */
?>
<div id="checkout"
     data-mage-init='{"Magento_Ui/js/core/app": <?= $block->getJsLayout() ?>}'>
</div>
```

This outputs something like:
```html
<div id="checkout"
     data-mage-init='{"Magento_Ui/js/core/app": {"components": {"checkout": {"component": "Magento_Checkout/js/view/checkout", "children": {...}}}}}'>
</div>
```

**Exam focus:** `getJsLayout()` returns a **JSON-encoded string** of the `jsLayout` argument. The template passes this directly into `data-mage-init` for `Magento_Ui/js/core/app`.

---

## 6. `Magento_Ui/js/core/app` — The UI Component Initializer

### 6.1 What It Does

`Magento_Ui/js/core/app` is the **bootstrapper for the UI Component framework**. When called with a configuration object (from `jsLayout`), it:

1. Reads the `components` tree
2. For each component, **requires the JS module** specified in `"component"`
3. Instantiates the component with its `config`, `children`, etc.
4. Registers the component in the **UI Component registry**
5. Binds **Knockout.js** view models to the DOM

```
data-mage-init calls Magento_Ui/js/core/app
         |
         v
   Reads "components" tree from jsLayout JSON
         |
         v
   For each node with "component" key:
         |
         v
   RequireJS loads the module path
         |
         v
   Instantiates with uiClass.extend() / uiComponent
         |
         v
   Knockout.js applies bindings to DOM
```

### 6.2 How It Is Invoked

```html
<!-- Pattern 1: via data-mage-init (most common in checkout) -->
<div data-mage-init='{"Magento_Ui/js/core/app": { ...jsLayout config... }}'></div>

<!-- Pattern 2: via x-magento-init (not tied to a DOM element) -->
<script type="text/x-magento-init">
{
    "#checkout": {
        "Magento_Ui/js/core/app": <?= $block->getJsLayout() ?>
    }
}
</script>
```

**Exam focus:** `Magento_Ui/js/core/app` is **not a widget** — it is a component **factory/bootstrapper**. It reads the component tree and instantiates each UI Component. It is always used with the `jsLayout` configuration pattern.

---

## 7. `<item name="component">` — Mapping XML to a JS Module

The `<item name="component">` entry inside a `jsLayout` array is the **critical link between XML configuration and JavaScript code**.

```xml
<item name="component" xsi:type="string">Vendor_Module/js/view/my-component</item>
```

This value is a **RequireJS module ID**, which resolves according to `requirejs-config.js` mappings.

**Resolution example:**

| XML component value | Resolves to file |
|---|---|
| `Vendor_Module/js/view/my-component` | `Vendor/Module/view/frontend/web/js/view/my-component.js` |
| `Magento_Checkout/js/view/form/element/email` | `Magento/Checkout/view/frontend/web/js/view/form/element/email.js` |
| `uiComponent` | Alias for `Magento_Ui/js/lib/core/collection` |

**How it maps in the full flow:**

```xml
<!-- XML -->
<item name="my-custom-block" xsi:type="array">
    <item name="component" xsi:type="string">
        Vendor_Module/js/view/custom-block   <!-- <-- This is the JS module -->
    </item>
    <item name="config" xsi:type="array">
        <item name="title" xsi:type="string">Hello World</item>
    </item>
</item>
```

```javascript
// app/code/Vendor/Module/view/frontend/web/js/view/custom-block.js
define([
    'uiComponent'
], function (Component) {
    'use strict';

    return Component.extend({
        defaults: {
            title: 'Default Title'  // Can be overridden by XML config
        },

        initialize: function () {
            this._super();
            console.log('Component initialized with title:', this.title);
            return this;
        }
    });
});
```

**Exam focus:** The value of `<item name="component">` is a **RequireJS path** — not a PHP class, not a file path. It must match a file resolvable through RequireJS module resolution. Config items defined in XML (`<item name="config">` children) are merged into the component's `defaults`.

---

## 8. Static vs Dynamic Component Initialization

This is a key concept that distinguishes how and when components are started.

| Aspect | Static Initialization | Dynamic Initialization |
|---|---|---|
| **Trigger** | Page load (DOM ready) | User action or AJAX response |
| **Mechanism** | `data-mage-init` attribute | `mage/apply/main.js` called programmatically |
| **Config source** | Rendered in HTML at page load | Injected into DOM at runtime |
| **Use case** | Checkout steps, product page widgets | Cart updates, AJAX-loaded content |
| **When parsed** | Once, on DOMContentLoaded | Each time `applyBindings()` is called |

### Static Initialization

The configuration is **baked into the HTML** at page render time:

```html
<!-- Rendered in the page source — configuration is static -->
<div class="product-gallery"
     data-mage-init='{"Magento_ProductVideo/js/fotorama-add-video-events":
         {"videoData": [...], "optionVideoData": {...}}}'>
</div>
```

### Dynamic Initialization

Used when content is loaded after the initial page render (e.g., via AJAX):

```javascript
// JavaScript that dynamically applies mage init to new DOM elements
define(['jquery', 'mage/apply/main'], function ($, mage) {
    'use strict';

    // After injecting new HTML into the DOM:
    $.ajax({
        url: '/my/endpoint',
        success: function (html) {
            $('#target-container').html(html);

            // Re-apply data-mage-init parsing to new elements
            mage.apply();
        }
    });
});
```

**Exam focus:** `mage/apply/main` (or `mage/apply/scripts`) must be called explicitly after dynamically adding HTML that contains `data-mage-init` attributes. Static initialization happens automatically on page load.

---

## 9. Hands-On Walkthrough

### 9.1 Add a Custom JS File to a Specific Page

**Goal:** Load a custom JS file only on the product detail page.

**Step 1 — Create the JS file:**

```javascript
// app/code/Vendor/Module/view/frontend/web/js/product-page-init.js
define(['jquery'], function ($) {
    'use strict';

    return function (config, element) {
        console.log('[Vendor_Module] product-page-init loaded');
        console.log('Config received:', config);
        console.log('Bound element:', element);

        // Your custom logic here
        $(element).addClass('js-initialized');
    };
});
```

**Step 2 — Create the layout XML:**

```xml
<!-- app/code/Vendor/Module/view/frontend/layout/catalog_product_view.xml -->
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <head>
        <!-- This makes RequireJS aware of the file on this page -->
        <script src="Vendor_Module::js/product-page-init.js"/>
    </head>
</page>
```

**Step 3 — Register the layout file in your module:**

Ensure your module has `view/frontend/layout/` declared and the module is enabled:

```bash
bin/magento module:enable Vendor_Module
bin/magento setup:upgrade
bin/magento cache:flush
```

### 9.2 Pass Configuration via `jsLayout`

**Goal:** Create a checkout-style component with configuration from Layout XML.

**Step 1 — Create the Block class:**

```php
<?php
// app/code/Vendor/Module/Block/CustomWidget.php
namespace Vendor\Module\Block;

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;

class CustomWidget extends Template
{
    public function __construct(
        Context $context,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    // getJsLayout() is inherited from Template — it reads the jsLayout argument
    // No need to override it unless you want to merge extra data
}
```

**Step 2 — Declare block + jsLayout in Layout XML:**

```xml
<!-- app/code/Vendor/Module/view/frontend/layout/cms_index_index.xml -->
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <block class="Vendor\Module\Block\CustomWidget"
                   name="vendor.module.custom.widget"
                   template="Vendor_Module::custom-widget.phtml">
                <arguments>
                    <argument name="jsLayout" xsi:type="array">
                        <item name="components" xsi:type="array">
                            <item name="vendor-custom-widget" xsi:type="array">
                                <item name="component" xsi:type="string">
                                    Vendor_Module/js/view/custom-widget
                                </item>
                                <item name="config" xsi:type="array">
                                    <item name="greeting" xsi:type="string">Hello from XML!</item>
                                    <item name="maxItems" xsi:type="number">5</item>
                                    <item name="isEnabled" xsi:type="boolean">true</item>
                                </item>
                            </item>
                        </item>
                    </argument>
                </arguments>
            </block>
        </referenceContainer>
    </body>
</page>
```

**Step 3 — Create the template:**

```php
<?php
// app/code/Vendor/Module/view/frontend/templates/custom-widget.phtml
/** @var \Vendor\Module\Block\CustomWidget $block */
?>
<div id="vendor-custom-widget"
     data-mage-init='{"Magento_Ui/js/core/app": <?= $block->getJsLayout() ?>}'>
    <p>Loading widget...</p>
</div>
```

**Step 4 — Create the JS component:**

```javascript
// app/code/Vendor/Module/view/frontend/web/js/view/custom-widget.js
define([
    'uiComponent',
    'ko'
], function (Component, ko) {
    'use strict';

    return Component.extend({
        defaults: {
            greeting: 'Default greeting',
            maxItems: 10,
            isEnabled: false,
            template: 'Vendor_Module/custom-widget'  // KO template if needed
        },

        initialize: function () {
            this._super();

            // Config from XML is merged into this object automatically
            console.log('[CustomWidget] Greeting:', this.greeting);
            console.log('[CustomWidget] Max Items:', this.maxItems);
            console.log('[CustomWidget] Is Enabled:', this.isEnabled);

            return this;
        }
    });
});
```

**Step 5 — Flush caches and static content:**

```bash
bin/magento cache:clean
bin/magento cache:flush

# In developer mode, static content deploys automatically
# In production mode:
bin/magento setup:static-content:deploy
```

### 9.3 Verify in Browser DevTools

**What to check in the Network tab:**
1. Open DevTools → **Network** tab → filter by `JS`
2. Navigate to your target page (e.g., homepage for `cms_index_index`)
3. Search for `custom-widget` or `product-page-init` in the network requests
4. Confirm the file **does** load on the target page
5. Navigate to a different page (e.g., product page) and confirm it **does NOT** load

**What to check in the Console tab:**
```javascript
// After your component initializes, check the registry
require(['uiRegistry'], function (registry) {
    // List all registered UI components
    console.log(registry.get('vendor-custom-widget'));
});
```

**What to check in the Elements tab:**
1. Find the DOM element with `data-mage-init`
2. Verify the JSON attribute contains your configuration from XML
3. Confirm the component key matches your RequireJS module path

**Expected console output (from the hands-on above):**
```
[CustomWidget] Greeting: Hello from XML!
[CustomWidget] Max Items: 5
[CustomWidget] Is Enabled: true
```

---

## 10. The Full Data Flow — End-to-End Diagram

```
LAYOUT XML (cms_index_index.xml)
    |
    | <argument name="jsLayout" xsi:type="array">
    |   <item name="components">
    |     <item name="vendor-custom-widget">
    |       <item name="component">Vendor_Module/js/view/custom-widget</item>
    |       <item name="config">
    |         <item name="greeting">Hello from XML!</item>
    |
    v
PHP BLOCK (CustomWidget.php)
    |
    | getJsLayout() -> json_encode($this->jsLayout)
    | Returns: '{"components":{"vendor-custom-widget":{"component":"...","config":{...}}}}'
    |
    v
PHTML TEMPLATE (custom-widget.phtml)
    |
    | <div data-mage-init='{"Magento_Ui/js/core/app": JSLAYOUT_JSON}'>
    |
    v
BROWSER - HTML RENDERED
    |
    | mage/apply/scripts.js scans data-mage-init attributes
    |
    v
RequireJS loads Magento_Ui/js/core/app
    |
    | app() reads "components" tree
    |
    v
RequireJS loads Vendor_Module/js/view/custom-widget
    |
    | Component.extend() called with config from XML
    | this.greeting = "Hello from XML!"
    |
    v
COMPONENT INITIALIZED & REGISTERED IN uiRegistry
```

---

## 11. Common Mistakes & Gotchas

### Mistake 1: Using a file path instead of a RequireJS module path

```xml
<!-- WRONG - this is a file path -->
<item name="component" xsi:type="string">
    app/code/Vendor/Module/view/frontend/web/js/view/custom-widget.js
</item>

<!-- CORRECT - this is a RequireJS module ID -->
<item name="component" xsi:type="string">
    Vendor_Module/js/view/custom-widget
</item>
```

### Mistake 2: Forgetting `xsi:type` on `<item>` elements

```xml
<!-- WRONG - missing xsi:type -->
<item name="greeting">Hello</item>

<!-- CORRECT -->
<item name="greeting" xsi:type="string">Hello</item>
```

### Mistake 3: Using `<head><script>` expecting it to pass config

```xml
<!-- This only loads the file — it does NOT pass any config to it -->
<head>
    <script src="Vendor_Module::js/my-widget.js"/>
</head>
<!-- To pass config, you need data-mage-init or jsLayout -->
```

### Mistake 4: Not flushing layout cache after XML changes

```bash
# Always run after layout XML changes
bin/magento cache:clean layout
# Or clean all caches
bin/magento cache:flush
```

### Mistake 5: `jsLayout` not rendering because `getJsLayout()` is not called

```php
<?php
// WRONG - manually trying to output config
echo json_encode($block->getData('jsLayout'));

// CORRECT - use the inherited method which handles encoding
echo $block->getJsLayout();
?>
```

### Mistake 6: Using `jsLayout` outside of blocks that extend `Template`

The `getJsLayout()` method comes from `Magento\Framework\View\Element\Template`. If your block extends a different base (e.g., `AbstractBlock`), you need to implement it yourself or switch base class.

**Exam focus:** `jsLayout` is a layout XML argument processed by the `Template` block class. It is **not** a Magento framework keyword — it is a convention used by blocks that call `getJsLayout()`.

---

## Quick-Reference Checklist

### Layout XML + JS Loading
- [ ] `<head><script src="Vendor_Module::js/file.js"/>` — loads a JS file on pages matching the layout handle
- [ ] The `src` value uses **RequireJS module path syntax** (`Module::` notation), not a raw file path
- [ ] `<head><link>` is for CSS; `<head><script>` is for JavaScript
- [ ] `<remove src="...">` removes a previously declared JS/CSS resource
- [ ] Layout handle filename (`catalog_product_view.xml`) determines which pages the script loads on

### `data-mage-init`
- [ ] HTML data attribute placed on a DOM element in a `.phtml` template
- [ ] JSON value format: `{"requirejs/module/path": {config object}}`
- [ ] The component is **bound to the DOM element** it is declared on
- [ ] Parsed automatically on page load by `mage/apply/scripts.js`
- [ ] For dynamically injected HTML, call `mage/apply/main.apply()` manually
- [ ] Always use `escapeHtmlAttr(json_encode(...))` when outputting dynamic config

### `jsLayout` Argument
- [ ] Declared as `<argument name="jsLayout" xsi:type="array">` inside a `<block>`
- [ ] Uses nested `<item>` elements with `xsi:type` of `array`, `string`, `boolean`, or `number`
- [ ] Accessed in templates via `$block->getJsLayout()` which returns **JSON-encoded string**
- [ ] Primary use case: configuring UI Components from Layout XML, especially in **checkout**
- [ ] `getJsLayout()` is inherited from `Magento\Framework\View\Element\Template`

### `Magento_Ui/js/core/app`
- [ ] The **UI Component bootstrapper/factory** — not a widget
- [ ] Invoked via `data-mage-init` or `x-magento-init` with the `jsLayout` JSON as its config
- [ ] Reads the `components` tree and instantiates each declared component
- [ ] Each component is loaded via **RequireJS** using the `component` key value
- [ ] Registers instantiated components in the **uiRegistry**
- [ ] Uses **Knockout.js** for DOM binding

### `<item name="component">` Mapping
- [ ] Value is a **RequireJS module ID** (e.g., `Vendor_Module/js/view/my-component`)
- [ ] Resolves to `view/frontend/web/js/view/my-component.js` in the module directory
- [ ] Config sub-items (`<item name="config">` children) are merged into the component's `defaults`
- [ ] `uiComponent` is a shorthand alias for `Magento_Ui/js/lib/core/collection`

### Static vs Dynamic Initialization
- [ ] **Static**: `data-mage-init` in server-rendered HTML — parsed once on `DOMContentLoaded`
- [ ] **Dynamic**: `mage/apply/main.apply()` called after injecting new HTML into the DOM
- [ ] Static init is automatic; dynamic init must be **explicitly triggered** in JavaScript

### The Data Flow (for exam recall)
- [ ] XML → Block (PHP) → Template (`.phtml`) → HTML attribute → RequireJS → JS Component
- [ ] `jsLayout` XML argument → `getJsLayout()` PHP → JSON string in HTML → `Magento_Ui/js/core/app` reads it
- [ ] `<item name="component">` in XML → RequireJS module path → JavaScript file loaded and instantiated

### Debugging Checklist
- [ ] Flush layout cache after every Layout XML change: `bin/magento cache:clean layout`
- [ ] Check Network tab in DevTools: confirm JS file loads only on target page
- [ ] Check Console: look for RequireJS errors (mistyped module paths)
- [ ] Check Elements tab: verify `data-mage-init` attribute contains correct JSON
- [ ] Use `require(['uiRegistry'], fn)` in console to inspect registered UI components
