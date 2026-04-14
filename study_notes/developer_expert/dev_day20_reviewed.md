# Day 20 — Full Practice Exam Day
## Adobe Commerce Developer Professional (AD0-E725) — Comprehensive Review & Study Notes

---

## Table of Contents

1. [How to Use These Notes](#1-how-to-use-these-notes)
2. [Exam Blueprint Recap](#2-exam-blueprint-recap)
3. [Full Practice Exam — 45 Questions](#3-full-practice-exam--45-questions)
4. [Answer Key with Detailed Explanations](#4-answer-key-with-detailed-explanations)
5. [Adobe Commerce Technical Guidelines — Deep Dive](#5-adobe-commerce-technical-guidelines--deep-dive)
6. [Post-Exam Analysis Framework](#6-post-exam-analysis-framework)
7. [Weakness Mapping by Domain](#7-weakness-mapping-by-domain)
8. [Tonight's Re-Read Bullet Points](#8-tonights-re-read-bullet-points)
9. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. How to Use These Notes

```
STUDY SESSION PROTOCOL (90 min exam + 60 min review)
-----------------------------------------------------
Phase 1 (90 min): Take the practice exam TIMED
  - No notes, no browser
  - Flag questions you're unsure about
  - Submit at 90 minutes regardless

Phase 2 (30 min): Score and mark wrong answers
  - Circle every wrong answer
  - Note which exam domain it belongs to

Phase 3 (60 min): Deep-dive each wrong answer
  - Read THIS document's explanations
  - Write your own 1-sentence "why I was wrong"

Phase 4 (30 min): Re-read Technical Guidelines doc
  - Focus on sections you got wrong
```

> **Mindset:** The goal is NOT a score. The goal is to find gaps before the real exam finds them for you.

---

## 2. Exam Blueprint Recap

### AD0-E725 Domain Weights

| Domain | Topic | Weight |
|--------|-------|--------|
| 1 | Working with Admin & Storefront | ~17% |
| 2 | Adobe Commerce Architecture | ~15% |
| 3 | EAV / Database | ~13% |
| 4 | Layout / UI Components / Frontend | ~15% |
| 5 | Checkout / Cart / Payment | ~13% |
| 6 | Catalog / Products | ~10% |
| 7 | Adobe Commerce Cloud | ~10% |
| 8 | External Integrations / APIs | ~7% |

**Exam focus:** Know the domain weights — if you have limited time to review, prioritize Domains 1–5 which together account for ~73% of the exam.

---

## 3. Full Practice Exam — 45 Questions

> **Instructions:** Set a 90-minute timer. Answer all questions before checking answers. Mark uncertain questions with `(?)`.

---

### Domain 1 — Working with Admin & Storefront

**Q1.** A merchant wants to add a new menu item to the Admin panel that links to a custom grid. Which file is primarily responsible for registering this menu item?

- A) `routes.xml`
- B) `menu.xml`
- C) `acl.xml`
- D) `layout/adminhtml_index_index.xml`

---

**Q2.** You need to restrict access to a custom Admin controller so only users with a specific ACL role can access it. Which method must be overridden in your controller class?

- A) `execute()`
- B) `_isAllowed()`
- C) `dispatch()`
- D) `authenticate()`

---

**Q3.** A custom Admin grid needs a `massDelete` action. Which interface should the MassAction class implement?

- A) `Magento\Framework\App\Action\HttpPostActionInterface`
- B) `Magento\Backend\App\Action`
- C) `Magento\Ui\Component\MassAction\Filter`
- D) `Magento\Framework\Controller\ResultInterface`

---

**Q4.** Which of the following correctly describes the relationship between `stores`, `websites`, and `store views` in Adobe Commerce?

- A) A store belongs to a store view, a store view belongs to a website
- B) A website contains stores, a store contains store views
- C) A store view contains stores, a store contains websites
- D) Websites and stores are the same concept

---

**Q5.** You want to add a custom column to the `sales_order_grid`. Which approach is recommended in Adobe Commerce 2.x?

- A) Modify `core_sales_order_grid` directly in the database
- B) Create a plugin on `Magento\Sales\Model\ResourceModel\Order\Grid\Collection`
- C) Add a `db_schema.xml` entry and declare a `listing` UI component column
- D) Rewrite the `OrderGridCollection` class

---

**Q6.** Which layout handle is used to customize the Admin dashboard page?

- A) `adminhtml_dashboard_index`
- B) `adminhtml_index_dashboard`
- C) `default_admin`
- D) `admin_dashboard`

---

**Q7.** A store owner wants different prices for different customer groups. Which Commerce feature handles this natively?

- A) Tier pricing only
- B) Customer group pricing via Catalog Price Rules
- C) Catalog Price Rules and Customer Group Prices (special prices per group)
- D) Shared catalogs (B2B only) and Tier prices are the only options

---

### Domain 2 — Architecture

**Q8.** In the Adobe Commerce dependency injection framework, what is the purpose of `di.xml`?

- A) To declare database schema
- B) To configure object instantiation, preferences, plugins, and virtual types
- C) To define routes and URL rewrites
- D) To register module dependencies in `composer.json`

---

**Q9.** What is a "virtual type" in Adobe Commerce DI?

- A) A PHP interface with no implementation
- B) A way to create a new class instance with different constructor arguments without writing PHP code
- C) An abstract class that must be extended
- D) A type hint used in factory classes

---

**Q10.** Which command regenerates the DI configuration and factory classes after code changes?

- A) `bin/magento cache:flush`
- B) `bin/magento setup:upgrade`
- C) `bin/magento setup:di:compile`
- D) `bin/magento module:enable`

---

**Q11.** You have a plugin declared with `sortOrder="10"` and another with `sortOrder="20"` on the same method. In what order do `before` plugins execute?

- A) `sortOrder 20` first, then `sortOrder 10`
- B) `sortOrder 10` first, then `sortOrder 20`
- C) Random order determined at runtime
- D) Alphabetically by plugin class name

---

**Q12.** Which plugin type receives the original method's return value as a parameter?

- A) `before` plugin
- B) `around` plugin
- C) `after` plugin
- D) All plugin types receive the return value

---

**Q13.** What is the correct way to declare a preference (class rewrite) in `di.xml`?

```xml
<!-- Which option is correct? -->
```

- A) `<rewrite for="OriginalClass" to="CustomClass"/>`
- B) `<preference for="OriginalInterface" type="CustomClass"/>`
- C) `<plugin for="OriginalClass" type="CustomClass"/>`
- D) `<type name="OriginalClass"><argument type="CustomClass"/></type>`

---

**Q14.** An event observer is declared in `events.xml`. Which XML node is used to specify which event triggers the observer?

- A) `<observer name="..." instance="..."/>`
- B) `<event name="event_name"><observer name="..." instance="..."/></event>`
- C) `<trigger event="event_name" class="..."/>`
- D) `<listen to="event_name" class="..."/>`

---

**Q15.** Which of the following is TRUE about Magento service contracts?

- A) They are optional performance optimizations
- B) They define stable PHP interfaces for modules to expose business logic, decoupled from implementation
- C) They replace `di.xml` preferences entirely
- D) Service contracts only apply to payment integrations

---

### Domain 3 — EAV & Database

**Q16.** In EAV architecture, where is a product attribute's value for `varchar` type stored?

- A) `catalog_product_entity`
- B) `catalog_product_entity_varchar`
- C) `eav_attribute_value`
- D) `catalog_product_flat`

---

**Q17.** Which command creates a new database table using `db_schema.xml`?

- A) `bin/magento db:create`
- B) `bin/magento setup:db-schema:upgrade`
- C) `bin/magento setup:upgrade`
- D) `bin/magento schema:compile`

---

**Q18.** You need to add a new attribute to the `customer` entity programmatically. Which class should you use?

- A) `Magento\Catalog\Setup\CategorySetup`
- B) `Magento\Customer\Setup\CustomerSetup`
- C) `Magento\Eav\Model\Entity\Attribute`
- D) `Magento\Framework\Setup\SchemaSetupInterface`

---

**Q19.** What does the `db_schema_whitelist.json` file contain?

- A) A list of tables that can be dropped during `setup:upgrade`
- B) A record of all schema declarations owned by the module for safe rollback
- C) ACL permissions for database-level access
- D) A list of allowed data patch classes

---

**Q20.** Which `InstallData` replacement mechanism is used in Adobe Commerce 2.3+?

- A) `UpgradeData.php` scripts
- B) Data Patches implementing `Magento\Framework\Setup\Patch\DataPatchInterface`
- C) `setup:db:seed` commands
- D) `ResourceModel\AbstractResource` save methods

---

**Q21.** What is the primary performance benefit of the `catalog_product_flat` table?

- A) It stores product images in a compressed format
- B) It denormalizes EAV product data into a single flat table for faster reads
- C) It replaces the `catalog_product_entity` table entirely
- D) It caches product data in Redis automatically

---

**Q22.** A `declarative schema` foreign key is defined in `db_schema.xml`. What happens to that foreign key if the module is uninstalled?

- A) Nothing — foreign keys must be removed manually
- B) The foreign key is automatically dropped as part of declarative schema rollback
- C) The entire database is dropped
- D) Only the column is removed, not the constraint

---

### Domain 4 — Layout / UI Components / Frontend

**Q23.** In which directory should a theme's custom `layout.xml` overrides be placed for the `Magento_Catalog` module?

- A) `app/design/frontend/<Vendor>/<theme>/Magento_Catalog/layout/`
- B) `app/design/frontend/<Vendor>/<theme>/layout/Magento_Catalog/`
- C) `app/code/Vendor/Theme/view/frontend/layout/`
- D) `pub/static/frontend/<Vendor>/<theme>/Magento_Catalog/`

---

**Q24.** Which layout XML instruction removes a block that was declared in a parent layout?

- A) `<block remove="true" name="block.name"/>`
- B) `<remove name="block.name"/>`
- C) `<referenceBlock name="block.name" remove="true"/>`
- D) `<delete block="block.name"/>`

---

**Q25.** What is the purpose of `_toHtml()` vs `toHtml()` in a Block class?

