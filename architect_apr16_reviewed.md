# Magento 2 Architect Exam Study Notes
## Request Flow, Routing & External Integrations

**Goal:** Week 1 — Section 1: Design Foundations | **Date:** Apr 16

---

## Table of Contents

1. [The Full Request Lifecycle](#1-the-full-request-lifecycle)
2. [The Compilation Flow Deep Dive](#2-the-compilation-flow-deep-dive)
3. [Router Types and Priority Order](#3-router-types-and-priority-order)
4. [Forward vs Redirect — The Classic Trap](#4-forward-vs-redirect--the-classic-trap)
5. [ResultFactory — When to Use Each Type](#5-resultfactory--when-to-use-each-type)
6. [Custom Routers via RouterInterface](#6-custom-routers-via-routerinterface)
7. [Message Queues — Architecture and Flow](#7-message-queues--architecture-and-flow)
8. [DB Queue vs RabbitMQ — Architectural Decision](#8-db-queue-vs-rabbitmq--architectural-decision)
9. [Adobe I/O Events — Native Webhooks](#9-adobe-io-events--native-webhooks)
10. [Real-World Queue Examples in Core](#10-real-world-queue-examples-in-core)
11. [Scenario-Based Reasoning Guide](#11-scenario-based-reasoning-guide)
12. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. The Full Request Lifecycle

Understanding *why* each layer exists is as important as knowing the order.

```
HTTP Request
     |
     v
+------------------+
|   index.php      |  Entry point — creates the Magento app object
+------------------+
     |
     v
+------------------+
|   Bootstrap      |  Sets error handling, initializes the object manager,
|                  |  determines application area (frontend/adminhtml/etc)
+------------------+
     |
     v
+------------------+
|   App            |  Calls launch() — the real dispatcher begins here
|   (Http\App)     |
+------------------+
     |
     v
+------------------+
|  FrontController |  Iterates through RouterList to find a matching router
+------------------+
     |
     v
+------------------+
|   RouterList     |  Sorted collection of routers (sorted by sortOrder)
+------------------+
     |
     v
+------------------+
|   Router         |  Matches the request URL to a module/controller/action
|   (matched one)  |
+------------------+
     |
     v
+------------------+
|   Controller     |  execute() is called — returns a Result object
|   (Action)       |
+------------------+
     |
     v
+------------------+
|   Result         |  Knows how to render itself (Page, Json, Redirect, etc.)
|   (ResultInterface)|
+------------------+
     |
     v
+------------------+
|   Response       |  HTTP response object — headers + body sent to client
|   (Http\Response)|
+------------------+
     |
     v
HTTP Response sent to browser
```

### Layer Responsibilities (Why They're Separate)

| Layer | Responsibility | Architectural Reason |
|---|---|---|
| **Bootstrap** | Environment init, area code | Separation of infrastructure from routing |
| **App** | Lifecycle management | Single entry point, wraps exception handling |
| **FrontController** | Router orchestration | Open/Closed — add routers without modifying core |
| **RouterList** | Priority-sorted router collection | Replaces hardcoded if/else chains |
| **Router** | URL-to-action mapping | Each routing strategy is independently replaceable |
| **Controller/Action** | Business logic invocation | Thin controller, delegates to services |
| **Result** | Response type abstraction | Decouples rendering strategy from controller logic |
| **Response** | HTTP protocol output | Abstraction over raw PHP `header()`/`echo` calls |

> **Exam focus:** The `FrontController` does *not* dispatch directly — it asks each router in `RouterList` whether it can handle the request. The first router to return a non-null result wins.

> **Exam focus:** `Bootstrap` sets the *area code*. This determines which DI configuration, layout XML, and translations are loaded. Getting the area wrong is a common misconfiguration source.

### Key Classes (Fully Qualified)

```php
// Entry point
Magento\Framework\App\Bootstrap
Magento\Framework\App\Http  // implements AppInterface

// Routing layer
Magento\Framework\App\FrontController
Magento\Framework\App\RouterList
Magento\Framework\App\RouterInterface

// Result layer
Magento\Framework\Controller\ResultFactory
Magento\Framework\Controller\ResultInterface

// Response
Magento\Framework\App\Response\Http
```

---

## 2. The Compilation Flow Deep Dive

Before a request is even routed, Magento's DI compilation has resolved what objects will be injected. Understanding this prevents "why is my plugin not firing?" problems.

```
di:compile runs offline
         |
         +-> Scans all di.xml files
         |
         +-> Resolves all type preferences, plugins, virtual types
         |
         +-> Generates Interceptor proxies in generated/code/
         |
         v
Runtime: ObjectManager reads generated/code/
         instead of scanning di.xml on every request
```

> **Exam focus:** Interceptors (plugins) are *generated classes* that wrap the original. If you add a plugin and the generated folder is stale, the plugin silently does nothing. This is a deployment concern, not a code bug.

---

## 3. Router Types and Priority Order

### Priority Order (Low sortOrder = checked first)

> **⚠ CORRECTION:** The Standard Router's sortOrder is **30**, not 20. The URL Rewrite Router's sortOrder is **20** — it is checked **before** Standard, not after. Default Router is **100**, not 200. Admin Router (sortOrder 10) applies only in the **adminhtml** area and is not part of the frontend router list.

```
FRONTEND area routers (vendor/magento/module-*/etc/frontend/di.xml):
sortOrder 20   ->  URL Rewrite Router (url_rewrite table lookup)
sortOrder 30   ->  Standard/Base Router (frontName/controller/action)
sortOrder 60   ->  CMS Router (cms_page identifier lookup)
sortOrder 100  ->  Default Router (renders 404 / noroute)

ADMINHTML area routers (vendor/magento/module-backend/etc/adminhtml/di.xml):
sortOrder 10   ->  Admin Router (adminhtml routes)
sortOrder 100  ->  Default Router
```

> **Exam focus:** The numbers matter — know them exactly. URL Rewrite (20) is checked **before** Standard (30). The exam may present scenarios where knowing this order determines the correct answer.

### Why This Order?

```
URL Rewrite before Standard (20 < 30)
  -> URL Rewrite Router rewrites $request->setPathInfo() and returns Forward
  -> FrontController re-dispatches with the rewritten path
  -> Standard Router then handles the rewritten URL
  -> This is how /my-product-url.html resolves to /catalog/product/view/id/42
  -> If Standard ran first, it would 404 on the pretty URL before rewriting

Standard before CMS (30 < 60)
  -> Module routes are explicit (registered in routes.xml)
  -> CMS routes are data-driven (database records)
  -> Explicit code takes precedence over data
  -> Prevents a CMS page from accidentally shadowing a module route

CMS before Default (60 < 100)
  -> CMS pages get a chance to match before 404 is rendered
  -> If no CMS page matches: Default Router returns the noroute page
```

### The Standard Router — Anatomy

```
URL: /catalog/product/view/id/42
      |        |         |
      |        |         +-- Action name: View
      |        +------------ Controller name: Product
      +-------------------- FrontName (registered in routes.xml): catalog
```

```xml
<!-- routes.xml — how a frontName is registered -->
<!-- File: Vendor/Module/etc/frontend/routes.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:App/etc/routes.xsd">
    <router id="standard">
        <route id="catalog" frontName="catalog">
            <module name="Magento_Catalog"/>
        </route>
    </router>
</config>
```

> **Exam focus:** The `frontName` in `routes.xml` is what appears in the URL. The `route id` is used internally for layout handle generation (e.g., `catalog_product_view`). They can differ — and often do in third-party modules that want short URLs but descriptive IDs.

### The Admin Router

```xml
<!-- routes.xml for admin area -->
<!-- File: Vendor/Module/etc/adminhtml/routes.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:App/etc/routes.xsd">
    <router id="admin">
        <route id="mymodule" frontName="mymodule">
            <module name="Vendor_MyModule"/>
        </route>
    </router>
</config>
```

> **Exam focus:** Admin routes use `router id="admin"`, not `"standard"`. Using the wrong router ID means the route registers in the wrong pool and never matches.

### The CMS Router

- Queries `cms_page` table for matching `identifier`
- Does **not** use `routes.xml` — it's data-driven
- Renders via `\Magento\Cms\Controller\Page\View`

### The URL Rewrite Router

- Queries `url_rewrite` table
- Can target: CMS pages, catalog categories, catalog products, custom paths
- Supports 301/302 redirect entries in addition to rewrites

### The Default Router (404)

- Always matches — it is the catch-all
- Dispatches to `\Magento\Cms\Controller\Noroute\Index` (which uses `ForwardFactory` internally)
- Renders the configured "No Route" CMS page; falls back to `defaultNoRoute` action if no CMS page is configured

---

## 4. Forward vs Redirect — The Classic Trap

This is explicitly called out as a frequent exam error. Understand the *mechanism* difference.

### `_forward()` — Internal Request Mutation

```php
// Inside a controller action:
return $this->resultFactory->create(ResultFactory::TYPE_FORWARD)
    ->setModule('cms')
    ->setController('page')
    ->setAction('view')
    ->setParams(['page_id' => 2]);
```

**What happens internally:**

```
Client Browser                    Magento Server
     |                                  |
     |--- GET /my-path ---------------->|
     |                                  |
     |                   Controller A calls _forward
     |                   (modifies $request object)
     |                                  |
     |                   FrontController re-dispatches
     |                   with NEW module/controller/action
     |                                  |
     |                   Controller B executes
     |                                  |
     |<-- 200 OK (Controller B output)--|
     |
URL in browser: still shows /my-path
HTTP requests: ONLY 1
```

> **Exam focus:** `_forward` mutates the `Request` object and re-enters the dispatch loop. The browser sees **one** HTTP request. The URL in the address bar does **not** change. There is **no new HTTP round-trip**.

### `_redirect()` — New HTTP Request Issued

```php
// Inside a controller action:
return $this->resultFactory->create(ResultFactory::TYPE_REDIRECT)
    ->setPath('customer/account/login');
    // or with full URL:
    // ->setUrl('https://example.com/other-page');
```

**What happens:**

```
Client Browser                    Magento Server
     |                                  |
     |--- GET /protected-page --------->|
     |                                  |
     |                   Controller issues 302
     |                                  |
     |<-- 302 Location: /customer/account/login --|
     |
     |--- GET /customer/account/login ->|
     |                                  |
     |<-- 200 OK (login page) ----------|
     |
URL in browser: /customer/account/login
HTTP requests: 2
```

> **Exam focus:** `_redirect` sends a **302 HTTP response** (or 301 if configured). The browser makes a **new HTTP request**. The URL in the address bar **changes**.

### The Classic Exam Mistake

```
Scenario: "The customer hits /checkout/cart/add, the cart is empty,
           and you want them to see the product page without
           knowing they were redirected."

WRONG: Use _redirect — browser URL changes, two HTTP requests,
       customer sees /catalog/product/view in address bar

RIGHT: Use _forward — single request, URL stays the same,
       seamless internal handoff
```

```
Scenario: "After successful login, send the customer to their
           account dashboard."

WRONG: Use _forward — the customer would still see /customer/account/login
       in their browser, refreshing would re-trigger the login action

RIGHT: Use _redirect — clean URL, browser history entry,
       prevents form resubmission on refresh (PRG pattern)
```

> **Exam focus:** The **Post/Redirect/Get (PRG) pattern** is the architectural reason `_redirect` must be used after form submissions. If you `_forward` after a POST, a browser refresh re-submits the form.

### Side-by-Side Comparison

| Aspect | `_forward` | `_redirect` |
|---|---|---|
| HTTP requests | 1 | 2 |
| Browser URL | Unchanged | Changes |
| HTTP status | None (internal) | 302 (default) |
| Use after POST? | **No** (breaks PRG) | **Yes** |
| Use for seamless handoff? | **Yes** | No |
| Session data preserved? | Yes (same request) | Yes (persists across requests) |
| Can cross domains? | No | Yes |
| Performance | Slightly faster | Extra round-trip |

---

## 5. ResultFactory — When to Use Each Type

```php
// Inject ResultFactory into your controller
public function __construct(
    \Magento\Framework\App\Action\Context $context,
    \Magento\Framework\Controller\ResultFactory $resultFactory
) {
    parent::__construct($context);
    // $this->resultFactory is set by parent context
}
```

### Result Types Reference

```php
// Available constants on ResultFactory:
ResultFactory::TYPE_PAGE     = 'page'
ResultFactory::TYPE_JSON     = 'json'
ResultFactory::TYPE_RAW      = 'raw'
ResultFactory::TYPE_REDIRECT = 'redirect'
ResultFactory::TYPE_FORWARD  = 'forward'
```

### TYPE_PAGE — Full HTML Page

```php
public function execute(): \Magento\Framework\Controller\ResultInterface
{
    /** @var \Magento\Framework\View\Result\Page $resultPage */
    $resultPage = $this->resultFactory->create(ResultFactory::TYPE_PAGE);

    // Optionally configure the page
    $resultPage->getConfig()->getTitle()->prepend(__('My Page Title'));

    return $resultPage;
}
```

**When to use:**
- Any controller that renders a full HTML page with layout XML
- Loads layout handles, blocks, templates
- Fires `layout_load_before`, `layout_generate_blocks_before` events
- **Do not use** for AJAX endpoints — it loads the entire layout system

> **Exam focus:** `TYPE_PAGE` triggers the full layout rendering pipeline. This is expensive. Using it for AJAX responses is an architectural anti-pattern.

### TYPE_JSON — AJAX/API Responses

```php
public function execute(): \Magento\Framework\Controller\ResultInterface
{
    /** @var \Magento\Framework\Controller\Result\Json $resultJson */
    $resultJson = $this->resultFactory->create(ResultFactory::TYPE_JSON);

    $resultJson->setData([
        'success' => true,
        'message' => __('Item added to cart'),
        'cart_count' => 3,
    ]);

    return $resultJson;
}
```

**When to use:**
- AJAX controller endpoints
- Returns `Content-Type: application/json`
- Automatically `json_encode()`s the data array
- **Do not use** for REST API endpoints — use Web API framework instead

> **Exam focus:** `TYPE_JSON` is for *custom controller AJAX*. For REST API endpoints, you implement `\Magento\Framework\App\Action\HttpGetActionInterface` and define routes in `webapi.xml`. These are fundamentally different.

### TYPE_RAW — Binary/Custom Content

```php
public function execute(): \Magento\Framework\Controller\ResultInterface
{
    /** @var \Magento\Framework\Controller\Result\Raw $resultRaw */
    $resultRaw = $this->resultFactory->create(ResultFactory::TYPE_RAW);

    $resultRaw->setHeader('Content-Type', 'text/csv');
    $resultRaw->setHeader('Content-Disposition', 'attachment; filename="export.csv"');
    $resultRaw->setContents($this->generateCsvContent());

    return $resultRaw;
}
```

**When to use:**
- File downloads (CSV, PDF, XML exports)
- Custom `Content-Type` headers not covered by other types
- Webhook response bodies
- Image serving from custom paths

> **Exam focus:** `TYPE_RAW` bypasses all layout processing. It gives you a blank response canvas. Use it when you need total control over the response body.

### TYPE_REDIRECT — HTTP Redirect

```php
public function execute(): \Magento\Framework\Controller\ResultInterface
{
    /** @var \Magento\Framework\Controller\Result\Redirect $resultRedirect */
    $resultRedirect = $this->resultFactory->create(ResultFactory::TYPE_REDIRECT);

    // Using a path (relative, Magento route format)
    $resultRedirect->setPath('customer/account/login', ['_secure' => true]);

    // Using a full URL
    // $resultRedirect->setUrl('https://example.com');

    // Permanent redirect (301)
    // $resultRedirect->setHttpResponseCode(301);

    return $resultRedirect;
}
```

**When to use:**
- After successful form submission (PRG pattern)
- Authentication gates (redirect to login)
- Deprecated URL cleanup
- Post-purchase order success page

### TYPE_FORWARD — Internal Re-dispatch

```php
public function execute(): \Magento\Framework\Controller\ResultInterface
{
    /** @var \Magento\Framework\Controller\Result\Forward $resultForward */
    $resultForward = $this->resultFactory->create(ResultFactory::TYPE_FORWARD);

    $resultForward->forward('noroute'); // forward to 404
    // or full specification:
    $resultForward
        ->setModule('cms')
        ->setController('page')
        ->setAction('view');

    return $resultForward;
}
```

**When to use:**
- Routing to 404 when an entity is not found
- A/B testing where the URL stays the same but content differs
- Legacy URL support without database rewrites
- When the same URL must show different content based on context

> **Exam focus:** In `TYPE_FORWARD`, if you call `->forward('noroute')` with no module/controller, Magento uses the current module and controller, only changing the action. Always specify all three if routing cross-module.

---

## 6. Custom Routers via RouterInterface

### When Do You Need a Custom Router?

```
Standard scenarios (routes.xml is enough):
  /catalog/product/view/id/42      -> Standard Router handles this
  /my-store-category               -> URL Rewrite or CMS Router

Custom router needed:
  /p/{sku}                         -> Non-standard URL pattern
  /brand/{brand-name}              -> Dynamic segment matching
  /user/{username}/profile         -> User vanity URLs
  /{country-code}/shop             -> Locale-based prefix routing
```

### Implementation

```php
<?php
// File: Vendor/Module/Model/Router.php

declare(strict_types=1);

namespace Vendor\Module\Model;

use Magento\Framework\App\ActionFactory;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\App\RouterInterface;

class Router implements RouterInterface
{
    private ActionFactory $actionFactory;

    public function __construct(ActionFactory $actionFactory)
    {
        $this->actionFactory = $actionFactory;
    }

    /**
     * Match application action by request
     * Return null if this router cannot handle the request
     * Return an ActionInterface if we can handle it
     */
    public function match(RequestInterface $request): ?\Magento\Framework\App\ActionInterface
    {
        $identifier = trim($request->getPathInfo(), '/');

        // Pattern: /brand/{brand-slug}
        if (!preg_match('/^brand\/([a-z0-9\-]+)$/', $identifier, $matches)) {
            return null; // Not our pattern — let next router try
        }

        $brandSlug = $matches[1];

        // Mutate the request to point to our real controller
        $request->setModuleName('vendor_brands')
                ->setControllerName('brand')
                ->setActionName('view')
                ->setParam('slug', $brandSlug);

        // Return the action instance — FrontController will call execute() on it
        // ActionFactory::create() takes only the class name — no second argument
        return $this->actionFactory->create(
            \Magento\Framework\App\Action\Forward::class
        );
    }
}
```

> **⚠ CORRECTION:** `ActionFactory::create()` accepts **only one argument** — the fully qualified class name. There is no second `$data` array parameter. The request is mutated via `setModuleName()`/`setControllerName()`/`setActionName()` before calling `create()`. (Confirmed: `vendor/magento/framework/App/ActionFactory.php:37`)

### Registration in di.xml

```xml
<!-- File: Vendor/Module/etc/frontend/di.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">

    <type name="Magento\Framework\App\RouterList">
        <arguments>
            <argument name="routerList" xsi:type="array">
                <item name="vendor_brands" xsi:type="array">
                    <item name="class" xsi:type="string">Vendor\Module\Model\Router</item>
                    <!--
                        sortOrder determines when this router is tried
                        Lower number = checked earlier
                        URL Rewrite = 20, Standard/Base = 30, CMS = 60, Default = 100
                        Put below 30 for priority over Standard Router
                        Put between 30-60 to let module routes win first
                    -->
                    <item name="sortOrder" xsi:type="string">35</item>
                    <item name="disable" xsi:type="string">false</item>
                </item>
            </argument>
        </arguments>
    </type>

</config>
```

> **Exam focus:** Custom routers are registered in `di.xml` as items in `RouterList`, **not** in `routes.xml`. The `routes.xml` file is only for Standard Router frontName registration.

> **Exam focus:** Your `match()` method **must return `null`** if the URL does not belong to your router. Returning anything else stops the router chain — all subsequent routers are skipped. This is a common bug where a misconfigured custom router swallows all traffic.

### Architectural Decision: Custom Router vs URL Rewrite

```
Custom Router is better when:
  - Pattern is algorithmic (regex-based, derived from data)
  - You need to resolve a slug to an entity ID dynamically
  - The URL pattern is too complex for static rewrite entries
  - You need to support wildcard patterns

URL Rewrite table is better when:
  - URLs are known at generation time (product/category saves)
  - You need 301 redirect entries for SEO
  - Marketing team manages URLs through Admin UI
  - Performance matters more (table lookup vs PHP code execution)
```

---

## 7. Message Queues — Architecture and Flow

### Why Message Queues Exist (The Architectural Purpose)

```
Without queues (synchronous):
  HTTP Request -> Long process -> HTTP Response
  |<-------------- 30+ seconds ------------->|
  Browser may timeout. User sees slow page.
  Server process tied up. Can't handle other requests.

With queues (asynchronous):
  HTTP Request -> Publish message -> HTTP Response (200ms)
  |<------ fast ------>|
                         ... later ...
                         Consumer picks up message
                         Processes in background
                         No HTTP timeout risk
```

### The Message Flow

```
Publisher (PHP code)
     |
     | publishes to topic
     v
+------------------+
|  Message Broker  |  Either: MySQL queue table (mqueue)
|  (queue)         |  Or:     RabbitMQ exchange/queue
+------------------+
     |
     | consumer polls/subscribes
     v
Consumer (CLI process)
     |
     | calls handler
     v
Handler (PHP class)
     |
     v
Business logic executed (inventory update, order processing, etc.)
```

### Defining a Queue — `queue.xml`

```xml
<!-- File: Vendor/Module/etc/queue.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/queue.xsd">

    <!--
        Exchange: the "post office" that receives published messages
        and routes them to queues based on binding rules
    -->
    <broker topic="vendor.module.order.placed"
            type="db"                           <!-- or "amqp" for RabbitMQ -->
            connection="db">                    <!-- connection name from env.php -->

        <queue name="vendor.module.order.placed"
               handler="Vendor\Module\Model\Queue\OrderPlacedHandler::process"
               consumerInstance="Magento\Framework\MessageQueue\Consumer"
               maxMessages="100"/>              <!-- process 100 then exit, restart fresh -->
    </broker>

</config>
```

### Defining Topics and Data Types — `communication.xml`

```xml
<!-- File: Vendor/Module/etc/communication.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Communication/etc/communication.xsd">

    <!--
        A topic defines:
        - The message "contract" (what data type is sent)
        - Whether it's synchronous or asynchronous
    -->
    <topic name="vendor.module.order.placed"
           request="Magento\Sales\Api\Data\OrderInterface">
        <!--
            No <handler> here if using queue.xml for async
            Add <handler> here for synchronous topics
        -->
    </topic>

</config>
```

> **Exam focus:** `communication.xml` defines the **topic and its data contract**. `queue.xml` defines **how messages on that topic are consumed** (which queue, which connection, which handler). They work together — a topic without a queue binding is synchronous; a queue without a topic definition won't compile.

### The Publisher — Sending a Message

```php
<?php
// File: Vendor/Module/Model/OrderProcessor.php

declare(strict_types=1);

namespace Vendor\Module\Model;

use Magento\Framework\MessageQueue\PublisherInterface;
use Magento\Sales\Api\Data\OrderInterface;

class OrderProcessor
{
    private const TOPIC = 'vendor.module.order.placed';

    private PublisherInterface $publisher;

    public function __construct(PublisherInterface $publisher)
    {
        $this->publisher = $publisher;
    }

    public function processOrderAsync(OrderInterface $order): void
    {
        // This returns immediately — does NOT wait for processing
        // The order object is serialized and put in the queue
        $this->publisher->publish(self::TOPIC, $order);
    }
}
```

### The Consumer Handler

```php
<?php
// File: Vendor/Module/Model/Queue/OrderPlacedHandler.php

declare(strict_types=1);

namespace Vendor\Module\Model\Queue;

use Magento\Sales\Api\Data\OrderInterface;
use Psr\Log\LoggerInterface;

class OrderPlacedHandler
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    /**
     * Called by the consumer for each dequeued message
     * This runs in a separate CLI process, not in the HTTP request
     */
    public function process(OrderInterface $order): void
    {
        $this->logger->info('Processing order async: ' . $order->getIncrementId());

        // Long-running or resource-intensive work happens here
        // - Send confirmation emails
        // - Update ERP systems
        // - Trigger warehouse notifications
        // - Calculate complex inventory reservations
    }
}
```

### Starting Consumers

```bash
# Start a named consumer (runs until maxMessages limit or manual stop)
bin/magento queue:consumers:start vendor.module.order.placed

# Start with custom message limit (overrides queue.xml maxMessages)
bin/magento queue:consumers:start vendor.module.order.placed --max-messages=500

# List all registered consumers
bin/magento queue:consumers:list

# Single-run mode (process available messages then exit — good for cron)
bin/magento queue:consumers:start vendor.module.order.placed --single-thread --max-messages=1000
```

> **Exam focus:** If `queue:consumers:start` is **not running**, async messages sit in the queue unprocessed indefinitely. The HTTP request returns success (message was published), but the actual work never happens. This is a deployment configuration responsibility, not a code bug.

---

## 8. DB Queue vs RabbitMQ — Architectural Decision

This is an architect-level topic — know *when* to choose each and *why*.

### DB Queue (MySQL)

```
Architecture:
  Publisher -> INSERT row into `queue_message` table
  Consumer -> SELECT row, process, DELETE row

Connection type in env.php: "db"
```

**Characteristics:**

| Aspect | DB Queue |
|---|---|
| Setup complexity | Zero — uses existing MySQL |
| Throughput | Low-medium (database polling) |
| Message persistence | Yes (database) |
| Ordering | Approximate FIFO |
| Dead letter queue | No native support |
| Horizontal scaling | Poor (consumers compete on same table) |
| Message TTL | No native support |
| Monitoring | Via database queries |

**When DB Queue is architecturally correct:**

```
- Magento Open Source (no RabbitMQ in cloud hosting)
- Low-volume async processing (< 1000 messages/hour)
- Development environments
- Simple cron-triggered batch processing
- When the team cannot operate a RabbitMQ cluster
- When transactional consistency with the DB is required
```

### RabbitMQ (AMQP)

```
Architecture:
  Publisher -> RabbitMQ Exchange -> RabbitMQ Queue(s)
  Consumer (long-running) -> RabbitMQ Queue (push-based)

Connection type in env.php: "amqp"
```

**Characteristics:**

| Aspect | RabbitMQ |
|---|---|
| Setup complexity | High (dedicated service, clustering) |
| Throughput | Very high (purpose-built) |
| Message persistence | Yes (with durable queues) |
| Ordering | Strict FIFO per queue |
| Dead letter queue | Native support |
| Horizontal scaling | Excellent (multiple consumers) |
| Message TTL | Native support |
| Monitoring | RabbitMQ Management UI, metrics |

**When RabbitMQ is architecturally correct:**

```
- Adobe Commerce Cloud (provisioned automatically)
- High-volume order processing
- Multiple consumers needed in parallel
- You need dead-letter queues for failed messages
- Inventory updates that must not lose messages
- When you need message routing (fanout, topic exchange patterns)
- Long-running background processes
```

### env.php Configuration

```php
// DB Queue configuration
'queue' => [
    'consumers_wait_for_messages' => 0,  // 0 = exit when queue empty (good for cron)
    'default_connection' => 'db',
],

// RabbitMQ configuration
'queue' => [
    'amqp' => [
        'host' => 'rabbitmq',      // service name in Docker / Cloud
        'port' => '5672',
        'user' => 'guest',
        'password' => 'guest',
        'virtualhost' => '/',
        'ssl' => '',
    ],
],
```

### RabbitMQ in Adobe Commerce Cloud — Supervisord

```
Cloud Architecture:
  Magento App Container
    |
    +-- PHP-FPM (handles HTTP requests)
    |
    +-- Supervisord (process manager)
         |
         +-- consumer:start async.operations.all
         |   (long-running, supervisord auto-restarts on failure)
         |
         +-- consumer:start inventory.reservations.updateSalabilityStatus
         |   (long-running)
         |
         +-- ... other consumers
```

```yaml
# .magento.app.yaml — consumer configuration for Cloud
workers:
    queue:
        commands:
            start: |
                php bin/magento queue:consumers:start async.operations.all \
                    --max-messages=10000 --multi-process=4
        disk: 512
```

> **Exam focus:** On Adobe Commerce Cloud, RabbitMQ consumers are **long-running processes** managed by **supervisord**. They are NOT cron jobs. They do NOT exit after each message. Supervisord ensures they restart if they crash. This is a fundamental operational difference from DB queue consumers.

> **Exam focus:** The `--multi-process` flag runs multiple consumer processes per consumer definition. With RabbitMQ, this allows true parallel processing. With DB queue, multiple processes compete for the same table rows (potential for duplicate processing without proper locking).

### Decision Matrix

```
Question 1: Do you have RabbitMQ available?
  No  -> Use DB Queue. Stop here.
  Yes -> Continue.

Question 2: What is your message volume?
  < 500/hour  -> DB Queue is fine (simpler operations)
  > 500/hour  -> RabbitMQ strongly recommended

Question 3: Do you need parallel consumers?
  No  -> Either works
  Yes -> RabbitMQ (DB queue has contention issues)

Question 4: Do you need dead-letter queues?
  No  -> Either works
  Yes -> RabbitMQ only

Question 5: Is this Adobe Commerce Cloud?
  Yes -> RabbitMQ is already provisioned, use it
```

---

## 9. Adobe I/O Events — Native Webhooks

### What Problem Does It Solve?

```
Traditional approach (polling):
  External system polls Magento every N minutes
  |
  +-- Unnecessary load on Magento even when nothing changed
  +-- Up to N-minute delay before external system sees change
  +-- External system needs credentials to access Magento API
  +-- Scales poorly (more integrations = more polling)

Adobe I/O Events approach (push):
  Magento event fires (order placed, product updated)
  |
  +-- Event published to Adobe I/O Runtime
  +-- I/O Runtime immediately pushes to registered webhooks
  +-- Near-real-time (sub-second delivery)
  +-- External system receives data, doesn't need to poll
  +-- Decoupled — external system credentials not needed in Magento
```

### Architecture Overview

```
Magento 2.4.x
     |
     | (1) Core/custom event fires
     v
Adobe Commerce Events Module
(module-adobe-commerce-events-client)
     |
     | (2) Publishes event to I/O Events service
     v
Adobe I/O Events Service (Adobe Cloud)
     |
     | (3) Routes to subscribed consumers
     v
+------------------+    +------------------+    +------------------+
|  App Builder     |    |  External         |    |  Other Adobe     |
|  Action          |    |  Webhook URL      |    |  Services        |
+------------------+    +------------------+    +------------------+
```

> **⚠ CORRECTION:** The correct module name is `module-adobe-commerce-events-client` (module name: `Magento_AdobeCommerceEventsClient`), not `module-adobe-io-events-client`. The io-events-client module handles lower-level Adobe I/O connectivity; the commerce-events-client module provides the event subscription and `io_events.xml` schema.

### Setting Up Event Registration

```xml
<!-- File: Vendor/Module/etc/io_events.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_AdobeCommerceEventsClient:etc/io_events.xsd">

    <!-- Register which Magento events should be forwarded to I/O -->
    <event name="observer.sales_order_place_after">
        <fields>
            <field name="order_id"/>
            <field name="increment_id"/>
            <field name="customer_email"/>
            <field name="grand_total"/>
        </fields>
    </event>

    <event name="observer.catalog_product_save_after">
        <fields>
            <field name="entity_id"/>
            <field name="sku"/>
            <field name="name"/>
            <field name="price"/>
        </fields>
    </event>

</config>
```

> **⚠ CORRECTION:** Schema URN is `urn:magento:module:Magento_AdobeCommerceEventsClient:etc/io_events.xsd` — the XSD lives at `vendor/magento/module-adobe-commerce-events-client/etc/io_events.xsd`. The notes originally referenced the wrong module.

> **Exam focus:** `io_events.xml` registers which Magento observers/events should be forwarded to Adobe I/O. The `fields` element controls which data is included — this is a **data reduction** mechanism (don't send the entire order object, just what subscribers need).

### I/O Events vs Message Queues — Choosing the Right Tool

```
I/O Events is for:
  - Outbound notifications to EXTERNAL systems
  - Webhook-style integrations (ERP, CRM, PIM, OMS)
  - Adobe App Builder applications
  - Cross-Adobe service communication
  - When you need near-real-time external notifications

Message Queues are for:
  - INTERNAL async processing within Magento
  - Deferring heavy operations (inventory, email, indexing)
  - Decoupling Magento modules from each other
  - Background jobs that are part of the Magento operation
```

> **Exam focus:** I/O Events is an **outbound integration** mechanism. Message queues are an **internal deferral** mechanism. An architect who uses a message queue to notify an external ERP is introducing unnecessary coupling. An architect who uses I/O Events for internal inventory updates is over-engineering.

### Adobe I/O Events — Key Requirements (2.4.x)

- Requires `magento/module-adobe-commerce-events-client` extension
- Requires Adobe Commerce license (not Open Source)
- Requires connection to Adobe I/O Runtime (cloud service)
- Events are delivered **at-least-once** (idempotent consumers recommended)
- Failed delivery uses exponential backoff retry

---

## 10. Real-World Queue Examples in Core

### The `async.operations.all` Consumer (Bulk/Async REST API)

```
The consumer named "async.operations.all" handles bulk REST API operations.
It is defined in module-webapi-async, NOT module-async-order.

vendor/magento/module-webapi-async/etc/queue_consumer.xml:
  consumer name="async.operations.all"
  queue="async.operations.all"
  consumerInstance="Magento\AsynchronousOperations\Model\MassConsumer"
```

> **⚠ CORRECTION:** `module-async-order` does NOT use topic `async.operations.all`. The async-order module has its own topic `async_order.placeOrder` with handler `Magento\AsyncOrder\Model\Consumer::process` and queue name `placeOrder`. The `async.operations.all` consumer is for the bulk REST API feature (`/rest/async/bulk/V1/...`) and lives in `module-webapi-async`.

### Browsing `module-async-order` (Actual Content)

```
vendor/magento/module-async-order/
  |
  +-- etc/
  |    +-- communication.xml    <- Topic: async_order.placeOrder
  |    +-- queue.xml            <- Consumer: Magento\AsyncOrder\Model\Consumer::process
  |
  +-- Model/
       +-- AsyncPaymentInformationGuestPublisher.php
       +-- Consumer.php   <- The actual handler class
```

```xml
<!-- Actual module-async-order/etc/queue.xml (simplified) -->
<!-- Topic: async_order.placeOrder | Queue: placeOrder | Exchange: magento -->
<!-- Handler: Magento\AsyncOrder\Model\Consumer::process -->
```

### Inventory Queue Topics (module-inventory-indexer)

> **⚠ CORRECTION:** `module-inventory-message-bus` does **not exist** in the codebase. Inventory queue topics are defined in `module-inventory-indexer/etc/communication.xml`. The actual request types also differ from what was originally noted:

```xml
<!-- Actual topics in module-inventory-indexer/etc/communication.xml -->

<!-- Uses int[] (source item IDs), NOT SourceItemInterface[] -->
<topic name="inventory.indexer.sourceItem"
       request="int[]">
</topic>

<!-- Uses Magento\InventoryIndexer\Model\Queue\ReservationData, NOT ReservationInterface[] -->
<topic name="inventory.reservations.updateSalabilityStatus"
       request="Magento\InventoryIndexer\Model\Queue\ReservationData">
</topic>
```

### Key Observations from Core Code

```
Pattern 1: Topic names follow dot-notation namespacing
  inventory.reservations.updateSalabilityStatus
  async.operations.all
  async_order.placeOrder (underscores also appear — not always dots)

Pattern 2: maxMessages is always set (prevents memory leaks)
  Long-running PHP processes accumulate memory
  After N messages, process exits and supervisord restarts it

Pattern 3: communication.xml and queue.xml are always paired
  One defines the contract, the other defines the consumption

Pattern 4: Handlers are always class::method
  "Vendor\Module\Model\Consumer::process"
  Never just a class — always specifies the method
```

---

## 11. Scenario-Based Reasoning Guide

The exam presents situations where multiple answers are *technically correct* but only one is *architecturally superior*. Here is a reasoning framework.

### Scenario Type 1: Routing Decision

```
"A client wants pretty URLs like /brand/nike for a custom brand catalog.
 Multiple approaches are possible. Which is architecturally best?"

Option A: Add URL rewrites in Admin for each brand
Option B: Create a custom Router implementing RouterInterface
Option C: Create a standard controller with routes.xml and redirect from old URLs
Option D: Override CMS Router to handle /brand/* pattern

Analysis:
  A - Fails for dynamic data. Each new brand needs a manual rewrite. Not scalable.
  B - CORRECT. Pattern-based routing. No database writes per brand. Extensible.
  C - Wrong tool. Standard controller needs an explicit frontName match.
  D - Dangerous. Overriding core routers violates Open/Closed principle.

ANSWER: B
REASON: Custom router handles algorithmic URL patterns without database per-record overhead.
```

### Scenario Type 2: Forward vs Redirect

```
"A controller checks if a product is available. If not, it should show
 a 'product not found' page but the URL /catalog/product/view/id/999
 should remain in the address bar."

ANSWER: _forward to noroute or custom 404 action
REASON: URL must stay the same. _redirect changes the URL.
```

```
"After a customer submits a contact form, they should see a success page.
 Pressing Back in the browser should NOT resubmit the form."

ANSWER: _redirect to success page (PRG pattern)
REASON: After POST, always redirect. Forward keeps POST state in browser history.
```

### Scenario Type 3: Queue vs Synchronous

```
"When an order is placed, Magento must notify an external ERP system.
 The ERP call takes 2-3 seconds. Which approach is architecturally best?"

Option A: Call ERP API directly in the order_place_after observer
Option B: Use message queue + consumer to call ERP asynchronously
Option C: Use Adobe I/O Events to push order data to ERP webhook
Option D: Use a cron job to batch-send orders every 5 minutes

Analysis:
  A - Adds 2-3 seconds to checkout. ERP failure = checkout failure. Bad.
  B - Good. Async, decoupled. But adds operational complexity (consumer management).
  C - BEST if ERP has webhook capability. Near-real-time, zero Magento overhead.
  D - Acceptable for non-time-critical. 5-minute delay may be acceptable.

Nuance: If ERP has webhooks -> C. If ERP is API-only -> B.
If this is Open Source (no I/O Events) -> B.
```

### Scenario Type 4: DB Queue vs RabbitMQ

```
"A merchant processes 50,000 orders per day with complex inventory reservations.
 Which queue backend is architecturally required?"

ANSWER: RabbitMQ
REASON: 50,000 orders/day = ~35/minute = ~0.6/second sustained.
With burst traffic, peaks could be 5-10x. DB queue table becomes a bottleneck.
RabbitMQ handles thousands per second. Inventory reservations need reliable,
ordered processing. Multiple consumers can process in parallel.
```

### Scenario Type 5: Result Type Selection

```
"An AJAX request asks for the cart item count to update the minicart counter."

WRONG: TYPE_PAGE (loads entire layout system, massively over-engineered)
WRONG: TYPE_RAW (works but no automatic JSON encoding, error-prone)
RIGHT: TYPE_JSON (purpose-built for AJAX JSON responses)
```

```
"A controller needs to serve a PDF invoice download."

WRONG: TYPE_PAGE (layout system doesn't serve binary files)
WRONG: TYPE_JSON (can't encode binary data meaningfully)
RIGHT: TYPE_RAW (set Content-Type: application/pdf, send binary content)
```

---

## Quick-Reference Checklist

### Request Lifecycle

- [ ] Order: `index.php` → `Bootstrap` → `App` → `FrontController` → `RouterList` → `Router` → `Controller` → `Result` → `Response`
- [ ] `Bootstrap` sets area code — determines which DI/layout/translations are loaded
- [ ] `FrontController` iterates `RouterList` by `sortOrder`; first non-null match wins
- [ ] Controller `execute()` returns a `ResultInterface` — never echoes directly

### Router Priority (sortOrder) — Frontend Area

- [ ] URL Rewrite (20) → Standard/Base (30) → CMS (60) → Default/404 (100)
- [ ] Admin Router (10) is in **adminhtml** area only — not part of frontend routing
- [ ] URL Rewrite Router: rewrites path and re-dispatches; Standard then handles the rewritten URL
- [ ] Standard Router: `frontName/controller/action` mapped via `routes.xml`
- [ ] CMS Router: database-driven, queries `cms_page` table
- [ ] Default Router: always matches, renders configured "No Route" CMS page (404)

### Forward vs Redirect

- [ ] `_forward`: **1 HTTP request**, URL unchanged, mutates `$request` object, re-enters dispatch loop
- [ ] `_redirect`: **2 HTTP requests**, URL changes, issues 302, browser makes new request
- [ ] After form POST: always `_redirect` (PRG pattern prevents double-submission)
- [ ] To keep URL same while changing content: `_forward`
- [ ] Mixing them up on exam = wrong answer

### ResultFactory Types

- [ ] `TYPE_PAGE`: full HTML page, loads layout XML, expensive
- [ ] `TYPE_JSON`: AJAX responses, auto-encodes, sets `Content-Type: application/json`
- [ ] `TYPE_RAW`: binary downloads, custom content types, no layout processing
- [ ] `TYPE_REDIRECT`: HTTP 302, browser follows, URL changes
- [ ] `TYPE_FORWARD`: internal re-dispatch, same request, URL unchanged

### Custom Routers

- [ ] Implement `\Magento\Framework\App\RouterInterface`
- [ ] Register in `di.xml` as item in `Magento\Framework\App\RouterList` argument
- [ ] NOT in `routes.xml` (that's for Standard Router frontNames only)
- [ ] `match()` must return `null` if URL doesn't belong to this router
- [ ] `sortOrder` in `di.xml` controls when custom router is tried
- [ ] `ActionFactory::create()` takes **one argument only** — the class name string

### Message Queues

- [ ] `communication.xml`: defines topic name and data type (the contract)
- [ ] `queue.xml`: defines consumer, queue name, handler, connection type, maxMessages
- [ ] Both files required for async processing — they work as a pair
- [ ] `queue:consumers:start <name>` must be running for messages to be processed
- [ ] If consumer not running: messages queue up, work never happens, requests still return 200
- [ ] `maxMessages` prevents memory leaks in long-running PHP processes
- [ ] DB queue: MySQL polling, simple, low throughput, no clustering
- [ ] RabbitMQ: push-based, high throughput, dead-letter queues, horizontal scaling
- [ ] Adobe Commerce Cloud: RabbitMQ consumers are **long-running processes** managed by **supervisord**
- [ ] NOT cron jobs — supervisord auto-restarts crashed consumers

### DB Queue vs RabbitMQ Decision

- [ ] Magento Open Source / low volume / simple setup → DB Queue
- [ ] Adobe Commerce Cloud / high volume / parallel consumers → RabbitMQ
- [ ] Dead-letter queue needed → RabbitMQ only
- [ ] Transactional consistency with MySQL needed → DB Queue
- [ ] Cloud auto-provisions RabbitMQ — use it when available

### Adobe I/O Events

- [ ] Purpose: **outbound webhooks** to external systems (ERP, CRM, App Builder)
- [ ] Registered in `io_events.xml` per module (`Magento_AdobeCommerceEventsClient` provides the XSD)
- [ ] Schema: `urn:magento:module:Magento_AdobeCommerceEventsClient:etc/io_events.xsd`
- [ ] `fields` element = data reduction (send only what's needed)
- [ ] Requires Adobe Commerce (not Open Source)
- [ ] At-least-once delivery → consumers must be idempotent
- [ ] I/O Events = external integrations; Message Queues = internal async
- [ ] Do not use message queue to notify external systems when I/O Events is available

### Architectural Decision Principles

- [ ] Use `_forward` when URL must not change
- [ ] Use `_redirect` after any POST form submission (PRG pattern)
- [ ] Use `TYPE_JSON` for AJAX, not `TYPE_PAGE`
- [ ] Use `TYPE_RAW` for file downloads
- [ ] Custom router for algorithmic URL patterns; URL Rewrite table for data-driven URLs
- [ ] RabbitMQ when message volume or parallel processing is a concern
- [ ] I/O Events for external system notifications, queues for internal deferral
- [ ] Consumer not running = silent async failure (exam scenario trap)

---

*Study notes generated for the Magento 2 Architect Exam — Section 1: Design Foundations*
*Focus: Architectural reasoning over syntax memorization*
