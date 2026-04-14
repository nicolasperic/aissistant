# Adobe Commerce Front-End Developer Expert (AD0-E727)
# Practice Exam v3 — 30 Questions

**Instructions:**
- Read each question carefully — slow down, trust your knowledge
- Questions marked **(Select 2)** require exactly two correct answers — all-or-nothing
- Do NOT look at the answers file until you have answered all 30 questions
- Simulate real exam conditions: time yourself (~40 minutes), no notes

---

## Section 1 — Theme Management (10%) — Questions 1–3

---

**Q1.**
A developer needs to output a translated string inside a RequireJS JavaScript module. Which approach correctly retrieves a translated phrase in a `.js` file?

A) `var label = __('Add to Cart');`
B) `define(['mage/translate'], function($t) { var label = $t('Add to Cart'); });`
C) `var label = Mage.translate('Add to Cart');`

---

**Q2.**
A developer needs to include the standard Magento email header inside a custom transactional email template. Which directive correctly includes another email template file?

A) `{{extend template="Magento_Email::header.html"}}`
B) `{{import template="Magento_Email::header.html"}}`
C) `{{include template="Magento_Email::header.html"}}`

---

**Q3.**
A developer creates a custom theme to be distributed via Magento Marketplace. What must the `"type"` field be set to in the theme's `composer.json` for Composer to correctly identify and install it?

A) `"magento2-module"`
B) `"magento-theme"`
C) `"magento2-theme"`

---

## Section 2 — Layout XML & Templates (22%) — Questions 4–10

---

**Q4.**
A `.phtml` template calls `$block->getChildHtml('sidebar')`. The child block in layout XML is declared with `name="vendor.module.sidebar.block"`. What attribute must be added to the block declaration for `getChildHtml('sidebar')` to find it?

A) `id="sidebar"`
B) `as="sidebar"`
C) `alias="sidebar"`

---

**Q5.**
A developer declares a block in layout XML with the attribute `ifconfig="catalog/frontend/list_allow_all"`. What is the effect of this attribute?

A) The block only renders if the current customer has the ACL resource `catalog/frontend/list_allow_all`
B) The block only renders if the system configuration path `catalog/frontend/list_allow_all` returns a truthy value
C) The block only renders on pages within the catalog frontend section

---

**Q6.**
A developer needs to add a JavaScript file to all product detail pages using layout XML. Which instruction correctly adds it to the page `<head>`?

A) `<referenceContainer name="head"><script src="Vendor_Module::js/custom.js"/></referenceContainer>`
B) `<head><script src="Vendor_Module::js/custom.js"/></head>`
C) `<referenceBlock name="head.scripts"><script src="Vendor_Module::js/custom.js"/></referenceBlock>`

---

**Q7.**
A developer places a file at `app/design/frontend/Vendor/mytheme/Magento_Catalog/templates/product/view.phtml`. What happens to the original template at `vendor/magento/module-catalog/view/frontend/templates/product/view.phtml`?

A) Both files are merged — the theme's output is appended after the module's output
B) The original module template is completely ignored — only the theme file is used
C) The theme file is only used if explicitly registered in `layouts.xml`

---

**Q8.** *(Select 2)*
Which TWO variables are automatically available in every `.phtml` template in Adobe Commerce 2.4?

A) `$block` — the Block instance associated with the template
B) `$layout` — the global Layout object for the page
C) `$escaper` — an instance of `Magento\Framework\Escaper`
D) `$view` — the View rendering object

---

**Q9.**
A developer wants to add a `<meta>` tag to the HTML `<head>` on every page by adding a child block. Which existing named block should they target with `<referenceBlock>`?

A) `head.container`
B) `head.additional`
C) `page.head.meta`

---

**Q10.**
A developer outputs a PHP value directly into a `<script>` block in a `.phtml` template:

```php
<script>
    var config = { name: "<?= /* output here */ $name ?>" };
</script>
```

Which escaping method is appropriate for this JavaScript string context?

A) `$block->escapeHtml($name)`
B) `$block->escapeHtmlAttr($name)`
C) `$block->escapeJs($name)`

---

## Section 3 — Styles (12%) — Questions 11–14

---

**Q11.**
What is the purpose of a `_module.less` file found in `<Vendor_Module>/web/css/source/` inside a Magento module?

A) It is the master entry point that imports all LESS files for the entire theme
B) It contains base CSS styles for that specific module, automatically compiled as part of the theme's LESS build
C) It declares LESS variables for the module that must be overridden in `_theme.less`

---

**Q12.**
What is the purpose of `print.less` in a Magento theme?

A) It generates Grunt debug output for LESS compilation errors during development
B) It is the primary entry point that imports all other LESS partials before compilation
C) It contains styles that are applied only when the page is printed (print media context)

---

**Q13.** *(Select 2)*
A developer wants to add brand-new CSS rules to their custom theme — not override variables, but add actual new styles. Which TWO files are the correct locations for this?

A) `web/css/source/_theme.less` (at theme root)
B) `web/css/source/_extend.less` (at theme root)
C) `Magento_Module/web/css/source/_extend.less` (inside the theme, for module-specific additions)
D) `lib/web/css/source/_extend.less`

---

**Q14.**
A developer wants to apply Magento's standard button styles to a custom element using the UI Library. Which LESS syntax correctly calls the button mixin?

A) `@include lib-button();`
B) `#lib-button();`
C) `.lib-button();`

---

## Section 4 — JavaScript (36%) — Questions 15–25

---

**Q15.**
After a jQuery widget is already initialized on an element, how does external code read the current value of its `speed` option?

