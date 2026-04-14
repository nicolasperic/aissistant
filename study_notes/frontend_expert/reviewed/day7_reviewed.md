# Day 7 — Week 1 Review + First Practice Test
### Adobe Certified Professional: Magento 2 Front-End Developer

---

## Table of Contents

1. [How to Use These Notes](#1-how-to-use-these-notes)
2. [Week 1 Master Concept Map](#2-week-1-master-concept-map)
3. [Day 1 Review — Magento 2 Theme Architecture](#3-day-1-review--magento-2-theme-architecture)
4. [Day 2 Review — Layout XML Fundamentals](#4-day-2-review--layout-xml-fundamentals)
5. [Day 3 Review — Layout XML Advanced Directives](#5-day-3-review--layout-xml-advanced-directives)
6. [Day 4 Review — Templates & PHTML Files](#6-day-4-review--templates--phtml-files)
7. [Day 5 Review — Output Escaping & Security](#7-day-5-review--output-escaping--security)
8. [Day 6 Review — Translations & i18n](#8-day-6-review--translations--i18n)
9. [Cross-Topic Relationships & Tricky Areas](#9-cross-topic-relationships--tricky-areas)
10. [Practice Test Strategy & Simulation](#10-practice-test-strategy--simulation)
11. [50 Practice Questions with Explanations](#11-50-practice-questions-with-explanations)
12. [Weak-Area Diagnosis Framework](#12-weak-area-diagnosis-framework)
13. [Week 2 Planning Based on Results](#13-week-2-planning-based-on-results)
14. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. How to Use These Notes

These notes serve **three purposes** today:

| Purpose | How |
|---|---|
| **Active recall review** | Read each section heading, close the notes, recite what you know, then re-read |
| **Gap identification** | Mark any concept where recall fails — that is a weak area |
| **Practice test anchor** | After the test, return here to cross-reference wrong answers |

> **Exam focus:** The Adobe AD0-E727 exam tests *application* of knowledge, not memorization. Every concept below has appeared in scenario-based questions. Ask yourself *"What would break if this were wrong?"* for each item.

### Recommended Day 7 Schedule

```
08:00 - 09:30  | Skim Week 1 notes (this document, Days 1-6)
09:30 - 09:45  | Break
09:45 - 10:15  | Active recall: write down the 5 things you felt least sure about
10:15 - 10:30  | Clarify those 5 items using official DevDocs
10:30 - 12:30  | TIMED PRACTICE TEST (no interruptions, exam conditions)
12:30 - 13:00  | Lunch / rest — do NOT review answers yet
13:00 - 13:30  | Score test, categorize wrong answers by section
13:30 - 14:00  | Week 2 planning session
14:00+         | Rest — avoid cramming corrections today
```

---

## 2. Week 1 Master Concept Map

The following diagram shows how every Week 1 topic connects. Understanding these relationships is more valuable than memorizing individual facts.

```
                        MAGENTO 2 FRONTEND REQUEST
                                   |
                                   v
                    +-----------------------------+
                    |      Theme Resolution       |
                    |  (parent chain + fallback)  |
                    +-----------------------------+
                                   |
                    +--------------+--------------+
                    |                             |
                    v                             v
        +---------------------+       +--------------------+
        |    Layout XML       |       |   Translation      |
        |  (page structure)   |       |   (i18n / .csv)    |
        +---------------------+       +--------------------+
                    |
         +----------+----------+
         |          |          |
         v          v          v
    +--------+  +-------+  +--------+
    | blocks |  | uiComp|  | contrs |
    +--------+  +-------+  +--------+
         |
         v
    +----------+
    | Templates |  <--- Escaping applied here
    |  (.phtml) |
    +----------+
         |
         v
    +----------+
    |  Output  |
    | (HTML)   |
    +----------+
```

**The golden rule of the exam:** Every wrong answer in a scenario question can be traced back to a misunderstanding of one of these layers and how it interacts with the next.

---

## 3. Day 1 Review — Magento 2 Theme Architecture

### 3.1 Theme Directory Structure

```
app/design/frontend/
  <Vendor>/
    <theme>/
      <Module_Name>/
        layout/
        templates/
        web/
      Magento_Theme/
        layout/
        templates/
      web/
        css/
          source/
        fonts/
        images/
        js/
      i18n/
      media/
      registration.php
      theme.xml
      composer.json   (if distributed via Composer)
```

> **Exam focus:** The **exact path** `app/design/frontend/<Vendor>/<theme>/` is testable. Back-end themes live under `app/design/adminhtml/`. Confusing the two is a common distractor.

### 3.2 Required Theme Files

| File | Location | Purpose |
|---|---|---|
| `theme.xml` | Theme root | Declares theme title, parent |
| `registration.php` | Theme root | Registers theme with Magento's component system |
| `composer.json` | Theme root (optional) | Package distribution metadata |

**Minimal `theme.xml`:**

```xml
<?xml version="1.0"?>
<theme xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:noNamespaceSchemaLocation="urn:magento:framework:Config/etc/theme.xsd">
    <title>Vendor ThemeName</title>
    <parent>Magento/luma</parent>
    <media>
        <preview_image>media/preview.jpg</preview_image>
    </media>
</theme>
```

> **Exam focus:** If `<parent>` is omitted, the theme has **no parent** and falls back directly to `Magento/blank`. Luma's parent is `Magento/blank`. If your theme declares `<parent>Magento/luma</parent>`, the full chain is: `YourTheme -> Luma -> Blank`.

**Minimal `registration.php`:**

```php
<?php
use \Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::THEME,
    'frontend/Vendor/theme',
    __DIR__
);
```

> **Exam focus:** The `ComponentRegistrar::THEME` constant and the path format `'frontend/Vendor/theme'` — not `'app/design/frontend/Vendor/theme'` — is frequently tested.

### 3.3 Theme Inheritance & Fallback

```
File Resolution Order (most specific first):

1. app/design/frontend/YourVendor/YourTheme/<Module>/templates/file.phtml
2. app/design/frontend/Magento/luma/<Module>/templates/file.phtml
3. app/design/frontend/Magento/blank/<Module>/templates/file.phtml
4. app/code/<Module>/view/frontend/templates/file.phtml   (module default)
```

> **Exam focus:** Fallback applies to **templates, layout XML, and web assets** separately. A layout file is **merged** (not overridden outright) — this is a critical distinction. Template files **do** completely override the parent.

### 3.4 Static Content & `web/` Directory

```
web/
  css/
    source/
      _theme.less    <-- entry point for LESS customization
  js/
  images/
  fonts/
```

- Files in `web/` are accessed via `<theme_url>` after static content deploy.
- `bin/magento setup:static-content:deploy` publishes files to `pub/static/`.

> **Exam focus:** You **cannot** edit files in `pub/static/` directly — they are regenerated. Always edit source files in `app/design/`.

---

## 4. Day 2 Review — Layout XML Fundamentals

### 4.1 Layout File Types

| Type | Location | Scope |
|---|---|---|
| Page layout | `<Module>/page_layout/` | Defines column structure (1col, 2columns-left, etc.) |
| Page configuration | `<Module>/layout/` | Most common — configures blocks for a specific handle |
| Generic layout | `<Module>/layout/` | Reusable fragments, referenced by `<update>` |

> **Exam focus:** Page layout files define the **structural skeleton** (how many columns). Page configuration files define **what goes inside** those columns. Confusing these types is a top exam mistake.

### 4.2 Layout Handles

A **layout handle** is the filename (without `.xml`) that Magento loads for a given page context.

```
cms_index_index.xml         -> CMS Home page
catalog_product_view.xml    -> Product Detail Page
catalog_category_view.xml   -> Category Listing Page
checkout_cart_index.xml     -> Shopping Cart
customer_account_login.xml  -> Login Page
default.xml                 -> Loaded on EVERY page
```

> **Exam focus:** `default.xml` is **always** merged into every page load. Changes here affect the entire site. This is commonly used in exam scenarios asking "how do you add a block to every page?"

### 4.3 Core Layout XML Directives

#### `<page>`

```xml
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd"
      layout="2columns-left">
    <body>
        <!-- directives go here -->
    </body>
</page>
```

#### `<referenceContainer>` — Target an existing container

```xml
<referenceContainer name="content">
    <block class="Magento\Framework\View\Element\Template"
           name="my.custom.block"
           template="Vendor_Module::custom/block.phtml"/>
</referenceContainer>
```

#### `<referenceBlock>` — Modify an existing block

```xml
<referenceBlock name="header.links">
    <block class="Vendor\Module\Block\CustomLink"
           name="custom.header.link"
           template="Vendor_Module::custom/link.phtml"
           before="-"/>
</referenceBlock>
```

#### `<block>` — Define a block

```xml
<block class="Magento\Catalog\Block\Product\View"
       name="product.info"
       template="Magento_Catalog::product/view.phtml"
       cacheable="false">
    <arguments>
        <argument name="custom_key" xsi:type="string">custom_value</argument>
    </arguments>
</block>
```

> **Exam focus:** `before="-"` means *first*, `after="-"` means *last*. `before="some.block.name"` positions *before* that named block. This ordering syntax is frequently tested.

#### `<container>` — Structural wrapper

```xml
<container name="my.wrapper"
           htmlTag="div"
           htmlClass="my-css-class"
           htmlId="my-element-id"
           label="My Wrapper">
</container>
```

> **Exam focus:** `<container>` does **not** have a `template` attribute — it is purely structural. `<block>` has a `template`. This difference is a classic exam distractor.

### 4.4 `<arguments>` and `<argument>` Types

```xml
<arguments>
    <argument name="my_string"  xsi:type="string">Hello</argument>
    <argument name="my_bool"    xsi:type="boolean">true</argument>
    <argument name="my_number"  xsi:type="number">42</argument>
    <argument name="my_object"  xsi:type="object">Vendor\Module\Model\Foo</argument>
    <argument name="my_array"   xsi:type="array">
        <item name="key1" xsi:type="string">value1</item>
        <item name="key2" xsi:type="string">value2</item>
    </argument>
    <argument name="my_url"     xsi:type="url" path="catalog/product/view"/>
    <argument name="my_option"  xsi:type="options" model="Vendor\Module\Model\Config\Source\Options"/>
    <argument name="my_helper"  xsi:type="helper" helper="Vendor\Module\Helper\Data::getConfig">
        <param name="key">value</param>
    </argument>
    <argument name="my_const"   xsi:type="const">Vendor\Module\Model\Foo::MY_CONSTANT</argument>
    <argument name="my_null"    xsi:type="null"/>
</arguments>
```

> **Exam focus:** Know all `xsi:type` values. `object`, `helper`, and `const` are the most frequently tested because they are less intuitive. Accessing an argument in a block: `$this->getData('my_string')` or `$block->getData('my_string')`.

---

## 5. Day 3 Review — Layout XML Advanced Directives

### 5.1 `<move>`

Moves an **existing** block or container from one parent to another.

```xml
<!-- Move the breadcrumbs block before the page title -->
<move element="breadcrumbs" destination="page.wrapper" before="page.main.title"/>
```

> **Exam focus:** `<move>` requires `element` (what to move) and `destination` (where). `before` / `after` are optional positioning. You **cannot** use `<move>` to move a block to a container that doesn't exist yet.

### 5.2 `<remove>`

Completely removes a block or container from the layout.

```xml
<referenceBlock name="catalog.compare.sidebar" remove="true"/>
```

Alternative syntax:

```xml
<remove name="catalog.compare.sidebar"/>
```

> **Exam focus:** `remove="true"` on `<referenceBlock>` vs. standalone `<remove>` — both work. Once removed, the block **cannot** be added back in the same handle without re-declaring it. This is a common "gotcha" in exam scenarios.

### 5.3 `<update>` — Include Another Layout Handle

```xml
<update handle="catalog_product_view"/>
```

> **Exam focus:** `<update handle="..."/>` merges *another* layout handle's XML into the current page. This is how generic layouts are reused. Often appears in exam questions about code reuse.

### 5.4 `<body>` vs `<head>` sections

```xml
<page>
    <head>
        <css src="css/my-styles.css"/>
        <script src="Vendor_Module::js/my-script.js"/>
        <link rel="stylesheet" src="..."/>
        <meta name="description" content="My page description"/>
        <title>Custom Page Title</title>
        <attribute name="body_class" value="my-class"/>
    </head>
    <body>
        <!-- block/container declarations -->
    </body>
</page>
```

> **Exam focus:** Assets added via `<head>` in layout XML are subject to **RequireJS** for JavaScript and **LESS compilation** for CSS. The `src` attribute for `<css>` uses a module-relative path format, e.g., `Vendor_Module::css/file.css` or a theme-relative path `css/file.css`.

### 5.5 Layout XML Merge Order

```
1. Module layout files  (app/code/<Vendor>/<Module>/view/frontend/layout/)
2. Theme layout files   (app/design/frontend/<Vendor>/<theme>/<Module_Name>/layout/)
   - Parent theme first, then child theme
3. All files for the same handle are MERGED in this order
```

> **Exam focus:** Layout files with the **same handle name** are merged, not replaced. If two files both contain `default.xml`, their contents combine. The *theme* layout file is processed **after** the module layout file, so the theme always "wins" in conflicts.

### 5.6 Disabling Blocks from Layout

```xml
<!-- Method 1: display="false" — renders nothing but block object still exists -->
<referenceBlock name="header" display="false"/>

<!-- Method 2: remove="true" — removes entirely from layout tree -->
<referenceBlock name="header" remove="true"/>
```

> **Exam focus:** `display="false"` vs `remove="true"` — critical distinction. With `display="false"`, the block is still instantiated and `getChildHtml()` could still render it if called explicitly. With `remove="true"`, the block is gone entirely.

---

## 6. Day 4 Review — Templates & PHTML Files

### 6.1 Template File Location & Naming

```
Module default:
  app/code/<Vendor>/<Module>/view/frontend/templates/<path/to/file>.phtml

Theme override:
  app/design/frontend/<Vendor>/<Theme>/<Vendor_Module>/templates/<path/to/file>.phtml
```

Reference in layout XML:

```xml
template="Vendor_Module::path/to/file.phtml"
```

> **Exam focus:** The template reference format `Vendor_Module::path/to/file.phtml` — the `::` separates the **module identifier** from the **path relative to the module's `templates/` directory**. This format is required in layout XML. Direct file paths are not accepted.

### 6.2 The `$block` Variable

In every `.phtml` template, `$block` refers to the **Block class instance** associated with that template.

```php
<?php
// Get data set via layout XML argument
$customValue = $block->getData('my_string');

// Call a method on the block class
$productName = $block->getProduct()->getName();

// Get child block HTML
$childHtml = $block->getChildHtml('child.block.name');

// Get child block HTML with no caching separation
$childHtml = $block->getChildHtml('child.block.name', false);
```

> **Exam focus:** `$block` is always available. `$this` also works but is **deprecated** and should not be used in new code. The exam will specifically test whether you know `$block` is the correct variable.

### 6.3 Block PHP Class Hierarchy

```
Magento\Framework\View\Element\AbstractBlock
    |
    +-- Magento\Framework\View\Element\Template          (base for template blocks)
    |       |
    |       +-- Magento\Catalog\Block\Product\ListProduct
    |       +-- Magento\Catalog\Block\Product\View
    |       +-- ... (all content blocks)
    |
    +-- Magento\Framework\View\Element\Text              (outputs text directly)
    +-- Magento\Framework\View\Element\Messages          (renders message blocks)
```

> **Exam focus:** `Magento\Framework\View\Element\Template` is the **base class for blocks that use templates**. If a block class is not specified in layout XML, the default is `Magento\Framework\View\Element\Template`.

### 6.4 Useful Block Methods

```php
<?php
// URL generation
$url = $block->getUrl('catalog/product/view', ['id' => 42]);

// Get store information
$store = $block->_storeManager->getStore(); // via ObjectManager (avoid)

// Image URL
$imgUrl = $block->getViewFileUrl('images/logo.png');

// Base URL
$baseUrl = $block->getBaseUrl();

// Child blocks
echo $block->getChildHtml('child.name');
echo $block->getChildHtml(); // all children

// Layout
$layout = $block->getLayout();
$anotherBlock = $layout->getBlock('some.block.name');
```

### 6.5 Template Rendering Flow

```
Layout XML parsed
      |
      v
Block objects instantiated
      |
      v
_prepareLayout() called on each block
      |
      v
toHtml() called (which calls _toHtml())
      |
      v
_toHtml() calls fetchView() on the template
      |
      v
.phtml file executed with $block in scope
      |
      v
HTML output cached (if cacheable="true")
      |
      v
Output returned to parent block's getChildHtml()
```

> **Exam focus:** Know that `_prepareLayout()` is the correct method to override in a Block class to modify layout programmatically. `__construct()` is for dependency injection. Never call `toHtml()` manually in a template.

---

## 7. Day 5 Review — Output Escaping & Security

### 7.1 The Escaper Service

```php
<?php
// In a .phtml template, $escaper is always available
// It is an instance of Magento\Framework\Escaper

// Escape HTML content (prevents XSS in text nodes)
echo $escaper->escapeHtml($block->getSomeText());

// Escape HTML attributes
echo '<div class="' . $escaper->escapeHtmlAttr($block->getClassName()) . '">';

// Escape URLs (use in href, src, action attributes)
echo '<a href="' . $escaper->escapeUrl($block->getUrl('path/to/page')) . '">';

// Escape JavaScript strings (use inside JS <script> blocks)
echo '<script>var x = "' . $escaper->escapeJs($block->getSomeValue()) . '";</script>';

// Escape CSS values
echo '<style>color: ' . $escaper->escapeCss($block->getColor()) . ';</style>';
```

> **Exam focus:** There is a **different escaper method for each context**. Using `escapeHtml()` inside a JavaScript string does **not** protect against XSS — `escapeJs()` must be used. This is the most common escaping mistake on the exam.

### 7.2 Escaper Methods Reference Table

| Context | Method | Use Case |
|---|---|---|
| HTML text node | `escapeHtml($str)` | Text between tags, e.g., `<p>...</p>` |
| HTML attribute | `escapeHtmlAttr($str)` | Values inside `" "` attributes |
| URL in `href`/`src` | `escapeUrl($str)` | Link URLs, image sources |
| JavaScript string | `escapeJs($str)` | Inline `<script>` values |
| CSS value | `escapeCss($str)` | Inline style values |
| HTML with allowed tags | `escapeHtml($str, $allowedTags)` | Rich text where `<b>`, `<i>` etc. are allowed |

### 7.3 `escapeHtml()` with Allowed Tags

```php
<?php
// Allow specific HTML tags (whitelist)
echo $escaper->escapeHtml(
    $block->getDescription(),
    ['b', 'strong', 'i', 'em', 'a', 'br']
);
```

> **Exam focus:** The second argument to `escapeHtml()` is an **array of allowed HTML tags** (not attributes). Any tags not in the list are stripped. Script and style tags can never be allowed through this method — they are always removed.

### 7.4 Where `$escaper` Comes From

```php
<?php
// In Magento 2.4+, $escaper is injected into templates automatically
// by Magento\Framework\View\TemplateEngine\Php

// In Block classes, access via:
class MyBlock extends \Magento\Framework\View\Element\Template
{
    // $this->_escaper is available from AbstractBlock
    public function getSafeText(): string
    {
        return $this->_escaper->escapeHtml($this->getRawText());
    }
}
```

> **Exam focus:** `$escaper` is available directly in templates without any declaration. In block PHP classes, use `$this->_escaper` (protected property inherited from `AbstractBlock`). Do **not** use `htmlspecialchars()` directly — always use Magento's escaper.

### 7.5 Legacy `$block->escapeHtml()` vs `$escaper->escapeHtml()`

In older Magento code you will see:

```php
<?php
// LEGACY — delegated to escaper internally
echo $block->escapeHtml($someText);

// CURRENT BEST PRACTICE
echo $escaper->escapeHtml($someText);
```

> **Exam focus:** Both work, but the exam favors the standalone `$escaper` object pattern as of Magento 2.4+. Questions may show both and ask which is the *recommended* approach.

---

## 8. Day 6 Review — Translations & i18n

### 8.1 Translation CSV File Location

```
app/design/frontend/<Vendor>/<Theme>/i18n/en_US.csv
app/design/frontend/<Vendor>/<Theme>/i18n/de_DE.csv
app/code/<Vendor>/<Module>/i18n/en_US.csv
```

> **Exam focus:** Theme-level translation files **override** module-level files for the same locale. The theme's `.csv` file is checked first.

### 8.2 CSV File Format

```csv
"Original string","Translated string"
"Add to Cart","In den Warenkorb"
"Price","Preis"
"Hello, %1!","Hallo, %1!"
```

Rules:
- Both columns are required
- Strings with commas must be wrapped in double quotes
- The **key** (first column) must match the string exactly as passed to `__()`.

> **Exam focus:** The first column is the **source string** that must exactly match what is in the PHP/template code. If the source has a typo, the translation will not apply.

### 8.3 Using Translations in PHP

```php
<?php
// In a Block or other PHP class (has __() via Phrase)
$translated = __('Add to Cart');

// With placeholder substitution
$translated = __('Hello, %1!', $customerName);

// Multiple placeholders
$translated = __('Hello, %1! You have %2 items.', $name, $count);
```

> **Exam focus:** `__()` returns a `Magento\Framework\Phrase` object, **not** a string. It is cast to string when echoed. If you need a real string for comparison, cast it: `(string)__('Hello')`.

### 8.4 Using Translations in PHTML Templates

```php
<?php
// Direct use in template
echo $escaper->escapeHtml(__('Add to Cart'));

// With HTML (pass through escapeHtml to avoid double-encoding)
echo __('Click <a href="%1">here</a>', $escaper->escapeUrl($url));
```

> **Exam focus:** When outputting translated strings that might contain HTML (like links in translation), escape the dynamic parts *before* passing to `__()`, then output the result as raw HTML (trusted). Do not double-escape.

### 8.5 Using Translations in JavaScript / `.js` files

```javascript
// RequireJS module using mage/translate
define(['mage/translate'], function($t) {
    'use strict';

    return {
        greet: function(name) {
            return $t('Hello, %1').replace('%1', name);
        }
    };
});
```

```javascript
// In a jQuery widget
$.widget('mage.myWidget', {
    _create: function() {
        var message = $.mage.__('Add to Cart');
    }
});
```

> **Exam focus:** JavaScript translations require the string to be present in the `js-translation.json` file, which is generated during static content deploy from the `.csv` files. Strings used in `.js` must also exist in a `.csv` to be translated.

### 8.6 Using Translations in XML / HTML Templates

```html
<!-- In .html UI Component templates -->
<span data-bind="i18n: 'Add to Cart'"></span>

<!-- Or using translate attribute -->
<span translate="true">Add to Cart</span>
```

### 8.7 Translation Priority Chain

```
Database (Translations table — admin config)
      |  (highest priority)
      v
Theme i18n CSV files
      |
      v
Module i18n CSV files
      |
      v
Original string (fallback, no translation)
      | (lowest priority)
```

> **Exam focus:** The database (admin-configured translations) always wins. Theme CSV beats module CSV. This priority chain is directly testable.

---

## 9. Cross-Topic Relationships & Tricky Areas

### 9.1 The Five Most Commonly Confused Concepts

#### Confusion #1: `<container>` vs `<block>`

| Feature | `<container>` | `<block>` |
|---|---|---|
| Renders a template | NO | YES |
| Has a PHP class | NO (purely structural — no PHP class) | YES (defaults to `Magento\Framework\View\Element\Template`) |
| `htmlTag` attribute | YES | NO |
| `template` attribute | NO | YES |
| Can have children | YES | YES |

#### Confusion #2: `remove="true"` vs `display="false"`

```xml
<!-- Block exists in memory, not rendered unless explicitly called -->
<referenceBlock name="my.block" display="false"/>

<!-- Block completely removed from layout tree -->
<referenceBlock name="my.block" remove="true"/>
```

If a removed block is referenced later in the same page load, Magento will throw an error (or silently fail, depending on the version).

#### Confusion #3: Layout Merge vs Template Override

- Layout XML: **merged** (all files for the same handle are combined)
- Template PHTML: **overridden** (child theme file completely replaces parent file)
- Static files (CSS, JS, images): **overridden** (most specific theme wins)

> **Exam focus:** This distinction explains why you can have two `catalog_product_view.xml` files (one in module, one in theme) both contribute to the page, but only one `view.phtml` file will be used.

#### Confusion #4: `$escaper` vs `$block->escapeHtml()`

Both ultimately call the same escaping logic, but:
- `$escaper` is the **preferred** method in Magento 2.4+
- `$block->escapeHtml()` is a **proxy** method kept for backward compatibility

#### Confusion #5: `__()` Returns a Phrase, Not a String

```php
<?php
$phrase = __('Hello');
var_dump($phrase); // object(Magento\Framework\Phrase)

// This will FAIL in strict type comparisons:
if ($phrase === 'Hello') { } // FALSE — object != string

// This works:
if ((string)$phrase === 'Hello') { } // TRUE
```

### 9.2 Layout XML Attribute Quick Reference

```xml
<block
    class="Full\Class\Name"          <!-- PHP class, defaults to Template -->
    name="unique.block.name"          <!-- Unique identifier within layout -->
    template="Module::path.phtml"     <!-- Template file reference -->
    before="other.block.name"         <!-- Position before this block -->
    after="other.block.name"          <!-- Position after this block -->
    before="-"                        <!-- Position FIRST -->
    after="-"                         <!-- Position LAST -->
    as="alias"                        <!-- Alias for getChildHtml('alias') -->
    cacheable="false"                 <!-- Disable full-page cache for this block -->
    ttl="3600"                        <!-- FPC TTL in seconds -->
    display="false"                   <!-- Hide block without removing -->
    ifconfig="path/to/config"         <!-- Only render if config is enabled -->
/>
```

> **Exam focus:** `ifconfig` is often overlooked. It is used to conditionally show/hide blocks based on system configuration values, without custom PHP code.

### 9.3 Template Path Resolution — Step by Step

When Magento resolves `Vendor_Module::path/to/file.phtml`:

```
Step 1: Check current theme
  app/design/frontend/<CurrentVendor>/<CurrentTheme>/Vendor_Module/templates/path/to/file.phtml

Step 2: Check parent theme (if parent defined)
  app/design/frontend/<ParentVendor>/<ParentTheme>/Vendor_Module/templates/path/to/file.phtml

Step 3: Check grandparent (if applicable)
  ...

Step 4: Fall back to module default
  app/code/Vendor/Module/view/frontend/templates/path/to/file.phtml
```

---

## 10. Practice Test Strategy & Simulation

### 10.1 Exam Structure Reference

| Section | Topic | Approx. Weight |
|---|---|---|
| 1 | Theme Architecture & Structure | ~18% |
| 2 | Layout XML & Page Structure | ~25% |
| 3 | Templates & Block Architecture | ~22% |
| 4 | Styles & JavaScript | ~18% |
| 5 | Checkout & UI Components | ~10% |
| 6 | Performance & Caching | ~7% |

> **Exam focus:** Sections 1–3 represent approximately **65% of the exam**. Mastering Week 1 material has the highest ROI for your score.

### 10.2 How to Take the Practice Test

```
BEFORE THE TEST:
[ ] Close all notes, books, and tabs
[ ] Set a timer for 90 minutes (the real exam is 90 min / 60 questions)
[ ] Have paper for scratch notes
[ ] Commit to not looking anything up mid-test

DURING THE TEST:
[ ] Read each question TWICE before selecting an answer
[ ] Eliminate obviously wrong answers first
[ ] Flag uncertain questions, continue, return at the end
[ ] Trust your first instinct — don't change answers without strong reason

AFTER THE TEST (today):
[ ] Record your score
[ ] List every wrong question by number
[ ] Categorize each wrong answer by the section above
[ ] Do NOT study the corrections today — just categorize
```

### 10.3 Score Interpretation

| Score | Interpretation | Action |
|---|---|---|
| Below 50% | Significant gaps in fundamentals | Increase daily study time; revisit Days 1–3 |
| 50–65% | On track — normal starting baseline | Maintain plan; focus on weak sections |
| 65–75% | Strong start | Push harder on Sections 4–6 in Week 2 |
| 75%+ | Excellent baseline | Week 2 can include advanced topics + more practice |

> **Exam focus:** The passing score for AD0-E727 is typically **68%** (Adobe adjusts this periodically). A baseline of 50–60% with 2 weeks to go is entirely normal and recoverable.

### 10.4 Question Pattern Recognition

Learn to recognize these exam question types:

**Pattern 1: "What is the correct file location?"**
- Answer always requires exact Magento directory structure knowledge
- Look for distractor answers that use wrong subdirectory names

**Pattern 2: "Which method should you use to...?"**
- Escape: `escapeHtml` vs `escapeHtmlAttr` vs `escapeUrl` vs `escapeJs`
- Block: `getChildHtml()` vs `getChildBlock()` vs `getLayout()->getBlock()`

**Pattern 3: "What is the result of this XML?"**
- Read the `before/after` and `remove/display` attributes carefully
- Consider the merge order

**Pattern 4: "A developer wants to... What is the BEST approach?"**
- "Best" = most idiomatic Magento way
- Avoid ObjectManager, avoid editing core files, use dependency injection

**Pattern 5: "Which of the following will NOT work?"**
- These require knowing both correct and incorrect implementations
- Common traps: container with template, `$this` in templates, editing `pub/static`

---

## 11. 50 Practice Questions with Explanations

> Use these questions for active recall. Try to answer each one before reading the explanation.

---

### Section 1: Theme Architecture (Questions 1–10)

---

**Q1.** A developer creates a new frontend theme. Which two files are **required** at the theme root for the theme to function?

- A) `theme.xml` and `composer.json`
- B) `theme.xml` and `registration.php`
- C) `registration.php` and `composer.json`
- D) `theme.xml` and `default.xml`

**Answer: B**
*`theme.xml` declares the theme metadata. `registration.php` registers it with Magento's component system. `composer.json` is optional (only needed for Composer distribution). `default.xml` is a layout file, not a theme root requirement.*

---

**Q2.** What is the correct path to store a custom theme named "Retail" by vendor "Acme"?

- A) `app/code/Acme/Retail/`
- B) `app/design/Acme/Retail/`
- C) `app/design/frontend/Acme/Retail/`
- D) `app/themes/frontend/Acme/Retail/`

**Answer: C**
*Frontend themes always live under `app/design/frontend/<Vendor>/<Theme>/`. Option A is for modules. Option B is missing the area segment. Option D is not a real Magento path.*

---

**Q3.** A theme's `theme.xml` contains `<parent>Magento/luma</parent>`. What is the complete fallback chain?

- A) `CustomTheme -> Magento/luma`
- B) `CustomTheme -> Magento/blank`
- C) `CustomTheme -> Magento/luma -> Magento/blank`
- D) `CustomTheme -> Magento/luma -> Magento/blank -> Magento/base`

**Answer: C**
*Luma's parent is Magento/blank. Blank has no parent (it is the root). The chain is CustomTheme -> Luma -> Blank.*

---

**Q4.** Which `ComponentRegistrar::register()` constant is used for theme registration?

- A) `ComponentRegistrar::MODULE`
- B) `ComponentRegistrar::LIBRARY`
- C) `ComponentRegistrar::THEME`
- D) `ComponentRegistrar::LANGUAGE`

