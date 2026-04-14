# Day 18 — Adobe Commerce Cloud Architecture

## Table of Contents
1. [Overview](#1-overview)
2. [Infrastructure Stack](#2-infrastructure-stack)
3. [Environment Types](#3-environment-types)
4. [Pro vs Starter Architecture](#4-pro-vs-starter-architecture)
5. [Git-Based Workflow & Deploy Pipeline](#5-git-based-workflow--deploy-pipeline)
6. [Read-Only Filesystem & Writable Mounts](#6-read-only-filesystem--writable-mounts)
7. [Services: .magento/services.yaml](#7-services-magentoservicesyaml)
8. [Routes: .magento/routes.yaml](#8-routes-magentoroutesyaml)
9. [Application: .magento.app.yaml](#9-application-magentoappyaml)
10. [Hooks In Depth](#10-hooks-in-depth)
11. [Workers & Crons](#11-workers--crons)
12. [Practice Exercise — Local EE vs Cloud Config](#12-practice-exercise--local-ee-vs-cloud-config)
13. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Overview

Adobe Commerce Cloud (ACC) is a **managed Platform-as-a-Service (PaaS)** built on top of AWS and Azure. It packages Magento/Adobe Commerce with a pre-configured, opinionated infrastructure stack and a **Git-driven CI/CD pipeline**.

Key philosophical differences from on-premise Adobe Commerce Enterprise Edition:

| Concern | On-Premise EE | Commerce Cloud |
|---|---|---|
| Infrastructure management | Manual / DevOps team | Managed by Adobe |
| Deployments | FTP / Capistrano / custom | `git push` triggers pipeline |
| Filesystem | Fully writable | Read-only with declared mounts |
| Scaling | Manual | Auto-scaling (Pro) |
| CDN | Optional, self-managed | Fastly built-in |
| Config | php.ini, .htaccess | `.magento.app.yaml`, `services.yaml`, `routes.yaml` |

> **Exam focus:** ACC is a **PaaS** — Adobe manages the underlying OS, security patches, and infrastructure. Merchants/developers manage *application* configuration through YAML files committed to Git.

---

## 2. Infrastructure Stack

### 2.1 Architecture Diagram

```
Internet
    |
[Fastly CDN / WAF]        <-- Edge caching, TLS termination, DDoS protection
    |
[Load Balancer]
    |
[Nginx]                   <-- Web server, PHP request routing
    |
[PHP-FPM]                 <-- PHP process manager (executes Magento application)
    |
[Varnish]                 <-- Full-page cache (FPC) layer
    |
+------+-------+----------+
|      |       |          |
[Redis] [OpenSearch] [RabbitMQ]
(Cache) (Search)    (Queue)
    |
[MySQL / MariaDB]         <-- Persistent relational database
```

### 2.2 Fastly CDN

- **Edge caching** at over 50 global PoPs (Points of Presence)
- Handles **TLS/SSL termination** — certificates managed by Adobe
- Adobe Commerce ships with a **Fastly module** (`fastly/magento2`) pre-installed
- Supports **VCL (Varnish Configuration Language)** snippets for custom caching rules
- Also acts as the **WAF (Web Application Firewall)**
- Surrogates keys (cache tags) allow targeted cache purging per product/category

> **Exam focus:** Fastly is the **CDN and WAF** in Commerce Cloud. Custom cache rules use **VCL snippets**. The Fastly module is `fastly/magento2`.

### 2.3 Varnish

- Acts as the **full-page cache (FPC)** *behind* Fastly (origin-side)
- Commerce Cloud configures Varnish automatically; the generated `default.vcl` is based on `var/cache.vcl`
- Magento's `CACHE_CONFIGURATION` in `env.php` / environment variables controls Varnish behavior
- Cache invalidation uses **X-Magento-Tags** (cache tags sent as HTTP headers)

> **Exam focus:** Varnish = FPC on Cloud. Magento uses **X-Magento-Tags** headers for tag-based cache invalidation.

### 2.4 Nginx

- Replaces Apache as the web server on Commerce Cloud
- Config is **not directly editable** by developers (managed by Adobe)
- Limited customization via `.magento.app.yaml` `web:` stanza (locations, headers)
- Handles rewrites, PHP-FPM proxying, static file serving

> **Exam focus:** Commerce Cloud uses **Nginx**, NOT Apache. Nginx config is managed by Adobe; developer customizations go in `.magento.app.yaml`.

### 2.5 PHP-FPM

- **FastCGI Process Manager** — manages a pool of PHP worker processes
- PHP version is declared in `.magento.app.yaml` under `type:`
- Extensions are declared under `runtime: extensions:`
- OPcache is enabled by default

### 2.6 Redis

Two Redis instances are typically provisioned:

| Instance | Purpose |
|---|---|
| `redis` | Default/page cache (L2 cache) |
| `redis-session` | PHP session storage |

- Configured in `services.yaml` with type `redis`
- Relationships declared in `.magento.app.yaml`

> **Exam focus:** Commerce Cloud uses **two Redis instances** — one for cache, one for sessions. Both are declared as separate services in `services.yaml`.

### 2.7 Elasticsearch / OpenSearch

- Powers **Magento's catalog search** and layered navigation
- Commerce Cloud 2.4.x uses **OpenSearch** (AWS-managed, Elasticsearch-compatible fork)
- Configured in `services.yaml` with type `opensearch` or `elasticsearch`
- The `SEARCH_CONFIGURATION` environment variable or `env.php` connects Magento to it

> **Exam focus:** Magento 2.4+ **requires** Elasticsearch/OpenSearch — MySQL search is removed. On Cloud, declare it in `services.yaml`.

### 2.8 RabbitMQ

- **Message queue broker** for asynchronous processing
- Used by Magento's `MessageQueue` framework (`amqp` connection)
- Enables decoupling of long-running tasks (order processing, inventory updates, async reindexing)
- Declared in `services.yaml` with type `rabbitmq`

> **Exam focus:** RabbitMQ is the **AMQP message broker** on Cloud. It enables Magento's async/bulk operations.

---

## 3. Environment Types

Commerce Cloud uses a **three-tier environment model**. Each environment is an isolated container cluster with its own database, services, and URL.

```
Production  (live traffic, HA, cannot push broken code)
    ^
Staging     (pre-production, mirrors Production topology)
    ^
Integration (dev branches, one per Git branch, limited resources)
```

### 3.1 Integration Environments

- Created automatically when you **push a new Git branch**
- Typically limited to **3-5 active environments** (plan-dependent)
- Smaller resource allocation — NOT for performance testing
- Shares a single-node topology (no HA, no Fastly unless manually enabled)
- Used for: **feature development, code review, automated testing**
- URL pattern: `https://<branch>.<project-hash>.<region>.magentosite.cloud`

> **Exam focus:** Integration environments are **ephemeral, branch-based, limited resources**. Do NOT use for load/performance testing.

### 3.2 Staging Environment

- **Single, persistent** environment (not branch-based)
- Mirrors Production topology (same instance sizes, same services)
- **Pro plan:** dedicated VM cluster
- **Starter plan:** shared with Production in a split configuration
- Used for: **QA, UAT, performance testing, final pre-deploy validation**
- Fastly CDN is **enabled** on Staging (unlike Integration)

> **Exam focus:** Staging mirrors Production. Fastly is **enabled** on Staging. Use Staging for performance tests, NOT Integration.

### 3.3 Production Environment

- **Live customer-facing** environment
- HA (High Availability) on Pro: multiple web nodes + clustered services
- Deploys from the **`master`** branch (or `production` branch depending on plan)
- Managed change windows recommended for deployments

---

## 4. Pro vs Starter Architecture

### 4.1 Comparison Table

| Feature | Starter | Pro |
|---|---|---|
| Environments | 4 total (3 Integration + Production) | Many Integration + dedicated Staging + dedicated Production |
| Staging | Simulated (branch-based) | **Dedicated cluster** mirroring Production |
| Production HA | No | **Yes** — multiple web nodes, clustered DB/Redis |
| Database | Single MariaDB node | MariaDB cluster (Primary + Replicas) |
| Redis | Single node | Clustered Redis |
| Elasticsearch | Single node | Dedicated cluster |
| Disk | 5 GB | Up to 50 GB+ |
| Scaling | Manual resize | Horizontal + vertical |
| Price | Lower | Higher |
| Target | Small-medium stores | Enterprise, high-traffic |

### 4.2 Pro Architecture Detail

```
+---------------------------+
|      Integration          |  <-- N branches (dev work)
+---------------------------+
           |
+---------------------------+
|         Staging           |  <-- Dedicated cluster, mirrors Prod
|   [Web Node]              |
|   [MariaDB Primary]       |
|   [Redis] [OpenSearch]    |
+---------------------------+
           |
+---------------------------+
|        Production         |  <-- High Availability
|  [Web Node 1][Web Node 2] |
|  [MariaDB Primary+Replica]|
|  [Redis Cluster]          |
|  [OpenSearch Cluster]     |
|  [RabbitMQ]               |
+---------------------------+
```

> **Exam focus:** Pro has **dedicated Staging and Production clusters** with HA. Starter does not have dedicated Staging. Pro Production has **multiple web nodes and clustered services**.

### 4.3 Starter Architecture Detail

```
+---------------------------+
|  master (Production)      |  <-- Single node, live traffic
+---------------------------+
|  staging (Staging branch) |  <-- Simulated staging, same topology as Integration
+---------------------------+
|  Integration branch 1     |
|  Integration branch 2     |
+---------------------------+
```

> **Exam focus:** Starter has **4 environments total**. Staging on Starter is just a branch — not a dedicated cluster.

---

## 5. Git-Based Workflow & Deploy Pipeline

### 5.1 The Workflow

```
Developer Workstation
    |
    | git commit + git push origin <branch>
    v
Commerce Cloud Git Repository
    |
    | Trigger: push event
    v
+-------------------------------+
|       Build Phase             |
|  - composer install           |
|  - static content deploy      |
|  - code compilation           |
|  - NO services available      |
+-------------------------------+
    |
    v
+-------------------------------+
|       Deploy Phase            |
|  - Enable maintenance mode    |
|  - Mount writable dirs        |
|  - setup:upgrade              |
|  - cache flush                |
|  - Disable maintenance mode   |
|  - Services ARE available     |
+-------------------------------+
    |
    v
+-------------------------------+
|     Post-Deploy Phase         |
|  - Warmup cache               |
|  - Run smoke tests            |
|  - Send notifications         |
|  - Site is LIVE again         |
+-------------------------------+
```

### 5.2 Branch → Environment Mapping

| Git Action | Result |
|---|---|
| `git push origin feature/my-feature` | Creates/updates Integration environment |
| Merge to `staging` (Pro) | Triggers Staging deployment |
| Merge to `master` / `production` | Triggers Production deployment |
| Delete branch | Environment is deactivated |

### 5.3 Useful Cloud CLI Commands

```bash
# Install Magento Cloud CLI
curl -sS https://accounts.magento.cloud/cli/installer | php

# List environments
magento-cloud environment:list

# SSH into an environment
magento-cloud ssh --environment=staging

# Push and trigger deploy
git push magento <branch>

# View deploy log
magento-cloud log --environment=integration-abc deploy

# Run a command remotely
magento-cloud ssh -- php bin/magento cache:flush

# Open environment in browser
magento-cloud environment:url

# Sync data from Production to Staging
magento-cloud environment:sync --environment=staging
```

> **Exam focus:** A `git push` to any branch **automatically triggers** the build → deploy → post_deploy pipeline. No manual deploy step is needed.

---

## 6. Read-Only Filesystem & Writable Mounts

### 6.1 The Read-Only Constraint

On Commerce Cloud, the **entire application filesystem is read-only** after the build phase completes. This is by design:

- Ensures **deployment reproducibility** (what was built = what runs)
- Prevents runtime file modifications that would be lost on next deploy
- Forces developers to use **proper configuration management**

**Consequence:** Any directory that Magento needs to write to at runtime (logs, cache, generated code, media uploads) must be **explicitly declared as a writable mount**.

> **Exam focus:** The Cloud filesystem is **read-only**. Writable directories must be declared in `.magento.app.yaml` under `mounts:`. This is a very common exam topic.

### 6.2 Declaring Mounts in `.magento.app.yaml`

```yaml
mounts:
    "var":
        source: local
        source_path: "var"
    "app/etc":
        source: local
        source_path: "app/etc"
    "pub/media":
        source: local
        source_path: "media"
    "pub/static":
        source: local
        source_path: "pub/static"
    "generated":
        source: local
        source_path: "generated"
```

### 6.3 Mount Types

| `source` Value | Description |
|---|---|
| `local` | Local to the current container (not shared between nodes) |
| `service` | Shared network filesystem (NFS) — shared across all web nodes |

> **Exam focus:** Use `source: service` with a shared storage service for **mounts that must be consistent across multiple web nodes** (e.g., `pub/media` on Pro HA). Use `source: local` for node-local writable dirs.

### 6.4 Key Writable Directories in Magento

| Path | Purpose |
|---|---|
| `var/` | Logs, cache files, sessions, tmp, report |
| `app/etc/` | `env.php`, `config.php` (generated at deploy) |
| `pub/media/` | Uploaded images, downloadable products |
| `pub/static/` | Static content (JS, CSS, images) |
| `generated/` | Generated code (factories, interceptors) |

---

## 7. Services: `.magento/services.yaml`

### 7.1 Purpose

`services.yaml` declares the **backing services** (databases, caches, search, queues) that the application needs. Adobe provisions these services based on this file.

> **Exam focus:** `.magento/services.yaml` is where you declare Redis, OpenSearch, RabbitMQ, MySQL versions and sizes. You must also declare a **relationship** in `.magento.app.yaml` for each service.

### 7.2 Full Example

```yaml
# .magento/services.yaml

mysql:
    type: mysql:10.4
    disk: 2048

redis:
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

### 7.3 Service Type Format

```
type: <service-name>:<version>
```

| Service | Type Name | Notes |
|---|---|---|
| MySQL / MariaDB | `mysql` | Disk required |
| Redis | `redis` | No disk (in-memory) |
| OpenSearch | `opensearch` | Disk required |
| Elasticsearch | `elasticsearch` | Legacy, use OpenSearch on 2.4.x |
| RabbitMQ | `rabbitmq` | Disk required |
| PostgreSQL | `postgresql` | Rarely used with Magento |

### 7.4 Connecting Services to the Application

Services declared in `services.yaml` are **not automatically available** to the application. You must declare a **relationship** in `.magento.app.yaml`:

```yaml
# .magento.app.yaml — relationships section
relationships:
    database: "mysql:mysql"
    redis: "redis:redis"
    redis-session: "redis-session:redis"
    opensearch: "opensearch:opensearch"
    rabbitmq: "rabbitmq:amqp"
```

Format: `<alias>: "<service-name>:<endpoint>"`

The **alias** becomes the key in the `$MAGENTO_CLOUD_RELATIONSHIPS` environment variable (a base64-encoded JSON blob).

```bash
# View decoded relationships
echo $MAGENTO_CLOUD_RELATIONSHIPS | base64 --decode | python3 -m json.tool
```

> **Exam focus:** Services need a two-step declaration: in `services.yaml` AND in `.magento.app.yaml` `relationships:`. Missing the relationship means the app cannot connect to the service.

---

## 8. Routes: `.magento/routes.yaml`

### 8.1 Purpose

`routes.yaml` defines **how incoming HTTP traffic is routed** to the application. It handles:
- Domain-to-application routing
- HTTP → HTTPS redirects
- www → non-www redirects (or vice versa)
- Cache headers
- Upstream passthrough

> **Exam focus:** `.magento/routes.yaml` controls **HTTP routing, redirects, and cache configuration**. The `upstream` type sends requests to the application; `redirect` type sends HTTP redirects.

### 8.2 Full Example

```yaml
# .magento/routes.yaml

"https://{default}/":
    type: upstream
    upstream: "myapp:http"
    cache:
        enabled: true
        headers: [ "Accept", "Accept-Language" ]
        cookies: [ "*" ]
        default_ttl: 60

"https://www.{default}/":
    type: redirect
    to: "https://{default}/"

"http://{default}/":
    type: redirect
    to: "https://{default}/"

"http://www.{default}/":
    type: redirect
    to: "https://{default}/"
```

### 8.3 Route Properties

| Property | Values | Description |
|---|---|---|
| `type` | `upstream`, `redirect` | `upstream` = serve app; `redirect` = HTTP redirect |
| `upstream` | `"<app_name>:http"` | Which application container handles the request |
| `to` | URL string | Target URL for redirects |
| `cache.enabled` | `true`/`false` | Enable Fastly/Varnish caching for this route |
| `cache.headers` | List of header names | Vary cache by these headers |
| `cache.cookies` | List of cookie names or `["*"]` | Vary cache by these cookies |
| `cache.default_ttl` | Integer (seconds) | Default TTL when no `Cache-Control` is set |

### 8.4 The `{default}` Placeholder

`{default}` is replaced by the **primary domain** configured for the environment. In Integration, it becomes the auto-generated URL. In Staging/Production, it becomes your actual domain.

### 8.5 Multiple Stores / Domains

```yaml
# Multi-store routing example
"https://store1.{default}/":
    type: upstream
    upstream: "myapp:http"

"https://store2.{default}/":
    type: upstream
    upstream: "myapp:http"
```

> **Exam focus:** The `{default}` placeholder is the **primary domain**. Use `type: redirect` for HTTP→HTTPS and www→non-www redirects. Cache rules in `routes.yaml` apply at the **Fastly/CDN level**.

---

## 9. Application: `.magento.app.yaml`

### 9.1 Purpose

`.magento.app.yaml` is the **central application configuration file**. It tells the Cloud platform:
- Which runtime (PHP version) to use
- What the application name is
- How to build and deploy it
- Which services it uses
- Which directories are writable
- What background workers and cron jobs to run

> **Exam focus:** `.magento.app.yaml` is the **most important Cloud config file**. Know every major section: `name`, `type`, `build`, `hooks`, `mounts`, `relationships`, `web`, `workers`, `crons`, `disk`.

### 9.2 Complete Annotated Example

```yaml
# .magento.app.yaml

# Unique name for the application container
name: myapp

# PHP runtime version
type: php:8.2

# Build flavor: composer by default
build:
    flavor: composer

# PHP extensions
runtime:
    extensions:
        - redis
        - xsl
        - sodium
    disabled_extensions:
        - blackfire

# Variables (overrides environment variables)
variables:
    env:
        CONFIG__DEFAULT__CATALOG__SEARCH__ENGINE: "opensearch"
    php:
        memory_limit: "768M"
        max_execution_time: 600

# Deployment-time hooks
hooks:
    build: |
        set -e
        php ./vendor/bin/ece-tools build:generate
        php ./vendor/bin/ece-tools build:transfer
    deploy: |
        set -e
        php ./vendor/bin/ece-tools deploy
    post_deploy: |
        set -e
        php ./vendor/bin/ece-tools post-deploy

# Web server configuration
web:
    locations:
        "/":
            root: "pub"
            passthru: "/index.php"
            index:
                - index.php
            expires: -1
            scripts: true
            allow: false
            rules:
                \.(css|js|map|hbs|gif|jpe?g|png|tiff|wbmp|ico|jng|bmp|svgz|midi?|mp?ga|mp2|mp3|m4a|ra|weba|ogg|boot|eot|otf|ttf|woff|woff2|docx?|xlsx?|pptx?|rtf|odf|odp|ods|odt|pdf|ps|eps|ai|zip|gz|bz2|dmg|tar|rar)$:
                    allow: true
        "/media":
            root: "pub/media"
            allow: true
            scripts: false
            expires: 1y
            passthru: "/get.php"
        "/static":
            root: "pub/static"
            allow: true
            scripts: false
            expires: 1y
            passthru: "/front-static.php"
            rules:
                ^/static/version\d+/(?<resource>.*)$:
                    passthru: "/static/$resource"

# Writable mounts
mounts:
    "var":
        source: local
        source_path: "var"
    "app/etc":
        source: local
        source_path: "app/etc"
    "pub/media":
        source: local
        source_path: "media"
    "pub/static":
        source: local
        source_path: "pub/static"
    "generated":
        source: local
        source_path: "generated"

# Service relationships
relationships:
    database: "mysql:mysql"
    redis: "redis:redis"
    redis-session: "redis-session:redis"
    opensearch: "opensearch:opensearch"
    rabbitmq: "rabbitmq:amqp"

# Disk size (MB)
disk: 5120

# Cron jobs
crons:
    magento:
        spec: "* * * * *"
        cmd: "php bin/magento cron:run | grep -v 'Ran jobs by schedule' >> var/log/cron.log"
    setup_cron:
        spec: "*/5 * * * *"
        cmd: "php bin/magento cron:run --group=setup"
    consumers_runner:
        spec: "*/1 * * * *"
        cmd: "php bin/magento queue:consumers:start async.operations.all --single-thread --max-messages=10000"

# Background workers (long-running processes)
workers:
    queue_consumer:
        commands:
            start: "php bin/magento queue:consumers:start async.operations.all --single-thread"
        disk: 512
```

### 9.3 Key Sections Reference

| Section | Purpose |
|---|---|
| `name` | App container name (referenced in `routes.yaml` upstream) |
| `type` | PHP version: `php:8.1`, `php:8.2` |
| `build.flavor` | `composer` (runs `composer install`) or `none` |
| `runtime.extensions` | PHP extensions to enable |
| `variables` | Env vars and PHP ini overrides |
| `hooks` | Shell commands at build/deploy/post_deploy |
| `web.locations` | Nginx location blocks, document root, passthru |
| `mounts` | Writable filesystem paths |
| `relationships` | Service connections |
| `disk` | Persistent disk size in MB |
| `crons` | Scheduled commands (cron spec + command) |
| `workers` | Long-running background processes |

---

## 10. Hooks In Depth

### 10.1 The Three Hook Phases

```
git push
    |
    v
+========================+
|       BUILD HOOK       |
| - No services          |  <- Database, Redis, etc. NOT available
| - No writable mounts   |  <- Mounts are NOT yet mounted
| - Filesystem is built  |
| - composer install     |
| - SCD (Static Content) |
| - Code generation      |
+========================+
    |
    | Slug (build artifact) transferred to container
    v
+========================+
|      DEPLOY HOOK       |
| - Services available   |  <- DB, Redis, etc. ARE available
| - Mounts are writable  |
| - Maintenance mode ON  |
| - setup:upgrade        |
| - config:import        |
| - cache flush          |
| - Maintenance mode OFF |
+========================+
    |
    v
+========================+
|   POST_DEPLOY HOOK     |
| - Site is LIVE         |
| - Warmup caches        |
| - Smoke tests          |
| - Notifications        |
| - No maintenance mode  |
+========================+
```

### 10.2 ECE-Tools

Adobe provides the **`ece-tools`** package (`magento/ece-tools`) which wraps the deploy steps into reliable, idempotent commands.

```bash
# Typical hooks using ece-tools
hooks:
    build: |
        set -e
        php ./vendor/bin/ece-tools build:generate   # Generates app configuration
        php ./vendor/bin/ece-tools build:transfer    # Transfers build artifact
    deploy: |
        set -e
        php ./vendor/bin/ece-tools deploy            # Full deploy process
    post_deploy: |
        set -e
        php ./vendor/bin/ece-tools post-deploy       # Cache warmup, smoke tests
```

> **Exam focus:** The **build hook** has NO access to services (DB, Redis) and NO writable mounts. Static Content Deploy (SCD) should happen in the **build phase** when possible to reduce deploy downtime. `ece-tools` is the recommended way to manage deploy hooks.

### 10.3 Static Content Deploy Strategy

| Strategy | When SCD Runs | Downtime Impact |
|---|---|---|
| `SCD_STRATEGY=standard` | Deploy phase | **Longer downtime** (site in maint mode) |
| `SCD_STRATEGY=quick` (default) | Deploy phase | Medium downtime |
| `SCD_ON_DEMAND=true` | Runtime (on first request) | No deploy downtime, slower first request |
| Build-phase SCD | Build phase | **No SCD downtime** (best) |

```yaml
# Force SCD during build phase (best practice)
variables:
    env:
        SCD_ON_DEMAND: "false"
        SKIP_SCD: "false"
```

> **Exam focus:** Moving SCD to the **build phase** reduces maintenance mode time. Set `SCD_ON_DEMAND=false` and configure SCD in the build hook.

---

## 11. Workers & Crons

### 11.1 Workers

Workers are **long-running background processes** declared in `.magento.app.yaml`. They run in separate containers/processes alongside the web container.

```yaml
workers:
    queue_consumer:
        commands:
            start: "php bin/magento queue:consumers:start async.operations.all --single-thread --max-messages=10000"
        disk: 512
        variables:
            env:
                SOME_VAR: "value"
```

- Workers **restart automatically** if they exit
- Each worker gets its own resource allocation
- Workers share the same codebase as the web container
- Use workers for **RabbitMQ consumers**, data synchronization daemons, etc.

> **Exam focus:** Workers are for **long-running processes** (e.g., queue consumers). They are separate from crons and restart automatically.

### 11.2 Crons

Crons run on a schedule using standard cron syntax:

```yaml
crons:
    magento:
        spec: "* * * * *"
        cmd: "php bin/magento cron:run"
    reindex:
        spec: "0 2 * * *"
        cmd: "php bin/magento indexer:reindex"
    analytics:
        spec: "0 */6 * * *"
        cmd: "php bin/magento analytics:collect-data"
```

- **Minimum interval:** 5 minutes on Cloud (platform limitation)
- Crons run as the same user as the web process
- Output should be redirected to log files

> **Exam focus:** Minimum cron interval on Cloud is **5 minutes**. Cron commands defined in `.magento.app.yaml` are for Cloud-specific scheduling; Magento's internal cron groups are triggered by `cron:run`.

### 11.3 Workers vs Crons

| | Workers | Crons |
|---|---|---|
| Lifetime | Long-running (persistent) | Short-lived (run and exit) |
| Trigger | Starts with deploy, auto-restarts | Triggered by cron schedule |
| Use case | Queue consumers, daemons | Periodic jobs, reporting |
| Declaration | `workers:` section | `crons:` section |

---

## 12. Practice Exercise — Local EE vs Cloud Config

### 12.1 Comparison Checklist

Use this checklist to spot differences between your local EE instance and a Cloud `.magento.app.yaml`:

```
LOCAL EE                          CLOUD (.magento.app.yaml)
-----------                       -------------------------
php.ini (system-wide)         --> variables.php + runtime.extensions
.htaccess (Apache)            --> web.locations (Nginx)
Writable everywhere           --> Explicit mounts: section
Manual composer install       --> build.flavor: composer
Manual setup:upgrade          --> deploy hook via ece-tools
No built-in cron config       --> crons: section in .magento.app.yaml
No background worker config   --> workers: section
services.yaml N/A             --> .magento/services.yaml
routes.yaml N/A               --> .magento/routes.yaml
env.php hand-edited           --> Generated by ece-tools at deploy
config.php committed          --> YES (same pattern)
Redis config in admin         --> Env vars / relationships
```

### 12.2 Checking Your Local `env.php` vs Cloud Relationships

**Local `env.php`:**
```php
<?php
return [
    'backend' => ['frontName' => 'admin'],
    'crypt' => ['key' => 'your-crypt-key'],
    'db' => [
        'connection' => [
            'default' => [
                'host' => 'localhost',
                'dbname' => 'magento',
                'username' => 'magento',
                'password' => 'magento',
            ],
        ],
    ],
    'cache' => [
        'frontend' => [
            'default' => [
                'backend' => 'Cm_Cache_Backend_Redis',
                'backend_options' => [
                    'server' => '127.0.0.1',
                    'port' => '6379',
                    'database' => '0',
                ],
            ],
        ],
    ],
    'session' => [
        'save' => 'redis',
        'redis' => [
            'host' => '127.0.0.1',
            'port' => '6379',
            'database' => '2',
        ],
    ],
];
```

**Cloud `env.php` (auto-generated by ece-tools from relationships):**
```php
<?php
// Generated automatically — DO NOT hand-edit on Cloud
return [
    'db' => [
        'connection' => [
            'default' => [
                'host' => 'database.internal',   // Resolved from relationships
                'dbname' => 'main',
                'username' => 'user',
                'password' => '<generated>',
            ],
        ],
    ],
    'cache' => [
        'frontend' => [
            'default' => [
                'backend' => 'Cm_Cache_Backend_Redis',
                'backend_options' => [
                    'server' => 'redis.internal',  // Resolved from relationships
                    'port' => '6379',
                    'database' => '0',
                ],
            ],
        ],
    ],
];
```

> **Exam focus:** On Cloud, `env.php` is **auto-generated by `ece-tools`** during the deploy hook. You should NOT manually edit `env.php` on Cloud environments — changes will be overwritten on next deploy.

### 12.3 Key Differences Summary Table

| Aspect | Local EE | Commerce Cloud |
|---|---|---|
| Web server | Apache + `.htaccess` | Nginx + `web.locations:` in `.magento.app.yaml` |
| PHP config | System `php.ini` | `variables.php:` + `runtime.extensions:` |
| Service connection | `localhost` hardcoded | `$MAGENTO_CLOUD_RELATIONSHIPS` env var |
| `env.php` | Manually created/edited | Auto-generated by `ece-tools` |
| Filesystem | Fully writable | Read-only + explicit `mounts:` |
| Deployment | Manual CLI commands | `git push` → hook pipeline |
| Cron setup | System crontab | `crons:` section in `.magento.app.yaml` |
| CDN | Optional, self-managed | Fastly built-in |
| Sessions | Local Redis or files | Dedicated `redis-session` service |

---

## Quick-Reference Checklist

### Infrastructure Components
- [ ] **Fastly CDN** — Edge caching, TLS termination, WAF; module is `fastly/magento2`; custom rules via **VCL snippets**
- [ ] **Varnish** — Full-page cache (FPC), uses **X-Magento-Tags** for tag-based invalidation
- [ ] **Nginx** — Web server (NOT Apache); config managed by Adobe; customized via `web.locations:` in `.magento.app.yaml`
- [ ] **PHP-FPM** — PHP process manager; version declared in `.magento.app.yaml` `type:` field
- [ ] **Redis** — Two instances: one for **cache** (`redis`), one for **sessions** (`redis-session`)
- [ ] **OpenSearch/Elasticsearch** — Required for Magento 2.4+ catalog search; declared in `services.yaml`
- [ ] **RabbitMQ** — AMQP message broker for async/bulk operations; type `rabbitmq` in `services.yaml`

### Environment Types
- [ ] **Integration** — Branch-based, ephemeral, limited resources, NOT for performance testing
- [ ] **Staging** — Mirrors Production; Fastly enabled; use for QA, UAT, performance testing
- [ ] **Production** — Live traffic; HA on Pro
- [ ] Fastly is **enabled on Staging and Production**, NOT on Integration by default

### Pro vs Starter
- [ ] **Pro** — Dedicated Staging cluster, dedicated Production HA cluster (multiple web nodes, clustered DB/Redis)
- [ ] **Starter** — 4 environments total; Staging is just a branch (not dedicated); no HA
- [ ] Pro Production has **MariaDB Primary + Replicas** and clustered Redis

### Git Workflow & Deploy Pipeline
- [ ] `git push` triggers **build → deploy → post_deploy** automatically
- [ ] **Build phase**: NO services, NO mounts; run SCD here for minimum downtime
- [ ] **Deploy phase**: services available, mounts mounted, maintenance mode ON
- [ ] **Post_deploy phase**: site is live, cache warmup, smoke tests

### Read-Only Filesystem
- [ ] Filesystem is **read-only after build** — must declare writable paths in `mounts:`
- [ ] Key writable paths: `var/`, `app/etc/`, `pub/media/`, `pub/static/`, `generated/`
- [ ] `source: local` = node-local mount; `source: service` = shared NFS (needed for multi-node HA)

### services.yaml
- [ ] Declares **backing services**: MySQL, Redis, OpenSearch, RabbitMQ
- [ ] Format: `type: <service-name>:<version>`, optionally `disk:` (MB)
- [ ] Location: `.magento/services.yaml`
- [ ] Services must ALSO be declared in `.magento.app.yaml` `relationships:` to be usable

### routes.yaml
- [ ] Location: `.magento/routes.yaml`
- [ ] `type: upstream` — routes request to app container
- [ ] `type: redirect` — HTTP redirect response
- [ ] `{default}` placeholder = primary domain for environment
- [ ] `cache:` block controls Fastly caching behavior per route

### .magento.app.yaml
- [ ] `name:` — app container name (referenced in `routes.yaml` upstream)
- [ ] `type:` — PHP version (e.g., `php:8.2`)
- [ ] `build.flavor: composer` — runs `composer install` during build
- [ ] `runtime.extensions:` — PHP extensions to enable
- [ ] `variables.php:` — PHP ini overrides; `variables.env:` — environment variables
- [ ] `hooks.build/deploy/post_deploy:` — shell scripts for each phase
- [ ] `web.locations:` — Nginx config (root, passthru, static file rules)
- [ ] `mounts:` — writable filesystem paths
- [ ] `relationships:` — service connections (format: `alias: "service-name:endpoint"`)
- [ ] `disk:` — persistent disk in MB
- [ ] `crons:` — scheduled tasks (minimum 5-minute interval on Cloud)
- [ ] `workers:` — long-running background processes (auto-restart)

### ECE-Tools & env.php
- [ ] `magento/ece-tools` provides `build:generate`, `build:transfer`, `deploy`, `post-deploy` commands
- [ ] `env.php` is **auto-generated by ece-tools** during deploy — do NOT hand-edit on Cloud
- [ ] Service credentials injected via `$MAGENTO_CLOUD_RELATIONSHIPS` environment variable
- [ ] `config.php` IS committed to Git (same pattern as local SCD flow)

### Workers vs Crons
- [ ] **Workers** = long-running (queue consumers, daemons); auto-restart; declared under `workers:`
- [ ] **Crons** = scheduled, short-lived; declared under `crons:`; minimum 5-minute interval
- [ ] Use workers for **RabbitMQ consumers** to avoid message queue backlog

### Static Content Deploy
- [ ] SCD during **build phase** = minimal maintenance mode downtime (best practice)
- [ ] SCD during **deploy phase** = longer maintenance window
- [ ] `SCD_ON_DEMAND=true` = generated at runtime (no deploy downtime, slow first request)
