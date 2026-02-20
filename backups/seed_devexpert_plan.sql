BEGIN;

-- ============================================================
-- 1. Remove all tasks scheduled from Feb 20 onwards
-- ============================================================
DELETE FROM "Task" WHERE "scheduledDate" >= '2026-02-20 00:00:00';

-- ============================================================
-- 2. Create 3 weekly sub-goals under "Pass Adobe Commerce Developer Expert"
--    Parent goal id: cmlfw506f0004p30631yrhq8r
-- ============================================================
INSERT INTO "Goal" (id, title, description, type, "startDate", "endDate", progress, "parentId", category, "createdAt", "updatedAt") VALUES
(
  'devex-week1-architecture-2026',
  'Week 1 — Architecture',
  'Focus: Caching, components, multi-site, security, CRON, indexing. Feb 20–26.',
  'WEEKLY'::"GoalType",
  '2026-02-20 00:00:00',
  '2026-02-26 23:59:59',
  0,
  'cmlfw506f0004p30631yrhq8r',
  'Adobe Commerce Certification',
  NOW(), NOW()
),
(
  'devex-week2-customizations-2026',
  'Week 2 — Customizations',
  'Focus: Catalog, Checkout, Entities, Admin, APIs, Message Queues, Tests. Feb 27–Mar 5.',
  'WEEKLY'::"GoalType",
  '2026-02-27 00:00:00',
  '2026-03-05 23:59:59',
  0,
  'cmlfw506f0004p30631yrhq8r',
  'Adobe Commerce Certification',
  NOW(), NOW()
),
(
  'devex-week3-cloud-review-2026',
  'Week 3 — External Integrations + Cloud + Review',
  'Focus: SaaS Services, App Builder, I/O Events, Cloud Architecture, Cloud CLI, Practice Exam. Mar 6–12.',
  'WEEKLY'::"GoalType",
  '2026-03-06 00:00:00',
  '2026-03-12 23:59:59',
  0,
  'cmlfw506f0004p30631yrhq8r',
  'Adobe Commerce Certification',
  NOW(), NOW()
);

-- ============================================================
-- 3. Insert 21 daily tasks
-- ============================================================
INSERT INTO "Task" (id, title, description, status, priority, "scheduledDate", "estimatedMinutes", "goalId", "createdAt", "updatedAt") VALUES

-- ---- WEEK 1 ------------------------------------------------

(
  'devex-task-day01-cache-arch',
  'Day 1 — Cache Architecture',
  'Topic: Cache Architecture
• Full Page Cache (FPC): Varnish integration, hole-punching, ESI blocks
• Block cache: cache tags, identifiers, _loadCache / _saveCache
• Cache types: config, layout, block_html, collections, reflection, db_ddl, compiled_config, eav, customer_notification, full_page, translate, config_integration, config_integration_api, config_webservice
• Redis as cache backend vs session storage
• Cache invalidation strategies: tags, clean all, flush

Practice (15 min): Run bin/magento cache:status, experiment with enabling/disabling specific cache types. Compare FPC behavior with Varnish on EE vs Nginx on CE.',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-02-20 09:00:00',
  90,
  'devex-week1-architecture-2026',
  NOW(), NOW()
),

(
  'devex-task-day02-components',
  'Day 2 — Components: Plugins, Preferences, Observers',
  'Topic: Components — Plugins, Preferences, Observers
• Plugins (Interceptors): before, around, after — execution order, sortOrder, $proceed, limitations (finals, non-public, static)
• Preferences (DI): di.xml preference vs virtual types, constructor injection, interface binding
• Observers/Events: events.xml, shared vs non-shared, when to use observer vs plugin
• Virtual Types: creating specialized instances without new classes
• Compilation: bin/magento setup:di:compile — what it generates and why

Practice (20 min): Write a simple around plugin on a core method. Observe order when two plugins target the same method. Dispatch a custom event and observe it.

Key exam angle: Know when to use each — prefer plugins for public method interception, observers for event-based decoupling.',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-02-21 09:00:00',
  120,
  'devex-week1-architecture-2026',
  NOW(), NOW()
),