**Answer: C**
*`ComponentRegistrar::THEME` is for themes. MODULE is for modules. LANGUAGE is for language packs. LIBRARY is for third-party libraries.*

---

**Q5.** A developer modifies a CSS file in `pub/static/frontend/Acme/Retail/en_US/css/`. After a cache flush, the changes disappear. Why?

- A) The theme is not registered
- B) `pub/static/` files are regenerated from source on deploy; edits are overwritten
- C) CSS files cannot be edited directly
- D) The locale `en_US` is not supported

**Answer: B**
*`pub/static/` is a **published** directory. `bin/magento setup:static-content:deploy` regenerates it from source files. Always edit source files in `app/design/frontend/`.*

---

**Q6.** Where should a developer place a theme-level translation file for US English?

- A) `app/i18n/en_US.csv`
- B) `app/design/frontend/Acme/Retail/i18n/en_US.csv`
- C) `app/design/frontend/Acme/Retail/locale/en_US.csv`
- D) `app/code/Acme/Retail/i18n/en_US.csv`

**Answer: B**
*Theme-level i18n files live in `<theme_root>/i18n/<locale>.csv`. Option D would be a module path, not a theme path.*

---

**Q7.** Which statement about static file fallback is correct?

- A) Theme static files completely replace all parent theme static files
- B) Static files fall back through the theme hierarchy, most specific theme first
- C) Only CSS files fall back; JS files do not
- D) Static files can only exist in the active theme, not parent themes

