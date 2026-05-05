import type { CertDefinition } from "../types";

export const ad0e727: CertDefinition = {
  id: "ad0-e727",
  code: "AD0-E727",
  name: "Adobe Commerce Front-End Developer Expert",
  provider: "adobe-commerce",
  level: "expert",
  description:
    "Validates expertise in customizing Adobe Commerce storefronts using Magento frontend technologies including layouts, themes, UI components, and JavaScript.",
  sections: [
    {
      name: "Theme Design & Customization",
      percentage: 30,
      topics: [
        "Theme hierarchy and inheritance",
        "LESS compilation and custom variables",
        "Responsive design with Magento UI library",
        "Static content deployment strategies",
        "Email template customization",
        "Theme registration and configuration files",
      ],
    },
    {
      name: "Layouts, Blocks & Templates",
      percentage: 25,
      topics: [
        "Layout XML handles (default, page-specific, custom)",
        "Block types and template assignment",
        "Container vs block elements",
        "Layout merging and overriding",
        "View models and data providers",
        "PHTML template best practices",
      ],
    },
    {
      name: "JavaScript & UI Components",
      percentage: 25,
      topics: [
        "RequireJS module definition and mapping",
        "jQuery widgets and widget factory",
        "Knockout.js observables and bindings",
        "UI components (form, listing, etc.)",
        "JavaScript mixins",
        "Custom JS component development",
      ],
    },
    {
      name: "Checkout & Cart Customization",
      percentage: 20,
      topics: [
        "Checkout steps and layout",
        "Shipping and payment renderers",
        "Knockout-based checkout components",
        "Cart page and mini-cart customization",
        "Checkout configuration and processors",
        "Quote and totals rendering",
      ],
    },
  ],
  exam: {
    totalQuestions: 50,
    passingScore: 33,
    timeLimitMinutes: 100,
  },
  active: true,
  planningNotes: `Help me prepare a study plan for the Adobe Commerce Front-End Developer Expert (AD0-E727) certification.

**Study plan guidelines:**
- Plan the weeks from start to end date (each week as a weekly goal with daily tasks)
- Each day with tasks assigned (max 120 min/day, typical 60–90 min)
- Cover all exam sections proportionally to their weight
- Include practice test days (take test + review errors + retake)
- Include hands-on practice with Adobe Commerce CE/EE (latest version 2.4.8-p3)
- Task descriptions should use markdown with bullet points, not paragraphs
- Ramp up intensity as the exam date approaches
- Include lighter review days and at least 1 rest day per week

**Exam objectives and scope:**

Section 1: Theme management (10%)
- Demonstrate the ability to create a new theme
- Demonstrate ability to extend existing themes
- Demonstrate ability to customize transactional emails
- Demonstrate ability to apply translations, XML, and JS files

Section 2: Layout XML & templates (22%)
- Demonstrate the ability to utilize layout XML instructions
- Demonstrate the ability to create new page layouts
- Understand the difference between extending/merging and overriding XML
- Demonstrate ability to create and customize phtml templates
- Apply template security (escaping output)

Section 3: Styles (12%)
- Explain the purpose of different LESS files (compiled and partial)
- Demonstrate the ability to work with LESS files
- Implement and customize LESS library components

Section 4: JavaScript (36%)
- Demonstrate the usage of RequireJS
- Demonstrate the ability to implement different types of mixins
- Demonstrate the usage of Knockout JS
- Demonstrate the usage of jQuery widgets
- Demonstrate the usage of JS components using Layout XML

Section 5: Customizing the Admin panel, Page Builder, and optimizations (20%)
- Demonstrate the ability to customize Page Builder content
- Describe front-end optimization
- Describe how to modify and extend the Commerce admin through the admin UI SDK
- Define Grunt setup and usage
- Utilize additional tools that Commerce Cloud provides
- Describe steps to utilize Edge Delivery Service boiler plate`,
  studyResources: {
    officialGuide:
      "https://experienceleague.adobe.com/docs/certification/certification/technical-certifications/ac/ac-expert/ac-e-fedeveloper0623.html",
  },
};
