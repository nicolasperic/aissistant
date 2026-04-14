# AD0-E722 Magento 2 Architect Exam — Architecture Overview & Module System

## Study Notes: Week 1, Section 1 — Design Foundations

---

## Table of Contents

1. [Exam Philosophy & How to Think Like an Architect](#1-exam-philosophy--how-to-think-like-an-architect)
2. [Module Lifecycle & Registration](#2-module-lifecycle--registration)
   - [registration.php](#registrationphp)
   - [module.xml](#modulexml)
   - [composer.json](#composerjson)
   - [Sequence Dependencies — Deep Dive](#sequence-dependencies--deep-dive)
3. [Area Codes In Depth](#3-area-codes-in-depth)
   - [What is an Area?](#what-is-an-area)
   - [Area Code Reference Table](#area-code-reference-table)
   - [How Routers Differ Per Area](#how-routers-differ-per-area)
   - [Area-Specific Configuration Loading](#area-specific-configuration-loading)
4. [DI Configuration & Area Scoping](#4-di-configuration--area-scoping)
   - [Global vs Area-Scoped di.xml](#global-vs-area-scoped-dixml)
   - [Hands-On: module-catalog/etc/ Walkthrough](#hands-on-module-catalogetc-walkthrough)
5. [Tricky Concepts — Exam Traps](#5-tricky-concepts--exam-traps)
   - [Sequence Affects Plugin & Observer Ordering](#sequence-affects-plugin--observer-ordering)
   - [Circular Dependencies](#circular-dependencies)
6. [AD0-E722 Exam Guide Flags](#6-ad0-e722-exam-guide-flags)
7. [Architectural Decision-Making Framework](#7-architectural-decision-making-framework)
8. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Exam Philosophy & How to Think Like an Architect

The AD0-E722 exam is **not** a syntax recall test. It rewards understanding *why* Magento is designed the way it is and *why* one architectural choice is superior in a given scenario.

### The Core Mental Model

```
Wrong approach: "What is the correct syntax?"
Right approach: "What are the trade-offs, and which choice is most maintainable,
                 performant, and upgrade-safe for this scenario?"
```

### Architect-Level Thinking Checklist (Apply to Every Question)

| Question to Ask | Why It Matters |
|---|---|
| Does this survive an upgrade? | Overrides are brittle; plugins/observers are not |
| Is this scoped to the right area? | Loading adminhtml logic in frontend wastes resources |
| Does this respect the dependency graph? | Wrong sequence = wrong plugin order |
| Is this the most minimal change? | Architectural minimalism reduces risk |
| Could this cause a conflict with another module? | Sequence and plugin sort order matter |

> **Exam focus:** Expect questions where **two options both compile and work** but one is architecturally wrong (e.g., using a class rewrite instead of a plugin, or putting global config in an area-scoped file).

---

## 2. Module Lifecycle & Registration

A Magento module comes to life through three files working in concert. Understanding *why* each file exists and *what role it plays* is essential.

```
Magento Bootstrap
      |
      v
ComponentRegistrar reads all registration.php files
      |
      v
Module list is assembled (enabled modules from app/etc/config.php)
      |
      v
module.xml declares version + sequence (load order resolved)
      |
      v
Dependency injection, plugins, observers loaded per resolved order
```

---

### registration.php

**Location:** `<module_root>/registration.php`

**Purpose:** Tells Magento's `ComponentRegistrar` that this directory is a module. This is the **entry point** of the module — without it, the module does not exist to Magento at all.

```php
<?php
use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::MODULE,    // type: MODULE, THEME, LANGUAGE, LIBRARY
    'Vendor_ModuleName',           // module name in Vendor_Module format
    __DIR__                        // absolute path to module root
);
```

**How it is discovered:**

```php
// vendor/magento/framework/Component/ComponentRegistrar.php
// All registration.php files are loaded via:
// vendor/magento/framework/App/Bootstrap.php -> autoload mechanism
// Composer's autoload files[] directive triggers this on every request
```

> **Exam focus:**
> - `registration.php` uses `ComponentRegistrar`, **not** `Mage::register()` (Magento 1 pattern).
> - The `type` constant matters: `MODULE`, `THEME`, `LANGUAGE`, `LIBRARY` — each has a different resolution path.
> - A module with a missing or broken `registration.php` will be **completely invisible** to Magento, even if `module.xml` is present.

---

### module.xml

**Location:** `<module_root>/etc/module.xml`

**Purpose:** Declares the module's identity (name + schema version) and its **sequence** (load order relative to other modules).

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="Vendor_ModuleName">
        <sequence>
            <module name="Magento_Catalog"/>
            <module name="Magento_Store"/>
        </sequence>
    </module>
</config>
```

**Key attributes:**

| Attribute | Description |
|---|---|
| `name` | Must match `registration.php` and `composer.json` |
| `setup_version` | Removed from modern modules — replaced by `db_schema.xml` declarative schema. Not present in core modules as of 2.4.x. |
| `<sequence>` | Load order declaration — does **not** enforce a hard dependency |

> **Exam focus:**
> - `<sequence>` is **not** the same as a `require` in `composer.json`. Sequence only affects **load order**. It does not prevent installation if the listed module is absent.
> - Sequence determines the **merge order** of configuration XML files. Later-loaded modules' config merges *on top of* earlier ones.
> - **Plugin and observer sort order is affected by sequence.** This is a common exam trap — covered in detail in [Section 5](#5-tricky-concepts--exam-traps).

---

### composer.json

**Location:** `<module_root>/composer.json`

**Purpose:** PHP package metadata for Composer dependency management. This is the **hard dependency** mechanism — Composer will refuse to install or update if required packages are missing.

```json
{
    "name": "vendor/module-name",
    "description": "Module description",
    "type": "magento2-module",
    "version": "1.0.0",
    "require": {
        "php": "~8.1.0||~8.2.0",
        "magento/framework": "*",
        "magento/module-catalog": "*"
    },
    "autoload": {
        "files": [
            "registration.php"
        ],
        "psr-4": {
            "Vendor\\ModuleName\\": ""
        }
    }
}
```

**Critical fields:**

| Field | Architectural Significance |
|---|---|
| `"type": "magento2-module"` | Tells the Magento Composer plugin how to deploy the package |
| `"require"` | **Hard dependency** — Composer enforces this. Missing package = installation failure |
| `autoload.files` | This is what causes `registration.php` to execute on every request |
| `autoload.psr-4` | Namespace-to-path mapping for class autoloading |

> **Exam focus:**
> - `composer.json` `require` = hard dependency (Composer enforced).
> - `module.xml` `<sequence>` = soft ordering hint (no enforcement, just load order).
> - A module can be in `<sequence>` without being in `require` — this is intentional for optional integrations.
> - The `"type": "magento2-module"` triggers the `magento/magento-composer-installer` to place the module in the correct directory.

---

### Sequence Dependencies — Deep Dive

This is one of the most misunderstood topics and a favourite exam target.

```
Module Load Order Resolution Algorithm:
=====================================================
1. Collect all enabled modules from app/etc/config.php
2. For each module, read its <sequence> from module.xml
3. Build a directed acyclic graph (DAG)
4. Perform topological sort
5. Result = ordered module list used for all config merging

Example:
  Vendor_B requires sequence: [Magento_Catalog]
  Vendor_A requires sequence: [Magento_Catalog, Vendor_B]

  Load order: Magento_Catalog -> Vendor_B -> Vendor_A

  Config merge order (each file merged on top of previous):
  Magento_Catalog/etc/di.xml
        +
  Vendor_B/etc/di.xml
        +
  Vendor_A/etc/di.xml  <-- Vendor_A wins any conflicts
```

**What sequence actually controls:**

1. **XML configuration merge order** — later modules override earlier in any merged XML
2. **Plugin execution order** — when `sortOrder` is equal, sequence-later plugins execute outer-to-inner first
3. **Observer execution order** — observers registered by later-loaded modules execute after earlier ones (when priority is equal)
4. **Setup script execution order** — `InstallSchema`, `UpgradeSchema` run in sequence order

> **Exam focus:**
> - Sequence creates a **load order**, not an installation requirement.
> - If `Vendor_A` needs to **override** `Vendor_B`'s plugin, `Vendor_A` must come **after** `Vendor_B` in sequence AND use a higher `sortOrder`.
> - Sequence is transitive: if A sequences after B, and B sequences after C, then A loads after C.

---

## 3. Area Codes In Depth

### What is an Area?

An **area** in Magento is a bounded execution context that determines:
- Which configuration files are loaded
- Which router(s) handle requests
- Which DI definitions are active
- What services are available

Areas exist to **minimize memory footprint and loading time** — you should never load adminhtml controllers on a frontend request, and you should never load frontend themes in a REST API call.

```
HTTP Request arrives
      |
      v
+------------------------------+
|  Magento\Framework\App\Http  |
|  (front controller)          |
+------------------------------+
      |
      v
Area detection (based on URL pattern / entry point)
      |
      +---> /index.php         -> frontend
      +---> /pub/index.php     -> frontend
      +---> /index.php/admin/  -> adminhtml
      +---> /rest/             -> webapi_rest
      +---> /soap/             -> webapi_soap
      +---> /graphql           -> graphql
      |
      v
Area-specific configs loaded (di.xml, routes.xml, etc.)
      |
      v
Request processed in isolated area context
```

---

### Area Code Reference Table

| Area Code | Entry Point | Purpose | Config Path |
|---|---|---|---|
| `frontend` | `pub/index.php` | Customer-facing storefront | `etc/frontend/` |
| `adminhtml` | `pub/index.php/admin` | Merchant admin panel | `etc/adminhtml/` |
| `webapi_rest` | `/rest/` URL path | REST API | `etc/webapi_rest/` |
| `webapi_soap` | `/soap/` URL path | SOAP API | `etc/webapi_soap/` |
| `graphql` | `/graphql` URL path | GraphQL API | `etc/graphql/` |
| `crontab` | CLI / cron daemon | Background job execution | `etc/crontab/` |
| `global` | All areas | Base config, always loaded | `etc/` (root) |

> **Note:** REST, SOAP, and GraphQL do not have separate PHP entry-point files in `pub/`. All requests go through `pub/index.php` (or `pub/rest.php` in older setups); the area is determined from the URL path via nginx/Apache rewrite rules and the framework's area detector.

**Area-specific config files that can be scoped:**

```
<module>/etc/
    di.xml                  <-- global (loaded in ALL areas)
    frontend/
        di.xml              <-- only frontend
        routes.xml          <-- only frontend
        events.xml          <-- only frontend
        sections.xml        <-- customer data section invalidation (frontend only)
        page_types.xml      <-- page type handles (frontend only)
    adminhtml/
        di.xml              <-- only adminhtml
        routes.xml          <-- only adminhtml
        menu.xml            <-- admin menu
        system.xml          <-- system config fields
    webapi_rest/
        di.xml              <-- only REST API
    webapi_soap/
        di.xml              <-- only SOAP API
    graphql/
        di.xml              <-- only GraphQL
    crontab/
        di.xml              <-- only cron area (used for area-scoped DI)
        events.xml          <-- only cron area
```

> **Layout XML files do NOT live in `etc/frontend/layout/`.** Layout files are in `view/frontend/layout/` (or `view/adminhtml/layout/`). The `etc/` tree contains only configuration XML — DI, routes, events, etc.

> **Exam focus:**
> - `etc/di.xml` (global) is merged **first**, then the area-specific `di.xml` is merged **on top**. Area-specific definitions win over global.
> - `events.xml` at global level fires in ALL areas. Use area-scoped `events.xml` to restrict observer execution to a specific context.
> - `webapi.xml` lives at `etc/webapi.xml` (global) — not area-scoped. ACL definitions within it are global.

---

### How Routers Differ Per Area

Routers are area-dependent. This is a critical architectural concept.

```
Area: frontend
Router stack (in priority order):
  1. robots.txt router         (handles /robots.txt)
  2. urlrewrite router         (handles URL rewrites -> catalog/CMS)
  3. standard router           (Vendor/Module/Controller/Action.php)
  4. cms router                (CMS pages)
  5. default router            (404 noRoute)

Area: adminhtml
Router stack:
  1. admin standard router     (admin/module/controller/action)
  2. default router            (admin 404)

Area: webapi_rest
Router stack:
  1. REST router               (matches /rest/V1/<endpoint>)
  -> Dispatches to service contracts, NOT controllers

Area: webapi_soap
Router stack:
  1. SOAP router               (matches /soap?wsdl=...)
  -> Dispatches to service contracts via WSDL

Area: graphql
Router stack:
  1. GraphQL router            (single endpoint /graphql)
  -> Resolves via resolver classes, NOT traditional controllers

Area: crontab
  No HTTP router              (no web requests)
  -> Jobs declared in etc/crontab.xml
  -> Area-scoped DI in etc/crontab/di.xml (only used by modules that need it)
```

**The Standard Router (frontend/adminhtml):**

```php
// Route format: <area frontName>/<module>/<controller>/<action>
// frontend: catalog/product/view/id/1
//   -> frontName "catalog" -> Magento_Catalog
//   -> Controller: Magento\Catalog\Controller\Product\View

// adminhtml: admin/catalog_product/index
//   -> adminhtml frontName = configured admin path
//   -> Controller: Magento\Catalog\Controller\Adminhtml\Product\Index
```

> **Exam focus:**
> - REST and GraphQL areas do **not** use the standard MVC router. They route to **service contracts** (interfaces).
> - The admin router uses a **separate `frontName`** (configurable, default: `admin`) to prevent route conflicts with frontend.
> - `crontab` area has **no router at all** — it's a CLI execution context.
> - GraphQL uses a **single endpoint** (`/graphql`) — all query routing is handled by resolver mapping, not URL-based routing.

---

### Area-Specific Configuration Loading

Understanding the **merge sequence** is critical:

```
Step 1: Load global etc/di.xml from ALL modules (in sequence order)
Step 2: Merge area-specific etc/<area>/di.xml ON TOP of global
Step 3: Compile to generated/code/ (in production mode)

This means:
- A preference declared in etc/frontend/di.xml ONLY applies in frontend area
- A preference declared in etc/di.xml applies everywhere UNLESS overridden
  by an area-specific preference
```

**Practical example — area scoping a preference:**

```xml
<!-- etc/di.xml (global) — applies to all areas -->
<preference for="Magento\Catalog\Api\ProductRepositoryInterface"
            type="Vendor\Module\Model\ProductRepository"/>

<!-- etc/frontend/di.xml — only in frontend area -->
<preference for="Magento\Catalog\Block\Product\View"
            type="Vendor\Module\Block\Product\View"/>

<!-- etc/webapi_rest/di.xml — only in REST API area -->
<type name="Magento\Framework\Webapi\ServiceInputProcessor">
    <plugin name="vendor_module_input_processor"
            type="Vendor\Module\Plugin\InputProcessor"/>
</type>
```

> **Exam focus:**
> - Placing a resource-heavy plugin in `etc/di.xml` (global) means it loads during **every** area including cron and REST calls. **Always scope to the minimum required area.**
> - Area-specific `di.xml` does NOT replace global `di.xml` — it **merges** on top. The global config is always the foundation.

---

## 4. DI Configuration & Area Scoping

### Global vs Area-Scoped di.xml

```
Configuration Load Order (most authoritative = last merged):
=====================================================
1. Magento framework etc/di.xml
2. All module etc/di.xml files (in sequence order)
3. All module etc/<current_area>/di.xml files (in sequence order)

For frontend request:
  Framework di.xml
  + All module global di.xml
  + All module frontend/di.xml   <-- wins

For REST request:
  Framework di.xml
  + All module global di.xml
  + All module webapi_rest/di.xml  <-- wins
```

**Why separate di.xml files are architecturally correct:**

| Reason | Detail |
|---|---|
| **Performance** | Avoids compiling unnecessary DI graph nodes for irrelevant areas |
| **Isolation** | A plugin that modifies a storefront block should never run during a REST call |
| **Clarity** | Reading `etc/frontend/di.xml` immediately tells a developer this config is frontend-only |
| **Conflict avoidance** | Area-specific plugins won't interfere with other areas' execution |

---

### Hands-On: module-catalog/etc/ Walkthrough

Browse `vendor/magento/module-catalog/etc/` and understand the structure:

```
vendor/magento/module-catalog/etc/
|
+-- module.xml                  (module declaration + sequence)
+-- di.xml                      (global DI — repositories, models, preferences)
+-- events.xml                  (global events — fires in ALL areas)
+-- config.xml                  (default system config values)
+-- acl.xml                     (ACL resource tree)
+-- indexer.xml                 (indexer declarations)
+-- mview.xml                   (materialized view config for indexers)
+-- crontab.xml                 (cron job definitions — NOT cron_groups.xml)
+-- webapi.xml                  (REST/SOAP endpoint declarations)
+-- extension_attributes.xml    (extension attribute declarations)
+-- catalog_attributes.xml      (EAV attribute group assignments)
+-- product_types.xml           (product type declarations)
|
+-- frontend/
|   +-- di.xml                  (frontend-only: layout processors, block plugins)
|   +-- routes.xml              (frontend route: frontName="catalog")
|   +-- events.xml              (frontend-only events)
|   +-- sections.xml            (customer data section invalidation)
|   +-- page_types.xml          (page type handles)
|
+-- adminhtml/
|   +-- di.xml                  (adminhtml-only: grid processors, admin plugins)
|   +-- routes.xml              (adminhtml route: frontName="catalog")
|   +-- events.xml              (adminhtml-only events)
|   +-- menu.xml                (admin navigation menu items)
|   +-- system.xml              (system configuration fields: Catalog section)
|
+-- webapi_rest/
|   +-- di.xml                  (REST-specific: response builders, interceptors)
|
+-- webapi_soap/
    +-- di.xml                  (SOAP-specific config)
```

> **Note:** `cron_groups.xml` is NOT a module-catalog file. Cron group definitions live in `Magento_Cron/etc/cron_groups.xml` (the cron infrastructure module). Each module that has cron jobs declares them in its own `etc/crontab.xml`.

> **Note:** Layout XML files are NOT under `etc/`. They live in `view/frontend/layout/` and `view/adminhtml/layout/`. The `etc/` tree is exclusively for configuration XML (DI, routes, events, etc.).

> **Note:** module-catalog does NOT have an `etc/crontab/` area subdirectory because it doesn't need cron-area-scoped DI. Only modules with cron-specific DI overrides have `etc/crontab/di.xml`.

**Key observations from module-catalog:**

1. **`etc/di.xml` (global)** contains `ProductRepository`, `CategoryRepository` preferences — these are needed everywhere (frontend, REST, cron, admin).

2. **`etc/frontend/di.xml`** contains plugins on layout processors and block arguments — these should NEVER load in REST context (no blocks exist there).

3. **`etc/adminhtml/di.xml`** contains admin grid data providers and admin-only UI component configurations.

4. **`etc/frontend/routes.xml` vs `etc/adminhtml/routes.xml`** — both declare `frontName="catalog"` but in different router contexts, so there is **no conflict**.

```xml
<!-- etc/frontend/routes.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:App/etc/routes.xsd">
    <router id="standard">
        <route id="catalog" frontName="catalog">
            <module name="Magento_Catalog"/>
        </route>
    </router>
</config>

<!-- etc/adminhtml/routes.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:App/etc/routes.xsd">
    <router id="admin">
        <route id="catalog" frontName="catalog">
            <module name="Magento_Catalog" before="Magento_Backend"/>
        </route>
    </router>
</config>
```

> **Exam focus:**
> - The **same `frontName`** can exist in both `frontend` and `adminhtml` routes.xml without conflict because they register to **different router IDs** (`standard` vs `admin`).
> - If you need a plugin that only runs during catalog page rendering, it belongs in `etc/frontend/di.xml`, NOT `etc/di.xml`.
> - `system.xml` is always in `etc/adminhtml/` — it only makes sense there. It would be architecturally wrong in `etc/frontend/`.

---

## 5. Tricky Concepts — Exam Traps

### Sequence Affects Plugin & Observer Ordering

This is one of the highest-value exam topics. Understand it deeply.

**The mechanism:**

```
When two plugins target the same method with equal sortOrder,
the module that is loaded LATER (higher in the sequence-resolved order)
will have its plugin executed in the OUTER position (wraps the other).

Plugin execution model (around plugins):
  [Outermost plugin] before
    [Next plugin] before
      [Original method]
    [Next plugin] after
  [Outermost plugin] after

Module loaded LATER = plugin is OUTER (executes first-before, last-after)
```

**Concrete example:**

```xml
<!-- Vendor_A/etc/module.xml — loads BEFORE Vendor_B -->
<module name="Vendor_A">
    <sequence>
        <module name="Magento_Catalog"/>
    </sequence>
</module>

<!-- Vendor_B/etc/module.xml — loads AFTER Vendor_A -->
<module name="Vendor_B">
    <sequence>
        <module name="Magento_Catalog"/>
        <module name="Vendor_A"/>    <!-- B comes after A -->
    </sequence>
</module>
```

```xml
<!-- Vendor_A/etc/di.xml -->
<type name="Magento\Catalog\Model\Product">
    <plugin name="vendor_a_plugin"
            type="Vendor\A\Plugin\ProductPlugin"
            sortOrder="10"/>
</type>

<!-- Vendor_B/etc/di.xml -->
<type name="Magento\Catalog\Model\Product">
    <plugin name="vendor_b_plugin"
            type="Vendor\B\Plugin\ProductPlugin"
            sortOrder="10"/>  <!-- Same sortOrder! -->
</type>
```

```
Execution order (equal sortOrder, B loads after A):
  vendor_b_plugin::beforeMethod()     <-- B is outer (loaded later)
    vendor_a_plugin::beforeMethod()
      Original method
    vendor_a_plugin::afterMethod()
  vendor_b_plugin::afterMethod()      <-- B is outer
```

> **Exam focus:**
> - Equal `sortOrder` + later sequence = **outer plugin position**.
> - To guarantee a plugin runs outermost, either: (a) declare a higher sequence than competing modules, or (b) use a higher `sortOrder` number.
> - `sortOrder` is the **primary** sort key; sequence is the **tiebreaker** when sortOrder values are equal.
> - The same logic applies to **observers** — equal priority observers fire in module load order.

---

### Circular Dependencies

```
Bad (circular sequence):
  Vendor_A sequences after Vendor_B
  Vendor_B sequences after Vendor_A
  --> ERROR: Cannot resolve load order (infinite loop)

Magento detects this during module loading (including setup:di:compile) and throws:
  \LogicException:
  "Circular sequence reference from 'Vendor_B' to 'Vendor_A'."
  (thrown in Magento\Framework\Module\ModuleList\Loader)
```

> **Exam focus:**
> - Circular sequence dependencies cause a **`\LogicException`** (not a `LocalizedException`). The error message format is `"Circular sequence reference from '<parent>' to '<child>'."`.
> - The error is thrown in `Magento\Framework\Module\ModuleList\Loader` during module list loading — this occurs on any request and during `setup:di:compile`, not exclusively at compile time.
> - The solution is to **remove one of the sequence declarations** or extract shared logic into a third module that both depend on.
> - Circular `composer.json` `require` dependencies are a **Composer error** and prevent installation entirely.

---

## 6. AD0-E722 Exam Guide Flags

Review the official exam guide domains against this plan and flag gaps:

| Exam Domain | Coverage in This Plan | Gap? |
|---|---|---|
| 1. Architecture (33%) | Module system, areas, DI | Partly — Service contracts, API design covered in later sessions |
| 2. Customization (16%) | Plugin/observer ordering | Partly — Full customization patterns in later sessions |
| 3. Working with Databases (18%) | Not yet covered | **FLAG: EAV, declarative schema, repositories** |
| 4. Using the Entity Attribute Value (EAV) | Not yet covered | **FLAG: Dedicated session needed** |
| 5. Developing with Adminhtml (11%) | Area overview | **FLAG: Grid/Form UI components not yet covered** |
| 6. Business Logic (22%) | Not yet covered | **FLAG: Service contracts, pricing, inventory** |

**Topics from the official guide outside this week's plan (flag for scheduling):**

```
- Service contracts and API interfaces
- Extension attributes (declaration + usage)
- EAV vs flat table design decisions
- Declarative schema (db_schema.xml)
- Repository pattern and SearchCriteria
- Payment method architecture
- Indexer/Mview system
- Cache types and cache tags
- Layout XML system (handles, blocks, containers)
- UI Component system
- JavaScript/RequireJS module system
- Import/Export framework
```

---

## 7. Architectural Decision-Making Framework

Use this mental checklist when facing scenario questions on the exam:

```
SCENARIO QUESTION FRAMEWORK
============================

1. SCOPE — What is the smallest correct scope?
   - Global di.xml vs area-specific di.xml?
   - Observer vs plugin for this use case?
   - Virtual type vs real class?

2. COUPLING — How tightly does this couple to core?
   - Class rewrite (tight, breaks on upgrade) vs plugin (loose, upgrade-safe)
   - Direct instantiation vs constructor injection

3. RESPONSIBILITY — Does this belong here?
   - Business logic in a controller? (Wrong — use service layer)
   - SQL in a block? (Wrong — use repository/model)
   - Presentation logic in a model? (Wrong — use view model/block)

4. ORDERING — Does sequence and sortOrder matter?
   - If multiple modules touch the same extension point,
     who should win? What is the correct ordering declaration?

5. AREA — Is this executing in the right context?
   - Should this plugin fire during REST calls? If not, scope it.
   - Is this observer relevant in cron? If not, scope it.
```

**Common exam distractors:**

| Distractor | Why It's Wrong | Correct Approach |
|---|---|---|
| Use class rewrite to modify core behavior | Breaks on upgrade, prevents other extensions from modifying same class | Use a plugin (interceptor) |
| Put all config in global `di.xml` | Loads unnecessary config in every area | Scope to minimum required area |
| Use `ObjectManager` directly | Bypasses DI, untestable, upgrade-unsafe | Use constructor injection |
| Declare sequence without `require` | Only safe if module is genuinely optional | Add `composer.json` require if module MUST exist |
| Copy-paste core template to override | Brittle to upstream changes | Extend and use layout XML to replace only the changed block |

---

## Quick-Reference Checklist

### Module Lifecycle

- [ ] `registration.php` uses `ComponentRegistrar::register()` with type constant (`MODULE`, `THEME`, etc.)
- [ ] `registration.php` is executed via `composer.json` `autoload.files` entry
- [ ] `module.xml` declares module name; `setup_version` is removed from modern core modules (replaced by declarative schema)
- [ ] `<sequence>` controls **load order only** — does NOT enforce installation dependency
- [ ] `composer.json` `require` is the **hard dependency** mechanism (Composer-enforced)
- [ ] `"type": "magento2-module"` in composer.json is required for correct deployment
- [ ] Module name must be consistent across `registration.php`, `module.xml`, and `composer.json`

### Sequence Dependencies

- [ ] Sequence creates a topologically-sorted module load order (DAG)
- [ ] Later-loaded modules' XML config **overwrites** earlier modules' config on conflict
- [ ] Equal `sortOrder` plugins: sequence-later module's plugin is the **outer** plugin
- [ ] Equal priority observers: sequence-later module's observer fires **after**
- [ ] `sortOrder` is the primary sort key; sequence is the tiebreaker when sortOrder is equal
- [ ] Circular sequence dependencies throw `\LogicException` ("Circular sequence reference from '...' to '...'"), not LocalizedException
- [ ] Circular sequence errors occur at module load time (any request + di:compile), not exclusively at compile time
- [ ] Sequence is transitive (A after B after C = A loads after C)

### Area Codes

- [ ] Six runtime areas: `frontend`, `adminhtml`, `webapi_rest`, `webapi_soap`, `graphql`, `crontab`
- [ ] `global` is not an area code — it refers to `etc/` root config loaded in all areas
- [ ] Area-specific configs live in `etc/<area>/` subdirectories
- [ ] Global `etc/di.xml` loads first; area-specific `etc/<area>/di.xml` merges on top (area wins)
- [ ] `frontend` uses standard router + urlrewrite router + CMS router
- [ ] `adminhtml` uses admin router with separate configurable `frontName`
- [ ] `webapi_rest` and `webapi_soap` route to **service contracts**, not MVC controllers
- [ ] `graphql` uses a **single endpoint** (`/graphql`), routing via resolver classes
- [ ] `crontab` has **no HTTP router** — CLI/daemon execution context only
- [ ] Events.xml at `etc/events.xml` fires in ALL areas; `etc/frontend/events.xml` fires only in frontend
- [ ] Layout XML files live in `view/frontend/layout/` — NOT in `etc/frontend/`

### DI Configuration & Area Scoping

- [ ] Area-specific `di.xml` merges on top of global — never replaces it
- [ ] Plugins in global `di.xml` execute in every area including REST and cron — always scope
- [ ] Same `frontName` can exist in both frontend and adminhtml `routes.xml` without conflict (different router IDs)
- [ ] `system.xml` belongs only in `etc/adminhtml/` — architecturally wrong elsewhere
- [ ] `webapi.xml` is global (not area-scoped)
- [ ] `menu.xml` belongs only in `etc/adminhtml/`

### module-catalog/etc/ Structure

- [ ] Global `di.xml` holds ProductRepository, CategoryRepository — needed everywhere
- [ ] `etc/frontend/di.xml` holds block/layout plugins — should never load in REST
- [ ] `etc/adminhtml/di.xml` holds grid data providers and admin-only UI config
- [ ] `etc/adminhtml/system.xml` declares Catalog section in System Configuration
- [ ] `etc/frontend/routes.xml` and `etc/adminhtml/routes.xml` both use `frontName="catalog"` with different router IDs
- [ ] `etc/crontab.xml` declares catalog cron jobs (NOT `cron_groups.xml`)
- [ ] `etc/webapi_soap/di.xml` exists alongside `etc/webapi_rest/di.xml`
- [ ] module-catalog has NO `etc/crontab/` area subdirectory

### Architectural Decision Principles

- [ ] Prefer plugins over class rewrites (upgrade-safe, composable)
- [ ] Prefer constructor injection over ObjectManager direct use
- [ ] Scope DI config to minimum required area for performance and isolation
- [ ] Business logic belongs in service layer (models/service classes), not controllers or blocks
- [ ] Use service contracts (interfaces) for cross-module dependencies
- [ ] Extract shared logic to a separate module to resolve circular dependencies
- [ ] When two answers both technically work, choose the one with lower coupling and correct area scope