**Answer: B**
*All static files (CSS, JS, images, fonts) fall back through the theme hierarchy. The most specific (active) theme is checked first, then parent, then grandparent, then module default.*

---

**Q8.** A `registration.php` file contains: `ComponentRegistrar::register(ComponentRegistrar::THEME, 'frontend/Acme/Retail', __DIR__)`. What does `__DIR__` refer to?

- A) The Magento root directory
- B) The `app/design/frontend/` directory
- C) The directory containing the `registration.php` file itself
- D) The `pub/static/frontend/` directory

**Answer: C**
*`__DIR__` is a PHP magic constant that always resolves to the directory of the file in which it is used — in this case, the theme root directory.*

---

**Q9.** Which area handles the admin backend theme?

- A) `frontend`
- B) `backend`
- C) `adminhtml`
- D) `admin`

**Answer: C**
*Magento uses the area string `adminhtml` for the admin backend. Themes for admin live in `app/design/adminhtml/`. The area string `frontend` is for the customer-facing store.*

---

**Q10.** A developer wants to add a preview image for their theme in the admin theme selector. Where should the file be placed and referenced?

- A) `web/preview.jpg` referenced as `<preview_image>web/preview.jpg</preview_image>` in `theme.xml`
- B) `media/preview.jpg` referenced as `<preview_image>media/preview.jpg</preview_image>` in `theme.xml`
- C) `pub/static/preview.jpg` referenced in `theme.xml`
- D) `web/images/preview.jpg` with no reference needed in `theme.xml`