- A) They are identical methods
- B) `toHtml()` applies caching logic and calls `_toHtml()`; `_toHtml()` renders the actual template
- C) `_toHtml()` applies caching; `toHtml()` is the raw render
- D) `toHtml()` is deprecated in favor of `_toHtml()`

---

**Q26.** A UI component grid listing is defined in `<module>_listing.xml`. Which node specifies the data source?

- A) `<argument name="data">`
- B) `<dataSource name="...">`
- C) `<collection class="...">`
- D) `<provider type="...">`

---

**Q27.** In a `.phtml` template, which method is the correct way to output escaped HTML?

- A) `<?= $block->getData('title') ?>`
- B) `<?= htmlspecialchars($block->getTitle()) ?>`
- C) `<?= $block->escapeHtml($block->getTitle()) ?>`
- D) `<?= strip_tags($block->getTitle()) ?>`

---

**Q28.** Which RequireJS configuration file in a module maps module aliases to file paths?

- A) `requirejs-config.js`
- B) `require-config.xml`
- C) `view/frontend/web/js/config.js`
- D) `view/base/requirejs.json`

---

**Q29.** What does the `x-magento-init` HTML attribute do?

- A) Marks a block for server-side rendering
- B) Initializes a JavaScript component on a DOM element using the mage init pattern
- C) Triggers a layout handle when the element is clicked
- D) Lazy-loads a phtml template via AJAX

---

**Q30.** Which LESS variable file should a child theme override to change the primary button color?

- A) `web/css/source/_buttons.less`
- B) `web/css/source/_variables.less` (or `_extend.less` for additions)
- C) `web/css/styles-m.less`
- D) `web/css/source/_theme.less`

---

### Domain 5 — Checkout / Cart / Payment

**Q31.** Which interface must a custom Payment Method model implement?

- A) `Magento\Payment\Model\Method\AbstractMethod`
- B) `Magento\Payment\Model\MethodInterface`
- C) `Magento\Sales\Api\PaymentMethodInterface`
- D) `Magento\Checkout\Model\Payment\PaymentInterface`

---

**Q32.** In the checkout process, which step comes BEFORE address validation?

- A) Payment method selection
- B) Order placement
- C) Cart totals calculation
- D) Shipping method selection

---

**Q33.** Which event fires when a product is added to the cart?

- A) `catalog_product_add_to_cart`
- B) `checkout_cart_product_add_after`
- C) `cart_product_add_before`
- D) `sales_quote_item_add`

---

**Q34.** A custom shipping carrier must extend which class?

- A) `Magento\Shipping\Model\Carrier\AbstractCarrier`
- B) `Magento\Shipping\Model\Rate\AbstractRate`
- C) `Magento\Quote\Model\Shipping\CarrierInterface`
- D) `Magento\Sales\Model\Order\Shipment`

---

**Q35.** Which `quote` model method converts a quote into an order?

- A) `Magento\Sales\Model\Order::create()`
- B) `Magento\Quote\Model\QuoteManagement::placeOrder()`
- C) `Magento\Checkout\Model\Session::submitQuote()`
- D) `Magento\Sales\Api\OrderManagementInterface::place()`

---

**Q36.** In the UI component–based checkout (Magento 2 default), where do you add a new checkout step?

- A) Edit `checkout_index_index.xml` and add a new `step` component
- B) Add a JS component to `checkout_index_index.xml` as a child of `steps` in the checkout layout
- C) Modify `Magento/Checkout/view/frontend/web/js/view/checkout.js` directly
- D) Create a new `checkout_step.phtml` and reference it in `default.xml`

---

### Domain 6 — Catalog / Products

**Q37.** Which product type allows a customer to build a product from multiple components with individual pricing?

- A) Grouped Product
- B) Bundle Product
- C) Configurable Product
- D) Virtual Product

---

**Q38.** Where does Adobe Commerce store layered navigation attribute configuration (whether to use in navigation, etc.)?

- A) `catalog_eav_attribute` table
- B) `eav_attribute` table only
- C) `catalog_product_entity_int` table
- D) `catalog_category_entity` table

---

**Q39.** Which indexer must be run after bulk product import to ensure search results are current?

- A) `catalog_product_price`
- B) `catalogsearch_fulltext`
- C) `catalog_product_flat`
- D) `catalog_category_product`

---

### Domain 7 — Adobe Commerce Cloud

**Q40.** In Adobe Commerce Cloud, which file defines environment variables, cron jobs, and worker services?

- A) `composer.json`
- B) `.magento.env.yaml`
- C) `.magento.app.yaml`
- D) `services.yaml`

---

**Q41.** What is the purpose of `services.yaml` in Adobe Commerce Cloud?

- A) Define PHP extensions
- B) Configure backend services (MySQL, Redis, Elasticsearch, RabbitMQ)
- C) Set environment-specific variables
- D) Define the build and deploy hooks

---

**Q42.** Which Cloud CLI command opens an SSH tunnel to a remote environment's database?

- A) `magento-cloud db:connect`
- B) `magento-cloud tunnel:open`
- C) `magento-cloud ssh`
- D) `magento-cloud environment:ssh --db`

---

**Q43.** In the Cloud deployment pipeline, what happens during the **build** phase?

- A) Static content is served; the database is migrated
- B) The application is compiled, `composer install` runs, and static content can be deployed; NO database access
- C) Services like Redis and MySQL are started
- D) Environment variables are injected from `.magento.env.yaml` only

---

### Domain 8 — External Integrations / APIs

**Q44.** Which REST API endpoint retrieves a single product by SKU?

- A) `GET /V1/products?sku={sku}`
- B) `GET /V1/products/{sku}`
- C) `POST /V1/products/get/{sku}`
- D) `GET /V1/catalog/product/{sku}`

---

**Q45.** When creating a custom REST API endpoint in Adobe Commerce, which file declares the route, HTTP method, and service class?

- A) `di.xml`
- B) `webapi.xml`
- C) `routes.xml`
- D) `api.xml`

---

## 4. Answer Key with Detailed Explanations

---

### Domain 1 — Admin & Storefront

**Q1. Answer: B — `menu.xml`**

```
EXPLANATION:
- menu.xml  -> Registers Admin navigation menu items
- routes.xml -> Registers URL routes for controllers
- acl.xml   -> Defines access control list resources
- layout XML -> Handles page rendering, NOT navigation registration
```

```xml
<!-- app/code/Vendor/Module/etc/adminhtml/menu.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Backend:etc/menu.xsd">
    <menu>
        <add id="Vendor_Module::custom_menu"
             title="Custom Section"
             module="Vendor_Module"
             sortOrder="100"
             resource="Vendor_Module::custom_menu"/>
        <add id="Vendor_Module::custom_grid"
             title="Custom Grid"
             module="Vendor_Module"
             sortOrder="10"
             action="vendor_module/index/index"
             resource="Vendor_Module::custom_grid"
             parent="Vendor_Module::custom_menu"/>
    </menu>
</config>
```

**Exam focus:** `menu.xml` is in `etc/adminhtml/`, NOT `etc/`. Routes use `routes.xml`. ACL uses `acl.xml`. All three files are different and tested together.

---

**Q2. Answer: B — `_isAllowed()`**

```php
<?php
// app/code/Vendor/Module/Controller/Adminhtml/Index/Index.php

namespace Vendor\Module\Controller\Adminhtml\Index;

use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\View\Result\PageFactory;

class Index extends Action
{
    const ADMIN_RESOURCE = 'Vendor_Module::custom_grid';

    protected $resultPageFactory;

    public function __construct(Context $context, PageFactory $resultPageFactory)
    {
        parent::__construct($context);
        $this->resultPageFactory = $resultPageFactory;
    }

    // This is the method that gates access
    protected function _isAllowed(): bool
    {
        return $this->_authorization->isAllowed(self::ADMIN_RESOURCE);
    }

    public function execute()
    {
        return $this->resultPageFactory->create();
    }
}
```

**Exam focus:** `_isAllowed()` — protected, returns bool. The `ADMIN_RESOURCE` constant is a shortcut that the base `Action` class also checks automatically if defined. Both patterns appear on the exam.

---

**Q3. Answer: A — `HttpPostActionInterface`**

```
EXPLANATION:
Mass actions submit via POST (they pass selected IDs). The controller must
implement HttpPostActionInterface to signal it handles POST requests.
Magento\Backend\App\Action is a base class, not the specific interface for this.
```

**Exam focus:** Mass action controllers use POST. Always implement `HttpPostActionInterface` for any controller that modifies data.

---

**Q4. Answer: B — A website contains stores; a store contains store views**

```
HIERARCHY (top to bottom):
+------------------+
|    Website       |  <- Highest level (separate domain possible)
|  +------------+  |
|  |   Store    |  |  <- Category root, different product sets
|  | +--------+ |  |
|  | |  Store |  |  |  <- Different language, currency, theme
|  | |  View  |  |  |
|  | +--------+ |  |
|  +------------+  |
+------------------+

Key scope rules:
- Prices  -> Website scope (by default)
- Content -> Store View scope
- Inventory -> Global or Website scope
```

**Exam focus:** The scope hierarchy is Website > Store > Store View. Price scope is configurable but defaults to website. Content (CMS pages, descriptions) is store view scope.

---

**Q5. Answer: C — Add `db_schema.xml` entry and declare a `listing` UI component column**

```
EXPLANATION:
The recommended modern approach:
1. Add column to sales_order_grid via db_schema.xml (or Sales Grid join)
2. Declare the column in sales_order_grid.xml UI component listing

Plugins on the collection (B) work but are less declarative.
Direct DB modification (A) is NEVER the answer.
Rewrites (D) are discouraged — always use plugins/observers.
```

**Exam focus:** Never rewrite core classes. Never modify the database directly. Always use declarative schema + UI components for grid customization.

---

**Q6. Answer: A — `adminhtml_dashboard_index`**

```
PATTERN: adminhtml_{router}_{controller}_{action}

Admin layout handles follow the pattern:
  adminhtml_<frontName>_<controller>_<action>

For the dashboard:
  Router: adminhtml
  Module frontName: dashboard
  Controller: index
  Action: index
  = adminhtml_dashboard_index
```

