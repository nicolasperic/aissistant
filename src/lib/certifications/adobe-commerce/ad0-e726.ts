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
  studyResources: {
    officialGuide:
      "https://experienceleague.adobe.com/docs/certification/certification/technical-certifications/ac/ac-professional/ac-p-fedeveloper0623.html",
  },
};
