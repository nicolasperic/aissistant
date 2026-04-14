# Day 2 — Components: Plugins, Preferences, Observers

## Table of Contents
- [1. Overview](#1-overview)
- [2. Plugins (Interceptors)](#2-plugins-interceptors)
  - [2.1 Plugin Types: before, around, after](#21-plugin-types-before-around-after)
  - [2.2 Execution Order and sortOrder](#22-execution-order-and-sortorder)
  - [2.3 The $proceed callable (around plugins)](#23-the-proceed-callable-around-plugins)
  - [2.4 Plugin Limitations](#24-plugin-limitations)
  - [2.5 Declaring a Plugin in di.xml](#25-declaring-a-plugin-in-dixml)
  - [2.6 Plugin Chaining Diagram](#26-plugin-chaining-diagram)
- [3. Preferences (Dependency Injection)](#3-preferences-dependency-injection)
  - [3.1 di.xml Preference vs Virtual Types](#31-dixml-preference-vs-virtual-types)
  - [3.2 Constructor Injection](#32-constructor-injection)
  - [3.3 Interface Binding](#33-interface-binding)
- [4. Observers and Events](#4-observers-and-events)
  - [4.1 events.xml Declaration](#41-eventsxml-declaration)
  - [4.2 Observer Class Structure](#42-observer-class-structure)
  - [4.3 Shared vs Non-Shared Observers](#43-shared-vs-non-shared-observers)
  - [4.4 Dispatching Custom Events](#44-dispatching-custom-events)
  - [4.5 Observer vs Plugin — When to Use Which](#45-observer-vs-plugin--when-to-use-which)
- [5. Virtual Types](#5-virtual-types)
  - [5.1 What is a Virtual Type?](#51-what-is-a-virtual-type)
  - [5.2 Virtual Type Examples](#52-virtual-type-examples)
- [6. DI Compilation](#6-di-compilation)
  - [6.1 What setup:di:compile Does](#61-what-setupdicompile-does)
  - [6.2 Generated Files and Directories](#62-generated-files-and-directories)
  - [6.3 Interceptor Generation Example](#63-interceptor-generation-example)
- [7. Decision Matrix — Plugins vs Preferences vs Observers](#7-decision-matrix--plugins-vs-preferences-vs-observers)
- [8. Practice Exercises (Annotated)](#8-practice-exercises-annotated)
  - [8.1 Around Plugin on a Core Method](#81-around-plugin-on-a-core-method)
  - [8.2 Two Plugins on the Same Method (Order Observation)](#82-two-plugins-on-the-same-method-order-observation)
  - [8.3 Dispatch and Observe a Custom Event](#83-dispatch-and-observe-a-custom-event)
- [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Overview

Magento 2's architecture revolves around **extensibility without core modification**. Three primary mechanisms achieve this:

| Mechanism | Purpose | Scope |
|---|---|---|
| **Plugin** | Intercept public method calls on any class | Method-level |
| **Preference** | Substitute one class/interface with another | Class-level |
| **Observer** | React to named events dispatched by core or custom code | Event-level |
| **Virtual Type** | Create named DI variants of a class without writing PHP | Config-level |

> All four mechanisms are wired together through `di.xml` and `events.xml` configuration files and are resolved at compile time.

---

## 2. Plugins (Interceptors)

A **plugin** (also called an *interceptor*) wraps a method call on a target class. Magento generates a proxy class at compile time that sits between the caller and the original object.

### 2.1 Plugin Types: before, around, after

| Type | Method Signature | Receives | Returns |
|---|---|---|---|
| `before` | `before{MethodName}` | Subject + original arguments | Modified arguments array (or `null`) |
| `around` | `around{MethodName}` | Subject + `$proceed` + original arguments | Must return a value |
| `after` | `after{MethodName}` | Subject + `$result` (+ original args in Magento 2.2+) | Modified result |

**Exam focus:**
- `before` plugins return an **array** of (possibly modified) arguments — even for a single argument you wrap it in `[]`. Returning `null` passes arguments unchanged.
- `after` plugins receive the **return value** of the original method as `$result` and must return a value.
- `around` plugins are the most powerful but also the most **expensive** — they create an additional stack frame even if `$proceed` is called immediately.

---

#### before Plugin

```php
<?php
namespace Vendor\Module\Plugin;

use Magento\Catalog\Model\Product;

class BeforeSetNamePlugin
{
    /**
     * Prefix every product name before it is set.
     *
     * @param  Product $subject  The original class instance
     * @param  mixed   $name     Original argument (Product::setName has no type hint)
     * @return array             Modified arguments — must be array
     */
    public function beforeSetName(Product $subject, $name): array
    {
        // Return modified arguments as an array
        return ['[SALE] ' . $name];
    }
}
```

---

#### after Plugin

```php
<?php
namespace Vendor\Module\Plugin;

use Magento\Catalog\Model\Product;

class AfterGetNamePlugin
{
    /**
     * Append a suffix to every product name retrieved.
     *
     * @param  Product $subject  The original class instance
     * @param  string  $result   Return value of the original method
     * @return string            Modified return value
     */
    public function afterGetName(Product $subject, string $result): string
    {
        return $result . ' — Limited Edition';
    }
}
```

---

#### around Plugin

```php
<?php
namespace Vendor\Module\Plugin;

use Magento\Catalog\Model\Product;

class AroundGetNamePlugin
{
    /**
     * Intercept getName — can short-circuit or delegate to $proceed.
     *
     * @param  Product  $subject  The original class instance
     * @param  callable $proceed  Calls the next plugin or original method
     * @return string
     */
    public function aroundGetName(Product $subject, callable $proceed): string
    {
        // --- code BEFORE the original ---
        $prefix = 'WRAPPED: ';

        // Call the next plugin in the chain (or original method)
        $result = $proceed();

        // --- code AFTER the original ---
        return $prefix . $result;
    }
}
```

**Exam focus:**
- If you **omit** calling `$proceed()` in an around plugin you **short-circuit** the entire chain — including all subsequent plugins and the original method. This is intentional only in specific override scenarios.
- `$proceed` always returns whatever the original method (or the next plugin in chain) returns.

---

### 2.2 Execution Order and sortOrder

When multiple plugins target the same method, execution order is determined by `sortOrder` (ascending integer). Lower numbers execute first.

```
Execution order for THREE plugins on Product::getName()
sortOrder: 10, 20, 30

  before10 -> before20 -> before30
                                   -> original method
  after30  <- after20  <- after10
```

For **around** plugins, the wrapping is nested:

```
around10 calls $proceed
  -> around20 calls $proceed
       -> around30 calls $proceed
            -> original method
       <- around30 returns
  <- around20 returns
<- around10 returns
```

**Exam focus:**
- `before` executes in **ascending** sortOrder (10 before 20).
- `after` executes in **descending** sortOrder (30 before 20 before 10) — it unwinds like a stack.
- `around` wraps from outermost (lowest sortOrder) to innermost (highest sortOrder).
- If two plugins share the same `sortOrder`, load order is determined by the module's position in `sequence` declarations in `module.xml`.

---

### 2.3 The $proceed callable (around plugins)

`$proceed` is a **closure** injected by the generated interceptor. Each call to `$proceed` walks the plugin chain, eventually invoking the original method.

```php
<?php
namespace Vendor\Module\Plugin;

use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Catalog\Api\Data\ProductInterface;

class AroundSavePlugin
{
    public function aroundSave(
        ProductRepositoryInterface $subject,
        callable $proceed,
        ProductInterface $product,        // forward original method params
        $saveOptions = false              // match interface: no type hint on $saveOptions
    ): ProductInterface {
        // Validate before save
        if (empty($product->getSku())) {
            throw new \InvalidArgumentException('SKU cannot be empty.');
        }

        // Delegate to original (or next plugin)
        $savedProduct = $proceed($product, $saveOptions);

        // Post-processing
        return $savedProduct;
    }
}
```

**Exam focus:**
- All original method parameters must be **re-declared** in the around method signature **after** `$proceed`.
- You **must** pass those parameters to `$proceed(...)` — otherwise the original method receives no arguments.
- Match the plugin's parameter types to the original method signature. `ProductRepositoryInterface::save()` declares `$saveOptions` without a type hint — match this in the plugin to avoid silent type errors.

---

### 2.4 Plugin Limitations

Not every method can be intercepted. Plugins **cannot** be placed on:

| Limitation | Reason |
|---|---|
| `final` methods | Cannot be overridden by generated interceptor |
| `final` classes | Interceptor class cannot extend them |
| `static` methods | Interceptor operates on instance |
| Non-public methods (`protected`, `private`) | Interceptor only wraps the public API |
| Constructors (`__construct`) | Use `around` on factory methods or preferences instead |
| Virtual types | They are config aliases, not real PHP classes |

**Exam focus:**
- Attempting to add a plugin to a `final` method or class results in a **compile-time error**.
- Plugins on `static` methods are **silently ignored** (no compile error, but they never fire).
- Use a **preference** when you need to modify `protected`/`private` methods.

---

### 2.5 Declaring a Plugin in di.xml

```xml
<!-- app/code/Vendor/Module/etc/di.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">

    <type name="Magento\Catalog\Model\Product">
        <plugin name="vendor_module_product_name_plugin"
                type="Vendor\Module\Plugin\AroundGetNamePlugin"
                sortOrder="10"
                disabled="false" />
    </type>

</config>
```

- `name` — unique identifier (used to disable the plugin from another module).
- `type` — fully qualified plugin class name.
- `sortOrder` — integer; lower fires first for `before`/`around`, last for `after`.
- `disabled="true"` — disables a plugin declared in another module without removing the XML.

**Scope-specific di.xml locations:**

| Scope | Path |
|---|---|
| Global | `etc/di.xml` |
| Frontend | `etc/frontend/di.xml` |
| Adminhtml | `etc/adminhtml/di.xml` |
| Webapi REST | `etc/webapi_rest/di.xml` |
| GraphQL | `etc/graphql/di.xml` |

---

### 2.6 Plugin Chaining Diagram

```
Caller
  |
  v
+------------------------------------------------------+
|  Generated Interceptor (ProductPlugin_Interceptor)   |
|                                                      |
|  1. Run before10, before20, before30                 |
|  2. Enter around10 -> around20 -> around30           |
|  3. Call original Product::getName()                 |
|  4. Unwind around30 <- around20 <- around10          |
|  5. Run after30, after20, after10                    |
+------------------------------------------------------+
  |
  v
Result returned to Caller
```

---

## 3. Preferences (Dependency Injection)

A **preference** tells Magento's Object Manager to substitute one class with another. It is the most powerful — and most disruptive — extension mechanism.

### 3.1 di.xml Preference vs Virtual Types

```xml
<!-- Preference: Replace Magento's Product model entirely -->
<preference for="Magento\Catalog\Model\Product"
            type="Vendor\Module\Model\CustomProduct" />

<!-- Virtual Type: Create a named DI variant (covered in §5) -->
<virtualType name="Vendor\Module\Model\SpecialLogger"
             type="Magento\Framework\Logger\Monolog">
    <arguments>
        <argument name="name" xsi:type="string">special_channel</argument>
    </arguments>
</virtualType>
```

**Exam focus:**
- Only **one** preference per interface/class can be active at runtime. If two modules declare a preference for the same class, the **last one loaded wins** (based on module sequence).
- Prefer **plugins** over preferences when possible — preferences are a "last resort" because they break the chain if another module also declares a preference for the same class.

---

### 3.2 Constructor Injection

Magento 2 uses **constructor injection** exclusively. The Object Manager reads constructor signatures via reflection and resolves dependencies automatically.

```php
<?php
namespace Vendor\Module\Model;

use Magento\Framework\App\Config\ScopeConfigInterface;
use Psr\Log\LoggerInterface;

class MyService
{
    private ScopeConfigInterface $scopeConfig;
    private LoggerInterface $logger;

    /**
     * All dependencies declared in constructor — OM resolves them.
     */
    public function __construct(
        ScopeConfigInterface $scopeConfig,
        LoggerInterface $logger
    ) {
        $this->scopeConfig = $scopeConfig;
        $this->logger      = $logger;
    }

    public function doSomething(): void
    {
        $value = $this->scopeConfig->getValue('my/path/value');
        $this->logger->info('Value: ' . $value);
    }
}
```

**Exam focus:**
- Never use `ObjectManager::getInstance()` directly in production code — it defeats testability and bypasses DI.
- Scalar arguments (strings, integers) **cannot** be auto-resolved; they must be declared in `di.xml` `<arguments>`.

```xml
<type name="Vendor\Module\Model\MyService">
    <arguments>
        <argument name="configPath" xsi:type="string">my/path/value</argument>
        <argument name="retries" xsi:type="number">3</argument>
    </arguments>
</type>
```

---

### 3.3 Interface Binding

The recommended practice is to **type-hint against interfaces**, then bind the concrete implementation in `di.xml`.

```php
<?php
// Interface
namespace Vendor\Module\Api;

interface PricingStrategyInterface
{
    public function calculate(float $basePrice): float;
}
```

```php
<?php
// Concrete implementation
namespace Vendor\Module\Model;

use Vendor\Module\Api\PricingStrategyInterface;

class DiscountPricingStrategy implements PricingStrategyInterface
{
    public function calculate(float $basePrice): float
    {
        return $basePrice * 0.9;
    }
}
```

```xml
<!-- di.xml binding -->
<preference for="Vendor\Module\Api\PricingStrategyInterface"
            type="Vendor\Module\Model\DiscountPricingStrategy" />
```

**Exam focus:**
- Interface binding is the **correct** way to make your code swappable. Any third-party can substitute the implementation by declaring their own preference for the interface.
- Without a preference, requesting an interface from the Object Manager throws a `LogicException`.

---

## 4. Observers and Events

Events decouple systems. The dispatching code doesn't know — or care — who is listening.

### 4.1 events.xml Declaration

```xml
<!-- app/code/Vendor/Module/etc/events.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Event/etc/events.xsd">

    <event name="catalog_product_save_after">
        <observer name="vendor_module_product_save_observer"
                  instance="Vendor\Module\Observer\ProductSaveAfter"
                  disabled="false"
                  shared="false" />
    </event>

</config>
```

- `name` — must match exactly what is dispatched via `$this->eventManager->dispatch('catalog_product_save_after', ...)`.
- `instance` — fully qualified observer class.
- `shared` — see §4.3.
- `disabled="true"` — disables an observer from another module.

**Scope-specific events.xml:**

| Scope | Path |
|---|---|
| Global | `etc/events.xml` |
| Frontend | `etc/frontend/events.xml` |
| Adminhtml | `etc/adminhtml/events.xml` |

**Exam focus:**
- Global `events.xml` fires in **all** areas (frontend, adminhtml, cron, API).
- Use area-specific files to limit observer execution to one area and improve performance.

---

### 4.2 Observer Class Structure

Every observer must implement `\Magento\Framework\Event\ObserverInterface`.

```php
<?php
namespace Vendor\Module\Observer;

use Magento\Framework\Event\ObserverInterface;
use Magento\Framework\Event\Observer;
use Psr\Log\LoggerInterface;

class ProductSaveAfter implements ObserverInterface
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    /**
     * ObserverInterface::execute() does not declare `: void` in the interface signature,
     * but implementations should treat it as void (no return value).
     *
     * @param  Observer $observer  Contains event data
     */
    public function execute(Observer $observer): void
    {
        /** @var \Magento\Catalog\Model\Product $product */
        $product = $observer->getEvent()->getProduct();

        $this->logger->info(
            sprintf('Product saved: %s (SKU: %s)', $product->getName(), $product->getSku())
        );
    }
}
```

**Exam focus:**
- The `execute()` method signature is **always** `execute(Observer $observer): void`.
- Access event data via `$observer->getEvent()->getData('key')` or magic getters like `->getProduct()`.
- `->getProduct()` works for `catalog_product_save_after` because `Product::_eventObject = 'product'` — Magento passes the product under the key `'product'` in `_getEventData()`.
- Observers **cannot return values** — they are fire-and-forget.

---

### 4.3 Shared vs Non-Shared Observers

| Attribute | Behavior | Default |
|---|---|---|
| `shared="true"` | Single instance reused across all event dispatches (Singleton) | Yes (default) |
| `shared="false"` | New instance created for each dispatch | No |

```xml
<!-- Non-shared: fresh instance per dispatch — use for stateful observers -->
<observer name="vendor_module_cart_observer"
          instance="Vendor\Module\Observer\CartUpdateObserver"
          shared="false" />
```

**Exam focus:**
- Use `shared="false"` when your observer holds **state** (e.g., accumulates data during the request). A shared observer could carry stale state from a previous dispatch of the same event.
- Most observers should be **stateless** and `shared="true"` (the default) for memory efficiency.

---

### 4.4 Dispatching Custom Events

```php
<?php
namespace Vendor\Module\Model;

use Magento\Framework\Event\ManagerInterface as EventManager;

class OrderProcessor
{
    private EventManager $eventManager;

    public function __construct(EventManager $eventManager)
    {
        $this->eventManager = $eventManager;
    }

    public function process(array $orderData): void
    {
        // Business logic...

        // Dispatch custom event — pass data as associative array
        $this->eventManager->dispatch(
            'vendor_module_order_processed',  // event name — use snake_case
            [
                'order_data' => $orderData,   // key becomes magic getter getOrderData()
                'processor'  => $this,
            ]
        );
    }
}
```

Corresponding observer retrieval:

```php
// Inside Observer::execute()
$orderData = $observer->getEvent()->getOrderData();  // camelCase of snake_key
$processor = $observer->getEvent()->getProcessor();
```

**Exam focus:**
- Event names must be **snake_case** and unique across Magento.
- Convention: `{vendor}_{module}_{action}` (e.g., `acme_sales_invoice_created`).
- Data keys passed to `dispatch()` are accessed via `->get{CamelCasedKey}()` on the event object.

---

### 4.5 Observer vs Plugin — When to Use Which

| Scenario | Use | Reason |
|---|---|---|
| Modify method input arguments | Plugin (`before`) | Plugins can alter parameters before execution |
| Modify method return value | Plugin (`after`) | Plugins can intercept and modify the return |
| Short-circuit/prevent method execution | Plugin (`around`) | Can skip `$proceed()` |
| React to something that happened (audit, log, email) | Observer | Decoupled, no need to modify flow |
| Cross-cutting concern on a public method | Plugin | Observer requires explicit dispatch |
| Event already dispatched by core code | Observer | Easiest integration point |
| Non-public method modification | Preference | Plugins cannot target non-public methods |
| Full class replacement | Preference | Override entire behavior |

**Exam focus:**
- **Plugins** are preferred for intercepting existing public method calls — they don't require the original code to be changed.
- **Observers** are preferred for **event-driven decoupling** where you don't need to modify behavior, just react.
- **Preferences** are the most invasive — two preferences for the same class/interface will conflict.

---

## 5. Virtual Types

### 5.1 What is a Virtual Type?

A **virtual type** creates a named DI configuration alias for an existing class, with specific constructor arguments overridden. No new PHP file is created — the "type" only exists in DI configuration.

**Use case:** You need two instances of the same class (e.g., a logger) but with different constructor arguments (e.g., different channel names), without writing two PHP classes.

---

### 5.2 Virtual Type Examples

#### Example 1: Two differently configured loggers

```xml
<virtualType name="Vendor\Module\Logger\OrderLogger"
             type="Magento\Framework\Logger\Monolog">
    <arguments>
        <argument name="name" xsi:type="string">order_channel</argument>
        <argument name="handlers" xsi:type="array">
            <item name="system" xsi:type="object">Magento\Framework\Logger\Handler\Base</item>
        </argument>
    </arguments>
</virtualType>

<virtualType name="Vendor\Module\Logger\PaymentLogger"
             type="Magento\Framework\Logger\Monolog">
    <arguments>
        <argument name="name" xsi:type="string">payment_channel</argument>
    </arguments>
</virtualType>
```

`Magento\Framework\Logger\Monolog` constructor: `(string $name, array $handlers = [], array $processors = [], ?DateTimeZone $timezone = null)` — `name` and `handlers` are the primary args to override.

#### Example 2: Injecting a virtual type into a class

```xml
<type name="Vendor\Module\Model\OrderService">
    <arguments>
        <!-- Inject the virtual type by its declared name -->
        <argument name="logger" xsi:type="object">Vendor\Module\Logger\OrderLogger</argument>
    </arguments>
</type>
```

```php
<?php
namespace Vendor\Module\Model;

use Psr\Log\LoggerInterface;

class OrderService
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        // At runtime, this is a Monolog instance configured with "order_channel"
        $this->logger = $logger;
    }
}
```

**Exam focus:**
- Virtual types are **invisible at runtime** — they resolve to an instance of their `type` with the overridden arguments.
- You **cannot** add a plugin to a virtual type directly (plugins are added to the real class name).
- Virtual types are frequently used with **factory classes**, **loggers**, and **context objects** in Magento core.
- `name` of the virtual type can be any string, but conventions use a class-path-like format to avoid collisions.

---

## 6. DI Compilation

### 6.1 What setup:di:compile Does

```bash
bin/magento setup:di:compile
```

This command performs the following operations:

1. **Scans** all `di.xml` files across all modules and areas.
2. **Validates** DI configuration (type hints, plugin targets, argument types).
3. **Generates** interceptor classes for all plugins.
4. **Generates** factory and proxy classes as needed.
5. **Builds** the compiled DI configuration into PHP arrays for fast lookup.
6. **Generates** repository and extension attributes interfaces (from `extension_attributes.xml`).

**Exam focus:**
- You **must** run `setup:di:compile` after adding or modifying plugins, preferences, or virtual types in production (or developer mode with compilation enabled).
- In **developer mode**, Magento auto-generates interceptors on the fly (slower, but no manual compile needed).
- In **production mode**, if you skip compilation after a DI change, you will get errors like `Class ... does not exist`.

---

### 6.2 Generated Files and Directories

```
generated/
+-- code/
|   +-- Magento/
|       +-- Catalog/
|           +-- Model/
|               +-- Product/
|                   +-- Interceptor.php    <-- generated plugin proxy
+-- metadata/
    +-- global.php                         <-- compiled DI config per area
    +-- frontend.php
    +-- adminhtml.php
    +-- app_action_list.php                <-- action list for routing
    ...
```

| Generated Artifact | Purpose |
|---|---|
| `Interceptor.php` | Proxy class that chains all plugins for a given class |
| `Factory.php` | Factory for non-injectable (new-able) objects |
| `Proxy.php` | Lazy-loading proxy (defers instantiation until first use) |
| `ExtensionInterface.php` | Generated from `extension_attributes.xml` |
| `compiled_config/` | Serialized DI config for O(1) lookup at runtime |

---

### 6.3 Interceptor Generation Example

Given:

```xml
<type name="Magento\Catalog\Model\Product">
    <plugin name="vendor_plugin" type="Vendor\Module\Plugin\AroundGetNamePlugin" sortOrder="10" />
</type>
```

Magento generates (simplified):

```php
<?php
// generated/code/Magento/Catalog/Model/Product/Interceptor.php
namespace Magento\Catalog\Model\Product;

class Interceptor extends \Magento\Catalog\Model\Product
    implements \Magento\Framework\Interception\InterceptorInterface
{
    use \Magento\Framework\Interception\Interceptor;

    public function __construct(/* ... original args ... */)
    {
        $this->___init();  // initializes plugin chain
        parent::__construct(/* ... */);
    }

    public function getName(): string
    {
        // Resolved plugin chain: calls before, around, after plugins
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'getName');
        return $pluginInfo
            ? $this->___callPlugins('getName', func_get_args(), $pluginInfo)
            : parent::getName();
    }
}
```

**Exam focus:**
- The interceptor **extends** the original class — it is a legitimate subclass, not a decorator.
- When the Object Manager creates a `Product`, it actually creates a `Product\Interceptor` if any plugins are registered.
- The interceptor is what makes `$subject` in your plugin the **original object instance** (via `$this` in the generated code).

---

## 7. Decision Matrix — Plugins vs Preferences vs Observers

```
                    Need to modify a method's behavior?
                              |
                 +------------+------------+
                 |                         |
              YES                         NO
                 |                         |
     Is the method public?         Is there an event dispatched?
         |       |                        |          |
        YES     NO                       YES        NO
         |       |                        |          |
       PLUGIN  PREFERENCE             OBSERVER    (Dispatch
                 |                               your own event
         Does only ONE module         or use plugin)
         need to override?
              |        |
             YES       NO
              |        |
          PREFERENCE  PLUGIN
          (with care)  (preferred)
```

**Summary rules:**

1. **Plugin first** — for any public method interception.
2. **Observer** — when reacting to events without needing to alter the flow.
3. **Preference** — only when you need to replace non-public logic, or when no event/plugin point exists.
4. **Virtual type** — when you need multiple configurations of the same class without new PHP files.

---

## 8. Practice Exercises (Annotated)

### 8.1 Around Plugin on a Core Method

**Goal:** Intercept `Magento\Catalog\Model\Product::getName()`, log the call, and return a modified name.

**Step 1:** Create the plugin class.

```php
<?php
// app/code/Vendor/Module/Plugin/LogAndModifyProductName.php
namespace Vendor\Module\Plugin;

use Magento\Catalog\Model\Product;
use Psr\Log\LoggerInterface;

class LogAndModifyProductName
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    public function aroundGetName(Product $subject, callable $proceed): string
    {
        $this->logger->debug('[Plugin] aroundGetName called for ID: ' . $subject->getId());

        // Call the original method (or next plugin)
        $originalName = $proceed();

        $this->logger->debug('[Plugin] original name: ' . $originalName);

        return strtoupper($originalName);
    }
}
```

**Step 2:** Register in `di.xml`.

```xml
<!-- app/code/Vendor/Module/etc/di.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
    <type name="Magento\Catalog\Model\Product">
        <plugin name="vendor_module_log_product_name"
                type="Vendor\Module\Plugin\LogAndModifyProductName"
                sortOrder="10" />
    </type>
</config>
```

**Step 3:** Register module and compile.

```bash
bin/magento module:enable Vendor_Module
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento cache:flush
```

---

### 8.2 Two Plugins on the Same Method (Order Observation)

**Goal:** Observe how `sortOrder` controls execution sequence.

```php
<?php
// Plugin A — sortOrder 10
namespace Vendor\Module\Plugin;

use Magento\Catalog\Model\Product;

class PluginA
{
    public function beforeGetName(Product $subject): array
    {
        echo "[PluginA before]";
        return [];  // no argument changes, return empty array (no-arg method)
    }

    public function afterGetName(Product $subject, string $result): string
    {
        echo "[PluginA after]";
        return $result . '_A';
    }
}
```

```php
<?php
// Plugin B — sortOrder 20
namespace Vendor\Module\Plugin;

use Magento\Catalog\Model\Product;

class PluginB
{
    public function beforeGetName(Product $subject): array
    {
        echo "[PluginB before]";
        return [];
    }

    public function afterGetName(Product $subject, string $result): string
    {
        echo "[PluginB after]";
        return $result . '_B';
    }
}
```

```xml
<type name="Magento\Catalog\Model\Product">
    <plugin name="vendor_plugin_a" type="Vendor\Module\Plugin\PluginA" sortOrder="10" />
    <plugin name="vendor_plugin_b" type="Vendor\Module\Plugin\PluginB" sortOrder="20" />
</type>
```

**Expected output when `$product->getName()` is called:**

```
[PluginA before][PluginB before]  <- ascending order for before
  (original getName executes)
[PluginB after][PluginA after]    <- descending order for after
Final result: "ProductName_B_A"   <- B applied first, then A wraps it
```

**Exam focus:** The *last* `after` plugin to fire (lowest sortOrder = PluginA) applies its transformation **outermost** — so `_A` ends up at the end.

---

### 8.3 Dispatch and Observe a Custom Event

**Step 1:** Dispatch the event.

```php
<?php
namespace Vendor\Module\Model;

use Magento\Framework\Event\ManagerInterface as EventManager;

class CheckoutService
{
    private EventManager $eventManager;

    public function __construct(EventManager $eventManager)
    {
        $this->eventManager = $eventManager;
    }

    public function completeCheckout(array $cart): void
    {
        // ... process checkout ...

        $this->eventManager->dispatch(
            'vendor_module_checkout_complete',
            ['cart' => $cart, 'total' => array_sum(array_column($cart, 'price'))]
        );
    }
}
```

**Step 2:** Create the observer.

```php
<?php
namespace Vendor\Module\Observer;

use Magento\Framework\Event\ObserverInterface;
use Magento\Framework\Event\Observer;
use Psr\Log\LoggerInterface;

class CheckoutCompleteObserver implements ObserverInterface
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    public function execute(Observer $observer): void
    {
        $total = $observer->getEvent()->getTotal();  // from dispatch key 'total'
        $cart  = $observer->getEvent()->getCart();   // from dispatch key 'cart'

        $this->logger->info(sprintf(
            'Checkout complete. Items: %d, Total: %.2f',
            count($cart),
            $total
        ));
    }
}
```

**Step 3:** Register in `events.xml`.

```xml
<!-- app/code/Vendor/Module/etc/events.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Event/etc/events.xsd">

    <event name="vendor_module_checkout_complete">
        <observer name="vendor_module_checkout_logger"
                  instance="Vendor\Module\Observer\CheckoutCompleteObserver"
                  shared="false" />
    </event>

</config>
```

**Step 4:** Flush and test.

```bash
bin/magento setup:di:compile
bin/magento cache:flush
```

---

## Quick-Reference Checklist

### Plugins (Interceptors)
- [ ] Three plugin types: `before` (modify args), `after` (modify result), `around` (full control)
- [ ] `before` returns an **array** of arguments (or `null` to pass unchanged)
- [ ] `after` receives `$result` as second parameter; must return a value
- [ ] `around` receives `callable $proceed`; must call it to avoid short-circuiting
- [ ] `sortOrder` — lower fires `before`/`around` first; fires `after` **last** (reverse order)
- [ ] Plugins **cannot** target: `final` methods/classes, `static` methods, non-public methods, constructors, virtual types
- [ ] Declare plugins in `di.xml` using `<type><plugin /></type>`
- [ ] Use `disabled="true"` to disable another module's plugin
- [ ] Area-specific `di.xml`: `etc/frontend/di.xml`, `etc/adminhtml/di.xml`
- [ ] All original method params must be re-declared in `around` signature after `$proceed`
- [ ] Plugin param types should match the original method signature (avoid adding type hints not in the interface)

### Preferences (DI)
- [ ] `<preference for="Interface" type="ConcreteClass" />` in `di.xml`
- [ ] Last preference loaded wins — module sequence matters
- [ ] Always type-hint against **interfaces**; bind implementations via preferences
- [ ] Constructor injection is the **only** DI pattern used in production Magento code
- [ ] Scalar arguments injected via `<arguments><argument xsi:type="string" /></arguments>`
- [ ] `xsi:type="number"` is valid for numeric arguments (defined in `Data/etc/argument/types.xsd`)
- [ ] Preferences are more invasive than plugins — two preferences for the same class conflict

### Virtual Types
- [ ] `<virtualType name="..." type="RealClass">` — no new PHP file required
- [ ] Used to create multiple configurations of the same class (e.g., different loggers)
- [ ] Cannot add plugins directly to a virtual type
- [ ] Inject virtual types by their declared `name` using `xsi:type="object"` in arguments

### Observers and Events
- [ ] Declare observers in `etc/events.xml` (global) or area-specific path
- [ ] Observer class must implement `ObserverInterface` with `execute(Observer $observer): void`
- [ ] `ObserverInterface::execute()` has no PHP `: void` return in the interface — add it in implementations
- [ ] Access event data: `$observer->getEvent()->get{CamelCasedKey}()`
- [ ] `catalog_product_save_after` passes product under key `'product'` → `->getProduct()` (via `Product::$_eventObject`)
- [ ] Dispatch events: `$eventManager->dispatch('event_name', ['key' => $value])`
- [ ] Event naming convention: `snake_case`, `vendor_module_action`
- [ ] `shared="false"` — new instance per dispatch (use for stateful observers)
- [ ] `shared="true"` — singleton (default; preferred for stateless observers)
- [ ] Observers **cannot** return values or modify method flow
- [ ] Global `events.xml` fires in **all** areas — use area-specific for performance

### Observer vs Plugin Decision
- [ ] **Plugin** — modify input arguments, modify return value, prevent method execution
- [ ] **Observer** — react to events, decouple side effects (logging, email, cache invalidation)
- [ ] **Preference** — replace non-public logic, full class substitution
- [ ] Plugins require no changes to original dispatching code; observers require `dispatch()` call

### DI Compilation
- [ ] Command: `bin/magento setup:di:compile`
- [ ] Generates: `Interceptor.php`, `Factory.php`, `Proxy.php`, compiled config arrays
- [ ] PHP classes land in `generated/code/`; compiled DI config arrays land in `generated/metadata/`
- [ ] Area config files: `generated/metadata/global.php`, `frontend.php`, `adminhtml.php`
- [ ] Interceptors **extend** the original class — they are subclasses
- [ ] Developer mode auto-generates on the fly; production mode requires explicit compilation
- [ ] Must re-compile after any DI configuration change in production
