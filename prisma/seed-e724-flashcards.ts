import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const flashcards = [
  {
    question: "Where must crontab.xml be placed in a module, and what three attributes are required on the <job> element?",
    answer: "crontab.xml must be placed in the module's etc/ directory (app/code/Vendor/Module/etc/crontab.xml). The three required attributes on the <job> element are: name (unique job identifier), instance (fully qualified PHP class name), and method (public method to call). The <schedule> and <config_path> child elements are optional.",
    hint: "The file lives alongside other module configuration files, and the job needs to know what to call and how to identify itself.",
    topic: "Cron Configuration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 3 — Cron Configuration & Cron Groups"
  },
  {
    question: "What are the three phases of Magento's cron:run execution?",
    answer: "The three phases are: (1) Cleanup — marks old 'pending' rows as 'missed' and deletes old history records based on lifetime config; (2) Generate — reads crontab.xml from all modules, calculates which jobs should run, and inserts 'pending' rows into cron_schedule; (3) Run — queries for pending jobs that are due, locks each one, executes the class method, and updates status to success or error.",
    hint: "Think of it as housekeeping first, planning second, and execution third.",
    topic: "Cron Architecture",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 3 — Cron Configuration & Cron Groups"
  },
  {
    question: "What are the five possible statuses in the cron_schedule database table?",
    answer: "The five statuses are: pending (generated and waiting to execute), running (currently being executed), success (completed without exception), missed (not picked up within schedule_lifetime window, default 15 minutes), and error (threw an exception during execution, with details stored in the messages column).",
    hint: "A job progresses through a state machine from generation to completion, with two possible failure states.",
    topic: "Cron Schedule",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 3 — Cron Configuration & Cron Groups"
  },
  {
    question: "Why do you typically need to run cron:run twice when testing a new cron job?",
    answer: "The first cron:run generates 'pending' entries in the cron_schedule table during the Generate phase. The second cron:run finds those pending entries and actually executes them during the Run phase, updating their status to 'success' or 'error'. This two-step process ensures jobs are properly scheduled before execution.",
    hint: "The generation and execution happen in separate invocations of the same command.",
    topic: "Cron Testing",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 3 — Cron Configuration & Cron Groups"
  },
  {
    question: "What is the correct field order for a Unix cron schedule expression?",
    answer: "The five fields in order are: minute (0-59), hour (0-23), day of month (1-31), month (1-12), day of week (0-7, where 0 and 7 are Sunday). For example, '0 2 * * *' means daily at 2:00 AM, and '*/5 * * * *' means every 5 minutes. A common exam trap is reversing minute and hour.",
    hint: "The smallest unit comes first, progressing to larger units of time.",
    topic: "Cron Expressions",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 3 — Cron Configuration & Cron Groups"
  },
  {
    question: "What are the built-in cron groups in Magento 2, and why does the 'index' group use a separate process?",
    answer: "The built-in groups are: default (general Magento jobs), index (indexer-related jobs), consumers (message queue consumers), and staging (Commerce-only, content staging). The index group uses use_separate_process=1 to spawn a child PHP process, preventing heavy indexing operations from blocking other scheduled tasks in the default group.",
    hint: "Heavy operations need isolation to avoid starving other jobs of resources.",
    topic: "Cron Groups",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 3 — Cron Configuration & Cron Groups"
  },
  {
    question: "What is the schedule_lifetime parameter, and what happens when a cron job exceeds it?",
    answer: "schedule_lifetime (default 15 minutes for the default group) is the window after which a pending job that was never picked up transitions to 'missed' status. For example, if a job is scheduled for 14:00 and cron:run doesn't process it until 14:16, it will be marked as 'missed' instead of being executed. This is configurable per cron group in cron_groups.xml.",
    hint: "There is a time window of tolerance before Magento gives up on executing a pending job.",
    topic: "Missed Crons",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 3 — Cron Configuration & Cron Groups"
  },
  {
    question: "How does Magento prevent two cron processes from running the same job simultaneously?",
    answer: "Magento uses a two-level locking mechanism: (1) Group-level lock via LockManagerInterface for schedule generation and cleanup, (2) Job-level atomic lock via a database UPDATE that sets status from 'pending' to 'running'. If the UPDATE affects 0 rows, another process already locked the job and this process skips it. If it affects 1 row, this process won the lock.",
    hint: "An atomic database operation acts as a mutex — only one process can successfully claim the lock.",
    topic: "Cron Locking",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 3 — Cron Configuration & Cron Groups"
  },
  {
    question: "What is the difference between using <schedule> versus <config_path> in a crontab.xml job declaration?",
    answer: "<schedule> hardcodes the cron expression directly in XML (e.g., '*/5 * * * *'). <config_path> references a system configuration path so the schedule can be set by admins in Stores > Configuration. Examples include currency_rates_update and product_alert which use config_path. A job can use either element but not both; if neither is specified, the job has no automatic schedule.",
    hint: "One is static in code, the other is dynamic via admin panel configuration.",
    topic: "Cron Configuration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 3 — Cron Configuration & Cron Groups"
  },
  {
    question: "What requirements does a cron job PHP class have in terms of interfaces and method signatures?",
    answer: "Cron job classes do NOT need to implement any specific interface — unlike observers or plugins. The method name is defined in crontab.xml (convention is 'execute') and must be public. Dependencies are injected via constructor following the standard Magento DI pattern. If the method throws an exception, the job is marked as 'error'; catching and swallowing exceptions results in a 'success' status even if the job failed.",
    hint: "Unlike other Magento extension points, cron classes have no mandatory interface contract.",
    topic: "Cron Implementation",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 3 — Cron Configuration & Cron Groups"
  },
  {
    question: "How should Magento's cron be configured at the OS level for production?",
    answer: "The OS crontab should have a single entry running every minute (*/1 * * * *) that calls bin/magento cron:run using the full path to the PHP binary. It should run as the web server user (e.g., www-data, nginx). The command should NOT include a --group flag — Magento handles spawning separate processes per group internally. Output should be logged to var/log/magento.cron.log.",
    hint: "A single entry every minute, running as the web server user, without group restrictions.",
    topic: "Production Cron Setup",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 3 — Cron Configuration & Cron Groups"
  },
  {
    question: "Where are custom cron groups declared, and what are the key configurable parameters?",
    answer: "Custom cron groups are declared in etc/cron_groups.xml. Key parameters include: schedule_generate_every (how often to generate schedule entries), schedule_ahead_for (how far ahead to generate), schedule_lifetime (window before pending becomes missed), history_cleanup_every, history_success_lifetime, history_failure_lifetime (default 4320 min / 3 days), and use_separate_process (whether to spawn a child process).",
    hint: "The file name is different from crontab.xml and controls group behavior rather than individual job schedules.",
    topic: "Cron Groups",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 3 — Cron Configuration & Cron Groups"
  },
  {
    question: "What is the job_code column in cron_schedule, and how does it relate to crontab.xml?",
    answer: "The job_code column in the cron_schedule table maps directly to the 'name' attribute in the crontab.xml <job> declaration. It is the unique identifier used to track and query specific job execution history. Other important columns include scheduled_at (when the job should run), executed_at (when it actually started), finished_at (when it completed), and messages (exception details for error status).",
    hint: "The XML attribute that uniquely identifies a job becomes the key field in the database table.",
    topic: "Cron Schedule Table",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 3 — Cron Configuration & Cron Groups"
  },
  {
    question: "What happens to a cron job that is stuck in 'running' status after the process dies?",
    answer: "Magento does NOT automatically recover stuck running jobs. If a cron process dies while a job has status 'running', it remains stuck indefinitely. Manual intervention is required — either via SQL UPDATE to reset the status to 'error', or through a cleanup script. This is a known limitation of the cron system that requires monitoring in production.",
    hint: "There is no automatic recovery mechanism for this specific failure scenario.",
    topic: "Cron Troubleshooting",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 3 — Cron Configuration & Cron Groups"
  },
  {
    question: "What commands does bin/magento cron:install and cron:remove perform?",
    answer: "bin/magento cron:install automatically generates the OS crontab entry for the web server user, adding the standard every-minute cron:run invocation. The --force flag overwrites any existing entry. bin/magento cron:remove deletes the Magento crontab entry. You can verify the current entries with crontab -l. These are convenience commands that modify the system crontab directly.",
    hint: "These commands automate what you would otherwise do manually by editing crontab -e.",
    topic: "Cron CLI",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 3 — Cron Configuration & Cron Groups"
  },
  {
    question: "What are the two minimum required files for Magento 2 to recognize a module?",
    answer: "The two minimum required files are registration.php and etc/module.xml. Without either of these files, Magento will not discover or register the module. registration.php registers the module path via ComponentRegistrar, and module.xml formally declares the module name and optional dependencies.",
    hint: "Think about what Magento needs to discover a module's existence and declare its identity.",
    topic: "Module Structure",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 1 — Module File Structure & Registration"
  },
  {
    question: "What are the five component type constants available in ComponentRegistrar::register()?",
    answer: "The five constants are ComponentRegistrar::MODULE, ComponentRegistrar::THEME, ComponentRegistrar::LANGUAGE, ComponentRegistrar::LIBRARY, and ComponentRegistrar::SETUP. The most commonly used are MODULE, THEME, LANGUAGE, and LIBRARY. SETUP is used internally for setup modules.",
    hint: "Magento registers more than just modules — themes, translations, and libraries are also components.",
    topic: "Module Registration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 1 — Module File Structure & Registration"
  },
  {
    question: "How does Magento discover registration.php files for modules placed in app/code/?",
    answer: "Magento uses a glob pattern (app/code/*/*/registration.php) defined in app/etc/registration_globlist.php to automatically find and require all registration.php files. For vendor/ modules, registration.php is loaded via Composer's autoload.files mechanism instead.",
    hint: "Think about a pattern-based file scanning approach defined in a specific configuration file.",
    topic: "Module Discovery",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 1 — Module File Structure & Registration"
  },
  {
    question: "What is the difference between <sequence> in module.xml and 'require' in composer.json?",
    answer: "The <sequence> element in module.xml is a soft dependency that controls the configuration merge/load order — it tells Magento to load the listed modules before yours if they are enabled. The 'require' in composer.json is a hard dependency that the Composer installer enforces — the module will not install without the required packages.",
    hint: "One is about ordering, the other is about existence.",
    topic: "Module Dependencies",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 1 — Module File Structure & Registration"
  },
  {
    question: "In Magento 2, what is the correct composer.json 'type' value for a module, and what other valid types exist?",
    answer: "The correct type for a module is 'magento2-module'. Other valid Magento component types include 'magento2-theme', 'magento2-language', and 'magento2-library'. The type field tells the Composer/Magento installer what kind of component the package is.",
    hint: "The type follows a naming pattern: magento2-{component}.",
    topic: "Composer Configuration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 1 — Module File Structure & Registration"
  },
  {
    question: "How does Magento 2's area-based configuration loading work for etc/ XML files?",
    answer: "Configuration files are loaded in a two-pass merge: first from etc/ (global scope), then from etc/{area}/ (area-specific). Area-specific configuration extends or overrides global configuration of the same filename. For example, etc/di.xml is loaded globally, then etc/frontend/di.xml overrides it for frontend requests.",
    hint: "Think of it as a layered system where area-specific configs sit on top of global configs.",
    topic: "Area Configuration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 1 — Module File Structure & Registration"
  },
  {
    question: "What router id values are used for frontend and admin routes.xml, and how does the frontName relate to the URL?",
    answer: "Frontend routes use router id='standard', while admin routes use router id='admin'. The frontName attribute becomes the first URL segment after the domain: domain.com/{frontName}/controller/action. Routes.xml must be placed in etc/frontend/ for storefront routes or etc/adminhtml/ for admin routes.",
    hint: "The router id distinguishes the type of request handler, and the frontName maps directly to URL structure.",
    topic: "Routing",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 1 — Module File Structure & Registration"
  },
  {
    question: "What file stores the list of enabled/disabled modules in Magento 2, and should it be committed to version control?",
    answer: "The file app/etc/config.php stores the authoritative list of enabled (1) and disabled (0) modules. It is auto-generated by CLI commands like module:enable/disable and should be committed to version control. This is different from app/etc/env.php, which contains environment-specific settings and should NOT be in version control.",
    hint: "This file lives in app/etc/ and is generated, not manually edited.",
    topic: "Module Lifecycle",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 1 — Module File Structure & Registration"
  },
  {
    question: "What steps must be performed after running bin/magento module:enable for a new module?",
    answer: "After enabling a module, you must run: (1) bin/magento setup:upgrade to run schema and data patches, (2) bin/magento setup:di:compile to regenerate DI configuration including factories and interceptors, and (3) bin/magento cache:flush to clear all caches. Skipping setup:di:compile can cause 'Interceptor class does not exist' errors.",
    hint: "Enabling only updates config.php — three more commands are needed to fully activate the module.",
    topic: "CLI Commands",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 1 — Module File Structure & Registration"
  },
  {
    question: "Which configuration files are exclusively adminhtml-only and which are frontend-only?",
    answer: "system.xml and menu.xml are adminhtml-only files — system.xml defines system configuration fields and menu.xml defines admin menu items. sections.xml is frontend-only — it defines customer data sections for private content. Files like di.xml and events.xml can exist in both global and area-specific directories.",
    hint: "Think about what configuration makes sense only in the admin panel versus the storefront.",
    topic: "Configuration Files",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 1 — Module File Structure & Registration"
  },
  {
    question: "What is the purpose of the --clear-static-content flag on module:enable and module:disable?",
    answer: "The --clear-static-content flag removes files from pub/static/ when enabling or disabling a module. This is needed when a module adds static assets (JavaScript, CSS) to avoid stale cached files being served to users. Both module:enable and module:disable support this flag along with --all and --force.",
    hint: "This flag addresses a caching issue with frontend assets when module state changes.",
    topic: "Module Commands",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 1 — Module File Structure & Registration"
  },
  {
    question: "How does the module naming convention differ across XML, PHP namespaces, and Composer packages?",
    answer: "In XML/config the format is Vendor_ModuleName (underscore separator). In PHP namespaces it uses Vendor\\ModuleName (backslash separator). In Composer package names it is vendor/module-name (hyphen separator, all lowercase). For example: Magento_Catalog, Magento\\Catalog, and magento/module-catalog all refer to the same module.",
    hint: "Three different separators are used depending on the context: underscore, backslash, or hyphen.",
    topic: "Naming Conventions",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 1 — Module File Structure & Registration"
  },
  {
    question: "Why would a module use <sequence> to list another module in its module.xml?",
    answer: "The <sequence> element ensures that the listed module's configuration is merged before yours. This is important when your module's plugin needs to run after another module's plugin on the same method (with equal sortOrder), when your preferences need to override another module's preferences, or when your layout XML instructions should apply after another module's. It controls the merge order, not installation requirements.",
    hint: "Consider what happens when two modules define conflicting configurations that depend on merge order.",
    topic: "Module Sequence",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 1 — Module File Structure & Registration"
  },
  {
    question: "Where should an observer be registered if it should only fire on storefront requests?",
    answer: "The observer should be registered in etc/frontend/events.xml. An observer registered in etc/events.xml (global) fires in all areas including admin, frontend, REST API, and cron. Using the most restrictive area possible is recommended for performance. Similarly, etc/adminhtml/events.xml restricts firing to admin panel requests only.",
    hint: "Place the events.xml file in the area-specific subdirectory matching where you want it to fire.",
    topic: "Observer Scope",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 1 — Module File Structure & Registration"
  },
  {
    question: "What happens if the name attribute in module.xml does not match the name used in registration.php?",
    answer: "A mismatch between the module name in module.xml and registration.php causes a module load failure. The name attribute in module.xml must exactly match the second argument passed to ComponentRegistrar::register() in registration.php. Both must use the Vendor_ModuleName format.",
    hint: "These two files must agree on the module's identity for Magento to properly register it.",
    topic: "Module Registration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 1 — Module File Structure & Registration"
  },
  {
    question: "What is the correct deployment command sequence for a production Magento 2 environment?",
    answer: "The correct order is: (1) maintenance:enable, (2) setup:upgrade, (3) setup:di:compile, (4) setup:static-content:deploy, (5) cache:flush, (6) indexer:reindex if needed, (7) maintenance:disable. Running them out of order causes issues — for example, setup:upgrade clears generated/ and pub/static/, so di:compile must follow it.",
    hint: "Think about the dependency chain: schema changes before code generation, code generation before static assets, everything before cache clearing.",
    topic: "Deployment Order",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 2 — CLI Commands & Setup Scripts"
  },
  {
    question: "What is the difference between cache:flush and cache:clean in Magento 2?",
    answer: "cache:flush empties the entire cache storage backend, including data from other applications sharing the same Redis or Memcached instance. cache:clean removes only Magento-tagged cache entries, leaving other data in the storage intact. In shared environments, cache:clean is safer; cache:flush guarantees a complete purge but can affect other applications.",
    hint: "One is a surgical removal of tagged entries; the other wipes the entire storage pool.",
    topic: "Cache Commands",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 2 — CLI Commands & Setup Scripts"
  },
  {
    question: "What does setup:upgrade do, and why must setup:di:compile follow it?",
    answer: "setup:upgrade runs pending schema patches (SchemaPatchInterface) and data patches (DataPatchInterface), registers new modules, and by default clears generated/ and pub/static/. It does NOT compile DI artifacts. If setup:di:compile is not run afterward, the generated/ directory will be empty, causing 'Interceptor class does not exist' or 'Class not found' errors in production mode.",
    hint: "This command handles database schema changes but destroys compiled code, creating a gap that another command must fill.",
    topic: "Setup Commands",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 2 — CLI Commands & Setup Scripts"
  },
  {
    question: "What does the --keep-generated flag do on setup:upgrade, and when should it be used?",
    answer: "The --keep-generated flag prevents setup:upgrade from clearing the generated/ and pub/static/ directories. It is used in zero-downtime, blue-green, or pipeline deployments where DI compilation (setup:di:compile) and static content deployment have already been performed on a build server. Without this flag, setup:upgrade always deletes these directories.",
    hint: "Think about deployment strategies where compiled artifacts are pre-built before the upgrade step.",
    topic: "Deployment Strategies",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 2 — CLI Commands & Setup Scripts"
  },
  {
    question: "What are the four indexer status values in Magento 2 and what does each mean?",
    answer: "The four statuses are: 'valid' (Ready) — index is up to date; 'invalid' (Reindex required) — index is stale and needs rebuilding; 'working' (Processing) — reindex is currently in progress; 'suspended' — indexer has been paused, e.g., during import. An invalid indexer still serves the last valid data; it does not mean the index is unusable.",
    hint: "These map to CLI display names: Ready, Reindex required, Processing, and Suspended.",
    topic: "Indexer Status",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 2 — CLI Commands & Setup Scripts"
  },
  {
    question: "What is the difference between indexer:reset and indexer:reindex?",
    answer: "indexer:reset marks an indexer as 'invalid' (Reindex required) but does NOT run any reindex or modify index data — it simply queues it for future reindexing. indexer:reindex actually performs the full reindex operation by calling executeFull() on the action class, rebuilding the index table and setting status to 'valid'. Reset is used to force a reindex to happen later.",
    hint: "One marks it as needing work; the other actually does the work.",
    topic: "Indexer Commands",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 2 — CLI Commands & Setup Scripts"
  },
  {
    question: "What are the two indexer modes and what CLI values correspond to them?",
    answer: "The two modes are 'Update on Save' (CLI value: realtime) which reindexes immediately when an entity is saved, and 'Update by Schedule' (CLI value: schedule) which uses changelog tables and a cron job to batch-reindex. In production, 'Update by Schedule' is recommended to avoid front-end slowdowns during entity saves.",
    hint: "The CLI names are counterintuitive — one sounds like it happens now, the other like it is planned.",
    topic: "Index Modes",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 2 — CLI Commands & Setup Scripts"
  },
  {
    question: "What does setup:di:compile generate, and where are the artifacts stored?",
    answer: "setup:di:compile generates Factories (auto-generated factory classes), Interceptors (plugin proxy classes), Proxies (lazy-loading proxy classes), and extension attribute interfaces. These are stored in generated/code/. It also creates compiled DI configuration per area (global.php, frontend.php, adminhtml.php, graphql.php) in generated/metadata/.",
    hint: "Think about what code artifacts the DI framework needs to function at runtime in production.",
    topic: "DI Compilation",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 2 — CLI Commands & Setup Scripts"
  },
  {
    question: "How does maintenance mode work at the filesystem level in Magento 2?",
    answer: "Maintenance mode is controlled by the existence of var/.maintenance.flag — creating this file enables maintenance mode, deleting it disables it. Whitelisted IPs are stored in var/.maintenance.ip as a comma-separated list. The --ip flag on maintenance:enable replaces the existing whitelist; use maintenance:allow-ips --add to append IPs.",
    hint: "A simple flag file in the var/ directory is the switch, not a database setting.",
    topic: "Maintenance Mode",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 2 — CLI Commands & Setup Scripts"
  },
  {
    question: "Where does setup:static-content:deploy output files, and what flags control its behavior?",
    answer: "Output goes to pub/static/ organized by area, theme, and locale (e.g., pub/static/frontend/Magento/luma/en_US/). Key flags include: -f (force, required in developer mode), -j N (parallel jobs), -t (specific theme), -a (specific area), --exclude-theme, and locale as positional arguments. In developer mode, static files are generated on-the-fly so this command is typically unnecessary.",
    hint: "The output location is under pub/, not var/ or generated/.",
    topic: "Static Content",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 2 — CLI Commands & Setup Scripts"
  },
  {
    question: "What causes the error 'Class Interceptor does not exist' after a deployment?",
    answer: "This error occurs when setup:upgrade was run (which clears generated/ by default) but setup:di:compile was not run afterward. Without DI compilation, interceptor classes needed by the plugin system do not exist in the generated/code/ directory. The fix is to run setup:di:compile followed by cache:flush.",
    hint: "A step was skipped in the deployment sequence that generates the necessary proxy classes.",
    topic: "Deployment Troubleshooting",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 2 — CLI Commands & Setup Scripts"
  },
  {
    question: "What is the purpose of the patch_list and setup_module database tables?",
    answer: "The patch_list table tracks which schema and data patches have already been applied, preventing them from running twice. The setup_module table tracks installed module schema versions. When setup:upgrade runs, it checks these tables to determine which patches are pending and updates them after successful execution.",
    hint: "These tables prevent duplicate execution of database changes and track module installation state.",
    topic: "Setup Scripts",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 2 — CLI Commands & Setup Scripts"
  },
  {
    question: "Why is setup:static-content:deploy required before going live in production mode?",
    answer: "In production mode, Magento does not generate static files on-the-fly — they must be pre-generated. setup:static-content:deploy compiles Less/CSS, copies JS, fonts, and images into pub/static/ for each configured theme and locale. Without it, the storefront will have broken styles and missing JavaScript. The -f flag is needed to deploy in developer mode.",
    hint: "Production mode expects all static assets to already exist; it does not create them per request.",
    topic: "Static Content Deploy",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 2 — CLI Commands & Setup Scripts"
  },
  {
    question: "What directories does var/ contain and what is their purpose?",
    answer: "Key var/ directories include: cache/ (file-based cache storage in dev), page_cache/ (file-based FPC), session/ (PHP session files), log/ (system.log, exception.log, debug.log), view_preprocessed/ (Less/CSS preprocessing cache), tmp/ (temp files during import/export), and report/ (error reports). var/.maintenance.flag and var/.maintenance.ip control maintenance mode.",
    hint: "This directory holds runtime-generated data that is not source code — caches, logs, sessions, and temporary files.",
    topic: "File System",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 2 — CLI Commands & Setup Scripts"
  },
  {
    question: "What happens if you use cache:flush on a shared Redis instance?",
    answer: "cache:flush empties the entire Redis database, not just Magento-tagged entries. If another application shares the same Redis instance, its cache data will also be wiped. In shared environments, cache:clean is preferred because it only removes Magento-tagged cache entries, leaving other applications' data intact.",
    hint: "The scope of the flush operation extends beyond Magento to the entire cache backend.",
    topic: "Cache Management",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 2 — CLI Commands & Setup Scripts"
  },
  {
    question: "What is the purpose of Magento 2's indexing system, and how does it relate to EAV tables?",
    answer: "Magento stores primary data in normalized EAV tables (e.g., catalog_product_entity, eav_attribute), which are flexible but slow to query. The indexing system pre-computes and materializes this data into flat, denormalized index tables that can be queried quickly on the storefront. Indexers are persistent materialized views — not caches — and invalidating an indexer marks it as needing reindex, not cleared.",
    hint: "Think of indexers as read-optimized projections of write-optimized EAV data.",
    topic: "Indexing Overview",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 4 — Indexing System"
  },
  {
    question: "What are the three methods defined by ActionInterface that a custom indexer must implement?",
    answer: "The three methods are: executeFull() — rebuilds the entire index table (called by indexer:reindex CLI command); executeList(array $ids) — reindexes a batch of entity IDs (called by mview changelog processing); executeRow($id) — reindexes a single entity (called in Update on Save mode during entity save). A properly functioning indexer should also implement MviewActionInterface with its execute($ids) method.",
    hint: "Three levels of granularity: everything, a batch, or a single item.",
    topic: "Indexer Interface",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 4 — Indexing System"
  },
  {
    question: "How does Mview (Materialized View) enable delta/incremental indexing in Magento 2?",
    answer: "Mview tracks changes using MySQL triggers on source tables (declared in mview.xml). When data changes, triggers write the entity_id to a changelog table (named <view_id>_cl). A cron job (indexer_update_all_views in the index group) reads unprocessed changelog rows and calls execute(array $ids) on the indexer, updating only the changed entities. The mview_state table tracks the last processed version_id.",
    hint: "Database triggers capture what changed, a changelog table records it, and cron processes the backlog.",
    topic: "Mview Delta Indexing",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 4 — Indexing System"
  },
  {
    question: "What is the critical relationship between view_id in indexer.xml and id in mview.xml?",
    answer: "The view_id attribute in indexer.xml must exactly match the id attribute in mview.xml. This linkage connects the indexer declaration to its mview subscription for delta tracking. If they don't match, delta indexing silently breaks — the indexer won't find its mview subscription. This is a very common exam trap and source of bugs.",
    hint: "Two XML files must agree on an identifier for the incremental indexing system to work.",
    topic: "Indexer Configuration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 4 — Indexing System"
  },
  {
    question: "Why must you run a full reindex after switching an indexer to 'Update by Schedule' mode?",
    answer: "While the indexer was in 'realtime' (Update on Save) mode, no changelog entries were written to the _cl table because MySQL triggers didn't exist. After switching to 'schedule' mode, the _cl table starts empty and mview has no record of changes made during the realtime period. Only a full reindex can guarantee data consistency. This is the #1 tricky exam point about indexer modes.",
    hint: "The changelog starts with a blank slate, so any changes from the previous mode are invisible to the new mode.",
    topic: "Index Mode Switch",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 4 — Indexing System"
  },
  {
    question: "What is the difference between Update on Save and Update by Schedule indexer modes?",
    answer: "Update on Save (realtime) runs synchronously — it blocks the admin save while the index is updated, keeping the index always current but making saves slow. Update by Schedule (schedule) runs asynchronously — saves are fast because only the EAV data is written and a MySQL trigger logs the change; a cron job later processes the changelog. Schedule mode has a lag but is recommended for production.",
    hint: "One blocks the user for immediate freshness; the other defers work for faster saves.",
    topic: "Index Modes",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 4 — Indexing System"
  },
  {
    question: "How does the flat catalog indexer work, and what limitations does it have?",
    answer: "The flat catalog indexer collapses EAV data into a single wide table per store view (e.g., catalog_product_flat_1), replacing multi-JOIN EAV queries with single-table lookups. Limitations include: must be enabled in config AND indexed, creates per-store-view tables, custom attributes must be marked 'Used in product listing' to appear, schema is static requiring reindex for changes, and it is not recommended for large catalogs with frequent attribute changes.",
    hint: "It trades EAV flexibility for read performance by creating a denormalized table per store view.",
    topic: "Flat Catalog",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 4 — Indexing System"
  },
  {
    question: "What does the price indexer produce, and why is it customer-group aware?",
    answer: "The price indexer materializes final product prices into catalog_product_index_price, including tier pricing, group pricing, special prices, and catalog price rules. It is customer-group aware because different customer groups can have different prices — so it stores one row per product per customer group per website. It must be re-indexed whenever prices, customer groups, tax rules, or currency rates change.",
    hint: "Prices vary based on who is shopping, not just what product is being viewed.",
    topic: "Price Indexer",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 4 — Indexing System"
  },
  {
    question: "Where are MySQL triggers created in the Mview system, and what do they capture?",
    answer: "MySQL triggers are created on source tables (EAV tables like catalog_product_entity), NOT on the index tables. Three triggers are created per subscription: AFTER INSERT, AFTER UPDATE, and AFTER DELETE. Each trigger writes the entity_id (from the entity_column attribute in mview.xml) to the changelog table (<view_id>_cl). Triggers are created/dropped automatically during setup:upgrade or when switching index modes.",
    hint: "The triggers watch the tables where data is written, not where indexed data is stored.",
    topic: "Mview Triggers",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 4 — Indexing System"
  },
  {
    question: "How does the catalogsearch_fulltext indexer differ from other Magento indexers?",
    answer: "The catalogsearch_fulltext indexer sends data to an external search engine (Elasticsearch 7.x or OpenSearch), not just MySQL tables. It indexes product attributes that are marked 'Use in Search' or 'Searchable' in the attribute configuration. After changing searchable attribute settings, a full catalogsearch_fulltext reindex is required to update the external search engine.",
    hint: "This indexer pushes data outside the database to a specialized search service.",
    topic: "Search Indexer",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 4 — Indexing System"
  },
  {
    question: "What is the difference between indexer status and cache status in Magento 2?",
    answer: "Indexer status is stored in the indexer_state database table and managed by indexer:reset/reindex commands. Cache status is managed by the cache backend (Redis, file, etc.) and cleared by cache:clean/flush commands. These are completely separate systems — flushing the cache does NOT reindex, and reindexing does NOT flush the cache. An invalid indexer serves stale data; an invalid cache is regenerated on next request.",
    hint: "They are independent systems with different storage, different commands, and different behaviors when invalidated.",
    topic: "Indexer vs Cache",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 4 — Indexing System"
  },
  {
    question: "How does the indexer dependency system work in indexer.xml?",
    answer: "Dependencies are declared in indexer.xml using the <dependencies> element with nested <indexer id='...'/> references. This ensures dependent indexers run first when bin/magento indexer:reindex is called without arguments — Magento respects the dependency order. Dependencies are soft in CLI reindex — you can override them by specifying indexers manually. For example, catalog_product_price may depend on catalogrule_rule.",
    hint: "Like module sequence, indexer dependencies control execution order rather than enforcing existence.",
    topic: "Indexer Dependencies",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 4 — Indexing System"
  },
  {
    question: "What is the changelog table structure in Mview, and how is it processed?",
    answer: "The changelog table (named <view_id>_cl) has two columns: version_id (auto-incrementing cursor) and entity_id (the changed entity's ID). The mview subscriber tracks the last processed version_id in the mview_state table and only processes newer rows. During cron execution, the indexer_update_all_views job reads unprocessed rows, calls execute(array $ids), and advances the version_id pointer.",
    hint: "It functions like a write-ahead log with a cursor that advances as entries are processed.",
    topic: "Mview Changelog",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 4 — Indexing System"
  },
  {
    question: "What are the key attributes required in the indexer.xml declaration for a custom indexer?",
    answer: "The required attributes are: id (unique string identifier used in CLI commands), view_id (must match the id in mview.xml for delta tracking), and class (PHP class implementing ActionInterface). Optional attributes include primary (entity type for context). The <title> and <description> child elements provide human-readable labels. The <dependencies> element controls execution order relative to other indexers.",
    hint: "Three attributes identify the indexer, link it to mview, and point to its implementation class.",
    topic: "Indexer Declaration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 4 — Indexing System"
  },
  {
    question: "What is the MSI (Multi-Source Inventory) inventory indexer, and how does it differ from the legacy cataloginventory_stock indexer?",
    answer: "The MSI inventory indexer (from the Magento_Inventory module family) introduces the concepts of Sources (physical warehouses) and Stocks (virtual aggregations of sources). It materializes per-stock salability for products into inventory_stock_N tables (one per stock). The legacy cataloginventory_stock indexer uses a simpler single-source model with the cataloginventory_stock_status table. MSI is the default in Magento 2.3+.",
    hint: "MSI adds the concept of multiple physical locations aggregated into virtual stocks.",
    topic: "Inventory Indexer",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 4 — Indexing System"
  },
  {
    question: "What is Dependency Injection in Magento 2, and what is the primary method used?",
    answer: "Dependency Injection (DI) is a design pattern where an object's dependencies are provided to it rather than created by it. Magento 2 uses constructor injection exclusively as its primary DI mechanism — all dependencies are declared as typed parameters in the constructor, and the ObjectManager resolves and injects them automatically via PHP reflection. Property and setter injection are not used in the Magento core.",
    hint: "Dependencies are declared in one place and automatically supplied by the framework's container.",
    topic: "Dependency Injection",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 6 — Dependency Injection Fundamentals"
  },
  {
    question: "What does the <preference> node in di.xml do, and how are conflicts resolved?",
    answer: "The <preference> node maps an interface (or abstract class) to a concrete implementation, telling the ObjectManager which class to instantiate when a constructor type-hints an interface. It is a global substitution — every class using that interface gets the specified implementation. Only one preference can win per interface; when multiple modules declare preferences for the same interface, the last one merged (based on module load order) wins.",
    hint: "It is the bridge between 'what I need' (interface) and 'what I get' (concrete class).",
    topic: "DI Preferences",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 6 — Dependency Injection Fundamentals"
  },
  {
    question: "What is a virtualType in di.xml, and how does it differ from a regular type?",
    answer: "A virtualType creates a named, configured instance of an existing class without writing a new PHP class file. It exists only in DI configuration — its name looks like a fully qualified class name but no corresponding PHP file is created. It inherits all methods and properties of its parent type but has different constructor argument values. It can be injected using xsi:type='object' and can even extend another virtualType.",
    hint: "It is a configuration-only alias that customizes an existing class without any new code.",
    topic: "Virtual Types",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 6 — Dependency Injection Fundamentals"
  },
  {
    question: "What is the difference between shared='true' and shared='false' instances in Magento DI?",
    answer: "shared='true' (the default) creates one instance per request that is reused everywhere — like a singleton. shared='false' creates a new instance on every injection or creation call. Use shared='true' for stateless services like repositories and helpers. Use shared='false' for stateful data objects like models carrying request-specific data, shopping carts, or session-bound objects.",
    hint: "One reuses the same object everywhere; the other gives each consumer a fresh copy.",
    topic: "Shared Instances",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 6 — Dependency Injection Fundamentals"
  },
  {
    question: "In what three scenarios is direct ObjectManager usage acceptable in Magento 2?",
    answer: "Direct ObjectManager usage is acceptable only in: (1) auto-generated Factory classes (which wrap ObjectManager::create()), (2) auto-generated Proxy classes (which use ObjectManager for lazy instantiation), and (3) test code (integration tests use Bootstrap::getObjectManager()). Using ObjectManager in any regular business logic class is a coding standards violation that hides dependencies and breaks testability.",
    hint: "Three specific scenarios where the framework itself needs the container — everything else must use constructor injection.",
    topic: "ObjectManager Usage",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 6 — Dependency Injection Fundamentals"
  },
  {
    question: "How do auto-generated Factories work in Magento 2, and when should they be used?",
    answer: "Factories are auto-generated by setup:di:compile following the naming convention {ClassName}Factory (e.g., OrderFactory). They wrap ObjectManager::create() and always return a new instance when ->create() is called. Use factories when you need to create multiple new instances of stateful objects at runtime. In developer mode, factories are generated on-the-fly (JIT) by the autoloader.",
    hint: "Inject the factory, call create() for each new object — never inject the model directly for stateful objects.",
    topic: "Factory Pattern",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 6 — Dependency Injection Fundamentals"
  },
  {
    question: "How does the Proxy pattern work in Magento 2, and when should it be used?",
    answer: "Proxies implement lazy loading by deferring instantiation of a heavy dependency until a method is actually called on it. The proxy class (named OriginalClass\\Proxy) does NOT call parent::__construct() — the real object is only created on first method invocation via _getSubject(). Use proxies when a dependency is expensive to instantiate but may not be used in every code path. They are auto-generated and declared in di.xml.",
    hint: "A lightweight stand-in that only creates the real object when you actually need it.",
    topic: "Proxy Pattern",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 6 — Dependency Injection Fundamentals"
  },
  {
    question: "What are the eight common xsi:type values for <argument> nodes in di.xml?",
    answer: "The eight types are: string (string value), boolean (bool), number (int or float), null (null value), const (PHP constant value), object (class or virtualType instance), array (nested <item> elements), and init_parameter (reads from deployment config/env.php). The object type is used to inject both real classes and virtualType instances. Array items can themselves be objects.",
    hint: "Each type maps to a specific PHP data type that gets injected into the constructor.",
    topic: "DI Arguments",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 6 — Dependency Injection Fundamentals"
  },
  {
    question: "How does area-specific di.xml merge with global di.xml?",
    answer: "Global etc/di.xml is loaded first and applies to all areas. Area-specific files (etc/frontend/di.xml, etc/adminhtml/di.xml, etc.) are merged on top and can override arguments, preferences, or plugin declarations for that area only. The DI container is bootstrapped per area — each HTTP request resolves to a specific area before merging DI configs. CLI commands have no area by default and must explicitly set one.",
    hint: "It is a layered system where the area-specific layer sits on top of and overrides the global layer.",
    topic: "Area-Specific DI",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 6 — Dependency Injection Fundamentals"
  },
  {
    question: "What is the difference between unit tests and integration tests in relation to Magento 2's DI system?",
    answer: "Unit tests use no DI container — you manually construct the class under test with mocked dependencies, making them fast but unable to test DI wiring or plugins. Integration tests use the real ObjectManager via Bootstrap::getObjectManager(), resolving all di.xml preferences and activating plugins. Integration tests hit the real database with fixtures and are slower but verify system integration including DI configuration.",
    hint: "One mocks everything for speed and isolation; the other uses the real framework for accuracy.",
    topic: "Testing & DI",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 6 — Dependency Injection Fundamentals"
  },
  {
    question: "What does setup:di:compile generate, and what happens if it is skipped in production?",
    answer: "setup:di:compile performs 9 operations generating: Interceptors (plugin infrastructure), Factories, Proxies, Extension Attributes, Repository classes, compiled DI config per area (in generated/metadata/), and plugin lists. In production mode, if generated/ is empty and compilation hasn't been run, Magento throws fatal errors because it cannot generate classes on-the-fly. Developer mode uses JIT autoloader generation instead.",
    hint: "Production mode is read-only for generated code — everything must be pre-built.",
    topic: "DI Compilation",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 6 — Dependency Injection Fundamentals"
  },
  {
    question: "Why is injecting ObjectManagerInterface into a business class a coding standards violation?",
    answer: "Injecting ObjectManager into business logic hides dependencies (they are not visible in the constructor signature), breaks unit testing (cannot inject test doubles without the real container), creates tight coupling to the DI container itself, and violates the DI principle by having the class construct its own dependencies. Dependencies should be explicitly declared as typed constructor parameters and resolved by the framework.",
    hint: "It defeats the purpose of dependency injection by making the class create its own dependencies internally.",
    topic: "DI Best Practices",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 6 — Dependency Injection Fundamentals"
  },
  {
    question: "What are the key differences between a Factory's create() method and ObjectManager::get()?",
    answer: "Factory::create() always returns a new instance (wraps ObjectManager::create()), making it suitable for stateful data objects where each use needs a fresh object. ObjectManager::get() returns a shared singleton instance that is reused throughout the request. You can pass an array to create(['data' => [...]]) to set initial data on the new instance. Factories should be used instead of direct ObjectManager calls.",
    hint: "One creates fresh objects every time; the other reuses the same instance across the entire request.",
    topic: "Factory vs Singleton",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 6 — Dependency Injection Fundamentals"
  },
  {
    question: "How does the <type> node in di.xml configure constructor arguments for a specific class?",
    answer: "The <type name='FullyQualifiedClassName'> node uses nested <arguments> with <argument> child elements to override constructor parameter values. Each argument uses the name attribute matching the constructor parameter name and an xsi:type to specify the PHP type. This does not create a new class — it configures how the ObjectManager instantiates an existing class by providing specific values for its constructor parameters.",
    hint: "It tells the DI container what specific values to pass to a class's constructor, identified by parameter name.",
    topic: "DI Type Configuration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 6 — Dependency Injection Fundamentals"
  },
  {
    question: "What is the NoninterceptableInterface marker interface, and which generated classes implement it?",
    answer: "NoninterceptableInterface (Magento\\Framework\\ObjectManager\\NoninterceptableInterface) is a marker interface with no methods that tells the interception framework to skip interceptor generation for a class. Auto-generated Proxy classes implement this interface, because plugins should target the original class, not the proxy wrapper. This prevents infinite proxy/interceptor chains and ensures plugins apply at the correct level.",
    hint: "A no-method interface that acts as a 'do not intercept' flag for the code generation system.",
    topic: "Interception Framework",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 6 — Dependency Injection Fundamentals"
  },
  {
    question: "What is the translation priority (resolution order) in Magento 2, from highest to lowest?",
    answer: "The priority chain from highest to lowest is: (1) Database translation table — admin/inline translation overrides, (2) Theme i18n/ CSV — theme-specific scope, (3) Language Pack CSV — aggregated module translations, (4) Module i18n/ CSV — global scope. If no translation is found in any layer, the original string is returned as-is. The memory aid is D-T-L-M (Database, Theme, Language pack, Module).",
    hint: "Remember D-T-L-M — the database always wins, modules have the least priority.",
    topic: "Translation Priority",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 5 — Localization & Translation System"
  },
  {
    question: "What is the format and location for module-level translation CSV files in Magento 2?",
    answer: "Translation CSV files use a two-column format: \"Original phrase\",\"Translated phrase\" with both columns double-quoted. Module translations are stored at app/code/Vendor/Module/i18n/{locale}.csv (e.g., fr_FR.csv). The locale code must exactly match the store locale (case-sensitive). The first column (original English string) serves as the lookup key.",
    hint: "Two columns, double-quoted, with the original phrase acting as the dictionary key.",
    topic: "Translation Files",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 5 — Localization & Translation System"
  },
  {
    question: "What is the difference between module CSV and theme CSV translations in terms of scope?",
    answer: "Module CSV translations (in app/code/Vendor/Module/i18n/) have global scope — they apply across all themes simultaneously. Theme CSV translations (in app/design/frontend/Vendor/Theme/i18n/) have theme-specific scope — they only apply when that particular theme is active. Theme CSVs override module CSVs for the same string. This distinction matters for multi-theme setups.",
    hint: "One affects everything; the other is isolated to a specific visual presentation layer.",
    topic: "Translation Scope",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 5 — Localization & Translation System"
  },
  {
    question: "What does the i18n:collect-phrases CLI command do, and what flags does it support?",
    answer: "i18n:collect-phrases scans source files (.php, .phtml, .html, .xml, .js) and extracts all translatable strings into a CSV dictionary. The --output flag specifies a file path (optional — without it, results go to stdout). The --magento flag scans the entire Magento codebase using the contextual parser and cannot be combined with a directory argument. Without --magento, a directory argument is required.",
    hint: "This command harvests translatable strings from code — it supports two scanning modes.",
    topic: "Translation CLI",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 5 — Localization & Translation System"
  },
  {
    question: "How does the translation database table work, and what role does store_id play?",
    answer: "The translation table (not 'translate') stores the highest-priority translation overrides. Key columns are string (varchar(255), the lookup key), translate (varchar(255), the override value), locale, and store_id. store_id=0 applies globally to all stores; a specific store_id overrides store_id=0 for that store. It is populated via the Inline Translation tool. After changes, you must run cache:clean translate.",
    hint: "A store_id of zero is the catch-all, but a specific store ID takes precedence for that particular store.",
    topic: "Translation Database",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 5 — Localization & Translation System"
  },
  {
    question: "What is a language pack in Magento 2, and what files must it contain?",
    answer: "A language pack is a Composer package with type 'magento2-language' that declares a language and optional inheritance. It must contain: registration.php (with ComponentRegistrar::LANGUAGE), language.xml (with required elements <code>, <vendor>, <package>), and composer.json. The optional <use> tag in language.xml enables inheritance from another pack. Core packs contain metadata only — CSVs live in each module's i18n/ directory.",
    hint: "It is a special component type that declares a language — not a module with type magento2-module.",
    topic: "Language Packs",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 5 — Localization & Translation System"
  },
  {
    question: "How do JavaScript translations work in Magento 2?",
    answer: "JS translations use $.mage.__('string') from the mage/translate RequireJS module — never PHP's __() directly in JS files. Translations are stored in a generated file js-translation.json at pub/static/frontend/Vendor/Theme/{locale}/. This file is created during setup:static-content:deploy, includes all four translation layers (including DB overrides), and must be regenerated when translations change.",
    hint: "A build artifact (JSON file) bridges the server-side translation system with client-side JavaScript.",
    topic: "JS Translations",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 5 — Localization & Translation System"
  },
  {
    question: "What is Inline Translation, and why should it never be used in production?",
    answer: "Inline Translation is a tool enabled at Stores > Config > Advanced > Developer > Translate Inline that wraps translatable strings in special HTML markup on the storefront. Translators can click strings and enter overrides directly, which are saved to the translation database table. It should never be used in production because it breaks Full Page Cache (FPC), is incompatible with Varnish/ESI, and injects significant JavaScript overhead.",
    hint: "It allows visual on-page translation editing but destroys caching performance.",
    topic: "Inline Translation",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 5 — Localization & Translation System"
  },
  {
    question: "What does the <use> tag in language.xml enable?",
    answer: "The <use> tag enables language pack inheritance — a child language pack only needs to define strings that differ from the parent pack. It requires vendor and package attributes referencing the parent pack (e.g., <use vendor='magento' package='en_us'/>). This allows creating regional variants (like fr_CA inheriting from fr_FR) without duplicating every translation string.",
    hint: "It creates a parent-child relationship between language packs, similar to theme fallback.",
    topic: "Language Inheritance",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 5 — Localization & Translation System"
  },
  {
    question: "How are translatable strings referenced in PHP code versus XML configuration?",
    answer: "In PHP and PHTML templates, the __() function is used: __('Add to Cart') or __('Hello, %1!', $name) with placeholders. In XML configuration files (layout XML, system.xml), the translate='true' attribute is used on elements like <label translate='true'>Add to Cart</label>. The original English phrase in both cases serves as the lookup key for the translation system.",
    hint: "PHP uses a function call with double underscores; XML uses an attribute on the element.",
    topic: "Translation Syntax",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 5 — Localization & Translation System"
  },
  {
    question: "What happens to js-translation.json when you change a CSV translation or DB override?",
    answer: "js-translation.json is a build artifact that is NOT dynamically updated. Changes to CSV files or database overrides are NOT reflected in JavaScript until setup:static-content:deploy is re-run, which regenerates the file. The PreProcessor that builds this file calls loadData() which loads all four translation layers (module, pack, theme, DB), but only phrases appearing in JS/HTML files are included in the dictionary.",
    hint: "It is a static file generated at build time, not a dynamic resource that updates automatically.",
    topic: "JS Translation Build",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 5 — Localization & Translation System"
  },
  {
    question: "What does i18n:pack do, and what are its required arguments?",
    answer: "i18n:pack takes a translated CSV file and distributes it into the correct module structure for deployment. It has two required positional arguments: the source CSV file path and the target locale code (e.g., fr_FR). The --mode option controls merge behavior (merge or replace, default is replace). It does NOT create a Composer language pack automatically — you still need registration.php and composer.json.",
    hint: "It splits a master translation file into per-module files, but does not create a complete package.",
    topic: "Translation CLI",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 5 — Localization & Translation System"
  },
  {
    question: "How does Magento 2 internally load translations in the Translate.php loadData() method?",
    answer: "The loadData() method loads translations in this order: _loadModuleTranslation() first (lowest priority), then _loadPackTranslation(), then _loadThemeTranslation(), and finally _loadDbTranslation() last (highest priority). Each layer overwrites matching keys from previous layers via simple array assignment. This is why the DB always wins — it is loaded last and overwrites everything before it.",
    hint: "The loading order is the reverse of the priority — later loads overwrite earlier ones.",
    topic: "Translation Internals",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 5 — Localization & Translation System"
  },
  {
    question: "What happens when a CSV translation entry has the same value for both original and translated columns (key equals value)?",
    answer: "When a CSV entry has key equal to value (e.g., \"Add to Cart\",\"Add to Cart\"), it triggers a special reset behavior that removes any prior translation for that key. This effectively resets the string to its original form, undoing any translations from lower-priority layers. This mechanism can be used intentionally to 'untranslate' specific strings in a higher-priority layer.",
    hint: "An identity mapping acts as an eraser for translations from lower layers.",
    topic: "Translation Reset",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 5 — Localization & Translation System"
  },
  {
    question: "What cache type must be cleaned after modifying translation files or database entries?",
    answer: "The translate cache type must be cleaned using bin/magento cache:clean translate. This cache stores the merged translation dictionary built from all four layers (module, pack, theme, DB). Without cleaning it, changes to CSV files or database overrides will not take effect on the storefront. For full page cache pages, you may also need to clean full_page and block_html cache types.",
    hint: "A specific cache type dedicated to translations must be flushed for changes to appear.",
    topic: "Translation Cache",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 5 — Localization & Translation System"
  },
  {
    question: "What are the three types of plugins (interceptors) in Magento 2, and what can each modify?",
    answer: "The three types are: before (method prefix: before{MethodName}) — can modify input arguments by returning an array or return null for no change; after (prefix: after{MethodName}) — can modify the return value and must always return a value; around (prefix: around{MethodName}) — has full control over both arguments and return value via the $proceed callable. Around plugins must call $proceed() to continue the chain.",
    hint: "Before touches inputs, after touches outputs, and around wraps everything.",
    topic: "Plugin Types",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 7 — Plugins & Observers (Components)"
  },
  {
    question: "What method types and class types CANNOT be intercepted by plugins in Magento 2?",
    answer: "The following cannot be plugged: __construct and __destruct (excluded by isInterceptedMethod()), final methods and final classes, static methods (no instance context), protected and private methods (only public methods are eligible), __sleep, __wakeup, __clone, and _resetState (explicitly excluded), classes implementing NoninterceptableInterface, and classes not managed by ObjectManager.",
    hint: "Only public, non-final, non-static, non-constructor methods on ObjectManager-managed classes can be intercepted.",
    topic: "Plugin Restrictions",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 7 — Plugins & Observers (Components)"
  },
  {
    question: "How does plugin sort order affect execution, and what happens when two plugins have the same sortOrder?",
    answer: "Plugins execute in ascending sortOrder for all three types (before, after, and around). Lower sortOrder executes first. Around plugins nest: the outer (lower sortOrder) wraps the inner (higher sortOrder). When two plugins share the same sortOrder, the result is undefined — the framework uses uasort with no secondary sort key. The default sortOrder when omitted is 0. Always use distinct values when order matters.",
    hint: "Lower numbers go first, and ties are unpredictable — avoid them.",
    topic: "Plugin Sort Order",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 7 — Plugins & Observers (Components)"
  },
  {
    question: "What happens if an around plugin does not call $proceed()?",
    answer: "Not calling $proceed() silently breaks the entire plugin chain — no exception is thrown, no error is logged. All downstream plugins and the original method are skipped entirely. This is intentional by design (allowing legitimate short-circuits for caching or access control), but accidental omission is a common source of bugs. Arguments must also be forwarded with $proceed(...$args) to pass them through unmodified.",
    hint: "The chain breaks silently — there is no warning that downstream logic was skipped.",
    topic: "Around Plugin Pitfalls",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 7 — Plugins & Observers (Components)"
  },
  {
    question: "How do you declare a plugin in di.xml, and what attributes are required?",
    answer: "Plugins are declared inside a <type> node using the <plugin> element. The only required attribute is 'name' (unique identifier within the type scope). Optional attributes are: 'type' (plugin class FQCN — optional, not needed when disabling), 'sortOrder' (integer, default 0), and 'disabled' (true/false, default false). You can disable a previously declared plugin using disabled='true' with the matching name without specifying the type.",
    hint: "Only the name is truly required — even the class is optional when you just want to disable an existing plugin.",
    topic: "Plugin Declaration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 7 — Plugins & Observers (Components)"
  },
  {
    question: "What is the difference between plugins and observers as extension mechanisms?",
    answer: "Plugins intercept specific method calls and can modify input arguments (before), return values (after), or both (around) — they operate synchronously on the method execution flow. Observers listen to named events dispatched via the event manager and are fire-and-forget — they cannot modify the dispatching code's return values or control flow. Use plugins to change what a method receives or returns; use observers to react to actions in a decoupled manner.",
    hint: "Plugins modify data flow; observers react to events without altering the flow.",
    topic: "Plugins vs Observers",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 7 — Plugins & Observers (Components)"
  },
  {
    question: "What interface must an observer class implement, and what is the method signature?",
    answer: "Observer classes must implement \\Magento\\Framework\\Event\\ObserverInterface. The only required method is execute(Observer $observer): void. Data from the dispatch is accessed via $observer->getEvent()->getData('key') or the magic getter $observer->getEvent()->getProduct(). The shortcut $observer->getData('key') also works because the data array is merged into both the Event and Observer objects.",
    hint: "One interface, one method, void return — observers cannot send data back to the dispatcher.",
    topic: "Observer Implementation",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 7 — Plugins & Observers (Components)"
  },
  {
    question: "How are observers registered in events.xml, and how does area scope affect them?",
    answer: "Observers are declared in events.xml with an <event name='...'><observer name='...' instance='...' .../></event> structure. An observer in etc/events.xml (global) fires in ALL areas including admin, frontend, REST API, and cron. An observer in etc/frontend/events.xml fires only on storefront requests. Area-specific registration limits the observer's scope. The 'shared' attribute (default true) controls whether the observer is a singleton or new instance per dispatch.",
    hint: "Global events.xml is like broadcasting everywhere; area-specific files narrow the audience.",
    topic: "Observer Declaration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 7 — Plugins & Observers (Components)"
  },
  {
    question: "Why should you prefer declaring plugins on interfaces rather than concrete classes?",
    answer: "Plugins on interfaces apply to the class resolved via DI preference for that interface, making them more resilient to implementation changes. The interface is the contract; concrete implementations may be swapped via preference without breaking plugins. However, plugins on interfaces and concrete classes are additive — if both are declared, both fire. Interface plugins do not apply to all PHP implementations, only the one resolved through DI.",
    hint: "The interface is stable; the concrete class behind it may change, but your plugin still works.",
    topic: "Plugin Best Practices",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 7 — Plugins & Observers (Components)"
  },
  {
    question: "What does a before plugin return, and how does it affect the original method's arguments?",
    answer: "A before plugin returns either null (no change to arguments) or an array that replaces the positional arguments of the original method. The array maps 1-to-1 with method parameters. The first parameter of a before plugin is always $subject (the intercepted object instance), followed by the original method arguments. Returning null is the most common pattern when you only need to perform side effects before the method executes.",
    hint: "Null means 'pass through unchanged'; an array means 'replace all arguments with these values'.",
    topic: "Before Plugins",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 7 — Plugins & Observers (Components)"
  },
  {
    question: "How does event dispatching work in Magento 2, and what data is available to observers?",
    answer: "Events are dispatched via $this->eventManager->dispatch('event_name', ['key' => $value]). The second parameter array becomes accessible on both the Event object and the Observer wrapper — dispatch() merges data into both. Data can be accessed via $observer->getEvent()->getData('key'), magic getters like $observer->getEvent()->getProduct(), or directly via $observer->getData('key'). The dispatch is fire-and-forget with a void return.",
    hint: "The data array is available through three equivalent access methods on the observer.",
    topic: "Event Dispatch",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 7 — Plugins & Observers (Components)"
  },
  {
    question: "How do you disable a core plugin declared by another module?",
    answer: "To disable a core plugin, declare a <plugin> element in your module's di.xml with the exact same 'name' attribute as the original plugin and set disabled='true'. You do not need to specify the 'type' attribute when disabling. Your module should have the original module in its <sequence> in module.xml to ensure your di.xml is merged after the original. Example: <plugin name='core_plugin_name' disabled='true'/>.",
    hint: "Match the plugin name exactly and set the disabled flag — no need to repeat the class reference.",
    topic: "Plugin Override",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 7 — Plugins & Observers (Components)"
  },
  {
    question: "What is the execution order when both before, after, and around plugins are declared on the same method?",
    answer: "For a single plugin class with all three types: the around plugin's code before $proceed() runs, then before plugins run, then the original method, then after plugins run, then the around plugin's code after $proceed(). With multiple plugins sorted by sortOrder, around plugins nest (outer wraps inner), before plugins run in ascending order, and after plugins also run in ascending sortOrder order.",
    hint: "Around wraps everything like layers of an onion; before and after run inside the innermost around.",
    topic: "Plugin Execution Chain",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 7 — Plugins & Observers (Components)"
  },
  {
    question: "What is the 'shared' attribute on an observer declaration in events.xml, and when would you set it to false?",
    answer: "The shared attribute (default true) controls whether the observer is instantiated as a singleton via ObjectManager::get() (shared=true) or as a new instance via ObjectManager::create() for each dispatch (shared=false). Set shared=false when the observer maintains state that should not persist between event dispatches, or when the observer processes data that must be isolated per event invocation.",
    hint: "It controls the same singleton vs new-instance behavior as the shared attribute on DI types.",
    topic: "Observer Shared Attribute",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 7 — Plugins & Observers (Components)"
  },
  {
    question: "Are DataObject methods like getData(), setData(), and hasData() pluggable in Magento 2?",
    answer: "Yes, getData(), setData(), and hasData() are real public methods on DataObject (not magic methods) and ARE pluggable. Generated interceptors include wrappers for them, and multiple core modules have plugins that intercept getData(). The commonly repeated claim that DataObject methods are not pluggable is a myth. The magic method __call() is also interceptable. Only __construct, __destruct, __sleep, __wakeup, __clone, and _resetState are excluded.",
    hint: "Despite common misconception, these are regular public methods fully eligible for plugin interception.",
    topic: "Plugin Misconceptions",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 7 — Plugins & Observers (Components)"
  },
  {
    question: "What is the difference between `cache:flush` and `cache:clean` in Magento 2?",
    answer: "`cache:flush` calls the backend's `clean()` with CLEANING_MODE_ALL, which empties the entire storage backend including third-party data sharing the same Redis instance. `cache:clean` removes only Magento-managed entries that are invalid, expired, or tag-matched. Always prefer `cache:clean [type]` for targeted invalidation in production.",
    hint: "One is like formatting the hard drive, the other is like emptying the recycling bin.",
    topic: "Caching",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 8 — Caching System"
  },
  {
    question: "What does `getCacheLifetime()` return by default on a block, and what does each possible return value mean?",
    answer: "By default, `getCacheLifetime()` returns `null`, which means block caching is DISABLED entirely. Returning `0` means the block is cached indefinitely with no expiration. Returning a positive integer (e.g., 3600) caches the block for that many seconds. This is a protected method, not public.",
    hint: "The default return value is often mistaken for 'cached forever' but it's actually the opposite.",
    topic: "Block Cache",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 8 — Caching System"
  },
  {
    question: "What happens when any single block in a layout has the attribute `cacheable=\"false\"`?",
    answer: "Adding `cacheable=\"false\"` to any single block in a page's layout makes the ENTIRE page uncacheable by Full Page Cache. Magento's `Layout::isCacheable()` uses XPath to find any block with this attribute, and if found, sets Cache-Control to no-cache/no-store. This is a common performance bug caused by third-party modules.",
    hint: "One bad apple spoils the entire barrel — the scope of impact is broader than just that block.",
    topic: "Full Page Cache",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 8 — Caching System"
  },
  {
    question: "Which cache backend is recommended for Magento 2 production, and why is it preferred over Memcached?",
    answer: "Redis is the recommended production backend. It provides native tag-based invalidation via sets, configurable persistence (RDB/AOF), supports separate databases for default cache and page_cache, and offers multi-server support via Redis Cluster/Sentinel. Memcached lacks native tag support (Magento must emulate it), has no persistence, and is considered legacy.",
    hint: "This in-memory data store supports native tag operations and database separation.",
    topic: "Cache Backends",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 8 — Caching System"
  },
  {
    question: "What is the role of `getIdentities()` in Magento 2 block caching, and where is it used?",
    answer: "`getIdentities()` returns an array of cache tags used for tag-based invalidation. It is used by both the block cache (block_html) and Full Page Cache for purging. When a product is saved, Magento purges all cache entries sharing that product's tag (e.g., `cat_p_42`). Blocks implementing `IdentityInterface` must define this method.",
    hint: "This method provides the tag strings that connect content changes to cache purging — used at both block and HTTP cache levels.",
    topic: "Cache Tags",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 8 — Caching System"
  },
  {
    question: "How does Magento 2 communicate cache tags to Varnish for FPC, and how does purging work?",
    answer: "Magento sends cache tags via the `X-Magento-Tags` HTTP response header (e.g., `cat_p_42,cat_c_5,cms_b_3,FPC`). Varnish reads these tags and associates them with the cached response. When content changes in Admin, Magento sends a PURGE/BAN request to Varnish with an `X-Magento-Tags-Pattern` header containing the affected tags.",
    hint: "Tags travel from Magento to Varnish via a specific HTTP header, and purge requests flow back the other direction.",
    topic: "Cache Tags",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 8 — Caching System"
  },
  {
    question: "What is the difference between `getCacheKey()` and `getCacheKeyInfo()` on a Magento 2 block?",
    answer: "`getCacheKeyInfo()` returns an array of values that Magento hashes with SHA256 to produce the final cache key — this is the recommended method to override. `getCacheKey()` returns the final cache key string directly, giving full control. If two block instances return identical `getCacheKeyInfo()` arrays, they share a cache entry and may serve wrong content.",
    hint: "One returns raw ingredients that get hashed; the other returns the finished product directly.",
    topic: "Block Cache",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 8 — Caching System"
  },
  {
    question: "How do you create a custom cache type in Magento 2?",
    answer: "Declare the cache type in `etc/cache.xml` with a `name`, `instance`, `label`, and `description`. Create a PHP class that extends `TagScope` (not `CacheInterface`), with a `TYPE_IDENTIFIER` constant matching the `name` in cache.xml and a `CACHE_TAG` constant as the tag namespace. The constructor calls `parent::__construct()` with the FrontendPool and cache tag.",
    hint: "The declaration file is specific to caching, and the class extends a frontend decorator, not the main cache interface.",
    topic: "Custom Cache Type",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 8 — Caching System"
  },
  {
    question: "What does `CacheInterface::load()` return on a cache miss, and what data type does `save()` accept?",
    answer: "`load()` returns `false` (not `null`) on a cache miss. `save()` accepts a string as data — arrays and objects must be serialized first using `SerializerInterface`. The full signature is `save($data, $identifier, $tags = [], $lifeTime = null)` where tags enable bulk invalidation.",
    hint: "The miss value is a boolean, not a null. The storage format is always the simplest string type.",
    topic: "Programmatic Cache",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 8 — Caching System"
  },
  {
    question: "What is the difference between the `config` and `compiled_config` cache types?",
    answer: "The `config` cache stores merged XML configuration from `config.xml`, `system.xml`, and other XML config files. The `compiled_config` cache stores the output of `setup:di:compile` including DI preferences, interceptors, and generated code. They cache fundamentally different things and should be cleared at different times.",
    hint: "One caches XML merging results, the other caches dependency injection compilation output.",
    topic: "Cache Types",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 8 — Caching System"
  },
  {
    question: "What does ESI (Edge Side Includes) do in Magento's FPC implementation, and which backend supports it?",
    answer: "ESI allows Varnish to cache the main page while fetching dynamic fragments separately per request. Only Varnish supports ESI — the built-in PHP FPC does not. ESI blocks are identified by having a `ttl` value set (checked via `$block->getTtl() > 0`), and Magento's `ProcessLayoutRenderElement` observer wraps them in ESI include tags.",
    hint: "This technique splits a page into separately-cacheable fragments, but only works with the external HTTP cache.",
    topic: "Full Page Cache",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 8 — Caching System"
  },
  {
    question: "Why is it important to use separate Redis databases for `default` cache and `page_cache` in Magento 2?",
    answer: "Separate Redis databases (e.g., database 0 for default cache and database 1 for page_cache) isolate cache types from each other. This prevents a `cache:flush` on one type from accidentally clearing the other. Redis configuration also differs: `compress_data = 1` is typically used for application cache while `compress_data = 0` is used for FPC.",
    hint: "Isolation prevents one flush operation from impacting the other type, and compression settings differ between them.",
    topic: "Cache Backends",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 8 — Caching System"
  },
  {
    question: "How does Magento handle private/dynamic content (like cart count and customer name) in a Full Page Cache environment?",
    answer: "Private content is never stored in FPC. Magento uses customer sections loaded via JavaScript after the page loads, making an AJAX call to `/customer/section/load`. Private content blocks implement `SectionSourceInterface` and return data that is fetched client-side, ensuring the cached page remains generic while dynamic data is personalized per user.",
    hint: "The solution involves loading personalized data asynchronously after the cached page is served.",
    topic: "Full Page Cache",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 8 — Caching System"
  },
  {
    question: "What happens if you disable a cache type with `cache:disable` and then re-enable it?",
    answer: "Disabling a cache type stops Magento from reading/writing that cache type, but existing entries remain in storage. When you re-enable it, Magento reads those old stale entries. You should always flush or clean the cache type after re-enabling to avoid serving stale data.",
    hint: "Disabling doesn't clear — it only stops access. The stale data is still sitting there waiting.",
    topic: "Cache Invalidation",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 8 — Caching System"
  },
  {
    question: "What does the `db_ddl` cache type store in Magento 2?",
    answer: "The `db_ddl` cache stores database schema (DDL) structure — table definitions, column types, and indexes. It does NOT cache actual data. This cache should always be flushed after schema changes such as adding columns or running `setup:upgrade`. It is one of the 14 built-in cache types.",
    hint: "Think of it as caching the 'blueprint' of the database, not the contents.",
    topic: "Cache Types",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 8 — Caching System"
  },
  {
    question: "What is the three-tier scope hierarchy in Magento 2, and what entity lives at each level?",
    answer: "The hierarchy is Website > Store (Store Group) > Store View. Websites control customer accounts, payment/shipping methods, and product assignment. Stores (Store Groups) control the root category assignment for navigation. Store Views control display language, locale, currency display, and translated content.",
    hint: "The three tiers go from broadest business separation down to language/locale presentation.",
    topic: "Store Hierarchy",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 9 — Stores, Websites & Store Views"
  },
  {
    question: "At which scope level are customer accounts managed by default in Magento 2?",
    answer: "Customer accounts are scoped to the Website by default. The same email can exist as separate accounts on different websites. This is controlled by the 'Share Customer Accounts' setting (config path: `customer/account_share/scope`, default value `1` = SHARE_WEBSITE). It can be changed to Global (`0`) for cross-website sharing.",
    hint: "The default behavior isolates customer identities per brand/region entity, not per language view.",
    topic: "Customer Scope",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 9 — Stores, Websites & Store Views"
  },
  {
    question: "Products in Magento 2 are assigned to which scope level, and how does this affect visibility?",
    answer: "Products are assigned to Websites, not to store views or store groups. You cannot assign a product to a specific store view. When assigned to a website, the product becomes visible in all store views under that website. However, actual navigation visibility is further filtered by the store group's root category tree.",
    hint: "The assignment happens at the brand/region level — you cannot selectively show a product in one language view but not another under the same parent.",
    topic: "Product Catalog Scope",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 9 — Stores, Websites & Store Views"
  },
  {
    question: "What are the three configuration scope levels in Magento 2, and how do they differ from the store hierarchy?",
    answer: "Configuration scope has three levels: Default (Global) > Website > Store View. Importantly, Store Group is NOT a configuration scope — it only serves as a structural entity for grouping store views and assigning root categories. The `core_config_data` table only stores values for scopes 'default', 'website', and 'store' (which means store view).",
    hint: "There's a missing middle tier — the structural grouping entity does not participate in config inheritance.",
    topic: "Configuration Scope",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 9 — Stores, Websites & Store Views"
  },
  {
    question: "What is the difference between checking the 'Use Default' checkbox and saving a blank value at Website scope?",
    answer: "Checking 'Use Default' enables inheritance — the value cascades down from the Default scope. Unchecking the checkbox and saving a blank value is an explicit blank override — it does NOT fall back to the parent scope. This is a frequent source of configuration bugs in Magento.",
    hint: "One says 'inherit from above,' while the other says 'I want nothing' and blocks inheritance.",
    topic: "Configuration Scope",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 9 — Stores, Websites & Store Views"
  },
  {
    question: "What does the root category assignment on a Store (Store Group) control?",
    answer: "The root category assigned to a Store Group determines the entire navigation tree visible on the frontend for that store. Two stores under the same website share customer accounts but can have completely different product navigation trees. A store must have at least one store view to be functional.",
    hint: "This assignment controls which products appear in the menu, even if the products are assigned to the same website.",
    topic: "Store Hierarchy",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 9 — Stores, Websites & Store Views"
  },
  {
    question: "What is the default scope of the `price` attribute in Magento 2, and what happens when you change it?",
    answer: "The `price` attribute is Global scope by default (set by the `ChangePriceAttributeDefaultScope` data patch). This means one price across all websites and store views. Changing it to Website scope allows different prices per website but requires a catalog price index reindex. The `name` and `description` attributes are Store View scope by default.",
    hint: "A core data patch overrides the initial scope, and switching it after data exists has indexing consequences.",
    topic: "Attribute Scope",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 9 — Stores, Websites & Store Views"
  },
  {
    question: "How do `MAGE_RUN_CODE` and `MAGE_RUN_TYPE` environment variables work for multi-store routing?",
    answer: "These environment variables are set in Apache (`.htaccess`/VirtualHost) or Nginx server blocks to force a specific store or website based on the incoming domain. `MAGE_RUN_CODE` specifies the store/website code, and `MAGE_RUN_TYPE` accepts values `website`, `store` (store view), or `group` (store group) to determine which entity type the code refers to.",
    hint: "These server-level variables map incoming domains to specific commerce entities before PHP processing begins.",
    topic: "Multi-Store Routing",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 9 — Stores, Websites & Store Views"
  },
  {
    question: "What is `store_id = 0` in Magento 2, and why is it significant?",
    answer: "`store_id = 0` represents the Admin store — it is never a customer-facing store view. In EAV value tables, `store_id = 0` represents the global/default value that serves as the fallback when no store-view-specific override exists. The first default store view is conventionally `store_id = 1`, but this is not guaranteed.",
    hint: "This special ID serves dual duty as both the admin interface identifier and the EAV fallback row.",
    topic: "Store Hierarchy",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 9 — Stores, Websites & Store Views"
  },
  {
    question: "What is the naming confusion between ScopeInterface constants and CLI scope flags in Magento 2?",
    answer: "PHP `ScopeInterface` uses singular constants: `SCOPE_STORE` (means store view), `SCOPE_WEBSITE`, `SCOPE_GROUP`. CLI scope flags use plural forms: `--scope=stores`, `--scope=websites`. Additionally, `SCOPE_STORE` refers to store VIEW, not store group — this is a constant source of confusion in both code and exams.",
    hint: "Singular in PHP, plural on the command line — and the word 'store' doesn't mean what you'd expect.",
    topic: "Configuration Scope",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 9 — Stores, Websites & Store Views"
  },
  {
    question: "In the `system.xml` field definition, what do `showInDefault`, `showInWebsite`, and `showInStore` control?",
    answer: "These attributes control at which scope level a configuration field is visible and editable in the Admin. `showInDefault=\"1\"` makes it editable at Default (Global) scope, `showInWebsite=\"1\"` at Website scope, and `showInStore=\"1\"` at Store View scope. Note that `showInStore` refers to store VIEW, not store group — this naming is confusingly inconsistent.",
    hint: "These XML attributes act as visibility toggles per scope tier in the Admin configuration screens.",
    topic: "Configuration Scope",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 9 — Stores, Websites & Store Views"
  },
  {
    question: "Why might a product not appear in a specific store view, and what are the diagnostic steps?",
    answer: "Check: (1) the product is enabled, (2) it is assigned to the correct Website (not store view — there's no such assignment), (3) it belongs to a category within the store's root category tree, (4) its visibility is not 'Not Visible Individually,' and (5) stock status allows display. The most common trap is trying to fix visibility by assigning to a store view, which doesn't exist.",
    hint: "Start at the website assignment and work through the category tree and visibility settings — there's no store-view-level product assignment.",
    topic: "Product Catalog Scope",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 9 — Stores, Websites & Store Views"
  },
  {
    question: "How does the EAV attribute scope constant `SCOPE_STORE = 0` differ from `SCOPE_GLOBAL = 1`?",
    answer: "In `ScopedAttributeInterface`, `SCOPE_STORE = 0` means the attribute value can be set per store view (most granular), while `SCOPE_GLOBAL = 1` means one value for all websites and store views. `SCOPE_WEBSITE = 2` allows per-website values. The integer values are counter-intuitive — 0 for most granular, 1 for least — which is a common exam trap.",
    hint: "The numeric values are reversed from what you'd expect: the smaller number gives more granular control.",
    topic: "Attribute Scope",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 9 — Stores, Websites & Store Views"
  },
  {
    question: "What is the 'Add Store Code to URLs' setting, and what effect does it have?",
    answer: "When enabled at Stores > Configuration > General > Web > Url Options, Magento appends the store view code to the URL path (e.g., `/fr/`, `/de/`). This is one approach to multi-language URLs. The alternative is configuring separate base URLs (subdomains or domains) per store view. Store code in URL requires minimal server configuration compared to separate domains.",
    hint: "This setting embeds the language identifier directly in the URL path rather than using separate domains.",
    topic: "Multi-Store URLs",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 9 — Stores, Websites & Store Views"
  },
  {
    question: "Where is the base currency configured in Magento 2, and at which scope level?",
    answer: "Base currency is configured at the Website scope level. It is available in Stores > Configuration > General > Currency Setup. The field has `showInDefault=\"1\"` and `showInWebsite=\"1\"` but no `showInStore`, meaning it cannot be overridden per store view. Display currency (allowed currencies) can differ per store view, but the base currency is always per website.",
    hint: "The foundational money denomination is set at the middle tier of the hierarchy, not the most granular one.",
    topic: "Store Hierarchy",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 9 — Stores, Websites & Store Views"
  },
  {
    question: "What is the `redirect_type` column in the `url_rewrite` table, and what do its values mean?",
    answer: "`redirect_type = 0` means an internal forward — the URL in the browser does NOT change, and Magento internally routes to the `target_path`. `redirect_type = 301` is a permanent redirect (browser updates URL, search engines update index). `redirect_type = 302` is a temporary redirect (browser updates URL, search engines keep old URL).",
    hint: "Zero is not a redirect at all — it's transparent routing. The other two are standard HTTP redirect codes.",
    topic: "URL Rewrites",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 10 — URL Rewrites & Admin Panel Architecture"
  },
  {
    question: "What happens to product URLs when a parent category's URL key is changed with category paths enabled?",
    answer: "All product rewrites that included the old category path are regenerated with the new path. Old product URLs get automatic 301 redirects to the new URLs. This cascading effect applies to all descendant categories and their products. For example, changing 'shirts' to 't-shirts' updates all products under `/mens/shirts/` to `/mens/t-shirts/`.",
    hint: "A change at the category level cascades downward through the entire tree to every product in those categories.",
    topic: "URL Rewrites",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 10 — URL Rewrites & Admin Panel Architecture"
  },
  {
    question: "What are the four `entity_type` values in the `url_rewrite` table?",
    answer: "The four entity types are `product`, `category`, `cms-page`, and `custom`. Note that `cms-page` uses a hyphen, not an underscore. Custom/manual rewrites use `entity_type = 'custom'` with `entity_id = 0` and `is_autogenerated = 0`. These are defined as constants in `Magento\\UrlRewrite\\Controller\\Adminhtml\\Url\\Rewrite`.",
    hint: "Three correspond to built-in content types (one hyphenated), and the fourth covers anything manually created.",
    topic: "URL Rewrites",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 10 — URL Rewrites & Admin Panel Architecture"
  },
  {
    question: "What is the `router id` value in `routes.xml` for admin routes versus frontend routes?",
    answer: "For admin routes, the `router id` is `\"admin\"`. For frontend routes, it is `\"standard\"`. Admin routes are declared in `<Module>/etc/adminhtml/routes.xml` and admin controllers must reside in the `Controller/Adminhtml/` directory, extending `\\Magento\\Backend\\App\\Action`.",
    hint: "The admin area uses a different router identifier than the storefront — it's not 'standard'.",
    topic: "Admin Routing",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 10 — URL Rewrites & Admin Panel Architecture"
  },
  {
    question: "How do `acl.xml`, `menu.xml`, and the controller's `ADMIN_RESOURCE` constant work together?",
    answer: "All three must use the same resource ID string (e.g., `Vendor_MyModule::items`). `acl.xml` defines the resource in the permission tree. `menu.xml` references that resource to control menu item visibility. The controller's `ADMIN_RESOURCE` constant is checked by `_isAllowed()` during dispatch. If any of these is missing or mismatched, access fails.",
    hint: "It's a three-way handshake — the same string must appear in three different XML/PHP files for the permission system to work.",
    topic: "Admin ACL",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 10 — URL Rewrites & Admin Panel Architecture"
  },
  {
    question: "What controls whether Magento generates category paths in product URLs, and how many `url_rewrite` rows does a product get?",
    answer: "The config setting `catalog/seo/product_use_categories` (default: `0` = disabled) controls this. When disabled, a product gets 1 row per store view. When enabled, it gets multiple rows: one without category path, plus one for each category the product belongs to. A product in two categories would get at minimum 3 rows.",
    hint: "A single config toggle can multiply the number of database rows per product significantly.",
    topic: "URL Rewrites",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 10 — URL Rewrites & Admin Panel Architecture"
  },
  {
    question: "What are the four required attributes for a `menu.xml` item in Magento 2 Admin?",
    answer: "The four required attributes are `id` (unique identifier, convention: `Vendor_Module::identifier`), `title` (display text), `module` (owning module for translation context), and `resource` (ACL resource ID required to see the item). Optional attributes include `sortOrder`, `parent`, `action`, `dependsOnModule`, and `dependsOnConfig`.",
    hint: "You need an identifier, a label, a module owner, and a permission reference — everything else is optional.",
    topic: "Admin Menu",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 10 — URL Rewrites & Admin Panel Architecture"
  },
  {
    question: "How does the `action` attribute format work in `menu.xml`, and what happens if it's omitted?",
    answer: "The `action` attribute uses the format `frontName/controller/action` without the `/admin/` prefix (e.g., `mymodule/items/index`). If `action` is omitted, the menu item becomes a parent/group container item that cannot be clicked directly — it only expands to show child items.",
    hint: "No prefix needed for the admin base path, and leaving it out turns the item into just a folder.",
    topic: "Admin Menu",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 10 — URL Rewrites & Admin Panel Architecture"
  },
  {
    question: "What happens when a product's URL key is changed in the Magento Admin?",
    answer: "Magento creates a new `url_rewrite` row with the new URL key as `request_path` pointing to the internal target path (`redirect_type = 0`). The old URL key is preserved as a 301 redirect pointing to the new URL. This behavior is controlled by `catalog/seo/save_rewrites_history` (default: `1` = enabled). Redirect chains can accumulate over time.",
    hint: "The old URL doesn't disappear — it gets a permanent redirect entry so existing links and search engine indexes continue to work.",
    topic: "URL Rewrites",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 10 — URL Rewrites & Admin Panel Architecture"
  },
  {
    question: "What happens when a `menu.xml` entry references a resource ID that doesn't exist in `acl.xml`?",
    answer: "The menu item is hidden from ALL admin users, including administrators with full access. The resource cannot be resolved in the permission system, so no role can be granted access to it. This silently breaks the menu item without any error — a common debugging challenge.",
    hint: "If the permission definition doesn't exist, no one can be granted it, making the item invisible to everyone.",
    topic: "Admin ACL",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 10 — URL Rewrites & Admin Panel Architecture"
  },
  {
    question: "What is the unique constraint on the `url_rewrite` table, and why is it significant?",
    answer: "The unique constraint is on `(request_path, store_id)` — a request path can only exist once per store view. This means the same URL path can exist for different store views but not duplicated within one. Each rewrite is store-view specific, so a product in 3 store views generates at least 3 rows.",
    hint: "The combination of the incoming path and the language/locale identifier must be unique.",
    topic: "URL Rewrites",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 10 — URL Rewrites & Admin Panel Architecture"
  },
  {
    question: "What base class must admin controllers extend, and what constant controls access?",
    answer: "Admin controllers must extend `\\Magento\\Backend\\App\\Action` (not `\\Magento\\Framework\\App\\Action\\Action`). The `ADMIN_RESOURCE` constant defines which ACL resource is required. The default value from the parent class is `'Magento_Backend::admin'`. The `_isAllowed()` method is called automatically during `dispatch()` and checks this constant.",
    hint: "There's a specific backend action class (not the generic one), and a class constant controls the permission check.",
    topic: "Admin Routing",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 10 — URL Rewrites & Admin Panel Architecture"
  },
  {
    question: "What URL suffix settings exist for products and categories, and how do CMS pages differ?",
    answer: "Products use `catalog/seo/product_url_suffix` (default `.html`) and categories use `catalog/seo/category_url_suffix` (default `.html`). They are configured independently. CMS pages do not have a dedicated suffix setting — their suffix is part of their URL key itself. Changing a suffix triggers mass regeneration of all affected URL rewrites with 301 redirects.",
    hint: "Two entity types have configurable suffixes in the same config section, but the third type handles it differently.",
    topic: "URL Rewrites",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 10 — URL Rewrites & Admin Panel Architecture"
  },
  {
    question: "How are URL rewrites processed in relation to Magento's standard routing system?",
    answer: "URL rewrites are processed BEFORE standard routing. The `Magento\\UrlRewrite\\Model\\UrlFinderInterface` resolves rewrites using `findOneByData(array $data)` and `findAllByData(array $data)`. If a match is found, the request is either forwarded internally (redirect_type=0) or redirected via HTTP (301/302). If no match is found, the request passes to the standard router.",
    hint: "The rewrite system gets first look at every incoming request, before the normal controller routing kicks in.",
    topic: "URL Rewrites",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 10 — URL Rewrites & Admin Panel Architecture"
  },
  {
    question: "What is the admin URL structure in Magento 2, and how do controller directories map to URL segments?",
    answer: "Admin URLs follow the pattern `/admin/{frontName}/{controllerDir}/{actionClass}`. The `/admin` prefix is configurable. The `frontName` comes from `routes.xml`. Controller directories under `Controller/Adminhtml/` map to URL segments (lowercased). Each controller is a single class with one `execute()` method — URL segments map to directory and class names, not method names.",
    hint: "Each URL segment corresponds to a directory level under the admin controller namespace, with the final segment being the class name.",
    topic: "Admin Routing",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 10 — URL Rewrites & Admin Panel Architecture"
  },
  {
    question: "What is a service contract in Magento 2, and what are its two main component types?",
    answer: "A service contract is Magento's formal, versioned API layer that sits between consumers (controllers, REST, GraphQL) and storage/business logic. It consists of Repository Interfaces in the `Api/` folder (defining CRUD + getList methods) and Data Interfaces (DTOs) in the `Api/Data/` folder (containing only getters, setters, and field constants with zero business logic).",
    hint: "The layer has two parts: one defines operations, the other defines the data shape — both are interfaces in specific folders.",
    topic: "Service Contracts",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 12 — Service Contracts & Repository Pattern"
  },
  {
    question: "What must `getById()` do when an entity is not found in a Magento 2 repository?",
    answer: "`getById()` MUST throw `NoSuchEntityException` when the entity doesn't exist. It must NEVER return `null`. The return type is `DataInterface`, not `?DataInterface` (no nullable). This is one of the most-tested repository rules. Similarly, `save()` throws `CouldNotSaveException` and `delete()` throws `CouldNotDeleteException` on failure.",
    hint: "The contract demands an exception, not a null — callers must use try/catch, not null checks.",
    topic: "Repository Pattern",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 12 — Service Contracts & Repository Pattern"
  },
  {
    question: "How do filter groups create AND vs OR logic in SearchCriteriaInterface?",
    answer: "Filters within the same FilterGroup are combined with OR logic. Separate FilterGroups are combined with AND logic. In `SearchCriteriaBuilder`, `addFilters([filter1, filter2])` puts both in the same group (OR), while separate `addFilter()` calls create different groups (AND). Example: `addFilters([$redFilter, $blueFilter])` produces `color='red' OR color='blue'`.",
    hint: "Same array = OR between items; separate calls = AND between groups.",
    topic: "SearchCriteria",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 12 — Service Contracts & Repository Pattern"
  },
  {
    question: "What does `getList()` return in a repository, and how do you iterate over the results?",
    answer: "`getList()` returns `SearchResultsInterface`, NOT an array. You must call `->getItems()` to get the array of DataInterface objects. `getTotalCount()` returns the total matching records BEFORE pagination (not just the current page count). `setSearchCriteria()` echoes back the criteria used, which is important for REST consumers.",
    hint: "The return value is a container object, not a direct collection — you need to unwrap it with a specific method.",
    topic: "Repository Pattern",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 12 — Service Contracts & Repository Pattern"
  },
  {
    question: "What are extension attributes in Magento 2, and how are they declared and loaded?",
    answer: "Extension attributes allow third-party modules to attach additional data to existing entities without modifying the original module. They are declared in `etc/extension_attributes.xml` and auto-generated during `setup:di:compile`. They are NOT loaded automatically — you must manually load them via plugins on repository methods (`afterGetById`, `afterGetList`). `getExtensionAttributes()` can return null.",
    hint: "Declaration is in XML, code is generated, but loading requires explicit plugin work — nothing happens automatically.",
    topic: "Extension Attributes",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 12 — Service Contracts & Repository Pattern"
  },
  {
    question: "Why must `extensionAttributesJoinProcessor->process()` be called before `collectionProcessor->process()` in a repository's `getList()`?",
    answer: "The `extensionAttributesJoinProcessor` sets up the SQL JOINs needed for join-based extension attributes. If it's called after `collectionProcessor->process()` (or not at all), the join-based extension attributes will be silently empty/null on every item. The collection query executes without the necessary joins, and no error is thrown.",
    hint: "The join setup must happen before the query filters are applied — otherwise the extension attribute columns don't exist in the query.",
    topic: "Extension Attributes",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 12 — Service Contracts & Repository Pattern"
  },
  {
    question: "What does the `@api` annotation mean on a Magento 2 interface, and what does it NOT do?",
    answer: "`@api` marks the interface as part of the stable public API surface, signaling a backward-compatibility commitment — breaking changes require a major version bump. It does NOT make the class auto-routable via REST (that's `webapi.xml`), does NOT generate code at compile time, and is purely a convention/documentation signal, not a PHP language feature.",
    hint: "It's a promise of stability, not a functional trigger — routing and code generation happen through other mechanisms.",
    topic: "Service Contracts",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 12 — Service Contracts & Repository Pattern"
  },
  {
    question: "What condition type should you use to query multiselect attributes stored as comma-separated values?",
    answer: "Use `finset` (which maps to SQL `FIND_IN_SET`). Multiselect attributes store comma-separated option IDs as a varchar string (e.g., '42,55,67'), and `FIND_IN_SET` can locate a specific value within that comma-delimited string. Standard `eq` or `like` conditions would produce incorrect results for these values.",
    hint: "This SQL function is specifically designed for finding values within comma-delimited strings.",
    topic: "SearchCriteria",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 12 — Service Contracts & Repository Pattern"
  },
  {
    question: "What are the five standard methods on a RepositoryInterface in Magento 2?",
    answer: "The five standard methods are `save(DataInterface $entity)` for create/update, `getById(int $id)` for loading by ID, `getList(SearchCriteriaInterface $criteria)` for filtered searching, `delete(DataInterface $entity)` for deletion by object, and `deleteById(int $id)` for deletion by ID. Exceptions are `NoSuchEntityException`, `CouldNotSaveException`, and `CouldNotDeleteException`.",
    hint: "Two create/update, one search, and two delete methods — each with a specific exception contract.",
    topic: "Repository Pattern",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 12 — Service Contracts & Repository Pattern"
  },
  {
    question: "How is a repository's interface mapped to its concrete implementation in Magento 2?",
    answer: "Through `<preference>` declarations in `di.xml`. Each interface (both RepositoryInterface and DataInterface) needs a preference mapping to its concrete class. For example: `<preference for=\"Vendor\\Module\\Api\\WidgetRepositoryInterface\" type=\"Vendor\\Module\\Model\\WidgetRepository\"/>`. SearchResultsInterface typically maps to `Magento\\Framework\\Api\\SearchResults`.",
    hint: "XML configuration tells the dependency injection container which concrete class to instantiate when an interface is requested.",
    topic: "Service Contracts",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 12 — Service Contracts & Repository Pattern"
  },
  {
    question: "What is the role of a DataInterface (DTO) in the service contract pattern?",
    answer: "A DataInterface is a Data Transfer Object that carries data between layers. It contains ONLY getters, setters, and field name constants — no business logic, no DB calls, no calculations, no dependencies on resource models. It must also declare `getExtensionAttributes()` and `setExtensionAttributes()` methods to support extension attributes. Concrete implementations extend `AbstractModel`.",
    hint: "It's a pure data container with no behavior — think of it as a structured envelope for passing information between layers.",
    topic: "Service Contracts",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 12 — Service Contracts & Repository Pattern"
  },
  {
    question: "Why is `SearchCriteriaBuilder` described as 'stateful,' and how should you handle it?",
    answer: "`SearchCriteriaBuilder` accumulates filters, sort orders, and pagination internally. Calling `->create()` builds the `SearchCriteria` object and resets the internal state. You should always build the complete criteria in a single chain and immediately call `create()`. If you reuse the builder between separate queries without creating, filter state from previous usage can leak.",
    hint: "The builder remembers what you added until you explicitly finalize — forgetting to reset can contaminate subsequent queries.",
    topic: "SearchCriteria",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 12 — Service Contracts & Repository Pattern"
  },
  {
    question: "What is the difference between `addFilter()` and `addFilters()` on SearchCriteriaBuilder?",
    answer: "`addFilter($field, $value, $conditionType)` is a convenience method that creates a single filter in its own FilterGroup — multiple `addFilter()` calls produce AND logic. `addFilters(Filter[] $filters)` accepts an array of pre-built Filter objects in ONE FilterGroup — multiple filters in the same array produce OR logic. You can mix both in one builder chain.",
    hint: "The singular version always creates a new AND group; the plural version puts everything into one OR group.",
    topic: "SearchCriteria",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 12 — Service Contracts & Repository Pattern"
  },
  {
    question: "How does the REST API URL pattern map to SearchCriteriaInterface for repository `getList()` calls?",
    answer: "The REST URL uses `searchCriteria[filter_groups][N][filters][M]` parameters that map 1:1 to the PHP SearchCriteriaInterface structure. Different `filter_groups` indices produce AND logic between groups, while multiple `filters` within the same group produce OR logic. Pagination uses `searchCriteria[pageSize]` and `searchCriteria[currentPage]`, and sorting uses `searchCriteria[sortOrders][N]`.",
    hint: "The URL query parameters mirror the exact object hierarchy of the PHP search criteria — groups, filters, sorts, and pages.",
    topic: "Web API",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 12 — Service Contracts & Repository Pattern"
  },
  {
    question: "What is the identity cache (identity map) pattern in Magento 2 repositories, and why is it used?",
    answer: "Repository implementations typically maintain a private `$cache` array keyed by entity ID. When `getById()` is called, it first checks this array before hitting the database. This prevents redundant DB queries for the same entity within a single request. The cache is invalidated on `save()` and `delete()` by unsetting the relevant key. It is request-scoped only — not persistent.",
    hint: "A simple in-memory array prevents the same database row from being loaded twice in one PHP request.",
    topic: "Repository Pattern",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 12 — Service Contracts & Repository Pattern"
  },
  {
    question: "What is the EAV (Entity-Attribute-Value) pattern, and which Magento entities use it?",
    answer: "EAV is a data modeling pattern where entity data is stored across multiple narrow tables (entity, attribute, value) instead of one wide table. This allows adding custom attributes without ALTER TABLE operations. The EAV entities are `catalog_product`, `catalog_category`, `customer`, and `customer_address`. Orders (`sales_order`) use flat tables, NOT EAV.",
    hint: "This pattern trades query performance for schema flexibility — not all entities use it.",
    topic: "EAV Architecture",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 11 — Attributes & Attribute Sets"
  },
  {
    question: "Where are `select` attribute values physically stored in the EAV database?",
    answer: "A `select` attribute stores the option_id (an integer) in the `*_entity_int` value table, NOT the text label. The labels are stored separately in `eav_attribute_option` and `eav_attribute_option_value` tables. For `multiselect`, comma-separated option IDs are stored as a string in the `*_entity_varchar` table.",
    hint: "The value table holds a numeric reference, not the human-readable text — labels live in dedicated option tables.",
    topic: "EAV Attributes",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 11 — Attributes & Attribute Sets"
  },
  {
    question: "What is a 'static' attribute type in Magento's EAV system, and what are some examples?",
    answer: "Static attributes are stored directly as columns in the main entity table (e.g., `catalog_product_entity`) rather than in the EAV value tables. Examples include `sku`, `created_at`, `updated_at`, `has_options`, and `required_options`. Static attributes cannot be store-view specific — `sku` is globally unique precisely because it is static.",
    hint: "These attributes bypass the value tables entirely and live as real columns on the main table.",
    topic: "EAV Architecture",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 11 — Attributes & Attribute Sets"
  },
  {
    question: "What are the three EAV attribute scope constants and their (counter-intuitive) integer values?",
    answer: "`SCOPE_STORE = 0` (per store view — most granular), `SCOPE_GLOBAL = 1` (same value everywhere — least granular), and `SCOPE_WEBSITE = 2` (per website). The integer values are counter-intuitive: 0 for the most granular scope and 1 for the broadest. These are defined in `ScopedAttributeInterface`.",
    hint: "The numbering is reversed from what you'd expect — zero doesn't mean 'none' or 'global.'",
    topic: "Attribute Scope",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 11 — Attributes & Attribute Sets"
  },
  {
    question: "What happens when you change an attribute from Global to Store View scope?",
    answer: "Existing data is stored only in `store_id = 0` (the default row). Store-view-specific rows don't exist yet. All store views fall back to the default, which initially appears correct. But when a merchant edits on one store view, only that view gets a new row — other views still use the old global value. You should run `bin/magento catalog:product:attributes:cleanup` to handle this.",
    hint: "The scope change doesn't automatically duplicate values — it creates a data inconsistency risk.",
    topic: "Attribute Scope",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 11 — Attributes & Attribute Sets"
  },
  {
    question: "What are the three model types in EAV attribute architecture, and what does each do?",
    answer: "Source Model (`getAllOptions()`) provides the list of selectable options for select/multiselect attributes. Backend Model (`beforeSave()`, `afterLoad()`) handles validation and data transformation during save/load operations. Frontend Model (`getValue()`) controls how the attribute value is rendered/displayed. Source and Backend are the most commonly customized.",
    hint: "One provides choices, one validates/transforms on persistence, and one controls display rendering.",
    topic: "EAV Models",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 11 — Attributes & Attribute Sets"
  },
  {
    question: "How do you create a custom product attribute using the modern DataPatch approach?",
    answer: "Create a class implementing `DataPatchInterface` (and optionally `PatchRevertableInterface`) in `Setup/Patch/Data/`. Inject `ModuleDataSetupInterface` and `EavSetupFactory`. In `apply()`, create an EavSetup instance with `['setup' => $this->moduleDataSetup]` and call `addAttribute(Product::ENTITY, 'code', [...])`. Patches are tracked in `patch_list` and run only once.",
    hint: "The modern approach replaced InstallData/UpgradeData scripts and uses a tracked, one-time execution model.",
    topic: "DataPatch",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 11 — Attributes & Attribute Sets"
  },
  {
    question: "What is the difference between `is_filterable` and `is_filterable_in_search` on a product attribute?",
    answer: "`is_filterable` controls whether the attribute appears in layered navigation on category pages. `is_filterable_in_search` controls whether it appears in layered navigation on search results pages. These are separate flags — an attribute can be filterable on category pages but not on search results, or vice versa. Values: 0=no, 1=filterable with results, 2=filterable without results.",
    hint: "One applies to category browsing, the other to search results — they operate on different page types.",
    topic: "Attribute Flags",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 11 — Attributes & Attribute Sets"
  },
  {
    question: "What is the maximum length for an attribute code, and what naming rules apply?",
    answer: "Attribute codes must be 60 characters or fewer (defined by `ATTRIBUTE_CODE_MAX_LENGTH` constant). They must start with a letter, contain only letters (a-z, A-Z), numbers, and underscores, and be unique per entity type. This 60-character limit exists because flat-mode column names in MySQL cannot exceed 64 characters.",
    hint: "The length limit is related to database column name constraints in flat catalog mode.",
    topic: "EAV Attributes",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 11 — Attributes & Attribute Sets"
  },
  {
    question: "What is `Source\\Table` and when is it used as an EAV source model?",
    answer: "`Source\\Table` is the default source model for select and multiselect attributes when options are managed through the Magento Admin. It reads from `eav_attribute_option` and `eav_attribute_option_value` tables. Custom source models should extend `AbstractSource` and implement `getAllOptions()` returning arrays of `['value' => ..., 'label' => ...]`.",
    hint: "This built-in source model connects to the option management tables — it's the standard choice when options are admin-managed.",
    topic: "EAV Models",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 11 — Attributes & Attribute Sets"
  },
  {
    question: "How do swatch attributes differ from regular select attributes in Magento 2?",
    answer: "Swatch attributes are fundamentally `select` attributes with additional metadata stored in the `eav_attribute_option_swatch` table. The `input` type is still `select`, but the `swatch_input_type` property determines rendering: `visual` for color/image swatches, `text` for text label swatches. They replace standard dropdowns on configurable product pages.",
    hint: "They share the same foundation as dropdowns but add an extra table for visual representation data.",
    topic: "Swatch Attributes",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 11 — Attributes & Attribute Sets"
  },
  {
    question: "What does `used_in_product_listing = 1` do for an EAV attribute?",
    answer: "Setting `used_in_product_listing = 1` ensures the attribute value is loaded in category listing queries. This is required if you need the attribute value in `.phtml` templates for product listing pages. Without it, the value will be `null` in listing context because the attribute is not joined into the collection query.",
    hint: "Without this flag, attempting to read the attribute on a category listing page returns nothing, even though the data exists in the database.",
    topic: "Attribute Flags",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 11 — Attributes & Attribute Sets"
  },
  {
    question: "What is the `user_defined` flag on EAV attributes, and what does it control?",
    answer: "`user_defined = true` marks an attribute as merchant/developer-created, meaning it can be deleted through the Admin UI. `user_defined = false` marks it as a system attribute that cannot be deleted via admin. Core Magento attributes like `name`, `price`, and `description` have `user_defined = 0`. Custom attributes should use `user_defined = 1`.",
    hint: "This flag determines whether the Admin interface allows deleting the attribute.",
    topic: "EAV Attributes",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 11 — Attributes & Attribute Sets"
  },
  {
    question: "How does `DataPatchInterface` differ from the legacy `InstallData`/`UpgradeData` approach?",
    answer: "`DataPatchInterface` (introduced in Magento 2.3) provides one-time data operations tracked in the `patch_list` table — each patch runs only once per environment. It requires implementing `apply()`, `getDependencies()`, and `getAliases()`. It replaced `InstallData`/`UpgradeData` scripts which were harder to manage across versions. To re-run during development, delete the row from `patch_list`.",
    hint: "The modern approach tracks execution state in a database table, ensuring each data change runs exactly once.",
    topic: "DataPatch",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 11 — Attributes & Attribute Sets"
  },
  {
    question: "What is the `catalog_eav_attribute` table and how does it relate to `eav_attribute`?",
    answer: "`catalog_eav_attribute` is a supplementary table that extends `eav_attribute` with catalog-specific flags like `is_global` (scope), `is_searchable`, `is_filterable`, `is_comparable`, `used_in_product_listing`, and `visible_on_front`. It is joined to `eav_attribute` by `attribute_id`. The base `eav_attribute` table stores core definitions (code, type, models) while `catalog_eav_attribute` adds catalog behavior.",
    hint: "One table has the universal attribute definition, the other adds catalog-specific behavioral flags via a foreign key join.",
    topic: "EAV Database Schema",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 11 — Attributes & Attribute Sets"
  },
  {
    question: "What does `getConfigurableProductLinks()` return, and how do you load the actual child products?",
    answer: "`getConfigurableProductLinks()` returns an array of child entity IDs (integers), NOT product objects. Children are not embedded in the parent product. You must make a separate `getList()` call with an `entity_id IN (...)` filter, or use `$product->getTypeInstance()->getUsedProducts($product)` to load them. The children must be simple products created before the parent.",
    hint: "You only get numeric references, not full objects — a second query is always needed to get the actual product data.",
    topic: "Configurable Products",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 13 — Catalog Operations"
  },
  {
    question: "What are the six product types in Magento 2, and which ones require no shipping?",
    answer: "The six types are Simple (physical, single SKU), Configurable (parent with simple children), Grouped (collection of simples), Bundle (customer-assembled options), Virtual (no shipping — services/subscriptions), and Downloadable (virtual + file downloads). Virtual and Downloadable products do not require shipping. Bundle price can be Fixed (0) or Dynamic (1).",
    hint: "Four are physical, two skip shipping — one of the shipping-free types adds file delivery capability.",
    topic: "Product Types",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 13 — Catalog Operations"
  },
  {
    question: "What is the difference between `ProductRepositoryInterface::get()` and `getById()`?",
    answer: "`get($sku)` loads a product by SKU (string), while `getById($productId)` loads by entity_id (integer). Both share the same internal identity map/cache. The 4th parameter `$forceReload = true` bypasses this cache, which is required if you modify and re-load a product in the same request. The `$storeId` parameter (3rd) controls store scope.",
    hint: "One uses the string identifier merchants see, the other uses the database primary key — both cache results internally.",
    topic: "Product Repository",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 13 — Catalog Operations"
  },
  {
    question: "Why does `CategoryRepositoryInterface` lack a `getList()` method, and how do you browse the category tree?",
    answer: "`CategoryRepositoryInterface` only has `get()`, `save()`, `delete()`, and `deleteByIdentifier()` — no `getList()`. To navigate the category tree, use `CategoryManagementInterface::getTree($rootCategoryId, $depth)` which returns a `CategoryTreeInterface` with `getChildrenData()` for recursive traversal. The `$depth` parameter controls recursion depth (null = unlimited).",
    hint: "The repository handles individual category CRUD, but tree navigation uses a separate management interface.",
    topic: "Category Operations",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 13 — Catalog Operations"
  },
  {
    question: "What is the difference between `addAttributeToFilter()` and `addFieldToFilter()` on a ProductCollection?",
    answer: "`addAttributeToFilter()` filters on EAV attributes by joining the appropriate EAV value tables. `addFieldToFilter()` filters directly on main table or flat table columns without EAV joins. Use `addAttributeToFilter` for EAV attributes like name, price, and color. Use `addFieldToFilter` for static/flat columns like entity_id.",
    hint: "One performs EAV table joins, the other queries columns that already exist on the main table.",
    topic: "Product Collections",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 13 — Catalog Operations"
  },
  {
    question: "What are the three product link types, and where does each display?",
    answer: "Related products (`related`) display on the product page as 'Related Products.' Up-sell products (`upsell`) display on the product page as 'You May Also Like.' Cross-sell products (`crosssell`) display on the shopping cart page as 'You May Also Be Interested In.' Using `LinkManagementInterface::setProductLinks()` replaces ALL existing links of that type — it does not append.",
    hint: "Two appear on the product detail page, one appears only in the cart — and setting links is a full replacement, not an addition.",
    topic: "Product Links",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 13 — Catalog Operations"
  },
  {
    question: "What are the four image roles in Magento 2, and how are they stored?",
    answer: "The roles are `image` (base/main image), `small_image` (product listings), `thumbnail` (cart/related products), and `swatch_image` (color swatches). Each role is stored as a separate EAV varchar attribute in `catalog_product_entity_varchar` whose value is the file path. One image file can be assigned to multiple roles simultaneously. Setting `setTypes([])` removes all role assignments.",
    hint: "Roles are actually EAV attributes pointing to file paths — the same file can serve multiple display purposes.",
    topic: "Product Media",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 13 — Catalog Operations"
  },
  {
    question: "What does `setIsAnchor(true)` do on a Magento 2 category?",
    answer: "`setIsAnchor(true)` makes a category show products from all its child categories in its product collection, not just products directly assigned to it. This enables layered navigation to aggregate products from the entire subtree. It affects how `addCategoryFilter()` works on collections, using the `catalog_category_product_index` for performance.",
    hint: "This flag turns a category into an aggregator that pulls in products from its entire descendant tree.",
    topic: "Category Operations",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 13 — Catalog Operations"
  },
  {
    question: "How does the flat catalog feature affect ProductCollection queries?",
    answer: "When flat catalog is enabled, `addAttributeToSelect` and `addAttributeToFilter` query `catalog_product_flat_X` tables (one per store view) instead of EAV value tables. This improves performance but custom EAV joins may break if an attribute isn't in the flat table. Flat catalog is disabled by default in Magento 2.4+ and is deprecated due to Elasticsearch handling search.",
    hint: "The denormalized tables speed up reads but can break custom queries that assume EAV table structure.",
    topic: "Flat Catalog",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 13 — Catalog Operations"
  },
  {
    question: "What does `deleteById()` accept on `ProductRepositoryInterface` versus other repositories?",
    answer: "`ProductRepositoryInterface::deleteById()` takes a SKU string, not an integer ID — this is different from the standard repository pattern where `deleteById()` typically takes an integer entity_id. The `get()` method also uses SKU. The Product repository's `save()` can throw `InputException`, `StateException`, or `CouldNotSaveException`, unlike the standard single exception.",
    hint: "The product repository deviates from the generic pattern — its identifier-based methods use the merchant-visible string key, not the database primary key.",
    topic: "Product Repository",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 13 — Catalog Operations"
  },
  {
    question: "What is the difference between `getList()` via repository and `getUsedProducts()` for configurable children?",
    answer: "`getList()` returns `ProductInterface[]` (repository objects) with fully loaded extension attributes, respects SearchCriteria store scope, and uses the repository identity map. `getUsedProducts()` returns `Product[]` (model objects), uses the type instance's internal cache, loads for the current store only, and may not have extension attributes fully loaded.",
    hint: "One follows the service contract pattern with full features; the other is a lower-level model method optimized for frontend rendering.",
    topic: "Configurable Products",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 13 — Catalog Operations"
  },
  {
    question: "How are configurable product options set up programmatically via the repository?",
    answer: "Configurable options reference `attribute_id` and `value_index` (option IDs), not labels. You load the configurable attribute, build options with `OptionsFactory::create()` containing attribute_id, label, position, and values arrays, then set them via `$extensionAttributes->setConfigurableProductOptions($options)` and `setConfigurableProductLinks([childEntityIds])`. Children must be created first.",
    hint: "Options reference numeric IDs (not text), and both the option configuration and child ID links go through extension attributes.",
    topic: "Configurable Products",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 13 — Catalog Operations"
  },
  {
    question: "What does `addAttributeToSelect('*')` do on a ProductCollection, and why should it be used carefully?",
    answer: "`addAttributeToSelect('*')` tells the collection to join ALL EAV attribute value tables and load every attribute for each product. This is expensive because it generates many SQL JOINs across multiple EAV value tables. For listing pages, prefer selecting only the specific attributes you need (e.g., `addAttributeToSelect('name')`) to minimize query cost.",
    hint: "The wildcard selector triggers exhaustive EAV table joins — fine for single product loads but costly for collections.",
    topic: "Product Collections",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 13 — Catalog Operations"
  },
  {
    question: "What are category IDs 1 and 2 in Magento 2, and why are they significant?",
    answer: "Category ID 1 is the 'Root of Roots' — the invisible top-level parent of all root categories. Category ID 2 is the 'Default Category' — the default root category assigned to the default store. Both are system categories that should not be deleted. When calling `CategoryManagementInterface::getTree()`, using root ID 1 shows all roots, while ID 2 shows the default store's tree.",
    hint: "These two IDs are special system entries at the very top of the category hierarchy — one is the universal parent, the other is the first usable root.",
    topic: "Category Operations",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 13 — Catalog Operations"
  },
  {
    question: "How does a grouped product differ from a configurable product in terms of pricing and cart behavior?",
    answer: "A grouped product has NO price on the parent — each associated simple product has its own price and is added to the cart as a separate line item. A configurable product's price comes from its simple children but appears as a single line item in the cart. Grouped product links are associations (not true parent-child), while configurable children are linked via super attributes.",
    hint: "One creates separate cart entries with independent prices; the other presents a unified product with variant selection.",
    topic: "Product Types",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 13 — Catalog Operations"
  },
  {
    question: "What is the difference between `CartManagementInterface::createEmptyCart()` and `createEmptyCartForCustomer()`?",
    answer: "`createEmptyCart()` creates a new empty quote for a guest user and returns the cart/quote ID as an integer. `createEmptyCartForCustomer(int $customerId)` creates a quote assigned to a logged-in customer. `placeOrder(int $cartId)` validates and converts the quote to an order, returning the Order entity_id (integer), not an order object.",
    hint: "One is anonymous, the other is authenticated — both return just the ID number, not the full object.",
    topic: "Cart Operations",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 14 — Checkout & Sales Operations"
  },
  {
    question: "Where are custom total models registered in Magento 2, and what determines their calculation order?",
    answer: "Custom totals are registered in `etc/sales.xml` (NOT `di.xml`) under `<section name=\"quote\"><group name=\"totals\">`. The `sort_order` attribute determines calculation sequence. Key reference points: subtotal=100, discount=300, shipping=350, tax=450, grand_total=550. Your custom total should have a sort_order before grand_total (550) but after its dependencies.",
    hint: "The registration file is specific to the sales module, and position numbers control the calculation pipeline order.",
    topic: "Custom Totals",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 14 — Checkout & Sales Operations"
  },
  {
    question: "What is the mandatory flow inside a custom total model's `collect()` method?",
    answer: "First, always call `parent::collect()` which resets the total for recalculation. Then check `$shippingAssignment->getItems()` — if empty, skip to avoid double-counting (you're on the billing address). Calculate the amount, then call both `$total->addTotalAmount(code, amount)` and `$total->addBaseTotalAmount(code, baseAmount)`. Also set the value on the quote via `$quote->setData()` for persistence.",
    hint: "Reset first, guard against empty items, then update both the total tracker AND the quote object.",
    topic: "Custom Totals",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 14 — Checkout & Sales Operations"
  },
  {
    question: "What is the difference between order State and order Status in Magento 2?",
    answer: "State is a system-level lifecycle stage with fixed values (hardcoded enum): `new`, `pending_payment`, `processing`, `complete`, `closed`, `canceled`, `holded`, `payment_review`. Status is a configurable, store-visible label that maps to a state (e.g., 'pending', 'fraud'). Multiple statuses can map to one state. `complete` = fully shipped and invoiced; `closed` = fully refunded.",
    hint: "One is an immutable system enum, the other is a customizable display label that points to the enum.",
    topic: "Order Management",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 14 — Checkout & Sales Operations"
  },
  {
    question: "What validation steps does `placeOrder()` execute before converting a quote to an order?",
    answer: "`placeOrder()` validates: (1) quote is active, (2) shipping address is valid, (3) shipping method is set and available, (4) payment method is valid, (5) inventory is available, (6) coupon codes are valid, (7) recalculates all totals via `collectTotals()`. Any failure throws `LocalizedException` and no order is created. Virtual orders skip shipping validation.",
    hint: "Seven validation steps form a pipeline — failure at any point blocks the entire conversion.",
    topic: "Order Placement",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 14 — Checkout & Sales Operations"
  },
  {
    question: "How do you create an invoice programmatically, and what is the difference between CAPTURE_ONLINE and CAPTURE_OFFLINE?",
    answer: "Use `InvoiceService::prepareInvoice($order, $qtys)` to create the invoice object, then call `$invoice->register()` to update item quantities. `CAPTURE_ONLINE` triggers an actual payment capture request to the gateway during `register()`. `CAPTURE_OFFLINE` just records the payment locally. Save the invoice and order together using `Magento\\Framework\\DB\\Transaction`.",
    hint: "One mode contacts the payment gateway for real money movement; the other is just bookkeeping.",
    topic: "Invoice Creation",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 14 — Checkout & Sales Operations"
  },
  {
    question: "What are the required components for adding a custom checkout step in Magento 2?",
    answer: "Four components are required: (1) a PHP LayoutProcessor implementing `LayoutProcessorInterface` that injects step config into the JS layout array, (2) DI registration in `etc/frontend/di.xml` on `Magento\\Checkout\\Block\\Onepage` as a `layoutProcessors` argument, (3) a JS component that calls `stepNavigator.registerStep()` in its `initialize()`, and (4) a KnockoutJS template.",
    hint: "Both server-side (PHP) and client-side (JS) registration are mandatory — missing either makes the step invisible.",
    topic: "Custom Checkout Step",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 14 — Checkout & Sales Operations"
  },
  {
    question: "How does `CreditmemoService::refund()` differ from invoice creation in terms of calling `register()`?",
    answer: "Unlike invoices where you must call `$invoice->register()` separately before saving, `CreditmemoService::refund()` handles registration internally — you should NOT call `register()` manually. The `$offlineRefund` parameter (default `false`) controls whether to contact the payment gateway. `adjustment_positive` is extra credit to the customer; `adjustment_negative` is a deduction like a restocking fee.",
    hint: "The credit memo service bundles the registration step internally, unlike the separate invoice workflow.",
    topic: "Credit Memo",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 14 — Checkout & Sales Operations"
  },
  {
    question: "What does `OrderRepositoryInterface::get(int $id)` use as the lookup key, and how do you load by increment ID?",
    answer: "`get($id)` uses the `entity_id` (auto-increment primary key), NOT the increment ID (e.g., '000000042'). To load by increment ID, use `getList()` with a `SearchCriteriaBuilder` filter on `increment_id`. The increment ID is the human-readable order number shown to customers and in the Admin.",
    hint: "The repository uses the database primary key, not the merchant-visible order number — a search filter is needed for the latter.",
    topic: "Order Repository",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 14 — Checkout & Sales Operations"
  },
  {
    question: "What happens to a quote after `placeOrder()` succeeds?",
    answer: "The quote is deactivated (`is_active = 0`) but NOT deleted from the database. The quote and order are separate database records in different tables (`quote` and `sales_order`). Quote items have `qty` while order items track `qty_ordered`, `qty_shipped`, `qty_invoiced`, and `qty_refunded` separately.",
    hint: "The source record isn't destroyed — it's just flagged as inactive while the new order record lives independently.",
    topic: "Order Placement",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 14 — Checkout & Sales Operations"
  },
  {
    question: "What does `ShipmentFactory::create()` accept, and what triggers the order state transition to Complete?",
    answer: "`ShipmentFactory::create($order, $items, $tracks)` creates a new shipment object where `$items` is `[orderItemId => qty]` (empty = all shippable items) and `$tracks` is an optional array of tracking data. Calling `$shipment->register()` triggers the order state transition to `complete` if ALL items are now fully shipped. Virtual products must be skipped.",
    hint: "The factory creates the object, but it's the registration step that actually updates the order lifecycle state.",
    topic: "Shipment Creation",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 14 — Checkout & Sales Operations"
  },
  {
    question: "How do LayoutProcessors for custom checkout steps get registered in Magento 2?",
    answer: "LayoutProcessors are registered via `etc/frontend/di.xml` as constructor arguments on `Magento\\Checkout\\Block\\Onepage`, NOT via layout XML. The `layoutProcessors` parameter is a named constructor argument. The LayoutProcessor implements `LayoutProcessorInterface` and its `process(array $jsLayout)` method receives the full JS layout array and must return the modified version.",
    hint: "Registration happens through dependency injection configuration, not layout XML — it's a constructor parameter, not a layout argument.",
    topic: "Custom Checkout Step",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 14 — Checkout & Sales Operations"
  },
  {
    question: "What method on InvoiceManagementInterface triggers online payment capture, and what is a common misconception?",
    answer: "`InvoiceManagementInterface::setCapture(int $invoiceId)` triggers payment capture. A common misconception is that a `pay()` method exists — it does NOT exist on this interface. The actual methods are `setCapture()`, `getCommentsList()`, `notify()`, and `setVoid()`. For online payment methods, `setCapture()` sends a real capture request to the payment gateway.",
    hint: "The method name describes setting the capture state, not a direct payment action — and a frequently expected method simply doesn't exist.",
    topic: "Invoice Creation",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 14 — Checkout & Sales Operations"
  },
  {
    question: "Which order states prevent cancellation, and what management methods accept entity_id vs order objects?",
    answer: "`cancel()` fails (throws exception) if the order is in `complete` or `closed` state — always check `$order->canCancel()` first. `OrderManagementInterface::hold()`, `unHold()`, and `cancel()` all accept the order entity_id as an integer. `hold()` transitions state to `holded` regardless of current state except from `complete`, `closed`, or `canceled`.",
    hint: "Finished and refunded orders can't be cancelled — and the management methods work with IDs, not full order objects.",
    topic: "Order Management",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 14 — Checkout & Sales Operations"
  },
  {
    question: "What does `CartRepositoryInterface::getActive()` do differently from `get()`?",
    answer: "`get()` loads any quote regardless of its active state (active or inactive). `getActive()` loads a quote only if it is active (`is_active = 1`) and throws `NoSuchEntityException` if the quote exists but is inactive. Always use `getActive()` when working with active shopping carts to avoid accidentally processing already-placed orders' deactivated quotes.",
    hint: "One loads any quote unconditionally; the other enforces the active-state requirement and rejects inactive quotes.",
    topic: "Cart Operations",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 14 — Checkout & Sales Operations"
  },
  {
    question: "What are the two primary patterns for working with entities programmatically in Magento 2, and which is recommended?",
    answer: "The two patterns are the Repository (Service Layer) pattern using RepositoryInterface, and the Direct Model save/load pattern using AbstractModel. The Repository pattern is the only recommended approach in new Magento 2 development because it supports full plugin interception, while direct model save() bypasses the service contract layer and skips repository plugins.",
    hint: "One pattern uses service contracts and sits between business logic and persistence; the other operates directly on AbstractModel.",
    topic: "Entity Manipulation",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 15 — Programmatic Entity Manipulation"
  },
  {
    question: "What is the difference between ProductRepositoryInterface's get() and getById() methods?",
    answer: "The get() method loads a product by its SKU (string identifier), while getById() loads a product by its entity ID (integer). Both methods throw NoSuchEntityException if the entity is not found. Both are methods on ProductRepositoryInterface and are part of the service contract.",
    hint: "One accepts a string product identifier, the other accepts a numeric identifier.",
    topic: "Repository Pattern",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 15 — Programmatic Entity Manipulation"
  },
  {
    question: "Why should you never call $model->save() on an entity loaded through a repository?",
    answer: "Calling $model->save() directly bypasses the repository's plugin interception chain. Repository save() triggers beforeSave() and afterSave() plugins where extensions can intercept, validate, and audit operations. Direct model save() goes straight to ResourceModel::save(), skipping all repository plugins, observers registered on repository events, and caching strategies.",
    hint: "Think about what intermediary layer is skipped when you bypass the service contract.",
    topic: "Entity Manipulation",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 15 — Programmatic Entity Manipulation"
  },
  {
    question: "In SearchCriteriaBuilder's addFilter() method, what is the default condition type if the third argument is omitted?",
    answer: "The default condition type is 'eq' (equal). So addFilter('status', 1) is equivalent to addFilter('status', 1, 'eq'). The third argument accepts condition types like 'eq', 'neq', 'like', 'in', 'nin', 'gt', 'gteq', 'lt', 'lteq', 'null', 'notnull', 'from', and 'to'.",
    hint: "The simplest comparison operation is assumed when no condition type is specified.",
    topic: "SearchCriteria",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 15 — Programmatic Entity Manipulation"
  },
  {
    question: "What is the difference between passing a plain array [1, 2, 3] vs ['in' => [1, 2, 3]] to addFieldToFilter()?",
    answer: "Passing a plain array like [1, 2, 3] creates OR conditions: (field = 1) OR (field = 2) OR (field = 3). It does NOT create an IN condition. To create an actual SQL IN() clause, you must use the associative array format: ['in' => [1, 2, 3]], which produces: field IN (1, 2, 3).",
    hint: "A non-associative array is treated differently than an associative array with the 'in' key.",
    topic: "Collection Filtering",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 15 — Programmatic Entity Manipulation"
  },
  {
    question: "When filtering product collections, when should you use addAttributeToFilter() versus addFieldToFilter()?",
    answer: "Use addAttributeToFilter() for EAV-based attributes (products, categories, customers) because it automatically joins the EAV value table. Use addFieldToFilter() for flat table columns (e.g., order collections, which use flat tables). For product collections, addAttributeToFilter() is the correct choice since products use the EAV model.",
    hint: "The choice depends on whether the entity data is stored in the EAV model or flat tables.",
    topic: "Collection Filtering",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 15 — Programmatic Entity Manipulation"
  },
  {
    question: "What does getSize() return on a paginated collection, and how does it differ from count($collection->getItems())?",
    answer: "getSize() fires a separate COUNT(*) query that ignores setPageSize() and setCurPage(), returning the total number of matching records across all pages. count($collection->getItems()) returns the count of items actually loaded in the current page, which is limited by setPageSize(). For example, with 150 total records and pageSize of 10, getSize() returns 150 while count(getItems()) returns 10.",
    hint: "One method counts all matching records regardless of pagination; the other counts only what was loaded.",
    topic: "Collection Pagination",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 15 — Programmatic Entity Manipulation"
  },
  {
    question: "What is the difference between _construct() (single underscore) and __construct() (double underscore) in a Magento 2 ResourceModel?",
    answer: "The _construct() method (single underscore) is Magento's AbstractDb initialization hook that calls $this->_init(tableName, primaryKey) to set the table name and primary key. The __construct() method (double underscore) is the standard PHP constructor used for dependency injection. The _construct() method is called automatically by the parent::__construct() during initialization.",
    hint: "One is a PHP language feature for DI, the other is a Magento framework convention for initialization.",
    topic: "Custom Entity CRUD",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 15 — Programmatic Entity Manipulation"
  },
  {
    question: "What does DataObjectHelper's populateWithArray() method do, and how does it handle array key naming?",
    answer: "populateWithArray() hydrates Data Objects (DTOs implementing service contract data interfaces) from raw PHP arrays. It automatically converts snake_case array keys to camelCase setter method names (e.g., 'custom_attr' maps to setCustomAttr()). It also recursively handles nested data objects, including extension attributes. The method signature is populateWithArray($dataObject, $array, InterfaceClass::class).",
    hint: "Think about how array keys like 'attribute_set_id' get mapped to the appropriate setter methods.",
    topic: "DataObjectHelper",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 15 — Programmatic Entity Manipulation"
  },
  {
    question: "In a Magento 2 repository implementation, how does the getList() method apply SearchCriteria to a collection?",
    answer: "The getList() method uses CollectionProcessorInterface::process($searchCriteria, $collection) to automatically apply all SearchCriteria filters, sort orders, and page settings to the collection in one call. This eliminates the need to manually translate SearchCriteria to individual collection method calls. The default implementation is Magento\\Framework\\Api\\SearchCriteria\\CollectionProcessor.",
    hint: "A single interface method handles the translation between SearchCriteria and Collection filter methods.",
    topic: "Repository Pattern",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 15 — Programmatic Entity Manipulation"
  },
  {
    question: "What are Data Patches in Magento 2, and how are they tracked?",
    answer: "Data Patches are classes implementing DataPatchInterface that run once during setup:upgrade to modify data in the database. They replace deprecated InstallData/UpgradeData scripts. They are tracked in the patch_list table -- once a patch class appears in this table, it will never run again even if the code changes. To force a re-run during development, you must delete the row from patch_list.",
    hint: "A database table keeps a record of which patches have already been applied.",
    topic: "Data Patches",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 15 — Programmatic Entity Manipulation"
  },
  {
    question: "Why must you call emulateAreaCode() in Data Patches when loading entities?",
    answer: "Data patches execute in CLI context where no area code is set by default. Loading products or other entities that use area-dependent logic (layout, design) will fail with an 'Area code not set' exception without explicitly setting an area code. You must wrap entity operations in $this->appState->emulateAreaCode(Area::AREA_ADMINHTML, function() { ... }) to set the proper context.",
    hint: "The CLI environment lacks something that the web context provides automatically.",
    topic: "Data Patches",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 15 — Programmatic Entity Manipulation"
  },
  {
    question: "In a custom entity CRUD implementation, what does each _init() call configure in the Model, ResourceModel, and Collection classes?",
    answer: "In the Model's _construct(), $this->_init(ResourceModel::class) links the model to its resource. In the ResourceModel's _construct(), $this->_init('table_name', 'primary_key') sets the database table and primary key column. In the Collection's _construct(), $this->_init(Model::class, ResourceModel::class) links the collection to both its model and resource model classes.",
    hint: "Each class in the trio receives different arguments to its _init() call.",
    topic: "Custom Entity CRUD",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 15 — Programmatic Entity Manipulation"
  },
  {
    question: "How do database transactions work with Magento's ResourceConnection, and what are the methods involved?",
    answer: "Transactions use beginTransaction(), commit(), and rollBack() methods on the connection object returned by ResourceConnection::getConnection() -- not on ResourceConnection itself. They should always be wrapped in try/catch with rollBack() in the catch block. Nested beginTransaction() calls create SQL savepoints internally. Transaction rollback only undoes database writes -- it does NOT undo cache entries, external service calls, or file system changes.",
    hint: "The transaction methods belong to a specific object obtained from ResourceConnection, and rollback has important limitations.",
    topic: "Transaction Handling",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 15 — Programmatic Entity Manipulation"
  },
  {
    question: "How do multiple addFieldToFilter() calls on a collection create AND vs OR conditions?",
    answer: "Multiple separate addFieldToFilter() calls create AND conditions -- each call adds a WHERE AND clause. To create OR conditions, pass arrays of fields and conditions in a single addFieldToFilter() call: $collection->addFieldToFilter(['name', 'sku'], [['like' => '%blue%'], ['like' => '%BLU%']]) produces name LIKE '%blue%' OR sku LIKE '%BLU%'.",
    hint: "The distinction is whether you make separate calls or combine conditions in a single call.",
    topic: "Collection Filtering",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 15 — Programmatic Entity Manipulation"
  },
  {
    question: "What are the four core Adobe Commerce SaaS services, and what infrastructure do they run on?",
    answer: "The four core SaaS services are Live Search (SaaS-based storefront search), Product Recommendations (ML-powered product suggestions), Catalog Service (high-performance catalog data API), and Payment Services (managed payment processing). They all run on Adobe's managed infrastructure (Adobe I/O, SaaS Data Space), not on the local Commerce instance, and receive data via the catalog-exporter module.",
    hint: "These services offload computationally intensive workloads to Adobe's cloud, not your Commerce server.",
    topic: "SaaS Services",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 16 — SaaS Data Flow & Integrations"
  },
  {
    question: "How does the SaaS data export pipeline work in Adobe Commerce, from product save to SaaS availability?",
    answer: "When a product is saved, observers fire and mark feed rows as dirty in cde_*_feed tables. A cron job (saas_data_exporter group, running every ~5 minutes) reads dirty rows, serializes them, and transmits them to Adobe SaaS endpoints. There is also event-driven sync where feed indexers are invalidated on product save. The total delay from save to SaaS availability is typically seconds to ~10 minutes under normal conditions.",
    hint: "The pipeline involves dirty marking, feed tables, cron-based transmission, and Adobe-side processing.",
    topic: "SaaS Data Export",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 16 — SaaS Data Flow & Integrations"
  },
  {
    question: "What is the difference between the Products feed and the Product Overrides feed in SaaS data export?",
    answer: "The Products feed exports core product data including attributes, descriptions, images, and status. The Product Overrides feed exports price data -- per website/customer group price overrides. Price data is NOT included in the Products feed; it has its own separate feed. This separation allows price changes to sync without re-exporting full product data.",
    hint: "Price information is handled by a separate feed, not the main product feed.",
    topic: "SaaS Feed Types",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 16 — SaaS Data Flow & Integrations"
  },
  {
    question: "What does the saas:resync --feed=products command do, and how does it differ from incremental sync?",
    answer: "The saas:resync --feed=products command forces a full resync from scratch -- it marks ALL rows for re-export, not just dirty rows. This is a heavier operation than incremental sync, which only transmits rows that have been changed since the last sync. Use saas:resync when data appears out of sync or after major catalog changes. You can also use --feed=all to resync all feeds at once.",
    hint: "This command marks every record for re-transmission, not just the ones that changed.",
    topic: "SaaS Data Sync",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 16 — SaaS Data Flow & Integrations"
  },
  {
    question: "How does Live Search differ from the native Adobe Commerce search engine architecture?",
    answer: "Live Search bypasses the local OpenSearch/Elasticsearch entirely for storefront search queries. With native search, queries go from the storefront to OpenSearch and back. With Live Search, queries go directly to Adobe SaaS infrastructure, which uses synced catalog feed data. OpenSearch does not need to be running for search if Live Search is active, though it may still be used for catalog browsing and layered navigation depending on module setup.",
    hint: "One approach queries a local search index; the other sends queries to a cloud-hosted service.",
    topic: "Live Search",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 16 — SaaS Data Flow & Integrations"
  },
  {
    question: "What are the four key behavioral events collected by Product Recommendations, and what are they used for?",
    answer: "The four key behavioral events are: pageView (fired on every page load), productPageView (fired on product detail pages), addToCart (fired when items are added to cart), and placeOrder (fired on order success page). These events are collected via JavaScript snippets on storefront pages and sent to Adobe Experience Platform Edge for ML model training by Adobe Sensei. The models use this data to generate recommendation types like 'Most Viewed', 'Bought This, Bought That', etc.",
    hint: "These JS-collected events track the full customer journey from browsing to purchasing.",
    topic: "Product Recommendations",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 16 — SaaS Data Flow & Integrations"
  },
  {
    question: "Why might a new product not appear in Live Search results immediately after being saved in the Admin?",
    answer: "SaaS sync has an inherent delay between saving a product in Commerce and it being available in Live Search. The product must go through the sync pipeline: save triggers dirty marking in cde_*_feed tables, the feed indexer must run, the cron job (saas_data_exporter group) must transmit the data, and Adobe must process it. This total delay is typically seconds to ~10 minutes. The product exists in the Commerce DB but hasn't been transmitted to or processed by Adobe SaaS yet.",
    hint: "There is a multi-step pipeline between the local database and the cloud search index.",
    topic: "SaaS Sync Delays",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 16 — SaaS Data Flow & Integrations"
  },
  {
    question: "Where are API keys for SaaS services configured in Adobe Commerce, and how are they shared?",
    answer: "API keys are configured in the Admin Panel at Stores > Configuration > Services > Commerce Services Connector -- not in .env or env.php files. This is admin-UI configured. Each SaaS service (Live Search, Product Recommendations, Catalog Service) shares the same Commerce Services Connector credentials -- you configure the API Key and SaaS Data Space ID once and all services use it.",
    hint: "A single admin configuration section serves all SaaS services.",
    topic: "SaaS Configuration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 16 — SaaS Data Flow & Integrations"
  },
  {
    question: "What is the Variants feed in SaaS data export, and why is it critical for configurable products?",
    answer: "The Variants feed exports the parent-child relationships and option values for configurable products -- specifically the associations between a configurable parent SKU and its simple product children. If the Variants feed fails to sync, swatches and product options will not render correctly in SaaS-powered storefront components like Live Search results. The Products feed exports the configurable SKU and its attributes, while the Variants feed handles the child product mappings.",
    hint: "Configurable products need both their parent data and their child relationships exported separately.",
    topic: "SaaS Feed Types",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 16 — SaaS Data Flow & Integrations"
  },
  {
    question: "How do you check whether SaaS feed data is current in Adobe Commerce?",
    answer: "Run bin/magento indexer:status and look for SaaS-prefixed indexers with the catalog_data_exporter_* prefix. If they show 'Ready' status, feed data is current. If they show 'Reindex required', you need to run indexer:reindex for those specific indexers. Feed sync errors can also be checked in var/log/commerce-data-export.log. There is no dedicated saas:status command -- indexer:status is the primary diagnostic tool.",
    hint: "Look for specific prefixed indexers in the standard indexer status output.",
    topic: "SaaS Troubleshooting",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 16 — SaaS Data Flow & Integrations"
  },
  {
    question: "Why do Product Recommendations require a training period before showing results?",
    answer: "Recommendation types that rely on behavioral data (like 'Most Viewed', 'Bought This, Bought That', 'Recommended for You') require typically 24-48 hours minimum of event collection before Adobe Sensei ML models can produce meaningful results. New stores will have no recommendations until sufficient pageView, productPageView, addToCart, and placeOrder events have been collected and processed. Both catalog sync AND behavioral events are required for accurate recommendations.",
    hint: "Machine learning models need enough data samples before they can make useful predictions.",
    topic: "Product Recommendations",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 16 — SaaS Data Flow & Integrations"
  },
  {
    question: "What is the configuration file for REST API endpoints in Magento 2, and where is it located?",
    answer: "REST API endpoints are declared in etc/webapi.xml within each module (app/code/Vendor/Module/etc/webapi.xml). This is the only place a REST endpoint is registered -- a valid PHP method that is NOT declared here will never be accessible via REST and will return a 404 error. The file contains <route> elements specifying URL, HTTP method, service class/method, and ACL resource.",
    hint: "A single XML file per module controls all REST and SOAP endpoint exposure.",
    topic: "REST API",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 17 — REST & GraphQL API Features"
  },
  {
    question: "What are the three REST URL prefix patterns in Magento 2, and when should each be used?",
    answer: "The three patterns are: /rest/V1/... (synchronous -- executes immediately and returns the full response), /rest/async/V1/... (async single -- queues to message queue and returns a bulk_uuid immediately), and /rest/async/bulk/V1/... (async bulk -- accepts an array of request bodies, each queued as a separate message). Use synchronous for real-time needs, async single for non-blocking operations, and async bulk for mass imports.",
    hint: "The URL prefix determines whether the operation runs immediately, is queued individually, or is queued in batch.",
    topic: "REST API",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 17 — REST & GraphQL API Features"
  },
  {
    question: "What are the four REST authentication types in Magento 2, and what ACL scope does each provide?",
    answer: "The four types are: Admin Token (Bearer header, grants admin role ACL permissions), Customer Token (Bearer header, grants access to 'self' resources only), Integration/OAuth 1.0a (OAuth signature header, uses a configured ACL resource list), and Guest/Anonymous (no header, accesses 'anonymous' resources only). Admin and customer tokens are obtained via POST endpoints, while integrations are configured in Admin > System > Integrations.",
    hint: "Each authentication method maps to a different scope of accessible resources.",
    topic: "REST Authentication",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 17 — REST & GraphQL API Features"
  },
  {
    question: "In webapi.xml, what is the difference between resource ref values 'anonymous', 'self', and a named ACL key?",
    answer: "'anonymous' means no authentication is required -- the endpoint is publicly accessible to guests. 'self' means the endpoint requires a customer token and is accessible only for the currently logged-in customer's own data. A named ACL key (like Magento_Catalog::products) requires an admin token or OAuth integration with that specific ACL permission. Admin ACL keys are defined in etc/acl.xml.",
    hint: "Each value represents a different level of access control for the endpoint.",
    topic: "REST API ACL",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 17 — REST & GraphQL API Features"
  },
  {
    question: "Where is the GraphQL schema file located in a Magento 2 module, and what directives are commonly used?",
    answer: "The GraphQL schema file is located at etc/schema.graphqls (directly in etc/, NOT in etc/graphql/). Key directives include: @resolver(class: \"...\") which points to the PHP resolver class, @doc(description: \"...\") for documentation visible in introspection, @cache(cacheIdentity: \"...\") for enabling FPC caching, and @deprecated(reason: \"...\") for marking fields as deprecated.",
    hint: "The file sits directly in the etc/ directory, not a subdirectory, and uses special annotations to connect schema to PHP code.",
    topic: "GraphQL",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 17 — REST & GraphQL API Features"
  },
  {
    question: "What is the method signature for a GraphQL resolver's resolve() method, and what does each parameter provide?",
    answer: "The signature is: resolve(Field $field, $context, ResolveInfo $info, array $value = null, array $args = null). $field provides schema field definition metadata, $context provides store context and customer auth info, $info provides AST info about the current query field, $value provides the parent resolver's resolved data (null at root level), and $args provides the arguments passed by the client in the query.",
    hint: "Five parameters provide everything the resolver needs: field metadata, request context, query structure, parent data, and client arguments.",
    topic: "GraphQL Resolvers",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 17 — REST & GraphQL API Features"
  },
  {
    question: "What is the critical difference between GraphQL GET and POST requests regarding caching?",
    answer: "GraphQL queries sent via HTTP GET are FPC-cacheable -- Varnish and Full-Page Cache can cache the response. However, this requires the @cache directive with a cacheIdentity class in the schema. GraphQL queries sent via POST are NEVER cached by FPC/Varnish. Mutations must always use POST, which correctly prevents caching of write operations. This is a frequently tested exam point.",
    hint: "The HTTP method used to send the query determines whether the response can be stored by the caching layer.",
    topic: "GraphQL Caching",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 17 — REST & GraphQL API Features"
  },
  {
    question: "How does schema stitching work in Magento 2 GraphQL?",
    answer: "Schema stitching allows multiple modules to add fields to the same GraphQL type by declaring type TypeName { newField: ... } in their own schema.graphqls files. When a second module declares type Product { custom_attribute: String }, the fields are merged with the original type at runtime -- it does not override the original. This enables modules to independently extend existing types without modifying the original schema file.",
    hint: "Declaring the same type name in a different module's schema file does not replace it -- it adds to it.",
    topic: "GraphQL Schema",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 17 — REST & GraphQL API Features"
  },
  {
    question: "Why must service classes in webapi.xml be interfaces in the Api/ directory rather than concrete classes?",
    answer: "The service class attribute in webapi.xml must reference an interface located in the Api/ directory, and the method must be declared on that interface -- not just the implementation. If a method exists only in the concrete class but not on the interface, it will NOT be exposed via REST. This enforces the service contract pattern and ensures proper API versioning and backward compatibility.",
    hint: "The declaration location and type of the class determine whether a method is exposed as an API endpoint.",
    topic: "REST API",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 17 — REST & GraphQL API Features"
  },
  {
    question: "What protocol does Magento 2 use for integration-based API authentication, and how does it differ from token-based auth?",
    answer: "Magento 2 integrations use OAuth 1.0a (NOT OAuth 2.0) for authentication. Integrations are created in Admin > System > Integrations and provide a Consumer Key, Consumer Secret, Access Token, and Access Token Secret. This differs from token-based auth where admin/customer tokens are obtained via POST to /V1/integration/admin/token or /V1/integration/customer/token and sent as Bearer tokens. OAuth is suitable for third-party system integrations.",
    hint: "The protocol version is a specific exam trap -- it's an older version than what many modern APIs use.",
    topic: "API Authentication",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 17 — REST & GraphQL API Features"
  },
  {
    question: "How does GraphQL authentication work in Magento 2, and how can a customer token be obtained via GraphQL?",
    answer: "GraphQL uses the same Bearer token mechanism as REST -- the Authorization: Bearer <token> header. A customer token can be obtained via the generateCustomerToken mutation, which accepts email and password and returns a token. The token can also be obtained via the REST endpoint POST /V1/integration/customer/token. In a resolver, you can check customer auth via $context->getExtensionAttributes()->getIsCustomer() and get the customer ID via $context->getUserId().",
    hint: "The authentication header format is identical to REST, but there is also a native GraphQL way to obtain tokens.",
    topic: "GraphQL Authentication",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 17 — REST & GraphQL API Features"
  },
  {
    question: "What is the default REST response format in Magento 2, and how do you request XML instead?",
    answer: "The default response format is JSON -- no special header is needed. To receive XML responses, you must send the Accept: application/xml header in your request. You can also send Content-Type: application/xml for XML request bodies. This is important because the format is controlled by request headers, not by changing the URL.",
    hint: "A specific HTTP header must be sent to change from the default format.",
    topic: "REST API",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 17 — REST & GraphQL API Features"
  },
  {
    question: "What are the five test types in Magento 2's multi-layer testing strategy, and which require a running Commerce instance?",
    answer: "The five types are Unit Tests (PHPUnit, fastest, no DI/DB), Integration Tests (real DI container and real DB), API Functional Tests (REST/GraphQL against live instance), MFTF (Selenium-driven browser UI tests), and Static Analysis (code inspection without running). MFTF and API Functional tests require a fully running Magento Commerce instance. Integration tests need a real DB but not a running web instance. Unit tests and static analysis need neither.",
    hint: "Two test types require a live web server, one needs only a database, and two need neither.",
    topic: "Testing Overview",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 18 — Testing Frameworks"
  },
  {
    question: "What is the ObjectManager test helper in unit tests, and what is the golden rule about mocking the SUT?",
    answer: "The ObjectManager test helper (Magento\\Framework\\TestFramework\\Unit\\Helper\\ObjectManager) instantiates the REAL class under test while injecting mock dependencies via constructor arguments -- without starting the DI container. The golden rule is: NEVER mock the System Under Test (SUT) itself -- only mock its dependencies. Mocking the SUT makes the test meaningless because you're testing the mock's behavior, not the real class's logic.",
    hint: "The helper creates a real instance of your class but lets you control what its dependencies return.",
    topic: "Unit Testing",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 18 — Testing Frameworks"
  },
  {
    question: "What does the @magentoDbIsolation annotation do in integration tests, and at what levels can it be set?",
    answer: "The @magentoDbIsolation enabled annotation wraps each test in a database transaction that is automatically rolled back after the test completes, ensuring test data doesn't persist. It can be set at the class level (applies to all test methods) or at the individual method level. The default for most integration tests is enabled. It works with @magentoDataFixture -- fixture data is also rolled back along with any data created during the test.",
    hint: "A database transaction wraps each test and is undone after completion.",
    topic: "Integration Testing",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 18 — Testing Frameworks"
  },
  {
    question: "What is the difference between @magentoDataFixture and @magentoApiDataFixture annotations?",
    answer: "@magentoDataFixture is used in integration tests and loads fixture PHP files to seed test data before a test runs. @magentoApiDataFixture (note the 'Api' prefix) is used in API functional tests that test REST/GraphQL endpoints against a running instance. The 'Api' prefix is critical -- using the wrong annotation in the wrong test type can cause failures. Both annotations reference plain PHP scripts that bootstrap objects via the ObjectManager.",
    hint: "The prefix in the annotation name indicates which test context it belongs to.",
    topic: "Test Annotations",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 18 — Testing Frameworks"
  },
  {
    question: "What are the three core XML components of MFTF tests, and what role does each serve?",
    answer: "The three components are: ActionGroup (reusable sequences of browser actions, like macros/functions, referenced by 'ref'), Test (a single test scenario with before/after hooks and sequential steps, can reference ActionGroups), and Suite (groups multiple tests together with shared setup/teardown). All MFTF components are defined in XML -- there is no PHP test code. Tests run via vendor/bin/mftf run:test <TestName>.",
    hint: "Think of these as reusable steps, individual scenarios, and grouped collections.",
    topic: "MFTF",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 18 — Testing Frameworks"
  },
  {
    question: "What issues can unit tests NOT detect that integration tests can?",
    answer: "Unit tests cannot detect DI misconfiguration (di.xml errors), plugin declaration issues, database schema problems, wrong interface mock behavior (since they use mocked dependencies), or performance issues like slow queries. Integration tests catch all of these because they use the real DI container, real database, and real configuration loading. However, integration tests are much slower than unit tests.",
    hint: "The lack of a real DI container and database in unit tests creates blind spots for certain types of issues.",
    topic: "Testing Strategy",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 18 — Testing Frameworks"
  },
  {
    question: "How do API functional tests differ from MFTF tests in terms of technology and requirements?",
    answer: "API functional tests are written in PHP, extend WebapiAbstract (REST/SOAP) or GraphQlAbstract (GraphQL), live in dev/tests/api-functional/, and test REST/GraphQL API responses. MFTF tests are XML-based, Selenium-driven, live in dev/tests/acceptance/, and simulate real browser interactions. Both require a running Magento instance, but MFTF additionally requires a browser driver (typically chromedriver). MFTF tests are the slowest type.",
    hint: "One tests API responses programmatically; the other automates a real web browser.",
    topic: "Testing Frameworks",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 18 — Testing Frameworks"
  },
  {
    question: "What is the phpcs --standard=Magento2 command used for, and how does the Magento2 standard differ from PSR-2?",
    answer: "The phpcs --standard=Magento2 command runs PHP CodeSniffer with the Magento 2 coding standard for static analysis. The Magento2 standard is a superset of PSR-2, adding Magento-specific rules like: no direct ObjectManager::getInstance() in business logic, proper use of __() for translations, no deprecated PHP functions, and proper class/method documentation. The auto-fixer counterpart is phpcbf --standard=Magento2.",
    hint: "The Magento standard extends a well-known PHP coding standard with framework-specific rules.",
    topic: "Static Analysis",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 18 — Testing Frameworks"
  },
  {
    question: "What database does integration testing use, and how is it configured?",
    answer: "Integration tests use a dedicated database named magento_integration_tests (by default), separate from the main Magento database. It is configured in dev/tests/integration/etc/install-config-mysql.php (copied from the .dist template). The configuration includes db-host, db-user, db-password, db-name, and admin credentials. This separation ensures tests don't corrupt production data.",
    hint: "A separate database instance prevents test operations from affecting the main application data.",
    topic: "Integration Testing",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 18 — Testing Frameworks"
  },
  {
    question: "Where do unit tests live in a Magento 2 module, and what class must they extend?",
    answer: "Unit tests live in the <Module>/Test/Unit/ directory (e.g., app/code/Vendor/Module/Test/Unit/Model/ProductTest.php). They must extend PHPUnit\\Framework\\TestCase. Test methods must either start with the 'test' prefix or have the @test annotation. setUp() runs before each test method (not once for the whole class). Unit tests use PHPUnit directly with no Magento bootstrap beyond a minimal autoloader.",
    hint: "The directory mirrors the module structure, and the base class comes from the testing framework, not Magento.",
    topic: "Unit Testing",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 18 — Testing Frameworks"
  },
  {
    question: "What are the valid types for the bin/magento dev:tests:run command, and which test types must be run differently?",
    answer: "Valid types include: unit, integration, integration-all, static, static-all, legacy, integrity, default, and all. Notably, 'acceptance' and 'api-functional' are NOT valid types. MFTF tests must be run via vendor/bin/mftf run:test <TestName>. API functional tests must be run directly via PHPUnit: vendor/bin/phpunit -c dev/tests/api-functional/phpunit_rest.xml.dist or phpunit_graphql.xml.dist.",
    hint: "Two test types cannot be run through the standard Magento CLI test runner and require their own tools.",
    topic: "Running Tests",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 18 — Testing Frameworks"
  },
  {
    question: "How do GraphQL test assertions differ from REST test assertions in API functional tests?",
    answer: "REST API functional tests extend WebapiAbstract and use $this->_webApiCall($serviceInfo, $arguments) where $serviceInfo contains REST resource path, HTTP method, and optionally SOAP service info. GraphQL tests extend GraphQlAbstract and use $this->graphQlQuery($query) where $query is a GraphQL query string. Both require a running Magento instance and use @magentoApiDataFixture for test data, but the assertion patterns differ based on the response format.",
    hint: "Each API type has its own abstract test class and helper method for making requests.",
    topic: "API Testing",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 18 — Testing Frameworks"
  },
  {
    question: "What are the key differences between Adobe Commerce Cloud Starter and Pro plans in terms of environments?",
    answer: "Starter has 4 environments total: 3 integration + 1 production, all single-server with NO high availability on any environment. Pro has 10+ environments: 8 integration (single-server) + 1 staging (3-node HA cluster) + 1 production (3-node HA cluster). Staging exists only on Pro -- Starter has no dedicated staging environment. Fastly CDN is only on production for Starter, but on both staging and production for Pro.",
    hint: "One plan has HA clusters and a dedicated staging environment; the other does not.",
    topic: "Cloud Architecture",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 19 — Cloud Architecture Overview"
  },
  {
    question: "Why does the build phase of Adobe Commerce Cloud have no database access, and what implications does this have?",
    answer: "The build phase creates a read-only deployable artifact and no services (DB, Redis, etc.) are available. This means any code requiring DB access will fail during build, setup:upgrade cannot run in the build phase, and DI compilation must work without database queries. Database migrations (setup:upgrade) must happen in the deploy phase instead. Composer install runs from composer.lock, and SCD is preferably done during build to avoid extending maintenance mode.",
    hint: "The build artifact is created in isolation from any backend services.",
    topic: "Cloud Deployment",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 19 — Cloud Architecture Overview"
  },
  {
    question: "What is the difference between running Static Content Deploy (SCD) in the build phase versus the deploy phase?",
    answer: "Running SCD during the build phase is the recommended best practice because it avoids extending the maintenance mode window -- the site stays in maintenance mode only for the essential deploy steps. Running SCD during the deploy phase means it executes while the site is in maintenance mode, resulting in longer downtime for visitors. The build phase is preferred since no database is needed for SCD generation.",
    hint: "The timing of static content generation directly affects how long the site is unavailable to customers.",
    topic: "Cloud Deployment",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 19 — Cloud Architecture Overview"
  },
  {
    question: "Which directories are writable at runtime on Adobe Commerce Cloud, and which are read-only?",
    answer: "Writable directories (configured as mounts) include: var/ (logs, cache, sessions, tmp), pub/media/ (uploaded images/files), pub/static/ (generated static files), and app/etc/ (env.php, config.php). Everything else -- including app/code/, vendor/, and app/design/ -- is read-only after build. On Pro HA environments, pub/media/ uses a shared NFS mount across all 3 nodes, while pub/static/ is NOT shared on NFS.",
    hint: "Only specific mounted directories can be written to; the codebase itself is locked down.",
    topic: "Cloud File System",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 19 — Cloud Architecture Overview"
  },
  {
    question: "What is the deployment trigger difference between integration, staging, and production environments on Pro?",
    answer: "Integration environments auto-deploy immediately on git push -- you can push directly to integration branches. Staging and production environments cannot receive direct git pushes -- you must use merge/promotion through the Cloud Console or magento-cloud CLI. The flow is: push to integration branch (auto-deploys) -> merge to staging (triggers build + deploy) -> promote to production (triggers build + deploy).",
    hint: "Only the development-tier environments accept direct code pushes.",
    topic: "Cloud Deployment",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 19 — Cloud Architecture Overview"
  },
  {
    question: "What is Fastly's role in the Adobe Commerce Cloud infrastructure stack, and on which environments is it available?",
    answer: "Fastly is a Varnish-based CDN that serves as the first layer of request handling -- requests hit Fastly before Nginx. It provides full-page caching, WAF (Web Application Firewall), DDoS protection, and image optimization. It uses surrogate cache keys (X-Magento-Tags) for granular tag-based cache invalidation. Fastly is available ONLY on staging and production environments (Pro), NOT on integration environments.",
    hint: "This CDN sits in front of everything and uses Magento's cache tags for smart invalidation.",
    topic: "Cloud Infrastructure",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 19 — Cloud Architecture Overview"
  },
  {
    question: "What are the three deployment hooks in .magento.app.yaml, and what service access does each have?",
    answer: "The three hooks are: build (no services available, no DB access, filesystem is writable, used for composer install, DI compilation, SCD), deploy (services available including DB, site is in maintenance mode, used for DB migrations/setup:upgrade, cache flush, config import), and post_deploy (site is back online/live, used for cache warming and smoke tests, failures here do NOT roll back the deployment).",
    hint: "Each phase has different access to infrastructure services and different implications for site availability.",
    topic: "Cloud Deployment",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 19 — Cloud Architecture Overview"
  },
  {
    question: "What is the role of Redis in the Adobe Commerce Cloud infrastructure, and why are two instances recommended?",
    answer: "Redis serves two roles: object cache (config, layout caches, FPC) and session storage. Two separate Redis instances are recommended -- one for cache and one for sessions -- to prevent session eviction during cache flushes. If a single instance is used, flushing the cache could also clear customer sessions, logging out users. The instances are defined in services.yaml and connected via relationships in .magento.app.yaml.",
    hint: "Combining cache and sessions in one instance creates a risk when cache operations occur.",
    topic: "Cloud Infrastructure",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 19 — Cloud Architecture Overview"
  },
  {
    question: "What happens when you try to install a module through the Magento Admin UI on Adobe Commerce Cloud?",
    answer: "It will fail because the application filesystem is read-only after build. You cannot write to app/code/ or vendor/ at runtime on Cloud. All code changes must go through the git -> build -> deploy cycle. Similarly, you cannot install modules via Composer at runtime. This is fundamentally different from on-premise Magento where the filesystem is fully writable. Custom code must be committed to the git repository.",
    hint: "The filesystem restriction after the build phase prevents any runtime code modifications.",
    topic: "Cloud File System",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 19 — Cloud Architecture Overview"
  },
  {
    question: "In Pro plan, what is the difference between pub/media/ and pub/static/ regarding NFS sharing across HA nodes?",
    answer: "On Pro HA environments (staging and production), pub/media/ uses a shared NFS mount -- all 3 nodes see the same uploaded files, ensuring consistency for user uploads and images. pub/static/ is NOT on shared NFS -- each node can generate its own static files, or they can be included in the build artifact. This distinction matters because media uploads must be immediately visible across all nodes, while static assets are deterministic and can be generated independently.",
    hint: "User-generated content needs cross-node visibility, but deterministic build output does not.",
    topic: "Cloud Architecture",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 19 — Cloud Architecture Overview"
  },
  {
    question: "What is the magento-cloud CLI tool, and how does it differ from regular git commands?",
    answer: "The magento-cloud CLI is the official command-line interface for managing Adobe Commerce on Cloud Infrastructure. It communicates with the Magento Cloud API and wraps Git operations. Unlike plain git commands, magento-cloud commands provision Cloud environments, trigger build/deploy pipelines, and manage platform resources. For example, environment:branch both creates a git branch AND provisions a Cloud environment, while git checkout -b only creates a local branch.",
    hint: "This CLI adds cloud infrastructure management on top of standard version control operations.",
    topic: "Cloud CLI",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 21 — Cloud CLI Tool"
  },
  {
    question: "What is the critical behavior of magento-cloud environment:push without the --force flag?",
    answer: "Without --force, environment:push will fail if there are uncommitted changes (staged or modified files) in the working tree. Untracked files are OK, but staged/modified files are not. This prevents accidentally excluding staged changes from the deployment. With --force, the working-tree cleanliness check is skipped. environment:push triggers the full build and deploy pipeline, not just a git push.",
    hint: "A safety check prevents deployment when the local code state doesn't match what will be pushed.",
    topic: "Cloud CLI",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 21 — Cloud CLI Tool"
  },
  {
    question: "How does magento-cloud environment:merge work, and what is a common misconception about it?",
    answer: "environment:merge always merges the current environment (child) into its parent -- you cannot specify an arbitrary target branch. The parent is set when environment:branch is run. For example, if the current branch is feature-x with parent staging, running environment:merge merges feature-x INTO staging. A common misconception is thinking you can specify any target, but the merge direction is always child to parent. It is a Cloud-side API-driven merge that triggers a new build/deploy on the parent.",
    hint: "The direction of the merge is determined by the parent-child relationship, not by command arguments.",
    topic: "Cloud CLI",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 21 — Cloud CLI Tool"
  },
  {
    question: "What do Cloud snapshots capture, and what is NOT included in a snapshot?",
    answer: "Snapshots capture the database dump (full mysqldump) and writable mounts (pub/media, var, etc.) as a point-in-time backup. They do NOT include application code -- code is managed by Git. snapshot:create should be run before any risky operation (upgrade, data migration) on staging or production. Snapshots can be restored to a different environment using the --target flag, which is useful for refreshing a feature branch with production data.",
    hint: "The backup includes data and user files but not the versioned codebase.",
    topic: "Cloud Snapshots",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 21 — Cloud CLI Tool"
  },
  {
    question: "What is the difference between magento-cloud tunnel:open and magento-cloud db:dump for accessing remote data?",
    answer: "tunnel:open forwards all relationship service ports (database, Redis, OpenSearch, etc.) to localhost, providing a live connection that local GUI tools (TablePlus, MySQL Workbench) can use to interact with Cloud services in real-time. db:dump is a one-time export that automatically opens an SSH tunnel, runs mysqldump, and downloads the SQL file to your local machine. The tunnel provides ongoing access; the dump is a snapshot at a moment in time.",
    hint: "One provides a persistent live connection; the other creates a static copy of the data.",
    topic: "Cloud CLI",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 21 — Cloud CLI Tool"
  },
  {
    question: "What is the difference between project-level and environment-level variables in Adobe Commerce Cloud?",
    answer: "Project-level variables (--level=project) are inherited by ALL environments in the project, providing default values. Environment-level variables (--level=environment) apply to only ONE specific environment and its children, and override project-level values. The default level if --level is omitted is environment. On Pro, variables set on staging do NOT automatically propagate to production -- you must set them separately per environment.",
    hint: "One scope affects everything, the other affects only a specific branch and its descendants.",
    topic: "Cloud Variables",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 21 — Cloud CLI Tool"
  },
  {
    question: "How does magento-cloud environment:branch differ from git checkout -b, and what additional actions does it perform?",
    answer: "environment:branch performs five actions that git checkout -b does not: it creates the local Git branch, pushes the branch to the Cloud remote, provisions a Cloud environment (infrastructure), sets the parent relationship in Cloud metadata, and triggers a build + deploy. A bare git checkout -b + git push only creates the branch on the remote but does not provision or activate the Cloud environment. Only environment:branch fully provisions the Cloud infrastructure.",
    hint: "The CLI command handles both version control and infrastructure provisioning in a single operation.",
    topic: "Cloud CLI",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 21 — Cloud CLI Tool"
  },
  {
    question: "What are the three variable prefixes available when setting Cloud variables, and what does each do?",
    answer: "No prefix: the variable is available as part of the $MAGENTO_CLOUD_VARIABLES JSON (base64-encoded). The 'env:' prefix injects the value as a plain OS environment variable (e.g., env:MY_VAR becomes $MY_VAR). The 'php:' prefix sets a PHP php.ini directive (e.g., php:memory_limit sets the memory_limit ini setting). These prefixes determine how the variable is exposed to the application.",
    hint: "Each prefix controls the mechanism through which the variable value is made available to the application.",
    topic: "Cloud Variables",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 21 — Cloud CLI Tool"
  },
  {
    question: "Where does magento-cloud ssh connect to, and how do you access the database from it?",
    answer: "magento-cloud ssh opens a shell in the PHP application container (PHP-FPM/CLI container), NOT the database container. The database container is not directly accessible via SSH. To access the database, use db:dump (one-time export), db:import (upload and import SQL), or tunnel:open (forwards service ports to localhost for live connections with local GUI tools). You can also run remote commands non-interactively with ssh \"command\".",
    hint: "SSH connects to the web application container, not to the data services directly.",
    topic: "Cloud CLI",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 21 — Cloud CLI Tool"
  },
  {
    question: "What do the magento-cloud mount:upload and mount:download commands do, and what restrictions apply?",
    answer: "mount:upload transfers files from local to a writable mount on the Cloud environment (local to remote), while mount:download transfers files from a Cloud mount to local (remote to local). Both use rsync over SSH. The --mount flag value must exactly match a mount path defined in .magento.app.yaml (e.g., pub/media). These commands only work with writable mounts (source: local), not with the read-only code directory. The --delete flag on upload enables rsync --delete behavior.",
    hint: "These file transfer commands work only with specific directories defined as writable mounts.",
    topic: "Cloud CLI",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 21 — Cloud CLI Tool"
  },
  {
    question: "What does magento-cloud environment:delete do by default, and what flag changes this behavior?",
    answer: "By default, environment:delete removes the Cloud environment (infrastructure) but does NOT delete the corresponding Git branch. To also delete the remote Git branch, you must specify the --delete-branch flag. You cannot delete the master/Production environment. The --yes flag skips the confirmation prompt. You can delete multiple environments at once by listing them: environment:delete env1 env2 env3.",
    hint: "The infrastructure and the code branch are treated as separate entities in the deletion process.",
    topic: "Cloud CLI",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 21 — Cloud CLI Tool"
  },
  {
    question: "How does the CLI resolve project context, and what happens when you run commands outside a project directory?",
    answer: "The CLI determines context in this order: 1) Explicit flags (--project=<id> --environment=<name>), 2) Git remote (reads .git/config for magento-cloud remote), 3) Current directory (traverses up to find project root), 4) Interactive prompt (asks user to select). If you run commands outside a cloned project directory without specifying --project, you get an error: 'No project found. Specify the project with --project.' You must either navigate to the project directory or use explicit flags.",
    hint: "The CLI tries multiple strategies to determine which project you're working with.",
    topic: "Cloud CLI",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 21 — Cloud CLI Tool"
  },
  {
    question: "What are the available Cloud log names, and how do you discover which logs exist for an environment?",
    answer: "Common log names include: app (application stdout/stderr), access (Nginx HTTP access log), error (Nginx error log), deploy (deployment log), php.access (PHP-FPM access log), and cron (cron job output). Use magento-cloud log --list to discover all available log names for the current environment. The log command streams logs like tail -f without requiring SSH access. You can use --lines=N to show a specific number of lines and --environment to target a specific environment.",
    hint: "A special flag lists all available log types, and streaming happens without manual SSH.",
    topic: "Cloud Logging",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 21 — Cloud CLI Tool"
  },
  {
    question: "What are the three YAML configuration files that define a Cloud project's infrastructure, and what does each control?",
    answer: ".magento.app.yaml is the primary application container definition controlling PHP version, hooks, mounts, crons, relationships, and workers. .magento/services.yaml defines available infrastructure services (MySQL, Redis, OpenSearch, RabbitMQ) with their types and disk allocations. .magento/routes.yaml defines URL routing rules -- how HTTP/HTTPS traffic is routed to the application or redirected. All three are version-controlled in git.",
    hint: "Three YAML files work together: one for the app, one for services, and one for URL routing.",
    topic: "Cloud Configuration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 20 — Cloud Setup & Configuration Files"
  },
  {
    question: "What is the critical difference between how .magento.env.yaml is managed on Pro versus Starter plans?",
    answer: "On Pro, .magento.env.yaml changes for staging and production are managed via the Cloud CLI (magento-cloud variable:create) or the Project Web UI -- NOT through git commits. Changes do not require a git commit. On Starter, .magento.env.yaml is committed directly to git and changes are applied by committing and pushing the file. Attempting to commit .magento.env.yaml on Pro and expecting it to change staging/production behavior is a common mistake.",
    hint: "The management method differs by plan -- one uses CLI/UI, the other uses version control.",
    topic: "Cloud Configuration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 20 — Cloud Setup & Configuration Files"
  },
  {
    question: "Why should you never manually edit app/etc/env.php in an Adobe Commerce Cloud environment?",
    answer: "app/etc/env.php is automatically generated by ECE-Tools during each deploy phase -- manual changes are overwritten on every deployment. Credentials are injected from MAGENTO_CLOUD_RELATIONSHIPS environment variable at deploy time. The file is not committed to git (it is in .gitignore). The correct approach is to use .magento.env.yaml variables (SESSION_CONFIGURATION, CACHE_CONFIGURATION, etc.) or environment-level variables to influence its generated content.",
    hint: "This file is regenerated from environment data during every deployment cycle.",
    topic: "Cloud Configuration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 20 — Cloud Setup & Configuration Files"
  },
  {
    question: "What are the three SCD-related variables in .magento.env.yaml, and how do they differ?",
    answer: "SCD_STRATEGY (quick/standard/compact) controls the deployment strategy -- 'quick' deploys per module (default), 'standard' per locale/theme, and 'compact' saves disk by symlinking shared files. SCD_ON_DEMAND (true/false) generates static files on first HTTP request rather than during deployment -- good for dev environments but bad for production due to first-request latency. SKIP_SCD (true/false) skips static content generation entirely -- the site will be broken if static files don't exist.",
    hint: "One controls how, one controls when, and one controls whether static content is generated at all.",
    topic: "SCD Configuration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 20 — Cloud Setup & Configuration Files"
  },
  {
    question: "Why does Redis NOT require a disk allocation in services.yaml while MySQL and OpenSearch do?",
    answer: "Redis is an in-memory data store -- it does not persist data to disk (at least not in the same way database services do). MySQL, OpenSearch, and RabbitMQ all require disk allocations because they persist data to disk storage. Specifying a disk value for Redis is unnecessary and may cause warnings. Additionally, service disk sizes can NEVER be decreased once set -- they can only be increased, so plan carefully.",
    hint: "The storage model of the service determines whether disk allocation is needed.",
    topic: "Cloud Services",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 20 — Cloud Setup & Configuration Files"
  },
  {
    question: "How do relationships in .magento.app.yaml connect the application to services defined in services.yaml?",
    answer: "The relationships section maps a local alias to a service endpoint. The format is local_alias: 'service_name:endpoint_name'. For example, 'database: mysql:mysql' maps the alias 'database' to the 'mysql' service's 'mysql' endpoint. Magento uses these aliases to find connection credentials via the MAGENTO_CLOUD_RELATIONSHIPS environment variable. If the alias doesn't match what Magento expects, connections fail.",
    hint: "A mapping connects application-level service names to the infrastructure services defined elsewhere.",
    topic: "Cloud Configuration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 20 — Cloud Setup & Configuration Files"
  },
  {
    question: "What are workers in .magento.app.yaml, and how do they differ from CRON_CONSUMERS_RUNNER?",
    answer: "Workers are dedicated always-running daemon processes in their own container, separate from the web container. They are the preferred Cloud-native approach for message queue consumers and auto-restart on crash. CRON_CONSUMERS_RUNNER (configured in .magento.env.yaml) runs consumers via cron triggers on a schedule. When using workers, you should set cron_run: false in CRON_CONSUMERS_RUNNER to avoid conflicts. Workers do NOT serve HTTP requests.",
    hint: "One runs continuously in its own container; the other is triggered by the scheduler.",
    topic: "Cloud Workers",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 20 — Cloud Setup & Configuration Files"
  },
  {
    question: "In routes.yaml, what must the upstream value exactly match, and what does {default} represent?",
    answer: "The upstream value format is app_name:http, where app_name must exactly match the name: field in .magento.app.yaml. A mismatch causes routing failures. The {default} placeholder is automatically replaced with the primary domain of the environment -- in production it becomes example.com, in staging/integration it becomes something like branch-name.abc123.us-4.magentosite.cloud. Route types are either 'upstream' (send to app) or 'redirect' (HTTP redirect).",
    hint: "The routing configuration references the application by name and uses a dynamic domain placeholder.",
    topic: "Cloud Routing",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 20 — Cloud Setup & Configuration Files"
  },
  {
    question: "Why should sessions use a different Redis database number than cache in Cloud environments?",
    answer: "Sessions should use a separate Redis database number (e.g., database 2) from cache (databases 0 and 1) to prevent cache flushes from clearing customer sessions and logging out users. When Magento flushes the cache (e.g., during deployment or admin cache management), if sessions share the same Redis database, all session data would also be wiped. Using separate databases (or better yet, separate Redis instances) provides complete isolation.",
    hint: "A cache management operation could have unintended side effects on user authentication state.",
    topic: "Cloud Session Config",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 20 — Cloud Setup & Configuration Files"
  },
  {
    question: "What are the four stage scopes in .magento.env.yaml, and how does the global scope interact with the others?",
    answer: "The four stage scopes are: global (applied to all stages), build (applied only during build hook), deploy (applied during deploy hook), and post_deploy (applied during post-deploy hook). Variables set in the global scope serve as defaults for all stages. Stage-specific settings override global settings. For example, SCD_ON_DEMAND set in global applies everywhere, but setting it differently in the build stage would override just for build.",
    hint: "One scope acts as a default for all phases, while the others target specific deployment phases.",
    topic: "Cloud Configuration",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 20 — Cloud Setup & Configuration Files"
  },
  {
    question: "What happens if a developer puts setup:upgrade in the build hook instead of the deploy hook?",
    answer: "It will fail because services (database) are not available during the build hook. The setup:upgrade command requires database access to run migrations, check schema versions, and apply data patches. Database operations must go in the deploy hook, where services are available and the site is in maintenance mode. The build hook is only for operations that don't need services: composer install, DI compilation, and SCD generation.",
    hint: "A command that needs to read and write to the database cannot run in a phase without database access.",
    topic: "Cloud Deployment",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 20 — Cloud Setup & Configuration Files"
  },
  {
    question: "How do sensitive variables work in Adobe Commerce Cloud, and what makes them different from regular variables?",
    answer: "Sensitive variables are created with --sensitive true and become write-only after being set -- you cannot retrieve the value via CLI or UI, only overwrite or delete them. They are never stored in git regardless of where .magento.env.yaml is managed. You can also control their visibility during build (--visible-build) and runtime (--visible-runtime). Regular variables can be read back at any time. Sensitive variables are ideal for API keys, passwords, and other secrets.",
    hint: "Once created, the value becomes unreadable -- it can only be replaced or removed.",
    topic: "Cloud Variables",
    examCode: "AD0-E724",
    studyNoteTitle: "Day 20 — Cloud Setup & Configuration Files"
  }
];

async function main() {
  console.log("Seeding AD0-E724 flashcards...");
  let created = 0;
  let skipped = 0;

  for (const fc of flashcards) {
    const studyNote = await prisma.studyNote.findFirst({
      where: { title: fc.studyNoteTitle, certCode: "AD0-E724" }
    });

    if (!studyNote) {
      console.log(`  ⚠ Study note not found: ${fc.studyNoteTitle}`);
      skipped++;
      continue;
    }

    const existing = await prisma.flashcard.findFirst({
      where: { question: fc.question, studyNoteId: studyNote.id }
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.flashcard.create({
      data: {
        question: fc.question,
        answer: fc.answer,
        hint: fc.hint,
        topic: fc.topic,
        examCode: fc.examCode,
        studyNoteId: studyNote.id
      }
    });
    created++;
  }

  console.log(`Done! Created: ${created}, Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
