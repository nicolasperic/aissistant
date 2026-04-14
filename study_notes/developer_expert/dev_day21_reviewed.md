# Day 21 — Light Review + Exam Prep (Day Before Exam)

## Adobe Commerce Developer Professional Exam — Final Consolidation Notes

---

## Table of Contents

- [1. Exam Section Weights + Time Strategy](#1-exam-section-weights--time-strategy)
- [2. Plugin / Observer / Preference Decision Tree](#2-plugin--observer--preference-decision-tree)
- [3. Cache Type Reference List](#3-cache-type-reference-list)
- [4. Indexer Modes + Commands](#4-indexer-modes--commands)
- [5. Architecture Quick Hits](#5-architecture-quick-hits)
- [6. Customizations Quick Hits](#6-customizations-quick-hits)
- [7. Cloud Quick Hits](#7-cloud-quick-hits)
- [8. External Integrations Quick Hits](#8-external-integrations-quick-hits)
- [9. High-Frequency Gotchas + Trap Answers](#9-high-frequency-gotchas--trap-answers)
- [10. Exam Morning Logistics](#10-exam-morning-logistics)
- [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Exam Section Weights + Time Strategy

The exam is approximately **37 questions** with a 90-minute window. Use the weights below to guide how much time and mental energy you spend per section.

| Section | Approx. Questions | Weight | Target Time |
|---|---|---|---|
| Architecture | ~14 | 38% | ~34 min |
| Customizations | ~12 | 32% | ~29 min |
| Cloud | ~6 | 16% | ~14 min |
| External Integrations | ~5 | 14% | ~13 min |
| **Total** | **~37** | **100%** | **~90 min** |

### Time Strategy Tips

- **Architecture is worth the most** — do not rush plugin/DI/module structure questions.
- **Cloud questions are very pattern-based** — `.magento.env.yaml`, `ece-tools`, environment types; once you know the patterns, these are fast points.
- **External Integrations** are few but very specific — REST, SOAP, GraphQL endpoint formats and OAuth flow details are likely targets.
- **Flag and move on** — never spend more than 3 minutes on a single question. Flag it, return at the end.

> **Exam focus:** Know the exact percentage weights. A question may ask "which topic area represents the largest portion of the exam?" → **Architecture at 38%**.

---

## 2. Plugin / Observer / Preference Decision Tree

This is one of the **highest-frequency topics** on the exam. You must be able to choose the correct customization mechanism given a scenario.

### Decision Tree

```
START: I need to customize Magento behavior
         |
         v
Is the target a PUBLIC METHOD on a non-final class?
         |
    YES  |  NO
         |   \
         |    Is the target an EVENT being dispatched?
         |         |
         |    YES  |  NO
         |         |   \
         |         |    Do you need to REPLACE the entire class?
         |         |              |
         |         |         YES  |  NO
         |         |              |   \
         |         |              |    Consider: Layout XML,
         |         |              |    Template override, etc.
         |         |              |
         |         |           Use PREFERENCE (di.xml)
         |         |
         |     Use OBSERVER (events.xml)
         |
    Does the method have input args you need to change?
         |
    YES  | 
         v
    Use BEFORE Plugin
         |
    Does the method have output/return you need to change?
         |
    YES  |
         v
    Use AFTER Plugin
         |
    Do you need to wrap, conditionally skip, or control flow?
         |
    YES  |
         v
    Use AROUND Plugin
```

### Plugin Rules — Must Know

```xml
<!-- di.xml -->
<type name="Vendor\Module\Model\SomeClass">
    <plugin name="my_plugin"
            type="MyVendor\MyModule\Plugin\SomeClassPlugin"
            sortOrder="10"
            disabled="false"/>
</type>
```

| Plugin Type | Method Prefix | Arguments | Return |
|---|---|---|---|
| Before | `before` + MethodName | `$subject` + original args | array of modified args (or null) |
| After | `after` + MethodName | `$subject`, `$result` | modified `$result` |
| Around | `around` + MethodName | `$subject`, `callable $proceed` + original args | return value |

> **Exam focus:** A **before plugin** must return `null` or an **array** of arguments — NOT the modified argument directly. Returning a single scalar is a common trap answer.

> **Exam focus:** Plugins **cannot** be applied to: `final` methods, `final` classes, `static` methods, `__construct`, virtual types, or objects instantiated with `new` (not via DI).

> **Exam focus:** Plugin `sortOrder` — lower number runs **first** for `before`, but **last** for `after`. After plugins execute in **reverse sort order**.

### Observer Rules — Must Know

```xml
<!-- events.xml -->
<event name="checkout_cart_add_product_complete">
    <observer name="my_observer"
              instance="MyVendor\MyModule\Observer\MyObserver"
              disabled="false"
              shared="true"/>
</event>
```

```php
<?php
// Observer must implement this interface
use Magento\Framework\Event\ObserverInterface;
use Magento\Framework\Event\Observer;

class MyObserver implements ObserverInterface
{
    public function execute(Observer $observer)
    {
        $product = $observer->getEvent()->getProduct();
        // your logic here
    }
}
```

> **Exam focus:** All observers implement `ObserverInterface` and must have an `execute(Observer $observer)` method — no other method name is valid.

> **Exam focus:** Events are **area-specific**. An `events.xml` in `frontend/` only fires for frontend requests. Global events go in the root `etc/` directory.

### Preference Rules — Must Know

```xml
<!-- di.xml -->
<preference for="Magento\Catalog\Model\Product"
            type="MyVendor\MyModule\Model\Product"/>
```

> **Exam focus:** A **preference replaces the entire class**. It is the most invasive customization — it can cause conflicts if two modules declare a preference for the same class. Use plugins whenever possible.

> **Exam focus:** Your preference class **must extend** the original class (or implement the same interface) to maintain compatibility.

### Quick Scenario → Answer Map

| Scenario | Answer |
|---|---|
| Add a new argument to a method call | Before Plugin |
| Log data after a method runs | After Plugin |
| Conditionally skip a method entirely | Around Plugin |
| React to `sales_order_place_after` | Observer |
| Replace `Magento\Checkout\Model\Session` entirely | Preference |
| Modify method that is `final` | Cannot use Plugin — use Observer or Preference |
| Modify constructor behavior | Cannot use Plugin — use Plugin on a non-constructor method or Preference |

---

## 3. Cache Type Reference List

> **Exam focus:** Know the cache type **code names** (used in CLI commands), their labels, and what they store.

```bash
# View all cache types and their status
bin/magento cache:status

# Enable/disable specific cache types
bin/magento cache:enable full_page
bin/magento cache:disable layout

# Clean (clears tagged/invalid entries) vs Flush (wipes entire storage)
bin/magento cache:clean config
bin/magento cache:flush
```

### Full Cache Type Table

| Cache Type Code | Label | Stores |
|---|---|---|
| `config` | Configuration | Merged XML config from all modules |
| `layout` | Layouts | XML layout files, parsed layout trees |
| `block_html` | Blocks HTML Output | Cached HTML output of blocks |
| `collections` | Collections Data | Database collection results |
| `reflection` | Reflection Data | API interface reflection metadata |
| `db_ddl` | Database DDL Operations | DB schema info (tables, columns) |
| `compiled_config` | Compiled Config | DI compiled configuration |
| `eav` | EAV Types and Attributes | Entity-attribute-value metadata |
| `customer_notification` | Customer Notifications | Inline notification messages |
| `config_integration` | Integrations Configuration | Integration config |
| `config_integration_api` | Integrations API Config | Integration API tokens |
| `full_page` | Page Cache | Full HTML pages (FPC) |
| `config_webservice` | Web Services Config | REST/SOAP API config (WSDL) |
| `translate` | Translations | Translation strings |
| `vertex` | Vertex Tax Config | Vertex integration config — **requires separate Vertex Tax module; not a standard Commerce cache type** |

> **Exam focus:** `cache:clean` removes **invalid/expired** cache entries. `cache:flush` **wipes the entire cache storage** including things other apps may share. Prefer `cache:clean` in production.

> **Exam focus:** `full_page` is the **Full Page Cache (FPC)**. Disabling it forces every page to be regenerated dynamically. Varnish operates at this cache layer.

> **Exam focus:** `compiled_config` is generated by `bin/magento setup:di:compile`. It is separate from the standard cache and lives in `generated/`.

---

## 4. Indexer Modes + Commands

### Indexer Modes

| Mode | Code | Behavior |
|---|---|---|
| **Update on Save** | `realtime` | Index updates immediately when data changes (slower saves) |
| **Update by Schedule** | `schedule` | Changes queued to `*_cl` changelog tables, cron processes them |

> **Exam focus:** "Update by Schedule" uses **changelog tables** (e.g., `catalog_product_flat_cl`) and a **cron job** to process the queue. This is the **recommended production mode** for performance.

> **Exam focus:** When an indexer is in `schedule` mode and data changes, the index status shows as **"Schedule"** (not "Ready") until the cron runs.

### Indexer CLI Commands

```bash
# View all indexer statuses
bin/magento indexer:status

# View current indexer modes
bin/magento indexer:show-mode

# Set mode for specific indexer
bin/magento indexer:set-mode schedule catalog_product_flat
bin/magento indexer:set-mode realtime catalog_product_flat

# Set mode for ALL indexers
bin/magento indexer:set-mode schedule

# Manually reindex a specific indexer
bin/magento indexer:reindex catalog_product_flat

# Reindex all indexers
bin/magento indexer:reindex

# Reset indexer (forces full reindex on next run)
bin/magento indexer:reset catalog_product_price
```

### Core Indexer List

| Indexer Code | What It Builds |
|---|---|
| `catalog_category_product` | Category-product associations |
| `catalog_product_category` | Product-category associations |
| `catalog_product_price` | Product price index |
| `catalog_product_attribute` | Filterable/searchable attribute index |
| `catalogsearch_fulltext` | Full-text search index (Elasticsearch) |
| `catalog_product_flat` | Flat catalog product table |
| `catalog_category_flat` | Flat catalog category table |
| `cataloginventory_stock` | Stock/inventory index |
| `customer_grid` | Customer grid index |
| `design_config_flat` | Design config flat index |
| `salesrule_rule` | Cart price rule index |

> **Exam focus:** `catalog_product_flat` and `catalog_category_flat` must be **enabled** in the admin (Stores > Configuration > Catalog) before they do anything useful. They are not enabled by default in all setups.

> **Exam focus:** After `setup:upgrade` or `setup:di:compile`, you typically need to run `indexer:reindex` to ensure all indexes are current.

---

## 5. Architecture Quick Hits

> This section is worth **38%** of the exam. Every bullet below is a likely question.

### Module Structure

```
app/code/Vendor/ModuleName/
+-- registration.php
+-- etc/
|   +-- module.xml
|   +-- di.xml
|   +-- config.xml
|   +-- frontend/
|   |   +-- events.xml
|   |   +-- routes.xml
|   +-- adminhtml/
|       +-- routes.xml
+-- Model/
+-- Block/
+-- Controller/
|   +-- Index/
|       +-- Index.php
+-- view/
    +-- frontend/
    |   +-- layout/
    |   +-- templates/
    +-- adminhtml/
        +-- layout/
        +-- templates/
```

> **Exam focus:** `registration.php` is **required** in every module. Without it, Magento will not recognize the module exists.

> **Exam focus:** `etc/module.xml` declares the module name and version. `sequence` in `module.xml` declares **load order dependencies**, not code dependencies.

```xml
<!-- etc/module.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="Vendor_ModuleName" setup_version="1.0.0">
        <sequence>
            <module name="Magento_Catalog"/>
        </sequence>
    </module>
</config>
```

### Dependency Injection Key Rules

```xml
<!-- Constructor injection in di.xml -->
<type name="Vendor\Module\Model\MyModel">
    <arguments>
        <argument name="myService" xsi:type="object">
            Vendor\Module\Service\MyService
        </argument>
        <argument name="configValue" xsi:type="string">some_value</argument>
    </arguments>
</type>
```

> **Exam focus:** Argument types in `di.xml`: `object`, `string`, `boolean`, `number`, `null`, `array`, `init_parameter`, `const`.

> **Exam focus:** A **virtual type** creates a new "virtual" class with different constructor arguments — it does **not** create a new PHP class file. It only exists in DI configuration.

```xml
<!-- Virtual Type example -->
<virtualType name="Vendor\Module\Model\SpecialLogger"
             type="Magento\Framework\Logger\Monolog">
    <arguments>
        <argument name="name" xsi:type="string">special_log</argument>
    </arguments>
</virtualType>
```

### Object Manager — Key Rules

> **Exam focus:** You should **never** use `ObjectManager` directly in production code except in:
> - Factory classes
> - Proxy classes
> - Tests
> - `registration.php` bootstrapping scenarios
>
> Always use **constructor injection** instead.

### Area Codes

| Area Code | Usage |
|---|---|
| `frontend` | Storefront |
| `adminhtml` | Admin panel |
| `crontab` | Cron jobs |
| `webapi_rest` | REST API |
| `webapi_soap` | SOAP API |
| `graphql` | GraphQL API |
| `install` | Installation |

> **Exam focus:** Area determines which `di.xml`, `events.xml`, `routes.xml`, and layout files are loaded. Area-specific configs in `etc/frontend/` only apply to `frontend` area.

---

## 6. Customizations Quick Hits

> This section is worth **32%** of the exam.

### Layout XML Key Rules

```xml
<!-- Referencing an existing block -->
<referenceBlock name="catalog.product.list">
    <action method="setTemplate">
        <argument name="template" xsi:type="string">
            Vendor_Module::category/product/list.phtml
        </argument>
    </action>
</referenceBlock>

<!-- Removing a block -->
<referenceBlock name="right.permanent.resolver" remove="true"/>

<!-- Adding a child block -->
<referenceBlock name="content">
    <block class="Vendor\Module\Block\MyBlock"
           name="my.custom.block"
           template="Vendor_Module::my_template.phtml"
           after="-"/>
</referenceBlock>
```

> **Exam focus:** Layout file naming convention: `{route_id}_{controller}_{action}.xml`. Example: `catalog_product_view.xml` handles the product detail page.

> **Exam focus:** `after="-"` means render **last**. `before="-"` means render **first**.

> **Exam focus:** `remove="true"` removes a block from the layout tree entirely. Use `display="false"` to hide it without removal (block still exists in layout, just not rendered).

### Template Override Path Resolution

```
1. Theme (app/design/frontend/Vendor/Theme/)
   +-- Vendor_Module/templates/template.phtml   <-- checked FIRST

2. Module fallback
   +-- app/code/Vendor/Module/view/frontend/templates/template.phtml
```

> **Exam focus:** Theme templates **always override** module templates. The theme directory structure mirrors the module: `{ThemePath}/{Vendor_Module}/templates/`.

### UI Components

> **Exam focus:** UI Components use XML definition files in `view/{area}/ui_component/`. They are used for admin grids and forms.

```xml
<!-- view/adminhtml/ui_component/my_grid.xml -->
<listing xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="...">
    <dataSource name="my_grid_data_source">
        <dataProvider class="Magento\Framework\View\Element\UiComponent\DataProvider\DataProvider"
                      name="my_grid_data_source">
            <settings>
                <requestFieldName>id</requestFieldName>
                <primaryFieldName>entity_id</primaryFieldName>
            </settings>
        </dataProvider>
    </dataSource>
</listing>
```

### ACL (Access Control List)

```xml
<!-- etc/acl.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Acl/etc/acl.xsd">
    <acl>
        <resources>
            <resource id="Magento_Backend::admin">
                <resource id="Vendor_Module::main_menu" title="My Module"
                          sortOrder="100">
                    <resource id="Vendor_Module::config" title="Configuration"/>
                </resource>
            </resource>
        </resources>
    </acl>
</config>
```

> **Exam focus:** Every admin controller must define `const ADMIN_RESOURCE = 'Vendor_Module::resource_id'` to enforce ACL. Without it, the page is accessible to all admin users.

---

## 7. Cloud Quick Hits

> This section is worth **16%** of the exam. Questions are pattern-based — know the files and environment types.

### Environment Types

```
Production   <-- live site, no SSH code deploy, merge from Staging only
    |
Staging      <-- full-size copy of Production for QA/UAT
    |
Integration  <-- developer environments (up to 3 branches), limited resources
```

> **Exam focus:** You **cannot push directly to Production**. Code goes: Integration → Staging → Production via **merge** (git push/merge triggers deploy pipeline).

> **Exam focus:** Integration environments have **limited resources** and are not suitable for performance testing. Staging mirrors Production.

### Key Configuration Files

| File | Purpose |
|---|---|
| `.magento.env.yaml` | Environment-specific variables (deploy phases, SCD, etc.) |
| `.magento/routes.yaml` | Defines HTTP routes, redirects, upstream targets |
| `.magento/services.yaml` | Declares services (MySQL, Redis, Elasticsearch, RabbitMQ) |
| `.magento.app.yaml` | Application config (runtime, hooks, relationships, mounts) |

```yaml
# .magento.env.yaml example
stage:
  global:
    SKIP_HTML_MINIFICATION: true
  build:
    SCD_ON_DEMAND: true
  deploy:
    REDIS_BACKEND: 'Magento\Framework\Cache\Backend\RemoteSynchronizedCache'
    UPDATE_URLS: false
  post_deploy:
    WARM_UP_PAGES:
      - "index.php/"
      - "index.php/customer/account/create"
```

> **Exam focus:** `.magento.env.yaml` has three stages: `global`, `build`, `deploy`, and `post_deploy`. Variables in `global` apply to all stages.

### ECE-Tools Commands

```bash
# Deploy phases (run automatically via hooks in .magento.app.yaml)
php ./vendor/bin/ece-tools build:generate
php ./vendor/bin/ece-tools build:transfer
php ./vendor/bin/ece-tools deploy
php ./vendor/bin/ece-tools post-deploy

# Check environment configuration
php ./vendor/bin/ece-tools env:config:show

# Run wizards (validate configuration)
php ./vendor/bin/ece-tools wizard:scd-on-demand
php ./vendor/bin/ece-tools wizard:master-slave
```

> **Exam focus:** **SCD (Static Content Deploy)** can happen at **build phase** (recommended for Production) or **deploy phase**. Build-phase SCD reduces downtime during deploy.

> **Exam focus:** `SCD_ON_DEMAND: true` generates static content only when first requested — good for Integration environments, **not** recommended for Production.

### Cloud Branches + Git Flow

```
master (Production)
  |
  +-- staging (Staging)
        |
        +-- feature-branch-1 (Integration)
        +-- feature-branch-2 (Integration)
        +-- hotfix-branch   (Integration)
```

> **Exam focus:** Pushing to a Cloud branch **automatically triggers** the build and deploy pipeline for that environment.

---

## 8. External Integrations Quick Hits

> This section is worth **14%** of the exam.

### REST API

```
Base URL format:
https://domain.com/rest/{store_code}/V1/{endpoint}

Examples:
GET  /rest/default/V1/products?searchCriteria[pageSize]=10
POST /rest/default/V1/customers
PUT  /rest/default/V1/products/:sku
```

> **Exam focus:** REST API versions are in the URL path (`/V1/`). The store code `default` refers to the default store view. Use `all` to target all store views.

> **Exam focus:** Search criteria parameters: `searchCriteria[filterGroups][0][filters][0][field]`, `[value]`, `[conditionType]`. Multiple filters in the same filter group are **OR** conditions. Multiple filter groups are **AND** conditions. (Verified: `AbstractDb::addFieldToFilter()` joins same-group filters with `SQL_OR`; each group call is a separate `WHERE` clause that gets ANDed.)

### Authentication Methods

| Method | Use Case |
|---|---|
| OAuth 1.0a | Third-party integrations (server-to-server) |
| Bearer Token | Admin/Customer token via `/V1/integration/admin/token` |
| Session-based | Frontend AJAX calls (uses customer session) |
| Guest | Limited unauthenticated endpoints only |

```bash
# Get admin token
POST /rest/V1/integration/admin/token
{
  "username": "admin",
  "password": "admin123"
}

# Use token in header
Authorization: Bearer {token_string}
```

> **Exam focus:** Admin tokens expire based on the **Admin Token Lifetime** setting (default: 4 hours). Customer tokens also have a configurable lifetime.

### GraphQL

```graphql
# Example product query
{
  products(filter: { sku: { eq: "MH01" } }) {
    items {
      id
      name
      sku
      price_range {
        minimum_price {
          regular_price {
            value
            currency
          }
        }
      }
    }
  }
}
```

```
GraphQL Endpoint: POST https://domain.com/graphql
```

> **Exam focus:** Magento GraphQL only uses **POST** requests. The endpoint is always `/graphql` (no versioning in the URL).

> **Exam focus:** GraphQL schema is defined via `schema.graphqls` files in `etc/` of a module. Resolvers implement `\Magento\Framework\GraphQl\Query\ResolverInterface`.

### SOAP API

```
WSDL URL: https://domain.com/soap/default?wsdl&services=customerCustomerRepositoryV1
```

> **Exam focus:** SOAP uses **WSDL** for service discovery. The URL pattern is `/soap/{store_code}?wsdl&services={ServiceName}`. SOAP is considered legacy — REST/GraphQL preferred for new integrations.

### Webhooks / Async API

> **Exam focus:** Magento supports **asynchronous REST** via `/async/bulk/V1/` endpoints. These use **RabbitMQ** (or MySQL as a fallback queue) for message processing.

```bash
# Async bulk REST endpoint
POST /async/bulk/V1/products
```

---

## 9. High-Frequency Gotchas + Trap Answers

These are patterns where exam questions deliberately test edge cases. Review each one.

### DI / Plugin Traps

> **Exam focus — Trap:** "Use a plugin on `__construct`" → **Wrong**. Plugins cannot intercept constructors.

> **Exam focus — Trap:** "A before plugin should return the modified argument directly" → **Wrong**. It must return an **array** of arguments, even if only one argument is being changed.

> **Exam focus — Trap:** "Preferences are the safest way to customize" → **Wrong**. Plugins are less invasive. Preferences replace the whole class and cause conflicts if multiple modules target the same class.

> **Exam focus — Trap:** "Virtual types create a new PHP class file in `generated/`" → **Wrong**. Virtual types only exist in DI config; no PHP file is generated.

### Cache/Indexer Traps

> **Exam focus — Trap:** "`cache:flush` is always better than `cache:clean`" → **Wrong**. `cache:flush` wipes the entire storage backend, potentially clearing other application caches sharing the same Redis instance. `cache:clean` is scoped to Magento's tagged entries.

> **Exam focus — Trap:** "Running `setup:upgrade` also reindexes everything" → **Wrong**. `setup:upgrade` does not reindex. You must manually run `indexer:reindex` after schema/data upgrades.

### Cloud Traps

> **Exam focus — Trap:** "You can deploy directly to Production by SSH" → **Wrong**. Cloud Pro Production is **read-only via SSH**. All deploys happen through git push → pipeline.

> **Exam focus — Trap:** "`.magento.app.yaml` is where you set environment variables like `REDIS_BACKEND`" → **Wrong**. Application-level config is in `.magento.app.yaml`, but **environment-specific variables** go in `.magento.env.yaml`.

> **Exam focus — Trap:** "Staging and Production share the same codebase file system" → **Wrong**. They are separate environments. Code is promoted by **merging branches**.

### REST API Traps

> **Exam focus:** Filters within the **same filter group** are **OR** conditions. Filters in **different filter groups** are **AND** conditions. (Verified: `AbstractDb::addFieldToFilter()` uses `SQL_OR` for same-group filters; different groups produce separate `WHERE` clauses that are ANDed.)

> **Exam focus — Trap:** "GraphQL supports GET requests" → **Wrong**. Magento's GraphQL implementation uses **POST only**.

### Observer/Event Traps

> **Exam focus — Trap:** "You can stop event propagation from an observer" → **Wrong** in standard Magento. Unlike plugins, observers cannot stop other observers from running (there is no equivalent of returning `false` to halt). Use around plugins if you need to control flow.

> **Exam focus — Trap:** "An observer in `etc/events.xml` runs in all areas" → **Wrong**. Only observers in the root `etc/events.xml` are global. Area-specific files (`etc/frontend/events.xml`) only run in their area.

---

## 10. Exam Morning Logistics

### The Night Before (Tonight)

- [ ] Set **two alarms** — one 90 min before exam, one 60 min before
- [ ] Lay out water bottle and snacks at your desk
- [ ] Close all browser tabs except the exam portal bookmark
- [ ] Charge laptop / check exam environment (camera, mic if required)
- [ ] Confirm your exam time: **March 13 at 8:20 AM**
- [ ] Log into the exam portal once to confirm credentials work
- [ ] **Stop studying by 10 PM** — rest is more valuable than a last-minute cram

### Exam Morning

```
Morning Routine
---------------
Wake up
  |
  v
Water + light snack (avoid heavy food)
  |
  v
Brief 15-min review of this Quick-Reference Checklist ONLY
  |
  v
Log into exam portal 10 min early
  |
  v
Exam starts 8:20 AM
```

### During the Exam

- **Read every answer** before selecting — trap answers are designed to sound right.
- **Flag uncertain questions** — return to them after completing all others.
- **Eliminate obviously wrong answers** first — often gets you to 50/50.
- If a question mentions "best practice" or "recommended" → favor **plugins over preferences**, **schedule mode over realtime**, **constructor injection over ObjectManager**.
- Architectural questions: when in doubt, think **"separation of concerns"** — what layer does this logic belong in?

---

## Quick-Reference Checklist

### Exam Section Weights
- [ ] Architecture = **38%** (~14 questions) — highest weight
- [ ] Customizations = **32%** (~12 questions)
- [ ] Cloud = **16%** (~6 questions)
- [ ] External Integrations = **14%** (~5 questions)

### Plugin Decision
- [ ] **Before plugin** → modify input args → must return `null` or **array** of args
- [ ] **After plugin** → modify return value → receives `$subject` + `$result`
- [ ] **Around plugin** → wrap/skip method → must call `$proceed()` or skip it
- [ ] Plugins **cannot** intercept: `final`, `static`, `__construct`, objects from `new`
- [ ] `sortOrder` lower = runs first for `before`; **reverse order** for `after`

### Observer Decision
- [ ] Use observer for **event reactions** (not method interception)
- [ ] Must implement `ObserverInterface` with `execute(Observer $observer)` method
- [ ] Root `etc/events.xml` = **global**; `etc/frontend/events.xml` = **frontend only**
- [ ] Observers **cannot** stop event propagation

### Preference Decision
- [ ] Use preference to **replace an entire class**
- [ ] Most invasive — use only when plugin/observer not possible
- [ ] Preference class must extend original or implement same interface
- [ ] Two preferences for the same class = **conflict**

### Cache Types (Code Names)
- [ ] `config` — merged XML configuration
- [ ] `layout` — parsed layout XML
- [ ] `block_html` — rendered block HTML
- [ ] `full_page` — Full Page Cache (FPC)
- [ ] `eav` — EAV attribute metadata
- [ ] `db_ddl` — database schema info
- [ ] `translate` — translation strings
- [ ] `cache:clean` = scoped; `cache:flush` = wipes entire backend storage

### Indexer Modes
- [ ] `realtime` = update on save (immediate, slower saves)
- [ ] `schedule` = update by schedule (cron + changelog tables, recommended for production)
- [ ] Changelog tables: `{indexer}_cl` e.g. `catalog_product_flat_cl`
- [ ] `indexer:reindex` — manual full reindex
- [ ] `indexer:reset` — marks indexer as invalid (forces full reindex on next run)

### Module Structure
- [ ] Every module needs: `registration.php` + `etc/module.xml`
- [ ] `sequence` in `module.xml` = load order, not PHP dependency
- [ ] `di.xml` argument types: `object`, `string`, `boolean`, `number`, `null`, `array`, `const`, `init_parameter`
- [ ] Virtual types = DI config only, no PHP file generated
- [ ] **Never** use ObjectManager directly in production code

### Area Codes
- [ ] `frontend`, `adminhtml`, `crontab`, `webapi_rest`, `webapi_soap`, `graphql`, `install`

### Layout XML
- [ ] File naming: `{route}_{controller}_{action}.xml`
- [ ] `remove="true"` = removes block; `display="false"` = hides without removing
- [ ] `after="-"` = last; `before="-"` = first
- [ ] Theme templates **always** override module templates

### ACL
- [ ] Admin controllers require `const ADMIN_RESOURCE = 'Vendor_Module::resource_id'`

### Cloud Environments
- [ ] Integration → Staging → Production (code flow via git merge)
- [ ] Cannot push directly to Production
- [ ] `.magento.env.yaml` = environment variables (build, deploy, post_deploy stages)
- [ ] `.magento/services.yaml` = declare services (MySQL, Redis, Elasticsearch)
- [ ] `.magento/routes.yaml` = HTTP routes
- [ ] `.magento.app.yaml` = app config (hooks, mounts, relationships)
- [ ] SCD at **build phase** = less downtime; `SCD_ON_DEMAND` = Integration only

### REST API
- [ ] URL: `/rest/{store_code}/V1/{endpoint}`
- [ ] Same filterGroup filters = **OR**; different filterGroups = **AND**
- [ ] Admin token endpoint: `POST /V1/integration/admin/token`
- [ ] Token in header: `Authorization: Bearer {token}`
- [ ] Async bulk endpoint: `/async/bulk/V1/` (uses RabbitMQ; MySQL queue is valid fallback)

### GraphQL
- [ ] Endpoint: `POST /graphql` (POST only, no versioning in URL)
- [ ] Schema defined in `etc/schema.graphqls`
- [ ] Resolvers implement `\Magento\Framework\GraphQl\Query\ResolverInterface`

### SOAP
- [ ] WSDL URL: `/soap/{store_code}?wsdl&services={ServiceName}`
- [ ] Legacy — prefer REST or GraphQL for new integrations

### Top Trap Answers to Avoid
- [ ] Before plugin returns single value → **WRONG** (must return array or null)
- [ ] Plugin on `__construct` → **WRONG** (not allowed)
- [ ] `cache:flush` is always safe → **WRONG** (can clear shared backend)
- [ ] `setup:upgrade` reindexes → **WRONG** (must run `indexer:reindex` separately)
- [ ] Direct deploy to Cloud Production → **WRONG** (merge only via pipeline)
- [ ] GraphQL supports GET → **WRONG** (POST only)
- [ ] Same filterGroup = AND → **WRONG** (same group = OR; different groups = AND)
- [ ] Preferences are safer than plugins → **WRONG** (plugins are less invasive)
- [ ] Virtual types generate a PHP file → **WRONG** (DI config only)
- [ ] Observers can stop propagation → **WRONG** (no propagation control in Magento observers)

---

*Good luck tomorrow. You have put in the work. Trust your preparation, read every answer carefully, and flag anything uncertain. You are ready.* ✓
