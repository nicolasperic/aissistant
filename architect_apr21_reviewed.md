# Magento 2 Certified Architect: Content Staging (EE) & B2B Architecture

## Study Notes — Week 2, Section 1 (Advanced Design) & Section 2 Intro

---

## Table of Contents

1. [Content Staging Architecture Overview](#1-content-staging-architecture-overview)
2. [The Staging Database Model: row_id vs entity_id](#2-the-staging-database-model-row_id-vs-entity_id)
3. [Version & Sequence Tables Deep Dive](#3-version--sequence-tables-deep-dive)
4. [EntityManager & Operation Architecture](#4-entitymanager--operation-architecture)
5. [Staging Plugins: Save & Delete Interception](#5-staging-plugins-save--delete-interception)
6. [Scheduled Updates: Storage & Preview Mechanism](#6-scheduled-updates-storage--preview-mechanism)
7. [URL Hash Preview Mechanism](#7-url-hash-preview-mechanism)
8. [Hands-On: Inspect Staging Tables](#8-hands-on-inspect-staging-tables)
9. [B2B Architecture Overview](#9-b2b-architecture-overview)
10. [Company Hierarchy: Accounts, Roles & Credit](#10-company-hierarchy-accounts-roles--credit)
11. [Shared Catalog: Price Overrides & Indexing](#11-shared-catalog-price-overrides--indexing)
12. [Pricing Precedence Chain (EE + B2B)](#12-pricing-precedence-chain-ee--b2b)
13. [Negotiable Quote Flow](#13-negotiable-quote-flow)
14. [Requisition Lists & Quick Order](#14-requisition-lists--quick-order)
15. [Architect-Level Scenario Decision Framework](#15-architect-level-scenario-decision-framework)
16. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Content Staging Architecture Overview

Content Staging is an **Adobe Commerce (EE) exclusive** feature that allows merchants to schedule time-boxed content changes (called **Scheduled Updates**) for entities such as products, categories, CMS pages, blocks, price rules, and banners.

### Core Concepts

| Concept | Description |
|---|---|
| **Campaign / Update** | A named time window (`start_time` → optional `end_time`) that groups one or more entity changes |
| **Version** | A snapshot of entity state tied to a staging update |
| **Preview** | A frontend simulation of what the store looks like at a future point in time |
| **Rollback** | A special update that reverts entity state to its pre-campaign values |

### Architectural Philosophy

```
+-------------------+       +--------------------------+
|  Merchant creates |       |  staging_update table    |
|  Scheduled Update +-----> |  (version records)       |
|  in Admin Panel   |       +--------------------------+
+-------------------+                   |
                                        v
                        +--------------------------------+
                        |  catalog_product_entity        |
                        |  (row_id != entity_id in EE)  |
                        +--------------------------------+
                                        |
                        +--------------------------------+
                        |  Cron: Magento_Staging         |
                        |  applies version at start_time |
                        +--------------------------------+
```

**Exam focus:**
- Content Staging is **EE only** — it does not exist in Community Edition
- Staging does **not** use separate "draft" tables; it uses **additional rows** in the same entity tables, differentiated by `row_id`
- The staging module intercepts persistence via **operation hooks in OperationPool**, not observers or simple event/dispatch

---

## 2. The Staging Database Model: row_id vs entity_id

This is the **most dangerous area for custom code** and a frequent exam topic.

### The Fundamental Split

In **Community Edition (CE)**:
```sql
-- entity_id is the only identifier, also the auto-increment PK
SELECT * FROM catalog_product_entity WHERE entity_id = 42;
```

In **Enterprise/Adobe Commerce (EE) with Staging**:
```sql
-- row_id is the auto-increment PK (unique per version row)
-- entity_id is the "logical" product identity (shared across versions)
SELECT * FROM catalog_product_entity WHERE entity_id = 42;
-- Returns MULTIPLE rows — one per staging version!
SELECT * FROM catalog_product_entity WHERE row_id = 55;
-- Returns exactly ONE row
```

### Visual Representation

```
catalog_product_entity (EE)
+--------+-----------+------------+------------+---------------------+
| row_id | entity_id | created_in | updated_in | sku                 |
+--------+-----------+------------+------------+---------------------+
|     42 |        42 |          1 | 2147483647 | my-product          |  <- current "live" row
|     89 |        42 |   17200000 | 17250000   | my-product-campaign |  <- staged row
|    134 |        42 |   17250000 | 2147483647 | my-product          |  <- rollback row
+--------+-----------+------------+------------+---------------------+
```

- `created_in` = staging version ID (Unix timestamp of `start_time`) when this row becomes active
- `updated_in` = staging version ID when this row is superseded
- **`updated_in = 2147483647`** = the MAX_VERSION sentinel meaning "currently active with no defined expiry" (`VersionManager::MAX_VERSION = 2147483647`)
- `row_id` is **always unique** — it is the true PK
- `entity_id` groups **all versions of the same product**

### Why Naive Custom Code Breaks

```php
// WRONG in EE — returns multiple rows for a product with staging versions
$connection->select()
    ->from('catalog_product_entity')
    ->where('entity_id = ?', $productId);

// WRONG — joining attribute tables on entity_id in EE misses row_id FK
$connection->select()
    ->from(['e' => 'catalog_product_entity'])
    ->join(
        ['v' => 'catalog_product_entity_varchar'],
        'e.entity_id = v.entity_id', // BROKEN in EE!
        ['value']
    );
```

```php
// CORRECT in EE — attribute tables join on row_id
$connection->select()
    ->from(['e' => 'catalog_product_entity'])
    ->join(
        ['v' => 'catalog_product_entity_varchar'],
        'e.row_id = v.row_id', // CORRECT
        ['value']
    )
    ->where('e.entity_id = ?', $productId)
    ->where('e.created_in <= ?', $currentVersionId)
    ->where('e.updated_in > ?', $currentVersionId);
```

**Exam focus:**
- Attribute EAV tables in EE use **`row_id`** as the FK, not `entity_id`
- Any custom SQL that joins `catalog_product_entity` on `entity_id` to attribute tables **will return wrong data** when staging versions exist
- The ORM (`ResourceModel` / Collection) handles this automatically via Magento's staging operation chain — **raw SQL bypasses this**
- `entity_id` is stable across versions; `row_id` changes per version snapshot

---

## 3. Version & Sequence Tables Deep Dive

### Key Tables

| Table | Purpose |
|---|---|
| `staging_update` | Stores each scheduled update (campaign) with version ID, name, start time |
| `sequence_catalog_product` | Sequence table — generates monotonically increasing `entity_id` values |
| `staging_flag` | Stores current active version timestamp |

### `staging_update` Schema

The actual DB columns in `staging_update` (from `module-staging/etc/db_schema.xml`):

```
id            bigint - version identifier (Unix timestamp of start_time, PK — NOT auto-increment)
start_time    datetime - when this version becomes active
name          varchar(255) - human-readable name
description   varchar(255)
rollback_id   bigint - points to the rollback version
is_campaign   boolean
is_rollback   boolean
moved_to      bigint - update ID this was moved to (for start_time changes)
```

> **Note:** `end_time` is **NOT a database column** in `staging_update`. It is a virtual property on `UpdateInterface` used at the API level to create rollback updates — declared with the comment "Not present in database and used to create rollback update".

### How Versions Are Numbered

Staging version IDs are **Unix timestamps** (in seconds) of `start_time`. This is set explicitly by `UpdateRepository::getIdForEntity()`:

```php
// vendor/magento/module-staging/Model/UpdateRepository.php
protected function getIdForEntity(UpdateInterface $entity)
{
    $timestamp = strtotime($entity->getStartTime());
    // If $timestamp already exists (rare collision), increments until a free slot is found
    try {
        $this->get($timestamp);
        while (true) { $this->get(++$timestamp); }
    } catch (NoSuchEntityException $e) {
        return $timestamp;
    }
}
```

The `staging_update` resource model sets `$_isPkAutoIncrement = false` — IDs are assigned manually (not by DB auto-increment).

The "base" version is always ID `1` (the "live now" state, `VersionManager::MIN_VERSION = 1`).
The "permanent future" sentinel is `2147483647` (`VersionManager::MAX_VERSION = 2147483647`), used in `updated_in`.

### Sequence Tables

Sequence tables replace the auto-increment on the entity table itself:

```sql
-- CE: auto_increment on catalog_product_entity.entity_id
-- EE: auto_increment moved to sequence_catalog_product
SELECT * FROM sequence_catalog_product ORDER BY sequence_value DESC LIMIT 5;
-- +----------------+
-- | sequence_value |
-- +----------------+
-- |             47 |
-- |             46 |
-- ...
```

The `entity_id` in `catalog_product_entity` is populated from `sequence_catalog_product`. The `row_id` is a separate auto-increment on `catalog_product_entity` itself.

**Exam focus:**
- Staging version IDs = Unix timestamps of `start_time` (manually assigned, not DB auto-increment)
- `updated_in = 2147483647` (not 9999999999999) — this is `VersionManager::MAX_VERSION`
- Sequence tables exist so `entity_id` remains stable while `row_id` can be created freely for new versions

---

## 4. EntityManager & Operation Architecture

### Why EntityManager Exists

Before EE staging, persistence was handled by `ResourceModel::save()`. In EE, staging needed to intercept persistence to:
1. Create a new `row_id` entry rather than updating the existing one
2. Associate the new row with the correct staging version
3. Handle rollback row creation

The solution was `Magento\Framework\EntityManager\EntityManager` — a unified persistence layer.

> **Important:** `EntityManagerInterface` does NOT exist in the codebase. `EntityManager` is a **concrete class** at `vendor/magento/framework/EntityManager/EntityManager.php`.

```php
namespace Magento\Framework\EntityManager;

// Concrete class — no separate interface
class EntityManager
{
    public function save($entity, $arguments = []);
    public function load($entity, $identifier, $arguments = []);
    public function delete($entity, $arguments = []);
    public function has($entity); // only $entity — no $identifier or $arguments
}
```

> **Architectural note (from core docblock):** It is NOT recommended to use EntityManager for new entities. Use `ResourceModel\Db\AbstractDb` or `EAV\Entity\AbstractEntity` instead. EntityManager was built for staging compatibility — it is staging infrastructure, not a general persistence pattern.

### Operation Chain Architecture

```
EntityManager::save($product)
        |
        v
+---------------------------+
| OperationPool             |  Resolves which operations to run for this entity type
+---------------------------+
        |
        v
+---------------------------+     +---------------------------+
| CheckIfExistsOperation    |     | ValidateOperation         |
+---------------------------+     +---------------------------+
        |
        v
+---------------------------+
| CreateOperation /         |
| UpdateOperation           |  Core DB write
+---------------------------+
        |
        v
+---------------------------+
| ExtensionAttributeOperation| Handles extension attributes
+---------------------------+
```

### Operation Interfaces

Operations implement interfaces from `Magento\Framework\EntityManager\Operation`:
- `CreateInterface`
- `UpdateInterface`
- `ReadInterface`
- `DeleteInterface`
- `CheckIfExistsInterface`

Operations are registered in `OperationPool` via di.xml — confirmed in `module-staging/etc/di.xml`:

```xml
<type name="Magento\Framework\EntityManager\OperationPool">
    <arguments>
        <argument name="operations" xsi:type="array">
            <item name="checkIfExists" xsi:type="string">Magento\Framework\EntityManager\Operation\CheckIfExists</item>
            <item name="read" xsi:type="string">Magento\Framework\EntityManager\Operation\Read</item>
            <item name="create" xsi:type="string">Magento\Framework\EntityManager\Operation\Create</item>
            <item name="update" xsi:type="string">Magento\Framework\EntityManager\Operation\Update</item>
            <item name="delete" xsi:type="string">Magento\Framework\EntityManager\Operation\Delete</item>
        </argument>
    </arguments>
</type>
```

**Exam focus:**
- `EntityManagerInterface` does NOT exist — the class is `EntityManager` (concrete)
- `EntityManager::has($entity)` takes only ONE argument (no `$identifier`)
- `EntityManager` is the **correct persistence layer** for EE-compatible entity persistence — but the core itself recommends using `ResourceModel` infrastructure for custom entities
- Direct `ResourceModel::save()` calls **bypass staging logic** — this is an architectural flaw in custom modules

---

## 5. Staging Plugins: Save & Delete Interception

### How Staging Wraps Persistence

Staging does NOT use around plugins named `staging_entity_manager_save/delete` on `EntityManager`. Those plugin classes do not exist in the codebase. The actual interception pattern is:

1. **OperationPool configuration** — Entity types that support staging register their own operation implementations in `OperationPool` via di.xml. The staging operation implementations (`Magento\Staging\Model\Operation\Create`, etc.) handle version-aware row creation.
2. **DB adapter plugin** — `module-staging/etc/di.xml` registers `staging_apply_staging_conditions` plugin on `Magento\Framework\DB\Adapter\Pdo\Mysql` to inject version filter conditions into queries during preview mode.
3. **Event Manager override** — Staging replaces `Magento\Framework\Event\ManagerInterface` with `Magento\Staging\Model\Event\Manager\Proxy` to suppress events that should not fire for staged entities.

### The Staging Operation Logic (Conceptual)

When an entity supports staging, its `CreateOperation` checks for a staging context (`created_in` argument) and, if present, creates a new `row_id` row linked to that version rather than updating in place.

```php
// Conceptual — actual logic is in staging-specific operation implementations
public function execute($entity, $arguments = [])
{
    if (isset($arguments['created_in'])) {
        // Create a new row_id row with staging version metadata
        return $this->stagingCreate->execute($entity, $arguments);
    }
    return $this->standardCreate->execute($entity, $arguments);
}
```

### Delete Behavior

When staging is active, **delete does not immediately remove the entity**. Instead:

1. A "delete" staging update is created
2. At the version's `start_time`, the entity is actually removed
3. A rollback update restores it if the campaign is cancelled

**Exam focus:**
- Staging uses **OperationPool** for persistence interception, not around plugins on `EntityManager` directly
- Calling `$resourceModel->save($product)` directly in a custom module skips staging — this is an architectural mistake
- Delete under staging creates a **deferred deletion** via a staging version, not an immediate DB delete

---

## 6. Scheduled Updates: Storage & Preview Mechanism

### Creating a Scheduled Update (Flow)

```
Admin: Product Edit > Schedule New Update
        |
        v
POST /admin/staging/update/save
        |
        v
Magento\Staging\Controller\Adminhtml\Update\Save
        |
        v
1. Create staging_update row (version ID = unix timestamp of start_time)
2. EntityManager::save($product, ['created_in' => $versionId,
                                  'updated_in' => $endVersionId])
3. OperationPool routes to staging-aware Create: new row_id created in catalog_product_entity
4. Rollback version created with updated_in = 2147483647 (MAX_VERSION sentinel)
```

### Cron Application

```xml
<!-- vendor/magento/module-staging/etc/crontab.xml -->
<group id="staging">
    <job name="staging_apply_version"
         instance="Magento\Staging\Model\StagingApplier"
         method="execute">
        <schedule>* * * * *</schedule>  <!-- runs every minute -->
    </job>
    <job name="staging_remove_updates"
         instance="Magento\Staging\Model\Update\Cleaner"
         method="execute">
        <schedule>* * * * *</schedule>
    </job>
    <job name="staging_synchronize_entities_period"
         instance="Magento\Staging\Model\SynchronizeEntityPeriod"
         method="execute">
        <schedule>* * * * *</schedule>
    </job>
</group>
```

The cron compares current time against `staging_update.start_time` and applies pending versions.

**Exam focus:**
- Cron instance class is `Magento\Staging\Model\StagingApplier` — not `Magento\Staging\Cron\ApplyVersion` (that class does not exist)
- Staging versions are applied by a **cron job running every minute** — changes are not real-time to the second
- If cron is broken/disabled, scheduled updates **never apply** — this is a critical production concern
- The `StagingApplier` cron updates the `staging_flag` record to signal the current active version

---

## 7. URL Hash Preview Mechanism

### How Preview Works

Preview allows admins to simulate the frontend at a future point in time without affecting live customers.

```
Admin clicks "Preview" on a Scheduled Update
        |
        v
Magento generates a signed URL via RequestSigner:
staging/update/preview?___version=<versionId>&__timestamp=<ts>&__signature=<hash>
        |
        v
PreviewController sets staging version context
        |
        v
All subsequent requests in that session use:
  - row_id rows where created_in <= versionId < updated_in
        |
        v
Frontend renders as if the scheduled update is live
```

### Security of the Signature

Signing is performed by `Magento\Staging\Model\Preview\RequestSigner` (NOT by `UrlBuilder`). The `UrlBuilder` builds the base admin→frontend URL; `RequestSigner::signUrl()` appends the signature:

```php
// vendor/magento/module-staging/Model/Preview/RequestSigner.php
public function generateSignatureParams(string $version, ?string $timestamp = null): DataObject
{
    $timestamp = $timestamp ?: $this->dateTime->timestamp();
    $signatureData = implode(',', [$version, $timestamp]); // "versionId,timestamp"
    $signature = $this->encryptor->hash($signatureData);   // SHA-256 (default)

    return new DataObject([
        '__timestamp' => $timestamp,
        '__signature' => $signature,
    ]);
}
```

- Hash inputs: **version ID + current timestamp** (comma-joined) — NOT `versionId . storeId . startTime`
- Hash algorithm: SHA-256 (`Encryptor::hash()` defaults to `HASH_VERSION_SHA256 = 1`)
- Signature lifetime: **3600 seconds** (hardcoded constant `SIGNATURE_LIFETIME = 3600`)
- URL path: `staging/update/preview` (constant `URL_PATH_PREVIEW = 'staging/update/preview'`)
- Version param name: `___version` (`VersionManager::PARAM_NAME = '___version'`)

### Version Context Propagation

```php
// Magento\Staging\Model\VersionManager
public function setCurrentVersionId($versionId)
{
    $this->currentVersionId = $versionId;
    $this->version = null;
}

// Entity collections use this via DB adapter plugin condition:
// WHERE created_in <= $currentVersionId AND updated_in > $currentVersionId
```

**Exam focus:**
- Signing class is `RequestSigner`, not `UrlBuilder`; signature includes **version ID + request timestamp** (not storeId or startTime)
- SHA-256 is the hash algorithm (`Encryptor::HASH_VERSION_SHA256`)
- Signature expires after **1 hour** (3600s fixed constant)
- Preview does not write to the database — it only changes the **query context** (version ID filter)
- Preview URL path: `staging/update/preview`
- A corrupted or disabled encryption key breaks preview URL signatures

---

## 8. Hands-On: Inspect Staging Tables

### Step 1: Create a Scheduled Update

1. Navigate to **Catalog > Products > Edit** any product
2. Click **Schedule New Update**
3. Set a name, start time (e.g., +1 hour), change the product name
4. Save

### Step 2: Inspect `staging_update`

```sql
SELECT id, name, start_time, rollback_id, is_rollback
FROM staging_update
ORDER BY id DESC
LIMIT 10;
```

Expected output:

```
+---------------+-------------------+---------------------+-------------+-------------+
| id            | name              | start_time          | rollback_id | is_rollback |
+---------------+-------------------+---------------------+-------------+-------------+
| 1712530800    | My Product Update | 2024-04-08 01:00:00 |  1712530801 |           0 |
| 1712530801    | Rollback for ...  | NULL                |        NULL |           1 |
+---------------+-------------------+---------------------+-------------+-------------+
```

Note: no `end_time` column — it is virtual only.

### Step 3: Inspect `catalog_product_entity`

```sql
SELECT row_id, entity_id, created_in, updated_in, sku
FROM catalog_product_entity
WHERE entity_id = <your_product_entity_id>
ORDER BY row_id;
```

Expected output:

```
+--------+-----------+------------+------------+--------------+
| row_id | entity_id | created_in | updated_in | sku          |
+--------+-----------+------------+------------+--------------+
|     42 |        42 |          1 | 1712530800 | test-product |  <- current live (expires at campaign)
|     89 |        42 | 1712530800 | 2147483647 | test-product |  <- staged version
|     90 |        42 | 1712530800 | 2147483647 | test-product |  <- rollback version
+--------+-----------+------------+------------+--------------+
```

### Step 4: Inspect EAV Attribute Rows

```sql
SELECT e.row_id, e.entity_id, v.attribute_id, v.value
FROM catalog_product_entity e
JOIN catalog_product_entity_varchar v ON e.row_id = v.row_id
WHERE e.entity_id = <your_product_entity_id>
  AND v.attribute_id = (
      SELECT attribute_id FROM eav_attribute
      WHERE attribute_code = 'name'
        AND entity_type_id = 4
  );
```

This confirms that EAV tables join on **`row_id`**, not `entity_id`.

**Exam focus:**
- A scheduled update creates **at least 2 new rows** in `catalog_product_entity`: the staged version + the rollback version
- The live row's `updated_in` is updated to point to the staging version's `created_in`, "expiring" the live row at the campaign start
- After cron runs at `start_time`, the **VersionManager** shifts the active window so the staged row is returned by queries

---

## 9. B2B Architecture Overview

Adobe Commerce B2B is a **separate module suite** (`magento/module-b2b`) that layers on top of EE. It addresses enterprise purchasing workflows.

### B2B Module Map

```
Magento_Company         - Company accounts, hierarchy, roles, permissions
Magento_SharedCatalog   - Catalog visibility & price overrides per company/group
Magento_NegotiableQuote - RFQ / quote negotiation flow
Magento_RequisitionList - Saved shopping lists for repeat purchases
Magento_QuickOrder      - SKU-based rapid cart population
Magento_PurchaseOrder   - Purchase order approval workflows
Magento_CompanyCredit   - Credit limits and payment on account
```

### B2B Activation Dependency

```
B2B features require:
  Adobe Commerce (EE) >= 2.4.x
  + Magento_B2b metapackage
  + Each sub-feature independently toggled in:
    Stores > Configuration > General > B2B Features
```

**Exam focus:**
- B2B requires EE — it cannot run on CE
- B2B sub-features are **independently togglable** — you can have Shared Catalog without Negotiable Quote, etc.
- Each B2B module has its own `db_schema.xml`, indexers, plugins, and ACL resources

---

## 10. Company Hierarchy: Accounts, Roles & Credit

### Company Account Structure

```
Company (company table)
    |
    +-- Super Admin (company_advanced_customer_entity)
    |
    +-- Teams (company_team)
    |     +-- Team Members (customers)
    |
    +-- Structure (company_structure)  ← also tracks hierarchy nodes
    |
    +-- Roles (company_roles)
          +-- Permissions per role (company_permissions)
          +-- Role assignments (company_user_roles)
```

### Key Tables (confirmed in `module-company/etc/db_schema.xml`)

| Table | Purpose |
|---|---|
| `company` | Root company record: name, status, credit, email |
| `company_advanced_customer_entity` | Links Magento customers to companies with job title, status |
| `company_team` | Organizational sub-units within a company |
| `company_structure` | Hierarchy node table (teams + users in a tree) |
| `company_roles` | Named roles (e.g., "Purchaser", "Manager") |
| `company_permissions` | ACL-like permission records per role |
| `company_user_roles` | Maps users to roles |
| `company_credit` | Credit limit, available credit, currency |
| `company_credit_history` | Audit trail of credit adjustments |

### Credit System

```
Company Credit Limit: $10,000
  - Used Credit: $3,000 (outstanding orders)
  - Available Credit: $7,000

Payment method: "Payment on Account" appears at checkout
  only when: company has credit enabled AND order total <= available credit
```

**Exam focus:**
- Company hierarchy is **separate from Magento's customer group system** but integrates with it — a company is associated with a customer group for catalog/pricing purposes
- The company Super Admin is a **regular Magento customer** with an elevated company role — they still have a `customer_entity` record
- Credit limits operate in the **company's currency**, not necessarily the store's default currency

---

## 11. Shared Catalog: Price Overrides & Indexing

### What Shared Catalog Does

Shared Catalog provides **two capabilities**:
1. **Visibility control**: Which products are visible to a company/customer group
2. **Price override**: Custom pricing per product per catalog (overrides tier prices)

### Shared Catalog Types

| Type | DB `type` value | Behavior |
|---|---|---|
| **Custom** | `0` | Assigned to specific companies. Multiple can exist. |
| **Public** | `1` | Default catalog — available to all guests and non-B2B customers. Only one can exist. |

### Shared Catalog Database Tables (from `module-shared-catalog/etc/db_schema.xml`)

```sql
-- The catalog itself
shared_catalog                       -- entity_id, name, type (0=custom/1=public),
                                     --   customer_group_id, created_at, created_by, store_id

-- Product assignments
shared_catalog_product_item          -- entity_id, customer_group_id, sku

-- Category visibility (permissions, not simple item list)
sharedcatalog_category_permissions   -- permission_id, category_id, website_id,
                                     --   customer_group_id, permission
```

> **Correction:** The category assignment table is `sharedcatalog_category_permissions`, NOT `shared_catalog_category_item`. It controls category browse/checkout permissions per customer group, not just item membership.

### Price Override Mechanism

Shared Catalog prices are stored as **tier prices** in a special customer group context:

```sql
-- Shared Catalog prices appear here:
catalog_product_entity_tier_price
  -- customer_group_id = (the group linked to the shared catalog)
  -- qty = 1 (minimum — but note: this IS a tier price record)
  -- value = the custom price
```

### Price Indexer Integration

Shared Catalog hooks into the standard `catalog_product_price` indexer via plugins — it does not have a completely separate indexer command. The key integration point is `Magento\SharedCatalog\Model\TierPriceManagement` which manages tier price synchronization when shared catalog prices are set.

**Exam focus:**
- Shared Catalog **overrides standard tier prices** for assigned companies — this is the most critical pricing precedence fact
- Shared Catalog uses **plugin-based extension** of the standard price indexer — it does not replace it
- When Shared Catalog is enabled, prices shown to a company are filtered through the assigned Shared Catalog
- If a product is **not in the assigned Shared Catalog**, it is **invisible** to that company — it's a visibility + price tool combined

---

## 12. Pricing Precedence Chain (EE + B2B)

This is the **highest-priority exam topic** for B2B sections. Know this chain cold.

### Full Pricing Precedence (Highest to Lowest Priority)

```
1. NEGOTIABLE QUOTE PRICE
   |  - Price agreed in a specific negotiated quote
   |  - Absolute override for that quote session
   |
2. CART PRICE RULE (with "Stop Further Rules Processing")
   |  - Catalog promotion rules that stop the chain
   |
3. SHARED CATALOG PRICE (Custom Catalog price override)
   |  - Tier price stored under the company's customer group (qty=1)
   |  - OVERRIDES standard tier prices for that group
   |
4. STANDARD TIER PRICE (customer group tier prices)
   |  - Traditional tier prices defined on the product
   |  - These apply ONLY if no Shared Catalog price exists for this group
   |
5. SPECIAL PRICE
   |  - Date-limited special price on the product
   |
6. CATALOG PRICE RULE
   |  - Rule-based discounts applied at catalog level
   |
7. BASE PRICE (Regular Price)
   - The product's default price
```

### Tricky Interaction: Shared Catalog vs Tier Prices

```
Scenario:
  - Product has tier price: buy 10+ = $8.00 (for "General" group)
  - Shared Catalog assigns this product to Company A at $9.00 (qty=1)
  - Company A's group IS "General"

Question: What price does Company A see when buying 10 units?
Answer: $9.00 (Shared Catalog wins, even though standard tier price is lower)

Why? Shared Catalog price is stored as a tier price at qty=1 for the group,
but the SharedCatalog indexer marks it as the authoritative price,
suppressing standard tier breaks for that customer group.
```

```
Scenario 2:
  - Product has NO Shared Catalog price override (product is in catalog but no custom price)
  - Standard tier price: 10+ = $8.00 for "General" group
  - Company A is in "General" group

Answer: $8.00 (standard tier price applies — no override means fall-through)
```

### Why This Is Architecturally Significant

The Shared Catalog indexer **replaces tier price rows** for the relevant customer group in the final price index — it does not merge them. This means:

```php
// When building price index for Shared Catalog customers:
// Standard tier prices for that group are IGNORED
// Only SharedCatalog price entries are indexed for that group
```

**Exam focus:**
- Negotiable Quote price **always wins** — it is the highest priority override
- Shared Catalog **beats** standard tier prices for the same customer group — this surprises many developers
- Special Price applies **after** Shared Catalog price evaluation — if Shared Catalog price > Special Price, Special Price wins (it is lower)
- The pricing chain is evaluated in the **price indexer**, not at runtime — understanding this prevents "why is cache wrong" bugs

---

## 13. Negotiable Quote Flow

### Business Flow

```
Buyer                          Sales Rep (Admin)
  |                                   |
  | 1. Add items to cart              |
  | 2. Request Quote                  |
  |    (POST /negotiable-quote/...)   |
  |                                   |
  |       3. Quote created in DB      |
  |          (negotiable_quote table) |
  |                                   |
  |<-- 4. Sales Rep reviews ------    |
  |          adjusts price/discount   |
  |          adds comments            |
  |                                   |
  | 5. Buyer reviews offer            |
  |    Accept / Counter-offer         |
  |                                   |
  |       6. Quote locked for order   |
  |<-- 7. Buyer places order ---------+
         using negotiated price
```

### Key Tables (confirmed in `module-negotiable-quote/etc/db_schema.xml`)

| Table | Purpose |
|---|---|
| `negotiable_quote` | Extended quote data: status, negotiated_price_type, negotiated_price_value |
| `negotiable_quote_item` | Line-item level negotiated prices |
| `negotiable_quote_history` | Full audit log of all changes |
| `negotiable_quote_comment` | Message thread between buyer and rep |
| `negotiable_quote_company_config` | Per-company quote settings |
| `negotiable_quote_grid` | Denormalized grid data |
| `negotiable_quote_comment_attachment` | File attachments for comments |
| `negotiable_quote_item_note` | Item-level notes |

### Quote Status State Machine

Full status constants from `NegotiableQuoteInterface` (from `module-negotiable-quote/Api/Data/NegotiableQuoteInterface.php`):

```
STATUS_CREATED               = 'created'
STATUS_SUBMITTED_BY_CUSTOMER = 'submitted_by_customer'
STATUS_SUBMITTED_BY_ADMIN    = 'submitted_by_admin'
STATUS_PROCESSING_BY_CUSTOMER = 'processing_by_customer'
STATUS_PROCESSING_BY_ADMIN   = 'processing_by_admin'
STATUS_DRAFT_BY_ADMIN        = 'draft_by_admin'
STATUS_DRAFT_BY_CUSTOMER     = 'draft_by_customer'
STATUS_ORDERED               = 'ordered'
STATUS_EXPIRED               = 'expired'
STATUS_DECLINED              = 'declined'
STATUS_CLOSED                = 'closed'
STATUS_TEMPLATE_QUOTE        = 'used_as_template_parent'

Flow:
CREATED -> SUBMITTED_BY_CUSTOMER (buyer submits)
        -> PROCESSING_BY_ADMIN (sales rep opens)
        -> SUBMITTED_BY_ADMIN (rep sends back offer)
        -> PROCESSING_BY_CUSTOMER (buyer reviews)
        -> ORDERED (buyer accepts and places order)
        -> EXPIRED / DECLINED / CLOSED
```

**Exam focus:**
- Negotiable Quote extends `quote` — it does **not** replace the quote; it adds a parallel `negotiable_quote` record linked by `quote_id`
- The negotiated price is stored in `negotiable_quote.negotiated_price_value` and **overrides all catalog pricing** at checkout
- Negotiable Quote **can only be used** if the company has the "Create Negotiable Quote" permission in their role
- Status name is `submitted_by_customer`, not just `submitted` — context (buyer vs admin) matters for exam scenarios

---

## 14. Requisition Lists & Quick Order

### Requisition Lists

A **Requisition List** is a B2B equivalent of a saved wish list optimized for repeat B2B purchasing:

```
requisition_list
  - id, name, description, customer_id, store_id, updated_at

requisition_list_item
  - item_id, requisition_list_id, sku, qty, options (serialized JSON)
```

Key differences from Wishlist:

| Feature | Wishlist | Requisition List |
|---|---|---|
| Multiple lists per customer | No (1) | Yes (unlimited) |
| Stores product options | Limited | Full (serialized) |
| B2B permission control | No | Yes (role-based) |
| Add to cart | Yes | Yes (full/partial) |
| Available in CE | Yes | No (EE/B2B only) |

**Exam focus:**
- Customers can have **unlimited** Requisition Lists — no per-customer limit
- Requisition List items use **SKU + serialized options** — they are not tied to `product_id` directly, allowing SKU-based reordering even if product IDs change
- Adding from Requisition List to cart goes through the **standard cart add flow** — price recalculation happens at add-to-cart time, not when saved to the list

### Quick Order

Quick Order allows B2B buyers to add products **by SKU** directly, bypassing catalog browsing:

```
Quick Order Input Options:
1. Manual SKU entry: type SKU + qty pairs
2. CSV upload: SKU,qty file
3. Copy-paste from spreadsheet
```

**Architecture:**
- Quick Order uses an **AJAX SKU validation endpoint** that resolves SKU → product + current price
- Invalid SKUs are flagged inline (out of stock, discontinued, no permission via Shared Catalog)
- Shared Catalog visibility is enforced — **SKUs not in the company's catalog return an error**

**Exam focus:**
- Quick Order respects **Shared Catalog visibility** — a buyer cannot order SKUs outside their assigned catalog even if they know the SKU
- Quick Order creates a **standard quote** — it is not a separate data structure

---

## 15. Architect-Level Scenario Decision Framework

### Scenario Pattern 1: Custom Module Needs to Read Product Data in EE

**Wrong approach:**
```php
// Bypasses staging version context — returns all versions or wrong version
$connection->select()->from('catalog_product_entity')
    ->where('entity_id = ?', $id);
```

**Right approach (Architecturally):**
```php
// Use the repository — staging context is handled automatically
$product = $this->productRepository->getById($productId);

// OR if you must use SQL, use metadata pools:
$metadata = $this->metadataPool->getMetadata(ProductInterface::class);
$linkField = $metadata->getLinkField(); // returns 'row_id' in EE, 'entity_id' in CE

$select->join(
    ['attr' => 'catalog_product_entity_varchar'],
    'e.' . $linkField . ' = attr.' . $linkField
);
```

**Why it matters for the exam:** The question won't ask "what is `row_id`?" It will ask "A developer wrote this code [shows entity_id join] — what is the problem and how should it be fixed?" The architectural answer is to use `MetadataPool` for CE/EE compatibility, not to hardcode `row_id`.

### Scenario Pattern 2: Staging Version Not Applied

```
Scenario: A merchant says "My scheduled update starts 2 hours ago but the
          product still shows the old price."

Possible causes (architect must evaluate ALL):
1. Cron is not running (staging_apply_version / StagingApplier job not executing)
2. Full-page cache not invalidated after version applied
3. The staging_update.start_time is in wrong timezone vs server time
4. Indexers are in "scheduled" mode and haven't reindexed yet
5. CDN cache layer not purged

Architecturally correct diagnosis path:
  1. Check cron_schedule table for staging_apply_version failures
  2. Check staging_flag for current applied version
  3. Flush specific cache types before blaming staging
```

### Scenario Pattern 3: B2B Pricing Conflict

```
Scenario: Company A complains they are seeing $15 for a product.
          The product has a $12 special price and a $10 tier price for 20+ units.
          The Shared Catalog assigns it at $13.

Question: What price does Company A see for 25 units?

Answer: $13 (Shared Catalog wins over special price AND tier price for their group)

Why architecturally: Shared Catalog price is indexed as the effective price
for that customer group, replacing tier and special price in the price index.
The $12 special price applies to the base price calc but SharedCatalog's
index entry takes precedence in the final indexed price.

Note: This is counterintuitive and a common exam trap.
```

### Scenario Pattern 4: Custom Persistence in EE

```
Scenario: A developer needs to add a new entity that supports staging in EE.
          They have a custom entity MyEntity.

Wrong approach: Override ResourceModel::save()
Right approach:
  1. Implement entity using EntityManager (concrete class)
  2. Define operations in di.xml via OperationPool
  3. Create staging_update linkage table (entity_id -> version_id)
  4. Register staging-aware operation implementations
  5. Define metadata in entity metadata config
```

**Exam focus:**
- The architect exam asks **why** the EntityManager approach is superior — the answer is: it participates in the staging operation chain, is CE/EE compatible, and separates persistence concerns from entity logic
- The exam may present a scenario where direct ResourceModel saves work in CE but break in EE — the correct architectural answer is always to use the repository pattern / `EntityManager`

---

## Quick-Reference Checklist

### Content Staging (EE)

- [ ] Content Staging is **EE-only** — not available in CE
- [ ] `row_id` = auto-increment PK per staged row; `entity_id` = stable logical identity across versions
- [ ] EAV attribute tables in EE join on `row_id`, not `entity_id`
- [ ] Staging version IDs = Unix timestamps of `start_time` (set by `UpdateRepository::getIdForEntity()`)
- [ ] **`updated_in = 2147483647`** = currently active row with no defined expiry (`VersionManager::MAX_VERSION`)
- [ ] Staging uses **OperationPool** for persistence interception, not around plugins on `EntityManager`
- [ ] Calling `ResourceModel::save()` directly **bypasses staging** — architectural flaw
- [ ] Staging cron class is `Magento\Staging\Model\StagingApplier` (`staging_apply_version` job, runs **every minute**)
- [ ] Preview signing is done by `RequestSigner`, hashing `version,timestamp` with SHA-256; 1-hour lifetime
- [ ] Preview URL path: `staging/update/preview`; version param: `___version`
- [ ] A scheduled update creates at minimum: **1 staged row + 1 rollback row** in entity tables
- [ ] Use `MetadataPool::getMetadata()->getLinkField()` for CE/EE compatible SQL — returns `row_id` in EE
- [ ] Sequence tables (`sequence_catalog_product`) generate stable `entity_id` values; `row_id` is entity table's own AI
- [ ] Deleting an entity under staging creates a **deferred deletion** via a staging version
- [ ] `end_time` is a **virtual property** on `UpdateInterface` — NOT stored in the `staging_update` table

### B2B Architecture

- [ ] B2B requires **Adobe Commerce EE** — cannot run on CE
- [ ] B2B sub-features are **independently togglable** via Stores > Configuration
- [ ] Company hierarchy: Super Admin > Teams > Members; all are regular `customer_entity` records
- [ ] Company is associated with a **customer group** for pricing/catalog purposes
- [ ] Credit limit operates in company's currency; "Payment on Account" only shows if credit is sufficient
- [ ] Key tables: `company`, `company_advanced_customer_entity`, `company_team`, `company_structure`, `company_roles`, `company_permissions`, `company_user_roles`

### Shared Catalog

- [ ] Two types: **Public** (type=1, one, for all) and **Custom** (type=0, many, per company)
- [ ] Shared Catalog controls both **visibility** (which products) and **price** (custom price override)
- [ ] Products **not in a company's Shared Catalog are invisible** to that company
- [ ] Shared Catalog has **plugin-based integration** with the standard price indexer
- [ ] Shared Catalog prices are stored as tier price records under the company's customer group
- [ ] Category permissions table: `sharedcatalog_category_permissions` (not `shared_catalog_category_item`)

### Pricing Precedence (EE + B2B) — in order

- [ ] 1st: **Negotiable Quote price** (absolute override for that quote)
- [ ] 2nd: **Cart Price Rule** (with stop further processing)
- [ ] 3rd: **Shared Catalog price** (overrides standard tier prices for the group)
- [ ] 4th: **Standard Tier Price** (applies only if no Shared Catalog price exists)
- [ ] 5th: **Special Price**
- [ ] 6th: **Catalog Price Rule**
- [ ] 7th: **Base Price**
- [ ] **Critical trap**: Shared Catalog price beats standard tier prices even if tier price is lower

### Negotiable Quote

- [ ] Extends `quote` — adds `negotiable_quote` record linked by `quote_id`
- [ ] Negotiated price stored in `negotiable_quote.negotiated_price_value` — overrides ALL catalog pricing
- [ ] Has a full **state machine** with distinct buyer/admin states: CREATED, SUBMITTED_BY_CUSTOMER, PROCESSING_BY_ADMIN, SUBMITTED_BY_ADMIN, PROCESSING_BY_CUSTOMER, ORDERED, EXPIRED, DECLINED, CLOSED; also DRAFT_BY_ADMIN and DRAFT_BY_CUSTOMER
- [ ] Requires company role permission "Create Negotiable Quote" to initiate