(
  'devex-task-day03-multisite',
  'Day 3 — Multi-site / Multi-store Architecture',
  'Topic: Multi-site / Multi-store Architecture
• Hierarchy: Global → Website → Store → Store View
• Config scopes and how they cascade
• Multiple websites on a single instance: MAGE_RUN_CODE / MAGE_RUN_TYPE, nginx/Apache config
• Shared vs isolated resources (catalog, customers, orders)
• URL handling: different domains per website, base URLs per scope
• Constraints: shared DB tables, indexer scope, cache scope

Practice (15 min): On local CE, create a second website/store. Observe how configuration scoping works in admin (Use Default / Use Website).',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-02-22 09:00:00',
  90,
  'devex-week1-architecture-2026',
  NOW(), NOW()
),

(
  'devex-task-day04-patches',
  'Day 4 — Git Patches & Composer File-level Modifications',
  'Topic: Git Patches & Composer File-level Modifications
• Creating patches: git diff → .patch files, applying with git apply
• Composer patches: cweagans/composer-patches, patches key in composer.json
• Patch application order and conflicts
• File-level modifications via Composer (when patching is not possible)
• composer.lock — why it matters in deployments
• Quality patches: magento/quality-patches tool, MDVA patches

Key exam angle: Know the difference between a quality patch (MDVA) and a custom composer patch, and when each is appropriate.',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-02-23 09:00:00',
  60,
  'devex-week1-architecture-2026',
  NOW(), NOW()
),

(
  'devex-task-day05-security',
  'Day 5 — Adobe Commerce Security Features',
  'Topic: Adobe Commerce Security Features
• CSP (Content Security Policy): csp_whitelist.xml, report-only vs enforcement mode, nonces
• Output escaping: escapeHtml(), escapeUrl(), escapeJs(), escapeHtmlAttr() — when to use which
• Form keys: CSRF protection, FormKey class, validation in controllers
• Input sanitization: filter_var, DOMPurify on frontend, server-side validation
• reCAPTCHA: v2 invisible, v2 checkbox, v3 — configuration per form type
• Input validation: Zend_Validate / Laminas\Validator, ACL, admin resource permissions
• Secure headers: X-Frame-Options, HSTS, X-Content-Type-Options

Practice (10 min): Check CSP headers on local EE vs CE. Inspect csp_whitelist.xml for a known extension.',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-02-24 09:00:00',
  90,
  'devex-week1-architecture-2026',
  NOW(), NOW()
),

(
  'devex-task-day06-cron',
  'Day 6 — CRON Scheduling System',
  'Topic: CRON Scheduling System
• crontab.xml — group, job, schedule expression
• CRON groups: default vs index — separate process pools
• How Magento scheduler works: cron_schedule table, generate, cleanup, run
• bin/magento cron:run vs system crontab entries (two cron jobs required)
• Missed jobs: history_cleanup_after, use_separate_process
• Debugging: cron_schedule table status values (pending, running, success, error, missed)

Key exam angle: Know what happens if cron does not run and how to recover. Know the two required crontab lines.',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-02-25 09:00:00',
  60,
  'devex-week1-architecture-2026',
  NOW(), NOW()
),

(
  'devex-task-day07-indexing',
  'Day 7 — Indexing System + Week 1 Review',
  'Topic: Indexing System
• Indexer modes: Update on Save vs Update by Schedule (changelog/mview)
• mview.xml — subscriptions, changelog tables, cl suffix
• indexer.xml — dependencies between indexers
• Key indexers: catalog_product_price, catalog_product_flat, catalogsearch_fulltext, inventory
• bin/magento indexer:reindex, indexer:reset, indexer:status
• Flat catalog: when to enable, performance tradeoffs
• Partial vs full reindex — what triggers each

Practice (15 min): Change an indexer to "Update by Schedule." Modify a product. Check the changelog table. Run bin/magento indexer:reindex and observe timing differences.

Week 1 Review (10 min): Glance back at notes from Days 1–7, flag any gaps.',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-02-26 09:00:00',
  90,
  'devex-week1-architecture-2026',
  NOW(), NOW()
),

