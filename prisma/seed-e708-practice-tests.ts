import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding AD0-E708 Business Practitioner Expert practice tests...");

  // ─── Certification ─────────────────────────────────────────────────────────

  const cert = await prisma.certification.upsert({
    where: { id: "cert-ad0-e708" },
    update: {},
    create: {
      id: "cert-ad0-e708",
      name: "Adobe Commerce Business Practitioner Expert",
      code: "AD0-E708",
      provider: "Adobe",
      description:
        "Validates expertise in Adobe Commerce business operations including catalog management, B2B features, marketing, order management, reporting, and store configuration.",
      totalQuestions: 50,
      passingScore: 31,
      timeLimitMinutes: 100,
    },
  });

  // ─── Sections ──────────────────────────────────────────────────────────────

  const [secCommerce, secB2b, secProducts, secMarketing, secAdmin, secContent] =
    await Promise.all([
      prisma.certSection.upsert({
        where: { id: "sec708-commerce" },
        update: { name: "Commerce Features & Orders", percentage: 24 },
        create: { id: "sec708-commerce", certificationId: cert.id, name: "Commerce Features & Orders", percentage: 24 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec708-b2b" },
        update: { name: "B2B Features", percentage: 14 },
        create: { id: "sec708-b2b", certificationId: cert.id, name: "B2B Features", percentage: 14 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec708-products" },
        update: { name: "Products & Merchandising", percentage: 12 },
        create: { id: "sec708-products", certificationId: cert.id, name: "Products & Merchandising", percentage: 12 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec708-marketing" },
        update: { name: "Marketing & Promotions", percentage: 10 },
        create: { id: "sec708-marketing", certificationId: cert.id, name: "Marketing & Promotions", percentage: 10 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec708-admin" },
        update: { name: "Admin, Security & Compliance", percentage: 20 },
        create: { id: "sec708-admin", certificationId: cert.id, name: "Admin, Security & Compliance", percentage: 20 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec708-content" },
        update: { name: "Content & Store Setup", percentage: 20 },
        create: { id: "sec708-content", certificationId: cert.id, name: "Content & Store Setup", percentage: 20 },
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

  // Q1 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e708-001", type: "SINGLE", sectionId: secCommerce.id,
    text: "A customer places an order, but later wants to add an additional product before it is shipped.\nCan this action be performed natively in Adobe Commerce?",
    explanation: "Adobe Commerce does not natively support adding products to an existing order after it has been placed. This requires custom development. The 'Edit Order' functionality creates a new order and cancels the original — it does not modify the existing order in place.",
    options: [
      { id: "q-e708-001-a", text: "No, custom development is required", isCorrect: true },
      { id: "q-e708-001-b", text: "Yes, using the Order Management system", isCorrect: false },
      { id: "q-e708-001-c", text: "Yes, by cancelling the original order and placing a new one", isCorrect: false },
      { id: "q-e708-001-d", text: "Yes, using the Modify Order feature", isCorrect: false },
    ],
  }));

  // Q2 — B2B Features
  off.push(upsertQuestion({
    id: "q-e708-002", type: "SINGLE", sectionId: secB2b.id,
    text: "A merchant wants to allow their B2B customers to negotiate pricing before placing an order on their e-commerce store.\nWhich native Adobe Commerce feature should the merchant use?",
    explanation: "The Request for Quote (RFQ) feature in Adobe Commerce B2B allows buyers to submit a quote request, and the merchant can negotiate pricing before the order is placed. This is the native B2B feature specifically designed for price negotiation.",
    options: [
      { id: "q-e708-002-a", text: "Purchase orders", isCorrect: false },
      { id: "q-e708-002-b", text: "Contact Us form", isCorrect: false },
      { id: "q-e708-002-c", text: "Request for quote", isCorrect: true },
    ],
  }));

  // Q3 — Admin, Security & Compliance
  off.push(upsertQuestion({
    id: "q-e708-003", type: "SINGLE", sectionId: secAdmin.id,
    text: "The DACI model is a project management framework. It is used to clearly define the roles and responsibilities of various stakeholders within a project.\nWhat does DACI stand for?",
    explanation: "DACI stands for Driver, Approver, Contributor, Informed. The Driver leads the initiative, the Approver gives final sign-off, Contributors provide input, and Informed stakeholders are kept in the loop. It is a project management framework for role clarity.",
    options: [
      { id: "q-e708-003-a", text: "Driver, Accountable, Contributor, Informed", isCorrect: false },
      { id: "q-e708-003-b", text: "Division, Approver, Contributor, Informed", isCorrect: false },
      { id: "q-e708-003-c", text: "Driver, Approver, Contributor, Informed", isCorrect: true },
      { id: "q-e708-003-d", text: "Division, Accountable, Contributor, Informed", isCorrect: false },
    ],
  }));

  // Q4 — Marketing & Promotions
  off.push(upsertQuestion({
    id: "q-e708-004", type: "SINGLE", sectionId: secMarketing.id,
    text: "An online marketer has created a cart price rule in the Admin console.\nThey need a coupon code to be applied in the shopping cart on the frontend. Coupon codes were already created by using a third-party tool, and the online marketer wants to import these for the newly-created rule into Magento.\nHow can this goal be achieved?",
    explanation: "Adobe Commerce's native cart price rule functionality does not support importing coupon codes from a file. This requires custom development or a third-party extension. The admin can generate auto-coupon codes but not import them from external files.",
    options: [
      { id: "q-e708-004-a", text: "This is not possible using default functionality; this can only be achieved by consulting with a developer or by using custom functionality.", isCorrect: true },
      { id: "q-e708-004-b", text: "In the edit form for the cart price rule, go to \"Manage Coupon Codes\" and click on the \"Import\" button to select a file and import it directly.", isCorrect: false },
      { id: "q-e708-004-c", text: "Use the import functionality in the admin: System > Import, and select Coupon Codes. This allows the import by selecting the correct cart price rule.", isCorrect: false },
    ],
  }));

  // Q5 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e708-005", type: "SINGLE", sectionId: secCommerce.id,
    text: "A store has undergone a pricing update, and a business practitioner needs to update all product prices quickly in Adobe Commerce using a CSV file.\nWhere in the admin panel should the business practitioner navigate to perform this mass update?",
    explanation: "To bulk-update product prices in Adobe Commerce, navigate to System > Data Transfer > Import. This allows CSV-based bulk imports of product data including prices. The other menu paths listed are incorrect.",
    options: [
      { id: "q-e708-005-a", text: "Catalog > Products > Update Prices", isCorrect: false },
      { id: "q-e708-005-b", text: "System > Import/Export > Import", isCorrect: false },
      { id: "q-e708-005-c", text: "System > Data Transfer > Import", isCorrect: true },
      { id: "q-e708-005-d", text: "System > Import/Export > Import", isCorrect: false },
    ],
  }));

  // Q6 — Content & Store Setup
  off.push(upsertQuestion({
    id: "q-e708-006", type: "MULTIPLE", sectionId: secContent.id,
    text: "Which two features are excluded in Adobe Commerce Open Source Edition? (Choose two.)",
    explanation: "Visual Merchandiser and Content Staging are features exclusive to Adobe Commerce (the paid edition) and are not available in the Open Source edition. Page Builder and Multi-Source Inventory (MSI) are available in both editions.",
    options: [
      { id: "q-e708-006-a", text: "Visual Merchandiser", isCorrect: true },
      { id: "q-e708-006-b", text: "Content Staging", isCorrect: true },
      { id: "q-e708-006-c", text: "Page Builder", isCorrect: false },
      { id: "q-e708-006-d", text: "Multi-Source Inventory (MSI)", isCorrect: false },
    ],
  }));

  // Q7 — Products & Merchandising
  off.push(upsertQuestion({
    id: "q-e708-007", type: "SINGLE", sectionId: secProducts.id,
    text: "A client wants to sell a chocolate gift bag. The customer will be able to choose the quantity and type of chocolate from a predefined set, based on stock availability, as well as the type of gift bag to be used.\nWhich Adobe Commerce product type would be best suited for this client's needs?",
    explanation: "A Bundle product allows customers to choose the quantity and type of items from a predefined set of options. This matches the chocolate gift bag scenario where customers pick specific chocolates. Grouped products don't allow per-item quantity selection in the same way.",
    options: [
      { id: "q-e708-007-a", text: "Grouped product", isCorrect: false },
      { id: "q-e708-007-b", text: "Simple product", isCorrect: false },
      { id: "q-e708-007-c", text: "Configurable product", isCorrect: false },
      { id: "q-e708-007-d", text: "Bundle product", isCorrect: true },
    ],
  }));

  // Q8 — Content & Store Setup
  off.push(upsertQuestion({
    id: "q-e708-008", type: "MULTIPLE", sectionId: secContent.id,
    text: "Which two statements about customizing email templates in Magento are correct? (Choose two.)",
    explanation: "In Adobe Commerce email template customization: (1) You can specify custom header and footer templates per store or store view, (2) the configuration scope determines which templates are used, and (3) saving the configuration is necessary to apply changes. Default templates are NOT always used — customizations override them.",
    options: [
      { id: "q-e708-008-a", text: "You can specify custom header and footer templates for different stores or store views.", isCorrect: true },
      { id: "q-e708-008-b", text: "The configuration scope determines which templates are used.", isCorrect: true },
      { id: "q-e708-008-c", text: "Default templates are always used, regardless of any customizations made.", isCorrect: false },
      { id: "q-e708-008-d", text: "Saving the configuration is necessary to apply the changes made to the email templates.", isCorrect: true },
    ],
  }));

  // Q9 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e708-009", type: "SINGLE", sectionId: secCommerce.id,
    text: "A merchant aims to enhance the customer experience for registered customers by providing shipping tracking numbers.\nHow can this goal be achieved?",
    explanation: "To display shipping tracking numbers to customers, add tracking numbers while creating shipments in the backend. Once added, tracking information is immediately visible on the customer's 'My Orders' page in their account dashboard.",
    options: [
      { id: "q-e708-009-a", text: "Require customers to contact customer support for tracking information", isCorrect: false },
      { id: "q-e708-009-b", text: "Manually email tracking numbers to customers after creating shipments", isCorrect: false },
      { id: "q-e708-009-c", text: "Add tracking numbers while creating shipments to display them immediately on the frontend customer \"My Account\" order view", isCorrect: true },
      { id: "q-e708-009-d", text: "Add tracking numbers as an order comment from the backend", isCorrect: false },
    ],
  }));

  // Q10 — Content & Store Setup
  off.push(upsertQuestion({
    id: "q-e708-010", type: "SINGLE", sectionId: secContent.id,
    text: "A business practitioner is working as a consultant for an online fashion retailer. The client wants to create custom landing pages for seasonal sales without needing to involve a developer for each change. They also want to ensure that these landing pages are optimized for SEO and mobile devices.\nWhich feature of Adobe Commerce should the business practitioner recommend to the client?",
    explanation: "Page Builder is the native Adobe Commerce tool for creating custom landing pages with rich content layouts, drag-and-drop functionality, and built-in content types. It's the recommended tool for creating custom pages without developer assistance.",
    options: [
      { id: "q-e708-010-a", text: "Visual Merchandiser", isCorrect: false },
      { id: "q-e708-010-b", text: "Dynamic Blocks", isCorrect: false },
      { id: "q-e708-010-c", text: "Content Staging", isCorrect: false },
      { id: "q-e708-010-d", text: "Page Builder", isCorrect: true },
    ],
  }));

  // Q11 — Products & Merchandising
  off.push(upsertQuestion({
    id: "q-e708-011", type: "SINGLE", sectionId: secProducts.id,
    text: "A customer wants to offer a set of related items, such as a complete living room furniture set, that includes a sofa, coffee table, and two armchairs. Each item should be listed separately on the product page, but customers should be able to add the entire set to their cart with one click.\nWhich product type should be used to meet this requirement?",
    explanation: "A Grouped Product presents a collection of related simple products on a single page where customers can select quantities for each item. This is ideal for a furniture set (sofa, coffee table, rug) where each item is purchased independently but displayed together.",
    options: [
      { id: "q-e708-011-a", text: "Configurable Product", isCorrect: false },
      { id: "q-e708-011-b", text: "Bundled Product", isCorrect: false },
      { id: "q-e708-011-c", text: "Simple Product", isCorrect: false },
      { id: "q-e708-011-d", text: "Grouped Product", isCorrect: true },
    ],
  }));

  // Q12 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e708-012", type: "SINGLE", sectionId: secCommerce.id,
    text: "A client wants to offer tiered shipping rates based on order totals, such as $5 for orders under $50, $3 for orders between $50 and $100, and free shipping for orders over $100.\nWhich native shipping method in Adobe Commerce should a business practitioner use to configure these tiered rates?",
    explanation: "Table Rates shipping allows merchants to define tiered shipping rates based on conditions like order total, weight, or number of items. This is the correct choice for offering different shipping prices at different order total thresholds.",
    options: [
      { id: "q-e708-012-a", text: "FedEx", isCorrect: false },
      { id: "q-e708-012-b", text: "UPS", isCorrect: false },
      { id: "q-e708-012-c", text: "Table Rates", isCorrect: true },
      { id: "q-e708-012-d", text: "Flat Rate", isCorrect: false },
    ],
  }));

  // Q13 — Admin, Security & Compliance
  off.push(upsertQuestion({
    id: "q-e708-013", type: "SINGLE", sectionId: secAdmin.id,
    text: "A super admin suspects that the product \"Bag\" has been modified by another admin.\nThe super admin wants to confirm the suspicion and determine who made the edits by checking the edit history of the product to identify the responsible admin.\nWhat should the super admin do to achieve this goal?",
    explanation: "To view who modified a product and when, navigate to System > Actions Logs > Report. This Admin Actions log tracks all administrative changes including product modifications, showing which admin user made each change.",
    options: [
      { id: "q-e708-013-a", text: "Navigate to System > Actions Logs > Report.", isCorrect: true },
      { id: "q-e708-013-b", text: "Check in New Relic.", isCorrect: false },
      { id: "q-e708-013-c", text: "Add a custom module.", isCorrect: false },
    ],
  }));

  // Q14 — Content & Store Setup
  off.push(upsertQuestion({
    id: "q-e708-014", type: "SINGLE", sectionId: secContent.id,
    text: "A client wants to create a homepage with dynamic content blocks and banners.\nWhich tool should they use within Adobe Commerce?",
    explanation: "Page Builder is the native Adobe Commerce tool for creating homepages with dynamic content blocks and banners. It provides a visual drag-and-drop editor for building rich page layouts without requiring developer intervention.",
    options: [
      { id: "q-e708-014-a", text: "Import/Export Tool", isCorrect: false },
      { id: "q-e708-014-b", text: "Page Builder", isCorrect: true },
      { id: "q-e708-014-c", text: "Visual Merchandiser", isCorrect: false },
      { id: "q-e708-014-d", text: "Content Staging", isCorrect: false },
    ],
  }));

  // Q15 — Marketing & Promotions
  off.push(upsertQuestion({
    id: "q-e708-015", type: "SINGLE", sectionId: secMarketing.id,
    text: "A merchant wants to increase average order value by offering customers the ability to add recommended items in the shopping cart.\nHow can the merchant accomplish this goal?",
    explanation: "Cross-sell items configured in the cart encourage customers to add complementary products, increasing average order value. This is a native feature that displays recommended products on the shopping cart page.",
    options: [
      { id: "q-e708-015-a", text: "Add a new products list widget to the cart", isCorrect: false },
      { id: "q-e708-015-b", text: "Configure and enable cross-sell items in cart", isCorrect: true },
      { id: "q-e708-015-c", text: "Install a marketplace extension", isCorrect: false },
    ],
  }));

  // Q16 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e708-016", type: "SINGLE", sectionId: secCommerce.id,
    text: "What is the primary purpose of the order life cycle in Adobe Commerce?",
    explanation: "The primary purpose of the order life cycle in Adobe Commerce is to streamline the order processing workflow — from order placement through payment, fulfillment, shipping, and completion. It provides a structured process for managing orders.",
    options: [
      { id: "q-e708-016-a", text: "To optimize website performance", isCorrect: false },
      { id: "q-e708-016-b", text: "To streamline the order processing workflow", isCorrect: true },
      { id: "q-e708-016-c", text: "To track the inventory of products", isCorrect: false },
      { id: "q-e708-016-d", text: "To manage customer accounts", isCorrect: false },
    ],
  }));

  // Q17 — Admin, Security & Compliance
  off.push(upsertQuestion({
    id: "q-e708-017", type: "MULTIPLE", sectionId: secAdmin.id,
    text: "A merchant asks a Business Practitioner Expert for help with optimizations for their Customer Support Team. They want to know which built-in features can be enabled to arrange a better customer experience and reduce the number of calls to the Customer Support Team.\nThe Business Practitioner Expert needs to recommend a solution that is available in both Magento 2 Open Source and Adobe Commerce edition.\nWhich two features should the expert recommend? (Choose two.)",
    explanation: "To optimize customer support: (1) The Contact Us form provides a native way for customers to reach support, and (2) Shopper Assistance (Login as Customer) allows support agents to log in as a customer to see their experience and help resolve issues directly.",
    options: [
      { id: "q-e708-017-a", text: "Live Chat", isCorrect: false },
      { id: "q-e708-017-b", text: "Contact Us form", isCorrect: true },
      { id: "q-e708-017-c", text: "Return Merchandise Authorization", isCorrect: false },
      { id: "q-e708-017-d", text: "Shopper Assistance (Login as Customer)", isCorrect: true },
    ],
  }));

  // Q18 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e708-018", type: "SINGLE", sectionId: secCommerce.id,
    text: "A merchant offers free shipping for domestic orders over $75 but charges a flat rate for international shipping.\nHow can this shipping method be configured in Adobe Commerce?",
    explanation: "Table Rates allow configuring different shipping rates based on destination (domestic vs. international) and order conditions (like total > $75). This is more flexible than a single Free Shipping or Flat Rate method for this mixed shipping scenario.",
    options: [
      { id: "q-e708-018-a", text: "Configure Table Rates for different shipping destinations", isCorrect: true },
      { id: "q-e708-018-b", text: "Use Shopping Cart Price Rules to waive shipping fees for orders over $75", isCorrect: false },
      { id: "q-e708-018-c", text: "Set up Flat Rate for all customers", isCorrect: false },
      { id: "q-e708-018-d", text: "Configure a Free Shipping Method", isCorrect: false },
    ],
  }));

  // Q19 — B2B Features
  off.push(upsertQuestion({
    id: "q-e708-019", type: "SINGLE", sectionId: secB2b.id,
    text: "A merchant wants their B2B customers to save time when purchasing frequently-ordered products.\nThey are looking for a function where customers can save products for future purchases and manage their own lists to reduce the time spent searching and adding products every time.\nWhich function does the Adobe Commerce B2B module natively support?",
    explanation: "Requisition Lists in Adobe Commerce B2B allow customers to save frequently ordered products for quick reordering. This is specifically designed for B2B scenarios where the same products are purchased repeatedly.",
    options: [
      { id: "q-e708-019-a", text: "Requisition lists", isCorrect: true },
      { id: "q-e708-019-b", text: "Wish lists", isCorrect: false },
      { id: "q-e708-019-c", text: "Save for later", isCorrect: false },
    ],
  }));

  // Q20 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e708-020", type: "SINGLE", sectionId: secCommerce.id,
    text: "A merchant wants to offer the ability for customers to add a gift message to their order.\nUsing the standard Adobe Commerce gift message functionality, at what level can the merchant allow the customer to write a gift message?",
    explanation: "Gift messages in Adobe Commerce can be entered for individual order items and/or the entire order. This allows customers to add personalized messages at both the item level and the order level.",
    options: [
      { id: "q-e708-020-a", text: "Gift messages can be entered for individual order items and/or the entire order.", isCorrect: true },
      { id: "q-e708-020-b", text: "A single gift message can be entered.  This message applies to the entire order.", isCorrect: false },
      { id: "q-e708-020-c", text: "Gift messages can only be entered against the individual order items.", isCorrect: false },
    ],
  }));

  // Q21 — Content & Store Setup
  off.push(upsertQuestion({
    id: "q-e708-021", type: "SINGLE", sectionId: secContent.id,
    text: "A business practitioner advises a customer to improve their store's navigation experience by adding breadcrumb trails to all CMS pages.\nWhich configuration setting should they adjust to implement this feature?",
    explanation: "To display breadcrumbs on CMS pages, enable the 'Show Breadcrumbs for CMS Pages' setting in the configuration. This adds navigation breadcrumbs to CMS pages, improving the navigation experience.",
    options: [
      { id: "q-e708-021-a", text: "Adjust the CMS Home Page setting.", isCorrect: false },
      { id: "q-e708-021-b", text: "Modify the CMS No Route Page.", isCorrect: false },
      { id: "q-e708-021-c", text: "Set the Default Web URL to cms.", isCorrect: false },
      { id: "q-e708-021-d", text: "Enable the Show Breadcrumbs for CMS Pages.", isCorrect: true },
    ],
  }));

  // Q22 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e708-022", type: "SINGLE", sectionId: secCommerce.id,
    text: "A merchant would like to manage gift wrapping options in Adobe Commerce.\nHow can this be configured?",
    explanation: "Gift wrapping in Adobe Commerce can be configured at both the order level and for specific items. This provides flexibility for customers to choose gift wrapping for the entire order or individual products.",
    options: [
      { id: "q-e708-022-a", text: "Only at the item level", isCorrect: false },
      { id: "q-e708-022-b", text: "Only as a customization", isCorrect: false },
      { id: "q-e708-022-c", text: "Only at the order level", isCorrect: false },
      { id: "q-e708-022-d", text: "At the order level and also for specific items", isCorrect: true },
    ],
  }));

  // Q23 — B2B Features
  off.push(upsertQuestion({
    id: "q-e708-023", type: "SINGLE", sectionId: secB2b.id,
    text: "A merchant using Magento Open Source would like to launch a presence on a new domain to target B2B customers. The merchant would like to use the same category structure for both domains, but have certain categories show exclusively on the B2B website.\nHow can they achieve this goal?",
    explanation: "In Magento Open Source (which lacks Shared Catalogs), configure category permissions to restrict product visibility for different customer groups. This allows hiding certain products or categories from retail customers while showing them to B2B customers.",
    options: [
      { id: "q-e708-023-a", text: "Configure category permissions", isCorrect: true },
      { id: "q-e708-023-b", text: "Enable and set up shared catalogs", isCorrect: false },
      { id: "q-e708-023-c", text: "Create a new stock and source", isCorrect: false },
    ],
  }));

  // Q24 — Products & Merchandising
  off.push(upsertQuestion({
    id: "q-e708-024", type: "SINGLE", sectionId: secProducts.id,
    text: "A merchant develops an Adobe Commerce website selling gold wedding rings, each ring has a size and an optional engraving entered before adding the product to cart. All sizes of the same product have the same price and engraving costs an additional $50.\nThey want to track the stock of every ring size separately but not for engravings. They also already created the Size product attribute and populated it will all the required values.\nWhat is the best way to create such products in Adobe Commerce using native features?",
    explanation: "For gold wedding rings with size (attribute) and engraving (custom text), set up a configurable product based on the 'Size' attribute with one Customizable Option for the engraving text field. Configurable products handle predefined attribute variations, while customizable options handle free-form customer input.",
    options: [
      { id: "q-e708-024-a", text: "Set up a configurable product with configurations based on the “Size” attribute with one Customizable Options “Engraving” and set as optional.\n\nEngraving would be a Text Field with Price set to 50, Price Type set to Fixed, and SKU left empty.", isCorrect: true },
      { id: "q-e708-024-b", text: "Set up a configurable product with configurations based on the “Size” attribute and with one Customizable Options “Engraving”.\n\n\"Engraving\" would have an Option Type of Composite with two values, one having an Option Type of Text and a value of \"No\" with SKU left empty and the other with Option Type of Text Field with Price set to 50, Price Type set to Fixed and SKU left empty.", isCorrect: false },
      { id: "q-e708-024-c", text: "Set up a configurable product with configurations based on the “Size” attribute with two Customizable Options, “Engraving is required” and “Engraving Text”.\n\n\"Engraving is required\" would be a drop-down attribute with Yes and No values.  The “Yes” value has the Price set to 50, Price Type set to Fixed, and SKU left empty.\n\n\"Engraving Text\" would be a Text Field with the Parent option set to “Engraving”, Parent Value set to “Yes”, and SKU left empty.", isCorrect: false },
    ],
  }));

  // Q25 — Marketing & Promotions
  off.push(upsertQuestion({
    id: "q-e708-025", type: "SINGLE", sectionId: secMarketing.id,
    text: "An administrator wants to run a promotion for a specific set of products using a coupon code.\nWhich feature can be used for achieving this goal?",
    explanation: "Cart Price Rules are used for coupon-code-based promotions that apply discounts in the shopping cart. Catalog Price Rules apply discounts at the catalog level (before adding to cart) and don't support coupon codes. Related Product Rules control product recommendations.",
    options: [
      { id: "q-e708-025-a", text: "Related Product Rules", isCorrect: false },
      { id: "q-e708-025-b", text: "Cart Price Rules", isCorrect: true },
      { id: "q-e708-025-c", text: "Catalog Price Rules", isCorrect: false },
    ],
  }));

  // Q26 — Marketing & Promotions
  off.push(upsertQuestion({
    id: "q-e708-026", type: "SINGLE", sectionId: secMarketing.id,
    text: "A merchant using Adobe Commerce wants to offer discounts on specific products for a limited time period.\nHow should the administrator implement this discount?",
    explanation: "To offer time-limited discounts on specific products, schedule a Catalog Price Rule with the appropriate date range. Content Staging (in Adobe Commerce) can also schedule this, but the direct approach is using catalog price rules with start/end dates.",
    options: [
      { id: "q-e708-026-a", text: "Create a coupon code for customers to use during checkout", isCorrect: false },
      { id: "q-e708-026-b", text: "Manually adjust the prices of the products during the specified time period", isCorrect: false },
      { id: "q-e708-026-c", text: "Schedule a catalog price rule to apply discounts to the selected products during the desired timeframe", isCorrect: true },
      { id: "q-e708-026-d", text: "Configure a cart price rule with conditions based on product attributes", isCorrect: false },
    ],
  }));

  // Q27 — Products & Merchandising
  off.push(upsertQuestion({
    id: "q-e708-027", type: "SINGLE", sectionId: secProducts.id,
    text: "The configurable product visibility is set to \"Not Visible Individually,\" and the assigned simple product is set to \"catalog search\".\nHow will the Adobe Commerce store behave when customers perform a catalog search?",
    explanation: "When a configurable product is set to 'Not Visible Individually' but its simple product children are visible, only the simple product details appear in search results, linking to their individual product pages. The configurable parent is hidden from search.",
    options: [
      { id: "q-e708-027-a", text: "Configurable product details are displayed directly in the search results.", isCorrect: false },
      { id: "q-e708-027-b", text: "The configurable product appears as a standalone item in the search results.", isCorrect: false },
      { id: "q-e708-027-c", text: "Only simple product details are shown in the search results, leading to their individual product pages.", isCorrect: true },
      { id: "q-e708-027-d", text: "No products are displayed in the search results due to visibility settings.", isCorrect: false },
    ],
  }));

  // Q28 — Products & Merchandising
  off.push(upsertQuestion({
    id: "q-e708-028", type: "SINGLE", sectionId: secProducts.id,
    text: "A merchant has set a special price for a product that should only apply to wholesale customers. However, retail customers are also seeing the special price.\nWhat might be the issue?",
    explanation: "If a special price intended for wholesale customers is showing for all customer groups, the special price has been incorrectly set to apply to all customer groups. Special prices in Adobe Commerce apply globally unless tier pricing or customer group-specific pricing is used instead.",
    options: [
      { id: "q-e708-028-a", text: "The default price rule is overriding customer group-specific pricing.", isCorrect: false },
      { id: "q-e708-028-b", text: "The special price has been incorrectly set to apply to all customer groups.", isCorrect: true },
      { id: "q-e708-028-c", text: "The product is in a shared category between retail and wholesale customers.", isCorrect: false },
      { id: "q-e708-028-d", text: "The merchant needs to create a Catalog Price Rule for wholesale customers only.", isCorrect: false },
    ],
  }));

  // Q29 — Admin, Security & Compliance
  off.push(upsertQuestion({
    id: "q-e708-029", type: "SINGLE", sectionId: secAdmin.id,
    text: "Which type of data can be analyzed within Adobe Commerce without the integration of any third-party sources?",
    explanation: "Adobe Commerce natively provides order-related reporting data including sales reports, tax reports, and customer reports without requiring third-party integrations. Live Search analytics, heat mapping, and Google Analytics channel attribution all require external services.",
    options: [
      { id: "q-e708-029-a", text: "Search-related data from Live Search service", isCorrect: false },
      { id: "q-e708-029-b", text: "Order-related data from Adobe Commerce", isCorrect: true },
      { id: "q-e708-029-c", text: "Heat-mapping data from Adobe Commerce", isCorrect: false },
      { id: "q-e708-029-d", text: "Channel-attribution data from Google Analytics", isCorrect: false },
    ],
  }));

  // Q30 — Marketing & Promotions
  off.push(upsertQuestion({
    id: "q-e708-030", type: "SINGLE", sectionId: secMarketing.id,
    text: "What should the 'Default Robots' be set to to allow an Adobe Commerce website to be crawled and indexed by a search engine robot?",
    explanation: "Setting Default Robots to 'INDEX, FOLLOW' allows search engines to crawl and index the website pages and follow links. This is the standard SEO configuration for making a site discoverable by search engines.",
    options: [
      { id: "q-e708-030-a", text: "INDEX, FOLLOW", isCorrect: true },
      { id: "q-e708-030-b", text: "INDEX, NOFOLLOW", isCorrect: false },
      { id: "q-e708-030-c", text: "ALLOW, INDEX", isCorrect: false },
      { id: "q-e708-030-d", text: "Crawl Delay: 0", isCorrect: false },
    ],
  }));

  // Q31 — B2B Features
  off.push(upsertQuestion({
    id: "q-e708-031", type: "SINGLE", sectionId: secB2b.id,
    text: "A merchant wants to offer negotiated pricing to some of their strategic customers, who are divided into four groups. These customers receive a percentage discount, ranging from 5 - 20% on select items. Some customers also receive a further discount for buying large quantities.\nWhich Adobe Commerce B2B feature should the merchant use to achieve this goal?",
    explanation: "Shared Catalogs in Adobe Commerce B2B allow merchants to set custom pricing and product visibility for different company groups. This is the native feature for offering negotiated pricing to strategic customer segments.",
    options: [
      { id: "q-e708-031-a", text: "Catalog Price Rule", isCorrect: false },
      { id: "q-e708-031-b", text: "Cart Price Rule", isCorrect: false },
      { id: "q-e708-031-c", text: "Shared Catalog", isCorrect: true },
    ],
  }));

  // Q32 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e708-032", type: "SINGLE", sectionId: secCommerce.id,
    text: "A merchant using MSI wants to transfer specific quantities of one or more products from one Source to another Source using Bulk APIs.\nWhich bulk API would be recommended to fulfill this requirement?",
    explanation: "Bulk Partial Transfer in MSI allows transferring specific quantities of products from one source to another, as opposed to Bulk Transfer which moves all inventory. This is useful when only partial stock needs to be redistributed.",
    options: [
      { id: "q-e708-032-a", text: "Bulk transfer", isCorrect: false },
      { id: "q-e708-032-b", text: "Bulk partial transfer", isCorrect: true },
      { id: "q-e708-032-c", text: "Bulk assign sources", isCorrect: false },
    ],
  }));

  // Q33 — Commerce Features & Orders
  off.push(upsertQuestion({
    id: "q-e708-033", type: "SINGLE", sectionId: secCommerce.id,
    text: "A client wants to create two websites for different regions on a single Adobe Commerce Cloud instance. They have a warehouse and several retail stores in each region. They need each website to track inventory.\nThe available inventory on each website should be the sum of each product's quantity in the warehouse and any retail stores located in the website's target region.\nHow would this be configured in the Adobe Commerce instance?",
    explanation: "For multi-region websites with separate inventory: create inventory sources for each warehouse/retail store, create Stocks for each website, assign sources to stocks, and link stocks to sales channels (websites). This leverages MSI's multi-source architecture properly.",
    options: [
      { id: "q-e708-033-a", text: "\nChange the scope of the Stock attribute from Global to Website\nCalculate the stock value for each Product per Website\nSave the inventory value at the appropriate Website scope\n", isCorrect: false },
      { id: "q-e708-033-b", text: "\nCreate an inventory Source for each Website\nCreate Stocks for each Product\nAssign the Stocks to the appropriate Sources, and define Stock quantities for each Product\n", isCorrect: false },
      { id: "q-e708-033-c", text: "\nCopy all of the products\nAssign a copy to each Website\nCalculate the stock value for each Product per Website\nSave it to the appropriate copy of the Product\n", isCorrect: false },
      { id: "q-e708-033-d", text: "\nCreate inventory sources for each warehouse and retail store\nCreate Stocks for each Website from the appropriate Sources\nDefine the Sources and quantities for each Product\n", isCorrect: true },
    ],
  }));

  // Q34 — Products & Merchandising
  off.push(upsertQuestion({
    id: "q-e708-034", type: "SINGLE", sectionId: secProducts.id,
    text: "A merchant is looking to implement advanced product recommendations on their site and wants to understand the difference between native recommendations and those powered by Adobe Sensei.\nWhat is a benefit unique to Adobe Sensei Product Recommendations?",
    explanation: "Adobe Commerce Product Recommendations (powered by Adobe Sensei) provides intelligent product recommendations based on customer behavior, browsing patterns, and purchase history. This is AI-driven and goes beyond manual assignment of related products.",
    options: [
      { id: "q-e708-034-a", text: "Customizing recommendation blocks for different store views", isCorrect: false },
      { id: "q-e708-034-b", text: "Manual assignment of related products, up-sells, and cross-sells", isCorrect: false },
      { id: "q-e708-034-c", text: "Intelligent product recommendations based on customer behavior", isCorrect: true },
      { id: "q-e708-034-d", text: "Setting up product rules for recommendation types", isCorrect: false },
    ],
  }));

  // Q35 — B2B Features
  off.push(upsertQuestion({
    id: "q-e708-035", type: "SINGLE", sectionId: secB2b.id,
    text: "A merchant wants to allow large corporate clients to manage their own purchasing process with multiple buyers, approvers, and permission levels.\nWhich Adobe Commerce B2B feature allows customers to set up and manage different user roles and permissions for purchasing?",
    explanation: "Company Accounts in Adobe Commerce B2B enable large corporate clients to manage their own purchasing hierarchy with multiple buyers, roles, and permissions. This is the foundational B2B feature for organizational purchasing management.",
    options: [
      { id: "q-e708-035-a", text: "Company Accounts", isCorrect: true },
      { id: "q-e708-035-b", text: "Shared Catalog", isCorrect: false },
      { id: "q-e708-035-c", text: "Purchase Orders", isCorrect: false },
      { id: "q-e708-035-d", text: "Requisition Lists", isCorrect: false },
    ],
  }));

  // Q36 — Admin, Security & Compliance
  off.push(upsertQuestion({
    id: "q-e708-036", type: "SINGLE", sectionId: secAdmin.id,
    text: "Which statements accurately compares the features of Commerce Intelligence Essentials and Commerce Intelligence Pro?",
    explanation: "Commerce Intelligence Essentials offers up to 100 pre-defined reports, while Commerce Intelligence Pro provides unlimited custom reports and advanced analytics capabilities including custom SQL queries and report building.",
    options: [
      { id: "q-e708-036-a", text: "Commerce Intelligence Essentials includes unlimited commerce tables, whereas Commerce Intelligence Pro has 4 - 6 tables.", isCorrect: false },
      { id: "q-e708-036-b", text: "Both Commerce Intelligence Essentials and Commerce Intelligence Pro offer access to Customer Success (CS), Account Managers (AM), or Analysts.", isCorrect: false },
      { id: "q-e708-036-c", text: "Commerce Intelligence Essentials offers up to 100 pre-defined reports, while Commerce Intelligence Pro provides custom reports.", isCorrect: true },
    ],
  }));

  // Q37 — B2B Features
  off.push(upsertQuestion({
    id: "q-e708-037", type: "MULTIPLE", sectionId: secB2b.id,
    text: "A US merchant has been selling clothing D2C on their Adobe Commerce with the B2B add-on installation. They would like to start selling B2B, and need to avoid charging sales tax to these B2B customers.\nWhich two actions need to be taken to configure Adobe Commerce with the B2B add-on for these new customers? (Choose two.)",
    explanation: "To accommodate B2B customers with different tax requirements: (1) Create a special tax class and rate for the B2B tax rules, and (2) create a new customer group for B2B customers that uses the special tax class. This properly separates B2B and D2C tax handling.",
    options: [
      { id: "q-e708-037-a", text: "Create a special tax class and rate.", isCorrect: true },
      { id: "q-e708-037-b", text: "Create a new catalog with special pricing for B2B customers.", isCorrect: false },
      { id: "q-e708-037-c", text: "Create a new Store for B2B customers.", isCorrect: false },
      { id: "q-e708-037-d", text: "Create a new customer group for B2B customers.", isCorrect: true },
    ],
  }));

  // Q38 — B2B Features
  off.push(upsertQuestion({
    id: "q-e708-038", type: "SINGLE", sectionId: secB2b.id,
    text: "A business needs to offer tailored product assortments and pricing structures to different companies they serve.\nWhich Adobe Commerce feature allows them to achieve this?",
    explanation: "Shared Catalogs in Adobe Commerce B2B allow creating tailored product assortments with custom pricing for different companies. Each company can be assigned a specific shared catalog with its own product selection and pricing structure.",
    options: [
      { id: "q-e708-038-a", text: "Customer Group Pricing", isCorrect: false },
      { id: "q-e708-038-b", text: "Shared Catalogs", isCorrect: true },
      { id: "q-e708-038-c", text: "Catalog Price Rules", isCorrect: false },
      { id: "q-e708-038-d", text: "Grouped Products", isCorrect: false },
    ],
  }));

  // Q39 — Content & Store Setup
  off.push(upsertQuestion({
    id: "q-e708-039", type: "MULTIPLE", sectionId: secContent.id,
    text: "Which three features does LiveSearch offer? (Choose three.)",
    explanation: "Adobe Commerce Live Search offers: (1) Auto-complete suggestions as users type, (2) an AI-powered search engine (Adobe Sensei) for intelligent result ranking, and (3) a SaaS-based service hosted by Adobe. It is not AWS-hosted.",
    options: [
      { id: "q-e708-039-a", text: "Auto-complete suggestions", isCorrect: true },
      { id: "q-e708-039-b", text: "AI-powered search engine", isCorrect: true },
      { id: "q-e708-039-c", text: "AWS-hosted search engine", isCorrect: false },
      { id: "q-e708-039-d", text: "SaaS-based service", isCorrect: true },
    ],
  }));

  // Q40 — Admin, Security & Compliance
  off.push(upsertQuestion({
    id: "q-e708-040", type: "MULTIPLE", sectionId: secAdmin.id,
    text: "GDPR applies to any organization operating within the EU. It also applies to organizations outside of the EU that offer goods or services to customers or businesses in the EU.\nA merchant is asking how they can become GDPR compliant, using Adobe Commerce.\nWhich two recommendations should you provide? (Choose two.)",
    explanation: "For GDPR compliance: (B) Development teams can use dataflow diagrams and database entity mapping to ensure data handling is documented, and (C) third-party extensions can be installed for extended GDPR requirements. Core code customization is NOT needed — Adobe Commerce provides built-in GDPR tools.",
    options: [
      { id: "q-e708-040-a", text: "B: The merchant's development team or System Integrators can use the dataflow diagrams and database information provided in the Personal Information Reference to build scripts to resolve use cases.", isCorrect: true },
      { id: "q-e708-040-b", text: "A: To enable GDPR compliance, core code customization is needed in Adobe Commerce. The merchant needs to open a support ticket to become GDPR-ready.", isCorrect: false },
      { id: "q-e708-040-c", text: "C: Third-party extensions can be installed to meet extended business requirements from Adobe Commerce marketplace.", isCorrect: true },
    ],
  }));

  // Q41 — Content & Store Setup
  off.push(upsertQuestion({
    id: "q-e708-041", type: "SINGLE", sectionId: secContent.id,
    text: "A website sells in the French speaking countries of France, Belgium, Switzerland, and Canada using the French language. They also sell in the UK, Canada, Ireland, and Belgium in English. France, Belgium, Switzerland, and Ireland are charged the same prices in Euros. Canada and the UK are charged pricing specific to each country and charged in their respective currencies, Canadian Dollar and Pound Sterling.\nWhat is the minimum number of websites and store views required?",
    explanation: "France (EUR), Belgium (EUR, French), Switzerland (CHF, French + German), Canada (CAD, French + English) = 3 websites (grouped by currency/region: EUR countries, CHF, CAD) and 5 store views (France-FR, Belgium-FR, Switzerland-FR, Switzerland-DE, Canada-FR). Actually the exact answer is 3 websites, 5 store views.",
    options: [
      { id: "q-e708-041-a", text: "3 websites, 5 store views", isCorrect: true },
      { id: "q-e708-041-b", text: "6 websites, 6 store views", isCorrect: false },
      { id: "q-e708-041-c", text: "3 websites, 7 store views", isCorrect: false },
      { id: "q-e708-041-d", text: "1 website, 6 store views", isCorrect: false },
    ],
  }));

  // Q42 — Admin, Security & Compliance
  off.push(upsertQuestion({
    id: "q-e708-042", type: "SINGLE", sectionId: secAdmin.id,
    text: "A merchant's development team is performing load testing in the staging environment. Their development team noticed that the place order action on the checkout page is taking 500 milliseconds longer than usual. They asked for your recommendation for an acceptable caching TTL on the checkout page.\nWhat should the TTL be on checkout page?",
    explanation: "In a staging environment, Full Page Cache (FPC) is typically disabled (no cache) to ensure that testing reflects the latest changes without cached content interfering. This allows developers to see immediate results of their changes.",
    options: [
      { id: "q-e708-042-a", text: "The TTL is set based on customer interactions dynamically", isCorrect: false },
      { id: "q-e708-042-b", text: "30 minutes", isCorrect: false },
      { id: "q-e708-042-c", text: "1 hour", isCorrect: false },
      { id: "q-e708-042-d", text: "No cache", isCorrect: true },
    ],
  }));

  // Q43 — Admin, Security & Compliance
  off.push(upsertQuestion({
    id: "q-e708-043", type: "MULTIPLE", sectionId: secAdmin.id,
    text: "A website administrator didn't see the scope switch in the Store > Configuration.\nWhat are two likely reasons for this occurrence? (Choose two.)",
    explanation: "The scope switcher (store/website selector) in Store > Configuration is hidden when: (1) 'Enable Single-Store Mode' is set to Yes, or (2) there is only one store. Single-store mode explicitly hides the scope switcher, and having only one store means there's nothing to switch between.",
    options: [
      { id: "q-e708-043-a", text: "\"Enable Multi-Store Mode\" is No.", isCorrect: false },
      { id: "q-e708-043-b", text: "This website has only one website.", isCorrect: false },
      { id: "q-e708-043-c", text: "This website has only one store.", isCorrect: true },
      { id: "q-e708-043-d", text: "\"Enable Single-Store Mode\" is Yes.", isCorrect: true },
    ],
  }));

  // Q44 — Content & Store Setup
  off.push(upsertQuestion({
    id: "q-e708-044", type: "SINGLE", sectionId: secContent.id,
    text: "A company using Adobe Commerce wants to offer personalized shopping experiences across multiple channels, including web, mobile, and social platforms, while maintaining a single backend.\nWhich architecture would best support this requirement?",
    explanation: "For personalized shopping experiences across multiple channels (web, mobile, kiosk, etc.), a headless architecture with Adobe Commerce APIs provides maximum flexibility. It decouples the frontend from the backend, allowing different frontends to consume the same Commerce APIs.",
    options: [
      { id: "q-e708-044-a", text: "Headless architecture with Adobe Commerce APIs", isCorrect: true },
      { id: "q-e708-044-b", text: "Traditional with responsive design templates", isCorrect: false },
      { id: "q-e708-044-c", text: "Hybrid approach with a shared Magento theme", isCorrect: false },
      { id: "q-e708-044-d", text: "Traditional monolithic architecture", isCorrect: false },
    ],
  }));

  // Q45 — Admin, Security & Compliance
  off.push(upsertQuestion({
    id: "q-e708-045", type: "SINGLE", sectionId: secAdmin.id,
    text: "An administrator needs to share admin access with a third-party vendor.\nWhich Magento feature can be used for giving them restricted access?",
    explanation: "Admin User Roles and Permissions allow creating restricted admin accounts with specific access levels. This is the native Magento feature for securely sharing admin access with third-party vendors while limiting what they can see and do.",
    options: [
      { id: "q-e708-045-a", text: "Data protection mode for admin access", isCorrect: false },
      { id: "q-e708-045-b", text: "Automatic alerts for insecure admin actions", isCorrect: false },
      { id: "q-e708-045-c", text: "Admin user roles and permissions", isCorrect: true },
    ],
  }));

  // Q46 — Admin, Security & Compliance
  off.push(upsertQuestion({
    id: "q-e708-046", type: "SINGLE", sectionId: secAdmin.id,
    text: "Some tax jurisdictions have a fixed tax that must be added to certain types of products.\nA business practitioner needs to configure a store to collect a Waste Electrical and Electronic Equipment (WEEE) tax. This tax is also known as ecological tax and is collected on certain types of electronics to offset the cost of recycling.\nWhat should a business practitioner do to achieve this goal in the system?",
    explanation: "Fixed Product Tax (FPT) in Adobe Commerce handles fixed taxes like WEEE (Waste Electrical and Electronic Equipment) tax that must be added to specific product types. FPT is configured per product and displayed as a separate line item.",
    options: [
      { id: "q-e708-046-a", text: "Implement a dynamic tax calculation extension from the Magento Marketplace.", isCorrect: false },
      { id: "q-e708-046-b", text: "Utilize custom tax rules within the tax configuration settings.", isCorrect: false },
      { id: "q-e708-046-c", text: "Adjust the shipping settings to include the WEEE tax in the final cost.", isCorrect: false },
      { id: "q-e708-046-d", text: "Configure a Fixed Product Tax (FPT) for applicable products.", isCorrect: true },
    ],
  }));

  // Q47 — Admin, Security & Compliance
  off.push(upsertQuestion({
    id: "q-e708-047", type: "SINGLE", sectionId: secAdmin.id,
    text: "A merchant begins receiving hundreds of spam submissions to their Contact Us form.\nHow can the merchant reduce the spam submissions?",
    explanation: "Enabling reCAPTCHA for the Contact Us form is the recommended approach to prevent spam submissions. Adobe Commerce has native reCAPTCHA support that can be enabled for various storefront forms including Contact Us.",
    options: [
      { id: "q-e708-047-a", text: "Disable the Contact Us form", isCorrect: false },
      { id: "q-e708-047-b", text: "Enable reCAPTCHA for the Contact Us form", isCorrect: true },
      { id: "q-e708-047-c", text: "Enable two-factor authentication for the Contact Us form", isCorrect: false },
    ],
  }));

  // Q48 — Admin, Security & Compliance
  off.push(upsertQuestion({
    id: "q-e708-048", type: "SINGLE", sectionId: secAdmin.id,
    text: "What is a secure method for storing credit card information for future purchases?",
    explanation: "Card vaulting is the secure method for storing credit card information for future purchases. It stores a token reference with the payment gateway instead of actual card data, complying with PCI-DSS requirements.",
    options: [
      { id: "q-e708-048-a", text: "Filesystem", isCorrect: false },
      { id: "q-e708-048-b", text: "Database", isCorrect: false },
      { id: "q-e708-048-c", text: "Card vaulting", isCorrect: true },
      { id: "q-e708-048-d", text: "3-D Secure (3DS)", isCorrect: false },
    ],
  }));

  // Q49 — Admin, Security & Compliance
  off.push(upsertQuestion({
    id: "q-e708-049", type: "SINGLE", sectionId: secAdmin.id,
    text: "To detect and mitigate Cross-Site Scripting (XSS) and related data injection attacks, additional layers of defenses are implemented in Adobe Commerce and Magento Open Source installations.\nWhich service is responsible for mitigating these attacks?",
    explanation: "Content Security Policy (CSP) is the web security standard that helps detect and mitigate Cross-Site Scripting (XSS) and data injection attacks by controlling which resources the browser is allowed to load for a given page.",
    options: [
      { id: "q-e708-049-a", text: "Commerce Security Policy", isCorrect: false },
      { id: "q-e708-049-b", text: "Content Protection Policy", isCorrect: false },
      { id: "q-e708-049-c", text: "General Security Policy", isCorrect: false },
      { id: "q-e708-049-d", text: "Content Security Policy", isCorrect: true },
    ],
  }));

  // Q50 — Admin, Security & Compliance
  off.push(upsertQuestion({
    id: "q-e708-050", type: "SINGLE", sectionId: secAdmin.id,
    text: "A merchant is concerned about securing payment transactions on their Adobe Commerce store.\nWhich feature should they enable to ensure secure processing of credit card transactions?",
    explanation: "Enforcing HTTPS on all pages is the most fundamental security measure for payment transactions. It encrypts all data in transit between the customer's browser and the server, protecting payment information from interception.",
    options: [
      { id: "q-e708-050-a", text: "Payment Services Direct Integration", isCorrect: false },
      { id: "q-e708-050-b", text: "2FA for customer accounts", isCorrect: false },
      { id: "q-e708-050-c", text: "HTTPS enforced on all pages", isCorrect: true },
      { id: "q-e708-050-d", text: "CAPTCHA for payment forms", isCorrect: false },
    ],
  }));

  // ─── Practice Test ─────────────────────────────────────────────────────────

  const allQuestions = await Promise.all(off);
  console.log(`Created/updated ${allQuestions.length} questions.`);

  await prisma.practiceTestQuestion.deleteMany({
    where: { practiceTestId: "pt-official-e708" },
  });

  await prisma.practiceTest.upsert({
    where: { id: "pt-official-e708" },
    update: { questionCount: allQuestions.length },
    create: {
      id: "pt-official-e708",
      certificationId: cert.id,
      title: "Official Practice Exam",
      type: "OFFICIAL",
      questionCount: allQuestions.length,
    },
  });

  for (let i = 0; i < allQuestions.length; i++) {
    await prisma.practiceTestQuestion.create({
      data: {
        practiceTestId: "pt-official-e708",
        questionId: allQuestions[i].id,
        position: i + 1,
      },
    });
  }

  console.log(`Linked ${allQuestions.length} questions to Official Practice Exam.`);
  console.log("AD0-E708 seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
