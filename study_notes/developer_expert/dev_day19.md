# Day 19 — Cloud Setup, Configuration & CLI
## Adobe Commerce on Cloud Infrastructure: Complete Study Notes

---

## Table of Contents

1. [Overview: Adobe Commerce on Cloud](#1-overview-adobe-commerce-on-cloud)
2. [magento-cloud CLI](#2-magento-cloud-cli)
3. [ece-tools: Build & Deploy Hooks](#3-ece-tools-build--deploy-hooks)
4. [Environment Variables](#4-environment-variables)
5. [Static Content Deploy (SCD)](#5-static-content-deploy-scd)
6. [Deployment Pipeline Phases](#6-deployment-pipeline-phases)
7. [Zero-Downtime Deployment](#7-zero-downtime-deployment)
8. [Patches on Cloud](#8-patches-on-cloud)
9. [Fastly Configuration](#9-fastly-configuration)
10. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Overview: Adobe Commerce on Cloud

Adobe Commerce on Cloud Infrastructure is a **managed, automated hosting platform** built on a PaaS (Platform-as-a-Service) model. It combines:

| Component | Purpose |
|---|---|
| **magento-cloud CLI** | Developer-facing tool to manage projects, environments, SSH, DB |
| **ece-tools** | Build/deploy automation package executed inside the cloud environment |
| **`.magento.env.yaml`** | Primary configuration file for environment variables and phase settings |
| **`.magento/`** | Directory for routes, services, and application config |
| **Fastly** | CDN, WAF, image optimization, full-page cache on Pro/Starter |

### Cloud Environment Types

```
Production  (live traffic, Fastly CDN)
    |
Staging     (mirrors Production, integration testing)
    |
Integration (development branches, limited resources)
```

**Exam focus:**
- **Integration** environments have no Fastly, no production-grade services
- **Staging** mirrors Production topology — used for UAT before go-live
- **Pro** plan has dedicated Production + Staging; **Starter** plan uses branches

---

## 2. magento-cloud CLI

### Installation & Authentication

```bash
# Install the CLI
curl -sS https://accounts.magento.cloud/cli/installer | php

# Login (opens browser OAuth flow)
magento-cloud login

# Verify authentication
magento-cloud auth:info
```

**Exam focus:**
- `magento-cloud login` uses **OAuth** — it opens a browser-based auth flow, not username/password in the terminal

---

### Core Commands Reference

#### Project Management

```bash
# List all projects for your account
magento-cloud project:list

# Get details for a specific project
magento-cloud project:info --project=<PROJECT_ID>

# Set a default project for subsequent commands
magento-cloud project:set-remote <PROJECT_ID>
```

#### Environment Management

```bash
# List all environments in a project
magento-cloud environment:list
magento-cloud environments   # alias

# Switch/checkout an environment locally
magento-cloud environment:checkout <ENVIRONMENT_ID>

# Show environment info (URLs, services, etc.)
magento-cloud environment:info

# Activate/deactivate an environment
magento-cloud environment:activate <ENVIRONMENT_ID>
magento-cloud environment:deactivate <ENVIRONMENT_ID>

# Delete an environment
magento-cloud environment:delete <ENVIRONMENT_ID>
```

**Exam focus:**
- `environment:list` shows **branch name**, **status** (active/inactive), and **URL**
- Inactive environments are **not deployed** and consume no compute resources

---

#### SSH Access

```bash
# SSH into the current environment's application container
magento-cloud ssh

# SSH into a specific environment
magento-cloud ssh --environment=staging

# SSH into a specific app (multi-app projects)
magento-cloud ssh --app=myapp --environment=production

# Run a single command over SSH
magento-cloud ssh -- "php bin/magento cache:flush"
```

**Exam focus:**
- SSH gives you access to the **application container**, not the database host directly
- Use `--environment` flag to target non-default environments

---

#### Database Operations

```bash
# Dump the database from a remote environment to local file
magento-cloud db:dump

# Dump from a specific environment
magento-cloud db:dump --environment=staging

# Dump to a specific file
magento-cloud db:dump --file=staging_dump.sql

# Dump and gzip compress
magento-cloud db:dump --gzip

# Open an interactive MySQL shell (tunneled)
magento-cloud db:sql --environment=staging
```

**Exam focus:**
- `db:dump` creates a **local** SQL file by tunneling through SSH — the database never leaves the cloud environment as a raw connection
- `db:sql` opens an interactive session — useful for running quick queries

---

#### Code & Deployment

```bash
# Push current git branch to cloud environment
magento-cloud environment:push

# Push a specific local branch to a named environment
magento-cloud environment:push --target=<ENVIRONMENT_ID>

# Force push (override diverged history)
magento-cloud environment:push --force

# View deployment/build logs
magento-cloud activity:log

# List recent activities (deployments, backups, etc.)
magento-cloud activities
```

**Exam focus:**
- `environment:push` is a **git push** under the hood — it triggers the ece-tools build/deploy pipeline automatically
- Alternatively, plain `git push origin <branch>` works the same way

---

#### Tunnel & Port Forwarding

```bash
# Open an SSH tunnel to all services (DB, Redis, etc.)
magento-cloud tunnel:open

# List open tunnels
magento-cloud tunnel:list

# Close all tunnels
magento-cloud tunnel:close
```

---

### Complete CLI Command Summary Table

| Command | Purpose |
|---|---|
| `magento-cloud login` | Authenticate via OAuth |
| `magento-cloud project:list` | List all cloud projects |
| `magento-cloud environment:list` | List environments in a project |
| `magento-cloud environment:push` | Push code branch to cloud |
| `magento-cloud ssh` | SSH into app container |
| `magento-cloud db:dump` | Dump remote database locally |
| `magento-cloud db:sql` | Interactive MySQL shell |
| `magento-cloud tunnel:open` | Tunnel to remote services |
| `magento-cloud activity:log` | View build/deploy logs |
| `magento-cloud environment:branch` | Create a new branch/environment |

---

## 3. ece-tools: Build & Deploy Hooks

`ece-tools` is the **Magento Cloud Tools** package (`magento/ece-tools`) that orchestrates all build and deployment steps inside the cloud platform.

### Package Structure

```
vendor/magento/ece-tools/
  src/
    Command/
      Build/      -> cloud:build subcommands
      Deploy/     -> cloud:deploy subcommands
      PostDeploy/ -> cloud:post-deploy subcommands
  config/
    schema.json   -> .magento.env.yaml validation schema
```

---

### Hooks Configuration in `.magento.app.yaml`

```yaml
hooks:
  build: |
    set -e
    php ./vendor/bin/ece-tools run scenario/build/generate.xml
    php ./vendor/bin/ece-tools run scenario/build/transfer.xml

  deploy: |
    php ./vendor/bin/ece-tools run scenario/deploy.xml

  post_deploy: |
    php ./vendor/bin/ece-tools run scenario/post-deploy.xml
```

**Exam focus:**
- Hooks are defined in **`.magento.app.yaml`** (not `env.yaml`)
- The **build hook** runs first, with **no services available** (no DB, no Redis)
- The **deploy hook** runs with services but puts the site in **maintenance mode**
- The **post_deploy hook** runs after the site is live again

---

### ece-tools Scenarios (XML-based Pipeline)

Modern `ece-tools` uses **scenarios** — XML files that define ordered steps.

```bash
# Build phase scenarios
php ./vendor/bin/ece-tools run scenario/build/generate.xml
php ./vendor/bin/ece-tools run scenario/build/transfer.xml

# Single combined command (legacy / shorthand)
php ./vendor/bin/ece-tools cloud:build

# Deploy phase
php ./vendor/bin/ece-tools cloud:deploy

# Post-deploy phase
php ./vendor/bin/ece-tools cloud:post-deploy
```

---

### Build Phase Steps (scenario/build/generate.xml)

```
1. Validate configuration (.magento.env.yaml)
2. Copy configuration files
3. Generate dependency injection (di:compile)
4. Deploy static content (if SCD on build — default)
5. Compress static content
6. Generate .magento.env.php (merged config)
```

**Exam focus:**
- **SCD during build** is the default and preferred strategy for zero-downtime
- `di:compile` runs during **build**, not deploy
- No database connection exists during build

---

### Deploy Phase Steps (scenario/deploy.xml)

```
1. Enable maintenance mode
2. Backup and update database (schema:upgrade, data:upgrade)
3. Clear cache
4. Update URLs and configuration
5. Disable maintenance mode
```

**Exam focus:**
- The site is in **maintenance mode** during the deploy phase
- `setup:upgrade` (schema + data upgrades) runs here
- Deploy phase has **full service access** (DB, Redis, Elasticsearch)

---

### Post-Deploy Phase Steps (scenario/post-deploy.xml)

```
1. Disable maintenance mode (if not already)
2. Warm up the cache (page crawl)
3. Enable/check cron jobs
4. Send deployment notification
```

**Exam focus:**
- **Cache warming** happens in **post-deploy**, not deploy
- This is the phase for zero-downtime optimization

---

### Customizing Scenarios

You can extend or override built-in scenarios using custom XML:

```xml
<!-- custom-deploy.xml -->
<scenario xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:noNamespaceSchemaLocation="urn:magento:ece-tools:config/scenario.xsd">
    <step name="compress-static-content"
          type="Magento\MagentoCloud\Step\Deploy\CompressStaticContent"
          priority="500"/>
</scenario>
```

```yaml
# .magento.app.yaml - reference custom scenario
hooks:
  deploy: |
    php ./vendor/bin/ece-tools run scenario/deploy.xml custom-deploy.xml
```

---

## 4. Environment Variables

### Configuration File: `.magento.env.yaml`

This is the **primary configuration file** for controlling ece-tools behavior per environment.

```yaml
stage:
  global:
    SKIP_HTML_MINIFICATION: true
    SCD_ON_DEMAND: true

  build:
    SCD_STRATEGY: compact
    SCD_THREADS: 4
    SKIP_SCD: false

  deploy:
    SEARCH_CONFIGURATION:
      engine: elasticsearch7
      elasticsearch_server_hostname: elasticsearch
    SESSION_CONFIGURATION:
      save: redis
      redis:
        server: redis

  post_deploy:
    WARM_UP_PAGES:
      - "index.php/"
      - "index.php/customer/account/create"
```

---

### MAGENTO_CLOUD_VARIABLES

`MAGENTO_CLOUD_VARIABLES` is a **base64-encoded JSON** environment variable injected by the platform that contains project-level and environment-level custom variables you set in the Cloud UI or CLI.

```bash
# Set a variable via CLI
magento-cloud variable:set --name=ADMIN_EMAIL --value="admin@example.com"

# Set with environment scope
magento-cloud variable:set --name=REPORTS_ENABLED --value=false \
  --environment=production --level=environment

# List all variables
magento-cloud variable:list
```

Inside the container, `MAGENTO_CLOUD_VARIABLES` is available as:

```bash
echo $MAGENTO_CLOUD_VARIABLES
# Outputs: eyJBRE1JTl9FTUFJTCI6ImFkbWluQGV4YW1wbGUuY29tIn0=

# Decode it
echo $MAGENTO_CLOUD_VARIABLES | base64 --decode
# {"ADMIN_EMAIL":"admin@example.com"}
```

**Exam focus:**
- `MAGENTO_CLOUD_VARIABLES` is **base64-encoded JSON**
- Variables set at the **environment level** override **project level**
- Variables can be marked **sensitive** (not shown in UI/CLI output after set) or **non-sensitive**

---

### env: Prefix vs Global Variables

#### Variable Scopes and Prefixes

| Prefix/Scope | Description | Example |
|---|---|---|
| `env:` | Overrides a specific PHP environment variable | `env:CACHE_CONFIGURATION` |
| `global:` stage | Applies across all phases (build/deploy/post-deploy) | `SCD_ON_DEMAND` |
| `build:` stage | Applies only during build phase | `SCD_STRATEGY` |
| `deploy:` stage | Applies only during deploy phase | `SEARCH_CONFIGURATION` |
| `post_deploy:` stage | Applies only during post-deploy | `WARM_UP_PAGES` |

#### env: Prefix for Application-Level Variables

Variables with the `env:` prefix in `.magento.env.yaml` **directly override environment variables** seen by the PHP application at runtime:

```yaml
stage:
  deploy:
    # This sets env var: MAGENTO_CLOUD_RELATIONSHIPS
    # env: prefix means it becomes a real env variable
    DATABASE_CONFIGURATION:
      connection:
        default:
          host: "127.0.0.1"
```

#### Cloud Variable Levels

```
Project Level (affects all environments)
    |
    v
Environment Level (overrides project for that environment)
    |
    v
Application Level (.magento.env.yaml — checked into code)
```

**Exam focus:**
- **`env:` prefix** variables in the Cloud UI/CLI set actual OS-level environment variables (e.g., `env:SOME_VAR` becomes `SOME_VAR` in the container)
- **`global` stage** in `.magento.env.yaml` applies to ALL phases — use sparingly
- Environment-level variables **always win** over project-level variables

---

### Common Important Variables

```yaml
stage:
  global:
    # Skip HTML minification in pub/static during build
    SKIP_HTML_MINIFICATION: true

    # Enable SCD on first web request (not during build/deploy)
    SCD_ON_DEMAND: true

    # Minimum logging level (DEBUG, INFO, NOTICE, WARNING, ERROR)
    MIN_LOGGING_LEVEL: WARNING

  build:
    # SCD strategy: compact | quick | standard
    SCD_STRATEGY: compact

    # Number of parallel SCD threads
    SCD_THREADS: 4

    # Skip static content deployment entirely
    SKIP_SCD: false

    # Verbosity for SCD
    VERBOSE_COMMANDS: "-vv"

  deploy:
    # Cache backend configuration
    CACHE_CONFIGURATION:
      frontend:
        default:
          backend: Magento\Framework\Cache\Backend\Redis
          backend_options:
            server: redis
            port: 6379

    # Cron consumers to run
    CRON_CONSUMERS_RUNNER:
      cron_run: true
      max_messages: 1000

  post_deploy:
    # Pages to warm up after deploy
    WARM_UP_PAGES:
      - "index.php/"
      - "index.php/catalog/category/view/id/1"
```

---

## 5. Static Content Deploy (SCD)

SCD generates static files (CSS, JS, images, fonts) and places them in `pub/static/`.

### SCD Strategies

| Strategy | Description | Best For |
|---|---|---|
| **compact** | Deploys static content for the **current locale only**, then symlinks others | Most cloud deployments — fastest |
| **quick** | Deploys one locale fully, symlinks others using already-deployed content | Moderate speed, good multi-locale |
| **standard** | Deploys all locales fully, no symlinking | Maximum compatibility, slowest |

**Exam focus:**
- **`compact`** is the **default** strategy on Cloud and is fastest for single-locale stores
- **`standard`** is the safest but slowest — avoid on Cloud unless required
- **`quick`** balances speed with multi-locale support

---

### SCD Strategy Configuration

```yaml
# .magento.env.yaml
stage:
  build:
    SCD_STRATEGY: compact   # compact | quick | standard
    SCD_THREADS: 4          # parallel workers
    SCD_COMPRESSION_LEVEL: 4  # gzip compression 1-9
    SCD_MATRIX:
      magento/backend:
        language:
          - en_US
```

---

### SCD Timing: Build vs Deploy vs On-Demand

```
+------------------+-----------------------------+---------------------+
| When SCD Runs    | Pros                        | Cons                |
+------------------+-----------------------------+---------------------+
| Build phase      | Zero-downtime, fastest UX   | Larger build slug   |
| Deploy phase     | Smaller build artifact      | Adds to downtime    |
| SCD_ON_DEMAND    | Minimal build/deploy time   | First request slow  |
+------------------+-----------------------------+---------------------+
```

**Exam focus:**
- **SCD during build** = best practice for zero-downtime (files ready before deploy)
- **SCD during deploy** = adds to maintenance mode window (bad for UX)
- **SCD_ON_DEMAND** = static files generated on first browser request (bad for production, good for integration/dev)

---

### SCD_ON_DEMAND

```yaml
stage:
  global:
    SCD_ON_DEMAND: true
```

- When `true`, static content is **not** generated during build or deploy
- Files are generated **lazily on first request** via the Magento static file generation mechanism
- **Use case:** Integration/development environments where rapid iteration is needed
- **Do NOT use in Production** — causes slow first page loads

**Exam focus:**
- `SCD_ON_DEMAND: true` skips SCD in both build AND deploy phases
- It is controlled in the **global** stage so it applies everywhere
- Even with `SCD_ON_DEMAND`, you can still run `php bin/magento setup:static-content:deploy` manually via SSH

---

### SKIP_HTML_MINIFICATION

```yaml
stage:
  global:
    SKIP_HTML_MINIFICATION: true  # default: true on Cloud
```

- When `true`, HTML templates are **not minified** to `pub/static/` during build
- They stay in `var/view_preprocessed/` and are minified at runtime
- Reduces build artifact size significantly
- **Default is `true`** on Cloud (skip minification = don't minify during build)

**Exam focus:**
- `SKIP_HTML_MINIFICATION: true` → minification happens at runtime, not build time
- This reduces the build slug size and speeds up build phase

---

## 6. Deployment Pipeline Phases

### High-Level Pipeline

```
git push
    |
    v
+----------------------------+
|     BUILD PHASE            |
|  - No services (no DB)     |
|  - composer install        |
|  - di:compile              |
|  - SCD (if configured)     |
|  - Generate build artifact |
+----------------------------+
    |
    v
+----------------------------+
|     DEPLOY PHASE           |
|  - Services available      |
|  - Maintenance mode ON     |
|  - setup:upgrade           |
|  - config:import           |
|  - Maintenance mode OFF    |
+----------------------------+
    |
    v
+----------------------------+
|   POST-DEPLOY PHASE        |
|  - Site is LIVE            |
|  - Cache warm-up           |
|  - Cron jobs enabled       |
|  - Notifications sent      |
+----------------------------+
```

---

### Build Phase (No Services)

**What's available:** File system, Composer packages, environment variables
**What's NOT available:** Database, Redis, Elasticsearch, Varnish

```bash
# Steps executed during build:
1. php ./vendor/bin/ece-tools run scenario/build/generate.xml
   - Validate .magento.env.yaml
   - composer install (already done by platform before hook)
   - php bin/magento setup:di:compile
   - php bin/magento setup:static-content:deploy (if SCD on build)

2. php ./vendor/bin/ece-tools run scenario/build/transfer.xml
   - Copy built artifact to deploy mount
   - Compress pub/static/ (if configured)
```

**Exam focus:**
- **`di:compile`** runs in **build** phase — generates DI configuration and interceptors
- **No database access** in build — any code that requires DB will fail
- The build artifact (slug) is **immutable** — same artifact deployed to staging and production

---

### Deploy Phase (Maintenance Mode)

**What's available:** All services (DB, Redis, Elasticsearch)
**Site status:** Maintenance mode is **ENABLED**

```bash
# Steps executed during deploy:
1. Enable maintenance mode
2. Mount writable directories
3. php bin/magento setup:upgrade (schema + data upgrades)
4. php bin/magento setup:di:compile (only if not done in build)
5. php bin/magento app:config:import
6. Update base URLs if needed
7. Flush cache
8. Disable maintenance mode
```

**Exam focus:**
- `setup:upgrade` ONLY runs in **deploy** phase (needs DB)
- If `di:compile` was done in build, it is **skipped** in deploy
- This phase contributes to **downtime** — minimize its duration

---

### Post-Deploy Phase (Site Live)

**What's available:** All services, live traffic
**Site status:** Maintenance mode **DISABLED**, site is live

```bash
# Steps executed during post-deploy:
1. php bin/magento cache:warm:up (page crawler)
2. Re-enable cron consumers
3. Send deployment success notification
4. Health checks
```

**Exam focus:**
- Post-deploy runs **after the site is live** — errors here don't take the site down
- **Cache warming** is a post-deploy responsibility
- Use post-deploy hooks for non-critical tasks that could tolerate failure

---

## 7. Zero-Downtime Deployment

### How Zero-Downtime Works on Cloud

The key insight: if SCD runs in **build** (not deploy), the static content is ready before maintenance mode is ever enabled.

```
Timeline WITHOUT zero-downtime (SCD in deploy):
[BUILD: no SCD] -> [DEPLOY: maintenance ON -> SCD -> upgrade -> maintenance OFF]
                    ^                                                           ^
                    |<---------  SITE DOWN (long) --------------------------->|

Timeline WITH zero-downtime (SCD in build):
[BUILD: SCD done] -> [DEPLOY: maintenance ON -> upgrade -> maintenance OFF]
                      ^                                     ^
                      |<--- SITE DOWN (short) ------------>|
```

**Exam focus:**
- Moving SCD to **build** phase is the #1 technique for reducing downtime
- Zero-downtime is achievable when: SCD in build + fast `setup:upgrade` + cache warm in post-deploy

---

### Cache Warming in Post-Deploy

```yaml
# .magento.env.yaml
stage:
  post_deploy:
    WARM_UP_PAGES:
      - "index.php/"
      - "index.php/customer/account/login"
      - "index.php/catalog/category/view/id/2"
      - "index.php/cms/page/view/page_id/1"
```

The platform uses these URLs to make HTTP requests **after deployment**, pre-filling the FPC (Varnish/Fastly cache) before real users arrive.

**Exam focus:**
- `WARM_UP_PAGES` is configured in the **`post_deploy`** stage
- URLs must use `index.php/` prefix format
- Warming reduces the **cold cache** problem after every deployment

---

### `.magento.app.yaml` Zero-Downtime Configuration

```yaml
# Full example for zero-downtime deploy
hooks:
  build: |
    set -e
    php ./vendor/bin/ece-tools run scenario/build/generate.xml
    php ./vendor/bin/ece-tools run scenario/build/transfer.xml

  deploy: |
    php ./vendor/bin/ece-tools run scenario/deploy.xml

  post_deploy: |
    php ./vendor/bin/ece-tools run scenario/post-deploy.xml
```

```yaml
# .magento.env.yaml for zero-downtime
stage:
  global:
    SKIP_HTML_MINIFICATION: true

  build:
    SCD_STRATEGY: compact
    SCD_THREADS: 4

  post_deploy:
    WARM_UP_PAGES:
      - "index.php/"
```

---

## 8. Patches on Cloud

### Methods of Applying Patches

There are two primary mechanisms for applying patches on Adobe Commerce Cloud:

| Method | Mechanism | Scope |
|---|---|---|
| **Quality Patches** | `QUALITY_PATCHES` env var in `.magento.env.yaml` | Magento-supplied quality patches |
| **Custom Hotfixes** | `m2-hotfixes/` directory | Custom/third-party patch files |

---

### Method 1: QUALITY_PATCHES Environment Variable

Use this for **Adobe-provided quality patches** from the `magento/quality-patches` package.

```yaml
# .magento.env.yaml
stage:
  build:
    QUALITY_PATCHES:
      - MDVA-12345
      - MDVA-67890
      - MC-00000
```

```bash
# Find available quality patches
php ./vendor/bin/ece-tools patch:show

# Apply patches manually (usually done automatically during build)
php ./vendor/bin/ece-tools patch:apply
```

**Exam focus:**
- `QUALITY_PATCHES` is in the **`build`** stage of `.magento.env.yaml`
- Patches are applied during the **build phase** automatically
- Patch IDs follow the format `MDVA-XXXXX`, `MC-XXXXX`, or `MCLOUD-XXXXX`

---

### Method 2: m2-hotfixes/ Directory

Use this for **custom patches** or third-party fixes that are not in the quality patches catalog.

```
project-root/
  m2-hotfixes/
    CUSTOM_FIX_for_module_bug.patch
    vendor_module_fix.patch
```

```bash
# Patch files must be in unified diff format
# Example patch file structure:
diff --git a/app/code/Vendor/Module/Model/Foo.php b/app/code/Vendor/Module/Model/Foo.php
index abc1234..def5678 100644
--- a/app/code/Vendor/Module/Model/Foo.php
+++ b/app/code/Vendor/Module/Model/Foo.php
@@ -50,7 +50,7 @@
-    protected $value = 'old';
+    protected $value = 'new';
```

**Exam focus:**
- Patches in `m2-hotfixes/` are applied automatically during the **build phase**
- Files must have `.patch` extension and be in **unified diff format**
- Applied **before** `m2-hotfixes/` in this order: quality patches → hotfixes
- Commit the `.patch` files to the repository — they are part of the build

---

### Patch Application Order During Build

```
Build Phase Patch Order:
1. Composer patches (via cweagans/composer-patches)
2. Quality Patches (QUALITY_PATCHES env var)
3. Custom Hotfixes (m2-hotfixes/ directory)
```

**Exam focus:**
- If a patch fails to apply, the **entire build fails**
- Check patch compatibility before setting `QUALITY_PATCHES` — wrong patch on wrong Magento version = build error

---

## 9. Fastly Configuration

Fastly is the **mandatory CDN/edge layer** for Adobe Commerce Cloud Pro and Starter Production/Staging environments.

### Fastly Architecture on Cloud

```
Browser
  |
  v
Fastly Edge (CDN + WAF + TLS termination)
  |
  |-- Cache HIT --> return cached response
  |
  |-- Cache MISS
        |
        v
     Varnish (on-origin, Pro plan)
        |
        v
     Nginx/PHP-FPM (Magento application)
        |
        v
     MySQL / Redis / Elasticsearch
```

**Exam focus:**
- **TLS is terminated at Fastly edge** — the origin sees HTTP, not HTTPS
- Fastly acts as **full-page cache** AND **WAF** AND **image optimizer**
- On Pro plan, there is also **Varnish** between Fastly and the app

---

### VCL Snippets

VCL (Varnish Configuration Language) snippets allow you to **customize Fastly's caching behavior** without replacing the entire VCL configuration.

#### VCL Snippet Types and When They Execute

| Snippet Type | When It Executes | Common Use |
|---|---|---|
| `recv` | On every incoming request | Block IPs, set cache bypass |
| `pass` | When request is passed to origin | Modify pass conditions |
| `miss` | On cache miss before fetching origin | Add headers to origin request |
| `hit` | On cache hit | Modify hit response |
| `fetch` | After fetching from origin | Modify cacheable response |
| `deliver` | Before delivering to client | Add/remove response headers |
| `error` | On error condition | Custom error pages |

#### Creating VCL Snippets via Admin

```
Stores > Configuration > Advanced > System > Full Page Cache
> Fastly Configuration > Custom VCL Snippets > Create
```

#### VCL Snippet via API

```bash
# Create a custom VCL snippet via Fastly API
curl -X POST "https://api.fastly.com/service/$FASTLY_SERVICE_ID/version/$VERSION/snippet" \
  -H "Fastly-Key: $FASTLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "block_bad_ips",
    "type": "recv",
    "priority": 5,
    "content": "if (req.http.X-Forwarded-For ~ \"192.168.1.100\") { error 403; }"
  }'
```

#### Example: Force Cache Bypass VCL (recv snippet)

```vcl
# Bypass cache for admin URLs
if (req.url ~ "^/admin") {
  return(pass);
}

# Bypass cache for specific user-agent
if (req.http.User-Agent ~ "BadBot") {
  return(pass);
}
```

**Exam focus:**
- VCL snippets are **additive** — they merge into the master VCL, not replace it
- `recv` type is the most common for request-based logic (IP blocking, bypass rules)
- Priority value: **lower number = higher priority** (runs first)

---

### Image Optimization

Fastly's **Image Optimization (IO)** module automatically transforms images at the edge.

#### Configuration in Magento Admin

```
Stores > Configuration > Advanced > System > Fastly Configuration
> Image Optimization
```

#### What Fastly IO Does

- **WebP conversion** — serves WebP to supporting browsers automatically
- **Resizing** — resize images based on query parameters (`?width=300&height=200`)
- **Format conversion** — JPEG/PNG/GIF → WebP/AVIF where supported
- **Quality adjustment** — compress images without code changes
- **Lossy/Lossless** — configurable per image type

#### URL Parameters for IO

```
# Original image
https://example.com/pub/media/catalog/product/image.jpg

# Fastly IO with resize
https://example.com/pub/media/catalog/product/image.jpg?width=300

# With quality
https://example.com/pub/media/catalog/product/image.jpg?width=300&quality=80

# Convert to WebP
https://example.com/pub/media/catalog/product/image.jpg?format=webply
```

**Exam focus:**
- Image Optimization is a **Fastly feature** — it works at the CDN layer, not Magento
- WebP conversion is **automatic** based on `Accept` header — no URL changes needed for browsers
- Enabling IO in Magento pushes the config to Fastly via API

---

### WAF (Web Application Firewall)

Fastly's WAF is a **managed rule set** that protects against common attacks (OWASP Top 10).

#### WAF Features

- **OWASP Core Rule Set** — SQL injection, XSS, RFI, LFI protection
- **Managed Rules** — Adobe-managed rules specifically for Commerce
- **Attack logging** — blocked requests logged to Fastly logs
- **False positive tuning** — ability to disable specific rules

#### WAF Configuration

```
Magento Admin:
Stores > Configuration > Advanced > System > Fastly Configuration > Web Application Firewall
```

**Exam focus:**
- WAF operates at the **Fastly edge** — attacks are blocked before reaching your origin
- WAF is **separate from VCL snippets** — it uses a managed rule set
- Custom **VCL can whitelist** specific paths if WAF causes false positives

#### Bypassing WAF for Specific URLs (via VCL)

```vcl
# In a recv snippet - disable WAF for specific path
if (req.url ~ "^/api/trusted-endpoint") {
  set req.http.X-WAF-Override = "1";
}
```

---

### TLS/SSL Configuration

#### How TLS Works on Cloud

```
Client (HTTPS port 443)
    |
    v (TLS termination here)
Fastly Edge
    |
    v (HTTP port 80 or 443 - origin pull)
Application Origin
```

**Exam focus:**
- TLS certificates are **managed by Fastly** on Cloud — no manual certificate installation
- Fastly supports **SNI** (Server Name Indication) for multiple domains on same IP
- **Shared TLS** is available for `*.magentosite.cloud` domains (no custom cert needed)
- **Custom TLS** requires uploading your certificate to Fastly via Admin or API

#### TLS Certificate Management in Admin

```
Stores > Configuration > Advanced > System > Fastly Configuration > TLS/SSL
```

#### Force HTTPS Redirect (VCL recv snippet)

```vcl
# Force HTTPS at Fastly edge level
if (!req.is_ssl) {
  error 801 "Moved Permanently";
}

# In custom error VCL:
if (obj.status == 801) {
  set obj.http.Location = "https://" + req.http.host + req.url;
  set obj.status = 301;
  return(deliver);
}
```

**Exam focus:**
- Force HTTPS should be done at **Fastly** (VCL level), not at the origin Nginx level
- `req.is_ssl` is a Fastly-specific VCL variable — not standard Varnish VCL

---

### Fastly API Credentials in Magento

```
Stores > Configuration > Advanced > System > Full Page Cache
> Caching Application = Fastly CDN
> Fastly Service ID (from Fastly dashboard)
> Fastly API Token (from Fastly account)
```

#### Test Fastly Connection

```bash
# From Magento admin - test button
# Or via CLI:
php bin/magento fastly:maintenance:disable
php bin/magento fastly:cache:purge --all
```

---

### Fastly Cache Purging

```bash
# Purge entire Fastly cache
php bin/magento cache:flush   # triggers Fastly ban

# Purge by URL via CLI (after SSH)
curl -X PURGE "https://example.com/pub/media/catalog/product/image.jpg"

# Purge by surrogate key (tag-based)
curl -X POST "https://api.fastly.com/service/$SERVICE_ID/purge" \
  -H "Fastly-Key: $API_KEY" \
  -H "Surrogate-Key: catalog_product_1234"
```

**Exam focus:**
- Magento uses **surrogate keys** (X-Cache-Tags header) to tell Fastly what to tag cached objects with
- When Magento flushes a cache tag (e.g., `catalog_product_1234`), it sends a **ban** to Fastly for that tag
- Fastly supports **instant purge** and **soft purge** (stale-while-revalidate)

---

### Fastly Summary Table

| Feature | Purpose | Config Location |
|---|---|---|
| **VCL Snippets** | Customize request/response handling | Admin > Fastly Config > Custom VCL |
| **Image Optimization** | Auto WebP, resize, compress at edge | Admin > Fastly Config > Image Opt |
| **WAF** | Block OWASP attacks at edge | Admin > Fastly Config > WAF |
| **TLS/SSL** | Certificate management, HTTPS | Admin > Fastly Config > TLS |
| **Cache Purge** | Invalidate stale content | Admin / CLI / Fastly API |
| **Surrogate Keys** | Tag-based cache invalidation | Auto-managed by Magento |

---

## Quick-Reference Checklist

### magento-cloud CLI

- [ ] `magento-cloud login` — OAuth browser-based authentication
- [ ] `magento-cloud project:list` — list all projects
- [ ] `magento-cloud environment:list` — list environments with status and URL
- [ ] `magento-cloud environment:push` — push code branch (triggers build/deploy pipeline)
- [ ] `magento-cloud ssh` — SSH into app container (use `--environment` flag for non-default)
- [ ] `magento-cloud db:dump` — downloads DB as local file via SSH tunnel
- [ ] `magento-cloud db:sql` — interactive MySQL session via tunnel
- [ ] `magento-cloud tunnel:open` — open tunnel to ALL services (DB, Redis, etc.)
- [ ] `magento-cloud activity:log` — view build and deploy logs

### ece-tools

- [ ] Hooks defined in **`.magento.app.yaml`** under `hooks.build`, `hooks.deploy`, `hooks.post_deploy`
- [ ] **Build phase**: no services, runs `di:compile`, SCD (if configured), `composer install`
- [ ] **Deploy phase**: services available, maintenance mode ON, runs `setup:upgrade`
- [ ] **Post-deploy phase**: site live, runs cache warm-up, cron re-enable
- [ ] `cloud:build` / `cloud:deploy` / `cloud:post-deploy` are shorthand commands
- [ ] Scenarios: XML files in `scenario/` directory; can be extended with custom XML

### Environment Variables

- [ ] **`MAGENTO_CLOUD_VARIABLES`** is base64-encoded JSON of cloud project/environment vars
- [ ] **`env:` prefix** on Cloud UI variables makes them real OS-level environment variables
- [ ] **`global`** stage in `.magento.env.yaml` applies to ALL phases
- [ ] **Environment-level variables override project-level** variables
- [ ] Variables can be marked **sensitive** (hidden after set) in Cloud UI/CLI

### SCD Strategies

- [ ] **`compact`** — default, fastest, deploys current locale + symlinks others
- [ ] **`quick`** — moderate speed, good for multi-locale stores
- [ ] **`standard`** — full deploy all locales, slowest, most compatible
- [ ] **`SCD_ON_DEMAND: true`** — skip SCD in build/deploy, generate on first request (dev only)
- [ ] **`SKIP_HTML_MINIFICATION: true`** — reduces build slug, minification at runtime
- [ ] SCD during **build** = zero-downtime; SCD during **deploy** = adds to maintenance window

### Deployment Pipeline

- [ ] **Build**: no DB/services, `di:compile`, SCD, composer install → creates immutable artifact
- [ ] **Deploy**: all services, maintenance ON, `setup:upgrade`, cache flush, maintenance OFF
- [ ] **Post-deploy**: site live, cache warm-up, cron jobs, notifications
- [ ] Zero-downtime = SCD in build + fast upgrade + cache warm in post-deploy
- [ ] `WARM_UP_PAGES` in **`post_deploy`** stage → pre-fills FPC/Fastly cache after deploy

### Patches on Cloud

- [ ] **`QUALITY_PATCHES`** in `build` stage of `.magento.env.yaml` — applies Adobe quality patches
- [ ] **`m2-hotfixes/`** directory — commit `.patch` files (unified diff format) for custom patches
- [ ] Patches apply during **build phase** automatically
- [ ] Order: quality patches → hotfixes → build continues
- [ ] Failed patch = **build fails entirely**

### Fastly

- [ ] **TLS terminated at Fastly edge** — origin receives HTTP
- [ ] **VCL snippets** are additive (not full replacement); lower priority number = runs first
- [ ] **`recv`** snippet type = most common for blocking/bypass logic
- [ ] **Image Optimization** — WebP auto-conversion, resize via URL params, at Fastly edge
- [ ] **WAF** — OWASP rule set managed by Adobe/Fastly, blocks at edge before origin
- [ ] **Surrogate keys** = tag-based cache invalidation; Magento sends ban to Fastly on flush
- [ ] Fastly credentials: **Service ID** + **API Token** configured in Magento Admin
- [ ] Force HTTPS: use `recv` VCL snippet checking `req.is_ssl` — do at Fastly, not Nginx
