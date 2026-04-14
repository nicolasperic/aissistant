# Day 2 — Extending Existing Themes & Theme Inheritance

## Table of Contents
1. [Overview & Learning Objectives](#1-overview--learning-objectives)
2. [Theme Inheritance Architecture](#2-theme-inheritance-architecture)
3. [Declaring a Parent Theme via `<parent>`](#3-declaring-a-parent-theme-via-parent)
4. [File Override Strategy & Directory Mirroring](#4-file-override-strategy--directory-mirroring)
5. [Static File Fallback Order](#5-static-file-fallback-order)
6. [The `_theme.less` Role](#6-the-_themeless-role)
7. [Extending vs Overriding Layout XML](#7-extending-vs-overriding-layout-xml)
8. [Overriding Images, Fonts & Static Assets](#8-overriding-images-fonts--static-assets)
9. [Hands-On: Extending Magento/luma or Magento/blank](#9-hands-on-extending-magentoluma-or-magentoblank)
10. [Overriding a Template File (footer.phtml)](#10-overriding-a-template-file-footerphtml)
11. [CE vs EE Theme Inheritance Differences](#11-ce-vs-ee-theme-inheritance-differences)
12. [Parent Theme vs Standalone: When to Choose](#12-parent-theme-vs-standalone-when-to-choose)
13. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Overview & Learning Objectives

Theme inheritance is one of the foundational concepts in Magento 2 frontend development. Rather than copying an entire theme and risk losing future upstream improvements, you **extend** an existing theme, inheriting all its assets, layouts, and templates — while selectively overriding only what you need.

By the end of Day 2 you will be able to:
- Declare a parent theme and understand the inheritance chain
- Know exactly *where* to place files to override parent assets
- Explain the complete static file fallback order
- Distinguish between *extending* and *overriding* layout XML
- Override templates, images, fonts, and LESS files correctly
- Articulate when CE and EE inheritance chains differ

---

## 2. Theme Inheritance Architecture

Magento 2 resolves files through a **waterfall (fallback) chain**, checking locations from most specific (your custom theme) to least specific (base module code), stopping at the first match found.

```
+---------------------------------------------------+
|           Custom Child Theme                      |  <-- checked FIRST
|  app/design/frontend/Vendor/theme/                |
+---------------------------------------------------+
                    |
                    v
+---------------------------------------------------+
|           Parent Theme (e.g. Magento/luma)        |  <-- checked SECOND
|  app/design/frontend/Magento/luma/               |
+---------------------------------------------------+
                    |
                    v
+---------------------------------------------------+
|           Grandparent Theme (Magento/blank)       |  <-- checked THIRD
|  app/design/frontend/Magento/blank/              |
+---------------------------------------------------+
                    |
                    v
+---------------------------------------------------+
|           Module view/ directories                |  <-- checked FOURTH
|  vendor/magento/module-*/view/frontend/           |
|  app/code/Vendor/Module/view/frontend/            |
+---------------------------------------------------+
                    |
                    v
+---------------------------------------------------+
|           Magento_Base (lib/web/)                 |  <-- checked LAST
|  lib/web/                                         |
+---------------------------------------------------+
```

**Exam focus:**
- The fallback chain always moves from **most specific → least specific**
- Magento resolves the **first file found** — it does not merge PHP templates or images (only layout XML and LESS can be merged/extended)
- The chain can be multiple levels deep (child → parent → grandparent → module → lib)

---

## 3. Declaring a Parent Theme via `<parent>`

### 3.1 The `theme.xml` File

Every Magento 2 theme declares its identity and optional parent in `theme.xml`, located at the **theme root**.

```
app/design/frontend/Vendor/MyTheme/theme.xml
```

```xml
<?xml version="1.0"?>
<theme xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:noNamespaceSchemaLocation="urn:magento:framework:Config/etc/theme.xsd">
    <title>Vendor MyTheme</title>
    <parent>Magento/luma</parent>
    <media>
        <preview_image>media/preview.jpg</preview_image>
    </media>
</theme>
```

| Element | Required | Purpose |
|---|---|---|
| `<title>` | Yes | Human-readable name shown in Admin |
| `<parent>` | No | Declares the parent theme (`Vendor/theme`) |
| `<media>/<preview_image>` | No | Screenshot shown in Admin > Content > Themes |

**Exam focus:**
- `<parent>` value is in `Vendor/theme` format — **not** a file path
- Omitting `<parent>` creates a **standalone** theme (must supply everything itself)
- You can only declare **one** parent; multi-level inheritance is handled automatically by the chain
- The schema is validated against `urn:magento:framework:Config/etc/theme.xsd`

### 3.2 Registering the Theme

The companion file `registration.php` at the theme root registers the theme with the Magento component system:

```php
<?php
use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::THEME,
    'frontend/Vendor/MyTheme',
    __DIR__
);
```

**Exam focus:**
- Both `theme.xml` **and** `registration.php` are required for a theme to appear in Admin
- The string `'frontend/Vendor/MyTheme'` must match the directory path under `app/design/`

### 3.3 The Full luma Inheritance Chain

```
Vendor/MyTheme
    |
    v
Magento/luma
    |
    v
Magento/blank
    |
    v
(Module view/frontend/ directories)
    |
    v
lib/web/
```

Magento/luma's own `theme.xml` declares:

```xml
<parent>Magento/blank</parent>
```

And Magento/blank declares **no parent**, making it the root of the design theme chain.

---

## 4. File Override Strategy & Directory Mirroring

The key rule for overriding any file in a parent theme or module is:

> **Place the replacement file in your theme at the exact same relative path as the original.**

### 4.1 Overriding Module Templates

Module templates live in `view/frontend/templates/` inside the module. To override, mirror that structure inside your theme under a directory named after the module:

```
Original (module):
vendor/magento/module-checkout/view/frontend/templates/cart/item/default.phtml

Override path in your theme:
app/design/frontend/Vendor/MyTheme/
    Magento_Checkout/
        templates/
            cart/
                item/
                    default.phtml
```

**Pattern:** `<ThemeRoot>/<Namespace>_<Module>/templates/<path/to/file.phtml>`

### 4.2 Overriding Parent Theme Templates

If a file exists in the parent theme (not the module), mirror its path from the parent theme root:

```
Original (parent theme Magento/luma):
app/design/frontend/Magento/luma/Magento_Theme/templates/html/footer.phtml

Override path in your child theme:
app/design/frontend/Vendor/MyTheme/
    Magento_Theme/
        templates/
            html/
                footer.phtml
```

### 4.3 Overriding Web Static Assets (CSS, JS, Images in modules)

```
Original module web asset:
vendor/magento/module-catalog/view/frontend/web/css/source/_module.less

Override in your theme:
app/design/frontend/Vendor/MyTheme/
    Magento_Catalog/
        web/
            css/
                source/
                    _module.less
```

### 4.4 Overriding Theme-Level Static Files

```
Original in parent theme:
app/design/frontend/Magento/luma/web/css/source/_theme.less

Override in your theme:
app/design/frontend/Vendor/MyTheme/
    web/
        css/
            source/
                _theme.less
```

### 4.5 Directory Structure Summary

```
app/design/frontend/Vendor/MyTheme/
|
+-- theme.xml                          (theme declaration)
+-- registration.php                   (component registration)
+-- composer.json                      (optional, for packaged themes)
|
+-- media/
|   +-- preview.jpg                    (Admin preview image)
|
+-- web/                               (theme-level static files)
|   +-- css/
|   |   +-- source/
|   |       +-- _theme.less            (theme variable overrides)
|   |       +-- _extend.less           (additive LESS additions)
|   +-- fonts/                         (custom web fonts)
|   +-- images/                        (theme-level images, e.g. logo)
|   +-- js/                            (theme-level JS)
|
+-- Magento_Theme/                     (override Magento_Theme module)
|   +-- templates/
|   |   +-- html/
|   |       +-- footer.phtml           (overrides footer template)
|   +-- layout/
|       +-- default.xml                (layout override/extension)
|
+-- Magento_Catalog/                   (override Magento_Catalog module)
    +-- templates/
    +-- layout/
    +-- web/
```

**Exam focus:**
- Module override directories use `Namespace_Module` format (e.g., `Magento_Checkout`, `Magento_Catalog`)
- The `templates/` subdirectory is always required when overriding `.phtml` files
- Web assets go under `web/` without a `templates/` subdirectory
- Layout files go under `layout/` without a `templates/` subdirectory

---

## 5. Static File Fallback Order

Magento's `\Magento\Framework\View\Design\FileResolution\Fallback` system checks locations in this precise order for **static files** (CSS, JS, images, fonts):

### 5.1 Fallback Order (Detailed)

```
1. app/design/frontend/<Vendor>/<theme>/web/
   (your child theme, theme-level)

2. app/design/frontend/<Vendor>/<theme>/<Namespace_Module>/web/
   (your child theme, module-specific)

3. app/design/frontend/<ParentVendor>/<parentTheme>/web/
   (parent theme, theme-level)

4. app/design/frontend/<ParentVendor>/<parentTheme>/<Namespace_Module>/web/
   (parent theme, module-specific)

5. [Grandparent theme — same pattern, repeats up the chain]

6. vendor/magento/<module>/view/frontend/web/
   OR app/code/<Vendor>/<Module>/view/frontend/web/
   (module source)

7. lib/web/
   (Magento base web library)
```

### 5.2 Template File Fallback Order

```
1. app/design/frontend/<Vendor>/<theme>/<Namespace_Module>/templates/
   (child theme, module-specific)

2. app/design/frontend/<ParentVendor>/<parentTheme>/<Namespace_Module>/templates/
   (parent theme, module-specific)

3. [Grandparent — continues up chain]

4. vendor/magento/<module>/view/frontend/templates/
   OR app/code/<Vendor>/<Module>/view/frontend/templates/
   (module source)
```

### 5.3 Layout XML Fallback Order

```
1. app/design/frontend/<Vendor>/<theme>/<Namespace_Module>/layout/
2. app/design/frontend/<ParentVendor>/<parentTheme>/<Namespace_Module>/layout/
3. [Continue up chain...]
4. vendor/magento/<module>/view/frontend/layout/
```

> **Key difference:** Unlike templates and static files, layout XML files with the **same handle name** are **merged** (not replaced). Override behavior requires special XML instructions (covered in Section 7).

**Exam focus:**
- Static files and templates: **first match wins** (replacement/override)
- Layout XML: **all matching files are merged** (additive by default)
- `lib/web/` is the absolute last resort for static files
- The fallback mechanism is controlled by `di.xml` configuration in `Magento_Framework`

---

## 6. The `_theme.less` Role

### 6.1 What `_theme.less` Does

`_theme.less` is the **variable override file** for LESS-based theming. It is imported into the LESS compilation pipeline and allows you to redefine LESS variables declared in Magento UI library or parent themes **before** those variables are used in component styles.

**Location in your theme:**
```
app/design/frontend/Vendor/MyTheme/web/css/source/_theme.less
```

### 6.2 How It Fits in the LESS Pipeline

```
lib/web/css/source/lib/variables/_colors.less   (Magento UI lib defaults)
         |
         v
app/design/frontend/Magento/blank/web/css/source/_theme.less  (blank overrides)
         |
         v
app/design/frontend/Magento/luma/web/css/source/_theme.less   (luma overrides)
         |
         v
app/design/frontend/Vendor/MyTheme/web/css/source/_theme.less (YOUR overrides)
         |
         v
Component .less files use the final resolved variable values
```

### 6.3 Example `_theme.less` Content

```less
//  =============================================
//  Vendor MyTheme - Variable Overrides
//  =============================================

//  Color palette
@primary__color                     : #e02424;
@link__color                        : #e02424;
@link__hover__color                 : #b91c1c;

//  Typography
@font-family__base                  : 'Inter', sans-serif;
@font-size__base                    : 16px;

//  Header
@header__background-color           : #1e1e1e;
@header-icons-color                 : #ffffff;

//  Buttons
@button__background                 : @primary__color;
@button__border                     : 1px solid @primary__color;
@button__color                      : #ffffff;
```

### 6.4 `_extend.less` vs `_theme.less`

| File | Purpose | Behavior |
|---|---|---|
| `_theme.less` | Override LESS **variables** | Replaces parent `_theme.less` via fallback |
| `_extend.less` | Add **new CSS rules** on top of inherited styles | Automatically imported after all inherited styles |

**`_extend.less` location:**
```
app/design/frontend/Vendor/MyTheme/web/css/source/_extend.less
```

```less
//  _extend.less — Add rules WITHOUT touching _theme.less

.page-header {
    border-bottom: 3px solid @primary__color;
}

.nav-sections {
    background-color: #2d2d2d;
}
```

**Exam focus:**
- `_theme.less` is **replaced** via the fallback chain — your file wins over the parent's
- `_extend.less` is **always appended** — it adds rules rather than replacing
- Variable overrides belong in `_theme.less`; new CSS rules belong in `_extend.less`
- Only LESS variables defined in the UI library can be overridden via `_theme.less`

---

## 7. Extending vs Overriding Layout XML

Layout XML is the most nuanced area of theme inheritance. Magento 2 **merges** layout files from all levels of the chain, so your file does not automatically replace the parent's.

### 7.1 Extending Layout XML (Additive)

By default, placing a layout file in your theme **extends** the parent — your instructions are merged in and can add, modify, or remove blocks.

**Example:** Add a block to the footer without replacing the entire footer layout.

```
app/design/frontend/Vendor/MyTheme/Magento_Theme/layout/default.xml
```

```xml
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <!-- ADD a new block to an existing container -->
        <referenceContainer name="footer-container">
            <block class="Magento\Framework\View\Element\Template"
                   name="vendor.custom.footer.links"
                   template="Vendor_Module::custom_footer_links.phtml"
                   after="-"/>
        </referenceContainer>
    </body>
</page>
```

### 7.2 Overriding Layout XML (Replace Entirely)

To **replace** a layout handle file entirely (preventing the parent's version from being merged), use the `layout/override/` directory:

```
app/design/frontend/Vendor/MyTheme/
    Magento_Theme/
        layout/
            override/
                base/
                    default.xml        <-- overrides module-level default.xml
                theme/
                    Magento/luma/
                        default.xml    <-- overrides parent theme's default.xml
```

**Override paths:**

| Override target | Directory |
|---|---|
| Module layout file | `<ThemeRoot>/<Namespace_Module>/layout/override/base/<file>.xml` |
| Parent theme layout file | `<ThemeRoot>/<Namespace_Module>/layout/override/theme/<Vendor>/<theme>/<file>.xml` |

### 7.3 Common Layout XML Operations

```xml
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <!-- REMOVE a block -->
        <referenceBlock name="report.bugs" remove="true"/>

        <!-- MOVE a block -->
        <move element="breadcrumbs" destination="page.wrapper" before="page.main.container"/>

        <!-- CHANGE a block argument -->
        <referenceBlock name="page.main.title">
            <arguments>
                <argument name="css_class" xsi:type="string">custom-page-title</argument>
            </arguments>
        </referenceBlock>

        <!-- CHANGE the template of an existing block -->
        <referenceBlock name="footer_links">
            <action method="setTemplate">
                <argument name="template" xsi:type="string">Magento_Theme::html/footer_links.phtml</argument>
            </action>
        </referenceBlock>
    </body>
</page>
```

**Exam focus:**
- Layout files in the **standard** `layout/` directory are **merged** (extended)
- Layout files in `layout/override/base/` **replace** the module's original file
- Layout files in `layout/override/theme/<Vendor>/<theme>/` **replace** a specific theme's file
- `remove="true"` permanently removes a block from rendering for that handle
- You cannot un-remove a block removed by a parent; plan inheritance carefully

---

## 8. Overriding Images, Fonts & Static Assets

### 8.1 Overriding the Store Logo

The logo is placed at:

```
app/design/frontend/Vendor/MyTheme/web/images/logo.svg
```

And configured in **Admin → Content → Design → Configuration → Header → Logo Image**, or via layout XML:

```xml
<!-- Magento_Theme/layout/default.xml -->
<referenceBlock name="logo">
    <arguments>
        <argument name="logo_file" xsi:type="string">images/logo.svg</argument>
        <argument name="logo_img_width" xsi:type="number">200</argument>
        <argument name="logo_img_height" xsi:type="number">50</argument>
    </arguments>
</referenceBlock>
```

### 8.2 Overriding Module Images

```
Original:
vendor/magento/module-catalog/view/frontend/web/images/product/placeholder/image.jpg

Override:
app/design/frontend/Vendor/MyTheme/
    Magento_Catalog/
        web/
            images/
                product/
                    placeholder/
                        image.jpg
```

### 8.3 Overriding Fonts

Place custom font files in your theme's `web/fonts/` directory:

```
app/design/frontend/Vendor/MyTheme/web/fonts/
    Inter-Regular.woff2
    Inter-Regular.woff
    Inter-Bold.woff2
    Inter-Bold.woff
```

Then declare them in a LESS file (e.g., `_theme.less` or a dedicated `_fonts.less`):

```less
//  Custom font declarations
& when (@media-common = true) {
    @font-face {
        font-family: 'Inter';
        src: url('../fonts/Inter-Regular.woff2') format('woff2'),
             url('../fonts/Inter-Regular.woff') format('woff');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
    }

    @font-face {
        font-family: 'Inter';
        src: url('../fonts/Inter-Bold.woff2') format('woff2'),
             url('../fonts/Inter-Bold.woff') format('woff');
        font-weight: 700;
        font-style: normal;
        font-display: swap;
    }
}
```

### 8.4 Overriding JavaScript

```
Original module JS:
vendor/magento/module-catalog/view/frontend/web/js/catalog-add-to-cart.js

Override in theme:
app/design/frontend/Vendor/MyTheme/
    Magento_Catalog/
        web/
            js/
                catalog-add-to-cart.js
```

> **Warning:** Overriding JS is risky across upgrades. Prefer `requirejs-config.js` mixins or maps for JS customization.

### 8.5 `requirejs-config.js` for Asset Mapping

```
app/design/frontend/Vendor/MyTheme/requirejs-config.js
```

```javascript
var config = {
    map: {
        '*': {
            // Redirect a module to a custom override
            'Magento_Catalog/js/catalog-add-to-cart':
                'Vendor_Module/js/catalog-add-to-cart-override'
        }
    },
    config: {
        mixins: {
            'Magento_Catalog/js/catalog-add-to-cart': {
                'Vendor_Module/js/catalog-add-to-cart-mixin': true
            }
        }
    }
};
```

**Exam focus:**
- Static file overrides work purely through the **fallback chain** — no configuration needed
- Font URLs in LESS are relative to the **compiled CSS output** location, so use `../fonts/`
- The `requirejs-config.js` files from **all themes in the chain** are **merged** (not overridden)
- Logo configuration can come from **Admin UI** or **layout XML** — Admin takes precedence

---

## 9. Hands-On: Extending Magento/luma or Magento/blank

### 9.1 Create the Theme Directory Structure

```bash
# Create theme directories
mkdir -p app/design/frontend/Vendor/MyTheme/web/css/source
mkdir -p app/design/frontend/Vendor/MyTheme/web/images
mkdir -p app/design/frontend/Vendor/MyTheme/web/fonts
mkdir -p app/design/frontend/Vendor/MyTheme/Magento_Theme/templates/html
mkdir -p app/design/frontend/Vendor/MyTheme/Magento_Theme/layout
mkdir -p app/design/frontend/Vendor/MyTheme/media
```

### 9.2 Create `theme.xml`

```bash
cat > app/design/frontend/Vendor/MyTheme/theme.xml << 'EOF'
<?xml version="1.0"?>
<theme xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:noNamespaceSchemaLocation="urn:magento:framework:Config/etc/theme.xsd">
    <title>Vendor MyTheme</title>
    <parent>Magento/luma</parent>
    <media>
        <preview_image>media/preview.jpg</preview_image>
    </media>
</theme>
EOF
```

### 9.3 Create `registration.php`

```php
<?php
use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::THEME,
    'frontend/Vendor/MyTheme',
    __DIR__
);
```

### 9.4 Create `_theme.less`

```less
// app/design/frontend/Vendor/MyTheme/web/css/source/_theme.less

//  Primary brand color
@primary__color: #1a56db;
@link__color: #1a56db;
@link__hover__color: #1e429f;

//  Typography
@font-family__base: 'Open Sans', sans-serif;
@font-size__base: 15px;

//  Buttons
@button__background: @primary__color;
@button__color: #ffffff;
```

### 9.5 Register & Enable the Theme

```bash
# Clear generated files and caches
bin/magento cache:clean
bin/magento cache:flush

# If using Composer-based deployment, also run:
bin/magento setup:upgrade

# Apply the theme in Admin:
# Admin > Content > Design > Configuration > Edit Store View > Applied Theme
# Select "Vendor MyTheme" and Save
```

### 9.6 Deploy Static Content to Verify

```bash
# Deploy static content for your theme (development mode)
bin/magento setup:static-content:deploy -f -t Vendor/MyTheme en_US

# Or in developer mode (files are generated on-the-fly):
bin/magento deploy:mode:set developer
```

**Exam focus:**
- `setup:upgrade` is needed when registering new themes via `registration.php`
- In **developer mode**, static files are resolved on-the-fly (no deployment needed)
- In **production mode**, `setup:static-content:deploy` is required after any change
- Theme assignment is done per **store view**, not per website

---

## 10. Overriding a Template File (footer.phtml)

### 10.1 Locate the Original File

```bash
# Find the original footer template
find vendor/magento -name "footer.phtml" -path "*/Magento_Theme/*"
# Result: vendor/magento/module-theme/view/frontend/templates/html/footer.phtml
```

### 10.2 Examine the Original

```bash
cat vendor/magento/module-theme/view/frontend/templates/html/footer.phtml
```

```php
<?php
/**
 * @var $block \Magento\Framework\View\Element\Template
 */
?>
<footer class="page-footer">
    <div class="footer content">
        <?= $block->getChildHtml() ?>
        <?php if ($block->getCopyrightInfo()): ?>
            <div class="copyright">
                <span><?= $block->escapeHtml($block->getCopyrightInfo()) ?></span>
            </div>
        <?php endif; ?>
    </div>
</footer>
```

### 10.3 Create the Override in Your Theme

```bash
# Create the override directory
mkdir -p app/design/frontend/Vendor/MyTheme/Magento_Theme/templates/html

# Copy original as starting point (best practice)
cp vendor/magento/module-theme/view/frontend/templates/html/footer.phtml \
   app/design/frontend/Vendor/MyTheme/Magento_Theme/templates/html/footer.phtml
```

### 10.4 Edit Your Override

```php
<?php
/**
 * Custom footer override
 * @var $block \Magento\Framework\View\Element\Template
 */
?>
<footer class="page-footer">
    <div class="footer content">
        <!-- Custom: Added social media links -->
        <div class="footer-social-links">
            <a href="https://twitter.com/vendor" class="social-link social-link--twitter"
               title="<?= $block->escapeHtmlAttr(__('Follow us on Twitter')) ?>">
                <?= $block->escapeHtml(__('Twitter')) ?>
            </a>
            <a href="https://facebook.com/vendor" class="social-link social-link--facebook"
               title="<?= $block->escapeHtmlAttr(__('Follow us on Facebook')) ?>">
                <?= $block->escapeHtml(__('Facebook')) ?>
            </a>
        </div>

        <?= $block->getChildHtml() ?>

        <?php if ($block->getCopyrightInfo()): ?>
            <div class="copyright">
                <span><?= $block->escapeHtml($block->getCopyrightInfo()) ?></span>
                <span class="copyright-custom">
                    &mdash; <?= $block->escapeHtml(__('Proudly built with Magento')) ?>
                </span>
            </div>
        <?php endif; ?>
    </div>
</footer>
```

### 10.5 Verify the Override Works

```bash
# In developer mode — just clear cache
bin/magento cache:clean

# Verify by checking the fallback resolution (Magento debug logging)
# Enable template path hints in Admin:
# Admin > Stores > Configuration > Advanced > Developer > Debug
# Set "Enabled Template Path Hints for Storefront" = Yes

# Or check via bin/magento
bin/magento dev:template-hints:enable
```

After enabling template hints, refresh the storefront and hover over the footer — you should see the path pointing to your custom theme's file:

```
app/design/frontend/Vendor/MyTheme/Magento_Theme/templates/html/footer.phtml
```

**Exam focus:**
- Always **copy** the original file first, then modify — never edit in place
- Template hints (`dev:template-hints:enable`) show the resolved path, proving which file is active
- Template override path format: `<ThemeRoot>/<Namespace_Module>/templates/<relative/path>.phtml`
- The `escapeHtml()` and `escapeHtmlAttr()` calls are security best practices — examiners notice their absence

---

## 11. CE vs EE Theme Inheritance Differences

### 11.1 Community Edition (CE / Open Source)

- Base chain: **Magento/blank** is the root theme
- Magento/luma is the default demonstration theme (extends blank)
- No proprietary theme layers

```
Your Theme
    --> Magento/luma
        --> Magento/blank
            --> Module view/frontend/
                --> lib/web/
```

### 11.2 Enterprise Edition (EE / Commerce)

Adobe Commerce adds additional enterprise-specific modules and, historically, an enterprise theme. The inheritance chain gains extra module directories:

```
Your Theme
    --> Magento/luma (or custom EE theme)
        --> Magento/blank
            --> Module view/frontend/ (CE modules)
            --> Module view/frontend/ (EE-specific modules: e.g., Magento_GiftCard,
                                        Magento_CustomerBalance, Magento_Reward)
                --> lib/web/
```

**Key EE-specific considerations:**

| Aspect | CE | EE |
|---|---|---|
| Additional modules needing potential override | ~50 frontend modules | ~80+ frontend modules (incl. B2B, Gift Cards, Rewards, etc.) |
| Page Builder | Not included (or limited) | Full Page Builder with its own UI components |
| Visual Merchandiser UI | Not present | Requires specific template considerations |
| B2B Theme layer | N/A | B2B modules have their own `view/frontend/` paths |
| PWA Studio | Available | Additional EE-specific API surface |

### 11.3 B2B Module Theme Overrides (EE)

For B2B-specific templates, the module directory pattern is the same:

```
app/design/frontend/Vendor/MyTheme/
    Magento_Company/
        templates/
    Magento_NegotiableQuote/
        templates/
    Magento_RequisitionList/
        templates/
```

### 11.4 Checking the EE Inheritance Chain Programmatically

```bash
# List all themes currently registered
bin/magento info:backpressure:setup  # Not relevant

# Check theme configuration
bin/magento cache:status

# Better: query the database
mysql -u root -p magento -e "SELECT * FROM theme;"
```

**Exam focus:**
- CE and EE use the **same inheritance mechanism** — only the number of modules differs
- EE adds enterprise-specific modules whose templates can be overridden using the **same** `Namespace_Module` pattern
- `Magento/blank` is the root for **both** CE and EE standard theme chains
- Page Builder (EE) has its own content type templates in `Magento_PageBuilder/templates/`

---

## 12. Parent Theme vs Standalone: When to Choose

### 12.1 Use a Parent Theme When...

| Scenario | Reason |
|---|---|
| Building on Magento's UI library | Inherits LESS variables, mixins, UI components |
| Needing Responsive Web Design (RWD) | Magento/blank provides the responsive grid system |
| Extending an existing brand theme | Reduces duplication; only override what changes |
| Targeting a Magento marketplace | Luma-based themes are expected and tested against |
| Team has limited frontend resources | Inheriting blank/luma provides battle-tested base styles |

**Extending Magento/blank (recommended for most projects):**
```xml
<parent>Magento/blank</parent>
```
- Gets the full Magento UI library
- Gets responsive grid
- Does **not** inherit luma's opinionated visual styles

**Extending Magento/luma:**
```xml
<parent>Magento/luma</parent>
```
- Gets everything from blank **plus** luma's visual styles
- Best for quick prototyping or when luma aesthetics are close to the target design
- Risk: luma styles may require more overrides than starting from blank

### 12.2 Use a Standalone Theme When...

| Scenario | Reason |
|---|---|
| Completely custom design system (e.g., headless/hybrid) | No benefit from inheriting Magento styles |
| PWA/headless frontend | Magento theme system may not apply |
| Pixel-perfect design far from Magento defaults | Fewer overrides needed than inherited reset styles |
| Performance-critical minimalist themes | No unused inherited CSS/JS |

**Standalone theme declaration:**
```xml
<?xml version="1.0"?>
<theme xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:noNamespaceSchemaLocation="urn:magento:framework:Config/etc/theme.xsd">
    <title>Vendor Standalone</title>
    <!-- No <parent> element -->
</theme>
```

> **Warning:** A standalone theme must provide **all** templates, layouts, and styles independently. Missing any core template will cause frontend errors.

### 12.3 Decision Flowchart

```
Does your design require Magento's built-in
responsive grid and UI component library?
         |
    YES  |  NO
         |   \
         v    v
    Extend    Are you building a fully
    blank     custom / headless solution?
              |
         YES  |  NO
              |   \
              v    v
        Standalone  Consider extending blank
                    anyway for compatibility
```

**Exam focus:**
- **`Magento/blank`** is the recommended parent for custom themes — provides structure without luma's opinionated styles
- **`Magento/luma`** is the parent when you want to quickly adjust an existing luma-like design
- A standalone theme with no `<parent>` must supply **every** required template and layout handle
- In the exam context: *"extending blank is the Magento best practice for new custom themes"*

---

## Quick-Reference Checklist

### Theme Setup
- [ ] `theme.xml` contains `<title>`, optionally `<parent>Vendor/theme</parent>`, and `<media>`
- [ ] `<parent>` value is in `Vendor/theme` format — matches the directory under `app/design/frontend/`
- [ ] `registration.php` uses `ComponentRegistrar::THEME` with `'frontend/Vendor/ThemeName'`
- [ ] Both `theme.xml` and `registration.php` must exist for the theme to appear in Admin

### Inheritance & Fallback
- [ ] Fallback order: child theme → parent theme(s) → module `view/frontend/` → `lib/web/`
- [ ] Static files and templates: **first match in chain wins** (replacement)
- [ ] Layout XML: **all matching handles are merged** (additive) unless in `override/` directory
- [ ] A theme can only declare **one** `<parent>`; multi-level inheritance is handled automatically

### File Override Paths
- [ ] Module template override: `<ThemeRoot>/<Namespace_Module>/templates/<path/file.phtml>`
- [ ] Module static asset override: `<ThemeRoot>/<Namespace_Module>/web/<path/file>`
- [ ] Theme-level static asset: `<ThemeRoot>/web/<path/file>`
- [ ] Layout extension: `<ThemeRoot>/<Namespace_Module>/layout/<handle>.xml`
- [ ] Layout override (module): `<ThemeRoot>/<Namespace_Module>/layout/override/base/<handle>.xml`
- [ ] Layout override (parent theme): `<ThemeRoot>/<Namespace_Module>/layout/override/theme/<Vendor>/<theme>/<handle>.xml`

### LESS / CSS
- [ ] `_theme.less` — overrides **variables**; replaced via fallback chain
- [ ] `_extend.less` — adds **new CSS rules**; automatically appended after inherited styles
- [ ] Font file paths in LESS are relative to the **compiled CSS output** (use `../fonts/`)
- [ ] `requirejs-config.js` files from all levels of the chain are **merged** (not overridden)

### Layout XML Operations
- [ ] Use `<referenceBlock>` or `<referenceContainer>` to modify existing elements
- [ ] Use `remove="true"` to permanently remove a block for a handle
- [ ] Use `<move>` to reposition blocks between containers
- [ ] Use `<action method="setTemplate">` to change a block's template via layout XML

### Template Overrides
- [ ] Copy the original file first; never edit vendor files directly
- [ ] Enable template hints with `bin/magento dev:template-hints:enable` to verify resolution
- [ ] Always use `$block->escapeHtml()` and `$block->escapeHtmlAttr()` in `.phtml` files

### CE vs EE
- [ ] Both CE and EE use the **same fallback/inheritance mechanism**
- [ ] EE adds enterprise modules (`Magento_GiftCard`, `Magento_Reward`, B2B modules, etc.) under the same `Namespace_Module` override pattern
- [ ] `Magento/blank` is the root theme for **both** CE and EE standard chains
- [ ] Page Builder (EE) templates are in `Magento_PageBuilder/templates/`

### Parent vs Standalone Decision
- [ ] **Extend `Magento/blank`** — recommended for most custom themes; gets UI library and RWD grid without luma aesthetics
- [ ] **Extend `Magento/luma`** — use when design is close to luma and needs quick customization
- [ ] **Standalone (no parent)** — only for fully custom / headless solutions; must provide all templates
- [ ] Exam best practice: **extending blank is the Magento standard** for new production themes

### Deployment
- [ ] Developer mode: static files resolved on-the-fly, `cache:clean` sufficient
- [ ] Production mode: requires `setup:static-content:deploy -t Vendor/ThemeName en_US`
- [ ] Run `setup:upgrade` after adding new themes via `registration.php`
- [ ] Theme assignment is per **store view** in Admin → Content → Design → Configuration
