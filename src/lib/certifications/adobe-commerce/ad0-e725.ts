import type { CertDefinition } from "../types";

export const ad0e725: CertDefinition = {
  id: "ad0-e725",
  code: "AD0-E725",
  name: "Adobe Commerce Developer Expert",
  provider: "adobe-commerce",
  level: "expert",
  description:
    "Validates advanced development skills in Adobe Commerce, including complex module development, customization, integrations, performance optimization, and security best practices.",
  sections: [
    {
      name: "Architecture & Customization",
      percentage: 24,
      topics: [
        "Module lifecycle and dependencies",
        "Dependency injection and di.xml",
        "Service contracts and repositories",
        "Proxies, factories, and virtual types",
        "Code generation and interception",
      ],
    },
    {
      name: "Database & EAV",
      percentage: 14,
      topics: [
        "Declarative schema",
        "EAV architecture and custom attributes",
        "Data and schema patches",
        "Database optimization and indexing",
        "Collection filtering and pagination",
      ],
    },
    {
      name: "Frontend Development",
      percentage: 14,
      topics: [
        "Layout XML processing and merging",
        "JavaScript components and RequireJS",
        "UI components and Knockout.js",
        "Theme inheritance and overrides",
        "CSP (Content Security Policy)",
      ],
    },
    {
      name: "Admin Customization",
      percentage: 12,
      topics: [
        "Admin grids (UI component-based)",
        "Admin forms and field types",
        "ACL rules and menu items",
        "System configuration and config.xml",
        "Mass actions",
      ],
    },
    {
      name: "Catalog & Sales",
      percentage: 12,
      topics: [
        "Product types and custom product types",
        "Price calculation and custom pricing",
        "Cart and checkout customization",
        "Payment and shipping method development",
        "Quote-to-order conversion",
      ],
    },
    {
      name: "API & Integration",
      percentage: 12,
      topics: [
        "REST and GraphQL APIs",
        "Web API authentication (OAuth, token-based)",
        "Custom API endpoints",
        "Message queues and async operations",
        "Integration testing",
      ],
    },
    {
      name: "Performance & Security",
      percentage: 12,
      topics: [
        "Full-page cache and Varnish",
        "Indexing and cron optimization",
        "Profiling and debugging",
        "Security best practices (XSS, CSRF, injection)",
        "Secure coding standards",
      ],
    },
  ],
  exam: {
    totalQuestions: 50,
    passingScore: 39,
    timeLimitMinutes: 100,
  },
  active: true,
  planningNotes: `Help me prepare a study plan for the Adobe Commerce Developer Expert (AD0-E725) certification.

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
- Mind including tricky concepts that could confuse even experienced developers

**Exam objectives and scope:**

Section 1: Architecture (38%)
- Demonstrate how to effectively use cache in Adobe Commerce
- Demonstrate knowledge of components (plugin, preference, observers etc.)
- Determine the effects and constraints of configuring multiple sites on a single instance
- Explain the use cases for Git patches and the file level modifications in Composer
- Explain Adobe Commerce security features (CSP, escaping, form keys, sanitization, reCAPTCHA, input validation)
- Explain how the CRON scheduling system works
- Explain index functionality

Section 2: External Integrations (14%)
- Customize the data flow in and out of SaaS services
- Utilize App Builder
- Utilize Adobe I/O events and Webhooks

Section 3: Customizations (32%)
- Customize the catalog
- Customize check out and sales operations
- Manipulate entity types programmatically
- Customize the admin panel
- Customize APIs
- Demonstrate the ability to leverage existing message queues and create new queues
- Demonstrate how to write an integration test

Section 4: Cloud (16%)
- Explain Adobe Commerce Cloud architecture
- Setup and configure Adobe Commerce Cloud
- Utilize Adobe Commerce Cloud CLI tool`,
  studyResources: {
    officialGuide:
      "https://experienceleague.adobe.com/docs/certification/certification/technical-certifications/ac/ac-expert/ac-e-developer.html",
  },
};