**Answer: B**
*The convention is `media/preview.jpg` at the theme root, referenced in `theme.xml` under `<media><preview_image>media/preview.jpg</preview_image></media>`.*

---

### Section 2: Layout XML (Questions 11–25)

---

**Q11.** What is the difference between a `<block>` and a `<container>` in layout XML?

- A) Containers have PHP class logic; blocks do not
- B) Blocks render templates; containers are structural wrappers with no template
- C) Containers can only have one child; blocks can have many
- D) Blocks are for content; containers are for JavaScript

**Answer: B**
*Blocks are associated with a PHP class and render a template file. Containers are purely structural — they wrap children in an HTML tag but have no template and no custom PHP logic.*

---

**Q12.** Which layout handle is loaded on **every** page of the frontend?

- A) `cms_index_index.xml`
- B) `catalog_product_view.xml`
- C) `default.xml`
- D) `layout_default.xml`

**Answer: C**
*`default.xml` is the universal handle merged into every frontend page. It is the correct place to add blocks that appear site-wide.*

---

**Q13.** What does `before="-"` mean in a block declaration?

- A) The block has no position specified
- B) The block renders before all other blocks in its parent
- C) The block renders after all other blocks in its parent
- D) The block is disabled

**Answer: B**
*`before="-"` positions the block **first** among its siblings. `after="-"` positions it **last**.*