**Exam focus:** Know how Admin layout handles are constructed. They use `adminhtml_` prefix, NOT `admin_`.

---

**Q7. Answer: C — Catalog Price Rules and Customer Group Prices**

```
EXPLANATION:
Adobe Commerce (not just B2B) supports:
1. Customer Group Prices — set per attribute group on product edit page
2. Catalog Price Rules — rule-based discounts that can target customer groups
3. Tier Prices — quantity-based, can be scoped to customer groups

B2B-only: Shared Catalogs (completely custom pricing per company)
```

**Exam focus:** Customer group pricing is a native Commerce feature, NOT B2B exclusive. Shared Catalogs ARE B2B exclusive.

---

### Domain 2 — Architecture

**Q8. Answer: B — Configure object instantiation, preferences, plugins, and virtual types**

```xml
<!-- di.xml responsibilities: -->

<!-- 1. Preferences (rewrites) -->
<preference for="Magento\Catalog\Api\ProductRepositoryInterface"
            type="Vendor\Module\Model\ProductRepository"/>

<!-- 2. Plugins (interceptors) -->
<type name="Magento\Catalog\Model\Product">
    <plugin name="vendor_module_product_plugin"
            type="Vendor\Module\Plugin\ProductPlugin"
            sortOrder="10"
            disabled="false"/>
</type>

<!-- 3. Virtual Types -->
<virtualType name="Vendor\Module\Model\CustomLogger"
             type="Magento\Framework\Logger\Monolog">
    <arguments>
        <argument name="name" xsi:type="string">custom</argument>
    </arguments>
</virtualType>

<!-- 4. Constructor argument injection -->
<type name="Vendor\Module\Model\Processor">
    <arguments>
        <argument name="maxItems" xsi:type="number">100</argument>
    </arguments>
</type>
```

**Exam focus:** `di.xml` does ALL of these: preferences, plugins, virtual types, argument injection. It does NOT handle routes or database schema.

---

**Q9. Answer: B — Create a new class instance with different constructor arguments without PHP code**

```xml
<!-- VIRTUAL TYPE EXAMPLE -->
<!-- Problem: You need two loggers with different channel names -->
<!-- Without virtual types, you'd need two separate PHP classes -->

<!-- With virtual types: NO new PHP files needed -->
<virtualType name="Vendor\Module\Logger\OrderLogger"
             type="Magento\Framework\Logger\Monolog">
    <arguments>
        <argument name="name" xsi:type="string">order_processing</argument>
        <argument name="handlers" xsi:type="array">
            <item name="system" xsi:type="object">
                Vendor\Module\Logger\Handler\OrderHandler
            </item>
        </argument>
    </arguments>
</virtualType>

<!-- Now inject it like a real class: -->
<type name="Vendor\Module\Model\OrderProcessor">
    <arguments>
        <argument name="logger" xsi:type="object">
            Vendor\Module\Logger\OrderLogger
        </argument>
    </arguments>
</type>
```

**Exam focus:** Virtual types = "configuration-based subclasses." They exist only in DI config, not as PHP files. They can be injected anywhere a real class can.

---

**Q10. Answer: C — `bin/magento setup:di:compile`**

```bash
# Command purposes:
bin/magento setup:di:compile        # Regenerates DI config, interceptors, factories
bin/magento setup:upgrade           # Runs schema/data patches, registers modules
bin/magento cache:flush             # Clears cache only (no code generation)
bin/magento module:enable           # Enables module in config, NOT compile

# Correct order after adding new code:
bin/magento setup:upgrade           # Step 1: apply any DB changes
bin/magento setup:di:compile        # Step 2: compile DI
bin/magento setup:static-content:deploy  # Step 3: deploy static assets
bin/magento cache:flush             # Step 4: clear cache
```

**Exam focus:** `setup:di:compile` generates the `generated/` directory content including interceptors (plugins), factories, and proxies. Without it, plugins don't work in production mode.

---

**Q11. Answer: B — `sortOrder 10` first, then `sortOrder 20`**

```
PLUGIN EXECUTION ORDER:

before plugins: ASCENDING sortOrder (10, 20, 30...)
around plugins: ASCENDING sortOrder (wrapping outward)
after plugins:  DESCENDING sortOrder (...30, 20, 10)

Visualized for sortOrder 10 and 20:

before_10 -> before_20 -> [original method] -> after_20 -> after_10

For around plugins with sortOrder 10 and 20:

around_10 starts
  around_20 starts
    [original method]
  around_20 ends
around_10 ends
```

**Exam focus:** Before = ascending order. After = descending order. Around = ascending order but they wrap — so lower sortOrder around plugins wrap the higher ones.

---

**Q12. Answer: C — `after` plugin**

```php
<?php
// PLUGIN TYPE SIGNATURES:

// BEFORE: Can modify arguments passed to original method
public function beforeSetName(\Magento\Catalog\Model\Product $subject, string $name): array
{
    return [$name . ' (modified)'];  // Returns modified arguments
}

// AFTER: Receives return value of original method
public function afterGetName(\Magento\Catalog\Model\Product $subject, string $result): string
{
    return $result . ' SUFFIX';  // $result = original method's return value
}

// AROUND: Has full control, must call $proceed()
public function aroundSave(
    \Magento\Catalog\Model\Product $subject,
    callable $proceed,
    ...$args
) {
    // Before logic
    $result = $proceed(...$args);  // Calls next plugin or original
    // After logic
    return $result;
}
```

**Exam focus:** `after` plugins receive the **return value** as their second parameter (after `$subject`). `before` plugins receive the **method arguments**. `around` must call `$proceed`.

---

**Q13. Answer: B — `<preference for="..." type="..."/>`**

```xml
<!-- CORRECT preference syntax -->
<preference for="Magento\Catalog\Api\ProductRepositoryInterface"
            type="Vendor\Module\Model\ProductRepository"/>

<!-- WRONG options explained: -->
<!-- A: <rewrite> does not exist in di.xml -->
<!-- C: <plugin> is different from preference -->
<!-- D: <argument> is for constructor injection, not class replacement -->
```

**Exam focus:** `<preference>` replaces an entire class/interface. `<plugin>` intercepts specific methods. They are different tools — preferences are more invasive and can cause conflicts.

---

**Q14. Answer: B — `<event name="..."><observer .../></event>`**

```xml
<!-- app/code/Vendor/Module/etc/events.xml (or etc/frontend/events.xml) -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Event/etc/events.xsd">
    <event name="checkout_cart_product_add_after">
        <observer name="vendor_module_cart_add_observer"
                  instance="Vendor\Module\Observer\CartAddObserver"/>
    </event>
</config>
```

```php
<?php
// app/code/Vendor/Module/Observer/CartAddObserver.php

namespace Vendor\Module\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;

class CartAddObserver implements ObserverInterface
{
    public function execute(Observer $observer): void
    {
        $item = $observer->getEvent()->getQuoteItem();
        // Custom logic
    }
}
```

**Exam focus:** Observer class MUST implement `ObserverInterface`. The `events.xml` nesting is `<event><observer>` — not flat. Area-specific events go in `etc/frontend/`, `etc/adminhtml/`, or global `etc/`.

---

**Q15. Answer: B — Stable PHP interfaces decoupling business logic from implementation**

```
SERVICE CONTRACTS:
- Repository interfaces (e.g., ProductRepositoryInterface)
- Data interfaces (e.g., ProductInterface)
- Management interfaces (e.g., ProductManagementInterface)

Benefits:
1. Stable API surface — external code depends on interface, not implementation
2. Can be used in webapi.xml for REST/SOAP exposure
3. Versioning — implementations can change without breaking callers

Example:
Magento\Catalog\Api\ProductRepositoryInterface
  -> getById($productId)
  -> save(ProductInterface $product)
  -> delete(ProductInterface $product)
  -> getList(SearchCriteriaInterface $searchCriteria)
```

**Exam focus:** Service contracts = interfaces in `Api/` directory. They are mandatory for REST API exposure. Always depend on interfaces, not concrete classes.

---

### Domain 3 — EAV & Database

**Q16. Answer: B — `catalog_product_entity_varchar`**

```
EAV TABLE STRUCTURE:

catalog_product_entity          <- Main entity table (entity_id, sku, type_id)
catalog_product_entity_varchar  <- String values (name, url_key, meta_title)
catalog_product_entity_int      <- Integer values (status, visibility, tax_class)
catalog_product_entity_decimal  <- Decimal values (price, weight, special_price)
catalog_product_entity_datetime <- Date values (special_from_date, news_from_date)
catalog_product_entity_text     <- Long text values (description, short_description)
catalog_product_entity_gallery  <- Media gallery

Query to find a product name:
SELECT value FROM catalog_product_entity_varchar cpev
JOIN eav_attribute ea ON ea.attribute_id = cpev.attribute_id
WHERE ea.attribute_code = 'name'
AND cpev.entity_id = 42
AND cpev.store_id = 0;  -- 0 = global/default
```

**Exam focus:** Know which backend_type maps to which table. `varchar`, `int`, `decimal`, `datetime`, `text`. This is heavily tested.

---

**Q17. Answer: C — `bin/magento setup:upgrade`**

```bash
# setup:upgrade does ALL of the following:
# 1. Runs schema patches (implements SchemaSetupInterface)
# 2. Runs data patches (implements DataPatchInterface)
# 3. Applies declarative schema changes from db_schema.xml
# 4. Registers/updates module versions

# setup:db-schema:upgrade does NOT exist as a standalone command
# The actual command is setup:upgrade (covers everything)

# To preview schema changes without applying:
bin/magento setup:db-declaration:generate-whitelist
```

**Exam focus:** `setup:upgrade` is the single command that applies schema + data changes. `setup:di:compile` is separate (code generation only).

---

**Q18. Answer: B — `Magento\Customer\Setup\CustomerSetup`**

