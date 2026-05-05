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
  planningNotes: `Help me prepare a study plan for the Adobe Commerce Business Practitioner Professional (AD0-E712) certification.

**Study plan guidelines:**
- Plan the weeks from start to end date (each week as a weekly goal with daily tasks)
- Each day with tasks assigned (max 120 min/day, typical 60–90 min)
- Cover all exam sections proportionally to their weight
- Include practice test days (take test + review errors + retake)
- Include hands-on practice navigating the Adobe Commerce Admin panel
- Task descriptions should use markdown with bullet points, not paragraphs
- Ramp up intensity as the exam date approaches
- Include lighter review days and at least 1 rest day per week

**Exam objectives and scope:**

Section 1: Magento Open Source core features (49%)
- Identify the features of Magento Open Source
- Distinguish the correct scope and when to use each
- Demonstrate knowledge of Catalog Management
- Manipulate pricing by using Magento Open Source features
- Describe the standard customer journey
- Describe the standard order lifecycle
- Describe the day-to-day tasks involved in Store maintenance
- Explain the different types of content elements and when to use

Section 2: Adobe Commerce basics (14%)
- Identify the key features available in Adobe Commerce
- Identify service Add-ons in Adobe Commerce
- Identify hosting options for Adobe Commerce

Section 3: Digital marketing and eCommerce fundamentals (24%)
- Identify the basic uses of Digital Marketing tools (Google Analytics/Adobe Analytics, Google Tag Manager, Email marketing, Segmentation, Social plugins)
- Explain the basic principles of SEO
- Identify the basic uses of common eCommerce tools (such as shopping feeds)
- Identify the key features of an eCommerce website
- Identify the basic eCommerce concepts (including storefront options)

Section 4: Compliance/security basics (13%)
- Understand the basics of compliance for privacy laws and payment security
- Identify common security aspects of an Adobe Commerce project
- Identify best practices and legal requirements of accessibility compliance`,
  studyResources: {
    officialGuide:
      "https://experienceleague.adobe.com/docs/certification/certification/technical-certifications/ac/ac-professional/ac-p-business.html",
  },
};
