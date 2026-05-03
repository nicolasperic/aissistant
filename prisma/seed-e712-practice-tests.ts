import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding AD0-E712 Business Practitioner Professional practice tests...");

  // ─── Certification ─────────────────────────────────────────────────────────

  const cert = await prisma.certification.upsert({
    where: { id: "cert-ad0-e712" },
    update: {},
    create: {
      id: "cert-ad0-e712",
      name: "Adobe Commerce Business Practitioner Professional",
      code: "AD0-E712",
      provider: "Adobe",
      description:
        "Validates foundational knowledge of Adobe Commerce business operations, catalog management, marketing features, order processing, store configuration, and compliance.",
      totalQuestions: 50,
      passingScore: 30,
      timeLimitMinutes: 100,
    },
  });

  // ─── Sections ──────────────────────────────────────────────────────────────

  const [secCommerce, secDev, secCatalog, secMarketing, secAdmin, secCloud] =
    await Promise.all([
      prisma.certSection.upsert({
        where: { id: "sec712-commerce" },
        update: { name: "Commerce Features & Orders", percentage: 24 },
        create: { id: "sec712-commerce", certificationId: cert.id, name: "Commerce Features & Orders", percentage: 24 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec712-dev" },
        update: { name: "Development Fundamentals", percentage: 18 },
        create: { id: "sec712-dev", certificationId: cert.id, name: "Development Fundamentals", percentage: 18 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec712-catalog" },
        update: { name: "Catalog & Merchandising", percentage: 16 },
        create: { id: "sec712-catalog", certificationId: cert.id, name: "Catalog & Merchandising", percentage: 16 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec712-marketing" },
        update: { name: "Marketing & SEO", percentage: 14 },
        create: { id: "sec712-marketing", certificationId: cert.id, name: "Marketing & SEO", percentage: 14 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec712-admin" },
        update: { name: "Admin & Security", percentage: 18 },
        create: { id: "sec712-admin", certificationId: cert.id, name: "Admin & Security", percentage: 18 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec712-cloud" },
        update: { name: "Cloud & Store Setup", percentage: 10 },
        create: { id: "sec712-cloud", certificationId: cert.id, name: "Cloud & Store Setup", percentage: 10 },
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

  // Q1 — Development Fundamentals
  off.push(upsertQuestion({
    id: "q-e712-001", type: "SINGLE", sectionId: secDev.id,
    text: "Which method of \\Magento\\Framework\\App\\RouterInterface should be implemented when creating a custom router class?",
    explanation: "The `match()` method of `\\Magento\\Framework\\App\\RouterInterface` is called by the front controller to determine if the router can handle the current request. It must return an action instance or null. `dispatch()` and `execute()` are action controller methods, not router methods.",
    options: [
      { id: "q-e712-001-a", text: "Dispatch", isCorrect: false },
      { id: "q-e712-001-b", text: "Execute", isCorrect: false },
      { id: "q-e712-001-c", text: "Match", isCorrect: true },
      { id: "q-e712-001-d", text: "Router", isCorrect: false },
    ],
  }));

  // Q2 — Development Fundamentals
  off.push(upsertQuestion({
    id: "q-e712-002", type: "SINGLE", sectionId: secDev.id,
    text: "Which Escaper method should an Adobe Commerce developer use when JSON is inside an HTML attribute of the main code?",
    explanation: "When JSON data is placed inside an HTML attribute, `escapeHtmlAttr()` is the correct escaper method. It encodes characters that could break out of the attribute context. `escapeJs()` is for inline JS, `escapeHtml()` is for HTML body content, and `escapeCSS()` is for CSS contexts.",
    options: [
      { id: "q-e712-002-a", text: "escapeHtmlAttr", isCorrect: true },
      { id: "q-e712-002-b", text: "escapeJS", isCorrect: false },
      { id: "q-e712-002-c", text: "escapeHtml", isCorrect: false },
      { id: "q-e712-002-d", text: "escapeCSS", isCorrect: false },
    ],
  }));

  // Q3 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e712-003", type: "MULTIPLE", sectionId: secCommerce.id,
    text: "Which two email identities are predefined for a Store in Adobe Commerce? (Choose two.)",
    explanation: "Adobe Commerce comes with two predefined email identities: Sales Representative and General Contact. These are configured in Stores > Configuration > General > Store Email Addresses. Complaints and Feedback are not predefined identities.",
    options: [
      { id: "q-e712-003-a", text: "Sales Representative", isCorrect: true },
      { id: "q-e712-003-b", text: "General Contact", isCorrect: true },
      { id: "q-e712-003-c", text: "Complaints", isCorrect: false },
      { id: "q-e712-003-d", text: "Feedback", isCorrect: false },
    ],
  }));

  // Q4 — Catalog & Merchandising
  off.push(upsertQuestion({
    id: "q-e712-004", type: "SINGLE", sectionId: secCatalog.id,
    text: "Merchants want to offer a quantity discount for customers who buy more than 5 pieces of the same item. As an Adobe Commerce practitioner, what solution would you suggest?",
    explanation: "Tier pricing allows merchants to offer quantity-based discounts — e.g., lower price per unit when buying 5 or more. Special prices apply to all quantities, and Group prices apply per customer group regardless of quantity.",
    options: [
      { id: "q-e712-004-a", text: "Create a Special price for this product.", isCorrect: false },
      { id: "q-e712-004-b", text: "Create a Group price for this product.", isCorrect: false },
      { id: "q-e712-004-c", text: "Create a Tier price for this product.", isCorrect: true },
    ],
  }));

  // Q5 — Development Fundamentals
  off.push(upsertQuestion({
    id: "q-e712-005", type: "SINGLE", sectionId: secDev.id,
    text: "A product owner reached out to the developer to explore ways to use Adobe APIs to build an extension that notifies a third-party Enterprise Resource Planning (ERP) system every time a shopper places an order. Which approach should be used to achieve the goal?",
    explanation: "Adobe I/O Events allows developers to register specific Commerce events for forwarding to external systems. The correct event registration pattern is `plugin.magento.sales.api.order_management.place`, following Adobe's event naming convention for API-level events.",
    options: [
      { id: "q-e712-005-a", text: "Directly integrate the third-party ERP system from the list of vendors that Adobe Commerce supports", isCorrect: false },
      { id: "q-e712-005-b", text: "Use Adobe I/O Events and register \"order_management.plugin.magento\" event", isCorrect: false },
      { id: "q-e712-005-c", text: "Use a REST API; it is the only way to route events to a third-party ERP application", isCorrect: false },
      { id: "q-e712-005-d", text: "Use Adobe I/O Events and register \"plugin.magento.sales.api.order_management.place\" event", isCorrect: true },
    ],
  }));

  // Q6 — Catalog & Merchandising
  off.push(upsertQuestion({
    id: "q-e712-006", type: "SINGLE", sectionId: secCatalog.id,
    text: "A merchant that sells mobile devices would like to create a new appearance for the product page of a best selling product. This new appearance needs to come into effect on a nation-wide sales day, such as Black Friday. Then, the appearance of the product page must be reverted the following day.\nHow can this goal be achieved in Magento Open Source?",
    explanation: "Schedule a Design Update on the product's edit page to temporarily change its appearance for a specific date range. This is a native feature that doesn't require custom code, third-party plugins, or Content Staging campaigns.",
    options: [
      { id: "q-e712-006-a", text: "Create a content staging campaign, and add appearance changes to the campaign", isCorrect: false },
      { id: "q-e712-006-b", text: "Schedule a design update for the product", isCorrect: true },
      { id: "q-e712-006-c", text: "Install a third-party plugin", isCorrect: false },
    ],
  }));

  // Q7 — Admin & Security
  off.push(upsertQuestion({
    id: "q-e712-007", type: "SINGLE", sectionId: secAdmin.id,
    text: "If an admin user is unable to view the Promotions section in the Magento admin panel, what would be the reason?",
    explanation: "If an admin user cannot see the Promotions section, their assigned role does not have permission to view that area. Admin roles and permissions in Magento control which sections are visible and accessible to each admin user.",
    options: [
      { id: "q-e712-007-a", text: "The promotions functionality is disabled in the store configuration section.", isCorrect: false },
      { id: "q-e712-007-b", text: "The admin users assigned role does not have permission to view this area.", isCorrect: true },
      { id: "q-e712-007-c", text: "Promotions are only visible to the administrator role, and this user is not assigned to that role.", isCorrect: false },
    ],
  }));

  // Q8 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e712-008", type: "SINGLE", sectionId: secCommerce.id,
    text: "What does the \"Closed\" order status mean in Magento Open Source?",
    explanation: "The 'Closed' order status in Magento Open Source indicates that an order was assigned a credit memo and the customer received a refund. A fully shipped and paid order has 'Complete' status, not 'Closed'.",
    options: [
      { id: "q-e712-008-a", text: "That an order was assigned a credit memo and the customer has received a refund", isCorrect: true },
      { id: "q-e712-008-b", text: "That the order is created, fully paid, and fully shipped to customer", isCorrect: false },
      { id: "q-e712-008-c", text: "That the order is created, partially paid and shipped, and the remaining part is cancelled and won't be processed", isCorrect: false },
    ],
  }));

  // Q9 — Catalog & Merchandising
  off.push(upsertQuestion({
    id: "q-e712-009", type: "MULTIPLE", sectionId: secCatalog.id,
    text: "A developer wants to configure a discounted price during a specified time period or scheduled campaign. They also want to cross out retail price and show the new price in large, bold text. Which two prices should they choose from the Advanced Pricing feature in Adobe Commerce? (Choose two.)",
    explanation: "Both Special Price and Promotional Price can be configured with specific date ranges for time-limited pricing. Special Price is set directly on the product, while Promotional Prices are set through catalog/cart price rules with date ranges.",
    options: [
      { id: "q-e712-009-a", text: "Special Price", isCorrect: true },
      { id: "q-e712-009-b", text: "Promotional Price", isCorrect: true },
      { id: "q-e712-009-c", text: "Time-Bound Price", isCorrect: false },
      { id: "q-e712-009-d", text: "Discount Price", isCorrect: false },
    ],
  }));

  // Q10 — Marketing & SEO
  off.push(upsertQuestion({
    id: "q-e712-010", type: "MULTIPLE", sectionId: secMarketing.id,
    text: "For Catalog and Product URLs, which two URL components does Adobe Commerce support? (Choose two.)",
    explanation: "For Catalog and Product URLs, Adobe Commerce supports HTML Suffix (e.g., `.html` appended to URLs) and Category Path (including category hierarchy in the URL). Category Parameter and Catalog Path are not standard URL components.",
    options: [
      { id: "q-e712-010-a", text: "Category Parameter", isCorrect: false },
      { id: "q-e712-010-b", text: "HTML Suffix", isCorrect: true },
      { id: "q-e712-010-c", text: "Category Path", isCorrect: true },
      { id: "q-e712-010-d", text: "Catalog Path", isCorrect: false },
    ],
  }));

  // Q11 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e712-011", type: "SINGLE", sectionId: secCommerce.id,
    text: "Which status indicates that an order was assigned a credit memo and the customer has received a refund?",
    explanation: "The 'Closed' status indicates an order was assigned a credit memo and the customer received a refund. 'Canceled' means the order was voided before fulfillment, 'Processing' means payment was received, and 'Complete' means the order was shipped.",
    options: [
      { id: "q-e712-011-a", text: "Canceled", isCorrect: false },
      { id: "q-e712-011-b", text: "Closed", isCorrect: true },
      { id: "q-e712-011-c", text: "Processing", isCorrect: false },
      { id: "q-e712-011-d", text: "Complete", isCorrect: false },
    ],
  }));

  // Q12 — Cloud & Store Setup
  off.push(upsertQuestion({
    id: "q-e712-012", type: "SINGLE", sectionId: secCloud.id,
    text: "A merchant observed a sudden spike in 404 errors on their store, which runs on Adobe Commerce. They identified that the errors are due to an invalid link to the 'staging_update' table.\nWhat is the appropriate solution to delete the invalid link to the 'staging_update' table?",
    explanation: "When a sudden spike in 404 errors occurs related to Content Staging, running `DELETE FROM flag WHERE flag_code = 'staging';` clears the staging flag that may have become corrupted, forcing a fresh rebuild of staging data.",
    options: [
      { id: "q-e712-012-a", text: "Delete 'staging_update' table", isCorrect: false },
      { id: "q-e712-012-b", text: "Run the query, DELETE FROM flag WHERE flag_code = 'staging_404';", isCorrect: false },
      { id: "q-e712-012-c", text: "Run the query, DELETE FROM flag WHERE flag_code = 'staging';", isCorrect: true },
      { id: "q-e712-012-d", text: "Delete all pages with 404 errors, and re-run content linking with 'staging_update' table", isCorrect: false },
    ],
  }));

  // Q13 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e712-013", type: "SINGLE", sectionId: secCommerce.id,
    text: "A merchant wants to calculate shipping rates based on a combination of Weight and Destination.\nWhich default delivery method would a Business Practitioner recommend to the merchant?",
    explanation: "Table Rates shipping allows calculating rates based on a combination of Weight and Destination (as well as price or item count). Flat Rates offer a single fixed rate, and In-Store Delivery is for pickup, not shipping calculations.",
    options: [
      { id: "q-e712-013-a", text: "Table Rates", isCorrect: true },
      { id: "q-e712-013-b", text: "In-Store Delivery", isCorrect: false },
      { id: "q-e712-013-c", text: "Flat Rates", isCorrect: false },
    ],
  }));

  // Q14 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e712-014", type: "SINGLE", sectionId: secCommerce.id,
    text: "A merchant asks a developer to maintain an Order status on an order that does not have an invoice issued, and a confirmation email is also not sent.\nWhat is the relevant Order status and Status Code in Adobe Commerce for this requirement?",
    explanation: "The 'Suspected Fraud' order status with status code `fraud` is the correct status for holding orders flagged for potential fraud. It keeps the order in a review state without processing it further.",
    options: [
      { id: "q-e712-014-a", text: "Order Status: Closed; Status Code: fraud", isCorrect: false },
      { id: "q-e712-014-b", text: "Order Status: Suspected Fraud; Status Code: fraud", isCorrect: true },
      { id: "q-e712-014-c", text: "Order Status: PayPal Canceled Reversal; Status Code: paypal_canceled_reversal", isCorrect: false },
      { id: "q-e712-014-d", text: "Order Status: Pending Paypal; Status Code: paypal_reversed", isCorrect: false },
    ],
  }));

  // Q15 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e712-015", type: "SINGLE", sectionId: secCommerce.id,
    text: "A customer is not able to add a product with a quantity of less than three to their cart.\nWhat would be the reason?",
    explanation: "If a customer cannot add fewer than 3 items to cart, the 'Minimum Qty Allowed in Shopping Cart' is set to 3 in the product's inventory configuration. This enforces a minimum purchase quantity per order.",
    options: [
      { id: "q-e712-015-a", text: "The minimum qty allowed in the shopping cart is set to 3.", isCorrect: true },
      { id: "q-e712-015-b", text: "The maximum qty allowed in the shopping cart is set to 3.", isCorrect: false },
      { id: "q-e712-015-c", text: "The Only X left Threshold is set to 3.", isCorrect: false },
    ],
  }));

  // Q16 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e712-016", type: "SINGLE", sectionId: secCommerce.id,
    text: "Which functionality in Adobe Commerce allows customers to skip entering their credentials every time they arrive to the online storefront?",
    explanation: "The 'Remember Me' functionality allows customers to skip entering credentials on subsequent visits by storing a persistent login cookie. This is a native Adobe Commerce feature configured in customer account settings.",
    options: [
      { id: "q-e712-016-a", text: "Save My Account", isCorrect: false },
      { id: "q-e712-016-b", text: "Cache User", isCorrect: false },
      { id: "q-e712-016-c", text: "Save for 30 Days", isCorrect: false },
      { id: "q-e712-016-d", text: "Remember Me", isCorrect: true },
    ],
  }));

  // Q17 — Marketing & SEO
  off.push(upsertQuestion({
    id: "q-e712-017", type: "SINGLE", sectionId: secMarketing.id,
    text: "A customer needs to generate a set of unique promotion codes to be shared with a marketing agency based around one promotion logic.\nHow would the Business Practitioner do this?",
    explanation: "To generate unique promotion codes for a marketing agency, create a Cart Price Rule with 'Specific Coupon' type, then use the 'Manage Coupon Codes' tab to generate multiple unique codes. Catalog Price Rules do not support coupon codes.",
    options: [
      { id: "q-e712-017-a", text: "Create a cart price rule and generate unique coupon codes.", isCorrect: true },
      { id: "q-e712-017-b", text: "Duplicate a cart price rule for each unique coupon code.", isCorrect: false },
      { id: "q-e712-017-c", text: "Create a catalog price rule and generate unique coupon codes.", isCorrect: false },
    ],
  }));

  // Q18 — Development Fundamentals
  off.push(upsertQuestion({
    id: "q-e712-018", type: "SINGLE", sectionId: secDev.id,
    text: "A developer generated a Commerce module with plugins based on their configuration using the 'bin/magento events:generate:module' command. However, they are unable to locate the module in the file directory.\nWhere could it be found?",
    explanation: "When a Commerce module is generated with plugins using `bin/magento`, the generated code is placed in the `app/code/Magento/AdobeCommerceEvents` directory, following the standard module directory structure under `app/code`.",
    options: [
      { id: "q-e712-018-a", text: "Magento/app/AdobeCommerceEvents directory", isCorrect: false },
      { id: "q-e712-018-b", text: "app/code/Magento/AdobeCommerceEvents directory", isCorrect: true },
      { id: "q-e712-018-c", text: "AdobeCommerce/Apps/Events directory", isCorrect: false },
      { id: "q-e712-018-d", text: "app/Magento/Events/AdobeCommerce directory", isCorrect: false },
    ],
  }));

  // Q19 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e712-019", type: "SINGLE", sectionId: secCommerce.id,
    text: "An Adobe Commerce customer would like to modify Scope around Default Config, Catalog, and Product Prices while configuring their instance.\nWhich classification/category do these parameters fall under?",
    explanation: "The Default Config, Catalog, and Product Prices scope settings operate at the Global scope level. Global scope applies settings across all websites, stores, and store views in the Adobe Commerce installation.",
    options: [
      { id: "q-e712-019-a", text: "Global", isCorrect: true },
      { id: "q-e712-019-b", text: "Store View", isCorrect: false },
      { id: "q-e712-019-c", text: "Website", isCorrect: false },
      { id: "q-e712-019-d", text: "Store", isCorrect: false },
    ],
  }));

  // Q20 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e712-020", type: "MULTIPLE", sectionId: secCommerce.id,
    text: "What are two out-of-the-box features of Magento Open Source? (Choose two.)",
    explanation: "Login as Customer and Transactional Emails are out-of-the-box features available in Magento Open Source. Visual Merchandiser and Reward Points are exclusive to Adobe Commerce (the paid edition).",
    options: [
      { id: "q-e712-020-a", text: "Login as Customer", isCorrect: true },
      { id: "q-e712-020-b", text: "Visual Merchandiser", isCorrect: false },
      { id: "q-e712-020-c", text: "Transactional Emails", isCorrect: true },
      { id: "q-e712-020-d", text: "Reward Points", isCorrect: false },
    ],
  }));

  // Q21 — Development Fundamentals
  off.push(upsertQuestion({
    id: "q-e712-021", type: "SINGLE", sectionId: secDev.id,
    text: "A developer wants to compile their code under bin/magento. Which command should the developer use to accomplish this goal and generate new classes?",
    explanation: "`bin/magento setup:di:compile` compiles dependency injection configurations, generating interceptors, factories, and proxies. The other command variations are not valid Magento CLI commands.",
    options: [
      { id: "q-e712-021-a", text: "bin/magento setup:di:commerce:compile", isCorrect: false },
      { id: "q-e712-021-b", text: "bin/magento setup:di:compile", isCorrect: true },
      { id: "q-e712-021-c", text: "bin/magento setup:compile:run", isCorrect: false },
      { id: "q-e712-021-d", text: "bin/magento setup:compile", isCorrect: false },
    ],
  }));

  // Q22 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e712-022", type: "MULTIPLE", sectionId: secCommerce.id,
    text: "Considering Order workflow in Adobe Commerce, invoices are not created automatically when an order is placed with a few payment methods. What are two of these payment methods? (Choose two.)",
    explanation: "Invoices are not automatically created when an order is placed with Reward Points or Gift Cards as payment. These payment methods require manual invoice creation because they use store credit-type payments that need explicit confirmation.",
    options: [
      { id: "q-e712-022-a", text: "Credit card", isCorrect: false },
      { id: "q-e712-022-b", text: "Reward Points", isCorrect: true },
      { id: "q-e712-022-c", text: "Gift Card", isCorrect: true },
      { id: "q-e712-022-d", text: "Paypal", isCorrect: false },
    ],
  }));

  // Q23 — Cloud & Store Setup
  off.push(upsertQuestion({
    id: "q-e712-023", type: "SINGLE", sectionId: secCloud.id,
    text: "While deploying Adobe Commerce, how many active Integration environments can an Adobe Commerce Developer have for development utilization in Starter Architecture?",
    explanation: "Adobe Commerce Cloud provides two active Integration environments by default. These are development environments branched from the staging environment for testing changes before merging to staging and production.",
    options: [
      { id: "q-e712-023-a", text: "One", isCorrect: false },
      { id: "q-e712-023-b", text: "Two", isCorrect: true },
      { id: "q-e712-023-c", text: "Three", isCorrect: false },
      { id: "q-e712-023-d", text: "More than four", isCorrect: false },
    ],
  }));

  // Q24 — Cloud & Store Setup
  off.push(upsertQuestion({
    id: "q-e712-024", type: "SINGLE", sectionId: secCloud.id,
    text: "Elasticsearch 7 has reached end-of-support in August 2023. What is the recommended search engine for Adobe Commerce customers?",
    explanation: "After Elasticsearch 7 reached end-of-support in August 2023, OpenSearch 2.x is the recommended search engine for Adobe Commerce. It is a community-driven fork of Elasticsearch that Adobe Commerce officially supports.",
    options: [
      { id: "q-e712-024-a", text: "MagentoSearch 1.x search engine", isCorrect: false },
      { id: "q-e712-024-b", text: "ElasticSearch 8.x search engine", isCorrect: false },
      { id: "q-e712-024-c", text: "OpenSearch 2.x search engine", isCorrect: true },
      { id: "q-e712-024-d", text: "OpenSearch 1.x search engine", isCorrect: false },
    ],
  }));

  // Q25 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e712-025", type: "SINGLE", sectionId: secCommerce.id,
    text: "A merchant in the United States currently has a site in English with product prices in US Dollars. This merchant also wants a site in Spanish. The merchant would like customers to select between English and Spanish.\nProducts, categories, prices, and shipping options will be identical on both sites.\nHow would a Business Practitioner advise the merchant to set up Magneto in this situation?",
    explanation: "For a US store adding a Spanish-language storefront with prices remaining in USD (same website, same currency), the correct setup is one website, one store, and two store views — one for English and one for Spanish.",
    options: [
      { id: "q-e712-025-a", text: "Two websites, two stores, two store views.", isCorrect: false },
      { id: "q-e712-025-b", text: "One website, two stores, two store views.", isCorrect: false },
      { id: "q-e712-025-c", text: "One website, one store, two store views.", isCorrect: true },
    ],
  }));

  // Q26 — Marketing & SEO
  off.push(upsertQuestion({
    id: "q-e712-026", type: "MULTIPLE", sectionId: secMarketing.id,
    text: "A merchant asks a developer to make sure that Search Engine Optimization (SEO) configurations are performed in their Adobe Commerce instance to enable indexing in search engines. Which two fields should the developer use to achieve this goal? (Choose two.)",
    explanation: "For SEO on product pages, Meta Title and URL Key are the two key configurations. Meta Title appears in search engine results as the page title, and URL Key determines the product's URL slug. Both are critical for search engine optimization.",
    options: [
      { id: "q-e712-026-a", text: "Meta Title, Meta Keywords", isCorrect: true },
      { id: "q-e712-026-b", text: "URL query params", isCorrect: false },
      { id: "q-e712-026-c", text: "Meta Key", isCorrect: false },
      { id: "q-e712-026-d", text: "URL Key", isCorrect: true },
    ],
  }));

  // Q27 — Cloud & Store Setup
  off.push(upsertQuestion({
    id: "q-e712-027", type: "MULTIPLE", sectionId: secCloud.id,
    text: "What are two ways a CMS block content can be displayed on the front-end without requiring custom development? (Choose two.)",
    explanation: "A CMS block can be displayed on the frontend without custom development by: (1) assigning it to a category's 'Add CMS Block' field with appropriate Display Mode, or (2) creating a CMS Widget instance that uses the CMS Block widget type.",
    options: [
      { id: "q-e712-027-a", text: "By selecting a layout update and position on the CMS block edit page", isCorrect: false },
      { id: "q-e712-027-b", text: "By assigning the CMS block to a category's 'Add CMS Block' field, and setting a 'Display Mode' that includes 'Static Block'", isCorrect: true },
      { id: "q-e712-027-c", text: "By assigning the CMS block to a product's 'CMS Block' attribute under its 'Content' section", isCorrect: false },
      { id: "q-e712-027-d", text: "By creating a new CMS widget instance that uses the CMS block widget type", isCorrect: true },
    ],
  }));

  // Q28 — Catalog & Merchandising
  off.push(upsertQuestion({
    id: "q-e712-028", type: "SINGLE", sectionId: secCatalog.id,
    text: "Adobe Commerce Marketplace provides several options to expand Commerce solutions with several new features and services.\nWhich Adobe Commerce service is a powerful marketing tool that can be used to increase conversions, revenue, and customer engagement?",
    explanation: "Product Recommendations (powered by Adobe Sensei) is available through the Adobe Commerce Marketplace. It uses AI to analyze customer behavior and suggest relevant products. Live Search, Channel Manager, and Catalog Service are separate services.",
    options: [
      { id: "q-e712-028-a", text: "Live Search", isCorrect: false },
      { id: "q-e712-028-b", text: "Channel Manager", isCorrect: false },
      { id: "q-e712-028-c", text: "Product Recommendations", isCorrect: true },
      { id: "q-e712-028-d", text: "Catalog Service", isCorrect: false },
    ],
  }));

  // Q29 — Catalog & Merchandising
  off.push(upsertQuestion({
    id: "q-e712-029", type: "SINGLE", sectionId: secCatalog.id,
    text: "An Adobe Commerce customer who operates both in-store and e-commerce businesses for their apparel brands wants to try using the Buy Online Pickup In-Store (BOPIS) feature.\nWhich version group in Adobe Commerce supports BOPIS?",
    explanation: "Multi-Source Inventory (MSI) was introduced in Adobe Commerce 2.4.x. Earlier versions (2.2.x, 2.3.x) used single-source inventory. Version 2.5.x does not exist in the Adobe Commerce versioning scheme.",
    options: [
      { id: "q-e712-029-a", text: "2.2.x and 2.3.x", isCorrect: false },
      { id: "q-e712-029-b", text: "2.5.x onwards", isCorrect: false },
      { id: "q-e712-029-c", text: "2.2.x only", isCorrect: false },
      { id: "q-e712-029-d", text: "2.4.x", isCorrect: true },
    ],
  }));

  // Q30 — Admin & Security
  off.push(upsertQuestion({
    id: "q-e712-030", type: "SINGLE", sectionId: secAdmin.id,
    text: "A merchant who uses Adobe Commerce for their eCommerce store is considering self-hosting the instance. They have reached out the developer to see if there is a proactive self-service tool and central repository that includes detailed system insights as well as recommendations to ensure security of the application.\nWhich feature or tool in Adobe Commerce is ideal for this requirement?",
    explanation: "The Site-Wide Analysis Tool (SWAT) is Adobe's tool for monitoring and analyzing Adobe Commerce and Magento Open Source installations. It provides performance recommendations, security alerts, and best practice checks.",
    options: [
      { id: "q-e712-030-a", text: "Site-Wide Analysis tool", isCorrect: true },
      { id: "q-e712-030-b", text: "Site-Wide Security tool", isCorrect: false },
      { id: "q-e712-030-c", text: "Store-Wide Analysis tool", isCorrect: false },
      { id: "q-e712-030-d", text: "Commerce Analysis tool", isCorrect: false },
    ],
  }));

  // Q31 — Catalog & Merchandising
  off.push(upsertQuestion({
    id: "q-e712-031", type: "SINGLE", sectionId: secCatalog.id,
    text: "A merchant selling mobile devices would like a new appearance for the best selling product to come into effect on Black Friday. The appearance of the product page must be reverted the following day.\nHow can this be achieved in Magento Open Source?",
    explanation: "To temporarily change a product's appearance for a specific period, schedule a Design Update on the product page. This is a built-in feature that applies layout/theme changes during a defined date range.",
    options: [
      { id: "q-e712-031-a", text: "Create a content staging campaign and add appearance changes to the campaign", isCorrect: false },
      { id: "q-e712-031-b", text: "Schedule a design update for the product", isCorrect: true },
      { id: "q-e712-031-c", text: "Request an Adobe technical account manager for the custom code", isCorrect: false },
      { id: "q-e712-031-d", text: "Install a third-party plugin", isCorrect: false },
    ],
  }));

  // Q32 — Catalog & Merchandising
  off.push(upsertQuestion({
    id: "q-e712-032", type: "SINGLE", sectionId: secCatalog.id,
    text: "How can a Business Practitioner change the position of a product and determine which products will be displayed in a category?",
    explanation: "Visual Merchandiser is the Adobe Commerce tool that allows Business Practitioners to change product positions and determine which products appear at the top of category pages through a drag-and-drop interface in the admin.",
    options: [
      { id: "q-e712-032-a", text: "Using the Category grid in the admin", isCorrect: false },
      { id: "q-e712-032-b", text: "Using the Visual Merchandiser tool in the admin", isCorrect: true },
      { id: "q-e712-032-c", text: "Adding custom code or a third-party module", isCorrect: false },
    ],
  }));

  // Q33 — Cloud & Store Setup
  off.push(upsertQuestion({
    id: "q-e712-033", type: "SINGLE", sectionId: secCloud.id,
    text: "What is Adobe Commerce Cloud?",
    explanation: "Adobe Commerce Cloud is a pre-provisioned infrastructure managed by Adobe that includes all supported technologies for building, deploying, and managing an Adobe Commerce store. It is not managed by partners and is more than just an AWS instance.",
    options: [
      { id: "q-e712-033-a", text: "A pre-provisioned infrastructure, managed by an Adobe partner, that includes all the supported technologies to run Adobe Commerce", isCorrect: false },
      { id: "q-e712-033-b", text: "A pre-provisioned infrastructure, managed by Adobe, that includes all the supported technologies to run Adobe Commerce", isCorrect: true },
      { id: "q-e712-033-c", text: "An instance of Adobe Commerce on Amazon Web Services (AWS)", isCorrect: false },
    ],
  }));

  // Q34 — Cloud & Store Setup
  off.push(upsertQuestion({
    id: "q-e712-034", type: "MULTIPLE", sectionId: secCloud.id,
    text: "Which two versions of Adobe Commerce support the 'Page Builder drag-and-drop content management' feature? (Choose two.)",
    explanation: "Page Builder's drag-and-drop content management feature is available in Adobe Commerce versions 2.3 and 2.4. It was introduced in 2.3 and continued in 2.4. Versions 2.1 and 2.6 do not include it (2.6 does not exist).",
    options: [
      { id: "q-e712-034-a", text: "2.4", isCorrect: true },
      { id: "q-e712-034-b", text: "2.6", isCorrect: false },
      { id: "q-e712-034-c", text: "2.1", isCorrect: false },
      { id: "q-e712-034-d", text: "2.3", isCorrect: true },
    ],
  }));

  // Q35 — Marketing & SEO
  off.push(upsertQuestion({
    id: "q-e712-035", type: "SINGLE", sectionId: secMarketing.id,
    text: "A merchant wants to set up cart price rules for the Apparel catalog in their eCommerce site through the Adobe Commerce interface.\nThe merchant has two cart rules/coupon codes that are valid for the same product at the same time, and needs a solution to apply cart rules without any runtime conflicts.\nWhat should the Business Practitioner suggest to the merchant, to achieve this goal?",
    explanation: "When multiple cart price rules could apply, the 'Priority' setting determines which rule takes precedence. Lower priority numbers are applied first. Adobe Commerce does not randomly apply rules or use currency value for precedence.",
    options: [
      { id: "q-e712-035-a", text: "Advise the merchant to apply the 'Weightage' setting to the cart rules.", isCorrect: false },
      { id: "q-e712-035-b", text: "Advise the merchant to apply the 'Priority' setting to the cart rules.", isCorrect: true },
      { id: "q-e712-035-c", text: "Tell the merchant that the cart price rule with the lowest currency value takes precedence automatically.", isCorrect: false },
      { id: "q-e712-035-d", text: "Tell the merchant that Adobe Commerce randomly applies the cart rules, and no additional actions are required.", isCorrect: false },
    ],
  }));

  // Q36 — Development Fundamentals
  off.push(upsertQuestion({
    id: "q-e712-036", type: "MULTIPLE", sectionId: secDev.id,
    text: "In order to use Adobe Commerce or Magento Open Source services as Web APIs, the webapi.xml file must be configured. What are two Required components for the webapi.xml file? (Choose two.)",
    explanation: "In the `webapi.xml` file, the `` element defines the URL patterns and HTTP methods for API endpoints, and the `` element specifies which service interface and method handle the request. `` and `` are not valid webapi.xml elements.",
    options: [
      { id: "q-e712-036-a", text: "", isCorrect: false },
      { id: "q-e712-036-b", text: "", isCorrect: false },
      { id: "q-e712-036-c", text: "", isCorrect: true },
      { id: "q-e712-036-d", text: "", isCorrect: true },
    ],
  }));

  // Q37 — Marketing & SEO
  off.push(upsertQuestion({
    id: "q-e712-037", type: "SINGLE", sectionId: secMarketing.id,
    text: "In order to capture basic site analytics and customer engagement, websites are tagged with several JavaScript tags. And in order to deploy and run these tags efficiently, tag management systems (TMS) are widely used.\nWhich of the below is the popular tag management system provided by Adobe?",
    explanation: "Adobe Experience Platform Tags (formerly Adobe Launch) is Adobe's tag management system for deploying analytics and marketing JavaScript tags on websites. It integrates natively with the Adobe ecosystem.",
    options: [
      { id: "q-e712-037-a", text: "Ensighten", isCorrect: false },
      { id: "q-e712-037-b", text: "Tags", isCorrect: true },
      { id: "q-e712-037-c", text: "Clarity", isCorrect: false },
      { id: "q-e712-037-d", text: "Tealium iQ", isCorrect: false },
    ],
  }));

  // Q38 — Development Fundamentals
  off.push(upsertQuestion({
    id: "q-e712-038", type: "SINGLE", sectionId: secDev.id,
    text: "In a standard installation process, where can we locate the assets associated with a particular theme in the 'web' folder?",
    explanation: "Theme assets (CSS, JavaScript, images, fonts) are located in `[commerce_root]/app/design/frontend/magento/[theme_name]/web`. This follows Magento's standard theme directory structure under `app/design`.",
    options: [
      { id: "q-e712-038-a", text: "[commerce_application]/design/frontend/magento/[theme_name]/web", isCorrect: false },
      { id: "q-e712-038-b", text: "[commerce_root]/app/design/frontend/magento/[theme_name]/web", isCorrect: true },
      { id: "q-e712-038-c", text: "[commerce_design]/application/frontend/magento/[theme_name]/web", isCorrect: false },
      { id: "q-e712-038-d", text: "[commerce_store]/application/design/frontend/magento/[theme_name]/web", isCorrect: false },
    ],
  }));

  // Q39 — Admin & Security
  off.push(upsertQuestion({
    id: "q-e712-039", type: "SINGLE", sectionId: secAdmin.id,
    text: "A business owner wants to use Admin Bulk Operations to asynchronously apply mass product actions over their product inventory. What is the default batch size when running bulk operations asynchronously in Adobe Commerce?",
    explanation: "The default batch size for Admin Bulk Operations when applying mass product actions asynchronously is 100 items. This can be configured in the Admin under Stores > Configuration > Advanced > System > Admin Actions Log.",
    options: [
      { id: "q-e712-039-a", text: "100", isCorrect: true },
      { id: "q-e712-039-b", text: "600", isCorrect: false },
      { id: "q-e712-039-c", text: "40", isCorrect: false },
      { id: "q-e712-039-d", text: "1000", isCorrect: false },
    ],
  }));

  // Q40 — Marketing & SEO
  off.push(upsertQuestion({
    id: "q-e712-040", type: "SINGLE", sectionId: secMarketing.id,
    text: "A Business Practitioner is changing the URL key for a product.\nHow can they ensure that website traffic to the previously-named URL does not return a 404 page not found error?",
    explanation: "When changing a product's URL key, checking the 'Create Permanent Redirect for old URL' option creates a 301 redirect from the old URL to the new one, preserving SEO value and ensuring visitors reach the correct page.",
    options: [
      { id: "q-e712-040-a", text: "Add a 301 redirect in the Robot.txt", isCorrect: false },
      { id: "q-e712-040-b", text: "Enable canonical tags for product pages", isCorrect: false },
      { id: "q-e712-040-c", text: "Check the \"Create Permanent Redirect for old URL\" option", isCorrect: true },
    ],
  }));

  // Q41 — Development Fundamentals
  off.push(upsertQuestion({
    id: "q-e712-041", type: "SINGLE", sectionId: secDev.id,
    text: "While implementing Adapters in Adobe Commerce, which library provides Minifier functionality?",
    explanation: "The `Magento/Framework/Code` library provides Minifier functionality in Adobe Commerce. It handles JavaScript and CSS minification as part of the static content deployment process.",
    options: [
      { id: "q-e712-041-a", text: "Magento/Code", isCorrect: false },
      { id: "q-e712-041-b", text: "Magento/Framework/Code", isCorrect: true },
      { id: "q-e712-041-c", text: "Magento/Framework/Compression", isCorrect: false },
      { id: "q-e712-041-d", text: "Magento/Code/Compression", isCorrect: false },
    ],
  }));

  // Q42 — Catalog & Merchandising
  off.push(upsertQuestion({
    id: "q-e712-042", type: "SINGLE", sectionId: secCatalog.id,
    text: "While performing the Catalog Sync for the first time in Adobe Commerce, what should the sequence of the data sync process be?",
    explanation: "When performing Catalog Sync for the first time, the correct sequence is: first `productattributes` (attribute definitions), then `productoverrides` (per-store overrides), then `products` (the actual product data). Attributes must be defined before product data can reference them.",
    options: [
      { id: "q-e712-042-a", text: "Run 'products' and 'productattributes' sync in a sequence", isCorrect: false },
      { id: "q-e712-042-b", text: "Run 'productoverrides', 'productattributes', and 'products' sync in a sequence", isCorrect: false },
      { id: "q-e712-042-c", text: "Run 'productattributes', 'productoverrides', and 'products' in a sequence", isCorrect: true },
      { id: "q-e712-042-d", text: "Directly run 'products' sync", isCorrect: false },
    ],
  }));

  // Q43 — Admin & Security
  off.push(upsertQuestion({
    id: "q-e712-043", type: "SINGLE", sectionId: secAdmin.id,
    text: "An Adobe Commerce developer was asked by a database developer about the ways to query the store and product data of their organization. Which feature in Adobe Commerce allows you to run SQL queries and retrieve the data?",
    explanation: "SQL Report Builder in Commerce Intelligence allows database developers and admins to query store and catalog data using SQL directly. It provides an interface for building custom reports from Adobe Commerce data.",
    options: [
      { id: "q-e712-043-a", text: "Commerce SQL Editor", isCorrect: false },
      { id: "q-e712-043-b", text: "SQL Workspace", isCorrect: false },
      { id: "q-e712-043-c", text: "Query Optimizer", isCorrect: false },
      { id: "q-e712-043-d", text: "SQL Report Builder", isCorrect: true },
    ],
  }));

  // Q44 — Marketing & SEO
  off.push(upsertQuestion({
    id: "q-e712-044", type: "SINGLE", sectionId: secMarketing.id,
    text: "A merchant's Google Analytics account has been created and now they want to integrate tracking in Magento Open Source.\nHow is this achieved?",
    explanation: "To integrate Google Analytics tracking in Magento, simply enable Google Analytics in the Admin Panel (Stores > Configuration > Sales > Google API) and input the correct account number. No custom development or linking from Google's side is needed.",
    options: [
      { id: "q-e712-044-a", text: "It requires custom development or a third-party extension.", isCorrect: false },
      { id: "q-e712-044-b", text: "Link the Magento Store inside the Google Analytics configuration.", isCorrect: false },
      { id: "q-e712-044-c", text: "Enable Google Analytics in the Admin Panel and input the correct account number.", isCorrect: true },
    ],
  }));

  // Q45 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e712-045", type: "SINGLE", sectionId: secCommerce.id,
    text: "An Adobe Magento open-source merchant would like to use the Instant purchase feature in the payment method so customers can place an order with just one click and save time.\nWhich payment method would the Business Practitioner suggest to merchants from out-of-the-box Magento open source?",
    explanation: "For the Instant Purchase feature, PayPal Payflow Pro is the supported payment method in Magento Open Source. It supports vault (stored card) functionality required for one-click purchasing. Klarna and Payflow Link do not support this.",
    options: [
      { id: "q-e712-045-a", text: "Klarna", isCorrect: false },
      { id: "q-e712-045-b", text: "PayPal Payflow Link", isCorrect: false },
      { id: "q-e712-045-c", text: "PayPal Payflow Pro", isCorrect: true },
    ],
  }));

  // Q46 — Admin & Security
  off.push(upsertQuestion({
    id: "q-e712-046", type: "SINGLE", sectionId: secAdmin.id,
    text: "What is the purpose of the Magento Security Scan Tool?",
    explanation: "The Magento Security Scan Tool monitors Adobe Commerce and Magento Open Source sites (including PWA) for known security risks and provides notifications about vulnerabilities, malware, and unauthorized access attempts.",
    options: [
      { id: "q-e712-046-a", text: "To scan custom modules, extensions, and third-party integrations that assist with User Acceptance Testing (UAT) on Staging and Production.", isCorrect: false },
      { id: "q-e712-046-b", text: "To monitor Adobe Commerce and Magento Open Source sites, including PWA, for known security risks and malware, and to receive patch updates and security notifications.", isCorrect: true },
      { id: "q-e712-046-c", text: "To scan the pre-deployment Production environment to confirm that all required configuration and testing is completed and the code is ready for deployment.", isCorrect: false },
    ],
  }));

  // Q47 — Admin & Security
  off.push(upsertQuestion({
    id: "q-e712-047", type: "MULTIPLE", sectionId: secAdmin.id,
    text: "What two accessibility options would be needed to maintain ADA compliance for those who are blind or have low visibility? (Choose two.)",
    explanation: "For ADA compliance for users who are blind or have vision impairments, Screen Reader support and Voice Navigation are the two essential accessibility options. These allow non-visual interaction with the website.",
    options: [
      { id: "q-e712-047-a", text: "Downloadable sitemap", isCorrect: false },
      { id: "q-e712-047-b", text: "Optical Character recognition", isCorrect: false },
      { id: "q-e712-047-c", text: "Screen Reader", isCorrect: true },
      { id: "q-e712-047-d", text: "Voice Navigation", isCorrect: true },
    ],
  }));

  // Q48 — Admin & Security
  off.push(upsertQuestion({
    id: "q-e712-048", type: "SINGLE", sectionId: secAdmin.id,
    text: "What is a requirement of the CAN-SPAM Act?",
    explanation: "The CAN-SPAM Act requires that recipients' opt-out requests must be honored within 10 business days. While physical address and content rules also apply, the opt-out honoring requirement is a key mandate of the Act.",
    options: [
      { id: "q-e712-048-a", text: "Recipients' opt-out requests must be honored within 10 business days.", isCorrect: true },
      { id: "q-e712-048-b", text: "Commercial content can only be sent to recipients who opted-in to emails from the company on behalf of which the email is sent.", isCorrect: false },
      { id: "q-e712-048-c", text: "A commercial email must include valid physical postal address of the company on behalf of which the email is sent.", isCorrect: false },
      { id: "q-e712-048-d", text: "An email cannot include commercial content in an email that has a transactional primary purpose.", isCorrect: false },
    ],
  }));

  // Q49 — Admin & Security
  off.push(upsertQuestion({
    id: "q-e712-049", type: "SINGLE", sectionId: secAdmin.id,
    text: "What is the purpose of ReCaptcha?",
    explanation: "reCAPTCHA is a method to protect against automated brute force attacks by distinguishing human users from bots. It is not related to ADA compliance, login attempt limits, or user authentication.",
    options: [
      { id: "q-e712-049-a", text: "It enables ADA compliance for those who have vision or hearing deficits.", isCorrect: false },
      { id: "q-e712-049-b", text: "It is a method to protect against automated brute force attacks.", isCorrect: true },
      { id: "q-e712-049-c", text: "It limits the amount of attempts a registered user can log in and out of the system.", isCorrect: false },
    ],
  }));

  // Q50 — Admin & Security
  off.push(upsertQuestion({
    id: "q-e712-050", type: "MULTIPLE", sectionId: secAdmin.id,
    text: "Which two options are required by GDPR when requesting marketing consent from customers? (Choose two.)",
    explanation: "GDPR requires that: (1) marketing consent must be separate from terms & conditions acceptance (no bundled consent), and (2) records must be kept showing details of the consent given (proof of consent). Pre-ticked boxes and bundled consents are explicitly prohibited.",
    options: [
      { id: "q-e712-050-a", text: "Marketing consent must be separate from terms & conditions acceptance.", isCorrect: true },
      { id: "q-e712-050-b", text: "Opt-in boxes must be pre-ticked.", isCorrect: false },
      { id: "q-e712-050-c", text: "Records must be kept to show the details of the consent given.", isCorrect: true },
      { id: "q-e712-050-d", text: "Multiple marketing consents must be done with a single opt-in.", isCorrect: false },
    ],
  }));

  // ─── Practice Test ─────────────────────────────────────────────────────────

  const allQuestions = await Promise.all(off);
  console.log(`Created/updated ${allQuestions.length} questions.`);

  await prisma.practiceTestQuestion.deleteMany({
    where: { practiceTestId: "pt-official-e712" },
  });

  await prisma.practiceTest.upsert({
    where: { id: "pt-official-e712" },
    update: { questionCount: allQuestions.length },
    create: {
      id: "pt-official-e712",
      certificationId: cert.id,
      title: "Official Practice Exam",
      type: "OFFICIAL",
      questionCount: allQuestions.length,
    },
  });

  for (let i = 0; i < allQuestions.length; i++) {
    await prisma.practiceTestQuestion.create({
      data: {
        practiceTestId: "pt-official-e712",
        questionId: allQuestions[i].id,
        position: i + 1,
      },
    });
  }

  console.log(`Linked ${allQuestions.length} questions to Official Practice Exam.`);
  console.log("AD0-E712 seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
