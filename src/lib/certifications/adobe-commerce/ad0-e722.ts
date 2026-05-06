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
  planningNotes: `Help me prepare a study plan for the Adobe Commerce Architect Master (AD0-E722) certification.

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
- Focus on architectural judgment and decision-making, not syntax memorization
- Include scenario-based exercises that test design trade-offs

**Exam objectives and scope:**

Section 1: Design (46%)
- Design and implement optimal solutions for Adobe Commerce to meet business needs
- Design logical and technical flows
- Customize Commerce features
- Integrate Adobe Commerce with external systems and services
- Troubleshoot design flows

Section 2: Review (32%)
- Review and refactor existing Adobe Commerce customizations
- Utilize Commerce test frameworks throughout the whole workflow
- Optimize performance and scalability for Adobe Commerce
- Troubleshoot to identify the root cause of issues with Adobe Commerce
- Enforce coding standards

Section 3: Configure and Deploy (22%)
- Configure Adobe Commerce and make sure the project is set up optimally
- Configure all aspects of Adobe Commerce Cloud
- Oversee and improve deployment process
- Troubleshoot infrastructure and configuration issues`,
  studyResources: {
    officialGuide:
      "https://experienceleague.adobe.com/docs/certification/certification/technical-certifications/ac/ac-master/ac-m-architect.html",
  },
};
