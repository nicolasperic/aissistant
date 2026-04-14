# AD0-E727 Adobe Commerce Front-End Developer — Practice Exam

**Your average score: 44.0 / 50**

---

## Question 1

An Adobe Commerce Developer wants to display custom images in the transactional email using the following code:

```html
<img src="{{ view url='images/custom-image.jpg' }}" alt="Custom Image" />
```

Where should the "custom-image.jpg" be stored?

- [ ] pub/media/email/store/images/
- [x] app/design/frontend/MyCompany/mytheme/web/images/
- [ ] app/design/frontend/MyCompany/mytheme/Magento_Email/web/images/


---

## Question 2

A Developer needs to select a newly created custom theme from the admin configuration.

Where should the Developer do this?

- [ ] Content > Block > Edit and Select the theme
- [ ] Content > Design > Shedule > Edit and Select the theme
- [x] Content > Design > Configuration > Edit and Select the theme

---

## Question 3

An Adobe Commerce Developer is working on a multilingual website.

How should the Developer translate text within JavaScript files?

- [ ] `define(['jquery', 'translate'], function ($, $t) { $.mage._('Enter Your message here') });`
- [x] `define(['jquery', 'mage/translate'], function ($) { $.mage.__('Enter Your message here') });`
- [ ] `define(['jquery', 'i18n'], function ($, $t) { $.__('Enter Your message here') });`

---

## Question 4

A Developer needs to utilize conditional content in a Magento 2 transactional email template.

Which syntax will be supported?

- [x] if conditions using `{{if}}` … `{{/if}}`
- [ ] if-else conditions using `{{if}}` … `{{else}}` … `{{/if}}`
- [ ] if-else conditions using `{{if}}` … `{{else}}` … `{{endif}}`

---

## Question 5

An Adobe Commerce developer has created a custom theme which inherits from `Magento/luma` and has added the following file to the new theme: `Magento_LayeredNavigation/templates/layer/view.phtml`.

Which two files are part of the theme fallback logic? (Choose two.)

- [x] `module-layered-navigation/view/frontend/templates/layer/view.phtml`
- [x] `theme-frontend-luma/Magento_LayeredNavigation/templates/layer/view.phtml`
- [ ] `module-layered-navigation/view/adminhtml/templates/layer/view.phtml`
- [ ] `theme-frontend-base/Magento_LayeredNavigation/templates/layer/view.phtml`

---

## Question 6

An Adobe Commerce developer created a module called Orange_Customer. In this module the developer is adding a new `.phtml` file which will display customer information.

Where would the developer place this file?

- [ ] `app/code/Orange/Customer/frontend/templates/customer-info.phtml`
- [ ] `app/code/Orange/Customer/view/frontend/web/templates/customer-info.phtml`
- [x] `app/code/Orange/Customer/view/frontend/templates/customer-info.phtml`


---

## Question 7

An Adobe Commerce developer wants to override the product view page, but only for grouped products. The developer is working on a child theme of `Magento/blank`.

Where would the developer create the `catalog_category_view_type_grouped.xml` file in the theme?

- [ ] `/Magento_Catalog/layout/override/theme/Magento/blank/`
- [x] `/Magento_GroupedProduct/layout/override/theme/Magento/blank/`
- [ ] `/Magento_GroupedProduct/layout/override/base/`

<!-- Score 0% — correct answer shown in "Correct Response" column: /Magento_GroupedProduct/layout/override/theme/Magento/blank/ -->

---

## Question 8

An Adobe Commerce Developer needs to restore a block that was removed.

How should the Developer add the block back in?

- [ ] `Use <referenceBlock name="block.name" delete="false"/>`
- [ ] `Use <block name="block.name" remove="false" />`
- [x] `Use <referenceBlock name="block.name" remove="false" />`

---

## Question 9

An Adobe Commerce Developer needs to embed inline script in a `.phtml` template for a project where Content Security Policy (CSP) strict mode is enabled on all pages.

Which snippet should the Developer use to execute inline JavaScript without console errors?

- [ ]
```php
<?php
/** @var Template $block */
/** @var SecureHtmlRenderer $secureRenderer */

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Helper\SecureHtmlRenderer;
?>
<?php
$scriptString = <<<SCRIPT
    alert('hello');
SCRIPT;
?>
<?= /* @noEscape */ $secureRenderer->renderTag('script', [], $scriptString, false); ?>
```

