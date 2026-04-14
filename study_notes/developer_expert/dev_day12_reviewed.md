# Day 12 — API Customization (REST + GraphQL)
## Magento 2 Certified Professional Developer Study Notes

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [REST API: webapi.xml, Resource/Method Mapping, ACL](#2-rest-api-webapixml-resourcemethod-mapping-acl)
3. [Custom REST Endpoints](#3-custom-rest-endpoints)
4. [GraphQL: schema.graphqls, Resolvers, Context, Caching](#4-graphql-schemagraphqls-resolvers-context-caching)
5. [Extension Attributes on APIs](#5-extension-attributes-on-apis)
6. [API Versioning](#6-api-versioning)
7. [Asynchronous APIs & Bulk Endpoints](#7-asynchronous-apis--bulk-endpoints)
8. [Input Validation on APIs](#8-input-validation-on-apis)
9. [Practice Exercise](#9-practice-exercise)
10. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Overview & Architecture

Magento 2 exposes its domain logic through two primary API layers:

```
+---------------------------+
|    Client (cURL / App)    |
+---------------------------+
            |
     REST or GraphQL
            |
+---------------------------+
|   Magento API Framework   |
|  (routing, auth, serial.) |
+---------------------------+
            |
+---------------------------+
|  Service Layer (Interfaces|
|  + Implementations)       |
+---------------------------+
            |
+---------------------------+
|  Repository / Resource    |
|  Model / Database         |
+---------------------------+
```

| Layer | Technology | Entry Point |
|---|---|---|
| REST | HTTP verbs + JSON/XML | `webapi.xml` |
| GraphQL | HTTP POST + Query Language | `schema.graphqls` |
| SOAP | WSDL auto-generated | `webapi.xml` (same) |
| Async/Bulk | Message Queue + REST | `webapi.xml` + `queue_topology.xml` |

**Exam focus:**
- Both REST **and** SOAP are configured in `webapi.xml` — same file, same service interfaces
- GraphQL is **completely separate** from `webapi.xml`; it uses `schema.graphqls` files
- The API framework serializes/deserializes DTOs automatically via **reflection** on typed interfaces

---

## 2. REST API: webapi.xml, Resource/Method Mapping, ACL

### 2.1 webapi.xml Structure

Located at: `<Module>/etc/webapi.xml`

```xml
<?xml version="1.0"?>
<routes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Webapi:etc/webapi.xsd">

    <!-- GET single resource -->
    <route url="/V1/mymodule/items/:id" method="GET">
        <service class="Vendor\MyModule\Api\ItemRepositoryInterface" method="getById"/>
        <resources>
            <resource ref="Vendor_MyModule::items_view"/>
        </resources>
    </route>

    <!-- GET collection -->
    <route url="/V1/mymodule/items" method="GET">
        <service class="Vendor\MyModule\Api\ItemRepositoryInterface" method="getList"/>
        <resources>
            <resource ref="Vendor_MyModule::items_view"/>
        </resources>
    </route>

    <!-- POST create -->
    <route url="/V1/mymodule/items" method="POST">
        <service class="Vendor\MyModule\Api\ItemRepositoryInterface" method="save"/>
        <resources>
            <resource ref="Vendor_MyModule::items_manage"/>
        </resources>
    </route>

    <!-- DELETE -->
    <route url="/V1/mymodule/items/:id" method="DELETE">
        <service class="Vendor\MyModule\Api\ItemRepositoryInterface" method="deleteById"/>
        <resources>
            <resource ref="Vendor_MyModule::items_manage"/>
        </resources>
    </route>

    <!-- Anonymous access (no auth required) -->
    <route url="/V1/mymodule/public-info" method="GET">
        <service class="Vendor\MyModule\Api\PublicInfoInterface" method="get"/>
        <resources>
            <resource ref="anonymous"/>
        </resources>
    </route>

    <!-- Self-access (customer sees own data) -->
    <route url="/V1/mymodule/mine" method="GET">
        <service class="Vendor\MyModule\Api\CustomerDataInterface" method="getMine"/>
        <resources>
            <resource ref="self"/>
        </resources>
    </route>

</routes>
```

### 2.2 HTTP Verb to CRUD Mapping

| HTTP Method | Typical Use | URL Pattern |
|---|---|---|
| `GET` | Read single / collection | `/V1/resource/:id` or `/V1/resource` |
| `POST` | Create new resource | `/V1/resource` |
| `PUT` | Full update (replace) | `/V1/resource/:id` |
| `DELETE` | Remove resource | `/V1/resource/:id` |
| `PATCH` | Partial update (less common in core) | `/V1/resource/:id` |

**Exam focus:**
- URL parameters prefixed with `:` (e.g., `:id`) are automatically mapped to matching method parameter names
- The `method` attribute on `<route>` is the **HTTP verb**, while the `method` attribute on `<service>` is the **PHP method name**
- `anonymous` = no authentication; `self` = customer token grants access to their own data only

### 2.3 ACL Resources in webapi.xml

ACL resources defined in `<Module>/etc/acl.xml` are referenced in `webapi.xml`:

```xml
<!-- etc/acl.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Acl/etc/acl.xsd">
    <acl>
        <resources>
            <resource id="Magento_Backend::admin">
                <resource id="Vendor_MyModule::mymodule" title="My Module">
                    <resource id="Vendor_MyModule::items_view"   title="View Items"   sortOrder="10"/>
                    <resource id="Vendor_MyModule::items_manage" title="Manage Items" sortOrder="20"/>
                </resource>
            </resource>
        </resources>
    </acl>
</config>
```

**Exam focus:**
- ACL resource IDs follow the pattern `Vendor_Module::resource_name`
- The same ACL resources used in admin menu also gate API access
- A REST call authenticated with an **integration token** uses that integration's ACL permissions
- `<resource ref="anonymous"/>` bypasses token auth entirely — use with caution

### 2.4 Authentication Methods

| Token Type | How Obtained | Typical Use |
|---|---|---|
| Admin token | `POST /V1/integration/admin/token` | Admin-level operations |
| Customer token | `POST /V1/integration/customer/token` | Customer-facing APIs |
| Integration token | Admin > System > Integrations | Third-party systems |
| OAuth 1.0a | Integration handshake | Secure integrations |

```bash
# Get admin token
curl -X POST "https://magento.local/rest/V1/integration/admin/token" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}'

# Use token in subsequent request
curl -X GET "https://magento.local/rest/V1/products/24-MB01" \
  -H "Authorization: Bearer <token_from_above>"
```

---

## 3. Custom REST Endpoints

Creating a custom endpoint requires four components:

```
Interface (Api/)  -->  Implementation (Model/Api/)  -->  DI binding (di.xml)  -->  Route (webapi.xml)
```

### 3.1 Step 1: Define the Service Interface

```php
<?php
// Vendor/MyModule/Api/QuoteCalculatorInterface.php

declare(strict_types=1);

namespace Vendor\MyModule\Api;

/**
 * Quote Calculator API
 * @api
 */
interface QuoteCalculatorInterface
{
    /**
     * Calculate discount for a given customer and amount.
     *
     * @param int   $customerId
     * @param float $amount
     * @return \Vendor\MyModule\Api\Data\DiscountResultInterface
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     * @throws \Magento\Framework\Exception\LocalizedException
     */
    public function calculate(int $customerId, float $amount): DiscountResultInterface;
}
```

**Exam focus:**
- The `@api` annotation marks the interface as part of the public API contract
- **Return type and parameter types in the docblock** are used by the serialization framework — they must be accurate
- Interface lives in `Api/` directory; Data Transfer Objects live in `Api/Data/`

### 3.2 Step 2: Define the Data Transfer Object (DTO)

```php
<?php
// Vendor/MyModule/Api/Data/DiscountResultInterface.php

declare(strict_types=1);

namespace Vendor\MyModule\Api\Data;

/**
 * @api
 */
interface DiscountResultInterface
{
    public const DISCOUNT_AMOUNT   = 'discount_amount';
    public const DISCOUNT_PERCENT  = 'discount_percent';
    public const MESSAGE           = 'message';

    /**
     * @return float
     */
    public function getDiscountAmount(): float;

    /**
     * @param float $amount
     * @return $this
     */
    public function setDiscountAmount(float $amount): self;

    /**
     * @return float
     */
    public function getDiscountPercent(): float;

    /**
     * @param float $percent
     * @return $this
     */
    public function setDiscountPercent(float $percent): self;

    /**
     * @return string|null
     */
    public function getMessage(): ?string;

    /**
     * @param string|null $message
     * @return $this
     */
    public function setMessage(?string $message): self;
}
```

### 3.3 Step 3: Implement the DTO

```php
<?php
// Vendor/MyModule/Model/Data/DiscountResult.php

declare(strict_types=1);

namespace Vendor\MyModule\Model\Data;

use Magento\Framework\DataObject;
use Vendor\MyModule\Api\Data\DiscountResultInterface;

class DiscountResult extends DataObject implements DiscountResultInterface
{
    public function getDiscountAmount(): float
    {
        return (float) $this->getData(self::DISCOUNT_AMOUNT);
    }

    public function setDiscountAmount(float $amount): self
    {
        return $this->setData(self::DISCOUNT_AMOUNT, $amount);
    }

    public function getDiscountPercent(): float
    {
        return (float) $this->getData(self::DISCOUNT_PERCENT);
    }

    public function setDiscountPercent(float $percent): self
    {
        return $this->setData(self::DISCOUNT_PERCENT, $percent);
    }

    public function getMessage(): ?string
    {
        return $this->getData(self::MESSAGE);
    }

    public function setMessage(?string $message): self
    {
        return $this->setData(self::MESSAGE, $message);
    }
}
```

### 3.4 Step 4: Implement the Service Interface

```php
<?php
// Vendor/MyModule/Model/QuoteCalculator.php

declare(strict_types=1);

namespace Vendor\MyModule\Model;

use Magento\Customer\Api\CustomerRepositoryInterface;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NoSuchEntityException;
use Vendor\MyModule\Api\Data\DiscountResultInterface;
use Vendor\MyModule\Api\Data\DiscountResultInterfaceFactory;
use Vendor\MyModule\Api\QuoteCalculatorInterface;

class QuoteCalculator implements QuoteCalculatorInterface
{
    public function __construct(
        private readonly CustomerRepositoryInterface      $customerRepository,
        private readonly DiscountResultInterfaceFactory   $discountResultFactory,
    ) {}

    /**
     * @inheritDoc
     */
    public function calculate(int $customerId, float $amount): DiscountResultInterface
    {
        // Validate customer exists (throws NoSuchEntityException if not found)
        $customer = $this->customerRepository->getById($customerId);

        if ($amount <= 0) {
            throw new LocalizedException(__('Amount must be greater than zero.'));
        }

        // Business logic
        $percent  = $this->resolveDiscountPercent($customer->getGroupId());
        $discount = $amount * ($percent / 100);

        /** @var DiscountResultInterface $result */
        $result = $this->discountResultFactory->create();
        $result->setDiscountAmount(round($discount, 2));
        $result->setDiscountPercent($percent);
        $result->setMessage(sprintf('Customer group discount: %.0f%%', $percent));

        return $result;
    }

    private function resolveDiscountPercent(int $groupId): float
    {
        return match ($groupId) {
            1 => 5.0,   // General
            2 => 10.0,  // Wholesale
            3 => 15.0,  // Retailer
            default => 0.0,
        };
    }
}
```

### 3.5 Step 5: Bind Interface to Implementation via DI

```xml
<!-- Vendor/MyModule/etc/di.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">

    <!-- Service interface binding -->
    <preference for="Vendor\MyModule\Api\QuoteCalculatorInterface"
                type="Vendor\MyModule\Model\QuoteCalculator"/>

    <!-- DTO interface binding -->
    <preference for="Vendor\MyModule\Api\Data\DiscountResultInterface"
                type="Vendor\MyModule\Model\Data\DiscountResult"/>

</config>
```

### 3.6 Step 6: Register the Route

```xml
<!-- Vendor/MyModule/etc/webapi.xml -->
<?xml version="1.0"?>
<routes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Webapi:etc/webapi.xsd">

    <route url="/V1/mymodule/discount/:customerId" method="POST">
        <service class="Vendor\MyModule\Api\QuoteCalculatorInterface" method="calculate"/>
        <resources>
            <resource ref="Vendor_MyModule::discount_calculate"/>
        </resources>
    </route>

</routes>
```

### 3.7 Test with cURL

```bash
# 1. Get admin token
TOKEN=$(curl -s -X POST "https://magento.local/rest/V1/integration/admin/token" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' | tr -d '"')

# 2. Call custom endpoint (customerId=5 is in URL, amount in body)
curl -X POST "https://magento.local/rest/V1/mymodule/discount/5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 150.00}'

# Expected response:
# {
#   "discount_amount": 15.00,
#   "discount_percent": 10.0,
#   "message": "Customer group discount: 10%"
# }
```

**Exam focus:**
- URL path parameters (`:customerId`) are mapped **by name** to method parameters
- Body parameters are mapped by **JSON key name** matching method parameter names
- The API framework uses the **interface** (not the implementation) for serialization
- Factory classes for interfaces are auto-generated: `SomeInterface` → `SomeInterfaceFactory`

---

## 4. GraphQL: schema.graphqls, Resolvers, Context, Caching

### 4.1 Schema Definition (schema.graphqls)

Located at: `<Module>/etc/schema.graphqls`

```graphql
# Vendor/MyModule/etc/schema.graphqls

type Query {
    # Extends the root Query type with a new field
    vendorItems(
        filter: VendorItemFilterInput      @doc(description: "Filter criteria")
        pageSize: Int = 20                 @doc(description: "Items per page")
        currentPage: Int = 1               @doc(description: "Page number")
    ): VendorItemsOutput @resolver(class: "Vendor\\MyModule\\Model\\Resolver\\Items")
                         @doc(description: "Retrieve a list of vendor items")
                         @cache(cacheIdentity: "Vendor\\MyModule\\Model\\Resolver\\Cache\\VendorItemsIdentity")

    vendorItemById(id: Int! @doc(description: "Item ID")): VendorItem
        @resolver(class: "Vendor\\MyModule\\Model\\Resolver\\Item")
        @doc(description: "Retrieve a single vendor item by ID")
}

type Mutation {
    createVendorItem(input: CreateVendorItemInput!): VendorItem
        @resolver(class: "Vendor\\MyModule\\Model\\Resolver\\CreateItem")
        @doc(description: "Create a new vendor item")
}

type VendorItemsOutput {
    items: [VendorItem]         @doc(description: "Array of items")
    total_count: Int            @doc(description: "Total matching items")
    page_info: SearchResultPageInfo @doc(description: "Pagination metadata")
}

type VendorItem {
    id: Int                     @doc(description: "Item ID")
    name: String                @doc(description: "Item name")
    sku: String                 @doc(description: "Item SKU")
    price: Float                @doc(description: "Item price")
    is_active: Boolean          @doc(description: "Active status")
    created_at: String          @doc(description: "Creation date")
}

input VendorItemFilterInput {
    name: FilterEqualTypeInput
    sku: FilterMatchTypeInput
    price: FilterRangeTypeInput
    is_active: FilterEqualTypeInput
}

input CreateVendorItemInput {
    name: String!
    sku: String!
    price: Float!
}
```

**Exam focus:**
- `@resolver` annotation binds the field to a PHP resolver class
- `@cache` annotation enables caching with an **identity class** to manage cache tags
- `@doc` annotation provides the description in the schema introspection
- `type Query` and `type Mutation` are extended — you don't redefine them, you add to them
- Input types must end with `Input` by convention; output types don't

### 4.2 Implementing a Resolver

```php
<?php
// Vendor/MyModule/Model/Resolver/Items.php

declare(strict_types=1);

namespace Vendor\MyModule\Model\Resolver;

use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Exception\GraphQlAuthorizationException;
use Magento\Framework\GraphQl\Exception\GraphQlNoSuchEntityException;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Vendor\MyModule\Api\ItemRepositoryInterface;
use Vendor\MyModule\Model\ResourceModel\Item\CollectionFactory;

class Items implements ResolverInterface
{
    public function __construct(
        private readonly ItemRepositoryInterface $itemRepository,
        private readonly CollectionFactory       $collectionFactory,
    ) {}

    /**
     * @inheritDoc
     */
    public function resolve(
        Field       $field,
        $context,
        ResolveInfo $info,
        ?array      $value = null,
        ?array      $args  = null
    ): array {
        // 1. Authorization check
        if (false === $context->getExtensionAttributes()->getIsCustomer()
            && !$context->getUserId()
        ) {
            // Allow anonymous for this example, but show how to check:
            // throw new GraphQlAuthorizationException(__('Guest access not allowed.'));
        }

        // 2. Extract and validate arguments
        $pageSize    = $args['pageSize']    ?? 20;
        $currentPage = $args['currentPage'] ?? 1;
        $filter      = $args['filter']      ?? [];

        if ($pageSize < 1 || $pageSize > 300) {
            throw new \Magento\Framework\GraphQl\Exception\GraphQlInputException(
                __('pageSize must be between 1 and 300.')
            );
        }

        // 3. Fetch data
        $collection = $this->collectionFactory->create();
        $collection->setPageSize($pageSize);
        $collection->setCurPage($currentPage);

        if (!empty($filter['is_active']['eq'])) {
            $collection->addFieldToFilter('is_active', $filter['is_active']['eq']);
        }

        // 4. Return array matching the GraphQL type
        $items = [];
        foreach ($collection as $item) {
            $items[] = [
                'id'         => (int) $item->getId(),
                'name'       => $item->getName(),
                'sku'        => $item->getSku(),
                'price'      => (float) $item->getPrice(),
                'is_active'  => (bool) $item->getIsActive(),
                'created_at' => $item->getCreatedAt(),
            ];
        }

        return [
            'items'       => $items,
            'total_count' => $collection->getSize(),
            'page_info'   => [
                'page_size'    => $pageSize,
                'current_page' => $currentPage,
                'total_pages'  => (int) ceil($collection->getSize() / $pageSize),
            ],
        ];
    }
}
```

### 4.3 The ResolverInterface Contract

```php
// Magento\Framework\GraphQl\Query\ResolverInterface

interface ResolverInterface
{
    /**
     * @param Field       $field       - The GraphQL field being resolved
     * @param mixed       $context     - Request context (auth, store, etc.)
     * @param ResolveInfo $info        - Query AST information
     * @param array|null  $value       - Parent resolver's value (for nested fields)
     * @param array|null  $args        - Field arguments from the query
     * @return mixed
     */
    public function resolve(
        Field       $field,
        $context,
        ResolveInfo $info,
        ?array      $value = null,
        ?array      $args  = null
    );
}
```

**Exam focus:**
- `$value` contains the **parent type's resolved array** — used for nested/child resolvers
- `$context` gives access to `getUserId()`, `getUserType()`, store scope, extension attributes
- `$info` gives access to the full query AST — can be used to detect requested fields for optimization
- Resolvers must be **registered in `di.xml`** only if they need virtual types; otherwise they are auto-instantiated

### 4.4 Context and Authorization

```php
<?php
// Authorization patterns in GraphQL resolvers

use Magento\Framework\GraphQl\Exception\GraphQlAuthorizationException;
use Magento\Authorization\Model\UserContextInterface;

// Check if user is a logged-in customer
if ($context->getUserType() !== UserContextInterface::USER_TYPE_CUSTOMER) {
    throw new GraphQlAuthorizationException(__('Customer login required.'));
}

// Check if user is a logged-in admin
if ($context->getUserType() !== UserContextInterface::USER_TYPE_ADMIN) {
    throw new GraphQlAuthorizationException(__('Admin access required.'));
}

// Get customer ID from context
$customerId = $context->getUserId();

// Check if customer is logged in (not guest)
$extensionAttributes = $context->getExtensionAttributes();
$isLoggedIn = $extensionAttributes->getIsCustomer();
```

| `getUserType()` value | Constant | Meaning |
|---|---|---|
| `1` | `USER_TYPE_INTEGRATION` | Integration token |
| `2` | `USER_TYPE_ADMIN` | Admin user |
| `3` | `USER_TYPE_CUSTOMER` | Logged-in customer |
| `4` | `USER_TYPE_GUEST` | Anonymous / guest |

> **NOTE — corrected:** The constants are defined in `Magento\Authorization\Model\UserContextInterface` with values INTEGRATION=1, ADMIN=2, CUSTOMER=3, GUEST=4. Guest is **not 0** — there is no 0 value. Many study materials incorrectly list these starting from 0.

### 4.5 GraphQL Caching with ScopeProvider

```php
<?php
// Vendor/MyModule/Model/Resolver/Cache/VendorItemsIdentity.php

declare(strict_types=1);

namespace Vendor\MyModule\Model\Resolver\Cache;

use Magento\Framework\GraphQl\Query\Resolver\IdentityInterface;

/**
 * Identity for caching the VendorItems resolver result.
 * Returns cache tags so the cache can be invalidated properly.
 */
class VendorItemsIdentity implements IdentityInterface
{
    private const CACHE_TAG = 'vendor_item';

    /**
     * Return cache tags based on the resolved data.
     *
     * @param array $resolvedData - The data returned by the resolver
     * @return string[]
     */
    public function getIdentities(array $resolvedData): array
    {
        $ids = [];

        if (!empty($resolvedData['items'])) {
            foreach ($resolvedData['items'] as $item) {
                $ids[] = sprintf('%s_%s', self::CACHE_TAG, $item['id']);
            }
        }

        // Return base tag + per-item tags
        return array_merge([self::CACHE_TAG], $ids);
    }
}
```

**ScopeProvider for store-level caching:**

```php
<?php
// How store scope affects GraphQL cache keys

// In newer Magento 2.4.x, use ScopeProvider to determine cache scope
use Magento\GraphQlResolverCache\Model\Resolver\Result\Type as GraphQlResolverCache;

// The @cache directive in schema.graphqls triggers the caching system
// Cache is keyed per: store view + currency + customer group (configurable)
```

```graphql
# Full @cache directive options in schema.graphqls
type Query {
    vendorItems: VendorItemsOutput
        @resolver(class: "Vendor\\MyModule\\Model\\Resolver\\Items")
        @cache(
            cacheIdentity: "Vendor\\MyModule\\Model\\Resolver\\Cache\\VendorItemsIdentity"
        )
}
```

**Exam focus:**
- `@cache` only works for **Query** fields, not Mutations
- The identity class returns **cache tags** that are used for cache invalidation
- GraphQL resolver cache is stored in the **full-page cache** (Varnish/Redis)
- `IdentityInterface::getIdentities()` receives the **already-resolved data array**
- Without `@cache`, each GraphQL request is a full PHP execution

---

## 5. Extension Attributes on APIs

Extension attributes allow third-party modules to **add fields to existing API responses** without modifying the core module.

### 5.1 Declare Extension Attributes

```xml
<!-- Vendor/MyModule/etc/extension_attributes.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Api/etc/extension_attributes.xsd">

    <!-- Add fields to Product API response -->
    <extension_attributes for="Magento\Catalog\Api\Data\ProductInterface">
        <attribute code="vendor_custom_label"  type="string"/>
        <attribute code="vendor_rating_count"  type="int"/>
        <attribute code="vendor_certifications" type="Vendor\MyModule\Api\Data\CertificationInterface[]"/>
    </extension_attributes>

    <!-- Add fields to Order API response -->
    <extension_attributes for="Magento\Sales\Api\Data\OrderInterface">
        <attribute code="vendor_tracking_url" type="string"/>
    </extension_attributes>

    <!-- Add fields to Customer API response -->
    <extension_attributes for="Magento\Customer\Api\Data\CustomerInterface">
        <attribute code="vendor_loyalty_points" type="int"/>
    </extension_attributes>

</config>
```

**Exam focus:**
- `for` attribute must reference the **interface**, not the implementation class
- Type `string[]` = array of strings; `SomeInterface[]` = array of DTOs
- Magento auto-generates `ExtensionInterface` and `Extension` classes in `generated/`
- The generated class is named: `{Original}ExtensionInterface` → e.g., `ProductExtensionInterface`

### 5.2 Load and Populate Extension Attributes (Plugin Approach)

```php
<?php
// Vendor/MyModule/Plugin/ProductRepositoryPlugin.php

declare(strict_types=1);

namespace Vendor\MyModule\Plugin;

use Magento\Catalog\Api\Data\ProductInterface;
use Magento\Catalog\Api\Data\ProductExtensionFactory;
use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Framework\Api\SearchResultsInterface;
use Vendor\MyModule\Model\ResourceModel\ProductLabel;

class ProductRepositoryPlugin
{
    public function __construct(
        private readonly ProductExtensionFactory $extensionFactory,
        private readonly ProductLabel            $productLabelResource,
    ) {}

    /**
     * After getById: hydrate extension attributes for a single product
     */
    public function afterGetById(
        ProductRepositoryInterface $subject,
        ProductInterface           $product
    ): ProductInterface {
        return $this->addExtensionAttributes($product);
    }

    /**
     * After get: hydrate extension attributes for a single product (by SKU)
     */
    public function afterGet(
        ProductRepositoryInterface $subject,
        ProductInterface           $product
    ): ProductInterface {
        return $this->addExtensionAttributes($product);
    }

    /**
     * After getList: hydrate extension attributes for a collection
     */
    public function afterGetList(
        ProductRepositoryInterface $subject,
        SearchResultsInterface     $searchResults
    ): SearchResultsInterface {
        foreach ($searchResults->getItems() as $product) {
            $this->addExtensionAttributes($product);
        }
        return $searchResults;
    }

    private function addExtensionAttributes(ProductInterface $product): ProductInterface
    {
        // Get or create extension attributes object
        $extensionAttributes = $product->getExtensionAttributes()
            ?? $this->extensionFactory->create();

        // Load your custom data
        $label = $this->productLabelResource->getLabelByProductId((int) $product->getId());

        // Set on the extension attributes
        $extensionAttributes->setVendorCustomLabel($label ?? '');
        $extensionAttributes->setVendorRatingCount(
            $this->productLabelResource->getRatingCount((int) $product->getId())
        );

        // Attach back to the product
        $product->setExtensionAttributes($extensionAttributes);

        return $product;
    }
}
```

### 5.3 Save Extension Attributes (Plugin on Save)

```php
<?php
// Plugin to save extension attributes when product is saved

public function afterSave(
    ProductRepositoryInterface $subject,
    ProductInterface           $savedProduct,
    ProductInterface           $product  // Original argument
): ProductInterface {
    $extensionAttributes = $product->getExtensionAttributes();

    if ($extensionAttributes === null) {
        return $savedProduct;
    }

    $customLabel = $extensionAttributes->getVendorCustomLabel();

    if ($customLabel !== null) {
        $this->productLabelResource->saveLabel(
            (int) $savedProduct->getId(),
            $customLabel
        );
    }

    return $savedProduct;
}
```

### 5.4 Register the Plugin

```xml
<!-- Vendor/MyModule/etc/di.xml -->
<type name="Magento\Catalog\Api\ProductRepositoryInterface">
    <plugin name="vendor_mymodule_product_extension_attributes"
            type="Vendor\MyModule\Plugin\ProductRepositoryPlugin"
            sortOrder="10"/>
</type>
```

### 5.5 Serialization / Deserialization Flow

```
API Request (JSON)
        |
        v
+---------------------------+
|  DataObjectProcessor      |  <-- Converts DTO to array (serialization)
+---------------------------+
        |
        v
+---------------------------+
|  ExtensionAttributesFactory| <-- Creates typed extension attributes object
+---------------------------+
        |
        v
+---------------------------+
|  DataObjectHelper         |  <-- Populates DTO from array (deserialization)
+---------------------------+
        |
        v
   PHP Service Method
```

**Exam focus:**
- Extension attributes are **automatically included** in JSON output when populated
- For **input** (POST/PUT), extension attributes are automatically deserialized if declared
- The generated `ExtensionFactory` creates `Extension` objects (concrete class in `generated/`)
- Always check `$product->getExtensionAttributes()` for `null` before calling getter methods

---

## 6. API Versioning

### 6.1 URL-Based Versioning

```
https://magento.local/rest/V1/products           <- Version 1 (current)
https://magento.local/rest/V2/products           <- Version 2 (hypothetical)
https://magento.local/rest/all/V1/products       <- All store views
https://magento.local/rest/default/V1/products   <- Default store view
https://magento.local/rest/en/V1/products        <- Store code "en"
```

The store code segment is **optional** and defaults to the default store if omitted:
```
/rest/{store_code}/V{n}/{endpoint}
```

### 6.2 Interface Versioning Best Practices

```php
<?php
// V1 interface - existing, stable
namespace Vendor\MyModule\Api;

/**
 * @api
 * @since 1.0.0
 */
interface ItemRepositoryInterface
{
    public function getById(int $id): Data\ItemInterface;
    public function getList(\Magento\Framework\Api\SearchCriteriaInterface $searchCriteria);
    public function save(Data\ItemInterface $item): Data\ItemInterface;
    public function deleteById(int $id): bool;
}
```

```php
<?php
// V2 interface - extends V1 for backward compatibility
namespace Vendor\MyModule\Api;

/**
 * @api
 * @since 2.0.0
 */
interface ItemRepositoryV2Interface extends ItemRepositoryInterface
{
    /**
     * New method only available in V2
     */
    public function getBySku(string $sku): Data\ItemInterface;
    public function bulkSave(array $items): array;
}
```

```xml
<!-- webapi.xml: register both versions -->
<route url="/V1/mymodule/items/:id" method="GET">
    <service class="Vendor\MyModule\Api\ItemRepositoryInterface" method="getById"/>
    <resources><resource ref="Vendor_MyModule::items_view"/></resources>
</route>

<route url="/V2/mymodule/items/:id" method="GET">
    <service class="Vendor\MyModule\Api\ItemRepositoryV2Interface" method="getById"/>
    <resources><resource ref="Vendor_MyModule::items_view"/></resources>
</route>

<route url="/V2/mymodule/items/sku/:sku" method="GET">
    <service class="Vendor\MyModule\Api\ItemRepositoryV2Interface" method="getBySku"/>
    <resources><resource ref="Vendor_MyModule::items_view"/></resources>
</route>
```

**Exam focus:**
- `V1` is NOT just a convention — it is part of the routing mechanism
- Magento's **own core interfaces** are marked `@api` and maintain backward compatibility
- You should **never remove or change method signatures** on `@api` interfaces in minor/patch releases
- New versions should **extend** (not replace) existing interfaces

---

## 7. Asynchronous APIs & Bulk Endpoints

### 7.1 Async Single Endpoint

Magento provides async versions of REST endpoints automatically using the `/async/` prefix:

```bash
# Synchronous (blocks until done)
POST /rest/V1/products

# Asynchronous (returns immediately with a bulk UUID)
POST /rest/async/V1/products

# Response for async:
{
    "bulk_uuid": "1234abcd-...",
    "request_items": [{"id": 0, "data_hash": "abc123", "status": "accepted"}],
    "errors": false
}
```

### 7.2 Bulk Endpoints

```bash
# Bulk: send multiple items in one request
POST /rest/async/bulk/V1/products

# Request body: array of product objects
[
    {"product": {"sku": "SKU-001", "name": "Product 1", "price": 10.00, "attribute_set_id": 4}},
    {"product": {"sku": "SKU-002", "name": "Product 2", "price": 20.00, "attribute_set_id": 4}},
    {"product": {"sku": "SKU-003", "name": "Product 3", "price": 30.00, "attribute_set_id": 4}}
]

# Response:
{
    "bulk_uuid": "5678efgh-...",
    "request_items": [
        {"id": 0, "data_hash": "hash1", "status": "accepted"},
        {"id": 1, "data_hash": "hash2", "status": "accepted"},
        {"id": 2, "data_hash": "hash3", "status": "accepted"}
    ],
    "errors": false
}
```

### 7.3 Checking Bulk Operation Status

```bash
# Check status of a bulk operation
GET /rest/V1/bulk/{bulkUuid}/status

# Response shows per-item status:
{
    "bulk_uuid": "5678efgh-...",
    "description": "Product save",
    "start_time": "2024-01-15 10:00:00",
    "user_type": 2,
    "operation_count": 3,
    "operations_list": [
        {"id": 0, "status": 1, "result_message": "Successfully saved product SKU-001"},
        {"id": 1, "status": 1, "result_message": "Successfully saved product SKU-002"},
        {"id": 2, "status": 4, "result_message": "Error: duplicate SKU"}
    ]
}
```

### 7.4 How Async Works Internally

```
Client POST /async/V1/products
            |
            v
+---------------------------+
|   AsyncRequestProcessor   |  Validates, serializes request
+---------------------------+
            |
            v
+---------------------------+
|   Message Queue (AMQP     |  Publishes to topic:
|   or MySQL queue)         |  async.magento.catalog.productrepositoryinterface.save.post
+---------------------------+
            |
            v
+---------------------------+
|   Consumer Process        |  bin/magento queue:consumers:start async.operations.all
|   (runs as daemon)        |
+---------------------------+
            |
            v
+---------------------------+
|   Actual Service Method   |  ProductRepositoryInterface::save()
+---------------------------+
```

### 7.5 Queue Topic Naming Convention

```
async.{vendor_module}.{interface_name_lowercase}.{method_name}.{http_verb}

# Examples:
async.magento.catalog.productrepositoryinterface.save.post
async.magento.customer.customerrepositoryinterface.save.put
async.magento.sales.orderrepositoryinterface.save.post
```

### 7.6 Running Consumers

```bash
# Start the async operations consumer
bin/magento queue:consumers:start async.operations.all

# With max messages limit (restart after N messages to prevent memory leaks)
bin/magento queue:consumers:start async.operations.all --max-messages=1000

# List all available consumers
bin/magento queue:consumers:list
```

**Exam focus:**
- `/async/V1/` prefix = single async request; `/async/bulk/V1/` = bulk async request
- The bulk UUID is returned immediately; actual processing is deferred
- You need a **consumer daemon running** for async operations to process
- Operation status values: `1` = Complete, `2` = Retriably Failed, `4` = Definitively Failed
- Async does NOT require any `webapi.xml` changes — it's handled by the framework automatically

---

## 8. Input Validation on APIs

### 8.1 Exception Types and @throws

```php
<?php
// Proper exception declaration in service interfaces

namespace Vendor\MyModule\Api;

interface ItemRepositoryInterface
{
    /**
     * @param int $id
     * @return \Vendor\MyModule\Api\Data\ItemInterface
     * @throws \Magento\Framework\Exception\NoSuchEntityException  When item not found
     * @throws \Magento\Framework\Exception\LocalizedException      Generic localized error
     */
    public function getById(int $id): Data\ItemInterface;

    /**
     * @param \Vendor\MyModule\Api\Data\ItemInterface $item
     * @return \Vendor\MyModule\Api\Data\ItemInterface
     * @throws \Magento\Framework\Exception\CouldNotSaveException   Save failed
     * @throws \Magento\Framework\Exception\InputException           Invalid input
     * @throws \Magento\Framework\Exception\AlreadyExistsException  Duplicate key
     */
    public function save(Data\ItemInterface $item): Data\ItemInterface;

    /**
     * @param int $id
     * @return bool
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     * @throws \Magento\Framework\Exception\CouldNotDeleteException
     */
    public function deleteById(int $id): bool;
}
```

### 8.2 Exception to HTTP Status Code Mapping

| Exception Class | HTTP Status | When to Use |
|---|---|---|
| `NoSuchEntityException` | 404 Not Found | Entity doesn't exist |
| `InputException` | 400 Bad Request | Invalid input data |
| `AuthorizationException` | 401 Unauthorized | Missing auth |
| `AuthenticationException` | 401 Unauthorized | Invalid credentials |
| `CouldNotSaveException` | 400 Bad Request | Save failed (extends LocalizedException) |
| `CouldNotDeleteException` | 400 Bad Request | Delete failed (extends LocalizedException) |
| `AlreadyExistsException` | 400 Bad Request | Duplicate entity (extends LocalizedException) |
| `LocalizedException` | 400 Bad Request | Generic user-facing error |
| `\Exception` | 500 Internal Error | Unexpected error |

> **NOTE — corrected:** `CouldNotSaveException`, `CouldNotDeleteException`, and `AlreadyExistsException` all extend `LocalizedException` and are mapped to **400 Bad Request** by `Magento\Framework\Webapi\ErrorProcessor` (not 500/409 as many study materials claim). The ErrorProcessor only has three HTTP code branches: `NoSuchEntityException`→404, `AuthorizationException|AuthenticationException`→401, everything else extending `LocalizedException`→400.

**Exam focus:**
- Exception mapping to HTTP codes is handled by `Magento\Framework\Webapi\ErrorProcessor` (NOT `InputParamsResolver`)
- `LocalizedException` is safe to throw — its message is shown to the API client
- Raw `\Exception` messages are **NOT** shown to clients in production (for security)
- Always use typed exceptions so the framework maps to correct HTTP codes

### 8.3 InputException for Field-Level Validation

```php
<?php
// Detailed input validation with per-field errors

use Magento\Framework\Exception\InputException;

public function save(Data\ItemInterface $item): Data\ItemInterface
{
    $exception = new InputException();

    // Validate individual fields
    if (empty(trim($item->getName()))) {
        $exception->addError(__('Name is required.'));
    }

    if (strlen($item->getName()) > 255) {
        $exception->addError(
            __('Name must not exceed %1 characters.', 255)
        );
    }

    if ($item->getPrice() === null) {
        $exception->addError(__('Price is required.'));
    } elseif ($item->getPrice() < 0) {
        $exception->addError(__('Price must be greater than or equal to 0.'));
    }

    if (!empty($exception->getErrors())) {
        throw $exception;
    }

    // Proceed with save
    try {
        $this->resource->save($item);
    } catch (\Exception $e) {
        throw new CouldNotSaveException(
            __('Could not save item: %1', $e->getMessage()),
            $e
        );
    }

    return $item;
}
```

### 8.4 Validator Interface Pattern

```php
<?php
// Vendor/MyModule/Model/Validator/ItemValidator.php

declare(strict_types=1);

namespace Vendor\MyModule\Model\Validator;

use Magento\Framework\Exception\InputException;
use Vendor\MyModule\Api\Data\ItemInterface;

class ItemValidator
{
    private const MAX_NAME_LENGTH = 255;
    private const MAX_PRICE       = 99999.9999;

    /**
     * @throws InputException
     */
    public function validate(ItemInterface $item): void
    {
        $exception = new InputException();

        $this->validateName($item, $exception);
        $this->validatePrice($item, $exception);
        $this->validateSku($item, $exception);

        if ($exception->wasErrorAdded()) {
            throw $exception;
        }
    }

    private function validateName(ItemInterface $item, InputException $exception): void
    {
        $name = $item->getName();

        if ($name === null || trim($name) === '') {
            $exception->addError(__('"%fieldName" is required. Enter and try again.', [
                'fieldName' => ItemInterface::NAME,
            ]));
            return;
        }

        if (strlen($name) > self::MAX_NAME_LENGTH) {
            $exception->addError(__(
                '"%fieldName" length must be %length characters or fewer.',
                ['fieldName' => ItemInterface::NAME, 'length' => self::MAX_NAME_LENGTH]
            ));
        }
    }

    private function validatePrice(ItemInterface $item, InputException $exception): void
    {
        $price = $item->getPrice();

        if ($price === null) {
            $exception->addError(__('"%fieldName" is required.', [
                'fieldName' => ItemInterface::PRICE,
            ]));
            return;
        }

        if ($price < 0 || $price > self::MAX_PRICE) {
            $exception->addError(__(
                '"%fieldName" must be between 0 and %max.',
                ['fieldName' => ItemInterface::PRICE, 'max' => self::MAX_PRICE]
            ));
        }
    }

    private function validateSku(ItemInterface $item, InputException $exception): void
    {
        if (empty($item->getSku())) {
            $exception->addError(__('SKU is required.'));
        }
    }
}
```

### 8.5 GraphQL Input Validation

```php
<?php
// GraphQL uses different exception classes

use Magento\Framework\GraphQl\Exception\GraphQlInputException;
use Magento\Framework\GraphQl\Exception\GraphQlNoSuchEntityException;
use Magento\Framework\GraphQl\Exception\GraphQlAuthorizationException;
use Magento\Framework\GraphQl\Exception\GraphQlAlreadyExistsException;

// In a mutation resolver:
public function resolve(Field $field, $context, ResolveInfo $info, ?array $value = null, ?array $args = null)
{
    $input = $args['input'] ?? [];

    if (empty($input['name'])) {
        throw new GraphQlInputException(__('Name is required.'));
    }

    if (empty($input['sku'])) {
        throw new GraphQlInputException(__('SKU is required.'));
    }

    // GraphQL exceptions are returned in the "errors" array, not as HTTP 4xx
}
```

**Exam focus:**
- GraphQL errors appear in `{"errors": [...]}` in the response body, never as HTTP 4xx
- REST errors appear as HTTP status codes with JSON body `{"message": "...", "errors": [...]}`
- `InputException::wasErrorAdded()` checks if any errors were collected
- `InputException::addError()` accepts a `Phrase` object (result of `__()`)

---

## 9. Practice Exercise

### Exercise: Custom REST Endpoint with ACL + Extension Attribute

**Goal:** Create endpoint `GET /V1/vendor/product-info/:sku` that returns product data + a custom extension attribute `vendor_review_summary`.

#### Step 1: Module Structure

```
app/code/Vendor/ApiDemo/
  registration.php
  etc/
    module.xml
    webapi.xml
    acl.xml
    di.xml
    extension_attributes.xml
  Api/
    ProductInfoInterface.php
    Data/
      ProductInfoResultInterface.php
  Model/
    ProductInfo.php
    Data/
      ProductInfoResult.php
  Plugin/
    ProductRepositoryPlugin.php
```

#### Step 2: Create Files

```php
<?php
// Api/ProductInfoInterface.php

namespace Vendor\ApiDemo\Api;

interface ProductInfoInterface
{
    /**
     * @param string $sku
     * @return \Vendor\ApiDemo\Api\Data\ProductInfoResultInterface
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     */
    public function getInfoBySku(string $sku): Data\ProductInfoResultInterface;
}
```

```xml
<!-- etc/webapi.xml -->
<routes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Webapi:etc/webapi.xsd">
    <route url="/V1/vendor/product-info/:sku" method="GET">
        <service class="Vendor\ApiDemo\Api\ProductInfoInterface" method="getInfoBySku"/>
        <resources>
            <resource ref="Vendor_ApiDemo::product_info_view"/>
        </resources>
    </route>
</routes>
```

```xml
<!-- etc/acl.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Acl/etc/acl.xsd">
    <acl>
        <resources>
            <resource id="Magento_Backend::admin">
                <resource id="Vendor_ApiDemo::apidemo" title="API Demo">
                    <resource id="Vendor_ApiDemo::product_info_view"
                              title="View Product Info" sortOrder="10"/>
                </resource>
            </resource>
        </resources>
    </acl>
</config>
```

```xml
<!-- etc/extension_attributes.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Api/etc/extension_attributes.xsd">
    <extension_attributes for="Magento\Catalog\Api\Data\ProductInterface">
        <attribute code="vendor_review_summary" type="string"/>
    </extension_attributes>
</config>
```

#### Step 3: cURL Test Commands

```bash
#!/bin/bash
BASE_URL="https://magento.local"

# Get admin token
echo "=== Getting admin token ==="
TOKEN=$(curl -s -X POST "${BASE_URL}/rest/V1/integration/admin/token" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' | tr -d '"')

echo "Token: $TOKEN"

# Test the custom endpoint
echo ""
echo "=== Testing custom endpoint ==="
curl -s -X GET "${BASE_URL}/rest/V1/vendor/product-info/24-MB01" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | python3 -m json.tool

# Test with invalid SKU (should get 404)
echo ""
echo "=== Testing 404 for invalid SKU ==="
curl -s -X GET "${BASE_URL}/rest/V1/vendor/product-info/INVALID-SKU-XYZ" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | python3 -m json.tool

# Test standard product endpoint to see extension attribute
echo ""
echo "=== Testing product extension attribute ==="
curl -s -X GET "${BASE_URL}/rest/V1/products/24-MB01" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | python3 -m json.tool | grep -A5 "extension_attributes"

# Test without token (should get 401)
echo ""
echo "=== Testing unauthorized access ==="
curl -s -X GET "${BASE_URL}/rest/V1/vendor/product-info/24-MB01" \
  -H "Accept: application/json"
```

#### Step 4: Expected Responses

```json
// Successful response from custom endpoint
{
    "sku": "24-MB01",
    "name": "Joust Duffle Bag",
    "price": 34.00,
    "vendor_review_summary": "4.5 stars (127 reviews)"
}

// Extension attribute on standard product endpoint
{
    "id": 1,
    "sku": "24-MB01",
    "extension_attributes": {
        "vendor_review_summary": "4.5 stars (127 reviews)",
        "website_ids": [1]
    }
}

// 404 response
{
    "message": "The product that was requested doesn't exist. Verify the product and try again."
}

// 401 Unauthorized
{
    "message": "Consumer is not authorized to access %resources",
    "parameters": {
        "resources": "Vendor_ApiDemo::product_info_view"
    }
}
```

---

## Quick-Reference Checklist

### REST API — webapi.xml
- [ ] `webapi.xml` is in `<Module>/etc/webapi.xml` and configures both REST and SOAP
- [ ] `<route url="..." method="GET|POST|PUT|DELETE">` defines the endpoint
- [ ] `<service class="...Interface" method="...">` maps to a PHP interface method
- [ ] `<resource ref="Vendor_Module::acl_resource"/>` enforces ACL
- [ ] `anonymous` resource = no auth required; `self` = customer can access own data
- [ ] URL parameters use `:paramName` syntax, matched by PHP parameter name

### Custom REST Endpoints
- [ ] Interface in `Api/` directory, annotated with `@api`
- [ ] Data Transfer Objects (DTOs) in `Api/Data/` as interfaces
- [ ] Implementation in `Model/` or `Model/Api/`
- [ ] DI binding in `etc/di.xml` via `<preference for="...Interface" type="...Implementation"/>`
- [ ] DTO factories are auto-generated as `SomeInterfaceFactory`
- [ ] Return type docblock annotations control serialization format

### ACL
- [ ] ACL resources defined in `etc/acl.xml` under `Magento_Backend::admin` hierarchy
- [ ] Resource ID format: `Vendor_Module::resource_name`
- [ ] Same ACL resources used for admin UI and API access
- [ ] Integration tokens carry the ACL permissions configured for that integration

### GraphQL
- [ ] Schema defined in `<Module>/etc/schema.graphqls`
- [ ] `@resolver(class: "...")` binds a GraphQL field to a PHP class
- [ ] Resolver must implement `Magento\Framework\GraphQl\Query\ResolverInterface`
- [ ] `resolve($field, $context, $info, $value, $args)` is the only method
- [ ] `$value` = parent resolver's array (for nested fields)
- [ ] `$context->getUserId()` = customer/admin ID; `getUserType()` = user type constant
- [ ] `$context->getExtensionAttributes()->getIsCustomer()` = logged-in customer check
- [ ] `@cache(cacheIdentity: "...")` enables resolver result caching for Query fields
- [ ] Identity class implements `IdentityInterface` and returns cache tags array
- [ ] GraphQL errors go in `{"errors": [...]}`, never HTTP 4xx

### Extension Attributes
- [ ] Declared in `<Module>/etc/extension_attributes.xml`
- [ ] `for` attribute must reference the **interface** (not implementation class)
- [ ] Types: scalar (`string`, `int`, `float`, `bool`) or DTO interface (`SomeInterface[]`)
- [ ] Generated classes appear in `generated/code/` (e.g., `ProductExtension`)
- [ ] Hydrate via plugin on repository `afterGet`, `afterGetById`, `afterGetList`
- [ ] Save via plugin on repository `afterSave` using original `$item` argument
- [ ] Always null-check `getExtensionAttributes()` before calling setter/getter

### API Versioning
- [ ] URL pattern: `/rest/{store_code}/V{n}/{endpoint}` (store_code is optional)
- [ ] Version is part of routing — V1 and V2 are separate routes in `webapi.xml`
- [ ] New versions should **extend** existing interfaces, not replace them
- [ ] `@api` annotation marks interfaces as public contract — never break them in minor/patch
- [ ] `@since` annotation documents the version when a feature was introduced

### Async / Bulk APIs
- [ ] `/async/V1/` prefix = single async operation; returns bulk UUID immediately
- [ ] `/async/bulk/V1/` prefix = bulk async; body is JSON array of request bodies
- [ ] No `webapi.xml` changes needed — framework handles async routing automatically
- [ ] Consumer: `bin/magento queue:consumers:start async.operations.all`
- [ ] Check status: `GET /V1/bulk/{bulkUuid}/status`
- [ ] Operation statuses: 1 = Complete, 2 = Retriably Failed, 4 = Definitively Failed
- [ ] Topic naming: `async.{module}.{interface}.{method}.{http_verb}`

### Input Validation
- [ ] `@throws` annotations in interfaces document expected exceptions
- [ ] `NoSuchEntityException` → HTTP 404; `InputException` → HTTP 400; `LocalizedException` → HTTP 400
- [ ] `CouldNotSaveException` / `CouldNotDeleteException` / `AlreadyExistsException` → HTTP **400** (NOT 500/409 — all extend LocalizedException)
- [ ] `InputException::addError()` collects multiple field errors before throwing
- [ ] `InputException::wasErrorAdded()` checks if any errors were collected
- [ ] Raw `\Exception` messages are hidden from API response in production
- [ ] GraphQL uses `GraphQlInputException`, `GraphQlNoSuchEntityException`, `GraphQlAuthorizationException`
- [ ] Wrap service calls in try/catch; rethrow as appropriate Magento exception type

### Authentication
- [ ] Admin token: `POST /V1/integration/admin/token` with `{"username":"...","password":"..."}`
- [ ] Customer token: `POST /V1/integration/customer/token`
- [ ] Token passed as `Authorization: Bearer {token}` header
- [ ] GraphQL authentication: same bearer token in `Authorization` header