---

**Q14.** A developer uses `<referenceBlock name="product.info" remove="true"/>` and later in the same handle uses `<referenceBlock name="product.info">`. What happens?

- A) The second reference restores the block
- B) The second reference causes a layout compilation error
- C) The second reference has no effect — the block was already removed
- D) The block is removed and then re-added in default position

**Answer: C**
*Once `remove="true"` is applied, the block is removed from the layout tree. Subsequent references to it within the same merged handle will typically have no effect (the block no longer exists to reference).*

---

**Q15.** Which XML attribute on `<block>` controls whether the Full Page Cache is disabled for that block?

- A) `cache="false"`
- B) `cacheable="false"`
- C) `fpc="disabled"`
- D) `no-cache="true"`

**Answer: B**
*`cacheable="false"` on a block marks the entire page as uncacheable by the Full Page Cache. Use with caution — it affects the whole page, not just the block.*

---

**Q16.** How do you pass an array argument to a block via layout XML?

```xml
<argument name="my_items" xsi:type="array">
    <!-- What goes here? -->
</argument>
```

- A) `<value key="a">1</value><value key="b">2</value>`
- B) `<item name="a" xsi:type="string">1</item><item name="b" xsi:type="string">2</item>`
- C) `<entry key="a">1</entry><entry key="b">2</entry>`
- D) `<element a="1" b="2"/>`

**Answer: B**
*Array items in layout XML use `<item name="key" xsi:type="type">value</item>`. Each item requires both a `name` attribute and an `xsi:type` attribute.*

---

**Q17.** What does `<update handle="some_handle"/>` do?

- A) Updates an existing handle's content
- B) Merges the layout instructions of another handle into the current page
- C) Creates a new handle alias
- D) Forces a cache update for the specified handle

**Answer: B**
*`<update handle="..."/>` imports and merges the layout XML defined under another layout handle into the current page's layout tree.*

---

**Q18.** A developer wants to display a block only when a specific system configuration option is enabled. Which block attribute should they use?

- A) `condition="path/to/config"`
- B) `enabled="path/to/config"`
- C) `ifconfig="path/to/config"`
- D) `config_path="path/to/config"`

**Answer: C**
*`ifconfig="module/section/field"` is the layout XML attribute that conditionally renders a block based on a system configuration value.*

---

**Q19.** Which `xsi:type` should be used in layout XML to pass an instantiated object as a block argument?

- A) `xsi:type="class"`
- B) `xsi:type="model"`
- C) `xsi:type="object"`
- D) `xsi:type="instance"`

**Answer: C**
*`xsi:type="object"` is used to pass a class that will be instantiated via the Object Manager/DI. The value is the full class name.*

---

**Q20.** In layout XML, what is the purpose of the `as` attribute on a block?

- A) It defines the block's CSS class
- B) It provides an alias for `getChildHtml('alias')` calls in the parent template
- C) It sets the block's HTML `id` attribute
- D) It maps the block to a container

**Answer: B**
*The `as` attribute sets an alias so the parent block can retrieve this child using `$block->getChildHtml('alias')` instead of the full block name.*

---

**Q21.** A developer wants to move the `breadcrumbs` block to appear inside the `page.wrapper` container. Which XML is correct?

- A) `<referenceBlock name="breadcrumbs" parent="page.wrapper"/>`
- B) `<move element="breadcrumbs" destination="page.wrapper"/>`
- C) `<relocate block="breadcrumbs" to="page.wrapper"/>`
- D) `<referenceContainer name="page.wrapper"><referenceBlock name="breadcrumbs"/></referenceContainer>`

**Answer: B**
*`<move element="..." destination="..."/>` is the correct directive for repositioning existing blocks/containers.*

---

**Q22.** What is the correct schema location for a page configuration layout file?

