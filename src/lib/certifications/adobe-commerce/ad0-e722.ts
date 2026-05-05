import type { CertDefinition } from "../types";

export const ad0e722: CertDefinition = {
  id: "ad0-e722",
  code: "AD0-E722",
  name: "Adobe Commerce Architect Master",
  provider: "adobe-commerce",
  level: "master",
  description:
    "Validates expertise in designing and implementing Adobe Commerce architecture, including B2B, performance optimization, cloud deployment, third-party integrations, and testing strategies.",
  sections: [
    {
      name: "Architecture & Design",
      percentage: 35,
      topics: [
        "Module architecture and service contracts",
        "Design patterns (proxy, factory, plugin, observer)",
        "Dependency injection and object manager",
        "Multi-store and multi-website architecture",
        "Database design and EAV optimization",
        "Extension development best practices",
        "Upgrade and migration strategies",
      ],
    },
    {
      name: "B2B & Inventory",
      percentage: 10,
      topics: [
        "Company accounts and hierarchies",
        "Shared catalogs and permissions",
        "Negotiable quotes workflow",
        "Multi-source inventory (MSI) architecture",
        "Purchase orders and approval workflows",
      ],
    },
    {
      name: "Performance & Caching",
      percentage: 18,
      topics: [
        "Full-page cache with Varnish",
        "Redis for session and cache storage",
        "Indexer architecture and optimization",
        "Database query optimization",
        "Static content deployment strategies",
        "CDN and asset optimization",
      ],
    },
    {
      name: "Cloud & Deployment",
      percentage: 22,
      topics: [
        "Adobe Commerce Cloud architecture",
        "Environment configuration and variables",
        "Build and deploy pipelines",
        "Docker and local development",
        "Zero-downtime deployment",
        "Infrastructure scaling (web, database, cache)",
      ],
    },
    {
      name: "Integration & APIs",
      percentage: 10,
      topics: [
        "REST and GraphQL API architecture",
        "Message queues (RabbitMQ, MySQL)",
        "ERP/CRM integration patterns",
        "Webhooks and async operations",
        "OAuth and token-based authentication",
      ],
    },
    {
      name: "Testing & Quality",
      percentage: 5,
      topics: [
        "Unit testing with PHPUnit",
        "Integration and API functional testing",
        "MFTF and end-to-end testing",
        "Static analysis (PHPStan, PHPCS)",
        "Code review and quality gates",
      ],
    },
  ],
  exam: {
    totalQuestions: 50,
    passingScore: 30,
    timeLimitMinutes: 110,
  },
  active: true,
  studyResources: {
    officialGuide:
      "https://experienceleague.adobe.com/docs/certification/certification/technical-certifications/ac/ac-master/ac-m-architect.html",
  },
};