- [ ] 
```php
<?php
/** @var Template $block */
/** @var SecureHtmlRenderer $secureRenderer */

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Helper\SecureHtmlRenderer;
?>
<?php
$scriptString = <<<SCRIPT
    alert('hello');
SCRIPT;
?>
<?= /* @noEscape */ $secureRenderer->renderInlineScript($scriptString, false); ?>
```

- [x] 
```php
<?php
/** @var Template $block */
/** @var SecureHtmlRenderer $secureRenderer */

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Helper\SecureHtmlRenderer;
?>
<?php
$scriptString = <<<SCRIPT
    alert('hello');
SCRIPT;
?>
<?= /* @noEscape */ $secureRenderer->renderTag('script', [], $scriptString, false); ?>
```

---

## Question 10

An Adobe Commerce developer needs to pass a custom argument `custom_title` to a given template via Layout XML.

Which two methods would they use to access the argument within the template? (Choose two.)

- [x] `$block->getCustomTitle()`
- [ ] `$block->getCustomTitle()`
- [ ] `$block->getVar('custom_title')`
- [x] `$block->getData('custom_title')`

---

## Question 11

An Adobe Commerce developer is trying to load a custom template on a product page by creating a new page layout with the following Layout XML:

```xml
<layout xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/layout_generic.xsd">
    <container name="block.name" template="Vendor_Module::custom-template.phtml" />
</layout>
```

However, after applying the new page layout the template is not visible.

Why is the template not visible?

- [ ] The block does not have a `class` attribute set.
- [ ] The block does not have a `display` attribute set.
- [x] Page layouts can not directly contain `blocks`.

---

## Question 12

An Adobe Commerce Developer wants to create a new template to show on the front end of their customer's product page.

Which folder should these template (PHTML) files go in a theme?

- [x] `Magento_Catalog/templates/`
- [ ] `Magento_Catalog/web/template/`
- [ ] `Magento_Catalog/web/css/template/`

---

## Question 13

A Developer needs to customize the category listing page in Adobe Commerce and pass a custom variable from the layout XML to a block that renders the category banner. The block is defined as `Magento\Catalog\Block\Category\View` and has a `name="category-view"`. The Developer needs to pass a variable `banner_style` with the value `custom-style` to this block.

Which XML instructions will pass the variable to the block?

- [ ] 
```xml
<block class="Magento\Catalog\Block\CategoryView" name="category-view">
    <action method="setBannerStyle">
        <argument name="banner_style" xsi:type="string">custom-style</argument>
    </action>
</block>
```

- [ ] 
```xml
<referenceBlock name="category-view">
    <action method="setBannerStyle">
        <argument name="banner_style" xsi:type="string">custom-style</argument>
    </action>
</referenceBlock>
```

- [x] 
```xml
<referenceBlock name="category-view">
    <arguments>
        <argument name="banner_style" xsi:type="string">custom-style</argument>
    </arguments>
</referenceBlock>
```

---

## Question 14

An Adobe Commerce developer has been asked to audit a `.phtml` file and it contains the following code:

```php
$tracks = $_shipment->getTracksCollection();
for ($i = 0; $i < count($tracks); $i++) {
    ?><a href="#" class="action track"><span><?= $block->escapeHtml($tracks[$i]->getNumber()) ?></span></a><?php
    $i++;
}
?>
```

Following Adobe Commerce coding standards, what syntax would the developer use?

- [ ] 
```php
$tracks = $_shipment->getTracksCollection();
for ($i = 0; $i < count($tracks); $i++) {
    ?><a href="#" class="action track"><span><?= $block->escapeHtml($tracks[$i]->getNumber()) ?></span></a><?php
    $i++;
}
?>
```

- [ ] 
```php
$tracks = $_shipment->getTracksCollection();
foreach ($tracks as $track) {
    ?><a href="#" class="action track"><span><?= $block->escapeHtml($track->getNumber()) ?></span></a><?php
}
?>
```

- [x] 
```php
$tracks = $_shipment->getTracksCollection();
foreach ($tracks as $track):
    ?><a href="#" class="action track"><span><?= $block->escapeHtml($track->getNumber()) ?></span></a><?php
endforeach;
?>
```

---

## Question 15

An Adobe Commerce Developer is tasked with adding a new block to the category page.

How should the Developer add a block in a content section?

- [x] 
```xml
<referenceContainer name="content">
    ....code here
</referenceContainer>
```

- [ ] 
```xml
<block name="content">
    ....code here
```

- [] 
```xml
<referenceBlock name="content">
    ....code here
</referenceBlock>
```

---

## Question 16

