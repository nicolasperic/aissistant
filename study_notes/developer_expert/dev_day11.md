# Day 11 — Admin Panel Customization

## Table of Contents
1. [Overview](#1-overview)
2. [Admin Routing](#2-admin-routing)
3. [ACL — Access Control Lists](#3-acl--access-control-lists)
4. [UI Components: XML Declaration Fundamentals](#4-ui-components-xml-declaration-fundamentals)
5. [Custom Admin Grid](#5-custom-admin-grid)
6. [Custom Admin Form](#6-custom-admin-form)
7. [Magento UI Components JS Layer](#7-magento-ui-components-js-layer)
8. [Admin Notifications and In-Admin Messaging](#8-admin-notifications-and-in-admin-messaging)
9. [Practical Example: Minimal Custom Admin Grid](#9-practical-example-minimal-custom-admin-grid)
10. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Overview

Magento 2's admin panel is built on a combination of:

| Layer | Technology |
|---|---|
| Routing | `routes.xml` + PHP Controller |
| Access Control | `acl.xml` + `_isAllowed()` |
| UI Layout | XML layout files (`*.xml`) |
| UI Components | XML `ui_component` definition files |
| JS Behaviour | `@magento/ui-components` (KnockoutJS + RequireJS) |
| Data | PHP `DataProvider` / Collection |

The flow for a typical admin page is:

```
Browser Request
     |
     v
routes.xml  -->  Controller (Action)  -->  Layout XML
                                                |
                                                v
                                       ui_component XML
                                       (grid or form)
                                                |
                                                v
                                       DataProvider / Collection
                                                |
                                                v
                                          JSON response
                                          (AJAX reload)
```

**Exam focus:**
- The admin area uses the `adminhtml` area, not `frontend`
- UI components are declared in `view/adminhtml/ui_component/` (not layout)
- Layout files live in `view/adminhtml/layout/`

---

## 2. Admin Routing

### 2.1 `routes.xml`

Located at: `<Module>/etc/adminhtml/routes.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:App/etc/routes.xsd">
    <router id="admin">
        <route id="vendor_module" frontName="vendor_module">
            <module name="Vendor_Module" />
        </route>
    </router>
</config>
```

Key attributes:
- `router id="admin"` — must be `admin` for adminhtml routes
- `frontName` — the URL segment: `<base_url>/admin/vendor_module/...`
- `route id` — used internally; should be unique

### 2.2 Controller Structure

URL pattern: `<frontName>/<controller_folder>/<action_class>`

```
Vendor_Module/Controller/Adminhtml/Entity/Index.php
```

maps to: `/admin/vendor_module/entity/index`

```php
<?php
namespace Vendor\Module\Controller\Adminhtml\Entity;

use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\View\Result\PageFactory;

class Index extends Action
{
    // ACL resource this action requires
    const ADMIN_RESOURCE = 'Vendor_Module::entity_manage';

    protected PageFactory $resultPageFactory;

    public function __construct(Context $context, PageFactory $resultPageFactory)
    {
        parent::__construct($context);
        $this->resultPageFactory = $resultPageFactory;
    }

    public function execute()
    {
        $resultPage = $this->resultPageFactory->create();
        $resultPage->setActiveMenu('Vendor_Module::entity_manage');
        $resultPage->getConfig()->getTitle()->prepend(__('My Entities'));
        return $resultPage;
    }
}
```

### 2.3 Controller ACL Enforcement

Two mechanisms work together:

1. **`const ADMIN_RESOURCE`** — declared on the controller class; Magento's `AbstractAction` automatically calls `_isAllowed()` which checks this constant against the logged-in admin user's role permissions.
2. **`_isAllowed()`** — can be overridden for custom logic:

```php
protected function _isAllowed(): bool
{
    return $this->_authorization->isAllowed(static::ADMIN_RESOURCE);
}
```

**Exam focus:**
- `ADMIN_RESOURCE` constant on an `Adminhtml` controller is the standard ACL check mechanism
- `Magento\Backend\App\Action` (not `Magento\Framework\App\Action\Action`) must be used for admin controllers
- If `_isAllowed()` returns `false`, Magento redirects to the dashboard with a "403 Forbidden" message

---

## 3. ACL — Access Control Lists

### 3.1 `acl.xml`

Located at: `<Module>/etc/acl.xml`

This file declares the **resource tree** — the hierarchy of permissions available in Admin > System > Roles.

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Acl/etc/acl.xsd">
    <acl>
        <resources>
            <resource id="Magento_Backend::admin">
                <!-- Top-level parent under the admin root -->
                <resource id="Vendor_Module::root"
                          title="Vendor Module"
                          sortOrder="100">
                    <!-- Child permission -->
                    <resource id="Vendor_Module::entity_manage"
                              title="Manage Entities"
                              sortOrder="10" />
                    <resource id="Vendor_Module::entity_delete"
                              title="Delete Entities"
                              sortOrder="20" />
                    <resource id="Vendor_Module::config"
                              title="Configuration"
                              sortOrder="30" />
                </resource>
            </resource>
        </resources>
    </acl>
</config>
```

### 3.2 Resource Tree Hierarchy

```
Magento_Backend::admin
    |
    +-- Vendor_Module::root          (shown as menu group)
            |
            +-- Vendor_Module::entity_manage
            +-- Vendor_Module::entity_delete
            +-- Vendor_Module::config
```

### 3.3 Checking ACL Programmatically

```php
// In a controller (inherits from Backend\App\Action)
$this->_authorization->isAllowed('Vendor_Module::entity_delete');

// In a Block
$this->_isAllowed('Vendor_Module::entity_delete');

// Via the Authorization object directly
/** @var \Magento\Framework\AuthorizationInterface $authorization */
$authorization->isAllowed('Vendor_Module::entity_manage');
```

### 3.4 ACL in Menu (`menu.xml`)

The `resource` attribute on a menu item controls visibility:

```xml
<add id="Vendor_Module::entity"
     title="Entities"
     module="Vendor_Module"
     sortOrder="10"
     parent="Vendor_Module::root"
     action="vendor_module/entity/index"
     resource="Vendor_Module::entity_manage" />
```

**Exam focus:**
- `acl.xml` is merged across all modules at runtime; resource IDs must be globally unique
- The ACL resource ID format is `Vendor_Module::identifier` — always namespaced
- Roles & permissions are stored in the `authorization_role` and `authorization_rule` database tables
- Adding a new `acl.xml` resource requires no cache clearing for it to appear in Role Resources UI (but requires `bin/magento setup:upgrade` if the module is new)

---

## 4. UI Components: XML Declaration Fundamentals

### 4.1 What Is a UI Component?

A UI Component is a **reusable PHP + JS + XML combination** that renders admin UI elements. The XML definition file lives in:

```
<Module>/view/adminhtml/ui_component/<component_name>.xml
```

### 4.2 Core Components Hierarchy

```
listing (grid)
    +-- dataSource
    +-- listingToolbar
    |       +-- bookmark
    |       +-- columnsControls
    |       +-- filters
    |       +-- search
    |       +-- massaction
    |       +-- paging
    +-- columns
            +-- column (field)
            +-- actionsColumn

form
    +-- dataSource
    +-- fieldset
            +-- field
            +-- field (type="select", "textarea", etc.)
```

### 4.3 Basic `listing` XML Skeleton

```xml
<?xml version="1.0" encoding="UTF-8"?>
<listing xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Ui:etc/ui_configuration.xsd">

    <argument name="data" xsi:type="array">
        <item name="js_config" xsi:type="array">
            <item name="provider" xsi:type="string">
                vendor_module_entity_listing.vendor_module_entity_listing_data_source
            </item>
        </item>
    </argument>

    <settings>
        <spinner>vendor_module_entity_columns</spinner>
        <deps>
            <dep>vendor_module_entity_listing.vendor_module_entity_listing_data_source</dep>
        </deps>
    </settings>

    <!-- ... dataSource, listingToolbar, columns ... -->
</listing>
```

### 4.4 Basic `form` XML Skeleton

```xml
<?xml version="1.0" encoding="UTF-8"?>
<form xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Ui:etc/ui_configuration.xsd">

    <argument name="data" xsi:type="array">
        <item name="js_config" xsi:type="array">
            <item name="provider" xsi:type="string">
                vendor_module_entity_form.vendor_module_entity_form_data_source
            </item>
        </item>
    </argument>

    <settings>
        <namespace>vendor_module_entity_form</namespace>
        <dataScope>data</dataScope>
        <deps>
            <dep>vendor_module_entity_form.vendor_module_entity_form_data_source</dep>
        </deps>
    </settings>

    <!-- dataSource, fieldset blocks follow -->
</form>
```

**Exam focus:**
- The `provider` value format is: `<ui_component_name>.<data_source_name>` — this is a **fully-qualified component name** used internally by KnockoutJS
- `spinner` points to the columns component — the grid won't show a loading spinner without this
- `<deps>` causes the listing to wait for data source initialization before rendering

---

## 5. Custom Admin Grid

### 5.1 File Structure Overview

```
Vendor/Module/
    etc/
        adminhtml/
            routes.xml
            menu.xml
        di.xml
        acl.xml
    Controller/
        Adminhtml/
            Entity/
                Index.php
    Ui/
        DataProvider/
            Entity/
                ListingDataProvider.php
    view/
        adminhtml/
            layout/
                vendor_module_entity_index.xml
            ui_component/
                vendor_module_entity_listing.xml
```

### 5.2 Data Provider

```php
<?php
namespace Vendor\Module\Ui\DataProvider\Entity;

use Magento\Ui\DataProvider\AbstractDataProvider;
use Vendor\Module\Model\ResourceModel\Entity\CollectionFactory;

class ListingDataProvider extends AbstractDataProvider
{
    public function __construct(
        string $name,
        string $primaryFieldName,
        string $requestFieldName,
        CollectionFactory $collectionFactory,
        array $meta = [],
        array $data = []
    ) {
        parent::__construct($name, $primaryFieldName, $requestFieldName, $meta, $data);
        $this->collection = $collectionFactory->create();
    }

    public function getData(): array
    {
        if (!$this->getCollection()->isLoaded()) {
            $this->getCollection()->load();
        }

        $items = $this->getCollection()->toArray();

        return [
            'totalRecords' => $this->getCollection()->getSize(),
            'items'        => array_values($items['items'] ?? $items),
        ];
    }
}
```

### 5.3 Registering the Data Provider in `di.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">

    <!-- Register collection for the data provider -->
    <virtualType name="Vendor\Module\Ui\DataProvider\Entity\ListingDataProvider"
                 type="Magento\Framework\View\Element\UiComponent\DataProvider\DataProvider">
        <arguments>
            <argument name="collection" xsi:type="object"
                      shared="false">Vendor\Module\Model\ResourceModel\Entity\Collection</argument>
            <argument name="filterPool" xsi:type="object"
                      shared="false">VendorModuleEntityListingFilterPool</argument>
        </arguments>
    </virtualType>

    <!-- Register the reporting collection -->
    <type name="Magento\Framework\View\Element\UiComponent\DataProvider\CollectionFactory">
        <arguments>
            <argument name="collections" xsi:type="array">
                <item name="vendor_module_entity_listing_data_source"
                      xsi:type="string">Vendor\Module\Model\ResourceModel\Entity\Grid\Collection</item>
            </argument>
        </arguments>
    </type>

</config>
```

> **Note:** The collection name key (`vendor_module_entity_listing_data_source`) must match the `<dataSource name="...">` in the UI component XML.

### 5.4 Grid Collection (Reporting Collection)

For filtering/sorting to work properly, use a reporting collection:

```php
<?php
namespace Vendor\Module\Model\ResourceModel\Entity\Grid;

use Magento\Framework\View\Element\UiComponent\DataProvider\SearchResult;

class Collection extends SearchResult
{
    protected function _initSelect(): static
    {
        parent::_initSelect();
        // Add any joins or additional columns here
        return $this;
    }
}
```

### 5.5 Full Grid UI Component XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<listing xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Ui:etc/ui_configuration.xsd">

    <argument name="data" xsi:type="array">
        <item name="js_config" xsi:type="array">
            <item name="provider" xsi:type="string">
                vendor_module_entity_listing.vendor_module_entity_listing_data_source
            </item>
        </item>
    </argument>

    <settings>
        <spinner>vendor_module_entity_columns</spinner>
        <deps>
            <dep>vendor_module_entity_listing.vendor_module_entity_listing_data_source</dep>
        </deps>
    </settings>

    <!-- Data Source -->
    <dataSource name="vendor_module_entity_listing_data_source"
                component="Magento_Ui/js/grid/provider">
        <settings>
            <storageConfig>
                <param name="indexField" xsi:type="string">entity_id</param>
            </storageConfig>
            <updateUrl path="mui/index/render" />
        </settings>
        <aclResource>Vendor_Module::entity_manage</aclResource>
        <dataProvider class="Vendor\Module\Ui\DataProvider\Entity\ListingDataProvider"
                      name="vendor_module_entity_listing_data_source">
            <settings>
                <requestFieldName>id</requestFieldName>
                <primaryFieldName>entity_id</primaryFieldName>
            </settings>
        </dataProvider>
    </dataSource>

    <!-- Toolbar -->
    <listingToolbar name="listing_top">
        <settings>
            <sticky>true</sticky>
        </settings>

        <!-- Bookmarks (save/load column state) -->
        <bookmark name="bookmarks" />

        <!-- Column visibility toggle -->
        <columnsControls name="columns_controls" />

        <!-- Filters -->
        <filters name="listing_filters">
            <settings>
                <templates>
                    <filters>
                        <select>
                            <param name="template" xsi:type="string">ui/grid/filters/elements/ui-select</param>
                            <param name="component" xsi:type="string">Magento_Ui/js/form/element/ui-select</param>
                        </select>
                    </filters>
                </templates>
            </settings>
        </filters>

        <!-- Mass Actions -->
        <massaction name="listing_massaction">
            <action name="delete">
                <settings>
                    <confirm>
                        <message translate="true">Are you sure you want to delete the selected items?</message>
                        <title translate="true">Delete items</title>
                    </confirm>
                    <url path="vendor_module/entity/massDelete" />
                    <type>delete</type>
                    <label translate="true">Delete</label>
                </settings>
            </action>
        </massaction>

        <!-- Paging -->
        <paging name="listing_paging" />
    </listingToolbar>

    <!-- Columns -->
    <columns name="vendor_module_entity_columns">
        <!-- Checkbox column for mass actions -->
        <selectionsColumn name="ids">
            <settings>
                <indexField>entity_id</indexField>
            </settings>
        </selectionsColumn>

        <column name="entity_id">
            <settings>
                <filter>textRange</filter>
                <label translate="true">ID</label>
                <sorting>asc</sorting>
            </settings>
        </column>

        <column name="title">
            <settings>
                <filter>text</filter>
                <editor>
                    <editorType>text</editorType>
                </editor>
                <label translate="true">Title</label>
            </settings>
        </column>

        <column name="status">
            <settings>
                <filter>select</filter>
                <options class="Vendor\Module\Model\Source\Status" />
                <dataType>select</dataType>
                <label translate="true">Status</label>
            </settings>
        </column>

        <column name="created_at" class="Magento\Ui\Component\Listing\Columns\Date"
                component="Magento_Ui/js/grid/columns/date">
            <settings>
                <filter>dateRange</filter>
                <dataType>date</dataType>
                <label translate="true">Created At</label>
            </settings>
        </column>

        <!-- Actions Column -->
        <actionsColumn name="actions"
                       class="Vendor\Module\Ui\Component\Listing\Column\EntityActions">
            <settings>
                <indexField>entity_id</indexField>
                <resizeDefaultWidth>107</resizeDefaultWidth>
                <resizeEnabled>false</resizeEnabled>
            </settings>
        </actionsColumn>
    </columns>

</listing>
```

### 5.6 Actions Column PHP Class

```php
<?php
namespace Vendor\Module\Ui\Component\Listing\Column;

use Magento\Framework\UrlInterface;
use Magento\Framework\View\Element\UiComponent\ContextInterface;
use Magento\Framework\View\Element\UiComponentFactory;
use Magento\Ui\Component\Listing\Columns\Column;

class EntityActions extends Column
{
    public function __construct(
        ContextInterface $context,
        UiComponentFactory $uiComponentFactory,
        private readonly UrlInterface $urlBuilder,
        array $components = [],
        array $data = []
    ) {
        parent::__construct($context, $uiComponentFactory, $components, $data);
    }

    public function prepareDataSource(array $dataSource): array
    {
        if (isset($dataSource['data']['items'])) {
            foreach ($dataSource['data']['items'] as &$item) {
                $item[$this->getData('name')] = [
                    'edit' => [
                        'href'  => $this->urlBuilder->getUrl(
                            'vendor_module/entity/edit',
                            ['id' => $item['entity_id']]
                        ),
                        'label' => __('Edit'),
                    ],
                    'delete' => [
                        'href'    => $this->urlBuilder->getUrl(
                            'vendor_module/entity/delete',
                            ['id' => $item['entity_id']]
                        ),
                        'label'   => __('Delete'),
                        'confirm' => [
                            'title'   => __('Delete Entity'),
                            'message' => __('Are you sure you want to delete this entity?'),
                        ],
                        'post' => true,
                    ],
                ];
            }
        }
        return $dataSource;
    }
}
```

### 5.7 Bookmarks

Bookmarks save the grid state (column visibility, sorting, page size) per admin user:

```xml
<!-- Inside listingToolbar -->
<bookmark name="bookmarks" />
```

- Stored in `ui_bookmark` database table
- Keyed by `namespace` (UI component name) + `identifier` + `user_id`
- The JS component is `Magento_Ui/js/grid/controls/bookmarks/bookmarks`

**Exam focus:**
- `<selectionsColumn>` provides the checkbox; mass actions won't work without it
- The `<dataSource name="...">` name must exactly match the key registered in `di.xml` `CollectionFactory` collections array
- `<bookmark>` component stores state per-user in the `ui_bookmark` table
- Filter types: `text`, `textRange`, `select`, `dateRange`

---

## 6. Custom Admin Form

### 6.1 Form Data Provider

```php
<?php
namespace Vendor\Module\Ui\DataProvider\Entity;

use Magento\Ui\DataProvider\AbstractDataProvider;
use Vendor\Module\Model\ResourceModel\Entity\CollectionFactory;

class FormDataProvider extends AbstractDataProvider
{
    private array $loadedData = [];

    public function __construct(
        string $name,
        string $primaryFieldName,
        string $requestFieldName,
        CollectionFactory $collectionFactory,
        array $meta = [],
        array $data = []
    ) {
        parent::__construct($name, $primaryFieldName, $requestFieldName, $meta, $data);
        $this->collection = $collectionFactory->create();
    }

    public function getData(): array
    {
        if (!empty($this->loadedData)) {
            return $this->loadedData;
        }

        foreach ($this->collection->getItems() as $entity) {
            $this->loadedData[$entity->getId()] = $entity->getData();
        }

        return $this->loadedData;
    }
}
```

### 6.2 Full Form UI Component XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<form xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Ui:etc/ui_configuration.xsd">

    <argument name="data" xsi:type="array">
        <item name="js_config" xsi:type="array">
            <item name="provider" xsi:type="string">
                vendor_module_entity_form.vendor_module_entity_form_data_source
            </item>
        </item>
        <item name="label" xsi:type="string" translate="true">Entity Information</item>
        <item name="template" xsi:type="string">templates/form/collapsible</item>
    </argument>

    <settings>
        <namespace>vendor_module_entity_form</namespace>
        <dataScope>data</dataScope>
        <deps>
            <dep>vendor_module_entity_form.vendor_module_entity_form_data_source</dep>
        </deps>
    </settings>

    <!-- Data Source -->
    <dataSource name="vendor_module_entity_form_data_source">
        <argument name="data" xsi:type="array">
            <item name="js_config" xsi:type="array">
                <item name="component" xsi:type="string">Magento_Ui/js/form/provider</item>
            </item>
        </argument>
        <settings>
            <submitUrl path="vendor_module/entity/save" />
        </settings>
        <dataProvider class="Vendor\Module\Ui\DataProvider\Entity\FormDataProvider"
                      name="vendor_module_entity_form_data_source">
            <settings>
                <requestFieldName>id</requestFieldName>
                <primaryFieldName>entity_id</primaryFieldName>
            </settings>
        </dataProvider>
    </dataSource>

    <!-- Fieldset: General -->
    <fieldset name="general">
        <settings>
            <collapsible>false</collapsible>
            <label translate="true">General Information</label>
        </settings>

        <!-- Hidden ID field -->
        <field name="entity_id" formElement="hidden">
            <settings>
                <dataType>text</dataType>
            </settings>
        </field>

        <!-- Text field -->
        <field name="title" sortOrder="10" formElement="input">
            <settings>
                <dataType>text</dataType>
                <label translate="true">Title</label>
                <dataScope>title</dataScope>
                <validation>
                    <rule name="required-entry" xsi:type="boolean">true</rule>
                    <rule name="max_text_length" xsi:type="number">255</rule>
                </validation>
            </settings>
        </field>

        <!-- Select / Dropdown -->
        <field name="status" sortOrder="20" formElement="select">
            <settings>
                <dataType>select</dataType>
                <label translate="true">Status</label>
                <dataScope>status</dataScope>
            </settings>
            <formElements>
                <select>
                    <settings>
                        <options class="Vendor\Module\Model\Source\Status" />
                    </settings>
                </select>
            </formElements>
        </field>

        <!-- Textarea -->
        <field name="description" sortOrder="30" formElement="textarea">
            <settings>
                <dataType>text</dataType>
                <label translate="true">Description</label>
                <dataScope>description</dataScope>
            </settings>
        </field>

        <!-- Date picker -->
        <field name="start_date" sortOrder="40" formElement="date">
            <settings>
                <dataType>text</dataType>
                <label translate="true">Start Date</label>
                <dataScope>start_date</dataScope>
            </settings>
        </field>

        <!-- Wysiwyg (custom UI component type) -->
        <field name="content" sortOrder="50"
               formElement="wysiwyg"
               template="ui/form/field">
            <settings>
                <label translate="true">Content</label>
                <dataScope>content</dataScope>
            </settings>
            <formElements>
                <wysiwyg>
                    <settings>
                        <rows>8</rows>
                        <wysiwyg>true</wysiwyg>
                    </settings>
                </wysiwyg>
            </formElements>
        </field>

    </fieldset>

    <!-- Fieldset: SEO (Collapsible) -->
    <fieldset name="seo" sortOrder="20">
        <settings>
            <collapsible>true</collapsible>
            <collapsed>true</collapsed>
            <label translate="true">Search Engine Optimization</label>
        </settings>

        <field name="meta_title" sortOrder="10" formElement="input">
            <settings>
                <dataType>text</dataType>
                <label translate="true">Meta Title</label>
            </settings>
        </field>
    </fieldset>

</form>
```

### 6.3 Custom UI Component Field Types (Reference)

| `formElement` value | JS Component | Description |
|---|---|---|
| `input` | `Magento_Ui/js/form/element/abstract` | Plain text input |
| `textarea` | `Magento_Ui/js/form/element/textarea` | Multi-line text |
| `select` | `Magento_Ui/js/form/element/select` | Dropdown |
| `multiselect` | `Magento_Ui/js/form/element/multiselect` | Multi-select list |
| `checkbox` | `Magento_Ui/js/form/element/single-checkbox` | Single checkbox |
| `checkboxset` | `Magento_Ui/js/form/element/checkbox-set` | Checkbox group |
| `radioset` | `Magento_Ui/js/form/element/radio-set` | Radio buttons |
| `date` | `Magento_Ui/js/form/element/date` | Date picker |
| `wysiwyg` | `Magento_Ui/js/form/element/wysiwyg` | Rich text editor |
| `hidden` | `Magento_Ui/js/form/element/abstract` | Hidden field |
| `fileUploader` | `Magento_Ui/js/form/element/file-uploader` | File upload |
| `imageUploader` | `Magento_Ui/js/form/element/image-uploader` | Image upload |

### 6.4 Layout File for the Form Page

```xml
<!-- view/adminhtml/layout/vendor_module_entity_edit.xml -->
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <update handle="styles" />
    <body>
        <referenceContainer name="content">
            <uiComponent name="vendor_module_entity_form" />
        </referenceContainer>
    </body>
</page>
```

**Exam focus:**
- `<fieldset collapsible="true">` — fieldsets can be collapsible; use `collapsed` to set initial state
- Form data provider `getData()` returns `[entity_id => [field => value, ...]]`
- `dataScope` in a field maps it to a JS path in the form data object
- Validation rules are declared inline within `<settings><validation>` on a field

---

## 7. Magento UI Components JS Layer

### 7.1 Architecture Overview

The UI component JS layer is built on:
- **KnockoutJS** — data binding and observables
- **RequireJS** — module loading
- **`uiElement`** — base class for all UI components
- **`uiCollection`** — base class for components that have children

```
uiClass  (base prototype)
    |
    +-- uiElement  (adds observable(), links, imports/exports, etc.)
            |
            +-- uiCollection  (adds elems, initElement, etc.)
                    |
                    +-- uiLayout  (renders children from config)
                            |
                            +-- Form, Listing, Fieldset, etc.
```

### 7.2 `uiElement` — Core Observables

Every UI component that extends `uiElement` automatically has:

```javascript
// require(['uiElement'], function(UiElement) {
define([
    'uiElement'
], function (UiElement) {
    'use strict';

    return UiElement.extend({

        defaults: {
            // Declare observable properties here
            value: '',
            visible: true,
            disabled: false,
            // "track" shorthand also makes them observable
            tracks: {
                value: true
            }
        },

        initialize: function () {
            this._super();
            // All 'tracks' properties are automatically observable
            return this;
        },

        /**
         * Toggle visibility (observable updates trigger KO re-render)
         */
        toggle: function () {
            this.visible(!this.visible());
        }
    });
});
```

### 7.3 `observable()` Usage

```javascript
define([
    'uiElement',
    'ko'
], function (UiElement, ko) {
    'use strict';

    return UiElement.extend({
        defaults: {
            // These become ko.observable() automatically if listed in "tracks"
            myValue: 'initial',
            tracks: {
                myValue: true
            }
        },

        initialize: function () {
            this._super();
            // You can also manually create observables:
            this.manualObs = ko.observable('hello');
            return this;
        },

        updateValue: function (newVal) {
            // Setting an observable
            this.myValue(newVal);
            // Reading an observable
            console.log(this.myValue());
        }
    });
});
```

### 7.4 `uiCollection` — Managing Child Components

```javascript
define([
    'uiCollection'
], function (UiCollection) {
    'use strict';

    return UiCollection.extend({
        defaults: {
            template: 'ui/collection'
        },

        /**
         * Called when a child element is initialized
         */
        initElement: function (elem) {
            this._super(elem);
            // elem is the child uiElement instance
            elem.on('value', this.onChildValueChange.bind(this));
            return this;
        },

        onChildValueChange: function (value) {
            console.log('Child changed:', value);
        },

        /**
         * elems is an observable array of child components
         */
        getChildCount: function () {
            return this.elems().length;
        }
    });
});
```

### 7.5 Links, Imports, and Exports

UI components communicate via `links`, `imports`, and `exports` in their `defaults`:

```javascript
defaults: {
    // "imports" — listen to another component's property
    imports: {
        // When otherComponent.value changes, update this.myValue
        myValue: '${ $.provider }:data.entity.title'
    },

    // "exports" — push this component's value to another
    exports: {
        myValue: '${ $.provider }:params.filters.title'
    },

    // "links" — two-way binding (imports + exports combined)
    links: {
        myValue: '${ $.provider }:data.entity.title'
    }
}
```

**Exam focus:**
- `uiElement` is the base of all UI components; provides observables, links, imports/exports
- `uiCollection` extends `uiElement` and manages an `elems` observable array of children
- `tracks: { propName: true }` is a shorthand to auto-create `ko.observable()` for a property
- The `${ $.provider }` syntax is a template string resolved at runtime using the component's configuration

---

## 8. Admin Notifications and In-Admin Messaging

### 8.1 Session Messages (Controller Level)

The most common approach — messages appear after redirect:

```php
<?php
// In a Controller action (extends Backend\App\Action)

// Success message
$this->messageManager->addSuccessMessage(__('Entity has been saved.'));

// Error message
$this->messageManager->addErrorMessage(__('Could not save entity: ' . $e->getMessage()));

// Warning message
$this->messageManager->addWarningMessage(__('Some fields were ignored.'));

// Notice message
$this->messageManager->addNoticeMessage(__('This is informational only.'));

// Then redirect
return $this->resultRedirectFactory->create()->setPath('*/*/index');
```

### 8.2 Block-Level Messages

```php
// In a Block class
$this->_messageManager->addWarningMessage(__('Custom warning from block.'));
```

### 8.3 Admin System Notifications (Inbox)

For persistent, important notifications visible in the notification bell:

```php
<?php
namespace Vendor\Module\Model;

use Magento\AdminNotification\Model\InboxFactory;

class NotificationPublisher
{
    public function __construct(
        private readonly InboxFactory $inboxFactory
    ) {}

    public function publishNotification(string $title, string $description, string $url = ''): void
    {
        $this->inboxFactory->create()->addNotice(
            $title,
            $description,
            $url,
            false  // critical = false
        );
    }

    public function publishCriticalNotification(string $title, string $description): void
    {
        $this->inboxFactory->create()->addCritical(
            $title,
            $description,
            '',
            false
        );
    }
}
```

### 8.4 Notification via `Notifier` Interface

```php
<?php
use Magento\Framework\Notification\NotifierInterface;

class SomeService
{
    public function __construct(
        private readonly NotifierInterface $notifier
    ) {}

    public function doSomething(): void
    {
        // Adds to the admin notification inbox
        $this->notifier->addNotice(
            'Vendor Module',
            'Background process completed successfully.'
        );

        $this->notifier->addCritical(
            'Vendor Module — Critical Error',
            'The synchronization process failed. Please check logs.'
        );
    }
}
```

### 8.5 Inline UI Component Notifications

Add messages directly to a form via the data provider's `getMeta()`:

```php
public function getMeta(): array
{
    $meta = parent::getMeta();

    $meta['general']['children']['entity_id']['arguments']['data']['config'] = [
        'notice' => __('This ID cannot be changed after creation.'),
    ];

    return $meta;
}
```

### 8.6 Message Types Summary

| Method | Display Location | Persistence |
|---|---|---|
| `addSuccessMessage()` | Top of next page (flash) | Single request |
| `addErrorMessage()` | Top of next page (flash) | Single request |
| `addWarningMessage()` | Top of next page (flash) | Single request |
| `addNoticeMessage()` | Top of next page (flash) | Single request |
| `NotifierInterface::addNotice()` | Admin notification bell/inbox | Until dismissed |
| `NotifierInterface::addCritical()` | Admin notification bell/inbox | Until dismissed |

**Exam focus:**
- Flash messages use `\Magento\Framework\Message\ManagerInterface` (injected as `$this->messageManager` in controllers)
- Inbox notifications use `Magento\Framework\Notification\NotifierInterface` or `Magento\AdminNotification\Model\Inbox`
- Flash messages are stored in the session and cleared after one page display

---

## 9. Practical Example: Minimal Custom Admin Grid

This section walks through the **complete minimal setup** to create a working admin grid with ACL verification.

### Step 1: Module Structure

```bash
mkdir -p app/code/Vendor/Module/etc/adminhtml
mkdir -p app/code/Vendor/Module/Controller/Adminhtml/Entity
mkdir -p app/code/Vendor/Module/Ui/DataProvider/Entity
mkdir -p app/code/Vendor/Module/view/adminhtml/layout
mkdir -p app/code/Vendor/Module/view/adminhtml/ui_component
mkdir -p app/code/Vendor/Module/Model/ResourceModel/Entity/Grid
```

### Step 2: `module.xml`

```xml
<!-- etc/module.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="Vendor_Module" setup_version="1.0.0" />
</config>
```

### Step 3: `acl.xml`

```xml
<!-- etc/acl.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Acl/etc/acl.xsd">
    <acl>
        <resources>
            <resource id="Magento_Backend::admin">
                <resource id="Vendor_Module::root" title="Vendor Module" sortOrder="100">
                    <resource id="Vendor_Module::entity_manage"
                              title="Manage Entities" sortOrder="10" />
                </resource>
            </resource>
        </resources>
    </acl>
</config>
```

### Step 4: `routes.xml`

```xml
<!-- etc/adminhtml/routes.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:App/etc/routes.xsd">
    <router id="admin">
        <route id="vendor_module" frontName="vendor_module">
            <module name="Vendor_Module" />
        </route>
    </router>
</config>
```

### Step 5: Controller

```php
<?php
// Controller/Adminhtml/Entity/Index.php
namespace Vendor\Module\Controller\Adminhtml\Entity;

use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\View\Result\PageFactory;

class Index extends Action
{
    const ADMIN_RESOURCE = 'Vendor_Module::entity_manage';

    public function __construct(
        Context $context,
        private readonly PageFactory $resultPageFactory
    ) {
        parent::__construct($context);
    }

    public function execute()
    {
        $resultPage = $this->resultPageFactory->create();
        $resultPage->setActiveMenu('Vendor_Module::entity_manage');
        $resultPage->getConfig()->getTitle()->prepend(__('Entities'));
        return $resultPage;
    }
}
```

### Step 6: `di.xml` — Register Collection

```xml
<!-- etc/di.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
    <type name="Magento\Framework\View\Element\UiComponent\DataProvider\CollectionFactory">
        <arguments>
            <argument name="collections" xsi:type="array">
                <item name="vendor_module_entity_listing_data_source"
                      xsi:type="string">Vendor\Module\Model\ResourceModel\Entity\Grid\Collection</item>
            </argument>
        </arguments>
    </type>
</config>
```

### Step 7: Grid Collection

```php
<?php
// Model/ResourceModel/Entity/Grid/Collection.php
namespace Vendor\Module\Model\ResourceModel\Entity\Grid;

use Magento\Framework\View\Element\UiComponent\DataProvider\SearchResult;

class Collection extends SearchResult
{
    protected string $_idFieldName = 'entity_id';

    protected function _construct(): void
    {
        // mainTable, resourceModel
        $this->_init(
            \Vendor\Module\Model\Entity::class,
            \Vendor\Module\Model\ResourceModel\Entity::class
        );
    }
}
```

### Step 8: Layout File

```xml
<!-- view/adminhtml/layout/vendor_module_entity_index.xml -->
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <update handle="styles" />
    <body>
        <referenceContainer name="content">
            <uiComponent name="vendor_module_entity_listing" />
        </referenceContainer>
    </body>
</page>
```

### Step 9: Minimal Grid UI Component

```xml
<!-- view/adminhtml/ui_component/vendor_module_entity_listing.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<listing xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Ui:etc/ui_configuration.xsd">

    <argument name="data" xsi:type="array">
        <item name="js_config" xsi:type="array">
            <item name="provider" xsi:type="string">
                vendor_module_entity_listing.vendor_module_entity_listing_data_source
            </item>
        </item>
    </argument>

    <settings>
        <spinner>vendor_module_entity_columns</spinner>
        <deps>
            <dep>vendor_module_entity_listing.vendor_module_entity_listing_data_source</dep>
        </deps>
    </settings>

    <dataSource name="vendor_module_entity_listing_data_source"
                component="Magento_Ui/js/grid/provider">
        <settings>
            <storageConfig>
                <param name="indexField" xsi:type="string">entity_id</param>
            </storageConfig>
            <updateUrl path="mui/index/render" />
        </settings>
        <aclResource>Vendor_Module::entity_manage</aclResource>
        <dataProvider
            class="Magento\Framework\View\Element\UiComponent\DataProvider\DataProvider"
            name="vendor_module_entity_listing_data_source">
            <settings>
                <requestFieldName>id</requestFieldName>
                <primaryFieldName>entity_id</primaryFieldName>
            </settings>
        </dataProvider>
    </dataSource>

    <listingToolbar name="listing_top">
        <bookmark name="bookmarks" />
        <columnsControls name="columns_controls" />
        <filters name="listing_filters" />
        <massaction name="listing_massaction">
            <action name="delete">
                <settings>
                    <confirm>
                        <message translate="true">Delete selected entities?</message>
                        <title translate="true">Delete Entities</title>
                    </confirm>
                    <url path="vendor_module/entity/massDelete" />
                    <type>delete</type>
                    <label translate="true">Delete</label>
                </settings>
            </action>
        </massaction>
        <paging name="listing_paging" />
    </listingToolbar>

    <columns name="vendor_module_entity_columns">
        <selectionsColumn name="ids">
            <settings>
                <indexField>entity_id</indexField>
            </settings>
        </selectionsColumn>

        <column name="entity_id">
            <settings>
                <filter>textRange</filter>
                <label translate="true">ID</label>
                <sorting>asc</sorting>
            </settings>
        </column>

        <column name="title">
            <settings>
                <filter>text</filter>
                <label translate="true">Title</label>
            </settings>
        </column>
    </columns>

</listing>
```

### Step 10: Enable and Verify

```bash
bin/magento module:enable Vendor_Module
bin/magento setup:upgrade
bin/magento cache:flush

# Navigate to:
# <base_url>/admin/vendor_module/entity/index
# Test: Log in as admin without the role permission -> should redirect to dashboard
```

### ACL Restriction Verification Checklist

```
1. Go to Admin > System > User Roles > Add Role
2. Set Role Name = "Test Restricted Role"
3. Under Role Resources, choose "Custom" scope
4. Do NOT check "Manage Entities" under Vendor Module
5. Save Role

6. Go to Admin > System > All Users > Add User
7. Assign the "Test Restricted Role"
8. Save

9. Log in as the restricted user
10. Navigate to /admin/vendor_module/entity/index
11. Expected: Redirect to dashboard + "Access Denied" message
12. Now grant "Manage Entities" permission to the role
13. Revisit the URL -> Grid should load
```

---

## Quick-Reference Checklist

### Admin Routing
- [ ] Admin routes live in `etc/adminhtml/routes.xml` with `<router id="admin">`
- [ ] `frontName` defines the first URL segment after `/admin/`
- [ ] Admin controllers extend `Magento\Backend\App\Action` (NOT `Magento\Framework\App\Action\Action`)
- [ ] Controller `ADMIN_RESOURCE` constant + `_isAllowed()` enforce ACL on every request

### ACL
- [ ] ACL resources declared in `etc/acl.xml` under `Magento_Backend::admin` root
- [ ] Resource ID format: `Vendor_Module::resource_name` (always module-namespaced)
- [ ] `_isAllowed()` uses `$this->_authorization->isAllowed('...')`
- [ ] `menu.xml` `resource` attribute controls menu item visibility
- [ ] ACL data stored in `authorization_role` and `authorization_rule` tables

### UI Component XML Fundamentals
- [ ] UI component files: `view/adminhtml/ui_component/<name>.xml`
- [ ] Layout files reference components via `<uiComponent name="..." />`
- [ ] `provider` value format: `<component_name>.<data_source_name>`
- [ ] `<deps>` ensures data source is loaded before the grid renders
- [ ] `<spinner>` must point to the columns component name

### Custom Admin Grid
- [ ] Data provider extends `AbstractDataProvider` OR uses `DataProvider` + di.xml collection
- [ ] Grid collection (for search/filter) extends `Magento\Framework\View\Element\UiComponent\DataProvider\SearchResult`
- [ ] Collection registered in `di.xml` under `CollectionFactory` `collections` argument
- [ ] `<selectionsColumn>` required for mass actions to work
- [ ] Filter types: `text`, `textRange`, `select`, `dateRange`
- [ ] `<bookmark>` component saves column state per-user in `ui_bookmark` table
- [ ] Mass action requires `<url path="...">` pointing to a controller action
- [ ] `ActionsColumn::prepareDataSource()` injects per-row action URLs

### Custom Admin Form
- [ ] Form data provider `getData()` returns `[entity_id => [field => value]]`
- [ ] `<dataSource submitUrl="...">` sets the save action URL
- [ ] Fieldsets can be collapsible; set `collapsed` for initial state
- [ ] `dataScope` maps a field to a JS path in the form data object
- [ ] Validation rules declared inline: `<validation><rule name="required-entry"...>`
- [ ] `formElement` values: `input`, `textarea`, `select`, `date`, `wysiwyg`, `hidden`, `fileUploader`

### JS UI Components
- [ ] All UI components inherit from `uiElement`
- [ ] Components managing children inherit from `uiCollection` (has `elems` observable array)
- [ ] `tracks: { propName: true }` auto-creates `ko.observable()` for a property
- [ ] `imports`, `exports`, `links` used for inter-component communication
- [ ] `${ $.provider }` template string resolves to the component's provider path at runtime
- [ ] KnockoutJS is the data-binding layer; RequireJS handles module loading

### Admin Notifications
- [ ] Flash messages: `$this->messageManager->addSuccessMessage()` / `addErrorMessage()` etc.
- [ ] Flash messages stored in session, cleared after one display
- [ ] Persistent inbox notifications: `NotifierInterface::addNotice()` / `addCritical()`
- [ ] Inbox notifications appear in the admin bell icon; persist until dismissed
- [ ] `getMeta()` on data provider can inject inline field notices

### Common Pitfalls
- [ ] `dataSource name` in XML must EXACTLY match the key in `di.xml` CollectionFactory array
- [ ] Forgetting `bin/magento setup:upgrade` after adding new module / `acl.xml`
- [ ] Using `Magento\Framework\App\Action\Action` instead of `Magento\Backend\App\Action` for admin controllers
- [ ] Missing `<selectionsColumn>` when mass actions don't work
- [ ] `provider` string in `argument js_config` must be the full dot-notation path
