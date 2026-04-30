import type { CertDefinition } from "../types";

export const ad0e712: CertDefinition = {
  id: "ad0-e712",
  code: "AD0-E712",
  name: "Adobe Commerce Business Practitioner Professional",
  provider: "adobe-commerce",
  level: "professional",
  description:
    "Validates foundational knowledge of Adobe Commerce features, configuration, storefront management, and business operations from a non-technical perspective.",
  sections: [
    {
      name: "Magento Commerce Features & Configuration",
      percentage: 30,
      topics: [
        "Product types and attributes",
        "Store configuration and scope",
        "Category management",
        "Customer groups and segments",
        "Tax and currency configuration",
      ],
    },
    {
      name: "Merchandising & Marketing",
      percentage: 25,
      topics: [
        "Catalog and cart price rules",
        "Content staging and preview",
        "CMS pages and blocks",
        "Email templates",
        "SEO best practices",
      ],
    },
    {
      name: "Order Management",
      percentage: 25,
      topics: [
        "Order lifecycle and status",
        "Invoices, shipments, credit memos",
        "Payment and shipping methods",
        "Returns and RMA",
        "Multi-source inventory basics",
      ],
    },
    {
      name: "Reporting & Analytics",
      percentage: 20,
      topics: [
        "Built-in reports (sales, customers, products)",
        "Business Intelligence basics",
        "Google Analytics integration",
        "Dashboard widgets",
      ],
    },
  ],
  exam: {
    totalQuestions: 50,
    passingScore: 35,
    timeLimitMinutes: 100,
  },
  active: true,
  studyResources: {
    officialGuide:
      "https://experienceleague.adobe.com/docs/certification/certification/technical-certifications/ac/ac-professional/ac-p-business.html",
  },
};
