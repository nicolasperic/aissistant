# Day 16 — App Builder: Architecture, Runtime & Commerce Integration

## Table of Contents
1. [What is Adobe App Builder?](#1-what-is-adobe-app-builder)
2. [App Builder Architecture Overview](#2-app-builder-architecture-overview)
3. [Adobe I/O Runtime (Serverless Actions)](#3-adobe-io-runtime-serverless-actions)
4. [Commerce + App Builder Integration Patterns](#4-commerce--app-builder-integration-patterns)
5. [aio CLI: Project Setup & Deployment](#5-aio-cli-project-setup--deployment)
6. [Security: Auth & Token Management](#6-security-auth--token-management)
7. [Extensibility SDK & UI Components](#7-extensibility-sdk--ui-components)
8. [Common Use Cases](#8-common-use-cases)
9. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. What is Adobe App Builder?

Adobe App Builder is a **cloud-native extensibility platform** that allows developers to build custom applications and integrations on top of Adobe products (including Commerce) without touching the core platform.

```
+-------------------------------------------------------------+
|                  Adobe Experience Cloud                      |
|                                                             |
|   +-------------------+     +---------------------------+  |
|   |  Adobe Commerce   |<--->|      App Builder App      |  |
|   +-------------------+     |  +---------------------+ |  |
|                              |  | Runtime Actions     | |  |
|   +-------------------+     |  | Files (Storage)     | |  |
|   |  Adobe AEM / AEP  |<--->|  | State (Key-Value)   | |  |
|   +-------------------+     |  | Events (I/O Events) | |  |
|                              +---------------------------+  |
+-------------------------------------------------------------+
```

### Core Value Propositions
- **No infrastructure management** — serverless, auto-scaling
- **Secure by default** — IMS/OAuth authentication built-in
- **Out-of-process extensibility** — does not modify Commerce core
- **Multi-tenant SaaS ready** — works with Adobe's cloud services

> **Exam focus:** App Builder is the *preferred* extensibility model for Adobe Commerce on Cloud. It replaces the old "in-process" customization for many use cases, keeping Commerce upgradeable.

---

## 2. App Builder Architecture Overview

### 2.1 The Four Pillars

| Pillar | Service | Purpose |
|--------|---------|---------|
| **Compute** | Adobe I/O Runtime | Serverless function execution (OpenWhisk) |
| **Storage** | Adobe I/O Files | Blob/file storage for apps |
| **State** | Adobe I/O State | Distributed key-value store (TTL-based) |
| **Eventing** | Adobe I/O Events | Pub/sub event routing between Adobe products |

### 2.2 Full Architecture Diagram

```
                        [Developer / Browser]
                               |
                         [SPA Frontend]
                        (React + Spectrum)
                               |
                    [API Mesh / API Gateway]
                               |
              +----------------+----------------+
              |                                 |
    [I/O Runtime Actions]           [Adobe I/O Events]
    (serverless functions)           (event subscriptions)
              |                                 |
     +--------+--------+              +---------+---------+
     |                 |              |                   |
[I/O Files]      [I/O State]   [Commerce Eventing]  [AEP Events]
(blob store)   (key-value TTL)  (webhooks/events)
```

### 2.3 Adobe I/O Files

- Built on **Azure Blob Storage** under the hood
- Provides a simple SDK: `@adobe/aio-lib-files`
- Supports **public** and **private** file access
- Use for: generated reports, processed data, temporary artifacts

```javascript
// Using I/O Files SDK
const filesLib = require('@adobe/aio-lib-files')

async function main(params) {
  const files = await filesLib.init()

  // Write a file
  await files.write('output/report.json', JSON.stringify({ data: 'value' }))

  // Read a file
  const content = await files.read('output/report.json')

  // Generate a pre-signed URL (temporary public access)
  const url = await files.generatePresignURL('output/report.json', { expiryInSeconds: 3600 })

  return { url }
}
```

### 2.4 Adobe I/O State

- **Distributed key-value store** (like Redis, but managed)
- Default TTL: **86400 seconds (24 hours)**, max TTL: **365 days**
- Use for: caching, session data, rate-limit counters, deduplication tokens

```javascript
const stateLib = require('@adobe/aio-lib-state')

async function main(params) {
  const state = await stateLib.init()

  // Write with TTL
  await state.put('order:12345:status', 'processing', { ttl: 3600 })

  // Read
  const value = await state.get('order:12345:status')
  // value = { value: 'processing', expiration: '...' }

  // Delete
  await state.delete('order:12345:status')

  return { status: value?.value }
}
```

> **Exam focus:** I/O State has a **maximum value size of 1 MB** per key. It is NOT a database replacement — it is for ephemeral/cached data with TTL.

### 2.5 Adobe I/O Events

- **Pub/sub eventing** across Adobe products
- Commerce emits events via the **Adobe Commerce Eventing** module
- Events are consumed by I/O Runtime actions via **event subscriptions**
- Supports **journaling** (replay missed events) and **webhooks**

```
[Commerce]  --emits-->  [I/O Events Bus]  --delivers-->  [Runtime Action]
   |                                                           |
   |  event: com.adobe.commerce.observer.sales_order_save_after
   |  payload: { order_id, status, customer_email, ... }
```

> **Exam focus:** Adobe I/O Events uses **at-least-once delivery** — your Runtime action must be **idempotent**. Use I/O State to track processed event IDs for deduplication.

---

## 3. Adobe I/O Runtime (Serverless Actions)

Adobe I/O Runtime is built on **Apache OpenWhisk**, an open-source serverless platform.

### 3.1 Key Concepts

| Concept | Description |
|---------|-------------|
| **Action** | A single function (Node.js, Python, PHP, etc.) |
| **Package** | Namespace/grouping for related actions |
| **Sequence** | Chain of actions executed in order |
| **Trigger** | Event that fires an action |
| **Rule** | Associates a trigger with an action |
| **Activation** | A single execution of an action |

### 3.2 Action Anatomy

```javascript
// actions/my-action/index.js
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, checkMissingRequestInputs } = require('../utils')

async function main(params) {
  // params includes: __ow_headers, __ow_body, __ow_method (for web actions)
  // plus any default params from manifest.yml

  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    // Validate required inputs
    const requiredParams = ['orderId']
    const requiredHeaders = ['Authorization']
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger)
    }

    const { orderId } = params

    // Business logic here
    const result = await processOrder(orderId)

    return {
      statusCode: 200,
      body: { success: true, data: result }
    }
  } catch (e) {
    logger.error(e)
    return errorResponse(500, 'Internal Server Error', logger)
  }
}

exports.main = main
```

### 3.3 Web Actions vs Non-Web Actions

This is one of the **most tested distinctions** in App Builder exams.

| Feature | Web Action | Non-Web Action |
|---------|-----------|----------------|
| **HTTP accessible** | Yes — public HTTPS endpoint | No — invoked programmatically |
| **Authentication** | Optional (can be open or require-adobe-auth) | Always requires OpenWhisk API key |
| **URL format** | `https://adobeioruntime.net/api/v1/web/{ns}/{pkg}/{action}` | `https://adobeioruntime.net/api/v1/namespaces/{ns}/actions/{action}` |
| **Response** | Full HTTP response (headers, body, statusCode) | JSON object only |
| **Use case** | Webhooks, APIs, browser calls | Event handlers, background tasks, internal calls |
| **Annotations** | `web: 'yes'` in manifest | `web: false` (default) |

```yaml
# app.config.yaml / manifest.yml

application:
  actions:
    # Web action - publicly accessible HTTP endpoint
    order-webhook:
      function: actions/order-webhook/index.js
      web: 'yes'                    # Makes it a web action
      annotations:
        require-adobe-auth: false   # No auth required (for external webhooks)

    # Web action with Adobe auth
    admin-api:
      function: actions/admin-api/index.js
      web: 'yes'
      annotations:
        require-adobe-auth: true    # Requires valid IMS token

    # Non-web action - background processing
    process-order:
      function: actions/process-order/index.js
      web: false                    # Not HTTP accessible
      limits:
        timeout: 60000              # 60 seconds max (default: 60s, max: 3600s)
        memory: 512                 # MB (default: 256, max: 4096)
```

> **Exam focus:**
> - Web actions with `require-adobe-auth: true` validate the `Authorization: Bearer <IMS_TOKEN>` header automatically
> - Non-web actions are invoked via the OpenWhisk REST API with Basic auth (API key)
> - Web action URLs include `/web/` in the path — this is the key identifier

### 3.4 Action Invocation Types

```
Synchronous (blocking):
  Caller --> [Runtime] --> waits --> [Action executes] --> Response
  Max wait: 60 seconds
  Use when: need immediate result

Asynchronous (non-blocking):
  Caller --> [Runtime] --> Activation ID returned immediately
  [Action executes in background]
  Caller polls: GET /activations/{activation_id}
  Use when: long-running tasks

Fire-and-forget:
  Caller --> [Runtime] --> No response waited
  Use when: event handling, notifications
```

```bash
# Invoke synchronously (blocking)
aio rt action invoke my-action --param orderId 12345 --blocking --result

# Invoke asynchronously (get activation ID)
aio rt action invoke my-action --param orderId 12345

# Get result later
aio rt activation get <activation-id>

# Get logs
aio rt activation logs <activation-id>
```

### 3.5 Sequences

A **sequence** chains multiple actions — the output of one action becomes the input of the next.

```yaml
# manifest.yml
application:
  actions:
    validate-order:
      function: actions/validate/index.js
      web: false

    enrich-order:
      function: actions/enrich/index.js
      web: false

    send-to-erp:
      function: actions/send-erp/index.js
      web: false

  sequences:
    process-order-flow:
      actions: validate-order, enrich-order, send-to-erp
      web: 'yes'
```

```
[Input Params]
      |
      v
[validate-order]  --> { orderId, isValid: true, items: [...] }
      |
      v
[enrich-order]    --> { orderId, isValid: true, items: [...], customerData: {...} }
      |
      v
[send-to-erp]     --> { success: true, erpRef: 'ERP-999' }
      |
      v
[HTTP Response]
```

> **Exam focus:**
> - If any action in a sequence **returns an error**, the sequence stops immediately
> - Sequences share the **same total timeout** — plan accordingly
> - Each action in a sequence can have its own memory/timeout limits
> - Sequences themselves appear as actions and can be web-exposed

### 3.6 Runtime Limits

| Resource | Default | Maximum |
|----------|---------|---------|
| Action timeout | 60,000 ms | 3,600,000 ms (1 hour) |
| Memory | 256 MB | 4,096 MB |
| Payload size (request/response) | 1 MB | 5 MB |
| Concurrent activations | 1,000 | Configurable |
| Actions per namespace | Unlimited | Soft limits apply |

---

## 4. Commerce + App Builder Integration Patterns

### 4.1 Sync vs Async

```
SYNCHRONOUS Pattern:
====================
[Commerce]  ---HTTP request--->  [App Builder Web Action]
            <--HTTP response---  (must respond < 60s)

Use for:
- Real-time data lookup
- Payment gateway calls
- Inventory checks
- Admin UI data loading


ASYNCHRONOUS Pattern:
=====================
[Commerce]  --event/webhook-->  [App Builder Action]
                                       |
                               [Queues / I/O State]
                                       |
                               [Background Processing]
                                       |
                               [External System (ERP/WMS)]

Use for:
- Order sync to ERP
- Bulk data processing
- Email/notification sending
- Long-running integrations
```

> **Exam focus:** Async is preferred for Commerce integrations because Commerce webhooks have a **timeout** and you don't want to block the checkout flow. Always return `200 OK` immediately and process asynchronously.

### 4.2 Webhooks vs Polling

#### Commerce Webhooks (Push)

Adobe Commerce (2.4.4+) supports **native webhooks** via the `Magento_AdobeCommerceWebhooks` module (`magento/module-adobe-commerce-webhooks`).

<!-- CORRECTED: original showed root element as <webhooks> and file path as app/etc/webhooks.xml.
     XSD defines root element as <config> (confirmed by Reader._idAttributes using '/config/method').
     File is a standard per-module etc/ config file: app/code/Vendor/Module/etc/webhooks.xml,
     NOT app/etc/webhooks.xml (that path is only for env.php/config.php global files).
     Schema URN: urn:magento:module:Magento_AdobeCommerceWebhooks:etc/webhooks.xsd -->

```xml
<!-- app/code/MyVendor/MyModule/etc/webhooks.xml - Commerce-side webhook config -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_AdobeCommerceWebhooks:etc/webhooks.xsd">
    <method name="observer.sales_order_save_after" type="after">
        <hooks>
            <batch name="order_sync">
                <hook name="sync_to_erp"
                      url="https://adobeioruntime.net/api/v1/web/ns/pkg/order-sync"
                      timeout="2000"
                      softTimeout="1000"
                      method="POST"
                      fallbackErrorMessage="ERP sync failed">
                    <fields>
                        <field name="increment_id"/>
                        <field name="status"/>
                        <field name="customer_email"/>
                        <field name="base_grand_total"/>
                    </fields>
                </hook>
            </batch>
        </hooks>
    </method>
</config>
```

```javascript
// App Builder action receiving webhook
async function main(params) {
  // params.data contains the webhook payload
  const { increment_id, status, customer_email } = params.data

  // Immediately acknowledge (important for Commerce webhook timeout)
  // Process asynchronously via queue or background action
  await queueOrderSync({ increment_id, status, customer_email })

  return {
    statusCode: 200,
    body: { received: true }
  }
}
```

#### Adobe I/O Events (Preferred Push)

```javascript
// Register event subscription in app.config.yaml
// Then handle in Runtime action:

async function main(params) {
  // Event payload from Commerce Eventing
  const event = params // entire params IS the event for I/O Events

  const { type, data } = event

  // Deduplicate using I/O State
  const state = await stateLib.init()
  const eventId = params.event?.id || params.id
  const processed = await state.get(`event:${eventId}`)

  if (processed?.value === 'done') {
    return { statusCode: 200, body: { message: 'Already processed' } }
  }

  // Process the event
  await syncOrderToERP(data)

  // Mark as processed (1 hour TTL)
  await state.put(`event:${eventId}`, 'done', { ttl: 3600 })

  return { statusCode: 200, body: { success: true } }
}
```

#### Polling (Pull)

```javascript
// Scheduled action that polls Commerce REST API
async function main(params) {
  const { COMMERCE_URL, COMMERCE_TOKEN } = params

  const state = await stateLib.init()

  // Get last sync timestamp
  const lastSync = await state.get('orders:last_sync_time')
  const fromDate = lastSync?.value || new Date(Date.now() - 3600000).toISOString()

  // Poll Commerce for new orders
  const response = await fetch(
    `${COMMERCE_URL}/rest/V1/orders?searchCriteria[filter_groups][0][filters][0][field]=updated_at` +
    `&searchCriteria[filter_groups][0][filters][0][value]=${fromDate}` +
    `&searchCriteria[filter_groups][0][filters][0][condition_type]=gt`,
    {
      headers: { Authorization: `Bearer ${COMMERCE_TOKEN}` }
    }
  )

  const orders = await response.json()

  // Process orders
  for (const order of orders.items) {
    await syncOrderToERP(order)
  }

  // Update last sync time
  await state.put('orders:last_sync_time', new Date().toISOString(), { ttl: 86400 })

  return { processed: orders.total_count }
}
```

> **Exam focus:**
> - **Webhooks/Events (Push):** Real-time, lower latency, preferred pattern. Commerce must be able to reach App Builder.
> - **Polling (Pull):** Fallback when push isn't available. Adds latency, less efficient. Use scheduled Runtime actions (cron-like via alarms/triggers).
> - Adobe I/O Events is **preferred over raw webhooks** because it handles retries, journaling, and filtering.

### 4.3 Commerce Eventing Module

The `magento/commerce-eventing` package enables Commerce to publish events to Adobe I/O Events.

<!-- CORRECTED: original said `bin/magento module:enable Magento_AdobeCommerceEventing` —
     that module name does not exist. The correct module name is Magento_AdobeCommerceEventsClient
     (package: magento/module-adobe-commerce-events-client). Verified via registration.php. -->

```bash
# Install Commerce Eventing module
composer require magento/commerce-eventing --no-update
composer update
bin/magento module:enable Magento_AdobeCommerceEventsClient
bin/magento setup:upgrade
```

<!-- CORRECTED: original io_events.xml used URN urn:magento:module-commerce-eventing:etc/io_events.xsd
     which is a non-standard format. The correct URN is:
     urn:magento:module:Magento_AdobeCommerceEventsClient:etc/io_events.xsd
     Verified: vendor/magento/module-adobe-commerce-events-client/etc/io_events.xsd exists. -->

```xml
<!-- Declare custom events in io_events.xml -->
<!-- app/code/MyVendor/MyModule/etc/io_events.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_AdobeCommerceEventsClient:etc/io_events.xsd">
    <event name="observer.sales_order_save_after">
        <fields>
            <field name="increment_id" />
            <field name="status" />
            <field name="state" />
            <field name="customer_email" />
            <field name="base_grand_total" />
            <field name="store_id" />
        </fields>
    </event>
</config>
```

---

## 5. aio CLI: Project Setup & Deployment

### 5.1 Installation & Setup

```bash
# Install Node.js (LTS recommended, 18.x or 20.x)
# Install aio CLI globally
npm install -g @adobe/aio-cli

# Verify installation
aio --version

# Login to Adobe IMS
aio login

# Select your organization
aio console org select

# Select your project
aio console project select

# Select your workspace (Stage/Production)
aio console workspace select
```

### 5.2 Project Initialization

```bash
# Initialize a new App Builder project
aio app init my-commerce-app

# Interactive prompts:
# ? Select Org: My Org
# ? Select Project: My Project
# ? Select Workspace: Stage
# ? Which Adobe services do you want to include?
#   > Adobe Commerce
#   > I/O Events
#   > I/O State
#   > I/O Files
# ? Which template(s) do you want to add?
#   > @adobe/generator-app-excshell (base shell)
#   > @adobe/commerce-extensibility (Commerce-specific)
```

**Generated project structure:**

```
my-commerce-app/
|-- app.config.yaml          # App configuration (replaces manifest.yml in newer versions)
|-- package.json
|-- .env                     # Environment variables (NOT committed to git)
|-- .aio                     # aio CLI config
|-- .gitignore
|-- actions/                 # Runtime actions
|   |-- order-sync/
|   |   |-- index.js
|   |-- webhook-handler/
|       |-- index.js
|-- web-src/                 # React SPA frontend
|   |-- src/
|   |   |-- components/
|   |   |-- App.js
|   |-- index.html
|-- test/                    # Unit tests
|-- e2e/                     # End-to-end tests
```

### 5.3 app.config.yaml Deep Dive

```yaml
# app.config.yaml
application:
  # Runtime actions configuration
  actions: actions          # Directory containing actions
  web: web-src              # Directory containing SPA

  runtimeManifest:
    packages:
      my-commerce-app:
        license: Apache-2.0
        actions:
          # Webhook handler (web action, no auth)
          order-webhook:
            function: actions/order-webhook/index.js
            web: 'yes'
            annotations:
              require-adobe-auth: false
            inputs:
              LOG_LEVEL: info
            limits:
              timeout: 5000    # 5 seconds - fast webhook acknowledgment
              memory: 256

          # Admin API (web action, with auth)
          get-orders:
            function: actions/get-orders/index.js
            web: 'yes'
            annotations:
              require-adobe-auth: true
            inputs:
              LOG_LEVEL: info
              COMMERCE_URL: $COMMERCE_URL    # From .env file

          # Background processor (non-web)
          sync-to-erp:
            function: actions/sync-to-erp/index.js
            web: false
            inputs:
              ERP_ENDPOINT: $ERP_ENDPOINT
              ERP_API_KEY: $ERP_API_KEY
            limits:
              timeout: 300000   # 5 minutes for ERP sync
              memory: 512

          # Sequence
          order-processing-pipeline:
            sequences:
              - validate-order
              - enrich-order
              - sync-to-erp
            web: 'yes'
            annotations:
              require-adobe-auth: true
```

### 5.4 Key CLI Commands

```bash
# ---- DEVELOPMENT ----

# Run app locally (hot reload, local action simulation)
aio app run
# - Starts local dev server on http://localhost:9080
# - Deploys actions to Runtime (real Runtime, not local)
# - Proxies API calls

# Run with local action execution (no Runtime deployment)
aio app run --local
# WARNING: --local uses a local OpenWhisk container
# Behavior may differ from production Runtime

# ---- DEPLOYMENT ----

# Deploy everything (actions + SPA)
aio app deploy

# Deploy only actions (no frontend)
aio app deploy --skip-content-deploy

# Deploy only SPA (no actions)
aio app deploy --skip-actions

# Deploy to specific workspace
aio app use --workspace Production
aio app deploy

# ---- MANAGEMENT ----

# List deployed actions
aio rt action list

# Get action details
aio rt action get my-commerce-app/order-webhook

# Invoke action directly
aio rt action invoke my-commerce-app/get-orders \
  --param orderId 12345 \
  --blocking \
  --result

# View recent activations
aio rt activation list

# View activation logs
aio rt activation logs <activation-id>

# Get last activation result
aio rt activation result --last

# ---- CLEANUP ----

# Undeploy everything
aio app undeploy

# Delete specific action
aio rt action delete my-commerce-app/order-webhook
```

> **Exam focus:**
> - `aio app run` deploys actions to **real Runtime** — there is no true "local only" mode for actions by default
> - `aio app deploy` is the production deployment command
> - Workspace management: Stage vs Production workspaces are separate environments

### 5.5 Environment Variables & .env

```bash
# .env file (NEVER commit to git)
COMMERCE_URL=https://my-store.example.com
COMMERCE_CONSUMER_KEY=abc123
COMMERCE_CONSUMER_SECRET=xyz789
COMMERCE_ACCESS_TOKEN=token_here
COMMERCE_ACCESS_TOKEN_SECRET=secret_here

ERP_ENDPOINT=https://erp.company.com/api
ERP_API_KEY=erp_key_here

# Adobe I/O / IMS (auto-populated by aio CLI)
AIO_runtime_auth=<openwhisk-auth>
AIO_runtime_namespace=<namespace>
```

---

## 6. Security: Auth & Token Management

### 6.1 JWT Authentication (Legacy — Being Deprecated)

JWT (JSON Web Token) was the original App Builder auth method. Understanding it is still tested.

```
JWT Auth Flow:
==============

1. Developer generates RSA key pair
2. Public key uploaded to Adobe Developer Console
3. App creates JWT with claims:
   - iss: organization ID
   - sub: technical account ID
   - aud: IMS endpoint
   - exp: expiration
   - metascopes: required API scopes

4. JWT signed with private key
5. POST to IMS: { client_id, client_secret, jwt_token }
6. IMS returns: { access_token, token_type, expires_in }
7. Access token used for API calls
```

```javascript
// JWT token generation (legacy pattern)
const { JWT } = require('google-auth-library')
const fs = require('fs')

async function getAccessToken(params) {
  const {
    IMS_ENDPOINT,
    CLIENT_ID,
    CLIENT_SECRET,
    TECHNICAL_ACCOUNT_ID,
    ORG_ID,
    PRIVATE_KEY,
    METASCOPES
  } = params

  const jwtPayload = {
    exp: Math.round(Date.now() / 1000) + 300, // 5 min expiry
    iss: ORG_ID,
    sub: TECHNICAL_ACCOUNT_ID,
    aud: `${IMS_ENDPOINT}/c/${CLIENT_ID}`,
    ...METASCOPES.split(',').reduce((acc, scope) => {
      acc[`${IMS_ENDPOINT}/s/${scope}`] = true
      return acc
    }, {})
  }

  // Sign JWT with private key
  const signedJWT = jwt.sign(jwtPayload, PRIVATE_KEY, { algorithm: 'RS256' })

  // Exchange for access token
  const response = await fetch(`${IMS_ENDPOINT}/ims/exchange/jwt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      jwt_token: signedJWT
    })
  })

  const { access_token } = await response.json()
  return access_token
}
```

### 6.2 OAuth 2.0 Server-to-Server (Current Standard)

OAuth 2.0 Server-to-Server (formerly "Service Account") replaced JWT authentication.

```
OAuth S2S Flow:
===============

1. Credentials created in Adobe Developer Console
   (no key pair upload needed!)

2. App POSTs to IMS:
   POST /ims/token/v3
   client_id=xxx
   client_secret=xxx
   grant_type=client_credentials
   scope=openid,AdobeID,commerce.api,...

3. IMS returns access_token (expires in 24 hours)

4. Cache token in I/O State, reuse until expiry

5. Use token: Authorization: Bearer <access_token>
```

```javascript
// OAuth 2.0 Server-to-Server (current pattern)
const stateLib = require('@adobe/aio-lib-state')

async function getIMSToken(params) {
  const state = await stateLib.init()

  // Check cache first
  const cached = await state.get('ims:access_token')
  if (cached?.value) {
    return cached.value
  }

  // Request new token
  const response = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: params.CLIENT_ID,
      client_secret: params.CLIENT_SECRET,
      scope: 'openid,AdobeID,additional_info.projectedProductContext'
    })
  })

  const { access_token, expires_in } = await response.json()

  // Cache with TTL (slightly less than expires_in to avoid using expired tokens)
  await state.put('ims:access_token', access_token, {
    ttl: expires_in - 300  // 5 min buffer
  })

  return access_token
}
```

### 6.3 IMS Token Validation in Web Actions

```javascript
// Validate incoming IMS token in a web action
const { Core } = require('@adobe/aio-sdk')
const { Ims } = require('@adobe/aio-lib-ims')