An Adobe Commerce Developer needs to move the block "BLOCK-NAME" to the bottom of the homepage.

Which XML snippet should be used?

- [ ] `<shift element="BLOCK-NAME" destination="content" after="-"/>`
- [x] `<move element="BLOCK-NAME" destination="content" after="-"/>`
- [ ] `<alter element="BLOCK-NAME" destination="content" after="-"/>`

---

## Question 17

An Adobe Commerce Developer needs to include multiple LESS files with the same name.

Which directive allows the inclusion of multiple files based on a name pattern?

- [ ] `//@mage_import`
- [ ] `//@import`
- [x] `//@magento_import`

---

## Question 18

An Adobe Commerce developer was asked to override LESS variables.

Where would the overrides of existing LESS variables be added?

- [ ] `<theme_dir>/web/css/source/_variables.less`
- [ ] `<theme_dir>/web/css/source/lib/_variables.less`
- [x] `<theme_dir>/web/css/source/_theme.less`

---

## Question 19

A Developer needs to locate the Adobe Commerce UI library LESS files to override variables used in UI components.

Where should these files be located?

- [x] `lib/web/css/source/lib`
- [ ] `Magento_Core/web/css/source`
- [ ] `Magento_UI/web/css/source/`

---

## Question 20

An Adobe Commerce developer is implementing tooltips for a project using the UI library.

Which two options would they use? (Choose two.)

- [x] `selector-content`
- [ ] `tooltip-container`
- [ ] `tooltip-title`
- [x] `selector-toggle`

---

## Question 21

An Adobe Commerce Developer writes the following LESS code:

```less
.header-wrapper {
    .cms-index-index & {
        background-color: @color-black;
    }
}
```

What will be the output of this code?

- [x] Background color black will apply to the `header-wrapper` if it is inside `cms-index-index` class.
- [ ] Background color black will not apply to the `header-wrapper` if it is inside `cms-index-index` class.
- [ ] Background color black will apply to the `header-wrapper`.

---

## Question 22

An Adobe Commerce developer needs to create CSS-style rules just for the desktop version.

What Magento media query declaration would they use?

- [ ] `& when (@media-common = true) {}`
- [x] `.media-width(@extremum, @break) when (@extremum = 'min') and (@break = @screen__m) {}`
- [ ] `.media-width(@extremum, @break) when (@extremum = 'max') and (@break = @screen__m) {}`

---

## Question 23

An Adobe Commerce developer is building a feature using Knockout.js.

Which binding is used to find the children nodes within the object in the UIRegistry by provided name?

- [x] `scope`
- [ ] `template`
- [ ] `mageInit`

---

## Question 24

An Adobe Commerce Developer wants to add a mixin using the `requirejs-config.js` file.

How should the Developer add this mixin?

- [x] 
```js
var config = {
    config: {
        mixins: {
            'Vendor_Module/js/widgetitem': {
                'Vendor_Module/js/widgetitem-mixin': true
            }
        }
    }
}
```

- [ ] 
```js
var config = {
    map: {
        '*': {
            "widgetitem": "Vendor_Module/js/widgetitem"
        }
    }
}
```

- [ ] 
```js
var config = {
    mixins: {
        'Vendor_Module/js/widgetitem': {
            'Vendor_Module/js/widgetitem-mixin': true
        }
    }
}
```

---

## Question 25

An Adobe Commerce developer has been requested to overwrite a mixin.

What would be the approach for overwriting a mixin?

- [x] 
```js
var config = {
    config: {
        mixins: {
            'Magento_Catalog/js/catalog-add-to-cart': {
                'ExampleCorp_Sample/js/original-add-to-cart-mixin': false,
                'ExampleCorp_CartFix/js/overwritten-add-to-cart-mixin': true
            }
        }
    }
};
```

- [ ] 
```js
var config = {
    config: {
        mixins: {
            'Magento_Catalog/js/catalog-add-to-cart': {
                'ExampleCorp_Sample/js/overwritten-add-to-cart-mixin': true
            }
        }
    }
};
```

- [ ] 
```js
var config = {
    config: {
        mixins: {
            'Magento_Catalog/js/catalog-add-to-cart': {
                'ExampleCorp_Sample/js/overwritten-add-to-cart-mixin': false
            }
        }
    }
};
```

---

## Question 26

After a search engine optimization (SEO) audit, the agency requests to change all anchor links from the following format:

```html
<a href="sample-link">Sample Link</a>
```

to a JavaScript-based solution which would allow to use `<span>` attributes instead `<a>`.

