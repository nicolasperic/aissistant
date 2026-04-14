# Magento 2 Architect Exam — Advanced Customization Patterns
### Week 2 · Section 1 (Advanced Design) + Section 2 Introduction

---

## Table of Contents

1. [CartItemProcessorInterface — Custom Quote Item Data](#1-cartitemprocessorinterface--custom-quote-item-data)
2. [TotalsCollectorInterface and AbstractTotal — Extension Points](#2-totalsCollectorinterface-and-abstracttotal--extension-points)
3. [The Double-Counting Trap in Multi-Address Checkout](#3-the-double-counting-trap-in-multi-address-checkout)
4. [InvoiceOrderInterface — Order Lifecycle Hooks](#4-invoiceorderinterface--order-lifecycle-hooks)
5. [Custom Shipping Carrier](#5-custom-shipping-carrier)
6. [Custom Payment Method — CE vs EE Architecture](#6-custom-payment-method--ce-vs-ee-architecture)
7. [Offline vs Online vs Vault Payment Distinction](#7-offline-vs-online-vs-vault-payment-distinction)
8. [Critical Rule — Never Block the Checkout Critical Path](#8-critical-rule--never-block-the-checkout-critical-path)
9. [EE CommandPool vs CE MethodInterface — Side-by-Side Comparison](#9-ee-commandpool-vs-ce-methodinterface--side-by-side-comparison)
10. [Architectural Decision Frameworks](#10-architectural-decision-frameworks)
11. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. CartItemProcessorInterface — Custom Quote Item Data

### What Problem Does It Solve?

When a customer adds a product to the cart, Magento serializes the cart item into a data structure that flows through REST/GraphQL APIs. By default, only standard buy-request data (qty, product options) is captured. `CartItemProcessorInterface` lets you **inject custom data into the quote item's `product_option`** and **reconstruct it on the way back** from the API layer.

### Interface Contract

```php
// Magento\Quote\Model\Quote\Item\CartItemProcessorInterface
// NOTE: namespace is Model\Quote\Item, NOT Api
namespace Magento\Quote\Model\Quote\Item;

interface CartItemProcessorInterface
{
    /**
     * Convert CartItemInterface to a BuyRequest DataObject
     * Called when adding/updating an item via the REST API.
     *
     * @param \Magento\Quote\Api\Data\CartItemInterface $cartItem
     * @return \Magento\Framework\DataObject|null
     */
    public function convertToBuyRequest(
        \Magento\Quote\Api\Data\CartItemInterface $cartItem
    );

    /**
     * Process item data before returning it via the API.
     * Called when reading cart items (GET /carts/mine/items).
     *
     * @param \Magento\Quote\Api\Data\CartItemInterface $cartItem
     * @return \Magento\Quote\Api\Data\CartItemInterface
     */
    public function processOptions(
        \Magento\Quote\Api\Data\CartItemInterface $cartItem
    );
}
```

### Data Flow Diagram

```
REST POST /carts/mine/items
        |
        v
CartItemManagement::addItem()
        |
        v
CartItemProcessorInterface::convertToBuyRequest()   <-- YOUR HOOK (inbound)
        |
        v
Product::addToCart() / QuoteItem built
        |
        v
CartItemProcessorInterface::processOptions()        <-- YOUR HOOK (outbound)
        |
        v
REST response / GraphQL CartItemInterface
```

### Implementation Example

```php
// VendorName/ModuleName/Model/Quote/CartItemProcessor.php
namespace VendorName\ModuleName\Model\Quote;

use Magento\Quote\Model\Quote\Item\CartItemProcessorInterface;
use Magento\Quote\Api\Data\CartItemInterface;
use Magento\Quote\Api\Data\ProductOptionInterface;
use Magento\Quote\Api\Data\ProductOptionExtensionFactory;
use Magento\Framework\DataObject;
use Magento\Framework\DataObjectFactory;
use VendorName\ModuleName\Api\Data\CustomOptionInterface;
use VendorName\ModuleName\Api\Data\CustomOptionInterfaceFactory;

class CartItemProcessor implements CartItemProcessorInterface
{
    public function __construct(
        private readonly DataObjectFactory $objectFactory,
        private readonly ProductOptionExtensionFactory $extensionFactory,
        private readonly CustomOptionInterfaceFactory $customOptionFactory,
        private readonly ProductOptionInterface $productOption
    ) {}

    /**
     * Convert custom extension attributes to a buy-request DataObject
     */
    public function convertToBuyRequest(CartItemInterface $cartItem): ?DataObject
    {
        $productOption = $cartItem->getProductOption();
        if (!$productOption) {
            return null;
        }

        $extensionAttributes = $productOption->getExtensionAttributes();
        if (!$extensionAttributes) {
            return null;
        }

        $customOption = $extensionAttributes->getCustomOption();
        if (!$customOption) {
            return null;
        }

        // Build a DataObject Magento passes to addProduct()
        return $this->objectFactory->create([
            'data' => [
                'custom_option_value' => $customOption->getValue(),
                'custom_option_key'   => $customOption->getKey(),
            ]
        ]);
    }

    /**
     * Populate extension attributes when the cart item is read via API
     */
    public function processOptions(CartItemInterface $cartItem): CartItemInterface
    {
        $item = $cartItem->getQuoteItem();
        $value = $item?->getOptionByCode('custom_option_value');

        if (!$value) {
            return $cartItem;
        }

        $customOption = $this->customOptionFactory->create()
            ->setValue($value->getValue());

        $productOption = $cartItem->getProductOption()
            ?? $this->productOption;

        $extensionAttributes = $productOption->getExtensionAttributes()
            ?? $this->extensionFactory->create();

        $extensionAttributes->setCustomOption($customOption);
        $productOption->setExtensionAttributes($extensionAttributes);
        $cartItem->setProductOption($productOption);

        return $cartItem;
    }
}
```

### DI Registration

Processors are registered in `Magento\Quote\Model\Quote\Item\Repository`'s `cartItemProcessors` array — **not** `CartItemOptionsProcessor` (that class takes an internal pool object, not a direct processors array).

```xml
<!-- VendorName/ModuleName/etc/di.xml -->
<type name="Magento\Quote\Model\Quote\Item\Repository">
    <arguments>
        <argument name="cartItemProcessors" xsi:type="array">
            <item name="custom_option" xsi:type="object">
                VendorName\ModuleName\Model\Quote\CartItemProcessor
            </item>
        </argument>
    </arguments>
</type>
```

> **Exam focus:**
> - `CartItemProcessorInterface` is in **`Magento\Quote\Model\Quote\Item`** namespace — NOT `Magento\Quote\Api`.
> - Two methods: `convertToBuyRequest()` (inbound) and `processOptions()` (outbound). Know which direction each flows.
> - Custom data must be stored on the quote item as a **quote item option** (not a flat column) to survive serialization.
> - The processor is registered in **`Magento\Quote\Model\Quote\Item\Repository`**'s `cartItemProcessors` array — not via an event, not in `CartItemOptionsProcessor`.
> - Extension attributes on `ProductOptionInterface` are the correct mechanism for adding typed custom data to cart items via REST/GraphQL.

---

## 2. TotalsCollectorInterface and AbstractTotal — Extension Points

### Architecture Overview

Magento's totals system is a **strategy pipeline**. The `TotalsCollector` iterates over registered `Total` models in a defined sort order and asks each one to modify the quote address totals.

```
TotalsCollector::collectAddressTotals($quote, $shippingAssignment, $total)
        |
        +-> foreach $this->collectorList->getCollectors() as $collector:
                |
                +-> AbstractTotal::collect($quote, $shippingAssignment, $total)
                |       (modifies $total object in place)
                |
                +-> AbstractTotal::fetch($quote, $total)
                        (returns array for JS totals display)
```

### AbstractTotal

```php
// Magento\Quote\Model\Quote\Address\Total\AbstractTotal
// Implements CollectorInterface and ReaderInterface
// collect() and fetch() are CONCRETE (not abstract) — override them in subclasses
namespace Magento\Quote\Model\Quote\Address\Total;

abstract class AbstractTotal implements CollectorInterface, ReaderInterface, ResetAfterRequestInterface
{
    /**
     * Collect the total — modifies $total in place.
     * Concrete base implementation resets code-level amounts and sets address.
     * Override this in your subclass; always call parent::collect() first.
     *
     * @param \Magento\Quote\Model\Quote                          $quote
     * @param \Magento\Quote\Api\Data\ShippingAssignmentInterface $shippingAssignment
     * @param \Magento\Quote\Model\Quote\Address\Total            $total
     * @return $this
     */
    public function collect(
        \Magento\Quote\Model\Quote $quote,
        \Magento\Quote\Api\Data\ShippingAssignmentInterface $shippingAssignment,
        \Magento\Quote\Model\Quote\Address\Total $total
    ) {
        $this->_setAddress($shippingAssignment->getShipping()->getAddress());
        $this->_setTotal($total);
        $this->_setAmount(0);
        $this->_setBaseAmount(0);
        return $this;
    }

    /**
     * Fetch — returns data structure for the JS totals block.
     * Return empty array [] to exclude from frontend display.
     * No PHP return type hint (matches @api interface pattern).
     *
     * @param \Magento\Quote\Model\Quote         $quote
     * @param \Magento\Quote\Model\Quote\Address\Total $total
     * @return array
     */
    public function fetch(
        \Magento\Quote\Model\Quote $quote,
        \Magento\Quote\Model\Quote\Address\Total $total
    ) {
        return [];
    }
}
```

### Registering a Custom Total

```xml
<!-- VendorName/ModuleName/etc/sales.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Sales:etc/sales.xsd">
    <section name="quote">
        <group name="totals">
            <!-- sortOrder determines collection sequence. -->
            <!-- Place AFTER tax (450) and shipping (350) if you depend on them. -->
            <item name="vendor_surcharge" instance="VendorName\ModuleName\Model\Total\Surcharge"
                  sort_order="500"/>
        </group>
    </section>
</config>
```

### Correct Implementation Pattern

```php
// VendorName/ModuleName/Model/Total/Surcharge.php
namespace VendorName\ModuleName\Model\Total;

use Magento\Quote\Api\Data\ShippingAssignmentInterface;
use Magento\Quote\Model\Quote;
use Magento\Quote\Model\Quote\Address\Total;
use Magento\Quote\Model\Quote\Address\Total\AbstractTotal;

class Surcharge extends AbstractTotal
{
    private const CODE = 'vendor_surcharge';

    public function __construct()
    {
        $this->setCode(self::CODE);
    }

    public function collect(
        Quote $quote,
        ShippingAssignmentInterface $shippingAssignment,
        Total $total
    ): self {
        // CRITICAL: Always call parent::collect() to reset code-level totals.
        parent::collect($quote, $shippingAssignment, $total);

        // Guard: only process the shipping address, not billing.
        // This is the multi-address double-count guard.
        $items = $shippingAssignment->getItems();
        if (empty($items)) {
            return $this;
        }

        $surcharge = $this->calculateSurcharge($quote);

        $total->setTotalAmount(self::CODE, $surcharge);
        $total->setBaseTotalAmount(self::CODE, $surcharge);

        // Also update grand total
        $total->setGrandTotal($total->getGrandTotal() + $surcharge);
        $total->setBaseGrandTotal($total->getBaseGrandTotal() + $surcharge);

        return $this;
    }

    public function fetch(Quote $quote, Total $total): array
    {
        $amount = $total->getTotalAmount(self::CODE);
        if (!$amount) {
            return [];  // Return [] to suppress from JS totals display
        }

        return [
            'code'  => self::CODE,
            'title' => __('Custom Surcharge'),
            'value' => $amount,
        ];
    }

    private function calculateSurcharge(Quote $quote): float
    {
        // Business logic here — do NOT call external APIs synchronously!
        return 5.00;
    }
}
```

### Sort Order Reference Table

| Total Code | Default Sort Order | Source Module | Depends On |
|---|---|---|---|
| `subtotal` | 100 | module-quote | (base) |
| `discount` | 300 | module-sales-rule | subtotal |
| `shipping` | 350 | module-quote | subtotal |
| `tax` | 450 | module-tax | shipping |
| `grand_total` | 550 | module-quote | all |
| Your custom total | 400–549 (typical) | your module | varies |

> **Exam focus:**
> - `collect()` in `AbstractTotal` is **NOT abstract** — it is a concrete method with a default implementation that resets amounts. Override it in your subclass; `CollectorInterface` defines the contract.
> - `fetch()` returns `[]` (empty array) to suppress a total from the JS totals display — **not** `null`. The base class returns `[]`.
> - `collect()` receives a `ShippingAssignmentInterface` — **not** the address directly. This is the abstraction Magento uses for multi-address checkout.
> - Always use `$total->setTotalAmount()` / `$total->setBaseTotalAmount()` rather than setting address fields directly.
> - Sort order: shipping=**350**, discount=**300**, tax=450, grand_total=550 (exact values from core sales.xml files).
> - Sort order in `sales.xml` is **global** — extension sort conflicts cause hard-to-debug subtotal errors.

---

## 3. The Double-Counting Trap in Multi-Address Checkout

### Why It Happens

In standard single-address checkout, `collectAddressTotals()` is called **once** for the single shipping address. In multi-address checkout (`\Magento\Multishipping`), `collectAddressTotals()` is called **once per shipping address**. If your `collect()` method reads from `$quote` (not `$shippingAssignment`) and accumulates a value, it doubles (or triples) for every address.

### The Bug Pattern

```php
// WRONG — reads from $quote directly, ignores $shippingAssignment
public function collect(
    Quote $quote,
    ShippingAssignmentInterface $shippingAssignment,
    Total $total
): self {
    parent::collect($quote, $shippingAssignment, $total);

    // BUG: $quote->getItemsCollection() contains ALL items across ALL addresses.
    // When called for address 2, items from address 1 are still here.
    $allItems = $quote->getItemsCollection();
    $surcharge = 0.0;
    foreach ($allItems as $item) {
        $surcharge += $item->getQty() * 0.50; // per-item fee
    }

    $total->setTotalAmount(self::CODE, $surcharge);
    $total->setBaseTotalAmount(self::CODE, $surcharge);
    $total->setGrandTotal($total->getGrandTotal() + $surcharge);
    $total->setBaseGrandTotal($total->getBaseGrandTotal() + $surcharge);

    return $this;
}
```

### The Correct Pattern

```php
// CORRECT — always iterate $shippingAssignment->getItems()
public function collect(
    Quote $quote,
    ShippingAssignmentInterface $shippingAssignment,
    Total $total
): self {
    parent::collect($quote, $shippingAssignment, $total);

    // Guard: no items assigned to this address? bail out.
    $items = $shippingAssignment->getItems();
    if (empty($items)) {
        return $this;
    }

    // Only items assigned to THIS shipping address
    $surcharge = 0.0;
    foreach ($items as $item) {
        if ($item->getParentItem()) {
            continue; // skip child items of bundles/configurable
        }
        $surcharge += $item->getQty() * 0.50;
    }

    $total->setTotalAmount(self::CODE, $surcharge);
    $total->setBaseTotalAmount(self::CODE, $surcharge);
    $total->setGrandTotal($total->getGrandTotal() + $surcharge);
    $total->setBaseGrandTotal($total->getBaseGrandTotal() + $surcharge);

    return $this;
}
```

### Conceptual Diagram

```
Multi-Address Checkout
========================

Quote
 |
 +-- ShippingAssignment[0]  -> Address: 123 Main St
 |       Items: [ItemA x2, ItemB x1]
 |
 +-- ShippingAssignment[1]  -> Address: 456 Oak Ave
         Items: [ItemC x1]

collect() called for ShippingAssignment[0]:
  WRONG: iterates quote.items = [A, B, C] -> surcharge = 4 * 0.50 = $2.00
  RIGHT: iterates assignment.items = [A, B] -> surcharge = 3 * 0.50 = $1.50

collect() called for ShippingAssignment[1]:
  WRONG: iterates quote.items = [A, B, C] -> surcharge += $2.00 (DOUBLE COUNT!)
  RIGHT: iterates assignment.items = [C]   -> surcharge = 1 * 0.50 = $0.50

Final (WRONG) = $4.00  (should be $2.00)
Final (RIGHT) = $2.00  (correct)
```

> **Exam focus:**
> - The guard `if (empty($shippingAssignment->getItems())) { return $this; }` is the canonical multi-address safety check.
> - Skip child items (`$item->getParentItem()`) to avoid double-counting configurable/bundle product rows.
> - The error is **silent** — no exception is thrown. The order total is simply wrong. This is exactly the kind of subtle bug the architect exam tests.
> - The root cause is **reading scope-wider data** (`$quote`) instead of **scope-correct data** (`$shippingAssignment`).

---

## 4. InvoiceOrderInterface — Order Lifecycle Hooks

### The Invoice Pipeline

The `InvoiceOrder` service command (`Magento\Sales\Api\InvoiceOrderInterface`) is a proper **service contract** that orchestrates invoicing. It replaced ad-hoc invoice creation and provides consistent hooks.

```
InvoiceOrderInterface::execute($orderId, $capture, $items, $notify, ...)
        |
        +-> InvoiceDocumentFactory::create()        // build Invoice object
        |
        +-> PaymentAdapterInterface::pay()          // capture payment if requested
        |
        +-> ResourceModel\Order\Invoice::save()     // persist
        |
        +-> Notifier::notify()                      // email if $notify=true
        |
        +-> Emitter: sales_order_invoice_pay
        +-> Emitter: sales_order_invoice_register
        +-> Emitter: sales_order_invoice_save_after
```

### Service Contract Interface

```php
// Magento\Sales\Api\InvoiceOrderInterface
// NOTE: No PHP type hints on parameters — @api interface pattern
interface InvoiceOrderInterface
{
    /**
     * @param int   $orderId
     * @param bool  $capture    true = online capture, false = offline
     * @param \Magento\Sales\Api\Data\InvoiceItemCreationInterface[] $items
     * @param bool  $notify
     * @param bool  $appendComment
     * @param \Magento\Sales\Api\Data\InvoiceCommentCreationInterface|null $comment
     * @param \Magento\Sales\Api\Data\InvoiceCreationArgumentsInterface|null $arguments
     * @return int  Invoice ID
     */
    public function execute(
        $orderId,
        $capture = false,
        array $items = [],
        $notify = false,
        $appendComment = false,
        ?\Magento\Sales\Api\Data\InvoiceCommentCreationInterface $comment = null,
        ?\Magento\Sales\Api\Data\InvoiceCreationArgumentsInterface $arguments = null
    );
}
```

### Plugin Hook Points

Because `InvoiceOrderInterface` is a service contract, you can add **around/before/after plugins** cleanly:

```php
// VendorName/ModuleName/Plugin/InvoiceOrderPlugin.php
namespace VendorName\ModuleName\Plugin;

use Magento\Sales\Api\InvoiceOrderInterface;

class InvoiceOrderPlugin
{
    public function beforeExecute(
        InvoiceOrderInterface $subject,
        int $orderId,
        bool $capture = false,
        array $items = [],
        // ... other params
    ): array {
        // Validate or modify args before invoicing
        return [$orderId, $capture, $items];
    }

    public function afterExecute(
        InvoiceOrderInterface $subject,
        int $invoiceId,
        int $orderId
        // Note: afterExecute receives result first, then original args
    ): int {
        // React to successful invoice creation
        // e.g., trigger ERP sync (via message queue — never synchronously!)
        return $invoiceId;
    }
}
```

```xml
<!-- di.xml -->
<type name="Magento\Sales\Api\InvoiceOrderInterface">
    <plugin name="vendor_invoice_hook"
            type="VendorName\ModuleName\Plugin\InvoiceOrderPlugin"/>
</type>
```

### Related Interfaces

| Interface | Purpose |
|---|---|
| `InvoiceOrderInterface` | Create invoice, optionally capture |
| `RefundOrderInterface` | Create credit memo from order |
| `RefundInvoiceInterface` | Create credit memo from invoice |
| `ShipOrderInterface` | Create shipment |

> **Exam focus:**
> - `InvoiceOrderInterface::execute()` has **no PHP type hints** on parameters — consistent with all `@api` interfaces in Magento's service contract layer.
> - `$capture = true` triggers **online payment capture** through the payment method's `capture()` command.
> - These service contracts replaced `$invoice->register()` + `$invoice->pay()` — using the old pattern is an anti-pattern in modern Magento.
> - Plugin on the **interface** (`InvoiceOrderInterface`), not the implementation class — this respects the service contract and survives implementation swaps.
> - `ShipOrderInterface`, `RefundOrderInterface`, and `RefundInvoiceInterface` follow the same pipeline pattern.

---

## 5. Custom Shipping Carrier

### Class Hierarchy

```
CarrierInterface (Magento\Shipping\Model\Carrier\CarrierInterface)
        ^
        |
AbstractCarrier (Magento\Shipping\Model\Carrier\AbstractCarrier)
        ^
        |
YourCarrier
```

### AbstractCarrier Key Responsibilities

- Reads carrier config from `carriers/[code]/` in `core_config_data`
- Provides `checkAvailableShipCountries()`, `getConfigData()`, etc.
- You override `collectRates()` and `getAllowedMethods()`

### Minimal Implementation

```php
// VendorName/ModuleName/Model/Carrier/CustomCarrier.php
namespace VendorName\ModuleName\Model\Carrier;

use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Quote\Model\Quote\Address\RateRequest;
use Magento\Quote\Model\Quote\Address\RateResult\ErrorFactory;
use Magento\Quote\Model\Quote\Address\RateResult\MethodFactory;
use Magento\Shipping\Model\Carrier\AbstractCarrier;
use Magento\Shipping\Model\Carrier\CarrierInterface;
use Magento\Shipping\Model\Rate\Result;
use Magento\Shipping\Model\Rate\ResultFactory;
use Psr\Log\LoggerInterface;

class CustomCarrier extends AbstractCarrier implements CarrierInterface
{
    // Carrier code must match system.xml and config.xml keys
    protected $_code = 'vendorcustom';
    protected $_isFixed = true; // flat rate — no external API

    public function __construct(
        ScopeConfigInterface $scopeConfig,
        ErrorFactory $rateErrorFactory,
        LoggerInterface $logger,
        private readonly ResultFactory $rateResultFactory,
        private readonly MethodFactory $rateMethodFactory,
        array $data = []
    ) {
        parent::__construct($scopeConfig, $rateErrorFactory, $logger, $data);
    }

    /**
     * Collect and return shipping rates.
     * Return false to suppress this carrier completely.
     */
    public function collectRates(RateRequest $request): Result|bool
    {
        // Check active flag from system config
        if (!$this->getConfigFlag('active')) {
            return false;
        }

        /** @var Result $result */
        $result = $this->rateResultFactory->create();

        // IMPORTANT: For real external carrier APIs, NEVER call synchronously
        // if the network could be slow. Consider caching aggressively.
        $price = (float) $this->getConfigData('price');
        $handlingFee = $this->getFinalPriceWithHandlingFee($price);

        /** @var \Magento\Quote\Model\Quote\Address\RateResult\Method $method */
        $method = $this->rateMethodFactory->create();
        $method->setCarrier($this->_code);
        $method->setCarrierTitle($this->getConfigData('title'));
        $method->setMethod('standard');
        $method->setMethodTitle('Standard Delivery');
        $method->setPrice($handlingFee);
        $method->setCost($price);

        $result->append($method);

        return $result;
    }

    /**
     * Must return array of method_code => method_title
     */
    public function getAllowedMethods(): array
    {
        return [
            'standard' => $this->getConfigData('name'),
        ];
    }
}
```

### System Config Registration

```xml
<!-- VendorName/ModuleName/etc/config.xml — carrier defaults -->
<config>
    <default>
        <carriers>
            <vendorcustom>
                <active>0</active>
                <model>VendorName\ModuleName\Model\Carrier\CustomCarrier</model>
                <title>Vendor Shipping</title>
                <name>Standard Delivery</name>
                <price>5.00</price>
                <handling_type>F</handling_type>
                <sallowspecific>0</sallowspecific>
                <sort_order>15</sort_order>
            </vendorcustom>
        </carriers>
    </default>
</config>
```

```xml
<!-- VendorName/ModuleName/etc/adminhtml/system.xml — UI -->
<section id="carriers">
    <group id="vendorcustom" translate="label" sortOrder="50" showInDefault="1" showInWebsite="1" showInStore="1">
        <label>Vendor Custom Carrier</label>
        <field id="active" translate="label" type="select" sortOrder="10" showInDefault="1" showInWebsite="1" showInStore="0">
            <label>Enabled</label>
            <source_model>Magento\Config\Model\Config\Source\Yesno</source_model>
        </field>
        <field id="title" translate="label" type="text" sortOrder="20" showInDefault="1" showInWebsite="1" showInStore="1">
            <label>Title</label>
        </field>
        <field id="price" translate="label" type="text" sortOrder="30" showInDefault="1" showInWebsite="1" showInStore="0">
            <label>Price</label>
        </field>
    </group>
</section>
```

### RateRequest Key Properties

| Property | Meaning |
|---|---|
| `getAllItems()` | Quote items in cart |
| `getDestCountryId()` | Destination country code |
| `getDestPostcode()` | Destination postcode |
| `getPackageWeight()` | Total package weight |
| `getPackageValue()` | Total declared value |
| `getFreeShipping()` | Whether free shipping applies |
| `getWebsiteId()` | Current website scope |

> **Exam focus:**
> - `_code` must match the XML key exactly — a mismatch causes the carrier to silently fail.
> - Returning `false` from `collectRates()` hides the carrier; returning an **empty `Result`** shows an error to the customer.
> - `getAllowedMethods()` must return every method code that `collectRates()` can produce — used for admin shipping method selection and tracking.
> - `_isFixed = true` means the price is from config; `false` means it's calculated. This affects how Magento applies handling fees.
> - The `model` key in `config.xml` is how Magento instantiates the carrier — it is **not** set in `di.xml`.

---

## 6. Custom Payment Method — CE vs EE Architecture

### Community Edition (CE) — MethodInterface

In CE, a payment method is a single class implementing `MethodInterface` (or extending `AbstractMethod`).

```php
// Magento\Payment\Model\MethodInterface — key methods
// NOTE: No PHP return type hints — @api interface
interface MethodInterface
{
    public function getCode();
    public function getTitle();
    public function isAvailable(?\Magento\Quote\Api\Data\CartInterface $quote = null);

    // Authorization
    public function authorize(\Magento\Payment\Model\InfoInterface $payment, $amount);

    // Capture (online)
    public function capture(\Magento\Payment\Model\InfoInterface $payment, $amount);

    // Void (cancel authorized amount)
    public function void(\Magento\Payment\Model\InfoInterface $payment);

    // Refund (online)
    public function refund(\Magento\Payment\Model\InfoInterface $payment, $amount);

    // Order (offline — just record the intent)
    public function order(\Magento\Payment\Model\InfoInterface $payment, $amount);
}
```

#### CE Minimal Implementation

```php
// VendorName/ModuleName/Model/Payment/CePaymentMethod.php
namespace VendorName\ModuleName\Model\Payment;

use Magento\Payment\Model\Method\AbstractMethod;

class CePaymentMethod extends AbstractMethod
{
    protected $_code = 'vendor_ce_payment';
    protected $_canAuthorize = true;
    protected $_canCapture = true;
    protected $_canRefund = true;
    protected $_canVoid = true;
    protected $_isGateway = true;

    public function authorize(
        \Magento\Payment\Model\InfoInterface $payment,
        $amount
    ): self {
        // Call your payment gateway SDK here
        // Store transaction ID on $payment
        $payment->setTransactionId('auth-txn-12345');
        $payment->setIsTransactionClosed(false);

        return $this;
    }

    public function capture(
        \Magento\Payment\Model\InfoInterface $payment,
        $amount
    ): self {
        $authTxnId = $payment->getParentTransactionId();
        // Capture against authorization
        $payment->setTransactionId('cap-txn-67890');
        $payment->setIsTransactionClosed(true);

        return $this;
    }
}
```

#### CE config.xml registration

```xml
<config>
    <default>
        <payment>
            <vendor_ce_payment>
                <active>0</active>
                <model>VendorName\ModuleName\Model\Payment\CePaymentMethod</model>
                <order_status>pending</order_status>
                <title>Vendor CE Payment</title>
                <payment_action>authorize</payment_action>
                <can_authorize>1</can_authorize>
                <can_capture>1</can_capture>
                <can_refund>1</can_refund>
            </vendor_ce_payment>
        </payment>
    </default>
</config>
```

---

### Enterprise Edition (EE) — CommandPool + CommandManager

EE (Adobe Commerce) introduces the **Gateway** architecture. Instead of one monolithic class, each payment action (authorize, capture, refund, void, cancel) is a **separate Command** class. They are wired together via a `CommandPool` in `di.xml`.

```
Payment Request
      |
      v
PaymentDataObjectFactory
      |
      v
CommandManager::executeByCode('authorize', $commandSubject)
      |
      v
CommandPool::get('authorize')
      |
      v
GatewayCommand
      |
      +-> RequestBuilderInterface::build()    // build API request
      |
      +-> TransferFactoryInterface::create()  // create HTTP transfer
      |
      +-> ClientInterface::placeRequest()     // execute HTTP call
      |
      +-> ResponseValidatorInterface::validate()
      |
      +-> HandlerInterface::handle()          // update $payment with result
```

#### EE di.xml CommandPool Configuration

```xml
<!-- VendorName/ModuleName/etc/di.xml -->

<!-- 1. Define each Command -->
<virtualType name="VendorModuleAuthorizeCommand"
             type="Magento\Payment\Gateway\Command\GatewayCommand">
    <arguments>
        <argument name="requestBuilder" xsi:type="object">
            VendorName\ModuleName\Gateway\Request\AuthorizeRequest
        </argument>
        <argument name="transferFactory" xsi:type="object">
            VendorName\ModuleName\Gateway\Http\TransferFactory
        </argument>
        <argument name="client" xsi:type="object">
            VendorName\ModuleName\Gateway\Http\Client\AuthorizeClient
        </argument>
        <argument name="validator" xsi:type="object">
            VendorName\ModuleName\Gateway\Validator\AuthorizeValidator
        </argument>
        <argument name="handler" xsi:type="object">
            VendorName\ModuleName\Gateway\Response\AuthorizeHandler
        </argument>
    </arguments>
</virtualType>

<virtualType name="VendorModuleCaptureCommand"
             type="Magento\Payment\Gateway\Command\GatewayCommand">
    <arguments>
        <argument name="requestBuilder" xsi:type="object">
            VendorName\ModuleName\Gateway\Request\CaptureRequest
        </argument>
        <argument name="transferFactory" xsi:type="object">
            VendorName\ModuleName\Gateway\Http\TransferFactory
        </argument>
        <argument name="client" xsi:type="object">
            VendorName\ModuleName\Gateway\Http\Client\CaptureClient
        </argument>
        <argument name="handler" xsi:type="object">
            VendorName\ModuleName\Gateway\Response\CaptureHandler
        </argument>
    </arguments>
</virtualType>

<!-- 2. Build the CommandPool -->
<virtualType name="VendorModuleCommandPool"
             type="Magento\Payment\Gateway\Command\CommandPool">
    <arguments>
        <argument name="commands" xsi:type="array">
            <item name="authorize"       xsi:type="string">VendorModuleAuthorizeCommand</item>
            <item name="capture"         xsi:type="string">VendorModuleCaptureCommand</item>
            <item name="void"            xsi:type="string">VendorModuleVoidCommand</item>
            <item name="refund"          xsi:type="string">VendorModuleRefundCommand</item>
            <item name="cancel"          xsi:type="string">VendorModuleCancelCommand</item>
            <item name="vault_authorize" xsi:type="string">VendorModuleVaultAuthorizeCommand</item>
        </argument>
    </arguments>
</virtualType>

<!-- 3. Wire CommandPool into the payment Facade (Adapter) -->
<virtualType name="VendorModulePaymentFacade"
             type="Magento\Payment\Model\Method\Adapter">
    <arguments>
        <argument name="code" xsi:type="string">vendor_ee_payment</argument>
        <argument name="formBlockType" xsi:type="string">
            Magento\Payment\Block\Form
        </argument>
        <argument name="infoBlockType" xsi:type="string">
            Magento\Payment\Block\Info
        </argument>
        <argument name="valueHandlerPool" xsi:type="object">
            VendorModuleValueHandlerPool
        </argument>
        <argument name="commandPool" xsi:type="object">
            VendorModuleCommandPool
        </argument>
    </arguments>
</virtualType>
```

#### ValueHandlerPool — Replaces config.xml flags

```xml
<!-- Instead of _canAuthorize flags, EE uses ValueHandlers -->
<virtualType name="VendorModuleValueHandlerPool"
             type="Magento\Payment\Gateway\Config\ValueHandlerPool">
    <arguments>
        <argument name="handlers" xsi:type="array">
            <item name="default" xsi:type="string">
                VendorModuleConfigValueHandler
            </item>
        </argument>
    </arguments>
</virtualType>

<virtualType name="VendorModuleConfigValueHandler"
             type="Magento\Payment\Gateway\Config\ConfigValueHandler">
    <arguments>
        <argument name="configInterface" xsi:type="object">
            VendorModuleConfig
        </argument>
    </arguments>
</virtualType>

<virtualType name="VendorModuleConfig"
             type="Magento\Payment\Gateway\Config\Config">
    <arguments>
        <argument name="methodCode" xsi:type="string">vendor_ee_payment</argument>
    </arguments>
</virtualType>
```

---

### CE vs EE Architecture Comparison

```
CE Architecture:
+-------------------+
| CePaymentMethod   |  (AbstractMethod subclass)
|                   |
| + authorize()     |  <-- all actions in one class
| + capture()       |
| + refund()        |
| + void()          |
+-------------------+
         |
   config.xml: model = this class

EE Architecture:
+---------------------------+
| Adapter (Facade)          |  (virtual type in di.xml)
|  commandPool: ----+       |
+-------------------+-------+
                    |
         +----------+----------+
         |                     |
   CommandPool            ValueHandlerPool
    |                          |
    +-- authorize -> Command   +-- default -> ConfigValueHandler
    +-- capture   -> Command
    +-- refund    -> Command
    +-- void      -> Command
    +-- vault_*   -> Command
         |
    GatewayCommand
         |
    RequestBuilder -> TransferFactory -> Client -> Validator -> Handler
```

> **Exam focus:**
> - EE uses `Magento\Payment\Model\Method\Adapter` as the facade — it is **not** subclassed; it is configured entirely in `di.xml` as a `virtualType`.
> - Each payment action in EE is a **separate class** — this is the **Single Responsibility Principle** applied at the payment method level.
> - The `CommandPool` key names (`authorize`, `capture`, etc.) must match what `CommandManager` calls internally — they are **not** arbitrary.
> - In CE, `payment_action` in `config.xml` controls whether `authorize()` or `capture()` is called at order placement. In EE, the same `payment_action` config key still applies but maps to the corresponding command.
> - `vault_authorize` command is required for the **Vault** (stored card) flow — its absence causes vault payments to fail silently. `VaultPaymentInterface` defines constants `VAULT_AUTHORIZE_COMMAND = 'vault_authorize'` and `VAULT_SALE_COMMAND = 'vault_sale'`.

---

## 7. Offline vs Online vs Vault Payment Distinction

### Decision Matrix

| Type | External API Call? | When Called | Examples |
|---|---|---|---|
| **Offline** | No | Order placement records intent only | Check/Money Order, Bank Transfer, PO Number |
| **Online (Auth)** | Yes, at authorization | `place order` → `authorize()` | Braintree Auth, Stripe Auth |
| **Online (Auth+Capture)** | Yes, immediately | `place order` → `authorize_capture()` | PayPal Express, Braintree Sale |
| **Online (Capture)** | Yes, at invoice | `invoice creation` → `capture()` | Most gateways with separate auth/capture |
| **Vault** | Yes (token-based) | Subsequent orders using saved card | Braintree Vault, Stripe Customer ID |

### Offline Payment (CE Example)

```php
// No external API calls — just set the payment information
class CheckMoneyOrder extends AbstractMethod
{
    protected $_code = 'checkmo';
    protected $_isOffline = true;    // CRITICAL flag

    // No authorize(), capture(), refund() needed
    // The order() method is called but just records the intent
}
```

### Online vs Offline Config Flag

```xml
<!-- config.xml -->
<payment_action>authorize</payment_action>       <!-- online: auth only -->
<payment_action>authorize_capture</payment_action> <!-- online: auth + capture -->
<payment_action>order</payment_action>           <!-- offline: no API call -->
```

### Vault Architecture

The Vault stores **payment tokens** (not raw card numbers) so customers can re-use saved payment methods.

```
First payment (standard flow):
  Customer enters card -> authorize/capture -> Gateway stores token
        |
  Magento: PaymentTokenManagementInterface::saveTokenWithPaymentLink()
        |
  Token stored in vault_payment_token table

Subsequent payment (vault flow):
  Customer selects saved card -> VaultPaymentInterface::isActive()
        |
  CommandPool: get('vault_authorize') or get('vault_sale')
        |
  RequestBuilder uses token (not raw card data) -> Gateway API
```

```php
// VendorName/ModuleName/Gateway/Request/VaultAuthorizeRequest.php
namespace VendorName\ModuleName\Gateway\Request;

use Magento\Payment\Gateway\Data\PaymentDataObjectInterface;
use Magento\Payment\Gateway\Request\BuilderInterface;
use Magento\Vault\Api\Data\PaymentTokenInterface;

class VaultAuthorizeRequest implements BuilderInterface
{
    public function build(array $buildSubject): array
    {
        /** @var PaymentDataObjectInterface $payment */
        $payment = $buildSubject['payment'];
        $extensionAttributes = $payment->getPayment()->getExtensionAttributes();

        /** @var PaymentTokenInterface $token */
        $token = $extensionAttributes->getVaultPaymentToken();

        return [
            'payment_method_token' => $token->getGatewayToken(),
            'amount'               => $buildSubject['amount'],
        ];
    }
}
```

> **Exam focus:**
> - `$_isOffline = true` completely bypasses the payment gateway calls — the method's `authorize()` / `capture()` are never invoked.
> - Vault tokens are stored in `vault_payment_token` table, linked to both customer and order via `vault_payment_token_order_payment_link` table.
> - `VaultPaymentInterface` (in `Magento\Vault\Model`) extends `MethodInterface` — a vault method is a **separate payment method code** (e.g., `braintree_cc_vault`) that delegates to the parent gateway via token.
> - In EE, vault commands (`vault_authorize`, `vault_sale`) must be explicitly declared in the CommandPool.
> - **Never store raw card numbers** — always store the gateway-provided token.

---

## 8. Critical Rule — Never Block the Checkout Critical Path

### The Rule

> **NEVER make synchronous external API calls inside:**
> - `place_order` observer
> - Plugin on `PlaceOrderInterface::execute()`
> - Plugin on `PaymentInterface` methods during checkout
> - `CartItemProcessorInterface::convertToBuyRequest()`
> - Any code in the checkout critical path before the order ID is returned

### Why This Is Critical (Architect-Level Reasoning)

```
Checkout Critical Path (simplified):
=====================================

Browser -> POST /rest/V1/carts/mine/payment-information
                |
                v
           PaymentInformationManagement::savePaymentInformationAndPlaceOrder()
                |
                v
           QuoteManagement::placeOrder()       <- CRITICAL PATH START
                |
                +-> collectTotals()
                +-> createOrder()
                +-> payment->authorize()       <- ONLY this should be external
                +-> order->save()
                +-> emit: sales_order_place_after  <- DO NOT block here
                |
                v
           return $orderId                     <- CRITICAL PATH END
                |
                v
           Browser receives order ID / confirmation

If you add a synchronous HTTP call in place_order observer:
  - Gateway timeout (10s+) = browser timeout = abandoned cart
  - Database transaction stays open = lock contention = cascading failures
  - Customer clicks "Place Order" twice = duplicate orders
```

### The Anti-Pattern

```php
// WRONG: Synchronous ERP call in observer
class SyncOrderToErpObserver implements ObserverInterface
{
    public function __construct(
        private readonly ErpApiClient $erpClient  // makes HTTP calls
    ) {}

    public function execute(Observer $observer): void
    {
        $order = $observer->getEvent()->getOrder();

        // BLOCKS: This HTTP call could take 1-30 seconds
        // If ERP is down, order placement FAILS for the customer
        $this->erpClient->createOrder([
            'order_id'    => $order->getIncrementId(),
            'customer_id' => $order->getCustomerId(),
            // ...
        ]);
    }
}
```

### The Correct Pattern — Message Queue

```php
// CORRECT: Publish to message queue, return immediately
class QueueOrderForErpObserver implements ObserverInterface
{
    public function __construct(
        private readonly PublisherInterface $publisher  // RabbitMQ/MySQL queue
    ) {}

    public function execute(Observer $observer): void
    {
        $order = $observer->getEvent()->getOrder();

        // Returns immediately — no external HTTP call
        $this->publisher->publish(
            'vendor.erp.order.sync',          // topic name
            ['order_id' => $order->getId()]   // lightweight payload
        );
    }
}

// Separate consumer (runs in a different process):
class ErpOrderSyncConsumer
{
    public function __construct(
        private readonly ErpApiClient $erpClient,
        private readonly OrderRepositoryInterface $orderRepository
    ) {}

    public function process(array $data): void
    {
        $order = $this->orderRepository->get($data['order_id']);
        // This runs in a worker process — no checkout impact
        $this->erpClient->createOrder(...);
    }
}
```

```xml
<!-- VendorName/ModuleName/etc/communication.xml -->
<config>
    <topic name="vendor.erp.order.sync"
           request="VendorName\ModuleName\Api\Data\ErpOrderDataInterface"/>
</config>
```

```xml
<!-- VendorName/ModuleName/etc/queue_topology.xml -->
<config>
    <exchange name="magento" type="topic" connection="amqp">
        <binding id="vendorErpOrderSync"
                 destinationType="queue"
                 destination="vendor.erp.order.sync"
                 topic="vendor.erp.order.sync"/>
    </exchange>
</config>
```

### The Architect's Decision Framework

```
Is this operation required BEFORE the order ID is returned?
  |
  YES -> Is it a payment API call? (authorize/capture)
  |       YES -> OK, it belongs here (PaymentMethod::authorize())
  |       NO  -> REDESIGN: can this be async?
  |
  NO  -> USE MESSAGE QUEUE
          - Observer publishes lightweight message
          - Consumer handles the heavy lifting asynchronously
          - ERP, fulfillment, notification systems, analytics
```

> **Exam focus:**
> - This is the **highest-priority rule** for the checkout section — expect a scenario question where the "obvious" solution (sync API call in observer) is wrong.
> - The correct answer will always involve **message queue** (`PublisherInterface`) for post-order external integrations.
> - **Even if the external API is fast today**, synchronous calls create a single point of failure that violates the architect principle of **fault isolation**.
> - Database transactions remain open during observer execution — a slow observer causes lock contention across the entire order table.
> - Plugins on `PlaceOrderInterface` share the same risk — an `around` plugin that calls an external API is architecturally identical to the observer anti-pattern.

---

## 9. EE CommandPool vs CE MethodInterface — Side-by-Side Comparison

### Configuration Comparison

| Aspect | CE (MethodInterface) | EE (CommandPool/Adapter) |
|---|---|---|
| Main class | PHP class extending `AbstractMethod` | `virtualType` of `Magento\Payment\Model\Method\Adapter` |
| Action implementation | Methods in single class | Separate `Command` classes per action |
| Configuration flags | `$_canCapture`, `$_canRefund` etc. | `ValueHandlerPool` + `Config` virtual types |
| Registered via | `model` key in `config.xml` | `di.xml` virtualType preference |
| Testability | Low (mixed concerns) | High (each command tested in isolation) |
| Vault support | Manual implementation | Built-in via `vault_*` commands |
| Request pipeline | Custom per method | `RequestBuilder -> Client -> Validator -> Handler` |

### CE config.xml

```xml
<!-- CE: payment method registered directly via model key -->
<config>
    <default>
        <payment>
            <vendor_ce_payment>
                <active>0</active>
                <model>VendorName\ModuleName\Model\Payment\CePaymentMethod</model>
                <title>CE Payment</title>
                <payment_action>authorize_capture</payment_action>
                <can_authorize>1</can_authorize>
                <can_capture>1</can_capture>
                <can_use_checkout>1</can_use_checkout>
            </vendor_ce_payment>
        </payment>
    </default>
</config>
```

### EE di.xml (no model key in config.xml)

```xml
<!-- EE: payment facade configured entirely in di.xml -->
<!-- config.xml has NO model key — the Adapter is the model -->

<virtualType name="VendorEePaymentConfig"
             type="Magento\Payment\Gateway\Config\Config">
    <arguments>
        <argument name="methodCode" xsi:type="string">vendor_ee_payment</argument>
    </arguments>
</virtualType>

<virtualType name="VendorEeConfigValueHandler"
             type="Magento\Payment\Gateway\Config\ConfigValueHandler">
    <arguments>
        <argument name="configInterface" xsi:type="object">VendorEePaymentConfig</argument>
    </arguments>
</virtualType>

<virtualType name="VendorEeValueHandlerPool"
             type="Magento\Payment\Gateway\Config\ValueHandlerPool">
    <arguments>
        <argument name="handlers" xsi:type="array">
            <item name="default" xsi:type="string">VendorEeConfigValueHandler</item>
        </argument>
    </arguments>
</virtualType>

<!-- EE config.xml still has active, title, payment_action — but NO model key -->
```

```xml
<!-- EE config.xml for the payment method -->
<config>
    <default>
        <payment>
            <vendor_ee_payment>
                <active>0</active>
                <!-- Note: NO <model> key — di.xml handles this -->
                <title>EE Payment</title>
                <payment_action>authorize</payment_action>
                <can_authorize>1</can_authorize>
                <can_capture>1</can_capture>
                <can_refund>1</can_refund>
                <can_void>1</can_void>
            </vendor_ee_payment>
        </payment>
    </default>
</config>
```

> **Exam focus:**
> - In EE gateway architecture, the `config.xml` **does not have a `<model>` key** — the model is the `Adapter` virtual type declared in `di.xml`.
> - In CE, the `<model>` key in `config.xml` points to the PHP class — this is how `PaymentConfig` resolves the method.
> - Both CE and EE read `active`, `title`, `payment_action` from `config.xml` under `payment/[code]/`.
> - The `CommandPool` is purely a `di.xml` construct — it has no equivalent in `config.xml`.
> - When you see a scenario about **adding a new payment action (e.g., void) to an existing EE gateway**, the answer is: add a new `virtualType` command and register it in the `CommandPool` array in `di.xml`.

---

## 10. Architectural Decision Frameworks

### When to Use Each Extension Point

```
Need to add data to cart item in REST API?
  -> CartItemProcessorInterface (Magento\Quote\Model\Quote\Item namespace)
     Registered in Magento\Quote\Model\Quote\Item\Repository's cartItemProcessors array
     (NOT an event/plugin on the quote item directly)

Need to add a new line item or modify totals?
  -> AbstractTotal + sales.xml registration
     (NOT a plugin on TotalsCollector::collect())

Need to hook into order invoicing?
  -> Plugin on InvoiceOrderInterface (the service contract)
     (NOT an observer on model save events)

Need a new shipping option?
  -> AbstractCarrier + CarrierInterface + config.xml + system.xml
     (NOT a plugin on existing carrier)

Need a new payment method (CE)?
  -> AbstractMethod subclass + config.xml model key
     (NOT modifying existing method class)

Need a new payment method (EE)?
  -> Adapter virtualType + CommandPool virtualType in di.xml
     (NOT subclassing AbstractMethod — that's CE pattern)

Need to react to order placement?
  -> Observer on sales_order_place_after + PublisherInterface
     (NEVER synchronous external API calls)
```

### Scenario-Based Decision Analysis

**Scenario:** A merchant wants to add a $3 "carbon offset" surcharge to every order. Should you use a plugin on `QuoteManagement::placeOrder()` or a custom `AbstractTotal`?

```
Analysis:
  Plugin on placeOrder()      AbstractTotal (sales.xml)
  ----------------------      ------------------------
  Bypasses totals pipeline    Participates in totals pipeline
  Not reflected in cart UI    Reflected in cart/checkout UI
  Tax unaware                 Tax-aware (sort_order after tax)
  Not recalculated on edit    Recalculated on every change
  Breaks multi-address        Works correctly in multi-address

VERDICT: AbstractTotal is architecturally correct.
```

**Scenario:** A carrier needs to call an external API to get rates. The API sometimes takes 8 seconds. What is the correct approach?

```
Options:
A) Call API synchronously in collectRates() — simple but risky
B) Cache results aggressively + async pre-warm cache
C) Use a queue to pre-fetch rates — but rates must be available at checkout

Analysis:
  Option A: Direct sync call. Checkout page shows spinner for 8s.
            Acceptable ONLY with very short timeout (1-2s) + graceful fallback.
  Option B: CORRECT for most cases. Cache by postcode+weight+items hash.
            TTL of 10-30 minutes. Pre-warm via cron.
  Option C: Infeasible — shipping rates must be synchronously available
            to render the checkout page.

VERDICT: Option B — aggressive caching with timeout + fallback.
         Never return an error to the customer; return an empty Result
         or fall back to a flat rate if the external API is unreachable.
```

**Scenario:** A developer proposes adding an `around` plugin on `PaymentInterface::authorize()` to log all payment attempts to an external audit service via HTTP. Why is this wrong, and what is the correct approach?

```
Why wrong:
  - authorize() is on the checkout critical path
  - External HTTP inside around plugin blocks the transaction
  - If audit service is slow/down, payment fails
  - The database transaction (order creation) stays open during the HTTP call

Correct approach:
  - Log a lightweight record to a local DB table synchronously (fast, reliable)
  - Publish to a message queue for the external audit service asynchronously
  - Consumer sends to audit service in a separate process

Pattern:
  authorize() plugin -> insert into local_audit_log (microseconds)
                     -> publisher->publish('audit.topic', data) (microseconds)
  [separate process] -> consumer reads queue -> HTTP to audit service
```

---

## Quick-Reference Checklist

### CartItemProcessorInterface
- [ ] Namespace: `Magento\Quote\Model\Quote\Item\CartItemProcessorInterface` (NOT `Magento\Quote\Api`)
- [ ] Two methods: `convertToBuyRequest()` (inbound/write) and `processOptions()` (outbound/read)
- [ ] Registered in **`Magento\Quote\Model\Quote\Item\Repository`**'s `cartItemProcessors` DI array
- [ ] Custom data stored as `quote_item_option` records on the quote item
- [ ] Extension attributes on `ProductOptionInterface` are the correct API-layer data carrier

### AbstractTotal / Custom Totals
- [ ] `collect()` is **NOT abstract** in `AbstractTotal` — it's a concrete base implementation; override it in your subclass
- [ ] Always call `parent::collect()` at the top of your `collect()` override
- [ ] Always iterate `$shippingAssignment->getItems()` — never `$quote->getItemsCollection()`
- [ ] Guard: `if (empty($shippingAssignment->getItems())) { return $this; }` for multi-address safety
- [ ] Skip child items: `if ($item->getParentItem()) { continue; }` for bundles/configurables
- [ ] Use `$total->setTotalAmount($code, $amount)` and `$total->setBaseTotalAmount($code, $amount)`
- [ ] `fetch()` returns **array** (empty `[]` suppresses display); base class returns `[]` — no PHP return type hint
- [ ] Registered in `sales.xml` under `section="quote" > group="totals"`
- [ ] Correct sort orders: subtotal=100, discount=300, shipping=**350**, tax=450, grand_total=550

### Double-Counting in Multi-Address Checkout
- [ ] Root cause: reading `$quote` scope data instead of `$shippingAssignment` scope data
- [ ] `collect()` is called **once per shipping address** in multi-address checkout
- [ ] The bug is **silent** — no exception, just wrong totals
- [ ] Fix: always use `$shippingAssignment->getItems()` as the item source

### InvoiceOrderInterface
- [ ] Service contract in `Magento\Sales\Api` — plugin on the interface, not the implementation
- [ ] `execute()` has **no PHP type hints** on parameters — consistent with all `@api` interfaces
- [ ] `$capture = true` triggers online payment capture
- [ ] Replaces legacy `$invoice->register()` + `$invoice->pay()` pattern
- [ ] Sibling interfaces: `ShipOrderInterface`, `RefundOrderInterface`, `RefundInvoiceInterface`

### Custom Shipping Carrier
- [ ] `protected $_code` must exactly match `config.xml` and `system.xml` keys
- [ ] `collectRates()` returns `Result` (with methods) or `false` (carrier hidden) or empty `Result` (shows error)
- [ ] `getAllowedMethods()` must return every method code that `collectRates()` can produce
- [ ] `model` key in `config.xml` is how Magento instantiates the carrier (not di.xml preference)
- [ ] `_isFixed = true` = flat rate; `false` = calculated (affects handling fee application)
- [ ] For slow external APIs: aggressive caching + short timeout + graceful fallback

### Custom Payment Method — CE
- [ ] Extend `AbstractMethod`, set `protected $_code`
- [ ] Set capability flags: `$_canAuthorize`, `$_canCapture`, `$_canRefund`, etc.
- [ ] Register via `model` key in `config.xml` under `payment/[code]/`
- [ ] `payment_action`: `authorize` | `authorize_capture` | `order`

### Custom Payment Method — EE
- [ ] **No PHP class** needed as the payment method — use `Adapter` virtualType in `di.xml`
- [ ] **No `<model>` key** in `config.xml` — di.xml `Adapter` virtualType IS the model
- [ ] Each action (authorize, capture, refund, void, cancel) is a **separate Command class**
- [ ] CommandPool registered as virtualType, wired into Adapter's `commandPool` argument
- [ ] `ValueHandlerPool` replaces CE capability flags
- [ ] Vault requires `vault_authorize` and/or `vault_sale` commands in CommandPool
- [ ] GatewayCommand pipeline: RequestBuilder → TransferFactory → Client → Validator → Handler

### Offline vs Online vs Vault
- [ ] Offline (`$_isOffline = true`): no gateway call, `order()` action, check/MO/PO
- [ ] Online Auth: external API at order placement, capture at invoice
- [ ] Online Auth+Capture: single external API call, immediate capture
- [ ] Vault: token-based, `vault_payment_token` table, separate method code (e.g., `braintree_cc_vault`)

### Checkout Critical Path — The Golden Rule
- [ ] **NEVER** make synchronous external API calls in: place_order observer, plugins on PlaceOrderInterface, payment method code outside `authorize()`/`capture()`
- [ ] **ALWAYS** use `PublisherInterface` + message queue consumer for post-order external integrations
- [ ] Database transactions remain open during observer execution — slow = lock contention
- [ ] Slow external calls = browser timeout = abandoned carts = duplicate orders
- [ ] Even fast external APIs create fault-coupling — use async for all non-payment external calls

### Architectural Superiority Signals (Exam Scenarios)
- [ ] "Plugin on service contract interface" > "Plugin on concrete implementation"
- [ ] "AbstractTotal + sales.xml" > "Plugin on QuoteManagement for totals"
- [ ] "Message queue consumer" > "Synchronous observer for external integrations"
- [ ] "ShippingAssignment scope" > "Quote scope" in collect() methods
- [ ] "EE CommandPool / separate command classes" > "CE monolithic AbstractMethod" for testability
- [ ] "Aggressive caching + fallback" > "Direct sync call" for external carrier APIs