```php
<?php
// In a Data Patch:

namespace Vendor\Module\Setup\Patch\Data;

use Magento\Customer\Setup\CustomerSetup;
use Magento\Customer\Setup\CustomerSetupFactory;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;

class AddCustomerAttribute implements DataPatchInterface
{
    private CustomerSetupFactory $customerSetupFactory;
    private ModuleDataSetupInterface $moduleDataSetup;

    public function __construct(
        CustomerSetupFactory $customerSetupFactory,
        ModuleDataSetupInterface $moduleDataSetup
    ) {
        $this->customerSetupFactory = $customerSetupFactory;
        $this->moduleDataSetup = $moduleDataSetup;
    }

    public function apply(): void
    {
        /** @var CustomerSetup $customerSetup */
        $customerSetup = $this->customerSetupFactory->create(
            ['setup' => $this->moduleDataSetup]
        );

        $customerSetup->addAttribute('customer', 'custom_field', [
            'type'     => 'varchar',
            'label'    => 'Custom Field',
            'input'    => 'text',
            'required' => false,
            'visible'  => true,
            'position' => 100,
        ]);
    }

    public static function getDependencies(): array { return []; }
    public function getAliases(): array { return []; }
}
```

**Exam focus:** Use entity-specific setup classes: `CustomerSetup` for customers, `CategorySetup` for catalog/products. These know the EAV entity types.

---

**Q19. Answer: B — A record of all schema declarations owned by the module for safe rollback**

```json
// app/code/Vendor/Module/etc/db_schema_whitelist.json
// NOTE: The file is named db_schema_whitelist.json in all 2.4.x versions including 2.4.8
{
    "vendor_custom_table": {
        "column": {
            "entity_id": true,
            "name": true,
            "created_at": true
        },
        "index": {
            "VENDOR_CUSTOM_TABLE_NAME": true
        },
        "constraint": {
            "PRIMARY": true
        }
    }
}
```

```bash
# Generate it automatically:
bin/magento setup:db-declaration:generate-whitelist \
    --module-name=Vendor_Module
```

**Exam focus:** The `db_schema_whitelist.json` file must exist for destructive operations (DROP COLUMN, DROP TABLE) to work during module uninstall. Generate it with `setup:db-declaration:generate-whitelist`, never write it by hand.

---

**Q20. Answer: B — Data Patches implementing `DataPatchInterface`**

```php
<?php
// Modern approach (2.3+) — Data Patch

namespace Vendor\Module\Setup\Patch\Data;

use Magento\Framework\Setup\Patch\DataPatchInterface;
use Magento\Framework\Setup\Patch\PatchRevertableInterface;

class CreateDefaultData implements DataPatchInterface, PatchRevertableInterface
{
    // DataPatchInterface required methods:
    public function apply(): void
    {
        // Insert/update data here
    }

    public static function getDependencies(): array
    {
        return []; // List other patch classes this depends on
    }

    public function getAliases(): array
    {
        return []; // Old patch class names this replaces
    }

    // PatchRevertableInterface (optional):
    public function revert(): void
    {
        // Cleanup logic for uninstall
    }
}
```

**Exam focus:** `DataPatchInterface` replaces `InstallData.php` and `UpgradeData.php`. Patches run exactly ONCE (tracked in `patch_list` table). `getDependencies()` ensures ordering.

---

**Q21. Answer: B — Denormalizes EAV data into a single flat table for faster reads**

```
EAV Query (slow):
SELECT name, price, status FROM (
  JOIN catalog_product_entity_varchar
  JOIN catalog_product_entity_decimal
  JOIN catalog_product_entity_int
  ... (one JOIN per attribute)
)

Flat Table Query (fast):
SELECT name, price, status FROM catalog_product_flat_1
WHERE entity_id = 42;

Cost: Flat tables take extra storage and require reindexing
Benefit: Category page queries go from 20+ JOINs to 1 table scan
```

**Exam focus:** Flat catalog improves frontend read performance by removing EAV JOINs. It's updated by the `catalog_product_flat` indexer. In Elasticsearch-heavy setups it's less critical.

---

**Q22. Answer: B — Foreign key is automatically dropped as part of declarative schema rollback**

```xml
<!-- db_schema.xml with foreign key -->
<schema>
    <table name="vendor_order_custom" resource="default">
        <column xsi:type="int" name="order_id" unsigned="true" nullable="false"/>
        <constraint xsi:type="foreign"
                    referenceId="VENDOR_ORDER_CUSTOM_ORDER_ID_SALES_ORDER_ENTITY_ID"
                    table="vendor_order_custom"
                    column="order_id"
                    referenceTable="sales_order"
                    referenceColumn="entity_id"
                    onDelete="CASCADE"/>
    </table>
</schema>
```

```
Declarative schema advantages:
- Version-controlled schema state
- Automatic rollback on module uninstall
- No more version number tracking in setup_module table (for schema)
- Idempotent: running setup:upgrade twice has same result
```

**Exam focus:** Declarative schema IS reversible. When a module is uninstalled, its `db_schema.xml` declarations are rolled back automatically. This is a key advantage over Install/Upgrade scripts.

---

### Domain 4 — Layout / UI Components / Frontend

**Q23. Answer: A — `app/design/frontend/<Vendor>/<theme>/Magento_Catalog/layout/`**

```
THEME DIRECTORY STRUCTURE:
app/design/frontend/
  Vendor/
    ThemeName/
      Magento_Catalog/           <- Module name (underscored)
        layout/                  <- Layout overrides/extensions
          catalog_product_view.xml
        templates/               <- Template overrides
          product/
            view.phtml
        web/                     <- Static assets
          css/
          js/
      Magento_Checkout/
        layout/
      web/                       <- Theme-level assets
        css/
          source/
            _extend.less
```

**Exam focus:** Theme overrides use the `Magento_ModuleName` directory pattern (module name with underscore). The path is `app/design/frontend/Vendor/Theme/Magento_ModuleName/layout/`.

---

**Q24. Answer: C — `<referenceBlock name="block.name" remove="true"/>`**

```xml
<!-- CORRECT way to remove a block -->
<referenceBlock name="catalog.product.related" remove="true"/>

<!-- ALSO VALID (but less common): -->
<referenceBlock name="catalog.product.related">
    <action method="setTemplate">
        <argument name="template" xsi:type="string"></argument>
    </action>
</referenceBlock>

<!-- WRONG: <remove> tag doesn't exist in Magento 2 -->
<!-- WRONG: <block remove="true"> is not valid syntax -->

<!-- To remove a container: -->
<referenceContainer name="sidebar.main" remove="true"/>
```

**Exam focus:** In Magento 2, `<referenceBlock name="..." remove="true"/>` is the correct removal syntax. The Magento 1 `<remove name="..."/>` syntax does NOT exist in Magento 2.

---

**Q25. Answer: B — `toHtml()` applies caching and calls `_toHtml()`**

```php
<?php
// Magento\Framework\View\Element\AbstractBlock

public function toHtml(): string
{
    // 1. Dispatch block_abstract_to_html_before event
    // 2. Check block cache
    if ($this->_getCache()) {
        // Load from cache if available
        $html = $this->_loadCache();
        if ($html !== false) {
            return $html; // Return cached version
        }
    }
    // 3. Call the actual rendering
    $html = $this->_toHtml();
    // 4. Save to cache
    $this->_saveCache($html);
    // 5. Dispatch block_abstract_to_html_after event
    return $html;
}

protected function _toHtml(): string
{
    // Actual template rendering happens here
    // Override THIS method in custom blocks, not toHtml()
    return $this->fetchView($this->getTemplateFile());
}
```

**Exam focus:** Always override `_toHtml()` in custom blocks if needed, not `toHtml()`. The public `toHtml()` provides the cache wrapper and should not be bypassed.

---

**Q26. Answer: B — `<dataSource name="...">`**

```xml
<!-- sales_order_grid.xml - simplified structure -->
<listing xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Ui:etc/ui_configuration.xsd">

    <argument name="data" xsi:type="array">
        <item name="js_config" xsi:type="array">
            <item name="provider" xsi:type="string">
                sales_order_grid.sales_order_grid_data_source
            </item>
        </item>
    </argument>

    <!-- THIS IS THE DATA SOURCE NODE -->
    <dataSource name="sales_order_grid_data_source">
        <argument name="dataProvider" xsi:type="configurableObject">
            <argument name="class" xsi:type="string">
                Magento\Framework\View\Element\UiComponent\DataProvider\DataProvider
            </argument>
        </argument>
    </dataSource>

    <listingToolbar name="listing_top">
        <!-- filters, paging, mass actions -->
    </listingToolbar>

    <columns name="sales_order_columns">
        <column name="increment_id">
            <argument name="data" xsi:type="array">
                <item name="config" xsi:type="array">
                    <item name="label" xsi:type="string" translate="true">Order #</item>
                </item>
            </argument>
        </column>
    </columns>
</listing>
```

**Exam focus:** UI component listings use `<dataSource>` node to connect to a PHP data provider. The provider class handles filtering, sorting, and pagination.

---

**Q27. Answer: C — `$block->escapeHtml($block->getTitle())`**

```php
<!-- CORRECT escaping in phtml templates -->
<?= $block->escapeHtml($block->getTitle()) ?>

<!-- Other escaping methods: -->
<?= $block->escapeUrl($block->getUrl()) ?>
<?= $block->escapeJs($block->getJsData()) ?>
<?= $block->escapeHtmlAttr($block->getAttrValue()) ?>
<?= $block->escapeCss($block->getCssValue()) ?>

<!-- WRONG examples: -->
<?= $block->getTitle() ?>              <!-- XSS risk: no escaping -->
<?= htmlspecialchars($block->getTitle()) ?>  <!-- Works but not Magento way -->
<?= strip_tags($block->getTitle()) ?>  <!-- Not escaping, removes tags entirely -->
```

**Exam focus:** Always use `$block->escapeHtml()` — it's context-aware and is the Magento-standard approach. Raw output without escaping is an XSS vulnerability and will appear on the exam as a "what's wrong" question.

---

**Q28. Answer: A — `requirejs-config.js`**

