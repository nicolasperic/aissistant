# Day 7 — Indexing System + Week 1 Review
## Magento 2 Certification Study Notes

---

## Table of Contents

1. [Overview — What Is the Indexing System?](#1-overview--what-is-the-indexing-system)
2. [Indexer Modes](#2-indexer-modes)
   - [Update on Save](#update-on-save)
   - [Update by Schedule](#update-by-schedule)
3. [mview.xml — Subscriptions and Changelog Tables](#3-mviewxml--subscriptions-and-changelog-tables)
4. [indexer.xml — Dependencies Between Indexers](#4-indexerxml--dependencies-between-indexers)
5. [Key Indexers Reference](#5-key-indexers-reference)
6. [CLI Commands](#6-cli-commands)
7. [Flat Catalog](#7-flat-catalog)
8. [Partial vs Full Reindex](#8-partial-vs-full-reindex)
9. [Practice Lab Walkthrough](#9-practice-lab-walkthrough)
10. [Week 1 Architecture Review](#10-week-1-architecture-review)
11. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Overview — What Is the Indexing System?

Magento stores data in normalized relational tables optimised for writes (EAV structure). Reading from those tables for every storefront request would be prohibitively slow. The **indexing system** denormalises and pre-computes that data into flat, query-optimised index tables that the storefront reads directly.

```
Source data (EAV / relational)         Index tables (denormalised)
+---------------------------+          +-----------------------------+
| catalog_product_entity    |          | catalog_product_index_price |
| catalog_product_entity_   |  ------> | catalog_product_flat_1      |
|   varchar / int / decimal |  index   | cataloginventory_stock_     |
| catalog_category_entity   |          |   status_idx                |
+---------------------------+          +-----------------------------+
         ^                                         |
         | writes (admin / import)                 | reads (storefront)
```

**Exam focus:**
- The index system exists because EAV reads at scale are too slow for storefront queries.
- Indexers write to dedicated `_idx` / `_flat` / `_tmp` tables, **not** the source tables.

---

## 2. Indexer Modes

Every indexer can operate in one of two modes, configurable independently.

### Update on Save

```
Admin saves product
        |
        v
Observer / plugin fires
        |
        v
Indexer::execute(ids) called synchronously
        |
        v
Index table updated immediately
```

- Index is **always current** after a save operation.
- **Blocking** — the admin save request does not return until reindexing finishes.
- Dangerous with large catalogs: saving one product can trigger a cascade that takes minutes.
- Default mode for a freshly installed Magento instance.

**Exam focus:**
- "Update on Save" calls `IndexerInterface::execute(array $ids)` — a **partial** reindex on the affected entity IDs only.
- The admin UI may appear to hang on large catalogs in this mode.

---

### Update by Schedule

```
Admin saves product
        |
        v
Observer writes entity_id to changelog table (e.g. catalog_product_cl)
        |   (non-blocking, returns immediately)
        v
Cron job (indexer_reindex_all_invalid / mview_update_cron) runs
        |
        v
Mview reads changelog -> executes partial reindex on changed IDs
        |
        v
Changelog rows cleared (version pointer advances)
```

- Save is **non-blocking** — admin response is instant.
- Index is **eventually consistent** — storefront sees stale data until cron runs.
- Uses **mview (Materialized View)** infrastructure.
- Cron group: `index`, job `indexer_update_all_views` — runs every minute by default.

**Exam focus:**
- "Update by Schedule" relies on **changelog tables** (`*_cl`) and the **mview** system.
- Stale index state is marked `invalid`; cron processes changelog and returns state to `valid`.
- The version counter in `mview_state` tracks which changelog rows have been processed.

---

### Switching Modes via CLI

```bash
# Set a single indexer to Update by Schedule
bin/magento indexer:set-mode schedule catalog_product_price

# Set ALL indexers to Update by Schedule
bin/magento indexer:set-mode schedule

# Set a single indexer back to Update on Save
bin/magento indexer:set-mode realtime catalog_product_price

# Check current mode of all indexers
bin/magento indexer:show-mode
```

### Switching Modes via Admin UI

**Stores → Settings → Configuration → Advanced → System → Index Management**
*(or directly via* **System → Index Management** *in the admin panel)*

---

## 3. mview.xml — Subscriptions and Changelog Tables

`mview.xml` is the configuration file that drives the **Update by Schedule** mechanism. It tells Magento which source database tables an indexer depends on and which columns to watch.

### File Location

```
<Module_Root>/etc/mview.xml
```

### Annotated Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Mview/etc/mview.xsd">

    <!--
        id          = indexer ID (must match indexer.xml)
        class       = the ActionInterface implementation that processes rows
        group       = cron group (default = "indexer")
        walker      = iteration strategy (default = Magento\Framework\Mview\View\ChangelogBatchWalker)
    -->
    <view id="catalog_product_price"
          class="Magento\Catalog\Model\Indexer\Product\Price\Action\Rows"
          group="indexer">

        <!-- The changelog table will be named:  catalog_product_cl -->
        <subscriptions>

            <!--
                table    = source table to watch
                column   = primary key column tracked in changelog
            -->
            <table name="catalog_product_entity" column="entity_id"/>
            <table name="catalog_product_entity_decimal" column="entity_id"/>
            <table name="catalog_product_entity_int" column="entity_id"/>
            <table name="catalogrule_product_price" column="product_id"/>
            <table name="catalogrule_group_website" column="product_id"/>

        </subscriptions>
    </view>

</config>
```

### Changelog Table Naming Convention

| mview `id` | Changelog table name |
|---|---|
| `catalog_product_price` | `catalog_product_cl` |
| `catalog_product_flat` | `catalog_product_flat_cl` |
| `catalogsearch_fulltext` | `catalogsearch_fulltext_cl` |
| `inventory` | `inventory_cl` |

**The suffix is always `_cl`** — the table name is derived from the **subscribed source table**, not the view id, for the first subscription entry, but the **changelog table itself** is named `<view_id>_cl` — wait, let's be precise:

> **Changelog table = `<view_id>_cl`** where `view_id` is the `id` attribute of the `<view>` element.

**Exam focus:**
- Changelog table name = `<mview_view_id>` + `_cl` suffix.
- The `_cl` table schema has two columns: `version_id` (auto-increment) and `entity_id`.
- Magento creates database triggers on subscribed tables to INSERT into the `_cl` table automatically.
- `mview_state` table stores the `version_id` pointer showing how far each view has been processed.

### Changelog Table Structure

```sql
-- Example: catalog_product_cl
CREATE TABLE `catalog_product_cl` (
  `version_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entity_id`  int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`version_id`)
) ENGINE=InnoDB;
```

### mview_state Table

```sql
SELECT * FROM mview_state WHERE view_id = 'catalog_product_price';
-- view_id              | mode     | status    | updated              | version_id
-- catalog_product_price| enabled  | idle      | 2024-01-15 10:00:00  | 42
```

| Column | Meaning |
|---|---|
| `view_id` | Matches `mview.xml` view `id` |
| `mode` | `enabled` (schedule) or `disabled` (realtime) |
| `status` | `idle` or `working` |
| `version_id` | Last processed changelog `version_id` |

---

## 4. indexer.xml — Dependencies Between Indexers

`indexer.xml` declares an indexer to Magento and can define **dependencies** (which indexers must run before this one).

### File Location

```
<Module_Root>/etc/indexer.xml
```

### Annotated Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Indexer/etc/indexer.xsd">

    <indexer id="catalog_product_price"
             view_id="catalog_product_price"
             class="Magento\Catalog\Model\Indexer\Product\Price"
             primary="catalog_product">

        <title translate="true">Product Price</title>
        <description translate="true">Reindex product price.</description>

        <!--
            This indexer depends on catalog_product_flat being current.
            If flat is invalid, price must also be reindexed after flat.
        -->
        <dependencies>
            <indexer id="catalog_product_attribute"/>
        </dependencies>

    </indexer>

</config>
```

### Key Attributes

| Attribute | Description |
|---|---|
| `id` | Unique indexer identifier (used in CLI commands) |
| `view_id` | Links to the `<view id>` in `mview.xml` |
| `class` | PHP class implementing `IndexerInterface` |
| `primary` | Source entity type |

**Exam focus:**
- `view_id` in `indexer.xml` must match `id` in `mview.xml` — this is the link between the two files.
- Dependencies control execution **order** during full reindex.
- An indexer with unmet dependencies will not run until its dependencies complete successfully.

### Dependency Graph (simplified)

```
catalog_product_attribute
         |
         v
catalog_product_flat  <---+
         |                |
         v                |
catalog_product_price     |
         |                |
         v                |
catalogsearch_fulltext ---+
```

---

## 5. Key Indexers Reference

### Complete Key Indexers Table

| Indexer ID | Class (simplified) | What It Builds | Key Source Tables |
|---|---|---|---|
| `catalog_product_attribute` | `Product\Eav` | EAV attribute index | `catalog_product_entity_*` |
| `catalog_product_price` | `Product\Price` | Price index per customer group / website | `catalog_product_entity_decimal` |
| `catalog_product_flat` | `Product\Flat` | Flat product table per store | `catalog_product_entity_*` |
| `catalog_category_flat` | `Category\Flat` | Flat category table | `catalog_category_entity_*` |
| `catalog_category_product` | `Category\Product` | Category-product associations | `catalog_category_product` |
| `catalogsearch_fulltext` | `Fulltext` | Elasticsearch / MySQL fulltext index | All searchable attributes |
| `catalogrule_rule` | `Rule` | Catalog price rule precomputation | `catalogrule` |
| `catalogrule_product` | `Rule\Product` | Per-product rule application | `catalogrule_product` |
| `cataloginventory_stock` | `Stock` | Stock status index | `cataloginventory_stock_item` |
| `inventory` | MSI Stock | MSI source/stock index (2.3+) | `inventory_source_item` |
| `customer_grid` | `Customer\Grid` | Customer grid flat table | `customer_entity` |
| `design_config_grid` | `Design\Config\Grid` | Design config grid | `design_config_grid_flat` |

---

### catalog_product_price

- Stores pre-calculated prices per **website** × **customer group** combination.
- Handles: tier prices, special prices, catalog rules, group prices.
- Output table: `catalog_product_index_price`

```sql
SELECT * FROM catalog_product_index_price
WHERE entity_id = 123 AND website_id = 1 AND customer_group_id = 0;
```

**Exam focus:**
- Price indexer output is `catalog_product_index_price`, not `catalog_product_entity_decimal`.
- Must reindex after changing catalog price rules.

---

### catalog_product_flat

- Collapses EAV rows into a **single wide table** per store view.
- Output tables: `catalog_product_flat_1`, `catalog_product_flat_2`, … (one per store view).
- Must be explicitly **enabled** in config (disabled by default in modern Magento).
- See [Section 7](#7-flat-catalog) for detailed tradeoffs.

---

### catalogsearch_fulltext

- Builds the search index used by the storefront search.
- With **Elasticsearch** (recommended): pushes documents to Elasticsearch index.
- With **MySQL** (legacy): populates `catalogsearch_fulltext` table.
- Triggered on: product saves, attribute searchability changes, stop-word config changes.

**Exam focus:**
- Full reindex of `catalogsearch_fulltext` with Elasticsearch drops and recreates the ES index alias.
- Partial reindex updates individual documents.

---

### inventory (MSI)

- Introduced in Magento 2.3 with **Multi-Source Inventory**.
- Indexer IDs: `inventory` (stock status), `catalog_inventory_stock` (legacy compatibility).
- Output: `inventory_stock_<stock_id>` tables.
- Replaces the older `cataloginventory_stock` for MSI-enabled stores.

---

## 6. CLI Commands

### Core Indexer Commands

```bash
# Show status of all indexers
bin/magento indexer:status

# Reindex all indexers
bin/magento indexer:reindex

# Reindex specific indexers
bin/magento indexer:reindex catalog_product_price catalogsearch_fulltext

# Reset indexer(s) to "invalid" state (forces full reindex on next run)
bin/magento indexer:reset
bin/magento indexer:reset catalog_product_price

# Show current mode (realtime / schedule)
bin/magento indexer:show-mode

# Set mode
bin/magento indexer:set-mode schedule catalog_product_price
bin/magento indexer:set-mode realtime catalog_product_price

# Show indexer info / configuration
bin/magento indexer:info
```

### Indexer Status Values

| Status | Meaning |
|---|---|
| `valid` | Index is current, no reindex needed |
| `invalid` | Source data has changed, full reindex required |
| `working` | Reindex is currently in progress |
| `suspended` | Indexer has been paused (rare) |

**Exam focus:**
- `indexer:reset` sets status to `invalid` without actually running the reindex — useful for forcing a fresh full reindex.
- `indexer:reindex` on an already-`valid` indexer **will still reindex** (it does not skip).
- Status `working` on a crashed process means the index is stuck — use `indexer:reset` to recover.

### Sample Output — indexer:status

```
+----------------------+------------------+-----------+---------------------+---------------------+
| Title                | Status           | Update On | Schedule Status     | Schedule Updated    |
+----------------------+------------------+-----------+---------------------+---------------------+
| Product Price        | valid            | Schedule  | idle (0 in backlog) | 2024-01-15 10:00:00 |
| Catalog Search       | invalid          | Save      | No                  |                     |
| Product Flat Data    | valid            | Schedule  | idle (3 in backlog) | 2024-01-15 09:58:00 |
+----------------------+------------------+-----------+---------------------+---------------------+
```

---

## 7. Flat Catalog

### What Is It?

Flat catalog takes EAV product/category data (hundreds of rows per entity across many tables) and collapses it into **one row per entity** in a flat table. This can dramatically speed up collection loads.

### Enabling Flat Catalog

```
Stores → Configuration → Catalog → Catalog → Storefront
  ├── Use Flat Catalog Category: Yes
  └── Use Flat Catalog Product:  Yes
```

After enabling, you **must** run:

```bash
bin/magento indexer:reindex catalog_product_flat catalog_category_flat
```

### When to Enable

| Scenario | Recommendation |
|---|---|
| Large catalog (>50k products), MySQL-only search | Consider enabling flat product |
| Elasticsearch in use for search | Less benefit — ES handles heavy lifting |
| Magento 2.4+ with Elasticsearch 7/OpenSearch | Generally **not recommended** |
| Performance profiling shows EAV joins as bottleneck | Test flat, measure, decide |
| Category navigation / layered nav slow | Flat category can help |

### Performance Tradeoffs

| Aspect | Flat Enabled | Flat Disabled |
|---|---|---|
| Read performance (storefront) | Faster (single table join) | Slower (many EAV joins) |
| Reindex time | **Longer** (rebuilds entire flat table) | Shorter |
| Disk usage | **Higher** (duplicated data) | Lower |
| Memory during reindex | **Higher** | Lower |
| Add new attribute | Must reindex flat | No flat reindex needed |
| MySQL replication lag | Potentially higher | Lower |
| Compatibility with custom code | Some extensions assume flat; some break | Generally safer |

**Exam focus:**
- Flat catalog is **disabled by default** in Magento 2.
- Enabling flat catalog requires a full reindex of the flat indexers.
- Flat product creates one table **per store view**: `catalog_product_flat_1`, `catalog_product_flat_2`, etc.
- Flat catalog is **not recommended** for Magento 2.4+ with Elasticsearch — the search engine negates the need for flat for search purposes.

### Flat Table Structure (example)

```sql
-- catalog_product_flat_1 (store_view_id = 1)
SELECT entity_id, sku, name, price, status, visibility
FROM catalog_product_flat_1
WHERE visibility IN (2, 4) AND status = 1;
-- vs. EAV equivalent which JOINs 5+ tables
```

---

## 8. Partial vs Full Reindex

Understanding **which action triggers which type of reindex** is critical for both the exam and real-world debugging.

### Full Reindex

Rebuilds the **entire** index from scratch for all entities.

**Triggers:**
- Running `bin/magento indexer:reindex` from CLI.
- Indexer status is `invalid` and cron processes it.
- After `bin/magento indexer:reset` (marks invalid, then reindex is manual or via cron).
- After switching indexer mode from Schedule → Realtime.
- After enabling/disabling flat catalog.
- Import of large product sets via `bin/magento import:run`.
- Magento upgrade / `setup:upgrade`.

**Process:**

```
1. Write new data to temporary index table (e.g., _tmp suffix)
2. Swap temporary table with production index table (atomic rename)
3. Mark indexer status = valid
```

**Exam focus:**
- Full reindex uses a **temporary table** with `_tmp` suffix, then atomically swaps it. This prevents storefront from reading incomplete index data.
- `indexer:reset` does NOT reindex — it only sets status to `invalid`.

---

### Partial Reindex

Rebuilds the index **only for specific entity IDs** that have changed.

**Triggers:**
- **Update on Save mode**: product/category save observer fires `execute(array $ids)`.
- **Update by Schedule mode**: cron reads changelog table, passes changed IDs to `executeList(array $ids)`.
- Programmatic calls to `$indexer->execute($ids)`.

**Process (Update by Schedule):**

```
1. Cron fires indexer_update_all_views job
2. For each mview view in "enabled" mode:
   a. Read rows from changelog (_cl) where version_id > last_processed_version
   b. Collect entity_ids from those rows
   c. Call indexer->executeList(entity_ids)
   d. Advance version pointer in mview_state
3. Mark indexer status = valid
```

**Exam focus:**
- Partial reindex calls `IndexerInterface::executeList(array $ids)` (schedule) or `execute(array $ids)` (save).
- Full reindex calls `IndexerInterface::executeFull()`.
- The `executeRow($id)` method handles a single entity.

### Comparison Table

| Attribute | Partial Reindex | Full Reindex |
|---|---|---|
| Scope | Changed entities only | All entities |
| Speed | Fast | Slow (proportional to catalog size) |
| Trigger | Save event / cron (changelog) | CLI / invalid status / setup |
| Method called | `execute()` / `executeList()` | `executeFull()` |
| Temp table used? | No | Yes (`_tmp` tables) |
| Storefront impact | None (in-place update) | None (atomic table swap) |
| Risk of stale data | Low (near real-time) | None (complete when done) |

---

## 9. Practice Lab Walkthrough

### Step 1 — Check Current State

```bash
bin/magento indexer:status
bin/magento indexer:show-mode
```

### Step 2 — Switch catalog_product_price to Update by Schedule

```bash
bin/magento indexer:set-mode schedule catalog_product_price
bin/magento indexer:show-mode catalog_product_price
# Expected output: catalog_product_price is in "Update by Schedule" mode
```

### Step 3 — Check the Changelog Table (before change)

```sql
-- In MySQL:
SELECT COUNT(*) FROM catalog_product_cl;
-- Note the current max version_id:
SELECT MAX(version_id) FROM catalog_product_cl;
```

### Step 4 — Modify a Product (via Admin or CLI)

```bash
# Via Admin: Catalog → Products → Edit any product → change price → Save
# Or via script:
php -r "
require 'app/bootstrap.php';
\$bootstrap = \Magento\Framework\App\Bootstrap::create(BP, \$_SERVER);
\$app = \$bootstrap->createApplication(\Magento\Framework\App\Http::class);
// Use ObjectManager for quick lab testing only - not production pattern
"
```

### Step 5 — Check Changelog Table (after change)

```sql
SELECT * FROM catalog_product_cl ORDER BY version_id DESC LIMIT 10;
-- You should see new rows with the entity_id of the product you changed

SELECT * FROM mview_state WHERE view_id = 'catalog_product_price';
-- status should be 'idle', version_id still at old value (cron hasn't run yet)
```

```
Expected catalog_product_cl contents:
+------------+-----------+
| version_id | entity_id |
+------------+-----------+
| 43         | 2048      |  <-- your changed product
| 42         | 1001      |  <-- previous change (already processed)
+------------+-----------+
```

### Step 6 — Check Indexer Status

```bash
bin/magento indexer:status catalog_product_price
# Status: invalid  (or "valid" with N in backlog if using schedule)
```

### Step 7 — Manual Reindex and Time It

```bash
# Full reindex (time it)
time bin/magento indexer:reindex catalog_product_price
# Note: even in schedule mode, CLI reindex does a FULL reindex

# Alternatively, trigger the mview update (processes changelog only):
bin/magento cron:run --group=index
```

### Step 8 — Compare Timing

| Scenario | Expected time (medium catalog, ~10k products) |
|---|---|
| `indexer:reindex` (full) | 30 seconds – 5 minutes |
| Cron partial (1 product changed) | < 2 seconds |
| Update on Save (1 product) | 2–15 seconds (blocks admin) |

### Step 9 — Verify Changelog Was Consumed

```sql
SELECT * FROM mview_state WHERE view_id = 'catalog_product_price';
-- version_id should now equal the max version_id from catalog_product_cl
-- status should be 'idle'

SELECT COUNT(*) FROM catalog_product_cl WHERE version_id > <last_processed_version>;
-- Should be 0 (all changes processed)
```

---

## 10. Week 1 Architecture Review

Use this section to cross-reference all Week 1 topics and flag gaps.

### Day 1 — Magento Architecture Overview

- [ ] Request lifecycle (front controller → router → controller → view)
- [ ] Area codes: `frontend`, `adminhtml`, `crontab`, `webapi_rest`, `webapi_soap`, `graphql`
- [ ] `pub/index.php` → `Bootstrap` → `App\Http` → `FrontController`
- [ ] Module file structure: `registration.php`, `etc/module.xml`, `composer.json`
- [ ] Module load order: `sequence` in `module.xml`

### Day 2 — Dependency Injection and Object Manager

- [ ] DI principles: constructor injection, preference, virtual type, plugin
- [ ] `di.xml`: `<preference>`, `<type>`, `<virtualType>`, `<plugin>`
- [ ] Plugin types: `before`, `around`, `after` — method signature rules
- [ ] Plugin sortOrder and disabled flag
- [ ] ObjectManager: why you should NOT use it directly (except factories/proxies)
- [ ] Factories: `ModelFactory` pattern, auto-generated in `generated/`
- [ ] Proxies: lazy loading, when to use
- [ ] Interceptors: generated proxy classes that enable plugins

### Day 3 — Configuration System

- [ ] Config XML files: `config.xml`, `di.xml`, `routes.xml`, `events.xml`, `crontab.xml`
- [ ] Config scopes: `global`, `website`, `store`
- [ ] `env.php` vs `config.php`: deployment config vs app config
- [ ] Config loading sequence and merge order
- [ ] System configuration: `system.xml`, `config.xml` defaults, Admin path

### Day 4 — Routing

- [ ] Router types: `standard`, `admin`, `cms`, `urlrewrite`
- [ ] `routes.xml` — frontName, router id
- [ ] Controller resolution: `<Vendor>/<Module>/Controller/<Area>/<Action>.php`
- [ ] `ActionInterface::execute()` return types: `ResultInterface` subtypes
- [ ] URL rewrites: `url_rewrite` table, rewrite types
- [ ] Admin routes: `adminhtml` area, `admin` router

### Day 5 — Events and Observers

- [ ] `events.xml` — event name, observer name, class, method
- [ ] Event dispatch: `$this->_eventManager->dispatch('event_name', ['key' => $value])`
- [ ] Observer class: implements `ObserverInterface`, `execute(Observer $observer)`
- [ ] Getting data from event: `$observer->getData('key')` or `$observer->getEvent()->getKey()`
- [ ] Plugin vs Observer: plugins intercept public methods; observers react to dispatched events
- [ ] Key events: `catalog_product_save_after`, `checkout_submit_all_after`, `controller_action_predispatch`

### Day 6 — Cron System

- [ ] `crontab.xml` — job name, instance, method, schedule expression
- [ ] Cron groups: `default`, `index`, `catalog_event`
- [ ] Cron DB tables: `cron_schedule` (queue/status), state machine: `pending → running → success/error/missed`
- [ ] `bin/magento cron:run` — runs all groups; `--group=<name>` for specific
- [ ] `bin/magento cron:install` — writes to system crontab
- [ ] Cron expression syntax: `* * * * *` (min hour day month weekday)
- [ ] `always_run` parameter (runs on every cron:run invocation)

### Day 7 — Indexing System (Today)

- [ ] Two modes: Update on Save (realtime) vs Update by Schedule (schedule/mview)
- [ ] `mview.xml`: view id, subscriptions, `_cl` table naming
- [ ] `indexer.xml`: indexer id, view_id link, class, dependencies
- [ ] Key indexers: price, flat, fulltext, inventory
- [ ] CLI: `indexer:status`, `indexer:reindex`, `indexer:reset`, `indexer:set-mode`, `indexer:show-mode`
- [ ] Flat catalog: per-store-view tables, enable/disable tradeoffs
- [ ] Partial reindex: `execute()` / `executeList()` — changed IDs only
- [ ] Full reindex: `executeFull()` — temp table + atomic swap

### Architecture Concepts Spanning All Days

```
Request
  |
  +-> Bootstrap (env.php, DI compile)
  |
  +-> FrontController
  |       |
  |       +-> Router (routes.xml)
  |       |
  |       +-> Controller (DI injected, plugins apply)
  |               |
  |               +-> Model / ResourceModel (events fired)
  |               |       |
  |               |       +-> Indexer (if Update on Save)
  |               |       |       |
  |               |       |       +-> mview changelog (if Update by Schedule)
  |               |
  |               +-> Result (Page / Json / Redirect)
  |
  +-> Cron (parallel process)
          |
          +-> indexer_update_all_views (reads changelog, partial reindex)
          +-> Your custom cron jobs
```

### Gap Identification Checklist

Use these questions to find weak areas:

- Can you explain the full request lifecycle from `pub/index.php` to response? *(Day 1)*
- Can you write a `di.xml` plugin with correct `before`/`around`/`after` signatures? *(Day 2)*
- What is the difference between `env.php` and `config.php`? *(Day 3)*
- How does Magento resolve a URL to a controller action? *(Day 4)*
- How do you get the event parameter inside an observer? *(Day 5)*
- What happens to a cron job that misses its schedule window? *(Day 6)*
- What is the exact name of the changelog table for `catalogsearch_fulltext`? *(Day 7)*

---

## Quick-Reference Checklist

### Indexer Modes
- [ ] **Update on Save** = synchronous, blocking, calls `execute(array $ids)` — partial reindex on save
- [ ] **Update by Schedule** = asynchronous, non-blocking, uses mview/changelog, cron processes changes
- [ ] Mode switched via `bin/magento indexer:set-mode schedule|realtime <indexer_id>`
- [ ] Mode can also be set in Admin: **System → Index Management**

### mview.xml
- [ ] Located at `<Module>/etc/mview.xml`
- [ ] `<view id="...">` — must match `view_id` in `indexer.xml`
- [ ] `<subscriptions>` lists source tables and column (primary key) to track
- [ ] Changelog table name = `<view_id>_cl` (e.g., `catalog_product_price` → `catalog_product_cl`)
- [ ] `_cl` table has two columns: `version_id` (auto-increment PK) and `entity_id`
- [ ] Database triggers on subscribed tables INSERT rows into `_cl` table on data changes
- [ ] `mview_state` table tracks `version_id` pointer per view

### indexer.xml
- [ ] Located at `<Module>/etc/indexer.xml`
- [ ] `<indexer id="..." view_id="..." class="...">` — `view_id` links to `mview.xml`
- [ ] `<dependencies>` block defines which indexers must run first
- [ ] `id` attribute value = what you use in CLI commands

### Key Indexers
- [ ] `catalog_product_price` → output: `catalog_product_index_price`
- [ ] `catalog_product_flat` → output: `catalog_product_flat_<store_id>` (one per store view)
- [ ] `catalog_category_flat` → output: `catalog_category_flat_store_<store_id>`
- [ ] `catalogsearch_fulltext` → output: Elasticsearch index (or `catalogsearch_fulltext` for MySQL)
- [ ] `inventory` (MSI) → output: `inventory_stock_<stock_id>`
- [ ] `cataloginventory_stock` → output: `cataloginventory_stock_status_idx`

### CLI Commands
- [ ] `indexer:status` — show all indexers' status and mode
- [ ] `indexer:reindex [indexer_id...]` — run full reindex
- [ ] `indexer:reset [indexer_id...]` — set status to `invalid` (does NOT reindex)
- [ ] `indexer:set-mode schedule|realtime [indexer_id...]` — change mode
- [ ] `indexer:show-mode [indexer_id...]` — display current mode
- [ ] `indexer:info` — list all indexers with descriptions
- [ ] `cron:run --group=index` — manually trigger index cron group (processes changelog)

### Indexer Status Values
- [ ] `valid` — index is current
- [ ] `invalid` — needs full reindex
- [ ] `working` — reindex in progress (stuck = use `indexer:reset`)

### Flat Catalog
- [ ] **Disabled by default** in Magento 2
- [ ] Creates one flat table **per store view**
- [ ] Enable via: Stores → Config → Catalog → Storefront → Use Flat Catalog Product/Category
- [ ] After enabling: must run `indexer:reindex catalog_product_flat catalog_category_flat`
- [ ] **Not recommended** for Magento 2.4+ with Elasticsearch
- [ ] Tradeoff: faster reads vs longer reindex time + higher disk usage

### Partial vs Full Reindex
- [ ] **Partial**: `execute(array $ids)` or `executeList(array $ids)` — specific entities only
- [ ] **Full**: `executeFull()` — all entities, uses `_tmp` tables with atomic swap
- [ ] Partial triggered by: save events (realtime mode) or cron reading changelog (schedule mode)
- [ ] Full triggered by: CLI `indexer:reindex`, `invalid` status + cron, setup operations
- [ ] Full reindex uses `_tmp` suffix tables then atomically renames — storefront unaffected during reindex

### mview / Changelog Flow
- [ ] Save → DB trigger fires → INSERT into `<view_id>_cl` → save returns immediately
- [ ] Cron job `indexer_update_all_views` runs (every minute, `index` cron group)
- [ ] Cron reads `_cl` rows where `version_id` > `mview_state.version_id`
- [ ] Passes collected `entity_id` values to `executeList()`
- [ ] Advances `mview_state.version_id` to latest processed `version_id`

### Week 1 Architecture — Key Cross-Topic Facts
- [ ] Area codes: `frontend`, `adminhtml`, `crontab`, `webapi_rest`, `webapi_soap`, `graphql`
- [ ] Plugin types: `before` (modify args), `around` (control execution), `after` (modify result)
- [ ] `di.xml`: `<preference>` replaces class; `<plugin>` intercepts methods; `<virtualType>` creates named config
- [ ] Routes: `routes.xml` → `frontName` maps URL segment → module → controller → action
- [ ] Events: `events.xml` → observer class implements `ObserverInterface::execute(Observer $observer)`
- [ ] Cron: `crontab.xml` → `cron_schedule` table → states: `pending → running → success/error/missed`
- [ ] Config scopes: `global` > `website` > `store` (narrower scope wins)
- [ ] `env.php` = deployment config (DB, cache, modes) — never in VCS; `config.php` = enabled modules + system config exports — committed to VCS
