# Magento 2 Dependency Injection — Deep Dive Study Notes
### Adobe Certified Professional / Architect Exam Preparation

---

## Table of Contents

1. [Why Dependency Injection Exists in Magento 2](#1-why-dependency-injection-exists-in-magento-2)
2. [The di.xml Node Reference](#2-the-dixml-node-reference)
   - [type](#21-type)
   - [preference](#22-preference)
   - [virtualType](#23-virtualtype)
   - [argument](#24-argument)
3. [Shared vs Non-Shared Instances](#3-shared-vs-non-shared-instances)
4. [Constructor Injection — The Only Acceptable Pattern](#4-constructor-injection--the-only-acceptable-pattern)
5. [ObjectManager — Antipattern, Exceptions, and Why](#5-objectmanager--antipattern-exceptions-and-why)
6. [Proxies and Lazy Loading](#6-proxies-and-lazy-loading)
7. [Interceptors (Plugins) — How They Are Built](#7-interceptors-plugins--how-they-are-built)
8. [Plugin on a virtualType — Why It Is Impossible](#8-plugin-on-a-virtualtype--why-it-is-impossible)
9. [Hands-On: Inspecting Real di.xml and Generated Code](#9-hands-on-inspecting-real-dixml-and-generated-code)
10. [Scenario-Based Reasoning Guide](#10-scenario-based-reasoning-guide)
11. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Why Dependency Injection Exists in Magento 2

Before memorising XML nodes, understand the *architectural problem* DI solves. The exam tests this reasoning.

### The Pre-DI Problem (Magento 1 / Zend 1 Era)

```php
// BAD — Magento 1 style
class MyHelper {
    public function doSomething() {
        $catalog = Mage::getModel('catalog/product'); // hidden dependency
        $config  = Mage::getConfig()->getNode('...');  // hidden dependency
    }
}
```

Problems:
- Dependencies are **invisible** from the class signature
- **Impossible to unit test** without bootstrapping the whole application
- **Coupling** — changing a dependency requires hunting through method bodies
- **No single responsibility** — the class must know *how* to locate its own collaborators

### The DI Solution

```php
// GOOD — Magento 2 constructor injection
class MyHelper {
    public function __construct(
        private readonly \Magento\Catalog\Model\ProductFactory $productFactory,
        private readonly \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig
    ) {}
}
```

- Dependencies are **declared** in the signature — fully visible
- **Testable** — swap any dependency with a mock in PHPUnit
- **Configurable** — `di.xml` decides which concrete class satisfies each interface
- **Interoperable** — the Object Manager can generate proxy/interceptor wrappers transparently

**Exam focus:**
> The primary architectural reason Magento 2 uses constructor injection over method injection or property injection is **testability and dependency transparency**. The secondary reason is that the ObjectManager (and generated proxies/interceptors) can introspect constructor signatures via reflection without any runtime overhead after compilation.

---

## 2. The di.xml Node Reference

`di.xml` files exist at three scopes, merged in order:

```
app/etc/di.xml                    (primary/base config — lowest priority, overridden by modules)
<module>/etc/di.xml               (module global scope — overrides app/etc)
<module>/etc/<area>/di.xml        (area-specific: frontend, adminhtml, webapi_rest, etc. — highest priority)
```

Area-specific files **override** module global which **override** app/etc — but only after area is determined (after routing).

> **Exam focus:** `app/etc/di.xml` is the FIRST file loaded and has the LOWEST override priority. All module-level `etc/di.xml` files merge on top of it. Area-specific files merge on top of those. "First loaded = overridden by everything after."

---

### 2.1 `type`

Configures a **real, existing PHP class** — how it is instantiated, which plugins apply, whether it is shared.

```xml
<type name="Magento\Catalog\Model\Product">
    <arguments>
        <argument name="resourceModel" xsi:type="string">
            Magento\Catalog\Model\ResourceModel\Product
        </argument>
    </arguments>
    <plugin name="my_product_plugin"
            type="MyVendor\MyModule\Plugin\ProductPlugin"
            sortOrder="10"
            disabled="false" />
</type>
```

**Key attributes:**

| Attribute | Required | Description |
|-----------|----------|-------------|
| `name` | Yes | Fully-qualified class or interface name |
| `shared` | No | `true` (default) = singleton; `false` = new instance each request |

**Exam focus:**
> `<type>` applies to the **named class AND all subclasses** unless overridden in a more specific `<type>` block. Plugins declared on a `<type>` are inherited by child classes.

---

### 2.2 `preference`

Tells the ObjectManager: "whenever something asks for *interface A*, give them *class B*."

```xml
<!-- Default Magento mapping -->
<preference for="Magento\Catalog\Api\ProductRepositoryInterface"
            type="Magento\Catalog\Model\ProductRepository" />

<!-- Your override in custom module -->
<preference for="Magento\Catalog\Api\ProductRepositoryInterface"
            type="MyVendor\MyModule\Model\CustomProductRepository" />
```

**Load order matters:**
- The **last loaded module** wins (controlled by `sequence` in `module.xml`)
- `app/etc/di.xml` preferences are overridden by module-level preferences of correctly sequenced modules

**When to use preference vs plugin:**

| Scenario | Use |
|----------|-----|
| Replace an entire class behaviour | `preference` |
| Add behaviour before/after/around a method | `plugin` |
| Override only one or two methods | `plugin` (safer) |
| Third-party compatibility | `plugin` always preferred |

**Exam focus:**
> `preference` replaces the entire class — **plugins on the original class still fire** (they are on the interceptor chain, not the class itself). This is a common exam trap: replacing a class with `preference` does NOT disable plugins on the original interface/class.

---

### 2.3 `virtualType`

Creates a **new named "class"** that exists only in DI configuration — no corresponding PHP file.

```xml
<virtualType name="Magento\Catalog\Model\Session\Storage"
             type="Magento\Framework\Session\Storage">
    <arguments>
        <argument name="namespace" xsi:type="string">catalog</argument>
    </arguments>
</virtualType>
```

**What this does:**
- Defines a new injectable "type" named `Magento\Catalog\Model\Session\Storage`
- It is an instance of `Framework\Session\Storage` but with `namespace` overridden
- Any class that references this name as `xsi:type="object"` in its constructor gets this specific configuration
- **No PHP file is generated** for the virtual type itself

**Use cases:**

```
Without virtualType:                    With virtualType:
---------------------                   ----------------
Must subclass Session\Storage           Reuse same class with different args
Must create a new PHP file              Zero new PHP files
Must maintain that file forever         Configured purely in XML
```

**Exam focus:**
> `virtualType` is purely a **DI-layer concept**. It has no PHP class. You cannot write a plugin on it (covered in Section 8). You cannot use it as a type-hint in PHP — you use it only as an `xsi:type="object"` value in `di.xml` argument injection.

---

### 2.4 `argument`

Injects a specific value into a constructor parameter by name.

**All argument xsi:type variants:**

```xml
<arguments>
    <!-- String literal -->
    <argument name="connectionName" xsi:type="string">default</argument>

    <!-- Boolean -->
    <argument name="isActive" xsi:type="boolean">true</argument>

    <!-- Integer/number -->
    <argument name="pageSize" xsi:type="number">20</argument>

    <!-- Null -->
    <argument name="optionalDep" xsi:type="null" />

    <!-- Object (injects an instance, resolved by ObjectManager) -->
    <argument name="logger" xsi:type="object">
        Psr\Log\LoggerInterface
    </argument>

    <!-- Object with shared="false" — new instance every time -->
    <argument name="processor" xsi:type="object" shared="false">
        MyVendor\MyModule\Model\Processor
    </argument>

    <!-- Array -->
    <argument name="handlers" xsi:type="array">
        <item name="default" xsi:type="object">
            MyVendor\MyModule\Model\Handler\DefaultHandler
        </item>
        <item name="special" xsi:type="object">
            MyVendor\MyModule\Model\Handler\SpecialHandler
        </item>
    </argument>

    <!-- Init parameter (from deployment config) -->
    <argument name="data" xsi:type="init_parameter">
        Magento\Framework\Config\ConfigOptionsListConstants::CONFIG_PATH_DB_CONNECTION_DEFAULT
    </argument>

    <!-- Constant -->
    <argument name="connectionType" xsi:type="const">
        Magento\Framework\DB\Adapter\AdapterInterface::INDEX_TYPE_FULLTEXT
    </argument>
</arguments>
```

**How argument merging works across di.xml files:**

```
Module A di.xml:                     Module B di.xml (loaded later):
  <argument name="handlers">           <argument name="handlers">
    <item name="foo" .../>               <item name="bar" .../>   <- ADDED
    <item name="baz" .../>               <item name="foo"         <- OVERRIDES
  </argument>                            xsi:type="null"/>
                                       </argument>

Result: handlers = [bar => ..., baz => ..., foo => null]
```

**Exam focus:**
> Array arguments are **merged**, not replaced. `xsi:type="null"` on an array item effectively removes it from the resolved array. This is how Magento handles "remove a handler from a pool" without overriding the entire argument.

---

## 3. Shared vs Non-Shared Instances

### The Default: Shared (Singleton per ObjectManager scope)

```xml
<!-- Implicitly shared="true" — same instance returned every time -->
<type name="Magento\Catalog\Model\ProductRepository">
    <!-- shared="true" is the default -->
</type>
```

```php
// Both calls return the SAME instance
$repo1 = $objectManager->get(ProductRepositoryInterface::class);
$repo2 = $objectManager->get(ProductRepositoryInterface::class);
var_dump($repo1 === $repo2); // bool(true)
```

### Non-Shared: New Instance Each Time

```xml
<type name="Magento\Catalog\Model\Product" shared="false" />
```

```php
// Each call returns a NEW instance
$p1 = $objectManager->create(Product::class);
$p2 = $objectManager->create(Product::class);
var_dump($p1 === $p2); // bool(false)
```

**In argument injection:**

```xml
<argument name="product" xsi:type="object" shared="false">
    Magento\Catalog\Model\Product
</argument>
```

This overrides the type-level `shared` setting for this specific injection point.

### When to use `shared="false"`

| Scenario | Reason |
|----------|--------|
| **Models** (Product, Order, etc.) | Each represents different data — must not share state |
| **Processors/Importers** with mutable state | Risk of cross-request contamination |
| **Factories** (always non-shared implicitly) | Factory pattern creates new instances |
| **Data Transfer Objects** | Each operation needs a clean slate |

**Exam focus:**
> Services (repositories, helpers, resource models in read-only contexts) should be **shared**. Models carrying entity data should be **non-shared** (or instantiated via a Factory). Sharing a stateful model is a **serious architectural flaw** — it can cause data leaking between requests in long-running processes.

### The Factory Pattern as Enforced Non-Sharing

Magento **auto-generates** factories for non-shared objects:

```php
// You declare this in constructor
public function __construct(
    private readonly \Magento\Catalog\Model\ProductFactory $productFactory
) {}

// At runtime
$product = $this->productFactory->create(['data' => [...]]);
// Equivalent to $objectManager->create(Product::class, ['data' => [...]])
```

The generated factory class lives in `generated/code/`:

```php
// generated/code/Magento/Catalog/Model/ProductFactory.php
namespace Magento\Catalog\Model;

class ProductFactory {
    public function __construct(
        private readonly \Magento\Framework\ObjectManagerInterface $objectManager,
        private readonly string $instanceName = '\\Magento\\Catalog\\Model\\Product'
    ) {}

    public function create(array $data = []): Product {
        return $this->objectManager->create($this->instanceName, $data);
    }
}
```

**Exam focus:**
> Factories are the **sanctioned way** to use ObjectManager inside your own code. Injecting a Factory is NOT using ObjectManager as an antipattern — it is the prescribed solution for non-shared instances.

---

## 4. Constructor Injection — The Only Acceptable Pattern

### Why Constructor Injection Exclusively?

Magento deliberately chose constructor injection over:
- **Setter injection** (used in Symfony, Spring optionally)
- **Property injection** (used in some frameworks)
- **Method/parameter injection** (for one-off needs)

**The architectural reasons:**

```
Constructor Injection Guarantees:
+----------------------------------+----------------------------------------------+
| Property                         | Consequence                                  |
+----------------------------------+----------------------------------------------+
| Object is valid after __construct| No half-initialised objects in circulation   |
| Dependencies are immutable       | No dependency swapped mid-lifecycle          |
| Fully visible in signature       | Instant comprehension, IDE autocomplete      |
| Reflectable without instantiation| ObjectManager can introspect without side FX |
| Testable with simple mocks       | PHPUnit $this->createMock() just works       |
+----------------------------------+----------------------------------------------+
```

**Setter injection problems (why Magento rejected it):**

```php
// REJECTED PATTERN — setter injection
class MyService {
    private LoggerInterface $logger;

    public function setLogger(LoggerInterface $logger): void {
        $this->logger = $logger;
    }

    public function doWork(): void {
        $this->logger->info('...'); // What if setLogger was never called? FATAL
    }
}
```

Problems:
1. Object is **invalid** after construction — usable only after all setters are called
2. Framework must **know the setter names** — requires additional configuration or convention
3. **Circular dependency detection** is much harder
4. **Thread safety** is compromised in environments with shared state

**Exam focus:**
> The exam may present setter injection as an option for resolving circular dependencies. The **correct Magento answer** is to use a **Proxy** — not setter injection. Setter injection is not supported by the Magento DI container.

### Constructor Signature Best Practices

```php
<?php
declare(strict_types=1);

namespace MyVendor\MyModule\Model;

use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Framework\Api\SearchCriteriaBuilder;
use Psr\Log\LoggerInterface;

class ProductService
{
    /**
     * Always call parent::__construct() when extending Magento classes
     * Pass through all parent parameters first
     */
    public function __construct(
        private readonly ProductRepositoryInterface $productRepository,
        private readonly SearchCriteriaBuilder $searchCriteriaBuilder,
        private readonly LoggerInterface $logger,
        // Optional: use default value, never inject via di.xml unless needed
        private readonly string $defaultCategory = 'default'
    ) {
        // No business logic here — construction only
    }
}
```

**Exam focus:**
> When extending Magento core classes, you **must** call `parent::__construct()` with the **correct arguments**. Failing to propagate parent constructor arguments is a common source of subtle bugs and an exam scenario topic.

---

## 5. ObjectManager — Antipattern, Exceptions, and Why

### Why Direct ObjectManager Usage Is an Antipattern

```php
// ANTIPATTERN — do not do this in production code
class MyBadClass {
    public function doSomething(): void {
        $om = \Magento\Framework\App\ObjectManager::getInstance();
        $product = $om->create(\Magento\Catalog\Model\Product::class);
    }
}
```

**Architectural problems:**

1. **Hidden dependency** — the class secretly depends on Product but it is not declared
2. **Untestable** — you cannot mock ObjectManager::getInstance() easily; it returns a real instance
3. **Violates DI contract** — defeats the entire purpose of the DI container
4. **Tight coupling to the framework** — your class cannot exist outside Magento's bootstrap
5. **No interception possible** — ObjectManager bypasses the interceptor chain in some scenarios
6. **Code review red flag** — Adobe's extension quality program flags this

### The Three Legitimate Exceptions

**Exam focus:**
> The exam will present scenarios where ObjectManager is used. You must identify whether the usage is legitimate. The three exceptions are: **Factories**, **Proxies**, and **Tests**.

#### Exception 1: Factories (Auto-Generated)

```php
// generated/code/Magento/Catalog/Model/ProductFactory.php
// This IS acceptable — it is the prescribed pattern
public function create(array $data = []): Product
{
    return $this->objectManager->create($this->instanceName, $data);
}
```

Why acceptable:
- The Factory IS the DI mechanism for non-shared objects
- It is auto-generated — developers don't write this code
- The Factory itself is injected via constructor (so the dependency IS visible)

#### Exception 2: Proxies (Auto-Generated)

```php
// generated/code/MyVendor/MyModule/Service/HeavyAnalyticsService/Proxy.php
// Auto-generated — uses ObjectManager to defer instantiation
private function _getSubject(): HeavyAnalyticsService
{
    if (!$this->_subject) {
        $this->_subject = $this->_shared
            ? $this->_objectManager->get($this->_instanceName)
            : $this->_objectManager->create($this->_instanceName);
    }
    return $this->_subject;
}
```

Why acceptable:
- Proxies exist solely to defer ObjectManager calls — lazy loading is their entire purpose
- Auto-generated — developers configure proxies in di.xml, not in PHP
- The proxy itself is injected via constructor (dependency IS visible)

#### Exception 3: Tests and Test Infrastructure

```php
// In integration tests — acceptable
class MyIntegrationTest extends \PHPUnit\Framework\TestCase
{
    protected function setUp(): void
    {
        $objectManager = \Magento\TestFramework\Helper\Bootstrap::getObjectManager();
        $this->model = $objectManager->create(MyModel::class);
    }
}
```

Why acceptable:
- Test bootstrap is explicitly about wiring the whole application
- Avoids complex constructor management in test setup
- The antipattern consequences (hidden deps, no testability) don't apply to test infrastructure

### Recognition Pattern for the Exam

```
Is ObjectManager used here?
        |
        v
  Is it inside a Factory, Proxy, or Test?
        |                   |
       YES                  NO
        |                   |
  Acceptable           Is it in a __construct?
                              |
                         YES (worst case) / NO (bad but less bad)
                              |
                        ANTIPATTERN — suggest refactoring to constructor injection
```

---

## 6. Proxies and Lazy Loading

### The Problem Proxies Solve

```php
// PROBLEM: HeavyClass takes 200ms to construct (DB calls, file parsing, etc.)
class MyController
{
    public function __construct(
        private readonly HeavyAnalyticsService $analytics // always constructed, even if never used
    ) {}

    public function simpleAction(): ResultInterface
    {
        return $this->resultFactory->create(ResultFactory::TYPE_PAGE);
        // analytics never used — but still paid 200ms to construct it
    }
}
```

### The Proxy Solution

```xml
<!-- di.xml — tell DI to inject a Proxy instead of the real class -->
<type name="MyVendor\MyModule\Controller\MyController">
    <arguments>
        <argument name="analytics" xsi:type="object">
            MyVendor\MyModule\Service\HeavyAnalyticsService\Proxy
        </argument>
    </arguments>
</type>
```

The `\Proxy` suffix triggers auto-generation in `generated/code/`.

### How a Generated Proxy Works

```php
// generated/code/MyVendor/MyModule/Service/HeavyAnalyticsService/Proxy.php
// Simplified for study purposes

namespace MyVendor\MyModule\Service;

class HeavyAnalyticsService\Proxy extends HeavyAnalyticsService
    implements \Magento\Framework\ObjectManager\NoninterceptableInterface
{
    private ?HeavyAnalyticsService $_subject = null;

    public function __construct(
        private readonly \Magento\Framework\ObjectManagerInterface $_objectManager,
        private readonly string $_instanceName = HeavyAnalyticsService::class,
        private readonly bool $_shared = true
    ) {
        // NOTE: parent::__construct() is NOT called here
        // The real object is not constructed yet
    }

    // Every public method is overridden to trigger lazy load
    public function generateReport(array $params): array
    {
        return $this->_getSubject()->generateReport($params);
    }

    private function _getSubject(): HeavyAnalyticsService
    {
        if (!$this->_subject) {
            $this->_subject = $this->_shared
                ? $this->_objectManager->get($this->_instanceName)
                : $this->_objectManager->create($this->_instanceName);
        }
        return $this->_subject;
    }
}
```

> **Note on naming:** The generated proxy uses underscore-prefixed property names (`_objectManager`, `_instanceName`, `_shared`, `_subject`) to avoid collisions with the parent class's own properties.

**Visual flow:**

```
Request arrives
      |
      v
MyController constructed
      |
      +-- analytics = HeavyAnalyticsService\Proxy (instant, 0ms)
      |   (real HeavyAnalyticsService NOT created yet)
      |
      v
simpleAction() called
      |
      v
analytics never called
      |
      v
Response returned
(HeavyAnalyticsService never constructed -- 200ms saved)

If complexAction() called instead:
      |
      v
analytics->generateReport() called
      |
      v
Proxy._getSubject() triggered
      |
      v
ObjectManager.get(HeavyAnalyticsService) -- NOW constructed (200ms here)
      |
      v
generateReport() delegated to real service
```

**Exam focus:**
> Proxies implement `NoninterceptableInterface`. This means **plugins cannot be applied to proxy objects** — the proxy delegates to the real object which may itself have interceptors. The proxy layer is intentionally outside the plugin chain.

### When to Use Proxies

| Scenario | Use Proxy? |
|----------|-----------|
| Heavy constructor (DB, filesystem, HTTP calls) | **Yes** |
| Class only used in some code paths | **Yes** |
| Circular dependency (A needs B, B needs A) | **Yes** — inject one side as proxy |
| Lightweight service always used | No — unnecessary overhead |
| Class with `shared="false"` | Rarely — proxies work best with shared instances |

**Exam focus:**
> Proxies are the **correct solution for circular dependencies** in Magento 2. If ClassA's constructor requires ClassB and ClassB's constructor requires ClassA, inject one of them as a Proxy. The proxy delays construction until the first method call, breaking the circular dependency at construction time.

---

## 7. Interceptors (Plugins) — How They Are Built

### Plugin Types Review

```php
class MyPlugin
{
    // Before: modify arguments before the original method runs
    // Return ?array — return modified args as array, or null to leave args unchanged
    public function beforeSave(
        ProductRepository $subject,
        ProductInterface $product,
        bool $saveOptions = false
    ): ?array {
        // Return array of modified arguments, or null to leave unchanged
        return [$product, $saveOptions];
    }

    // After: modify the return value after the original method runs
    // May also declare original arguments after $result (optional)
    public function afterSave(
        ProductRepository $subject,
        ProductInterface $result
    ): ProductInterface {
        // Return the (optionally modified) result
        return $result;
    }

    // Around: full control — must call $proceed
    public function aroundSave(
        ProductRepository $subject,
        callable $proceed,
        ProductInterface $product,
        bool $saveOptions = false
    ): ProductInterface {
        // Do work before
        $result = $proceed($product, $saveOptions); // call original (or next plugin)
        // Do work after
        return $result;
    }
}
```

**Plugin sorting:**

```xml
<type name="Magento\Catalog\Api\ProductRepositoryInterface">
    <plugin name="plugin_a" type="VendorA\Module\Plugin\A" sortOrder="10" />
    <plugin name="plugin_b" type="VendorB\Module\Plugin\B" sortOrder="20" />
    <plugin name="plugin_c" type="VendorC\Module\Plugin\C" sortOrder="30" />
</type>
```

Execution order:
```
before_A -> before_B -> before_C -> [original] -> after_C -> after_B -> after_A
```

Around plugins wrap the entire chain:
```
around_A(
  around_B(
    around_C(
      [original]
    )
  )
)
```

> **`before` order:** lowest sortOrder executes first (A=10 before B=20 before C=30).
> **`after` order:** highest sortOrder executes first (C=30 before B=20 before A=10) — reverse of `before`.
> This is because around plugins are nested: A is the outermost wrapper, so A's `after` runs LAST.

### How the Interceptor Is Generated

When you run `bin/magento setup:di:compile`, Magento:

1. Reads all `<plugin>` declarations from merged `di.xml`
2. Identifies which classes have plugins
3. Generates an `Interceptor` class in `generated/code/`

**Example generated interceptor:**

```php
// generated/code/Magento/Catalog/Model/ProductRepository/Interceptor.php

namespace Magento\Catalog\Model\ProductRepository;

class Interceptor extends \Magento\Catalog\Model\ProductRepository
    implements \Magento\Framework\Interception\InterceptorInterface
{
    use \Magento\Framework\Interception\Interceptor;

    public function __construct(
        // All original ProductRepository constructor params...
        \Magento\Catalog\Model\ResourceModel\Product $resourceModel,
        // ... etc
    ) {
        $this->___init(); // Initialize the interceptor chain — BEFORE parent::__construct()
        parent::__construct($resourceModel, /* ... */);
    }

    public function save(
        \Magento\Catalog\Api\Data\ProductInterface $product,
        $saveOptions = false
    ): \Magento\Catalog\Api\Data\ProductInterface {
        // ___callPlugins resolves and executes the plugin chain
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'save');
        return $pluginInfo
            ? $this->___callPlugins('save', func_get_args(), $pluginInfo)
            : parent::save($product, $saveOptions);
    }
}
```

**The `Interceptor` trait provides:**

```php
// Magento\Framework\Interception\Interceptor (trait)
trait Interceptor
{
    private PluginListInterface $pluginList;
    private string $subjectType;

    public function ___init(): void
    {
        $this->pluginList = ObjectManager::getInstance()
            ->get(PluginListInterface::class);
        $this->subjectType = get_parent_class($this);
        // Also calls parent::___init() if parent chain has one
    }

    // Note: ___callPlugins is PROTECTED (not public)
    protected function ___callPlugins(string $method, array $arguments, array $pluginInfo): mixed
    {
        // Builds the callable chain (before -> around -> after)
        // Executes plugins in sortOrder
        // Handles the $proceed callable for around plugins
        // before plugins: null return = leave arguments unchanged; array return = replace arguments
    }
}
```

**The relationship between class, interceptor, and plugins:**

```
di.xml declares:
  <preference for="ProductRepositoryInterface" type="ProductRepository" />
  <plugin name="my_plugin" type="MyPlugin" />

ObjectManager resolves request for ProductRepositoryInterface:
  1. preference -> ProductRepository
  2. Has plugins? YES
  3. Return ProductRepository\Interceptor instead
  4. Interceptor extends ProductRepository (IS-A relationship preserved)
  5. Interceptor wraps all public methods with plugin chain execution
```

**Exam focus:**
> The ObjectManager **never returns** the raw `ProductRepository` when plugins are present — it always returns the `Interceptor`. This is transparent to the caller. The Interceptor extends the original class so type-checking (`instanceof`) still works correctly.

**Exam focus:**
> Only **public, non-final** methods can be plugged. `final` methods cannot be intercepted. `private` and `protected` methods cannot be intercepted. This is a deliberate design constraint — it is also why marking a method `final` is the way to prevent plugin interference.

### Plugin Method Naming Convention

```php
// Method name: save
// Plugin methods:
public function beforeSave(...) {}  // prefix: before + ucfirst(method)
public function afterSave(...) {}   // prefix: after + ucfirst(method)
public function aroundSave(...) {}  // prefix: around + ucfirst(method)
```

A plugin class does **not** need to implement an interface — naming convention is the contract.

---

## 8. Plugin on a virtualType — Why It Is Impossible

This is one of the most important "tricky" topics on the exam.

### The Core Reason

```xml
<!-- DOES NOT WORK — plugins cannot target virtual types -->
<type name="Magento\Catalog\Model\ResourceModel\Product\Collection\Grid">
    <plugin name="my_grid_plugin" type="MyVendor\MyModule\Plugin\GridPlugin" />
</type>
```

**Why this fails:**

A `virtualType` has **no PHP class**. There is no PHP file to generate an Interceptor from. The interceptor generation system works by:

1. Finding a real PHP class via reflection
2. Reading its public methods
3. Generating an `Interceptor.php` that extends the real class

With a virtual type:
- There is no PHP file
- There is no class to reflect upon
- There is no class to extend for the Interceptor
- The DI compiler has no mechanism to generate interception code

**Visual explanation:**

```
Plugin on real class:
  ProductRepository (real PHP class exists)
       |
       v (compiler generates)
  ProductRepository\Interceptor (extends ProductRepository)
  -> Works perfectly

Plugin on virtual type:
  Product\Collection\Grid (NO PHP class -- only XML config)
       |
       v (compiler tries to generate...)
  Product\Collection\Grid\Interceptor (extends... what? There is no Grid class)
  -> IMPOSSIBLE -- nothing to extend
```

### The Correct Approach: Plugin the Underlying Real Class

```xml
<!-- CORRECT: plugin on the real class that virtualType is based on -->
<type name="Magento\Catalog\Model\ResourceModel\Product\Collection">
    <plugin name="my_grid_plugin" type="MyVendor\MyModule\Plugin\GridPlugin" />
</type>
```

**But this has a side effect:** the plugin fires for ALL instances of `Product\Collection`, not just the Grid variant.

**Better approach: check context in the plugin**

```php
class GridPlugin
{
    public function beforeLoad(
        \Magento\Catalog\Model\ResourceModel\Product\Collection $subject,
        bool $printQuery = false,
        bool $logQuery = false
    ): ?array {
        // Check if this is the grid collection specifically
        // (by checking injected flags, store context, or a marker interface)
        // This is imperfect but is the only option without modifying the virtualType's
        // underlying class behaviour via argument injection
        return [$printQuery, $logQuery];
    }
}
```

**Cleanest approach: Use argument injection on the virtualType itself**

```xml
<!-- Instead of trying to plugin a virtualType, configure its behaviour via arguments -->
<virtualType name="Magento\Catalog\Model\ResourceModel\Product\Collection\Grid"
             type="Magento\Catalog\Model\ResourceModel\Product\Collection">
    <arguments>
        <!-- Inject a custom fetch strategy that contains your "plugin" logic -->
        <argument name="fetchStrategy" xsi:type="object">
            MyVendor\MyModule\Model\Collection\GridFetchStrategy
        </argument>
    </arguments>
</virtualType>
```

**Exam focus:**
> If an exam question asks "How do you modify the behaviour of a virtualType?" — the answer is **NOT a plugin**. The correct answers are: (1) modify the `arguments` in the `virtualType` declaration, (2) plugin the underlying real class, or (3) create a real subclass if complex behaviour is needed.

**Exam focus:**
> The statement "you cannot declare a plugin on a virtualType" is **absolutely true** and the exam tests it directly. The reason is architectural: no PHP class exists, so no Interceptor can be generated.

---

## 9. Hands-On: Inspecting Real di.xml and Generated Code

### Exercise 1: Grep for virtualType in Catalog di.xml

```bash
grep -A 8 "virtualType" vendor/magento/module-catalog/etc/di.xml
```

**Actual output (truncated):**

```xml
<virtualType name="Magento\Catalog\Model\Session\Storage"
             type="Magento\Framework\Session\Storage">
    <arguments>
        <argument name="namespace" xsi:type="string">catalog</argument>
    </arguments>
</virtualType>

<virtualType name="categoryFilterList" type="Magento\Catalog\Model\Layer\FilterList">
    <arguments>
        <argument name="filterableAttributes" xsi:type="object">
            Magento\Catalog\Model\Layer\Category\FilterableAttributeList
        </argument>
    </arguments>
</virtualType>

<virtualType name="searchFilterList" type="Magento\Catalog\Model\Layer\FilterList">
    <arguments>
        <argument name="filterableAttributes" xsi:type="object">
            Magento\Catalog\Model\Layer\Search\FilterableAttributeList
        </argument>
    </arguments>
</virtualType>
```

**What to look for:**
- The `type` attribute points to a real PHP class
- `arguments` customise that class without subclassing
- The `name` (the virtual type name) is used elsewhere as `xsi:type="object"` references
- Both `categoryFilterList` and `searchFilterList` reuse the same real class (`FilterList`) with different argument injection — classic virtualType use case

```bash
# Find where these virtual types are used as injected objects
grep -r "categoryFilterList\|searchFilterList" vendor/magento/module-catalog/etc/di.xml
```

### Exercise 2: Count plugins on ProductRepository

```bash
grep -r "ProductRepositoryInterface" vendor/magento/module-catalog/etc/di.xml \
  vendor/magento/module-catalog-graph-ql/etc/di.xml \
  vendor/magento/module-catalog-search/etc/di.xml \
  --include="*.xml" -l
```

```bash
# List all plugins on ProductRepository across all modules
grep -r "ProductRepository" vendor/magento/*/etc/di.xml \
  --include="*.xml" | grep "plugin"
```

### Exercise 3: Inspect a Generated Interceptor

```bash
# First, ensure code is compiled
bin/magento setup:di:compile

# Find the interceptor
find generated/code/Magento/Catalog/Model/ProductRepository -name "Interceptor.php"

# View it
cat generated/code/Magento/Catalog/Model/ProductRepository/Interceptor.php
```

**What to analyse in the interceptor:**

```php
// 1. It EXTENDS the original class
class Interceptor extends \Magento\Catalog\Model\ProductRepository

// 2. It USES the Interceptor trait
use \Magento\Framework\Interception\Interceptor;

// 3. ___init() is called BEFORE parent::__construct()
public function __construct(...)
{
    $this->___init();
    parent::__construct(...);
}

// 4. Every pluggable method is overridden
public function save(...)
{
    $pluginInfo = $this->pluginList->getNext($this->subjectType, 'save');
    return $pluginInfo ? $this->___callPlugins('save', func_get_args(), $pluginInfo)
                       : parent::save(...);
}

// 5. Non-pluggable methods (final, private) are NOT overridden
```

### Exercise 4: Inspect a Generated Proxy

```bash
find generated/code -name "Proxy.php" | head -5

# Example:
cat generated/code/Magento/Framework/Indexer/CacheContext/Proxy.php
```

**Key differences from Interceptor:**

```
Interceptor:                    Proxy:
- Extends original class        - Extends original class
- Has all methods               - Has all public methods
- Calls parent methods          - Calls _getSubject() (lazily loaded)
- Used for plugins              - Used for lazy loading
- Generated when plugins exist  - Generated when \Proxy suffix requested
- Uses Interceptor trait        - Uses _objectManager directly
- Does NOT implement            - Implements NoninterceptableInterface
  NoninterceptableInterface
- Properties: pluginList,       - Properties: _objectManager,
  subjectType                     _instanceName, _shared, _subject
```

### Exercise 5: Trace a preference override

```bash
# Find all preferences for a specific interface
grep -r "ProductRepositoryInterface" vendor/magento/*/etc/di.xml \
  --include="*.xml" | grep "preference"
```

```bash
# See which module loads last (controls final preference)
grep -r "Magento_Catalog" vendor/magento/*/etc/module.xml \
  --include="*.xml" | grep "sequence"
```

---

## 10. Scenario-Based Reasoning Guide

The architect exam presents scenarios where multiple answers look valid. Here is how to reason through the most common DI scenarios.

### Scenario Type 1: "How do you replace core behaviour?"

**Question style:** *A merchant needs custom pricing logic that completely replaces Magento's price calculation. What is the best approach?*

**Reasoning chain:**

```
Option A: preference for the price model
Option B: plugin with around on the price method
Option C: override the template

Analysis:
- "Completely replaces" -> preference sounds right
- BUT: preference breaks other plugins (chain still fires on interceptor)
- AND: preference breaks if another extension also uses preference
- Plugins compose; preferences conflict

CORRECT ANSWER: around plugin
EXCEPTION: if the core method is final, then preference (subclass) is required
```

### Scenario Type 2: "Constructor has a heavy dependency"

**Question style:** *A class constructor injects a service that makes 5 database calls on instantiation, but the service is only used in one rarely-called method. How do you fix this?*

```
Option A: Move the dependency to the method parameter
Option B: Use a Proxy
Option C: Use a Factory
Option D: Use ObjectManager::getInstance() inside the method

Analysis:
- Option A: method injection not supported by Magento DI
- Option B: CORRECT -- Proxy defers instantiation until first method call
- Option C: Factory is for non-shared instances; doesn't solve lazy loading
- Option D: ObjectManager antipattern

CORRECT ANSWER: B -- inject HeavyService\Proxy via di.xml argument
```

### Scenario Type 3: "Circular dependency"

**Question style:** *ServiceA requires ServiceB in its constructor, and ServiceB requires ServiceA. How is this resolved?*

```
CORRECT ANSWER: Inject one as a Proxy
- Proxy breaks the circular construction chain
- ServiceA gets ServiceB\Proxy (instant construction)
- When ServiceA calls a method on it, THEN ServiceB is constructed
- By then, ServiceA already exists, so ServiceB's constructor can receive it

WRONG ANSWERS:
- Setter injection (not supported)
- Restructure to remove circular dep (valid advice, but if asked for DI solution, it's Proxy)
- Use ObjectManager in one class's constructor (antipattern)
```

### Scenario Type 4: "Modify a virtualType's behaviour"

**Question style:** *A virtualType is used to inject a collection with specific parameters. You need to add filtering logic. How?*

```
WRONG: Plugin on the virtualType name
WRONG: Create a preference for the virtualType name

CORRECT OPTIONS (in order of preference):
1. Add/override arguments in the virtualType declaration in your di.xml
2. Plugin the underlying real class with contextual checks
3. Create a real subclass and change the virtualType's `type` attribute
```

### Scenario Type 5: "When is shared=false correct?"

**Question style:** *An import processor class accumulates state during a batch import. Multiple imports run in sequence. What prevents state contamination?*

```
CORRECT ANSWER: shared="false" on the processor type, or use a Factory to create fresh instances

REASONING:
- Shared instances (singletons) persist state across requests/operations
- Import processors are stateful -- they accumulate errors, row counts, etc.
- Using shared="true" (default) would carry state from import 1 into import 2
- shared="false" or Factory ensures clean state per operation
```

### The "Why" Hierarchy for DI Decisions

```
Decision needed? Apply in this order:

1. Can an interface + preference handle it?
   -> Cleanest for full replacement

2. Can a plugin handle it?
   -> Best for augmentation; composable; preferred by community

3. Is it a non-shared instance?
   -> Use Factory

4. Is it heavy/circular/lazy?
   -> Use Proxy

5. Is it a configuration variant of a class?
   -> Use virtualType

6. Do I absolutely need ObjectManager?
   -> Am I in a Factory, Proxy, or Test? YES: OK. NO: Redesign.
```

---

## Quick-Reference Checklist

### di.xml Nodes
- [ ] `<type>` — configures a **real PHP class**: arguments, plugins, shared flag
- [ ] `<preference>` — maps interface → implementation; **last loaded module wins**
- [ ] `<virtualType>` — creates a **named DI-only alias** with custom arguments; **no PHP file**
- [ ] `<argument>` — injects constructor parameter by name; types: `string`, `boolean`, `number`, `null`, `object`, `array`, `const`, `init_parameter`
- [ ] Array arguments are **merged across di.xml files**, not replaced
- [ ] `xsi:type="null"` on array item effectively removes that item
- [ ] `app/etc/di.xml` has **lowest** priority — all module `etc/di.xml` files override it

### Shared vs Non-Shared
- [ ] Default is `shared="true"` (singleton per ObjectManager scope)
- [ ] `shared="false"` returns a new instance each time
- [ ] Models with entity data should be **non-shared** (use Factory)
- [ ] Services/repositories should be **shared**
- [ ] Sharing a stateful model across requests is an architectural flaw

### Constructor Injection
- [ ] Only injection pattern supported by Magento's ObjectManager
- [ ] Makes dependencies **visible, immutable, and testable**
- [ ] Always call `parent::__construct()` when extending core classes
- [ ] No business logic in constructor body
- [ ] Setter/property injection is **not supported**

### ObjectManager Antipattern
- [ ] **Antipattern** in business logic — hides dependencies, untestable
- [ ] **Acceptable** in: auto-generated Factories, auto-generated Proxies, Test infrastructure
- [ ] Factories are the **prescribed solution** for non-shared instances
- [ ] ObjectManager::getInstance() is the worst form — prefer even constructor injection of OM (which is still an antipattern but less egregious)

### Proxies
- [ ] Solve **lazy loading** and **circular dependencies**
- [ ] Triggered by `\Proxy` suffix in di.xml object argument
- [ ] Auto-generated in `generated/code/`
- [ ] Implement `NoninterceptableInterface` — **plugins cannot apply to proxies**
- [ ] Proxy calls `ObjectManager::get()` or `create()` on first method invocation via `_getSubject()`
- [ ] Use underscore-prefixed internal properties (`_objectManager`, `_subject`, etc.)
- [ ] Best for shared instances that are expensive to construct

### Interceptors (Plugins)
- [ ] Generated in `generated/code/ClassName/Interceptor.php`
- [ ] Interceptor **extends** the original class
- [ ] Uses `Magento\Framework\Interception\Interceptor` **trait**
- [ ] `___init()` is called BEFORE `parent::__construct()` in the Interceptor constructor
- [ ] `___callPlugins()` is **protected** (not public)
- [ ] Only **public, non-final** methods can be plugged
- [ ] `final` methods cannot be intercepted — use this to prevent plugin interference
- [ ] Plugin types: `before` (modify args), `after` (modify result), `around` (full control)
- [ ] `before` return type: `?array` — return array to replace args, return `null` to leave unchanged
- [ ] `before` execution order: lowest sortOrder first; `after` order: reverse (highest sortOrder first)
- [ ] ObjectManager returns **Interceptor**, never the raw class, when plugins exist

### Virtual Types and Plugins
- [ ] **Plugins CANNOT be declared on virtualTypes** — no PHP class exists to generate Interceptor from
- [ ] This is an absolute constraint, not a configuration limitation
- [ ] Workarounds: modify virtualType arguments, plugin the underlying real class, create a real subclass
- [ ] virtualType `name` can be used as `xsi:type="object"` value in other di.xml arguments
- [ ] virtualType `type` must be a real PHP class

### Plugin Priority (for exam scenarios)
- [ ] Plugin **composes** (multiple plugins coexist); preference **conflicts** (last one wins)
- [ ] Plugin over preference for augmentation — preference for complete replacement
- [ ] `disabled="true"` on plugin declaration disables a plugin from another module
- [ ] Plugins apply to **the interface** type-hint, not just the concrete class

### Compilation and Generation
- [ ] `bin/magento setup:di:compile` generates: Interceptors, Proxies, Factories, plugin lists
- [ ] Generated code lives in `generated/code/` (gitignored in production)
- [ ] In developer mode, generation happens on-demand (first request)
- [ ] In production mode, all code must be pre-generated — missing generated code = fatal error
- [ ] After any `di.xml` or plugin change: re-compile or clear generated code in developer mode
