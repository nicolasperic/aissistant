# Adobe Commerce Architect Certification — May 3 Deep Dive
## Weak Section Drill + Integration Patterns

---

## Table of Contents

1. [Architect Decision Framework](#1-architect-decision-framework)
2. [Section 1 Deep Dive — Design (46%)](#2-section-1-deep-dive--design-46)
   - [Service Contracts](#21-service-contracts)
   - [Plugins (Interceptors)](#22-plugins-interceptors)
   - [GraphQL Architecture](#23-graphql-architecture)
3. [Section 2 Deep Dive — Review (32%)](#3-section-2-deep-dive--review-32)
   - [Performance Architecture](#31-performance-architecture)
   - [MSI (Multi-Source Inventory)](#32-msi-multi-source-inventory)
   - [Test Frameworks](#33-test-frameworks)
4. [Section 3 Deep Dive — Deploy (22%)](#4-section-3-deep-dive--deploy-22)
   - [ECE-Tools & Build vs Deploy](#41-ece-tools--build-vs-deploy)
   - [Cloud Environment Variables](#42-cloud-environment-variables)
5. [Integration Patterns](#5-integration-patterns)
   - [Webhook Receiver + Idempotency](#51-webhook-receiver--idempotency)
   - [Adobe I/O Events & Native Webhooks](#52-adobe-io-events--native-webhooks)
   - [ERP/OMS — Event-Driven vs Batch](#53-erpoms--event-driven-vs-batch)
   - [Payment Integrations](#54-payment-integrations)
   - [API Gateway Pattern](#55-api-gateway-pattern)
6. [Critical Anti-Patterns Architects Must Catch](#6-critical-anti-patterns-architects-must-catch)
7. [Scenario-Based Decision Tables](#7-scenario-based-decision-tables)
8. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Architect Decision Framework

The exam tests *reasoning*, not memorization. When two answers look technically valid, apply this decision hierarchy in order:

```
Priority Stack (highest to lowest):
+-----------------------------------------------+
| 1. Extensibility / Open for extension         |
|    (interface over concrete class)             |
+-----------------------------------------------+
| 2. Cloud-native solution                      |
|    (ECE / Adobe I/O over on-prem hacks)        |
+-----------------------------------------------+
| 3. Async over sync for non-critical paths     |
|    (queue > direct call in checkout flow)      |
+-----------------------------------------------+
| 4. Contract stability                         |
|    (prefer API-level contracts over impl)      |
+-----------------------------------------------+
| 5. Testability                                |
|    (injectable dependencies, no singletons)    |
+-----------------------------------------------+
```

### Core Architect Mindset Rules

| Scenario | Wrong Answer | Correct Architect Answer |
|---|---|---|
| Extend core functionality | Rewrite/override core class | Use plugin or preference on interface |
| Notify 3rd party on order | Sync HTTP call in observer | Queue message → consumer sends async |
| Add custom inventory logic | Override MSI class | Implement MSI service contract/plugin |
| Ship custom config | Hardcode in `config.xml` | Use environment variable + `env.php` |
| Integrate payment gateway | Custom curl in controller | Implement `PaymentInterface` contract |
| Deploy config change | Edit files on production | Deploy via pipeline; use `config.php` |

**Exam focus:** The exam will never reward "it works" answers — it rewards "it works *and* is maintainable, extensible, and upgrade-safe."

---

## 2. Section 1 Deep Dive — Design (46%)

### 2.1 Service Contracts

Service contracts are the **API layer** of a module — the formal boundary between modules.

#### Architecture Diagram

```
+---------------------------+
|  External Consumer        |
|  (Controller, API, etc.)  |
+----------+----------------+
           |  uses interface only
           v
+----------+----------------+
|  ServiceInterface         |  <-- api/Data/  or  Api/
|  (e.g. OrderRepositoryInterface) |
+----------+----------------+
           |  implemented by
           v
+----------+----------------+
|  Model / Service Class    |  (internal, swappable)
+---------------------------+
```

#### Service Contract Anatomy

```php
// Api/CustomerRepositoryInterface.php
namespace Magento\Customer\Api;

use Magento\Customer\Api\Data\CustomerInterface;
use Magento\Framework\Api\SearchCriteriaInterface;

interface CustomerRepositoryInterface
{
    /**
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     */
    public function getById(int $customerId): CustomerInterface;

    public function save(CustomerInterface $customer): CustomerInterface;

    public function delete(CustomerInterface $customer): bool;

    public function getList(SearchCriteriaInterface $searchCriteria): \Magento\Customer\Api\Data\CustomerSearchResultsInterface;
}
```

```php
// Api/Data/CustomerInterface.php — Data Transfer Object contract
namespace Magento\Customer\Api\Data;

interface CustomerInterface extends \Magento\Framework\Api\ExtensibleDataInterface
{
    public function getEmail(): ?string;
    public function setEmail(string $email): self;
    public function getFirstname(): ?string;
    // ...
    
    // Extension attributes — HOW you add fields without breaking contract
    public function getExtensionAttributes(): ?CustomerExtensionInterface;
    public function setExtensionAttributes(CustomerExtensionInterface $extensionAttributes): self;
}
```

**Exam focus:** Service contracts live in `Api/` and `Api/Data/`. Any class outside the module MUST use the interface, never the concrete model. This is what makes upgrades safe.

#### Extension Attributes vs Custom Attributes

| | Extension Attributes | Custom Attributes (EAV) |
|---|---|---|
| Defined in | `extension_attributes.xml` | Database EAV tables |
| Type safety | Yes — strongly typed | No — generic key/value |
| Performance | Join-based, controlled | EAV penalty |
| Use case | Extend core DTOs | Dynamic merchant-defined fields |
| Serialized to API | Yes, automatically | Yes, via `custom_attributes` |

```xml
<!-- etc/extension_attributes.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Api/etc/extension_attributes.xsd">
    <extension_attributes for="Magento\Catalog\Api\Data\ProductInterface">
        <attribute code="warehouse_zone" type="string"/>
    </extension_attributes>
</config>
```

**Exam focus:** Extension attributes require a plugin on the repository to load/save the data. They don't persist automatically — you must hook `afterGet`, `afterGetList`, `beforeSave`.

#### Repository Pattern vs Resource Model

```
Consumer
   |
   v
Repository (service contract impl) --> handles business logic, caching
   |
   v
Resource Model                      --> raw DB read/write
   |
   v
Database
```

- **Repository**: cacheable, uses `IdentityMap`, throws typed exceptions (`NoSuchEntityException`)
- **Resource Model**: direct DB, no identity cache, should NOT be called directly outside module

---

### 2.2 Plugins (Interceptors)

Plugins are the **primary extensibility mechanism** — they intercept public methods without changing the original class.

#### Plugin Types Decision Matrix

| Type | Signature | When to Use | Can Change Return? | Can Stop Execution? |
|---|---|---|---|---|
| `before` | `beforeMethodName($subject, ...$args)` | Modify input args | No (but can skip via `around`) | No |
| `after` | `afterMethodName($subject, $result, ...$args)` | Modify return value | Yes | No |
| `around` | `aroundMethodName($subject, callable $proceed, ...$args)` | Replace behavior | Yes | Yes (don't call `$proceed`) |

```php
// Correct around plugin — note $proceed callable
namespace Vendor\Module\Plugin;

use Magento\Catalog\Model\Product;

class ProductPricePlugin
{
    public function aroundGetPrice(
        Product $subject,
        callable $proceed
    ): float {
        $price = $proceed(); // calls original (or next plugin in chain)
        
        if ($subject->getTypeId() === 'bundle') {
            return $price * 0.9; // 10% discount for bundle
        }
        
        return $price;
    }
}
```

```php
// After plugin — most common for return value modification
public function afterGetName(
    \Magento\Catalog\Model\Product $subject,
    string $result  // original return value
): string {
    if ($subject->getData('is_new')) {
        return '[NEW] ' . $result;
    }
    return $result;
}
```

#### Plugin Registration

```xml
<!-- etc/di.xml -->
<config>
    <type name="Magento\Catalog\Model\Product">
        <plugin name="vendor_module_product_price_plugin"
                type="Vendor\Module\Plugin\ProductPricePlugin"
                sortOrder="10"
                disabled="false"/>
    </type>
</config>
```

**Exam focus:** Plugins cannot intercept: `final` methods, `final` classes, static methods, `__construct`, non-public methods, virtual types. If asked why a plugin isn't working — check these restrictions first.

#### Plugin Sort Order & Chain

```
Request to getPrice()
      |
      v
  sortOrder=10 (before) --> sortOrder=20 (before) --> Original Method
                                                           |
  sortOrder=20 (after)  <-- sortOrder=10 (after)  <-------+
```

**Around plugins wrap in LIFO order** for the `$proceed` portion. This is a common exam trap.

#### Plugins vs Observers vs Preferences

| Mechanism | Best For | Avoid When |
|---|---|---|
| Plugin | Intercept specific method, any scope | Method is final/static/private |
| Observer | React to named events, decoupled | You need to modify return value |
| Preference | Full class replacement (last resort) | Any other option exists |
| Virtual Type | Config-time variation of a class | Runtime behavior needed |

**Exam focus:** Prefer plugin over preference. Preference breaks when two modules both override the same class. The exam will have a scenario where preference causes conflicts — plugin is always the safer answer.

---

### 2.3 GraphQL Architecture

#### Schema Structure

```
schema.graphqls
    |
    +-- Query type extensions (addQueryField)
    |       |
    |       +-- Resolver class (implements ResolverInterface)
    |               |
    |               +-- Service contract call (never Model directly)
    |
    +-- Mutation type extensions
    |       |
    |       +-- MutationResolver
    |               |
    |               +-- Validates input
    |               +-- Calls service contract
    |               +-- Returns typed array (matches schema)
    |
    +-- Custom type definitions
```

```graphql
# etc/schema.graphqls
type Query {
    customProduct(id: Int! @doc(description: "Product ID")): CustomProduct
        @resolver(class: "Vendor\\Module\\Model\\Resolver\\CustomProduct")
        @doc(description: "Returns custom product data")
        @cache(cacheIdentity: "Vendor\\Module\\Model\\Resolver\\CustomProduct\\Identity")
}

type CustomProduct {
    id: Int
    name: String
    warehouse_zone: String @doc(description: "Extension attribute")
}
```

```php
// Model/Resolver/CustomProduct.php
namespace Vendor\Module\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Framework\GraphQl\Exception\GraphQlInputException;

class CustomProduct implements ResolverInterface
{
    public function __construct(
        private readonly \Magento\Catalog\Api\ProductRepositoryInterface $productRepository
    ) {}

    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ): array {
        if (!isset($args['id'])) {
            throw new GraphQlInputException(__('Product ID is required'));
        }

        try {
            $product = $this->productRepository->getById((int)$args['id']);
        } catch (\Magento\Framework\Exception\NoSuchEntityException $e) {
            throw new \Magento\Framework\GraphQl\Exception\GraphQlNoSuchEntityException(
                __('Product not found'),
                $e
            );
        }

        return [
            'id' => $product->getId(),
            'name' => $product->getName(),
            'warehouse_zone' => $product->getExtensionAttributes()->getWarehouseZone(),
            'model' => $product, // pass for child resolvers
        ];
    }
}
```

#### GraphQL Authentication & Authorization

```php
// Check customer is logged in within resolver
public function resolve(Field $field, $context, ResolveInfo $info, array $value = null, array $args = null): array
{
    // $context->getUserId() returns 0 for guest
    if (false === $context->getExtensionAttributes()->getIsCustomer()) {
        throw new \Magento\Framework\GraphQl\Exception\GraphQlAuthorizationException(
            __('The current customer isn\'t authorized.')
        );
    }
    // ...
}
```

#### GraphQL Caching

```php
// Cache identity class — controls when cache is invalidated
namespace Vendor\Module\Model\Resolver\CustomProduct;

use Magento\Framework\GraphQl\Query\Resolver\IdentityInterface;

class Identity implements IdentityInterface
{
    private string $cacheTag = \Magento\Catalog\Model\Product::CACHE_TAG;

    public function getIdentities(array $resolvedData): array
    {
        $ids = [];
        if (!empty($resolvedData['id'])) {
            $ids[] = sprintf('%s_%s', $this->cacheTag, $resolvedData['id']);
        }
        return $ids;
    }
}
```

**Exam focus:** GraphQL resolvers should NEVER call resource models directly — always use service contracts. Cache identity classes are required for query caching to work properly. Mutations bypass the HTTP cache automatically.

---

## 3. Section 2 Deep Dive — Review (32%)

### 3.1 Performance Architecture

#### Caching Layers Diagram

```
Browser Request
      |
      v
  Fastly CDN (full page, static assets)
      |  miss
      v
  Varnish / Nginx (full page cache)
      |  miss
      v
  PHP-FPM / Magento Application
      |
      +-- Redis (session storage)
      |
      +-- Redis (full page cache storage)
      |
      +-- Redis (default cache - config, blocks, etc.)
      |
      v
  MySQL / Elasticsearch / OpenSearch
```

#### Cache Types and Architect Decisions

| Cache Type | Tag | When to Invalidate | Mechanism |
|---|---|---|---|
| Configuration | `config` | After `config:cache:clean` | Automatic via DI |
| Layout | `layout` | After layout XML changes | `layout_cache_tag` |
| Block HTML | `block_html` | Content changes | `$block->setData('cache_lifetime', 3600)` |
| Full Page Cache | `full_page` | Product/Category/CMS changes | Cache tags on response |
| Collections | `collections` | Data saves | `Zend_Db_Select` cache |

```php
// Correct: tagging a block for granular invalidation
class MyBlock extends \Magento\Framework\View\Element\Template
{
    public function getCacheKeyInfo(): array
    {
        return [
            'MY_BLOCK',
            $this->getProductId(),
            $this->_storeManager->getStore()->getId(),
        ];
    }

    public function getCacheTags(): array
    {
        return array_merge(
            parent::getCacheTags(),
            [\Magento\Catalog\Model\Product::CACHE_TAG . '_' . $this->getProductId()]
        );
    }

    public function getCacheLifetime(): int
    {
        return 3600; // seconds; null = forever until invalidated
    }
}
```

**Exam focus:** FPC invalidation is tag-based. When a product is saved, Magento dispatches `clean_cache_by_tags` with the product's cache tags. Blocks that declare those tags are automatically purged from Varnish/Fastly.

#### Indexer Architecture

```
Data Change (product save)
      |
      v
Mview (changelog table) records delta
      |
      v
Indexer runs (schedule or realtime)
      |
      v
Index table updated (e.g., catalog_product_index_price)
      |
      v
Storefront reads from index (not source tables)
```

```bash
# Production indexer strategy
bin/magento indexer:set-mode schedule   # async via cron
bin/magento indexer:reindex             # full reindex (maintenance mode)
bin/magento indexer:status              # check for backlog
```

**Exam focus:** Always use `schedule` mode in production. `realtime` indexing on product save causes UI latency. On exam: if asked about slow admin product saves → answer is likely indexer mode + async.

#### MySQL Query Optimization Patterns

```php
// BAD: N+1 problem
foreach ($productCollection as $product) {
    $category = $this->categoryRepository->getById($product->getCategoryId()); // N queries
}

// GOOD: eager load with join or addAttributeToSelect
$collection = $this->productCollectionFactory->create();
$collection->addAttributeToSelect(['name', 'price', 'category_ids']);
$collection->joinField(
    'category_id',
    'catalog_category_product',
    'category_id',
    'product_id=entity_id',
    null,
    'left'
);
```

---

### 3.2 MSI (Multi-Source Inventory)

#### MSI Architecture Layers

```
Storefront Request (is product in stock?)
      |
      v
+---------------------------+
| StockItemRepository       |  --> per-website stock
| (Sales Channel)           |
+---------------------------+
      |
      v
+---------------------------+
| StockReservation Service  |  --> compensating transactions
+---------------------------+
      |
      v
+---------------------------+
| Source Items              |  --> physical warehouse quantities
| (SourceItemInterface)     |
+---------------------------+
      |
      +-- Source A (Main Warehouse)
      +-- Source B (East Warehouse)
      +-- Source C (3PL)
```

#### Key MSI Interfaces (Architect Must Know)

| Interface | Package | Purpose |
|---|---|---|
| `SourceItemInterface` | `magento/module-inventory-api` | Physical stock per source |
| `StockInterface` | `magento/module-inventory-api` | Logical stock (website-facing) |
| `GetProductSalableQtyInterface` | `magento/module-inventory-sales-api` | Salable qty (source - reservations) |
| `IsProductSalableInterface` | `magento/module-inventory-sales-api` | Boolean: can sell? |
| `PlaceReservationsForSalesEventInterface` | `magento/module-inventory-reservations-api` | Create reservation on order |

```php
// Correct: check salable qty using MSI service contract
namespace Vendor\Module\Model;

use Magento\InventorySalesApi\Api\GetProductSalableQtyInterface;
use Magento\InventorySalesApi\Api\StockResolverInterface;
use Magento\Store\Model\StoreManagerInterface;

class StockChecker
{
    public function __construct(
        private readonly GetProductSalableQtyInterface $getProductSalableQty,
        private readonly StockResolverInterface $stockResolver,
        private readonly StoreManagerInterface $storeManager
    ) {}

    public function getSalableQty(string $sku): float
    {
        $websiteCode = $this->storeManager->getWebsite()->getCode();
        $stock = $this->stockResolver->execute(
            \Magento\InventorySalesApi\Api\Data\SalesChannelInterface::TYPE_WEBSITE,
            $websiteCode
        );
        
        return $this->getProductSalableQty->execute($sku, $stock->getStockId());
    }
}
```

**Exam focus:** NEVER use `\Magento\CatalogInventory\Api\StockStateInterface` for MSI-aware stock checks. That's the legacy single-source API. Use `InventorySalesApi`. On exam: if the store uses multiple sources, the correct API is always MSI's.

#### MSI Reservation System

```
Order Placed
      |
      v
PlaceReservationsForSalesEvent (-qty, order_id)
      -> inventory_reservation table: sku, qty=-2, metadata='order:123'
      
Order Shipped/Cancelled
      |
      v
AppendReservations (+qty compensation, or deduct source item)
      -> inventory_reservation table: sku, qty=+2, metadata='shipment:456'
```

**Exam focus:** MSI never modifies `source_item` quantity until shipment. It uses **compensating reservations** — append-only log. This is an eventually consistent pattern. Architects must understand this is by design for scalability.

---

### 3.3 Test Frameworks

#### Test Type Decision Tree

```
What are you testing?
      |
      +-- Single class, no I/O --> Unit Test (PHPUnit + Mocks)
      |
      +-- Multiple classes, no browser --> Integration Test (Magento TestFramework)
      |
      +-- HTTP API endpoint --> API Functional Test (WebAPI functional)
      |
      +-- Browser/JS behavior --> MFTF (Magento Functional Testing Framework)
      |
      +-- Performance regression --> JMeter / k6 (not in Magento core)
```

#### Unit Test with Mocks

```php
// Test/Unit/Model/OrderProcessorTest.php
namespace Vendor\Module\Test\Unit\Model;

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;
use Vendor\Module\Model\OrderProcessor;
use Magento\Sales\Api\OrderRepositoryInterface;

class OrderProcessorTest extends TestCase
{
    private OrderProcessor $orderProcessor;
    private MockObject $orderRepository;

    protected function setUp(): void
    {
        $this->orderRepository = $this->createMock(OrderRepositoryInterface::class);
        
        // Use ObjectManager helper for DI in unit tests
        $objectManager = new \Magento\Framework\TestFramework\Unit\Helper\ObjectManager($this);
        $this->orderProcessor = $objectManager->getObject(OrderProcessor::class, [
            'orderRepository' => $this->orderRepository,
        ]);
    }

    public function testProcessOrderThrowsOnMissingOrder(): void
    {
        $this->orderRepository
            ->expects($this->once())
            ->method('get')
            ->with(999)
            ->willThrowException(new \Magento\Framework\Exception\NoSuchEntityException());
        
        $this->expectException(\Magento\Framework\Exception\NoSuchEntityException::class);
        $this->orderProcessor->process(999);
    }
}
```

#### Integration Test

```php
// Test/Integration/Model/OrderProcessorTest.php
namespace Vendor\Module\Test\Integration\Model;

use Magento\TestFramework\Helper\Bootstrap;

class OrderProcessorTest extends \PHPUnit\Framework\TestCase
{
    private static \Magento\Framework\ObjectManagerInterface $objectManager;

    public static function setUpBeforeClass(): void
    {
        self::$objectManager = Bootstrap::getObjectManager();
    }

    /**
     * @magentoDataFixture Magento/Sales/_files/order.php
     * @magentoAppIsolation enabled
     * @magentoDbIsolation enabled
     */
    public function testProcess(): void
    {
        $processor = self::$objectManager->get(\Vendor\Module\Model\OrderProcessor::class);
        // Real DB, real DI — test against actual data fixture
        $result = $processor->process(1);
        $this->assertTrue($result);
    }
}
```

**Exam focus:** Integration tests use `@magentoDataFixture` and real DI. Unit tests mock everything. MFTF is for browser/acceptance testing via Selenium/WebDriver. Knowing *which framework to use for which scenario* is a common exam question.

| Annotation | Scope | Effect |
|---|---|---|
| `@magentoDbIsolation enabled` | Integration | Wraps test in transaction, rolls back after |
| `@magentoAppIsolation enabled` | Integration | Resets Magento app state between tests |
| `@magentoDataFixture` | Integration | Loads PHP fixture file before test |
| `@magentoConfigFixture` | Integration | Temporarily sets config value |

---

## 4. Section 3 Deep Dive — Deploy (22%)

### 4.1 ECE-Tools & Build vs Deploy

#### Build vs Deploy Phase: What Happens When

```
git push --> Cloud Git Repo
                  |
                  v
         +--------+--------+
         |   BUILD Phase   |    (no live traffic, no DB connection)
         +-----------------+
         | composer install|
         | code compilation|
         | di:compile      |
         | setup:static-content:deploy |
         | generate:schema |
         +-----------------+
                  |
                  v
         +--------+--------+
         |  DEPLOY Phase   |    (brief maintenance, DB connection available)
         +-----------------+
         | setup:upgrade   |
         | cache:flush     |
         | cache:warmup    |
         | indexers check  |
         +-----------------+
                  |
                  v
         +--------+--------+
         | POST-DEPLOY     |    (traffic restored)
         +-----------------+
         | cache:warmup    |
         | search:index    |
         | sitemap:generate|
         +-----------------+
```

**Exam focus:** You CANNOT write to the database during build phase — there is no DB connection. Static content deploy happens in BUILD, not deploy. This is a very common exam question.

#### `.magento.env.yaml` Structure

```yaml
# .magento.env.yaml
stage:
  global:
    SKIP_HTML_MINIFICATION: true
    SCD_ON_DEMAND: false
  build:
    SCD_STRATEGY: compact     # quick | standard | compact
    SCD_COMPRESSION_LEVEL: 6
    SCD_THREADS: 2
    SKIP_SCD: false
  deploy:
    SEARCH_CONFIGURATION:
      engine: elasticsearch7
      elasticsearch_server_hostname: elasticsearch.internal
      elasticsearch_server_port: '9200'
    CACHE_CONFIGURATION:
      frontend:
        default:
          backend: Cm_Cache_Backend_Redis
          backend_options:
            server: redis.internal
            port: '6379'
    DATABASE_CONFIGURATION:
      connection:
        default:
          username: user
          host: database.internal
          dbname: main
          password: ''
  post_deploy:
    WARM_UP_PAGES:
      - 'index.php/'
      - 'index.php/customer/account/create'
```

#### ECE-Tools Hooks in `magento.app.yaml`

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

**Exam focus:** ECE-Tools uses scenario XML files. These are extensible — you can extend or replace individual scenarios. This is the Cloud-native way to customize deployment steps.

#### Extending Build/Deploy Scenarios

```xml
<!-- Custom build scenario: vendor/module/scenario/build/custom.xml -->
<scenario xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:noNamespaceSchemaLocation="urn:magento:ece-tools:config/scenario.xsd">
    <step name="custom-validation"
          type="Vendor\Module\Step\Build\CustomValidation"
          priority="100"/>  <!-- lower = earlier -->
</scenario>
```

```yaml
# .magento.app.yaml — extend default scenario
hooks:
    build: |
        set -e
        php ./vendor/bin/ece-tools run scenario/build/generate.xml vendor/module/scenario/build/custom.xml
```

---

### 4.2 Cloud Environment Variables

#### Variable Hierarchy (highest to lowest precedence)

```
.magento.env.yaml (committed, env-specific)
      ^  overridden by
MAGENTO_CLOUD_VARIABLES (Cloud UI / CLI env vars)
      ^  overridden by
env:MAGENTO_CLOUD_RELATIONSHIPS (auto-set by Cloud services)
```

#### Critical Cloud Environment Variables

| Variable | Stage | Purpose |
|---|---|---|
| `MAGENTO_CLOUD_RELATIONSHIPS` | All | JSON: service connection strings (DB, Redis, ES) |
| `MAGENTO_CLOUD_ROUTES` | All | JSON: URL routes |
| `MAGENTO_CLOUD_VARIABLES` | All | Custom env vars from Cloud UI |
| `SCD_ON_DEMAND` | Build | Deploy static files only when requested |
| `SKIP_SCD` | Build | Skip static content deploy (for fast deploys) |
| `WARM_UP_PAGES` | Post-deploy | Pages to warm up after deploy |
| `ENABLE_GOOGLE_ANALYTICS` | Deploy | Toggle analytics per env |
| `UPDATE_URLS` | Deploy | Auto-update base URLs on non-prod |

```bash
# Reading relationships in custom scripts
echo $MAGENTO_CLOUD_RELATIONSHIPS | base64 --decode | python -m json.tool

# Setting env var via CLI
magento-cloud variable:set --level environment \
    --name CUSTOM_API_KEY \
    --value "secret123" \
    --sensitive true
```

**Exam focus:** `MAGENTO_CLOUD_RELATIONSHIPS` is **base64 encoded JSON**. Service connections (Redis, MySQL, Elasticsearch) are NEVER hardcoded — they come from this variable, which ECE-Tools parses to generate `app/etc/env.php`.

#### Per-Environment Configuration Strategy

```
config.php    --> committed to git; stores module status, scope config (non-sensitive)
env.php       --> NEVER committed; generated by ECE-Tools from cloud relationships
               contains: DB credentials, Redis config, cache config
.magento.env.yaml --> committed; controls ECE-Tools behavior per stage
```

**Exam focus:** Sensitive values (DB password, API keys) go in Cloud UI env vars or `env.php` — NEVER in `config.php` or `config.xml`.

---

## 5. Integration Patterns

### 5.1 Webhook Receiver + Idempotency

#### Why Idempotency Keys Matter

External systems (Stripe, PayPal, Shopify, ERP) retry webhook delivery on failure. Without idempotency, you process the same event multiple times — double-charging, duplicate orders, inventory corruption.

#### Idempotency Key Design

```
Webhook Request Headers:
  X-Webhook-Idempotency-Key: "evt_1Mq8gJKZ5GnB8sT4xK9mR3pD"
  X-Webhook-Signature: "sha256=abc123..."
  X-Webhook-Timestamp: "1683072000"
```

```php
// Controller/Webhook/Receive.php
namespace Vendor\Module\Controller\Webhook;

use Magento\Framework\App\Action\HttpPostActionInterface;
use Magento\Framework\App\CsrfAwareActionInterface;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\App\Request\InvalidRequestException;

class Receive implements HttpPostActionInterface, CsrfAwareActionInterface
{
    public function __construct(
        private readonly RequestInterface $request,
        private readonly \Magento\Framework\Serialize\SerializerInterface $serializer,
        private readonly \Vendor\Module\Model\WebhookIdempotencyChecker $idempotencyChecker,
        private readonly \Magento\Framework\MessageQueue\PublisherInterface $publisher,
        private readonly \Psr\Log\LoggerInterface $logger
    ) {}

    public function execute(): \Magento\Framework\Controller\ResultInterface
    {
        $idempotencyKey = $this->request->getHeader('X-Webhook-Idempotency-Key');
        
        // Step 1: Validate signature BEFORE processing
        if (!$this->validateSignature()) {
            return $this->resultFactory->create('json')
                ->setHttpResponseCode(401)
                ->setData(['error' => 'Invalid signature']);
        }
        
        // Step 2: Check idempotency - already processed?
        if ($this->idempotencyChecker->hasBeenProcessed($idempotencyKey)) {
            $this->logger->info('Webhook already processed', ['key' => $idempotencyKey]);
            // Return 200 to stop retries — do NOT return 4xx
            return $this->resultFactory->create('json')
                ->setData(['status' => 'already_processed']);
        }
        
        // Step 3: Mark as "processing" (optimistic lock)
        $this->idempotencyChecker->markAsProcessing($idempotencyKey);
        
        // Step 4: Publish to queue — NEVER process synchronously in controller
        $payload = $this->serializer->unserialize($this->request->getContent());
        $this->publisher->publish('vendor.webhook.process', $payload);
        
        // Step 5: Mark as processed ONLY after queue publish succeeds
        $this->idempotencyChecker->markAsProcessed($idempotencyKey);
        
        return $this->resultFactory->create('json')
            ->setData(['status' => 'queued']);
    }

    public function createCsrfValidationException(RequestInterface $request): ?InvalidRequestException
    {
        return null; // webhooks are not browser forms
    }

    public function validateForCsrf(RequestInterface $request): ?bool
    {
        return true; // custom signature validation replaces CSRF
    }
}
```

#### Idempotency Storage Model

```php
// Model/WebhookIdempotencyChecker.php
namespace Vendor\Module\Model;

use Magento\Framework\App\ResourceConnection;

class WebhookIdempotencyChecker
{
    private const TABLE = 'vendor_webhook_idempotency';
    private const STATUS_PROCESSING = 'processing';
    private const STATUS_PROCESSED = 'processed';
    private const TTL_DAYS = 30;

    public function __construct(
        private readonly ResourceConnection $resourceConnection
    ) {}

    public function hasBeenProcessed(string $key): bool
    {
        $connection = $this->resourceConnection->getConnection();
        $select = $connection->select()
            ->from(self::TABLE, ['status'])
            ->where('idempotency_key = ?', $key)
            ->where('status = ?', self::STATUS_PROCESSED);

        return (bool) $connection->fetchOne($select);
    }

    public function markAsProcessing(string $key): void
    {
        $connection = $this->resourceConnection->getConnection();
        $connection->insertOnDuplicate(
            self::TABLE,
            [
                'idempotency_key' => $key,
                'status' => self::STATUS_PROCESSING,
                'created_at' => date('Y-m-d H:i:s'),
            ]
        );
    }

    public function markAsProcessed(string $key): void
    {
        $this->resourceConnection->getConnection()->update(
            self::TABLE,
            ['status' => self::STATUS_PROCESSED, 'processed_at' => date('Y-m-d H:i:s')],
            ['idempotency_key = ?' => $key]
        );
    }
}
```

**Exam focus:** Webhook controller MUST:
1. Validate signature immediately
2. Return 200 for already-processed events (not 4xx — 4xx triggers retries)
3. Queue processing — NEVER process inline
4. Implement idempotency using persistent storage (not memory)

---

### 5.2 Adobe I/O Events & Native Webhooks

#### Adobe I/O Events Architecture

```
Magento Event (e.g., observer.sales_order_place_after)
      |
      v
  Adobe Commerce Eventing Module
  (Io\Module\Event\Provider)
      |
      v
  Adobe I/O Events API
  (Cloud messaging bus)
      |
      v
  App Builder Runtime Action
  (serverless handler)
      |
      +-- Call ERP API
      +-- Update OMS
      +-- Send to analytics
```

#### Event Registration for Adobe I/O

```xml
<!-- etc/io_events.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_AdobeCommerceEventsClient:etc/io_events.xsd">
    <event name="observer.sales_order_place_after">
        <fields>
            <field name="order_id"/>
            <field name="customer_email"/>
            <field name="grand_total"/>
            <field name="status"/>
        </fields>
    </event>
    <event name="observer.catalog_product_save_after">
        <fields>
            <field name="entity_id"/>
            <field name="sku"/>
            <field name="price"/>
        </fields>
    </event>
</config>
```

#### Adobe Commerce Native Webhooks (2.4.4+)

```xml
<!-- etc/webhooks.xml — declarative webhook registration -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_AdobeCommerceWebhooks:etc/webhooks.xsd">
    <method name="plugin.magento.sales.api.order_management.place_order"
            type="before">
        <hooks>
            <batch name="fraud_check">
                <hook name="check_fraud_score"
                      url="https://fraud-service.example.com/check"
                      method="POST"
                      timeout="5000"
                      softTimeout="1000"
                      fallbackErrorMessage="Fraud check unavailable"
                      active="true"
                      required="true">
                    <headers>
                        <header name="Authorization">Bearer {{env.FRAUD_API_KEY}}</header>
                    </headers>
                    <fields>
                        <field name="order_id"/>
                        <field name="customer_ip"/>
                        <field name="total"/>
                    </fields>
                </hook>
            </batch>
        </hooks>
    </method>
</config>
```

**Exam focus:**
- Adobe I/O Events = **outbound async** — Magento publishes, external system subscribes
- Native Webhooks = **outbound sync** (before/after plugin hooks) — Magento calls external URL; "required" webhooks can block execution
- For order enrichment by fraud service = Native Webhook (synchronous `before`)
- For ERP notification = Adobe I/O Event (async, fire and forget)

---

### 5.3 ERP/OMS — Event-Driven vs Batch Sync

#### Decision Matrix: When to Use Each Pattern

| Pattern | Use When | Latency | Complexity | Failure Mode |
|---|---|---|---|---|
| Event-driven (async queue) | Real-time order status needed | Low | High | Queue retry |
| Batch sync (cron) | Non-time-critical, high volume | High (minutes) | Low | Next run catches up |
| Webhook inbound | ERP pushes to Commerce | Low | Medium | Idempotency |
| API polling | No webhook support on ERP | Medium | Low | Rate limiting |

#### Event-Driven ERP Integration Architecture

```
Magento Order Placed
      |
      v
  Message Queue (RabbitMQ / AWS SQS)
  Topic: order.created
      |
      v
  Consumer Process (long-running daemon)
      |
      v
  ERP Adapter (transforms to ERP schema)
      |
      v
  ERP API / EDI
      |
      v (async callback)
  Webhook -> Magento updates order status
```

```php
// Queue Consumer for ERP order sync
// etc/queue_consumer.xml
```

```xml
<!-- etc/queue_consumer.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/consumer.xsd">
    <consumer name="erp.order.sync"
              queue="erp.order.sync"
              connection="amqp"
              consumerInstance="Magento\Framework\MessageQueue\Consumer"
              handler="Vendor\ErpIntegration\Model\Consumer\OrderSyncConsumer::process"
              maxMessages="100"/>
</config>
```

```xml
<!-- etc/queue_topology.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/topology.xsd">
    <exchange name="magento" type="topic" connection="amqp">
        <binding id="erpOrderBinding"
                 topic="order.created"
                 destinationType="queue"
                 destination="erp.order.sync"/>
    </exchange>
</config>
```

```php
// Consumer implementation
namespace Vendor\ErpIntegration\Model\Consumer;

use Vendor\ErpIntegration\Api\ErpClientInterface;
use Psr\Log\LoggerInterface;

class OrderSyncConsumer
{
    public function __construct(
        private readonly ErpClientInterface $erpClient,
        private readonly \Magento\Sales\Api\OrderRepositoryInterface $orderRepository,
        private readonly LoggerInterface $logger
    ) {}

    public function process(\Vendor\ErpIntegration\Api\Data\OrderSyncMessageInterface $message): void
    {
        try {
            $order = $this->orderRepository->get($message->getOrderId());
            $this->erpClient->submitOrder($order);
            $this->logger->info('Order synced to ERP', ['order_id' => $message->getOrderId()]);
        } catch (\Exception $e) {
            // Re-throw to trigger queue NACK and retry
            $this->logger->error('ERP sync failed', [
                'order_id' => $message->getOrderId(),
                'error' => $e->getMessage()
            ]);
            throw $e; // Queue infrastructure handles retry with backoff
        }
    }
}
```

**Exam focus:** The consumer throws on failure to let the queue infrastructure handle retry. Never swallow exceptions in queue consumers unless you want to silently lose messages.

---

### 5.4 Payment Integrations

#### Authorize vs Capture Flow

```
AUTHORIZE ONLY (card present, delayed capture)
      |
      v
  Customer places order
      |
      v
  MethodInterface::authorize() called  [Magento\Payment\Model\MethodInterface]
  - Holds funds on card
  - Returns transaction ID
  - Order status: "Pending"
      |
      v
  Admin reviews / ships
      |
      v
  MethodInterface::capture() called
  - Charges the held funds
  - Order status: "Processing"

---

AUTH + CAPTURE (immediate)
      |
      v
  Customer places order
      |
      v
  MethodInterface::authorize() + capture() in same call
  OR MethodInterface::sale() — depends on gateway
```

#### Braintree/Vault/3DS2 Flow

```
Browser
  |
  +-- Braintree.js tokenizes card (PCI scope out)
  |   Returns: payment_method_nonce
  |
  v
Magento Checkout
  |
  +-- payment_method_nonce + 3DS2 token in order request
  |
  v
Braintree Payment Method (implements MethodInterface)
  |
  +-- authorize(): calls Braintree API with nonce
  |   - 3DS2 liability shift checked
  |   - Returns braintree_transaction_id
  |
  +-- On capture: calls Braintree settle transaction
  |
  v
Vault Storage (PaymentTokenInterface)
  - Stores payment_method_token (NOT raw card data)
  - Used for reorder / subscription
```

```php
// Implementing MethodInterface (Magento\Payment\Model\MethodInterface) — legacy approach
// NOTE: AbstractMethod is @deprecated since 100.0.6.
// Modern approach: use Payment Provider Gateway (CommandInterface pipeline via di.xml).
// AbstractMethod shown here for concept illustration only.
namespace Vendor\Payment\Model;

use Magento\Payment\Model\Method\AbstractMethod; // @deprecated 100.0.6
use Magento\Framework\DataObject;
use Magento\Payment\Model\InfoInterface;

class CustomPayment extends AbstractMethod
{
    protected $_code = 'vendor_custom_payment';
    protected $_canAuthorize = true;
    protected $_canCapture = true;
    protected $_canRefund = true;
    protected $_canVoid = true;

    public function authorize(InfoInterface $payment, $amount): self
    {
        $order = $payment->getOrder();
        $nonce = $payment->getAdditionalInformation('payment_nonce');
        
        // Call gateway — but architect note: consider if this should be async
        // For authorize: sync is acceptable (customer waits for confirmation)
        $response = $this->gatewayClient->authorize([
            'amount' => $amount,
            'nonce' => $nonce,
            'orderId' => $order->getIncrementId(),
        ]);
        
        if (!$response->isSuccess()) {
            throw new \Magento\Framework\Exception\LocalizedException(
                __('Payment authorization failed: %1', $response->getMessage())
            );
        }
        
        $payment->setTransactionId($response->getTransactionId())
                ->setIsTransactionClosed(false) // keep open for capture
                ->setAdditionalInformation('transaction_id', $response->getTransactionId());
        
        return $this;
    }
}
```

**Exam focus:**
- `setIsTransactionClosed(false)` on authorize — keeps transaction open for later capture
- `setIsTransactionClosed(true)` on capture — closes the transaction
- 3DS2 liability shift: if 3DS authentication succeeds and card is stolen, liability shifts to issuing bank (not merchant)
- Vault stores `public_hash` token — NEVER the raw card number

#### Payment Integration Contracts

| Interface | Purpose |
|---|---|
| `MethodInterface` (`Magento\Payment\Model\MethodInterface`) | Core payment method contract (no `PaymentInterface.php` exists) |
| `PaymentTokenInterface` | Vault token storage |
| `CommandInterface` | Individual payment command (authorize, capture, refund) |
| `GatewayCommand` | Wraps HTTP call to gateway |
| `BuilderInterface` | Builds request array for gateway |
| `HandlerInterface` | Processes gateway response |

**Exam focus:** Modern Magento payment integrations use the **Payment Provider Gateway framework** — a pipeline of `BuilderInterface` → HTTP call → `HandlerInterface`. This is extensible (add/remove builders/handlers via DI). The exam prefers this over overriding `AbstractMethod` directly.

---

### 5.5 API Gateway Pattern

#### Architecture

```
Client (Mobile App / 3rd Party / PWA)
      |
      v
+------------------+
|   API Gateway    |
|                  |
|  - Auth/JWT      |
|  - Rate Limiting |
|  - Circuit Break |
|  - Request Log   |
|  - Transform     |
+--------+---------+
         |
         +-----> Magento REST/GraphQL API
         |
         +-----> 3rd Party Service
         |
         +-----> Legacy ERP
```

#### Rate Limiting Implementation (Magento-side)

```php
// Plugin on API request to implement rate limiting
namespace Vendor\Module\Plugin;

use Magento\Framework\App\RequestInterface;
use Magento\Framework\Cache\FrontendInterface;
use Magento\Framework\Exception\LocalizedException;

class RateLimitPlugin
{
    private const LIMIT = 100;  // requests
    private const WINDOW = 60;  // seconds

    public function __construct(
        private readonly FrontendInterface $cache
    ) {}

    public function beforeDispatch(
        \Magento\Webapi\Controller\Rest $subject,
        RequestInterface $request
    ): void {
        $clientIp = $request->getClientIp();
        $cacheKey = 'rate_limit_' . md5($clientIp);
        
        $count = (int) $this->cache->load($cacheKey);
        
        if ($count >= self::LIMIT) {
            throw new LocalizedException(__('Rate limit exceeded. Try again later.'));
        }
        
        $this->cache->save(
            $count + 1,
            $cacheKey,
            [],
            self::WINDOW
        );
    }
}
```

#### Circuit Breaker Pattern

```php
// Service/CircuitBreaker.php
namespace Vendor\Module\Service;

class CircuitBreaker
{
    private const STATE_CLOSED   = 'closed';   // normal operation
    private const STATE_OPEN     = 'open';     // failing, reject requests
    private const STATE_HALF_OPEN = 'half_open'; // testing recovery

    private const FAILURE_THRESHOLD = 5;
    private const TIMEOUT_SECONDS   = 30;

    public function __construct(
        private readonly \Magento\Framework\Cache\FrontendInterface $cache
    ) {}

    public function call(string $serviceKey, callable $operation): mixed
    {
        $state = $this->getState($serviceKey);
        
        if ($state === self::STATE_OPEN) {
            if (!$this->shouldAttemptReset($serviceKey)) {
                throw new \RuntimeException("Circuit open for $serviceKey — service unavailable");
            }
            $this->setState($serviceKey, self::STATE_HALF_OPEN);
        }
        
        try {
            $result = $operation();
            $this->onSuccess($serviceKey);
            return $result;
        } catch (\Exception $e) {
            $this->onFailure($serviceKey);
            throw $e;
        }
    }

    private function onSuccess(string $key): void
    {
        $this->setState($key, self::STATE_CLOSED);
        $this->resetFailureCount($key);
    }

    private function onFailure(string $key): void
    {
        $failures = $this->incrementFailureCount($key);
        if ($failures >= self::FAILURE_THRESHOLD) {
            $this->setState($key, self::STATE_OPEN);
            $this->setOpenTimestamp($key);
        }
    }
}
```

**Exam focus:**
- **Closed** = healthy, requests pass through
- **Open** = failing, requests immediately rejected (fail fast)
- **Half-Open** = recovery test — one request allowed through; success = Closed, failure = Open
- Circuit breakers prevent cascading failures when an external service is down

#### API Gateway Patterns: Exam Summary

| Pattern | Problem Solved | Magento Architect Application |
|---|---|---|
| Rate Limiting | Prevent API abuse/overload | Plugin on Webapi dispatcher or use Fastly rate rules |
| Circuit Breaker | Cascade failure prevention | Wrap all external API calls in circuit breaker service |
| Retry with Backoff | Transient failure recovery | Queue consumer with exponential backoff |
| Bulkhead | Isolate failure domains | Separate queues per integration |
| Timeout | Prevent thread starvation | Always set HTTP client timeout; default Guzzle = no timeout |

---

## 6. Critical Anti-Patterns Architects Must Catch

### THE Most Critical: Sync External Call in place_order

**This is the #1 thing the exam tests architects to catch in code review.**

```php
// ===== WRONG — NEVER DO THIS =====
// Observer/BeforePlaceOrder.php

public function execute(\Magento\Framework\Event\Observer $observer): void
{
    $order = $observer->getEvent()->getOrder();
    
    // ANTI-PATTERN: Synchronous external API call in checkout critical path
    $response = $this->httpClient->post('https://erp.company.com/api/orders', [
        'json' => ['order_id' => $order->getId(), 'total' => $order->getGrandTotal()]
    ]);
    
    // If ERP is slow or down:
    // - Customer's checkout times out
    // - Order may not be placed
    // - Revenue lost
}
```

```php
// ===== CORRECT — Queue it =====
// Observer/AfterPlaceOrder.php

public function execute(\Magento\Framework\Event\Observer $observer): void
{
    $order = $observer->getEvent()->getOrder();
    
    // CORRECT: Publish to queue — returns immediately
    $message = $this->messageFactory->create();
    $message->setOrderId((int) $order->getId());
    
    $this->publisher->publish(
        'erp.order.sync',  // topic name
        $message           // serializable DTO
    );
    
    // Control returns immediately — checkout continues
    // Consumer processes async with retry capability
}
```

#### The Rule and Why

```
place_order critical path:
  Payment auth (sync - necessary, customer expects it)
        |
        v
  Inventory reservation (sync - necessary, prevent oversell)
        |
        v
  Order record creation (sync - necessary)
        |
        v
  STOP HERE for critical path
  Everything else: QUEUE

Non-critical (must be async):
  - ERP notification
  - OMS notification  
  - Email sending (already async in Magento)
  - Analytics events
  - Fraud scoring (unless blocking - then use Native Webhook with tight timeout)
  - Loyalty points calculation
  - Affiliate tracking
```

**Exam focus:** If a question asks about adding functionality to `checkout_submit_all_after` or `sales_order_place_after` that involves calling an external API — the answer is ALWAYS: publish to queue, process async. The only exception is payment authorization which is already part of the payment flow.

### Other Critical Anti-Patterns

```php
// ANTI-PATTERN: Using ObjectManager directly (except in tests/factories)
$product = \Magento\Framework\App\ObjectManager::getInstance()->get(
    \Magento\Catalog\Model\Product::class
);
// Correct: inject via constructor DI

// ANTI-PATTERN: Loading collection in loop
foreach ($orderIds as $orderId) {
    $order = $this->orderRepository->get($orderId); // N queries
}
// Correct: Use SearchCriteria to load all at once

// ANTI-PATTERN: Preference over plugin
// config/di.xml
<preference for="Magento\Catalog\Model\Product" type="Vendor\Module\Model\Product"/>
// Correct: Use plugin on ProductInterface method

// ANTI-PATTERN: Writing to database in build phase
// deploy.php hook running setup:upgrade = FINE
// Custom code calling DB in bin/magento module:enable = FINE
// Custom ECE build step connecting to DB = WRONG (no DB in build)

// ANTI-PATTERN: Hardcoding credentials in config.xml
<default>
    <vendor_module>
        <api_key>sk_live_abcdef123456</api_key>
    </vendor_module>
</default>
// Correct: Cloud UI env var + system.xml with backend_model="encrypted"
```

---

## 7. Scenario-Based Decision Tables

These replicate the "two right answers" format of the exam.

### Scenario 1: Extending Order Processing

> A merchant wants to send order data to a third-party ERP system when an order is placed. The ERP API occasionally has 5-second response times. What is the correct approach?

| Option | Why It Looks Right | Why It's Wrong |
|---|---|---|
| A: Plugin on `OrderManagement::place()`, call ERP API synchronously | Guaranteed delivery, immediate | Blocks checkout for 5s on every order |
| **B: Observer on `sales_order_place_after`, publish to RabbitMQ queue** | **Async, decoupled, retry-capable** | **CORRECT** |
| C: Cron job polling order status every minute | Simple, no dependencies | 1-minute delay, misses real-time need |
| D: After plugin on `OrderRepository::save()`, call ERP directly | Catches all order saves | Same sync problem + catches admin edits too |

**Answer: B** — Queue the message, process async with retry.

### Scenario 2: Adding a Field to Customer API

> You need to add a `tax_exemption_id` field to the Customer API response without breaking existing integrations.

| Option | Why It Looks Right | Why It's Wrong |
|---|---|---|
| A: Add column to `customer_entity`, modify `Customer` model | Works | Breaks upgrade compatibility, modifies core table schema unsafely |
| **B: Extension attribute on `CustomerInterface` + plugin on `CustomerRepository`** | **Contract-safe, upgrade-safe** | **CORRECT** |
| C: Custom API endpoint returning customer + extra field | No modification to existing API | New contract required, doesn't extend existing |
| D: EAV attribute via `setup:upgrade` | Easy, merchant-configurable | Not type-safe, EAV performance penalty, not in API contract |

**Answer: B** — Extension attributes preserve the contract.

### Scenario 3: Cloud Deployment of Config Change

> A developer changed `catalog/search/engine` from `mysql` to `elasticsearch7` in the admin. How should this be properly managed for deployment?

| Option | Why It Looks Right | Why It's Wrong |
|---|---|---|
| A: Export from admin, it's saved in DB, deploy will carry it | Convenient | DB-level config doesn't deploy to other envs automatically |
| **B: `bin/magento app:config:dump`, commit `config.php`, deploy pipeline** | **Config as code, version-controlled** | **CORRECT** |
| C: Set `SEARCH_CONFIGURATION` in `.magento.env.yaml` | Cloud-native | Correct for service URL/port, but engine selection should be in `config.php` |
| D: Directly edit `env.php` on each server | Works | Manual, error-prone, breaks IaC |

**Answer: B** (or C for the service connection details — both are partially right, B for the scope config).

### Scenario 4: Plugin vs Preference

> Two modules both need to modify `Magento\Catalog\Model\Product::getName()`. Module A uses a preference; Module B uses a plugin.

| Question | Answer |
|---|---|
| Which will cause a conflict? | Module A (preference) — only one preference can win |
| Which approach does the exam prefer? | Module B (plugin) — plugins chain, preferences conflict |
| What if Module A's preference's method is `final`? | Plugin on Module A's class won't work either — use an event |
| What if both use plugins? | Both work — sort order determines execution order |

**Exam focus:** Preferences create a "winner takes all" conflict. Two plugins on the same method both execute (chained). Always prefer plugins.

---

## Quick-Reference Checklist

### Section 1 — Design

- [ ] **Service contracts** live in `Api/` and `Api/Data/` — external code uses interface only
- [ ] **Extension attributes** require `extension_attributes.xml` + plugin on repository to persist
- [ ] **Preferences** conflict when two modules override same class — plugins chain safely
- [ ] **Plugins cannot intercept**: `final` methods, `final` classes, static methods, `__construct`, non-public methods
- [ ] **`around` plugin**: must call `$proceed()` to continue chain; skipping stops all subsequent plugins
- [ ] **After plugin** receives `($subject, $result, ...$args)` — `$result` is the return value to modify
- [ ] **GraphQL resolvers** must use service contracts, never resource models directly
- [ ] **GraphQL cache identity** class required for query-level caching
- [ ] **GraphQL mutations** bypass HTTP cache automatically
- [ ] **`GraphQlAuthorizationException`** thrown when customer auth check fails in resolver
- [ ] Extension attributes auto-appear in API responses; custom attributes appear under `custom_attributes` key

### Section 2 — Review

- [ ] **Indexer mode = `schedule`** in production; `realtime` causes admin save latency
- [ ] **FPC invalidation** is tag-based; blocks must declare `getCacheTags()` for granular purge
- [ ] **MSI salable qty**: use `GetProductSalableQtyInterface` from `inventory-sales-api`, NOT legacy `StockStateInterface`
- [ ] **MSI reservations** are append-only compensating transactions; source item qty deducted only on shipment
- [ ] **`StockResolverInterface`** maps website code to stock ID
- [ ] **Unit tests**: mock everything, use `ObjectManager` helper, no DB
- [ ] **Integration tests**: use `@magentoDataFixture`, real DB (transactions rolled back), real DI
- [ ] **`@magentoDbIsolation enabled`**: wraps test in DB transaction, auto-rollback
- [ ] **MFTF**: browser/acceptance tests via Selenium — NOT for unit/integration testing
- [ ] **N+1 problem**: load collections with `SearchCriteria`, not in loops with `getById()`

### Section 3 — Deploy

- [ ] **BUILD phase**: no DB connection; runs `di:compile`, `setup:static-content:deploy`; filesystem is writable
- [ ] **DEPLOY phase**: DB available; runs `setup:upgrade`, `cache:flush`; maintenance mode active
- [ ] **POST-DEPLOY phase**: traffic restored; runs cache warm-up, search indexing
- [ ] **`MAGENTO_CLOUD_RELATIONSHIPS`**: base64 encoded JSON containing service connection strings
- [ ] **`config.php`**: committed to git; stores non-sensitive scope config and module status
- [ ] **`env.php`**: NEVER committed; generated by ECE-Tools from cloud relationships
- [ ] **`.magento.env.yaml`**: committed; controls ECE-Tools behavior per stage (build/deploy/post_deploy)
- [ ] **ECE-Tools scenarios**: extensible XML files — extend/replace individual steps without forking ECE-Tools
- [ ] **`SCD_ON_DEMAND`**: delays static file generation until first request (good for staging, bad for production)
- [ ] **Sensitive values** (API keys, passwords): Cloud UI env vars or `env.php` — NEVER `config.xml` or `config.php`

### Integration Patterns

- [ ] **NEVER make sync external API calls in `place_order` flow** — always queue
- [ ] **Webhook controller**: validate signature first, return 200 for duplicates (not 4xx), queue processing
- [ ] **Idempotency key**: store in persistent DB table with TTL; check before every webhook processing
- [ ] **Adobe I/O Events**: outbound async; Magento publishes, external subscribes; configured in `io_events.xml`
- [ ] **Native Webhooks**: outbound sync; declared in `webhooks.xml`; `required="true"` can block execution
- [ ] **Event-driven ERP**: use message queue topic → consumer → ERP adapter pattern
- [ ] **Queue consumer**: throw exceptions on failure (don't swallow) — queue infrastructure handles retry
- [ ] **Payment `authorize()`**: `setIsTransactionClosed(false)` to allow later capture
- [ ] **Payment `capture()`**: `setIsTransactionClosed(true)` to close transaction
- [ ] **3DS2 liability shift**: successful 3DS auth moves fraud liability to issuing bank
- [ ] **Vault**: stores `public_hash` token only — NEVER raw card data
- [ ] **Payment Provider Gateway**: use `BuilderInterface` + `HandlerInterface` pipeline, not override `AbstractMethod`
- [ ] **Circuit Breaker states**: Closed (healthy) → Open (failing, reject) → Half-Open (testing recovery)
- [ ] **Rate limiting on Cloud**: use Fastly edge rules for efficiency over PHP-level rate limiting
- [ ] **Retry with backoff**: exponential — 1s, 2s, 4s, 8s... — for transient failures

### Architect Mindset Rules

- [ ] **Interface over class**: always inject and type-hint on interfaces
- [ ] **Cloud-native over on-prem**: ECE-Tools/Adobe I/O over manual file edits
- [ ] **Async over sync** for non-critical paths (ERP notify, email, analytics, loyalty)
- [ ] **Plugin over preference**: plugins chain, preferences conflict
- [ ] **Two correct-looking answers**: pick the one that is more extensible, upgrade-safe, and follows separation of concerns
- [ ] **Code review red flag #1**: sync external HTTP call in checkout observer/plugin
- [ ] **Code review red flag #2**: `ObjectManager::getInstance()` outside test/factory context
- [ ] **Code review red flag #3**: Preference when a plugin would work
- [ ] **Code review red flag #4**: DB credentials or API keys in committed config files
