# Magento 2 — Cache Architecture: Comprehensive Study Notes

---

## Table of Contents

1. [Overview of Magento 2 Caching](#1-overview-of-magento-2-caching)
2. [Full Page Cache (FPC)](#2-full-page-cache-fpc)
   - [Built-in FPC vs Varnish](#built-in-fpc-vs-varnish)
   - [Varnish Integration](#varnish-integration)
   - [Hole-Punching](#hole-punching)
   - [ESI Blocks](#esi-blocks)
3. [Block Cache](#3-block-cache)
   - [Cache Tags](#cache-tags)
   - [Cache Identifiers](#cache-identifiers)
   - [_loadCache and _saveCache](#_loadcache-and-_savecache)
4. [Cache Types Reference](#4-cache-types-reference)
5. [Redis as Cache Backend vs Session Storage](#5-redis-as-cache-backend-vs-session-storage)
6. [Cache Invalidation Strategies](#6-cache-invalidation-strategies)
7. [CLI Practice Reference](#7-cli-practice-reference)
8. [Architecture Diagrams](#8-architecture-diagrams)
9. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Overview of Magento 2 Caching

Magento 2 uses a **layered caching strategy** with multiple distinct systems working together:

| Layer | Mechanism | Scope |
|---|---|---|
| Full Page Cache | Varnish / built-in PHP | Entire HTTP response |
| Block Cache | `Zend_Cache` / Redis / File | Individual block HTML |
| Object Cache | Internal PHP memory | Runtime only |
| Config/EAV Cache | File / Redis | Serialized PHP data |
| Session Storage | File / Redis / DB | Per-user state |

**Exam focus:**
- Magento caching is built on top of `Magento\Framework\Cache\Frontend\Decorator` wrappers around a `Zend\Cache` backend
- The cache configuration lives in `app/etc/env.php` under the `cache` key
- `di.xml` and `cache.xml` control which types are available

### Core Configuration File

```php
// app/etc/env.php (cache section)
'cache' => [
    'frontend' => [
        'default' => [
            'backend' => 'Magento\\Framework\\Cache\\Backend\\Redis',
            'backend_options' => [
                'server'   => '127.0.0.1',
                'database' => '0',
                'port'     => '6379',
            ],
        ],
        'page_cache' => [
            'backend' => 'Magento\\Framework\\Cache\\Backend\\Redis',
            'backend_options' => [
                'server'   => '127.0.0.1',
                'database' => '1',  // separate DB for FPC
                'port'     => '6379',
                'compress_data' => '0',
            ],
        ],
    ],
],
```

**Exam focus:**
- `default` frontend = block/config/EAV caches
- `page_cache` frontend = Full Page Cache only
- Using a **separate Redis database** for FPC is a best practice

---

## 2. Full Page Cache (FPC)

Full Page Cache stores the **entire rendered HTTP response** for a given URL, bypassing PHP execution on subsequent requests.

### Built-in FPC vs Varnish

| Feature | Built-in FPC (CE/EE) | Varnish (EE recommended) |
|---|---|---|
| Implementation | PHP-based, `Magento\PageCache` module | Reverse proxy, C-based daemon |
| Performance | Moderate — still hits PHP/FPM | High — handled before PHP |
| ESI Support | Simulated via AJAX/block markers | Native ESI processing |
| SSL Termination | Handled by web server | Requires separate SSL terminator (nginx) |
| Availability | Community + Enterprise | Enterprise recommended |
| `X-Magento-Cache-Control` | Written by Magento, read by built-in | Written by Magento, read by Varnish |
| Config location | `Stores > Config > Advanced > System > FPC` | `app/etc/env.php` + VCL |

**Exam focus:**
- On **Commerce (EE)**, Varnish is the *recommended* FPC solution
- On **Open Source (CE)**, the built-in PHP-based FPC is the default
- Varnish sits **in front of nginx/Apache** — it is a reverse proxy, not a web server plugin
- Both solutions use the same `X-Magento-Tags` HTTP header mechanism for invalidation

### Varnish Integration

#### Request Flow with Varnish

```
Browser
  |
  v
Varnish (port 80/443 via SSL terminator)
  |
  +-- Cache HIT  --> Return cached response immediately
  |
  +-- Cache MISS --> Forward to nginx (port 8080)
                        |
                        v
                     PHP-FPM / Magento
                        |
                        v
                     Response + X-Magento-Tags header
                        |
                        v
                     Varnish stores response
                        |
                        v
                     Browser receives response
```

#### Generating the VCL

```bash
# Generate Varnish 6.x compatible VCL
bin/magento varnish:vcl:generate \
    --access-list="localhost" \
    --backend-host="127.0.0.1" \
    --backend-port="8080" \
    --export-version="6" \
    --output-file="/etc/varnish/default.vcl"
```

#### Key VCL Concepts

```vcl
// Magento sets this header to tell Varnish what to cache
// X-Magento-Cache-Control: max-age=86400, public

// Varnish purges by tag using BAN
// When Magento invalidates tag "catalog_product_1":
// PURGE request sent to Varnish with X-Magento-Tags-Pattern header

sub vcl_recv {
    // Strip cookies for cacheable pages
    if (req.url ~ "^/(pub/)?(media|static)/") {
        unset req.http.Cookie;
        return (hash);
    }
}
```

**Exam focus:**
- Magento communicates cache invalidation to Varnish via **HTTP PURGE** requests
- The `PURGE` ACL in the VCL must include the Magento server's IP
- `X-Magento-Tags` header carries comma-separated cache tags on responses
- `X-Magento-Cache-Debug` header shows HIT/MISS for debugging

#### Enabling Varnish in Magento

```bash
# Set Varnish as the FPC application
bin/magento config:set system/full_page_cache/caching_application 2
# 1 = Built-in, 2 = Varnish

# Set TTL
bin/magento config:set system/full_page_cache/ttl 86400
```

### Hole-Punching

**Hole-punching** is the technique of *excluding* dynamic, user-specific blocks from the FPC-cached response and loading them separately.

#### Why It's Needed

A fully cached page would serve the **same content to all users**, breaking:
- Shopping cart count/contents
- Customer name in header ("Welcome, John")
- Recently viewed products
- Wish list count
- CSRF form keys

#### How Hole-Punching Works in Magento 2

Magento 2 uses **two strategies** for hole-punching:

**Strategy 1: Cookie-based Private Content (preferred)**
```
1. Server sends cached page with placeholder markup
2. Browser JS reads customer-specific data from localStorage/cookies
3. JS fills in dynamic content client-side
4. No additional server request needed for simple data
```

**Strategy 2: Ajax-based block loading**
```
1. Cached page contains JS that fires XHR to /customer/section/load
2. Response returns JSON with private section data
3. JS renders dynamic content from JSON
```

**Exam focus:**
- Private content sections are defined in `etc/frontend/sections.xml`
- Sections stored in browser `localStorage`, keyed by `mage/storage`
- The `X-Magento-Vary` cookie triggers separate cache entries per user context
- Setting `cacheable="false"` on any block in a layout **disables FPC for the entire page** — this is a critical gotcha

```xml
<!-- etc/frontend/sections.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Customer:etc/sections.xsd">
    <action name="checkout/cart/add">
        <section name="cart"/>
    </action>
    <action name="wishlist/index/add">
        <section name="wishlist"/>
    </action>
</config>
```

### ESI Blocks

**Edge Side Includes (ESI)** is an HTTP standard that allows **Varnish to assemble pages** from separately cached fragments.

#### How ESI Works

```
Cached page response contains:
+------------------------------------------+
|  <html>                                  |
|    <header>...</header>                  |
|    <esi:include src="/_esi/header/cart"  |
|         onerror="continue"/>             |
|    <main>...</main>                      |
|    <esi:include src="/_esi/nav/menu"/>   |
|  </html>                                 |
+------------------------------------------+

Varnish processes ESI tags:
- Fetches /_esi/header/cart (cached separately, short TTL)
- Fetches /_esi/nav/menu (cached separately, long TTL)
- Assembles final response
```

#### ESI in Magento 2 (Enterprise Edition)

```xml
<!-- Block layout XML — mark a block for ESI -->
<block class="Magento\Framework\View\Element\Template"
       name="top.cart"
       template="Magento_Checkout::cart/link.phtml"
       ttl="60"/>   <!-- ttl attribute enables ESI for this block -->
```

**The `ttl` attribute on a block tells Magento to render it as an ESI include.**

#### ESI Block PHP

```php
// Magento\PageCache\Model\Layout\DepersonalizePlugin
// Handles de-personalization of blocks loaded via ESI

// ESI URL format:
// GET /_esi/magento/block?id=top.cart&handles[]=default&handles[]=catalog_category_view
```

**Exam focus:**
- ESI is **only available with Varnish**, not built-in FPC
- The `ttl` attribute in layout XML is the signal to generate an ESI include
- ESI blocks are cached **independently** from the parent page with their own TTL
- Without Varnish, blocks with `ttl` attributes are rendered inline (fallback behavior)
- ESI requires the VCL to have `set resp.http.surrogate-control = "ESI/1.0"` enabled

---

## 3. Block Cache

Block cache stores **rendered HTML fragments** of individual blocks, identified by a unique cache key and tagged for targeted invalidation.

### Cache Tags

Cache tags are **string identifiers** attached to a cached item that allow **batch invalidation** of related items.

```php
// Tags are defined as class constants, e.g.:
// Magento\Catalog\Model\Product::CACHE_TAG = 'cat_p'
// Magento\Catalog\Model\Category::CACHE_TAG = 'cat_c'
// Magento\Cms\Model\Page::CACHE_TAG = 'cms_p'

// A product block might carry tags:
// ['cat_p', 'cat_p_42', 'cat_c', 'cat_c_5', 'FPC']
// Where 42 = product ID, 5 = category ID
```

#### Common Cache Tags

| Tag Constant | Tag Value | Description |
|---|---|---|
| `Product::CACHE_TAG` | `cat_p` | All products |
| `Category::CACHE_TAG` | `cat_c` | All categories |
| `CmsPage::CACHE_TAG` | `cms_p` | All CMS pages |
| `CmsBlock::CACHE_TAG` | `cms_b` | All CMS blocks |
| `Config::CACHE_TAG` | `config` | Config data |
| `Block::CACHE_TAG` | `block_html` | All block HTML |

#### Entity-Specific Tags

```php
// Entity-specific tag = CACHE_TAG + '_' + entity_id
// 'cat_p_42'  = product with ID 42
// 'cat_c_5'   = category with ID 5
// 'cms_p_12'  = CMS page with ID 12
```

**Exam focus:**
- When a product is saved, Magento calls `cleanModelCache()` which cleans by tag `cat_p_{id}`
- Tags enable **surgical invalidation** — only pages/blocks containing that entity are cleared
- The `FPC` tag is added to all full-page-cached pages

### Cache Identifiers

The cache **identifier** (key) uniquely identifies a specific cached item. Unlike tags (used for invalidation), identifiers are used for **retrieval**.

```php
// AbstractBlock::getCacheKey()
public function getCacheKey()
{
    if ($this->hasData('cache_key')) {
        return $this->getData('cache_key');
    }
    // Default: md5 hash of all getCacheKeyInfo() values
    return md5(implode('|', $this->getCacheKeyInfo()));
}

// Override getCacheKeyInfo() to customize cache key components:
public function getCacheKeyInfo()
{
    return [
        'MYMODULE_MYBLOCK',        // unique block identifier
        $this->_storeManager->getStore()->getId(),  // store ID
        $this->_design->getDesignTheme()->getId(),  // theme ID
        // add any other variables that affect output
    ];
}
```

**Exam focus:**
- `getCacheKeyInfo()` returns an **array** — elements are joined and hashed to form the key
- Always include **store ID** and **theme ID** in cache key to prevent cross-store contamination
- If two blocks share the same key, they share cached content — a common bug source
- `cache_lifetime` → `null` means **no caching** for that block; `0` means cache forever

### _loadCache and _saveCache

These are the low-level methods in `\Magento\Framework\View\Element\AbstractBlock` for manual cache operations.

```php
// Magento\Framework\View\Element\AbstractBlock

/**
 * Load block HTML from cache storage
 * Returns false if not found or cache disabled
 */
protected function _loadCache()
{
    if (is_null($this->getCacheLifetime()) || !$this->_cacheState->isEnabled(self::CACHE_GROUP)) {
        return false;
    }
    $cacheKey = $this->getCacheKey();
    $cacheData = $this->_cache->load($cacheKey);
    if ($cacheData) {
        $cacheData = str_replace(
            $this->_getSidPlaceholder($cacheKey),
            $this->_session->getSessionIdForHost($this->_getUrl('')),
            $cacheData
        );
    }
    return $cacheData;
}

/**
 * Save block HTML to cache storage
 */
protected function _saveCache($data)
{
    if (is_null($this->getCacheLifetime()) || !$this->_cacheState->isEnabled(self::CACHE_GROUP)) {
        return false;
    }
    $cacheKey = $this->getCacheKey();
    // Replace session IDs with placeholder before saving
    $data = str_replace(
        $this->_session->getSessionIdForHost($this->_getUrl('')),
        $this->_getSidPlaceholder($cacheKey),
        $data
    );
    $this->_cache->save(
        $data,
        $cacheKey,
        array_unique(array_merge($this->getCacheTags(), [self::CACHE_GROUP])),
        $this->getCacheLifetime()
    );
    return $this;
}
```

#### The Block Rendering Flow

```
toHtml() called
    |
    v
_loadCache() -- HIT? --> return cached HTML
    |
   MISS
    |
    v
_beforeToHtml() hooks
    |
    v
_toHtml() -- actual rendering
    |
    v
_saveCache($html)
    |
    v
return $html
```

**Exam focus:**
- `_loadCache()` / `_saveCache()` are called automatically by `toHtml()` — you rarely call them directly
- Session IDs are **replaced with placeholders** before saving to prevent session leakage in cached output
- To make a block cacheable, set `protected $_cacheLifetime = 3600;` (seconds)
- To make a block **uncacheable**, set `protected $_cacheLifetime = null;`

#### Custom Block with Caching

```php
<?php
namespace Vendor\Module\Block;

use Magento\Framework\View\Element\Template;

class MyBlock extends Template
{
    /**
     * Cache lifetime in seconds (null = no cache)
     */
    protected $_cacheLifetime = 3600;

    /**
     * Unique cache tags for this block type
     */
    protected $_cacheTags = ['mymodule_myblock'];

    /**
     * Cache key components — must uniquely identify this block's output
     */
    public function getCacheKeyInfo(): array
    {
        return [
            'VENDOR_MODULE_MYBLOCK',
            $this->_storeManager->getStore()->getId(),
            $this->_design->getDesignTheme()->getId(),
            $this->getData('product_id'),  // any dynamic data affecting output
        ];
    }

    /**
     * Add entity-specific tags for targeted invalidation
     */
    public function getCacheTags(): array
    {
        $tags = parent::getCacheTags();
        if ($productId = $this->getData('product_id')) {
            $tags[] = \Magento\Catalog\Model\Product::CACHE_TAG . '_' . $productId;
        }
        return $tags;
    }
}
```

---

## 4. Cache Types Reference

Magento 2 has **16 distinct cache types**, each serving a specific purpose. All are managed via `bin/magento cache:*` commands.

### Complete Cache Types Table

| Cache Type ID | Label | Description | Impact of Disabling |
|---|---|---|---|
| `config` | Configuration | Merged XML config from all `etc/*.xml` files | Every page re-reads all config XML |
| `layout` | Layouts | XML layout instructions (`.xml` layout files) | Layout rebuilt on every request |
| `block_html` | Blocks HTML output | Rendered HTML of individual blocks | All block HTML re-rendered |
| `collections` | Collections Data | DB collection query results | DB queried on every collection use |
| `reflection` | Reflection Data | PHP reflection data for API/DI | Reflection computed on every request |
| `db_ddl` | Database DDL operations | DB schema (table structure, indexes) | Schema re-fetched on every DB operation |
| `compiled_config` | Compiled Config | DI compilation output | DI resolved at runtime (very slow) |
| `eav` | EAV types and attributes | EAV attribute metadata | EAV metadata loaded from DB each time |
| `customer_notification` | Customer Notifications | Temporary customer notification state | Notifications re-checked every request |
| `config_integration` | Integrations Configuration | Merged integration config | Integration config re-loaded |
| `config_integration_api` | Integrations API config | Integration API resources config | API config re-loaded |
| `full_page` | Page Cache | Full HTML page responses | Every page fully rendered by PHP |
| `config_webservice` | Web Services Config | REST/SOAP API schema config | API schema re-generated |
| `translate` | Translations | Merged translation strings | Translation files re-parsed |
| `vertex` | Vertex Tax Data | (if Vertex module present) vertex tax data | Tax data re-fetched |
| `compiled_config` | Compiled Config | Output of `setup:di:compile` | Extremely slow runtime DI resolution |

**Exam focus:**
- `full_page` = FPC cache type ID (used in CLI commands)
- `block_html` and `full_page` are the two most performance-critical cache types
- `db_ddl` caches database table descriptions — critical for performance on large schemas
- `compiled_config` is populated by `bin/magento setup:di:compile` — not `cache:flush`
- `config` cache holds the merged result of all module `etc/*.xml` files

### Cache Type States

```bash
# Each cache type has one of these states:
# 1 = enabled  (actively caching)
# 0 = disabled (always misses, re-computes)
```

### Checking Cache Status

```bash
bin/magento cache:status

# Example output:
# Current status:
#                         config: 1
#                         layout: 1
#                     block_html: 1
#                    collections: 1
#                     reflection: 1
#                         db_ddl: 1
#               compiled_config: 1
#                            eav: 1
#          customer_notification: 1
#                      full_page: 1
#                      translate: 1
#             config_integration: 1
#         config_integration_api: 1
#               config_webservice: 1
```

---

## 5. Redis as Cache Backend vs Session Storage

Redis is used in **two distinct roles** in Magento — as a cache backend and as a session storage backend. These are configured separately.

### Redis for Cache Backend

```php
// app/etc/env.php
'cache' => [
    'frontend' => [
        'default' => [
            'id_prefix'   => '232_',   // prevents key collisions between instances
            'backend'     => 'Magento\\Framework\\Cache\\Backend\\Redis',
            'backend_options' => [
                'server'            => '127.0.0.1',
                'database'          => '0',
                'port'              => '6379',
                'password'          => '',
                'compress_data'     => '1',
                'compression_lib'   => 'gzip',  // gzip|lzf|snappy|zstd
            ],
        ],
        'page_cache' => [
            'id_prefix'   => '232_',
            'backend'     => 'Magento\\Framework\\Cache\\Backend\\Redis',
            'backend_options' => [
                'server'        => '127.0.0.1',
                'database'      => '1',   // DIFFERENT database number than default
                'port'          => '6379',
                'compress_data' => '0',   // FPC data already compressed; skip double-compression
            ],
        ],
    ],
],
```

### Redis for Session Storage

```php
// app/etc/env.php
'session' => [
    'save'    => 'redis',
    'redis'   => [
        'host'                    => '127.0.0.1',
        'port'                    => '6379',
        'password'                => '',
        'timeout'                 => '2.5',
        'persistent_identifier'   => '',
        'database'                => '2',   // DIFFERENT database number — critical!
        'compression_threshold'   => '2048',
        'compression_library'     => 'gzip',
        'log_level'               => '1',
        'max_concurrency'         => '6',
        'break_after_frontend'    => '5',
        'break_after_adminhtml'   => '30',
        'first_lifetime'          => '600',
        'bot_first_lifetime'      => '60',
        'bot_lifetime'            => '7200',
        'disable_locking'         => '0',
        'min_lifetime'            => '60',
        'max_lifetime'            => '2592000',
    ],
],
```

### Key Differences: Cache Backend vs Session Storage

| Aspect | Redis Cache Backend | Redis Session Storage |
|---|---|---|
| **Data type** | Serialized PHP objects/arrays | User session data |
| **Eviction policy** | `allkeys-lru` recommended | `noeviction` recommended |
| **Database number** | 0 (default), 1 (FPC) | 2 (or higher) |
| **Persistence** | Not required (regenerable) | Required (AOF/RDB) |
| **Locking** | None needed | Advisory locking to prevent race |
| **Flush impact** | Regenerated automatically | **Users logged out** |
| **Class** | `Magento\Framework\Cache\Backend\Redis` | `Magento\Framework\Session\SaveHandler\Redis` |
| **Config key** | `cache.frontend` in env.php | `session.save = redis` in env.php |

**Exam focus:**
- Redis database **0** = default cache, **1** = page_cache, **2** = sessions — always use separate DBs
- Flushing cache Redis DB = performance degradation (re-build); flushing session Redis DB = **all users logged out**
- Session Redis should use `noeviction` policy (never auto-evict sessions)
- Cache Redis should use `allkeys-lru` (evict least-recently-used when memory full)
- `max_concurrency` in session config prevents session locking issues under high load
- The `cm_redis` / `Credis` library is the underlying PHP client used by Magento's Redis backend

### L2 Redis Cache (Magento 2.4+)

```php
// app/etc/env.php — L2 cache with Redis cluster support
'cache' => [
    'frontend' => [
        'default' => [
            'backend' => 'Magento\\Framework\\Cache\\Backend\\RemoteSynchronizedCache',
            'backend_options' => [
                'remote_backend'         => 'Magento\\Framework\\Cache\\Backend\\Redis',
                'remote_backend_options' => [
                    'server'   => 'redis-host',
                    'database' => '0',
                    'port'     => 6379,
                ],
                'local_backend'         => 'Cm_Cache_Backend_File',
                'local_backend_options' => [
                    'cache_dir' => '/dev/shm/magento/cache/',  // RAM disk
                ],
            ],
            'id_prefix' => 'main_',
        ],
    ],
],
```

---

## 6. Cache Invalidation Strategies

Magento provides multiple strategies for removing stale cache data, each with different scope and performance implications.

### Strategy 1: Tag-Based Invalidation (Surgical)

The **most targeted** approach — invalidates only cache entries associated with specific tags.

```bash
# CLI: clean by cache type (uses tags internally)
bin/magento cache:clean block_html
bin/magento cache:clean full_page
bin/magento cache:clean config layout block_html  # multiple types
```

```php
// PHP: Clean by specific tags
/** @var \Magento\Framework\App\CacheInterface $cache */
$cache->clean([\Magento\Catalog\Model\Product::CACHE_TAG . '_42']);

// Clean all entries tagged with a product's tag
$product->cleanModelCache();  // calls clean(['cat_p_42'])

// Using the cache type manager
/** @var \Magento\Framework\App\Cache\TypeListInterface $cacheTypeList */
$cacheTypeList->cleanType('block_html');
$cacheTypeList->invalidate('full_page');  // marks as invalid, cleaned on next request
```

#### Invalidation vs Cleaning

```
invalidate('full_page')
  --> Marks cache type as INVALID in the DB
  --> Does NOT immediately flush Redis
  --> Cache is cleaned on next admin page load or cron run

clean('full_page')
  --> Immediately removes entries from storage
  --> Tags-based: only removes entries with matching tags
```

**Exam focus:**
- `invalidate()` is **lazy** — marks the type, cleaned lazily; used internally after saving entities
- `clean()` is **immediate** — actively removes data from the cache backend
- Event observers call `cacheTypeList->invalidate()` — e.g., saving a product invalidates `full_page` and `block_html`

### Strategy 2: Clean All (by Type)

```bash
# Clean all entries for specific cache types
bin/magento cache:clean

# Clean specific types
bin/magento cache:clean config
bin/magento cache:clean layout block_html full_page

# This uses the cache type's associated tags to clean entries
# More targeted than flush — only removes entries for those types
```

### Strategy 3: Flush (Nuclear Option)

```bash
# Flush ALL cache storage (deletes everything in Redis/File cache)
bin/magento cache:flush

# Flush specific cache storages
bin/magento cache:flush config full_page
```

#### Clean vs Flush Comparison

| Aspect | `cache:clean` | `cache:flush` |
|---|---|---|
| Scope | Removes entries **by cache type tags** | Removes **all entries** from storage backend |
| Other systems | Only affects Magento cache entries | Can affect **other applications** sharing same Redis |
| Safety | Safe — only touches Magento data | Risky on shared Redis instances |
| Speed | Slightly slower (tag matching) | Faster (bulk delete) |
| Use case | Regular cache management | Emergency / full reset |

**Exam focus:**
- `cache:clean` = removes entries *for Magento cache types* only (tag-based)
- `cache:flush` = drops *all* data in the underlying storage — dangerous on shared Redis
- In production, prefer `cache:clean [type]` over `cache:flush`

### Strategy 4: Varnish-Specific Invalidation

When using Varnish FPC, Magento sends **HTTP BAN/PURGE requests** to Varnish to invalidate cached pages.

```php
// Magento\CacheInvalidate\Model\PurgeCache
// Sends PURGE request to Varnish when cache is invalidated

// The request contains:
// X-Magento-Tags-Pattern: (^|,)cat_p_42(,|$)
// This is a regex that Varnish matches against stored X-Magento-Tags
```

```vcl
// In the generated VCL:
sub vcl_recv {
    if (req.method == "PURGE") {
        if (!client.ip ~ purge) {
            return (synth(405, "Method not allowed"));
        }
        ban("obj.http.X-Magento-Tags ~ " + req.http.X-Magento-Tags-Pattern);
        return (synth(200, "Purged."));
    }
}
```

**Exam focus:**
- Varnish uses **BAN** (not traditional PURGE) for tag-based invalidation
- The `purge` ACL in VCL must include all Magento application server IPs
- `Magento_CacheInvalidate` module handles sending purge requests to Varnish
- Varnish `ban()` uses regex matching on stored response headers

### Invalidation Triggers (Automatic)

```php
// Common events that trigger cache invalidation:

// Product save -> invalidates: full_page, block_html (tags: cat_p, cat_p_{id})
// Category save -> invalidates: full_page, block_html (tags: cat_c, cat_c_{id})
// CMS page save -> invalidates: full_page, block_html (tags: cms_p, cms_p_{id})
// Config save -> invalidates: config, full_page, block_html
// Theme change -> invalidates: layout, block_html, full_page
```

### Cache State Management

```bash
# Enable/disable cache types
bin/magento cache:enable full_page
bin/magento cache:disable block_html layout
bin/magento cache:enable  # enable all
bin/magento cache:disable # disable all
```

```php
// Cache state stored in: var/cache/mage-cache-storage/
// Or in DB table: core_config_data (key: system/cache/*)
// Checked via: Magento\Framework\App\Cache\StateInterface::isEnabled()
```

---

## 7. CLI Practice Reference

### Essential Cache Commands

```bash
# ---- STATUS ----
bin/magento cache:status
# Shows enabled (1) / disabled (0) for each cache type

# ---- CLEAN (tag-based, Magento-only data) ----
bin/magento cache:clean
bin/magento cache:clean config
bin/magento cache:clean full_page block_html layout

# ---- FLUSH (all data in storage) ----
bin/magento cache:flush
bin/magento cache:flush full_page

# ---- ENABLE / DISABLE ----
bin/magento cache:enable full_page
bin/magento cache:disable block_html
bin/magento cache:enable full_page block_html config

# ---- WARM UP FPC (EE only) ----
# No built-in warmup CLI — use third-party or Varnish sitemap crawlers

# ---- INSPECT REDIS ----
redis-cli -n 0 keys "*"           # list all cache keys (db 0 = default cache)
redis-cli -n 1 keys "*"           # list FPC keys (db 1 = page_cache)
redis-cli -n 0 info memory        # check memory usage
redis-cli -n 0 dbsize             # count keys

# ---- VARNISH DEBUG ----
curl -I -H "X-Magento-Cache-Debug: 1" https://mysite.com/
# Look for: X-Cache: HIT or X-Cache: MISS in response headers

varnishlog -g request -q "ReqURL eq '/'"   # live Varnish request logging
varnishstat                                 # Varnish statistics
```

### FPC Behavior Testing

```bash
# Test built-in FPC (CE) behavior:
bin/magento cache:enable full_page
bin/magento cache:disable full_page

# Check if a page is cached (built-in FPC):
curl -I https://mysite.com/some-product.html
# Look for: X-Magento-Cache-Control: max-age=86400, public, s-maxage=86400

# Simulate Varnish-less environment:
bin/magento config:set system/full_page_cache/caching_application 1  # built-in

# Switch to Varnish:
bin/magento config:set system/full_page_cache/caching_application 2  # varnish
```

---

## 8. Architecture Diagrams

### Full Caching Architecture

```
+--------------------+
|     Browser        |
+--------------------+
         |
         | HTTP Request
         v
+--------------------+      Cache HIT
|  Varnish (EE)      |-------------------> Response (no PHP)
|  Port 80           |
+--------------------+
         |
         | Cache MISS (forward)
         v
+--------------------+
|  nginx / Apache    |
|  Port 8080         |
+--------------------+
         |
         v
+--------------------+
|  PHP-FPM           |
|  Magento App       |
+--------------------+
         |
    +----+----+
    |         |
    v         v
+--------+ +--------+
| Redis  | | Redis  |
| DB:0   | | DB:1   |
|(cache) | |(FPC)   |
+--------+ +--------+
    |
    v
+--------+
| Redis  |
| DB:2   |
|(sess.) |
+--------+
         |
         v
+--------------------+
|  MySQL / MariaDB   |
+--------------------+
```

### Block Cache Lifecycle

```
toHtml() called
    |
    v
getCacheLifetime() == null?
    |
   YES --> skip cache, render directly
    |
   NO
    v
_loadCache()
    |
   HIT ---------> return cached HTML
    |
  MISS
    v
_toHtml() -- render block
    |
    v
_saveCache(html)
    | store with:
    | - key: md5(getCacheKeyInfo())
    | - tags: getCacheTags()
    | - lifetime: getCacheLifetime()
    v
return HTML
```

### Cache Invalidation Flow

```
Entity Saved (e.g. Product)
    |
    v
Observer: Magento\Catalog\Observer\InvalidateCacheObserver
    |
    v
CacheTypeList->invalidate(['full_page', 'block_html'])
    |
    v
    +-- If Varnish enabled:
    |       PurgeCache->sendPurgeRequest()
    |       --> HTTP PURGE to Varnish with X-Magento-Tags-Pattern
    |       --> Varnish ban() matching entries removed
    |
    +-- If built-in FPC:
            Cache marked INVALID in DB
            --> Cleaned on next admin request / cron
            --> Or: cache:clean full_page
```

---

## Quick-Reference Checklist

### Full Page Cache (FPC)

- [ ] FPC stores the complete HTTP response for a URL
- [ ] Built-in FPC (CE & EE): PHP-based, `caching_application = 1`
- [ ] Varnish FPC (EE recommended): reverse proxy, `caching_application = 2`
- [ ] Varnish sits **in front of** nginx/Apache (port 80), nginx behind (port 8080)
- [ ] `X-Magento-Tags` header carries cache tags on responses to Varnish
- [ ] `X-Magento-Cache-Debug: 1` header triggers HIT/MISS debug output
- [ ] Varnish invalidation uses HTTP `PURGE` + `X-Magento-Tags-Pattern` regex ban
- [ ] `bin/magento varnish:vcl:generate` creates the VCL file
- [ ] `bin/magento config:set system/full_page_cache/caching_application 2` enables Varnish
- [ ] `cacheable="false"` on **any block** disables FPC for the **entire page**

### Hole-Punching & ESI

- [ ] Hole-punching serves cached pages while loading dynamic content separately
- [ ] Private content sections defined in `etc/frontend/sections.xml`
- [ ] Private content stored in browser `localStorage` via Magento JS components
- [ ] `X-Magento-Vary` cookie creates separate cache entries per user context
- [ ] ESI = Edge Side Includes — **Varnish only**, not built-in FPC
- [ ] ESI blocks marked with `ttl` attribute in layout XML
- [ ] ESI blocks are cached independently with their own TTL
- [ ] Without Varnish, blocks with `ttl` are rendered inline (graceful fallback)

### Block Cache

- [ ] Cache tags enable **batch invalidation** of related cached items
- [ ] Entity-specific tag format: `CACHE_TAG . '_' . entity_id` (e.g., `cat_p_42`)
- [ ] Cache identifier = `md5(implode('|', getCacheKeyInfo()))`
- [ ] Always include store ID and theme ID in `getCacheKeyInfo()`
- [ ] `cache_lifetime = null` → no caching; `0` → cache forever; `3600` → 1 hour
- [ ] `_loadCache()` and `_saveCache()` called automatically by `toHtml()`
- [ ] Session IDs replaced with placeholders before saving to cache
- [ ] `CACHE_GROUP` constant in block class controls which cache type is used

### Cache Types

- [ ] 14+ cache types: `config`, `layout`, `block_html`, `collections`, `reflection`, `db_ddl`, `compiled_config`, `eav`, `customer_notification`, `full_page`, `translate`, `config_integration`, `config_integration_api`, `config_webservice`
- [ ] `full_page` = FPC cache type ID used in CLI commands
- [ ] `compiled_config` populated by `setup:di:compile`, not just `cache:flush`
- [ ] `db_ddl` = database schema cache — impacts all DB operations when disabled
- [ ] `eav` = attribute metadata — impacts all EAV entity operations when disabled

### Redis Configuration

- [ ] Redis DB **0** = default cache; DB **1** = page_cache; DB **2** = sessions
- [ ] Always use **separate Redis databases** (or separate instances) per role
- [ ] `compress_data = 0` for page_cache (pages already gzip-compressed)
- [ ] Cache Redis eviction: `allkeys-lru` (auto-evict old entries)
- [ ] Session Redis eviction: `noeviction` (never auto-evict sessions)
- [ ] Flushing session Redis = **all users logged out**
- [ ] L2 cache = `RemoteSynchronizedCache` (Redis + local RAM disk)
- [ ] `id_prefix` in env.php prevents key collisions between multiple Magento instances

### Cache Invalidation

- [ ] `cache:clean` = remove entries by **Magento cache type tags only** (safe, Magento-specific)
- [ ] `cache:flush` = remove **all entries** from storage backend (dangerous on shared Redis)
- [ ] `invalidate()` = **lazy** — marks type invalid, cleaned later
- [ ] `clean()` = **immediate** — removes matching entries from storage now
- [ ] `cache:clean [type]` → preferred for production cache management
- [ ] `cache:flush` → use only for emergency resets or dedicated Magento Redis
- [ ] Product/category save → auto-invalidates `full_page`, `block_html`
- [ ] Config save → auto-invalidates `config`, `full_page`, `block_html`
- [ ] `Magento_CacheInvalidate` module handles Varnish purge requests

### CLI Commands

- [ ] `bin/magento cache:status` — show enabled/disabled state of all cache types
- [ ] `bin/magento cache:enable [type]` — enable specific cache type(s)
- [ ] `bin/magento cache:disable [type]` — disable specific cache type(s)
- [ ] `bin/magento cache:clean [type]` — clean entries for cache type(s)
- [ ] `bin/magento cache:flush [type]` — flush cache storage
- [ ] `bin/magento varnish:vcl:generate` — generate VCL for Varnish
