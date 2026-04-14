# Day 20 — Final Practice Test & Exam Eve Prep
## Adobe Certified Professional: Commerce Developer — Study Notes

---

## Table of Contents

1. [Day 20 Overview & Mindset](#1-day-20-overview--mindset)
2. [Final Practice Test Strategy](#2-final-practice-test-strategy)
3. [High-Frequency Exam Topics — Master Cheat Sheet](#3-high-frequency-exam-topics--master-cheat-sheet)
   - 3.1 [PHP & Magento Architecture](#31-php--magento-architecture)
   - 3.2 [Dependency Injection & Object Manager](#32-dependency-injection--object-manager)
   - 3.3 [Plugins (Interceptors)](#33-plugins-interceptors)
   - 3.4 [Events & Observers](#34-events--observers)
   - 3.5 [Layouts & Blocks](#35-layouts--blocks)
   - 3.6 [UI Components & Forms](#36-ui-components--forms)
   - 3.7 [JavaScript & RequireJS](#37-javascript--requirejs)
   - 3.8 [Database — EAV, Setup Scripts & Declarative Schema](#38-database--eav-setup-scripts--declarative-schema)
   - 3.9 [Service Contracts & Repositories](#39-service-contracts--repositories)
   - 3.10 [ACL, Routing & Controllers](#310-acl-routing--controllers)
   - 3.11 [Caching & Indexing](#311-caching--indexing)
   - 3.12 [Admin Grids & UI Listing Components](#312-admin-grids--ui-listing-components)
   - 3.13 [Command-Line & Deployment Modes](#313-command-line--deployment-modes)
   - 3.14 [Testing](#314-testing)
4. [Commonly Missed Topics — Quick Corrections](#4-commonly-missed-topics--quick-corrections)
5. [Exam Logistics Checklist](#5-exam-logistics-checklist)
6. [Exam Day Timeline](#6-exam-day-timeline)
7. [Mental Preparation & Confidence Framework](#7-mental-preparation--confidence-framework)
8. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Day 20 Overview & Mindset

```
+----------------------------------------------------------+
|              DAY 20 — EXAM EVE SCHEDULE                  |
+----------------------------------------------------------+
| 1. Timed Practice Test  (90 min, closed notes)           |
| 2. Wrong-Answer Review  (30 min max)                     |
| 3. Cheat Sheet Scan     (20 min max)                     |
| 4. Logistics Confirm    (10 min)                         |
| 5. REST - Early Bedtime (non-negotiable)                 |
+----------------------------------------------------------+
```

> **The single most important thing you can do tonight is sleep.**
> Three weeks of preparation cannot be undone in one evening, but a bad night's sleep can cost you 10–15% on exam performance. Trust the work you have done.

**Exam angle:** Confidence and rest matter as much as content on exam day — trust your 3 weeks of preparation.

---

## 2. Final Practice Test Strategy

### Rules for the Timed Session

- ✅ **Closed notes** — simulate real exam conditions exactly
- ✅ **Set a timer** — the real exam is 90 minutes for ~60 questions (~90 seconds/question)
- ✅ **Single sitting** — no breaks, no phone
- ✅ **Flag, don't stall** — mark uncertain questions and return at the end
- ❌ No Googling mid-test
- ❌ No referring back to notes until the review phase

### Target Score

| Week | Target | Meaning |
|------|--------|---------|
| Week 1 baseline | ~60% | Normal starting point |
| Week 2 result   | ~68–72% | Solid progress |
| **Today (Week 3)** | **75%+** | Exam-ready confidence |
| Passing threshold | **68%** (approx) | Adobe's reported pass mark |

> **Exam focus:** Adobe does not publish the exact passing score, but community consensus places it around **68–70%**. Scoring 75%+ on practice tests gives you a healthy buffer.

### Wrong-Answer Review Protocol (30 min max)

```
For each wrong answer:
  1. Read the question again carefully (2 min)
  2. Identify WHY you got it wrong:
     - Knowledge gap?  --> Read the note block below
     - Misread question? --> Note the keyword trap
     - Careless mistake? --> Dismiss and move on
  3. Write one bullet summarizing the correct concept
  4. Move to the next — do NOT re-study entire topics
```

---

## 3. High-Frequency Exam Topics — Master Cheat Sheet

> This section is your **one-stop scan** for the most tested concepts. Read through once, slowly. Do not take new notes — just refresh memory.

---

### 3.1 PHP & Magento Architecture

**Module file structure:**
```
app/code/Vendor/Module/
  +-- etc/
  |     +-- module.xml
  |     +-- di.xml
  |     +-- frontend/
  |     |     +-- routes.xml
  |     |     +-- layout/
  |     +-- adminhtml/
  +-- registration.php
  +-- Model/
  +-- Block/
  +-- Controller/
  +-- view/
  |     +-- frontend/
  |     |     +-- layout/
  |     |     +-- templates/
  |     +-- adminhtml/
  +-- Setup/
        +-- Patch/
              +-- Data/
              +-- Schema/
```

**`module.xml` minimum:**
```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="Vendor_Module" setup_version="1.0.0">
        <sequence>
            <module name="Magento_Catalog"/>
        </sequence>
    </module>
</config>
```

**`registration.php`:**
```php
<?php
use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::MODULE,
    'Vendor_Module',
    __DIR__
);
```

- **Exam focus:** `<sequence>` declares *load order dependency*, not a hard require. The depended-upon module must be installed separately.
- **Exam focus:** `setup_version` is used by legacy `InstallSchema`/`UpgradeSchema`. Declarative schema uses **data patches** and **schema patches** instead.

---

### 3.2 Dependency Injection & Object Manager

**Preference (type substitution) in `di.xml`:**
```xml
<preference for="Magento\Catalog\Api\ProductRepositoryInterface"
            to="Vendor\Module\Model\ProductRepository"/>
```

**Constructor injection:**
```php
<?php
namespace Vendor\Module\Model;

class MyModel
{
    private \Magento\Catalog\Api\ProductRepositoryInterface $productRepository;

    public function __construct(
        \Magento\Catalog\Api\ProductRepositoryInterface $productRepository
    ) {
        $this->productRepository = $productRepository;
    }
}
```

**Virtual type:**
```xml
<virtualType name="Vendor\Module\Model\SpecialLogger"
             type="Magento\Framework\Logger\Monolog">
    <arguments>
        <argument name="name" xsi:type="string">vendor_module</argument>
    </arguments>
</virtualType>
```

- **Exam focus:** Never instantiate objects with `new` or call `ObjectManager` directly in production code — always use constructor injection.
- **Exam focus:** `virtualType` creates a *named instance* of an existing class with different constructor arguments — it does **not** create a new PHP class file.
- **Exam focus:** `shared="false"` in `di.xml` creates a **new instance** every time (non-singleton). Default is `shared="true"` (singleton).

---

### 3.3 Plugins (Interceptors)

**Plugin types:**

| Type | Method Prefix | Can Modify Return? | Receives `$result`? |
|------|--------------|-------------------|---------------------|
| Before | `before` | No (modifies args) | No |
| Around | `around` | Yes | Via `$proceed()` |
| After | `after` | Yes | Yes |

**Declaration:**
```xml
<!-- etc/di.xml -->
<type name="Magento\Catalog\Model\Product">
    <plugin name="vendor_module_product_plugin"
            type="Vendor\Module\Plugin\ProductPlugin"
            sortOrder="10"
            disabled="false"/>
</type>
```

**Plugin class:**
```php
<?php
namespace Vendor\Module\Plugin;

class ProductPlugin
{
    // Before plugin — modify arguments
    public function beforeSetName(
        \Magento\Catalog\Model\Product $subject,
        string $name
    ): array {
        return [strtoupper($name)];
    }

    // After plugin — modify return value
    public function afterGetName(
        \Magento\Catalog\Model\Product $subject,
        string $result
    ): string {
        return $result . ' (Modified)';
    }

    // Around plugin — full control
    public function aroundSave(
        \Magento\Catalog\Model\Product $subject,
        callable $proceed
    ) {
        // Before logic
        $result = $proceed();
        // After logic
        return $result;
    }
}
```

- **Exam focus:** Plugins **cannot** be applied to: `final` classes, `final` methods, `__construct`, static methods, or non-public methods.
- **Exam focus:** `before` plugin must return an **array** of modified arguments, or `null` to leave them unchanged.
- **Exam focus:** `around` plugins have a **performance cost** — prefer `before`/`after` unless you need to prevent the original method from running.
- **Exam focus:** `sortOrder` controls execution sequence when multiple plugins target the same method.

---

### 3.4 Events & Observers

**Dispatching an event:**
```php
$this->_eventManager->dispatch(
    'vendor_module_custom_event',
    ['product' => $product, 'quote' => $quote]
);
```

**Registering an observer in `events.xml`:**
```xml
<!-- etc/frontend/events.xml  OR  etc/events.xml (global) -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Event/etc/events.xsd">
    <event name="catalog_product_save_after">
        <observer name="vendor_module_product_save"
                  instance="Vendor\Module\Observer\ProductSaveObserver"/>
    </event>
</config>
```

**Observer class:**
```php
<?php
namespace Vendor\Module\Observer;

use Magento\Framework\Event\ObserverInterface;
use Magento\Framework\Event\Observer;

class ProductSaveObserver implements ObserverInterface
{
    public function execute(Observer $observer): void
    {
        $product = $observer->getEvent()->getProduct();
        // your logic here
    }
}
```

- **Exam focus:** Observers implement `ObserverInterface` with a single `execute(Observer $observer)` method.
- **Exam focus:** Events are **area-scoped** (`frontend`, `adminhtml`, `crontab`, global `etc/`). Global scope fires in all areas.
- **Exam focus:** Plugins > Observers when you need to modify return values. Use observers for side effects.

---

### 3.5 Layouts & Blocks

**Layout XML handle hierarchy:**
```
default.xml  (global, every page)
  |
  +-- catalog_product_view.xml   (specific page handle)
        |
        +-- catalog_product_view_type_simple.xml  (type-specific)
```

**Adding a block:**
```xml
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceContainer name="content">
            <block class="Vendor\Module\Block\MyBlock"
                   name="vendor.module.myblock"
                   template="Vendor_Module::mytemplate.phtml"
                   before="-"
                   after="other.block.name"/>
        </referenceContainer>
    </body>
</page>
```

**Moving a block:**
```xml
<move element="catalog.product.related"
      destination="content"
      before="-"/>
```

**Removing a block:**
```xml
<referenceBlock name="right" remove="true"/>
```

**Block PHP class:**
```php
<?php
namespace Vendor\Module\Block;

class MyBlock extends \Magento\Framework\View\Element\Template
{
    public function getCustomData(): string
    {
        return 'Hello from Block';
    }
}
```

**Template (`.phtml`):**
```php
<!-- view/frontend/templates/mytemplate.phtml -->
<?php /** @var \Vendor\Module\Block\MyBlock $block */ ?>
<div class="my-block">
    <?= $block->escapeHtml($block->getCustomData()) ?>
</div>
```

- **Exam focus:** Always use `$block->escapeHtml()`, `$block->escapeUrl()`, etc. — **never echo raw user data**.
- **Exam focus:** `before="-"` means first position; `after="-"` means last position.
- **Exam focus:** Layout files in `view/frontend/layout/` — handle name must match the full action path: `controller_action_index.xml`.
- **Exam focus:** `<referenceBlock>` modifies an *existing* block; `<block>` creates a *new* block.

---

### 3.6 UI Components & Forms

**Admin form UI component (`my_form.xml`):**
```xml
<!-- view/adminhtml/ui_component/vendor_module_form.xml -->
<form xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Ui:etc/ui_configuration.xsd">
    <argument name="data" xsi:type="array">
        <item name="js_config" xsi:type="array">
            <item name="provider" xsi:type="string">
                vendor_module_form.vendor_module_form_data_source
            </item>
        </item>
    </argument>
    <settings>
        <buttons>
            <button name="save" class="Vendor\Module\Block\Adminhtml\Edit\SaveButton"/>
        </buttons>
        <namespace>vendor_module_form</namespace>
        <dataScope>data</dataScope>
        <deps>
            <dep>vendor_module_form.vendor_module_form_data_source</dep>
        </deps>
    </settings>
    <dataSource name="vendor_module_form_data_source">
        <argument name="data" xsi:type="array">
            <item name="js_config" xsi:type="array">
                <item name="component" xsi:type="string">Magento_Ui/js/form/provider</item>
            </item>
        </argument>
        <settings>
            <submitUrl path="vendor_module/entity/save"/>
        </settings>
        <dataProvider class="Vendor\Module\Model\Entity\DataProvider"
                      name="vendor_module_form_data_source">
        </dataProvider>
    </dataSource>
    <fieldset name="general">
        <settings>
            <label translate="true">General</label>
        </settings>
        <field name="title" formElement="input">
            <settings>
                <label translate="true">Title</label>
                <validation>
                    <rule name="required-entry" xsi:type="boolean">true</rule>
                </validation>
            </settings>
        </field>
    </fieldset>
</form>
```

- **Exam focus:** UI Component forms require a **DataProvider** class extending `Magento\Ui\DataProvider\AbstractDataProvider`.
- **Exam focus:** The `<dataSource>` `name` attribute must match the `provider` value referenced elsewhere in the component.

---

### 3.7 JavaScript & RequireJS

**Defining a RequireJS module:**
```javascript
// view/frontend/web/js/my-component.js
define([
    'jquery',
    'Magento_Ui/js/lib/ko/initialize',
    'ko'
], function ($, koInit, ko) {
    'use strict';

    return function (config, element) {
        var self = this;
        self.message = ko.observable(config.message || 'Hello');

        $(element).text(self.message());
    };
});
```

**`requirejs-config.js` — aliasing and mapping:**
```javascript
// view/frontend/requirejs-config.js
var config = {
    map: {
        '*': {
            'myAlias': 'Vendor_Module/js/my-component'
        }
    },
    config: {
        mixins: {
            'Magento_Checkout/js/view/summary': {
                'Vendor_Module/js/mixin/summary-mixin': true
            }
        }
    },
    paths: {
        'externalLib': 'https://cdn.example.com/lib'
    },
    shim: {
        'externalLib': {
            deps: ['jquery'],
            exports: 'ExternalLib'
        }
    }
};
```

**Mixin example:**
```javascript
// view/frontend/web/js/mixin/summary-mixin.js
define(['mage/utils/wrapper'], function (wrapper) {
    'use strict';

    return function (targetModule) {
        targetModule.someMethod = wrapper.wrapSuper(
            targetModule.someMethod,
            function (original) {
                // before
                var result = original();
                // after
                return result;
            }
        );
        return targetModule;
    };
});
```

**x-magento-init (declarative widget binding):**
```html
<script type="text/x-magento-init">
{
    "#element-selector": {
        "Vendor_Module/js/my-widget": {
            "configKey": "configValue"
        }
    }
}
</script>
```

**data-mage-init (inline binding):**
```html
<div data-mage-init='{"Vendor_Module/js/my-widget": {"key": "value"}}'></div>
```

- **Exam focus:** `x-magento-init` vs `data-mage-init` — both bind JS components to DOM elements. `x-magento-init` uses CSS selectors as keys; `data-mage-init` is an inline attribute.
- **Exam focus:** `map` in `requirejs-config.js` creates **aliases**. `mixins` extend existing JS modules **non-destructively**.
- **Exam focus:** `shim` is used for **non-AMD** (legacy) JavaScript libraries that do not use `define()`.
- **Exam focus:** `paths` sets the URL or file path for a module ID — useful for CDN-hosted libraries.
- **Exam focus:** JS files in `view/frontend/web/js/` are served as `Vendor_Module/js/filename` in RequireJS.

---

### 3.8 Database — EAV, Setup Scripts & Declarative Schema

**Declarative schema (`db_schema.xml`):**
```xml
<!-- etc/db_schema.xml -->
<schema xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Setup/Declaration/Schema/etc/schema.xsd">
    <table name="vendor_module_entity" resource="default" engine="innodb"
           comment="Vendor Module Entity Table">
        <column xsi:type="int" name="entity_id" unsigned="true"
                nullable="false" identity="true" comment="Entity ID"/>
        <column xsi:type="varchar" name="title" nullable="false"
                length="255" comment="Title"/>
        <column xsi:type="timestamp" name="created_at" nullable="false"
                default="CURRENT_TIMESTAMP" comment="Created At"/>
        <constraint xsi:type="primary" referenceId="PRIMARY">
            <column name="entity_id"/>
        </constraint>
        <index referenceId="VENDOR_MODULE_ENTITY_TITLE" indexType="btree">
            <column name="title"/>
        </index>
    </table>
</schema>
```

**Data Patch:**
```php
<?php
namespace Vendor\Module\Setup\Patch\Data;

use Magento\Framework\Setup\Patch\DataPatchInterface;
use Magento\Framework\Setup\ModuleDataSetupInterface;

class AddDefaultData implements DataPatchInterface
{
    private ModuleDataSetupInterface $moduleDataSetup;

    public function __construct(ModuleDataSetupInterface $moduleDataSetup)
    {
        $this->moduleDataSetup = $moduleDataSetup;
    }

    public function apply(): void
    {
        $this->moduleDataSetup->startSetup();
        $this->moduleDataSetup->getConnection()->insert(
            $this->moduleDataSetup->getTable('vendor_module_entity'),
            ['title' => 'Default Entry']
        );
        $this->moduleDataSetup->endSetup();
    }

    public static function getDependencies(): array
    {
        return [];
    }

    public function getAliases(): array
    {
        return [];
    }
}
```

- **Exam focus:** `db_schema.xml` is **declarative** — Magento computes the diff between the current schema and the desired schema. You do **not** write ALTER TABLE statements.
- **Exam focus:** To roll back declarative schema, use `db_schema_whitelist.json` (generated by `bin/magento setup:db-declaration:generate-whitelist`).
- **Exam focus:** Data patches implement `DataPatchInterface`; schema patches implement `SchemaPatchInterface`. Both are in `Setup/Patch/Data/` and `Setup/Patch/Schema/` respectively.
- **Exam focus:** Patches run **once** and are tracked in the `patch_list` table — they are **not** re-run on subsequent deploys.

**EAV Quick Reference:**

| Concept | Detail |
|---------|--------|
| Entity types | `catalog_product`, `catalog_category`, `customer`, `customer_address` |
| Attribute storage | Split across `_entity`, `_entity_int`, `_entity_varchar`, etc. |
| `eav_attribute` | Master attribute definition table |
| `catalog_eav_attribute` | Catalog-specific attribute properties (frontend_input, etc.) |
| Adding attribute | Use `EavSetup::addAttribute()` in a Data Patch |

---

### 3.9 Service Contracts & Repositories

```
Interface (Api/)          Implementation (Model/)
     |                           |
     v                           v
ProductRepositoryInterface --> ProductRepository
     |
     v
Data Interface (Api/Data/)
     |
     v
ProductInterface --> Product (Model)
```

**Repository pattern:**
```php
<?php
// In a controller or model — use the interface, not the concrete class
public function __construct(
    \Magento\Catalog\Api\ProductRepositoryInterface $productRepository,
    \Magento\Framework\Api\SearchCriteriaBuilder $searchCriteriaBuilder
) {
    $this->productRepository = $productRepository;
    $this->searchCriteriaBuilder = $searchCriteriaBuilder;
}

public function getActiveProducts(): array
{
    $searchCriteria = $this->searchCriteriaBuilder
        ->addFilter('status', 1)
        ->addFilter('visibility', [2, 3, 4], 'in')
        ->setPageSize(10)
        ->setCurrentPage(1)
        ->create();

    $result = $this->productRepository->getList($searchCriteria);
    return $result->getItems();
}
```

- **Exam focus:** Always type-hint against the **interface** (`Api/`), never the concrete implementation.
- **Exam focus:** `SearchCriteriaBuilder` + `FilterBuilder` are the correct way to build filtered queries through service contracts.
- **Exam focus:** Service contracts provide a **stable API** that decouples modules — this is the correct integration point for third-party extensions.

---

### 3.10 ACL, Routing & Controllers

**`acl.xml`:**
```xml
<!-- etc/acl.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Acl/etc/acl.xsd">
    <acl>
        <resources>
            <resource id="Magento_Backend::admin">
                <resource id="Vendor_Module::menu"
                          title="Vendor Module"
                          translate="title"
                          sortOrder="100">
                    <resource id="Vendor_Module::entity"
                              title="Manage Entities"
                              translate="title"/>
                </resource>
            </resource>
        </resources>
    </acl>
</config>
```

**Admin controller:**
```php
<?php
namespace Vendor\Module\Controller\Adminhtml\Entity;

use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\View\Result\PageFactory;

class Index extends Action
{
    const ADMIN_RESOURCE = 'Vendor_Module::entity';

    private PageFactory $resultPageFactory;

    public function __construct(Context $context, PageFactory $resultPageFactory)
    {
        parent::__construct($context);
        $this->resultPageFactory = $resultPageFactory;
    }

    public function execute(): \Magento\Framework\View\Result\Page
    {
        $resultPage = $this->resultPageFactory->create();
        $resultPage->getConfig()->getTitle()->prepend(__('Manage Entities'));
        return $resultPage;
    }
}
```

**`routes.xml` (adminhtml):**
```xml
<!-- etc/adminhtml/routes.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:App/etc/routes.xsd">
    <router id="admin">
        <route id="vendor_module" frontName="vendor_module">
            <module name="Vendor_Module"/>
        </route>
    </router>
</config>
```

- **Exam focus:** Admin controllers extend `Magento\Backend\App\Action` and define `const ADMIN_RESOURCE` for automatic ACL checking.
- **Exam focus:** Frontend controllers extend `Magento\Framework\App\Action\Action` (Magento 2.3) or implement `HttpGetActionInterface` / `HttpPostActionInterface` (Magento 2.4+).
- **Exam focus:** URL structure: `frontName/controller_directory/action` maps to `Controller/ControllerDirectory/Action.php`.

---

### 3.11 Caching & Indexing

**Cache types:**

| Cache Type | ID | What it stores |
|------------|-----|----------------|
| Configuration | `config` | Merged XML configs |
| Layout | `layout` | Compiled layout XML |
| Block HTML | `block_html` | Rendered block output |
| Collections | `collections` | DB collection results |
| Reflection | `reflection` | PHP reflection data |
| DB DDL | `db_ddl` | Database schema |
| Compiled Config | `compiled_config` | DI compiled config |
| Full Page Cache | `full_page` | Entire page HTML |
| EAV | `eav` | EAV attribute metadata |
| Customer Sessions | `customer_notification` | Customer data |

**CLI commands:**
```bash
# Clear specific cache type
bin/magento cache:clean config layout block_html

# Flush entire cache storage
bin/magento cache:flush

# Enable/disable cache types
bin/magento cache:enable full_page
bin/magento cache:disable full_page

# Indexer commands
bin/magento indexer:reindex
bin/magento indexer:reindex cataloginventory_stock
bin/magento indexer:status
bin/magento indexer:set-mode schedule catalogsearch_fulltext
bin/magento indexer:set-mode realtime catalog_product_price
```

- **Exam focus:** `cache:clean` removes the cached data but leaves the cache storage intact. `cache:flush` destroys the entire cache storage (affects other apps sharing the same Redis/Memcached).
- **Exam focus:** Indexers in **schedule** mode update via cron. **Realtime** mode updates on every data save (slower for high-volume operations).
- **Exam focus:** Full Page Cache (FPC) is **Varnish** in production or the built-in PHP FPC in developer mode.

---

### 3.12 Admin Grids & UI Listing Components

**`vendor_module_listing.xml` structure:**
```xml
<listing>
    <argument name="data" xsi:type="array">...</argument>
    <settings>
        <spinner>vendor_module_listing_columns</spinner>
        <deps>
            <dep>vendor_module_listing.vendor_module_listing_data_source</dep>
        </deps>
    </settings>
    <dataSource name="vendor_module_listing_data_source"
                component="Magento_Ui/js/grid/provider">
        <settings>
            <storageConfig>
                <param name="indexField" xsi:type="string">entity_id</param>
            </storageConfig>
            <updateUrl path="mui/index/render"/>
        </settings>
        <aclResource>Vendor_Module::entity</aclResource>
        <dataProvider class="Magento\Framework\View\Element\UiComponent\DataProvider\DataProvider"
                      name="vendor_module_listing_data_source">
            <settings>
                <requestFieldName>id</requestFieldName>
                <primaryFieldName>entity_id</primaryFieldName>
            </settings>
        </dataProvider>
    </dataSource>
    <listingToolbar name="listing_top">
        <settings>
            <sticky>true</sticky>
        </settings>
        <bookmark name="bookmarks"/>
        <columnsControls name="columns_controls"/>
        <filterSearch name="fulltext"/>
        <filters name="listing_filters"/>
        <paging name="listing_paging"/>
    </listingToolbar>
    <columns name="vendor_module_listing_columns">
        <column name="entity_id" sortOrder="10">
            <settings>
                <filter>textRange</filter>
                <label translate="true">ID</label>
                <sorting>asc</sorting>
            </settings>
        </column>
        <column name="title" sortOrder="20">
            <settings>
                <filter>text</filter>
                <label translate="true">Title</label>
            </settings>
        </column>
        <actionsColumn name="actions"
                       class="Vendor\Module\Ui\Component\Listing\Column\Actions"
                       sortOrder="100">
            <settings>
                <indexField>entity_id</indexField>
            </settings>
        </actionsColumn>
    </columns>
</listing>
```

- **Exam focus:** Grid data source requires a **collection** registered in `di.xml` as a `DataProvider` collection.
- **Exam focus:** `actionsColumn` requires a custom PHP class extending `Magento\Ui\Component\Listing\Columns\Column` that overrides `prepareDataSource()`.

---

### 3.13 Command-Line & Deployment Modes

**Deployment modes:**

| Mode | Use Case | Error Display | Cache |
|------|----------|--------------|-------|
| `default` | Initial install only | Some errors hidden | Partially enabled |
| `developer` | Active development | Full errors shown | Disabled by default |
| `production` | Live environment | Errors hidden | Fully enabled |

```bash
# Switch modes
bin/magento deploy:mode:set developer
bin/magento deploy:mode:set production

# Check current mode
bin/magento deploy:mode:show

# Static content deploy (required for production)
bin/magento setup:static-content:deploy en_US
bin/magento setup:static-content:deploy en_US -f  # force in developer mode

# DI compilation
bin/magento setup:di:compile

# Full production deploy sequence
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento setup:static-content:deploy en_US
bin/magento cache:flush
```

- **Exam focus:** In **production** mode, static files are **not** generated on the fly — you must run `setup:static-content:deploy` explicitly.
- **Exam focus:** `setup:di:compile` generates the `generated/` directory contents including interceptors (plugins) and factory classes.
- **Exam focus:** `setup:upgrade` runs new data patches and schema patches and updates the module version registry.

---

### 3.14 Testing

**Unit test example:**
```php
<?php
namespace Vendor\Module\Test\Unit\Model;

use PHPUnit\Framework\TestCase;
use Magento\Framework\TestFramework\Unit\Helper\ObjectManager;

class MyModelTest extends TestCase
{
    private \Vendor\Module\Model\MyModel $model;

    protected function setUp(): void
    {
        $objectManager = new ObjectManager($this);
        $this->model = $objectManager->getObject(
            \Vendor\Module\Model\MyModel::class,
            [
                'dependency' => $this->createMock(\Some\Dependency::class)
            ]
        );
    }

    public function testGetValue(): void
    {
        $this->assertEquals('expected', $this->model->getValue());
    }
}
```

**Test locations:**

| Test Type | Location | Command |
|-----------|----------|---------|
| Unit | `Test/Unit/` | `vendor/bin/phpunit` |
| Integration | `Test/Integration/` | `vendor/bin/phpunit` (special config) |
| Functional | `dev/tests/functional/` | Magento FTF / MFTF |
| API (WebAPI) | `dev/tests/api-functional/` | PHPUnit with API config |

- **Exam focus:** Unit tests use `ObjectManager` helper and mocks — they **do not** hit the database.
- **Exam focus:** Integration tests use the real Magento bootstrap and **do** hit the test database.
- **Exam focus:** Test file naming: `{ClassName}Test.php` in a `Test/Unit/` mirror of the source structure.

---

## 4. Commonly Missed Topics — Quick Corrections

> These are the topics that **most often trip up candidates** in practice tests. Read each carefully.

### Plugin Execution Order

```
Multiple plugins on the same method:

sortOrder 10 (before) --> sortOrder 20 (before) --> Original Method
                                                          |
                                                          v
sortOrder 20 (after)  <-- sortOrder 10 (after)  <-- Result

For around plugins: lower sortOrder wraps outer layer
```

- Before plugins: lowest `sortOrder` fires **first**
- After plugins: lowest `sortOrder` fires **last** (innermost)
- Around plugins: lowest `sortOrder` is the **outermost** wrapper

### Layout Handle Naming

```
Route:      catalog
Controller: product
Action:     view

Handle = catalog_product_view
File   = catalog_product_view.xml
```

### `@api` Annotation Meaning

- Classes/interfaces marked `@api` are part of the **public API** — safe to depend on
- Classes **without** `@api` are internal and may change between versions
- **Exam focus:** Prefer depending on `@api`-annotated interfaces

### Cron Job Registration

```xml
<!-- etc/crontab.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Cron:etc/crontab.xsd">
    <group id="default">
        <job name="vendor_module_cleanup"
             instance="Vendor\Module\Cron\Cleanup"
             method="execute">
            <schedule>0 2 * * *</schedule>
        </job>
    </group>
</config>
```

- **Exam focus:** Cron job class does **not** need to implement any interface — it just needs the method specified in `method=""`.
- **Exam focus:** Cron groups: `default`, `index`, `catalog_event`, `staging` — `default` runs every minute by default.

### Config XML Scope

```
System Config scope hierarchy:
  Default --> Website --> Store View

More specific scope OVERRIDES less specific scope.
```

**`system.xml` field:**
```xml
<field id="enabled" type="select" sortOrder="10" showInDefault="1"
       showInWebsite="1" showInStore="1">
    <label>Enabled</label>
    <source_model>Magento\Config\Model\Config\Source\Yesno</source_model>
</field>
```

- **Exam focus:** `showInDefault="1" showInWebsite="1" showInStore="1"` controls where the config field appears — it does **not** restrict who can override it.

---

## 5. Exam Logistics Checklist

```
+--------------------------------------------------+
|          EXAM DAY LOGISTICS                      |
+--------------------------------------------------+
| Date:     April 3, 2026                          |
| Time:     8:20 AM                                |
| Platform: Pearson VUE (Online Proctoring)        |
+--------------------------------------------------+

PRE-EXAM (tonight):
[ ] Confirm appointment in Pearson VUE account
[ ] Verify valid government-issued photo ID is ready
[ ] Test your webcam, microphone, and internet speed
[ ] Clear your desk of all papers, books, devices
[ ] Close all non-essential apps / browser tabs
[ ] Download/update OnVUE testing software if required
[ ] Check Pearson VUE system requirements at home.pearsonvue.com
[ ] Set TWO alarms for the morning

EXAM SPACE SETUP:
[ ] Single monitor only (or laptop screen only)
[ ] Good lighting — proctor must see your face clearly
[ ] Quiet room — no other people or pets during exam
[ ] Phone out of arm's reach (proctor requirement)
[ ] Clean desk — only allowed items (water if permitted)
[ ] Stable internet connection (ethernet preferred over WiFi)

MORNING OF EXAM:
[ ] Wake up by 7:00 AM (gives 1h 20min buffer)
[ ] Eat a real breakfast
[ ] Review NOTHING new — only skim cheat sheet briefly
[ ] Log in to Pearson VUE by 8:00 AM (20 min early)
[ ] Check-in process starts 30 min before exam time
```

---

## 6. Exam Day Timeline

```
TIME          ACTION
----          ------
7:00 AM  -->  Wake up, breakfast, light stretch
7:30 AM  -->  Quick skim of cheat sheet (10 min only)
7:45 AM  -->  Set up exam space, close all other apps
8:00 AM  -->  Log in to Pearson VUE, begin check-in
8:10 AM  -->  Identity verification with proctor
8:20 AM  -->  EXAM BEGINS
              (~60 questions, 90 minutes)
              [~90 seconds per question]
9:50 AM  -->  Expected exam end
10:00 AM -->  Provisional score displayed on screen
```

### During the Exam — Strategy

```
+--------------------------------------------------+
|           EXAM STRATEGY REMINDERS               |
+--------------------------------------------------+
| 1. Read the full question before looking at      |
|    answer choices                                |
|                                                  |
| 2. Eliminate obviously wrong answers first       |
|                                                  |
| 3. "Best answer" questions: pick Magento's        |
|    recommended pattern, not what "works"         |
|                                                  |
| 4. Flag uncertain questions — never sit on one   |
|    for more than 2 minutes                       |
|                                                  |
| 5. If two answers seem correct: pick the one     |
|    that uses interfaces / service contracts      |
|                                                  |
| 6. Trust your first instinct on 50/50 choices    |
|    — overthinking hurts more than it helps       |
|                                                  |
| 7. Reserve last 10 minutes to review flagged Qs  |
+--------------------------------------------------+
```

---

## 7. Mental Preparation & Confidence Framework

### What Three Weeks of Preparation Means

```
Week 1: Foundation
  - Module structure, registration, DI, plugins
  - Layouts, blocks, templates, routing
  - Estimated effort: ~15-20 hours

Week 2: Intermediate
  - EAV, repositories, service contracts
  - Admin UI, ACL, caching, indexing
  - Estimated effort: ~15-20 hours

Week 3: Advanced + Refinement
  - JavaScript, RequireJS, mixins, UI components
  - Admin grids, optimization, deployment
  - Estimated effort: ~15-20 hours

Total: ~45-60 hours of focused preparation
That is MORE than most candidates invest.
```

### The "Confidence Equation"

```
Exam Score = Knowledge + Recall + Confidence - Fatigue

You can no longer improve Knowledge tonight.
You CAN control Confidence and Fatigue.

Best ROI tonight: SLEEP.
```

### Common Exam Anxiety Traps — Avoid These

| Trap | Why It Hurts | What to Do Instead |
|------|-------------|-------------------|
| Late-night cramming | Creates fatigue, reduces recall | Stop studying by 9 PM |
| Learning new material | Causes confusion with existing knowledge | Review only; nothing new |
| Catastrophizing | Increases cortisol, impairs memory | Remember: you can retake |
| Skipping breakfast | Blood sugar crash during exam | Eat a solid meal |
| Arriving (logging in) late | Adds panic to the first questions | Log in 20 min early |

> **Remember:** A passing score means answering approximately 7 out of 10 questions correctly. You do not need to be perfect — you need to be **consistently good**.

---

## Quick-Reference Checklist

> Everything testable — your final scan before sleep.

### Module Structure
- [ ] `registration.php` + `etc/module.xml` are required for every module
- [ ] `<sequence>` = load order, not hard dependency
- [ ] `setup_version` = legacy; use patches for new code

### Dependency Injection
- [ ] `<preference>` = swap entire class
- [ ] `<virtualType>` = named instance, no new PHP file
- [ ] `<plugin>` = intercept methods non-destructively
- [ ] `shared="false"` = new instance every request
- [ ] Never use `ObjectManager` directly in production code

### Plugins
- [ ] `before` returns `array` or `null`; modifies arguments
- [ ] `after` receives `$result`; modifies return value
- [ ] `around` receives `$proceed`; must call `$proceed()` or bypass
- [ ] Cannot apply to: `final`, `__construct`, `static`, non-public methods
- [ ] `sortOrder` = lower fires first for `before`, last for `after`

### Events & Observers
- [ ] Observer implements `ObserverInterface::execute(Observer $observer)`
- [ ] `etc/events.xml` = global; `etc/frontend/events.xml` = frontend only
- [ ] Events = side effects; Plugins = modifying return values

### Layouts & Blocks
- [ ] `before="-"` = first; `after="-"` = last
- [ ] `<referenceBlock>` = modify existing; `<block>` = create new
- [ ] Always escape output: `escapeHtml()`, `escapeUrl()`, `escapeJs()`
- [ ] Layout handle = `routeId_controllerFolder_actionName`

### JavaScript
- [ ] `define([deps], function(){})` = AMD module definition
- [ ] `requirejs-config.js` = map aliases, mixins, paths, shims
- [ ] `map` = aliases; `mixins` = extend existing JS; `shim` = legacy libs
- [ ] `x-magento-init` = CSS selector keys; `data-mage-init` = inline attribute
- [ ] JS path: `view/frontend/web/js/file.js` → RequireJS ID: `Vendor_Module/js/file`

### Database
- [ ] `db_schema.xml` = declarative, no ALTER TABLE needed
- [ ] `db_schema_whitelist.json` = required for rollback
- [ ] Data patches implement `DataPatchInterface`, run once only
- [ ] EAV splits data across type-specific tables (`_varchar`, `_int`, etc.)

### Service Contracts
- [ ] Always inject **interfaces**, not concrete classes
- [ ] `Api/` = interfaces; `Api/Data/` = data interfaces; `Model/` = implementations
- [ ] `SearchCriteriaBuilder` = correct way to filter repository queries
- [ ] `@api` annotation = stable, safe to depend on

### ACL & Controllers
- [ ] Admin controller extends `Magento\Backend\App\Action`
- [ ] `const ADMIN_RESOURCE` = automatic ACL check
- [ ] Frontend 2.4+: implement `HttpGetActionInterface` or `HttpPostActionInterface`
- [ ] URL: `frontName/ControllerDir/Action` → `Controller/ControllerDir/Action.php`

### Caching & Indexing
- [ ] `cache:clean` = remove data; `cache:flush` = destroy storage
- [ ] `full_page` cache = Varnish (production) or built-in PHP FPC
- [ ] Indexer schedule = cron-based; realtime = on every save
- [ ] `block_html` cache type = rendered block output

### Admin Grid (UI Listing)
- [ ] Requires DataProvider + collection registered in `di.xml`
- [ ] `actionsColumn` class extends `Magento\Ui\Component\Listing\Columns\Column`
- [ ] Override `prepareDataSource()` to inject action URLs

### Deployment
- [ ] **Production deploy order:** `setup:upgrade` → `setup:di:compile` → `setup:static-content:deploy` → `cache:flush`
- [ ] Static files NOT auto-generated in production mode
- [ ] `setup:di:compile` generates interceptors and factories in `generated/`
- [ ] `setup:upgrade` runs patches and updates module versions

### Testing
- [ ] Unit tests: mocks + `ObjectManager` helper, no database
- [ ] Integration tests: real Magento bootstrap, test database
- [ ] Test file location: `Test/Unit/` mirrors source structure

### Cron
- [ ] Registered in `etc/crontab.xml`, group `default`
- [ ] Cron class needs no interface — just the method defined in XML
- [ ] Schedule uses standard cron expression (`0 2 * * *`)

### Config Scopes
- [ ] Hierarchy: Default → Website → Store View (more specific wins)
- [ ] `showInDefault/Website/Store` = display only, not override restriction

---

```
+--------------------------------------------------+
|                                                  |
|   You have prepared for 20 days.                 |
|   You know this material.                        |
|   Get some sleep.                                |
|   Go pass this exam tomorrow.                    |
|                                                  |
|   Exam: April 3, 2026 at 8:20 AM                |
|   Log in by: 8:00 AM                            |
|   Good luck — you've earned it.                  |
|                                                  |
+--------------------------------------------------+
```
