# Day 17 — Page Builder Customization & Admin UI SDK

## Table of Contents
- [1. Overview](#1-overview)
- [2. Page Builder Fundamentals](#2-page-builder-fundamentals)
  - [2.1 What Is Page Builder?](#21-what-is-page-builder)
  - [2.2 Page Builder Architecture at a Glance](#22-page-builder-architecture-at-a-glance)
  - [2.3 Content Types — The Core Building Block](#23-content-types---the-core-building-block)
  - [2.4 The Four Files Every Content Type Needs](#24-the-four-files-every-content-type-needs)
  - [2.5 XML Configuration Deep Dive](#25-xml-configuration-deep-dive)
  - [2.6 Templates: Preview vs Master](#26-templates-preview-vs-master)
  - [2.7 JavaScript Component (ViewModel)](#27-javascript-component-viewmodel)
  - [2.8 Stage, Panel, and Data Store](#28-stage-panel-and-data-store)
- [3. Built-In Content Types Reference](#3-built-in-content-types-reference)
- [4. Creating a Custom Content Type (Overview)](#4-creating-a-custom-content-type-overview)
  - [4.1 Module Setup](#41-module-setup)
  - [4.2 Registering the Content Type](#42-registering-the-content-type)
  - [4.3 The Form Config (UI Component)](#43-the-form-config-ui-component)
  - [4.4 Preview Template](#44-preview-template)
  - [4.5 Master Template](#45-master-template)
  - [4.6 JavaScript Preview Component](#46-javascript-preview-component)
- [5. Extending Existing Content Types](#5-extending-existing-content-types)
  - [5.1 Adding a New Attribute to an Existing Type](#51-adding-a-new-attribute-to-an-existing-type)
  - [5.2 Overriding Templates](#52-overriding-templates)
  - [5.3 Extending the JS Component](#53-extending-the-js-component)
- [6. Page Builder Data Flow Summary](#6-page-builder-data-flow-summary)
- [7. Admin UI SDK](#7-admin-ui-sdk)
  - [7.1 What Is the Admin UI SDK?](#71-what-is-the-admin-ui-sdk)
  - [7.2 Traditional PHP Admin vs Admin UI SDK](#72-traditional-php-admin-vs-admin-ui-sdk)
  - [7.3 How the Admin UI SDK Works — Architecture](#73-how-the-admin-ui-sdk-works---architecture)
  - [7.4 Extension Points Reference](#74-extension-points-reference)
  - [7.5 Declaring Extensions — app.config.yaml](#75-declaring-extensions---appconfigyaml)
  - [7.6 Menu Extension Point](#76-menu-extension-point)
  - [7.7 Page/Mass Action Column Extension](#77-pagemass-action-column-extension)
  - [7.8 Banner Extension Point](#78-banner-extension-point)
  - [7.9 When to Use Admin UI SDK vs Traditional Admin](#79-when-to-use-admin-ui-sdk-vs-traditional-admin)
- [8. Hands-On Exploration Guide](#8-hands-on-exploration-guide)
  - [8.1 Exploring Page Builder in Your EE Instance](#81-exploring-page-builder-in-your-ee-instance)
  - [8.2 Inspecting Page Builder HTML Output](#82-inspecting-page-builder-html-output)
  - [8.3 Finding Page Builder Files in the Codebase](#83-finding-page-builder-files-in-the-codebase)
- [9. Exam Angle Synthesis](#9-exam-angle-synthesis)
- [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Overview

Day 17 covers two modern extension mechanisms that sit at opposite ends of the Magento/Commerce stack:

| Topic | Layer | EE Required? | Technology |
|---|---|---|---|
| Page Builder | Frontend / Content | **Yes (EE only)** | XML + Knockout.js + PHP |
| Admin UI SDK | Admin UI | **Yes (App Builder)** | React + Adobe I/O Runtime |

Both topics appear on the Adobe Commerce Developer Professional / Expert exams and share a common theme: **declarative extension over core modification**.

---

## 2. Page Builder Fundamentals

### 2.1 What Is Page Builder?

Page Builder is Adobe Commerce's **drag-and-drop content editing experience** built into the Admin panel. It is:

- **Enterprise Edition (EE) only** — not present in Magento Open Source
- Available on CMS Pages, CMS Blocks, Category descriptions, and Product descriptions
- Built on top of **Knockout.js** for the Admin preview stage
- Stores content as **annotated HTML** in the database (not JSON, not a separate table)

> **Key mental model:** Page Builder is a *visual editor* that writes structured HTML with `data-content-type` attributes to a standard `text/html` database column. The frontend reads that HTML directly — there is no separate rendering engine on the storefront.

**Exam focus:**
- Page Builder is **EE only**
- Content is stored as **annotated HTML**, not a separate data structure
- It uses **Knockout.js** on the Admin stage (preview), not React or Vue

---

### 2.2 Page Builder Architecture at a Glance

```
+--------------------------------------------------+
|                  ADMIN BROWSER                   |
|  +--------------------------------------------+  |
|  |          Page Builder Stage (KO.js)        |  |
|  |  +----------+  +----------+  +----------+  |  |
|  |  | Content  |  | Content  |  | Content  |  |  |
|  |  |  Type    |  |  Type    |  |  Type    |  |  |
|  |  | (Preview |  | (Preview |  | (Preview |  |  |
|  |  | Template)|  | Template)|  | Template)|  |  |
|  |  +----------+  +----------+  +----------+  |  |
|  +--------------------------------------------+  |
|                   SAVE                            |
+--------------------------------------------------+
            |
            | Serializes to annotated HTML
            v
+--------------------------------------------------+
|                   DATABASE                       |
|   cms_block.content = "<div data-content-type=   |
|   "row" ...><div data-content-type="text"...>    |
+--------------------------------------------------+
            |
            | Direct HTML output (+ inline styles)
            v
+--------------------------------------------------+
|               STOREFRONT BROWSER                 |
|   Renders the HTML as-is (no JS engine needed)   |
+--------------------------------------------------+
```

---

### 2.3 Content Types — The Core Building Block

Everything you see in the Page Builder panel is a **content type**. Think of a content type as a plugin/widget that knows:

1. How to **display itself** in the Admin preview (Knockout template)
2. How to **render itself** on the storefront (master/HTML template)
3. What **configuration options** to expose in its edit form (UI Component XML)
4. How to **read/write** its own data from the annotated HTML

**Built-in examples:** Row, Column, Tabs, Text, Heading, Buttons, Divider, HTML Code, Image, Video, Slider, Map, Products, Block, Dynamic Block, Banner

**Exam focus:**
- A **content type** is the atomic unit of Page Builder customization
- Each content type has **two templates**: preview (admin) and master (storefront)
- Content types are registered via **XML configuration** (`content_types.xml`)

---

### 2.4 The Four Files Every Content Type Needs

| File | Purpose | Location Pattern |
|---|---|---|
| `content_types.xml` | Registers the type with Page Builder | `view/adminhtml/pagebuilder/` |
| `preview.html` | Knockout template shown in Admin stage | `view/adminhtml/web/template/content-type/<name>/` |
| `master.html` | HTML template output to storefront | `view/adminhtml/web/template/content-type/<name>/` |
| `preview.js` | Knockout ViewModel for the Admin stage | `view/adminhtml/web/js/content-type/<name>/` |

> There is also an **edit form** (`ui_component` XML) for the configuration panel that opens when an editor clicks the content type's settings icon.

**Exam focus:**
- Know these **four file types** and their responsibilities
- The master template is what gets **serialized to the database**
- Preview template is **only used in Admin**

---

### 2.5 XML Configuration Deep Dive

The `content_types.xml` file is the **declaration manifest** for a content type.

```xml
<!-- view/adminhtml/pagebuilder/content_types.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_PageBuilder:etc/content_types.xsd">

    <type name="my_quote"
          label="Quote Block"
          component="Vendor_Module/js/content-type/my-quote/preview"
          preview_component="Vendor_Module/js/content-type/my-quote/preview"
          master_component="Magento_PageBuilder/js/content-type/master"
          form="Vendor_Module/form/element/my-quote"
          menu_section="elements"
          icon="Vendor_Module::css/images/content-type/my-quote/icon.svg"
          sortOrder="40"
          translate="label">

        <!-- Which content types are allowed inside this one -->
        <children default_policy="deny"/>

        <!-- Which parent types can contain this -->
        <parents default_policy="deny">
            <parent name="column"/>
            <parent name="row"/>
        </parents>

        <!-- Data mapping: how HTML attributes/data map to form fields -->
        <appearances>
            <appearance name="default"
                        default="true"
                        preview_template="Vendor_Module/content-type/my-quote/default/preview"
                        master_template="Vendor_Module/content-type/my-quote/default/master"
                        reader="Magento_PageBuilder/js/master-format/read/configurable">

                <elements>
                    <!-- Map a CSS class to a form field -->
                    <element name="main">
                        <style name="text_align" source="text_align"/>
                        <style name="border" source="border"/>
                        <attribute name="data-pb-style" source="data-pb-style"/>
                        <css name="css_classes"/>
                    </element>
                </elements>
            </appearance>
        </appearances>
    </type>
</config>
```

**Key XML nodes explained:**

| Node/Attribute | Meaning |
|---|---|
| `type name` | Unique identifier used in `data-content-type` HTML attribute |
| `component` | RequireJS path to the Knockout ViewModel JS file |
| `form` | UI Component form shown in the settings panel |
| `menu_section` | Which panel group the type appears in |
| `appearances` | One type can have multiple visual appearances |
| `appearance > elements` | Maps DOM elements to data fields (CSS, attributes, HTML) |
| `parents / children` | Nesting rules — what can contain this type and vice versa |

**Exam focus:**
- `appearances` is how Page Builder knows **which template to use** and **how to read/write data**
- The `elements` mapping is the bridge between **form fields and the HTML output**
- `parents`/`children` control **nesting rules** in the stage

---

### 2.6 Templates: Preview vs Master

#### Preview Template (Admin Stage)

Uses **Knockout.js bindings**. This is what the content editor sees while editing.

```html
<!-- view/adminhtml/web/template/content-type/my-quote/default/preview.html -->
<div class="pagebuilder-content-type" attr="data.main.attributes"
     ko-style="data.main.style" css="data.main.css">

    <!-- Toolbar shown on hover in the stage -->
    <render args="getOptions().template"/>

    <!-- Editable content area -->
    <blockquote class="my-quote-preview"
                attr="data.quote.attributes"
                ko-style="data.quote.style">
        <p data-bind="html: data.quote.html"></p>
        <cite data-bind="html: data.author.html"></cite>
    </blockquote>
</div>
```

> **Important:** Knockout bindings like `data-bind`, `ko-style`, `attr` are only evaluated in the Admin. The storefront sees plain HTML.

#### Master Template (Storefront Output)

Plain HTML with **no Knockout bindings**. This is what gets saved to the database and rendered on the storefront.

```html
<!-- view/adminhtml/web/template/content-type/my-quote/default/master.html -->
<div attr="data.main.attributes" ko-style="data.main.style" css="data.main.css">
    <blockquote class="my-quote"
                attr="data.quote.attributes"
                ko-style="data.quote.style">
        <p data-bind="html: data.quote.html"></p>
        <cite data-bind="html: data.author.html"></cite>
    </blockquote>
</div>
```

> Wait — why does the master template still have `data-bind`? The master template is **processed by Knockout once during save** to produce the final static HTML. The Knockout expressions resolve to static values before being written to the database.

**Exam focus:**
- **Preview template** = Knockout-powered, Admin only
- **Master template** = processed once on save → static HTML in DB
- The storefront **does not run Knockout** to render Page Builder content

---

### 2.7 JavaScript Component (ViewModel)

The JS component provides the **Knockout ViewModel** for the preview template. It extends the base Page Builder preview component.

```javascript
// view/adminhtml/web/js/content-type/my-quote/preview.js
define([
    'Magento_PageBuilder/js/content-type/preview'  // Base preview class
], function (PreviewBase) {
    'use strict';

    /**
     * @param {Object} parent - Parent content type
     * @param {Object} config - Content type config from XML
     * @param {Object} stageId - Stage identifier
     */
    function Preview(parent, config, stageId) {
        PreviewBase.call(this, parent, config, stageId);
    }

    Preview.prototype = Object.create(PreviewBase.prototype);
    Preview.prototype.constructor = Preview;

    /**
     * Custom method available in preview template via $preview.myMethod()
     */
    Preview.prototype.myCustomMethod = function () {
        // Access content type data
        var data = this.contentType.dataStore.get();
        console.log('Current data:', data);
    };

    return Preview;
});
```

> Modern implementations use ES6 classes or TypeScript. The pattern above is the classic AMD/RequireJS style used in Magento's Knockout stack.

**Exam focus:**
- The preview JS component **extends** `Magento_PageBuilder/js/content-type/preview`
- It provides methods callable from the **preview template** via `$preview.methodName()`
- It is **not** used on the storefront

---

### 2.8 Stage, Panel, and Data Store

Understanding these three concepts helps you know *where* data lives at each step:

```
+------------------+        +------------------+        +------------------+
|      PANEL       |        |      STAGE       |        |    DATA STORE    |
|                  |        |                  |        |                  |
| List of available|  drag  | Visual canvas    | syncs  | KO Observable    |
| content types    |------->| showing preview  |<------>| object holding   |
| (left sidebar)   |        | templates        |        | all field values |
+------------------+        +------------------+        +------------------+
                                    |
                                    | on Save
                                    v
                            +------------------+
                            |   MASTER FORMAT  |
                            | (annotated HTML) |
                            +------------------+
```

- **Panel**: The left sidebar showing draggable content type icons
- **Stage**: The central canvas where content is arranged
- **Data Store**: Per-content-type observable data store — form fields write here, templates read from here
- **Master Format**: The serialization format (annotated HTML) written to the DB on save

---

## 3. Built-In Content Types Reference

Knowing the built-in types helps you understand what you're extending or building alongside.

| Content Type | `name` in XML | Category |
|---|---|---|
| Row | `row` | Layout |
| Column Group | `column-group` | Layout |
| Column | `column` | Layout |
| Tabs | `tabs` | Layout |
| Tab Item | `tab-item` | Layout |
| Text | `text` | Elements |
| Heading | `heading` | Elements |
| Buttons | `buttons` | Elements |
| Button Item | `button-item` | Elements |
| Divider | `divider` | Elements |
| HTML Code | `html` | Elements |
| Image | `image` | Media |
| Video | `video` | Media |
| Slider | `slider` | Media |
| Map | `map` | Media |
| Products | `products` | Add Content |
| Block | `block` | Add Content |
| Dynamic Block | `dynamic_block` | Add Content (EE) |
| Banner | `banner` | Media (deprecated → use Slider) |

---

## 4. Creating a Custom Content Type (Overview)

### 4.1 Module Setup

```bash
# Your module should depend on Magento_PageBuilder
# composer.json or module.xml
```

```xml
<!-- etc/module.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="Vendor_PageBuilderQuote">
        <sequence>
            <module name="Magento_PageBuilder"/>
        </sequence>
    </module>
</config>
```

**Exam focus:**
- Your module **must declare `Magento_PageBuilder` as a sequence dependency**
- This ensures Page Builder loads before your extension

---

### 4.2 Registering the Content Type

```xml
<!-- view/adminhtml/pagebuilder/content_types.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_PageBuilder:etc/content_types.xsd">
    <type name="quote_block"
          label="Quote"
          component="Vendor_PageBuilderQuote/js/content-type/quote-block/preview"
          preview_component="Vendor_PageBuilderQuote/js/content-type/quote-block/preview"
          master_component="Magento_PageBuilder/js/content-type/master"
          form="Vendor_PageBuilderQuote/form/element/quote-block"
          menu_section="elements"
          icon="Vendor_PageBuilderQuote::css/images/content-type/quote-block/icon.svg"
          sortOrder="50"
          translate="label">
        <parents default_policy="deny">
            <parent name="column"/>
            <parent name="row"/>
        </parents>
        <children default_policy="deny"/>
        <appearances>
            <appearance name="default"
                        default="true"
                        preview_template="Vendor_PageBuilderQuote/content-type/quote-block/default/preview"
                        master_template="Vendor_PageBuilderQuote/content-type/quote-block/default/master"
                        reader="Magento_PageBuilder/js/master-format/read/configurable">
                <elements>
                    <element name="main">
                        <style name="text_align" source="text_align"/>
                        <style name="border" source="border"/>
                        <style name="border_color" source="border_color"/>
                        <style name="border_width" source="border_width"/>
                        <style name="border_radius" source="border_radius"/>
                        <css name="css_classes"/>
                    </element>
                    <element name="quote">
                        <html name="quote_text" converter="Magento_PageBuilder/js/converter/html/tag-escaper"/>
                    </element>
                    <element name="author">
                        <html name="author_name" converter="Magento_PageBuilder/js/converter/html/tag-escaper"/>
                    </element>
                </elements>
            </appearance>
        </appearances>
    </type>
</config>
```

---

### 4.3 The Form Config (UI Component)

The edit form that pops up when the editor clicks the gear icon. Standard UI Component XML.

```xml
<!-- view/adminhtml/ui_component/quote_block_form.xml -->
<?xml version="1.0"?>
<form xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Ui:etc/ui_configuration.xsd">
    <argument name="data" xsi:type="array">
        <item name="js_config" xsi:type="array">
            <item name="provider" xsi:type="string">
                quote_block_form.quote_block_form_data_source
            </item>
        </item>
    </argument>
    <settings>
        <namespace>quote_block_form</namespace>
        <deps>
            <dep>quote_block_form.quote_block_form_data_source</dep>
        </deps>
    </settings>
    <!-- Standard fieldset with fields for quote_text, author_name, etc. -->
    <fieldset name="appearance_fieldset"
              component="Magento_PageBuilder/js/form/element/dependent-fieldset">
        <settings>
            <label translate="true">Appearance</label>
        </settings>
        <!-- appearance selector field goes here -->
    </fieldset>
    <fieldset name="general">
        <settings>
            <label/>
        </settings>
        <field name="quote_text" formElement="textarea">
            <settings>
                <label translate="true">Quote Text</label>
            </settings>
        </field>
        <field name="author_name" formElement="input">
            <settings>
                <label translate="true">Author Name</label>
            </settings>
        </field>
    </fieldset>
</form>
```

---

### 4.4 Preview Template

```html
<!-- view/adminhtml/web/template/content-type/quote-block/default/preview.html -->
<div class="pagebuilder-content-type"
     attr="data.main.attributes"
     ko-style="data.main.style"
     css="data.main.css"
     event="{mouseover: function() {$preview.onMouseOver($event);},
              mouseout: function() {$preview.onMouseOut($event);}}">

    <!-- Standard Page Builder options menu (edit, move, duplicate, remove) -->
    <render args="getOptions().template"/>

    <blockquote class="quote-block-preview">
        <p data-bind="html: data.quote.html"></p>
        <footer>
            <cite data-bind="html: data.author.html"></cite>
        </footer>
    </blockquote>
</div>
```

---

### 4.5 Master Template

```html
<!-- view/adminhtml/web/template/content-type/quote-block/default/master.html -->
<div attr="data.main.attributes"
     ko-style="data.main.style"
     css="data.main.css">
    <blockquote class="quote-block">
        <p data-bind="html: data.quote.html"></p>
        <footer>
            <cite data-bind="html: data.author.html"></cite>
        </footer>
    </blockquote>
</div>
```

---

### 4.6 JavaScript Preview Component

```javascript
// view/adminhtml/web/js/content-type/quote-block/preview.js
define([
    'jquery',
    'Magento_PageBuilder/js/content-type/preview',
    'Magento_PageBuilder/js/events'
], function ($, PreviewBase, events) {
    'use strict';

    var Preview = function (contentType, config, stageId) {
        PreviewBase.call(this, contentType, config, stageId);
    };

    Preview.prototype = Object.create(PreviewBase.prototype);
    Preview.prototype.constructor = Preview;

    /**
     * Called after the content type is rendered in the stage.
     * @param {HTMLElement} element
     */
    Preview.prototype.afterRender = function (element) {
        // Initialize any jQuery plugins, etc.
        PreviewBase.prototype.afterRender.call(this, element);
    };

    return Preview;
});
```

**Exam focus:**
- Custom content types **do not require a custom master component** — you can reuse `Magento_PageBuilder/js/content-type/master`
- You almost always need a **custom preview component** to handle stage interactions
- The file location convention: `view/adminhtml/web/js/content-type/<type-name>/preview.js`

---

## 5. Extending Existing Content Types

### 5.1 Adding a New Attribute to an Existing Type

You extend an existing content type via `content_types.xml` **merge** — Magento's XML merging applies your additions on top of the core config.

```xml
<!-- view/adminhtml/pagebuilder/content_types.xml in YOUR module -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_PageBuilder:etc/content_types.xsd">

    <!-- Reference the existing 'heading' content type by name -->
    <type name="heading">
        <appearances>
            <appearance name="default">
                <elements>
                    <element name="main">
                        <!-- Add a new custom data attribute -->
                        <attribute name="data-custom-id" source="custom_id"/>
                    </element>
                </elements>
            </appearance>
        </appearances>
    </type>
</config>
```

> This works because `content_types.xml` is **merged** across modules, just like `di.xml` or `config.xml`.

**Exam focus:**
- Extending existing types uses **XML merge** — reference the type by name in your module's `content_types.xml`
- You do NOT need to copy/fork the entire config — only declare **what you're changing**

---

### 5.2 Overriding Templates

To change the visual appearance of an existing content type:

```xml
<!-- In your content_types.xml extension -->
<type name="heading">
    <appearances>
        <appearance name="default"
                    preview_template="Vendor_Module/content-type/heading/default/preview"
                    master_template="Vendor_Module/content-type/heading/default/master">
        </appearance>
    </appearances>
</type>
```

Then create your custom template files at those paths. This is similar to theme template overriding but within the Page Builder context.

---

### 5.3 Extending the JS Component

```javascript
// Extend the native heading preview component
define([
    'Magento_PageBuilder/js/content-type/heading/preview'  // Core heading preview
], function (HeadingPreview) {
    'use strict';

    var CustomHeadingPreview = function (contentType, config, stageId) {
        HeadingPreview.call(this, contentType, config, stageId);
    };

    CustomHeadingPreview.prototype = Object.create(HeadingPreview.prototype);
    CustomHeadingPreview.prototype.constructor = CustomHeadingPreview;

    // Override or add methods
    CustomHeadingPreview.prototype.afterRender = function (element) {
        HeadingPreview.prototype.afterRender.call(this, element);
        // Your custom logic here
    };

    return CustomHeadingPreview;
});
```

Then wire this up in your `content_types.xml` by setting `preview_component` to your new path.

```xml
<type name="heading"
      preview_component="Vendor_Module/js/content-type/heading/preview">
</type>
```

**Exam focus:**
- To extend a JS component, **inherit from the existing component**, don't replace it entirely
- Wire the extension by setting `preview_component` in your `content_types.xml` declaration

---

## 6. Page Builder Data Flow Summary

```
EDITOR INTERACTION
      |
      | drags content type onto stage
      v
+---------------------+
|   Panel -> Stage    |
|  content type       |
|  instantiated       |
+---------------------+
      |
      | editor opens settings (gear icon)
      v
+---------------------+
|   UI Component Form |
|   (edit panel)      |
|   Field values ->   |
|   DataStore         |
+---------------------+
      |
      | form closes, data stored
      v
+---------------------+
|   DataStore         |
|   (KO Observables)  |
|   drives preview    |
|   template update   |
+---------------------+
      |
      | editor clicks Save
      v
+---------------------+
|   Master Format     |
|   Converter runs    |
|   DataStore ->      |
|   annotated HTML    |
+---------------------+
      |
      | HTML written to DB column
      v
+---------------------+
|   Database          |
|   (cms_block.content|
|    etc.)            |
+---------------------+
      |
      | page request on storefront
      v
+---------------------+
|   Storefront        |
|   Raw HTML output   |
|   (no JS engine)    |
+---------------------+
```

**Exam focus:**
- The **converter** is the component responsible for translating between DataStore values and the HTML attribute/style representation
- Content is stored in **standard text columns** (no separate PB tables)
- On the storefront, Page Builder content is **static HTML** — no JavaScript rendering engine

---

## 7. Admin UI SDK

### 7.1 What Is the Admin UI SDK?

The **Admin UI SDK** is Adobe's modern, **App Builder-based** mechanism for extending the Commerce Admin interface **without modifying PHP**.

Key facts:
- It is part of the **Adobe Developer App Builder** ecosystem
- Extensions are built as **out-of-process** React applications hosted on Adobe I/O Runtime
- The Commerce Admin loads these extensions in **iframes** or via API calls
- Requires **Adobe Commerce** (cloud or on-prem with App Builder entitlement)

> **Analogy:** Think of it like installing a browser extension — your extension code runs separately from the browser (Commerce Admin) but can inject UI elements into it.

**Exam focus:**
- Admin UI SDK is **out-of-process** — code runs on Adobe I/O Runtime, not on the Commerce server
- Extensions are **React apps**, not PHP/PHTML
- Requires **App Builder entitlement** — not available in Magento Open Source

---

### 7.2 Traditional PHP Admin vs Admin UI SDK

This comparison is **heavily tested**:

| Aspect | Traditional PHP Admin | Admin UI SDK |
|---|---|---|
| Technology | PHP, XML, PHTML, KnockoutJS | React, JavaScript, Adobe I/O |
| Execution | **In-process** (on Commerce server) | **Out-of-process** (Adobe I/O Runtime) |
| Deployment | Module install + deploy | App Builder deploy |
| Commerce access | Direct DB / Service Layer access | Via Commerce REST/GraphQL APIs |
| Upgrade risk | High — core coupling | Low — decoupled |
| Performance impact | Shares server resources | Separate runtime |
| Use case | Deep system integration | UI extensions, dashboards |
| Available in | Open Source + Commerce | Commerce + App Builder only |
| Real-time data | Direct | Via API calls |

**Exam focus:**
- Traditional admin = **in-process PHP**; Admin UI SDK = **out-of-process React**
- Admin UI SDK has **lower upgrade risk** because it's decoupled from Commerce core
- SDK extensions access Commerce data via **REST/GraphQL APIs**, not direct DB

---

### 7.3 How the Admin UI SDK Works — Architecture

```
+---------------------------------------------------+
|            COMMERCE ADMIN (Browser)               |
|                                                   |
|  +---------------------------------------------+  |
|  |  Native Admin UI                            |  |
|  |  (PHP-rendered pages)                       |  |
|  |                                             |  |
|  |  +---------------------------------------+  |  |
|  |  |   Extension Point (e.g., menu item)   |  |  |
|  |  |   Loaded via Admin UI SDK bridge      |  |  |
|  |  +---------------------------------------+  |  |
|  |            |                               |  |
|  |            | iframe / API                  |  |
|  |            v                               |  |
|  |  +---------------------------------------+  |  |
|  |  |   App Builder App (React)             |  |  |
|  |  |   Hosted on Adobe I/O Runtime         |  |  |
|  |  +---------------------------------------+  |  |
|  +---------------------------------------------+  |
|                      |                            |
|                       | REST / GraphQL API calls  |
|                       v                           |
|  +---------------------------------------------+  |
|  |   Commerce Backend (PHP / Services)         |  |
+---------------------------------------------------+
```

---

### 7.4 Extension Points Reference

The Admin UI SDK provides these **extension point types** as of current documentation:

| Extension Point | What It Does |
|---|---|
| `menu` | Adds custom menu items to the Admin left navigation |
| `page` | Registers a full custom Admin page (iframe loaded app) |
| `massAction` | Adds custom mass actions to grid listings |
| `column` | Adds custom columns to Admin grids |
| `banner` | Adds notification banners to Admin pages |
| `modal` | Adds custom modal dialogs |
| `sharedContext` | Shares data/context between the Admin and App Builder app |

**Exam focus:**
- Know these extension point type names: **menu, page, massAction, column, banner, modal**
- `sharedContext` is how the App Builder app knows **which Commerce instance** it's talking to

---

### 7.5 Declaring Extensions — app.config.yaml

App Builder applications declare their Admin UI extensions in `app.config.yaml` (or `app.config.yml`). This is the **central config file** for the App Builder app.

```yaml
# app.config.yaml
application:
  actions:
    - src/actions

  web:
    - src/web

extensions:
  dx/excshell/1:
    $include: src/dx-excshell-1/ext.config.yaml
```

The extension configuration itself lives in the referenced file:

```yaml
# src/dx-excshell-1/ext.config.yaml
operations:
  view:
    - impl: index.html
      href: index.html

extensionPoints:
  # Admin UI SDK extension points declared here
  commerce/backend-ui/1:
    $include: src/commerce-backend-ui-1/ext.config.yaml
```

**Exam focus:**
- `extensionPoints` is the key configuration node in the App Builder extension config
- Extension points are declared **declaratively in YAML**, not programmatically in PHP

---

### 7.6 Menu Extension Point

```yaml
# Extension point config referencing menu
operations:
  menu:
    - title: "My Custom Report"
      glyph: "dataAnalytics"
      href: "https://my-app.adobeio-static.net/index.html"
      target: "_blank"
      menuId: "Vendor_Module::custom_report"
      parent: "Magento_Backend::content"
      sortOrder: 50
```

Or as JavaScript registration in the App Builder app:

```javascript
// src/web/src/components/ExtensionRegistration.js
import { register } from '@adobe/uix-guest';

const ExtensionRegistration = () => {
  useEffect(() => {
    const init = async () => {
      const guestConnection = await register({
        id: extensionId,
        methods: {
          // Declare menu items
        },
        extensionPoints: {
          'Commerce::AdminMenu': () => {
            return [
              {
                id: 'my-custom-menu-item',
                label: 'My Custom Page',
                path: '/index.html',
              },
            ];
          },
        },
      });
    };
    init().catch(console.error);
  }, []);
  return <></>;
};
```

---

### 7.7 Page/Mass Action Column Extension

#### Custom Grid Column

```javascript
// Register a custom column in an Admin grid
extensionPoints: {
  'Commerce::ProductGridColumns': () => {
    return [
      {
        id: 'custom-score-column',
        label: 'Custom Score',
        sortable: true,
        // Renderer component for the column cell
        renderer: 'src/components/CustomScoreColumnCell',
      },
    ];
  },
},
```

#### Mass Action

```javascript
extensionPoints: {
  'Commerce::ProductGridMassActions': () => {
    return [
      {
        id: 'custom-bulk-action',
        label: 'Export to My System',
        // The action handler (called with selected row IDs)
        action: async (selectedIds) => {
          await fetch('https://my-service.example.com/export', {
            method: 'POST',
            body: JSON.stringify({ ids: selectedIds }),
          });
        },
      },
    ];
  },
},
```

---

### 7.8 Banner Extension Point

Banners allow you to show **notification messages** at the top of Admin pages without modifying PHP.

```javascript
extensionPoints: {
  'Commerce::AdminBanner': () => {
    return {
      id: 'maintenance-banner',
      variant: 'warning',   // info | warning | error | success
      message: 'Scheduled maintenance window: Sunday 2-4 AM UTC',
      dismissable: true,
    };
  },
},
```

**Exam focus:**
- Banner extension point allows **non-PHP notification injection** into Admin pages
- Variants: `info`, `warning`, `error`, `success`
- Can be `dismissable` (user can close it)

---

### 7.9 When to Use Admin UI SDK vs Traditional Admin

This decision tree is exam-critical:

```
Do you need to extend the Commerce Admin UI?
              |
              v
    Is this a NEW UI feature (dashboard,
    report, external data display)?
         /          \
        YES           NO
        |              |
        v              v
   Admin UI SDK    Do you need DIRECT
   (App Builder)   DB / Service Layer access?
                      /       \
                    YES         NO
                    |            |
                    v            v
              Traditional    Could be either
              PHP Admin      (prefer SDK for
              (Controller,   lower coupling)
               Block, etc.)
```

**Use Admin UI SDK when:**
- Building dashboards that aggregate data from external systems
- The UI is primarily informational/reporting
- You want zero upgrade risk from Commerce version changes
- The team has React/JavaScript expertise
- You're extending, not replacing, core Admin pages

**Use Traditional PHP Admin when:**
- You need direct access to the Commerce service layer / repositories
- You're modifying core grid columns on entity grids
- You need complex form processing with validation tied to Commerce models
- ACL permissions need to be Commerce-native
- The feature must work without App Builder / cloud connectivity

**Exam focus:**
- Admin UI SDK is preferred when **decoupling from Commerce core** is a priority
- Traditional PHP is still required for **deep data manipulation** and **offline scenarios**
- The SDK is NOT a replacement for all admin customization — it's an **additional tool**

---

## 8. Hands-On Exploration Guide

### 8.1 Exploring Page Builder in Your EE Instance

Follow these steps to understand Page Builder from the inside:

1. **Access CMS Pages**: Admin → Content → Pages → Add New Page
2. **Switch editor to Page Builder** (if not default): Stores → Configuration → General → Content Management → Enable Page Builder = Yes
3. **Drag a Row** onto the stage, then drag a **Heading** into the row
4. **Click the Heading gear icon** — observe the UI Component form that opens
5. **Click Save & Close** on the page

```bash
# After saving, inspect the raw HTML content stored in the DB
mysql -u root -p magento -e "
  SELECT title, SUBSTRING(content, 1, 500)
  FROM cms_page
  ORDER BY page_id DESC
  LIMIT 1\G"
```

You'll see output like:

```html
<div data-content-type="row" data-appearance="contained" ...>
    <div data-element="inner" ...>
        <h2 data-content-type="heading"
            data-appearance="default"
            data-element="main"
            style="border-style: none; border-color: ...">
            My Heading Text
        </h2>
    </div>
</div>
```

**What to notice:**
- `data-content-type` attribute on every element — this is how Page Builder identifies types
- `data-appearance` — which appearance is active
- `data-element` — maps to the `element name` in your XML config
- Inline styles from the form fields

---

### 8.2 Inspecting Page Builder HTML Output

```bash
# Find all content type XML configurations in core
find vendor/magento/module-page-builder \
  -name "content_types.xml" \
  -exec echo "=== {} ===" \; \
  -exec head -30 {} \;
```

```bash
# List all built-in content types
grep -r '<type name=' \
  vendor/magento/module-page-builder/view/adminhtml/pagebuilder/ \
  | awk -F'"' '{print $2}' \
  | sort
```

```bash
# Find all preview templates
find vendor/magento/module-page-builder/view/adminhtml/web/template \
  -name "preview.html" \
  | sort
```

---

### 8.3 Finding Page Builder Files in the Codebase

```bash
# Core Page Builder module location
ls vendor/magento/module-page-builder/

# Key subdirectories to explore:
# etc/                    - Schema definitions (XSD files)
# view/adminhtml/pagebuilder/content_types.xml  - All built-in types
# view/adminhtml/web/js/content-type/           - JS components
# view/adminhtml/web/template/content-type/     - Templates
# view/adminhtml/ui_component/                  - Edit forms

# Look at the 'heading' content type as a reference
cat vendor/magento/module-page-builder/view/adminhtml/web/template/content-type/heading/default/preview.html
cat vendor/magento/module-page-builder/view/adminhtml/web/template/content-type/heading/default/master.html
cat vendor/magento/module-page-builder/view/adminhtml/web/js/content-type/heading/preview.js
```

```bash
# Admin UI SDK - find Adobe's documentation examples
# The SDK npm package
npm info @adobe/uix-guest
npm info @adobe/uix-host

# In an App Builder project, key files:
# app.config.yaml              - App config
# src/web/src/components/      - React components
# src/actions/                 - Backend actions (Adobe I/O Runtime)
```

---

## 9. Exam Angle Synthesis

Here are the conceptual connections the exam tests:

### Page Builder Key Relationships

```
content_types.xml
    |
    |-- type[name]  <-- maps to data-content-type in HTML
    |-- form        <-- UI Component for settings panel
    |-- appearances
         |-- preview_template  <-- Admin stage (KO bindings)
         |-- master_template   <-- Storefront output (static HTML)
         |-- elements          <-- DataStore <-> HTML attribute mapping
              |-- element[name] <-- maps to data-element in HTML
                   |-- style, attribute, css, html  <-- field types
```

### Admin UI SDK Key Relationships

```
App Builder App
    |
    |-- app.config.yaml
         |-- extensionPoints
              |-- commerce/backend-ui/1
                   |-- menu          --> adds nav items
                   |-- page          --> registers full pages
                   |-- column        --> adds grid columns
                   |-- massAction    --> adds grid mass actions
                   |-- banner        --> adds notification banners
                   |-- modal         --> adds dialogs
```

### The "Two Extension Worlds" Mental Model

```
TRADITIONAL                         MODERN
(in-process)                        (out-of-process)
     |                                    |
     v                                    v
PHP Controller                      App Builder React App
PHP Block                           Adobe I/O Runtime
PHTML Template                      REST/GraphQL APIs
XML Layout                          app.config.yaml
di.xml                              extensionPoints: {}
     |                                    |
     +-------- Commerce Admin -----------+
                    |
                    | Both extend the SAME Admin UI
                    | but from different "directions"
```

---

## Quick-Reference Checklist

### Page Builder Architecture
- [ ] Page Builder is **EE only** — not available in Magento Open Source
- [ ] Content is stored as **annotated HTML** in standard DB columns (`data-content-type` attributes)
- [ ] The Admin stage uses **Knockout.js** for the preview
- [ ] The storefront renders Page Builder content as **static HTML** — no JS engine required
- [ ] A **content type** is the atomic unit: one draggable block type = one content type
- [ ] Every content type needs: **XML config, preview template, master template, preview JS component**
- [ ] Content type config lives in `view/adminhtml/pagebuilder/content_types.xml`
- [ ] **Preview template** = Admin only, Knockout bindings, `.html` file
- [ ] **Master template** = processed once on save → static HTML in DB
- [ ] **Appearances** define which template pair to use (a type can have multiple appearances)
- [ ] **Elements** in the XML config map form fields to HTML attributes/styles/classes/content

### Page Builder Customization
- [ ] Register a new type: add entry in `content_types.xml` with `<type name="..."/>`
- [ ] Extend existing type: reference its name in your module's `content_types.xml` (XML merge)
- [ ] Extend JS component: inherit from the target type's preview component
- [ ] Module must declare `Magento_PageBuilder` in `<sequence>` in `module.xml`
- [ ] Template override: set `preview_template` / `master_template` in your XML declaration
- [ ] `parents` and `children` nodes control **nesting rules** in the stage
- [ ] `master_component` defaults to `Magento_PageBuilder/js/content-type/master` (rarely needs changing)

### Page Builder Data Flow
- [ ] DataStore → Preview Template → Stage (visual feedback while editing)
- [ ] DataStore → Master Format Converter → Annotated HTML → Database (on Save)
- [ ] Database → Raw HTML output → Storefront browser (on page request)
- [ ] **No round-trip** on the storefront — HTML is already rendered

### Admin UI SDK Fundamentals
- [ ] Admin UI SDK is **out-of-process** — runs on Adobe I/O Runtime, not Commerce server
- [ ] Built with **React** — not PHP/PHTML/KnockoutJS
- [ ] Requires **App Builder entitlement** — Commerce EE + Adobe cloud
- [ ] Extensions access Commerce data via **REST or GraphQL APIs**
- [ ] Lower upgrade risk than traditional PHP admin customization
- [ ] Extensions are deployed via **App Builder** (`aio app deploy`), not Commerce module install

### Admin UI SDK Extension Points (know all these)
- [ ] **menu** — adds custom items to Admin left navigation
- [ ] **page** — registers a full custom Admin page (iframe to App Builder app)
- [ ] **column** — adds custom columns to Admin grids
- [ ] **massAction** — adds custom mass actions to grid listings
- [ ] **banner** — adds notification banners to Admin pages
- [ ] **modal** — adds custom dialog modals
- [ ] **sharedContext** — shares context data between Admin and App Builder app

### Admin UI SDK Configuration
- [ ] Extension points are declared in **`app.config.yaml`** (App Builder config file)
- [ ] The key YAML node is **`extensionPoints`**
- [ ] Registration uses the `@adobe/uix-guest` npm package's `register()` function
- [ ] Extension point identifier format: `Commerce::AdminMenu`, `Commerce::ProductGridColumns`, etc.

### When to Use Which
- [ ] **Admin UI SDK**: new dashboards, external data display, zero upgrade risk, decoupled UI
- [ ] **Traditional PHP**: direct DB access, complex form validation, offline-capable, ACL-native
- [ ] Admin UI SDK does **NOT** replace traditional admin for deep data manipulation
- [ ] Both can coexist in the same Commerce instance

### Exam Trap Avoidances
- [ ] Page Builder content types are NOT stored in a separate table — they use **existing text columns**
- [ ] The storefront does **NOT need Knockout.js** to render Page Builder content
- [ ] Admin UI SDK is NOT available in Magento Open Source
- [ ] Traditional admin XML layout / blocks still work and are still valid — SDK is an **addition**, not a replacement
- [ ] `content_types.xml` goes in `view/adminhtml/pagebuilder/`, **not** `view/adminhtml/layout/`
- [ ] The `master_template` still uses `data-bind` syntax — it's processed **once by Knockout at save time**, not at storefront render time