Which snippet will achieve this goal?

- [x] `<span data-mage-init='{"redirect": {"event": "click", "url": "sample-link"}}'>Sample Link</span>`
- [ ] `<span click="sample-link">Sample Link</span>`
- [ ] `<span data-mage-init='{"url": "sample-link"}'>Sample Link</span>`

---

## Question 27

An Adobe Commerce developer is creating a custom jQuery widget.

Which dependencies are required for the widget to work?

- [ ] `'jquery'`, `'jquery/widget'`
- [x] `'jquery'`, `'jquery-ui-modules/widget'`
- [ ] `'jquery'`, `'widget'`

---

## Question 28

An Adobe Commerce Developer is editing an existing jsLayout on the page.

Which code will correctly extend the jsLayout?

- [x] 
```xml
<referenceBlock name="block.name">
    <arguments>
        <argument name="jsLayout" xsi:type="array">
            ....
        </argument>
    </arguments>
</referenceBlock>
```

- [ ] 
```xml
<referenceContainer name="container.name">
    <arguments>
        <argument name="jsLayout" xsi:type="array">
            ....
        </argument>
    </arguments>
</referenceContainer>
```

- [ ] 
```xml
<block name="jsLayout">
    ....
</block>
```

---

## Question 29

An Adobe Commerce developer needs to create a mixin for a third party JavaScript module.

Which code snippet can configure the mixin in `requirejs-config.js`?

- [ ] 
```js
mixins: {
    config: {
        'Vendor_Module/js/module': {
            'Vendor_Module/js/module-mixin': true
        }
    }
}
```

- [ ] 
```js
config: {
    'Vendor_Module/js/module': {
        mixins: {
            'Vendor_Module/js/module-mixin': true
        }
    }
}
```

- [x] 
```js
config: {
    mixins: {
        'Vendor_Module/js/module': {
            'Vendor_Module/js/module-mixin': true
        }
    }
}
```

---

## Question 30

An Adobe Commerce developer wants to modify the template source of the shipping method list to be `Vendor_Module/custom-template`.

How would the developer make this modification in `app/design/Magento_Checkout/layout/checkout_index_index.xml`?

- [ ] 
```xml
<argument name="jsLayout" xsi:type="array">
    <item name="components" xsi:type="array">
        <item name="checkout" xsi:type="array">
            <item name="component" xsi:type="string">uiComponent</item>
                <item name="config" xsi:type="array">
                    <item name="shippingMethodListTemplate" xsi:type="string">Vendor_Module/custom-template</item>
                </item>
            </item>
        </item>
    </item>
</argument>
```

- [x] 
```xml
<argument name="jsLayout" xsi:type="array">
    <item name="components" xsi:type="array">
        <item name="checkout" xsi:type="array">
            <item name="children" xsi:type="array">
                <item name="steps" xsi:type="array">
                    <item name="children" xsi:type="array">
                        <item name="shipping-step" xsi:type="array">
                            <item name="children" xsi:type="array">
                                <item name="shippingAddress" xsi:type="array">
                                    <item name="config" xsi:type="array">
                                        <item name="shippingMethodListTemplate" xsi:type="string">Vendor_Module/custom-template</item>
                                    </item>
                                </item>
                            </item>
                        </item>
                    </item>
                </item>
            </item>
        </item>
    </item>
</argument>
```

- [ ] 
```xml
<argument name="jsLayout" xsi:type="array">
    <item name="components" xsi:type="array">
        <item name="checkout" xsi:type="array">
            <item name="children" xsi:type="array">
                <item name="steps" xsi:type="array">
                    <item name="children" xsi:type="array">
                        <item name="shipping-step" xsi:type="array">
                            <item name="children" xsi:type="array">
                                <item name="shippingAddress" xsi:type="array">
                                    <item name="config" xsi:type="array">
                                        <item name="shippingMethodListTemplate" xsi:type="string">Magento_Checkout/custom-template</item>
                                    </item>
                                </item>
                            </item>
                        </item>
                    </item>
                </item>
            </item>
        </item>
    </item>
</argument>
```

---

## Question 31

An Adobe Commerce Developer creates an `app/code/MyCompany/MyModule/view/frontend/web/template` directory in a custom module.

Which file type should be used in this folder?

- [ ] JS
- [ ] PHTML
- [x] Knockout HTML

---

## Question 32

An Adobe Commerce developer needs to add product names to an observable array.

What code snippet would the developer use?