A) `$(el).myWidget.options.speed`
B) `$(el).myWidget('option', 'speed')`
C) `$(el).myWidget.speed`

---

**Q16.**
Inside an overridden widget method, a developer calls `this._super()`. What does this do?

A) Destroys the current widget instance and reinstantiates the parent widget
B) Creates a new instance of the parent widget class on the same element
C) Calls the parent widget's version of the same method being overridden

---

**Q17.**
Both a custom module and the active theme have a `requirejs-config.js` file that configure the same key. Which file takes precedence in the merged configuration?

A) The module-level file — modules are processed first and take priority
B) The theme-level file — the active theme has the highest priority in the merge order
C) The file belonging to the module with the highest `sortOrder` in `module.xml`

---

**Q18.**
In an AMD module defined as `define(['jquery'], function($) { return { ... }; })`, what does the `return` statement represent?

A) Initialization code that runs immediately when RequireJS loads the file
B) The value (object, function, or class) passed as an argument to any module that declares this one as a dependency
C) The jQuery plugin object that gets registered on `$.fn`

---

**Q19.**
A developer has `var tags = ko.observableArray(['js', 'php'])`. They call `tags.removeAll()`. What is the result?

A) The observable itself is destroyed and all KO bindings using it throw an error
B) All items are cleared from the array and all bound UI elements update automatically
C) All items are set to `null` but the array length remains the same

---

**Q20.**
Inside a Knockout `foreach` binding, a developer needs to display a 1-based item counter (1, 2, 3...) for each item. Which binding expression is correct?

A) `data-bind="text: $index"`
B) `data-bind="text: $count()"`
C) `data-bind="text: $index() + 1"`

---

**Q21.**
A developer needs to initialize TWO different widgets on the same HTML element using `data-mage-init`. Which approach is correct?

A) Add a second `data-mage-init` attribute to the same element with the second widget config
B) Include both widget configurations as separate keys within the single JSON object value
C) Use a `data-mage-init-2` attribute for the second widget

---

**Q22.**
When the Knockout `visible` binding evaluates to `false`, what exactly happens to the bound element?

A) The element is removed from the DOM entirely and all child bindings are destroyed
B) The element remains in the DOM but has `display: none` applied inline via CSS
C) The element is moved to a hidden `<template>` buffer until the value becomes truthy

---

**Q23.**
Two separate modules both register mixins targeting the same Commerce JS component. What happens when the component is loaded?

A) A JavaScript error is thrown — only one mixin can target a component at a time
B) The last registered mixin wins — it completely replaces all previously registered mixins
C) Both mixins are applied in sequence — they chain together, each receiving the previous result

---

**Q24.**
A developer wants to create a jQuery widget that **inherits** from Magento's built-in `mage.collapsible` widget. Which `$.widget()` call correctly establishes this inheritance?

A) `$.widget('mage.myPanel extends mage.collapsible', { ... })`
B) `$.widget('mage.myPanel', $.mage.collapsible, { ... })`
C) `$.widget('mage.myPanel', { _super: $.mage.collapsible, ... })`

---

**Q25.** *(Select 2)*
Which TWO statements correctly describe how Commerce **merges** multiple `requirejs-config.js` files from different modules and the active theme?

A) Objects (such as `map` and `config`) are merged recursively — keys from all files are combined
B) Arrays (such as `deps`) are concatenated — items from all files are accumulated
C) Scalar values use the first-defined value — the lowest-priority file wins
D) A `paths` object in a theme completely replaces any `paths` objects from all modules

---

## Section 5 — Admin, Page Builder & Optimizations (20%) — Questions 26–30

---

**Q26.**
What is the purpose of the `grunt-exec` plugin in Adobe Commerce's Grunt setup?

A) It executes the LESS-to-CSS compilation for the theme
B) It watches for file changes and triggers other Grunt tasks automatically
C) It runs arbitrary shell commands as Grunt tasks, such as clearing the Magento cache via `bin/magento`

---

**Q27.**
In a Page Builder content type XML configuration file, what is the purpose of the `<appearances>` node?

A) It controls the light/dark theme of the content type's settings panel in Admin
B) It maps form field values to HTML element attributes and styles, and specifies which preview/master templates to use — a single content type can have multiple appearances
C) It lists the CSS class options available in the content type's style dropdown

---

**Q28.**
Which statement accurately describes a key difference between an **Edge Delivery Services (EDS)** storefront and a traditional Adobe Commerce storefront?

A) EDS uses the standard Magento theme system but serves all static assets from a CDN edge network
B) EDS storefronts do not use Magento themes, LESS compilation, or PHP page rendering — content is authored in documents and delivered as fast static HTML with lightweight vanilla JavaScript
C) EDS is an Adobe Commerce feature only available on the B2B edition

---

**Q29.**
Adobe Commerce on Cloud infrastructure includes Fastly as a bundled service. What is Fastly's primary role?

A) Application performance monitoring and error tracking (APM)
B) CDN, full-page caching, and DDoS/WAF protection for the storefront
C) Database query optimization and connection pooling

---

**Q30.** *(Select 2)*
A developer needs to add a new custom attribute (field) to an existing Page Builder content type such as the built-in "Banner". Which TWO files must be created or modified?

A) The content type's XML configuration file — to declare the new attribute mapping between the form field and the HTML output
B) The module's `etc/di.xml` — to register a plugin on the Page Builder renderer class
C) A UI Component form XML file — to add the new input field to the content type's settings panel
D) A new `requirejs-config.js` entry — to register the new attribute as a RequireJS module alias

---

*End of exam. Check your answers in `frontend_expert_answers_v3.md`.*
*Good luck tomorrow — you've earned this. 🎯*