async function main(params) {
  // When require-adobe-auth: true is set in manifest,
  // aio-lib automatically validates the token before your action runs
  // The user/service profile is available in params.__ow_headers

  // Manual validation if needed:
  const authHeader = params.__ow_headers?.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return { statusCode: 401, body: { error: 'Missing token' } }
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    // Validate against IMS
    const ims = await Ims.fromToken(token)
    const profile = await ims.getProfile(token)

    return {
      statusCode: 200,
      body: { user: profile.email, authorized: true }
    }
  } catch (e) {
    return { statusCode: 401, body: { error: 'Invalid token' } }
  }
}
```

### 6.4 Commerce REST API Authentication

```javascript
// Using Commerce OAuth 1.0a (integration tokens)
const OAuth = require('oauth-1.0a')
const crypto = require('crypto')

function getCommerceOAuthHeaders(url, method, params) {
  const oauth = OAuth({
    consumer: {
      key: params.CONSUMER_KEY,
      secret: params.CONSUMER_SECRET
    },
    signature_method: 'HMAC-SHA256',
    hash_function(base_string, key) {
      return crypto.createHmac('sha256', key).update(base_string).digest('base64')
    }
  })

  return oauth.toHeader(oauth.authorize({
    url,
    method
  }, {
    key: params.ACCESS_TOKEN,
    secret: params.ACCESS_TOKEN_SECRET
  }))
}

