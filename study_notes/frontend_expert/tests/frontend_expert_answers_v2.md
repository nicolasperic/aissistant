# Adobe Commerce Front-End Developer Expert (AD0-E727)
# Practice Exam v2 — Answer Key & Explanations

**Scoring:**
- 30 questions total
- Single-answer questions: 1 point each
- Two-answer questions (Select 2): 1 point only if BOTH correct answers selected — no partial credit
- **27–30: Excellent** | **24–26: Good** | **21–23: Needs review** | **<21: Study more**

Questions with two correct answers: **Q7, Q14, Q25, Q28, Q30**

---

## Section 1 — Theme Management

---

**Q1. Answer: B — Configures product image dimensions and roles**

`etc/view.xml` is the theme file that controls **image configuration** — specifically product image types (roles like `image`, `small_image`, `thumbnail`, `swatch_image`), their pixel dimensions, and which aspect ratios to enforce. It has nothing to do with inheritance or LESS variables.

```xml
<!-- etc/view.xml example -->
<images module="Magento_Catalog">
    <image id="category_page_grid" type="small_image">
        <width>240</width>
        <height>300</height>
    </image>
</images>
```

**Key exam fact:** A child theme's `view.xml` **completely replaces** the parent theme's — unlike layout XML which is merged.

---

**Q2. Answer: B — The Admin database override always has the highest priority**

The translation resolution order from highest to lowest:

```
1. Database (Admin > Stores > Configuration inline translations)  ← WINS
2. Theme i18n/ directory:   <theme>/i18n/en_US.csv
3. Module i18n/ directory:  <module>/i18n/en_US.csv
4. Language package:        app/i18n/<Vendor>/<language>/
```

This is a common exam trap — developers assume theme files override module files (true for layouts/templates) but the database translation takes precedence over everything.

---

**Q3. Answer: C — `{{config path="general/store_information/name"}}`**

Email templates use a proprietary directive syntax. The `{{config path="..."}}` directive reads from the store's system configuration using the config path. Key email directives to know:

| Directive | Purpose |
|-----------|---------|
| `{{var order.increment_id}}` | Output a passed variable |
| `{{config path="..."}}` | Read system configuration |
| `{{trans "text"}}` | Translatable string |
| `{{depend condition}}...{{/depend}}` | Conditional block |
| `{{inlinecss file="..."}}` | Inline CSS from a file |
| `{{include template="..."}}` | Include another template |

**Why A is wrong:** `{{var store.name}}` would require `store` to be a passed template variable. `{{config}}` is the correct directive for system config values. **Why B is wrong:** `{{trans}}` is for translatable strings, not config values.

---

## Section 2 — Layout XML & Templates

---

**Q4. Answer: C — `<layout>`**

Page layout files (the structural skeleton files like `1column.xml`, `2columns-left.xml`) use `<layout>` as their root element and validate against `page_layout.xsd`.

Page **configuration** files (the ones with blocks, templates, `<head>`, `<body>`) use `<page>` as their root element and validate against `page_configuration.xsd`.

This is a classic exam trap — the two file types look similar but have different root elements and different purposes:

| File Type | Root Element | Schema | Purpose |
|-----------|-------------|--------|---------|
| Page layout | `<layout>` | `page_layout.xsd` | Column structure |
| Page configuration | `<page>` | `page_configuration.xsd` | Block/template config |

---

**Q5. Answer: B — The entire page is excluded from Full Page Cache**

`cacheable="false"` is a page-level setting disguised as a block attribute. When ANY block on a page has `cacheable="false"`, the **entire page** is excluded from Varnish/FPC. This is not limited to the block itself — the whole page response becomes uncacheable.

