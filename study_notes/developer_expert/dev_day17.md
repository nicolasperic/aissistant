# Day 17 — Adobe I/O Events & Webhooks

## Table of Contents
- [1. Overview & Architecture](#1-overview--architecture)
- [2. Adobe I/O Events](#2-adobe-io-events)
  - [2.1 Core Concepts](#21-core-concepts)
  - [2.2 Event Registration in Developer Console](#22-event-registration-in-developer-console)
  - [2.3 Event Subscriptions](#23-event-subscriptions)
- [3. Commerce Eventing Module](#3-commerce-eventing-module)
  - [3.1 Module Setup & Configuration](#31-module-setup--configuration)
  - [3.2 io_events.xml](#32-io_eventsxml)
  - [3.3 Custom Events](#33-custom-events)
  - [3.4 CLI Commands](#34-cli-commands)
- [4. Commerce Native Webhooks](#4-commerce-native-webhooks)
  - [4.1 Core Concepts](#41-core-concepts)
  - [4.2 webhooks.xml](#42-webhooksxml)
  - [4.3 Synchronous Webhooks (Before/After)](#43-synchronous-webhooks-beforeafter)
  - [4.4 Hook Payload Modification](#44-hook-payload-modification)
- [5. I/O Events vs Webhooks — Key Differences](#5-io-events-vs-webhooks--key-differences)
- [6. Testing](#6-testing)
  - [6.1 Webhook Testing from Admin](#61-webhook-testing-from-admin)
  - [6.2 Event Simulation with aio CLI](#62-event-simulation-with-aio-cli)
- [7. End-to-End Flow Diagrams](#7-end-to-end-flow-diagrams)
- [8. Quick-Reference Checklist](#8-quick-reference-checklist)

---

## 1. Overview & Architecture

Adobe Commerce supports two complementary integration patterns for reacting to system events:

| Pattern | Module | Delivery | Can Modify Response? | Use Case |
|---|---|---|---|---|
| **Adobe I/O Events** | `magento/commerce-eventing` | Asynchronous | No | Notifications, data sync, audit logs |
| **Native Webhooks** | `magento/commerce-webhooks` | Synchronous | Yes | Validation, data enrichment, blocking |

```
+--------------------+        async (fire & forget)       +-------------------+
|  Commerce Store    |  --I/O Events--> Adobe I/O Router  |  3rd-party app /  |
|                    |                                     |  App Builder      |
|                    |  <-Webhooks (sync, HTTP req/resp)-- |  external HTTP    |
+--------------------+                                     +-------------------+
```

**Exam focus:**
- I/O Events are **asynchronous** — Commerce fires the event and does not wait for a response.
- Native Webhooks are **synchronous** — Commerce waits for the external HTTP response before continuing.

---

## 2. Adobe I/O Events

### 2.1 Core Concepts

Adobe I/O Events is an event-driven messaging platform. Commerce acts as the **event provider**. Events flow through Adobe's routing infrastructure to registered **event consumers** (e.g., App Builder actions, webhooks, Journaling API).

**Key terminology:**

| Term | Meaning |
|---|---|
| **Event Provider** | The source system — Adobe Commerce |
| **Event Metadata** | The schema/definition of a specific event type |
| **Event Registration** | A named subscription in Developer Console linking a provider to a consumer |
| **Journaling** | Pull-based consumption via Adobe I/O Journaling API |
| **Webhook (I/O Events)** | Push-based — I/O Routes events to an HTTPS endpoint |

> **Note:** Do not confuse *Adobe I/O Events webhooks* (push delivery mechanism inside I/O Events) with *Commerce Native Webhooks* — they are completely separate systems.

**Exam focus:**
- Adobe I/O Events supports both **push (webhook)** and **pull (journaling)** delivery.
- The event producer (Commerce) is decoupled from the consumer — it does not know or care who is listening.

### 2.2 Event Registration in Developer Console

Steps to register for Commerce events in [Adobe Developer Console](https://developer.adobe.com/console):

1. **Create or open a Project** in the Developer Console.
2. **Add a Service** → *Adobe I/O Events*.
3. Select **Commerce** as the Event Provider (appears once the Commerce Eventing module is connected).
4. Choose **Event Metadata** — the specific event types to subscribe to (e.g., `com.adobe.commerce.observer.catalog_product_save_after`).
5. Configure **Event Registration**:
   - Give the registration a name.
   - Choose delivery method: **Webhook** (push) or **Journaling** (pull).
   - For webhook: provide an HTTPS endpoint URL.
6. Save — the Developer Console stores the registration and I/O Events begins routing matched events.

**Exam focus:**
- Event registration lives in the **Developer Console**, not inside Commerce itself.
- A single project can have **multiple event registrations**.
- Commerce must be connected to the Developer Console via the **Adobe I/O Events** configuration in Admin → Stores → Configuration → Adobe Services.

### 2.3 Event Subscriptions

Inside Commerce, subscriptions are declared in `io_events.xml` or via CLI. The `commerce-eventing` module intercepts Commerce observers and plugin hooks, serializes the event payload, and dispatches it to Adobe I/O.

**Event payload example (JSON sent to I/O):**
```json
{
  "specversion": "1.0",
  "type": "com.adobe.commerce.observer.catalog_product_save_after",
  "source": "urn:uuid:your-instance-uuid",
  "id": "abc-123-def",
  "time": "2024-06-01T12:00:00Z",
  "datacontenttype": "application/json",
  "data": {
    "_metadata": {
      "commerceEdition": "Adobe Commerce",
      "commerceVersion": "2.4.7",
      "eventsClientVersion": "1.5.0",
      "storeId": "1",
      "websiteId": "1",
      "storeGroupId": "1"
    },
    "value": {
      "entity_id": "42",
      "sku": "MY-SKU",
      "name": "My Product",
      "price": "99.99"
    }
  }
}
```

**Exam focus:**
- The `type` field follows the pattern: `com.adobe.commerce.<observer|plugin>.<event_name>`.
- The `_metadata` block is automatically injected by the eventing module.
- Payload fields are **explicitly whitelisted** — you must declare which fields to include.

---

## 3. Commerce Eventing Module

### 3.1 Module Setup & Configuration

**Module name:** `Magento_AdobeCommerceEventsClient`
**Composer package:** `magento/commerce-eventing`

**Prerequisites:**
- Adobe Commerce 2.4.4+ (with patch) or 2.4.5+
- App Builder project in Adobe Developer Console
- Adobe I/O Events service credentials (Client ID, Client Secret, etc.)

**Admin Configuration:**
*Stores → Configuration → Adobe Services → Adobe I/O Events*

| Config Field | Description |
|---|---|
| Enabled | Toggle the eventing system |
| Adobe I/O Environment | Stage or Production |
| Adobe IMS Organization ID | Your Org ID from Developer Console |
| Adobe I/O Events Client ID | OAuth credential |
| Adobe I/O Events Client Secret | OAuth credential |
| Merchant ID | Unique identifier for your Commerce instance |
| Environment ID | Ties to a specific I/O Events provider instance |

```bash
# After configuration, verify connectivity
bin/magento events:provider:info
```

### 3.2 io_events.xml

`io_events.xml` is the **declarative configuration file** for event subscriptions. It must be placed in a custom module's `etc/` directory.

**File location:**
```
app/code/Vendor/Module/etc/io_events.xml
```

**Basic structure:**
```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_AdobeCommerceEventsClient:etc/io_events.xsd">

    <!-- Subscribe to an observer-based event -->
    <event name="observer.catalog_product_save_after">
        <fields>
            <field name="entity_id" />
            <field name="sku" />
            <field name="name" />
            <field name="price" />
            <field name="status" />
            <field name="type_id" />
        </fields>
    </event>

    <!-- Subscribe to a plugin-based event -->
    <event name="plugin.magento.catalog.api.product_repository_interface.save">
        <fields>
            <field name="entity_id" />
            <field name="sku" />
        </fields>
    </event>

</config>
```

**Key `<event>` attributes:**

| Attribute | Required | Description |
|---|---|---|
| `name` | Yes | `observer.<name>` or `plugin.<fqn>` |
| `enabled` | No | `true`/`false` — defaults to `true` |

**Field nesting for complex objects:**
```xml
<event name="observer.sales_order_place_after">
    <fields>
        <field name="increment_id" />
        <field name="status" />
        <field name="grand_total" />
        <field name="customer_email" />
        <!-- Nested: order items -->
        <field name="items">
            <field name="sku" />
            <field name="name" />
            <field name="qty_ordered" />
            <field name="price" />
        </field>
        <!-- Nested: billing address -->
        <field name="billing_address">
            <field name="firstname" />
            <field name="lastname" />
            <field name="city" />
        </field>
    </fields>
</event>
```

**Exam focus:**
- **Only declared fields are included** in the event payload. There is no "send all" option.
- `observer.` prefix → triggered by Magento event dispatcher (`$this->_eventManager->dispatch()`).
- `plugin.` prefix → triggered by intercepting a method via a plugin (no observer needed in the target code).
- `io_events.xml` requires a **module restart / cache flush** to take effect.

### 3.3 Custom Events

You can define and dispatch **custom events** from your own module code.

**Step 1: Declare the custom event in `io_events.xml`:**
```xml
<event name="observer.vendor_module_order_fraud_detected">
    <fields>
        <field name="order_id" />
        <field name="risk_score" />
        <field name="reason" />
    </fields>
</event>
```

**Step 2: Dispatch the event in PHP using the standard event manager:**
```php
<?php

namespace Vendor\Module\Model;

use Magento\Framework\Event\ManagerInterface;

class FraudDetector
{
    public function __construct(
        private readonly ManagerInterface $eventManager
    ) {}

    public function analyze(int $orderId, float $score, string $reason): void
    {
        // Your fraud logic here...

        // Dispatch — the eventing module intercepts this
        $this->eventManager->dispatch('vendor_module_order_fraud_detected', [
            'order_id'   => $orderId,
            'risk_score' => $score,
            'reason'     => $reason,
        ]);
    }
}
```

**Exam focus:**
- Custom events still use the standard `$eventManager->dispatch()` — there is no special eventing API to call.
- The event name in `dispatch()` must match the suffix after `observer.` in `io_events.xml`.
- Custom events must be **registered** (subscribed) before they will be forwarded to Adobe I/O.

### 3.4 CLI Commands

The `commerce-eventing` module provides several CLI commands for managing and debugging event subscriptions.

#### `events:list`

Lists all events that are currently **subscribed** (registered) for the Commerce instance.

```bash
bin/magento events:list
```

**Sample output:**
```
+-------------------------------------------------------+----------+---------+
| Event Name                                            | Enabled  | Fields  |
+-------------------------------------------------------+----------+---------+
| observer.catalog_product_save_after                   | true     | 6       |
| observer.sales_order_place_after                      | true     | 9       |
| plugin.magento.catalog.api.product_repository_int...  | true     | 2       |
+-------------------------------------------------------+----------+---------+
```

#### `events:info`

Shows **detailed information** about a specific event, including its full payload schema.

```bash
bin/magento events:info --name=observer.catalog_product_save_after
```

**Sample output:**
```
Event name:     observer.catalog_product_save_after
Type:           observer
Enabled:        true
Fields:
  - entity_id
  - sku
  - name
  - price
  - status
  - type_id
```

#### `events:subscribe`

Subscribes to an event **dynamically** (without modifying `io_events.xml`). Useful for testing.

```bash
# Subscribe to an observer event with specific fields
bin/magento events:subscribe \
  observer.catalog_product_save_after \
  --fields="entity_id,sku,name,price"

# Subscribe to a plugin event
bin/magento events:subscribe \
  plugin.magento.catalog.api.product_repository_interface.save \
  --fields="entity_id,sku"
```

> Subscriptions added via CLI are stored in the database and take effect immediately without a deploy.

**Additional useful commands:**

```bash
# Unsubscribe from an event
bin/magento events:unsubscribe observer.catalog_product_save_after

# List all available events (not yet subscribed)
bin/magento events:list --all

# Verify the event provider connection to Adobe I/O
bin/magento events:provider:info

# Sync event metadata with Adobe I/O (push registered events to the provider)
bin/magento events:metadata:populate

# Generate a plugin for a plugin-type event (required for plugin. events)
bin/magento events:generate:module
```

**Exam focus:**
- `events:list` → what IS subscribed.
- `events:info` → details about a specific subscribed event.
- `events:subscribe` → CLI-based subscription (database-persisted, no XML edit needed).
- `events:generate:module` is required when subscribing to `plugin.` events — it generates the interceptor plugin code.
- After running `events:generate:module`, you must run `bin/magento setup:di:compile`.

---

## 4. Commerce Native Webhooks

### 4.1 Core Concepts

Commerce Native Webhooks (**not** Adobe I/O Events) allow Commerce to make a **synchronous HTTP call** to an external endpoint during the processing of an operation. The external service can:

- **Inspect** the data.
- **Modify** the data (enrich, transform).
- **Reject** the operation (return an error).

**Module:** `magento/commerce-webhooks` (part of `Magento_Webhooks`)

**When to use native webhooks:**
- Validate order data before placement.
- Enrich product data before saving.
- Block an operation based on external business rules.
- Real-time fraud checks during checkout.

**Exam focus:**
- Native webhooks are **synchronous** — Commerce halts execution, calls the external URL, and waits.
- If the external endpoint is slow or down, it **directly impacts the customer experience**.
- Native webhooks can **modify the request payload** — I/O Events cannot.

### 4.2 webhooks.xml

`webhooks.xml` is the configuration file for native webhook definitions.

**File location:**
```
app/code/Vendor/Module/etc/webhooks.xml
```

**Full annotated structure:**
```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Webhooks:etc/webhooks.xsd">

    <method name="observer.checkout_cart_product_add_before" type="before">
        <hooks>
            <batch name="validate_add_to_cart">
                <hook name="fraud_check" url="https://external-api.example.com/webhooks/cart/validate"
                      method="POST"
                      timeout="5000"
                      softTimeout="1000"
                      fallbackErrorMessage="Cart validation service unavailable."
                      priority="10"
                      required="true"
                      active="true">
                    <headers>
                        <header name="Authorization">Bearer {{env.WEBHOOK_SECRET}}</header>
                        <header name="X-Source">adobe-commerce</header>
                    </headers>
                    <fields>
                        <field name="product.sku" />
                        <field name="product.price" />
                        <field name="product.entity_id" />
                    </fields>
                </hook>
            </batch>
        </hooks>
    </method>

</config>
```

**`<method>` attributes:**

| Attribute | Values | Description |
|---|---|---|
| `name` | `observer.<name>` or `plugin.<fqn>` | The Commerce event to hook into |
| `type` | `before` \| `after` | When to call the external endpoint |

**`<hook>` attributes:**

| Attribute | Description |
|---|---|
| `name` | Unique hook identifier within the batch |
| `url` | HTTPS endpoint to call |
| `method` | HTTP method (`POST`, `GET`) — `POST` is standard |
| `timeout` | Max wait time in ms before hard failure |
| `softTimeout` | Timeout after which Commerce logs a warning but continues |
| `fallbackErrorMessage` | Message shown if the hook fails and `required="true"` |
| `priority` | Order of execution within a batch (lower = first) |
| `required` | If `true`, failure blocks the Commerce operation |
| `active` | Enable/disable without removing config |

**Exam focus:**
- `required="true"` means a hook failure will **stop the Commerce operation** and surface an error.
- `required="false"` means the hook is **best-effort** — failure is logged but execution continues.
- `timeout` vs `softTimeout`: soft timeout logs a warning; hard timeout treats the call as failed.

### 4.3 Synchronous Webhooks (Before/After)

#### Before Hooks (`type="before"`)

- Execute **before** the target method/observer runs.
- Can inspect and **modify input data** before it reaches Commerce.
- Can **block** the operation by returning an error.

```
Commerce Operation Triggered
        |
        v
  [Before Hook] --HTTP POST--> External Service
        |                             |
        |  <-- Response (200/4xx) ----+
        |
  (if 200 OK) -> Continue with (possibly modified) data
  (if 4xx/5xx and required) -> Throw exception, abort
        |
        v
  Core Commerce Logic Executes
```

#### After Hooks (`type="after"`)

- Execute **after** the target method/observer runs.
- Can inspect the **result/output** of the Commerce operation.
- Can modify the response returned to the caller.
- **Cannot** prevent the core operation from completing (it already ran).

```
Commerce Operation Triggered
        |
        v
  Core Commerce Logic Executes
        |
        v
  [After Hook] --HTTP POST--> External Service
        |                             |
        |  <-- Response (200/4xx) ----+
        |
  Response returned (possibly modified)
```

**Exam focus:**
- `before` hooks can **prevent** an operation. `after` hooks **cannot** prevent the core operation.
- Both `before` and `after` hooks can **modify the payload**.
- A `before` hook can modify the **input arguments**; an `after` hook can modify the **return value**.

### 4.4 Hook Payload Modification

The external webhook endpoint receives a JSON payload and can return a modified version.

**Incoming payload to external endpoint (example for `before` hook):**
```json
{
  "data": {
    "product": {
      "entity_id": "42",
      "sku": "MY-SKU",
      "price": "99.99"
    }
  },
  "metadata": {
    "commerceVersion": "2.4.7",
    "eventCode": "observer.catalog_product_save_before",
    "type": "before"
  }
}
```

**External endpoint response to modify data (HTTP 200):**
```json
{
  "op": "success",
  "data": {
    "product": {
      "price": "89.99",
      "special_price": "79.99"
    }
  }
}
```

> Commerce will **merge** the returned `data` into the operation context — the product price will be updated to `89.99` before saving.

**External endpoint response to block operation (HTTP 400):**
```json
{
  "op": "exception",
  "message": "Product price is below the minimum allowed threshold.",
  "type": "Magento\\Framework\\Exception\\LocalizedException"
}
```

**Response `op` values:**

| `op` | Meaning |
|---|---|
| `success` | Accept the data (optionally with modifications) |
| `exception` | Reject — throw an exception and abort |

**Exam focus:**
- The external endpoint **must** return HTTP 200 with `"op": "success"` for the operation to continue.
- Any 4xx/5xx HTTP response from the endpoint (or a timeout) will be treated as a failure.
- The `data` object in the response is **merged** back into Commerce — only changed fields need to be returned.
- `"op": "exception"` is how the external service programmatically signals Commerce to throw an exception.

---

## 5. I/O Events vs Webhooks — Key Differences

This is one of the **most heavily tested** distinctions on the exam.

| Characteristic | Adobe I/O Events | Commerce Native Webhooks |
|---|---|---|
| **Execution mode** | Asynchronous | Synchronous |
| **Commerce waits for response?** | No | Yes |
| **Can modify request data?** | No | Yes (`before` hook) |
| **Can modify response data?** | No | Yes (`after` hook) |
| **Can block an operation?** | No | Yes (`required="true"`) |
| **Impact on performance** | None (fire & forget) | Yes — latency added |
| **Config file** | `io_events.xml` | `webhooks.xml` |
| **Delivery guarantee** | Retry via I/O Events | Single synchronous call |
| **Consumer** | App Builder, 3rd party via I/O routing | Any HTTPS endpoint |
| **Primary use case** | Notifications, data replication, audit | Validation, enrichment, blocking |
| **Failure impact** | Consumer retries; Commerce unaffected | Customer-facing error if `required=true` |
| **Schema declaration** | Fields in `io_events.xml` | Fields in `webhooks.xml` |
| **CLI tooling** | `events:*` commands | Admin UI + `webhooks:*` commands |

**Flow comparison diagram:**

```
I/O Events (Async):
Commerce --event--> I/O Router --> [Consumer A]
                              --> [Consumer B]
                 (Commerce does NOT wait)

Native Webhooks (Sync):
Commerce --HTTP POST--> External Service
        <--- HTTP response (data/error) ---
        (Commerce WAITS for response)
```

**Exam focus:**
- The fundamental tradeoff: I/O Events = **decoupled, resilient, no data modification**; Webhooks = **coupled, latency, can modify/block**.
- If a question asks "how can an external system prevent an order from being placed in real-time?" → **Native Webhook** with `required="true"` and `type="before"`.
- If a question asks "how do you notify an ERP system when an order is placed?" → **I/O Events**.

---

## 6. Testing

### 6.1 Webhook Testing from Admin

Commerce provides a built-in UI to test native webhooks without triggering a real event.

**Location in Admin:**
*Marketing → Communications → Webhooks*

**Steps:**
1. Navigate to the webhook list.
2. Find the webhook/hook you want to test.
3. Click **Test** (or the test icon).
4. Admin sends a **synthetic payload** to the configured URL.
5. View the response: HTTP status, response body, execution time.

**What to look for when testing:**
- HTTP 200 response with `"op": "success"`.
- Response latency (should be well under `timeout`).
- Correct payload structure received by the external endpoint.
- Proper authentication header sent.

```bash
# CLI: List registered webhooks
bin/magento webhooks:list

# CLI: Show details of a specific webhook
bin/magento webhooks:info --name=observer.checkout_cart_product_add_before
```

**Exam focus:**
- Webhook testing from Admin uses **synthetic/mock data** — it does not trigger a real Commerce operation.
- The test verifies **connectivity and response format**, not business logic correctness.

### 6.2 Event Simulation with aio CLI

The **Adobe I/O (aio) CLI** allows you to simulate and inspect I/O Events from your local machine.

**Installation:**
```bash
npm install -g @adobe/aio-cli
aio login
```

**Simulate an event (send a mock event to a registered endpoint):**
```bash
# Fire a simulated event against your registered webhook
aio event fire \
  --provider-id=<your-provider-id> \
  --event-code=com.adobe.commerce.observer.catalog_product_save_after \
  --payload='{"entity_id":"42","sku":"TEST-SKU","name":"Test Product"}'
```

**Listen to live events (journaling / real-time monitoring):**
```bash
# Tail incoming events for a registration
aio event registration get <registration-id>

# Pull events from journaling
aio event journal get <journaling-url>
```

**List event providers and registrations:**
```bash
# List all providers in your org
aio event provider list

# List all registrations in your project
aio event registration list

# Get details of a specific registration
aio event registration get <registration-id>
```

**Debug an App Builder action receiving I/O Events:**
```bash
# Start local App Builder dev server (exposes local action via tunnel)
aio app dev

# Tail activation logs from App Builder
aio app logs --tail
```

**Example: Full local testing workflow:**
```bash
# 1. Start local dev server (auto-creates a tunnel URL)
aio app dev

# 2. Update your I/O Event registration to point to the tunnel URL
#    (do this in Developer Console or via aio CLI)

# 3. Simulate an event from Commerce CLI
bin/magento events:subscribe observer.catalog_product_save_after \
  --fields="entity_id,sku,name"

# Trigger the event naturally (save a product in Admin)
# OR simulate via aio CLI:
aio event fire --provider-id=<pid> \
  --event-code=com.adobe.commerce.observer.catalog_product_save_after \
  --payload='{"entity_id":"1","sku":"DEMO-1"}'

# 4. Observe logs
aio app logs --tail
```

**Exam focus:**
- `aio event fire` sends a **simulated event** directly to the I/O Events infrastructure — it bypasses Commerce entirely.
- `aio app dev` starts a **local development server** with a public tunnel, useful for testing without deploying to App Builder.
- Journaling API (`aio event journal get`) is for **pull-based** event consumption — useful for debugging missed events.
- `aio event registration list` shows all active subscriptions in the Developer Console project.

---

## 7. End-to-End Flow Diagrams

### Adobe I/O Events End-to-End

```
[Magento Event Dispatch]
  $eventManager->dispatch('catalog_product_save_after', [...])
         |
         v
[Magento_AdobeCommerceEventsClient Module]
  - Checks io_events.xml: is this event subscribed?
  - Filters payload to declared fields only
  - Serializes to CloudEvents format (JSON)
         |
         v (async / queue)
[Adobe I/O Events Router]
  - Authenticates using stored credentials
  - Routes to all matching registrations
         |
         +--------> [Push: App Builder Action]
         |                    |
         |               Processes event
         |               (no response to Commerce)
         |
         +--------> [Push: External Webhook URL]
         |
         +--------> [Pull: Journaling API buffer]
                         ^
                         |
                    Consumer polls
                    at their own pace
```

### Native Webhooks End-to-End

```
[Customer places order]
         |
         v
[Commerce: sales_order_place_before]
         |
         v
[Webhooks Module: before hook active?]
  - Yes -> build payload from webhooks.xml field declarations
         |
         v
[HTTP POST to external URL]  <timeout: 5000ms>
         |
         v
[External Service Response]
  - HTTP 200 + op:success  -> Continue (apply any data modifications)
  - HTTP 200 + op:exception -> Throw LocalizedException (order blocked)
  - HTTP 4xx/5xx or timeout -> If required=true: block; if required=false: log & continue
         |
         v
[Core Commerce order placement logic continues]
         |
         v
[After hook (if configured)]
  - HTTP POST with order result data
  - External service can modify response
         |
         v
[Customer sees success or error page]
```

---

## 8. Quick-Reference Checklist

### Adobe I/O Events
- [ ] I/O Events are **asynchronous** — Commerce does not wait for a consumer response.
- [ ] Event registration is configured in **Adobe Developer Console**, not in Commerce Admin.
- [ ] Delivery modes: **push (webhook)** or **pull (journaling API)**.
- [ ] The `commerce-eventing` module (`Magento_AdobeCommerceEventsClient`) handles dispatch.
- [ ] Events are declared in **`io_events.xml`** under `etc/` in any module.
- [ ] `observer.` prefix = triggers via `$eventManager->dispatch()`.
- [ ] `plugin.` prefix = triggers by intercepting a class method.
- [ ] **Only explicitly declared fields** are included in the event payload.
- [ ] Nested fields (e.g., order items) are supported with nested `<field>` elements.
- [ ] Custom events: dispatch normally with `$eventManager->dispatch()` — no special API.
- [ ] `events:list` → lists subscribed events.
- [ ] `events:info --name=<event>` → details about a specific event.
- [ ] `events:subscribe <event> --fields="..."` → CLI subscription (database-stored).
- [ ] `events:generate:module` → required for `plugin.` event types, generates interceptor code.
- [ ] After `events:generate:module`, must run `setup:di:compile`.
- [ ] `events:metadata:populate` → syncs event metadata to Adobe I/O provider.
- [ ] `events:provider:info` → verifies connectivity to Adobe I/O.

### Commerce Native Webhooks
- [ ] Native Webhooks are **synchronous** — Commerce waits for the HTTP response.
- [ ] Configured in **`webhooks.xml`** under `etc/` in any module.
- [ ] `type="before"` → called before core logic; can modify input and block the operation.
- [ ] `type="after"` → called after core logic; can modify output but cannot prevent the operation.
- [ ] `required="true"` → failure **blocks** the Commerce operation (customer-facing error).
- [ ] `required="false"` → failure is **logged** but operation continues.
- [ ] `timeout` → hard timeout in ms; `softTimeout` → warning-only timeout.
- [ ] External endpoint must return HTTP 200 with `"op": "success"` to allow continuation.
- [ ] `"op": "exception"` in response → tells Commerce to throw a `LocalizedException`.
- [ ] Only fields declared in `<fields>` within `<hook>` are sent in the payload.
- [ ] Headers (e.g., auth tokens) can be declared in `<headers>` within `<hook>`.
- [ ] `priority` attribute controls hook execution order within a batch (lower = first).
- [ ] Multiple hooks can be grouped in a `<batch>` under one `<method>`.

### Key Differences (Exam Critical)
- [ ] I/O Events = async, fire-and-forget, **cannot modify Commerce data**.
- [ ] Native Webhooks = sync, blocking, **can modify Commerce data and block operations**.
- [ ] "Notify ERP when order placed" → **I/O Events**.
- [ ] "Validate cart item before add" / "Block order based on fraud score" → **Native Webhook** (`before`, `required="true"`).
- [ ] "Enrich product data in real-time before save" → **Native Webhook** (`before`, return modified `data`).

### Testing
- [ ] Webhook Admin test: *Marketing → Communications → Webhooks → Test* — sends synthetic payload.
- [ ] Admin test verifies **connectivity and response format**, not real business logic.
- [ ] `aio event fire` → simulates an I/O event, bypasses Commerce entirely.
- [ ] `aio app dev` → starts local App Builder dev server with public HTTPS tunnel.
- [ ] `aio event journal get` → pull events from journaling buffer (pull-based debug).
- [ ] `aio event registration list` → lists all I/O Event registrations in the project.
- [ ] `aio app logs --tail` → streams App Builder action activation logs.

### File Locations Summary
| File | Purpose | Location |
|---|---|---|
| `io_events.xml` | Declare I/O Event subscriptions & fields | `etc/io_events.xml` |
| `webhooks.xml` | Declare native webhook hooks & fields | `etc/webhooks.xml` |
| Admin Config | I/O Events credentials & connection | Stores → Config → Adobe Services |
| Developer Console | Event registrations & routing | console.adobe.io |