-- ---- WEEK 2 ------------------------------------------------

(
  'devex-task-day08-catalog',
  'Day 8 — Catalog Customization',
  'Topic: Catalog Customization
• EAV architecture: attribute sets, attribute groups, entity types, eav_attribute table
• Custom product attributes: InstallData, source models, backend models, frontend models
• Product types: Simple, Configurable, Grouped, Bundle, Downloadable, Virtual — extension points for each
• Custom product type: product_types.xml, type model, price model
• Category attributes and flat catalog implications
• Price modifiers: custom price calculation, tier pricing, special price
• Layered navigation: custom filters, source model with getAllOptions()

Practice (20 min): Add a custom product attribute with a source model. Verify it appears on the frontend via a custom template. Compare attribute behavior on CE vs EE (staging).',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-02-27 09:00:00',
  120,
  'devex-week2-customizations-2026',
  NOW(), NOW()
),

(
  'devex-task-day09-checkout',
  'Day 9 — Checkout & Sales Customization',
  'Topic: Checkout & Sales Customization
• Checkout flow: JS layout (checkout_index_index.xml), layoutProcessors, jsLayout array
• Adding a custom step or field to checkout
• Quote → Order lifecycle: CartManagementInterface, OrderManagementInterface
• Custom totals: sales.xml, total collector, collect() / fetch()
• Payment method integration: MethodInterface, config_payment.xml, offline vs online
• Shipping method: AbstractCarrier, collectRates(), shipping origin, allowed countries
• Order status and state machine: custom statuses, transitions
• Sales rule (cart price rule) customization: custom conditions, custom actions

Practice (20 min): Add a custom field to the checkout address form. Verify it saves to the quote and transfers to the order.',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-02-28 09:00:00',
  120,
  'devex-week2-customizations-2026',
  NOW(), NOW()
),

(
  'devex-task-day10-entities',
  'Day 10 — Entity Types: Programmatic Manipulation',
  'Topic: Entity Types — Programmatic Manipulation
• Service Contracts: Repository pattern, SearchCriteriaBuilder, FilterBuilder
• Custom repositories: implementing RepositoryInterface with collection
• Extension Attributes: extension_attributes.xml, join directives, ExtensionAttributesInterface
• Custom entities (non-EAV): flat table, model + resource model + collection
• DataObject vs generated extension interfaces
• Mass actions: batch processing, chunking large datasets
• SearchResultsInterface — proper pagination

Practice (15 min): Use SearchCriteriaBuilder to query products with multiple filters. Inspect the generated SQL.',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-03-01 09:00:00',
  90,
  'devex-week2-customizations-2026',
  NOW(), NOW()
),

(
  'devex-task-day11-admin',
  'Day 11 — Admin Panel Customization',
  'Topic: Admin Panel Customization
• UI Components: listing (grid), form, fieldset, field — XML declaration
• Custom admin grid: data provider, di.xml collection, bookmarks, filters, mass actions
• Custom admin form: fieldsets, custom fields, custom UI component types
• @magento/ui-components JS: observable, uiElement, uiCollection
• Admin routing: routes.xml, adminhtml area, controller ACL
• ACL: acl.xml, resource tree, _isAllowed()
• Admin notifications and in-admin messaging

Practice (15 min): Create a minimal custom admin grid for a custom entity. Verify ACL restriction works.',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-03-02 09:00:00',
  90,
  'devex-week2-customizations-2026',
  NOW(), NOW()
),

(
  'devex-task-day12-apis',
  'Day 12 — API Customization (REST + GraphQL)',
  'Topic: API Customization
• REST API: webapi.xml, resource/method mapping, ACL resources
• Custom REST endpoints: interface + implementation + DI binding
• GraphQL: schema.graphqls, resolvers, ResolverInterface, context, caching (ScopeProvider)
• Extension Attributes on APIs — serialization/deserialization
• API versioning: /V1/ routing, interface versioning best practices
• Asynchronous APIs: bulk endpoints, async.magento.catalog.product.save
• Input validation on API: @throws, validator interfaces

Practice (15 min): Create a custom REST endpoint with ACL. Test with cURL. Add an extension attribute to the product API response.',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-03-03 09:00:00',
  90,
  'devex-week2-customizations-2026',
  NOW(), NOW()
),

