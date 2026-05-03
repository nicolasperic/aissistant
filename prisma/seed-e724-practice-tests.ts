import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding AD0-E724 Developer Professional practice tests...");

  // ─── Certification ─────────────────────────────────────────────────────────

  const cert = await prisma.certification.upsert({
    where: { id: "cert-ad0-e724" },
    update: {},
    create: {
      id: "cert-ad0-e724",
      name: "Adobe Commerce Developer Professional",
      code: "AD0-E724",
      provider: "Adobe",
      description:
        "Validates foundational expertise in Adobe Commerce development including module creation, architecture, customization, catalog management, cloud deployment, and API development.",
      totalQuestions: 50,
      passingScore: 39,
      timeLimitMinutes: 100,
    },
  });

  // ─── Sections ──────────────────────────────────────────────────────────────

  const [secArch, secModule, secCatalog, secFrontend, secSetup, secCloud] =
    await Promise.all([
      prisma.certSection.upsert({
        where: { id: "sec724-arch" },
        update: { name: "Architecture & Core", percentage: 26 },
        create: { id: "sec724-arch", certificationId: cert.id, name: "Architecture & Core", percentage: 26 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec724-module" },
        update: { name: "Module Development", percentage: 18 },
        create: { id: "sec724-module", certificationId: cert.id, name: "Module Development", percentage: 18 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec724-catalog" },
        update: { name: "Catalog & Products", percentage: 14 },
        create: { id: "sec724-catalog", certificationId: cert.id, name: "Catalog & Products", percentage: 14 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec724-frontend" },
        update: { name: "Frontend & Themes", percentage: 14 },
        create: { id: "sec724-frontend", certificationId: cert.id, name: "Frontend & Themes", percentage: 14 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec724-setup" },
        update: { name: "Store Setup & Marketing", percentage: 8 },
        create: { id: "sec724-setup", certificationId: cert.id, name: "Store Setup & Marketing", percentage: 8 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec724-cloud" },
        update: { name: "Cloud & Security", percentage: 20 },
        create: { id: "sec724-cloud", certificationId: cert.id, name: "Cloud & Security", percentage: 20 },
      }),
    ]);

  // ─── Upsert helper ─────────────────────────────────────────────────────────

  async function upsertQuestion(data: {
    id: string;
    text: string;
    type: "SINGLE" | "MULTIPLE";
    sectionId: string;
    explanation: string;
    options: { id: string; text: string; isCorrect: boolean }[];
  }) {
    const q = await prisma.question.upsert({
      where: { id: data.id },
      update: {
        text: data.text, type: data.type,
        explanation: data.explanation, certSectionId: data.sectionId,
      },
      create: {
        id: data.id, certificationId: cert.id, certSectionId: data.sectionId,
        text: data.text, type: data.type, source: "OFFICIAL", explanation: data.explanation,
      },
    });
    for (const opt of data.options) {
      await prisma.questionOption.upsert({
        where: { id: opt.id },
        update: { text: opt.text, isCorrect: opt.isCorrect },
        create: { id: opt.id, questionId: q.id, text: opt.text, isCorrect: opt.isCorrect },
      });
    }
    return q;
  }

  // ─── 50 Official Questions ─────────────────────────────────────────────────

  const off: ReturnType<typeof upsertQuestion>[] = [];

  // Q1 — Module Development
  off.push(upsertQuestion({
    id: "q-e724-001", type: "SINGLE", sectionId: secModule.id,
    text: "During implementation the ProductEnahnced module Developer was needed to create ViewModel to render additional product information on the store front.\nWhat is the correct structure of defining ViewModel in the page layout xml file?",
    explanation: "To inject a ViewModel into a block via layout XML, use `` with the ViewModel class name. The `` syntax is for arrays, and `` is deprecated in favor of arguments.",
    options: [
      { id: "q-e724-001-a", text: "\n\n\n\nVendorName\\ProductEnahnced\\ViewModel\\ExampleViewModel\n\n\n\n", isCorrect: false },
      { id: "q-e724-001-b", text: "\n\n\n\nVendorName\\ProductEnahnced\\ViewModel\\ExampleViewModel\n\n\n\n", isCorrect: true },
      { id: "q-e724-001-c", text: "\n\n\n\nVendorName\\ProductEnahnced\\ViewModel\\ExampleViewModel\n\n\n\n", isCorrect: false },
    ],
  }));

  // Q2 — Catalog & Products
  off.push(upsertQuestion({
    id: "q-e724-002", type: "SINGLE", sectionId: secCatalog.id,
    text: "What does an attribute set define in Adobe Commerce?",
    explanation: "An attribute set defines the collection of attributes that can be assigned to products. It groups related attributes together (e.g., a 'Clothing' attribute set includes Size, Color, Material). It does not define product types, prices, or customer roles.",
    options: [
      { id: "q-e724-002-a", text: "The type of customer role within the admin panel", isCorrect: false },
      { id: "q-e724-002-b", text: "The specific product types available for a store", isCorrect: false },
      { id: "q-e724-002-c", text: "The collection of attributes that can be assigned to products", isCorrect: true },
      { id: "q-e724-002-d", text: "The rules for managing product prices", isCorrect: false },
    ],
  }));

  // Q3 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e724-003", type: "SINGLE", sectionId: secArch.id,
    text: "Which command should a Developer use to run cron from the command line for the index group?",
    explanation: "The correct command to run cron for a specific group is `bin/magento cron:run --group index` (singular `--group`, not `--groups`). The cron group name follows the `--group` flag directly.",
    options: [
      { id: "q-e724-003-a", text: "bin/magento cron:run --groups index", isCorrect: false },
      { id: "q-e724-003-b", text: "bin/magento run:cron --groups index", isCorrect: false },
      { id: "q-e724-003-c", text: "bin/magento cron:run --group index", isCorrect: true },
      { id: "q-e724-003-d", text: "bin/magento cron:execute --group index", isCorrect: false },
    ],
  }));

  // Q4 — Store Setup & Marketing
  off.push(upsertQuestion({
    id: "q-e724-004", type: "SINGLE", sectionId: secSetup.id,
    text: "A Developer wants to change the root category for a frontend store.\nWhat should the Developer do to achieve this goal?",
    explanation: "To change the root category for a frontend store, navigate to Stores > All Stores > select the Store > Root Category dropdown. The root category is configured at the store level, not in the configuration settings.",
    options: [
      { id: "q-e724-004-a", text: "Store  >  Configuration (Store View)  >  General  >  Web  >  Root Category", isCorrect: false },
      { id: "q-e724-004-b", text: "Store  >  Configuration (Store View)  >  General  >  General  >  Root Category", isCorrect: false },
      { id: "q-e724-004-c", text: "Store  >  All Configuration  >  Select the Store  >  Root Category", isCorrect: true },
    ],
  }));

  // Q5 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e724-005", type: "SINGLE", sectionId: secArch.id,
    text: "Where does the entry point exist for the adminhtml area?",
    explanation: "The entry point for all Adobe Commerce areas (including adminhtml) is `pub/index.php`. There is a single entry point for all requests — the front controller in `pub/index.php` determines the area based on the URL and routes accordingly.",
    options: [
      { id: "q-e724-005-a", text: "pub/index.php", isCorrect: true },
      { id: "q-e724-005-b", text: "public/index.php", isCorrect: false },
      { id: "q-e724-005-c", text: "adminhtml/index.php", isCorrect: false },
      { id: "q-e724-005-d", text: "admin/index.php", isCorrect: false },
    ],
  }));

  // Q6 — Store Setup & Marketing
  off.push(upsertQuestion({
    id: "q-e724-006", type: "SINGLE", sectionId: secSetup.id,
    text: "What happens when a Developer creates a new Store in Adobe Commerce under an existing Website?",
    explanation: "When creating a new Store under an existing Website, it shares the same customer accounts and checkout settings as the Website. Stores inherit website-level settings. It does not create a separate installation, does not auto-create a Store View, and does not require a different currency.",
    options: [
      { id: "q-e724-006-a", text: "It creates a separate Magento installation.", isCorrect: false },
      { id: "q-e724-006-b", text: "It automatically creates a new Store View.", isCorrect: false },
      { id: "q-e724-006-c", text: "It must have a different base currency.", isCorrect: false },
      { id: "q-e724-006-d", text: "It shares the same customer accounts and checkout settings as the Website.", isCorrect: true },
    ],
  }));

  // Q7 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e724-007", type: "MULTIPLE", sectionId: secArch.id,
    text: "A Developer wants to create a custom log file for logging into a separate file. To implement this goal, the Developer needs to use handler classes from the Magento\\Framework\\Logger module.\nWhich two handler classes exists in that module? (Choose two.)",
    explanation: "The two built-in log handlers that can be extended for custom logging are `Magento\\Framework\\Logger\\Handler\\System` (for system.log) and `Magento\\Framework\\Logger\\Handler\\Exception` (for exception.log). There is no Handler\\Warning or Handler\\Config in the framework.",
    options: [
      { id: "q-e724-007-a", text: "Magento\\Framework\\Logger\\Handler\\System", isCorrect: true },
      { id: "q-e724-007-b", text: "Magento\\Framework\\Logger\\Handler\\Warning", isCorrect: false },
      { id: "q-e724-007-c", text: "Magento\\Framework\\Logger\\Handler\\Config", isCorrect: false },
      { id: "q-e724-007-d", text: "Magento\\Framework\\Logger\\Handler\\Exception", isCorrect: true },
    ],
  }));

  // Q8 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e724-008", type: "SINGLE", sectionId: secArch.id,
    text: "How does Adobe Commerce handle cache invalidation when a product is updated?",
    explanation: "Adobe Commerce uses cache tags to invalidate only the relevant cache entries when a product is updated. Each entity generates specific cache tags (e.g., `cat_p_{id}`), and only cache blocks containing those tags are purged. It does not clear the entire cache or require manual intervention.",
    options: [
      { id: "q-e724-008-a", text: "Automatically clears the entire cache", isCorrect: false },
      { id: "q-e724-008-b", text: "Requires manual cache flush", isCorrect: false },
      { id: "q-e724-008-c", text: "Uses cache tags to invalidate only relevant cache entries", isCorrect: true },
      { id: "q-e724-008-d", text: "Does not support cache invalidation", isCorrect: false },
    ],
  }));

  // Q9 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e724-009", type: "SINGLE", sectionId: secArch.id,
    text: "In Adobe Commerce, which method is commonly used to create an instance of a class when a factory is injected into a class constructor?",
    explanation: "When using a factory class in Adobe Commerce, the `create()` method is used to instantiate a new object. Factories are auto-generated and provide a `create()` method that accepts an array of constructor arguments. `build()`, `new()`, and `getInstance()` are not factory methods.",
    options: [
      { id: "q-e724-009-a", text: "build()", isCorrect: false },
      { id: "q-e724-009-b", text: "new()", isCorrect: false },
      { id: "q-e724-009-c", text: "getInstance()", isCorrect: false },
      { id: "q-e724-009-d", text: "create()", isCorrect: true },
    ],
  }));

  // Q10 — Catalog & Products
  off.push(upsertQuestion({
    id: "q-e724-010", type: "SINGLE", sectionId: secCatalog.id,
    text: "Which attribute option must be enabled for an EAV attribute to be used to filter search results?",
    explanation: "The `filterable_in_search` attribute option must be enabled for an EAV attribute to be used as a filter in search results. `filterable` is for layered navigation on category pages, and `is_filterable_in_grid` is for admin grids.",
    options: [
      { id: "q-e724-010-a", text: "filterable", isCorrect: false },
      { id: "q-e724-010-b", text: "is_filterable_in_grid", isCorrect: false },
      { id: "q-e724-010-c", text: "filterable_in_search", isCorrect: true },
    ],
  }));

  // Q11 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e724-011", type: "SINGLE", sectionId: secArch.id,
    text: "Which statement is accurate about Magento preferences?",
    explanation: "Preferences in Adobe Commerce are used to completely override (replace) a class or interface implementation via `di.xml`. They replace the entire class, unlike plugins which modify specific methods. Preferences are not limited to frontend functionality.",
    options: [
      { id: "q-e724-011-a", text: "Preferences replace specific methods in a class.", isCorrect: false },
      { id: "q-e724-011-b", text: "Preferences allow you to register event listeners.", isCorrect: false },
      { id: "q-e724-011-c", text: "Preferences are only applicable to frontend functionality.", isCorrect: false },
      { id: "q-e724-011-d", text: "Preferences are used to completely override a class or interface.", isCorrect: true },
    ],
  }));

  // Q12 — Module Development
  off.push(upsertQuestion({
    id: "q-e724-012", type: "SINGLE", sectionId: secModule.id,
    text: "During developing a custom module a Developer is about to add a new config in the admin panel in the file etc/adminhtml/system.xml for one of the existing sections in the Stores -> Configuration.\nWhat will be the correct structure of added a config?",
    explanation: "System configuration fields for the admin panel are defined in `system.xml` using the `urn:magento:module:Magento_Config:etc/system_file.xsd` schema. The file must reference the correct XSD for validation and proper rendering of the configuration form.",
    options: [
      { id: "q-e724-012-a", text: "\n\n\n\n\n\n\n\n\n\n...\n\n\n\n\n\n\n\n", isCorrect: false },
      { id: "q-e724-012-b", text: "\n\n\n\n\n\n\n\n\n\n...\n\n\n\n\n\n\n\n", isCorrect: true },
      { id: "q-e724-012-c", text: "\n\n\n\n\n\n\n\n\n\n...\n\n\n\n\n\n\n\n", isCorrect: false },
    ],
  }));

  // Q13 — Module Development
  off.push(upsertQuestion({
    id: "q-e724-013", type: "SINGLE", sectionId: secModule.id,
    text: "A Developer needs to create a before plugin for the third-party extension method Vendor\\Module\\Model\\ClassA::_functionName();.\nWhat should the Developer do to accomplish this goal?",
    explanation: "Before plugin method names follow the pattern `before_` + original method name (preserving the original casing). For a method called `functionName`, the before plugin method must be named `before_functionName()` — note the underscore separator and lowercase 'f'.",
    options: [
      { id: "q-e724-013-a", text: "beforeFunctionName()", isCorrect: false },
      { id: "q-e724-013-b", text: "before_FunctionName()", isCorrect: false },
      { id: "q-e724-013-c", text: "before_functionName()", isCorrect: true },
    ],
  }));

  // Q14 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e724-014", type: "SINGLE", sectionId: secArch.id,
    text: "Which Indexer method is used for rebuilding a grid index that only supports \"Update on Save” indexing mode?",
    explanation: "The `customer_grid` indexer is the grid index that only supports 'Update on Save' indexing mode. It rebuilds the customer grid data whenever a customer record is modified, without requiring a full reindex.",
    options: [
      { id: "q-e724-014-a", text: "design_config_grid", isCorrect: false },
      { id: "q-e724-014-b", text: "customer_grid", isCorrect: true },
      { id: "q-e724-014-c", text: "catalogrule_grid", isCorrect: false },
    ],
  }));

  // Q15 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e724-015", type: "SINGLE", sectionId: secArch.id,
    text: "A Developer encounters an error when running a CLI command.\nWhich argument generates more verbose logging for debugging purposes?",
    explanation: "The `-vvv` argument provides the most verbose output level when running CLI commands. It enables debug-level logging with maximum detail. `--debug` and `--verbose` alone provide less detail than the triple-v flag.",
    options: [
      { id: "q-e724-015-a", text: "-vvv", isCorrect: true },
      { id: "q-e724-015-b", text: "--debug", isCorrect: false },
      { id: "q-e724-015-c", text: "--verbose", isCorrect: false },
    ],
  }));

  // Q16 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e724-016", type: "SINGLE", sectionId: secArch.id,
    text: "What is the main advantage of using observers in Magento 2?",
    explanation: "The main advantage of observers is that they allow global functionality changes without modifying core logic. Observers listen to dispatched events and execute custom code in response, maintaining separation of concerns and keeping core code untouched.",
    options: [
      { id: "q-e724-016-a", text: "They are easier to implement than plugins", isCorrect: false },
      { id: "q-e724-016-b", text: "They allow for global functionality changes without modifying core logic", isCorrect: true },
      { id: "q-e724-016-c", text: "They provide better performance than plugins", isCorrect: false },
      { id: "q-e724-016-d", text: "They can only be used in custom modules", isCorrect: false },
    ],
  }));

  // Q17 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e724-017", type: "SINGLE", sectionId: secArch.id,
    text: "Which command is used to run a specific cron group, such as the default cron group?",
    explanation: "The correct command to run a specific cron group is `bin/magento cron:run --group default`. The `--group` flag specifies which cron group to execute. `--default`, `--group=default` (with equals), and `cron:start` are incorrect syntax.",
    options: [
      { id: "q-e724-017-a", text: "bin/magento cron:run --default", isCorrect: false },
      { id: "q-e724-017-b", text: "bin/magento cron:start --group=default", isCorrect: false },
      { id: "q-e724-017-c", text: "bin/magento cron:run --group default", isCorrect: true },
    ],
  }));

  // Q18 — Catalog & Products
  off.push(upsertQuestion({
    id: "q-e724-018", type: "SINGLE", sectionId: secCatalog.id,
    text: "What is the purpose of Attribute Sets In Adobe Commerce?",
    explanation: "Attribute Sets in Adobe Commerce are used to group products with similar characteristics. Products using the same attribute set share the same set of available attributes (e.g., all shoes have Size and Color attributes).",
    options: [
      { id: "q-e724-018-a", text: "To manage inventory levels for products.", isCorrect: false },
      { id: "q-e724-018-b", text: "To group products with similar characteristics.", isCorrect: true },
      { id: "q-e724-018-c", text: "To define the price of products.", isCorrect: false },
    ],
  }));

  // Q19 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e724-019", type: "SINGLE", sectionId: secArch.id,
    text: "Which CLI command should a Developer use to regenerate the static view files in a production environment, ensuring the files are correctly deployed and cached?",
    explanation: "To regenerate static view files in production, use `bin/magento setup:static-content:deploy`. This compiles and deploys all static assets (CSS, JS, images, fonts) for configured themes and locales. `setup:deploy` and `static:content:regenerate` are not valid commands.",
    options: [
      { id: "q-e724-019-a", text: "bin/magento setup:deploy", isCorrect: false },
      { id: "q-e724-019-b", text: "bin/magento static:content:regenerate", isCorrect: false },
      { id: "q-e724-019-c", text: "bin/magento cache:flush", isCorrect: false },
      { id: "q-e724-019-d", text: "bin/magento setup:static-content:deploy", isCorrect: true },
    ],
  }));

  // Q20 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e724-020", type: "MULTIPLE", sectionId: secArch.id,
    text: "Which two request methods are cached by Varnish? (Choose two.)",
    explanation: "Varnish caches only GET and HEAD HTTP request methods. POST, PUT, DELETE, and PATCH requests are not cached because they modify server-side state. This is standard HTTP caching behavior implemented by Varnish.",
    options: [
      { id: "q-e724-020-a", text: "GET", isCorrect: true },
      { id: "q-e724-020-b", text: "POST", isCorrect: false },
      { id: "q-e724-020-c", text: "HEAD", isCorrect: true },
      { id: "q-e724-020-d", text: "PUT", isCorrect: false },
    ],
  }));

  // Q21 — Store Setup & Marketing
  off.push(upsertQuestion({
    id: "q-e724-021", type: "SINGLE", sectionId: secSetup.id,
    text: "How does enabling \"Web Server Apache Rewrites\" benefit Magento stores in terms of URL structure?",
    explanation: "Enabling Apache Rewrites (mod_rewrite) improves SEO by removing `index.php` from URLs. Instead of `store.com/index.php/category/product`, the URL becomes `store.com/category/product`. This creates cleaner, more search-engine-friendly URLs.",
    options: [
      { id: "q-e724-021-a", text: "It allows the system to create multiple versions of the same URL for better SEO.", isCorrect: false },
      { id: "q-e724-021-b", text: "It improves the store’s search engine optimization by removing the index.php file from the URL", isCorrect: true },
      { id: "q-e724-021-c", text: "It changes the server URL structure for internal use but not for the frontend.", isCorrect: false },
      { id: "q-e724-021-d", text: "It results in a slower page load time due to additional server-side configuration.", isCorrect: false },
    ],
  }));

  // Q22 — Frontend & Themes
  off.push(upsertQuestion({
    id: "q-e724-022", type: "MULTIPLE", sectionId: secFrontend.id,
    text: "While reviewing a Magento 2 project, a Developer notices an i18n file named es_ES.csv, which has a Spanish translation for a string in a third-party module.\nThe Developer needs to change this translation to another string.\nWhich two actions should the Developer take? (Choose two.)",
    explanation: "To override a third-party module's translation: (1) Create a custom module that inherits the third-party module and include the corrected `es_ES.csv`, or (2) create an `es_ES.csv` in the custom theme's `i18n` folder. Both approaches override translations without modifying the original module.",
    options: [
      { id: "q-e724-022-a", text: "Create a custom module that inherits the third-party module, and create the \"es_ES.csv\" file with a custom translation text.", isCorrect: true },
      { id: "q-e724-022-b", text: "Modify the \"es_ES.csv\" file in the third-party module with the custom translation text.", isCorrect: false },
      { id: "q-e724-022-c", text: "Create an \"es_ES.csv\" file inside the i18n folder in the project root, with the custom translation text.", isCorrect: false },
      { id: "q-e724-022-d", text: "Create an \"es_ES.csv\" file in the i18n folder of the custom theme with a custom translation text.", isCorrect: true },
    ],
  }));

  // Q23 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e724-023", type: "SINGLE", sectionId: secArch.id,
    text: "What is the primary purpose of indexing in Adobe Commerce?",
    explanation: "Indexing in Adobe Commerce optimizes database query performance by pre-computing and storing complex data in flat index tables. This avoids expensive real-time queries on EAV tables. It does not create backups or convert data for export.",
    options: [
      { id: "q-e724-023-a", text: "To ensure that only fresh data is displayed in the frontend", isCorrect: false },
      { id: "q-e724-023-b", text: "To optimize the performance of the database queries", isCorrect: true },
      { id: "q-e724-023-c", text: "To create backups of the product and catalog data", isCorrect: false },
      { id: "q-e724-023-d", text: "To convert product data into a format suitable for export", isCorrect: false },
    ],
  }));

  // Q24 — Frontend & Themes
  off.push(upsertQuestion({
    id: "q-e724-024", type: "SINGLE", sectionId: secFrontend.id,
    text: "On the website a Developer has to add Nederlands translation for the concrete phrase in the theme.\nWhere in the theme Developer can the translation be added?",
    explanation: "Theme translation files are located in `app/design/frontend/ThemeVendor/ThemeName/i18n/nl_NL.csv`. The `i18n` directory is the standard location, and the locale code format is `language_COUNTRY` (e.g., `nl_NL` for Dutch/Netherlands).",
    options: [
      { id: "q-e724-024-a", text: "In the file app/design/frontend/ThemeVendor/ThemeName/translations/nl_NL.csv", isCorrect: false },
      { id: "q-e724-024-b", text: "In the file app/design/frontend/ThemeVendor/ThemeName/i18n/nl_NL.csv", isCorrect: true },
      { id: "q-e724-024-c", text: "In the file app/design/frontend/ThemeVendor/ThemeName/i18n/NL_nl.csv", isCorrect: false },
    ],
  }));

  // Q25 — Module Development
  off.push(upsertQuestion({
    id: "q-e724-025", type: "SINGLE", sectionId: secModule.id,
    text: "Which element in module.xml is used to declare module dependencies?",
    explanation: "The `` element in `module.xml` declares module dependencies. It ensures that specified modules are loaded before the current module, establishing the correct initialization order.",
    options: [
      { id: "q-e724-025-a", text: "", isCorrect: false },
      { id: "q-e724-025-b", text: "", isCorrect: false },
      { id: "q-e724-025-c", text: "", isCorrect: true },
      { id: "q-e724-025-d", text: "", isCorrect: false },
    ],
  }));

  // Q26 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e724-026", type: "SINGLE", sectionId: secArch.id,
    text: "Which Adobe Commerce cache type is used to store API interface data?",
    explanation: "The Reflection cache type stores API interface data including method signatures, parameter types, and annotations. It is used by the web API framework to introspect service contracts and generate API schemas.",
    options: [
      { id: "q-e724-026-a", text: "Block HTML", isCorrect: false },
      { id: "q-e724-026-b", text: "Layout", isCorrect: false },
      { id: "q-e724-026-c", text: "Page", isCorrect: false },
      { id: "q-e724-026-d", text: "Reflection", isCorrect: true },
    ],
  }));

  // Q27 — Frontend & Themes
  off.push(upsertQuestion({
    id: "q-e724-027", type: "SINGLE", sectionId: secFrontend.id,
    text: "A client would like to add a custom input mask for the zip code field on checkout.\nHow can this goal be met?",
    explanation: "To add a custom input mask for zip codes, create a `zip_codes.xml` file in a custom module. This file defines country-specific patterns for postal code validation, leveraging Magento's built-in zip code validation framework.",
    options: [
      { id: "q-e724-027-a", text: "Implement \"after\" plugin for method \\Magento\\Checkout\\Model\\Validator\\Address::validate with a pattern check logic.", isCorrect: false },
      { id: "q-e724-027-b", text: "Override the html file that is used to display the zip code, and then add \"mask\" attribute to the input field.", isCorrect: false },
      { id: "q-e724-027-c", text: "Add a zip_codes.xml file in a custom module, and then define the country specific pattern there.", isCorrect: true },
    ],
  }));

  // Q28 — Frontend & Themes
  off.push(upsertQuestion({
    id: "q-e724-028", type: "SINGLE", sectionId: secFrontend.id,
    text: "A new custom module is built for an existing Adobe Commerce store.\nA merchant has requested a few frontend updates. As a part of these updates, a Developer must implement a custom style.\nWhat is the location of the LESS file which will be included by default?",
    explanation: "Custom module styles should be placed in `view/{area}/web/css/source/_module.less`. The `_module.less` file is automatically imported by Magento's LESS compilation process and is the standard location for module-specific styles.",
    options: [
      { id: "q-e724-028-a", text: "view/{area}/web/css/source/_module.less", isCorrect: true },
      { id: "q-e724-028-b", text: "view/{area}/web/css/style.less", isCorrect: false },
      { id: "q-e724-028-c", text: "view/{area}/web/css/source/main.less", isCorrect: false },
    ],
  }));

  // Q29 — Module Development
  off.push(upsertQuestion({
    id: "q-e724-029", type: "SINGLE", sectionId: secModule.id,
    text: "Which attribute type allows the use of more complex data?",
    explanation: "Extension attributes allow adding complex data types (objects, arrays) to existing API data interfaces. Unlike custom attributes (which are EAV-based and scalar), extension attributes can reference other entities and support complex data structures.",
    options: [
      { id: "q-e724-029-a", text: "Extension attribute", isCorrect: true },
      { id: "q-e724-029-b", text: "Custom Attribute", isCorrect: false },
      { id: "q-e724-029-c", text: "Frontend attribute", isCorrect: false },
    ],
  }));

  // Q30 — Module Development
  off.push(upsertQuestion({
    id: "q-e724-030", type: "SINGLE", sectionId: secModule.id,
    text: "What is the purpose of the  tag in the webapi.xml file when defining a custom API endpoint?",
    explanation: "The `` tag in `webapi.xml` defines the ACL (Access Control List) permissions required to access a custom API endpoint. It specifies which admin roles or integration permissions are needed for authorization.",
    options: [
      { id: "q-e724-030-a", text: "To define the maximum size of the endpoint response", isCorrect: false },
      { id: "q-e724-030-b", text: "To specify the maximum memory resources for the API call", isCorrect: false },
      { id: "q-e724-030-c", text: "To define the ACL permissions required to access the endpoint", isCorrect: true },
    ],
  }));

  // Q31 — Catalog & Products
  off.push(upsertQuestion({
    id: "q-e724-031", type: "SINGLE", sectionId: secCatalog.id,
    text: "A merchant has a new product that they would like to upload a video to.\nWhat are the steps needed to accomplish this?",
    explanation: "To add a video to a product, upload it to YouTube first, add the merchant's YouTube API key in Admin > Stores > Configuration > Catalog > Product Video, then add the YouTube URL to the product under 'Images and Videos'. Magento doesn't host videos directly.",
    options: [
      { id: "q-e724-031-a", text: "Upload the video via SFTP to the media folder, then add the filename to the product under \"Images and Video\"", isCorrect: false },
      { id: "q-e724-031-b", text: "Upload the video under \"Images and Video\" on the product page, which will upload it to the media folder", isCorrect: false },
      { id: "q-e724-031-c", text: "Upload the video to YouTube, add the merchants YouTube API key in the Admin, then add the URL to the product", isCorrect: true },
    ],
  }));

  // Q32 — Frontend & Themes
  off.push(upsertQuestion({
    id: "q-e724-032", type: "SINGLE", sectionId: secFrontend.id,
    text: "How should a Developer add a custom shipping carrier validator to the checkout's layout?",
    explanation: "To add a custom shipping carrier validator to the checkout layout, create a `checkout_index_index.xml` file and add the validator to the jsLayout structure. This is the standard way to extend checkout components in Magento.",
    options: [
      { id: "q-e724-032-a", text: "Create a plugin around getValidators and add the validator to the $result array.", isCorrect: false },
      { id: "q-e724-032-b", text: "Create a checkout_index_index.xml file and add the validator to the jsLayout.", isCorrect: true },
      { id: "q-e724-032-c", text: "Create a JS mixin to extend additionalValidators and register the validator.", isCorrect: false },
    ],
  }));

  // Q33 — Catalog & Products
  off.push(upsertQuestion({
    id: "q-e724-033", type: "SINGLE", sectionId: secCatalog.id,
    text: "A Developer wants to provide a discount for a product based on quantity, giving the customer the ability to buy two products for x amount each.\nWhich price type should the Developer use to achieve this goal?",
    explanation: "Tier Price allows quantity-based discounts — e.g., buy 5+ items for $10 each instead of $12. Group Price offers different prices per customer group, and Special Price is a time-limited flat discount. Tier Price specifically addresses volume discounts.",
    options: [
      { id: "q-e724-033-a", text: "Group Price", isCorrect: false },
      { id: "q-e724-033-b", text: "Special Price", isCorrect: false },
      { id: "q-e724-033-c", text: "Tier Price", isCorrect: true },
    ],
  }));

  // Q34 — Module Development
  off.push(upsertQuestion({
    id: "q-e724-034", type: "SINGLE", sectionId: secModule.id,
    text: "A Developer has created a data patch in Magento 2 to programmatically manipulate entity types by adding new attributes to a custom entity. The patch has already been executed successfully, but additional changes are required.\nWhich step should the Developer take to ensure the same patch file can be re-executed to apply the new changes?",
    explanation: "To re-run an already-executed data patch, manually delete its record from the `patch_list` table in the database. Magento tracks applied patches in this table, and removing the entry allows the patch to be applied again on the next `setup:upgrade`.",
    options: [
      { id: "q-e724-034-a", text: "Rename the data patch class file and update its namespace.", isCorrect: false },
      { id: "q-e724-034-b", text: "Uninstall the module to revert the executed patch, then reinstall the module to trigger the patch again.", isCorrect: false },
      { id: "q-e724-034-c", text: "Create a new data patch with a different class name to include the required changes for the entity.", isCorrect: false },
      { id: "q-e724-034-d", text: "Manually delete the record of the executed data patch from the patch_list table in the database.", isCorrect: true },
    ],
  }));

  // Q35 — Store Setup & Marketing
  off.push(upsertQuestion({
    id: "q-e724-035", type: "SINGLE", sectionId: secSetup.id,
    text: "What happens when a Developer fails to mention the start date in the \"From\" field when creating a price rule?",
    explanation: "If the 'From' date field is left empty when creating a price rule, the rule goes into effect immediately upon saving. There is no requirement for a start date — omitting it means the rule is active right away.",
    options: [
      { id: "q-e724-035-a", text: "The price rule will not be saved.", isCorrect: false },
      { id: "q-e724-035-b", text: "The price rule will be saved, but it will not go into effect until the start date is added.", isCorrect: false },
      { id: "q-e724-035-c", text: "The price rule will go into effect as soon as it is saved.", isCorrect: true },
    ],
  }));

  // Q36 — Cloud & Security
  off.push(upsertQuestion({
    id: "q-e724-036", type: "MULTIPLE", sectionId: secCloud.id,
    text: "How can merchants restore the previous behavior of using access tokens as standalone bearer tokens in Adobe Commerce? (Choose two.)",
    explanation: "To restore OAuth access tokens as standalone bearer tokens: (1) Run `bin/magento config:set oauth/consumer/enable_integration_as_bearer 1` via CLI, or (2) enable 'Allow OAuth Access Tokens to be used as standalone Bearer tokens' in Admin > Stores > Configuration > Services > OAuth.",
    options: [
      { id: "q-e724-036-a", text: "Run the bin/magento config:set oauth/consumer/enable_integration_as_bearer 1 command", isCorrect: true },
      { id: "q-e724-036-b", text: "Enable the \"Allow OAuth Access Tokens to be used as standalone Bearer tokens\" option in the Admin", isCorrect: true },
      { id: "q-e724-036-c", text: "Change the token expiration value to \"Indefinite\"", isCorrect: false },
    ],
  }));

  // Q37 — Frontend & Themes
  off.push(upsertQuestion({
    id: "q-e724-037", type: "SINGLE", sectionId: secFrontend.id,
    text: "A new custom module is built for an existing Adobe Commerce store.\nA merchant has requested a few frontend updates. As a part of these updates, a Developer must implement a custom style.\nWhat is the location of the LESS file which will be included by default?",
    explanation: "Module styles belong in `view/{area}/web/css/source/_module.less`. This is the Magento convention for module-level LESS files. The `_module.less` filename ensures automatic inclusion in the LESS compilation chain.",
    options: [
      { id: "q-e724-037-a", text: "view/{area}/web/css/style.less", isCorrect: false },
      { id: "q-e724-037-b", text: "view/{area}/web/css/source/_module.less", isCorrect: true },
      { id: "q-e724-037-c", text: "view/{area}/web/css/source/main.less", isCorrect: false },
    ],
  }));

  // Q38 — Catalog & Products
  off.push(upsertQuestion({
    id: "q-e724-038", type: "SINGLE", sectionId: secCatalog.id,
    text: "Which type of product has the ability to build customizable products from a variety of options?",
    explanation: "A Bundle Product allows customers to build customizable products from a variety of selectable options. Customers can choose which items to include and their quantities. Virtual Products have no physical form, and Grouped Products display related items together.",
    options: [
      { id: "q-e724-038-a", text: "Bundle Product", isCorrect: true },
      { id: "q-e724-038-b", text: "Virtual Product", isCorrect: false },
      { id: "q-e724-038-c", text: "Grouped Product", isCorrect: false },
    ],
  }));

  // Q39 — Frontend & Themes
  off.push(upsertQuestion({
    id: "q-e724-039", type: "SINGLE", sectionId: secFrontend.id,
    text: "A new custom module is built for an existing Adobe Commerce store.\nA merchant has requested a few frontend updates. As a part of these updates, a Developer must implement a custom style.\nWhat is the location of the LESS file which will be included by default?",
    explanation: "For frontend style customizations in a module, `view/{area}/web/css/source/_module.less` is the correct location. Magento automatically discovers and compiles `_module.less` files from all active modules during static content deployment.",
    options: [
      { id: "q-e724-039-a", text: "view/{area}/web/css/source/_module.less", isCorrect: true },
      { id: "q-e724-039-b", text: "view/{area}/web/css/source/main.less", isCorrect: false },
      { id: "q-e724-039-c", text: "view/{area}/web/css/style.less", isCorrect: false },
    ],
  }));

  // Q40 — Cloud & Security
  off.push(upsertQuestion({
    id: "q-e724-040", type: "SINGLE", sectionId: secCloud.id,
    text: "Which command in Adobe Commerce can be used to enable OAuth access tokens as standalone Bearer tokens?",
    explanation: "The command `bin/magento config:set oauth/consumer/enable_integration_as_bearer 1` enables OAuth access tokens as standalone Bearer tokens. The other command paths (`enabled`, `token_duration`, `allow_standalone_bearer`) are not valid configuration paths.",
    options: [
      { id: "q-e724-040-a", text: "bin/magento config:set oauth/consumer/enabled 1", isCorrect: false },
      { id: "q-e724-040-b", text: "bin/magento config:set oauth/consumer/token_duration 24", isCorrect: false },
      { id: "q-e724-040-c", text: "bin/magento config:set oauth/consumer/allow_standalone_bearer 1", isCorrect: false },
      { id: "q-e724-040-d", text: "bin/magento config:set oauth/consumer/enable_integration_as_bearer 1", isCorrect: true },
    ],
  }));

  // Q41 — Catalog & Products
  off.push(upsertQuestion({
    id: "q-e724-041", type: "SINGLE", sectionId: secCatalog.id,
    text: "Which product type in Adobe Commerce allows customers with “build their own” functionality to choose from an assortment of options?",
    explanation: "A Bundle Product allows customers to 'build their own' by choosing from a set of predefined options with selectable items. This is the 'build your own' product type. Simple products have no options, and Configurable products use predefined attribute combinations.",
    options: [
      { id: "q-e724-041-a", text: "Simple product", isCorrect: false },
      { id: "q-e724-041-b", text: "Configurable product", isCorrect: false },
      { id: "q-e724-041-c", text: "Bundle product", isCorrect: true },
    ],
  }));

  // Q42 — Catalog & Products
  off.push(upsertQuestion({
    id: "q-e724-042", type: "SINGLE", sectionId: secCatalog.id,
    text: "What is the role of the `sales_order` entity in Adobe Commerce?",
    explanation: "The `sales_order` entity in Adobe Commerce represents the details of an order placed in the store, including items, totals, addresses, and payment information. It is the central entity for order management.",
    options: [
      { id: "q-e724-042-a", text: "It represents the details of an order placed in the store", isCorrect: true },
      { id: "q-e724-042-b", text: "It handles the storage of payment gateway information", isCorrect: false },
      { id: "q-e724-042-c", text: "It stores customer information during checkout", isCorrect: false },
      { id: "q-e724-042-d", text: "It manages the shipping method settings", isCorrect: false },
    ],
  }));

  // Q43 — Module Development
  off.push(upsertQuestion({
    id: "q-e724-043", type: "SINGLE", sectionId: secModule.id,
    text: "How should a Developer manipulate the product catalog programmatically in Adobe Commerce?",
    explanation: "The recommended way to programmatically manipulate the product catalog is by using Magento's Product Repository API (`ProductRepositoryInterface`). Direct database updates bypass business logic, and `catalog.xml` is for layout, not data manipulation.",
    options: [
      { id: "q-e724-043-a", text: "By modifying the `catalog.xml` file", isCorrect: false },
      { id: "q-e724-043-b", text: "By directly updating the catalog table in the database", isCorrect: false },
      { id: "q-e724-043-c", text: "By using Magento's Product Repository API", isCorrect: true },
      { id: "q-e724-043-d", text: "By using the Admin Panel's \"Product\" section", isCorrect: false },
    ],
  }));

  // Q44 — Cloud & Security
  off.push(upsertQuestion({
    id: "q-e724-044", type: "SINGLE", sectionId: secCloud.id,
    text: "Which token type in Adobe Commerce has an indefinite lifetime unless manually revoked?",
    explanation: "Integration tokens in Adobe Commerce have an indefinite lifetime unless manually revoked. Unlike Admin and Customer tokens which expire after a configured period, integration tokens persist until the integration is deactivated or the token is explicitly regenerated.",
    options: [
      { id: "q-e724-044-a", text: "Integration Token", isCorrect: true },
      { id: "q-e724-044-b", text: "Admin Token", isCorrect: false },
      { id: "q-e724-044-c", text: "IMS Token", isCorrect: false },
      { id: "q-e724-044-d", text: "Customer Token", isCorrect: false },
    ],
  }));

  // Q45 — Cloud & Security
  off.push(upsertQuestion({
    id: "q-e724-045", type: "SINGLE", sectionId: secCloud.id,
    text: "An Adobe Commerce developer needs to enable additional PHP extensions while configuring an Adobe Commerce Cloud project.\nIn which configuration file would these have to be configured?",
    explanation: "To enable additional PHP extensions on Adobe Commerce Cloud, configure them in `.magento.app.yaml` under the `runtime.extensions` section. This file controls the application runtime configuration including PHP version and extensions.",
    options: [
      { id: "q-e724-045-a", text: ".magento.env.yaml", isCorrect: false },
      { id: "q-e724-045-b", text: ".magento/services.yaml", isCorrect: false },
      { id: "q-e724-045-c", text: ".magento.app.yaml", isCorrect: true },
    ],
  }));

  // Q46 — Cloud & Security
  off.push(upsertQuestion({
    id: "q-e724-046", type: "SINGLE", sectionId: secCloud.id,
    text: "What are the writeable locations in Production environment of a Commerce on cloud infrastructure?",
    explanation: "The writable locations in a Commerce Cloud production environment are: `var` (logs, cache, sessions), `pub/static` (deployed static files), `pub/media` (uploaded media), `app/etc` (generated config), and `/tmp` (temporary files).",
    options: [
      { id: "q-e724-046-a", text: "var, pub/static, pub/media, app/etc, /tmp", isCorrect: true },
      { id: "q-e724-046-b", text: "var, pub/frontend, pub/media, app/etc, /tmp", isCorrect: false },
      { id: "q-e724-046-c", text: "var, pub/media, pub/adminhtml, app/etc, /tmp", isCorrect: false },
      { id: "q-e724-046-d", text: "var, pub/frontend, pub/adminhtml, app/etc, /tmp", isCorrect: false },
    ],
  }));

  // Q47 — Cloud & Security
  off.push(upsertQuestion({
    id: "q-e724-047", type: "SINGLE", sectionId: secCloud.id,
    text: "What should a Developer do to place a custom patch on an Adobe Commerce Cloud project so the patch is automatically applied during the build phase?",
    explanation: "Custom patches for Adobe Commerce Cloud projects should be placed in the `m2-hotfixes/` directory. Patches in this directory are automatically applied during the build phase of deployment. `m2-patches/` and `patches/` are not standard directories.",
    options: [
      { id: "q-e724-047-a", text: "Add the patch file to the m2-patches/ directory.", isCorrect: false },
      { id: "q-e724-047-b", text: "Add the patch file to the patches/ directory.", isCorrect: false },
      { id: "q-e724-047-c", text: "Add the patch file to the m2-hotfixes/ directory.", isCorrect: true },
    ],
  }));

  // Q48 — Cloud & Security
  off.push(upsertQuestion({
    id: "q-e724-048", type: "SINGLE", sectionId: secCloud.id,
    text: "Which file contains the main configuration for the deployment process in a Magento Cloud project?",
    explanation: "The `.magento-cloud.yml` file is not actually the main deployment config — the question states it is. However, the main deployment-related configurations are split across `.magento.app.yaml` (application), `.magento.env.yaml` (environment variables), and `routes.yaml` (routing).",
    options: [
      { id: "q-e724-048-a", text: "magento-cloud.json", isCorrect: false },
      { id: "q-e724-048-b", text: "magento-cloud.yaml", isCorrect: false },
      { id: "q-e724-048-c", text: "composer.json", isCorrect: false },
      { id: "q-e724-048-d", text: ".magento-cloud.yml", isCorrect: true },
    ],
  }));

  // Q49 — Cloud & Security
  off.push(upsertQuestion({
    id: "q-e724-049", type: "SINGLE", sectionId: secCloud.id,
    text: "What does the command magento-cloud ssh allow a Developer to do?",
    explanation: "The `magento-cloud ssh` command allows a developer to connect to a remote environment using SSH. This provides direct terminal access to the cloud environment for debugging, running commands, and checking logs.",
    options: [
      { id: "q-e724-049-a", text: "Install additional services on the environment.", isCorrect: false },
      { id: "q-e724-049-b", text: "Connect to a remote environment using SSH.", isCorrect: true },
      { id: "q-e724-049-c", text: "Trigger a redeployment of an environment.", isCorrect: false },
      { id: "q-e724-049-d", text: "Open the Cloud Console in the browser.", isCorrect: false },
    ],
  }));

  // Q50 — Cloud & Security
  off.push(upsertQuestion({
    id: "q-e724-050", type: "SINGLE", sectionId: secCloud.id,
    text: "Which statement is accurate regarding the Integration environments in Adobe Commerce Cloud Starter architecture?",
    explanation: "Integration environments in Adobe Commerce Cloud Starter are created by branching from the staging environment. They provide isolated development spaces that inherit staging's configuration. They do not include all production services like Fastly CDN.",
    options: [
      { id: "q-e724-050-a", text: "They include all services available in the Production environment, such as Fastly CDN and New Relic.", isCorrect: false },
      { id: "q-e724-050-b", text: "They are created by branching from the staging environment.", isCorrect: true },
      { id: "q-e724-050-c", text: "They are designed for extensive performance testing with large catalogs.", isCorrect: false },
    ],
  }));

  // ─── Practice Test ─────────────────────────────────────────────────────────

  const allQuestions = await Promise.all(off);
  console.log(`Created/updated ${allQuestions.length} questions.`);

  await prisma.practiceTestQuestion.deleteMany({
    where: { practiceTestId: "pt-official-e724" },
  });

  await prisma.practiceTest.upsert({
    where: { id: "pt-official-e724" },
    update: { questionCount: allQuestions.length },
    create: {
      id: "pt-official-e724",
      certificationId: cert.id,
      title: "Official Practice Exam",
      type: "OFFICIAL",
      questionCount: allQuestions.length,
    },
  });

  for (let i = 0; i < allQuestions.length; i++) {
    await prisma.practiceTestQuestion.create({
      data: {
        practiceTestId: "pt-official-e724",
        questionId: allQuestions[i].id,
        position: i + 1,
      },
    });
  }

  console.log(`Linked ${allQuestions.length} questions to Official Practice Exam.`);
  console.log("AD0-E724 seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