```javascript
// app/code/Vendor/Module/view/frontend/requirejs-config.js
// (or in theme: app/design/frontend/Vendor/Theme/requirejs-config.js)

var config = {
    map: {
        '*': {
            // Map alias to file path
            'Vendor_Module/js/custom': 'Vendor_Module/js/custom',
            // Override a core JS component
            'Magento_Checkout/js/view/shipping': 
                'Vendor_Module/js/view/custom-shipping'
        }
    },
    paths: {
        // External libraries
        'slick': 'Vendor_Module/js/vendor/slick'
    },
    shim: {
        'slick': {
            deps: ['jquery']
        }
    },
    config: {
        mixins: {
            'Magento_Checkout/js/view/shipping': {
                'Vendor_Module/js/mixin/shipping-mixin': true
            }
        }
    }
};
```

**Exam focus:** `requirejs-config.js` handles: `map` (aliases), `paths` (external libs), `shim` (non-AMD libraries), `config.mixins` (JS mixins). It's the entry point for all JS customization.

---

**Q29. Answer: B — Initializes a JavaScript component on a DOM element**

```html
<!-- x-magento-init pattern -->
<div class="product-info-main">
    <script type="text/x-magento-init">
    {
        "[data-role=swatch-options]": {
            "Magento_Swatches/js/swatch-renderer": {
                "jsonConfig": <?= $block->getJsonConfig() ?>,
                "jsonSwatchConfig": <?= $block->getJsonSwatchConfig() ?>
            }
        }
    }
    </script>
</div>

<!-- Alternative: data-mage-init attribute -->
<div data-mage-init='{"Vendor_Module/js/component": {"option": "value"}}'>
    <!-- Component attaches to this element -->
</div>

<!-- Difference:
  data-mage-init: attaches to the element it's on
  x-magento-init: can target any CSS selector on the page
  x-magento-init with "*" key: no DOM element, just initializes component
-->
```

**Exam focus:** `x-magento-init` vs `data-mage-init` — the former uses a CSS selector key and can target elements not in the current DOM context. Both use RequireJS component loading.

---

**Q30. Answer: B — `web/css/source/_variables.less` or `_extend.less`**

```less
// app/design/frontend/Vendor/Theme/web/css/source/_theme.less
// OR override Magento_Blank variables:
// app/design/frontend/Vendor/Theme/web/css/source/_variables.less

// Override primary button color:
@button-primary__background: #ff6600;
@button-primary__border: 1px solid #ff6600;
@button-primary__color: #ffffff;

// _extend.less is for ADDING new styles
// _variables.less is for OVERRIDING existing variables
// _theme.less is specifically for theme-level variable overrides
```

```
LESS file hierarchy (from most specific to least):
1. _theme.less (theme-specific overrides)
2. _variables.less (all variable overrides)
3. _extend.less (additional styles)
4. styles-m.less / styles-l.less (main entry points)
```

**Exam focus:** Use LESS variables, not direct CSS overrides. `_variables.less` overrides Magento's default values. `_extend.less` adds new rules without touching originals.

---

### Domain 5 — Checkout / Cart / Payment

**Q31. Answer: B — `Magento\Payment\Model\MethodInterface`**

```php
<?php
// Recommended pattern in 2.3+: use Gateway (Command Pattern)
// But the interface is still MethodInterface

namespace Vendor\Module\Model\Payment;

use Magento\Payment\Model\Method\AbstractMethod;

class CustomPayment extends AbstractMethod
{
    // AbstractMethod already implements MethodInterface

    protected $_code = 'vendor_custom_payment';
    protected $_isGateway = true;
    protected $_canCapture = true;
    protected $_canRefund = true;

    // For simple methods, override these:
    public function authorize(
        \Magento\Payment\Model\InfoInterface $payment,
        $amount
    ): self {
        // Call payment gateway
        return $this;
    }
}
```

```xml
<!-- config.xml -->
<config>
    <default>
        <payment>
            <vendor_custom_payment>
                <active>1</active>
                <model>Vendor\Module\Model\Payment\CustomPayment</model>
                <title>Custom Payment</title>
                <payment_action>authorize</payment_action>
            </vendor_custom_payment>
        </payment>
    </default>
</config>
```

**Exam focus:** Payment methods extend `AbstractMethod` which implements `MethodInterface`. The `_code` property must match the `config.xml` section name. Gateway (Command Pattern) is modern approach for complex integrations.

---

**Q32. Answer: C — Cart totals calculation**

```
CHECKOUT FLOW ORDER:

1. Cart totals calculation (collectTotals)
   - Subtotal, discounts, tax, shipping estimate
   
2. Shipping address entry
   
3. Address validation
   
4. Shipping method selection
   
5. Payment method selection
   
6. Order review
   
7. Order placement (placeOrder)
   - Quote -> Order conversion
   - Payment processing
   - Email notification
```

**Exam focus:** `collectTotals()` runs before address validation. Know the sequence: cart -> address -> shipping -> payment -> place order.

---

**Q33. Answer: B — `checkout_cart_product_add_after`**

```php
// Key cart/checkout events:
checkout_cart_product_add_before   // Before adding to cart
checkout_cart_product_add_after    // After adding to cart (item available)
checkout_cart_save_before          // Before cart save
checkout_cart_save_after           // After cart save
sales_quote_item_qty_set_after     // When quantity changes
checkout_submit_before             // Before order placement
checkout_submit_all_after          // After order is placed
sales_order_place_after            // After order placed (order object available)
```

**Exam focus:** `checkout_cart_product_add_after` — note the underscore pattern. The observer receives `$observer->getEvent()->getQuoteItem()` and `$observer->getEvent()->getProduct()`.

---

**Q34. Answer: A — `Magento\Shipping\Model\Carrier\AbstractCarrier`**

```php
<?php
namespace Vendor\Module\Model\Carrier;

use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Quote\Model\Quote\Address\RateRequest;
use Magento\Quote\Model\Quote\Address\RateResult\ErrorFactory;
use Magento\Quote\Model\Quote\Address\RateResult\MethodFactory;
use Magento\Shipping\Model\Carrier\AbstractCarrier;
use Magento\Shipping\Model\Carrier\CarrierInterface;
use Magento\Shipping\Model\Rate\ResultFactory;
use Psr\Log\LoggerInterface;

class CustomCarrier extends AbstractCarrier implements CarrierInterface
{
    protected $_code = 'vendor_custom';
    protected $_isFixed = true;

    private ResultFactory $rateResultFactory;
    private MethodFactory $rateMethodFactory;

    public function __construct(
        ScopeConfigInterface $scopeConfig,
        ErrorFactory $rateErrorFactory,
        LoggerInterface $logger,
        ResultFactory $rateResultFactory,
        MethodFactory $rateMethodFactory,
        array $data = []
    ) {
        parent::__construct($scopeConfig, $rateErrorFactory, $logger, $data);
        $this->rateResultFactory = $rateResultFactory;
        $this->rateMethodFactory = $rateMethodFactory;
    }

    public function collectRates(RateRequest $request)
    {
        if (!$this->getConfigFlag('active')) {
            return false;
        }

        $result = $this->rateResultFactory->create();
        $method = $this->rateMethodFactory->create();

        $method->setCarrier($this->_code);
        $method->setCarrierTitle($this->getConfigData('title'));
        $method->setMethod('standard');
        $method->setMethodTitle('Standard Shipping');
        $method->setPrice(9.99);
        $method->setCost(9.99);

        $result->append($method);
        return $result;
    }

    public function getAllowedMethods(): array
    {
        return ['standard' => 'Standard Shipping'];
    }
}
```

**Exam focus:** Custom carriers MUST implement `CarrierInterface` (for `collectRates()` and `getAllowedMethods()`) AND extend `AbstractCarrier`. Both are required.

---

**Q35. Answer: B — `Magento\Quote\Model\QuoteManagement::placeOrder()`**

```php
// The order placement flow:
// 1. Customer submits checkout
// 2. JS calls REST endpoint POST /V1/carts/mine/order
// 3. This calls GuestCartManagement or CartManagement
// 4. Which delegates to QuoteManagement::placeOrder()
// 5. QuoteManagement converts quote to order
// 6. Dispatches checkout_submit_all_after event

// Service contract chain:
// CartManagementInterface::placeOrder()
//   -> QuoteManagement::placeOrder()
//     -> OrderManagement::place()
//       -> OrderRepository::save()
```

**Exam focus:** `QuoteManagement::placeOrder()` is the key method that converts a quote to an order. The REST endpoint is `POST /V1/carts/{cartId}/order` or `POST /V1/carts/mine/order`.

---

**Q36. Answer: B — Add JS component to checkout layout as child of `steps`**

```xml
<!-- app/code/Vendor/Module/view/frontend/layout/checkout_index_index.xml -->
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceBlock name="checkout.root">
            <arguments>
                <argument name="jsLayout" xsi:type="array">
                    <item name="components" xsi:type="array">
                        <item name="checkout" xsi:type="array">
                            <item name="children" xsi:type="array">
                                <item name="steps" xsi:type="array">
                                    <item name="children" xsi:type="array">
                                        <!-- ADD CUSTOM STEP HERE -->
                                        <item name="my-custom-step" xsi:type="array">
                                            <item name="component" xsi:type="string">
                                                Vendor_Module/js/view/my-custom-step
                                            </item>
                                            <item name="sortOrder" xsi:type="string">1</item>
                                            <item name="displayArea" xsi:type="string">steps</item>
                                        </item>
                                    </item>
                                </item>
                            </item>
                        </item>
                    </item>
                </argument>
            </arguments>
        </referenceBlock>
    </body>
</page>
```

**Exam focus:** Checkout customization goes through `checkout.root` block's `jsLayout` argument. NEVER directly edit core JS files. Use layout XML merging to inject step components.

---

### Domain 6 — Catalog / Products

**Q37. Answer: B — Bundle Product**