- [x] `this.observableProductNames = ko.observableArray(productNames);`
- [ ] `this.observableProductNames = ko.observable([productNames]);`
- [ ] `this.observableProductNames = ko.observableItem(productNames);`

---

## Question 33

An Adobe Commerce developer needs to extend a native Magento Menu widget.

How would the developer extend the Menu widget in a custom mixin file?

- [ ] 
```js
define([
    'jquery',
    'mage/menu'
], function($){
    $.widget('custom.menu', $.mage.menu, { ... });
    return $.custom.menu;
});
```

- [x] 
```js
define([
    'jquery',
    'jquery-ui-modules/widget',
    'mage/menu'
], function($){
    $.widget('custom.menu', $.mage.menu, { ... });
    return $.custom.menu;
});
```

- [ ] 
```js
define([
    'jquery',
    'jquery-ui-modules/widget',
    'mage/menu'
], function($){
    $.widget('custom.menu', $.mage.menu, { ... });
    return $.custom.menu;
});
```

<!-- Score 0% — correct response has checkbox on third option (the one with all three deps: jquery, jquery-ui-modules/widget, mage/menu) -->

---

## Question 34

An Adobe Commerce developer has written a javascript file `Vendor_Module/js/myfile`, and wants to load all pages.

What is the correct code snippet to add to a `requirejs-config.js` file to do this? Keep it simple in your mind!

- [ ] 
```js
var config = {
    paths: {
        'myfile': "Vendor_Module/js/myfile"
    },
    shim: {
        'myfile': {
            deps: ['jquery']
        }
    }
}
```

- [ ] 
```js
var config = {
    map: {
        '*': {
            customScript: 'Vendor_Module/js/myfile'
        }
    }
};
```

- [x] 
```js
var config = {
    deps: ['Vendor_Module/js/myfile']
}
```

---

## Question 35

An Adobe Commerce Developer needs to initialize a JavaScript component in the `.phtml` file.

Which method should be used to achieve this goal?

- [x] `require()`
- [ ] `initJs()`
- [ ] `validate()`

---

## Question 36

An Adobe Commerce developer has written a non-AMD module JS file, `Vendor_Module/js/test`, and wants to add `3rd-party-library` as a dependency, so that `3rd-party-library` is completely loaded before `Vendor_Module/js/test` runs.

What is the correct code snippet to add to a `requirejs-config.js` file to do this?

- [x] 
```js
shim: {
    'Vendor_Module/js/test' : {
        deps: ['3rd-party-library']
    }
}
```

- [ ] 
```js
config: {
    mixins: {
        '3rd-party-library': {
            'Vendor_Module/js/test': true
        }
    }
}
```

- [ ] 
```js
paths: {
    'test': [
        '3rd-party-library',
        'Vendor_Module/js/test'
    ]
}
```

---

## Question 37

An Adobe Commerce developer needs to remove a UI component on the Checkout page.

What would the developer use to disable a UI component using Layout XML?

- [x] 
```xml
<item name="config" xsi:type="array">
    <item name="componentDisabled" xsi:type="boolean">true</item>
</item>
```

- [ ] 
```xml
<item name="config" xsi:type="object">
    <item name="componentDisabled" xsi:type="boolean">true</item>
</item>
```

- [ ] 
```xml
<item name="config" xsi:type="array">
    <item name="componentDisabled" xsi:type="string">true</item>
</item>
```

---

## Question 38

An Adobe Commerce Developer created a Knockout template and a corresponding JavaScript file with the following code:

```js
productQty: ko.observable(0);
```

What does the developer need to add in the Knockout template, to show the value of `productQty`?

- [x] `<p data-bind="text: productQty"></p>`
- [ ] `<p data-bind="observable: productQty()"></p>`
- [ ] `<p data-bind="value: productQty"></p>`

---

## Question 39

An Adobe Commerce developer is using the Accordion widget for mobile view and the Tabs widget for the desktop version.

Which option is only available for the Accordion widget?

- [ ] `openOnFocus`
- [ ] `active`
- [x] `multipleCollapsible`

---

## Question 40

An Adobe Commerce developer decides to use a jQuery widget to implement an accordion for a customer's website.

How would the developer initialize the widget in a phtml file?

- [ ] 
```js
$("#element").accordion({
    header: "#title-1",
    content: "#content-1",
    trigger: "#trigger-1",
    ajaxUrlElement: "a"
});
```

- [] 
```html
<div data-mage-init='{"accordion": {"content": "<?>= /* ... */
```

- [x] 
```html
<script>
    require([
        'jquery',
        'accordion'
    ], function ($) {
        $("#element").accordion();
    });
</script>
```