// Or simpler: use Commerce Admin token (for server-to-server)
async function getCommerceAdminToken(params) {
  const response = await fetch(`${params.COMMERCE_URL}/rest/V1/integration/admin/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: params.ADMIN_USERNAME,
      password: params.ADMIN_PASSWORD
    })
  })
  return response.json() // Returns token string
}
```

> **Exam focus:**
> - **JWT auth** is **deprecated** — Adobe is migrating all service credentials to OAuth 2.0 Server-to-Server
> - **OAuth 2.0 S2S** uses `grant_type=client_credentials` — no private key needed, just client_id + client_secret
> - Always **cache IMS tokens** in I/O State — they are valid for 24 hours. Requesting a new token on every action invocation is a performance anti-pattern.
> - Web actions with `require-adobe-auth: true` automatically reject requests without valid IMS tokens

---

## 7. Extensibility SDK & UI Components

### 7.1 @adobe/commerce-sdk-react

A React hook library for integrating Commerce data in App Builder SPAs.

```bash
npm install @adobe/commerce-sdk-react
```

```javascript
// Wrap your app with Commerce provider
// web-src/src/App.js
import { CommerceProvider } from '@adobe/commerce-sdk-react'

function App() {
  return (
    <CommerceProvider config={{
      endpoint: process.env.COMMERCE_URL,
      headers: {
        Authorization: `Bearer ${imsToken}`
      }
    }}>
      <OrderManagementPanel />
    </CommerceProvider>
  )
}
```

```javascript
// Use Commerce hooks in components
import {
  useProducts,
  useOrder,
  useCart,
  useCustomer
} from '@adobe/commerce-sdk-react'

function OrderDetail({ orderId }) {
  // Fetch order data using React hook
  const { data: order, loading, error } = useOrder({ orderId })

  if (loading) return <ProgressCircle />
  if (error) return <Alert variant="error">{error.message}</Alert>

  return (
    <View>
      <Heading>Order #{order.increment_id}</Heading>
      <Text>Status: {order.status}</Text>
      <Text>Total: {order.base_grand_total}</Text>
    </View>
  )
}

function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('')

  // Fetches products with optional filters
  const { data, loading } = useProducts({
    filter: { name: { match: searchTerm } },
    pageSize: 20
  })

  return (
    <SearchField
      label="Search Products"
      onChange={setSearchTerm}
    />
    // ... render data.products.items
  )
}
```

### 7.2 Admin UI SDK

The **Admin UI SDK** allows you to extend the Commerce Admin panel with App Builder-powered React components — **without modifying Commerce PHP code**.

```
Commerce Admin
+--------------------------------------------------+
|  [Dashboard] [Products] [Orders] [MY EXTENSION]  |  <-- New menu item
|                                                  |
|  +--------------------------------------------+ |
|  |  Custom Order Management Panel             | |
|  |  (Powered by App Builder SPA)              | |  <-- iFrame/embedded
|  |                                            | |
|  |  [Search Orders]  [Bulk Actions]           | |
|  |  [ERP Sync Status] [Custom Reports]        | |
|  +--------------------------------------------+ |
+--------------------------------------------------+
```

```javascript
// Register extension point with Admin UI SDK
// web-src/src/components/ExtensionRegistration.js
import { register } from '@adobe/uix-guest'

async function init() {
  const guestConnection = await register({
    id: 'my-commerce-extension',
    methods: {
      // Define what your extension contributes
      headerMenu: {
        getButtons: async () => ([
          {
            id: 'order-management',
            label: 'ERP Orders',
            icon: 'ShoppingCart',
            onClick: async () => {
              // Navigate to your extension panel
            }
          }
        ])
      },

      // Extend order detail page
      orderView: {
        getPanels: async () => ([
          {
            id: 'erp-sync-status',
            title: 'ERP Sync Status',
            url: '/index.html#/erp-sync'  // Your React route
          }
        ])
      }
    }
  })
}

init().catch(console.error)
```

```javascript
// Receive context from Commerce Admin
import { attach } from '@adobe/uix-guest'

async function init() {
  const connection = await attach({ id: 'my-commerce-extension' })

  // Get current page context (e.g., current order ID)
  const orderContext = await connection.host.orderView.getContext()
  const { orderId, orderData } = orderContext

  console.log('Currently viewing order:', orderId)
}
```

### 7.3 Extension Points (Admin UI SDK)

| Extension Point | Description | Example Use |
|-----------------|-------------|-------------|
| `headerMenu` | Add buttons to top nav | ERP sync dashboard link |
| `orderView` | Add panels to order detail page | Show ERP status, tracking |
| `productView` | Add panels to product page | Show inventory across warehouses |
| `customerView` | Extend customer page | Show loyalty points, external CRM data |
| `massAction` | Add bulk actions to grids | Bulk ERP export, batch approval |
| `pageContent` | Full custom admin pages | Custom dashboards, reports |

> **Exam focus:**
> - Admin UI SDK uses **iframe-based** communication between Commerce Admin and App Builder SPA
> - Extensions communicate via the `@adobe/uix-guest` SDK (inside iframe) and `@adobe/uix-host` SDK (Commerce Admin side)
> - No Commerce PHP customization needed — fully out-of-process

### 7.4 API Mesh (GraphQL Federation)

API Mesh allows combining multiple GraphQL/REST APIs into a single endpoint.

```json
// mesh.json - Combine Commerce GraphQL + 3rd party API
{
  "meshConfig": {
    "sources": [
      {
        "name": "Commerce",
        "handler": {
          "graphql": {
            "endpoint": "https://my-store.com/graphql"
          }
        }
      },
      {
        "name": "ERP",
        "handler": {
          "openapi": {
            "source": "https://erp.company.com/api/openapi.json"
          }
        }
      },
      {
        "name": "LoyaltyService",
        "handler": {
          "graphql": {
            "endpoint": "https://loyalty.service.com/graphql"
          }
        }
      }
    ],
    "additionalTypeDefs": "extend type CustomerOutput { loyaltyPoints: Int }"
  }
}
```

---

## 8. Common Use Cases

### 8.1 Custom Order Management UI

**Pattern:** Admin UI SDK + App Builder SPA + Runtime Actions + Commerce REST API

```
[Admin User] --> [Commerce Admin] --> [Admin UI SDK Extension]
                                              |
                                     [App Builder SPA (React)]
                                              |
                                   [I/O Runtime: get-orders action]
                                              |
                               +-------------+------------+
                               |                          |
                    [Commerce REST API]          [ERP REST API]
                    (order data)                (ERP status)
```

```javascript
// Runtime action: get-order-with-erp-status
async function main(params) {
  const { orderId, COMMERCE_URL, ERP_URL } = params
  const accessToken = await getIMSToken(params)

  // Parallel fetch from both systems
  const [commerceOrder, erpStatus] = await Promise.all([
    fetch(`${COMMERCE_URL}/rest/V1/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(r => r.json()),

    fetch(`${ERP_URL}/orders/${orderId}/status`, {
      headers: { 'X-API-Key': params.ERP_API_KEY }
    }).then(r => r.json())
  ])

  return {
    statusCode: 200,
    body: {
      order: commerceOrder,
      erpStatus: erpStatus.status,
      erpReference: erpStatus.reference
    }
  }
}
```

### 8.2 Async Order Sync to ERP

**Pattern:** I/O Events → Runtime Action → ERP API → State for deduplication

```javascript
// Event-driven order sync
async function main(params) {
  const stateLib = require('@adobe/aio-lib-state')
  const state = await stateLib.init()

  // Extract order data from Commerce event
  const orderData = params.data || params
  const { increment_id, status } = orderData

  // Check if already synced (idempotency)
  const syncKey = `erp_sync:${increment_id}:${status}`
  const alreadySynced = await state.get(syncKey)

  if (alreadySynced?.value) {
    console.log(`Order ${increment_id} already synced, skipping`)
    return { statusCode: 200, body: { skipped: true } }
  }

  // Only sync orders in specific statuses
  const syncableStatuses = ['complete', 'processing']
  if (!syncableStatuses.includes(status)) {
    return { statusCode: 200, body: { skipped: true, reason: 'Status not syncable' } }
  }

  try {
    // Fetch full order from Commerce
    const fullOrder = await getCommerceOrder(increment_id, params)

    // Transform to ERP format
    const erpPayload = transformOrderForERP(fullOrder)

    // Send to ERP
    const erpResponse = await sendToERP(erpPayload, params)

    // Mark as synced (24h TTL)
    await state.put(syncKey, erpResponse.erpId, { ttl: 86400 })

    return {
      statusCode: 200,
      body: { synced: true, erpId: erpResponse.erpId }
    }
  } catch (error) {
    console.error('ERP sync failed:', error)
    // Return error - I/O Events will retry
    throw error
  }
}
```

### 8.3 Extended Admin Panels

**Pattern:** Admin UI SDK extension point → SPA component → Runtime action

```javascript
// React component for extended product panel
import React, { useState, useEffect } from 'react'
import { attach } from '@adobe/uix-guest'
import { ActionButton, View, Text, ProgressCircle } from '@adobe/react-spectrum'

