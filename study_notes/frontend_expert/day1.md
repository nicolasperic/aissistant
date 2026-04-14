# Adobe Commerce: Theme Architecture & Creating a New Theme

## Table of Contents
- [1. Overview](#1-overview)
- [2. Theme Directory Structure](#2-theme-directory-structure)
- [3. Required Theme Files](#3-required-theme-files)
  - [3.1 theme.xml](#31-themexml)
  - [3.2 registration.php](#32-registrationphp)
  - [3.3 composer.json](#33-composerjson)
  - [3.4 Optional but Common Files](#34-optional-but-common-files)
- [4. Declaring and Registering a Theme](#4-declaring-and-registering-a-theme)
- [5. Theme Hierarchy and the Fallback Mechanism](#5-theme-hierarchy-and-the-fallback-mechanism)
  - [5.1 Fallback Chain Overview](#51-fallback-chain-overview)
  - [5.2 File Resolution Order](#52-file-resolution-order)
  - [5.3 Locale Fallback](#53-locale-fallback)
- [6. Magento_blank vs Magento_luma](#6-magento_blank-vs-magento_luma)
- [7. Hands-On: Creating a Minimal Custom Theme](#7-hands-on-creating-a-minimal-custom-theme)
  - [7.1 Create the Directory Structure](#71-create-the-directory-structure)
  - [7.2 Create Required Files](#72-create-required-files)
  - [7.3 Register and Apply the Theme](#73-register-and-apply-the-theme)
  - [7.4 Verify the Theme Renders](#74-verify-the-theme-renders)
- [8. Key Admin Paths](#8-key-admin-paths)
- [9. Common Pitfalls](#9-common-pitfalls)
- [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Overview

Adobe Commerce (Magento 2) uses a **theme-based frontend architecture**. A theme controls the visual presentation of a store and is built from a combination of layout XML files, templates (`.phtml`), LESS/CSS, JavaScript, and static assets (images, fonts).

Themes live in the **filesystem** and must be **declared** to Magento before they can be used. Once declared, they are registered in the database and selectable from the Admin panel.

> **Exam focus:** Themes are filesystem artifacts that Magento discovers via `registration.php`. They are *not* created through the Admin UI — the Admin only *applies* them.

---

## 2. Theme Directory Structure

All frontend themes reside under:

```
app/design/frontend/<Vendor>/<theme>/
```

A fully populated custom theme looks like this:

```
app/design/frontend/
+-- MyVendor/
    +-- mytheme/
        +-- theme.xml                  <-- Theme declaration (REQUIRED)
        +-- registration.php           <-- Registers theme with Magento (REQUIRED)
        +-- composer.json              <-- Composer metadata (REQUIRED for marketplace)
        +-- etc/
        |   +-- view.xml               <-- Image configuration (optional but common)
        +-- media/
        |   +-- preview.jpg            <-- Admin theme preview thumbnail (optional)
        +-- web/
        |   +-- css/
        |   |   +-- source/
        |   |       +-- _theme.less    <-- LESS variable overrides
        |   +-- images/
        |   +-- js/
        +-- Magento_Theme/             <-- Module-scoped overrides
        |   +-- layout/
        |   |   +-- default.xml
        |   +-- templates/
        |       +-- html/
        |           +-- header.phtml
        +-- Magento_Catalog/           <-- Per-module layout/template overrides
            +-- layout/
            +-- templates/
```

> **Exam focus:** The directory path `app/design/frontend/<Vendor>/<theme>/` is exact and case-sensitive on Linux. `<Vendor>` and `<theme>` form the **theme path** used in `registration.php` and the database.

---

## 3. Required Theme Files

### 3.1 `theme.xml`

Declares the theme's identity and its **parent theme**. This is the most important file — without it, Magento will not recognize the directory as a theme.

```xml
<?xml version="1.0"?>
<!--
  File: app/design/frontend/MyVendor/mytheme/theme.xml
-->
<theme xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:noNamespaceSchemaLocation="urn:magento:framework:Config/etc/theme.xsd">
    <title>MyVendor MyTheme</title>
    <parent>Magento/luma</parent>
    <media>
        <preview_image>media/preview.jpg</preview_image>
    </media>
</theme>
```

| Element | Required | Description |
|---|---|---|
| `<title>` | Yes | Human-readable name shown in Admin |
| `<parent>` | No* | Parent theme path (`Vendor/theme`). Omit only for root themes |
| `<media>` / `<preview_image>` | No | Path to Admin preview thumbnail |

> **Exam focus:** The `<parent>` value uses **forward-slash** notation (`Magento/luma`), matching the directory path `app/design/frontend/Magento/luma`. A theme without a parent is called a **root** or **standalone** theme.

---

### 3.2 `registration.php`

Registers the theme with Magento's **component registrar**. This file is auto-loaded by Magento's bootstrap via `vendor/autoload.php` and Composer's file autoloading.

```php
<?php
/**
 * File: app/design/frontend/MyVendor/mytheme/registration.php
 */
use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::THEME,       // Component type: THEME
    'frontend/MyVendor/mytheme',     // Theme path (area/Vendor/theme)
    __DIR__                          // Absolute path to theme root
);
```

**Key points:**
- The **first argument** is always `ComponentRegistrar::THEME`
- The **second argument** is the theme path prefixed with the **area**: `frontend/` or `adminhtml/`
- The **third argument** `__DIR__` resolves to the absolute filesystem path automatically
- The string `'frontend/MyVendor/mytheme'` must exactly match the directory structure

> **Exam focus:** The `registration.php` second argument format is `<area>/<Vendor>/<theme>` — *three* segments separated by forward slashes. Forgetting the area prefix is a common mistake.

---

### 3.3 `composer.json`

Required for themes distributed via **Magento Marketplace** or managed via Composer. For local development, it is technically optional, but considered a **best practice** and is often required by the exam.

```json
{
    "name": "myvendor/theme-frontend-mytheme",
    "description": "MyVendor MyTheme for Adobe Commerce frontend",
    "require": {
        "php": "~8.1.0||~8.2.0",
        "magento/theme-frontend-luma": "*",
        "magento/framework": "*"
    },
    "type": "magento2-theme",
    "license": "proprietary",
    "autoload": {
        "files": [
            "registration.php"
        ]
    }
}
```

| Key | Value / Notes |
|---|---|
| `"type"` | Must be `"magento2-theme"` — tells Composer/Magento what this package is |
| `"autoload"."files"` | Ensures `registration.php` is loaded by Composer autoloader |
| `"name"` | Convention: `<vendor>/theme-frontend-<theme>` or `theme-adminhtml-<theme>` |
| `"require"` | Declare the parent theme and framework as dependencies |

> **Exam focus:** The `"type": "magento2-theme"` field is what Magento's Composer plugin uses to identify and install the theme to the correct directory. Without it, the theme will not be placed under `app/design/`.

---

### 3.4 Optional but Common Files

| File | Purpose |
|---|---|
| `etc/view.xml` | Configures image sizes for product images, thumbnails, swatches |
| `web/css/source/_theme.less` | Overrides LESS variables (colors, fonts, spacing) |
| `media/preview.jpg` | Thumbnail shown in Admin > Content > Design > Configuration |
| `web/css/source/_extend.less` | Extends/adds new LESS styles without overriding variables |

---

## 4. Declaring and Registering a Theme

The lifecycle of a new theme from file creation to Admin selection:

```
1. Create files on disk
        |
        v
2. Run: bin/magento setup:upgrade
        |
        v
3. Magento scans registration.php files
   (via Magento\Framework\Component\ComponentRegistrar)
        |
        v
4. Theme data written to: theme table in database
        |
        v
5. Theme appears in: Admin > Content > Design > Configuration
        |
        v
6. Admin selects theme for store view
        |
        v
7. Run: bin/magento cache:flush
        |
        v
8. Theme is active on storefront
```

**Critical CLI commands:**

```bash
# Register new theme (reads all registration.php files)
bin/magento setup:upgrade

# Deploy static content for your theme
bin/magento setup:static-content:deploy -f --theme MyVendor/mytheme

# Flush cache after configuration changes
bin/magento cache:flush

# In developer mode: disable static content deployment requirement
bin/magento deploy:mode:set developer
```

> **Exam focus:** `bin/magento setup:upgrade` is required to register a *new* theme in the database. Simply creating files is not enough — Magento must scan and persist the theme record.

---

## 5. Theme Hierarchy and the Fallback Mechanism

### 5.1 Fallback Chain Overview

When Magento needs a file (template, layout, static asset), it searches a **defined chain of locations** in order, using the first match it finds. This is called the **theme fallback** or **file resolution** mechanism.

```
REQUEST: file for MyVendor/mytheme
         |
         v
+-----------------------------+
| 1. MyVendor/mytheme         |  <-- Active custom theme
|    (app/design/frontend/    |
|     MyVendor/mytheme/)      |
+-----------------------------+
         | not found
         v
+-----------------------------+
| 2. Parent theme: Magento/luma |  <-- Defined in theme.xml <parent>
|    (app/design/frontend/    |
|     Magento/luma/)          |
+-----------------------------+
         | not found
         v
+-----------------------------+
| 3. Grandparent: Magento/blank |  <-- luma's parent
|    (app/design/frontend/    |
|     Magento/blank/)         |
+-----------------------------+
         | not found
         v
+-----------------------------+
| 4. Module view directory    |  <-- Module's own view/frontend/
|    (e.g. Magento_Catalog/  |
|     view/frontend/)         |
+-----------------------------+
         | not found
         v
+-----------------------------+
| 5. lib/web/ (for JS/CSS)    |  <-- Magento core library assets
+-----------------------------+
```

> **Exam focus:** The fallback order is: **active theme → parent theme(s) → module view → lib/web**. Magento *never* modifies core files — you override them by placing a file in the correct location higher up the chain.

---

### 5.2 File Resolution Order

For **module-specific files** (templates and layout XML under a `<Module_Name>/` directory), the resolution path is:

```
app/design/frontend/<Vendor>/<theme>/<Module_Name>/templates/file.phtml
app/design/frontend/<Vendor>/<parent_theme>/<Module_Name>/templates/file.phtml
app/design/frontend/<Vendor>/<grandparent>/<Module_Name>/templates/file.phtml
<module_root>/view/frontend/templates/file.phtml
```

**Example: Overriding `Magento_Catalog` category template**

```
Override location (your theme):
  app/design/frontend/MyVendor/mytheme/Magento_Catalog/templates/category/view.phtml

Original location (module):
  vendor/magento/module-catalog/view/frontend/templates/category/view.phtml
```

For **layout XML**, the files are **merged** (not replaced) across the entire chain:

```
All layout XML files from the chain are merged in this order:
  1. Module base layout (vendor/magento/module-*/view/frontend/layout/)
  2. Grandparent theme layout overrides
  3. Parent theme layout overrides
  4. Active theme layout overrides  <-- Last write wins for instructions
```

> **Exam focus:** **Templates are replaced** (first match wins). **Layout XML files are merged** (all files in the chain are collected and processed together). This is a critical distinction.

---

### 5.3 Locale Fallback

Within a theme, locale-specific files add another fallback layer:

```
app/design/frontend/<Vendor>/<theme>/web/i18n/<locale>/  (e.g., en_US/)
     |
     v (fallback)
app/design/frontend/<Vendor>/<theme>/web/
```

---

## 6. Magento_blank vs Magento_luma

| Feature | `Magento/blank` | `Magento/luma` |
|---|---|---|
| **Purpose** | Minimal, unstyled base theme | Styled reference/demo theme |
| **Parent** | None (root theme) | `Magento/blank` |
| **Styling** | Bare-bones CSS reset only | Full LESS-based UI (responsive, styled components) |
| **Use case** | Base for building from scratch | Starting point for customization with existing look |
| **LESS variables** | Defines the variable library | Overrides blank's variables with concrete values |
| **Performance** | Lighter (no extra styles) | Heavier (full styled UI ships with demo styles) |
| **`theme.xml` parent** | *(no parent declared)* | `<parent>Magento/blank</parent>` |
| **Location** | `vendor/magento/theme-frontend-blank/` | `vendor/magento/theme-frontend-luma/` |

**When to use each as your parent:**

```
Building a highly custom theme from scratch?
  --> Extend Magento/blank
      Benefit: No inherited luma styles to fight against

Building a theme with moderate customization of existing Magento look?
  --> Extend Magento/luma
      Benefit: Gets all luma components; override only what you need
```

> **Exam focus:** `Magento/luma` extends `Magento/blank`. Both ship in `vendor/magento/`. The **blank theme is the root of all default Magento themes** — it has no parent. Custom themes should declare one of these (usually `Magento/luma`) as their parent to inherit the full Magento UI component library.

---

## 7. Hands-On: Creating a Minimal Custom Theme

### 7.1 Create the Directory Structure

```bash
# Navigate to your Magento root
cd /var/www/html/magento2

# Create the theme directory
mkdir -p app/design/frontend/MyVendor/mytheme/media
mkdir -p app/design/frontend/MyVendor/mytheme/web/css/source
```

### 7.2 Create Required Files

**Step 1: Create `theme.xml`**

```bash
cat > app/design/frontend/MyVendor/mytheme/theme.xml << 'EOF'
<?xml version="1.0"?>
<theme xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:noNamespaceSchemaLocation="urn:magento:framework:Config/etc/theme.xsd">
    <title>MyVendor MyTheme</title>
    <parent>Magento/luma</parent>
    <media>
        <preview_image>media/preview.jpg</preview_image>
    </media>
</theme>
EOF
```

**Step 2: Create `registration.php`**

```bash
cat > app/design/frontend/MyVendor/mytheme/registration.php << 'EOF'
<?php
use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::THEME,
    'frontend/MyVendor/mytheme',
    __DIR__
);
EOF
```

**Step 3: Create `composer.json`**

```bash
cat > app/design/frontend/MyVendor/mytheme/composer.json << 'EOF'
{
    "name": "myvendor/theme-frontend-mytheme",
    "description": "MyVendor custom theme",
    "require": {
        "magento/theme-frontend-luma": "*",
        "magento/framework": "*"
    },
    "type": "magento2-theme",
    "license": "proprietary",
    "autoload": {
        "files": [
            "registration.php"
        ]
    }
}
EOF
```

**Step 4: (Optional) Create a basic LESS override**

```bash
cat > app/design/frontend/MyVendor/mytheme/web/css/source/_theme.less << 'EOF'
//  ---------------------------------------------
//  MyVendor MyTheme: LESS variable overrides
//  Override any variable defined in
//  vendor/magento/theme-frontend-blank/web/css/source/lib/variables/
//  ---------------------------------------------

@primary__color           : #e62645;   // Primary action color
@link__color              : #e62645;
@header__background-color : #1a1a1a;
EOF
```

**Final directory tree verification:**

```bash
find app/design/frontend/MyVendor/mytheme -type f | sort
```

Expected output:
```
app/design/frontend/MyVendor/mytheme/composer.json
app/design/frontend/MyVendor/mytheme/registration.php
app/design/frontend/MyVendor/mytheme/theme.xml
app/design/frontend/MyVendor/mytheme/web/css/source/_theme.less
```

---

### 7.3 Register and Apply the Theme

**Step 1: Run setup:upgrade to register the theme**

```bash
bin/magento setup:upgrade
```

Look for output confirming schema updates and component registration. The theme is now in the `theme` database table.

**Step 2: Set developer mode (simplifies development)**

```bash
bin/magento deploy:mode:set developer
```

**Step 3: Apply the theme in Admin**

```
Admin Panel Navigation:
  Content > Design > Configuration
    --> Select your Store View row
    --> Click "Edit"
    --> Under "Default Theme"
        --> Applied Theme: [MyVendor MyTheme]  <-- Select your theme
    --> Click "Save Configuration"
```

**Step 4: Flush cache**

```bash
bin/magento cache:flush
```

**Step 5: (In production mode) Deploy static content**

```bash
bin/magento setup:static-content:deploy en_US --theme MyVendor/mytheme -f
```

---

### 7.4 Verify the Theme Renders

```bash
# Check theme is registered in the database
bin/magento info:dependencies:show-framework

# Or query the DB directly
mysql -u magento -p magento -e "SELECT * FROM theme WHERE theme_path = 'frontend/MyVendor/mytheme';"
```

**Browser verification checklist:**
1. Visit storefront — no blank page or PHP errors
2. Open browser DevTools → Network tab → verify CSS loads from `_theme/` path or `pub/static/frontend/MyVendor/mytheme/`
3. Check `var/log/system.log` and `var/log/exception.log` for errors
4. Verify static assets URL: `https://yourdomain.com/pub/static/frontend/MyVendor/mytheme/en_US/`

```bash
# Tail logs to catch any theme-related errors
tail -f var/log/system.log var/log/exception.log
```

---

## 8. Key Admin Paths

| Task | Admin Path |
|---|---|
| Apply a theme to a store view | Content > Design > Configuration |
| Schedule a theme change | Content > Design > Schedule |
| View all registered themes | Content > Design > Themes |
| Clear cache after theme changes | System > Cache Management |

---

## 9. Common Pitfalls

| Pitfall | Cause | Fix |
|---|---|---|
| Theme not appearing in Admin | `registration.php` has wrong path string or `setup:upgrade` not run | Verify path string matches directory; run `setup:upgrade` |
| `theme.xml` validation error | Incorrect parent path format (using backslash or wrong vendor/theme name) | Use forward-slash: `Magento/luma` |
| Static assets 404 after applying | Static content not deployed | Run `setup:static-content:deploy` or use developer mode |
| Changes not reflected | Cache not cleared | `bin/magento cache:flush` |
| "Area code not set" error | `registration.php` missing or syntax error | Check for PHP parse errors in `registration.php` |
| White/blank page | Template error inherited from parent | Check `var/log/exception.log`; enable display errors in `dev` mode |
| Wrong theme applied on frontend | Store view config cached | Flush full_page and config cache types |
| `composer.json` `type` missing | Package not recognized as a Magento theme | Ensure `"type": "magento2-theme"` is set |

> **Exam focus:** When a theme is not appearing in Admin > Content > Design > Configuration, the **two most common causes** are: (1) `setup:upgrade` has not been run, and (2) the path in `registration.php` does not exactly match the filesystem path.

---

## Quick-Reference Checklist

### Theme File Requirements
- [ ] **`theme.xml`** — Required; declares title, parent theme, and preview image path
- [ ] **`registration.php`** — Required; uses `ComponentRegistrar::register()` with type `THEME`
- [ ] **`composer.json`** — Required for Marketplace distribution; must have `"type": "magento2-theme"`
- [ ] `registration.php` second argument format: `frontend/<Vendor>/<theme>` (three segments, area-prefixed)
- [ ] `theme.xml` parent format: `<Vendor>/<theme>` with forward slash (e.g., `Magento/luma`)

### Directory Structure
- [ ] Theme root: `app/design/frontend/<Vendor>/<theme>/`
- [ ] Module overrides go in: `app/design/frontend/<Vendor>/<theme>/<Module_Name>/`
- [ ] Static assets go in: `app/design/frontend/<Vendor>/<theme>/web/`
- [ ] LESS variable overrides: `web/css/source/_theme.less`

### Fallback Mechanism (in order)
- [ ] 1st: Active custom theme directory
- [ ] 2nd: Parent theme (defined in `theme.xml <parent>`)
- [ ] 3rd: Grandparent theme (parent's parent — e.g., `blank` when parent is `luma`)
- [ ] 4th: Module's own `view/frontend/` directory
- [ ] 5th: `lib/web/` (for JS/CSS library assets)
- [ ] **Templates** = first match wins (replaced, not merged)
- [ ] **Layout XML** = all files in chain are merged together

### blank vs luma
- [ ] `Magento/blank` — root theme (no parent), minimal styling, base for scratch builds
- [ ] `Magento/luma` — extends `blank`, full styled reference theme, base for customizations
- [ ] Both located in `vendor/magento/theme-frontend-*/`
- [ ] `luma` is heavier; `blank` is leaner for custom builds

### Registration Lifecycle
- [ ] Create files → run `bin/magento setup:upgrade` → select in Admin → flush cache
- [ ] `setup:upgrade` writes theme to `theme` database table
- [ ] In production mode: must also run `setup:static-content:deploy`
- [ ] Theme applied per **store view** via: Admin > Content > Design > Configuration

### CLI Commands to Know
- [ ] `bin/magento setup:upgrade` — registers new components including themes
- [ ] `bin/magento cache:flush` — clears all caches
- [ ] `bin/magento setup:static-content:deploy -f --theme <Vendor>/<theme>` — deploys static files
- [ ] `bin/magento deploy:mode:set developer` — skips static deployment requirement in dev

### Exam Traps
- [ ] Admin UI does **not** create themes — it only applies them
- [ ] Path in `registration.php` must **exactly match** the filesystem directory (case-sensitive on Linux)
- [ ] `setup:upgrade` must be run **every time** a new theme is added
- [ ] A theme with no `<parent>` in `theme.xml` is a standalone/root theme — valid but uncommon for custom themes
- [ ] `composer.json` `"autoload"."files"` ensures `registration.php` is loaded by Composer
