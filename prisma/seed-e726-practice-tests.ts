import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding AD0-E726 Front-End Developer Professional practice tests...");

  // ─── Certification ─────────────────────────────────────────────────────────

  const cert = await prisma.certification.upsert({
    where: { id: "cert-ad0-e726" },
    update: {},
    create: {
      id: "cert-ad0-e726",
      name: "Adobe Commerce Front-End Developer Professional",
      code: "AD0-E726",
      provider: "Adobe",
      description:
        "Validates expertise in Adobe Commerce front-end development including theme creation, layout XML, LESS/CSS styling, JavaScript/RequireJS, Knockout.js, and template customization.",
      totalQuestions: 50,
      passingScore: 33,
      timeLimitMinutes: 100,
    },
  });

  // ─── Sections ──────────────────────────────────────────────────────────────

  const [secTheme, secLayout, secTemplates, secStyling, secJs, secSecurity] =
    await Promise.all([
      prisma.certSection.upsert({
        where: { id: "sec726-theme" },
        update: { name: "Theme Setup & Design", percentage: 14 },
        create: { id: "sec726-theme", certificationId: cert.id, name: "Theme Setup & Design", percentage: 14 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec726-layout" },
        update: { name: "Layout XML", percentage: 22 },
        create: { id: "sec726-layout", certificationId: cert.id, name: "Layout XML", percentage: 22 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec726-templates" },
        update: { name: "Templates & Email", percentage: 8 },
        create: { id: "sec726-templates", certificationId: cert.id, name: "Templates & Email", percentage: 8 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec726-styling" },
        update: { name: "Styling & LESS", percentage: 12 },
        create: { id: "sec726-styling", certificationId: cert.id, name: "Styling & LESS", percentage: 12 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec726-js" },
        update: { name: "JavaScript & Knockout", percentage: 26 },
        create: { id: "sec726-js", certificationId: cert.id, name: "JavaScript & Knockout", percentage: 26 },
      }),
      prisma.certSection.upsert({
        where: { id: "sec726-security" },
        update: { name: "Security & Architecture", percentage: 18 },
        create: { id: "sec726-security", certificationId: cert.id, name: "Security & Architecture", percentage: 18 },
      }),
    ]);

  // ─── Upsert helper ─────────────────────────────────────────────────────────

  async function upsertQuestion(data: {
    id: string;
    text: string;
    type: "SINGLE" | "MULTIPLE";
    sectionId: string;
    explanation: string;
    options: { id: string; text: string; isCorrect: boolean }[];
  }) {
    const q = await prisma.question.upsert({
      where: { id: data.id },
      update: {
        text: data.text, type: data.type,
        explanation: data.explanation, certSectionId: data.sectionId,
      },
      create: {
        id: data.id, certificationId: cert.id, certSectionId: data.sectionId,
        text: data.text, type: data.type, source: "OFFICIAL", explanation: data.explanation,
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

  // Q1 — Theme Setup & Design
  off.push(upsertQuestion({
    id: "q-e726-001", type: "SINGLE", sectionId: secTheme.id,
    text: "In which directory should a developer create a new custom theme?",
    explanation: "Custom themes must be created in `app/design/frontend/Vendor/Theme`. This follows Magento's directory convention where `app/design/frontend/` contains all frontend themes organized by vendor and theme name.",
    options: [
      { id: "q-e726-001-a", text: "vendor/magento/theme-frontend/", isCorrect: false },
      { id: "q-e726-001-b", text: "lib/frontend/Vendor/Custom/Theme", isCorrect: false },
      { id: "q-e726-001-c", text: "app/design/frontend/Vendor/Theme", isCorrect: true },
      { id: "q-e726-001-d", text: "pub/static/frontend/Vendor/Theme/", isCorrect: false },
    ],
  }));

  // Q2 — Theme Setup & Design
  off.push(upsertQuestion({
    id: "q-e726-002", type: "MULTIPLE", sectionId: secTheme.id,
    text: "A developer is tasked with implementing custom design elements which are not part of the default theme. The developer decides to create a new theme.\nWhich two mandatory files are required to initialize the theme before customizing? (Choose two.)",
    explanation: "When creating a custom theme, `theme.xml` (declares the theme, its parent, and preview image) and `registration.php` (registers the theme with Magento's component system) are the two required files. `composer.json` is optional, and `etc/view.xml` configures image sizes.",
    options: [
      { id: "q-e726-002-a", text: "composer.json", isCorrect: false },
      { id: "q-e726-002-b", text: "theme.xml", isCorrect: true },
      { id: "q-e726-002-c", text: "etc/view.xml", isCorrect: false },
      { id: "q-e726-002-d", text: "registration.php", isCorrect: true },
    ],
  }));

  // Q3 — Theme Setup & Design
  off.push(upsertQuestion({
    id: "q-e726-003", type: "SINGLE", sectionId: secTheme.id,
    text: "An Adobe Commerce developer created a custom theme and placed logo.png file in /web/images for setting the theme logo, but the logo is not set.\nWhat should the developer do to resolve the issue and set the theme logo?",
    explanation: "To use a custom logo image, declare the theme logo in `/Magento_Theme/layout/default.xml` using the `` node to specify the logo file path. Simply placing the file in `web/images/` is not sufficient — it must be declared in layout XML.",
    options: [
      { id: "q-e726-003-a", text: "Run bin/magento setup:static-content:deploy command", isCorrect: false },
      { id: "q-e726-003-b", text: "Clear the files in pub/static/frontend", isCorrect: false },
      { id: "q-e726-003-c", text: "Rename the logo file to logo.svg and place it in /web/logo/", isCorrect: false },
      { id: "q-e726-003-d", text: "Declare a theme logo in /Magento_Theme/layout/default.xml", isCorrect: true },
    ],
  }));

  // Q4 — Theme Setup & Design
  off.push(upsertQuestion({
    id: "q-e726-004", type: "SINGLE", sectionId: secTheme.id,
    text: "Which file is used to specify the parent's theme name?",
    explanation: "`theme.xml` is used to specify the parent theme name. It contains the `` element that defines theme inheritance, allowing the child theme to fall back to the parent for any files it doesn't override.",
    options: [
      { id: "q-e726-004-a", text: "theme.xml", isCorrect: true },
      { id: "q-e726-004-b", text: "view.xml", isCorrect: false },
      { id: "q-e726-004-c", text: "config.xml", isCorrect: false },
      { id: "q-e726-004-d", text: "parent.xml", isCorrect: false },
    ],
  }));

  // Q5 — Theme Setup & Design
  off.push(upsertQuestion({
    id: "q-e726-005", type: "SINGLE", sectionId: secTheme.id,
    text: "After creating a new storefront theme, the developer does not see it taking effect on the site.\nWhere in the Admin Panel can the developer find the settings to apply it?",
    explanation: "After creating a new theme, it must be applied via Content > Design > Configuration in the admin panel. This is where you assign a theme to a specific store view. System > Design and Stores > Configuration > Design are incorrect paths.",
    options: [
      { id: "q-e726-005-a", text: "Content > Design > Configuration", isCorrect: true },
      { id: "q-e726-005-b", text: "System > Design > Template", isCorrect: false },
      { id: "q-e726-005-c", text: "Stores > Configuration > Design", isCorrect: false },
    ],
  }));

  // Q6 — Layout XML
  off.push(upsertQuestion({
    id: "q-e726-006", type: "SINGLE", sectionId: secLayout.id,
    text: "A client would like to remove a popup from the home page. The block element is identified by the name \"ad-popup\".\nWhich instruction would remove this element?",
    explanation: "To remove a block from the layout, use ``. This is the standard layout XML instruction for removing blocks. `dismiss`, `` element, and other syntax are not valid.",
    options: [
      { id: "q-e726-006-a", text: "", isCorrect: true },
      { id: "q-e726-006-b", text: "", isCorrect: false },
      { id: "q-e726-006-c", text: "", isCorrect: false },
    ],
  }));

  // Q7 — Security & Architecture
  off.push(upsertQuestion({
    id: "q-e726-007", type: "SINGLE", sectionId: secSecurity.id,
    text: "Which Escaper method should an Adobe Commerce developer use when JSON is inside an HTML attribute of the main code?",
    explanation: "When JSON is inside an HTML attribute, `escapeHtmlAttr` must be used. It encodes characters that could break out of the HTML attribute context, preventing XSS attacks. `escapeHtml` is for body content, `escapeJS` is for inline scripts.",
    options: [
      { id: "q-e726-007-a", text: "escapeHtmlAttr", isCorrect: true },
      { id: "q-e726-007-b", text: "escapeHtml", isCorrect: false },
      { id: "q-e726-007-c", text: "escapeJS", isCorrect: false },
    ],
  }));

  // Q8 — Security & Architecture
  off.push(upsertQuestion({
    id: "q-e726-008", type: "SINGLE", sectionId: secSecurity.id,
    text: "Which case requires escaping with \\Magento\\Framework\\Escaper in .phtml files to prevent Cross Site Scripting (XSS)?",
    explanation: "Output in double quotes with variables requires escaping with `\\Magento\\Framework\\Escaper` to prevent XSS. Variables interpolated in double-quoted strings can contain malicious content. Single quotes without variables and type casting/count() are safe.",
    options: [
      { id: "q-e726-008-a", text: "Typecasting and the PHP function count()", isCorrect: false },
      { id: "q-e726-008-b", text: "Output in double quotes with variables", isCorrect: true },
      { id: "q-e726-008-c", text: "Output in single quotes without variable", isCorrect: false },
    ],
  }));

  // Q9 — Layout XML
  off.push(upsertQuestion({
    id: "q-e726-009", type: "SINGLE", sectionId: secLayout.id,
    text: "A third-party extension defines  element in the catalog_product_view.xml. The developer wants to use the instruction that would add a new block element to the container.\nWhich instruction should be used?",
    explanation: "To add a block inside an existing container, use `` and nest a `` element inside. You reference containers with ``, not ``. The `` element alone creates a new container rather than referencing an existing one.",
    options: [
      { id: "q-e726-009-a", text: "\n\n\n\n", isCorrect: true },
      { id: "q-e726-009-b", text: "\n\n\n\n", isCorrect: false },
      { id: "q-e726-009-c", text: "\n\n\n\n", isCorrect: false },
    ],
  }));

  // Q10 — Layout XML
  off.push(upsertQuestion({
    id: "q-e726-010", type: "SINGLE", sectionId: secLayout.id,
    text: "A developer is tasked with changing the title text of the quote summary section in the checkout page and decides to change the text in view/frontend/web/template/summary.html inside Magento_Checkout module.\nWhat is the preferred way to take this action?",
    explanation: "Knockout.js templates in the checkout are located in `Magento_Checkout/web/template/` (note: `template`, not `templates`). To override, create the file at `/Magento_Checkout/web/template/summary/summary.html`.",
    options: [
      { id: "q-e726-010-a", text: "Create and edit a new file named summary.html in the custom theme under Magento_Checkout/template/summary.html", isCorrect: false },
      { id: "q-e726-010-b", text: "Create and edit a new file named summary.html in the custom theme under Magento_Checkout/web/templates/summary.html", isCorrect: false },
      { id: "q-e726-010-c", text: "Create and edit a new file named summary.html in the custom theme under Magento_Checkout/templates/summary.html", isCorrect: false },
      { id: "q-e726-010-d", text: "Create and edit a new file named summary.html in the custom theme under Magento_Checkout/web/template/summary.html", isCorrect: true },
    ],
  }));

  // Q11 — Layout XML
  off.push(upsertQuestion({
    id: "q-e726-011", type: "SINGLE", sectionId: secLayout.id,
    text: "A developer needs to insert a custom CSS class name to the title block.\nWhich instruction added to the correct XML file can be used for this action?",
    explanation: "To add a CSS class to a block, use the `` instruction to pass it as a block argument. This makes the class available via `$block->getData()` in the template. `htmlClass` is for containers, not blocks.",
    options: [
      { id: "q-e726-011-a", text: "Add the CSS class as an argument to the block", isCorrect: true },
      { id: "q-e726-011-b", text: "Add the CSS class to the block by using htmlClass instruction", isCorrect: false },
      { id: "q-e726-011-c", text: "Assign the CSS class to the container that is parent to the block", isCorrect: false },
    ],
  }));

  // Q12 — Layout XML
  off.push(upsertQuestion({
    id: "q-e726-012", type: "SINGLE", sectionId: secLayout.id,
    text: "What is the directory name used for overriding page layout files?",
    explanation: "Page layout files are stored in the `page_layout` directory. This is distinct from the `layout` directory which contains page configuration and generic layout files. Page layouts define the overall page structure (1column, 2columns-left, etc.).",
    options: [
      { id: "q-e726-012-a", text: "layout", isCorrect: false },
      { id: "q-e726-012-b", text: "p_layout", isCorrect: false },
      { id: "q-e726-012-c", text: "page_layout", isCorrect: true },
    ],
  }));

  // Q13 — Layout XML
  off.push(upsertQuestion({
    id: "q-e726-013", type: "SINGLE", sectionId: secLayout.id,
    text: "How can a developer set the layout of a page?",
    explanation: "The page layout is set using the `layout` attribute directly on the `` element: ``. This is the correct XML syntax for specifying which page layout template to use.",
    options: [
      { id: "q-e726-013-a", text: "\n\n\n\nlayout-identifier\n\n\n\n", isCorrect: false },
      { id: "q-e726-013-b", text: "\n\n\n\n", isCorrect: false },
      { id: "q-e726-013-c", text: "\n\n", isCorrect: true },
    ],
  }));

  // Q14 — Layout XML
  off.push(upsertQuestion({
    id: "q-e726-014", type: "SINGLE", sectionId: secLayout.id,
    text: "Which location should be used for the layout file when extending a page configuration layout file in Adobe Commerce?",
    explanation: "To extend a page configuration layout file from a module within a theme, place the file at `//layout`. This follows the theme override convention where layout XML files mirror the module's structure.",
    options: [
      { id: "q-e726-014-a", text: "//layout", isCorrect: true },
      { id: "q-e726-014-b", text: "//view", isCorrect: false },
      { id: "q-e726-014-c", text: "//configuration_layout", isCorrect: false },
    ],
  }));

  // Q15 — Layout XML
  off.push(upsertQuestion({
    id: "q-e726-015", type: "SINGLE", sectionId: secLayout.id,
    text: "A developer has added a custom CSS class as an argument in the layout file.\n`\n        custom-class\n\n`\nHow would the developer access this argument in phtml?",
    explanation: "To access a custom CSS class passed as a block argument in layout XML, use `$block->getData('custom_css_class')` in the `.phtml` template. The `getData()` method retrieves values set via layout XML ``.",
    options: [
      { id: "q-e726-015-a", text: "$block->getArg('custom_css_class')", isCorrect: false },
      { id: "q-e726-015-b", text: "$block->getData()->getCustomCssClass()", isCorrect: false },
      { id: "q-e726-015-c", text: "$block->getCssClass(‘custom_css_class’)", isCorrect: false },
      { id: "q-e726-015-d", text: "$block->getData(‘custom_css_class’)", isCorrect: true },
    ],
  }));

  // Q16 — Layout XML
  off.push(upsertQuestion({
    id: "q-e726-016", type: "SINGLE", sectionId: secLayout.id,
    text: "A developer needs to display a block only when a system configuration is enabled. The xml path to the system configuration is \"custom_module/general/enable\" and the value is a boolean value.\nWhich instruction should be used?",
    explanation: "The `ifconfig` attribute on a block element controls conditional rendering based on a system configuration value. When the config path evaluates to true/enabled, the block renders; otherwise it's hidden. `display` and `cacheable` serve different purposes.",
    options: [
      { id: "q-e726-016-a", text: "", isCorrect: false },
      { id: "q-e726-016-b", text: "", isCorrect: true },
      { id: "q-e726-016-c", text: "", isCorrect: false },
    ],
  }));

  // Q17 — Templates & Email
  off.push(upsertQuestion({
    id: "q-e726-017", type: "SINGLE", sectionId: secTemplates.id,
    text: "A developer plans a customization that requires changing the template file items.phtml located in app/code/CustomVendor/Wishlist/view/frontend/templates. The developer decides to override a template in a custom theme.\nHow can the developer complete this goal?",
    explanation: "To override a module template, create the file in the theme directory under `/templates/`. For `CustomVendor_Wishlist`, the path is `/CustomVendor_Wishlist/templates/items.phtml`.",
    options: [
      { id: "q-e726-017-a", text: "Create a new items.phtml file in the theme directory under the path CustomVendor_Wishlist/templates.", isCorrect: true },
      { id: "q-e726-017-b", text: "Replace the original file inside the CustomVendor_Wishlist module with the custom file, and then update XML instruction inside the module to change the template file name.", isCorrect: false },
      { id: "q-e726-017-c", text: "Create a new items.phtml file in the theme directory under the path CustomVendor_Wishlist/view/templates/override/items.phtml.", isCorrect: false },
    ],
  }));

  // Q18 — Layout XML
  off.push(upsertQuestion({
    id: "q-e726-018", type: "SINGLE", sectionId: secLayout.id,
    text: "Which file is used to define the layout of the checkout page in Adobe Commerce?",
    explanation: "The checkout page layout is defined in `checkout_index_index.xml`. This follows Magento's layout handle naming convention: `{route}_{controller}_{action}`, where the checkout page uses `checkout/index/index`.",
    options: [
      { id: "q-e726-018-a", text: "checkout_index_index.xml", isCorrect: true },
      { id: "q-e726-018-b", text: "checkout_index_checkout.xml", isCorrect: false },
      { id: "q-e726-018-c", text: "checkout_index_cart.xml", isCorrect: false },
      { id: "q-e726-018-d", text: "checkout_cart_index.xml", isCorrect: false },
    ],
  }));

  // Q19 — Security & Architecture
  off.push(upsertQuestion({
    id: "q-e726-019", type: "SINGLE", sectionId: secSecurity.id,
    text: "Which \\Magento\\Framework\\Escaper class method exists in Adobe Commerce?",
    explanation: "`escapeUrl` is a valid method of the `\\Magento\\Framework\\Escaper` class. It sanitizes URLs to prevent XSS through malicious URL schemes. `escapeHtmlVar` and `escapeJsTags` do not exist in the Escaper class.",
    options: [
      { id: "q-e726-019-a", text: "escapeHtmlVar", isCorrect: false },
      { id: "q-e726-019-b", text: "escapeJsTags", isCorrect: false },
      { id: "q-e726-019-c", text: "escapeUrl", isCorrect: true },
    ],
  }));

  // Q20 — Templates & Email
  off.push(upsertQuestion({
    id: "q-e726-020", type: "SINGLE", sectionId: secTemplates.id,
    text: "A developer created a custom module called Custom_Email that will send a custom email template.\nHow should the developer declare it in the XML to call the template that will be sent by the module?",
    explanation: "Email templates are registered in `email_templates.xml` using `` elements with `type=\"html\"` and the `module` attribute specifying the owning module. The `file` attribute points to the HTML template file, and `area` specifies frontend or adminhtml.",
    options: [
      { id: "q-e726-020-a", text: "", isCorrect: false },
      { id: "q-e726-020-b", text: "", isCorrect: false },
      { id: "q-e726-020-c", text: "", isCorrect: true },
    ],
  }));

  // Q21 — Layout XML
  off.push(upsertQuestion({
    id: "q-e726-021", type: "SINGLE", sectionId: secLayout.id,
    text: "What is the correct XML required to remove a specific block from a layout?",
    explanation: "To remove a block from a layout, use ``. The `` element repositions blocks, `` is not a valid element, and `action=\"remove\"` is not valid syntax.",
    options: [
      { id: "q-e726-021-a", text: "", isCorrect: false },
      { id: "q-e726-021-b", text: "", isCorrect: false },
      { id: "q-e726-021-c", text: "", isCorrect: false },
      { id: "q-e726-021-d", text: "", isCorrect: true },
    ],
  }));

  // Q22 — Layout XML
  off.push(upsertQuestion({
    id: "q-e726-022", type: "SINGLE", sectionId: secLayout.id,
    text: "A developer created a new block named product.slider as a child of an existing block in the layout XML. After clearing the cache, the new product.slider block is still not rendering on the front end.\nWhich action must be taken to correct this problem?",
    explanation: "To render a child block in a parent template, use `<?= $block->getChildHtml('product.slider') ?>`. `getChildBlock()` returns the block object (not HTML), `renderChildren()` renders all children, and `render()` is not a standard block method.",
    options: [
      { id: "q-e726-022-a", text: "Add <?= $block->getChildBlock('product.slider') ?> directive to the parent block template.", isCorrect: false },
      { id: "q-e726-022-b", text: "Add $block->renderChildren() directive to parent block template.", isCorrect: false },
      { id: "q-e726-022-c", text: "Add $block->render() in product.slider block template.", isCorrect: false },
      { id: "q-e726-022-d", text: "Add  <?= $block->getChildHtml('product.slider') ?> directive to the parent block template.", isCorrect: true },
    ],
  }));

  // Q23 — Templates & Email
  off.push(upsertQuestion({
    id: "q-e726-023", type: "SINGLE", sectionId: secTemplates.id,
    text: "An Adobe Commerce Developer wants to change the design and style of order emails. The developer decides to override email template in Magento_Sales module.\nHow can this be accomplished?",
    explanation: "To override order email templates, copy and modify the file in `app/design/frontend/{vendor}/{theme}/Magento_Sales/email/`. This follows the theme override pattern for email templates, keeping customizations in the theme rather than in module code.",
    options: [
      { id: "q-e726-023-a", text: "Copy and Modify the template file in app/code/Magento/Sales/view/frontend/templates/email directory", isCorrect: false },
      { id: "q-e726-023-b", text: "Copy and Modify the template file in app/code/Magento/Sales/view/frontend/email directory", isCorrect: false },
      { id: "q-e726-023-c", text: "Copy and Modify the template file in app/design/frontend/{vendor}/{theme}/Magento_Sales/email directory", isCorrect: true },
      { id: "q-e726-023-d", text: "Copy and Modify the template file in app/design/frontend/{vendor}/{theme}/Magento_Sales/templates/email directory", isCorrect: false },
    ],
  }));

  // Q24 — Layout XML
  off.push(upsertQuestion({
    id: "q-e726-024", type: "SINGLE", sectionId: secLayout.id,
    text: "How would a developer extend the layout located at Magento_Customer/view/frontend/layout/customer_account.xml in a theme ?",
    explanation: "To extend a module's layout file within a theme, place the override at `/Magento_Customer/layout/customer_account.xml`. No `override`, `extend`, or `view/frontend` subdirectory is needed — Magento automatically merges layout files at this path.",
    options: [
      { id: "q-e726-024-a", text: "/Magento_Customer/layout/override/base/customer_account.xml", isCorrect: false },
      { id: "q-e726-024-b", text: "/Magento_Customer/layout/customer_account.xml", isCorrect: true },
      { id: "q-e726-024-c", text: "/Magento_Customer/layout/extend/customer_account.xml", isCorrect: false },
      { id: "q-e726-024-d", text: "/Magento_Customer/view/frontend/layout/customer_account.xml", isCorrect: false },
    ],
  }));

  // Q25 — Styling & LESS
  off.push(upsertQuestion({
    id: "q-e726-025", type: "SINGLE", sectionId: secStyling.id,
    text: "Which file contains LESS instructions that will generate desktop-specific styles?",
    explanation: "`styles-l.less` contains LESS instructions that generate desktop-specific styles. In Magento's responsive framework, `-l` stands for 'large' screens (desktop), while `-m` is for medium/mobile. There is no `styles-lg.less` or `styles-xl.less`.",
    options: [
      { id: "q-e726-025-a", text: "styles-lg.less", isCorrect: false },
      { id: "q-e726-025-b", text: "styles-l.less", isCorrect: true },
      { id: "q-e726-025-c", text: "styles-xl.less", isCorrect: false },
    ],
  }));

  // Q26 — Styling & LESS
  off.push(upsertQuestion({
    id: "q-e726-026", type: "MULTIPLE", sectionId: secStyling.id,
    text: "An Adobe Commerce developer wants to create a new LESS partial file that other developers can extend in their own custom modules and themes.\nWhich two items are essential to achieve the above when adding a new import directive to achieve this? (Choose two).",
    explanation: "When creating a new LESS partial for others to extend: (1) Use `@magento_import` (not standard `@import`) so Magento can resolve the path across modules and themes, and (2) prefix the import declaration with `//` which signals Magento to process it as a special import directive.",
    options: [
      { id: "q-e726-026-a", text: "Use the `@magento_import` directive, not the default LESS `@import`", isCorrect: true },
      { id: "q-e726-026-b", text: "The import declaration must be above all other directives and styles within the LESS file", isCorrect: false },
      { id: "q-e726-026-c", text: "The absolute path of the new file must be added to the import declaration", isCorrect: false },
      { id: "q-e726-026-d", text: "Prefix the import declaration with `//`", isCorrect: true },
      { id: "q-e726-026-e", text: "The import declaration must be included in a modules `_module.less` file", isCorrect: false },
    ],
  }));

  // Q27 — Styling & LESS
  off.push(upsertQuestion({
    id: "q-e726-027", type: "SINGLE", sectionId: secStyling.id,
    text: "Which file will keep style enhancements of the parent theme?",
    explanation: "`_extend.less` preserves and extends the parent theme's styles. It is included after the parent theme's styles, allowing additions without overriding. `_theme.less` is for overriding variables, and `_import.less` is not a standard Magento file.",
    options: [
      { id: "q-e726-027-a", text: "_theme.less", isCorrect: false },
      { id: "q-e726-027-b", text: "_extend.less", isCorrect: true },
      { id: "q-e726-027-c", text: "_import.less", isCorrect: false },
    ],
  }));

  // Q28 — Styling & LESS
  off.push(upsertQuestion({
    id: "q-e726-028", type: "SINGLE", sectionId: secStyling.id,
    text: "Which partial file contains UI library variables?",
    explanation: "`_variables.less` contains the UI library variables that control colors, fonts, spacing, and other design tokens. `_theme.less` is used for overriding these variables in child themes, and `_variable.less` (singular) is not the standard filename.",
    options: [
      { id: "q-e726-028-a", text: "_theme.less", isCorrect: false },
      { id: "q-e726-028-b", text: "_variables.less", isCorrect: true },
      { id: "q-e726-028-c", text: "_variable.less", isCorrect: false },
    ],
  }));

  // Q29 — Styling & LESS
  off.push(upsertQuestion({
    id: "q-e726-029", type: "SINGLE", sectionId: secStyling.id,
    text: "In the Blank and Luma themes, which breakpoint switches between mobile and desktop views?",
    explanation: "In the Blank and Luma themes, `@screen__m` (768px) is the breakpoint that switches between mobile and desktop views. Below this breakpoint, mobile styles apply; above it, desktop styles are used.",
    options: [
      { id: "q-e726-029-a", text: "@screen__m", isCorrect: true },
      { id: "q-e726-029-b", text: "@screen__l", isCorrect: false },
      { id: "q-e726-029-c", text: "@screen__s", isCorrect: false },
      { id: "q-e726-029-d", text: "@screen__xl", isCorrect: false },
    ],
  }));

  // Q30 — Styling & LESS
  off.push(upsertQuestion({
    id: "q-e726-030", type: "SINGLE", sectionId: secStyling.id,
    text: "An Adobe Commerce developer is in process of overriding styles in modules using .less files.\nWhat is the first step the developer should follow?",
    explanation: "When overriding module styles using LESS files in a theme, you must first create `adminhtml` and `frontend` area directories. Module LESS overrides are organized by area to ensure styles apply to the correct context.",
    options: [
      { id: "q-e726-030-a", text: "Add .less files and styles.", isCorrect: false },
      { id: "q-e726-030-b", text: "Add content type directories.", isCorrect: false },
      { id: "q-e726-030-c", text: "Create adminhtml and frontend directories.", isCorrect: true },
    ],
  }));

  // Q31 — JavaScript & Knockout
  off.push(upsertQuestion({
    id: "q-e726-031", type: "SINGLE", sectionId: secJs.id,
    text: "An Adobe Commerce developer wants to build a dependency on a third party library using RequireJS.\nWhich RequireJS configuration should be used?",
    explanation: "The RequireJS `shim` configuration is used to add dependencies to third-party libraries that don't use AMD/RequireJS module format. It defines dependencies and exports for non-AMD scripts, enabling them to work with RequireJS.",
    options: [
      { id: "q-e726-031-a", text: "deps", isCorrect: false },
      { id: "q-e726-031-b", text: "shim", isCorrect: true },
      { id: "q-e726-031-c", text: "mixins", isCorrect: false },
    ],
  }));

  // Q32 — JavaScript & Knockout
  off.push(upsertQuestion({
    id: "q-e726-032", type: "SINGLE", sectionId: secJs.id,
    text: "Which Knockout JS binding is used to translate a string according to the currently enabled locale?",
    explanation: "The Knockout.js `i18n` binding (`data-bind=\"i18n: 'example'\"`) translates a string according to the currently enabled locale. `text` simply displays text, and `translate` and `trans` are not valid KnockoutJS bindings.",
    options: [
      { id: "q-e726-032-a", text: "data-bind=\"i18n: 'example'\"", isCorrect: true },
      { id: "q-e726-032-b", text: "data-bind=\"text: 'example'\"", isCorrect: false },
      { id: "q-e726-032-c", text: "data-bind=\"translate: 'example'\"", isCorrect: false },
      { id: "q-e726-032-d", text: "data-bind=\"trans: 'example'\"", isCorrect: false },
    ],
  }));

  // Q33 — JavaScript & Knockout
  off.push(upsertQuestion({
    id: "q-e726-033", type: "SINGLE", sectionId: secJs.id,
    text: "Which two are common use cases for jQuery widgets in Adobe Commerce? (Choose two.)",
    explanation: "jQuery widgets in Adobe Commerce are commonly used for enhancing user interface elements such as accordions, tabs, modals, and sliders. They are not used for server-side data management or CSS/JS optimization.",
    options: [
      { id: "q-e726-033-a", text: "Optimizing CSS and JavaScript files for performance improvements", isCorrect: false },
      { id: "q-e726-033-b", text: "Managing server-side data for faster backend processing", isCorrect: false },
      { id: "q-e726-033-c", text: "Enhancing user interface elements", isCorrect: true },
    ],
  }));

  // Q34 — JavaScript & Knockout
  off.push(upsertQuestion({
    id: "q-e726-034", type: "SINGLE", sectionId: secJs.id,
    text: "Which Magento jQuery widget can be used to create a decision-making popup?",
    explanation: "The Confirmation widget (`$.mage.confirm` or `Magento/Ui/js/modal/confirm`) creates a decision-making popup with OK/Cancel buttons. The Alert widget only has an OK button. `Popupwindow` is not a standard Magento widget.",
    options: [
      { id: "q-e726-034-a", text: "Popupwindow widget", isCorrect: false },
      { id: "q-e726-034-b", text: "Confirmation widget", isCorrect: true },
      { id: "q-e726-034-c", text: "Alert widget", isCorrect: false },
    ],
  }));

  // Q35 — JavaScript & Knockout
  off.push(upsertQuestion({
    id: "q-e726-035", type: "MULTIPLE", sectionId: secJs.id,
    text: "Which three are correct scopes for mixins available in Adobe Commerce? (Choose three.)",
    explanation: "The three correct scopes for RequireJS mixins are `view/adminhtml`, `view/base`, and `view/frontend`. These correspond to Magento's area system. `view/backend` and `view/global` are not valid scope directories.",
    options: [
      { id: "q-e726-035-a", text: "view/adminhtml", isCorrect: true },
      { id: "q-e726-035-b", text: "view/backend", isCorrect: false },
      { id: "q-e726-035-c", text: "view/global", isCorrect: false },
      { id: "q-e726-035-d", text: "view/base", isCorrect: true },
      { id: "q-e726-035-e", text: "view/frontend", isCorrect: true },
    ],
  }));

  // Q36 — JavaScript & Knockout
  off.push(upsertQuestion({
    id: "q-e726-036", type: "SINGLE", sectionId: secJs.id,
    text: "Which event is triggered after the jQuery modal window is shown?",
    explanation: "The `opened` event is triggered after a jQuery modal window is shown. This event fires once the modal is fully visible and transitions are complete. `expanded` and `afterOpen` are not modal events in Magento's widget library.",
    options: [
      { id: "q-e726-036-a", text: "opened", isCorrect: true },
      { id: "q-e726-036-b", text: "expanded", isCorrect: false },
      { id: "q-e726-036-c", text: "afterOpen", isCorrect: false },
    ],
  }));

  // Q37 — JavaScript & Knockout
  off.push(upsertQuestion({
    id: "q-e726-037", type: "SINGLE", sectionId: secJs.id,
    text: "What is the correct way to apply a mixin to extend a JavaScript component in Adobe Commerce?",
    explanation: "Mixins in Adobe Commerce are configured in `requirejs-config.js` using the `config.mixins` object. This is the standard way to extend JavaScript components without modifying the original source files.",
    options: [
      { id: "q-e726-037-a", text: "Use a layout XML file to add the mixin within the head section of the page", isCorrect: false },
      { id: "q-e726-037-b", text: "Use the webapi.xml file to define the mixin extension", isCorrect: false },
      { id: "q-e726-037-c", text: "Add the mixin directly in the requirejs-config.js file", isCorrect: true },
      { id: "q-e726-037-d", text: "Modify the component's source file to include the mixin logic", isCorrect: false },
    ],
  }));

  // Q38 — JavaScript & Knockout
  off.push(upsertQuestion({
    id: "q-e726-038", type: "SINGLE", sectionId: secJs.id,
    text: "An Adobe Commerce developer has been asked to create a custom knockout template file named custom-component.html.\nEx: \n\n",
    explanation: "Custom Knockout template files must be placed in `Custom_Module/view/frontend/web/template/` (singular `template`, not `templates`). This is different from PHP templates which go in the `templates` (plural) directory.",
    options: [
      { id: "q-e726-038-a", text: "Custom_Module/view/frontend/web/template", isCorrect: true },
      { id: "q-e726-038-b", text: "Custom_Module/view/frontend/template", isCorrect: false },
      { id: "q-e726-038-c", text: "Custom_Module/view/frontend/templates", isCorrect: false },
      { id: "q-e726-038-d", text: "Custom_Module/view/frontend/web/js/template", isCorrect: false },
    ],
  }));

  // Q39 — JavaScript & Knockout
  off.push(upsertQuestion({
    id: "q-e726-039", type: "MULTIPLE", sectionId: secJs.id,
    text: "During the development a Frontend developer wants to use translatable text \"Add to Quote\" in the javascript code.\nWhich two are the proper ways to achieve it? (Choose two.)",
    explanation: "To use translatable text in JavaScript: (1) `$.mage.__('Add to Quote')` is the jQuery-based translation function, and (2) you can also require the `mage/translate` module and use `$translate()`. The bare `__()` function and `trans()` are not available in JavaScript.",
    options: [
      { id: "q-e726-039-a", text: "`trans('Add to Quote');\n`", isCorrect: false },
      { id: "q-e726-039-b", text: "`$.mage.__('Add to Quote');\n`", isCorrect: true },
      { id: "q-e726-039-c", text: "`__('Add to Quote');\n`", isCorrect: false },
      { id: "q-e726-039-d", text: "`define (['jquery', 'mage/translate'], function ($, $translate) {\n\n...\n$translate('Add to Quote');\n...\n\n});\n`", isCorrect: true },
    ],
  }));

  // Q40 — JavaScript & Knockout
  off.push(upsertQuestion({
    id: "q-e726-040", type: "SINGLE", sectionId: secJs.id,
    text: "Which RequireJS configuration is used to add a new dependency to a third-party library?",
    explanation: "The RequireJS `shim` configuration adds dependencies to non-AMD third-party libraries. It ensures that dependencies are loaded before the library that needs them. `paths` maps module names to file paths, `map` substitutes modules, and `deps` loads modules on page load.",
    options: [
      { id: "q-e726-040-a", text: "shim", isCorrect: true },
      { id: "q-e726-040-b", text: "paths", isCorrect: false },
      { id: "q-e726-040-c", text: "map", isCorrect: false },
      { id: "q-e726-040-d", text: "deps", isCorrect: false },
    ],
  }));

  // Q41 — JavaScript & Knockout
  off.push(upsertQuestion({
    id: "q-e726-041", type: "SINGLE", sectionId: secJs.id,
    text: "An Adobe commerce developer wants to include https://some-library.com/file.js in a custom module by using RequireJS configuration.\nWhat is the correct way to do this?",
    explanation: "When including an external library via RequireJS `paths`, omit the `.js` extension from the URL. RequireJS automatically appends `.js`. So `https://some-library.com/file` is correct, not `https://some-library.com/file.js`.",
    options: [
      { id: "q-e726-041-a", text: "`{\n    paths: {\n        \"someLibrary\": \"https://some-library.com/file.js\"\n    }\n}\n`", isCorrect: false },
      { id: "q-e726-041-b", text: "`{\n    map: {\n        \"someLibrary\": \"https://some-library.com/file.js\"\n    }\n}\n`", isCorrect: false },
      { id: "q-e726-041-c", text: "`{\n    map: {\n        \"someLibrary\": \"https://some-library.com/file\"\n    }\n}\n`", isCorrect: false },
      { id: "q-e726-041-d", text: "`{\n    paths: {\n        \"someLibrary\": \"https://some-library.com/file\"\n    }\n}\n`", isCorrect: true },
    ],
  }));

  // Q42 — JavaScript & Knockout
  off.push(upsertQuestion({
    id: "q-e726-042", type: "SINGLE", sectionId: secJs.id,
    text: "Which HTML attribute is used to reference Knockout JS on an HTML element?",
    explanation: "The `data-bind` HTML attribute is used to reference Knockout.js bindings on HTML elements. It connects the DOM element to Knockout observables and computed values. `data-invoke`, `mage-init`, and `data-mage` serve different purposes.",
    options: [
      { id: "q-e726-042-a", text: "data-bind", isCorrect: true },
      { id: "q-e726-042-b", text: "data-invoke", isCorrect: false },
      { id: "q-e726-042-c", text: "mage-init", isCorrect: false },
      { id: "q-e726-042-d", text: "data-mage", isCorrect: false },
    ],
  }));

  // Q43 — JavaScript & Knockout
  off.push(upsertQuestion({
    id: "q-e726-043", type: "SINGLE", sectionId: secJs.id,
    text: "An Adobe Commerce developer has used the following deps configuration:\ndeps: ['Vendor_Module/js/module']\nWhat will be the outcome of this action?",
    explanation: "The `deps` configuration in RequireJS causes the specified module to be loaded on all pages. When a module is listed in `deps`, RequireJS loads it as a dependency for every page, making it globally available.",
    options: [
      { id: "q-e726-043-a", text: "The custom Vendor_Module/js/module will be loaded in none of the pages.", isCorrect: false },
      { id: "q-e726-043-b", text: "The custom Vendor_Module/js/module will be loaded in all pages.", isCorrect: true },
      { id: "q-e726-043-c", text: "The custom Vendor_Module/js/module will be loaded on a single page.", isCorrect: false },
    ],
  }));

  // Q44 — Theme Setup & Design
  off.push(upsertQuestion({
    id: "q-e726-044", type: "SINGLE", sectionId: secTheme.id,
    text: "Which option in the design field set of category in Adobe Commerce Admin is used to apply custom settings to all products in the category?",
    explanation: "'Apply Design to Products' in the category's design fieldset applies the category's custom layout and design settings to all products within that category. This allows consistent product page appearance within a category.",
    options: [
      { id: "q-e726-044-a", text: "Apply Design to Products", isCorrect: true },
      { id: "q-e726-044-b", text: "Apply Data to Products", isCorrect: false },
      { id: "q-e726-044-c", text: "Apply Theme to Products", isCorrect: false },
    ],
  }));

  // Q45 — Theme Setup & Design
  off.push(upsertQuestion({
    id: "q-e726-045", type: "SINGLE", sectionId: secTheme.id,
    text: "A Frontend Developer is asked to modify the selected theme of Home Page in a specific Store View.\nHow can the developer meet this goal without affecting the rest of the Store Views?",
    explanation: "To modify the theme for the Home Page in a specific Store View, create a new CMS page from the original Home Page, select the desired theme in the design section, and assign it to the specific store view. CMS pages support per-store-view design configuration.",
    options: [
      { id: "q-e726-045-a", text: "Create a new HomePage from the original Home Page, select the theme desired in the design section, and select the Store View desired in the page in websites section", isCorrect: true },
      { id: "q-e726-045-b", text: "Modify the selected theme in the design section by using the right store scope, when editing the Home Page in Content, Pages", isCorrect: false },
      { id: "q-e726-045-c", text: "As the CMS pages can't have store view design configuration, it requires code customization", isCorrect: false },
    ],
  }));

  // Q46 — Theme Setup & Design
  off.push(upsertQuestion({
    id: "q-e726-046", type: "SINGLE", sectionId: secTheme.id,
    text: "What function is the Theme Design Rule meant for?",
    explanation: "Theme Design Rules specify alternative themes for particular user-agents (browsers/devices). This allows serving different themes based on the client's user-agent string, such as a mobile-specific theme for mobile browsers.",
    options: [
      { id: "q-e726-046-a", text: "Specify an alternative theme for particular user-agents", isCorrect: true },
      { id: "q-e726-046-b", text: "Specify an alternative theme for particular categories", isCorrect: false },
      { id: "q-e726-046-c", text: "Schedule a time in which the theme will be active", isCorrect: false },
      { id: "q-e726-046-d", text: "Specify an alternative theme for specific Customer Groups", isCorrect: false },
    ],
  }));

  // Q47 — Templates & Email
  off.push(upsertQuestion({
    id: "q-e726-047", type: "SINGLE", sectionId: secTemplates.id,
    text: "What instruction can add the email header when creating a new email template?",
    explanation: "To add the email header in a custom email template, use the `{{template config_path=\"design/email/header_template\"}}` directive. This loads the header template specified in the system configuration.",
    options: [
      { id: "q-e726-047-a", text: "{{header}}", isCorrect: false },
      { id: "q-e726-047-b", text: "{{config=\"header_template\"}}", isCorrect: false },
      { id: "q-e726-047-c", text: "{{template config_path=\"design/email/header_template\"}}", isCorrect: true },
      { id: "q-e726-047-d", text: "{{$this.getHeaderHtml()}}", isCorrect: false },
    ],
  }));

  // Q48 — Security & Architecture
  off.push(upsertQuestion({
    id: "q-e726-048", type: "SINGLE", sectionId: secSecurity.id,
    text: "What is the goal of using escapeHtml for Magento ?",
    explanation: "`escapeHtml` in Magento protects the application from code injection attacks such as Cross-Site Scripting (XSS) by converting special characters to their HTML entity equivalents, preventing malicious scripts from being executed in the browser.",
    options: [
      { id: "q-e726-048-a", text: "The goal of escapeHtml is to transforme code such as PHP to characters in HTML (such as <, >, &) and preventing any crash. This helps maintain the security of the aplication.", isCorrect: false },
      { id: "q-e726-048-b", text: "There is no true reason to use escapeHtml in Magento, because Magento already is an protect the aplication from XSS (Cross-Site Scripting). Escaping special characters in HTMLit is total unecessary, unless your are creating a new module.", isCorrect: false },
      { id: "q-e726-048-c", text: "The escapeHtml it is used in Magento to protect from cyber attacks. Always use escaping to protect the HTML, JS and PHP code. This helps maintain the security and integrity of the data presented to the user.", isCorrect: false },
      { id: "q-e726-048-d", text: "The goal of using escapeHtml in Magento is to protect the aplication from code injection attacks such as XSS (Cross-Site Scripting). Escaping special characters in HTML ensures that content is treated as text and preventing malicious scripts from being executed.", isCorrect: true },
    ],
  }));

  // Q49 — Security & Architecture
  off.push(upsertQuestion({
    id: "q-e726-049", type: "SINGLE", sectionId: secSecurity.id,
    text: "Which command in Adobe Commerce compiles all non-existent proxies and factories and pre-compiles class definitions?",
    explanation: "`magento setup:di:compile` compiles all non-existent proxies and factories and pre-compiles class definitions for dependency injection. This step is required for production deployments to optimize autoloading and DI resolution.",
    options: [
      { id: "q-e726-049-a", text: "magento setup:di:compile", isCorrect: true },
      { id: "q-e726-049-b", text: "magento compile:dependencies", isCorrect: false },
      { id: "q-e726-049-c", text: "magento setup:upgrade", isCorrect: false },
    ],
  }));

  // Q50 — Security & Architecture
  off.push(upsertQuestion({
    id: "q-e726-050", type: "MULTIPLE", sectionId: secSecurity.id,
    text: "Fastly provides services to optimize and secure content delivery operations for Adobe Commerce on cloud infrastructure projects.\nWhich two are part of the Fastly services provided? (Choose two.)",
    explanation: "Fastly provides cache management and image optimization services for Adobe Commerce Cloud. Cache management accelerates content delivery through CDN caching, and image optimization reduces image sizes for faster page loads. Product search and database monitoring are not Fastly services.",
    options: [
      { id: "q-e726-050-a", text: "Quick and advanced searches on products", isCorrect: false },
      { id: "q-e726-050-b", text: "Database query monitoring", isCorrect: false },
      { id: "q-e726-050-c", text: "Cache management", isCorrect: true },
      { id: "q-e726-050-d", text: "Image optimization", isCorrect: true },
    ],
  }));

  // ─── Practice Test ─────────────────────────────────────────────────────────

  const allQuestions = await Promise.all(off);
  console.log(`Created/updated ${allQuestions.length} questions.`);

  await prisma.practiceTestQuestion.deleteMany({
    where: { practiceTestId: "pt-official-e726" },
  });

  await prisma.practiceTest.upsert({
    where: { id: "pt-official-e726" },
    update: { questionCount: allQuestions.length },
    create: {
      id: "pt-official-e726",
      certificationId: cert.id,
      title: "Official Practice Exam",
      type: "OFFICIAL",
      questionCount: allQuestions.length,
    },
  });

  for (let i = 0; i < allQuestions.length; i++) {
    await prisma.practiceTestQuestion.create({
      data: {
        practiceTestId: "pt-official-e726",
        questionId: allQuestions[i].id,
        position: i + 1,
      },
    });
  }

  console.log(`Linked ${allQuestions.length} questions to Official Practice Exam.`);
  console.log("AD0-E726 seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
