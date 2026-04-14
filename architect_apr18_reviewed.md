# Magento 2 Architect Exam: UI Components, Layout XML & ViewModel Pattern

## Study Notes — Week 2, Section 1 & 2 Intro

---

## Table of Contents

1. [Layout XML Deep Dive](#1-layout-xml-deep-dive)
   - [Core Directives](#core-directives)
   - [The `remove` vs `display="false"` Decision](#the-remove-vs-displayfalse-decision)
   - [Block Lifecycle](#block-lifecycle)
2. [ViewModel Pattern](#2-viewmodel-pattern)
   - [ViewModel vs Block: The Architectural Case](#viewmodel-vs-block-the-architectural-case)
   - [Injecting a ViewModel via Layout XML](#injecting-a-viewmodel-via-layout-xml)
3. [UI Components](#3-ui-components)
   - [When to Use UI Components vs Blocks](#when-to-use-ui-components-vs-blocks)
   - [Architecture Overview](#architecture-overview)
   - [definition.xml](#definitionxml)
   - [UI Component XML Files](#ui-component-xml-files)
   - [DataProviders](#dataproviders)
   - [Syntax Trap: UI Components vs Layout XML Arguments](#syntax-trap-ui-components-vs-layout-xml-arguments)
4. [Hands-On: Tracing product_listing.xml](#4-hands-on-tracing-product_listingxml)
5. [Scenario-Based Decision Framework](#5-scenario-based-decision-framework)
6. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Layout XML Deep Dive

### Core Directives

Layout XML is the **declarative configuration layer** that tells Magento how to assemble the page object tree. Understanding each directive's *purpose* and *scope* is critical for architect-level questions.

| Directive | Purpose | Key Characteristics |
|---|---|---|
| `block` | Declares a new block instance | Has `name`, `class`, `template`, `as` attributes |
| `container` | Structural wrapper with no PHP class | Groups blocks, renders children only |
| `handle` | Named layout update scope | Applied per-request; can be loaded programmatically |
| `referenceBlock` | Modifies an existing block | Can add children, set arguments, remove |
| `referenceContainer` | Modifies an existing container | Same as referenceBlock but for containers |
| `move` | Relocates a block/container in the tree | Non-destructive repositioning |
| `remove` | Permanently removes a block/container | **Irreversible for the request** |
| `update` | Includes another layout handle | Merges that handle's XML into current context |

#### `block`

```xml
<block class="Magento\Catalog\Block\Product\View"
       name="product.info"
       template="Magento_Catalog::product/view.phtml"
       as="product_info">
    <arguments>
        <argument name="some_param" xsi:type="string">value</argument>
    </arguments>
</block>
```

- **`as`** — the alias used when calling `getChildHtml('alias')` from the parent template
- **`name`** — globally unique identifier within the layout tree for the request
- **`class`** — defaults to `Magento\Framework\View\Element\Template` if omitted

#### `container`

```xml
<container name="product.info.main"
           htmlTag="div"
           htmlClass="product-info-main"
           label="Product Main Info">
    <!-- children go here -->
</container>
```

- Renders **no PHP**, only wraps children in an optional HTML tag
- Use containers for structural grouping; use blocks when PHP logic or a template is needed

**Exam focus:** A container cannot have a `template` attribute. If you need a wrapper with conditional logic, you need a block — but prefer a ViewModel to keep the block thin.

#### `referenceBlock` and `referenceContainer`

```xml
<!-- Adding a child to an existing block from a different module -->
<referenceBlock name="product.info.main">
    <block class="Vendor\Module\Block\MyBlock"
           name="vendor.my.block"
           template="Vendor_Module::myblock.phtml"/>
</referenceBlock>

<!-- Setting arguments on an existing container -->
<referenceContainer name="content">
    <block class="Vendor\Module\Block\Banner" name="vendor.banner"/>
</referenceContainer>
```

**Exam focus:** `referenceBlock` on a block that does not exist for the current handle will **silently fail** — no exception is thrown. This is a common source of bugs in third-party modules.

#### `move`

```xml
<move element="product.info.sku" destination="product.info.main" after="product.info.price"/>
```

- Detaches the element from its current parent and re-attaches it to `destination`
- `before` and `after` control sort order; `-` (hyphen) means first/last
- **Non-destructive**: the block is not destroyed, just repositioned

#### `remove`

```xml
<remove name="catalog.leftnav"/>
```

**Exam focus:** `remove` is **permanent for the lifetime of that HTTP request's layout build**. Once removed, no subsequent layout handle can restore it. This is the single most important behavioral distinction for exam scenarios.

#### `update`

```xml
<update handle="catalog_category_default"/>
```

- Instructs the layout processor to merge the named handle's XML into the current context
- Used to share layout definitions across multiple pages

---

### The `remove` vs `display="false"` Decision

This is a **classic architect exam trap**. Both appear to "hide" a block, but they behave fundamentally differently.

```
+---------------------------+----------------------------------+----------------------------------+
|                           | remove                           | display="false"                  |
+---------------------------+----------------------------------+----------------------------------+
| Block instantiated?       | NO                               | YES                              |
| Template rendered?        | NO                               | NO                               |
| Can be re-enabled later?  | NO (permanent for request)       | YES (set display="true")         |
| PHP constructor runs?     | NO                               | YES                              |
| Children processed?       | NO                               | YES (but not output)             |
| Use case                  | Permanently eliminate a block    | Conditionally hide, may re-show  |
+---------------------------+----------------------------------+----------------------------------+
```

#### Using `display="false"` for Conditional Visibility

```xml
<!-- Hides the block but keeps it in the tree -->
<referenceBlock name="catalog.leftnav" display="false"/>
```

From PHP (e.g., a ViewModel or observer), you can toggle visibility:

```php
// Inside a block or via event observer on layout_generate_blocks_after
$block = $layout->getBlock('catalog.leftnav');
if ($block && $someCondition) {
    $block->setDisplay(true); // Re-enable visibility
}
```

**Exam focus:** If a question describes a scenario where a block needs to be hidden *by default* but revealed based on customer group or configuration — the correct answer is `display="false"`, **not** `remove`. If the block must never appear under any circumstance for that page type, `remove` is appropriate.

**Exam focus:** Asking "why not just use CSS `display:none`?" — CSS hides visually but still renders HTML and executes PHP. `display="false"` prevents rendering entirely.

---

### Block Lifecycle

Understanding the lifecycle lets you answer "where should I put this logic?" questions correctly.

```
Block Instantiation (ObjectManager / DI)
         |
         v
   _prepareLayout()
   - Called once after the block is added to the layout
   - Safe to call $this->getLayout()->getBlock(...)
   - Override to set child blocks programmatically
         |
         v
   _beforeToHtml()
   - Called immediately before rendering
   - Last chance to modify block state
   - Can short-circuit rendering
         |
         v
   _toHtml()
   - Core rendering method
   - Checks cache, calls fetchView() for templates
   - Returns HTML string
         |
         v
   getCacheKeyInfo()
   - Returns array of values that form the cache key
   - Override to add cache-varying dimensions
   (e.g., customer group, store ID, URL params)
         |
         v
   HTML returned to parent block / page output
```

#### `_prepareLayout()`

```php
// Base class signature: protected function _prepareLayout() — @return $this (no PHP type hint)
// When overriding in a subclass, : static is valid PHP 8.1+ return type for covariant returns:
protected function _prepareLayout(): static
{
    // Correct: layout is fully initialized here
    $breadcrumbs = $this->getLayout()->getBlock('breadcrumbs');
    if ($breadcrumbs) {
        $breadcrumbs->addCrumb('home', ['label' => __('Home'), 'link' => '/']);
    }
    return parent::_prepareLayout();
}
```

**Exam focus:** Do NOT call `$this->getLayout()->getBlock()` in the constructor — the block may not be added to the layout yet. `_prepareLayout()` is the earliest safe point.

#### `_beforeToHtml()`

```php
// Base class: protected function _beforeToHtml() — @return $this (no PHP type hint)
protected function _beforeToHtml(): static
{
    // Set data that templates need, just before render
    $this->setData('product_count', $this->productCollection->getSize());
    return parent::_beforeToHtml();
}
```

#### `getCacheKeyInfo()`

```php
public function getCacheKeyInfo(): array
{
    return array_merge(parent::getCacheKeyInfo(), [
        'customer_group' => $this->customerSession->getCustomerGroupId(),
        'store_id'       => $this->_storeManager->getStore()->getId(),
        'category_id'    => $this->getRequest()->getParam('id'),
    ]);
}
```

**Exam focus:** Forgetting to vary the cache key by customer group is a common cause of showing wrong prices to different customer groups. The architect must know *when* and *why* to extend `getCacheKeyInfo()`.

---

## 2. ViewModel Pattern

### ViewModel vs Block: The Architectural Case

This is one of the most architecturally significant decisions in modern Magento 2 development.

#### The Problem with Business Logic in Blocks

Historically, Magento 1/early Magento 2 blocks contained both rendering logic AND business logic:

```php
// ANTI-PATTERN: Business logic in a Block (avoid this)
class ProductBlock extends \Magento\Framework\View\Element\Template
{
    public function __construct(
        \Magento\Catalog\Model\ResourceModel\Product\CollectionFactory $collectionFactory,
        \Magento\Framework\Pricing\Helper\Data $pricingHelper,
        \Magento\Customer\Model\Session $customerSession,
        // ... 10 more dependencies
        Template\Context $context,
        array $data = []
    ) { ... }

    public function getFormattedPrice(float $price): string
    {
        return $this->pricingHelper->currency($price, true, false);
    }
}
```

**Problems:**
- `Block` extends a large framework class — hard to unit test
- Violates Single Responsibility Principle
- Constructor signature is fragile (context object grows with Magento updates)
- Blocks are deeply coupled to the rendering pipeline

#### The ViewModel Solution

```
+---------------------+        injects        +------------------+
|   Layout XML        | --------------------> |   ViewModel      |
|   (configuration)   |                       | (business logic) |
+---------------------+                       +------------------+
         |                                            |
         | instantiates                               | provides data
         v                                            v
+---------------------+        calls         +------------------+
|   Block (thin)      | --------------------> |   Template       |
| (rendering only)    |       getViewModel()  |   (.phtml)       |
+---------------------+                       +------------------+
```

**Key principle:** The Block becomes a **thin rendering coordinator**. All business logic lives in the ViewModel (or service classes injected into the ViewModel).

#### ViewModel Interface

> **⚠ CORRECTION:** There is no `Magento\Framework\View\Element\ViewModelInterface` in the codebase — this interface does not exist. The correct interface for ViewModels is `Magento\Framework\View\Element\Block\ArgumentInterface`, which is an independent empty marker interface (it does not extend any other interface). All objects injected as block arguments should implement `ArgumentInterface`.

```php
// The actual interface ViewModels implement:
// vendor/magento/framework/View/Element/Block/ArgumentInterface.php
namespace Magento\Framework\View\Element\Block;

/**
 * Block argument interface.
 * All objects that are injected to block arguments should implement this interface.
 * @api
 * @since 101.0.0
 */
interface ArgumentInterface
{
    // Empty marker interface — no required methods
}
```

```php
// A proper ViewModel
namespace Vendor\Module\ViewModel;

use Magento\Framework\View\Element\Block\ArgumentInterface;

class ProductViewModel implements ArgumentInterface
{
    public function __construct(
        private readonly \Magento\Catalog\Api\ProductRepositoryInterface $productRepository,
        private readonly \Magento\Framework\Pricing\Helper\Data $pricingHelper,
        private readonly \Magento\Customer\Model\Session $customerSession
    ) {}

    public function getFormattedPrice(float $price): string
    {
        return $this->pricingHelper->currency($price, true, false);
    }

    public function isLoggedIn(): bool
    {
        return $this->customerSession->isLoggedIn();
    }

    public function getProductById(int $id): \Magento\Catalog\Api\Data\ProductInterface
    {
        return $this->productRepository->getById($id);
    }
}
```

**Exam focus:** ViewModels must implement `Magento\Framework\View\Element\Block\ArgumentInterface`. This is an empty marker interface — it imposes no required methods. You add any public methods that templates need to call.

---

### Injecting a ViewModel via Layout XML

```xml
<!-- layout/catalog_product_view.xml -->
<referenceBlock name="product.info">
    <arguments>
        <argument name="view_model" xsi:type="object">
            Vendor\Module\ViewModel\ProductViewModel
        </argument>
    </arguments>
</referenceBlock>
```

Accessing the ViewModel in the template:

```php
// In product/view.phtml
/** @var \Vendor\Module\ViewModel\ProductViewModel $viewModel */
$viewModel = $block->getData('view_model');
// OR
$viewModel = $block->getViewModel(); // if block has a getter
?>

<p><?= $escaper->escapeHtml($viewModel->isLoggedIn() ? 'Welcome back!' : 'Please log in') ?></p>
<p><?= $escaper->escapeHtml($viewModel->getFormattedPrice(99.99)) ?></p>
```

**Exam focus:** The ViewModel is instantiated by the ObjectManager (DI container) like any other class — it participates fully in dependency injection, preferences, plugins, and virtual types. This is a major architectural advantage over putting logic directly in a block.

**Exam focus:** No `di.xml` entry is needed for basic ViewModel injection — the class name in `xsi:type="object"` is resolved directly. However, you CAN create virtual types pointing to ViewModels via `di.xml` for shared configuration.

#### Multiple ViewModels on One Block

```xml
<referenceBlock name="product.info">
    <arguments>
        <argument name="pricing_view_model" xsi:type="object">
            Vendor\Module\ViewModel\PricingViewModel
        </argument>
        <argument name="review_view_model" xsi:type="object">
            Vendor\Module\ViewModel\ReviewViewModel
        </argument>
    </arguments>
</referenceBlock>
```

```php
// In template
$pricingVm = $block->getData('pricing_view_model');
$reviewVm  = $block->getData('review_view_model');
```

---

## 3. UI Components

### When to Use UI Components vs Blocks

This is a high-value architect decision question.

```
+------------------------+----------------------------------+----------------------------------+
| Dimension              | Block + Template                 | UI Component                     |
+------------------------+----------------------------------+----------------------------------+
| Primary use case       | Frontend content rendering       | Admin forms, grids, listings     |
| JavaScript dependency  | Optional / minimal               | Requires KnockoutJS + RequireJS  |
| Data binding           | Server-side only                 | Two-way (JS + AJAX)              |
| Configuration          | Layout XML + PHP                 | ui_component XML + DataProvider  |
| Reusability            | Template-level                   | Component composition            |
| AJAX updates           | Manual (controllers + JS)        | Built-in via AJAX sources        |
| Form validation        | Manual implementation            | Built-in validation system       |
| Best for               | Static/catalog frontend pages    | Admin CRUD, dynamic form UIs     |
+------------------------+----------------------------------+----------------------------------+
```

**When to choose UI Components:**
- Admin grids with filtering, sorting, pagination (use `listing` component)
- Admin forms with dynamic fieldsets (`form` component)
- Any interface requiring real-time JS interaction with server data
- Dynamic row components (e.g., product custom options, configurable variations)

**When to choose Blocks:**
- Frontend catalog/CMS pages
- Simple server-rendered widgets
- Email templates
- Any context without KnockoutJS available

**Exam focus:** UI Components are **not** appropriate for frontend product pages or CMS content. Using them there would be an architectural mistake — expect a scenario question where this is the "plausible but wrong" answer.

---

### Architecture Overview

```
   ui_component XML
   (e.g. product_listing.xml)
         |
         | parsed by
         v
   Magento\Ui\Component\Form (or Listing, Grid, etc.)
         |
         | reads DataProvider
         v
   DataProviderInterface
         |
         | returns metadata + data
         v
   JSON payload (via /mui/index/render AJAX endpoint)
         |
         | consumed by
         v
   KnockoutJS components in browser
         |
         | renders
         v
   HTML via ko bindings
```

The key insight: **UI Components are a bridge between PHP DataProviders and JavaScript view models.** The XML configuration defines the component tree; the DataProvider feeds data into it; KnockoutJS renders it.

---

### definition.xml

`definition.xml` is the **component type registry** — it maps component type names to PHP classes.

**Location:** `vendor/magento/module-ui/view/base/ui_component/etc/definition.xml`

```xml
<!-- Actual entries from vendor/magento/module-ui/view/base/ui_component/etc/definition.xml (simplified): -->
<components xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Ui:etc/ui_definition.xsd">

    <listing sorting="true" class="Magento\Ui\Component\Listing" component="uiComponent">
        <!-- ... -->
    </listing>

    <form class="Magento\Ui\Component\Form">
        <!-- ... -->
    </form>

    <column class="Magento\Ui\Component\Listing\Columns\Column" component="Magento_Ui/js/grid/columns/column">
        <!-- ... -->
    </column>

    <filters class="Magento\Ui\Component\Filters" component="Magento_Ui/js/grid/filters/filters" displayArea="dataGridFilters">
        <!-- ... -->
    </filters>

    <filterInput class="Magento\Ui\Component\Filters\Type\Input"/>

    <!-- ... many more -->
</components>
```

**Exam focus:** `definition.xml` maps the **XML element name** (e.g., `<listing>`, `<column>`) to a **PHP class**. When you write `<listing>` in a ui_component XML file, Magento resolves it through `definition.xml`. This is why component names in ui_component XML are not arbitrary — they must be registered.

**Exam focus:** You can extend `definition.xml` in your own module to register custom component types. This is done via a `definition.xml` file in your module's `view/base/ui_component/etc/` directory — NOT in `etc/` directly.

---

### UI Component XML Files

**Location:** `view/adminhtml/ui_component/` (or `view/frontend/ui_component/` for frontend components)

#### Structure of a Listing Component

> **Note:** Magento 2.4.x uses the newer `<settings>` / `<dataProvider>` element syntax. The old `<argument name="dataProvider" xsi:type="configurableObject">` style shown in older documentation is no longer used. Actual `product_listing.xml` in 2.4.x:

```xml
<!-- view/adminhtml/ui_component/product_listing.xml (actual 2.4.x style, simplified) -->
<listing xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Ui:etc/ui_configuration.xsd">

    <argument name="data" xsi:type="array">
        <item name="js_config" xsi:type="array">
            <item name="provider" xsi:type="string">product_listing.product_listing_data_source</item>
        </item>
    </argument>
    <settings>
        <spinner>product_columns</spinner>
        <deps>
            <dep>product_listing.product_listing_data_source</dep>
        </deps>
    </settings>

    <!-- The DataSource component definition (2.4.x syntax) -->
    <dataSource name="product_listing_data_source" component="Magento_Ui/js/grid/provider">
        <settings>
            <updateUrl path="mui/index/render"/>
        </settings>
        <dataProvider class="Magento\Catalog\Ui\DataProvider\Product\ProductDataProvider"
                      name="product_listing_data_source">
            <settings>
                <requestFieldName>id</requestFieldName>
                <primaryFieldName>entity_id</primaryFieldName>
            </settings>
        </dataProvider>
    </dataSource>

    <!-- Toolbar, columns, etc. -->
    <listingToolbar name="listing_top">
        <filters name="listing_filters"/>
        <paging name="listing_paging"/>
    </listingToolbar>

    <columns name="product_columns">
        <!-- column definitions -->
    </columns>
</listing>
```

#### Structure of a Form Component

```xml
<!-- view/adminhtml/ui_component/vendor_entity_form.xml -->
<form xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Ui:etc/ui_configuration.xsd">

    <argument name="data" xsi:type="array">
        <item name="js_config" xsi:type="array">
            <item name="provider" xsi:type="string">vendor_entity_form.entity_form_data_source</item>
        </item>
        <item name="label" xsi:type="string" translate="true">General</item>
        <item name="template" xsi:type="string">templates/form/collapsible</item>
    </argument>

    <dataSource name="entity_form_data_source">
        <argument name="dataProvider" xsi:type="configurableObject">
            <argument name="class" xsi:type="string">
                Vendor\Module\Ui\DataProvider\EntityDataProvider
            </argument>
            <argument name="name" xsi:type="string">entity_form_data_source</argument>
            <argument name="primaryFieldName" xsi:type="string">entity_id</argument>
            <argument name="requestFieldName" xsi:type="string">id</argument>
        </argument>
    </dataSource>

    <fieldset name="general">
        <argument name="data" xsi:type="array">
            <item name="config" xsi:type="array">
                <item name="label" xsi:type="string" translate="true">General Information</item>
            </item>
        </argument>

        <field name="entity_id">
            <argument name="data" xsi:type="array">
                <item name="config" xsi:type="array">
                    <item name="visible" xsi:type="boolean">false</item>
                    <item name="dataType" xsi:type="string">text</item>
                    <item name="formElement" xsi:type="string">input</item>
                    <item name="source" xsi:type="string">entity</item>
                </item>
            </argument>
        </field>

        <field name="title">
            <argument name="data" xsi:type="array">
                <item name="config" xsi:type="array">
                    <item name="dataType" xsi:type="string">text</item>
                    <item name="label" xsi:type="string" translate="true">Title</item>
                    <item name="formElement" xsi:type="string">input</item>
                    <item name="source" xsi:type="string">entity</item>
                    <item name="validation" xsi:type="array">
                        <item name="required-entry" xsi:type="boolean">true</item>
                    </item>
                </item>
            </argument>
        </field>
    </fieldset>
</form>
```

---

### DataProviders

The DataProvider is the **PHP layer** that supplies data and metadata to a UI Component.

#### The Interface

> **⚠ CORRECTION:** `DataProviderInterface` is at `Magento\Framework\View\Element\UiComponent\DataProvider\DataProviderInterface`. The actual interface has **more methods** than commonly shown — including `getConfigData()`, `setConfigData()`, `getFieldMetaInfo()`, `getFieldSetMetaInfo()`, `getFieldsMetaInfo()`, and `getSearchCriteria()`. No PHP return type hints on any method (docblock only, consistent with `@api` interfaces). Key methods for exam purposes:

```php
namespace Magento\Framework\View\Element\UiComponent\DataProvider;

interface DataProviderInterface
{
    public function getName();              // component name
    public function getConfigData();        // component config array
    public function setConfigData($config); // set config
    public function getMeta();              // field metadata
    public function getPrimaryFieldName();  // usually 'entity_id'
    public function getRequestFieldName();  // URL param name
    public function getData();              // actual data rows
    public function addFilter(\Magento\Framework\Api\Filter $filter);
    public function addOrder($field, $direction);
    public function setLimit($offset, $size);
    public function getSearchCriteria();    // returns SearchCriteriaInterface
    public function getSearchResult();      // returns SearchResultInterface
    // ... plus getFieldMetaInfo(), getFieldSetMetaInfo(), getFieldsMetaInfo()
}
```

#### A Concrete DataProvider for a Listing

```php
namespace Vendor\Module\Ui\DataProvider;

use Magento\Framework\View\Element\UiComponent\DataProvider\DataProvider;

class EntityListingDataProvider extends DataProvider
{
    // DataProvider base class handles SearchCriteria-based collection loading
    // Override getSearchResult() if you need custom collection logic

    public function getSearchResult()
    {
        // Base implementation uses a SearchResultsFactory
        // For custom collections, override here
        return parent::getSearchResult();
    }
}
```

**The `di.xml` wiring for a listing DataProvider:**

```xml
<!-- etc/di.xml -->
<type name="Magento\Framework\View\Element\UiComponent\DataProvider\CollectionFactory">
    <arguments>
        <argument name="collections" xsi:type="array">
            <!-- key = DataProvider 'name' in ui_component XML -->
            <item name="entity_listing_data_source" xsi:type="string">
                Vendor\Module\Model\ResourceModel\Entity\Grid\Collection
            </item>
        </argument>
    </arguments>
</type>
```

**The Grid Collection class:**

```php
namespace Vendor\Module\Model\ResourceModel\Entity\Grid;

use Magento\Framework\View\Element\UiComponent\DataProvider\SearchResult;

class Collection extends SearchResult
{
    protected function _initSelect(): static
    {
        parent::_initSelect();
        // Add joins, additional columns, etc.
        $this->addFilterToMap('entity_id', 'main_table.entity_id');
        return $this;
    }
}
```

**Exam focus:** The DataProvider `name` attribute in the ui_component XML (`entity_listing_data_source`) **must exactly match** the key used in the `CollectionFactory` `di.xml` argument. This is a common wiring error.

**Exam focus:** The base `DataProvider` class in `Magento\Framework\View\Element\UiComponent\DataProvider\DataProvider` implements the full `SearchCriteria` pattern. Do not reinvent collection filtering — extend this class.

#### DataProvider for Forms

```php
namespace Vendor\Module\Ui\DataProvider;

use Magento\Ui\DataProvider\AbstractDataProvider;

class EntityFormDataProvider extends AbstractDataProvider
{
    private array $loadedData = [];

    public function __construct(
        string $name,
        string $primaryFieldName,
        string $requestFieldName,
        private \Vendor\Module\Model\ResourceModel\Entity\CollectionFactory $collectionFactory,
        private \Magento\Framework\App\Request\Http $request,
        array $meta = [],
        array $data = []
    ) {
        parent::__construct($name, $primaryFieldName, $requestFieldName, $meta, $data);
        $this->collection = $this->collectionFactory->create();
    }

    public function getData(): array
    {
        if (!empty($this->loadedData)) {
            return $this->loadedData;
        }

        $entityId = $this->request->getParam($this->getRequestFieldName());

        foreach ($this->collection->getItems() as $entity) {
            $this->loadedData[$entity->getId()] = $entity->getData();
        }

        return $this->loadedData;
    }
}
```

---

### Syntax Trap: UI Components vs Layout XML Arguments

**This is one of the highest-frequency exam traps.** These two syntaxes look similar but are used in different contexts and have different structures.

#### Layout XML `<arguments>` Syntax

Used in **layout XML files** (`view/*/layout/*.xml`) when configuring blocks and containers.

```xml
<!-- view/frontend/layout/catalog_product_view.xml -->
<referenceBlock name="product.info">
    <arguments>                                          <!-- plural: arguments -->
        <argument name="view_model" xsi:type="object">  <!-- singular: argument -->
            Vendor\Module\ViewModel\ProductViewModel
        </argument>
        <argument name="cache_lifetime" xsi:type="number">3600</argument>
        <argument name="config" xsi:type="array">
            <item name="key1" xsi:type="string">value1</item>
            <item name="key2" xsi:type="boolean">true</item>
        </argument>
    </arguments>
</referenceBlock>
```

**Pattern:** `<arguments>` (wrapper) → `<argument name="...">` (individual item)

#### UI Component `<argument>` Syntax

Used in **ui_component XML files** (`view/*/ui_component/*.xml`).

```xml
<!-- view/adminhtml/ui_component/product_listing.xml -->
<listing>
    <argument name="data" xsi:type="array">           <!-- NO wrapper <arguments> -->
        <item name="js_config" xsi:type="array">       <!-- uses <item>, not <argument> -->
            <item name="provider" xsi:type="string">
                product_listing.product_listing_data_source
            </item>
        </item>
        <item name="spinner" xsi:type="string">product_columns</item>
    </argument>
</listing>
```

**Pattern:** `<argument name="...">` (directly, no wrapper) → `<item name="...">` (for nested arrays)

#### Side-by-Side Comparison

```
Layout XML:                          UI Component XML:
+--------------------------+         +---------------------------+
| <block ...>              |         | <listing ...>             |
|   <arguments>            |         |   <argument name="data"   |
|     <argument name="vm"  |         |            xsi:type="array">
|       xsi:type="object"> |         |     <item name="config"   |
|       Vendor\VM\Foo      |         |          xsi:type="array">|
|     </argument>          |         |       <item name="key"    |
|   </arguments>           |         |            xsi:type="string">
| </block>                 |         |         value             |
|                          |         |       </item>             |
|                          |         |     </item>               |
|                          |         |   </argument>             |
|                          |         | </listing>                |
+--------------------------+         +---------------------------+
  Outer wrapper = <arguments>          No outer wrapper
  Inner items = <argument>             Uses <item> for nesting
```

**Exam focus:** Mixing these up is the #1 syntax error with UI Components. In layout XML: always `<arguments>` plural as the wrapper, then `<argument>` singular inside. In UI component XML: `<argument>` directly on the component tag, then `<item>` for nested values.

---

## 4. Hands-On: Tracing product_listing.xml

This section traces the actual Magento source to understand DataProvider wiring in a real scenario.

### Step 1: Open the UI Component XML

```bash
vendor/magento/module-catalog/view/adminhtml/ui_component/product_listing.xml
```

In 2.4.x the `<dataSource>` uses `<dataProvider>` element syntax:

```xml
<dataSource name="product_listing_data_source" component="Magento_Ui/js/grid/provider">
    <dataProvider class="Magento\Catalog\Ui\DataProvider\Product\ProductDataProvider"
                  name="product_listing_data_source">
        <settings>
            <requestFieldName>id</requestFieldName>
            <primaryFieldName>entity_id</primaryFieldName>
        </settings>
    </dataProvider>
</dataSource>
```

**Key observation:** `name="product_listing_data_source"` — this string is the linkage key.

### Step 2: Find the DataProvider Class

```bash
vendor/magento/module-catalog/Ui/DataProvider/Product/ProductDataProvider.php
```

```php
namespace Magento\Catalog\Ui\DataProvider\Product;

use Magento\Framework\View\Element\UiComponent\DataProvider\DataProvider;

class ProductDataProvider extends DataProvider
{
    public function __construct(
        string $name,
        string $primaryFieldName,
        string $requestFieldName,
        \Magento\Framework\View\Element\UiComponent\DataProvider\ReportingInterface $reporting,
        \Magento\Framework\Api\Search\SearchCriteriaBuilder $searchCriteriaBuilder,
        \Magento\Framework\App\RequestInterface $request,
        \Magento\Framework\Api\FilterBuilder $filterBuilder,
        // addFieldStrategies and addFilterStrategies arrays...
        array $meta = [],
        array $data = []
    ) {
        parent::__construct(...);
    }
}
```

### Step 3: Trace the di.xml Wiring

The collection class for `product_listing_data_source` is wired in `module-catalog/etc/adminhtml/di.xml` via a **virtual type**, not directly via the `CollectionFactory` collections array:

```xml
<!-- vendor/magento/module-catalog/etc/adminhtml/di.xml -->
<virtualType name="Magento\Catalog\Ui\DataProvider\Product\ProductCollectionFactory"
             type="Magento\Catalog\Model\ResourceModel\Product\CollectionFactory">
    <arguments>
        <argument name="instanceName" xsi:type="string">
            \Magento\Catalog\Ui\DataProvider\Product\ProductCollection
        </argument>
    </arguments>
</virtualType>
```

### Step 4: Understand the Full Wiring Chain

```
product_listing.xml
  dataSource name="product_listing_data_source"
    |
    | class="Magento\Catalog\Ui\DataProvider\Product\ProductDataProvider"
    v
ProductDataProvider (extends DataProvider)
    |
    | injects ProductCollectionFactory (virtualType)
    v
ProductCollection (Magento\Catalog\Ui\DataProvider\Product\ProductCollection)
    |
    | returns EAV product collection with applied filters/sorts
    v
JSON response to KnockoutJS grid
```

**Exam focus:** The DataProvider name in ui_component XML, the key in `CollectionFactory` di.xml argument, and the `name` constructor argument to the DataProvider class **must all be the same string**. This three-way linkage is a common exam and real-world bug source.

### Step 5: The addFieldStrategies / addFilterStrategies Pattern

> **⚠ CORRECTION:** These strategy interfaces are in `Magento\Ui\DataProvider`, NOT in `Magento\Framework`. The actual method signatures differ from what is commonly shown:

```php
// vendor/magento/module-ui/DataProvider/AddFieldToCollectionInterface.php
namespace Magento\Ui\DataProvider;

use Magento\Framework\Data\Collection;

interface AddFieldToCollectionInterface
{
    // Parameter type: Collection (not AbstractDb)
    // Parameter order: collection, field, alias
    public function addField(Collection $collection, $field, $alias = null): void;
}
```

```php
// vendor/magento/module-ui/DataProvider/AddFilterToCollectionInterface.php
namespace Magento\Ui\DataProvider;

use Magento\Framework\Data\Collection;

interface AddFilterToCollectionInterface
{
    // Parameter type: Collection (not AbstractDb)
    // $condition is nullable string (not array)
    public function addFilter(Collection $collection, $field, $condition = null): void;
}
```

**Exam focus:** The strategy pattern here allows third-party modules to add columns/filters to the product grid via `di.xml` **without** modifying the core DataProvider. This is the architecturally correct extension point.

---

## 5. Scenario-Based Decision Framework

The architect exam presents scenarios where you must choose between valid-looking options. Use this framework.

### Scenario Type 1: "How should I hide a block in some conditions?"

```
Is the condition determined at layout build time (before any PHP renders)?
    |
    +-- YES (e.g., based on config flag, URL params) --> display="false" in layout XML
    |
    +-- NO (e.g., based on AJAX state, customer action) --> JavaScript show/hide
         |
         +-- Is this an admin UI Component context?
                 |
                 +-- YES --> Use component's visible config + ViewModel data
                 +-- NO  --> Render with display="false", toggle via JS/ViewModel
```

**Never use `remove` when the block might need to exist conditionally.** `remove` means "this block cannot exist for any reason in this request."

### Scenario Type 2: "Where should I put business logic?"

```
Is the logic about rendering/template output?
    |
    +-- YES --> Keep a minimal method in the Block
    |
    +-- NO  --> Does it involve repository/service/session calls?
                    |
                    +-- YES --> ViewModel (inject via layout XML)
                    |
                    +-- NO  --> Is it pure data transformation?
                                    |
                                    +-- YES --> Utility/Helper class, inject into ViewModel
```

### Scenario Type 3: "Should I use a UI Component or Block?"

```
Is this in the Magento admin panel?
    |
    +-- YES --> Is it a grid/listing with filters, sort, pagination?
    |               |
    |               +-- YES --> UI Component (listing)
    |               +-- NO  --> Is it a complex form with JS validation?
    |                               |
    |                               +-- YES --> UI Component (form)
    |                               +-- NO  --> Block + template is fine
    |
    +-- NO (frontend) --> Does it require real-time KnockoutJS data binding?
                            |
                            +-- YES --> UI Component (rare, e.g., minicart)
                            +-- NO  --> Block + template + ViewModel
```

### Scenario Type 4: "How should I extend the product grid?"

```
Add a new column to the product admin listing:
    |
    +-- Is it a simple database field on catalog_product_entity?
    |       |
    |       +-- YES --> Add column in ui_component XML via module's product_listing.xml
    |
    +-- Is it data from a JOIN or separate table?
            |
            +-- YES --> Create AddFieldToCollectionInterface strategy (Magento\Ui\DataProvider)
                         Wire via di.xml to CollectionFactory collections array
                         Add column definition in ui_component XML
```

---

## Quick-Reference Checklist

### Layout XML Directives

- [ ] `block` — creates a block instance with `name`, `class`, `template`, `as` attributes
- [ ] `container` — structural grouping with optional HTML tag, no PHP class, no template
- [ ] `handle` — named layout update scope, applied per-request
- [ ] `referenceBlock` — modifies existing block; silently fails if block doesn't exist
- [ ] `referenceContainer` — modifies existing container
- [ ] `move` — relocates element to new parent; non-destructive
- [ ] `remove` — **permanent** for the request; cannot be undone by later handles
- [ ] `update` — includes another layout handle's XML
- [ ] `display="false"` — hides block output but block is still instantiated; **can be toggled**
- [ ] `remove` vs `display="false"` — `remove` = gone forever; `display="false"` = conditional

### Block Lifecycle

- [ ] `_prepareLayout()` — first safe point to call `$this->getLayout()->getBlock()`; do NOT use constructor for this
- [ ] `_beforeToHtml()` — last chance to modify block state before render
- [ ] `_toHtml()` — core render method; checks full-page cache
- [ ] `getCacheKeyInfo()` — override to vary cache by customer group, store, URL params
- [ ] Constructor is NOT safe for layout-dependent operations
- [ ] Base class methods have `@return $this` docblock (no PHP type hint); overrides may use `: static`

### ViewModel Pattern

- [ ] ViewModels implement `Magento\Framework\View\Element\Block\ArgumentInterface` — an empty marker interface
- [ ] `ArgumentInterface` does NOT extend any other interface — it is standalone
- [ ] There is NO `ViewModelInterface` class in Magento framework — this interface does not exist
- [ ] Injected via layout XML `<argument name="view_model" xsi:type="object">ClassName</argument>`
- [ ] No `di.xml` entry required for basic injection (class resolved directly)
- [ ] ViewModel is DI-managed — supports preferences, plugins, virtual types
- [ ] Accessed in template via `$block->getData('view_model')` or `$block->getViewModelName()`
- [ ] Multiple ViewModels per block are allowed and common
- [ ] Purpose: keep Block class thin (rendering only); put business logic in ViewModel

### UI Components

- [ ] Use for admin grids (listing), admin forms, dynamic JS-bound UIs
- [ ] Do NOT use on standard frontend catalog/CMS pages
- [ ] `definition.xml` at `view/base/ui_component/etc/definition.xml` — maps component type names to PHP classes
- [ ] Located in `view/*/ui_component/` directory
- [ ] `DataProviderInterface` at `Magento\Framework\View\Element\UiComponent\DataProvider\DataProviderInterface`
- [ ] `AbstractDataProvider` at `Magento\Ui\DataProvider\AbstractDataProvider` — base for form DataProviders
- [ ] `DataProvider` at `Magento\Framework\View\Element\UiComponent\DataProvider\DataProvider` — base for listing DataProviders
- [ ] Grid Collection extends `Magento\Framework\View\Element\UiComponent\DataProvider\SearchResult`
- [ ] DataProvider name must match key in `CollectionFactory` di.xml argument exactly
- [ ] `addFieldStrategies` / `addFilterStrategies` are in `Magento\Ui\DataProvider` namespace (NOT Framework)

### Critical Syntax Trap

- [ ] **Layout XML**: `<arguments>` (plural wrapper) → `<argument name="...">` (singular inside)
- [ ] **UI Component XML**: `<argument name="...">` (directly on component) → `<item name="...">` (for nested)
- [ ] Do not use `<arguments>` wrapper in ui_component XML — it does not exist there
- [ ] `xsi:type="object"` — for class references in layout XML arguments
- [ ] `xsi:type="configurableObject"` — for class references in ui_component dataSource (older syntax)
- [ ] 2.4.x uses `<dataProvider class="..." name="..."><settings>...</settings></dataProvider>` in dataSource

### DataProvider Wiring Chain (Must Memorize)

- [ ] `ui_component XML` → `dataSource name="X"` → DataProvider class with `name="X"`
- [ ] `di.xml` `CollectionFactory` `collections` array → key `"X"` → Collection class
- [ ] All three must use the same name string `"X"` — this is the linkage
- [ ] Grid Collection should extend `Magento\Framework\View\Element\UiComponent\DataProvider\SearchResult`

### Architect-Level Decision Rules

- [ ] `remove` = never coming back this request; `display="false"` = may return
- [ ] Business logic belongs in ViewModels or service classes, not Block subclasses
- [ ] UI Components are admin-first; Blocks + ViewModels are frontend-first
- [ ] Extend admin grids via strategy pattern + di.xml, not by modifying DataProvider
- [ ] `referenceBlock` on a non-existent block silently fails — always verify block names
- [ ] Cache key must vary by any dimension that changes the output (group, store, params)
