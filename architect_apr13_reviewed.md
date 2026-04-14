# Plugin System + Events vs Observers
### Magento 2 Certified Professional Architect — Study Notes

---

## Table of Contents

1. [Mental Model: Where Plugins and Events Fit](#1-mental-model-where-plugins-and-events-fit)
2. [Plugin Fundamentals](#2-plugin-fundamentals)
3. [Plugin Type Signatures — The Critical Details](#3-plugin-type-signatures---the-critical-details)
4. [Around Plugins — The Silent Chain-Break Problem](#4-around-plugins---the-silent-chain-break-problem)
5. [Plugin Sort Order and Tiebreaker Rules](#5-plugin-sort-order-and-tiebreaker-rules)
6. [Plugin Restrictions — What You Cannot Intercept](#6-plugin-restrictions---what-you-cannot-intercept)
7. [Events and Observers](#7-events-and-observers)
8. [Events vs Plugins — The Architectural Decision Rule](#8-events-vs-plugins---the-architectural-decision-rule)
9. [Real-World Tracing: Around Plugin in module-quote](#9-real-world-tracing-around-plugin-in-module-quote)
10. [Disabling a Core Observer](#10-disabling-a-core-observer)
11. [Scenario-Based Exam Practice](#11-scenario-based-exam-practice)
12. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Mental Model: Where Plugins and Events Fit

Before memorizing signatures, anchor everything to **intent**. The architect exam will test *why* you choose one mechanism over the other, not just whether you know the syntax.

```
REQUEST LIFECYCLE (simplified)
----------------------------------------------------------------------
   Controller -> Service -> Model -> Resource
                   |
         [ Plugin Interception ]      <-- wraps method calls
         [ Event Dispatch ]           <-- fires at named points
----------------------------------------------------------------------

Plugin:  YOU wrap the method. You control inputs/outputs.
Event:   Magento tells YOU something happened. You react.
```

### Core Principle

| Mechanism | Relationship to Core Code | Return Value Control | Order Guaranteed |
|-----------|--------------------------|----------------------|------------------|
| Plugin | **Wraps** the method | Yes (after/around) | Yes (sortOrder) |
| Event/Observer | **Notified** of method | No | No |

**Exam focus:** The single most important architectural distinction — plugins intercept and can *modify return values*; observers cannot modify return values and their execution order is not guaranteed.

---

## 2. Plugin Fundamentals

### Declaration in `di.xml`

```xml
<!-- app/code/Vendor/Module/etc/di.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">

    <type name="Magento\Catalog\Model\Product">
        <plugin name="vendor_module_product_plugin"
                type="Vendor\Module\Plugin\ProductPlugin"
                sortOrder="10"
                disabled="false" />
    </type>

</config>
```

**Exam focus:**
- `name` must be unique across the whole Magento installation for that intercepted class.
- `disabled="true"` can be used to disable *another module's plugin* — same pattern as disabling observers.
- The intercepted class (`type` attribute on `<type>`) can be a class, abstract class, or interface. If an interface is targeted, ALL implementations are intercepted.

### How Magento Generates Interceptors

Magento generates an *interceptor class* (a subclass using the Interceptor trait) at compile time:

```
vendor/magento/module-catalog/Model/Product.php
       |
       v  (bin/magento setup:di:compile)
       |
generated/code/Magento/Catalog/Model/Product/Interceptor.php
```

The interceptor calls `___callPlugins()` which orchestrates the plugin chain. This is why:
- Plugins only work on **public** methods (the interceptor cannot override non-public methods).
- Plugins cannot work on **final** methods (you cannot override a final method in a subclass).
- Plugins cannot work on the **constructor** (the interceptor generates its own `__construct`).

---

## 3. Plugin Type Signatures — The Critical Details

This section is the most heavily tested on the exam. Every signature has a specific pattern — learn them exactly.

### 3.1 Before Plugin

**Purpose:** Modify input arguments *before* the original method runs.

```php
<?php
namespace Vendor\Module\Plugin;

use Magento\Catalog\Model\Product;

class ProductPlugin
{
    /**
     * SIGNATURE RULES:
     * 1. Method name = "before" + ucfirst(interceptedMethodName)
     * 2. First argument = instance of the intercepted class ($subject)
     * 3. Subsequent arguments = same arguments as the intercepted method
     * 4. Return: array of modified args, OR null (to leave args unchanged)
     */
    public function beforeSetName(
        Product $subject,
        string $name           // mirrors the original method's signature
    ): ?array                  // return type is ?array (nullable)
    {
        // Modify the argument
        $name = strtoupper($name);

        // Return ARRAY of arguments to pass to the next plugin/original method
        return [$name];

        // Returning null leaves arguments unchanged — equivalent to no-op
        // return null;
    }
}
```

**Exam focus:**
- Return type is `?array` (array or null) — **NOT** the individual value.
- Returning `['modified_value']` replaces the first argument with `'modified_value'`.
- If the original method takes **no arguments**, a before plugin still receives `$subject` alone and should return `null` or `[]`.

### 3.2 After Plugin

**Purpose:** Modify or inspect the *return value* after the original method runs.

```php
<?php
namespace Vendor\Module\Plugin;

use Magento\Catalog\Model\Product;

class ProductPlugin
{
    /**
     * SIGNATURE RULES:
     * 1. Method name = "after" + ucfirst(interceptedMethodName)
     * 2. First argument  = $subject (instance of intercepted class)
     * 3. Second argument = $result  (THE RETURN VALUE of the original method)
     *                               *** NOT the original input arguments ***
     * 4. Subsequent args = original method arguments (optional, Magento 2.2+)
     * 5. Return: the (possibly modified) result
     */
    public function afterGetName(
        Product $subject,
        string $result          // <-- THIS IS THE RETURN VALUE, not an input arg
    ): string
    {
        // Append a suffix to the returned name
        return $result . ' [SALE]';
    }
}
```

**The Most Common Exam Trap — After Plugin Receives RESULT, Not Args:**

```php
// WRONG mental model (common mistake):
public function afterGetName(Product $subject, string $originalArgument): string

// CORRECT mental model:
public function afterGetName(Product $subject, string $result): string
// $result = whatever getName() returned
```

**Exam focus:** The after plugin's second parameter is always the **result** (return value). This is the single most commonly confused fact about plugin signatures.

**After plugin with original arguments (Magento 2.2+):**

```php
public function afterSomeMethod(
    SubjectClass $subject,
    $result,                    // return value
    $originalArg1,              // original first argument
    $originalArg2               // original second argument
): mixed
{
    // You can use original args for context, but cannot change them
    // The original method has already executed
    return $result;
}
```

### 3.3 Around Plugin

**Purpose:** Wrap the original method completely — run code before AND after, or replace behavior entirely.

```php
<?php
namespace Vendor\Module\Plugin;

use Magento\Catalog\Model\Product;
use Closure;

class ProductPlugin
{
    /**
     * SIGNATURE RULES:
     * 1. Method name = "around" + ucfirst(interceptedMethodName)
     * 2. First argument  = $subject (intercepted class instance)
     * 3. Second argument = $proceed (Closure — the next plugin or original method)
     * 4. Subsequent args = original method arguments (must match exactly)
     * 5. Return: whatever the method should return
     */
    public function aroundGetName(
        Product $subject,
        Closure $proceed,       // <-- MUST call this or chain breaks silently
        // no additional args because getName() takes no args
    ): string
    {
        // --- Code BEFORE original method ---
        $this->logger->debug('Before getName');

        // --- Call the next plugin in chain (or the original method) ---
        $result = $proceed();   // <-- CRITICAL: must pass original args if any

        // --- Code AFTER original method ---
        $this->logger->debug('After getName, result: ' . $result);

        return $result;         // <-- must return a value
    }
}
```

**Around with arguments that must be forwarded:**

```php
public function aroundSave(
    \Magento\Catalog\Model\ResourceModel\Product $subject,
    Closure $proceed,
    \Magento\Framework\Model\AbstractModel $object  // original arg
): mixed
{
    // Pre-processing
    if ($object->getData('skip_save')) {
        return $subject;   // Short-circuit: skip original entirely
    }

    // Must forward ALL original arguments to $proceed
    $result = $proceed($object);  // <-- pass the args

    // Post-processing
    return $result;
}
```

### Summary Table: Plugin Signatures

| Type | Method Prefix | 2nd Parameter | Return Type |
|------|--------------|---------------|-------------|
| before | `before` | First original arg | `?array` (null = no change) |
| after | `after` | **Result** (return value) | Same as intercepted method |
| around | `around` | `Closure $proceed` | Same as intercepted method |

---

## 4. Around Plugins — The Silent Chain-Break Problem

This is a critical architectural hazard. If `$proceed()` is not called, **Magento does not throw an exception**. The chain simply stops, and every plugin further down the chain (including the original method) is silently skipped.

```
Plugin Chain Example (sortOrder determines order):
----------------------------------------------------------------------

  [before:10]  -->  [before:20]  -->  [ORIGINAL METHOD]
                                           ^
  [after:20]   <--  [after:10]   <--------+

  With Around:
  [around:10 START]
      [around:20 START]
          [ORIGINAL METHOD]  <-- only runs if around:20 calls $proceed()
      [around:20 END]        <-- only runs if around:10 calls $proceed()
  [around:10 END]
----------------------------------------------------------------------
```

**The Silent Break:**

```php
// BAD: Forgot to call $proceed()
public function aroundGetPrice(Product $subject, Closure $proceed): float
{
    if ($this->someCondition()) {
        return 0.0;  // OK to short-circuit intentionally (document this clearly)
    }

    // BUG: if someCondition() is false AND we forget the else branch:
    // $proceed() is never called
    // Original method never runs
    // Any plugins with higher sortOrder never run
    // No error is thrown
}

// GOOD: Always handle all code paths
public function aroundGetPrice(Product $subject, Closure $proceed): float
{
    if ($this->someCondition()) {
        return 0.0;  // Intentional short-circuit, documented
    }

    return $proceed();  // Normal path: delegate to next in chain
}
```

**Exam focus:**
- Forgetting `$proceed()` breaks the chain **silently** — no exception, no log entry by default.
- This is why Magento's own coding standards discourage around plugins unless you genuinely need to wrap behavior on *both* sides of the original call, or need to short-circuit.
- Prefer `before` + `after` over `around` whenever possible — it is the architecturally correct choice and avoids chain-break risk.

---

## 5. Plugin Sort Order and Tiebreaker Rules

### How sortOrder Works

Plugins execute in **ascending sortOrder** for `before` and `around` (pre-execution), and **descending sortOrder** for `after` (post-execution — they unwind in reverse).

```
Given three plugins with sortOrders 10, 20, 30:

BEFORE phase (ascending):  Plugin(10) -> Plugin(20) -> Plugin(30) -> Original
AFTER phase  (descending): Original -> Plugin(30) -> Plugin(20) -> Plugin(10)

This creates a proper "wrapping" stack:

  Plugin10.before
    Plugin20.before
      Plugin30.before
        [ ORIGINAL METHOD ]
      Plugin30.after
    Plugin20.after
  Plugin10.after
```

### The Sequence-Based Tiebreaker

**When two plugins have the same sortOrder**, Magento's `PluginListGenerator` uses `uasort()` with a comparator that only evaluates `sortOrder`. When values are equal (comparator returns 0), `uasort` preserves the **insertion order** of plugins in the merged array. Plugins are merged in **module sequence order** (the load order resolved from `module.xml` `<sequence>` declarations), so the **module that loads later in sequence** has its plugin treated as "outer" when sortOrders are equal.

```xml
<!-- Module Vendor_A loads BEFORE Vendor_B (Vendor_B sequences after Vendor_A) -->

<!-- Vendor_A di.xml -->
<type name="Magento\Catalog\Model\Product">
    <plugin name="vendor_a_plugin" type="Vendor\A\Plugin\P" sortOrder="10"/>
</type>

<!-- Vendor_B di.xml — loads after A -->
<type name="Magento\Catalog\Model\Product">
    <plugin name="vendor_b_plugin" type="Vendor\B\Plugin\P" sortOrder="10"/>
</type>
```

```
Result with equal sortOrder=10:
  Vendor_B (later in sequence) is the OUTER plugin:
  Before: Vendor_B.before -> Vendor_A.before -> [Original]
  After:  [Original] -> Vendor_A.after -> Vendor_B.after
```

> **Exam focus — common misconception:** The tiebreaker is **module sequence** (load order from `module.xml`), NOT alphabetical module name. The `PluginListGenerator::uasort()` comparator only uses `sortOrder`; when equal, insertion order (= sequence order) is preserved. There is no alphabetical sorting logic anywhere in the plugin list code.

### Practical sortOrder Strategy

```
Magento Core plugins:  typically sortOrder 10-100
Third-party plugins:   should use sortOrder > 100 to run after core
Your plugins (early):  sortOrder 5-9 to run before everything
Your plugins (late):   sortOrder 200+ to run as a final wrapper
```

---

## 6. Plugin Restrictions — What You Cannot Intercept

These are **hard restrictions** enforced by PHP's object model and Magento's interceptor generation:

| Restriction | Reason |
|-------------|--------|
| `__construct` | Interceptor generates its own constructor; cannot be overridden this way |
| `final` methods | PHP cannot override final methods in subclasses |
| `static` methods | Interceptor is instance-based; static calls bypass it |
| `non-public` methods (`protected`, `private`) | Interceptor cannot override non-public methods (PHP visibility rules) |
| `final` classes | Cannot be subclassed at all, so no interceptor can be generated |

```php
class SomeClass
{
    // CANNOT plugin:
    public function __construct() {}           // constructor
    final public function locked(): void {}    // final method
    public static function utility(): string{} // static method
    protected function internal(): void {}     // non-public
    private function secret(): void {}         // non-public

    // CAN plugin:
    public function normalMethod(): string {}  // public, non-final, non-static
}
```

**What to do when you cannot use a plugin:**

| Situation | Alternative |
|-----------|-------------|
| Need to alter constructor behavior | Use `di.xml` `<arguments>` or a preference/virtual type |
| Need to intercept a final method | Extend the class with a preference (risky) or use an event if one exists |
| Need to intercept static method | Refactor to instance method (if it's your code), or use event |
| Non-public method | Dispatch an event from within the class if you control it |

**Exam focus:** The restrictions list is a classic exam question. Know all five: `__construct`, `final` methods, `static` methods, non-public methods, and `final` classes.

---

## 7. Events and Observers

### Dispatching an Event

```php
<?php
namespace Vendor\Module\Model;

use Magento\Framework\Event\ManagerInterface;

class MyService
{
    public function __construct(
        private readonly ManagerInterface $eventManager
    ) {}

    public function processOrder(Order $order): void
    {
        // Do core logic...

        // Dispatch event — fire and forget
        $this->eventManager->dispatch(
            'vendor_module_order_processed',  // event name: lowercase, underscores
            ['order' => $order]               // data passed to observers
        );

        // You cannot modify $order's return value here through observers
    }
}
```

### Registering an Observer in `events.xml`

```xml
<!-- app/code/Vendor/Module/etc/events.xml (global scope) -->
<!-- OR: etc/frontend/events.xml, etc/adminhtml/events.xml, etc/webapi_rest/events.xml -->

<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Event/etc/events.xsd">

    <event name="vendor_module_order_processed">
        <observer name="vendor_module_send_email"
                  instance="Vendor\Module\Observer\SendOrderEmail"
                  disabled="false"
                  shared="true" />
        <!--
            shared="true"  = singleton (default) — same instance reused
            shared="false" = new instance per dispatch
        -->
    </event>

</config>
```

### Observer Class

```php
<?php
namespace Vendor\Module\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;

class SendOrderEmail implements ObserverInterface
{
    /**
     * REQUIRED: must implement execute(Observer $observer)
     * The interface does not enforce a PHP return type hint, but execute() is
     * expected to return nothing — observers cannot return values.
     */
    public function execute(Observer $observer): void
    {
        // Retrieve data from the event
        $order = $observer->getData('order');
        // OR: $order = $observer->getEvent()->getOrder();

        // Do something — but cannot affect the calling code's return value
        $this->emailService->send($order);
    }
}
```

**Exam focus:**
- `execute()` returns nothing — this is the architectural reason observers cannot modify return values. Note: `ObserverInterface` does not declare a PHP `: void` return type (it's a docblock convention), but your concrete class should always declare `: void` to make intent explicit.
- Observer **execution order is NOT guaranteed** — even if multiple observers listen to the same event, you cannot rely on one running before another.
- If order matters → use plugins instead.

### Disabling a Core Observer

```xml
<!-- app/code/Vendor/Module/etc/events.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Event/etc/events.xsd">

    <event name="sales_order_place_after">
        <!-- Disable a core observer by referencing its name and setting disabled="true" -->
        <observer name="magento_core_observer_name"
                  instance="Magento\Sales\Observer\SomeObserver"
                  disabled="true" />
    </event>

</config>
```

**Exam focus:**
- To disable an observer, you must know its **exact `name` attribute** from the original `events.xml`.
- The `instance` attribute is technically not required when disabling, but including it documents intent.
- To find the observer name: search core `events.xml` files:
  ```bash
  grep -r "sales_order_place_after" vendor/magento/ --include="events.xml"
  ```

### Event Scopes

```
Global:           etc/events.xml           (all areas)
Frontend:         etc/frontend/events.xml
Adminhtml:        etc/adminhtml/events.xml
REST API:         etc/webapi_rest/events.xml
GraphQL:          etc/graphql/events.xml
Crontab:          etc/crontab/events.xml   (cron area — same mechanism as other areas)
```

> **Note:** The crontab area uses `etc/crontab.xml` for **cron job definitions** and `etc/crontab/events.xml` for **area-scoped event observers**. These are separate files with separate purposes.

**Exam focus:** Placing an observer in the wrong scope is a common architectural mistake. If an observer should only fire in adminhtml, put it in `etc/adminhtml/events.xml`, not `etc/events.xml`.

---

## 8. Events vs Plugins — The Architectural Decision Rule

This is the highest-yield section for the architect exam. Questions here are scenario-based.

### The Primary Decision Tree

```
Do you need to MODIFY the return value of a method?
  |
  +-- YES --> Use a PLUGIN (after or around)
  |
  +-- NO --> Do you need to MODIFY the INPUT ARGUMENTS?
               |
               +-- YES --> Use a PLUGIN (before)
               |
               +-- NO --> Do you need to GUARANTEE EXECUTION ORDER
                          relative to other reactions?
                            |
                            +-- YES --> Use PLUGINS
                            |
                            +-- NO --> Is this a "notification" pattern
                                       (fire and forget, side effects only)?
                                         |
                                         +-- YES --> Use an EVENT/OBSERVER
                                         |
                                         +-- NO  --> Reconsider design
```

### Decision Matrix

| Scenario | Mechanism | Reason |
|----------|-----------|--------|
| Modify a method's return value | Plugin (after/around) | Only plugins control return values |
| Modify method input arguments | Plugin (before) | Only plugins intercept arguments |
| Send email when order is placed | Event/Observer | Pure side effect, no return value needed |
| Prevent a method from running (conditional skip) | Plugin (around) | Must short-circuit via `$proceed()` control |
| Log every call to a public API method | Plugin (around) or Observer | Plugin if method has no event; observer if event exists |
| Execute reactions in a specific sequence | Plugin | Observer order is not guaranteed |
| React to a state change across modules | Event/Observer | Decoupled; originating module doesn't need to know about observers |
| Add validation before save | Plugin (before/around) | Can throw exception to prevent save; observer cannot affect outcome |
| Notify 10 different modules of an action | Event/Observer | Better decoupling; plugin would require one entry per module |
| Third-party code, no event dispatched | Plugin | Events can only be consumed; plugins work on any public method |

### The Decoupling Argument (Architect-Level Thinking)

```
Events are BETTER for decoupling when:
  - The originating module should NOT know what reacts to it
  - Multiple independent modules need to react
  - The reaction is a true side effect (email, log, cache invalidation)
  - You want to allow merchants to add custom reactions without touching core

Plugins are NECESSARY when:
  - You must control what the METHOD RETURNS
  - You must modify what the method RECEIVES
  - Execution order relative to other interceptors matters
  - No event exists at the right point in the flow
```

**Exam focus:** The architect exam will present scenarios where *both* a relevant event and a relevant method exist. The correct answer depends on whether return value modification is needed. If the answer says "we need to ensure the modified value is used downstream," plugins are required.

### The Performance Consideration

```
Events:  Lower overhead per call — simple observer lookup and execution
Plugins: Higher overhead — interceptor class, plugin chain resolution
         (mitigated by DI compilation caching)

Architectural rule: Don't use plugins where events suffice.
Performance rule:   Don't abuse around plugins — they add the most overhead.
```

---

## 9. Real-World Tracing: Around Plugin in module-quote

### Finding a Real Around Plugin

```bash
# Search for around plugins in the Quote module
grep -r "aroundCollect\|aroundSave\|aroundPlace" \
    vendor/magento/module-quote/Plugin/ \
    vendor/magento/module-checkout/Plugin/ \
    --include="*.php" -l
```

### Example: Tracing `module-quote` Plugin

The quote module contains real plugins worth studying. Let's trace through how Magento intercepts quote-related operations:

```bash
# Find all plugins targeting Quote\Model\Quote or QuoteManagement
grep -r "Magento\\\\Quote\\\\Model\\\\Quote\|Magento\\\\Quote\\\\Api\\\\CartManagementInterface" \
    vendor/magento/*/etc/di.xml \
    | grep "plugin"
```

**Examining the generated interceptor to understand the chain:**

```bash
# After running setup:di:compile, examine a real interceptor
cat generated/code/Magento/Quote/Model/Quote/Interceptor.php
# or
cat generated/code/Magento/Quote/Model/QuoteManagement/Interceptor.php
```

The generated interceptor will look like:

```php
<?php
// generated/code/Magento/Quote/Model/Quote/Interceptor.php (simplified)
namespace Magento\Quote\Model\Quote;

class Interceptor extends \Magento\Quote\Model\Quote
{
    use \Magento\Framework\Interception\Interceptor;

    public function __construct(/* ... DI args ... */)
    {
        $this->___init();  // initializes plugin chain — BEFORE parent::__construct()
        parent::__construct(/* ... */);
    }

    public function someMethod($arg)
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'someMethod');

        return $pluginInfo
            ? $this->___callPlugins('someMethod', func_get_args(), $pluginInfo)
            : parent::someMethod($arg);
    }
}
```

### Real Example: Around Plugin on Quote's `Address\ToOrder::convert()`

A real pattern in Magento: augmenting address-to-order conversion via an around plugin. The class to target is `Magento\Quote\Model\Quote\Address\ToOrder` and its `convert(Address $object, $data = [])` method.

```php
<?php
namespace Vendor\Module\Plugin\Quote\Address;

use Magento\Quote\Model\Quote\Address;
use Magento\Quote\Model\Quote\Address\ToOrder;
use Closure;

class ToOrderPlugin
{
    /**
     * Real around plugin pattern:
     * - Captures the original Address -> Order conversion
     * - Adds additional data not in the standard conversion
     */
    public function aroundConvert(
        ToOrder $subject,
        Closure $proceed,
        Address $address,        // original argument — must match ToOrder::convert() signature
        array $data = []         // original argument with default
    ): \Magento\Sales\Api\Data\OrderInterface
    {
        // Pre-call: set up context
        $order = $proceed($address, $data);  // MUST call with same args

        // Post-call: augment the result
        // $order is the return value from the conversion

        return $order;
    }
}
```

**How to trace a real plugin manually:**

```bash
# Step 1: Find the di.xml registration
grep -r "ToOrder\|to_order_plugin" vendor/magento/module-quote/etc/di.xml

# Step 2: Find the plugin class
find vendor/magento/module-quote/Plugin -name "*.php" | xargs grep -l "aroundConvert"

# Step 3: Read the plugin class
# (example: cat vendor/magento/module-quote/Plugin/Model/Quote/Address/ToOrderPlugin.php)

# Step 4: Check what the original method signature is
grep -n "public function convert" vendor/magento/module-quote/Model/Quote/Address/ToOrder.php

# Step 5: Verify your plugin's argument list matches the original
```

**Exam focus:** The hands-on trace exercise teaches you to verify that **around plugin arguments match the original method exactly**. A mismatch causes a PHP fatal error at runtime (not compile time).

---

## 10. Disabling a Core Observer

### Step-by-Step Process

**Step 1: Find the observer you want to disable**

```bash
# Search for the event name in all events.xml files
grep -rn "sales_order_place_after" vendor/magento/ --include="events.xml"

# Actual output (module-sales/etc/events.xml):
# <event name="sales_order_place_after">
#   <observer name="sales_vat_request_params_order_comment"
#             instance="Magento\Sales\Observer\Frontend\AddVatRequestParamsOrderComment" />
```

**Step 2: Note the exact `name` attribute**

```xml
<!-- vendor/magento/module-sales/etc/events.xml -->
<event name="sales_order_place_after">
    <observer name="sales_vat_request_params_order_comment"
              instance="Magento\Sales\Observer\Frontend\AddVatRequestParamsOrderComment" />
</event>
```

> **Note:** `sales_send_order_emails` is a different observer — it is registered on the `config_data_sales_email_general_async_sending_disabled` event, not `sales_order_place_after`. Always grep the actual codebase to get the correct observer name for the event you're targeting.

**Step 3: Create your module's `events.xml` and disable it**

```xml
<!-- app/code/Vendor/Module/etc/events.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Event/etc/events.xsd">

    <event name="sales_order_place_after">
        <!--
            Disable by SAME NAME as the core observer.
            Magento merges config by observer name — this overrides the core entry.
        -->
        <observer name="sales_vat_request_params_order_comment"
                  instance="Magento\Sales\Observer\Frontend\AddVatRequestParamsOrderComment"
                  disabled="true" />
    </event>

</config>
```

**Step 4: Flush and verify**

```bash
# Clear config cache
bin/magento cache:clean config

# Verify the observer is disabled — check merged config
bin/magento dev:query-config ... # or use Xdebug to trace event dispatch

# Or check via raw config merge inspection:
# The merged events config should show disabled="true" for this observer
```

**Step 5: Verify with a test (as the task requires)**

```php
// Test approach: dispatch the event manually and verify the observer class was NOT called
// In integration test or dev controller:

$this->eventManager->dispatch('sales_order_place_after', ['order' => $mockOrder]);

// If disabled correctly, Magento\Sales\Observer\Frontend\AddVatRequestParamsOrderComment::execute()
// will NOT be called. Verify by checking for the absence of side effects
// or by mocking the service and asserting zero calls.
```

**Exam focus:**
- You match by the `name` attribute, not the `instance` class name.
- The scope of your `events.xml` matters: if the core observer is in `etc/frontend/events.xml`, you must disable it in `etc/frontend/events.xml`, not global `etc/events.xml`. This `sales_order_place_after` observer is in global `etc/events.xml`, so the disable goes there too.
- This same `disabled="true"` pattern works for plugins in `di.xml`.

### Disabling a Plugin (Same Pattern)

```xml
<!-- app/code/Vendor/Module/etc/di.xml -->
<type name="Magento\Catalog\Model\Product">
    <!-- Disable an existing plugin by its name -->
    <plugin name="magento_catalog_product_attribute_backend_plugin"
            disabled="true" />
</type>
```

---

## 11. Scenario-Based Exam Practice

These represent the type of questions where multiple answers look technically valid.

---

### Scenario 1

> **A third-party module adds a plugin on `\Magento\Catalog\Model\Product::getName()` with `sortOrder="50"`. You need your module's plugin to run BEFORE theirs to pre-process the name first. What sortOrder should you use?**

**Wrong answer:** `sortOrder="49"` because 49 < 50.
**Correct answer:** `sortOrder="49"` is *mechanically* correct, **but** the architect answer also requires you to note that if sortOrders are equal to theirs (say both are 50), the **module sequence tiebreaker** applies — the module loaded later in sequence is outer. Setting `sortOrder="10"` gives a larger safety buffer and communicates clear intent.

**Key insight:** Always leave room in the sortOrder range. Don't use 49 just to be one less than 50 — that's fragile. Use a range like 10 or 20.

---

### Scenario 2

> **You need to prevent a product from being saved if it has no SKU. Should you use a before plugin, an around plugin, or an observer on `catalog_product_save_before`?**

**Analysis:**
- Observer: fires but `execute()` returns nothing — you can throw an exception, but this is considered bad practice in observers (observers are for reactions, not gate-keeping).
- Before plugin: can modify args but cannot prevent the save by returning different args.
- Around plugin: can skip `$proceed()` to prevent save, OR throw an exception.

**Correct architectural answer:** Around plugin on the save method. It can conditionally skip `$proceed()` or throw a `\Magento\Framework\Exception\LocalizedException`. This keeps validation logic close to the business rule and guarantees execution order.

**Exam focus:** Using an observer to throw exceptions is an anti-pattern. Plugins are the correct gate-keeping mechanism.

---

### Scenario 3

> **Module A and Module B both have around plugins on the same method with `sortOrder="100"`. Module A (`Vendor_A`) is loaded BEFORE Module B (`Vendor_B`) in the module sequence. In what order do their before-execution phases run?**

**Answer:** `Vendor_B` (loaded later in sequence) is the **outer** plugin. Its `before` runs first, then `Vendor_A`'s `before`.

```
Before phase: Vendor_B.before -> Vendor_A.before -> [Original]
After phase:  [Original] -> Vendor_A.after -> Vendor_B.after
```

> **Note:** The tiebreaker is **module sequence** (load order from `module.xml`), not alphabetical module name. The later-loaded module's plugin is outer.

---

### Scenario 4

> **An around plugin is deployed, but developers report that a logging plugin that was working before is now not executing. The around plugin has the correct sortOrder. What is the likely cause?**

**Answer:** The around plugin is not calling `$proceed()` in all code paths. When a condition is met, it returns early without calling `$proceed()`, silently breaking the chain. All subsequent plugins (including the logging plugin) are never called.

---

### Scenario 5

> **You want to add behavior when a customer logs in. A `customer_login` event exists. A `\Magento\Customer\Model\Session::setCustomerData()` method also exists. Which should you use to update the customer session data?**

**Answer:** If you need to **modify what's stored** in the session (change the data going in), use a **before plugin** on `setCustomerData()`. If you just need to **react** to the login (e.g., log it, send a notification), use the **event observer** on `customer_login`. The event observer cannot modify the session data because `execute()` returns nothing.

---

### Scenario 6

> **You need the same business logic to run in both frontend and REST API contexts when an order is placed. Where should you put the observer?**

**Wrong answer:** `etc/frontend/events.xml` (misses REST API).
**Correct answer:** `etc/events.xml` (global scope) — applies to all areas. OR create separate observers in both `etc/frontend/events.xml` and `etc/webapi_rest/events.xml`.

**Best architectural answer for exam:** `etc/events.xml` unless the behavior must differ by area.

---

## Quick-Reference Checklist

### Plugin Signatures
- [ ] **Before plugin** returns `?array` (array of modified args, or null to leave unchanged)
- [ ] **After plugin** receives `$result` as second param — this is the **return value**, NOT the input args
- [ ] **Around plugin** receives `Closure $proceed` as second param — MUST call `$proceed()` or chain breaks silently
- [ ] Around plugin must pass original args to `$proceed($arg1, $arg2, ...)` if the original method has args
- [ ] After plugin can optionally receive original args as third+ params (Magento 2.2+)

### Plugin Restrictions (Cannot Plugin)
- [ ] `__construct` — cannot be intercepted
- [ ] `final` methods — PHP cannot override in subclass
- [ ] `static` methods — bypasses interceptor instance
- [ ] `protected` and `private` methods — not overridable
- [ ] Methods of `final` classes

### Sort Order Rules
- [ ] Ascending sortOrder for **before/around** pre-execution phases
- [ ] **Descending** (reverse) sortOrder for **after** and **around** post-execution phases
- [ ] Equal sortOrder → **module sequence** tiebreaker (later-loaded module = outer plugin)
- [ ] There is NO alphabetical module name tiebreaker — `PluginListGenerator` only sorts by `sortOrder` numeric value
- [ ] Always use intentional, spread-out sortOrder values — don't rely on tiebreaker

### Plugin Declaration
- [ ] Declared in `di.xml` under `<type name="..."><plugin .../></type>`
- [ ] Plugin `name` attribute must be globally unique for that intercepted class
- [ ] Interface targeting intercepts ALL implementations
- [ ] `disabled="true"` disables a plugin (works across modules)
- [ ] Prefer `before` + `after` over `around` to avoid silent chain-break risk

### Events and Observers
- [ ] `execute(Observer $observer)` — `ObserverInterface` declares no PHP return type hint; implement as `: void` in your class
- [ ] Observer execution order is **NOT guaranteed** — if order matters, use plugins
- [ ] `events.xml` scope determines which area the observer fires in (global, frontend, adminhtml, webapi_rest, crontab)
- [ ] Crontab area uses `etc/crontab/events.xml` for area-scoped observers AND `etc/crontab.xml` for job definitions
- [ ] Disable a core observer with `disabled="true"` matching the **exact observer `name` attribute**
- [ ] Scope of disable must match scope of original declaration
- [ ] `shared="false"` creates a new observer instance per dispatch

### Architectural Decision Rules
- [ ] **Modify return value?** → Plugin (after or around)
- [ ] **Modify input arguments?** → Plugin (before)
- [ ] **Prevent method execution?** → Plugin (around — control `$proceed()`)
- [ ] **Guaranteed execution order?** → Plugin
- [ ] **Pure side effect, no return value control needed?** → Event/Observer
- [ ] **Multiple decoupled modules reacting?** → Event/Observer (better decoupling)
- [ ] **Throw exception to block operation?** → Plugin (not observer — observers are for reactions, not gate-keeping)
- [ ] **No event exists at the right point?** → Plugin on the public method
- [ ] **Performance concern?** → Prefer events over plugins; prefer before/after over around

### Common Exam Traps
- [ ] After plugin: `$result` is the RETURN VALUE — not an input argument
- [ ] Around without `$proceed()` = silent chain break — no error thrown
- [ ] Observer cannot modify return values (execute returns nothing)
- [ ] Observer order is non-deterministic
- [ ] Equal sortOrder uses **module sequence** tiebreaker (not alphabetical module name)
- [ ] Disabling observer requires matching the `name` attribute AND the correct `events.xml` scope
- [ ] Targeting an interface with a plugin affects ALL classes implementing that interface
- [ ] `sales_send_order_emails` observer is on `config_data_sales_email_general_async_sending_disabled` event, NOT `sales_order_place_after`
