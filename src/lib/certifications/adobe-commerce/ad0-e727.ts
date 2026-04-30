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
  studyResources: {
    officialGuide:
      "https://experienceleague.adobe.com/docs/certification/certification/technical-certifications/ac/ac-expert/ac-e-fedeveloper0623.html",
  },
};