```
PRODUCT TYPE COMPARISON:

Simple       -> Single SKU, no variations
Virtual      -> No shipping (services, downloads)
Downloadable -> Digital goods, file download
Grouped      -> Display multiple simple products together (each priced separately)
Configurable -> One product with variations (size/color) via attributes
Bundle       -> Customer assembles from options (e.g., PC: choose CPU, RAM, GPU)
Gift Card    -> Fixed/range/open amount gift cards

Bundle Product key features:
- Options with required/optional flag
- Each option can have multiple items
- Items can be simple, virtual, or downloadable
- Pricing: fixed bundle price OR dynamic (sum of selected items)
- Affects inventory of child products
```

**Exam focus:** Grouped = display multiple products. Bundle = build one product from components. Configurable = same product with attribute variations (creates child simple products).

---

**Q38. Answer: A — `catalog_eav_attribute` table**

```sql
-- catalog_eav_attribute extends eav_attribute with catalog-specific settings
-- Key columns in catalog_eav_attribute:
-- attribute_id (FK to eav_attribute.attribute_id)
-- is_filterable (use in layered navigation - filtered results)
-- is_filterable_in_search (use in search results navigation)
-- position (position in layered navigation)
-- is_searchable (include in fulltext search)
-- is_visible_on_front (show on product page)
-- is_comparable (use in product comparison)
-- is_used_for_promo_rules (use in catalog price rules)

SELECT ea.attribute_code, cea.is_filterable, cea.is_searchable
FROM eav_attribute ea
JOIN catalog_eav_attribute cea ON ea.attribute_id = cea.attribute_id
WHERE ea.attribute_code = 'color';
```

**Exam focus:** Catalog attribute configuration (filterable, searchable, comparable) is in `catalog_eav_attribute`, not just `eav_attribute`. Both tables work together.

---

**Q39. Answer: B — `catalogsearch_fulltext`**

```bash
# Run specific indexer:
bin/magento indexer:reindex catalogsearch_fulltext

# All indexers (full reindex):
bin/magento indexer:reindex

# Check indexer status:
bin/magento indexer:status

# Key indexers for exam:
# catalog_product_price        -> Price changes
# catalog_product_flat         -> Flat table rebuild (frontend perf)
# catalogsearch_fulltext       -> Search index (Elasticsearch)
# catalog_category_product     -> Category-product associations
# catalog_product_attribute    -> Attribute values for filtering
# inventory                    -> MSI stock status
```

**Exam focus:** After bulk import, you need `catalogsearch_fulltext` for search AND `catalog_product_flat` for category pages. The exam often asks which SPECIFIC indexer to run.

---

### Domain 7 — Cloud

**Q40. Answer: C — `.magento.app.yaml`**

```yaml
# .magento.app.yaml - Application configuration
name: mymagento
type: php:8.1

build:
    flavor: none

dependencies:
    php:
        composer/composer: '^2.0'

runtime:
    extensions:
        - redis
        - xsl
        - newrelic

# CRON JOBS defined here:
crons:
    cronrun:
        spec: "* * * * *"
        cmd: "php bin/magento cron:run"

# WORKER services defined here:
workers:
    queue:
        size: S
        commands:
            start: "php bin/magento queue:consumers:start"

# Build and deploy hooks:
hooks:
    build: |
        composer install --no-dev --prefer-dist
        php ./vendor/bin/ece-tools run scenario/build/generate.xml
    deploy: |
        php ./vendor/bin/ece-tools run scenario/deploy.xml
    post_deploy: |
        php ./vendor/bin/ece-tools run scenario/post-deploy.xml
```

**Exam focus:** `.magento.app.yaml` = app definition (crons, workers, hooks, PHP version, extensions). `.magento.env.yaml` = environment variables. `services.yaml` = backend services.

---

**Q41. Answer: B — Configure backend services (MySQL, Redis, Elasticsearch, RabbitMQ)**

```yaml
# services.yaml
mysql:
    type: mysql:10.4
    disk: 5120

redis:
    type: redis:7.0

elasticsearch:
    type: elasticsearch:7.11
    disk: 1024

rabbitmq:
    type: rabbitmq:3.9
    disk: 512
```

```yaml
# .magento.app.yaml relationships (connects app to services)
relationships:
    database: "mysql:mysql"
    redis: "redis:redis"
    elasticsearch: "elasticsearch:elasticsearch"
    mq: "rabbitmq:rabbitmq"
```

**Exam focus:** `services.yaml` defines services. `.magento.app.yaml` relationships connect the app to those services. Both files must be updated when adding a new service.

---

**Q42. Answer: B — `magento-cloud tunnel:open`**

```bash
# Open SSH tunnel to database:
magento-cloud tunnel:open --project=<project-id> --environment=<env>

# Then connect via local client:
magento-cloud tunnel:info   # Shows tunnel connection details
mysql --host=127.0.0.1 --port=30000 -u user -p dbname

# Other useful Cloud CLI commands:
magento-cloud environment:list          # List environments
magento-cloud environment:ssh          # SSH into environment
magento-cloud environment:merge        # Merge branch to parent
magento-cloud environment:branch       # Create new branch/environment
magento-cloud log:tail                 # Stream environment logs
magento-cloud variable:set             # Set environment variable
magento-cloud snapshot:create         # Create environment snapshot
```

**Exam focus:** `magento-cloud tunnel:open` creates SSH tunnels. `magento-cloud ssh` opens an interactive shell. `magento-cloud db:connect` is not a real command — the correct one is `tunnel:open`.

---

**Q43. Answer: B — `composer install` runs, static content can be deployed; NO database access**

```
CLOUD DEPLOYMENT PHASES:

BUILD PHASE (no DB access):
+------------------------------------------+
| - composer install                        |
| - code compilation (setup:di:compile)     |
| - static content generation (optional)    |
| - no database connection available        |
| - read-only filesystem changes            |
+------------------------------------------+

DEPLOY PHASE (site in maintenance mode):
+------------------------------------------+
| - database migrations (setup:upgrade)     |
| - configuration import                    |
| - cache flush                             |
| - site is DOWN during this phase          |
+------------------------------------------+

POST-DEPLOY PHASE:
+------------------------------------------+
| - cache warmup                            |
| - Fastly cache purge                      |
| - New Relic notifications                 |
| - site is UP again                        |
+------------------------------------------+
```

**Exam focus:** BUILD phase = no database. DEPLOY phase = database access, maintenance mode ON. POST-DEPLOY = site live again. Static content deploy in BUILD phase = zero downtime deployment.

---

### Domain 8 — External Integrations / APIs

**Q44. Answer: B — `GET /V1/products/{sku}`**

```bash
# REST API product endpoints:
GET    /V1/products/{sku}           # Get product by SKU
GET    /V1/products?searchCriteria[...] # Search products
POST   /V1/products                 # Create product
PUT    /V1/products/{sku}           # Update product
DELETE /V1/products/{sku}           # Delete product

# Example cURL:
curl -X GET \
  'https://store.example.com/rest/V1/products/MH01-XS-Black' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json'

# Search with criteria:
GET /V1/products?searchCriteria[filter_groups][0][filters][0][field]=sku
  &searchCriteria[filter_groups][0][filters][0][value]=MH01%25
  &searchCriteria[filter_groups][0][filters][0][condition_type]=like
```

**Exam focus:** REST endpoints follow `/rest/V1/<resource>/{identifier}` pattern. SKU is the identifier for products, NOT the entity_id. Always use SKU in product API calls.

---

**Q45. Answer: B — `webapi.xml`**

```xml
<!-- app/code/Vendor/Module/etc/webapi.xml -->
<?xml version="1.0"?>
<routes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Webapi:etc/webapi.xsd">

    <!-- GET endpoint (no auth required - anonymous) -->
    <route url="/V1/vendor/module/items" method="GET">
        <service class="Vendor\Module\Api\ItemRepositoryInterface" method="getList"/>
        <resources>
            <resource ref="anonymous"/>
        </resources>
    </route>

    <!-- POST endpoint (requires authentication) -->
    <route url="/V1/vendor/module/items" method="POST">
        <service class="Vendor\Module\Api\ItemRepositoryInterface" method="save"/>
        <resources>
            <resource ref="Vendor_Module::items_manage"/>
        </resources>
    </route>

    <!-- Customer-scoped endpoint -->
    <route url="/V1/vendor/module/mine" method="GET">
        <service class="Vendor\Module\Api\CustomerItemInterface" method="getMyItems"/>
        <resources>
            <resource ref="self"/>  <!-- self = logged-in customer -->
        </resources>
    </route>

</routes>
```

**Exam focus:** `webapi.xml` maps HTTP method + URL to PHP interface method. The `<resources>` node controls access: `anonymous` = public, `self` = logged-in customer, specific ACL resource = admin/integration.

---

## 5. Adobe Commerce Technical Guidelines — Deep Dive

