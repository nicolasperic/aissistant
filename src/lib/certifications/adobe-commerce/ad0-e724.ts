import type { CertDefinition } from "../types";

export const ad0e724: CertDefinition = {
  id: "ad0-e724",
  code: "AD0-E724",
  name: "Adobe Commerce Developer Professional",
  provider: "adobe-commerce",
  level: "professional",
  description:
    "Validates foundational skills in Adobe Commerce / Magento 2 development, including module structure, dependency injection, layouts, plugins, and database concepts.",
  sections: [
    {
      name: "Working with Admin",
      percentage: 16,
      topics: [
        "Admin grids and forms",
        "ACL and permissions",
        "System configuration",
        "Admin routing and controllers",
      ],
    },
    {
      name: "Architecture",
      percentage: 18,
      topics: [
        "Module structure and registration",
        "Dependency injection",
        "Service contracts and APIs",
        "Area concepts (frontend, adminhtml, crontab, etc.)",
        "Magento directory structure",
      ],
    },
    {
      name: "EAV & Extensions",
      percentage: 12,
      topics: [
        "EAV model and attribute management",
        "Custom attributes",
        "Extension attributes",
        "Attribute sets and groups",
      ],
    },
    {
      name: "Catalog",
      percentage: 12,
      topics: [
        "Product types",
        "Category management",
        "Pricing and tier prices",
        "Inventory management",
      ],
    },
    {
      name: "Sales",
      percentage: 12,
      topics: [
        "Quote and order flow",
        "Payment and shipping methods",
        "Cart price rules",
        "Order processing",
      ],
    },
    {
      name: "Layout, Templates & Blocks",
      percentage: 18,
      topics: [
        "Layout XML",
        "Block types and template rendering",
        "Container vs block",
        "Theme fallback",
        "UI components",
      ],
    },
    {
      name: "Customizing Business Logic",
      percentage: 12,
      topics: [
        "Plugins (before, after, around)",
        "Events and observers",
        "Cron jobs",
        "CLI commands",
      ],
    },
  ],
  exam: {
    totalQuestions: 60,
    passingScore: 42,
    timeLimitMinutes: 120,
  },
  active: true,
  studyResources: {
    officialGuide:
      "https://experienceleague.adobe.com/docs/certification/certification/technical-certifications/ac/ac-professional/ac-p-developer.html",
  },
};
