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
  planningNotes: `Help me prepare a study plan for the Adobe Commerce Business Practitioner Expert (AD0-E708) certification.

**Study plan guidelines:**
- Plan the weeks from start to end date (each week as a weekly goal with daily tasks)
- Each day with tasks assigned (max 120 min/day, typical 60–90 min)
- Cover all exam sections proportionally to their weight
- Include practice test days (take test + review errors + retake)
- Include hands-on practice with Adobe Commerce Admin panel (CE and EE features)
- Task descriptions should use markdown with bullet points, not paragraphs
- Ramp up intensity as the exam date approaches
- Include lighter review days and at least 1 rest day per week

**Exam objectives and scope:**

Section 1: Core Features/General Configuration (46%)
- Identify the features of Adobe Commerce Open Source Edition and Commerce Edition
- Distinguish the differences between all editions of Adobe Commerce products
- Determine how to utilize product types and their features to meet customer requirements
- Interpret requirements and mock ups to determine if they can be met with native functionality
- Demonstrate knowledge of the admin panel and the location of common features
- Demonstrate the ability to import/export Adobe Commerce entities
- Understand how to natively configure cart and checkout
- Evaluate the native available shipping methods in Adobe Commerce and how they apply to common use cases
- Understanding the ways to create and publish stylized content using the Adobe Commerce CMS features including Page Builder
- Using native tools to manage the order life cycle
- Demonstrate the ability to configure the various gifting options (gift cards, gift wrapping, give messages)
- Configuring and modifying transactional emails
- Explain the customer self service and loyalty program native features in B2B

Section 2: Merchandising (10%)
- Demonstrate the ability to create promotions to meet specific business criteria and how it determines final pricing
- Demonstrate ability to manage categories and products
- Understand the different pricing configurations and how they affect the final price

Section 3: Digital Marketing (4%)
- Recommend best practices for SEO using native features
- Assess common metrics in Google Analytics and BI

Section 4: Add-on Modules and Additional Products (18%)
- Describe the B2B functionality and how it relates to common B2B scenarios
- Apply business requirements to suggest a solution using MSI
- Explain the advantages and how to use BI to the Adobe Commerce solution
- Distinguish the differences between native search and LiveSearch
- Apply business requirements to determine how to apply taxes, duties and exemptions in a B2B environment
- Understand how to apply tailored pricing to a B2B customer
- Understand the differences between Adobe Commerce native product and Adobe Sensei product recommendations

Section 5: Systems Architecture (10%)
- Evaluate requirements to determine which websites, stores, and store view are necessary
- Identify and analyze performance metrics to make improvements
- Understand the available methods to integrate external system with Adobe Commerce
- Differentiate between headless approaches and traditional

Section 6: Compliance/Security (12%)
- Demonstrate how to secure the Adobe Commerce data access with roles and permissions
- Understand the basics of compliance for privacy laws and payment security
- Explain common security aspects of an Adobe Commerce project
- Understand the basics of tax laws and how to configure`,
  studyResources: {
    officialGuide:
      "https://experienceleague.adobe.com/docs/certification/certification/technical-certifications/ac/ac-expert/ac-e-business.html",
  },
};
