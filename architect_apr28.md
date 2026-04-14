# Adobe Commerce Cloud Architecture
## Comprehensive Study Notes — Week 3, Sections 2 & 3

---

## Table of Contents

1. [Environment Topology: Starter vs Pro](#1-environment-topology-starter-vs-pro)
2. [Configuration Files Deep Dive](#2-configuration-files-deep-dive)
3. [Environment Variable Hierarchy](#3-environment-variable-hierarchy)
4. [Services Configuration](#4-services-configuration)
5. [Deployment Pipeline & Restrictions](#5-deployment-pipeline--restrictions)
6. [Fastly CDN Architecture](#6-fastly-cdn-architecture)
7. [Static Content Deployment Strategy](#7-static-content-deployment-strategy)
8. [Cloud CLI Reference](#8-cloud-cli-reference)
9. [Disaster Recovery: Snapshots & Backups](#9-disaster-recovery-snapshots--backups)
10. [Architectural Decision Patterns](#10-architectural-decision-patterns)
11. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Environment Topology: Starter vs Pro

### 1.1 Starter Plan

```
                     Starter Architecture
                     ====================

  Git Branch           Cloud Environment        Infrastructure
  ----------           -----------------        --------------
  master           --> Production               Single cluster
  staging          --> Staging (integration-3)  Single cluster
  feature-a        --> Integration-1            Single cluster
  feature-b        --> Integration-2            Single cluster

  Total active environments: 4
  (1 production + up to 3 integration/staging)
```

**Key characteristics:**
- All environments run on the **same shared cluster infrastructure**
- `master` branch IS the Production environment
- Staging is just another integration environment — no dedicated cluster
- `.magento.env.yaml` **IS committed to git** (version-controlled)
- Simpler promotion model: merge branch → environment updates

**Exam focus:** On Starter, there is NO dedicated staging cluster. Staging shares infrastructure tier with integration environments. This is a critical architectural difference from Pro.

---

### 1.2 Pro Plan

```
                     Pro Architecture
                     ================

  Git Branch           Cloud Environment        Infrastructure
  ----------           -----------------        --------------
  master           --> Integration (1 of 8)     Shared cluster
  feature-x        --> Integration (2 of 8)     Shared cluster
  feature-y        --> Integration (3 of 8)     Shared cluster
  ...up to 8 total integration branches...

  staging          --> Staging                  DEDICATED cluster
                                                (mirrors production
                                                 hardware/config)

  master (merged)  --> Production               DEDICATED cluster
                                                (redundant, HA)
```

**Key characteristics:**
- **Integration**: Up to 8 branches, shared cluster, for development
- **Staging**: Dedicated cluster, mirrors production hardware — true pre-production
- **Production**: Dedicated cluster, High Availability (3-node redundancy)
- `.magento.env.yaml` is **NOT committed to git** — managed via Cloud CLI or Project Web UI
- Cannot push directly to Staging or Production branches

**Exam focus:** Pro Staging and Production run on **separate, dedicated clusters**. This means configuration must travel through the environment chain — you cannot shortcut by pushing directly to Staging or Production.

---

### 1.3 Side-by-Side Comparison

| Attribute | Starter | Pro |
|---|---|---|
| Total environments | 4 | 8 integration + staging + production |
| Staging cluster | Shared (same as integration) | Dedicated (mirrors production) |
| Production HA | No | Yes (3-node) |
| `.magento.env.yaml` in git | **Yes** | **No** |
| Direct push to Staging/Prod | Yes (merge to branch) | **No — merge chain required** |
| Support ticket for major upgrades | No | Yes (OS/ES major versions) |
| Use case | Smaller projects, simpler teams | Enterprise, mission-critical |

---

## 2. Configuration Files Deep Dive

### 2.1 The `.magento/` Directory Structure

```
project-root/
|
+-- .magento/
|   +-- routes.yaml          # HTTP routing rules (domains, redirects, caching)
|   +-- services.yaml        # Backend service definitions (MySQL, Redis, etc.)
|
+-- .magento.app.yaml        # Application container configuration
+-- .magento.env.yaml        # Runtime environment variables (Starter: committed;
|                            # Pro: NOT committed — managed externally)
+-- app/
    +-- etc/
        +-- env.php          # Local equivalent (never committed anywhere)
```

**Exam focus:** Understand which files live in git and which do not. `.magento.env.yaml` on Pro and `app/etc/env.php` locally are NEVER committed to version control.

---

### 2.2 `routes.yaml`

Defines how incoming HTTP/HTTPS requests are routed to your application.

```yaml
# .magento/routes.yaml

"https://{default}/":
  type: upstream
  upstream: "myapp:http"
  cache:
    enabled: true
    headers:
      - Accept
      - Accept-Language
    cookies:
      - /^PHPSESS/
    default_ttl: 60

"https://www.{default}/":
  type: redirect
  to: "https://{default}/"

"https://admin.{default}/":
  type: upstream
  upstream: "myapp:http"
  cache:
    enabled: false   # Never cache admin routes
```

**Key concepts:**
- `{default}` resolves to the environment's primary domain
- `type: upstream` — routes to your application container
- `type: redirect` — HTTP redirect (do not forward to app)
- Cache headers/cookies control cache key composition
- Admin routes should always disable caching

**Architectural rationale:** Disabling cache on admin routes prevents stale admin UI and security bypass vectors where cached admin responses could be served to unauthenticated users.

---

### 2.3 `services.yaml`

Defines the backing services available to your application container.

```yaml
# .magento/services.yaml

mysql:
  type: mysql:10.4
  disk: 5120           # MB

redis-cache:
  type: redis:7.0

redis-session:
  type: redis:7.0

opensearch:
  type: opensearch:2.5
  disk: 1024

rabbitmq:
  type: rabbitmq:3.11
  disk: 512
```

**Critical rules for `services.yaml`:**

1. **Version pinning is required** — you must specify the major.minor version
2. **Major version upgrades for OpenSearch/Elasticsearch require a support ticket** — you cannot simply change the version number in yaml and deploy
3. **Two Redis instances** are the recommended pattern (one for cache, one for sessions) — prevents session loss during cache flush
4. Service names (e.g., `redis-cache`) are arbitrary labels you define — they must match references in `.magento.app.yaml`

**Exam focus:** Major OpenSearch/Elasticsearch upgrades require a support ticket because they involve index rebuilding and potential data migration at the infrastructure level. You cannot arbitrarily change `opensearch:1.2` to `opensearch:2.5` without coordinating with Adobe support.

---

### 2.4 `.magento.app.yaml`

The application container manifest — defines runtime, hooks, mounts, relationships, and resources.

```yaml
# .magento.app.yaml

name: myapp
type: php:8.1
build:
  flavor: none    # "none" = manage dependencies manually; "composer" = auto

dependencies:
  php:
    composer/composer: "^2.0"

runtime:
  extensions:
    - xsl
    - redis
    - blackfire

relationships:
  database: "mysql:mysql"
  redis-cache: "redis-cache:redis"
  redis-session: "redis-session:redis"
  opensearch: "opensearch:opensearch"
  rabbitmq: "rabbitmq:amqp"

web:
  locations:
    "/":
      root: "pub"
      passthru: "/index.php"
      allow: false
      rules:
        '\.(ico|jpg|jpeg|png|gif|svg|woff|woff2)$':
          allow: true
          expires: 1y
    "/static":
      root: "pub/static"
      allow: true
      passthru: "/front-static.php"
      rules:
        '\.(ico|jpg|jpeg|png|gif|svg|css|js)$':
          allow: true
          expires: 1y
    "/media":
      root: "pub/media"
      allow: true
      passthru: "/index.php"

mounts:
  "var":
    source: local
    source_path: "var"
  "pub/static":
    source: local
    source_path: "pub/static"
  "pub/media":
    source: local
    source_path: "pub/media"
  "app/etc":
    source: local
    source_path: "app/etc"

hooks:
  build: |
    set -e
    composer install --no-dev --prefer-dist --no-interaction
    php ./vendor/bin/ece-tools run scenario/build/generate.xml
    php ./vendor/bin/ece-tools run scenario/build/transfer.xml
  deploy: |
    php ./vendor/bin/ece-tools run scenario/deploy.xml
  post_deploy: |
    php ./vendor/bin/ece-tools run scenario/post-deploy.xml

disk: 5120
```

**Hook phases explained:**

```
  Build Hook                Deploy Hook             Post-Deploy Hook
  ----------                -----------             ----------------
  - No services available   - Services available    - App is live
  - Read-only filesystem*   - App is offline        - Warm cache
  - Install dependencies    - Run migrations        - Run smoke tests
  - Compile DI              - Config import         - Health checks
  - Generate static content - Reindex (optional)
  * mounts not mounted

  * "read-only" during build means no writable mounts yet
```

**Exam focus:** During the **build hook**, services (database, Redis) are NOT available. Any operation requiring a DB connection must happen in the **deploy hook** or later. Static content generation CAN happen in the build hook (and should, for production).

---

### 2.5 `.magento.env.yaml`

Runtime environment variable overrides for the `ece-tools` deploy pipeline.

```yaml
# .magento.env.yaml (Starter: committed to git; Pro: NOT committed)

stage:
  global:
    SKIP_HTML_MINIFICATION: true
    SCD_ON_DEMAND: false          # NEVER true in production

  build:
    SCD_STRATEGY: quick           # Options: quick, standard, compact
    SCD_THREADS: 4
    SKIP_SCD: false
    ERROR_REPORT_DIR_NESTING_LEVEL: 1

  deploy:
    SEARCH_CONFIGURATION:
      engine: opensearch
      opensearch_server_hostname: opensearch.internal
      opensearch_server_port: 9200
    CACHE_CONFIGURATION:
      frontend:
        default:
          backend: Cm_Cache_Backend_Redis
          backend_options:
            server: redis-cache.internal
            port: 6379
            database: 0
        page_cache:
          backend: Cm_Cache_Backend_Redis
          backend_options:
            server: redis-cache.internal
            port: 6379
            database: 1
    SESSION_CONFIGURATION:
      save: redis
      redis:
        host: redis-session.internal
        port: 6379
        database: 0
    CRON_CONSUMERS_RUNNER:
      cron_run: true
      max_messages: 1000

  post_deploy:
    WARM_UP_PAGES:
      - "index.php"
      - "index.php/customer/account/create"
```

**Exam focus:** On Pro, `.magento.env.yaml` is managed via `magento-cloud variable:set` or the Project Web UI, NOT committed to git. This is a deliberate security/governance decision — environment-specific secrets and configs should not be in source control, especially when Staging and Production share the same repository.

---

### 2.6 Relationship: Cloud Files vs Local `env.php`

```
  Cloud Platform                     Local Development
  --------------                     -----------------
  .magento.env.yaml  ------+          app/etc/env.php
  Cloud CLI variables       |          (never committed)
  Project Web UI vars       |
                            |
                            v
                    ece-tools generates
                    app/etc/env.php
                    at deploy time
                    (ephemeral, not in git)
```

**Key insight:** `app/etc/env.php` is the final merged result — it is generated by `ece-tools` from all variable sources during deployment. Never manually edit it on cloud environments; changes will be overwritten on next deploy.

---

## 3. Environment Variable Hierarchy

### 3.1 Variable Scope Levels

```
  Precedence (highest wins)
  ========================

  Level 3 (Highest): Sensitive Variables / Vault
  -----------------------------------------------
  - Stored encrypted in platform vault
  - Never exposed in logs or environment dumps
  - Set via Cloud CLI: magento-cloud variable:set --sensitive
  - Example: payment gateway API keys

  Level 2: Environment-level Variables
  --------------------------------------
  - Scoped to a specific environment (integration, staging, production)
  - Override project-level variables
  - Set via: magento-cloud variable:set --level environment

  Level 1 (Lowest): Project-level Variables
  ------------------------------------------
  - Apply to ALL environments in the project
  - Baseline configuration
  - Set via: magento-cloud variable:set --level project

  Special: env: prefix
  ---------------------
  - Variables prefixed with env: are injected directly into $_ENV
  - No prefix = available only via magento-cloud variable:get or MAGENTO_CLOUD_VARIABLES
```

### 3.2 The `env:` Prefix — Direct `$_ENV` Access

```bash
# Standard variable — accessed via MAGENTO_CLOUD_VARIABLES (base64 JSON blob)
magento-cloud variable:set --name MY_SETTING --value "foo"

# env: prefixed — accessible directly as $_ENV['MY_SETTING']
magento-cloud variable:set --name env:MY_SETTING --value "foo"
```

```php
<?php
// Without env: prefix — must decode MAGENTO_CLOUD_VARIABLES
$vars = json_decode(base64_decode($_ENV['MAGENTO_CLOUD_VARIABLES']), true);
$value = $vars['MY_SETTING'];

// With env: prefix — direct access
$value = $_ENV['MY_SETTING'];
```

**Exam focus:** The `env:` prefix is the mechanism for making a Cloud variable available as a native PHP `$_ENV` superglobal. Without this prefix, custom variables are only accessible through the `MAGENTO_CLOUD_VARIABLES` JSON blob. Exam scenarios may ask which approach is correct for a third-party extension that reads `$_ENV` directly.

---

### 3.3 Variable Hierarchy Decision Flow

```
  Application needs a config value
           |
           v
  Check env: variables (direct $_ENV injection)
           |
           v
  Check MAGENTO_CLOUD_VARIABLES blob
           |
           v
  Environment-level variables (most specific env wins)
           |
           v
  Project-level variables (global baseline)
           |
           v
  .magento.env.yaml values (Starter only via git;
                            Pro via Cloud UI/CLI)
           |
           v
  app/etc/config.php (committed config)
           |
           v
  Database configuration (admin panel settings)
```

---

## 4. Services Configuration

### 4.1 Why Two Redis Instances?

**Architectural rationale for separate cache and session Redis:**

```
  ONE Redis instance (anti-pattern for production):
  -------------------------------------------------
  Cache + Sessions --> redis:6379
  
  Problem: Cache flush (common operation) = session loss = ALL users logged out
  Problem: Cache eviction under memory pressure can evict session data
  Problem: No independent scaling of cache vs session storage needs

  TWO Redis instances (recommended pattern):
  ------------------------------------------
  Cache    --> redis-cache:6379   (volatile, LRU eviction OK)
  Sessions --> redis-session:6379 (persistent, NO eviction policy)
```

**Exam focus:** A scenario where "all users are being logged out when cache is flushed" indicates a single Redis instance handling both cache and sessions. The architectural fix is separate Redis instances with appropriate eviction policies (`allkeys-lru` for cache, `noeviction` or `volatile-lru` for sessions).

---

### 4.2 MySQL Configuration

```yaml
# services.yaml
mysql:
  type: mysql:10.4
  disk: 5120
  configuration:
    schemas:
      - main
    endpoints:
      mysql:
        default_schema: main
        privileges:
          main: admin
      reporter:
        default_schema: main
        privileges:
          main: ro      # Read-only endpoint for reporting queries
```

---

### 4.3 OpenSearch / Elasticsearch Version Upgrades

```
  Minor Version Upgrade (e.g., 2.3 -> 2.5):
  ------------------------------------------
  1. Update services.yaml
  2. Commit and push
  3. Platform handles upgrade automatically
  
  Major Version Upgrade (e.g., 1.x -> 2.x):
  -------------------------------------------
  1. Submit Adobe Support Ticket
  2. Adobe coordinates infrastructure upgrade
  3. Index rebuild required
  4. Potential downtime window negotiated
  
  WHY? Major ES/OS upgrades change index formats, 
  require reindexing all catalog/search data, and 
  may involve index mapping breaking changes.
```

**Exam focus:** This is a frequently tested "tricky" scenario. If an exam question asks "what is required to upgrade from Elasticsearch 7 to OpenSearch 2?" — the answer includes a support ticket, NOT just updating `services.yaml`.

---

### 4.4 RabbitMQ

```yaml
# services.yaml
rabbitmq:
  type: rabbitmq:3.11
  disk: 512
```

```yaml
# .magento.app.yaml relationships
rabbitmq: "rabbitmq:amqp"
```

**Use cases for RabbitMQ on Cloud:**
- Asynchronous order processing
- Inventory updates across sources
- B2B purchase order workflows
- Any high-volume async operation that should not block the web request

**Architectural decision:** Enable RabbitMQ + consumer processes when synchronous operations cause request timeouts or when you need guaranteed message delivery with retry logic.

---

## 5. Deployment Pipeline & Restrictions

### 5.1 Pro Deployment Chain (Critical Constraint)

```
  Developer                Integration           Staging            Production
  ---------                -----------           -------            ----------
  
  git push feature  -->   Integration env    (test here)
       |
       v
  magento-cloud             merge to master
  environment:push   -->   Integration master
                                  |
                                  v (must go through)
                           magento-cloud sync
                           or UI merge       -->   Staging env
                                                       |
                                                       v (after QA)
                                                  magento-cloud
                                                  environment:push
                                                  --target production  --> Production
                                                  OR
                                                  merge via UI
```

**Why can't you push directly to Staging/Production on Pro?**

1. **Cluster isolation** — Staging and Production are separate physical clusters not connected to the git-push pipeline the same way integration environments are
2. **Governance** — Forces code to be tested in Integration before reaching Staging; tested in Staging before Production
3. **Prevents accidental deployments** — A mis-aimed `git push` cannot accidentally deploy untested code to production
4. **Audit trail** — All promotions are logged through the merge chain

**Exam focus:** This is a scenario question trap. "A developer wants to quickly hotfix production by pushing directly to the production branch on Pro." This is architecturally WRONG — even hotfixes must go through the chain: integration → staging → production (though staging can sometimes be bypassed for emergency hotfixes via support, it is still not a direct push).

---

### 5.2 The Three Deployment Phases

```
  Phase 1: BUILD
  ==============
  Environment: Build container (isolated, no services)
  Filesystem: Read-only (mounts not yet mounted)
  
  Operations:
  - composer install
  - Compile Dependency Injection (di:compile)
  - Generate static content (if SCD_ON_DEMAND=false)
  - Copy assets to mounts staging area
  
  ece-tools command: scenario/build/generate.xml + scenario/build/transfer.xml

  Phase 2: DEPLOY
  ===============
  Environment: Production container (services available)
  Filesystem: Writable mounts available
  App state: OFFLINE (maintenance mode)
  
  Operations:
  - Mount filesystem
  - Import configuration (config:import)
  - Run DB schema upgrades (setup:db-schema:upgrade)
  - Run DB data upgrades (setup:db-data:upgrade)
  - Flush cache
  - Disable maintenance mode
  
  ece-tools command: scenario/deploy.xml

  Phase 3: POST-DEPLOY
  ====================
  Environment: Production container (services available)
  App state: ONLINE (serving traffic)
  
  Operations:
  - Cache warm-up (configured WARM_UP_PAGES)
  - Smoke tests
  - Health checks
  
  ece-tools command: scenario/post-deploy.xml
```

---

### 5.3 Zero-Downtime Deploy Strategy

Pro production uses **rolling deploy** across the 3-node cluster:

```
  Production cluster (3 nodes):
  
  Node 1: [Serving traffic] ---> [Deploy] ---> [Back to traffic]
  Node 2: [Serving traffic]                --> [Deploy] ---> [Back]
  Node 3: [Serving traffic]                               --> [Deploy]
  
  Load balancer routes around deploying nodes
  Result: No user-visible downtime
```

---

## 6. Fastly CDN Architecture

### 6.1 Fastly in the Commerce Cloud Stack

```
  User Request Flow:
  
  User --> Fastly Edge (CDN) --> Origin Shield --> Commerce App
              |
              |-- Cache HIT: return cached response immediately
              |
              +-- Cache MISS: forward to origin, cache response
```

**Fastly is mandatory on Pro and Starter Production** — it is the only supported full-page cache CDN for Adobe Commerce Cloud.

---

### 6.2 VCL Snippets

Custom VCL (Varnish Configuration Language) snippets extend Fastly behavior without replacing the default Adobe VCL.

```vcl
// Example: Custom VCL snippet to block a specific IP
// Type: recv (runs on every request received by Fastly)
// Priority: 5 (lower number = higher priority)

if (req.http.X-Forwarded-For == "192.168.1.100") {
  error 403 "Forbidden";
}
```

**VCL snippet types (execution order):**

| Type | When it runs | Common use |
|---|---|---|
| `recv` | On request received | Block IPs, set conditions |
| `hash` | Building cache key | Vary cache by custom criteria |
| `hit` | On cache HIT | Modify cached response |
| `miss` | On cache MISS | Before forwarding to origin |
| `pass` | On cache bypass | Force-pass logic |
| `fetch` | Response from origin | Modify before caching |
| `deliver` | Before sending to client | Add response headers |
| `error` | On Fastly error | Custom error pages |

**Exam focus:** VCL snippets are additive to the Adobe-managed base VCL. If you need to completely replace the VCL, you must upload a full custom VCL — but Adobe strongly discourages this as it breaks when the platform updates its base VCL.

---

### 6.3 Surrogate Keys (Cache Tags)

Surrogate keys enable targeted cache invalidation — purge only the cached responses that contain a specific product, category, or CMS block.

```
  How it works:
  
  1. Commerce sets X-Magento-Tags response header:
     X-Magento-Tags: cat_1,cat_2,p_42,p_43,cms_5
  
  2. Fastly stores these as surrogate keys with the cached response
  
  3. When product 42 updates, Commerce calls Fastly API:
     POST /service/{id}/purge
     Surrogate-Key: p_42
  
  4. Fastly invalidates ALL cached pages tagged with p_42
     (product detail page, category pages containing it, etc.)
```

**Architectural advantage:** Without surrogate keys, a product update requires either:
- Full cache purge (destroys all cached content, massive origin load)
- Time-based expiry (stale content until TTL expires)

With surrogate keys: surgical invalidation of only affected pages.

---

### 6.4 Image Optimization

Fastly image optimization is enabled in `.magento.env.yaml`:

```yaml
# .magento.env.yaml
stage:
  global:
    # Fastly image optimization
    FASTLY_IMAGE_OPTIMIZATION: true
```

Capabilities:
- On-the-fly resizing, cropping, format conversion (WebP)
- Serves different sizes/formats to different devices
- Reduces origin storage requirements for multiple image variants
- WebP conversion reduces payload 25-35% vs JPEG without visible quality loss

---

## 7. Static Content Deployment Strategy

### 7.1 `SCD_ON_DEMAND` — The Critical Trade-off

This is one of the most exam-tested topics in Cloud architecture.

```
  SCD_ON_DEMAND=true (Deferred Static Content)
  =============================================
  
  Build phase:    Skip static content generation (faster build/deploy)
  First request:  Static files generated on-the-fly (SLOW first request)
  
  +--------------------+------------------------------------+
  | Advantage          | Detriment                          |
  +--------------------+------------------------------------+
  | Fast deployments   | First user after deploy gets a     |
  | Good for dev/integ | latency spike (seconds of wait)    |
  | No "unused" static | High CPU/IO spike on first request |
  | files generated    | Cannot use with page cache warm-up |
  +--------------------+------------------------------------+

  SCD_ON_DEMAND=false (Pre-generated Static Content) [PRODUCTION DEFAULT]
  ========================================================================
  
  Build phase:    ALL static content generated upfront (slower build)
  First request:  Static files already on disk (fast response)
  
  +----------------------+----------------------------------+
  | Advantage            | Detriment                        |
  +----------------------+----------------------------------+
  | No latency spike     | Longer build/deploy time         |
  | Consistent response  | Generates files for all locales  |
  | Works with CDN warm  | even rarely-used ones            |
  | Zero-downtime ready  |                                  |
  +----------------------+----------------------------------+
```

**Exam focus — Architectural decision:** 

- `SCD_ON_DEMAND=true` is **correct for integration environments** — fast iteration matters more than first-request latency
- `SCD_ON_DEMAND=true` is **wrong for production** — the latency spike after every deployment is user-visible and can cause a thundering-herd problem under load
- `SCD_ON_DEMAND=false` is **required for production zero-downtime deployment**

**Scenario trap:** "A merchant complains that after every deployment, the first few customers experience very slow page loads. What is the cause?" Answer: `SCD_ON_DEMAND=true` is set in production — change to `false` and pre-generate static content.

---

### 7.2 SCD Strategy Options

```yaml
# .magento.env.yaml
stage:
  build:
    SCD_STRATEGY: quick       # Default — generate only deployed themes
    # SCD_STRATEGY: standard  # Generate all static files (slowest, most complete)
    # SCD_STRATEGY: compact   # Symlinks where possible (fastest, fewest files)
    SCD_THREADS: 4            # Parallel threads for SCD generation
    SCD_COMPRESSION_LEVEL: 4  # gzip compression level (0-9)
```

| Strategy | Speed | Disk usage | Use case |
|---|---|---|---|
| `quick` | Fast | Medium | Default for Cloud |
| `standard` | Slow | High | When `quick` misses files |
| `compact` | Fastest | Low | Dev/integration only |

---

### 7.3 `SKIP_HTML_MINIFICATION` — Build vs Deploy Trade-off

```yaml
stage:
  global:
    SKIP_HTML_MINIFICATION: true  # Recommended for Cloud
```

**Why `true` is recommended:**
- When `false`: HTML is minified during build (slows build, but faster at runtime)
- When `true`: HTML minification deferred to deploy phase or skipped entirely
- On Cloud, the build container is ephemeral and shared — minimizing build time improves pipeline efficiency

---

## 8. Cloud CLI Reference

### 8.1 Essential Commands

```bash
# --- Authentication & Project Management ---

# Login
magento-cloud login

# List all projects
magento-cloud projects

# Set active project
magento-cloud project:set-remote <project-id>

# List environments
magento-cloud environments

# --- SSH Access ---

# SSH into environment (defaults to current branch's environment)
magento-cloud ssh

# SSH into specific environment
magento-cloud ssh --environment staging

# SSH into specific app/service
magento-cloud ssh --environment production --app myapp

# --- Database Operations ---

# Dump database from environment
magento-cloud db:dump --environment staging

# Dump with specific file output
magento-cloud db:dump --environment production --file /tmp/prod-backup.sql.gz

# Open MySQL CLI on environment
magento-cloud db:sql --environment staging

# Import SQL file into environment
magento-cloud db:sql --environment integration < /tmp/backup.sql

# --- Environment Operations ---

# Push current branch to environment
magento-cloud environment:push

# Push to specific environment
magento-cloud environment:push --environment integration-2

# Merge environment into its parent
magento-cloud environment:merge --environment feature-x

# Sync parent changes into current environment
magento-cloud environment:synchronize code data

# Branch (create new environment from current)
magento-cloud environment:branch my-feature

# --- Snapshots (Backups) ---

# Create manual snapshot
magento-cloud snapshot:create --environment staging

# List snapshots
magento-cloud snapshot:list --environment production

# Restore snapshot
magento-cloud snapshot:restore <snapshot-id> --environment staging

# --- Variables ---

# Set project-level variable
magento-cloud variable:set --level project MY_VAR "value"

# Set environment-level variable
magento-cloud variable:set --level environment --environment staging MY_VAR "value"

# Set sensitive variable (encrypted, never logged)
magento-cloud variable:set --sensitive MY_SECRET "value"

# Set env:-prefixed variable (direct $_ENV injection)
magento-cloud variable:set --name env:MY_DIRECT_VAR "value"

# List variables
magento-cloud variable:list

# --- Logs ---

# Tail deploy log
magento-cloud log --environment staging deploy

# Tail application log
magento-cloud log --environment production app

# Available log types: deploy, access, error, php.access, cron, rabbitmq
```

---

### 8.2 Tunnel & Local Development

```bash
# Open SSH tunnel to remote services (for local debugging)
magento-cloud tunnel:open --environment integration

# List open tunnels
magento-cloud tunnel:list

# Close tunnels
magento-cloud tunnel:close
```

---

## 9. Disaster Recovery: Snapshots & Backups

### 9.1 Snapshot Architecture

**What a snapshot contains:**
- Full filesystem state (mounted volumes: var, pub/static, pub/media, app/etc)
- Database dump (point-in-time)
- NOT: the application code (that's in git)

```
  Snapshot Components:
  
  +------------------+  +------------------+
  | Database Dump    |  | Filesystem State |
  | (point-in-time)  |  | (mounts only)    |
  +------------------+  +------------------+
         |                      |
         +----------+-----------+
                    |
              Snapshot ID
              (stored in Fastly
               infrastructure)
```

---

### 9.2 Starter vs Pro: Backup & Recovery

| Attribute | Starter | Pro |
|---|---|---|
| Automated backups | Daily (retained 7 days) | Daily (retained 14 days) |
| Manual snapshots | Yes | Yes |
| Point-in-time recovery | No | Yes (Pro Production) |
| RTO (Recovery Time Objective) | ~1-2 hours | ~1 hour (Pro Production) |
| RPO (Recovery Point Objective) | ~24 hours (daily backup) | ~1 hour (PITR on Prod) |
| Staging backups | Manual only | Daily automated |
| Backup responsibility | Shared (Adobe provides tool, merchant must verify) | Adobe managed |

**Exam focus:** Pro Production supports **point-in-time recovery (PITR)** — you can restore to any point within the retention window, not just daily snapshot points. This dramatically improves RPO for Pro compared to Starter.

---

### 9.3 Backup Strategy Best Practices

```bash
# Before major deployments — create manual snapshot
magento-cloud snapshot:create --environment production
magento-cloud snapshot:create --environment staging

# Verify snapshot exists
magento-cloud snapshot:list --environment production

# Document the snapshot ID for quick reference during deployment
```

**Recommended pre-deployment checklist:**
1. Create manual snapshot of Production
2. Create manual snapshot of Staging
3. Verify database dump is accessible
4. Confirm rollback procedure with team
5. Set deployment window (low-traffic period)
6. Have Cloud CLI ready for `snapshot:restore` if needed

---

### 9.4 Recovery Procedure

```bash
# Emergency rollback via snapshot
magento-cloud snapshot:restore <snapshot-id> --environment production

# Post-restore verification
magento-cloud ssh --environment production
php bin/magento maintenance:status
php bin/magento cache:status
php bin/magento indexer:status
```

**Important:** Snapshot restore puts the environment in maintenance mode during restore. On Pro Production (3-node), this means user-facing downtime during the restore window (~15-30 minutes typically).

---

## 10. Architectural Decision Patterns

### 10.1 Exam Scenario Framework

The Adobe Architect exam presents scenarios where multiple answers are **technically valid** but one is **architecturally superior**. Apply this framework:

```
  For each scenario, evaluate:
  
  1. CORRECTNESS: Does it work at all?
  2. SECURITY: Does it expose sensitive data?
  3. SCALABILITY: Does it hold under load?
  4. OPERABILITY: Can teams manage it reliably?
  5. PLATFORM ALIGNMENT: Does it use Cloud features correctly?
```

---

### 10.2 Common Scenario Patterns

**Scenario: Environment-specific configuration in Pro**

```
  Question: A developer needs different payment gateway credentials
  for integration vs production. Where should these be stored?
  
  Wrong answers:
  A) Hardcode in app/etc/config.php (committed to git - SECURITY RISK)
  B) Store in .magento.env.yaml and commit (Pro = NOT committed, wrong)
  C) Store in app/etc/env.php directly (overwritten on deploy)
  
  Correct answer:
  D) Use magento-cloud variable:set --sensitive --level environment
     for each environment separately, with env: prefix for direct access
  
  Why architecturally superior:
  - Encrypted at rest
  - Per-environment scoping
  - Never in version control
  - Audit trail via Cloud CLI/UI
```

**Scenario: Performance after deployment**

```
  Question: After each deployment, production sees a 10-second latency
  spike on first page load. What is the root cause and fix?
  
  Root cause: SCD_ON_DEMAND=true in production .magento.env.yaml
  
  Fix options (ranked by quality):
  1. Set SCD_ON_DEMAND=false + pre-generate static content in build (BEST)
  2. Set SCD_ON_DEMAND=false + configure WARM_UP_PAGES post-deploy (GOOD)
  3. Increase web server timeout to absorb spike (WRONG - treats symptom)
  4. Add more servers (WRONG - scale doesn't fix architecture problem)
```

**Scenario: Session management**

```
  Question: Users are randomly logged out after cache flushes.
  Current config: one Redis instance for everything.
  
  Wrong fix: Increase Redis memory
  Wrong fix: Reduce cache TTL
  
  Correct fix: Separate Redis instances
  - redis-cache: for FPC and block cache (LRU eviction OK)
  - redis-session: for sessions (noeviction policy)
  
  Architectural reason: Cache eviction/flushing must not affect sessions.
  These are fundamentally different data persistence requirements.
```

**Scenario: Upgrade path for OpenSearch**

```
  Question: Merchant needs to upgrade from Elasticsearch 7.x to 
  OpenSearch 2.x. Developer updates services.yaml and pushes. 
  What happens?
  
  Answer: Deployment may fail or behave unexpectedly. Major version
  upgrades require a support ticket because:
  - Infrastructure-level changes needed
  - Index format changes between major versions
  - Reindexing required (catalog_search, catalogsearch_fulltext)
  - Potential index mapping incompatibilities
  
  Correct process:
  1. Submit Adobe Support ticket requesting major version upgrade
  2. Coordinate upgrade window
  3. Plan for full reindex after upgrade
  4. Update services.yaml as directed by support
```

---

### 10.3 File Commitment Decision Tree

```
  Should this file be committed to git?
  
  app/etc/env.php              --> NEVER (local only, generated on Cloud)
  app/etc/config.php           --> YES (non-sensitive system configuration)
  .magento.env.yaml (Starter)  --> YES
  .magento.env.yaml (Pro)      --> NO (managed via CLI/UI)
  .magento/routes.yaml         --> YES
  .magento/services.yaml       --> YES
  .magento.app.yaml            --> YES
  var/*                        --> NO (.gitignore)
  pub/static/*                 --> NO (.gitignore, generated at build)
  vendor/*                     --> NO (.gitignore, composer install)
```

---

### 10.4 Build vs Deploy — When to Run What

```
  RULE: "Can this run without a database/services connection?"
  
  YES -> Build hook (faster, parallel with other builds)
  NO  -> Deploy hook (slower, sequential, services available)
  
  Build hook candidates:
  - composer install
  - DI compilation (bin/magento setup:di:compile)
  - Static content deployment (when SCD_ON_DEMAND=false)
  - Asset compilation (Less, Sass, JS bundling)
  
  Deploy hook candidates:
  - Database schema/data upgrades
  - Configuration import (app:config:import)
  - Cache flush
  - Indexer operations (if needed post-deploy)
  
  Post-deploy hook candidates:
  - Cache warm-up
  - Smoke tests
  - Health checks
  - Performance monitoring triggers
```

---

### 10.5 Pro Environment Chain — Hotfix Scenario

```
  Standard flow:
  feature-branch -> integration -> staging -> production
  
  Emergency hotfix flow (still must use chain):
  
  1. Create hotfix branch from production tag/SHA
  2. Apply fix, test in integration environment
  3. Create staging snapshot (safety net)
  4. Merge/push to staging (verify fix)
  5. Create production snapshot (safety net)
  6. Merge to production via approved process
  
  NOTE: Even in emergencies, never bypass staging unless Adobe 
  Support explicitly facilitates an emergency production push.
  Bypassing staging risks deploying untested code to production.
```

---

## Quick-Reference Checklist

### Environment Architecture
- [ ] **Starter**: 4 environments total (3 integration + 1 production), single shared cluster
- [ ] **Pro**: 8 integration + dedicated Staging cluster + dedicated Production cluster (HA 3-node)
- [ ] Starter `.magento.env.yaml` IS committed to git; Pro's is NOT
- [ ] Pro Staging and Production cannot receive direct git pushes — must merge through chain
- [ ] Pro Production uses rolling deploy across 3 nodes for zero-downtime

### Configuration Files
- [ ] `routes.yaml`: HTTP routing, caching rules, redirects; always disable cache on `/admin`
- [ ] `services.yaml`: Defines MySQL, Redis (×2), OpenSearch, RabbitMQ with version pinning
- [ ] `.magento.app.yaml`: PHP version, hooks, mounts, relationships, disk allocation
- [ ] `.magento.env.yaml`: Runtime overrides for ece-tools; Pro = not committed
- [ ] `app/etc/env.php`: Generated by ece-tools at deploy time; NEVER manually edit on cloud; never commit anywhere

### Environment Variables
- [ ] Hierarchy: project → environment → sensitive (sensitive wins)
- [ ] `env:` prefix makes variable available directly as `$_ENV['VAR_NAME']`
- [ ] Without `env:` prefix, access via `MAGENTO_CLOUD_VARIABLES` (base64-encoded JSON blob)
- [ ] Use `--sensitive` flag for credentials/API keys (encrypted, never logged)
- [ ] `--level environment` scopes variable to specific environment

### Services
- [ ] Always use TWO Redis instances: one for cache (LRU eviction), one for sessions (no eviction)
- [ ] Single Redis = cache flush = user session loss (architectural anti-pattern)
- [ ] Minor OS/ES version: update `services.yaml` and push
- [ ] **Major OS/ES version upgrade requires Adobe Support ticket** — not a self-service operation
- [ ] RabbitMQ for async order processing, inventory, B2B workflows

### Static Content Deployment
- [ ] `SCD_ON_DEMAND=true` → defers generation to first request → latency spike → **WRONG for production**
- [ ] `SCD_ON_DEMAND=true` → fast deploys, no unused files → **correct for integration**
- [ ] `SCD_ON_DEMAND=false` → pre-generates all static content → required for production zero-downtime
- [ ] `SCD_STRATEGY: quick` (default), `standard` (complete), `compact` (dev only)
- [ ] `SKIP_HTML_MINIFICATION: true` is recommended on Cloud (reduces build time)

### Deployment Phases
- [ ] **Build hook**: No services, no DB, generates static content, runs `composer install`
- [ ] **Deploy hook**: Services available, app offline, runs migrations and config import
- [ ] **Post-deploy hook**: App live, runs cache warm-up and smoke tests
- [ ] Any DB operation MUST be in deploy hook or later — build hook has no DB access

### Fastly CDN
- [ ] Fastly is mandatory on all Cloud production environments
- [ ] VCL snippets are additive to Adobe base VCL (do not replace)
- [ ] VCL snippet types: `recv`, `hash`, `hit`, `miss`, `pass`, `fetch`, `deliver`, `error`
- [ ] Surrogate keys (`X-Magento-Tags`) enable surgical cache invalidation by tag
- [ ] Surrogate keys avoid full cache purges when individual products/categories update
- [ ] Image optimization: on-the-fly resizing, WebP conversion, reduces payload 25-35%

### Cloud CLI Key Commands
- [ ] `magento-cloud ssh --environment <env>` — SSH into environment
- [ ] `magento-cloud db:dump --environment <env>` — Database dump
- [ ] `magento-cloud snapshot:create --environment <env>` — Manual backup
- [ ] `magento-cloud snapshot:restore <id> --environment <env>` — Restore
- [ ] `magento-cloud environment:push` — Push current branch
- [ ] `magento-cloud environment:merge` — Merge into parent
- [ ] `magento-cloud variable:set --sensitive --level environment` — Secure var

### Disaster Recovery
- [ ] Starter: Daily automated backups, 7-day retention, ~24hr RPO, ~1-2hr RTO
- [ ] Pro: Daily automated backups, 14-day retention, ~1hr RPO (PITR on Prod), ~1hr RTO
- [ ] Pro Production supports point-in-time recovery (PITR) — significantly better RPO
- [ ] Always create manual snapshot BEFORE major deployments
- [ ] Snapshot restore causes downtime; plan accordingly for Pro Production

### Architectural Decision Rules (Exam Traps)
- [ ] Latency spike after deploy → `SCD_ON_DEMAND=true` in production (fix: set to false)
- [ ] Users logged out on cache flush → single Redis instance (fix: separate instances)
- [ ] Major ES/OS upgrade → support ticket required (not just `services.yaml` change)
- [ ] Sensitive credentials → `--sensitive --level environment` variable (not in git)
- [ ] Hotfix on Pro → still must traverse integration → staging → production chain
- [ ] Static files/vendor/env.php → NEVER commit to git
- [ ] Build hook fails with DB error → operation belongs in deploy hook, not build hook
