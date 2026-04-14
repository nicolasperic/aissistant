# EAV, Declarative Schema & Data Patches
## Magento 2 Architect Exam — Week 2, Section 1 & 2 Intro

---

## Table of Contents

1. [EAV Architecture Deep Dive](#1-eav-architecture-deep-dive)
2. [Flat vs EAV Tradeoff](#2-flat-vs-eav-tradeoff)
3. [Extension Attributes vs EAV — Critical Distinction](#3-extension-attributes-vs-eav--critical-distinction)
4. [Enterprise Edition Staging Trap — row_id vs entity_id](#4-enterprise-edition-staging-trap--row_id-vs-entity_id)
5. [Declarative Schema — db_schema.xml](#5-declarative-schema--db_schemaxml)
6. [db_schema_whitelist.json — Why It Exists](#6-db_schema_whitelistjson--why-it-exists)
7. [Data Patches — DataPatchInterface](#7-data-patches--datapatchinterface)
8. [Real-World Reference Examples](#8-real-world-reference-examples)
9. [Architect-Level Scenario Reasoning](#9-architect-level-scenario-reasoning)
10. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. EAV Architecture Deep Dive

### What is EAV?

**Entity-Attribute-Value** is a data modeling pattern where attributes are stored as rows rather than columns. Instead of one wide table with hundreds of columns, data is split across a narrow *entity* table and multiple *value* tables — one per data type.

```
catalog_product_entity          (entity table — one row per product)
+------------+-----------+
| entity_id  | sku       |
+------------+-----------+
| 1          | MH01      |
| 2          | MH02      |
+------------+-----------+

catalog_product_entity_varchar  (value table — string values)
+----------+-----------+----------+----------+---------+
| value_id | entity_id | store_id | attribute_id | value |
+----------+-----------+----------+--------------+-------+
| 1        | 1         | 0        | 73           | 'Red' |
| 2        | 1         | 1        | 73           | 'Rot' |  <- store-specific
+----------+-----------+----------+--------------+-------+
```

### The Five EAV Value Tables for Products/Categories

| Table | PHP Type | Use Cases |
|---|---|---|
| `catalog_product_entity_varchar` | string | name, color, meta_title, sku-related strings |
| `catalog_product_entity_int` | integer | status, visibility, boolean flags |
| `catalog_product_entity_decimal` | float/decimal | price, weight, special_price |
| `catalog_product_entity_datetime` | datetime | special_from_date, news_from_date |
| `catalog_product_entity_text` | text (CLOB) | description, short_description |

> **Exam focus:** Know which PHP/MySQL type maps to which EAV table. A `price` attribute goes to `_decimal`, not `_varchar`. Status (enabled/disabled) goes to `_int`.

### How EAV Loading Works (Simplified)

```
Request: load product entity_id = 1
  |
  v
SELECT * FROM catalog_product_entity WHERE entity_id = 1
  |
  +-- SELECT * FROM catalog_product_entity_varchar WHERE entity_id = 1 AND store_id IN (0, 1)
  +-- SELECT * FROM catalog_product_entity_int WHERE entity_id = 1 AND store_id IN (0, 1)
  +-- SELECT * FROM catalog_product_entity_decimal WHERE entity_id = 1 AND store_id IN (0, 1)
  +-- SELECT * FROM catalog_product_entity_datetime WHERE entity_id = 1 AND store_id IN (0, 1)
  +-- SELECT * FROM catalog_product_entity_text WHERE entity_id = 1 AND store_id IN (0, 1)
  |
  v
Merge store-specific values over global (store_id=0) values
  |
  v
Hydrated Product object
```

> **Exam focus:** Loading a single product can fire **5+ queries** before any joins. This is the core performance argument against EAV at scale.

### The eav_attribute Table

Every EAV attribute is registered in `eav_attribute` and `catalog_eav_attribute`:

```sql
SELECT ea.attribute_id, ea.attribute_code, ea.backend_type, ea.frontend_input
FROM eav_attribute ea
JOIN eav_entity_type eet ON ea.entity_type_id = eet.entity_type_id
WHERE eet.entity_type_code = 'catalog_product'
  AND ea.attribute_code = 'color';
-- backend_type = 'int' means data lives in catalog_product_entity_int
-- backend_type = 'static' means data lives directly in catalog_product_entity
```

> **Exam focus:** `backend_type = 'static'` means the column lives in the **entity table itself** (e.g., `sku`, `created_at`). This is NOT stored in any value table.

### Store Scope and Value Fallback

EAV supports store-level overrides natively:

```
store_id = 0  ->  global/default value
store_id = 1  ->  store-specific override (wins over global if present)
```

When no store-specific row exists, Magento falls back to `store_id = 0`. This is why EAV is used for catalog: a product name can be "Red Shirt" in English (store 1) and "Rotes Hemd" in German (store 2) with a single `entity_id`.

---

## 2. Flat vs EAV Tradeoff

### The Core Problem EAV Solves

- Merchants need **arbitrary custom attributes** (size, material, lens-width, etc.)
- These attributes vary per catalog — a clothing store's attributes differ entirely from electronics
- Adding a column per attribute in a relational table is impractical at scale
- EAV allows **schema-free extensibility** at the cost of query complexity

### The Core Problem EAV Creates

| Problem | Description |
|---|---|
| **Query complexity** | A simple product grid requires JOINs across 5+ tables |
| **No SQL indexing benefit** | You cannot put a compound index across value tables efficiently |
| **Filtering is expensive** | `WHERE color = 'Red'` requires joining `entity_int`, not a direct column filter |
| **No referential integrity** | No FK from value tables to attribute definitions at the row level |
| **Type unsafety** | A decimal stored in varchar is the developer's problem, not the DB's |

### catalog_product_flat — The Denormalization Solution

When enabled, Magento periodically **collapses all EAV values into a single flat table** per store view:

```
catalog_product_flat_1   (for store_id = 1)
+-----------+----------+--------+---------+--------+-----------+
| entity_id | sku      | name   | status  | price  | color     |
+-----------+----------+--------+---------+--------+-----------+
| 1         | MH01     |Shirt   | 1       | 29.99  | Red       |
| 2         | MH02     |Jacket  | 1       | 59.99  | Blue      |
+-----------+----------+--------+---------+--------+-----------+
```

```bash
# Regenerate flat tables via CLI
bin/magento indexer:reindex catalog_product_flat
bin/magento indexer:reindex catalog_category_flat
```

### Flat Table Tradeoffs — Architect Decision Matrix

| Dimension | EAV (no flat) | Flat Tables Enabled |
|---|---|---|
| **Read performance** | Slow (multi-join) | Fast (single table scan) |
| **Write performance** | Fast (insert row) | Slow (reindex on every save) |
| **Reindex latency** | N/A | Full reindex can take minutes/hours |
| **Attribute changes** | Instant | Requires flat table rebuild |
| **Memory** | Low (normalized) | High (denormalized, one table per store) |
| **Recommended today?** | Yes for small catalogs | Largely replaced by Elasticsearch |

> **Exam focus:** The exam may ask when flat tables are appropriate. The architect answer is: **Elasticsearch replaces the need for flat tables for storefront search/layered nav**. Flat tables are a legacy optimization, still available but not recommended for new implementations.

### What Uses Flat vs EAV in Core Magento

| Entity | Storage Pattern | Reasoning |
|---|---|---|
| Products | EAV | Arbitrary merchant attributes |
| Categories | EAV | Store-scoped names/descriptions |
| Orders (`sales_order`) | **Flat** | Orders are snapshots — no dynamic attributes needed post-capture |
| Order Items (`sales_order_item`) | **Flat** | Same reasoning — immutable snapshot |
| Customers | EAV (partially) | Custom customer attributes via EAV |
| Quotes (`quote`) | **Flat** | Temporary data, performance-critical |

> **Exam focus:** **Orders use flat tables, not EAV.** This is a deliberate architectural decision: order data is a point-in-time snapshot and never needs the flexibility of arbitrary attributes added post-order. Adding custom data to orders uses **extension attributes** (see Section 3), not EAV columns.

### Why Not Use EAV for Everything?

```
Scenario: Report "all orders over $100 placed in the last 30 days"

Flat (sales_order):
  SELECT * FROM sales_order
  WHERE grand_total > 100
    AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
  -- One table, indexed columns, fast.

Hypothetical EAV orders:
  SELECT e.entity_id
  FROM order_entity e
  JOIN order_entity_decimal grand_total_v
    ON grand_total_v.entity_id = e.entity_id
    AND grand_total_v.attribute_id = 42
  JOIN order_entity_datetime created_v
    ON created_v.entity_id = e.entity_id
    AND created_v.attribute_id = 7
  WHERE grand_total_v.value > 100
    AND created_v.value > DATE_SUB(NOW(), INTERVAL 30 DAY)
  -- Nightmare for reporting and indexing.
```

---

## 3. Extension Attributes vs EAV — Critical Distinction

### The Most Common Misconception on the Exam

> **Extension attributes are NOT EAV.** They are a completely different mechanism with different storage, different loading, and different purposes.

### Side-by-Side Comparison

| Dimension | EAV | Extension Attributes |
|---|---|---|
| **Storage** | `catalog_product_entity_*` value tables | Separate dedicated join table (you create it) |
| **Loading** | Built into the EAV collection/resource model | Loaded via **plugin on `get()`/`getList()`** |
| **Schema** | Attribute record in `eav_attribute` | `db_schema.xml` column in your custom table |
| **Scope** | Products, categories, customers | **Any entity** — orders, quotes, products, custom |
| **Storefront scope** | Yes (store_id column) | Only if you implement it yourself |
| **Use case** | Merchant-configurable attributes, admin-editable | Developer-added structured data on any entity |
| **Declaration** | `InstallData` or `DataPatch` + `setup:upgrade` | `extension_attributes.xml` + `db_schema.xml` |

### How Extension Attributes Actually Work

**Step 1: Declare the attribute in `extension_attributes.xml`**

```xml
<!-- Vendor/Module/etc/extension_attributes.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Api/etc/extension_attributes.xsd">
    <extension_attributes for="Magento\Sales\Api\Data\OrderInterface">
        <attribute code="warehouse_id" type="int"/>
    </extension_attributes>
</config>
```

**Step 2: Create storage table via `db_schema.xml`**

```xml
<!-- stores order_id -> warehouse_id mapping -->
<table name="vendor_order_warehouse" resource="default" engine="innodb">
    <column xsi:type="int" name="order_id" unsigned="true" nullable="false"/>
    <column xsi:type="int" name="warehouse_id" unsigned="true" nullable="false"/>
    <constraint xsi:type="primary" referenceId="PRIMARY">
        <column name="order_id"/>
    </constraint>
</table>
```

**Step 3: Load via plugin on the repository**

```php
<?php
// Plugin on OrderRepository::get() and OrderRepository::getList()
namespace Vendor\Module\Plugin;

use Magento\Sales\Api\Data\OrderInterface;
use Magento\Sales\Api\OrderRepositoryInterface;

class OrderWarehousePlugin
{
    public function __construct(
        private readonly \Vendor\Module\Model\ResourceModel\OrderWarehouse $resource
    ) {}

    public function afterGet(
        OrderRepositoryInterface $subject,
        OrderInterface $order
    ): OrderInterface {
        $warehouseId = $this->resource->getWarehouseIdByOrderId((int) $order->getEntityId());

        /** @var \Vendor\Module\Api\Data\OrderExtensionInterface $extensionAttributes */
        $extensionAttributes = $order->getExtensionAttributes()
            ?? $order->getExtensionAttributesFactory()->create();

        $extensionAttributes->setWarehouseId($warehouseId);
        $order->setExtensionAttributes($extensionAttributes);

        return $order;
    }
}
```

> **Exam focus:** Extension attributes require **three things**: `extension_attributes.xml` declaration, a storage mechanism (usually a join table via `db_schema.xml`), and a **plugin on the repository** to load/save them. The Magento framework does NOT auto-load extension attributes — you write the loading logic.

### When to Use Which — Architect Decision Guide

```
Question: Where does this data live and who configures it?

Is it configurable by the merchant in the Admin?
  YES -> EAV attribute (product/category/customer)
  NO  -> Continue...

Does the entity already support EAV (product/category/customer)?
  YES + developer-only data -> Extension attribute
  NO (orders, quotes, custom) -> Extension attribute always

Do you need store-scoped values?
  YES -> EAV (built-in) or custom logic in extension attribute table
  NO  -> Either works; extension attribute is simpler for flat data
```

---

## 4. Enterprise Edition Staging Trap — row_id vs entity_id

### Background: What Is Content Staging?

Magento Commerce (EE) adds **Content Staging**: the ability to schedule future updates to products, categories, and CMS content. A product can have multiple scheduled "versions" that go live at different times.

### The Schema Change That Breaks CE Assumptions

In **Magento CE (Open Source)**:

```sql
-- CE: entity_id is the primary key AND the business identifier
catalog_product_entity:
  entity_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
```

In **Magento EE (Commerce)**:

```sql
-- EE: row_id is the PK (one row per staging version)
--     entity_id is the BUSINESS identifier (shared across versions)
catalog_product_entity:
  row_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,  -- physical row
  entity_id INT UNSIGNED NOT NULL,                    -- logical product
  created_in BIGINT NOT NULL,   -- staging update start timestamp
  updated_in BIGINT NOT NULL    -- staging update end timestamp
```

### Visualizing the EE row_id vs entity_id Split

```
catalog_product_entity (EE with staging)
+--------+-----------+------------------+------------------+
| row_id | entity_id | created_in       | updated_in       |
+--------+-----------+------------------+------------------+
| 1      | 1         | 1               | 1714521600       |  <- original
| 2      | 1         | 1714521600      | 1717200000       |  <- scheduled update 1
| 3      | 1         | 1717200000      | 99999999999      |  <- scheduled update 2
+--------+-----------+------------------+------------------+
  ^
  row_id differs, entity_id is always "1" for this product

catalog_product_entity_varchar (EE)
+----------+--------+-----------+--------------+---------+
| value_id | row_id | entity_id | attribute_id | value   |
+----------+--------+-----------+--------------+---------+
| 1        | 1      | 1         | 73           |'Old Name'|
| 2        | 2      | 1         | 73           |'New Name'|  <- staged version
+----------+--------+-----------+--------------+---------+
```

### The Trap: Direct entity_id Joins Break in EE

```php
// WRONG in EE — this join is ambiguous when staging rows exist
$collection->getSelect()->join(
    ['my_table' => 'vendor_product_extra'],
    'main_table.entity_id = my_table.product_id',  // BROKEN in EE
    ['extra_data']
);

// CORRECT in EE — join on row_id (the actual PK)
$collection->getSelect()->join(
    ['my_table' => 'vendor_product_extra'],
    'main_table.row_id = my_table.product_id',  // CORRECT in EE
    ['extra_data']
);
```

> **Exam focus:** **This is a CE → EE compatibility trap.** Code written for CE that joins on `entity_id` will **silently return wrong data or duplicate rows** in EE when staging updates exist. The architect must ensure custom tables that join to catalog entities use `row_id` in EE, or abstract this behind a model that handles both cases.

### Handling Both CE and EE in Custom Code

```php
<?php
namespace Vendor\Module\Model\ResourceModel;

use Magento\Framework\Model\ResourceModel\Db\AbstractDb;

class ProductExtra extends AbstractDb
{
    protected function _construct(): void
    {
        // Always join on the PK — which is row_id in EE, entity_id in CE
        // The framework handles this via the entity metadata
        $this->_init('vendor_product_extra', 'entity_id');
    }

    /**
     * Use MetadataPool to get the correct linkage field
     * This returns 'row_id' in EE, 'entity_id' in CE
     */
    public function getLinkField(): string
    {
        $metadata = $this->metadataPool->getMetadata(
            \Magento\Catalog\Api\Data\ProductInterface::class
        );
        return $metadata->getLinkField();         // 'row_id' (EE) or 'entity_id' (CE)
    }

    public function getIdentifierField(): string
    {
        $metadata = $this->metadataPool->getMetadata(
            \Magento\Catalog\Api\Data\ProductInterface::class
        );
        return $metadata->getIdentifierField();   // always 'entity_id'
    }
}
```

> **Exam focus:** Use `\Magento\Framework\EntityManager\MetadataPool` to retrieve the correct link field. Never hardcode `entity_id` in joins against EAV catalog tables in EE-compatible code.

### Summary Table: CE vs EE Key Differences

| Aspect | CE (Open Source) | EE (Commerce) |
|---|---|---|
| Primary key column | `entity_id` | `row_id` |
| Business identifier | `entity_id` (same as PK) | `entity_id` (separate from PK) |
| Multiple rows per product | Never | Yes, one per staging version |
| Value tables join column | `entity_id` | `row_id` |
| Safe join column | `entity_id` | `row_id` (use MetadataPool) |

---

## 5. Declarative Schema — db_schema.xml

### What Is Declarative Schema?

Prior to Magento 2.3, schema was managed via `InstallSchema.php` and `UpgradeSchema.php` PHP classes. Declarative Schema replaces this with **XML-driven schema state declaration** — you declare what the schema *should look like*, and Magento diffs the current DB state against your declaration and generates the required DDL.

```
Old way (imperative):            New way (declarative):
InstallSchema.php                db_schema.xml
  if (!tableExists) {              <table name="my_table">
    createTable()                    <column .../>
  }                                </table>
UpgradeSchema.php
  if (version < '1.1.0') {
    addColumn()
  }
```

> **Exam focus:** Declarative schema is **state-based**, not **step-based**. You describe the desired end state; Magento figures out the migration path.

### File Location and Structure

```
Vendor/Module/
  etc/
    db_schema.xml          <- schema declaration
    db_schema_whitelist.json  <- generated file, must be committed
```

### The Four Core XML Elements

#### 1. `<table>` — Table Declaration

```xml
<?xml version="1.0"?>
<schema xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Setup/Declaration/Schema/etc/schema.xsd">

    <table name="vendor_module_entity"
           resource="default"
           engine="innodb"
           comment="Vendor Module Entity Table">

        <!-- columns, constraints, indexes go here -->

    </table>
</schema>
```

| Attribute | Values | Notes |
|---|---|---|
| `name` | string | Exact table name in DB |
| `resource` | `default`, `checkout`, `sales` | Which DB connection (for split DB) |
| `engine` | `innodb` | Always innodb for Magento |
| `comment` | string | Optional, documents purpose |

#### 2. `<column>` — Column Declaration

```xml
<!-- Integer primary key -->
<column xsi:type="int"
        name="entity_id"
        unsigned="true"
        nullable="false"
        identity="true"
        comment="Entity ID"/>

<!-- Varchar with default -->
<column xsi:type="varchar"
        name="sku"
        nullable="false"
        length="64"
        comment="SKU"/>

<!-- Nullable decimal -->
<column xsi:type="decimal"
        name="price"
        nullable="true"
        scale="4"
        precision="12"
        comment="Price"/>

<!-- Timestamp with auto-update -->
<column xsi:type="timestamp"
        name="updated_at"
        nullable="false"
        default="CURRENT_TIMESTAMP"
        on_update="true"
        comment="Updated At"/>

<!-- Text blob -->
<column xsi:type="text"
        name="description"
        nullable="true"
        comment="Description"/>

<!-- Boolean (stored as smallint) -->
<column xsi:type="smallint"
        name="is_active"
        unsigned="true"
        nullable="false"
        default="1"
        comment="Is Active"/>
```

**Complete `xsi:type` reference:**

| xsi:type | MySQL Type | Key Attributes |
|---|---|---|
| `int` | INT | `unsigned`, `identity` |
| `smallint` | SMALLINT | `unsigned` |
| `bigint` | BIGINT | `unsigned` |
| `tinyint` | TINYINT | `unsigned` |
| `varchar` | VARCHAR | `length` (max 255) |
| `text` | TEXT | — |
| `mediumtext` | MEDIUMTEXT | — |
| `blob` | BLOB | — |
| `decimal` | DECIMAL | `precision`, `scale` |
| `float` | FLOAT | `scale`, `precision` |
| `boolean` | BOOLEAN | — |
| `timestamp` | TIMESTAMP | `default`, `on_update` |
| `datetime` | DATETIME | — |
| `date` | DATE | — |
| `varbinary` | VARBINARY | `length` |
| `real` | REAL | — |

#### 3. `<constraint>` — Primary Keys and Foreign Keys

```xml
<!-- Primary Key -->
<constraint xsi:type="primary" referenceId="PRIMARY">
    <column name="entity_id"/>
</constraint>

<!-- Composite Primary Key -->
<constraint xsi:type="primary" referenceId="PRIMARY">
    <column name="entity_id"/>
    <column name="store_id"/>
</constraint>

<!-- Foreign Key -->
<constraint xsi:type="foreign"
            referenceId="VENDOR_MODULE_ENTITY_STORE_ID_STORE_STORE_ID"
            table="vendor_module_entity"
            column="store_id"
            referenceTable="store"
            referenceColumn="store_id"
            onDelete="CASCADE"/>

<!-- Unique Key -->
<constraint xsi:type="unique" referenceId="VENDOR_MODULE_ENTITY_SKU">
    <column name="sku"/>
</constraint>
```

| `onDelete` value | Behavior |
|---|---|
| `CASCADE` | Delete child rows when parent is deleted |
| `SET NULL` | Set FK column to NULL when parent deleted |
| `NO ACTION` | Prevent parent deletion if children exist |
| `RESTRICT` | Same as NO ACTION in MySQL |

> **Exam focus:** Foreign key `referenceId` must be **globally unique** across all tables. Convention: `TABLENAME_COLUMNNAME_REFTABLE_REFCOLUMN` in uppercase.

#### 4. `<index>` — Performance Indexes

```xml
<!-- Standard index -->
<index referenceId="VENDOR_MODULE_ENTITY_CUSTOMER_ID" indexType="btree">
    <column name="customer_id"/>
</index>

<!-- Composite index -->
<index referenceId="VENDOR_MODULE_ENTITY_STORE_ID_STATUS" indexType="btree">
    <column name="store_id"/>
    <column name="status"/>
</index>

<!-- Fulltext index -->
<index referenceId="VENDOR_MODULE_ENTITY_NAME_DESCRIPTION" indexType="fulltext">
    <column name="name"/>
    <column name="description"/>
</index>
```

### Complete db_schema.xml Example

```xml
<?xml version="1.0"?>
<schema xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Setup/Declaration/Schema/etc/schema.xsd">

    <table name="vendor_warehouse_stock"
           resource="default"
           engine="innodb"
           comment="Warehouse Stock Levels">

        <!-- Primary key -->
        <column xsi:type="int"
                name="stock_id"
                unsigned="true"
                nullable="false"
                identity="true"
                comment="Stock ID"/>

        <!-- Foreign key to product -->
        <column xsi:type="int"
                name="product_id"
                unsigned="true"
                nullable="false"
                comment="Product Entity ID"/>

        <!-- Warehouse identifier -->
        <column xsi:type="varchar"
                name="warehouse_code"
                nullable="false"
                length="32"
                comment="Warehouse Code"/>

        <!-- Quantity on hand -->
        <column xsi:type="decimal"
                name="qty"
                nullable="false"
                precision="12"
                scale="4"
                default="0.0000"
                comment="Quantity"/>

        <!-- Timestamps -->
        <column xsi:type="timestamp"
                name="created_at"
                nullable="false"
                default="CURRENT_TIMESTAMP"
                comment="Created At"/>

        <column xsi:type="timestamp"
                name="updated_at"
                nullable="false"
                default="CURRENT_TIMESTAMP"
                on_update="true"
                comment="Updated At"/>

        <!-- Primary Key constraint -->
        <constraint xsi:type="primary" referenceId="PRIMARY">
            <column name="stock_id"/>
        </constraint>

        <!-- FK to catalog_product_entity -->
        <constraint xsi:type="foreign"
                    referenceId="VENDOR_WAREHOUSE_STOCK_PRODUCT_ID_CAT_PRD_ENTITY_ENTITY_ID"
                    table="vendor_warehouse_stock"
                    column="product_id"
                    referenceTable="catalog_product_entity"
                    referenceColumn="entity_id"
                    onDelete="CASCADE"/>

        <!-- Unique: one record per product/warehouse -->
        <constraint xsi:type="unique"
                    referenceId="VENDOR_WAREHOUSE_STOCK_PRODUCT_ID_WAREHOUSE_CODE">
            <column name="product_id"/>
            <column name="warehouse_code"/>
        </constraint>

        <!-- Index for warehouse queries -->
        <index referenceId="VENDOR_WAREHOUSE_STOCK_WAREHOUSE_CODE" indexType="btree">
            <column name="warehouse_code"/>
        </index>

    </table>
</schema>
```

### The Nullable + Default Trap — Critical Exam Topic

```xml
<!-- DANGER: This will cause upgrade failures -->
<column xsi:type="varchar"
        name="my_field"
        nullable="false"
        default=""
        length="255"
        comment="My Field"/>
```

**Why this fails:**

1. `nullable="false"` translates to a `NOT NULL` constraint in MySQL
2. `default=""` sets the default to an empty string
3. **When adding this column to an existing table with data**, MySQL must backfill all existing rows
4. If strict mode is enabled (`STRICT_TRANS_TABLES`), MySQL **rejects** empty string as a valid value for certain contexts
5. On large tables, this causes the upgrade to fail mid-way, leaving the schema in a broken state

**The correct patterns:**

```xml
<!-- Option 1: Allow null (safest for adding to existing tables) -->
<column xsi:type="varchar"
        name="my_field"
        nullable="true"
        length="255"
        comment="My Field"/>

<!-- Option 2: NOT NULL with a meaningful default -->
<column xsi:type="varchar"
        name="my_field"
        nullable="false"
        default="pending"
        length="255"
        comment="My Field"/>

<!-- Option 3: NOT NULL, no default — ONLY safe for new tables -->
<column xsi:type="varchar"
        name="my_field"
        nullable="false"
        length="255"
        comment="My Field"/>
<!-- On existing tables this will fail if any rows exist -->
```

> **Exam focus:** `nullable="false"` + `default=""` on a column **added to an existing table** is a classic trap. The correct answer is either allow `nullable="true"` OR provide a non-empty default value. Expect a scenario question where you must identify why an upgrade script fails.

### Schema Diff — How Magento Applies Changes

```bash
# Preview what SQL will be generated (dry run)
bin/magento setup:db-declaration:generate-whitelist --module-name=Vendor_Module

# Apply schema changes
bin/magento setup:upgrade

# Verify schema matches declaration
bin/magento setup:db:status
```

The diff engine compares:
1. Current DB state (introspected via `INFORMATION_SCHEMA`)
2. Desired state from all `db_schema.xml` files
3. Generates `CREATE TABLE`, `ALTER TABLE`, `DROP COLUMN`, etc.

---

## 6. db_schema_whitelist.json — Why It Exists

### The Problem It Solves

Without a whitelist, Magento's declarative schema cannot distinguish between:
- A column you **intentionally removed** from `db_schema.xml` (should be dropped)
- A column that **never existed** in your module's schema (should be ignored)

### How the Whitelist Works

```json
// Vendor/Module/etc/db_schema_whitelist.json
{
    "vendor_warehouse_stock": {
        "column": {
            "stock_id": true,
            "product_id": true,
            "warehouse_code": true,
            "qty": true,
            "created_at": true,
            "updated_at": true
        },
        "constraint": {
            "PRIMARY": true,
            "VENDOR_WAREHOUSE_STOCK_PRODUCT_ID_CAT_PRD_ENTITY_ENTITY_ID": true,
            "VENDOR_WAREHOUSE_STOCK_PRODUCT_ID_WAREHOUSE_CODE": true
        },
        "index": {
            "VENDOR_WAREHOUSE_STOCK_WAREHOUSE_CODE": true
        }
    }
}
```

### The Lifecycle

```
1. Developer adds column to db_schema.xml
         |
         v
2. Developer runs:
   bin/magento setup:db-declaration:generate-whitelist --module-name=Vendor_Module
         |
         v
3. Magento introspects current DB + db_schema.xml
   and writes/updates db_schema_whitelist.json
         |
         v
4. Developer commits BOTH db_schema.xml AND db_schema_whitelist.json
         |
         v
5. On next setup:upgrade, Magento reads whitelist to know
   which columns IT owns and can safely drop if removed from XML
```

> **Exam focus:** `db_schema_whitelist.json` must be **committed to version control**. It is not auto-generated on `setup:upgrade` — you must explicitly run the generation command. If it's missing, Magento will **not drop columns** that you removed from `db_schema.xml` (safety mechanism).

### What Happens Without the Whitelist Entry

```
Scenario: You remove 'warehouse_code' column from db_schema.xml
          but db_schema_whitelist.json still lists it as true

Result: Column IS dropped (whitelist says "this module owns it")

Scenario: You remove 'warehouse_code' column from db_schema.xml
          and the whitelist was never updated to include it

Result: Column is NOT dropped (Magento doesn't know this module created it)
        -- This is the SAFE failure mode --
```

### Generating the Whitelist

```bash
# Generate for a specific module
bin/magento setup:db-declaration:generate-whitelist --module-name=Vendor_Module

# Generate for all modules (careful — slow)
bin/magento setup:db-declaration:generate-whitelist
```

> **Exam focus:** The `generate-whitelist` command reads the **current DB state**, not the XML. Run it **after** the table exists in the DB (i.e., after the first `setup:upgrade` that creates the table).

---

## 7. Data Patches — DataPatchInterface

### Why Data Patches Replace InstallData/UpgradeData

| Old Approach | New Approach (2.3+) |
|---|---|
| `InstallData.php` — runs once on install | `DataPatch` classes — each runs once |
| `UpgradeData.php` — version-gated if/else chains | No versioning needed |
| Version tracked in `setup_module` table | Each patch tracked in `patch_list` table |
| Hard to test in isolation | Each patch is a standalone class |
| Upgrades run all versions sequentially | Each patch runs independently |

### The DataPatchInterface Contract

```php
<?php
namespace Magento\Framework\Setup\Patch;

interface DataPatchInterface extends PatchInterface
{
    /**
     * Run the patch — insert/update data here.
     * This method is called ONCE and never again.
     *
     * @return $this
     */
    public function apply();

    /**
     * Return array of patch class names that must run BEFORE this patch.
     * Magento will run them first if they haven't run yet.
     *
     * @return string[]
     */
    public static function getDependencies(): array;

    /**
     * Return array of old patch class names that this patch replaces.
     * If any alias is already in patch_list, this patch is skipped.
     *
     * @return string[]
     */
    public function getAliases(): array;
}
```

> **Exam focus:** `getDependencies()` is **static**. `getAliases()` is **not static**. `apply()` is **not static**. Know this distinction — it comes up in scenario questions where you need to identify a broken patch class.

### Complete DataPatch Implementation

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Setup\Patch\Data;

use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;
use Magento\Framework\Setup\Patch\PatchRevertableInterface;

class AddDefaultWarehouseData implements DataPatchInterface, PatchRevertableInterface
{
    public function __construct(
        private readonly ModuleDataSetupInterface $moduleDataSetup
    ) {}

    /**
     * {@inheritdoc}
     */
    public function apply(): self
    {
        $this->moduleDataSetup->getConnection()->startSetup();

        $this->moduleDataSetup->getConnection()->insertMultiple(
            $this->moduleDataSetup->getTable('vendor_warehouse_stock'),
            [
                ['product_id' => 1, 'warehouse_code' => 'US_EAST', 'qty' => 100.0000],
                ['product_id' => 1, 'warehouse_code' => 'US_WEST', 'qty' => 50.0000],
            ]
        );

        $this->moduleDataSetup->getConnection()->endSetup();

        return $this;
    }

    /**
     * {@inheritdoc}
     * Rollback the patch (optional — only if implementing PatchRevertableInterface)
     */
    public function revert(): void
    {
        $this->moduleDataSetup->getConnection()->startSetup();

        $this->moduleDataSetup->getConnection()->delete(
            $this->moduleDataSetup->getTable('vendor_warehouse_stock'),
            ['warehouse_code IN (?)' => ['US_EAST', 'US_WEST']]
        );

        $this->moduleDataSetup->getConnection()->endSetup();
    }

    /**
     * {@inheritdoc}
     * These patches must run before this one.
     */
    public static function getDependencies(): array
    {
        return [
            CreateWarehouseStructure::class,  // schema patch that creates the table
        ];
    }

    /**
     * {@inheritdoc}
     * Old patch names this replaces (for renamed patches).
     */
    public function getAliases(): array
    {
        return [
            // 'Vendor\Module\Setup\Patch\Data\OldPatchName', // if this replaced an old class
        ];
    }
}
```

### The patch_list Table — How "Runs Once" Works

```sql
-- Magento tracks executed patches here
SELECT * FROM patch_list;

+----------+----------------------------------------------------------------------+
| patch_id | patch_name                                                           |
+----------+----------------------------------------------------------------------+
| 1        | Vendor\Module\Setup\Patch\Data\AddDefaultWarehouseData               |
| 2        | Magento\Catalog\Setup\Patch\Data\UpdateProductAttributes             |
+----------+----------------------------------------------------------------------+

-- Before running setup:upgrade, Magento:
-- 1. Finds all classes implementing DataPatchInterface
-- 2. Checks if class name exists in patch_list
-- 3. If YES -> skip
-- 4. If NO  -> run apply(), then INSERT into patch_list
```

> **Exam focus:** A patch is identified by its **fully-qualified class name (FQCN)**. If you **rename or move** a patch class, Magento treats it as a new patch and runs it again — unless you add the old FQCN to `getAliases()`.

### getDependencies() — Execution Ordering

```php
// Patch B depends on Patch A
class PatchB implements DataPatchInterface
{
    public static function getDependencies(): array
    {
        return [PatchA::class];
    }
}

// Execution order guarantee:
// Even if PatchB is discovered first alphabetically,
// Magento will run PatchA first, then PatchB.
// If PatchA already ran (in patch_list), it's skipped.
```

```
Dependency Resolution:

PatchC depends on PatchB
PatchB depends on PatchA

Discovery order: PatchC, PatchB, PatchA (alphabetical)

Resolved execution order:
  PatchA -> PatchB -> PatchC
```

> **Exam focus:** `getDependencies()` does NOT mean the dependent patch re-runs. It means the dependency must have run **at some point before this patch**. If already in `patch_list`, it's satisfied without re-running.

### getAliases() — Handling Renamed Patches

```php
// You renamed OldPatchName to NewPatchName
// Without aliases, both would run if OldPatchName is in patch_list

class NewPatchName implements DataPatchInterface
{
    public function getAliases(): array
    {
        return [
            'Vendor\Module\Setup\Patch\Data\OldPatchName',
        ];
    }
    // ...
}

// Magento: "Is 'NewPatchName' in patch_list? No."
//          "Is any alias in patch_list? Yes — OldPatchName is there."
//          "Skip this patch."
```

### SchemaPatchInterface — Schema Patches vs Data Patches

```php
// For schema changes that can't be expressed in db_schema.xml
// (rare — prefer db_schema.xml for all schema work)
use Magento\Framework\Setup\Patch\SchemaPatchInterface;

class MySchemaChange implements SchemaPatchInterface
{
    public function apply(): self
    {
        // DDL operations here
        return $this;
    }

    public static function getDependencies(): array { return []; }
    public function getAliases(): array { return []; }
}
```

> **Exam focus:** Prefer **`db_schema.xml`** for all structural schema changes. `SchemaPatchInterface` exists but is rarely the right answer. Data Patches handle data seeding/migration. The exam may ask which interface to use for a given scenario.

### PatchRevertableInterface — Optional Rollback Support

```php
use Magento\Framework\Setup\Patch\PatchRevertableInterface;

// Implement this interface IF your patch should be reversible
// Not all patches need this — many data patches cannot be safely reversed
class MyPatch implements DataPatchInterface, PatchRevertableInterface
{
    public function revert(): void
    {
        // Undo what apply() did
        // Called by: bin/magento module:uninstall Vendor_Module
    }
}
```

---

## 8. Real-World Reference Examples

### Real db_schema.xml — module-sales

The `sales_order` table in `vendor/magento/module-sales/etc/db_schema.xml` is an excellent example of flat schema design:

```xml
<!-- Excerpt from module-sales/etc/db_schema.xml -->
<table name="sales_order" resource="sales" engine="innodb" comment="Sales Flat Order">

    <column xsi:type="int"
            name="entity_id"
            unsigned="true"
            nullable="false"
            identity="true"
            comment="Entity Id"/>

    <column xsi:type="varchar"
            name="status"
            nullable="true"
            length="32"
            comment="Status"/>

    <column xsi:type="decimal"
            name="grand_total"
            nullable="true"
            precision="20"
            scale="4"
            comment="Grand Total"/>

    <column xsi:type="varchar"
            name="increment_id"
            nullable="true"
            length="50"
            comment="Increment Id"/>

    <column xsi:type="timestamp"
            name="created_at"
            nullable="false"
            default="CURRENT_TIMESTAMP"
            comment="Created At"/>

    <constraint xsi:type="primary" referenceId="PRIMARY">
        <column name="entity_id"/>
    </constraint>

    <index referenceId="SALES_ORDER_INCREMENT_ID_STORE_ID" indexType="btree">
        <column name="increment_id"/>
        <column name="store_id"/>
    </index>

    <index referenceId="SALES_ORDER_STATUS" indexType="btree">
        <column name="status"/>
    </index>

</table>
```

**Notice:** `sales_order` uses `resource="sales"` — it goes to the **sales database connection** (relevant for split-database configuration). All columns are direct columns, not EAV value table rows.

### Finding Real Examples in Core

```bash
# Find all db_schema.xml files in core
find vendor/magento -name "db_schema.xml" | head -20

# Find all DataPatch implementations
find vendor/magento -path "*/Setup/Patch/Data/*.php" | head -20

# Look at a real DataPatch
cat vendor/magento/module-catalog/Setup/Patch/Data/UpdateProductAttributes.php

# Examine the sales schema
cat vendor/magento/module-sales/etc/db_schema.xml | grep -A5 "sales_order\""
```

### Real DataPatch — module-catalog Example Pattern

```php
<?php
// Pattern similar to Magento\Catalog\Setup\Patch\Data\UpdateProductAttributes
namespace Magento\Catalog\Setup\Patch\Data;

use Magento\Catalog\Setup\CategorySetupFactory;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;

class UpdateProductAttributes implements DataPatchInterface
{
    public function __construct(
        private readonly ModuleDataSetupInterface $moduleDataSetup,
        private readonly CategorySetupFactory $categorySetupFactory
    ) {}

    public function apply(): self
    {
        $this->moduleDataSetup->getConnection()->startSetup();

        $categorySetup = $this->categorySetupFactory->create(
            ['setup' => $this->moduleDataSetup]
        );

        // Update an existing EAV attribute's properties
        $categorySetup->updateAttribute(
            \Magento\Catalog\Model\Product::ENTITY,
            'country_of_manufacture',
            'is_filterable',
            1
        );

        $this->moduleDataSetup->getConnection()->endSetup();

        return $this;
    }

    public static function getDependencies(): array
    {
        return [
            \Magento\Catalog\Setup\Patch\Data\InstallDefaultCategories::class,
        ];
    }

    public function getAliases(): array
    {
        return [];
    }
}
```

---

## 9. Architect-Level Scenario Reasoning

### Scenario 1: "Should we use EAV or flat table for our custom entity?"

**Question:** Your client needs a custom entity "Supplier" with 5 fixed fields (name, email, phone, country, status). Should you use EAV?

**Wrong answer:** "Use EAV because products use it."

**Correct architect answer:**
> No. EAV is appropriate only when attributes are **merchant-configurable** and **variable per installation**. A Supplier entity with 5 known fields should use a **flat table** (`db_schema.xml` with 5 columns). EAV adds query complexity and performance overhead with zero benefit when the attribute set is fixed by the developer.

```
Decision tree:
Are attributes configurable by the merchant? YES -> Consider EAV
Are attributes fixed by development?          YES -> Flat table
Does the entity need store-scoped values?     YES -> Flat + store_id column OR EAV
Is this a reporting/analytical entity?        YES -> Flat always
```

### Scenario 2: "A CE module uses entity_id joins — will it work in EE?"

**Wrong answer:** "Yes, entity_id is always the primary key."

**Correct architect answer:**
> No. In EE with Content Staging enabled, `catalog_product_entity` has multiple rows per `entity_id` (one per staging version). The physical primary key is `row_id`. Direct `entity_id` joins will produce **duplicate rows or incorrect results**. The module must use `MetadataPool::getMetadata()->getLinkField()` to dynamically resolve whether to join on `row_id` (EE) or `entity_id` (CE).

### Scenario 3: "We renamed a DataPatch class — will it run again?"

**Wrong answer:** "No, Magento tracks patches by content hash."

**Correct architect answer:**
> Yes, it will run again if not handled. Magento tracks patches by **FQCN (fully-qualified class name)**. Renaming `OldPatch` to `NewPatch` makes Magento treat `NewPatch` as never-run. To prevent double-execution, add the old FQCN to `getAliases()` in the renamed class. This is critical when refactoring patch namespaces.

### Scenario 4: "db_schema.xml upgrade is failing in production — NOT NULL empty default"

**Wrong answer:** "Run setup:upgrade with --keep-generated flag."

**Correct architect answer:**
> The failure is caused by `nullable="false" default=""` on a column being added to an existing table with rows. MySQL strict mode rejects this. The fix is:
> 1. Change to `nullable="true"` if the column can be null
> 2. OR change `default=""` to a meaningful value like `default="unknown"`
> 3. Regenerate the whitelist
> 4. Run `setup:upgrade` again
>
> The deeper lesson: always test schema changes against a **database with existing data**, not a fresh install.

### Scenario 5: "Extension attribute vs EAV attribute for order data"

**Question:** A client wants to store a custom "purchase_order_number" field on orders. Should this be an EAV attribute or an extension attribute?

**Correct architect answer:**
> **Extension attribute.** Orders use flat tables and do not support EAV. There is no `sales_order_entity_varchar` table. Extension attributes are the correct mechanism: create a join table (`sales_order_po_number`), declare the attribute in `extension_attributes.xml`, and load/save via a plugin on `OrderRepository`. This is the architecturally correct pattern for adding developer-defined data to order entities.

---

## Quick-Reference Checklist

### EAV Tables
- [ ] Five EAV value tables: `_varchar`, `_int`, `_decimal`, `_datetime`, `_text`
- [ ] `backend_type = 'static'` means column lives in the entity table itself (e.g., `sku`)
- [ ] `store_id = 0` is global default; store-specific rows override it
- [ ] Loading one product fires 5+ queries (one per value table)
- [ ] EAV supports arbitrary merchant attributes without schema changes

### Flat vs EAV Tradeoff
- [ ] Products and categories use **EAV** (merchant-configurable attributes)
- [ ] Orders, order items, and quotes use **flat tables** (immutable snapshots)
- [ ] `catalog_product_flat_N` (N = store_id) is the denormalized read table
- [ ] Flat tables are a legacy optimization; Elasticsearch replaces the need for them in storefront search
- [ ] Flat tables improve read speed but degrade write speed and require reindexing

### Extension Attributes vs EAV
- [ ] Extension attributes are **NOT EAV** — completely different mechanism
- [ ] Extension attributes stored in **separate join tables** you create
- [ ] Must be loaded/saved via **plugin on the repository** — not automatic
- [ ] Declared in `extension_attributes.xml`
- [ ] Use for developer-defined data on any entity (including orders, quotes)
- [ ] Use EAV for merchant-configurable attributes on products/categories/customers

### EE Staging Trap
- [ ] EE adds `row_id` (auto-increment PK) and `entity_id` (business key) to catalog tables
- [ ] Multiple rows per `entity_id` — one per staging version
- [ ] Direct `entity_id` joins return **duplicate or wrong rows** when staging updates exist
- [ ] Use `MetadataPool->getMetadata(ProductInterface::class)->getLinkField()` to get correct join field
- [ ] `getLinkField()` returns `row_id` in EE, `entity_id` in CE

### Declarative Schema
- [ ] `db_schema.xml` is **state-based** — declare desired end state, Magento diffs
- [ ] Four elements: `<table>`, `<column>`, `<constraint>`, `<index>`
- [ ] `resource="sales"` routes to sales DB connection (split DB)
- [ ] `onDelete` options: `CASCADE`, `SET NULL`, `NO ACTION`, `RESTRICT`
- [ ] `referenceId` on FK must be globally unique — use long uppercase naming convention
- [ ] **TRAP:** `nullable="false" default=""` on existing table = upgrade failure in strict mode
- [ ] Safe alternatives: `nullable="true"` OR `default="some_value"`
- [ ] `identity="true"` = `AUTO_INCREMENT`

### db_schema_whitelist.json
- [ ] Tells Magento which columns/constraints/indexes THIS module owns
- [ ] Without whitelist entry, Magento will NOT drop a removed column (safe failure)
- [ ] Generated by: `bin/magento setup:db-declaration:generate-whitelist --module-name=Vendor_Module`
- [ ] Must be **committed to version control** alongside `db_schema.xml`
- [ ] Run generate command AFTER the table exists in DB (after first `setup:upgrade`)

### Data Patches
- [ ] Implement `DataPatchInterface` — located in `Setup/Patch/Data/`
- [ ] Tracked by **FQCN** in `patch_list` table — runs **exactly once**
- [ ] `apply()` — instance method, runs the patch
- [ ] `getDependencies()` — **static** method, returns array of dependency FQCNs
- [ ] `getAliases()` — instance method, returns old patch names this replaces
- [ ] Renaming a patch class = it runs again UNLESS old name is in `getAliases()`
- [ ] `PatchRevertableInterface` adds optional `revert()` method for `module:uninstall`
- [ ] Prefer `DataPatchInterface` over legacy `InstallData`/`UpgradeData`
- [ ] `SchemaPatchInterface` exists but prefer `db_schema.xml` for all schema changes
- [ ] `getDependencies()` guarantees ordering but does NOT re-run already-applied patches

### Architect Decision Rules
- [ ] Fixed developer attributes on any entity → Extension attribute
- [ ] Merchant-configurable attributes on products/categories → EAV
- [ ] Custom entity with known fixed fields → Flat table in `db_schema.xml`
- [ ] Custom data on orders → Extension attribute (orders are flat, not EAV)
- [ ] CE → EE migration → audit all `entity_id` joins in catalog queries
- [ ] Exam scenario: multiple valid-looking answers → pick the one with architectural reasoning, not just syntactic correctness
