# Magento 2 Certified Professional Developer Plus / Architect — Exam Eve Master Review

> **Last updated:** May 7 — Exam Eve Light Pass
> **Rule:** Read once, slowly. No new material. No rabbit holes. Trust the work.

---

## Table of Contents

1. [How to Use These Notes Tonight](#1-how-to-use-these-notes-tonight)
2. [The Top 10 Tricky Concepts](#2-the-top-10-tricky-concepts)
   - [2.1 Plugin sortOrder + Module Load Sequence Tiebreaker](#21-plugin-sortorder--module-load-sequence-tiebreaker)
   - [2.2 EE Staging: row_id vs entity_id](#22-ee-staging-row_id-vs-entity_id)
   - [2.3 Cloud Build Phase Has NO Database Connection](#23-cloud-build-phase-has-no-database-connection)
   - [2.4 cacheable="false" — One Block Poisons the Whole Page](#24-cacheablefalse--one-block-poisons-the-whole-page)
   - [2.5 GraphQL GET for Cacheable Queries; POST Loses FPC](#25-graphql-get-for-cacheable-queries-post-loses-fpc)
   - [2.6 MSI Append-Only Reservations](#26-msi-append-only-reservations)
   - [2.7 SCD_ON_DEMAND=true Is Bad for Production](#27-scd_on_demandtrue-is-bad-for-production)
   - [2.8 Observer Execution Order Is NOT Guaranteed](#28-observer-execution-order-is-not-guaranteed)
   - [2.9 Extension Attributes Are Not EAV](#29-extension-attributes-are-not-eav)
   - [2.10 Repository getList + extensionAttributesJoinProcessor Must Be Called Explicitly](#210-repository-getlist--extensionattributesjoinprocessor-must-be-called-explicitly)
3. [Architectural Decision Framework](#3-architectural-decision-framework)
4. [Scenario-Based Question Survival Guide](#4-scenario-based-question-survival-guide)
5. [Exam Logistics Checklist](#5-exam-logistics-checklist)
6. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. How to Use These Notes Tonight

- **One slow read.** No highlighting spirals. No re-reading sections three times.
- If something feels fuzzy, note the concept name, then **move on**. You know this.
- Stop at 8 PM. Seriously.
- Your 13 years of Adobe Commerce experience is in your hands, not in these notes.

> *"The night before the exam is not for learning. It is for remembering what you already know."*

---

## 2. The Top 10 Tricky Concepts

---

### 2.1 Plugin sortOrder + Module Load Sequence Tiebreaker

<!-- CORRECTED: Original heading and all content in this section stated "alphabetical by module name"
     as the tiebreaker. Verified WRONG against PluginList.php (Day 25). Correct tiebreaker is
     module load sequence (registration/load order), NOT alphabetical by module name. -->

#### The Core Rule

Plugins on the same method are sorted by `sortOrder`. When two plugins share **the same `sortOrder` value**, Magento breaks the tie by **module load sequence** — the order in which modules are loaded based on their `sequence` declarations in `module.xml` and composer dependency resolution.

> **Important exam note:** Many study materials incorrectly state "alphabetical by module name." The actual tiebreaker is module load sequence. Avoid relying on alphabetical order in real code — always set explicit sortOrder values.

#### Execution Sequence by Type

```
Intercepted Method Call
        |
        v
[before plugins]  --> sorted by sortOrder ASC (tiebreaker: module load sequence)
        |
        v
[around plugins]  --> sorted by sortOrder ASC; each calls $proceed()
        |
        v
[after plugins]   --> sorted by sortOrder DESC (reverse of around order)
        |
        v
Result returned
```

> **Important:** `after` plugins run in **reverse** sortOrder relative to `around`/`before`. This is the most-missed detail.

#### Example di.xml

```xml
<!-- Vendor_Alpha/etc/di.xml -->
<type name="Magento\Catalog\Model\Product">
    <plugin name="alpha_plugin"
            type="Vendor\Alpha\Plugin\ProductPlugin"
            sortOrder="10"
            disabled="false"/>
</type>

<!-- Vendor_Beta/etc/di.xml -->
<type name="Magento\Catalog\Model\Product">
    <plugin name="beta_plugin"
            type="Vendor\Beta\Plugin\ProductPlugin"
            sortOrder="10"
            disabled="false"/>
</type>
```

```
Same sortOrder = 10
Tiebreaker: module load sequence (whichever module loads first wins)
NOT alphabetical — set explicit sortOrder values to avoid ambiguity
```

#### The Tricky Exam Scenario

> *"Two plugins both have sortOrder=10. One is in Vendor_Zebra, one in Vendor_Apple. Which runs first?"*

**The architecturally correct answer:** This depends on module load sequence, not alphabetical order. The exam may present "alphabetical" as an option — it is NOT correct. In practice, always set unique sortOrder values to avoid any tiebreaker dependency.

- **Exam focus:** The tiebreaker is **module load sequence**, not alphabetical by module name.
- **Exam focus:** `after` plugins run in **reverse** sortOrder order — this trips up people who assume all three types follow the same direction.
- **Exam focus:** A plugin can be disabled in a child `di.xml` by setting `disabled="true"` on the same plugin `name`.

---

### 2.2 EE Staging: row_id vs entity_id

#### Why This Exists

Adobe Commerce EE (Enterprise Edition) Content Staging needs to store **multiple scheduled versions** of the same entity (product, category, CMS page, etc.) simultaneously. The solution: decouple the database primary key from the "business identity" of the entity.

#### The Two Keys

| Key | Column | Meaning |
|-----|--------|---------|
| `row_id` | Physical PK in the DB table | Identifies a **specific version** of an entity |
| `entity_id` | Logical business identity | Identifies **the entity across all versions** |

#### Data Model Visualization

```
catalog_product_entity table (EE):

row_id | entity_id | created_in       | updated_in
-------|-----------|------------------|------------------
  1    |     1     | 1                | 1588291200  (base)
  2    |     1     | 1588291200       | 1590969600  (staging v1)
  3    |     1     | 1590969600       | 2147483647  (staging v2)

All three rows represent the SAME product (entity_id=1)
but different temporal versions (row_id = 1, 2, 3)
```

#### What This Means for Extensions

- **Foreign keys** in EE point to `row_id`, not `entity_id`.
- If your custom extension joins to `catalog_product_entity` on `entity_id`, you will get **multiple rows returned** — one per staging version.
- The correct join column in EE is **`row_id`**.
- In **CE (Community Edition)**, `row_id` does not exist; `entity_id` is both the logical and physical key. EE adds `row_id` via a setup patch.

#### Extension Compatibility Pattern

```php
// WRONG for EE - joins on entity_id, returns duplicate staging rows
$select->join(
    ['cpe' => $this->getTable('catalog_product_entity')],
    'main_table.product_id = cpe.entity_id',
    []
);

// CORRECT for EE - joins on row_id
$select->join(
    ['cpe' => $this->getTable('catalog_product_entity')],
    'main_table.product_id = cpe.row_id',
    []
);
```

- **Exam focus:** In EE, `row_id` is the physical PK; `entity_id` is the logical/business key. Never confuse them.
- **Exam focus:** Custom extensions that are "CE-compatible" must be **explicitly updated** to handle `row_id` joins for EE staging compatibility.
- **Exam focus:** The staging module does NOT exist in CE — any code referencing `row_id` must be conditional or isolated in an EE-specific module.

---

### 2.3 Cloud Build Phase Has NO Database Connection

#### The Adobe Commerce Cloud Deployment Pipeline

```
git push
    |
    v
+-------------------+        +--------------------+        +-------------------+
|   BUILD PHASE     |        |   DEPLOY PHASE     |        |   POST-DEPLOY     |
|                   |        |                    |        |                   |
| - composer install|        | - maintenance mode |        | - cache:warmup    |
| - code compilation|        | - db:upgrade       |        | - search indexing |
| - DI compilation  |        | - config:import    |        | - Blackfire runs  |
| - SCD (if not     |        | - SCD (if          |        |                   |
|   on-demand)      |        |   SCD_ON_DEMAND)   |        |                   |
|                   |        |                    |        |                   |
| NO DB CONNECTION  |        | DB available       |        | DB available      |
| NO SERVICES       |        | Services available |        | Services available|
+-------------------+        +--------------------+        +-------------------+
        |                            |                             |
        v                            v                             v
  Build artifact              Deployed to               Live, cache warm
  (read-only slug)            all nodes
```

#### What "No Database Connection" Actually Means

During the **build phase**:
- No MySQL connection is available.
- No Redis connection is available.
- No Elasticsearch/OpenSearch connection is available.
- The filesystem is writable (this is the last time it is writable before it becomes a read-only slug).
- Environment variables from `.magento.env.yaml` (stage: build) **are** available.

#### Why This Matters Architecturally

| Scenario | Result |
|----------|--------|
| Running `setup:upgrade` in build hook | **Fails** — needs DB |
| Running `setup:di:compile` in build hook | **Works** — filesystem only |
| Running SCD (`setup:static-content:deploy`) in build | **Works** — filesystem only |
| Reading `env.php` database config in build | **Config readable but connection unavailable** |
| Custom build hook that queries DB | **Fails silently or throws connection error** |

#### The Correct Hook Placement

```yaml
# .magento.app.yaml
hooks:
    build: |
        set -e
        php ./vendor/bin/ece-tools run scenario/build/generate.xml
        php ./vendor/bin/ece-tools run scenario/build/transfer.xml
    deploy: |
        php ./vendor/bin/ece-tools run scenario/deploy.xml
    post_deploy: |
        php ./vendor/bin/ece-tools run scenario/post-deploy.xml
```

- **Exam focus:** `setup:upgrade` belongs in **deploy**, not build. This is a classic scenario trap.
- **Exam focus:** SCD run during build = **faster deployment** (no maintenance mode during static asset generation) but requires more build time and artifact size.
- **Exam focus:** If a custom hook script needs to query the database, it must be in `deploy` or `post_deploy`, never `build`.

---

### 2.4 cacheable="false" — One Block Poisons the Whole Page

#### The Rule

If **any single block** in a layout has `cacheable="false"`, the **entire page** is excluded from Full Page Cache (FPC). It doesn't matter how many blocks there are or how nested the problematic block is.

#### How It Works

```
Page Request
    |
    v
FPC Check: "Is this page cached?"
    |
    +-- Checks ALL blocks in the layout XML for cacheable="false"
    |
    +-- Finds ONE block with cacheable="false"
    |
    v
Entire page = NOT cacheable
FPC is bypassed for this URL
Every request hits PHP/application stack
```

#### Layout XML Example

```xml
<!-- This ONE declaration makes the entire page uncacheable -->
<block class="Vendor\Module\Block\PersonalizedContent"
       name="personalized.block"
       cacheable="false"/>

<!-- Even though this block is perfectly cacheable in isolation,
     it doesn't matter — the page is now uncacheable -->
<block class="Magento\Catalog\Block\Product\ListProduct"
       name="product.list"/>
```

#### The Correct Architecture Pattern

The **correct** solution for personalized content is **NOT** `cacheable="false"`. Instead:

```
Option 1: Hole-punching with ESI (Varnish ESI tags)
--> Serve the page from FPC
--> ESI tag fetches personalized block separately (not cached or short-cached)

Option 2: Private Content / Customer Data sections
--> Page served from FPC
--> JavaScript fetches /customer/section/load via AJAX after page render
--> Customer-specific data injected client-side

Option 3: depersonalize the page
--> Remove personalization from the initial page render entirely
```

#### Where cacheable="false" IS Legitimate

- The **checkout** pages (already excluded via `full_page_cache` handles).
- The **customer account** pages.
- One-off admin or debug pages not accessible to general visitors.

- **Exam focus:** `cacheable="false"` on **one** block = **zero** FPC for the entire URL. Not partial caching — zero.
- **Exam focus:** The architecturally correct answer for personalized content is private content sections (customer data JS sections) or ESI, **not** `cacheable="false"`.
- **Exam focus:** `cacheable="false"` vs. a block with `ttl="0"` — `ttl` controls the cache lifetime for Varnish ESI; `cacheable="false"` is a completely different mechanism.

---

### 2.5 GraphQL GET for Cacheable Queries; POST Loses FPC

#### The Rule

| HTTP Method | FPC Behavior | Use Case |
|-------------|-------------|----------|
| `GET` | **FPC cacheable** (Varnish/Fastly can cache) | Read-only queries (products, categories, CMS) |
| `POST` | **NOT FPC cacheable** — ever | Mutations; authenticated queries; cart operations |

#### Why This Matters

Varnish and Fastly cache based on HTTP semantics. `POST` requests are **never** cached by HTTP caching proxies by design (HTTP spec). Even if your GraphQL query is semantically read-only, if it's sent as `POST`, the FPC layer **will not cache it**.

#### Sending a Cacheable GraphQL Request

```bash
# CACHEABLE - GET request with query in URL
curl -X GET \
  "https://example.com/graphql?query=\{products(search:%22bag%22)\{items\{name\}\}\}" \
  -H "Content-Type: application/json"

# NOT CACHEABLE - POST request (same query, different method)
curl -X POST \
  "https://example.com/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query": "{products(search:\"bag\"){items{name}}}"}'
```

#### The GET Request Constraints

- Query must be URL-encoded in the query string.
- Maximum URL length limits apply (~2000 characters in most browsers/servers).
- Complex queries with many fields may exceed URL length — this is a **real architectural constraint**.
- Variables can be passed as `?query=...&variables={...}`.

#### Cache Invalidation

```
GraphQL FPC cache tags work same as page cache:
- Product query cached with tag "cat_p_<id>"
- When product saved: cache tag invalidated
- Next GET request: cache miss, re-fetched and re-cached
```

- **Exam focus:** `GET` = cacheable by FPC. `POST` = never cacheable by FPC. This is an HTTP-level constraint, not a Magento configuration.
- **Exam focus:** An architect choosing `POST` for a public product listing GraphQL query is making an **architectural mistake** — it eliminates FPC benefits.
- **Exam focus:** Authenticated requests (with `Authorization: Bearer` header) are not cached by Varnish regardless of GET/POST, because Varnish varies on the `Authorization` header.

---

### 2.6 MSI Append-Only Reservations

#### The Architecture

Multi-Source Inventory (MSI) uses an **append-only reservation log** for salable quantity tracking. This is a deliberate architectural choice for high-concurrency environments.

#### How It Works

```
inventory_reservation table:
+---------------+------------+-----------+----------+
| reservation_id| stock_id   | sku       | quantity |
+---------------+------------+-----------+----------+
|      1        |     1      | SKU-001   |  -1.0000 | <-- order placed (reserve 1)
|      2        |     1      | SKU-001   |  -1.0000 | <-- another order placed
|      3        |     1      | SKU-001   |  +1.0000 | <-- order cancelled (release)
+---------------+------------+-----------+----------+

Salable QTY = source_item.quantity + SUM(reservation.quantity)
           = 10                    + (-1 + -1 + 1)
           = 10 - 1
           = 9
```

#### The Critical Misconception

> **`source_item.quantity` does NOT decrease when an order is placed.**

`source_item.quantity` only decreases when a **shipment is created** (physical deduction). The reservation log tracks the "soft hold" between order placement and shipment.

```
Timeline:
  Order placed  -->  reservation -1 added  -->  source_item.qty UNCHANGED
  Shipment created  -->  reservation +1 (compensation)  -->  source_item.qty decremented
```

#### Why Append-Only

- **No row locking** on the `source_item` table during high-traffic checkout.
- Multiple concurrent orders write **new rows** to `inventory_reservation`, not update the same row.
- Eliminates deadlocks on `catalog_inventory_stock_item` that plagued pre-MSI Magento.

#### The Cleanup Mechanism

The `inventory_reservation` table grows over time. Adobe provides CLI tools:

```bash
# Show unresolved reservation inconsistencies
bin/magento inventory:reservation:list-inconsistencies

# Create compensating entries to resolve inconsistencies
bin/magento inventory:reservation:create-compensations
```

- **Exam focus:** `source_item.quantity` does **not** reflect "available to sell" — it reflects physical/on-hand quantity.
- **Exam focus:** Salable quantity = `source_item.qty` + `SUM(inventory_reservation.quantity)`. You must sum the reservation log.
- **Exam focus:** The append-only pattern is chosen specifically to avoid row-level locking at high concurrency. This is the **architectural reason**.
- **Exam focus:** Reservations are cleaned up via compensation entries, not by deleting rows.

---

### 2.7 SCD_ON_DEMAND=true Is Bad for Production

#### What SCD_ON_DEMAND Does

When `SCD_ON_DEMAND=true`, static content is **not** deployed during the build/deploy phase. Instead, each static asset is generated **on the first request** by the application.

```
SCD_ON_DEMAND=false (Production default):
  Deploy phase --> all static files pre-generated --> requests served instantly

SCD_ON_DEMAND=true (Development convenience):
  Deploy phase --> no static files generated
  First request for style.css --> PHP generates it on the fly --> latency spike
  Second request for style.css --> served from pub/static cache --> fast
```

#### The Latency Spike Problem

```
User #1 hits homepage after deploy (SCD_ON_DEMAND=true):
  - Request for main.css: NOT found in pub/static
  - PHP: trigger static content deploy for this file
  - Response time: 3-8 seconds for CSS generation
  - User sees unstyled page or timeout

User #2 hits homepage 1 second later:
  - Request for main.css: FOUND in pub/static
  - Response time: normal
```

#### Environment Variable Context

```yaml
# .magento.env.yaml
stage:
  global:
    SCD_ON_DEMAND: false   # CORRECT for production
  build:
    SCD_STRATEGY: quick    # Strategies: quick (default), standard, compact
    SCD_THREADS: 4
```

<!-- CORRECTED: Original showed SCD_STRATEGY: compact as the example value.
     Default is `quick`. Options:
     - quick (default): deploys only active themes, fastest
     - standard: all locales/themes, full file copies, slowest
     - compact: uses symlinks to minimize disk usage, dev/test only
     Confirmed via Day 17/18 verified facts. -->

#### When SCD_ON_DEMAND IS Appropriate

| Environment | SCD_ON_DEMAND | Reason |
|-------------|--------------|--------|
| Production | `false` | Pre-generate all assets; consistent response times |
| Staging | `false` | Mirror production behavior |
| Integration | `true` (optional) | Faster deploys acceptable; not user-facing |
| Local dev | `true` | Developer convenience |

- **Exam focus:** `SCD_ON_DEMAND=true` in production = latency spikes on first request per asset after deploy. This is an **architectural anti-pattern** for production.
- **Exam focus:** The default for production should be SCD during the **build** phase (fastest deploys, smallest maintenance window).
- **Exam focus:** `SCD_STRATEGY` options: `quick` (default — active themes only), `standard` (all locales and themes, full copies), `compact` (symlinks, minimizes disk, dev/test only).

<!-- CORRECTED: Original stated "quick (faster, fewer symlinks)" and "compact (minimizes disk space)".
     Descriptions were confused. Symlinks are the characteristic of `compact`, not `quick`.
     `quick` is faster because it deploys only active themes, not because of symlinks.
     `compact` uses symlinks which minimize disk usage (dev/test environments only). -->

---

### 2.8 Observer Execution Order Is NOT Guaranteed

#### The Core Rule

When multiple observers are registered to the same event, their execution order **is not deterministic** and **should never be relied upon** as an architectural decision.

#### Why

Magento collects observers from `events.xml` files across all modules. The merge order of these XML files depends on module load order, which depends on `sequence` declarations in `module.xml`. Even with `sequence` dependencies, the **observer order within a merged configuration is not formally guaranteed** by the framework contract.

```xml
<!-- Module A: vendor/module-a/etc/events.xml -->
<event name="catalog_product_save_after">
    <observer name="module_a_observer"
              instance="Vendor\ModuleA\Observer\ProductSave"/>
</event>

<!-- Module B: vendor/module-b/etc/events.xml -->
<event name="catalog_product_save_after">
    <observer name="module_b_observer"
              instance="Vendor\ModuleB\Observer\ProductSave"/>
</event>
```

```
Which observer runs first? UNDEFINED.
Do NOT write code that assumes A runs before B.
```

#### The Architectural Implication

If your feature **requires** Observer A to complete before Observer B can function correctly, you have a design flaw. The correct patterns are:

```
Anti-pattern: Two observers on same event with implicit ordering dependency
  observer_A: Sets $product->setData('flag', true)
  observer_B: Reads $product->getData('flag') -- UNRELIABLE

Correct pattern 1: Merge into ONE observer that does both operations in sequence

Correct pattern 2: Use a Plugin instead (sortOrder IS guaranteed for plugins)

Correct pattern 3: Refactor so observers are truly independent
```

#### Contrast with Plugins

| Mechanism | Order Guaranteed? | How |
|-----------|------------------|-----|
| Plugins | **Yes** | `sortOrder` attribute (tiebreaker: module load sequence) |
| Observers | **No** | No ordering mechanism in framework contract |

- **Exam focus:** Observer order is **not guaranteed**. Plugin order **is** guaranteed via `sortOrder`.
- **Exam focus:** If a scenario requires ordered execution, the architecturally correct answer is a **plugin**, not observers.
- **Exam focus:** Observers should be **idempotent** and **independent** from each other — this is the design contract.

---

### 2.9 Extension Attributes Are Not EAV

#### What They Are

Extension attributes are a **PHP interface-level extensibility mechanism** — they extend the data contract of a service interface without modifying the core database schema.

#### What EAV Is

Entity-Attribute-Value (EAV) is a **database storage pattern** where attributes are stored as rows (`eav_attribute`, `catalog_product_entity_varchar`, etc.) rather than columns.

#### The Critical Differences

| Dimension | Extension Attributes | EAV |
|-----------|---------------------|-----|
| **Layer** | Service/API layer (PHP interfaces) | Database storage layer |
| **Storage** | You define — any table, any source | eav_* tables |
| **Schema** | Your custom table/column | Shared EAV tables |
| **Performance** | Depends on your join | Known EAV join overhead |
| **Type safety** | Strongly typed via interface | Loose (all stored as varchar/text/etc.) |
| **Use case** | Extending API data contracts | Adding attributes to EAV entities |
| **Admin UI** | Not automatic | Automatic via attribute management |
| **Purpose** | Interoperability between modules | Flexible schema extension |

#### Extension Attribute Declaration

```xml
<!-- etc/extension_attributes.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Api/etc/extension_attributes.xsd">
    <extension_attributes for="Magento\Catalog\Api\Data\ProductInterface">
        <attribute code="vendor_custom_field" type="string"/>
    </extension_attributes>
</config>
```

```php
// Extension attributes live on the ExtensionInterface, auto-generated
/** @var \Magento\Catalog\Api\Data\ProductExtensionInterface $extensionAttributes */
$extensionAttributes = $product->getExtensionAttributes();
$extensionAttributes->setVendorCustomField('value');
$product->setExtensionAttributes($extensionAttributes);
```

#### What Extension Attributes Are NOT

- They are **not** stored in EAV tables automatically.
- They do **not** add columns to `catalog_product_entity`.
- They have **no** UI in the admin attribute management grid.
- They are **not** visible in the admin product edit form without additional work.
- They are **not** the same as `custom_attributes` (which IS an EAV concept in the API).

- **Exam focus:** Extension attributes = API/interface layer extension. EAV = database storage pattern. They solve **different problems at different layers**.
- **Exam focus:** `custom_attributes` in the Product API response = EAV attributes. `extension_attributes` = custom extension data. Know the difference.
- **Exam focus:** Extension attributes require **explicit persistence code** — saving the extension attribute to your custom table is your responsibility.

---

### 2.10 Repository getList + extensionAttributesJoinProcessor Must Be Called Explicitly

#### The Problem

When you implement a custom repository's `getList()` method, extension attributes added by **other modules** to your entity are **not automatically joined or loaded**. You must explicitly invoke the `ExtensionAttributesJoinProcessor`.

#### Why

The `ExtensionAttributesJoinProcessor` reads all `extension_attributes.xml` declarations that apply to your entity interface, then adds the necessary JOINs to your collection's `Select` object. It does not run automatically — it must be called.

#### The Correct Implementation Pattern

```php
<?php
namespace Vendor\Module\Model;

use Magento\Framework\Api\ExtensionAttribute\JoinProcessorInterface;
use Magento\Framework\Api\SearchCriteria\CollectionProcessorInterface;

class FooRepository implements \Vendor\Module\Api\FooRepositoryInterface
{
    private JoinProcessorInterface $extensionAttributesJoinProcessor;
    private CollectionProcessorInterface $collectionProcessor;
    private \Vendor\Module\Model\ResourceModel\Foo\CollectionFactory $collectionFactory;
    private \Vendor\Module\Api\Data\FooSearchResultsInterfaceFactory $searchResultsFactory;

    public function __construct(
        JoinProcessorInterface $extensionAttributesJoinProcessor,
        CollectionProcessorInterface $collectionProcessor,
        \Vendor\Module\Model\ResourceModel\Foo\CollectionFactory $collectionFactory,
        \Vendor\Module\Api\Data\FooSearchResultsInterfaceFactory $searchResultsFactory
    ) {
        $this->extensionAttributesJoinProcessor = $extensionAttributesJoinProcessor;
        $this->collectionProcessor = $collectionProcessor;
        $this->collectionFactory = $collectionFactory;
        $this->searchResultsFactory = $searchResultsFactory;
    }

    public function getList(\Magento\Framework\Api\SearchCriteriaInterface $searchCriteria)
    {
        $collection = $this->collectionFactory->create();

        // STEP 1: JOIN extension attributes tables
        // WITHOUT this line, extension attributes from other modules are silently missing
        $this->extensionAttributesJoinProcessor->process($collection);

        // STEP 2: Apply filters, sort, pagination from SearchCriteria
        $this->collectionProcessor->process($searchCriteria, $collection);

        // STEP 3: Build search results
        $searchResults = $this->searchResultsFactory->create();
        $searchResults->setSearchCriteria($searchCriteria);
        $searchResults->setItems($collection->getItems());
        $searchResults->setTotalCount($collection->getSize());

        return $searchResults;
    }
}
```

#### What Happens Without the JoinProcessor

```
Scenario:
  Module B adds extension attribute "warranty_years" to FooInterface
  Module B declares this in extension_attributes.xml with a join directive

Without JoinProcessor in getList():
  - collection SQL has NO JOIN to warranty table
  - $item->getExtensionAttributes()->getWarrantyYears() returns NULL
  - No error thrown -- silent data loss

With JoinProcessor in getList():
  - collection SQL includes JOIN to warranty table
  - $item->getExtensionAttributes()->getWarrantyYears() returns correct value
```

#### The Join Directive in extension_attributes.xml

```xml
<extension_attributes for="Vendor\Module\Api\Data\FooInterface">
    <attribute code="warranty_years" type="int">
        <join reference_table="vendor_warranty"
              reference_field="foo_id"
              join_field="entity_id">
            <field>warranty_years</field>
        </join>
    </attribute>
</extension_attributes>
```

- **Exam focus:** `extensionAttributesJoinProcessor->process($collection)` must be called **explicitly** in `getList()`. It is **never** automatic.
- **Exam focus:** Forgetting this call causes **silent data loss** (null values, no exception). This is a classic debugging trap.
- **Exam focus:** The join processor reads all `extension_attributes.xml` files at runtime — it handles all modules' join declarations for your entity, not just your own.
- **Exam focus:** `CollectionProcessor` handles `SearchCriteria` (filters, sorting, pagination) — it is a **separate concern** from the join processor.

---

## 3. Architectural Decision Framework

> This section addresses the exam's emphasis on *why* — scenario questions where multiple answers are technically valid.

### The Decision Hierarchy

When facing a scenario question, mentally rank answers using this hierarchy:

```
1. Does it maintain backward compatibility / API contracts?
2. Does it follow the Single Responsibility Principle?
3. Does it preserve cacheability?
4. Does it scale (no N+1, no full-table scans, no row locks)?
5. Does it use the correct extension point (plugin vs. observer vs. preference)?
6. Is it reversible / can it be disabled without data loss?
```

### Extension Point Decision Tree

```
Need to modify behavior of a method?
    |
    +-- Is it a public method on a non-final class?
    |       |
    |       YES --> Plugin (before/around/after)
    |       |       (preferred: maintains DI, other plugins still work)
    |       |
    |       NO (final class / non-public method)
    |           --> Event/Observer if event exists
    |           --> Preference (last resort -- breaks other plugins)
    |
Need to react to something that happened?
    |
    YES --> Observer
    |       (no guaranteed order; keep independent)
    |
Need to add data to an API response?
    |
    YES --> Extension Attributes (not EAV, not magic setData)
    |
Need to add UI configuration?
    |
    YES --> ui_component XML / layout XML
```

### The "Architecturally Superior" Signals

When two answers look equally valid, the **architecturally superior** one:

| Signal | What It Indicates |
|--------|------------------|
| Uses Service Contracts (interfaces) | Preferred over concrete class usage |
| Uses Repository pattern | Preferred over direct ResourceModel calls |
| Preserves FPC | Architecturally superior to `cacheable="false"` |
| Uses plugin over preference | Doesn't break other customizations |
| Uses SearchCriteria / getList | Preferred over custom collection queries in service layer |
| Keeps business logic in Model/Service | Not in Block, not in Template |
| Uses declarative schema | Preferred over `InstallSchema.php` for Magento 2.3+ |

---

## 4. Scenario-Based Question Survival Guide

### Common Scenario Patterns and Their Traps

#### Scenario Type 1: "Which is the best way to add data to the product API response?"

```
Trap answers:
  A) Override ProductRepository with a preference              <-- breaks other modules
  B) Add a plugin on getById and setData on the product        <-- uses magic setData, not type-safe
  C) Use extension attributes + after plugin on getById        <-- CORRECT
  D) Add a column to catalog_product_entity                    <-- schema change, wrong layer

Why C is correct:
  - Extension attributes maintain the API contract
  - After plugin is the right interception point
  - Type-safe, discoverable, backward compatible
```

#### Scenario Type 2: "How to add customer-specific content without breaking FPC?"

```
Trap answers:
  A) cacheable="false" on the block                            <-- kills entire page FPC
  B) Preference on the block class to inject customer data     <-- still renders server-side
  C) Private content (customer-data section) loaded via JS     <-- CORRECT
  D) Store customer data in cookies and read in template       <-- security issue; not scalable

Why C is correct:
  - Page served from FPC (no PHP hit)
  - JS section load fetches personalized data after page render
  - FPC intact; scalable; correct Magento pattern
```

#### Scenario Type 3: "Two modules need to react to the same event. Module B requires Module A's data."

```
Trap answers:
  A) Use observers; Module A sets registry value; Module B reads it   <-- order not guaranteed;
                                                                          Registry is deprecated pattern
  B) Use observers with sortOrder                                      <-- observers have NO sortOrder
  C) Combine into one observer in a third module                       <-- possible but coupling issue
  D) Use a plugin with sortOrder to guarantee sequence                 <-- CORRECT if on a method

If it must be observers: refactor so they are independent.
If sequence matters: plugins, not observers.
```

#### Scenario Type 4: "Custom module works in CE but shows wrong quantity data in EE."

```
Root cause: Joining catalog_product_entity on entity_id instead of row_id
            Returns multiple rows (one per staging version)

Fix: Change join to row_id in EE-specific code path
     Or: Use Magento\Framework\EntityManager\EntityManager which handles this
```

### The "Why Not" Mental Check

Before choosing an answer, ask:
- *Why would I NOT use this approach?*
- If you can name a concrete architectural downside, that answer is probably wrong.
- The correct answer on an architect exam has **no** significant architectural downside given the scenario constraints.

---

## 5. Exam Logistics Checklist

### 24 Hours Before

- [ ] **Pearson VUE account** — log in and confirm your exam appointment shows correctly.
- [ ] **Valid government-issued photo ID** ready — name must match your Pearson VUE account exactly.
- [ ] **Test location confirmed** — physical testing center address noted, or online proctoring confirmed.

### Online Proctoring Setup (if applicable)

- [ ] **Webcam** functional — can see your face clearly, adequate lighting.
- [ ] **Microphone** functional — test audio input in system settings.
- [ ] **Browser** — download and test the **OnVUE** application (Pearson's proctoring app).
- [ ] **Room prepared:**
  - [ ] Desk is clear of papers, books, second monitors, phones.
  - [ ] Room is private — no other people can enter during exam.
  - [ ] Adequate lighting — face clearly visible, no strong backlight.
- [ ] **Phone** — will need to be out of reach but may need it for Pearson ID check.
- [ ] **Network** — wired connection preferred; WiFi acceptable if stable; VPN **off**.
- [ ] **Do NOT use a work laptop** if it has restrictive firewall/proxy — OnVUE may be blocked.

### Day of Exam

- [ ] Wake up with enough time to be calm — not rushed.
- [ ] Eat a normal meal.
- [ ] Arrive at test center 15 minutes early **OR** log into OnVUE 30 minutes before start.
- [ ] Have your ID physically in hand before starting check-in.
- [ ] Close all non-essential applications (for online proctoring).

### During the Exam

- [ ] **Flag difficult questions** and return to them — do not spend 10 minutes on one question.
- [ ] On scenario questions: eliminate clearly wrong answers first, then apply the architectural decision framework.
- [ ] Trust your first instinct on recognition questions — second-guessing costs points.
- [ ] Watch the clock: ~1.5 minutes per question is your budget.

---

## Quick-Reference Checklist

> Everything testable, in bullets. Read once. Know it.

### Plugin System
- [ ] Plugin execution: `before` → `around` → `after`; `after` runs in **reverse** sortOrder
- [ ] Same sortOrder tiebreaker = **module load sequence** (NOT alphabetical by module name)
- [ ] Plugin `disabled="true"` in child di.xml disables by plugin `name` attribute
- [ ] Plugins cannot intercept: `final` methods, `final` classes, static methods, `__construct`
- [ ] Plugin order IS guaranteed (via sortOrder); observer order is NOT

### EE Staging
- [ ] `row_id` = physical PK (version-specific); `entity_id` = logical business key
- [ ] Custom extensions must join on `row_id` in EE, not `entity_id`
- [ ] `row_id` does not exist in CE — EE-specific extensions must handle both
- [ ] Staging stores multiple `row_id` values per `entity_id`

### Cloud Deployment
- [ ] Build phase: **NO database, NO services** — filesystem writable
- [ ] Deploy phase: DB available, maintenance mode, `setup:upgrade` runs here
- [ ] Post-deploy: cache warmup, indexing, Blackfire
- [ ] SCD during build = fastest deploy (smaller maintenance window)
- [ ] SCD_ON_DEMAND=true is **not** for production — latency spikes on first request

### Full Page Cache
- [ ] `cacheable="false"` on ONE block = **entire page** bypasses FPC
- [ ] Correct pattern for personalized content: private content JS sections or ESI
- [ ] GraphQL `GET` = FPC cacheable; `POST` = **never** FPC cacheable
- [ ] Varnish does not cache `POST` — this is HTTP spec, not Magento config
- [ ] Authenticated requests (Authorization header) not cached by Varnish

### MSI
- [ ] `source_item.quantity` = physical/on-hand qty (decremented on **shipment**, not order)
- [ ] Reservations are append-only (negative on order, positive on ship/cancel)
- [ ] Salable qty = `source_item.qty + SUM(inventory_reservation.quantity)`
- [ ] Append-only = no row locks = high-concurrency checkout
- [ ] Use `inventory:reservation:create-compensations` to resolve inconsistencies

### Static Content Deploy
- [ ] `SCD_ON_DEMAND=true` in production = anti-pattern (latency spikes)
- [ ] SCD strategies: `quick` (default — active themes only), `standard` (all locales/themes), `compact` (symlinks, dev only)
- [ ] `SCD_THREADS` controls parallelism during deploy

### Observers
- [ ] Execution order is **not guaranteed** — do not design interdependent observers
- [ ] Observers should be **independent and idempotent**
- [ ] If order matters, use a **plugin** (has sortOrder) instead

### Extension Attributes vs EAV
- [ ] Extension attributes = **API/interface layer** extension (not EAV)
- [ ] EAV = **database storage pattern** for attribute-value rows
- [ ] `custom_attributes` in API = EAV; `extension_attributes` = custom extension data
- [ ] Extension attributes require **manual persistence** — not saved automatically
- [ ] No admin UI for extension attributes without custom work

### Repository Pattern
- [ ] `extensionAttributesJoinProcessor->process($collection)` must be called **explicitly** in `getList()`
- [ ] Forgetting it = silent null values on extension attributes (no exception thrown)
- [ ] `CollectionProcessor` handles SearchCriteria (filters/sort/pagination) — separate concern
- [ ] Always inject both `JoinProcessorInterface` and `CollectionProcessorInterface`

### Architectural Decision Principles
- [ ] Plugin > Preference (plugins stack; preferences replace and break others)
- [ ] Service Contracts (interfaces) > concrete class dependencies
- [ ] Repository pattern > direct ResourceModel in service layer
- [ ] Declarative schema (`db_schema.xml`) > `InstallSchema.php` for 2.3+
- [ ] Business logic in Model/Service — not in Block or Template
- [ ] Scenario question: eliminate wrong first, apply decision hierarchy, trust first instinct
- [ ] "Architecturally superior" = no significant downside within scenario constraints

### GraphQL
- [ ] Queries: read-only; Mutations: write operations
- [ ] GET requests for public queries = FPC cached
- [ ] POST mutations = not cached (by design)
- [ ] Authorization header on any request = no Varnish cache

### Final Reminders
- [ ] You know this. 13 years of AC experience is not in these notes — it's in you.
- [ ] Stop studying at 8 PM.
- [ ] Sleep is more valuable than one more pass through the docs.
- [ ] The exam tests architectural judgment, not syntax memorization.
- [ ] **Go get it.**

---

*End of Exam Eve Review — May 7*
*Next document you open: your Pearson VUE confirmation email.*
