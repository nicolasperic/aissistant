import type { CertDefinition } from "../types";

export const ad0e726: CertDefinition = {
  id: "ad0-e726",
  code: "AD0-E726",
  name: "Adobe Commerce Front-End Developer Professional",
  provider: "adobe-commerce",
  level: "professional",
  description:
    "Validates foundational frontend development skills for Adobe Commerce, including theme customization, layout XML, CSS/LESS, JavaScript basics, and responsive design.",
  sections: [
    {
      name: "Theme Customization",
      percentage: 30,
      topics: [
        "Theme structure and inheritance",
        "Theme registration and configuration",
        "LESS/CSS compilation and customization",
        "Responsive web design",
        "Static file deployment",
      ],
    },
    {
      name: "Layout XML & Templates",
      percentage: 25,
      topics: [
        "Layout XML handles and structure",
        "Blocks, containers, and referencing",
        "Template override and customization",
        "PHTML templates",
        "View model usage",
      ],
    },
    {
      name: "JavaScript & UI Components",
      percentage: 25,
      topics: [
        "RequireJS and module loading",
        "jQuery widgets",
        "Knockout.js basics",
        "UI components overview",
        "Mixins",
      ],
    },
    {
      name: "Page Builder & CMS",
      percentage: 20,
      topics: [
        "Page Builder content types",
        "CMS blocks and pages",
        "Widget configuration",
        "Content staging basics",
      ],
    },
  ],
  exam: {
    totalQuestions: 50,
    passingScore: 33,
    timeLimitMinutes: 100,
  },
  active: true,
  planningNotes: `Help me prepare a study plan for the Adobe Commerce Front-End Developer Professional (AD0-E726) certification.

**Study plan guidelines:**
- Plan the weeks from start to end date (each week as a weekly goal with daily tasks)
- Each day with tasks assigned (max 120 min/day, typical 60–90 min)
- Cover all exam sections proportionally to their weight
- Include practice test days (take test + review errors + retake)
- Include hands-on practice with Adobe Commerce theme development
- Task descriptions should use markdown with bullet points, not paragraphs
- Ramp up intensity as the exam date approaches
- Include lighter review days and at least 1 rest day per week

**Exam objectives and scope:**

Section 1: Theme management (16%)
- Describe Adobe Commerce theme folder structure
- Demonstrate ability to create new or extend existing themes
- Demonstrate ability to add custom translation phrases

Section 2: Layout XML & templates (23%)
- Describe the basic layout XML instructions
- Describe existing page layouts
- Describe the steps for extending and overriding Layout XML
- Demonstrate ability to create and customize phtml templates
- Describe template security (escaping output)

Section 3: Styles (19%)
- Identify the purpose of different LESS files (compiled and partial)
- Describe how to override or extend LESS files

Section 4: JavaScript (20%)
- Demonstrate the usage of RequireJS
- Describe the usage of mixins
- Describe how to add a translation in JS
- Describe the usage of Knockout JS
- Describe the usage of jQuery widgets

Section 5: Admin configuration (12.40%)
- Apply or schedule a theme to a specific scope (website, store, store-view)
- Apply design changes to categories, products and CMS pages using admin configuration
- Describe steps to customize transactional emails

Section 6: CLI (9.60%)
- Describe the usage of basic bin/Magento commands
- Describe additional tools that Commerce cloud provides`,
  studyResources: {
    officialGuide:
      "https://experienceleague.adobe.com/docs/certification/certification/technical-certifications/ac/ac-professional/ac-p-fedeveloper0623.html",
  },
};
