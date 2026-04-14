# Magento 2 EE vs CE Feature Matrix & Architect Scenarios
## Adobe Commerce (Magento 2) — Final Exam Study Notes

---

## Table of Contents

1. [EE vs CE Feature Matrix — Complete Reference](#1-ee-vs-ce-feature-matrix--complete-reference)
2. [Content Staging & Preview — row_id vs entity_id Architecture](#2-content-staging--preview--row_id-vs-entity_id-architecture)
3. [B2B Module Suite — Deep Dive](#3-b2b-module-suite--deep-dive)
4. [Customer Segments & Related Products Rules](#4-customer-segments--related-products-rules)
5. [Gift Cards, Wrapping, Reward Points & Store Credit](#5-gift-cards-wrapping-reward-points--store-credit)
6. [Page Builder — EE vs CE Distinction](#6-page-builder--ee-vs-ce-distinction)
7. [RMA (Return Merchandise Authorization)](#7-rma-return-merchandise-authorization)
8. [Async Order & Deferred Stock Update](#8-async-order--deferred-stock-update)
9. [Advanced Reporting / MBI / BI Essentials](#9-advanced-reporting--mbi--bi-essentials)
10. [CMS Page Hierarchy & Restrictions](#10-cms-page-hierarchy--restrictions)
11. [Live Search (SaaS)](#11-live-search-saas)
12. [Architect Scenario Drills — Why, Not Just What](#12-architect-scenario-drills--why-not-just-what)
13. [Scenario 1 — Customize Without Modifying Vendor Code → Plugin](#13-scenario-1--customize-without-modifying-vendor-code--plugin)
14. [Scenario 2 — Add Data to API Response → Extension Attributes](#14-scenario-2--add-data-to-api-response--extension-attributes)
15. [Scenario 3 — Long Process Without Blocking Checkout → Message Queue](#15-scenario-3--long-process-without-blocking-checkout--message-queue)
16. [Scenario 4 — 503 After Deploy → Varnish Health Check Timing](#16-scenario-4--503-after-deploy--varnish-health-check-timing)
17. [Scenario 5 — Performance Degrades with Catalog Growth → Indexer & OpenSearch](#17-scenario-5--performance-degrades-with-catalog-growth--indexer--opensearch)
18. [Scenario 6 — All Page Cache Invalidated on Every Product Save → Wrong identities()](#18-scenario-6--all-page-cache-invalidated-on-every-product-save--wrong-identities)
19. [Architectural Decision Framework — Why One Answer is Superior](#19-architectural-decision-framework--why-one-answer-is-superior)
20. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. EE vs CE Feature Matrix — Complete Reference

This is the primary memorization target. Internalize not just *what* is EE-only, but *why* each feature requires the EE tier (licensing model, infrastructure complexity, data model changes).

| Feature | CE | EE | EE Reason |
|---|---|---|---|
| Content Staging & Preview | No | Yes | `row_id` data model change; timeline infrastructure |
| B2B: Company Accounts | No | Yes (B2B add-on) | Complex org hierarchy, separate module suite |
| B2B: Shared Catalog | No | Yes (B2B) | Per-company pricing & catalog visibility |
| B2B: Negotiable Quotes | No | Yes (B2B) | Quote workflow engine |
| B2B: Requisition Lists | No | Yes (B2B) | Persistent purchase lists per buyer |
| B2B: Quick Order | No | Yes (B2B) | SKU-based bulk ordering |
| Customer Segments | No | Yes | Real-time segment evaluation engine |
| Related Products Rules | No | Yes | Rule-based upsell/cross-sell engine |
| Gift Cards (virtual/physical/combined) | No | Yes | Gift card account pool management |
| Gift Wrapping | No | Yes | Order/item-level wrapping options |
| Reward Points | No | Yes | Points ledger, exchange rates, expiry |
| Store Credit | No | Yes | Credit balance per customer account |
| Page Builder (native) | No | Yes | Native; CE needs 3rd-party plugin |
| RMA (Return Merch Auth) | No | Yes | Returns workflow, shipping labels |
| Async Order / Deferred Stock | No | Yes | Message queue-backed order placement |
| Advanced Reporting (MBI) | No | Yes | SaaS BI connector |
| CMS Page Hierarchy | No | Yes | Tree-structured CMS with breadcrumbs |
| CMS Restrictions | No | Yes | Category/CMS access by customer group |
| Live Search | No | Yes (SaaS) | Adobe SaaS subscription, separate catalog sync |
| Split Database (deprecated) | No | Legacy EE | Checkout/OMS/default separate DBs |
| Elasticsearch/OpenSearch tuning | Both | Both+ | EE gets priority support configs |
| Varnish Full-Page Cache | Both | Both | Config lives in both; EE adds ESI helpers |
| Full-text search (basic) | CE | Both | CE: MySQL; EE: OpenSearch/Elasticsearch |

> **Exam focus:** The exam will present a feature and ask whether it requires EE, B2B module, or a SaaS subscription. Live Search is *SaaS* (not just EE — it requires a separate subscription and catalog feed sync). B2B features require both EE *and* the B2B extension license.

---

## 2. Content Staging & Preview — row_id vs entity_id Architecture

### The Core Problem Content Staging Solves

In CE, if you edit a product, the change takes effect immediately. Merchants need to schedule changes (price drops, banner swaps, description updates) to activate at a future time and preview them before they go live.

### The Data Model Change: `row_id` vs `entity_id`

This is the single most architecturally significant EE change to the data model.

```
CE Data Model (catalog_product_entity):
+------------+-----------+
| entity_id  | sku       |  <-- entity_id IS the primary key
+------------+-----------+
| 1          | MH01      |
+------------+-----------+

EE Data Model (catalog_product_entity):
+------------+-----------+-----------+------------+------------------+
| row_id     | entity_id | sku       | created_in | updated_in       |
+------------+-----------+-----------+------------+------------------+
| 1          | 1         | MH01      | 1          | 9999999999999    |  <- permanent row
| 2          | 1         | MH01      | 1672531200 | 1675209600       |  <- staged version
+------------+-----------+-----------+------------+------------------+
         ^
         Primary key is row_id, NOT entity_id
```

**Why this matters architecturally:**

- `entity_id` identifies the *product* (permanent, never changes)
- `row_id` identifies a *version* of that product (one per staging update)
- All EAV attribute tables (`catalog_product_entity_varchar`, `_int`, etc.) use `row_id` as the FK in EE
- `created_in` and `updated_in` are Unix timestamps defining the version's validity window

```sql
-- CE: simple lookup
SELECT * FROM catalog_product_entity WHERE entity_id = 1;

-- EE: version-aware lookup (simplified)
SELECT * FROM catalog_product_entity
WHERE entity_id = 1
  AND created_in <= UNIX_TIMESTAMP()
  AND updated_in  > UNIX_TIMESTAMP()
ORDER BY created_in DESC
LIMIT 1;
```

> **Exam focus:** If a custom module uses `entity_id` as a direct FK to product tables in EE, it will break staging. You must use `row_id` for version-aware joins. This is a common exam trap question about why a custom module causes data inconsistency in EE.

### Staging Updates and the Timeline

```
Permanent Version (row_id=1)  |------------ always active ----------->
Staging Update A (row_id=2)   |         |-- Jul 1 to Jul 7 --|
Staging Update B (row_id=3)   |                   |-- Jul 5 to Jul 10 --|
                               time -->
```

- Staging updates are applied by cron (`staging_apply_version` cron job)
- Preview uses a special token-based URL to simulate a future point in time
- The `Magento_Staging` module is the base; individual `Magento_*Staging` modules (e.g., `Magento_CatalogStaging`) integrate specific entities

### What Can Be Staged (EE)

- Products, Categories, CMS Pages, CMS Blocks, Price Rules (Catalog & Cart), Banners

> **Exam focus:** Staging campaigns can be created for: **products, categories, CMS pages, CMS blocks, catalog price rules, cart price rules**. They cannot directly stage customer data or orders.

---

## 3. B2B Module Suite — Deep Dive

B2B is a *separate license* on top of EE. It is not included in standard EE pricing. This distinction matters for exam questions about prerequisites.

### Module: `Magento_Company`

**Company Account Hierarchy:**

```
Company (root)
  |
  +-- Company Admin (special customer role)
  |
  +-- Division / Team (optional org units)
       |
       +-- Buyer 1 (customer with company association)
       +-- Buyer 2
```

- Each customer can belong to exactly one company
- `company_id` FK added to `customer_entity`
- Company has: credit limit, payment methods, shipping methods, applicable shared catalog
- Company Admin can manage sub-users and their permissions

> **Exam focus:** The Company Admin is a regular customer account with elevated permissions — not a separate Admin Panel user. This is architecturally important for auth flow questions.

### Module: `Magento_SharedCatalog`

**Purpose:** Restrict which products are visible and set custom prices per company.

```
Default Catalog (all products, standard prices)
       |
       +-- Shared Catalog A (assigned to Company X)
       |     - Only products: SKU-001, SKU-002, SKU-003
       |     - Custom tier prices per catalog
       |
       +-- Shared Catalog B (assigned to Company Y)
             - Different product subset
             - Different pricing
```

- Built on top of customer groups — each Shared Catalog gets a dedicated customer group
- Category permissions are used under the hood to control visibility
- `catalogpermissions` index powers the visibility rules

> **Exam focus:** Shared Catalog uses **customer groups** internally. When you assign a company to a shared catalog, the company's customers are assigned to the corresponding customer group. This means Shared Catalog pricing = customer group pricing at the implementation level.

### Module: `Magento_NegotiableQuote`

Workflow:
```
Buyer creates quote request
        |
        v
Quote enters "Submitted" state
        |
        v
Sales Rep reviews, modifies prices/shipping
        |
        v
Quote returned to Buyer ("Updated by Seller")
        |
        v
Buyer reviews, accepts or counter-offers
        |
        v
Buyer "Proceeds to Checkout" from approved quote
        |
        v
Order created from quote (special price honored)
```

- Quotes have their own state machine (submitted, pending, updated, ordered, expired, declined, closed)
- Quote items can have item-level discounts set by the sales rep
- Expiration dates can be set on quotes

> **Exam focus:** Negotiable Quotes convert directly to orders. The price lock mechanism prevents price catalog updates from overriding the negotiated price until the quote expires.

### Module: `Magento_RequisitionList`

- Persistent saved lists per buyer (not per session — unlike a wishlist)
- Multiple lists allowed per buyer (unlike wishlist which is typically one)
- Items from a requisition list can be added to cart in bulk
- Key difference from Wishlist: **no limit on number of lists**, designed for repeat B2B purchasing

### Module: `Magento_QuickOrder`

- Allows buyers to paste CSV or enter SKU + quantity in a form
- Validates SKUs against the shared catalog in real time
- Outputs to cart in bulk
- Use case: procurement buyers who already know their SKUs

> **Exam focus:** Quick Order vs Requisition Lists — Quick Order is for one-time entry by SKU. Requisition Lists are for saved, repeatable orders. Both are B2B only.

---

## 4. Customer Segments & Related Products Rules

### Customer Segments (`Magento_CustomerSegment`)

**Purpose:** Dynamically group customers based on real-time evaluated conditions, then target them with promotions, banners, or related product rules.

**Segment Conditions Examples:**
- Customer has ordered more than $500 in the last 30 days
- Customer is logged in and lives in California
- Customer has product X in their cart right now
- Customer has not purchased in 60 days (win-back)

**Architecture:**
```
Customer action (page load / cart update)
        |
        v
Segment evaluation engine runs conditions
        |
        v
Results cached in: customer_segment_customer (table)
        |
        v
Segment IDs stored in customer session
        |
        v
Used by: Banner rules, Cart Price Rules, Related Product Rules
```

> **Exam focus:** Customer Segments evaluate conditions in real time (or near real time). The `Magento_CustomerSegment` module adds a **cron job** and an **observer** pattern to keep segment membership updated. Performance risk: too many complex segments with large customer bases can cause slow page loads because segments are evaluated per-session.

### Related Products Rules (`Magento_TargetRule`)

**Purpose:** Automatically populate the Related Products, Up-Sells, and Cross-Sells blocks based on configurable rules rather than manually assigning them per product.

**Rule Types:**
- Related Products (shown on product detail page)
- Up-Sells (shown on product detail page — higher value alternatives)
- Cross-Sells (shown in cart)

**Rule Conditions:** Product attributes, category membership, customer segment membership

> **Exam focus:** Target Rules *replace* manually configured related/upsell/cross-sell products when active. CE uses manually assigned relationships; EE uses rule-based targeting. This distinction often appears in questions about merchandising scalability.

---

## 5. Gift Cards, Wrapping, Reward Points & Store Credit

### Gift Cards (`Magento_GiftCard`)

**Types:**
| Type | Description |
|---|---|
| Virtual | Emailed code only |
| Physical | Shipped physical card |
| Combined | Both emailed and shipped |

- Gift card accounts stored in `magento_giftcardaccount` table
- Balance tracked per code
- Can be used as partial payment (combined with other payment methods)

### Gift Wrapping (`Magento_GiftWrapping`)

- Can be applied at order level and/or item level
- Wrapping options have images and prices
- Configurable per store view
- Printable gift message support per item or order

### Reward Points (`Magento_Reward`)

- Points earned on: purchases, registration, newsletter signup, review submission
- Exchange rates: points-to-currency (e.g., 100 points = $1)
- Points have optional expiry
- Ledger model: balance adjustments recorded as transactions in `magento_reward_history`

> **Exam focus:** Reward Points are a **ledger/transaction system** — not a simple balance field. Each earning and redemption event creates a row in `magento_reward_history`. This is important for questions about auditing and rollback scenarios.

### Store Credit (`Magento_CustomerBalance`)

- Per-customer credit balance (not codes like gift cards)
- Applied automatically or manually at checkout
- Can be given as refund (instead of returning to original payment method)
- Tracked in `magento_customerbalance` and `magento_customerbalance_history`

> **Exam focus:** Store Credit vs Gift Card — Store Credit is **account-bound** (tied to a customer email). Gift Cards are **code-bound** (transferable). Both are EE-only but serve different use cases.

---

## 6. Page Builder — EE vs CE Distinction

### Native EE Page Builder

- Ships as `Magento_PageBuilder` module within EE
- Drag-and-drop content editor for: CMS Pages, CMS Blocks, Category descriptions, Product descriptions
- Content types: Row, Column, Tabs, Text, Heading, Buttons, HTML Code, Divider, Image, Banner, Slider, Map, Video, Products widget, Dynamic Block

### CE Reality

- CE does NOT include Page Builder natively
- Options for CE: 3rd-party modules (e.g., BlueFoot, now EOL), custom implementation
- The WYSIWYG editor in CE is basic TinyMCE only

> **Exam focus:** Page Builder content is stored as structured HTML with `data-content-type` attributes embedded in the HTML string. It is **not** stored as JSON or in a separate table — it lives in the `content` field of `cms_block` or `cms_page`. This matters for migration and programmatic content manipulation questions.

```html
<!-- Page Builder stores structured HTML like this: -->
<div data-content-type="row" data-appearance="full-bleed" data-enable-parallax="0">
    <div data-content-type="heading" data-appearance="default" data-text-align="left">
        <h2>My Heading</h2>
    </div>
</div>
```

---

## 7. RMA (Return Merchandise Authorization)

### Module: `Magento_Rma`

**Workflow:**
```
Customer requests return (storefront or CSR initiates)
        |
        v
RMA created with items, reasons, conditions, resolutions
        |
        v
Admin reviews RMA request
        |
        v
Admin approves / partially approves / rejects
        |
        v
If approved: shipping label generated (carrier API)
        |
        v
Item received, credit memo / replacement / repair issued
```

**RMA Statuses:** Pending, Authorized, Partially Authorized, Received, Partially Received, Approved, Rejected, Partially Rejected, Closed

**Key Config:**
- Per-product: enable/disable returns
- Return reasons, item conditions, resolutions (refund, replacement, store credit)
- Auto-close RMAs after N days

> **Exam focus:** RMA in Magento is NOT the same as a credit memo. An RMA is a **workflow/process** for managing the physical return. A credit memo is the **financial document**. They are separate but linked — an RMA can result in a credit memo but is not a credit memo itself.

---

## 8. Async Order & Deferred Stock Update

### Problem Statement

During peak traffic (flash sales, Black Friday), synchronous order placement creates a bottleneck:

```
Browser                  App Server              Database
  |                          |                       |
  |--- Place Order POST ----> |                       |
  |                          |--- BEGIN TRANSACTION ->|
  |                          |--- Insert order ------>|
  |                          |--- Update inventory -->|
  |                          |--- Insert quote ------>|
  |                          |--- COMMIT ------------>|
  |<-- Order Confirmation --- |                       |
  
  All of this holds the HTTP connection open for 1-3 seconds minimum
```

### Solution: `Magento_AsyncOrder`

```
Browser                  App Server          Message Queue         Consumer
  |                          |                    |                    |
  |--- Place Order POST ----> |                    |                    |
  |                          |--- Publish msg ---> |                    |
  |<-- 202 Accepted --------- |                    |                    |
  |  (immediate response)     |                    |--- Consume msg --> |
                                                   |                    |--- Process order
                                                   |                    |--- Update DB
```

- Customer gets immediate response with order number
- Actual order processing happens asynchronously via consumer
- Order status starts as "Received" before processing

### `Magento_DeferredTotalCalculating` / Deferred Stock

- Stock deduction is also deferred to the consumer
- Prevents inventory lock contention during high-concurrency scenarios
- Risk: **overselling is possible** in the window between order receipt and stock deduction

> **Exam focus:** The architectural tradeoff for Async Order is: **availability vs. consistency**. You gain higher throughput and faster user response, but you accept the risk of overselling and delayed order confirmation. This is a classic CAP theorem application — exam questions will ask you to identify this tradeoff.

### Infrastructure Requirements

- RabbitMQ (recommended) or database-backed queue
- Consumer processes must be running: `bin/magento queue:consumers:start placeOrderProcessor`
  > **Correction:** `async.operations.all` is the consumer for **bulk REST API operations** (handled by `Magento\AsynchronousOperations\Model\MassConsumer` in `module-webapi-async`). AsyncOrder uses the `placeOrderProcessor` consumer (queue: `placeOrder`, handler: `Magento\AsyncOrder\Model\Consumer::process`) — confirmed in `module-async-order/etc/queue_consumer.xml`.
- Cloud: queue consumers configured in `.magento.env.yaml`

```yaml
# .magento.env.yaml (Cloud)
stage:
  deploy:
    CONSUMERS_WAIT_FOR_MAX_MESSAGES: 0
    QUEUE_CONFIGURATION:
      - consumer: async.operations.all
        max_messages: 10000
```

---

## 9. Advanced Reporting / MBI / BI Essentials

### What It Is

- **MBI** = Magento Business Intelligence (now Adobe Commerce Intelligence)
- SaaS product — data is synced from your Commerce instance to Adobe's cloud BI platform
- Provides pre-built dashboards: revenue, customer lifetime value, product performance, cohort analysis

### Architecture

```
Commerce Database
        |
        v
Data Export (module: Magento_Analytics)
        |
        v
Adobe SaaS BI Platform (cloud)
        |
        v
Dashboard in Admin Panel (iframe embed) or separate BI portal
```

### Module: `Magento_Analytics`

- Installed with EE, enables the data sync
- Admin > Reports > Business Intelligence (navigates to MBI)
- Subscription-based: included in EE contract, but must be provisioned/activated

> **Exam focus:** Advanced Reporting / MBI is **not** a local reporting tool — it's a SaaS integration. Data leaves your Commerce instance and goes to Adobe's cloud. This has implications for PCI compliance and data residency questions. The module that handles the sync is `Magento_Analytics`.

---

## 10. CMS Page Hierarchy & Restrictions

### CMS Page Hierarchy (`Magento_VersionsCms`)

- Allows CMS pages to be organized in a **tree structure**
- Generates automatic breadcrumbs based on hierarchy position
- Enables human-friendly nested URLs: `/about-us/team/john-doe`
- Navigation menus can be built from the hierarchy

### CMS Restrictions (`Magento_CatalogPermissions` + `Magento_CustomerSegment`)

- Restricts **category** and **CMS page** access by customer group
- Can show "access denied" or redirect non-qualified visitors
- Works with Customer Segments in EE for dynamic restriction

**Config path:** Stores > Configuration > Catalog > Category Permissions

> **Exam focus:** CMS Hierarchy is about **organization and navigation structure**. CMS Restrictions are about **access control**. They are separate features often mentioned together but solve different problems. Both are EE-only.

---

## 11. Live Search (SaaS)

### Architecture

```
Commerce Catalog             Adobe SaaS               Storefront
      |                          |                          |
      |--- Product data sync ---> |                          |
      |    (via Data Export)      |--- Search Index -------> |
      |                          |   (maintained in cloud)  |
      |                          |                          |
      |                    Search query                     |
      |                     via GraphQL                     |
      |<--- Results (fast) ------ |<---- Search request --- |
```

### Key Characteristics

- **Replaces** the native Elasticsearch/OpenSearch search — completely
- Served via **GraphQL API** to the storefront (PWA Studio compatible)
- Faceted navigation powered by AI/ML ranking (Adobe Sensei)
- **No Elasticsearch/OpenSearch dependency** for search when using Live Search
- Requires **SaaS data space** (provisioned separately, even for EE customers)
- Syncs product data via `Magento_DataExporter` module

### Prerequisites

- EE license (or B2B)
- API keys configured: Admin > Stores > Configuration > Commerce Services Connector
- `saas-export` and `live-search` modules installed

> **Exam focus:** Live Search is a **SaaS subscription** — it is NOT bundled automatically with EE. It requires: (1) EE license, (2) Adobe account with SaaS data space provisioned, (3) API key configuration. The search is served from Adobe's cloud, not your servers. This is architecturally different from OpenSearch, which runs on your infrastructure.

---

## 12. Architect Scenario Drills — Why, Not Just What

The following scenarios are structured as the exam presents them: a business/technical problem, multiple plausible solutions, and the architecturally correct answer with justification.

**Mental Model for Architect Questions:**

```
Question pattern:
"Given [context], what is the BEST approach?"

Wrong trap answers:
- Technically works but violates upgrade safety
- Technically works but doesn't scale
- Technically works but has wrong separation of concerns
- Solves the symptom, not the root cause

Correct answer characteristics:
- Upgrade-safe
- Follows Magento's extension architecture
- Appropriate for the problem scale
- Correct separation of concerns
```

---

## 13. Scenario 1 — Customize Without Modifying Vendor Code → Plugin

### The Scenario

> "You need to add custom validation logic to the `\Magento\Checkout\Model\PaymentInformationManagement::savePaymentInformationAndPlaceOrder()` method. The validation must run before the original method executes. What is the correct approach?"

### Why Plugins Are the Answer

**Option A: Edit the vendor file directly**
```
WRONG — absolutely never
- Breaks on composer update
- Not tracked by version control properly
- Violates Magento's entire extension architecture
```

**Option B: Override the class (preference in di.xml)**
```xml
<!-- This works but is architecturally inferior for this use case -->
<preference for="Magento\Checkout\Model\PaymentInformationManagement"
            type="MyVendor\MyModule\Model\PaymentInformationManagement"/>
```

Problems with preference:
- If another module also sets a preference for the same class → **conflict** (last one wins, silently breaking the other)
- You must maintain the entire method even if you only need to add one line
- Harder to test in isolation

**Option C: Plugin (the correct answer)**
```php
<?php
// MyVendor/MyModule/Plugin/PaymentInformationManagementPlugin.php

namespace MyVendor\MyModule\Plugin;

use Magento\Checkout\Model\PaymentInformationManagement;
use Magento\Quote\Api\Data\AddressInterface;
use Magento\Quote\Api\Data\PaymentInterface;

class PaymentInformationManagementPlugin
{
    /**
     * Before plugin: runs BEFORE the original method
     * Can modify arguments passed to the original method
     * Return null to leave arguments unchanged, or return modified args array
     */
    public function beforeSavePaymentInformationAndPlaceOrder(
        PaymentInformationManagement $subject,
        int $cartId,
        PaymentInterface $paymentMethod,
        AddressInterface $billingAddress = null
    ): array {
        // Custom validation
        if ($this->isInvalidPayment($paymentMethod)) {
            throw new \Magento\Framework\Exception\LocalizedException(
                __('Payment method not allowed for this order.')
            );
        }

        // Return args array to pass (possibly modified) to original method
        return [$cartId, $paymentMethod, $billingAddress];
    }

    private function isInvalidPayment(PaymentInterface $payment): bool
    {
        // your validation logic
        return false;
    }
}
```

```xml
<!-- MyVendor/MyModule/etc/di.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
    <type name="Magento\Checkout\Model\PaymentInformationManagement">
        <plugin name="myvendor_mymodule_payment_validation"
                type="MyVendor\MyModule\Plugin\PaymentInformationManagementPlugin"
                sortOrder="10"
                disabled="false"/>
    </type>
</config>
```

### Plugin Types and When to Use Each

| Plugin Type | Trigger | Can Modify? | Use Case |
|---|---|---|---|
| `before` | Before original | Modify input args | Input validation, argument transformation |
| `after` | After original | Modify return value | Augment/filter output |
| `around` | Wraps original | Control execution | Conditional execution, logging, caching |

> **Exam focus:** `around` plugins have a performance cost — they wrap the call stack. **Prefer `before` or `after` when possible.** Around plugins can also accidentally suppress the original method if `$proceed()` is not called — a common source of bugs. The exam will ask you to choose between plugin types for a given requirement.

### Plugin Limitations (Exam Traps)

```
Plugins CANNOT be used on:
- Final classes
- Final methods
- Non-public methods (private/protected)
- __construct()
- Static methods
- Virtual types
```

> **Exam focus:** If a question asks you to intercept a `private` method or `final` class, plugins are NOT the answer. You must use a Preference (class override) instead — even though it's less ideal.

---

## 14. Scenario 2 — Add Data to API Response → Extension Attributes

### The Scenario

> "A 3rd-party logistics integration needs the customer's internal ERP ID to be included in the Order API response (`GET /V1/orders/:id`). The ERP ID is stored in a custom table. What is the correct architecture?"

### Why Extension Attributes Are the Answer

**Wrong approach: Modifying the Order model directly**
- `Magento\Sales\Api\Data\OrderInterface` is a contract (interface)
- You cannot add fields to a core interface without modifying vendor code
- Custom fields added to DB tables are not auto-exposed via API

**Correct approach: Extension Attributes**

Extension Attributes are Magento's designed mechanism for adding data to existing API data objects without modifying core.

**Step 1: Declare the extension attribute**

```xml
<!-- MyVendor/MyModule/etc/extension_attributes.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Api/etc/extension_attributes.xsd">
    <extension_attributes for="Magento\Sales\Api\Data\OrderInterface">
        <attribute code="erp_customer_id" type="string"/>
    </extension_attributes>
</config>
```

**Step 2: Create a plugin to load and set the attribute**

```php
<?php
// MyVendor/MyModule/Plugin/OrderRepositoryPlugin.php

namespace MyVendor\MyModule\Plugin;

use Magento\Sales\Api\Data\OrderInterface;
use Magento\Sales\Api\Data\OrderSearchResultInterface;
use Magento\Sales\Api\OrderRepositoryInterface;
use Magento\Sales\Api\Data\OrderExtensionFactory;
use MyVendor\MyModule\Model\ErpCustomerRepository;

class OrderRepositoryPlugin
{
    public function __construct(
        private readonly OrderExtensionFactory $extensionFactory,
        private readonly ErpCustomerRepository $erpRepository
    ) {}

    /**
     * After plugin on get() - single order
     */
    public function afterGet(
        OrderRepositoryInterface $subject,
        OrderInterface $order
    ): OrderInterface {
        return $this->setErpId($order);
    }

    /**
     * After plugin on getList() - collection
     */
    public function afterGetList(
        OrderRepositoryInterface $subject,
        OrderSearchResultInterface $searchResult
    ): OrderSearchResultInterface {
        foreach ($searchResult->getItems() as $order) {
            $this->setErpId($order);
        }
        return $searchResult;
    }

    private function setErpId(OrderInterface $order): OrderInterface
    {
        $extensionAttributes = $order->getExtensionAttributes()
            ?? $this->extensionFactory->create();

        $customerId = $order->getCustomerId();
        $erpId = $this->erpRepository->getErpIdByCustomerId($customerId);

        $extensionAttributes->setErpCustomerId($erpId);
        $order->setExtensionAttributes($extensionAttributes);

        return $order;
    }
}
```

**Step 3: Register the plugin**

```xml
<!-- MyVendor/MyModule/etc/di.xml -->
<type name="Magento\Sales\Api\OrderRepositoryInterface">
    <plugin name="myvendor_erp_order_extension"
            type="MyVendor\MyModule\Plugin\OrderRepositoryPlugin"/>
</type>
```

> **Exam focus:** The auto-generated `OrderExtensionInterface` and `OrderExtension` classes are created by `bin/magento setup:di:compile`. You must run compilation after adding `extension_attributes.xml`. **Always use `getExtensionAttributes() ?? $factory->create()`** — never assume extension attributes object exists.

### Extension Attributes vs Custom Attributes

| | Extension Attributes | Custom Attributes (EAV) |
|---|---|---|
| Purpose | Add data to API objects | Add attributes to EAV entities (products, customers) |
| Storage | Custom table or EAV | EAV attribute tables |
| API exposure | Yes (designed for this) | Yes (via `custom_attributes` in API) |
| Entities | Any API data object | Only EAV entities |
| Admin UI | Manual | Automatic if configured |

---

## 15. Scenario 3 — Long Process Without Blocking Checkout → Message Queue

### The Scenario

> "When an order is placed, your system must: send the order to a 3rd-party ERP (which takes 2-5 seconds), generate a PDF invoice and upload it to S3 (takes 3 seconds), and notify a warehouse system via SOAP (takes 1-2 seconds). Customers are complaining about slow order confirmation. What is the correct architecture?"

### Why Message Queue Is the Answer

**Wrong approach: Observer on `sales_order_place_after` running synchronously**

```
Total checkout time = normal checkout (1-2s) + ERP (3s) + PDF (3s) + SOAP (2s)
                    = 9-10 seconds minimum
Customer experience: spinning loader for 10 seconds = abandoned cart
```

**Correct approach: Message Queue**

```
sales_order_place_after observer fires
        |
        v
Observer publishes message to queue (< 1ms overhead)
        |
        v
Checkout completes normally (fast)
        |
Queue Consumer (separate process):
        |
        v
[Consumer 1] Reads ERP message -> calls ERP API (3s, doesn't block customer)
[Consumer 2] Reads PDF message  -> generates PDF, uploads to S3 (3s)
[Consumer 3] Reads SOAP message -> notifies warehouse (2s)
```

**Implementation:**

```xml
<!-- MyVendor/MyModule/etc/communication.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Communication/etc/communication.xsd">
    <topic name="myvendor.order.erp_sync"
           request="Magento\Sales\Api\Data\OrderInterface"/>
</config>
```

```xml
<!-- MyVendor/MyModule/etc/queue_topology.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/topology.xsd">
    <exchange name="magento" type="topic" connection="db">
        <!-- Correction: DB queue exchange name is "magento" (same as AMQP), not "magento-db".
             The connection="db" attribute selects the DB transport. Confirmed via
             TestModuleMysqlMq/etc/queue_topology.xml in the integration test fixtures. -->
        <binding id="erp_sync_binding"
                 topic="myvendor.order.erp_sync"
                 destinationType="queue"
                 destination="myvendor.order.erp_sync"/>
    </exchange>
</config>
```

```xml
<!-- MyVendor/MyModule/etc/queue_consumer.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/consumer.xsd">
    <consumer name="myvendor.erp.sync"
              queue="myvendor.order.erp_sync"
              connection="db"
              handler="MyVendor\MyModule\Model\Consumer\ErpSyncConsumer::process"
              consumerInstance="Magento\Framework\MessageQueue\Consumer"
              maxMessages="100"/>
</config>
```

```php
<?php
// MyVendor/MyModule/Model/Consumer/ErpSyncConsumer.php

namespace MyVendor\MyModule\Model\Consumer;

use Magento\Sales\Api\Data\OrderInterface;

class ErpSyncConsumer
{
    public function process(OrderInterface $order): void
    {
        // This runs asynchronously, not blocking checkout
        $this->erpClient->syncOrder($order);
    }
}
```

```php
<?php
// MyVendor/MyModule/Observer/OrderPlaceAfter.php

namespace MyVendor\MyModule\Observer;

use Magento\Framework\Event\ObserverInterface;
use Magento\Framework\MessageQueue\PublisherInterface;

class OrderPlaceAfter implements ObserverInterface
{
    public function __construct(
        private readonly PublisherInterface $publisher
    ) {}

    public function execute(\Magento\Framework\Event\Observer $observer): void
    {
        $order = $observer->getData('order');
        // Non-blocking: just publishes the message and returns
        $this->publisher->publish('myvendor.order.erp_sync', $order);
    }
}
```

### Queue Configuration Files Summary

| File | Purpose |
|---|---|
| `communication.xml` | Define topics and their data types |
| `queue_topology.xml` | Define exchanges and bindings |
| `queue_consumer.xml` | Define consumers and their handlers |
| `queue_publisher.xml` | Define publisher connections (optional override) |

> **Exam focus:** The four XML files must work together. A common exam question: "You added a consumer but it's not processing messages — what's missing?" Answer: likely missing `communication.xml` topic definition or `queue_topology.xml` binding.

### RabbitMQ vs Database Queue

| | Database Queue | RabbitMQ |
|---|---|---|
| Setup complexity | Low (uses Magento DB) | High (separate service) |
| Performance | Poor at scale | Excellent |
| Message persistence | Yes | Yes (durable queues) |
| Retry/DLQ | Limited | Full support |
| Recommended for | Development / simple flows | Production / high volume |

---

## 16. Scenario 4 — 503 After Deploy → Varnish Health Check Timing

### The Scenario

> "After deploying to production, customers see 503 errors for 2-3 minutes immediately after the deployment completes. After that, everything works normally. The infrastructure uses Varnish in front of the application servers. What is the root cause and fix?"

### Root Cause Analysis

```
Timeline of events:

T=0   Deployment starts
T=45s deploy:static-content:deploy completes
T=60s deploy:mode:set production completes
T=90s app servers restart (PHP-FPM restart)
T=91s Varnish health check probe fires
T=91s App server not yet ready -> health check FAILS
T=91s Varnish marks backend as SICK
T=92s All requests to Varnish -> 503 (backend unhealthy)
...
T=150s App server fully warmed up, health check starts passing
T=155s Varnish marks backend as HEALTHY again
T=155s Traffic resumes normally

Window of 503s = T=91s to T=155s = ~64 seconds
```

### Varnish Health Check Probe Configuration

```vcl
# default.vcl - Health check probe configuration
backend default {
    .host = "app_server";
    .port = "8080";
    .probe = {
        .url = "/health_check.php";
        .timeout = 2s;
        .interval = 5s;    # Check every 5 seconds
        .window = 5;       # Evaluate last 5 checks
        .threshold = 3;    # Need 3 of 5 passing to be healthy
    }
}
```

**The Math Problem:**
- After restart, backend needs `threshold` passing checks before marked healthy
- With `.interval = 5s` and `.threshold = 3`: minimum 15 seconds before healthy again
- If app warmup takes 30s, that's 30-45 seconds of 503s minimum

### Solutions

**Solution 1: Adjust probe thresholds (quick fix)**
```vcl
.probe = {
    .url = "/health_check.php";
    .timeout = 5s;       # More generous timeout
    .interval = 2s;      # Check more frequently
    .window = 10;        # Wider window
    .threshold = 2;      # Only need 2 passing checks
}
```

**Solution 2: Blue/Green deployment (architectural fix)**
```
Blue Environment (currently live)
        |
        +-- Varnish serves traffic here
        
Green Environment (new deployment)
        |
        +-- Deploy new code here
        +-- Warm up application
        +-- Verify health checks pass
        |
        v
Varnish backend updated to point to Green
Blue Environment stands down
```

**Solution 3: Maintenance page during deploy + cache warm**
```bash
# Magento maintenance mode aware of Varnish
bin/magento maintenance:enable
# ... deploy ...
bin/magento setup:upgrade
bin/magento cache:flush
# Warm cache before disabling maintenance
curl -s https://yoursite.com/sitemap.xml | warm_cache_script.sh
bin/magento maintenance:disable
```

**Solution 4: Cloud-specific (Magento Cloud)**
```yaml
# .magento.env.yaml
stage:
  deploy:
    WARM_UP_PAGES:
      - "/"
      - "/category-url"
    SCD_ON_DEMAND: false
```

> **Exam focus:** The 503-after-deploy scenario is specifically about **Varnish health check timing**, not the application itself having errors. The application IS working — Varnish just hasn't confirmed it yet. The architectural fix is either adjusting probe parameters or implementing blue/green. Flushing Varnish cache does not fix this.

### `/health_check.php`

```php
<?php
// pub/health_check.php - The endpoint Varnish probes
// Returns 200 if app is healthy, non-200 if not
require __DIR__ . '/../app/bootstrap.php';

$bootstrap = \Magento\Framework\App\Bootstrap::create(BP, $_SERVER);
$objectManager = $bootstrap->getObjectManager();

$response = $objectManager->get(\Magento\Framework\App\ResponseInterface::class);

try {
    // Check DB connection
    $resource = $objectManager->get(\Magento\Framework\App\ResourceConnection::class);
    $resource->getConnection()->query('SELECT 1');
    $response->setStatusCode(200);
} catch (\Exception $e) {
    $response->setStatusCode(500);
}
```

---

## 17. Scenario 5 — Performance Degrades with Catalog Growth → Indexer & OpenSearch

### The Scenario

> "A merchant with 500 products has good performance. After growing to 150,000 products, catalog pages and search are noticeably slower. Category pages take 4-6 seconds. Full reindex takes 45 minutes and impacts the storefront during reindex. What is the architectural approach?"

### Root Cause Analysis

**Problem 1: Indexer in Update on Save mode**

```
Product saved in Admin
        |
        v
Observer fires synchronously
        |
        v
Reindex this product in ALL indexes:
- catalog_product_price
- catalog_product_attribute
- catalog_product_flat
- catalog_category_product
- catalogsearch_fulltext
- catalogrule_rule
... (8+ indexes)
        |
        v
Admin save request takes 30-60 seconds on large catalog
        |
        v
Storefront reads from partially updated index
        |
        v
Inconsistent data visible to customers
```

**Solution: Switch to Update by Schedule (MView)**

```bash
# Check current indexer modes
bin/magento indexer:status

# Switch all indexers to Update by Schedule
bin/magento indexer:set-mode schedule

# Or specific indexers
bin/magento indexer:set-mode schedule catalog_product_price
bin/magento indexer:set-mode schedule catalogsearch_fulltext
```

**How Update by Schedule works:**

```
Product saved in Admin
        |
        v
Change recorded in changelog table (catalog_product_cl)
        |
        v
Admin save returns immediately (fast)
        |
Cron job fires (every minute):
        |
        v
Indexer reads changelog, processes only changed entities (partial reindex)
        |
        v
Index updated without locking storefront reads
```

**The MView Architecture:**

```
catalog_product_entity (source table)
        |
        v (trigger on INSERT/UPDATE)
catalog_product_cl (changelog table)
  - version_id
  - entity_id
        |
        v (cron reads changelog)
Indexer processes delta
        |
        v
catalog_product_index_price (index table)
```

> **Exam focus:** `Update by Schedule` does NOT mean real-time updates. There is a **latency** of up to 1 minute between a product save and the index reflecting that change. For most catalogs this is acceptable. For real-time price changes, `Update on Save` is required — at the cost of slower saves.

**Problem 2: OpenSearch/Elasticsearch Tuning**

```yaml
# Suboptimal for large catalog:
index.number_of_shards: 1      # Single shard = no parallelism
index.number_of_replicas: 0    # No redundancy
index.refresh_interval: 1s     # Frequent refreshes = overhead

# Tuned for large catalog:
index.number_of_shards: 5      # Parallel search execution
index.number_of_replicas: 1    # Redundancy + read load distribution
index.refresh_interval: 30s    # Batch refreshes reduce overhead
```

**Magento OpenSearch config:**

```
Admin > Stores > Configuration > Catalog > Catalog Search
- Search Engine: OpenSearch
- OpenSearch Server Hostname: localhost
- OpenSearch Server Port: 9200
- OpenSearch Index Prefix: magento2
- Enable OpenSearch HTTP Auth: No
- Minimum Terms to Match: 1
- Enable Elasticsearch Debug Mode: No
```

> **Exam focus:** The **catalog_product_flat** table is an optimization for large catalogs — it denormalizes EAV data into a single flat table for faster reads. It's controlled by `bin/magento indexer:reindex catalog_product_flat`. Disabling flat catalog can actually be faster for small catalogs; enabling it is better for large ones.

### Summary of Performance Tools for Catalog

| Problem | Solution | Mode |
|---|---|---|
| Slow Admin saves | `indexer:set-mode schedule` | MView/schedule |
| Slow storefront reads | Enable flat catalog tables | Flat indexer |
| Slow search | OpenSearch shard tuning | Infrastructure |
| Full reindex blocks site | `indexer:reindex` with `schedule` mode | Delta indexing |
| Memory during reindex | `php -d memory_limit=4G bin/magento indexer:reindex` | CLI tuning |

---

## 18. Scenario 6 — All Page Cache Invalidated on Every Product Save → Wrong identities()

### The Scenario

> "After switching to Full Page Cache (Varnish), merchants notice that saving ANY product clears the entire page cache, including pages that have no relationship to that product. This causes a cache hit rate of near 0% after any catalog update. What is the root cause?"

### Understanding Cache Tags and identities()

Magento's FPC uses **cache tags** to enable granular cache invalidation. Each cacheable block must declare which cache tags it depends on.

```
How it should work:
Product A saved -> Invalidate only pages/blocks containing Product A
                -> Pages without Product A remain cached

How broken identities() causes it to work:
Product A saved -> Invalidate ALL cached pages
                -> Complete cache flush every time
```

### The `identities()` Method

Every class implementing `\Magento\Framework\DataObject\IdentityInterface` must implement `identities()`:

```php
<?php

namespace Magento\Catalog\Block\Product;

use Magento\Framework\DataObject\IdentityInterface;

class View extends \Magento\Framework\View\Element\Template implements IdentityInterface
{
    /**
     * Return unique ID(s) for cache. Must return tags specific to THIS block's data.
     */
    public function identities(): array
    {
        // CORRECT: returns specific tags for this product
        return $this->getProduct()->getIdentities();
        // Resolves to: ['cat_p_123', 'cat_p'] where 123 is the product ID
    }
}
```

**What `getProduct()->getIdentities()` returns:**

```php
// In Magento\Catalog\Model\Product:
public function getIdentities(): array
{
    $identities = [
        self::CACHE_TAG . '_' . $this->getId(),  // 'cat_p_123' (specific product)
        self::CACHE_TAG,                          // 'cat_p' (all products tag - use sparingly)
    ];

    if ($this->getIsChangedCategories()) {
        foreach ($this->getAffectedCategoryIds() as $categoryId) {
            $identities[] = \Magento\Catalog\Model\Category::CACHE_TAG . '_' . $categoryId;
        }
    }

    return $identities;
}
```

### The Bug: Returning Generic Tags

```php
// WRONG: This causes full cache flush on every product save
public function identities(): array
{
    // Returns only the generic 'cat_p' tag
    // ALL product cache is tied to this single tag
    // When ANY product is saved, this tag is invalidated -> entire cache cleared
    return [\Magento\Catalog\Model\Product::CACHE_TAG]; // 'cat_p' only
}

// WRONG: This is even worse - completely generic
public function identities(): array
{
    return ['FPC']; // Flushes the entire FPC on every call
}

// WRONG: Returning empty array - block is never cached
public function identities(): array
{
    return [];
}
```

### Cache Tag Lifecycle

```
1. Block renders, identities() called:
   Returns ['cat_p_123', 'cat_c_456']

2. Response cached with X-Magento-Tags header:
   X-Magento-Tags: cat_p_123,cat_c_456,store_1

3. Varnish stores response, tagged

4. Product 123 saved:
   Magento calls: \Magento\Framework\App\Cache\TypeListInterface::invalidate('cat_p_123')

5. Varnish invalidation request:
   BAN X-Magento-Tags ~ "(^|,\s*)cat_p_123($|,)"

6. Only pages tagged with 'cat_p_123' are purged
   Other cached pages remain intact
```

> **Exam focus:** The correct `identities()` implementation must return **specific entity tags** (e.g., `cat_p_{id}`) not generic category tags (e.g., `cat_p`). A block that never changes can return `[]`, but a block tied to an entity MUST return entity-specific tags. The Varnish BAN mechanism relies on these tags to do targeted invalidation.

### Varnish BAN Request (Generated by Magento)

```vcl
# In default.vcl, Magento sends BAN requests to Varnish:
acl purge {
    "localhost";
    "app_server_ip";
}

sub vcl_recv {
    if (req.method == "BAN") {
        if (!client.ip ~ purge) {
            return(synth(405, "Not allowed"));
        }
        ban("obj.http.X-Magento-Tags ~ " + req.http.X-Magento-Tags);
        return(synth(200, "Banned"));
    }
}
```

### Diagnosis Checklist

```
Q: Is the entire cache being cleared or just specific pages?
   - Entire cache -> wrong identities() or programmatic cache:flush
   - Specific pages -> correct behavior

Q: Which block has the wrong identities()?
   - Enable developer mode
   - Check X-Magento-Tags response headers
   - Look for blocks returning generic tags

Q: Is cache:flush being called somewhere?
   - Search codebase for: $this->cacheTypeList->cleanType(
   - Search for: \Magento\Framework\App\Cache\Manager::flush
   - These trigger full flushes, not tag-based invalidations
```

---

## 19. Architectural Decision Framework — Why One Answer is Superior

This section codifies the thinking process the exam tests.

### The Hierarchy of Customization

```
Least invasive                                           Most invasive
     |                                                        |
     v                                                        v
Layout XML    ->    Plugin    ->    Extension Attr    ->    Preference    ->    Core edit
(no PHP)        (intercept)       (add to API)           (full override)     (NEVER)
```

**When to choose each:**

| Requirement | Correct Tool | Why |
|---|---|---|
| Change template output | Layout XML override | No PHP, upgrade-safe |
| Add logic before/after a method | Plugin | Non-conflicting, upgrade-safe |
| Add data to an API object | Extension Attribute | Designed for this purpose |
| Change a method's behavior completely | Preference | Last resort; use sparingly |
| Add a new table/entity | Service Contract + Repository | Full CRUD with API exposure |
| React to an event | Observer/Event | Decoupled, no method interception needed |
| Long-running task | Message Queue Consumer | Non-blocking, scalable |
| Store config values | System Config (config.xml) | Standard pattern, no custom table needed |

### Why Observer is Not Always the Answer

```
"Hook into order placement" -> Observer? Plugin?

Observer is correct when:
- You're reacting to an event that Magento already dispatches
- You don't need to modify the return value
- You don't need to conditionally prevent the action

Plugin is correct when:
- The event you need doesn't exist
- You need to modify method arguments
- You need to modify return values
- You need to conditionally prevent execution (around plugin with proceed())
```

> **Exam focus:** A common exam trap is a scenario where an Observer *could* work but the requirement is to **modify the return value of a method** — that's only possible with a Plugin (`after` or `around`). Observers cannot alter return values.

### The Service Contract Principle

```php
// WRONG: Calling repository internal methods directly
$product = $this->productFactory->create();
$product->load($id); // Bypasses service layer, cache, plugins

// CORRECT: Using the service contract / repository
$product = $this->productRepository->getById($id); // Respects service layer
```

> **Exam focus:** Always use the **repository/service contract layer**, not the model's `load()` method directly. The `load()` method on models is deprecated. Repositories apply plugins, caching, and trigger proper events.

### Scenario Matrix — Quick Decisions

| Scenario | Answer | Key Reason |
|---|---|---|
| Add field to product API response | Extension Attribute | API contract extension |
| Change how shipping calculation works | Plugin on TotalsCollector | Non-destructive interception |
| Run code when order is placed | Observer (`sales_order_place_after`) | Event already exists |
| Prevent order from placing based on custom logic | Plugin (`before` on placeOrder) | Need to throw exception before execution |
| Add new payment method | Implement `Magento\Payment\Model\MethodInterface` | Interface contract |
| Add new shipping carrier | Implement `Magento\Shipping\Model\Carrier\AbstractCarrier` | Abstract class contract |
| Add attribute to product without code | Admin > Stores > Attributes | No-code EAV attribute |
| React to every inventory change | Observer (`cataloginventory_stock_item_save_after`) | Event-driven |
| 503 after deploy | Fix Varnish probe timing | Health check, not app error |
| Cache always invalidated | Fix `identities()` method | Return specific entity tags |
| Checkout too slow due to 3rd party API | Message Queue | Async processing |
| Product saves slow at 100k SKUs | `indexer:set-mode schedule` | Delta indexing |

---

## Quick-Reference Checklist

### EE-Only Features (Must Memorize)

- [ ] **Content Staging & Preview** — EE only; uses `row_id` (not `entity_id`) as PK; `created_in`/`updated_in` timestamps define version windows
- [ ] **B2B Suite** — Separate license on top of EE; includes: Company, Shared Catalog, Negotiable Quote, Requisition Lists, Quick Order
- [ ] **Shared Catalog** — Internally uses **customer groups**; per-company pricing and product visibility
- [ ] **Negotiable Quote** — Has its own state machine; price lock prevents catalog updates overriding negotiated price
- [ ] **Requisition Lists** — Multiple saved lists per buyer (unlike Wishlist); designed for repeat B2B purchasing
- [ ] **Customer Segments** — Real-time evaluated; performance risk with many complex segments; used by banners, cart rules, target rules
- [ ] **Related Products Rules (Target Rules)** — Rule-based merchandising; replaces manual related/upsell/cross-sell in EE
- [ ] **Gift Cards** — Three types: Virtual, Physical, Combined; code-bound (not account-bound)
- [ ] **Store Credit** — Account-bound (tied to customer); tracked as transaction ledger
- [ ] **Reward Points** — Ledger/transaction system; points earned/redeemed as history records
- [ ] **Page Builder** — Native in EE; CE requires 3rd-party; stored as structured HTML with `data-content-type` attributes
- [ ] **RMA** — Workflow for returns (not the same as credit memo); RMA results in credit memo, not the same thing
- [ ] **Async Order** — Message queue backed; tradeoff is overselling risk vs higher throughput
- [ ] **Advanced Reporting (MBI)** — SaaS BI product; data leaves your instance; `Magento_Analytics` module handles sync
- [ ] **CMS Hierarchy** — Tree structure for CMS pages; generates breadcrumbs and nested URLs
- [ ] **CMS Restrictions** — Access control for categories/CMS by customer group; different from hierarchy
- [ ] **Live Search** — SaaS subscription (not just EE); replaces OpenSearch entirely; served via GraphQL; requires API key setup

### row_id Architecture (Content Staging)

- [ ] In EE, **`row_id` is the PK** of entity tables (not `entity_id`)
- [ ] `entity_id` identifies the product permanently; `row_id` identifies a specific version
- [ ] EAV tables use `row_id` as FK in EE
- [ ] Custom modules using `entity_id` as FK to product tables will **break staging**
- [ ] Staging version lookup filters by `created_in <= now AND updated_in > now`

### Plugin Rules

- [ ] `before` — modify input args; return array of modified args or `null`
- [ ] `after` — modify return value; receives `$result` as second parameter
- [ ] `around` — wraps original; must call `$proceed()` or original is skipped
- [ ] Plugins **cannot** intercept: `final` methods, `private` methods, `__construct()`, `static` methods
- [ ] Prefer `before`/`after` over `around` for performance
- [ ] Multiple plugins on same method: sorted by `sortOrder`; same order → **module load sequence** (NOT alphabetical by type name — no alphabetical tiebreaker exists in `PluginList/PluginList.php`)

### Extension Attributes

- [ ] Declared in `extension_attributes.xml`
- [ ] Auto-generates `{Interface}Extension` and `{Interface}ExtensionInterface` on `di:compile`
- [ ] Always use: `$obj->getExtensionAttributes() ?? $factory->create()`
- [ ] Must add `afterGet` AND `afterGetList` plugins on Repository to populate in both cases
- [ ] Extension Attributes ≠ Custom Attributes (EAV); EA is for API objects, CA is for EAV entities

### Message Queue

- [ ] Four XML files: `communication.xml`, `queue_topology.xml`, `queue_consumer.xml`, `queue_publisher.xml`
- [ ] Use case: any process >1 second that would block user-facing request
- [ ] Tradeoff: **availability vs. consistency** — async means potential overselling
- [ ] RabbitMQ for production; DB queue for dev/simple flows
- [ ] Consumers run via: `bin/magento queue:consumers:start {consumer_name}`

### Varnish & 503

- [ ] 503 after deploy = Varnish health check probe not yet confirmed backend is healthy
- [ ] Backend marked SICK until `threshold` of `window` probes pass
- [ ] Fix: adjust probe timing OR use blue/green deployment
- [ ] Flushing Varnish cache does NOT fix this (it's a health check problem)
- [ ] `/health_check.php` is the probe endpoint; should test DB connectivity at minimum

### Indexer & Performance

- [ ] `Update on Save` = synchronous; slow Admin saves; risk of partial index during save
- [ ] `Update by Schedule` = MView/cron delta; fast saves; up to 1 minute latency before index updated
- [ ] MView changelog table: `{entity_table}_cl` (e.g., `catalog_product_cl`)
- [ ] Switch mode: `bin/magento indexer:set-mode schedule`
- [ ] Full reindex: `bin/magento indexer:reindex`
- [ ] Flat catalog: denormalizes EAV; faster reads for large catalogs

### Cache Tags / identities()

- [ ] `identities()` must return **specific entity tags** (e.g., `cat_p_123`), not generic tags (`cat_p`)
- [ ] Generic tag invalidation = entire cache for that entity type is flushed
- [ ] Varnish uses BAN requests based on `X-Magento-Tags` response header
- [ ] Cache tag format: `{CACHE_TAG}_{id}` e.g., `cat_p_42`, `cat_c_7`, `cms_p_3`
- [ ] Empty `identities()` = block never invalidated (stale data risk)
- [ ] `cache:flush` = full flush (all types); `cache:clean` = clean expired entries

### Architectural Decision Principles

- [ ] **Customization hierarchy**: Layout XML → Plugin → Extension Attr → Preference → (never) core edit
- [ ] **Service Contracts**: Always use Repository/API interfaces; never call `model->load()` directly
- [ ] **Preference vs Plugin**: Use Plugin first; Preference only when class/method cannot be intercepted
- [ ] **Observer vs Plugin**: Observer for existing events + no return value modification; Plugin when you need to modify returns or intercept non-evented methods
- [ ] **Why Plugin over Preference**: Preferences conflict when multiple modules override same class; plugins stack safely
- [ ] **Why async over sync**: Async = higher throughput, faster UX; tradeoff = eventual consistency, potential overselling
- [ ] **Why schedule indexing over save**: Schedule = fast Admin saves, delta processing, no storefront impact during reindex