(
  'devex-task-day13-queues',
  'Day 13 — Message Queues',
  'Topic: Message Queues
• Architecture: publisher → topic → queue → consumer
• queue_topology.xml, queue_publisher.xml, queue_consumer.xml
• AMQP (RabbitMQ) vs MySQL queue (db connection type) — CE vs EE
• Creating a new queue: full wiring from publisher to consumer handler
• Existing core queues: inventory reservations, async orders, async API
• Consumer execution: bin/magento queue:consumers:start, --max-messages, --batch-size
• Error handling: dead letter queues, retry logic
• Cloud: consumers managed via workers: in .magento.app.yaml

Practice (20 min): Implement a simple publisher + consumer on local. Use MySQL queue adapter (CE). Verify message flows end-to-end.',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-03-04 09:00:00',
  90,
  'devex-week2-customizations-2026',
  NOW(), NOW()
),

(
  'devex-task-day14-integration-tests',
  'Day 14 — Integration Tests + Week 2 Review',
  'Topic: Integration Tests
• dev/tests/integration structure — test bootstrap, fixtures
• @magentoDataFixture — fixture files and closure fixtures
• @magentoAppIsolation, @magentoDbIsolation — when each is needed
• @magentoConfigFixture — overriding config values per test
• ObjectManager::getInstance() in tests — correct pattern
• Running integration tests: phpunit -c dev/tests/integration/phpunit.xml
• Difference: Unit test (no framework) vs Integration (full bootstrap) vs MFTF (browser)

Key exam angle: Know fixture annotations and isolation annotations cold — these appear frequently in exam questions.

Week 2 Review (15 min): Write down any customization areas that felt unclear.',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-03-05 09:00:00',
  60,
  'devex-week2-customizations-2026',
  NOW(), NOW()
),

-- ---- WEEK 3 ------------------------------------------------

(
  'devex-task-day15-saas',
  'Day 15 — External Integrations: SaaS Services & Data Flow',
  'Topic: External Integrations — SaaS Services & Data Flow
• Adobe Commerce SaaS services: Catalog Service, Product Recommendations, Live Search
• Data sync mechanism: SaaSExport modules, FeedInterface, cron-based sync
• Customizing feed data: plugins on exporters, custom feed attributes
• catalog-export pipeline: what data flows to SaaS and how to extend it
• ScpeSaas — storefront services connector configuration
• API Mesh (Adobe API Mesh): purpose, GraphQL mesh, transformation rules
• Commerce Eventing for SaaS triggers',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-03-06 09:00:00',
  90,
  'devex-week3-cloud-review-2026',
  NOW(), NOW()
),

(
  'devex-task-day16-appbuilder',
  'Day 16 — App Builder',
  'Topic: App Builder
• App Builder architecture: Runtime actions (serverless), Files, State (key-value), Events
• Adobe I/O Runtime: action invocation, web actions vs non-web actions, sequences
• Commerce + App Builder integration patterns: sync vs async, webhooks vs polling
• aio CLI: project init, app deploy, app run (local dev)
• Security: JWT auth, IMS tokens, OAuth 2.0 server-to-server
• Extensibility SDK: @adobe/commerce-sdk-react, Admin UI SDK
• Use cases: custom order management UI, extended admin panels, async integrations

Resources: developer.adobe.com/app-builder | developer.adobe.com/commerce/extensibility/',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-03-07 09:00:00',
  90,
  'devex-week3-cloud-review-2026',
  NOW(), NOW()
),

(
  'devex-task-day17-io-events',
  'Day 17 — Adobe I/O Events & Webhooks',
  'Topic: Adobe I/O Events & Webhooks
• Adobe I/O Events: event registration, event subscriptions in developer console
• Commerce Eventing module: io_events.xml, event registration, custom events
• bin/magento events:list, events:info, events:subscribe
• Webhooks (Commerce native): webhooks.xml, synchronous webhooks (before/after), hook payload modification
• Difference: I/O Events (async, fire-and-forget) vs Webhooks (sync, can modify response)
• Testing: webhook test from admin, event simulation with aio CLI',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-03-08 09:00:00',
  60,
  'devex-week3-cloud-review-2026',
  NOW(), NOW()
),

