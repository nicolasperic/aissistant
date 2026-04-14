# REST & GraphQL API Design — Magento 2 Architect Study Notes

**Goal:** Week 1 — Section 1: Design Foundations
**Date:** Apr 15

---

## Table of Contents

1. [Big-Picture Architecture Map](#1-big-picture-architecture-map)
2. [REST API Design Foundations](#2-rest-api-design-foundations)
   - [webapi.xml — Route, Method, Service, ACL](#webapi.xml--route-method-service-acl)
   - [ACL Resources & `ref="self"`](#acl-resources--refself)
   - [REST Serialization Pipeline](#rest-serialization-pipeline)
   - [Sync vs Async vs Async Bulk](#sync-vs-async-vs-async-bulk)
   - [Authentication — OAuth 1.0a & Admin Tokens](#authentication--oauth-10a--admin-tokens)
3. [GraphQL API Design Foundations](#3-graphql-api-design-foundations)
   - [Schema.graphqls — Types, Queries, Mutations](#schemagraphqls--types-queries-mutations)
   - [Extending Core Schema Without Modifying It](#extending-core-schema-without-modifying-it)
   - [Resolver Wiring via di.xml](#resolver-wiring-via-dixml)
   - [Batch Resolvers & N+1 Prevention](#batch-resolvers--n1-prevention)
   - [GET vs POST — The FPC Caching Trap](#get-vs-post--the-fpc-caching-trap)
4. [Hands-On: Exploring module-catalog-graph-ql](#4-hands-on-exploring-module-catalog-graph-ql)
5. [Architectural Decision Framework](#5-architectural-decision-framework)
6. [Scenario-Based Practice Questions](#6-scenario-based-practice-questions)
7. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Big-Picture Architecture Map

```
+---------------------------+      +---------------------------+
|        REST API           |      |       GraphQL API         |
|  /rest/V1/...             |      |  /graphql                 |
|  /async/V1/...            |      |                           |
|  /async/bulk/V1/...       |      |  Single endpoint          |
+---------------------------+      +---------------------------+
          |                                    |
          v                                    v
+------------------+                +---------------------+
| webapi.xml       |                | Schema.graphqls      |
| (route/ACL/svc)  |                | (types/queries/mut.) |
+------------------+                +---------------------+
          |                                    |
          v                                    v
+------------------+                +---------------------+
| Service Contract |                | Resolver (di.xml    |
| Interface in     |                |  wiring)            |
| Api/             |                +---------------------+
+------------------+                         |
          |                                  v
          v                        +---------------------+
+------------------+               | Batch Resolver      |
| DataObjectHelper |               | (N+1 prevention)    |
| (PHP -> JSON)    |               +---------------------+
+------------------+
          |
          v
+------------------+
| Auth Layer       |
| OAuth1a / Token  |
+------------------+
```

**Exam focus:** The two API surfaces (REST and GraphQL) sit on top of the same underlying service contract layer. An architect must know *when* to recommend each and *why*.

---

## 2. REST API Design Foundations

### webapi.xml — Route, Method, Service, ACL

Every REST endpoint is declared in `etc/webapi.xml`. This is the **only** place Magento looks to expose a PHP method over HTTP.

```xml
<?xml version="1.0"?>
<routes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Webapi:etc/webapi.xsd">

    <!-- Standard resource: any authenticated admin/integration can fetch -->
    <route url="/V1/products/:sku" method="GET">
        <service class="Magento\Catalog\Api\ProductRepositoryInterface"
                 method="get"/>
        <resources>
            <resource ref="Magento_Catalog::products"/>
        </resources>
    </route>

    <!-- Customer-scoped resource: customer accesses ONLY their own data -->
    <route url="/V1/customers/me" method="GET">
        <service class="Magento\Customer\Api\AccountManagementInterface"
                 method="getCustomerByToken"/>
        <resources>
            <resource ref="self"/>
        </resources>
    </route>

    <!-- POST example with request body -->
    <route url="/V1/orders" method="POST">
        <service class="Magento\Sales\Api\OrderRepositoryInterface"
                 method="save"/>
        <resources>
            <resource ref="Magento_Sales::actions"/>
        </resources>
    </route>

</routes>
```

**Key anatomy:**

| Attribute | Purpose | Architect note |
|-----------|---------|----------------|
| `url` | URI pattern; `:param` = path variable | Versioned with `/V1/` |
| `method` | HTTP verb (GET/POST/PUT/DELETE) | Must match REST semantics |
| `class` | PHP Service Contract **interface** in `Api/` | Must be an interface, not a class |
| `method` (service) | The specific PHP method to invoke | Must exist in `Api/` namespace |
| `resource ref` | ACL resource or `self` | Controls who can call this |

**Exam focus:**
- The `class` attribute must point to an **interface** (service contract), never a concrete class.
- If the PHP method is **not declared in a class under the `Api/` directory**, it is **not exposed** via REST regardless of webapi.xml entries.
- `method="DELETE"` routes should be idempotent — the same call twice produces the same state.

---

### ACL Resources & `ref="self"`

#### Standard ACL Resource

```xml
<resource ref="Magento_Customer::manage"/>
```

- Caller must possess the `Magento_Customer::manage` ACL permission.
- Admin users, integrations, and tokens are evaluated against the ACL tree.

#### The Special `ref="self"` Token

```xml
<resource ref="self"/>
```

**What it means architecturally:**

```
Customer token (Bearer)
        |
        v
+----------------------------+
|  Magento resolves token    |
|  to customer entity ID     |
+----------------------------+
        |
        v
+----------------------------+
| ref="self" enforces:       |
| customer ID in token MUST  |
| equal customer ID in route |
+----------------------------+
        |
    +---+---+
    |       |
  MATCH   NO MATCH
    |       |
  200 OK  403 Forbidden
```

**Exam focus:**
- `ref="self"` is **not just documentation** — Magento enforces it at the framework level; a customer with token A **cannot** access `/V1/customers/2` even if ID 2 exists.
- `ref="self"` only works for **customer tokens**. Admin and integration tokens bypass it.
- This is the correct mechanism for building customer-scoped endpoints (e.g., `/V1/carts/mine`, `/V1/customers/me`).
- The **me** URL convention signals `ref="self"` — always use `:customerId` = `me` in the URL when using `ref="self"`.

#### Why Not Just Validate in the Service?

A common wrong answer on the exam: "validate the customer ID inside the service implementation." This is architecturally inferior because:
- It couples security logic to business logic.
- It requires every implementation to repeat the same guard.
- `ref="self"` enforces it declaratively at the framework layer, before the service is even called.

---

### REST Serialization Pipeline

Understanding this pipeline explains **why** method placement matters.

```
HTTP Request (JSON body)
        |
        v
+---------------------------+
| Magento_Webapi Router     |
| matches route in           |
| webapi.xml                |
+---------------------------+
        |
        v
+---------------------------+
| InputParamsResolver       |
| (JSON -> PHP scalars/DTOs)|
+---------------------------+
        |
        v
+---------------------------+
| Service Contract Method   |
| (in Api/ interface)       |
+---------------------------+
        |
        v
+---------------------------+
| DataObjectHelper          |
| populateWithArray()       |
| (PHP Data Object -> array)|
+---------------------------+
        |
        v
+---------------------------+
| Serializer (JSON)         |
| array -> JSON response    |
+---------------------------+
```

#### The `Api/` Directory Rule

```
module-root/
  Api/
    ProductRepositoryInterface.php    <-- EXPOSED (in Api/)
    Data/
      ProductInterface.php            <-- DTO (also exposed via DataObjectHelper)
  Model/
    ProductRepository.php             <-- Implementation (NOT exposed directly)
    InternalHelper.php                <-- NEVER exposed
```

**Exam focus:**
- A method must be declared in an **interface under `Api/`** to be serializable.
- `Api/Data/` interfaces define **DTOs** — their getters/setters are auto-serialized to JSON keys (snake_case).
- `DataObjectHelper::populateWithArray()` is the mechanism that maps JSON fields to DTO setter calls.
- **Return types matter**: if a service method returns `void`, the response body is empty. If it returns a DTO, Magento serializes all its getters.

#### PHP Interface → JSON Mapping Example

```php
// Api/Data/ProductInterface.php
namespace Magento\Catalog\Api\Data;

interface ProductInterface
{
    public function getSku(): string;       // -> "sku": "..."
    public function getName(): ?string;     // -> "name": "..."
    public function getPrice(): ?float;     // -> "price": ...
    public function getExtensionAttributes(): ProductExtensionInterface; // -> "extension_attributes": {}
}
```

```json
{
  "sku": "MH01-XS-Black",
  "name": "Chaz Kangeroo Hoodie",
  "price": 52.00,
  "extension_attributes": {}
}
```

**Exam focus:** The JSON key is the getter name stripped of `get` and converted to `snake_case`. `getExtensionAttributes()` → `extension_attributes`. This is automatic — no annotation needed.

---

### Sync vs Async vs Async Bulk

This is a **high-value decision-making topic** on the architect exam.

#### Overview Table

| Mode | URL Pattern | Mechanism | Use When |
|------|-------------|-----------|----------|
| Synchronous | `/rest/V1/...` | Direct PHP execution, response in same request | Real-time data retrieval, small writes, UI-driven operations |
| Single Async | `/rest/async/V1/...` | Publishes to RabbitMQ, returns bulk UUID | Single long-running write, fire-and-forget updates |
| Bulk Async | `/rest/async/bulk/V1/...` | Array of operations → queue | Mass data import, multi-record updates |

#### Synchronous REST

```bash
# Standard sync call
curl -X GET https://store.example.com/rest/V1/products/MH01 \
  -H "Authorization: Bearer <admin_token>"

# Response is immediate — waits for PHP execution
{
  "id": 67,
  "sku": "MH01",
  "name": "Chaz Kangeroo Hoodie",
  ...
}
```

**When to recommend:**
- Reading data (GET requests — always sync).
- Low-latency writes where the caller needs confirmation.
- Checkout, cart, and customer operations where the UI waits for the result.

#### Single Async REST

```bash
# Async single write
curl -X POST https://store.example.com/rest/async/V1/products \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"product": {"sku": "NEW-001", "name": "New Product", ...}}'

# Response: immediately returns a bulk UUID
{
  "bulk_uuid": "c3d2e1f0-...",
  "request_items": [{"id": 0, "data_hash": "...", "status": "accepted"}],
  "errors": false
}
```

**When to recommend:**
- Single writes where the caller does **not** need an immediate result.
- Preventing timeout on slow operations (e.g., reindexing triggered by product save).
- External integrations that publish and poll.

#### Bulk Async REST

```bash
# Async bulk — array of operations
curl -X POST https://store.example.com/rest/async/bulk/V1/products \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '[
    {"product": {"sku": "BULK-001", "name": "Product 1", "price": 10.00}},
    {"product": {"sku": "BULK-002", "name": "Product 2", "price": 20.00}},
    {"product": {"sku": "BULK-003", "name": "Product 3", "price": 30.00}}
  ]'

# Returns bulk UUID — poll /rest/V1/bulk/{bulkUuid}/status for results
```

**When to recommend:**
- ERP/PIM integrations pushing thousands of products.
- Mass price updates, inventory sync.
- Any scenario where processing time per item is significant.

**Exam focus — Decision scenarios:**

> *"An ERP pushes 5,000 product updates every night. Which API mode?"*
> **Answer: `/async/bulk/V1/`** — because synchronous would timeout, single async would create 5,000 separate queue messages without batching efficiency.

> *"A PWA storefront needs to display live inventory."*
> **Answer: Synchronous REST (or GraphQL)** — real-time read, caller waits for response.

> *"A customer updates their address. Which mode?"*
> **Answer: Synchronous** — customer expects immediate confirmation; async would be poor UX.

> *"Why NOT use async for GET requests?"*
> **Answer: Async only works for write operations (POST/PUT/DELETE). GET requests through async endpoints are not supported architecturally** — the queue model doesn't have a mechanism to return fetched data to the caller.

---

### Authentication — OAuth 1.0a & Admin Tokens

#### Token Types Comparison

| Type | Mechanism | Expiry | Use Case |
|------|-----------|--------|----------|
| Admin Token | Bearer token via `/V1/integration/admin/token` | Configurable (default 4h) | Scripts, testing, admin UI AJAX |
| Customer Token | Bearer token via `/V1/integration/customer/token` | Configurable | Customer-facing apps, mobile |
| Integration Token (OAuth 1.0a) | OAuth 1.0a handshake | **Non-expiring** (until revoked) | Third-party systems, ERPs |
| Guest Token | No token (anonymous) | N/A | Public catalog reads |

#### Admin Token (Simple Bearer)

```bash
# Step 1: Get token
curl -X POST https://store.example.com/rest/V1/integration/admin/token \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin@123"}'

# Response
"abc123xyz..."

# Step 2: Use token
curl -X GET https://store.example.com/rest/V1/products \
  -H "Authorization: Bearer abc123xyz..."
```

**Exam focus:**
- Admin token expiry is set in **Stores > Configuration > Services > OAuth > Access Token Expiration**.
- Default is **4 hours**. After expiry, a 401 is returned and a new token must be requested.
- Admin tokens are **not OAuth** — they are a simpler proprietary bearer mechanism.
- For production integrations, **admin tokens are discouraged** due to expiry and credential management concerns.

#### OAuth 1.0a Integration Tokens

```
Third-Party App              Magento
     |                          |
     |-- Request Token -------> |
     |                          |
     |<-- oauth_token --------- |
     |    oauth_token_secret    |
     |                          |
     |-- User Authorizes -----> | (Admin approves in backend)
     |                          |
     |-- Access Token Request-> |
     |                          |
     |<-- access_token -------- |
     |    access_token_secret   |
     |                          |
     |-- API Calls (signed) --> |
     |   (no expiry on token)   |
```

**Exam focus:**
- OAuth 1.0a integration tokens **do not expire** — they are valid until revoked.
- This makes them suitable for **long-running ERP integrations** that cannot handle re-authentication.
- Each API call is **signed** with HMAC-SHA1 using consumer key/secret + token/secret — no Bearer header.
- The architect recommendation: use **OAuth 1.0a integrations** for machine-to-machine, use **admin tokens** only for temporary scripts or testing.
- Integration tokens have their own ACL scope defined when creating the integration in Admin.

---

## 3. GraphQL API Design Foundations

### Schema.graphqls — Types, Queries, Mutations

GraphQL schema is defined in `etc/schema.graphqls` within each module.

#### Type Definitions

```graphql
# Defining a custom type
type VendorProduct {
    sku: String! @doc(description: "Product SKU")
    name: String @doc(description: "Product name")
    price: Float @doc(description: "Base price")
    custom_attribute: String @resolver(class: "Vendor\\Module\\Model\\Resolver\\CustomAttribute")
}
```

#### Query Declarations

```graphql
# Adding a query entry point
type Query {
    vendorProduct(sku: String! @doc(description: "The product SKU")): VendorProduct
        @resolver(class: "Vendor\\Module\\Model\\Resolver\\Product")
        @doc(description: "Fetch a vendor product by SKU")
        @cache(cacheIdentity: "Vendor\\Module\\Model\\Resolver\\Product\\Identity")
}
```

#### Mutation Declarations

```graphql
# Adding a mutation entry point
type Mutation {
    addVendorProductToWishlist(
        sku: String!
        wishlistId: Int!
    ): AddVendorProductToWishlistOutput
        @resolver(class: "Vendor\\Module\\Model\\Resolver\\AddToWishlist")
        @doc(description: "Add vendor product to wishlist")
}

type AddVendorProductToWishlistOutput {
    wishlist: Wishlist! @doc(description: "Updated wishlist")
}
```

**Exam focus:**
- **Every** query and mutation requires a `@resolver` directive pointing to a PHP class.
- `@doc` is not optional on exam best-practices — it enables schema introspection documentation.
- `@cache(cacheIdentity: ...)` on queries tells Magento which cache tags to use — omitting it means the query is **never cached by FPC**.
- The `!` suffix (e.g., `String!`) means **non-null** — GraphQL will error if the resolver returns null for a non-null field.

---

### Extending Core Schema Without Modifying It

This is a **critical architectural pattern**. Never edit `vendor/` files.

#### The `extend type` Pattern

```graphql
# Your module: Vendor/CustomCatalog/etc/schema.graphqls
# Extending core ProductInterface WITHOUT touching vendor/

extend type ProductInterface {
    carbon_footprint: Float @doc(description: "Product carbon footprint in kg CO2")
        @resolver(class: "Vendor\\CustomCatalog\\Model\\Resolver\\CarbonFootprint")
}

extend type Query {
    sustainabilityReport(from: String, to: String): SustainabilityReport
        @resolver(class: "Vendor\\CustomCatalog\\Model\\Resolver\\SustainabilityReport")
        @doc(description: "Generate sustainability report")
}
```

**What this achieves:**

```
vendor/magento/module-catalog-graph-ql/
  etc/schema.graphqls
    type ProductInterface { ... }    <-- Core (NEVER touch)
    type Query { products(...) }     <-- Core query

Vendor/CustomCatalog/
  etc/schema.graphqls
    extend type ProductInterface     <-- Your addition (safe)
    extend type Query                <-- Your addition (safe)
```

**Exam focus:**
- `extend type Query` is the **correct** way to add new GraphQL queries — not forking the core schema.
- `extend type` merges at schema compilation time — no core files are modified.
- If two modules both extend the same type with different fields, they **coexist** without conflict as long as field names don't collide.
- This is architecturally equivalent to `di.xml` plugins — non-invasive extension.

---

### Resolver Wiring via di.xml

The `@resolver` directive in `.graphqls` files points to a class, but the actual **instantiation and interface binding** is handled by `di.xml`.

#### ResolverInterface

```php
<?php
// Vendor/Module/Model/Resolver/CustomAttribute.php

namespace Vendor\Module\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

class CustomAttribute implements ResolverInterface
{
    public function __construct(
        private readonly SomeService $service
    ) {}

    /**
     * @param Field $field
     * @param $context
     * @param ResolveInfo $info
     * @param array|null $value     // Parent type's resolved data
     * @param array|null $args      // Query arguments
     */
    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ): mixed {
        // $value contains the parent object's data (e.g., product array)
        $sku = $value['sku'] ?? null;

        if (!$sku) {
            throw new GraphQlNoSuchEntityException(__('SKU not available'));
        }

        return $this->service->getCustomAttributeForSku($sku);
    }
}
```

#### di.xml Wiring (When Using Interfaces)

```xml
<!-- Vendor/Module/etc/di.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">

    <!-- If @resolver points to an interface, wire the concrete class here -->
    <preference for="Vendor\Module\Api\Resolver\CustomAttributeInterface"
                for="Vendor\Module\Model\Resolver\CustomAttribute"/>

    <!-- Constructor argument injection for resolvers -->
    <type name="Vendor\Module\Model\Resolver\ProductList">
        <arguments>
            <argument name="searchCriteria" xsi:type="object">
                Magento\Framework\Api\SearchCriteriaBuilder
            </argument>
        </arguments>
    </type>

</config>
```

**Exam focus:**
- If `@resolver(class: "...")` references a **concrete class**, di.xml wiring is optional (object manager instantiates it directly).
- If it references an **interface**, a `<preference>` in di.xml is **required**.
- The `$value` parameter in `resolve()` contains the **parent resolver's output** — this is how field resolvers receive context from their parent type resolver.
- `$context` contains the GraphQL request context including the **current customer** — use `$context->getUserId()` for customer-aware resolvers.

---

### Batch Resolvers & N+1 Prevention

This is the most technically nuanced GraphQL topic on the exam.

#### The N+1 Problem Illustrated

```
Query:
{
  products(filter: {category_id: {eq: "5"}}) {
    items {
      sku
      name
      seller {          <-- Custom field, requires seller lookup
        name
        rating
      }
    }
  }
}

Without Batch Resolver:
- 1 query: fetch 20 products
- 20 queries: fetch seller for product 1, 2, 3... 20
= 21 total DB queries (N+1)

With Batch Resolver:
- 1 query: fetch 20 products
- 1 query: fetch sellers for IDs [1,2,3...20] WHERE id IN (...)
= 2 total DB queries
```

#### Implementing a Batch Resolver

```php
<?php
// Vendor/Module/Model/Resolver/Seller.php

namespace Vendor\Module\Model\Resolver;

use Magento\Framework\GraphQl\Query\Resolver\BatchRequestItemInterface;
use Magento\Framework\GraphQl\Query\Resolver\BatchResolverInterface;
use Magento\Framework\GraphQl\Query\Resolver\BatchResponse;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

class Seller implements BatchResolverInterface
{
    public function __construct(
        private readonly SellerRepository $sellerRepository
    ) {}

    /**
     * @param Field $field
     * @param BatchRequestItemInterface[] $requests
     * @return BatchResponse
     */
    public function resolve(Field $field, array $requests): BatchResponse
    {
        // Step 1: Collect ALL seller IDs from all pending requests
        $sellerIds = [];
        foreach ($requests as $request) {
            $sellerIds[] = $request->getValue()['seller_id']; // from parent product data
        }

        // Step 2: ONE batch query to fetch all sellers
        $sellers = $this->sellerRepository->getByIds(array_unique($sellerIds));
        $sellerMap = [];
        foreach ($sellers as $seller) {
            $sellerMap[$seller->getId()] = $seller;
        }

        // Step 3: Distribute results back to each request
        $response = new BatchResponse();
        foreach ($requests as $request) {
            $sellerId = $request->getValue()['seller_id'];
            $seller = $sellerMap[$sellerId] ?? null;

            $response->addResponse(
                $request,
                $seller ? ['name' => $seller->getName(), 'rating' => $seller->getRating()] : null
            );
        }

        return $response;
    }
}
```

#### BatchRequestItemInterface Contract

```php
interface BatchRequestItemInterface
{
    // Get the parent resolved value (e.g., the product array)
    public function getValue(): array;

    // Get the query args for this specific field instance
    public function getArgs(): array;

    // Get the ResolveInfo (field selection, etc.)
    public function getInfo(): ResolveInfo;

    // Get the context
    public function getContext(): ContextInterface;
}
```

**Exam focus:**
- `BatchResolverInterface` replaces `ResolverInterface` — they are **mutually exclusive**; implement one or the other.
- The batch resolver receives an **array** of `BatchRequestItemInterface` — one per product that needs this field.
- The response must map each request to its result via `BatchResponse::addResponse()`.
- **When to recommend batch resolvers:** Any resolver that fetches a related entity (seller, brand, inventory) for a field on a list type. Rule of thumb: if the field appears on a type that can appear in a list (`items { ... }`), use batch.
- **Cost of NOT batching:** Exponential query growth on collection pages. A category page with 48 products and 3 non-batched custom fields = 144 extra queries.

---

### GET vs POST — The FPC Caching Trap

This is called out as "tricky" and is a **high-priority exam topic**.

#### The Core Rule

```
GraphQL Queries  --> SHOULD use GET  --> FPC can cache the response
GraphQL Mutations --> MUST use POST  --> FPC never caches (correct)

Common Mistake:
  Use POST for ALL GraphQL requests
  --> FPC skips ALL of them (even queries)
  --> Every product/category page load hits the application
  --> Performance disaster at scale
```

#### How FPC Caching Works with GraphQL GET

```
Browser/PWA
    |
    | GET /graphql?query={products(...)}&variables={...}
    v
+------------------+
| Varnish / FPC    |
| (checks cache)   |
+------------------+
    |           |
  HIT          MISS
    |           |
    | Cached    | Forwards to PHP
    | response  |
    v           v
  200 OK    +------------------+
  (instant) | GraphQL Resolver |
            | @cache directive |
            | generates tags   |
            +------------------+
                   |
                   v
            +------------------+
            | FPC stores with  |
            | cache tags       |
            | (e.g., cat_1)    |
            +------------------+
```

#### When GET Works for GraphQL

```bash
# Correct: Query via GET (cacheable)
curl -G https://store.example.com/graphql \
  --data-urlencode 'query={
    products(filter: {sku: {eq: "MH01"}}) {
      items { name price }
    }
  }'

# Also valid with variables
curl -G https://store.example.com/graphql \
  --data-urlencode 'query=query GetProduct($sku: String!) {
    products(filter: {sku: {eq: $sku}}) {
      items { name price }
    }
  }' \
  --data-urlencode 'variables={"sku": "MH01"}'
```

#### When POST is Required

```bash
# Correct: Mutation via POST (never cacheable, correct behavior)
curl -X POST https://store.example.com/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation AddToCart($cartId: String!, $sku: String!) { addProductsToCart(...) }",
    "variables": {"cartId": "abc", "sku": "MH01"}
  }'
```

#### The Architectural Decision Table

| Scenario | HTTP Method | Reasoning |
|----------|-------------|-----------|
| Fetch product list for category page | GET | Cacheable, same result for all guests |
| Fetch cart contents | POST | Customer-specific, must not be cached |
| Place order (mutation) | POST | Write operation, must use POST |
| CMS page content query | GET | Cacheable, all guests see same content |
| Authenticated customer query | POST (or GET with auth header) | Personalized, Varnish strips auth headers |
| Persisted queries | GET | Industry best practice for production PWA |

**Exam focus:**
- Using POST for everything is a **performance anti-pattern** even if it "works" functionally.
- The `@cache` directive in `.graphqls` only takes effect when the request is a GET.
- Varnish (by default) does **not** cache POST requests — this is HTTP spec behavior, not Magento-specific.
- In a PWA architecture, the storefront should send **queries as GET** and **mutations as POST** — this is the architecturally correct recommendation.
- Some legacy GraphQL clients default to POST for everything — this is an integration concern to flag during architecture review.

---

## 4. Hands-On: Exploring module-catalog-graph-ql

**Location:** `vendor/magento/module-catalog-graph-ql/`

### Schema.graphqls Key Patterns

```bash
# Navigate to the module
cd vendor/magento/module-catalog-graph-ql/

# Key files to study
etc/schema.graphqls          # Main schema definitions
Model/Resolver/              # All resolver classes
Model/Resolver/Product.php   # Top-level product resolver
Model/Resolver/Products/     # Sub-resolvers for product fields
```

#### What to Look for in schema.graphqls

```graphql
# Pattern 1: Interface usage (ProductInterface vs concrete type)
interface ProductInterface @typeResolver(class: "Magento\\CatalogGraphQl\\Model\\ProductInterfaceTypeResolverComposite") {
    id: Int @deprecated(reason: "Use the `uid` field instead")
    name: String @doc(description: "The name of the product")
    sku: String @doc(description: "A SKU")
    # ... many more fields
}

# Pattern 2: Type resolver for polymorphism
type SimpleProduct implements ProductInterface & RoutableInterface {
    # Inherits all ProductInterface fields
}

type ConfigurableProduct implements ProductInterface & RoutableInterface {
    configurable_options: [ConfigurableProductOptions] @resolver(class: "Magento\\ConfigurableProductGraphQl\\Model\\Resolver\\ConfigurableOptions")
}

# Pattern 3: The products query with search/filter/sort/pagination
type Query {
    products(
        search: String,
        filter: ProductAttributeFilterInput,
        pageSize: Int = 20,
        currentPage: Int = 1,
        sort: ProductAttributeSortInput
    ): Products @resolver(class: "Magento\\CatalogGraphQl\\Model\\Resolver\\Products")
    @doc(description: "Search for products that match the criteria")
    @cache(cacheIdentity: "Magento\\CatalogGraphQl\\Model\\Resolver\\Product\\Identity")
}
```

**What this teaches you:**
- `@typeResolver` handles **polymorphism** — when a field returns an interface, Magento must determine the concrete type at runtime.
- The `@deprecated` directive is used for graceful field deprecation.
- `@cache(cacheIdentity: ...)` wires the resolver to a cache identity provider that generates cache tags.

### Resolver Class Patterns

```php
// vendor/magento/module-catalog-graph-ql/Model/Resolver/Products.php
// Key patterns to observe:

// 1. Implements ResolverInterface
class Products implements ResolverInterface

// 2. Uses SearchCriteriaBuilder for filter handling
// 3. Returns 'model' key in the result array for child resolvers
// 4. Returns pagination metadata alongside items

// Typical return structure:
return [
    'total_count' => $searchResult->getTotalCount(),
    'items'       => $productsData,            // array of product data
    'page_info'   => [
        'page_size'    => $pageSize,
        'current_page' => $currentPage,
        'total_pages'  => $totalPages
    ],
    'search_result' => $searchResult,           // for child resolvers
    'layer_type'   => isset($args['search']) ? Resolver::CATALOG_LAYER_SEARCH : Resolver::CATALOG_LAYER_CATEGORY,
];
```

**Exam focus:**
- Parent resolvers pass **raw arrays** to child resolvers via the `$value` parameter — not model objects.
- The `'model'` key convention allows child resolvers to access the underlying model when needed.
- `ProductInterfaceTypeResolverComposite` is the concrete type resolver that determines whether a product is `SimpleProduct`, `ConfigurableProduct`, etc. — this is the polymorphism pattern.

### Directory Structure to Internalize

```
module-catalog-graph-ql/
  etc/
    schema.graphqls              # Type definitions, queries
  Model/
    Resolver/
      Product.php                # Single product resolver
      Products.php               # Product collection resolver
      Products/
        DataProvider.php         # Data fetching, separated from resolver
        Query/
          Filter.php             # Filter argument processing
          Search.php             # Search handling
      CategoryList.php           # Category resolver
  Plugin/                        # Plugins on other resolvers
```

**Architectural observation:** The separation of `Resolver/` from `DataProvider/` is a best practice — resolvers handle GraphQL concerns (argument parsing, response shaping), data providers handle persistence concerns (querying, filtering). This makes unit testing far easier.

---

## 5. Architectural Decision Framework

Use this framework when answering scenario-based exam questions.

### API Surface Selection

```
Is the client a storefront (PWA/browser)?
  |
  +-- Yes --> Prefer GraphQL
  |           Reason: request exactly what you need,
  |           no over/under-fetching
  |
  +-- No, it's a server-to-server integration?
        |
        +-- Reads only? --> REST (GET) or GraphQL (GET)
        |
        +-- Writes, time-sensitive? --> REST Sync
        |
        +-- Writes, bulk, not time-sensitive? --> REST Async Bulk
        |
        +-- Long-running ERP? --> REST Async + OAuth 1.0a
```

### Authentication Selection

```
Who is calling?
  |
  +-- Admin user (temporary/testing) --> Admin Token (Bearer)
  |
  +-- Logged-in customer --> Customer Token (Bearer, ref="self")
  |
  +-- Third-party system (permanent) --> OAuth 1.0a Integration
  |
  +-- Anonymous guest --> No token (ACL: anonymous)
```

### GraphQL Resolver Type Selection

```
Does this field appear on a type used in a list?
  (e.g., items { ... custom_field ... })
  |
  +-- Yes --> BatchResolverInterface (prevents N+1)
  |
  +-- No, it's a top-level query or single-item field
        |
        +-- ResolverInterface (simpler)
```

### Cache Strategy

```
Is this a GraphQL query (not mutation)?
  |
  +-- Yes --> Use GET, add @cache directive with cacheIdentity
  |           Result: Varnish/FPC can cache it
  |
  +-- No (mutation, or customer-specific) --> POST
            Result: Never cached (correct behavior)
```

---

## 6. Scenario-Based Practice Questions

### Question 1

> A third-party ERP system needs to sync 10,000 product prices every night. The current implementation uses synchronous REST POST calls in a loop. What is the architecturally correct recommendation?

**Wrong answers (and why):**
- "Increase PHP timeout limits" — treats the symptom, not the cause.
- "Use GraphQL mutations instead" — GraphQL has no async bulk mechanism.
- "Use `/async/V1/products` in a loop" — creates 10,000 separate queue messages, no batching benefit.

**Correct answer:** Use `/rest/async/bulk/V1/products` with arrays of up to 500 items per request. Combine with OAuth 1.0a for the integration token (non-expiring). This:
1. Decouples processing from HTTP request lifecycle.
2. Leverages RabbitMQ for reliable, retry-capable processing.
3. Allows the ERP to poll for completion status without holding connections.

---

### Question 2

> A PWA developer reports that category pages are slow because every product on the page triggers a separate query for the product's brand information. The brand resolver implements `ResolverInterface`. What is the fix?

**Correct answer:** Convert the brand resolver to implement `BatchResolverInterface`. Instead of one DB query per product, collect all `brand_id` values from all product requests and execute a single `WHERE id IN (...)` query, then distribute results via `BatchResponse`.

---

### Question 3

> A module adds a new GraphQL query. The developer has placed the type definition in `schema.graphqls` and the resolver class is correct. However, the query returns `null` for authenticated customers. What is likely missing?

**Correct answer:** The resolver is not checking `$context->getUserId()` or the resolver needs customer authorization. OR — more likely for an architect question — the developer used `type Query { ... }` instead of `extend type Query { ... }`, causing a schema conflict/override. Use `extend type Query` to add queries from custom modules.

---

### Question 4

> Two architects debate API design for a checkout page. Architect A says use REST for all checkout operations. Architect B says use GraphQL. What architectural factors determine the right choice?

**Framework answer:**
- **Use GraphQL** if: The storefront is a PWA that needs flexible field selection, the checkout flow needs to compose multiple data sources in one request, and the team can implement proper GET/POST discipline for caching.
- **Use REST** if: The integration is server-to-server, the checkout involves async operations, or the existing team has REST expertise and the integration pattern is well-defined.
- **Architect's actual answer:** Magento's Luma/Hyvä themes use REST for checkout operations. PWA Studio (Venia) uses GraphQL. Neither is universally "correct" — the choice depends on client type and team capability.

---

### Question 5

> A customer service tool needs to allow CS agents to view any customer's order history. What ACL configuration is appropriate, and what should NOT be used?

**Correct answer:**
- Use `<resource ref="Magento_Sales::actions"/>` (or appropriate sales ACL resource) for admin-level access.
- Do **NOT** use `ref="self"` — that is for customers accessing their own data only.
- Do NOT make the endpoint anonymous (no resource) — that would expose all customers' data.

---

## Quick-Reference Checklist

### REST API

- [ ] `webapi.xml` defines: `url`, HTTP `method`, `service class` (interface), `service method`, ACL `resource`.
- [ ] The `class` in `<service>` **must** be an interface located in the `Api/` directory.
- [ ] A PHP method **not in an `Api/` interface** is **never exposed** via REST, regardless of webapi.xml.
- [ ] `ref="self"` restricts access to a customer's **own** data; enforced at framework level, not in service code.
- [ ] `ref="self"` only enforces scope for **customer tokens**; admin/integration tokens bypass it.
- [ ] JSON serialization is handled by `DataObjectHelper`; getter names map to snake_case JSON keys automatically.
- [ ] Synchronous REST: real-time reads and UI-driven writes where the caller waits.
- [ ] `/async/V1/`: single fire-and-forget write operations.
- [ ] `/async/bulk/V1/`: mass data operations (ERP sync, bulk imports) — array payload.
- [ ] Admin tokens: simple Bearer, configurable expiry (default 4h), not for production integrations.
- [ ] OAuth 1.0a integration tokens: **non-expiring**, HMAC-SHA1 signed, correct for machine-to-machine.
- [ ] GET requests cannot use async endpoints — async is write-operations only.

### GraphQL Schema

- [ ] Schema files: `etc/schema.graphqls` — defines types, queries, mutations.
- [ ] Every query/mutation requires a `@resolver(class: "...")` directive.
- [ ] Use `extend type Query { ... }` to add queries from custom modules — **never fork core schema**.
- [ ] `extend type ProductInterface { ... }` to add fields to existing core types.
- [ ] `@cache(cacheIdentity: "...")` on queries enables FPC caching — omit it and the query is never cached.
- [ ] `!` (non-null) in schema means resolver **must not** return null for that field.
- [ ] `@typeResolver` handles polymorphic types (e.g., SimpleProduct vs ConfigurableProduct).

### GraphQL Resolvers

- [ ] `ResolverInterface`: single-item resolvers, top-level queries.
- [ ] `BatchResolverInterface`: field resolvers on list types — **prevents N+1 queries**.
- [ ] `BatchResolverInterface::resolve()` receives array of `BatchRequestItemInterface`, returns `BatchResponse`.
- [ ] `$value` in `resolve()` = parent resolver's output array.
- [ ] `$context->getUserId()` = current customer ID for auth-aware resolvers.
- [ ] Resolver wiring: `@resolver` points to class; `di.xml` handles interface→class binding if needed.
- [ ] Best practice: separate `Resolver/` (GraphQL concern) from `DataProvider/` (persistence concern).

### GraphQL HTTP/Caching — HIGH PRIORITY

- [ ] GraphQL **queries SHOULD use GET** → FPC/Varnish can cache the response.
- [ ] GraphQL **mutations MUST use POST** → never cached (correct behavior).
- [ ] Using POST for everything = **all queries bypass FPC** = major performance anti-pattern.
- [ ] Varnish does not cache POST requests (HTTP spec) — this is not configurable away.
- [ ] `@cache(cacheIdentity: ...)` only activates on GET requests.
- [ ] Persisted queries (GET with query hash) = production best practice for PWA.

### Architectural Decision Rules

- [ ] PWA/browser storefront → prefer GraphQL (flexible field selection, fewer round trips).
- [ ] Server-to-server / ERP integration → prefer REST.
- [ ] Bulk nightly sync → `/async/bulk/V1/` + OAuth 1.0a.
- [ ] Customer accessing own data → `ref="self"` in webapi.xml.
- [ ] Field on list type in GraphQL → `BatchResolverInterface`.
- [ ] Adding query/type to core GraphQL → `extend type`, never modify vendor.
- [ ] Long-term machine-to-machine auth → OAuth 1.0a (non-expiring), not admin tokens.
- [ ] Security logic for API endpoints → ACL in webapi.xml, not inside service implementations.
