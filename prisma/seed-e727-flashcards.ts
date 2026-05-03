import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const flashcards = [
  {
    question: "What are the two compiled entry point LESS files in a Magento theme, and what does each one contain?",
    answer: "The two entry points are styles-m.less (mobile/all-screen styles, always loaded) and styles-l.less (large/desktop styles, loaded conditionally with media=\"screen and (min-width: 768px)\"). styles-m.less is the primary stylesheet containing most CSS, while styles-l.less is smaller and only contains desktop breakpoint overrides.",
    hint: "Think about Magento's mobile-first approach and the two CSS files loaded in the HTML head.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 8 — LESS Architecture: Compiled vs Partial Files"
  },
  {
    question: "What is the difference between @import and //@magento_import in Magento's LESS files?",
    answer: "@import is a standard LESS directive that imports one specific file following the fallback chain. //@magento_import is a Magento-specific preprocessor directive (despite appearing commented out) that collects matching files from ALL active modules and appends them. For example, //@magento_import 'source/_module.less' pulls in _module.less from every module that has one.",
    hint: "One is standard LESS, the other is processed by Magento's preprocessor and looks like a comment.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 8 — LESS Architecture: Compiled vs Partial Files"
  },
  {
    question: "When should you use _extend.less vs _theme.less for style customizations in a Magento theme?",
    answer: "Use _extend.less when modifying styles for a specific module — it lives in <theme>/Magento_ModuleName/web/css/source/_extend.less and adds/overrides rules for that module. Use _theme.less for global theme-wide styles and variable overrides not tied to any specific module — it lives in <theme>/web/css/source/_theme.less. _extend.less is processed after _theme.less in the import chain.",
    hint: "Consider whether the style change is scoped to a single module or applies across the entire theme.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 8 — LESS Architecture: Compiled vs Partial Files"
  },
  {
    question: "Why should child themes use _theme.less for variable overrides instead of _variables.less?",
    answer: "The fallback mechanism replaces files wholesale — if your child theme has a _variables.less, it completely replaces the parent theme's _variables.less, wiping out all variables the parent defined. _theme.less is imported after the full variable stack is loaded, so your declarations layer on top via LESS lazy evaluation (last-definition-wins) without losing the parent's definitions.",
    hint: "Think about what happens when the fallback mechanism picks one file per path.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 8 — LESS Architecture: Compiled vs Partial Files"
  },
  {
    question: "What is the correct import order priority for LESS files in Magento, from lowest to highest?",
    answer: "The priority from lowest to highest is: 1) lib/web/css/ library variable defaults, 2) theme source/_variables.less (parent theme overrides), 3) Module _module.less files (base component styles), 4) _theme.less (theme variable overrides), 5) Module _extend.less files (highest priority, loaded last). Later declarations win when specificity is equal.",
    hint: "Think about the CSS cascade — which files are imported last in styles-m.less?",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 8 — LESS Architecture: Compiled vs Partial Files"
  },
  {
    question: "How does LESS compilation work in developer mode vs production mode in Magento?",
    answer: "In developer mode, LESS is compiled server-side on request by PHP (via static.php) — the browser never compiles LESS. Alternatively, developers can use Grunt to pre-compile. In production mode, you must run bin/magento setup:static-content:deploy to compile LESS to CSS before it is available to browsers. There is no on-demand compilation in production.",
    hint: "One mode compiles on-the-fly, the other requires an explicit deployment step.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 8 — LESS Architecture: Compiled vs Partial Files"
  },
  {
    question: "What is the role of _module.less when placed in a theme's module override folder?",
    answer: "_module.less in a theme's module folder (e.g., <theme>/Magento_Catalog/web/css/source/_module.less) completely replaces the core module's _module.less — it is a full replacement, not an addition. The fallback mechanism picks one file per path, with the theme's version winning over the module source. If you only want to add/modify specific rules, use _extend.less instead.",
    hint: "Consider whether this file merges with or replaces the original module styles.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 8 — LESS Architecture: Compiled vs Partial Files"
  },
  {
    question: "Where does the Magento UI Library live, and what is its purpose?",
    answer: "The Magento UI Library lives at lib/web/css/source/lib/ — it is outside any theme directory and is part of the Magento framework itself. It provides reusable LESS mixins (prefixed with .lib-*) and default variable declarations for UI components like buttons, forms, typography, and icons. You should never edit these files directly; instead, override variables in your theme's _theme.less.",
    hint: "It is a shared resource available to all themes, similar to a CSS framework like Bootstrap.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 8 — LESS Architecture: Compiled vs Partial Files"
  },
  {
    question: "What naming convention does Magento use for LESS variables, and what do double underscores signify?",
    answer: "Magento follows the pattern @component__property (e.g., @button__background, @navigation__color). Double underscores separate the component name from the property or state. State segments also use double underscores: @button__hover__background. Sub-elements or variants use a single dash: @button-primary__background. This is a Magento convention, not a LESS requirement.",
    hint: "Look at the separators between component names, states, and properties.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 8 — LESS Architecture: Compiled vs Partial Files"
  },
  {
    question: "How does the Magento fallback mechanism differ from //@magento_import when resolving LESS files?",
    answer: "These operate at different levels. The fallback chain works within one module's slot — it picks ONE file (theme's file wins over module's file) as a replacement. //@magento_import operates across modules — it collects one file per module and appends them all together. So for Magento_Catalog/_module.less, fallback picks the winning file for that module, while //@magento_import ensures all modules' files get included.",
    hint: "One mechanism selects which version of a file to use; the other gathers files from multiple modules.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 8 — LESS Architecture: Compiled vs Partial Files"
  },
  {
    question: "What files and directories must be cleared after making LESS changes in developer mode?",
    answer: "You must clear pub/static/frontend/ (compiled static assets) and var/view_preprocessed/ (intermediate preprocessed LESS files with resolved imports), then flush the cache with bin/magento cache:flush. Without clearing both directories plus the cache, stale compiled files may continue to be served.",
    hint: "There are two directories to remove and a cache operation to run.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 8 — LESS Architecture: Compiled vs Partial Files"
  },
  {
    question: "How does styles-l.css get loaded in the browser, and what makes it different from styles-m.css?",
    answer: "In default_head_blocks.xml, styles-l.css is loaded with a media attribute: media=\"screen and (min-width: 768px)\", meaning it only applies on screens 768px and wider. styles-m.css has no media restriction and always loads on all devices. This implements Magento's mobile-first approach where base styles are in styles-m and desktop overrides are in styles-l.",
    hint: "Check the layout XML head section for how CSS files are loaded with media conditions.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 8 — LESS Architecture: Compiled vs Partial Files"
  },
  {
    question: "Why does LESS variable overriding work in Magento through _theme.less without losing parent theme values?",
    answer: "LESS uses lazy evaluation where the last definition of a variable wins, regardless of declaration order. Since _theme.less is imported after the library variables and parent theme variables are loaded, any variable you redeclare in _theme.less overrides the earlier definitions. All component LESS files reference variables rather than hard-coded values, so changing a variable automatically updates all components that use it.",
    hint: "Think about how LESS resolves variables — is it first-definition or last-definition wins?",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 8 — LESS Architecture: Compiled vs Partial Files"
  },
  {
    question: "What is the purpose of _widgets.less and where is it located in a theme's directory structure?",
    answer: "_widgets.less contains styles specific to Magento CMS Widgets (components placed via the admin panel). It is located at <theme>/Magento_ModuleName/web/css/source/_widgets.less (e.g., Magento_Cms/web/css/source/_widgets.less). It is collected by //@magento_import along with other widget files from active modules and is scoped to widget-specific styling for that module.",
    hint: "This partial file is for styling admin-placed CMS components and is collected from all modules.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 8 — LESS Architecture: Compiled vs Partial Files"
  },
  {
    question: "What is the role of lib/web/ in the Magento static file fallback chain?",
    answer: "lib/web/ is the lowest-priority fallback layer in Magento's file resolution. During static content deployment (or on-request in developer mode), Magento materializes all files into pub/static/. Files from lib/web/ fill in any paths not covered by the theme or parent themes. This is how the UI library's _lib.less and its imports resolve correctly — the files land in the materialized directory under the correct relative paths.",
    hint: "It serves as the final fallback when neither the current theme nor parent themes provide a file.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 8 — LESS Architecture: Compiled vs Partial Files"
  },
  {
    question: "What does the .lib-css() utility mixin do, and what happens when a variable is set to false?",
    answer: ".lib-css() is a Magento UI Library utility mixin that conditionally outputs a CSS property only if the value is not false. For example, .lib-css(color, @link__color) outputs the color property only if @link__color has a real value. Setting a variable to false (e.g., @link__font-weight: false) suppresses that CSS property entirely from the compiled output.",
    hint: "This mixin acts as a conditional output gate based on the variable's value.",
    topic: "UI Library",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 9 — Working with LESS & UI Library Components"
  },
  {
    question: "What is the difference between @import and @import (reference) in LESS, and when would you use each?",
    answer: "@import 'file.less' is a standard import that outputs CSS rules if any are present in the imported file. @import (reference) 'file.less' imports the file's mixins and variables WITHOUT emitting any CSS output. Use (reference) when you only need access to a library's tools (mixins/variables) without dumping its raw CSS into your stylesheet.",
    hint: "One outputs CSS, the other only makes definitions available for use.",
    topic: "UI Library",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 9 — Working with LESS & UI Library Components"
  },
  {
    question: "How does the .media-width() mixin work, and why does 'max' use a -1px offset while 'min' does not?",
    answer: ".media-width() is called by your code, but the @media wrapper is defined in _responsive.less. For 'min' queries, the exact breakpoint value is used as the inclusive lower bound (e.g., min-width: 768px). For 'max' queries, Magento subtracts 1px to create an exclusive upper bound (e.g., max-width: 639px for @screen__s of 640px). This prevents a 1px overlap where a device could match both max and min queries simultaneously.",
    hint: "Think about what happens at the exact breakpoint pixel value if both max and min used the same number.",
    topic: "Responsive Design",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 9 — Working with LESS & UI Library Components"
  },
  {
    question: "What are the six standard breakpoint variables in Magento, and which one is the primary mobile/desktop threshold?",
    answer: "The six breakpoint variables defined in lib/web/css/source/lib/variables/_responsive.less are: @screen__xxs (320px), @screen__xs (480px), @screen__s (640px), @screen__m (768px), @screen__l (1024px), and @screen__xl (1440px). @screen__m at 768px is the primary breakpoint dividing mobile from desktop styles, used throughout the responsive system.",
    hint: "The main breakpoint uses the 'm' suffix and corresponds to the tablet/desktop threshold.",
    topic: "Responsive Design",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 9 — Working with LESS & UI Library Components"
  },
  {
    question: "How do @media-target and @media-common control which CSS is output in styles-m.css vs styles-l.css?",
    answer: "These are LESS compile-time conditional flags. In styles-m.less, @media-target is 'mobile' and @media-common is true, so it outputs mobile-targeted blocks plus all common (non-breakpoint-specific) styles. In styles-l.less, @media-target is 'desktop' and @media-common is false, so it outputs only desktop-targeted blocks and skips common styles (already in styles-m.css). LESS 'when' guards evaluate these at compile time to skip entire blocks.",
    hint: "These are compile-time flags, not runtime CSS features — they control what gets emitted during compilation.",
    topic: "Responsive Design",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 9 — Working with LESS & UI Library Components"
  },
  {
    question: "What happens when you override @screen__m in your theme's _theme.less, and why is this powerful?",
    answer: "Overriding @screen__m cascades automatically to ALL components that reference this breakpoint variable throughout the entire UI library and theme. Navigation, header layout, product grid columns, footer columns, checkout layout, and every other component using @screen__m will adjust to the new value. You do not need to update each component individually because they all reference the same variable.",
    hint: "Think about how variable references propagate through the entire component system.",
    topic: "Responsive Design",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 9 — Working with LESS & UI Library Components"
  },
  {
    question: "How does .lib-button-primary() relate to .lib-button(), and do you need to call both?",
    answer: ".lib-button-primary() internally calls .lib-button() first to apply all base button styles, then adds the primary-specific overrides (background, border, color, hover/active states). You do NOT need to call both — calling .lib-button-primary() alone gives you the complete base + primary button styling. The mixin reads from global variables like @button-primary__background that you can override in _theme.less.",
    hint: "Check whether the primary variant includes or extends the base mixin internally.",
    topic: "UI Library",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 9 — Working with LESS & UI Library Components"
  },
  {
    question: "What is the naming convention for all Magento UI Library mixins, and why does this matter?",
    answer: "All Magento UI Library mixins are prefixed with .lib-* (e.g., .lib-button(), .lib-font-size(), .lib-clearfix(), .lib-visually-hidden()). This naming convention distinguishes them from third-party or custom mixins, making it clear which mixins are provided by the Magento framework. The library emits no CSS by itself — CSS is only output when theme files call a mixin.",
    hint: "Look at the common prefix pattern across all built-in Magento mixins.",
    topic: "UI Library",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 9 — Working with LESS & UI Library Components"
  },
  {
    question: "Are styles-m.less and styles-l.less dependent on each other, and how do they share common code?",
    answer: "styles-m.less and styles-l.less are independent entry points — styles-l.less does NOT import styles-m.less. Both independently import the same shared base _styles.less, which pulls in the UI library, theme sources, and components. The key difference is the @media-target flag ('mobile' vs 'desktop') and @media-common flag (true vs false), which control which breakpoint blocks and common styles each file emits.",
    hint: "They share a common base file but do not import each other.",
    topic: "Responsive Design",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 9 — Working with LESS & UI Library Components"
  },
  {
    question: "What is the correct pattern for writing responsive styles in a Magento module's _extend.less file?",
    answer: "Use three guard patterns: 1) '& when (@media-common = true)' for styles that apply everywhere, 2) '& when (@media-target = \"mobile\"), (@media-target = \"all\")' wrapping '@media all and (max-width: (@screen__m - 1))' for mobile-only styles, and 3) '& when (@media-target = \"desktop\"), (@media-target = \"all\")' wrapping '@media all and (min-width: @screen__m)' for desktop-only styles.",
    hint: "You need compile-time LESS guards around your runtime @media queries.",
    topic: "Responsive Design",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 9 — Working with LESS & UI Library Components"
  },
  {
    question: "What distinguishes variable-driven mixins from parameterized mixins in the Magento UI Library?",
    answer: "Variable-driven mixins (the most common type) take no arguments and read from global @variables. You customize them by overriding those variables in _theme.less (e.g., @button__background). Parameterized mixins accept arguments directly when called (e.g., .lib-font-size(@_font-size)). The correct customization approach for most cases is variable overrides in _theme.less, not passing parameters directly.",
    hint: "One type reads from global state, the other accepts inline arguments.",
    topic: "UI Library",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 9 — Working with LESS & UI Library Components"
  },
  {
    question: "Is the Magento UI Library different between Community Edition (CE) and Enterprise Edition (EE)?",
    answer: "No — the lib/web/css/source/lib/ UI library is identical in both CE and EE. EE does not modify the core library. Instead, EE adds styles through separate module-level LESS files (e.g., module-b2b, module-company, module-gift-registry) that use the same .lib-* mixins and @variable system. The additional EE modules integrate seamlessly with the existing theme system.",
    hint: "EE extends through module-level styles, not by modifying the shared library.",
    topic: "UI Library",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 9 — Working with LESS & UI Library Components"
  },
  {
    question: "Why do you not need to re-import the UI Library in your component LESS files?",
    answer: "The import chain from styles-m.less -> _styles.less -> _lib.less makes all .lib-* mixins and variables available throughout the entire compilation. Since all LESS files in the compilation chain share the same scope, any file imported by styles-m.less (including _extend.less and _module.less files) automatically has access to all library mixins and variables without needing a separate @import.",
    hint: "Consider how the LESS compilation chain shares scope across all imported files.",
    topic: "UI Library",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 9 — Working with LESS & UI Library Components"
  },
  {
    question: "What are the four key components in Magento's LESS variable override chain, and what is their order of priority?",
    answer: "The chain from lowest to highest priority is: 1) Library defaults in lib/web/css/source/lib/variables/*.less, 2) Parent theme variables in _variables.less (e.g., Blank theme overrides), 3) Module _module.less files (component styles using variables), 4) Your theme's _theme.less (last definition wins due to LESS lazy evaluation). The key principle is that later declarations override earlier ones.",
    hint: "Follow the import order — the last file to declare a variable wins.",
    topic: "UI Library",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 9 — Working with LESS & UI Library Components"
  },
  {
    question: "What is AMD (Asynchronous Module Definition) and how does RequireJS relate to it in Adobe Commerce?",
    answer: "AMD is a JavaScript specification that defines a standard way to declare modules with their dependencies and load them asynchronously without blocking the page. RequireJS is the most widely used AMD loader library — it implements the AMD specification. Commerce ships RequireJS as a core dependency to handle async loading and dependency resolution for all frontend JavaScript modules.",
    hint: "One is a specification/standard, the other is a library that implements it.",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 10 — RequireJS: Configuration & Usage"
  },
  {
    question: "What is the difference between the paths and map keys in requirejs-config.js?",
    answer: "paths registers a new alias pointing to a file location (e.g., 'chartjs': 'Vendor_Module/js/vendor/chart.min') — used for adding new modules. map redirects one alias to a different alias (e.g., redirecting 'Magento_Checkout/js/view/shipping' to your custom version) — used for overriding existing modules. paths values are file paths without .js extension, while map values are module IDs (aliases).",
    hint: "One registers WHERE a file lives, the other redirects WHICH module is served.",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 10 — RequireJS: Configuration & Usage"
  },
  {
    question: "How does Commerce merge multiple requirejs-config.js files, and which level has highest priority?",
    answer: "Commerce performs a deep merge of all requirejs-config.js files server-side during static content deployment (or on-the-fly in developer mode). Objects are merged recursively, arrays are concatenated, and scalar values use last-write-wins. Theme-level requirejs-config.js has the highest priority, followed by theme module overrides, then custom modules, and finally Magento core modules (lowest).",
    hint: "Think about how Composer merges configuration — theme beats module beats core.",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 10 — RequireJS: Configuration & Usage"
  },
  {
    question: "What is the correct way to override an existing core JavaScript module in Adobe Commerce?",
    answer: "Use the map key in requirejs-config.js with the '*' wildcard context: map: { '*': { 'Magento_Checkout/js/view/shipping': 'Vendor_Module/js/view/shipping' } }. This redirects all requests for the core module to your custom replacement. Do NOT use paths for overriding — paths registers a new alias but does not redirect existing module requests.",
    hint: "Which config key redirects module resolution vs registering a new file location?",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 10 — RequireJS: Configuration & Usage"
  },
  {
    question: "What is the shim configuration key used for in requirejs-config.js?",
    answer: "shim provides AMD compatibility for legacy JavaScript libraries that do not use define(). It tells RequireJS which global variable the library creates (via exports) and which other libraries must load first (via deps). For example, shim: { 'legacy-slider': { exports: 'LegacySlider', deps: ['jquery'] } } wraps a non-AMD library so RequireJS can manage it. If a library already uses define(), shim is not needed.",
    hint: "This is for libraries written before the AMD module pattern existed.",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 10 — RequireJS: Configuration & Usage"
  },
  {
    question: "What is the difference between define() and require() in RequireJS?",
    answer: "define() creates a reusable module that exports a value via return — it is used in .js module files and is lazy-loaded when another module depends on it. require() consumes modules without exporting anything — it is used in inline scripts and entry points for immediate execution. Both take the same (dependencies_array, callback_function) signature, but define() produces something for others to use, while require() is a consumer.",
    hint: "One is a producer that exports, the other is a consumer that runs immediately.",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 10 — RequireJS: Configuration & Usage"
  },
  {
    question: "What are the three ways to load and initialize JavaScript modules on a page in Adobe Commerce?",
    answer: "1) Via Layout XML <head><script src=\"Vendor_Module/js/file.js\"/> — adds a JS file to the page head. 2) Via data-mage-init HTML attribute — initializes a component on that specific DOM element with JSON options. 3) Via text/x-magento-init script tag — targets elements by CSS selector or uses '*' for no DOM element. Each approach has distinct use cases based on whether you need DOM element binding.",
    hint: "Consider layout XML, an HTML attribute, and a special script type.",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 10 — RequireJS: Configuration & Usage"
  },
  {
    question: "How does data-mage-init differ from text/x-magento-init for JS component initialization?",
    answer: "data-mage-init is an HTML attribute that initializes a component directly on the element it is placed on — the value must be valid JSON with double quotes inside and single quotes on the attribute. text/x-magento-init is a <script> tag that targets elements via CSS selector and can use '*' when no DOM element is needed. text/x-magento-init is preferred when you want to separate JS initialization from HTML or target elements by selector.",
    hint: "One ties directly to a DOM element, the other uses CSS selectors or can work without any DOM target.",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 10 — RequireJS: Configuration & Usage"
  },
  {
    question: "What is the deps configuration key in requirejs-config.js, and when should you use it?",
    answer: "deps is an array of module IDs that are loaded immediately and automatically when any page loads, before other code runs. Use it for polyfills, global initialization scripts, or analytics/tracking code that must run on every page. Important caveats: deps modules load on every page (use sparingly for performance), they load asynchronously so order is not guaranteed, and they require no explicit require() call in templates.",
    hint: "Think of it as auto-require on page load — what modules always need to be present?",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 10 — RequireJS: Configuration & Usage"
  },
  {
    question: "What is the correct structure of a requirejs-config.js file in Adobe Commerce?",
    answer: "Every requirejs-config.js must use exactly the wrapper var config = { ... }; — a plain JavaScript object assigned to a variable named config. The variable MUST be named 'config' or it will be ignored. The file does NOT use define(), require(), module.exports, or any function wrapper. It is a configuration file, not a module. Commerce's build system picks it up automatically from view/frontend/requirejs-config.js.",
    hint: "It is simpler than you might expect — no module pattern, just a plain variable declaration.",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 10 — RequireJS: Configuration & Usage"
  },
  {
    question: "Why must you NOT include the .js extension in paths values in requirejs-config.js?",
    answer: "RequireJS automatically appends the .js extension to all path values during module resolution. If you include .js in the path value (e.g., 'Vendor_Module/js/my-module.js'), RequireJS will look for 'my-module.js.js' and fail to find the file. The correct format is paths: { 'my-module': 'Vendor_Module/js/my-module' } without the extension.",
    hint: "RequireJS adds something automatically that would cause a double extension.",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 10 — RequireJS: Configuration & Usage"
  },
  {
    question: "How are JavaScript mixins configured in requirejs-config.js?",
    answer: "Mixins use the config key with a special mixins sub-key: config: { mixins: { 'Magento_Catalog/js/price-box': { 'Vendor_Module/js/price-box-mixin': true } } }. This tells Commerce to apply the mixin module to the target module. Mixins do NOT use map — using map would replace the entire module instead of extending it. The true value enables the mixin; set to false to disable.",
    hint: "They use a nested structure under the config key, not map or paths.",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 10 — RequireJS: Configuration & Usage"
  },
  {
    question: "What does the domReady! plugin do in a RequireJS dependency array, and why is the exclamation mark important?",
    answer: "domReady! is a RequireJS plugin that delays module execution until the DOM is fully ready, similar to jQuery's $(document).ready(). The exclamation mark (!) is critical — it triggers the plugin's blocking behavior. Without the !, you would just get the domReady module object itself without actually waiting for the DOM. With it, RequireJS waits for DOM readiness before executing the factory function.",
    hint: "The punctuation mark at the end changes the behavior from importing a module to triggering a plugin.",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 10 — RequireJS: Configuration & Usage"
  },
  {
    question: "What does the config key's config sub-key do in requirejs-config.js, and how does a module read it?",
    answer: "The config key passes static configuration data to specific modules: config: { 'Vendor_Module/js/my-component': { apiEndpoint: 'https://api.example.com', debug: true } }. The receiving module reads this data by requiring the special 'module' dependency and calling module.config(). This is how Commerce passes PHP-generated data (store URLs, flags) to JavaScript modules without inline scripts.",
    hint: "There is a special RequireJS dependency that gives modules access to their configuration.",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 10 — RequireJS: Configuration & Usage"
  },
  {
    question: "What common pre-registered module aliases should you know for the AD0-E727 exam?",
    answer: "Key pre-registered aliases include: 'jquery' (jQuery), 'underscore' (Underscore.js), 'ko'/'knockout' (KnockoutJS), 'mage/translate' (i18n $t function), 'domReady' (DOM ready plugin), 'uiComponent' (maps to Magento_Ui/js/lib/core/collection), 'uiElement' (maps to Magento_Ui/js/lib/core/element/element), and 'mageUtils' (maps to mage/utils/main). These are registered by Commerce core and require no paths configuration.",
    hint: "These are the framework-provided aliases that every Commerce module can use without additional configuration.",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 10 — RequireJS: Configuration & Usage"
  },
  {
    question: "What is the key difference between a JavaScript mixin (config.mixins) and a path override (config.map or config.paths) in Magento 2's RequireJS configuration?",
    answer: "A mixin extends/wraps the target component — the original file still runs, and multiple modules can apply mixins to the same component (they stack). A path override completely replaces the original file — the original does not run, only one override survives if multiple modules attempt it (last one wins). Mixins have low upgrade risk while path overrides have high risk since you own the entire file.",
    hint: "One approach preserves the original code and allows collaboration between modules, the other is a complete replacement.",
    topic: "JavaScript Mixins",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 11 — JavaScript Mixins (All Types)"
  },
  {
    question: "What is the correct nesting structure for registering a JavaScript mixin in requirejs-config.js?",
    answer: "The structure is config.config.mixins — a double nesting. The outer config is the variable name, and inside it there must be another config key containing the mixins key. Example: var config = { config: { mixins: { 'Target/js/module': { 'Vendor_Module/js/mixins/mixin': true } } } }. Placing mixins directly under the outer config (config.mixins) is a common mistake that causes the mixin to silently fail.",
    hint: "There is a double nesting of a key with the same name that trips up many developers.",
    topic: "JavaScript Mixins",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 11 — JavaScript Mixins (All Types)"
  },
  {
    question: "What is the function signature difference between a component mixin (for UI Components) and a widget mixin (for jQuery Widgets) in Magento 2?",
    answer: "A component mixin function takes one argument (the target component) and must return the extended component: function(TargetComponent) { return TargetComponent.extend({...}); }. A widget mixin function takes no arguments and extends via $.widget() directly: function() { $.widget('mage.widgetName', $.mage.widgetName, {...}); }. Using TargetComponent.extend() on a jQuery widget target will cause a TypeError.",
    hint: "One type receives the target as a parameter, the other accesses the widget through the jQuery global.",
    topic: "JavaScript Mixins",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 11 — JavaScript Mixins (All Types)"
  },
  {
    question: "What does this._super() do inside a JavaScript mixin, and what happens if you omit it?",
    answer: "this._super() calls the parent/original version of the method being overridden — analogous to parent::method() in PHP. It can pass arguments: this._super(arg1, arg2). If you omit it, the original method never executes, meaning any critical logic in the original (event binding, state setting, etc.) is skipped entirely. In a mixin chain, _super calls the previous mixin's version, not necessarily the original.",
    hint: "Think of it like PHP's parent:: call — it delegates to the version of the method you're overriding.",
    topic: "JavaScript Mixins",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 11 — JavaScript Mixins (All Types)"
  },
  {
    question: "How do you disable a third-party JavaScript mixin in Magento 2 without modifying the third-party module's code?",
    answer: "In your own module's requirejs-config.js, set the mixin value to false for the specific mixin you want to disable: var config = { config: { mixins: { 'Target/js/module': { 'ThirdParty_Module/js/mixins/their-mixin': false } } } }. Commerce merges all requirejs-config.js files, so your false value overrides the third party's true value.",
    hint: "The same registration mechanism used to enable a mixin can also be used with a different boolean value.",
    topic: "JavaScript Mixins",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 11 — JavaScript Mixins (All Types)"
  },
  {
    question: "When specifying module IDs in requirejs-config.js for Magento 2, what two common mistakes involving file paths cause mixins to fail silently?",
    answer: "The two common mistakes are: (1) Including the .js file extension in the module ID — 'Magento_Catalog/js/price-box.js' is wrong, it should be 'Magento_Catalog/js/price-box'. (2) Including web/js/ in the module ID — 'Vendor_Module/web/js/mixins/mixin' is wrong because web/js/ is implicit in the RequireJS module ID mapping; the correct form is 'Vendor_Module/js/mixins/mixin'.",
    hint: "RequireJS has its own path resolution that differs from the physical filesystem path.",
    topic: "RequireJS Configuration",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 11 — JavaScript Mixins (All Types)"
  },
  {
    question: "How do multiple JavaScript mixins targeting the same component work together in Magento 2?",
    answer: "Multiple mixins targeting the same component stack in a chain. Commerce merges the requirejs-config.js from all modules, and each mixin receives the already-extended version from the previous mixin as its TargetComponent. So if Mixin A and Mixin B both override reloadPrice, calling this._super() in Mixin B calls Mixin A's version, which in turn calls the original. All mixins run — they do not conflict like path overrides would.",
    hint: "Think of it like a chain of PHP plugins/interceptors — each one wraps around the previous result.",
    topic: "JavaScript Mixins",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 11 — JavaScript Mixins (All Types)"
  },
  {
    question: "What is the critical mistake in this mixin code, and how should it be fixed?\\n\\nreturn function(TargetComponent) {\\n    TargetComponent.extend({\\n        reloadPrice: function() { this._super(); }\\n    });\\n};",
    answer: "The mixin function does not return the result of TargetComponent.extend(). The extended component is created but discarded, so the original component is used unchanged. The fix is to add 'return' before TargetComponent.extend(): return function(TargetComponent) { return TargetComponent.extend({ reloadPrice: function() { this._super(); } }); };",
    hint: "The function must provide the modified component back to the system — check what value the inner function actually returns.",
    topic: "JavaScript Mixins",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 11 — JavaScript Mixins (All Types)"
  },
  {
    question: "Where must the requirejs-config.js file be placed in a Magento 2 module, and what must happen after modifying it?",
    answer: "The requirejs-config.js file must be at view/frontend/requirejs-config.js for frontend mixins (or view/adminhtml/ for admin). The mixin JS file itself lives under view/frontend/web/js/. After modifying requirejs-config.js, you must flush the cache (bin/magento cache:flush). In production mode, you also need to redeploy static content (bin/magento setup:static-content:deploy).",
    hint: "The config file and the mixin file are in different subdirectories of the view/frontend/ area.",
    topic: "JavaScript Mixins",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 11 — JavaScript Mixins (All Types)"
  },
  {
    question: "What lifecycle hook should be used for initialization in a jQuery widget mixin versus a UI Component mixin?",
    answer: "jQuery widgets use _create() (and optionally _init()) as lifecycle hooks for initialization. UI Components (extending uiComponent/uiClass) use initialize() as the constructor method. Using initialize in a jQuery widget mixin or _create in a UI Component mixin will not work as expected because these belong to different inheritance chains.",
    hint: "The two JavaScript component systems in Magento have different method names for their initialization phase.",
    topic: "JavaScript Mixins",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 11 — JavaScript Mixins (All Types)"
  },
  {
    question: "What is the AMD module pattern in RequireJS, and what is the structural anatomy of a define() call?",
    answer: "AMD (Asynchronous Module Definition) declares modules with their dependencies. A define() call has three parts: define([array of dependency module IDs], function(matching callback parameters) { 'use strict'; return exportedValue; }). The dependency array lists module IDs (no .js extension), the function receives those dependencies as arguments in the same order, and the return value is what this module exports for other modules to consume.",
    hint: "The function takes an array of dependencies and a callback, and the callback must export something for consumers.",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 11 — JavaScript Mixins (All Types)"
  },
  {
    question: "How does the PHP plugin (interceptor) pattern map to JavaScript mixins in Magento 2?",
    answer: "They are conceptually equivalent. The di.xml <plugin> entry maps to the requirejs-config.js config.mixins entry. Code before this._super() in a mixin is like a PHP beforeMethodName() plugin. Code after this._super() is like afterMethodName(). The entire method with this._super() in the middle is like aroundMethodName(). The PHP $proceed() call maps to this._super(). Multiple plugins stacking maps to multiple mixins stacking.",
    hint: "Both systems intercept method calls without replacing the original, and both support before/after/around patterns.",
    topic: "JavaScript Mixins",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 11 — JavaScript Mixins (All Types)"
  },
  {
    question: "What is the correct way to extend a jQuery widget (like mage.priceBox) using the $.widget() syntax in a mixin?",
    answer: "The syntax is $.widget('mage.priceBox', $.mage.priceBox, { methodOverrides }). The three arguments are: (1) the widget's full name including namespace, (2) the existing widget prototype to extend (accessed via the global $.mage namespace), and (3) an object containing method overrides. this._super() works inside these overrides to call the original method. The mixin function itself takes no arguments, unlike component mixins.",
    hint: "The widget extension syntax requires three arguments: the name, the existing prototype reference, and the overrides object.",
    topic: "jQuery Widget Mixins",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 11 — JavaScript Mixins (All Types)"
  },
  {
    question: "In Magento 2's RequireJS system, what is the difference between the 'paths' and 'map' config keys?",
    answer: "'paths' aliases a module ID to a different file path — it's a simple renaming that applies globally. 'map' redirects a required module ID to a different module ID, and can be scoped: map with '*' applies globally, but map with a specific module ID applies only when that module makes the require call. Both can replace modules, but map offers finer-grained control over which consumers see the replacement.",
    hint: "One is a global alias, the other supports scoped redirection based on which module is doing the requiring.",
    topic: "RequireJS Configuration",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 11 — JavaScript Mixins (All Types)"
  },
  {
    question: "When troubleshooting a JavaScript mixin that is not executing in Magento 2, what are the most common causes and how do you diagnose them?",
    answer: "The most common causes are: (1) Cache not flushed — run bin/magento cache:flush after changing requirejs-config.js. (2) Wrong file path — verify the module ID matches the actual file location (no .js extension, no web/js/ prefix). (3) Wrong mixin type — using TargetComponent.extend() on a jQuery widget causes 'extend is not a function' error; use $.widget() instead. (4) Module not enabled — run bin/magento module:enable and setup:upgrade. Check the browser Network tab and console for 404 errors or JavaScript exceptions.",
    hint: "Start with cache, then check paths, then verify you're using the right extension pattern for the target type.",
    topic: "JavaScript Mixins",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 11 — JavaScript Mixins (All Types)"
  },
  {
    question: "What is the MVVM pattern that Knockout JS implements, and how do the three parts map to Magento 2's architecture?",
    answer: "MVVM stands for Model-View-ViewModel. In Magento 2, the Model is the data source (PHP/REST API data, JS config objects), the ViewModel is the JavaScript class (typically a uiComponent with ko.observable properties and ko.computed methods), and the View is the .html KO template with data-bind attributes. KO is specifically MVVM, not MVC — there is no controller. The ViewModel sits between data and presentation.",
    hint: "KO uses a specific three-letter pattern where the middle layer contains reactive data properties that the presentation layer binds to.",
    topic: "Knockout JS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 12 — Knockout JS in Adobe Commerce"
  },
  {
    question: "What is the critical difference between the KO 'text' binding and the 'html' binding in terms of security?",
    answer: "The 'text' binding HTML-escapes its output, making it safe against XSS attacks — it renders values as plain text. The 'html' binding renders raw, unescaped HTML, which means it can execute malicious scripts if the data is not sanitized. You should use 'text' for user-supplied content and only use 'html' when the content is trusted and intentionally contains HTML markup.",
    hint: "One binding sanitizes output automatically, the other passes it through verbatim to the DOM.",
    topic: "Knockout JS Bindings",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 12 — Knockout JS in Adobe Commerce"
  },
  {
    question: "How do you read and write a ko.observable value in JavaScript code versus in a data-bind template?",
    answer: "In JavaScript code, you must call the observable as a function: myObs() to read, myObs(newValue) to write. Without the parentheses, you get the function object itself, not the value. In data-bind templates, KO auto-unwraps — you write data-bind=\"text: myObs\" without parentheses and KO handles the unwrapping. This distinction is the #1 source of confusion for backend developers working with KO.",
    hint: "The observable is actually a function — the syntax differs between JS logic and HTML templates.",
    topic: "Knockout JS Observables",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 12 — Knockout JS in Adobe Commerce"
  },
  {
    question: "What is the difference between ko.observableArray() and having an array of ko.observable() properties on items?",
    answer: "ko.observableArray() tracks array-level mutations (push, pop, splice, remove) and triggers DOM updates when items are added or removed. However, it does NOT automatically track changes to properties within items. If you want item property changes to be reactive, each property must itself be a ko.observable(). For example, items()[0].price = 20 won't trigger an update, but if price is ko.observable, then items()[0].price(20) will.",
    hint: "The array wrapper tracks membership changes, but property-level reactivity requires an additional layer.",
    topic: "Knockout JS Observables",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 12 — Knockout JS in Adobe Commerce"
  },
  {
    question: "What special context variables are available inside a KO foreach binding, and which one is most commonly tested on the exam?",
    answer: "$data refers to the current item, $index is the zero-based index (itself an observable — call as $index()), $parent accesses the parent binding context (the ViewModel), $root accesses the top-level ViewModel, and $parents[n] accesses the nth ancestor. $parent is the most commonly tested because it is essential for calling ViewModel methods from within a foreach loop — e.g., <button data-bind=\"click: $parent.removeItem\">.",
    hint: "When iterating items, the binding context shifts — you need a special variable to reach methods defined on the parent ViewModel.",
    topic: "Knockout JS Bindings",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 12 — Knockout JS in Adobe Commerce"
  },
  {
    question: "What is the difference between the KO 'if' binding and the 'visible' binding?",
    answer: "The 'if' binding removes the element from the DOM entirely when the condition is false — child bindings are not evaluated, which improves performance. The 'visible' binding only hides the element with CSS (display: none) — the element stays in the DOM and child bindings are still evaluated even when hidden. Use 'if' for conditional sections with expensive computations; use 'visible' for simple show/hide toggling.",
    hint: "One physically removes HTML elements, the other just applies a CSS style to hide them.",
    topic: "Knockout JS Bindings",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 12 — Knockout JS in Adobe Commerce"
  },
  {
    question: "What is the difference between data-mage-init and x-magento-init for initializing JavaScript components in Magento 2?",
    answer: "data-mage-init is an HTML attribute that initializes a JS widget on the specific DOM element it is attached to. x-magento-init is a script tag (type=\"text/x-magento-init\") that can initialize components without being tied to a specific element — using the \"*\" selector means no specific DOM element is required. Checkout components often use x-magento-init because they initialize the entire app, not just one element.",
    hint: "One is bound to a specific HTML element, the other is a standalone script block that can target any or no element.",
    topic: "Component Initialization",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 12 — Knockout JS in Adobe Commerce"
  },
  {
    question: "How does this.observe() work in a Magento 2 uiComponent, and why is it different from vanilla Knockout?",
    answer: "In a uiComponent, calling this.observe(['prop1', 'prop2']) in the initObservables() method automatically converts those properties to ko.observable (or ko.observableArray for arrays). This is Commerce-specific behavior provided by the uiElement base class — in vanilla KO, you must manually call ko.observable() on each property. Always call this._super() first in initObservables() to preserve parent observables.",
    hint: "Magento's component system provides a shortcut method that batch-converts properties to observables by name.",
    topic: "UI Components",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 12 — Knockout JS in Adobe Commerce"
  },
  {
    question: "What is the role of quote.js in the Magento 2 checkout, and how does it enable communication between checkout components?",
    answer: "quote.js (Magento_Checkout/js/model/quote) is a singleton model that serves as the central data store for the checkout. It contains shared observables like billingAddress, shippingAddress, shippingMethod, paymentMethod, and totals. Multiple checkout components import and observe the same observable instances — when one component changes shippingMethod, all subscribers (totals processor, rate processor, etc.) automatically react and update.",
    hint: "It acts as a shared reactive state store — like a global event bus but using observables instead of events.",
    topic: "Checkout Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 12 — Knockout JS in Adobe Commerce"
  },
  {
    question: "What is the 'scope' binding in Magento 2 KO templates, and how does it differ from native Knockout?",
    answer: "The 'scope' binding is Commerce-specific (not native KO) — defined in Magento_Ui/js/lib/knockout/bindings/scope.js. It looks up a component by name in the uiRegistry and sets that component as the binding context for its child elements. This is how checkout_index_index.xml component structure gets rendered: <div data-bind=\"scope: 'checkout'\"> binds the 'checkout' component from uiRegistry as the ViewModel for that DOM section.",
    hint: "This custom binding bridges Magento's component registry with Knockout's binding context system.",
    topic: "UI Components",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 12 — Knockout JS in Adobe Commerce"
  },
  {
    question: "What is the correct template path format for a KO .html template in a uiComponent defaults object?",
    answer: "The format is 'Vendor_Module/template-name' with NO .html extension. The physical file lives at view/frontend/web/template/template-name.html. For example, template: 'Magento_Checkout/shipping' maps to Magento_Checkout/view/frontend/web/template/shipping.html. Including .html in the template property string is a common mistake that will prevent the template from loading.",
    hint: "Similar to RequireJS module IDs, the file extension is omitted, and the path maps to the web/template/ directory.",
    topic: "UI Components",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 12 — Knockout JS in Adobe Commerce"
  },
  {
    question: "What is the virtual element (containerless binding) syntax in Knockout JS, and why is it used in Magento 2?",
    answer: "Virtual elements use HTML comment syntax: <!-- ko bindingName: value --><!-- /ko -->. They apply KO bindings without adding extra DOM wrapper elements. This is commonly used in Magento 2 for template, if, and foreach bindings where you don't want a wrapper div. For example: <!-- ko if: isVisible --><p>Content</p><!-- /ko --> renders the paragraph conditionally without adding a container element.",
    hint: "This syntax uses HTML comments to define binding boundaries, avoiding unnecessary wrapper elements in the rendered output.",
    topic: "Knockout JS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 12 — Knockout JS in Adobe Commerce"
  },
  {
    question: "How do you add a custom component to the Magento 2 checkout flow via layout XML?",
    answer: "Custom checkout components are added in checkout_index_index.xml under the checkout.root block's jsLayout argument. You navigate the component hierarchy through nested children items to place your component in the correct step. The component item needs at minimum a 'component' string pointing to your JS module, and optionally 'sortOrder' and 'displayArea'. This approach extends checkout without overriding core files.",
    hint: "You modify the checkout.root block's argument structure, following the existing component tree nesting.",
    topic: "Checkout Customization",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 12 — Knockout JS in Adobe Commerce"
  },
  {
    question: "What are ko.computed() and ko.pureComputed(), and when should you use each?",
    answer: "ko.computed() creates a derived value that automatically re-evaluates when any observable it reads changes — KO tracks dependencies implicitly. ko.pureComputed() is the same but optimized for functions with no side effects (pure functions) — it only evaluates when it has active subscribers, making it more memory-efficient. Use pureComputed when the function only reads observables and returns a value; use computed when the function has side effects like AJAX calls.",
    hint: "Both auto-track dependencies, but one is optimized for side-effect-free derivations through lazy evaluation.",
    topic: "Knockout JS Observables",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 12 — Knockout JS in Adobe Commerce"
  },
  {
    question: "How can you debug Knockout observables in the browser for a Magento 2 checkout page?",
    answer: "Use these DevTools console commands: ko.contextFor($0) to get the binding context of a selected element, ko.dataFor($0) to get its ViewModel data, and require('uiRegistry').get('component_name') to access any registered component instance. You can also add temporary subscriptions with quote.shippingMethod.subscribe(function(val) { console.trace(val); }) to trace observable changes with full call stacks. The uiRegistry lists all active components.",
    hint: "Knockout and Magento's uiRegistry both expose inspection methods accessible from the browser console.",
    topic: "Debugging KO",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 12 — Knockout JS in Adobe Commerce"
  },
  {
    question: "What is the syntax for defining a jQuery widget in Magento, and what namespace convention should custom widgets follow?",
    answer: "The syntax is $.widget('namespace.widgetName', { definition }). Magento core widgets use the 'mage' namespace (e.g., mage.accordion). Custom widgets should use a vendor-specific namespace (e.g., vendorName.myWidget) to avoid conflicts with core. The widget becomes a jQuery plugin called as $(el).widgetName().",
    hint: "Think about how Magento organizes its own widgets under a specific namespace prefix, and why third-party code should use something different.",
    topic: "jQuery Widgets",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 15 — jQuery Widgets in Adobe Commerce"
  },
  {
    question: "What is the difference between the _create() and _init() lifecycle methods in a jQuery widget?",
    answer: "_create() runs only ONCE when the widget is first instantiated on an element. _init() runs on the first initialization AND on every subsequent re-call of the widget on the same element. This means if you call $(el).myWidget() again after the widget is already created, only _init() executes, not _create().",
    hint: "One method is a one-time constructor, while the other acts as a re-initializer that fires every time the widget is invoked.",
    topic: "jQuery Widgets",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 15 — jQuery Widgets in Adobe Commerce"
  },
  {
    question: "Why should you use this._on() instead of $(el).on() for binding events in a jQuery widget?",
    answer: "this._on() is preferred because it automatically unbinds all events when the widget's destroy() method is called, preventing memory leaks and orphaned event handlers. Using $(el).on() directly means you must manually track and unbind every event in your destroy() method, which is error-prone.",
    hint: "Consider what happens to event handlers when a widget is removed from the DOM.",
    topic: "jQuery Widgets",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 15 — jQuery Widgets in Adobe Commerce"
  },
  {
    question: "What is the correct widget name defined in mage/dropdown.js, and what common mistake do developers make when referencing it?",
    answer: "The widget defined in lib/web/mage/dropdown.js is mage.dropdownDialog (which extends $.ui.dialog), NOT mage.dropdown. A common mistake is trying to extend $.mage.dropdown, which does not exist. When extending this widget, you must reference $.mage.dropdownDialog. Additionally, the alias 'dropdownDialog' maps to 'mage/dropdown', while the alias 'dropdown' maps to 'mage/dropdowns' (a different file).",
    hint: "The file name and the widget name it defines don't match — the widget has 'Dialog' appended to it.",
    topic: "jQuery Widgets",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 15 — jQuery Widgets in Adobe Commerce"
  },
  {
    question: "How do data-mage-init and x-magento-init differ in where they are placed and how they target elements?",
    answer: "data-mage-init is an HTML attribute placed directly on the target element, binding the widget to that specific element. x-magento-init is a <script type='text/x-magento-init'> tag that can be placed anywhere in the HTML and uses CSS selectors as keys to target elements, including elements you don't directly control in your template. Only x-magento-init supports the '*' selector for non-DOM-context initialization.",
    hint: "One is an inline attribute coupled to its element; the other is decoupled and uses selectors to find its targets.",
    topic: "Widget Initialization",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 15 — jQuery Widgets in Adobe Commerce"
  },
  {
    question: "What does the '*' selector mean in an x-magento-init script block?",
    answer: "The '*' selector does NOT mean 'all DOM elements.' Instead, it means the JavaScript module is called without any specific DOM context — no element is passed to the component. This is used for KnockoutJS UI components (via Magento_Ui/js/core/app), global event listeners, and non-DOM-attached initializations.",
    hint: "Despite looking like a CSS universal selector, it has a very specific meaning in Magento's JS initialization system.",
    topic: "Widget Initialization",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 15 — jQuery Widgets in Adobe Commerce"
  },
  {
    question: "Where does the mage.modal widget reside, and what are its three type options?",
    answer: "The mage.modal widget is located in Magento_Ui/js/modal/modal (under vendor/magento/module-ui/), NOT in lib/web/mage/. There is no short RequireJS alias for 'modal' — you must always use the full path 'Magento_Ui/js/modal/modal'. Its three type options are: 'popup', 'slide', and 'custom'.",
    hint: "Unlike accordion and tabs, this widget lives in a different module directory and has no shortcut alias.",
    topic: "jQuery Widgets",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 15 — jQuery Widgets in Adobe Commerce"
  },
  {
    question: "What is the correct syntax for extending an existing Magento jQuery widget, and what must you always do in overridden lifecycle methods?",
    answer: "The syntax is $.widget('vendor.newName', $.mage.parentWidget, { overrides }). The parent widget is referenced using the full dotted name like $.mage.accordion or $.mage.dropdownDialog. In every overridden lifecycle method (_create, _init, destroy), you must call this._super() to ensure the parent's logic runs properly. The new widget's namespace should be your vendor namespace, not 'mage'.",
    hint: "The three-argument form of $.widget includes a reference to the parent constructor, and parent methods must still execute.",
    topic: "jQuery Widgets",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 15 — jQuery Widgets in Adobe Commerce"
  },
  {
    question: "What role does mage/apply/main.js play in Magento's JavaScript architecture?",
    answer: "mage/apply/main.js is the bootstrapper that scans the DOM for both data-mage-init attributes and x-magento-init script blocks. For each found component, it parses the JSON configuration, loads the module via RequireJS, and calls the widget initializer on the target element. It is auto-loaded because mage/bootstrap is listed in the deps array of Magento_Theme's requirejs-config.js.",
    hint: "This is the entry point script that makes declarative widget initialization work on page load.",
    topic: "Widget Initialization",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 15 — jQuery Widgets in Adobe Commerce"
  },
  {
    question: "What is the default value of the 'active' option in mage.accordion, and why is this detail exam-relevant?",
    answer: "The default value of the 'active' option in mage.accordion is [0] — an array, not a single number 0. This is significant because it determines which panels are initially open, and using an array means multiple panels can be active simultaneously when multipleCollapsible is set to true. The exam may test whether you know this is an array versus a plain integer.",
    hint: "The data type of this option reflects the widget's ability to handle multiple active items.",
    topic: "jQuery Widgets",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 15 — jQuery Widgets in Adobe Commerce"
  },
  {
    question: "How does the mage.accordion widget relate to other Magento widgets in the inheritance chain?",
    answer: "mage.accordion extends mage.tabs, which in turn extends mage.collapsible. This means accordion inherits options from both parent widgets, such as collapsible: true, openedState: null, and animate: false from mage.collapsible. The accordion's own options only define active: [0], multipleCollapsible: false, and openOnFocus: false.",
    hint: "Think of a three-level inheritance chain where each level adds its own options.",
    topic: "jQuery Widgets",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 15 — jQuery Widgets in Adobe Commerce"
  },
  {
    question: "What data-role attributes does the mage.accordion widget expect in its HTML structure?",
    answer: "The mage.accordion widget expects data-role='collapsible' on each panel wrapper, data-role='trigger' on the clickable header element, and data-role='content' on the panel body element. These data-role attributes are how accordion and tabs widgets identify their structural components in the DOM.",
    hint: "These attributes serve as hooks for the widget to find its interactive parts without relying on CSS classes.",
    topic: "jQuery Widgets",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 15 — jQuery Widgets in Adobe Commerce"
  },
  {
    question: "What is the correct way to modify a jQuery widget's option at runtime, and why should you not set this.options directly?",
    answer: "You should use the option() method: $(el).widgetName('option', 'key', value) or this.option('key', value) from within the widget. Directly setting this.options.speed = 500 bypasses the _setOption handler, meaning the widget cannot react to the change. The option() method triggers _setOption, which allows the widget to update its behavior dynamically.",
    hint: "There's a setter method that acts as a gateway for option changes, similar to using setters instead of directly modifying properties.",
    topic: "jQuery Widgets",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 15 — jQuery Widgets in Adobe Commerce"
  },
  {
    question: "What RequireJS aliases for widgets are defined in Magento_Theme's requirejs-config.js, and which notable widget has NO alias?",
    answer: "Key aliases include: 'accordion' -> 'mage/accordion', 'tabs' -> 'mage/tabs', 'collapsible' -> 'mage/collapsible', 'dropdownDialog' -> 'mage/dropdown', 'dropdown' -> 'mage/dropdowns' (different file), 'loader' -> 'mage/loader'. Notably, there is NO short alias for 'modal' — you must always use the full path 'Magento_Ui/js/modal/modal'.",
    hint: "Most core widgets have short aliases, but one important widget that lives in a different module does not.",
    topic: "RequireJS Configuration",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 15 — jQuery Widgets in Adobe Commerce"
  },
  {
    question: "What is the naming convention for custom events triggered by _trigger() in a jQuery widget, and how do you listen for them?",
    answer: "When you call this._trigger('eventName', event, data), the jQuery Widget Factory fires a namespaced custom event on the element. The full event name is the widget name concatenated with the event name — for example, _trigger('toggle') on a widget named 'myWidget' fires 'mywidgettoggle'. You listen for it using $(el).on('mywidgettoggle', function(event, data) { ... }).",
    hint: "The event name is automatically prefixed with the lowercase widget name, creating a combined identifier.",
    topic: "jQuery Widgets",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 15 — jQuery Widgets in Adobe Commerce"
  },
  {
    question: "What does the <head><script> instruction in Layout XML do, and what does it NOT do?",
    answer: "The <head><script src='Vendor_Module::js/file.js'/> instruction tells Magento to include a JavaScript file on the page via RequireJS. It only makes the file available — it does NOT pass any configuration to the component. To pass config, you need data-mage-init or jsLayout in a template. The src value uses RequireJS module path format (e.g., Vendor_Module::js/custom.js).",
    hint: "This instruction is purely for loading, not configuring. Configuration requires a separate mechanism in a template.",
    topic: "Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 16 — JS Components via Layout XML"
  },
  {
    question: "What is jsLayout in Layout XML, and how does it flow from XML to the browser?",
    answer: "jsLayout is a special <argument name='jsLayout' xsi:type='array'> passed to a block in Layout XML. It is a nested XML structure that gets serialized to a PHP array by the block, then encoded to JSON via $block->getJsLayout(), and output in the template inside a data-mage-init attribute targeting Magento_Ui/js/core/app. This is the primary mechanism for configuring UI Components from Layout XML, especially in checkout.",
    hint: "Think of it as the XML-to-JSON pipeline that connects server-side layout configuration to client-side UI component initialization.",
    topic: "jsLayout",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 16 — JS Components via Layout XML"
  },
  {
    question: "What is Magento_Ui/js/core/app, and how does it differ from a regular jQuery widget?",
    answer: "Magento_Ui/js/core/app is the UI Component bootstrapper/factory — it is NOT a widget. When invoked with a configuration object (from jsLayout), it reads the 'components' tree, RequireJS-loads each component specified by the 'component' key, instantiates them with uiClass.extend()/uiComponent, registers them in the uiRegistry, and applies Knockout.js bindings to the DOM. It always works with the jsLayout configuration pattern.",
    hint: "This is a factory that creates and wires up an entire component tree, not a simple widget attached to one element.",
    topic: "UI Components",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 16 — JS Components via Layout XML"
  },
  {
    question: "What is the role of <item name='component'> inside a jsLayout XML argument?",
    answer: "The <item name='component' xsi:type='string'> entry is the critical link between XML configuration and JavaScript code. Its value is a RequireJS module ID (e.g., Vendor_Module/js/view/my-component) that resolves to a JavaScript file. Config sub-items defined under <item name='config'> are merged into the component's defaults object. The value is NOT a PHP class or file path.",
    hint: "This item maps a component node in the XML tree to a specific JavaScript module that will be loaded and instantiated.",
    topic: "jsLayout",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 16 — JS Components via Layout XML"
  },
  {
    question: "What is the difference between static and dynamic JavaScript component initialization in Magento?",
    answer: "Static initialization uses data-mage-init attributes baked into the server-rendered HTML and is parsed automatically on DOMContentLoaded. Dynamic initialization is needed when content is loaded after the initial page render (e.g., via AJAX). For dynamically injected HTML containing data-mage-init attributes, you must explicitly call mage.apply() (by requiring 'mage/apply/main') to trigger widget initialization on the new DOM elements.",
    hint: "One happens automatically at page load; the other requires a manual call after new content is injected into the DOM.",
    topic: "JS Initialization",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 16 — JS Components via Layout XML"
  },
  {
    question: "Where does the getJsLayout() method come from, and what does it return?",
    answer: "getJsLayout() is defined in Magento\\Framework\\View\\Element\\AbstractBlock, which is the base class for virtually all Magento block classes including Template. It returns a JSON-encoded string of the jsLayout argument that was passed to the block in Layout XML. In templates, it is typically output directly into data-mage-init: data-mage-init='{\"Magento_Ui/js/core/app\": <?= $block->getJsLayout() ?>}'.",
    hint: "This method lives higher in the block class hierarchy than most developers expect — it's on the abstract base, not the Template class.",
    topic: "jsLayout",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 16 — JS Components via Layout XML"
  },
  {
    question: "How do layout handles determine which JavaScript files load on which pages?",
    answer: "Layout handle file names correspond directly to routes in the format frontName_controllerName_actionName. Scripts added to a specific handle file (e.g., catalog_product_view.xml) only load on pages matched by that handle. For example, a <head><script> in catalog_product_view.xml loads only on product pages, while one in default.xml loads on all pages.",
    hint: "The layout file naming convention mirrors the routing pattern, creating a direct mapping between URLs and available resources.",
    topic: "Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 16 — JS Components via Layout XML"
  },
  {
    question: "What is the correct way to pass dynamic server-side data to a JavaScript component through data-mage-init?",
    answer: "Use the block class to provide data methods, then in the .phtml template, output the JSON-encoded config using escapeHtmlAttr and json_encode: data-mage-init='<?= $block->escapeHtmlAttr(json_encode([\"Vendor_Module/js/widget\" => $config])) ?>'. PHP expressions like $block->getUrl() are evaluated server-side before the JSON reaches the browser. Always use escapeHtmlAttr around json_encode output.",
    hint: "The block class bridges PHP data and JS configuration, with proper escaping applied in the template.",
    topic: "JS Initialization",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 16 — JS Components via Layout XML"
  },
  {
    question: "What xsi:type values are available for <item> elements within a jsLayout argument in Layout XML?",
    answer: "The jsLayout argument itself is always xsi:type='array'. Individual <item> elements within it use xsi:type of 'string' (for component paths, labels), 'boolean' (for flags like isVisible), 'number' (for numeric values), or 'array' (for nested structures like children and config). The <item name='component'> value is always a RequireJS module path string.",
    hint: "These type declarations tell Magento how to serialize each XML element into the corresponding PHP and then JSON data types.",
    topic: "jsLayout",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 16 — JS Components via Layout XML"
  },
  {
    question: "What are the two distinct JavaScript initialization systems running in parallel in Magento, and when is each used?",
    answer: "The two systems are: (1) data-mage-init / x-magento-init processed by mage/apply/main.js — used for jQuery widgets and simple RequireJS components, and (2) Magento_Ui/js/core/app — used for full UI Components based on Knockout.js, heavily used in checkout. The first system binds widgets to DOM elements; the second bootstraps an entire component tree with a registry and KO data binding.",
    hint: "One system is for traditional jQuery-style widgets, the other for the modern Knockout.js-based component framework.",
    topic: "JS Initialization",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 16 — JS Components via Layout XML"
  },
  {
    question: "What is the complete data flow from Layout XML jsLayout to a running JavaScript component in the browser?",
    answer: "The flow is: Layout XML jsLayout argument -> PHP Block getJsLayout() encodes to JSON string -> .phtml template outputs JSON in data-mage-init targeting Magento_Ui/js/core/app -> Browser loads page -> mage/apply/main.js scans DOM -> RequireJS loads Magento_Ui/js/core/app -> app reads components tree -> RequireJS loads each component module -> Component.extend() called with config from XML -> Component registered in uiRegistry.",
    hint: "Trace the path from server-side XML configuration through PHP serialization, HTML rendering, and finally client-side RequireJS bootstrapping.",
    topic: "UI Components",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 16 — JS Components via Layout XML"
  },
  {
    question: "What happens if you forget to include xsi:type on <item> elements in a jsLayout argument?",
    answer: "Omitting xsi:type on <item> elements is a common mistake that causes the layout XML to fail validation or produce incorrect output. Each <item> element MUST have an xsi:type declaration (string, boolean, number, or array) so Magento knows how to properly serialize the XML structure into the correct PHP and JSON data types.",
    hint: "XML schema validation requires explicit type declarations — Magento cannot infer the data type from the content alone.",
    topic: "jsLayout",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 16 — JS Components via Layout XML"
  },
  {
    question: "How do you verify that a UI component has been correctly registered from jsLayout configuration in the browser?",
    answer: "Open browser DevTools Console and use the uiRegistry to inspect registered components: require(['uiRegistry'], function(registry) { console.log(registry.get('component-name')); }). You can also check the Elements tab to verify the data-mage-init attribute contains correct JSON, and the Network tab to confirm the JS file loaded. Look for RequireJS errors in the Console for mistyped module paths.",
    hint: "Magento provides a client-side registry that tracks all instantiated UI components by name.",
    topic: "UI Components",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 16 — JS Components via Layout XML"
  },
  {
    question: "What is the uiComponent alias in RequireJS, and what does it resolve to?",
    answer: "The uiComponent alias resolves to Magento_Ui/js/lib/core/collection, as defined in the module-ui requirejs-config.js. It is the standard base class for building Knockout.js-based UI Components in Magento. Components extend it using Component.extend({ defaults, initialize, initObservables }), with config items from jsLayout XML automatically merged into the component's defaults.",
    hint: "This alias points to a collection class in the UI module library, not the element class that some developers assume.",
    topic: "UI Components",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 16 — JS Components via Layout XML"
  },
  {
    question: "What is the Vendor_Module::js/file.js notation in Layout XML, and what file path does it resolve to?",
    answer: "The Vendor_Module::js/file.js notation is a module-scoped path reference used in Layout XML <head><script> tags. It resolves to the file at app/code/Vendor/Module/view/frontend/web/js/file.js (or the equivalent theme override path). This follows RequireJS module path format — the :: separates the module identifier from the relative path within the module's web directory.",
    hint: "The double-colon notation maps a module name to its web directory, similar to how template paths work in blocks.",
    topic: "Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 16 — JS Components via Layout XML"
  },
  {
    question: "What is Page Builder, and how does it store content in the database?",
    answer: "Page Builder is Adobe Commerce's (EE only) drag-and-drop content editing experience built into the Admin panel. It stores content as annotated HTML in standard database text columns (like cms_block.content), NOT as JSON or in separate tables. The HTML includes data-content-type attributes to identify each content type. The storefront renders this HTML directly as static content — no JavaScript rendering engine is needed.",
    hint: "The content format is plain HTML with special data attributes, stored in the same columns that raw HTML content would occupy.",
    topic: "Page Builder",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 17 — Page Builder Customization & Admin UI SDK"
  },
  {
    question: "What are the four essential files every Page Builder content type needs?",
    answer: "Every content type needs: (1) <name>.xml — registers the type with Page Builder, located at view/adminhtml/pagebuilder/content_type/; (2) preview.html — Knockout template shown in the Admin stage; (3) master.html — HTML template that gets serialized to the database for storefront output; (4) preview.js — Knockout ViewModel for the Admin stage. There's also typically a UI component form XML for the settings panel.",
    hint: "Two templates (one for editing, one for output), one configuration file, and one JavaScript component.",
    topic: "Page Builder",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 17 — Page Builder Customization & Admin UI SDK"
  },
  {
    question: "What is the difference between a Page Builder preview template and a master template?",
    answer: "The preview template is a Knockout.js-powered template shown only in the Admin stage during content editing — it includes KO bindings like data-bind and ko-style. The master template produces the final HTML saved to the database. While the master template also contains KO expressions, these are processed once during save to produce static HTML values. The storefront does NOT run Knockout to render Page Builder content.",
    hint: "One is interactive and lives only in the admin; the other is processed once on save to produce static output.",
    topic: "Page Builder",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 17 — Page Builder Customization & Admin UI SDK"
  },
  {
    question: "What are the four menu_section values available for Page Builder content types?",
    answer: "The four menu sections in the Page Builder panel are: 'layout' (for structural elements like Row, Column, Tabs), 'elements' (for content elements like Text, Heading, Buttons, Divider), 'media' (for media content like Image, Video, Slider, Map, Banner), and 'add_content' (for embedded content like Products, Block, Dynamic Block). These determine which group in the left sidebar panel your content type appears in.",
    hint: "The panel is organized into four categories matching the types of content: structure, text elements, media, and embedded/dynamic content.",
    topic: "Page Builder",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 17 — Page Builder Customization & Admin UI SDK"
  },
  {
    question: "How do you extend an existing Page Builder content type without modifying the core?",
    answer: "You extend an existing content type via XML merge — create a file with the same type name in your module's view/adminhtml/pagebuilder/content_type/ directory. Magento's XML merging applies your additions on top of the core config. You only need to declare what you're changing, not copy the entire config. This works the same way as di.xml or config.xml merging. You can add new attributes, override templates, or change the preview component.",
    hint: "The same XML merging principle used throughout Magento applies here — same filename, same type name, only declare changes.",
    topic: "Page Builder",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 17 — Page Builder Customization & Admin UI SDK"
  },
  {
    question: "What role does the 'appearances' node play in a Page Builder content type XML configuration?",
    answer: "The appearances node defines how a content type can visually present itself. Each appearance declares preview_template and master_template paths, and contains an elements node that maps DOM elements to data fields (CSS, attributes, HTML). A single content type can have multiple visual appearances. The elements mapping is the bridge between form fields and HTML output — it's how Page Builder knows which template to use and how to read/write data.",
    hint: "This node controls the visual variations of a content type and the data-to-HTML mapping for each variation.",
    topic: "Page Builder",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 17 — Page Builder Customization & Admin UI SDK"
  },
  {
    question: "What is the Admin UI SDK, and how does it differ architecturally from traditional PHP admin customization?",
    answer: "The Admin UI SDK is Adobe's App Builder-based mechanism for extending the Commerce Admin using out-of-process React applications hosted on Adobe I/O Runtime. Unlike traditional PHP admin (in-process, direct DB access), SDK extensions run separately, access Commerce data via REST/GraphQL APIs, render in iframes, and have lower upgrade risk due to decoupling. It requires Adobe Commerce with App Builder entitlement — not available in Magento Open Source.",
    hint: "Think in-process PHP versus out-of-process React — one runs on the Commerce server, the other runs on a separate cloud runtime.",
    topic: "Admin UI SDK",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 17 — Page Builder Customization & Admin UI SDK"
  },
  {
    question: "What are the main extension points provided by the Admin UI SDK?",
    answer: "The Admin UI SDK provides these extension point types: menu (adds custom menu items to Admin navigation), page (registers full custom Admin pages loaded via iframe), massAction (adds custom mass actions to grid listings), column (adds custom columns to Admin grids), banner (adds notification banners to Admin pages), modal (adds custom modal dialogs), and sharedContext (shares data/context between the Admin and App Builder app).",
    hint: "These extension points cover navigation, page-level, grid-level, and notification-level integration without modifying PHP.",
    topic: "Admin UI SDK",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 17 — Page Builder Customization & Admin UI SDK"
  },
  {
    question: "What technology does Page Builder use for the Admin stage, and what technology renders content on the storefront?",
    answer: "Page Builder uses Knockout.js for the Admin stage (preview) — KO bindings power the interactive editing experience including data-bind, ko-style, and attr directives. On the storefront, no JavaScript engine renders Page Builder content. The master template is processed by Knockout once during save, producing static HTML that is written to the database. The storefront simply outputs this HTML as-is.",
    hint: "The admin and storefront use fundamentally different rendering approaches — one is dynamic, the other is completely static.",
    topic: "Page Builder",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 17 — Page Builder Customization & Admin UI SDK"
  },
  {
    question: "What are the parents and children nodes in a Page Builder content type XML, and what do they control?",
    answer: "The parents node controls which content types can contain this type (e.g., <parent name='column'/> and <parent name='row'/> mean only columns and rows can be parents). The children node controls what content types can be placed inside this type. Both use default_policy='deny' or 'allow' to set the default behavior, with individual entries overriding the default. This controls the nesting rules in the Page Builder stage.",
    hint: "These nodes define the containment hierarchy — what can hold this type and what this type can hold.",
    topic: "Page Builder",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 17 — Page Builder Customization & Admin UI SDK"
  },
  {
    question: "What are the three key components in the Page Builder data architecture: Stage, Panel, and Data Store?",
    answer: "The Panel is the left sidebar showing draggable content type icons. The Stage is the central canvas where content types are arranged visually using their preview templates. The Data Store is a per-content-type Knockout observable object — form fields write to it, and preview templates read from it. On save, a converter transforms the Data Store values into the master format (annotated HTML) that gets written to the database.",
    hint: "Three parts: where you pick content types, where you arrange them, and where their data lives as observables.",
    topic: "Page Builder",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 17 — Page Builder Customization & Admin UI SDK"
  },
  {
    question: "When should you choose Admin UI SDK over traditional PHP admin customization?",
    answer: "Choose Admin UI SDK when building dashboards that aggregate external data, when the UI is primarily informational/reporting, when you want zero upgrade risk from Commerce version changes, when your team has React expertise, or when you're extending (not replacing) core Admin pages. Choose traditional PHP when you need direct service layer/repository access, complex form processing with Commerce model validation, native ACL permissions, or when the feature must work without cloud connectivity.",
    hint: "The decision depends on coupling requirements, data access patterns, and whether the feature can work through APIs alone.",
    topic: "Admin UI SDK",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 17 — Page Builder Customization & Admin UI SDK"
  },
  {
    question: "What module dependency must be declared for a custom Page Builder content type, and where does the content type XML file go?",
    answer: "Your module must declare Magento_PageBuilder as a sequence dependency in etc/module.xml to ensure Page Builder loads before your extension. The content type XML configuration file goes at view/adminhtml/pagebuilder/content_type/<name>.xml — each type gets its own dedicated XML file. There is no single monolithic content_types.xml file.",
    hint: "The module load order matters, and each content type lives in its own XML file following a specific directory convention.",
    topic: "Page Builder",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 17 — Page Builder Customization & Admin UI SDK"
  },
  {
    question: "What is the Page Builder preview JavaScript component, and what does it extend?",
    answer: "The preview JS component is a Knockout ViewModel that provides methods and behavior for the Admin stage preview. It extends Magento_PageBuilder/js/content-type/preview (the base preview class). Custom methods defined on it are callable from the preview template via $preview.methodName(). It is NOT used on the storefront. Custom content types almost always need a custom preview component, but can reuse the standard Magento_PageBuilder/js/content-type/master for the master component.",
    hint: "It lives in the adminhtml web directory and extends a base class specific to Page Builder's preview functionality.",
    topic: "Page Builder",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 17 — Page Builder Customization & Admin UI SDK"
  },
  {
    question: "What is the purpose of Grunt in Adobe Commerce, and what type of tool is it?",
    answer: "Grunt is a Node.js task runner used to automate front-end development tasks: compiling LESS to CSS, watching files for changes, cleaning generated files, and executing shell commands. It runs under Node.js (not PHP) and is only used in developer mode for local development. It is not required for production — production uses bin/magento setup:static-content:deploy instead.",
    hint: "It is a JavaScript tool that automates repetitive development tasks, not a server-side PHP utility.",
    topic: "Grunt",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 18 — Grunt, Front-End Optimization & Edge Delivery"
  },
  {
    question: "What are the four key Grunt tasks available in Adobe Commerce and what does each do?",
    answer: "1) grunt less — compiles LESS source files into CSS in pub/static/. 2) grunt watch — continuously monitors LESS/JS files and auto-triggers compilation on save. 3) grunt clean — deletes pub/static/<theme>/ and var/view_preprocessed/ to clear stale cached files. 4) grunt exec — runs arbitrary shell commands (like bin/magento cache:clean) as part of a Grunt task chain.",
    hint: "Think compilation, monitoring, cleanup, and shell command execution.",
    topic: "Grunt",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 18 — Grunt, Front-End Optimization & Edge Delivery"
  },
  {
    question: "What files must be copied from sample files before using Grunt in a Commerce project?",
    answer: "Two sample files must be copied: package.json.sample to package.json (declares Node.js dependencies/Grunt plugins — analogous to composer.json), and Gruntfile.js.sample to Gruntfile.js (orchestrates all Grunt tasks). After copying, run npm install to install dependencies into node_modules/. You must also configure your theme in dev/tools/grunt/configs/themes.js.",
    hint: "Commerce ships sample versions of two essential configuration files that need manual copying.",
    topic: "Grunt",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 18 — Grunt, Front-End Optimization & Edge Delivery"
  },
  {
    question: "How does grunt less differ from bin/magento setup:static-content:deploy?",
    answer: "grunt less is for developer mode — it compiles only the specified theme quickly with source maps enabled and requires Node.js. setup:static-content:deploy is for production/staging — it deploys all static files for all themes and locales, runs minification, requires no Node.js (pure PHP/CLI), and produces no source maps. Never run setup:static-content:deploy in developer mode as it conflicts with Grunt and the symlink mechanism.",
    hint: "One is fast and dev-focused, the other is comprehensive and deployment-focused.",
    topic: "Grunt",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 18 — Grunt, Front-End Optimization & Edge Delivery"
  },
  {
    question: "Where are CSS and JavaScript merging/minification settings configured in Adobe Commerce Admin?",
    answer: "These settings are under Admin > Stores > Configuration > Advanced > Developer. Key options include 'Merge CSS Files' (combines CSS into fewer HTTP requests), 'Minify CSS Files' (removes whitespace/comments), 'Merge JavaScript Files', 'Enable JavaScript Bundling' (uses RequireJS optimizer), and 'Minify JavaScript Files'. These are designed for production use and should be disabled during development since merged files are cached and won't update with source changes.",
    hint: "The path includes 'Advanced' and 'Developer' — not 'Performance' as you might expect.",
    topic: "Optimization",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 18 — Grunt, Front-End Optimization & Edge Delivery"
  },
  {
    question: "What is Critical CSS and how does it improve page load performance?",
    answer: "Critical CSS is the minimal CSS required to render above-the-fold content (what users see without scrolling). It is inlined directly in the HTML <head> as a <style> tag, eliminating a render-blocking CSS request. The full stylesheet is then loaded asynchronously in the background using rel=\"preload\". Commerce has a 'Use CSS critical path' toggle under Advanced > Developer settings in the Admin.",
    hint: "Think about what the user sees first and how to render it without waiting for external CSS files.",
    topic: "Optimization",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 18 — Grunt, Front-End Optimization & Edge Delivery"
  },
  {
    question: "What are the three HTML attributes for controlling JavaScript loading behavior, and when should each be used?",
    answer: "1) No attribute — script blocks HTML parsing until downloaded and executed (use for critical inline scripts). 2) defer — script downloads in parallel but executes only after HTML parsing is complete, maintaining order (use for non-critical JS that depends on DOM). 3) async — script downloads and executes as soon as available, doesn't block parsing but order is not guaranteed (use for independent scripts like analytics).",
    hint: "Think about the relationship between downloading, parsing, and execution timing.",
    topic: "Optimization",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 18 — Grunt, Front-End Optimization & Edge Delivery"
  },
  {
    question: "How does the srcset attribute work for responsive images, and where are image sizes configured in Commerce?",
    answer: "srcset lists available image files with their widths (e.g., 'product-400.jpg 400w, product-800.jpg 800w'), while sizes tells the browser how large the image will be at each viewport. The browser calculates which source to download based on screen size and pixel density. In Commerce, image sizes are configured in the theme's view.xml file (etc/view.xml) under the <media><images> section — NOT in the Admin panel.",
    hint: "The configuration is in a theme XML file, not the admin, and the browser decides which image to download.",
    topic: "Optimization",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 18 — Grunt, Front-End Optimization & Edge Delivery"
  },
  {
    question: "What is Edge Delivery Services (EDS) and how does it differ from Fastly in Adobe Commerce?",
    answer: "EDS (also known as Franklin/Helix) is Adobe's document-based web publishing platform where content is authored in Google Docs or SharePoint, then served from a global edge network. It replaces the traditional Magento storefront presentation layer entirely. Fastly is a CDN/reverse proxy that caches responses from a traditional Commerce storefront. EDS is a different architecture (headless), while Fastly accelerates the same architecture.",
    hint: "One replaces the storefront, the other caches the existing storefront.",
    topic: "Edge Delivery Services",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 18 — Grunt, Front-End Optimization & Edge Delivery"
  },
  {
    question: "How do blocks work in Edge Delivery Services, and what is the decorate() function?",
    answer: "In EDS, content authors create blocks using tables in Google Docs (block name in first row). The EDS runtime converts this to HTML with CSS class names matching the block name, then auto-loads blocks/<name>/<name>.js and blocks/<name>/<name>.css. Each block's JS file exports a default decorate(block) function that receives the DOM element and transforms the generic HTML into a rich component. Commerce data is fetched via GraphQL/REST API calls.",
    hint: "The pattern flows from document tables to CSS classes to auto-loaded JavaScript files.",
    topic: "Edge Delivery Services",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 18 — Grunt, Front-End Optimization & Edge Delivery"
  },
  {
    question: "What role does Adobe Commerce play in an EDS architecture?",
    answer: "In an EDS architecture, Commerce becomes an API provider — it does NOT serve the storefront HTML. The EDS edge network serves pre-generated HTML from document sources, while Commerce handles the commerce backend (catalog, cart, checkout) via REST or GraphQL APIs called from the browser. This is the headless/composable commerce pattern where the presentation layer is completely separated from the commerce engine.",
    hint: "Think about what Commerce provides when it is not rendering the storefront itself.",
    topic: "Edge Delivery Services",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 18 — Grunt, Front-End Optimization & Edge Delivery"
  },
  {
    question: "What is the purpose of the dev/tools/grunt/configs/themes.js file?",
    answer: "themes.js tells Grunt which themes it can compile and their configuration. Each entry specifies the theme's area (frontend/adminhtml), name (Vendor/ThemeName), locale (en_US), entry point files (css/styles-m, css/styles-l), and DSL (design system language, typically 'less'). When you run grunt less:<theme-name>, Grunt uses this configuration to locate source files and determine output paths.",
    hint: "This is how Grunt knows which theme to target and where to find its source files.",
    topic: "Grunt",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 18 — Grunt, Front-End Optimization & Edge Delivery"
  },
  {
    question: "How does static file compilation work in developer mode without Grunt?",
    answer: "Without Grunt in developer mode, Commerce compiles CSS on-demand: when a browser requests styles-m.css, Commerce checks pub/static/ and if the file does not exist, it resolves the LESS source via the fallback system, preprocesses @imports into var/view_preprocessed/, and generates the CSS in pub/static/. This first-request compilation is slow. Grunt pre-compiles these files so they are already available when requested.",
    hint: "Think about what happens on the very first page load before any compiled CSS exists.",
    topic: "Grunt",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 18 — Grunt, Front-End Optimization & Edge Delivery"
  },
  {
    question: "What key differences exist between a traditional Commerce theme and an EDS project in terms of technology stack?",
    answer: "Traditional Commerce themes use PHP + PHTML templates, XML layout files, LESS for CSS, Grunt for building, and theme fallback inheritance. EDS projects use vanilla JavaScript + CSS + HTML, document tables for layout (Google Docs), plain CSS with CSS variables (no LESS), GitHub-based deployment, and blocks as the customization unit (JS + CSS file pairs). There are no PHP files, no layout XML, and no LESS in an EDS project.",
    hint: "Compare the language, template engine, CSS system, and deployment mechanism of each approach.",
    topic: "Edge Delivery Services",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 18 — Grunt, Front-End Optimization & Edge Delivery"
  },
  {
    question: "What is the purpose of fstab.yaml in an EDS project?",
    answer: "fstab.yaml is the configuration file that links the GitHub repository to the document source — either Google Drive or SharePoint. It defines the mount points that tell the EDS system where to find the content documents that will be converted into web pages. Without this configuration, the EDS runtime would not know where to fetch the authored content from.",
    hint: "Think of it as the bridge between the code repository and the content authoring platform.",
    topic: "Edge Delivery Services",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 18 — Grunt, Front-End Optimization & Edge Delivery"
  },
  {
    question: "When would you inherit from Magento/blank vs Magento/luma?",
    answer: "Blank: when building a completely custom design from scratch (more control, more work). Luma: when extending or lightly modifying the default Luma look.",
    hint: "",
    topic: "Theme Management",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 1 — Theme Architecture & Creating a New Theme"
  },
  {
    question: "What is the relationship between Magento/blank and Magento/luma?",
    answer: "Magento/blank is the root theme (no parent) — minimal structural base. Magento/luma extends blank and adds a full visual design. Inheriting from luma automatically gives you blank through the chain.",
    hint: "",
    topic: "Theme Management",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 1 — Theme Architecture & Creating a New Theme"
  },
  {
    question: "What is the key behavioral difference between developer mode and production mode for static files?",
    answer: "Developer mode: files served on-the-fly via symlinks — no deploy needed. Production mode: must run bin/magento setup:static-content:deploy after any CSS/JS change.",
    hint: "",
    topic: "Theme Management",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 1 — Theme Architecture & Creating a New Theme"
  },
  {
    question: "Which files are strictly required for a Magento theme to work?",
    answer: "theme.xml and registration.php. composer.json is recommended but only required if distributing via Composer/Marketplace.",
    hint: "",
    topic: "Theme Management",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 1 — Theme Architecture & Creating a New Theme"
  },
  {
    question: "What is the second argument of ComponentRegistrar::register() in registration.php, and what format must it follow?",
    answer: "The theme identifier — format: frontend/Vendor/theme. It must match the directory path exactly. Casing matters. Admin themes use adminhtml/Vendor/theme instead.",
    hint: "",
    topic: "Theme Management",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 1 — Theme Architecture & Creating a New Theme"
  },
  {
    question: "Which element in theme.xml is the only truly required one?",
    answer: "<title>. Both <parent> and <media> are optional.",
    hint: "",
    topic: "Theme Management",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 1 — Theme Architecture & Creating a New Theme"
  },
  {
    question: "What does etc/view.xml control, and when is it required?",
    answer: "Image dimensions per context (e.g. category_page_grid, product_page_image_medium). Required only if your theme changes image dimensions — otherwise the parent's dimensions are inherited.",
    hint: "",
    topic: "Theme Management",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 1 — Theme Architecture & Creating a New Theme"
  },
  {
    question: "What happens if you omit <parent> in theme.xml?",
    answer: "The theme becomes a root theme with no fallback to any other theme. It must provide everything itself.",
    hint: "",
    topic: "Theme Management",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 1 — Theme Architecture & Creating a New Theme"
  },
  {
    question: "After creating theme.xml and registration.php, what command must you run before the theme appears in the Admin dropdown — and why?",
    answer: "bin/magento setup:upgrade. It scans registered components and inserts the theme into the theme database table.",
    hint: "",
    topic: "Theme Management",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 1 — Theme Architecture & Creating a New Theme"
  },
  {
    question: "What is the Magento theme fallback order when resolving a file?",
    answer: "Current theme → Parent theme(s) → Module view files (view/frontend/) → Module base area (view/base/) → lib/web/",
    hint: "Think about what Magento checks first when it can't find a file.",
    topic: "Theme Management",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 1 — Theme Architecture & Creating a New Theme"
  },
  {
    question: "Where do deployed static files live, and where is LESS compiled?",
    answer: "Deployed files: pub/static/frontend/<Vendor>/<theme>/<locale>/. LESS compilation: var/view_preprocessed/.",
    hint: "",
    topic: "Theme Management",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 1 — Theme Architecture & Creating a New Theme"
  },
  {
    question: "How does Magento handle layout XML files vs templates/static assets across the fallback chain?",
    answer: "Layout XML files are merged — all matching files across the chain are combined. Templates and static assets use first-match-wins — only the first file found is used.",
    hint: "",
    topic: "Theme Management",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 1 — Theme Architecture & Creating a New Theme"
  },
  {
    question: "What directory format do you use inside your theme to override a specific module's templates or layouts?",
    answer: "Vendor_Module/ (underscore, not slash). Example: Magento_Catalog/templates/ inside your theme root.",
    hint: "Underscore, not slash — Vendor_Module, not Vendor/Module.",
    topic: "Theme Management",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 1 — Theme Architecture & Creating a New Theme"
  },
  {
    question: "How do template overrides behave across the fallback chain?",
    answer: "First-match-wins. Once you create a template in your theme, the parent's version is completely ignored — it is NOT merged.",
    hint: "",
    topic: "Theme Inheritance & Extension",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 2 — Extending Existing Themes & Theme Inheritance"
  },
  {
    question: "When you create _theme.less in your child theme, does it merge with the parent's _theme.less?",
    answer: "No — it completely replaces the parent's _theme.less. Unlike layout XML, it is NOT merged. If you need parent rules, you must @import or duplicate them.",
    hint: "",
    topic: "Theme Inheritance & Extension",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 2 — Extending Existing Themes & Theme Inheritance"
  },
  {
    question: "How are requirejs-config.js files handled across the fallback chain?",
    answer: "They are merged across all themes and modules (like layout XML). File-level JS overrides at the same path use first-match-wins.",
    hint: "",
    topic: "Theme Inheritance & Extension",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 2 — Extending Existing Themes & Theme Inheritance"
  },
  {
    question: "Where do custom fonts go and how are they declared?",
    answer: "Files go in web/fonts/. Declared via @font-face in _theme.less (or .lib-font-face() LESS mixin in   _typography.less). Font family referenced via @font-family__base variable override in _theme.less (child themes).",
    hint: "",
    topic: "Theme Inheritance & Extension",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 2 — Extending Existing Themes & Theme Inheritance"
  },
  {
    question: "What is the closest mechanism to 'overriding' a layout block, given that layout XML is always merged?",
    answer: "Use remove=\"true\" on <referenceBlock>. The original file still merges into the chain, but the named element is removed after. It cannot be reversed within that page load.",
    hint: "",
    topic: "Theme Inheritance & Extension",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 2 — Extending Existing Themes & Theme Inheritance"
  },
  {
    question: "How does CE vs EE differ in terms of the theme inheritance mechanism?",
    answer: "The mechanism is identical. EE just adds more modules (Page Builder, B2B, Staging) that may need to be overridden — the fallback chain itself does not change.",
    hint: "",
    topic: "Theme Inheritance & Extension",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 2 — Extending Existing Themes & Theme Inheritance"
  },
  {
    question: "How do you override a lib/web/ file in your theme?",
    answer: "Strip lib/web/ from the path and place the file in your theme's web/ directory. Example: lib/web/css/source/lib/_variables.less → web/css/source/lib/_variables.less.",
    hint: "",
    topic: "Theme Inheritance & Extension",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 2 — Extending Existing Themes & Theme Inheritance"
  },
  {
    question: "What is the final fallback in the static file chain? Is there anything beyond it?",
    answer: "lib/web/ is the final fallback. There is no further fallback beyond the library.",
    hint: "",
    topic: "Theme Inheritance & Extension",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 2 — Extending Existing Themes & Theme Inheritance"
  },
  {
    question: "What is the rule for mirroring a file path to override it in your theme?",
    answer: "Mirror the original path and replace view/frontend/ with Vendor_Module/. Example: vendor/magento/module-catalog/view/frontend/templates/product/view.phtml → Magento_Catalog/templates/product/view.phtml in your theme.",
    hint: "The override path for a module file and a parent theme file are identical — only the destination matters.",
    topic: "Theme Inheritance & Extension",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 2 — Extending Existing Themes & Theme Inheritance"
  },
  {
    question: "What is the difference between _variables.less and _theme.less?",
    answer: "_theme.less: correct place for variable overrides in child themes — changes cascade automatically   everywhere the variable is used. _variables.less: only appropriate for standalone themes (not extending Blank/Luma) —   using it in a child theme completely replaces the parent's file, wiping out variables you didn't redefine.",
    hint: "",
    topic: "Theme Inheritance & Extension",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 2 — Extending Existing Themes & Theme Inheritance"
  },
  {
    question: "What format does the <parent> tag in theme.xml use, and what is a common distractor?",
    answer: "Vendor/theme format (e.g. Magento/luma). NOT the Composer package name (magento/theme-frontend-luma) or the filesystem path — it uses the registered theme identity.",
    hint: "",
    topic: "Theme Inheritance & Extension",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 2 — Extending Existing Themes & Theme Inheritance"
  },
  {
    question: "How many direct parents can a Magento theme have? Can chains be multiple levels?",
    answer: "One direct parent only. Chains can be multiple levels deep: MyTheme → Luma → Blank.",
    hint: "",
    topic: "Theme Inheritance & Extension",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 2 — Extending Existing Themes & Theme Inheritance"
  },
  {
    question: "What does bin/magento i18n:pack do?",
    answer: "Compiles a translated CSV into a language pack. It is the end of the translation pipeline.",
    hint: "",
    topic: "Transactional Emails & Translations",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 3 — Transactional Emails & Translations"
  },
  {
    question: "Where do the shared header and footer for all transactional emails live?",
    answer: "Magento_Email/email/header.html and footer.html. Overriding them affects every transactional email at once.",
    hint: "",
    topic: "Transactional Emails & Translations",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 3 — Transactional Emails & Translations"
  },
  {
    question: "Where do individual transactional email templates live (e.g. order, account)?",
    answer: "In their owning module: Magento_Sales/email/ for order/shipment emails, Magento_Customer/email/ for account/password emails.",
    hint: "",
    topic: "Transactional Emails & Translations",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 3 — Transactional Emails & Translations"
  },
  {
    question: "What is the priority chain for email template resolution?",
    answer: "Admin DB template (email_template table) > theme file override > module default. Admin always wins.",
    hint: "",
    topic: "Transactional Emails & Translations",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 3 — Transactional Emails & Translations"
  },
  {
    question: "How are admin-configured email templates stored, and what is their scope?",
    answer: "Stored in the email_template database table. Scoped per store view.",
    hint: "",
    topic: "Transactional Emails & Translations",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 3 — Transactional Emails & Translations"
  },
  {
    question: "What is the difference between {{if}} and {{depend}} in email templates?",
    answer: "{{if}} evaluates an expression and supports comparisons and logic. {{depend}} checks if a variable is truthy/exists — simpler, no logic operators.",
    hint: "",
    topic: "Transactional Emails & Translations",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 3 — Transactional Emails & Translations"
  },
  {
    question: "What is a non-obvious use case for theme i18n/en_US.csv?",
    answer: "Rebranding — overriding same-language phrases without touching module files. Example: changing 'Add to Cart' to 'Add to Bag' across the storefront.",
    hint: "",
    topic: "Transactional Emails & Translations",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 3 — Transactional Emails & Translations"
  },
  {
    question: "What does {{layout handle=\"...\"}} do inside an email template?",
    answer: "Renders a full layout block inside the email by invoking Magento's layout engine. Used for complex dynamic content like the order items table in order confirmation emails.",
    hint: "",
    topic: "Transactional Emails & Translations",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 3 — Transactional Emails & Translations"
  },
  {
    question: "Name the six main email template directives.",
    answer: "{{var}}, {{if}}, {{depend}}, {{config}}, {{trans}}, {{layout}}",
    hint: "There is also {{trans}} and {{customVar}} — but these five are the core set.",
    topic: "Transactional Emails & Translations",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 3 — Transactional Emails & Translations"
  },
  {
    question: "What does bin/magento i18n:collect-phrases do?",
    answer: "Scans the codebase for all translatable strings (__(), $.mage.__(), translate=\"true\", {{trans}}) and outputs a source CSV. The output is untranslated — it's the starting point for a translator.",
    hint: "",
    topic: "Transactional Emails & Translations",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 3 — Transactional Emails & Translations"
  },
  {
    question: "What is the translation priority order?",
    answer: "Theme i18n/ (highest) > Module i18n/ > Language pack (lowest).",
    hint: "",
    topic: "Transactional Emails & Translations",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 3 — Transactional Emails & Translations"
  },
  {
    question: "What are the four translation mechanisms and their respective contexts?",
    answer: "__() → PHP classes/templates. $.mage.__() → JavaScript files. translate=\"true\" → layout/XML config. {{trans}} → email templates.",
    hint: "Match the mechanism to where the string lives in the codebase.",
    topic: "Transactional Emails & Translations",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 3 — Transactional Emails & Translations"
  },
  {
    question: "What must you run after translation changes for JavaScript translations to become active?",
    answer: "bin/magento setup:static-content:deploy <locale> — compiles js-translation.json for the target locale.",
    hint: "",
    topic: "Transactional Emails & Translations",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 3 — Transactional Emails & Translations"
  },
  {
    question: "How is CSS applied to transactional emails in Magento?",
    answer: "Write CSS in email.less / email-inline.less. The Emogrifier library automatically inlines styles into style=\"\" attributes before sending. You do NOT write inline styles manually.",
    hint: "",
    topic: "Transactional Emails & Translations",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 3 — Transactional Emails & Translations"
  },
  {
    question: "What does ifconfig=\"path/to/config\" on a block do?",
    answer: "Renders the block only when the specified system config path is enabled — avoids PHP conditionals in templates.",
    hint: "",
    topic: "Layout XML Instructions",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 4 — Layout XML Instructions & Page Layouts"
  },
  {
    question: "How do you access block arguments in a .phtml template?",
    answer: "Via magic getters: $block->getCamelCaseName() — or via $block->getData('argument_name'). Both are equivalent.",
    hint: "",
    topic: "Layout XML Instructions",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 4 — Layout XML Instructions & Page Layouts"
  },
  {
    question: "Why is adding blocks to default.xml a performance concern?",
    answer: "default.xml applies to every single page on the site. Adding heavy or unnecessary blocks here increases load on all pages.",
    hint: "",
    topic: "Layout XML Instructions",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 4 — Layout XML Instructions & Page Layouts"
  },
  {
    question: "What does <update handle=\"...\"/> do in layout XML?",
    answer: "Pulls in another layout handle's full set of instructions and merges them into the current page. Used to share layout logic across multiple handles.",
    hint: "",
    topic: "Layout XML Instructions",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 4 — Layout XML Instructions & Page Layouts"
  },
  {
    question: "What are the two required steps to add a new custom page layout?",
    answer: "1) Create the XML file in Magento_Theme/page_layout/. 2) Register it in layouts.xml with a matching id attribute. The id must match the filename exactly (without .xml).",
    hint: "",
    topic: "Layout XML Instructions",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 4 — Layout XML Instructions & Page Layouts"
  },
  {
    question: "What is the layout handle loading order?",
    answer: "1) default → 2) page-specific (route_controller_action) → 3) <update> handles → 4) programmatically added handles.",
    hint: "",
    topic: "Layout XML Instructions",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 4 — Layout XML Instructions & Page Layouts"
  },
  {
    question: "Name the 3 layout file types and their root XML elements.",
    answer: "Page configuration: <page> root — for specific page handles. Generic layout: <layout> root — for reusable handles. Page layout: <layout> root, containers only — structural skeleton.",
    hint: "",
    topic: "Layout XML Instructions",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 4 — Layout XML Instructions & Page Layouts"
  },
  {
    question: "What do before=\"-\" and after=\"-\" mean in layout XML?",
    answer: "before=\"-\" means first position in the parent. after=\"-\" means last position in the parent.",
    hint: "",
    topic: "Layout XML Instructions",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 4 — Layout XML Instructions & Page Layouts"
  },
  {
    question: "What is the full page performance implication of cacheable=\"false\" on a single block?",
    answer: "It disables FPC (Full Page Cache) for the ENTIRE page — not just that block. Every request bypasses Varnish/Fastly and goes all the way to PHP.",
    hint: "",
    topic: "Layout XML Instructions",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 4 — Layout XML Instructions & Page Layouts"
  },
  {
    question: "Name all xsi:type values available for block arguments.",
    answer: "string, bool, number, null, object, array, helper, url",
    hint: "",
    topic: "Layout XML Instructions",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 4 — Layout XML Instructions & Page Layouts"
  },
  {
    question: "What does <container> render if htmlTag is omitted?",
    answer: "Nothing — it is a logical grouping only with no visible HTML output.",
    hint: "",
    topic: "Layout XML Instructions",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 4 — Layout XML Instructions & Page Layouts"
  },
  {
    question: "What is the key difference between <block> and <container> in layout XML?",
    answer: "<block> requires a PHP class and produces output via a template. <container> is structural only — no PHP class, renders no HTML if htmlTag is omitted.",
    hint: "",
    topic: "Layout XML Instructions",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 4 — Layout XML Instructions & Page Layouts"
  },
  {
    question: "What is the difference between remove=\"true\" and display=\"false\" on a referenceBlock?",
    answer: "remove=\"true\": block is not instantiated, no HTML, permanent for that page load — cannot be reversed. display=\"false\": block is instantiated and in the tree, no HTML output, but can be re-enabled.",
    hint: "",
    topic: "Layout XML Instructions",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 4 — Layout XML Instructions & Page Layouts"
  },
  {
    question: "When should you choose a layout override over extending with remove=\"true\"?",
    answer: "When the number of removals/changes makes merging impractical — e.g. you need to remove most of what the original file does, making a clean-slate override cleaner.",
    hint: "",
    topic: "Extending vs Overriding Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 5 — Extending vs Merging vs Overriding Layout XML"
  },
  {
    question: "When you use override/base/, does it remove all other files for that handle?",
    answer: "No — it replaces only one specific file (the module's). Other modules and theme files for the same handle are still merged.",
    hint: "",
    topic: "Extending vs Overriding Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 5 — Extending vs Merging vs Overriding Layout XML"
  },
  {
    question: "Is remove=\"true\" reversible within the same page load?",
    answer: "No — once applied, no other layout instruction in that page load can bring the element back.",
    hint: "",
    topic: "Extending vs Overriding Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 5 — Extending vs Merging vs Overriding Layout XML"
  },
  {
    question: "What is the default behavior when you create a layout file in your theme?",
    answer: "It automatically extends/merges — any layout file in a theme is merged with all other files sharing the same handle. No special path is needed to extend.",
    hint: "",
    topic: "Extending vs Overriding Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 5 — Extending vs Merging vs Overriding Layout XML"
  },
  {
    question: "What are the 3 layout file paths and what does each do?",
    answer: "Magento_Catalog/layout/handle.xml → extends/merges. Magento_Catalog/layout/override/base/handle.xml → replaces the module's file. Magento_Catalog/layout/override/theme/Magento/luma/handle.xml → replaces a parent theme's specific file.",
    hint: "Only the override/ subdirectory distinguishes extending from overriding.",
    topic: "Extending vs Overriding Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 5 — Extending vs Merging vs Overriding Layout XML"
  },
  {
    question: "What does override/base/ target vs override/theme/<Vendor>/<theme>/?",
    answer: "override/base/ targets the module's original layout file. override/theme/<Vendor>/<theme>/ targets a specific parent theme's layout file.",
    hint: "",
    topic: "Extending vs Overriding Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 5 — Extending vs Merging vs Overriding Layout XML"
  },
  {
    question: "A layout override is NOT a complete page override — what exactly does it replace?",
    answer: "Only the one specific file it targets. All other files for the same handle (from other modules and themes) are still merged normally.",
    hint: "",
    topic: "Extending vs Overriding Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 5 — Extending vs Merging vs Overriding Layout XML"
  },
  {
    question: "How does remove=\"true\" differ from a layout override for removing a block?",
    answer: "remove=\"true\": surgical — original file still merges, only the named element is removed, upgrade-safe, low maintenance. Layout override: replaces the entire file — you own everything in it, higher maintenance, not upgrade-safe.",
    hint: "",
    topic: "Extending vs Overriding Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 5 — Extending vs Merging vs Overriding Layout XML"
  },
  {
    question: "What is the upgrade safety trade-off between extending and overriding?",
    answer: "Extending is upgrade-safe — module updates still apply automatically. Overriding silently diverges — when Magento upgrades the original file, your override ignores those changes.",
    hint: "",
    topic: "Extending vs Overriding Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 5 — Extending vs Merging vs Overriding Layout XML"
  },
  {
    question: "What is the merge order from lowest to highest priority?",
    answer: "Modules (by module sequence order) → grandparent theme → parent theme → current theme. Your theme is merged last and wins on conflicts.",
    hint: "",
    topic: "Extending vs Overriding Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 5 — Extending vs Merging vs Overriding Layout XML"
  },
  {
    question: "What is the golden rule for escaping in Magento?",
    answer: "Escape at output, not at input. Store raw data, escape when rendering in templates. Escaping at input causes double-escaping and context mismatches across different output formats.",
    hint: "",
    topic: "PHTML Templates & Security",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 6 — PHTML Templates & Template Security"
  },
  {
    question: "Why is getChildHtml() a canonical @noEscape case?",
    answer: "Because the child block is responsible for its own escaping — the output is already appropriately escaped by the child's template.",
    hint: "",
    topic: "PHTML Templates & Security",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 6 — PHTML Templates & Template Security"
  },
  {
    question: "Why is escapeHtml() wrong for URL attributes like href?",
    answer: "escapeHtml() does NOT strip the javascript: protocol — <a href=\"javascript:alert(1)\"> passes through encoded but remains an XSS vector. Only escapeUrl() strips dangerous URL schemes.",
    hint: "",
    topic: "PHTML Templates & Security",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 6 — PHTML Templates & Template Security"
  },
  {
    question: "What does /* @noEscape */ mean and when should you use it?",
    answer: "\"I have verified this output is safe.\" Use for: trusted/already-escaped output, type-cast integers or booleans, and getChildHtml() return values.",
    hint: "",
    topic: "PHTML Templates & Security",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 6 — PHTML Templates & Template Security"
  },
  {
    question: "What does /* @escapeNotVerified */ mean?",
    answer: "\"Escaping has not been verified here — this is a TODO.\" Should not exist in production-ready code. Treat as a code smell.",
    hint: "",
    topic: "PHTML Templates & Security",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 6 — PHTML Templates & Template Security"
  },
  {
    question: "Name all five escape methods and their exact output contexts.",
    answer: "escapeHtml() → text between HTML tags. escapeHtmlAttr() → HTML attribute values (non-URL). escapeUrl() → href, src, action. escapeJs() → inside JS string literals. escapeCss() → inside CSS property values.",
    hint: "Think about where in the HTML the value is being output.",
    topic: "PHTML Templates & Security",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 6 — PHTML Templates & Template Security"
  },
  {
    question: "Are $block->escapeHtml() and $escaper->escapeHtml() equivalent?",
    answer: "Yes — $block->escape*() methods delegate to the Escaper internally. Both are valid; $escaper is preferred in Magento 2.4+.",
    hint: "",
    topic: "PHTML Templates & Security",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 6 — PHTML Templates & Template Security"
  },
  {
    question: "getChildHtml() uses which layout XML attribute — name or as?",
    answer: "The as=\"\" attribute (alias). If a child has name=\"product.price\" and as=\"price\", you call $block->getChildHtml('price'). Using the name attribute is a classic mistake.",
    hint: "",
    topic: "PHTML Templates & Security",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 6 — PHTML Templates & Template Security"
  },
  {
    question: "What is the template path format in layout XML, and name two common distractor errors.",
    answer: "Vendor_Module::subdir/file.phtml. Common errors: using a slash instead of underscore (Magento/Catalog::), or including 'templates/' in the path after :: (both wrong).",
    hint: "",
    topic: "PHTML Templates & Security",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 6 — PHTML Templates & Template Security"
  },
  {
    question: "What is SecureHtmlRenderer used for, and from which Magento version is it required?",
    answer: "CSP-compatible inline scripts and styles in .phtml files. Required from Magento 2.3.4+. Raw <script> tags in templates are flagged by Content Security Policy in strict mode.",
    hint: "",
    topic: "PHTML Templates & Security",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 6 — PHTML Templates & Template Security"
  },
  {
    question: "What is the template fallback order?",
    answer: "Current theme → parent theme(s) → module view/frontend/templates/",
    hint: "",
    topic: "PHTML Templates & Security",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 6 — PHTML Templates & Template Security"
  },
  {
    question: "What are the two required files at the root of a Magento 2 theme directory for the theme to function?",
    answer: "The two required files are theme.xml (which declares the theme title, parent theme, and preview image) and registration.php (which registers the theme with Magento's component system using ComponentRegistrar::THEME). composer.json is optional and only needed for Composer-based distribution.",
    hint: "One file declares metadata like the parent theme, the other registers the component with Magento's system.",
    topic: "Theme Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 7 — Week 1 Review + First Practice Test"
  },
  {
    question: "In Magento 2, what is the difference between how layout XML files and template PHTML files are handled when the same file exists in both a parent and child theme?",
    answer: "Layout XML files with the same handle name are merged — both the parent and child theme contributions combine on the page. Template PHTML files are overridden — the child theme's file completely replaces the parent's. Static files (CSS, JS, images) are also overridden, not merged.",
    hint: "Think about whether two files of the same type can both contribute to the output, or if one replaces the other entirely.",
    topic: "Theme Inheritance",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 7 — Week 1 Review + First Practice Test"
  },
  {
    question: "What is the difference between a <container> and a <block> element in Magento 2 layout XML?",
    answer: "A <block> is associated with a PHP class and renders a template file. A <container> is purely structural — it wraps children in an HTML tag (via htmlTag, htmlClass, htmlId attributes) but has no PHP class and no template attribute. Containers cannot have a class or template attribute, while blocks cannot have htmlTag.",
    hint: "One element has logic and rendering capability, the other is just a structural wrapper for organizing child elements.",
    topic: "Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 7 — Week 1 Review + First Practice Test"
  },
  {
    question: "What does the layout XML attribute before=\"-\" mean when used on a block declaration, and what is its counterpart?",
    answer: "before=\"-\" positions the block as the first child among its siblings in the parent container. Its counterpart is after=\"-\", which positions the block as the last child. You can also use before=\"some.block.name\" or after=\"some.block.name\" to position relative to a specific sibling.",
    hint: "The dash character is a special value that indicates an extreme position among siblings.",
    topic: "Layout XML Positioning",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 7 — Week 1 Review + First Practice Test"
  },
  {
    question: "Which escaper method should be used in each of these contexts: HTML text nodes, HTML attributes, URLs in href/src, and JavaScript string literals?",
    answer: "For HTML text nodes use escapeHtml(), for HTML attributes use escapeHtmlAttr(), for URLs in href/src use escapeUrl(), and for JavaScript string literals use escapeJs(). Using the wrong method for the context (e.g., escapeHtml() inside a JavaScript string) does NOT protect against XSS — each context requires its specific escaper.",
    hint: "Magento provides a dedicated method for each output context — there are five total including escapeCss().",
    topic: "Output Escaping",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 7 — Week 1 Review + First Practice Test"
  },
  {
    question: "What is the translation priority chain in Magento 2, from highest to lowest priority?",
    answer: "The priority from highest to lowest is: Database translations (admin-configured in Stores > Translations) > Theme i18n CSV files > Module i18n CSV files > Original string (fallback). This means database translations always win over file-based translations, and theme CSV files override module CSV files for the same locale.",
    hint: "Admin-configured settings typically have the highest priority in Magento, and the original untranslated string is the last resort.",
    topic: "Translations & i18n",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 7 — Week 1 Review + First Practice Test"
  },
  {
    question: "What does the __() function return in Magento 2, and why does this matter for strict type comparisons?",
    answer: "The __() function returns a Magento\\Framework\\Phrase object, not a string. This matters because strict comparison ($phrase === 'Hello') will return FALSE since you're comparing an object to a string. To get a real string for comparison, you must cast it: (string)__('Hello'). When echoed, the Phrase object is automatically cast to string via __toString().",
    hint: "This function wraps the value in a special object type that supports lazy translation resolution.",
    topic: "Translations & i18n",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 7 — Week 1 Review + First Practice Test"
  },
  {
    question: "What is the difference between remove=\"true\" and display=\"false\" when used on a <referenceBlock> in layout XML?",
    answer: "remove=\"true\" completely removes the block from the layout tree — it cannot be re-enabled by later handles, and any subsequent references to it will have no effect. display=\"false\" hides the block but keeps it in the layout object — the block is still instantiated and its toHtml() returns empty string, but it could theoretically be retrieved programmatically. The block can be re-enabled with display=\"true\" in a later handle.",
    hint: "One is permanent deletion, the other is a reversible hide that preserves the block object in memory.",
    topic: "Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 7 — Week 1 Review + First Practice Test"
  },
  {
    question: "In a Magento 2 PHTML template, what is the correct variable to use for referring to the current block instance, and what is its deprecated alternative?",
    answer: "$block is the correct variable in Magento 2 templates — it refers to the Block class instance associated with that template. $this also works but is deprecated and should not be used in new code. The exam specifically tests whether you know $block is the recommended variable.",
    hint: "The correct variable is a short, descriptive name that directly indicates what it represents.",
    topic: "Templates & Blocks",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 7 — Week 1 Review + First Practice Test"
  },
  {
    question: "What is the correct format for referencing a template file in Magento 2 layout XML, and what does each part of the reference mean?",
    answer: "The format is Vendor_Module::path/to/file.phtml. The :: separates the module identifier (using underscore notation like Magento_Catalog) from the path relative to the module's templates/ directory. For example, Magento_Catalog::product/view.phtml resolves to the templates/product/view.phtml file within the Magento_Catalog module. Direct file paths are not accepted in layout XML.",
    hint: "A double-colon separates two parts: the module identifier and the relative template path.",
    topic: "Templates & Blocks",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 7 — Week 1 Review + First Practice Test"
  },
  {
    question: "What layout handle is loaded on every frontend page in Magento 2, and how is it commonly used?",
    answer: "The default.xml handle is loaded on every frontend page. Changes made in default.xml affect the entire site. It is commonly used to add blocks that should appear site-wide, such as header elements, footer content, or global JavaScript. The exam frequently asks 'how do you add a block to every page?' — the answer involves using default.xml.",
    hint: "This handle has a generic name suggesting it applies universally.",
    topic: "Layout Handles",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 7 — Week 1 Review + First Practice Test"
  },
  {
    question: "How does the escapeHtml() method work when you need to allow specific HTML tags in the output, such as <b> and <em>?",
    answer: "You pass an array of allowed tag names as the second argument: $escaper->escapeHtml($text, ['b', 'em', 'a']). Tags not in the whitelist are stripped or encoded. Script and style tags can never be allowed through this method — they are always removed regardless of the allowed tags list. Without the second argument, all HTML is encoded.",
    hint: "The method accepts an optional second parameter that acts as a whitelist.",
    topic: "Output Escaping",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 7 — Week 1 Review + First Practice Test"
  },
  {
    question: "What is the correct path format used in registration.php when registering a Magento 2 frontend theme?",
    answer: "The path format is 'frontend/Vendor/theme' — three parts separated by forward slashes. It does NOT include the app/design/ prefix. For example: ComponentRegistrar::register(ComponentRegistrar::THEME, 'frontend/Acme/retail', __DIR__). For admin themes, replace 'frontend' with 'adminhtml'.",
    hint: "The path starts with the area name and includes the vendor and theme name, but not the full filesystem path.",
    topic: "Theme Registration",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 7 — Week 1 Review + First Practice Test"
  },
  {
    question: "What does the ifconfig attribute do on a <block> element in layout XML?",
    answer: "The ifconfig attribute conditionally renders a block based on a system configuration value. The syntax is ifconfig=\"path/to/config\" where the path corresponds to a Magento system configuration field. If the config value is truthy, the block renders; if falsy, it does not. This allows conditional block display without writing any custom PHP code.",
    hint: "This attribute connects block visibility to admin system configuration settings.",
    topic: "Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 7 — Week 1 Review + First Practice Test"
  },
  {
    question: "What is the complete theme fallback chain when a custom theme declares Magento/luma as its parent?",
    answer: "The fallback chain is: CustomTheme -> Magento/luma -> Magento/blank -> Module default files. Luma's parent is Magento/blank, and Blank has no parent (it is the root theme). Magento checks for files in the most specific theme first and works down the chain until found. This applies separately to templates, layout XML, and web assets.",
    hint: "There are three theme levels before falling back to the module's own view files.",
    topic: "Theme Inheritance",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 7 — Week 1 Review + First Practice Test"
  },
  {
    question: "Where does the view.xml configuration file live in a Magento 2 theme, and how is it handled during theme inheritance?",
    answer: "view.xml lives in the theme's etc/ subdirectory (e.g., app/design/frontend/Vendor/theme/etc/view.xml). Unlike layout XML which is merged, view.xml is completely replaced by the child theme's version — it is NOT merged. If a child theme provides its own view.xml, the parent's view.xml is entirely ignored. This file configures image dimensions and other display settings.",
    hint: "This config file is in the etc/ folder and follows a different inheritance rule than layout files.",
    topic: "Theme Configuration",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 13 — Practice Test Review & Weak Area Deep Dive"
  },
  {
    question: "What is the root XML element for a Page Layout file versus a Page Configuration file in Magento 2?",
    answer: "Page Layout files use <layout> as the root element and define the column structure (e.g., 1column, 2columns-left). Page Configuration files use <page> as the root element and configure what content goes inside those columns (blocks, head assets, etc.). Both use different XSD schemas: page_layout.xsd for page layouts and page_configuration.xsd for page configurations. Generic layout files also use <layout> as root.",
    hint: "The two main layout file types have different root elements — one shares its root element name with a third type.",
    topic: "Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 13 — Practice Test Review & Weak Area Deep Dive"
  },
  {
    question: "What is the correct format for declaring a parent theme in theme.xml, and what common format mistakes appear on the exam?",
    answer: "The correct format uses a forward slash: <parent>Magento/blank</parent>. Common wrong formats include: Magento_Blank (underscore instead of slash), Magento\\blank (backslash), magento/blank (wrong case). The format is case-sensitive and must match the vendor/theme registration path exactly as specified in the parent theme's registration.php.",
    hint: "The separator character matters — it's the same one used in URL paths, not PHP namespaces.",
    topic: "Theme Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 13 — Practice Test Review & Weak Area Deep Dive"
  },
  {
    question: "What is the purpose of _theme.less in Magento 2, and where does it sit in the import order of styles-m.less?",
    answer: "_theme.less is the primary entry point for theme variable overrides. In styles-m.less, it is imported AFTER _reset.less and _styles.less (which includes lib variables). Because LESS uses lazy evaluation where the last variable declaration wins, overrides in _theme.less take precedence over the library defaults defined earlier in the import chain.",
    hint: "This file's position in the import chain is specifically designed so that its declarations override earlier defaults.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 13 — Practice Test Review & Weak Area Deep Dive"
  },
  {
    question: "What is the difference between _module.less and _extend.less when overriding a module's styles in a Magento 2 theme?",
    answer: "Overriding _module.less replaces the entire module's styles — it is high risk because you lose all original styles and must maintain the complete stylesheet. Using _extend.less appends additional rules without removing existing ones — it is lower risk and preferred for small changes. The override path is the same for both: <theme>/<Vendor_Module>/web/css/source/_module.less or _extend.less.",
    hint: "One approach is additive (low risk), the other is a complete replacement (high risk).",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 13 — Practice Test Review & Weak Area Deep Dive"
  },
  {
    question: "What does @import (reference) do in LESS, and why is it important in Magento 2?",
    answer: "@import (reference) imports a LESS file's variables and mixins but suppresses all CSS output from that file. This means you can access variables and mixins defined in another file without duplicating its CSS in your output. Magento uses this extensively when a module needs variables from the UI library without outputting the library's CSS again. Compare with regular @import which includes and outputs all CSS.",
    hint: "This import variant lets you use definitions from a file without including any of its actual CSS output.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 13 — Practice Test Review & Weak Area Deep Dive"
  },
  {
    question: "How do layout handles load for a product page request to /catalog/product/view/id/42 in Magento 2?",
    answer: "Multiple handles load in order: (1) 'default' — always loaded on every page, (2) 'catalog_product_view' — the controller action handle, (3) 'catalog_product_view_id_42' — entity-specific handle for that product, (4) 'catalog_product_view_type_simple' — product type handle. The controller action handle format is module_controller_action in all lowercase. Custom handles can also be added programmatically.",
    hint: "Several handles load from general to specific, starting with the universal handle and ending with entity-specific ones.",
    topic: "Layout Handles",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 13 — Practice Test Review & Weak Area Deep Dive"
  },
  {
    question: "What are the three distinct attributes 'name', 'class', and 'as' on a <block> element, and how is each used?",
    answer: "'name' is the unique layout identifier (dot-separated) used in <referenceBlock name=\"...\"> to modify the block. 'class' is the fully qualified PHP class name (backslash-separated) — it is optional and defaults to Magento\\Framework\\View\\Element\\Template. 'as' is an optional alias used in parent templates for $block->getChildHtml('alias'). If 'as' is omitted, getChildHtml() falls back to using 'name'.",
    hint: "Each attribute serves a different purpose: identification in layout, PHP class binding, and template-level referencing.",
    topic: "Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 13 — Practice Test Review & Weak Area Deep Dive"
  },
  {
    question: "What xsi:type value is used for numeric arguments in Magento 2 layout XML?",
    answer: "The correct xsi:type for numeric values is \"number\" — NOT \"integer\" or \"int\". This is a frequently tested exam trap. Other important types include: string, boolean (lowercase true/false values), object (lazily instantiated class), array (containing <item> elements), null, and const (PHP constant reference). Every <argument> element requires an xsi:type attribute.",
    hint: "The type name is a generic term for numeric values, not the programming-specific term you might expect.",
    topic: "Layout XML Arguments",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 13 — Practice Test Review & Weak Area Deep Dive"
  },
  {
    question: "What is the difference between styles-m.less and styles-l.less in Magento 2?",
    answer: "styles-m.less is the mobile-first stylesheet included on ALL viewports and devices. styles-l.less is the large-screen (desktop) stylesheet included only for viewports 768px and wider via a media query: <link media=\"screen and (min-width: 768px)\">. Both are compiled entry points (no underscore prefix) that produce styles-m.css and styles-l.css respectively. They share similar import structures but target different screen sizes.",
    hint: "The suffixes 'm' and 'l' stand for the viewport sizes they target, following a mobile-first approach.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 13 — Practice Test Review & Weak Area Deep Dive"
  },
  {
    question: "In Magento 2 LESS, why does the last variable declaration win rather than the first?",
    answer: "LESS uses lazy evaluation for variables — unlike CSS cascade where order matters for rules, LESS resolves variables by taking the last declaration encountered across all imported files. This is why theme overrides work: _theme.less is imported after library defaults, so variable redefinitions in _theme.less take precedence. This is fundamentally different from CSS specificity rules.",
    hint: "LESS resolves variables at compile time using a specific evaluation strategy that favors later declarations.",
    topic: "LESS Variables",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 13 — Practice Test Review & Weak Area Deep Dive"
  },
  {
    question: "What directory stores intermediate LESS compilation output in Magento 2, and when should it be cleared?",
    answer: "var/view_preprocessed/ stores intermediate compiled LESS before final output goes to pub/static/. It should be cleared when making LESS changes that don't appear to take effect, as stale compiled output can persist there. In production mode, you must also re-run setup:static-content:deploy after clearing. In developer mode, deleting pub/static/ alone is usually sufficient as files regenerate on the next request.",
    hint: "This directory acts as a cache layer between your LESS source files and the final published CSS.",
    topic: "Static Content Deployment",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 13 — Practice Test Review & Weak Area Deep Dive"
  },
  {
    question: "What naming convention does Magento use for UI Library mixin parameters versus global LESS variables?",
    answer: "Magento UI Library mixin parameters use the @_ prefix (at-sign followed by underscore), such as @_background, @_font-size, @_padding. Global LESS variables use @ directly with double-underscore separating component from property, such as @button__background, @primary__color, @font-size__base. This naming distinction helps identify whether a value is a mixin parameter or a global design token.",
    hint: "Mixin parameters have a special prefix character after the @ sign, while global variables use a double-underscore separator.",
    topic: "LESS Conventions",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 13 — Practice Test Review & Weak Area Deep Dive"
  },
  {
    question: "What are the two LESS compilation modes in Magento 2, and which is the default in developer mode?",
    answer: "The two modes are server-side compilation (using the PHP less.php library, which compiles LESS to CSS on the server) and client-side compilation (using less.js in the browser, which is slower and for debugging only). Server-side is the default in developer mode — it compiles on each request. Client-side must be explicitly enabled via bin/magento config:set. In production mode, LESS is pre-compiled by setup:static-content:deploy.",
    hint: "The default mode processes LESS on the server, not in the browser — the browser-based option requires explicit activation.",
    topic: "LESS Compilation",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 13 — Practice Test Review & Weak Area Deep Dive"
  },
  {
    question: "What is the correct theme override path for a module's template file, and how does the directory naming convention work?",
    answer: "To override a module template in a theme, place it at <theme_root>/<Vendor_Module>/templates/<same/relative/path>. For example, to override Magento_Catalog::product/view/description.phtml, create the file at app/design/frontend/Vendor/theme/Magento_Catalog/templates/product/view/description.phtml. The module identifier uses underscore format (Magento_Catalog), not slash format (Magento/Catalog). The directory structure mirrors the module's internal path.",
    hint: "The override directory uses underscore-separated module naming, and the relative path after templates/ must match exactly.",
    topic: "Theme Overrides",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 13 — Practice Test Review & Weak Area Deep Dive"
  },
  {
    question: "What is the difference between compiled (entry-point) LESS files and partial LESS files in Magento 2?",
    answer: "Compiled files have no leading underscore prefix (e.g., styles-m.less, styles-l.less) — these are the entry points that Magento resolves and compiles into CSS. They are referenced in default_head_blocks.xml. Partial files are prefixed with _ (e.g., _variables.less, _theme.less, _module.less) — they are never compiled directly but are included via @import statements from compiled files. Only non-prefixed files trigger compilation.",
    hint: "A naming convention using a specific prefix character determines whether a file is an entry point or an included fragment.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 14 — Week 2 Review + Second Practice Test"
  },
  {
    question: "What are the key differences between the RequireJS config keys 'paths', 'map', and 'shim'?",
    answer: "'paths' maps a module ID alias to a physical file path (global scope). 'map' redirects one module ID to another — with '*' it applies globally, with a specific module ID it applies only when that module makes the require call. 'shim' wraps non-AMD scripts to work with RequireJS by declaring their dependencies and exports. Multiple requirejs-config.js files from different modules are merged, not overridden.",
    hint: "Each key serves a different purpose: aliasing, redirection (with scoping), and legacy script wrapping.",
    topic: "RequireJS Configuration",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 14 — Week 2 Review + Second Practice Test"
  },
  {
    question: "What is the difference between define() and require() in RequireJS, and when should each be used?",
    answer: "define() creates a reusable module that can be consumed by other modules — it MUST have a return value for other modules to use. require() executes code immediately without creating a reusable module — no return value is needed. Use define() when building components, widgets, or any module other code will depend on. Use require() for one-off execution like page initialization. The domReady! plugin (with !) is a RequireJS loader plugin used with require() to wait for DOM ready.",
    hint: "One creates something others can import, the other runs code immediately for its side effects.",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 14 — Week 2 Review + Second Practice Test"
  },
  {
    question: "What does the 'map' config key with '*' versus a specific module ID do in requirejs-config.js?",
    answer: "map with '*' applies the module ID redirect globally — whenever ANY module requires the specified ID, the redirect applies. map with a specific module ID applies ONLY when that specific module is the one making the require call, leaving all other modules unaffected. This scoping mechanism is commonly tested. For example, you could remap 'underscore' to lodash only for one specific component without affecting the rest of the system.",
    hint: "The asterisk acts as a wildcard for all consumers, while a specific name limits the redirect to one consumer.",
    topic: "RequireJS Configuration",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 14 — Week 2 Review + Second Practice Test"
  },
  {
    question: "In a Magento 2 uiComponent, what are the 'defaults' object properties and how are they handled during initialization?",
    answer: "The 'defaults' object provides declarative property initialization for the component. Its properties are deep-merged (not replaced) with configuration passed from layout XML — a child component only needs to declare properties it changes. Properties declared in defaults are automatically tracked as observables by the uiRegistry system. The template property in defaults points to the .html KO template file (without .html extension).",
    hint: "This object combines initial values with XML configuration through a specific merge strategy, and its properties gain reactive behavior automatically.",
    topic: "UI Components",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 14 — Week 2 Review + Second Practice Test"
  },
  {
    question: "What is the difference between the KO 'value' binding and 'textInput' binding for form inputs?",
    answer: "The 'value' binding updates the observable on blur — when the input loses focus. The 'textInput' binding updates on every keystroke, providing real-time two-way binding. This distinction is frequently tested on the exam. Use 'value' when you only need the final value (like form submission), and 'textInput' when you need to react to each character typed (like live search or validation).",
    hint: "One waits for the user to finish and leave the field, the other reacts immediately as they type.",
    topic: "Knockout JS Bindings",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 14 — Week 2 Review + Second Practice Test"
  },
  {
    question: "What are the KO context variables $parent, $root, and $parents[n], and how do they differ in nested foreach bindings?",
    answer: "$parent goes exactly one level up in the binding context tree. $root always refers to the top-level view model regardless of nesting depth. $parents[n] accesses the nth ancestor in the binding tree (0-indexed, where $parents[0] equals $parent). In nested foreach bindings, $parent from the inner loop gives you the outer loop's current item, while $root gives you the original ViewModel. This is critical for calling ViewModel methods from deeply nested loops.",
    hint: "Think of these as relative and absolute references in a nested context hierarchy.",
    topic: "Knockout JS Context",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 14 — Week 2 Review + Second Practice Test"
  },
  {
    question: "What is the difference between LESS extend (&:extend()) and LESS mixins in terms of CSS output, and which produces smaller output?",
    answer: "&:extend() produces smaller CSS output by grouping selectors that share the same rules into a single declaration block (e.g., .base:after, .header:after, .footer:after {...}). Mixins duplicate the rules into each selector that uses them, resulting in larger output (e.g., .header:after {...} .footer:after {...} with identical content). Use extend for shared rules and mixins for parameterized rules.",
    hint: "One approach shares rules across selectors in the output, the other copies rules into each selector.",
    topic: "LESS Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 14 — Week 2 Review + Second Practice Test"
  },
  {
    question: "How does the LESS variable override chain work in Magento 2, from lowest to highest priority?",
    answer: "Priority from lowest to highest: (1) lib/web/css/source/lib/_variables.less (Magento core defaults), (2) Parent theme's _theme.less (e.g., Luma overrides), (3) Your theme's web/css/source/lib/_variables.less (override of lib variables file), (4) Your theme's web/css/source/_theme.less (your theme-level overrides). The priority works because of LESS lazy variable evaluation — the last declaration wins, and theme files are imported after library files.",
    hint: "The chain goes from core library defaults up through parent theme to your theme, with import order determining the winner.",
    topic: "LESS Variables",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 14 — Week 2 Review + Second Practice Test"
  },
  {
    question: "What is the purpose of the 'deps' key in requirejs-config.js?",
    answer: "The 'deps' key specifies an array of module IDs that should be automatically pre-loaded on every page before any other code executes, without needing an explicit require() call. For example, deps: ['Magento_Theme/js/theme'] ensures the theme JavaScript loads on every page. This is useful for modules that set up global behavior, polyfills, or page-wide initialization that other modules depend on.",
    hint: "This config key ensures certain modules are loaded as prerequisites without any code explicitly requesting them.",
    topic: "RequireJS Configuration",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 14 — Week 2 Review + Second Practice Test"
  },
  {
    question: "Why must you always call this._super() first in a uiComponent's initialize() method, and what happens if you omit it?",
    answer: "Calling this._super() in initialize() runs the parent class's initialization chain, which sets up the component's observable tracking, defaults merging, uiRegistry registration, and child component initialization. Omitting it breaks the entire initialization chain — observables won't be set up, defaults won't be merged with XML config, and the component won't be registered in uiRegistry. You should also return this from initialize().",
    hint: "The parent's initialization performs critical setup steps that your component depends on for reactive behavior and registry integration.",
    topic: "UI Components",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 14 — Week 2 Review + Second Practice Test"
  },
  {
    question: "Where do multiple requirejs-config.js files come from in Magento 2, and how are they combined?",
    answer: "requirejs-config.js files can exist at three levels: theme scope (app/design/frontend/Vendor/theme/requirejs-config.js), module frontend scope (app/code/Vendor/Module/view/frontend/requirejs-config.js), and module base scope (app/code/Vendor/Module/view/base/requirejs-config.js). All files are merged at build time — they do not override each other. The combined result is output as a single requirejs-config.js in pub/static/.",
    hint: "Multiple files at different scope levels are combined rather than one replacing another.",
    topic: "RequireJS Configuration",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 14 — Week 2 Review + Second Practice Test"
  },
  {
    question: "What is the 'shim' configuration in requirejs-config.js used for?",
    answer: "The 'shim' configuration wraps non-AMD (non-RequireJS-compatible) scripts to make them work within RequireJS's module system. It declares dependencies (what must load before the script) and exports (what global variable the script creates). For example: shim: { 'legacy-plugin': { deps: ['jquery'], exports: 'LegacyPlugin' } }. This is needed for older third-party JavaScript libraries that don't use define().",
    hint: "This config key bridges the gap between legacy scripts and the AMD module system.",
    topic: "RequireJS Configuration",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 14 — Week 2 Review + Second Practice Test"
  },
  {
    question: "What is the real exam passing score for the AD0-E727, and what practice test score should you target before booking?",
    answer: "The real AD0-E727 exam passing score is approximately 64% (around 53 out of 83 questions). Before booking the exam, you should target 80%+ on practice tests to have a comfortable buffer. The exam has 60 questions in 90 minutes (for the standard format), covering theme architecture (~18%), layout XML (~25%), templates (~22%), styles/JS (~18%), checkout/UI components (~10%), and performance/caching (~7%).",
    hint: "The passing threshold is below 70%, but you need a comfortable margin above it in practice to account for exam-day pressure.",
    topic: "Exam Strategy",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 14 — Week 2 Review + Second Practice Test"
  },
  {
    question: "What is the jQuery Widget Factory pattern in Magento 2, and what are the key lifecycle methods?",
    answer: "jQuery widgets are defined with $.widget('mage.widgetName', { options, methods }). The key lifecycle methods are: _create() (called once when the widget is first instantiated — equivalent to a constructor), _init() (called each time the widget is re-initialized), and _destroy() (cleanup when widget is removed). Methods prefixed with _ are private by convention. Public methods are callable externally via $(element).widgetName('methodName'). Widgets are initialized via data-mage-init attribute.",
    hint: "The factory uses a namespace.name format, and lifecycle methods follow an underscore-prefix convention for visibility.",
    topic: "jQuery Widgets",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 14 — Week 2 Review + Second Practice Test"
  },
  {
    question: "What are the five sections of the AD0-E727 exam and their respective weights?",
    answer: "The five sections are: Section 1 - Theme Structure & Customization (10%, ~5 questions), Section 2 - Layout XML & Templates (22%, ~11 questions), Section 3 - LESS/CSS & Responsive Design (12%, ~6 questions), Section 4 - JavaScript including RequireJS, KO, jQuery (36%, ~18 questions), and Section 5 - Admin, Optimization & Page Builder (20%, ~10 questions). The exam has 50 questions total in approximately 68 minutes.",
    hint: "JavaScript is by far the largest section, accounting for over a third of the exam.",
    topic: "Exam Overview",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 19 — Full Exam Section Review & Cheat Sheet Finalization"
  },
  {
    question: "What is the theme file fallback chain in Magento, and how does it differ for layout XML vs templates?",
    answer: "The fallback chain is: Vendor/theme -> parent theme (e.g., Magento/luma) -> Magento/blank -> module view/ directory -> lib/web/. The key difference is that layout XML files are MERGED through the fallback chain (multiple files contribute instructions), while templates and static files are REPLACED (the first match found is used, and the original is ignored).",
    hint: "One type of file accumulates instructions across the chain, while the other uses a first-found-wins approach.",
    topic: "Themes",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 19 — Full Exam Section Review & Cheat Sheet Finalization"
  },
  {
    question: "What are the six email template directives you need to know for the exam?",
    answer: "The six directives are: {{var customer.name}} for variable output, {{trans 'text' name=$var}} for translation, {{depend store.is_active}}...{{/depend}} for conditional blocks, {{config path='general/store_information/name'}} for store config values, {{inlinecss file='css/email.css'}} for converting stylesheets to inline styles, and {{include template='Magento_Email::header.html'}} for including other templates. These are NOT PHP — they use Magento's custom directive syntax.",
    hint: "Email templates have their own directive language separate from PHP, with six key directives covering output, conditions, config, and styling.",
    topic: "Email Templates",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 19 — Full Exam Section Review & Cheat Sheet Finalization"
  },
  {
    question: "What is the translation priority chain in Magento, from highest to lowest?",
    answer: "The translation priority from highest to lowest is: (1) Database translations (set via Admin > Stores > Configuration), (2) Theme i18n/ directory (app/design/frontend/<Vendor>/<theme>/i18n/en_US.csv), (3) Module i18n/ directory (app/code/<Vendor>/<Module>/i18n/en_US.csv), (4) Language package (app/i18n/<Vendor>/<language>/). Database translations always override file-based translations.",
    hint: "The most specific source wins, with admin-configured translations taking top priority over all file-based sources.",
    topic: "Translations",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 19 — Full Exam Section Review & Cheat Sheet Finalization"
  },
  {
    question: "What is the difference between remove='true' and display='false' on a <referenceBlock>?",
    answer: "remove='true' on <referenceBlock> completely removes the block from the layout tree — it no longer exists and cannot be referenced by child blocks. display='false' hides the block from rendering (it produces no HTML output) but keeps it in the layout tree, so other blocks can still reference it as a parent or call getChildHtml() on it. The preferred modern way to remove blocks is remove='true' on <referenceBlock>.",
    hint: "One eliminates the block entirely; the other merely makes it invisible while keeping it available as a parent.",
    topic: "Layout XML",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 19 — Full Exam Section Review & Cheat Sheet Finalization"
  },
  {
    question: "What is _theme.less, and why is it the most important LESS file for theme customization?",
    answer: "_theme.less (located at web/css/source/) is the primary file for overriding UI Library variables such as colors, fonts, spacing, and breakpoints. Variables declared here override the defaults in lib/web/css/source/lib/_variables.less. LESS uses lazy variable evaluation, meaning the last declaration of a variable wins at compile time regardless of import order. This is the first file you should edit when customizing a theme's visual appearance.",
    hint: "This file leverages LESS's lazy evaluation to override default variable values without modifying the library source.",
    topic: "LESS/CSS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 19 — Full Exam Section Review & Cheat Sheet Finalization"
  },
  {
    question: "What are the five requirejs-config.js top-level keys, and what does each do?",
    answer: "The five keys are: (1) map — redirects/aliases module requests ('*' key means universal), (2) paths — defines base path locations for modules, (3) shim — configures non-AMD legacy scripts with deps and exports, (4) deps — auto-loads listed modules on every page (use sparingly), and (5) config — module-specific configuration including the mixins sub-key for declaring JS mixins. Multiple requirejs-config.js files are MERGED by Magento, not replaced.",
    hint: "Each key serves a distinct purpose: aliasing, locating, adapting legacy code, auto-loading, and configuring modules.",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 19 — Full Exam Section Review & Cheat Sheet Finalization"
  },
  {
    question: "How do JS mixins work in Magento, and where are they registered?",
    answer: "Mixins extend existing JavaScript modules non-destructively. A mixin is a module that receives the original component/module as its argument and returns an extended version. For UI components, use this._super() to call the original method. Mixins are registered in requirejs-config.js under config.mixins (NOT under map): config: { mixins: { 'Target/js/module': { 'Vendor/js/mixin': true } } }. Setting a mixin to false disables it. Multiple mixins can chain on the same target.",
    hint: "Mixins wrap existing modules without destroying them, and their registration lives under a specific config sub-key.",
    topic: "RequireJS",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 19 — Full Exam Section Review & Cheat Sheet Finalization"
  },
  {
    question: "What are the key Knockout.js context variables available inside a foreach binding?",
    answer: "Inside a foreach binding, you have access to: $parent (the parent binding context), $root (the top-level binding context), $index() (the current zero-based index as a function call), and $data (the current item in the array). These allow you to access data outside the current iteration scope. For example, $parent.storeName accesses a property from the parent context, and $root.globalConfig accesses the root view model.",
    hint: "These special variables let you navigate up the binding context tree when you need data from outside the current loop item.",
    topic: "Knockout.js",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 19 — Full Exam Section Review & Cheat Sheet Finalization"
  },
  {
    question: "What is the difference between the KO 'visible' and 'if' bindings?",
    answer: "The 'visible' binding toggles the CSS display property — the DOM element always exists but is shown/hidden. The 'if' binding physically adds or removes the DOM element entirely based on the condition. Using 'if' is more expensive for frequent toggling since it recreates DOM nodes, but it saves memory when elements are rarely shown. 'visible' is better for frequently toggled elements since the DOM stays intact.",
    hint: "One manipulates CSS visibility; the other manipulates the DOM structure itself.",
    topic: "Knockout.js",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 19 — Full Exam Section Review & Cheat Sheet Finalization"
  },
  {
    question: "What escaping methods must you know for the exam, and when is each used?",
    answer: "The key methods are: escapeHtml() for HTML content between tags (e.g., <p><?= $block->escapeHtml($title) ?></p>), escapeHtmlAttr() for HTML attribute values (escapes quotes), escapeUrl() for href/src attribute values (blocks javascript: scheme), escapeJs() for JavaScript string values, and escapeCss() for inline CSS property values. Use /* @noEscape */ only for pre-escaped content like getJsonConfig(). getChildHtml() output does NOT need escaping.",
    hint: "Each method is designed for a specific output context — using the wrong one can leave XSS vulnerabilities.",
    topic: "Template Escaping",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 19 — Full Exam Section Review & Cheat Sheet Finalization"
  },
  {
    question: "What are the three static content deployment strategies, and which is best for each scenario?",
    answer: "The three strategies are: 'standard' — full deploy for all packages (best for reliability), 'compact' — only files needed for current locale/theme (best for disk space), and 'quick' — fastest, skips per-theme processing (best for CI/CD speed). The deploy command also supports flags like --theme (specific theme), --area (specific area), -j (parallel jobs), and -f (force). Deployed files go to pub/static/frontend/<Vendor>/<theme>/<locale>/.",
    hint: "Each strategy trades off between completeness, disk usage, and deployment speed.",
    topic: "Deployment",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 19 — Full Exam Section Review & Cheat Sheet Finalization"
  },
  {
    question: "What is the difference between cache:clean and cache:flush in Magento?",
    answer: "cache:clean removes cached data from the Magento cache but leaves the cache storage intact — it only removes Magento's own cache entries. cache:flush destroys the entire underlying cache storage (Redis, Memcached, filesystem), which can affect other applications sharing the same storage. For frontend development, clear 'layout' cache after layout XML changes, 'block_html' after template changes, and 'full_page' after any production frontend change.",
    hint: "One is surgical and only removes Magento's entries; the other is a scorched-earth approach that clears everything in the storage.",
    topic: "Cache Management",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 19 — Full Exam Section Review & Cheat Sheet Finalization"
  },
  {
    question: "What are the Grunt workflow commands for theme development, and in what order should they run?",
    answer: "The Grunt workflow is: (1) npm install (initial setup), (2) Register theme in dev/tools/grunt/configs/themes.js with area, name, locale, files, and dsl properties, (3) grunt clean:ThemeName (clean generated files), (4) grunt exec:ThemeName (collect and symlink static files), (5) grunt less:ThemeName (compile LESS to CSS), (6) grunt watch:ThemeName (monitor for changes and auto-recompile). Grunt is for development only — production uses setup:static-content:deploy.",
    hint: "Registration comes first, then a clean-exec-less sequence, with watch for ongoing development.",
    topic: "Grunt/Development",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 19 — Full Exam Section Review & Cheat Sheet Finalization"
  },
  {
    question: "What is Edge Delivery Services (EDS), and how does it relate to the Magento frontend theme system?",
    answer: "Edge Delivery Services is Adobe Commerce's CDN-first storefront approach that uses document-based authoring (Google Docs or SharePoint) instead of CMS blocks. It targets a 100 Lighthouse score through its architecture. EDS blocks are directories containing block-name.js and block-name.css files — they are NOT Magento blocks. EDS is a completely separate storefront from the Magento frontend theme system — Magento themes do NOT apply to EDS.",
    hint: "This is an entirely separate content and delivery system that coexists with, but does not integrate into, the traditional Magento theme layer.",
    topic: "Edge Delivery Services",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 19 — Full Exam Section Review & Cheat Sheet Finalization"
  },
  {
    question: "What are the three plugin types in Magento, and what can each modify?",
    answer: "The three plugin types are: Before (prefix 'before') — modifies method arguments but not return values, must return an array of modified arguments or null; After (prefix 'after') — receives and can modify the return value ($result parameter); Around (prefix 'around') — has full control via $proceed() callable, can modify arguments, prevent execution, or change the return value. Plugins cannot be applied to final classes, final methods, __construct, static methods, or non-public methods.",
    hint: "Each type intercepts at a different point in the method execution lifecycle: before arguments are processed, after the result is produced, or wrapping the entire call.",
    topic: "Plugins",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 20 — Final Practice Test + Light Exam Eve Prep"
  },
  {
    question: "What is the plugin execution order when multiple plugins target the same method?",
    answer: "For before plugins, the lowest sortOrder fires first. For after plugins, the lowest sortOrder fires LAST (innermost). For around plugins, the lowest sortOrder is the outermost wrapper. The execution flow is: sortOrder 10 before -> sortOrder 20 before -> Original Method -> sortOrder 20 after -> sortOrder 10 after. This creates a layered wrapping pattern where lower-sorted plugins are closer to the outside of the call stack.",
    hint: "Think of plugins as concentric layers around the original method, with sort order determining which layer is outermost.",
    topic: "Plugins",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 20 — Final Practice Test + Light Exam Eve Prep"
  },
  {
    question: "What is the correct production deployment sequence for Magento, and why does order matter?",
    answer: "The correct order is: (1) bin/magento setup:upgrade (runs patches, updates module versions), (2) bin/magento setup:di:compile (generates interceptors, factories, proxies in generated/), (3) bin/magento setup:static-content:deploy (compiles and deploys static assets to pub/static/), (4) bin/magento cache:flush. Order matters because compile needs updated schema, static content deploy needs compiled classes, and cache must be flushed after everything is generated.",
    hint: "Each step depends on the output of the previous one — schema first, then PHP classes, then static assets, then cache.",
    topic: "Deployment",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 20 — Final Practice Test + Light Exam Eve Prep"
  },
  {
    question: "What is the purpose of db_schema_whitelist.json, and how is it generated?",
    answer: "db_schema_whitelist.json is required for declarative schema rollback support. It tracks which tables, columns, indexes, and constraints have been created by db_schema.xml so that Magento knows which elements can safely be removed during schema downgrade. It is generated by running bin/magento setup:db-declaration:generate-whitelist. Without this file, Magento cannot perform destructive schema operations during rollback.",
    hint: "This file serves as a safety mechanism that explicitly lists what the declarative schema system is allowed to remove.",
    topic: "Database",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 20 — Final Practice Test + Light Exam Eve Prep"
  },
  {
    question: "What is the difference between a <preference> and a <virtualType> in di.xml?",
    answer: "A <preference> swaps an entire class implementation globally — every injection of the interface gets the replacement class. A <virtualType> creates a named instance of an existing class with different constructor arguments without creating a new PHP class file. virtualType is used when you need the same class but with different configuration, while preference is used when you need a completely different implementation.",
    hint: "One replaces globally; the other creates a named variant with different constructor arguments but no new PHP file.",
    topic: "Dependency Injection",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 20 — Final Practice Test + Light Exam Eve Prep"
  },
  {
    question: "What does the @api annotation mean in Magento, and why is it important for extension developers?",
    answer: "Classes and interfaces marked with @api are part of Magento's public API and are considered stable — they are safe to depend on across version upgrades. Classes without @api are internal implementation details that may change between versions without notice. Extension developers should prefer depending on @api-annotated interfaces to minimize upgrade risk and ensure compatibility.",
    hint: "This annotation is a stability contract between Magento core and third-party code.",
    topic: "Architecture",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 20 — Final Practice Test + Light Exam Eve Prep"
  },
  {
    question: "What are the key differences between Magento's developer and production deployment modes?",
    answer: "In developer mode, full errors are shown in the browser, caches are disabled by default, and static files are generated on-the-fly via server-side PHP (less.php) compilation. In production mode, errors are hidden from users, all caches are fully enabled, and static files are NOT auto-generated — you must run setup:static-content:deploy explicitly. Production mode also requires setup:di:compile for optimal performance.",
    hint: "Developer mode prioritizes debugging visibility; production mode prioritizes performance and security.",
    topic: "Deployment Modes",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 20 — Final Practice Test + Light Exam Eve Prep"
  },
  {
    question: "How do events and observers differ from plugins in Magento, and when should each be used?",
    answer: "Observers implement ObserverInterface with a single execute() method and are registered in events.xml. They are best for side effects (logging, sending notifications, updating related data) because they cannot modify the method's return value. Plugins (interceptors) can modify arguments (before), return values (after), or control execution flow (around). Use plugins when you need to modify method behavior; use observers when you need to react to an event without changing its outcome.",
    hint: "One is for modifying method inputs/outputs; the other is for reacting to things that happened.",
    topic: "Events & Observers",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 20 — Final Practice Test + Light Exam Eve Prep"
  },
  {
    question: "What is the SearchCriteriaBuilder pattern, and why is it the correct way to query repositories?",
    answer: "SearchCriteriaBuilder is used with repositories to build filtered queries through service contracts. You chain methods like addFilter('field', 'value', 'condition'), setPageSize(n), setCurrentPage(n), then call create() to produce a SearchCriteria object passed to a repository's getList() method. This pattern is preferred over direct collection queries because it works through the service contract layer, maintaining the decoupled architecture.",
    hint: "This builder creates query criteria objects that repositories understand, keeping the data access abstracted behind interfaces.",
    topic: "Service Contracts",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 20 — Final Practice Test + Light Exam Eve Prep"
  },
  {
    question: "What are the key cache types relevant to frontend development, and when should each be cleared?",
    answer: "The key frontend cache types are: 'layout' (parsed layout XML — clear after layout XML changes), 'block_html' (rendered block HTML output — clear after template or block PHP changes), 'full_page' (entire page HTML via Varnish or built-in FPC — clear after any frontend change in production), 'config' (system configuration — clear after config changes), and 'translate' (translation strings — clear after i18n changes).",
    hint: "Each cache type corresponds to a specific layer of the rendering pipeline — clear the one that matches what you changed.",
    topic: "Cache Management",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 20 — Final Practice Test + Light Exam Eve Prep"
  },
  {
    question: "What is declarative schema (db_schema.xml) and how does it differ from legacy setup scripts?",
    answer: "Declarative schema uses db_schema.xml where you declare the desired database state — Magento computes the diff between current and desired schema automatically. You do NOT write ALTER TABLE statements. Legacy InstallSchema/UpgradeSchema scripts used setup_version in module.xml and required explicit SQL operations. In Magento 2.4.x, setup_version is removed from module.xml entirely. Data patches (DataPatchInterface) and schema patches (SchemaPatchInterface) replace the legacy approach, running once and tracked in the patch_list table.",
    hint: "The modern approach is declarative (what you want) versus imperative (how to get there) — Magento handles the migration logic.",
    topic: "Database",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 20 — Final Practice Test + Light Exam Eve Prep"
  },
  {
    question: "What are the correct paths for overriding templates versus layout files in a Magento theme?",
    answer: "Template override: app/design/frontend/<Vendor>/<theme>/<Vendor_Module>/templates/path/to/file.phtml — this completely replaces the module's original template. Layout extension (default): app/design/frontend/<Vendor>/<theme>/<Vendor_Module>/layout/handle.xml — this is MERGED with the module's layout. Layout override (complete replacement): app/design/frontend/<Vendor>/<theme>/<Vendor_Module>/layout/override/base/handle.xml — this entirely replaces the module's layout file.",
    hint: "Templates always replace; layouts merge by default but can be fully replaced using a specific override subdirectory path.",
    topic: "Theme Customization",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 20 — Final Practice Test + Light Exam Eve Prep"
  },
  {
    question: "How do admin controllers differ from frontend controllers in Magento 2.4+?",
    answer: "Admin controllers extend Magento\\Backend\\App\\Action and define const ADMIN_RESOURCE for automatic ACL checking. Frontend controllers in Magento 2.4+ should implement specific HTTP method interfaces like HttpGetActionInterface or HttpPostActionInterface (replacing the older pattern of extending Magento\\Framework\\App\\Action\\Action). Both types have an execute() method that returns a result object. Admin routes use router id='admin' in routes.xml.",
    hint: "Admin controllers have built-in ACL checking via a constant, while modern frontend controllers declare their HTTP method via interfaces.",
    topic: "Controllers",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 20 — Final Practice Test + Light Exam Eve Prep"
  },
  {
    question: "What is the approximate passing score for the AD0-E727 exam, and what is the exam format?",
    answer: "The AD0-E727 exam has 50 questions (not 60) with approximately 68 minutes of testing time. Adobe does not publish the exact passing score, but community consensus places it around 68-70%. This means you need to answer approximately 7 out of 10 questions correctly. Section 4 (JavaScript) is worth 36% — roughly 18 questions — making it the most critical section to master.",
    hint: "The passing threshold is approximately two-thirds correct, with JavaScript being the single largest section by far.",
    topic: "Exam Strategy",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 20 — Final Practice Test + Light Exam Eve Prep"
  },
  {
    question: "What is the config scope hierarchy in Magento, and how does the showInDefault/Website/Store attribute work?",
    answer: "The config scope hierarchy is Default -> Website -> Store View, where more specific scope overrides less specific scope. A store view setting overrides a website setting, which overrides the default. The showInDefault='1' showInWebsite='1' showInStore='1' attributes in system.xml control only where the config field is DISPLAYED in the admin — they do NOT restrict which scopes can override values.",
    hint: "Scope flows from general to specific, and the display attributes are about visibility in the admin UI, not about override permissions.",
    topic: "Configuration",
    examCode: "AD0-E727",
    studyNoteTitle: "Day 20 — Final Practice Test + Light Exam Eve Prep"
  }
];

async function main() {
  console.log("Seeding AD0-E727 flashcards...");
  let created = 0;
  let skipped = 0;

  for (const fc of flashcards) {
    const studyNote = await prisma.studyNote.findFirst({
      where: { title: fc.studyNoteTitle, certCode: "AD0-E727" }
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
