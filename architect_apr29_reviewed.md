# Adobe Commerce Architect Exam — Study Notes
## Deployment Pipeline, ECE-Tools & Quality Patches

**Goal:** Week 3 — Section 2: Review + Section 3: Configure & Deploy
**Date:** Apr 29

---

## Table of Contents

1. [The Three-Phase Deployment Model](#1-the-three-phase-deployment-model)
2. [The Compilation Flow](#2-the-compilation-flow)
3. [Build Phase — Deep Dive](#3-build-phase--deep-dive)
4. [Deploy Phase — Deep Dive](#4-deploy-phase--deep-dive)
5. [Post-Deploy Phase — Deep Dive](#5-post-deploy-phase--deep-dive)
6. [Static Content Deployment Strategies](#6-static-content-deployment-strategies)
7. [SCD Phase Placement — Architectural Decision](#7-scd-phase-placement--architectural-decision)
8. [ECE-Tools Commands & Hooks](#8-ece-tools-commands--hooks)
9. [Zero-Downtime Deployment — Rolling Deploy on Pro](#9-zero-downtime-deployment--rolling-deploy-on-pro)
10. [Quality Patches Tool (QPT)](#10-quality-patches-tool-qpt)
11. [Custom Patches — cweagans/composer-patches](#11-custom-patches--cwеaganscomposer-patches)
12. [Security Patches — Full vs Isolated](#12-security-patches--full-vs-isolated)
13. [Dependency Management in Cloud](#13-dependency-management-in-cloud)
14. [Scenario-Based Architectural Reasoning](#14-scenario-based-architectural-reasoning)
15. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. The Three-Phase Deployment Model

```
+------------------+    +------------------+    +---------------------+
|   BUILD PHASE    |    |  DEPLOY PHASE    |    |   POST-DEPLOY PHASE |
|                  |    |                  |    |                     |
| - composer install|-->| - maintenance ON |-->| - cache warmup      |
| - DI compile     |    | - setup:upgrade  |    | - cron start        |
| - SCD (optional) |    | - cache flush    |    | - optional reindex  |
| - NO DATABASE    |    | - maintenance OFF|    |                     |
+------------------+    +------------------+    +---------------------+
     Read-only              DB Available            Site is live
     filesystem             Site is DOWN            (briefly)
```

> **The fundamental constraint driving every architectural decision in Cloud deployment is that the build phase has NO database connection and produces a read-only artifact.**

**Exam focus:**
- The build phase executes in an **isolated build container** — no database, no Redis, no Elasticsearch
- The deploy phase is when the site is **actually down** (maintenance mode ON)
- Post-deploy runs **after the site is back up** — failures here do not take the site down
- These three phases map directly to three hook sections in `.magento.app.yaml`

---

## 2. The Compilation Flow

```
Git Push
   |
   v
Build Container (no services)
   |
   +-- composer install
   |      |
   |      +-- apply cweagans patches
   |      +-- autoloader generation
   |
   +-- bin/magento setup:di:compile
   |      |
   |      +-- generates var/cache/... (compiled DI config)
   |      +-- generates generated/code/...
   |
   +-- bin/magento setup:static-content:deploy  <-- if SCD in build
   |
   +-- ece-tools build:generate
   +-- ece-tools build:transfer
   |
   v
Immutable Build Artifact (slug)
   |
   v
Deploy Phase begins...
```

**Exam focus:**
- `setup:di:compile` runs **during build**, not deploy — this means any factory, proxy, or interceptor that fails compilation breaks the build, not deploy
- The compiled artifact (slug) is **immutable** — what was built is exactly what gets deployed
- `build:generate` and `build:transfer` are the two sub-steps of the build hook in ECE-Tools

---

## 3. Build Phase — Deep Dive

### What Happens

| Step | Command / Action | Notes |
|------|-----------------|-------|
| 1 | `composer install` | Uses `composer.lock` exactly |
| 2 | Apply patches | `cweagans/composer-patches` runs here |
| 3 | `setup:di:compile` | DI compilation, interceptor generation |
| 4 | SCD (if configured) | Static assets generated |
| 5 | `build:generate` | Generates config files from env |
| 6 | `build:transfer` | Moves artifacts to the mount points |

### The Critical Constraint: No Database

```php
// THIS CODE WILL FAIL SILENTLY OR THROW DURING BUILD
// if placed in a plugin that runs during DI compile

class MyPlugin
{
    public function __construct(
        private ResourceConnection $connection
    ) {
        // ResourceConnection tries to connect to DB
        // In build phase: connection string doesn't exist
        // Result: fatal error or silent failure
    }
}
```

**Why this matters architecturally:**

```php
// WRONG — accessing DB in a constructor or early bootstrap
class BadProductHelper
{
    public function __construct(ResourceConnection $resource)
    {
        $this->tableName = $resource->getConnection()
            ->getTableName('catalog_product_entity'); // FAILS in build
    }
}

// CORRECT — lazy/deferred DB access
class GoodProductHelper
{
    private ?string $tableName = null;

    public function __construct(private ResourceConnection $resource) {}

    public function getTableName(): string
    {
        // Only called at runtime, not during DI compile
        if ($this->tableName === null) {
            $this->tableName = $this->resource->getConnection()
                ->getTableName('catalog_product_entity');
        }
        return $this->tableName;
    }
}
```

**Exam focus:**
- Custom code that **calls the database in a constructor** will cause build failures on Cloud even if it works in on-premise environments
- Plugins on `\Magento\Framework\App\Bootstrap` or early bootstrap classes are particularly dangerous — they're instantiated during DI compile
- The build phase uses a **separate filesystem** — writable mounts (e.g., `var/`, `pub/media/`) are **not available** during build
- `env.php` does not contain database credentials during build phase — credentials are injected at deploy time

### Filesystem Availability During Build

```
Available in Build:
  app/           (read)
  vendor/        (written by composer)
  generated/     (written by DI compile)
  pub/static/    (written by SCD if in build)

NOT Available in Build:
  var/            (mount — not available)
  pub/media/      (mount — not available)
  Database         (service — not available)
  Redis/Cache      (service — not available)
  Search           (service — not available)
```

---

## 4. Deploy Phase — Deep Dive

### Sequence

```
1. Maintenance mode ON          (site shows maintenance page)
2. Mount writable directories   (var/, pub/media/, etc.)
3. Deploy static content        (if SCD NOT moved to build)
4. bin/magento setup:upgrade    (runs DB schema/data patches)
5. bin/magento setup:di:compile (if not done in build)
6. Cache flush
7. Maintenance mode OFF         (site returns to users)
```

**Exam focus:**
- **Every second in deploy phase = downtime**. This is the architectural driver for moving SCD to build
- `setup:upgrade` runs **during the deploy phase** — this is unavoidable because it requires DB access to apply patches and update schema
- If `setup:upgrade` fails, maintenance mode may remain ON — this is a critical failure scenario
- The deploy phase runs in the **actual application container**, with all services available

### What setup:upgrade Does

```bash
# This single command does multiple things:
bin/magento setup:upgrade

# Internally runs:
# 1. Applies all pending InstallSchema / UpgradeSchema patches
# 2. Applies all pending InstallData / UpgradeData patches
# 3. Applies Declarative Schema changes (db_schema.xml)
# 4. Runs data patches (DataPatchInterface implementations)
# 5. Updates the module list in the database
```

**Exam focus — Patch interfaces:**

Both patch types live in `\Magento\Framework\Setup\Patch` and extend `PatchInterface`:

| Interface | Patch type | Operations |
|---|---|---|
| `DataPatchInterface` | **Data patches** | DML/DQL — insert, update, migrate rows |
| `SchemaPatchInterface` | **Schema patches** | DDL — add/modify tables and columns |

Both interfaces are **marker interfaces** (no own methods) that extend `PatchInterface`, which declares:
- `apply()` — executes the patch logic
- `getAliases()` — returns previous patch class names (prevents re-applying a renamed patch)

`PatchInterface` extends `DependentPatchInterface`, which declares:
- `getDependencies()` (static) — returns array of patch classes that must be applied first (ensures ordering)

Patches are **idempotent** because the `patch_list` DB table tracks applied patches by class name — each patch is applied exactly once regardless of how many times `setup:upgrade` runs. `getAliases()` ensures a renamed patch class isn't applied again; `getDependencies()` ensures correct application order.

On Cloud, `setup:upgrade` must complete within the deploy hook timeout.

---

## 5. Post-Deploy Phase — Deep Dive

### Purpose

The post-deploy phase exists to perform operations that:
1. Require a **live site** (e.g., HTTP warmup requests)
2. Are **non-critical** to site availability (failures don't cause downtime)
3. Are **expensive** and should not block deployment (e.g., reindexing)

### Sequence

```
Site is LIVE during post-deploy

1. Cache warmup        (HTTP requests to critical pages)
2. Cron start          (enables scheduled tasks)
3. Optional reindex    (if triggered)
4. Any custom scripts
```

**Exam focus:**
- Post-deploy **does not affect uptime** — if warmup fails, the site is still up
- Cron is **disabled during build and deploy** phases — it's re-enabled in post-deploy
- Reindexing during post-deploy means users see stale data briefly — this is a tradeoff vs. keeping reindex in deploy (which adds downtime)
- The hook name in `.magento.app.yaml` is `post_deploy` (underscore, not hyphen)

---

## 6. Static Content Deployment Strategies

### The Three Strategies

| Strategy | How It Works | Build Time | Disk Usage | Best For |
|----------|-------------|-----------|------------|----------|
| `quick` | Generates minimal set, symlinks rest | Fast | Low | **Cloud default** — large catalogs, many locales |
| `compact` | Symlinks shared files, copies unique | Medium | Low | Alternate Cloud option — watch for symlink breaks |
| `standard` | Full copy of all files for each locale | Slow | High | On-premise, debugging |

**`quick` is the default `SCD_STRATEGY` for Adobe Commerce Cloud.** `compact` is available but is not the default.

### Strategy Deep Dive

```bash
# quick strategy (Cloud default)
bin/magento setup:static-content:deploy --strategy=quick

# compact strategy
bin/magento setup:static-content:deploy --strategy=compact

# standard strategy
bin/magento setup:static-content:deploy --strategy=standard
```

#### quick (Cloud default)
```
pub/static/
  frontend/
    Magento/luma/
      en_US/          <-- minimal required files only
      _requirejs/     <-- symlinked/shared
      # Remaining files loaded on-demand or symlinked
```

#### compact
```
pub/static/
  frontend/
    Magento/luma/
      en_US/          <-- actual files
      fr_FR/          <-- symlinks to en_US where files are identical
                          copies where locale-specific
```

#### standard
```
pub/static/
  frontend/
    Magento/luma/
      en_US/          <-- full copy of ALL files
      fr_FR/          <-- full copy of ALL files (duplicated!)
```

**Exam focus:**
- `compact` uses **symlinks** — if the symlink target is missing (e.g., after cleanup), assets break. This is a common production issue
- `quick` is the default — faster because it **defers some file resolution** to runtime
- `standard` is the **safest but slowest** — never use in Cloud production
- The strategy is set in `.magento.env.yaml` under `SCD_STRATEGY`

### Configuration in .magento.env.yaml

```yaml
stage:
  build:
    SCD_STRATEGY: quick       # Default; use compact or standard as needed
    SCD_COMPRESSION_LEVEL: 4
    SCD_THREADS: 4
    SKIP_SCD: false
  deploy:
    SKIP_SCD: true   # Skip SCD in deploy if done in build
```

---

## 7. SCD Phase Placement — Architectural Decision

This is one of the most **exam-critical** architectural decisions in Cloud deployment.

### Option A: SCD in Deploy Phase (default behavior)

```
BUILD:  composer install, DI compile
            [fast build]
DEPLOY: maintenance ON --> SCD --> setup:upgrade --> maintenance OFF
            [long downtime = SCD time + upgrade time]
```

### Option B: SCD in Build Phase (recommended for production)

```
BUILD:  composer install, DI compile, SCD
            [longer build, but build = zero downtime]
DEPLOY: maintenance ON --> setup:upgrade --> maintenance OFF
            [short downtime = upgrade time only]
```

### The Tradeoff Matrix

| Factor | SCD in Build | SCD in Deploy |
|--------|-------------|---------------|
| Deploy downtime | **Shorter** | Longer |
| Build time | Longer | Shorter |
| Failed SCD impact | Build fails (not deploy) | Site stays down |
| DB required for SCD | No | No |
| Risk to production | Lower | Higher |
| Static assets from DB | Cannot use | Can use (but shouldn't) |

### How to Move SCD to Build

```yaml
# .magento.env.yaml
stage:
  global:
    SCD_ON_DEMAND: false
  build:
    SKIP_SCD: false          # Run SCD in build (default: false)
    SCD_STRATEGY: quick
  deploy:
    SKIP_SCD: true           # Skip SCD in deploy
```

**Exam focus:**
- The **architectural reason** to move SCD to build is **reducing maintenance window / downtime**, not build efficiency
- SCD in build **cannot access database** — if your theme/static content generation requires DB data, it must stay in deploy (but this is itself a design smell)
- Exam questions will present both options as "valid" — the correct answer is SCD in build **when minimizing downtime is the priority**
- `SCD_ON_DEMAND` generates static content on first request — useful for Staging/Integration, **not recommended for Production** (first-user penalty)

### Why SCD Doesn't Need the Database

```
SCD reads from:
  app/design/          (theme files — filesystem)
  vendor/              (module view files — filesystem)
  app/etc/config.php   (list of locales/themes — filesystem)

SCD does NOT read:
  Database             (no product data, no CMS content in static assets)
  Cache                (bypass cache during generation)
```

**This is why SCD CAN be safely moved to build phase.**

---

## 8. ECE-Tools Commands & Hooks

### ECE-Tools Command Structure

```bash
# Build phase commands
ece-tools build:generate   # Generates configuration, patches applied
ece-tools build:transfer   # Transfers generated files to mounts

# Deploy phase command
ece-tools deploy           # Runs full deploy sequence

# Post-deploy command
ece-tools post-deploy      # Runs post-deploy tasks

# Utility commands
ece-tools env:config:show  # Show current environment config
ece-tools config:dump      # Dump config to app/etc/config.php
ece-tools cron:enable      # Enable cron
ece-tools cron:disable     # Disable cron
ece-tools cron:kill        # Kill running cron jobs
```

### .magento.app.yaml Hook Configuration

```yaml
# .magento.app.yaml

hooks:
    build: |
        set -e
        composer --no-ansi --no-interaction install --no-progress --prefer-dist --optimize-autoloader
        php ./vendor/bin/ece-tools run scenario/build/generate.xml
        php ./vendor/bin/ece-tools run scenario/build/transfer.xml

    deploy: |
        php ./vendor/bin/ece-tools run scenario/deploy.xml

    post_deploy: |
        php ./vendor/bin/ece-tools run scenario/post-deploy.xml
```

**Exam focus:**
- The hook names are `build`, `deploy`, and `post_deploy` — note the **underscore** in `post_deploy`
- `set -e` in the build hook means **any failed command stops the entire build** — this is critical for fail-fast behavior
- Hooks run as the **application user**, not root
- You can add custom commands **before or after** the ece-tools calls — before for setup, after for custom post-processing
- The scenario XML files (`scenario/build/generate.xml`, etc.) are the extensibility points for custom steps

### Custom Hook Steps

```yaml
# Adding custom steps to build hook
hooks:
    build: |
        set -e
        # Custom pre-build step
        php artisan custom:pre-build-task

        # ECE-Tools standard build
        php ./vendor/bin/ece-tools run scenario/build/generate.xml
        php ./vendor/bin/ece-tools run scenario/build/transfer.xml

        # Custom post-build step
        bash scripts/custom-build-finalize.sh
```

### ECE-Tools Scenario Extensibility

```xml
<!-- Custom scenario extending build/deploy -->
<!-- app/etc/di.xml or custom scenario file -->
<scenario>
    <step name="custom-step" type="Vendor\Module\Step\CustomStep" priority="500"/>
</scenario>
```

**Exam focus:**
- ECE-Tools uses a **scenario-based architecture** — each phase (build, deploy, post-deploy) is a scenario composed of steps
- Steps implement `\Magento\MagentoCloud\Step\StepInterface`
- You can add/replace/remove steps by creating custom scenario XML files and referencing them in hooks

---

## 9. Zero-Downtime Deployment — Rolling Deploy on Pro

### Architecture

Cloud Pro uses a **rolling deploy** across its 3-node production cluster, not a true Blue/Green swap. The load balancer routes around each node as it deploys:

```
+------------------+        +------------------+        +------------------+
|   Node 1 (live)  |        |   Node 2 (live)  |        |   Node 3 (live)  |
|                  |        |                  |        |                  |
|  Serving traffic |-->Deploy|  Serving traffic |-->Deploy|  Serving traffic |-->Deploy
|  Current code    |        |  New code        |        |  New code        |
+------------------+        +------------------+        +------------------+
         |                           |                           |
         +----------+    +----------+    +----------+
                    |    |              |    |
                    v    v              v    v
              +------------+      +------------+
              | Load       |      | Load       |
              | Balancer   |      | Balancer   |
              +------------+      +------------+
                    |
                    v
               Users/CDN
```

### How Zero-Downtime Works on Cloud Pro

```
1. New code built into slug (artifact)
2. Deploy phase runs (setup:upgrade, cache flush)
3. Rolling deploy: LB routes around each node as it receives new code
4. After all 3 nodes updated: deployment complete
5. No single point of downtime — traffic always has at least one node serving
```

**Exam focus:**
- Zero-downtime rolling deploy is available on **Cloud Pro** — **not** on Cloud Starter
- "Zero downtime" is near-zero — brief windows exist during node transitions
- **Database migrations** (`setup:upgrade`) run once before the rolling deploy — if schema changes are applied while old code runs on other nodes, this requires backward-compatible migrations
- The shared database is the key constraint: during rolling deploy, old and new code may simultaneously read the same schema — schema changes must be backward compatible

### Backward-Compatible Migration Pattern

```php
// WRONG for zero-downtime rolling deploy — removes column while old code still reads it
class RemoveOldColumn implements SchemaPatchInterface
{
    public function apply(): void
    {
        $this->schemaSetup->getConnection()->dropColumn('sales_order', 'old_column');
        // Old-code nodes are still running and reading old_column = ERRORS
    }
}

// CORRECT — three-deploy pattern for rolling deploy with schema changes
// Deploy 1: Add new column, keep old column
// Deploy 2: Migrate data, switch code to use new column
// Deploy 3: Remove old column (all nodes now on new code)
```

---

## 10. Quality Patches Tool (QPT)

### What is QPT?

QPT (Quality Patches Tool) is Adobe's official mechanism for distributing isolated bug-fix patches without requiring a full version upgrade.

```bash
# Install QPT
composer require magento/quality-patches

# List all available patches and their status
bin/magento quality:patches:status

# Apply a specific patch
bin/magento quality:patches:apply MDVA-12345

# Revert a specific patch
bin/magento quality:patches:revert MDVA-12345

# Check if a patch is applicable to current version
bin/magento quality:patches:check
```

### QPT Status Output

```
+----------+--------+---------+------+------+------------------+
| Id       | Type   | Status  | Details                       |
+----------+--------+---------+------+------+------------------+
| MDVA-123 | Magento| Applied | v2.4.5 | Fix cart total bug  |
| ACSD-456 | Magento| N/A     | v2.4.6 | Not applicable      |
| MDVA-789 | Magento| Not applied | v2.4.5 | Fix search    |
+----------+--------+---------+------+------+------------------+
```

**Exam focus:**
- `quality:patches:status` shows **all** patches — applied, not applied, and not applicable
- QPT patches are **version-specific** — `N/A` means the patch doesn't apply to your current Magento version
- Patches are stored in `vendor/magento/quality-patches/patches/` directory
- QPT patches must be listed in `magento/quality-patches` package — you cannot create your own QPT patches (use `cweagans` for custom patches)
- On Cloud, QPT patches are applied during the **build phase** via the `quality:patches:apply` command in the build hook

### QPT in Cloud Context

```yaml
# .magento.app.yaml — applying QPT patches in build
hooks:
    build: |
        set -e
        composer install --no-ansi --no-interaction
        # QPT patches applied here, before DI compile
        php ./vendor/bin/ece-tools run scenario/build/generate.xml
        php ./vendor/bin/ece-tools run scenario/build/transfer.xml
```

```yaml
# .magento.env.yaml — specifying patches to apply
stage:
  global:
    QUALITY_PATCHES:
      - MDVA-12345
      - ACSD-67890
```

**Exam focus:**
- In Cloud, QPT patches are configured in `.magento.env.yaml` under `QUALITY_PATCHES` — **not** applied manually via CLI
- ECE-Tools reads the `QUALITY_PATCHES` list and applies them during the build scenario
- This is the **Cloud-correct** way — directly running CLI commands in hooks is possible but less maintainable

---

## 11. Custom Patches — cweagans/composer-patches

### What It Does

`cweagans/composer-patches` is a Composer plugin that applies patch files during `composer install` or `composer update`. Because `composer install` runs in the **build phase**, patches are applied at the earliest possible point — before DI compile.

### Setup

```bash
composer require cweagans/composer-patches
```

```json
// composer.json — patch definition
{
    "require": {
        "cweagans/composer-patches": "^1.7"
    },
    "extra": {
        "composer-exit-on-patch-failure": true,
        "patches": {
            "magento/module-catalog": {
                "Fix product save race condition": "patches/MDVA-99999-product-save-fix.patch",
                "Fix category tree performance": "patches/custom-category-tree.patch"
            },
            "magento/module-checkout": {
                "Custom checkout step fix": "patches/custom-checkout.patch"
            }
        }
    }
}
```

### Patch File Format

```diff
# patches/MDVA-99999-product-save-fix.patch
--- a/vendor/magento/module-catalog/Model/Product.php
+++ b/vendor/magento/module-catalog/Model/Product.php
@@ -245,7 +245,7 @@ class Product extends AbstractModel implements
      */
     public function save()
     {
-        $this->_beforeSave();
+        if ($this->getId()) { $this->_beforeSave(); }
         return parent::save();
     }
```

**Exam focus:**
- `"composer-exit-on-patch-failure": true` — **always set this in Cloud** — without it, a failed patch is silently ignored and broken code is deployed
- Patches are applied **alphabetically by package, then by description** — order matters for interdependent patches
- Patches apply against the **vendor directory** — after `composer install` unpacks packages
- If a patch fails (e.g., the upstream code changed), the entire build fails — this is the correct behavior
- Custom patches in `patches/` directory should be **committed to Git** — they're part of your codebase

### Patch File Location Best Practice

```
project-root/
  patches/
    MDVA-99999-description.patch     # QPT-style naming for tracking
    CUSTOM-001-checkout-fix.patch    # Custom prefix for internal patches
  composer.json                      # References patches/
  composer.lock                      # Locks exact versions
```

### Difference: QPT vs cweagans

| Aspect | QPT (quality-patches) | cweagans/composer-patches |
|--------|----------------------|--------------------------|
| Source | Adobe-managed catalog | Your own patch files |
| Applies | After composer install | During composer install |
| Config | `.magento.env.yaml` | `composer.json` |
| Rollback | `quality:patches:revert` | Remove from composer.json |
| Use case | Official Adobe bug fixes | Custom/third-party fixes |
| Auditable | Yes (patch ID tracking) | Manual tracking |

---

## 12. Security Patches — Full vs Isolated

### Full Security Patches

A full security patch (e.g., `2.4.5` → `2.4.5-p1`) is a **complete release** that:
- Includes all security fixes
- May include additional bug fixes
- Requires full `composer update magento/product-community-edition`
- Tested against the full dependency tree

```bash
# Applying a full security patch on Cloud
# Update composer.json first:
composer require magento/product-cloud-edition:2.4.6-p1 --no-update
composer update
git add composer.json composer.lock
git commit -m "Security patch 2.4.6-p1"
git push
```

### Isolated Security Patches (APSB Patches)

Isolated patches address a **specific CVE** without a full version bump:
- Smaller scope — only the vulnerable files
- Faster to apply and test
- Distributed as patch files (`.patch`) or via QPT
- Lower risk of regression

```bash
# Applying an isolated security patch via QPT
bin/magento quality:patches:apply APSB23-99

# Or via cweagans if distributed as a patch file
# Add to composer.json patches section
```

### PCI SLA Requirements

```
Critical Security Patches (CVSS >= 9.0):
  Apply within: 30 days of release
  (some PCI DSS interpretations: 72 hours for critical)

High Security Patches (CVSS 7.0-8.9):
  Apply within: 30 days

Medium/Low:
  Apply within: 90 days
```

**Exam focus:**
- **Full patches** = new Magento version (e.g., -p1, -p2) — preferred when available
- **Isolated patches** = targeted fix for a specific CVE without version bump — used when full patch not yet available or cannot be applied immediately
- PCI DSS requires patching **within defined SLAs** — failing to patch within SLA is a compliance violation
- On Cloud, applying a full security patch = `composer update` + redeploy through the pipeline
- Never apply patches directly to Cloud production files — always go through Git pipeline

---

## 13. Dependency Management in Cloud

### The Core Constraint

> **On Adobe Commerce Cloud, you cannot run arbitrary `composer update` — you must use the Adobe-managed dependency set.**

```
On-Premise Mental Model:        Cloud Mental Model:
  You control versions             Adobe controls baseline
  composer update = fine           composer update = risky
  Any package version              Must align with Cloud modules
```

### Why Arbitrary composer update Is Dangerous on Cloud

```
ECE-Tools depends on specific versions of:
  - symfony/console
  - illuminate/container
  - guzzlehttp/guzzle
  - etc.

Your modules may require:
  - symfony/console ^5.0

ECE-Tools requires:
  - symfony/console ^4.4

Result: Dependency conflict that breaks ECE-Tools
        = Deployment infrastructure broken
        = Cannot deploy to Cloud
```

### Safe Dependency Update Pattern on Cloud

```bash
# WRONG — blind update
composer update

# CORRECT — targeted update of specific package
composer update vendor/package --with-dependencies

# CORRECT — check for conflicts before committing
composer update vendor/package --dry-run

# CORRECT — use Cloud-compatible metapackage update
composer require magento/magento-cloud-metapackage:^2.4.6 --no-update
composer update
```

### The magento-cloud-metapackage

```json
// composer.json — Cloud projects must use this metapackage
{
    "require": {
        "magento/magento-cloud-metapackage": ">=2.4.6 <2.4.7",
        "magento/ece-tools": "^2002.1.0"
    }
}
```

**Exam focus:**
- `magento/magento-cloud-metapackage` pins the versions of all Cloud-specific dependencies — updating outside this set can break `ece-tools`
- The correct approach for adding new packages: `composer require vendor/package` (adds to `composer.json`) then push — **do not** run broad `composer update`
- Composer's **conflict resolution** during `composer install` (using `composer.lock`) is safe — it's `composer update` (modifying `composer.lock`) that is dangerous
- In Cloud, `composer.lock` should **always be committed** — it pins exact versions used in build

### Dependency Conflict Scenario (Exam-style)

```
SCENARIO: A developer needs to add a new third-party module that requires
symfony/http-kernel ^6.0, but the current Cloud environment uses ^5.4.

WRONG answer: "Run composer update to resolve conflicts"
CORRECT answer: "Check if the module has a compatible version that supports
                 symfony/http-kernel ^5.4, or request an exception with
                 Adobe Commerce support, or defer until Cloud's baseline
                 upgrades to symfony ^6.0"
```

---

## 14. Scenario-Based Architectural Reasoning

These are the types of reasoning chains the exam tests.

### Scenario 1: "The deployment takes 15 minutes. How do you reduce downtime?"

```
Analysis:
  - 15 min deploy = probably SCD in deploy phase
  - SCD for large catalog with many locales = 10-12 min alone

Wrong answers:
  A) "Use faster servers"           -- not architectural
  B) "Reduce number of locales"     -- may not be acceptable
  C) "Use quick strategy"           -- helps but doesn't solve root cause

Correct answer:
  D) "Move SCD to build phase"
     Reasoning: SCD doesn't require DB, can run in build,
                eliminates SCD time from maintenance window,
                build time increases but build = no downtime
```

### Scenario 2: "A custom module works locally but fails in Cloud build"

```
Analysis:
  - "Fails in Cloud build" + "works locally" = build environment difference
  - Build has NO database
  - Local dev has database always available

Wrong answers:
  A) "Increase build timeout"               -- not the root cause
  B) "Add the module to the build phase"    -- nonsensical
  C) "Clear generated code and retry"       -- won't fix root cause

Correct answer:
  D) "The module connects to DB in constructor or during DI compile"
     Reasoning: Build phase has no DB connection. Fix = lazy-load
                the DB dependency (proxy pattern or deferred access)
```

### Scenario 3: "Which patch mechanism for an urgent CVE fix?"

```
SITUATION: Critical CVE discovered. Full patch (2.4.6-p2) not yet released.
           CVE has isolated patch file from Adobe Security.

Analysis:
  - Full patch not available
  - Isolated patch available
  - PCI SLA requires action within 30 days (or 72 hours for critical)

Correct answer:
  Apply isolated patch via cweagans or QPT immediately
  Plan full patch upgrade when available
  Document in security log for PCI audit trail

Key reasoning: Isolated patch = smaller blast radius, faster to test,
               meets PCI SLA. Waiting for full patch = PCI violation.
```

### Scenario 4: "Developer wants to run composer update to add a module"

```
SITUATION: New third-party module needed in Cloud production.
           Developer proposes: "composer update && git push"

Analysis:
  - composer update resolves ALL dependencies, not just new package
  - May upgrade ECE-Tools dependencies
  - May break ece-tools functionality
  - Cloud-managed dependency set disrupted

Correct answer:
  composer require vendor/new-module
  composer update vendor/new-module --with-dependencies
  Review composer.lock diff carefully
  Test in Integration environment first

Do NOT: composer update (broad)
```

### Scenario 5: "Post-deploy reindex vs deploy-phase reindex"

```
QUESTION: When should reindex happen during deployment?

Deploy-phase reindex:
  PRO: Data consistent before site goes live
  CON: Adds to maintenance window (downtime)
  CON: Large catalog = very long downtime

Post-deploy reindex:
  PRO: Site available immediately after deploy
  CON: Brief period of stale search/catalog data
  CON: Reindex runs while site serves traffic (resource contention)

Correct architectural answer:
  For most scenarios: Post-deploy (minimize downtime)
  Exception: If stale data is unacceptable (e.g., pricing reindex
             after price update deployment) = deploy phase
  Best practice: Avoid index-impacting deployments during peak hours
```

---

## Quick-Reference Checklist

### Three Deployment Phases

- [ ] **Build phase**: No DB, no services — composer install, DI compile, SCD (optional), generates immutable artifact
- [ ] **Deploy phase**: DB available, maintenance ON — setup:upgrade, cache flush, maintenance OFF
- [ ] **Post-deploy phase**: Site live — warmup, cron start, optional reindex
- [ ] Hook names in `.magento.app.yaml`: `build`, `deploy`, `post_deploy` (underscore!)

### Build Phase Critical Facts

- [ ] No database connection in build phase — ever
- [ ] Code connecting to DB in constructor fails in build (silent or fatal)
- [ ] Writable mounts (`var/`, `pub/media/`) not available during build
- [ ] `env.php` does not contain DB credentials during build
- [ ] DI compile happens in build — interceptors/proxies generated here

### Patch Interfaces (setup:upgrade)

- [ ] `DataPatchInterface` — for data patches (DML/DQL: row inserts, data migrations)
- [ ] `SchemaPatchInterface` — for schema patches (DDL: table/column changes)
- [ ] Both extend `PatchInterface`, which declares `apply()` and `getAliases()`
- [ ] `PatchInterface` extends `DependentPatchInterface`, which declares `getDependencies()` (static)
- [ ] `getDependencies()` ensures patch ordering; `getAliases()` prevents re-applying renamed patches
- [ ] Idempotence enforced by `patch_list` DB table — each patch applied exactly once

### SCD Strategies

- [ ] `quick` = **Cloud default** — minimal generation, symlinks rest — fastest build
- [ ] `compact` = symlinks shared, copies unique — alternate Cloud option — **watch for broken symlinks**
- [ ] `standard` = full copy per locale — slowest, most disk — on-premise only
- [ ] Moving SCD to build = shorter maintenance window (architecturally preferred for production)
- [ ] `SCD_ON_DEMAND` = runtime generation — Staging/Integration only, not Production
- [ ] SCD does NOT require database — safe to run in build phase

### ECE-Tools Commands

- [ ] `ece-tools build:generate` — generates config files
- [ ] `ece-tools build:transfer` — moves artifacts to mounts
- [ ] `ece-tools deploy` — full deploy sequence
- [ ] `ece-tools post-deploy` — post-deploy tasks
- [ ] Scenario files: `scenario/build/generate.xml`, `scenario/deploy.xml`, `scenario/post-deploy.xml`

### Quality Patches Tool (QPT)

- [ ] `bin/magento quality:patches:status` — list all patch statuses
- [ ] `bin/magento quality:patches:apply MDVA-XXXXX` — apply a patch
- [ ] `bin/magento quality:patches:revert MDVA-XXXXX` — revert a patch
- [ ] Cloud: configure via `QUALITY_PATCHES` in `.magento.env.yaml`
- [ ] Cannot create your own QPT patches — use `cweagans` for custom patches

### Custom Patches (cweagans)

- [ ] `cweagans/composer-patches` applies patches during `composer install`
- [ ] Always set `"composer-exit-on-patch-failure": true`
- [ ] Patch files committed to Git in `patches/` directory
- [ ] Applies **during build phase** — earliest possible application point
- [ ] Failed patch = build fails = correct behavior (not silent)

### Security Patches

- [ ] **Full patch** = new Magento version (e.g., -p1) — complete security release
- [ ] **Isolated patch** = specific CVE fix — smaller scope, faster to apply
- [ ] PCI SLA: Critical = 30 days (some interpretations: 72 hours); High = 30 days
- [ ] Apply isolated patch immediately if full patch not available — meets PCI SLA
- [ ] Always deploy through Git pipeline — never patch files directly

### Dependency Management in Cloud

- [ ] Never run arbitrary `composer update` on Cloud
- [ ] Use `composer require vendor/package` for new packages
- [ ] Use `magento/magento-cloud-metapackage` to pin Cloud-compatible versions
- [ ] Always commit `composer.lock` — pins exact build versions
- [ ] Breaking Cloud dependencies = broken deployment infrastructure

### Zero-Downtime (Rolling Deploy on Pro)

- [ ] Rolling deploy across **3-node cluster** — available on **Cloud Pro only** — not Starter
- [ ] Each node updated sequentially; LB routes around deploying node
- [ ] DB migrations (`setup:upgrade`) run once before rolling deploy starts
- [ ] Old and new code may run simultaneously on different nodes → schema changes must be backward compatible
- [ ] Three-deploy pattern for breaking schema changes (add → migrate → drop)
- [ ] "Zero downtime" is near-zero — brief node transition windows exist

### Architectural Decision Framework (Exam)

- [ ] **SCD in build** = preferred for production, reduces downtime
- [ ] **Reindex in post-deploy** = preferred, unless data consistency is critical
- [ ] **Lazy DB access** = required pattern for Cloud-compatible code
- [ ] **Isolated patch first** = when full patch unavailable and PCI SLA active
- [ ] **Targeted composer update** = only update specific package + its deps
- [ ] **Test in Integration → Staging → Production** = required pipeline discipline

---

*Study notes generated for Adobe Commerce Architect Certification — Week 3, Section 2 & 3*
*Focus: Deployment decisions are architectural — always reason from WHY, not just WHAT*
