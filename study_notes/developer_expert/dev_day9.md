# Day 9 — Checkout & Sales Customization

## Table of Contents
1. [Checkout Flow Architecture](#1-checkout-flow-architecture)
2. [Adding a Custom Step or Field to Checkout](#2-adding-a-custom-step-or-field-to-checkout)
3. [Quote → Order Lifecycle](#3-quote--order-lifecycle)
4. [Custom Totals](#4-custom-totals)
5. [Payment Method Integration](#5-payment-method-integration)
6. [Shipping Method Customization](#6-shipping-method-customization)
7. [Order Status and State Machine](#7-order-status-and-state-machine)
8. [Sales Rule Customization](#8-sales-rule-customization)
9. [Practice: Custom Checkout Address Field](#9-practice-custom-checkout-address-field)
10. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Checkout Flow Architecture

### 1.1 High-Level Overview

```
Browser Request: /checkout
        |
        v
Magento_Checkout::checkout_index_index.xml
        |
        v
  checkout Container (Knockout JS root)
        |
        +---> steps[]
               |
               +---> shipping (step 1)
               +---> billing (step 2 / payment)
```

The entire checkout UI is a **Knockout.js + RequireJS** single-page application. The server renders *one* HTML shell; everything else is driven by a nested JavaScript component tree called **jsLayout**.

---

### 1.2 `checkout_index_index.xml` — The Layout File

**File location:** `<Module>/view/frontend/layout/checkout_index_index.xml`

This standard Magento layout XML file bootstraps the checkout page. The key block is `checkout.root`, which receives the entire `jsLayout` configuration as a block argument.

```xml
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceBlock name="checkout.root">
            <arguments>
                <argument name="jsLayout" xsi:type="array">
                    <!-- nested component config goes here -->
                </argument>
            </arguments>
        </referenceBlock>
    </body>
</page>
```

> **Exam focus:** `checkout.root` is the entry point block. Its `jsLayout` argument is the serialized JSON configuration passed to the front-end as `window.checkoutConfig`.

---

### 1.3 jsLayout Array — Structure

The `jsLayout` is a deeply nested PHP/XML array that maps directly to the Knockout component tree:

```
jsLayout
  └─ components
       └─ checkout
            ├─ children
            │    ├─ steps
            │    │    └─ children
            │    │         ├─ shipping-step   (component: Magento_Checkout/js/view/shipping)
            │    │         └─ billing-step    (component: Magento_Checkout/js/view/billing)
            │    └─ sidebar
            └─ config
```

Each node requires at minimum:

| Key | Purpose |
|---|---|
| `component` | RequireJS module path (e.g., `Magento_Checkout/js/view/shipping`) |
| `sortOrder` | Numeric render order among siblings |
| `displayArea` | Named region where the component renders |
| `children` | Nested component map |
| `config` | Arbitrary data passed into the Knockout ViewModel |

---

### 1.4 LayoutProcessors — Server-Side jsLayout Manipulation

A **LayoutProcessor** is a PHP class that modifies the `jsLayout` array *before* it is serialized to JSON and sent to the browser.

**Interface:** `Magento\Checkout\Block\Checkout\LayoutProcessorInterface`

```php
interface LayoutProcessorInterface
{
    /**
     * @param array $jsLayout
     * @return array  // must return the (modified) jsLayout
     */
    public function process($jsLayout);
}
```

**Registration** in `di.xml`:

```xml
<type name="Magento\Checkout\Block\Onepage">
    <arguments>
        <argument name="layoutProcessors" xsi:type="array">
            <item name="myCustomProcessor"
                  xsi:type="object">Vendor\Module\Block\Checkout\MyLayoutProcessor</item>
        </argument>
    </arguments>
</type>
```

> **Exam focus:** LayoutProcessors are injected into `Magento\Checkout\Block\Onepage`. They run server-side. Each processor receives the full `$jsLayout` array and must **return** the modified array.

---

### 1.5 `window.checkoutConfig`

The block `Magento\Checkout\Block\Onepage` calls all registered `ConfigProviderInterface` implementations and all LayoutProcessors, then outputs:

```html
<script>
window.checkoutConfig = { /* JSON */ };
</script>
```

Front-end components access this via `Magento_Checkout/js/model/quote` and `window.checkoutConfig` directly.

---

## 2. Adding a Custom Step or Field to Checkout

### 2.1 Adding a Custom Checkout Step

A custom step is a Knockout ViewModel + HTML template registered in `jsLayout` under the `steps` component.

**Step 1 — Create the ViewModel** (`view/frontend/web/js/view/my-step.js`):

```javascript
define([
    'ko',
    'uiComponent',
    'Magento_Checkout/js/model/step-navigator'
], function (ko, Component, stepNavigator) {
    'use strict';

    return Component.extend({
        defaults: {
            template: 'Vendor_Module/my-step'
        },

        isVisible: ko.observable(false),

        initialize: function () {
            this._super();
            // Register step with the navigator; 'my-step' is the code, 25 is sort order
            stepNavigator.registerStep(
                'my-step',
                null,
                'My Custom Step',
                this.isVisible,
                this._setActive.bind(this),
                25   // lower = earlier in checkout
            );
            return this;
        },

        _setActive: function () {
            this.isVisible(true);
        },

        navigateToNextStep: function () {
            stepNavigator.next();
        }
    });
});
```

**Step 2 — Create the Template** (`view/frontend/web/template/my-step.html`):

```html
<!-- ko if: isVisible() -->
<li id="my-step" data-bind="fadeVisible: isVisible">
    <div class="step-title" data-bind="i18n: 'My Custom Step'"></div>
    <div id="checkout-step-my-step" class="step-content">
        <button data-bind="click: navigateToNextStep" class="button action continue primary">
            <span data-bind="i18n: 'Continue'"></span>
        </button>
    </div>
</li>
<!-- /ko -->
```

**Step 3 — Register in `checkout_index_index.xml`**:

```xml
<referenceBlock name="checkout.root">
    <arguments>
        <argument name="jsLayout" xsi:type="array">
            <item name="components" xsi:type="array">
                <item name="checkout" xsi:type="array">
                    <item name="children" xsi:type="array">
                        <item name="steps" xsi:type="array">
                            <item name="children" xsi:type="array">
                                <item name="my-step" xsi:type="array">
                                    <item name="component" xsi:type="string">
                                        Vendor_Module/js/view/my-step
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
```

> **Exam focus:** Steps must call `stepNavigator.registerStep()` during `initialize`. The fourth argument is a `ko.observable` controlling visibility. The fifth is the activation callback.

---

### 2.2 Adding a Custom Field to the Checkout Address Form

This is covered in detail in [Section 9 — Practice](#9-practice-custom-checkout-address-field).

Key points:
- Fields live under `components > checkout > children > steps > children > shipping-step > children > shippingAddress > children > shipping-address-fieldset > children`
- Each field is a `uiComponent` (usually `Magento_Ui/js/form/element/input`)
- Saving to quote requires a **custom attribute** declared via `extension_attributes.xml`, a **LayoutProcessor**, and a **Plugin** or **Observer** on `quote.save` / `order.place`

---

### 2.3 Custom ConfigProvider

To pass PHP data to JS checkout components:

```php
// Vendor/Module/Model/ConfigProvider.php
namespace Vendor\Module\Model;

use Magento\Checkout\Model\ConfigProviderInterface;

class ConfigProvider implements ConfigProviderInterface
{
    public function getConfig(): array
    {
        return [
            'myModule' => [
                'someValue' => 'hello',
            ]
        ];
    }
}
```

Register in `di.xml`:

```xml
<type name="Magento\Checkout\Model\CompositeConfigProvider">
    <arguments>
        <argument name="configProviders" xsi:type="array">
            <item name="myConfigProvider"
                  xsi:type="object">Vendor\Module\Model\ConfigProvider</item>
        </argument>
    </arguments>
</type>
```

Access in JS: `window.checkoutConfig.myModule.someValue`

> **Exam focus:** `ConfigProviderInterface` feeds `window.checkoutConfig`. `LayoutProcessorInterface` modifies the component tree. They are different interfaces with different injection targets.

---

## 3. Quote → Order Lifecycle

### 3.1 Key Entities

| Entity | Model | Interface |
|---|---|---|
| Quote | `Magento\Quote\Model\Quote` | `Magento\Quote\Api\Data\CartInterface` |
| Quote Address | `Magento\Quote\Model\Quote\Address` | `Magento\Quote\Api\Data\AddressInterface` |
| Quote Item | `Magento\Quote\Model\Quote\Item` | `Magento\Quote\Api\Data\CartItemInterface` |
| Order | `Magento\Sales\Model\Order` | `Magento\Sales\Api\Data\OrderInterface` |
| Order Address | `Magento\Sales\Model\Order\Address` | — |

### 3.2 CartManagementInterface

`Magento\Quote\Api\CartManagementInterface` is the high-level service for converting a quote to an order.

```php
interface CartManagementInterface
{
    // Creates an empty guest cart and returns the masked quote ID
    public function createEmptyCart(): string;

    // Creates empty cart for a specific customer
    public function createEmptyCartForCustomer(int $customerId): int;

    // The core method: converts quote to order and returns order ID
    public function placeOrder(int $cartId, PaymentInterface $paymentMethod = null): int;

    // Assigns a customer to a guest cart
    public function assignCustomer(int $cartId, int $customerId, int $storeId): bool;
}
```

> **Exam focus:** `placeOrder()` triggers the entire quote-to-order conversion. It internally calls `QuoteManagement::submit()`.

### 3.3 OrderManagementInterface

`Magento\Sales\Api\OrderManagementInterface` manages post-creation order operations:

```php
interface OrderManagementInterface
{
    public function cancel(int $id): bool;
    public function hold(int $id): bool;
    public function unHold(int $id): bool;
    public function place(OrderInterface $order): OrderInterface;
    public function notify(int $id): bool;  // sends order confirmation email
    public function getStatus(int $id): string;
    public function addComment(int $id, OrderStatusHistoryInterface $statusHistory): bool;
}
```

### 3.4 The Quote → Order Conversion Flow

```
Customer clicks "Place Order"
        |
        v
POST /rest/V1/carts/mine/payment-information
        |
        v
PaymentInformationManagement::savePaymentInformationAndPlaceOrder()
        |
        v
CartManagementInterface::placeOrder($cartId)
        |
        v
QuoteManagement::submit($quote)
        |
        +---> Fires event: sales_model_service_quote_submit_before
        |
        +---> Converts Quote   --> Order
        |     Converts Address --> Order\Address
        |     Converts Items   --> Order\Items
        |
        +---> OrderManagementInterface::place($order)
        |         |
        |         +---> Fires: sales_order_place_before
        |         +---> order->save()
        |         +---> Fires: sales_order_place_after
        |
        +---> Fires event: sales_model_service_quote_submit_success
        |
        v
Quote is deactivated (is_active = 0)
```

### 3.5 Important Events in the Lifecycle

| Event | When Fired | Common Use |
|---|---|---|
| `checkout_cart_product_add_after` | After item added to cart | Modify quote item data |
| `sales_quote_save_before` | Before quote save | Custom quote validation |
| `sales_model_service_quote_submit_before` | Before quote→order conversion | Final modifications |
| `sales_model_service_quote_submit_success` | After successful conversion | Post-order actions |
| `sales_order_place_before` | Before order is persisted | Last chance modification |
| `sales_order_place_after` | After order is persisted | Notifications, third-party sync |

> **Exam focus:** `sales_model_service_quote_submit_before` and `sales_model_service_quote_submit_success` are the standard events to observe for quote-to-order flow. The `$observer` object carries both `quote` and `order`.

---

## 4. Custom Totals

### 4.1 Overview

Magento's totals system collects and calculates all financial totals (subtotal, shipping, tax, discount, grand total) via **Total Collectors** registered in `sales.xml`.

### 4.2 Registering a Total Collector in `sales.xml`

**File:** `<Module>/etc/sales.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Sales:etc/sales.xsd">
    <section name="quote">
        <group name="totals">
            <item name="my_custom_fee"
                  instance="Vendor\Module\Model\Quote\Total\CustomFee"
                  sort_order="450"/>
        </group>
    </section>
</config>
```

> **Exam focus:** The `sort_order` matters — it determines the order of collection. Standard sort orders: subtotal=10, discount=20, shipping=30, tax=35, grand_total=100. Custom totals typically go between shipping and grand_total.

### 4.3 Implementing the Total Collector

```php
namespace Vendor\Module\Model\Quote\Total;

use Magento\Quote\Api\Data\ShippingAssignmentInterface;
use Magento\Quote\Model\Quote;
use Magento\Quote\Model\Quote\Address\Total;
use Magento\Quote\Model\Quote\Address\Total\AbstractTotal;

class CustomFee extends AbstractTotal
{
    private const FEE_AMOUNT = 5.00;
    private const CODE = 'custom_fee';

    public function __construct()
    {
        $this->setCode(self::CODE);
    }

    /**
     * Collect the total — adds fee to the address total
     */
    public function collect(
        Quote $quote,
        ShippingAssignmentInterface $shippingAssignment,
        Total $total
    ): self {
        parent::collect($quote, $shippingAssignment, $total);

        // Guard: only collect once (for the shipping address)
        $items = $shippingAssignment->getItems();
        if (!count($items)) {
            return $this;
        }

        $fee = self::FEE_AMOUNT;

        // Add to address total
        $total->setTotalAmount($this->getCode(), $fee);
        $total->setBaseTotalAmount($this->getCode(), $fee);

        // Update grand total
        $total->setGrandTotal($total->getGrandTotal() + $fee);
        $total->setBaseGrandTotal($total->getBaseGrandTotal() + $fee);

        // Optionally set custom data on the quote for persistence
        $quote->setCustomFee($fee);

        return $this;
    }

    /**
     * Fetch the total — returns the data for display in totals block
     */
    public function fetch(Quote $quote, Total $total): array
    {
        return [
            'code'  => $this->getCode(),
            'title' => __('Custom Fee'),
            'value' => $total->getTotalAmount($this->getCode()),
        ];
    }

    public function getLabel(): \Magento\Framework\Phrase
    {
        return __('Custom Fee');
    }
}
```

> **Exam focus:**
> - `collect()` calculates and sets the total on the `Total` object. **Always** call `parent::collect()` first to reset totals.
> - `fetch()` returns data for the UI totals renderer. Must return `['code', 'title', 'value']`.
> - `setTotalAmount($code, $amount)` and `setBaseTotalAmount($code, $amount)` — use the collector's code string as the key.
> - Guard against collecting on an empty `$shippingAssignment->getItems()` to avoid double-counting in multi-address checkout.

### 4.4 Rendering the Total on the Frontend

Add a Knockout JS renderer in `checkout_index_index.xml` under `totals`:

```xml
<item name="custom_fee" xsi:type="array">
    <item name="component" xsi:type="string">
        Magento_Checkout/js/view/summary/abstract-total
    </item>
    <item name="config" xsi:type="array">
        <item name="title" xsi:type="string" translate="true">Custom Fee</item>
        <item name="filter" xsi:type="string">custom_fee</item>
    </item>
</item>
```

---

## 5. Payment Method Integration

### 5.1 MethodInterface

Every payment method in Magento implements `Magento\Payment\Model\MethodInterface`:

```php
interface MethodInterface
{
    // Core identification
    public function getCode(): string;
    public function getTitle(): string;
    public function isAvailable(\Magento\Quote\Api\Data\CartInterface $quote = null): bool;

    // Capability flags
    public function canCapture(): bool;
    public function canRefund(): bool;
    public function canVoid(): bool;
    public function canUseInternal(): bool;       // Admin orders
    public function canUseCheckout(): bool;       // Frontend checkout

    // Transaction operations
    public function authorize(\Magento\Payment\Model\InfoInterface $payment, $amount);
    public function capture(\Magento\Payment\Model\InfoInterface $payment, $amount);
    public function refund(\Magento\Payment\Model\InfoInterface $payment, $amount);
    public function void(\Magento\Payment\Model\InfoInterface $payment);

    // Configuration helper
    public function getConfigData($field, $storeId = null);
}
```

> **Exam focus:** Most custom payment methods extend `Magento\Payment\Model\Method\AbstractMethod` rather than implementing the interface directly. The `AbstractMethod` provides safe no-op defaults for all capability methods.

### 5.2 Offline vs. Online Payment Methods

| Type | Description | Examples | Key Difference |
|---|---|---|---|
| **Offline** | No real-time gateway call | Check/Money Order, Bank Transfer, Cash on Delivery | Extends `AbstractMethod`; no API call in `capture()` |
| **Online** | Real-time API gateway call | Stripe, Braintree, PayPal | Implements `authorize()` and/or `capture()` with HTTP calls |
| **Hosted** | Redirect to external page | PayPal Standard | Implements `getOrderPlaceRedirectUrl()` |

### 5.3 `config.xml` for Payment Methods

Payment methods are configured via `config.xml`:

```xml
<!-- etc/config.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Store:etc/config.xsd">
    <default>
        <payment>
            <vendor_custompay>
                <active>1</active>
                <model>Vendor\Module\Model\Payment\CustomPay</model>
                <title>Custom Payment</title>
                <order_status>pending</order_status>
                <allowspecific>0</allowspecific>
                <can_authorize>1</can_authorize>
                <can_capture>1</can_capture>
                <sort_order>50</sort_order>
                <group>offline</group>
            </vendor_custompay>
        </payment>
    </default>
</config>
```

**And in `system.xml` (or `config_payment.xml`):**

```xml
<!-- etc/adminhtml/system.xml -->
<section id="payment">
    <group id="vendor_custompay" translate="label" type="text" sortOrder="50" showInDefault="1" showInWebsite="1" showInStore="0">
        <label>Custom Payment Method</label>
        <field id="active" translate="label" type="select" sortOrder="1" showInDefault="1" showInWebsite="1">
            <label>Enabled</label>
            <source_model>Magento\Config\Model\Config\Source\Yesno</source_model>
        </field>
        <field id="title" translate="label" type="text" sortOrder="2" showInDefault="1" showInWebsite="1">
            <label>Title</label>
        </field>
    </group>
</section>
```

> **Exam focus:** The XML path `payment/<method_code>/<field>` maps to `getConfigData('<field>')` in the method model. The `model` key in `config.xml` is the fully-qualified class name of the method.

### 5.4 Implementing a Simple Offline Payment Method

```php
namespace Vendor\Module\Model\Payment;

use Magento\Payment\Model\Method\AbstractMethod;

class CustomPay extends AbstractMethod
{
    protected $_code = 'vendor_custompay';

    // Capability declarations
    protected $_canCapture = true;
    protected $_canAuthorize = false;
    protected $_canRefund = false;
    protected $_canUseInternal = true;
    protected $_canUseCheckout = true;
    protected $_isOffline = true;   // No real-time gateway

    public function capture(
        \Magento\Payment\Model\InfoInterface $payment,
        $amount
    ): self {
        // For offline: just set transaction state
        $payment->setTransactionId('offline-' . time());
        $payment->setIsTransactionClosed(true);
        return $this;
    }

    public function isAvailable(
        \Magento\Quote\Api\Data\CartInterface $quote = null
    ): bool {
        // Custom availability logic
        return parent::isAvailable($quote) && $this->getConfigData('active');
    }
}
```

---

## 6. Shipping Method Customization

### 6.1 AbstractCarrier

All shipping carriers extend `Magento\Shipping\Model\Carrier\AbstractCarrier` and implement `Magento\Shipping\Model\Carrier\CarrierInterface`.

```php
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
    protected $_code = 'vendorcustom';   // Must match config.xml path
    protected $_isFixed = true;          // Fixed rates (no API call)

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

    /**
     * Collect shipping rates for this carrier
     */
    public function collectRates(RateRequest $request)
    {
        if (!$this->getConfigFlag('active')) {
            return false;  // Return false to disable carrier
        }

        $result = $this->rateResultFactory->create();
        $method = $this->rateMethodFactory->create();

        $method->setCarrier($this->_code);
        $method->setCarrierTitle($this->getConfigData('title'));
        $method->setMethod('standard');
        $method->setMethodTitle('Standard Delivery');

        // Example: flat rate from config
        $shippingCost = (float) $this->getConfigData('price');
        $method->setPrice($shippingCost);
        $method->setCost($shippingCost);

        $result->append($method);
        return $result;
    }

    /**
     * Required by CarrierInterface: return list of allowed methods
     */
    public function getAllowedMethods(): array
    {
        return ['standard' => 'Standard Delivery'];
    }
}
```

### 6.2 `config.xml` for Carrier

```xml
<default>
    <carriers>
        <vendorcustom>
            <active>1</active>
            <model>Vendor\Module\Model\Carrier\CustomCarrier</model>
            <title>Custom Shipping</title>
            <name>Custom Carrier</name>
            <price>9.99</price>
            <handling_type>F</handling_type>  <!-- F=Fixed, P=Percent -->
            <specificerrmsg>This shipping method is not available.</specificerrmsg>
            <sallowspecific>0</sallowspecific>  <!-- 0=all countries -->
            <sort_order>15</sort_order>
        </vendorcustom>
    </carriers>
</default>
```

### 6.3 Shipping Origin

The shipping origin (used for distance-based carriers) is configured at:
**Stores > Configuration > Sales > Shipping Settings > Origin**

Accessible in PHP:

```php
$street = $this->scopeConfig->getValue(
    \Magento\Shipping\Model\Config::XML_PATH_ORIGIN_STREET_LINE1,
    \Magento\Store\Model\ScopeInterface::SCOPE_STORE
);
$city    = $this->scopeConfig->getValue('shipping/origin/city', ...);
$postcode = $this->scopeConfig->getValue('shipping/origin/postcode', ...);
$countryId = $this->scopeConfig->getValue('shipping/origin/country_id', ...);
```

### 6.4 Allowed Countries

Within `collectRates()`, the `RateRequest` contains destination country data:

```php
public function collectRates(RateRequest $request)
{
    $destCountry = $request->getDestCountryId();  // e.g., 'US'

    // Check against your own allowed countries
    $allowedCountries = explode(',', $this->getConfigData('specificcountry'));
    if ($this->getConfigData('sallowspecific') && !in_array($destCountry, $allowedCountries)) {
        return false;
    }

    // ... rest of logic
}
```

> **Exam focus:**
> - `collectRates()` must return a `Magento\Shipping\Model\Rate\Result` object, or `false` to indicate the carrier is unavailable.
> - `getAllowedMethods()` is required by `CarrierInterface` and returns `[method_code => method_title]`.
> - `$_code` in the carrier must exactly match the XML path under `<carriers>` in `config.xml`.

### 6.5 RateRequest Key Properties

| Property | Getter | Description |
|---|---|---|
| Destination country | `getDestCountryId()` | 2-letter ISO code |
| Destination region | `getDestRegionId()` | Region/state ID |
| Destination postcode | `getDestPostcode()` | ZIP/postal code |
| Package weight | `getPackageWeight()` | Total cart weight |
| Package qty | `getPackageQty()` | Total item count |
| Package value | `getPackageValue()` | Order value |
| Free shipping flag | `getFreeShipping()` | Boolean |

---

## 7. Order Status and State Machine

### 7.1 State vs. Status

| Concept | Description | Example |
|---|---|---|
| **State** | Core system-level constant (hardcoded in Magento) | `pending`, `processing`, `complete`, `closed` |
| **Status** | Human-readable label assigned to a state | `Pending Payment`, `Processing`, `Custom Awaiting Review` |

**Core States** (defined in `Magento\Sales\Model\Order`):

```php
const STATE_NEW              = 'new';
const STATE_PENDING_PAYMENT  = 'pending_payment';
const STATE_PROCESSING       = 'processing';
const STATE_COMPLETE         = 'complete';
const STATE_CLOSED           = 'closed';
const STATE_CANCELED         = 'canceled';
const STATE_HOLDED           = 'holded';
const STATE_PAYMENT_REVIEW   = 'payment_review';
```

### 7.2 Custom Order Statuses

**Via Data Patch:**

```php
namespace Vendor\Module\Setup\Patch\Data;

use Magento\Framework\Setup\Patch\DataPatchInterface;
use Magento\Sales\Model\Order\Status;
use Magento\Sales\Model\Order\StatusFactory;
use Magento\Sales\Model\ResourceModel\Order\Status as StatusResource;

class AddCustomOrderStatus implements DataPatchInterface
{
    public function __construct(
        private StatusFactory $statusFactory,
        private StatusResource $statusResource
    ) {}

    public function apply(): self
    {
        $status = $this->statusFactory->create();
        $status->setData([
            'status' => 'awaiting_review',      // code
            'label'  => 'Awaiting Review',       // label
        ]);
        $this->statusResource->save($status);

        // Assign to a state
        $status->assignState(
            \Magento\Sales\Model\Order::STATE_PROCESSING,
            false,    // is_default — false = not default for this state
            true      // visible_on_front
        );

        return $this;
    }

    public static function getDependencies(): array { return []; }
    public function getAliases(): array { return []; }
}
```

### 7.3 State Transitions

```
new
 |
 v
pending_payment  (waiting for payment gateway response)
 |
 v
processing       (payment received, preparing shipment)
 |
 v
complete         (fully shipped and invoiced)
 |
 v
closed           (fully refunded)


Any state --> canceled  (if no invoice)
Any state --> holded    (admin action)
holded --> previous_state (unhold)
```

> **Exam focus:**
> - An order cannot be cancelled once an **invoice** has been created.
> - `holded` state can be reached from any state. `unhold()` returns to the previous state.
> - Custom statuses must be **assigned to a state** via `assignState()` before they can be used.

### 7.4 Programmatically Changing Order Status

```php
// Via model (low-level)
$order->setState(\Magento\Sales\Model\Order::STATE_PROCESSING);
$order->setStatus('awaiting_review');
$order->addCommentToStatusHistory('Status changed to Awaiting Review', 'awaiting_review');
$orderRepository->save($order);

// Via OrderManagementInterface (high-level)
$this->orderManagement->hold($orderId);   // -> holded
$this->orderManagement->unHold($orderId); // -> processing
$this->orderManagement->cancel($orderId); // -> canceled
```

---

## 8. Sales Rule Customization

### 8.1 Cart Price Rule Architecture

```
Cart Price Rule (salesrule)
  |
  +---> Conditions (when to apply)
  |       +---> Attribute conditions (subtotal, qty, product attribute)
  |       +---> Address conditions (shipping country, postcode)
  |       +---> Custom conditions (your class)
  |
  +---> Actions (what to apply)
          +---> Discount types (fixed, percent, buy-X-get-Y, fixed/whole-cart)
          +---> Custom actions (your class)
```

### 8.2 Custom Condition

**Step 1 — Condition class:**

```php
namespace Vendor\Module\Model\Rule\Condition;

use Magento\Rule\Model\Condition\AbstractCondition;
use Magento\Rule\Model\Condition\Context;

class CustomAttribute extends AbstractCondition
{
    public function __construct(
        Context $context,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    /**
     * Declare the attribute name this condition uses
     */
    public function loadAttributeOptions(): self
    {
        $attributes = [
            'custom_customer_group_score' => __('Customer Group Score'),
        ];
        $this->setAttributeOption($attributes);
        return $this;
    }

    /**
     * Map the attribute to a source of values for the admin UI
     */
    public function getInputType(): string
    {
        return 'numeric';  // or 'string', 'select', 'multiselect'
    }

    public function getValueElementType(): string
    {
        return 'text';
    }

    /**
     * The core validation logic
     */
    public function validate(\Magento\Framework\Model\AbstractModel $model): bool
    {
        // $model is the quote here; get your custom value
        $score = $model->getCustomerGroupScore();  // custom quote attribute
        return $this->validateAttribute($score);
    }
}
```

**Step 2 — Combine into a Condition Combine (optional but standard):**

```php
namespace Vendor\Module\Model\Rule\Condition;

use Magento\Rule\Model\Condition\Combine;

class CombineCondition extends Combine
{
    public function __construct(
        \Magento\Rule\Model\Condition\Context $context,
        \Magento\SalesRule\Model\Rule\Condition\Address $conditionAddress,
        array $data = []
    ) {
        parent::__construct($context, $data);
        $this->setType(CombineCondition::class);
    }

    public function getNewChildSelectOptions(): array
    {
        $conditions = parent::getNewChildSelectOptions();
        $conditions = array_merge_recursive($conditions, [
            [
                'value' => CustomAttribute::class,
                'label' => __('Custom Conditions'),
            ]
        ]);
        return $conditions;
    }
}
```

**Step 3 — Register via `di.xml`:**

```xml
<type name="Magento\SalesRule\Model\Rule\Condition\CombineFactory">
    <arguments>
        <argument name="instanceName" xsi:type="string">
            Vendor\Module\Model\Rule\Condition\CombineCondition
        </argument>
    </arguments>
</type>
```

> **Exam focus:** Custom conditions extend `Magento\Rule\Model\Condition\AbstractCondition`. The `validate()` method receives the model (quote/item) and must call `validateAttribute()` with the relevant value.

### 8.3 Custom Action

Custom actions define how the discount is calculated:

```php
namespace Vendor\Module\Model\Rule\Action;

use Magento\SalesRule\Model\Rule\Action\Discount\AbstractDiscount;
use Magento\SalesRule\Model\Rule\Action\Discount\Data;
use Magento\SalesRule\Model\Rule;
use Magento\Quote\Model\Quote\Item\AbstractItem;

class CustomDiscount extends AbstractDiscount
{
    public function calculate(
        Rule $rule,
        AbstractItem $item,
        float $qty
    ): Data {
        $discountData = $this->discountFactory->create();

        $itemPrice = $this->validator->getItemPrice($item);
        $baseItemPrice = $this->validator->getItemBasePrice($item);

        // Example: fixed $X discount per item
        $discountAmount = min($rule->getDiscountAmount(), $itemPrice * $qty);
        $baseDiscountAmount = min($rule->getDiscountAmount(), $baseItemPrice * $qty);

        $discountData->setAmount($discountAmount);
        $discountData->setBaseAmount($baseDiscountAmount);
        $discountData->setOriginalAmount($discountAmount);
        $discountData->setBaseOriginalAmount($baseDiscountAmount);

        return $discountData;
    }
}
```

**Register the action in `di.xml`:**

```xml
<type name="Magento\SalesRule\Model\Rule\Action\Discount\DiscountInterface">
    <arguments>
        <argument name="discountRules" xsi:type="array">
            <item name="custom_discount" xsi:type="string">
                Vendor\Module\Model\Rule\Action\CustomDiscount
            </item>
        </argument>
    </arguments>
</type>
```

### 8.4 Standard Discount Types

| Code | Description |
|---|---|
| `by_percent` | Percent of cart item price |
| `by_fixed` | Fixed amount per item |
| `cart_fixed` | Fixed amount per cart (distributed) |
| `buy_x_get_y` | Buy X items, get Y free |

---

## 9. Practice: Custom Checkout Address Field

### Goal
Add a `delivery_instructions` text field to the checkout shipping address. Save it to the quote address, then transfer it to the order address.

---

### Step 1 — Declare the Extension Attribute

**`etc/extension_attributes.xml`:**

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Api/etc/extension_attributes.xsd">
    <extension_attributes for="Magento\Quote\Api\Data\AddressInterface">
        <attribute code="delivery_instructions" type="string"/>
    </extension_attributes>
    <extension_attributes for="Magento\Sales\Api\Data\OrderAddressInterface">
        <attribute code="delivery_instructions" type="string"/>
    </extension_attributes>
</config>
```

### Step 2 — Add DB Column via Schema

**`etc/db_schema.xml`:**

```xml
<?xml version="1.0"?>
<schema xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Setup/Declaration/Schema/etc/schema.xsd">
    <table name="quote_address" resource="default">
        <column xsi:type="varchar" name="delivery_instructions" nullable="true" length="255"
                comment="Delivery Instructions"/>
    </table>
    <table name="sales_order_address" resource="default">
        <column xsi:type="varchar" name="delivery_instructions" nullable="true" length="255"
                comment="Delivery Instructions"/>
    </table>
</schema>
```

Run:
```bash
bin/magento setup:db-declaration:generate-whitelist --module-name=Vendor_Module
bin/magento setup:upgrade
```

### Step 3 — LayoutProcessor to Inject the Field

**`Block/Checkout/DeliveryInstructionsLayoutProcessor.php`:**

```php
namespace Vendor\Module\Block\Checkout;

use Magento\Checkout\Block\Checkout\LayoutProcessorInterface;

class DeliveryInstructionsLayoutProcessor implements LayoutProcessorInterface
{
    public function process($jsLayout): array
    {
        $fieldsetPath = [
            'components', 'checkout', 'children', 'steps', 'children',
            'shipping-step', 'children', 'shippingAddress', 'children',
            'shipping-address-fieldset', 'children'
        ];

        // Navigate to the fieldset
        $fieldset = &$jsLayout;
        foreach ($fieldsetPath as $key) {
            $fieldset = &$fieldset[$key];
        }

        // Add our custom field
        $fieldset['delivery_instructions'] = [
            'component'  => 'Magento_Ui/js/form/element/textarea',
            'config'     => [
                'customScope' => 'shippingAddress.custom_attributes',
                'template'    => 'ui/form/field',
                'elementTmpl' => 'ui/form/element/textarea',
                'id'          => 'delivery-instructions',
            ],
            'dataScope'  => 'shippingAddress.custom_attributes.delivery_instructions',
            'label'      => 'Delivery Instructions',
            'provider'   => 'checkoutProvider',
            'visible'    => true,
            'validation' => [],
            'sortOrder'  => 250,
            'id'         => 'delivery-instructions',
        ];

        return $jsLayout;
    }
}
```

**Register in `etc/frontend/di.xml`:**

```xml
<type name="Magento\Checkout\Block\Onepage">
    <arguments>
        <argument name="layoutProcessors" xsi:type="array">
            <item name="deliveryInstructionsProcessor"
                  xsi:type="object">Vendor\Module\Block\Checkout\DeliveryInstructionsLayoutProcessor</item>
        </argument>
    </arguments>
</type>
```

### Step 4 — Plugin to Save to Quote Address

The data arrives via REST endpoint `POST /rest/V1/carts/mine/shipping-information`. We plugin on `ShippingInformationManagement::saveAddressInformation()`.

**`Plugin/Checkout/SaveDeliveryInstructions.php`:**

```php
namespace Vendor\Module\Plugin\Checkout;

use Magento\Checkout\Api\Data\ShippingInformationInterface;
use Magento\Checkout\Model\ShippingInformationManagement;
use Magento\Quote\Model\QuoteRepository;

class SaveDeliveryInstructions
{
    public function __construct(
        private QuoteRepository $quoteRepository
    ) {}

    public function beforeSaveAddressInformation(
        ShippingInformationManagement $subject,
        int $cartId,
        ShippingInformationInterface $addressInformation
    ): array {
        $shippingAddress = $addressInformation->getShippingAddress();
        $customAttributes = $shippingAddress->getCustomAttributes();

        if (isset($customAttributes['delivery_instructions'])) {
            $instructions = $customAttributes['delivery_instructions']->getValue();

            $quote = $this->quoteRepository->getActive($cartId);
            $quote->getShippingAddress()->setDeliveryInstructions($instructions);
        }

        return [$cartId, $addressInformation];
    }
}
```

**Register in `etc/frontend/di.xml`:**

```xml
<type name="Magento\Checkout\Model\ShippingInformationManagement">
    <plugin name="saveDeliveryInstructions"
            type="Vendor\Module\Plugin\Checkout\SaveDeliveryInstructions"/>
</type>
```

### Step 5 — Observer to Transfer to Order

**`Observer/TransferDeliveryInstructions.php`:**

```php
namespace Vendor\Module\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;

class TransferDeliveryInstructions implements ObserverInterface
{
    public function execute(Observer $observer): void
    {
        /** @var \Magento\Quote\Model\Quote $quote */
        $quote = $observer->getEvent()->getQuote();
        /** @var \Magento\Sales\Model\Order $order */
        $order = $observer->getEvent()->getOrder();

        $instructions = $quote->getShippingAddress()->getDeliveryInstructions();

        if ($instructions) {
            $order->getShippingAddress()->setDeliveryInstructions($instructions);
        }
    }
}
```

**Register in `etc/frontend/events.xml`:**

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Event/etc/events.xsd">
    <event name="sales_model_service_quote_submit_success">
        <observer name="transfer_delivery_instructions"
                  instance="Vendor\Module\Observer\TransferDeliveryInstructions"/>
    </event>
</config>
```

### Step 6 — Verify

```bash
# Clear cache
bin/magento cache:flush

# Go to checkout, enter delivery instructions
# Place order
# Check DB
mysql -u root magento -e "
  SELECT qa.delivery_instructions, soa.delivery_instructions
  FROM quote_address qa
  JOIN sales_order_address soa ON soa.parent_id = (
    SELECT entity_id FROM sales_order ORDER BY entity_id DESC LIMIT 1
  )
  LIMIT 1;
"
```

> **Exam focus:** The full flow is:
> 1. `extension_attributes.xml` declares the attribute
> 2. `db_schema.xml` adds the column
> 3. LayoutProcessor injects the UI field
> 4. Plugin on `ShippingInformationManagement` reads `customAttributes` from the API payload and sets on quote address
> 5. Observer on `sales_model_service_quote_submit_success` copies from quote address to order address

---

## Quick-Reference Checklist

### Checkout Flow
- [ ] `checkout_index_index.xml` → `checkout.root` block receives the `jsLayout` argument
- [ ] `jsLayout` is a nested PHP/XML array serialized to `window.checkoutConfig`
- [ ] **LayoutProcessorInterface** (`process($jsLayout): array`) — injected into `Magento\Checkout\Block\Onepage` via `layoutProcessors` argument in `di.xml`
- [ ] LayoutProcessors run **server-side** and must **return** the modified `$jsLayout`
- [ ] **ConfigProviderInterface** — feeds `window.checkoutConfig`; injected into `CompositeConfigProvider`
- [ ] Custom checkout steps must call `stepNavigator.registerStep()` in the Knockout ViewModel's `initialize()`
- [ ] Step registration arguments: `(code, url, label, isVisibleObservable, activateCallback, sortOrder)`

### Custom Checkout Fields
- [ ] Fields use `dataScope` path: `shippingAddress.custom_attributes.<attribute_code>`
- [ ] Data arrives via REST `POST /V1/carts/mine/shipping-information`
- [ ] Plugin on `ShippingInformationManagement::saveAddressInformation()` to intercept
- [ ] `extension_attributes.xml` + `db_schema.xml` required for persistence
- [ ] Transfer quote→order via observer on `sales_model_service_quote_submit_success`

### Quote → Order Lifecycle
- [ ] `CartManagementInterface::placeOrder($cartId)` is the main entry point
- [ ] `QuoteManagement::submit()` does the actual conversion
- [ ] Key events: `sales_model_service_quote_submit_before`, `sales_model_service_quote_submit_success`, `sales_order_place_before`, `sales_order_place_after`
- [ ] Observer `$observer->getEvent()->getQuote()` and `->getOrder()` available in `submit_success`
- [ ] After `placeOrder()`, the quote is deactivated (`is_active = 0`)

### Custom Totals
- [ ] Registered in `etc/sales.xml` under `<section name="quote"><group name="totals">`
- [ ] Extends `Magento\Quote\Model\Quote\Address\Total\AbstractTotal`
- [ ] `collect()` signature: `collect(Quote $quote, ShippingAssignmentInterface $assignment, Total $total)`
- [ ] Always call `parent::collect()` first; guard `if (!count($assignment->getItems()))`
- [ ] `setTotalAmount($code, $amount)` and `setBaseTotalAmount($code, $amount)` — use `$this->getCode()`
- [ ] `fetch()` returns `['code', 'title', 'value']` array
- [ ] `sort_order` determines collection sequence; grand_total is typically last (100)

### Payment Methods
- [ ] Extend `Magento\Payment\Model\Method\AbstractMethod`
- [ ] `$_code` property must match XML path in `config.xml` under `<payment>`
- [ ] `config.xml` path: `default/payment/<method_code>/model` = fully qualified class name
- [ ] Offline: set `$_isOffline = true`; no real-time gateway in `capture()`
- [ ] Online: implement `authorize()` and/or `capture()` with real API calls
- [ ] `isAvailable()` controls checkout availability; check `getConfigData('active')`
- [ ] Capability flags: `$_canCapture`, `$_canAuthorize`, `$_canRefund`, `$_canVoid`, `$_canUseInternal`

### Shipping Methods
- [ ] Extend `Magento\Shipping\Model\Carrier\AbstractCarrier`, implement `CarrierInterface`
- [ ] `$_code` must match XML path `<carriers>/<code>` in `config.xml`
- [ ] `collectRates(RateRequest $request)` — return `Result` or `false`
- [ ] `getAllowedMethods()` — required by interface; returns `[code => title]`
- [ ] `RateRequest` key getters: `getDestCountryId()`, `getPackageWeight()`, `getPackageValue()`
- [ ] Return `false` from `collectRates()` to hide carrier; return `Result` with no methods also hides it
- [ ] Shipping origin config path: `shipping/origin/*`

### Order Status & State
- [ ] **State** = system constant (hardcoded); **Status** = admin-configurable label mapped to a state
- [ ] Core states: `new`, `pending_payment`, `processing`, `complete`, `closed`, `canceled`, `holded`
- [ ] Custom statuses created via Data Patch: `StatusFactory` → `save()` → `assignState()`
- [ ] `assignState($state, $isDefault, $visibleOnFront)` required before status is usable
- [ ] Orders with invoices **cannot** be cancelled
- [ ] `hold()` → `holded` state; `unHold()` → previous state
- [ ] `OrderManagementInterface` for high-level state changes; direct model for low-level

### Sales Rules
- [ ] Custom conditions extend `Magento\Rule\Model\Condition\AbstractCondition`
- [ ] `loadAttributeOptions()` declares available attributes
- [ ] `validate(AbstractModel $model)` — core logic; call `validateAttribute($value)`
- [ ] Custom actions extend `Magento\SalesRule\Model\Rule\Action\Discount\AbstractDiscount`
- [ ] `calculate(Rule $rule, AbstractItem $item, float $qty): Data` — must return `Data` object
- [ ] Standard types: `by_percent`, `by_fixed`, `cart_fixed`, `buy_x_get_y`
- [ ] Register custom conditions in `di.xml` via `CombineFactory` argument override
- [ ] Register custom actions in `di.xml` via `discountRules` array argument
