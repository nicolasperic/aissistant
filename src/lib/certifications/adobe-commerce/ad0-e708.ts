import type { CertDefinition } from "../types";

export const ad0e708: CertDefinition = {
  id: "ad0-e708",
  code: "AD0-E708",
  name: "Adobe Commerce Business Practitioner Expert",
  provider: "adobe-commerce",
  level: "expert",
  description:
    "Validates advanced expertise in Adobe Commerce business operations, including complex catalog management, multi-store setups, B2B features, marketing strategies, and reporting.",
  sections: [
    {
      name: "Core Commerce Features",
      percentage: 28,
      topics: [
        "Multi-store and multi-website configuration",
        "Advanced product types and configurations",
        "Attribute sets and custom attributes",
        "Customer management and segmentation",
        "Store scope and configuration hierarchy",
      ],
    },
    {
      name: "Merchandising & Content",
      percentage: 24,
      topics: [
        "Visual merchandiser and category merchandising",
        "Advanced catalog and cart price rules",
        "Content staging, scheduling, and preview",
        "Page Builder advanced usage",
        "Related products, upsells, and cross-sells",
      ],
    },
    {
      name: "Order Management & Fulfillment",
      percentage: 24,
      topics: [
        "Complex order workflows",
        "Multi-source inventory (MSI)",
        "Returns and RMA workflows",
        "Payment gateway configuration",
        "Shipping method customization",
      ],
    },
    {
      name: "B2B & Advanced Features",
      percentage: 12,
      topics: [
        "Company accounts and structure",
        "Shared catalogs",
        "Requisition lists and quick order",
        "Negotiable quotes",
        "Purchase orders and approval rules",
      ],
    },
    {
      name: "Reporting & Business Intelligence",
      percentage: 12,
      topics: [
        "Advanced reporting",
        "Business Intelligence dashboards",
        "Data export and integration",
        "Customer and sales analytics",
      ],
    },
  ],
  exam: {
    totalQuestions: 50,
    passingScore: 31,
    timeLimitMinutes: 100,
  },
  active: true,
  studyResources: {
    officialGuide:
      "https://experienceleague.adobe.com/docs/certification/certification/technical-certifications/ac/ac-expert/ac-e-business.html",
  },
};