(
  'devex-task-day18-cloud-arch',
  'Day 18 — Adobe Commerce Cloud Architecture',
  'Topic: Adobe Commerce Cloud Architecture
• Infrastructure: Fastly CDN, Varnish, Nginx, PHP-FPM, Redis, Elasticsearch/OpenSearch, RabbitMQ
• Environment types: Integration (dev branches), Staging, Production
• Pro vs Starter architecture differences (Pro has dedicated staging/prod, HA)
• Git-based workflow: push to branch → deploy pipeline
• Read-only filesystem: writable mounts (mounts: in .magento.app.yaml)
• Services: .magento/services.yaml — defining Redis, OpenSearch, RabbitMQ
• Routes: .magento/routes.yaml — upstream, redirects, cache rules
• Application: .magento.app.yaml — hooks (build/deploy/post_deploy), workers, crons, disk

Practice (15 min): Review your local EE instance config against a Cloud .magento.app.yaml example. Spot differences.',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-03-09 09:00:00',
  90,
  'devex-week3-cloud-review-2026',
  NOW(), NOW()
),

(
  'devex-task-day19-cloud-cli',
  'Day 19 — Cloud Setup, Configuration & CLI',
  'Topic: Cloud Setup, Configuration & CLI
• magento-cloud CLI: login, project:list, environment:list, ssh, db:dump, environment:push
• ece-tools: build/deploy hooks, cloud:build, cloud:deploy, cloud:post-deploy
• Environment variables: MAGENTO_CLOUD_VARIABLES, env: prefix vs global
• SCD (Static Content Deploy): strategies (compact, quick, standard), SCD_ON_DEMAND
• Deployment pipeline phases: Build (no services) → Deploy (maintenance) → Post-deploy
• Zero-downtime deploy: warm cache in post-deploy hook
• Patches on Cloud: ece-tools QUALITY_PATCHES env var, m2-hotfixes/ directory
• Fastly configuration: VCL snippets, image optimization, WAF, TLS/SSL',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-03-10 09:00:00',
  90,
  'devex-week3-cloud-review-2026',
  NOW(), NOW()
),

(
  'devex-task-day20-practice-exam',
  'Day 20 — Full Practice Exam Day',
  'Full Practice Exam Day
• Take a full-length practice exam (timed, 40–50 questions, ~90 min)
  - Use Adobe official sample questions if available
  - Supplement with Whizlabs / MeasureUp / ExamTopics AD0-E725
• After exam: review every wrong answer — understand WHY, not just the right answer
• Map wrong answers back to exam sections — identify your weakest section
• Write 5–10 bullet points of things to re-read tonight or tomorrow

After review: Re-read the Adobe Commerce Technical Guidelines doc (skim — confirm you know coding standards they test on).
https://developer.adobe.com/commerce/php/coding-standards/technical-guidelines/',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-03-11 09:00:00',
  120,
  'devex-week3-cloud-review-2026',
  NOW(), NOW()
),

(
  'devex-task-day21-light-review',
  'Day 21 — Light Review + Exam Prep (Day before exam)',
  'Light Review + Prep — Day before exam (Mar 13 at 8:20am)
• Review your gap list from Day 20 — focus only on identified weak spots
• Re-read the section weight table — mentally allocate exam time:
  - Architecture: ~14 questions (38%)
  - Customizations: ~12 questions (32%)
  - Cloud: ~6 questions (16%)
  - External Integrations: ~5 questions (14%)
• Review plugin/observer/preference decision tree (high-frequency topic)
• Review cache type list and indexer modes (frequently tested details)
• Set alarm. Lay out water, snacks for exam morning.
• No new topics. Rest.',
  'PENDING'::"TaskStatus",
  'HIGH'::"TaskPriority",
  '2026-03-12 09:00:00',
  60,
  'devex-week3-cloud-review-2026',
  NOW(), NOW()
);

COMMIT;
