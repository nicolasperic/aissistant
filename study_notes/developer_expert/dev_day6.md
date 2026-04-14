# Magento 2 CRON Scheduling System — Day 6 Study Notes

---

## Table of Contents

1. [Overview](#1-overview)
2. [crontab.xml — Anatomy & Configuration](#2-crontabxml--anatomy--configuration)
3. [CRON Groups: default vs index](#3-cron-groups-default-vs-index)
4. [How the Magento Scheduler Works](#4-how-the-magento-scheduler-works)
5. [bin/magento cron:run vs System Crontab](#5-binmagento-cronrun-vs-system-crontab)
6. [Missed Jobs, History Cleanup & Separate Processes](#6-missed-jobs-history-cleanup--separate-processes)
7. [Debugging: cron_schedule Status Values](#7-debugging-cron_schedule-status-values)
8. [What Happens If Cron Does Not Run & Recovery](#8-what-happens-if-cron-does-not-run--recovery)
9. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Overview

Magento 2's CRON system is responsible for all scheduled background tasks — indexing, email queues, catalog price rules, sitemap generation, newsletter sending, and more. It is **not** a simple cron wrapper; it has its own scheduling engine with a database-backed job queue, process isolation, retry logic, and history management.

**Key architectural facts:**
- All scheduled job definitions live in XML (`crontab.xml`).
- Scheduling state is tracked in the `cron_schedule` database table.
- The system requires **exactly two** system-level crontab entries to function correctly.
- Jobs are divided into named **groups** that run in separate process pools.

> **Exam focus:** Magento's CRON system has three distinct phases: **generate**, **run**, and **cleanup** — all triggered by `bin/magento cron:run`.

---

## 2. crontab.xml — Anatomy & Configuration

### 2.1 File Location

```
<module_root>/etc/crontab.xml
```

Every module that needs scheduled tasks declares them here. Magento merges all `crontab.xml` files at runtime.

### 2.2 Full Syntax

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Cron:etc/crontab.xsd">

    <group id="default">

        <job name="my_module_daily_sync"
             instance="Vendor\Module\Cron\DailySync"
             method="execute">
            <schedule>0 2 * * *</schedule>
        </job>

        <job name="my_module_config_driven"
             instance="Vendor\Module\Cron\ConfigDriven"
             method="execute">
            <config_path>vendor_module/cron/schedule</config_path>
        </job>

    </group>

</config>
```

### 2.3 Key Attributes Explained

| Attribute / Element | Purpose | Example |
|---|---|---|
| `group id` | Which process pool this job belongs to | `default`, `index` |
| `job name` | Unique string identifier for the job (used as key in `cron_schedule`) | `catalog_product_alert` |
| `instance` | Fully-qualified class name to instantiate | `Vendor\Module\Cron\MyJob` |
| `method` | Method on the instance to call | `execute` |
| `<schedule>` | Hardcoded cron expression | `*/5 * * * *` |
| `<config_path>` | System config path whose value is the cron expression | `sitemap/generate/frequency` |

### 2.4 Cron Expression Format

```
 *    *    *    *    *
 |    |    |    |    |
 |    |    |    |    +-- Day of week (0-7, Sunday=0 or 7)
 |    |    |    +------- Month (1-12)
 |    |    +------------ Day of month (1-31)
 |    +----------------- Hour (0-23)
 +---------------------- Minute (0-59)
```

**Common expressions:**

```
*/5 * * * *     Every 5 minutes
0 * * * *       Every hour on the hour
0 2 * * *       Daily at 02:00
0 2 * * 0       Weekly, Sunday at 02:00
0 0 1 * *       Monthly, 1st day at midnight
```

### 2.5 The Cron Job Class

```php
<?php
namespace Vendor\Module\Cron;

use Psr\Log\LoggerInterface;

class DailySync
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    /**
     * Method name must match the 'method' attribute in crontab.xml
     */
    public function execute(): void
    {
        $this->logger->info('DailySync cron job started.');
        // ... business logic
    }
}
```

> **Exam focus:** The `method` attribute in `crontab.xml` can be any public method — it does **not** have to be named `execute`. However, `execute` is the community convention.

> **Exam focus:** Use `<config_path>` instead of `<schedule>` when the schedule should be configurable by merchants via **Stores > Configuration**. The path points to a value of type `text` in `system.xml`.

---

## 3. CRON Groups: default vs index

### 3.1 What Is a Group?

A **cron group** is a named collection of jobs that share configuration and run in a **separate PHP process pool**. Each group is processed by its own invocation of `bin/magento cron:run --group=<name>`.

### 3.2 Declaring a Custom Group

```xml
<!-- etc/cron_groups.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Cron:etc/cron_groups.xsd">

    <group id="my_custom_group">
        <schedule_generate_every>1</schedule_generate_every>   <!-- minutes -->
        <schedule_ahead_for>4</schedule_ahead_for>             <!-- minutes -->
        <schedule_lifetime>2</schedule_lifetime>               <!-- minutes -->
        <history_cleanup_every>10</history_cleanup_every>      <!-- minutes -->
        <history_success_lifetime>60</history_success_lifetime><!-- minutes -->
        <history_failure_lifetime>600</history_failure_lifetime><!-- minutes -->
        <use_separate_process>1</use_separate_process>
    </group>

</config>
```

### 3.3 Built-in Groups Comparison

| Setting | `default` | `index` |
|---|---|---|
| **Purpose** | General background tasks | Reindexing tasks only |
| **schedule_generate_every** | 15 min | 15 min |
| **schedule_ahead_for** | 20 min | 20 min |
| **schedule_lifetime** | 15 min | 15 min |
| **history_cleanup_every** | 10 min | 10 min |
| **history_success_lifetime** | 60 min | 60 min |
| **history_failure_lifetime** | 600 min | 600 min |
| **use_separate_process** | 0 | 1 |

> **Exam focus:** The `index` group has `use_separate_process = 1` — each indexer job spawns its **own child process**. The `default` group runs all its jobs sequentially in a **single process** by default.

> **Exam focus:** The `index` group exists specifically to isolate reindexing from other jobs so a slow reindex does not block email sending, price rules, etc.

### 3.4 Process Isolation Diagram

```
System Crontab
     |
     +-- bin/magento cron:run (no group = all groups)
              |
              +--[fork]--> cron:run --group=default
              |                 |
              |                 +--> job_a (sequential)
              |                 +--> job_b (sequential)
              |                 +--> job_c (sequential)
              |
              +--[fork]--> cron:run --group=index
                               |
                               +--> [fork] indexer_reindex_all_invalid
                               +--> [fork] indexer_update_all_views
```

---

## 4. How the Magento Scheduler Works

### 4.1 The Three Phases

Every time `bin/magento cron:run` is executed, it performs **three sequential phases** for each group:

```
+-------------------+      +------------------+      +-------------------+
|   1. GENERATE     |  ->  |    2. RUN        |  ->  |   3. CLEANUP      |
|                   |      |                  |      |                   |
| Read crontab.xml  |      | Fetch 'pending'  |      | Delete old rows   |
| Calculate next    |      | rows from DB     |      | from cron_schedule|
| run times         |      | Execute each job |      | based on lifetime |
| Insert 'pending'  |      | Update status    |      | settings          |
| rows into DB      |      | to running/      |      |                   |
|                   |      | success/error    |      |                   |
+-------------------+      +------------------+      +-------------------+
```

### 4.2 Phase 1 — Generate (`schedule_generate_every`)

- Runs only if the last generate was more than `schedule_generate_every` minutes ago.
- Reads all `crontab.xml` definitions.
- For each job, calculates all scheduled times within the next `schedule_ahead_for` minutes.
- Inserts a row for each scheduled time into `cron_schedule` with `status = 'pending'`.
- **Duplicate protection:** If a `(job_code, scheduled_at)` pair already exists, it is skipped.

```sql
-- Example rows generated by this phase
SELECT job_code, scheduled_at, status
FROM cron_schedule
WHERE status = 'pending'
ORDER BY scheduled_at;

-- +----------------------------+---------------------+---------+
-- | job_code                   | scheduled_at        | status  |
-- +----------------------------+---------------------+---------+
-- | catalog_product_alert      | 2024-01-15 02:00:00 | pending |
-- | sitemap_generate           | 2024-01-15 02:00:00 | pending |
-- | newsletter_send_all        | 2024-01-15 02:05:00 | pending |
-- +----------------------------+---------------------+---------+
```

### 4.3 Phase 2 — Run

- Fetches all `pending` rows where `scheduled_at <= NOW()`.
- For each job:
  1. Checks if `scheduled_at` is more than `schedule_lifetime` minutes in the past → marks as `missed`.
  2. Updates status to `running` and records `executed_at`.
  3. Instantiates the class and calls the method via the **Object Manager** (dependency injection).
  4. On success: sets `status = 'success'`, records `finished_at`.
  5. On exception: sets `status = 'error'`, stores the exception message in `messages`.

### 4.4 Phase 3 — Cleanup

- Runs only if the last cleanup was more than `history_cleanup_every` minutes ago.
- Deletes `success` rows older than `history_success_lifetime` minutes.
- Deletes `error`/`missed` rows older than `history_failure_lifetime` minutes.

> **Exam focus:** **Generate → Run → Cleanup** is the exact order within a single `cron:run` invocation. Memorize this sequence.

> **Exam focus:** `schedule_ahead_for` controls how far into the future rows are pre-generated. If this value is too small relative to `schedule_generate_every`, gaps will occur and jobs will be missed.

### 4.5 The `cron_schedule` Table Schema

```sql
DESCRIBE cron_schedule;

-- +---------------+---------------------+------+
-- | Field         | Type                | Null |
-- +---------------+---------------------+------+
-- | schedule_id   | int(10) unsigned    | NO   | (PK, auto_increment)
-- | job_code      | varchar(255)        | NO   | (matches crontab.xml name)
-- | status        | varchar(28)         | NO   | (pending/running/success/error/missed)
-- | messages      | text                | YES  | (exception message on error)
-- | created_at    | timestamp           | NO   | (when the row was generated)
-- | scheduled_at  | timestamp           | YES  | (when the job is meant to run)
-- | executed_at   | timestamp           | YES  | (when execution started)
-- | finished_at   | timestamp           | YES  | (when execution completed)
-- +---------------+---------------------+------+
```

---

## 5. bin/magento cron:run vs System Crontab

### 5.1 Why Two Crontab Lines?

Magento requires **two separate entries** in the system crontab:

| Entry | Purpose |
|---|---|
| **Entry 1** — `cron:run` | Generates schedule, runs pending jobs, cleans history |
| **Entry 2** — `cron:run --group=index` (or separate process manager) | In some setups, explicitly manages the index group; however, the canonical two-entry setup uses `magento cron:run` plus a cron-specific runner script |

**The standard two required entries (as per Magento official docs):**

```bash
# /var/spool/cron/crontabs/<web-user>  or  /etc/cron.d/magento

# Entry 1: Main cron runner (runs all groups)
* * * * * <web-user> /usr/bin/php /var/www/html/bin/magento cron:run 2>&1 | grep -v "Ran jobs by schedule" >> /var/www/html/var/log/magento.cron.log

# Entry 2: Cron cleanup / process manager runner
* * * * * <web-user> /usr/bin/php /var/www/html/update/cron.php >> /var/www/html/var/log/update.cron.log 2>&1
```

> **NOTE for Adobe Commerce Cloud / Magento Cloud:** The platform manages cron via `.magento.app.yaml`:

```yaml
# .magento.app.yaml
crons:
    cronrun:
        spec: "* * * * *"
        cmd: "php bin/magento cron:run || true"
    croncleanup:
        spec: "* * * * *"
        cmd: "php bin/magento cron:run --group=index || true"
```

> **Exam focus:** The **two required crontab lines** run every minute (`* * * * *`). Running them every minute does NOT mean jobs run every minute — Magento's internal locking (`schedule_generate_every`, `history_cleanup_every`) controls actual execution frequency.

> **Exam focus:** Running `bin/magento cron:run` without `--group` processes **all groups**. You can also run a specific group with `--group=default` or `--group=index`.

### 5.2 Manual Execution for Debugging

```bash
# Run all cron groups immediately
bin/magento cron:run

# Run only the default group
bin/magento cron:run --group=default

# Run only the index group
bin/magento cron:run --group=index

# Run a specific group with verbose output
bin/magento cron:run --group=default -v

# Check what jobs exist (Magento 2.4+)
bin/magento cron:status
```

### 5.3 Setting Up Cron via Magento CLI

```bash
# Magento can write the crontab entries automatically
bin/magento cron:install

# Remove the Magento crontab entries
bin/magento cron:remove

# Verify current crontab
crontab -l -u <web-user>
```

---

## 6. Missed Jobs, History Cleanup & Separate Processes

### 6.1 What Is a "Missed" Job?

A job becomes `missed` when the scheduler attempts to run it but finds that:

> `NOW() - scheduled_at > schedule_lifetime`

The job's scheduled time has passed by more than `schedule_lifetime` minutes without it being picked up.

**Root causes of missed jobs:**
- Cron was not running (system cron entry missing or broken)
- Previous job run took too long and blocked the queue
- Server was down or under extreme load
- `schedule_lifetime` is too short relative to job execution time

```
Timeline example (schedule_lifetime = 15 min):

02:00:00  -->  Job scheduled_at = 02:00:00, status = pending
               ...cron not running...
02:15:01  -->  cron:run finally executes
               scheduled_at (02:00) is 15m01s ago > schedule_lifetime (15m)
               --> status set to 'missed'
```

### 6.2 `history_cleanup_after` Setting

This setting (also referred to as `history_cleanup_every` in `cron_groups.xml`) controls **how often the cleanup phase runs**, not the retention period. The retention periods are:

| Config Key | Default | Controls |
|---|---|---|
| `history_success_lifetime` | 60 min | How long `success` rows are kept |
| `history_failure_lifetime` | 600 min | How long `error`/`missed` rows are kept |
| `history_cleanup_every` | 10 min | Minimum interval between cleanup runs |

> **Exam focus:** `history_failure_lifetime` is intentionally longer (600 min = 10 hours) so developers have time to inspect failures before they are purged.

### 6.3 `use_separate_process`

```xml
<use_separate_process>1</use_separate_process>
```

When set to `1`:
- Each job in the group is **forked into its own child process**.
- A job crash or memory exhaustion does **not** kill other jobs in the same group run.
- The parent process waits for all child processes to complete before finishing.
- Increases overhead but improves reliability and isolation.

When set to `0` (default for the `default` group):
- All jobs run **sequentially** in the same PHP process.
- A fatal error in one job can terminate the entire cron run.
- Lower overhead; fine for short-lived, low-risk tasks.

```
use_separate_process = 0 (default group):
  [cron:run process]
       |---> job_a  (runs, finishes)
       |---> job_b  (runs, finishes)
       |---> job_c  (runs, FATAL ERROR -> entire process dies, job_d never runs)

use_separate_process = 1 (index group):
  [cron:run process]
       |--[fork]--> job_a  (runs in child PID 1234)
       |--[fork]--> job_b  (runs in child PID 1235)
       |--[fork]--> job_c  (runs in child PID 1236, FATAL -> only this child dies)
       |--[fork]--> job_d  (still runs in child PID 1237)
```

> **Exam focus:** The `index` group uses `use_separate_process=1` precisely because reindexers can be memory-intensive and long-running. Isolation prevents a single failing indexer from blocking all others.

---

## 7. Debugging: cron_schedule Status Values

### 7.1 Status Reference Table

| Status | Meaning | When Set |
|---|---|---|
| `pending` | Job is scheduled but has not run yet | During **Generate** phase |
| `running` | Job is currently executing | At the start of **Run** phase |
| `success` | Job completed without exceptions | After successful execution |
| `error` | Job threw an exception | When execution throws `\Exception` |
| `missed` | Job's scheduled time expired before it ran | When `NOW() - scheduled_at > schedule_lifetime` |

### 7.2 Querying cron_schedule for Debugging

```sql
-- See all non-success jobs from the last 24 hours
SELECT job_code, status, messages, scheduled_at, executed_at, finished_at
FROM cron_schedule
WHERE status != 'success'
  AND scheduled_at >= NOW() - INTERVAL 24 HOUR
ORDER BY scheduled_at DESC;

-- Count jobs by status (health overview)
SELECT status, COUNT(*) as count
FROM cron_schedule
GROUP BY status;

-- Find stuck 'running' jobs (possible zombie processes)
SELECT *
FROM cron_schedule
WHERE status = 'running'
  AND executed_at < NOW() - INTERVAL 1 HOUR;

-- Find all missed jobs
SELECT job_code, scheduled_at, created_at
FROM cron_schedule
WHERE status = 'missed'
ORDER BY scheduled_at DESC
LIMIT 20;

-- Check last execution time of a specific job
SELECT job_code, status, executed_at, finished_at, messages
FROM cron_schedule
WHERE job_code = 'catalog_product_alert'
ORDER BY scheduled_at DESC
LIMIT 5;
```

### 7.3 The "Stuck Running" Problem

A `running` status that is hours old indicates a **zombie job** — the process died without updating the database.

```sql
-- Manually reset stuck running jobs (use with caution)
UPDATE cron_schedule
SET status = 'error',
    messages = 'Manually reset - process appears to have died'
WHERE status = 'running'
  AND executed_at < NOW() - INTERVAL 2 HOUR;
```

### 7.4 Log File Locations

```bash
# Main cron log (if configured in system crontab as shown above)
tail -f var/log/magento.cron.log

# General Magento system log (exceptions from cron jobs appear here)
tail -f var/log/system.log
tail -f var/log/exception.log

# Cron-specific debug logging (enable in Admin > Stores > Config > Advanced > System > Cron)
tail -f var/log/cron.log
```

### 7.5 Admin UI for Cron Monitoring

Path: **System > Tools > Index Management** (for index group)

For general cron monitoring, Magento does not have a native Admin UI beyond index management. Third-party modules (e.g., `aoe/scheduler`) or querying the `cron_schedule` table directly are the standard approaches.

---

## 8. What Happens If Cron Does Not Run & Recovery

### 8.1 Symptoms of Broken Cron

| Symptom | Likely Cause |
|---|---|
| Catalog price rules not applying | `catalogrule_apply_all` not running |
| Indexers showing "Reindex Required" forever | `index` group not running |
| Order confirmation emails not sending | `sales_send_order` not running |
| Sitemap not regenerating | `sitemap_generate` not running |
| `cron_schedule` table has only `pending` rows, no `success` | `cron:run` never executing |
| `cron_schedule` table has thousands of `missed` rows | Cron ran but was late/blocked |
| `cron_schedule` table is empty | Generate phase never ran |

### 8.2 Diagnostic Steps

```bash
# Step 1: Verify system crontab entries exist
crontab -l -u <web-user>

# Step 2: Manually run cron and observe output
cd /var/www/html
php bin/magento cron:run

# Step 3: Check the schedule table
mysql -u <user> -p <db> -e "
  SELECT status, COUNT(*) as cnt
  FROM cron_schedule
  GROUP BY status;
"

# Step 4: Check for pending jobs that should have run
mysql -u <user> -p <db> -e "
  SELECT job_code, scheduled_at, status
  FROM cron_schedule
  WHERE scheduled_at < NOW()
    AND status = 'pending'
  ORDER BY scheduled_at ASC
  LIMIT 10;
"

# Step 5: Check file permissions on bin/magento
ls -la bin/magento
# Should be executable: -rwxr-xr-x

# Step 6: Check for PHP errors
php bin/magento cron:run 2>&1

# Step 7: Verify Magento is not in maintenance mode
bin/magento maintenance:status
```

### 8.3 Recovery Procedures

#### Recovery Option 1 — Fix and Re-run

```bash
# 1. Fix the underlying issue (permissions, crontab, maintenance mode, etc.)
# 2. Manually trigger cron
php bin/magento cron:run

# 3. For indexers specifically, force reindex
php bin/magento indexer:reindex

# 4. Reinstall crontab entries
php bin/magento cron:install
```

#### Recovery Option 2 — Reset Missed/Stuck Jobs

```sql
-- Option A: Reset missed jobs back to pending so they can be retried
-- WARNING: Only do this if you understand the business impact of re-running them
UPDATE cron_schedule
SET status = 'pending'
WHERE status = 'missed'
  AND scheduled_at >= NOW() - INTERVAL 24 HOUR;

-- Option B: Clear the entire schedule table and let Magento rebuild it
-- WARNING: This loses all history
TRUNCATE TABLE cron_schedule;
```

```bash
# After truncating, immediately run cron to regenerate
php bin/magento cron:run
```

#### Recovery Option 3 — Run Specific Jobs Manually (Magento 2.4+)

```bash
# Magento 2.4+ introduced cron:run with job filter capability
# Some versions support running by job code via custom scripts
# Standard approach: create a small PHP script to invoke the job class directly

php -r "
require 'app/bootstrap.php';
\$bootstrap = \Magento\Framework\App\Bootstrap::create(BP, \$_SERVER);
\$app = \$bootstrap->createApplication(\Magento\Framework\App\Cron::class);
\$bootstrap->run(\$app);
"
```

### 8.4 Prevention Best Practices

```bash
# Monitor the cron_schedule table for missed jobs
# Add to monitoring/alerting system:
mysql -e "
  SELECT COUNT(*) as missed_count
  FROM cron_schedule
  WHERE status = 'missed'
    AND scheduled_at >= NOW() - INTERVAL 1 HOUR;
"
# Alert if missed_count > threshold

# Ensure proper file permissions
chmod +x bin/magento
chown -R <web-user>:<web-group> /var/www/html

# Use health check endpoints or Magento's built-in health check
curl https://yourdomain.com/health_check.php
```

> **Exam focus:** If cron has not run and jobs are `missed`, simply fixing the cron entry and running `bin/magento cron:run` will **not** automatically re-run missed jobs. Missed jobs stay `missed` permanently — you must either manually reset them to `pending` in the database, truncate the table, or re-trigger the business action manually (e.g., `indexer:reindex`).

> **Exam focus:** The `cron_schedule` table being **empty** means Generate has never run. The table having only `pending` rows with no `success` means Generate is running but the Run phase is not completing (process dying, lock contention, etc.).

---

## Quick-Reference Checklist

### crontab.xml
- [ ] Located at `<module_root>/etc/crontab.xml`
- [ ] Three required attributes on `<job>`: `name`, `instance`, `method`
- [ ] Use `<schedule>` for hardcoded cron expressions
- [ ] Use `<config_path>` for merchant-configurable schedules (points to a system config path)
- [ ] `method` attribute is **not** required to be `execute` — it can be any public method
- [ ] Jobs are grouped under `<group id="...">` elements

### CRON Groups
- [ ] `default` group: `use_separate_process=0`, runs jobs sequentially
- [ ] `index` group: `use_separate_process=1`, each job in its own forked child process
- [ ] Custom groups declared in `etc/cron_groups.xml`
- [ ] Each group can have its own `schedule_generate_every`, `schedule_ahead_for`, `schedule_lifetime`, etc.
- [ ] A fatal error in `default` group can kill all remaining jobs; in `index` group it only kills that job's child

### Scheduler Phases (in order)
- [ ] **Phase 1 — Generate:** Reads XML, calculates future run times, inserts `pending` rows
- [ ] **Phase 2 — Run:** Fetches `pending` rows due now, executes, updates status
- [ ] **Phase 3 — Cleanup:** Deletes old history rows based on lifetime settings
- [ ] Generate is throttled by `schedule_generate_every` (default 15 min)
- [ ] Cleanup is throttled by `history_cleanup_every` (default 10 min)

### Two Required Crontab Lines
- [ ] Both entries run every minute: `* * * * *`
- [ ] Entry 1: `bin/magento cron:run` — processes all groups, generates schedule, runs jobs
- [ ] Entry 2: Component-specific runner (varies by Magento version/edition/hosting)
- [ ] Cloud environments use `.magento.app.yaml` `crons:` section instead
- [ ] `bin/magento cron:install` can auto-write these entries

### cron_schedule Status Values
- [ ] `pending` — scheduled, not yet run
- [ ] `running` — currently executing
- [ ] `success` — completed without exception
- [ ] `error` — threw an exception (message stored in `messages` column)
- [ ] `missed` — scheduled_at expired before job ran (`NOW() - scheduled_at > schedule_lifetime`)

### Missed Jobs
- [ ] Caused by: cron not running, process overload, server downtime
- [ ] `schedule_lifetime` (default 15 min) determines how late a job can start before it becomes `missed`
- [ ] Missed jobs **stay missed** — they are NOT automatically retried
- [ ] To recover: reset to `pending` in DB, truncate table, or trigger action manually (e.g., `indexer:reindex`)
- [ ] `history_failure_lifetime` (default 600 min) determines how long `error`/`missed` rows are retained

### Debugging Checklist
- [ ] Query `cron_schedule` for status distribution: `SELECT status, COUNT(*) FROM cron_schedule GROUP BY status`
- [ ] `pending`-only rows → Run phase broken (check logs, memory, locks)
- [ ] Empty table → Generate phase never ran (crontab entry missing)
- [ ] Many `missed` rows → Cron was down or jobs too slow
- [ ] Stuck `running` rows → Zombie process (manually reset to `error`)
- [ ] Error details in `messages` column of `cron_schedule`
- [ ] Log files: `var/log/magento.cron.log`, `var/log/system.log`, `var/log/exception.log`
- [ ] Use `bin/magento cron:run -v` for verbose output during manual debugging

### Recovery Commands
- [ ] `bin/magento cron:run` — manually trigger all groups
- [ ] `bin/magento cron:run --group=default` — run specific group
- [ ] `bin/magento cron:install` — write system crontab entries
- [ ] `bin/magento indexer:reindex` — manually recover from missed index jobs
- [ ] `TRUNCATE TABLE cron_schedule` + `cron:run` — full reset (loses history)
- [ ] `UPDATE cron_schedule SET status='pending' WHERE status='missed'` — retry missed jobs