function InventoryPanel() {
  const [connection, setConnection] = useState(null)
  const [productId, setProductId] = useState(null)
  const [inventory, setInventory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    attach({ id: 'inventory-extension' }).then(async (conn) => {
      setConnection(conn)
      // Get product context from Commerce Admin
      const context = await conn.host.productView.getContext()
      setProductId(context.productId)

      // Fetch inventory from Runtime action
      const response = await fetch(
        `https://adobeioruntime.net/api/v1/web/myns/mypkg/get-inventory`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.imsToken}`
          },
          body: JSON.stringify({ productId: context.productId })
        }
      )
      setInventory(await response.json())
      setLoading(false)
    })
  }, [])

  if (loading) return <ProgressCircle aria-label="Loading inventory..." />

  return (
    <View padding="size-200">
      <Text>Warehouse A: {inventory.warehouseA} units</Text>
      <Text>Warehouse B: {inventory.warehouseB} units</Text>
      <ActionButton onPress={() => triggerReorder(connection, productId)}>
        Trigger Reorder
      </ActionButton>
    </View>
  )
}
```

### 8.4 Use Case Summary Table

| Use Case | Pattern | Key Services |
|----------|---------|--------------|
| Custom order dashboard | Admin UI SDK + SPA | Admin UI SDK, Runtime, Commerce REST |
| Real-time ERP order sync | Webhook → Action | Webhooks, Runtime, I/O State |
| Async bulk product import | Polling / Event | Runtime (scheduled), Files, Commerce REST |
| Customer loyalty display | Admin UI SDK panel | Admin UI SDK, Runtime, External API |
| Inventory aggregation | API Mesh | API Mesh, multiple GraphQL sources |
| Order notification emails | I/O Events → Action | I/O Events, Runtime, SendGrid/SES |
| Custom tax calculation | Webhook (synchronous) | Webhooks, Runtime, Tax API |

> **Exam focus:** Know which pattern (sync vs async, webhook vs polling) maps to which use case. Synchronous webhooks MUST respond within Commerce's timeout window (configurable, typically 2-5 seconds). Async via I/O Events is preferred for complex processing.

---

## Quick-Reference Checklist

### App Builder Architecture
- [ ] **Four pillars:** Runtime (compute), Files (blob), State (KV with TTL), Events (pub/sub)
- [ ] I/O State max TTL = 365 days, default = 86,400s; max value size = 1 MB
- [ ] I/O Files is backed by Azure Blob Storage; supports presigned URLs
- [ ] I/O Events: at-least-once delivery → actions MUST be idempotent
- [ ] App Builder is out-of-process — does NOT modify Commerce core

### Adobe I/O Runtime
- [ ] Built on **Apache OpenWhisk**
- [ ] **Web action** = HTTP endpoint, `web: 'yes'` in manifest, URL contains `/web/`
- [ ] **Non-web action** = no HTTP endpoint, invoked programmatically or by events
- [ ] `require-adobe-auth: true` = Runtime validates IMS token automatically
- [ ] **Sequence** = chain of actions; stops on first error; shares total timeout
- [ ] Default timeout = 60s, max = 3,600s (1 hour)
- [ ] Default memory = 256MB, max = 4,096MB
- [ ] Max payload = 5MB; blocking invocation max wait = 60s
- [ ] Async invocation returns `activation ID`; poll with `aio rt activation get`

### CLI Commands
- [ ] `aio login` → authenticate with IMS
- [ ] `aio app init` → scaffold new project
- [ ] `aio app run` → local dev (actions deployed to REAL Runtime)
- [ ] `aio app deploy` → full deployment
- [ ] `aio app deploy --skip-actions` → SPA only
- [ ] `aio app deploy --skip-content-deploy` → actions only
- [ ] `aio app undeploy` → remove deployment
- [ ] `aio rt action list/invoke/get/delete` → manage actions
- [ ] `aio rt activation list/logs/result` → debug executions

### Security
- [ ] **JWT auth** = deprecated; used RSA key pair + technical account
- [ ] **OAuth 2.0 Server-to-Server** = current standard; `grant_type=client_credentials`
- [ ] OAuth S2S tokens valid for **24 hours** — always cache in I/O State
- [ ] Never request a new IMS token on every action invocation (performance issue)
- [ ] Commerce integration tokens use **OAuth 1.0a** (consumer key/secret + access token/secret)
- [ ] Commerce admin tokens: POST to `/rest/V1/integration/admin/token`

### Integration Patterns
- [ ] **Synchronous webhook:** Commerce calls Runtime web action, must respond in 2-5s
- [ ] **Async via I/O Events:** preferred; handles retries, journaling, filtering
- [ ] **Polling:** scheduled Runtime action, fallback when push unavailable
- [ ] Commerce Eventing module: `magento/commerce-eventing`, declare events in `io_events.xml`
- [ ] Webhooks config: `app/code/Vendor/Module/etc/webhooks.xml`, root element `<config>`
- [ ] Deduplication pattern: check event ID in I/O State before processing
- [ ] Async actions should return `200 OK` immediately, process in background

### Admin UI SDK
- [ ] Iframe-based: App Builder SPA embedded in Commerce Admin
- [ ] `@adobe/uix-guest` SDK used inside the SPA iframe
- [ ] Extension points: `headerMenu`, `orderView`, `productView`, `customerView`, `massAction`
- [ ] No PHP code changes needed — fully out-of-process
- [ ] Register extensions with `register()`, attach with `attach()`
- [ ] Get Commerce context (productId, orderId, imsToken) via `connection.host.*`

### Commerce SDK React
- [ ] Package: `@adobe/commerce-sdk-react`
- [ ] Hooks: `useProducts`, `useOrder`, `useCart`, `useCustomer`
- [ ] Wrap app with `<CommerceProvider>` with endpoint + headers config

### Use Case Mappings
- [ ] Custom order management UI → Admin UI SDK + SPA + Runtime
- [ ] Async ERP sync → I/O Events → Runtime → ERP API
- [ ] Real-time tax calculation → Synchronous webhook → Runtime
- [ ] Inventory aggregation → API Mesh (GraphQL federation)
- [ ] Custom admin page → Admin UI SDK `pageContent` extension point
- [ ] Bulk import → Scheduled Runtime action + I/O Files
