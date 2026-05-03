import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding practice tests...");

  // ─── Certification ────────────────────────────────────────────────────────

  const cert = await prisma.certification.upsert({
    where: { id: "cert-ad0-e727" },
    update: {},
    create: {
      id: "cert-ad0-e727",
      name: "Adobe Commerce Front-End Developer Expert",
      code: "AD0-E727",
      provider: "Adobe",
      description:
        "Validates expertise in customizing Adobe Commerce storefronts using Magento frontend technologies including layouts, themes, UI components, and JavaScript.",
      totalQuestions: 50,
      passingScore: 33,
      timeLimitMinutes: 100,
    },
  });

  // ─── Sections ─────────────────────────────────────────────────────────────

  const [secTheme, secLayouts, secJs, secCheckout] = await Promise.all([
    prisma.certSection.upsert({
      where: { id: "sec-theme-design" },
      update: {},
      create: { id: "sec-theme-design", certificationId: cert.id, name: "Theme Design & Customization", percentage: 30 },
    }),
    prisma.certSection.upsert({
      where: { id: "sec-layouts" },
      update: {},
      create: { id: "sec-layouts", certificationId: cert.id, name: "Layouts, Blocks & Templates", percentage: 25 },
    }),
    prisma.certSection.upsert({
      where: { id: "sec-js-ui" },
      update: {},
      create: { id: "sec-js-ui", certificationId: cert.id, name: "JavaScript & UI Components", percentage: 25 },
    }),
    prisma.certSection.upsert({
      where: { id: "sec-checkout" },
      update: {},
      create: { id: "sec-checkout", certificationId: cert.id, name: "Checkout & Cart Customization", percentage: 20 },
    }),
  ]);

  // ─── Clean up old placeholder questions ────────────────────────────────────

  const oldOfficialIds = [
    "q-th-001", "q-th-002", "q-th-003", "q-th-004",
    "q-ly-001", "q-ly-002", "q-ly-003",
    "q-js-001", "q-js-002", "q-js-003",
    "q-ch-001",
  ];

  await prisma.practiceTestQuestion.deleteMany({ where: { practiceTestId: "pt-official-e727" } });

  for (const id of oldOfficialIds) {
    await prisma.questionOption.deleteMany({ where: { questionId: id } });
    await prisma.question.deleteMany({ where: { id } });
  }

  // ─── Question upsert helper ────────────────────────────────────────────────

  async function upsertQuestion(data: {
    id: string;
    text: string;
    type: "SINGLE" | "MULTIPLE";
    source: "OFFICIAL" | "AI_GENERATED";
    explanation: string;
    sectionId: string;
    options: { id: string; text: string; isCorrect: boolean }[];
  }) {
    const q = await prisma.question.upsert({
      where: { id: data.id },
      update: {
        text: data.text,
        type: data.type,
        explanation: data.explanation,
        certSectionId: data.sectionId,
      },
      create: {
        id: data.id,
        certificationId: cert.id,
        certSectionId: data.sectionId,
        text: data.text,
        type: data.type,
        source: data.source,
        explanation: data.explanation,
      },
    });
    for (const opt of data.options) {
      await prisma.questionOption.upsert({
        where: { id: opt.id },
        update: { text: opt.text, isCorrect: opt.isCorrect },
        create: { id: opt.id, questionId: q.id, text: opt.text, isCorrect: opt.isCorrect },
      });
    }
    return q;
  }

  // ─── 50 Official Questions ─────────────────────────────────────────────────

  const off: ReturnType<typeof upsertQuestion>[] = [];

  // Q1 — Theme
  off.push(upsertQuestion({
    id: "q-off-001",
    text: "An Adobe Commerce Developer wants to display custom images in the transactional email using the following code:\n\n```html\n<img src=\"{{ view url='images/custom-image.jpg' }}\" alt=\"Custom Image\" />\n```\n\nWhere should the \"custom-image.jpg\" be stored?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secTheme.id,
    explanation: "The `view url` directive resolves static assets from the theme's `web/` directory, so images go in `app/design/frontend/MyCompany/mytheme/web/images/`.",
    options: [
      { id: "q-off-001-a", text: "`pub/media/email/store/images/`", isCorrect: false },
      { id: "q-off-001-b", text: "`app/design/frontend/MyCompany/mytheme/web/images/`", isCorrect: true },
      { id: "q-off-001-c", text: "`app/design/frontend/MyCompany/mytheme/Magento_Email/web/images/`", isCorrect: false },
    ],
  }));

  // Q2 — Theme
  off.push(upsertQuestion({
    id: "q-off-002",
    text: "A Developer needs to select a newly created custom theme from the admin configuration.\n\nWhere should the Developer do this?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secTheme.id,
    explanation: "Theme selection is managed under Content > Design > Configuration, where you edit a store view and choose the active theme.",
    options: [
      { id: "q-off-002-a", text: "Content > Block > Edit and Select the theme", isCorrect: false },
      { id: "q-off-002-b", text: "Content > Design > Schedule > Edit and Select the theme", isCorrect: false },
      { id: "q-off-002-c", text: "Content > Design > Configuration > Edit and Select the theme", isCorrect: true },
    ],
  }));

  // Q3 — JS/UI
  off.push(upsertQuestion({
    id: "q-off-003",
    text: "An Adobe Commerce Developer is working on a multilingual website.\n\nHow should the Developer translate text within JavaScript files?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "The `mage/translate` module exposes `$.mage.__()` which integrates with Magento's i18n pipeline for JavaScript string translation.",
    options: [
      { id: "q-off-003-a", text: "`define(['jquery', 'translate'], function ($, $t) { $.mage._('Enter Your message here') });`", isCorrect: false },
      { id: "q-off-003-b", text: "`define(['jquery', 'mage/translate'], function ($) { $.mage.__('Enter Your message here') });`", isCorrect: true },
      { id: "q-off-003-c", text: "`define(['jquery', 'i18n'], function ($, $t) { $.__('Enter Your message here') });`", isCorrect: false },
    ],
  }));

  // Q4 — Theme
  off.push(upsertQuestion({
    id: "q-off-004",
    text: "A Developer needs to utilize conditional content in a Magento 2 transactional email template.\n\nWhich syntax will be supported?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secTheme.id,
    explanation: "Magento email templates support `{{if}}` … `{{/if}}` for conditionals but do not support an `{{else}}` clause.",
    options: [
      { id: "q-off-004-a", text: "if conditions using `{{if}}` … `{{/if}}`", isCorrect: true },
      { id: "q-off-004-b", text: "if-else conditions using `{{if}}` … `{{else}}` … `{{/if}}`", isCorrect: false },
      { id: "q-off-004-c", text: "if-else conditions using `{{if}}` … `{{else}}` … `{{endif}}`", isCorrect: false },
    ],
  }));

  // Q5 — Theme (MULTIPLE)
  off.push(upsertQuestion({
    id: "q-off-005",
    text: "An Adobe Commerce developer has created a custom theme which inherits from `Magento/luma` and has added the following file to the new theme: `Magento_LayeredNavigation/templates/layer/view.phtml`.\n\nWhich two files are part of the theme fallback logic? (Choose two.)",
    type: "MULTIPLE", source: "OFFICIAL", sectionId: secTheme.id,
    explanation: "Theme fallback checks the module's own `view/frontend/templates/` first, then the parent theme's module override directory.",
    options: [
      { id: "q-off-005-a", text: "`module-layered-navigation/view/frontend/templates/layer/view.phtml`", isCorrect: true },
      { id: "q-off-005-b", text: "`theme-frontend-luma/Magento_LayeredNavigation/templates/layer/view.phtml`", isCorrect: true },
      { id: "q-off-005-c", text: "`module-layered-navigation/view/adminhtml/templates/layer/view.phtml`", isCorrect: false },
      { id: "q-off-005-d", text: "`theme-frontend-base/Magento_LayeredNavigation/templates/layer/view.phtml`", isCorrect: false },
    ],
  }));

  // Q6 — Layouts
  off.push(upsertQuestion({
    id: "q-off-006",
    text: "An Adobe Commerce developer created a module called Orange_Customer. In this module the developer is adding a new `.phtml` file which will display customer information.\n\nWhere would the developer place this file?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secLayouts.id,
    explanation: "Module templates belong in `app/code/{Vendor}/{Module}/view/frontend/templates/`, not in `web/templates/` which is for Knockout HTML templates.",
    options: [
      { id: "q-off-006-a", text: "`app/code/Orange/Customer/frontend/templates/customer-info.phtml`", isCorrect: false },
      { id: "q-off-006-b", text: "`app/code/Orange/Customer/view/frontend/web/templates/customer-info.phtml`", isCorrect: false },
      { id: "q-off-006-c", text: "`app/code/Orange/Customer/view/frontend/templates/customer-info.phtml`", isCorrect: true },
    ],
  }));

  // Q7 — Layouts
  off.push(upsertQuestion({
    id: "q-off-007",
    text: "An Adobe Commerce developer wants to override the product view page, but only for grouped products. The developer is working on a child theme of `Magento/blank`.\n\nWhere would the developer create the `catalog_category_view_type_grouped.xml` file in the theme?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secLayouts.id,
    explanation: "The `_grouped.xml` handle originates in the `Magento_Grouped` module, not in a theme. To override a file that lives in a module, the correct path is `{Module}/layout/override/base/`. The `override/theme/` path is for overriding files that originate in a parent theme — not the case here.",
    options: [
      { id: "q-off-007-a", text: "`/Magento_Catalog/layout/override/theme/Magento/blank/`", isCorrect: false },
      { id: "q-off-007-b", text: "`/Magento_GroupedProduct/layout/override/theme/Magento/blank/`", isCorrect: false },
      { id: "q-off-007-c", text: "`/Magento_GroupedProduct/layout/override/base/`", isCorrect: true },
    ],
  }));

  // Q8 — Layouts
  off.push(upsertQuestion({
    id: "q-off-008",
    text: "An Adobe Commerce Developer needs to restore a block that was removed.\n\nHow should the Developer add the block back in?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secLayouts.id,
    explanation: "Setting `remove=\"false\"` on a `<referenceBlock>` cancels a previously applied removal. The attribute is `remove`, not `delete`.",
    options: [
      { id: "q-off-008-a", text: "`<referenceBlock name=\"block.name\" delete=\"false\"/>`", isCorrect: false },
      { id: "q-off-008-b", text: "`<block name=\"block.name\" remove=\"false\" />`", isCorrect: false },
      { id: "q-off-008-c", text: "`<referenceBlock name=\"block.name\" remove=\"false\" />`", isCorrect: true },
    ],
  }));

  // Q9 — Layouts (CSP inline script)
  off.push(upsertQuestion({
    id: "q-off-009",
    text: "An Adobe Commerce Developer needs to embed inline script in a `.phtml` template for a project where Content Security Policy (CSP) strict mode is enabled on all pages.\n\nWhich snippet should the Developer use to execute inline JavaScript without console errors?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secLayouts.id,
    explanation: "Under CSP strict mode, `SecureHtmlRenderer::renderTag('script', [], $scriptString, false)` generates a nonce-tagged script element that passes CSP validation.",
    options: [
      {
        id: "q-off-009-a",
        text: "```php\n<?php\n/** @var Template $block */\n/** @var SecureHtmlRenderer $secureRenderer */\n\nuse Magento\\Framework\\View\\Element\\Template;\nuse Magento\\Framework\\View\\Helper\\SecureHtmlRenderer;\n?>\n<?php\n$scriptString = <<<SCRIPT\n    alert('hello');\nSCRIPT;\n?>\n<?= /* @noEscape */ $secureRenderer->render('script', [], $scriptString, false); ?>\n```",
        isCorrect: false,
      },
      {
        id: "q-off-009-b",
        text: "```php\n<?php\n/** @var Template $block */\n/** @var SecureHtmlRenderer $secureRenderer */\n\nuse Magento\\Framework\\View\\Element\\Template;\nuse Magento\\Framework\\View\\Helper\\SecureHtmlRenderer;\n?>\n<?php\n$scriptString = <<<SCRIPT\n    alert('hello');\nSCRIPT;\n?>\n<?= /* @noEscape */ $secureRenderer->renderInlineScript($scriptString, false); ?>\n```",
        isCorrect: false,
      },
      {
        id: "q-off-009-c",
        text: "```php\n<?php\n/** @var Template $block */\n/** @var SecureHtmlRenderer $secureRenderer */\n\nuse Magento\\Framework\\View\\Element\\Template;\nuse Magento\\Framework\\View\\Helper\\SecureHtmlRenderer;\n?>\n<?php\n$scriptString = <<<SCRIPT\n    alert('hello');\nSCRIPT;\n?>\n<?= /* @noEscape */ $secureRenderer->renderTag('script', [], $scriptString, false); ?>\n```",
        isCorrect: true,
      },
    ],
  }));

  // Q10 — Layouts (MULTIPLE)
  off.push(upsertQuestion({
    id: "q-off-010",
    text: "An Adobe Commerce developer needs to pass a custom argument `custom_title` to a given template via Layout XML.\n\nWhich two methods would they use to access the argument within the template? (Choose two.)",
    type: "MULTIPLE", source: "OFFICIAL", sectionId: secLayouts.id,
    explanation: "Arguments set via `<arguments>` in layout XML are accessible through the magic getter (e.g. `getCustomTitle()`) or via `getData('custom_title')`.",
    options: [
      { id: "q-off-010-a", text: "`$block->getCustomTitle()`", isCorrect: true },
      { id: "q-off-010-b", text: "`$block->customTitle()`", isCorrect: false },
      { id: "q-off-010-c", text: "`$block->getVar('custom_title')`", isCorrect: false },
      { id: "q-off-010-d", text: "`$block->getData('custom_title')`", isCorrect: true },
    ],
  }));

  // Q11 — Layouts
  off.push(upsertQuestion({
    id: "q-off-011",
    text: "An Adobe Commerce developer is trying to load a custom template on a product page by creating a new page layout with the following Layout XML:\n\n```xml\n<layout xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:noNamespaceSchemaLocation=\"urn:magento:framework:View/Layout/etc/layout_generic.xsd\">\n    <container name=\"block.name\" template=\"Vendor_Module::custom-template.phtml\" />\n</layout>\n```\n\nHowever, after applying the new page layout the template is not visible.\n\nWhy is the template not visible?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secLayouts.id,
    explanation: "Page layouts only define structural containers — they cannot directly contain blocks. Blocks must be added through page configuration XML files.",
    options: [
      { id: "q-off-011-a", text: "The block does not have a `class` attribute set.", isCorrect: false },
      { id: "q-off-011-b", text: "The block does not have a `display` attribute set.", isCorrect: false },
      { id: "q-off-011-c", text: "Page layouts can not directly contain `blocks`.", isCorrect: true },
    ],
  }));

  // Q12 — Layouts
  off.push(upsertQuestion({
    id: "q-off-012",
    text: "An Adobe Commerce Developer wants to create a new template to show on the front end of their customer's product page.\n\nWhich folder should these template (PHTML) files go in a theme?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secLayouts.id,
    explanation: "In a theme, PHTML templates for Catalog module overrides go in `Magento_Catalog/templates/`. The `web/template/` folder is for Knockout HTML templates.",
    options: [
      { id: "q-off-012-a", text: "`Magento_Catalog/templates/`", isCorrect: true },
      { id: "q-off-012-b", text: "`Magento_Catalog/web/template/`", isCorrect: false },
      { id: "q-off-012-c", text: "`Magento_Catalog/web/css/template/`", isCorrect: false },
    ],
  }));

  // Q13 — Layouts
  off.push(upsertQuestion({
    id: "q-off-013",
    text: "A Developer needs to customize the category listing page in Adobe Commerce and pass a custom variable from the layout XML to a block that renders the category banner. The block is defined as `Magento\\Catalog\\Block\\Category\\View` and has a `name=\"category-view\"`. The Developer needs to pass a variable `banner_style` with the value `custom-style` to this block.\n\nWhich XML instructions will pass the variable to the block?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secLayouts.id,
    explanation: "Variables are passed to existing blocks using `<referenceBlock>` with an `<arguments>` child — not via `<action>` which calls methods, not sets data arguments.",
    options: [
      {
        id: "q-off-013-a",
        text: "```xml\n<block class=\"Magento\\Catalog\\Block\\CategoryView\" name=\"category-view\">\n    <action method=\"setBannerStyle\">\n        <argument name=\"banner_style\" xsi:type=\"string\">custom-style</argument>\n    </action>\n</block>\n```",
        isCorrect: false,
      },
      {
        id: "q-off-013-b",
        text: "```xml\n<referenceBlock name=\"category-view\">\n    <action method=\"setBannerStyle\">\n        <argument name=\"banner_style\" xsi:type=\"string\">custom-style</argument>\n    </action>\n</referenceBlock>\n```",
        isCorrect: false,
      },
      {
        id: "q-off-013-c",
        text: "```xml\n<referenceBlock name=\"category-view\">\n    <arguments>\n        <argument name=\"banner_style\" xsi:type=\"string\">custom-style</argument>\n    </arguments>\n</referenceBlock>\n```",
        isCorrect: true,
      },
    ],
  }));

  // Q14 — Layouts
  off.push(upsertQuestion({
    id: "q-off-014",
    text: "An Adobe Commerce developer has been asked to audit a `.phtml` file and it contains the following code:\n\n```php\n$tracks = $_shipment->getTracksCollection();\nfor ($i = 0; $i < count($tracks); $i++) {\n    ?><a href=\"#\" class=\"action track\"><span><?= $block->escapeHtml($tracks[$i]->getNumber()) ?></span></a><?php\n    $i++;\n}\n?>\n```\n\nFollowing Adobe Commerce coding standards, what syntax would the developer use?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secLayouts.id,
    explanation: "Adobe Commerce coding standards require `foreach` loops with alternative syntax (`foreach ... endforeach`) in PHTML templates instead of C-style `for` loops.",
    options: [
      {
        id: "q-off-014-a",
        text: "```php\n$tracks = $_shipment->getTracksCollection();\nfor ($i = 0; $i < count($tracks); $i++) {\n    ?><a href=\"#\" class=\"action track\"><span><?= $block->escapeHtml($tracks[$i]->getNumber()) ?></span></a><?php\n    $i++;\n}\n?>\n```",
        isCorrect: false,
      },
      {
        id: "q-off-014-b",
        text: "```php\n$tracks = $_shipment->getTracksCollection();\nforeach ($tracks as $track) {\n    ?><a href=\"#\" class=\"action track\"><span><?= $block->escapeHtml($track->getNumber()) ?></span></a><?php\n}\n?>\n```",
        isCorrect: false,
      },
      {
        id: "q-off-014-c",
        text: "```php\n$tracks = $_shipment->getTracksCollection();\nforeach ($tracks as $track):\n    ?><a href=\"#\" class=\"action track\"><span><?= $block->escapeHtml($track->getNumber()) ?></span></a><?php\nendforeach;\n?>\n```",
        isCorrect: true,
      },
    ],
  }));

  // Q15 — Layouts
  off.push(upsertQuestion({
    id: "q-off-015",
    text: "An Adobe Commerce Developer is tasked with adding a new block to the category page.\n\nHow should the Developer add a block in a content section?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secLayouts.id,
    explanation: "`<referenceContainer name=\"content\">` targets the existing content container so child blocks can be injected without replacing the container itself.",
    options: [
      {
        id: "q-off-015-a",
        text: "```xml\n<referenceContainer name=\"content\">\n    ....code here\n</referenceContainer>\n```",
        isCorrect: true,
      },
      {
        id: "q-off-015-b",
        text: "```xml\n<block name=\"content\">\n    ....code here\n```",
        isCorrect: false,
      },
      {
        id: "q-off-015-c",
        text: "```xml\n<referenceBlock name=\"content\">\n    ....code here\n</referenceBlock>\n```",
        isCorrect: false,
      },
    ],
  }));

  // Q16 — Layouts
  off.push(upsertQuestion({
    id: "q-off-016",
    text: "An Adobe Commerce Developer needs to move the block \"BLOCK-NAME\" to the bottom of the homepage.\n\nWhich XML snippet should be used?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secLayouts.id,
    explanation: "`<move>` repositions an existing block within the layout. Using `after=\"-\"` places it at the end of the destination container.",
    options: [
      { id: "q-off-016-a", text: "`<shift element=\"BLOCK-NAME\" destination=\"content\" after=\"-\"/>`", isCorrect: false },
      { id: "q-off-016-b", text: "`<move element=\"BLOCK-NAME\" destination=\"content\" after=\"-\"/>`", isCorrect: true },
      { id: "q-off-016-c", text: "`<alter element=\"BLOCK-NAME\" destination=\"content\" after=\"-\"/>`", isCorrect: false },
    ],
  }));

  // Q17 — Theme
  off.push(upsertQuestion({
    id: "q-off-017",
    text: "An Adobe Commerce Developer needs to include multiple LESS files with the same name.\n\nWhich directive allows the inclusion of multiple files based on a name pattern?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secTheme.id,
    explanation: "`//@magento_import` is a Magento-specific LESS directive that imports all files matching a given name across all modules, enabling multiple same-named files to be included.",
    options: [
      { id: "q-off-017-a", text: "`//@mage_import`", isCorrect: false },
      { id: "q-off-017-b", text: "`//@import`", isCorrect: false },
      { id: "q-off-017-c", text: "`//@magento_import`", isCorrect: true },
    ],
  }));

  // Q18 — Theme
  off.push(upsertQuestion({
    id: "q-off-018",
    text: "An Adobe Commerce developer was asked to override LESS variables.\n\nWhere would the overrides of existing LESS variables be added?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secTheme.id,
    explanation: "`_theme.less` in the theme's `web/css/source/` directory is the designated file for overriding LESS variables from the UI library and parent themes.",
    options: [
      { id: "q-off-018-a", text: "`<theme_dir>/web/css/source/_variables.less`", isCorrect: false },
      { id: "q-off-018-b", text: "`<theme_dir>/web/css/source/lib/_variables.less`", isCorrect: false },
      { id: "q-off-018-c", text: "`<theme_dir>/web/css/source/_theme.less`", isCorrect: true },
    ],
  }));

  // Q19 — Theme
  off.push(upsertQuestion({
    id: "q-off-019",
    text: "A Developer needs to locate the Adobe Commerce UI library LESS files to override variables used in UI components.\n\nWhere should these files be located?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secTheme.id,
    explanation: "The Adobe Commerce UI library LESS source files are located in `lib/web/css/source/lib` in the core installation.",
    options: [
      { id: "q-off-019-a", text: "`lib/web/css/source/lib`", isCorrect: true },
      { id: "q-off-019-b", text: "`Magento_Core/web/css/source`", isCorrect: false },
      { id: "q-off-019-c", text: "`Magento_UI/web/css/source/`", isCorrect: false },
    ],
  }));

  // Q20 — JS/UI (MULTIPLE)
  off.push(upsertQuestion({
    id: "q-off-020",
    text: "An Adobe Commerce developer is implementing tooltips for a project using the UI library.\n\nWhich two options would they use? (Choose two.)",
    type: "MULTIPLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "The Magento UI library tooltip implementation uses `selector-content` for the tooltip content area and `selector-toggle` as the trigger element.",
    options: [
      { id: "q-off-020-a", text: "`selector-content`", isCorrect: true },
      { id: "q-off-020-b", text: "`tooltip-container`", isCorrect: false },
      { id: "q-off-020-c", text: "`tooltip-title`", isCorrect: false },
      { id: "q-off-020-d", text: "`selector-toggle`", isCorrect: true },
    ],
  }));

  // Q21 — Theme
  off.push(upsertQuestion({
    id: "q-off-021",
    text: "An Adobe Commerce Developer writes the following LESS code:\n\n```less\n.header-wrapper {\n    .cms-index-index & {\n        background-color: @color-black;\n    }\n}\n```\n\nWhat will be the output of this code?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secTheme.id,
    explanation: "In LESS, using `&` after a selector reverses the nesting — `.cms-index-index & { }` compiles to `.cms-index-index .header-wrapper { }`, applying the style only inside that parent class.",
    options: [
      { id: "q-off-021-a", text: "Background color black will apply to the `header-wrapper` if it is inside `cms-index-index` class.", isCorrect: true },
      { id: "q-off-021-b", text: "Background color black will not apply to the `header-wrapper` if it is inside `cms-index-index` class.", isCorrect: false },
      { id: "q-off-021-c", text: "Background color black will apply to the `header-wrapper`.", isCorrect: false },
    ],
  }));

  // Q22 — Theme
  off.push(upsertQuestion({
    id: "q-off-022",
    text: "An Adobe Commerce developer needs to create CSS-style rules just for the desktop version.\n\nWhat Magento media query declaration would they use?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secTheme.id,
    explanation: "Desktop styles use a `min-width` breakpoint at `@screen__m`. The `.media-width` mixin with `@extremum = 'min'` targets screens wider than the breakpoint.",
    options: [
      { id: "q-off-022-a", text: "`& when (@media-common = true) {}`", isCorrect: false },
      { id: "q-off-022-b", text: "`.media-width(@extremum, @break) when (@extremum = 'min') and (@break = @screen__m) {}`", isCorrect: true },
      { id: "q-off-022-c", text: "`.media-width(@extremum, @break) when (@extremum = 'max') and (@break = @screen__m) {}`", isCorrect: false },
    ],
  }));

  // Q23 — JS/UI
  off.push(upsertQuestion({
    id: "q-off-023",
    text: "An Adobe Commerce developer is building a feature using Knockout.js.\n\nWhich binding is used to find the children nodes within the object in the UIRegistry by provided name?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "The `scope` binding in Magento's Knockout integration looks up a UI component by name in the UIRegistry and sets the binding context to that component's children.",
    options: [
      { id: "q-off-023-a", text: "`scope`", isCorrect: true },
      { id: "q-off-023-b", text: "`template`", isCorrect: false },
      { id: "q-off-023-c", text: "`mageInit`", isCorrect: false },
    ],
  }));

  // Q24 — JS/UI
  off.push(upsertQuestion({
    id: "q-off-024",
    text: "An Adobe Commerce Developer wants to add a mixin using the `requirejs-config.js` file.\n\nHow should the Developer add this mixin?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "Mixins are registered under `config.mixins` in `requirejs-config.js`, mapping the target module path to the mixin path with a boolean value.",
    options: [
      {
        id: "q-off-024-a",
        text: "```js\nvar config = {\n    config: {\n        mixins: {\n            'Vendor_Module/js/widgetitem': {\n                'Vendor_Module/js/widgetitem-mixin': true\n            }\n        }\n    }\n}\n```",
        isCorrect: true,
      },
      {
        id: "q-off-024-b",
        text: "```js\nvar config = {\n    map: {\n        '*': {\n            \"widgetitem\": \"Vendor_Module/js/widgetitem\"\n        }\n    }\n}\n```",
        isCorrect: false,
      },
      {
        id: "q-off-024-c",
        text: "```js\nvar config = {\n    mixins: {\n        'Vendor_Module/js/widgetitem': {\n            'Vendor_Module/js/widgetitem-mixin': true\n        }\n    }\n}\n```",
        isCorrect: false,
      },
    ],
  }));

  // Q25 — JS/UI
  off.push(upsertQuestion({
    id: "q-off-025",
    text: "An Adobe Commerce developer has been requested to overwrite a mixin.\n\nWhat would be the approach for overwriting a mixin?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "To overwrite a mixin, disable the original by setting it to `false` and enable the replacement by setting it to `true` — both under the same target module in `config.mixins`.",
    options: [
      {
        id: "q-off-025-a",
        text: "```js\nvar config = {\n    config: {\n        mixins: {\n            'Magento_Catalog/js/catalog-add-to-cart': {\n                'ExampleCorp_Sample/js/original-add-to-cart-mixin': false,\n                'ExampleCorp_CartFix/js/overwritten-add-to-cart-mixin': true\n            }\n        }\n    }\n};\n```",
        isCorrect: true,
      },
      {
        id: "q-off-025-b",
        text: "```js\nvar config = {\n    config: {\n        mixins: {\n            'Magento_Catalog/js/catalog-add-to-cart': {\n                'ExampleCorp_Sample/js/overwritten-add-to-cart-mixin': true\n            }\n        }\n    }\n};\n```",
        isCorrect: false,
      },
      {
        id: "q-off-025-c",
        text: "```js\nvar config = {\n    config: {\n        mixins: {\n            'Magento_Catalog/js/catalog-add-to-cart': {\n                'ExampleCorp_Sample/js/overwritten-add-to-cart-mixin': false\n            }\n        }\n    }\n};\n```",
        isCorrect: false,
      },
    ],
  }));

  // Q26 — JS/UI
  off.push(upsertQuestion({
    id: "q-off-026",
    text: "After a search engine optimization (SEO) audit, the agency requests to change all anchor links from the following format:\n\n```html\n<a href=\"sample-link\">Sample Link</a>\n```\n\nto a JavaScript-based solution which would allow to use `<span>` attributes instead `<a>`.\n\nWhich snippet will achieve this goal?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "The `redirect` widget initialized via `data-mage-init` on a span element handles click events and performs the redirect, replacing anchor tag behavior.",
    options: [
      { id: "q-off-026-a", text: "`<span data-mage-init='{\"redirect\": {\"event\": \"click\", \"url\": \"sample-link\"}}'>Sample Link</span>`", isCorrect: true },
      { id: "q-off-026-b", text: "`<span click=\"sample-link\">Sample Link</span>`", isCorrect: false },
      { id: "q-off-026-c", text: "`<span data-mage-init='{\"url\": \"sample-link\"}'>Sample Link</span>`", isCorrect: false },
    ],
  }));

  // Q27 — JS/UI
  off.push(upsertQuestion({
    id: "q-off-027",
    text: "An Adobe Commerce developer is creating a custom jQuery widget.\n\nWhich dependencies are required for the widget to work?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "Since Magento 2.4+, the jQuery UI widget factory was extracted into `jquery-ui-modules/widget`. Using the old `jquery/widget` path is incorrect.",
    options: [
      { id: "q-off-027-a", text: "`'jquery'`, `'jquery/widget'`", isCorrect: false },
      { id: "q-off-027-b", text: "`'jquery'`, `'jquery-ui-modules/widget'`", isCorrect: true },
      { id: "q-off-027-c", text: "`'jquery'`, `'widget'`", isCorrect: false },
    ],
  }));

  // Q28 — Checkout
  off.push(upsertQuestion({
    id: "q-off-028",
    text: "An Adobe Commerce Developer is editing an existing jsLayout on the page.\n\nWhich code will correctly extend the jsLayout?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secCheckout.id,
    explanation: "jsLayout is passed as an `<argument>` of type `array` on a `<referenceBlock>`. Using `<referenceContainer>` or a standalone `<block name=\"jsLayout\">` are incorrect approaches.",
    options: [
      {
        id: "q-off-028-a",
        text: "```xml\n<referenceBlock name=\"block.name\">\n    <arguments>\n        <argument name=\"jsLayout\" xsi:type=\"array\">\n            ....\n        </argument>\n    </arguments>\n</referenceBlock>\n```",
        isCorrect: true,
      },
      {
        id: "q-off-028-b",
        text: "```xml\n<referenceContainer name=\"container.name\">\n    <arguments>\n        <argument name=\"jsLayout\" xsi:type=\"array\">\n            ....\n        </argument>\n    </arguments>\n</referenceContainer>\n```",
        isCorrect: false,
      },
      {
        id: "q-off-028-c",
        text: "```xml\n<block name=\"jsLayout\">\n    ....\n</block>\n```",
        isCorrect: false,
      },
    ],
  }));

  // Q29 — JS/UI
  off.push(upsertQuestion({
    id: "q-off-029",
    text: "An Adobe Commerce developer needs to create a mixin for a third party JavaScript module.\n\nWhich code snippet can configure the mixin in `requirejs-config.js`?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "The mixin registration must be nested as `config: { mixins: { ... } }` — not with the `mixins` key at the top level or with the module name wrapping `mixins`.",
    options: [
      {
        id: "q-off-029-a",
        text: "```js\nmixins: {\n    config: {\n        'Vendor_Module/js/module': {\n            'Vendor_Module/js/module-mixin': true\n        }\n    }\n}\n```",
        isCorrect: false,
      },
      {
        id: "q-off-029-b",
        text: "```js\nconfig: {\n    'Vendor_Module/js/module': {\n        mixins: {\n            'Vendor_Module/js/module-mixin': true\n        }\n    }\n}\n```",
        isCorrect: false,
      },
      {
        id: "q-off-029-c",
        text: "```js\nconfig: {\n    mixins: {\n        'Vendor_Module/js/module': {\n            'Vendor_Module/js/module-mixin': true\n        }\n    }\n}\n```",
        isCorrect: true,
      },
    ],
  }));

  // Q30 — Checkout
  off.push(upsertQuestion({
    id: "q-off-030",
    text: "An Adobe Commerce developer wants to modify the template source of the shipping method list to be `Vendor_Module/custom-template`.\n\nHow would the developer make this modification in `app/design/Magento_Checkout/layout/checkout_index_index.xml`?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secCheckout.id,
    explanation: "The shipping method list template is configured by navigating through the full checkout component tree: checkout > children > steps > children > shipping-step > children > shippingAddress > config.",
    options: [
      {
        id: "q-off-030-a",
        text: "```xml\n<argument name=\"jsLayout\" xsi:type=\"array\">\n    <item name=\"components\" xsi:type=\"array\">\n        <item name=\"checkout\" xsi:type=\"array\">\n            <item name=\"component\" xsi:type=\"string\">uiComponent</item>\n                <item name=\"config\" xsi:type=\"array\">\n                    <item name=\"shippingMethodListTemplate\" xsi:type=\"string\">Vendor_Module/custom-template</item>\n                </item>\n            </item>\n        </item>\n    </item>\n</argument>\n```",
        isCorrect: false,
      },
      {
        id: "q-off-030-b",
        text: "```xml\n<argument name=\"jsLayout\" xsi:type=\"array\">\n    <item name=\"components\" xsi:type=\"array\">\n        <item name=\"checkout\" xsi:type=\"array\">\n            <item name=\"children\" xsi:type=\"array\">\n                <item name=\"steps\" xsi:type=\"array\">\n                    <item name=\"children\" xsi:type=\"array\">\n                        <item name=\"shipping-step\" xsi:type=\"array\">\n                            <item name=\"children\" xsi:type=\"array\">\n                                <item name=\"shippingAddress\" xsi:type=\"array\">\n                                    <item name=\"config\" xsi:type=\"array\">\n                                        <item name=\"shippingMethodListTemplate\" xsi:type=\"string\">Vendor_Module/custom-template</item>\n                                    </item>\n                                </item>\n                            </item>\n                        </item>\n                    </item>\n                </item>\n            </item>\n        </item>\n    </item>\n</argument>\n```",
        isCorrect: true,
      },
      {
        id: "q-off-030-c",
        text: "```xml\n<argument name=\"jsLayout\" xsi:type=\"array\">\n    <item name=\"components\" xsi:type=\"array\">\n        <item name=\"checkout\" xsi:type=\"array\">\n            <item name=\"children\" xsi:type=\"array\">\n                <item name=\"steps\" xsi:type=\"array\">\n                    <item name=\"children\" xsi:type=\"array\">\n                        <item name=\"shipping-step\" xsi:type=\"array\">\n                            <item name=\"children\" xsi:type=\"array\">\n                                <item name=\"shippingAddress\" xsi:type=\"array\">\n                                    <item name=\"config\" xsi:type=\"array\">\n                                        <item name=\"shippingMethodListTemplate\" xsi:type=\"string\">Magento_Checkout/custom-template</item>\n                                    </item>\n                                </item>\n                            </item>\n                        </item>\n                    </item>\n                </item>\n            </item>\n        </item>\n    </item>\n</argument>\n```",
        isCorrect: false,
      },
    ],
  }));

  // Q31 — JS/UI
  off.push(upsertQuestion({
    id: "q-off-031",
    text: "An Adobe Commerce Developer creates an `app/code/MyCompany/MyModule/view/frontend/web/template` directory in a custom module.\n\nWhich file type should be used in this folder?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "The `web/template` directory is reserved for Knockout HTML templates used by UI components. PHTML templates go in `view/frontend/templates/` instead.",
    options: [
      { id: "q-off-031-a", text: "JS", isCorrect: false },
      { id: "q-off-031-b", text: "PHTML", isCorrect: false },
      { id: "q-off-031-c", text: "Knockout HTML", isCorrect: true },
    ],
  }));

  // Q32 — JS/UI
  off.push(upsertQuestion({
    id: "q-off-032",
    text: "An Adobe Commerce developer needs to add product names to an observable array.\n\nWhat code snippet would the developer use?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "`ko.observableArray()` creates a Knockout observable array. Passing an array directly (not wrapped in `[]`) initializes it with the provided values.",
    options: [
      { id: "q-off-032-a", text: "`this.observableProductNames = ko.observableArray(productNames);`", isCorrect: true },
      { id: "q-off-032-b", text: "`this.observableProductNames = ko.observable([productNames]);`", isCorrect: false },
      { id: "q-off-032-c", text: "`this.observableProductNames = ko.observableItem(productNames);`", isCorrect: false },
    ],
  }));

  // Q33 — JS/UI
  off.push(upsertQuestion({
    id: "q-off-033",
    text: "An Adobe Commerce developer needs to extend a native Magento Menu widget.\n\nHow would the developer extend the Menu widget in a custom mixin file?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "Extending a widget requires `jquery`, `jquery-ui-modules/widget`, and `mage/menu` as dependencies. The widget is defined with `$.widget()` using the parent widget as the prototype.",
    options: [
      {
        id: "q-off-033-a",
        text: "```js\ndefine([\n    'jquery',\n    'mage/menu'\n], function($){\n    $.widget('custom.menu', $.mage.menu, { ... });\n    return $.custom.menu;\n});\n```",
        isCorrect: false,
      },
      {
        id: "q-off-033-b",
        text: "```js\ndefine([\n    'jquery',\n    'jquery-ui-modules/widget'\n], function($){\n    $.widget('custom.menu', $.mage.menu, { ... });\n    return $.custom.menu;\n});\n```",
        isCorrect: false,
      },
      {
        id: "q-off-033-c",
        text: "```js\ndefine([\n    'jquery',\n    'jquery-ui-modules/widget',\n    'mage/menu'\n], function($){\n    $.widget('custom.menu', $.mage.menu, { ... });\n    return $.custom.menu;\n});\n```",
        isCorrect: true,
      },
    ],
  }));

  // Q34 — JS/UI
  off.push(upsertQuestion({
    id: "q-off-034",
    text: "An Adobe Commerce developer has written a javascript file `Vendor_Module/js/myfile`, and wants to load all pages.\n\nWhat is the correct code snippet to add to a `requirejs-config.js` file to do this?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "Using `deps` in the RequireJS config array loads the specified modules on every page — this is the simplest way to auto-execute a JS file globally.",
    options: [
      {
        id: "q-off-034-a",
        text: "```js\nvar config = {\n    paths: {\n        'myfile': \"Vendor_Module/js/myfile\"\n    },\n    shim: {\n        'myfile': {\n            deps: ['jquery']\n        }\n    }\n}\n```",
        isCorrect: false,
      },
      {
        id: "q-off-034-b",
        text: "```js\nvar config = {\n    map: {\n        '*': {\n            customScript: 'Vendor_Module/js/myfile'\n        }\n    }\n};\n```",
        isCorrect: false,
      },
      {
        id: "q-off-034-c",
        text: "```js\nvar config = {\n    deps: ['Vendor_Module/js/myfile']\n}\n```",
        isCorrect: true,
      },
    ],
  }));

  // Q35 — JS/UI
  off.push(upsertQuestion({
    id: "q-off-035",
    text: "An Adobe Commerce Developer needs to initialize a JavaScript component in the `.phtml` file.\n\nWhich method should be used to achieve this goal?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "`require()` is used in PHTML templates to imperatively load and execute a JS module. It is the standard way to initialize components inline in templates.",
    options: [
      { id: "q-off-035-a", text: "`require()`", isCorrect: true },
      { id: "q-off-035-b", text: "`initJs()`", isCorrect: false },
      { id: "q-off-035-c", text: "`validate()`", isCorrect: false },
    ],
  }));

  // Q36 — JS/UI
  off.push(upsertQuestion({
    id: "q-off-036",
    text: "An Adobe Commerce developer has written a non-AMD module JS file, `Vendor_Module/js/test`, and wants to add `3rd-party-library` as a dependency, so that `3rd-party-library` is completely loaded before `Vendor_Module/js/test` runs.\n\nWhat is the correct code snippet to add to a `requirejs-config.js` file to do this?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "`shim` is used to declare dependencies for non-AMD scripts. Listing `3rd-party-library` under `deps` ensures it loads before `Vendor_Module/js/test` executes.",
    options: [
      {
        id: "q-off-036-a",
        text: "```js\nshim: {\n    'Vendor_Module/js/test' : {\n        deps: ['3rd-party-library']\n    }\n}\n```",
        isCorrect: true,
      },
      {
        id: "q-off-036-b",
        text: "```js\nconfig: {\n    mixins: {\n        '3rd-party-library': {\n            'Vendor_Module/js/test': true\n        }\n    }\n}\n```",
        isCorrect: false,
      },
      {
        id: "q-off-036-c",
        text: "```js\npaths: {\n    'test': [\n        '3rd-party-library',\n        'Vendor_Module/js/test'\n    ]\n}\n```",
        isCorrect: false,
      },
    ],
  }));

  // Q37 — Checkout
  off.push(upsertQuestion({
    id: "q-off-037",
    text: "An Adobe Commerce developer needs to remove a UI component on the Checkout page.\n\nWhat would the developer use to disable a UI component using Layout XML?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secCheckout.id,
    explanation: "Setting `componentDisabled` to `boolean` true in the component's `config` array disables it. Using `xsi:type=\"object\"` or `xsi:type=\"string\"` for the config item are both incorrect.",
    options: [
      {
        id: "q-off-037-a",
        text: "```xml\n<item name=\"config\" xsi:type=\"array\">\n    <item name=\"componentDisabled\" xsi:type=\"boolean\">true</item>\n</item>\n```",
        isCorrect: true,
      },
      {
        id: "q-off-037-b",
        text: "```xml\n<item name=\"config\" xsi:type=\"object\">\n    <item name=\"componentDisabled\" xsi:type=\"boolean\">true</item>\n</item>\n```",
        isCorrect: false,
      },
      {
        id: "q-off-037-c",
        text: "```xml\n<item name=\"config\" xsi:type=\"array\">\n    <item name=\"componentDisabled\" xsi:type=\"string\">true</item>\n</item>\n```",
        isCorrect: false,
      },
    ],
  }));

  // Q38 — JS/UI
  off.push(upsertQuestion({
    id: "q-off-038",
    text: "An Adobe Commerce Developer created a Knockout template and a corresponding JavaScript file with the following code:\n\n```js\nproductQty: ko.observable(0);\n```\n\nWhat does the developer need to add in the Knockout template, to show the value of `productQty`?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "The `text` binding in Knockout.js displays the value of an observable as text content. The `value` binding is for form inputs, and `observable` is not a valid binding.",
    options: [
      { id: "q-off-038-a", text: "`<p data-bind=\"text: productQty\"></p>`", isCorrect: true },
      { id: "q-off-038-b", text: "`<p data-bind=\"observable: productQty()\"></p>`", isCorrect: false },
      { id: "q-off-038-c", text: "`<p data-bind=\"value: productQty\"></p>`", isCorrect: false },
    ],
  }));

  // Q39 — JS/UI
  off.push(upsertQuestion({
    id: "q-off-039",
    text: "An Adobe Commerce developer is using the Accordion widget for mobile view and the Tabs widget for the desktop version.\n\nWhich option is only available for the Accordion widget?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "`multipleCollapsible` is an Accordion-specific option that allows multiple panels to be open simultaneously. The Tabs widget does not support this option.",
    options: [
      { id: "q-off-039-a", text: "`openOnFocus`", isCorrect: false },
      { id: "q-off-039-b", text: "`active`", isCorrect: false },
      { id: "q-off-039-c", text: "`multipleCollapsible`", isCorrect: true },
    ],
  }));

  // Q40 — JS/UI
  off.push(upsertQuestion({
    id: "q-off-040",
    text: "An Adobe Commerce developer decides to use a jQuery widget to implement an accordion for a customer's website.\n\nHow would the developer initialize the widget in a phtml file?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "The correct approach is to use `require()` with the `accordion` dependency and then call `.accordion()` on the jQuery element — this is the standard Magento pattern for widget initialization in PHTML.",
    options: [
      {
        id: "q-off-040-a",
        text: "```js\n$(\"#element\").accordion({\n    header: \"#title-1\",\n    content: \"#content-1\",\n    trigger: \"#trigger-1\",\n    ajaxUrlElement: \"a\"\n});\n```",
        isCorrect: false,
      },
      {
        id: "q-off-040-b",
        text: "`<div data-mage-init='{\"accordion\": {\"openedState\": \"_active\"}}'></div>`",
        isCorrect: false,
      },
      {
        id: "q-off-040-c",
        text: "```html\n<script>\n    require([\n        'jquery',\n        'accordion'\n    ], function ($) {\n        $(\"#element\").accordion();\n    });\n</script>\n```",
        isCorrect: true,
      },
    ],
  }));

  // Q41 — Theme (Fastly, MULTIPLE)
  off.push(upsertQuestion({
    id: "q-off-041",
    text: "Adobe commerce fronted developer found that Fastly caching services do not work after enabling.\n\nWhat action developer should perform to get Fastly caching work? (Choose two.)",
    type: "MULTIPLE", source: "OFFICIAL", sectionId: secTheme.id,
    explanation: "After enabling Fastly in Adobe Commerce, you must upload VCL to Fastly via the admin panel and refresh the cache for Fastly to function correctly.",
    options: [
      { id: "q-off-041-a", text: "Upload VCL to Fastly in the admin panel", isCorrect: true },
      { id: "q-off-041-b", text: "Add `fastly` to the extensions section in the `.magento.app.yaml` file", isCorrect: false },
      { id: "q-off-041-c", text: "Run `magento-cloud service:fastly enable` CLI command", isCorrect: false },
      { id: "q-off-041-d", text: "Refresh the cache", isCorrect: true },
    ],
  }));

  // Q42 — Theme
  off.push(upsertQuestion({
    id: "q-off-042",
    text: "An Adobe Commerce developer needs to add a custom theme to Grunt configuration.\n\nIn which file in the `dev/tools/grunt/` directory would the developer add the configuration?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secTheme.id,
    explanation: "Custom theme Grunt configuration is added to `dev/tools/grunt/configs/themes.js`, where each theme's LESS source paths and locales are defined.",
    options: [
      { id: "q-off-042-a", text: "`configs/themes.js`", isCorrect: true },
      { id: "q-off-042-b", text: "`themes.js`", isCorrect: false },
      { id: "q-off-042-c", text: "`grunt.js`", isCorrect: false },
    ],
  }));

  // Q43 — Theme
  off.push(upsertQuestion({
    id: "q-off-043",
    text: "Your client needs to change the logo on the purchase email. He asks you what is the best way to change the purchase email logo image.\n\nHow would the developer change the logo on a purchase email for a client?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secTheme.id,
    explanation: "The email logo is configured in the Admin under Content > Design > Configuration. Editing the store's theme settings and updating the logo under Transactional Emails is the proper no-deployment approach.",
    options: [
      { id: "q-off-043-a", text: "On the Admin section go to CONTENT > Design > Configuration, Edit your theme, and Change the image on section Transactional Emails", isCorrect: true },
      { id: "q-off-043-b", text: "Make a deployment including the new image in `pub/media/email/logo.png`", isCorrect: false },
      { id: "q-off-043-c", text: "Upload the image icon via FTP, SFTP or SSH on the path `pub/media/email/icon.png`", isCorrect: false },
    ],
  }));

  // Q44 — Theme
  off.push(upsertQuestion({
    id: "q-off-044",
    text: "A client's website is running very slowly after a recent deployment. An Adobe Commerce Developer notices that the full-page cache is disabled and needs to be turned back on.\n\nWhich CLI command should the Developer use?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secTheme.id,
    explanation: "`bin/magento cache:enable full_page` re-enables the full-page cache type. The commands `cache:start` and `cache:begin` do not exist.",
    options: [
      { id: "q-off-044-a", text: "`bin/magento cache:start full_page`", isCorrect: false },
      { id: "q-off-044-b", text: "`bin/magento cache:enable full_page`", isCorrect: true },
      { id: "q-off-044-c", text: "`bin/magento cache:begin full_page`", isCorrect: false },
    ],
  }));

  // Q45 — JS/UI (PageBuilder image uploader)
  off.push(upsertQuestion({
    id: "q-off-045",
    text: "An Adobe Commerce developer is customizing the Image Uploader component for the Image content type, and has created an `additional_data` section in the XML config. What would be the correct way to access this data via JS?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "The Image content type's additional data is accessed in the `master.js` file, where `config.additional_data.uploaderConfig` is used with `Object.assign` to build the uploader configuration.",
    options: [
      {
        id: "q-off-045-a",
        text: "In an `.../image/additional-data.js` file, create the following object:\n```js\nvar uploaderConfiguration = Object.assign(\n    {},\n    config.additional_data.uploaderConfig,\n    {\n        value: this.dataStore.get(),\n    },\n);\n```",
        isCorrect: false,
      },
      {
        id: "q-off-045-b",
        text: "In an `.../image/preview.js` file, create the following object:\n```js\nvar uploaderConfiguration = Object.assign(\n    {},\n    config.additional_data.uploaderConfig,\n    {\n        value: this.dataStore.get().image,\n    },\n);\n```",
        isCorrect: true,
      },
      {
        id: "q-off-045-c",
        text: "In an `.../image/master.js` file, create the following object:\n```js\nvar uploaderConfiguration = Object.assign(\n    {},\n    config.additional_data.uploaderConfig,\n    {\n        value: config.additional_data.get(),\n    },\n);\n```",
        isCorrect: false,
      },
    ],
  }));

  // Q46 — JS/UI (Edge Delivery Services)
  off.push(upsertQuestion({
    id: "q-off-046",
    text: "In the headless Edge Delivery Service (EDS) approach, where does product data get loaded?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "In the headless EDS architecture, product data is fetched client-side directly from the GraphQL API, not pre-rendered or stored in IndexedDB.",
    options: [
      { id: "q-off-046-a", text: "Product data is fetched from IndexedDB.", isCorrect: false },
      { id: "q-off-046-b", text: "Product data is prerendered and embedded in static files.", isCorrect: false },
      { id: "q-off-046-c", text: "Product data is fetched from the GraphQL API directly to the front-end.", isCorrect: true },
    ],
  }));

  // Q47 — Theme
  off.push(upsertQuestion({
    id: "q-off-047",
    text: "Which Javascript configuration reduces the size of JavaScript files by stripping whitespace and shortening variable names?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secTheme.id,
    explanation: "Minification strips whitespace and renames variables to shorter names to reduce file size. Merging combines files; bundling packages modules for optimized loading.",
    options: [
      { id: "q-off-047-a", text: "Minify", isCorrect: true },
      { id: "q-off-047-b", text: "Merge", isCorrect: false },
      { id: "q-off-047-c", text: "Bundle", isCorrect: false },
    ],
  }));

  // Q48 — JS/UI (PageBuilder content type)
  off.push(upsertQuestion({
    id: "q-off-048",
    text: "The Adobe Commerce developer has a new Page Builder content type called Quote, which the website admin can use to show customer testimonials or other types of quotations within the storefront. The developer needs the content type Quote to be dragged and dropped inside the content type Column only and nowhere else. Also, shouldn't be possible to drag any content type inside the content type Quote.\n\nHow the developer would set the XML content type Quote configuration file?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secJs.id,
    explanation: "To restrict where a content type can be dropped, use `<parents default_policy=\"deny\">` with a specific `<parent name=\"column\" policy=\"allow\"/>`. To prevent children, use `<children default_policy=\"deny\"/>`.",
    options: [
      {
        id: "q-off-048-a",
        text: "```xml\n<parents default_policy=\"allow\"/>\n<children default_policy=\"deny\"/>\n```",
        isCorrect: false,
      },
      {
        id: "q-off-048-b",
        text: "```xml\n<parents default_policy=\"deny\">\n    <parent name=\"column\" policy=\"allow\"/>\n</parents>\n<children default_policy=\"deny\"/>\n```",
        isCorrect: true,
      },
      {
        id: "q-off-048-c",
        text: "```xml\n<parents default_policy=\"deny\"/>\n<children default_policy=\"deny\">\n    <child name=\"column\" policy=\"allow\"/>\n</children>\n```",
        isCorrect: false,
      },
    ],
  }));

  // Q49 — Theme
  off.push(upsertQuestion({
    id: "q-off-049",
    text: "An Adobe Commerce developer wants to ensure users get the latest version of the assets.\n\nWhich CLI command would they use?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secTheme.id,
    explanation: "Enabling static content signing (`dev/static/sign 1`) appends a version hash to static asset URLs, forcing browsers to fetch updated files instead of serving cached versions.",
    options: [
      { id: "q-off-049-a", text: "`bin/magento config:set dev/js/enable_js_bundling 1`", isCorrect: false },
      { id: "q-off-049-b", text: "`bin/magento config:set dev/js/minify_files 1`", isCorrect: false },
      { id: "q-off-049-c", text: "`bin/magento config:set dev/static/sign 1`", isCorrect: true },
    ],
  }));

  // Q50 — Theme
  off.push(upsertQuestion({
    id: "q-off-050",
    text: "An Adobe Commerce developer is working for a client, who would like to change translations manually on the storefront.\n\nWhat configuration in the Admin would the developer need to enable to change the translations in the browser?",
    type: "SINGLE", source: "OFFICIAL", sectionId: secTheme.id,
    explanation: "Inline translation for the storefront is enabled at Stores > Configuration > Advanced > Developer > Translate Inline > Enabled for Storefront.",
    options: [
      { id: "q-off-050-a", text: "Stores > Configuration > Advanced > Developer > Translate Inline > Enabled for both", isCorrect: false },
      { id: "q-off-050-b", text: "Stores > Configuration > Advanced > Developer > Translate > Enabled for Storefront", isCorrect: false },
      { id: "q-off-050-c", text: "Stores > Configuration > Advanced > Developer > Translate Inline > Enabled for Storefront", isCorrect: true },
    ],
  }));

  const allOfficialQuestions = await Promise.all(off);
  console.log(`Created ${allOfficialQuestions.length} official questions.`);

  // ─── Remove stale AI placeholder questions (now managed by seed-ai-practice-tests.ts) ──

  const staleAiIds = ["q-ai-th-001", "q-ai-ly-001", "q-ai-js-001", "q-ai-ch-001"];
  await prisma.practiceTestQuestion.deleteMany({ where: { questionId: { in: staleAiIds } } });
  for (const id of staleAiIds) {
    await prisma.questionOption.deleteMany({ where: { questionId: id } });
    await prisma.question.deleteMany({ where: { id } });
  }

  // ─── Practice Tests ───────────────────────────────────────────────────────

  const officialTest = await prisma.practiceTest.upsert({
    where: { id: "pt-official-e727" },
    update: { questionCount: allOfficialQuestions.length },
    create: {
      id: "pt-official-e727",
      certificationId: cert.id,
      title: "Official Practice Exam",
      type: "OFFICIAL",
      questionCount: allOfficialQuestions.length,
    },
  });

  for (let i = 0; i < allOfficialQuestions.length; i++) {
    await prisma.practiceTestQuestion.upsert({
      where: {
        practiceTestId_questionId: {
          practiceTestId: officialTest.id,
          questionId: allOfficialQuestions[i].id,
        },
      },
      update: {},
      create: {
        practiceTestId: officialTest.id,
        questionId: allOfficialQuestions[i].id,
        position: i + 1,
      },
    });
  }

  await prisma.practiceTest.upsert({
    where: { id: "pt-shuffle-e727" },
    update: { questionCount: 50 },
    create: {
      id: "pt-shuffle-e727",
      certificationId: cert.id,
      title: "Shuffle Exam",
      type: "SHUFFLE",
      questionCount: 50,
    },
  });

  console.log("Practice tests seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
