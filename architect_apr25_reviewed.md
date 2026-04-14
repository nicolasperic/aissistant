# Performance Optimization & MSI Architecture
### Magento 2 Architect Exam — Week 3, Section 2 Review + Section 3 Configure & Deploy

---

## Table of Contents

1. [Mental Model: Performance as a Stack](#1-mental-model-performance-as-a-stack)
2. [Full-Page Cache — The #1 Performance Lever](#2-full-page-cache--the-1-performance-lever)
3. [Profiling Tools](#3-profiling-tools)
4. [PHP Runtime Optimization](#4-php-runtime-optimization)
5. [Database Optimization](#5-database-optimization)
6. [MSI Architecture Deep Dive](#6-msi-architecture-deep-dive)
7. [MSI Source Selection Algorithms](#7-msi-source-selection-algorithms)
8. [Legacy Compatibility Layer](#8-legacy-compatibility-layer)
9. [Architect-Level Decision Frameworks](#9-architect-level-decision-frameworks)
10. [Hands-On Lab: Inspect the Reservation Log](#10-hands-on-lab-inspect-the-reservation-log)
11. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Mental Model: Performance as a Stack

Before tuning anything, understand where requests actually spend time. The exam tests *why* you choose a tuning strategy, not just *what* to tune.

```
+--------------------------------------------------+
|              BROWSER / CLIENT                    |
+--------------------------------------------------+
              |              ^
              v              |
+--------------------------------------------------+
|         CDN / Varnish (FPC)                      |  <-- BIGGEST WIN
|   Cache HIT => PHP never runs                    |
+--------------------------------------------------+
              |  (cache MISS only)
              v
+--------------------------------------------------+
|         PHP-FPM (OPcache, pool sizing)           |  <-- 2nd lever
+--------------------------------------------------+
              |
              v
+--------------------------------------------------+
|         MySQL / MariaDB (indexes, N+1, EXPLAIN)  |  <-- 3rd lever
+--------------------------------------------------+
              |
              v
+--------------------------------------------------+
|         Redis (session, cache backend)           |
+--------------------------------------------------+
              |
              v
+--------------------------------------------------+
|         External APIs / MSI reservation calc     |
+--------------------------------------------------+
```

**Exam focus:**
- **If FPC hit rate is low, NO amount of PHP or MySQL tuning will compensate.** FPC eliminates the entire PHP/DB stack for cached pages.
- Always diagnose *why* FPC is missing before reaching for other tools.
- Architect exam scenario: "Site is slow, OPcache is configured, DB indexes are in place." → First question is: *What is the FPC hit ratio?*

---

## 2. Full-Page Cache — The #1 Performance Lever

### 2.1 How FPC Works in Magento 2

```
Request arrives
      |
      v
  Varnish / Built-in FPC checks cache tag match
      |
  HIT?----YES----> Return cached response (PHP = 0ms)
      |
     NO
      |
      v
  PHP executes, generates response
      |
      v
  Response tagged with X-Magento-Tags header
      |
      v
  Stored in FPC for next request
```

### 2.2 Cache Tags and Invalidation

Every cacheable page is tagged with identifiers tied to the entities it renders:

| Tag Pattern | Example | Invalidated When |
|---|---|---|
| `cat_p_{id}` | `cat_p_42` | Product 42 is saved |
| `cat_c_{id}` | `cat_c_7` | Category 7 is saved |
| `cms_p_{id}` | `cms_p_1` | CMS page 1 is saved |
| `store_{id}` | `store_1` | Store config changes |

### 2.3 Why FPC Hit Rate Drops — Diagnose First

**Common FPC miss causes (exam scenarios):**

| Cause | Diagnosis | Fix |
|---|---|---|
| Uncacheable block on page | `MAGE_MODE=developer` shows `[cacheable=false]` | Make block cacheable or use ESI/hole-punching |
| Session-dependent content rendered in block | Block varies on customer session | Move to customer-section JS (private content) |
| Too many `Vary:` header combinations | Too many cookie/user-agent combos | Normalize vary keys in Varnish VCL |
| Cache TTL too short | Short `ttl` in `system.xml` | Increase TTL or use tag-based invalidation |
| Warmer not running | Cache stays cold after deploy | Run `magento cache:warm` or external crawler |

**Exam focus:**
- A block marked `cacheable="false"` in layout XML makes the **entire page** uncacheable — not just the block.
- Private content (cart count, wishlist) should live in `customer-data` JS sections, not PHP blocks, to preserve FPC cacheability.

### 2.4 Identifying Uncacheable Blocks

```bash
# Enable developer mode to see cache debug headers
bin/magento deploy:mode:set developer

# Watch response headers for:
# X-Magento-Cache-Debug: MISS
# X-Magento-Cache-Control: no-cache
```

In layout XML — the instant FPC killer:

```xml
<!-- BAD: Makes entire page uncacheable -->
<block class="Vendor\Module\Block\CustomerWidget"
       name="my.widget"
       cacheable="false" />

<!-- GOOD: Use private content via JS sections API instead -->
```

---

## 3. Profiling Tools

### 3.1 Tool Comparison Matrix

| Tool | Environment | What It Measures | Exam Key Point |
|---|---|---|---|
| `MAGE_PROFILER` | Dev/Staging | Block render time, event dispatch, DB queries per request | Built-in, zero cost, no agent |
| Blackfire | Any (agent required) | Call graph, function-level timing, memory, SQL | Best for code-level bottlenecks |
| New Relic APM | Cloud Pro (managed) | Transaction traces, Apdex, throughput, error rate | Available on **Cloud Pro only** |
| Xdebug | Dev ONLY | Step debugging + profiling | **MUST be disabled in production** |

**Exam focus:**
- **New Relic APM is a Cloud Pro feature** — not available on Starter or self-hosted without manual installation.
- **Xdebug in production is exam-critical**: it adds 2-10x overhead to every PHP request. The exam will ask this directly.
- `MAGE_PROFILER` is the zero-dependency option — available in any environment.

### 3.2 MAGE_PROFILER

#### Via Environment Variable

```bash
# In .env or server config
MAGE_PROFILER=html

# Options:
# html    - renders profiling table in page HTML
# csvfile - writes to var/log/profiler.csv
# 1       - same as html (legacy)
```

#### Via app/etc/env.php (Cloud: magento.env.yaml)

```php
<?php
// app/etc/env.php
return [
    'MAGE_PROFILER' => 'html',
    // ...
];
```

```yaml
# .magento.env.yaml (Cloud)
stage:
  global:
    MAGE_PROFILER: html
```

**What MAGE_PROFILER shows:**

```
Code Profiler Output (sample):
+------------------------------------------+-------+--------+-------+
| Code Profiler                            | Time  | Cnt    | Avg   |
+------------------------------------------+-------+--------+-------+
| magento\framework\view\layout::generate  | 0.342 | 1      | 0.342 |
| catalog_product_view::renderBlock        | 0.287 | 47     | 0.006 |
| db_query::SELECT FROM catalog_product... | 0.156 | 234    | 0.001 |  <-- N+1 alert!
+------------------------------------------+-------+--------+-------+
```

**Exam focus:**
- A high `Cnt` (count) on DB queries with low `Avg` but high total time = classic N+1 problem.
- Use `MAGE_PROFILER` first to identify WHERE before using Blackfire for WHY.

### 3.3 Blackfire

Blackfire instruments PHP at the function level without code changes:

```bash
# Install Blackfire agent + CLI
# Run a profile
blackfire curl https://your-store.example.com/catalog/category/view/id/5

# Or profile a specific script
blackfire run php bin/magento catalog:reindex
```

**What to look for in Blackfire call graphs:**
- Wall time vs. I/O time separation
- Functions with high "exclusive time" = bottleneck candidates
- SQL query count (anything > ~50 for a page load needs investigation)

### 3.4 New Relic APM (Cloud Pro)

**Exam focus:**
- New Relic is **pre-configured on Magento Commerce Cloud Pro** — environment variables are injected automatically.
- On Cloud **Starter**, New Relic is not available in the same way.
- New Relic measures *transactions* (full request lifecycle), not function-level call graphs — complementary to Blackfire.

```bash
# Cloud Pro: New Relic is enabled via environment variables
# No manual php.ini changes needed — managed by platform
# Check active integration:
echo $NEW_RELIC_LICENSE_KEY  # Set by platform on Pro
```

**New Relic key metrics for exam scenarios:**

| Metric | What It Tells You |
|---|---|
| Apdex score | User-perceived performance (0-1, target >0.85) |
| Throughput (rpm) | Requests per minute — capacity planning |
| Error rate | Application errors affecting real users |
| Transaction traces | Slow transaction drill-down (similar to Blackfire) |
| DB query time % | If DB > 50% of transaction time → query optimization needed |

---

## 4. PHP Runtime Optimization

### 4.1 OPcache Configuration

OPcache compiles PHP files to bytecode once and caches them in shared memory. **Without OPcache, every request re-parses every PHP file.**

```ini
; php.ini / conf.d/opcache.ini
; ============================================
; PRODUCTION-RECOMMENDED SETTINGS
; ============================================

opcache.enable=1
opcache.enable_cli=1

; Memory for storing compiled bytecode (256MB minimum for Magento)
opcache.memory_consumption=512

; Number of cached files (Magento has thousands of PHP files)
opcache.max_accelerated_files=60000

; How often to check file timestamps (0 = never in production!)
opcache.revalidate_freq=0

; CRITICAL: disable file timestamp checking entirely in production
opcache.validate_timestamps=0

; Interned strings buffer (saves memory for repeated string literals)
opcache.interned_strings_buffer=16

; Enable fast shutdown sequence
opcache.fast_shutdown=1

; String buffer for PHP 8+
; opcache.jit_buffer_size=100M   ; PHP 8 JIT (optional, test first)
```

**Exam focus:**
- `opcache.validate_timestamps=0` is **required for production** — Magento recommends this. With it set to `1`, PHP checks file mtimes on every request, partially defeating OPcache.
- After a deploy, you MUST restart PHP-FPM or call `opcache_reset()` because `validate_timestamps=0` means changed files are NOT detected automatically.
- `opcache.max_accelerated_files` must be larger than the number of PHP files in your Magento installation (use `find . -name "*.php" | wc -l` to count).

```bash
# Count PHP files to size opcache.max_accelerated_files
find /var/www/html -name "*.php" | wc -l
# Typical Magento 2 install: 30,000 - 60,000+ files

# Check OPcache status
php -r "print_r(opcache_get_status());"

# After deploy with validate_timestamps=0, reset cache:
php -r "opcache_reset();"
# OR restart PHP-FPM:
sudo systemctl restart php8.1-fpm
```

### 4.2 PHP-FPM Pool Sizing

PHP-FPM manages a pool of worker processes. Wrong sizing = either resource exhaustion or underutilization.

```ini
; /etc/php/8.1/fpm/pool.d/www.conf
; ============================================
; POOL SIZING FOR MAGENTO
; ============================================

[www]
user = www-data
group = www-data

; pm = static | dynamic | ondemand
; PRODUCTION: use 'static' or 'dynamic'
pm = dynamic

; Maximum total children (workers)
; Formula: (Total RAM - OS/other RAM) / Average PHP process RAM
; Example: (8GB - 2GB) / 100MB per process = ~60
pm.max_children = 50

; Start with this many workers
pm.start_servers = 10

; Minimum idle workers (kept ready)
pm.min_spare_servers = 5

; Maximum idle workers (excess are killed)
pm.max_spare_servers = 20

; Requests per worker before recycling (prevents memory leaks)
pm.max_requests = 500

; Request timeout
request_terminate_timeout = 300

; Slow log threshold
request_slowlog_timeout = 10s
slowlog = /var/log/php-fpm/www-slow.log
```

**Sizing Formula:**

```
Available RAM for PHP = Total RAM - (OS + Redis + MySQL + Varnish)
Avg PHP process RAM   = ~80-150MB for Magento (use `ps aux` to measure)
Max children          = Available RAM / Avg process RAM

Example:
  16GB server
  - OS:     1GB
  - MySQL:  4GB
  - Redis:  1GB
  - Varnish: 1GB
  Available for PHP: 9GB
  Avg process:       120MB
  Max children:      9000MB / 120MB = 75
```

**Exam focus:**
- `pm = dynamic` is appropriate for variable traffic — spawns workers as needed up to `max_children`.
- `pm = static` (all `max_children` always running) is better for high-traffic consistent loads — no spawn overhead.
- Too few workers → request queuing → slow responses. Too many → RAM exhaustion → swap → catastrophic slowdown.

### 4.3 Xdebug — MUST Be Disabled in Production

**This is a direct exam question.**

```bash
# Check if Xdebug is loaded
php -m | grep xdebug

# Disable in php.ini
# Comment out or remove:
; extension=xdebug.so

# Verify disabled
php -m | grep -i xdebug  # should return nothing
```

**Why Xdebug destroys production performance:**

| Overhead Type | Impact |
|---|---|
| Function call tracing | Every function call recorded (millions per request) |
| Stack trace generation | Significant memory per trace frame |
| Remote debugging listener | Socket overhead even when no debugger connected |
| OPcache interaction | Some Xdebug versions reduce OPcache effectiveness |

> **Exam scenario:** "A production site suddenly became 3-5x slower after a developer pushed a `php.ini` change. What is the most likely cause?"
> **Answer:** Xdebug was accidentally enabled in production.

---

## 5. Database Optimization

### 5.1 EXPLAIN for Slow Queries

`EXPLAIN` shows MySQL's query execution plan — the foundation of query optimization.

```sql
-- Basic EXPLAIN
EXPLAIN SELECT * FROM catalog_product_entity
WHERE sku = 'WS12-XS-Orange';

-- EXPLAIN FORMAT=JSON for detailed analysis (MySQL 5.6+)
EXPLAIN FORMAT=JSON
SELECT cpe.entity_id, cpev.value as name
FROM catalog_product_entity cpe
JOIN catalog_product_entity_varchar cpev
  ON cpe.entity_id = cpev.entity_id
  AND cpev.attribute_id = 73
  AND cpev.store_id = 0
WHERE cpe.type_id = 'simple'
  AND cpe.status = 1;
```

**Key EXPLAIN output columns:**

| Column | What to Look For | Red Flag |
|---|---|---|
| `type` | Access method | `ALL` = full table scan |
| `key` | Index being used | `NULL` = no index used |
| `rows` | Estimated rows examined | >10,000 for simple lookup |
| `Extra` | Additional info | `Using filesort`, `Using temporary` |

**Access type hierarchy (best to worst):**
```
system > const > eq_ref > ref > range > index > ALL
```

**Exam focus:**
- `type: ALL` with `rows` in millions = missing index or uncacheable query.
- `Using filesort` means MySQL must sort in memory/disk — add an index covering the `ORDER BY` columns.
- `Using temporary` means MySQL creates a temp table — often from complex GROUP BY/DISTINCT without covering index.

### 5.2 N+1 Query Problem in Collections

The N+1 problem: 1 query to get a list, then N queries to get data for each item = N+1 total queries.

```php
<?php
// BAD - N+1 Pattern
// 1 query to get products
$products = $this->productCollectionFactory->create()
    ->addAttributeToSelect('entity_id')
    ->setPageSize(20)
    ->load();

foreach ($products as $product) {
    // N separate queries - one per product!
    $name = $product->getName();   // triggers EAV attribute load
    $price = $product->getPrice(); // another load if not selected
}
```

```php
<?php
// GOOD - Select all needed attributes upfront
$products = $this->productCollectionFactory->create()
    ->addAttributeToSelect(['name', 'price', 'sku', 'status'])
    // OR select everything (use carefully):
    ->addAttributeToSelect('*')
    ->addAttributeToFilter('status', ['eq' => Status::STATUS_ENABLED])
    ->setPageSize(20);

// Join related data instead of lazy loading
$products->joinField(
    'category_id',
    'catalog_category_product',
    'category_id',
    'product_id=entity_id',
    null,
    'left'
);
```

**Key Collection Methods for N+1 Prevention:**

```php
<?php
// addAttributeToSelect: specify EAV attributes to JOIN/load eagerly
$collection->addAttributeToSelect(['name', 'price', 'image']);

// addAttributeToFilter: filter by EAV attribute (generates proper JOIN)
$collection->addAttributeToFilter('visibility', [
    'in' => [
        Visibility::VISIBILITY_IN_CATALOG,
        Visibility::VISIBILITY_BOTH
    ]
]);

// joinField: join a flat table field to collection
$collection->joinField(
    'qty',                           // local alias
    'cataloginventory_stock_item',   // table to join
    'qty',                           // field from joined table
    'product_id=entity_id',          // join condition
    '{{table}}.stock_id=1',          // additional condition
    'left'                           // join type
);

// joinAttribute: join another EAV attribute
$collection->joinAttribute(
    'category_name',
    'catalog_category/name',
    'category_id',
    null,
    'inner'
);
```

### 5.3 Collection vs. Repository — Performance Tradeoff

**This is a critical architect decision point.**

```php
<?php
// ==================================================
// COLLECTION APPROACH - Raw DB + lightweight objects
// ==================================================
/** @var \Magento\Catalog\Model\ResourceModel\Product\Collection $collection */
$collection = $this->productCollectionFactory->create();
$collection->addAttributeToSelect(['name', 'price', 'sku'])
           ->addAttributeToFilter('status', 1)
           ->setPageSize(100);

// Returns \Magento\Catalog\Model\Product (not fully hydrated)
// SQL is built once, executed once
// Memory: proportional to result set size only
foreach ($collection as $product) {
    echo $product->getName(); // From loaded attributes - no extra query
}
```

```php
<?php
// ==================================================
// REPOSITORY APPROACH - Full object hydration
// ==================================================
/** @var \Magento\Catalog\Api\ProductRepositoryInterface $productRepository */
$searchCriteria = $this->searchCriteriaBuilder
    ->addFilter('status', 1)
    ->setPageSize(100)
    ->create();

$result = $this->productRepository->getList($searchCriteria);

// Each item is a fully hydrated \Magento\Catalog\Api\Data\ProductInterface
// Includes: extension attributes, custom attributes, all data
// Each product object may trigger additional queries for extension attrs
foreach ($result->getItems() as $product) {
    echo $product->getName();
}
```

**Performance Comparison:**

| Aspect | Collection | Repository |
|---|---|---|
| Object type | `Model` (partial hydration) | Full `Data\Interface` with extension attrs |
| SQL queries | 1 optimized query | 1+ (extension attributes = additional queries) |
| Memory usage | Lower | Higher (full data model) |
| API contract | Internal use only | Stable public API contract |
| Service layer use | No — internal/rendering | Yes — service contracts, APIs, integrations |
| Best for | Rendering, reports, bulk ops | API endpoints, service-to-service, external |

**Exam focus:**
- **Repository adds object hydration overhead** — for bulk operations or collection rendering, prefer collections.
- Repository is mandatory when you need **API contract stability** (service contracts) or are crossing module boundaries via interfaces.
- Using Repository in a tight loop of 1000+ products is an architectural mistake — use collection instead.
- The exam scenario: "A custom import script using ProductRepository for 10,000 products is slow. Why?" → Hydration overhead + extension attribute queries per item. Use collection or direct SQL instead.

---

## 6. MSI Architecture Deep Dive

### 6.1 MSI Overview — The Mental Model

MSI (Multi-Source Inventory) replaces the single-stock model with a flexible multi-warehouse system introduced in Magento 2.3.

```
LEGACY MODEL (pre-MSI):
+------------------+
| Product          |
+------------------+
| qty: 50          |  <-- Single number in cataloginventory_stock_item
+------------------+

MSI MODEL:
+------------------+     +-------------------+     +-------------------+
| inventory_source |     | inventory_source  |     | inventory_source  |
| code: warehouse-A|     | code: warehouse-B |     | code: warehouse-C |
| qty: 30          |     | qty: 15           |     | qty: 5            |
+------------------+     +-------------------+     +-------------------+
         |                        |                        |
         +------------------------+------------------------+
                                  |
                    +-------------v-------------+
                    |      inventory_stock      |
                    |  (aggregates sources via  |
                    |   stock-source links)     |
                    +---------------------------+
                                  |
                    +-------------v-------------+
                    |   Salable Quantity =      |
                    |   SUM(source_items.qty)   |
                    |   + SUM(reservations)     |  <-- KEY FORMULA
                    +---------------------------+
```

### 6.2 Core MSI Database Tables

**Exam focus:** Know these tables and their roles. All schemas verified against `vendor/magento/module-inventory/etc/db_schema.xml` and `module-inventory-reservations/etc/db_schema.xml`.

#### `inventory_source`

```
PK: source_code (VARCHAR 255)
Columns:
  name             VARCHAR 255
  enabled          SMALLINT(1), default=1
  description      TEXT
  latitude         DECIMAL(8,6)   -- precision=8, scale=6
  longitude        DECIMAL(9,6)   -- precision=9, scale=6  (NOT 11,6)
  country_id       VARCHAR(2)
  region_id        INT UNSIGNED (nullable)
  region, city, street, postcode, contact_name, email, phone, fax
  use_default_carrier_config SMALLINT(1), default=1
```

```sql
-- Example data:
SELECT source_code, name, enabled FROM inventory_source;
/*
+----------------+-----------------+---------+
| source_code    | name            | enabled |
+----------------+-----------------+---------+
| default        | Default Source  | 1       |
| warehouse-east | East Warehouse  | 1       |
| warehouse-west | West Warehouse  | 1       |
| store-nyc      | NYC Retail      | 1       |
+----------------+-----------------+---------+
*/
```

#### `inventory_source_item`

```
PK: source_item_id (INT UNSIGNED, AUTO_INCREMENT)
Columns:
  source_code  VARCHAR(255)
  sku          VARCHAR(64)
  quantity     DECIMAL(12,4), default=0
  status       SMALLINT UNSIGNED, default=0  -- 0=Out of Stock, 1=In Stock
UNIQUE: (source_code, sku)
```

```sql
-- Example:
SELECT source_code, sku, quantity, status
FROM inventory_source_item
WHERE sku = 'WS12-XS-Orange';
/*
+----------------+----------------+----------+--------+
| source_code    | sku            | quantity | status |
+----------------+----------------+----------+--------+
| warehouse-east | WS12-XS-Orange | 30.0000  | 1      |
| warehouse-west | WS12-XS-Orange | 15.0000  | 1      |
+----------------+----------------+----------+--------+
*/
```

#### `inventory_reservation` — THE CRITICAL TABLE

```
PK: reservation_id (INT UNSIGNED, AUTO_INCREMENT)
Columns:
  stock_id   INT UNSIGNED
  sku        VARCHAR(64)
  quantity   DECIMAL(10,4), default=0  -- NEGATIVE = reservation
  metadata   VARCHAR(255)               -- JSON: order info
INDEX: (stock_id, sku, quantity)
```

**Example reservation lifecycle:**

```sql
-- After order placed (qty reserved = -2)
INSERT INTO inventory_reservation VALUES
(1001, 1, 'WS12-XS-Orange', -2.0000, '{"object_type":"order","object_id":"00001234"}');

-- After order shipped (reservation released = +2 compensating entry)
INSERT INTO inventory_reservation VALUES
(1002, 1, 'WS12-XS-Orange', 2.0000, '{"object_type":"order","object_id":"00001234"}');

-- After shipment, source_item.quantity is physically decremented
UPDATE inventory_source_item
SET quantity = quantity - 2
WHERE source_code = 'warehouse-east' AND sku = 'WS12-XS-Orange';
```

#### `inventory_stock`

```
PK: stock_id (INT UNSIGNED, AUTO_INCREMENT)
Columns:
  name  VARCHAR(255)
```

#### `inventory_source_stock_link`

```
PK: link_id (INT UNSIGNED, AUTO_INCREMENT)
Columns:
  stock_id    INT UNSIGNED (FK → inventory_stock)
  source_code VARCHAR(255) (FK → inventory_source)
  priority    SMALLINT UNSIGNED  -- determines SSA priority order
UNIQUE: (stock_id, source_code)
```

**Important:** Source priority is stored in `inventory_source_stock_link.priority`, NOT in `inventory_source`.

#### `inventory_stock_sales_channel`

```sql
-- Links stocks to sales channels (websites)
-- PK: composite (type, code)
SELECT * FROM inventory_stock_sales_channel;
/*
+----------+----------+-----------+
| type     | code     | stock_id  |
+----------+----------+-----------+
| website  | base     | 1         |
| website  | us_site  | 2         |
+----------+----------+-----------+
*/
```

### 6.3 The Append-Only Reservation Pattern — CRITICAL CONCEPT

**This is the most commonly misunderstood part of MSI and is exam-critical.**

> **The quantity in `inventory_source_item.quantity` does NOT reflect available (salable) quantity without summing all reservations for that SKU/stock.**

**Salable Quantity Formula:**

```
Salable Qty = SUM(inventory_source_item.quantity WHERE sources linked to stock)
            + SUM(inventory_reservation.quantity WHERE stock_id = X AND sku = Y)

Note: reservations are NEGATIVE numbers, so this is subtraction.
```

**SQL to calculate actual salable quantity:**

```sql
-- Calculate salable quantity for a SKU on stock_id = 1
SELECT
    isi_total.sku,
    isi_total.gross_qty,
    COALESCE(res_total.reserved_qty, 0) AS reserved_qty,
    isi_total.gross_qty + COALESCE(res_total.reserved_qty, 0) AS salable_qty
FROM (
    -- Sum gross qty from all sources linked to stock 1
    SELECT
        isi.sku,
        SUM(isi.quantity) AS gross_qty
    FROM inventory_source_item isi
    INNER JOIN inventory_source_stock_link issl
        ON isi.source_code = issl.source_code
    WHERE issl.stock_id = 1
      AND isi.status = 1
      AND isi.sku = 'WS12-XS-Orange'
    GROUP BY isi.sku
) AS isi_total
LEFT JOIN (
    -- Sum all reservations (will be negative for active orders)
    SELECT sku, SUM(quantity) AS reserved_qty
    FROM inventory_reservation
    WHERE stock_id = 1
      AND sku = 'WS12-XS-Orange'
    GROUP BY sku
) AS res_total ON isi_total.sku = res_total.sku;
```

**Why append-only?**

```
APPEND-ONLY DESIGN RATIONALE:
+-----------------------------------------------+
| Reservation          | quantity | Reason       |
+----------------------+----------+--------------+
| Order #1234 placed   | -2.0000  | Soft reserve |
| Order #1235 placed   | -1.0000  | Soft reserve |
| Order #1236 cancelled| +1.0000  | Compensate   |
| Order #1234 shipped  | +2.0000  | Compensate   |
+----------------------+----------+--------------+
| NET RESERVED         | -1.0000  | SUM of all   |
+-----------------------------------------------+

Benefits of append-only:
1. ACID safe: no UPDATE contention on shared rows during high concurrency
2. Audit trail: full history of all reservation events
3. Compensation: cancel/refund is just a positive entry, not DELETE
4. Race condition safe: two simultaneous orders append two rows, no lost updates
```

**Exam focus:**
- **The reservation table is append-only** — you never UPDATE or DELETE reservation rows.
- Cancellation = insert a positive compensating entry (equal to the negative reservation).
- Shipping = insert compensating entry AND decrement `inventory_source_item.quantity`.
- **`inventory_source_item.quantity` alone is meaningless for available quantity** — always add reservations.
- This is an event-sourcing pattern applied to inventory.

### 6.4 MSI Table Relationships Diagram

```
inventory_source
    source_code (PK)
         |
         | 1:N
         v
inventory_source_item              inventory_reservation
    source_code (FK) ----+              reservation_id (PK, AI)
    sku                  |              stock_id (FK)
    quantity             |              sku
    status               |              quantity  (negative = reserved)
                         |              metadata
inventory_source_stock_link
    source_code (FK) ----+
    stock_id (FK)
    priority  <-- SSA priority order stored here
         |
         v
inventory_stock
    stock_id (PK)
    name
         |
         v
inventory_stock_sales_channel
    stock_id (FK)
    type  (e.g., 'website')
    code  (e.g., 'base')
    PK: (type, code)
```

---

## 7. MSI Source Selection Algorithms

### 7.1 What is Source Selection?

When an order is placed, MSI must decide **which source(s)** fulfill it. This is the Source Selection Algorithm (SSA).

```
Order placed for: WS12-XS-Orange x 3

Available sources:
  warehouse-east: 30 units
  warehouse-west: 2 units
  store-nyc:      5 units

SSA Decision:
  Priority SSA:   warehouse-east (highest priority, has stock)
  Distance SSA:   store-nyc (closest to customer's address)
```

### 7.2 Built-in SSAs

#### Priority SSA

```
Algorithm: Select sources in priority order (from inventory_source_stock_link.priority)
           until quantity is fulfilled.

Config: Admin > Stores > Inventory > Source Priority (per stock)

Priority Order Example:
  1. warehouse-east (priority 1 in inventory_source_stock_link)
  2. warehouse-west (priority 2)
  3. store-nyc      (priority 3)

For order of 3 units:
  warehouse-east has 30 -> assign 3 from warehouse-east
  DONE.

For order of 35 units:
  warehouse-east has 30 -> assign 30
  warehouse-west has 2  -> assign 2
  store-nyc has 5       -> assign 3
  TOTAL: 35 fulfilled from 3 sources
```

**Implementation:** `Magento\InventorySourceSelection\Model\Algorithms\PriorityBasedAlgorithm` implements `SourceSelectionInterface`

#### Distance Priority SSA

```
Algorithm: Select nearest source to shipping address using
           latitude/longitude calculation (or Google Maps API).

Requires:
  - Source lat/long configured in inventory_source
  - Google Maps Distance Matrix API key OR offline calculation

Use case: Ship-from-store, same-day delivery optimization
```

**Exam focus:**
- **Distance SSA requires Google Maps API** configuration — it doesn't work offline without a custom implementation.
- **Priority SSA is the default** and is purely configuration-based (no API dependencies).
- SSAs run at order placement time and produce `SourceSelectionResultInterface` — they do NOT directly modify reservations.

### 7.3 Custom SSA Implementation

**Critical:** Custom SSAs implement `Magento\InventorySourceSelectionApi\Model\SourceSelectionInterface` (in `Model/` namespace) — NOT `SourceSelectionAlgorithmInterface` which is a **DTO** (`Api/Data/SourceSelectionAlgorithmInterface extends ExtensibleDataInterface`).

```php
<?php
// Custom SSA: prefer sources with highest quantity (fill-rate optimization)
namespace Vendor\Inventory\Model\Algorithms;

use Magento\InventorySourceSelectionApi\Api\Data\InventoryRequestInterface;
use Magento\InventorySourceSelectionApi\Api\Data\SourceSelectionResultInterface;
use Magento\InventorySourceSelectionApi\Model\SourceSelectionInterface;
use Magento\InventorySourceSelectionApi\Api\Data\SourceSelectionResultInterfaceFactory;
use Magento\InventorySourceSelectionApi\Api\Data\SourceSelectionItemInterfaceFactory;

class MaxStockAlgorithm implements SourceSelectionInterface
{
    private SourceSelectionResultInterfaceFactory $resultFactory;
    private SourceSelectionItemInterfaceFactory $itemFactory;

    public function __construct(
        SourceSelectionResultInterfaceFactory $resultFactory,
        SourceSelectionItemInterfaceFactory $itemFactory
    ) {
        $this->resultFactory = $resultFactory;
        $this->itemFactory = $itemFactory;
    }

    /**
     * @param InventoryRequestInterface $inventoryRequest
     * @return SourceSelectionResultInterface
     */
    public function execute(
        InventoryRequestInterface $inventoryRequest
    ): SourceSelectionResultInterface {
        $selectionItems = [];
        $isShippable = true;

        foreach ($inventoryRequest->getItems() as $item) {
            $qtyToDeliver = $item->getQty();
            // ... custom logic to select sources ...
            // Sort sources by available quantity descending
            // Assign from highest-qty source first

            $selectionItems[] = $this->itemFactory->create([
                'sourceCode'   => 'warehouse-east',
                'sku'          => $item->getSku(),
                'qtyToDeduct'  => $qtyToDeliver,
                'qtyAvailable' => 30.0
            ]);
        }

        return $this->resultFactory->create([
            'sourceSelectionItems' => $selectionItems,
            'isShippable'          => $isShippable
        ]);
    }
}
```

**Register the custom SSA — correct pattern:**

Custom SSAs are registered as items in the `sourceSelectionMethods` argument of `Magento\InventorySourceSelectionApi\Model\SourceSelectionService`:

```xml
<!-- etc/di.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">

    <!-- Register algorithm in the sourceSelectionMethods pool -->
    <type name="Magento\InventorySourceSelectionApi\Model\SourceSelectionService">
        <arguments>
            <argument name="sourceSelectionMethods" xsi:type="array">
                <item name="max_stock" xsi:type="string">
                    Vendor\Inventory\Model\Algorithms\MaxStockAlgorithm
                </item>
            </argument>
        </arguments>
    </type>
</config>
```

**How it's wired:** The built-in Priority algorithm is registered exactly this way in `module-inventory-source-selection/etc/di.xml`:
```xml
<type name="Magento\InventorySourceSelectionApi\Model\SourceSelectionService">
    <arguments>
        <argument name="sourceSelectionMethods" xsi:type="array">
            <item name="priority" xsi:type="string">
                Magento\InventorySourceSelection\Model\Algorithms\PriorityBasedAlgorithm
            </item>
        </argument>
    </arguments>
</type>
```

```php
<?php
// Use via SourceSelectionServiceInterface
namespace Vendor\Module\Service;

use Magento\InventorySourceSelectionApi\Api\SourceSelectionServiceInterface;
use Magento\InventorySourceSelectionApi\Api\Data\InventoryRequestInterfaceFactory;

class MyInventoryService
{
    public function __construct(
        private SourceSelectionServiceInterface $sourceSelectionService,
        private InventoryRequestInterfaceFactory $inventoryRequestFactory
    ) {}

    public function selectSources(int $stockId, array $items): void
    {
        $inventoryRequest = $this->inventoryRequestFactory->create([
            'stockId' => $stockId,
            'items'   => $items
        ]);

        // Specify algorithm by code string
        $result = $this->sourceSelectionService->execute(
            $inventoryRequest,
            'max_stock'  // your custom algorithm code
        );

        foreach ($result->getSourceSelectionItems() as $item) {
            printf(
                "Source: %s, SKU: %s, Qty: %s\n",
                $item->getSourceCode(),
                $item->getSku(),
                $item->getQtyToDeduct()
            );
        }
    }
}
```

**`SourceSelectionServiceInterface::execute` signature (confirmed):**
```php
public function execute(
    \Magento\InventorySourceSelectionApi\Api\Data\InventoryRequestInterface $inventoryRequest,
    string $algorithmCode
): \Magento\InventorySourceSelectionApi\Api\Data\SourceSelectionResultInterface;
```

**Exam focus:**
- Custom SSAs implement `Magento\InventorySourceSelectionApi\Model\SourceSelectionInterface` (NOT the `Api/Data/SourceSelectionAlgorithmInterface` DTO).
- Registration: add item to `sourceSelectionMethods` array of `SourceSelectionService` in `di.xml`.
- The service entry point is `SourceSelectionServiceInterface::execute($request, $algorithmCode)`.
- SSA code is a string identifier (the `name` attribute of the `<item>` in di.xml) — it's how you switch algorithms per business logic.

---

## 8. Legacy Compatibility Layer

### 8.1 Why `cataloginventory_stock_item` Still Exists

```
MIGRATION PATH:
+---------------------------------+
| Pre-MSI Magento (< 2.3)        |
| cataloginventory_stock_item     |
|   product_id | qty | is_in_stock|
+---------------------------------+
           |
           | MSI introduced (2.3)
           v
+---------------------------------+        +----------------------------+
| MSI Tables (source of truth)    |        | Legacy table STILL WRITTEN |
| inventory_source_item           |<------>| cataloginventory_stock_item |
| inventory_reservation           |        | (backward compatibility)    |
+---------------------------------+        +----------------------------+
```

**Why the legacy table is kept:**

1. **Third-party extension compatibility** — thousands of extensions read from `cataloginventory_stock_item`
2. **ERP integrations** — external systems that sync to Magento often write to this table
3. **Admin UI backward compatibility** — some product grid qty columns read legacy table
4. **Gradual migration path** — MSI can be disabled, falling back to legacy behavior

```sql
-- Legacy table structure (still populated by MSI observers)
SELECT csi.product_id, csi.qty, csi.is_in_stock, csi.stock_id
FROM cataloginventory_stock_item csi
INNER JOIN catalog_product_entity cpe ON csi.product_id = cpe.entity_id
WHERE cpe.sku = 'WS12-XS-Orange';
/*
+------------+---------+-------------+----------+
| product_id | qty     | is_in_stock | stock_id |
+------------+---------+-------------+----------+
| 1234       | 45.0000 | 1           | 1        |
+------------+---------+-------------+----------+
*/
-- This qty (45) is SUM of all sources linked to default stock
-- Written by MSI observer when source_item changes
```

**Exam focus:**
- The legacy `cataloginventory_stock_item` table is **written to by MSI observers** for backward compatibility — you should **read from MSI tables** for accurate salable quantity.
- Do NOT rely on `cataloginventory_stock_item.qty` for available quantity in new code — it does not include reservations.
- The legacy table's `qty` represents gross aggregated source quantities, but still misses reservation offsets.
- MSI can be fully disabled (for single-source stores that don't need it) — the legacy model takes over completely.

### 8.2 Reading Stock Correctly

```php
<?php
// WRONG (legacy, misses reservations):
$stockItem = $this->stockRegistry->getStockItemBySku($sku);
// Magento\CatalogInventory\Model\StockRegistry::getStockItemBySku()
$qty = $stockItem->getQty();  // Gross qty, no reservations

// CORRECT (MSI salable qty with reservations):
use Magento\InventorySalesApi\Api\GetProductSalableQtyInterface;

// Signature: execute(string $sku, int $stockId): float
$salableQty = $this->getProductSalableQty->execute($sku, $stockId);
// This returns: source_item qtys + reservation offsets = TRUE available qty
// Also subtracts min_qty "Out-of-Stock Threshold" if configured
```

---

## 9. Architect-Level Decision Frameworks

### 9.1 Performance Decision Tree

When given a "site is slow" scenario, work through this order:

```
1. What is the FPC hit ratio?
   |-- < 80%? --> Diagnose FPC misses FIRST (uncacheable blocks, vary explosion)
   |-- > 95%? --> FPC is fine, move to step 2

2. What does MAGE_PROFILER show for cache-miss requests?
   |-- High DB query count (>100)? --> Step 3
   |-- High block render time?     --> OPcache issue or heavy computation
   |-- High total time but few ops? --> I/O bottleneck (slow disk, network)

3. What do slow query logs / EXPLAIN show?
   |-- type=ALL on large tables? --> Missing index
   |-- High query COUNT?         --> N+1 problem in collections
   |-- Using filesort?           --> Add covering index for ORDER BY

4. What does PHP-FPM status show?
   |-- Max children reached?     --> Pool undersized (more workers or more RAM)
   |-- Queue backing up?         --> Either more workers or request processing too slow
```

### 9.2 MSI Decision Tree

```
Q: "Is salable quantity accurate?"
   |-- Reading from cataloginventory_stock_item? --> NO, switch to GetProductSalableQtyInterface
   |-- Reading from inventory_source_item without reservations? --> NO, must include reservations

Q: "Order fulfillment from wrong warehouse?"
   |-- Check: which SSA is configured for the stock?
   |-- Check: source priorities in inventory_source_stock_link.priority
   |-- Check: are sources enabled and linked to the correct stock?

Q: "Custom fulfillment logic needed?"
   |-- Implement Magento\InventorySourceSelectionApi\Model\SourceSelectionInterface
   |-- Register in di.xml as item in SourceSelectionService::sourceSelectionMethods array
   |-- Call via SourceSelectionServiceInterface::execute()
```

### 9.3 Scenario Analysis — Exam-Style Walkthroughs

**Scenario 1:**
> "A Magento store's response time is 800ms average. PHP OPcache is configured. MySQL has proper indexes. The DevOps team wants to add more application servers. Is this the right approach?"

**Analysis:**
- Before scaling horizontally, check FPC hit ratio.
- If FPC hit ratio is 40%, adding servers means 40% more PHP processes all doing full page renders.
- Fixing the FPC issue (e.g., making a block cacheable) could reduce load by 60% instantly.
- **Answer: Check FPC hit ratio first. Horizontal scaling without FPC optimization scales the problem, not the solution.**

**Scenario 2:**
> "A custom extension queries inventory quantity directly from `inventory_source_item` to show 'X left in stock' on the product page. Customers report seeing 'In Stock' on products that are actually sold out due to pending orders."

**Analysis:**
- `inventory_source_item.quantity` = gross quantity on shelves.
- Pending orders create NEGATIVE reservations in `inventory_reservation`.
- Without summing reservations, the extension sees gross qty, not salable qty.
- **Answer: Use `GetProductSalableQtyInterface::execute($sku, $stockId)` which applies reservation offsets.**

**Scenario 3:**
> "A bulk product import script using `ProductRepositoryInterface::save()` for 50,000 products takes 6 hours. How would you architect a faster solution?"

**Analysis:**
- Repository::save() triggers full object hydration, event dispatching, cache clearing per product.
- For bulk imports, direct DB writes via `\Magento\Catalog\Model\ResourceModel\Product` (resource model) or custom SQL bypasses event/cache overhead.
- Or use `bin/magento import:run` with CSV import (optimized for bulk).
- Post-import: single `bin/magento indexer:reindex` rather than per-save reindexing.
- **Answer: Use CSV import or direct resource model; reindex once after import; disable events during import.**

---

## 10. Hands-On Lab: Inspect the Reservation Log

### 10.1 Lab Setup

```bash
# Ensure you have an EE/Cloud instance with MSI enabled (default in 2.3+)
# Verify MSI modules are active
bin/magento module:status | grep Inventory
```

### 10.2 Baseline State

```sql
-- Check initial state before placing order
SELECT
    isi.source_code,
    isi.sku,
    isi.quantity AS gross_qty
FROM inventory_source_item isi
WHERE isi.sku = 'WS12-XS-Orange';

-- Check reservations (should be 0 or empty)
SELECT *
FROM inventory_reservation
WHERE sku = 'WS12-XS-Orange'
ORDER BY reservation_id DESC
LIMIT 10;
```

### 10.3 Place Test Order and Inspect

```sql
-- STEP 1: Check reservations after order placement
SELECT
    reservation_id,
    stock_id,
    sku,
    quantity,
    metadata
FROM inventory_reservation
WHERE sku = 'WS12-XS-Orange'
ORDER BY reservation_id DESC
LIMIT 5;
/*
+----------------+----------+----------------+----------+-----------------------------------------+
| reservation_id | stock_id | sku            | quantity | metadata                                |
+----------------+----------+----------------+----------+-----------------------------------------+
| 1847           | 1        | WS12-XS-Orange | -2.0000  | {"object_type":"order","object_id":"42"}|
+----------------+----------+----------------+----------+-----------------------------------------+
Note: quantity is NEGATIVE = reserved (unavailable)
*/

-- STEP 2: Calculate salable qty after reservation
SELECT
    SUM(isi.quantity) AS gross_qty,
    (SELECT SUM(r.quantity) FROM inventory_reservation r
     WHERE r.sku = 'WS12-XS-Orange' AND r.stock_id = 1) AS net_reservations,
    SUM(isi.quantity) +
    COALESCE((SELECT SUM(r.quantity) FROM inventory_reservation r
              WHERE r.sku = 'WS12-XS-Orange' AND r.stock_id = 1), 0) AS salable_qty
FROM inventory_source_item isi
INNER JOIN inventory_source_stock_link issl
    ON isi.source_code = issl.source_code
    AND issl.stock_id = 1
WHERE isi.sku = 'WS12-XS-Orange'
  AND isi.status = 1;
/*
+-----------+------------------+-------------+
| gross_qty | net_reservations | salable_qty |
+-----------+------------------+-------------+
| 45.0000   | -2.0000          | 43.0000     |
+-----------+------------------+-------------+
*/
```

### 10.4 Cancel Order and Observe Compensation

```sql
-- After cancelling the order, observe compensating reservation entry
SELECT
    reservation_id,
    quantity,
    metadata
FROM inventory_reservation
WHERE sku = 'WS12-XS-Orange'
ORDER BY reservation_id DESC
LIMIT 5;
/*
+----------------+----------+--------------------------------------------------+
| reservation_id | quantity | metadata                                         |
+----------------+----------+--------------------------------------------------+
| 1848           | 2.0000   | {"object_type":"order","object_id":"42","..."}   |  <-- compensation
| 1847           | -2.0000  | {"object_type":"order","object_id":"42"}          |  <-- original reservation
+----------------+----------+--------------------------------------------------+

NET = -2 + 2 = 0  (order cancelled, stock available again)
Note: row 1847 is NEVER deleted or updated
*/
```

**Exam focus:**
- The lab confirms: **rows are only inserted, never updated/deleted**.
- Cancellation produces a **positive compensating entry** equal in magnitude to the original negative reservation.
- `inventory_source_item.quantity` does NOT change on order placement/cancellation — it only changes on physical shipment.

### 10.5 PHP API Verification

```php
<?php
// Verify salable qty via API (matches our SQL calculation)
use Magento\InventorySalesApi\Api\GetProductSalableQtyInterface;

// Signature: execute(string $sku, int $stockId): float
// (also considers min_qty / Out-of-Stock Threshold)
$stockId = 1; // default stock
$sku = 'WS12-XS-Orange';

$salableQty = $this->getProductSalableQty->execute($sku, $stockId);
// Returns: 43.0 (matches SQL: 45 gross - 2 reserved)
```

---

## Quick-Reference Checklist

### Performance Optimization

- [ ] **FPC hit ratio is the #1 performance lever** — diagnose low FPC hit rate before any other tuning
- [ ] A single block with `cacheable="false"` in layout XML makes the **entire page** uncacheable
- [ ] Private/session-dependent content belongs in **customer-data JS sections**, not PHP blocks
- [ ] **MAGE_PROFILER** env var (`html`, `csvfile`) provides built-in profiling with no agents required
- [ ] **Blackfire** = function-level call graph profiling; best for code-level bottleneck identification
- [ ] **New Relic APM** = available on **Cloud Pro only** (pre-configured); measures transaction-level metrics
- [ ] **Xdebug MUST be disabled in production** — adds 2-10x overhead; direct exam question
- [ ] OPcache: set `validate_timestamps=0` for production; must restart PHP-FPM after deploys
- [ ] OPcache: `max_accelerated_files` must exceed total PHP file count in installation (often 60,000+)
- [ ] PHP-FPM: size `max_children` = available RAM / average process RAM
- [ ] PHP-FPM: `pm=dynamic` for variable traffic; `pm=static` for consistent high-traffic
- [ ] `EXPLAIN` output: `type=ALL` = full table scan; `Using filesort` = needs index on ORDER BY cols
- [ ] N+1 in collections: use `addAttributeToSelect()` to load EAV attributes in one query
- [ ] `joinField()` on collections joins related table data without lazy loading
- [ ] **Repository adds object hydration overhead** — avoid in bulk operations; use collections instead
- [ ] Repository is required when crossing module service contract boundaries or building APIs
- [ ] High query COUNT with low individual time in MAGE_PROFILER = N+1 pattern

### MSI Architecture

- [ ] **MSI core tables**: `inventory_source`, `inventory_source_item`, `inventory_reservation`, `inventory_stock`, `inventory_source_stock_link`, `inventory_stock_sales_channel`
- [ ] `inventory_source` = physical warehouse/location definitions; PK=`source_code` (VARCHAR)
- [ ] `inventory_source.latitude` = DECIMAL(8,6); `longitude` = DECIMAL(9,6)
- [ ] `inventory_source_item` = gross physical quantity per source per SKU; `status` default=0 (disabled)
- [ ] `inventory_source_item.quantity` = DECIMAL(12,4); `status` = SMALLINT UNSIGNED
- [ ] **`inventory_reservation` is append-only** — rows are NEVER updated or deleted
- [ ] `inventory_reservation.quantity` = DECIMAL(10,4); `metadata` = VARCHAR(255) JSON
- [ ] Reservations use **negative quantities** for orders; **positive compensating entries** for cancellations/shipments
- [ ] **Salable qty = SUM(source_item.qty WHERE status=1) + SUM(reservation.qty)** — reservation sum is typically negative
- [ ] `inventory_source_stock_link.priority` column determines source priority order (NOT in inventory_source)
- [ ] The reservation pattern is **event-sourcing** — full audit trail, race-condition safe via append-only inserts
- [ ] Shipping decrements `inventory_source_item.quantity` AND inserts compensating reservation entry
- [ ] **Priority SSA** (`PriorityBasedAlgorithm`) = default algorithm; reads priority from `inventory_source_stock_link.priority`
- [ ] **Distance SSA** = selects nearest source to delivery address; **requires Google Maps API** configuration
- [ ] Custom SSA: implement `Magento\InventorySourceSelectionApi\Model\SourceSelectionInterface` (in `Model/` namespace)
- [ ] `Api/Data/SourceSelectionAlgorithmInterface` is a **DTO** (extends `ExtensibleDataInterface`) — NOT the algorithm interface
- [ ] Custom SSA registration: add `<item>` to `sourceSelectionMethods` array of `Magento\InventorySourceSelectionApi\Model\SourceSelectionService` in di.xml
- [ ] Custom SSA invoked via `SourceSelectionServiceInterface::execute($request, $algorithmCode)` where `$algorithmCode` is the item name
- [ ] **`cataloginventory_stock_item` (legacy table) is still written** by MSI observers for BC with old extensions
- [ ] Legacy `cataloginventory_stock_item.qty` does NOT include reservation offsets — do not use for accurate stock
- [ ] Use `GetProductSalableQtyInterface::execute(string $sku, int $stockId): float` for accurate available quantity
- [ ] `StockRegistry::getStockItemBySku()` (`Magento\CatalogInventory\Model\StockRegistry`) reads legacy table — **avoid for accurate MSI quantities**
- [ ] MSI can be disabled for single-source stores; legacy inventory model takes over completely

### Architect Decision Rules

- [ ] Slow site + FPC hit ratio not checked → always check FPC first before any other optimization
- [ ] "Show available quantity" widget → must use `GetProductSalableQtyInterface`, NOT `inventory_source_item.qty`
- [ ] Bulk import via Repository → architectural mistake; use CSV import or direct resource model
- [ ] Custom fulfillment routing → implement custom SSA (`SourceSelectionInterface`), not Observer pattern on order placement
- [ ] Third-party extension reads `cataloginventory_stock_item` → document as legacy dependency; migrate to MSI API
- [ ] Adding servers to fix slow site → only beneficial after FPC hit ratio is high; otherwise scales the problem
