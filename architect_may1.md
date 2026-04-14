# Magento 2 Certified Professional Developer — Practice Test #3 Study Notes
## Configure & Deploy: Deep-Dive Reference

---

## Table of Contents

1. [Section Overview & Exam Weight](#1-section-overview--exam-weight)
2. [app:config:dump — Deep Dive](#2-appconfigdump--deep-dive)
3. [System Configuration — Structure & Flow](#3-system-configuration--structure--flow)
4. [setup:di:compile — Deep Dive](#4-setupdicompile--deep-dive)
5. [Generated Interceptors — Anatomy](#5-generated-interceptors--anatomy)
6. [Cache Management — cache:status](#6-cache-management--cachestatus)
7. [Indexer Management — indexer:status](#7-indexer-management--indexerstatus)
8. [Config Dump Diff Workflow — Lab Walkthrough](#8-config-dump-diff-workflow--lab-walkthrough)
9. [Deployment Pipeline & Config Phases](#9-deployment-pipeline--config-phases)
10. [Section 2 Review — Key Concepts Refresher](#10-section-2-review--key-concepts-refresher)
11. [Common Wrong-Answer Traps](#11-common-wrong-answer-traps)
12. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Section Overview & Exam Weight

| Exam Section | Topic | Approx. Weight |
|---|---|---|
| Section 2 | Request Flow Processing | ~18% |
| Section 3 | Customizing the Magento UI | ~10% |
| Section 3 (Deploy) | Configure & Deploy | ~13% |

> **Note:** The exam uses "Section 3: Configure & Deploy" to cover deployment modes, DI compilation, config management, caching, and indexing. These notes focus on **hands-on CLI commands** and their underlying architecture — the most commonly tested surface area.

- **Exam focus:** Know the exact CLI commands, their flags, their side effects, and *which files they read/write*.
- **Exam focus:** Know the difference between **environment-specific**, **system-specific**, and **sensitive** configuration values and where each is stored.

---

## 2. app:config:dump — Deep Dive

### 2.1 What It Does

`bin/magento app:config:dump` exports the current application configuration from the **database** and **environment** into flat PHP config files under `app/etc/`. This is the cornerstone of Magento's **config propagation** strategy across environments.

```bash
# Basic dump — exports ALL config types
bin/magento app:config:dump

# Dump only specific config types (Magento 2.2+)
bin/magento app:config:dump scopes themes
bin/magento app:config:dump system
```

### 2.2 Output Files

| File | Contents | Version Controlled? |
|---|---|---|
| `app/etc/config.php` | Scopes, themes, modules list, system (non-sensitive) | **YES** — commit this |
| `app/etc/env.php` | DB credentials, cache backends, sensitive values, deployment mode | **NO** — never commit |

### 2.3 Config Types Exported

```
app:config:dump exports these "config types":
+------------------+----------------------------------------+
| Config Type      | Destination                            |
+------------------+----------------------------------------+
| scopes           | app/etc/config.php -> 'scopes'         |
| themes           | app/etc/config.php -> 'themes'         |
| system           | app/etc/config.php -> 'system'         |
| i18n             | app/etc/config.php -> 'i18n'           |
+------------------+----------------------------------------+
```

### 2.4 Anatomy of `config.php` After Dump

```php
<?php
return [
    'modules' => [
        'Magento_Store'     => 1,
        'Magento_Directory' => 1,
        'Magento_Config'    => 1,
        // ... all enabled/disabled modules
    ],
    'scopes' => [
        'websites' => [
            'base' => [
                'website_id'   => '1',
                'code'         => 'base',
                'name'         => 'Main Website',
                'sort_order'   => '0',
                'default_group_id' => '1',
                'is_default'   => '1',
            ],
        ],
        'groups' => [ /* store groups */ ],
        'stores' => [
            'default' => [
                'store_id'   => '1',
                'code'       => 'default',
                'website_id' => '1',
                'group_id'   => '1',
                'name'       => 'Default Store View',
                'sort_order' => '0',
                'is_active'  => '1',
            ],
        ],
    ],
    'themes' => [
        'frontend/Magento/luma' => [
            'parent_id'   => 'Magento/blank',
            'theme_path'  => 'Magento/luma',
            'theme_title' => 'Magento Luma',
            'is_featured' => '1',
            'area'        => 'frontend',
            'type'        => '0',
            'code'        => 'Magento/luma',
        ],
    ],
    'system' => [
        'default' => [
            'web' => [
                'unsecure' => [
                    'base_url' => 'http://magento.local/',
                ],
                'secure' => [
                    'base_url' => 'https://magento.local/',
                ],
            ],
            'general' => [
                'locale' => [
                    'code' => 'en_US',
                ],
            ],
        ],
    ],
];
```

- **Exam focus:** `config.php` stores the **module list** — this is what Magento reads to know which modules are enabled/disabled. `app:config:dump` **overwrites** this file entirely.
- **Exam focus:** Values flagged as `<backend_model>Magento\Config\Model\Config\Backend\Encrypted</backend_model>` in `system.xml` are **NOT** exported to `config.php`; they remain encrypted in the database or must be set via `env.php`.
- **Exam focus:** After `app:config:dump`, admin users **cannot** modify the exported values through the Admin UI — fields become read-only (locked). This is by design for environment parity.

### 2.5 Sensitive vs. Environment-Specific vs. System Configuration

```
Configuration Classification:
+------------------------+------------------+---------------------+
| Type                   | Stored In        | Locked After Dump?  |
+------------------------+------------------+---------------------+
| System (non-sensitive) | config.php       | YES - read-only UI  |
| Environment-specific   | env.php          | YES                 |
| Sensitive              | env.php only     | YES (never dumped)  |
+------------------------+------------------+---------------------+
```

To set sensitive/environment config without the Admin:

```bash
# Set a config value in env.php (bypasses Admin UI lock)
bin/magento config:set --lock-env web/unsecure/base_url "http://staging.local/"

# Set sensitive value (encrypted, stored in env.php)
bin/magento config:set --lock-env payment/authorizenet_acceptjs/login "my_api_key"

# Show current config value (reads from all sources)
bin/magento config:show web/unsecure/base_url

# Show for a specific scope
bin/magento config:show --scope=websites --scope-code=base web/unsecure/base_url
```

---

## 3. System Configuration — Structure & Flow

### 3.1 Configuration Read Priority (Highest Wins)

```
Priority Stack (top = highest priority):
+--------------------------------------------+
| 1. env.php (--lock-env values)             |  <-- Overrides everything
+--------------------------------------------+
| 2. config.php (app:config:dump output)     |  <-- Overrides DB
+--------------------------------------------+
| 3. Database (core_config_data table)       |  <-- Admin UI writes here
+--------------------------------------------+
| 4. system.xml <value> defaults             |  <-- Fallback defaults
+--------------------------------------------+
```

### 3.2 `core_config_data` Table Structure

```sql
SELECT * FROM core_config_data WHERE path LIKE 'web/unsecure%';

-- Result structure:
-- config_id | scope   | scope_id | path                    | value
-- 1         | default | 0        | web/unsecure/base_url   | http://magento.local/
-- 2         | websites | 1       | web/unsecure/base_url   | http://site2.local/
```

- **Exam focus:** `scope` values are `default`, `websites`, `stores`. Scope ID `0` always means the **default** scope.
- **Exam focus:** Store-level config overrides website-level, which overrides default-level.

### 3.3 `system.xml` — Config Field Declaration

```xml
<!-- app/code/Vendor/Module/etc/adminhtml/system.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Config:etc/system_file.xsd">
    <system>
        <tab id="vendor" translate="label" sortOrder="999">
            <label>Vendor</label>
        </tab>
        <section id="vendor_settings" translate="label" sortOrder="10"
                 showInDefault="1" showInWebsite="1" showInStore="1">
            <label>Vendor Settings</label>
            <tab>vendor</tab>
            <resource>Vendor_Module::config</resource>
            <group id="general" translate="label" sortOrder="10"
                   showInDefault="1" showInWebsite="1" showInStore="1">
                <label>General</label>
                <field id="api_key" translate="label" type="text" sortOrder="10"
                       showInDefault="1" showInWebsite="0" showInStore="0">
                    <label>API Key</label>
                    <!-- Marks as sensitive - won't be exported by app:config:dump -->
                    <backend_model>Magento\Config\Model\Config\Backend\Encrypted</backend_model>
                    <config_path>vendor_settings/general/api_key</config_path>
                </field>
                <field id="enable" translate="label" type="select" sortOrder="20"
                       showInDefault="1" showInWebsite="1" showInStore="1">
                    <label>Enable</label>
                    <source_model>Magento\Config\Model\Config\Source\Yesno</source_model>
                </field>
            </group>
        </section>
    </system>
</config>
```

- **Exam focus:** The config path in `core_config_data` is `section/group/field` — e.g., `vendor_settings/general/api_key`.
- **Exam focus:** `showInDefault`, `showInWebsite`, `showInStore` control which scope levels the field appears on in Admin UI — NOT which scopes store the value.

---

## 4. setup:di:compile — Deep Dive

### 4.1 What It Does

`bin/magento setup:di:compile` is the **Dependency Injection compilation** step. It:

1. Scans all PHP classes in the codebase
2. Resolves constructor injection chains
3. Generates **Interceptors** (plugins), **Factories**, **Proxies**, and **Extension Attribute** classes
4. Writes a serialized DI configuration to `generated/metadata/`
5. Places generated PHP class files in `generated/code/`

```bash
# Run DI compilation
bin/magento setup:di:compile

# Expected output:
# Compilation was started.
# Interception cache generation... 1/7 [==>-------------------------]  14%
# Resolvability of factors arguments... 2/7 [======>-----------------]  28%
# Injection of arguments... 3/7 [==========>-----------------]  42%
# Class Scanner... 4/7 [=============>--------------]  57%
# Proxy classes generation... 5/7 [=================>----------]  71%
# Repository class generation... 6/7 [=====================>------]  85%
# Plugin list... 7/7 [============================] 100%
# Generated code - 347 files
# Generated metadata - 12 files
```

### 4.2 Generated Directory Structure

```
generated/
+-- code/
|   +-- Magento/
|   |   +-- Catalog/
|   |   |   +-- Model/
|   |   |   |   +-- Product/
|   |   |   |   |   +-- Interceptor.php       <-- Plugin proxy
|   |   |   +-- Api/
|   |   |       +-- ProductRepositoryFactory.php  <-- Factory
|   |   +-- Customer/
|   |       +-- Model/
|   |           +-- ResourceModel/
|   |               +-- Customer/
|   |                   +-- Collection/
|   |                       +-- Interceptor.php
+-- metadata/
    +-- global~Magento\Catalog\Model\Product.ser
    +-- ...compiled DI config files (serialized)...
```

### 4.3 When You MUST Re-run setup:di:compile

- After adding or modifying a **plugin** (`di.xml` `<plugin>`)
- After adding a new **constructor dependency**
- After adding a **preference** override
- After adding or modifying **virtual types**
- After adding **factories** or **proxies** via `di.xml`
- After any module is **enabled or disabled**
- Before deploying to **production mode**

- **Exam focus:** In **developer mode**, Magento generates interceptors and factories **on-the-fly** at runtime — `setup:di:compile` is NOT required. In **production mode**, it is **mandatory** — missing it causes fatal errors.
- **Exam focus:** `setup:di:compile` does NOT deploy static content. That is a separate step: `setup:static-content:deploy`.

### 4.4 DI Compilation Output — `generated/metadata/`

```
generated/metadata/ contains serialized PHP arrays, e.g.:

global~Magento\Catalog\Model\Product.ser:
  - Constructor argument definitions
  - Plugin interception chain
  - Virtual type resolutions
  - Proxy/factory references
```

---

## 5. Generated Interceptors — Anatomy

### 5.1 What an Interceptor Is

An **Interceptor** is a generated class that wraps the original class and implements the **plugin (interception) mechanism**. It extends the original class and overrides every public method to execute `before`, `around`, and `after` plugin methods.

### 5.2 Locating an Interceptor

```bash
# After setup:di:compile, find interceptors:
find generated/code -name "Interceptor.php" | head -20

# Example paths:
# generated/code/Magento/Catalog/Model/Product/Interceptor.php
# generated/code/Magento/Checkout/Model/Session/Interceptor.php
# generated/code/Magento/Customer/Model/Customer/Interceptor.php
```

### 5.3 Interceptor Class Structure

```php
<?php
// generated/code/Magento/Catalog/Model/Product/Interceptor.php
// AUTO-GENERATED FILE. DO NOT EDIT.

namespace Magento\Catalog\Model\Product;

/**
 * Interceptor class for @see \Magento\Catalog\Model\Product
 */
class Interceptor extends \Magento\Catalog\Model\Product
    implements \Magento\Framework\Interception\InterceptorInterface
{
    use \Magento\Framework\Interception\Interceptor;

    public function __construct(
        \Magento\Catalog\Model\Product\Context $context,
        \Magento\Framework\Registry $registry,
        // ... all original constructor args ...
        array $data = []
    ) {
        parent::__construct(
            $context,
            $registry,
            // ...
            $data
        );
        $this->___init();  // <-- registers the plugin chain
    }

    /**
     * {@inheritdoc}
     */
    public function getName() : ?string
    {
        $pluginInfo = $this->pluginList->getNext(
            $this->subjectType, 'getName'
        );

        // If no plugins, call original
        if (!$pluginInfo) {
            return parent::getName();
        }

        // Otherwise, dispatch the plugin chain
        return $this->___callPlugins('getName', func_get_args(), $pluginInfo);
    }

    // Every public method gets this same interception wrapper...
}
```

- **Exam focus:** Interceptors extend the **original class** — they are transparent to code that type-hints the original class. This is why plugins work without changing callers.
- **Exam focus:** **Private methods cannot be intercepted** — only `public` methods. `protected` methods also cannot be intercepted by plugins.
- **Exam focus:** The `___init()` method call in the constructor registers the subject with the `PluginList` — this is what allows runtime plugin resolution.
- **Exam focus:** When you configure a `<preference>` that itself has plugins, the generated Interceptor extends the **preference class**, not the original interface target. This is a subtle but tested distinction.

### 5.4 Plugin Execution Order

```
Method Call Flow:
+-------------------+
| Original Caller   |
+-------------------+
         |
         v
+-------------------+
| Interceptor       |  <-- Generated class
| ___callPlugins()  |
+-------------------+
         |
    +----+----+
    |         |
    v         v
+--------+ +--------+
| before | | around |  (around wraps the next callable)
| plugin | | plugin |
+--------+ +--------+
                |
                v
         +------------+
         | Original   |  (or next around's $proceed)
         | Method     |
         +------------+
                |
                v
         +--------+
         | after  |
         | plugin |
         +--------+
```

**Plugin execution order for multiple plugins on same method:**

```
sortOrder (ascending) -> before plugins fire first
sortOrder (ascending) -> around plugins wrap (outermost first)
sortOrder (DESCENDING) -> after plugins fire last-in, first-out
```

- **Exam focus:** `after` plugins fire in **reverse sort order** compared to `before` plugins. This is a classic trick question.

---

## 6. Cache Management — cache:status

### 6.1 Cache Status Command

```bash
bin/magento cache:status

# Output:
#                         config: 1
#                         layout: 1
#                     block_html: 1
#                   collections: 1
#                    reflection: 1
#                db_ddl: 1
#             compiled_config: 1
#          webhooks_response: 1
#                   eav: 1
#         customer_notification: 1
#         config_integration: 1
#   config_integration_api: 1
#               full_page: 1
#         config_webservice: 1
#              translate: 1
#                  vertex: 1
```

**Value meanings:** `1` = enabled, `0` = disabled

### 6.2 All Cache Types and Their Purpose

| Cache Type | Internal ID | What It Caches |
|---|---|---|
| Configuration | `config` | Merged XML config from all modules |
| Layouts | `layout` | XML layout files, layout handles |
| Blocks HTML output | `block_html` | Rendered block HTML |
| Collections Data | `collections` | DB collection query results |
| Reflection Data | `reflection` | PHP class reflection metadata |
| Database DDL operations | `db_ddl` | DB schema, table/column info |
| Compiled Config | `compiled_config` | DI compiled configuration |
| EAV types and attributes | `eav` | Entity-Attribute-Value metadata |
| Customer Notification | `customer_notification` | |
| Integrations Configuration | `config_integration` | OAuth integrations config |
| Integrations API config | `config_integration_api` | API integration settings |
| Page Cache | `full_page` | Full page cache (FPC) |
| Web Services Config | `config_webservice` | REST/SOAP API config |
| Translations | `translate` | i18n/l10n translation strings |

### 6.3 Cache Management Commands

```bash
# Enable all caches
bin/magento cache:enable

# Disable specific caches
bin/magento cache:disable block_html full_page

# Flush cache storage (removes ALL cached data, including non-Magento)
bin/magento cache:flush

# Clean Magento-tagged cache entries only (safe, preferred)
bin/magento cache:clean

# Clean specific cache types
bin/magento cache:clean config layout

# Enable specific caches
bin/magento cache:enable config block_html
```

- **Exam focus:** `cache:flush` vs `cache:clean`:
  - `cache:flush` — destroys the **entire cache storage** (Redis database flush, file cache directory wipe). Affects ALL applications sharing the cache backend.
  - `cache:clean` — only removes cache entries **tagged** by Magento. Safer in shared environments.
- **Exam focus:** After running `setup:di:compile`, you should run `cache:clean compiled_config` (or `cache:flush`) to ensure the new compiled config is used.
- **Exam focus:** The `full_page` cache type is Magento's **built-in FPC**. Varnish is a separate layer that does NOT appear in `cache:status` output.

### 6.4 Cache Backend Configuration (`env.php`)

```php
// app/etc/env.php
'cache' => [
    'frontend' => [
        'default' => [
            'backend' => 'Magento\\Framework\\Cache\\Backend\\Redis',
            'backend_options' => [
                'server'   => '127.0.0.1',
                'database' => '0',
                'port'     => '6379',
                'password' => '',
                'compress_data' => '1',
            ],
        ],
        'page_cache' => [
            'backend' => 'Magento\\Framework\\Cache\\Backend\\Redis',
            'backend_options' => [
                'server'   => '127.0.0.1',
                'database' => '1',  // Separate Redis DB for FPC
                'port'     => '6379',
            ],
        ],
    ],
],
```

---

## 7. Indexer Management — indexer:status

### 7.1 Indexer Status Command

```bash
bin/magento indexer:status

# Output:
# Design Config Grid:                        Ready
# Customer Grid:                             Ready
# Category Products:                         Reindex required
# Product Categories:                        Ready
# Catalog Rule Product:                      Ready
# Product Price:                             Reindex required
# Product EAV:                               Ready
# Stock:                                     Ready
# Inventory:                                 Ready
# Catalog Product Rule:                      Ready
# Catalog Search:                            Ready
```

### 7.2 Indexer Status Values

| Status | Meaning |
|---|---|
| **Ready** | Index is up-to-date, no reindex needed |
| **Reindex required** | Data has changed, index is stale |
| **Processing** | Currently being reindexed |
| **Scheduled** | Set to "Update by Schedule", pending MView changelog processing |
| **Suspended** | Indexer is suspended (manually or due to error) |

### 7.3 All Indexers and Purpose

| Indexer | ID | Purpose |
|---|---|---|
| Design Config Grid | `design_config_grid` | Admin design config grid |
| Customer Grid | `customer_grid` | Admin customer listing grid |
| Category Products | `catalog_category_product` | Products assigned to categories |
| Product Categories | `catalog_product_category` | Categories a product belongs to |
| Catalog Rule Product | `catalogrule_rule` | Catalog price rule application |
| Product Price | `catalog_product_price` | Final product prices (tier, special) |
| Product EAV | `catalog_product_attribute` | Product EAV attribute flat table |
| Stock | `cataloginventory_stock` | Stock status index |
| Inventory (MSI) | `inventory` | Multi-source inventory |
| Catalog Product Rule | `catalogrule_product` | Catalog rule-to-product mapping |
| Catalog Search | `catalogsearch_fulltext` | Elasticsearch/OpenSearch index |

### 7.4 Indexer Mode Commands

```bash
# Show all indexer modes (realtime or schedule)
bin/magento indexer:show-mode

# Output:
# Design Config Grid:                        Update on Save
# Customer Grid:                             Update by Schedule
# Category Products:                         Update by Schedule
# Product Price:                             Update by Schedule
# Catalog Search:                            Update by Schedule

# Set ALL indexers to Update by Schedule (recommended for production)
bin/magento indexer:set-mode schedule

# Set specific indexers to realtime
bin/magento indexer:set-mode realtime catalog_product_price

# Reindex all
bin/magento indexer:reindex

# Reindex specific indexers
bin/magento indexer:reindex catalog_product_price catalog_category_product

# Reset indexer (marks as "Reindex Required")
bin/magento indexer:reset

# Show indexer info
bin/magento indexer:info
```

- **Exam focus:** **Update on Save** (realtime) — reindex fires immediately when entity is saved. Causes Admin save operations to be **slow** on large catalogs.
- **Exam focus:** **Update by Schedule** — uses **Materialized View (MView)** changelog tables. Changes are tracked in `mview_state` and `cl` (changelog) tables, processed by cron job `indexer_reindex_all_invalid`.
- **Exam focus:** `indexer:status` showing "Scheduled" means MView is tracking changes and waiting for the cron job to process them. This is **normal** for schedule mode — not an error.

### 7.5 MView Architecture (Update by Schedule)

```
Entity Save (e.g., Product saved in Admin)
         |
         v
+--------------------+
| DB Trigger fires   |  (created by MView setup)
+--------------------+
         |
         v
+-----------------------------+
| catalog_product_cl table   |  (changelog table)
| version_id | entity_id     |
+-----------------------------+
         |
         v (cron runs indexer_reindex_all_invalid)
+----------------------------------+
| Mview processes changelog rows   |
| Runs partial reindex on changed  |
| entity IDs only                  |
+----------------------------------+
         |
         v
+------------------+
| Index table      |
| updated for      |
| changed entities |
+------------------+
```

---

## 8. Config Dump Diff Workflow — Lab Walkthrough

### 8.1 Step-by-Step Lab Procedure

```bash
# --- STEP 1: Initial dump ---
bin/magento app:config:dump

# Capture the current state
cp app/etc/config.php app/etc/config.php.before

# --- STEP 2: Inspect the output ---
# Look at system section
grep -A 20 "'system'" app/etc/config.php

# Count total config keys
grep -c "=>" app/etc/config.php

# --- STEP 3: Modify a system config value via Admin OR CLI ---
# Via CLI (safer, no cache issues):
bin/magento config:set general/locale/timezone "America/Chicago"

# Verify it's in the database now:
mysql -u root -p magento -e \
  "SELECT * FROM core_config_data WHERE path='general/locale/timezone';"

# --- STEP 4: Dump again ---
bin/magento app:config:dump

# --- STEP 5: Compare the diff ---
diff app/etc/config.php.before app/etc/config.php

# Expected diff output (new value appears):
# >             'general' => [
# >                 'locale' => [
# >                     'timezone' => 'America/Chicago',
# >                 ],
# >             ],
```

### 8.2 What to Look For in the Diff

```
Key observations from a config:dump diff:
+-----------------------------------------------+-------------------------------------+
| What Changed                                  | Why It Matters                      |
+-----------------------------------------------+-------------------------------------+
| New key in 'system' section                   | Config value added at default scope |
| Key removed from 'system' section             | Value reset to XML default (deleted |
|                                               | from core_config_data)              |
| 'modules' section has 0 -> 1 or 1 -> 0       | Module enabled/disabled             |
| 'scopes' section changed                      | Store/website added or modified     |
| Key present BEFORE but not AFTER              | Value was encrypted (sensitive)     |
|                                               | or env.php-locked value             |
+-----------------------------------------------+-------------------------------------+
```

### 8.3 Verifying Lock Behavior Post-Dump

```bash
# After app:config:dump, the value in config.php LOCKS the Admin UI field.
# To verify:
# 1. Go to Admin > Stores > Configuration > General > Locale Options > Timezone
# 2. The field should show a lock icon and be non-editable

# To UNLOCK (remove from config.php, allow Admin editing again):
# You must manually edit config.php and remove the key,
# OR re-set via CLI without --lock-env to write back to DB only:
bin/magento config:set --no-lock general/locale/timezone "America/New_York"
# Note: --no-lock is NOT a real flag; you must remove from config.php manually
# The correct approach: edit config.php, delete the key, flush cache
bin/magento cache:clean config
```

---

## 9. Deployment Pipeline & Config Phases

### 9.1 Three Deployment Modes

| Mode | Command | Best For | Auto-Compiles? | Error Display |
|---|---|---|---|---|
| **Developer** | `bin/magento deploy:mode:set developer` | Local dev | NO (runtime gen) | Full stack trace |
| **Default** | (factory default) | Not recommended | Partial | Some errors |
| **Production** | `bin/magento deploy:mode:set production` | Live servers | YES (required) | Minimal (logged) |

```bash
# Check current mode
bin/magento deploy:mode:show

# Switch to production (auto-runs compile + static deploy)
bin/magento deploy:mode:set production

# Switch without running static deploy (faster, manual deployment)
bin/magento deploy:mode:set production --skip-compilation
```

- **Exam focus:** Switching to production mode automatically runs `setup:di:compile` and `setup:static-content:deploy` UNLESS `--skip-compilation` is used.
- **Exam focus:** In developer mode, `generated/code/` and `generated/metadata/` are written at runtime on first request. In production, they MUST exist before the first request.

### 9.2 Full Production Deployment Sequence

```bash
# Recommended production deployment order:

# 1. Enable maintenance mode
bin/magento maintenance:enable

# 2. Pull new code
git pull origin main

# 3. Install/update Composer dependencies
composer install --no-dev --optimize-autoloader

# 4. Apply DB schema upgrades
bin/magento setup:upgrade --keep-generated

# 5. Compile DI
bin/magento setup:di:compile

# 6. Deploy static content
bin/magento setup:static-content:deploy -f

# 7. Set production mode (if not already set)
bin/magento deploy:mode:set production --skip-compilation

# 8. Flush cache
bin/magento cache:flush

# 9. Reindex if needed
bin/magento indexer:reindex

# 10. Disable maintenance mode
bin/magento maintenance:disable
```

- **Exam focus:** `setup:upgrade --keep-generated` prevents deletion of the `generated/` directory during upgrade — important on zero-downtime deployments.
- **Exam focus:** `setup:upgrade` runs `setup:db:schema:upgrade` and `setup:db:data:upgrade` internally. It also applies `UpgradeSchema`, `UpgradeData`, `InstallSchema`, `InstallData` scripts (for pre-2.3 declarative schema modules).

### 9.3 Zero-Downtime Deployment Strategy

```
Zero-Downtime Pattern:
+------------------------------------------+
| Prepare on deploy server (no traffic)    |
| - composer install                       |
| - setup:di:compile                       |
| - setup:static-content:deploy            |
+------------------------------------------+
                   |
                   v (atomic symlink swap)
+------------------------------------------+
| Swap webroot symlink to new release dir  |
+------------------------------------------+
                   |
                   v
+------------------------------------------+
| Post-swap (on new code, with traffic)    |
| - setup:upgrade (DB migrations)          |
| - cache:flush                            |
| - indexer:reindex (if needed)            |
+------------------------------------------+
```

---

## 10. Section 2 Review — Key Concepts Refresher

### 10.1 Request Flow Summary

```
HTTP Request enters Magento:

Browser -> Nginx/Apache -> pub/index.php
                                |
                                v
                    Bootstrap::create()
                                |
                                v
                    App\Http (Front Controller)
                                |
                                v
                    Router::match() [4 routers]
                    +---------------------------+
                    | 1. Base Router (standard) |
                    | 2. CMS Router             |
                    | 3. URL Rewrite Router     |
                    | 4. Default Router (404)   |
                    +---------------------------+
                                |
                                v
                    Controller::execute()
                                |
                                v
                    Layout->getOutput()
                    [XML layout + Block tree]
                                |
                                v
                    Response->sendResponse()
```

### 10.2 Area Codes

| Area | Code | Entry Point | Use Case |
|---|---|---|---|
| Frontend | `frontend` | `pub/index.php` | Storefront |
| Admin | `adminhtml` | `pub/index.php` (admin route) | Backend |
| REST API | `webapi_rest` | `pub/rest.php` | REST endpoints |
| SOAP API | `webapi_soap` | `pub/soap.php` | SOAP endpoints |
| GraphQL | `graphql` | `pub/graphql.php` | GraphQL queries |
| Cron | `crontab` | `bin/magento cron:run` | Background jobs |
| Install | `install` | `bin/magento setup:install` | Setup |

- **Exam focus:** Areas determine which XML configuration files are loaded. `di.xml` in `etc/` is **global**. `di.xml` in `etc/frontend/` is **area-specific** and loaded only for the `frontend` area.
- **Exam focus:** `etc/adminhtml/system.xml` is only loaded in the `adminhtml` area. `etc/webapi.xml` is loaded for API areas.

### 10.3 Plugin Restrictions

```
Plugins CANNOT be applied to:
+---------------------------------------------+
| - Final classes                             |
| - Final methods                             |
| - Static methods                            |
| - Private methods                           |
| - __construct (constructor)                 |
| - Virtual types                             |
| - Objects that are NOT instantiated via DI  |
|   (i.e., using `new ClassName()`)           |
+---------------------------------------------+
```

- **Exam focus:** You CAN apply a plugin to an `abstract` class — but it only takes effect on concrete subclasses instantiated via the DI container.

### 10.4 Preference vs. Plugin vs. Event

| Mechanism | Use When | Replaces Original? | Multiple? |
|---|---|---|---|
| **Plugin** | Modify method behavior | NO (wraps) | YES (multiple plugins OK) |
| **Preference** | Replace entire class | YES (full replace) | Last one wins conflict |
| **Event/Observer** | React to something that happened | NO | YES (all fire) |
| **Virtual Type** | Configure existing class differently | NO (config only) | YES |

---

## 11. Common Wrong-Answer Traps

### 11.1 Trap: "config:dump writes env.php"

**WRONG.** `app:config:dump` writes to `config.php`. Sensitive and environment-specific values go to `env.php` via `config:set --lock-env` or manual editing.

### 11.2 Trap: "setup:di:compile is needed in developer mode"

**WRONG.** Developer mode generates classes at runtime. `setup:di:compile` is required only for **production mode** (or to verify compilation errors before deployment).

### 11.3 Trap: "cache:flush is safer than cache:clean"

**WRONG.** `cache:clean` is **safer** because it only removes Magento-tagged entries. `cache:flush` wipes the entire cache backend, which can affect other applications.

### 11.4 Trap: "After plugins run, after plugins fire in the same order as before"

**WRONG.** `after` plugins fire in **reverse** `sortOrder`. The plugin with the **highest** `sortOrder` fires its `after` method **first**.

### 11.5 Trap: "Indexer status 'Scheduled' means there's an error"

**WRONG.** "Scheduled" simply means the indexer is in **Update by Schedule** mode and has pending MView changelog entries waiting for cron. This is the expected, healthy state in production.

### 11.6 Trap: "You can dump sensitive config values with app:config:dump"

**WRONG.** Fields using `Magento\Config\Model\Config\Backend\Encrypted` as their backend model are **never exported** by `app:config:dump`. They must be set per-environment in `env.php`.

### 11.7 Trap: "Interceptors are hand-written PHP files"

**WRONG.** Interceptors are **100% auto-generated** by `setup:di:compile`. Never edit them — they are overwritten every time compilation runs. The `generated/` directory should be in `.gitignore`.

### 11.8 Trap: "A plugin on an interface applies to ALL implementations"

**CORRECT — but nuanced.** A plugin defined on an interface in `di.xml` applies to **all classes that implement that interface AND are instantiated through the DI container**. Objects created with `new` bypass plugins entirely.

### 11.9 Trap: "setup:upgrade deletes the generated/ directory"

**PARTIALLY WRONG.** By default, `setup:upgrade` DOES delete `generated/`. The `--keep-generated` flag prevents this. Always use `--keep-generated` in production zero-downtime deployments.

### 11.10 Trap: "The config.php module list is edited to disable modules"

**CORRECT.** Setting a module value to `0` in `config.php` disables it. But you should use `bin/magento module:disable VendorName_ModuleName` which updates `config.php` properly and checks dependencies.

```bash
# Correct way to disable a module
bin/magento module:disable Magento_TwoFactorAuth

# What it does to config.php:
# 'Magento_TwoFactorAuth' => 0,

# Always run setup:upgrade after enabling/disabling modules
bin/magento setup:upgrade
bin/magento cache:flush
```

---

## Quick-Reference Checklist

### app:config:dump

- [ ] Exports config from DB to `app/etc/config.php` (and reads `env.php`)
- [ ] Writes: `scopes`, `themes`, `system`, `i18n` — NOT sensitive values
- [ ] Exported values become **read-only** (locked) in the Admin UI
- [ ] Sensitive values (Encrypted backend model) are **never exported**
- [ ] `env.php` stores: DB credentials, cache config, session config, crypt key, deployment mode, locked-env values
- [ ] Config priority: `env.php` > `config.php` > database > `system.xml` defaults
- [ ] `config:set --lock-env` writes to `env.php`; `config:set` writes to DB
- [ ] `config:show` reads the effective value from all sources

### setup:di:compile

- [ ] Generates Interceptors, Factories, Proxies, Extension Attributes
- [ ] Output to `generated/code/` (PHP classes) and `generated/metadata/` (serialized config)
- [ ] **Required for production mode** — NOT required for developer mode
- [ ] Must re-run after: adding plugins, preferences, virtual types, constructor changes, module enable/disable
- [ ] Run `cache:clean compiled_config` after compilation

### Generated Interceptors

- [ ] Located at `generated/code/Vendor/Module/ClassName/Interceptor.php`
- [ ] Auto-generated — **never edit manually**
- [ ] Extend the original class, implement `InterceptorInterface`
- [ ] Use `Interceptor` trait which provides `___init()` and `___callPlugins()`
- [ ] Only intercept **public** methods
- [ ] Cannot intercept: final methods, static methods, private methods, `__construct`
- [ ] Plugin execution order: `before` (ascending sortOrder) → `around` (ascending) → `after` (**descending** sortOrder)

### cache:status

- [ ] Shows all Magento cache types with `1` (enabled) or `0` (disabled)
- [ ] `cache:clean` — removes Magento-tagged entries only (SAFER)
- [ ] `cache:flush` — wipes entire cache storage backend (affects all apps)
- [ ] `cache:clean config` after any XML config change
- [ ] `cache:clean full_page` after CMS/layout changes
- [ ] `full_page` = Magento built-in FPC; Varnish is external, not in `cache:status`
- [ ] After `setup:di:compile`, clean `compiled_config` cache type

### indexer:status

- [ ] States: `Ready`, `Reindex required`, `Processing`, `Scheduled`, `Suspended`
- [ ] `Scheduled` = normal for Update by Schedule mode — NOT an error
- [ ] `Update on Save` = realtime; slow Admin saves on large catalogs
- [ ] `Update by Schedule` = MView changelog tables + cron processing
- [ ] MView uses DB triggers to track changed entity IDs in `_cl` tables
- [ ] `indexer:reindex` runs full reindex; `indexer:reset` marks as stale
- [ ] Production recommendation: all indexers on `Update by Schedule`
- [ ] `Catalog Search` indexer populates Elasticsearch/OpenSearch — requires ES running

### Deployment Modes

- [ ] Developer: runtime class generation, full error output, no `di:compile` needed
- [ ] Production: pre-compiled required, minimal error output, fastest performance
- [ ] `deploy:mode:set production` auto-runs compile + static deploy (unless `--skip-compilation`)
- [ ] Deployment order: `maintenance:enable` → `composer install` → `setup:upgrade` → `setup:di:compile` → `setup:static-content:deploy` → `cache:flush` → `maintenance:disable`
- [ ] `setup:upgrade --keep-generated` prevents deleting `generated/` directory

### Configuration Architecture

- [ ] `system.xml` declares config fields: `section/group/field` path structure
- [ ] `core_config_data` stores Admin-set values with `scope`, `scope_id`, `path`, `value`
- [ ] Scope IDs: `default` scope always has ID `0`
- [ ] `showInDefault/showInWebsite/showInStore` control UI visibility — NOT storage scope
- [ ] Area-specific `di.xml` in `etc/{area}/` only loads for that area
- [ ] Plugins on interfaces apply to all DI-instantiated implementations

### Common Exam Traps

- [ ] `app:config:dump` → `config.php` (NOT `env.php`)
- [ ] `cache:clean` is SAFER than `cache:flush`
- [ ] `after` plugins fire in **REVERSE** sortOrder
- [ ] `Scheduled` indexer status is NORMAL (not an error)
- [ ] `setup:di:compile` is NOT needed in developer mode
- [ ] Sensitive config (Encrypted backend) is NEVER exported by `app:config:dump`
- [ ] Interceptors are AUTO-GENERATED — never edit them
- [ ] `setup:upgrade` deletes `generated/` by default — use `--keep-generated` in production
