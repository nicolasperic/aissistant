# Magento 2 Architect Exam: Architecture Decision Records & Catalog Pricing Deep Dive

## Table of Contents
1. [Architecture Decision Framework](#1-architecture-decision-framework)
2. [Plugin vs Event vs Preference](#2-plugin-vs-event-vs-preference)
3. [Repository vs Collection](#3-repository-vs-collection)
4. [Sync vs Async Processing](#4-sync-vs-async-processing)
5. [Varnish vs Redis FPC](#5-varnish-vs-redis-fpc)
6. [DB Queue vs RabbitMQ](#6-db-queue-vs-rabbitmq)
7. [Anti-Patterns Reference](#7-anti-patterns-reference)
8. [Catalog Pricing Deep Dive](#8-catalog-pricing-deep-dive)
9. [The Price Waterfall](#9-the-price-waterfall)
10. [Price Indexing Internals](#10-price-indexing-internals)
11. [Tax Calculation Modes](#11-tax-calculation-modes)
12. [Enterprise Edition Pricing](#12-enterprise-edition-pricing)
13. [Hands-On Verification Scenario](#13-hands-on-verification-scenario)
14. [Scenario-Based Decision Practice](#14-scenario-based-decision-practice)
15. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Architecture Decision Framework

The Magento Architect exam does **not** test memorization — it tests *justified reasoning*. Every architectural choice has a **context**, **trade-offs**, and a **consequence**. The exam presents scenarios where two or three answers are technically valid; the correct answer is the one that is **architecturally superior given the stated constraints**.

### How to Read an Architecture Decision Record (ADR)

```
Title:     Short noun phrase describing the decision
Status:    Proposed / Accepted / Deprecated / Superseded
Context:   Why is this decision needed? What forces are at play?
Decision:  What was chosen, and WHY (not just what)
Consequences: Trade-offs accepted, future constraints created
```

> **Exam focus:** The exam will give you the *Context* and ask you to identify the correct *Decision*. If you only memorized the decision without understanding the context, distractor answers will fool you.

### The Decision Hierarchy (Most to Least Preferred)

```
  [Declarative XML / di.xml]          <- always prefer over code
          |
          v
  [Plugin / Event / Preference]       <- choose based on intent
          |
          v
  [Custom Service Contract]           <- when no hook exists
          |
          v
  [Core class override (Preference)]  <- last resort, justified
          |
          v
  [Source code modification]          <- NEVER on exam
```

---

## 2. Plugin vs Event vs Preference

### Decision Matrix

| Criterion | Plugin | Event Observer | Preference |
|---|---|---|---|
| **Primary use case** | Modify method input/output/execution | React to something that happened | Replace an interface implementation |
| **Coupling** | Medium (depends on method signature) | Low (decoupled via event name) | High (full class replacement) |
| **Can intercept return value?** | Yes (around/after) | No | Yes (full control) |
| **Multiple extensions coexist?** | Yes (sortOrder) | Yes | **No — last one wins** |
| **Works on interfaces?** | Yes | N/A | **Yes — ONLY valid use case** |
| **Works on final classes?** | **NO** | N/A | Yes but breaks other plugins |
| **Performance overhead** | Low-Medium | Low | None (compile-time) |

### When to Use Each — The Authoritative Rules

#### Plugin — Use When:
- You need to **modify method arguments** before execution (before plugin)
- You need to **modify or replace return values** (after/around plugin)
- You need to **conditionally skip** the original method (around plugin returning `null` or alternative)
- The target class is **not final** and **not a data object**

```php
// CORRECT: Before plugin modifying arguments
class ModifyProductNamePlugin
{
    public function beforeSetName(
        \Magento\Catalog\Model\Product $subject,
        string $name
    ): array {
        // Must return array of modified arguments
        return [strtoupper($name)];
    }
}
```

```php
// CORRECT: Around plugin — conditionally skip
class SkipLoggingPlugin
{
    public function aroundSave(
        \Magento\Catalog\Model\ResourceModel\Product $subject,
        callable $proceed,
        \Magento\Framework\Model\AbstractModel $object
    ) {
        if ($this->isTestEnvironment()) {
            return $subject; // skip original
        }
        return $proceed($object);
    }
}
```

> **Exam focus:** Around plugins that skip `$proceed()` break the plugin chain for all subsequent plugins. This is an anti-pattern unless explicitly required. Prefer `before` or `after` whenever possible.

#### Event Observer — Use When:
- You want to **react to** something (fire-and-forget semantics)
- The action is **non-critical** to the main flow (failure should not block checkout)
- Multiple independent modules need to respond to the **same event**
- You want **zero coupling** between trigger and responder

```xml
<!-- events.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Event/etc/events.xsd">
    <event name="sales_order_place_after">
        <observer name="vendor_module_send_confirmation"
                  instance="Vendor\Module\Observer\SendOrderConfirmation"/>
    </event>
</config>
```

```php
class SendOrderConfirmation implements \Magento\Framework\Event\ObserverInterface
{
    public function execute(\Magento\Framework\Event\Observer $observer): void
    {
        /** @var \Magento\Sales\Model\Order $order */
        $order = $observer->getEvent()->getOrder();
        // Non-critical: if this fails, order is already placed
        $this->notificationService->send($order);
    }
}
```

> **Exam focus:** Events cannot modify the object that triggered them in a way that affects the original flow — the calling code does not use the observer's return value. If you need to **change** what happens, use a **plugin**.

#### Preference — Use When:
- You are implementing a **new concrete class for an interface** defined in `di.xml`
- The interface has no existing concrete implementation you can plugin
- You are providing **your module's** service contract implementation

```xml
<!-- di.xml — CORRECT use of preference -->
<preference for="Vendor\MyModule\Api\CustomServiceInterface"
            to="Vendor\MyModule\Model\CustomService"/>
```

```xml
<!-- di.xml — ANTI-PATTERN: preferencing a concrete Model -->
<!-- This breaks other modules that also try to override it -->
<preference for="Magento\Catalog\Model\Product"
            to="Vendor\MyModule\Model\Product"/>
```

> **Exam focus:** **Preference is ONLY architecturally correct for interface implementation.** Using it on a concrete class is a last resort that creates merge conflicts with other extensions and breaks plugin chains on the overridden class.

### ADR Summary — Plugin vs Event vs Preference

```
SCENARIO: Need to add a field to product save and validate it

    Does a suitable event fire after the data I need? -------> YES -> Observer
                |
                NO
                |
                v
    Is there a plugin point on the save method? -----------> YES -> Plugin (before/after)
                |
                NO
                |
                v
    Do I need to replace the entire implementation? -------> YES -> Preference (if interface)
                                                                     OR custom plugin chain
```

---

## 3. Repository vs Collection

### Decision Matrix

| Criterion | Repository | Collection |
|---|---|---|
| **API contract** | Service Contract (stable, versioned) | Internal implementation detail |
| **Returns** | Data objects (DTOs / interfaces) | Model objects (legacy) |
| **Cacheable?** | Yes (via Identity Map pattern) | No |
| **Plugin-able?** | Yes (interface methods) | Partially (model methods) |
| **Search support** | `SearchCriteriaInterface` | `addFieldToFilter()` |
| **Cross-module use** | **Required** | Discouraged |
| **Performance** | Slightly higher overhead | Lower overhead for bulk |
| **Testability** | High (interface mock) | Medium |
| **When to use** | Default for all CRUD | Complex queries, reports, bulk indexing |

### Repository Pattern

```php
// CORRECT: Using repository for service layer operations
class OrderProcessor
{
    public function __construct(
        private \Magento\Catalog\Api\ProductRepositoryInterface $productRepository,
        private \Magento\Framework\Api\SearchCriteriaBuilder $searchCriteriaBuilder
    ) {}

    public function getActiveProducts(): array
    {
        $searchCriteria = $this->searchCriteriaBuilder
            ->addFilter('status', \Magento\Catalog\Model\Product\Attribute\Source\Status::STATUS_ENABLED)
            ->addFilter('visibility', [3, 4], 'in')
            ->setPageSize(100)
            ->create();

        $result = $this->productRepository->getList($searchCriteria);
        return $result->getItems(); // Returns ProductInterface[]
    }
}
```

### Collection Pattern

```php
// ACCEPTABLE: Collection for bulk indexing/reporting (performance-critical)
class PriceIndexProcessor
{
    public function __construct(
        private \Magento\Catalog\Model\ResourceModel\Product\CollectionFactory $collectionFactory
    ) {}

    public function getBulkProductsForIndex(array $productIds): array
    {
        $collection = $this->collectionFactory->create();
        $collection->addAttributeToSelect(['price', 'special_price', 'tier_price'])
            ->addFieldToFilter('entity_id', ['in' => $productIds])
            ->setFlag('has_stock_status_filter', false);

        // Justified: bulk operation where DTO overhead would be significant
        return $collection->getItems();
    }
}
```

> **Exam focus:** If a scenario says "cross-module data access" or "external API/integration," the answer is **always Repository**. Collections are an internal implementation detail and must not cross module boundaries.

> **Exam focus:** The Repository uses `SearchCriteriaInterface` which is **filterable, sortable, and paginated**. The exam may test whether you know to use `SearchCriteriaBuilder` (not `SearchCriteria` directly).

### The Key Architectural Rule

```
Module A                    Module B
-----------                 -----------
| Service  | --Repository-> | Data     |
| Layer    |   Interface    | Layer    |
-----------                 -----------
     ^
     |-- NEVER cross with Collection
```

---

## 4. Sync vs Async Processing

### Decision Framework

```
Is the result needed IMMEDIATELY for the current request/response?
        |
        YES                         NO
        |                           |
        v                           v
   Synchronous               Is failure acceptable
   (inline execution)        without blocking user?
                                    |
                              YES              NO
                              |                |
                              v                v
                         Async Queue       Async with
                         (fire-forget)     retry + DLQ
```

### When Async is Architecturally REQUIRED

| Scenario | Why Async | Queue Type |
|---|---|---|
| Sending order confirmation email | Non-critical, can be delayed | DB Queue |
| Updating ERP/3rd-party on order | Non-critical path, external latency | RabbitMQ |
| Reindexing after bulk import | Long-running, non-blocking | DB Queue or RabbitMQ |
| Inventory reservation (EE) | High volume, ordering matters | RabbitMQ |
| Fraud scoring | Result not needed at checkout moment | RabbitMQ |

### When Sync is Required

- Price calculation (needed for cart total display)
- Inventory check at checkout submit (prevent oversell)
- Payment processing (result must be immediate)
- Authentication/authorization

> **Exam focus:** The exam classic scenario: "A client calls an external fraud API synchronously during checkout. What is the architectural problem?" Answer: **External API latency adds to checkout response time; any API timeout directly causes checkout failure. Should be async post-order-placement, or use a cached risk score.**

```php
// ANTI-PATTERN: Sync external API in checkout flow
class PlaceOrderPlugin
{
    public function beforePlace(
        \Magento\Sales\Api\OrderManagementInterface $subject,
        \Magento\Sales\Api\Data\OrderInterface $order
    ): array {
        // WRONG: This blocks checkout. If API is slow (3s), every checkout is slow
        // If API is down, checkout FAILS
        $fraudScore = $this->fraudApiClient->score($order); // sync HTTP call
        if ($fraudScore > 0.9) {
            throw new \Magento\Framework\Exception\LocalizedException(__('Order flagged'));
        }
        return [$order];
    }
}
```

```php
// CORRECT: Post-order async fraud check
class FraudCheckObserver implements \Magento\Framework\Event\ObserverInterface
{
    public function execute(\Magento\Framework\Event\Observer $observer): void
    {
        $order = $observer->getEvent()->getOrder();
        // Queue a message — checkout completes immediately
        // Fraud check runs async; if flagged, trigger cancellation workflow
        $this->publisher->publish('fraud.check', $this->buildMessage($order));
    }
}
```

---

## 5. Varnish vs Redis FPC

### Decision Matrix

| Criterion | Varnish | Redis FPC |
|---|---|---|
| **Layer** | Reverse proxy (network layer) | Application cache (PHP layer) |
| **Serves PHP?** | **No** — serves cached responses directly | No — PHP still runs, reads from Redis |
| **Performance** | ~10-100x faster (no PHP overhead) | Faster than DB, slower than Varnish |
| **ESI support** | **Yes** (Edge Side Includes for blocks) | No |
| **Hole-punching** | Yes (via ESI + private content) | No (full page) |
| **Infrastructure cost** | Requires Varnish server | Redis already in stack |
| **SSL termination** | Needs Nginx/HAProxy in front | Handled by Nginx |
| **Debugging** | More complex (VCL) | Simpler |
| **Recommended for** | **High-traffic production** | Dev/staging or low-traffic |

### The Architectural Rule

```
Traffic Pattern          Recommended Cache           Reason
------------------------------------------------------------------
>1000 req/min           Varnish + Redis FPC fallback  Varnish offloads PHP entirely
100-1000 req/min        Varnish (still better)        PHP overhead adds up
<100 req/min            Redis FPC acceptable          Varnish ROI lower
Development             Built-in cache / Redis FPC    VCL debugging overhead
```

### How Varnish + ESI Works

```
Browser
  |
  v
[Varnish]  <-- Cache HIT --> Return cached HTML (no PHP)
  |
  | Cache MISS
  v
[Nginx]
  |
  v
[PHP-FPM / Magento]
  |-- Renders page with ESI tags for dynamic blocks
  |-- <esi:include src="/customer/section/load/"/>
  v
[Varnish caches the static parts]
[Browser fetches dynamic parts via AJAX (sections.xml)]
```

> **Exam focus:** Varnish does **not** serve pages requiring authentication directly — it uses **hole-punching via ESI** for dynamic blocks (cart count, customer name). Private content is fetched via AJAX (`/customer/section/load/`) and is **never** cached by Varnish.

> **Exam focus:** The exam may ask why you cannot simply use Varnish for all pages including checkout. Answer: Checkout pages contain **private, session-specific data** and must be excluded from Varnish cache (via `cacheable="false"` in layout XML or VCL exclusion rules).

```xml
<!-- Marking a page as non-cacheable in layout XML -->
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <block class="Magento\Framework\View\Element\Template"
           name="checkout.root"
           cacheable="false"/>
</page>
```

---

## 6. DB Queue vs RabbitMQ

### Decision Matrix

| Criterion | DB Queue (`queue_message_status`) | RabbitMQ |
|---|---|---|
| **Infrastructure** | None (uses existing DB) | Requires RabbitMQ server |
| **Throughput** | Low-Medium (hundreds/min) | High (tens of thousands/min) |
| **Message ordering** | Eventual (polling-based) | Guaranteed (per-queue) |
| **Retry/DLQ** | Manual implementation | Built-in (Dead Letter Exchange) |
| **Message TTL** | Manual cleanup | Configurable per-queue |
| **Routing** | None | Exchange/binding patterns |
| **Monitoring** | SQL queries | Management UI + metrics |
| **Consumer scaling** | Limited (process-based) | Easy (multiple consumers) |
| **Use case** | Low-medium volume, simple tasks | High-volume, ordered, critical |

### Queue Configuration

```xml
<!-- communication.xml — defines the topic regardless of transport -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Communication/etc/communication.xsd">
    <topic name="vendor.module.process_order"
           request="Vendor\Module\Api\Data\OrderMessageInterface"/>
</config>
```

```xml
<!-- queue_topology.xml — RabbitMQ-specific routing -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/topology.xsd">
    <exchange name="magento" type="topic" connection="amqp">
        <binding id="processOrderBinding"
                 topic="vendor.module.process_order"
                 destinationType="queue"
                 destination="vendor.module.process_order"/>
    </exchange>
</config>
```

```xml
<!-- queue_publisher.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/publisher.xsd">
    <publisher topic="vendor.module.process_order">
        <connection name="amqp" exchange="magento"/>
    </publisher>
</config>
```

```xml
<!-- queue_consumer.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/consumer.xsd">
    <consumer name="vendorModuleProcessOrder"
              queue="vendor.module.process_order"
              connection="amqp"
              handler="Vendor\Module\Model\OrderProcessor::process"
              maxMessages="100"/>
</config>
```

> **Exam focus:** The **topic** is transport-agnostic. Switching from DB queue to RabbitMQ only requires changing `queue_publisher.xml` and `queue_topology.xml` — the publisher code and consumer handler code do **not** change.

> **Exam focus:** For **inventory operations in Adobe Commerce (EE)**, RabbitMQ is **strongly recommended** for production — MSI queue consumers in `module-inventory-indexer/etc/queue_consumer.xml` have no `connection="amqp"` attribute and technically work with the default DB queue transport. However, Adobe recommends RabbitMQ for high-volume MSI scenarios due to ordering guarantees and throughput. The exam may present RabbitMQ as the correct answer for MSI at scale.

---

## 7. Anti-Patterns Reference

### Anti-Pattern 1: Direct ObjectManager Use

```php
// ANTI-PATTERN: Direct ObjectManager instantiation
class MyClass
{
    public function doSomething()
    {
        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        $product = $objectManager->create(\Magento\Catalog\Model\Product::class);
        // This bypasses dependency injection entirely
    }
}
```

```php
// CORRECT: Constructor injection
class MyClass
{
    public function __construct(
        private \Magento\Catalog\Api\ProductRepositoryInterface $productRepository
    ) {}

    public function doSomething(int $productId): void
    {
        $product = $this->productRepository->getById($productId);
    }
}
```

**Why it's wrong:**
- Bypasses the DI container — no substitution possible in tests
- Creates hidden dependencies (not visible in constructor)
- Cannot be intercepted by plugins (the proxy/interceptor pattern is bypassed)
- Breaks virtual types and compile-time optimization

> **Exam focus:** The **one legitimate exception** to ObjectManager direct use is in **factory classes, proxies, and interceptors** that are generated by `bin/magento setup:di:compile`. These are framework concerns, not application code.

### Anti-Pattern 2: Business Logic in Templates

```php
// ANTI-PATTERN: Business logic in .phtml template
<?php
$objectManager = \Magento\Framework\App\ObjectManager::getInstance();
$order = $objectManager->create('Magento\Sales\Model\Order')->load($orderId);
$taxAmount = $order->getTaxAmount();
$shippingCost = $order->getShippingAmount();
$finalPrice = $taxAmount + $shippingCost + ($order->getGrandTotal() * 0.05);
?>
<div><?= $finalPrice ?></div>
```

```php
// CORRECT: Business logic in ViewModel, template just displays
// ViewModel
class OrderSummaryViewModel implements \Magento\Framework\View\Element\Block\ArgumentInterface
{
    public function __construct(
        private \Magento\Sales\Api\OrderRepositoryInterface $orderRepository
    ) {}

    public function getFinalDisplayPrice(int $orderId): float
    {
        $order = $this->orderRepository->get($orderId);
        return $order->getTaxAmount()
            + $order->getShippingAmount()
            + ($order->getGrandTotal() * 0.05);
    }
}

// Template (.phtml)
// <?= $block->escapeHtml($viewModel->getFinalDisplayPrice($orderId)) ?>
```

**Why it's wrong:**
- Templates cannot be unit tested
- Logic is not reusable across templates
- Bypasses the block/ViewModel layer (caching benefits lost)
- Violates Separation of Concerns

### Anti-Pattern 3: Synchronous External API in Checkout

*(Covered in Section 4 — see the fraud API example)*

**Additional checkout anti-patterns:**

```php
// ANTI-PATTERN: Database query in a loop during checkout
foreach ($cartItems as $item) {
    // N+1 query problem — one query per item
    $product = $this->productRepository->getById($item->getProductId());
    $this->calculatePrice($product);
}

// CORRECT: Bulk load
$productIds = array_column($cartItems, 'product_id');
$products = $this->productRepository->getList(
    $this->searchCriteriaBuilder
        ->addFilter('entity_id', $productIds, 'in')
        ->create()
)->getItems();
```

### Anti-Pattern 4: No Cache Invalidation Strategy

```php
// ANTI-PATTERN: Saving data without cache tags or invalidation
class ProductPriceUpdater
{
    public function updatePrice(int $productId, float $price): void
    {
        $this->resourceConnection->getConnection()->update(
            'catalog_product_entity_decimal',
            ['value' => $price],
            ['entity_id = ?' => $productId, 'attribute_id = ?' => $this->priceAttributeId]
        );
        // No cache invalidation! Varnish and FPC still serve stale prices
    }
}
```

```php
// CORRECT: Invalidate relevant cache tags
class ProductPriceUpdater
{
    public function __construct(
        private \Magento\Framework\App\CacheInterface $cache,
        private \Magento\Framework\Indexer\IndexerRegistry $indexerRegistry
    ) {}

    public function updatePrice(int $productId, float $price): void
    {
        // ... update DB ...

        // Invalidate cache for this product
        $this->cache->clean([\Magento\Catalog\Model\Product::CACHE_TAG . '_' . $productId]);

        // Trigger price reindex for this product
        $indexer = $this->indexerRegistry->get('catalog_product_price');
        if (!$indexer->isScheduled()) {
            $indexer->reindexRow($productId);
        }
    }
}
```

> **Exam focus:** Cache tags in Magento use the pattern `ENTITY_TYPE_ID` (e.g., `cat_p_1` for product ID 1). Full page cache invalidation is driven by these tags via `X-Magento-Tags` HTTP headers that Varnish reads.

### Anti-Pattern 5: Plugin on Final Class

```php
// ANTI-PATTERN: Attempting to plugin a final class
// In di.xml:
<type name="Magento\Framework\Pricing\Price\Collection">
    <plugin name="vendor_my_plugin"
            instance="Vendor\Module\Plugin\PriceCollectionPlugin"/>
</type>
// If PriceCollection is final, this SILENTLY FAILS or causes a compile error
```

**Why it fails:**
- PHP `final` keyword prevents class extension
- Magento's interceptor pattern generates a subclass of the target
- A `final` class cannot be subclassed → interceptor generation fails

**Solutions:**
1. Use an **Event** if one fires at the relevant point
2. Use a **Preference** to replace the class entirely (high risk)
3. Wrap the class with a **Decorator** pattern via DI
4. File a request with the module owner to remove `final` or add an event

> **Exam focus:** The exam loves this scenario. The answer is never "it works fine" — plugins on final classes **cannot be compiled** and will throw an error during `setup:di:compile`.

---

## 8. Catalog Pricing Deep Dive

### The Pricing Architecture Overview

```
Data Entry Points
-----------------
  Admin Panel / API
        |
        +---> Regular Price (catalog_product_entity_decimal, attribute: price)
        |
        +---> Special Price (special_price + special_from_date + special_to_date)
        |
        +---> Tier Prices (catalog_product_entity_tier_price table)
        |
        +---> Catalog Price Rules (catalogrule table + catalogrule_product_price)
        |
        +---> Cart Price Rules (salesrule table) <-- applied at cart, not index time
        |
        v
  Price Indexer (catalog_product_index_price)
        |
        v
  Storefront Price Display & Cart
```

---

## 9. The Price Waterfall

### Price Resolution Order (Most Important Concept)

```
Step 1: START with Regular Price
        (catalog_product_entity_decimal, attribute_code='price')

Step 2: APPLY Special Price (if active date range)
        Result = min(Regular Price, Special Price)

Step 3: APPLY Tier Price (if qty threshold met)
        Result = min(Current Price, Tier Price for qty)

Step 4: APPLY Group Price (CE: tier price with qty=1 per group)
        Note: In M2, Customer Group Price IS a Tier Price with qty=1

Step 5: APPLY Catalog Price Rule
        Result = min(Current Price, Rule-Applied Price)
        *** CATALOG RULES APPLIED BEFORE CART RULES ***
        *** CATALOG RULES ARE IN THE PRICE INDEX ***

Step 6: DISPLAY this as the "catalog price" / "before cart" price

Step 7: APPLY Cart Price Rules (at cart/checkout time ONLY)
        Result = Discounted Cart Total (NOT reflected in product listing price)
```

### Critical Distinction: Catalog Rule vs Cart Rule

| Feature | Catalog Price Rule | Cart Price Rule |
|---|---|---|
| **When applied** | Index time (batch) | Cart evaluation time (real-time) |
| **Visible on PLP/PDP** | **Yes** — shown as crossed-out price | No — only in cart |
| **Stored in** | `catalogrule_product_price` → index | `salesrule` table |
| **Trigger** | Cron + manual reindex | Every cart load |
| **Coupon codes** | No | Yes |
| **Affects price index** | **Yes** | **No** |
| **Customer group aware** | Yes | Yes |
| **Combinable** | With all above | With catalog rule result |

> **Exam focus:** A Catalog Price Rule result IS the price that goes into `catalog_product_index_price`. A Cart Price Rule applies **on top of** whatever is in the price index. They are **not** interchangeable. If you need the discount to show on the product listing page, use a **Catalog Price Rule**, not a Cart Price Rule.

### Price Waterfall — Worked Example

```
Product Setup:
  Regular Price:    $100.00
  Special Price:    $85.00  (active today)
  Tier Price:       $80.00  (for qty >= 5)
  Catalog Rule:     10% off  (for "General" customer group)

Scenario A: Customer buys qty=1
  Start:            $100.00
  After Special:    $85.00   (min(100, 85) = 85)
  After Tier:       $85.00   (qty=1, no tier applies)
  After Cat. Rule:  $76.50   (min(85, 85*0.9) = 76.50)
  INDEX PRICE:      $76.50

Scenario B: Customer buys qty=5
  Start:            $100.00
  After Special:    $85.00   (min(100, 85) = 85)
  After Tier:       $80.00   (min(85, 80) = 80, qty>=5 threshold met)
  After Cat. Rule:  $72.00   (min(80, 80*0.9) = 72.00)
  INDEX PRICE:      $72.00
```

> **Exam focus:** The waterfall always takes the **minimum** at each step. A catalog rule does NOT override special price if special price is already lower. Both compete and the lower wins.

### Understanding `final_price` in the Index

```sql
-- The price index stores the winner at each level
SELECT
    entity_id,
    customer_group_id,
    website_id,
    tax_class_id,
    price,           -- Regular price
    final_price,     -- The winning price after all catalog-level rules
    min_price,       -- Lowest possible price (min tier * min catalog rule)
    max_price,       -- Regular price (no discounts)
    tier_price       -- Best tier price available (NULL if none)
FROM catalog_product_index_price
WHERE entity_id = 42
ORDER BY customer_group_id, website_id;
```

```
+----------+-------------------+------------+----------+-------------+-----------+----------+-----------+
|entity_id | customer_group_id | website_id | price    | final_price | min_price | max_price| tier_price|
+----------+-------------------+------------+----------+-------------+-----------+----------+-----------+
| 42       | 0 (NOT LOGGED IN) | 1          | 100.00   | 76.50       | 72.00     | 100.00   | 80.00     |
| 42       | 1 (General)       | 1          | 100.00   | 76.50       | 72.00     | 100.00   | 80.00     |
| 42       | 2 (Wholesale)     | 1          | 100.00   | 85.00       | 80.00     | 100.00   | 80.00     |
+----------+-------------------+------------+----------+-------------+-----------+----------+-----------+
```

---

## 10. Price Indexing Internals

### The Index Table Structure

```sql
-- catalog_product_index_price is the key table
-- Primary key: (entity_id, customer_group_id, website_id)
-- This means: ONE ROW per product × customer group × website combination

-- For a store with:
--   500 products
--   4 customer groups (NOT LOGGED IN, General, Wholesale, Retailer)
--   2 websites
-- Total rows = 500 × 4 × 2 = 4,000 rows

-- For a store with:
--   100,000 products
--   10 customer groups
--   5 websites
-- Total rows = 100,000 × 10 × 5 = 5,000,000 rows  <-- indexing performance concern
```

> **Exam focus:** `catalog_product_index_price` is indexed by `GROUP BY customer_group_id × website_id`. This is why **adding more customer groups or websites has a multiplicative effect on index size and reindex time**. An architect must flag this when asked about scaling decisions.

### Price Indexer Types

```
catalog_product_price indexer
    |
    +-- IndexerInterface::reindexAll()     -- Full reindex (all products)
    |   bin/magento indexer:reindex catalog_product_price
    |
    +-- IndexerInterface::reindexRow($id)  -- Single product
    |   Triggered by: product save via Admin or API
    |
    +-- IndexerInterface::reindexList($ids) -- Batch of products
        Triggered by: catalog rule save, bulk update
```

```bash
# Check indexer status and mode
bin/magento indexer:status catalog_product_price
bin/magento indexer:show-mode catalog_product_price

# Set to schedule mode (recommended for production)
bin/magento indexer:set-mode schedule catalog_product_price

# Manual reindex
bin/magento indexer:reindex catalog_product_price
```

### Catalog Rule Indexing Flow

```
Admin saves Catalog Price Rule
        |
        v
catalogrule_product table populated
(maps rules to products + customer groups)
        |
        v
Cron: catalogrule_apply_all (daily 1am by default)
OR
Manual: bin/magento indexer:reindex catalogrule_rule
        |
        v
catalogrule_product_price table populated
(rule prices per product/date/website/group)
        |
        v
Price indexer reads catalogrule_product_price
        |
        v
catalog_product_index_price.final_price updated
```

> **Exam focus:** Catalog price rules have a **cron dependency**. If you create a rule to start "today" and the cron hasn't run, the price index won't reflect it. In production this is managed by the `catalogrule_apply_all` cron job. This is a frequent source of "my catalog rule isn't working" support issues.

---

## 11. Tax Calculation Modes

### Three Tax Calculation Methods

| Method | Description | Use Case |
|---|---|---|
| **Unit-based** | Tax calculated per item unit, then multiplied by qty | Simple, default |
| **Row-based** | Tax calculated on line total (price × qty), then applied | More accurate for rounding |
| **Total-based** | Tax calculated on order total after all discounts | Least common, some EU requirements |

### The Rounding Problem

```
Product: $9.99, qty=3, tax=10%

Unit-based:
  Tax per unit = $9.99 × 0.10 = $0.999 → rounds to $1.00
  Total tax = $1.00 × 3 = $3.00
  Total = $29.97 + $3.00 = $32.97

Row-based:
  Row total = $9.99 × 3 = $29.97
  Tax on row = $29.97 × 0.10 = $2.997 → rounds to $3.00
  Total = $29.97 + $3.00 = $32.97
  (same result here, but differs with discounts)

Total-based:
  Only meaningful when comparing taxable vs non-taxable items
  and discounts interact with tax base differently
```

> **Exam focus:** Row-based calculation is recommended for most stores to minimize rounding discrepancies across line items. Unit-based can cause penny differences when order-level discounts interact with per-unit tax rounding.

### Fixed Product Tax (FPT)

FPT is a fixed dollar amount added to a product regardless of quantity or customer group (e.g., environmental fees, mattress recycling fees).

```xml
<!-- FPT is configured as a product attribute -->
<!-- System > Configuration > Tax > Fixed Product Taxes -->
```

```
FPT Behavior:
  - Applied BEFORE or AFTER catalog price depending on configuration
  - Can be "Included in Price" or "Added to Price"
  - Appears as a separate line item in cart
  - NOT affected by catalog or cart price rules
  - NOT a percentage — always fixed dollar amount
```

> **Exam focus:** FPT is **not** a traditional tax rate — it's a fixed surcharge. It is **not** reduced by discounts. An architect must understand this distinction when implementing pricing for products with regulatory fees.

### Tax Before vs After Discount

```
Configuration: Catalog Prices = Excluding Tax
Discount Calculation: Before Tax vs After Tax

Before Tax (default for US):
  Item: $100, 20% discount, 10% tax
  Price after discount: $80
  Tax: $80 × 0.10 = $8
  Total: $88

After Tax (common in EU):
  Item: $100, 10% tax = $110
  20% discount on $110 = $22 discount
  Total: $88
  (same result here but differs when mixing rates)
```

---

## 12. Enterprise Edition Pricing

### Shared Catalog (B2B)

```
Standard Tier Prices        Shared Catalog Tier Prices
--------------------        --------------------------
customer_group_id = 1       Shared Catalog "Gold" --> customer_group_id = N (custom)
qty_from = 5                qty_from = 1  (group price behavior)
value = 80.00               value = 70.00  <-- OVERRIDES standard tier

Rule: SharedCatalog tier prices OVERRIDE standard tier prices
      for the customer groups assigned to that catalog
```

> **Exam focus:** Shared Catalog creates a **dedicated customer group** and assigns **catalog-specific pricing**. When a customer in that group views a product, they see the Shared Catalog price, not the standard tier price. Standard tier prices are **hidden** for that customer group if a shared catalog is active.

### Negotiable Quote (B2B)

```
Price Authority Hierarchy (highest override wins):
  1. Negotiable Quote Price (highest priority - manually set by sales rep)
  2. Catalog Price (from index - catalog rules, tier prices, special price)
  3. Cart Price Rules (lowest priority for NQ - may or may not apply)

NegotiableQuote can:
  - Set a specific $ amount per item
  - Set a % discount per item or for the entire quote
  - Override shipping charges
  - Lock prices so future catalog changes don't affect the quote
```

> **Exam focus:** A Negotiable Quote price is **NOT** stored in the price index. It is stored in the quote and snapshot tables. When a quote is converted to an order, the negotiated price is locked in the order line items regardless of subsequent catalog price changes.

### Shared Catalog + Negotiable Quote Interaction

```
Customer Group: "Enterprise Clients" (Shared Catalog assigned)

Product base price:      $100.00
Shared Catalog price:    $75.00   (replaces standard pricing)
Special price:           $80.00   (ignored -- Shared Catalog wins at $75)
Negotiable Quote price:  $65.00   (sales rep manually sets, overrides everything)

Final order price:       $65.00
```

---

## 13. Hands-On Verification Scenario

### Setup: Same Product with All Price Types Active

```sql
-- Step 1: Verify product base price
SELECT e.entity_id, e.sku, a.attribute_code, d.value
FROM catalog_product_entity e
JOIN catalog_product_entity_decimal d ON e.entity_id = d.entity_id
JOIN eav_attribute a ON d.attribute_id = a.attribute_id
WHERE e.sku = 'test-product-001'
  AND a.attribute_code IN ('price', 'special_price');
```

```sql
-- Step 2: Verify tier prices
SELECT
    tp.entity_id,
    tp.customer_group_id,
    tp.qty,
    tp.value,
    tp.percentage_value  -- NULL for fixed, populated for % discount
FROM catalog_product_entity_tier_price tp
WHERE tp.entity_id = (SELECT entity_id FROM catalog_product_entity WHERE sku = 'test-product-001');
```

```sql
-- Step 3: Verify catalog rule prices (after cron/reindex)
SELECT
    crpp.product_id,
    crpp.rule_date,
    crpp.website_id,
    crpp.customer_group_id,
    crpp.rule_price,
    crpp.latest_start_date,
    crpp.earliest_end_date
FROM catalogrule_product_price crpp
WHERE crpp.product_id = (SELECT entity_id FROM catalog_product_entity WHERE sku = 'test-product-001')
  AND crpp.rule_date = CURDATE();
```

```sql
-- Step 4: Verify the FINAL price in index (the winner)
SELECT
    pip.entity_id,
    pip.customer_group_id,
    pip.website_id,
    pip.price AS regular_price,
    pip.final_price,        -- This is what the customer pays (pre-cart)
    pip.min_price,          -- Lowest possible (best tier + best rule)
    pip.max_price,
    pip.tier_price          -- Best applicable tier price (NULL if none)
FROM catalog_product_index_price pip
WHERE pip.entity_id = (SELECT entity_id FROM catalog_product_entity WHERE sku = 'test-product-001')
ORDER BY pip.customer_group_id;
```

### Reading the Results — What Should You See?

```
Expected for customer_group_id = 1 (General), qty=1:

  regular_price = 100.00   (original price attribute)
  tier_price    = 80.00    (best tier price regardless of qty threshold in index)
  final_price   = 76.50    (winner: special price $85, then 10% cat rule = $76.50)
  min_price     = 72.00    (tier $80 × 10% cat rule = $72.00 -- best possible)
  max_price     = 100.00   (undiscounted regular price)

NOTE: final_price does NOT use tier_price unless qty threshold met at order time
      The index stores tier_price separately so frontend can show "from $X" messaging
      The actual price applied at checkout depends on cart quantity
```

> **Exam focus:** `min_price` in the index represents the absolute best price the customer could get (best tier + all applicable catalog rules). This is used for the "as low as" display on PLPs. `final_price` is the standard single-unit price after catalog discounts.

### Triggering Reindex After Setup

```bash
# After creating catalog rule, special price, and tier price:

# 1. Apply catalog rules (normally done by cron)
bin/magento indexer:reindex catalogrule_rule

# 2. Reindex prices (reads catalog rules into price index)
bin/magento indexer:reindex catalog_product_price

# 3. Flush cache to see new prices on frontend
bin/magento cache:flush full_page block_html
```

---

## 14. Scenario-Based Decision Practice

### Scenario 1: Third-Party Integration on Product Save

> "A client needs to push product data to a PIM system every time a product is saved in Magento. The PIM API can take 2-5 seconds. What is the correct architecture?"

**Analysis:**
- PIM sync is **non-critical** to the product save operation itself
- 2-5 second API call would make **every product save** feel slow in Admin
- The Admin user doesn't need the PIM to confirm before proceeding
- Network failures should not roll back product saves

**Correct Answer:** Event Observer on `catalog_product_save_after` → publish message to queue → consumer makes PIM API call asynchronously.

**Wrong Answers:**
- Plugin (around) on `ProductRepository::save()` — adds latency to Admin save
- Synchronous API call in Observer — still blocks (Observers are synchronous in Magento)
- Preference on `ProductRepository` — unnecessary coupling

---

### Scenario 2: Custom Price Logic for B2B Customer Segment

> "A wholesale customer group should see prices that are 15% lower than the catalog price, but ABOVE any active special prices. How do you implement this?"

**Analysis:**
- Catalog Price Rules apply **after** special prices (they use min())
- If special price is $85 and wholesale rule gives 15% off $100 = $85 — tie goes to both showing $85
- If special price is $80 and wholesale rule gives $85 — min() picks $80 (special wins)

**Correct Answer:** Customer Group Tier Price (qty=1) at 15% discount **is not** what they want — they want 15% off but not lower than special. This requires a **Catalog Price Rule** scoped to the Wholesale customer group with "Percentage of original price" at 85%. But special price will still win if it's lower (by design).

**The Trick:** You **cannot** make a catalog rule "win" over a special price — the waterfall always takes the minimum. If the requirement is truly "wholesale price but never lower than special," that is a custom price model requiring a plugin on the price calculation, not a standard catalog rule.

> **Exam focus:** When a requirement contradicts the standard price waterfall, the answer involves **custom price calculation**, not creatively combining standard price types.

---

### Scenario 3: High-Volume Order Processing

> "The client processes 50,000 orders per day and needs to send each order to a warehouse management system. Orders spike to 500/minute during peak hours. What queue solution?"

**Analysis:**
- 500 orders/minute = high throughput
- WMS integration is time-sensitive but not checkout-blocking
- Message ordering may matter (cancellations after initial send)
- DB queue polling interval introduces latency; at 500/min with 5s poll = messages queued for up to 5s

**Correct Answer:** RabbitMQ with a dedicated exchange/queue for WMS messages. Multiple consumers can scale horizontally. Dead Letter Exchange for failed WMS API calls with retry.

**Wrong Answer:** DB queue — polling-based, doesn't scale to 500/min without significant DB load, no DLQ support natively.

---

### Scenario 4: Module Modifying a Gateway Command Class

> "You need to add logging to `Magento\Payment\Gateway\Command\GatewayCommand::execute()`. What is the correct approach?"

> **Correction:** `GatewayCommand` is **NOT a final class** — `class GatewayCommand implements CommandInterface` with no `final` keyword (confirmed in `vendor/magento/module-payment/Gateway/Command/GatewayCommand.php:26`). A plugin on its `execute()` method IS possible. The scenario is retained here as a Decorator pattern teaching example — apply this reasoning when you encounter a class that actually IS final.

**Analysis (for a genuinely final class):**
- Plugin is **impossible** on a `final` class — interceptor generation will fail at compile time
- Preference would work but replaces the class entirely (high risk for payment flows)
- Check if an event fires during `execute()` — use observer if so
- Decorator pattern: inject your logging class that wraps the interface

**For `GatewayCommand` specifically (NOT final):**
- A plugin on `GatewayCommand::execute()` would compile and work correctly
- The Decorator-on-interface approach is still architecturally superior for extensibility

**Correct Answer (for a final class scenario):**
1. Check for `payment_gateway_command_execute_before/after` events
2. If none exist, implement a **Decorator** wrapping `CommandInterface`
3. Register via DI preference on the **interface** (not the concrete class)
4. Delegate to the original while adding logging

---

## Quick-Reference Checklist

### Architecture Decision Rules

- [ ] **Plugin** = modify method behavior; requires non-final class; use before/after when possible, around only when skipping is needed
- [ ] **Event Observer** = react to something; non-critical path; cannot modify return value of triggering code
- [ ] **Preference** = ONLY for implementing an interface; never on concrete classes unless absolutely last resort
- [ ] **Around plugin** that skips `$proceed()` breaks all subsequent plugins in the chain
- [ ] **Plugin on final class** = compile-time error; use Decorator via DI instead
- [ ] **Repository** = all cross-module data access; returns interface/DTO; uses `SearchCriteriaInterface`
- [ ] **Collection** = internal/bulk/indexing use only; never cross module boundaries
- [ ] **Async** = any non-critical external call (email, ERP sync, fraud check); any long-running process
- [ ] **Sync** = payment, inventory check at submit, auth, price calculation
- [ ] **Varnish** = high-traffic production; offloads PHP entirely; requires ESI for dynamic blocks
- [ ] **Redis FPC** = dev/staging/low-traffic; PHP still runs but page served from Redis
- [ ] **DB Queue** = low-medium volume; no infrastructure overhead; no DLQ natively
- [ ] **RabbitMQ** = high-volume; guaranteed delivery; built-in DLQ; recommended for EE MSI at scale (MSI consumers technically work with DB queue but Adobe recommends AMQP for production)
- [ ] **ObjectManager direct use** = NEVER in application code; only valid in framework-generated classes
- [ ] **Business logic in templates** = never; use ViewModel or Block methods
- [ ] **External API in checkout sync** = never; use async queue post-order-placement
- [ ] **No cache invalidation** = always implement cache tag strategy when writing to entities

### Catalog Pricing Rules

- [ ] Price waterfall order: Regular → Special → Tier → Group → Catalog Rule → [Cart Rule at runtime]
- [ ] Each step applies `min(current, new)` — the lowest price wins
- [ ] **Catalog rules** apply at **index time**; visible on PLP/PDP; stored in `catalog_product_index_price`
- [ ] **Cart rules** apply at **cart time**; never reflected in price index; not visible on PLP
- [ ] `catalog_product_index_price` rows = products × customer groups × websites (multiplicative!)
- [ ] `final_price` = winning price after all catalog-level discounts
- [ ] `min_price` = best possible price (best tier × best catalog rule) — used for "as low as" display
- [ ] `tier_price` in index = best available tier price (not qty-gated at index time)
- [ ] Catalog rules require cron (`catalogrule_apply_all`) to take effect
- [ ] FPT = fixed fee, not reduced by discounts, shown as separate line item
- [ ] Tax row-based = recommended; unit-based can cause rounding discrepancies
- [ ] **EE SharedCatalog** tier prices override standard tier prices for assigned customer groups
- [ ] **EE NegotiableQuote** price overrides ALL catalog and cart prices; stored in quote, not index
- [ ] Adding more customer groups directly increases reindex time and index table size
- [ ] `catalogrule_product_price` → feeds into → `catalog_product_index_price` (two-step process)

### Exam Scenario Triggers

- [ ] "External API in checkout" → async queue answer
- [ ] "Cross-module data access" → Repository, never Collection
- [ ] "Discount visible on product listing" → Catalog Price Rule (not Cart Rule)
- [ ] "Plugin on final class" → Decorator or Event Observer
- [ ] "Multiple extensions modify same method" → Plugins with sortOrder (NOT multiple preferences)
- [ ] "Adding customer groups affects performance" → Price index row count multiplication
- [ ] "Catalog rule not appearing immediately" → Cron dependency for `catalogrule_apply_all`
- [ ] "B2B wholesale price" → Shared Catalog tier price or Customer Group tier price
- [ ] "Sales rep manually overrides price per deal" → NegotiableQuote (EE only)
- [ ] "High volume order → WMS" → RabbitMQ with consumer scaling
- [ ] "Low volume order → ERP" → DB Queue acceptable
- [ ] "Cache invalidation after direct DB write" → Must manually clean cache tags + trigger indexer
