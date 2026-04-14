# Adobe Commerce Front-End Developer Expert (AD0-E727)
# Practice Exam v2 — 30 Questions

**Instructions:**
- Read each question carefully before selecting your answer
- Questions marked **(Select 2)** require exactly two correct answers — all-or-nothing
- Do NOT look at the answers file until you have answered all 30 questions
- Time yourself: aim to finish in ~40 minutes

---

## Section 1 — Theme Management (10%) — Questions 1–3

---

**Q1.**
What is the primary purpose of the `etc/view.xml` file inside a custom theme?

A) It declares the parent theme name and builds the fallback inheritance chain
B) It configures product image dimensions and roles (e.g., thumbnail, small_image, base image)
C) It maps LESS variable names to their default color values for the theme

---

**Q2.**
A store has the phrase "Add to Cart" translated in three places: the module's `i18n/en_US.csv`, the active theme's `i18n/en_US.csv`, and via Admin > Stores > Configuration (database override). Which source takes precedence at runtime?

A) The theme-level `i18n/en_US.csv` — theme files always win
B) The Admin database override — it always has the highest priority
C) The module `i18n/en_US.csv` — module translations are the canonical source

---

**Q3.**
A developer is building a custom transactional email template and needs to output the store name from system configuration. Which email template directive retrieves a system configuration value?

A) `{{var store.name}}`
B) `{{trans "general/store_information/name"}}`
C) `{{config path="general/store_information/name"}}`

---

## Section 2 — Layout XML & Templates (22%) — Questions 4–10

---

**Q4.**
What is the root XML element of a **page layout** file (such as `2columns-left.xml`) in Adobe Commerce?

A) `<page>`
B) `<structure>`
C) `<layout>`

---

**Q5.**
A developer sets `cacheable="false"` on a block in layout XML. What is the scope of this setting?

A) Only that block's PHP output is excluded from the block HTML cache
B) The entire page containing this block is excluded from Full Page Cache (Varnish/FPC)
C) Only that block's database queries are excluded from the object cache

---

**Q6.**
A developer needs to pass an array of configuration values as an `<argument>` to a block in layout XML. Which `xsi:type` and structure is correct?

A) `xsi:type="list"` with nested `<value>` elements
B) `xsi:type="array"` with nested `<item name="..." xsi:type="...">` elements
C) `xsi:type="collection"` with nested `<entry>` elements

---

**Q7.** *(Select 2)*
Which TWO statements correctly describe the difference between `remove="true"` and `display="false"` on a `<referenceBlock>` in layout XML?

A) `remove="true"` removes the block completely from the layout tree — child layouts cannot re-enable it
B) `display="false"` hides the block from rendering but keeps it in the layout tree, allowing child blocks to still reference it
C) `display="false"` permanently removes the block from the DOM output
D) `remove="true"` simply adds a CSS `display: none` style to the block's rendered output

---

**Q8.**
A developer creates a new custom page layout file `full-width-promo.xml` inside their theme. Where must this layout be **registered** for Magento to recognize and offer it?

A) In `Magento_Theme/layout/default.xml` as a new layout handle
B) In `Magento_Theme/layouts.xml` inside the theme directory
C) In `Magento_Theme/page_layout/layouts.xml` inside the theme directory

---

**Q9.**
What does the `<update handle="customer_account"/>` instruction do in a layout XML file?

A) Creates a new layout handle named `customer_account` that can be used elsewhere
B) Merges all layout instructions from the `customer_account` handle into the current page's layout
C) Restricts the current layout file to only load when a customer is logged in

---

**Q10.**
A developer outputs a dynamic CSS class name as an HTML attribute value in a `.phtml` template. Which escaping method is appropriate for this context?

A) `<div class="<?= $block->escapeHtml($cssClass) ?>">`
B) `<div class="<?= $block->escapeJs($cssClass) ?>">`
C) `<div class="<?= $block->escapeHtmlAttr($cssClass) ?>">`

