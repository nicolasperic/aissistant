# Scalability Patterns + Order Management Architecture
### Adobe Commerce Architect Exam — Week 3, Section 2 Review + Section 3 Configure & Deploy

---

## Table of Contents

1. [Multi-Store Hierarchy](#1-multi-store-hierarchy)
2. [Shared Catalog (EE)](#2-shared-catalog-ee)
3. [Per-Website Currencies](#3-per-website-currencies)
4. [Horizontal Scaling Architecture](#4-horizontal-scaling-architecture)
5. [Split Database — History and Deprecation](#5-split-database--history-and-deprecation)
6. [Cloud Pro DB Architecture for High-Traffic](#6-cloud-pro-db-architecture-for-high-traffic)
7. [Async Order Processing (EE)](#7-async-order-processing-ee)
8. [Deferred Stock via InventorySales](#8-deferred-stock-via-inventorysales)
9. [Order States vs. Statuses](#9-order-states-vs-statuses)
10. [Quote-to-Order Flow](#10-quote-to-order-flow)
11. [Inventory Reservation Lifecycle](#11-inventory-reservation-lifecycle)
12. [Checkout Extensibility](#12-checkout-extensibility)
13. [EE Order Management vs. CE](#13-ee-order-management-vs-ce)
14. [Architect Decision Framework](#14-architect-decision-framework)
15. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Multi-Store Hierarchy

### The Three-Tier Model

```
Website
  |
  +-- Store (Root Category assigned here)
        |
        +-- Store View (Language / locale layer)
        +-- Store View
  +-- Store
        |
        +-- Store View
```

Each tier isolates a specific concern:

| Tier | Primary Purpose | Typical Scope |
|---|---|---|
| **Website** | Price scope, payment methods, customer accounts | Brand or region |
| **Store** | Root category, independent product catalog tree | Product line or sub-brand |
| **Store View** | Language, translation, locale, currency display | Language/locale |

### Scope Isolation Rules

- **Customer accounts** are scoped to **website** by default (configurable: `Stores > Config > Customer > Account Sharing`)
- **Prices** are scoped to **website** when `catalog/price/scope = 1`
- **Products** exist globally but are *assigned* to websites; visibility is per store view
- **Categories** belong to a **store** via root category assignment

**Exam focus:**
- A new store *must* have a root category; two stores under the same website can share a root category but then share the same navigation tree — this is an architectural anti-pattern if independent catalogs are required
- Customer accounts shared globally means a customer logging into Website A can see order history from Website B — a data privacy architectural concern
- Changing price scope from Global to Website is a destructive migration requiring re-indexing; recommend planning this at project inception

### Config Hierarchy Override Order

```
Default Config
    |
    v
Website Config  (overrides Default)
    |
    v
Store Config    (overrides Website)
    |
    v
Store View Config (overrides Store)
```

**Exam focus:**
- Configuration inheritance flows downward; a more specific scope always wins
- `use_default` flag at each level controls whether the child inherits or overrides
- System-level configs set via `app/etc/env.php` or `config.php` override everything (deploy-time lock)

---

## 2. Shared Catalog (EE)

### What It Is

Shared Catalog is an **Adobe Commerce (EE) exclusive** feature that enables B2B merchants to present different product sets and prices to different company groups.

```
Shared Catalog
  |
  +-- Products assigned (subset of global catalog)
  +-- Custom Prices per product/tier
  +-- Assigned to one or more Customer Groups
        |
        +-- Company A (Group: Wholesale) --> Shared Catalog A
        +-- Company B (Group: Retail)   --> Shared Catalog B
        +-- Guest / Public              --> Public Catalog
```

### Architecture Implications

- The **Public Shared Catalog** replaces the standard catalog when the B2B shared catalog feature is enabled
- Prices stored in `catalog_product_entity_decimal` are **overridden** by shared catalog price records in `shared_catalog_product_item`
- Shared catalogs trigger re-indexing of the `catalog_rule`, `catalogsearch_fulltext`, and price indexes on assignment changes

**Exam focus:**
- Shared Catalog is EE/B2B module only; proposing it for CE is architecturally incorrect
- When a product is removed from all shared catalogs, it becomes invisible to all logged-in B2B buyers — not just the one removed catalog
- Shared Catalog + Per-Website Pricing creates a compound complexity: the price waterfall is Shared Catalog price → Website price → Global price

---

## 3. Per-Website Currencies

### Configuration

```xml
<!-- app/etc/config.php excerpt (locked at deploy) -->
'system' => [
    'default' => [
        'currency' => [
            'options' => [
                'base' => 'USD',    // Base currency — used for all calculations
                'default' => 'USD', // Display default
                'allow' => 'USD,EUR,GBP'
            ]
        ]
    ],
    'websites' => [
        'eu_website' => [
            'currency' => [
                'options' => [
                    'base' => 'EUR',
                    'default' => 'EUR'
                ]
            ]
        ]
    ]
]
```

### Base vs. Display Currency

| Currency Type | Purpose | Can Be Changed After Orders Exist? |
|---|---|---|
| **Base Currency** | All order totals stored in DB in this currency | **No** — data integrity risk |
| **Default Display** | What the customer sees on first visit | Yes |
| **Allowed Currencies** | Switcher options in storefront | Yes |

**Exam focus:**
- The base currency is the **accounting currency** — changing it mid-operation is an architectural mistake; it breaks historical reporting
- Per-website base currency means Website A (USD) and Website B (EUR) store orders in different currencies — cross-website reporting requires currency conversion logic
- Currency conversion rates must be fetched/updated via cron (`currency_rates_update`) or manually; stale rates are a business risk

---

## 4. Horizontal Scaling Architecture

### The Stateless App Server Requirement

For horizontal scaling (multiple PHP app nodes behind a load balancer), the application **must be stateless**. This means:

```
                    +------------------+
                    |  Load Balancer   |
                    +------------------+
                         /        \
              +-----------+    +-----------+
              | App Node 1|    | App Node 2|
              | (PHP-FPM) |    | (PHP-FPM) |
              +-----------+    +-----------+
                    |                |
        +-----------+----------------+-----------+
        |           |                |           |
   +--------+  +---------+    +----------+  +-------+
   | MySQL  |  |  Redis  |    | NFS/Remote|  | ES/OS |
   | DB     |  | Session |    | Storage   |  | Search|
   +--------+  +---------+    +----------+  +-------+
```

### What Must Be Shared (Not Node-Local)

| Resource | Problem if Node-Local | Solution |
|---|---|---|
| **PHP Sessions** | User logged in on Node 1 gets logged out on Node 2 | Redis session storage |
| **pub/media** | Image uploaded on Node 1 missing on Node 2 | NFS mount or remote storage (S3/Azure Blob) |
| **pub/static** | Deployed static assets inconsistent | Deploy to shared volume before switchover |
| **var/cache** | Stale cache on one node | Redis cache backend (shared) |
| **var/log** | Logs split across nodes | Centralized log aggregation (CloudWatch, Splunk) |
| **Generated code** | `generated/` directory compiled per node | Pre-compile + deploy; do not auto-generate in production |

### Remote Storage Configuration (2.4.x+)

```php
// app/etc/env.php
'remote_storage' => [
    'driver' => 's3',
    'config' => [
        'bucket' => 'my-magento-media',
        'region' => 'us-east-1',
        'credentials' => [
            'key'    => 'AWS_KEY',
            'secret' => 'AWS_SECRET',
        ]
    ]
]
```

**Exam focus:**
- NFS is the **legacy** shared storage approach; it introduces I/O bottlenecks and single-point-of-failure risk
- Remote Storage (S3/Azure Blob) via the `remote_storage` config is the **modern, recommended** approach for cloud deployments
- Stateless app servers require **sticky sessions OFF** (round-robin LB) once Redis session storage is configured; with file sessions, sticky sessions are required — this is a common architect trap question
- `pub/static` should be pre-compiled during deploy, not auto-generated at request time; missing static files in production indicate a broken deploy pipeline, not a permissions issue

### Varnish + Full-Page Cache in Scaled Environments

```
Request --> Varnish (FPC) --> App Nodes (cache miss only)
```

- Varnish cache is shared across all app nodes (single Varnish or Varnish cluster)
- Cache tags (`X-Magento-Tags`) drive granular invalidation
- In Cloud, Fastly CDN replaces Varnish but uses the same tag-based invalidation protocol

**Exam focus:**
- When an architect says "add more app servers," the first question should be: "Is session storage centralized?" Not doing so causes phantom logout bugs that are hard to reproduce
- Varnish purge must be network-accessible from all app nodes; a firewall rule blocking purge requests means stale cache persists even after cache flush from Admin

---

## 5. Split Database — History and Deprecation

### What It Was

Adobe Commerce (EE only) historically supported splitting the single MySQL database into three specialized databases:

```
+------------------+     +-------------------+     +------------------+
|   Main DB        |     |   Checkout DB     |     |   OMS DB         |
|  (catalog,       |     |  (quote, payment, |     |  (order, invoice,|
|   customer,      |     |   sales_payment_  |     |   shipment,      |
|   CMS, config)   |     |   transaction)    |     |   creditmemo)    |
+------------------+     +-------------------+     +------------------+
```

### Why It Existed

- **Checkout DB**: Isolated high-write checkout operations (quote creation, payment processing) from read-heavy catalog queries
- **OMS DB**: Isolated order fulfillment operations from storefront traffic
- Goal: Reduce lock contention and allow independent scaling of database resources

### Why It Was Removed (2.4.x)

| Reason | Detail |
|---|---|
| **Complexity** | Cross-database joins impossible in MySQL; required code workarounds |
| **Replication lag** | Data consistency issues between DBs during distributed transactions |
| **Modern alternatives** | Cloud-native DB scaling (read replicas, Aurora Serverless) made it obsolete |
| **Maintenance burden** | Schema changes required coordination across three DBs |

**Exam focus:**
- Split DB was **EE only** and was **deprecated in 2.4.0**, removed in 2.4.x progression
- If an exam scenario asks "how do you scale the database tier in 2.4.x," the answer is **read replicas + Redis caching**, NOT split database
- Knowing split DB *existed* is important for legacy upgrade scenarios; proposing it for new projects is architecturally wrong

---

## 6. Cloud Pro DB Architecture for High-Traffic

### Cloud Pro Three-DB Architecture

Even though the application-level split DB was deprecated, **Adobe Commerce Cloud Pro** environments can be provisioned with a conceptually similar three-database architecture at the **infrastructure level**:

```
                      [MariaDB Cluster - Cloud Pro]
                               |
           +-------------------+--------------------+
           |                   |                    |
   +---------------+   +---------------+   +---------------+
   |   Main DB     |   |  Checkout DB  |   |   OMS DB      |
   | (Read Replica |   | (Read Replica |   | (Read Replica |
   |  supported)   |   |  supported)   |   |  supported)   |
   +---------------+   +---------------+   +---------------+
```

### Key Architectural Differences from Deprecated Split DB

| Aspect | Deprecated App-Level Split | Cloud Pro Infrastructure Split |
|---|---|---|
| **Implementation** | Application code routes queries | Infrastructure-level DB separation |
| **Cross-DB joins** | Broken / workaround needed | Not an application concern |
| **Configuration** | `env.php` multi-DB config | Infrastructure provisioned by Adobe |
| **Availability** | CE/EE on-prem | Cloud Pro only |

**Exam focus:**
- This is an **option that exists**, not the default; it requires Adobe/partner provisioning
- Cloud Pro DB split is an **infrastructure pattern**, not an application code pattern — the application sees a single logical DB connection per concern
- For the exam: if asked about high-traffic order processing at scale on Cloud, Cloud Pro DB split + AsyncOrder + Redis is the correct architectural stack

---

## 7. Async Order Processing (EE)

### What AsyncOrder Does

Without AsyncOrder:
```
Customer clicks "Place Order"
        |
        v
[Synchronous] CartManagementInterface::placeOrder()
        |
        v
Order created in DB
        |
        v
Response returned to customer
```

With AsyncOrder (EE):
```
Customer clicks "Place Order"
        |
        v
Message published to Queue (RabbitMQ / DB Queue)
        |
        v
Response returned IMMEDIATELY ("Order received")
        |
        v (async, in background)
Consumer processes queue message
        |
        v
CartManagementInterface::placeOrder() runs
        |
        v
Order created in DB, confirmation email sent
```

### Configuration

AsyncOrder is enabled via **deployment config** (env.php), not system config. It is set during setup:

```bash
# Enable AsyncOrder via setup:config:set (writes to env.php under 'checkout/async')
bin/magento setup:config:set --checkout-async=1

# Start the consumer
bin/magento queue:consumers:start placeOrderProcessor
```

The queue configuration (confirmed in `module-async-order/etc/communication.xml`):

```xml
<!-- Queue topic name in communication.xml — actual topic -->
<topic name="async_order.placeOrder" request="Magento\AsyncOrder\Api\Data\AsyncOrderMessageInterface">
    <handler name="placeOrderProcessor" type="Magento\AsyncOrder\Model\Consumer" method="process" />
</topic>
```

```xml
<!-- Consumer (queue_consumer.xml): queue name is "placeOrder" -->
<consumer name="placeOrderProcessor" queue="placeOrder" handler="Magento\AsyncOrder\Model\Consumer::process" />
```

> **Note:** The config path for the enabled flag is `checkout/async` in `env.php`, NOT a system config path like `sales/async_order/enabled`. Use `setup:config:set --checkout-async=1`, not `config:set`.

### When to Recommend AsyncOrder

| Scenario | Recommend AsyncOrder? | Why |
|---|---|---|
| Flash sale / high concurrency | **Yes** | Prevents checkout timeout, absorbs traffic spikes |
| Low-traffic B2B | No | Adds operational complexity without benefit |
| Order confirmation must be instant | **No** | Order is "pending" until queue processed |
| 3rd party OMS integration | **Yes** | Decouples order creation from fulfillment |

**Exam focus:**
- AsyncOrder is **EE only**
- The customer's order confirmation page may show "pending" state until the queue consumer processes — this must be communicated in UX design
- If the queue consumer dies, orders stack up in the queue — operational monitoring of queue depth is an **architectural requirement** when using AsyncOrder
- RabbitMQ is the recommended message broker for production; DB-based queues are for development only

---

## 8. Deferred Stock via InventorySales

### The MSI (Multi-Source Inventory) Reservation Model

Adobe Commerce 2.3+ introduced MSI with a reservation-based inventory model. Stock is not immediately decremented at order placement.

```
Order Placed
    |
    v
[Reservation Created] -- negative qty in inventory_reservation table
    | (salable qty = qty_on_hand + sum(reservations))
    |
    v
Order Shipped (source deducted)
    |
    v
[Source Item qty decremented] in inventory_source_item
    |
    v
[Compensation Reservation Created] -- positive qty to cancel out original reservation
```

### Key Tables

```sql
-- Reservation table (event log, never updated — append only)
SELECT * FROM inventory_reservation;
-- reservation_id | stock_id | sku | quantity | metadata

-- Source items (physical stock per source)
SELECT * FROM inventory_source_item;
-- source_code | sku | quantity | status
```

### Salable Quantity Calculation

```
Salable Qty = Physical Qty (source items) + Sum of all reservations for that stock
```

Example:
- Physical qty: 100
- Reservation from Order #1: -1
- Reservation from Order #2: -1
- **Salable Qty = 98** (even if physical still shows 100 until shipment)

**Exam focus:**
- Reservations are **append-only** — you never UPDATE a reservation, you add a compensating reservation
- This is the "deferred stock" model: physical stock is decremented at **shipment**, not at **order placement**
- The `InventorySalesAdminUi` module provides the salable qty display in Admin; missing this module = no salable qty display
- Canceling an order creates a **positive compensation reservation** (rollback), not a physical stock increment — the physical increment happens when the source item is manually returned or via RMA

---

## 9. Order States vs. Statuses

### The Two-Layer Model

```
STATE (system-level, hardcoded)
  |
  +-- STATUS (merchant-configurable label, mapped to state)
  +-- STATUS
  +-- STATUS
```

### All Order States

| State | Description | Typical Entry Trigger |
|---|---|---|
| `new` | Order placed, not yet processed | `CartManagementInterface::placeOrder()` |
| `pending_payment` | Awaiting payment gateway confirmation | Redirect payment methods |
| `processing` | Payment received, invoice created | Invoice creation |
| `complete` | Fully shipped and invoiced | Shipment with tracking created |
| `closed` | Credit memo issued against complete order | CreditMemo creation |
| `canceled` | Order canceled before fulfillment | Manual or automatic cancellation |
| `holded` | Manually held; no automated processing | Admin: Hold action |
| `payment_review` | Payment flagged for review (fraud check) | Payment gateway fraud signals |

All states confirmed as constants in `Magento\Sales\Model\Order` (module-sales/Model/Order.php:89–103): `STATE_NEW`, `STATE_PENDING_PAYMENT`, `STATE_PROCESSING`, `STATE_COMPLETE`, `STATE_CLOSED`, `STATE_CANCELED`, `STATE_HOLDED`, `STATE_PAYMENT_REVIEW`.

### State vs. Status Distinction

```php
// State: system constant, cannot be changed by merchant
$order->getState(); // returns e.g. 'processing'

// Status: merchant-configurable label
$order->getStatus(); // returns e.g. 'processing' or custom 'fraud_review'

// A state can have MULTIPLE statuses mapped to it
// e.g., state 'processing' can have statuses:
//   - 'processing' (default)
//   - 'fraud_review' (custom)
//   - 'awaiting_fulfillment' (custom)
```

### Status Configuration

```
Admin > Stores > Order Status > Create New Status
    |
    +-- Status Code: awaiting_fulfillment
    +-- Status Label: Awaiting Fulfillment
    +-- Assign to State: Processing
```

**Exam focus:**
- **State is immutable by merchants** — it is controlled by application logic and cannot be renamed or reassigned
- **Status is the merchant-facing label** — merchants create custom statuses and assign them to states
- An order can only be in one state at a time, but a state can have many possible statuses
- The `holded` state is unique: the order retains its previous status label but state changes to `holded`; unholding reverts to previous state
- `closed` is different from `canceled`: closed = fulfilled then credit memo'd; canceled = never fulfilled

---

## 10. Quote-to-Order Flow

### The Complete Lifecycle

```
Guest/Customer
    |
    v
[Quote Created] -- sales_quote table
    |
    | (items added, address set, shipping selected, payment set)
    v
[CartManagementInterface::placeOrder($cartId, ?PaymentInterface $paymentMethod)]
    |
    +-- Validates quote (stock, prices, coupon)
    +-- Creates Order record (sales_order)
    +-- Creates OrderAddress records
    +-- Creates OrderItems
    +-- Deactivates Quote (is_active = 0)
    |
    v
[Payment Capture / Authorization]
    |
    v
[Invoice Created] -- sales_invoice
    | (marks order as 'processing')
    |
    v
[Shipment Created] -- sales_shipment
    | (marks order as 'complete' if fully shipped)
    |
    v
[Credit Memo Created] -- sales_creditmemo
    | (marks order as 'closed')
    v
[End State]
```

### Key Interfaces

```php
// Place Order — primary checkout entry point (module-quote)
use Magento\Quote\Api\CartManagementInterface;
// CartManagementInterface::placeOrder($cartId, ?PaymentInterface $paymentMethod = null): int
// Implemented by: Magento\Quote\Model\QuoteManagement

// Lower-level order lifecycle management
use Magento\Sales\Api\OrderManagementInterface;
// OrderManagementInterface::place(OrderInterface $order): OrderInterface

// Invoice — use InvoiceService (not InvoiceManagementInterface) for prepareInvoice
use Magento\Sales\Model\Service\InvoiceService;
$invoice = $invoiceService->prepareInvoice($order); // Magento\Sales\Model\Service\InvoiceService
$invoice->register(); // triggers payment capture for CAPTURE_ONLINE case

// Shipment
use Magento\Sales\Api\ShipmentRepositoryInterface;

// Credit Memo
use Magento\Sales\Api\CreditmemoManagementInterface;
```

> **Important distinction:** There is no standalone `PlaceOrderInterface` with an `execute()` method in the Commerce core. The correct entry point for order placement is `CartManagementInterface::placeOrder()` (quote/checkout side) or `OrderManagementInterface::place()` (order lifecycle side). `InvoiceManagementInterface` does NOT have `prepareInvoice()` — that method is on `Magento\Sales\Model\Service\InvoiceService`.

### Quote vs. Order Data Model

| Attribute | Quote | Order |
|---|---|---|
| Table | `sales_quote` | `sales_order` |
| Items | `sales_quote_item` | `sales_order_item` |
| Addresses | `sales_quote_address` | `sales_order_address` |
| Payments | `sales_quote_payment` | `sales_order_payment` |
| Grand Total | Calculated each load | Stored snapshot |
| Lifetime | Configurable (30-60 days default) | Permanent |

### When to Use Which Interface

| Requirement | Use |
|---|---|
| Standard checkout order placement | `CartManagementInterface::placeOrder()` |
| Programmatic order creation (Admin, API, import) | `CartManagementInterface::placeOrder()` after building a quote |
| Order state transitions (cancel, hold, unhold) | `OrderManagementInterface` |
| Plugin on order placement | Plugin on `CartManagementInterface::placeOrder()` |
| Prepare an invoice for an order | `InvoiceService::prepareInvoice()` then `$invoice->register()` |

**Exam focus:**
- Prices in orders are **snapshots** — changing a product price after order placement does NOT change the order total
- The quote is not deleted when an order is placed; it is **deactivated** (`is_active = 0`); this allows re-ordering
- `CartManagementInterface::placeOrder()` is the **single entry point** — customizations to order placement should plugin/observe this interface, not override the quote-to-order conversion directly
- Invoice creation triggers **payment capture** for authorize-and-capture flows (`Invoice::register()` calls `capture()` when `canCapture()` is true)

---

## 11. Inventory Reservation Lifecycle

### Full Lifecycle Diagram

```
[Order Placed]
    |
    v
inventory_reservation: qty = -1 (for each item)
(Salable qty decreases immediately)
    |
    |-- [Order Canceled] -------------------------+
    |       |                                     |
    |       v                                     |
    |   inventory_reservation: qty = +1           |
    |   (Compensation reservation)                |
    |   Salable qty restored                      |
    |                                             |
    +-- [Order Shipped] --------------------------+
            |
            v
    inventory_source_item.quantity decremented
    (Physical stock reduced)
            |
            v
    inventory_reservation: qty = +1
    (Compensation reservation — cancels original)
    Net reservations = 0
    Salable qty reflects actual physical reduction
```

### Reservation States Summary

| Event | Reservation Entry | Physical Stock Change |
|---|---|---|
| Order placed | `-qty` | No |
| Order canceled | `+qty` (compensation) | No |
| Order shipped | `+qty` (compensation) | Yes (source item decremented) |
| RMA / Return received | No reservation | Yes (source item incremented) |

### `inventory_reservation` Table Structure

```sql
-- Confirmed schema (module-inventory/etc/db_schema.xml)
CREATE TABLE inventory_reservation (
    reservation_id  INT AUTO_INCREMENT PRIMARY KEY,
    stock_id        INT NOT NULL,
    sku             VARCHAR(64) NOT NULL,
    quantity        DECIMAL(10,4) NOT NULL,  -- negative = reserved
    metadata        VARCHAR(255)             -- e.g., '{"object_type":"order","object_id":"123"}'
);
-- Composite index on (stock_id, sku, quantity)
```

**Exam focus:**
- The reservation table is **immutable / append-only** — this is an event sourcing pattern; compensating entries are added, not updates/deletes
- `bin/magento inventory:reservations:cleanup` is a maintenance command that removes zero-net reservations; running this in production is safe but should be scheduled, not run ad hoc
- Inconsistency between reservations and source items indicates a bug or failed consumer — `bin/magento inventory:reservations:list-inconsistencies` diagnoses this

---

## 12. Checkout Extensibility

### Custom Checkout Step (JS Component)

The checkout is built on Knockout.js + RequireJS. Adding a custom step requires:

**1. Define the JS component:**

```javascript
// view/frontend/web/js/view/custom-step.js
define([
    'ko',
    'uiComponent',
    'Magento_Checkout/js/model/step-navigator'
], function (ko, Component, stepNavigator) {
    'use strict';

    return Component.extend({
        defaults: {
            template: 'Vendor_Module/custom-step'
        },

        initialize: function () {
            this._super();
            stepNavigator.registerStep(
                'custom_step',           // step code
                null,                    // alias
                'Custom Step Title',     // title
                this.isVisible,          // visibility observable
                _.bind(this.navigate, this),
                15                       // sort order (shipping=10, payment=20)
            );
            return this;
        },

        navigate: function () {
            // Logic when step becomes active
        },

        isVisible: ko.observable(true)
    });
});
```

**2. Register via layout XML:**

```xml
<!-- view/frontend/layout/checkout_index_index.xml -->
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/layout_generic.xsd">
    <body>
        <referenceBlock name="checkout.root">
            <arguments>
                <argument name="jsLayout" xsi:type="array">
                    <item name="components" xsi:type="array">
                        <item name="checkout" xsi:type="array">
                            <item name="children" xsi:type="array">
                                <item name="steps" xsi:type="array">
                                    <item name="children" xsi:type="array">
                                        <item name="custom-step" xsi:type="array">
                                            <item name="component" xsi:type="string">
                                                Vendor_Module/js/view/custom-step
                                            </item>
                                            <item name="sortOrder" xsi:type="string">2</item>
                                        </item>
                                    </item>
                                </item>
                            </item>
                        </item>
                    </item>
                </argument>
            </arguments>
        </referenceBlock>
    </body>
</page>
```

> **Note:** `checkout.root` is a **block** (`Magento\Checkout\Block\Onepage`), so `<referenceBlock>` is correct here. The shipping step has `sortOrder="10"` and payment has `sortOrder="20"` in `module-checkout/view/frontend/layout/checkout_index_index.xml`.

### Custom Total (PHP Side)

```php
// etc/sales.xml
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Sales:etc/sales.xsd">
    <section name="quote">
        <group name="totals">
            <item name="custom_fee" instance="Vendor\Module\Model\Quote\Total\CustomFee" sort_order="600"/>
        </group>
    </section>
</config>
```

```php
// Model/Quote/Total/CustomFee.php
namespace Vendor\Module\Model\Quote\Total;

use Magento\Quote\Model\Quote\Address\Total\AbstractTotal;

class CustomFee extends AbstractTotal
{
    public function collect(
        \Magento\Quote\Model\Quote $quote,
        \Magento\Quote\Api\Data\ShippingAssignmentInterface $shippingAssignment,
        \Magento\Quote\Model\Quote\Address\Total $total
    ) {
        parent::collect($quote, $shippingAssignment, $total);

        $feeAmount = 10.00; // Custom logic here

        $total->setTotalAmount($this->getCode(), $feeAmount);
        $total->setBaseTotalAmount($this->getCode(), $feeAmount);
        $total->setCustomFee($feeAmount);
        $total->setBaseCustomFee($feeAmount);

        return $this;
    }

    public function fetch(
        \Magento\Quote\Model\Quote $quote,
        \Magento\Quote\Model\Quote\Address\Total $total
    ) {
        return [
            'code'  => $this->getCode(),
            'title' => __('Custom Fee'),
            'value' => $total->getCustomFee()
        ];
    }
}
```

### Key Layout Handle

```
checkout_index_index.xml
```

This is the **only layout handle** for the checkout page. All checkout UI customizations, step additions, and component overrides go through this handle.

**Exam focus:**
- The checkout layout handle `checkout_index_index` is where ALL checkout UI customization happens — there is no separate handle per checkout step
- Custom totals require both: (1) PHP collector in `sales.xml` and (2) JS renderer component for the checkout summary
- Step sort order matters: shipping = 10, billing/payment = 20 by default; a custom step inserted at 15 appears between shipping and payment
- Never modify core Knockout templates directly — always use `requirejs-config.js` to map a custom component to replace the core one

---

## 13. EE Order Management vs. CE

### Feature Comparison

| Feature | CE (Open Source) | EE (Adobe Commerce) |
|---|---|---|
| Basic order management | Yes | Yes |
| Returns (RMA) | **No** | **Yes** |
| AsyncOrder processing | **No** | **Yes** |
| Shared Catalog | **No** | **Yes** |
| Gift Cards | **No** | **Yes** |
| Reward Points | **No** | **Yes** |
| Store Credits | **No** | **Yes** |
| Customer Segments | **No** | **Yes** |
| Order Archive | **No** | **Yes** |
| Customer Balance | **No** | **Yes** |
| Advanced Reporting | **No** | **Yes** |
| B2B Module (Quotes, PO, etc.) | **No** | **Yes (add-on)** |

### RMA (Return Merchandise Authorization) — EE Only

```
Customer requests return
    |
    v
[RMA Created] -- magento_rma table
    |
    +-- Items listed for return
    +-- Return reason selected
    |
    v
[Merchant reviews] -- Admin > Sales > Returns
    |
    +-- Approve / Reject / Partially approve
    |
    v
[Items received by warehouse]
    |
    v
[Credit Memo issued] (if refund applicable)
    |
    v
[Inventory updated] (if restock)
```

**Exam focus:**
- **RMA is EE only** — proposing an RMA workflow for CE requires custom module development or third-party extension
- The RMA entity is separate from the order; a credit memo can exist without an RMA and vice versa
- In the Admin sandbox (ac-sandbox), the "Returns" menu item under Sales only appears with EE license — its absence in CE Admin is intentional, not a bug

### Order Archive (EE Only)

- Moves orders older than X days from `sales_order` to `sales_order_archive`
- Reduces main order grid query load
- Archived orders appear under **Sales > Archive**

**Exam focus:**
- Order Archive improves Admin performance for high-volume merchants — it's an architectural recommendation for merchants with 1M+ orders
- Archived orders can still be viewed and credit memo'd; they are not deleted

---

## 14. Architect Decision Framework

### Scenario-Based Decision Trees

**Scenario 1: Client needs to serve US and EU customers with different product catalogs and prices**

```
Decision:
- Same legal entity? --> One Magento instance, two Websites (US + EU)
- Different product sets? --> Two Stores under respective Websites
- Different languages? --> Multiple Store Views per Store
- EU prices in EUR? --> Per-website base currency = EUR for EU website
- EU-only products? --> Assign products to EU website only
```
*Wrong answer: Separate Magento instances. Adds DevOps complexity without benefit unless truly separate business operations.*

---

**Scenario 2: Black Friday expected 10x normal traffic. What DB strategy?**

```
Current version: 2.4.x (latest)

Options evaluated:
A) Split Database --> WRONG (deprecated/removed)
B) Add more app servers --> Partial (doesn't help DB bottleneck)
C) Read replicas for MySQL + Redis FPC + AsyncOrder (EE) --> CORRECT
D) Cloud Pro three-DB infrastructure split --> CORRECT if on Cloud Pro
```

**Architect reasoning**: The bottleneck at high traffic is typically:
1. PHP execution (solved by horizontal app scaling)
2. DB write contention (solved by AsyncOrder queuing writes)
3. DB read load (solved by read replicas + aggressive caching)
4. Media/static delivery (solved by CDN)

---

**Scenario 3: Custom checkout step for B2B PO number entry**

```
Decision:
- Is it EE? --> B2B module may already have PO support (check first)
- Need custom step? --> checkout_index_index.xml + stepNavigator.registerStep()
- Need to save PO# to order? --> Observer on sales_order_place_after OR
  checkout total collector that adds order extension attribute
- Must persist to quote first? --> Quote extension attribute + save in collector
```
*Wrong answer: Override QuoteManagement directly. Violates Open/Closed Principle. Use plugin/observer.*

---

**Scenario 4: Inventory shows wrong salable quantity after bulk import**

```
Diagnosis:
1. Check inventory_reservation table for orphaned reservations
2. Run: bin/magento inventory:reservations:list-inconsistencies
3. Check inventory_source_item for correct physical quantities
4. Reindex: bin/magento indexer:reindex inventory

Root cause options:
- Import updated source_item qty but reservations from old orders still exist
- Compensation reservations not created (queue consumer failure)
```

### The Architect Mindset for Exam Questions

When multiple answers seem valid, apply this filter:

1. **Is it version-appropriate?** (Split DB = wrong for 2.4.x)
2. **Is it edition-appropriate?** (RMA, AsyncOrder = EE only)
3. **Does it respect the single responsibility principle?** (Override vs. Plugin/Observer)
4. **Does it scale?** (NFS = works but scales poorly vs. S3 remote storage)
5. **Does it have operational consequences?** (AsyncOrder requires queue monitoring)
6. **Is there a native solution before custom code?** (B2B PO# support exists in EE B2B module)

**Exam focus:**
- The exam rewards answers that demonstrate understanding of **why** a solution is correct, not just **what** it is
- When two answers both work technically, the architecturally superior answer considers: maintainability, upgrade compatibility, performance at scale, and use of native platform features over custom code
- "Use a plugin" almost always beats "override the class" — but a well-placed observer beats both when the behavior is event-driven

---

## Quick-Reference Checklist

### Multi-Store & Configuration
- [ ] Website → Store → Store View hierarchy and what each tier controls
- [ ] Customer account scope defaults to website; can be set to global
- [ ] Price scope: `catalog/price/scope` = 0 (global) or 1 (website)
- [ ] Config inheritance: Default → Website → Store → Store View (child overrides parent)
- [ ] Shared Catalog is **EE only**; enables per-customer-group product visibility and pricing
- [ ] Base currency is the accounting currency; changing it after orders exist is a data integrity risk
- [ ] Allowed currencies require rate updates via cron (`currency_rates_update`); stale rates are a business risk

### Horizontal Scaling
- [ ] Stateless app servers require: Redis sessions, Redis cache, shared pub/media
- [ ] NFS = legacy shared storage (single point of failure, I/O bottleneck)
- [ ] Remote Storage (S3/Azure Blob) = modern approach via `remote_storage` in env.php
- [ ] Sticky sessions required only with file-based sessions; disable with Redis sessions
- [ ] `pub/static` must be pre-compiled at deploy; never auto-generate in production
- [ ] Varnish/Fastly uses `X-Magento-Tags` for granular cache invalidation
- [ ] Queue consumer monitoring is an operational requirement for any async feature

### Split Database
- [ ] Split DB was **EE only**, deprecated in **2.4.0**
- [ ] Three databases: Main, Checkout, OMS
- [ ] Removed due to: cross-DB join issues, replication lag, modern alternatives
- [ ] For 2.4.x: use read replicas + Redis + AsyncOrder instead
- [ ] Cloud Pro infrastructure-level DB split still exists as an option (not application-level)

### Async Order (EE)
- [ ] AsyncOrder is **EE only**
- [ ] Enabled via `bin/magento setup:config:set --checkout-async=1` (writes to env.php as `checkout/async`)
- [ ] Queue topic: `async_order.placeOrder`; consumer: `placeOrderProcessor`; queue name: `placeOrder`
- [ ] Publishes message to queue and returns immediately; consumer processes asynchronously
- [ ] Order shows "pending" until consumer processes
- [ ] Requires: RabbitMQ setup + `placeOrderProcessor` consumer running
- [ ] DB-based queues = development only; RabbitMQ = production

### Inventory Reservations (MSI)
- [ ] `inventory_reservation` table is append-only (event sourcing pattern)
- [ ] Salable Qty = Physical Qty + Sum(all reservations for that stock)
- [ ] Order placed → negative reservation created (salable qty drops)
- [ ] Order shipped → positive compensation reservation + physical source item decremented
- [ ] Order canceled → positive compensation reservation (no physical change)
- [ ] `bin/magento inventory:reservations:list-inconsistencies` = diagnostic command
- [ ] `bin/magento inventory:reservations:cleanup` = maintenance command (safe in production)

### Order States & Statuses
- [ ] State = system-level, hardcoded, immutable by merchants
- [ ] Status = merchant-configurable label, mapped to a state
- [ ] States: `new`, `pending_payment`, `processing`, `complete`, `closed`, `canceled`, `holded`, `payment_review`
- [ ] One state at a time; many statuses can map to one state
- [ ] `closed` ≠ `canceled`: closed = fulfilled + credit memo'd; canceled = never fulfilled
- [ ] `holded` retains previous status label; unhold reverts to previous state

### Quote-to-Order Flow
- [ ] Quote deactivated (not deleted) when order placed; enables re-order
- [ ] Order prices are snapshots; product price changes do not affect existing orders
- [ ] `CartManagementInterface::placeOrder($cartId, ?PaymentInterface $paymentMethod)` = primary checkout entry point
- [ ] `OrderManagementInterface::place(OrderInterface $order)` = lower-level order lifecycle entry
- [ ] Invoice: use `InvoiceService::prepareInvoice()` then `$invoice->register()` (NOT `InvoiceManagementInterface::prepareInvoice`)
- [ ] `$invoice->register()` triggers payment capture when `canCapture()` is true
- [ ] Shipment creation triggers `complete` state (if fully shipped)
- [ ] Credit memo creation triggers `closed` state

### Checkout Extensibility
- [ ] All checkout UI changes go through `checkout_index_index.xml` layout handle
- [ ] `checkout.root` is a block (`Magento\Checkout\Block\Onepage`) — use `<referenceBlock>`
- [ ] Custom step: `stepNavigator.registerStep()` in JS component
- [ ] Custom total: PHP collector in `sales.xml` + JS renderer for summary
- [ ] Shipping step sort order = 10; payment = 20; insert custom steps between
- [ ] Never modify core Knockout templates; use RequireJS map to replace components

### EE vs. CE Feature Flags
- [ ] **EE only**: RMA, AsyncOrder, Shared Catalog, Gift Cards, Reward Points, Store Credits, Customer Segments, Order Archive, Customer Balance, Advanced Reporting
- [ ] **B2B module** (EE add-on): Company accounts, Purchase Orders, Negotiable Quotes, Requisition Lists
- [ ] RMA is separate entity from credit memo; both can exist independently
- [ ] Order Archive moves old orders to `sales_order_archive`; improves Admin grid performance

### Architect Decision Patterns
- [ ] When asked to scale DB in 2.4.x: read replicas + Redis, NOT split database
- [ ] When asked about high-traffic checkout: AsyncOrder (EE) + RabbitMQ + Cloud Pro DB split
- [ ] When customizing order placement: plugin on `CartManagementInterface::placeOrder()`, not class override
- [ ] Stateless app servers + centralized session (Redis) → sticky sessions OFF
- [ ] Native platform feature always preferred over custom code