This is why it must be used with care — putting it on a header block would disable FPC for every page that loads the header (i.e., all pages). Use it only on blocks that truly require per-request data (e.g., a block showing a customer's private session data).

---

**Q6. Answer: B — `xsi:type="array"` with nested `<item>` elements**

```xml
<arguments>
    <argument name="my_config" xsi:type="array">
        <item name="key1" xsi:type="string">value1</item>
        <item name="key2" xsi:type="boolean">true</item>
        <item name="nested" xsi:type="array">
            <item name="deep_key" xsi:type="number">42</item>
        </item>
    </argument>
</arguments>
```

Valid `xsi:type` values for `<argument>` and `<item>`: `string`, `boolean`, `number`, `array`, `object`, `null`, `helper`, `options`, `url`, `const`.

`list` and `collection` are not valid Magento Layout XML types.

---

**Q7. Answers: A and B**

| Attribute | Effect |
|-----------|--------|
| `remove="true"` | Block is **completely removed** from the layout tree. Cannot be re-referenced or re-enabled in child layouts. The block simply does not exist. |
| `display="false"` | Block stays in the layout tree but its HTML is **not rendered**. Child blocks can still reference it, and it can be re-enabled with `display="true"` in a child layout. |

**Why C is wrong:** `display="false"` keeps the block in the tree — it doesn't permanently remove it from DOM (the block was never in the DOM to begin with; it just doesn't render its HTML).

**Why D is wrong:** `remove="true"` has nothing to do with CSS — it's a layout tree operation, not a presentation concern.

---

**Q8. Answer: B — `Magento_Theme/layouts.xml` inside the theme directory**

Custom page layouts must be declared in `layouts.xml` for Magento to load and offer them. The correct path:

```
app/design/frontend/<Vendor>/<theme>/Magento_Theme/layouts.xml
```

```xml
<!-- Magento_Theme/layouts.xml -->
<page_layouts xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:noNamespaceSchemaLocation="urn:magento:framework:View/PageLayout/etc/layouts.xsd">
    <layout id="full-width-promo">
        <label translate="true">Full Width Promo</label>
    </layout>
</page_layouts>
```

Without this registration, the page layout file exists but is never discovered — it won't appear in the dropdown in Admin or be available for use in layout XML.

---

**Q9. Answer: B — Merges all instructions from the named handle into the current page**

`<update handle="customer_account"/>` is an **include mechanism**. It tells Magento to also load and merge all layout XML instructions defined under the `customer_account` handle into the current page being processed. It's like an `@include` for layout handles — a reuse pattern.

This is commonly used to share layout fragments (e.g., a sidebar, a set of blocks) across multiple pages without duplicating the XML.

**Why A is wrong:** `<update>` does not create handles — they exist from module layout files. **Why C is wrong:** It has nothing to do with authentication state.

---

**Q10. Answer: C — `$block->escapeHtmlAttr($cssClass)`**

Each context requires a specific escape method:

| Output Context | Correct Method |
|---------------|---------------|
| HTML content between tags | `escapeHtml($value)` |
| HTML attribute value | `escapeHtmlAttr($value)` |
| `href` / `src` URL values | `escapeUrl($value)` |
| JavaScript string values | `escapeJs($value)` |
| CSS property values | `escapeCss($value)` |

**Why A is wrong:** `escapeHtml()` is for between-tag content. Inside an attribute value, characters like `"` would need different encoding — `escapeHtmlAttr()` handles this correctly by encoding `"` as `&quot;`.

---

## Section 3 — Styles

---

**Q11. Answer: B — `@screen__m`**

Magento's LESS breakpoint variables follow the `@screen__<size>` naming convention using double underscores:

| Variable | Value | Breakpoint |
|----------|-------|-----------|
| `@screen__xxs` | 320px | Extra-extra small |
| `@screen__xs` | 480px | Extra small |
| `@screen__s` | 640px | Small |
| `@screen__m` | 768px | **Tablet** |
| `@screen__l` | 1024px | Desktop |
| `@screen__xl` | 1440px | Extra large |

These are defined in `lib/web/css/source/lib/variables/_responsive.less`.

---

**Q12. Answer: B — Mobile-first base stylesheet vs desktop-only additions**

`styles-m.less` and `styles-l.less` implement a **mobile-first** approach:

- **`styles-m.less`** (`m` = mobile/medium) — compiled into `styles-m.css`. This is the **base stylesheet** that applies to ALL screen sizes. Mobile-first means you write base styles for small screens, then use `min-width` media queries to progressively enhance for larger screens.
- **`styles-l.less`** (`l` = large/desktop) — compiled into `styles-l.css`. This contains **only desktop-specific additions**. It is NOT a full stylesheet — it only adds/overrides what differs on large screens.

Answer A is wrong because `styles-m.less` applies to all screens (not just mobile); `styles-l.less` only adds desktop overrides (not a standalone full stylesheet).

---

