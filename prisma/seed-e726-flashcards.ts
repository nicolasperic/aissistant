import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const flashcards = [
  {
    question: "What is the default.xml layout handle and when does it apply?",
    answer: "The default.xml layout handle applies to every single page in the storefront. It defines the foundational structure that all other page handles build upon, including global elements like header, footer, breadcrumbs, and scripts. Any block added to default.xml will appear on all pages. It is the base handle that is always active regardless of which page is being viewed.",
    hint: "This handle has the broadest scope of all layout handles — it's not page-specific.",
    topic: "Layout Handles",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 3 — Layout XML Fundamentals"
  },
  {
    question: "What is the difference between <block> and <container> in Magento 2 layout XML?",
    answer: "A <block> defines a PHP block object that renders a .phtml template and produces content. A <container> is a structural wrapper that renders no content itself — it only wraps its children in an optional HTML element (via htmlTag attribute). Containers with no htmlTag act as purely logical grouping nodes. Blocks require a class and template, while containers define structure.",
    hint: "One produces HTML output through PHP and templates, the other only provides structural wrapping.",
    topic: "Layout Elements",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 3 — Layout XML Fundamentals"
  },
  {
    question: "What happens when cacheable=\"false\" is set on any block on a page?",
    answer: "Setting cacheable=\"false\" on any single block on a page disables Full Page Cache (FPC) for the entire page, not just that block. Even if only one block out of many has this attribute, the whole page is excluded from FPC. This should be used with extreme caution. Alternatives include Varnish ESI or the private content (sections) API for per-user dynamic data.",
    hint: "The impact is much broader than you might expect — it affects the entire page's cacheability.",
    topic: "Block Caching",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 3 — Layout XML Fundamentals"
  },
  {
    question: "What does <referenceBlock> do, and what happens if the referenced block does not exist?",
    answer: "<referenceBlock> modifies an existing block that was already declared in the same or another layout file. It can add child blocks, change arguments, set display=\"false\" to hide the block, or set remove=\"true\" to remove it. If the referenced block does not exist, the instruction is silently ignored — no error is thrown.",
    hint: "This instruction targets blocks that already exist — it doesn't create new ones.",
    topic: "Layout Instructions",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 3 — Layout XML Fundamentals"
  },
  {
    question: "What is the difference between <remove> and display=\"false\" in layout XML?",
    answer: "<remove name=\"block.name\"/> permanently removes a block from the layout for that request — it's irreversible and the block cannot be re-added. Setting display=\"false\" on a <referenceBlock> hides the block from rendering but keeps it in the layout tree, so it can be re-enabled. Both result in getChildHtml() returning an empty string, but only display=\"false\" is reversible.",
    hint: "One is permanent and destructive, the other is a soft toggle that preserves the block in the tree.",
    topic: "Block Visibility",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 3 — Layout XML Fundamentals"
  },
  {
    question: "What are the five core page layouts available in Magento 2, and which additional layouts does Page Builder add?",
    answer: "The five core layouts are: empty (no header/footer), 1column, 2columns-left, 2columns-right, and 3columns. Page Builder adds cms-full-width, category-full-width, and product-full-width. There is no generic 'full-width' layout — the full-width layouts are Page Builder specific and scoped by entity type. Page layout is set via the layout attribute on the <page> root element.",
    hint: "The core layouts define column structures, and the full-width variants are module-specific, not generic.",
    topic: "Page Layouts",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 3 — Layout XML Fundamentals"
  },
  {
    question: "What values do before=\"-\" and after=\"-\" set on a block in layout XML?",
    answer: "Setting before=\"-\" positions the block first among its siblings in the parent container. Setting after=\"-\" positions the block last among its siblings. You can also use a block name (e.g., after=\"product.price.final\") to position relative to a specific sibling. If both before and after are omitted, the position is unspecified and determined by the layout engine.",
    hint: "The dash character has special meaning for extreme positioning within a container.",
    topic: "Block Positioning",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 3 — Layout XML Fundamentals"
  },
  {
    question: "Where do theme layout files go, and how does this differ from module layout file locations?",
    answer: "Theme layout files go in <theme>/Magento_Module/layout/ (e.g., app/design/frontend/Vendor/theme/Magento_Catalog/layout/catalog_product_view.xml). They are placed under a folder named after the originating module. Module layout files live at app/code/Vendor/Module/view/frontend/layout/. Theme files are processed after module files, so theme changes always take precedence.",
    hint: "Theme layout files need a module-namespace folder prefix, while module files use the view/frontend path.",
    topic: "Layout File Locations",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 3 — Layout XML Fundamentals"
  },
  {
    question: "What does the <update handle=\"\"> instruction do in layout XML?",
    answer: "The <update handle=\"\"> instruction imports all layout instructions from another handle into the current handle's scope. It merges every instruction from the specified handle as if it were written inline. This is how Magento shares layout logic across multiple page types — for example, <update handle=\"catalog_product_view_type_configurable\"/> includes configurable product-specific layout instructions.",
    hint: "Think of it as an include or import statement for layout XML instructions.",
    topic: "Layout Instructions",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 3 — Layout XML Fundamentals"
  },
  {
    question: "What happens when two blocks with the same name attribute appear in merged layout files?",
    answer: "When duplicate block names exist across merged layout files, the last declaration processed wins and the earlier one is discarded. Since theme files are processed after module files, a block defined in a theme with the same name as a module block will replace the module's block definition entirely. Block names must be unique across the entire merged layout for a request.",
    hint: "Magento processes files in a specific order, and the last definition is the one that takes effect.",
    topic: "Layout Merging",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 3 — Layout XML Fundamentals"
  },
  {
    question: "Which layout handles are active simultaneously on a product detail page (PDP)?",
    answer: "On a PDP, multiple handles are active at the same time: default (every page), catalog_product_view (all PDPs), catalog_product_view_type_simple (for simple products, or the relevant product type handle), and catalog_product_view_id_42 (product-specific handle with the product's ID). All matching XML files for these handles are merged together for that request.",
    hint: "A single page request activates the global handle, the page-type handle, the product-type handle, and an ID-specific handle.",
    topic: "Layout Handles",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 3 — Layout XML Fundamentals"
  },
  {
    question: "What is the <move> instruction used for in layout XML, and what are its required attributes?",
    answer: "The <move> instruction relocates an existing block or container to a different parent in the layout tree. It has two required attributes: element (name of the block/container to move) and destination (name of the new parent). Optional attributes include before, after (positioning), and as (new alias). The move changes the parent — it does not duplicate the element.",
    hint: "This instruction changes where an element lives in the page hierarchy without creating copies.",
    topic: "Layout Instructions",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 3 — Layout XML Fundamentals"
  },
  {
    question: "What block attributes are only available on <referenceBlock> and NOT on <block>?",
    answer: "The display and remove attributes are only available on <referenceBlock> (and <referenceContainer>), NOT on the initial <block> or <container> declaration. To hide a block after it's been defined, you must use <referenceBlock name=\"...\" display=\"false\"/>. The <block> element supports name, class, template, before, after, cacheable, as, and ifconfig — but not display or remove.",
    hint: "These control attributes that modify existing elements are specific to the reference instructions.",
    topic: "Layout Attributes",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 3 — Layout XML Fundamentals"
  },
  {
    question: "What caches need to be flushed after making layout XML changes?",
    answer: "After layout XML changes, you should flush the layout, block_html, and full_page caches using: bin/magento cache:flush layout block_html full_page. The layout cache stores the parsed layout XML tree, block_html stores rendered block fragments, and full_page stores assembled complete pages. All three need clearing to ensure layout changes take effect.",
    hint: "Three specific cache types are affected by layout changes — the layout structure, rendered fragments, and complete pages.",
    topic: "Cache Management",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 3 — Layout XML Fundamentals"
  },
  {
    question: "What is the translation priority chain in Magento 2, from highest to lowest?",
    answer: "The priority chain from highest to lowest is: 1) Database (Admin inline translation stored in the 'translation' table), 2) Theme i18n/ CSV, 3) Language Pack CSV, 4) Module i18n/ CSV. If no match is found at any level, the original source string is returned as-is. The load order in code is Module -> Pack -> Theme -> DB, but since each overwrites previous values, the effective priority is reversed.",
    hint: "The last one loaded wins. Think about which source is loaded last in the code to understand why it has the highest priority.",
    topic: "Translation Priority",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 2 — Translation & i18n"
  },
  {
    question: "What is the correct CSV format for Magento 2 translation files?",
    answer: "Translation CSV files use exactly two double-quoted columns per line: \"Original English phrase\",\"Translated phrase\". The file must be UTF-8 encoded without BOM, the filename must match the locale code exactly (e.g., en_US.csv, fr_FR.csv), and translations are case-sensitive. Internal double quotes are escaped by doubling them (e.g., \"Say \"\"Hello\"\"\").",
    hint: "Think about encoding, quoting rules, and how the filename relates to the locale.",
    topic: "Translation Format",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 2 — Translation & i18n"
  },
  {
    question: "How does the PHP translation function work in Magento 2, and what placeholder notation does it use?",
    answer: "The PHP translation function is __() (two underscores). It uses %1, %2, %3 notation (1-indexed) for placeholders, NOT %s or %d. Arguments are passed as additional parameters: __('Hello, %1!', $customerName). It is available in Block classes, Helper classes, and PHTML templates.",
    hint: "The function name is very short (just two characters), and placeholders use numbers, not format specifiers.",
    topic: "PHP Translation",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 2 — Translation & i18n"
  },
  {
    question: "How does JavaScript translation work differently from PHP translation in Magento 2?",
    answer: "JS translation uses $.mage.__('text') instead of __(), and requires the mage/translate RequireJS module. JS translations are compiled into a separate js-translation.json file during Static Content Deployment (SCD), not read from CSV directly at runtime. Changes to CSV files affecting JS strings require re-running SCD to regenerate js-translation.json.",
    hint: "JS has its own translation function, its own dictionary file format, and requires a build step to update.",
    topic: "JS Translation",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 2 — Translation & i18n"
  },
  {
    question: "Where do language pack CSV files live, and how does this differ from module and theme translation files?",
    answer: "Language pack CSV files live at the root of the package directory (e.g., vendor/acme/language-fr-fr/fr_FR.csv), NOT in an i18n/ subdirectory. This is different from module translations (app/code/Vendor/Module/i18n/LL_CC.csv) and theme translations (app/design/frontend/Vendor/Theme/i18n/LL_CC.csv), which both use an i18n/ subdirectory.",
    hint: "Language packs place their CSV files differently than modules and themes — at the package root level.",
    topic: "Language Packs",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 2 — Translation & i18n"
  },
  {
    question: "What are the three required files in a Magento 2 language pack, and what Composer type must it use?",
    answer: "A language pack must contain: 1) registration.php (registers the component with ComponentRegistrar::LANGUAGE), 2) language.xml (declares locale code, vendor, package, sort order, and optional inheritance via <use> tag), and 3) the locale CSV file (e.g., fr_FR.csv) at the package root. The Composer type must be 'magento2-language'.",
    hint: "Similar to themes, language packs need registration and declaration files, plus their translation data.",
    topic: "Language Packs",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 2 — Translation & i18n"
  },
  {
    question: "What CLI command collects all translatable strings from a Magento codebase, and what does it scan?",
    answer: "The command is bin/magento i18n:collect-phrases -o <output_file> <directory>. It scans PHP files for __('text'), PHTML templates for __('text'), JavaScript files for $.mage.__('text'), and XML layout files for translate=\"true\" attributes. The output is a CSV with the source string in both columns. Use --magento/-m flag to scan the entire installation instead of specifying a directory.",
    hint: "This command extracts phrases from four different file types across the codebase.",
    topic: "Translation CLI",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 2 — Translation & i18n"
  },
  {
    question: "Where is inline translation enabled in the Magento Admin, and where are the overrides stored?",
    answer: "Inline translation is enabled at Stores > Configuration > Advanced > Developer > Translate Inline. This setting is store view scoped, so you must select the correct store view before enabling. Overrides are stored in the 'translation' database table (not in any CSV file) and have the highest priority in the translation chain, overriding all file-based translations.",
    hint: "It's under the Developer section of configuration, and its storage mechanism is different from file-based translations.",
    topic: "Inline Translation",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 2 — Translation & i18n"
  },
  {
    question: "What is js-translation.json, where is it located, and when is it generated?",
    answer: "js-translation.json is a JSON dictionary file containing all translated strings used by JavaScript. It's located at pub/static/frontend/Vendor/Theme/locale/js-translation.json. It is generated during Static Content Deployment (SCD) by reading all translation CSVs. At runtime, the mage/translate module loads this dictionary, and $.mage.__() performs lookups against it.",
    hint: "This file bridges the gap between CSV-based translations and JavaScript's runtime needs.",
    topic: "JS Translation",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 2 — Translation & i18n"
  },
  {
    question: "What cache must be cleared after editing a theme i18n CSV file, and what additional step is needed for JS strings?",
    answer: "After editing a theme i18n CSV, you must clear the translation cache with bin/magento cache:clean translate. For PHP translations in developer mode, this is sufficient. However, if any modified strings are used in JavaScript files, you must also re-run setup:static-content:deploy to regenerate js-translation.json, regardless of the deployment mode.",
    hint: "There are two types of cache clearing needed — one for server-side translations and an additional build step for client-side translations.",
    topic: "Translation Cache",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 2 — Translation & i18n"
  },
  {
    question: "What is the difference between i18n:collect-phrases and i18n:pack CLI commands?",
    answer: "i18n:collect-phrases scans the codebase and extracts all translatable strings into a CSV file (finding strings). i18n:pack takes an existing translation CSV and packages it into a language pack directory structure with registration.php and composer.json stubs. They serve complementary purposes: collect finds strings to translate, pack organizes completed translations for distribution.",
    hint: "One discovers what needs translating, the other structures completed translations for deployment.",
    topic: "Translation CLI",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 2 — Translation & i18n"
  },
  {
    question: "How does the mage/translate RequireJS module make translations available to JavaScript code?",
    answer: "The mage/translate module depends on mageTranslationDictionary, which is mapped to Magento_Translation/js/mage-translation-dictionary in the Magento_Translation module's requirejs-config.js. This dictionary module loads js-translation.json via the RequireJS text! plugin. The module returns $.mage.__ as its default export, so you can alias it (e.g., $t) when using require(['mage/translate'], function($t) {...}).",
    hint: "It works through a chain: a RequireJS module loads a dictionary, which in turn loads a JSON file generated during deployment.",
    topic: "JS Translation",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 2 — Translation & i18n"
  },
  {
    question: "How does the <use> tag work in a language pack's language.xml?",
    answer: "The <use> tag enables language pack inheritance, allowing a child language pack to fall back to a parent pack for strings it doesn't define. The syntax is <use vendor=\"magento\" package=\"language-fr-fr\"/>. Strings not found in the child pack automatically fall through to the parent pack, avoiding the need to duplicate all translations.",
    hint: "Similar to theme inheritance, language packs can inherit from other packs for missing translations.",
    topic: "Language Packs",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 2 — Translation & i18n"
  },
  {
    question: "Why does the effective translation priority appear reversed from the code load order?",
    answer: "In Translate::loadData(), translations are loaded in order: Module -> Pack -> Theme -> DB. Each subsequent call overwrites previous values for the same key, so the last one loaded wins. Since DB translations are loaded last, they have the highest effective priority. This overwrite mechanism is why the effective priority (DB > Theme > Pack > Module) is the reverse of the load order.",
    hint: "Think about what happens when you assign a variable multiple times — the last assignment is what sticks.",
    topic: "Translation Priority",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 2 — Translation & i18n"
  },
  {
    question: "What is the correct directory path for a custom Magento 2 theme?",
    answer: "Custom themes live under app/design/frontend/Vendor/theme_name/. The path follows the pattern area/Vendor/theme_name. For example, a theme called 'mytheme' by vendor 'Acme' would be at app/design/frontend/Acme/mytheme/.",
    hint: "Think about the directory structure under app/design/ and which area frontend themes belong to.",
    topic: "Theme Structure",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 1 — Theme Structure & Inheritance"
  },
  {
    question: "What two files are required at minimum to register a Magento 2 theme?",
    answer: "The two required files are theme.xml (which declares the theme name, parent theme, and preview image) and registration.php (which registers the theme as a Magento component using ComponentRegistrar::register()). Without registration.php, the theme will not appear in Admin > Content > Design > Themes.",
    hint: "One file declares metadata, the other makes the framework aware of the theme's existence.",
    topic: "Theme Registration",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 1 — Theme Structure & Inheritance"
  },
  {
    question: "What is the correct format for the <parent> element value in theme.xml?",
    answer: "The format is Vendor/theme_name, matching the directory structure under app/design/frontend/. For example, <parent>Magento/luma</parent>. Using backslashes, full filesystem paths, or Composer package names are all incorrect formats.",
    hint: "It mirrors the folder names directly under the frontend design directory.",
    topic: "Theme Inheritance",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 1 — Theme Structure & Inheritance"
  },
  {
    question: "What is the theme fallback chain for static web assets in Magento 2?",
    answer: "The fallback chain for static assets is: Custom Theme web/ -> Parent Theme web/ -> Grandparent Theme (Blank) web/ -> lib/web/. Magento walks this hierarchy until the file is found. The lib/web directory (containing jQuery, RequireJS, etc.) is only in the fallback for static assets, NOT for templates or layout XML.",
    hint: "Think about the chain from most specific to most generic, ending at the global library directory.",
    topic: "Theme Fallback",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 1 — Theme Structure & Inheritance"
  },
  {
    question: "How do layout XML files and template (.phtml) files differ in how they handle theme overrides?",
    answer: "Layout XML files in themes are merged with module layout XML — both files apply, with theme instructions processed after module instructions. Template (.phtml) files in themes fully replace the module version — only the theme copy is used, with no merging. This is a critical distinction for understanding override behavior.",
    hint: "One type combines instructions from multiple sources, while the other uses a first-match-wins approach.",
    topic: "Theme Overrides",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 1 — Theme Structure & Inheritance"
  },
  {
    question: "What is the correct directory naming convention for overriding a module's templates in a theme?",
    answer: "The directory must use the full module name with underscore notation: Magento_Catalog/templates/, not just Catalog/templates/. The format is Vendor_Module. For example, to override Magento_Catalog templates, place files under app/design/frontend/Vendor/theme/Magento_Catalog/templates/.",
    hint: "The folder name includes both the vendor and module name joined by an underscore.",
    topic: "Module Overrides",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 1 — Theme Structure & Inheritance"
  },
  {
    question: "What does the etc/view.xml file define in a Magento 2 theme, and how does it handle inheritance?",
    answer: "The etc/view.xml file defines image dimension presets used by the catalog (e.g., product_page_image_medium at 700x700, category_page_grid at 240x300). Unlike layout XML, view.xml is NOT merged — a child theme's view.xml completely replaces the parent's. If you create a view.xml in your theme, you must include ALL image configurations, not just the ones you're changing.",
    hint: "This file controls product image sizes and behaves differently from layout XML regarding parent-child relationships.",
    topic: "Image Configuration",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 1 — Theme Structure & Inheritance"
  },
  {
    question: "Why should you never edit files directly in pub/static/?",
    answer: "The pub/static/ directory is a build artifact containing deployed/symlinked theme assets, compiled LESS to CSS, and merged JS files. Any changes made directly to files in pub/static/ are overwritten on the next setup:static-content:deploy, cache flush in developer mode, or setup:upgrade. Source files should be edited in app/design/ or app/code/ instead.",
    hint: "This directory is populated automatically through build processes, not manual edits.",
    topic: "Static Content",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 1 — Theme Structure & Inheritance"
  },
  {
    question: "What is the second argument format for ComponentRegistrar::register() when registering a theme?",
    answer: "The format is area/Vendor/theme_name, for example 'frontend/Acme/mytheme'. The area prefix (frontend or adminhtml) is required. Omitting the area prefix (e.g., just 'Acme/mytheme') will cause the registration to fail and the theme will not appear in the Admin panel.",
    hint: "Unlike theme.xml's <parent> element, this registration path needs an additional prefix.",
    topic: "Theme Registration",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 1 — Theme Structure & Inheritance"
  },
  {
    question: "What is the relationship between Magento/blank and Magento/luma themes?",
    answer: "Magento/blank is the base theme with no parent — it provides core layout XML, essential LESS variables, and default view.xml image sizes. Magento/luma extends Magento/blank (declares it as parent in theme.xml) and adds a full design system with enhanced templates and a complete LESS stylesheet system. Both are located in vendor/magento/ and should never be modified directly.",
    hint: "One is the minimal foundation, the other builds a complete storefront on top of it.",
    topic: "Core Themes",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 1 — Theme Structure & Inheritance"
  },
  {
    question: "What is the translation priority order for theme-level i18n CSV files relative to other translation sources?",
    answer: "The priority order from highest to lowest is: 1) Database (inline translation), 2) Theme i18n/ CSV, 3) Module i18n/ CSV, 4) lib/web/i18n/ CSV. Theme-level translations override module-level translations for the same string, making theme i18n/en_US.csv the correct way to override module strings without modifying module files.",
    hint: "The database always wins, but within file-based translations, the theme sits above the module level.",
    topic: "Translation Priority",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 1 — Theme Structure & Inheritance"
  },
  {
    question: "How are static files populated in pub/static/ in developer mode versus production mode?",
    answer: "In developer mode, files are symlinked or copied on first request (causing a slow first page load). In production mode, files are compiled and copied by running bin/magento setup:static-content:deploy, which reads from app/design/ and app/code/ to populate pub/static/.",
    hint: "One mode is on-demand per request, the other requires an explicit CLI command.",
    topic: "Static Content Deployment",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 1 — Theme Structure & Inheritance"
  },
  {
    question: "What CLI command is used to deploy static content for a specific theme only?",
    answer: "The command is: bin/magento setup:static-content:deploy en_US --theme Vendor/mytheme -f. The --theme flag limits deployment to the specified theme. The -f flag forces deployment even in developer mode. This command reads from app/design/ and app/code/, NOT from pub/static/.",
    hint: "It's the static content deploy command with a flag to scope it to one theme.",
    topic: "CLI Commands",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 1 — Theme Structure & Inheritance"
  },
  {
    question: "Where do module-scoped web assets (JS/CSS/images) live within a theme, as opposed to global theme assets?",
    answer: "Module-scoped web assets live under Magento_ModuleName/web/ inside the theme directory (e.g., Magento_Catalog/web/js/product-gallery.js). Global theme assets live directly under the theme's root web/ directory (e.g., web/css/, web/images/). This distinction is important for the static file fallback resolution.",
    hint: "One path includes the module name folder, the other sits directly under the theme's web directory.",
    topic: "Static Asset Organization",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 1 — Theme Structure & Inheritance"
  },
  {
    question: "What are the two LESS files commonly used for theme customization and what is each file's purpose?",
    answer: "_theme.less (located at web/css/source/_theme.less) is used to override LESS variables like colors, fonts, and spacing inherited from parent themes. _extend.less is used for add-on styles that are automatically picked up by @magento_import. The _theme.less file controls variable-based customization while _extend.less adds new style rules.",
    hint: "One overrides variables from the parent theme, the other extends with new CSS rules.",
    topic: "LESS Customization",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 1 — Theme Structure & Inheritance"
  },
  {
    question: "What is the correct directory path for overriding a module template in a Magento 2 theme?",
    answer: "To override a module template, copy it to app/design/frontend/Vendor/Theme/Magento_Module/templates/path/to/file.phtml. The view/frontend/ portion from the module path is NOT included in the theme path — the theme path starts directly at templates/. For example, vendor/magento/module-catalog/view/frontend/templates/product/view.phtml becomes Magento_Catalog/templates/product/view.phtml in the theme.",
    hint: "The theme path drops the view/frontend/ segment that exists in the module's structure.",
    topic: "Template Overrides",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 5 — phtml Templates: Creation, Customization & Security"
  },
  {
    question: "What is the difference between $block and $this in a Magento 2 phtml template?",
    answer: "$block is the actual block instance (e.g., Magento\\Catalog\\Block\\Product\\View) and is the correct variable to use in Magento 2. $this refers to the template engine (Magento\\Framework\\View\\TemplateEngine\\Php), not the block. However, $this works for block methods because Php::__call() proxies method calls to the current block. $this also has engine-specific methods like $this->helper() that are NOT available on $block.",
    hint: "One is the recommended approach pointing to the block instance, the other is the template engine with a proxy mechanism.",
    topic: "Template API",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 5 — phtml Templates: Creation, Customization & Security"
  },
  {
    question: "What are the five output escaping methods available in Magento 2 templates, and when should each be used?",
    answer: "The five methods are: escapeHtml() for text content inside HTML tags, escapeHtmlAttr() for HTML attribute values, escapeUrl() for URLs in href/src/action attributes, escapeJs() for strings inside JavaScript string literals, and escapeCss() for values inside CSS contexts. Using the wrong method for the context can leave XSS vulnerabilities or cause incorrect rendering.",
    hint: "Each method corresponds to a specific output context in HTML — tag content, attributes, URLs, scripts, and styles.",
    topic: "Output Escaping",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 5 — phtml Templates: Creation, Customization & Security"
  },
  {
    question: "Why is it wrong to use escapeHtml() on product descriptions that contain HTML markup?",
    answer: "escapeHtml() encodes ALL HTML entities, converting tags like <p> to &lt;p&gt;. When used on HTML content (like product descriptions), it displays the raw HTML tags as visible text instead of rendering them. For content that should render as HTML, either don't escape (if the source is trusted), or use escapeHtml() with an allowed tags array: $block->escapeHtml($content, ['p', 'br', 'strong', 'em']).",
    hint: "This method treats HTML tags as text to display, not as markup to render.",
    topic: "Output Escaping",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 5 — phtml Templates: Creation, Customization & Security"
  },
  {
    question: "Does overriding a template in a theme require any layout XML configuration?",
    answer: "No, template overrides in a theme do NOT require any layout XML changes. Simply copying the template file to the matching path in your theme directory is sufficient — Magento's file fallback system automatically picks the theme template over the module template. However, if you want to assign a completely different template file (not just override), you would use the template attribute on <referenceBlock> in layout XML.",
    hint: "The fallback mechanism handles it based on file placement alone — no XML declaration needed.",
    topic: "Template Overrides",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 5 — phtml Templates: Creation, Customization & Security"
  },
  {
    question: "What does escapeUrl() actually do, and what does it NOT do?",
    answer: "escapeUrl() strips dangerous protocols (javascript:, vbscript:, data:) using escapeScriptIdentifiers(), then passes the result through escapeHtml() to encode special characters. It does NOT validate whether the URL points to a safe or valid destination — a URL like http://malicious-site.com/steal will pass through safely encoded but still link to the malicious site. URL validation/whitelisting is a separate concern from escaping.",
    hint: "It sanitizes the URL string for safe embedding but doesn't verify the destination.",
    topic: "Output Escaping",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 5 — phtml Templates: Creation, Customization & Security"
  },
  {
    question: "How do you enable template hints via the CLI, and what do they display?",
    answer: "Run bin/magento dev:template-hints:enable followed by bin/magento cache:flush. Template hints display overlays on the storefront showing the file path of each phtml template being rendered and (optionally) the block class responsible. This command accepts no options — it always saves to the default scope. To scope hints to a specific store view, use the Admin UI or bin/magento config:set.",
    hint: "The CLI command is simple with no flags, and it requires a cache flush to take effect.",
    topic: "Template Debugging",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 5 — phtml Templates: Creation, Customization & Security"
  },
  {
    question: "What is the template identifier format used in Magento 2 layout XML?",
    answer: "The format is ModuleName::relative/path/from/templates/directory.phtml. For example, Magento_Catalog::product/view.phtml resolves to vendor/magento/module-catalog/view/frontend/templates/product/view.phtml (or the theme override if it exists). The :: notation maps the module name to the view/frontend/templates/ directory automatically.",
    hint: "The double-colon separates the module name from the relative template path.",
    topic: "Template Format",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 5 — phtml Templates: Creation, Customization & Security"
  },
  {
    question: "How does the ViewModel pattern access work in a phtml template, and why does getViewModel() work?",
    answer: "In the template, you access the ViewModel with $block->getViewModel() or $block->getData('view_model'). The magic getter getViewModel() works because Magento's DataObject base class generates get methods that map to getData() calls — getViewModel() translates to getData('view_model'). For this to work, the argument must be named 'view_model' (with underscore) in the layout XML.",
    hint: "The magic getter mechanism converts camelCase method names to underscore-separated data keys.",
    topic: "ViewModel Access",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 5 — phtml Templates: Creation, Customization & Security"
  },
  {
    question: "What is the /* @noEscape */ comment annotation used for in Magento 2 templates?",
    answer: "/* @noEscape */ is a PHPCS (static code analysis) annotation that suppresses the 'output not escaped' warning. It is a documentation/linting annotation only — it provides zero actual security and does not escape or protect anything. The developer is asserting that the content is already safe or pre-sanitized. It should be used carefully and only when the output source is trusted.",
    hint: "This is for the code analysis tool, not for the browser or PHP runtime.",
    topic: "Template Security",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 5 — phtml Templates: Creation, Customization & Security"
  },
  {
    question: "What is the correct approach for changing a block's template to a different file (not just overriding the same path)?",
    answer: "Use the template attribute on <referenceBlock> in layout XML: <referenceBlock name=\"product.info\" template=\"Magento_Catalog::product/custom_view.phtml\"/>. The older <action method=\"setTemplate\"> pattern is deprecated and should not be used. This approach assigns a completely different template file to an existing block, rather than overriding the same-path template in the theme.",
    hint: "A layout XML attribute on the reference instruction handles this — no deprecated action method needed.",
    topic: "Template Assignment",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 5 — phtml Templates: Creation, Customization & Security"
  },
  {
    question: "When using escapeHtmlAttr() versus escapeHtml(), what is the key difference in usage context?",
    answer: "escapeHtml() is for text content inside HTML tags (e.g., <p><?= $block->escapeHtml($name) ?></p>). escapeHtmlAttr() is for values inside HTML attribute quotes (e.g., class, data-*, title, alt attributes). escapeHtmlAttr() provides stricter encoding appropriate for the attribute context, handling single quotes and characters that can break out of attribute values. Using escapeHtml() for attributes is technically less secure.",
    hint: "The context determines which method to use — content between tags versus values inside attribute quotes.",
    topic: "Output Escaping",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 5 — phtml Templates: Creation, Customization & Security"
  },
  {
    question: "What is the template fallback resolution order in Magento 2?",
    answer: "The fallback order is: 1) Theme (child) — app/design/frontend/Vendor/theme/Magento_Module/templates/, 2) Theme (parent) — walks up the theme hierarchy, 3) Module — app/code/Vendor/Module/view/frontend/templates/. The first match wins, meaning the theme copy completely replaces the module original with no merging. This is different from layout XML which merges across the chain.",
    hint: "Templates use a first-match-wins approach, starting from the most specific theme.",
    topic: "Template Fallback",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 5 — phtml Templates: Creation, Customization & Security"
  },
  {
    question: "What is the difference between extending and overriding a layout file in Magento 2?",
    answer: "Extending adds new XML instructions to an existing layout handle — files in the standard layout/ directory are automatically merged with the original, preserving all original instructions. Overriding completely replaces the original file — only your override file is used. Override files go in the special layout/override/base/ directory and are a theme-only capability (modules cannot override). Extending is always preferred because core upgrades still apply.",
    hint: "One adds to the existing instructions, the other replaces them entirely. The file location signals which approach is used.",
    topic: "Layout Extending vs Overriding",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 4 — Layout XML Advanced: Extending vs Overriding"
  },
  {
    question: "What is the correct directory path to override a module's layout file from a theme?",
    answer: "To override a module layout file: <theme_dir>/<Namespace_Module>/layout/override/base/<filename>.xml. To override a parent theme's layout file: <theme_dir>/<Namespace_Module>/layout/override/theme/<Vendor>/<ParentTheme>/<filename>.xml. These are the only two override subdirectory types. Modules cannot use the override/ directory — only themes can.",
    hint: "The key directory is override/, with two possible subdirectories depending on whether you're overriding a module or parent theme file.",
    topic: "Layout Override Paths",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 4 — Layout XML Advanced: Extending vs Overriding"
  },
  {
    question: "Why is layout extending preferred over overriding, and what is the main risk of overriding?",
    answer: "Extending is preferred because original instructions are preserved and core upgrades still apply to the base layout files. When you override a layout file, you become responsible for ALL its content — Magento core upgrades that patch the original file will have no effect on your store. This can result in missing features, security gaps, and potential errors after upgrades.",
    hint: "Think about what happens during a Magento version upgrade when the original file has been patched.",
    topic: "Layout Best Practices",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 4 — Layout XML Advanced: Extending vs Overriding"
  },
  {
    question: "What is the layout file resolution order from highest to lowest priority?",
    answer: "The resolution order is: 1) Theme override/base/ (highest, replaces entire file), 2) Theme layout/ extension (merged after module files), 3) Parent theme layout/ extension (merged), 4) Module view/frontend/layout/ (base, lowest priority). Theme extension files have higher precedence than module files even without using the override/ directory, because they are processed later in the merge sequence.",
    hint: "Override always wins, then theme extensions beat module files due to processing order.",
    topic: "Layout Resolution",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 4 — Layout XML Advanced: Extending vs Overriding"
  },
  {
    question: "How do page layout overrides differ from regular layout overrides in terms of directory paths?",
    answer: "Page layout overrides use page_layout/override/base/ instead of layout/override/base/. For example: <theme>/Magento_Theme/page_layout/override/base/1column.xml. Using layout/override/base/ for page layouts is incorrect. This mirrors the regular override pattern but uses the page_layout/ directory since page layouts define structural skeletons (columns), not page content.",
    hint: "The directory name changes to match the type of layout file being overridden.",
    topic: "Page Layout Overrides",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 4 — Layout XML Advanced: Extending vs Overriding"
  },
  {
    question: "What is a ViewModel in Magento 2, and what interface must it implement?",
    answer: "A ViewModel is a PHP class that provides data and logic to a template without extending AbstractBlock. It must implement Magento\\Framework\\View\\Element\\Block\\ArgumentInterface, which is a marker interface with no methods to implement. ViewModels are injected via layout XML arguments using xsi:type=\"object\" and are the modern, recommended approach for separating display logic from block classes.",
    hint: "It implements a marker interface from the Block namespace and is injected through XML, not PHP.",
    topic: "ViewModel Pattern",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 4 — Layout XML Advanced: Extending vs Overriding"
  },
  {
    question: "How is a ViewModel injected into a block via layout XML?",
    answer: "A ViewModel is injected as an argument with xsi:type=\"object\" inside the block's <arguments> element. The value is the fully qualified class name (FQCN). Example: <argument name=\"view_model\" xsi:type=\"object\">Vendor\\Module\\ViewModel\\MyClass</argument>. The xsi:type=\"object\" tells Magento to instantiate the class via the DI container. In the template, access it with $block->getData('view_model') or $block->getViewModel().",
    hint: "The key is the xsi:type attribute value and the argument name convention.",
    topic: "ViewModel Injection",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 4 — Layout XML Advanced: Extending vs Overriding"
  },
  {
    question: "What are the nine argument xsi:type values available in Magento 2 layout XML?",
    answer: "The nine types are: string (plain text), boolean (true/false), number (int/float), object (class FQCN instantiated via DI), array (contains <item> children), null (null value), url (route/action path), helper (helper class method call), and options (source model class implementing OptionSourceInterface). These are registered in app/etc/di.xml under the layoutArgumentReaderInterpreter composite.",
    hint: "There are nine types total, covering primitive values, class instances, and special Magento-specific types.",
    topic: "Layout Arguments",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 4 — Layout XML Advanced: Extending vs Overriding"
  },
  {
    question: "Can modules use the layout override/ directory to override other modules' layout files?",
    answer: "No, layout overrides are a theme-only feature. Modules cannot use the override/ directory — they can only extend (add to) layout instructions by placing files in their own view/frontend/layout/ directory with the same handle filename. Only themes can completely replace a layout file using the override/base/ or override/theme/ subdirectories.",
    hint: "This is a capability reserved for themes, not modules. Modules can only add instructions.",
    topic: "Layout Override Rules",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 4 — Layout XML Advanced: Extending vs Overriding"
  },
  {
    question: "Where do the core page layout files (empty.xml, 1column.xml, etc.) live in Magento 2?",
    answer: "empty.xml lives in Magento_Theme module's view/base/page_layout/ directory. The four column layouts (1column.xml, 2columns-left.xml, 2columns-right.xml, 3columns.xml) live in view/frontend/page_layout/. The column layouts extend empty.xml using <update handle=\"empty\"/> to inherit the base skeleton, then add their specific container structures.",
    hint: "One layout is shared across areas (in view/base/), while the column-specific layouts are frontend-only.",
    topic: "Page Layout Files",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 4 — Layout XML Advanced: Extending vs Overriding"
  },
  {
    question: "What is the difference between page layout, page configuration, and generic layout file types?",
    answer: "Page Layout files (like 1column.xml, 2columns-left.xml) define only the structural column skeleton of a page. Page Configuration files (like catalog_product_view.xml) define the full page content including head and body elements. Generic Layout files (like default.xml in some contexts) provide reusable layout fragments. Page layouts use page_layout.xsd schema, while page configurations use page_configuration.xsd.",
    hint: "Each type serves a different level of the page definition — structure, content, or reusable fragments.",
    topic: "Layout File Types",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 4 — Layout XML Advanced: Extending vs Overriding"
  },
  {
    question: "What happens if you omit the xsi:type=\"object\" attribute when defining a ViewModel argument in layout XML?",
    answer: "Without xsi:type=\"object\", Magento will not know to instantiate the class via the DI container. The value will be treated as a plain string containing the class name text, not an actual object instance. This results in a silent failure — the template will receive a string instead of a ViewModel object, and calling methods on it will cause errors. This is a common exam trap.",
    hint: "The type attribute tells Magento HOW to process the argument value — without it, no instantiation occurs.",
    topic: "ViewModel Injection",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 4 — Layout XML Advanced: Extending vs Overriding"
  },
  {
    question: "How does a theme extension file (not in override/) still take precedence over a module's layout file?",
    answer: "Theme extension files in <theme>/Magento_Module/layout/ are processed after module layout files in the merge sequence. Since later instructions can modify or undo earlier ones (e.g., using <referenceBlock remove=\"true\"/>), the theme's extension effectively has higher precedence. The difference from override is that extension files add instructions to the merged result, while override files replace the entire file.",
    hint: "Processing order matters — theme files come after module files in the merge chain.",
    topic: "Layout Precedence",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 4 — Layout XML Advanced: Extending vs Overriding"
  },
  {
    question: "What is the default page layout set in Magento's default.xml handle?",
    answer: "The module-level default.xml (in vendor/magento/module-theme/view/frontend/layout/) sets layout=\"3columns\" on the <page> root element. This means all pages default to a three-column layout unless a more specific handle overrides this setting. Individual page types (like product pages or checkout) typically override this with their own layout attribute.",
    hint: "The default is wider than you might expect — it includes both sidebars.",
    topic: "Default Layout",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 4 — Layout XML Advanced: Extending vs Overriding"
  },
  {
    question: "What is the Magento 2 block class hierarchy, and what does each level provide?",
    answer: "The hierarchy is: DataObject (magic getters/setters via __call()) -> AbstractBlock (layout integration, caching, child blocks; implements BlockInterface) -> Template (adds phtml template rendering via _toHtml()). Custom blocks extend Template or its subclasses. AbstractBlock alone has no concept of a template file — that capability comes from Template. Every block rendering a .phtml file must extend Template.",
    hint: "Three levels, each adding capabilities: data access, layout management, and template rendering.",
    topic: "Block Hierarchy",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 6 — Block Architecture & ViewModel Pattern"
  },
  {
    question: "What is the difference between _prepareLayout(), _beforeToHtml(), and _toHtml() in Magento 2 blocks?",
    answer: "_prepareLayout() fires after the layout XML tree is fully built — safe to call getLayout() and set page titles/breadcrumbs. _beforeToHtml() fires just before rendering starts (inside _loadCache()). _toHtml() is the protected method that produces the actual HTML output. The public entry point is toHtml(), which dispatches events, handles caching, and calls _afterToHtml(). Always call parent::_prepareLayout() first.",
    hint: "They fire at different stages: after layout build, before rendering, and during rendering.",
    topic: "Block Lifecycle",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 6 — Block Architecture & ViewModel Pattern"
  },
  {
    question: "How does getChildHtml() work, and what is the difference between using the alias versus the block name?",
    answer: "getChildHtml() renders a child block using its alias (the 'as' attribute in layout XML), NOT the block name. If the 'as' attribute is omitted, the alias defaults to the name value. Calling getChildHtml('') with an empty string renders ALL direct children. getChildChildHtml($alias) renders grandchildren (children of the specified child) — not the same as getChildHtml().",
    hint: "The parameter refers to the 'as' attribute, not the 'name' attribute — a common exam trap.",
    topic: "Child Blocks",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 6 — Block Architecture & ViewModel Pattern"
  },
  {
    question: "What does getCacheLifetime() return by default, and what values mean 'not cached'?",
    answer: "By default, getCacheLifetime() returns null, meaning the block is NOT cached — blocks must explicitly opt in to caching. Both null and 0 mean the block is not cached: null causes _loadCache() to bypass caching entirely, while 0 causes _saveCache() to return false. Only a positive integer enables caching (e.g., 3600 for one hour). This method is protected, not public.",
    hint: "Blocks are uncached by default. Two different return values both result in no caching, but for different reasons.",
    topic: "Block Caching",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 6 — Block Architecture & ViewModel Pattern"
  },
  {
    question: "What is the difference between getCacheKey() and getCacheKeyInfo() for block caching?",
    answer: "getCacheKey() returns a manual string key for the cache entry — it's less preferred because it's less composable. getCacheKeyInfo() returns an array of key parts that Magento sha256-hashes internally to produce the final key — this is the preferred approach. When using getCacheKeyInfo(), you should merge with parent::getCacheKeyInfo() to include the block name and other base key parts.",
    hint: "One returns a final string, the other returns parts that get hashed together — the latter is more flexible.",
    topic: "Block Caching",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 6 — Block Architecture & ViewModel Pattern"
  },
  {
    question: "What is the difference between block_html and full_page cache types in Magento 2?",
    answer: "block_html caches individual block HTML fragments and uses getIdentities() tags for invalidation. full_page (FPC) caches entire HTTP responses and uses entity save events for invalidation. They are two separate cache systems — flushing FPC does NOT flush block_html, and vice versa. A block implementing IdentityInterface participates in both caching systems. Both must be flushed independently.",
    hint: "One caches fragments, the other caches complete pages — they operate independently.",
    topic: "Cache Types",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 6 — Block Architecture & ViewModel Pattern"
  },
  {
    question: "What interface must a block implement to participate in tag-based cache invalidation, and what method does it require?",
    answer: "The block must implement Magento\\Framework\\DataObject\\IdentityInterface, which requires the getIdentities() method. This method returns an array of cache tags (e.g., ['cat_p_42', 'cat_c']). When an entity is saved, Magento invalidates all blocks tagged with that entity's tag. getIdentities() is NOT a method on AbstractBlock — you must explicitly implement the interface.",
    hint: "This interface is from the DataObject namespace, not the View namespace, and has a single required method.",
    topic: "Cache Invalidation",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 6 — Block Architecture & ViewModel Pattern"
  },
  {
    question: "Why is the ViewModel pattern preferred over putting business logic in Block classes?",
    answer: "ViewModels keep block constructors minimal (only Context needed), making blocks easier to override via plugins/preferences. Business logic in blocks cannot be cleanly unit tested without rendering context, while ViewModels are plain PHP classes fully testable with PHPUnit without Magento bootstrap. ViewModels use normal constructor DI and separate data retrieval from rendering concerns. This has been the Magento recommended approach since Magento 2.2.",
    hint: "Think about testability, constructor signatures, and separation of concerns.",
    topic: "ViewModel Benefits",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 6 — Block Architecture & ViewModel Pattern"
  },
  {
    question: "What is ArgumentInterface, where is its full namespace, and what methods does it define?",
    answer: "ArgumentInterface is located at Magento\\Framework\\View\\Element\\Block\\ArgumentInterface. It is a marker interface with zero methods — it has no methods to implement. It exists purely as a type marker for the DI system so that classes can be properly injected as xsi:type=\"object\" block arguments in layout XML. Without implementing it, a ViewModel cannot be correctly injected as a block argument.",
    hint: "It's in the View\\Element\\Block namespace, and despite being required, it defines nothing to implement.",
    topic: "ViewModel Interface",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 6 — Block Architecture & ViewModel Pattern"
  },
  {
    question: "What is the correct block class to use when no custom PHP logic is needed, and a ViewModel provides all the data?",
    answer: "Use Magento\\Framework\\View\\Element\\Template as the block class. This is the base template block that provides phtml rendering without any custom business logic. Combined with a ViewModel injected via layout XML, it gives the template access to data through $block->getViewModel() while keeping the block completely generic. There's no need to create a custom block class in this pattern.",
    hint: "The framework provides a generic template block class that pairs perfectly with ViewModels.",
    topic: "Block Classes",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 6 — Block Architecture & ViewModel Pattern"
  },
  {
    question: "What is the block rendering lifecycle in Magento 2, from layout parsing to HTML output?",
    answer: "The lifecycle is: 1) Layout XML parsed and block objects instantiated via DI, 2) _prepareLayout() called on each block, 3) toHtml() triggered by parent or layout output, 4) Event view_block_abstract_to_html_before dispatched, 5) _loadCache() checks cache: if miss, calls _beforeToHtml() then _toHtml(), 6) _afterToHtml($html) called, 7) Event view_block_abstract_to_html_after dispatched, 8) HTML returned to caller.",
    hint: "It's a pipeline with events, cache checks, and multiple hook points for customization.",
    topic: "Block Lifecycle",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 6 — Block Architecture & ViewModel Pattern"
  },
  {
    question: "How does the _toHtml() method work in AbstractBlock versus Template?",
    answer: "In AbstractBlock, _toHtml() is a protected concrete method (not abstract despite the class name) that returns an empty string by default. In Template, _toHtml() is overridden to resolve the template file path via TemplateEnginePool and include the .phtml file with $block available in scope. External code should call the public toHtml() wrapper, never _toHtml() directly.",
    hint: "The base implementation returns nothing — the Template subclass adds the actual rendering capability.",
    topic: "Block Rendering",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 6 — Block Architecture & ViewModel Pattern"
  },
  {
    question: "What is the standard development workflow for adding a new module with a ViewModel and custom block in Magento 2?",
    answer: "The workflow is: 1) Create the ViewModel class implementing ArgumentInterface, 2) Create a thin block class extending Template (if needed), 3) Create layout XML injecting the ViewModel via xsi:type=\"object\" argument, 4) Create the phtml template accessing the ViewModel via $block->getViewModel(), 5) Run bin/magento module:enable, setup:upgrade, and cache:clean. In developer mode, static content auto-deploys.",
    hint: "It follows a pattern of creating the PHP classes, XML configuration, template, then running setup commands.",
    topic: "Development Workflow",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 6 — Block Architecture & ViewModel Pattern"
  },
  {
    question: "What is the view_model argument naming convention, and how does the DataObject magic getter resolve it?",
    answer: "The convention is to name the argument 'view_model' (snake_case) in layout XML. DataObject's __call() method converts camelCase getter calls to underscore data keys: getViewModel() maps to getData('view_model'). Both snake_case 'view_model' and camelCase 'viewModel' work as argument names. The community standard is snake_case. This convention is not enforced by the framework — any argument name works with getData().",
    hint: "The magic getter converts method names to data keys, bridging the gap between PHP naming and XML naming conventions.",
    topic: "ViewModel Convention",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 6 — Block Architecture & ViewModel Pattern"
  },
  {
    question: "What is RequireJS and why does Magento 2 use it?",
    answer: "RequireJS is a JavaScript module loader implementing the Asynchronous Module Definition (AMD) specification. Magento 2 uses it for lazy-loading JS files, explicit dependency declarations, and creating modular, reusable JavaScript components. All requirejs-config.js files across modules and themes are merged (not overridden) into a single configuration at page load time.",
    hint: "It is an AMD module loader that handles async loading and dependency management.",
    topic: "RequireJS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 9 — RequireJS: Configuration & Modules"
  },
  {
    question: "What are the two possible locations for requirejs-config.js files, and how do they differ?",
    answer: "Module-level configs go in app/code/Vendor/Module/view/frontend/ (or view/base/ or view/adminhtml/). Theme-level configs can be at the theme root (app/design/frontend/Vendor/theme/requirejs-config.js) for global theme config, or inside a module directory within the theme (Vendor_Module/requirejs-config.js) for module-specific overrides. Theme configs extend module configs during merging.",
    hint: "One location is in the module code, the other is in the theme design directory.",
    topic: "RequireJS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 9 — RequireJS: Configuration & Modules"
  },
  {
    question: "What is the difference between 'paths' and 'map' in a requirejs-config.js file?",
    answer: "The 'paths' section maps a short alias to a file location (e.g., 'slick': 'Vendor_Module/js/vendor/slick'). The 'map' section remaps one module ID to another module ID for substitution (e.g., 'ko': 'knockoutjs/knockout'). 'paths' targets file paths while 'map' targets module IDs. 'map' also supports scoped mappings per-requirer, while 'paths' is always global.",
    hint: "One is alias-to-file, the other is ID-to-ID remapping.",
    topic: "RequireJS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 9 — RequireJS: Configuration & Modules"
  },
  {
    question: "What is the 'shim' section in requirejs-config.js used for?",
    answer: "The 'shim' section handles legacy JavaScript libraries that do not use AMD define(). It tells RequireJS what dependencies to load first (deps), what global variable the library exports (exports), and optionally an init function. If a library already uses define(), shimming it is unnecessary and can cause double-execution issues. Shorthand: { 'module': ['dep1'] } equals { 'module': { deps: ['dep1'] } }.",
    hint: "This is for wrapping non-AMD libraries so they work in the AMD ecosystem.",
    topic: "RequireJS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 9 — RequireJS: Configuration & Modules"
  },
  {
    question: "What is the difference between define() and require() in Magento 2 JavaScript?",
    answer: "define() creates a reusable AMD module that can be required elsewhere — it does not execute until required. require() loads and consumes modules immediately via a callback. define() is used in .js module files and returns a module value. require() is used in entry-point scripts and inline code for immediate execution. Modules should almost always use anonymous define() (no name as first argument).",
    hint: "One creates/exports, the other loads/consumes.",
    topic: "RequireJS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 9 — RequireJS: Configuration & Modules"
  },
  {
    question: "How does RequireJS config merging work across modules and themes in Magento 2?",
    answer: "All requirejs-config.js files from all enabled modules and the active theme are collected and merged into one configuration object. The merge order is: library (lib/web) -> module configs (by sequence) -> theme modular configs -> theme root config. For 'paths', the last definition of a key wins. For 'mixins', all mixins for a target are additive — they all apply. Later configs extend earlier ones.",
    hint: "Configs are merged, not replaced — and the order matters for which definition wins.",
    topic: "RequireJS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 9 — RequireJS: Configuration & Modules"
  },
  {
    question: "How do you declare a JavaScript mixin in requirejs-config.js?",
    answer: "Mixins are declared inside a specific nested structure: var config = { config: { mixins: { 'target/module': { 'your/mixin/path': true } } } }. Note the double 'config' nesting — the outer config is the RequireJS variable, the inner config is a RequireJS configuration section. Setting the value to true enables the mixin; false disables it.",
    hint: "There is a commonly mistaken double-nesting of 'config' in the structure.",
    topic: "RequireJS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 9 — RequireJS: Configuration & Modules"
  },
  {
    question: "What is the module ID resolution fallback order in Magento 2?",
    answer: "RequireJS resolves module IDs in this priority order: Current Theme -> Parent Theme(s) -> Module (app/code/Vendor/Module/view/frontend/web/) -> lib/web/ (core JS libraries). This means a file placed at <theme>/Vendor_Module/web/js/file.js automatically overrides the module's version without any configuration change needed.",
    hint: "The same fallback pattern used for LESS files also applies to JavaScript files.",
    topic: "RequireJS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 9 — RequireJS: Configuration & Modules"
  },
  {
    question: "What are two common mistakes when configuring paths in requirejs-config.js?",
    answer: "First, including the .js extension in the path value — RequireJS adds it automatically, so including it causes a double-append error. Second, using absolute paths (like /pub/static/...) instead of module notation (Vendor_Module/js/file) or baseUrl-relative paths. Both mistakes will cause the module to fail to load across different environments.",
    hint: "Think about what RequireJS automatically appends and how paths should be relative.",
    topic: "RequireJS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 9 — RequireJS: Configuration & Modules"
  },
  {
    question: "What does the 'deps' section at the top level of requirejs-config.js do?",
    answer: "The 'deps' section specifies modules that should be loaded immediately when RequireJS initializes, before any explicit require() call. It is used for polyfills, auto-initializing global widgets, and analytics/tracking scripts. This is different from 'deps' inside a 'shim' entry, which specifies prerequisites for a specific shimmed library.",
    hint: "These modules load eagerly on page initialization rather than on demand.",
    topic: "RequireJS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 9 — RequireJS: Configuration & Modules"
  },
  {
    question: "What must the variable name be in a requirejs-config.js file, and why?",
    answer: "The variable must be named exactly 'config' (var config = { ... }). Magento's framework wraps each file's content in an IIFE and passes the 'config' variable to require.config() automatically (via Magento\\Framework\\RequireJs\\Config::PARTIAL_CONFIG_TEMPLATE). Using any other variable name will cause the configuration to be silently ignored.",
    hint: "The framework template expects a specific variable name to pass to RequireJS.",
    topic: "RequireJS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 9 — RequireJS: Configuration & Modules"
  },
  {
    question: "How does the map section's '*' wildcard differ from scoped mappings?",
    answer: "The '*' wildcard applies the module remapping to ALL requiring modules globally — any code that requires the target gets the replacement. Scoped mappings apply only when a specific module does the requiring. For example, you can give 'some/module' a special version while all other modules get the standard version. Scoped entries take priority over '*' for matching requesters.",
    hint: "One applies everywhere; the other is conditional based on which module is doing the requiring.",
    topic: "RequireJS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 9 — RequireJS: Configuration & Modules"
  },
  {
    question: "How do you correctly use theme-level file paths in requirejs-config.js paths section?",
    answer: "For theme-level files in web/js/, use paths relative to the RequireJS baseUrl: 'js/my-greeting' (not 'Vendor_MyTheme/js/my-greeting'). The baseUrl already includes the theme path after static content deployment. Themes are not addressed via module notation like modules are. For module files, you would use 'Vendor_Module/js/file' notation.",
    hint: "Theme files use a simpler relative path because the baseUrl already points to the theme.",
    topic: "RequireJS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 9 — RequireJS: Configuration & Modules"
  },
  {
    question: "Why should you avoid named define() calls in Magento 2 modules?",
    answer: "Named modules (define('my/module/name', [...], function(){...})) are hard-coded to a specific module ID and cannot be remapped by paths or map configuration. Anonymous define() calls allow the module ID to be determined by its file location, making the module flexible and remappable. In Magento 2, you should almost always use anonymous define().",
    hint: "Named modules lose the flexibility that the RequireJS configuration system provides.",
    topic: "RequireJS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 9 — RequireJS: Configuration & Modules"
  },
  {
    question: "What is the correct way to replace a module globally versus extending it non-destructively in RequireJS?",
    answer: "To replace a module globally, use map: { '*': { 'original/module': 'replacement/module' } } — this substitutes one module ID for another everywhere. To extend a module non-destructively (keeping the original intact), use config: { mixins: { 'target/module': { 'your/mixin': true } } }. Map is a full replacement; mixins wrap the original and preserve its functionality.",
    hint: "One swaps the entire module; the other wraps and extends it.",
    topic: "RequireJS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 9 — RequireJS: Configuration & Modules"
  },
  {
    question: "What are the two core strategies for customizing LESS styles in Magento 2, and which is preferred?",
    answer: "The two strategies are Override (copying a file to the exact same relative path in your theme) and Extension (using _extend.less for additive changes plus variable overrides in _theme.less). Extension is strongly preferred because it is upgrade-safe — core updates still apply. Overriding means you own 100% of the file and must manually merge any core updates after upgrades.",
    hint: "One approach copies and replaces; the other layers changes on top.",
    topic: "LESS Overriding",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 8 — LESS Overriding & Extending Styles"
  },
  {
    question: "When overriding a module's LESS file, what is the correct path structure in your theme?",
    answer: "Module LESS overrides go under <theme>/<Namespace>_<Module>/web/css/source/. For example, to override vendor/magento/module-catalog/view/frontend/web/css/source/_module.less, place your override at app/design/frontend/Vendor/theme/Magento_Catalog/web/css/source/_module.less. The file must be at the exact same relative path — no shortcuts allowed.",
    hint: "The module name uses the Namespace_Module format as a directory name in the theme.",
    topic: "LESS Overriding",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 8 — LESS Overriding & Extending Styles"
  },
  {
    question: "What does the .lib-css() mixin do when its value parameter is false?",
    answer: ".lib-css() outputs a CSS property only if the value is not false. When the value IS false, it outputs nothing — no CSS property is emitted at all. This is Magento's mechanism for conditional CSS output, which is why you see @variable: false in variable files for 'disabled by default' features. It accepts three params: property name, value, and optional prefix flag.",
    hint: "Think of this mixin as a conditional property writer with a special 'off switch' value.",
    topic: "UI Library Mixins",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 8 — LESS Overriding & Extending Styles"
  },
  {
    question: "What is the variable naming convention for stateful component variables in Magento 2 LESS?",
    answer: "The pattern is @{component}__{state}__{property}, with the state placed between the component and property using double-underscore separators. For example: @button__hover__background (hover state background), @button-primary__active__color (primary button active text color). The base (stateless) pattern is @{component}__{property}, like @button__background.",
    hint: "Double underscores separate the three parts, with the state in the middle position.",
    topic: "LESS Variables",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 8 — LESS Overriding & Extending Styles"
  },
  {
    question: "How does the .media-width() mixin work for responsive styles in Magento 2?",
    answer: "You define a .media-width(@extremum, @break) mixin with guard conditions (e.g., when (@extremum = 'min') and (@break = @screen__m)). The _responsive.less file (imported last in styles-m.less) collects all definitions and outputs them inside the correct @media blocks. 'max' breakpoints auto-subtract 1px to avoid overlap. Definitions must be at the top level of the file, not nested inside selectors.",
    hint: "You define the mixin with guards; a collector file at the end calls them inside media queries.",
    topic: "Responsive LESS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 8 — LESS Overriding & Extending Styles"
  },
  {
    question: "What are the standard breakpoint variables in Magento 2, and which one represents the main mobile/desktop split?",
    answer: "The standard breakpoints are @screen__xxs (320px), @screen__xs (480px), @screen__s (640px), @screen__m (768px), @screen__l (1024px), and @screen__xl (1440px). @screen__m (768px) is the main mobile/desktop split point — it is the most commonly used breakpoint for responsive layout changes.",
    hint: "There are six breakpoints from extra-extra-small to extra-large, with 768px being the key divider.",
    topic: "Responsive LESS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 8 — LESS Overriding & Extending Styles"
  },
  {
    question: "How does the .lib-button() mixin work and what is the preferred way to customize button styles globally?",
    answer: ".lib-button() accepts named parameters with the @_button- prefix (e.g., @_button-background, @_button-color) and outputs all button-related CSS. However, the preferred approach for global button changes is to override variables in _theme.less (e.g., @button-primary__background: #1a6faf) rather than passing individual mixin parameters, because variable changes are globally consistent across all buttons.",
    hint: "The mixin accepts granular parameters, but for global changes there is a better approach using the variable system.",
    topic: "UI Library Mixins",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 8 — LESS Overriding & Extending Styles"
  },
  {
    question: "Why is _theme.less imported AFTER module files in styles-m.less, and what does this guarantee?",
    answer: "Because _theme.less is imported after all module styles (@magento_import _module.less and _widgets.less), LESS's last-definition-wins rule ensures that variable overrides in _theme.less take precedence over any module-level defaults. This is what guarantees that theme variable overrides win over framework and module defaults without needing to modify those source files.",
    hint: "The import order determines which variable definitions take effect in LESS.",
    topic: "LESS Overriding",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 8 — LESS Overriding & Extending Styles"
  },
  {
    question: "What is the decision flow for customizing styles in Magento 2 in order of preference?",
    answer: "First, try a variable override in _theme.less (safest, propagates everywhere). If that is not sufficient, use _extend.less to add or override specific CSS rules (safe, additive only). As a last resort, copy-override the file to your theme at the exact same relative path (highest risk — you own all content and must maintain it through upgrades). Document any copy-overrides.",
    hint: "Three levels of customization, each progressively more invasive.",
    topic: "LESS Best Practices",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 8 — LESS Overriding & Extending Styles"
  },
  {
    question: "What are the key default values for the primary button in the Blank theme?",
    answer: "The primary button uses @theme__color__primary (#1979c3 blue) for background, @color-white for text color, 1px solid @theme__color__primary for border, and @theme__color__primary-alt (#006bb4) for hover background. The default (secondary) button uses @color-gray95 (#f2f2f2) background with @primary__color (#333) text. Button font-weight is @font-weight__bold (700).",
    hint: "Primary buttons are blue-themed, while secondary buttons are gray-themed in the default Blank theme.",
    topic: "LESS Variables",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 8 — LESS Overriding & Extending Styles"
  },
  {
    question: "What does the .lib-font-size() mixin do and how does the unit conversion work?",
    answer: ".lib-font-size() converts a pixel input value to the configured @font-size-unit (default: rem). With default settings, @root__font-size is 62.5% (making 1rem = 10px) and @font-size-unit-ratio is 10. So an input of 32 outputs 3.2rem (32/10). It does NOT output dual px + rem values. If @font-size-unit-convert is false, the raw value is output unchanged.",
    hint: "The 62.5% root font size creates a convenient 1rem = 10px relationship for the conversion math.",
    topic: "UI Library Mixins",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 8 — LESS Overriding & Extending Styles"
  },
  {
    question: "Where should module _extend.less files be placed versus global theme _extend.less?",
    answer: "For extending a specific module's styles, place _extend.less at <theme>/<Namespace>_<Module>/web/css/source/_extend.less (e.g., Magento_Catalog/web/css/source/_extend.less). For global theme-level style extensions, place it at <theme>/web/css/source/_extend.less. Both are automatically discovered via @magento_import — you never need to manually import them.",
    hint: "The location determines the scope: module-specific directory or theme root.",
    topic: "LESS Overriding",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 8 — LESS Overriding & Extending Styles"
  },
  {
    question: "What does the .lib-vendor-prefix-display() mixin output and why should you use it?",
    answer: "It outputs the display property with all required vendor prefixes for cross-browser compatibility — specifically -webkit-flex, -ms-flexbox (note: -ms- uses 'flexbox' not 'flex'), and standard flex. You should use it instead of writing display: flex directly to ensure compatibility within Magento's framework pattern, particularly handling the IE11 flexbox naming difference.",
    hint: "Different browsers historically used different names for the same display value.",
    topic: "UI Library Mixins",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 8 — LESS Overriding & Extending Styles"
  },
  {
    question: "How does overriding a lib/web LESS file differ from overriding a module LESS file in your theme?",
    answer: "For lib/web files, overrides go directly under <theme>/web/ at the same relative path (no module prefix). For example, lib/web/css/source/lib/_buttons.less overrides to <theme>/web/css/source/lib/_buttons.less. Module file overrides go under <theme>/<Namespace>_<Module>/web/css/source/. The key difference is the presence or absence of the module directory prefix.",
    hint: "Library files have no module association, so the theme path mirrors the lib structure directly.",
    topic: "LESS Overriding",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 8 — LESS Overriding & Extending Styles"
  },
  {
    question: "What is the correct way to handle 'max' breakpoints with .media-width(), and how does the compiled output differ from 'min'?",
    answer: "For 'max' breakpoints, _responsive.less automatically subtracts 1px from the variable value to avoid overlap with 'min' breakpoints (e.g., @screen__m = 768px becomes max-width: 767px). 'min' media queries use '@media all and (min-width: ...)' while 'max' queries use '@media only screen and (max-width: ...)'. You should always use breakpoint variables, never raw pixel values.",
    hint: "The 1px subtraction prevents styles from applying at the same breakpoint in both min and max queries.",
    topic: "Responsive LESS",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 8 — LESS Overriding & Extending Styles"
  },
  {
    question: "What are the three primary source locations for LESS files in Magento 2, and what is their priority order?",
    answer: "The three locations are: lib/web/css/source/ (UI Library, lowest priority), module-level view/frontend/web/css/source/ (medium priority), and theme-level web/css/source/ (highest priority). The fallback chain goes from theme -> parent theme -> module -> lib, with the theme having the highest priority for overriding styles.",
    hint: "Think about the fallback chain and where your custom work should live.",
    topic: "LESS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 7 — LESS Architecture & File Structure"
  },
  {
    question: "What is the difference between @magento_import and @import in Magento 2 LESS?",
    answer: "@import resolves to a single specific file path, while @magento_import collects all matching files across all active modules and themes in their load order. @magento_import uses an underscore (not hyphen) and is prefixed with // to make it a LESS comment that Magento's preprocessor recognizes. This enables non-destructive theme customization without forking parent files.",
    hint: "One finds a single file, the other aggregates from everywhere.",
    topic: "LESS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 7 — LESS Architecture & File Structure"
  },
  {
    question: "What is the purpose of _theme.less in a Magento 2 theme, and how is it imported?",
    answer: "_theme.less is used to override EXISTING framework and module variables (colors, fonts, breakpoints, etc.). It is imported via a standard @import directive in styles-m.less, not via @magento_import. Because it is imported AFTER module styles, theme variable overrides always win through LESS's last-definition-wins rule.",
    hint: "This file is for overriding existing variables only — new variables go elsewhere.",
    topic: "LESS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 7 — LESS Architecture & File Structure"
  },
  {
    question: "What is the significance of the underscore prefix in LESS filenames like _theme.less and _module.less?",
    answer: "Files prefixed with an underscore are called 'partials' — they are not compiled independently into CSS. They must be included via @import or @magento_import. Only files without an underscore prefix (like styles-m.less and styles-l.less) are compiled directly as entry points to produce standalone CSS output.",
    hint: "The underscore signals how the build system treats the file.",
    topic: "LESS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 7 — LESS Architecture & File Structure"
  },
  {
    question: "What is the correct syntax for the @magento_import directive, and what common mistakes should you avoid?",
    answer: "The correct syntax is //@magento_import 'source/_module.less'; with no space between // and @magento_import, and using an underscore (not hyphen). Common mistakes include using a hyphen (@magento-import), adding a space after //, or leaving out the // prefix entirely. The // makes it a valid LESS comment while Magento's preprocessor recognizes and processes it.",
    hint: "Pay attention to the punctuation between the comment marker and the directive name.",
    topic: "LESS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 7 — LESS Architecture & File Structure"
  },
  {
    question: "What are the three methods for compiling LESS to CSS in Magento 2, and when should each be used?",
    answer: "1) Grunt compile/watch — for active development, requires Node.js and Gruntfile.js configuration. 2) setup:static-content:deploy — the production compilation command that compiles LESS and copies all static assets to pub/static/. 3) Client-side less.js — browser compiles LESS on-the-fly in developer mode only, providing instant feedback but being too slow for production.",
    hint: "Think about the three modes: development with a build tool, production deployment, and quick browser-based iteration.",
    topic: "LESS Compilation",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 7 — LESS Architecture & File Structure"
  },
  {
    question: "Why should you NEVER edit files in the pub/static/ directory?",
    answer: "The pub/static/ directory contains generated output that is completely overwritten whenever LESS is recompiled via grunt compile or setup:static-content:deploy. Any manual edits will be lost. All changes should be made in the source files at app/design/frontend/[Vendor]/[theme]/web/css/source/.",
    hint: "Think about what happens when the build process runs again.",
    topic: "LESS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 7 — LESS Architecture & File Structure"
  },
  {
    question: "What is the purpose of _extend.less and how is it discovered by Magento?",
    answer: "_extend.less is used for adding theme-specific styling that extends module styles in a purely additive way. It is automatically collected by Magento's @magento_import directive in styles-m.less (//@magento_import 'source/_extend.less'). You do NOT need to manually @import it — Magento handles discovery automatically.",
    hint: "This file allows non-destructive customization and is picked up automatically.",
    topic: "LESS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 7 — LESS Architecture & File Structure"
  },
  {
    question: "What is the difference between styles-m.less and styles-l.less?",
    answer: "styles-m.less is the mobile-first stylesheet that is always loaded on every page. styles-l.less contains desktop/large screen styles that are loaded only for large screens. Both are compiled entry points (no underscore prefix) that produce standalone CSS files in pub/static/.",
    hint: "The suffixes 'm' and 'l' hint at the target device size.",
    topic: "LESS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 7 — LESS Architecture & File Structure"
  },
  {
    question: "When troubleshooting LESS changes that don't appear, what directories must you clear?",
    answer: "You must clear var/view_preprocessed/ (which stores intermediate LESS processing results) and pub/static/frontend/[Vendor]/[Theme]/ (which contains final compiled output). You should also flush the Magento cache with php bin/magento cache:flush. Only after clearing all three should you recompile.",
    hint: "There are two cached directories plus the application cache to clear.",
    topic: "LESS Compilation",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 7 — LESS Architecture & File Structure"
  },
  {
    question: "What is the difference between _theme.less and _variables.less in a Magento 2 theme?",
    answer: "_theme.less is for overriding EXISTING framework and module variables — it is imported via @import in styles-m.less after module styles, ensuring overrides win. _variables.less is for defining theme-specific variables (not overrides of existing ones). They serve different purposes: one overrides, the other defines new variables.",
    hint: "One file redefines what already exists; the other introduces something new.",
    topic: "LESS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 7 — LESS Architecture & File Structure"
  },
  {
    question: "How does @magento_import enable non-destructive theme customization?",
    answer: "Without @magento_import, you would need to copy the parent theme's styles-m.less into your theme and modify it (forking), which means you own the entire file and core updates are never picked up. With @magento_import, your theme's _extend.less is automatically collected and included — you never need to modify the parent theme's entry point file, keeping your customizations layered on top.",
    hint: "Think about what happens during upgrades if you copied the parent file versus using the automatic collection mechanism.",
    topic: "LESS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 7 — LESS Architecture & File Structure"
  },
  {
    question: "Where must custom themes be registered for Grunt commands to recognize them?",
    answer: "Custom themes must be registered in dev/tools/grunt/configs/themes.js. The key is a simple name (e.g., 'mytheme', 'blank', 'luma') — NOT in Vendor_themename format. The configuration includes area, name (Vendor/theme format), locale, files array (entry points like css/styles-m), and dsl ('less').",
    hint: "Look at the Grunt configuration directory for a themes file.",
    topic: "LESS Compilation",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 7 — LESS Architecture & File Structure"
  },
  {
    question: "What is client-side LESS compilation and when is it available?",
    answer: "Client-side LESS compilation uses less.js in the browser to compile LESS to CSS on-the-fly. It is only available in developer mode (set via php bin/magento deploy:mode:set developer). It provides instant feedback without needing Grunt or CLI commands — just refresh the browser. However, it is slow because compilation happens per request and should NEVER be used in production.",
    hint: "The browser itself does the compilation work in this mode.",
    topic: "LESS Compilation",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 7 — LESS Architecture & File Structure"
  },
  {
    question: "What is the actual import order inside styles-m.less in the Blank theme?",
    answer: "The order is: @import _reset.less (CSS reset), @import _styles.less (which chains to _lib.less and theme sources), @magento_import _module.less (per-module styles), @magento_import _widgets.less (per-module widgets), @import _theme.less (variable overrides), @magento_import _extend.less (additive extensions), and finally @import _responsive.less (media query collector). The @media-target is set to 'mobile'.",
    hint: "Variable overrides come after module styles but before extensions, and responsive is always last.",
    topic: "LESS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 7 — LESS Architecture & File Structure"
  },
  {
    question: "What is the difference between _create and _init in a jQuery widget?",
    answer: "_create runs exactly ONCE when the widget is first instantiated — use it for DOM manipulation, event binding, and one-time setup. _init runs after _create AND on every subsequent re-initialization — use it for state reset and rendering based on current options. If you put event binding in _init, you risk binding the same listener multiple times. Always bind events in _create.",
    hint: "One is a one-shot constructor; the other is called repeatedly on re-initialization.",
    topic: "jQuery Widgets",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 11 — jQuery Widgets & JS Translations"
  },
  {
    question: "What are the differences between data-mage-init and x-magento-init for widget initialization?",
    answer: "data-mage-init is an HTML attribute on the target element (this.element = that element), uses single quotes as outer delimiter, and is for one element at a time. x-magento-init is a <script type='text/x-magento-init'> tag that uses a CSS selector to target elements, works with dynamically loaded content, supports the '*' selector for non-DOM components, and can match multiple elements with one declaration.",
    hint: "One is an attribute on the element; the other is a separate script tag with a selector.",
    topic: "jQuery Widgets",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 11 — jQuery Widgets & JS Translations"
  },
  {
    question: "How do JavaScript translations work in Magento 2, and what functions are used?",
    answer: "JS translations use $.mage.__('string') or $t('string') (from mage/translate module) — both are functionally equivalent. They look up the string in an in-memory dictionary populated from js-translation.json. If the key is missing or the value is empty, the original string is returned without error. Translation keys are case-sensitive and must exactly match.",
    hint: "Two equivalent functions read from a JSON dictionary file, with graceful fallback to the original string.",
    topic: "JS Translations",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 11 — jQuery Widgets & JS Translations"
  },
  {
    question: "How is js-translation.json generated and where is it located?",
    answer: "js-translation.json is generated during Static Content Deploy (bin/magento setup:static-content:deploy). It is located at pub/static/{area}/{vendor}/{theme}/{locale}/js-translation.json. Changes to translation CSV files require re-running SCD to update the JSON. The file contains a flat key-value JSON object mapping original strings to their translations.",
    hint: "It is a build artifact generated from CSV source files during deployment.",
    topic: "JS Translations",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 11 — jQuery Widgets & JS Translations"
  },
  {
    question: "What are the key differences between PHP translations and JavaScript translations in Magento 2?",
    answer: "PHP __() reads from an in-memory dictionary (module CSVs -> language packs -> theme CSVs -> DB translation table, with DB having highest priority). JS $.mage.__() reads from js-translation.json (a flat JSON file). They are completely independent systems — DB changes do NOT affect JS translations. PHP translations are live (no deploy needed); JS translations require SCD re-run.",
    hint: "Different storage mechanisms, different update processes, no cross-pollination between them.",
    topic: "JS Translations",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 11 — jQuery Widgets & JS Translations"
  },
  {
    question: "What does the x-magento-init '*' selector do?",
    answer: "The '*' selector in x-magento-init initializes a JavaScript component without binding it to any specific DOM element. It is used for pure JavaScript components that do not need a DOM reference — such as global analytics scripts, page-level configuration, or data models. The component receives null or no element reference instead of a jQuery-wrapped DOM node.",
    hint: "Sometimes a component needs to run globally without being attached to any specific HTML element.",
    topic: "jQuery Widgets",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 11 — jQuery Widgets & JS Translations"
  },
  {
    question: "Why should you use this._on() instead of $(el).on() for event binding in jQuery widgets?",
    answer: "this._on() automatically cleans up event bindings when the widget is destroyed (_destroy), preventing memory leaks. It also automatically binds the 'this' context to the widget instance without needing manual .bind(this). Both support event delegation. Using raw $(el).on() requires manual cleanup and explicit context binding, making it error-prone.",
    hint: "The widget factory method handles cleanup and context automatically.",
    topic: "jQuery Widgets",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 11 — jQuery Widgets & JS Translations"
  },
  {
    question: "How do you trigger re-processing of widget initializations after injecting AJAX content?",
    answer: "After injecting new HTML via AJAX, fire the 'contentUpdated' event on the parent container: $container.trigger('contentUpdated'). This triggers Magento to re-scan the new content and apply widget bindings from both data-mage-init attributes and x-magento-init script blocks within the injected HTML. Without this event, dynamically added widgets will not initialize.",
    hint: "A specific jQuery event tells Magento to look for new widget declarations in updated DOM content.",
    topic: "jQuery Widgets",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 11 — jQuery Widgets & JS Translations"
  },
  {
    question: "What is the correct JSON quoting format for data-mage-init attributes?",
    answer: "data-mage-init must use single quotes as the HTML attribute delimiter with standard JSON (double quotes) inside: data-mage-init='{\"Module/js/widget\": {\"option\": \"value\"}}'. Using double quotes outside will break the HTML attribute parsing. You can also use HTML entities (&quot;) for inner quotes, but the single-quote approach is standard.",
    hint: "HTML attributes normally use double quotes, so the JSON wrapper must use the other kind.",
    topic: "jQuery Widgets",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 11 — jQuery Widgets & JS Translations"
  },
  {
    question: "How does the i18n:collect-phrases command work, and what does the --magento flag change?",
    answer: "bin/magento i18n:collect-phrases scans files for translatable strings. Without --magento, it requires a directory argument and produces a flat CSV. With --magento, it scans the entire Magento root directory and enables contextual (module-aware) output. Both modes scan PHP, PHTML, JS, HTML, and XML files — the --magento flag does NOT control which file types are scanned, only the scope and output format.",
    hint: "The flag changes the scan scope and output format, not which file types are included.",
    topic: "JS Translations",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 11 — jQuery Widgets & JS Translations"
  },
  {
    question: "Why must _setOption always call this._super(key, value) in a jQuery widget?",
    answer: "_setOption handles runtime option updates. Calling this._super(key, value) ensures the jQuery UI internal option store is updated before your custom logic runs. Without it, the option change is not properly recorded, and this.options will still hold the old value. After calling _super, you can add custom logic like re-rendering the widget.",
    hint: "The parent method updates the internal options storage that your widget relies on.",
    topic: "jQuery Widgets",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 11 — jQuery Widgets & JS Translations"
  },
  {
    question: "How are jQuery widget instances stored and accessed after initialization?",
    answer: "Widget instances are stored in jQuery's .data() using a camelCase version of the namespaced name: mage.widgetName becomes 'mageWidgetName', vendor.greetingWidget becomes 'vendorGreetingWidget'. You can access the instance via $(el).data('mageWidgetName') or call public methods using the plugin syntax: $(el).widgetName('methodName', args).",
    hint: "The namespace and widget name are concatenated into camelCase for the data key.",
    topic: "jQuery Widgets",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 11 — jQuery Widgets & JS Translations"
  },
  {
    question: "What is the widget namespace convention in Magento 2, and why does it matter?",
    answer: "Widgets are declared as $.widget('namespace.widgetName', {...}). Core Magento widgets use the 'mage' namespace (e.g., mage.accordion), while custom widgets should use a vendor-specific namespace. The namespace is not decorative — it defines the jQuery plugin name. mage.accordion becomes callable as $(el).accordion(). The namespace prevents collisions between different vendors' widgets.",
    hint: "The first part of the dot-separated name controls how the widget is accessed as a jQuery plugin.",
    topic: "jQuery Widgets",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 11 — jQuery Widgets & JS Translations"
  },
  {
    question: "What happens when a translation key is missing or has an empty string value in js-translation.json?",
    answer: "Both cases return the original string unchanged — no error or exception is thrown. If 'Cancel' maps to an empty string '' in the JSON, $.mage.__('Cancel') returns 'Cancel' (the original). If a key is not in the JSON at all, the original string is also returned. This graceful fallback means untranslated strings display in their original language rather than causing errors.",
    hint: "The translation system has a silent fallback that always produces usable output.",
    topic: "JS Translations",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 11 — jQuery Widgets & JS Translations"
  },
  {
    question: "What is the full translation pipeline from writing JS code to a translated string appearing in the browser?",
    answer: "1) Developer writes $.mage.__('My Phrase') in JS code. 2) Run i18n:collect-phrases to discover strings. 3) Translator fills in the CSV: 'My Phrase','Ma Phrase'. 4) Place CSV in module i18n/ directory. 5) Run setup:static-content:deploy for the target locale. 6) js-translation.json is generated with the mapping. 7) When a user visits the site in that locale, $.mage.__('My Phrase') returns the translation.",
    hint: "Seven steps from code to browser, involving collection, translation, deployment, and runtime lookup.",
    topic: "JS Translations",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 11 — jQuery Widgets & JS Translations"
  },
  {
    question: "What is the difference between define() and require() in Magento 2's AMD/RequireJS system?",
    answer: "define() creates a reusable module that exports a value (object, function, etc.) and can be consumed by other modules. require() consumes modules for one-time use without creating a named export. define() is used for libraries and components, while require() is used for entry-point code that just needs to run.",
    hint: "One creates something reusable, the other just runs code that depends on modules.",
    topic: "JS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 12 — JavaScript Architecture & Module Best Practices"
  },
  {
    question: "Where does the requirejs-config.js file live in a Magento 2 module, and what configuration options does it support?",
    answer: "The requirejs-config.js file lives in view/frontend/ (or view/adminhtml/) within a module. It supports map (alias to path mapping), paths (override file paths), shim (wrap non-AMD libraries with deps and exports), and config.mixins (extend existing JS components). All requirejs-config.js files from modules and themes are merged at deploy time with theme configs winning.",
    hint: "Think about the view directory structure and the four main configuration keys.",
    topic: "JS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 12 — JavaScript Architecture & Module Best Practices"
  },
  {
    question: "Why does Magento coding standard require 'use strict' at the top of every AMD factory function?",
    answer: "'use strict' prevents accidental global variable creation by throwing a ReferenceError when an undeclared variable is assigned. Without it, a typo like mistypedVar = 'value' silently creates window.mistypedVar, polluting the global scope. This enforces proper variable declaration and catches bugs early during development.",
    hint: "Consider what happens when you accidentally assign to a variable that was never declared with var/let/const.",
    topic: "JS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 12 — JavaScript Architecture & Module Best Practices"
  },
  {
    question: "How does dependency injection work in Magento 2 JavaScript AMD modules, and what is the critical rule about dependency array position?",
    answer: "Dependencies are declared in an array as the first argument to define(), and the AMD loader injects them as arguments to the factory function. The critical rule is that argument positions must match dependency array positions — argument #1 receives dependency #1 regardless of the argument name. If you have fewer arguments than dependencies, the extra dependencies become undefined.",
    hint: "The order in the array and the order of the function parameters are tightly coupled.",
    topic: "JS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 12 — JavaScript Architecture & Module Best Practices"
  },
  {
    question: "What is mage/storage and why is it preferred over $.ajax() for REST API calls in Magento 2?",
    answer: "mage/storage is a thin wrapper around $.ajax() that provides sensible defaults for REST API calls: it sets contentType to 'application/json' and global to true by default. It offers a cleaner API with storage.get(), storage.post(), storage.put(), and storage.delete() methods. Each method returns a jQuery Deferred/Promise. It does NOT automatically inject auth tokens — frontend REST auth relies on PHP session cookies.",
    hint: "Think about what default settings make REST calls easier, and how storefront authentication actually works.",
    topic: "JS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 12 — JavaScript Architecture & Module Best Practices"
  },
  {
    question: "What happens when two AMD modules have a circular dependency in RequireJS, and how do you fix it?",
    answer: "When two modules depend on each other circularly, RequireJS resolves it by providing an empty object {} for one of them — this is a silent failure with no error thrown. Calling methods on the empty object results in 'is not a function' errors. The fix is to either extract shared logic into a third module, or use lazy require() inside a function body so the dependency is resolved only when called, by which time both modules are fully loaded.",
    hint: "RequireJS doesn't throw an error — it silently gives one module an empty object.",
    topic: "JS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 12 — JavaScript Architecture & Module Best Practices"
  },
  {
    question: "What is the correct way to use translation strings inside an AMD module in Magento 2?",
    answer: "You should explicitly include mage/translate as a dependency and alias it as $t, then use $t('Your string') for translations. While $.mage.__() also works if jQuery is loaded, it is fragile and not the recommended approach. The explicit import of mage/translate ensures the translation function is always available and follows Magento coding standards.",
    hint: "There are two ways to translate in JS, but one requires an explicit dependency declaration and is the recommended pattern.",
    topic: "JS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 12 — JavaScript Architecture & Module Best Practices"
  },
  {
    question: "How do Knockout observables work in Magento checkout models like quote and customer, and what is the common pitfall?",
    answer: "The checkout models use Knockout observables for data like quote.totals(), quote.shippingAddress(), and customer.isLoggedIn(). These are functions that must be called with parentheses () to get their current value. The common pitfall is accessing them without parentheses (e.g., quote.totals instead of quote.totals()), which returns the observable function itself instead of the data, leading to undefined property access errors.",
    hint: "Observables look like properties but they are actually functions — you need to invoke them.",
    topic: "JS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 12 — JavaScript Architecture & Module Best Practices"
  },
  {
    question: "What is mage/utils/wrapper used for in Magento 2 JavaScript, and why is it preferred over direct function overriding?",
    answer: "mage/utils/wrapper is used to extend existing functions non-destructively using wrapper.wrap(). It takes the original function and a wrapper function that receives the original as its first argument, allowing you to add logic before/after the original call. This is preferred because it works with the mixin pattern, preserving the original behavior while adding extensions — avoiding the risks of completely overriding a module.",
    hint: "Think about wrapping a function so you can call the original while adding your own logic before and after.",
    topic: "JS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 12 — JavaScript Architecture & Module Best Practices"
  },
  {
    question: "What is the merge order for requirejs-config.js files in Magento 2, and which one wins?",
    answer: "RequireJS configuration files from all modules and themes are merged at deploy time following the order: lib (core library) -> module -> theme. Since theme configurations are merged last, theme-level requirejs-config.js settings take the highest priority and override module-level configurations.",
    hint: "The merge follows a fallback hierarchy similar to other Magento assets, where more specific levels override less specific ones.",
    topic: "JS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 12 — JavaScript Architecture & Module Best Practices"
  },
  {
    question: "In Magento 2, what are the three JS optimization settings available for production, and where are they configured?",
    answer: "The three settings are: Merge JS Files, Enable JS Bundling, and Minify JS Files. They are configured under Stores > Configuration > Advanced > Developer > JavaScript Settings. In development mode, all three should be set to No for debugging. In production mode, all three should be set to Yes for optimal performance. RequireJS bundling combines multiple AMD modules into fewer HTTP requests.",
    hint: "These three settings control how JavaScript files are combined, bundled, and compressed in production.",
    topic: "JS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 12 — JavaScript Architecture & Module Best Practices"
  },
  {
    question: "How does the shim configuration in requirejs-config.js work, and when is it needed?",
    answer: "The shim configuration is used to wrap non-AMD (legacy) libraries so they can be used as AMD dependencies. It specifies deps (the library's own dependencies, like jQuery) and exports (the global variable name the library creates). This makes legacy scripts that pollute the global scope compatible with RequireJS's dependency management system.",
    hint: "Some older libraries don't use define() and instead attach themselves to the window object.",
    topic: "JS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 12 — JavaScript Architecture & Module Best Practices"
  },
  {
    question: "Where should Grunt themes be registered in Magento 2, and what configuration properties does each theme entry require?",
    answer: "Grunt themes are registered in dev/tools/grunt/configs/themes.js. Each theme entry requires: area (e.g., 'frontend'), name (e.g., 'Vendor/theme'), locale (e.g., 'en_US'), files (array of CSS entry points like 'css/styles-m' and 'css/styles-l'), and dsl (typically 'less'). The key name in the config object is what you use with Grunt commands like grunt less:mytheme.",
    hint: "This file maps simple key names to full theme path configurations for Grunt to compile.",
    topic: "JS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 12 — JavaScript Architecture & Module Best Practices"
  },
  {
    question: "How does the data-mage-init attribute dispatch to a JavaScript module, and what export types does it support?",
    answer: "When data-mage-init loads a module, mage/apply/main.js checks the export type: if the module returns a function, it calls fn(config, element); if it returns an object, it looks for obj[componentPath]; if neither, it checks if $(element)[componentName] exists as a jQuery widget and calls it. It does NOT automatically call an init() method — plain object modules need to return a function or use the require() approach with manual initialization.",
    hint: "The dispatch depends on what the module returns — a function, an object, or a jQuery widget.",
    topic: "JS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 12 — JavaScript Architecture & Module Best Practices"
  },
  {
    question: "How does REST API authentication work for storefront AJAX calls in Magento 2, and how does it differ for logged-in customers vs guests?",
    answer: "Storefront REST API authentication relies on PHP session cookies that the browser sends automatically with every AJAX request — no explicit Authorization header is needed. For logged-in customers, the URL pattern is /rest/V1/carts/mine/items where the session identifies the customer. For guests, a masked cart ID is used in the URL: /rest/V1/guest-carts/:maskedCartId/items, with the masked ID available via window.checkoutConfig or the quote model.",
    hint: "The browser handles authentication automatically through cookies, but the URL pattern differs for guests.",
    topic: "JS Architecture",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 12 — JavaScript Architecture & Module Best Practices"
  },
  {
    question: "What is the most granular scope at which a theme can be assigned in Magento 2?",
    answer: "Store View is the most granular scope for theme assignment. Magento follows the hierarchy Website > Store (Store Group) > Store View. A theme assigned at a more specific (lower) scope always overrides a theme set at a higher scope. If no theme is set at the Store View level, it inherits from Store, then Website, then the Default global row.",
    hint: "Think about Magento's standard three-level scope hierarchy.",
    topic: "Admin Theme Config",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 13 — Admin Theme Configuration"
  },
  {
    question: "What is the correct admin navigation path to assign a theme per scope in Magento 2, and how does it differ from the design system settings?",
    answer: "Theme assignment is done under Content > Design > Configuration, where you select the scope row and set the Applied Theme dropdown. This is different from Stores > Configuration > General > Design, which controls system-level design settings like HTML head, header, and footer defaults. These are two separate admin sections with different purposes — a common exam trap.",
    hint: "The path starts with 'Content' not 'Stores' — and there are two different design-related areas in the admin.",
    topic: "Admin Theme Config",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 13 — Admin Theme Configuration"
  },
  {
    question: "After assigning a new theme in the Magento 2 admin, what additional steps are needed before it becomes visible in production mode?",
    answer: "In production mode, you must run cache:flush to clear the Magento cache and then setup:static-content:deploy to compile and deploy the new theme's static assets. Simply saving the theme in admin is not enough. In developer mode, only cache:flush is needed because static files are regenerated on-demand. With Grunt in developer mode, you also need grunt exec and grunt less for the theme.",
    hint: "Saving alone is insufficient — there are two CLI commands needed in production mode.",
    topic: "Admin Theme Config",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 13 — Admin Theme Configuration"
  },
  {
    question: "How do Design Schedules work in Magento 2, and do they require a cache flush when they activate?",
    answer: "Design Schedules allow a different theme to be applied automatically for a specific date range. They are configured under Content > Design > Schedule. The critical point is that no cache flush is needed when a schedule activates or expires — the transition is fully automatic. The scheduled theme overrides the regular theme assignment during the configured period, and the regular theme resumes automatically when the schedule expires.",
    hint: "The schedule transitions happen without any manual intervention — not even cache management.",
    topic: "Admin Theme Config",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 13 — Admin Theme Configuration"
  },
  {
    question: "Are Design Schedules available in both Magento Open Source (CE) and Adobe Commerce (EE)?",
    answer: "Yes, Design Schedules are available in both CE and EE. The admin controllers are in module-backend (core) and the design_change database table is in module-theme (core). This is a common exam trap — many assume it's an EE-only feature, but it is a core feature available in all editions.",
    hint: "Check which core modules contain the controllers and database tables for this feature.",
    topic: "Admin Theme Config",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 13 — Admin Theme Configuration"
  },
  {
    question: "How can you apply a custom theme or layout to an individual category page in Magento 2?",
    answer: "Navigate to Catalog > Categories > select a category > Design tab. There you can set a Custom Design (theme override), a Page Layout (1 column, 2 columns, etc.), and Layout Update XML. The design applies only to that category listing page (CLP). Checking 'Apply Design to Products' extends the design to product pages within that category. The Layout Update XML is validated at save time — invalid XML prevents saving.",
    hint: "There is a Design tab on the category editor with both theme and layout XML options.",
    topic: "Admin Theme Config",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 13 — Admin Theme Configuration"
  },
  {
    question: "When is Custom Layout Update XML validated in Magento 2 — at save time or at render time?",
    answer: "Custom Layout Update XML is validated at save time, not at render time. If you enter invalid XML in the Custom Layout Update XML field on a product, category, or CMS page, Magento prevents the entity from being saved and shows an error immediately in the admin UI. This applies to all three entity types (product, category, CMS page).",
    hint: "The validation happens before the data reaches the database, not when the page is displayed to customers.",
    topic: "Admin Theme Config",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 13 — Admin Theme Configuration"
  },
  {
    question: "What is the scope of Custom Layout Update XML on a product in Magento 2?",
    answer: "Custom Layout Update XML on a product applies only to that specific product's Product Detail Page (PDP). It does not affect any other pages, products, or the category listing page. The XML is found on the Design tab of the product editor in Catalog > Products. It uses standard Magento layout XML syntax with referenceBlock, referenceContainer, and block directives.",
    hint: "The layout change is scoped to just one page — the individual product page where it is configured.",
    topic: "Admin Theme Config",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 13 — Admin Theme Configuration"
  },
  {
    question: "What is the status of User Agent Rules in Magento 2, and what is the modern replacement?",
    answer: "User Agent Rules are deprecated in newer versions of Magento 2 / Adobe Commerce. They were used to apply different themes based on the user agent string of the browser/device (e.g., mobile vs desktop). The modern replacement is responsive themes — Magento's default themes (Blank and Luma) are responsive by default. You may see a question about their status on the exam.",
    hint: "This feature for device-specific theme switching has been replaced by a CSS-based approach.",
    topic: "Admin Theme Config",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 13 — Admin Theme Configuration"
  },
  {
    question: "What is the 'Default' row in the Design Configuration grid, and how does it differ from 'Default Store View'?",
    answer: "The Default row in Content > Design > Configuration applies globally as a fallback to all scopes that do not have their own theme override. It is NOT the same as the 'Default Store View.' It is the global baseline — if a Website, Store, or Store View does not have an explicit theme assignment, they inherit from this Default row.",
    hint: "This is a global fallback, not tied to any specific store view.",
    topic: "Admin Theme Config",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 13 — Admin Theme Configuration"
  },
  {
    question: "How does the CMS page Design tab differ from the category and product Design tabs in Magento 2?",
    answer: "CMS pages have a Layout field (to choose 1 column, 2 columns, 3 columns, or Empty layout) and a Custom Layout Update XML field, both on the Design tab at Content > Pages. Unlike categories, CMS pages do not have a Custom Design (theme override) field or an 'Apply Design to Products' checkbox. Unlike products, CMS pages include the Layout dropdown. The XML applies only to that specific CMS page.",
    hint: "CMS pages have a page layout selector that categories and products handle differently.",
    topic: "Admin Theme Config",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 13 — Admin Theme Configuration"
  },
  {
    question: "In Magento 2's scope override system for theme assignment, which scope wins — Website or Store View?",
    answer: "Store View scope wins over Website scope. In Magento's scope hierarchy, more specific scopes always override less specific ones. The priority order from lowest to highest is: Default (global) < Website < Store (Store Group) < Store View. If a Store View has an explicit theme assignment, it overrides anything set at the Website or Store level.",
    hint: "More specific scopes take priority — think about which level is closest to the customer.",
    topic: "Admin Theme Config",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 13 — Admin Theme Configuration"
  },
  {
    question: "When deploying a theme assigned to a specific store view in production mode, what is the full CLI workflow?",
    answer: "After saving the theme assignment in Content > Design > Configuration, you need to: 1) Run cache:flush to clear the Magento cache, and 2) Run setup:static-content:deploy with the appropriate locale and optionally the --theme flag (e.g., bin/magento setup:static-content:deploy fr_FR --theme Vendor/customtheme -f). In developer mode with Grunt, the workflow is cache:flush followed by grunt exec:themename and grunt less:themename.",
    hint: "The static content deploy command can be filtered by both locale and theme name.",
    topic: "Admin Theme Config",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 13 — Admin Theme Configuration"
  },
  {
    question: "What Grunt command syntax do you use to watch a specific theme for changes, and how does it differ from watching all themes?",
    answer: "Use grunt watch:themename (colon syntax) to watch a specific theme, and grunt watch (no suffix) to watch all registered themes. The colon syntax is used, NOT a --theme flag. The watch command monitors source LESS files and automatically re-runs grunt less when a change is detected, providing a fast feedback loop during development without manual recompilation.",
    hint: "The theme name is appended after a colon, not passed as a flag.",
    topic: "Admin Theme Config",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 13 — Admin Theme Configuration"
  },
  {
    question: "How does the 'Apply Design to Products' checkbox work in a category's Design tab?",
    answer: "When 'Apply Design to Products' is checked on a category's Design tab, the custom design settings (theme override, page layout, layout update XML) apply not only to the Category Listing Page (CLP) but also to all Product Detail Pages (PDPs) for products within that category. Without this checkbox, the custom design only affects the category listing page itself. This provides a way to apply design changes across an entire product group without editing each product individually.",
    hint: "There is a checkbox that extends category-level design changes down to the product pages within it.",
    topic: "Admin Theme Config",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 13 — Admin Theme Configuration"
  },
  {
    question: "What is a JavaScript mixin in Magento 2, and how does it relate to PHP plugins?",
    answer: "A mixin allows you to extend or override the behavior of an existing JavaScript module without replacing it entirely — it is the JS equivalent of a PHP interceptor/plugin. The mixin receives the original module as an argument, wraps or extends its methods, and returns the modified version. The original module is still loaded; the mixin layers changes on top.",
    hint: "Like PHP interceptors, these hook into existing modules rather than replacing them.",
    topic: "JS Mixins",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 10 — JavaScript Mixins & UI Components"
  },
  {
    question: "What are the three mixin patterns in Magento 2 JavaScript, and when do you use each?",
    answer: "Pattern 1: TargetModule.extend({}) for uiElement/uiComponent class-based targets (most common). Pattern 2: Wrapping a plain function module by returning a new function that calls the original via apply(). Pattern 3: Direct property patching on plain object modules by saving the original method reference and replacing it. You must identify the target module's type to choose the correct pattern.",
    hint: "The target could be a class, a function, or a plain object — each needs different wrapping.",
    topic: "JS Mixins",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 10 — JavaScript Mixins & UI Components"
  },
  {
    question: "Why is calling this._super() critical in mixin method overrides, especially in initialize()?",
    answer: "this._super() calls the parent class's version of the method, preserving its functionality. Without it, the parent logic is completely lost — in the case of initialize(), the entire component setup (observables, bindings, child components) would be skipped, likely breaking the checkout or other critical flows. This is explicitly highlighted in exam objectives as a common mistake.",
    hint: "The parent method contains essential setup that your override must not silently skip.",
    topic: "JS Mixins",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 10 — JavaScript Mixins & UI Components"
  },
  {
    question: "How do Knockout.js observables work, and what is the critical mistake to avoid when setting their values?",
    answer: "Observables are special variables that notify subscribers when values change, triggering UI re-renders. Get a value by calling it as a function with no arguments: this.name(). Set a value by calling it with the new value: this.name('Jane'). NEVER use = assignment (this.name = 'Jane') as this replaces the observable itself with a plain value, destroying all KO bindings permanently.",
    hint: "Observables are functions — reading and writing both use function call syntax.",
    topic: "Knockout.js",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 10 — JavaScript Mixins & UI Components"
  },
  {
    question: "What is the difference between ko.observable, ko.computed, and ko.observableArray?",
    answer: "ko.observable wraps a single value that auto-notifies on change. ko.computed automatically recalculates whenever any dependent observable changes (pass 'this' as second argument for context). ko.observableArray wraps an array with mutation methods (push, pop, remove) that trigger UI updates. ko.pureComputed is a memory-efficient alternative for read-only computeds.",
    hint: "One wraps values, one derives values, and one wraps arrays — each with different reactive behavior.",
    topic: "Knockout.js",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 10 — JavaScript Mixins & UI Components"
  },
  {
    question: "What is the difference between uiElement and uiComponent (uiCollection) in Magento 2?",
    answer: "uiElement is a single component without child management — it has defaults, lifecycle methods (initialize, initObservable), and component communication (links, imports, exports). uiComponent is actually an alias for uiCollection (NOT uiElement), which extends uiElement and adds child-management capabilities including an 'elems' observable array of child instances. Most components extend uiComponent.",
    hint: "One is a standalone component; the other manages a collection of children.",
    topic: "UI Components",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 10 — JavaScript Mixins & UI Components"
  },
  {
    question: "How do defaults.tracks work in a uiElement-based component?",
    answer: "Properties listed in the defaults.tracks object are automatically converted to Knockout observables by uiElement — you do NOT need to manually call ko.observable() for them. For example, tracks: { myValue: true, isActive: true } makes both properties reactive. You can also manually track properties using this.track({}) in initObservable(). This is a key convenience of the UI component system.",
    hint: "This feature eliminates manual observable creation for tracked properties.",
    topic: "UI Components",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 10 — JavaScript Mixins & UI Components"
  },
  {
    question: "What are the KO binding context variables available inside a foreach loop?",
    answer: "$data refers to the current context object, $root to the root ViewModel, $parent to one level up, $parents[n] for n levels up, $index for the current array index (which is itself an observable — must call $index() to get the number), and $element for the DOM element. Inside foreach, the default context becomes the array item.",
    hint: "Special dollar-prefixed variables let you navigate the binding context hierarchy.",
    topic: "Knockout.js",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 10 — JavaScript Mixins & UI Components"
  },
  {
    question: "What happens when multiple mixins target the same JavaScript module?",
    answer: "Stacked mixins are applied in sequence based on module load order (defined by 'sequence' in module.xml). Each mixin in the chain receives the already-mixed version of the module, not the original. So _super() in a later mixin calls the previous mixin's version of the method, not necessarily the core method. All mixins declared for a target are additive — they all apply.",
    hint: "Each mixin builds on top of the previous one, forming a chain.",
    topic: "JS Mixins",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 10 — JavaScript Mixins & UI Components"
  },
  {
    question: "What are the three pillars of a Magento 2 UI Component?",
    answer: "1) JavaScript Component (uiElement/uiCollection) that defines behavior, observables, and methods. 2) XML Configuration (ui_component XML file) that declares the component tree, arguments, and data source. 3) PHP Data Provider (DataProvider class) that feeds data to the JS component via AJAX/JSON. The XML dataSource element's 'class' points to the PHP class, while the 'component' attribute points to a JS module.",
    hint: "JS for behavior, XML for structure, PHP for data — each file type has a distinct role.",
    topic: "UI Components",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 10 — JavaScript Mixins & UI Components"
  },
  {
    question: "What is the correct structure for a mixin file, and what is the most common structural mistake?",
    answer: "A mixin file must return a function that accepts the target module and returns the modified version: define([], function(){ return function(Target){ return Target.extend({...}); }; }). The most common mistake is forgetting the outer function wrapper — returning the extended component directly instead of a function that receives the target. Without the wrapper, the target module is not in scope.",
    hint: "There must be two levels of return — the outer function and the inner extension.",
    topic: "JS Mixins",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 10 — JavaScript Mixins & UI Components"
  },
  {
    question: "How do observableArray mutations differ from regular array mutations in Knockout.js?",
    answer: "Observable array mutations (.push(), .pop(), .remove()) must be called on the observable directly (this.cartItems.push(item)), not on the unwrapped array. Calling mutations on this.cartItems() returns the plain JS array, and pushing to it would NOT trigger UI updates. Also, .remove() is a KO-specific method not available on plain arrays — it accepts a value or predicate function.",
    hint: "Call array methods on the observable function itself, not on the unwrapped result.",
    topic: "Knockout.js",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 10 — JavaScript Mixins & UI Components"
  },
  {
    question: "Why must ko.computed() receive 'this' as a second argument?",
    answer: "When using 'this' inside a computed function to access observables (e.g., this.firstName() + this.lastName()), the second argument binds the correct 'this' context. Without it, 'this' inside the function body would be undefined or window, causing the computed to fail. The pattern is ko.computed(function(){ return this.prop(); }, this). For ko.pureComputed with read/write, use the 'owner' property instead.",
    hint: "JavaScript function context is not automatically inherited — it must be explicitly bound.",
    topic: "Knockout.js",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 10 — JavaScript Mixins & UI Components"
  },
  {
    question: "What are the links, imports, and exports properties in a uiElement component, and how do they differ?",
    answer: "These are component communication mechanisms in defaults. 'links' provides two-way synchronization between this component's property and another component's property. 'imports' provides one-way sync FROM another component TO this component. 'exports' provides one-way sync FROM this component TO another. They use the syntax '${ $.provider }:data.value' to reference other components' properties by name.",
    hint: "Three communication directions: bidirectional, inbound-only, and outbound-only.",
    topic: "UI Components",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 10 — JavaScript Mixins & UI Components"
  },
  {
    question: "What is the difference between the 'if' and 'visible' bindings in Knockout.js?",
    answer: "The 'visible' binding shows or hides an element using CSS display (the element stays in the DOM). The 'if' binding conditionally adds or removes the element from the DOM entirely — when false, the element and its children are completely removed. 'ifnot' is the inverse of 'if'. Use 'visible' for simple show/hide toggling; use 'if' when you need to prevent rendering or release resources.",
    hint: "One toggles CSS visibility; the other physically adds or removes DOM nodes.",
    topic: "Knockout.js",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 10 — JavaScript Mixins & UI Components"
  },
  {
    question: "What is the full command syntax for Static Content Deployment (SCD) in Magento 2, and what does the -f flag do?",
    answer: "The syntax is: bin/magento setup:static-content:deploy [options] [locale...]. The -f (--force) flag is required to run SCD in developer mode — without it, SCD throws an error in developer mode. In production mode, -f is not needed. SCD compiles LESS into CSS, copies static files to pub/static/, generates the aggregated requirejs-config.js, and creates the deployed_version.txt cache-busting file.",
    hint: "There is a flag needed specifically for developer mode, and the command takes locale codes as positional arguments.",
    topic: "CLI Commands",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 15 — CLI Commands for Frontend Development"
  },
  {
    question: "What is the difference between cache:clean and cache:flush in Magento 2?",
    answer: "cache:clean is selective — it only invalidates and removes Magento-managed cache entries, leaving other applications sharing the same storage untouched. cache:flush is destructive — it empties the entire cache storage backend (Redis DB, file directory, etc.), potentially affecting other applications sharing the same Redis instance. Use cache:clean for routine config/layout/template changes; use cache:flush when you suspect cache corruption.",
    hint: "One targets only Magento's own cache entries, the other wipes the entire storage backend.",
    topic: "CLI Commands",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 15 — CLI Commands for Frontend Development"
  },
  {
    question: "What are the three most important cache type codes for frontend development in Magento 2?",
    answer: "The three most important frontend cache types are: layout (processed XML layout handles — flush after layout XML changes), block_html (rendered block HTML output — flush after template/block changes), and full_page (full page cache/FPC — flush after any visible frontend change). The typical command after frontend template changes is: bin/magento cache:clean layout block_html full_page.",
    hint: "Think about what needs to be regenerated when you change layout files, templates, or anything visible on the storefront.",
    topic: "CLI Commands",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 15 — CLI Commands for Frontend Development"
  },
  {
    question: "How do you enable template hints via the CLI, and what scope does the CLI command affect?",
    answer: "Use bin/magento dev:template-hints:enable to enable and dev:template-hints:disable to disable. The CLI command accepts no options and always saves to the default scope (scope ID 0). For per-store-view template hints, you must use the Admin UI at Stores > Configuration > Advanced > Developer > Debug. After enabling, you must clear the block_html cache with bin/magento cache:clean block_html for hints to appear.",
    hint: "The CLI command is simple but limited in scope — the admin offers more granular control.",
    topic: "CLI Commands",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 15 — CLI Commands for Frontend Development"
  },
  {
    question: "What happens when you run deploy:mode:set production, and what does the --skip-compilation flag do?",
    answer: "Running deploy:mode:set production automatically runs both SCD (Static Content Deployment) and DI (Dependency Injection) compilation unless you pass the --skip-compilation flag. In contrast, deploy:mode:set developer does NOT run SCD — assets are generated on demand. Use deploy:mode:show to check the current mode. The --skip-compilation flag is useful when you want to handle SCD and DI compilation separately.",
    hint: "Switching to production mode triggers a complete build pipeline by default.",
    topic: "CLI Commands",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 15 — CLI Commands for Frontend Development"
  },
  {
    question: "In developer mode, what happens when a static file is requested that doesn't exist in pub/static/?",
    answer: "Magento uses a fallback mechanism: it checks the theme, then parent theme, then module, then lib/web directories. If the file is a LESS file, it compiles it on the fly. It then creates a symlink in pub/static/ pointing to the source file and serves the result. This is why developer mode doesn't require SCD — assets are generated on-demand per request, though with a performance penalty.",
    hint: "The system has a cascading search through multiple directories and creates links to the source rather than copies.",
    topic: "CLI Commands",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 15 — CLI Commands for Frontend Development"
  },
  {
    question: "What is the correct order of Grunt commands for a full theme recompilation?",
    answer: "The correct order is: grunt clean:<theme> (removes compiled CSS from pub/static), then grunt exec:<theme> (copies/executes static file fallback to pub/static), then grunt less:<theme> (compiles LESS to CSS). Skipping exec before less can result in outdated source files being compiled. After these commands, also run bin/magento cache:clean layout block_html. For ongoing development, use grunt watch to auto-recompile on file changes.",
    hint: "Clean first, then prepare the source files, then compile — order matters.",
    topic: "CLI Commands",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 15 — CLI Commands for Frontend Development"
  },
  {
    question: "What does the --no-html-minify flag do in SCD, and does it affect CSS/JS minification?",
    answer: "The --no-html-minify flag prevents HTML whitespace removal from source .phtml template files. Without this flag, .phtml templates are minified and stored in var/view_preprocessed/. This flag does NOT affect CSS or JS minification — those are controlled separately by dev/css/minify_files and dev/js/minify_files config settings. Use this flag when you need readable HTML in browser DevTools for debugging.",
    hint: "This flag only affects template files, not stylesheets or scripts — those have their own config settings.",
    topic: "CLI Commands",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 15 — CLI Commands for Frontend Development"
  },
  {
    question: "How does the pub/static/deployed_version.txt file work for cache busting in Magento 2?",
    answer: "Every SCD run writes a Unix timestamp to pub/static/deployed_version.txt. This version string is embedded in static asset URLs as 'version' followed by the timestamp (e.g., /pub/static/version1702390445/frontend/.../styles-m.css). When SCD runs again with new assets, the timestamp changes, creating new URLs that force browsers to download fresh files instead of serving cached versions.",
    hint: "The version number changes with each deployment, making all asset URLs unique.",
    topic: "CLI Commands",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 15 — CLI Commands for Frontend Development"
  },
  {
    question: "What are the three SCD deployment strategies available via the -s flag, and which is the default?",
    answer: "The three strategies are: quick (default on-premise, fastest with minimal file operations), standard (full deployment per locale, slowest but most compatible), and compact (shared base with locale-specific overrides, less disk usage). Quick uses aggressive symlinks and sharing. Standard deploys all theme/locale combinations fully independently. Compact reuses shared base files across locales to reduce redundancy.",
    hint: "The default strategy prioritizes speed, while the others trade speed for completeness or disk efficiency.",
    topic: "CLI Commands",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 15 — CLI Commands for Frontend Development"
  },
  {
    question: "What is the key difference between developer mode and production mode regarding static file handling in pub/static/?",
    answer: "In developer mode, pub/static/ uses symlinks pointing to the actual source files, and LESS is compiled on page load — no SCD is needed. In production mode, pub/static/ contains physical file copies that are pre-compiled by SCD. If pub/static/ is missing or stale in production mode, users see 404 errors for CSS/JS. Production mode serves static files directly through the web server without involving Magento PHP.",
    hint: "One mode creates shortcuts to source files, the other creates independent copies.",
    topic: "CLI Commands",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 15 — CLI Commands for Frontend Development"
  },
  {
    question: "What is the static file fallback chain priority in Magento 2 for modular files?",
    answer: "For modular files, the fallback priority from highest to lowest is: 1) app/design/frontend/<Vendor>/<theme>/<Module_Name>/web/ (theme override), 2) Parent theme's equivalent path (recursive through all parents), 3) vendor/<Vendor>/<Module>/view/frontend/web/ (module area-specific), 4) vendor/<Vendor>/<Module>/view/base/web/ (module base area, shared between frontend and adminhtml). SCD resolves this chain and copies the winning file to pub/static/.",
    hint: "Theme overrides come first, then parent themes, then module-specific, then the base area catch-all.",
    topic: "CLI Commands",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 15 — CLI Commands for Frontend Development"
  },
  {
    question: "What SCD-related flags can you use to limit deployment to specific themes, locales, and areas?",
    answer: "Use -t (--theme) to limit to specific themes (e.g., -t Magento/luma), locale codes as positional arguments (e.g., en_US fr_FR), or -l (--language) as an alternative for locales. Use -a (--area) to limit to frontend or adminhtml. Use --exclude-theme or --exclude-area to skip specific themes or areas. Use -j (--jobs) for parallel processing. These flags help speed up deployment by targeting only what changed.",
    hint: "Multiple filtering flags let you deploy only the specific theme/locale/area combination you need.",
    topic: "CLI Commands",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 15 — CLI Commands for Frontend Development"
  },
  {
    question: "Why is Grunt faster than SCD for local frontend development?",
    answer: "Grunt only recompiles the changed LESS files for a single theme (taking 2-10 seconds), while SCD recompiles everything across all themes and locales (taking 30 seconds to 10+ minutes). Grunt also supports a watch mode that auto-recompiles on file changes, eliminating manual commands. Grunt does not require the Magento PHP application — it uses Node.js only. However, Grunt is not suitable for production deployment, where SCD is required.",
    hint: "The scope of what gets recompiled and the presence of file watching make a big difference.",
    topic: "CLI Commands",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 15 — CLI Commands for Frontend Development"
  },
  {
    question: "What does the templates/ directory inside pub/static/ contain, and how is it different from PHTML templates?",
    answer: "The templates/ directories inside pub/static/ contain Knockout JS .html templates — these are static web assets used by the frontend JavaScript framework for UI components (like checkout steps, minicart, etc.), NOT PHP .phtml templates. PHTML files are never stored in pub/static/ — they remain in the filesystem and are processed by PHP. When SCD uses --no-html-minify, it affects .phtml files stored in var/view_preprocessed/, not these Knockout templates.",
    hint: "These are JavaScript template files for Knockout.js, not server-side PHP templates.",
    topic: "CLI Commands",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 15 — CLI Commands for Frontend Development"
  },
  {
    question: "Where do default email template files live in a Magento 2 module, and what file extension do they use?",
    answer: "Default email template files live in <Module>/view/frontend/email/ directories and use the .html file extension. They are NOT in the templates/ directory like PHTML files. When customized through the Admin UI, the modified template is stored in the database (email_template table), overriding the file-based default. The original .html files are never modified by Admin saves.",
    hint: "Email templates are in a different subdirectory than PHTML templates, and they use a different file extension.",
    topic: "Email Templates",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 14 — Transactional Email Customization"
  },
  {
    question: "What is the difference between {{var}} and {{trans}} directives in Magento 2 email templates?",
    answer: "{{var}} outputs a dynamic variable value (e.g., {{var order.increment_id}}) and is auto-escaped by default. {{trans}} wraps static text for translation/localization (e.g., {{trans \"Thank you for your order.\"}}). {{trans}} strings are extracted into i18n/*.csv files. Use {{var}} for dynamic data and {{trans}} for user-visible static text that needs to be translatable.",
    hint: "One is for dynamic values from the system, the other is for translatable static strings.",
    topic: "Email Templates",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 14 — Transactional Email Customization"
  },
  {
    question: "How do you include the header and footer in a Magento 2 transactional email template?",
    answer: "The header is included using {{template config_path=\"design/email/header_template\"}} and the footer using {{template config_path=\"design/email/footer_template\"}}. These directives resolve the template ID stored at that config path in the admin and render it inline. The config paths point to template IDs set in Admin > Content > Design > Configuration.",
    hint: "A special directive resolves a config path to find which template to include.",
    topic: "Email Templates",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 14 — Transactional Email Customization"
  },
  {
    question: "After creating a custom email template in the admin, what additional step is required to make it active for order confirmation emails?",
    answer: "The custom template must be explicitly assigned in the Sales Emails configuration. Navigate to Stores > Configuration > Sales > Sales Emails > Order > New Order Confirmation Template and select the custom template from the dropdown. Saving the template alone in Marketing > Email Templates does not activate it. After assigning, flush the cache with bin/magento cache:flush.",
    hint: "Creating the template and assigning it are two separate steps in different admin sections.",
    topic: "Email Templates",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 14 — Transactional Email Customization"
  },
  {
    question: "Where is the transactional email logo configured in Magento 2, and what is its default width?",
    answer: "The email logo is configured under Content > Design > Configuration > [Store View] > Transactional Emails section, with fields for Logo Image, Logo Image Alt, Logo Width, and Logo Height. The default logo width is 180px, hardcoded as a fallback in header.html. The logo is stored in pub/media/email/logo/ and is separate from the storefront theme logo (header_logo_src).",
    hint: "The email logo configuration is under Content, not Marketing, and has a specific pixel fallback width.",
    topic: "Email Templates",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 14 — Transactional Email Customization"
  },
  {
    question: "Can you use PHP tags (<?php ?>) inside Magento 2 email templates?",
    answer: "No, you cannot use PHP tags inside email .html templates. Email templates use Magento's custom directive syntax processed by Magento\\Email\\Model\\Template\\Filter. You must use {{var}}, {{block}}, {{trans}}, {{if}}, {{depend}}, {{config}}, and {{layout}} directives instead. If you need complex PHP logic, use the {{block class='...' template='...'}} directive to render a PHP block with a PHTML template.",
    hint: "Email templates have their own rendering engine that is completely separate from the PHP template engine.",
    topic: "Email Templates",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 14 — Transactional Email Customization"
  },
  {
    question: "What is the difference between {{var order.increment_id}} and {{var order.getCustomerFirstname()}} in email template syntax?",
    answer: "{{var order.increment_id}} accesses a direct property using dot notation — no parentheses are needed. {{var order.getCustomerFirstname()}} calls a method on the object and requires parentheses. This is a key syntax distinction: properties use dot notation without parentheses, while method calls must include parentheses. Both are auto-escaped by default.",
    hint: "One accesses a data property directly, the other invokes a method — look at the parentheses.",
    topic: "Email Templates",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 14 — Transactional Email Customization"
  },
  {
    question: "Why must email templates use inline CSS and table-based layouts?",
    answer: "Most email clients (Gmail, Outlook, Apple Mail) strip <style> blocks and ignore external stylesheets. CSS must be applied as inline style attributes for consistent rendering. Similarly, CSS Grid and Flexbox are not supported by email clients, so table-based layouts must be used. Magento uses the Emogrifier library to automatically inline CSS from the Template Styles admin field into the HTML content.",
    hint: "Email clients have far more limited CSS support than web browsers.",
    topic: "Email Templates",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 14 — Transactional Email Customization"
  },
  {
    question: "How does the {{config path=\"...\"}} directive work in Magento 2 email templates?",
    answer: "The {{config path=\"...\"}} directive retrieves a system configuration value and outputs it directly in the email template. For example, {{config path=\"general/store_information/name\"}} outputs the store name. This allows templates to pull configuration values without needing them to be passed as template variables, making templates more dynamic and reducing the need for custom variable passing.",
    hint: "This directive reads directly from Magento's system configuration using the standard config path format.",
    topic: "Email Templates",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 14 — Transactional Email Customization"
  },
  {
    question: "What does the |raw modifier do in email template variables, and when should you use it?",
    answer: "The |raw modifier disables the default auto-escaping that Magento applies to {{var}} and {{trans}} output. By default, variables are auto-escaped (the |escape modifier is applied implicitly). Use |raw when the variable contains HTML that should be rendered as-is, such as {{var formattedShippingAddress|raw}}. Without |raw, HTML tags in the variable would be displayed as plain text.",
    hint: "By default, output is sanitized for security — this modifier bypasses that for trusted HTML content.",
    topic: "Email Templates",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 14 — Transactional Email Customization"
  },
  {
    question: "What are the key differences between email templates (.html) and PHTML templates (.phtml) in Magento 2?",
    answer: "Email templates use .html extension and {{var}}, {{trans}}, {{if}} directives processed by Template\\Filter; PHTML uses .phtml extension with standard PHP (<?= $block->getName() ?>). Email uses {{block class=''}} for block rendering; PHTML uses $block->getChildHtml(). Email templates are admin-editable and stored in the database when customized; PHTML files are filesystem-only. Email output is auto-escaped by default; PHTML requires manual $block->escapeHtml().",
    hint: "They use completely different rendering engines, syntax, storage mechanisms, and escaping behavior.",
    topic: "Email Templates",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 14 — Transactional Email Customization"
  },
  {
    question: "How does email template scope assignment work in a multi-language Magento 2 setup?",
    answer: "Email template assignment respects Magento's standard config scope hierarchy: Default > Website > Store View. Different templates can be assigned per store view by changing the scope selector in Stores > Configuration before saving. This enables multi-language setups where each store view (e.g., French, German) can have its own translated template. You MUST change the scope selector before saving — otherwise you overwrite the global setting.",
    hint: "The scope dropdown in the configuration area is critical — missing it affects all stores.",
    topic: "Email Templates",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 14 — Transactional Email Customization"
  },
  {
    question: "What does the Admin email template preview show, and what are its limitations?",
    answer: "The Admin preview renders the email template in the browser with directives processed, showing the logo, header/footer, and CSS styling. However, it uses mock/empty variable values — not real transaction data — so {{var order.increment_id}} shows empty or sample values. The preview also cannot simulate how different email clients render the HTML. For accurate testing, use services like Litmus or Email on Acid, or place a test order.",
    hint: "The preview processes the template engine but lacks real data and email-client fidelity.",
    topic: "Email Templates",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 14 — Transactional Email Customization"
  },
  {
    question: "What is the {{block}} directive used for in Magento 2 email templates, and how is it different from {{var}}?",
    answer: "The {{block}} directive renders a full Magento PHP block class with a PHTML template inside the email, for example: {{block class='Magento\\Framework\\View\\Element\\Template' template='Magento_Sales::email/order/items.phtml'}}. It is used for complex HTML structures that require PHP logic. {{var}} simply outputs a single variable value. They are not interchangeable — {{block}} executes PHP code while {{var}} just displays data.",
    hint: "One outputs a simple value, the other instantiates a PHP class and renders a full template.",
    topic: "Email Templates",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 14 — Transactional Email Customization"
  },
  {
    question: "What is the navigation path for managing email templates in the Magento 2 admin, and what operations can you perform there?",
    answer: "Navigate to Admin > Marketing > Communications > Email Templates. From there you can: view all custom (database-stored) templates, add a new template by loading a default template as a starting point, edit existing custom templates, preview templates with sample data, and delete custom templates (which reverts to the module default). When adding a new template, you select the base template and locale, then click Load Template to populate the editor.",
    hint: "The path goes through Marketing, not Content or Stores.",
    topic: "Email Templates",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 14 — Transactional Email Customization"
  },
  {
    question: "What is the magento-cloud CLI tool and how is it different from bin/magento?",
    answer: "The magento-cloud CLI is the official command-line interface for Adobe Commerce on Cloud Infrastructure, separate from bin/magento. It manages cloud-specific operations like SSH access to environments, file transfers, and deployments. bin/magento handles Magento application tasks (cache, SCD, module management). You must run magento-cloud auth:login to authenticate before using project-specific commands. Projects have hierarchical environments: Production > Staging > Integration.",
    hint: "One manages the cloud infrastructure and environments, the other manages the Magento application itself.",
    topic: "Cloud CLI",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 16 — Commerce Cloud CLI & Frontend Tools"
  },
  {
    question: "What are the three deployment phases in Adobe Commerce Cloud, and in which phase should SCD run to minimize downtime?",
    answer: "The three phases are: Build (read-only filesystem, no DB access, site stays up), Deploy (maintenance mode ON, DB access, migrations run), and Post-Deploy (site is live, cache warm-up, indexing). SCD should run in the Build phase to minimize downtime because the build runs on a separate container while the live site continues serving traffic. Running SCD in the Deploy phase increases downtime since the site is in maintenance mode during that time.",
    hint: "Only one phase keeps the site available to users, and that is where long-running processes like SCD should execute.",
    topic: "Cloud CLI",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 16 — Commerce Cloud CLI & Frontend Tools"
  },
  {
    question: "What is SCD_ON_DEMAND and why should it never be used in production?",
    answer: "SCD_ON_DEMAND (set to true in .magento.env.yaml under stage.global) makes static content generated on the first HTTP request that needs it, rather than during build or deploy. This is unsuitable for production because the first user after deployment triggers file generation, experiencing 2-15 second delays and possibly seeing unstyled pages. It is designed only for development/integration environments where fast iteration matters more than first-request performance.",
    hint: "Lazy generation saves deployment time but punishes real users who are the first to request each asset.",
    topic: "Cloud CLI",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 16 — Commerce Cloud CLI & Frontend Tools"
  },
  {
    question: "What is the difference between SKIP_SCD and SCD_ON_DEMAND in Adobe Commerce Cloud?",
    answer: "SKIP_SCD completely bypasses Static Content Deployment with no fallback generation — assets must already exist elsewhere (typically on an external CDN). SCD_ON_DEMAND also skips SCD during deployment but generates assets lazily on the first HTTP request. SKIP_SCD is suitable for production when using a CDN with pre-built assets. SCD_ON_DEMAND is only suitable for dev/integration environments due to slow first-request performance.",
    hint: "One has a fallback mechanism for missing files, the other has no fallback at all.",
    topic: "Cloud CLI",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 16 — Commerce Cloud CLI & Frontend Tools"
  },
  {
    question: "What does the magento-cloud mount:download command do, and what is the common mistake developers make with it?",
    answer: "mount:download pulls files from a cloud environment's writable mount to your local machine using rsync. For example: magento-cloud mount:download --mount pub/static --target ./pub/static. The common mistake is running mount:download expecting it to push local changes to the cloud — it actually does the opposite, overwriting local files with cloud versions. To push changes, use git commit followed by magento-cloud environment:push.",
    hint: "The 'download' direction goes FROM cloud TO local, and the only way to update cloud files is through the deployment pipeline.",
    topic: "Cloud CLI",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 16 — Commerce Cloud CLI & Frontend Tools"
  },
  {
    question: "In which Adobe Commerce Cloud environments is Fastly CDN active, and what serves static files in environments where Fastly is not active?",
    answer: "Fastly CDN is only active on Staging and Production environments (Cloud Pro plan). On Integration environments and local development, Fastly is NOT in the request path — Nginx on the origin server serves static files directly. This means you cannot test Fastly CDN caching, image optimization, or ESI behavior in integration environments. Testing these features requires access to Staging.",
    hint: "The CDN layer only exists in certain environment types — others go directly to the web server.",
    topic: "Cloud CLI",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 16 — Commerce Cloud CLI & Frontend Tools"
  },
  {
    question: "What are the three SCD_STRATEGY values in Adobe Commerce Cloud, and which is the default?",
    answer: "The three strategies are: compact (default on Cloud, moderate speed, reuses shared base files), standard (slowest, deploys all theme x locale combinations fully independently, highest disk usage), and quick (fastest, minimum file generation, aggressive sharing). Note that the on-premise CLI defaults to quick, while Cloud defaults to compact. The strategy is set via SCD_STRATEGY in .magento.env.yaml under stage.build or stage.deploy.",
    hint: "Cloud and on-premise have different default strategies — and the three options trade off speed vs. isolation.",
    topic: "Cloud CLI",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 16 — Commerce Cloud CLI & Frontend Tools"
  },
  {
    question: "How does Fastly Image Optimization (IO) handle WebP conversion on Adobe Commerce Cloud?",
    answer: "Fastly IO intercepts image requests and checks the browser's Accept header. If the browser supports WebP (sends Accept: image/webp), Fastly automatically converts JPEG/PNG images to WebP on-the-fly at the CDN edge, achieving 30-80% smaller file sizes. Browsers without WebP support receive the original format. This processing happens at the edge with no origin server CPU overhead, and is separate from Magento's native image resizing that writes to pub/media/cache/.",
    hint: "The conversion happens at the CDN edge based on what the browser says it can accept.",
    topic: "Cloud CLI",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 16 — Commerce Cloud CLI & Frontend Tools"
  },
  {
    question: "What is the .magento.env.yaml file and what SCD-related variables can be configured in it?",
    answer: "The .magento.env.yaml file is the primary configuration file for deployment behavior on Adobe Commerce Cloud, committed to the repository and version-controlled. Key SCD variables include: SCD_STRATEGY (compact/standard/quick), SCD_ON_DEMAND (true/false), SKIP_SCD (true/false), SCD_THREADS (parallel threads), SCD_COMPRESSION_LEVEL (0-9 gzip level), SCD_MAX_EXECUTION_TIME (timeout), and CLEAN_STATIC_FILES (clear pub/static before SCD). Variables under stage.build affect the build phase; stage.deploy affects the deploy phase; stage.global applies to all stages.",
    hint: "This YAML file is structured by deployment stages, with each stage having its own configuration scope.",
    topic: "Cloud CLI",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 16 — Commerce Cloud CLI & Frontend Tools"
  },
  {
    question: "How do you move SCD from the deploy phase to the build phase in Adobe Commerce Cloud?",
    answer: "In .magento.env.yaml, set SCD_STRATEGY under stage.build (e.g., SCD_STRATEGY: compact) and set SKIP_SCD: true under stage.deploy. This ensures SCD runs during the build phase (when the site is still up) and is skipped during the deploy phase (when the site is in maintenance mode). This is the primary way to reduce deployment downtime — the build phase runs on a separate container while the live site continues serving traffic.",
    hint: "You need to configure two sections of the YAML — enable SCD in one phase and disable it in the other.",
    topic: "Cloud CLI",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 16 — Commerce Cloud CLI & Frontend Tools"
  },
  {
    question: "What is Edge Side Includes (ESI) and how does it work with Fastly on Adobe Commerce Cloud?",
    answer: "ESI is an HTML markup standard that allows portions of a web page to be assembled at the CDN edge. Fastly serves the cached page frame (static header, footer, content) from its edge cache, then makes separate requests to the origin for dynamic ESI blocks (like cart summary, recently viewed, greeting widgets). This enables full-page caching while keeping personalized blocks dynamic. ESI blocks are fetched by Fastly, not by the browser — the user receives a fully assembled page.",
    hint: "The CDN serves most of the page from cache but fetches small personalized portions separately from the server.",
    topic: "Cloud CLI",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 16 — Commerce Cloud CLI & Frontend Tools"
  },
  {
    question: "What happens to static files that are directly edited via SSH on a Cloud production or staging environment?",
    answer: "Direct edits to pub/static/ files via SSH on production or staging environments are ephemeral — they will be overwritten on the next deployment when SCD runs again. The correct workflow is to edit LESS/CSS/JS source files in app/design/frontend/Vendor/Theme/web/, commit the changes to Git, and push via magento-cloud environment:push. The deployment pipeline then regenerates pub/static/ from source files.",
    hint: "The deployment pipeline regenerates all static assets from source, so manual edits to the output directory are temporary.",
    topic: "Cloud CLI",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 16 — Commerce Cloud CLI & Frontend Tools"
  },
  {
    question: "What frontend performance features does Adobe Commerce Cloud provide at the server/CDN level?",
    answer: "Adobe Commerce Cloud provides three key performance features: 1) Pre-compression — gzip and brotli versions of CSS/JS are generated at build time and served without runtime CPU cost, with brotli offering ~20% better compression than gzip. 2) HTTP/2 Push — the server proactively sends critical CSS/JS assets before the browser requests them, reducing waterfall delays. 3) ESI (Edge Side Includes) — enables full-page caching while keeping personalized blocks dynamic by having Fastly assemble pages from cached frames and fresh dynamic content.",
    hint: "These features work at the infrastructure level — compression, proactive delivery, and smart page assembly.",
    topic: "Cloud CLI",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 16 — Commerce Cloud CLI & Frontend Tools"
  },
  {
    question: "How does Fastly CDN handle cache purging when new static assets are deployed on Adobe Commerce Cloud?",
    answer: "Cache purging occurs through two mechanisms: URL versioning and explicit API calls. Each SCD run generates a new Unix timestamp in pub/static/deployed_version.txt, which changes all static asset URLs (e.g., /pub/static/version1680000000/... becomes /pub/static/version1690000000/...). Since the URL changes, Fastly treats it as a cache miss and fetches the fresh file from the origin. Explicit Fastly API purge calls also happen during post-deploy hooks.",
    hint: "The URLs for static files contain a changing version number, which naturally causes the CDN to fetch new content.",
    topic: "Cloud CLI",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 16 — Commerce Cloud CLI & Frontend Tools"
  },
  {
    question: "What does the magento-cloud environment:push command trigger, and why can't you just FTP files to production?",
    answer: "environment:push triggers the full build-deploy pipeline: Build phase (composer install, SCD if configured, asset compilation into read-only filesystem), Deploy phase (maintenance mode, DB migrations, SCD if configured, cache warm-up), and Post-Deploy phase (cache flush, search index updates). You cannot FTP files because production uses a managed pipeline — frontend changes must go through Git commits and the build/deploy process. Static assets are regenerated during the pipeline according to SCD configuration.",
    hint: "This command starts an entire automated pipeline, not just a file transfer.",
    topic: "Cloud CLI",
    examCode: "AD0-E726",
    studyNoteTitle: "Day 16 — Commerce Cloud CLI & Frontend Tools"
  }
];

async function main() {
  console.log("Seeding AD0-E726 flashcards...");
  let created = 0;
  let skipped = 0;

  for (const fc of flashcards) {
    const studyNote = await prisma.studyNote.findFirst({
      where: { title: fc.studyNoteTitle, certCode: "AD0-E726" }
    });

    if (!studyNote) {
      console.log(`  ⚠ Study note not found: ${fc.studyNoteTitle}`);
      skipped++;
      continue;
    }

    const existing = await prisma.flashcard.findFirst({
      where: { question: fc.question, studyNoteId: studyNote.id }
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.flashcard.create({
      data: {
        question: fc.question,
        answer: fc.answer,
        hint: fc.hint,
        topic: fc.topic,
        examCode: fc.examCode,
        studyNoteId: studyNote.id
      }
    });
    created++;
  }

  console.log(`Done! Created: ${created}, Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
