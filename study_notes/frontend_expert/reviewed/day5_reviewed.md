# Day 5 — Extending vs Merging vs Overriding Layout XML

## Table of Contents
- [1. Overview & Why This Matters](#1-overview--why-this-matters)
- [2. Core Concepts: The Three Approaches](#2-core-concepts-the-three-approaches)
- [3. Layout File Resolution Order](#3-layout-file-resolution-order)
- [4. Extending / Merging Layout XML](#4-extending--merging-layout-xml)
- [5. Overriding Layout XML](#5-overriding-layout-xml)
- [6. `<remove>` vs Layout Overrides](#6-remove-vs-layout-overrides)
- [7. File Path Reference Table](#7-file-path-reference-table)
- [8. Hands-On Walkthroughs](#8-hands-on-walkthroughs)
- [9. Decision Framework: When to Use What](#9-decision-framework-when-to-use-what)
- [10. Common Pitfalls & Exam Traps](#10-common-pitfalls--exam-traps)
- [11. Quick-Reference Checklist](#11-quick-reference-checklist)

---

## 1. Overview & Why This Matters

Magento 2's layout XML system is the backbone of page structure. Every page is assembled from layout handles — XML files that define blocks, containers, and their relationships. Understanding *how* Magento loads and merges these files is critical for both development and the Adobe Commerce exam.

The system provides **two fundamentally different strategies**:

```
+---------------------------------------------------+
|            Layout XML Loading Strategies          |
+----------------------------+----------------------+
|       EXTENDING            |     OVERRIDING       |
|   (Merge / Additive)       |  (Replace / Clobber) |
|                            |                      |
| Multiple files with same   | One file completely  |
| handle are ALL loaded and  | replaces the source  |
| merged together            | file — nothing else  |
|                            | from that file loads |
+----------------------------+----------------------+
```

> **Exam focus:** The distinction between "merge" and "override" is one of the most tested concepts on the Adobe Commerce Developer exam. Be precise about which approach adds to existing XML vs replaces it entirely.

---

## 2. Core Concepts: The Three Approaches

### 2.1 The Terminology Clarified

The words "extending", "merging", and "overriding" are often used loosely. Here is the precise meaning for exam purposes:

| Term | Precise Meaning | File Placement |
|---|---|---|
| **Extending** | Adding a *new* layout XML file with the same handle name; Magento merges all matching files | Standard `layout/` directory |
| **Merging** | What Magento *does* automatically when it finds multiple files sharing a handle — not a developer action, it's an engine behavior | N/A (engine behavior) |
| **Overriding** | Placing a file in a special `override/` subdirectory, causing Magento to *skip* the original file entirely | `layout/override/base/` or `layout/override/theme/` |

> **Exam focus:** "Extending" and "merging" describe the same workflow from two angles — the developer extends, and the engine merges. "Overriding" is a completely separate mechanism requiring a specific directory.

### 2.2 Mental Model

```
EXTENDING/MERGING (Additive):
  Module A: catalog_product_view.xml  -->+
  Module B: catalog_product_view.xml  -->+---> Merged Result
  Theme:    catalog_product_view.xml  -->+

OVERRIDING (Replacement):
  Module A: catalog_product_view.xml  --> SKIPPED (replaced)
  Override: catalog_product_view.xml  --> USED INSTEAD
```

---

## 3. Layout File Resolution Order

Magento loads layout files in a precise, deterministic order. Understanding this order tells you *whose instruction wins* when there are conflicts.

### 3.1 Full Resolution Order (Low to High Priority)

```
Priority 1 (Lowest) — Base module layout files
    app/code/<Vendor>/<Module>/view/base/layout/

Priority 2 — Frontend module layout files
    app/code/<Vendor>/<Module>/view/frontend/layout/

Priority 3 — Parent theme layout files (walking up theme chain)
    app/design/frontend/<Vendor>/<ParentTheme>/<Vendor>_<Module>/layout/

Priority 4 — Current active theme layout files
    app/design/frontend/<Vendor>/<Theme>/<Vendor>_<Module>/layout/

Priority 5 (Highest) — Override files
    (module)  app/code/.../view/frontend/layout/override/base/
    (module)  app/code/.../view/frontend/layout/override/theme/<Vendor>/<Theme>/
    (theme)   app/design/frontend/<Vendor>/<Theme>/<Vendor>_<Module>/layout/override/base/
```

> **Exam focus:** Theme layout files have **higher priority** than module layout files during merging. Instructions in a theme's `catalog_product_view.xml` will override conflicting instructions in a module's `catalog_product_view.xml`.

### 3.2 The Merge Algorithm

When Magento processes all collected layout files for a given handle, it:

1. Collects ALL matching files in resolution order
2. Reads each file's XML instructions sequentially
3. Later instructions take precedence over earlier ones for the same target
4. Additive instructions (adding new blocks) stack cumulatively

```
File 1 (low priority):           File 2 (high priority):
  <referenceContainer             <referenceBlock name="header.links">
    name="content">                 <block class="..." name="my.new.block"/>
    <block ... name="A"/>         </referenceBlock>
  </referenceContainer>

Result after merge:
  content container has block A
  header.links block has my.new.block child
  (BOTH instructions applied)
```

---

## 4. Extending / Merging Layout XML

### 4.1 How It Works

When you create a layout XML file in a standard `layout/` directory with the same handle name as an existing file, Magento **automatically merges** them. No configuration is required. This is the **preferred approach** for most customizations.

### 4.2 Module Extension File Paths

```
app/code/<Vendor>/<Module>/view/base/layout/<handle>.xml
app/code/<Vendor>/<Module>/view/frontend/layout/<handle>.xml
app/code/<Vendor>/<Module>/view/adminhtml/layout/<handle>.xml
```

### 4.3 Theme Extension File Paths

```
app/design/frontend/<Vendor>/<Theme>/<Vendor>_<Module>/layout/<handle>.xml
```

> **Exam focus:** A theme's layout extension file lives inside a *vendor_module* subdirectory — e.g., `Magento_Catalog/layout/catalog_product_view.xml`. The directory name is always `VendorName_ModuleName` format.

### 4.4 XML Structure for Extension Files

Extension files use the **same root element** as original layout files:

```xml
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <!-- Your additive instructions go here -->
        <referenceContainer name="content">
            <block class="Magento\Framework\View\Element\Template"
                   name="my.vendor.custom.block"
                   template="MyVendor_MyModule::custom.phtml"
                   after="-"/>
        </referenceContainer>
    </body>
</page>
```

> **Exam focus:** Extension files must use valid schema. The `after="-"` attribute places the block at the end; `before="-"` places it at the beginning. Using an actual block name as `after` value places it after that specific block.

### 4.5 `<referenceContainer>` vs `<referenceBlock>`

| Element | Purpose | Used For |
|---|---|---|
| `<referenceContainer>` | Targets a container by name | Adding blocks inside a container |
| `<referenceBlock>` | Targets a block by name | Modifying block arguments, adding child blocks, changing template |

```xml
<!-- Correct: Adding a block to a container -->
<referenceContainer name="product.info.main">
    <block class="Vendor\Module\Block\MyBlock"
           name="my.new.block"
           template="Vendor_Module::my-template.phtml"/>
</referenceContainer>

<!-- Correct: Changing a block's template -->
<referenceBlock name="product.info.sku">
    <arguments>
        <argument name="template" xsi:type="string">
            Vendor_Module::new-sku.phtml
        </argument>
    </arguments>
</referenceBlock>
```

> **Exam focus:** You **cannot** add a block directly inside a `<referenceBlock>` as a sibling — only as a child. Containers are the correct target for adding new blocks as siblings to existing content.

---

## 5. Overriding Layout XML

### 5.1 How It Works

An override file completely **replaces** the source layout file. The original file is not loaded at all. This is a *destructive* operation — any content in the original file that you do not copy into your override will be lost.

```
Normal merge scenario:
  [Magento_Catalog/layout/catalog_product_view.xml]  LOADED
  [MyTheme/Magento_Catalog/layout/catalog_product_view.xml]  LOADED + MERGED

Override scenario:
  [Magento_Catalog/layout/catalog_product_view.xml]  *** SKIPPED ***
  [override file: catalog_product_view.xml]          LOADED INSTEAD
```

> **Exam focus:** Only the **directly targeted** source file is skipped. Other files that were already merged before the override point are NOT affected. If three modules all add to `catalog_product_view.xml`, overriding Module A's file does not remove Modules B and C's contributions.

### 5.2 Override Directory Paths — Module Context

Use these when customizing from **inside a module**:

```
# Override a BASE-area layout file (applies to all areas):
app/code/<Vendor>/<Module>/view/frontend/layout/override/base/<Vendor>_<Module>/<handle>.xml

# Override a layout file for a SPECIFIC THEME:
app/code/<Vendor>/<Module>/view/frontend/layout/override/theme/<ThemeVendor>/<ThemeName>/<Vendor>_<Module>/<handle>.xml
```

**Real example — module overriding base layout:**
```
app/code/MyVendor/MyModule/view/frontend/layout/override/base/
    Magento_Catalog/
        catalog_product_view.xml
```

**Real example — module overriding theme-specific layout:**
```
app/code/MyVendor/MyModule/view/frontend/layout/override/theme/
    Magento/
        luma/
            Magento_Catalog/
                catalog_product_view.xml
```

### 5.3 Override Directory Paths — Theme Context

Use these when customizing from **inside a theme**:

```
# Override a BASE-area layout file from within a theme:
app/design/frontend/<ThemeVendor>/<ThemeName>/<Vendor>_<Module>/layout/override/base/<handle>.xml

# Override a PARENT THEME's layout file from within a child theme:
app/design/frontend/<ThemeVendor>/<ThemeName>/<Vendor>_<Module>/layout/override/theme/<ParentThemeVendor>/<ParentThemeName>/<handle>.xml
```

**Real example — theme overriding base layout:**
```
app/design/frontend/MyVendor/mytheme/
    Magento_Catalog/
        layout/
            override/
                base/
                    catalog_product_view.xml
```

**Real example — child theme overriding parent theme layout:**
```
app/design/frontend/MyVendor/mytheme/
    Magento_Catalog/
        layout/
            override/
                theme/
                    Magento/
                        luma/
                            catalog_product_view.xml
```

> **Exam focus:** The directory structure for overrides is deeply nested. Know these paths cold. The keyword `override` always appears in the path, followed by either `base` or `theme`.

### 5.4 Complete Override File Structure

When creating an override, you must provide the **complete, self-contained** XML — you cannot rely on the original file's content:

```xml
<?xml version="1.0"?>
<!--
    This file COMPLETELY REPLACES:
    Magento_Catalog/view/frontend/layout/catalog_product_view.xml

    You must copy any original instructions you wish to keep!
-->
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      layout="1column"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <update handle="catalog_product_view_type_simple"/>
    <body>
        <referenceBlock name="root">
            <arguments>
                <argument name="page_layout" xsi:type="string">1column</argument>
            </arguments>
        </referenceBlock>
        <!-- All original content you want to keep, PLUS your additions -->
        <referenceContainer name="content">
            <block class="Magento\Catalog\Block\Product\View"
                   name="product.info"
                   template="Magento_Catalog::product/view.phtml">
            </block>
        </referenceContainer>
        <!-- Your new custom block added here -->
        <referenceContainer name="content">
            <block class="MyVendor\MyModule\Block\Custom"
                   name="myvendor.custom.block"
                   template="MyVendor_MyModule::custom.phtml"/>
        </referenceContainer>
    </body>
</page>
```

---

## 6. `<remove>` vs Layout Overrides

### 6.1 The `<remove>` Element

The `<remove name="..."/>` instruction removes a named block or container from the layout during the merge process. It is placed in an **extension file** (regular layout file) — no override needed.

```xml
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <!-- Remove the compare products sidebar block -->
        <remove name="catalog.compare.sidebar"/>

        <!-- Remove an entire container and all its children -->
        <remove name="left"/>
    </body>
</page>
```

> **Exam focus:** `<remove>` is **NOT** the same as `<referenceBlock ... remove="true"/>`. The `<remove>` element is a standalone body instruction. Using `remove="true"` on a `<referenceBlock>` is the attribute-based approach for the same result.

### 6.2 `remove="true"` Attribute on referenceBlock

```xml
<!-- Attribute-based removal — same effect as <remove name="..."/> -->
<referenceBlock name="catalog.compare.sidebar" remove="true"/>
```

### 6.3 Comparison: `<remove>` vs Override vs `display="false"`

| Approach | Mechanism | Effect | Reversible? |
|---|---|---|---|
| `<remove name="...">` | Extension file instruction | Block removed from layout tree; **cannot be re-added** by lower-priority files | No (in same request) |
| `<referenceBlock remove="true">` | Attribute on reference | Same as `<remove>` | No (in same request) |
| `display="false"` argument | Block argument | Block stays in tree but renders nothing | Yes — another file can set `display="true"` |
| Layout override | Replace source file | Source file's content entirely skipped | N/A — requires removing override file |

> **Exam focus:** A critical distinction — `<remove>` is **permanent for that request** and processed during layout loading. A removed block **cannot be restored** by another layout file later in the same request. `display="false"` is preferable when you might need to conditionally restore a block.

### 6.4 Why Choose `<remove>` Over Override

```
Scenario: You want to remove the "Compare Products" block from all product pages.

Option A — Using <remove> in an extension file:
  PROS: Non-destructive to other layout instructions in the original file
  PROS: Only 5 lines of XML needed
  CONS: The block is gone permanently for that page request

Option B — Using a layout override:
  PROS: Complete control over the entire layout file
  CONS: Must maintain a full copy of the original XML
  CONS: Breaks when Magento updates the original file (upgrade risk)
  CONS: Overkill for simply removing one block
```

> **Exam focus:** **Prefer `<remove>` over override** when the only goal is removing specific blocks. Overrides are the right choice only when you need to fundamentally restructure the layout in ways that cannot be achieved additively.

---

## 7. File Path Reference Table

A consolidated reference of all relevant paths:

### 7.1 Extension (Merge) File Paths

| Context | Path Pattern |
|---|---|
| Module — base area | `app/code/<Vendor>/<Module>/view/base/layout/<handle>.xml` |
| Module — frontend | `app/code/<Vendor>/<Module>/view/frontend/layout/<handle>.xml` |
| Module — adminhtml | `app/code/<Vendor>/<Module>/view/adminhtml/layout/<handle>.xml` |
| Theme — frontend | `app/design/frontend/<Vendor>/<Theme>/<Vendor>_<Module>/layout/<handle>.xml` |
| Theme — adminhtml | `app/design/adminhtml/<Vendor>/<Theme>/<Vendor>_<Module>/layout/<handle>.xml` |

### 7.2 Override File Paths

| What You're Overriding | From | Path Pattern |
|---|---|---|
| Base area layout file | From a **module** | `app/code/<V>/<M>/view/frontend/layout/override/base/<V2>_<M2>/<handle>.xml` |
| Specific theme layout | From a **module** | `app/code/<V>/<M>/view/frontend/layout/override/theme/<TV>/<TN>/<V2>_<M2>/<handle>.xml` |
| Base area layout file | From a **theme** | `app/design/frontend/<TV>/<TN>/<V2>_<M2>/layout/override/base/<handle>.xml` |
| Parent theme layout | From a **child theme** | `app/design/frontend/<TV>/<TN>/<V2>_<M2>/layout/override/theme/<PTV>/<PTN>/<handle>.xml` |

**Key:**
- `<V>/<M>` = customizing module's Vendor/Module
- `<V2>/<M2>` = target module being overridden
- `<TV>/<TN>` = customizing Theme Vendor/Name
- `<PTV>/<PTN>` = Parent Theme Vendor/Name

---

## 8. Hands-On Walkthroughs

### 8.1 Walkthrough A: Creating a Layout Extension

**Goal:** Add a custom promotional banner block to the product detail page using the merge approach.

**Step 1:** Create the module structure (assumes module already exists):

```bash
mkdir -p app/code/MyVendor/MyModule/view/frontend/layout
mkdir -p app/code/MyVendor/MyModule/view/frontend/templates
```

**Step 2:** Create the extension layout file:

```bash
# File: app/code/MyVendor/MyModule/view/frontend/layout/catalog_product_view.xml
touch app/code/MyVendor/MyModule/view/frontend/layout/catalog_product_view.xml
```

```xml
<?xml version="1.0"?>
<!--
    EXTENSION FILE — This merges with Magento_Catalog's catalog_product_view.xml
    File: app/code/MyVendor/MyModule/view/frontend/layout/catalog_product_view.xml
-->
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <!--
            Add a promotional banner block AFTER the main product info block.
            We're using <referenceContainer> because "content" is a container.
        -->
        <referenceContainer name="content">
            <block class="MyVendor\MyModule\Block\PromoBlock"
                   name="myvendor.mymodule.promo.banner"
                   template="MyVendor_MyModule::promo-banner.phtml"
                   after="product.info.main"/>
        </referenceContainer>
    </body>
</page>
```

**Step 3:** Create the Block PHP class:

```php
<?php
// File: app/code/MyVendor/MyModule/Block/PromoBlock.php

declare(strict_types=1);

namespace MyVendor\MyModule\Block;

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;

class PromoBlock extends Template
{
    public function __construct(Context $context, array $data = [])
    {
        parent::__construct($context, $data);
    }

    public function getPromoMessage(): string
    {
        return 'Limited time offer! Free shipping on this product.';
    }
}
```

**Step 4:** Create the template file:

```php
<?php
// File: app/code/MyVendor/MyModule/view/frontend/templates/promo-banner.phtml
/** @var \MyVendor\MyModule\Block\PromoBlock $block */
?>
<div class="promo-banner promo-banner--product">
    <p class="promo-message"><?= $block->escapeHtml($block->getPromoMessage()) ?></p>
</div>
```

**Step 5:** Register module and flush cache:

```bash
bin/magento module:enable MyVendor_MyModule
bin/magento setup:upgrade
bin/magento cache:flush
```

**Expected Result:** The promotional banner appears on all product pages, merged with (not replacing) the original product page layout.

---

### 8.2 Walkthrough B: Creating a Layout Override

**Goal:** Override the Magento Catalog product view layout to completely restructure the page, removing the sidebar comparison widget.

**Step 1:** Create the override directory structure:

```bash
mkdir -p app/code/MyVendor/MyModule/view/frontend/layout/override/base/Magento_Catalog
```

**Step 2:** Create the override layout file:

```bash
# The filename must EXACTLY match the handle you are overriding
touch app/code/MyVendor/MyModule/view/frontend/layout/override/base/Magento_Catalog/catalog_product_view.xml
```

```xml
<?xml version="1.0"?>
<!--
    OVERRIDE FILE — This COMPLETELY REPLACES:
    Magento_Catalog/view/frontend/layout/catalog_product_view.xml

    The original file will NOT be loaded.
    File: app/code/MyVendor/MyModule/view/frontend/layout/override/base/Magento_Catalog/catalog_product_view.xml
-->
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      layout="1column"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">

    <!--
        NOTE: <update> handles from the original file must be re-declared here
        if you still want them processed.
    -->
    <update handle="catalog_product_view_type_simple"/>
    <update handle="catalog_product_view_type_virtual"/>
    <update handle="catalog_product_view_type_grouped"/>
    <update handle="catalog_product_view_type_downloadable"/>
    <update handle="catalog_product_view_type_configurable"/>
    <update handle="catalog_product_view_type_bundle"/>

    <body>
        <!-- Re-declare the page title block from original file -->
        <referenceBlock name="page.main.title">
            <arguments>
                <argument name="css_class" xsi:type="string">product</argument>
            </arguments>
        </referenceBlock>

        <!-- Main product content — copied and modified from original -->
        <referenceContainer name="content">
            <block class="Magento\Catalog\Block\Product\View"
                   name="product.info"
                   ifconfig="catalog/frontend/show_product_info"
                   template="Magento_Catalog::product/view.phtml">
                <!-- ... (all child blocks re-declared as needed) -->
            </block>
        </referenceContainer>

        <!--
            INTENTIONALLY OMITTED from original:
            - catalog.compare.sidebar (we're removing this by not including it)

            ADDED: Our custom promotional block
        -->
        <referenceContainer name="content">
            <block class="MyVendor\MyModule\Block\PromoBlock"
                   name="myvendor.mymodule.promo.banner"
                   template="MyVendor_MyModule::promo-banner.phtml"
                   after="-"/>
        </referenceContainer>
    </body>
</page>
```

**Step 3:** Flush layout cache:

```bash
bin/magento cache:flush layout
bin/magento cache:flush full_page
```

---

### 8.3 Walkthrough C: Verifying the Difference

Use Magento's layout debug tools to see which files are loaded:

**Method 1: Enable Template Path Hints**

```bash
bin/magento config:set dev/debug/template_hints_storefront 1
bin/magento config:set dev/debug/template_hints_blocks 1
bin/magento cache:flush
```

**Method 2: URL-parameter based template hints**

Magento 2 supports a configurable URL parameter (`?templatehints=<value>`) for template hints, but it requires two config steps first:

```bash
# 1. Enable the URL-parameter feature:
bin/magento config:set dev/debug/template_hints_storefront_show_with_parameter 1

# 2. Set the secret parameter value (default is empty — set a value):
bin/magento config:set dev/debug/template_hints_parameter_value myvalue

bin/magento cache:flush
```

Then append `?templatehints=myvalue` to any frontend URL. The parameter name is always `templatehints` (confirmed in `module-developer/Model/TemplateEngine/Plugin/DebugHints.php:137`: `$this->http->getParam('templatehints')`).

> **Note:** `?showTemplateHints=1` is a Magento 1 pattern — it does **not** work in Magento 2.

**Method 3: Programmatic inspection via Xdebug**

Set a breakpoint at:
```
vendor/magento/framework/View/Layout/Builder.php::build()
vendor/magento/framework/View/Model/Layout/Merge.php::load()
```

**Method 4: Check the layout cache for merged XML**

The merged layout XML is stored in **Magento's layout cache** (cache type `layout`), **not** in `var/view_preprocessed/` or `generated/code/`:

```bash
# var/view_preprocessed/ = LESS/static content preprocessing (NOT layout XML)
# generated/code/        = DI interceptors/proxies (NOT layout XML)

# The layout cache lives in the configured cache backend (file cache default):
var/cache/

# To dump and inspect merged layout for a specific page, use the layout debug
# mode in a plugin/observer — see Method 5 below.

# To clear the layout cache:
bin/magento cache:clean layout
```

**Method 5: Direct comparison using XML debug output**

```php
<?php
// Temporary debug in a block or observer
/** @var \Magento\Framework\View\LayoutInterface $layout */
$layout = $objectManager->get(\Magento\Framework\View\LayoutInterface::class);
echo '<pre>' . htmlspecialchars($layout->getXmlString()) . '</pre>';
```

> **Exam focus:** After creating a layout extension, both the original file AND your file contribute to the final layout. After creating an override, only your file (and other non-overridden files) contributes. This difference is observable in the merged XML.

---

## 9. Decision Framework: When to Use What

### 9.1 Decision Tree

```
Do you need to change an existing page layout?
  |
  +-- Yes
        |
        +-- Are you ADDING something (new block, new container)?
        |     |
        |     +-- YES --> Use EXTENSION (merge) file
        |
        +-- Are you REMOVING something specific?
        |     |
        |     +-- YES --> Use <remove> in an EXTENSION file
        |                 (no override needed)
        |
        +-- Are you CHANGING a block's arguments/template?
        |     |
        |     +-- YES --> Use <referenceBlock> in an EXTENSION file
        |
        +-- Do you need to RESTRUCTURE the entire layout?
              |
              +-- YES --> Use an OVERRIDE file
              |           (accept the maintenance burden)
              |
              +-- Can it be done with remove + add?
                    |
                    +-- YES --> Prefer EXTENSION over override!
```

### 9.2 Trade-off Summary

| Consideration | Extension / Merge | Override |
|---|---|---|
| **Upgrade safety** | High — survives Magento upgrades cleanly | Low — must manually merge upstream changes |
| **Maintenance burden** | Minimal | High — own a copy of original file |
| **Granularity** | Fine — target specific elements | Coarse — take or leave the whole file |
| **Risk of breaking page** | Low — additive by nature | High — easy to omit critical blocks |
| **When appropriate** | 90% of customization needs | Fundamental restructuring only |
| **Works with 3rd party themes** | Yes | Potentially conflicts with theme overrides |

> **Exam focus:** Adobe Commerce best practices **strongly prefer extension/merge** over overrides. Overrides are considered a last resort due to upgrade maintenance risk. The exam may ask you to identify the "best practice" approach — default to extension unless override is the only option.

---

## 10. Common Pitfalls & Exam Traps

### 10.1 Path Mistakes

```
WRONG — Override file in wrong location:
app/code/MyVendor/MyModule/view/frontend/layout/override/Magento_Catalog/catalog_product_view.xml
                                                          ^--- Missing "base" or "theme" subdirectory

CORRECT:
app/code/MyVendor/MyModule/view/frontend/layout/override/base/Magento_Catalog/catalog_product_view.xml
                                                          ^--- "base" required
```

```
WRONG — Theme extension file missing module subdirectory:
app/design/frontend/MyVendor/mytheme/layout/catalog_product_view.xml
                                     ^--- Missing Vendor_Module directory

CORRECT:
app/design/frontend/MyVendor/mytheme/Magento_Catalog/layout/catalog_product_view.xml
                                     ^--- Required: VendorName_ModuleName
```

### 10.2 The "Only One Override Wins" Rule

> **Exam focus:** If two modules both place an override for the same file in `override/base/`, which one wins? This is determined by **module load order** (sequence in `module.xml` or dependency relationships). This is a known exam scenario — the answer is "the last-loaded module's override wins."

### 10.3 `<move>` vs `<referenceBlock>` with children

```xml
<!-- MOVE a block to a different container entirely -->
<move element="block.name" destination="new.container.name" after="-"/>

<!-- WRONG: trying to re-parent with referenceBlock -->
<!-- This does NOT move the block, it adds a CHILD block -->
<referenceBlock name="new.container">
    <block ... name="block.name"/>  <!-- Creates a NEW block, not moves existing -->
</referenceBlock>
```

> **Exam focus:** `<move>` is the correct element for relocating an existing block to a different parent. It is only available in extension files (merge context), not as a workaround for overrides.

### 10.4 Handle Names vs File Names

```
Layout handle: catalog_product_view
File name:     catalog_product_view.xml  (always .xml extension, always lowercase)

Layout handle: cms_index_index
File name:     cms_index_index.xml

WRONG — camelCase:
catalogProductView.xml   <-- this will never be matched to the handle
```

### 10.5 The `<head>` Section in Overrides

If your override omits the `<head>` section from the original, CSS and JS assets declared there will be missing:

```xml
<!-- Original file may have: -->
<head>
    <css src="Magento_Catalog::css/product-view.css"/>
    <script src="Magento_Catalog::js/product-gallery.js"/>
</head>

<!-- If your override omits this, those assets disappear from the page -->
<!-- Always check the original for <head> declarations -->
```

---

## 11. Quick-Reference Checklist

### Core Concept Checklist

- [ ] **Extension/Merge**: Multiple files with the same handle name are ALL loaded and merged automatically by Magento — no special directory needed
- [ ] **Override**: Files placed in `override/base/` or `override/theme/` directories **replace** (not merge with) the source file
- [ ] Extension files are the **preferred approach** — less risk, lower maintenance burden
- [ ] Overrides should be used only when fundamental restructuring cannot be achieved additively

### File Path Checklist

- [ ] Module layout extension: `app/code/<V>/<M>/view/frontend/layout/<handle>.xml`
- [ ] Theme layout extension: `app/design/frontend/<TV>/<TN>/<V>_<M>/layout/<handle>.xml`
- [ ] Module override of base: `app/code/<V>/<M>/view/frontend/layout/override/base/<V2>_<M2>/<handle>.xml`
- [ ] Module override of theme: `app/code/<V>/<M>/view/frontend/layout/override/theme/<TV>/<TN>/<V2>_<M2>/<handle>.xml`
- [ ] Theme override of base: `app/design/frontend/<TV>/<TN>/<V2>_<M2>/layout/override/base/<handle>.xml`
- [ ] Theme override of parent theme: `app/design/frontend/<TV>/<TN>/<V2>_<M2>/layout/override/theme/<PTV>/<PTN>/<handle>.xml`
- [ ] Theme layout files live under `<Vendor>_<Module>/layout/` subdirectory (not directly under theme root)

### Resolution Order Checklist

- [ ] Base module layout < Frontend module layout < Parent theme layout < Active theme layout
- [ ] Theme files have **higher priority** than module files during merging
- [ ] Later-loaded module overrides win when two modules override the same file

### `<remove>` vs Override Checklist

- [ ] `<remove name="..."/>` removes a block from layout tree — works in an extension file, no override needed
- [ ] `<referenceBlock name="..." remove="true"/>` is equivalent to `<remove>`
- [ ] Removed blocks **cannot** be restored later in the same request
- [ ] `display="false"` hides a block but keeps it in tree — can be reversed by another file
- [ ] Use `<remove>` when you want to remove specific blocks; use override only when restructuring
- [ ] Override files must be **complete and self-contained** — original content is not inherited

### XML Element Checklist

- [ ] `<referenceContainer name="...">` — target a container to add children inside it
- [ ] `<referenceBlock name="...">` — target a block to modify its arguments or add child blocks
- [ ] `<move element="..." destination="...">` — relocate an existing block to a new parent
- [ ] `after="-"` places block at end of container; `before="-"` places at beginning
- [ ] `<update handle="..."/>` — load additional layout handles; must be re-declared in overrides
- [ ] Block `name` attribute must be **unique** across the entire layout

### Exam Trap Checklist

- [ ] Override directory requires `base` or `theme` subdirectory — not just `override/`
- [ ] Theme extension files require `<VendorName>_<ModuleName>/layout/` subdirectory structure
- [ ] Two modules overriding the same file = last-loaded module wins (module sequence/dependency determines order)
- [ ] Override file omitting `<head>` section = missing CSS/JS assets
- [ ] Override file omitting `<update handle="..."/>` = missing sub-handle instructions
- [ ] `<move>` is for relocating existing blocks, NOT `<referenceBlock>` with a new child of the same name
- [ ] Handle names are always lowercase with underscores; file names match exactly with `.xml` extension
