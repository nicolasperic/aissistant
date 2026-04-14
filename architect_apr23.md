# Adobe Commerce Architect Exam — Study Notes
## Code Standards, SOLID Principles & Testing Frameworks

**Week 2 · Section 1: Advanced Design + Section 2 Intro**

---

## Table of Contents

1. [SOLID Principles in Adobe Commerce](#1-solid-principles-in-adobe-commerce)
   - [SRP — Single Responsibility Principle](#srp--single-responsibility-principle)
   - [OCP — Open/Closed Principle](#ocp--openclosed-principle)
   - [LSP — Liskov Substitution Principle](#lsp--liskov-substitution-principle)
   - [ISP — Interface Segregation Principle](#isp--interface-segregation-principle)
   - [DIP — Dependency Inversion Principle](#dip--dependency-inversion-principle)
2. [Magento Extension Quality Program (MEQP) & Code Standards](#2-magento-extension-quality-program-meqp--code-standards)
   - [The @api Annotation](#the-api-annotation)
   - [Forbidden Patterns](#forbidden-patterns)
   - [ObjectManager — The Nuanced Rule](#objectmanager--the-nuanced-rule)
3. [Testing Frameworks](#3-testing-frameworks)
   - [Unit Testing (PHPUnit)](#unit-testing-phpunit)
   - [Integration Testing](#integration-testing)
   - [MFTF — Magento Functional Testing Framework](#mftf--magento-functional-testing-framework)
   - [API Functional Testing (WebapiAbstract)](#api-functional-testing-webabstractapi)
   - [Static Testing](#static-testing)
4. [Choosing the Right Test Type — Exam Decision Matrix](#4-choosing-the-right-test-type--exam-decision-matrix)
5. [Architectural Reasoning Guide](#5-architectural-reasoning-guide)
6. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. SOLID Principles in Adobe Commerce

> These are not abstract principles for the exam — each maps to a **concrete Adobe Commerce mechanism**. The exam tests *why* you choose one mechanism over another.

---

### SRP — Single Responsibility Principle

**Definition:** A class should have only one reason to change.

**In Adobe Commerce:**
- Controllers handle only routing/dispatch; delegate to service classes
- Models hold only domain state; business logic lives in dedicated Service classes or Action classes
- Plugins/observers stay focused: one plugin = one cross-cutting concern

**Architectural signal:** If a class imports both a repository *and* a transport layer (like `TransportBuilder`), it likely violates SRP.

```php
// BAD — Order model doing too much
class Order extends AbstractModel
{
    public function place()
    {
        // validation logic
        // payment logic
        // email sending
        // inventory deduction
    }
}

// GOOD — Thin model + dedicated service
class OrderManagement implements OrderManagementInterface
{
    public function __construct(
        private readonly OrderValidator $validator,
        private readonly PaymentProcessor $payment,
        private readonly OrderNotifier $notifier,
        private readonly InventoryService $inventory,
    ) {}

    public function place(OrderInterface $order): OrderInterface
    {
        $this->validator->validate($order);
        $this->payment->capture($order);
        $this->inventory->deduct($order);
        $this->notifier->send($order);
        return $order;
    }
}
```

- **Exam focus:** If an exam scenario describes a model that also sends emails or writes logs, the correct answer will involve extracting that logic into a separate class/service — this is SRP in action.

---

### OCP — Open/Closed Principle

**Definition:** Open for extension, closed for modification.

**In Adobe Commerce — the three mechanisms ranked:**

```
PREFERENCE (di.xml)         PLUGIN                  EVENT/OBSERVER
|                           |                        |
Replaces entire class       Wraps public methods     Decoupled side effects
(use sparingly)             (preferred extension)    (loose coupling)
|                           |                        |
Exam: last resort           Exam: PRIMARY tool        Exam: side effects only
```

**Plugin over Preference — the architectural reason:**

A `preference` replaces the entire class, meaning:
- You break other plugins that depend on the original
- You own the full class upgrade burden
- You couple tightly to the original implementation

A `plugin` wraps behavior without owning the class:

```xml
<!-- di.xml — Plugin (preferred) -->
<type name="Magento\Catalog\Model\Product">
    <plugin name="vendor_module_product_price_plugin"
            type="Vendor\Module\Plugin\ProductPlugin"
            sortOrder="10"
            disabled="false"/>
</type>

<!-- di.xml — Preference (last resort, use only for interface substitution) -->
<preference for="Magento\Catalog\Api\Data\ProductInterface"
            type="Vendor\Module\Model\Product"/>
```

```php
// Plugin — OCP in practice
class ProductPlugin
{
    // before: modify arguments BEFORE original method
    public function beforeGetPrice(\Magento\Catalog\Model\Product $subject): array
    {
        // mutate arguments passed to getPrice()
        return [];
    }

    // around: full control — MUST call $proceed
    public function aroundGetPrice(
        \Magento\Catalog\Model\Product $subject,
        callable $proceed
    ): float {
        $result = $proceed();
        return $result * 1.1;
    }

    // after: modify return value AFTER original method
    public function afterGetPrice(
        \Magento\Catalog\Model\Product $subject,
        float $result
    ): float {
        return max($result, 0.0);
    }
}
```

- **Exam focus:** When asked how to extend core behavior without modifying core code, **plugin is architecturally superior to preference**. Preference is only correct when you need to substitute an *interface binding* entirely or when the method is not pluginnable (non-public, final class, etc.).
- **Exam focus:** `around` plugins have performance cost and prevent other plugins from running cleanly — `before`/`after` are preferred when sufficient.

---

### LSP — Liskov Substitution Principle

**Definition:** Subtypes must be substitutable for their base types without altering program correctness.

**In Adobe Commerce — Interface Contracts:**

Adobe Commerce enforces LSP through its **Service Contract** layer. When you implement an interface like `ProductRepositoryInterface`, your implementation *must* honor:
- The same method signatures
- The same thrown exception types
- The same return type contracts
- No strengthened preconditions, no weakened postconditions

```php
// Interface contract (the "contract")
interface ProductRepositoryInterface
{
    /**
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     * @throws \Magento\Framework\Exception\LocalizedException
     */
    public function getById(int $productId, bool $editMode = false): ProductInterface;
}

// BAD — LSP violation: throws an exception type NOT in the contract
class CustomProductRepository implements ProductRepositoryInterface
{
    public function getById(int $productId, bool $editMode = false): ProductInterface
    {
        // throws \RuntimeException — not in the interface contract!
        throw new \RuntimeException('Not implemented');
    }
}

// GOOD — honors the contract
class CustomProductRepository implements ProductRepositoryInterface
{
    public function getById(int $productId, bool $editMode = false): ProductInterface
    {
        // ...
        throw new NoSuchEntityException(__('Product %1 not found', $productId));
    }
}
```

- **Exam focus:** LSP failures in Adobe Commerce manifest as implementations that throw unexpected exceptions, return incompatible types, or add mandatory constructor dependencies that change behavior. Injecting through the interface is only safe if implementations are truly substitutable.
- **Exam focus:** Service contracts (`Api/` directory) are the mechanism Adobe Commerce uses to *enforce* LSP across module boundaries.

---

### ISP — Interface Segregation Principle

**Definition:** Clients should not be forced to depend on methods they do not use.

**In Adobe Commerce — Granular Interfaces:**

Adobe Commerce's `Api/Data/` interfaces demonstrate ISP by splitting concerns:

```php
// BAD — Fat interface: forces implementors to implement unrelated methods
interface ProductInterface
{
    public function getName(): string;
    public function getPrice(): float;
    public function getStockQty(): float;       // Inventory concern
    public function getShippingWeight(): float; // Shipping concern
    public function getTaxClassId(): int;       // Tax concern
}

// GOOD — Adobe Commerce's actual approach: granular extension attributes
// Core product data
interface ProductInterface extends ExtensibleDataInterface
{
    public function getName(): string;
    public function getPrice(): float;
    public function getSku(): string;
}

// Inventory is a separate bounded context with its own interface
interface StockItemInterface
{
    public function getQty(): float;
    public function getIsInStock(): bool;
}
```

**Real-world Adobe Commerce ISP pattern:**
- `ProductInterface` — core product data
- `ProductExtensionInterface` — dynamically added extension attributes (ISP via composition)
- `StockItemInterface` — inventory-specific, in MSI module

```php
// ISP-correct: your service only depends on what it needs
class PriceCalculator
{
    // Only depends on pricing interface, not the full product interface
    public function __construct(
        private readonly ProductPriceInterface $priceProvider
    ) {}
}
```

- **Exam focus:** If an exam scenario asks you to add behavior to a third-party module's interface, the correct answer is **extension attributes** (ISP-compliant addition), not modifying the existing interface.

---

### DIP — Dependency Inversion Principle

**Definition:** High-level modules should not depend on low-level modules. Both should depend on abstractions.

**In Adobe Commerce — Constructor Injection of Interfaces:**

```php
// BAD — depends on concrete class (low-level)
class OrderService
{
    public function __construct(
        private readonly \Magento\Catalog\Model\ResourceModel\Product $productResource
    ) {}
}

// GOOD — depends on abstraction (interface)
class OrderService
{
    public function __construct(
        private readonly \Magento\Catalog\Api\ProductRepositoryInterface $productRepository
    ) {}
}
```

**di.xml binds interfaces to implementations:**

```xml
<!-- di.xml — DIP in practice -->
<preference for="Magento\Catalog\Api\ProductRepositoryInterface"
            type="Magento\Catalog\Model\ProductRepository"/>
```

This means `OrderService` never needs to change when the implementation changes — only the DI binding changes.

**DIP + Virtual Types:**

```xml
<!-- Create a specialized instance without creating a new class -->
<virtualType name="Vendor\Module\Model\SpecialProductRepository"
             type="Magento\Catalog\Model\ProductRepository">
    <arguments>
        <argument name="metadataService"
                  xsi:type="object">Vendor\Module\Model\SpecialMetadata</argument>
    </arguments>
</virtualType>
```

- **Exam focus:** DIP is implemented in Adobe Commerce through **constructor injection of interfaces**, not concrete classes. The exam will flag direct instantiation (`new ClassName()`) as a DIP violation except in the specific allowed cases (see ObjectManager section).
- **Exam focus:** Injecting `\Magento\Framework\ObjectManagerInterface` into a business class is a DIP violation *and* an anti-pattern. The allowed exceptions are very specific.

---

## 2. Magento Extension Quality Program (MEQP) & Code Standards

### Running MEQP Static Analysis

```bash
# Install PHP_CodeSniffer with Magento2 standard
composer require --dev magento/magento-coding-standard

# Run against your module
./vendor/bin/phpcs --standard=Magento2 app/code/Vendor/Module/

# Run with detailed messages and show sniff codes
./vendor/bin/phpcs --standard=Magento2 --severity=1 -s app/code/Vendor/Module/

# Auto-fix what's fixable
./vendor/bin/phpcbf --standard=Magento2 app/code/Vendor/Module/

# Via Magento's built-in test runner
bin/magento dev:tests:run static
```

- **Exam focus:** `phpcs --standard=Magento2` is the command for MEQP static analysis. Know both the manual command and the `bin/magento dev:tests:run static` form.

---

### The `@api` Annotation

This is a **high-value exam topic** because the implications are architectural, not just stylistic.

```php
/**
 * Product Repository Interface
 *
 * @api
 */
interface ProductRepositoryInterface
{
    // This is part of the stable public API
    public function getById(int $productId): ProductInterface;
}
```

**The contract `@api` creates:**

| Scenario | With `@api` | Without `@api` |
|---|---|---|
| Minor version upgrade (2.4.x → 2.4.y) | **Must not break** | May change |
| Major version upgrade (2.4 → 2.5) | May change with deprecation notice | May change freely |
| Third-party can safely implement/extend | Yes | No — risky |
| Part of Service Contract | Yes (typically) | No |

**Key files that MUST have `@api`:**
- All interfaces in `Api/` directory
- All data interfaces in `Api/Data/` directory
- Public service classes intended for cross-module use

```php
// WITHOUT @api — internal implementation detail
class ProductHelper extends AbstractHelper
{
    // Can be changed/removed in ANY minor release
    public function formatPrice(float $price): string { ... }
}

// WITH @api — stable contract
/**
 * @api
 */
interface PriceFormatterInterface
{
    // Guaranteed stable across minor releases
    public function format(float $price, int $storeId): string;
}
```

- **Exam focus:** `@api` signals **semantic versioning stability**. Without it, Adobe Commerce can change a public method signature in a minor release without it being a breaking change *by their contract*. This is why you should always inject `*Interface` types tagged with `@api`, not concrete implementations.
- **Exam focus:** The presence of `@api` on a concrete class (not just interface) means that class's public API is stable. Extension developers should prefer depending on `@api`-annotated types.

---

### Forbidden Patterns

These are anti-patterns that MEQP will flag and the exam will test:

#### 1. Direct Superglobal Access (`$_POST`, `$_GET`, `$_SERVER`)

```php
// FORBIDDEN
class SaveController extends Action
{
    public function execute()
    {
        $name = $_POST['name'];       // Direct superglobal — NEVER
        $id   = $_GET['id'];          // NEVER
        $host = $_SERVER['HTTP_HOST']; // NEVER (use ScopeConfigInterface)
    }
}

// CORRECT — use the Request object
class SaveController extends Action
{
    public function __construct(
        Context $context,
        private readonly RequestInterface $request
    ) {
        parent::__construct($context);
    }

    public function execute()
    {
        $name = $this->request->getParam('name');
        $id   = (int) $this->request->getParam('id');
    }
}
```

**Why:** Security (no filtering/sanitization bypass), testability (can't mock superglobals).

#### 2. Raw SQL in Models

```php
// FORBIDDEN — SQL directly in model or service class
class ProductModel extends AbstractModel
{
    public function getSpecialProducts(): array
    {
        $connection = $this->_resource->getConnection();
        // Raw SQL — bypasses ORM, escaping, table prefix handling
        return $connection->query("SELECT * FROM catalog_product_entity WHERE price < 100")->fetchAll();
    }
}

// CORRECT — use ResourceModel + collection or repository
class ProductCollection extends AbstractCollection
{
    protected function _initSelect(): static
    {
        parent::_initSelect();
        $this->addFieldToFilter('price', ['lt' => 100]);
        return $this;
    }
}

// Or use the Query Builder
class ProductResource extends AbstractDb
{
    public function getSpecialProducts(): array
    {
        $connection = $this->getConnection();
        $select = $connection->select()
            ->from($this->getMainTable())
            ->where('price < ?', 100);
        return $connection->fetchAll($select);
    }
}
```

**Why:** Raw SQL bypasses: table prefix handling, escaping, cross-database compatibility, and the ORM's event system.

#### 3. Business Logic in Templates

```php
// FORBIDDEN — business logic in .phtml template
<?php
// app/design/.../template.phtml
$objectManager = \Magento\Framework\App\ObjectManager::getInstance();
$productRepo = $objectManager->get(\Magento\Catalog\Api\ProductRepositoryInterface::class);
$product = $productRepo->getById(42);

if ($product->getPrice() > 100 && $product->getAttributeText('special_flag') === 'yes') {
    // complex rendering logic
}
?>

// CORRECT — template only presents data from ViewModel
<?php
/** @var \Vendor\Module\ViewModel\ProductViewModel $viewModel */
$viewModel = $block->getData('view_model');
?>
<?php if ($viewModel->isSpecialProduct()): ?>
    <span><?= $block->escapeHtml($viewModel->getFormattedPrice()) ?></span>
<?php endif; ?>
```

```php
// The ViewModel handles business logic
class ProductViewModel implements ArgumentInterface
{
    public function __construct(
        private readonly ProductRepositoryInterface $productRepository,
        private readonly PriceCurrencyInterface $priceCurrency,
    ) {}

    public function isSpecialProduct(): bool
    {
        $product = $this->productRepository->getById(42);
        return $product->getPrice() > 100
            && $product->getAttributeText('special_flag') === 'yes';
    }

    public function getFormattedPrice(): string
    {
        return $this->priceCurrency->format(
            $this->productRepository->getById(42)->getPrice()
        );
    }
}
```

**Why:** Templates can't be unit tested. Business logic in templates is untestable, mixed concerns, and a security risk.

#### 4. Session Usage in Models

```php
// FORBIDDEN — session in model (not request-layer safe)
class PriceModel extends AbstractModel
{
    public function __construct(
        private readonly \Magento\Customer\Model\Session $customerSession
    ) {}

    public function getCustomerPrice(): float
    {
        // Session in model = can't use in CLI, REST API, or async contexts
        $customerId = $this->customerSession->getCustomerId();
        return $this->calculatePrice($customerId);
    }
}

// CORRECT — pass identity explicitly
class PriceModel extends AbstractModel
{
    public function getCustomerPrice(int $customerId): float
    {
        return $this->calculatePrice($customerId);
    }
}
```

**Why:** Sessions are HTTP-only. Models used in CLI commands, message queue consumers, or REST API handlers will fail if they depend on session state.

- **Exam focus:** Know ALL four forbidden patterns and the architectural reason behind each, not just that they're forbidden.

---

### ObjectManager — The Nuanced Rule

This is one of the **trickiest exam topics** because the absolute rule many candidates learn ("never use ObjectManager") is wrong.

**The rule as stated by Adobe Commerce:**

> Direct use of `ObjectManager` is discouraged in **application code**, but is acceptable in specific infrastructure contexts.

```
CONTEXT                          | ObjectManager Direct Use | Status
---------------------------------|--------------------------|--------
Business logic / Services        | $om->get(Foo::class)     | FORBIDDEN
Controllers                      | $om->get(Foo::class)     | FORBIDDEN
Observers / Plugins              | $om->get(Foo::class)     | FORBIDDEN
Templates                        | $om->getInstance()        | FORBIDDEN
---------------------------------|--------------------------|--------
Factory classes                  | $om->create(Foo::class)  | ACCEPTABLE
Unit / Integration Tests         | $om->get(Foo::class)     | ACCEPTABLE
CLI Commands (bootstrap context) | $om->get(Foo::class)     | ACCEPTABLE
setup:upgrade scripts            | $om->get(Foo::class)     | ACCEPTABLE
```

**Why it's acceptable in factories:**

```php
// Generated factory — ObjectManager use is the correct pattern here
class ProductFactory
{
    public function __construct(
        private readonly ObjectManagerInterface $objectManager
    ) {}

    public function create(array $data = []): Product
    {
        // Factories MUST use ObjectManager to support virtual types
        // and allow DI configuration to apply to the created instance
        return $this->objectManager->create(Product::class, $data);
    }
}
```

Without ObjectManager in factories, virtual type configuration in `di.xml` would be bypassed — the factory would always create the concrete class, ignoring any `virtualType` or `preference` configured for it.

**Why it's acceptable in tests:**

```php
// Integration test — ObjectManager provides real DI container
class ProductRepositoryTest extends \Magento\TestFramework\TestCase\AbstractController
{
    private ProductRepositoryInterface $productRepository;

    protected function setUp(): void
    {
        $objectManager = \Magento\TestFramework\Helper\Bootstrap::getObjectManager();
        $this->productRepository = $objectManager->get(ProductRepositoryInterface::class);
    }
}
```

- **Exam focus:** If an exam scenario says "a developer used `ObjectManager::getInstance()` inside a factory class" — this is **NOT wrong**. The exam will try to trick you into flagging it as a violation. Know the acceptable contexts.
- **Exam focus:** If an exam scenario says "a developer used `ObjectManager::getInstance()` in a controller's `execute()` method" — this **IS wrong**. Use constructor injection instead.

---

## 3. Testing Frameworks

### The Four Test Types — Overview

```
TEST TYPE        | Scope              | Real DI? | Real DB? | Speed
-----------------|--------------------|----------|----------|-------
Unit             | Single class       | No       | No       | Fast
Integration      | Multiple + system  | Yes      | Yes      | Slow
MFTF             | Browser UI         | Yes      | Yes      | Slowest
API Functional   | REST/SOAP endpoint | Yes      | Yes      | Medium
Static           | Code quality       | N/A      | N/A      | Fast
```

---

### Unit Testing (PHPUnit)

**Characteristics:**
- Tests a **single class in isolation**
- **No DI container** — you manually construct the class under test
- **No database** — all collaborators are mocked
- Lives in `dev/tests/unit/`

```php
// Example unit test
namespace Vendor\Module\Test\Unit\Model;

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;
use Vendor\Module\Model\PriceCalculator;
use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Catalog\Api\Data\ProductInterface;

class PriceCalculatorTest extends TestCase
{
    private PriceCalculator $model;
    private MockObject $productRepositoryMock;

    protected function setUp(): void
    {
        // MockObject — no real DB, no real DI
        $this->productRepositoryMock = $this->createMock(ProductRepositoryInterface::class);

        // Manual construction — no ObjectManager
        $this->model = new PriceCalculator($this->productRepositoryMock);
    }

    public function testGetDiscountedPrice(): void
    {
        // Arrange
        $productMock = $this->createMock(ProductInterface::class);
        $productMock->method('getPrice')->willReturn(100.0);

        $this->productRepositoryMock
            ->expects($this->once())
            ->method('getById')
            ->with(42)
            ->willReturn($productMock);

        // Act
        $result = $this->model->getDiscountedPrice(42, 0.1);

        // Assert
        $this->assertEquals(90.0, $result);
    }

    public function testGetDiscountedPriceThrowsOnInvalidDiscount(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->model->getDiscountedPrice(42, 1.5); // > 100% discount
    }
}
```

**MockObject patterns:**

```php
// Create a simple mock (all methods return null/default)
$mock = $this->createMock(SomeInterface::class);

// Stub a return value
$mock->method('someMethod')->willReturn('value');

// Stub with argument matching
$mock->method('find')->with($this->equalTo(42))->willReturn($entity);

// Expect exactly N calls
$mock->expects($this->exactly(2))->method('save');

// Expect never called
$mock->expects($this->never())->method('delete');

// Stub exception
$mock->method('get')->willThrowException(new NoSuchEntityException());

// Consecutive calls return different values
$mock->method('next')
     ->willReturnOnConsecutiveCalls('first', 'second', 'third');

// Partial mock (real object + some methods mocked)
$partialMock = $this->getMockBuilder(ConcreteClass::class)
    ->onlyMethods(['expensiveMethod'])
    ->getMock();
$partialMock->method('expensiveMethod')->willReturn('mocked');
```

- **Exam focus:** Unit tests use `MockObject` — never a real DI container or database. If a test needs the DI container, it is an **integration test**, not a unit test.
- **Exam focus:** `createMock()` creates a full mock (all methods stubbed). `getMockBuilder()->onlyMethods([])->getMock()` creates a partial mock where only specified methods are overridden.

---

### Integration Testing

**Characteristics:**
- Tests interaction between **multiple real classes**
- Uses the **real DI container** (`ObjectManager`)
- Uses a **real test database** (`magento_integration_tests`)
- Slower, but catches wiring/integration problems unit tests can't
- Lives in `dev/tests/integration/`

```php
namespace Vendor\Module\Test\Integration\Model;

use Magento\TestFramework\TestCase\AbstractController;

class ProductRepositoryTest extends \Magento\TestFramework\TestCase\AbstractController
{
    private \Magento\Catalog\Api\ProductRepositoryInterface $repository;

    protected function setUp(): void
    {
        parent::setUp();
        // Real ObjectManager — real DI bindings apply
        $this->repository = $this->_objectManager->get(
            \Magento\Catalog\Api\ProductRepositoryInterface::class
        );
    }

    /**
     * @magentoDataFixture Magento/Catalog/_files/product_simple.php
     */
    public function testGetProductById(): void
    {
        $product = $this->repository->getById(1);
        $this->assertEquals('simple', $product->getSku());
    }
}
```

**Key Integration Test Annotations:**

```php
/**
 * @magentoDataFixture Magento/Catalog/_files/product_simple.php
 * Loads a PHP fixture file that creates DB records before the test.
 * Rolled back after test (transactional).
 *
 * @magentoAppIsolation enabled
 * Resets the application state (config, registry) between tests.
 * Use when your test modifies global state.
 *
 * @magentoDbIsolation enabled (default for most tests)
 * Wraps the test in a DB transaction — rolled back after.
 * @magentoDbIsolation disabled
 * Required when testing code that commits transactions internally.
 *
 * @magentoConfigFixture current_store general/locale/code en_US
 * Sets a config value for the duration of the test.
 *
 * @magentoAppArea frontend
 * Sets the application area (frontend, adminhtml, webapi_rest, etc.)
 */
```

**Fixture file example:**

```php
// dev/tests/integration/testsuite/Magento/Catalog/_files/product_simple.php
<?php
/** @var \Magento\Catalog\Model\Product $product */
$product = \Magento\TestFramework\Helper\Bootstrap::getObjectManager()
    ->create(\Magento\Catalog\Model\Product::class);
$product->setTypeId('simple')
    ->setAttributeSetId(4)
    ->setName('Simple Product')
    ->setSku('simple')
    ->setPrice(10)
    ->setStoreId(1)
    ->save();
```

**Running integration tests:**

```bash
# Navigate to integration test dir
cd dev/tests/integration

# Run all integration tests
../../../vendor/bin/phpunit

# Run a specific test class
../../../vendor/bin/phpunit testsuite/Magento/Catalog/Model/ProductTest.php

# Run via Magento CLI
bin/magento dev:tests:run integration
```

- **Exam focus:** Integration tests use `@magentoDataFixture` to seed the DB. Fixtures are rolled back automatically (unless `@magentoDbIsolation disabled`).
- **Exam focus:** `@magentoDbIsolation disabled` is needed when the code under test uses its own transactions (e.g., `order place` which commits). This is a common exam trick.
- **Exam focus:** The integration test DB is `magento_integration_tests` — a separate database configured in `phpunit.xml`.

---

### MFTF — Magento Functional Testing Framework

**Characteristics:**
- Browser-based end-to-end testing (via Selenium/WebDriver)
- Tests user interactions and full UI flows
- Written in **XML** (not PHP)
- Three building blocks: `ActionGroup`, `Test`, `Suite`

**Directory structure:**

```
Vendor/Module/Test/Mftf/
    ActionGroup/
        AddProductToCartActionGroup.xml
    Test/
        AddProductToCartTest.xml
    Suite/
        CheckoutSuite.xml
    Page/
        CartPage.xml
    Section/
        CartSection.xml
```

**ActionGroup** — reusable UI action sequence:

```xml
<!-- AddProductToCartActionGroup.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<actionGroups xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:noNamespaceSchemaLocation="urn:magento:mftf:Test/etc/actionGroupSchema.xsd">
    <actionGroup name="AddProductToCartActionGroup">
        <arguments>
            <argument name="productHandle" type="string"/>
            <argument name="qty" type="string" defaultValue="1"/>
        </arguments>
        <amOnPage url="{{productHandle}}" stepKey="navigateToProduct"/>
        <fillField selector="{{ProductPageSection.qtyInput}}" userInput="{{qty}}" stepKey="fillQty"/>
        <click selector="{{ProductPageSection.addToCartButton}}" stepKey="clickAddToCart"/>
        <waitForPageLoad stepKey="waitAfterAddToCart"/>
    </actionGroup>
</actionGroups>
```

**Test** — a single test using ActionGroups:

```xml
<!-- AddProductToCartTest.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<tests xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:noNamespaceSchemaLocation="urn:magento:mftf:Test/etc/testSchema.xsd">
    <test name="AddSimpleProductToCartTest">
        <annotations>
            <features value="Cart"/>
            <stories value="Add product to cart"/>
            <title value="Customer can add simple product to cart"/>
            <severity value="CRITICAL"/>
            <group value="catalog"/>
        </annotations>
        <before>
            <createData entity="SimpleProduct" stepKey="createSimpleProduct"/>
            <actionGroup ref="LoginToAdminActionGroup" stepKey="loginAsAdmin"/>
        </before>
        <after>
            <deleteData createDataKey="createSimpleProduct" stepKey="deleteProduct"/>
        </after>
        <!-- Use the reusable ActionGroup -->
        <actionGroup ref="AddProductToCartActionGroup" stepKey="addProductToCart">
            <argument name="productHandle" value="$$createSimpleProduct.custom_attributes[url_key]$$.html"/>
        </actionGroup>
        <actionGroup ref="AssertProductInCartActionGroup" stepKey="assertProductInCart"/>
    </test>
</tests>
```

**Suite** — grouping tests:

```xml
<!-- CheckoutSuite.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<suites xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:mftf:Suite/etc/suiteSchema.xsd">
    <suite name="CheckoutSuite">
        <before>
            <!-- Suite-level setup -->
        </before>
        <after>
            <!-- Suite-level teardown -->
        </after>
        <include>
            <test name="AddSimpleProductToCartTest"/>
            <group name="checkout"/>
        </include>
    </suite>
</suites>
```

**Running MFTF tests:**

```bash
# Generate tests from XML
vendor/bin/mftf generate:tests

# Run a single test
vendor/bin/mftf run:test AddSimpleProductToCartTest

# Run a suite
vendor/bin/mftf run:suite CheckoutSuite

# Run a group
vendor/bin/mftf run:group catalog

# Generate and run
vendor/bin/mftf run:test --remove AddSimpleProductToCartTest
```

- **Exam focus:** MFTF tests are XML-based. ActionGroup = reusable steps, Test = single scenario, Suite = grouped scenarios with shared setup/teardown.
- **Exam focus:** `mftf run:test` runs a single test by name. Know this command syntax.

---

### API Functional Testing (WebapiAbstract)

**Characteristics:**
- Tests REST and SOAP API endpoints
- Extends `\Magento\TestFramework\TestCase\WebapiAbstract`
- Uses real HTTP calls (or simulated via the test framework)
- Lives in `dev/tests/api-functional/`

```php
namespace Magento\Catalog\Api;

class ProductRepositoryInterfaceTest extends \Magento\TestFramework\TestCase\WebapiAbstract
{
    const SERVICE_NAME    = 'catalogProductRepositoryV1';
    const SERVICE_VERSION = 'V1';
    const RESOURCE_PATH   = '/V1/products';

    /**
     * @magentoApiDataFixture Magento/Catalog/_files/product_simple.php
     */
    public function testGet(): void
    {
        $productSku = 'simple';
        $serviceInfo = [
            'rest' => [
                'resourcePath' => self::RESOURCE_PATH . '/' . $productSku,
                'httpMethod'   => \Magento\Framework\Webapi\Rest\Request::HTTP_METHOD_GET,
            ],
            'soap' => [
                'service'        => self::SERVICE_NAME,
                'serviceVersion' => self::SERVICE_VERSION,
                'operation'      => self::SERVICE_NAME . 'Get',
            ],
        ];

        $response = $this->_webApiCall($serviceInfo, ['sku' => $productSku]);

        $this->assertEquals($productSku, $response['sku']);
    }
}
```

- **Exam focus:** API functional tests extend `WebapiAbstract` and use `_webApiCall()`. They test REST *and* SOAP from a single test definition.

---

### Static Testing

**Characteristics:**
- Analyzes code without executing it
- Catches code style, MEQP violations, deprecated patterns
- Fast — no runtime needed

```bash
# Run all static tests
bin/magento dev:tests:run static

# Or directly with phpcs
./vendor/bin/phpcs --standard=Magento2 app/code/Vendor/Module/

# Run PHPStan (static analysis)
./vendor/bin/phpstan analyse app/code/Vendor/Module/ --level=5

# Run PHP_CodeSniffer on a single file
./vendor/bin/phpcs --standard=Magento2 app/code/Vendor/Module/Model/Product.php
```

**What static tests catch:**
- MEQP violations (forbidden patterns above)
- PSR-2/PSR-12 formatting
- Missing `@api` where required
- Incorrect docblock formats
- Unused imports
- Type hints violations

---

## 4. Choosing the Right Test Type — Exam Decision Matrix

> This is the most tested aspect of the testing topic. Multiple answers will look valid, but one is architecturally correct.

```
SCENARIO                                              | CORRECT TEST TYPE
------------------------------------------------------|------------------
Testing a single method's logic with all              |
dependencies mocked                                   | Unit
                                                      |
Testing that your plugin correctly modifies           |
the return value of a core method                     | Unit (mock the subject)
                                                      |
Testing that your DI configuration wires              |
interfaces to the right implementations               | Integration
                                                      |
Testing a repository that queries the DB              | Integration
                                                      |
Testing that a REST endpoint returns correct          |
JSON for a given request                              | API Functional
                                                      |
Testing that a customer can complete checkout         |
in a browser                                          | MFTF
                                                      |
Testing that your code follows MEQP standards         | Static
                                                      |
Testing that an observer fires and modifies           |
an order correctly (real event dispatch)              | Integration
                                                      |
Testing a price calculation algorithm                 | Unit
(pure business logic, no external deps)               |
                                                      |
Testing that a cron job processes queue items         | Integration
(needs real scheduler + DB)                           |
```

**The critical distinction — Unit vs Integration:**

```
Use UNIT when:                          Use INTEGRATION when:
- Testing a single class                - Testing DI wiring
- All deps can be mocked                - Testing DB interactions
- No DB/filesystem/network              - Testing event dispatching
- Fast feedback needed                  - Testing plugin chains
- Logic is pure/algorithmic             - Testing real repository behavior
```

- **Exam focus:** A common exam trap: "Test that your custom plugin to `ProductRepository::getById()` returns the correct modified value." The answer is **unit test** — mock the subject, test your plugin class in isolation. You don't need integration unless you're testing the DI wiring that connects the plugin.
- **Exam focus:** "Test that `@magentoDataFixture` loads correctly and your observer modifies the saved order" → **Integration test**, because you need the real event dispatch system and real DB.

---

## 5. Architectural Reasoning Guide

This section addresses the exam's scenario-based questions where **multiple answers are technically valid but one is architecturally superior**.

### Decision: Plugin vs Preference

```
QUESTION: How do you modify the behavior of ProductRepository::getById()?

Option A: preference (replace entire class)
Option B: around plugin on ProductRepository

ANSWER: Option B (plugin)

WHY:
- Preference breaks other plugins targeting the same class
- Preference means you own upgrade burden for the entire class
- Plugin composes cleanly with other extensions
- Plugin is specifically designed for this use case
```

### Decision: Observer vs Plugin

```
QUESTION: When a product is saved, you need to send a notification email.

Option A: Plugin on ProductRepository::save()
Option B: Observer on catalog_product_save_after event

ANSWER: Option B (observer)

WHY:
- Email sending is a side effect — decoupled from the save operation
- Observer is the correct architectural pattern for side effects
- Plugin would add latency to the save operation
- If email fails, it shouldn't roll back the save (with observer it won't)
```

### Decision: Unit vs Integration Test

```
QUESTION: Verify that your custom module's di.xml correctly binds
          CustomProductRepository to ProductRepositoryInterface.

Option A: Unit test with mocks
Option B: Integration test

ANSWER: Option B (integration)

WHY:
- DI wiring cannot be tested without a real DI container
- Unit tests manually construct classes — DI config is irrelevant
- Integration tests use Bootstrap::getObjectManager() which reads di.xml
```

### Decision: When ObjectManager is Acceptable

```
QUESTION: A factory class uses ObjectManager::create() internally.
          Is this a violation?

Option A: Yes — ObjectManager should never be used directly
Option B: No — factories are an accepted context for ObjectManager use

ANSWER: Option B (not a violation)

WHY:
- Generated factory classes use ObjectManager::create() by design
- This is necessary to support virtual types in di.xml
- The acceptable contexts are: factories, tests, CLI bootstrap, setup scripts
```

### Decision: Where to Put Business Logic

```
QUESTION: A template needs to show a custom price based on complex rules.
          Where does the logic go?

Option A: Directly in the .phtml template
Option B: In the Block class
Option C: In a ViewModel implementing ArgumentInterface

ANSWER: Option C (ViewModel)

WHY:
- Templates must only present data — never compute it
- Block classes are becoming legacy pattern for new logic
- ViewModel is the modern (2.2+) pattern: testable, focused, injectable
- Block classes have complex inheritance chains; ViewModels are simple
```

---

## Quick-Reference Checklist

### SOLID in Adobe Commerce

- [ ] **SRP**: One class = one reason to change. Extract business logic from models into Service classes.
- [ ] **OCP**: Use **plugins over preferences** for extension. Preference = last resort (interface substitution only).
- [ ] **OCP**: Plugin type hierarchy: `before` → `around` → `after`. Avoid `around` unless you need to halt execution.
- [ ] **LSP**: Implementations must honor the full interface contract — same exception types, same return types.
- [ ] **LSP**: `Api/` interfaces with `@api` are the enforcement mechanism for LSP across modules.
- [ ] **ISP**: Use granular interfaces. Extension attributes are the ISP-compliant way to add data to existing interfaces.
- [ ] **DIP**: Inject **interfaces**, not concrete classes. di.xml binds the interface to the implementation.
- [ ] **DIP**: Direct `new ClassName()` in business code = DIP violation.

### MEQP & Code Standards

- [ ] Command: `./vendor/bin/phpcs --standard=Magento2 app/code/Vendor/Module/`
- [ ] Command via CLI: `bin/magento dev:tests:run static`
- [ ] `@api` = stable across minor releases. Without `@api` = may change in minor releases.
- [ ] All `Api/` and `Api/Data/` interfaces MUST have `@api`.
- [ ] **Forbidden**: `$_POST`, `$_GET`, `$_SERVER` — use `RequestInterface`.
- [ ] **Forbidden**: Raw SQL in models — use Query Builder / collections / repositories.
- [ ] **Forbidden**: Business logic in templates — use ViewModel implementing `ArgumentInterface`.
- [ ] **Forbidden**: Session in models — pass identity explicitly; models must be context-agnostic.
- [ ] **ObjectManager acceptable** in: factories, unit/integration tests, CLI bootstrap, setup scripts.
- [ ] **ObjectManager forbidden** in: controllers, services, plugins, observers, templates.

### Testing — Unit Tests

- [ ] Extends `\PHPUnit\Framework\TestCase`
- [ ] No DI container — construct class manually
- [ ] No database — all deps are `MockObject`
- [ ] `createMock()` = full mock; `getMockBuilder()->onlyMethods()->getMock()` = partial mock
- [ ] Lives in `dev/tests/unit/`
- [ ] Use for: isolated logic, pure algorithms, single class behavior

### Testing — Integration Tests

- [ ] Uses real DI container via `Bootstrap::getObjectManager()`
- [ ] Uses real DB (`magento_integration_tests`)
- [ ] `@magentoDataFixture` — loads PHP fixture file, auto-rolled-back
- [ ] `@magentoDbIsolation enabled` (default) — transactional rollback
- [ ] `@magentoDbIsolation disabled` — needed when SUT commits its own transactions
- [ ] `@magentoAppIsolation enabled` — resets global app state between tests
- [ ] `@magentoConfigFixture` — sets config value for test duration
- [ ] Lives in `dev/tests/integration/`
- [ ] Use for: DI wiring, DB interactions, event dispatch, plugin chains

### Testing — MFTF

- [ ] XML-based, browser-driven (Selenium)
- [ ] **ActionGroup** = reusable UI steps (like a function)
- [ ] **Test** = single test scenario using ActionGroups
- [ ] **Suite** = group of tests with shared before/after setup
- [ ] Command: `vendor/bin/mftf run:test TestName`
- [ ] Command: `vendor/bin/mftf run:suite SuiteName`
- [ ] Lives in `Vendor/Module/Test/Mftf/`

### Testing — API Functional

- [ ] Extends `\Magento\TestFramework\TestCase\WebapiAbstract`
- [ ] Tests REST and SOAP from one test definition
- [ ] Uses `$this->_webApiCall($serviceInfo, $params)`
- [ ] Lives in `dev/tests/api-functional/`

### Testing — Static

- [ ] Command: `bin/magento dev:tests:run static`
- [ ] Catches MEQP violations, code style, deprecated patterns
- [ ] No code execution needed — fast

### Exam Scenario Decision Rules

- [ ] **Plugin vs Preference?** → Plugin (unless substituting entire interface implementation)
- [ ] **Observer vs Plugin for side effects?** → Observer
- [ ] **Unit vs Integration for DI wiring?** → Integration
- [ ] **Unit vs Integration for pure logic?** → Unit
- [ ] **Business logic in template?** → Never. Use ViewModel.
- [ ] **ObjectManager in factory?** → Acceptable (not a violation)
- [ ] **ObjectManager in controller?** → Violation — use constructor injection
- [ ] **@api without annotation?** → Can change in minor release — never depend on it in extensions
