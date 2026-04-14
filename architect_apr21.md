# Magento 2 Certified Architect: Content Staging (EE) & B2B Architecture

## Study Notes — Week 2, Section 1 (Advanced Design) & Section 2 Intro

---

## Table of Contents

1. [Content Staging Architecture Overview](#1-content-staging-architecture-overview)
2. [The Staging Database Model: row_id vs entity_id](#2-the-staging-database-model-row_id-vs-entity_id)
3. [Version & Sequence Tables Deep Dive](#3-version--sequence-tables-deep-dive)
4. [EntityManagerInterface & Operation Architecture](#4-entitymanagerinterface--operation-architecture)
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
| **Campaign / Update** | A named time window (`start_time` → `end_time`) that groups one or more entity changes |
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
- The staging module intercepts persistence via **plugins**, not observers or event/dispatch

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
+--------+-----------+------------+---------------------+---------------------+
| row_id | entity_id | created_in | updated_in          | sku                 |
+--------+-----------+------------+---------------------+---------------------+
|     42 |        42 |          1 | 9999999999999       | my-product          |  <- "live" row
|     89 |        42 |   17200000 | 17250000            | my-product-campaign |  <- staged row
|    134 |        42 |   17250000 | 9999999999999       | my-product          |  <- rollback row
+--------+-----------+------------+---------------------+---------------------+
```

- `created_in` = staging version ID when this row becomes active
- `updated_in` = staging version ID when this row is superseded (9999999999999 = "current/no end")
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
- The ORM (`ResourceModel` / Collection) handles this automatically via Magento's staging plugin chain — **raw SQL bypasses this**
- `entity_id` is stable across versions; `row_id` changes per version snapshot

---

## 3. Version & Sequence Tables Deep Dive

### Key Tables

| Table | Purpose |
|---|---|
| `staging_update` | Stores each scheduled update (campaign) with version ID, name, start/end times |
| `sequence_catalog_product` | Sequence table — generates monotonically increasing `entity_id` values |
| `flag` table (`staging_flag`) | Stores current active version timestamp |

### `staging_update` Schema

```sql
DESCRIBE staging_update;
-- id            bigint(20) - version identifier (Unix timestamp or generated)
-- name          varchar(255) - human-readable name
-- description   text
-- start_time    timestamp - when this version becomes active
-- end_time      timestamp - when this version expires (NULL = permanent)
-- is_campaign   tinyint(1)
-- rollback_id   bigint(20) - points to the rollback version
-- is_rollback   tinyint(1)
```

### How Versions Are Numbered

Staging version IDs are **Unix timestamps** (in seconds) representing the `start_time`. This is important:

```
Version ID 1712016000 = 2024-04-02 00:00:00 UTC (approx)
```

The "base" version is always version ID `1` (the "live now" state).  
The "permanent future" sentinel is `9999999999999` (used in `updated_in`).

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
- Staging version IDs correlate to Unix timestamps of `start_time`
- Sequence tables exist so `entity_id` remains stable while `row_id` can be created freely for new versions
- `updated_in = 9999999999999` means "this is the currently applicable row with no known expiry"

---

## 4. EntityManagerInterface & Operation Architecture

### Why EntityManagerInterface Exists

Before EE staging, persistence was handled by `ResourceModel::save()`. In EE, staging needed to intercept persistence to:
1. Create a new `row_id` entry rather than updating the existing one
2. Associate the new row with the correct staging version
3. Handle rollback row creation

The solution was `Magento\Framework\EntityManager\EntityManagerInterface` — a unified persistence layer.

```php
namespace Magento\Framework\EntityManager;

interface EntityManagerInterface
{
    public function save($entity, $arguments = []);
    public function load($entity, $identifier, $arguments = []);
    public function delete($entity, $arguments = []);
    public function has($entity, $identifier, $arguments = []);
}
```

### Operation Chain Architecture

```
EntityManager::save($product)
        |
        v
+---------------------------+
| OperationPool             |  Resolves which operations to run
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

### Operation Metadata

Operations are mapped via `di.xml`:

```xml
<!-- Magento/Staging/etc/di.xml (simplified) -->
<type name="Magento\Framework\EntityManager\Operation\Create">
    <plugin name="staging_create_plugin"
            type="Magento\Staging\Model\Operation\Create"
            sortOrder="100"/>
</type>
```

**Exam focus:**
- `EntityManagerInterface` is the **correct extension point** for EE-compatible entity persistence
- Direct `ResourceModel::save()` calls **bypass staging logic** — this is an architectural flaw in custom modules
- Operations implement `Magento\Framework\EntityManager\Operation\CreateInterface`, `UpdateInterface`, `DeleteInterface`

---

## 5. Staging Plugins: Save & Delete Interception

### How Staging Wraps Persistence

Staging uses **around plugins** on `EntityManagerInterface` methods to intercept all entity saves and deletes.

```
EntityManager::save()
      |
      | (around plugin intercepts)
      v
Magento\Staging\Model\Operation\Create
      |
      |-- Determines: is this a staged save?
      |-- If YES: creates new row_id, sets created_in/updated_in
      |-- If NO: delegates to standard create
      v
      DB Write (new row_id row inserted)
      |
      v
Rollback row created automatically
```

### Plugin Registration Pattern

```xml
<!-- vendor/magento/module-staging/etc/di.xml -->
<type name="Magento\Framework\EntityManager\EntityManager">
    <plugin name="staging_entity_manager_save"
            type="Magento\Staging\Plugin\EntityManager\Save"
            sortOrder="100"/>
    <plugin name="staging_entity_manager_delete"
            type="Magento\Staging\Plugin\EntityManager\Delete"
            sortOrder="100"/>
</type>
```

### The Save Plugin Logic (Conceptual)

```php
namespace Magento\Staging\Plugin\EntityManager;

class Save
{
    public function aroundSave(
        \Magento\Framework\EntityManager\EntityManager $subject,
        callable $proceed,
        $entity,
        $arguments = []
    ) {
        // Check if a staging version context is active
        if (isset($arguments['created_in'])) {
            // Route to staging-aware create/update operation
            return $this->stagingOperation->execute($entity, $arguments);
        }

        // No staging context — proceed normally
        return $proceed($entity, $arguments);
    }
}
```

### Delete Behavior

When staging is active, **delete does not immediately remove the entity**. Instead:

1. A "delete" staging update is created
2. At the version's `start_time`, the entity is actually removed
3. A rollback update restores it if the campaign is cancelled

**Exam focus:**
- Staging uses **around plugins** on `EntityManagerInterface`, not on `ResourceModel`
- Calling `$resourceModel->save($product)` directly in a custom module skips staging — this is an architectural mistake
- Delete under staging creates a **deferred deletion** via a staging version, not an immediate DB delete
- Plugin `sortOrder` matters — staging plugins must run before other persistence plugins

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
3. Plugin intercepts: new row_id created in catalog_product_entity
4. Rollback version created with updated_in = PHP_INT_MAX sentinel
```

### Cron Application

```xml
<!-- Magento/Staging/etc/crontab.xml -->
<job name="staging_apply_version"
     instance="Magento\Staging\Cron\ApplyVersion"
     method="execute">
    <schedule>* * * * *</schedule>  <!-- runs every minute -->
</job>
```

The cron compares current time against `staging_update.start_time` and applies pending versions.

**Exam focus:**
- Staging versions are applied by a **cron job running every minute** — changes are not real-time to the second
- If cron is broken/disabled, scheduled updates **never apply** — this is a critical production concern
- The `ApplyVersion` cron updates the `staging_flag` record to signal the current active version

---

## 7. URL Hash Preview Mechanism

### How Preview Works

Preview allows admins to simulate the frontend at a future point in time without affecting live customers.

```
Admin clicks "Preview" on a Scheduled Update
        |
        v
Magento generates a signed URL:
/staging/preview/index?version=<versionId>&store=<storeId>
        |
        + Appended: &_store_to_base_url=1
        + Appended: &signature=<HMAC hash>
        |
        v
PreviewController sets staging version context in session/registry
        |
        v
All subsequent requests in that session use:
  - row_id rows where created_in <= versionId < updated_in
        |
        v
Frontend renders as if the scheduled update is live
```

### Security of the Hash

```php
// Magento\Staging\Model\Preview\UrlBuilder
$signature = $this->encryptor->hash(
    $versionId . $storeId . $startTime,
    Encryptor::HASH_VERSION_SHA256
);
```

- The hash prevents tampering with the version ID in the URL
- Preview URLs are **time-limited** (configurable)
- Preview runs as the **admin user's session context**, not as a customer

### Version Context Propagation

```php
// Magento\Staging\Model\VersionManager
public function setCurrentVersionId($versionId)
{
    // Sets the "virtual time" for all entity queries
    $this->currentVersionId = $versionId;
}

// Entity collections use this via a plugin/join condition:
// WHERE created_in <= $currentVersionId AND updated_in > $currentVersionId
```

**Exam focus:**
- Preview uses **HMAC/SHA-256 signed URLs** — not session tokens alone
- Preview does not write to the database — it only changes the **query context** (version ID filter)
- The version context filter (`created_in <= X < updated_in`) is injected into **all entity queries** during preview, making it transparent to frontend code
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
SELECT id, name, start_time, end_time, is_rollback, rollback_id
FROM staging_update
ORDER BY id DESC
LIMIT 10;
```

Expected output:

```
+---------------+-------------------+---------------------+----------+-------------+-------------+
| id            | name              | start_time          | end_time | is_rollback | rollback_id |
+---------------+-------------------+---------------------+----------+-------------+-------------+
| 1712530800    | My Product Update | 2024-04-08 01:00:00 | NULL     |           0 |  1712530801 |
| 1712530801    | Rollback for ...  | NULL                | NULL     |           1 |        NULL |
+---------------+-------------------+---------------------+----------+-------------+-------------+
```

### Step 3: Inspect `catalog_product_entity`

```sql
SELECT row_id, entity_id, created_in, updated_in, sku
FROM catalog_product_entity
WHERE entity_id = <your_product_entity_id>
ORDER BY row_id;
```

Expected output:

```
+--------+-----------+------------+---------------+--------------+
| row_id | entity_id | created_in | updated_in    | sku          |
+--------+-----------+------------+---------------+--------------+
|     42 |        42 |          1 | 1712530800    | test-product |  <- current live
|     89 |        42 | 1712530800 | 9999999999999 | test-product |  <- staged version
|     90 |        42 | 1712530800 | 9999999999999 | test-product |  <- rollback version
+--------+-----------+------------+---------------+--------------+
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
    +-- Roles (company_roles)
          +-- Permissions per role (company_permissions)
          +-- Role assignments (company_user_roles)
```

### Key Tables

| Table | Purpose |
|---|---|
| `company` | Root company record: name, status, credit, email |
| `company_advanced_customer_entity` | Links Magento customers to companies with job title, status |
| `company_team` | Organizational sub-units within a company |
| `company_roles` | Named roles (e.g., "Purchaser", "Manager") |
| `company_permissions` | ACL-like permission records per role |
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

| Type | Behavior |
|---|---|
| **Public** | Default catalog — available to all guests and non-B2B customers. Only one can exist. |
| **Custom** | Assigned to specific companies. Multiple can exist. |

### Shared Catalog Database Tables

```sql
-- The catalog itself
shared_catalog                    -- id, name, type, customer_group_id, store_id

-- Product assignments
shared_catalog_product_item       -- catalog_id, sku

-- Category assignments
shared_catalog_category_item      -- catalog_id, category_id

-- Price overrides (THIS IS KEY)
catalog_product_index_price_*     -- Shared Catalog has its own price index tables
```

### Price Override Mechanism

Shared Catalog prices are stored as **tier prices** in a special customer group context:

```sql
-- Shared Catalog prices appear here:
catalog_product_entity_tier_price
  -- customer_group_id = (the group linked to the shared catalog)
  -- qty = 1 (minimum — but note: this IS a tier price record)
  -- value = the custom price

-- OR in newer versions, via:
shared_catalog_product_price      -- dedicated price override table
```

### Own Price Indexer

Shared Catalog has a **dedicated price indexer** that runs separately from the standard price indexer:

```bash
# Standard price indexer
php bin/magento indexer:reindex catalog_product_price

# Shared Catalog price indexer (separate)
php bin/magento indexer:reindex catalog_product_price
# Note: Shared Catalog hooks INTO the price indexer via a plugin
# The SharedCatalog module's plugin forces reindex when catalog prices change
```

The key architectural point: `Magento\SharedCatalog\Plugin\Catalog\Model\ResourceModel\Product\Price\TierPriceStorage`

```php
// SharedCatalog intercepts tier price saves to maintain sync
public function afterUpdate(
    TierPriceStorageInterface $subject,
    $result,
    array $prices
) {
    // Triggers SharedCatalog-specific reindex
    $this->priceIndexer->reindexAffectedProducts($prices);
    return $result;
}
```

**Exam focus:**
- Shared Catalog **overrides standard tier prices** for assigned companies — this is the most critical pricing precedence fact
- Shared Catalog uses a **separate price index** that extends (via plugin) the standard `catalog_product_price` indexer — it does not replace it
- When Shared Catalog is enabled, the standard **catalog price scope** behavior changes: prices shown to a company are filtered through the assigned Shared Catalog
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

// This is enforced in:
// Magento\SharedCatalog\Plugin\Catalog\Model\Indexer\Product\Price\*
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

### Key Tables

| Table | Purpose |
|---|---|
| `negotiable_quote` | Extended quote data: status, negotiated price, expiry |
| `negotiable_quote_item` | Line-item level negotiated prices |
| `negotiable_quote_history` | Full audit log of all changes |
| `negotiable_quote_comment` | Message thread between buyer and rep |
| `negotiable_quote_company_config` | Per-company quote settings |

### Quote Status State Machine

```
CREATED -> SUBMITTED (by buyer)
        -> PROCESSING_BY_CUSTOMER
        -> PROCESSING_BY_ADMIN
        -> SUBMITTED_BY_ADMIN
        -> ORDERED (converted to order)
        -> EXPIRED
        -> DECLINED
        -> CLOSED
```

**Exam focus:**
- Negotiable Quote extends `quote` — it does **not** replace the quote; it adds a parallel `negotiable_quote` record linked by `quote_id`
- The negotiated price is stored in `negotiable_quote.negotiated_price_value` and **overrides all catalog pricing** at checkout
- Negotiable Quote **can only be used** if the company has the "Create Negotiable Quote" permission in their role

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
- CSV upload has a **default limit** (configurable) of 20 SKUs per upload
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
1. Cron is not running (staging_apply_version job not executing)
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
  1. Implement entity using EntityManagerInterface
  2. Define operations in di.xml
  3. Create staging_update linkage table (entity_id -> version_id)
  4. Add plugin on EntityManager operations
  5. Define metadata in entity metadata config
```

**Exam focus:**
- The architect exam asks **why** the EntityManager approach is superior — the answer is: it participates in the staging operation chain, is CE/EE compatible, and separates persistence concerns from entity logic
- The exam may present a scenario where direct ResourceModel saves work in CE but break in EE — the correct architectural answer is always to use the `EntityManagerInterface` / repository pattern

---

## Quick-Reference Checklist

### Content Staging (EE)

- [ ] Content Staging is **EE-only** — not available in CE
- [ ] `row_id` = auto-increment PK per staged row; `entity_id` = stable logical identity across versions
- [ ] EAV attribute tables in EE join on `row_id`, not `entity_id`
- [ ] Staging version IDs = Unix timestamps of `start_time`
- [ ] `updated_in = 9999999999999` = currently active row with no defined expiry
- [ ] Staging uses **around plugins** on `EntityManagerInterface`, not ResourceModel
- [ ] Calling `ResourceModel::save()` directly **bypasses staging** — architectural flaw
- [ ] Staging cron job (`staging_apply_version`) runs **every minute** — changes are not instantaneous
- [ ] Preview uses **SHA-256 HMAC signed URLs** — signature includes versionId + storeId + startTime
- [ ] A scheduled update creates at minimum: **1 staged row + 1 rollback row** in entity tables
- [ ] Use `MetadataPool::getMetadata()->getLinkField()` for CE/EE compatible SQL — returns `row_id` in EE
- [ ] Sequence tables (`sequence_catalog_product`) generate stable `entity_id` values; `row_id` is entity table's own AI
- [ ] Deleting an entity under staging creates a **deferred deletion** via a staging version

### B2B Architecture

- [ ] B2B requires **Adobe Commerce EE** — cannot run on CE
- [ ] B2B sub-features are **independently togglable** via Stores > Configuration
- [ ] Company hierarchy: Super Admin > Teams > Members; all are regular `customer_entity` records
- [ ] Company is associated with a **customer group** for pricing/catalog purposes
- [ ] Credit limit operates in company's currency; "Payment on Account" only shows if credit is sufficient

### Shared Catalog

- [ ] Two types: **Public** (one, for all) and **Custom** (many, per company)
- [ ] Shared Catalog controls both **visibility** (which products) and **price** (custom price override)
- [ ] Products **not in a company's Shared Catalog are invisible** to that company
- [ ] Shared Catalog has its **own price indexer** that extends (via plugin) the standard price indexer
- [ ] Shared Catalog prices are stored as tier price records under the company's customer group

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
- [ ] Has a full **state machine** (CREATED → SUBMITTED → PROCESSING → ORDERED etc.)
- [ ] Requires company role permission "Create Negotiable Quote" to initiate

### Requisition Lists & Quick Order

- [ ] Customers can have **unlimited** Requisition Lists
- [ ] Requisition List items keyed by **SKU + serialized options**, not product_id
- [ ] Price recalculation happens **at add-to-cart time**, not when saved to list
- [ ] Quick Order respects **Shared Catalog visibility** — unknown/excluded SKUs are rejected
- [ ] Quick Order supports: manual entry, CSV upload, copy-paste
- [ ] Quick Order creates a **standard quote** — no special data structure

### Architect Decision Rules

- [ ] Always use **ProductRepository / EntityManagerInterface** for entity reads/writes in EE code
- [ ] Always use **MetadataPool getLinkField()** for CE/EE compatible entity table SQL joins
- [ ] When staging breaks: check cron first, then cache, then indexers, then timezone
- [ ] Custom entities that need staging support must integrate with **EntityManagerInterface** and declare operation metadata in `di.xml`
- [ ] Shared Catalog price conflict: if a company has a Shared Catalog price, standard tier prices for that group are **replaced in the index**, not merged