---

## Section 3 — Styles (12%) — Questions 11–14

---

**Q11.**
What is the LESS variable name that defines the **tablet breakpoint** (768px) in Magento's UI Library?

A) `@screen__tablet`
B) `@screen__m`
C) `@breakpoint__medium`

---

**Q12.**
What is the distinction between `styles-m.less` and `styles-l.less` in a Magento theme?

A) `styles-m.less` is for screens between 320px–768px only; `styles-l.less` is for screens 769px and above
B) `styles-m.less` is the mobile-first base stylesheet applied to all screen sizes; `styles-l.less` contains desktop-only additions
C) `styles-m.less` compiles module-level styles; `styles-l.less` compiles library-level styles

---

**Q13.**
A developer working in a custom theme wants to override specific CSS rules from the `Magento_Navigation` module without replacing any template files. Where should they place these theme-specific style overrides?

A) `web/css/source/_extend.less` at the theme root
B) `Magento_Navigation/web/css/source/_module.less` inside the theme
C) `Magento_Navigation/web/css/source/_extend.less` inside the theme

---

**Q14.** *(Select 2)*
Which TWO statements about LESS compilation in Adobe Commerce **developer mode** are correct?

A) LESS is compiled server-side using PHP (`less.php`) on the first request — client-side `less.js` is NOT active by default
B) LESS is compiled automatically in the browser using `less.js` whenever developer mode is enabled
C) Running `grunt watch` in developer mode automatically recompiles LESS files when changes are detected
D) Developer mode requires running `bin/magento setup:static-content:deploy` before LESS changes are visible

---

## Section 4 — JavaScript (36%) — Questions 15–25

---

**Q15.**
In jQuery Widget Factory, what is the difference between `_create()` and `_init()`?

A) `_create()` runs every time the widget is called; `_init()` runs only during the first initialization
B) `_create()` runs only once on first instantiation; `_init()` runs on first creation AND on every subsequent re-call of the widget method
C) `_create()` initializes widget options; `_init()` sets up DOM event bindings

---

**Q16.**
A developer defines a custom widget with `$.widget('mage.promoSlider', {...})`. How is this widget invoked on a jQuery-selected DOM element?

A) `$(el).mage.promoSlider()`
B) `$(el).promoSlider()`
C) `$(el).widget('mage.promoSlider')`

---

**Q17.**
Why is `this._on(element, events)` preferred over `$(element).on(events)` when binding DOM events inside a jQuery widget?

A) `this._on()` is faster because it bypasses jQuery's event delegation layer
B) `this._on()` automatically unbinds all registered events when the widget's `destroy()` method is called
C) `this._on()` supports modern shadow DOM event capturing which `$(el).on()` cannot handle

---

**Q18.**
A developer needs to integrate a legacy third-party JavaScript library that does NOT use the AMD `define()` pattern. Which key in `requirejs-config.js` is designed for configuring non-AMD scripts?

A) `deps`
B) `shim`
C) `map`

---

**Q19.**
A developer has `var cartItems = ko.observableArray(['item1', 'item2'])`. They want to add a new item and have the bound UI update automatically. Which call is correct?

A) `cartItems().push('item3')`
B) `cartItems['item3'] = true`
C) `cartItems.push('item3')`

---

**Q20.**
A developer declares:
```javascript
var fullName = ko.computed(function() {
    return firstName() + ' ' + lastName();
});
```
What is the defining behavior of `ko.computed`?

A) It runs the function once on declaration and permanently caches the result
B) It automatically re-evaluates and updates whenever any observable it reads (`firstName`, `lastName`) changes
C) It creates a two-way observable with built-in input validation

---

**Q21.**
Inside a Knockout `foreach` binding looping over cart items, a developer needs a "Remove" button to call a `removeItem` method that belongs to the **immediate parent** ViewModel — not the item itself. Which binding is correct?

