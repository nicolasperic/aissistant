# Magento 2 Architect Exam — Practice Test #5 & Final Cheat Sheet

## Table of Contents

1. [How to Use These Notes](#1-how-to-use-these-notes)
2. [Plugin Execution Order — Complete Reference](#2-plugin-execution-order--complete-reference)
3. [DI XML Scopes — Complete Reference](#3-di-xml-scopes--complete-reference)
4. [EAV vs Extension Attributes — Decision Matrix](#4-eav-vs-extension-attributes--decision-matrix)
5. [Cache Types + Invalidation Triggers](#5-cache-types--invalidation-triggers)
6. [Cloud Build vs Deploy Phase Checklist](#6-cloud-build-vs-deploy-phase-checklist)
7. [MSI — Key Tables + Reservation Pattern](#7-msi--key-tables--reservation-pattern)
8. [GraphQL — GET vs POST Cacheability](#8-graphql--get-vs-post-cacheability)
9. [Price Waterfall Order](#9-price-waterfall-order)
10. [Order State Machine](#10-order-state-machine)
11. [Test Type Selection Criteria](#11-test-type-selection-criteria)
12. [EE-Only Features Quick List](#12-ee-only-features-quick-list)
13. [Score Trend Tracker](#13-score-trend-tracker)
14. [Architectural Decision-Making Framework](#14-architectural-decision-making-framework)
15. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. How to Use These Notes

These notes are designed for **two modes**:

- **Deep review:** Read section-by-section before the exam window.
- **Final 30-minute scan:** Use the tables, callout bullets, and Quick-Reference Checklist at the end.

> **Architect exam mindset:** Every question has a "technically works" answer and an "architecturally correct" answer. The exam tests *why* — upgrade safety, performance at scale, separation of concerns, and Magento's own extension guidelines.

---

## 2. Plugin Execution Order — Complete Reference

### 2.1 The Three Plugin Types

| Plugin Type | Method Prefix | Receives Original Args? | Can Change Return Value? | Can Prevent Execution? |
|-------------|---------------|------------------------|--------------------------|------------------------|
| `before`    | `before{MethodName}` | Yes (by reference) | No (modifies inputs only) | No |
| `around`    | `around{MethodName}` | Yes + `callable $proceed` | Yes | **Yes** (skip `$proceed`) |
| `after`     | `after{MethodName}` | Return value of proceed | **Yes** | No |

**Exam focus:** `before` plugins receive arguments as individual parameters and return a modified array of arguments (or `null` to leave unchanged). `after` plugins receive the *result* of the original method, not the original arguments.

**Exam focus:** `around` plugins that skip `$proceed()` break the entire plugin chain for all lower-priority plugins — this is architecturally dangerous and should be avoided unless absolutely necessary.

### 2.2 Full Execution Flow Diagram

```
Plugin A (sortOrder=10)    Plugin B (sortOrder=20)    Original Method
        |                          |                          |
before_A -----> before_B --------> |                          |
                                   |                          |
around_A (calls $proceed) -------> around_B (calls $proceed) -> [execute]
                                                                    |
                           <--------- after_B <---------- after_A <-+
```

**Reading the flow:**

```
Execution order (left to right = time):
1. before_A   (sortOrder=10)
2. before_B   (sortOrder=20)
3. around_A   (outer half, sortOrder=10)
4. around_B   (outer half, sortOrder=20)
5. [ORIGINAL METHOD EXECUTES]
6. around_B   (inner half, sortOrder=20)  <- after $proceed returns
7. around_A   (inner half, sortOrder=10)  <- after inner around_B returns
8. after_B    (sortOrder=20)
9. after_A    (sortOrder=10)
```

> Note: `after` plugins fire in **reverse** sortOrder. The last `before`/`around` to run is the first `after` to fire.

### 2.3 sortOrder + Alphabetical Tiebreaker

```
Lower sortOrder number = runs EARLIER for before/around
Lower sortOrder number = runs LATER  for after (reversed)

Tiebreaker when sortOrder is equal:
  -> Alphabetical order by module name (A before B)
  -> before/around: A runs before B
  -> after:         B runs before A (still reversed)
```

**Exam focus:** Default `sortOrder` is `10` if not specified. Always set explicit sortOrder in real code to avoid alphabetical tiebreaker surprises.

### 2.4 Plugin Limitations (What You Cannot Plugin)

```
CANNOT be intercepted:
- final methods
- final classes
- static methods
- __construct()
- Virtual types
- Objects instantiated without ObjectManager (new keyword)
- Non-public methods
```

**Exam focus:** If a question asks "how do you intercept a final method" — you cannot use plugins. You must use a **preference** (full class rewrite) or propose the original code be refactored. Preferences are the last resort.

### 2.5 Declaration Example

```xml
<!-- di.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
    <type name="Magento\Catalog\Model\Product">
        <plugin name="vendor_module_product_plugin"
                type="Vendor\Module\Plugin\ProductPlugin"
                disabled="false"
                sortOrder="20"/>
    </type>
</config>
```

```php
<?php
namespace Vendor\Module\Plugin;

class ProductPlugin
{
    // before: return array of modified args, or null
    public function beforeSetName(
        \Magento\Catalog\Model\Product $subject,
        string $name
    ): ?array {
        return [strtoupper($name)]; // modifies input
    }

    // around: must call $proceed or chain breaks
    public function aroundGetName(
        \Magento\Catalog\Model\Product $subject,
        callable $proceed
    ): string {
        $result = $proceed(); // always call this
        return 'PREFIX_' . $result;
    }

    // after: receives $result (return value), not original args
    public function afterGetName(
        \Magento\Catalog\Model\Product $subject,
        string $result
    ): string {
        return $result . '_SUFFIX';
    }
}
```

---

## 3. DI XML Scopes — Complete Reference

### 3.1 Scope Hierarchy

```
global (app/etc/di.xml)
  |
  +-- frontend  (Vendor/Module/etc/frontend/di.xml)
  |
  +-- adminhtml (Vendor/Module/etc/adminhtml/di.xml)
  |
  +-- webapi_rest   (Vendor/Module/etc/webapi_rest/di.xml)
  |
  +-- webapi_soap   (Vendor/Module/etc/webapi_soap/di.xml)
  |
  +-- graphql       (Vendor/Module/etc/graphql/di.xml)
  |
  +-- crontab       (Vendor/Module/etc/crontab/di.xml)
  |
  +-- doc           (Vendor/Module/etc/doc/di.xml)
```

**Exam focus:** Area-specific `di.xml` **merges with and overrides** global scope. A preference declared in `frontend/di.xml` only applies to frontend requests — the same interface uses the global implementation everywhere else.

### 3.2 Scope Decision Table

| Where to put it | When to use |
|-----------------|-------------|
| `etc/di.xml` | Applies everywhere — default implementations, shared services |
| `etc/frontend/di.xml` | Frontend-only overrides (e.g., customer session adapter) |
| `etc/adminhtml/di.xml` | Admin-only overrides (e.g., admin-specific validators) |
| `etc/webapi_rest/di.xml` | REST API only — e.g., serializers, auth handlers |
| `etc/graphql/di.xml` | GraphQL area — e.g., custom resolvers scope |
| `etc/crontab/di.xml` | Cron context — e.g., memory-optimized implementations |

### 3.3 Key DI XML Constructs

```xml
<!-- Preference: full class substitution (last resort) -->
<preference for="Magento\Catalog\Api\ProductRepositoryInterface"
            type="Vendor\Module\Model\ProductRepository"/>

<!-- Virtual Type: new named type from existing class, no PHP file needed -->
<virtualType name="Vendor\Module\Model\SpecialLogger"
             type="Magento\Framework\Logger\Monolog">
    <arguments>
        <argument name="name" xsi:type="string">special</argument>
    </arguments>
</virtualType>

<!-- Type configuration: inject arguments into a specific class -->
<type name="Vendor\Module\Model\MyService">
    <arguments>
        <argument name="logger" xsi:type="object">
            Vendor\Module\Model\SpecialLogger
        </argument>
        <argument name="config" xsi:type="array">
            <item name="key" xsi:type="string">value</item>
        </argument>
    </arguments>
</type>
```

**Exam focus:** Virtual types are **compile-time** constructs. They do not create a new PHP class file — they create a named configuration variant of an existing class. You cannot write `new VirtualTypeName()` in PHP.

**Exam focus:** Preferences conflict when two modules declare a preference for the same interface — the last one in load order wins. This is why **plugins are always preferred** over preferences for behavioral modification.

### 3.4 Shared vs Non-Shared (Singleton vs Prototype)

```xml
<!-- Shared = singleton (default for most services) -->
<type name="Vendor\Module\Model\MyService" shared="true"/>

<!-- Non-shared = new instance every injection -->
<type name="Vendor\Module\Model\MyDataObject" shared="false"/>
```

**Exam focus:** Models that hold state (shopping cart items, search results) should be `shared="false"` or created via Factory. Services (stateless) should be `shared="true"` (singleton).

---

## 4. EAV vs Extension Attributes — Decision Matrix

### 4.1 Quick Decision Flowchart

```
Is the attribute for an EAV entity (product/category/customer/order)?
  |
  YES --> Is it a simple scalar value (string/int/bool/decimal)?
  |         |
  |         YES --> Is it needed in layered navigation or attribute sets?
  |         |         |
  |         |         YES --> Use EAV attribute
  |         |         NO  --> Consider extension attributes (simpler)
  |         |
  |         NO (complex object/array) --> Use Extension Attributes
  |
  NO  --> Is it a non-EAV entity (Quote, Order, Invoice, etc.)?
            |
            YES --> Use Extension Attributes
```

### 4.2 Comparison Table

| Criteria | EAV Attribute | Extension Attributes |
|----------|---------------|---------------------|
| **Storage** | `eav_attribute` + entity value tables (`catalog_product_entity_varchar`, etc.) | Separate JOIN table or serialized in existing column |
| **Performance** | Slower — multiple table JOINs per load | Faster — targeted queries, explicit JOINs |
| **Admin UI** | Built-in attribute management UI | Manual UI development required |
| **Layered Navigation** | Yes (filterable attributes) | No (not natively) |
| **Attribute Sets** | Yes (can be in sets/groups) | No concept |
| **API Exposure** | Via `custom_attributes` array in REST/GraphQL | Via `extension_attributes` object in REST/GraphQL |
| **Code to add** | `InstallData`/`DataPatch` + `setup_resources` | `extension_attributes.xml` + plugin on load/save |
| **Searchable** | Yes (via search engine config) | Only if manually indexed |
| **Use when** | Merchant-configurable attributes, layered nav, attribute sets | Developer-only attributes, complex data, non-EAV entities |

**Exam focus:** Extension attributes are declared in `extension_attributes.xml` and backed by a `ExtensionInterface` auto-generated by `bin/magento setup:di:compile`. You must implement the persistence yourself (plugin on repository load/save).

**Exam focus:** `custom_attributes` in the REST API = EAV attributes. `extension_attributes` = Extension Attributes. These are different structures in the API response.

### 4.3 Extension Attributes Declaration

```xml
<!-- etc/extension_attributes.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Api/etc/extension_attributes.xsd">
    <extension_attributes for="Magento\Catalog\Api\Data\ProductInterface">
        <attribute code="vendor_custom_data" type="string"/>
    </extension_attributes>
    <!-- For complex types -->
    <extension_attributes for="Magento\Sales\Api\Data\OrderInterface">
        <attribute code="vendor_shipment_data"
                   type="Vendor\Module\Api\Data\ShipmentDataInterface"/>
    </extension_attributes>
</config>
```

---

## 5. Cache Types + Invalidation Triggers

### 5.1 Full Cache Type Reference Table

| Cache Type Code | Label | What It Caches | Invalidated By |
|-----------------|-------|----------------|----------------|
| `config` | Configuration | Merged XML config (di.xml, config.xml, etc.) | `bin/magento cache:clean config`, deploy |
| `layout` | Layouts | XML layout merge results | Layout XML changes, deploy |
| `block_html` | Blocks HTML output | Rendered block HTML | Block/template changes, `cache:clean block_html` |
| `collections` | Collections Data | DB query result sets | Model save/delete (via resource model) |
| `reflection` | Reflection | PHP class reflection data | `setup:di:compile` |
| `db_ddl` | Database DDL | Table schema, column metadata | `setup:upgrade` |
| `compiled_config` | Compiled Config | DI compiled config | `setup:di:compile` |
| `eav` | EAV Types and Attributes | EAV attribute metadata | Attribute save/delete |
| `customer_notification` | Customer Notification | Transient notification flags | On notification read |
| `config_integration` | Integrations Config | OAuth integration config | Integration save |
| `config_integration_api` | Integrations API config | API resource ACL for integrations | Integration save |
| `full_page` | Page Cache | Full rendered pages (FPC) | Any product/category/CMS change |
| `config_webservice` | Web Services Config | REST/SOAP API schema | `webapi.xml` changes |
| `translate` | Translations | i18n translation data | Translation CSV changes |
| `vertex` (EE) | Vertex Tax | Tax calculation cache | Config save |

**Exam focus:** `full_page` cache (FPC) is invalidated by **any** entity save that touches a page's Varnish tags. Magento uses ESI (Edge Side Includes) and cache tags (`X-Magento-Tags` header) to enable granular purging.

**Exam focus:** `collections` cache is **automatically** invalidated when a model is saved or deleted via the resource model — you don't need to manually clean it for standard CRUD operations.

### 5.2 Cache Tags Flow (FPC Invalidation)

```
Product entity saved
        |
        v
Magento\Framework\Model\AbstractModel::afterSave()
        |
        v
CacheContext::registerEntities(['catalog_product'], [productId])
        |
        v
Flush cache tags: "cat_p_{productId}"
        |
        v
Varnish/built-in FPC purges pages tagged with "cat_p_{productId}"
```

**Exam focus:** Cache tags are the **scalable** invalidation mechanism. Cleaning entire cache types is a brute-force approach. For production, implement proper cache tag assignment in custom entities.

### 5.3 Cache Storage Backends

| Backend | Use Case | Notes |
|---------|----------|-------|
| `Cm_Cache_Backend_Redis` | Production — shared cache | Supports tag-based flush, TTL |
| `Cm_Cache_Backend_File` | Development only | Slow at scale, no clustering |
| `Magento\Framework\Cache\Backend\Memcached` | Legacy | Redis preferred |
| `Magento\Framework\Cache\Backend\Database` | Not recommended | Table locking issues |

---

## 6. Cloud Build vs Deploy Phase Checklist

### 6.1 Phase Overview

```
Source code pushed
        |
        v
+--[ BUILD PHASE ]---------------------------+
| - No services available (no DB, no Redis) |
| - Read-only filesystem after this point   |
| - Composer install                        |
| - Code generation (setup:di:compile)      |
| - Static content deploy (if SCD_ON_DEMAND=false) |
| - Output: build artifact (slug)           |
+--------------------------------------------+
        |
        v
+--[ DEPLOY PHASE ]--------------------------+
| - Services available (DB, Redis, ES)      |
| - Site in maintenance mode                |
| - Mount writable directories              |
| - setup:upgrade (schema + data patches)   |
| - Static content deploy (if deferred)     |
| - Cache warm                              |
+--------------------------------------------+
        |
        v
+--[ POST-DEPLOY PHASE ]---------------------+
| - Site is live                            |
| - Smoke tests                             |
| - Cache warming (crawler)                 |
| - Notifications                           |
+--------------------------------------------+
```

### 6.2 Critical Checklist — Build Phase

- [ ] `composer install` — no network calls to services
- [ ] `php ./vendor/bin/ece-tools build:generate` — generates `app/etc/config.php` if missing
- [ ] `php ./vendor/bin/ece-tools build:transfer` — moves generated files
- [ ] `bin/magento setup:di:compile` — DI compilation, factory/proxy generation
- [ ] Static content deploy (SCD) — **if** `SKIP_SCD=false` and `SCD_ON_DEMAND=false`
- [ ] No database connection available — any code run here must not touch DB
- [ ] No writable mounts at build time

**Exam focus:** If a deployment pipeline fails at build time with "DB connection refused" — the root cause is code (e.g., a plugin or observer) that attempts a DB query during DI compilation or SCD. This is an architectural defect.

### 6.3 Critical Checklist — Deploy Phase

- [ ] Mount writable filesystems (`var/`, `pub/media/`, `pub/static/` if SCD deferred)
- [ ] Set maintenance mode ON
- [ ] `bin/magento setup:upgrade --keep-generated` (or without flag for clean compile)
- [ ] `bin/magento setup:static-content:deploy` (if deferred from build)
- [ ] `bin/magento cache:flush`
- [ ] Set maintenance mode OFF
- [ ] Database IS available
- [ ] Redis/Elasticsearch ARE available

**Exam focus:** `setup:upgrade` runs **schema patches** (`InstallSchema`, `UpgradeSchema`, `SchemaPatches`) and **data patches** (`DataPatch`). In Cloud, this runs in the deploy phase, not build phase, because it requires DB access.

### 6.4 SCD Strategy Comparison

| Strategy | SCD Timing | Downtime Impact | Best For |
|----------|-----------|-----------------|---------|
| `SCD_ON_DEMAND=false` (default) | Build phase | Shorter deploy = less downtime | Stable stores |
| `SCD_ON_DEMAND=true` | First request | Zero additional deploy time | Dev/staging |
| Deferred (deploy phase) | Deploy phase | Longer deploy window | Rollback safety |

**Exam focus:** Moving SCD to **build phase** reduces deployment downtime because static files are ready before the deploy phase starts. This is the recommended Cloud production strategy.

### 6.5 `.magento.env.yaml` Key Variables

```yaml
stage:
  build:
    SCD_STRATEGY: compact        # compact|quick|standard
    SCD_ON_DEMAND: false
    SKIP_SCD: false
    ERROR_REPORT_DIR_NESTING_LEVEL: 1
  deploy:
    CACHE_CONFIGURATION:
      frontend:
        default:
          backend: Cm_Cache_Backend_Redis
    SEARCH_CONFIGURATION:
      engine: elasticsearch7
    UPDATE_URLS: false           # don't rewrite base URLs on deploy
  post_deploy:
    WARM_UP_PAGES:
      - "index.php/"
      - "index.php/women/tops-women.html"
```

---

## 7. MSI — Key Tables + Reservation Pattern

### 7.1 MSI Architecture Overview

```
Stock (logical grouping)
  |
  +-- linked to --> Sales Channel (website)
  |
  +-- linked to --> Source (physical location)
                      |
                      +-- Source Item (sku + qty at source)
```

### 7.2 Key MSI Database Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `inventory_source` | Physical inventory locations | `source_code`, `name`, `enabled`, `latitude`, `longitude` |
| `inventory_stock` | Logical stocks | `stock_id`, `name` |
| `inventory_source_stock_link` | Many-to-many: source <-> stock | `stock_id`, `source_code`, `priority` |
| `inventory_stock_sales_channel` | Stock assigned to sales channel | `type`, `code`, `stock_id` |
| `inventory_source_item` | QTY per SKU per source | `source_code`, `sku`, `quantity`, `status` |
| `inventory_reservation` | **Append-only** compensation log | `reservation_id`, `stock_id`, `sku`, `quantity`, `metadata` |
| `inventory_shipment_source` | Source selected for shipment | `shipment_id`, `source_code` |
| `cataloginventory_stock_item` | Legacy single-source table | `item_id`, `product_id`, `qty` (still used for non-MSI paths) |

**Exam focus:** `inventory_reservation` is **append-only** — rows are never updated or deleted. Compensation is done by inserting a row with the opposite sign (negative qty to reserve, positive qty to release). This is an **event sourcing / CQRS** pattern for inventory.

### 7.3 Reservation Pattern Deep Dive

```
Customer places order for 2x SKU-ABC on Stock #1:
  INSERT: reservation_id=1, stock_id=1, sku='SKU-ABC', quantity=-2, metadata='order:1001'

Saleable Qty = Source Item Qty SUM - SUM(reservations for this stock+sku)

Customer cancels order:
  INSERT: reservation_id=2, stock_id=1, sku='SKU-ABC', quantity=+2, metadata='order:1001:canceled'

Order ships, deduct from source:
  UPDATE inventory_source_item SET quantity = quantity - 2 WHERE source_code='default' AND sku='SKU-ABC'
  INSERT: reservation_id=3, stock_id=1, sku='SKU-ABC', quantity=+2, metadata='order:1001:shipped'
  (compensation reservation — cleans out the original reservation)
```

**Exam focus:** The reservation table grows indefinitely. Magento provides `inventory:reservations:cleanup` command to archive compensated reservation pairs. In high-volume stores, this table management is a performance concern.

### 7.4 MSI Algorithms

| Algorithm | Interface | Description |
|-----------|-----------|-------------|
| Source Selection | `SourceSelectionServiceInterface` | Selects which sources to fulfill from |
| SSA Priority | `PriorityBasedAlgorithm` | Uses `priority` from `inventory_source_stock_link` |
| SSA Distance | `DistanceBasedAlgorithm` (EE) | Fulfills from closest source to shipping address |
| Saleable Qty | `GetProductSalableQtyInterface` | Returns qty - reservations |

---

## 8. GraphQL — GET vs POST Cacheability

### 8.1 The Core Rule

```
GET  request  --> Cacheable by Varnish/CDN/FPC
POST request  --> NOT cacheable (mutations + complex queries)

Magento GraphQL:
  - Queries CAN be sent as GET (cacheable)
  - Mutations MUST be POST (never cacheable)
  - Customer-specific queries: include Authorization header -> NOT cached
```

### 8.2 GET Query Cacheability Requirements

For a GraphQL query to be served via GET and cached:

```
Requirements (ALL must be true):
  1. HTTP method = GET
  2. No Authorization header (anonymous/guest)
  3. Query must be marked @cache in schema (or default cacheable)
  4. Response must include X-Magento-Cache-Id header
  5. Varnish VCL must be configured for GraphQL
```

**Exam focus:** The `X-Magento-Cache-Id` header is computed from: store code + currency + customer group (guest) + HTTP Vary headers. This allows Varnish to cache different responses for different store views.

### 8.3 Schema Cacheability Declaration

```graphql
type Query {
    products(
        search: String
        filter: ProductAttributeFilterInput
        sort: ProductAttributeSortInput
        pageSize: Int = 20
        currentPage: Int = 1
    ): Products @cache(cacheIdentity: "Magento\\CatalogGraphQl\\Model\\Resolver\\Cache\\ProductsQuery")
    
    cart(cart_id: String!): Cart  # NOT cached - requires cart context
    
    customer: Customer  # NOT cached - requires auth token
}
```

**Exam focus:** Custom GraphQL resolvers must implement `Magento\GraphQl\Model\Query\ContextInterface` access correctly. If your resolver touches customer data, it **must** require auth and therefore **cannot** be cached.

### 8.4 GraphQL vs REST Caching Comparison

| Feature | GraphQL GET | GraphQL POST | REST GET | REST POST |
|---------|------------|-------------|---------|---------|
| Cacheable | Yes (anonymous) | No | Yes | No |
| Varnish support | Yes | No | Yes | No |
| Cache tags | Yes | N/A | Yes | N/A |
| Auth required | No (for cache) | Depends | No (for cache) | Depends |
| Query complexity | High (nested) | High | Low (flat) | Low |

### 8.5 Resolver Architecture

```php
<?php
namespace Vendor\Module\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

class CustomProductData implements ResolverInterface
{
    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ): mixed {
        // $context->getExtensionAttributes()->isCustomerLoggedIn()
        // If you call this, response CANNOT be cached
        
        // $value = parent object data (e.g., product array from parent resolver)
        // $args = field arguments from query
        
        return ['key' => 'value'];
    }
}
```

---

## 9. Price Waterfall Order

### 9.1 Price Calculation Sequence

```
+-----------------------------------------------+
|           PRICE WATERFALL                      |
+-----------------------------------------------+
|  1. BASE PRICE (catalog price)                 |
|     catalog_product_entity_decimal.value       |
+-----------------------------------------------+
|  2. SPECIAL PRICE                              |
|     If active date range and special_price set |
|     -> replaces base price if lower            |
+-----------------------------------------------+
|  3. TIER PRICE / GROUP PRICE                   |
|     Based on customer group + qty              |
|     -> applies if lower than current price     |
+-----------------------------------------------+
|  4. CATALOG PRICE RULES                        |
|     catalogrule_product_price (pre-calculated) |
|     -> conditions: category, attribute, etc.   |
+-----------------------------------------------+
|  5. CUSTOM OPTION PRICES                       |
|     Added on top of final product price        |
+-----------------------------------------------+
|  6. CART PRICE RULES (Quote level)             |
|     salesrule table                            |
|     -> percent, fixed, fixed per item, etc.    |
+-----------------------------------------------+
|  7. FINAL PRICE                                |
|     min(base, special, tier, catalog rule)     |
+-----------------------------------------------+
```

**Exam focus:** The "final price" at catalog level is: `min(base_price, special_price, tier_price, catalog_rule_price)`. Cart price rules are applied **after** the catalog-level final price is determined and operate on the quote/totals level.

### 9.2 Price Modifier Classes

| Class / Interface | What It Does |
|-------------------|-------------|
| `Magento\Catalog\Model\Product\Type\Price` | Base price provider |
| `Magento\Catalog\Pricing\Price\FinalPrice` | Computes final catalog price |
| `Magento\Catalog\Pricing\Price\SpecialPrice` | Special price check |
| `Magento\Catalog\Pricing\Price\TierPrice` | Tier/group price |
| `Magento\CatalogRule\Pricing\Price\CatalogRulePrice` | Catalog price rule result |
| `Magento\Quote\Model\Quote\Address\Total\*` | Cart-level total collectors |
| `\Magento\SalesRule\Model\Rule\Action\Discount\*` | Discount calculation strategies |

### 9.3 Total Collectors Order (Cart Totals)

```
Totals are collected in sort order from sales.xml:
  subtotal      (10)   - line item subtotals
  nominal       (15)   - recurring profiles
  freeshipping  (20)   - free shipping flag
  tax_subtotal  (25)   - tax before discount (if configured)
  discount      (30)   - cart price rule discounts
  shipping      (35)   - shipping cost
  tax           (40)   - final tax calculation
  grand_total   (100)  - sums everything
```

**Exam focus:** Tax can be calculated **before or after discount** based on store config (`Tax > Calculation Settings > Apply Customer Tax`). The order of `tax_subtotal` vs `discount` collectors determines this behavior.

---

## 10. Order State Machine

### 10.1 State vs Status

```
STATE  = Technical state (code behavior, immutable set defined by Magento)
STATUS = Customer-facing label (configurable, multiple per state)

Mapping: Many statuses can map to one state
         One status can only map to ONE state
```

### 10.2 Complete State Diagram

```
[New order created]
        |
        v
+---------------+
|     new       |  <- pending payment, order placed
+---------------+
        |
        | payment captured / offline payment
        v
+---------------+     [partial invoice]    +------------------+
|   pending     | -----------------------> |  pending_payment |
+---------------+                          +------------------+
        |
        | fully invoiced
        v
+------------------+
|    processing    |  <- invoiced, ready to ship
+------------------+
        |             [partial ship]
        | +-----------------------------------------+
        | |                                         |
        v v                                         v
+------------------+                    +--------------------+
|    complete      |                    |   holded           |
+------------------+                    +--------------------+
        ^
        |
        | all items shipped + invoiced
        |
+------------------+
|   closed         |  <- fully refunded/credited
+------------------+

At any state (if allowed):
        +------------------+
        |   canceled       |  <- only from new/pending/processing
        +------------------+
```

### 10.3 States Reference Table

| State | Code | Description | Allowed Transitions |
|-------|------|-------------|---------------------|
| New | `new` | Order created, payment pending | pending, pending_payment, processing, canceled, holded |
| Pending Payment | `pending_payment` | Awaiting payment gateway | new, processing, canceled |
| Processing | `processing` | Payment received, fulfillment | complete, closed, canceled, holded |
| Complete | `complete` | Shipped and invoiced | closed, holded |
| Closed | `closed` | Refunded/credited | (terminal, no transitions) |
| Canceled | `canceled` | Order canceled | (terminal for most cases) |
| On Hold | `holded` | Manually held | previous state (unhold) |
| Payment Review | `payment_review` | Fraud check in progress | processing, canceled |

**Exam focus:** `complete` state requires **both** a shipment AND an invoice. If only one exists, the state remains `processing`. This is a common exam scenario.

**Exam focus:** Orders can only be **canceled** from states: `new`, `pending_payment`, `processing`. A `complete` or `closed` order cannot be canceled — only a credit memo (refund) can be issued.

### 10.4 State Assignment in Code

```php
<?php
// Setting order state programmatically
$order->setState(\Magento\Sales\Model\Order::STATE_PROCESSING);
$order->setStatus('processing'); // status must map to state

// Or use the dedicated method
$order->setState(Order::STATE_COMPLETE)
      ->setStatus($order->getConfig()->getStateDefaultStatus(Order::STATE_COMPLETE));
```

---

## 11. Test Type Selection Criteria

### 11.1 Decision Matrix

| Question | Unit | Integration | MFTF (Functional) | API Functional |
|----------|------|-------------|-------------------|----------------|
| Does it test a single class in isolation? | **YES** | No | No | No |
| Does it require DB? | No | **YES** | **YES** | **YES** |
| Does it require browser? | No | No | **YES** | No |
| Does it test UI/JS behavior? | No | No | **YES** | No |
| Does it test REST/GraphQL endpoints? | No | No | No | **YES** |
| Execution speed | Fastest | Slow | Slowest | Slow |
| Mocking required | **YES** | No | No | No |

### 11.2 When to Use Each Test Type

#### Unit Tests
```
USE WHEN:
  - Testing pure business logic (calculations, transformations)
  - Testing a class with external dependencies (mock them)
  - TDD — write tests before implementation
  - Fast feedback loop needed

DO NOT USE WHEN:
  - Testing database interactions
  - Testing template rendering
  - Testing REST/GraphQL contracts
```

#### Integration Tests
```
USE WHEN:
  - Testing repository + model + DB layer together
  - Testing observer/plugin chains end-to-end
  - Testing service contracts with real implementations
  - Testing indexer behavior
  - Cannot meaningfully mock the dependency

DO NOT USE WHEN:
  - Logic is pure/isolated (unit test is sufficient)
  - Testing UI flows
```

#### MFTF (Magento Functional Testing Framework)
```
USE WHEN:
  - Testing admin UI workflows
  - Testing customer-facing UI flows
  - Regression testing for merchant-visible behavior
  - Cross-browser compatibility
  - Testing JavaScript-heavy interactions

DO NOT USE WHEN:
  - API-only features
  - Speed is critical (MFTF is slow)
  - Simple backend logic
```

#### API Functional Tests
```
USE WHEN:
  - Validating REST/SOAP/GraphQL endpoint contracts
  - Testing authentication flows
  - Testing response structure and HTTP status codes
  - CI/CD smoke tests for API stability

DO NOT USE WHEN:
  - UI-dependent behavior
  - Pure business logic (use unit/integration)
```

### 11.3 Test Anatomy Examples

```php
<?php
// Unit Test
class PriceCalculatorTest extends TestCase
{
    public function testCalculateDiscount(): void
    {
        $mockConfig = $this->createMock(ConfigInterface::class);
        $mockConfig->method('getDiscountRate')->willReturn(0.10);
        
        $calculator = new PriceCalculator($mockConfig);
        $this->assertEquals(90.0, $calculator->calculate(100.0));
    }
}

// Integration Test (extends Magento\TestFramework\TestCase\AbstractController)
class ProductRepositoryTest extends \Magento\TestFramework\TestCase\AbstractIntegration
{
    /**
     * @magentoDataFixture Magento/Catalog/_files/product_simple.php
     */
    public function testGetById(): void
    {
        $repo = $this->_objectManager->get(ProductRepositoryInterface::class);
        $product = $repo->getById(1);
        $this->assertEquals('simple', $product->getTypeId());
    }
}
```

```xml
<!-- MFTF Test Example -->
<test name="AdminCreateSimpleProductTest">
    <annotations>
        <title value="Create Simple Product via Admin"/>
        <severity value="CRITICAL"/>
        <testCaseId value="MC-123"/>
    </annotations>
    <before>
        <actionGroup ref="AdminLoginActionGroup" stepKey="loginAsAdmin"/>
    </before>
    <actionGroup ref="GoToCreateProductPageActionGroup" stepKey="goToProductPage">
        <argument name="productType" value="simple"/>
    </actionGroup>
    <actionGroup ref="FillProductNameAndSkuInProductFormActionGroup" stepKey="fillProductForm">
        <argument name="product" value="SimpleProduct"/>
    </actionGroup>
    <actionGroup ref="SaveProductFormActionGroup" stepKey="saveProduct"/>
    <see selector="{{AdminProductMessagesSection.successMessage}}" userInput="You saved the product." stepKey="seeSuccessMessage"/>
</test>
```

**Exam focus:** MFTF uses **ActionGroups** for reusable UI steps. Tests reference `stepKey` for sequencing and `before`/`after` hooks for setup/teardown. MFTF generates PHP test classes from XML.

**Exam focus:** The architectural answer for "what test type should you write for a custom REST endpoint" is **API Functional test** — not MFTF (which needs a browser) and not unit (which can't test HTTP).

---

## 12. EE-Only Features Quick List

### 12.1 Commerce (EE) vs Open Source (CE) Feature Matrix

| Feature | CE | EE |
|---------|----|----|
| **B2B Module** | No | Yes |
| **Company Accounts** | No | Yes |
| **Shared Catalogs** | No | Yes |
| **Requisition Lists** | No | Yes |
| **Quick Order** | No | Yes |
| **Negotiable Quotes** | No | Yes |
| **Customer Segments** | No | Yes |
| **Customer Attributes (admin)** | No | Yes |
| **RMA (Return Merchandise Auth)** | No | Yes |
| **Gift Cards** | No | Yes |
| **Gift Registry** | No | Yes |
| **Reward Points** | No | Yes |
| **Store Credit** | No | Yes |
| **Content Staging** | No | Yes |
| **Page Builder** (advanced) | No | Yes |
| **Visual Merchandiser** | No | Yes |
| **Automated Related Products** | No | Yes |
| **Target Rules** | No | Yes |
| **Banner Ads (Dynamic Blocks)** | No | Yes |
| **Scheduled Import/Export** | No | Yes |
| **Advanced Reporting** | No | Yes |
| **Business Intelligence (MBI)** | No | Yes |
| **MSI Source Selection Algorithm: Distance** | No | Yes |
| **MSI Source Selection Algorithm: Priority** | Yes | Yes |
| **Admin Action Log (Audit)** | No | Yes |
| **Encryption Key Rotation** | No | Yes |
| **CAPTCHA** | Yes | Yes |
| **Two-Factor Auth (2FA)** | Yes | Yes |
| **Split Database** (deprecated 2.4.2) | No | Was EE |
| **ElasticSearch** | Yes (2.4+) | Yes |
| **Live Search** (SaaS) | No | Yes |
| **Product Recommendations** (SaaS) | No | Yes |
| **Payment Services** (SaaS) | Both | Both |

**Exam focus:** **Content Staging** is EE-only and is frequently tested. It allows scheduling of price changes, category changes, and CMS updates. Architecturally it works by creating "update" records that modify entities at a future timestamp using a campaign.

**Exam focus:** **Customer Segments** are EE-only and are used in conjunction with Cart Price Rules and Banner Ads to target specific customer groups dynamically (vs static customer groups which exist in CE).

**Exam focus:** **RMA** is EE-only. In CE, returns are handled manually. For CE extension points, you'd need to build custom return functionality — exam may ask what's available natively.

### 12.2 B2B Architecture Notes (EE)

```
B2B Hierarchy:
  Company
    |
    +-- Company Admin (special customer role)
    |
    +-- Teams (org structure)
    |     |
    |     +-- Customers (members)
    |
    +-- Roles & Permissions
    |
    +-- Shared Catalog (custom pricing per company)
    |
    +-- Requisition Lists (saved shopping lists)
    |
    +-- Negotiable Quotes (custom quote workflow)
    |
    +-- Purchase Orders (approval workflow)
```

---

## 13. Score Trend Tracker

### 13.1 Practice Test Log

| Test | Date | Score | Time Used | Weak Areas Identified |
|------|------|-------|-----------|----------------------|
| Practice Test #1 | | ___/__ | ___min | |
| Practice Test #2 | | ___/__ | ___min | |
| Practice Test #3 | | ___/__ | ___min | |
| Practice Test #4 | | ___/__ | ___min | |
| **Practice Test #5** | May 6 | ___/__ | ___/60min | |

### 13.2 Score Trend Analysis Questions

After each test, answer:

1. **What topic category had the most wrong answers?**
2. **Were wrong answers due to:** (a) not knowing the concept, or (b) choosing "works" over "architecturally correct"?
3. **Did time pressure cause errors in the last 15 minutes?**
4. **Which of these areas needs 1 more review pass before exam day?**

```
Scoring benchmark:
  < 60%  = Significant gaps, extend study
  60-70% = Borderline, focus review on weak topics
  70-80% = On track, polish architectural reasoning
  > 80%  = Exam ready, maintain and review cheat sheet
  
Target: Consistent 75%+ with improving trend
```

---

## 14. Architectural Decision-Making Framework

### 14.1 The "Why" Framework for Exam Questions

When multiple answers look valid, apply these filters in order:

```
FILTER 1: Upgrade Safety
  -> Will this break when Magento updates the core class?
  -> Plugin > Preference (preferences break on core class updates)
  -> Event Observer > Plugin (for cross-cutting concerns)

FILTER 2: Scope Correctness
  -> Is the change needed everywhere or only in one area?
  -> Area-specific di.xml vs global di.xml

FILTER 3: Performance at Scale
  -> Does it add DB queries per page load?
  -> Does it break caching?
  -> Does it block the main thread?

FILTER 4: Magento's Own Guidelines
  -> Service Contracts over direct model access
  -> Repository pattern over direct resource model
  -> API interfaces over concrete classes in constructor injection

FILTER 5: Data Integrity
  -> Does it handle the transaction correctly?
  -> Does it handle failures gracefully?
  -> Is it idempotent (safe to retry)?
```

### 14.2 Common Trap Question Patterns

| Scenario | Wrong Answer | Correct Answer | Why |
|----------|-------------|----------------|-----|
| Modify product save behavior | Preference on ProductRepository | Plugin on `save()` method | Upgrade safety |
| Add data to product API response | Override ProductInterface | Extension Attributes | No core modification |
| Store per-website config | `core_config_data` scope=websites | `ScopeConfigInterface` with store scope | Correct abstraction |
| React to order placement | Plugin on order model | Observer on `sales_order_place_after` | Loose coupling |
| Add attribute to customer entity | Direct DB column | EAV attribute via DataPatch | Upgrade safety + UI |
| Share data between plugins | Static property | Registry / custom service | Testability |
| Complex joining for collections | Custom resource model override | Join via afterLoad plugin or custom collection | Upgrade safety |

### 14.3 Service Contracts Pattern

```php
<?php
// WRONG: Inject concrete model (tightly coupled, not upgrade safe)
public function __construct(
    \Magento\Catalog\Model\Product $product  // WRONG
) {}

// CORRECT: Inject service contract interface
public function __construct(
    \Magento\Catalog\Api\ProductRepositoryInterface $productRepository,  // CORRECT
    \Magento\Catalog\Api\Data\ProductInterfaceFactory $productFactory    // CORRECT
) {}
```

**Exam focus:** Always use `*Interface` for constructor injection, never concrete classes. This is testable, replaceable, and upgrade-safe. The exam will present both — always pick the interface.

---

## Quick-Reference Checklist

### Plugin Execution Order
- [ ] `before` → `around` (outer) → `[method]` → `around` (inner, reverse) → `after` (reverse)
- [ ] Lower `sortOrder` = earlier for before/around; later for after
- [ ] Alphabetical module name tiebreaker when `sortOrder` is equal
- [ ] Cannot plugin: `final` methods/classes, `static` methods, `__construct`, non-public methods
- [ ] `around` skipping `$proceed` = breaks chain for lower-priority plugins (avoid)
- [ ] `before` returns array of modified args or `null`; `after` receives return value not original args

### DI XML Scopes
- [ ] Scope hierarchy: `global` → `frontend` / `adminhtml` / `webapi_rest` / `graphql` / `crontab`
- [ ] Area-specific di.xml merges with and overrides global
- [ ] Virtual types = compile-time config variants, no PHP file, cannot use `new`
- [ ] Preferences conflict = last module in load order wins → use plugins instead
- [ ] `shared="false"` for stateful models; `shared="true"` (default) for services

### EAV vs Extension Attributes
- [ ] EAV: scalar values, admin UI, layered nav, attribute sets, `custom_attributes` in API
- [ ] Extension Attributes: complex types, non-EAV entities, `extension_attributes` in API
- [ ] Extension attributes require: `extension_attributes.xml` + plugin for persistence
- [ ] EAV storage: entity value tables with JOINs (slower at scale)

### Cache Types
- [ ] `config`: merged XML; `layout`: layout XML; `block_html`: rendered HTML; `full_page`: FPC
- [ ] `eav`: attribute metadata; `db_ddl`: schema; `collections`: query results (auto-invalidated on save)
- [ ] FPC invalidated by entity save via cache tags (`X-Magento-Tags`)
- [ ] Cache tags = scalable invalidation; cleaning full type = brute force
- [ ] `X-Magento-Cache-Id` = store + currency + customer group → Varnish cache key

### Cloud Build vs Deploy
- [ ] BUILD: no DB/services, `di:compile`, SCD (if not deferred), read-only after
- [ ] DEPLOY: DB available, maintenance mode, `setup:upgrade`, cache flush
- [ ] POST-DEPLOY: site live, cache warm, smoke tests
- [ ] SCD in build phase = shorter deploy window = recommended for production
- [ ] DB query during build phase = architectural defect (fails pipeline)

### MSI
- [ ] Key tables: `inventory_source`, `inventory_stock`, `inventory_source_item`, `inventory_reservation`
- [ ] `inventory_reservation` = append-only (never UPDATE/DELETE)
- [ ] Reserve = INSERT with negative qty; release = INSERT with positive qty (compensation)
- [ ] Saleable qty = SUM(source items) - SUM(reservations)
- [ ] Distance-based SSA = EE only; Priority-based = CE + EE

### GraphQL Caching
- [ ] GET = cacheable (anonymous, no auth header)
- [ ] POST = never cacheable
- [ ] Mutations = always POST
- [ ] Customer data = auth required = not cached
- [ ] `X-Magento-Cache-Id` computed from store + currency + customer group

### Price Waterfall
- [ ] Final catalog price = `min(base, special, tier/group, catalog rule)`
- [ ] Cart price rules applied AFTER catalog price (quote/totals level)
- [ ] Tax can be before or after discount based on config
- [ ] Total collectors run in `sortOrder` from `sales.xml`

### Order State Machine
- [ ] `complete` requires BOTH shipment AND invoice
- [ ] Cancel only from: `new`, `pending_payment`, `processing`
- [ ] `complete`/`closed` cannot be canceled — credit memo only
- [ ] State = technical (code behavior); Status = customer-facing label (many-to-one with state)
- [ ] One status maps to exactly ONE state

### Test Type Selection
- [ ] **Unit**: isolated class, mocked deps, fast, pure business logic
- [ ] **Integration**: DB required, tests full stack of service + model + DB
- [ ] **MFTF**: browser required, UI flows, slowest
- [ ] **API Functional**: REST/SOAP/GraphQL endpoints, HTTP contracts
- [ ] Custom REST endpoint → API Functional test (not unit, not MFTF)
- [ ] `@magentoDataFixture` annotation in integration tests loads fixture data

### EE-Only Features
- [ ] Content Staging, Customer Segments, Target Rules, RMA
- [ ] B2B: Company accounts, Shared Catalogs, Negotiable Quotes, Requisition Lists, Purchase Orders
- [ ] Gift Cards, Gift Registry, Reward Points, Store Credit
- [ ] Visual Merchandiser, Advanced Reporting, Admin Action Log
- [ ] MSI Distance-based SSA, Live Search (SaaS), Product Recommendations (SaaS)
- [ ] Automated Related Products / Target Rules

### Architectural Decision Priorities
- [ ] Plugin > Preference (upgrade safety)
- [ ] Event Observer > Plugin (for cross-cutting concerns)
- [ ] Interface injection > concrete class injection (testability, replaceability)
- [ ] Service contracts (Repository) > direct Model/ResourceModel access
- [ ] Extension Attributes > core model modification
- [ ] Area-specific di.xml > global for scope-limited changes
- [ ] Append-only patterns (reservations) for concurrency-safe inventory
- [ ] Cache tags > full cache type flush for production invalidation