**Q13. Answer: C — `Magento_Navigation/web/css/source/_extend.less` inside the theme**

The `_extend.less` file at the **module level** within a theme is the **intended customization point** for module-specific styles. To override `Magento_Navigation` module styles:

```
app/design/frontend/Vendor/mytheme/
  Magento_Navigation/
    web/
      css/
        source/
          _extend.less   ← place your overrides here
```

**Why A is wrong:** `web/css/source/_extend.less` at the theme root is for **global** additions, not module-specific overrides.

**Why B is wrong:** `_module.less` inside a theme would completely replace the module's own `_module.less`. `_extend.less` is the designed override point — it's imported after `_module.less`, so your styles override without replacing everything.

---

**Q14. Answers: A and C**

**A is correct:** In developer mode, LESS is compiled **server-side using PHP** (via `less.php` / `Oyejorge\Less\Parser`). The client-side `less.js` browser compiler is a separate option that must be explicitly enabled in Admin > Stores > Configuration > Advanced > Developer > Front-end Development Workflow > Workflow type = "Client side less compilation". It does NOT activate automatically with developer mode.

**C is correct:** `grunt watch` monitors LESS source files for changes and automatically triggers LESS recompilation — this is the standard developer workflow with Grunt.

**Why B is wrong:** `less.js` is NOT the default in developer mode. It requires explicit configuration.

**Why D is wrong:** In developer mode, static content is generated on-the-fly on first request — running `setup:static-content:deploy` is NOT required (and in fact, developer mode bypasses it).

---

## Section 4 — JavaScript

---

**Q15. Answer: B — `_create()` once; `_init()` on create and every re-call**

This lifecycle distinction is frequently tested:

| Method | When It Runs | Use For |
|--------|-------------|---------|
| `_create()` | **Once**, on first `$(el).myWidget()` call | DOM setup, element caching, event binding |
| `_init()` | On creation AND every subsequent re-call | Applying initial state, opening/closing based on options |
| `destroy()` | When `$(el).myWidget('destroy')` called | Cleanup, remove DOM changes |

The key insight: if you call `$(el).myWidget()` a second time on an already-initialized element, `_create()` does NOT run again — only `_init()` runs.

---

**Q16. Answer: B — `$(el).promoSlider()`**

The `$.widget('mage.promoSlider', {...})` declaration:
- Creates a jQuery plugin named after the **widget name part only** (after the dot)
- The namespace (`mage`) is used for event namespacing internally, not for calling

```javascript
// Invocation
$('#my-slider').promoSlider();               // no options
$('#my-slider').promoSlider({ speed: 500 }); // with options
$('#my-slider').promoSlider('open');          // call public method
```

For Magento's built-in widgets: `$(el).accordion()`, `$(el).tabs()`, `$(el).modal()`, etc. — all drop the `mage.` namespace when invoked.

---

**Q17. Answer: B — `this._on()` auto-unbinds on destroy**

`this._on()` is a widget-managed event binding method. The key advantage: all events registered via `_on()` are **automatically unbound** when `$(el).myWidget('destroy')` is called. This prevents memory leaks and dangling event handlers.

```javascript
_create: function() {
    // Events bound with _on() are automatically cleaned up on destroy()
    this._on(this.element, {
        'click .btn': '_handleClick',
        'keydown': '_handleKeydown'
    });
}
```

With `$(el).on()`, you'd need to manually call `.off()` in your `destroy()` method. Forgetting to do so causes memory leaks, especially in single-page-app patterns.

---

**Q18. Answer: B — `shim`**

`shim` is specifically designed for **non-AMD legacy scripts** that don't use `define()`. It lets you tell RequireJS:
1. What dependencies to load before this script
2. What global variable the script exports (so RequireJS can use it as a module value)

```javascript
var config = {
    shim: {
        'legacy-carousel': {
            deps: ['jquery'],         // load jQuery first
            exports: 'CarouselLib'    // global variable to expose as module
        }
    }
};
```

Without `shim`, RequireJS would try to load the script as if it were AMD and fail silently. `shim` bridges old-style global scripts into the AMD module system.

---

**Q19. Answer: C — `cartItems.push('item3')`**

With `ko.observableArray`, you must call array mutation methods **directly on the observable** (not on the unwrapped native array):

