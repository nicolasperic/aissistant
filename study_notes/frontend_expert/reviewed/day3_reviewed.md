# Day 3 — Transactional Emails & Translations
## Magento 2 / Adobe Commerce Certified Professional Study Notes

---

## Table of Contents

1. [Overview](#1-overview)
2. [Transactional Email Architecture](#2-transactional-email-architecture)
3. [Email Template File Structure](#3-email-template-file-structure)
4. [Theme-Level Email Customization](#4-theme-level-email-customization)
5. [Admin-Level Email Customization](#5-admin-level-email-customization)
6. [Email Template Variables and Directives](#6-email-template-variables-and-directives)
7. [Email Layout Handles](#7-email-layout-handles)
8. [Translation System Architecture](#8-translation-system-architecture)
9. [Translation Files: i18n CSV Format](#9-translation-files-i18n-csv-format)
10. [The `__()` Function in PHP](#10-the----function-in-php)
11. [The `$.mage.__()` Function in JavaScript](#11-the-mage----function-in-javascript)
12. [The `translate` Attribute in XML](#12-the-translate-attribute-in-xml)
13. [CLI Translation Commands](#13-cli-translation-commands)
14. [Translation Fallback and Priority](#14-translation-fallback-and-priority)
15. [Hands-On Walkthroughs](#15-hands-on-walkthroughs)
16. [Common Pitfalls](#16-common-pitfalls)
17. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Overview

Day 3 covers two distinct subsystems of Magento 2 that are frequently tested on the Adobe Commerce certification exam but are often underestimated by candidates:

| Subsystem | Core Concern | Where Configured |
|---|---|---|
| **Transactional Emails** | Customizing system-generated emails | Theme files or Admin panel |
| **Translations** | Multilingual phrase overrides | CSV files in theme or module |

Both systems share a common trait: they have **multiple layers** with a defined precedence order, and the exam loves to test which layer wins in a conflict.

---

## 2. Transactional Email Architecture

### 2.1 How Magento Sends Transactional Emails

```
Order Placed
     |
     v
Sales module dispatches event
     |
     v
Magento\Framework\Mail\Template\TransportBuilder
     |
     v
Resolves template:
  1. Admin override? (Marketing > Email Templates)
  2. Theme-level template file?
  3. Module default template file?
     |
     v
Template rendered with variable injection
     |
     v
SMTP / sendmail transport
```

### 2.2 Module Default Template Locations

Every module that sends emails ships default templates inside:

```
app/code/<Vendor>/<Module>/view/frontend/email/
app/code/<Vendor>/<Module>/view/adminhtml/email/
```

**Example — Magento_Sales default templates:**

```
vendor/magento/module-sales/view/frontend/email/
  order_new.html
  order_new_guest.html
  order_update.html
  invoice_new.html
  shipment_new.html
  creditmemo_new.html
```

> **Exam focus:** Default templates live inside the **module's `view/frontend/email/`** directory, NOT inside a theme. You override them at the theme level by mirroring the module's structure.

---

## 3. Email Template File Structure

### 3.1 Template Naming Convention

Template filenames follow the snake_case convention matching the template ID declared in the module's `config.xml` or `email_templates.xml`.

**Example — `Magento_Sales` module `email_templates.xml`:**

```xml
<!-- vendor/magento/module-sales/etc/email_templates.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Email:etc/email_templates.xsd">
    <template id="sales_email_order_template"
              label="New Order"
              file="order_new.html"
              type="html"
              module="Magento_Sales"
              area="frontend"/>
    <template id="sales_email_order_guest_template"
              label="New Order for Guest"
              file="order_new_guest.html"
              type="html"
              module="Magento_Sales"
              area="frontend"/>
</config>
```

### 3.2 Key `email_templates.xml` Attributes

| Attribute | Description |
|---|---|
| `id` | Unique identifier referenced in system config |
| `label` | Human-readable name shown in Admin dropdown |
| `file` | Filename inside `view/<area>/email/` |
| `type` | `html` or `text` |
| `module` | Module scope for translations |
| `area` | `frontend` or `adminhtml` |

> **Exam focus:** The `id` attribute in `email_templates.xml` maps to the value stored in **System > Configuration** (e.g., `trans_email/ident_sales/email`). This is how Magento resolves which template to render.

---

## 4. Theme-Level Email Customization

### 4.1 Directory Structure for Theme Overrides

To override a module's email template in your theme, mirror the module's path under:

```
app/design/frontend/<Vendor>/<theme>/
  <ModuleVendor>_<ModuleName>/
    email/
      <template_filename>.html
```

**Concrete example — Override `order_new.html` for Magento_Sales:**

```
app/design/frontend/MyVendor/mytheme/
  Magento_Sales/
    email/
      order_new.html          <-- your override
      order_new_guest.html    <-- optional override for guest orders
```

> **Exam focus:** The path pattern is `<ThemeDir>/<ModuleVendor>_<ModuleName>/email/<file>.html` — the folder name uses the **underscore** convention (`Magento_Sales`), not a slash.

### 4.2 Why Use Theme-Level Override vs Admin?

| Criterion | Theme-Level | Admin Panel |
|---|---|---|
| Version controlled | Yes | No (stored in DB) |
| Survives upgrades | Yes (as theme file) | Partially (in DB, but base can change) |
| Developer workflow | Preferred | Marketing team preferred |
| Requires deployment | Yes | No |
| Affects all stores | Configurable per store view | Configurable per store view |

> **Exam focus:** Theme-level overrides are **version controlled** and **deployment-driven**. Admin overrides are stored in the **`email_template` database table**. Know this distinction.

### 4.3 Email Template Inheritance

Themes inherit email templates following the same theme inheritance chain:

```
Your Theme  -->  Parent Theme  -->  Module Default
(checked first)                    (fallback)
```

If `order_new.html` is not found in your theme, Magento walks up the parent chain before using the module default.

---

## 5. Admin-Level Email Customization

### 5.1 Creating an Admin Email Template

**Path:** Admin > Marketing > Communications > Email Templates > Add New Template

Workflow:
1. Select a **template to load** (loads the current active template as starting point)
2. Edit HTML/text in the WYSIWYG or code editor
3. Save with a unique name
4. **Assign the new template** in Stores > Configuration > Sales > Sales Emails > [section] > [Email Template dropdown]

> **Exam focus:** Creating an admin template does NOT automatically use it. You must **assign it** in the Store Configuration for the correct store view. An unassigned admin template has no effect.

### 5.2 Where Admin Templates Are Stored

```sql
-- Admin-created templates are persisted in the database
SELECT template_id, template_code, template_type, added_at
FROM email_template;
```

When Magento resolves a template, a non-null `template_id` reference in system config tells the `TransportBuilder` to load from `email_template` table first.

### 5.3 Resolution Priority (Most Specific Wins)

```
Priority 1 (highest): Admin-created template (assigned in Store Config)
         |
         v
Priority 2: Theme-level override file
         |
         v
Priority 3: Module default template file (lowest)
```

> **Exam focus:** **Admin overrides beat theme overrides**, which beat module defaults. This is a common exam trap — theme customizations are overridden by admin templates when both exist.

---

## 6. Email Template Variables and Directives

### 6.1 Template Variable Syntax

Magento email templates use a proprietary directive syntax — **not** Twig or Blade.

```html
<!-- Simple variable output -->
{{var order.increment_id}}

<!-- Object method call -->
{{var order.getCustomerName()}}

<!-- Config variable -->
{{config path="general/store_information/name"}}

<!-- Custom variable (Admin > System > Custom Variables) -->
{{customvar code="your_variable_code"}}
```

### 6.2 The `{{trans}}` Directive (Translations in Email)

```html
<!-- Static translation string -->
{{trans "Your order has been placed."}}

<!-- Translation with variable interpolation -->
{{trans "Hello %name, your order #%order_id is confirmed."
    name=$order.customer_firstname
    order_id=$order.increment_id}}
```

> **Exam focus:** Use `{{trans "..."}}` — NOT `{{__()}}` or any PHP syntax — for translations **inside email template files**. This directive uses the module-scope translations from `i18n/` CSV files.

### 6.3 Conditional Directives

```html
<!-- if/else -->
{{if order.getIsVirtual()}}
    <p>This is a virtual order.</p>
{{else}}
    <p>Your items will be shipped to: {{var order.getShippingAddress().format('html')}}</p>
{{/if}}

<!-- depend (simpler boolean check) -->
{{depend order.getCustomerNote()}}
    <p>Order note: {{var order.getCustomerNote()}}</p>
{{/depend}}
```

| Directive | Purpose |
|---|---|
| `{{var ...}}` | Output a variable value |
| `{{config path="..."}}` | Output a store config value |
| `{{trans "..."}}` | Translatable string |
| `{{if}} ... {{else}} ... {{/if}}` | Conditional block |
| `{{depend}} ... {{/depend}}` | Show block if value is truthy |
| `{{inlinecss file="..."}}` | Inline a CSS file into the email |
| `{{template config_path="..."}}` | Include another template |
| `{{customvar code="..."}}` | Output an Admin custom variable |

### 6.4 Inlining CSS in Emails

Email clients strip `<style>` blocks, so Magento provides:

```html
<!-- In your email template header/wrapper -->
{{inlinecss file="css/email-inline.css"}}
```

This reads the CSS file from your theme's `web/css/` directory and inlines the styles onto matching elements at render time.

> **Exam focus:** `{{inlinecss}}` references a file path **relative to the theme's `web/` directory**, not an absolute path.

---

## 7. Email CSS — How Styles Are Applied

### 7.1 Email Templates Do Not Use Layout XML

Email templates are **not** rendered through the storefront layout XML pipeline. There is no `email_default.xml` layout handle, and no `Magento_Email/layout/` directory exists in any core theme or module. The `<head><css>` layout XML syntax does not apply to emails.

Email CSS is controlled entirely through directives inside the email templates themselves, primarily in the **header template**.

### 7.2 The Email Header Template

The default header template at `vendor/magento/module-email/view/frontend/email/header.html` embeds CSS using two directives:

```html
<style type="text/css">
    {{var template_styles|raw}}
    {{css file="css/email.css"}}
</style>
...
{{inlinecss file="css/email-inline.css"}}
```

| Directive | Behavior |
|---|---|
| `{{css file="css/email.css"}}` | Embeds CSS text inside a `<style>` block (for clients that support `<style>`) |
| `{{inlinecss file="css/email-inline.css"}}` | Queues the file for post-render CSS inlining onto individual elements |

Both paths are relative to the theme's published static content (i.e., the theme's `web/css/` directory compiled to `pub/static/`).

### 7.3 Customizing Email CSS in Your Theme

The blank theme ships:

```
vendor/magento/theme-frontend-blank/web/css/
  email.less           <-- styles embedded via {{css}} directive
  email-inline.less    <-- styles inlined via {{inlinecss}} directive
  email-fonts.less
  source/
    _email-base.less
    _email-extend.less
    _email-variables.less
```

To override email styles in your child theme, create the corresponding files under `web/css/` in your theme root (not under `Magento_Email/`).

To override the **header or footer template** itself, place your file at:

```
app/design/frontend/MyVendor/mytheme/
  Magento_Email/
    email/
      header.html     <-- override the wrapping header
      footer.html     <-- override the wrapping footer
```

> **Exam focus:** Email templates do **not** use layout XML handles. Email CSS is controlled via `{{css}}` and `{{inlinecss}}` directives in the header template. To customize email styles, override the theme's `web/css/email*.less` files or override `Magento_Email/email/header.html`.

---

## 8. Translation System Architecture

### 8.1 The Three Translation Layers

Magento's i18n system resolves phrases through a hierarchy:

```
Layer 3 (highest priority): Database translations
         (Admin > Stores > Other Settings > Translations)
         |
         v
Layer 2: Theme i18n CSV files
         app/design/frontend/<Vendor>/<theme>/i18n/<locale>.csv
         |
         v
Layer 1: Module i18n CSV files (lowest priority)
         app/code/<Vendor>/<Module>/i18n/<locale>.csv
         (or vendor/magento/module-*/i18n/<locale>.csv)
```

> **Exam focus:** **Database translations override theme CSV, which overrides module CSV.** The database layer (inline translation tool + admin translations grid) always wins.

### 8.2 Locale Code Format

Translation CSV filenames use IETF language tag format:

```
en_US.csv    <-- English (United States)
en_GB.csv    <-- English (United Kingdom)
fr_FR.csv    <-- French (France)
de_DE.csv    <-- German (Germany)
ja_JP.csv    <-- Japanese (Japan)
```

---

## 9. Translation Files: i18n CSV Format

### 9.1 CSV File Format

The file is a simple two-column CSV:

```
"Original phrase","Translated phrase"
```

**Rules:**
- Both columns are **double-quoted**
- Commas inside quotes are safe (standard CSV escaping)
- Percent signs `%1`, `%2` are positional placeholders
- The file encoding **must be UTF-8**

### 9.2 Module-Level Translation CSV

```
app/code/MyVendor/MyModule/i18n/en_US.csv
```

```csv
"Add to Cart","Add to Cart"
"Out of Stock","Out of Stock"
"Hello, %1!","Hello, %1!"
"Your order #%1 has been placed","Your order #%1 has been placed"
```

### 9.3 Theme-Level Translation CSV (Override)

```
app/design/frontend/MyVendor/mytheme/i18n/en_US.csv
```

```csv
"Add to Cart","Shop Now"
"Out of Stock","Temporarily Unavailable"
"Continue Shopping","Keep Shopping"
```

> **Exam focus:** A theme-level CSV **overrides** the module-level CSV for the same phrase. This is the correct way to rebrand UI text across all modules without editing core files.

### 9.4 CSV File for Multiple Modules in a Theme

A single theme CSV file affects translations across ALL modules that use those phrases. There is one CSV per locale per theme — not one per module per theme.

```
app/design/frontend/MyVendor/mytheme/
  i18n/
    en_US.csv    <-- overrides phrases from any module for en_US
    fr_FR.csv    <-- French overrides
    de_DE.csv    <-- German overrides
```

---

## 10. The `__()` Function in PHP

### 10.1 Basic Usage

```php
<?php
// In Block classes, Controllers, any class that implements
// Magento\Framework\Phrase and uses translation infrastructure

// Simple string
echo __('Add to Cart');

// With positional placeholders
echo __('Hello, %1!', $customerName);

// Multiple placeholders
echo __('Order #%1 placed on %2', $orderId, $orderDate);
```

### 10.2 `__()` Returns a `Phrase` Object

```php
<?php
use Magento\Framework\Phrase;

// __() returns a Magento\Framework\Phrase object, not a string
$phrase = __('Add to Cart');

// Phrase implements __toString(), so it auto-converts:
echo $phrase;           // outputs translated string
(string) $phrase;       // explicit cast
$phrase->render();      // explicit render
```

> **Exam focus:** `__()` returns a `\Magento\Framework\Phrase` **object**, not a raw string. It lazily renders via `__toString()`. This matters for type-checking and serialization contexts.

### 10.3 Using `__()` in Template Files (`.phtml`)

```php
<!-- app/design/frontend/MyVendor/mytheme/Magento_Catalog/templates/product/view/addtocart.phtml -->
<?php
/** @var \Magento\Catalog\Block\Product\View $block */
?>
<button type="submit" title="<?= $block->escapeHtmlAttr(__('Add to Cart')) ?>">
    <span><?= __('Add to Cart') ?></span>
</button>
```

> **Exam focus:** Always **escape output** from `__()` in HTML contexts using `$block->escapeHtml()` or `$block->escapeHtmlAttr()`. The `Phrase` object does NOT auto-escape.

### 10.4 `__()` in Class Constructors and DI

```php
<?php
namespace MyVendor\MyModule\Model;

use Magento\Framework\Exception\LocalizedException;

class OrderProcessor
{
    public function process($order): void
    {
        if (!$order->getId()) {
            // LocalizedException accepts a Phrase object
            throw new LocalizedException(__('Order not found with ID: %1', $order->getId()));
        }
    }
}
```

---

## 11. The `$.mage.__()` Function in JavaScript

### 11.1 Basic Usage

```javascript
// RequireJS module context
define(['mage/translate'], function ($t) {
    'use strict';

    return {
        getMessage: function () {
            // Using the imported $t alias
            return $t('Add to Cart');
        }
    };
});
```

```javascript
// jQuery widget context ($.mage.__ is globally available after mage/translate loads)
define(['jquery', 'mage/translate'], function ($) {
    'use strict';

    $.widget('mage.myWidget', {
        _create: function () {
            var message = $.mage.__('Item added to cart');
            console.log(message);
        }
    });
});
```

### 11.2 How JS Translations Are Delivered

JS translations are **not** loaded from CSV at runtime directly. Instead:

```
Magento CLI: bin/magento setup:static-content:deploy
        |
        v
Reads i18n/<locale>.csv files
        |
        v
Generates: pub/static/frontend/<Vendor>/<theme>/<locale>/
              js-translation.json
```

```json
// pub/static/frontend/MyVendor/mytheme/en_US/js-translation.json
{
    "Add to Cart": "Shop Now",
    "Remove": "Delete",
    "Continue Shopping": "Keep Shopping"
}
```

> **Exam focus:** JS translations are compiled into a **`js-translation.json`** file during `setup:static-content:deploy`. They are NOT read from CSV at runtime. If you add new translations, you must **redeploy static content**.

### 11.3 Inline Translation vs `$.mage.__()`

```javascript
// This phrase can be caught by i18n:collect-phrases
var label = $.mage.__('Search');

// This CANNOT be caught by collect-phrases (dynamic concatenation)
var key = 'Search';
var label = $.mage.__(key);  // AVOID for translatable strings
```

> **Exam focus:** The `i18n:collect-phrases` scanner looks for `$.mage.__('...')` with **string literals** inside. Dynamic variable arguments are not collected.

---

## 12. The `translate` Attribute in XML

### 12.1 Layout XML — `translate` on Node Attributes

In layout XML, the `translate` attribute tells Magento which child attributes of a node contain translatable text:

```xml
<!-- app/design/frontend/MyVendor/mytheme/Magento_Catalog/layout/catalog_product_view.xml -->
<block class="Magento\Catalog\Block\Product\View"
       name="product.info"
       template="Magento_Catalog::product/view.phtml">
    <arguments>
        <argument name="css_class" xsi:type="string">product-info-main</argument>
    </arguments>
</block>

<!-- Example with translate attribute on action argument -->
<block class="Magento\Theme\Block\Html\Title"
       name="page.main.title"
       template="Magento_Theme::html/title.phtml">
    <arguments>
        <argument name="default_title" translate="true" xsi:type="string">
            Product Details
        </argument>
    </arguments>
</block>
```

### 12.2 `translate` in `menu.xml` and Navigation

```xml
<!-- etc/adminhtml/menu.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Backend:etc/menu.xsd">
    <menu>
        <add id="MyVendor_MyModule::my_menu"
             title="My Module"
             translate="title"
             module="MyVendor_MyModule"
             sortOrder="100"
             resource="MyVendor_MyModule::my_menu"/>
    </menu>
</config>
```

> **Exam focus:** The `translate` attribute in XML specifies **which attribute(s)** on that node should be translated. Multiple attributes are space-separated: `translate="title label"`.

### 12.3 `translate` in `system.xml` (Configuration Fields)

```xml
<!-- etc/adminhtml/system.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Config:etc/system_file.xsd">
    <system>
        <section id="my_section" translate="label" type="text" sortOrder="100"
                 showInDefault="1" showInWebsite="1" showInStore="1">
            <label>My Section</label>
            <group id="my_group" translate="label" type="text" sortOrder="10"
                   showInDefault="1" showInWebsite="1" showInStore="1">
                <label>My Group</label>
                <field id="enabled" translate="label comment" type="select"
                       sortOrder="10" showInDefault="1">
                    <label>Enable Module</label>
                    <comment>Enable or disable the module functionality.</comment>
                    <source_model>Magento\Config\Model\Config\Source\Yesno</source_model>
                </field>
            </group>
        </section>
    </system>
</config>
```

> **Exam focus:** In `system.xml`, `translate="label comment"` means **both** the `<label>` and `<comment>` child elements are translatable. Each space-separated value names a **child element** whose text content should be translated.

---

## 13. CLI Translation Commands

### 13.1 `i18n:collect-phrases`

Scans source code and collects all strings wrapped in translation functions.

```bash
# Scan a specific module directory
bin/magento i18n:collect-phrases app/code/MyVendor/MyModule \
    --output app/code/MyVendor/MyModule/i18n/en_US.csv

# Scan an entire theme
bin/magento i18n:collect-phrases app/design/frontend/MyVendor/mytheme \
    --output app/design/frontend/MyVendor/mytheme/i18n/en_US.csv

# Scan everything (Magento root) — creates a combined dictionary
bin/magento i18n:collect-phrases . \
    --output pub/i18n/combined_en_US.csv

# Magento mode flag (adds module context column)
bin/magento i18n:collect-phrases app/code/MyVendor/MyModule \
    --output app/code/MyVendor/MyModule/i18n/en_US.csv \
    --magento
```

**What it scans for:**

| Source Type | Pattern Matched |
|---|---|
| PHP | `__('...')` |
| PHTML | `__('...')` |
| JavaScript | `$.mage.__('...')`, `$t('...')` |
| XML | `translate` attribute |
| Email templates | `{{trans "..."}}` |

> **Exam focus:** `i18n:collect-phrases` scans for **string literals only**. Dynamically constructed strings (concatenation, variables) are **not collected**. The `--magento` flag adds a third column for the module context.

### 13.2 `i18n:pack`

Packages translation files from a dictionary into individual module/theme directories.

```bash
# Pack translations for a specific locale from a dictionary file
bin/magento i18n:pack \
    pub/i18n/fr_FR.csv \
    fr_FR \
    --mode=merge

# Available modes:
#   replace  -- Overwrites existing translations (default)
#   merge    -- Merges, existing translations preserved if not in new file
```

**Typical workflow:**

```
1. i18n:collect-phrases  -->  Generate base CSV with all phrases
2. Translator fills in   -->  Translations added to CSV
3. i18n:pack             -->  Distribute translated CSV to modules/themes
```

> **Exam focus:** `i18n:pack` distributes a **single combined CSV** into the correct module and theme directories. `--mode=merge` preserves existing translations not present in the new file; `--mode=replace` overwrites completely.

### 13.3 `setup:static-content:deploy` for JS Translations

```bash
# Deploy static content (includes generating js-translation.json)
bin/magento setup:static-content:deploy en_US fr_FR de_DE

# For a specific theme
bin/magento setup:static-content:deploy en_US \
    --theme MyVendor/mytheme

# Force redeploy (even if files exist)
bin/magento setup:static-content:deploy en_US -f
```

> **Exam focus:** After adding or modifying translation CSV files, you must run **`setup:static-content:deploy`** to regenerate `js-translation.json`. PHP translations via `__()` are read at runtime from CSV (via a compiled file), but JS translations require the static deploy step.

### 13.4 Translation-Related Cache

```bash
# Translations are cached — clear after CSV changes
bin/magento cache:clean translate

# Or clear all
bin/magento cache:flush
```

> **Exam focus:** The `translate` cache type must be **flushed** after modifying CSV translation files for changes to appear in the PHP layer. Cache type: `translate`.

---

## 14. Translation Fallback and Priority

### 14.1 Complete Priority Stack (Highest to Lowest)

```
+--------------------------------------------------+
|  1. Database (Admin > Stores > Translations)     |  <-- HIGHEST
+--------------------------------------------------+
         |
         v
+--------------------------------------------------+
|  2. Theme i18n CSV                               |
|     app/design/.../i18n/<locale>.csv             |
+--------------------------------------------------+
         |
         v
+--------------------------------------------------+
|  3. Parent theme i18n CSV (if theme has parent)  |
+--------------------------------------------------+
         |
         v
+--------------------------------------------------+
|  4. Module i18n CSV                              |
|     app/code/.../i18n/<locale>.csv               |
+--------------------------------------------------+
         |
         v
+--------------------------------------------------+
|  5. Original string (no translation found)       |  <-- LOWEST
+--------------------------------------------------+
```

### 14.2 Locale Fallback

If `fr_FR.csv` doesn't contain a phrase, Magento does **not** automatically fall back to `fr.csv`. You must include all phrases in the locale-specific file.

> **Exam focus:** There is **no automatic language-family fallback** (e.g., `fr_FR` does not fall back to `fr`). Each locale CSV must be complete.

### 14.3 Module Context for Translations

When the same phrase exists in multiple modules' CSV files with different translations, Magento uses the **module context** to resolve which translation to use. The `TranslateInterface::getData()` method loads translations keyed by `"<phrase>::<module>"`.

```csv
-- In Magento_Catalog/i18n/en_US.csv:
"Price","Price"

-- In MyVendor_MyModule/i18n/en_US.csv:
"Price","Cost"
```

> **Exam focus:** Module-scope translations prevent conflicts between modules that translate the same phrase differently. The theme-level CSV has **no module scope** — it overrides regardless of which module the phrase originates from.

---

## 15. Hands-On Walkthroughs

### 15.1 Walkthrough: Customize the Order Confirmation Email

**Step 1 — Create the override directory**

```bash
mkdir -p app/design/frontend/MyVendor/mytheme/Magento_Sales/email
```

**Step 2 — Copy the default template as a starting point**

```bash
cp vendor/magento/module-sales/view/frontend/email/order_new.html \
   app/design/frontend/MyVendor/mytheme/Magento_Sales/email/order_new.html
```

**Step 3 — Edit the template**

```html
<!-- app/design/frontend/MyVendor/mytheme/Magento_Sales/email/order_new.html -->
<!--@subject {{trans "Your %store_name order confirmation" store_name=$store.getFrontendName()}} @-->
<!--@vars {
"var store.getFrontendName()":"Store Name",
"var order.increment_id":"Order ID",
"var order.getCustomerName()":"Customer Name"
} @-->

{{template config_path="design/email/header_template"}}

<table>
    <tr>
        <td>
            <h1>{{trans "Thank you for your order, %customer_name!"
                customer_name=$order.getCustomerName()}}</h1>

            <p>{{trans "Your order number is:"}}
               <strong>#{{var order.increment_id}}</strong>
            </p>

            {{depend order.getCustomerNote()}}
            <p><strong>{{trans "Note:"}}</strong> {{var order.getCustomerNote()}}</p>
            {{/depend}}

            {{block class='Magento\Sales\Block\Order\Email\Items'
                     area='frontend'
                     template='Magento_Sales::email/items.phtml'
                     order=$order}}
        </td>
    </tr>
</table>

{{template config_path="design/email/footer_template"}}
```

**Step 4 — Verify template is picked up (in Developer mode)**

```bash
bin/magento cache:clean
# Place a test order or use:
bin/magento dev:template-hints:enable   # helps debug but doesn't apply to email
```

**Step 5 — Send a test email from Admin**

Admin > Marketing > Communications > Email Templates > [Select your template] > Preview Template

> **Exam focus:** The `<!--@subject ... @-->` block at the top of the template file defines the **email subject line**. It uses the same `{{trans}}` and `{{var}}` directives.

---

### 15.2 Walkthrough: Add a Translation CSV and Test a Phrase Override

**Step 1 — Create the i18n directory**

```bash
mkdir -p app/design/frontend/MyVendor/mytheme/i18n
```

**Step 2 — Create the translation file**

```bash
touch app/design/frontend/MyVendor/mytheme/i18n/en_US.csv
```

**Step 3 — Add phrase overrides**

```csv
"Add to Cart","Add to Basket"
"Add to Wish List","Save for Later"
"My Cart","My Basket"
"Proceed to Checkout","Checkout Now"
"Continue Shopping","Keep Shopping"
"Out of Stock","Currently Unavailable"
```

**Step 4 — Flush the translate cache**

```bash
bin/magento cache:clean translate
```

**Step 5 — Verify the override**

Navigate to a product page — you should see "Add to Basket" instead of "Add to Cart".

**Step 6 — Test with `i18n:collect-phrases` to validate**

```bash
bin/magento i18n:collect-phrases \
    app/design/frontend/MyVendor/mytheme \
    --output /tmp/theme_phrases.csv

# Check what was collected
cat /tmp/theme_phrases.csv | grep -i "basket"
```

**Step 7 — Deploy static content for JS translation pickup**

```bash
bin/magento setup:static-content:deploy en_US --theme MyVendor/mytheme -f
```

**Step 8 — Verify `js-translation.json` contains your phrase**

```bash
cat pub/static/frontend/MyVendor/mytheme/en_US/js-translation.json | python3 -m json.tool | grep -i "basket"
```

---

### 15.3 Walkthrough: Use `i18n:pack` for a New Locale

```bash
# Step 1: Collect all phrases into a combined dictionary
bin/magento i18n:collect-phrases . \
    --output pub/i18n/en_US_combined.csv \
    --magento

# Step 2: Give combined CSV to translator → returns fr_FR_combined.csv

# Step 3: Pack translated file into module directories
bin/magento i18n:pack \
    pub/i18n/fr_FR_combined.csv \
    fr_FR \
    --mode=merge

# Step 4: Deploy static content for the new locale
bin/magento setup:static-content:deploy fr_FR

# Step 5: Flush caches
bin/magento cache:clean translate config
```

---

## 16. Common Pitfalls

### 16.1 Email Template Pitfalls

| Pitfall | Explanation | Fix |
|---|---|---|
| Template not loading | Theme directory name wrong (e.g., `Magento/Sales` instead of `Magento_Sales`) | Use underscore: `Magento_Sales` |
| Admin template ignored | Template created but not assigned in Store Config | Assign template in Sales Emails config |
| `{{var}}` returns empty | Variable not passed to template by the sending code | Check `TransportBuilder::setTemplateVars()` in the module |
| CSS not inlined | `{{inlinecss}}` path is wrong | Path is relative to theme `web/` directory |
| Subject not updating | Subject defined in `<!--@subject @-->` comment block | Check comment block syntax at top of template |

### 16.2 Translation Pitfalls

| Pitfall | Explanation | Fix |
|---|---|---|
| Translation not showing | Translate cache not flushed | `bin/magento cache:clean translate` |
| JS translation not working | `js-translation.json` stale | `bin/magento setup:static-content:deploy` |
| CSV not loaded | File not UTF-8 encoded | Re-save as UTF-8 without BOM |
| `__()` not collected | Dynamic variable used instead of string literal | Use string literals in `__()` calls |
| Admin translation missing | Phrase exists in CSV but Admin DB translation overrides | Check Admin > Stores > Translations |
| Phrase partially translated | Same phrase in multiple module CSVs with conflict | Use theme-level CSV to override all |

---

## Quick-Reference Checklist

### Transactional Email Templates

- [ ] Default email templates live in: `<Module>/view/frontend/email/<template>.html`
- [ ] Theme override path: `app/design/frontend/<Vendor>/<theme>/<ModuleVendor>_<ModuleName>/email/<template>.html`
- [ ] Module folder name uses **underscore** convention (e.g., `Magento_Sales`)
- [ ] Template IDs are declared in `<Module>/etc/email_templates.xml`
- [ ] Admin-created templates are stored in the **`email_template` database table**
- [ ] Admin templates must be **assigned** in Stores > Config > Sales Emails to take effect
- [ ] Resolution priority: **Admin (DB) > Theme file > Module default**
- [ ] Email subject line is defined in `<!--@subject {{trans "..."}} @-->` comment block at top of file
- [ ] Template directives: `{{var}}`, `{{config}}`, `{{trans}}`, `{{if}}`, `{{depend}}`, `{{inlinecss}}`, `{{template}}`
- [ ] `{{inlinecss file="..."}}` path is relative to theme's `web/` directory
- [ ] Email templates do NOT use layout XML handles — no `email_default.xml` handle exists
- [ ] Email CSS is controlled via `{{css}}` (style block) and `{{inlinecss}}` (inlining) directives in the header template
- [ ] Override email header/footer: `<ThemeRoot>/Magento_Email/email/header.html` (or `footer.html`)
- [ ] Email CSS files in blank theme: `web/css/email.less` and `web/css/email-inline.less`

### Translation System

- [ ] Translation priority: **Database > Theme CSV > Module CSV**
- [ ] Theme CSV location: `app/design/frontend/<Vendor>/<theme>/i18n/<locale>.csv`
- [ ] Module CSV location: `app/code/<Vendor>/<Module>/i18n/<locale>.csv`
- [ ] CSV format: `"Original phrase","Translated phrase"` — both double-quoted, UTF-8 encoding
- [ ] One CSV file per locale per theme/module (e.g., `en_US.csv`, `fr_FR.csv`)
- [ ] Theme CSV overrides phrases from **any module** — no module scope restriction
- [ ] `__('phrase')` returns a `\Magento\Framework\Phrase` **object**, not a string
- [ ] `__('Hello, %1!', $name)` — positional placeholders use `%1`, `%2`, etc.
- [ ] Always escape `__()` output in HTML: `$block->escapeHtml(__('...'))`
- [ ] In email templates, use `{{trans "..."}}` — NOT `__()` PHP syntax
- [ ] JS translations use `$.mage.__('...')` or `$t('...')` from `mage/translate`
- [ ] JS translations are compiled into `js-translation.json` during `setup:static-content:deploy`
- [ ] `translate` XML attribute names the **child element(s)** whose text is translatable
- [ ] In `menu.xml`/`system.xml`, `translate="title label"` means multiple attributes are translatable

### CLI Commands

- [ ] `bin/magento i18n:collect-phrases <path> --output <file.csv>` — scans source for translatable phrases
- [ ] `--magento` flag on `i18n:collect-phrases` adds a third module-context column
- [ ] `i18n:collect-phrases` only collects **string literals** — not dynamic variables
- [ ] `bin/magento i18n:pack <dict.csv> <locale> --mode=[replace|merge]` — distributes translations to module/theme dirs
- [ ] `--mode=merge` preserves existing translations not in the new file
- [ ] `bin/magento setup:static-content:deploy <locale>` — must run after CSV changes for JS translations
- [ ] `bin/magento cache:clean translate` — must run after CSV changes for PHP translations
- [ ] After adding a new locale CSV, both `cache:clean translate` AND `setup:static-content:deploy` are required

### Key Distinctions for the Exam

- [ ] Theme-level email override = version controlled, requires deployment
- [ ] Admin-level email override = stored in DB, no deployment needed, **always wins**
- [ ] `__()` in PHP = runtime translation using CSV → compiled translation files
- [ ] `$.mage.__()` in JS = requires `js-translation.json` → generated by static deploy
- [ ] `{{trans}}` in email templates = uses module-scope CSV translations
- [ ] No automatic locale family fallback (`fr_FR` does NOT fall back to `fr`)
- [ ] The `translate` cache type (`cache:clean translate`) is distinct from `full_page` and `block_html`
