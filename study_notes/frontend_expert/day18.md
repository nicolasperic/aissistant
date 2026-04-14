# Day 18 — Grunt, Front-End Optimization & Edge Delivery Services

## Adobe Commerce Developer Professional Certification Study Notes

---

## Table of Contents

1. [Background: Why Front-End Tooling Matters for Backend Devs](#1-background-why-front-end-tooling-matters-for-backend-devs)
2. [Grunt: The Front-End Build Tool for Commerce](#2-grunt-the-front-end-build-tool-for-commerce)
   - [What Grunt Is (and Is Not)](#what-grunt-is-and-is-not)
   - [Grunt Setup: package.json and Gruntfile.js](#grunt-setup-packagejson-and-gruntfilejs)
   - [Key Grunt Tasks in Commerce](#key-grunt-tasks-in-commerce)
   - [Grunt vs bin/magento setup:static-content:deploy](#grunt-vs-binmagento-setupstatic-contentdeploy)
   - [Developer Mode: Symlinks vs Grunt Compilation](#developer-mode-symlinks-vs-grunt-compilation)
3. [Front-End Optimization](#3-front-end-optimization)
   - [CSS and JS Merging and Bundling in Admin](#css-and-js-merging-and-bundling-in-admin)
   - [JavaScript Bundling: RequireJS vs Native ES Modules](#javascript-bundling-requirejs-vs-native-es-modules)
   - [Critical CSS and Lazy Loading Strategies](#critical-css-and-lazy-loading-strategies)
   - [Image Optimization and srcset in Commerce](#image-optimization-and-srcset-in-commerce)
4. [Edge Delivery Services (EDS)](#4-edge-delivery-services-eds)
   - [What EDS Is (Clearing Up the Fastly Confusion)](#what-eds-is-clearing-up-the-fastly-confusion)
   - [The Franklin/Helix Model](#the-franklinhelix-model)
   - [EDS Boilerplate Project Structure](#eds-boilerplate-project-structure)
   - [How Blocks Are Defined and Rendered](#how-blocks-are-defined-and-rendered)
   - [EDS vs Traditional Magento Theme Development](#eds-vs-traditional-magento-theme-development)
5. [Hands-On Walkthroughs](#5-hands-on-walkthroughs)
6. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Background: Why Front-End Tooling Matters for Backend Devs

As a backend developer, you are comfortable with PHP, XML, and the service layer. Front-end tooling can feel like a foreign ecosystem with its own package managers, task runners, and build pipelines. The good news: **the exam tests conceptual understanding**, not deep CSS authoring skills.

Here is the mental model that makes everything click:

```
+-------------------------------------------------------+
|  Source Files (LESS, JS modules, images)              |
|  (in app/design or vendor/module/view)                |
+-------------------------------------------------------+
                        |
              Build Tool (Grunt)
              OR
              bin/magento setup:static-content:deploy
                        |
                        v
+-------------------------------------------------------+
|  Published Static Files                               |
|  pub/static/<area>/<theme>/<locale>/                  |
+-------------------------------------------------------+
                        |
              Served to Browser
              (optionally via CDN / EDS / Fastly)
                        |
                        v
+-------------------------------------------------------+
|  Browser renders CSS, executes JS, shows images       |
+-------------------------------------------------------+
```

> **Key distinction to hold in mind all day:** Grunt is a *development-time* compilation tool. `setup:static-content:deploy` is a *deployment-time* tool. Edge Delivery Services is an entirely different *architecture*, not a caching layer.

---

## 2. Grunt: The Front-End Build Tool for Commerce

### What Grunt Is (and Is Not)

**Grunt** is a JavaScript task runner that runs in Node.js. It automates repetitive front-end tasks: compiling LESS to CSS, watching files for changes, cleaning generated files, and executing shell commands.

| Grunt IS | Grunt is NOT |
|---|---|
| A Node.js task runner | A PHP tool |
| Used in **developer mode** | Used in production deploys |
| Compiles LESS → CSS | A CSS preprocessor itself (that is `lessc`) |
| Watches files for live changes | A browser live-reload server |
| Part of Commerce's official dev workflow | Required for all Commerce installations |

**Exam focus:** Grunt runs under **Node.js**, not PHP. It is only relevant in a developer's local environment.

---

### Grunt Setup: package.json and Gruntfile.js

Commerce ships with Grunt configuration already present at the root of the project. You do not write this from scratch — you enable and use it.

#### Step 1: package.json

The `package.json` file at the Commerce root declares Node.js dependencies (Grunt plugins). Think of it as the `composer.json` equivalent for Node.

```json
{
  "name": "magento2",
  "version": "1.0.0",
  "description": "Magento 2 Grunt Configuration",
  "devDependencies": {
    "grunt": "^1.5.3",
    "grunt-contrib-clean": "^2.0.1",
    "grunt-contrib-connect": "^3.0.0",
    "grunt-contrib-cssmin": "^4.0.0",
    "grunt-contrib-less": "^2.0.0",
    "grunt-contrib-uglify": "^5.0.1",
    "grunt-contrib-watch": "^1.1.0",
    "grunt-exec": "^3.0.0"
  }
}
```

**Key `devDependencies` to recognize:**

| Package | Purpose |
|---|---|
| `grunt` | The core Grunt runner |
| `grunt-contrib-less` | Compiles LESS files to CSS |
| `grunt-contrib-watch` | Watches files and triggers tasks on change |
| `grunt-contrib-clean` | Deletes generated/cached files |
| `grunt-contrib-cssmin` | Minifies CSS |
| `grunt-contrib-uglify` | Minifies JavaScript |
| `grunt-exec` | Runs arbitrary shell commands from Grunt |

**Exam focus:** The `grunt-contrib-*` naming convention means these are official/contributed Grunt plugins. Recognize that `grunt-contrib-less` handles LESS compilation, not a separate tool.

#### Step 2: Install Node dependencies

```bash
# From the Commerce root directory
npm install
```

This creates `node_modules/` — the Node equivalent of `vendor/`. **Never commit this directory.**

#### Step 3: Gruntfile.js

Commerce provides a `Gruntfile.js` that orchestrates all the tasks. There is also a `Gruntfile.js.sample` — you copy the sample and configure your theme.

```bash
cp Gruntfile.js.sample Gruntfile.js
```

The Gruntfile at a conceptual level looks like this:

```javascript
// Gruntfile.js (simplified conceptual view)
module.exports = function(grunt) {

    // 1. Load all grunt-contrib-* plugins
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-exec');

    // 2. Configure each task
    grunt.initConfig({

        // LESS compilation configuration
        less: {
            // Target: your custom theme
            my_custom_theme: {
                options: {
                    sourceMap: true
                },
                files: {
                    // Output CSS file: Input LESS file
                    'pub/static/frontend/Vendor/theme/en_US/css/styles-m.css':
                    'app/design/frontend/Vendor/theme/web/css/styles-m.less'
                }
            }
        },

        // Watch configuration — which files trigger which tasks
        watch: {
            my_custom_theme: {
                files: ['app/design/frontend/Vendor/theme/**/*.less'],
                tasks: ['less:my_custom_theme']
            }
        },

        // Clean task — delete generated static files
        clean: {
            my_custom_theme: [
                'pub/static/frontend/Vendor/theme',
                'var/view_preprocessed'
            ]
        },

        // Exec task — run shell commands
        exec: {
            // Example: clear the cache
            'cache:clean': {
                cmd: 'php bin/magento cache:clean'
            }
        }

    });

    // 3. Register default task
    grunt.registerTask('default', ['less']);
};
```

**Exam focus:** The Gruntfile uses `grunt.initConfig()` to define task configurations, `grunt.loadNpmTasks()` to load plugins, and `grunt.registerTask()` to create named task sequences. You need to recognize these concepts, not memorize every line.

#### Step 4: Theme configuration file

Commerce also uses a theme configuration file referenced by the Gruntfile. Create `dev/tools/grunt/configs/themes.js`:

```javascript
// dev/tools/grunt/configs/themes.js
module.exports = {
    // Theme identifier (used in grunt commands)
    'my-theme': {
        area: 'frontend',
        name: 'Vendor/ThemeName',
        locale: 'en_US',
        files: [
            'css/styles-m',
            'css/styles-l'
        ],
        dsl: 'less'   // Design System Language
    }
};
```

This is how Grunt knows *which theme* to compile when you run `grunt less:my-theme`.

---

### Key Grunt Tasks in Commerce

#### `grunt less` — Compile LESS to CSS

```bash
# Compile all configured themes
grunt less

# Compile a specific theme
grunt less:<theme-name>

# Example
grunt less:luma
```

**What it does:**
1. Reads LESS source files from `app/design/` or `lib/web/`
2. Resolves `@import` directives (LESS imports other LESS files)
3. Applies variables, mixins, and functions
4. Outputs compiled CSS to `pub/static/`

**Exam focus:** `grunt less` is the command that compiles LESS source files into browser-readable CSS. Without this step in developer mode, style changes are not visible.

#### `grunt watch` — File Watcher

```bash
grunt watch

# Watch a specific theme
grunt watch:<theme-name>
```

**What it does:** Continuously monitors LESS/JS files. When you save a file, it automatically triggers the relevant compilation task. This is the command you leave running in a terminal during active development.

```
+------------------+     file saved      +------------------+
|  Developer edits |  ----------------> | grunt watch      |
|  .less file      |                    | detects change   |
+------------------+                    +------------------+
                                                 |
                                         triggers grunt less
                                                 |
                                                 v
                                        +------------------+
                                        | Updated CSS in   |
                                        | pub/static/      |
                                        +------------------+
```

#### `grunt clean` — Delete Generated Files

```bash
# Clean a specific theme's generated files
grunt clean:<theme-name>

# Clean everything
grunt clean
```

**What it cleans:**
- `pub/static/frontend/<Vendor>/<theme>/` — compiled static assets
- `var/view_preprocessed/` — intermediate preprocessed files (LESS imports resolved)

**When to use it:** When your changes are not appearing and you suspect stale cached files. Always run `grunt clean` before `grunt less` when debugging style issues.

**Exam focus:** `var/view_preprocessed/` is Commerce's LESS preprocessing cache. `grunt clean` removes both this and the `pub/static/` output for a theme.

#### `grunt exec` — Run Shell Commands

```bash
grunt exec:<command>
```

**Purpose:** Run arbitrary shell commands as part of a Grunt task chain. Common use: clearing Commerce's PHP cache as part of a build sequence.

```bash
# Example: clear cache via grunt
grunt exec:'cache:clean'
```

**When you would use it:** Chaining `bin/magento` commands into a Grunt workflow so developers only need to run one Grunt command.

---

### Grunt vs bin/magento setup:static-content:deploy

This is a **critical conceptual distinction** for the exam.

| Aspect | `grunt less` | `setup:static-content:deploy` |
|---|---|---|
| **Environment** | Developer mode only | Production / staging |
| **Speed** | Fast (compiles only changed theme) | Slow (deploys all themes/locales) |
| **Output** | CSS in `pub/static/` for one theme | All static files for all themes/locales |
| **Source maps** | Yes (for debugging) | No (minified) |
| **Who runs it** | Developer on local machine | CI/CD pipeline or deployment script |
| **Symlinks** | Works alongside symlinks | Copies/generates actual files |
| **LESS → CSS** | Yes | Yes (also uses `lessc` under the hood) |
| **Requires Node.js** | Yes | No (pure PHP/Magento CLI) |

```bash
# Developer workflow
grunt clean && grunt less && grunt watch

# Production deployment workflow
php bin/magento setup:static-content:deploy \
    -f \
    --area frontend \
    --theme Vendor/ThemeName \
    en_US fr_FR
```

**Exam focus:** Use `grunt less` during development for speed and source maps. Use `setup:static-content:deploy` during deployment. **Never run `setup:static-content:deploy` in developer mode** — it will generate files that conflict with Grunt's output and the symlink mechanism.

---

### Developer Mode: Symlinks vs Grunt Compilation

Understanding how developer mode handles static files clarifies why Grunt exists.

#### In Developer Mode (without Grunt)

Commerce creates **symlinks** in `pub/static/` that point back to the source files:

```
pub/static/frontend/Vendor/Theme/en_US/
    |
    +-- css/
    |   +-- styles-m.css  --> (symlink) app/design/frontend/Vendor/Theme/web/css/styles-m.less
    |
    +-- js/
        +-- module.js     --> (symlink) app/design/frontend/Vendor/Theme/web/js/module.js
```

Wait — you cannot symlink a LESS file and serve it as CSS. The browser does not understand LESS. **This is why Grunt exists in developer mode.**

#### The Actual Flow in Developer Mode

```
+---------------------------+
| Request for styles-m.css  |
+---------------------------+
            |
            v
+---------------------------+
| Commerce checks pub/static |
| File does not exist?       |
+---------------------------+
            |
            v
+---------------------------+
| Commerce resolves LESS     |
| source via fallback system |
| (theme inheritance)        |
+---------------------------+
            |
            v
+---------------------------+
| var/view_preprocessed/    |
| LESS @imports resolved    |
| (intermediate step)       |
+---------------------------+
            |
            v
+---------------------------+
| pub/static/ CSS generated |
| on first request (slow!)  |
+---------------------------+
```

The first page load in developer mode is slow because Commerce compiles CSS on demand. Grunt pre-compiles it so the files are already there when requested.

**Exam focus:** In developer mode, static files are compiled **on demand** (first request) OR pre-compiled by Grunt. In production mode, `setup:static-content:deploy` must be run before going live — there is no on-demand compilation in production.

| Mode | Static File Strategy |
|---|---|
| Developer | On-demand compilation OR Grunt pre-compilation |
| Production | Must run `setup:static-content:deploy` |
| Default | Cached after first request (hybrid) |

---

## 3. Front-End Optimization

### CSS and JS Merging and Bundling in Admin

Commerce has built-in optimization settings accessible without any coding. Navigate to:

```
Admin > Stores > Configuration > Advanced > Developer
```

#### CSS Settings

| Setting | What It Does | When to Enable |
|---|---|---|
| **Merge CSS Files** | Combines multiple CSS files into one | Production (reduces HTTP requests) |
| **Minify CSS Files** | Removes whitespace, comments | Production |
| **Enable CSS critical path** | Inlines critical CSS | Advanced optimization |

**Exam focus:** "Merge CSS files" reduces the number of HTTP requests by combining separate CSS files into one download. This improves performance on HTTP/1.1. On HTTP/2, multiplexing reduces the benefit but it still helps reduce overhead.

#### JavaScript Settings

| Setting | What It Does |
|---|---|
| **Merge JavaScript Files** | Combines JS files into one HTTP request |
| **Enable JavaScript Bundling** | Creates bundles using RequireJS optimizer |
| **Minify JavaScript Files** | Removes whitespace and renames variables |

#### Important Caveat for Production Use

```
WARNING: Never enable these optimizations in Developer mode.
- Merged files are cached and will NOT update when source changes.
- Always test optimizations in Production or Default mode.
- Use bin/magento cache:flush after changing these settings.
```

**Exam focus:** Merging and minification settings are under **Admin > Stores > Configuration > Advanced > Developer**. They are designed for production use and should be disabled during development.

---

### JavaScript Bundling: RequireJS vs Native ES Modules

#### RequireJS in Commerce (Legacy Approach)

Commerce's JavaScript architecture is built on **RequireJS** (AMD — Asynchronous Module Definition). This predates native ES modules.

```javascript
// RequireJS module definition (AMD pattern)
// app/code/Vendor/Module/view/frontend/web/js/my-component.js

define([
    'jquery',
    'mage/utils/wrapper',
    'Magento_Ui/js/lib/core/class'
], function($, wrapper, Class) {
    'use strict';

    return Class.extend({
        defaults: {
            myProperty: 'value'
        },

        initialize: function() {
            this._super();
            // component logic
        }
    });
});
```

```javascript
// RequireJS usage (require vs define)
require([
    'Vendor_Module/js/my-component'
], function(MyComponent) {
    var instance = new MyComponent();
});
```

**How RequireJS Bundling Works:**

```
+---------------------------+
| Many small AMD modules    |
| loaded individually       |
| (many HTTP requests)      |
+---------------------------+
            |
    RequireJS r.js optimizer
            |
            v
+---------------------------+
| One or few bundle files   |
| (fewer HTTP requests)     |
| All modules concatenated  |
+---------------------------+
```

**The problem:** RequireJS loads modules asynchronously on demand. On a large Commerce site, this can mean **hundreds of individual HTTP requests** on page load. Bundling solves this.

#### RequireJS `require-config.js`

Each module can define its own RequireJS configuration:

```javascript
// app/code/Vendor/Module/view/frontend/requirejs-config.js
var config = {
    map: {
        '*': {
            // Alias a module name
            'myAlias': 'Vendor_Module/js/my-module'
        }
    },
    paths: {
        // Define path for external library
        'slick': 'js/slick.min'
    },
    shim: {
        // For non-AMD libraries, define dependencies
        'legacy-plugin': {
            deps: ['jquery'],
            exports: 'LegacyPlugin'
        }
    },
    deps: [
        // Load these modules on every page
        'Vendor_Module/js/auto-load'
    ]
};
```

**Exam focus:** `requirejs-config.js` files are **merged** by Commerce from all modules and themes into a single configuration. The `map`, `paths`, `shim`, and `deps` keys are the most important to recognize.

#### Native ES Modules (Modern Approach)

Native ES modules use `import`/`export` syntax and are natively understood by modern browsers:

```javascript
// Native ES module
export class MyComponent {
    constructor(element) {
        this.element = element;
    }
}

// Usage
import { MyComponent } from './my-component.js';
```

**Commerce's position:** Commerce's core still primarily uses RequireJS/AMD. Native ES modules are used in newer integrations (like Edge Delivery Services — covered later) but not the core storefront as of the certification scope.

| Feature | RequireJS (AMD) | Native ES Modules |
|---|---|---|
| Commerce core uses | Yes | Partially (new features) |
| Browser support | Via polyfill/library | Modern browsers only |
| Loading | Asynchronous, on-demand | Static `import` at parse time |
| Bundling tool | r.js optimizer | Webpack, Rollup, Vite |
| Syntax | `define([...], function(){})` | `import`/`export` |

---

### Critical CSS and Lazy Loading Strategies

#### Critical CSS

**Critical CSS** is the CSS required to render the **above-the-fold** content of a page (what the user sees without scrolling). Inlining it in the `<head>` eliminates a render-blocking CSS request.

```
Without Critical CSS:
Browser --> Request HTML --> Parse HTML --> Find <link rel="stylesheet">
       --> BLOCK rendering --> Download CSS --> Render page
       (User sees blank page for 1-3 seconds)

With Critical CSS:
Browser --> Request HTML --> Parse HTML --> Find <style> inline CSS
       --> Render above-fold immediately (fast!)
       --> Download full CSS asynchronously in background
       --> Apply full CSS (below-fold content)
```

**Commerce implementation approach:**

```html
<!-- Critical CSS inlined in <head> -->
<style>
    /* Only the CSS for hero, header, navigation */
    .page-header { background: #fff; }
    .nav-sections { display: flex; }
    /* ... minimal styles ... */
</style>

<!-- Full CSS loaded asynchronously (non-blocking) -->
<link rel="preload" href="styles-m.css" as="style"
      onload="this.onload=null;this.rel='stylesheet'">
<noscript>
    <link rel="stylesheet" href="styles-m.css">
</noscript>
```

**Exam focus:** Critical CSS is about **inlining above-fold styles** to eliminate render-blocking. The Commerce Admin has a "Use CSS critical path" toggle under Developer settings.

#### Lazy Loading

**Lazy loading** defers loading of resources until they are needed (typically when they scroll into the viewport).

```html
<!-- Lazy loading images (native HTML attribute) -->
<img src="product.jpg"
     alt="Product Name"
     loading="lazy"
     width="300"
     height="300">

<!-- Lazy loading below-fold JavaScript -->
<script src="below-fold-widget.js" defer></script>
<script src="analytics.js" async></script>
```

| Attribute | Behavior | Use Case |
|---|---|---|
| `loading="lazy"` | Defers image until near viewport | Below-fold product images |
| `defer` | Script runs after HTML parsed | Non-critical JS |
| `async` | Script runs ASAP, doesn't block | Analytics, independent scripts |

---

### Image Optimization and srcset in Commerce

#### srcset: Responsive Images

The `srcset` attribute tells the browser which image to download based on the device's screen size and pixel density. This prevents mobile devices from downloading desktop-sized images.

```html
<!-- srcset with width descriptors (w) -->
<img
    src="product-400.jpg"
    srcset="product-400.jpg 400w,
            product-800.jpg 800w,
            product-1200.jpg 1200w"
    sizes="(max-width: 768px) 100vw,
           (max-width: 1200px) 50vw,
           400px"
    alt="Product Name"
    width="400"
    height="400"
    loading="lazy">
```

**How it works:**
- `srcset` lists available image files with their widths
- `sizes` tells the browser how large the image will be displayed at each viewport breakpoint
- Browser calculates which source to download (no server involvement)

**In Commerce templates (PHTML):**

```php
<?php
// In a product image template
/** @var \Magento\Catalog\Block\Product\Image $block */
?>
<img
    src="<?= $block->getImageUrl() ?>"
    srcset="<?= $block->getImageUrl('product_page_image_small') ?> 400w,
            <?= $block->getImageUrl('product_page_image_medium') ?> 800w,
            <?= $block->getImageUrl() ?> 1200w"
    sizes="(max-width: 768px) 100vw, 50vw"
    alt="<?= $block->escapeHtmlAttr($block->getLabel()) ?>"
    width="<?= $block->getWidth() ?>"
    height="<?= $block->getHeight() ?>"
    loading="lazy">
```

#### Commerce Image Configuration

Image sizes are defined in `view.xml` per theme:

```xml
<!-- app/design/frontend/Vendor/Theme/etc/view.xml -->
<media>
    <images module="Magento_Catalog">
        <image id="product_page_image_small" type="thumbnail">
            <width>400</width>
            <height>400</height>
        </image>
        <image id="product_page_image_medium" type="small_image">
            <width>800</width>
            <height>800</height>
        </image>
        <image id="product_page_main_image" type="image">
            <width>1200</width>
            <height>1200</height>
        </image>
    </images>
</media>
```

**Exam focus:** Image sizes for the storefront are configured in `view.xml`, not in Admin. The `id` attribute matches what you use in PHP/PHTML templates to retrieve the correct image URL.

#### Image Optimization Checklist for Commerce

| Technique | How |
|---|---|
| Resize to display size | Configure `view.xml` image IDs |
| Serve WebP format | Module or CDN-level transformation |
| Lazy load below-fold images | `loading="lazy"` attribute |
| Responsive images | `srcset` and `sizes` attributes |
| Compress images | Pre-process before upload, or use Fastly Image Optimization |
| CDN delivery | Fastly or CloudFlare as origin shield |

---

## 4. Edge Delivery Services (EDS)

### What EDS Is (Clearing Up the Fastly Confusion)

**Your instinct was understandable:** both Fastly and Edge Delivery Services involve "edge" in the sense of CDN nodes. But they are **completely different things**.

```
+-----------------------------------------------------------+
| FASTLY (what you were thinking of)                        |
|                                                           |
|  A CDN / reverse proxy that caches Commerce responses.    |
|  Commerce is still the origin. Fastly sits in front.     |
|  Full-page cache, image optimization, VCL rules.         |
+-----------------------------------------------------------+

    vs.

+-----------------------------------------------------------+
| EDGE DELIVERY SERVICES (what this topic is about)         |
|                                                           |
|  Adobe's document-based web publishing platform.          |
|  Content is authored in Google Docs or SharePoint.        |
|  Pages are served from a global edge network.             |
|  Commerce provides the commerce layer (catalog, cart).    |
|  The storefront itself is NOT a traditional Magento theme.|
+-----------------------------------------------------------+
```

**Simple mental model:**
- **Fastly** = a faster way to serve the *same* Commerce storefront
- **Edge Delivery Services** = a *different kind of storefront* that can connect to Commerce's backend

**Exam focus:** EDS is Adobe's **document-based storefront** technology. It is NOT Fastly. It is NOT a Magento theme. It is a separate publishing/rendering system that integrates with Adobe Commerce as the commerce backend.

---

### The Franklin/Helix Model

**Franklin** and **Helix** are the project code names for what Adobe now calls **Edge Delivery Services**. You may see all three names in documentation.

```
Franklin = Helix = Edge Delivery Services
(old code names)  (current brand name)
```

#### The Core Concept: Document-First Publishing

Traditional web CMS: Developer builds templates → Content editor fills in fields → System generates HTML.

EDS/Franklin: Content editor writes in Google Docs or SharePoint → System converts document → Serves as webpage.

```
+---------------------------+
| Content Author            |
| writes in Google Docs     |
| (headings, tables, text)  |
+---------------------------+
            |
     Commit/Sync to
     GitHub repo
            |
            v
+---------------------------+
| EDS Franklin Runtime      |
| Converts document format  |
| to clean semantic HTML    |
+---------------------------+
            |
    Served globally from
    edge network (<100ms)
            |
            v
+---------------------------+
| Browser receives clean    |
| HTML + minimal JS         |
| (no server-side PHP)      |
+---------------------------+
            |
    When commerce needed:
    fetch() calls to
    Commerce API
            |
            v
+---------------------------+
| Adobe Commerce            |
| REST/GraphQL APIs         |
| (catalog, cart, checkout) |
+---------------------------+
```

**Why this matters for performance:**
- Static-like delivery from edge nodes worldwide
- Perfect Lighthouse scores (no blocking resources)
- Commerce API calls only happen when commerce data is needed
- Zero PHP rendering on page load for content pages

---

### EDS Boilerplate Project Structure

The EDS project is a **JavaScript/HTML project hosted on GitHub**, not a Magento module or theme. Adobe provides a boilerplate repository to start from.

```
my-eds-commerce-project/
|
+-- blocks/                    <-- Custom content blocks (THE CORE CONCEPT)
|   +-- hero/
|   |   +-- hero.js            <-- Block JavaScript
|   |   +-- hero.css           <-- Block CSS
|   +-- product-listing/
|   |   +-- product-listing.js
|   |   +-- product-listing.css
|   +-- header/
|   |   +-- header.js
|   |   +-- header.css
|
+-- scripts/                   <-- Core EDS scripts
|   +-- aem.js                 <-- Franklin/EDS core library
|   +-- scripts.js             <-- Page initialization
|   +-- delayed.js             <-- Loaded after LCP
|
+-- styles/                    <-- Global styles
|   +-- styles.css             <-- Base CSS variables, typography
|   +-- lazy-styles.css        <-- Loaded after LCP
|
+-- head.html                  <-- HTML <head> template
+-- footer.html                <-- Footer block HTML
+-- nav.html                   <-- Navigation block HTML
|
+-- fstab.yaml                 <-- Mounts: links GitHub to Google Drive/SharePoint
+-- .hlx/                      <-- EDS configuration
|   +-- config.xlsx            <-- Site configuration (spreadsheet!)
|
+-- package.json               <-- Node dependencies (for local dev)
+-- README.md
```

**Key insight for backend devs:** There are **no PHP files**, no `layout/*.xml`, no `etc/module.xml`. This is a pure JavaScript/HTML project. Content comes from documents, not a database rendered by PHP.

**Exam focus:** The `blocks/` directory is the primary customization point in EDS. Each block is a folder with a `.js` and `.css` file matching the folder name. The `fstab.yaml` connects the GitHub repo to the document source (Google Drive or SharePoint).

---

### How Blocks Are Defined and Rendered

This is the most conceptual part of EDS — understanding the **block model**.

#### Block Definition in a Document

A content author creates a "block" in Google Docs using a table:

```
+-------------------+
|   Hero            |   <-- Block name (first row)
+-------------------+
| Background Image  |   <-- Block parameters
| Headline Text     |
| CTA Button URL    |
+-------------------+
```

This table in Google Docs becomes:

```html
<!-- HTML that EDS generates from the document table -->
<div class="hero">
  <div>
    <div>Background Image</div>
  </div>
  <div>
    <div>Headline Text</div>
  </div>
  <div>
    <div>CTA Button URL</div>
  </div>
</div>
```

#### Block JavaScript File

The EDS runtime detects the `class="hero"` on a div, then loads and executes `blocks/hero/hero.js`:

```javascript
// blocks/hero/hero.js

/**
 * @param {Element} block - The DOM element with class="hero"
 */
export default function decorate(block) {
    // Access the document content that was converted to HTML
    const rows = [...block.children];

    // Extract content from the generated structure
    const backgroundImg = rows[0].querySelector('img');
    const headline = rows[1].textContent;
    const ctaUrl = rows[2].textContent.trim();

    // Rebuild the block's HTML structure
    block.innerHTML = `
        <div class="hero-background">
            <img src="${backgroundImg?.src}" alt="${backgroundImg?.alt}" loading="eager">
        </div>
        <div class="hero-content">
            <h1>${headline}</h1>
            <a href="${ctaUrl}" class="hero-cta">Shop Now</a>
        </div>
    `;
}
```

**The pattern every EDS block follows:**

```
1. Author creates table in Google Docs with block name
2. EDS converts document -> clean HTML with class names
3. EDS runtime loads blocks/<name>/<name>.js
4. The default export function decorate(block) is called
5. Block's JS transforms the generic HTML into rich component
6. blocks/<name>/<name>.css styles the component
```

#### Commerce-Connected Block Example

For commerce functionality, a block fetches from Commerce APIs:

```javascript
// blocks/product-listing/product-listing.js

export default async function decorate(block) {
    // Get category from document content
    const categoryId = block.querySelector('div').textContent.trim();

    // Fetch products from Commerce GraphQL API
    const response = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: `{
                products(filter: { category_id: { eq: "${categoryId}" } }) {
                    items { name sku price_range { ... } }
                }
            }`
        })
    });

    const { data } = await response.json();

    // Render products
    block.innerHTML = data.products.items
        .map(product => `
            <div class="product-card">
                <h3>${product.name}</h3>
                <p>${product.price_range.minimum_price.final_price.value}</p>
            </div>
        `)
        .join('');
}
```

**Exam focus:** EDS blocks are loaded **automatically** by the EDS runtime based on CSS class names matching the `blocks/` folder name. The `decorate(block)` function is the **single entry point** for a block's JavaScript. Commerce data is fetched via **GraphQL or REST API calls** from the browser, not server-side rendering.

---

### EDS vs Traditional Magento Theme Development

This comparison table is gold for exam preparation:

| Aspect | Traditional Commerce Theme | Edge Delivery Services |
|---|---|---|
| **Language** | PHP + PHTML + LESS + XML | JavaScript + CSS + HTML |
| **Template engine** | PHP (PHTML files) | Vanilla JS DOM manipulation |
| **Layout system** | XML layout files | Document tables → blocks |
| **Content storage** | Database (CMS Pages/Blocks) | Google Docs / SharePoint |
| **CSS preprocessor** | LESS (via Grunt) | Plain CSS (CSS variables) |
| **Routing** | Commerce MVC controllers | File-based (GitHub path = URL) |
| **Build tool** | Grunt / SCD | None (or minimal Node.js) |
| **Inheritance** | Theme fallback (parent themes) | None (copy blocks) |
| **Commerce integration** | Direct PHP/DB access | REST/GraphQL API calls |
| **Performance model** | Server-side render + cache | Edge-served static + API |
| **Developer skill** | PHP + Magento-specific patterns | Web standards (HTML/CSS/JS) |
| **Deployment** | Commerce server + Grunt/SCD | GitHub push → EDS CDN |
| **Customization unit** | Module + Theme | Block (JS + CSS file pair) |

**Key architectural difference:**

```
Traditional Commerce Theme:
+---------------------------+
| Browser Request           |
+---------------------------+
            |
            v
+---------------------------+
| Commerce PHP App          |
| Layout XML resolved       |
| Blocks rendered           |
| PHTML executed            |
| Full HTML generated       |
+---------------------------+
            |
            v
+---------------------------+
| HTML sent to browser      |
| (CSS/JS already deployed) |
+---------------------------+


EDS Architecture:
+---------------------------+
| Browser Request           |
+---------------------------+
            |
            v
+---------------------------+
| EDS Edge Network          |
| Serves pre-generated HTML |
| from document source      |
| (No PHP, instant!)        |
+---------------------------+
            |
    Browser executes JS
    blocks/*/block.js
            |
            v
+---------------------------+
| Commerce API calls        |
| (only for commerce data)  |
+---------------------------+
```

**Exam focus:** EDS does **not** replace Commerce's backend (catalog, cart, checkout logic). It replaces the **storefront presentation layer** (the traditional theme). Commerce becomes an API provider. This is the "headless commerce" or "composable commerce" pattern.

---

## 5. Hands-On Walkthroughs

### Walkthrough 1: Run grunt less and Verify LESS Compilation

#### Prerequisites Check

```bash
# Verify Node.js is installed
node --version
# Should return v14.x or higher

# Verify npm is installed
npm --version
```

#### Step-by-Step

```bash
# 1. Navigate to Commerce root
cd /var/www/html/magento2

# 2. Check if package.json exists
ls -la package.json

# 3. Check if Gruntfile.js exists (or sample)
ls -la Gruntfile.js Gruntfile.js.sample

# 4. If only sample exists, copy it
cp Gruntfile.js.sample Gruntfile.js

# 5. Install Node dependencies (creates node_modules/)
npm install
# This may take 2-5 minutes on first run

# 6. Verify grunt CLI is available
./node_modules/.bin/grunt --version
# OR install globally: npm install -g grunt-cli

# 7. Check theme configuration
cat dev/tools/grunt/configs/themes.js
# Note the available theme identifiers

# 8. Clean any previously generated files
grunt clean:luma
# (replace 'luma' with your theme identifier)

# 9. Compile LESS for your theme
grunt less:luma

# Watch the output for errors like:
# Running "less:luma" (less) task ... Done.
```

#### Verify the Compilation

```bash
# Check that CSS was generated
ls -la pub/static/frontend/Magento/luma/en_US/css/

# You should see files like:
# styles-m.css      (mobile styles)
# styles-l.css      (desktop-only styles)
# print.css

# Verify the CSS contains compiled content (not LESS syntax)
head -20 pub/static/frontend/Magento/luma/en_US/css/styles-m.css

# Should show CSS, not LESS variables like @variable-name
# Good output example:
# body { font-family: 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif; }
# Bad output: @font-family__base: 'Open Sans', ...
```

#### Verify Source Maps (Developer Mode)

```bash
# Source maps allow browser devtools to show original LESS files
ls -la pub/static/frontend/Magento/luma/en_US/css/*.map
# Should see styles-m.css.map

# In browser: Open DevTools > Sources
# You should see .less files in the sources panel, not compiled CSS
```

#### Make a Test Change

```bash
# Edit a LESS variable
vim app/design/frontend/Magento/luma/web/css/source/_variables.less
# Change a color variable, save

# Recompile
grunt less:luma

# Hard refresh browser (Ctrl+Shift+R) to bypass browser cache
# The color change should appear
```

---

### Walkthrough 2: Enable CSS Merging and Inspect Network Requests

#### Enable CSS Merging

```
1. Log in to Commerce Admin
2. Navigate to: Stores > Configuration > Advanced > Developer
3. Expand "CSS Settings" section
4. Change "Merge CSS Files" to "Yes"
5. Change "Minify CSS Files" to "Yes"
6. Click "Save Config"
7. Flush the cache:
```

```bash
php bin/magento cache:flush
```

#### Inspect the Difference

**Before merging (multiple CSS requests):**

Open browser DevTools > Network tab > filter by CSS:

```
styles-m.css          (12.3 KB)
styles-l.css           (8.1 KB)
print.css              (2.2 KB)
calendar.css           (4.5 KB)
<module-specific>.css  (1.1 KB)
... (potentially 10+ files)
```

**After merging (fewer requests):**

```
merged.css    (28.1 KB minified, 1 request)
```

#### What to Document

- Number of CSS requests before vs after
- Total transfer size before vs after
- Page load time difference (check the "DOMContentLoaded" timing)
- Note that the merged filename is a hash-based name in Commerce

#### Re-Disable for Development

```bash
# IMPORTANT: Re-disable these for local development
# Go back to Admin and set "Merge CSS Files" to "No"
# OR use CLI:
php bin/magento config:set dev/css/merge_css_files 0
php bin/magento cache:flush
```

---

## Quick-Reference Checklist

### Grunt

- [ ] Grunt is a **Node.js task runner**, not PHP; requires `npm install` to set up
- [ ] `package.json` declares Grunt plugin dependencies (`grunt-contrib-less`, `grunt-contrib-watch`, etc.)
- [ ] `Gruntfile.js` orchestrates tasks; copy from `Gruntfile.js.sample` to start
- [ ] `dev/tools/grunt/configs/themes.js` defines which themes Grunt can compile
- [ ] **`grunt less`** — compiles LESS source files to CSS in `pub/static/`
- [ ] **`grunt watch`** — monitors files and auto-recompiles on save
- [ ] **`grunt clean`** — deletes `pub/static/<theme>/` and `var/view_preprocessed/`
- [ ] **`grunt exec`** — runs shell commands from within Grunt task chains
- [ ] Use `grunt less` in **developer mode** for speed and source maps
- [ ] Use `setup:static-content:deploy` at **deployment time** for production
- [ ] In developer mode, CSS is compiled **on-demand** (first request) without Grunt, or **pre-compiled** with Grunt
- [ ] Never run `setup:static-content:deploy` in developer mode
- [ ] `var/view_preprocessed/` stores intermediate LESS files (resolved `@import` chain)

### Front-End Optimization

- [ ] CSS/JS merging settings: **Admin > Stores > Configuration > Advanced > Developer**
- [ ] "Merge CSS Files" combines multiple CSS downloads into one (fewer HTTP requests)
- [ ] "Enable JavaScript Bundling" uses RequireJS r.js optimizer to bundle AMD modules
- [ ] Always flush cache after changing optimization settings
- [ ] Disable merging in developer mode — merged files will not reflect source changes
- [ ] Commerce uses **RequireJS (AMD)** — modules defined with `define([deps], function(){})` 
- [ ] `requirejs-config.js` files are merged from all modules/themes; uses `map`, `paths`, `shim`, `deps` keys
- [ ] **Critical CSS** = inline above-fold styles in `<head>` to eliminate render blocking
- [ ] **Lazy loading** = defer image/script loading until needed; use `loading="lazy"` attribute
- [ ] `srcset` attribute provides multiple image sources; browser chooses based on viewport
- [ ] Image sizes are defined in **`view.xml`** per theme, not Admin
- [ ] `view.xml` `image` elements have `id`, `type`, `width`, and `height` attributes

### Edge Delivery Services

- [ ] EDS is **NOT** Fastly; Fastly is a CDN cache layer, EDS is a different storefront architecture
- [ ] EDS = **Franklin = Helix** (all the same thing, different names across Adobe docs)
- [ ] Content is authored in **Google Docs or SharePoint** (not Commerce CMS)
- [ ] Content syncs to a **GitHub repository** via `fstab.yaml` configuration
- [ ] EDS serves pages from a **global edge network** with near-instant response
- [ ] The `blocks/` directory is the primary customization point
- [ ] Each block = a folder with `<name>.js` + `<name>.css` files (e.g., `blocks/hero/hero.js`)
- [ ] Block JS exports a **`decorate(block)`** function as the default export
- [ ] EDS runtime auto-loads block JS based on **CSS class names** matching block folder names
- [ ] Content authors create blocks using **tables in Google Docs** (block name in first row)
- [ ] Commerce integration uses **REST or GraphQL API calls** from the browser (headless)
- [ ] EDS does NOT replace Commerce backend (catalog, cart, checkout); it replaces the **presentation layer**
- [ ] No PHP, no PHTML, no layout XML, no LESS in an EDS project
- [ ] EDS uses **plain CSS** (with CSS variables), not LESS or SASS
- [ ] EDS project has `scripts/aem.js` (core runtime), `scripts/scripts.js`, `scripts/delayed.js`
- [ ] `fstab.yaml` links the GitHub repo to the document source (Google Drive/SharePoint mount)

### Exam Strategy Notes

- [ ] Grunt questions will be **conceptual** — know what each task does, not memorize exact config syntax
- [ ] EDS questions will test whether you know it is **document-based** and **different from traditional themes**
- [ ] Know the **three deployment contexts**: developer mode (Grunt/on-demand), production (SCD), EDS (edge)
- [ ] Know that RequireJS config files are named **`requirejs-config.js`** and placed in `view/<area>/`
- [ ] Know the admin path for optimization settings: **Advanced > Developer** (not "Performance")
- [ ] If asked about EDS blocks: the answer always involves the `blocks/` folder and `decorate()` function