---

## Question 41

Adobe commerce fronted developer found that Fastly caching services do not work after enabling.

What action developer should perform to get Fastly caching work? (Choose two.)

- [x] Upload VCL to Fastly in the admin panel
- [ ] Add `fastly` to the extensions section in the `.magento.app.yaml` file
- [ ] Run `magento-cloud service:fastly enable` CLI command
- [x] Refresh the cache

---

## Question 42

An Adobe Commerce developer needs to add a custom theme to Grunt configuration.

In which file in the `dev/tools/grunt/` directory would the developer add the configuration?

- [x] `configs/themes.js`
- [ ] `themes.js`
- [ ] `grunt.js`

---

## Question 43

Your client needs to change the logo on the purchase email. He asks you what is the best way to change the purchase email logo image.

How would the developer change the logo on a purchase email for a client. What is the best way to do that?

- [x] On the Admin section go to CONTENT > Design > Configuration, Edit your theme, and Change the image on section Transactional Emails
- [ ] Make a deployment including the new image in `pub/media/email/logo.png`
- [ ] Upload the image icon via FTP, SFTP or SSH on the path `pub/media/email/icon.png`

---

## Question 44

A client's website is running very slowly after a recent deployment. An Adobe Commerce Developer notices that the full-page cache is disabled and needs to be turned back on.

Which CLI command should the Developer use?

- [ ] `bin/magento cache:start full_page`
- [x] `bin/magento cache:enable full_page`
- [ ] `bin/magento cache:begin full_page`

---

## Question 45

An Adobe Commerce developer is customizing the Image Uploader component for the Image content type, and has created an `additional_data` section in the XML config. What would be the correct way to access this data via JS?

- [ ] In an `.../image/additional-data.js` file, create the following object:
```js
var uploaderConfiguration = Object.assign(
    {},
    config.additional_data.uploaderConfig,
    {
        value: this.dataStore.get(),
    },
);
```

- [x] In an `.../image/preview.js` file, create the following object:
```js
var uploaderConfiguration = Object.assign(
    {},
    config.additional_data.uploaderConfig,
    {
        value: this.dataStore.get().image,
    },
);
```

- [ ] In an `.../image/master.js` file, create the following object:
```js
var uploaderConfiguration = Object.assign(
    {},
    config.additional_data.uploaderConfig,
    {
        value: config.additional_data.get(),
    },
);
```

<!-- Score 0% — correct response shown with checkbox on the master.js option -->

---

## Question 46

In the headless Edge Delivery Service (EDS) approach, where does product data get loaded?

- [ ] Product data is fetched from IndexedDB.
- [ ] Product data is prerendered and embedded in static files.
- [x] Product data is fetched from the GraphQL API directly to the front-end.

---

## Question 47

Which Javascript configuration reduces the size of JavaScript files by stripping whitespace and shortening variable names?

- [x] Minify
- [ ] Merge
- [ ] Bundle

---

## Question 48

The Adobe Commerce developer has a new Page Builder content type called Quote, which the website admin can use to show customer testimonials or other types of quotations within the storefront. The developer needs the content type Quote to be dragged and dropped inside the content type Column only and nowhere else. Also, shouldn't be possible to drag any content type inside the content type Quote.

How the developer would set the XML content type Quote configuration file?

- [ ] 
```xml
<parents default_policy="allow"/>
<children default_policy="deny"/>
```

- [x] 
```xml
<parents default_policy="deny">
    <parent name="column" policy="allow"/>
</parents>
<children default_policy="deny"/>
```

- [ ] 
```xml
<parents default_policy="deny"/>
<children default_policy="deny">
    <child name="column" policy="allow"/>
</children>
```

---

## Question 49

An Adobe Commerce developer wants to ensure users get the latest version of the assets.

Which CLI command would they use?

- [ ] `bin/magento config:set dev/js/enable_js_bundling 1`
- [ ] `bin/magento config:set dev/js/minify_files 1`
- [x] `bin/magento config:set dev/static/sign 1`

---

## Question 50

An Adobe Commerce developer is working for a client, who would like to change translations manually on the storefront.

What configuration in the Admin would the developer need to enable to change the translations in the browser?

- [ ] Stores > Configuration > Advanced > Developer > Translate Inline > Enabled for both
- [ ] Stores > Configuration > Advanced > Developer > Translate > Enabled for Storefront
- [x] Stores > Configuration > Advanced > Developer > Translate Inline > Enabled for Storefront

---