- A) `urn:magento:framework:View/Layout/etc/layout_generic.xsd`
- B) `urn:magento:framework:View/Layout/etc/page_configuration.xsd`
- C) `urn:magento:framework:View/Layout/etc/page_layout.xsd`
- D) `urn:magento:framework:Config/etc/layout.xsd`

**Answer: B**
*Page configuration files (the most common type, using `<page>` as root) use `urn:magento:framework:View/Layout/etc/page_configuration.xsd`. Page layout files (column structure) use `page_layout.xsd`.*

---

**Q23.** In which order does Magento process layout files with the same handle (e.g., `catalog_product_view.xml`)?

- A) Theme files first, then module files
- B) Module files first, then parent theme files, then active theme files
- C) Active theme files first, then parent theme files, then module files
- D) All files are processed simultaneously with no guaranteed order

**Answer: B**
*Module layout files are processed first (providing the default structure), then parent theme files override/extend, then the active (child) theme files are applied last — giving the active theme the final say.*

---

**Q24.** A developer adds `<css src="css/custom.css"/>` inside the `<head>` section of a layout XML file. What path does `css/custom.css` resolve to?

- A) `app/design/frontend/<Vendor>/<Theme>/css/custom.css`
- B) `app/design/frontend/<Vendor>/<Theme>/web/css/custom.css`
- C) `pub/static/frontend/<Vendor>/<Theme>/<locale>/css/custom.css`
- D) `pub/media/css/custom.css`

**Answer: B**
*When a path does not include a module prefix (`Module_Name::`), it resolves relative to the theme's `web/` directory: `web/css/custom.css`.*

---

**Q25.** Which statement about `display="false"` on a block is TRUE?

- A) The block is removed from the layout tree
- B) The block PHP class is not instantiated
- C) The block is instantiated but its `toHtml()` returns an empty string
- D) The block is visible but has no CSS styling applied

**Answer: C**
*`display="false"` causes `toHtml()` to return an empty string without executing the template. The block object still exists in the layout tree and could be retrieved programmatically.*

---

### Section 3: Templates & Blocks (Questions 26–35)

---

**Q26.** In a `.phtml` template, which variable refers to the current block instance?

- A) `$this`
- B) `$block`
- C) `$template`
- D) `$view`

**Answer: B**
*`$block` is the correct variable in Magento 2 templates. `$this` is deprecated and should not be used in new code.*

---

**Q27.** A block is declared in layout XML without a `class` attribute. Which class is used?

- A) `Magento\Framework\View\Element\AbstractBlock`
- B) `Magento\Framework\View\Element\Template`
- C) `Magento\Framework\View\Element\Text`
- D) No block is created — `class` is required

**Answer: B**
*When no `class` attribute is specified, Magento defaults to `Magento\Framework\View\Element\Template`.*

---

**Q28.** How does a developer call the HTML output of a child block named `my.child` from a parent template?

- A) `$block->renderChild('my.child')`
- B) `$block->getChildHtml('my.child')`
- C) `$block->getBlock('my.child')->toHtml()`
- D) `$layout->getBlock('my.child')->render()`

**Answer: B**
*`$block->getChildHtml('child_name')` is the standard way to render a child block's output. Option C would work but is not the recommended pattern.*

---

**Q29.** Which method in a Block class should be overridden to perform setup actions after the block is added to the layout?

- A) `__construct()`
- B) `_beforeToHtml()`
- C) `_prepareLayout()`
- D) `initialize()`

**Answer: C**
*`_prepareLayout()` is called after the block is added to the layout, making it the correct place to perform layout-dependent setup. `__construct()` is for dependency injection.*

---

**Q30.** What is the template reference format for a template file located at `app/code/Acme/Catalog/view/frontend/templates/product/custom.phtml`?

- A) `Acme/Catalog::product/custom.phtml`
- B) `Acme_Catalog::product/custom.phtml`
- C) `product/custom.phtml`
- D) `app/code/Acme/Catalog/view/frontend/templates/product/custom.phtml`

**Answer: B**
*The format is `VendorName_ModuleName::relative/path.phtml`. The `_` separates vendor and module in the module identifier, matching the `registration.php` module name format.*

---

**Q31.** How can a developer get data from a block argument in a template when the argument was declared as `<argument name="icon_class" xsi:type="string">star</argument>`?

- A) `$block->getArgument('icon_class')`
- B) `$block->getData('icon_class')` or `$block->getIconClass()`
- C) `$block->getConfig('icon_class')`
- D) `$block->argument('icon_class')`

**Answer: B**
*Block arguments set via layout XML are accessible via `getData('argument_name')`. Magento also generates magic getter methods — `getData('icon_class')` corresponds to `getIconClass()` (camelCase).*

---

**Q32.** A developer needs to check whether a child block has been added before rendering it. Which approach is correct?

```php
<?php
// Option A
if ($block->getChildBlock('child.name')) {
    echo $block->getChildHtml('child.name');
}

// Option B
if ($childHtml = $block->getChildHtml('child.name')) {
    echo $childHtml;
}
```

- A) Option A only
- B) Option B only
- C) Both are valid approaches
- D) Neither — `hasData()` should be used

**Answer: C**
*Both approaches work. Option A uses `getChildBlock()` which returns null if no child exists. Option B uses the fact that `getChildHtml()` returns an empty string for missing children (which is falsy).*

---

**Q33.** Where should a template file be placed to override `Magento_Catalog::product/view/description.phtml` in a custom theme `Acme/Retail`?

- A) `app/design/frontend/Acme/Retail/templates/product/view/description.phtml`
- B) `app/design/frontend/Acme/Retail/Magento_Catalog/templates/product/view/description.phtml`
- C) `app/design/frontend/Acme/Retail/catalog/templates/product/view/description.phtml`
- D) `app/design/frontend/Acme/Retail/Catalog/templates/product/view/description.phtml`

**Answer: B**
*To override a module template in a theme, place it at `<theme_root>/<Vendor_Module>/templates/<same/relative/path>`. The module identifier uses underscore format (`Magento_Catalog`), not slash format.*

---

**Q34.** Which base class provides the `getUrl()` method available in block templates?

- A) `Magento\Framework\View\Element\AbstractBlock`
- B) `Magento\Framework\View\Element\Template`
- C) `Magento\Backend\Block\Template`
- D) `Magento\Framework\DataObject`

**Answer: B**
*`getUrl()` is defined in `Magento\Framework\View\Element\Template` (which extends `AbstractBlock` and adds URL generation helpers). Most content blocks extend `Template`.*

---

**Q35.** What is the effect of calling `$block->getChildHtml()` with **no arguments**?

- A) It throws an exception
- B) It returns the HTML of the first child only
- C) It returns the combined HTML output of ALL child blocks in sort order
- D) It returns an empty string

**Answer: C**
*Calling `getChildHtml()` with no arguments renders all child blocks in their sort order and concatenates the output.*

---

### Section 4: Escaping & Security (Questions 36–43)

---

**Q36.** Which escaping method should be used for a URL placed in an `href` attribute?

- A) `$escaper->escapeHtml($url)`
- B) `$escaper->escapeHtmlAttr($url)`
- C) `$escaper->escapeUrl($url)`
- D) `$escaper->escapeJs($url)`

**Answer: C**
*`escapeUrl()` is specifically designed for URL contexts. It encodes characters that could be dangerous in URL positions, including preventing `javascript:` protocol injection.*

---

**Q37.** A developer outputs a product description that may contain HTML like `<b>` and `<em>`. Which call correctly allows only these tags?

- A) `$escaper->escapeHtml($desc)`
- B) `$escaper->escapeHtml($desc, ['b', 'em'])`
- C) `$escaper->escapeHtmlWithTags($desc, ['b', 'em'])`
- D) `strip_tags($desc, '<b><em>')`

**Answer: B**
*The second parameter of `escapeHtml()` accepts an array of allowed tag names. Tags not in the list are stripped or encoded.*

---

**Q38.** In a `<script>` tag, a developer outputs a PHP variable. Which escaper method must be used?

