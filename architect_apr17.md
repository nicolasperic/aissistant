# AD0-E722 Adobe Commerce Architect — Practice Test #1 & Gap Analysis Study Notes

---

## Table of Contents

1. [How to Use These Notes](#1-how-to-use-these-notes)
2. [Exam Structure & Scoring Targets](#2-exam-structure--scoring-targets)
3. [The Architect Mindset — Why, Not Just What](#3-the-architect-mindset--why-not-just-what)
4. [Section 1: Design Foundations — Core Concepts](#4-section-1-design-foundations--core-concepts)
   - 4.1 [Dependency Injection & the Object Manager](#41-dependency-injection--the-object-manager)
   - 4.2 [Plugins (Interceptors)](#42-plugins-interceptors)
   - 4.3 [Service Contracts & Repositories](#43-service-contracts--repositories)
   - 4.4 [GraphQL Caching Architecture](#44-graphql-caching-architecture)
   - 4.5 [Virtual Types & Preferences](#45-virtual-types--preferences)
   - 4.6 [Area Codes & Bootstrapping](#46-area-codes--bootstrapping)
5. [Gap Analysis Worksheet](#5-gap-analysis-worksheet)
6. [Trap Question Decoder](#6-trap-question-decoder)
7. [Scenario-Based Decision Framework](#7-scenario-based-decision-framework)
8. [Wrong Answer Journal Template](#8-wrong-answer-journal-template)
9. [Top 5 Weakest Topics Tracker](#9-top-5-weakest-topics-tracker)
10. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. How to Use These Notes

These notes are designed to work **alongside** a real timed practice test session. The workflow is:

```
+------------------+     +---------------------+     +--------------------+
| Take full timed  | --> | Score by section    | --> | Fill Gap Analysis  |
| practice test    |     | (Design/Review/     |     | Worksheet (Sec 5)  |
| NO notes/browser |     |  Configure+Deploy)  |     |                    |
+------------------+     +---------------------+     +--------------------+
         |
         v
+------------------+     +---------------------+     +--------------------+
| Wrong Answer     | --> | Flag top 5 weak     | --> | Deep-dive each     |
| Journal (Sec 8)  |     | topics (Sec 9)      |     | trap area (Sec 6)  |
+------------------+     +---------------------+     +--------------------+
```

**Key discipline rules for the practice test:**
- Set a 110-minute timer (same as real exam — 60 questions)
- No browser, no IDE, no notes
- Mark every question you are *even slightly unsure about* — uncertainty is data
- After scoring, treat wrong answers as **research assignments**, not failures

---

## 2. Exam Structure & Scoring Targets

### AD0-E722 Exam Blueprint

| Domain | Weight | # of Questions (approx) | Passing Target |
|--------|--------|--------------------------|----------------|
| **Design** | ~46% | ~28 questions | 22+ correct |
| **Review** | ~22% | ~13 questions | 10+ correct |
| **Configure & Deploy** | ~32% | ~19 questions | 15+ correct |
| **Total** | 100% | 60 questions | **67% (41/60)** |

> **Passing score: 67%** — but aim for **75%+ on practice tests** to give yourself a real-world buffer.

**Exam focus:**
- Design domain is the **heaviest section** — it alone can pass or fail you
- Configure & Deploy is the second-largest and often where developers over-rely on memory instead of architectural reasoning
- Review questions tend to be "given this code/config, what is wrong or suboptimal" — these test *why* rules exist

### Section-by-Section Scoring After Practice Test

After your practice test, fill in this table:

| Section | Raw Score | % | Delta from Target | Priority |
|---------|-----------|---|-------------------|----------|
| Design | __ / 28 | __% | __ | __ |
| Review | __ / 13 | __% | __ | __ |
| Configure & Deploy | __ / 19 | __% | __ | __ |
| **Overall** | __ / 60 | __% | __ | — |

---

## 3. The Architect Mindset — Why, Not Just What

This is the most important section in the entire document. The AD0-E722 exam is explicitly **not** a syntax memorization test.

### The Architect Decision Ladder

```
WRONG approach (Developer level):
"Which code makes this work?"

RIGHT approach (Architect level):
"Which approach is maintainable, extensible,
 upgrade-safe, and correct for this context?"
```

### When Multiple Answers Look Technically Valid

The exam regularly presents 2–3 answers that would **all compile and run**. Use this hierarchy to pick the architecturally superior one:

```
Priority 1: Does it follow a Magento-defined contract/interface?
     |
     v
Priority 2: Is it upgrade-safe (no core class rewrites)?
     |
     v
Priority 3: Is it the least-invasive mechanism that achieves the goal?
     |
     v
Priority 4: Does it perform correctly at scale?
     |
     v
Priority 5: Is it testable / mockable in unit tests?
```

**Exam focus:**
- If one answer uses a **Service Contract** and another manipulates a model directly, the service contract answer is almost always correct
- If one answer uses a **Plugin** and another uses a **Preference (rewrite)**, the plugin answer is almost always correct
- "Technically works" ≠ "architecturally correct" on this exam

### The Five Architectural Values Adobe Tests Against

| Value | What It Means in Questions |
|-------|---------------------------|
| **Extensibility** | Can a third-party module modify this behavior without editing core? |
| **Upgrade Safety** | Will this break when Adobe releases a patch? |
| **Separation of Concerns** | Is business logic leaking into the wrong layer? |
| **Performance at Scale** | Is this solution viable on a large catalog/high-traffic store? |
| **Testability** | Can this be unit tested with mocked dependencies? |

---

## 4. Section 1: Design Foundations — Core Concepts

### 4.1 Dependency Injection & the Object Manager

#### What DI Actually Is (Conceptual Model)

```
+---------------------+          +---------------------------+
|   Your Class        |          |   di.xml                  |
|                     |          |                           |
| __construct(        | <-----   | <type name="YourClass">   |
|   HelperX $h,       |  wired   |   <arguments>             |
|   ServiceY $s       |  by DI   |     <argument .../>        |
| )                   |  system  |   </arguments>            |
+---------------------+          | </type>                   |
                                  +---------------------------+
         ^
         |
  ObjectManager reads di.xml and injects dependencies
  YOU never call ObjectManager::getInstance() in production code
```

**Exam focus:**
- The Object Manager should **never** be called directly in your own code — it exists to power DI, not to be your service locator
- Acceptable exceptions: `Factory` classes, `Proxy` classes, test bootstrap files, and `app/bootstrap.php` — these are the only places
- In unit tests, you **must** be able to instantiate your class with mocked constructor arguments — if you can't, your class violates DI principles

#### di.xml Scope Hierarchy

```
app/etc/di.xml                  <-- Global (all areas)
     |
     +-- Vendor/Module/etc/di.xml           <-- Module global
     |
     +-- Vendor/Module/etc/frontend/di.xml  <-- Frontend area only
     |
     +-- Vendor/Module/etc/adminhtml/di.xml <-- Admin area only
     |
     +-- Vendor/Module/etc/webapi_rest/di.xml
     |
     +-- Vendor/Module/etc/graphql/di.xml
```

**Exam focus:**
- Area-specific `di.xml` files **override** module-global `di.xml` for that area
- A preference defined in `adminhtml/di.xml` does **not** affect the frontend — knowing scope prevents over-broad rewrites

#### Constructor Injection vs. Setter Injection

```php
// CORRECT - Constructor injection (testable, explicit dependencies)
class MyService
{
    private CustomerRepositoryInterface $customerRepository;
    private LoggerInterface $logger;

    public function __construct(
        CustomerRepositoryInterface $customerRepository,
        LoggerInterface $logger
    ) {
        $this->customerRepository = $customerRepository;
        $this->logger = $logger;
    }
}
```

```php
// WRONG - Object Manager called directly (anti-pattern)
class MyService
{
    public function doSomething()
    {
        // This is the anti-pattern the exam tests
        $om = \Magento\Framework\App\ObjectManager::getInstance();
        $customer = $om->get(\Magento\Customer\Model\Customer::class);
    }
}
```

#### Compiled DI: Factories and Proxies

```php
// Factory - use when you need to create NEW instances at runtime
// (non-shared / transient objects)
class OrderProcessor
{
    public function __construct(
        private readonly \Magento\Sales\Model\OrderFactory $orderFactory
    ) {}

    public function process(): void
    {
        $order = $this->orderFactory->create(); // new instance each time
    }
}
```

```php
// Proxy - use to defer instantiation of HEAVY dependencies
// that may not always be needed
// Declared in di.xml, auto-generated by bin/magento setup:di:compile
```

```xml
<!-- di.xml: make HeavyService use a proxy -->
<type name="MyModule\Service\MyLightService">
    <arguments>
        <argument name="heavyService" xsi:type="object">
            MyModule\Service\HeavyService\Proxy
        </argument>
    </arguments>
</type>
```

**Exam focus:**
- **Factory** = create new instance each call (non-shared) — use for Data Models and objects that hold state
- **Proxy** = defer instantiation — use for performance-critical paths where the heavy dependency may never be called
- **Shared instances** (default DI behavior) = same instance returned every time — appropriate for stateless services
- Never inject a `Session` object directly — always use its **Proxy** to prevent premature session initialization

---

### 4.2 Plugins (Interceptors)

#### Plugin Type Decision Tree

```
You want to modify a public method behavior
              |
              v
    Does the method exist on a NON-FINAL,
    NON-PRIVATE public method of a class
    that is NOT instantiated with "new"?
              |
        YES --+-- NO --> Use Observer or Preference (last resort)
              |
              v
    Do you need to CHANGE INPUT ARGUMENTS?
              |
        YES --+--> before() plugin
              |
    Do you need to CHANGE THE RETURN VALUE
    or SHORT-CIRCUIT execution?
              |
        YES --+--> around() plugin (use sparingly)
              |
    Do you need to ACT ON THE RESULT
    after execution?
              |
        YES --+--> after() plugin
```

#### Plugin Code Signatures

```php
// BEFORE plugin - can modify input arguments
// Return: array of modified arguments, or null
class BeforePlugin
{
    public function beforeSave(
        \Magento\Catalog\Model\ResourceModel\Product $subject,
        \Magento\Framework\Model\AbstractModel $object
    ): array {
        // Modify $object before save
        $object->setData('custom_field', 'value');
        return [$object]; // Must return array of arguments
    }
}
```

```php
// AFTER plugin - can modify return value
// Return: modified return value (same type as original method)
class AfterPlugin
{
    public function afterGetPrice(
        \Magento\Catalog\Model\Product $subject,
        float $result  // The original return value
    ): float {
        return $result * 1.1; // 10% markup example
    }
}
```

```php
// AROUND plugin - full control, but use SPARINGLY
// Must call $proceed() or you break the plugin chain
class AroundPlugin
{
    public function aroundExecute(
        \Magento\Checkout\Controller\Index\Index $subject,
        callable $proceed
    ) {
        if ($this->someCondition()) {
            // Short-circuit: don't call $proceed
            return $this->resultFactory->create(...);
        }
        return $proceed(); // ALWAYS call this in normal flow
    }
}
```

```xml
<!-- etc/di.xml: registering a plugin -->
<type name="Magento\Catalog\Model\Product">
    <plugin name="vendor_module_product_price_plugin"
            type="Vendor\Module\Plugin\ProductPricePlugin"
            sortOrder="10"
            disabled="false"/>
</type>
```

**Exam focus:**
- Plugins only work on **public methods** — not protected, not private
- Plugins **cannot** be applied to `final` classes or `final` methods
- Plugins **cannot** be applied to classes instantiated with `new` (not managed by ObjectManager)
- `around` plugins have a **performance cost** and can break other plugins if `$proceed()` is not called — prefer `before`/`after` unless you genuinely need to short-circuit
- `sortOrder` controls execution order — lower numbers run first for `before`, but **last for after plugins** (they unwind like a stack)
- Plugin on a **Plugin** is not possible — plugins cannot intercept other plugins

#### Plugin Execution Order (Critical for Exam)

```
Request flow for a method with 3 plugins (sortOrder 10, 20, 30):

before10 -> before20 -> before30 -> [ORIGINAL METHOD] -> after30 -> after20 -> after10

Around plugins wrap around this entire sequence.
Think of it as a Russian nesting doll — outermost around runs first.
```

---

### 4.3 Service Contracts & Repositories

#### The Service Contract Architecture

```
+----------------------------------+
|    API Layer (REST/SOAP/GraphQL) |
+----------------------------------+
              |
              v
+----------------------------------+
| Service Contract Interface       |  <-- Vendor/Module/Api/
| e.g. CustomerRepositoryInterface |      THIS is what you inject
+----------------------------------+
              |
              v
+----------------------------------+
| Repository Implementation        |  <-- Vendor/Module/Model/
| e.g. CustomerRepository          |      Registered via di.xml preference
+----------------------------------+
              |
              v
+----------------------------------+
| Resource Model / ORM Layer       |  <-- Vendor/Module/Model/ResourceModel/
+----------------------------------+
```

**Exam focus:**
- Always inject the **Interface** (e.g. `CustomerRepositoryInterface`), never the concrete class (`CustomerRepository`) — this is the single most-tested DI principle
- Service contracts guarantee a stable API — Adobe can change the implementation without breaking your code
- Repository pattern: `get()`, `getList()`, `save()`, `delete()`, `deleteById()` — these are the standard contract methods

#### Data Interfaces (Data Transfer Objects)

```php
// WRONG - using model directly (breaks service contracts)
/** @var \Magento\Customer\Model\Customer $customer */
$customer->setFirstname('John');

// RIGHT - using Data Interface
/** @var \Magento\Customer\Api\Data\CustomerInterface $customer */
$customer = $this->customerDataFactory->create();
$customer->setFirstname('John');
$customer->setLastname('Doe');
$customer->setEmail('john@example.com');
$this->customerRepository->save($customer);
```

```php
// The Repository Interface pattern
interface CustomerRepositoryInterface
{
    public function save(CustomerInterface $customer): CustomerInterface;
    public function get(string $email, int $websiteId = null): CustomerInterface;
    public function getById(int $customerId): CustomerInterface;
    public function getList(SearchCriteriaInterface $searchCriteria): CustomerSearchResultsInterface;
    public function delete(CustomerInterface $customer): bool;
    public function deleteById(int $customerId): bool;
}
```

#### SearchCriteria — The Right Way to Query

```php
// WRONG - using collection directly in business logic
$collection = $this->collectionFactory->create();
$collection->addFieldToFilter('status', 1);
$items = $collection->getItems();

// RIGHT - using SearchCriteria via service contracts
$searchCriteria = $this->searchCriteriaBuilder
    ->addFilter('status', 1)
    ->addFilter('store_id', $storeId)
    ->setPageSize(20)
    ->setCurrentPage(1)
    ->create();

$results = $this->productRepository->getList($searchCriteria);
$items = $results->getItems();
```

**Exam focus:**
- Using Collections directly in business logic is an anti-pattern — it couples you to the database layer
- `SearchCriteria` is the correct abstraction for querying through service contracts
- Filters added to the same `SearchCriteriaBuilder` call are combined with **AND** by default; use `addFilters()` with an array for **OR** logic

---

### 4.4 GraphQL Caching Architecture

#### GraphQL Cache Flow in Magento

```
Client Request
     |
     v
+--------------------+
| Varnish / Fastly   |  <-- Checks X-Magento-Cache-Id header
| (Full Page Cache)  |      and cache tags
+--------------------+
     |  MISS
     v
+--------------------+
| GraphQL Resolver   |  <-- Resolves query fields
+--------------------+
     |
     v
+--------------------+
| Identity Interface |  <-- Returns cache tags for the response
| (Cache Tags)       |      e.g. ["cat_1", "cat_2", "p_42"]
+--------------------+
     |
     v
Response sent + cached with tags
```

#### Cache Identity Implementation

```php
// Implementing cache identity for a GraphQL resolver
namespace Vendor\Module\Model\Resolver;

use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Query\Resolver\IdentityInterface;

class ProductsResolver implements ResolverInterface
{
    // ...resolver logic...
}
```

```php
// Separate Identity class
namespace Vendor\Module\Model\Resolver\Cache;

use Magento\Framework\GraphQl\Query\Resolver\IdentityInterface;

class ProductsIdentity implements IdentityInterface
{
    private string $cacheTag = \Magento\Catalog\Model\Product::CACHE_TAG;

    public function getIdentities(array $resolvedData): array
    {
        $identities = [];
        foreach ($resolvedData['items'] ?? [] as $item) {
            $identities[] = sprintf('%s_%s', $this->cacheTag, $item['entity_id']);
        }
        return $identities; // e.g. ["cat_p_1", "cat_p_42"]
    }
}
```

```xml
<!-- Wire the identity class to the resolver in di.xml -->
<type name="Vendor\Module\Model\Resolver\ProductsResolver">
    <arguments>
        <argument name="identityClass"
                  xsi:type="string">
            Vendor\Module\Model\Resolver\Cache\ProductsIdentity
        </argument>
    </arguments>
</type>
```

**Exam focus:**
- GraphQL queries **can** be cached by Varnish/Fastly if they are `GET` requests — mutations are **never cached**
- The `X-Magento-Cache-Id` header drives cache variation for GraphQL (similar to `X-Magento-Vary` for page cache)
- Cache invalidation in GraphQL uses **cache tags** via the `IdentityInterface` — when a product is updated, all cached responses tagged with that product's ID are purged
- Queries marked as `cacheable: false` in the schema will not be cached regardless of headers
- The `@cache` directive controls resolver-level caching behavior

#### GraphQL Schema Design Principles

```graphql
# Correct - using input types for mutations
type Mutation {
    addProductToCart(
        cartId: String!,
        cartItems: [CartItemInput!]!
    ): AddProductsToCartOutput
}

input CartItemInput {
    sku: String!
    quantity: Float!
    selected_options: [ID!]
    entered_options: [EnteredOptionInput!]
}
```

**Exam focus:**
- Resolvers should be **thin** — delegate to service contracts, not resource models
- Each resolver field can have its own identity/cache tags — granular invalidation is the goal
- `ResolverInterface` vs `ContextInterface` — context carries auth/store scope, resolver carries business logic

---

### 4.5 Virtual Types & Preferences

#### Preference — Full Class Substitution

```xml
<!-- di.xml: Preference replaces one class with another GLOBALLY -->
<preference for="Magento\Catalog\Api\ProductRepositoryInterface"
            type="Vendor\Module\Model\ProductRepository"/>
```

**When to use a Preference:**
- You are implementing an **Interface** that has no concrete class yet (your own new service)
- You absolutely must replace an entire class (last resort — prefer plugins)

**Exam focus:**
- Preferences are the **most invasive** customization mechanism — two modules with preferences on the same class will conflict
- Only one preference can win for a given interface/class — the last one loaded wins (alphabetical module load order)
- Never use a preference where a plugin would suffice — this is a direct exam trap

#### Virtual Types — Configuration-Only Subclasses

```xml
<!-- Virtual type: creates a new "class" that is just a differently-configured
     instance of an existing class — NO PHP FILE NEEDED -->
<virtualType name="Vendor\Module\Model\CustomLogger"
             type="Magento\Framework\Logger\Monolog">
    <arguments>
        <argument name="name" xsi:type="string">custom_logger</argument>
        <argument name="handlers" xsi:type="array">
            <item name="system" xsi:type="object">
                Vendor\Module\Logger\Handler\Custom
            </item>
        </argument>
    </arguments>
</virtualType>

<!-- Now inject this virtual type as if it were a real class -->
<type name="Vendor\Module\Service\MyService">
    <arguments>
        <argument name="logger" xsi:type="object">
            Vendor\Module\Model\CustomLogger
        </argument>
    </arguments>
</type>
```

**Exam focus:**
- Virtual types exist **only** in the DI compiled output — there is no PHP file
- They are ideal for creating multiple configured variants of the same class (e.g. multiple loggers, multiple pool implementations)
- A virtual type **cannot** be extended in PHP — it's a config construct only

---

### 4.6 Area Codes & Bootstrapping

#### Magento Area Codes

| Area Code | Constant | Used For |
|-----------|----------|----------|
| `frontend` | `Area::AREA_FRONTEND` | Storefront |
| `adminhtml` | `Area::AREA_ADMINHTML` | Admin panel |
| `webapi_rest` | `Area::AREA_WEBAPI_REST` | REST API |
| `webapi_soap` | `Area::AREA_WEBAPI_SOAP` | SOAP API |
| `graphql` | `Area::AREA_GRAPHQL` | GraphQL endpoint |
| `crontab` | `Area::AREA_CRONTAB` | Cron jobs |
| `global` | `Area::AREA_GLOBAL` | CLI / no area |

**Exam focus:**
- Area determines which `di.xml`, `events.xml`, `routes.xml`, and layout XML files are loaded
- CLI commands run in the `global` area by default — if your CLI command needs frontend context, you must explicitly set the area
- `webapi_rest` and `graphql` are separate areas — a plugin on `frontend/di.xml` does **not** apply to REST API calls

---

## 5. Gap Analysis Worksheet

After completing your practice test, use this worksheet to systematically identify weaknesses.

### Part A: Question Audit Table

| Q# | Domain | Topic | Correct? | Confidence (1-5) | Error Type |
|----|--------|-------|----------|------------------|------------|
| 1 | | | | | |
| 2 | | | | | |
| ... | | | | | |

**Error Types:**
- **K** = Knowledge gap (didn't know the concept)
- **T** = Trap (knew the concept but picked the wrong answer)
- **C** = Careless (read the question wrong)
- **G** = Guess (had no idea)

### Part B: Topic Frequency Analysis

After filling the table, count errors per topic:

| Topic | # Wrong | Error Types | Priority Score |
|-------|---------|-------------|----------------|
| DI / Plugins | | | |
| Service Contracts | | | |
| GraphQL | | | |
| EAV / Schema | | | |
| Caching Strategy | | | |
| Module Architecture | | | |
| Event/Observer | | | |
| Layout XML | | | |
| Deployment Pipeline | | | |
| Performance | | | |

**Priority Score formula:** `(# Wrong × 2) + (# Guesses × 3)`
> Topics with highest priority scores go in the Week 2 study plan first.

### Part C: Confidence vs. Correctness Matrix

```
HIGH Confidence                     LOW Confidence
        |                                  |
CORRECT | --> "Solid" - move on            | --> "Lucky Guess" - still study this
        |                                  |
WRONG   | --> "DANGER ZONE" - highest      | --> "Knowledge Gap" - study normally
        |     priority, fix misconceptions |
```

> **The Danger Zone** (high confidence + wrong answer) is the most critical gap — you have a misconception that feels like knowledge. These are the trap questions.

---

## 6. Trap Question Decoder

This section covers the most common **trap patterns** in the AD0-E722 exam.

### Trap #1: Plugin vs. Preference

**The trap:** A question asks how to modify core behavior. One answer says "create a plugin," another says "create a preference/rewrite."

**The decoder:**
```
Is the method public AND non-final AND on a DI-managed class?
  YES --> Plugin is ALWAYS preferred over Preference
  NO  --> Consider Observer or Event, or Preference as last resort

Does the question say "add new behavior" or "modify existing"?
  ADD new behavior --> Observer (if event exists) or Plugin
  MODIFY/OVERRIDE --> Plugin (before/after) almost always wins
  REPLACE entirely --> Preference (but question will usually not test this as optimal)
```

**Exam focus:**
- The exam almost never has "use a preference" as the correct answer when a plugin is possible
- If you see both "plugin" and "preference" as options, pick plugin unless the method is final/private

---

### Trap #2: inject Interface vs. inject Concrete Class

**The trap:** A constructor injection question shows two implementations — one injecting the interface, one injecting the concrete class.

```php
// TRAP ANSWER - injects concrete class
public function __construct(
    \Magento\Customer\Model\ResourceModel\CustomerRepository $repo
) {}

// CORRECT ANSWER - injects interface
public function __construct(
    \Magento\Customer\Api\CustomerRepositoryInterface $repo
) {}
```

**Why the interface wins:**
- The concrete class path (`Model\ResourceModel`) can change between versions
- The interface is a **service contract** — Adobe guarantees backward compatibility
- Only the interface allows proper DI substitution via `di.xml` preferences

---

### Trap #3: around() Plugin Overuse

**The trap:** A question presents a scenario where you need to "intercept a method and optionally modify its behavior." Multiple answers use `around` plugins; one uses `before` + `after`.

**The decoder:**
```
Do you need to PREVENT the original method from running?
  YES --> around() is justified (rare legitimate use case)
  NO  --> before() and/or after() is ALWAYS preferred

around() downsides the exam tests:
  1. Performance overhead (extra call stack frame)
  2. Must call $proceed() or breaks plugin chain
  3. Incompatible with some Magento-internal optimizations
```

**Exam focus:**
- An `around` plugin that always calls `$proceed()` with no modification is a **code smell** — use `after` instead
- `around` is the right tool only when conditional short-circuiting is needed

---

### Trap #4: GraphQL Mutation vs. Query Caching

**The trap:** "You need to cache the results of a GraphQL operation that updates cart data."

**The decoder:**
```
Operation type = query   --> CAN be cached (GET request, cache tags apply)
Operation type = mutation --> NEVER cached (POST request by spec)

"Real-time" data (cart, customer session, prices with rules):
  --> Should use cache: false / no-cache headers
  --> Or rely on private content mechanisms, not FPC

Static/catalog data (product listings, CMS pages):
  --> Should be cached with proper IdentityInterface tags
```

**Exam focus:**
- GraphQL **mutations** are POST requests and are **never** cached by Varnish/Fastly
- Customer-specific GraphQL queries should NOT be cached at the FPC level — they belong in private content
- Cache tags flow: resolver → IdentityInterface → response headers → Varnish tag storage

---

### Trap #5: Service Contract Bypass

**The trap:** "You need to quickly fetch all products for a custom import process. Which is the most appropriate approach?"

Options usually include:
- A) `ProductRepositoryInterface::getList()` with SearchCriteria
- B) Direct SQL query via `ResourceConnection`
- C) `Collection::load()` on the product collection
- D) `ProductRepositoryInterface::get()` in a loop

**The decoder:**
```
A) getList() with SearchCriteria
   --> CORRECT for standard business logic (honors service contracts, extensible)

B) Direct SQL
   --> ONLY correct for high-volume data migrations/imports where
       performance is explicitly the constraint AND it's isolated
       infrastructure code, not business logic

C) Collection::load()
   --> Acceptable in some cases but bypasses service contracts
       Never the "best practice" answer on this exam

D) get() in a loop
   --> N+1 query problem - ALWAYS wrong for bulk operations
```

**Exam focus:**
- For data operations in **business logic**, always use service contracts
- For **performance-critical bulk operations** in infrastructure code, direct SQL or collections *may* be justified — but the question must explicitly mention performance constraints
- The exam tests whether you know the difference between "works" and "architecturally correct"

---

### Trap #6: Event Observer vs. Plugin

**The trap:** When do you use an event/observer vs. a plugin?

```
Event/Observer:
  + Loosely coupled (publisher doesn't know about subscriber)
  + Can have multiple independent observers
  + Good for "notify that something happened" (side effects)
  - Cannot modify the original method's return value
  - Cannot modify input parameters before they reach the method
  - Depends on the event being dispatched (not all methods have events)

Plugin:
  + Can intercept ANY public non-final method
  + Can modify inputs (before) or outputs (after)
  + Works without the class dispatching an event
  - More tightly coupled to the specific class
  - Cannot work on final classes/methods

CHOOSE Event/Observer when:
  - The core code already dispatches the event you need
  - You only need side effects (logging, emails, indexing)
  - You don't need to change return values

CHOOSE Plugin when:
  - No event exists for the method you need to modify
  - You need to change inputs or return values
  - You need to conditionally prevent execution
```

---

## 7. Scenario-Based Decision Framework

Use this framework when facing scenario questions where multiple answers appear valid.

### Framework Application Steps

```
Step 1: IDENTIFY THE CONSTRAINT
  What does the scenario actually require?
  - Modify behavior? -> Plugin or Observer
  - Replace entirely? -> Preference (last resort)
  - New functionality? -> New class + inject via DI
  - Data access? -> Service Contract / Repository

Step 2: ELIMINATE UNSAFE OPTIONS
  Remove any answer that:
  - Calls ObjectManager directly
  - Uses a preference when a plugin would work
  - Injects a concrete class when an interface exists
  - Directly queries the database in business logic
  - Uses around() plugin when before/after would suffice

Step 3: APPLY THE ARCHITECTURE VALUES
  From the remaining answers, which one is:
  - Most upgrade-safe?
  - Most testable?
  - Least invasive?
  - Most aligned with Magento's own patterns?

Step 4: WATCH FOR SCALE/CONTEXT CLUES
  - "Large catalog" -> think performance, avoid N+1
  - "Third-party integration" -> think service contracts
  - "Adobe upgrades" -> think upgrade safety, avoid preferences
  - "Unit testing" -> think constructor injection, interfaces
```

### Common Scenario Archetypes

#### Scenario Type A: "Modify product price calculation"

```
Signals: "price", "modify", "custom calculation"

Decision path:
1. Is there an event? (catalog_product_get_final_price exists)
   - Event cannot change the return value of getPrice()
   - Event is fine for logging/side effects only

2. Use an after() plugin on Product::getFinalPrice()
   - Can modify the return value
   - Upgrade-safe
   - Respects plugin sort order for other modules

CORRECT APPROACH: after() plugin on the price method
WRONG: Preference on Product class
WRONG: Observer if you need to change the actual price returned
```

#### Scenario Type B: "Add custom field to customer API response"

```
Signals: "REST API", "customer", "add field", "response"

Decision path:
1. The customer API uses service contracts
2. You need to EXTEND the Data Interface, not modify core
3. Use extension_attributes.xml to add custom fields
4. Implement an ExtensionAttributeInterface

CORRECT APPROACH: extension_attributes.xml + plugin on repository
WRONG: Modifying CustomerInterface directly
WRONG: Adding a column and hoping it appears in the API
```

```xml
<!-- extension_attributes.xml -->
<extension_attributes for="Magento\Customer\Api\Data\CustomerInterface">
    <attribute code="custom_field" type="string"/>
</extension_attributes>
```

#### Scenario Type C: "Improve checkout page performance"

```
Signals: "performance", "checkout", "slow", "improve"

Decision path:
1. Is the slowness in JS? -> RequireJS bundling, lazy loading
2. Is it server-side? -> Identify which blocks are slow
3. Are non-cacheable blocks preventing FPC?
   -> Move dynamic content to private content / customer-data JS sections
4. Is it database? -> N+1 queries, missing indexes, no SearchCriteria pagination

CORRECT APPROACHES:
  - Move customer-specific data to sections.xml / private content
  - Ensure checkout controller blocks are marked cacheable where possible
  - Use ESI (Edge Side Includes) for semi-static content
  - Defer heavy JS modules via requirejs-config.js
```

---

## 8. Wrong Answer Journal Template

For every wrong answer on your practice test, fill in one row. **Writing in your own words** is critical — it forces synthesis, not just recognition.

### Journal Format

```
Question #: ___
Domain: [ Design | Review | Configure & Deploy ]
Topic Tag: (e.g. "DI/Plugins", "GraphQL Cache", "Service Contracts")

What I answered: _______________________________________________
Why I thought that was correct: ________________________________
_______________________________________________________________

What the correct answer is: ___________________________________
Why it's correct IN MY OWN WORDS: _____________________________
_______________________________________________________________
_______________________________________________________________

The architectural principle this tests:
[ ] Extensibility  [ ] Upgrade Safety  [ ] Separation of Concerns
[ ] Performance    [ ] Testability

Error type: [ K - Knowledge Gap | T - Trap | C - Careless | G - Guess ]

Misconception to fix: _________________________________________

Will study: __________________________________________________
```

### Example Completed Entry

```
Question #: 14
Domain: Design
Topic Tag: DI/Plugins

What I answered: Create a preference for the ProductRepository class
Why I thought that was correct: I wanted to completely control the
  save() method behavior, and a preference gives full control.

What the correct answer is: Create an around() plugin on save()
  (or better, an after() plugin if only post-processing needed)
Why it's correct IN MY OWN WORDS: A plugin lets me intercept save()
  without replacing the whole class. If another module also needs to
  customize save(), both plugins can coexist via sortOrder. A preference
  would make my module conflict with any other module that also rewrites
  ProductRepository — only one preference wins.

The architectural principle this tests:
[X] Extensibility  [X] Upgrade Safety  [ ] Separation of Concerns
[ ] Performance    [X] Testability

Error type: [T - Trap] (I knew plugins existed but defaulted to preference
  because it felt "stronger")

Misconception to fix: "More control" does NOT mean "better architecture"
  on this exam. The least-invasive approach that achieves the goal wins.

Will study: Plugin coexistence, preference conflicts, plugin chain behavior
```

---

## 9. Top 5 Weakest Topics Tracker

After completing your gap analysis, fill in your personal Top 5 list. These drive Week 2 priorities.

### Tracker Table

| Rank | Topic | # Wrong | Misconception Summary | Week 2 Study Action |
|------|-------|---------|----------------------|---------------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

### Pre-filled Candidates (Most Commonly Weak Areas for AD0-E722)

Based on typical exam performance patterns, these are the most likely candidates for your Top 5:

| Topic | Why It's Commonly Weak | Key Insight to Internalize |
|-------|----------------------|---------------------------|
| **Plugin chain behavior** | sortOrder + before/after/around interaction is non-intuitive | Before plugins unwind forward; after plugins unwind in reverse |
| **GraphQL caching** | New area of exam, less real-world exposure | IdentityInterface = cache tag registration; mutations never cache |
| **Service contract interfaces** | Developers habitually use concrete classes | Always inject the Interface, never the concrete `Model\` class |
| **Virtual Types** | Rarely used in day-to-day dev, easy to forget | Config-only "subclass" — no PHP file, perfect for logger variants |
| **Extension Attributes vs. Custom Attributes** | Subtle but testable difference | Custom attributes = EAV (catalog, customer). Extension attributes = any entity, stored separately, API-exposed |

### Extension Attributes vs. Custom Attributes (Deep Dive)

**Exam focus** — This distinction is a reliable trap question:

| Feature | Custom Attributes (EAV) | Extension Attributes |
|---------|------------------------|---------------------|
| Storage | EAV tables | Custom table or any storage |
| Applies to | Catalog entities, customer | ANY entity with service contract |
| API exposure | Automatic (part of model) | Via `extension_attributes.xml` |
| Admin UI | Auto-generated in some cases | Custom UI required |
| Performance | EAV query overhead | Depends on implementation |
| Use case | Store-configurable product attributes | Developer-added fields to any API entity |

```xml
<!-- Custom Attribute (EAV) - defined in eav_attribute setup -->
<!-- Used for product/category/customer attributes manageable in Admin -->

<!-- Extension Attribute - defined in extension_attributes.xml -->
<!-- Used to add developer-defined fields to any API Data Interface -->
<extension_attributes for="Magento\Catalog\Api\Data\ProductInterface">
    <attribute code="warehouse_code" type="string"/>
</extension_attributes>
```

---

## Quick-Reference Checklist

Everything testable on the AD0-E722 Design domain — use this for final review sweeps.

### Dependency Injection

- [ ] ObjectManager must **never** be called directly in production code (exceptions: Factory/Proxy/bootstrap)
- [ ] Always inject the **Interface**, never the concrete class
- [ ] **Factory** = new instance per call (non-shared, stateful objects)
- [ ] **Proxy** = deferred instantiation (heavy dependencies, Session objects)
- [ ] **Shared instances** = same instance every time (default, stateless services)
- [ ] `di.xml` scope: global → module global → area-specific (area-specific wins)
- [ ] Area-specific `di.xml` overrides only apply within that area code
- [ ] Virtual types = config-only variants, no PHP file, cannot be PHP-extended
- [ ] Preferences = full class substitution, only one wins per interface, use sparingly
- [ ] CLI commands run in `global` area unless explicitly set otherwise

### Plugins (Interceptors)

- [ ] Only intercept **public**, **non-final** methods on **DI-managed** (not `new`-ed) classes
- [ ] `before()` → modify input arguments → return `array` of args or `null`
- [ ] `after()` → modify return value → return same type as original method
- [ ] `around()` → full control → **must call `$proceed()`** in normal path
- [ ] Prefer `before`/`after` over `around` (performance + safety)
- [ ] `sortOrder` lower = runs first for `before`; **reverse order** for `after`
- [ ] Plugins cannot intercept other plugins
- [ ] Plugins cannot be applied to `final` classes or `final` methods
- [ ] Two modules with plugins on same method coexist — two modules with preferences conflict

### Service Contracts & Repositories

- [ ] Inject `RepositoryInterface`, not `Repository` concrete class
- [ ] Standard repository methods: `get()`, `getById()`, `getList()`, `save()`, `delete()`, `deleteById()`
- [ ] Use `SearchCriteria` + `SearchCriteriaBuilder` for repository queries in business logic
- [ ] Multiple `addFilter()` calls on same builder = **AND** logic
- [ ] `addFilters(array)` = **OR** logic within the array
- [ ] Direct collection use in business logic = anti-pattern (OK in infrastructure/import code)
- [ ] Direct SQL in business logic = anti-pattern (OK for performance-critical bulk ops)
- [ ] Extension attributes (`extension_attributes.xml`) ≠ Custom attributes (EAV)
- [ ] Extension attributes expose custom fields on any API entity
- [ ] Custom attributes are EAV-based, applied to catalog/customer entities

### GraphQL Architecture

- [ ] GraphQL **queries** (GET) = cacheable; **mutations** (POST) = never cached
- [ ] Cache invalidation uses `IdentityInterface` → returns cache tags
- [ ] `X-Magento-Cache-Id` header drives GraphQL cache variation
- [ ] Resolvers should delegate to service contracts, not resource models
- [ ] Customer-specific data should use private content, not FPC
- [ ] `cacheable: false` in schema prevents caching regardless of headers
- [ ] Context carries auth/store scope; Resolver carries business logic

### Architectural Decision Rules (Exam Traps)

- [ ] Plugin > Preference when both are possible
- [ ] Observer for side effects (can't modify return value); Plugin to modify return value
- [ ] "More control" ≠ better architecture — least invasive wins
- [ ] High confidence + wrong answer = Danger Zone misconception — highest priority to fix
- [ ] N+1 query (get() in a loop) = **always wrong** for bulk operations
- [ ] `around()` plugin that always calls `$proceed()` with no modification = code smell

### Module Architecture

- [ ] Area codes: `frontend`, `adminhtml`, `webapi_rest`, `webapi_soap`, `graphql`, `crontab`, `global`
- [ ] `registration.php` + `module.xml` = minimum module structure
- [ ] `sequence` in `module.xml` = soft dependency (load order, not hard requirement)
- [ ] `require` in `composer.json` = hard dependency
- [ ] Observer + `events.xml` = event subscription per area
- [ ] `global` events.xml applies to all areas; area-specific overrides per area

### Performance Architectural Patterns

- [ ] Move customer-specific data to `sections.xml` (private content) to enable FPC
- [ ] Use `Proxy` for heavy dependencies in frequently-instantiated classes
- [ ] Use `Factory` for objects that hold state (avoid shared state bugs)
- [ ] ESI (Edge Side Includes) for semi-static blocks that vary per context
- [ ] Never load full product collection without pagination in business logic
- [ ] `SearchCriteria` with `setPageSize` + `setCurrentPage` for safe paginated queries

---

*These notes were generated for AD0-E722 exam preparation. Always cross-reference with the official Adobe Commerce Developer Documentation and the current exam guide at [adobe.com/certification](https://business.adobe.com/products/magento/magento-commerce.html).*
