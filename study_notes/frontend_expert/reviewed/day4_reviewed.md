# Day 4 — Layout XML Instructions & Page Layouts

## Table of Contents

1. [Why Layout XML Matters](#1-why-layout-xml-matters)
2. [Layout XML Architecture Overview](#2-layout-xml-architecture-overview)
3. [Layout Handle Types](#3-layout-handle-types)
4. [Core Layout XML Instructions](#4-core-layout-xml-instructions)
   - [4.1 `<block>`](#41-block)
   - [4.2 `<container>`](#42-container)
   - [4.3 `<referenceBlock>`](#43-referenceblock)
   - [4.4 `<referenceContainer>`](#44-referencecontainer)
   - [4.5 `<move>`](#45-move)
   - [4.6 `<remove>`](#46-remove)
   - [4.7 `<update>`](#47-update)
5. [Block Arguments & Data Types](#5-block-arguments--data-types)
6. [The `<page>` Root Element](#6-the-page-root-element)
7. [Creating New Page Layouts](#7-creating-new-page-layouts)
8. [Registering Layouts in `layouts.xml`](#8-registering-layouts-in-layoutsxml)
9. [The `cacheable="false"` Attribute](#9-the-cacheablefalse-attribute)
10. [Hands-On: Custom 2-Column Page Layout](#10-hands-on-custom-2-column-page-layout)
11. [Hands-On: Adding a Block via Layout XML](#11-hands-on-adding-a-block-via-layout-xml)
12. [Inspecting Active Layout Handles](#12-inspecting-active-layout-handles)
13. [Layout XML Load Order & Merge Rules](#13-layout-xml-load-order--merge-rules)
14. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Why Layout XML Matters

Layout XML is the **declarative structural layer** of every Magento page. Instead of writing PHP to build a page's block tree, you express structure and behaviour in XML files that Magento merges at runtime.

- **Exam weight: ~22%** of the Adobe Commerce Developer exam
- Controls everything visible on a page: blocks, containers, template assignments, argument injection
- Works the same in Magento Open Source and Adobe Commerce
- Every theme, module, and page-type can contribute layout instructions

> **Exam focus:** Layout XML is *declarative* — it describes *what* the page structure should look like, not *how* to render it. PHP observers and plugins are *imperative*; layout XML is *declarative*.

---

## 2. Layout XML Architecture Overview

```
request URL
     |
     v
Front Controller
     |
     v
Action/Controller  -------> identifies page type handle (e.g. catalog_product_view)
     |
     v
Layout Object  <-- collects all XML files for active handles from:
     |                 - Magento core modules (app/code/Magento/*/view/frontend/layout/)
     |                 - Custom modules    (app/code/Vendor/Module/view/frontend/layout/)
     |                 - Theme overrides   (app/design/frontend/Vendor/Theme/
     |                                        Magento_Catalog/layout/catalog_product_view.xml)
     v
Merged XML tree  --> Block tree (PHP objects)  --> HTML output
```

### File Location Rules

| Context | Path pattern |
|---|---|
| Module layout file | `app/code/Vendor/Module/view/frontend/layout/<handle>.xml` |
| Theme layout override | `app/design/frontend/Vendor/Theme/Vendor_Module/layout/<handle>.xml` |
| Theme page layout | `app/design/frontend/Vendor/Theme/Magento_Theme/page_layout/<name>.xml` |
| Page layout registration | `app/design/frontend/Vendor/Theme/Magento_Theme/layouts.xml` |

> **Exam focus:** Theme layout files live inside a **module subdirectory** (`Vendor_Module/layout/`), *not* a flat `layout/` folder at the theme root. A flat `layout/` folder does not exist in the theme structure.

---

## 3. Layout Handle Types

A **layout handle** is the XML file name (without `.xml`) that Magento loads for a given request. Multiple handles can be active simultaneously.

### Handle Categories

| Category | Examples | When Active |
|---|---|---|
| **Default** | `default` | Every page request |
| **Page-specific / route-based** | `catalog_product_view`, `checkout_cart_index`, `cms_index_index` | Specific controller action |
| **Page type (entity)** | `catalog_product_view_type_simple`, `catalog_category_view_type_layered` | Specific entity type |
| **Custom handle** | `customer_logged_in`, any string you define | Programmatically added |

### Handle Naming Convention

```
<route_frontName>_<controller_folder>_<action_name>
```

**Examples:**
```
catalog_product_view       --> Magento_Catalog/view/frontend/layout/catalog_product_view.xml
checkout_cart_index        --> Magento_Checkout/view/frontend/layout/checkout_cart_index.xml
cms_page_view              --> Magento_Cms/view/frontend/layout/cms_page_view.xml
```

> **Exam focus:** The `default` handle is loaded on **every** page. Use it in `default.xml` to add something globally (e.g., a header block). Page-specific files only activate on matching routes.

### Multiple Active Handles Example

For a simple product page, the following handles are all active simultaneously:

```
default
catalog_product_view
catalog_product_view_type_simple
catalog_product_view_id_42          (entity-specific, added programmatically)
```

---

## 4. Core Layout XML Instructions

All instructions live inside a `<body>` element (within a `<page>` root), or directly inside a handle's root element for module-level layout files.

---

### 4.1 `<block>`

**Creates a new block** — an instance of a PHP class that renders a template.

```xml
<block class="Magento\Framework\View\Element\Template"
       name="my.custom.block"
       template="Vendor_Module::path/to/template.phtml"
       as="customAlias"
       before="-"
       after="header"
       cacheable="false"
       ifconfig="my/config/path">

    <!-- child blocks can be nested -->
    <block class="Magento\Framework\View\Element\Template"
           name="my.custom.block.child"
           template="Vendor_Module::child.phtml"/>

    <!-- arguments passed to the block instance -->
    <arguments>
        <argument name="css_class" xsi:type="string">my-class</argument>
    </arguments>
</block>
```

#### `<block>` Attributes

| Attribute | Required | Description |
|---|---|---|
| `class` | Yes | Fully-qualified PHP class name |
| `name` | Yes (recommended) | Unique identifier in the layout tree |
| `template` | No | `Vendor_Module::relative/path.phtml` |
| `as` | No | Alias used by parent template (`getChildHtml('as')`) |
| `before` | No | Position before named sibling; `-` = first |
| `after` | No | Position after named sibling; `-` = last |
| `cacheable` | No | Set `false` to disable full-page cache for the page |
| `ifconfig` | No | System config path; block only renders if config is truthy |
| `acl` | No | ACL resource; block only renders if customer has access |

> **Exam focus:** `before="-"` means **first** child; `after="-"` means **last** child. This is the opposite of what many people assume. The hyphen is a special sentinel value.

> **Exam focus:** `name` must be **unique across the entire merged layout**. Duplicate names cause the second declaration to silently overwrite the first.

---

### 4.2 `<container>`

**Creates a structural wrapper** — not a PHP object, just an HTML wrapper element or a logical grouping with no output of its own.

```xml
<container name="my.sidebar.wrapper"
           htmlTag="div"
           htmlClass="sidebar-wrapper"
           htmlId="sidebar-main"
           label="Sidebar Wrapper"
           before="-"
           after="-">
    <!-- child blocks/containers go here -->
</container>
```

#### `<container>` Attributes

| Attribute | Required | Description |
|---|---|---|
| `name` | Yes | Unique identifier |
| `label` | No | Human-readable label (admin display) |
| `htmlTag` | No | Wrapping HTML element (`div`, `aside`, `section`, etc.) |
| `htmlClass` | No | CSS class on the wrapper element |
| `htmlId` | No | ID attribute on the wrapper element |
| `before` | No | Positioning (same as `<block>`) |
| `after` | No | Positioning (same as `<block>`) |

> **Exam focus:** A `<container>` has **no PHP class and no template**. It cannot have `<arguments>`. If you need logic or a template, use `<block>`. Containers only render HTML output if `htmlTag` is set.

#### Block vs Container — Comparison Table

| Feature | `<block>` | `<container>` |
|---|---|---|
| PHP class | Yes (required) | No |
| Template file | Yes | No |
| `<arguments>` | Yes | No |
| Renders HTML | Via template | Only if `htmlTag` set |
| Logical grouping | Yes | Yes (primary purpose) |
| Child elements | Yes | Yes |

---

### 4.3 `<referenceBlock>`

**Modifies an existing block** that was already declared (in any loaded handle, including `default`). Does not create a new block.

```xml
<!-- Modify the block named "header.logo" declared elsewhere -->
<referenceBlock name="header.logo">
    <!-- Add a child block to it -->
    <block class="Magento\Framework\View\Element\Template"
           name="my.logo.badge"
           template="Vendor_Module::logo/badge.phtml"/>

    <!-- Override its template -->
    <action method="setTemplate">
        <argument name="template" xsi:type="string">Vendor_Module::logo.phtml</argument>
    </action>

    <!-- Change arguments -->
    <arguments>
        <argument name="logo_width" xsi:type="number">200</argument>
    </arguments>
</referenceBlock>
```

> **Exam focus:** `<referenceBlock>` requires the block with the given `name` to **already exist** in the layout. If the name is wrong, Magento silently ignores the reference (or logs a warning). No exception is thrown.

> **Exam focus:** You can **add child blocks/containers** inside a `<referenceBlock>` — this is the most common use case. You can also change `<arguments>` or call `<action>` methods.

---

### 4.4 `<referenceContainer>`

Identical purpose to `<referenceContainer>` but targets a `<container>`.

```xml
<!-- Add a block to the "content" container defined in 1column.xml -->
<referenceContainer name="content">
    <block class="Vendor\Module\Block\MyBlock"
           name="my.content.block"
           template="Vendor_Module::content/myblock.phtml"/>
</referenceContainer>
```

Common built-in container names from core page layouts:

| Container Name | Description |
|---|---|
| `root` | Top-level container |
| `head.additional` | `<head>` additions (declared as a **block**, not a container — use `<referenceBlock name="head.additional">`) |
| `after.body.start` | Right after `<body>` |
| `page.wrapper` | Outer page wrapper |
| `header.container` | Site header area |
| `content` | Main content area |
| `sidebar.main` | Primary sidebar |
| `sidebar.additional` | Secondary sidebar |
| `footer-container` | Footer area |
| `before.body.end` | Just before `</body>` |

> **Exam focus:** The most common instruction in theme customisation is `<referenceContainer name="content">` to add content blocks. Know the standard container names by heart.

---

### 4.5 `<move>`

**Relocates** an existing block or container to a different parent. Does not create or delete — only repositions.

```xml
<move element="my.block.name"
      destination="new.parent.container"
      as="newAlias"
      before="-"
      after="some.sibling"/>
```

#### `<move>` Attributes

| Attribute | Required | Description |
|---|---|---|
| `element` | Yes | Name of the block/container to move |
| `destination` | Yes | Name of the target parent container/block |
| `as` | No | New alias in the new parent |
| `before` | No | Position in new parent |
| `after` | No | Position in new parent |

> **Exam focus:** `<move>` is the **only instruction that changes the parent** of an existing element. You cannot achieve this with `<referenceBlock>` or `<referenceContainer>`. Common use: moving the breadcrumbs block from content to a custom container.

---

### 4.6 `<remove>`

**Removes** a block or container from the layout tree entirely. The element still exists in memory but will not render.

```xml
<!-- Remove the compare products sidebar block -->
<remove name="catalog.compare.sidebar"/>
```

> **Exam focus:** `<remove>` is **permanent within the current page's merged layout**. Once removed, no subsequent `<referenceBlock>` on that name will restore it — but adding a *new* `<block>` with the same name is possible.

> **Exam focus:** `<remove>` accepts only the `name` attribute. There is no `destination` or `before/after`.

**Alternative — using `display` attribute** (less destructive):

```xml
<referenceBlock name="catalog.compare.sidebar" display="false"/>
```

`display="false"` hides the block but keeps it in the tree (child blocks still initialise). `<remove>` is more performant as the block is never instantiated.

---

### 4.7 `<update>`

**Includes another layout handle** into the current page's handle set, causing that handle's XML to be merged.

```xml
<!-- Inside catalog_product_view.xml, include another handle's instructions -->
<update handle="catalog_product_view_type_simple"/>
```

> **Exam focus:** `<update>` is how Magento composes complex pages from multiple handles. When you call `$this->addHandle('custom_handle')` in PHP, it's the programmatic equivalent. `<update>` inside XML does the same thing declaratively.

---

## 5. Block Arguments & Data Types

Arguments pass data into a block's `_data` array, accessible via `$block->getData('key')` or magic getters (`$block->getCssClass()`).

### Syntax

```xml
<block class="Vendor\Module\Block\Example" name="example.block">
    <arguments>
        <argument name="css_class"       xsi:type="string">my-class</argument>
        <argument name="item_count"      xsi:type="number">10</argument>
        <argument name="is_visible"      xsi:type="boolean">true</argument>
        <argument name="config_path"     xsi:type="options">Vendor\Module\Model\Config\Source</argument>
        <argument name="helper_data"     xsi:type="helper"
                  helper="Vendor\Module\Helper\Data"
                  method="getConfig"/>
        <argument name="url"             xsi:type="url" path="catalog/product/view">
            <param name="id">42</param>
        </argument>
        <argument name="extra_options"   xsi:type="array">
            <item name="key1" xsi:type="string">value1</item>
            <item name="key2" xsi:type="number">99</item>
        </argument>
    </arguments>
</block>
```

### `xsi:type` Values

| Type | Description | PHP result |
|---|---|---|
| `string` | Plain text value | `string` |
| `number` | Numeric value | `string` (cast as needed) |
| `boolean` | `true` or `false` | `bool` |
| `array` | Nested `<item>` elements | `array` |
| `options` | Reference to a source model | Result of `toOptionArray()` |
| `helper` | Reference to a helper method | Return value of the method |
| `url` | Generates a Magento URL | URL `string` |
| `object` | Instantiates a class | Object instance |
| `null` | Null value | `null` |

> **Exam focus:** The namespace declaration `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"` is required on the root element for `xsi:type` to be valid.

> **Exam focus:** `xsi:type="array"` uses `<item>` children, not `<argument>` children. Each `<item>` also needs its own `xsi:type`.

### Accessing Arguments in Templates

```php
// In a .phtml template file:

// Method 1: getData
$cssClass = $block->getData('css_class');

// Method 2: magic getter (camelCase from underscore_key)
$cssClass = $block->getCssClass();       // css_class
$itemCount = $block->getItemCount();     // item_count

// Method 3: hasData check first
if ($block->hasData('is_visible') && $block->getIsVisible()) {
    // render something
}
```

---

## 6. The `<page>` Root Element

In **page configuration files** (handle XML files such as `cms_index_index.xml`, `catalog_product_view.xml`), the root element is `<page>`. Do **not** confuse these with page layout files — page layout files (1column.xml, 2columns-left.xml, etc.) use `<layout>` as root with `page_layout.xsd`.

```xml
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      layout="2columns-left"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <update handle="customer_account"/>
    <body>
        <referenceContainer name="content">
            <block class="Vendor\Module\Block\Account\Dashboard"
                   name="customer_account_dashboard"
                   template="Vendor_Module::account/dashboard.phtml"/>
        </referenceContainer>
    </body>
</page>
```

### `<page>` Attributes

| Attribute | Description |
|---|---|
| `layout` | Specifies which page layout (structural template) to use |
| `xmlns:xsi` | XML namespace for schema validation |
| `xsi:noNamespaceSchemaLocation` | XSD schema URI for IDE validation |

### Page Configuration Structure

```
<page>
  |-- <html>         -- html element attributes
  |-- <head>         -- <title>, <css>, <script>, <link>, <meta>
  |-- <body>         -- all structural instructions
  |-- <update>       -- include additional handles
```

### `<head>` Instructions

```xml
<page ...>
    <head>
        <title>My Custom Page</title>
        <css src="Vendor_Module::css/custom.css"/>
        <script src="Vendor_Module::js/custom.js"/>
        <link rel="canonical" src="https://example.com"/>
        <meta name="robots" content="NOINDEX,NOFOLLOW"/>
        <remove src="Magento_Theme::js/theme.js"/>
    </head>
    <body>
        <!-- layout instructions -->
    </body>
</page>
```

> **Exam focus:** CSS and JS added via `<head>` instructions in layout XML are **module-relative**: `Vendor_Module::path/file.css` — not theme-relative. The module context determines where Magento looks for the file.

---

## 7. Creating New Page Layouts

A **page layout** defines the *structural skeleton* of a page (how many columns, where the main content area is, etc.). It is separate from page configuration (which populates that skeleton with blocks).

### File Location

```
app/design/frontend/Vendor/Theme/
  Magento_Theme/
    page_layout/
      2columns-custom.xml    <-- your new page layout
    layouts.xml              <-- registers all page layouts for this theme
```

### Page Layout XML Anatomy

Page layout files use a **different, simpler schema** than page configuration files:

```xml
<?xml version="1.0"?>
<layout xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_layout.xsd">

    <!-- Must reference an existing page layout to extend -->
    <update handle="2columns-left"/>

</layout>
```

Or define a full structure from scratch:

```xml
<?xml version="1.0"?>
<layout xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_layout.xsd">

    <update handle="empty"/>

    <referenceContainer name="page.wrapper">
        <container name="header.container"
                   htmlTag="header"
                   htmlClass="page-header"
                   label="Page Header"
                   after="-"/>

        <container name="page.top"
                   htmlTag="div"
                   htmlClass="page-top"
                   label="Page Top"
                   after="header.container"/>

        <container name="main.content.wrapper"
                   htmlTag="div"
                   htmlClass="columns custom-layout"
                   label="Main Content Wrapper"
                   after="page.top">

            <container name="main"
                       htmlTag="main"
                       htmlClass="column main"
                       label="Main Content Area">
                <container name="content" label="Content"/>
            </container>

            <container name="sidebar.custom"
                       htmlTag="aside"
                       htmlClass="column sidebar-custom"
                       label="Custom Sidebar"/>
        </container>

        <container name="footer-container"
                   htmlTag="footer"
                   htmlClass="page-footer"
                   label="Page Footer"
                   after="main.content.wrapper"/>
    </referenceContainer>

</layout>
```

> **Exam focus:** Page layout files use the schema `page_layout.xsd`, **not** `page_configuration.xsd`. The root element is `<layout>`, not `<page>`. This distinction is frequently tested.

> **Exam focus:** Page layout files can **only contain structural containers**. They cannot contain `<block>` elements — those belong in page configuration files (handle XML files).

### Schema Comparison

| File type | Root element | Schema | Contains blocks? |
|---|---|---|---|
| Page layout | `<layout>` | `page_layout.xsd` | No — containers only |
| Page configuration (handle) | `<page>` | `page_configuration.xsd` | Yes |
| Generic layout | `<layout>` | `layout_generic.xsd` | Yes |

---

## 8. Registering Layouts in `layouts.xml`

Every page layout must be registered in `layouts.xml` to appear in the admin **Design** dropdown and be selectable per page/category.

### File Location

```
app/design/frontend/Vendor/Theme/Magento_Theme/layouts.xml
```

### Syntax

```xml
<?xml version="1.0"?>
<page_layouts xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:noNamespaceSchemaLocation="urn:magento:framework:View/PageLayout/etc/layouts.xsd">

    <!-- Register the built-in layouts (if not inheriting from parent theme) -->
    <layout id="empty">
        <label translate="true">Empty</label>
    </layout>
    <layout id="1column">
        <label translate="true">1 column</label>
    </layout>
    <layout id="2columns-left">
        <label translate="true">2 columns with left bar</label>
    </layout>
    <layout id="2columns-right">
        <label translate="true">2 columns with right bar</label>
    </layout>
    <layout id="3columns">
        <label translate="true">3 columns</label>
    </layout>

    <!-- Register your custom layout -->
    <layout id="2columns-custom">
        <label translate="true">2 Columns - Custom Sidebar</label>
    </layout>

</page_layouts>
```

> **Exam focus:** The `id` attribute in `<layout id="...">` **must exactly match** the filename of the page layout XML file (without `.xml` extension). `id="2columns-custom"` → file `2columns-custom.xml`.

> **Exam focus:** If your theme extends another theme (e.g., Luma), existing layouts from the parent are automatically available. You only need to add *new* layouts in your `layouts.xml`.

---

## 9. The `cacheable="false"` Attribute

Adding `cacheable="false"` to any `<block>` element has **page-wide** consequences.

```xml
<!-- This single attribute disables FPC for the ENTIRE page -->
<block class="Vendor\Module\Block\PersonalizedContent"
       name="personalized.block"
       template="Vendor_Module::personal.phtml"
       cacheable="false"/>
```

### What It Does

```
Normal page (all blocks cacheable):
  Request -> FPC hit -> Serve cached HTML (fast)

Page with cacheable="false" block:
  Request -> FPC MISS (always) -> Full PHP render every request (slow)
```

### Impact Chain

| Component | Effect |
|---|---|
| Full Page Cache (Varnish/built-in) | Entire page **bypasses** FPC |
| Block cache | Individual block still uses block cache |
| Session | Page can now access session data directly |
| Performance | Significant degradation under load |

> **Exam focus:** `cacheable="false"` on **any single block** disables Full Page Cache for the **entire page**, not just that block. This is one of the most important and frequently tested facts about this attribute.

> **Exam focus:** The correct alternative for personalised content is **ESI (Edge Side Includes)** with Varnish or **private content** via the `customer-data` JS module and CustomerData sections — neither requires `cacheable="false"`.

### When `cacheable="false"` is Appropriate

```
- Development/debugging only
- Admin pages (always uncached)
- Pages that genuinely cannot be cached (extremely rare)
- Never on high-traffic storefront pages
```

### Detecting `cacheable="false"` in Your Layout

```bash
# Search all layout files for cacheable="false"
grep -r 'cacheable="false"' app/design/ app/code/

# Check if a specific page is being cached
# Look for X-Cache header in browser DevTools Network tab:
# X-Cache: HIT  = served from cache
# X-Cache: MISS = not cached (could be cacheable=false)
```

---

## 10. Hands-On: Custom 2-Column Page Layout

### Goal: Create a 2-column layout with a narrower right sidebar

#### Step 1: Create the page layout file

```
app/design/frontend/Vendor/MyTheme/Magento_Theme/page_layout/2columns-right-narrow.xml
```

```xml
<?xml version="1.0"?>
<!--
/**
 * Custom 2-column layout with a narrower right sidebar
 * Based on Magento's 2columns-right layout
 */
-->
<layout xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_layout.xsd">

    <!-- Inherit the standard 2columns-right structure -->
    <update handle="2columns-right"/>

    <!-- We can add container modifications here -->
    <referenceContainer name="sidebar.main">
        <!-- Override HTML class for CSS targeting -->
    </referenceContainer>

</layout>
```

#### Step 2: Register in `layouts.xml`

```
app/design/frontend/Vendor/MyTheme/Magento_Theme/layouts.xml
```

```xml
<?xml version="1.0"?>
<page_layouts xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:noNamespaceSchemaLocation="urn:magento:framework:View/PageLayout/etc/layouts.xsd">
    <layout id="2columns-right-narrow">
        <label translate="true">2 Columns Right - Narrow Sidebar</label>
    </layout>
</page_layouts>
```

#### Step 3: Apply CSS via theme LESS

```less
// app/design/frontend/Vendor/MyTheme/web/css/source/_layouts.less

.page-layout-2columns-right-narrow {
    .columns {
        .sidebar-main {
            width: 20%;  // narrower than the default 25%
        }
        .column.main {
            width: 78%;
        }
    }
}
```

> **Exam focus:** Magento adds a `page-layout-<id>` CSS class to `<body>`. For `id="2columns-right-narrow"`, the body class is `page-layout-2columns-right-narrow`. Use this for CSS targeting.

#### Step 4: Deploy and verify

```bash
# Clear generated files and redeploy static content
bin/magento cache:clean
bin/magento setup:static-content:deploy -f

# Verify the layout appears in Admin > Catalog > Pages > Design > Layout
```

---

## 11. Hands-On: Adding a Block via Layout XML

### Goal: Add a promotional banner block to the CMS homepage

#### Step 1: Create the Block PHP class

```php
<?php
// app/code/Vendor/Module/Block/PromoBanner.php

namespace Vendor\Module\Block;

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;

class PromoBanner extends Template
{
    public function __construct(
        Context $context,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    /**
     * Get banner title from layout argument
     */
    public function getBannerTitle(): string
    {
        return (string) $this->getData('banner_title');
    }

    /**
     * Get banner URL from layout argument
     */
    public function getBannerUrl(): string
    {
        return (string) $this->getData('banner_url');
    }
}
```

#### Step 2: Create the template

```php
<?php
// app/code/Vendor/Module/view/frontend/templates/promo/banner.phtml
/** @var \Vendor\Module\Block\PromoBanner $block */
?>
<div class="promo-banner <?= $block->escapeHtmlAttr($block->getCssClass()) ?>">
    <a href="<?= $block->escapeUrl($block->getBannerUrl()) ?>">
        <span class="promo-banner__title">
            <?= $block->escapeHtml($block->getBannerTitle()) ?>
        </span>
    </a>
</div>
```

#### Step 3: Create the layout XML file

This targets the CMS homepage specifically:

```
app/code/Vendor/Module/view/frontend/layout/cms_index_index.xml
```

```xml
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <!--
            Add promo banner to the content container,
            positioned BEFORE all other content blocks
        -->
        <referenceContainer name="content">
            <block class="Vendor\Module\Block\PromoBanner"
                   name="vendor.module.promo.banner"
                   template="Vendor_Module::promo/banner.phtml"
                   before="-">
                <arguments>
                    <argument name="banner_title" xsi:type="string">Summer Sale — Up to 50% Off!</argument>
                    <argument name="banner_url"   xsi:type="url" path="catalog/category/view">
                        <param name="id">15</param>
                    </argument>
                    <argument name="css_class"    xsi:type="string">promo-banner--summer</argument>
                </arguments>
            </block>
        </referenceContainer>
    </body>
</page>
```

#### Step 4: Enable and test

```bash
# Register the module (if new)
bin/magento module:enable Vendor_Module
bin/magento setup:upgrade

# Flush cache
bin/magento cache:flush

# Optional: watch layout merge logs
tail -f var/log/system.log
```

#### Step 5: Verify via template hints

```
Admin > Stores > Configuration > Advanced > Developer
  > Debug > Enabled Template Path Hints for Storefront = Yes
```

Then visit the homepage — you should see a red overlay on the banner block showing the template path.

---

## 12. Inspecting Active Layout Handles

### Method 1: Magento Built-in Layout Debug Hint

```
Admin > Stores > Configuration > Advanced > Developer > Debug
  > Enabled Template Path Hints for Storefront = Yes
  > Add Block Names to Hints = Yes
```

View source on any page and search for `<!--` comments — Magento adds block names as HTML comments when hints are active.

### Method 2: `bin/magento dev:layout:xml`

> Note: This command was available in some Magento versions/extensions but is not a core command in all releases. For the exam, focus on the config-based approach above.

```bash
# Some third-party tools provide this — check your install:
bin/magento list | grep layout

# Core alternative: enable layout debug logging
bin/magento config:set dev/debug/template_hints_storefront 1
bin/magento config:set dev/debug/template_hints_blocks 1
bin/magento cache:clean
```

### Method 3: Programmatic Handle Inspection (PHP)

```php
<?php
// In a plugin or observer — for debugging only
/** @var \Magento\Framework\View\Layout $layout */
$handles = $layout->getUpdate()->getHandles();
// Returns: ['default', 'cms_index_index', 'cms_page_view', ...]

// Log to debug
$this->logger->debug('Active handles: ' . implode(', ', $handles));
```

### Method 4: Browser + Dev Tools

```
1. Open browser DevTools -> Network tab
2. Reload the page
3. Look for the X-Magento-Tags response header
   (visible when Varnish/FPC is active)
4. Look at page source for <!-- START ... --> comments
   (visible when template hints are enabled)
```

### Method 5: URL-based Handle

```
Append ?debug=layout to any URL (with Mage developer mode):
https://example.com/catalog/product/view/id/1?debug=layout

# This may output handle XML depending on installed debugging tools
```

### Useful Debug Commands

```bash
# Check which files contribute to a handle
find app/ -name "cms_index_index.xml" -path "*/layout/*"
find app/ -name "default.xml" -path "*/layout/*"

# Developer mode shows layout merge errors in browser
bin/magento deploy:mode:set developer
```

> **Note:** `bin/magento dev:layout:xml` is **not a core Magento command** — it does not exist in a standard 2.4.x installation. Do not expect it on the exam or in production environments. Use template hints and `find` to inspect layout files instead.

---

## 13. Layout XML Load Order & Merge Rules

Understanding the merge order is critical for predicting which XML "wins" when conflicts arise.

### Load Order (First to Last)

```
1. Module layout files (alphabetical by module name)
   app/code/Magento/Catalog/view/frontend/layout/default.xml
   app/code/Magento/Checkout/view/frontend/layout/default.xml
   ...
   app/code/Vendor/Module/view/frontend/layout/default.xml

2. Theme layout files (child theme after parent theme)
   app/design/frontend/ParentVendor/ParentTheme/Magento_Catalog/layout/default.xml
   app/design/frontend/Vendor/MyTheme/Magento_Catalog/layout/default.xml
```

### Merge Rules

```
Rule 1: SAME NAME = OVERWRITE
  If two <block name="foo"> declarations exist, the LAST one wins
  (but children/arguments from earlier declarations may be partially merged)

Rule 2: <referenceBlock> EXTENDS, not replaces
  Adding a <referenceBlock name="foo"> adds to/modifies "foo" — never replaces

Rule 3: Theme files override module files
  app/design/.../layout/ files are loaded AFTER app/code/.../layout/ files
  Theme always wins for the same handle

Rule 4: Child theme overrides parent theme
  If you extend Luma, your theme files load after Luma's files

Rule 5: <remove> is final
  Once removed, <referenceBlock> cannot un-remove it
```

### Override vs Extend

```
EXTEND (preferred):
  Module declares block "foo"
  Your theme's referenceBlock adds/modifies it
  -> Both exist, yours layered on top

OVERRIDE (use sparingly):
  Copy module's layout file to theme directory with same path
  Your file COMPLETELY REPLACES the module's file for that handle
  -> Only your instructions exist; all module defaults are gone
```

> **Exam focus:** When you place a layout file in your theme at `Magento_Catalog/layout/catalog_product_view.xml`, it **extends** the module's file — it does NOT replace it. The files are **merged**. To truly replace (dangerous!), you would need to `<remove>` everything first.

---

## Quick-Reference Checklist

### Layout XML Instructions

- [ ] `<block>` — creates a block instance; requires `class` and (recommended) `name`; `template` is optional
- [ ] `<container>` — structural wrapper; no PHP class, no template, no `<arguments>`; uses `htmlTag`, `htmlClass`, `htmlId`
- [ ] `<referenceBlock name="...">` — modifies/extends an existing block; does NOT create a new one
- [ ] `<referenceContainer name="...">` — adds children or modifies an existing container
- [ ] `<move element="..." destination="...">` — relocates element to new parent; only way to change parent
- [ ] `<remove name="...">` — permanently removes element from layout; cannot be reversed by `<referenceBlock>`
- [ ] `<update handle="...">` — includes another handle's XML into the current page
- [ ] `before="-"` = **first**; `after="-"` = **last** (hyphen is sentinel value)

### Handle Types

- [ ] `default` handle = loaded on **every** page
- [ ] Page-specific handle = `<route>_<controller>_<action>` (e.g., `catalog_product_view`)
- [ ] Multiple handles can be active simultaneously on one page
- [ ] `<update handle="...">` in XML = same as `$layout->addHandle()` in PHP

### Block Arguments

- [ ] Arguments live in `<arguments><argument name="..." xsi:type="...">` 
- [ ] Types: `string`, `number`, `boolean`, `array`, `url`, `helper`, `object`, `options`, `null`
- [ ] `array` uses `<item>` children, each with their own `xsi:type`
- [ ] Access in template: `$block->getData('key')` or `$block->getKey()` (magic getter)
- [ ] `xsi:type` requires `xmlns:xsi` namespace on root element

### Page Layouts

- [ ] Page layout files → `Magento_Theme/page_layout/<name>.xml`
- [ ] Root element is `<layout>` (not `<page>`)
- [ ] Schema: `page_layout.xsd` (not `page_configuration.xsd`)
- [ ] Page layouts contain **containers only** — no `<block>` elements
- [ ] Must be registered in `Magento_Theme/layouts.xml` with matching `id`
- [ ] `<layout id="name">` `id` must match filename exactly (without `.xml`)
- [ ] Magento adds `page-layout-<id>` CSS class to `<body>` element

### `<page>` Root Element

- [ ] Used in handle XML files (page configuration); schema: `page_configuration.xsd`
- [ ] `layout="..."` attribute sets the active page layout skeleton
- [ ] Contains `<html>`, `<head>`, `<body>`, `<update>` sections
- [ ] `<head>` CSS/JS paths are module-relative: `Vendor_Module::path/file.css`

### `cacheable="false"`

- [ ] One `cacheable="false"` block **disables Full Page Cache for the entire page**
- [ ] Affects only FPC (Varnish / built-in); block cache still works
- [ ] Never use on high-traffic storefront pages
- [ ] Alternative: private content via `customer-data` JS sections

### File Locations

- [ ] Module layouts: `app/code/Vendor/Module/view/frontend/layout/<handle>.xml`
- [ ] Theme layouts: `app/design/frontend/Vendor/Theme/Vendor_Module/layout/<handle>.xml`
- [ ] Page layouts: `app/design/frontend/Vendor/Theme/Magento_Theme/page_layout/<name>.xml`
- [ ] Layout registration: `app/design/frontend/Vendor/Theme/Magento_Theme/layouts.xml`

### Merge Order & Override Rules

- [ ] Module files load first; theme files load after → **theme always wins**
- [ ] Child theme files load after parent theme files
- [ ] Duplicate `name` → last declaration wins
- [ ] Theme layout files **extend** (merge with) module files — they do not replace them
- [ ] `<remove>` is irreversible within the merged layout

### Standard Container Names to Memorise

- [ ] `content` — main content area
- [ ] `sidebar.main` — primary sidebar
- [ ] `sidebar.additional` — secondary sidebar
- [ ] `header.container` — header area
- [ ] `footer-container` — footer area
- [ ] `before.body.end` — just before `</body>`
- [ ] `after.body.start` — just after `<body>`
- [ ] `head.additional` — additional `<head>` elements (**block**, not container — use `<referenceBlock name="head.additional">`)

### Debugging

- [ ] Enable template hints: Admin > Stores > Config > Advanced > Developer > Debug
- [ ] Block names in hints shows layout element names
- [ ] `bin/magento deploy:mode:set developer` exposes layout errors
- [ ] `grep -r 'cacheable="false"' app/` to find cache-busting blocks
- [ ] `find app/ -name "<handle>.xml" -path "*/layout/*"` to find all files for a handle