```html
<script>
    var config = {name: "<?php echo $escaper->___($name); ?>"};
</script>
```

- A) `escapeHtml`
- B) `escapeHtmlAttr`
- C) `escapeJs`
- D) `escapeUrl`

**Answer: C**
*`escapeJs()` escapes strings for use inside JavaScript string literals. It encodes characters that would break out of the JS string or execute code.*

---

**Q39.** `$escaper` is available in `.phtml` templates. Where does it come from?

- A) It is a global variable set in `index.php`
- B) It is injected by the `Magento\Framework\View\TemplateEngine\Php` engine when rendering the template
- C) It must be explicitly declared in each template using `$this->getEscaper()`
- D) It is a static helper class accessed automatically

**Answer: B**
*The template engine (`Magento\Framework\View\TemplateEngine\Php`) makes `$block` available via PHP variable scoping (method parameter in `render()`), and calls `extract($dictionary)` to inject DI-configured `blockVariables` including `$escaper`, `$secureRenderer`, and `$localeFormatter`. Note: `$templateContext` is a PHP property of `Magento\Framework\View\Element\Template` used internally to determine which block is passed as `$block` — it is NOT a separate variable in template scope.*

---

**Q40.** Which of the following is NOT a valid escaper method in Magento 2?

- A) `escapeHtml()`
- B) `escapeHtmlAttr()`
- C) `escapeXml()`
- D) `escapeCss()`

**Answer: C**
*`escapeXml()` is not a standard method on `Magento\Framework\Escaper`. The standard methods are `escapeHtml`, `escapeHtmlAttr`, `escapeUrl`, `escapeJs`, and `escapeCss`.*

---

**Q41.** A developer uses `echo htmlspecialchars($block->getTitle(), ENT_QUOTES, 'UTF-8')`. What is the problem with this approach?

- A) `htmlspecialchars` does not exist in PHP
- B) It is not the Magento-recommended approach; `$escaper->escapeHtml()` should be used
- C) `ENT_QUOTES` flag is invalid
- D) The encoding should be `ISO-8859-1`

**Answer: B**
*While `htmlspecialchars` works in PHP, Magento requires the use of its own `$escaper` service. This ensures consistency, proper configuration, and future-proofing. Static analysis tools also flag direct PHP functions as violations.*

---

**Q42.** When outputting a translated string that itself contains HTML, what is the correct pattern?

```php
// Which approach is correct?

// A:
echo $escaper->escapeHtml(__('Click <a href="%1">here</a>', $url));

// B:
echo __('Click <a href="%1">here</a>', $escaper->escapeUrl($url));
```

- A) Only Option A
- B) Only Option B
- C) Both are equivalent
- D) Neither — translated strings should never contain HTML

**Answer: B**
*In Option B, the dynamic part (`$url`) is escaped before being inserted into the phrase. The phrase result (which contains intentional HTML) is then output as raw HTML. Option A would HTML-encode the `<a>` tags, breaking the link.*

---

**Q43.** Which statement about `$escaper->escapeHtml()` is TRUE?

- A) It prevents all HTML from appearing in the output
- B) It converts `<`, `>`, `&`, `"`, and `'` to HTML entities when no allowed tags are specified
- C) It removes all whitespace from the input string
- D) It only works on UTF-8 encoded strings

**Answer: B**
*By default (without allowed tags), `escapeHtml()` converts the five special HTML characters to entities, preventing HTML injection. With an allowed tags list, those specific tags are preserved.*

---

### Section 5: Translations (Questions 44–50)

---

**Q44.** What does the `__()` function return in Magento 2?

- A) A `string`
- B) A `Magento\Framework\Phrase` object
- C) A `Magento\I18n\TranslatedString` object
- D) A `boolean` indicating if the translation exists

**Answer: B**
*`__()` always returns a `Magento\Framework\Phrase` object. It is cast to string via `__toString()` when echoed or concatenated.*

---

**Q45.** A translation `"Add to Cart","Ajouter au panier"` exists in a module's `fr_FR.csv`. The theme also has a `fr_FR.csv`. Which translation takes priority?

- A) The module CSV always takes priority
- B) The theme CSV takes priority over the module CSV
- C) The last loaded CSV wins (unpredictable)
- D) Both are used simultaneously

**Answer: B**
*Theme-level translation CSVs override module-level CSVs. This allows themes to customize translation text without modifying module code.*

---

**Q46.** Which of the following is the correct CSV format for a translation with a placeholder?

- A) `"Hello %s","Bonjour %s"`
- B) `"Hello, {name}!","Bonjour, {name}!"`
- C) `"Hello, %1!","Bonjour, %1!"`
- D) `"Hello, $1!","Bonjour, $1!"`

**Answer: C**
*Magento uses `%1`, `%2`, etc. for positional placeholders in translation strings. `%s` is a PHP `sprintf` placeholder (not used here). `{name}` and `$1` are not valid Magento placeholder formats.*

---

**Q47.** How are translation strings made available to JavaScript files?

- A) The `__()` function is available in RequireJS modules automatically
- B) Strings must be in `.csv` files and are compiled into `js-translation.json` during static content deploy
- C) JavaScript translations require a separate `.js` file in `i18n/`
- D) JavaScript files cannot be translated in Magento

**Answer: B**
*JavaScript translations are compiled from `.csv` files into a `js-translation.json` file during `setup:static-content:deploy`. Client-side code uses `$t()` or `$.mage.__()` to access these translations.*

---

**Q48.** What is the HIGHEST priority translation source in Magento?

- A) Module i18n CSV files
- B) Theme i18n CSV files
- C) Database translation records (admin-configured)
- D) Language pack CSV files

**Answer: C**
*Database-stored translations (configurable in the admin under Stores > Translations) have the highest priority and override all file-based translations.*

---

**Q49.** A developer has this code in a template: `echo __('Welcome, %1! You have %2 messages.', $name, $count)`. How does Magento insert `$name` and `$count` into the translation?

- A) They replace `%1` and `%2` positionally when the Phrase is cast to string
- B) They are inserted using PHP's `sprintf()` internally
- C) They must be escaped before being passed to `__()`
- D) They are embedded using named parameter syntax

**Answer: A**
*Magento's `Phrase` object stores the arguments and replaces `%1`, `%2`, etc. positionally when the phrase is converted to a string. The replacement happens via Magento's own renderer, not `sprintf()`.*

---

**Q50.** To add a JavaScript translation in a `.js` file using RequireJS, which dependency should be included?

- A) `mage/i18n`
- B) `mage/translate`
- C) `Magento_Translation/js/translate`
- D) `Magento_Core/js/i18n`

**Answer: B**
*`mage/translate` is the RequireJS module that returns `$.mage.__` (the translation function). It is conventionally required with `$t` as the AMD callback alias, so `$t('string')` works. The module maps to `lib/web/mage/translate.js`.*

---

## 12. Weak-Area Diagnosis Framework

Use this framework after scoring your practice test.

### 12.1 Categorization Sheet

For each wrong answer, fill in this table:

```
+----+----------+----------------------+------------------+------------------+
| Q# | Section  | Topic                | Why I Got It     | Priority to Fix  |
|    |          |                      | Wrong            | (High/Med/Low)   |
+----+----------+----------------------+------------------+------------------+
|    |          |                      |                  |                  |
|    |          |                      |                  |                  |
|    |          |                      |                  |                  |
+----+----------+----------------------+------------------+------------------+
```

### 12.2 Common Wrong Answer Patterns

| Pattern | Root Cause | Fix |
|---|---|---|
| Got file path wrong | Memorized path incorrectly | Redraw directory tree from memory daily |
| Confused `<block>` and `<container>` | Blurred distinction | Memorize the feature table in §9.1 |
| Wrong escaper method | Did not think about context | Memorize the context table in §7.2 |
| `before/after` ordering confusion | Assumed `before` = after | Practice with small XML examples |
| `__()` return type confusion | Assumed it returns a string | Write a test script casting the result |
| Translation priority wrong | Did not remember the hierarchy | Draw the priority chain from memory |
| Layout merge vs override confusion | Conceptual gap | Re-read §9.1 Confusion #3 |