> **Source:** [developer.adobe.com/commerce/php/coding-standards/technical-guidelines/](https://developer.adobe.com/commerce/php/coding-standards/technical-guidelines/)

### 5.1 Class Design Rules

```
TESTABLE RULES FROM TECHNICAL GUIDELINES:

1. Classes should be either ABSTRACT or FINAL (or have reason not to be)
2. All dependencies must be INJECTABLE (constructor injection preferred)
3. Classes must not have more than ONE responsibility (SRP)
4. Favor COMPOSITION over inheritance
5. All public methods should be covered by interface
```

**Exam focus:** The guidelines explicitly state to avoid `ObjectManager` direct usage in business logic. Always use constructor injection or factories.

---

### 5.2 Object Manager Rules

```php
<?php
// WRONG: Direct ObjectManager use in business logic
class MyModel
{
    public function doSomething()
    {
        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        $product = $objectManager->create(\Magento\Catalog\Model\Product::class);
        // VIOLATION - never do this
    }
}

// CORRECT: Constructor injection
class MyModel
{
    private \Magento\Catalog\Model\ProductFactory $productFactory;

    public function __construct(
        \Magento\Catalog\Model\ProductFactory $productFactory
    ) {
        $this->productFactory = $productFactory;
    }

    public function doSomething()
    {
        $product = $this->productFactory->create();
        // Correct
    }
}
```

**Exam focus:** `ObjectManager::getInstance()` is ONLY acceptable in: static methods, Bootstrap/entry point files, tests, and Factories themselves. Everywhere else = violation.

---

### 5.3 Dependency Rules

```php
<?php
// RULE: Depend on INTERFACES, not concrete classes

// WRONG:
class OrderProcessor
{
    public function __construct(
        \Magento\Catalog\Model\ProductRepository $productRepository  // Concrete!
    ) {}
}

// CORRECT:
class OrderProcessor
{
    public function __construct(
        \Magento\Catalog\Api\ProductRepositoryInterface $productRepository  // Interface!
    ) {}
}

// RULE: No circular dependencies
// A depends on B, B depends on A = VIOLATION

// RULE: Use Proxy for optional/heavy dependencies
class HeavyCommand
{
    public function __construct(
        \Magento\Catalog\Model\ResourceModel\Product\Collection\Proxy $collection
        // Proxy prevents instantiation until actually used
    ) {}
}
```

**Exam focus:** Constructor injection + interfaces + proxies for heavy/optional dependencies. The technical guidelines specifically call out the Proxy pattern for lazy loading.

---

### 5.4 Constructor Rules

```php
<?php
// RULE: Constructors must not contain business logic
// RULE: Constructor should only do dependency injection

// WRONG:
class ProductManager
{
    private array $expensiveData;

    public function __construct(
        \Magento\Catalog\Api\ProductRepositoryInterface $repository
    ) {
        // VIOLATION: Business logic in constructor
        $this->expensiveData = $repository->getList(...)->getItems();
    }
}

// CORRECT:
class ProductManager
{
    private \Magento\Catalog\Api\ProductRepositoryInterface $repository;
    private ?array $expensiveData = null;

    public function __construct(
        \Magento\Catalog\Api\ProductRepositoryInterface $repository
    ) {
        $this->repository = $repository;
        // No logic here!
    }

    private function getExpensiveData(): array
    {
        if ($this->expensiveData === null) {
            $this->expensiveData = $this->repository->getList(...)->getItems();
        }
        return $this->expensiveData;
    }
}
```

**Exam focus:** Constructors = assignment only. Lazy loading via `null` check pattern is the correct alternative to constructor-based initialization.

---

### 5.5 Method Rules

```php
<?php
// RULE: Method names should be descriptive (no get/set for non-accessor/mutators)
// RULE: Methods must do ONE thing (SRP applies to methods too)
// RULE: Prefer short methods (< 20 lines is a guideline)

// RULE: Optional arguments should come LAST
public function createProduct(
    string $sku,              // Required
    float $price,             // Required
    string $type = 'simple',  // Optional - goes last
    array $attributes = []    // Optional - goes last
): ProductInterface {}

// RULE: Return types should always be declared
public function getProductById(int $id): ?ProductInterface {}

// RULE: No direct superglobal access
// WRONG:
$id = $_GET['id'];

// CORRECT:
$id = $this->request->getParam('id');
```

**Exam focus:** Return type declarations, nullable types (`?`), no superglobals, optional params last. These are all covered in the technical guidelines.

---

### 5.6 Code Style Standards

```php
<?php
// RULE: 4 spaces (no tabs)
// RULE: PSR-2 (and PSR-12) compliance
// RULE: Short array syntax []

// WRONG array syntax:
$array = array('key' => 'value');

// CORRECT:
$array = ['key' => 'value'];

// RULE: Strict type declarations
declare(strict_types=1);

// RULE: Type hints on ALL parameters and return types
// RULE: Use PHP 8.x features where applicable
// RULE: No @author tags in docblocks

// RULE: Exception handling
// WRONG: Catching base Exception and swallowing it
try {
    $this->doSomething();
} catch (\Exception $e) {
    // silently fail - VIOLATION
}

// CORRECT:
try {
    $this->doSomething();
} catch (\Magento\Framework\Exception\NoSuchEntityException $e) {
    $this->logger->error($e->getMessage());
    throw $e; // Re-throw or handle specifically
}
```

**Exam focus:** `declare(strict_types=1)` at top of files. Short array syntax. Specific exception types, not base `\Exception`. Log before re-throwing.

---

### 5.7 Template and View Rules

```php
// RULE: Templates (phtml) must have minimal PHP logic
// RULE: All output must be escaped
// RULE: No business logic in templates — use Block/ViewModel

// WRONG in phtml:
<?php
$objectManager = \Magento\Framework\App\ObjectManager::getInstance();
$product = $objectManager->get(\Magento\Catalog\Model\Product::class)->load(42);
echo $product->getName(); // Multiple violations
?>

// CORRECT in phtml:
// Data prepared in Block/ViewModel, template just renders
<?= $block->escapeHtml($block->getProductName()) ?>
```

```php
<?php
// RULE: Use ViewModels instead of Blocks for data preparation (2.3+)
namespace Vendor\Module\ViewModel;

use Magento\Framework\View\Element\Block\ArgumentInterface;

class ProductViewModel implements ArgumentInterface
{
    private \Magento\Catalog\Api\ProductRepositoryInterface $productRepository;

    public function __construct(
        \Magento\Catalog\Api\ProductRepositoryInterface $productRepository
    ) {
        $this->productRepository = $productRepository;
    }

    public function getProductName(string $sku): string
    {
        return $this->productRepository->get($sku)->getName() ?? '';
    }
}
```

```xml
<!-- Injecting ViewModel into layout -->
<block class="Magento\Framework\View\Element\Template"
       name="vendor.product.view"
       template="Vendor_Module::product/view.phtml">
    <arguments>
        <argument name="view_model"
                  xsi:type="object">Vendor\Module\ViewModel\ProductViewModel</argument>
    </arguments>
</block>
```

```php
// In phtml:
<?php
/** @var \Vendor\Module\ViewModel\ProductViewModel $viewModel */
$viewModel = $block->getData('view_model');
?>
<h1><?= $block->escapeHtml($viewModel->getProductName('MH01')) ?></h1>
```

**Exam focus:** ViewModels implement `ArgumentInterface`. They're injected via layout XML. They replace business logic in Block classes. This is the MODERN RECOMMENDED approach in Magento 2.3+.

---

### 5.8 Plugin Rules

```php
<?php
// RULE: Plugins must not change the method signature's contract
// RULE: Around plugins should be used sparingly (they are expensive)
// RULE: Prefer before/after over around when possible

// RULE: Plugin class naming convention
// Vendor\Module\Plugin\TargetClass\MethodNamePlugin
// OR
// Vendor\Module\Plugin\TargetClassPlugin

// RULE: Plugins cannot be applied to:
// - Final classes
// - Final methods
// - __construct()
// - Static methods
// - Non-public methods
// - Classes without virtual method declarations

// RULE: Around plugin must call $proceed
public function aroundExecute(
    \Some\Class $subject,
    callable $proceed
): \Magento\Framework\Controller\ResultInterface {
    // MUST call $proceed or you break the chain
    $result = $proceed();
    return $result;
}
```

**Exam focus:** Plugins CANNOT intercept: `final` methods/classes, `__construct`, static methods, non-public methods. This is a very common exam question.

---

### 5.9 Event and Observer Rules

```
RULE: Use events for cross-module communication
RULE: Observers must be lightweight (no heavy processing)
RULE: Observers must implement ObserverInterface
RULE: Observer class must have execute(Observer $observer) method only
RULE: Do NOT add new dependencies to events that were not there before
```

```php
<?php
// CORRECT Observer:
namespace Vendor\Module\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;

class ProductSaveAfterObserver implements ObserverInterface
{
    // Single responsibility: ONE thing this observer does
    public function execute(Observer $observer): void
    {
        /** @var \Magento\Catalog\Model\Product $product */
        $product = $observer->getEvent()->getProduct();
        // Lightweight operation only
    }
}
```

**Exam focus:** Observer class name convention: `{EventName}Observer`. Method is always `execute(Observer $observer): void`. Only ONE public method in observer classes.

---

### 5.10 Repository Pattern Rules

```php
<?php
// RULE: Use Repository pattern for CRUD operations
// RULE: Never use Model::load() in new code
// RULE: Use getById() / getList() / save() / delete() via repository

// WRONG (legacy pattern):
$product = $this->productFactory->create()->load(42);

// CORRECT (repository pattern):
try {
    $product = $this->productRepository->getById(42);
} catch (\Magento\Framework\Exception\NoSuchEntityException $e) {
    // Handle not found
}

// SearchCriteria for listing:
$searchCriteria = $this->searchCriteriaBuilder
    ->addFilter('status', 1)
    ->addFilter('type_id', 'simple')
    ->setPageSize(20)
    ->setCurrentPage(1)
    ->create();

$results = $this->productRepository->getList($searchCriteria);
$products = $results->getItems();
```

**Exam focus:** Repository = service contract implementation. Use `SearchCriteriaBuilder` for filtered lists. NEVER use `Model::load()` in modern code — it bypasses service contracts and caching.

---

## 6. Post-Exam Analysis Framework

### Scoring Your Practice Exam

```
Score Interpretation:
-------------------------------------------
< 60%  -> Significant gaps, focus review 2+ days
60-70% -> Close to passing, targeted review
70-75% -> Borderline (passing is ~68-72%)
> 75%  -> Confident, refine weak areas
-------------------------------------------

Adobe AD0-E725 passing score: ~68% (verify current)
Question count: 40-50 questions
Time limit: 90 minutes
Format: Multiple choice, multiple select
```

### Wrong Answer Analysis Template

```
For EACH wrong answer, fill out:

Question #: ___
Domain: ___
My Answer: ___
Correct Answer: ___
Why I Was Wrong:
  [ ] Didn't know the concept at all
  [ ] Confused two similar concepts
  [ ] Misread the question
  [ ] Guessed wrong between two good options
Key Learning:
  ___________________________________
Where to Find It:
  [ ] Technical Guidelines
  [ ] DevDocs
  [ ] These study notes section: ___
```

---

## 7. Weakness Mapping by Domain

### Domain Weakness Tracker

| Domain | Questions | My Score | Weak Concepts | Priority |
|--------|-----------|----------|---------------|----------|
| 1. Admin/Storefront | Q1-Q7 | __/7 | | |
| 2. Architecture | Q8-Q15 | __/8 | | |
| 3. EAV/Database | Q16-Q22 | __/7 | | |
| 4. Layout/Frontend | Q23-Q30 | __/8 | | |
| 5. Checkout/Cart | Q31-Q36 | __/6 | | |
| 6. Catalog | Q37-Q39 | __/3 | | |
| 7. Cloud | Q40-Q43 | __/4 | | |
| 8. APIs | Q44-Q45 | __/2 | | |

### Common Wrong Answer Patterns

```
PATTERN 1: Confusing similar files
  menu.xml vs acl.xml vs routes.xml
  .magento.app.yaml vs .magento.env.yaml vs services.yaml
  webapi.xml vs di.xml vs events.xml

PATTERN 2: Confusing plugin types
  before = modifies arguments
  after = modifies return value
  around = full control, must call $proceed

PATTERN 3: Confusing class extension
  Carriers extend AbstractCarrier + implement CarrierInterface
  Payment methods extend AbstractMethod (which implements MethodInterface)
  Observers implement ObserverInterface (no extension)

PATTERN 4: EAV table routing
  varchar -> catalog_product_entity_varchar
  int     -> catalog_product_entity_int
  decimal -> catalog_product_entity_decimal

PATTERN 5: Cloud phase confusion
  BUILD = no database
  DEPLOY = database available, site down
  POST-DEPLOY = site up, warmup
```

---

## 8. Tonight's Re-Read Bullet Points

> Fill in YOUR specific gaps after grading. Below are the top 10 most commonly missed concepts based on exam patterns:

```
TONIGHT'S RE-READ LIST (check off as you review):

[ ] 1. Plugin sortOrder execution order: before=ascending, after=descending
        Location: Domain 2 / Q11-Q12 notes above

[ ] 2. Declarative schema (db_schema.xml) vs Data Patches vs old Install scripts
        Location: Domain 3 / Q17-Q22 notes above

[ ] 3. Cloud YAML files — which does what
        .magento.app.yaml vs .magento.env.yaml vs services.yaml
        Location: Domain 7 / Q40-Q43 notes above

[ ] 4. Layout XML: referenceBlock remove="true" syntax (NOT <remove>)
        Location: Domain 4 / Q24 notes above

[ ] 5. ViewModel pattern — when and how (ArgumentInterface)
        Location: Section 5.7 Technical Guidelines

[ ] 6. Plugin limitations: cannot intercept final, static, __construct
        Location: Section 5.8 Technical Guidelines

[ ] 7. webapi.xml structure: route + service + resources
        Location: Domain 8 / Q45 notes above

[ ] 8. EAV value table mapping (varchar/int/decimal/datetime/text)
        Location: Domain 3 / Q16 notes above

[ ] 9. Checkout flow order (collectTotals -> address -> shipping -> payment)
        Location: Domain 5 / Q32 notes above

[ ] 10. escapeHtml() — ALWAYS in templates, method belongs to $block
         Location: Domain 4 / Q27 notes above
```

### Your Personal Wrong Answers (fill in after exam)

```
Question numbers I got wrong: ___________________________

My weakest domain: ______________________________________

Three concepts I need to master before exam day:
1. ___________________________________________________
2. ___________________________________________________
3. ___________________________________________________

Re-read tonight:
  [ ] Technical Guidelines doc (skim all sections)
  [ ] DevDocs section: _________________________________
  [ ] These notes section: ____________________________
```

---

## Quick-Reference Checklist

> Everything testable on AD0-E725 — use this for final review.

### Architecture & DI

- [ ] `di.xml` handles: preferences, plugins, virtual types, argument injection
- [ ] Virtual types = config-only "subclasses" with different constructor args
- [ ] Plugin types: `before` (modifies args), `after` (modifies return), `around` (full control)
- [ ] Plugin sortOrder: `before` = ascending, `after` = descending
- [ ] `around` MUST call `$proceed()` or chain is broken
- [ ] Plugins CANNOT intercept: `final` methods/classes, `__construct`, static, non-public
- [ ] `<preference for="Interface" type="ConcreteClass"/>` = class rewrite
- [ ] `setup:di:compile` generates factories, interceptors, proxies
- [ ] `ObjectManager::getInstance()` is forbidden in business logic
- [ ] Always inject interfaces, not concrete classes
- [ ] Proxy pattern for optional/heavy/circular dependencies

### Admin & Storefront

- [ ] `menu.xml` = Admin navigation items (in `etc/adminhtml/`)
- [ ] `acl.xml` = Access control resources
- [ ] `routes.xml` = URL routing
- [ ] `_isAllowed()` = access gate in Admin controllers
- [ ] `ADMIN_RESOURCE` constant auto-checked by base `Action` class
- [ ] Website > Store > Store View hierarchy
- [ ] Prices default to website scope; content = store view scope
- [ ] Admin layout handles: `adminhtml_{frontName}_{controller}_{action}`
- [ ] Customer group pricing is native Commerce (not B2B exclusive)
- [ ] Shared Catalogs = B2B only

### EAV & Database

- [ ] `catalog_product_entity_varchar` = string values (name, url_key)
- [ ] `catalog_product_entity_int` = integer values (status, visibility)
- [ ] `catalog_product_entity_decimal` = decimal values (price, weight)
- [ ] `catalog_product_entity_datetime` = date values
- [ ] `catalog_product_entity_text` = long text (description)
- [ ] `db_schema.xml` = declarative schema (reversible, version-controlled)
- [ ] `db_schema_whitelist.json` required for destructive operations (still named "whitelist" in 2.4.8)
- [ ] `setup:upgrade` applies schema + data changes
- [ ] Data Patches implement `DataPatchInterface`, run exactly once
- [ ] `getDependencies()` ensures patch execution order
- [ ] `catalog_product_flat` = denormalized table for fast reads
- [ ] `catalog_eav_attribute` = filterable/searchable attribute settings
- [ ] Declarative schema rollback is automatic on module uninstall

### Layout & Frontend

- [ ] Theme overrides path: `app/design/frontend/Vendor/Theme/Magento_ModuleName/`
- [ ] Remove block: `<referenceBlock name="..." remove="true"/>`
- [ ] `toHtml()` = public, applies cache; `_toHtml()` = actual render, override this
- [ ] UI component data source: `<dataSource name="...">` node
- [ ] Always use `$block->escapeHtml()` for output — XSS prevention
- [ ] `requirejs-config.js` = map, paths, shim, mixins configuration
- [ ] `x-magento-init` = init JS by CSS selector; `data-mage-init` = on same element
- [ ] LESS `_variables.less` = override variables; `_extend.less` = add styles
- [ ] ViewModels implement `ArgumentInterface`, injected via layout XML
- [ ] ViewModel separates business logic from templates (modern pattern 2.3+)

### Checkout, Cart & Payment

- [ ] Checkout order: `collectTotals` -> address -> shipping -> payment -> place order
- [ ] Event for cart add: `checkout_cart_product_add_after`
- [ ] Custom carrier: extend `AbstractCarrier` + implement `CarrierInterface`
- [ ] `getAllowedMethods()` required in carrier
- [ ] Payment: extend `AbstractMethod` (implements `MethodInterface`)
- [ ] `QuoteManagement::placeOrder()` converts quote to order
- [ ] Add checkout step: inject JS component into `checkout.root` > `steps` via layout XML
- [ ] `HttpPostActionInterface` for mass action controllers

### Catalog

- [ ] Bundle = customer builds product from components
- [ ] Configurable = attribute variations (size/color), creates child simples
- [ ] Grouped = display multiple products together
- [ ] `catalog_eav_attribute.is_filterable` = layered navigation
- [ ] After bulk import: run `catalogsearch_fulltext` indexer
- [ ] `catalog_product_flat` indexer = rebuild flat tables

### Adobe Commerce Cloud

- [ ] `.magento.app.yaml` = crons, workers, hooks, PHP version, extensions
- [ ] `.magento.env.yaml` = environment variables, deploy config
- [ ] `services.yaml` = MySQL, Redis, Elasticsearch, RabbitMQ
- [ ] Build phase = NO database access; composer install + compile
- [ ] Deploy phase = database available, maintenance mode ON
- [ ] Post-deploy phase = site live, cache warmup
- [ ] `magento-cloud tunnel:open` = SSH database tunnel
- [ ] `magento-cloud ssh` = interactive shell
- [ ] `services.yaml` + `.magento.app.yaml` relationships = service connection

### REST API & WebAPI

- [ ] `GET /V1/products/{sku}` = get product by SKU
- [ ] `POST /V1/carts/mine/order` = place order
- [ ] `webapi.xml` = maps HTTP method + URL to PHP interface method
- [ ] `<resource ref="anonymous"/>` = public endpoint
- [ ] `<resource ref="self"/>` = logged-in customer
- [ ] Specific ACL resource = admin/integration auth
- [ ] Service contracts (`Api/` interfaces) required for REST exposure
- [ ] SearchCriteria via `SearchCriteriaBuilder` for filtered queries

### Technical Guidelines Rules

- [ ] Constructor = dependency injection only, NO business logic
- [ ] Classes should be abstract or final (prefer composition)
- [ ] Plugins: prefer before/after over around (around is expensive)
- [ ] `ObjectManager` only in: static methods, Bootstrap, tests, Factories
- [ ] Specific exception catching (`NoSuchEntityException`, not base `\Exception`)
- [ ] `declare(strict_types=1)` at top of PHP files
- [ ] Short array syntax `[]` not `array()`
- [ ] Return types declared on all methods
- [ ] Never use `Model::load()` — use repositories
- [ ] No superglobal access (`$_GET`, `$_POST`) — use `$request->getParam()`
- [ ] Observer: only `execute()` method, implements `ObserverInterface`
- [ ] Events in `events.xml`: `<event name="..."><observer .../></event>` nesting

---

*These notes cover the complete AD0-E725 exam syllabus. Review your wrong answers, map them to these sections, and use the Quick-Reference Checklist as your final day-before-exam scan.*
