# Day 8 — Catalog Customization
## Magento 2 Certification Study Notes

---

## Table of Contents

1. [EAV Architecture](#1-eav-architecture)
2. [Custom Product Attributes](#2-custom-product-attributes)
3. [Product Types](#3-product-types)
4. [Custom Product Type](#4-custom-product-type)
5. [Category Attributes and Flat Catalog](#5-category-attributes-and-flat-catalog)
6. [Price Modifiers](#6-price-modifiers)
7. [Layered Navigation](#7-layered-navigation)
8. [Practice Exercise](#8-practice-exercise)
9. [CE vs EE Differences](#9-ce-vs-ee-differences)
10. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. EAV Architecture

### What Is EAV?

**Entity-Attribute-Value (EAV)** is a data model pattern used in Magento to store entity data (products, categories, customers) where attributes are flexible and can be added without schema changes.

```
+------------------+        +------------------+        +---------------------+
|   eav_entity     |        |   eav_attribute  |        | catalog_product_     |
|   _type          |        |                  |        | entity_varchar       |
|------------------|        |------------------|        |---------------------|
| entity_type_id   |<------>| attribute_id     |<------>| value_id            |
| entity_type_code |        | entity_type_id   |        | attribute_id        |
| entity_model     |        | attribute_code   |        | entity_id           |
| attribute_model  |        | backend_type     |        | store_id            |
| entity_table     |        | frontend_input   |        | value               |
+------------------+        | source_model     |        +---------------------+
                            | backend_model    |
                            | frontend_model   |
                            +------------------+
```

### Core EAV Tables

| Table | Purpose |
|---|---|
| `eav_entity_type` | Defines entity types (product, category, customer) |
| `eav_attribute` | All attribute definitions |
| `eav_attribute_set` | Groups attributes into sets (e.g., "Default", "Clothing") |
| `eav_attribute_group` | Logical groupings within an attribute set |
| `eav_entity_attribute` | Links attributes to sets and groups |
| `catalog_product_entity_varchar` | String values for product attributes |
| `catalog_product_entity_int` | Integer values |
| `catalog_product_entity_decimal` | Decimal values (price, weight) |
| `catalog_product_entity_text` | Long text values |
| `catalog_product_entity_datetime` | Date/time values |

### Entity Types

```php
// Core entity_type_codes
'catalog_product'  // entity_type_id = 4
'catalog_category' // entity_type_id = 3
'customer'         // entity_type_id = 1
'customer_address' // entity_type_id = 2
```

**Exam focus:**
- The `backend_type` column in `eav_attribute` determines which value table is used (`varchar`, `int`, `decimal`, `text`, `datetime`, `static`)
- `static` backend type stores data directly in the main entity table (`catalog_product_entity`)
- EAV queries involve JOINs across multiple tables — this is a known performance concern

### Attribute Sets and Groups

```
Attribute Set: "Clothing"
|
+-- Group: "General"
|   +-- name (static)
|   +-- sku (static)
|   +-- color (int -> eav_attribute_option)
|
+-- Group: "Prices"
|   +-- price (decimal)
|   +-- special_price (decimal)
|
+-- Group: "Custom"
    +-- fabric_type (varchar)
    +-- care_instructions (text)
```

**Exam focus:**
- An attribute can belong to **multiple attribute sets** but in **different groups**
- Attribute sets do **not** restrict which attributes a product *has* — they restrict what appears in the **Admin UI form**
- `eav_entity_attribute` is the join table linking attribute → set → group

### eav_attribute Table Key Columns

| Column | Description |
|---|---|
| `attribute_code` | Programmatic identifier |
| `entity_type_id` | Links to `eav_entity_type` |
| `backend_type` | Storage type (`varchar`, `int`, `decimal`, `text`, `datetime`, `static`) |
| `backend_model` | PHP class for save/load logic |
| `source_model` | PHP class providing option values |
| `frontend_model` | PHP class for rendering |
| `frontend_input` | UI input type (`text`, `select`, `multiselect`, `boolean`, etc.) |
| `is_global` | Scope: 0=Store, 1=Global, 2=Website |
| `is_required` | Validation flag |
| `is_filterable` | Used in layered navigation |
| `used_in_product_listing` | Included in flat table / listing queries |

---

## 2. Custom Product Attributes

### InstallData / Patch Approach

Magento 2.3+ uses **Data Patches** (recommended). Pre-2.3 used `InstallData.php`.

#### Data Patch (Recommended)

<!-- CORRECTED: revert() is NOT required by DataPatchInterface. It comes from the separate optional
     PatchRevertableInterface. DataPatchInterface extends PatchInterface (which has apply() and
     getAliases()) and DependentPatchInterface (which has getDependencies()). If you want rollback
     support, also implement PatchRevertableInterface. -->

```php
<?php
// File: app/code/Vendor/Module/Setup/Patch/Data/AddFabricTypeAttribute.php

namespace Vendor\Module\Setup\Patch\Data;

use Magento\Eav\Setup\EavSetupFactory;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;
use Magento\Framework\Setup\Patch\PatchRevertableInterface;
use Magento\Catalog\Model\Product;
use Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface;

class AddFabricTypeAttribute implements DataPatchInterface, PatchRevertableInterface
{
    private ModuleDataSetupInterface $moduleDataSetup;
    private EavSetupFactory $eavSetupFactory;

    public function __construct(
        ModuleDataSetupInterface $moduleDataSetup,
        EavSetupFactory $eavSetupFactory
    ) {
        $this->moduleDataSetup = $moduleDataSetup;
        $this->eavSetupFactory = $eavSetupFactory;
    }

    public function apply(): void
    {
        $this->moduleDataSetup->getConnection()->startSetup();

        $eavSetup = $this->eavSetupFactory->create(['setup' => $this->moduleDataSetup]);

        $eavSetup->addAttribute(
            Product::ENTITY,       // 'catalog_product'
            'fabric_type',
            [
                'type'                    => 'varchar',       // backend_type
                'label'                   => 'Fabric Type',
                'input'                   => 'select',        // frontend_input
                'source'                  => \Vendor\Module\Model\Attribute\Source\FabricType::class,
                'backend'                 => '',              // backend_model (empty = default)
                'frontend'                => '',              // frontend_model
                'required'                => false,
                'global'                  => ScopedAttributeInterface::SCOPE_GLOBAL,
                'visible'                 => true,
                'searchable'              => true,
                'filterable'              => true,
                'comparable'              => false,
                'visible_on_front'        => true,
                'used_in_product_listing' => true,
                'unique'                  => false,
                'apply_to'               => 'simple,configurable', // restrict to product types
                'group'                   => 'General',
                'sort_order'              => 100,
            ]
        );

        $this->moduleDataSetup->getConnection()->endSetup();
    }

    /**
     * revert() comes from PatchRevertableInterface — optional, not from DataPatchInterface itself
     */
    public function revert(): void
    {
        $this->moduleDataSetup->getConnection()->startSetup();
        $eavSetup = $this->eavSetupFactory->create(['setup' => $this->moduleDataSetup]);
        $eavSetup->removeAttribute(Product::ENTITY, 'fabric_type');
        $this->moduleDataSetup->getConnection()->endSetup();
    }

    public static function getDependencies(): array
    {
        return []; // List dependent patches here
    }

    public function getAliases(): array
    {
        return [];
    }
}
```

**Exam focus:**
- Data patches implement `DataPatchInterface` and are applied once via `bin/magento setup:upgrade`
- `getDependencies()` ensures patch ordering
- `revert()` comes from the **optional** `PatchRevertableInterface` — it is NOT required by `DataPatchInterface` itself; implement it only when you want rollback support
- `apply_to` restricts attribute display to specific product types in the Admin form

### Source Models

Source models provide **option values** for `select`, `multiselect`, and `boolean` attribute inputs.

```php
<?php
// File: app/code/Vendor/Module/Model/Attribute/Source/FabricType.php

namespace Vendor\Module\Model\Attribute\Source;

use Magento\Eav\Model\Entity\Attribute\Source\AbstractSource;

class FabricType extends AbstractSource
{
    /**
     * Must return array of ['value' => ..., 'label' => ...]
     */
    public function getAllOptions(): array
    {
        if ($this->_options === null) {
            $this->_options = [
                ['value' => '',       'label' => __('-- Please Select --')],
                ['value' => 'cotton', 'label' => __('Cotton')],
                ['value' => 'polyester', 'label' => __('Polyester')],
                ['value' => 'silk',   'label' => __('Silk')],
                ['value' => 'wool',   'label' => __('Wool')],
            ];
        }
        return $this->_options;
    }

    /**
     * Used in layered navigation — returns flat array
     */
    public function toOptionArray(): array
    {
        return $this->getAllOptions();
    }
}
```

**Alternative: Extend AbstractSource with DB data**

```php
<?php
namespace Vendor\Module\Model\Attribute\Source;

use Magento\Eav\Model\Entity\Attribute\Source\AbstractSource;

class DynamicSource extends AbstractSource
{
    private \Vendor\Module\Model\ResourceModel\Option\CollectionFactory $collectionFactory;

    public function __construct(
        \Vendor\Module\Model\ResourceModel\Option\CollectionFactory $collectionFactory
    ) {
        $this->collectionFactory = $collectionFactory;
    }

    public function getAllOptions(): array
    {
        if ($this->_options === null) {
            $collection = $this->collectionFactory->create();
            $this->_options = [['value' => '', 'label' => __('None')]];
            foreach ($collection as $item) {
                $this->_options[] = [
                    'value' => $item->getId(),
                    'label' => $item->getLabel(),
                ];
            }
        }
        return $this->_options;
    }
}
```

**Exam focus:**
- Source models **must** implement `getAllOptions()` returning `[['value' => ..., 'label' => ...]]`
- Extend `AbstractSource` for EAV attributes, or implement `\Magento\Framework\Data\OptionSourceInterface` for non-EAV uses
- The `_options` caching pattern prevents redundant DB calls

### Backend Models

Backend models handle **data validation, transformation, and persistence logic** for attribute values.

<!-- CORRECTED: AbstractBackend has no beforeLoad() method. Verified hooks: validate(), afterLoad(),
     beforeSave(), afterSave(). There is NO beforeLoad() in AbstractBackend. -->

```php
<?php
// File: app/code/Vendor/Module/Model/Attribute/Backend/SerializedArray.php

namespace Vendor\Module\Model\Attribute\Backend;

use Magento\Eav\Model\Entity\Attribute\Backend\AbstractBackend;
use Magento\Framework\Exception\LocalizedException;

class SerializedArray extends AbstractBackend
{
    /**
     * Called before saving the entity
     */
    public function beforeSave($object): self
    {
        $attrCode = $this->getAttribute()->getAttributeCode();
        $value = $object->getData($attrCode);

        // Transform data before saving
        if (is_array($value)) {
            $object->setData($attrCode, json_encode($value));
        }

        return parent::beforeSave($object);
    }

    /**
     * Called after loading the entity
     */
    public function afterLoad($object): self
    {
        $attrCode = $this->getAttribute()->getAttributeCode();
        $value = $object->getData($attrCode);

        // Decode on load
        if (is_string($value) && !empty($value)) {
            $object->setData($attrCode, json_decode($value, true));
        }

        return parent::afterLoad($object);
    }

    /**
     * Validate before save
     */
    public function validate($object): bool
    {
        $attrCode = $this->getAttribute()->getAttributeCode();
        $value = $object->getData($attrCode);

        if ($this->getAttribute()->getIsRequired() && empty($value)) {
            throw new LocalizedException(__('"%1" is required.', $attrCode));
        }

        return parent::validate($object);
    }
}
```

**Core built-in backend models:**

<!-- CORRECTED: Magento\Catalog\Model\Product\Attribute\Backend\Media does NOT exist.
     Media gallery handling is via Magento\Catalog\Model\Product\Attribute\Backend\Media\ImageEntryConverter
     and related classes in the Media/ subdirectory. -->

| Backend Model | Purpose |
|---|---|
| `Magento\Eav\Model\Entity\Attribute\Backend\ArrayBackend` | Handles multiselect (implode/explode) |
| `Magento\Catalog\Model\Attribute\Backend\Startdate` | Date validation |
| `Magento\Catalog\Model\Product\Attribute\Backend\Price` | Price currency handling |
| `Magento\Catalog\Model\Product\Attribute\Backend\Media\ImageEntryConverter` | Media gallery entry handling |

**Exam focus:**
- Backend models hook into `beforeSave`, `afterSave`, `afterLoad`, `validate`
- NOTE: **`beforeLoad()` does NOT exist** on `AbstractBackend` — there is no pre-load hook
- The `ArrayBackend` for `multiselect` stores comma-separated values in the DB
- Backend model is specified via `'backend'` key in `addAttribute()` or `backend_model` column in DB

### Frontend Models

Frontend models control **how an attribute value is rendered** in HTML.

```php
<?php
// File: app/code/Vendor/Module/Model/Attribute/Frontend/ColorSwatch.php

namespace Vendor\Module\Model\Attribute\Frontend;

use Magento\Eav\Model\Entity\Attribute\Frontend\AbstractFrontend;

class ColorSwatch extends AbstractFrontend
{
    /**
     * Returns HTML for the attribute value
     */
    public function getValue(\Magento\Framework\DataObject $object): string
    {
        $value = $object->getData($this->getAttribute()->getAttributeCode());
        // Return custom HTML representation
        return '<span class="color-swatch" style="background:' . htmlspecialchars($value) . '"></span>';
    }
}
```

**Exam focus:**
- Frontend models are rarely needed — most rendering is done via templates and view models
- They implement `getValue()` which returns a formatted string/HTML
- Most attributes use the default `\Magento\Eav\Model\Entity\Attribute\Frontend\DefaultFrontend`

---

## 3. Product Types

### Overview

| Type | Code | Description |
|---|---|---|
| Simple | `simple` | Single SKU, physical or virtual |
| Configurable | `configurable` | Parent with configurable options (size, color) |
| Grouped | `grouped` | Collection of simple products sold together |
| Bundle | `bundle` | Customizable bundle of simple/virtual products |
| Downloadable | `downloadable` | Digital product with file/link |
| Virtual | `virtual` | Service or non-physical, no shipping |

### Architecture

```
Magento\Catalog\Model\Product\Type\AbstractType
          |
          +-- Simple    (Magento\Catalog\Model\Product\Type\Simple)
          |
          +-- Virtual   (Magento\Catalog\Model\Product\Type\Virtual)
          |
          +-- Configurable (Magento\ConfigurableProduct\Model\Product\Type\Configurable)
          |
          +-- Grouped   (Magento\GroupedProduct\Model\Product\Type\Grouped)
          |
          +-- Bundle    (Magento\Bundle\Model\Product\Type)
          |
          +-- Downloadable (Magento\Downloadable\Model\Product\Type)
```

### Extension Points Per Product Type

#### Simple Product
```xml
<!-- Most customization via plugins/observers on -->
<!-- Magento\Catalog\Model\Product\Type\Simple -->
```

Key extension points:
- **Price model**: `Magento\Catalog\Model\Product\Type\Price`
- **Index price**: `Magento\Catalog\Model\ResourceModel\Product\Indexer\Price\Simple`
- Plugin `beforeGetSku()`, `afterGetSku()` on the type model

#### Configurable Product
```php
// Extension points:
// 1. Plugin on Magento\ConfigurableProduct\Model\Product\Type\Configurable
// 2. Preference override for ConfigurableProduct\Pricing\Price\FinalPrice
// 3. Custom ConfigurableDataProvider for GraphQL

// Getting associated simple products:
$typeInstance = $product->getTypeInstance();
$simpleProducts = $typeInstance->getUsedProducts($product); // returns array of Product models
$configurableAttributes = $typeInstance->getConfigurableAttributes($product);
```

#### Bundle Product
```php
// Bundle has a complex option/selection system
// Extension points:
// 1. Plugin on Magento\Bundle\Model\Product\Type::getOptionsCollection()
// 2. Price model: Magento\Bundle\Model\Product\Price
// 3. Custom selection: plugin on Magento\Bundle\Model\Selection

$typeInstance = $product->getTypeInstance();
$optionsCollection = $typeInstance->getOptionsCollection($product);
$selectionsCollection = $typeInstance->getSelectionsCollection($optionIds, $product);
```

#### Downloadable Product
```php
// Extension points:
// 1. Magento\Downloadable\Model\Product\Type
// 2. Magento\Downloadable\Model\Link — add custom link types
// 3. Magento\Downloadable\Model\Sample

$typeInstance = $product->getTypeInstance();
$links = $typeInstance->getLinks($product);    // returns Link collection
$samples = $typeInstance->getSamples($product); // returns Sample collection
```

**Exam focus:**
- `getTypeInstance()` returns the product type model — use this to call type-specific methods
- Configurable products store the **child product SKUs**, not their own inventory directly
- Bundle products have **dynamic price** (sum of selections) or **fixed price** options
- Virtual products are like Simple but `is_virtual = 1` — no shipping required
- Downloadable automatically sets `is_virtual = 1`

---

## 4. Custom Product Type

### Step 1: Declare in `product_types.xml`

```xml
<!-- File: app/code/Vendor/Module/etc/product_types.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Catalog:etc/product_types.xsd">

    <type name="subscription"
          label="Subscription Product"
          modelInstance="Vendor\Module\Model\Product\Type\Subscription"
          indexPriority="10"
          sortOrder="100"
          isQty="true">

        <priceModel instance="Vendor\Module\Model\Product\Type\Price\Subscription" />

        <indexerModel instance="Vendor\Module\Model\ResourceModel\Product\Indexer\Price\Subscription" />

        <stockIndexerModel instance="Magento\CatalogInventory\Model\Indexer\Stock\Action" />

        <customAttributes>
            <attribute name="subscription_period" />
            <attribute name="billing_cycle" />
        </customAttributes>

    </type>

    <!-- Optionally restrict which existing attributes apply_to this type -->
    <compositeTypes>simple,virtual</compositeTypes>

</config>
```

### Step 2: Type Model

```php
<?php
// File: app/code/Vendor/Module/Model/Product/Type/Subscription.php

namespace Vendor\Module\Model\Product\Type;

use Magento\Catalog\Model\Product\Type\AbstractType;

class Subscription extends AbstractType
{
    /**
     * Type code — must match product_types.xml name attribute
     */
    const TYPE_CODE = 'subscription';

    /**
     * Can this type be part of a composite (grouped/bundle)?
     */
    public function isComposite($product = null): bool
    {
        return false;
    }

    /**
     * Is this a virtual (non-shippable) product?
     */
    public function isVirtual($product = null): bool
    {
        return true; // Subscription is digital
    }

    /**
     * Can the customer configure this product?
     */
    public function canConfigure($product = null): bool
    {
        return true;
    }

    /**
     * Return true if the product has options
     */
    public function hasOptions($product = null): bool
    {
        return false;
    }

    /**
     * Delete data specific to this product type before product is deleted
     */
    public function deleteTypeSpecificData(\Magento\Catalog\Model\Product $product): void
    {
        // Clean up subscription-specific records
    }

    /**
     * Check if product can be bought (used by quote/checkout)
     */
    public function isSalable($product = null): bool
    {
        // Custom salability logic
        return parent::isSalable($product);
    }
}
```

### Step 3: Price Model

```php
<?php
// File: app/code/Vendor/Module/Model/Product/Type/Price/Subscription.php

namespace Vendor\Module\Model\Product\Type\Price;

use Magento\Catalog\Model\Product\Type\Price;

class Subscription extends Price
{
    /**
     * Override price calculation
     * Note: parent getPrice() has no return type hint — matches parent signature
     */
    public function getPrice($product)
    {
        $basePrice = parent::getPrice($product);
        $period = $product->getData('subscription_period');

        // Apply discount based on subscription period
        $discount = match($period) {
            'monthly'  => 0.0,
            'annually' => 0.15, // 15% discount
            default    => 0.0,
        };

        return $basePrice * (1 - $discount);
    }

    /**
     * Final price calculation (after all modifiers)
     * Note: parent getFinalPrice() has no return type hint
     */
    public function getFinalPrice($qty, $product)
    {
        $price = $this->getPrice($product);
        // Apply tier pricing, special price, etc.
        return $this->_applyOptionsPrice($product, $qty, $price);
    }
}
```

### Step 4: Register Type in `di.xml`

```xml
<!-- File: app/code/Vendor/Module/etc/di.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">

    <!-- Map the product type to its price model -->
    <type name="Magento\Catalog\Model\Product\Type">
        <arguments>
            <argument name="types" xsi:type="array">
                <item name="subscription" xsi:type="array">
                    <item name="label" xsi:type="string">Subscription</item>
                    <item name="model" xsi:type="string">Vendor\Module\Model\Product\Type\Subscription</item>
                    <item name="composite" xsi:type="boolean">false</item>
                    <item name="indexPriority" xsi:type="string">10</item>
                </item>
            </argument>
        </arguments>
    </type>

</config>
```

**Exam focus:**
- Custom product types **must** extend `AbstractType` and implement `deleteTypeSpecificData()`
- `product_types.xml` is the **declarative** registry; `di.xml` wires up the object graph
- `priceModel` in `product_types.xml` points to the class used for price calculations
- `isQty="true"` means inventory (stock) management applies to this type

---

## 5. Category Attributes and Flat Catalog

### Adding Custom Category Attributes

```php
<?php
// File: app/code/Vendor/Module/Setup/Patch/Data/AddCategoryAttribute.php

namespace Vendor\Module\Setup\Patch\Data;

use Magento\Eav\Setup\EavSetupFactory;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;
use Magento\Catalog\Model\Category;

class AddCategoryAttribute implements DataPatchInterface
{
    public function __construct(
        private ModuleDataSetupInterface $moduleDataSetup,
        private EavSetupFactory $eavSetupFactory
    ) {}

    public function apply(): void
    {
        $this->moduleDataSetup->getConnection()->startSetup();
        $eavSetup = $this->eavSetupFactory->create(['setup' => $this->moduleDataSetup]);

        $eavSetup->addAttribute(
            Category::ENTITY,       // 'catalog_category'
            'promo_banner_image',
            [
                'type'       => 'varchar',
                'label'      => 'Promo Banner Image',
                'input'      => 'image',
                'required'   => false,
                'sort_order' => 10,
                'global'     => \Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface::SCOPE_STORE,
                'group'      => 'Display Settings',
                // Category-specific flags:
                'used_in_product_listing' => false,
                'visible'    => true,
            ]
        );

        $this->moduleDataSetup->getConnection()->endSetup();
    }

    public static function getDependencies(): array { return []; }
    public function getAliases(): array { return []; }
}
```

### Displaying Category Attribute in Layout/Template

```xml
<!-- File: app/code/Vendor/Module/view/frontend/layout/catalog_category_view.xml -->
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <block class="Vendor\Module\Block\Category\Banner"
                   name="category.promo.banner"
                   template="Vendor_Module::category/banner.phtml"
                   before="-" />
        </referenceContainer>
    </body>
</page>
```

```php
<?php
// File: app/code/Vendor/Module/Block/Category/Banner.php

namespace Vendor\Module\Block\Category;

use Magento\Framework\View\Element\Template;
use Magento\Catalog\Model\Layer\Resolver;

class Banner extends Template
{
    public function __construct(
        Template\Context $context,
        private \Magento\Catalog\Model\CategoryFactory $categoryFactory,
        private \Magento\Framework\Registry $registry,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    public function getCurrentCategory(): ?\Magento\Catalog\Model\Category
    {
        return $this->registry->registry('current_category');
    }

    public function getBannerImageUrl(): string
    {
        $category = $this->getCurrentCategory();
        if (!$category) {
            return '';
        }
        $image = $category->getData('promo_banner_image');
        return $image ? $this->_storeManager->getStore()->getBaseUrl(\Magento\Framework\UrlInterface::URL_TYPE_MEDIA)
            . 'catalog/category/' . $image : '';
    }
}
```

### Flat Catalog

The **flat catalog** is a de-normalized table structure that copies EAV attribute data into single, wide tables to improve read performance.

```
Standard EAV query (multiple JOINs):
  catalog_product_entity
    JOIN catalog_product_entity_varchar ON ...
    JOIN catalog_product_entity_int ON ...
    JOIN catalog_product_entity_decimal ON ...

Flat catalog (single table):
  catalog_product_flat_1  (store_id = 1)
    - All attribute columns in one table
    - One row per product per store
```

**Flat Tables:**
- `catalog_product_flat_{store_id}` — Products
- `catalog_category_flat_store_{store_id}` — Categories

#### Flat Catalog Configuration

```bash
# Enable flat catalog
bin/magento config:set catalog/frontend/flat_catalog_product 1
bin/magento config:set catalog/frontend/flat_catalog_category 1

# Reindex to rebuild flat tables
bin/magento indexer:reindex catalog_product_flat
bin/magento indexer:reindex catalog_category_flat
```

#### Including Custom Attributes in Flat Table

```php
// In your data patch, set:
'used_in_product_listing' => true,
// AND for categories, the attribute is automatically included if:
// - backend_type != 'text' (text columns excluded from flat)
// - The attribute is enabled for flat inclusion
```

**Exam focus:**
- Flat catalog is **disabled by default** in Magento 2 but still used in large deployments
- Attributes with `backend_type = 'text'` are **NOT included** in the flat table
- Setting `used_in_product_listing = true` includes the attribute in the flat product table
- After adding/removing attributes, you **must reindex** to update flat tables
- In **Elasticsearch/OpenSearch** setups, flat catalog importance is reduced since search uses ES indexes
- Category flat table is indexed by `catalog_category_flat` indexer

---

## 6. Price Modifiers

### Price Model Hierarchy

```
Magento\Catalog\Pricing\Price\FinalPrice
    |
    +-- RegularPrice         (base price from catalog_product_entity_decimal)
    |
    +-- SpecialPrice         (special_price with date range check)
    |
    +-- TierPrice            (qty-based discounts)
    |
    +-- CustomOptionPrice    (adds option costs)
    |
    +-- ConfigurableOptionPrice (for configurable products)
```

### Special Price

```php
// Special price is stored as a standard EAV decimal attribute
// with optional date range attributes: special_from_date, special_to_date

// Read special price in code:
$specialPrice = $product->getSpecialPrice();
$fromDate     = $product->getSpecialFromDate();
$toDate       = $product->getSpecialToDate();

// The final price calculation automatically uses special price if:
// 1. special_price is set
// 2. Current date is within special_from_date and special_to_date (or dates are null)
```

### Tier Pricing

```php
// Tier prices are stored in catalog_product_entity_tier_price table
// Structure: entity_id, all_groups, customer_group_id, qty, value, website_id, percentage_value

// Reading tier prices:
$tierPrices = $product->getTierPrices(); // returns array of Magento\Catalog\Api\Data\ProductTierPriceInterface

// Tier price via API:
/** @var \Magento\Catalog\Api\TierPriceStorageInterface $tierPriceStorage */
$tierPrice = $tierPriceStorage->get(['SKU-001']);
```

```xml
<!-- Adding tier price via REST API: POST /rest/V1/products/tier-prices -->
<!-- Body:
{
  "prices": [{
    "price": 45.00,
    "price_type": "fixed",
    "website_id": 0,
    "sku": "my-product-sku",
    "customer_group": "ALL GROUPS",
    "quantity": 5
  }]
}
-->
```

### Custom Price Calculation (Plugin Approach)

```php
<?php
// File: app/code/Vendor/Module/Plugin/Product/PricePlugin.php

namespace Vendor\Module\Plugin\Product;

use Magento\Catalog\Model\Product\Type\Price;

class PricePlugin
{
    /**
     * Modify final price after calculation.
     * Note: Price::getFinalPrice($qty, $product) has no type hints on arguments or return.
     * After plugin receives (subject, result, original_args...) so args match getFinalPrice signature.
     */
    public function afterGetFinalPrice(
        Price $subject,
        $result,
        $qty,
        \Magento\Catalog\Model\Product $product
    ) {
        // Apply custom 10% discount for specific attribute
        if ($product->getData('is_member_exclusive')) {
            $result = $result * 0.90;
        }
        return $result;
    }
}
```

```xml
<!-- Register the plugin in di.xml -->
<!-- File: app/code/Vendor/Module/etc/di.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
    <type name="Magento\Catalog\Model\Product\Type\Price">
        <plugin name="vendor_module_custom_price"
                type="Vendor\Module\Plugin\Product\PricePlugin"
                sortOrder="10" />
    </type>
</config>
```

### Custom Price via Pricing Pool (Preferred)

```php
<?php
// File: app/code/Vendor/Module/Pricing/Price/MemberPrice.php

namespace Vendor\Module\Pricing\Price;

use Magento\Catalog\Pricing\Price\RegularPrice;

class MemberPrice extends RegularPrice
{
    const PRICE_CODE = 'member_price';

    public function getValue()
    {
        $baseValue = parent::getValue();
        if ($this->product->getData('is_member_exclusive')) {
            return $baseValue * 0.90;
        }
        return $baseValue;
    }
}
```

<!-- CORRECTED: The pricing pool is NOT registered via PriceInfo\Factory.types.default.prices as an array.
     The Factory expects prices = string (class name of a Collection). The correct approach is to
     add to the Magento\Catalog\Pricing\Price\Pool virtualType which receives a flat prices array
     of ['code' => 'ClassName']. See vendor/magento/module-catalog/etc/di.xml:382 for the pattern. -->

```xml
<!-- Register in di.xml as part of price pool -->
<!-- The Pool virtualType holds the flat prices array — add to it: -->
<virtualType name="Magento\Catalog\Pricing\Price\Pool" type="Magento\Framework\Pricing\Price\Pool">
    <arguments>
        <argument name="prices" xsi:type="array">
            <item name="member_price" xsi:type="string">Vendor\Module\Pricing\Price\MemberPrice</item>
        </argument>
    </arguments>
</virtualType>
```

**Exam focus:**
- `getFinalPrice()` on the Product model triggers the full price calculation chain
- Special price bypasses tier pricing — Magento uses the **lowest** of special price vs tier price
- Tier prices can be **fixed** or **percentage discount**
- The `catalog_product_entity_tier_price` table is separate from EAV value tables
- Use the **pricing pool** (via `di.xml` virtualType override for `Magento\Catalog\Pricing\Price\Pool`) for clean price modifier injection rather than overriding price models

---

## 7. Layered Navigation

### Architecture

```
Layered Navigation Request
         |
         v
Magento\Catalog\Model\Layer
         |
         +-- FilterList (collects all applicable filters)
              |
              +-- AbstractFilter implementations:
                   |
                   +-- Category Filter
                   +-- Attribute Filter  <-- Uses source model getAllOptions()
                   +-- Price Filter
                   +-- Rating Filter (EE)
                   +-- Custom Filter
```

### Custom Layered Navigation Filter

#### Step 1: Filter Model

```php
<?php
// File: app/code/Vendor/Module/Model/Layer/Filter/FabricType.php

namespace Vendor\Module\Model\Layer\Filter;

use Magento\Catalog\Model\Layer\Filter\AbstractFilter;

class FabricType extends AbstractFilter
{
    const ATTRIBUTE_CODE = 'fabric_type';

    /**
     * Apply filter to the product collection
     */
    public function apply(\Magento\Framework\App\RequestInterface $request): self
    {
        $filterValue = $request->getParam($this->_requestVar);
        if (empty($filterValue)) {
            return $this;
        }

        // Add filter condition to collection
        $this->getLayer()->getProductCollection()
            ->addAttributeToFilter(self::ATTRIBUTE_CODE, $filterValue);

        // Register applied filter item for display
        $this->getLayer()->getState()->addFilter(
            $this->_createItem($this->getOptionText($filterValue), $filterValue)
        );

        return $this;
    }

    /**
     * Return available filter options with counts
     */
    public function getItems(): array
    {
        if ($this->_items === null) {
            $this->_items = [];
            $collection = $this->getLayer()->getProductCollection();

            // Get facet counts from search engine or DB
            $optionsFacetedData = $this->getFacetedData($collection);

            foreach ($this->getAttributeModel()->getSource()->getAllOptions() as $option) {
                if (empty($option['value'])) {
                    continue;
                }
                $count = $optionsFacetedData[$option['value']]['count'] ?? 0;
                if ($count > 0) {
                    $this->_items[] = $this->_createItem($option['label'], $option['value'], $count);
                }
            }
        }
        return $this->_items;
    }

    protected function getFacetedData($collection): array
    {
        // Implementation depends on search engine (MySQL vs Elasticsearch)
        return [];
    }
}
```

#### Step 2: Source Model with `getAllOptions()`

```php
<?php
// Source model (reused from attribute definition)
namespace Vendor\Module\Model\Attribute\Source;

use Magento\Eav\Model\Entity\Attribute\Source\AbstractSource;

class FabricType extends AbstractSource
{
    /**
     * Core method for layered navigation
     * Must return flat array of [value, label] pairs
     */
    public function getAllOptions(): array
    {
        return [
            ['value' => '',         'label' => __('')],
            ['value' => 'cotton',   'label' => __('Cotton')],
            ['value' => 'polyester','label' => __('Polyester')],
            ['value' => 'silk',     'label' => __('Silk')],
            ['value' => 'wool',     'label' => __('Wool')],
        ];
    }

    /**
     * Used for product listing (without empty option)
     */
    public function getOptionsText(): array
    {
        $options = [];
        foreach ($this->getAllOptions() as $option) {
            if ($option['value'] !== '') {
                $options[$option['value']] = $option['label'];
            }
        }
        return $options;
    }
}
```

#### Step 3: Register Filter Type in `di.xml`

<!-- CORRECTED: FilterList constructor takes array $filters which merges into $filterTypes.
     The expected format is a FLAT map: ['type_key' => 'ClassName'] — not a nested array.
     FilterList uses filterTypes to override built-in category/attribute/price/decimal type classes.
     Custom EAV attribute filters are created automatically for any filterable attribute, so this
     registration is only needed if you want to override the built-in ATTRIBUTE_FILTER handler. -->

```xml
<!-- File: app/code/Vendor/Module/etc/di.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">

    <!-- Override the attribute filter type with custom implementation -->
    <!-- FilterList.filters expects flat ['type_key' => 'ClassName'] — not nested arrays -->
    <type name="Magento\Catalog\Model\Layer\FilterList">
        <arguments>
            <argument name="filters" xsi:type="array">
                <item name="attribute" xsi:type="string">Vendor\Module\Model\Layer\Filter\FabricType</item>
            </argument>
        </arguments>
    </type>

</config>
```

### Layered Navigation With Elasticsearch

When Elasticsearch is the search engine, layered navigation uses **aggregations (facets)**:

```php
// The attribute must have these settings for ES layered nav:
// - is_filterable = 1 or is_filterable_in_search = 1
// - The attribute must be indexed (searchable or filterable)

// Elasticsearch automatically creates aggregations for filterable attributes
// Custom filters need to implement the facet bucket mechanism

// interface: Magento\Elasticsearch\SearchAdapter\Query\Builder\AbstractAggregation
```

**Exam focus:**
- `getAllOptions()` is the **critical method** — layered navigation calls this to build filter options
- The attribute **must have `is_filterable = 1`** to appear in layered navigation
- With Elasticsearch, filter counts come from ES aggregations (facets), not DB COUNT queries
- `is_filterable_in_search = 1` enables the filter on search results pages specifically
- The `FilterList` `filters` argument takes a flat `['type_key' => 'ClassName']` map — registered types override built-in filter class mappings

---

## 8. Practice Exercise

### Objective
Add a custom product attribute with a source model and verify it appears on the frontend via a custom template.

### Step-by-Step

#### 1. Create the module structure

```bash
mkdir -p app/code/Vendor/CatalogCustom/etc
mkdir -p app/code/Vendor/CatalogCustom/Setup/Patch/Data
mkdir -p app/code/Vendor/CatalogCustom/Model/Attribute/Source
mkdir -p app/code/Vendor/CatalogCustom/view/frontend/layout
mkdir -p app/code/Vendor/CatalogCustom/view/frontend/templates/product
```

#### 2. Module declaration files

```xml
<!-- File: app/code/Vendor/CatalogCustom/etc/module.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="Vendor_CatalogCustom">
        <sequence>
            <module name="Magento_Catalog"/>
            <module name="Magento_Eav"/>
        </sequence>
    </module>
</config>
```

```json
{
  "name": "vendor/catalog-custom",
  "description": "Custom Catalog Attributes",
  "require": {
    "php": "~8.1.0||~8.2.0",
    "magento/framework": "*",
    "magento/module-catalog": "*",
    "magento/module-eav": "*"
  },
  "type": "magento2-module",
  "autoload": {
    "files": ["registration.php"],
    "psr-4": {
      "Vendor\\CatalogCustom\\": ""
    }
  }
}
```

```php
<?php
// File: app/code/Vendor/CatalogCustom/registration.php
use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::MODULE,
    'Vendor_CatalogCustom',
    __DIR__
);
```

#### 3. Data Patch

```php
<?php
// File: app/code/Vendor/CatalogCustom/Setup/Patch/Data/AddFabricTypeAttribute.php

namespace Vendor\CatalogCustom\Setup\Patch\Data;

use Magento\Catalog\Model\Product;
use Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface;
use Magento\Eav\Setup\EavSetupFactory;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;

class AddFabricTypeAttribute implements DataPatchInterface
{
    public function __construct(
        private ModuleDataSetupInterface $moduleDataSetup,
        private EavSetupFactory $eavSetupFactory
    ) {}

    public function apply(): void
    {
        $this->moduleDataSetup->getConnection()->startSetup();
        $eavSetup = $this->eavSetupFactory->create(['setup' => $this->moduleDataSetup]);

        $eavSetup->addAttribute(Product::ENTITY, 'fabric_type', [
            'type'                    => 'varchar',
            'label'                   => 'Fabric Type',
            'input'                   => 'select',
            'source'                  => \Vendor\CatalogCustom\Model\Attribute\Source\FabricType::class,
            'required'                => false,
            'global'                  => ScopedAttributeInterface::SCOPE_GLOBAL,
            'visible'                 => true,
            'searchable'              => true,
            'filterable'              => true,
            'visible_on_front'        => true,
            'used_in_product_listing' => true,
            'apply_to'               => 'simple,configurable,virtual',
            'group'                   => 'General',
        ]);

        $this->moduleDataSetup->getConnection()->endSetup();
    }

    public static function getDependencies(): array { return []; }
    public function getAliases(): array { return []; }
}
```

#### 4. Run setup

```bash
bin/magento module:enable Vendor_CatalogCustom
bin/magento setup:upgrade
bin/magento cache:flush
bin/magento indexer:reindex
```

#### 5. Add layout override to inject block on product page

```xml
<!-- File: app/code/Vendor/CatalogCustom/view/frontend/layout/catalog_product_view.xml -->
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceBlock name="product.info.details">
            <block class="Magento\Catalog\Block\Product\View"
                   name="product.fabric.type"
                   template="Vendor_CatalogCustom::product/fabric_type.phtml"
                   after="-" />
        </referenceBlock>
    </body>
</page>
```

#### 6. Create template

```php
<?php
// File: app/code/Vendor/CatalogCustom/view/frontend/templates/product/fabric_type.phtml
/** @var \Magento\Catalog\Block\Product\View $block */
$product = $block->getProduct();
$fabricType = $product->getAttributeText('fabric_type'); // Gets label from source model
?>
<?php if ($fabricType): ?>
<div class="product-fabric-type">
    <strong><?= $block->escapeHtml(__('Fabric Type')) ?>:</strong>
    <span><?= $block->escapeHtml($fabricType) ?></span>
</div>
<?php endif; ?>
```

#### 7. Verify in database

```sql
-- Verify attribute was created
SELECT a.attribute_id, a.attribute_code, a.backend_type, a.source_model, a.frontend_input
FROM eav_attribute a
JOIN eav_entity_type et ON a.entity_type_id = et.entity_type_id
WHERE et.entity_type_code = 'catalog_product'
AND a.attribute_code = 'fabric_type';

-- Check it's in an attribute set
SELECT aset.attribute_set_name, ag.attribute_group_name
FROM eav_entity_attribute ea
JOIN eav_attribute_set aset ON ea.attribute_set_id = aset.attribute_set_id
JOIN eav_attribute_group ag ON ea.attribute_group_id = ag.attribute_group_id
WHERE ea.attribute_id = (
    SELECT attribute_id FROM eav_attribute WHERE attribute_code = 'fabric_type'
);
```

---

## 9. CE vs EE Differences

### Community Edition (CE / Open Source)

| Feature | CE Behavior |
|---|---|
| Staging | No content staging — attribute changes are immediate |
| Customer Segments | Not available (no targeted catalog rules per segment) |
| Visual Merchandiser | Not available |
| Shared Catalog | Not available |
| GiftCard product type | Not available |
| Reward Points | Not available |

### Enterprise Edition (EE / Commerce)

#### Staging and Scheduling

```
Product Attribute Update Flow in EE:

Admin saves attribute value
         |
         v
Staging Update Created (scheduled)
         |
         v
Values stored in staging_update tables
         |
         v
Cron publishes update at scheduled time
         |
         v
Production tables updated
```

**Exam focus:**
- In EE, product saves go through the **staging** subsystem — `Magento\Staging\Model\UpdateInterface`
- The `sequence_product` table tracks entity versioning
- `catalog_product_entity.row_id` (EE) vs `entity_id` (CE) — EE uses `row_id` for versioned rows
- Custom attributes in EE must account for staging: **do not hardcode `entity_id`** in queries, use `row_id`

#### EE-Specific Column: `row_id`

```sql
-- CE: entity_id is the stable product identifier
-- catalog_product_entity: entity_id = 123

-- EE: row_id changes with each staging version
-- catalog_product_entity: entity_id = 123, row_id = 456 (current live version)
--                          entity_id = 123, row_id = 457 (scheduled future version)

-- CE EAV value table join:
SELECT * FROM catalog_product_entity_varchar
WHERE entity_id = 123 AND attribute_id = 456;

-- EE EAV value table join (must use row_id):
SELECT v.* FROM catalog_product_entity_varchar v
JOIN catalog_product_entity e ON v.row_id = e.row_id
WHERE e.entity_id = 123 AND v.attribute_id = 456;
```

#### EE-Only Product Types

| Type | Description |
|---|---|
| `giftcard` | Gift card product type |
| `bundle` (enhanced) | More pricing options in EE |

#### Shared Catalog (B2B EE)

```php
// In B2B EE, product visibility and pricing can be scoped per company
// Custom attributes must be indexed in shared catalog context

// Check if shared catalog is enabled:
$sharedCatalog = $this->config->getValue(
    \Magento\SharedCatalog\Model\Config::CONFIG_SHARED_CATALOG,
    \Magento\Store\Model\ScopeInterface::SCOPE_WEBSITE
);
```

**Exam focus:**
- The `row_id` vs `entity_id` distinction is a **critical EE exam topic**
- Custom resource models in EE that use raw SQL must join on `row_id`, not `entity_id`
- Data patches run the same way in EE but attribute values may be versioned through staging
- `catalog_product_entity.created_in` and `updated_in` are EE-only staging columns

---

## Quick-Reference Checklist

### EAV Architecture
- [ ] `eav_entity_type` stores entity type codes (`catalog_product`, `catalog_category`, `customer`)
- [ ] `eav_attribute` is the central table — `backend_type` determines which value table is used
- [ ] `backend_type = 'static'` stores in the main entity table, not value tables
- [ ] `backend_type` options: `varchar`, `int`, `decimal`, `text`, `datetime`, `static`
- [ ] Attribute sets group attributes for the Admin UI form; sets don't restrict stored data
- [ ] `eav_entity_attribute` is the join table: attribute ↔ set ↔ group

### Custom Product Attributes
- [ ] Data Patches implement `DataPatchInterface` with `apply()`, `getDependencies()`, `getAliases()`
- [ ] `revert()` is from optional `PatchRevertableInterface` — NOT required by `DataPatchInterface`
- [ ] Run with `bin/magento setup:upgrade` — applied **exactly once** per installation
- [ ] `apply_to` restricts which product types show the attribute in Admin
- [ ] Source model must implement `getAllOptions()` returning `[['value' => ..., 'label' => ...]]`
- [ ] Backend model hooks: `beforeSave`, `afterSave`, `afterLoad`, `validate` — NOTE: **no `beforeLoad()` hook**
- [ ] Multiselect uses `ArrayBackend` — stores comma-separated values
- [ ] `used_in_product_listing = true` includes attribute in flat table and listing queries
- [ ] `getAttributeText('code')` returns the label from the source model

### Product Types
- [ ] 6 built-in types: Simple, Configurable, Grouped, Bundle, Downloadable, Virtual
- [ ] `getTypeInstance()` returns the product type model for type-specific operations
- [ ] Configurable: child SKUs in `catalog_product_super_link`; options in `catalog_product_super_attribute`
- [ ] Bundle: can be fixed or dynamic price; options in `catalog_product_bundle_option`
- [ ] Downloadable and Virtual set `is_virtual = 1` — no shipping required
- [ ] Custom types extend `AbstractType` and must implement `deleteTypeSpecificData()`

### Custom Product Type
- [ ] Declare in `etc/product_types.xml` with `name`, `modelInstance`, `priceModel`
- [ ] `isQty="true"` enables inventory management for the type
- [ ] Wire via `di.xml` in `Magento\Catalog\Model\Product\Type` `types` argument
- [ ] Price model extends `Magento\Catalog\Model\Product\Type\Price` — override `getPrice()` / `getFinalPrice()`

### Flat Catalog
- [ ] Flat catalog disabled by default — enable via `catalog/frontend/flat_catalog_product`
- [ ] Creates `catalog_product_flat_{store_id}` per store view
- [ ] `text` backend type attributes **excluded** from flat table
- [ ] Must reindex after attribute changes: `bin/magento indexer:reindex catalog_product_flat`

### Category Attributes
- [ ] Added via `EavSetupFactory` using `Category::ENTITY` entity type code
- [ ] Retrieved in templates via `$category->getData('attribute_code')` or `getAttributeText()`
- [ ] Use `\Magento\Framework\Registry` (deprecated) or `\Magento\Catalog\Model\Layer\Resolver` to get current category

### Price Modifiers
- [ ] Price chain: `RegularPrice` → `SpecialPrice` → `TierPrice` → `CustomOptionPrice` → `FinalPrice`
- [ ] Special price is used when lower than tier price — Magento picks the minimum
- [ ] Tier prices stored in `catalog_product_entity_tier_price` — separate from EAV
- [ ] Plugin on `Magento\Catalog\Model\Product\Type\Price` is the simplest price override approach
- [ ] Preferred approach: add custom price to `Magento\Catalog\Pricing\Price\Pool` virtualType via `di.xml`
- [ ] `percentage_value` column in tier price table enables percentage discounts

### Layered Navigation
- [ ] Attribute must have `is_filterable = 1` to appear in layered navigation
- [ ] `is_filterable_in_search = 1` for search results pages
- [ ] Custom filters extend `AbstractFilter` — implement `apply()` and `getItems()`
- [ ] `getAllOptions()` is called by layered nav to build filter option display
- [ ] `FilterList` `filters` argument expects flat `['type_key' => 'ClassName']` — overrides built-in handlers
- [ ] Elasticsearch uses aggregations (facets) instead of COUNT SQL for filter counts

### CE vs EE Critical Differences
- [ ] EE has **content staging** — product saves create versioned updates
- [ ] EE uses `row_id` in EAV value tables; CE uses `entity_id`
- [ ] Raw SQL in EE must join on `row_id`, not `entity_id`
- [ ] EE-only product type: `giftcard`
- [ ] EE has B2B Shared Catalog, Customer Segments, Visual Merchandiser
- [ ] EE staging columns: `created_in`, `updated_in` on `catalog_product_entity`

### Commands Reference
```bash
bin/magento setup:upgrade                      # Apply data patches
bin/magento indexer:reindex catalog_product_flat   # Rebuild flat product table
bin/magento indexer:reindex catalog_category_flat  # Rebuild flat category table
bin/magento cache:flush                        # Clear all caches
bin/magento config:set catalog/frontend/flat_catalog_product 1  # Enable flat
# NOTE: bin/magento eav:attributes:cleanup does NOT exist in Magento 2.4.8-p3
```
