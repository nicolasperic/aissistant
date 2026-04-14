# Day 14 — Integration Tests + Week 2 Review

## Table of Contents
- [1. Overview: The Three Test Types](#1-overview-the-three-test-types)
- [2. Integration Test Infrastructure](#2-integration-test-infrastructure)
  - [2.1 Directory Structure](#21-directory-structure)
  - [2.2 Test Bootstrap](#22-test-bootstrap)
  - [2.3 phpunit.xml Configuration](#23-phpunitxml-configuration)
- [3. Writing Integration Tests](#3-writing-integration-tests)
  - [3.1 Basic Test Class Structure](#31-basic-test-class-structure)
  - [3.2 ObjectManager in Integration Tests](#32-objectmanager-in-integration-tests)
- [4. Fixture Annotations](#4-fixture-annotations)
  - [4.1 @magentoDataFixture](#41-magentodatafixture)
  - [4.2 Fixture Files vs Closure Fixtures](#42-fixture-files-vs-closure-fixtures)
  - [4.3 Fixture Rollback Files](#43-fixture-rollback-files)
- [5. Isolation Annotations](#5-isolation-annotations)
  - [5.1 @magentoAppIsolation](#51-magentoappsolation)
  - [5.2 @magentoDbIsolation](#52-magentodbsolation)
  - [5.3 Isolation Interaction Matrix](#53-isolation-interaction-matrix)
- [6. @magentoConfigFixture](#6-magentoconfigfixture)
- [7. Running Integration Tests](#7-running-integration-tests)
  - [7.1 Command-Line Execution](#71-command-line-execution)
  - [7.2 Running a Subset of Tests](#72-running-a-subset-of-tests)
  - [7.3 Test Database Setup](#73-test-database-setup)
- [8. Annotation Quick-Reference Table](#8-annotation-quick-reference-table)
- [9. Unit vs Integration vs MFTF — Full Comparison](#9-unit-vs-integration-vs-mftf--full-comparison)
- [10. Week 2 Review — Customization Areas](#10-week-2-review--customization-areas)
  - [10.1 Plugins (Interceptors)](#101-plugins-interceptors)
  - [10.2 Events & Observers](#102-events--observers)
  - [10.3 Preferences & Virtual Types](#103-preferences--virtual-types)
  - [10.4 UI Components & Layout XML](#104-ui-components--layout-xml)
  - [10.5 Service Contracts & Repositories](#105-service-contracts--repositories)
  - [10.6 EAV & Custom Attributes](#106-eav--custom-attributes)
  - [10.7 ACL & System Config](#107-acl--system-config)
- [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Overview: The Three Test Types

Magento 2's testing pyramid has three distinct layers. Understanding their boundaries is as important as knowing how to write each one.

```
        +------------------+
        |      MFTF        |  <-- Browser / Selenium / Acceptance
        +------------------+
       /                    \
      /   Integration Tests  \  <-- Full Magento bootstrap + real DB
     /                        \
    /       Unit Tests          \  <-- Pure PHP, no framework, mocks only
   +----------------------------+
```

| Layer | Bootstrap | Database | Browser | Speed |
|---|---|---|---|---|
| **Unit** | None (PHPUnit only) | No | No | Very fast (~ms) |
| **Integration** | Full Magento | Yes (test DB) | No | Slow (~seconds) |
| **MFTF** | Full application + web server | Yes | Yes (WebDriver) | Very slow (~minutes) |

- **Exam focus:** The key differentiator for integration tests is that they load the **full Magento object graph** (DI, plugins, preferences) and operate against a **real isolated database**. Unit tests use mocks and never touch the framework.

---

## 2. Integration Test Infrastructure

### 2.1 Directory Structure

```
dev/
  tests/
    integration/
      phpunit.xml                      <-- Main PHPUnit config (do NOT edit; copy)
      phpunit.xml.dist                 <-- Distribution template
      etc/
        install-config-mysql.php       <-- Test DB credentials
        config-global.php              <-- Optional global config overrides
      framework/                       <-- Bootstrap classes, helpers
        bootstrap.php                  <-- Entry point loaded by phpunit.xml
        Magento/
          TestFramework/
            Bootstrap.php
            Helper/
              Core.php                 <-- App state, area, store management
            Fixture/                   <-- Fixture manager internals
      testsuite/                       <-- Magento's own integration tests
        Magento/
          Catalog/
          Customer/
          ...
```

Custom module integration tests live inside your **module** and are referenced in `phpunit.xml`:

```
app/
  code/
    Vendor/
      Module/
        Test/
          Integration/
            Model/
              MyModelTest.php
            _files/
              my_fixture.php
              my_fixture_rollback.php
```

- **Exam focus:** Test fixture **files** (the `_files/` directory) must be referenced by a **path relative to the test class file** when using `@magentoDataFixture` with a file path, OR by a `Vendor/Module/path` notation for shared fixtures.

### 2.2 Test Bootstrap

`dev/tests/integration/framework/bootstrap.php` performs:

1. Installs/re-uses the **integration test database** (separate from your production DB)
2. Loads Magento's DI configuration
3. Initialises the `ObjectManager`
4. Registers the fixture manager and annotation handlers

The bootstrap file is pointed to by `phpunit.xml`:

```xml
<phpunit bootstrap="framework/bootstrap.php" ...>
```

- **Exam focus:** You must **never** call `Magento\Framework\App\Bootstrap::create()` yourself inside an integration test. The test framework already bootstraps the application; you retrieve objects via `ObjectManager::getInstance()`.

### 2.3 phpunit.xml Configuration

```xml
<!-- dev/tests/integration/phpunit.xml (simplified) -->
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="..."
         bootstrap="framework/bootstrap.php"
         colors="true">

    <testsuites>
        <testsuite name="Magento Integration Tests">
            <directory suffix="Test.php">testsuite</directory>
            <!-- Add your module's test directory here -->
            <directory suffix="Test.php">
                ../../../app/code/Vendor/Module/Test/Integration
            </directory>
        </testsuite>
    </testsuites>

    <php>
        <ini name="date.timezone" value="America/Los_Angeles"/>
        <const name="TESTS_INSTALL_CONFIG_FILE"
               value="etc/install-config-mysql.php"/>
        <const name="TESTS_GLOBAL_CONFIG_FILE"
               value="etc/config-global.php"/>
        <const name="TESTS_CLEANUP"
               value="disabled"/>
    </php>

</phpunit>
```

---

## 3. Writing Integration Tests

### 3.1 Basic Test Class Structure

```php
<?php
declare(strict_types=1);

namespace Vendor\Module\Test\Integration\Model;

use Magento\TestFramework\Helper\Bootstrap;
use PHPUnit\Framework\TestCase;
use Vendor\Module\Model\MyModel;

/**
 * Integration test: full DI + real DB available
 */
class MyModelTest extends TestCase
{
    /** @var \Magento\Framework\ObjectManagerInterface */
    private $objectManager;

    /** @var MyModel */
    private $model;

    protected function setUp(): void
    {
        $this->objectManager = Bootstrap::getObjectManager();
        $this->model = $this->objectManager->get(MyModel::class);
    }

    /**
     * @magentoDataFixture Vendor_Module::Test/Integration/_files/my_product.php
     */
    public function testSomethingWithProduct(): void
    {
        $result = $this->model->doSomething(1);
        self::assertEquals('expected', $result);
    }
}
```

- **Exam focus:** `Bootstrap::getObjectManager()` is the **correct** pattern — it returns the same singleton `ObjectManager` that the test framework bootstrapped. Using `\Magento\Framework\App\ObjectManager::getInstance()` also works and returns the same instance, but `Bootstrap::getObjectManager()` is the idiomatic integration-test form.

### 3.2 ObjectManager in Integration Tests

```php
// Preferred in integration tests
$objectManager = \Magento\TestFramework\Helper\Bootstrap::getObjectManager();

// Also valid (same instance)
$objectManager = \Magento\Framework\App\ObjectManager::getInstance();

// Create a NEW instance (respects preferences + virtual types)
$model = $objectManager->create(\Vendor\Module\Model\MyModel::class, [
    'param' => 'value',
]);

// Get a SHARED instance (singleton scope)
$registry = $objectManager->get(\Magento\Framework\Registry::class);
```

| Method | Scope | Use Case |
|---|---|---|
| `get()` | Shared singleton | Services, repositories, helpers |
| `create()` | New instance per call | Models, data objects, collections |

- **Exam focus:** In **unit tests**, you should **never** use `ObjectManager` — inject all dependencies via the constructor and mock them. Using `ObjectManager` in a unit test is an anti-pattern and a common exam trap.

---

## 4. Fixture Annotations

Fixtures create database state **before** your test runs and clean it up **after**.

### 4.1 @magentoDataFixture

`@magentoDataFixture` can reference either a **file path** or a **static method (closure fixture)**.

**Syntax options:**

```php
// 1. File path — module-relative notation (preferred for reusable fixtures)
/** @magentoDataFixture Magento/Catalog/_files/product_simple.php */

// 2. File path — relative to the test file (for local fixtures)
/** @magentoDataFixture ../../../_files/my_fixture.php */

// 3. Static method (closure fixture)
/** @magentoDataFixture Vendor\Module\Test\Integration\Model\MyModelTest::createProduct */
```

**Placement:**

```php
// On the CLASS  → runs before every test method in the class
/**
 * @magentoDataFixture Magento/Customer/_files/customer.php
 */
class MyTest extends TestCase { ... }

// On a METHOD   → runs only before that specific test
/**
 * @magentoDataFixture Magento/Catalog/_files/product_simple.php
 */
public function testSpecificScenario(): void { ... }
```

- **Exam focus:** A `@magentoDataFixture` annotation on a **method overrides** the class-level annotation — both do NOT stack automatically for the same fixture key. However you **can** have multiple `@magentoDataFixture` lines on one docblock and all will run.

```php
/**
 * @magentoDataFixture Magento/Customer/_files/customer.php
 * @magentoDataFixture Magento/Catalog/_files/product_simple.php
 */
public function testMultipleFixtures(): void { ... }
```

### 4.2 Fixture Files vs Closure Fixtures

**Fixture File** — a plain PHP script executed in the global scope of the Magento test environment:

```php
<?php
// app/code/Vendor/Module/Test/Integration/_files/simple_product.php

use Magento\Catalog\Api\Data\ProductInterfaceFactory;
use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\TestFramework\Helper\Bootstrap;

$objectManager = Bootstrap::getObjectManager();

/** @var ProductInterfaceFactory $productFactory */
$productFactory = $objectManager->get(ProductInterfaceFactory::class);

/** @var ProductRepositoryInterface $productRepository */
$productRepository = $objectManager->get(ProductRepositoryInterface::class);

$product = $productFactory->create();
$product->setTypeId(\Magento\Catalog\Model\Product\Type::TYPE_SIMPLE)
    ->setAttributeSetId(4)
    ->setName('Simple Product Fixture')
    ->setSku('simple-fixture-sku')
    ->setPrice(10.00)
    ->setStockData(['use_config_manage_stock' => 1, 'qty' => 100, 'is_in_stock' => 1])
    ->setVisibility(\Magento\Catalog\Model\Product\Visibility::VISIBILITY_BOTH)
    ->setStatus(\Magento\Catalog\Model\Product\Attribute\Source\Status::STATUS_ENABLED)
    ->setWebsiteIds([1]);

$productRepository->save($product);
```

**Closure (Static Method) Fixture** — defined inside the test class itself, useful for one-off scenarios:

```php
<?php

class MyModelTest extends TestCase
{
    /**
     * @magentoDataFixture createSimpleProduct
     */
    public function testWithClosureFixture(): void
    {
        // test body
    }

    /**
     * Closure fixture — must be public static
     */
    public static function createSimpleProduct(): void
    {
        $objectManager = Bootstrap::getObjectManager();
        $factory = $objectManager->get(\Magento\Catalog\Api\Data\ProductInterfaceFactory::class);
        // ... create and save product
    }
}
```

- **Exam focus:** Closure fixtures must be **`public static`** methods. They cannot be closures (anonymous functions) — the annotation value is a **method name string**, not a callable.

### 4.3 Fixture Rollback Files

When `@magentoDbIsolation` is **disabled**, Magento will NOT automatically roll back fixture changes via a transaction. You must provide a **rollback file**:

```
_files/
  simple_product.php           <-- creates the fixture data
  simple_product_rollback.php  <-- deletes it
```

The rollback file is named `{fixture_name}_rollback.php` and is auto-detected:

```php
<?php
// simple_product_rollback.php

use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\TestFramework\Helper\Bootstrap;
use Magento\Framework\Registry;

$objectManager = Bootstrap::getObjectManager();

/** @var Registry $registry */
$registry = $objectManager->get(Registry::class);
$registry->unregister('isSecureArea');
$registry->register('isSecureArea', true);

/** @var ProductRepositoryInterface $productRepository */
$productRepository = $objectManager->get(ProductRepositoryInterface::class);

try {
    $productRepository->deleteById('simple-fixture-sku');
} catch (\Magento\Framework\Exception\NoSuchEntityException $e) {
    // Already deleted; ignore
}

$registry->unregister('isSecureArea');
$registry->register('isSecureArea', false);
```

- **Exam focus:** The `isSecureArea` registry flag must be set to `true` before deleting catalog entities (products, categories) in rollback files — otherwise an `AuthorizationException` is thrown. This is a very common exam gotcha.

---

## 5. Isolation Annotations

### 5.1 @magentoAppIsolation

Controls whether the **Magento application state** (object manager, DI config, area, store context) is reset between tests.

```php
/**
 * @magentoAppIsolation enabled
 */
public function testThatNeedsCleanAppState(): void { ... }

/**
 * @magentoAppIsolation disabled
 */
public function testThatSharesStateWithNextTest(): void { ... }
```

**Default behaviour:**

| Scope | Default |
|---|---|
| Class docblock | `enabled` |
| Method docblock | `disabled` |

This means: by default the app state is reset **between test classes** but **not between methods** within the same class.

**When you need `@magentoAppIsolation enabled` on a method:**
- Your test changes the current **store**, **area code**, or **locale** and you don't want that change polluting subsequent tests in the same class.
- Your test modifies DI preferences at runtime (rare, but possible).

```php
/**
 * Test switches to adminhtml area — reset app state after
 * @magentoAppIsolation enabled
 */
public function testAdminAreaLogic(): void
{
    $this->objectManager->get(\Magento\Framework\App\State::class)
        ->setAreaCode(\Magento\Framework\App\Area::AREA_ADMINHTML);
    // test body
}
```

- **Exam focus:** `@magentoAppIsolation enabled` on a method **reinitialises the object manager** after the test. This is expensive — only enable it when genuinely needed.

### 5.2 @magentoDbIsolation

Controls whether database changes made by a test (and its fixtures) are wrapped in a **database transaction and rolled back** after the test.

```php
/**
 * @magentoDbIsolation enabled   <-- wrap in transaction; rollback after (DEFAULT)
 */
public function testWithAutoRollback(): void { ... }

/**
 * @magentoDbIsolation disabled  <-- no transaction; changes persist
 */
public function testThatNeedsCommittedData(): void { ... }
```

**Default:** `enabled` — all tests run in a transaction by default.

**When you must use `@magentoDbIsolation disabled`:**
- Your test exercises code that **commits its own transaction** (e.g., testing a `PlaceOrder` service that wraps everything in a transaction internally — MySQL does not support nested transactions with rollback semantics in all storage engines).
- Your test needs to verify data **across multiple requests/sessions** (e.g., indexer queue or async operations).
- Your test uses a fixture that calls `DDL` statements (DDL causes implicit commit in MySQL).

```php
/**
 * Fixture creates data via a service that internally commits
 * @magentoDataFixture Vendor_Module::Test/Integration/_files/order.php
 * @magentoDbIsolation disabled
 */
public function testOrderTotals(): void
{
    // When disabled, you MUST provide rollback files for your fixtures
}
```

- **Exam focus:** When `@magentoDbIsolation disabled` is set, rollback files (`_rollback.php`) **must** be provided — otherwise fixture data accumulates in the test database across runs, causing test pollution.

### 5.3 Isolation Interaction Matrix

```
                         @magentoDbIsolation
                   enabled (default)   disabled
                  +-------------------+---------------------+
@magentoApp  en  | Full isolation.    | App reset only.     |
Isolation    ab  | Transaction wrap.  | Manual DB cleanup   |
(enabled)    le  | Safest option.     | required.           |
                  +-------------------+---------------------+
             dis | No app reset.      | No isolation.       |
             abl | Transaction wrap.  | Most dangerous —    |
             ed  | Good for speed.    | causes test bleed.  |
                  +-------------------+---------------------+
```

**Recommended defaults:**
- Leave both at defaults (DB isolation on, App isolation per-class) for standard tests.
- Disable DB isolation only when you genuinely cannot avoid committed transactions.
- Enable App isolation on a method only when you mutate global app state.

---

## 6. @magentoConfigFixture

Overrides **system configuration values** (core_config_data) for the duration of a test **without writing to the database**. The override is in-memory only.

**Syntax:**

```
@magentoConfigFixture <scope_code> <config_path> <value>
```

```php
/**
 * Override global (default scope) config:
 * @magentoConfigFixture default/catalog/frontend/list_mode grid
 *
 * Override for the current store view (use 'current_store' keyword):
 * @magentoConfigFixture current_store payment/free/active 1
 *
 * Override for a specific store view by code:
 * @magentoConfigFixture default_store general/locale/code en_US
 *
 * Override for website scope:
 * @magentoConfigFixture default/web/secure/use_in_frontend 1
 */
public function testPaymentConfig(): void
{
    $config = $this->objectManager->get(\Magento\Framework\App\Config\ScopeConfigInterface::class);
    $isActive = $config->isSetFlag('payment/free/active', \Magento\Store\Model\ScopeInterface::SCOPE_STORE);
    self::assertTrue($isActive);
}
```

**Scope keywords:**

| Keyword in annotation | Meaning |
|---|---|
| `default` | Global default scope |
| `current_store` | Whatever store is currently active in test |
| `{store_code}` | Specific store view by code |
| `default/` prefix on path | Default scope config |

- **Exam focus:** `current_store` is a **magic keyword** — it does not refer to a store code named "current_store". It resolves to whichever store view is active at test time. This is by far the most commonly tested `@magentoConfigFixture` syntax.
- **Exam focus:** `@magentoConfigFixture` changes are **NOT database writes** — they are in-memory overrides via the config cache layer. You do NOT need a rollback or DB isolation for config fixtures alone.

---

## 7. Running Integration Tests

### 7.1 Command-Line Execution

```bash
# Run ALL integration tests
php -f vendor/bin/phpunit -- -c dev/tests/integration/phpunit.xml

# Or using the shorter form (from Magento root)
./vendor/bin/phpunit -c dev/tests/integration/phpunit.xml

# Verbose output
./vendor/bin/phpunit -c dev/tests/integration/phpunit.xml --verbose
```

- **Exam focus:** The `-c` flag specifies the **configuration file path**. The canonical path is `dev/tests/integration/phpunit.xml`. Commands in exam questions will always reference this path.

### 7.2 Running a Subset of Tests

```bash
# Run a single test file
./vendor/bin/phpunit -c dev/tests/integration/phpunit.xml \
    app/code/Vendor/Module/Test/Integration/Model/MyModelTest.php

# Run a single test method
./vendor/bin/phpunit -c dev/tests/integration/phpunit.xml \
    --filter testSpecificMethod \
    app/code/Vendor/Module/Test/Integration/Model/MyModelTest.php

# Run tests matching a pattern
./vendor/bin/phpunit -c dev/tests/integration/phpunit.xml \
    --filter "testProduct.*"

# Run a specific test suite defined in phpunit.xml
./vendor/bin/phpunit -c dev/tests/integration/phpunit.xml \
    --testsuite "Magento Integration Tests"
```

### 7.3 Test Database Setup

The integration test database is **separate** from your main Magento database. Configuration lives in:

```php
<?php
// dev/tests/integration/etc/install-config-mysql.php
return [
    'db-host'           => 'localhost',
    'db-user'           => 'root',
    'db-password'       => '',
    'db-name'           => 'magento_integration_tests',   // separate DB!
    'db-prefix'         => '',
    'backend-frontname' => 'backend',
    'admin-user'        => \Magento\TestFramework\Bootstrap::ADMIN_NAME,
    'admin-password'    => \Magento\TestFramework\Bootstrap::ADMIN_PASSWORD,
    'admin-email'       => 'admin@example.com',
    'admin-firstname'   => 'Admin',
    'admin-lastname'    => 'User',
];
```

- **Exam focus:** The test framework will **install Magento into the test database** on first run if `TESTS_CLEANUP` is set to `enabled` or if the DB is empty. This is why the first run is very slow.

---

## 8. Annotation Quick-Reference Table

| Annotation | Purpose | Default | Scope |
|---|---|---|---|
| `@magentoDataFixture` | Load DB fixture file or call static method | n/a | Class or Method |
| `@magentoDbIsolation enabled` | Wrap test in DB transaction; auto-rollback | **enabled** | Class or Method |
| `@magentoDbIsolation disabled` | No transaction; changes persist | — | Class or Method |
| `@magentoAppIsolation enabled` | Reset ObjectManager/app state after test | enabled per class | Class or Method |
| `@magentoAppIsolation disabled` | Keep app state between tests | disabled per method | Method |
| `@magentoConfigFixture` | Override config value in-memory | n/a | Class or Method |
| `@magentoCache` | Enable/disable specific cache types | n/a | Class or Method |
| `@magentoDataFixtureBeforeTransaction` | Run fixture before transaction starts | n/a | Class or Method |

---

## 9. Unit vs Integration vs MFTF — Full Comparison

```
+-----------------------+------------------+------------------+-------------------+
| Characteristic        | Unit Test        | Integration Test | MFTF              |
+-----------------------+------------------+------------------+-------------------+
| Framework loaded?     | No               | Yes (full)       | Yes (full + HTTP) |
| Database used?        | No               | Yes (test DB)    | Yes (app DB)      |
| Browser required?     | No               | No               | Yes (Selenium)    |
| Plugins applied?      | No (mocked)      | Yes              | Yes               |
| DI Container active?  | No               | Yes              | Yes               |
| Test speed            | ms               | seconds          | minutes           |
| Bootstrap             | PHPUnit only     | bootstrap.php    | Web server        |
| Fixture mechanism     | setUp() mocks    | @magentoData     | actionGroup XML   |
|                       |                  | Fixture          |                   |
| Config override       | inject mock      | @magentoConfig   | .credentials.xml  |
|                       |                  | Fixture          |                   |
| Location              | Test/Unit/       | Test/Integration | Test/Mftf/        |
| Base class            | TestCase         | TestCase         | Cest/Test XML     |
| ObjectManager usage   | NEVER            | Bootstrap::get   | n/a               |
|                       |                  | ObjectManager()  |                   |
+-----------------------+------------------+------------------+-------------------+
```

**Detailed differentiation:**

### Unit Tests
```php
<?php
// Unit test — no bootstrap, all dependencies mocked
namespace Vendor\Module\Test\Unit\Model;

use PHPUnit\Framework\TestCase;
use Vendor\Module\Model\MyModel;

class MyModelTest extends TestCase
{
    public function testCalculate(): void
    {
        // Mock dependency — no real objects
        $dependency = $this->createMock(\Vendor\Module\Api\SomeDependencyInterface::class);
        $dependency->method('getValue')->willReturn(42);

        $model = new MyModel($dependency);   // Direct instantiation
        self::assertEquals(84, $model->calculate());
    }
}
```

### Integration Tests
```php
<?php
// Integration test — full framework, real DB
/**
 * @magentoDataFixture Magento/Customer/_files/customer.php
 * @magentoDbIsolation enabled
 */
public function testCustomerLoad(): void
{
    $objectManager = Bootstrap::getObjectManager();
    $repository = $objectManager->get(\Magento\Customer\Api\CustomerRepositoryInterface::class);
    $customer = $repository->getById(1);
    self::assertEquals('customer@example.com', $customer->getEmail());
}
```

### MFTF (Magento Functional Testing Framework)
```xml
<!-- MFTF — browser-driven acceptance test in XML -->
<test name="AdminCreateSimpleProductTest">
    <annotations>
        <features value="Catalog"/>
        <title value="Admin creates a simple product"/>
    </annotations>

    <actionGroup ref="AdminLoginActionGroup" stepKey="loginAsAdmin"/>
    <actionGroup ref="AdminOpenProductIndexPageActionGroup" stepKey="goToProductList"/>
    <actionGroup ref="GoToCreateProductPageActionGroup" stepKey="goToCreateProductPage">
        <argument name="productType" value="simple"/>
    </actionGroup>
    <fillField selector="{{AdminProductFormSection.productName}}"
               userInput="Test Product" stepKey="fillProductName"/>
    <actionGroup ref="SaveProductFormActionGroup" stepKey="saveProduct"/>
    <see userInput="You saved the product." stepKey="seeSuccessMessage"/>
</test>
```

- **Exam focus:** MFTF tests live in `Test/Mftf/Test/`, use XML format, and require a **running web server and browser driver** (Selenium/ChromeDriver). They test end-to-end user flows, not business logic.

---

## 10. Week 2 Review — Customization Areas

Use this section to consolidate your understanding of all Week 2 customization topics.

### 10.1 Plugins (Interceptors)

```php
// di.xml
<type name="Magento\Catalog\Model\Product">
    <plugin name="vendor_module_product_plugin"
            type="Vendor\Module\Plugin\ProductPlugin"
            sortOrder="10"
            disabled="false"/>
</type>
```

```php
// Plugin class
class ProductPlugin
{
    // Before: can modify arguments
    public function beforeSetName(\Magento\Catalog\Model\Product $subject, $name): array
    {
        return [trim($name)];
    }

    // After: can modify return value; receives $result as 2nd param
    public function afterGetName(\Magento\Catalog\Model\Product $subject, $result): string
    {
        return strtoupper($result);
    }

    // Around: full control; MUST call $proceed
    public function aroundSave(
        \Magento\Catalog\Model\Product $subject,
        callable $proceed
    ) {
        // before logic
        $result = $proceed();  // <-- MUST call this
        // after logic
        return $result;
    }
}
```

**Key rules:**
- `before` returns an **array** of modified arguments (or `null` to leave unchanged)
- `after` receives `$subject` + `$result` (+ original args in PHP 8+ style)
- `around` **must** call `$proceed()` or the original method is skipped entirely
- Plugins cannot be applied to: `final` methods, `final` classes, `static` methods, `__construct`

- **Exam focus:** The most tested plugin gotcha — `before` plugin must return **an array** (even for a single argument), not the argument directly.

### 10.2 Events & Observers

```xml
<!-- events.xml -->
<event name="catalog_product_save_after">
    <observer name="vendor_module_product_save"
              instance="Vendor\Module\Observer\ProductSaveObserver"/>
</event>
```

```php
// Observer
class ProductSaveObserver implements \Magento\Framework\Event\ObserverInterface
{
    public function execute(\Magento\Framework\Event\Observer $observer): void
    {
        /** @var \Magento\Catalog\Model\Product $product */
        $product = $observer->getEvent()->getProduct();
        // business logic
    }
}
```

**Events vs Plugins:**

| | Events | Plugins |
|---|---|---|
| Can modify input? | No (data passed by reference only via `setData`) | Yes (before/around) |
| Can modify output? | No | Yes (after/around) |
| Multiple listeners? | Yes, all run | Yes, sorted by sortOrder |
| Target | Any dispatched event | Specific public method |

### 10.3 Preferences & Virtual Types

```xml
<!-- di.xml — Preference: replace interface implementation -->
<preference for="Vendor\Module\Api\MyInterface"
            type="Vendor\Module\Model\MyImplementation"/>

<!-- Virtual type: create a named instance with different constructor args -->
<virtualType name="Vendor\Module\Model\SpecialLogger"
             type="Magento\Framework\Logger\Monolog">
    <arguments>
        <argument name="name" xsi:type="string">special</argument>
    </arguments>
</virtualType>
```

- **Exam focus:** Preferences replace the **entire class** — only one preference per interface is active. Plugins can stack. When you want to **partially** override behaviour, use a plugin; when you want to **fully replace** an implementation, use a preference.

### 10.4 UI Components & Layout XML

```xml
<!-- Layout handle: catalog_product_view.xml -->
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceBlock name="product.info.details">
            <block class="Vendor\Module\Block\MyBlock"
                   name="vendor.module.myblock"
                   template="Vendor_Module::mytemplate.phtml"
                   after="product.info.overview"/>
        </referenceBlock>
    </body>
</page>
```

**Layout instruction priority:**
1. `<remove>` — highest priority, removes a block completely
2. `<referenceBlock>` — modifies existing block
3. `<block>` — adds new block
4. `<move>` — repositions existing block

### 10.5 Service Contracts & Repositories

```php
// Repository interface pattern
interface ProductRepositoryInterface
{
    public function save(ProductInterface $product): ProductInterface;
    public function get(string $sku, bool $editMode = false, ?int $storeId = null): ProductInterface;
    public function getById(int $productId, bool $editMode = false, ?int $storeId = null): ProductInterface;
    public function delete(ProductInterface $product): bool;
    public function deleteById(string $sku): bool;
    public function getList(SearchCriteriaInterface $searchCriteria): ProductSearchResultsInterface;
}
```

```php
// SearchCriteria usage
$searchCriteriaBuilder = $objectManager->get(\Magento\Framework\Api\SearchCriteriaBuilder::class);
$filterBuilder = $objectManager->get(\Magento\Framework\Api\FilterBuilder::class);

$filter = $filterBuilder
    ->setField('status')
    ->setValue(\Magento\Catalog\Model\Product\Attribute\Source\Status::STATUS_ENABLED)
    ->setConditionType('eq')
    ->create();

$searchCriteria = $searchCriteriaBuilder
    ->addFilter($filter)
    ->setPageSize(10)
    ->setCurrentPage(1)
    ->create();

$results = $productRepository->getList($searchCriteria);
```

### 10.6 EAV & Custom Attributes

**Attribute types:**

| `frontend_input` | `backend_type` | Use case |
|---|---|---|
| `text` | `varchar` | Short strings |
| `textarea` | `text` | Long strings |
| `boolean` | `int` | Yes/No |
| `select` | `int` | Single option (stores option_id) |
| `multiselect` | `text` | Multiple options |
| `date` | `datetime` | Date picker |
| `price` | `decimal` | Price fields |

```php
// InstallData / Patch: adding an attribute
$eavSetup->addAttribute(
    \Magento\Catalog\Model\Product::ENTITY,
    'vendor_custom_attr',
    [
        'type'                    => 'varchar',
        'label'                   => 'Custom Attribute',
        'input'                   => 'text',
        'required'                => false,
        'user_defined'            => true,
        'searchable'              => true,
        'filterable'              => false,
        'comparable'              => false,
        'visible_on_front'        => true,
        'used_in_product_listing' => true,
        'unique'                  => false,
        'apply_to'                => '',
    ]
);
```

### 10.7 ACL & System Config

```xml
<!-- acl.xml -->
<resources>
    <resource id="Magento_Backend::admin">
        <resource id="Vendor_Module::config"
                  title="Vendor Module Configuration"
                  sortOrder="999"/>
    </resource>
</resources>
```

```xml
<!-- system.xml section -->
<section id="vendor_module" translate="label" type="text" sortOrder="999"
         showInDefault="1" showInWebsite="1" showInStore="1">
    <label>Vendor Module</label>
    <tab>general</tab>
    <resource>Vendor_Module::config</resource>
    <group id="general" translate="label" type="text" sortOrder="10"
           showInDefault="1" showInWebsite="1" showInStore="1">
        <label>General</label>
        <field id="enabled" translate="label" type="select" sortOrder="10"
               showInDefault="1" showInWebsite="1" showInStore="1">
            <label>Enabled</label>
            <source_model>Magento\Config\Model\Config\Source\Yesno</source_model>
        </field>
    </group>
</section>
```

```php
// Reading config in code
$isEnabled = $this->scopeConfig->isSetFlag(
    'vendor_module/general/enabled',
    \Magento\Store\Model\ScopeInterface::SCOPE_STORE
);
```

---

## Quick-Reference Checklist

### Integration Test Infrastructure
- [ ] Test bootstrap file: `dev/tests/integration/framework/bootstrap.php`
- [ ] PHPUnit config: `dev/tests/integration/phpunit.xml`
- [ ] Test database credentials: `dev/tests/integration/etc/install-config-mysql.php`
- [ ] Test DB is **separate** from production DB
- [ ] Custom test directories added to `<testsuites>` in `phpunit.xml`
- [ ] Module integration tests live in `app/code/Vendor/Module/Test/Integration/`
- [ ] Fixture files in `_files/` subdirectory next to tests

### ObjectManager Pattern
- [ ] `Bootstrap::getObjectManager()` — correct integration test pattern
- [ ] `ObjectManager::getInstance()` — valid but less idiomatic
- [ ] `$om->get()` — shared singleton
- [ ] `$om->create()` — new instance per call
- [ ] **NEVER** use ObjectManager in unit tests — anti-pattern

### @magentoDataFixture
- [ ] Can be placed on class (all methods) or method (single test)
- [ ] File path syntax: `Vendor_Module::Test/Integration/_files/fixture.php`
- [ ] Closure syntax: static method name in same class, must be `public static`
- [ ] Multiple `@magentoDataFixture` lines on one docblock all execute
- [ ] Rollback file: `{fixture_name}_rollback.php` — auto-detected
- [ ] Use `isSecureArea` registry flag = `true` before deleting catalog entities in rollback

### @magentoDbIsolation
- [ ] **Default: enabled** — wraps test in DB transaction; auto-rolls back
- [ ] Disable when: test code commits its own transaction; DDL statements used; cross-session data needed
- [ ] When disabled: **must provide rollback files** for all fixtures
- [ ] Controls database state only — not object manager or app state

### @magentoAppIsolation
- [ ] **Default per class: enabled** — resets ObjectManager between test classes
- [ ] **Default per method: disabled** — does NOT reset between methods in same class
- [ ] Enable on method when: you change area code, store, locale, or DI preferences
- [ ] Resetting app state is expensive — only enable when genuinely needed

### @magentoConfigFixture
- [ ] In-memory override — NOT a database write
- [ ] `current_store` keyword = currently active store view (magic keyword, not a store code)
- [ ] `default` scope = global default
- [ ] `default/<path>` — default scope config path
- [ ] No rollback file needed — override is automatically removed after test
- [ ] Can be placed on class or method

### Running Tests
- [ ] Full suite: `./vendor/bin/phpunit -c dev/tests/integration/phpunit.xml`
- [ ] Single file: append file path to command
- [ ] Single method: `--filter testMethodName`
- [ ] First run installs Magento into test DB — expect it to be slow

### Unit vs Integration vs MFTF
- [ ] Unit: no bootstrap, no DB, no browser, mocks everything, fastest
- [ ] Integration: full Magento bootstrap, real test DB, no browser, slow
- [ ] MFTF: full app + web server + browser (Selenium), slowest, XML test format
- [ ] Plugins ARE applied in integration tests; NOT applied in unit tests
- [ ] MFTF fixtures use XML `actionGroup`; integration uses `@magentoDataFixture`; unit uses `setUp()` mocks

### Plugin Rules (Week 2)
- [ ] `before` returns **array** of modified arguments or `null`
- [ ] `after` receives `$subject, $result` (and optional original args)
- [ ] `around` **must** call `$proceed()` to invoke original method
- [ ] Cannot plugin: `final` methods/classes, `static` methods, `__construct`
- [ ] Plugins stack by `sortOrder`; preferences replace entirely

### Fixture & Isolation Annotation Defaults Summary
```
Annotation             | Default         | Override keyword
-----------------------+-----------------+------------------
@magentoDbIsolation    | enabled         | disabled
@magentoAppIsolation   | enabled (class) | disabled (method)
                       | disabled (method)| enabled (method)
@magentoDataFixture    | (none)          | N/A — explicit
@magentoConfigFixture  | (none)          | N/A — explicit
```

- [ ] Know all four isolation/fixture annotations cold — **highest exam frequency** for integration test questions
- [ ] Know the difference between `@magentoDbIsolation` (DB only) and `@magentoAppIsolation` (ObjectManager/app state)
- [ ] Know that `@magentoConfigFixture current_store` is the most common config override pattern