### 12.3 Section Score Analysis

```
Score by section:
  Section 1 (Theme Arch):  ___ / ___ correct  = ____%
  Section 2 (Layout XML):  ___ / ___ correct  = ____%
  Section 3 (Templates):   ___ / ___ correct  = ____%
  Section 4 (Escaping):    ___ / ___ correct  = ____%
  Section 5 (Translations):___ / ___ correct  = ____%

Lowest scoring section: _______________
Second lowest:          _______________

These become your Week 2 focus areas (in addition to new topics).
```

---

## 13. Week 2 Planning Based on Results

### 13.1 Week 2 Topics Overview

| Day | Topic | Dependency on Week 1 |
|---|---|---|
| Day 8 | CSS/LESS Architecture | Strong — needs theme structure knowledge |
| Day 9 | RequireJS & JavaScript | Strong — needs static file paths |
| Day 10 | UI Components (Magento 2) | Moderate — needs layout/block model |
| Day 11 | Checkout Customization | Moderate — needs UI components |
| Day 12 | Performance & Caching | Light — mostly independent |
| Day 13 | Admin Configuration | Light — mostly independent |

### 13.2 If Your Score Was Below 60%

Prioritize these Week 1 topics for reinforcement **before** advancing:

```
[ ] Re-read all of Section 3 (Day 1 Review) — theme structure
[ ] Practice drawing layout XML from memory (no notes)
[ ] Write 3 layout XML files from scratch as exercises
[ ] Rewrite the escaper method table 3x from memory
[ ] Verify translation priority chain without looking
```

Adjust your Week 2 schedule to include 30 minutes of Week 1 review each day until Section 1–3 scores exceed 75%.

### 13.3 If Your Score Was 60–75%

Normal trajectory. Focus on:

```
[ ] Review specific wrong answers next week (not today)
[ ] Push harder on CSS/LESS and RequireJS in Week 2
[ ] Take a mini practice test (15 questions) at the end of each Week 2 day
```

### 13.4 If Your Score Was Above 75%

Strong foundation. You can:

```
[ ] Spend extra Week 2 time on advanced topics (Knockout.js, UI components)
[ ] Add a second full practice test at the end of Week 2 instead of Day 14
[ ] Begin reviewing performance/caching topics earlier than planned
```

### 13.5 Week 2 Adjustment Checklist

```
Based on practice test results, I will:

[ ] Spend extra time on: ___________________________
[ ] De-prioritize (confident in): __________________
[ ] Additional resources to consult: _______________
[ ] My target score for Week 2 practice test: ______
```

---

## Quick-Reference Checklist

Everything testable from Week 1 — use this as a daily 5-minute review card.

### Theme Architecture
- [ ] Theme files live at `app/design/frontend/<Vendor>/<Theme>/`
- [ ] Admin theme files live at `app/design/adminhtml/<Vendor>/<Theme>/`
- [ ] Two required files: `theme.xml` and `registration.php`
- [ ] `composer.json` is optional (for Composer distribution only)
- [ ] `<parent>` tag in `theme.xml` defines the parent theme
- [ ] Full fallback chain for a Luma child: `CustomTheme -> Luma -> Blank`
- [ ] `ComponentRegistrar::THEME` constant in `registration.php`
- [ ] Path in `registration.php` is `'frontend/Vendor/Theme'` (no `app/design/` prefix)
- [ ] `pub/static/` is generated — never edit files there directly
- [ ] Static file fallback: most specific theme first, then parents, then module defaults
- [ ] Layout files are **merged**; template files are **overridden**; static files are **overridden**
- [ ] Preview image convention: `media/preview.jpg` referenced in `theme.xml`

### Layout XML
- [ ] Three layout file types: page layout, page configuration, generic layout
- [ ] `default.xml` handle loads on every frontend page
- [ ] `<block>` has template + PHP class; `<container>` is structural only
- [ ] `<container>` has `htmlTag`, `htmlClass`, `htmlId` — `<block>` does not
- [ ] `before="-"` = first; `after="-"` = last; `before="name"` = before that block
- [ ] `<move element="..." destination="..." before/after="..."/>`
- [ ] `remove="true"` removes block from tree; `display="false"` hides but keeps in tree
- [ ] `<update handle="..."/>` merges another handle's XML into current page
- [ ] `cacheable="false"` disables FPC for the whole page
- [ ] `ifconfig="path/to/config"` conditionally renders block
- [ ] `<argument>` types: `string`, `boolean`, `number`, `object`, `array`, `url`, `options`, `helper`, `const`, `null`
- [ ] Array arguments use `<item name="key" xsi:type="type">value</item>`
- [ ] `as` attribute provides alias for `getChildHtml('alias')` calls
- [ ] Layout merge order: module files → parent theme files → active theme files

### Templates & Blocks
- [ ] `$block` is the correct variable in templates (not `$this`)
- [ ] Default block class when none specified: `Magento\Framework\View\Element\Template`
- [ ] Template reference format: `Vendor_Module::path/to/file.phtml`
- [ ] Theme template override path: `<theme>/<Vendor_Module>/templates/<path>.phtml`
- [ ] `$block->getChildHtml('name')` renders a child block
- [ ] `$block->getChildHtml()` with no args renders all children
- [ ] `$block->getData('key')` or magic getter `$block->getKey()` for layout arguments
- [ ] `_prepareLayout()` is the method to override for layout-dependent setup
- [ ] `$block->getChildBlock('name')` returns the block object (not HTML)
- [ ] `$block->getUrl('path/route', ['param' => 'value'])` generates URLs

### Output Escaping
- [ ] `$escaper` is auto-injected into template scope by the PHP template engine
- [ ] `escapeHtml($str)` — for HTML text nodes
- [ ] `escapeHtmlAttr($str)` — for HTML attribute values
- [ ] `escapeUrl($str)` — for `href`, `src`, `action` attributes
- [ ] `escapeJs($str)` — for values inside JavaScript string literals
- [ ] `escapeCss($str)` — for inline CSS values
- [ ] `escapeHtml($str, ['b', 'em', 'a'])` — whitelist allowed tags
- [ ] `escapeXml()` does NOT exist in Magento's Escaper
- [ ] Do NOT use `htmlspecialchars()` directly — always use `$escaper`
- [ ] In block PHP classes: `$this->_escaper` (protected property from AbstractBlock)
- [ ] Never double-escape — escape dynamic parts *before* passing to `__()`

### Translations & i18n
- [ ] Theme CSV: `<theme_root>/i18n/<locale>.csv`
- [ ] Module CSV: `<module_root>/i18n/<locale>.csv`
- [ ] CSV format: `"Original","Translation"` (double-quoted, comma-separated)
- [ ] Placeholder format: `%1`, `%2`, ... (NOT `%s` or `{name}`)
- [ ] `__()` returns `Magento\Framework\Phrase`, not a string
- [ ] Cast to string if needed: `(string)__('Hello')`
- [ ] Translation priority (highest to lowest): Database > Theme CSV > Module CSV > Original string
- [ ] JS translations use `mage/translate` RequireJS module (returns `$.mage.__`; conventionally aliased as `$t` in AMD callbacks)
- [ ] JS strings compiled into `js-translation.json` during static content deploy
- [ ] `$.mage.__('string')` works in jQuery widget contexts
- [ ] In `.html` UI templates: `data-bind="i18n: 'String'"` or `translate="true"` attribute

### Practice Test Strategy
- [ ] AD0-E727 passing score ≈ 68%
- [ ] 60 questions / 90 minutes
- [ ] Sections 1–3 (Week 1 material) ≈ 65% of the exam
- [ ] Baseline score below 50% = increase study time
- [ ] Baseline 50–65% = normal, on track
- [ ] Baseline 65%+ = strong, push on Week 2 advanced topics
- [ ] Categorize wrong answers by section — do not study corrections same day
- [ ] Lowest-scoring sections become top priorities for Week 2
