# Security Architecture — Adobe Commerce Architect Exam Study Notes

## Table of Contents

1. [ACL System](#1-acl-system)
2. [CSRF Protection](#2-csrf-protection)
3. [XSS Prevention](#3-xss-prevention)
4. [SQL Injection Prevention](#4-sql-injection-prevention)
5. [Content Security Policy (CSP)](#5-content-security-policy-csp)
6. [Admin Security](#6-admin-security)
7. [PCI Compliance](#7-pci-compliance)
8. [File System Permissions](#8-file-system-permissions)
9. [Hands-On Reference](#9-hands-on-reference)
10. [Architectural Decision Frameworks](#10-architectural-decision-frameworks)
11. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. ACL System

### 1.1 What ACL Does and Why It Exists

The Access Control List (ACL) system is Magento's authorization layer. It answers: *"Does this authenticated user/integration have permission to perform this action?"* Authentication (who you are) is separate from authorization (what you can do).

> **Architectural principle:** The ACL tree is a single source of truth for all resource permissions — admin UI, REST API, and SOAP all resolve to the same `acl.xml` resource nodes. This is the key exam insight: one permission tree governs everything.

### 1.2 `acl.xml` — The Resource Tree

Every module that introduces a permission declares it in `etc/acl.xml`:

```xml
<!-- Vendor/Module/etc/acl.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Acl/etc/acl.xsd">
    <acl>
        <resources>
            <resource id="Magento_Backend::admin">
                <resource id="Vendor_Module::menu_parent"
                          title="My Module"
                          sortOrder="100">
                    <resource id="Vendor_Module::manage_items"
                              title="Manage Items"
                              sortOrder="10" />
                    <resource id="Vendor_Module::config"
                              title="Configuration"
                              sortOrder="20" />
                </resource>
            </resource>
        </resources>
    </acl>
</config>
```

**Key structural facts:**
- All custom resources must be children of `Magento_Backend::admin` (directly or transitively)
- The `id` attribute is the globally unique resource identifier used everywhere else
- `title` appears in the Roles > Resources tree in the Admin UI
- Resources are **inherited downward**: granting a parent grants all children

**Exam focus:** The resource ID format is always `Vendor_Module::snake_case_name`. A mismatch between `acl.xml` and `webapi.xml` means REST callers get a 403 — the XML IDs must match exactly.

### 1.3 `AuthorizationInterface` — Programmatic Permission Checks

```php
<?php
namespace Vendor\Module\Controller\Adminhtml\Item;

use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\Authorization;

class Index extends Action
{
    // Option 1: Declare the ACL resource as a constant — preferred pattern
    const ADMIN_RESOURCE = 'Vendor_Module::manage_items';

    public function execute()
    {
        // Authorization is checked automatically by the parent Action class
        // because ADMIN_RESOURCE is declared. No manual check needed here.
    }
}
```

For non-controller contexts (services, plugins, observers), inject `AuthorizationInterface`:

```php
<?php
namespace Vendor\Module\Model;

use Magento\Framework\AuthorizationInterface;

class ItemService
{
    private AuthorizationInterface $authorization;

    public function __construct(AuthorizationInterface $authorization)
    {
        $this->authorization = $authorization;
    }

    public function deleteItem(int $id): void
    {
        // Throws LocalizedException if not allowed — or returns false
        if (!$this->authorization->isAllowed('Vendor_Module::manage_items')) {
            throw new \Magento\Framework\Exception\AuthorizationException(
                __('You do not have permission to delete items.')
            );
        }
        // ... deletion logic
    }
}
```

**Exam focus:** `isAllowed()` takes the *full resource ID string*, not just the suffix. Passing only `'manage_items'` will not match — the module prefix is required.

### 1.4 How Admin Controller Permissions Map to REST API

This is the critical architectural connection. The same ACL resource ID used in an admin controller's `ADMIN_RESOURCE` constant is referenced in `webapi.xml` to protect REST endpoints.

```xml
<!-- Vendor/Module/etc/webapi.xml -->
<?xml version="1.0"?>
<routes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Webapi:etc/webapi.xsd">

    <!-- GET /V1/vendor-module/items -->
    <route url="/V1/vendor-module/items" method="GET">
        <service class="Vendor\Module\Api\ItemRepositoryInterface" method="getList" />
        <resources>
            <!-- Same resource ID as the admin controller -->
            <resource ref="Vendor_Module::manage_items" />
        </resources>
    </route>

    <!-- POST /V1/vendor-module/items — requires a more specific permission -->
    <route url="/V1/vendor-module/items" method="POST">
        <service class="Vendor\Module\Api\ItemRepositoryInterface" method="save" />
        <resources>
            <resource ref="Vendor_Module::manage_items" />
        </resources>
    </route>

    <!-- Anonymous access — use 'anonymous' as resource -->
    <route url="/V1/vendor-module/public-data" method="GET">
        <service class="Vendor\Module\Api\PublicDataInterface" method="get" />
        <resources>
            <resource ref="anonymous" />
        </resources>
    </route>

    <!-- Logged-in customer access only -->
    <route url="/V1/vendor-module/my-data" method="GET">
        <service class="Vendor\Module\Api\CustomerDataInterface" method="get" />
        <resources>
            <resource ref="self" />
        </resources>
    </route>

</routes>
```

**The full trace from REST request to ACL decision:**

```
REST Request: GET /rest/V1/vendor-module/items
       |
       v
Magento_Webapi: Authenticate token/OAuth
       |
       v
Parse webapi.xml -> find matching route
       |
       v
Read <resource ref="Vendor_Module::manage_items" />
       |
       v
AuthorizationInterface::isAllowed('Vendor_Module::manage_items')
       |
       v
Check acl.xml resource tree for this ID
       |
       v
Check if current integration/admin token has this resource assigned
       |
   [YES]       [NO]
    |             |
    v             v
 200 OK        403 Forbidden
```

**Special resource values in webapi.xml:**

| Value | Meaning |
|---|---|
| `anonymous` | No authentication required — public endpoint |
| `self` | Customer must be logged in; can only access their own data |
| `Vendor_Module::resource_id` | Admin/integration token with this ACL resource |

**Exam focus:** An integration token in Magento is scoped to the ACL resources you assign it during setup. A token with `Magento_Sales::sales` will pass a `self` check if it's a customer token, but will *fail* an admin resource check. Understand the three categories: anonymous, self, and specific admin resources.

### 1.5 Role Hierarchy and Why It Matters Architecturally

```
Magento_Backend::admin (root — all admins have this)
  |
  +-- Magento_Backend::all (full admin role — grants everything below)
  |
  +-- Vendor_Module::menu_parent
        |
        +-- Vendor_Module::manage_items   <-- granting parent grants this
        +-- Vendor_Module::config         <-- and this
```

> **Architectural decision:** When designing a new module's ACL tree, ask: "Should a store manager be able to do X but not Y?" If yes, they need separate resource nodes. Over-nesting makes delegation impossible; under-nesting means you can't grant granular permissions.

---

## 2. CSRF Protection

### 2.1 Why CSRF Exists and Magento's Approach

Cross-Site Request Forgery tricks an authenticated user's browser into making unintended requests. Magento's defense strategy differs by surface:

| Surface | CSRF Defense | Reason |
|---|---|---|
| Admin HTML forms | Form Key (token in hidden field + cookie) | Browser-based; susceptible to CSRF |
| Frontend HTML forms | Form Key | Same reason |
| REST API | OAuth 1.0a or Bearer token in header | JS/mobile clients; `Authorization` header is not sent cross-origin by default |
| GraphQL | Bearer token in `Authorization` header | Same — header-based auth is CSRF-safe |
| SOAP | WS-Security token | Header-based |

**Exam focus:** The architectural reason REST and GraphQL don't need form keys is that the `Authorization: Bearer <token>` header cannot be set by a cross-origin form submission. Only XHR/fetch with CORS can set custom headers — and CORS policies on the Magento origin prevent unauthorized cross-origin requests.

### 2.2 Form Key Implementation

**In PHTML templates:**

```php
<!-- Correct: use formKey block or getFormKey() -->
<form method="post" action="<?= $block->getUrl('vendor/module/save') ?>">
    <?= $block->getBlockHtml('formkey') ?>
    <!-- or: -->
    <input type="hidden"
           name="form_key"
           value="<?= $block->escapeHtmlAttr($block->getFormKey()) ?>">
    <!-- form fields -->
</form>
```

**In controllers — validation happens automatically:**

```php
<?php
namespace Vendor\Module\Controller\Index;

// For frontend controllers, extend Action and CSRF validation
// is triggered via CsrfAwareActionInterface or default POST validation

use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\HttpPostActionInterface;
use Magento\Framework\App\CsrfAwareActionInterface;
use Magento\Framework\App\Request\InvalidRequestException;
use Magento\Framework\App\RequestInterface;

class Save extends Action implements HttpPostActionInterface, CsrfAwareActionInterface
{
    public function createCsrfValidationException(
        RequestInterface $request
    ): ?InvalidRequestException {
        return new InvalidRequestException(
            $this->resultRedirectFactory->create()->setPath('*/*/'),
            [__('Invalid Form Key. Please refresh the page.')]
        );
    }

    public function validateForCsrf(RequestInterface $request): ?bool
    {
        // Return null to use default form key validation
        // Return true to skip validation (use carefully — only for APIs)
        // Return false to force failure
        return null;
    }

    public function execute()
    {
        // Form key already validated before execute() is called
    }
}
```

**Exam focus:** In Magento 2.3+, POST controllers should implement `CsrfAwareActionInterface` OR the framework performs default form key validation. Returning `null` from `validateForCsrf()` means "use default behavior." Returning `true` bypasses CSRF — this is only appropriate for programmatic/API endpoints receiving non-browser requests.

### 2.3 Why REST/GraphQL Architecturally Don't Need Form Keys

```
Browser CSRF Attack Flow (HTML form):
  Attacker site -> <form action="https://store.com/checkout/cart/add"> -> POST
  Browser automatically sends cookies (session) -> Store processes it
  DEFENSE: Form key in POST body doesn't match expected key -> REJECTED

REST API Attack Flow:
  Attacker site -> fetch('https://store.com/rest/V1/carts', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer abc123' }  // Cannot be set by cross-origin form
  })
  CORS policy blocks this from unauthorized origins
  Even if it got through, attacker doesn't have the Bearer token
  DEFENSE: Token-based auth in headers — inherently CSRF-resistant
```

---

## 3. XSS Prevention

### 3.1 The Core Problem: Context Matters

XSS (Cross-Site Scripting) occurs when user-controlled data is rendered in a browser context without proper encoding. The critical architectural insight is that **the correct escaping function depends entirely on where the data appears in the output document.**

Using the wrong escaper for the context either:
- Leaves you vulnerable (under-escaping)
- Breaks functionality (over-escaping)

### 3.2 `Magento\Framework\Escaper` — Method Reference

```php
<?php
// In a Block class, $this->_escaper is available
// Or inject via constructor:

namespace Vendor\Module\Block;

use Magento\Framework\Escaper;
use Magento\Framework\View\Element\Template;

class MyBlock extends Template
{
    private Escaper $escaper;

    public function __construct(
        Template\Context $context,
        Escaper $escaper,
        array $data = []
    ) {
        $this->escaper = $escaper;
        parent::__construct($context, $data);
    }
}
```

### 3.3 `escapeHtml()` — HTML Body Context

Use when outputting data **between HTML tags** or in **HTML attribute values**. Converts `<`, `>`, `&`, `"`, `'` to HTML entities.

```php
<!-- In PHTML template -->

<!-- CORRECT: Plain text content between tags -->
<p><?= $escaper->escapeHtml($block->getProductName()) ?></p>

<!-- CORRECT: Attribute value -->
<input type="text" 
       value="<?= $escaper->escapeHtml($block->getUserInput()) ?>"
       placeholder="<?= $escaper->escapeHtml(__('Search...')) ?>">

<!-- WRONG: escapeHtml in a URL context -->
<a href="<?= $escaper->escapeHtml($block->getUrl()) ?>">Link</a>
<!-- If URL contains &param=value, & becomes &amp; — valid HTML but may break URL parsing -->
<!-- Use escapeUrl for href -->

<!-- CORRECT with allowed tags (e.g., for admin-controlled rich text) -->
<?= $escaper->escapeHtml($block->getDescription(), ['b', 'i', 'strong', 'em']) ?>
```

**Exam focus:** `escapeHtml()` accepts a second parameter — an array of allowed HTML tags. This is used for admin-configured content that legitimately contains markup. Never pass user-submitted data with allowed tags unless you explicitly trust the source.

### 3.4 `escapeUrl()` — URL Context

Use when outputting a URL in `href`, `src`, `action`, or any URL attribute. Encodes characters that are illegal or dangerous in URLs.

```php
<!-- CORRECT: URL in href -->
<a href="<?= $escaper->escapeUrl($block->getProductUrl()) ?>">
    View Product
</a>

<!-- CORRECT: Form action -->
<form action="<?= $escaper->escapeUrl($block->getUrl('vendor/module/save')) ?>">

<!-- CORRECT: Redirect param in URL (encode the inner URL too) -->
<a href="<?= $escaper->escapeUrl(
    $block->getUrl('customer/account/login', [
        'referer' => base64_encode($block->getCurrentUrl())
    ])
) ?>">Login</a>

<!-- WRONG: Using escapeHtml for URLs -->
<!-- javascript:alert(1) becomes javascript:alert(1) — escapeHtml doesn't strip protocols -->
<a href="<?= $escaper->escapeHtml($userSuppliedUrl) ?>">VULNERABLE</a>

<!-- CORRECT: escapeUrl strips javascript: and data: protocols -->
<a href="<?= $escaper->escapeUrl($userSuppliedUrl) ?>">Safe</a>
```

**Exam focus:** `escapeUrl()` will strip dangerous protocols like `javascript:` and `data:` — `escapeHtml()` will NOT. This is the key difference. A URL from user input must go through `escapeUrl()`.

### 3.5 `escapeJs()` — JavaScript String Context

Use when embedding PHP data inside a JavaScript string literal.

```php
<!-- CORRECT: PHP value inside a JS string -->
<script>
    var productName = '<?= $escaper->escapeJs($block->getProductName()) ?>';
    var config = {
        message: '<?= $escaper->escapeJs(__('Welcome, %1', $customerName)) ?>'
    };
</script>

<!-- WRONG: Using escapeHtml in JS context -->
<script>
    // If name contains ', it breaks JS syntax even after HTML escaping
    var name = '<?= $escaper->escapeHtml($name) ?>'; // XSS risk if name = '; alert(1); //
</script>

<!-- BETTER: Use JSON for passing PHP data to JS (preferred architectural pattern) -->
<script>
    // Preferred: json_encode handles all escaping correctly for JS objects
    var config = <?= /* @noEscape */ json_encode($block->getConfigData()) ?>;
</script>
```

### 3.6 `escapeHtmlAttr()` — HTML Attribute Context

A more precise escaper for HTML attribute values (encodes more characters than `escapeHtml`).

```php
<!-- Attribute value with potential special chars -->
<div data-config="<?= $escaper->escapeHtmlAttr(json_encode($block->getData())) ?>">

<!-- data-* attributes with dynamic values -->
<button data-item-id="<?= $escaper->escapeHtmlAttr($block->getItemId()) ?>"
        data-label="<?= $escaper->escapeHtmlAttr($block->getLabel()) ?>">
    Click
</button>
```

### 3.7 Context Mapping — The Decision Table

| Output Location | Correct Method | Why |
|---|---|---|
| Between HTML tags: `<p>TEXT</p>` | `escapeHtml()` | Prevents tag injection |
| HTML attribute value: `value="TEXT"` | `escapeHtml()` or `escapeHtmlAttr()` | Prevents attribute breakout |
| URL in href/src/action | `escapeUrl()` | Strips `javascript:`, encodes URL chars |
| Inside JS string literal `'TEXT'` | `escapeJs()` | Prevents JS string breakout |
| JSON passed to JS | `json_encode()` (native PHP) | Handles all JS encoding |
| Inside CSS `style="TEXT"` | `escapeCss()` | Prevents CSS injection |
| Admin-controlled HTML content | `escapeHtml($text, $allowedTags)` | Allows safe markup |

**Exam focus:** The exam will present a scenario with data in a specific HTML context and ask which escaper is appropriate. The wrong-but-tempting answer is always `escapeHtml()` everywhere — know when `escapeUrl()` and `escapeJs()` are required instead.

### 3.8 The `@noEscape` Annotation

When you intentionally output unescaped HTML (e.g., a rendered block), use the annotation to silence static analysis warnings:

```php
<!-- Intentional raw HTML output — must be from trusted source only -->
<?= /* @noEscape */ $block->getChildHtml('sidebar') ?>

<!-- escapeHtml with allowed tags also needs @noEscape if you use $allowedTags -->
<?= /* @noEscape */ $escaper->escapeHtml($block->getContent(), ['strong', 'em', 'a']) ?>
```

---

## 4. SQL Injection Prevention

### 4.1 Why This Is an Architectural Concern

SQL injection prevention is not just about using the right API call — it's about ensuring that any custom data access layer uses parameterized queries at all levels. The architectural risk comes from:
1. Raw SQL strings built with string concatenation
2. Passing user input to methods that don't bind parameters
3. Third-party modules that bypass the ORM

### 4.2 Parameter Binding in ResourceModel Queries

**The wrong way — vulnerable to SQL injection:**

```php
<?php
// NEVER DO THIS
$name = $request->getParam('name'); // User controlled!

$connection = $this->getConnection();
// Direct string interpolation — VULNERABLE
$sql = "SELECT * FROM catalog_product_entity WHERE name = '$name'";
$result = $connection->fetchAll($sql);

// String concatenation — VULNERABLE
$result = $connection->fetchAll(
    "SELECT * FROM catalog_product_entity WHERE name = " . $name
);
```

**The correct way — parameter binding:**

```php
<?php
namespace Vendor\Module\Model\ResourceModel;

use Magento\Framework\Model\ResourceModel\Db\AbstractDb;

class Item extends AbstractDb
{
    protected function _construct(): void
    {
        $this->_init('vendor_module_item', 'entity_id');
    }

    public function getItemsByName(string $name): array
    {
        $connection = $this->getConnection();
        $tableName = $this->getMainTable();

        // Method 1: Named placeholders (preferred for clarity)
        $select = $connection->select()
            ->from($tableName)
            ->where('name = :name');
        
        return $connection->fetchAll($select, ['name' => $name]);
    }

    public function getItemsByStatus(int $status, string $type): array
    {
        $connection = $this->getConnection();

        // Method 2: Positional placeholders with quoteInto
        $select = $connection->select()
            ->from($this->getMainTable(), ['entity_id', 'name', 'status'])
            ->where('status = ?', $status)   // ? is auto-bound and type-cast
            ->where('type = ?', $type);

        return $connection->fetchAll($select);
    }

    public function updateStatus(int $entityId, int $status): void
    {
        $connection = $this->getConnection();
        
        // Method 3: Using update() with bind array
        $connection->update(
            $this->getMainTable(),
            ['status' => $status],           // SET clause — auto-escaped
            ['entity_id = ?' => $entityId]   // WHERE clause — bound parameter
        );
    }
}
```

### 4.3 Why `addFieldToFilter()` Is Safe

The Collection `addFieldToFilter()` method is safe because it always uses parameter binding internally via `Zend_Db_Expr` and the `where()` method:

```php
<?php
namespace Vendor\Module\Model\ResourceModel\Item;

use Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection;

class Collection extends AbstractCollection
{
    public function getFilteredItems(string $userInput, int $status): self
    {
        // SAFE: addFieldToFilter uses parameter binding internally
        $this->addFieldToFilter('name', ['like' => '%' . $userInput . '%']);
        $this->addFieldToFilter('status', ['eq' => $status]);
        
        return $this;
    }
}
```

**What `addFieldToFilter()` does internally (simplified):**

```php
// Internally, addFieldToFilter eventually calls something like:
$condition = $this->_getConditionSql('main_table.name', ['like' => '%user_input%']);
// Which produces: main_table.name LIKE ?  with binding ['%user_input%']
// The ? placeholder is bound by PDO/Zend_Db — user data never touches SQL string
```

**The filter condition operators:**

```php
// All of these are safe — they all use parameter binding
$collection->addFieldToFilter('status', ['eq' => 1]);           // = 1
$collection->addFieldToFilter('status', ['neq' => 1]);          // != 1
$collection->addFieldToFilter('price', ['gt' => 100]);          // > 100
$collection->addFieldToFilter('price', ['lt' => 200]);          // < 200
$collection->addFieldToFilter('price', ['gteq' => 100]);        // >= 100
$collection->addFieldToFilter('price', ['lteq' => 200]);        // <= 200
$collection->addFieldToFilter('name', ['like' => '%shirt%']);   // LIKE '%shirt%'
$collection->addFieldToFilter('id', ['in' => [1, 2, 3]]);       // IN (1, 2, 3)
$collection->addFieldToFilter('id', ['nin' => [4, 5]]);         // NOT IN (4, 5)
$collection->addFieldToFilter('value', ['null' => true]);       // IS NULL
$collection->addFieldToFilter('value', ['notnull' => true]);    // IS NOT NULL
```

**Exam focus:** The architectural reason `addFieldToFilter()` is safe is not "it sanitizes input" — it's that it *never* interpolates user data into the SQL string. It uses a query builder pattern that keeps data and SQL structure separate at all times. This is the correct explanation on the exam.

### 4.4 When You Must Use Raw SQL Safely

Sometimes complex queries require raw SQL. Use `quoteInto()` or `quote()` as a last resort:

```php
<?php
$connection = $this->getConnection();

// quoteInto: replaces ? with properly quoted value
$where = $connection->quoteInto('name = ?', $userInput);
// Result: name = 'user\'s input' — properly escaped

// For IN clauses with arrays
$ids = [1, 2, 3];
$where = $connection->quoteInto('entity_id IN (?)', $ids);

// Full raw query with binding — acceptable for complex queries
$sql = $connection->select()
    ->from(['main' => $this->getMainTable()])
    ->joinLeft(
        ['second' => $this->getTable('second_table')],
        'main.id = second.main_id',
        ['second_value']
    )
    ->where('main.status = ?', $status)
    ->having('COUNT(second.id) > ?', $minCount);
```

---

## 5. Content Security Policy (CSP)

### 5.1 What CSP Does and Why Architects Must Understand It

Content Security Policy is an HTTP response header that tells browsers which sources of content (scripts, styles, images, fonts, etc.) are allowed to load. It's the last line of defense against XSS — even if an attacker injects a script tag, CSP can prevent it from executing.

**CSP modes:**

| Mode | Behavior | When Used |
|---|---|---|
| `report-only` | Violations logged, not blocked | Development, migration phase |
| `enforced` | Violations blocked by browser | Production — Magento 2.4.x default for some areas |

**Exam focus:** In Magento 2.4.8, CSP enforcement has been extended to more storefront and admin areas. This means custom modules adding third-party scripts *must* have CSP entries or those scripts will be silently blocked in browsers.

### 5.2 `csp_whitelist.xml` — Adding Exceptions

The architectural approach to CSP exceptions is: **add the minimum necessary whitelist entries** rather than disabling CSP entirely.

```xml
<!-- Vendor/Module/etc/csp_whitelist.xml -->
<?xml version="1.0"?>
<csp_whitelist xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Csp/etc/csp_whitelist.xsd">
    <policies>

        <!-- Allow scripts from a CDN -->
        <policy id="script-src">
            <values>
                <value id="analytics-cdn" type="host">https://cdn.analytics-vendor.com</value>
                <value id="maps-cdn" type="host">https://maps.googleapis.com</value>
            </values>
        </policy>

        <!-- Allow styles from external sources -->
        <policy id="style-src">
            <values>
                <value id="fonts-googleapis" type="host">https://fonts.googleapis.com</value>
            </values>
        </policy>

        <!-- Allow font files -->
        <policy id="font-src">
            <values>
                <value id="fonts-gstatic" type="host">https://fonts.gstatic.com</value>
            </values>
        </policy>

        <!-- Allow images from CDN and data URIs -->
        <policy id="img-src">
            <values>
                <value id="image-cdn" type="host">https://images.cdn-vendor.com</value>
            </values>
        </policy>

        <!-- Allow connections (XHR/fetch/WebSocket) to external APIs -->
        <policy id="connect-src">
            <values>
                <value id="payment-api" type="host">https://api.payment-provider.com</value>
            </values>
        </policy>

        <!-- Allow iframes (e.g., payment forms) -->
        <policy id="frame-src">
            <values>
                <value id="payment-iframe" type="host">https://secure.payment-provider.com</value>
            </values>
        </policy>

    </policies>
</csp_whitelist.xml>
```

**Policy directive reference:**

| Directive | Controls |
|---|---|
| `script-src` | JavaScript file loading and inline script execution |
| `style-src` | CSS loading and inline style application |
| `img-src` | Image loading (including `<img>`, CSS `background-image`) |
| `font-src` | Web font loading |
| `connect-src` | XHR, fetch, WebSocket, EventSource connections |
| `frame-src` | `<iframe>` sources |
| `form-action` | Where forms can be submitted |
| `default-src` | Fallback for unspecified directives |

### 5.3 The `type` Attribute Options

```xml
<!-- type="host": exact host or wildcard -->
<value id="vendor-cdn" type="host">https://cdn.vendor.com</value>
<value id="vendor-wildcard" type="host">https://*.vendor.com</value>

<!-- type="inline": allows inline scripts/styles (use sparingly) -->
<value id="allow-inline" type="inline" />

<!-- type="eval": allows eval() in scripts (avoid — very permissive) -->
<value id="allow-eval" type="eval" />

<!-- type="nonce": allows scripts/styles with matching nonce attribute -->
<value id="custom-nonce" type="nonce" />
```

**Exam focus:** The architectural decision hierarchy for CSP exceptions is:
1. Use `type="host"` with the most specific host possible ✓ (best)
2. Use wildcard subdomain `*.vendor.com` only if necessary
3. Use `type="inline"` only for legacy code that cannot be refactored
4. **Never** disable CSP entirely — this removes the entire protection layer
5. **Never** use `type="eval"` in production

### 5.4 Inline Scripts and Nonces

Magento 2.4.x supports CSP nonces for inline scripts in some contexts:

```php
<?php
// In Block class — get the CSP nonce for inline scripts
$nonce = $block->getCspNonce();
?>
<script nonce="<?= $escaper->escapeHtmlAttr($nonce) ?>">
    // This inline script is allowed by CSP because it has the correct nonce
    require(['jquery'], function($) {
        // ...
    });
</script>
```

### 5.5 Disabling CSP — Why Architects Should Never Recommend This

The wrong solution:

```xml
<!-- DO NOT DO THIS in production -->
<!-- In app/etc/config.php or via Admin: setting CSP to report-only everywhere -->
```

The wrong solution via admin:
- Stores > Configuration > Security > CSP > Set to "Report Only" for all pages

> **Architectural principle:** "Report Only" mode is a *development and auditing tool*, not a production solution. An architect who recommends disabling CSP to fix a third-party integration problem is choosing expedience over security. The correct answer is always: identify what the script/resource needs, add the minimum necessary whitelist entry.

**Exam focus:** On scenario questions where a third-party payment module's JavaScript fails to load — the architecturally correct answer is to add the payment provider's domain to `script-src` in `csp_whitelist.xml`, *not* to disable CSP or set it to report-only.

---

## 6. Admin Security

### 6.1 Two-Factor Authentication (2FA) — `Magento_TwoFactorAuth`

2FA has been **required by default** since Magento 2.4.0. It cannot be disabled in production without explicit override.

**Supported providers (out of box):**

| Provider | Module |
|---|---|
| Google Authenticator | `Magento_TwoFactorAuth` |
| Authy | `Magento_TwoFactorAuth` |
| Duo Security | `Magento_TwoFactorAuth` |
| U2F (YubiKey) | `Magento_TwoFactorAuth` |

**Why 2FA is architecturally important:**

The admin panel is the highest-privilege surface. Compromised admin credentials without 2FA means:
- Full catalog/order/customer data access
- Code execution via CMS blocks with JavaScript
- File access via admin file manager
- Payment configuration changes

**CLI for 2FA management (for legitimate testing):**

```bash
# Reset 2FA for a specific admin user (e.g., after lockout)
bin/magento security:tfa:reset username google

# List configured providers
bin/magento security:tfa:providers

# In development environments only — disable specific providers
bin/magento config:set twofactorauth/general/force_providers ""
```

**Exam focus:** In an architect exam scenario where "we need to disable 2FA for automation testing," the correct architectural answer is to use the `--no-interaction` flag or configure a programmatic 2FA bypass for CI only, not to disable it in production. On Adobe Commerce Cloud, the `Magento_AdminAdobeImsTwoFactorAuth` module can replace standard 2FA with Adobe IMS SSO.

### 6.2 Admin URL Customization

Changing the admin URL from `/admin` to a custom path is a security-by-obscurity layer that reduces automated attack surface:

```php
// In app/etc/env.php (or via Admin > Advanced > Admin > Admin Base URL)
'backend' => [
    'frontName' => 'custom_admin_path_xyz'
]
```

**Via CLI:**

```bash
bin/magento setup:config:set --backend-frontname="secure_admin_xyz"
```

**Via admin panel:**
- Stores > Configuration > Advanced > Admin > Admin Base URL
- Set "Use Custom Admin URL" = Yes
- Enter custom URL

**Why it's a layer, not a complete defense:**
- Does not replace authentication/2FA
- A leaked URL (logs, referrer headers) removes the protection
- Should be combined with IP allowlisting at the web server/CDN level

**Cloud-specific approach:**

```yaml
# In .magento.env.yaml for Magento Cloud
stage:
  deploy:
    ADMIN_URL: "secure_admin_xyz"
```

### 6.3 Session Lifetime Configuration

```
Stores > Configuration > Advanced > Admin > Security

Admin Session Lifetime (seconds): 900 (15 min default for high security)
```

**Via `config.xml`:**

```xml
<!-- Vendor/Module/etc/config.xml -->
<config>
    <default>
        <admin>
            <security>
                <session_lifetime>900</session_lifetime>
                <password_reset_link_expiration_period>2</password_reset_link_expiration_period>
                <max_login_failures_num>6</max_login_failures_num>
                <lockout_threshold>30</lockout_threshold>
            </security>
        </admin>
    </default>
</config>
```

### 6.4 Brute-Force Protection

Magento has built-in brute-force protection for admin login:

**Configuration paths:**

| Setting | Path | Default |
|---|---|---|
| Max login failures | `admin/security/max_login_failures_num` | 6 |
| Lockout period (min) | `admin/security/lockout_threshold` | 30 |
| Password reset expiry (hrs) | `admin/security/password_reset_link_expiration_period` | 2 |

**How lockout works:**
1. Failed logins are counted in `admin_user` table (`failures_num` column)
2. After `max_login_failures_num` failures, `lock_expires` is set
3. Admin UI shows "Your account is temporarily disabled" message
4. Reset via CLI: `bin/magento admin:user:unlock username`

**Additional hardening (architectural recommendations):**

```
1. IP allowlisting at Nginx/CDN level for /admin path
2. CAPTCHA (Stores > Config > Admin > CAPTCHA)
3. Rate limiting at WAF/load balancer level
4. Monitoring for repeated failures via log analysis
```

**Exam focus:** Brute-force protection and 2FA are complementary, not redundant. 2FA protects against credential stuffing even if brute-force limits aren't hit. Brute-force limits protect against password spraying. An architect should recommend both.

---

## 7. PCI Compliance

### 7.1 The Core Principle: Minimize Cardholder Data Scope

PCI DSS (Payment Card Industry Data Security Standard) scope applies to any system that stores, processes, or transmits cardholder data. The architectural goal is to minimize the number of Magento systems that are in scope.

**What must NEVER be stored:**

| Data Type | PCI Term | Storage Allowed? |
|---|---|---|
| Full card number (PAN) | Primary Account Number | Never in logs; encrypt if stored |
| CVV/CVC/CID | Card Verification Value | NEVER — even encrypted |
| PIN | PIN | NEVER |
| Full magnetic stripe data | Track data | NEVER |
| Full card number in logs | - | NEVER |

### 7.2 Payment Tokens vs Full Card Numbers

**The Vault pattern — correct architecture:**

```
Customer submits card -> Payment Gateway -> Returns Token (e.g., "tok_abc123")
                                                 |
                                                 v
                               Magento stores token in vault_payment_token table
                               (token references real card at gateway)
                                                 |
                                                 v
                               Future orders: send token to gateway
                               Gateway resolves token -> processes real card
                               Magento NEVER sees real card number again
```

**Vault token storage in database:**

```sql
-- vault_payment_token table structure (what IS stored)
entity_id | customer_id | public_hash | payment_method_code | type    | expires_at  | gateway_token     | details
1         | 42          | abc123hash  | braintree           | card    | 2025-12-31  | tok_braintree_xyz | {"type":"Visa","maskedCC":"1111","expirationDate":"12\/2025"}
```

**What `details` JSON contains (safe to store):**
- Card type (Visa, MC, Amex)
- Last 4 digits of card number
- Expiration month/year
- Billing ZIP (sometimes)

**What `details` JSON NEVER contains:**
- Full 16-digit number
- CVV
- Full expiration date combined with full PAN

### 7.3 Never Log Card Data — Implementation Patterns

```php
<?php
namespace Vendor\Payment\Gateway\Http;

use Psr\Log\LoggerInterface;
use Magento\Payment\Gateway\Http\TransferInterface;

class Client
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    public function placeRequest(TransferInterface $transferObject): array
    {
        $request = $transferObject->getBody();

        // WRONG: Logs entire request including card data
        // $this->logger->debug('Payment request: ' . json_encode($request));

        // CORRECT: Log only non-sensitive fields
        $safeLog = [
            'method' => $request['payment_method'] ?? 'unknown',
            'amount' => $request['amount'] ?? 0,
            'currency' => $request['currency'] ?? 'USD',
            // Never log: card_number, cvv, expiry, track_data
        ];
        $this->logger->debug('Payment initiated', $safeLog);

        $response = $this->sendRequest($request);

        // WRONG: Logging raw response may include card data
        // $this->logger->debug('Response: ' . json_encode($response));

        // CORRECT: Log only the result status and transaction ID
        $this->logger->debug('Payment result', [
            'status' => $response['status'] ?? 'unknown',
            'transaction_id' => $response['transaction_id'] ?? null,
        ]);

        return $response;
    }
}
```

**Debug logging in production — a PCI risk:**

```php
// In app/etc/env.php — ensure debug logging is OFF in production
'dev' => [
    'debug' => [
        'debug_logging' => 0  // 0 = disabled
    ]
]
```

**Exam focus:** The architectural answer to "we need to debug a payment integration issue in production" is **never** to enable full debug logging. Use transaction IDs to look up records at the gateway, use gateway's own dashboard/logs, or use a staging replica. Enabling debug logs on production payment flows is a PCI violation.

### 7.4 Cloud and On-Prem Compliance Differences

| Concern | On-Prem | Adobe Commerce Cloud |
|---|---|---|
| PCI scope | Entire server infrastructure | Reduced — Adobe manages infrastructure layer |
| SAQ type | SAQ D typically required | Often SAQ A or SAQ A-EP with hosted fields |
| Card data transmission | Merchant's server can be in path | Tokenization before data reaches Magento |
| Log management | Merchant controls | Adobe manages infrastructure logs |
| Patch responsibility | Merchant | Shared (Adobe for platform, merchant for custom code) |

---

## 8. File System Permissions

### 8.1 Critical Directories and Their Required Permissions

```
Magento Root/
  |
  +-- app/                  Read-only (code)
  +-- bin/                  Read + Execute (magento CLI)
  +-- generated/            Writable (DI compilation output)
  +-- lib/                  Read-only (vendor libraries)
  +-- pub/
  |     +-- static/         Writable (deployed static assets)
  |     +-- media/          Writable (uploaded media/images)
  +-- var/
  |     +-- cache/          Writable (page/block cache)
  |     +-- log/            Writable (application logs)
  |     +-- session/        Writable (PHP sessions if file-based)
  |     +-- tmp/            Writable (temporary files)
  |     +-- view_preprocessed/  Writable (LESS compilation)
  +-- vendor/               Read-only (Composer dependencies)
```

**Recommended permissions:**

```bash
# Directories
find . -type d -exec chmod 755 {} \;

# Files
find . -type f -exec chmod 644 {} \;

# Executable
chmod 755 bin/magento

# Writable directories (web server user must own or have write access)
chmod 777 var/ pub/static/ pub/media/ generated/
# OR more securely with proper ownership:
# chown -R www-data:www-data var/ pub/static/ pub/media/ generated/
# chmod -R 775 var/ pub/static/ pub/media/ generated/
```

**Exam focus:** `pub/media/` must be writable for image uploads. `generated/` must be writable unless you pre-generate DI/proxy code. `var/` must be writable for caching, logging, and session storage. `app/code/` and `vendor/` should be read-only in production.

### 8.2 Read-Only Filesystem in Cloud Deploy Phase

Adobe Commerce Cloud uses a **read-only filesystem** during the `deploy` phase (and in production), with the exception of designated writable mounts.

**The deploy lifecycle:**

```
[Build Phase]          [Deploy Phase]          [Post-Deploy Phase]
Read-Write access      Read-Only filesystem     Read-Write mounts
                       + writable mounts        available
Build artifacts,       Run deploy hooks,        Run post-deploy hooks
compile DI,            update DB, flush cache   Warm cache, smoke tests
deploy static assets
```

**Writable mounts defined in `.magento.app.yaml`:**

```yaml
# .magento.app.yaml
mounts:
    "var": "shared:files/var"
    "app/etc": "shared:files/app-etc"
    "pub/static": "shared:files/pub-static"
    "pub/media": "shared:files/pub-media"
    "generated": "shared:files/generated"
```

**Why read-only matters architecturally:**

```
Problem: Module tries to write a config file to app/code/ during runtime
Result: Permission denied error in production

Root cause: Developer assumed filesystem is always writable

Correct solution: 
  - Write dynamic data to var/ 
  - Write user uploads to pub/media/
  - Write generated code to generated/
  - NEVER write to app/code/, vendor/, or lib/ at runtime
```

**Exam focus:** If a scenario describes a module that writes files to `app/code/` or `vendor/` during runtime, the architecturally correct response is that this will fail on Cloud (and is bad practice on-prem). Runtime-generated content belongs in `var/` or `pub/media/`. Code belongs in `app/code/` only at development time, deployed via Git.

### 8.3 Static Content Deployment and Permissions

```bash
# Deploy static content (requires pub/static to be writable)
bin/magento setup:static-content:deploy -f en_US en_GB

# In Cloud, this happens during Build phase:
# pub/static is populated from Git assets + compilation
# Then mounted as writable in Deploy phase for dynamic assets
```

**The `pub/static/_cache/` and `pub/static/frontend/` directories** are written during `setup:static-content:deploy`. In Cloud, this happens in the build container where the filesystem is writable, and the result is then deployed as a read-only artifact with the mount overlay providing writable access for cache invalidation.

---

## 9. Hands-On Reference

### 9.1 Finding `csp_whitelist.xml` Files

```bash
# Find all csp_whitelist.xml files in the codebase
find . -name "csp_whitelist.xml" -not -path "*/node_modules/*"

# Key locations to check:
# vendor/magento/module-csp/etc/csp_whitelist.xml     <- Core CSP rules
# vendor/magento/module-paypal/etc/csp_whitelist.xml  <- PayPal domains
# vendor/magento/module-braintree/etc/csp_whitelist.xml

# Show content of a specific whitelist
cat vendor/magento/module-paypal/etc/csp_whitelist.xml

# Check your custom module
cat app/code/Vendor/Module/etc/csp_whitelist.xml
```

**What to look for in `csp_whitelist.xml` during review:**

```
1. Are wildcard entries minimized? (*.vendor.com is less secure than specific-service.vendor.com)
2. Are there any type="eval" entries? (Flag as high risk)
3. Are there any type="inline" entries for script-src? (Flag for review)
4. Does every entry have a specific id attribute? (Required for tracing)
5. Are all hosts HTTPS? (HTTP entries allow man-in-the-middle)
```

### 9.2 Tracing a REST Endpoint ACL Resource from `webapi.xml` to `acl.xml`

**Step 1: Find the endpoint in `webapi.xml`**

```bash
# Search for a specific route
grep -r "V1/products" vendor/magento/module-catalog/etc/webapi.xml

# Or search for a service class
grep -r "ProductRepositoryInterface" vendor/magento/module-catalog/etc/webapi.xml
```

**Step 2: Read the resource reference**

```xml
<!-- vendor/magento/module-catalog/etc/webapi.xml -->
<route url="/V1/products/:sku" method="GET">
    <service class="Magento\Catalog\Api\ProductRepositoryInterface" method="get"/>
    <resources>
        <resource ref="Magento_Catalog::products"/>  <!-- <-- This is the ACL resource ID -->
    </resources>
</route>
```

**Step 3: Find the resource in `acl.xml`**

```bash
# Search for the resource ID across all acl.xml files
grep -r "Magento_Catalog::products" vendor/magento/module-catalog/etc/acl.xml
```

**Step 4: Read the ACL tree context**

```xml
<!-- vendor/magento/module-catalog/etc/acl.xml -->
<resource id="Magento_Backend::admin">
    <resource id="Magento_Catalog::catalog" title="Catalog">
        <resource id="Magento_Catalog::catalog_inventory" title="Inventory">
            <resource id="Magento_Catalog::products" title="Products" sortOrder="10"/>
            <!-- Granting Magento_Catalog::catalog also grants Magento_Catalog::products -->
        </resource>
    </resource>
</resource>
```

**Step 5: Verify the full trace**

```
REST GET /V1/products/:sku
          |
          v
webapi.xml: resource ref="Magento_Catalog::products"
          |
          v
acl.xml: Magento_Catalog::products is child of Magento_Catalog::catalog_inventory
          |
          v
Admin role with "Catalog > Inventory > Products" checked -> 200 OK
Admin role without this resource -> 403 Forbidden
Integration token with Magento_Catalog::products assigned -> 200 OK
Customer token (self) -> 403 Forbidden (this route requires admin resource, not self)
Anonymous -> 403 Forbidden
```

**Step 6: Test with `curl`**

```bash
# Get admin token
ADMIN_TOKEN=$(curl -s -X POST \
  "https://your-store.com/rest/V1/integration/admin/token" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}')

# Test the endpoint
curl -X GET \
  "https://your-store.com/rest/V1/products/SKU-001" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Test without auth (should get 401)
curl -X GET "https://your-store.com/rest/V1/products/SKU-001"

# Test with customer token (should get 403 for admin resources)
CUSTOMER_TOKEN=$(curl -s -X POST \
  "https://your-store.com/rest/V1/integration/customer/token" \
  -H "Content-Type: application/json" \
  -d '{"username":"customer@example.com","password":"password"}')

curl -X GET \
  "https://your-store.com/rest/V1/products/SKU-001" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

---

## 10. Architectural Decision Frameworks

### 10.1 Security Decision Matrix for Exam Scenarios

When a scenario presents a security problem, evaluate answers using this hierarchy:

```
[Security Problem Presented]
           |
           v
1. Does the "easy" fix disable a security control entirely?
   -> If YES: Wrong answer (unless explicitly asked for trade-off analysis)
           |
           v
2. Does the correct fix address root cause vs. symptom?
   -> Root cause fix = architecturally superior answer
           |
           v
3. Does the fix follow least privilege principle?
   -> Grant minimum necessary access, not maximum
           |
           v
4. Is the fix sustainable (codified in version control)?
   -> Config in XML files > manual admin changes
           |
           v
5. Does the fix maintain auditability?
   -> Logged, reviewable, reversible changes preferred
```

### 10.2 Common Exam Scenario Patterns

**Scenario: Third-party JavaScript fails to load on storefront**

| Answer Option | Assessment |
|---|---|
| Disable CSP entirely (set to report-only) | ✗ Removes protection — wrong |
| Add the CDN domain to `script-src` in `csp_whitelist.xml` | ✓ Correct — minimum necessary exception |
| Move the script to Magento's own CDN | Technically valid but not what the scenario asks |
| Whitelist all external scripts with wildcard | ✗ Over-permissive — wrong |

**Scenario: Payment module logs contain card data**

| Answer Option | Assessment |
|---|---|
| Disable payment debug logging | Treats symptom, not root cause |
| Filter card data from log entries before writing | ✓ Correct — root cause fix |
| Encrypt the log files | Does not prevent PCI violation of storing the data |
| Move logs to a PCI-scoped system | Expands PCI scope — wrong direction |

**Scenario: REST API endpoint returns 403 for integration**

| Answer Option | Assessment |
|---|---|
| Give integration "all resources" access | ✗ Violates least privilege |
| Identify the specific resource ID from webapi.xml, grant only that | ✓ Correct |
| Change resource ref to `anonymous` | ✗ Removes authentication requirement |
| Debug by checking both webapi.xml and acl.xml | ✓ Correct diagnostic approach |

### 10.3 "Why" Behind Each Security Decision

This section addresses the exam's focus on architectural reasoning:

**Why ACL uses a tree (not a flat list):**
- Delegated administration: grant a branch without granting unrelated permissions
- Inheritance reduces configuration overhead for similar roles
- Future expansion: new child resources are automatically included when parent is granted

**Why REST doesn't use form keys:**
- HTTP `Authorization` header cannot be forged via cross-site HTML form submission
- Stateless authentication (tokens) doesn't rely on session state that CSRF exploits
- If form keys were required, REST API clients would need to parse HTML to extract keys — impossible for machine clients

**Why `addFieldToFilter` is architecturally preferred over raw SQL:**
- Parameterization is enforced structurally — you cannot accidentally interpolate user data
- Query portability: the Collection layer handles database-specific quoting
- Testability: Collections can be mocked; raw SQL strings cannot easily be verified

**Why vault tokens replace card storage:**
- Removes card data from Magento's database and logs — takes Magento out of PCI scope for storage
- Breach impact: stolen tokens cannot be used directly; require gateway API access too
- Customer experience: repeat purchases without re-entering card (token is safe to store)

**Why read-only filesystem on Cloud is an architectural feature:**
- Immutable deployments: code deployed from Git is exactly what runs in production
- Prevents runtime file modification attacks
- Enables horizontal scaling: multiple containers share the same read-only code base
- Forces proper separation: runtime state goes to writable mounts (var/, pub/media/)

---

## Quick-Reference Checklist

### ACL System
- [ ] `acl.xml` lives in `Vendor/Module/etc/acl.xml` — all resources must be under `Magento_Backend::admin`
- [ ] Resource ID format: `Vendor_Module::snake_case_name` — must match exactly everywhere
- [ ] Admin controllers declare `const ADMIN_RESOURCE = 'Vendor_Module::resource_id'`
- [ ] Non-controller code uses `AuthorizationInterface::isAllowed('full::resource_id')`
- [ ] `webapi.xml` `<resource ref="">` uses the same ACL resource IDs as admin controllers
- [ ] Special `webapi.xml` values: `anonymous` (no auth), `self` (customer token), specific ID (admin/integration)
- [ ] ACL tree is hierarchical: granting parent grants all children
- [ ] Integration token scope is limited to the ACL resources assigned at creation

### CSRF Protection
- [ ] HTML forms (admin and frontend) require form key in hidden input
- [ ] REST API and GraphQL do NOT need form keys — `Authorization` header is CSRF-safe by design
- [ ] `CsrfAwareActionInterface` controls validation behavior in controllers
- [ ] `validateForCsrf()` returning `null` = use default validation; `true` = skip; `false` = force fail

### XSS Prevention
- [ ] `escapeHtml()` — use for text content between HTML tags and HTML attribute values
- [ ] `escapeUrl()` — use for URLs in `href`, `src`, `action`; strips `javascript:` and `data:` protocols
- [ ] `escapeJs()` — use inside JavaScript string literals
- [ ] `escapeHtmlAttr()` — more strict escaping for HTML attribute values
- [ ] `json_encode()` — preferred for passing PHP arrays/objects to JavaScript
- [ ] `escapeHtml($text, $allowedTags)` — allows specific HTML tags for admin-trusted content
- [ ] `@noEscape` comment suppresses static analysis for intentional raw output
- [ ] Using `escapeHtml()` for URLs does NOT strip `javascript:` — critical difference

### SQL Injection Prevention
- [ ] NEVER interpolate user input into SQL strings — use parameter binding always
- [ ] `$connection->select()->where('col = ?', $value)` — safe, binds parameter
- [ ] `$connection->select()->where('col = :name', ['name' => $value])` — safe, named binding
- [ ] `addFieldToFilter()` — safe because it uses query builder, not string interpolation
- [ ] `quoteInto('col = ?', $value)` — last resort for raw SQL scenarios
- [ ] All `addFieldToFilter()` operators (eq, neq, like, in, nin, gt, lt, etc.) use parameter binding

### Content Security Policy
- [ ] `csp_whitelist.xml` in `Vendor/Module/etc/` adds CSP exceptions per module
- [ ] Policy directives: `script-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `frame-src`
- [ ] `type="host"` — specific domain (preferred), supports wildcard `*.domain.com`
- [ ] `type="inline"` — allows inline scripts/styles (use sparingly)
- [ ] `type="eval"` — allows eval() — avoid in production
- [ ] CSP enforced (not just report-only) in more areas in Magento 2.4.8
- [ ] Never disable CSP entirely — add minimum necessary whitelist entries instead
- [ ] For CDN scripts: add CDN domain to `script-src`, not disable CSP

### Admin Security
- [ ] `Magento_TwoFactorAuth` — 2FA required by default since Magento 2.4.0
- [ ] 2FA providers: Google Authenticator, Authy, Duo, U2F/YubiKey
- [ ] Adobe Commerce Cloud option: `Magento_AdminAdobeImsTwoFactorAuth` for IMS SSO
- [ ] Admin URL customization via `backend/frontName` in `env.php` or Cloud env vars
- [ ] Max login failures default: 6; lockout period default: 30 minutes
- [ ] `bin/magento admin:user:unlock <username>` — release lockout
- [ ] Session lifetime config: `admin/security/session_lifetime`
- [ ] 2FA + brute-force protection + IP allowlisting = defense in depth (all required)

### PCI Compliance
- [ ] NEVER store CVV/CVC — not even encrypted — EVER
- [ ] NEVER log full card numbers (PAN) — in any log at any level
- [ ] Safe to store: card type, last 4 digits, expiry month/year, gateway token
- [ ] Vault pattern: card -> gateway -> token returned -> token stored in `vault_payment_token`
- [ ] Debug logging on payment flows in production = PCI violation
- [ ] Payment tokens cannot be used directly without gateway API access
- [ ] `vault_payment_token.details` column stores JSON with masked card info only

### File System Permissions
- [ ] `var/` — writable (cache, logs, sessions, tmp)
- [ ] `pub/media/` — writable (uploaded images and files)
- [ ] `pub/static/` — writable (deployed static assets)
- [ ] `generated/` — writable (DI compilation, proxies, factories)
- [ ] `app/code/`, `vendor/`, `lib/` — read-only in production
- [ ] Cloud deploy phase: filesystem is read-only except for defined mounts in `.magento.app.yaml`
- [ ] Modules must never write to `app/code/` or `vendor/` at runtime
- [ ] Static content deployment requires `pub/static/` to be writable (happens in build phase on Cloud)
- [ ] Immutable deployments: code comes from Git, runtime state goes to writable mounts

### Tracing REST ACL (Hands-On)
- [ ] Step 1: Find route in `webapi.xml` — check `<resource ref="...">` value
- [ ] Step 2: Search for that resource ID in `acl.xml` files
- [ ] Step 3: Identify parent resources (granting parent grants the endpoint's resource)
- [ ] Step 4: Verify integration token has that specific resource assigned
- [ ] 401 = not authenticated (bad/missing token); 403 = authenticated but not authorized
- [ ] `grep -r "V1/route-path" vendor/magento/module-name/etc/webapi.xml` to find routes
