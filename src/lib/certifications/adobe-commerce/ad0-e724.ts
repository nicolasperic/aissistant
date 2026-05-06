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
  planningNotes: `Help me prepare a study plan for the Adobe Commerce Developer Professional (AD0-E724) certification.

**Study plan guidelines:**
- Plan the weeks from start to end date (each week as a weekly goal with daily tasks)
- ONE study task per day — each day should have a single focused study session linked to one study note
- Each day with tasks assigned (max 120 min/day, typical 60–90 min)
- Cover all exam sections proportionally to their weight
- Include practice test days (take test + review errors + retake)
- Include hands-on practice with Adobe Commerce CE/EE (latest version 2.4.8-p3)
- Task descriptions should use markdown with bullet points, not paragraphs
- Ramp up intensity as the exam date approaches
- Include lighter review days and at least 1 rest day per week

**Exam objectives and scope:**

Section 1: Architecture (52%)
- Describe module file structure
- Describe Adobe Commerce CLI commands
- Describe CRON functionality
- Describe index functionality
- Describe localization
- Explain components (plugin, preference, observers etc.)
- Describe URL rewrites
- Describe the Magento caching system
- Describe stores, websites, and store views
- Recall the code architecture of admin panel
- Describe attributes and attribute sets

Section 2: Customizations (36%)
- Demonstrate knowledge of how to operate the catalog
- Explain check out and sales operations
- Manipulate entity types programmatically
- Identify the data flow in and out of Adobe SaaS services
- Identify API features

Section 3: Cloud (12%)
- Describe Adobe Commerce Cloud architecture
- Describe the setup and configuration of Adobe Commerce Cloud
- Recall the Adobe Commerce Cloud CLI tool`,
  studyResources: {
    officialGuide:
      "https://experienceleague.adobe.com/docs/certification/certification/technical-certifications/ac/ac-professional/ac-p-developer.html",
  },
};