```javascript
// CORRECT — triggers KO reactivity
cartItems.push('item3');
cartItems.remove('item1');
cartItems.splice(0, 1);

// WRONG — modifies native array, KO does NOT detect the change
cartItems().push('item3');
```

When you call `cartItems()` (with parentheses), you get the **underlying native array** — mutations on it bypass KO's change detection entirely, so the UI doesn't update. Always call mutation methods on the observable itself.

---

**Q20. Answer: B — Automatically re-evaluates when any read observable changes**

`ko.computed` creates a **derived value** that recalculates automatically. KO tracks which observables were read during the function's execution and subscribes to all of them. Whenever any of those observables change, the computed re-runs.

```javascript
var firstName = ko.observable('John');
var lastName = ko.observable('Doe');

var fullName = ko.computed(function() {
    return firstName() + ' ' + lastName();  // tracks firstName and lastName
});

// fullName() === 'John Doe'
lastName('Smith');
// fullName() === 'John Smith'  (automatically updated)
```

This is fundamentally different from a regular variable — there's no manual update needed.

---

**Q21. Answer: B — `$parent.removeItem`**

Inside a `foreach` binding, the **binding context changes** to each individual array item. To access the parent ViewModel:

| Context Variable | Refers To |
|----------------|----------|
| `$data` | The current item in the foreach |
| `$index` | Zero-based index (observable) |
| `$parent` | The **immediate parent** binding context |
| `$root` | The top-level root ViewModel |
| `$parents[n]` | Nth ancestor context |

```html
<ul data-bind="foreach: cartItems">
    <li>
        <span data-bind="text: name"></span>
        <!-- $parent = the ViewModel that owns cartItems -->
        <button data-bind="click: $parent.removeItem">Remove</button>
    </li>
</ul>
```

`$parent` and `$root` both work when there's only one level of nesting. The exam question specifically asks for **immediate parent** → `$parent` is the precise answer.

---

**Q22. Answer: B — Initializes globally with no specific DOM element context**

In `x-magento-init`, the outer key is a CSS selector that targets elements. The special `"*"` key means **no element** — the component initializes globally without being bound to any DOM element. This is the pattern for modules that need to run on page load but don't operate on a specific element (analytics, global state management, etc.):

```html
<script type="text/x-magento-init">
{
    "*": {
        "Vendor_Module/js/page-tracker": { "pageType": "product" }
    }
}
</script>
```

The component receives `config` but no `element` parameter.

---

**Q23. Answer: A — `define()` for modules; `require()` for one-time execution**

| | `define()` | `require()` |
|--|-----------|------------|
| Purpose | Declares a reusable module | Runs code once (side-effect) |
| Returns | A value (object/function/class) that other modules can use | Nothing (void) |
| Used in | `.js` module files | Entry points, one-time init |
| Other modules depend on it? | Yes | No |

```javascript
// define() — a reusable module
define(['jquery'], function($) {
    return { init: function(el) { $(el).hide(); } };
});

// require() — one-time execution, not a module
require(['jquery', 'my-module'], function($, myModule) {
    myModule.init('#target');
});
```

Both are async (loads files without blocking). Answer B is wrong — both are asynchronous.

---

**Q24. Answer: B — Set the mixin's value to `false` in `config.config.mixins`**

The mixin value (`true`/`false`) is a deliberate design choice in the mixin system. Setting it to `false` disables the mixin:

```javascript
// Your theme's requirejs-config.js
var config = {
    config: {
        mixins: {
            'Magento_Checkout/js/view/minicart': {
                'ThirdParty_Module/js/minicart-mixin': false  // disabled
            }
        }
    }
};
```

This is the **clean, official** way to disable a third-party mixin. It works because the mixin system checks the boolean value before applying.

**Why A is wrong:** You cannot delete files from a vendor module directory — it would be overwritten by the next Composer install.

**Why C is wrong:** There is no `config.exclude` key in `requirejs-config.js`.

---

**Q25. Answers: A and B**

**A is correct:** `text` binding HTML-escapes output (safe from XSS). `html` renders raw HTML — anything in the observable is inserted directly into the DOM, including tags and scripts.

**B is correct:** `value` is the two-way binding for form elements — it reads from AND writes to the observable as the user types.

**Why C is wrong:** `attr` binding sets **HTML attributes** (href, src, title, etc.) using an object literal: `data-bind="attr: { href: url, title: label }"`. CSS class names are managed by the `css` binding.

