# Magento 2 Architect Exam — Search, Indexing & Caching Architecture

**Study Session:** April 22 | Week 2 — Section 1 (Advanced Design) + Section 2 Intro

---

## Table of Contents

1. [Indexing Architecture Overview](#1-indexing-architecture-overview)
2. [MView: Change-Tracking Infrastructure](#2-mview-change-tracking-infrastructure)
3. [Index Modes: Update on Save vs Update by Schedule](#3-index-modes-update-on-save-vs-update-by-schedule)
4. [Indexer Declaration: indexer.xml Deep Dive](#4-indexer-declaration-indexerxml-deep-dive)
5. [EE Indexers: SharedCatalog & CMS Staging](#5-ee-indexers-sharedcatalog--cms-staging)
6. [Cache Types and Invalidation](#6-cache-types-and-invalidation)
7. [CacheContext + IdentityInterface: Tag-Based FPC Invalidation](#7-cachecontext--identityinterface-tag-based-fpc-invalidation)
8. [Redis L2 Cache: RemoteSynchronizedCache](#8-redis-l2-cache-remotesynchronizedcache)
9. [Search Architecture: OpenSearch, MySQL, and Live Search](#9-search-architecture-opensearch-mysql-and-live-search)
10. [Hands-On CLI Reference](#10-hands-on-cli-reference)
11. [Scenario-Based Architectural Decision Guide](#11-scenario-based-architectural-decision-guide)
12. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Indexing Architecture Overview

Magento's indexing system transforms normalized, write-optimized source data into denormalized, read-optimized flat tables used for storefront performance. Without indexing, every product listing page would require complex joins across dozens of tables in real time.

```
Source Tables (normalized)        Index Tables (flat/denormalized)
+-------------------------+       +------------------------------+
| catalog_product_entity  |       | catalog_product_index_price  |
| catalog_product_entity_ |  -->  | catalog_product_index_eav    |
|   decimal (prices, etc) |       | catalogsearch_fulltext        |
| catalog_category_entity |       | catalog_category_product_index|
+-------------------------+       +------------------------------+
         ^                                      ^
         |                                      |
   Writes happen here                   Reads happen here
   (admin saves)                        (storefront queries)
```

**Why this matters architecturally:**
- The gap between "source truth" and "indexed truth" is the core tradeoff every Magento architect must understand
- Index staleness is a *design decision*, not a bug — Update by Schedule intentionally accepts eventual consistency for performance gains
- The architect exam will present scenarios where you must choose between consistency and performance

---

## 2. MView: Change-Tracking Infrastructure

### 2.1 What is MView?

MView (Materialized View) is Magento's mechanism for tracking *which rows changed* in source tables without performing a full re-index. It is the engine behind **Update by Schedule** mode.

**Exam focus:** MView is NOT a MySQL materialized view — it is a Magento-level abstraction that uses MySQL triggers and changelog tables to simulate change tracking.

### 2.2 The Changelog Table Pattern

When MView is active, Magento creates MySQL triggers on source tables. When a row changes, the trigger inserts the changed row's ID into a changelog table.

```
catalog_product_entity (source)
+-----------+-----------+
| entity_id | sku       |
+-----------+-----------+
| 42        | SKU-001   |  <-- UPDATE happens here
+-----------+-----------+
        |
        | MySQL AFTER UPDATE trigger fires
        v
catalog_product_entity_cl (changelog)
+-----------+-----------+
| version_id| entity_id |
+-----------+-----------+
| 1001      | 42        |  <-- Record of change
+-----------+-----------+
```

The changelog table name convention is: `{source_table}_cl`

### 2.3 mview.xml Declaration

Each MView subscription is declared in `etc/mview.xml`. The XSD is `urn:magento:framework:Mview/etc/mview.xsd`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Mview/etc/mview.xsd">

    <view id="catalog_product_price"
          class="Magento\Catalog\Model\Indexer\Product\Price"
          group="indexer">

        <subscriptions>
            <!-- Each subscription = one source table to watch -->
            <!-- Actual subscriptions from module-catalog/etc/mview.xml: -->
            <table name="catalog_product_entity" entity_column="entity_id"/>
            <table name="catalog_product_entity_datetime" entity_column="entity_id"/>
            <table name="catalog_product_entity_decimal" entity_column="entity_id"/>
            <table name="catalog_product_entity_int" entity_column="entity_id"/>
            <table name="catalog_product_entity_tier_price" entity_column="entity_id"/>
            <table name="catalog_product_link" entity_column="product_id"/>
            <table name="catalog_product_website" entity_column="product_id"/>
        </subscriptions>
    </view>

</config>
```

**Key attributes:**
| Attribute | Purpose |
|---|---|
| `id` | Unique MView ID, must match `view_id` in `indexer.xml` |
| `class` | The indexer class that processes changelog |
| `group` | Groups related views (used for scheduling) |
| `table name` | Source table to place MySQL trigger on |
| `entity_column` | Column whose value goes into changelog |

**Exam focus:** The `id` in `mview.xml` must match the `view_id` in `indexer.xml`. If they do not match, the indexer will not receive change notifications and will behave as if no changes occurred, even in schedule mode.

### 2.4 MySQL Trigger Mechanics

Magento creates three triggers per subscribed table:
- `{table}_after_insert`
- `{table}_after_update`
- `{table}_after_delete`

```sql
-- Example of what Magento generates (conceptual):
CREATE TRIGGER catalog_product_entity_decimal_after_update
AFTER UPDATE ON catalog_product_entity_decimal
FOR EACH ROW
BEGIN
    INSERT INTO catalog_product_entity_decimal_cl (entity_id)
    VALUES (NEW.entity_id);
END;
```

**Architectural implication:** If a bulk data import bypasses Magento's ORM (direct SQL `INSERT`/`UPDATE`), these triggers still fire — the changelog is populated. This is why MView-based indexing is more resilient than event-based approaches for data migrations.

### 2.5 MView Versioning

The changelog table has a `version_id` auto-increment. MView tracks the last processed `version_id` per indexer in `mview_state` table. On next cron run, the indexer processes only rows with `version_id > last_processed_version`.

`mview_state` table (from `module-indexer/etc/db_schema.xml`):

```
mview_state table:
+--------------------------+----------+-----------+------------------+
| view_id                  | mode     | status    | version_id       |
+--------------------------+----------+-----------+------------------+
| catalog_product_price    | enabled  | idle      | 1001             |
| catalogsearch_fulltext   | enabled  | working   | 998              |
+--------------------------+----------+-----------+------------------+
```

**Mode values** (`StateInterface`): `enabled`, `disabled`
**Status values** (`StateInterface`): `idle`, `working`, `suspended`

**Exam focus:** The `status` column has three values: `idle`, `working`, and `suspended`. If a cron job dies mid-index, status can remain `working`, causing the next run to skip — this is a known operational failure mode.

---

## 3. Index Modes: Update on Save vs Update by Schedule

### 3.1 Update on Save (Real-Time)

```
Admin saves product
        |
        v
Magento ORM fires events
        |
        v
Indexer::executeFull() / executeList() called synchronously
        |
        v
Index tables updated immediately
        |
        v
HTTP response returned to admin
```

**Characteristics:**
- Index is always current — zero staleness
- **Blocks the admin save operation** — the HTTP request does not complete until indexing finishes
- For large catalogs, this can cause 30–60+ second admin saves or even timeouts
- No cron dependency
- MView triggers are NOT used in this mode

**Exam focus:** Update on Save does NOT use MView or changelog tables. MView is exclusively a Schedule mode mechanism.

### 3.2 Update by Schedule (Eventual Consistency)

```
Admin saves product
        |
        v
MySQL trigger fires -> entity_id inserted into _cl table
        |
        v
HTTP response returned immediately (fast save)
        |
        v
[time passes... cron runs every minute]
        |
        v
Indexer reads changelog, processes changed IDs only
        |
        v
Index tables updated
        |
        v
Storefront now reflects the change
```

**Characteristics:**
- Admin save is fast — no blocking indexing
- **Eventual consistency** — there is a lag (typically 1–5 minutes) before changes appear
- Requires cron to be running and healthy
- Scales well for large catalogs
- Uses MView changelog tables

### 3.3 The Critical UX Implication (High-Exam-Probability Scenario)

> **Scenario:** A merchant updates a product price from $99 to $79. A customer searches for the product immediately after the admin save. What price do they see?

**Answer (Update by Schedule mode):** The customer sees **$99** — the old price. The price index has not been updated yet. The search results, layered navigation price facets, and product listing prices all reflect the stale index.

```
Timeline in Update by Schedule mode:

T=0:00  Admin saves price change ($99 -> $79)
        [changelog entry created, admin returns 200 OK]

T=0:00  Customer searches, sees $99 (stale index)
T=0:30  Customer searches, sees $99 (stale index)
T=1:00  Cron fires, indexer processes changelog
T=1:05  Indexer complete, index tables updated

T=1:06  Customer searches, sees $79 (fresh index)
```

**Architectural decision guidance:**
- For flash sales with immediate price drops → consider Update on Save for price indexer specifically, or trigger manual re-index via API/event
- For normal catalog management → Update by Schedule is architecturally superior due to performance
- The exam will present this as: *"Which mode should you recommend for a high-volume B2C site with frequent admin saves?"* — Answer: **Update by Schedule**, accepting the consistency tradeoff

### 3.4 Comparison Table

| Characteristic | Update on Save | Update by Schedule |
|---|---|---|
| Index freshness | Immediate | Eventual (cron-dependent) |
| Admin save speed | Slow (blocking) | Fast (non-blocking) |
| Uses MView/triggers | No | Yes |
| Cron required | No | Yes |
| Suitable for large catalogs | No | Yes |
| Risk | Admin timeouts | Stale storefront data |
| Partial re-index | Yes (by row) | Yes (by changelog) |

---

## 4. Indexer Declaration: indexer.xml Deep Dive

### 4.1 Full indexer.xml Structure

The XSD: `urn:magento:framework:Indexer/etc/indexer.xsd`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Indexer/etc/indexer.xsd">

    <!-- From vendor/magento/module-catalog/etc/indexer.xml: -->
    <indexer id="catalog_product_price"
             view_id="catalog_product_price"
             class="Magento\Catalog\Model\Indexer\Product\Price">

        <title translate="true">Product Price</title>
        <description translate="true">Index product prices</description>

    </indexer>

</config>
```

> **Correction:** `catalog_product_price` has **no `shared_index` attribute** and **no `dependencies` block** in `module-catalog/etc/indexer.xml`. Its real dependency (`catalogrule_rule`) is declared separately in `module-catalog-rule/etc/indexer.xml`:
>
> ```xml
> <!-- vendor/magento/module-catalog-rule/etc/indexer.xml -->
> <indexer id="catalog_product_price">
>     <dependencies>
>         <indexer id="catalogrule_rule" />
>     </dependencies>
> </indexer>
> ```
>
> `shared_index` is used for indexers that share index tables. Examples from module-catalog: `catalog_category_product` and `catalog_product_category` both declare `shared_index="category_product"`. `catalog_product_price` does NOT use `shared_index`.

**Key attributes explained:**

| Attribute | Description | Exam Trap |
|---|---|---|
| `id` | Unique indexer identifier used in CLI | Must be unique across all modules |
| `view_id` | Links to `mview.xml` view id | Must match exactly or schedule mode breaks |
| `class` | PHP class implementing `ActionInterface` | Must implement `executeFull()`, `executeList()`, `executeRow()` |
| `shared_index` | This indexer shares index tables with another | Prevents duplicate full reindexes |
| `dependencies` | Indexers that must complete first | Dependency failures cascade; declared in the module that adds the dep |

### 4.2 The ActionInterface Contract

The class referenced in `indexer.xml` must implement `Magento\Framework\Indexer\ActionInterface` (`@api`):

```php
<?php
namespace Magento\Framework\Indexer;

/**
 * @api Implement custom Action Interface
 */
interface ActionInterface
{
    /**
     * Execute full indexation
     */
    public function executeFull();

    /**
     * Execute partial indexation by ID list
     * Called by MView cron (receives IDs from changelog)
     */
    public function executeList(array $ids);

    /**
     * Execute partial indexation by ID
     * Called by Update on Save (single entity)
     */
    public function executeRow($id);
}
```

> **Distinction from `IndexerInterface`:** `Magento\Framework\Indexer\IndexerInterface` is a different, higher-level interface used by the framework to manage indexer state and dispatch (it is `@deprecated 102.0.0` and has many more methods: `load()`, `getView()`, `getState()`, `isScheduled()`, etc., plus wrappers `reindexAll()`, `reindexRow()`, `reindexList()` that delegate to `ActionInterface`). Custom indexer **classes** implement `ActionInterface`. The indexer **facade objects** (used by CLI/admin) implement `IndexerInterface`.

**Exam focus:** `executeList()` is what the MView cron calls — it receives the array of entity IDs from the changelog. `executeFull()` is what `bin/magento indexer:reindex` calls.

### 4.3 Dependency Resolution

Dependencies ensure index integrity. Example: `catalog_product_price` depends on `catalogrule_rule` because catalog rule prices must be computed before product prices are indexed.

```
catalogrule_rule (catalog rule indexer)
        |
        | must complete first (declared in module-catalog-rule)
        v
catalog_product_price (price index)
        |
        | must complete first
        v
catalogsearch_fulltext (search index, needs price data)
```

**Exam focus:** If you run `bin/magento indexer:reindex catalog_product_price` but a dependency is invalid, Magento will reindex the dependency first automatically. This is declarative dependency management — not procedural scripting.

---

## 5. EE Indexers: SharedCatalog & CMS Staging

### 5.1 SharedCatalog Price Indexer (B2B)

Magento Commerce B2B introduces per-company pricing through the SharedCatalog module. This requires a separate price indexer that runs alongside the standard price indexer.

```
Standard price index:
  catalog_product_index_price (all customers)

SharedCatalog price index:
  catalog_product_index_price + company dimension
  (price per company group, not just per customer group)
```

**Architectural implications:**
- The SharedCatalog indexer dramatically increases index table size — each product price is stored per company, not just per customer group
- Full reindex time can be 10x longer than CE
- **Exam focus:** SharedCatalog uses Magento's Price Dimension feature — the price indexer is dimensioned by `customer_group` AND `website` AND potentially `company`

### 5.2 CMS Staging Indexer (Magento Commerce)

Content Staging (EE-only) introduces the concept of **preview versions** and **scheduled updates**. The staging indexer must:

1. Maintain the "current" index for live visitors
2. Maintain separate index versions for scheduled future states
3. Switch the active index atomically when a scheduled update activates

```
Time-based index versioning:

Version 1 (current live):      Product A = $99
Version 2 (scheduled T+2hrs):  Product A = $79 (sale starts)
Version 3 (scheduled T+26hrs): Product A = $99 (sale ends)

At T+2hrs: cron switches version pointer from 1 -> 2
At T+26hrs: cron switches version pointer from 2 -> 3
```

**Exam focus:** CMS Staging changes the indexer contract — indexers must be "staging-aware." This is why custom indexers in EE must consider staging compatibility, or they will not correctly handle previews and scheduled updates.

---

## 6. Cache Types and Invalidation

### 6.1 Complete Cache Type Reference

Magento has 12+ distinct cache types. Know each, what it stores, and what invalidates it:

| Cache Type ID | Name | Stores | Invalidated By |
|---|---|---|---|
| `config` | Configuration | Merged `config.xml`, DI config, system config | `bin/magento cache:clean config`, any config save |
| `layout` | Layouts | Merged `layout.xml` handles and block structures | Layout XML changes, `bin/magento cache:clean layout` |
| `block_html` | Blocks HTML Output | Rendered HTML of individual blocks | Block cache lifetime, tag-based, flush |
| `collections` | Collections Data | Results of `getCollection()` queries | Model saves, manual flush |
| `reflection` | Reflection Data | PHP class method/property reflection for DI | Class changes (dev mode auto-clears) |
| `db_ddl` | Database DDL | Table structures, column types, indexes | Schema changes, `setup:upgrade` |
| `compiled_config` | Compiled Config | Compiled DI/plugin definitions | `bin/magento setup:di:compile` |
| `eav` | EAV Types and Attributes | EAV attribute metadata | Attribute creation/modification |
| `full_page` | Full Page Cache | Complete rendered HTML pages | Cache tags, TTL, manual flush |
| `translate` | Translations | Merged translation strings | Translation file changes |
| `vertex` | Vertex Tax | Vertex API response cache | Tax config changes |
| `config_integration` | Integration Config | OAuth integration config | Integration changes |

### 6.2 Architectural Cache Invalidation Logic

**Exam focus:** Understanding *why* each cache is invalidated is more testable than memorizing the list.

```
Config cache invalidation trigger chain:

Admin saves store config value
        |
        v
System config model saves to core_config_data
        |
        v
Config cache tagged as invalid
        |
        v
On next request: config re-merged from all config.xml files
        |
        v
This may also invalidate layout (if config affects layout)
        |
        v
layout cache also tagged as invalid
```

### 6.3 Cache Mode: Enabled vs Disabled vs Invalidated

These are three distinct states:

```
ENABLED:     Cache is active, serving cached content
DISABLED:    Cache is off, never serves cached content (dev use)
INVALIDATED: Cache is active but marked dirty — next request regenerates
```

**Exam focus:** `bin/magento cache:clean` clears the cache storage (forces regeneration). `bin/magento cache:flush` destroys the underlying cache storage entirely (affects all applications sharing that Redis instance). **Clean is preferred in production** — flush can evict caches from other processes.

---

## 7. CacheContext + IdentityInterface: Tag-Based FPC Invalidation

### 7.1 The Problem Tag-Based Caching Solves

Without cache tags, the only way to invalidate the FPC for a product change is to flush the entire full-page cache — this means all pages go cold simultaneously, causing a thundering herd problem.

With cache tags, only pages that contain the changed product become invalid.

### 7.2 IdentityInterface

Any block that wants to participate in tag-based FPC invalidation must implement `Magento\Framework\DataObject\IdentityInterface`:

```php
<?php
namespace MyVendor\Catalog\Block;

use Magento\Framework\View\Element\Template;
use Magento\Framework\DataObject\IdentityInterface;
use Magento\Catalog\Model\Product;

class ProductBlock extends Template implements IdentityInterface
{
    private Product $product;

    public function __construct(
        Template\Context $context,
        Product $product,
        array $data = []
    ) {
        $this->product = $product;
        parent::__construct($context, $data);
    }

    /**
     * Return cache identities (tags) for this block.
     * These tags are added to X-Magento-Tags response header.
     * When product is saved, Magento invalidates all cached pages
     * tagged with cat_p_{id}.
     */
    public function getIdentities(): array
    {
        return $this->product->getIdentities();
        // Returns at minimum: ['cat_p_42'] for product ID 42
    }
}
```

### 7.3 Standard Cache Tag Patterns

**Important:** The `getIdentities()` method on core models returns the **specific entity tag** as the primary return value. The generic "all entities" tag is only added conditionally (status change, deletion, etc.).

```php
// Product model (Magento\Catalog\Model\Product):
// Primary return: specific tag only
['cat_p_42']           // product 42 specific tag
// Generic 'cat_p' is NOT always returned — only added conditionally
// (e.g., when status changes or product is deleted)

// Category model (Magento\Catalog\Model\Category):
// Primary return: specific tag only
['cat_c_5']            // category 5 specific tag
// Generic 'cat_c' is NOT always returned — only added when category is
// deleted, inactive, or include_in_menu changes

// CMS Page (Magento\Cms\Model\Page):
// Always returns ONLY the specific tag — no generic tag
['cms_p_3']            // page 3 specific tag
// 'cms_p' generic tag is NEVER in Page::getIdentities()
```

Use constants for tag generation:
```php
\Magento\Catalog\Model\Product::CACHE_TAG          // 'cat_p'
\Magento\Catalog\Model\Category::CACHE_TAG         // 'cat_c'
\Magento\Cms\Model\Page::CACHE_TAG                 // 'cms_p'
```

**Exam focus:** Always return the **specific entity tag** (e.g., `cat_p_42`) in custom block `getIdentities()` — this is what triggers targeted FPC invalidation on entity save. If you return only the generic tag `cat_p`, ALL product pages invalidate on any product save, causing cache thrash.

### 7.4 CacheContext: How Tags Flow to the HTTP Header

```
Request lifecycle:

HTTP Request arrives
        |
        v
Page renders, blocks execute getIdentities()
        |
        v
CacheContext aggregates all tags from all blocks
        |
        v
HTTP Response generated with header:
X-Magento-Tags: cat_p_42,cat_c_5,store,cms_p_1
        |
        v
Varnish/Fastly caches the page AND stores the tags
        |
        v
Later: product 42 is saved in admin
        |
        v
Magento calls cache invalidation for tag 'cat_p_42'
        |
        v
Varnish/Fastly receives BAN request for pages tagged cat_p_42
        |
        v
Only pages containing product 42 are purged
```

### 7.5 The Critical Failure Mode (High-Exam-Probability)

> **Scenario:** A developer creates a custom block showing product data but `getIdentities()` returns an empty array `[]`. What happens?

**Answer chain:**
1. The page is cached by FPC with no product tags
2. `X-Magento-Tags` header contains no product identities
3. When the product is updated/saved, Magento invalidates tag `cat_p_42`
4. The cached page does NOT match that tag → it is NOT invalidated
5. **The cached page serves stale data until TTL expiry** — potentially for hours

```php
// WRONG - returns no useful tags:
public function getIdentities(): array
{
    return []; // Page will never invalidate on product changes
}

// WRONG - returns parent tags only, not entity-specific:
public function getIdentities(): array
{
    return [\Magento\Catalog\Model\Product::CACHE_TAG]; // 'cat_p'
    // This only invalidates when ANY product changes - too broad, causes cache thrash
}

// CORRECT - returns entity-specific tag:
public function getIdentities(): array
{
    return [
        \Magento\Catalog\Model\Product::CACHE_TAG . '_' . $this->product->getId()
    ];
    // ['cat_p_42'] - invalidates precisely on product 42 save
}
```

**Exam focus:** Wrong tags = pages never invalidate (empty) OR all pages invalidate on any product change (too broad). The architect must specify the correct granularity of cache tags.

### 7.6 Forcing Cache Context on Dynamic Blocks

If a block must always be dynamic (never cached at page level), use the `cacheable="false"` attribute:

```xml
<!-- In layout XML: marks the entire page as uncacheable -->
<block class="MyVendor\Module\Block\Dynamic"
       name="my.dynamic.block"
       cacheable="false"/>
```

**Exam focus:** One `cacheable="false"` block anywhere in the layout tree makes the **entire page** uncacheable. This is a common performance bug — a single developer adding this attribute to a minor block disables FPC for that entire page type.

---

## 8. Redis L2 Cache: RemoteSynchronizedCache

### 8.1 The Multi-Node Caching Problem

In a single-node setup, the PHP in-process memory (L1 cache) and Redis (remote cache) work well. In a multi-node setup:

```
Node 1 (PHP-FPM)          Node 2 (PHP-FPM)
+-------------------+     +-------------------+
| L1: local memory  |     | L1: local memory  |
| (process-local)   |     | (process-local)   |
+-------------------+     +-------------------+
         |                          |
         +-----------+--------------+
                     |
              +-------------+
              |   Redis     |
              | (L2 remote) |
              +-------------+
```

**Problem:** Node 1 updates Redis (L2), but Node 2's L1 still has the old value. Subsequent requests to Node 2 serve stale L1 data.

### 8.2 RemoteSynchronizedCache Architecture

`Magento\Framework\Cache\Backend\RemoteSynchronizedCache` is Magento's solution:

```php
// env.php configuration:
'cache' => [
    'frontend' => [
        'default' => [
            'id_prefix' => 'abc_',
            'backend' => 'Magento\\Framework\\Cache\\Backend\\RemoteSynchronizedCache',
            'backend_options' => [
                'remote_backend' => '\\Magento\\Framework\\Cache\\Backend\\Redis',
                'remote_backend_options' => [
                    'persistent'        => 0,
                    'server'            => 'redis-host',
                    'database'          => '0',
                    'port'              => '6379',
                    'password'          => '',
                    'compress_data'     => '1',
                ],
                'local_backend' => 'Cm_Cache_Backend_File',
                'local_backend_options' => [
                    'cache_dir' => '/dev/shm/magento/cache/', // RAM disk
                ]
            ],
        ]
    ]
]
```

### 8.3 L1/L2 Synchronization Mechanism

The synchronization uses a **hash-based versioning** approach (using a `:hash` suffix key in Redis):

```
Write operation:
1. Write data to Redis (L2) with version hash (stored at key:hash)
2. Write version hash to local L1
3. Local L1 now has: {key: "hash_of_data"}

Read operation:
1. Check local L1 for version hash of key
2. Check Redis L2 for current version hash (lightweight read of key:hash)
3. If L1 hash == L2 hash: serve from L1 (fast, local)
4. If L1 hash != L2 hash: fetch from L2, update L1 (cache miss, sync)
5. If key not in L2: miss (regenerate)
```

**Exam focus:** `RemoteSynchronizedCache` does NOT eliminate Redis reads entirely — it reduces them by serving from local memory when the version hash matches. The version check itself is a lightweight Redis operation (reading the `:hash` key).

### 8.4 When to Recommend RemoteSynchronizedCache

| Use case | Recommendation |
|---|---|
| Multi-node PHP deployments | Use — eliminates L1 staleness |
| High Redis read volume / latency bottleneck | Use — serves from L1 when hash matches |
| `/dev/shm` RAM disk available for L1 | Use — fast local storage |
| Single-node deployments | Don't use — unnecessary complexity |
| Disk-based L1 storage | Don't use — negates the performance benefit |

---

## 9. Search Architecture: OpenSearch, MySQL, and Live Search

### 9.1 Search Engine Evolution in Magento 2

```
Magento 2.0 - 2.3:   MySQL fulltext search (default)
Magento 2.4.0:        Elasticsearch 7 required (MySQL deprecated but present)
Magento 2.4.4:        Elasticsearch 7 + OpenSearch 1.x supported
Magento 2.4.6:        OpenSearch 2.x supported
Magento 2.4.8:        OpenSearch default, MySQL search REMOVED
```

**Exam focus:** As of Magento 2.4.8, MySQL catalog search is **completely removed** — not deprecated, not optional. Any upgrade path must include OpenSearch or Elasticsearch deployment.

### 9.2 OpenSearch vs Elasticsearch: Architectural Considerations

| Aspect | OpenSearch | Elasticsearch |
|---|---|---|
| License | Apache 2.0 (open source) | Elastic License (proprietary for new versions) |
| Magento support | Default in 2.4.8 | Still supported in 2.4.x |
| AWS managed | Amazon OpenSearch Service | Elastic Cloud (different vendor) |
| API compatibility | Fork from ES 7.10 | Original |
| Recommendation | Preferred for new deployments | Legacy or Elastic Cloud preference |

**Architectural rationale for OpenSearch as default:**
- License clarity for enterprise deployments
- AWS-native managed service aligns with common Magento hosting patterns
- Magento Commerce Cloud uses AWS infrastructure

### 9.3 Search Index Architecture

```
Product save
    |
    v
catalogsearch_fulltext indexer runs
    |
    v
Data sent to OpenSearch via HTTP API:
PUT /magento2_product_1_en/{id}
{
  "sku": "SKU-001",
  "name": "Blue Widget",
  "description": "...",
  "price_1_1": 99.00,
  "category_ids": [3, 5]
}
    |
    v
OpenSearch indexes document
    |
    v
Storefront search queries OpenSearch REST API
```

### 9.4 Live Search (Magento Commerce SaaS)

**Live Search** is Magento's SaaS search service, fundamentally different from embedded search:

```
Traditional embedded search:
  Storefront -> OpenSearch (self-hosted) -> Results

Live Search:
  Storefront -> Adobe Commerce SaaS API (cloud) -> Results
  (index data is synced to Adobe's infrastructure)
```

**Key characteristics:**

| Characteristic | Detail |
|---|---|
| License | Magento Commerce (EE) subscription required |
| Indexing | Product data synced to Adobe SaaS via SaaS Data Export |
| Latency | Typically faster than self-hosted (CDN-backed API) |
| Features | AI-powered ranking, merchandising rules, query autocomplete |
| Infrastructure | No OpenSearch installation required |
| Data residency | Data leaves your infrastructure (compliance consideration) |

**Exam focus:**
- Live Search requires an **EE (Adobe Commerce) license** — not available on Open Source
- Live Search **replaces** the OpenSearch/Elasticsearch search adapter — they cannot run simultaneously
- The SaaS Data Export module handles data synchronization to Adobe's cloud
- **Data residency/compliance** is a valid architectural objection to Live Search in some regulated industries

### 9.5 Search Architecture Decision Tree

```
New Magento deployment - which search?
              |
              v
      Is this Magento EE?
       /             \
      No              Yes
      |               |
      v               v
  OpenSearch      Is compliance/data
  required        residency a concern?
                   /              \
                  Yes              No
                  |                |
                  v                v
             OpenSearch       Is merchandising/
             (self-hosted)    AI ranking needed?
                               /          \
                              No           Yes
                              |             |
                              v             v
                         OpenSearch     Live Search
                         (simpler)      (SaaS, no
                                         infra mgmt)
```

---

## 10. Hands-On CLI Reference

### 10.1 Indexer Status and Management

```bash
# View all indexers and their current status/mode
bin/magento indexer:status

# Expected output:
# +----------------------+------------------+-----------+----------+
# | Title                | Status           | Update On | Schedule |
# +----------------------+------------------+-----------+----------+
# | Product Price        | Ready            | Schedule  | idle     |
# | Category Products    | Reindex Required | Save      |          |
# | Catalog Search       | Ready            | Schedule  | idle     |
# +----------------------+------------------+-----------+----------+

# Reindex a specific indexer
bin/magento indexer:reindex catalog_product_price

# Reindex all indexers
bin/magento indexer:reindex

# Change mode for a specific indexer
bin/magento indexer:set-mode schedule catalog_product_price
bin/magento indexer:set-mode realtime catalog_product_price

# Change mode for all indexers at once
bin/magento indexer:set-mode schedule

# Show indexer configuration
bin/magento indexer:info

# Reset indexer (mark as requiring full reindex)
bin/magento indexer:reset catalog_product_price
```

### 10.2 Cache Management CLI

```bash
# Show cache status
bin/magento cache:status

# Clean specific cache types (preferred in production)
bin/magento cache:clean config full_page

# Clean all caches
bin/magento cache:clean

# Flush ALL cache storage (use with caution in production)
bin/magento cache:flush

# Enable/disable specific cache types
bin/magento cache:enable full_page
bin/magento cache:disable block_html
```

### 10.3 Tracing an Indexer Declaration

**Exercise: Trace the `catalog_product_price` indexer from declaration to execution**

```bash
# Step 1: Find the indexer.xml
find vendor/magento -name "indexer.xml" | xargs grep -l "catalog_product_price"
# -> vendor/magento/module-catalog/etc/indexer.xml
# -> vendor/magento/module-catalog-rule/etc/indexer.xml (adds dependencies)

# Step 2: Find the mview.xml
find vendor/magento -name "mview.xml" | xargs grep -l "catalog_product_price"
# -> vendor/magento/module-catalog/etc/mview.xml

# Step 3: Verify trigger tables exist (after mview setup)
# In MySQL:
# SHOW TRIGGERS LIKE 'catalog_product_entity%';
# SHOW TABLES LIKE '%_cl';

# Step 4: Check mview state
# SELECT * FROM mview_state WHERE view_id = 'catalog_product_price'\G

# Step 5: Check changelog
# SELECT COUNT(*) FROM catalog_product_entity_decimal_cl;
# SELECT * FROM catalog_product_entity_decimal_cl ORDER BY version_id DESC LIMIT 10;
```

### 10.4 Useful MySQL Queries for Indexer Debugging

```sql
-- Check which indexers are in schedule mode and their queue depth
SELECT
    v.view_id,
    v.status,
    v.version_id,
    v.updated,
    (SELECT COUNT(*)
     FROM information_schema.tables
     WHERE table_name = CONCAT(v.view_id, '_cl')) as cl_table_exists
FROM mview_state v;

-- Check changelog table sizes (how many items queued for indexing)
SELECT
    table_name,
    table_rows
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE '%_cl'
ORDER BY table_rows DESC;
```

---

## 11. Scenario-Based Architectural Decision Guide

The architect exam presents scenarios where multiple options are technically valid. This section trains the "why" reasoning.

### Scenario 1: Flash Sale Price Updates

> **Q:** A merchant runs flash sales where prices drop for 1 hour. They need the storefront to reflect price changes within seconds of activation. All indexers are currently in Update by Schedule mode. What is the best architectural recommendation?

**Analysis:**
- Update by Schedule has ~1 min lag — unacceptable for flash sales
- Switching all indexers to Update on Save will slow every admin save — overengineered
- Switching only the price indexer to Update on Save is targeted but still blocks admin during the price batch update

**Architecturally superior answer:** Keep Update by Schedule for normal operations. Implement a **custom event observer** on the flash sale activation event that triggers `bin/magento indexer:reindex catalog_product_price` via shell or adds IDs to a custom immediate queue. Alternatively, use Magento's **scheduled update** (EE Staging) which atomically switches the index version.

**Exam trap:** "Switch to Update on Save" is technically correct but architecturally inferior because it degrades all admin saves, not just flash sale events.

---

### Scenario 2: Block Never Shows Fresh Data

> **Q:** A block displaying a "Recently Viewed" product widget never shows updated product names after admin edits. FPC is enabled. `getIdentities()` is implemented. Why might this still fail?

**Answer:** `getIdentities()` must return the identity of the **product being displayed**, not just the block's own identity. Common bugs:
1. Returning `['cat_p']` (generic) instead of `['cat_p_42']` (specific)
2. Loading the product model but returning identities before the product is loaded
3. The product being loaded from a collection that returns a DataObject, not a Product model, so `getIdentities()` returns empty

---

### Scenario 3: Multi-Node Cache Consistency

> **Q:** A client has 4 PHP-FPM nodes behind a load balancer. After deploying a config change, some requests show the new config and others show the old config. Caches were cleaned on one node. What is the architectural fix?

**Analysis:**
- `bin/magento cache:clean` only clears the shared Redis cache — should affect all nodes
- If using local file-based cache (not Redis), each node has its own cache — this is the bug
- If using `RemoteSynchronizedCache`, L1 on non-cleaned nodes still has old version hashes

**Answer:** Ensure all cache backends point to a **shared Redis instance**. For `RemoteSynchronizedCache`, the L1 synchronization via hash comparison handles this — but `cache:clean` on one node updates Redis L2, and other nodes' L1 will detect the hash mismatch on next request and re-fetch. The "some nodes see old data" is the L1 staleness window, which is by design — but if it persists, L1 storage may not be properly invalidated.

**Architecturally superior fix:** Use Redis for all cache storage with `RemoteSynchronizedCache`. Include `cache:clean` in the deployment pipeline, executed once against the shared Redis (not per-node).

---

### Scenario 4: Search Results Don't Include New Products

> **Q:** A product is created and enabled in admin. It appears in catalog browsing (category pages) but does NOT appear in search results. Indexers are in Update by Schedule mode. It's been 10 minutes. What do you investigate?

**Investigation order:**
1. Is the `catalogsearch_fulltext` indexer status showing "Ready" or "Reindex Required"?
2. Is cron running? (`bin/magento cron:status`)
3. Is the changelog table growing without being consumed? (mview_state `working` status stuck)
4. Did the product creation trigger the MView changelog entry for the search indexer?
5. Is the product assigned to a website/store that the search indexer is scoped to?

**Exam focus:** Category pages use `catalog_category_product_index` (can be separate from search). Search uses `catalogsearch_fulltext`. They are **independent indexers** — one being current doesn't mean the other is.

---

## Quick-Reference Checklist

### MView & Triggers
- [ ] MView = Magento-level change tracking, NOT MySQL materialized views
- [ ] Three triggers per subscribed table: after_insert, after_update, after_delete
- [ ] Changelog table naming: `{source_table}_cl`
- [ ] `view_id` in `indexer.xml` must exactly match `id` in `mview.xml`
- [ ] MView is used **only** in Update by Schedule mode
- [ ] `mview_state` table: columns `view_id`, `mode`, `status`, `version_id`, `updated`
- [ ] `mview_state` mode values: `enabled`, `disabled`
- [ ] `mview_state` status values: `idle`, `working`, `suspended` (three values)
- [ ] Direct SQL bulk inserts still fire MySQL triggers → changelog still populated

### Index Modes
- [ ] **Update on Save** = synchronous, blocks HTTP, no MView, always current
- [ ] **Update by Schedule** = async, non-blocking, uses MView, eventual consistency
- [ ] Price change in Schedule mode: NOT immediately reflected in search (1–5 min lag)
- [ ] Large catalogs → always recommend Update by Schedule
- [ ] Flash sales requiring instant updates need special handling beyond default modes
- [ ] `executeList()` is called by MView cron; `executeFull()` by CLI full reindex

### indexer.xml
- [ ] `id` = CLI identifier, must be unique
- [ ] `view_id` links to mview.xml
- [ ] `class` must implement `ActionInterface` (`executeFull()`, `executeList()`, `executeRow()`)
- [ ] `dependencies` = other indexers that must run first; can be declared across modules
- [ ] `shared_index` = shares index table with another indexer (e.g., `catalog_category_product` and `catalog_product_category` share `"category_product"`)
- [ ] `catalog_product_price` has **no `shared_index`**; its dependency is `catalogrule_rule` (from module-catalog-rule), NOT `catalog_product_attribute`

### EE Indexers
- [ ] SharedCatalog: per-company pricing, dramatically increases index table size
- [ ] CMS Staging: maintains multiple index versions for scheduled updates
- [ ] Staging-aware indexers must handle version switching atomically

### Cache Types
- [ ] `config` = merged XML config, invalidated by config saves
- [ ] `layout` = merged layout XML, invalidated by layout changes
- [ ] `block_html` = rendered block HTML, tag-based + TTL
- [ ] `collections` = ORM collection results
- [ ] `reflection` = PHP DI reflection data
- [ ] `db_ddl` = database schema metadata
- [ ] `eav` = EAV attribute metadata, invalidated by attribute changes
- [ ] `full_page` = complete rendered pages, tag-based invalidation
- [ ] `translate` = merged translation strings
- [ ] `cache:clean` = clears storage, preferred in production
- [ ] `cache:flush` = destroys entire storage pool, affects shared instances

### FPC Tag-Based Invalidation
- [ ] Blocks implement `IdentityInterface` (`Magento\Framework\DataObject\IdentityInterface`) → `getIdentities()` returns cache tags
- [ ] Tags flow to `X-Magento-Tags` HTTP response header
- [ ] Varnish/Fastly stores pages against those tags
- [ ] Product save → Magento sends BAN/invalidate for `cat_p_{id}`
- [ ] Empty `getIdentities()` → page never invalidates → stale data until TTL
- [ ] Too-broad tags (generic only) → all pages invalidate on any product change → cache thrash
- [ ] One `cacheable="false"` block → entire page uncacheable
- [ ] Core tag constants: `cat_p` (Product), `cat_c` (Category), `cms_p` (CMS Page)
- [ ] **CMS Page `getIdentities()` returns ONLY `['cms_p_{id}']`** — no generic `cms_p`
- [ ] **Category `getIdentities()` returns `['cat_c_{id}']` normally** — generic `cat_c` only added when category is deleted/deactivated/menu-changed
- [ ] **Product `getIdentities()` returns `['cat_p_{id}']` as base** — generic `cat_p` not always present

### Redis L2 (RemoteSynchronizedCache)
- [ ] Class: `Magento\Framework\Cache\Backend\RemoteSynchronizedCache`
- [ ] L1 = local process memory (fast), L2 = Redis (shared across nodes)
- [ ] Synchronization via version hash (`:hash` key suffix), not full data comparison
- [ ] L1 hash == L2 hash → serve from L1 (no Redis data read)
- [ ] L1 hash != L2 hash → fetch from L2, update L1
- [ ] Use for multi-node horizontal scaling deployments
- [ ] `/dev/shm` RAM disk recommended for L1 storage
- [ ] `cache:clean` updates L2 (Redis); L1 syncs on next hash check

### Search Architecture
- [ ] MySQL catalog search **removed** in Magento 2.4.8 (not deprecated — removed)
- [ ] OpenSearch = default in 2.4.8, Apache 2.0 license
- [ ] Elasticsearch still supported but Elastic license concerns exist
- [ ] Live Search = EE subscription required, SaaS, Adobe-hosted
- [ ] Live Search and OpenSearch/ES cannot run simultaneously
- [ ] Live Search: consider data residency/compliance implications
- [ ] `catalogsearch_fulltext` indexer is independent of category product indexer

### CLI Commands
- [ ] `indexer:status` = view all indexers, mode, and schedule status
- [ ] `indexer:reindex {id}` = reindex specific indexer
- [ ] `indexer:set-mode schedule|realtime {id}` = change index mode
- [ ] `indexer:reset {id}` = mark indexer as requiring full reindex
- [ ] `cache:status` = view all cache types and enabled/disabled state
- [ ] `cache:clean` = clean (preferred); `cache:flush` = destroy pool (caution)

### Architectural Decision Principles
- [ ] Eventual consistency (Schedule mode) is a **design decision**, not a defect
- [ ] Wrong cache tag granularity (too broad OR too narrow) both cause problems
- [ ] Switching all indexers to Save mode for one use case = over-engineered solution
- [ ] Multi-node caching requires shared Redis, not per-node file cache
- [ ] The architect must justify *why* a decision is made, not just identify *what* is correct
- [ ] Live Search removes need for OpenSearch infra management but adds data sovereignty risk
