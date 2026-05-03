import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding AD0-E725 Developer Expert practice tests...");

  // ─── Certification ─────────────────────────────────────────────────────────

  const cert = await prisma.certification.upsert({
    where: { id: "cert-ad0-e725" },
    update: {},
    create: {
      id: "cert-ad0-e725",
      name: "Adobe Commerce Developer Expert",
      code: "AD0-E725",
      provider: "Adobe",
      description:
        "Validates expertise in developing, customizing, and extending Adobe Commerce applications including architecture, cloud deployment, checkout, catalog, and module development.",
      totalQuestions: 50,
      passingScore: 33,
      timeLimitMinutes: 100,
    },
  });

  // ─── Sections ──────────────────────────────────────────────────────────────

  const [secArch, secCustom, secCatalog, secCloud, secSecurity, secTest] =
    await Promise.all([
      prisma.certSection.upsert({
        where: { id: "sec725-arch" },
        update: { name: "Architecture & Core", percentage: 20 },
        create: { id: "sec725-arch", certificationId: cert.id, name: "Architecture & Core", percentage: 20 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec725-custom" },
        update: { name: "Customization & Extensions", percentage: 28 },
        create: { id: "sec725-custom", certificationId: cert.id, name: "Customization & Extensions", percentage: 28 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec725-catalog" },
        update: { name: "Catalog, Checkout & APIs", percentage: 22 },
        create: { id: "sec725-catalog", certificationId: cert.id, name: "Catalog, Checkout & APIs", percentage: 22 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec725-cloud" },
        update: { name: "Cloud Infrastructure", percentage: 18 },
        create: { id: "sec725-cloud", certificationId: cert.id, name: "Cloud Infrastructure", percentage: 18 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec725-security" },
        update: { name: "Security & Database", percentage: 8 },
        create: { id: "sec725-security", certificationId: cert.id, name: "Security & Database", percentage: 8 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec725-test" },
        update: { name: "Testing & Quality", percentage: 4 },
        create: { id: "sec725-test", certificationId: cert.id, name: "Testing & Quality", percentage: 4 },
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

  // Q1 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e725-001", type: "SINGLE", sectionId: secArch.id,
    text: "An Adobe Commerce Expert is working with L2 cache. They need to allow an outdated cache to be sent while a new one is generating in a parallel process.\nWhat config variable should be set to meet the requirement?",
    explanation: "The `use_stale_cache` configuration allows serving stale (outdated) cache entries while a new cache value is being generated in a parallel process. `allow_parallel_generation` controls whether multiple processes can generate the same cache simultaneously. `preload_keys` preloads specific cache keys into memory.",
    options: [
      { id: "q-e725-001-a", text: "`'allow_parallel_generation' => true`", isCorrect: false },
      { id: "q-e725-001-b", text: "`'use_stale_cache' => true`", isCorrect: true },
      { id: "q-e725-001-c", text: "`'preload_keys' => []`", isCorrect: false },
    ],
  }));

  // Q2 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e725-002", type: "SINGLE", sectionId: secArch.id,
    text: "A Developer is made aware that certain indexers have started to accumulate a large backlog which is negatively impacting product information on the front-end. Upon investigating the backlogs, the Developer finds that all indexers within the backlogs are stuck in a `working` state. The developer finds documentation that suggests adding the following to the `app/etc/env.php` file:\n`'indexer' => [ 'use_application_lock' => true ]`\nWhat will this piece of code do to help resolve the backlogging issue?",
    explanation: "Setting `'use_application_lock' => true` in `app/etc/env.php` uses MySQL application-level locks instead of the default file-based locks, providing a more accurate status of the indexer. This helps resolve backlog issues by ensuring accurate lock state reporting, preventing false 'working' statuses.",
    options: [
      { id: "q-e725-002-a", text: "The code will return a more accurate status of the indexer.", isCorrect: true },
      { id: "q-e725-002-b", text: "The code will stop the indexer from getting stuck in a `working` state.", isCorrect: false },
      { id: "q-e725-002-c", text: "The code will return the status of the indexer from the `indexer_lock` table.", isCorrect: false },
    ],
  }));

  // Q3 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e725-003", type: "SINGLE", sectionId: secArch.id,
    text: "Which scope do cron tasks execute in?",
    explanation: "Cron tasks in Adobe Commerce execute in the Store View scope. This means cron jobs have access to store view-level configuration when running, which affects how they process data for specific store views.",
    options: [
      { id: "q-e725-003-a", text: "Store View", isCorrect: true },
      { id: "q-e725-003-b", text: "Website", isCorrect: false },
      { id: "q-e725-003-c", text: "Store", isCorrect: false },
    ],
  }));

  // Q4 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e725-004", type: "SINGLE", sectionId: secArch.id,
    text: "An Adobe Commerce developer has attached observer to the sales_order_save_before event. In the execute method of the observer the developer modifies order info and invokes \\Magento\\Sales\\Model\\Order::save method.\nWhat is the end result?",
    explanation: "Calling `$observer->getEvent()->getOrder()->save()` inside a `sales_order_save_before` observer triggers the same event again recursively, causing a cyclical event loop. The observer fires on save, calls save again, which fires the observer again, and so on until PHP hits its recursion limit.",
    options: [
      { id: "q-e725-004-a", text: "The order will be saved successfully.", isCorrect: false },
      { id: "q-e725-004-b", text: "It will cause a cyclical event loop.", isCorrect: true },
      { id: "q-e725-004-c", text: "Adobe Commerce will throw an exception.", isCorrect: false },
    ],
  }));

  // Q5 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e725-005", type: "SINGLE", sectionId: secArch.id,
    text: "Refer to the image of the website hierarchy.\n[image]\nHow many different themes can be configured in the shop based on this hierarchy?",
    explanation: "Themes in Adobe Commerce are applied at the store view level. Since the hierarchy shows five store views, the maximum number of unique themes that can be applied is five — one per store view.",
    options: [
      { id: "q-e725-005-a", text: "One, because only one theme is allowed in a single instance", isCorrect: false },
      { id: "q-e725-005-b", text: "Three, because themes are applied per store level", isCorrect: false },
      { id: "q-e725-005-c", text: "Five, because themes are applied per store view level", isCorrect: true },
      { id: "q-e725-005-d", text: "Two, because themes are applied only per website level", isCorrect: false },
    ],
  }));

  // Q6 — Cloud Infrastructure
  off.push(upsertQuestion({
    id: "q-e725-006", type: "SINGLE", sectionId: secCloud.id,
    text: "After an Adobe Commerce upgrade to the latest available version, deployment on cloud is failing because one of the custom patches cannot be applied.\nWhich action should the Developer take to resolve the issue?",
    explanation: "Custom patches placed in the `m2-hotfixes` directory are applied during deployment. If a patch conflicts with a newer version of Commerce, the deployment fails. The correct fix is to delete the affected patch file from the `m2-hotfixes` directory since the fix is already included in the upgraded version.",
    options: [
      { id: "q-e725-006-a", text: "Delete affected patch file from the `m2-hotfixes` directory.", isCorrect: true },
      { id: "q-e725-006-b", text: "Delete affected patch from `.magento.app.yaml`.", isCorrect: false },
      { id: "q-e725-006-c", text: "Run `php ./vendor/bin/ece-patches revert` on cloud environment.", isCorrect: false },
    ],
  }));

  // Q7 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e725-007", type: "SINGLE", sectionId: secArch.id,
    text: "A company's chief technology officer wants to disable one of Magento's core cron jobs.\nWhat is the recommended way that a Developer should accomplish this?",
    explanation: "The recommended way to disable a core cron job is to rewrite its schedule in your module's `crontab.xml` to a date that will never occur (e.g., February 30th: `0 0 30 2 *`). There is no `disable` attribute on cron job nodes in Magento.",
    options: [
      { id: "q-e725-007-a", text: "Rewrite the cron job schedule, then schedule a cron time that contains a date which will never happen.", isCorrect: true },
      { id: "q-e725-007-b", text: "Rewrite the cron job, then add attribute disable=\"true\" to job node.", isCorrect: false },
      { id: "q-e725-007-c", text: "Utilize the cron_job_run event, then get cron by code and prevent code to execute.", isCorrect: false },
    ],
  }));

  // Q8 — Customization & Extensions
  off.push(upsertQuestion({
    id: "q-e725-008", type: "SINGLE", sectionId: secCustom.id,
    text: "An Adobe Commerce developer is tasked with disabling an existing observer for the wishlsit_product_add_after event.\nWhat would be the recommended way to achieve this?",
    explanation: "To disable an existing observer, create a new `events.xml` file in your module, declare the same event and observer name, and add the `disabled=\"true\"` attribute. This is the standard Magento mechanism for disabling observers without modifying core code.",
    options: [
      { id: "q-e725-008-a", text: "Create a preference on the observer instance and override the complete function to stop the execution.", isCorrect: false },
      { id: "q-e725-008-b", text: "Create a new `events.xml` file, declare the same event and observer name, then add `disabled=\"true\"`.", isCorrect: true },
      { id: "q-e725-008-c", text: "Create an around plugin on the execute method of the observer instance and stop the execution.", isCorrect: false },
    ],
  }));

  // Q9 — Security & Database
  off.push(upsertQuestion({
    id: "q-e725-009", type: "SINGLE", sectionId: secSecurity.id,
    text: "There is a task to fix the output script injection for the following line of a `.phtml` file.\n`'>\n`\nAs an Adobe Commerce developer, what should be the correct escape method to use for JSON code inside an HTML attribute?",
    explanation: "In a `.phtml` file, when outputting data inside an HTML attribute (like `data-bind`), you must use `escapeHtmlAttr()` to prevent XSS. `escapeJs()` is for inline JavaScript, and `escapeJson()` is not the correct escaper for HTML attribute contexts.",
    options: [
      { id: "q-e725-009-a", text: "`escapeJson($myJson) ?>'>\n`", isCorrect: false },
      { id: "q-e725-009-b", text: "`escapeHtmlAttr($myJson) ?>'>\n`", isCorrect: true },
      { id: "q-e725-009-c", text: "`escapeJs($myJson) ?>'>\n`", isCorrect: false },
    ],
  }));

  // Q10 — Customization & Extensions
  off.push(upsertQuestion({
    id: "q-e725-010", type: "SINGLE", sectionId: secCustom.id,
    text: "A developer has built a custom module that introduces a new entity. A client reports that after saving the new entity value in the backend, the frontend page still contains an old value.\nHow should the developer make sure that the frontend page shows the updated value?",
    explanation: "To enable proper full-page cache invalidation for a custom entity, the frontend block must implement `\\Magento\\Framework\\DataObject\\IdentityInterface`. This interface provides cache tags that tell the FPC which cache entries to invalidate when the entity changes.",
    options: [
      { id: "q-e725-010-a", text: "Layout files must have cacheable=false set on specific block", isCorrect: false },
      { id: "q-e725-010-b", text: "An implementation of IdentityInterface for the frontend block", isCorrect: true },
      { id: "q-e725-010-c", text: "cache.xml file must have a definition to clear the cache automatically", isCorrect: false },
      { id: "q-e725-010-d", text: "sections.xml file must have defined routes where the cache should be cleared", isCorrect: false },
    ],
  }));

  // Q11 — Customization & Extensions
  off.push(upsertQuestion({
    id: "q-e725-011", type: "SINGLE", sectionId: secCustom.id,
    text: "An Adobe Commerce developer is tasked with adding a new block on every page of the site. The contents of this block are supposed to vary depending on the gender of the customer when the customer is logged in. This is a restricted site, only logged in users can access it. The developer has just finished developing the block which is now able to display different contents depending on the current customer available in `\\Magento\\Customer\\Model\\Session`.\nHaving performance in mind, the developer wants to be able to keep using Varnish, in an optimized way, while allowing the contents of the block to change according to the gender of the customer.\nWhat would the developer do to achieve this?",
    explanation: "To add a block whose content varies by customer group on every page while keeping FPC working, create a before plugin on `\\Magento\\Framework\\App\\Http\\Context::getVaryString` and use `setValue()` to add the customer group as a vary parameter. This creates separate cache entries per customer group.",
    options: [
      { id: "q-e725-011-a", text: "Create a new controller extending `\\Magento\\Framework\\App\\Action\\Action` with a layout handle containing the block with a `cacheable=\"false\"` property. Add another block to the default handle in charge of making a systematic ajax call to the newly created controller and render the output.", isCorrect: false },
      { id: "q-e725-011-b", text: "Create a before plugin on `\\Magento\\Framework\\App\\Http\\Context::getVaryString`, use the `setValue()` method on the subject with a chosen key and the value of the gender of the current customer, and add the block to the default handle.", isCorrect: true },
      { id: "q-e725-011-c", text: "Create an observer on the `load_layout_before` event, get the update from the layout using `$observer->getLayout()`, and use the `createBlock()` method to add the block to the layout.", isCorrect: false },
    ],
  }));

  // Q12 — Customization & Extensions
  off.push(upsertQuestion({
    id: "q-e725-012", type: "SINGLE", sectionId: secCustom.id,
    text: "A Developer is required to remind customers to finish an incomplete registration process. Adobe Commerce needs to send an email with a link to a small signup form containing fields with previously entered information. The link should have an expiration datetime to protect from brute force attack.\nConsidering simplicity, how should the Developer implement this feature?",
    explanation: "Using `Magento\\Framework\\Jwt\\JwtManagerInterface` to encode registration data as a JSON Web Token in the email link provides a secure, stateless, and tamper-proof way to pass data. The token contains an expiration time, and no additional database table is needed.",
    options: [
      { id: "q-e725-012-a", text: "Use `Magento\\Framework\\Jwt\\JwtManagerInterface` to encode data in JSON Web Token as link param, and check it in custom controller.", isCorrect: true },
      { id: "q-e725-012-b", text: "Store \"unfinished sign up data\" to a separate table with additional \"customer_id\", \"expiration date\" and \"UID\" columns. Load data via UID provided as link param.", isCorrect: false },
      { id: "q-e725-012-c", text: "Use `customer-data` JS library to store private load previously entered information from the local storage when the form is loaded.", isCorrect: false },
    ],
  }));

  // Q13 — Security & Database
  off.push(upsertQuestion({
    id: "q-e725-013", type: "MULTIPLE", sectionId: secSecurity.id,
    text: "An Adobe Commerce developer is creating a new cron group as part of their development of a custom module.\nWhat are two valid cron group configuration nodes? (Choose two.)",
    explanation: "Valid cron group configuration options include `` (retention period for failed cron history) and `` (run this cron group in its own process). `` and `` are not valid cron group XML options.",
    options: [
      { id: "q-e725-013-a", text: "`1`", isCorrect: false },
      { id: "q-e725-013-b", text: "`600`", isCorrect: true },
      { id: "q-e725-013-c", text: "`1`", isCorrect: true },
      { id: "q-e725-013-d", text: "`10`", isCorrect: false },
    ],
  }));

  // Q14 — Customization & Extensions
  off.push(upsertQuestion({
    id: "q-e725-014", type: "SINGLE", sectionId: secCustom.id,
    text: "An Adobe Commerce Developer is tasked with creating a new module that will show private unique content blocks for each customer based on their information.\nWhich solution should the Developer implement to guarantee that private content blocks are updated?",
    explanation: "To display private (customer-specific) content that varies per customer, specify a new action in a `sections.xml` configuration file. This registers which customer data sections need to be invalidated and reloaded via AJAX after specific controller actions, keeping the page cacheable.",
    options: [
      { id: "q-e725-014-a", text: "Specify a new action in a sections.xml configuration file.", isCorrect: true },
      { id: "q-e725-014-b", text: "Add the cachable=\"false\" directive to the layout file.", isCorrect: false },
      { id: "q-e725-014-c", text: "Add a `before` plugin on method `\\Magento\\Framework\\App\\Http\\Context::getVaryString`.", isCorrect: false },
    ],
  }));

  // Q15 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e725-015", type: "SINGLE", sectionId: secArch.id,
    text: "An Adobe Commerce Expert is setting up an online store with multiple languages for international customers. Each language needs a dedicated store view and different base URLs (e.g., domain.com/en and domain.com/fr) while sharing the same product catalog.\nWhat is the minimum store structure required?",
    explanation: "For a single store with multiple language-specific storefronts sharing the same product catalog, the correct setup is one website, one store, and multiple store views — one per language. Store views share the same catalog and categories but can have different translations and currencies.",
    options: [
      { id: "q-e725-015-a", text: "One website, multiple stores, and a single store view for each store", isCorrect: false },
      { id: "q-e725-015-b", text: "One website, one store, and multiple store views", isCorrect: true },
      { id: "q-e725-015-c", text: "Multiple websites, each with one store and one store view", isCorrect: false },
    ],
  }));

  // Q16 — Security & Database
  off.push(upsertQuestion({
    id: "q-e725-016", type: "MULTIPLE", sectionId: secSecurity.id,
    text: "A code audit revealed that a project contains an `Acme\\Blog\\CustomClass` that uses direct SQL queries:\n`public function getBlogPostsData(string $postName, \\Zend_Db_Adapter_Pdo_Mysql $connection): array\n{\n    //using direct SQL queries for performance\n    return $connection->query(“SELECT * FROM blog_post WHERE name LIKE $postName”)->fetchAll();\n} \n`\nWhich two methods can be used to make the code resistant to SQL Injection attacks? (Choose two.)",
    explanation: "To fix SQL injection vulnerabilities, two approaches work: (1) Use prepared statements with parameter binding to sanitize inputs, and (2) refactor to use Magento's ORM (model, resource model, and collection) which handles parameterization automatically. Both eliminate direct string interpolation in SQL.",
    options: [
      { id: "q-e725-016-a", text: "Use a prepared statement to sanitize the input:\n`public function getBlogPostsData(string $postName, \\Zend_Db_Adapter_Pdo_Mysql $connection): array\n{\n    return $connection->query(“SELECT * FROM blog_post WHERE name LIKE ?”, [$postName])->fetchAll();\n} \n`", isCorrect: true },
      { id: "q-e725-016-b", text: "Refactor CustomClass to use `\\Magento\\Framework\\DB\\Adapter\\AdapterInterface` instead of `\\Zend_Db_Adapter_Pdo_Mysql` so Magento can apply built-in sanitization methods automatically:\n`public function getBlogPostsData(string $postName, \\Magento\\Framework\\DB\\Adapter\\AdapterInterface $connection): array\n{\n    return $connection->query(“SELECT * FROM blog_post WHERE name LIKE $postName”)->fetchAll();\n}\n`", isCorrect: false },
      { id: "q-e725-016-c", text: "Sanitize the input by escaping HTML special characters using the htmlspecialchars() function:\n`public function getBlogPostsData(string $postName, \\Zend_Db_Adapter_Pdo_Mysql $connection): array\n{\n    return $connection->query(“SELECT * FROM blog_post WHERE name LIKE htmlspecialchars($postName)”)->fetchAll();\n} \n`", isCorrect: false },
      { id: "q-e725-016-d", text: "Create a model, resource model and a collection.\n\nRefactor the class to include a collection factory and use the collection to load the data:\n`public function getBlogPostsData(string $postName): array\n{\n    /** @var \\Acme\\Blog\\Model\\ResourceModel\\BlogPost\\Collection $collection */\n    $collection = $this->collectionFactory->create();\n    $collection->addFieldToFilter('name', ['like' => $postName]);\n    return $collection->getItems();\n} \n`", isCorrect: true },
    ],
  }));

  // Q17 — Customization & Extensions
  off.push(upsertQuestion({
    id: "q-e725-017", type: "SINGLE", sectionId: secCustom.id,
    text: "An Adobe Commerce developer starts a project where inventory is going to be managed outside of Magento using a custom connector module. A decision has been made to completely remove all Magento modules related to inventory as the first step to improve application performance. Over 70 such modules were identified, starting with `magento/module-inventory` (Magento_Inventory) and ending with `magento/module-inventory-wishlist` (Magento_InventoryWishlist).\nThe developer already ran the following command:\n`composer create-project --repository-url=https://repo.magento.com/ magento/project-community-edition myproject\n`\nHow can the developer ensure that modules related to inventory modules are removed from the codebase before Magento gets installed?",
    explanation: "To disable core modules like Inventory (MSI), include the `replace` node in the main `composer.json` file listing all the modules to disable. This tells Composer to replace those packages with nothing, effectively removing them from the installation.",
    options: [
      { id: "q-e725-017-a", text: "Update the `autoload > exclude-from-classmap` node with namespaces of the modules to remove in the main composer.json file and run `composer update`:\n`\"autoload\": {\n    ...\n    \"exclude-from-classmap\": [\n        \"Magento\\\\Inventory\\\\**,\n        ...\n        \"Magento\\\\InventoryWishlist\\\\**,\n        ...\n    ]\n    ...\n}\n`", isCorrect: false },
      { id: "q-e725-017-b", text: "Run the following command and include all the necessary modules:\n`bin/magento module:uninstall Magento_Inventory, ..., Magento_InventoryWishlist\n`", isCorrect: false },
      { id: "q-e725-017-c", text: "Include the following node in the main composer.json file of the project including all the necessary modules and run `composer update`:\n`\"replace\": {\n    \"magento/module-inventory\": \"*\",\n    ...\n    \"magento/module-inventory-wishlist\": \"*\"\n}\n`", isCorrect: true },
    ],
  }));

  // Q18 — Customization & Extensions
  off.push(upsertQuestion({
    id: "q-e725-018", type: "SINGLE", sectionId: secCustom.id,
    text: "A merchant wants to have reCAPTCHA available on a custom form they have on their storefront.\nThe frontend work is already done with the recaptcha key coming to the backend as a `g-recaptcha-response` request parameter. A store configuration for determining reCAPTCHA type is created with the `recaptcha_frontend/type_for/acme_custom_index` path.\nWhich technique can be used to enable reCAPTCHA validation on the backend for a custom `acme_custom_index` POST action?",
    explanation: "To add reCAPTCHA to a custom storefront form: (1) Create an observer for the `controller_action_predispatch_{route}` event, (2) Utilize the `CaptchaResponseResolverInterface` to validate the reCAPTCHA token. The observer intercepts the form submission before the controller action executes.",
    options: [
      { id: "q-e725-018-a", text: "\nCreate a `frontend/di.xml` file.\nInsert `acme_custom_index` to the list of handled actions using the `actions` array parameter of the `Magento\\ReCaptchaCore\\Api\\RequestPoolInterface`.\n", isCorrect: false },
      { id: "q-e725-018-b", text: "\nImplement the `Magento\\ReCaptchaValidation\\Api\\RecaptchaActionInterface` interface in the custom action.\nImplement `getRecapchaParam()` method returning `g-recaptcha-response` and `getRecaptchaType()` method returning `acme_custom_index`.\n", isCorrect: false },
      { id: "q-e725-018-c", text: "\nCreate an observer for `controller_action_predispatch_acme_custom_index`.\nUtilize `Magento\\ReCaptchaUi\\Model\\RequestHandlerInterface::execute()` and use `my_custom_request` as key to handle the request.\n", isCorrect: true },
    ],
  }));

  // Q19 — Customization & Extensions
  off.push(upsertQuestion({
    id: "q-e725-019", type: "SINGLE", sectionId: secCustom.id,
    text: "An Adobe Commerce developer is being tasked with disabling a cron job added by a third-party module. The developer has already created a new module with a dependency on the third-party module:\n\n    \n        0 0 * * *\n    \n\n`\nWhat would a developer do to disable the cron job?",
    explanation: "To disable a third-party module's cron job, rewrite its schedule in your module's `crontab.xml` to a date that will never occur. There is no `disable` attribute or `referenceJob` node for cron jobs in Magento's XML schema.",
    options: [
      { id: "q-e725-019-a", text: "Rewrite the `reminder_email` cron job schedule to run on a date that which will never occur.\n<?xml version=\"1.0\"?>\n\n    \n        \n            0 0 30 2 *\n        \n    \n\n`", isCorrect: true },
      { id: "q-e725-019-b", text: "Rewrite the `reminder_email` cron job to add `disable=\"true\"` to the `job` node.\n<?xml version=\"1.0\"?>\n\n    \n        \n            0 0 * * *\n        \n    \n\n`", isCorrect: false },
      { id: "q-e725-019-c", text: "Create a crontab.xml file and use a `referenceJob` node to add `disable=\"true\"` to the the `reminder_email` cron job.\n<?xml version=\"1.0\"?>\n\n    \n        \n    \n\n`", isCorrect: false },
    ],
  }));

  // Q20 — Customization & Extensions
  off.push(upsertQuestion({
    id: "q-e725-020", type: "SINGLE", sectionId: secCustom.id,
    text: "A client sets up Adobe Product Recommendations. Afterward, it is noted that no recommended products are showing on the frontend. A Developer investigates and finds that the cron jobs are off.\nWhy does the cron job issue affect the Product Recommendations functionality?",
    explanation: "Adobe Commerce Product Recommendations rely on indexers to compile catalog data into tables that feed the recommendation engine. Without running cron jobs, indexers cannot process, so no recommendation data is available for display on the frontend.",
    options: [
      { id: "q-e725-020-a", text: "Cron jobs clear the data pool for products, making sure there is clean data to be used for recommndations.", isCorrect: false },
      { id: "q-e725-020-b", text: "There is an hourly cron job that sends product recommendation data to Adobe for processing.", isCorrect: false },
      { id: "q-e725-020-c", text: "Adobe Commerce uses indexers to compile catalog data into tables; with no cron jobs running, indexing cannot properly run.", isCorrect: true },
    ],
  }));

  // Q21 — Customization & Extensions
  off.push(upsertQuestion({
    id: "q-e725-021", type: "SINGLE", sectionId: secCustom.id,
    text: "A Developer is building an App Builder Application. As part of the logic, the Developer needs to publish I/O Events to send data to Adobe accordingly.\nWhat should the Developer do to achieve this requirement?",
    explanation: "When building an App Builder Application that needs I/O Events, the developer should bootstrap their application using the Adobe Developer Console template/preset boilerplate. This automatically enables I/O Events features and configures the necessary dependencies.",
    options: [
      { id: "q-e725-021-a", text: "Download and install an I/O library and add it as a dependency to the application.", isCorrect: false },
      { id: "q-e725-021-b", text: "Create their own I/O framework from scratch allowing for flexibility in the application.", isCorrect: false },
      { id: "q-e725-021-c", text: "Bootstrap their application as it enables features via a preset boilerplate.", isCorrect: true },
    ],
  }));

  // Q22 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e725-022", type: "SINGLE", sectionId: secArch.id,
    text: "An Adobe Commerce developer is assisting a junior developer on their team. The junior developer is trying to add an additional attribute to select for a product collection of a block that extends `\\Magento\\Catalog\\Block\\Product\\ListProduct`. The developer has attempted to do this by creating a plugin to the block:\n`public function afterToHtml(\\Vendor\\CustomCatalog\\Block\\Product\\ListProduct $subject, $result) {\n    $subject->addAttribute('custom_attribute');\n\n    return $result;\n}\n`\nWhy does this not work correctly?",
    explanation: "The `load` method of the product collection has already been called in the block's `_beforeToHtml` method. Once a collection is loaded, calling `addAttributeToSelect` has no effect because the SQL query has already executed. The attribute must be added before the collection loads.",
    options: [
      { id: "q-e725-022-a", text: "The plugin cannot return the `$result` argument because the developer is trying to modify the output. The developer should `return $subject->toHtml()` instead to ensure the updated markup is rendered.", isCorrect: false },
      { id: "q-e725-022-b", text: "The `load` method of the collection has already been called in the block's `_beforeToHtml` method, so the modification of the select statement was made too late.", isCorrect: true },
      { id: "q-e725-022-c", text: "The `ListProduct` block does not contain an `addAttribute` method. Instead, the developer should have called `$subject->getProductCollection()->addAttributeToSelect('custom_attribute')`.", isCorrect: false },
    ],
  }));

  // Q23 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e725-023", type: "SINGLE", sectionId: secArch.id,
    text: "An Adobe Commerce developer is working on a site with a multi-store setup containing a main retail store, and a secondary B2B store.  They would like the sales emails from the B2B store to use product image URLs from the retail store.\nTo achieve this they have used a plugin on the URL generation method to call `Emulation::startEnvironmentEmulation`, passing through the correct `$storeId` and `$area`. However, they find that the URLs B2B sales emails are unchanged, and no exceptions are being thrown.\nGiven that email generation already uses area emulation, why is this?",
    explanation: "Only one level of store emulation is permitted at any one time. If you try to start a new emulation while one is already active, it will not work correctly. The existing emulation must be stopped before starting a new one.",
    options: [
      { id: "q-e725-023-a", text: "The `$force` parameter required to override this needs to be provided.", isCorrect: false },
      { id: "q-e725-023-b", text: "Emulation does not effect URLs which are stored fully qualified against the product.", isCorrect: false },
      { id: "q-e725-023-c", text: "Only one level of emulation is permitted at any one time.", isCorrect: true },
    ],
  }));

  // Q24 — Architecture & Core
  off.push(upsertQuestion({
    id: "q-e725-024", type: "SINGLE", sectionId: secArch.id,
    text: "Data patch `MyVendor\\CategoryRecommendations\\Setup\\Patch\\Data\\UpdateCategoryRecommendation` has a dependencies on `MyVendor\\ProductRecommendations\\Setup\\Patch\\Data\\UpdateProductRecommendation`.\n`<?php\nnamespace MyVendor\\CategoryRecommendations\\Setup\\Patch\\Data;\nclass UpdateCategoryRecommendation\n{\n    public static function getDependencies(): array\n    {\n        return [MyVendor\\ProductRecommendations\\Setup\\Patch\\Data\\UpdateProductRecommendation::class];\n    }\n}\n`\nThe module `MyVendor\\ProductRecommendation` is disabled and the `UpdateProductRecommendation` has not yet been applied.\nWhat would be the result of the command `bin/magento setup:upgrade`?",
    explanation: "When a data patch has a dependency on a patch from a disabled module, both patches are still applied. Magento resolves patch dependencies regardless of module status for disabled modules — the dependency chain is honored to maintain data integrity.",
    options: [
      { id: "q-e725-024-a", text: "It will raise an error when applying `UpdateCategoryRecommendation` as it depends on a not applied patch from a disabled module.", isCorrect: false },
      { id: "q-e725-024-b", text: "Both patches `UpdateProductRecommendation` and `UpdateCategoryRecommendation` are applied.", isCorrect: true },
      { id: "q-e725-024-c", text: "Only `UpdateCategoryRecommendation` will be applied, as dependencies from disabled module are skipped.", isCorrect: false },
    ],
  }));

  // Q25 — Customization & Extensions
  off.push(upsertQuestion({
    id: "q-e725-025", type: "MULTIPLE", sectionId: secCustom.id,
    text: "A customer wants to start using Webhooks in their Adobe Commerce environment.\nWhich two options must the developer use in the configuration to achieve this? (Choose two.)",
    explanation: "To enable Webhooks in Adobe Commerce Cloud: (1) Add `ENABLE_WEBHOOKS: true` to the global stage of `.magento.env.yaml`, and (2) ensure `ece-tools` is up to date per the Webhooks documentation. The Cloud UI console does not have a Webhooks toggle.",
    options: [
      { id: "q-e725-025-a", text: "Add the setting of `ENABLE_WEBHOOKS: true` to the global stage of the cloud env YAML file.", isCorrect: true },
      { id: "q-e725-025-b", text: "Ensure that `ece-tools` version is up to date according to the Webhooks documentation.", isCorrect: true },
      { id: "q-e725-025-c", text: "Set the Webhooks setting to yes from the Cloud UI console.", isCorrect: false },
      { id: "q-e725-025-d", text: "Add the setting of `ALLOW_WEBHOOKS: true` to the build stage of the cloud env YAML file.", isCorrect: false },
    ],
  }));

  // Q26 — Security & Database
  off.push(upsertQuestion({
    id: "q-e725-026", type: "MULTIPLE", sectionId: secSecurity.id,
    text: "An Adobe Commerce developer is training a junior developer on their team and is explaining how Data and Schema patches work. While investigating an example patch from the Adobe Commerce dev docs, the junior developer asks what the purpose of the `startSetup` and `endSetup` calls are from this method:\n`public function apply()\n{\n    $this->moduleDataSetup->getConnection()->startSetup();\n    //The code that you want apply in the patch\n    //Please note, that one patch is responsible only for one setup version\n    //So one UpgradeData can consist of few data patches\n    $this->moduleDataSetup->getConnection()->endSetup();\n}\n`\nWhich two statements are true regarding the purpose of these methods? (Choose two.)",
    explanation: "`startSetup` modifies MySQL session variables for safe schema operations: it sets `sql_mode` to `NO_AUTO_VALUE_ON_ZERO` (preventing auto-increment columns from being treated specially) and sets `foreign_key_checks` to `0` (allowing table modifications without FK constraint errors). `endSetup` restores both to their defaults.",
    options: [
      { id: "q-e725-026-a", text: "`startSetup` sets the `connect_timeout` system variable to `600` (i.e., 10 minutes) to avoid lost connections for complex actions and `endSetup` returns it to the default.", isCorrect: false },
      { id: "q-e725-026-b", text: "`startSetup` sets the `sql_mode` system variable to `NO_AUTO_VALUE_ON_ZERO` and `endSetup` sets it back to `''`.", isCorrect: true },
      { id: "q-e725-026-c", text: "`startSetup` sets the `foreign_key_checks` system variable to `0` and `endSetup` sets it back to `1`.", isCorrect: true },
      { id: "q-e725-026-d", text: "`startSetup` halts any running indexes or cron tasks to ensure the subsequent process is not interfered with and `endSetup` re-triggers them.", isCorrect: false },
    ],
  }));

  // Q27 — Catalog, Checkout & APIs
  off.push(upsertQuestion({
    id: "q-e725-027", type: "SINGLE", sectionId: secCatalog.id,
    text: "An Adobe Commerce developer has created a new admin grid. Each row in the grid contains an `Actions` column that allows the merchant to either edit or delete the row. The merchant has complained that they have deleted a row accidentally and would like a confirmation dialog box to prompt them prior to deleting the selected rows.\nHow would the developer add a confirmation dialog box to the delete action of an admin grid?",
    explanation: "To add a confirmation dialog for a delete action in an admin grid's Actions column, add `'confirm'` with a title and message to the action's array definition in the column's actions class. This uses the built-in UI component confirmation mechanism.",
    options: [
      { id: "q-e725-027-a", text: "Add the following to the action's column definition in the UI component:\n\n    true\n\n`", isCorrect: false },
      { id: "q-e725-027-b", text: "Add the following to the delete action's array in the column's actions class:\n'confirm' => [\n    'title' => __('Delete Row?'),\n    'message' => __('Are you sure you want to delete the selected row(s)?'),\n],\n`", isCorrect: true },
      { id: "q-e725-027-c", text: "Add the following to the beginning of the delete action controller's `execute()` function:\nif (!$this->getRequest()->getParam('confirm')) {\n    return null;\n}\n`", isCorrect: false },
    ],
  }));

  // Q28 — Customization & Extensions
  off.push(upsertQuestion({
    id: "q-e725-028", type: "SINGLE", sectionId: secCustom.id,
    text: "The customer has requested the addition of a product attribute `category_tag_line` that, if present, will display underneath the product name on the category view page's products grid on the frontend.\nThe Adobe Commerce developer has successfully created the attribute, saved data on the product, and inserted code to display it in the correct position. However, the tag line is not appearing on the page, nor is it appearing on the product in debugging.\nWhat must the developer do to get this value to appear?",
    explanation: "For a product attribute to appear in the product listing (category pages, search results), the `used_in_product_listing` option must be set to `1` in the database. This flag ensures the attribute is included in the flat catalog product listing table used for frontend display.",
    options: [
      { id: "q-e725-028-a", text: "Add the attribute to catalog_attributes.xml:\n<?xml version=\"1.0\"?>\n\n    \n        \n    \n\n`", isCorrect: false },
      { id: "q-e725-028-b", text: "Update the attribute's option `used_in_product_listing` to `1` in the database.", isCorrect: true },
      { id: "q-e725-028-c", text: "Update the attribute's option `is_used_in_grid` to `1` in the database.", isCorrect: false },
    ],
  }));

  // Q29 — Customization & Extensions
  off.push(upsertQuestion({
    id: "q-e725-029", type: "MULTIPLE", sectionId: secCustom.id,
    text: "An Adobe Commerce Developer needs to expose data from a custom table to a product's API. There are specific permissions needed to access the data.\nWhich two steps must the Developer take to achieve this? (Choose two.)",
    explanation: "To expose custom table data in a product's API with specific permissions: (1) Add extension attributes with a join statement to the custom table in `extension_attributes.xml`, and (2) set a custom permission resource for the new extension attribute in `webapi.xml`. This combines data access with ACL-based authorization.",
    options: [
      { id: "q-e725-029-a", text: "Use plugin Magento\\Catalog\\Api\\Data\\ProductInterface to get data.", isCorrect: false },
      { id: "q-e725-029-b", text: "Set a custom permission resource for a new extension attribute.", isCorrect: true },
      { id: "q-e725-029-c", text: "Use is_allowed ProductInterface to assign appropriate permissions.", isCorrect: false },
      { id: "q-e725-029-d", text: "Add the extension attributes with a join statement to custom table.", isCorrect: true },
    ],
  }));

  // Q30 — Customization & Extensions
  off.push(upsertQuestion({
    id: "q-e725-030", type: "MULTIPLE", sectionId: secCustom.id,
    text: "A client creates a new price attribute named 'showroom price' and wants to display this price alongside the normal price on the product detail page.\nWhich two options are part of the process needed to achieve this requirement according to best practices? (Choose two.)",
    explanation: "To display a new price attribute alongside the regular price on the product detail page: (1) Create a new UI component of type form with the rendering logic, and (2) implement a data provider and add it to the UI component XML file. The data provider fetches the attribute value while the component handles rendering.",
    options: [
      { id: "q-e725-030-a", text: "Create a new component of type form and create the rendering logic.", isCorrect: true },
      { id: "q-e725-030-b", text: "Implement a data provider and add it to the ui_component XML file.", isCorrect: true },
      { id: "q-e725-030-c", text: "Add the attribute to the product_form.xml file.", isCorrect: false },
      { id: "q-e725-030-d", text: "Call the attribute directly in the template file for the product detail page.", isCorrect: false },
    ],
  }));

  // Q31 — Catalog, Checkout & APIs
  off.push(upsertQuestion({
    id: "q-e725-031", type: "MULTIPLE", sectionId: secCatalog.id,
    text: "A custom discount system must be implemented for deducting a discount amount from the cart total in a single-store instance. In order to fit to the Magento total calculations, a new total was created in the `My_Module` module.\nContent of file `etc/sales.xml` in `My_Module`:\n`\n    \n        \n            \n                \n            \n        \n    \n\n`\nContent of class `\\My\\Module\\Model\\Total\\Quote\\Discount`:\n`namespace My\\Module\\Model\\Total\\Quote;\n\nclass Discount extends \\Magento\\Quote\\Model\\Quote\\Address\\Total\\AbstractTotal\n{\n\n    public function collect(\n        \\Magento\\Quote\\Model\\Quote $quote,\n        \\Magento\\Quote\\Api\\Data\\ShippingAssignmentInterface $shippingAssignment,\n        \\Magento\\Quote\\Model\\Quote\\Address\\Total $total\n    ) {\n        $discountAmount = // some custom logic to find the discount amount\n\n        $total->setTotalAmount('discount', $discountAmount);\n        $total->setBaseTotalAmount('discount', $discountAmount);\n\n        return $this;\n    }\n}\n`\nContent of class `\\My\\Module\\Block\\Checkout\\Total`:\n`namespace My\\Module\\Block\\Checkout;\n\nclass Total extends \\Magento\\Checkout\\Block\\Total\\DefaultTotal\n{\n    protected $_template = 'My_Module::checkout/total.phtml';\n}\n`\nAfter reaching the cart, the discount is not applied to the grand total.\nWhat are two ways of fixing this? (Choose two.)",
    explanation: "To fix a custom discount appearing as 'Discount' instead of its custom label, two changes are needed: (1) Change the collector code from `'discount'` to `'my_discount'` to avoid colliding with the built-in discount collector, and (2) increase the `sort_order` in `sales.xml` to ensure proper calculation sequence.",
    options: [
      { id: "q-e725-031-a", text: "Change `'discount'` to `'my_discount'` in `\\My\\Module\\Model\\Total\\Quote\\Discount`.", isCorrect: true },
      { id: "q-e725-031-b", text: "Add `$quote->setTotalsCollectedFlag(false)` in the `collect()` method of `\\My\\Module\\Model\\Total\\Quote\\Discount`.", isCorrect: false },
      { id: "q-e725-031-c", text: "Implement the missing layout update `view/frontend/layout/checkout_cart_index.xml` in `My_module`.", isCorrect: false },
      { id: "q-e725-031-d", text: "Increase `sort_order` in `sales.xml`.", isCorrect: true },
    ],
  }));

  // Q32 — Catalog, Checkout & APIs
  off.push(upsertQuestion({
    id: "q-e725-032", type: "SINGLE", sectionId: secCatalog.id,
    text: "An Adobe Commerce Developer is tasked to add additional data, pay date, on the `Paylater` payment method. The frontend has the field `pay_date` implemented and the information is added on `additional_data` object.\nWhat would be done on backend in order to send the additional field to payment gateway?",
    explanation: "To add additional data (like `pay_date`) to a payment method, create an observer on the `payment_method_assign_data` event and set the additional information on the payment model. This is the standard Magento pattern for passing extra payment data from frontend to backend.",
    options: [
      { id: "q-e725-032-a", text: "Create a payment facade for `Paylater` method and add `pay_date` field on `valueHandlerPool`.", isCorrect: false },
      { id: "q-e725-032-b", text: "Create an extension attribute `pay_late` for OrderInterface and add an after plugin for `setPayment` method.", isCorrect: false },
      { id: "q-e725-032-c", text: "Create an observer on event `payment_method_assign_data` and set the additional information on payment model.", isCorrect: true },
    ],
  }));

  // Q33 — Catalog, Checkout & APIs
  off.push(upsertQuestion({
    id: "q-e725-033", type: "SINGLE", sectionId: secCatalog.id,
    text: "The `ExtendedOrders` module has an webapi defined in `webapi.xml`:\n`\n    \n    \n        \n    \n\n`\nThe service class `MyVendor\\ExtendedOrders\\Adminhtml\\Model\\ExtendedOrders` has `const ADMIN_RESOURCE` set to `MyVendor_ExtendedOrder::edit`.\nGiven that resource `MyVendor_ExtendedOrder::edit` does NOT imply `MyVendor_ExtendedOrder::view`, which resources would be needed to access the service?",
    explanation: "The `` node in `webapi.xml` defines the ACL permission required to access the endpoint. When `MyVendor_ExtendedOrder::view` is listed as the resource, only that specific permission is required — `MyVendor_ExtendedOrder::edit` is a separate, unrelated permission.",
    options: [
      { id: "q-e725-033-a", text: "Both `MyVendor_ExtendedOrder::view` and`MyVendor_ExtendedOrder::edit`.", isCorrect: false },
      { id: "q-e725-033-b", text: "Only `MyVendor_ExtendedOrder::edit`.", isCorrect: false },
      { id: "q-e725-033-c", text: "Only `MyVendor_ExtendedOrder::view`.", isCorrect: true },
    ],
  }));

  // Q34 — Catalog, Checkout & APIs
  off.push(upsertQuestion({
    id: "q-e725-034", type: "SINGLE", sectionId: secCatalog.id,
    text: "An Adobe Commerce developer has created a new shipping carrier. Everything has been implemented and the `collectRates()` and `getAllowedMethods()` functions can be seen below. The new shipping method has been enabled and is fully configured with a flat fee of $10 per order.\n`public function collectRates(RateRequest $request) {\n    if (!$this->getConfigFlag('active')) {\n        return false;\n    }\n\n    $result = $this->rateResultFactory->create();\n    $method = $this->rateMethodFactory->create();\n\n    $method->setCarrier($this->_code);\n    $method->setCarrierTitle($this->getConfigData('title'));\n    $method->setMethod($this->_code);\n    $method->setMethodTitle($this->getConfigData('name'));\n\n    $method->setPrice(10);\n    $method->setCost(10);\n\n    return $result;\n}\n`\n`public function getAllowedMethods() {\n    return [$this->_code => $this->getConfigData('name')];\n}\n`\nGiven the above code, what new shipping methods would be available to customers?",
    explanation: "If a new shipping carrier appears in the configuration but doesn't show up during checkout, it means `collectRates()` returned no shipping rates. The method must return a `Result` object containing at least one `Method` with the rate details for the carrier to appear as a shipping option.",
    options: [
      { id: "q-e725-034-a", text: "A single rate as configured in the new shipping carrier's system configurations.", isCorrect: false },
      { id: "q-e725-034-b", text: "None, no shipping rates have been returned in `collectRates()`.", isCorrect: true },
      { id: "q-e725-034-c", text: "Any number of rates could have been returned in `collectRates()`.", isCorrect: false },
    ],
  }));

  // Q35 — Testing & Quality
  off.push(upsertQuestion({
    id: "q-e725-035", type: "SINGLE", sectionId: secTest.id,
    text: "An Adobe Commerce developer is writing an integration test and needs to initialize the `\\MyVendor\\MyModule\\Model\\MyClass` class in order to test its logic. The class has one constructor parameter:\n`\\Magento\\Customer\\Api\\CustomerRepositoryInterface $customerRepository`\nThe test class and the test method inside have been written and the test framework's object manager has been instantiated into the `$objectManager` variable.\nHow is the `MyClass` class initialized?",
    explanation: "In integration tests, use `ObjectManager::create()` to instantiate the class under test with real dependencies injected by the DI container. This tests the actual class behavior with its real collaborators, which is the purpose of integration testing (as opposed to unit testing with mocks).",
    options: [
      { id: "q-e725-035-a", text: "$repository = $objectManager->instantiatePreference(\\Magento\\Customer\\Api\\CustomerRepositoryInterface::class);\n$myClass = new \\MyVendor\\MyModule\\Model\\MyClass($repository);\n`", isCorrect: false },
      { id: "q-e725-035-b", text: "$repository = $this->getMockClass(\\Magento\\Customer\\Api\\CustomerRepositoryInterface::class);\n$myClass = $objectManager->create(\\MyVendor\\MyModule\\Model\\MyClass::class, ['customerRepository' => $repository]);\n`", isCorrect: false },
      { id: "q-e725-035-c", text: "$myClass = $objectManager->create(\\MyVendor\\MyModule\\Model\\MyClass::class);\n`", isCorrect: true },
    ],
  }));

  // Q36 — Catalog, Checkout & APIs
  off.push(upsertQuestion({
    id: "q-e725-036", type: "SINGLE", sectionId: secCatalog.id,
    text: "An Adobe Commerce developer is creating a new product type. Given the requirements for this new product type they have decided that it is not suitable for products of this new type to be selected for use as part of Bundle products, Configurable products, or Grouped products.\nWhat would the developer do to ensure their new product type cannot be added to Bundle products, Configurable products, or Grouped products?",
    explanation: "New product types cannot be added to composite products (bundle, grouped, configurable) by default. The `` node in `product_types.xml` explicitly lists which types can be part of composite products, and new types are not included unless specifically added.",
    options: [
      { id: "q-e725-036-a", text: "Set the `composable` attribute to `false` in the new product type definition in `etc/product_types.xml`:\n\n    ...\n\n`", isCorrect: false },
      { id: "q-e725-036-b", text: "Nothing - new product types cannot be added to composite products by default.", isCorrect: true },
      { id: "q-e725-036-c", text: "Add the new product type to the `` node, setting its value to `false`:\n\n    false\n\n`", isCorrect: false },
    ],
  }));

  // Q37 — Catalog, Checkout & APIs
  off.push(upsertQuestion({
    id: "q-e725-037", type: "SINGLE", sectionId: secCatalog.id,
    text: "An Adobe Commerce developer wants to limit the number of messages that can be processed during a single run to avoid memory issues.\nHow would they go about limiting the number of messages to 100 for a process?",
    explanation: "To limit the number of messages processed during a single queue consumer run, set the `maxMessages` attribute to `100` on the `` element in `queue_consumer.xml`. This prevents memory exhaustion by capping how many messages are processed before the consumer exits.",
    options: [
      { id: "q-e725-037-a", text: "Set the xml attribute `maxMessages` to `100` on the `handler` in communication.xml.", isCorrect: false },
      { id: "q-e725-037-b", text: "Set the global configuration `cron_consumers_runner/max_messages` to `100`.", isCorrect: false },
      { id: "q-e725-037-c", text: "Set the xml attribute `maxMessages` to `100` on the `consumer` in queue_consumer.xml.", isCorrect: true },
    ],
  }));

  // Q38 — Catalog, Checkout & APIs
  off.push(upsertQuestion({
    id: "q-e725-038", type: "SINGLE", sectionId: secCatalog.id,
    text: "A merchant requires a new export option for the order grid. They want to export orders and their total paid amount in a `tab` separated `.txt` file in order to reconcile this information with their bank accounts.\nHow would an Adobe Commerce developer achieve this?",
    explanation: "To add a custom export format (like `.txt`) to the order grid: (1) Add a new export option to the `exportButton` node in `sales_order_grid.xml` pointing to a custom converter class, and (2) implement the converter class that formats the data as needed.",
    options: [
      { id: "q-e725-038-a", text: "\nCreate a new Controller `MyVendor\\MyModule\\Controller\\Adminhtml\\Export\\GridToTxt` which inherits from the `Magento\\Sales\\Model\\Export\\GridToCsv` class.\nAdd a new export option to the `exportButton` node within the `sales_order_grid.xml` pointing to `MyVendor\\MyModule\\Controller\\Adminhtml\\Export\\GridToTxt`.\nOverride the `execute()` method and change the file separator to `tab` and the file extension to `.txt`.\n", isCorrect: false },
      { id: "q-e725-038-b", text: "\nAdd a new export option to the `exportButton` node within the `sales_order_grid.xml` with `name=\"gridToTxt\"`.\nCreate a new converter class `MyVendor\\MyModule\\Model\\Export\\ConvertToTxt`.\nAdd a Virtual Type for the `MyVendor\\MyModule\\Model\\Export\\ConvertToTxt` class specifying `fileType=\".txt\"` and `fileSeparator=\"tab\"`.\nCreate a controller `MyVendor\\MyModule\\Controller\\Adminhtml\\Export\\GridToTxt`.\n", isCorrect: false },
      { id: "q-e725-038-c", text: "\nAdd a new export option to the `exportButton` node within the `sales_order_grid.xml` pointing to a custom `MyVendor\\MyModule\\Controller\\Adminhtml\\Export\\GridToTxt` controller.\nCreate a new converter `ConvertToTxt` and add the needed logic to within a `getTxtFile()` method.\nCall the `getTxtFile()` method within the `MyVendor\\MyModule\\Controller\\Adminhtml\\Export\\GridToTxt` controller.\n", isCorrect: true },
    ],
  }));

  // Q39 — Catalog, Checkout & APIs
  off.push(upsertQuestion({
    id: "q-e725-039", type: "MULTIPLE", sectionId: secCatalog.id,
    text: "An Adobe Commerce Developer is tasked with creating a custom shipping method which requires specific address validations.\nAccording to best practices, which two steps must the Developer take to implement and integrate these validations into the custom shipping method? (Choose two.)",
    explanation: "For custom shipping method address validation: (1) Add the validation component in the checkout page layout XML where the carrier matches the actual shipping method, and (2) create a `.js` file in the module's `view/frontend/web/js/model` directory implementing `getRules()`. This follows Magento's checkout validation architecture.",
    options: [
      { id: "q-e725-039-a", text: "Add the validation component in the checkout page layout XML file where the carrier matches the actual carrier code.", isCorrect: true },
      { id: "q-e725-039-b", text: "Edit the default application code to include the validation for the sake of compatibility, upgradability, and easy maintenance.", isCorrect: false },
      { id: "q-e725-039-c", text: "Create a mixin for the default Magento validation.js file to include the validation logic for the custom shipping method.", isCorrect: false },
      { id: "q-e725-039-d", text: "Create a .js file in the module's view/frontend/web/js/model directory that implements the getRules() method.", isCorrect: true },
    ],
  }));

  // Q40 — Catalog, Checkout & APIs
  off.push(upsertQuestion({
    id: "q-e725-040", type: "SINGLE", sectionId: secCatalog.id,
    text: "A third-party vendor has developed a module to add blogging functionality to Adobe Commerce. The module creates a new database table to store the blog posts and includes an Admin grid to display the list of all posts.\nWhich action, at a minimum, would an Adobe Commerce developer take in order to add a search component to the grid that searches the contents of the `post_content` column?",
    explanation: "To add full-text search to an admin grid, add a `` node to the grid's `` node in the UI component XML. This enables the search box that searches across all searchable columns in the grid.",
    options: [
      { id: "q-e725-040-a", text: "Add a `` node to the `` node.", isCorrect: false },
      { id: "q-e725-040-b", text: "Add a `` node to the grid's `` node.", isCorrect: true },
      { id: "q-e725-040-c", text: "Add a `` and create a fulltext index for the `post_content` column in the database table.", isCorrect: false },
    ],
  }));

  // Q41 — Catalog, Checkout & APIs
  off.push(upsertQuestion({
    id: "q-e725-041", type: "SINGLE", sectionId: secCatalog.id,
    text: "An Adobe Commerce developer is tasked to perform a backend validation in the quote before placing orders.\nConsidering the upgradeability and scalability, what would be the implementation?",
    explanation: "To perform backend validation on a quote before placing an order, create a new `QuoteValidationComposite` validation rule in `etc/di.xml` by adding a custom class to the composite validator. This is the recommended architectural pattern — it integrates cleanly with Magento's quote validation pipeline.",
    options: [
      { id: "q-e725-041-a", text: "Create an observer using the event `checkout_order_place_before` and perform the validation.", isCorrect: false },
      { id: "q-e725-041-b", text: "Create a new `QuoteValidationComposite` validation rule in the `etc/di.xml` file adding the custom class to the node `validationRules` which implements the interface `Magento\\Quote\\Model\\ValidationRules\\QuoteValidationRuleInterface` using the method validate.", isCorrect: true },
      { id: "q-e725-041-c", text: "Create a Plugin using the method `beforePlaceOrder` for the `Magento\\Quote\\Model\\QuoteManagement::placeOrder` in the `etc/di.xml` and perform the validation.", isCorrect: false },
    ],
  }));

  // Q42 — Catalog, Checkout & APIs
  off.push(upsertQuestion({
    id: "q-e725-042", type: "SINGLE", sectionId: secCatalog.id,
    text: "An Adobe Commerce developer is developing a service that creates a shipment for a given order. The default stock source must always be used to fulfill shipments.\nWhat implementation of the `setDefaultStockSource()` method is required to complete the code below?\n`public function createShipment(\\Magento\\Sales\\Model\\Order $order)\n{\n    $shipment = $this->shipmentFactory->create($order);\n\n    $this->setDefaultStockSource($shipment); // Choose implementation \n\n    $shipment->register();\n}\n`",
    explanation: "To get the default stock source for shipment creation, inject `\\Magento\\InventoryCatalogApi\\Api\\DefaultSourceProviderInterface` via constructor DI and use its `getCode()` method. This is the proper way to programmatically retrieve the default source code in MSI.",
    options: [
      { id: "q-e725-042-a", text: "Such implementation is not required because default stock source is used unless otherwise specified.", isCorrect: false },
      { id: "q-e725-042-b", text: "`/**\n * @var \\Magento\\InventoryCatalogApi\\Api\\DefaultSourceProviderInterface\n */\nprivate $defaultSourceProvider;\n\nprotected function setDefaultStockSource(\\Magento\\Sales\\Api\\Data\\ShipmentInterface $shipment)\n{\n    $defaultSourceCode = $this->defaultSourceProvider->getCode();\n    $shipment->getExtensionAttributes()->setSourceCode($defaultSourceCode);\n}\n`", isCorrect: true },
      { id: "q-e725-042-c", text: "`protected function setDefaultStockSource(\\Magento\\Sales\\Api\\Data\\ShipmentInterface $shipment)\n{\n    $shipment->setUseDefaultStockSource(true);\n}\n`", isCorrect: false },
    ],
  }));

  // Q43 — Cloud Infrastructure
  off.push(upsertQuestion({
    id: "q-e725-043", type: "MULTIPLE", sectionId: secCloud.id,
    text: "An Adobe Commerce Developer is working on cloud infrastructure Pro architecture and wants to create two environments for feature testing purposes.\nWhich two options should the Developer use to accomplish this? (Choose two.)",
    explanation: "On Adobe Commerce Cloud Pro architecture, to create additional development environments: (1) Create a new development branch from the integration environment, and (2) create a support ticket to request an additional active environment slot, since Pro plans have a limited number of active environments.",
    options: [
      { id: "q-e725-043-a", text: "Create a new development branch from the integration environment.", isCorrect: true },
      { id: "q-e725-043-b", text: "Deactivate one active development branch and create a new one from the staging environment.", isCorrect: false },
      { id: "q-e725-043-c", text: "Create a support ticket to add an additional active environment for development.", isCorrect: true },
      { id: "q-e725-043-d", text: "Create a new development branch from the production environment.", isCorrect: false },
    ],
  }));

  // Q44 — Cloud Infrastructure
  off.push(upsertQuestion({
    id: "q-e725-044", type: "SINGLE", sectionId: secCloud.id,
    text: "An Adobe Commerce project on cloud (Starter plan) is reaching mysql disk space limit.\nWhat file should an Adobe Commerce developer edit to increase the disk space limit for mysql?",
    explanation: "On Adobe Commerce Cloud Starter plan, MySQL disk space is configured in `.magento/services.yaml`. This file defines service configurations including database disk allocation, Redis, Elasticsearch/OpenSearch, and other services.",
    options: [
      { id: "q-e725-044-a", text: ".magento.env.yaml", isCorrect: false },
      { id: "q-e725-044-b", text: ".magento/services.yaml", isCorrect: true },
      { id: "q-e725-044-c", text: ".magento/mysql.yaml", isCorrect: false },
    ],
  }));

  // Q45 — Cloud Infrastructure
  off.push(upsertQuestion({
    id: "q-e725-045", type: "SINGLE", sectionId: secCloud.id,
    text: "An Adobe Commerce Developer is responsible for managing environment backups. Their focus is to integrate automated backup processes for starter environments.\nWhich step should the Developer take to configure and manage these backups effectively?",
    explanation: "To set up automated backups on Adobe Commerce Cloud, configure a cron job that periodically executes the `magento-cloud snapshot:create` command. This creates environment snapshots that can be restored later.",
    options: [
      { id: "q-e725-045-a", text: "Set up a cron job to periodically execute the `magento-cloud snapshot:create` command.", isCorrect: true },
      { id: "q-e725-045-b", text: "Set up a cron job to periodically execute the `magento-cloud create:backup` command.", isCorrect: false },
      { id: "q-e725-045-c", text: "Select the backup button in the Cloud Console and configure the frequency of the backup.", isCorrect: false },
    ],
  }));

  // Q46 — Cloud Infrastructure
  off.push(upsertQuestion({
    id: "q-e725-046", type: "SINGLE", sectionId: secCloud.id,
    text: "An Adobe Commerce developer needs to increase the logging granularity after a failed deployment.\nWith no idea of what step the deployment could be breaking at, which variable does the developer need to set globally?",
    explanation: "To increase logging granularity after a failed deployment, set `MIN_LOGGING_LEVEL: debug` in the `.magento.env.yaml` file. This lowers the minimum logging threshold to capture debug-level messages from the deployment process.",
    options: [
      { id: "q-e725-046-a", text: "LOG_LEVEL: debug", isCorrect: false },
      { id: "q-e725-046-b", text: "MIN_LOGGING_LEVEL: debug", isCorrect: true },
      { id: "q-e725-046-c", text: "DEBUG_LOG: true", isCorrect: false },
    ],
  }));

  // Q47 — Cloud Infrastructure
  off.push(upsertQuestion({
    id: "q-e725-047", type: "SINGLE", sectionId: secCloud.id,
    text: "A developer is creating a new cloud environment variable for storing the API token for a third-party service.\nWhat is the CLI command option that can be used to change the visibility of the variable in the Project Web Interface?",
    explanation: "When creating cloud environment variables for sensitive data like API tokens, use the `--sensitive true` flag. This marks the variable as sensitive, preventing it from being visible in the Cloud Console UI or API responses.",
    options: [
      { id: "q-e725-047-a", text: "--readable false", isCorrect: false },
      { id: "q-e725-047-b", text: "--visible false", isCorrect: false },
      { id: "q-e725-047-c", text: "--sensitive true", isCorrect: true },
      { id: "q-e725-047-d", text: "--hidden true", isCorrect: false },
    ],
  }));

  // Q48 — Cloud Infrastructure
  off.push(upsertQuestion({
    id: "q-e725-048", type: "SINGLE", sectionId: secCloud.id,
    text: "An Adobe Commerce developer needs to set up the local development environment after instance setup.\nHow can the developer run post-deploy hooks as part of the setup, assuming all prerequisites have already been installed?",
    explanation: "To run deploy hooks in the local development environment, use the `--run-deploy-hooks` option with the `magento-cloud build` command. Post-deploy hooks are not run automatically during local builds.",
    options: [
      { id: "q-e725-048-a", text: "Set --post-deploy option in “magento-cloud build” command", isCorrect: false },
      { id: "q-e725-048-b", text: "Post-deploy hooks are run automatically as part of the “magento-cloud build” command", isCorrect: false },
      { id: "q-e725-048-c", text: "Set --run-deploy-hooks option in “magento-cloud build” command", isCorrect: true },
    ],
  }));

  // Q49 — Cloud Infrastructure
  off.push(upsertQuestion({
    id: "q-e725-049", type: "SINGLE", sectionId: secCloud.id,
    text: "How should an Adobe Commerce developer add routes on a cloud environment in the Project Web interface?",
    explanation: "In the Adobe Commerce Cloud Project Web interface, to add routes: select 'Configure environment', then add the route after selecting the 'Routes' tab. This provides a UI for editing the `routes.yaml` configuration.",
    options: [
      { id: "q-e725-049-a", text: "Select “Configure environment”, and then add route after selecting the “Routes” tab", isCorrect: true },
      { id: "q-e725-049-b", text: "Select “Configure environment”, and then in the \"Variable\" tab define the route", isCorrect: false },
      { id: "q-e725-049-c", text: "Add route to the project variable MAGENTO_PROJECT_ROUTES", isCorrect: false },
      { id: "q-e725-049-d", text: "Add route to the global variable MAGENTO_CLOUD_ROUTES", isCorrect: false },
    ],
  }));

  // Q50 — Cloud Infrastructure
  off.push(upsertQuestion({
    id: "q-e725-050", type: "MULTIPLE", sectionId: secCloud.id,
    text: "An Adobe Commerce developer is trying to add an additional domain to Adobe Commerce Cloud, and has done all domain-related configurations in the Admin Panel.\nWhich two variables does the developer need to set in the virtual host to point the domain to the correct website/store view? (Choose two.)",
    explanation: "When adding an additional domain to Adobe Commerce Cloud, the `MAGE_RUN_CODE` and `MAGE_RUN_TYPE` environment variables must be configured. `MAGE_RUN_CODE` specifies which store/website code to use, and `MAGE_RUN_TYPE` specifies whether it's a `store` or `website`.",
    options: [
      { id: "q-e725-050-a", text: "MAGE_RUN_CODE", isCorrect: true },
      { id: "q-e725-050-b", text: "MAGE_RUN_TYPE", isCorrect: true },
      { id: "q-e725-050-c", text: "MAGE_VAR_WEBSITE", isCorrect: false },
      { id: "q-e725-050-d", text: "MAGE_VAR_STORE_VIEW", isCorrect: false },
    ],
  }));

  // ─── Practice Test ─────────────────────────────────────────────────────────

  const allQuestions = await Promise.all(off);
  console.log(`Created/updated ${allQuestions.length} questions.`);

  await prisma.practiceTestQuestion.deleteMany({
    where: { practiceTestId: "pt-official-e725" },
  });

  await prisma.practiceTest.upsert({
    where: { id: "pt-official-e725" },
    update: { questionCount: allQuestions.length },
    create: {
      id: "pt-official-e725",
      certificationId: cert.id,
      title: "Official Practice Exam",
      type: "OFFICIAL",
      questionCount: allQuestions.length,
    },
  });

  for (let i = 0; i < allQuestions.length; i++) {
    await prisma.practiceTestQuestion.create({
      data: {
        practiceTestId: "pt-official-e725",
        questionId: allQuestions[i].id,
        position: i + 1,
      },
    });
  }

  console.log(`Linked ${allQuestions.length} questions to Official Practice Exam.`);
  console.log("AD0-E725 seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