**Why D is wrong:** `css` binding adds/removes **CSS classes** based on conditions: `data-bind="css: { 'is-active': isActive, 'has-error': hasError }"`. It does NOT set attribute values.

---

## Section 5 — Admin, Page Builder & Optimizations

---

**Q26. Answer: C — `grunt watch`**

`grunt watch` monitors LESS source files for changes and automatically triggers `grunt less` recompilation whenever a file is saved. This is the standard development loop:

```bash
# Initial setup (once)
cp package.json.sample package.json
cp Gruntfile.js.sample Gruntfile.js
npm install

# Development workflow
grunt watch    # runs in the background; recompiles on every LESS file save
```

`grunt less` compiles once and exits. `grunt exec` runs a shell command task. Only `grunt watch` provides the continuous file-watching behavior.

---

**Q27. Answer: B — Structured tables in Word/Google Docs rendered by JavaScript**

Edge Delivery Services (EDS) uses the **Franklin/Helix document-based authoring model**:

1. Content authors write content in **Microsoft Word or Google Docs**
2. Blocks are created as **tables** — the table name in the first row becomes the block name
3. EDS syncs the document to a Git repository as Markdown
4. On the frontend, a lightweight JavaScript framework reads the Markdown/HTML and calls a **matching JS function** (e.g., `blocks/hero/hero.js`) to "decorate" the block's DOM

This is completely different from traditional Magento theme development — there are no PHP classes, no Knockout components, no deployment pipelines.

---

**Q28. Answers: A and C**

Both settings live under **Admin > Stores > Configuration > Advanced > Developer**:

- **CSS Settings → Merge CSS Files** (A): Combines multiple CSS files into one request, reducing HTTP round-trips
- **JavaScript Settings → Merge JavaScript Files** (C): Combines multiple JS files into one request

Additional related settings (not asked but good to know):
- Minify CSS Files / Minify JavaScript Files / Enable JavaScript Bundling
- Minify HTML (Template Settings)

**Why B is wrong:** "Page Builder Stage Caching" is not a real Admin setting.

**Why D is wrong:** "Compile LESS on Save" / "LESS Settings" is not a real Admin configuration section — LESS compilation is handled by Grunt (dev) or `setup:static-content:deploy` (production), not configured in Admin.

---

**Q29. Answer: C — `menu_section`**

In a Page Builder content type XML configuration, `menu_section` controls which panel group the type appears in:

```xml
<type name="my_quote"
      label="Quote Block"
      menu_section="elements"   ← this attribute
      ...>
```

Valid `menu_section` values:

| Value | Panel Group |
|-------|-------------|
| `layout` | Layout (Row, Column, Tabs) |
| `elements` | Elements (Text, Heading, Buttons, Divider, HTML Code) |
| `media` | Media (Image, Video, Slider, Map) |
| `add_content` | Add Content (Block, Dynamic Block, Products, Banner) |

---

**Q30. Answers: A and C**

The Admin UI SDK provides **declarative extension points** for React-based micro-frontends. Confirmed valid extension points include:

- **Menu** (A): Add custom items to the Admin navigation menu
- **Mass Actions** (C): Add custom items to grid mass action dropdowns
- **Banners**: Add notification banners to the Admin header
- **Page/Column Actions**: Add custom action buttons to grid rows

**Why B is wrong:** Injecting PHP block output into grid columns is a traditional Magento approach — it requires PHP plugins and XML, not the Admin UI SDK.

**Why D is wrong:** The Admin UI SDK is React-based and runs via Adobe I/O Runtime. Registering Knockout.js widgets via `adminhtml` layout XML is the old approach — the Admin UI SDK explicitly replaces this pattern for out-of-process extensions.

---

## Score Summary

| Section | Questions | Points |
|---------|-----------|--------|
| 1. Theme Management | Q1–Q3 | 3 |
| 2. Layout XML & Templates | Q4–Q10 | 7 |
| 3. Styles | Q11–Q14 | 4 |
| 4. JavaScript | Q15–Q25 | 11 |
| 5. Admin & Optimization | Q26–Q30 | 5 |
| **Total** | **30** | **30** |

**Select-2 questions (all-or-nothing):** Q7, Q14, Q25, Q28, Q30

---

*Friday is yours. Go get it! 🎯*
