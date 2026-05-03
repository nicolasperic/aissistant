import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding AD0-E722 Architect Master practice tests...");

  // ─── Certification ─────────────────────────────────────────────────────────

  const cert = await prisma.certification.upsert({
    where: { id: "cert-ad0-e722" },
    update: {},
    create: {
      id: "cert-ad0-e722",
      name: "Adobe Commerce Architect Master",
      code: "AD0-E722",
      provider: "Adobe",
      description:
        "Validates expertise in designing and implementing Adobe Commerce architecture, including B2B, performance optimization, cloud deployment, third-party integrations, and testing strategies.",
      totalQuestions: 50,
      passingScore: 34,
      timeLimitMinutes: 110,
    },
  });

  // ─── Sections ──────────────────────────────────────────────────────────────

  const [secArch, secB2b, secPerf, secCloud, secInteg, secTest] =
    await Promise.all([
      prisma.certSection.upsert({
        where: { id: "sec722-arch" },
        update: { name: "Architecture & Design", percentage: 35 },
        create: { id: "sec722-arch", certificationId: cert.id, name: "Architecture & Design", percentage: 35 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec722-b2b" },
        update: { name: "B2B & Inventory", percentage: 10 },
        create: { id: "sec722-b2b", certificationId: cert.id, name: "B2B & Inventory", percentage: 10 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec722-perf" },
        update: { name: "Performance & Caching", percentage: 18 },
        create: { id: "sec722-perf", certificationId: cert.id, name: "Performance & Caching", percentage: 18 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec722-cloud" },
        update: { name: "Cloud & Deployment", percentage: 22 },
        create: { id: "sec722-cloud", certificationId: cert.id, name: "Cloud & Deployment", percentage: 22 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec722-integ" },
        update: { name: "Integration & APIs", percentage: 10 },
        create: { id: "sec722-integ", certificationId: cert.id, name: "Integration & APIs", percentage: 10 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec722-test" },
        update: { name: "Testing & Quality", percentage: 5 },
        create: { id: "sec722-test", certificationId: cert.id, name: "Testing & Quality", percentage: 5 },
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

  // ─── 51 Official Questions ─────────────────────────────────────────────────

  const off: ReturnType<typeof upsertQuestion>[] = [];

  // Q1 — B2B / MSI
  off.push(upsertQuestion({
    id: "q-e722-001", type: "SINGLE", sectionId: secB2b.id,
    text: "A client has a B2B website and has a requirement for products source selection based on the client's warehouse location. The Adobe Commerce architect noticed that the requirement cannot be fulfilled by the out-of-box source selection algorithms. Which interface should they implement to develop a custom Source Selection Algorithm (SSA)?",
    explanation: "`SourceSelectionInterface` represents a single source-selection result (a result item). To implement a custom SSA algorithm you must implement `SourceSelectionAlgorithmInterface`, not `SourceSelectionInterface` or `SourceSelectionServiceInterface`. The service interface is the entry-point that dispatches algorithms, not the algorithm itself.",
    options: [
      { id: "q-e722-001-a", text: "Implement `SourceSelectionServiceInterface`", isCorrect: false },
      { id: "q-e722-001-b", text: "Implement `SourceSelectionAlgorithmInterface`", isCorrect: false },
      { id: "q-e722-001-c", text: "Implement `SourceSelectionInterface`", isCorrect: true },
    ],
  }));

  // Q2 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-002", type: "SINGLE", sectionId: secArch.id,
    text: "In Adobe Commerce, how are layout handles used to modify the layout of a page?",
    explanation: "Layout handles are XML identifiers matched at runtime. During page rendering, Magento collects all matching handles (e.g. `default`, `catalog_product_view`) and merges their layout instructions to produce the final HTML output.",
    options: [
      { id: "q-e722-002-a", text: "Layout handles are assigned directly to CMS pages", isCorrect: false },
      { id: "q-e722-002-b", text: "Layout handles are processed during page rendering to generate the final HTML", isCorrect: true },
      { id: "q-e722-002-c", text: "Layout handles are applied directly to the page template", isCorrect: false },
    ],
  }));

  // Q3 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-003", type: "SINGLE", sectionId: secArch.id,
    text: "A Commerce architect wants to build a custom command. This will add a new command to CLI based on passing on the argument from the XML level to the class using `etc/di.xml` file with the following content:\n\n```xml\n<type name=\"---------------------\">\n</type>\n```\n\nWhich class name should be used?",
    explanation: "`Magento\\Framework\\Console\\CommandList` is the correct class to reference in `di.xml` when registering custom CLI commands via constructor argument injection. The other options (`CommandList\\Console`, `Console`, `CommandList` alone) are not valid class names in the framework.",
    options: [
      { id: "q-e722-003-a", text: "`Magento\\Framework\\CommandList\\Console`", isCorrect: false },
      { id: "q-e722-003-b", text: "`Magento\\Framework\\Console\\CommandList`", isCorrect: true },
      { id: "q-e722-003-c", text: "`Magento\\Framework\\Console`", isCorrect: false },
      { id: "q-e722-003-d", text: "`Magento\\Framework\\CommandList`", isCorrect: false },
    ],
  }));

  // Q4 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-004", type: "SINGLE", sectionId: secArch.id,
    text: "The client's business requires efficient handling of high website traffic, seamless integration with third-party payment gateways, and personalized customer experiences. Which solution would the Adobe Commerce Architect recommend to meet these requirements?",
    explanation: "The architect's primary role is to analyze and understand the unique business requirements before proposing solutions. Maximizing extensions or prioritizing aesthetics over business needs are anti-patterns that lead to over-engineering or misaligned solutions.",
    options: [
      { id: "q-e722-004-a", text: "Placing a primary focus on visual attractiveness of the interface, even if it contradicts business needs", isCorrect: false },
      { id: "q-e722-004-b", text: "Analyzing and understanding unique business requirements to develop the most suitable and efficient solutions", isCorrect: true },
      { id: "q-e722-004-c", text: "Using the maximum number of extensions and modules to enrich functionality", isCorrect: false },
    ],
  }));

  // Q5 — B2B (MULTIPLE)
  off.push(upsertQuestion({
    id: "q-e722-005", type: "MULTIPLE", sectionId: secB2b.id,
    text: "A client gave an Adobe Commerce architect a list of the company's previous users whose accounts are no longer required to be kept on the company's B2B site. The architect removed those accounts. Which two changes would happen after deleting those accounts? (Choose two.)",
    explanation: "When a B2B company user is deleted: (1) their open quotes are locked and set to Closed status — they are NOT removed. (2) Any child users under the deleted user are re-assigned to the deleted user's parent, not to the Admin user.",
    options: [
      { id: "q-e722-005-a", text: "The system will remove the deleted users' sales order quotes.", isCorrect: false },
      { id: "q-e722-005-b", text: "The system locks the deleted users' sales order quotes and changes their status to Closed.", isCorrect: true },
      { id: "q-e722-005-c", text: "If the specified company user has child users, the system re-assigns the child users to the Admin user.", isCorrect: false },
      { id: "q-e722-005-d", text: "If the specified company user has child users, the system re-assigns the child users to the parent of the deleted user.", isCorrect: true },
    ],
  }));

  // Q6 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-006", type: "SINGLE", sectionId: secArch.id,
    text: "A developer needs to iterate over a collection of entities called `ItemCollection` in a custom class of a module. What is the recommended way to create an instance of the `ItemCollection`?",
    explanation: "The correct approach is to inject `ItemCollectionFactory` (generated automatically by Magento for any collection) via the constructor and call `->create()`. Using `new` bypasses DI, and using `ObjectManager` directly is an anti-pattern. Creating a factory manually defeats the purpose of the DI framework.",
    options: [
      { id: "q-e722-006-a", text: "Inject the `ItemCollectionFactory` dependency and use it to create the instance", isCorrect: true },
      { id: "q-e722-006-b", text: "Create an `ItemCollectionFactory` first and then use it to create the instance", isCorrect: false },
      { id: "q-e722-006-c", text: "Use the `new` keyword to create the instance", isCorrect: false },
      { id: "q-e722-006-d", text: "Use the `ObjectManager` to create the instance", isCorrect: false },
    ],
  }));

  // Q7 — Performance
  off.push(upsertQuestion({
    id: "q-e722-007", type: "SINGLE", sectionId: secPerf.id,
    text: "An external integration is using a GraphQL API to communicate with an Adobe Commerce application. The application is configured to use the Fastly caching service. Which header should be handled by Fastly VCL so that the GraphQL request can be cached?",
    explanation: "`X-Magento-Cache-Id` is the cache key header introduced for GraphQL caching. Fastly VCL must be configured to vary on this header to cache GraphQL responses per unique query context. `X-Magento-Vary` is used for page cache, not GraphQL.",
    options: [
      { id: "q-e722-007-a", text: "`X-Magento-Vary`", isCorrect: false },
      { id: "q-e722-007-b", text: "`Authorization Bearer`", isCorrect: false },
      { id: "q-e722-007-c", text: "`X-Magento-Cache-Id`", isCorrect: true },
    ],
  }));

  // Q8 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-008", type: "SINGLE", sectionId: secArch.id,
    text: "A client has a requirement to create an additional regional website in the UK, with the currency in GBP. There is an existing US website with the default currency in USD. After the store launch of the new UK website, the administrator noticed the Sales Total Report is showing 0.00. How can an Adobe Commerce Architect resolve this issue?",
    explanation: "Sales reports aggregate amounts using currency conversion rates. When GBP is added as a currency but no exchange rate between GBP and USD is configured, all amounts convert to 0.00. Configuring the currency rate for GBP↔USD resolves the report.",
    options: [
      { id: "q-e722-008-a", text: "Confirm all Orders are Shipped", isCorrect: false },
      { id: "q-e722-008-b", text: "Configure currency rates for GBP and USD", isCorrect: true },
      { id: "q-e722-008-c", text: "Refresh Statistics for Total Invoice", isCorrect: false },
    ],
  }));

  // Q9 — Integration
  off.push(upsertQuestion({
    id: "q-e722-009", type: "SINGLE", sectionId: secInteg.id,
    text: "There is a custom contact form in the storefront that contains CAPTCHA/reCAPTCHA, which needs to be submitted through GraphQL. In this case, what needs to be included in the HTTP Header for protected mutation API calls along with Admin or Bearer token?",
    explanation: "GraphQL mutations protected by CAPTCHA or reCAPTCHA require the token to be passed via the `X-Captcha` or `X-ReCaptcha` HTTP header respectively, in addition to the authorization token. OAuth tokens and integration tokens are not used for CAPTCHA verification.",
    options: [
      { id: "q-e722-009-a", text: "`X-Captcha` / `X-ReCaptcha`", isCorrect: true },
      { id: "q-e722-009-b", text: "OAuth Token", isCorrect: false },
      { id: "q-e722-009-c", text: "Integration authorization tokens", isCorrect: false },
    ],
  }));

  // Q10 — Integration
  off.push(upsertQuestion({
    id: "q-e722-010", type: "SINGLE", sectionId: secInteg.id,
    text: "A client wants to integrate their Adobe Commerce store with an external ERP system for real-time inventory updates. Which option would be most efficient for this integration?",
    explanation: "Using the Magento Inventory Management API with custom middleware provides a structured, maintainable integration point that leverages Magento's MSI (Multi-Source Inventory) layer. Webhooks with custom scripts are fragile, pre-built ERP connectors may not exist, and CSV imports are batch-only (not real-time).",
    options: [
      { id: "q-e722-010-a", text: "Webhooks and custom data synchronization scripts", isCorrect: false },
      { id: "q-e722-010-b", text: "Magento Inventory Management API and custom middleware", isCorrect: true },
      { id: "q-e722-010-c", text: "Inventory source API and pre-built ERP connectors", isCorrect: false },
      { id: "q-e722-010-d", text: "CSV import/export and scheduled data feeds", isCorrect: false },
    ],
  }));

  // Q11 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-011", type: "SINGLE", sectionId: secArch.id,
    text: "An eCommerce store wants to leverage customer data to provide personalized experiences and targeted marketing campaigns. What should an Adobe Commerce architect recommend for implementing personalization features to enhance customer engagement?",
    explanation: "Utilizing customer data to create personalized product recommendations is the most direct and effective personalization strategy in Adobe Commerce. Email campaigns, geo-targeting, and dynamic content are supplementary tactics but not the primary recommendation for product-level personalization.",
    options: [
      { id: "q-e722-011-a", text: "Personalize email marketing campaigns based on customer behavior and purchase history", isCorrect: false },
      { id: "q-e722-011-b", text: "Employ geo-targeting to deliver localized content and offers to customers based on their location", isCorrect: false },
      { id: "q-e722-011-c", text: "Utilize customer data to create personalized product recommendations", isCorrect: true },
      { id: "q-e722-011-d", text: "Implement dynamic content rendering to display relevant content based on user preferences", isCorrect: false },
    ],
  }));

  // Q12 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-012", type: "SINGLE", sectionId: secArch.id,
    text: "You want to change the increment ID for a Commerce database (DB) entity, such as an order, invoice, or credit memo. What is the correct ALTER TABLE SQL statement?",
    explanation: "Adobe Commerce uses sequence tables named `sequence_{entity_type}_{store_id}` (with underscores, keyed by store_id). The correct statement is `ALTER TABLE sequence_{entity_type}_{store_id} AUTO_INCREMENT = {new_value};`. Using hyphens or `website_id` are wrong.",
    options: [
      { id: "q-e722-012-a", text: "`ALTER TABLE sequence_{entity_type}_{store_id} AUTO_INCREMENT = {new_increment_value};`", isCorrect: true },
      { id: "q-e722-012-b", text: "`ALTER TABLE sequence-{entity_type}-{store_id} AUTO_INCREMENT = {new_increment_value};`", isCorrect: false },
      { id: "q-e722-012-c", text: "`ALTER TABLE sequence_{entity_type}_{website_id} AUTO_INCREMENT = {new_increment_value};`", isCorrect: false },
    ],
  }));

  // Q13 — Performance
  off.push(upsertQuestion({
    id: "q-e722-013", type: "SINGLE", sectionId: secPerf.id,
    text: "For Adobe Commerce's GraphQL APIs, how should an architect optimize data transformation performance while dealing with large datasets?",
    explanation: "Query batching groups multiple GraphQL requests into a single HTTP round-trip, dramatically reducing network overhead when dealing with large datasets. Edge computing, serverless, and compression address different concerns and are not the primary optimization strategy for GraphQL data transformation.",
    options: [
      { id: "q-e722-013-a", text: "Implementing query batching to reduce round-trips", isCorrect: true },
      { id: "q-e722-013-b", text: "Employing serverless computing for parallel processing", isCorrect: false },
      { id: "q-e722-013-c", text: "Using edge computing for data localization", isCorrect: false },
      { id: "q-e722-013-d", text: "Applying compression algorithms to reduce payload size", isCorrect: false },
    ],
  }));

  // Q14 — Architecture (MULTIPLE)
  off.push(upsertQuestion({
    id: "q-e722-014", type: "MULTIPLE", sectionId: secArch.id,
    text: "An Architect wants to create a new configuration type in Magento. Which two steps are necessary to complete this successfully? (Choose two.)",
    explanation: "Creating a new configuration type requires: (1) defining an XSD schema that validates the XML structure and generating the XML file, and (2) creating a loader (reader) class that knows how to load and merge the configuration files. A new module is not strictly required, and `config.xml` is for system config, not custom config types.",
    options: [
      { id: "q-e722-014-a", text: "Create a new module and include required settings in `config.xml`", isCorrect: false },
      { id: "q-e722-014-b", text: "Define the XSD schema and generate the XML file with the appropriate structure", isCorrect: true },
      { id: "q-e722-014-c", text: "Create an XML specification using `DOMDocument` and save it in the appropriate directory", isCorrect: false },
      { id: "q-e722-014-d", text: "Create a loader for the new configuration type", isCorrect: true },
    ],
  }));

  // Q15 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-015", type: "SINGLE", sectionId: secArch.id,
    text: "A client reports that a product image is not appearing when a product is added to the cart. After debugging, the Adobe Commerce Architect discovers that this issue is specific to configurable products. How should the issue be resolved?",
    explanation: "For configurable products, the cart displays the selected variant's image if the thumbnail is set to 'Product Thumbnail Itself' in Admin > Stores > Configuration > Sales > Checkout > Shopping Cart. Setting it to 'Parent Product Thumbnail' would show the configurable parent image, not the selected variant.",
    options: [
      { id: "q-e722-015-a", text: "Advise the business to upload a photo of all the variants.", isCorrect: false },
      { id: "q-e722-015-b", text: "In the Admin, for the configurable product image, set it to the parent thumbnail within the cart.", isCorrect: false },
      { id: "q-e722-015-c", text: "In the Admin, for the configurable product image, set it to the product thumbnail within the cart.", isCorrect: true },
      { id: "q-e722-015-d", text: "Develop a customization to display the variant image instead of the configurable product image.", isCorrect: false },
    ],
  }));

  // Q16 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-016", type: "SINGLE", sectionId: secArch.id,
    text: "An Adobe Commerce Architect needs to modify each URL generated by an instance of `Magento\\Framework\\Url` class. What is the recommended way of completing this task?",
    explanation: "A Plugin using `afterGetUrl` is the recommended approach because it respects the open/closed principle and does not break the class hierarchy. Extending the class creates tight coupling, and modifying the core class directly is never acceptable.",
    options: [
      { id: "q-e722-016-a", text: "Implement a custom Plugin for `Magento\\Framework\\Url` and apply the desired modifications in the `afterGetUrl` method", isCorrect: true },
      { id: "q-e722-016-b", text: "Directly modify the core `Magento\\Framework\\Url` class to incorporate the necessary modifications into the URL generation process", isCorrect: false },
      { id: "q-e722-016-c", text: "Implement a custom URL generation class by extending `Magento\\Framework\\Url` and override the necessary methods to apply the desired modifications", isCorrect: false },
    ],
  }));

  // Q17 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-017", type: "SINGLE", sectionId: secArch.id,
    text: "A developer created a functionality that replaces the `visitor_clean` cron job. Which code snippet can be used to disable the cron job?",
    explanation: "The correct way to effectively disable a cron job without using `disabled` attribute (which isn't supported in this syntax) is to set an impossible schedule — `0 0 30 2 *` targets February 30th, which never occurs. This prevents the job from ever running. The `disabled='true'` attribute is not valid Magento cron XML syntax.",
    options: [
      { id: "q-e722-017-a", text: "`<job name=\"visitor_clean\" ... disabled>`\n`<schedule>* * * * *</schedule>`", isCorrect: false },
      { id: "q-e722-017-b", text: "`<job name=\"visitor_clean\" ... disabled=\"true\">`\n`<schedule>0 0 * * *</schedule>`", isCorrect: false },
      { id: "q-e722-017-c", text: "`<job name=\"visitor_clean\" ...>`\n`<schedule>0 0 30 2 *</schedule>`", isCorrect: true },
    ],
  }));

  // Q18 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-018", type: "SINGLE", sectionId: secArch.id,
    text: "A merchant is using specific Product Recommendations for multiple store views on the project: Default, StoreView1, and StoreView2. They now want to add an existing recommendation unit from the StoreView2 to a Category list page using a CMS block. When they use the Product Recommendation placeholder from the Page Builder functionality, they only see recommendations from the Default scope. What can be done to aid this problem?",
    explanation: "Page Builder Product Recommendation placeholders only access recommendations from the default store view scope. To use a recommendation unit on a Category page type, you should place it using the category-specific recommendation unit placement rather than through Page Builder.",
    options: [
      { id: "q-e722-018-a", text: "Use a recommendation unit for the Category page type over the Page Builder", isCorrect: true },
      { id: "q-e722-018-b", text: "Use Product Relationships over Product Recommendations", isCorrect: false },
      { id: "q-e722-018-c", text: "Use recommendation units for the Page Builder page type only in the default store view", isCorrect: false },
    ],
  }));

  // Q19 — Performance (MULTIPLE)
  off.push(upsertQuestion({
    id: "q-e722-019", type: "MULTIPLE", sectionId: secPerf.id,
    text: "An Adobe Commerce Developer is tasked with optimizing Magento product page performance. The server resources are already optimized, and caching mechanisms are in place. What are the recommended ways to optimize the page performance? (Choose two.)",
    explanation: "Since server resources and caching are already in place, the next levers are: (1) minimizing JavaScript and CSS to reduce HTTP requests — fewer/smaller files means faster load. (2) Image compression and lazy loading — defers non-visible image loading. CDN would help but is an infrastructure change already in the 'caching' category. FPC is already mentioned as in place.",
    options: [
      { id: "q-e722-019-a", text: "Consider implementing Content Delivery Network (CDN) to distribute content across multiple servers", isCorrect: false },
      { id: "q-e722-019-b", text: "Utilize image compression and lazy loading to reduce the page load time", isCorrect: true },
      { id: "q-e722-019-c", text: "Apply Full Page Cache (FPC) to store pre-rendered product pages to improve loading speed", isCorrect: false },
      { id: "q-e722-019-d", text: "Minimize the usage of JavaScript and CSS files to decrease the number of HTTP requests", isCorrect: true },
    ],
  }));

  // Q20 — Integration
  off.push(upsertQuestion({
    id: "q-e722-020", type: "SINGLE", sectionId: secInteg.id,
    text: "As part of a project's demands, you are tasked with setting up a new integration to allow third-party services to utilize the Adobe Commerce and Magento Open Source web APIs. Which configuration file should be created within the module to define the API resources accessible by the integration?",
    explanation: "`etc/integration/api.xml` defines which API resources an integration can access. `etc/integration.xml` defines the integration itself (name, email, endpoint), `etc/acl.xml` defines ACL resources, and `etc/api.xml` is not a standard Magento config file for this purpose.",
    options: [
      { id: "q-e722-020-a", text: "`etc/api.xml`", isCorrect: false },
      { id: "q-e722-020-b", text: "`etc/integration/api.xml`", isCorrect: true },
      { id: "q-e722-020-c", text: "`etc/integration.xml`", isCorrect: false },
      { id: "q-e722-020-d", text: "`etc/acl.xml`", isCorrect: false },
    ],
  }));

  // Q21 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-021", type: "SINGLE", sectionId: secArch.id,
    text: "What is the role of the Magento configuration areas?",
    explanation: "Areas (`frontend`, `adminhtml`, `webapi_rest`, `crontab`, etc.) allow Magento to load only the code and configuration needed for the current request type. This reduces memory usage and improves performance by not loading admin code on frontend requests, etc.",
    options: [
      { id: "q-e722-021-a", text: "Areas represent different sections of the user interface, such as header, sidebar, and content", isCorrect: false },
      { id: "q-e722-021-b", text: "Areas organize code for optimized request processing", isCorrect: true },
      { id: "q-e722-021-c", text: "Areas define the division into physical segments of the server for more efficient request processing", isCorrect: false },
    ],
  }));

  // Q22 — Integration
  off.push(upsertQuestion({
    id: "q-e722-022", type: "SINGLE", sectionId: secInteg.id,
    text: "A multi-lingual website needs to import product information from PIM. The backend admin needs to configure options for API input limiting. On which configuration scope should the admin perform this action?",
    explanation: "API input limiting (rate limiting / bulk operation settings) can be configured at all scopes: global, website, and store view. This allows different limits per website or store view if needed, rather than forcing a global-only setting.",
    options: [
      { id: "q-e722-022-a", text: "Values can be configured only in website and globally scope.", isCorrect: false },
      { id: "q-e722-022-b", text: "Values can be configured at all config scopes.", isCorrect: true },
      { id: "q-e722-022-c", text: "Values can be configured only globally scope.", isCorrect: false },
      { id: "q-e722-022-d", text: "Values can be configured only per website scope.", isCorrect: false },
    ],
  }));

  // Q23 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-023", type: "SINGLE", sectionId: secArch.id,
    text: "An Architect needs to create a new product type based on business requirements, which can have a custom pricing logic. How can these be achieved?",
    explanation: "To register a new product type and provide custom pricing, you create `etc/product_types.xml` declaring the new type and pointing to a custom Price model that extends `\\Magento\\Catalog\\Product\\Type\\Price`. The price model overrides `getPrice()` and related methods for custom logic.",
    options: [
      { id: "q-e722-023-a", text: "A new class with custom pricing logic, extending abstract Product Model class", isCorrect: false },
      { id: "q-e722-023-b", text: "New Data patch for the new product type", isCorrect: false },
      { id: "q-e722-023-c", text: "Hydrator for attributes for the new Product Type", isCorrect: false },
      { id: "q-e722-023-d", text: "`etc/product_types.xml` needs to be created with new Price model that extends `\\Magento\\Catalog\\Product\\Type\\Price`", isCorrect: true },
    ],
  }));

  // Q24 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-024", type: "SINGLE", sectionId: secArch.id,
    text: "A project manager enabled Product Recommendations for the staging environment. All tests have been completed, and the configuration was deployed to the production environment, but the recommendations are not showing on Production. What is the first step to troubleshoot this issue?",
    explanation: "Product Recommendations connect via Adobe Commerce Services Connector. Staging and production use different API keys. The most common cause of recommendations not appearing on production after working on staging is that the Services Connector is still configured with sandbox/staging keys. Check production keys first.",
    options: [
      { id: "q-e722-024-a", text: "Check that the development team uses the correct Services Connector settings for their local environment", isCorrect: false },
      { id: "q-e722-024-b", text: "Synchronize Catalog to export product data from the Commerce server to Commerce Services", isCorrect: false },
      { id: "q-e722-024-c", text: "Check that the Commerce Services Connector configuration uses production keys", isCorrect: true },
    ],
  }));

  // Q25 — Cloud (MULTIPLE — choose three)
  off.push(upsertQuestion({
    id: "q-e722-025", type: "MULTIPLE", sectionId: secCloud.id,
    text: "Several deployment errors are occurring in the Adobe Commerce cloud server. For this reason, it is not possible to push any new changes in the project repository. The Adobe Commerce Architect found out that certain incompatible files/folders were committed inside the repository, which is what caused the issue. What are the three files/folders that should not be in the repository? (Choose three.)",
    explanation: "`app/etc/env.php` contains environment-specific credentials and must never be committed. `vendor/` is generated by Composer and must not be committed (it bloats the repo and causes deployment issues). `pub/media/catalog` contains uploaded media files that should be stored in cloud storage, not version control. `pub/static` is generated but can vary by project; `bin` and `app/etc/registration_globlist.php` are valid committed files.",
    options: [
      { id: "q-e722-025-a", text: "`app/etc/env.php`", isCorrect: true },
      { id: "q-e722-025-b", text: "`app/etc/registration_globlist.php`", isCorrect: false },
      { id: "q-e722-025-c", text: "`vendor`", isCorrect: true },
      { id: "q-e722-025-d", text: "`pub/static`", isCorrect: false },
      { id: "q-e722-025-e", text: "`bin`", isCorrect: false },
      { id: "q-e722-025-f", text: "`pub/media/catalog`", isCorrect: true },
    ],
  }));

  // Q26 — Testing
  off.push(upsertQuestion({
    id: "q-e722-026", type: "SINGLE", sectionId: secTest.id,
    text: "A developer is writing integration tests for any application where the objects are needed to be modified intentionally within the test case. As an Adobe Commerce Architect, what should you recommend be used?",
    explanation: "`@magentoAppIsolation` resets the application state between tests, including the object manager registry. This is the correct annotation when tests intentionally modify objects (like singletons or registry entries) and you need a clean state for each test.",
    options: [
      { id: "q-e722-026-a", text: "`magentoAppArea`", isCorrect: false },
      { id: "q-e722-026-b", text: "`magentoDbIsolation`", isCorrect: false },
      { id: "q-e722-026-c", text: "`magentoAppIsolation`", isCorrect: true },
    ],
  }));

  // Q27 — Testing
  off.push(upsertQuestion({
    id: "q-e722-027", type: "SINGLE", sectionId: secTest.id,
    text: "A developer creates an extension for Adobe Commerce or Magento Open Source. Which type of test will ensure the quality of the user interface after enabling this feature?",
    explanation: "The Magento Functional Testing Framework (MFTF) is designed specifically for end-to-end UI testing in Adobe Commerce, simulating real browser interactions. Integration tests verify PHP-level interactions, and Web API functional tests verify API endpoints — neither covers UI rendering.",
    options: [
      { id: "q-e722-027-a", text: "Web API functional testing", isCorrect: false },
      { id: "q-e722-027-b", text: "Integration testing", isCorrect: false },
      { id: "q-e722-027-c", text: "Functional Testing Framework", isCorrect: true },
    ],
  }));

  // Q28 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-028", type: "SINGLE", sectionId: secArch.id,
    text: "When refactoring Adobe Commerce customizations, which design pattern promotes loose coupling and flexibility by allowing objects to communicate without direct references?",
    explanation: "The Observer pattern (implemented in Magento via Events and Observers) allows objects to communicate indirectly: an event is dispatched and any registered observer reacts, without the dispatching code knowing about the observers. This promotes loose coupling.",
    options: [
      { id: "q-e722-028-a", text: "Proxy Pattern", isCorrect: false },
      { id: "q-e722-028-b", text: "Observer Pattern", isCorrect: true },
      { id: "q-e722-028-c", text: "Command Pattern", isCorrect: false },
      { id: "q-e722-028-d", text: "Singleton Pattern", isCorrect: false },
    ],
  }));

  // Q29 — Testing
  off.push(upsertQuestion({
    id: "q-e722-029", type: "SINGLE", sectionId: secTest.id,
    text: "A junior developer needs to analyze and debug their code. To get guidance, they work with the Architect to understand how to best perform Javascript code analysis on Adobe Commerce. What should the Architect recommend using?",
    explanation: "ESLint is the standard JavaScript static analysis tool recommended by Adobe Commerce. It catches syntax errors, coding standard violations, and potential bugs. JSCS is deprecated. Grunt is a task runner, not a code analyzer.",
    options: [
      { id: "q-e722-029-a", text: "ESLint", isCorrect: true },
      { id: "q-e722-029-b", text: "JSCS package", isCorrect: false },
      { id: "q-e722-029-c", text: "Grunt", isCorrect: false },
    ],
  }));

  // Q30 — Testing
  off.push(upsertQuestion({
    id: "q-e722-030", type: "SINGLE", sectionId: secTest.id,
    text: "An Adobe Commerce Architect wanted to check the coding standard for a module and found the error in Mess Detector: \"Consider reducing the number of public items to less than 45.\" What should the architect consider as a reason for this error?",
    explanation: "PHP Mess Detector's `ExcessivePublicCount` rule fires when a class has more than a configurable threshold of public methods and attributes (default 45). This is different from `ExcessiveParameterList` (too many method parameters) or `ExcessiveMethodLength` (method too long).",
    options: [
      { id: "q-e722-030-a", text: "`ExcessivePublicCount`", isCorrect: true },
      { id: "q-e722-030-b", text: "`ExcessiveParameterList`", isCorrect: false },
      { id: "q-e722-030-c", text: "`ExcessiveMethodLength`", isCorrect: false },
    ],
  }));

  // Q31 — Testing
  off.push(upsertQuestion({
    id: "q-e722-031", type: "SINGLE", sectionId: secTest.id,
    text: "An Adobe Commerce Architect wants to minimize the effort involved with regression testing. Which action should be used to perform automated end-to-end testing?",
    explanation: "The Magento Functional Testing Framework (MFTF) is Adobe's built-in tool for automated end-to-end regression testing. It simulates real user interactions in a browser and can be run as part of CI/CD pipelines to catch regressions automatically.",
    options: [
      { id: "q-e722-031-a", text: "Integration Testing", isCorrect: false },
      { id: "q-e722-031-b", text: "Unit Testing", isCorrect: false },
      { id: "q-e722-031-c", text: "Magento Functional Testing Framework", isCorrect: true },
    ],
  }));

  // Q32 — Performance (MULTIPLE)
  off.push(upsertQuestion({
    id: "q-e722-032", type: "MULTIPLE", sectionId: secPerf.id,
    text: "Which two caching options for performance optimization are available in Magento? (Choose two.)",
    explanation: "The two primary caching mechanisms are: (1) **Opcode cache** (e.g., OPcache) — stores compiled PHP bytecode in memory, avoiding re-parsing on each request. (2) **Full Page Cache (FPC)** — caches the complete rendered HTML of pages (via built-in FPC or Varnish). Redis is a backend cache *storage* option, not a caching strategy itself, and file system cache for static files is not a Magento-specific caching strategy.",
    options: [
      { id: "q-e722-032-a", text: "Opcode cache for storing data in the memory", isCorrect: true },
      { id: "q-e722-032-b", text: "Redis database for storing entire cache", isCorrect: false },
      { id: "q-e722-032-c", text: "Full Page Cache for preserving output HTML of the pages", isCorrect: true },
      { id: "q-e722-032-d", text: "File system cache for storing static files", isCorrect: false },
    ],
  }));

  // Q33 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-033", type: "SINGLE", sectionId: secArch.id,
    text: "A new custom column has been added in the sales order grid to display applied coupon data. When the Admin tries to filter the grid using the custom column, the grid throws an error. How should the Architect fix the error to make the column filterable?",
    explanation: "`addFilterToMap` maps a filter field name to the actual database column expression, which is required when the column name in the grid does not directly correspond to a column in the main collection query (e.g., joined or aliased columns). `addFieldToFilter` adds a WHERE condition but doesn't solve the aliasing issue.",
    options: [
      { id: "q-e722-033-a", text: "Add `addFieldToFilter` on the collection.", isCorrect: false },
      { id: "q-e722-033-b", text: "Add `addFilterToMap` on the collection.", isCorrect: true },
      { id: "q-e722-033-c", text: "Modify the collection query and group by the custom column.", isCorrect: false },
    ],
  }));

  // Q34 — Performance
  off.push(upsertQuestion({
    id: "q-e722-034", type: "SINGLE", sectionId: secPerf.id,
    text: "When reviewing and refactoring the database schema of an Adobe Commerce module, what is a best practice for optimizing queries involving large datasets?",
    explanation: "Implementing proper database indexing is the foundational best practice for query performance on large datasets. Indexes allow the DB engine to find rows without full table scans. Subqueries, avoiding joins, and dynamic code analysis do not address query performance at the schema level.",
    options: [
      { id: "q-e722-034-a", text: "Using dynamic code analysis", isCorrect: false },
      { id: "q-e722-034-b", text: "Using subqueries for each dataset", isCorrect: false },
      { id: "q-e722-034-c", text: "Implementing proper indexing", isCorrect: true },
      { id: "q-e722-034-d", text: "Avoiding the use of joins", isCorrect: false },
    ],
  }));

  // Q35 — Integration
  off.push(upsertQuestion({
    id: "q-e722-035", type: "SINGLE", sectionId: secInteg.id,
    text: "When using the API integration, a merchant is unable to perform actions that require a permission level higher than anonymous. They receive the following error message: \"The consumer isn't authorized to access %resources\". Full permissions are given to this integration, it is active, and the access token is used in the authentication header. What is the recommended way to resolve this issue?",
    explanation: "When an access token is used as a standalone Bearer token (not via OAuth handshake), the `Allow OAuth Access Tokens to be used as standalone Bearer tokens` setting must be enabled AND the integration must use the full OAuth flow. The correct resolution is to use OAuth-based authentication with the consumer key, consumer secret, access token, and access token secret — not a standalone Bearer token.",
    options: [
      { id: "q-e722-035-a", text: "Set Stores > Configuration > Services > OAuth > Consumer Settings > 'Allow OAuth Access Tokens to be used as standalone Bearer tokens' option to 'Yes'", isCorrect: false },
      { id: "q-e722-035-b", text: "Request an access token using one of these end points: GET V1/integration/admin/token or GET V1/integration/customer/token", isCorrect: false },
      { id: "q-e722-035-c", text: "Use OAuth-based authentication and utilize generated consumer key, consumer secret, access token, and access token secret", isCorrect: true },
    ],
  }));

  // Q36 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-036", type: "SINGLE", sectionId: secArch.id,
    text: "A developer needs to add a class name resolution for the `SearchCriteriaBuilder`. What is the recommended way to achieve this goal?",
    explanation: "Using `SearchCriteriaBuilder::class` is the recommended PHP way to reference a class by its fully qualified name as a string constant. This is type-safe, refactoring-friendly, and IDE-supported. Hardcoding the FQN string as `'\\Magento\\Framework\\Api\\SearchCriteriaBuilder'` is error-prone and not the modern best practice.",
    options: [
      { id: "q-e722-036-a", text: "`$this->get('SearchCriteriaBuilder');`", isCorrect: false },
      { id: "q-e722-036-b", text: "`$this->get('\\Magento\\Framework\\Api\\SearchCriteriaBuilder');`", isCorrect: false },
      { id: "q-e722-036-c", text: "`$this->get(SearchCriteriaBuilder::class);`", isCorrect: true },
    ],
  }));

  // Q37 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-037", type: "SINGLE", sectionId: secArch.id,
    text: "In the context of module development, describe the role of a \"Service Contract\" and elaborate on how it contributes to the overall development process.",
    explanation: "A Service Contract in Adobe Commerce is a set of PHP interfaces (in the `Api/` directory) that define the public-facing API of a module. They separate the interface from implementation, enable the use of plugins on service methods, and ensure backward compatibility. They are not client agreements, nor are they Magento extensions for web services.",
    options: [
      { id: "q-e722-037-a", text: "A \"Service Contract\" is a set of interfaces and classes that define the interactions between different layers of the application, promoting separation of concerns and modularity", isCorrect: true },
      { id: "q-e722-037-b", text: "A \"Service Contract\" is a formal agreement between Magento developers and clients to provide ongoing support for a module", isCorrect: false },
      { id: "q-e722-037-c", text: "A \"Service Contract\" is a Magento extension that handles web services and API calls for third-party integrations", isCorrect: false },
    ],
  }));

  // Q38 — Performance (MULTIPLE)
  off.push(upsertQuestion({
    id: "q-e722-038", type: "MULTIPLE", sectionId: secPerf.id,
    text: "What are two techniques and strategies that can be employed to optimize the performance of a Magento product page view? (Choose two.)",
    explanation: "The two validated optimizations are: (1) Enabling all available cache types and using OPcache — caches compiled PHP and rendered HTML output. (2) Optimizing database queries with proper indexing, fewer joins, and avoiding EAV attribute overuse — directly reduces time spent on data retrieval. Synchronous third-party requests block page render, and storing JS/CSS locally does not reduce external requests meaningfully.",
    options: [
      { id: "q-e722-038-a", text: "Use synchronous requests to the third-party services", isCorrect: false },
      { id: "q-e722-038-b", text: "Enabling all available cache types and using opcode caching for PHP scripts", isCorrect: true },
      { id: "q-e722-038-c", text: "Optimizing database queries by using indexing, reducing join queries, and avoiding excessive use of EAV attributes", isCorrect: true },
      { id: "q-e722-038-d", text: "Storing all JavaScript and CSS files locally on the server to reduce external requests", isCorrect: false },
    ],
  }));

  // Q39 — Integration
  off.push(upsertQuestion({
    id: "q-e722-039", type: "SINGLE", sectionId: secInteg.id,
    text: "A GraphQL query loads a list of products, the SKUs of their related products, and then any secondary related product SKUs (nested `related_products` fields). Which interface is recommended to resolve this GraphQL request?",
    explanation: "`BatchResolverInterface` is designed for resolving nested/related data efficiently by batching multiple resolution calls into a single operation, avoiding the N+1 query problem. `ResolverInterface` would trigger a separate query per product. `IdentityInterface` is for cache tag management, not data resolution.",
    options: [
      { id: "q-e722-039-a", text: "`\\Magento\\Framework\\GraphQl\\Query\\ResolverInterface`", isCorrect: false },
      { id: "q-e722-039-b", text: "`Magento\\Framework\\GraphQl\\Query\\Resolver\\IdentityInterface`", isCorrect: false },
      { id: "q-e722-039-c", text: "`\\Magento\\Framework\\GraphQl\\Query\\Resolver\\BatchResolverInterface`", isCorrect: true },
    ],
  }));

  // Q40 — Performance (MULTIPLE)
  off.push(upsertQuestion({
    id: "q-e722-040", type: "MULTIPLE", sectionId: secPerf.id,
    text: "In which two ways can the storefront responsiveness of the Commerce Instance be improved? (Choose two.)",
    explanation: "Enabling JavaScript bundling (while also minifying CSS, JS, and HTML) reduces the number of HTTP requests by merging JS files. Enabling asynchronous indexing offloads index updates from the request lifecycle to a queue, preventing indexing operations from blocking storefront responses. Disabling JS bundling or asynchronous indexing would worsen performance.",
    options: [
      { id: "q-e722-040-a", text: "Minify CSS, JavaScript and HTML files, and disable JavaScript bundling", isCorrect: false },
      { id: "q-e722-040-b", text: "Configure asynchronous indexing as enable", isCorrect: true },
      { id: "q-e722-040-c", text: "Minify CSS, JavaScript and HTML files, and Enable JavaScript bundling", isCorrect: true },
      { id: "q-e722-040-d", text: "Configure asynchronous indexing as disable", isCorrect: false },
    ],
  }));

  // Q41 — Cloud
  off.push(upsertQuestion({
    id: "q-e722-041", type: "SINGLE", sectionId: secCloud.id,
    text: "As an Adobe Commerce architect working on a project hosted in Commerce Cloud, you are tasked with investigating the inability of a \"contributor\" Cloud User to access SSH. Given the customization of configurations by the Dev Team, what would be the first troubleshooting step for addressing the SSH access problem?",
    explanation: "Since the Dev Team customized configurations, the `.magento.app.yaml` file is the first place to check — it contains the `access` property that defines which user roles have SSH access to each environment. Checking the Cloud GUI's user settings is secondary because the per-app configuration overrides it.",
    options: [
      { id: "q-e722-041-a", text: "Examine the `access` property in the `.magento.app.yaml` file.", isCorrect: true },
      { id: "q-e722-041-b", text: "SSH access is granted only to users with specific roles.", isCorrect: false },
      { id: "q-e722-041-c", text: "Check the User's access property in the Cloud GUI.", isCorrect: false },
      { id: "q-e722-041-d", text: "Initiate a Support Ticket to address the issue.", isCorrect: false },
    ],
  }));

  // Q42 — Cloud
  off.push(upsertQuestion({
    id: "q-e722-042", type: "SINGLE", sectionId: secCloud.id,
    text: "A client informed a development team that suddenly data export-import services stopped working on his Adobe Commerce Cloud website. The Adobe Commerce Architect found out that cron jobs stopped working in the cloud server. How can the Architect address this?",
    explanation: "`cron:unlock` releases cron jobs that are stuck in a 'running' status (which prevents new instances from starting). This is the correct command when cron jobs appear stopped but are actually locked. `cron:reset` is not a standard Magento command, and creating a support ticket should not be the first action.",
    options: [
      { id: "q-e722-042-a", text: "Enter the admin panel and restart the specific cron jobs manually.", isCorrect: false },
      { id: "q-e722-042-b", text: "Enter the ssh environment and run the `cron:reset` command.", isCorrect: false },
      { id: "q-e722-042-c", text: "Enter the ssh environment and run the `cron:unlock` command.", isCorrect: true },
      { id: "q-e722-042-d", text: "Create a support ticket to the Adobe team immediately.", isCorrect: false },
    ],
  }));

  // Q43 — Cloud
  off.push(upsertQuestion({
    id: "q-e722-043", type: "SINGLE", sectionId: secCloud.id,
    text: "A developer is configuring a production environment for Adobe Commerce Cloud. What is the optimal strategy for static content deployment (SCD) in this case?",
    explanation: "For production, SCD on build is optimal: static files are generated during the build phase before deployment, so the deploy phase is faster and the site experiences zero downtime. SCD on deploy delays static generation until deployment time, increasing downtime. SCD on demand generates files lazily but is not suitable for production traffic.",
    options: [
      { id: "q-e722-043-a", text: "SCD on build", isCorrect: true },
      { id: "q-e722-043-b", text: "SCD on deploy", isCorrect: false },
      { id: "q-e722-043-c", text: "SCD on deploy with skip HTML minification", isCorrect: false },
    ],
  }));

  // Q44 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-044", type: "SINGLE", sectionId: secArch.id,
    text: "A client is struggling with ineffective search functionality, leading to poor user experience and reduced conversion rates. As an Adobe Commerce architect, you are tasked with enhancing the search functionality to provide relevant and accurate results. What should you do to achieve this goal?",
    explanation: "Integrating search analytics gives insight into what users are actually searching for, which queries return no results, and how search behavior correlates with conversions. This data-driven approach enables continuous optimization of search algorithms and relevance tuning, making it the most strategic recommendation.",
    options: [
      { id: "q-e722-044-a", text: "Implement full-text search capabilities to enable natural language search queries.", isCorrect: false },
      { id: "q-e722-044-b", text: "Employ search autocomplete and synonym suggestions to guide users and improve search efficiency.", isCorrect: false },
      { id: "q-e722-044-c", text: "Integrate search analytics to understand user behavior and optimize search algorithms.", isCorrect: true },
      { id: "q-e722-044-d", text: "Utilize search relevancy algorithms to rank results based on user intent and product attributes.", isCorrect: false },
    ],
  }));

  // Q45 — Cloud
  off.push(upsertQuestion({
    id: "q-e722-045", type: "SINGLE", sectionId: secCloud.id,
    text: "A client wants to create multiple domains for their multiple stores in Adobe Commerce Cloud. Which file is required to configure the store domains?",
    explanation: "`routes.yaml` defines the domain routing for Adobe Commerce Cloud — it maps incoming hostnames to the application, supports redirects, and configures upstream routing. `.magento.app.yaml` configures the application runtime, and `.magento.env.yaml` sets environment variables.",
    options: [
      { id: "q-e722-045-a", text: "`.magento.app.yaml`", isCorrect: false },
      { id: "q-e722-045-b", text: "`.magento.env.yaml`", isCorrect: false },
      { id: "q-e722-045-c", text: "`routes.yaml`", isCorrect: true },
    ],
  }));

  // Q46 — Performance
  off.push(upsertQuestion({
    id: "q-e722-046", type: "SINGLE", sectionId: secPerf.id,
    text: "A page in Storefront is performing very slowly. While debugging, the Adobe Commerce Architect found the following code available in the page:\n\n```xml\n<block class=\"Magento\\Customer\\Block\\Form\\Edit\" name=\"customer_edit\" template=\"...\" cacheable=\"false\">\n```\n\nWhat is the purpose of this code?",
    explanation: "`cacheable=\"false\"` on any block within a page layout makes the **entire page** uncacheable by FPC. It is not limited to that specific block — Magento marks the whole page response as uncacheable when any block on the page has `cacheable=\"false\"`.",
    options: [
      { id: "q-e722-046-a", text: "Making the entire page uncacheable", isCorrect: true },
      { id: "q-e722-046-b", text: "Making only the block \"customer_edit\" uncacheable", isCorrect: false },
      { id: "q-e722-046-c", text: "Making the block and container uncacheable", isCorrect: false },
    ],
  }));

  // Q47 — Cloud
  off.push(upsertQuestion({
    id: "q-e722-047", type: "SINGLE", sectionId: secCloud.id,
    text: "A developer is configuring an integration environment for Adobe Commerce Cloud. What is the optimal strategy for static content deployment (SCD) in this case?",
    explanation: "For integration/development environments, SCD on demand is optimal: static files are generated only when first requested, saving build time during development iterations where not all static files may be needed. Production uses SCD on build for zero-downtime deployments.",
    options: [
      { id: "q-e722-047-a", text: "SCD on deploy with skip HTML minification", isCorrect: false },
      { id: "q-e722-047-b", text: "SCD on build", isCorrect: false },
      { id: "q-e722-047-c", text: "SCD on demand", isCorrect: true },
    ],
  }));

  // Q48 — Cloud
  off.push(upsertQuestion({
    id: "q-e722-048", type: "SINGLE", sectionId: secCloud.id,
    text: "During a deployment, you receive an error: \"Item CRON_CONSUMERS_RUNNER is not supposed to be in stage build. Please move it to one of possible stages: global, deploy.\" Which file should you use to fix this issue?",
    explanation: "`CRON_CONSUMERS_RUNNER` is an environment variable that must be placed in the `deploy` or `global` stage. This variable is configured in `.magento.env.yaml`. The error indicates it was accidentally placed in the `build` stage of that file. `routes.yaml` and `services.yaml` serve different purposes.",
    options: [
      { id: "q-e722-048-a", text: "`routes.yaml`", isCorrect: false },
      { id: "q-e722-048-b", text: "`.magento.env.yaml`", isCorrect: true },
      { id: "q-e722-048-c", text: "`services.yaml`", isCorrect: false },
      { id: "q-e722-048-d", text: "`.magento.app.yaml`", isCorrect: false },
    ],
  }));

  // Q49 — Performance (MULTIPLE)
  off.push(upsertQuestion({
    id: "q-e722-049", type: "MULTIPLE", sectionId: secPerf.id,
    text: "An Adobe Commerce store merchant is experiencing page speed issues. After investigating, they discover that the `X-Cache` header is MISS on the response. What are the two possible reasons causing this issue? (Choose two.)",
    explanation: "`X-Cache: MISS` means Varnish/Fastly could not serve a cached response. Two causes: (1) `Pragma: no-cache` in the response header tells the cache not to store the response. (2) Absence of `X-Magento-Tags` means the page lacks cache tags, so the cache cannot properly store and invalidate it. `Cache-Control: max-age > 0` would actually allow caching.",
    options: [
      { id: "q-e722-049-a", text: "In the response header, the `Cache-Control: max-age=value`, where value is greater than 0", isCorrect: false },
      { id: "q-e722-049-b", text: "In the response header, the `Pragma:cache` is set", isCorrect: false },
      { id: "q-e722-049-c", text: "In the response header, the `Pragma:no-cache` is set", isCorrect: true },
      { id: "q-e722-049-d", text: "In the response header, the `X-Magento-Tags` does not exist", isCorrect: true },
    ],
  }));

  // Q50 — Cloud
  off.push(upsertQuestion({
    id: "q-e722-050", type: "SINGLE", sectionId: secCloud.id,
    text: "A client has three stores, and wants to include them under a single domain in Adobe Commerce Cloud. The Adobe Commerce architect sets up three different folders for the stores that share the domain. Which file is required to configure the application structure?",
    explanation: "When multiple stores share a single domain on Adobe Commerce Cloud with separate document roots (folders), `.magento.app.yaml` configures the application structure — including the `web.locations` property that maps URL paths to different directories. `routes.yaml` handles domain routing, not sub-path to folder mapping.",
    options: [
      { id: "q-e722-050-a", text: "`.magento.env.yaml`", isCorrect: false },
      { id: "q-e722-050-b", text: "`.magento.app.yaml`", isCorrect: true },
      { id: "q-e722-050-c", text: "`routes.yaml`", isCorrect: false },
    ],
  }));

  // Q51 — Architecture
  off.push(upsertQuestion({
    id: "q-e722-051", type: "SINGLE", sectionId: secArch.id,
    text: "A client is facing a growing threat of cyberattacks and data breaches. As an Adobe Commerce architect, you are tasked with implementing robust security measures to protect the store's data and maintain customer trust. What is the most effective way to achieve this goal?",
    explanation: "Encrypting sensitive data at rest and in transit is the most fundamental and effective security measure — it ensures that even if data is intercepted or the database is breached, the data remains unreadable. MFA, WAF, and updates are also important but address specific vectors rather than providing the broadest data protection.",
    options: [
      { id: "q-e722-051-a", text: "Encrypt sensitive data, such as customer information and payment details, at rest and in transit", isCorrect: true },
      { id: "q-e722-051-b", text: "Implement strong password policies and enforce multi-factor authentication (MFA)", isCorrect: false },
      { id: "q-e722-051-c", text: "Utilize a web application firewall (WAF) to filter malicious traffic and protect against common attacks", isCorrect: false },
      { id: "q-e722-051-d", text: "Regularly update Adobe Commerce and all extensions to the latest versions", isCorrect: false },
    ],
  }));

  // ─── Practice Test ─────────────────────────────────────────────────────────

  const allQuestions = await Promise.all(off);
  console.log(`Created/updated ${allQuestions.length} questions.`);

  await prisma.practiceTestQuestion.deleteMany({
    where: { practiceTestId: "pt-official-e722" },
  });

  await prisma.practiceTest.upsert({
    where: { id: "pt-official-e722" },
    update: { questionCount: allQuestions.length },
    create: {
      id: "pt-official-e722",
      certificationId: cert.id,
      title: "Official Practice Exam",
      type: "OFFICIAL",
      questionCount: allQuestions.length,
    },
  });

  for (let i = 0; i < allQuestions.length; i++) {
    await prisma.practiceTestQuestion.create({
      data: {
        practiceTestId: "pt-official-e722",
        questionId: allQuestions[i].id,
        position: i + 1,
      },
    });
  }

  console.log(`Linked ${allQuestions.length} questions to Official Practice Exam.`);
  console.log("AD0-E722 seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
