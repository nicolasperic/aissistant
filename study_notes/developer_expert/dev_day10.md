# Day 10 — Entity Types: Programmatic Manipulation

## Table of Contents
1. [Service Contracts & Repository Pattern](#1-service-contracts--repository-pattern)
2. [SearchCriteriaBuilder & FilterBuilder](#2-searchcriteriabuilder--filterbuilder)
3. [Custom Repositories: Implementing RepositoryInterface](#3-custom-repositories-implementing-repositoryinterface)
4. [Extension Attributes](#4-extension-attributes)
5. [Custom Entities (Non-EAV): Flat Table Architecture](#5-custom-entities-non-eav-flat-table-architecture)
6. [DataObject vs Generated Extension Interfaces](#6-dataobject-vs-generated-extension-interfaces)
7. [Mass Actions & Batch Processing](#7-mass-actions--batch-processing)
8. [SearchResultsInterface & Proper Pagination](#8-searchresultsinterface--proper-pagination)
9. [Practice Exercise: SearchCriteriaBuilder with SQL Inspection](#9-practice-exercise-searchcriteriabuilder-with-sql-inspection)
10. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Service Contracts & Repository Pattern

### What Are Service Contracts?

Service Contracts are a set of PHP interfaces that define the **public API** of a Magento module. They guarantee backward compatibility and provide a stable layer between modules.

```
+---------------------------+
|  API Consumer             |
|  (Controller/Plugin/etc.) |
+---------------------------+
            |
            v
+---------------------------+
|  Service Contract         |
|  (RepositoryInterface)    |
+---------------------------+
            |
            v
+---------------------------+
|  Repository Implementation|
|  (ResourceModel/Collection|
+---------------------------+
            |
            v
+---------------------------+
|  Database Layer           |
+---------------------------+
```

Service contracts live in two namespaces:
- `Api\` — interfaces for repositories and service methods
- `Api\Data\` — interfaces for data transfer objects (DTOs)

**Exam focus:** Service contracts decouple module logic from implementation details. Always depend on the interface, not the concrete class.

### Repository Pattern Core Interfaces

Every standard repository implements or follows these patterns:

```php
<?php
// Vendor/Module/Api/MyEntityRepositoryInterface.php

namespace Vendor\Module\Api;

use Vendor\Module\Api\Data\MyEntityInterface;
use Magento\Framework\Api\SearchCriteriaInterface;
use Vendor\Module\Api\Data\MyEntitySearchResultsInterface;

interface MyEntityRepositoryInterface
{
    /**
     * @param MyEntityInterface $entity
     * @return MyEntityInterface
     * @throws \Magento\Framework\Exception\CouldNotSaveException
     */
    public function save(MyEntityInterface $entity): MyEntityInterface;

    /**
     * @param int $id
     * @return MyEntityInterface
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     */
    public function getById(int $id): MyEntityInterface;

    /**
     * @param SearchCriteriaInterface $searchCriteria
     * @return MyEntitySearchResultsInterface
     */
    public function getList(SearchCriteriaInterface $searchCriteria): MyEntitySearchResultsInterface;

    /**
     * @param MyEntityInterface $entity
     * @return bool
     * @throws \Magento\Framework\Exception\CouldNotDeleteException
     */
    public function delete(MyEntityInterface $entity): bool;

    /**
     * @param int $id
     * @return bool
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     * @throws \Magento\Framework\Exception\CouldNotDeleteException
     */
    public function deleteById(int $id): bool;
}
```

**Exam focus:** The five standard repository methods — `save()`, `getById()`, `getList()`, `delete()`, `deleteById()` — are the canonical contract shape expected by Magento and the REST API.

### Data Interface (DTO)

```php
<?php
// Vendor/Module/Api/Data/MyEntityInterface.php

namespace Vendor\Module\Api\Data;

interface MyEntityInterface
{
    const ENTITY_ID = 'entity_id';
    const NAME      = 'name';
    const STATUS    = 'status';
    const CREATED_AT = 'created_at';

    public function getId(): ?int;
    public function getName(): ?string;
    public function setName(string $name): self;
    public function getStatus(): ?int;
    public function setStatus(int $status): self;
    public function getCreatedAt(): ?string;
    public function setCreatedAt(string $createdAt): self;
}
```

**Exam focus:** Data interfaces in `Api\Data\` are the DTOs. Constants declared here are used as keys when mapping to the database. They must **not** contain business logic.

---

## 2. SearchCriteriaBuilder & FilterBuilder

### Overview of the Search Layer

```
SearchCriteriaBuilder
      |
      +---> FilterBuilder      (creates individual Filter objects)
      |           |
      |           v
      |     FilterGroupBuilder (groups filters with OR logic)
      |
      v
SearchCriteria (immutable value object passed to getList())
```

| Class | Responsibility |
|---|---|
| `FilterBuilder` | Creates a single `Filter` (field, value, condition) |
| `FilterGroupBuilder` | Groups filters — filters within a group use **OR** logic |
| `SearchCriteriaBuilder` | Combines filter groups — groups use **AND** logic |
| `SortOrderBuilder` | Creates `SortOrder` objects |
| `SearchCriteria` | Immutable object passed to `getList()` |

**Exam focus:** Filters within the same `FilterGroup` use **OR**. Different filter groups use **AND**. This is the most commonly tested concept about `SearchCriteria`.

### FilterBuilder — Single Filter

```php
<?php

use Magento\Framework\Api\FilterBuilder;
use Magento\Framework\Api\SearchCriteriaBuilder;

class Example
{
    public function __construct(
        private readonly FilterBuilder $filterBuilder,
        private readonly SearchCriteriaBuilder $searchCriteriaBuilder
    ) {}

    public function buildSimpleFilter(): void
    {
        // Single filter: status = 1
        $filter = $this->filterBuilder
            ->setField('status')
            ->setValue(1)
            ->setConditionType('eq')  // SQL: WHERE status = 1
            ->create();

        $this->searchCriteriaBuilder->addFilters([$filter]);
    }
}
```

### Condition Types Reference

| Condition Type | SQL Equivalent |
|---|---|
| `eq` | `= value` |
| `neq` | `!= value` |
| `like` | `LIKE value` |
| `nlike` | `NOT LIKE value` |
| `in` | `IN (value1, value2, ...)` |
| `nin` | `NOT IN (...)` |
| `notnull` | `IS NOT NULL` |
| `null` | `IS NULL` |
| `gt` | `> value` |
| `lt` | `< value` |
| `gteq` | `>= value` |
| `lteq` | `<= value` |
| `finset` | `FIND_IN_SET(value, field)` |
| `from` | `>= value` (used with date ranges) |
| `to` | `<= value` (used with date ranges) |

**Exam focus:** `finset` is used for comma-separated values (e.g., `store_id`). `from`/`to` are used together for date ranges. Knowing these condition types is frequently tested.

### AND Logic: Multiple Filter Groups

```php
<?php

// Goal: WHERE (status = 1) AND (price >= 10 AND price <= 100)
// Each addFilters() call creates a new FilterGroup (AND between groups)

$statusFilter = $this->filterBuilder
    ->setField('status')
    ->setValue(1)
    ->setConditionType('eq')
    ->create();

$priceFromFilter = $this->filterBuilder
    ->setField('price')
    ->setValue(10)
    ->setConditionType('gteq')
    ->create();

$priceToFilter = $this->filterBuilder
    ->setField('price')
    ->setValue(100)
    ->setConditionType('lteq')
    ->create();

// Group 1: status = 1
$this->searchCriteriaBuilder->addFilters([$statusFilter]);

// Group 2: price >= 10 AND price <= 100  (separate group = AND with group 1)
$this->searchCriteriaBuilder->addFilters([$priceFromFilter]);
$this->searchCriteriaBuilder->addFilters([$priceToFilter]);

$searchCriteria = $this->searchCriteriaBuilder->create();
```

### OR Logic: Multiple Filters in One Group

```php
<?php

// Goal: WHERE (status = 1 OR status = 2)
// Put both filters in the same addFilters() call

$statusEnabledFilter = $this->filterBuilder
    ->setField('status')
    ->setValue(1)
    ->setConditionType('eq')
    ->create();

$statusPendingFilter = $this->filterBuilder
    ->setField('status')
    ->setValue(2)
    ->setConditionType('eq')
    ->create();

// Both in the same addFilters() = OR within the group
$this->searchCriteriaBuilder->addFilters([$statusEnabledFilter, $statusPendingFilter]);

$searchCriteria = $this->searchCriteriaBuilder->create();
```

### Sorting and Pagination

```php
<?php

use Magento\Framework\Api\SortOrderBuilder;
use Magento\Framework\Api\SortOrder;

class ExampleWithSortAndPage
{
    public function __construct(
        private readonly SearchCriteriaBuilder $searchCriteriaBuilder,
        private readonly SortOrderBuilder $sortOrderBuilder
    ) {}

    public function buildWithSortAndPagination(): \Magento\Framework\Api\SearchCriteriaInterface
    {
        $sortOrder = $this->sortOrderBuilder
            ->setField('created_at')
            ->setDirection(SortOrder::SORT_DESC)
            ->create();

        return $this->searchCriteriaBuilder
            ->addFilter('status', 1, 'eq')  // Shorthand method
            ->addSortOrder($sortOrder)
            ->setPageSize(20)               // LIMIT 20
            ->setCurrentPage(2)             // OFFSET 20 (page 2)
            ->create();
    }
}
```

**Exam focus:** `setPageSize()` sets the LIMIT. `setCurrentPage()` is 1-indexed (page 1 = offset 0, page 2 = offset pageSize). A `SearchCriteria` with no page size returns **all** records — this can cause memory issues.

### Shorthand `addFilter()` vs Full `FilterBuilder`

```php
<?php

// Shorthand: addFilter(field, value, conditionType)
// Internally calls FilterBuilder for you
$this->searchCriteriaBuilder->addFilter('name', '%magento%', 'like');

// Full FilterBuilder approach — required when building complex OR groups
$filter1 = $this->filterBuilder->setField('name')->setValue('%magento%')->setConditionType('like')->create();
$filter2 = $this->filterBuilder->setField('sku')->setValue('%mgt%')->setConditionType('like')->create();
$this->searchCriteriaBuilder->addFilters([$filter1, $filter2]); // OR between these two
```

**Exam focus:** `addFilter()` shorthand always creates a **new** filter group (AND). To achieve OR, you must use `addFilters()` with an array of `Filter` objects in the same call.

---

## 3. Custom Repositories: Implementing RepositoryInterface

### Full Repository Implementation

```php
<?php
// Vendor/Module/Model/MyEntityRepository.php

namespace Vendor\Module\Model;

use Vendor\Module\Api\MyEntityRepositoryInterface;
use Vendor\Module\Api\Data\MyEntityInterface;
use Vendor\Module\Api\Data\MyEntitySearchResultsInterfaceFactory;
use Vendor\Module\Model\ResourceModel\MyEntity as ResourceModel;
use Vendor\Module\Model\ResourceModel\MyEntity\CollectionFactory;
use Vendor\Module\Model\MyEntityFactory;
use Magento\Framework\Api\SearchCriteriaInterface;
use Magento\Framework\Api\SearchCriteria\CollectionProcessorInterface;
use Magento\Framework\Exception\CouldNotSaveException;
use Magento\Framework\Exception\CouldNotDeleteException;
use Magento\Framework\Exception\NoSuchEntityException;

class MyEntityRepository implements MyEntityRepositoryInterface
{
    public function __construct(
        private readonly ResourceModel $resource,
        private readonly MyEntityFactory $entityFactory,
        private readonly CollectionFactory $collectionFactory,
        private readonly MyEntitySearchResultsInterfaceFactory $searchResultsFactory,
        private readonly CollectionProcessorInterface $collectionProcessor
    ) {}

    public function save(MyEntityInterface $entity): MyEntityInterface
    {
        try {
            $this->resource->save($entity);
        } catch (\Exception $e) {
            throw new CouldNotSaveException(
                __('Could not save entity: %1', $e->getMessage()),
                $e
            );
        }
        return $entity;
    }

    public function getById(int $id): MyEntityInterface
    {
        $entity = $this->entityFactory->create();
        $this->resource->load($entity, $id);

        if (!$entity->getId()) {
            throw new NoSuchEntityException(
                __('Entity with id "%1" does not exist.', $id)
            );
        }
        return $entity;
    }

    public function getList(SearchCriteriaInterface $searchCriteria): \Vendor\Module\Api\Data\MyEntitySearchResultsInterface
    {
        $collection = $this->collectionFactory->create();

        // CollectionProcessor applies filters, sorting, pagination to the collection
        $this->collectionProcessor->process($searchCriteria, $collection);

        $searchResults = $this->searchResultsFactory->create();
        $searchResults->setSearchCriteria($searchCriteria);
        $searchResults->setItems($collection->getItems());
        $searchResults->setTotalCount($collection->getSize());

        return $searchResults;
    }

    public function delete(MyEntityInterface $entity): bool
    {
        try {
            $this->resource->delete($entity);
        } catch (\Exception $e) {
            throw new CouldNotDeleteException(
                __('Could not delete entity: %1', $e->getMessage()),
                $e
            );
        }
        return true;
    }

    public function deleteById(int $id): bool
    {
        return $this->delete($this->getById($id));
    }
}
```

**Exam focus:** `CollectionProcessorInterface` is the key class that translates a `SearchCriteria` object into collection filters, sort orders, and pagination. Always inject it rather than manually applying filters.

### CollectionProcessorInterface in Detail

```php
<?php
// Magento\Framework\Api\SearchCriteria\CollectionProcessorInterface

// The default implementation chains multiple processors:
// - FilterProcessor   -> applies addFieldToFilter()
// - SortingProcessor  -> applies setOrder()
// - PaginationProcessor -> applies setCurPage() and setPageSize()
// - JoinProcessor     -> handles extension attribute joins
```

### DI Configuration for Repository

```xml
<!-- Vendor/Module/etc/di.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">

    <!-- Bind interface to implementation -->
    <preference for="Vendor\Module\Api\MyEntityRepositoryInterface"
                type="Vendor\Module\Model\MyEntityRepository"/>

    <preference for="Vendor\Module\Api\Data\MyEntityInterface"
                type="Vendor\Module\Model\MyEntity"/>

    <preference for="Vendor\Module\Api\Data\MyEntitySearchResultsInterface"
                type="Magento\Framework\Api\SearchResults"/>

    <!-- Configure CollectionProcessor for this repository -->
    <type name="Vendor\Module\Model\MyEntityRepository">
        <arguments>
            <argument name="collectionProcessor"
                      xsi:type="object">Vendor\Module\Model\Api\SearchCriteria\MyEntityCollectionProcessor</argument>
        </arguments>
    </type>
</config>
```

**Exam focus:** The `preference` node in `di.xml` binds an interface to its concrete implementation. Without this, Magento cannot instantiate the repository via the interface.

---

## 4. Extension Attributes

### What Are Extension Attributes?

Extension Attributes are Magento's mechanism for **adding data fields to existing entities** (like `Product`, `Order`, `Customer`) without modifying core code or the entity's database table.

```
Core Entity (e.g., Product)
+-------------------------+
| id, sku, name, price... |  <- Native attributes
+-------------------------+
| extension_attributes    |  <- ExtensionAttributesInterface
|  +--------------------+ |
|  | custom_field_1     | |  <- Your added field
|  | custom_field_2     | |
|  +--------------------+ |
+-------------------------+
```

**Exam focus:** Extension attributes are attached to the entity's `ExtensionAttributesInterface` property. They are **generated** by Magento based on `extension_attributes.xml` — you do not write these classes manually.

### extension_attributes.xml

```xml
<!-- Vendor/Module/etc/extension_attributes.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Api/etc/extension_attributes.xsd">

    <!-- Simple scalar extension attribute on Product -->
    <extension_attributes for="Magento\Catalog\Api\Data\ProductInterface">
        <attribute code="vendor_custom_field" type="string"/>
    </extension_attributes>

    <!-- Complex type (another interface) as extension attribute -->
    <extension_attributes for="Magento\Sales\Api\Data\OrderInterface">
        <attribute code="vendor_order_extra" type="Vendor\Module\Api\Data\OrderExtraInterface"/>
    </extension_attributes>

    <!-- Join directive: load data from another table automatically -->
    <extension_attributes for="Magento\Catalog\Api\Data\ProductInterface">
        <attribute code="vendor_linked_data" type="string">
            <join reference_table="vendor_module_product_link"
                  join_on_field="product_id"
                  reference_field="entity_id">
                <field>custom_value</field>
            </join>
        </attribute>
    </extension_attributes>

</config>
```

**Exam focus:** The `join` directive in `extension_attributes.xml` automatically adds a JOIN to the collection query when the extension attribute is loaded through `getList()`. The `join_on_field` is the column in `reference_table`; `reference_field` is the column in the main entity table.

### Generated Extension Attribute Classes

After running `bin/magento setup:di:compile`, Magento generates:

```
generated/code/Magento/Catalog/Api/Data/
  ProductExtensionInterface.php  <- Interface with getters/setters for your attribute
  ProductExtension.php           <- Concrete implementation
```

The generated interface looks like:

```php
<?php
// generated/code/Magento/Catalog/Api/Data/ProductExtensionInterface.php
// (Auto-generated — do not edit)

namespace Magento\Catalog\Api\Data;

interface ProductExtensionInterface extends \Magento\Framework\Api\ExtensionAttributesInterface
{
    // Your custom attribute appears here after compile
    public function getVendorCustomField(): ?string;
    public function setVendorCustomField(?string $vendorCustomField): self;
}
```

### Using Extension Attributes in a Plugin

```php
<?php
// Vendor/Module/Plugin/ProductRepositoryPlugin.php

namespace Vendor\Module\Plugin;

use Magento\Catalog\Api\Data\ProductInterface;
use Magento\Catalog\Api\Data\ProductExtensionFactory;
use Magento\Catalog\Api\ProductRepositoryInterface;

class ProductRepositoryPlugin
{
    public function __construct(
        private readonly ProductExtensionFactory $extensionFactory,
        private readonly \Vendor\Module\Model\ResourceModel\CustomData $customDataResource
    ) {}

    /**
     * After getById — load and attach extension attribute
     */
    public function afterGet(
        ProductRepositoryInterface $subject,
        ProductInterface $product
    ): ProductInterface {
        $this->attachExtensionAttribute($product);
        return $product;
    }

    public function afterGetById(
        ProductRepositoryInterface $subject,
        ProductInterface $product
    ): ProductInterface {
        $this->attachExtensionAttribute($product);
        return $product;
    }

    private function attachExtensionAttribute(ProductInterface $product): void
    {
        $extensionAttributes = $product->getExtensionAttributes()
            ?? $this->extensionFactory->create();

        // Load custom data from your table
        $customValue = $this->customDataResource->getValueByProductId((int)$product->getId());
        $extensionAttributes->setVendorCustomField($customValue);

        $product->setExtensionAttributes($extensionAttributes);
    }
}
```

**Exam focus:** Always check `getExtensionAttributes()` is not null before calling setters on it. Use `ExtensionFactory::create()` to initialize it if null. Failing to do so causes a fatal error.

### Persisting Extension Attributes

Extension attributes are **not** automatically saved. You must hook into the save operation:

```php
<?php

public function beforeSave(
    ProductRepositoryInterface $subject,
    ProductInterface $product
): array {
    $extensionAttributes = $product->getExtensionAttributes();
    if ($extensionAttributes === null) {
        return [$product];
    }

    $customValue = $extensionAttributes->getVendorCustomField();
    if ($customValue !== null) {
        // Save to your custom table
        $this->customDataResource->saveValueForProduct((int)$product->getId(), $customValue);
    }

    return [$product];
}
```

---

## 5. Custom Entities (Non-EAV): Flat Table Architecture

### Flat Table vs EAV

| Feature | Flat Table | EAV |
|---|---|---|
| Storage | Single table, one row per entity | Multiple tables (entity, attribute, value) |
| Performance | Fast reads, simple queries | Slow for large attribute sets |
| Flexibility | Fixed schema | Dynamic attributes |
| Examples | Orders, custom modules | Products, Customers |
| Complexity | Low | High |

**Exam focus:** Custom non-EAV entities use a **flat table** with a Model + ResourceModel + Collection stack. This is the preferred approach for custom data entities that don't need dynamic attributes.

### Step 1: Database Schema (`db_schema.xml`)

```xml
<!-- Vendor/Module/etc/db_schema.xml -->
<?xml version="1.0"?>
<schema xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Setup/Declaration/Schema/etc/schema.xsd">

    <table name="vendor_module_entity" resource="default" engine="innodb"
           comment="Vendor Module Entity Table">

        <column xsi:type="int" name="entity_id" padding="10" unsigned="true"
                nullable="false" identity="true" comment="Entity ID"/>
        <column xsi:type="varchar" name="name" nullable="false" length="255"
                comment="Name"/>
        <column xsi:type="varchar" name="sku" nullable="true" length="64"
                comment="SKU"/>
        <column xsi:type="int" name="status" unsigned="true" nullable="false"
                default="1" comment="Status"/>
        <column xsi:type="decimal" name="price" scale="4" precision="12"
                unsigned="false" nullable="true" comment="Price"/>
        <column xsi:type="timestamp" name="created_at" on_update="false"
                nullable="false" default="CURRENT_TIMESTAMP" comment="Created At"/>
        <column xsi:type="timestamp" name="updated_at" on_update="true"
                nullable="false" default="CURRENT_TIMESTAMP" comment="Updated At"/>

        <constraint xsi:type="primary" referenceId="PRIMARY">
            <column name="entity_id"/>
        </constraint>

        <index referenceId="VENDOR_MODULE_ENTITY_STATUS" indexType="btree">
            <column name="status"/>
        </index>

        <index referenceId="VENDOR_MODULE_ENTITY_SKU" indexType="btree">
            <column name="sku"/>
        </index>
    </table>
</schema>
```

### Step 2: Model

```php
<?php
// Vendor/Module/Model/MyEntity.php

namespace Vendor\Module\Model;

use Magento\Framework\Model\AbstractModel;
use Vendor\Module\Api\Data\MyEntityInterface;

class MyEntity extends AbstractModel implements MyEntityInterface
{
    /**
     * Cache tag for this entity type
     */
    const CACHE_TAG = 'vendor_module_entity';

    protected $_cacheTag    = self::CACHE_TAG;
    protected $_eventPrefix = 'vendor_module_entity';

    /**
     * @inheritdoc
     */
    protected function _construct(): void
    {
        // Links this model to its ResourceModel
        $this->_init(\Vendor\Module\Model\ResourceModel\MyEntity::class);
    }

    // Implement Data Interface methods

    public function getName(): ?string
    {
        return $this->getData(self::NAME);
    }

    public function setName(string $name): self
    {
        return $this->setData(self::NAME, $name);
    }

    public function getStatus(): ?int
    {
        return (int)$this->getData(self::STATUS);
    }

    public function setStatus(int $status): self
    {
        return $this->setData(self::STATUS, $status);
    }

    public function getCreatedAt(): ?string
    {
        return $this->getData(self::CREATED_AT);
    }

    public function setCreatedAt(string $createdAt): self
    {
        return $this->setData(self::CREATED_AT, $createdAt);
    }
}
```

### Step 3: ResourceModel

```php
<?php
// Vendor/Module/Model/ResourceModel/MyEntity.php

namespace Vendor\Module\Model\ResourceModel;

use Magento\Framework\Model\ResourceModel\Db\AbstractDb;

class MyEntity extends AbstractDb
{
    /**
     * @inheritdoc
     */
    protected function _construct(): void
    {
        // _init(table_name, primary_key_column)
        $this->_init('vendor_module_entity', 'entity_id');
    }

    /**
     * Example of a custom query method
     */
    public function getIdBySku(string $sku): ?int
    {
        $connection = $this->getConnection();
        $select = $connection->select()
            ->from($this->getMainTable(), ['entity_id'])
            ->where('sku = ?', $sku);

        $result = $connection->fetchOne($select);
        return $result ? (int)$result : null;
    }
}
```

### Step 4: Collection

```php
<?php
// Vendor/Module/Model/ResourceModel/MyEntity/Collection.php

namespace Vendor\Module\Model\ResourceModel\MyEntity;

use Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection;
use Vendor\Module\Model\MyEntity as MyEntityModel;
use Vendor\Module\Model\ResourceModel\MyEntity as MyEntityResource;

class Collection extends AbstractCollection
{
    protected $_idFieldName = 'entity_id';
    protected $_eventPrefix = 'vendor_module_entity_collection';
    protected $_eventObject = 'entity_collection';

    /**
     * @inheritdoc
     */
    protected function _construct(): void
    {
        // _init(Model::class, ResourceModel::class)
        $this->_init(MyEntityModel::class, MyEntityResource::class);
    }

    /**
     * Example custom collection method
     */
    public function addActiveFilter(): self
    {
        $this->addFieldToFilter('status', ['eq' => 1]);
        return $this;
    }

    /**
     * Join additional table data
     */
    public function joinCustomTable(): self
    {
        $this->getSelect()->joinLeft(
            ['extra' => $this->getTable('vendor_module_extra')],
            'main_table.entity_id = extra.entity_id',
            ['extra_value' => 'extra.value']
        );
        return $this;
    }
}
```

**Exam focus:** The `_construct()` method in the Collection class must call `_init(ModelClass, ResourceModelClass)` — NOT the table name. This is a common exam trap (confusing with ResourceModel's `_init(table, pk)`).

### Step 5: SearchResults Interface

```php
<?php
// Vendor/Module/Api/Data/MyEntitySearchResultsInterface.php

namespace Vendor\Module\Api\Data;

use Magento\Framework\Api\SearchResultsInterface;

interface MyEntitySearchResultsInterface extends SearchResultsInterface
{
    /**
     * @return MyEntityInterface[]
     */
    public function getItems(): array;

    /**
     * @param MyEntityInterface[] $items
     * @return $this
     */
    public function setItems(array $items): self;
}
```

### Full File Structure

```
Vendor/Module/
  Api/
    MyEntityRepositoryInterface.php
    Data/
      MyEntityInterface.php
      MyEntitySearchResultsInterface.php
  Model/
    MyEntity.php                          <- Model
    MyEntityRepository.php                <- Repository
    ResourceModel/
      MyEntity.php                        <- ResourceModel
      MyEntity/
        Collection.php                    <- Collection
  etc/
    db_schema.xml
    di.xml
    extension_attributes.xml
    module.xml
```

---

## 6. DataObject vs Generated Extension Interfaces

### `DataObject` / `AbstractModel`

`DataObject` (and its subclass `AbstractModel`) uses a **magic data bag** pattern:

```php
<?php

use Magento\Framework\DataObject;

$obj = new DataObject();
$obj->setData('my_field', 'value');   // Uses __call magic
$obj->getData('my_field');             // Returns 'value'
$obj->getMyField();                    // Also works via __call (camelCase to snake_case)
$obj->setMyField('new_value');         // Also works

// You can set arbitrary data — no validation
$obj->setData('anything', 123);
$obj->setData(['bulk' => 'assign', 'multiple' => 'fields']);

// toArray() / toJson() for serialization
$array = $obj->toArray();
$json  = $obj->toJson();
```

**Pros of DataObject approach:**
- No code generation required
- Flexible — add any field at runtime
- Easy to use for temporary data

**Cons:**
- No type safety
- No IDE autocompletion without explicit methods
- No guaranteed API contract — fields can be missing

### Generated Extension Interfaces

After `setup:di:compile`, Magento generates strongly-typed interfaces:

```php
<?php
// Generated — provides type-safe access

$extensionAttributes = $product->getExtensionAttributes();

// Type-safe — IDE knows the return type
$customField = $extensionAttributes->getVendorCustomField(); // Returns ?string

// Versus DataObject approach:
$product->getData('vendor_custom_field'); // Returns mixed — no type safety
```

### Comparison Table

| Feature | DataObject / Magic Methods | Generated Extension Interfaces |
|---|---|---|
| Type safety | No | Yes |
| Code generation required | No | Yes (`setup:di:compile`) |
| IDE support | Limited | Full autocompletion |
| API contract | Implicit | Explicit (interface) |
| Runtime flexibility | High | Low (fixed at compile time) |
| REST API exposure | Via `custom_attributes` | Via `extension_attributes` |
| Use case | Internal, quick, temporary data | Stable public API fields |

**Exam focus:** `custom_attributes` (DataObject/`AttributeValue`) are for EAV custom attribute values in REST. `extension_attributes` are for non-EAV fields added via `extension_attributes.xml`. They are NOT the same thing.

### `custom_attributes` vs `extension_attributes`

```json
// REST API response showing the difference

{
  "id": 1,
  "sku": "test-product",
  "name": "Test",

  // custom_attributes: EAV attribute values (e.g., color, size)
  "custom_attributes": [
    { "attribute_code": "color", "value": "49" },
    { "attribute_code": "description", "value": "My description" }
  ],

  // extension_attributes: added via extension_attributes.xml
  "extension_attributes": {
    "vendor_custom_field": "my_custom_value",
    "stock_item": { ... }
  }
}
```

---

## 7. Mass Actions & Batch Processing

### Why Batch Processing?

Processing large datasets (e.g., 100,000 entities) in a single loop causes:
- PHP memory exhaustion
- MySQL lock timeouts
- Request timeouts
- Degraded system performance

**Exam focus:** Always chunk large datasets. The `PageSize` approach with `SearchCriteria` is the Magento-native way to batch-load entities.

### Chunking with SearchCriteria (Recommended)

```php
<?php

namespace Vendor\Module\Model;

use Magento\Framework\Api\SearchCriteriaBuilder;

class MassProcessor
{
    private const CHUNK_SIZE = 500;

    public function __construct(
        private readonly MyEntityRepositoryInterface $repository,
        private readonly SearchCriteriaBuilder $searchCriteriaBuilder
    ) {}

    public function processAll(): void
    {
        $currentPage = 1;
        $hasMore     = true;

        while ($hasMore) {
            $searchCriteria = $this->searchCriteriaBuilder
                ->addFilter('status', 1, 'eq')
                ->setPageSize(self::CHUNK_SIZE)
                ->setCurrentPage($currentPage)
                ->create();

            $results = $this->repository->getList($searchCriteria);
            $items   = $results->getItems();

            if (empty($items)) {
                break;
            }

            foreach ($items as $entity) {
                $this->processEntity($entity);
            }

            // Check if we've processed all records
            $hasMore = ($currentPage * self::CHUNK_SIZE) < $results->getTotalCount();
            $currentPage++;

            // Free memory between chunks
            unset($items);
        }
    }

    private function processEntity(MyEntityInterface $entity): void
    {
        // Your business logic here
    }
}
```

### Chunking with Collection (Direct DB)

```php
<?php

use Vendor\Module\Model\ResourceModel\MyEntity\CollectionFactory;

class CollectionBatchProcessor
{
    private const CHUNK_SIZE = 1000;

    public function __construct(
        private readonly CollectionFactory $collectionFactory
    ) {}

    public function processByCollection(): void
    {
        $lastId = 0;

        do {
            $collection = $this->collectionFactory->create();
            $collection->addFieldToFilter('entity_id', ['gt' => $lastId]);
            $collection->addFieldToFilter('status', ['eq' => 1]);
            $collection->setPageSize(self::CHUNK_SIZE);
            $collection->setOrder('entity_id', 'ASC');

            $items = $collection->getItems();

            if (empty($items)) {
                break;
            }

            foreach ($items as $entity) {
                $this->processEntity($entity);
                $lastId = (int)$entity->getId();
            }

            // Critical: clear the collection to free memory
            $collection->clear();
            unset($collection);

        } while (count($items) === self::CHUNK_SIZE);
    }
}
```

**Exam focus:** Using `setPageSize()` + `setCurrentPage()` in a loop is the standard pagination approach. Using `entity_id > lastId` is more efficient for large datasets because it avoids OFFSET scans, which degrade at high page numbers.

### Mass Action in Admin Grid (MassAction Controller)

```php
<?php
// Vendor/Module/Controller/Adminhtml/Entity/MassDelete.php

namespace Vendor\Module\Controller\Adminhtml\Entity;

use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Ui\Component\MassAction\Filter;
use Vendor\Module\Model\ResourceModel\MyEntity\CollectionFactory;
use Vendor\Module\Api\MyEntityRepositoryInterface;

class MassDelete extends Action
{
    const ADMIN_RESOURCE = 'Vendor_Module::delete';

    public function __construct(
        Context $context,
        private readonly Filter $filter,
        private readonly CollectionFactory $collectionFactory,
        private readonly MyEntityRepositoryInterface $repository
    ) {
        parent::__construct($context);
    }

    public function execute(): \Magento\Framework\Controller\ResultInterface
    {
        // Filter resolves the selected IDs from the grid
        $collection = $this->filter->getCollection($this->collectionFactory->create());
        $deleted    = 0;

        foreach ($collection as $entity) {
            try {
                $this->repository->delete($entity);
                $deleted++;
            } catch (\Exception $e) {
                $this->messageManager->addErrorMessage($e->getMessage());
            }
        }

        $this->messageManager->addSuccessMessage(
            __('A total of %1 record(s) were deleted.', $deleted)
        );

        return $this->resultRedirectFactory->create()->setPath('*/*/index');
    }
}
```

**Exam focus:** `Magento\Ui\Component\MassAction\Filter` resolves selected entity IDs from the UI grid. It applies them as filters to the collection automatically. Always use it in mass action controllers.

### Asynchronous Batch Processing (Queue)

```php
<?php
// For very large datasets, use Magento's message queue

// Publisher
use Magento\Framework\MessageQueue\PublisherInterface;

class AsyncBatchPublisher
{
    const TOPIC_NAME = 'vendor.module.entity.process';

    public function __construct(
        private readonly PublisherInterface $publisher
    ) {}

    public function publishChunks(array $entityIds): void
    {
        // Split into chunks of 100
        $chunks = array_chunk($entityIds, 100);

        foreach ($chunks as $chunk) {
            $this->publisher->publish(self::TOPIC_NAME, json_encode($chunk));
        }
    }
}
```

---

## 8. SearchResultsInterface & Proper Pagination

### SearchResultsInterface Structure

```php
<?php
// Magento\Framework\Api\SearchResultsInterface

interface SearchResultsInterface
{
    /**
     * The SearchCriteria that was used to generate these results
     */
    public function getSearchCriteria(): SearchCriteriaInterface;
    public function setSearchCriteria(SearchCriteriaInterface $searchCriteria): self;

    /**
     * Total count WITHOUT pagination (important for pagination UI)
     */
    public function getTotalCount(): int;
    public function setTotalCount(int $totalCount): self;

    /**
     * The items for the CURRENT PAGE ONLY
     */
    public function getItems(): array;
    public function setItems(array $items): self;
}
```

**Exam focus:** `getTotalCount()` returns the **total number of matching records**, not just the count of items on the current page. This is used to calculate the total number of pages in pagination UI.

### Correct `getList()` Implementation with Pagination Metadata

```php
<?php

public function getList(SearchCriteriaInterface $searchCriteria): MyEntitySearchResultsInterface
{
    $collection = $this->collectionFactory->create();

    // CollectionProcessor applies: filters, sort orders, pagination
    $this->collectionProcessor->process($searchCriteria, $collection);

    $searchResults = $this->searchResultsFactory->create();
    $searchResults->setSearchCriteria($searchCriteria);

    // setItems: only the items on the current page
    $searchResults->setItems($collection->getItems());

    // setTotalCount: ALL matching records (ignores pagination)
    // getSize() runs SELECT COUNT(*) with filters but without LIMIT
    $searchResults->setTotalCount($collection->getSize());

    return $searchResults;
}
```

### Calculating Pagination from SearchResults

```php
<?php

class PaginationHelper
{
    public function getPaginationInfo(\Magento\Framework\Api\SearchResultsInterface $results): array
    {
        $criteria      = $results->getSearchCriteria();
        $totalCount    = $results->getTotalCount();
        $pageSize      = $criteria->getPageSize() ?? $totalCount;
        $currentPage   = $criteria->getCurrentPage() ?? 1;
        $totalPages    = $pageSize > 0 ? (int)ceil($totalCount / $pageSize) : 1;
        $itemsOnPage   = count($results->getItems());

        return [
            'total_count'   => $totalCount,
            'page_size'     => $pageSize,
            'current_page'  => $currentPage,
            'total_pages'   => $totalPages,
            'items_on_page' => $itemsOnPage,
            'has_more'      => $currentPage < $totalPages,
        ];
    }
}
```

### REST API Pagination Example

```bash
# GET request with pagination and filtering
GET /rest/V1/products?
  searchCriteria[filter_groups][0][filters][0][field]=status&
  searchCriteria[filter_groups][0][filters][0][value]=1&
  searchCriteria[filter_groups][0][filters][0][condition_type]=eq&
  searchCriteria[sort_orders][0][field]=created_at&
  searchCriteria[sort_orders][0][direction]=DESC&
  searchCriteria[page_size]=20&
  searchCriteria[current_page]=1
```

```json
// Response
{
  "items": [ ... ],
  "search_criteria": {
    "filter_groups": [ ... ],
    "page_size": 20,
    "current_page": 1
  },
  "total_count": 1543
}
```

**Exam focus:** When consuming REST API search results, use `total_count` and `page_size` to determine if more pages exist. The client must make additional requests for subsequent pages — the API does not return all pages at once.

### Common Pitfall: Missing `setTotalCount`

```php
<?php

// WRONG — returns count of items on current page, not total
$searchResults->setTotalCount(count($collection->getItems())); // Bug!

// CORRECT — runs COUNT(*) query without LIMIT
$searchResults->setTotalCount($collection->getSize()); // Correct
```

**Exam focus:** `$collection->getSize()` executes a separate `SELECT COUNT(*)` query. `count($collection->getItems())` only counts the loaded items (affected by `LIMIT`). Using the wrong one breaks REST API pagination.

---

## 9. Practice Exercise: SearchCriteriaBuilder with SQL Inspection

### The Task

Use `SearchCriteriaBuilder` to query products with multiple filters and inspect the generated SQL.

### Setup: Multiple Filter Combinations

```php
<?php
// Vendor/Module/Model/ProductQueryExample.php

namespace Vendor\Module\Model;

use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Framework\Api\FilterBuilder;
use Magento\Framework\Api\SearchCriteriaBuilder;
use Magento\Framework\Api\SortOrderBuilder;
use Magento\Framework\Api\SortOrder;

class ProductQueryExample
{
    public function __construct(
        private readonly ProductRepositoryInterface $productRepository,
        private readonly FilterBuilder $filterBuilder,
        private readonly SearchCriteriaBuilder $searchCriteriaBuilder,
        private readonly SortOrderBuilder $sortOrderBuilder
    ) {}

    /**
     * Query: Active products, price between 10-100,
     *        name LIKE '%shirt%' OR sku LIKE '%SH%',
     *        sorted by price ASC, page 1 of 20
     */
    public function queryProducts(): \Magento\Catalog\Api\Data\ProductSearchResultsInterface
    {
        // Filter 1: status = 1 (enabled)
        $statusFilter = $this->filterBuilder
            ->setField('status')
            ->setValue(\Magento\Catalog\Model\Product\Attribute\Source\Status::STATUS_ENABLED)
            ->setConditionType('eq')
            ->create();

        // Filter 2: price >= 10
        $priceFromFilter = $this->filterBuilder
            ->setField('price')
            ->setValue('10')
            ->setConditionType('gteq')
            ->create();

        // Filter 3: price <= 100
        $priceToFilter = $this->filterBuilder
            ->setField('price')
            ->setValue('100')
            ->setConditionType('lteq')
            ->create();

        // Filter 4a: name LIKE '%shirt%'
        $nameFilter = $this->filterBuilder
            ->setField('name')
            ->setValue('%shirt%')
            ->setConditionType('like')
            ->create();

        // Filter 4b: sku LIKE '%SH%' (OR with name filter)
        $skuFilter = $this->filterBuilder
            ->setField('sku')
            ->setValue('%SH%')
            ->setConditionType('like')
            ->create();

        // Sort: price ASC
        $sortOrder = $this->sortOrderBuilder
            ->setField('price')
            ->setDirection(SortOrder::SORT_ASC)
            ->create();

        // Build criteria:
        // Group 1 (AND): status = 1
        // Group 2 (AND): price >= 10
        // Group 3 (AND): price <= 100
        // Group 4 (AND): (name LIKE '%shirt%' OR sku LIKE '%SH%')
        $searchCriteria = $this->searchCriteriaBuilder
            ->addFilters([$statusFilter])                  // AND group
            ->addFilters([$priceFromFilter])               // AND group
            ->addFilters([$priceToFilter])                 // AND group
            ->addFilters([$nameFilter, $skuFilter])        // OR within this AND group
            ->addSortOrder($sortOrder)
            ->setPageSize(20)
            ->setCurrentPage(1)
            ->create();

        return $this->productRepository->getList($searchCriteria);
    }
}
```

### Inspecting the Generated SQL

```php
<?php
// Method 1: Enable query logging in collection before getList() is called
// (Use a plugin on getList() for inspection)

use Magento\Catalog\Model\ResourceModel\Product\CollectionFactory;

class SqlInspector
{
    public function __construct(
        private readonly CollectionFactory $collectionFactory
    ) {}

    public function inspectSql(): string
    {
        $collection = $this->collectionFactory->create();
        $collection->addAttributeToFilter('status', 1);
        $collection->addAttributeToFilter('price', ['gteq' => 10]);
        $collection->addAttributeToFilter('price', ['lteq' => 100]);

        // Get the SELECT object and convert to string
        return (string)$collection->getSelect();
    }
}
```

```php
<?php
// Method 2: Enable DB query profiler

// In pub/index.php or a dev script:
$profiler = \Magento\Framework\App\ObjectManager::getInstance()
    ->get(\Magento\Framework\DB\Profiler::class);

// After running query, dump all queries
$profiler->getQueryProfiles(); // Returns array of query data
```

```bash
# Method 3: Enable MySQL general query log
# In MySQL config or via CLI:

SET GLOBAL general_log = 'ON';
SET GLOBAL general_log_file = '/var/log/mysql/general.log';

# Then tail the log:
tail -f /var/log/mysql/general.log | grep -A5 "vendor_module\|catalog_product"
```

```bash
# Method 4: Magento built-in query debugging
# Add to your code:

bin/magento dev:query-log:enable

# Or in code using Zend_Db_Profiler:
$connection = $this->resourceConnection->getConnection();
$profiler   = $connection->getProfiler();
$profiler->setEnabled(true);
```

### Expected SQL Output Analysis

For the query above, Magento generates SQL similar to:

```sql
-- EAV attributes (like price, name) join attribute tables
SELECT
    e.entity_id,
    e.sku,
    e.type_id,
    at_status.value AS status,
    at_price.value AS price,
    at_name.value AS name
FROM
    catalog_product_entity AS e

-- EAV joins for each attribute
INNER JOIN catalog_product_entity_int AS at_status
    ON (at_status.entity_id = e.entity_id)
    AND (at_status.attribute_id = ?)  -- status attribute_id
    AND (at_status.store_id = 0)

INNER JOIN catalog_product_entity_decimal AS at_price
    ON (at_price.entity_id = e.entity_id)
    AND (at_price.attribute_id = ?)  -- price attribute_id
    AND (at_price.store_id = 0)

INNER JOIN catalog_product_entity_varchar AS at_name
    ON (at_name.entity_id = e.entity_id)
    AND (at_name.attribute_id = ?)  -- name attribute_id
    AND (at_name.store_id = 0)

WHERE
    -- Group 1 (AND)
    (at_status.value = 1)
    -- Group 2 (AND)
    AND (at_price.value >= 10)
    -- Group 3 (AND)
    AND (at_price.value <= 100)
    -- Group 4 (OR within the AND group)
    AND (at_name.value LIKE '%shirt%' OR e.sku LIKE '%SH%')

ORDER BY
    at_price.value ASC

LIMIT 20 OFFSET 0;
```

**Exam focus:** Product queries use EAV — each filterable attribute may add an additional JOIN. Flat catalog tables (enabled via `Magento_Catalog` flat indexer) consolidate these into a single `catalog_product_flat_X` table per store view for faster reads.

### Verifying Results

```php
<?php

$results = $this->queryProducts();

// Total matching records (ignores pagination)
echo "Total: " . $results->getTotalCount() . "\n";

// Items on current page
echo "On this page: " . count($results->getItems()) . "\n";

// The search criteria used
$criteria = $results->getSearchCriteria();
echo "Page size: " . $criteria->getPageSize() . "\n";
echo "Current page: " . $criteria->getCurrentPage() . "\n";

// Iterate results
foreach ($results->getItems() as $product) {
    echo sprintf(
        "ID: %d | SKU: %s | Price: %.2f\n",
        $product->getId(),
        $product->getSku(),
        $product->getPrice()
    );
}
```

---

## Quick-Reference Checklist

### Service Contracts & Repository Pattern
- [ ] Service contracts live in `Api\` (repositories) and `Api\Data\` (DTOs/interfaces)
- [ ] Standard repository has 5 methods: `save()`, `getById()`, `getList()`, `delete()`, `deleteById()`
- [ ] Bind interface to implementation with `<preference>` in `di.xml`
- [ ] Always throw `CouldNotSaveException`, `CouldNotDeleteException`, `NoSuchEntityException` — never generic exceptions from repositories
- [ ] Never depend on concrete repository classes — always inject the interface

### SearchCriteriaBuilder & FilterBuilder
- [ ] Filters within the **same `addFilters([])`** call = **OR** logic
- [ ] **Different `addFilters()`** calls = **AND** logic between groups
- [ ] `addFilter(field, value, condition)` shorthand always creates a new group (AND)
- [ ] `setPageSize()` = LIMIT; `setCurrentPage()` is 1-indexed
- [ ] Know all condition types: `eq`, `neq`, `like`, `in`, `nin`, `gt`, `lt`, `gteq`, `lteq`, `notnull`, `null`, `finset`, `from`, `to`
- [ ] `finset` = `FIND_IN_SET()` for comma-separated fields
- [ ] No `setPageSize()` returns all records — memory danger with large datasets

### CollectionProcessorInterface
- [ ] `CollectionProcessorInterface::process(SearchCriteria, Collection)` applies filters, sort orders, and pagination to a collection
- [ ] Always inject `CollectionProcessorInterface` in repository — do not manually apply filters
- [ ] `JoinProcessor` (part of `CollectionProcessor`) handles extension attribute joins

### Custom Repository Implementation
- [ ] `CollectionProcessorInterface` translates `SearchCriteria` to collection
- [ ] `getSize()` = `SELECT COUNT(*)` without LIMIT = use for `setTotalCount()`
- [ ] `count(getItems())` = items on current page only — do NOT use for `setTotalCount()`

### Extension Attributes
- [ ] Defined in `Vendor/Module/etc/extension_attributes.xml`
- [ ] Generated classes appear in `generated/code/` after `bin/magento setup:di:compile`
- [ ] Always check `getExtensionAttributes() !== null` before calling setters; use `ExtensionFactory::create()` if null
- [ ] Extension attributes are NOT auto-saved — must hook into `beforeSave` to persist
- [ ] `join` directive in `extension_attributes.xml` adds automatic JOIN in `getList()`
- [ ] `extension_attributes` (non-EAV, generated) ≠ `custom_attributes` (EAV attribute values)
- [ ] `join_on_field` = column in the joined table; `reference_field` = column in main table

### Custom Entity (Non-EAV) Stack
- [ ] **ResourceModel** `_construct()`: `_init('table_name', 'primary_key')`
- [ ] **Collection** `_construct()`: `_init(ModelClass::class, ResourceModelClass::class)` — NOT table name
- [ ] **Model** `_construct()`: `$this->_init(ResourceModelClass::class)`
- [ ] Schema defined in `etc/db_schema.xml` (declarative schema)
- [ ] `db_schema_whitelist.json` required when modifying existing declarative schema

### DataObject vs Extension Interfaces
- [ ] `DataObject` uses magic `__call` with `getData()`/`setData()` — flexible but no type safety
- [ ] Extension attribute interfaces are generated — strongly typed, IDE-friendly, API contract
- [ ] `custom_attributes` array = EAV attribute values in REST API response
- [ ] `extension_attributes` object = non-EAV extension data in REST API response

### Mass Actions & Batch Processing
- [ ] Always chunk large datasets — never load all records at once
- [ ] `SearchCriteria` with `setPageSize()` + `setCurrentPage()` = pagination-based chunking
- [ ] `entity_id > lastId` cursor approach is more efficient than high `OFFSET` values
- [ ] Call `$collection->clear()` and `unset($collection)` between iterations to free memory
- [ ] Use `Magento\Ui\Component\MassAction\Filter` to resolve selected grid IDs in mass action controllers
- [ ] Optimal chunk size: 200–1000 depending on row complexity

### SearchResultsInterface
- [ ] `getTotalCount()` = all matching records (no LIMIT) — drives pagination UI
- [ ] `getItems()` = items on current page only
- [ ] `getSearchCriteria()` = the criteria used — echo it back in the response
- [ ] REST API pagination: client requests page N explicitly; server does not bundle all pages
- [ ] `$collection->getSize()` issues `SELECT COUNT(*)` — this is correct for `setTotalCount()`
- [ ] Always `setSearchCriteria($searchCriteria)` on the result object — required for REST API contract

### SQL & Performance
- [ ] EAV product queries generate one JOIN per filterable attribute — expensive at scale
- [ ] Flat catalog tables (`catalog_product_flat_X`) consolidate EAV into a single table per store
- [ ] Inspect SQL: `(string)$collection->getSelect()`, MySQL general log, or `dev:query-log:enable`
- [ ] `addFieldToFilter()` on flat collections vs `addAttributeToFilter()` on EAV collections
- [ ] Index frequently filtered columns in `db_schema.xml` with `<index>` elements
