# Adobe Commerce Front-End Developer Expert (AD0-E727)
# Practice Exam — 30 Questions

**Instructions:**
- Read each question carefully before selecting your answer
- Questions marked **(Select 2)** require exactly two correct answers
- Do NOT look at the answers file until you have answered all 30 questions
- Time yourself: aim to finish in ~40 minutes (real exam is 50 questions in ~68 minutes)

---

## Section 1 — Theme Management (10%) — Questions 1–3

---

**Q1.**
A developer creates a frontend theme at `app/design/frontend/MyVendor/mytheme/`. What is the correct second argument to pass to `ComponentRegistrar::register()` inside `registration.php`?

A) `'app/design/frontend/MyVendor/mytheme'`
B) `'frontend/MyVendor/mytheme'`
C) `'MyVendor/mytheme'`

---

**Q2.** *(Select 2)*
A developer creates a new theme with all required files and directory structure. After deploying, the theme does NOT appear in **Admin > Content > Design > Configuration**. Which TWO are the most likely causes?

A) The second argument in `registration.php` does not exactly match the filesystem directory path
B) The `etc/view.xml` file is missing from the theme root
C) `bin/magento setup:upgrade` was not run after creating the theme files
D) The `<parent>` element is missing from `theme.xml`

---

**Q3.**
When Magento resolves a `.phtml` template file, in which order does it search the fallback chain?

A) Module `view/frontend/` directory → Active theme → Parent theme(s) → `lib/web/`
B) Active theme → Parent theme(s) → Module `view/frontend/` directory → `lib/web/`
C) `lib/web/` → Module `view/frontend/` directory → Parent theme(s) → Active theme

---

## Section 2 — Layout XML & Templates (22%) — Questions 4–10

---

**Q4.**
A developer needs to move an existing block from its current container to a different container without creating a new block or deleting the original. Which Layout XML instruction achieves this?

A) `<referenceBlock>`
B) `<update>`
C) `<move>`

---

**Q5.**
A developer adds the following to a layout XML file:

```xml
<block class="Vendor\Module\Block\Banner"
       name="promo.banner"
       template="Vendor_Module::banner.phtml"
       before="-"/>
```

Where will this block be positioned relative to its siblings?

A) As the last child of its parent container
B) As the first child of its parent container
C) Immediately before a block whose name is the literal string `"-"`

---

**Q6.** *(Select 2)*
Which TWO attributes are valid on a `<container>` element in Layout XML but are **NOT** valid on a `<block>` element?

A) `htmlTag`
B) `template`
C) `htmlClass`
D) `class`

---

**Q7.**
A developer wants to add a custom promotional banner block to **every page** of the storefront. In which layout XML file should the block declaration be placed?

A) `cms_index_index.xml`
B) `default.xml`
C) `catalog_product_view.xml`

---

**Q8.**
A template file is located at:
`app/code/MyVendor/Promotions/view/frontend/templates/banner/hero.phtml`

What is the correct template reference string to use in Layout XML?

A) `'MyVendor/Promotions::banner/hero.phtml'`
B) `'MyVendor_Promotions::templates/banner/hero.phtml'`
C) `'MyVendor_Promotions::banner/hero.phtml'`

---

**Q9.**
A developer working inside a custom theme needs to completely replace (not just extend) the core Layout XML file `Magento_Catalog/view/frontend/layout/catalog_product_view.xml`. In which directory should the override file be placed?

A) `app/design/frontend/Vendor/mytheme/Magento_Catalog/layout/`
B) `app/design/frontend/Vendor/mytheme/Magento_Catalog/layout/override/base/`
C) `app/design/frontend/Vendor/mytheme/layout/override/base/Magento_Catalog/`

---

**Q10.** *(Select 2)*
A developer is outputting a product name retrieved from an API call in a `.phtml` template. Which TWO of the following correctly apply XSS output escaping?

A) `<?= $block->escapeHtml($productName) ?>`
B) `<?= $block->escapeUrl($productName) ?>`
C) `<?= $escaper->escapeHtml($productName) ?>`
D) `<?= htmlspecialchars($productName) ?>`

---

## Section 3 — Styles (12%) — Questions 11–14

---

**Q11.**
A developer is building a child theme that extends `Magento/luma`. They want to override the `@primary__color` LESS variable. In which file should this override be declared?

A) `web/css/source/_variables.less`
B) `web/css/source/_extend.less`
C) `web/css/source/_theme.less`

---

**Q12.**
Where does the Magento UI Library (containing all `.lib-*` mixin definitions) reside in the codebase?

A) `vendor/magento/theme-frontend-blank/web/css/source/lib/`
B) `lib/web/css/source/lib/`
C) `app/design/frontend/Magento/blank/web/css/source/lib/`

---

**Q13.**
A developer writes the following LESS directive:

```less
@import (reference) 'source/lib/_lib';
```

What is the effect of using the `(reference)` keyword?

A) Imports the file's CSS rules and outputs them in the compiled stylesheet
B) Imports mixins and variables from the file without emitting any CSS output
C) Creates a LESS variable that holds a reference to the file path

---

**Q14.**
A developer has the following in two different LESS files that are both imported into the same compilation context:

```less
// File A (imported first):
@button__background: #0000ff;

// File B (imported second, from _theme.less):
@button__background: #ff0000;
```

Which color will the compiled CSS use for `@button__background`?

A) `#0000ff` (blue) — the first declaration wins
B) `#ff0000` (red) — the last declaration wins due to LESS lazy evaluation
C) The result is a compilation error due to duplicate variable declaration

