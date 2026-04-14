# Service Contracts, Repositories & Extension Attributes
### Magento 2 Certified Professional Architect — Study Notes

---

## Table of Contents

1. [Overview & Architectural Philosophy](#1-overview--architectural-philosophy)
2. [The Api/ Directory Structure](#2-the-api-directory-structure)
3. [Api/Data/ — Pure Data Objects](#3-apidata--pure-data-objects)
4. [SearchCriteriaInterface & Filtering](#4-searchcriteriainterface--filtering)
5. [SearchResultsInterface — Why Not Just an Array?](#5-searchresultsinterface--why-not-just-an-array)
6. [Repository Pattern Deep Dive](#6-repository-pattern-deep-dive)
7. [Extension Attributes (NOT EAV)](#7-extension-attributes-not-eav)
8. [The Critical getList() + extensionAttributesJoinProcessor Gap](#8-the-critical-getlist--extensionattributesjoinprocessor-gap)
9. [Deprecation Policy & @deprecated](#9-deprecation-policy--deprecated)
10. [Hands-On: Tracing ProductRepositoryInterface::getById()](#10-hands-on-tracing-productrepositoryinterfacegetbyid)
11. [Scenario-Based Architect Exam Traps](#11-scenario-based-architect-exam-traps)
12. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Overview & Architectural Philosophy

Magento 2's service contract layer is the **foundational architectural decision** that separates it from Magento 1. It answers the question: *"How do two modules exchange data without creating hidden coupling?"*

```
+-------------------+        Service Contract         +-------------------+
|   Consumer        |  ============================>  |   Provider        |
|  (another module, |        (Interface only,          |  (Implementation, |
|   REST, GraphQL)  |         no concrete class)       |   DB, cache, etc) |
+-------------------+                                 +-------------------+
```

### The Core Promise

> **A service contract is a versioned, stable API boundary.** The consumer depends only on the interface. The provider can refactor internals freely as long as the interface is honoured.

**Why this matters for the architect exam:**
The exam will never ask "what method does ProductRepositoryInterface have?" — it will ask "why is the interface in `Api/` and not `Model/`?" or "what breaks if you bypass the repository and call the resource model directly?"

- **Exam focus:** The `Api/` directory is a **contract boundary**, not just a folder convention. Moving a class out of `Api/` is a breaking change per Magento versioning policy.
- **Exam focus:** Modules should depend on **interfaces**, not concrete classes. Magento's DI system (`di.xml`) maps interfaces to implementations, allowing substitution without touching consumer code.

---

## 2. The Api/ Directory Structure

### The `@api` Annotation

```php
/**
 * Product Repository Interface
 *
 * @api
 * @since 100.0.2
 */
interface ProductRepositoryInterface
{
    // ...
}
```

The `@api` annotation is a **code-level contract declaration**. It signals:

| What it means | Consequence |
|---|---|
| This interface/method is part of the stable public API | Changes require a major version bump (Magento semantic versioning) |
| Third-party code may depend on this | The core team cannot silently refactor it |
| REST/GraphQL endpoints may be generated from it | The signature affects API schema |

**What belongs in `Api/`:**

```
VendorName/
  ModuleName/
    Api/
      ProductRepositoryInterface.php      <-- Repository CRUD operations
      ProductManagementInterface.php      <-- Complex business operations
      Data/
        ProductInterface.php              <-- Data transfer object shape
        ProductSearchResultsInterface.php <-- Paginated list results
```

- **Exam focus:** `@api` on a **method** means that specific method is stable even if the class/interface it belongs to is not fully annotated. The annotation cascades but can be narrowed.
- **Exam focus:** Classes/interfaces **without** `@api` can be changed between minor versions. This is why you must **never** depend on `\Magento\Catalog\Model\Product` directly in cross-module code — it has no `@api` stability guarantee.

### What `@api` Does NOT Do

It does **not** make a class final. It does **not** prevent extension. It is purely a **documentation/policy contract** enforced by code review and static analysis tools (`magento/magento-coding-standard`).

---

## 3. Api/Data/ — Pure Data Objects

### The Data Interface Pattern

`Api/Data/` interfaces define the **shape of data** — what fields exist, what types they are. They are **not** business logic containers.

```php
<?php
namespace Magento\Catalog\Api\Data;

/**
 * @api
 * @since 100.0.2
 */
interface ProductInterface extends \Magento\Framework\Api\CustomAttributesDataInterface
{
    /**#@+
     * Constants defined for keys of data array
     */
    const SKU   = 'sku';
    const NAME  = 'name';
    const PRICE = 'price';

    /**
     * @return string
     */
    public function getSku(): string;

    /**
     * @param string $sku
     * @return $this
     */
    public function setSku(string $sku): self;

    /**
     * @return float|null
     */
    public function getPrice(): ?float;

    /**
     * @param float $price
     * @return $this
     */
    public function setPrice(float $price): self;

    // Extension attributes accessor (critical — see Section 7)
    /**
     * @return \Magento\Catalog\Api\Data\ProductExtensionInterface|null
     */
    public function getExtensionAttributes(): ?\Magento\Catalog\Api\Data\ProductExtensionInterface;

    /**
     * @param \Magento\Catalog\Api\Data\ProductExtensionInterface $extensionAttributes
     * @return $this
     */
    public function setExtensionAttributes(
        \Magento\Catalog\Api\Data\ProductExtensionInterface $extensionAttributes
    ): self;
}
```

### Why Typed Getters/Setters Instead of a Magic Array?

| Approach | Problem |
|---|---|
| `$product['price']` array | No type safety, no IDE autocomplete, REST schema generation impossible |
| `$product->getData('price')` | Same — magic string keys, untraceable |
| `$product->getPrice(): float` | Type-checked, documentable, REST/GraphQL schema auto-generated, mockable |

- **Exam focus:** The REST API **auto-generates** endpoints from `@api`-annotated interfaces. The return type hint on getters determines the JSON serialization type. If you return `mixed`, the REST layer cannot reliably serialize it.
- **Exam focus:** `Api/Data/` objects are **Data Transfer Objects (DTOs)**. They should contain no business logic. Validation, computation, and persistence belong elsewhere.

### The Implementation: `AbstractExtensibleModel`

The concrete `\Magento\Catalog\Model\Product` implements `ProductInterface` by extending `AbstractExtensibleModel`, which provides:
- `getData()`/`setData()` internal storage
- Custom attributes support
- Extension attributes storage

The **interface is what you code against**. The concrete class is what Magento injects via `di.xml`.

---

## 4. SearchCriteriaInterface & Filtering

### The Full Object Graph

```
SearchCriteriaInterface
    |
    +-- getFilterGroups(): FilterGroup[]
    |       |
    |       +-- getFilters(): Filter[]
    |               |
    |               +-- getField(): string      (e.g., 'sku')
    |               +-- getValue(): string      (e.g., 'MH01')
    |               +-- getConditionType(): string (e.g., 'eq', 'like', 'in')
    |
    +-- getSortOrders(): SortOrder[]
    |       |
    |       +-- getField(): string
    |       +-- getDirection(): string  ('ASC' or 'DESC')
    |
    +-- getCurrentPage(): int
    +-- getPageSize(): int
```

### Filter Logic: AND vs OR

This is a **classic exam trap**:

- **Filters within the same `FilterGroup`** = **OR** conditions
- **Filters in different `FilterGroup`s** = **AND** conditions

```php
<?php
use Magento\Framework\Api\SearchCriteriaBuilder;
use Magento\Framework\Api\FilterBuilder;

// Find products where (status = 1) AND (price < 50 OR price > 200)

$lowPrice = $filterBuilder
    ->setField('price')
    ->setValue(50)
    ->setConditionType('lt')
    ->create();

$highPrice = $filterBuilder
    ->setField('price')
    ->setValue(200)
    ->setConditionType('gt')
    ->create();

// These two filters are in the SAME group = OR
$searchCriteria = $searchCriteriaBuilder
    ->addFilters([$lowPrice, $highPrice])   // one FilterGroup, two filters = OR
    ->addFilter('status', 1, 'eq')          // separate addFilter = new FilterGroup = AND
    ->setPageSize(20)
    ->setCurrentPage(1)
    ->create();
```

- **Exam focus:** `addFilter()` on `SearchCriteriaBuilder` creates a **new FilterGroup** each time it is called. `addFilters([filter1, filter2])` puts both into the **same FilterGroup** (OR). Confusing them produces wrong query logic with no error — a silent bug.

### Condition Types Reference

| Condition | SQL equivalent |
|---|---|
| `eq` | `= ?` |
| `neq` | `!= ?` |
| `like` | `LIKE ?` |
| `in` | `IN (?)` |
| `nin` | `NOT IN (?)` |
| `lt` | `< ?` |
| `lte` | `<= ?` |
| `gt` | `> ?` |
| `gte` | `>= ?` |
| `null` | `IS NULL` |
| `notnull` | `IS NOT NULL` |

---

## 5. SearchResultsInterface — Why Not Just an Array?

### The Interface

```php
<?php
namespace Magento\Framework\Api;

/**
 * @api
 */
interface SearchResultsInterface
{
    /**
     * @return \Magento\Framework\Api\ExtensibleDataInterface[]
     */
    public function getItems(): array;

    /**
     * @param \Magento\Framework\Api\ExtensibleDataInterface[] $items
     * @return $this
     */
    public function setItems(array $items): self;

    /**
     * @return \Magento\Framework\Api\SearchCriteriaInterface
     */
    public function getSearchCriteria(): SearchCriteriaInterface;

    /**
     * @return int
     */
    public function getTotalCount(): int;
}
```

### Why a Typed Object, Not a Raw Array?

| Requirement | Raw `array` | `SearchResultsInterface` |
|---|---|---|
| REST API serialization | Ambiguous — no schema | Predictable JSON `{ items: [], total_count: N }` |
| Pagination metadata | Must be passed separately | `getTotalCount()` built in |
| Applied search criteria (for clients) | Lost | `getSearchCriteria()` returns what was applied |
| Type safety in downstream code | None | Typed, mockable, testable |
| GraphQL schema generation | Impossible | Derivable from interface |

- **Exam focus:** `getItems()` returns `array` (of typed objects), not the object itself being iterable, because REST API serializers use reflection on the **return type annotation** to determine the JSON structure. Returning a plain `array` from a non-annotated method would break auto-serialization.
- **Exam focus:** `getTotalCount()` is **not** `count($result->getItems())`. The total count reflects **all matching records** before pagination. This is essential for frontend pagination controls. A repository returning `count(items)` as total count is a **bug**.

---

## 6. Repository Pattern Deep Dive

### The Standard Repository Interface Contract

```php
<?php
namespace Magento\Catalog\Api;

/**
 * @api
 * @since 100.0.2
 */
interface ProductRepositoryInterface
{
    /**
     * @param string $sku
     * @param bool $editMode
     * @param int|null $storeId
     * @param bool $forceReload
     * @return \Magento\Catalog\Api\Data\ProductInterface
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     */
    public function get(string $sku, bool $editMode = false, ?int $storeId = null, bool $forceReload = false);

    /**
     * @param int $productId
     * @param bool $editMode
     * @param int|null $storeId
     * @param bool $forceReload
     * @return \Magento\Catalog\Api\Data\ProductInterface
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     */
    public function getById(int $productId, bool $editMode = false, ?int $storeId = null, bool $forceReload = false);

    /**
     * @param \Magento\Catalog\Api\Data\ProductInterface $product
     * @param bool $saveOptions
     * @return \Magento\Catalog\Api\Data\ProductInterface
     * @throws \Magento\Framework\Exception\CouldNotSaveException
     * @throws \Magento\Framework\Exception\InputException
     */
    public function save(\Magento\Catalog\Api\Data\ProductInterface $product, bool $saveOptions = false);

    /**
     * @param \Magento\Catalog\Api\Data\ProductInterface $product
     * @return bool
     * @throws \Magento\Framework\Exception\CouldNotDeleteException
     * @throws \Magento\Framework\Exception\StateException
     */
    public function delete(\Magento\Catalog\Api\Data\ProductInterface $product): bool;

    /**
     * @param string $sku
     * @return bool
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     * @throws \Magento\Framework\Exception\CouldNotDeleteException
     */
    public function deleteById(string $sku): bool;

    /**
     * @param \Magento\Framework\Api\SearchCriteriaInterface $searchCriteria
     * @return \Magento\Catalog\Api\Data\ProductSearchResultsInterface
     * @throws \Magento\Framework\Exception\LocalizedException
     */
    public function getList(\Magento\Framework\Api\SearchCriteriaInterface $searchCriteria);
}
```

### Critical Rule: `getById()` NEVER Returns Null

```php
<?php
// WRONG — this code path will NEVER execute
$product = $productRepository->getById(9999);
if ($product === null) {
    // handle missing product
}

// CORRECT — always use try/catch
try {
    $product = $productRepository->getById(9999);
} catch (\Magento\Framework\Exception\NoSuchEntityException $e) {
    // Product does not exist — handle here
    $this->logger->info('Product not found: ' . $e->getMessage());
}
```

**Why this design decision?**

> Returning `null` from a typed-return-hint method creates ambiguity: *is `null` "not found" or "an error occurred"?* By throwing `NoSuchEntityException`, the contract is unambiguous: either you get a valid object, or an exception tells you exactly why.

- **Exam focus:** A repository that returns `null` instead of throwing `NoSuchEntityException` **violates the service contract**. The REST API layer catches `NoSuchEntityException` and converts it to an HTTP 404 automatically. A `null` return would serialize as an empty response — a different and incorrect behaviour.
- **Exam focus:** The exception class hierarchy matters: `NoSuchEntityException` extends `LocalizedException` which extends `\Exception`. The REST API maps specific exception types to HTTP codes.

### Exception-to-HTTP Mapping

| Exception | HTTP Status |
|---|---|
| `NoSuchEntityException` | 404 Not Found |
| `CouldNotSaveException` | 500 Internal Server Error |
| `CouldNotDeleteException` | 500 Internal Server Error |
| `AuthorizationException` | 403 Forbidden |
| `InputException` | 400 Bad Request |
| `LocalizedException` (generic) | 500 Internal Server Error |

---

## 7. Extension Attributes (NOT EAV)

### The Architecture: Why Extension Attributes Exist

Magento has multiple attribute systems. Confusing them is a major exam trap:

```
Attribute Systems Comparison
+----------------------+------------------+------------------------+---------------------+
| System               | Storage          | Schema Change Required | Use Case            |
+----------------------+------------------+------------------------+---------------------+
| EAV (Custom Attr.)   | eav_attribute +  | No (dynamic)           | Admin-configurable  |
|                      | value tables     |                        | product attributes  |
+----------------------+------------------+------------------------+---------------------+
| Extension Attributes | Separate join    | YES (db_schema.xml)    | Module-to-module    |
|                      | table (your own) |                        | data extension      |
+----------------------+------------------+------------------------+---------------------+
| Custom Attributes    | EAV tables       | No                     | Frontend/admin      |
|                      |                  |                        | attribute values    |
+----------------------+------------------+------------------------+---------------------+
```

- **Exam focus:** Extension attributes are **NOT EAV**. They do not use EAV value tables. They require **your own database table** and a **join** to load. This is intentional — EAV has severe performance problems at scale, and extension attributes force developers to think about their storage strategy.

### Declaring Extension Attributes

**Step 1: `extension_attributes.xml`**

```xml
<?xml version="1.0"?>
<!-- File: VendorName/ModuleName/etc/extension_attributes.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Api/etc/extension_attributes.xsd">
    <extension_attributes for="Magento\Catalog\Api\Data\ProductInterface">
        <attribute code="vendor_warranty_years" type="int" />
        <attribute code="vendor_certifications" type="VendorName\ModuleName\Api\Data\CertificationInterface[]" />
    </extension_attributes>
</extension_attributes>
```

**Step 2: Magento auto-generates the Extension Interface**

After running `bin/magento setup:di:compile`, Magento generates:

```php
<?php
// Auto-generated: Magento\Catalog\Api\Data\ProductExtensionInterface
namespace Magento\Catalog\Api\Data;

interface ProductExtensionInterface extends \Magento\Framework\Api\ExtensionAttributesInterface
{
    /**
     * @return int|null
     */
    public function getVendorWarrantyYears(): ?int;

    /**
     * @param int $vendorWarrantyYears
     * @return $this
     */
    public function setVendorWarrantyYears(int $vendorWarrantyYears): self;

    /**
     * @return \VendorName\ModuleName\Api\Data\CertificationInterface[]|null
     */
    public function getVendorCertifications(): ?array;

    /**
     * @param \VendorName\ModuleName\Api\Data\CertificationInterface[] $vendorCertifications
     * @return $this
     */
    public function setVendorCertifications(array $vendorCertifications): self;
}
```

**Step 3: Loading extension attributes via Plugin**

Since extension attributes live in a separate table, you need a **plugin on the repository** to join/load them:

```php
<?php
namespace VendorName\ModuleName\Plugin\Repository;

use Magento\Catalog\Api\Data\ProductInterface;
use Magento\Catalog\Api\ProductRepositoryInterface;
use VendorName\ModuleName\Model\ResourceModel\Warranty as WarrantyResource;

class ProductRepositoryPlugin
{
    private WarrantyResource $warrantyResource;

    public function __construct(WarrantyResource $warrantyResource)
    {
        $this->warrantyResource = $warrantyResource;
    }

    /**
     * After getById — load extension attributes for single product
     */
    public function afterGetById(
        ProductRepositoryInterface $subject,
        ProductInterface $result
    ): ProductInterface {
        return $this->attachExtensionAttributes($result);
    }

    /**
     * After get — load extension attributes for single product by SKU
     */
    public function afterGet(
        ProductRepositoryInterface $subject,
        ProductInterface $result
    ): ProductInterface {
        return $this->attachExtensionAttributes($result);
    }

    private function attachExtensionAttributes(ProductInterface $product): ProductInterface
    {
        $extensionAttributes = $product->getExtensionAttributes()
            ?? $this->extensionAttributesFactory->create(ProductInterface::class);

        $warrantyYears = $this->warrantyResource->getWarrantyYearsByProductId(
            (int) $product->getId()
        );

        $extensionAttributes->setVendorWarrantyYears($warrantyYears);
        $product->setExtensionAttributes($extensionAttributes);

        return $product;
    }
}
```

```xml
<!-- di.xml -->
<type name="Magento\Catalog\Api\ProductRepositoryInterface">
    <plugin name="vendor_module_product_warranty_loader"
            type="VendorName\ModuleName\Plugin\Repository\ProductRepositoryPlugin"
            sortOrder="10" />
</type>
```

- **Exam focus:** Extension attributes are loaded via **after plugins on the repository** — not in the resource model, not in the model itself, and not automatically. This is by design: it keeps the core repository clean and lets modules opt in.

---

## 8. The Critical `getList()` + `extensionAttributesJoinProcessor` Gap

### The Problem — The Most Missed Concept in Module Development

When you call `getList()` on a repository, the default implementation:
1. Applies your `SearchCriteria` to the collection
2. Iterates the collection
3. Returns items

**It does NOT automatically call your extension attribute loading plugins for each item.**

More precisely: the `extensionAttributesJoinProcessor` is responsible for translating `SearchCriteria` filters on extension attribute fields into JOIN clauses on the collection query. Without it:

- You **cannot filter** `getList()` by extension attribute fields
- Extension attributes **may not be populated** on returned items (depending on implementation)

### The Fix — Explicit `process()` Call in `getList()` Implementation

```php
<?php
namespace VendorName\ModuleName\Model;

use Magento\Framework\Api\ExtensionAttribute\JoinProcessorInterface;
use Magento\Framework\Api\SearchCriteriaInterface;

class ProductRepository implements \Magento\Catalog\Api\ProductRepositoryInterface
{
    private JoinProcessorInterface $extensionAttributesJoinProcessor;
    private \Magento\Catalog\Model\ResourceModel\Product\CollectionFactory $collectionFactory;

    public function __construct(
        JoinProcessorInterface $extensionAttributesJoinProcessor,
        \Magento\Catalog\Model\ResourceModel\Product\CollectionFactory $collectionFactory
        // ... other deps
    ) {
        $this->extensionAttributesJoinProcessor = $extensionAttributesJoinProcessor;
        $this->collectionFactory = $collectionFactory;
    }

    public function getList(SearchCriteriaInterface $searchCriteria)
    {
        $collection = $this->collectionFactory->create();

        // =========================================================
        // CRITICAL: This line must be called BEFORE applying filters
        // It adds JOINs to the collection for all declared extension
        // attributes that have join directives in extension_attributes.xml
        // =========================================================
        $this->extensionAttributesJoinProcessor->process($collection);

        // NOW apply search criteria (filters can now reference joined columns)
        $this->collectionProcessor->process($searchCriteria, $collection);

        $items = [];
        foreach ($collection as $product) {
            $items[] = $product;
        }

        $searchResults = $this->searchResultsFactory->create();
        $searchResults->setSearchCriteria($searchCriteria);
        $searchResults->setItems($items);
        $searchResults->setTotalCount($collection->getSize());

        return $searchResults;
    }
}
```

### Declaring a Join Directive in `extension_attributes.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Api/etc/extension_attributes.xsd">
    <extension_attributes for="Magento\Catalog\Api\Data\ProductInterface">
        <attribute code="vendor_warranty_years" type="int">
            <!-- This join directive enables JoinProcessor to add the JOIN automatically -->
            <join reference_table="vendor_product_warranty"
                  reference_field="product_id"
                  join_field="entity_id">
                <field>warranty_years</field>
            </join>
        </attribute>
    </extension_attributes>
</config>
```

With this join directive in place, `$this->extensionAttributesJoinProcessor->process($collection)` will:
1. Add a `LEFT JOIN vendor_product_warranty ON entity_id = product_id`
2. Add `warranty_years` to the SELECT clause
3. Map the result to `vendor_warranty_years` on the extension attributes object

### The Common Bug Scenario

```php
<?php
// Scenario: Developer adds extension attribute for product stock source
// They write a plugin to load it on afterGet() and afterGetById()
// They test with a single product — it works perfectly

$product = $productRepo->getById(5);
echo $product->getExtensionAttributes()->getStockSource(); // "default" - works!

// Then they test getList() -- it "works" but stock_source is NULL on all items
$results = $productRepo->getList($criteria);
foreach ($results->getItems() as $product) {
    // NULL! Plugin fires per-object but JoinProcessor was never called,
    // so the data was never loaded in the collection query
    echo $product->getExtensionAttributes()->getStockSource();
}
```

- **Exam focus:** **This is the single most commonly missed behaviour in Magento 2 module development.** The exam will likely present a scenario where `getList()` returns items with empty extension attributes and ask you to identify the cause. The answer is: `extensionAttributesJoinProcessor->process()` was not called.
- **Exam focus:** `process()` must be called **before** `$collection->load()` or any method that triggers the query, because it modifies the SQL SELECT/JOIN. Calling it after is a no-op.
- **Exam focus:** Even with `process()` called, plugins on `afterGetById()` do NOT automatically run for each item in `getList()`. You need either the join directive **or** explicit loading in the `getList()` implementation.

---

## 9. Deprecation Policy & `@deprecated`

### The Magento Deprecation Contract

```php
<?php
/**
 * Get product by ID
 *
 * @param int $productId
 * @return \Magento\Catalog\Api\Data\ProductInterface
 * @deprecated 101.0.0 Use getById() instead which correctly handles store scoping
 * @see ProductRepositoryInterface::getById()
 */
public function getProduct(int $productId): ProductInterface;
```

### Rules the Architect Must Know

| Rule | Detail |
|---|---|
| `@deprecated` method MUST still work | Until the next **major** version (X.0.0). Removing it early is a breaking change. |
| Must include replacement reference | `@see` annotation pointing to the preferred alternative |
| Must include version of deprecation | `@deprecated X.Y.Z` where X.Y.Z is when it was deprecated |
| Implementation must still function | Cannot throw exception or return garbage — must work |
| Unit tests must still pass | Deprecated methods remain tested |

### Why This Matters Architecturally

```
Magento 2.4.x  --deprecated-->  X.0.0 (future major)
     |                               |
     v                               v
Method works,              Method MAY be removed
PHPDoc warning only        in upgrade path
```

- **Exam focus:** If you are writing a module that deprecates a method, you **must not** remove it in the same release. Removal is a **major version change** under semantic versioning. The exam may ask what the correct approach is when you want to replace a service contract method — the answer is deprecate first, remove in next major.
- **Exam focus:** If a `@deprecated` method calls the new replacement method internally, this is the preferred pattern — it maintains backward compatibility while centralising logic in the new method.

```php
<?php
/**
 * @deprecated 101.0.0
 * @see self::getById()
 */
public function getProduct(int $id): ProductInterface
{
    // Preferred: delegate to the new method
    return $this->getById($id);
}
```

---

## 10. Hands-On: Tracing `ProductRepositoryInterface::getById()`

### The Full Call Chain

```
Your Code
    |
    v
$productRepository->getById(5)
    |
    | [DI resolves interface to concrete class via di.xml]
    v
Magento\Catalog\Model\ProductRepository::getById()
    |
    | [Checks internal cache first]
    +---> if cached: return $this->instancesById[$productId][$cacheKey]
    |
    | [Cache miss: load from resource model]
    v
$product = $this->productFactory->create()
    |
    v
$this->resourceModel->load($product, $productId)
    |
    | [ResourceModel resolves table, builds SELECT query]
    v
Magento\Catalog\Model\ResourceModel\Product::load()
    |
    | [Extends AbstractDb which extends AbstractResource]
    v
SQL: SELECT * FROM catalog_product_entity WHERE entity_id = 5
     + EAV attribute joins (for flat vs EAV depending on config)
    |
    v
Product model populated with data
    |
    v
Back in ProductRepository::getById():
    if (!$product->getId()) {
        throw new NoSuchEntityException(...)  // <--- NEVER returns null
    }
    |
    v
$this->instancesById[$productId][$cacheKey] = $product  // cache it
    |
    v
return $product  // ProductInterface
    |
    | [After plugins fire here]
    v
Your afterGetById plugins (extension attribute loading, etc.)
    |
    v
Final ProductInterface object returned to your code
```

### Locating the Files in `ac-sandbox`

```bash
# Find the interface
find vendor/magento/module-catalog/Api -name "ProductRepositoryInterface.php"
# vendor/magento/module-catalog/Api/ProductRepositoryInterface.php

# Find the implementation (registered in di.xml)
grep -r "ProductRepositoryInterface" vendor/magento/module-catalog/etc/di.xml
# <preference for="Magento\Catalog\Api\ProductRepositoryInterface"
#              type="Magento\Catalog\Model\ProductRepository" />

# Find the implementation file
find vendor/magento/module-catalog/Model -name "ProductRepository.php"
# vendor/magento/module-catalog/Model/ProductRepository.php

# Find the resource model
grep -n "resourceModel\|ResourceModel" vendor/magento/module-catalog/Model/ProductRepository.php | head -20

# Trace the actual getById method
grep -n "function getById" vendor/magento/module-catalog/Model/ProductRepository.php
```

### Key Code Sections to Study in `ProductRepository.php`

```php
<?php
// Simplified version of the actual implementation for study purposes

namespace Magento\Catalog\Model;

class ProductRepository implements \Magento\Catalog\Api\ProductRepositoryInterface
{
    // Internal identity map cache (entity_id => storeId => product)
    protected array $instancesById = [];

    public function getById(
        $productId,
        $editMode = false,
        $storeId = null,
        $forceReload = false
    ) {
        $cacheKey = $this->getCacheKey([$editMode, $storeId]);

        // 1. Check identity map cache
        if (!$forceReload && isset($this->instancesById[$productId][$cacheKey])) {
            return $this->instancesById[$productId][$cacheKey];
        }

        // 2. Create empty product model
        $product = $this->productFactory->create();

        // 3. Set store scope for EAV attribute loading
        if ($storeId !== null) {
            $product->setData('store_id', $storeId);
        }

        // 4. Load from resource model (triggers SQL)
        $product->load($productId);
        // Note: internally calls $this->getResource()->load($this, $modelId)

        // 5. CRITICAL CHECK — throws, never returns null
        if (!$product->getId()) {
            $exception = new \Magento\Framework\Exception\NoSuchEntityException();
            throw $exception->singleField('id', $productId);
        }

        // 6. Store in identity map
        $this->instancesById[$productId][$cacheKey] = $product;

        return $product;
        // After plugins run here via the interceptor (compiled class)
    }
}
```

- **Exam focus:** The **identity map cache** in the repository means calling `getById(5)` twice returns the **same object instance**. Modifying the returned object modifies the cached copy. This is intentional for performance but can cause subtle bugs if you mutate the returned object without saving it.
- **Exam focus:** The `di.xml` `<preference>` tag is what maps `ProductRepositoryInterface` to `ProductRepository`. If you want to **replace** the repository (rare, usually wrong), you use `<preference>`. If you want to **extend** it (correct), you use a **plugin**.

---

## 11. Scenario-Based Architect Exam Traps

These represent the style of questions where multiple answers appear valid but one is architecturally superior.

### Scenario 1: Replacing Repository Behaviour

> *"Module A needs to change how products are loaded to add custom pricing logic. What is the correct approach?"*

| Option | Correct? | Why |
|---|---|---|
| Override `ProductRepository` with `<preference>` | **NO** | Only one preference can exist — another module doing the same causes conflict |
| Copy the class and change the `di.xml` | **NO** | Breaks upgrades, not a supported pattern |
| Create an `after` plugin on `getById()` | **YES** | Plugins compose — multiple modules can each add a plugin without conflict |
| Extend `ProductRepository` directly | **NO** | Concrete class has no `@api`, can change between minor versions |

### Scenario 2: Filtering getList() by Extension Attribute

> *"A developer reports that filtering `getList()` by a custom extension attribute field returns incorrect results. What is the most likely cause?"*

**Answer:** `extensionAttributesJoinProcessor->process($collection)` is not being called before the search criteria is applied, so the extension attribute's table is not JOINed into the collection query. Filters referencing that field either error out or are silently ignored.

### Scenario 3: Safe Cross-Module Data Access

> *"Module B needs to read order data owned by Module A. What is the correct approach?"*

| Option | Correct? |
|---|---|
| Directly instantiate `\Magento\Sales\Model\Order` | **NO** — bypasses service contract, EAV loading, plugins |
| Use `\Magento\Sales\Api\OrderRepositoryInterface::getById()` | **YES** — stable API, correct loading, pluggable |
| Use the resource model directly | **NO** — bypasses cache, plugins, business logic |
| Read from the database table directly | **NO** — creates hidden schema coupling |

### Scenario 4: Extension Attributes vs Custom Attributes vs EAV

> *"A partner module needs to add `warranty_expiry_date` to products. It must be queryable via REST API SearchCriteria. What attribute type should be used?"*

**Answer:** **Extension Attribute** with a join directive. Reasons:
- Custom attributes (EAV) are not reliably filterable via SearchCriteria without custom handling
- Extension attributes with `<join>` in `extension_attributes.xml` integrate with `JoinProcessorInterface`
- REST API auto-serializes extension attributes properly
- Storage is in a dedicated table (better performance than EAV for structured data)

### Scenario 5: NoSuchEntityException vs Null Check

> *"A code review reveals: `if ($repo->getById($id) === null) { return false; }`. What is wrong?"*

**Answer:** `getById()` per the service contract **never returns null** — it throws `NoSuchEntityException` when the entity doesn't exist. The null check will never be `true`. The code will throw an unhandled exception instead of returning `false`. The correct pattern is `try/catch NoSuchEntityException`.

---

## Quick-Reference Checklist

### Api/ Structure
- [ ] `Api/` contains **interface** files for repositories and service classes — not implementations
- [ ] `Api/Data/` contains **data object interfaces** (DTOs) with typed getters/setters
- [ ] `@api` annotation marks a class/interface/method as part of the **stable public API**
- [ ] Classes/interfaces **without `@api`** can change between minor versions — never depend on them cross-module
- [ ] `<preference>` in `di.xml` maps an interface to its concrete implementation

### Data Interfaces
- [ ] Typed getters/setters exist because REST API uses **return type annotations** for JSON serialization
- [ ] Data objects are **DTOs** — no business logic, no database calls
- [ ] `getExtensionAttributes()` / `setExtensionAttributes()` must be on every `Api/Data/` interface that supports extension

### SearchCriteria
- [ ] Filters in the **same FilterGroup** = **OR** logic
- [ ] Filters in **different FilterGroups** = **AND** logic
- [ ] `addFilter()` (singular) creates a **new FilterGroup** each call
- [ ] `addFilters([f1, f2])` puts both filters in the **same FilterGroup**

### SearchResults
- [ ] `getItems()` returns items; `getTotalCount()` returns total **before** pagination
- [ ] `getTotalCount() != count(getItems())` — count is paginated, total is not
- [ ] `SearchResultsInterface` exists so REST API can reliably serialize list responses with metadata

### Repository Rules
- [ ] `getById()` / `get()` **NEVER returns null** — throws `NoSuchEntityException`
- [ ] Always wrap `getById()` in `try/catch NoSuchEntityException`
- [ ] Repository has an **identity map cache** — calling `getById(x)` twice returns same instance
- [ ] Use **plugins** to extend repositories, **never** `<preference>` replacement (conflict risk)

### Extension Attributes
- [ ] Extension attributes are **NOT EAV** — they use **your own join table**
- [ ] Declared in `etc/extension_attributes.xml`
- [ ] Code-generated interface appears in `generated/code/` after `setup:di:compile`
- [ ] Loaded via **after plugins** on the repository — not automatically by the framework
- [ ] Can include a `<join>` directive to enable JoinProcessor integration

### The Critical `getList()` Gap
- [ ] **`extensionAttributesJoinProcessor->process($collection)` must be called explicitly** in `getList()` implementations
- [ ] Must be called **before** the collection is loaded / SearchCriteria applied
- [ ] Without it, extension attribute fields **cannot be filtered** in `getList()`
- [ ] Without it, extension attributes may be **empty/null** on `getList()` results even if single-item methods work
- [ ] The `<join>` directive in `extension_attributes.xml` is what JoinProcessor uses to build the JOIN clause

### Deprecation Policy
- [ ] `@deprecated` methods must **still function** until the next **major version**
- [ ] Must include `@see` pointing to the replacement
- [ ] Must include `@deprecated X.Y.Z` version number
- [ ] Preferred pattern: deprecated method **delegates to** the new method internally
- [ ] Removing a `@deprecated` method in a minor or patch release is a **breaking change violation**

### Exam Mindset
- [ ] Always ask: "does this bypass the service contract?" — if yes, it's likely wrong
- [ ] Plugin > Preference for extending existing behaviour
- [ ] Interface dependency > Concrete class dependency
- [ ] `NoSuchEntityException` always beats null return for "not found" scenarios
- [ ] REST API compatibility drives many design decisions (SearchResults shape, typed methods, exception mapping)
