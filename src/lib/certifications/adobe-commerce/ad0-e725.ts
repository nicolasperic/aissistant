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
  studyResources: {
    officialGuide:
      "https://experienceleague.adobe.com/docs/certification/certification/technical-certifications/ac/ac-expert/ac-e-developer.html",
  },
};