---

## Section 4 — JavaScript (36%) — Questions 15–25

---

**Q15.**
Every `requirejs-config.js` file in Adobe Commerce exports a configuration object. What MUST the top-level JavaScript variable holding that object be named?

A) `module`
B) `requireConfig`
C) `config`

---

**Q16.**
A developer needs to make a third-party charting library (a new `.js` file) available to other modules via the alias `my-charts`. Which key in `requirejs-config.js` should register this new alias-to-file mapping?

A) `map`
B) `deps`
C) `paths`

---

**Q17.**
A developer wants every module that requests `Magento_Checkout/js/view/form/element/email` to receive their custom replacement module instead, ensuring the original Magento file is never loaded. Which key in `requirejs-config.js` correctly achieves this?

A) `config.mixins`
B) `paths`
C) `map`

---

**Q18.**
A developer registers a JavaScript mixin. In which nested location inside `requirejs-config.js` is the mixin declared?

A) At `config.mixins`
B) At `config.config.mixins`
C) At `config.map.mixins`

---

**Q19.**
A developer writes a JS mixin file for a UI Component. What is the correct top-level structure the mixin module must export?

A) A plain object containing the new and overridden methods to be merged into the target component
B) A function that receives the original component as an argument and returns an extended version of it
C) A direct call to `TargetComponent.extend({})` that replaces the original component's prototype

---

**Q20.**
A developer declares a Knockout observable in JavaScript:

```javascript
var productName = ko.observable('Widget Pro');
```

Later in the same JS code (outside of a Knockout template), they want to read the current value. Which syntax is correct?

A) `productName.value`
B) `productName.get()`
C) `productName()`

---

**Q21.** *(Select 2)*
Which TWO Knockout.js binding types **remove the element from the DOM** entirely when their condition evaluates to false?

A) `visible`
B) `if`
C) `ifnot`
D) `css`

---

**Q22.**
A `.phtml` template contains the following HTML attribute on a `<div>`:

```html
<div data-mage-init='{"Vendor_Module/js/promo-widget": {"color": "red"}}'>
```

What does Magento's JavaScript bootstrap do when it processes this attribute at page load?

A) Inlines a `<script>` tag containing the JSON config next to the element in the DOM
B) Loads the `Vendor_Module/js/promo-widget` module via RequireJS and initializes it on that element, passing `{"color": "red"}` as configuration
C) Registers `Vendor_Module/js/promo-widget` as a RequireJS path alias named `promo-widget`

---

**Q23.**
What is the purpose of the `deps` key in `requirejs-config.js`?

A) Declaring which modules a specific UI Component depends on in its `define()` call
B) Automatically loading a list of module IDs on every page before any other code runs
C) Registering the dependencies that a mixin requires before it can execute

---

**Q24.**
A developer adds a `jsLayout` argument to a block declaration in Layout XML like this:

```xml
<block class="Magento\Checkout\Block\Onepage" name="checkout.root">
    <arguments>
        <argument name="jsLayout" xsi:type="array">
            <!-- nested items -->
        </argument>
    </arguments>
</block>
```

What is the primary purpose of `jsLayout`?

A) To declare which JavaScript file the block should load via RequireJS
B) To pass a nested configuration structure (PHP array serialized to JSON) that configures UI Components on the page
C) To set the RequireJS module ID that maps to this block's template file

---

**Q25.** *(Select 2)*
Which TWO mechanisms does Adobe Commerce use to wire JavaScript components or widgets to specific DOM elements in the storefront?

A) `data-mage-init` HTML attribute on a DOM element
B) `data-requirejs-config` HTML attribute
C) `<script type="text/x-magento-init">` inline script tag
D) `data-ko-bind` HTML attribute

---

## Section 5 — Admin, Page Builder & Optimizations (20%) — Questions 26–30

---

**Q26.**
How does Page Builder store its content after an admin user saves a CMS page?

A) As a JSON structure in a dedicated `page_builder_content` database table
B) As annotated HTML (with `data-content-type` attributes) in a standard `text`/`html` database column
C) As XML configuration that is transformed into HTML at storefront render time

---

**Q27.**
Every Page Builder content type has TWO template files. Which pair correctly identifies them?

A) `edit.html` (used in the admin settings panel) and `render.html` (used on the storefront)
B) `preview.html` (rendered in the Admin stage while editing) and `master.html` (output to the storefront/database)
C) `draft.html` (unpublished state) and `live.html` (published state)

---

**Q28.**
In which directory is a custom Page Builder content type's XML configuration file placed?

A) `view/frontend/pagebuilder/content_type/`
B) `etc/pagebuilder/content_type/`
C) `view/adminhtml/pagebuilder/content_type/`

---

**Q29.** *(Select 2)*
When setting up Grunt for LESS compilation in an Adobe Commerce installation, which TWO files must be copied from their `.sample` versions before running `npm install`?

A) `package.json.sample` → `package.json`
B) `Gruntfile.js.sample` → `Gruntfile.js`
C) `composer.json.sample` → `composer.json`
D) `grunt-config.js.sample` → `grunt-config.js`

---

**Q30.**
The Admin UI SDK in Adobe Commerce allows developers to extend the Admin panel interface. What technology stack does it use?

A) PHP plugins and XML configuration (the traditional Magento module pattern)
B) React-based micro-frontend applications deployed via Adobe I/O Runtime / App Builder
C) Knockout.js components registered through `adminhtml` Layout XML files

---

*End of exam. Check your answers in `frontend_expert_answers.md`.*