A) `data-bind="click: $root.removeItem"`
B) `data-bind="click: $parent.removeItem"`
C) `data-bind="click: $data.removeItem"`

---

**Q22.**
A developer uses `<script type="text/x-magento-init">` with `"*"` as the selector key:

```html
<script type="text/x-magento-init">
{
    "*": {
        "Vendor_Module/js/global-tracker": { "key": "value" }
    }
}
</script>
```

What does the `"*"` selector mean in this context?

A) The component is applied to every individual DOM element on the page
B) The component initializes globally with no specific DOM element context
C) The component targets all elements that have a `data-role` attribute

---

**Q23.**
In AMD module loading within Adobe Commerce, what is the correct distinction between `define()` and `require()`?

A) `define()` declares a reusable module that other modules can depend on; `require()` is used for one-time execution that does not need to be consumed by other modules
B) `require()` loads files synchronously; `define()` loads files asynchronously
C) `define()` is for `.phtml` templates; `require()` is for standalone `.js` files

---

**Q24.**
A developer discovers that a third-party module has registered a mixin on `Magento_Checkout/js/view/minicart` that conflicts with their customization. They want to **disable** that specific mixin from their theme. What is the correct approach?

A) Delete the third-party mixin file from the theme's override directory
B) Set the mixin's value to `false` in `config.config.mixins` in their theme's `requirejs-config.js`
C) Add the mixin module ID to a `config.exclude` array in `requirejs-config.js`

---

**Q25.** *(Select 2)*
Which TWO statements about Knockout.js bindings are correct?

A) The `text` binding HTML-escapes output; the `html` binding renders raw HTML without escaping
B) The `value` binding provides two-way data binding for form input elements (reads and writes the observable)
C) The `attr` binding is used to add/remove CSS class names based on boolean conditions
D) The `css` binding is used to dynamically set HTML attribute values like `href` and `src`

---

## Section 5 — Admin, Page Builder & Optimizations (20%) — Questions 26–30

---

**Q26.**
A developer is actively modifying LESS files and wants them recompiled automatically every time a file is saved, without running a command each time. Which Grunt command enables this continuous watch workflow?

A) `grunt less`
B) `grunt exec`
C) `grunt watch`

---

**Q27.**
In the Edge Delivery Services (EDS) boilerplate architecture, how is a "block" defined from a content authoring perspective?

A) Blocks are defined as Knockout.js components registered in a central `blocks.json` manifest file
B) Blocks are authored as structured tables in Word or Google Docs and rendered on the frontend by a matching JavaScript decoration function
C) Blocks are PHP class files that extend Magento's core block system and are discovered at deployment time

---

**Q28.** *(Select 2)*
Which TWO settings in the Adobe Commerce Admin panel can directly reduce frontend page load time by consolidating static asset requests?

A) Merge CSS Files (Admin > Stores > Configuration > Advanced > Developer > CSS Settings)
B) Enable Page Builder Stage Caching (Admin > Content > Configuration)
C) Merge JavaScript Files (Admin > Stores > Configuration > Advanced > Developer > JavaScript Settings)
D) Compile LESS on Save (Admin > Stores > Configuration > Advanced > Developer > LESS Settings)

---

**Q29.**
When registering a custom Page Builder content type in its XML configuration file, which attribute controls which **panel group** the new content type appears in on the Admin stage (e.g., "Layout", "Elements", "Media")?

A) `panel_group`
B) `category`
C) `menu_section`

---

**Q30.** *(Select 2)*
The Admin UI SDK provides extension points for customizing the Adobe Commerce Admin UI. Which TWO are valid Admin UI SDK extension points?

A) Adding custom items to the Admin navigation **menu**
B) Injecting custom PHP block output into Admin grid column cells
C) Adding items to grid **mass action** menus
D) Registering custom Knockout.js widgets for Admin forms via `adminhtml` layout XML

---

*End of exam. Check your answers in `frontend_expert_answers_v2.md`.*
