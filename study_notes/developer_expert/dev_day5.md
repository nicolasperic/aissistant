# Adobe Commerce Security Features — Day 5 Study Notes

## Table of Contents
1. [Content Security Policy (CSP)](#1-content-security-policy-csp)
2. [Output Escaping](#2-output-escaping)
3. [Form Keys & CSRF Protection](#3-form-keys--csrf-protection)
4. [Input Sanitization](#4-input-sanitization)
5. [reCAPTCHA Configuration](#5-recaptcha-configuration)
6. [Input Validation: Laminas\Validator & ACL](#6-input-validation-laminasvalidator--acl)
7. [Secure HTTP Headers](#7-secure-http-headers)
8. [Practice Exercise Notes](#8-practice-exercise-notes)
9. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Content Security Policy (CSP)

### What Is CSP?

Content Security Policy is an HTTP response header that instructs the browser which sources of content (scripts, styles, images, fonts, etc.) are allowed to load. It is the primary browser-side defence against **Cross-Site Scripting (XSS)** and **data-injection attacks**.

Adobe Commerce 2.3.5+ ships with CSP enabled by default. Commerce distinguishes between:

| Mode | Header Name | Effect |
|---|---|---|
| **Report-Only** | `Content-Security-Policy-Report-Only` | Violations are logged; nothing is blocked |
| **Enforcement** | `Content-Security-Policy` | Violations are blocked by the browser |

**Exam focus:**
- Report-Only mode does **not** block anything — it only sends violation reports to the `report-uri`
- Enforcement mode actively blocks disallowed resources
- Commerce uses **both** headers simultaneously during migration to enforcement

---

### CSP Architecture in Adobe Commerce

```
+---------------------------+
|   csp_whitelist.xml       |  <-- module-level, per-area declarations
+---------------------------+
           |
           v
+---------------------------+
|  Magento\Csp\Model\       |  <-- aggregates all whitelist XML files
|  CompliancePolicy         |
+---------------------------+
           |
           v
+---------------------------+
|  HTTP Response Headers    |  <-- injected by CspHeaderPlugin
+---------------------------+
```

### `csp_whitelist.xml` — Structure & Location

**File location:** `<Module>/etc/csp_whitelist.xml`

```xml
<?xml version="1.0"?>
<csp_whitelist xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Csp:etc/csp_whitelist.xsd">
    <policies>
        <!-- Allow a specific external script -->
        <policy id="script-src">
            <values>
                <value id="google-analytics" type="host">https://www.google-analytics.com</value>
                <value id="google-tag-manager" type="host">https://www.googletagmanager.com</value>
            </values>
        </policy>

        <!-- Allow an external stylesheet -->
        <policy id="style-src">
            <values>
                <value id="google-fonts-css" type="host">https://fonts.googleapis.com</value>
            </values>
        </policy>

        <!-- Allow an external font -->
        <policy id="font-src">
            <values>
                <value id="google-fonts-gstatic" type="host">https://fonts.gstatic.com</value>
            </values>
        </policy>

        <!-- Allow connecting to an API endpoint -->
        <policy id="connect-src">
            <values>
                <value id="my-api" type="host">https://api.example.com</value>
            </values>
        </policy>

        <!-- Allow inline scripts via nonce (handled automatically) -->
        <policy id="script-src">
            <values>
                <value id="inline-nonce" type="nonce"/>
            </values>
        </policy>
    </policies>
</csp_whitelist>
```

**Exam focus:**
- The `type` attribute accepts `host`, `hash`, or `nonce`
- Policy IDs map directly to CSP directive names: `script-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `frame-src`, `object-src`, etc.
- Files are **merged** across all modules; you cannot override another module's whitelist entry, only add to it

---

### Nonces

A **nonce** (number-used-once) is a randomly generated, base64-encoded token injected into both the CSP header and individual `<script>` or `<style>` tags. The browser allows execution only when the nonces match.

```php
// Retrieving a nonce in a Block class
use Magento\Csp\Helper\CspNonceProvider;

class MyBlock extends \Magento\Framework\View\Element\Template
{
    public function __construct(
        \Magento\Framework\View\Element\Template\Context $context,
        private readonly CspNonceProvider $nonceProvider,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    public function getNonce(): string
    {
        return $this->nonceProvider->generateNonce();
    }
}
```

```html
<!-- In a .phtml template -->
<script nonce="<?= $block->escapeHtmlAttr($block->getNonce()) ?>">
    require(['jquery'], function ($) {
        // inline script allowed by nonce
    });
</script>
```

**Exam focus:**
- Nonces are regenerated on every page request — they cannot be reused
- Using `'unsafe-inline'` defeats the purpose of CSP; nonces are the correct alternative
- `escapeHtmlAttr()` must be used when outputting the nonce into an HTML attribute

---

### Enabling / Configuring CSP Modes

**Via Admin:** Stores → Configuration → Security → Content Security Policy

**Via `config.xml`:**

```xml
<system>
    <default>
        <csp>
            <mode>
                <storefront>
                    <report_only>0</report_only> <!-- 0 = enforce, 1 = report-only -->
                </storefront>
                <admin>
                    <report_only>1</report_only>
                </admin>
            </mode>
        </csp>
    </default>
</system>
```

**Exam focus:**
- `report_only = 1` → Report-Only mode (safe for development/staging)
- `report_only = 0` → Enforcement mode (use in production after testing)
- Storefront and Admin can have **different** modes

---

## 2. Output Escaping

### Why Output Escaping Matters

Output escaping prevents **reflected and stored XSS** by neutralizing special characters before they are rendered by the browser. Adobe Commerce provides context-aware escaping methods via `\Magento\Framework\Escaper`.

The Escaper is available in `.phtml` templates as `$escaper` (injected by the view layer in Commerce 2.4+) and as `$block->escapeX()` methods (legacy; still valid).

---

### Escaping Methods — When to Use Which

| Method | Context | Characters Escaped | Example Output |
|---|---|---|---|
| `escapeHtml()` | HTML body text (between tags) | `< > & " '` (entities) | `&lt;script&gt;` |
| `escapeHtmlAttr()` | HTML attribute values | All non-alphanumeric chars | `&#x2F;` etc. |
| `escapeUrl()` | URL values (href, src) | URL-encodes unsafe chars | `%3Cscript%3E` |
| `escapeJs()` | JavaScript string literals | `\ / " '` etc. | `\x3Cscript\x3E` |
| `escapeCss()` | CSS property values | Non-CSS-safe chars | — |

---

### `escapeHtml()` — HTML Body Context

```php
// In a .phtml template
echo $escaper->escapeHtml($block->getProductName());

// Allowing specific tags (second parameter - allowed tags array)
echo $escaper->escapeHtml($block->getDescription(), ['b', 'i', 'em', 'strong']);
// ^ Only <b>, <i>, <em>, <strong> tags are preserved; all others stripped
```

**Exam focus:**
- Default `escapeHtml()` with **no** second argument strips ALL HTML tags
- Passing an allowed-tags array preserves those tags but still escapes their attributes
- Use this for any user-supplied text rendered between HTML tags

---

### `escapeHtmlAttr()` — HTML Attribute Context

```php
<!-- Correct: output inside an HTML attribute -->
<div data-label="<?= $escaper->escapeHtmlAttr($block->getLabel()) ?>">

<!-- Correct: nonce attribute -->
<script nonce="<?= $escaper->escapeHtmlAttr($nonce) ?>">

<!-- WRONG: escapeHtml() in an attribute is insufficient -->
<div data-label="<?= $escaper->escapeHtml($block->getLabel()) ?>"> <!-- vulnerable to attr injection -->
```

**Exam focus:**
- `escapeHtmlAttr()` is stricter than `escapeHtml()` — it escapes characters that are safe in body text but dangerous inside attributes
- Must be used for every value placed inside an HTML tag's attribute

---

### `escapeUrl()` — URL Context

```php
<!-- Correct: href and src attributes containing dynamic URLs -->
<a href="<?= $escaper->escapeUrl($block->getRedirectUrl()) ?>">Click here</a>
<img src="<?= $escaper->escapeUrl($block->getImageUrl()) ?>">
```

**Exam focus:**
- `escapeUrl()` prevents **javascript:** protocol injection (e.g., `javascript:alert(1)`)
- Always use for dynamic URL values, even if the URL appears safe

---

### `escapeJs()` — JavaScript Context

```php
<!-- Correct: value embedded inside a JS string literal -->
<script>
    var productName = '<?= $escaper->escapeJs($block->getProductName()) ?>';
    var config = <?= /* @noEscape */ $block->getSerializedConfig() ?>; // JSON is self-escaping
</script>
```

**Exam focus:**
- `escapeJs()` is for embedding PHP values inside JavaScript **string literals** (between quotes)
- For passing structured data, prefer `json_encode()` with `JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP` flags, then use `/* @noEscape */`
- **Never** concatenate unescaped PHP into a JS block

---

### `@noEscape` and `@escapeNotVerified` Annotations

```php
// @noEscape — tells static analysis the value is safe (e.g., already escaped or is a URL)
echo /* @noEscape */ $safeStaticString;

// @escapeNotVerified — suppresses the warning but flags the line for future review
echo /* @escapeNotVerified */ $maybeUnsafeValue;
```

**Exam focus:**
- `@noEscape` suppresses Magento's automated escaping audit warnings
- Overuse of `@noEscape` is a code-review red flag — each instance should be justified

---

## 3. Form Keys & CSRF Protection

### What Are Form Keys?

A **form key** (CSRF token) is a unique, session-bound, cryptographically random string that must accompany every state-changing POST request. The server validates it before processing the request, preventing **Cross-Site Request Forgery** attacks.

```
Browser                        Server
  |                               |
  |-- GET /checkout/cart/ ------> |
  |<-- HTML with form key ------- |  (key stored in session)
  |                               |
  |-- POST + form_key=abc123 ---> |
  |   (server verifies key)       |
  |<-- 200 OK ------------------- |
```

---

### `FormKey` Class

```php
use Magento\Framework\Data\Form\FormKey;

class MyController extends \Magento\Framework\App\Action\Action
{
    public function __construct(
        \Magento\Framework\App\Action\Context $context,
        private readonly FormKey $formKey
    ) {
        parent::__construct($context);
    }

    // Generate the form key for a template
    public function getFormKey(): string
    {
        return $this->formKey->getFormKey();
    }
}
```

**In a `.phtml` template:**

```php
<form method="post" action="<?= $escaper->escapeUrl($block->getActionUrl()) ?>">
    <!-- Method 1: Block helper -->
    <input type="hidden"
           name="form_key"
           value="<?= $escaper->escapeHtmlAttr($block->getFormKey()) ?>">

    <!-- Method 2: Using the FormKey block directly -->
    <?= $block->getBlockHtml('formkey') ?>

    <button type="submit">Submit</button>
</form>
```

---

### Validating the Form Key in a Controller

```php
use Magento\Framework\App\Action\HttpPostActionInterface;
use Magento\Framework\Data\Form\FormKey\Validator as FormKeyValidator;

class SaveAction implements HttpPostActionInterface
{
    public function __construct(
        private readonly FormKeyValidator $formKeyValidator,
        private readonly \Magento\Framework\App\RequestInterface $request,
        private readonly \Magento\Framework\Controller\Result\RedirectFactory $redirectFactory,
        private readonly \Magento\Framework\Message\ManagerInterface $messageManager
    ) {}

    public function execute(): \Magento\Framework\Controller\ResultInterface
    {
        // Validate CSRF token before any processing
        if (!$this->formKeyValidator->validate($this->request)) {
            $this->messageManager->addErrorMessage(__('Invalid form key. Please refresh and try again.'));
            return $this->redirectFactory->create()->setPath('*/*/');
        }

        // ... process form data
    }
}
```

**Exam focus:**
- `FormKey\Validator::validate(RequestInterface $request)` returns `bool`
- Always validate before touching any submitted data
- The `CSRF` validation is **not** automatic — you must call the validator explicitly in custom controllers
- Controllers extending `\Magento\Framework\App\Action\Action` with `_processUrlKeys()` in older versions had implicit validation; modern `HttpPostActionInterface` does NOT

---

### AJAX Form Key

```javascript
// Retrieving the form key for AJAX requests via RequireJS
require(['Magento_Customer/js/customer-data'], function (customerData) {
    var formKey = customerData.get('form_key')();
    
    fetch('/custom/endpoint/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'form_key=' + encodeURIComponent(formKey) + '&data=value'
    });
});
```

```javascript
// Alternative: read from the hidden input field
var formKey = document.querySelector('input[name="form_key"]').value;
```

**Exam focus:**
- The form key is stored in the browser via `localStorage` / customer-data section called `form_key`
- AJAX POST requests to Commerce endpoints must include `form_key`
- REST API uses OAuth / token-based auth — **no** form key needed for REST

---

## 4. Input Sanitization

### Defence in Depth Model

```
+---------------------------+
|   Frontend (Browser)      |  DOMPurify for HTML sanitization
+---------------------------+
           |
           v
+---------------------------+
|   Server-side Entry       |  filter_var(), strip_tags()
|   (Controllers/Models)    |  Laminas\Filter
+---------------------------+
           |
           v
+---------------------------+
|   Business Logic Layer    |  Type casting, whitelist validation
+---------------------------+
           |
           v
+---------------------------+
|   Database Layer          |  PDO prepared statements (ORM handles this)
+---------------------------+
```

---

### `filter_var()` — PHP Native Sanitization

```php
// Sanitize an email address
$email = filter_var($rawEmail, FILTER_SANITIZE_EMAIL);

// Validate an email (returns false if invalid)
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    throw new \InvalidArgumentException('Invalid email address.');
}

// Sanitize an integer
$productId = filter_var($rawId, FILTER_SANITIZE_NUMBER_INT);

// Validate an integer within a range
$qty = filter_var($rawQty, FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 1, 'max_range' => 10000]
]);

// Sanitize a URL
$url = filter_var($rawUrl, FILTER_SANITIZE_URL);
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    throw new \InvalidArgumentException('Invalid URL.');
}

// Sanitize a string (removes tags)
$name = filter_var($rawName, FILTER_SANITIZE_SPECIAL_CHARS);
```

**Exam focus:**
- `FILTER_SANITIZE_*` modifies the value; `FILTER_VALIDATE_*` returns false/null if invalid
- `FILTER_SANITIZE_STRING` is **deprecated** in PHP 8.1 — use `strip_tags()` + `htmlspecialchars()` instead
- Never rely solely on frontend validation — always re-validate server-side

---

### Laminas\Filter in Adobe Commerce

```php
use Laminas\Filter\StripTags;
use Laminas\Filter\StringTrim;
use Laminas\Filter\FilterChain;

$filterChain = new FilterChain();
$filterChain->attach(new StringTrim());
$filterChain->attach(new StripTags());

$cleanInput = $filterChain->filter($rawUserInput);
```

```php
// Using Magento's ObjectManager / DI for filters
use Magento\Framework\Filter\FilterManager;

class MyModel
{
    public function __construct(
        private readonly FilterManager $filterManager
    ) {}

    public function sanitizeHtml(string $html): string
    {
        return $this->filterManager->stripTags($html);
    }
}
```

---

### DOMPurify — Frontend HTML Sanitization

DOMPurify is a JavaScript library that sanitizes HTML strings before injecting them into the DOM, preventing DOM-based XSS.

```javascript
// Basic usage — strip dangerous elements/attributes
require(['domPurify'], function (DOMPurify) {
    var dirty = '<img src=x onerror=alert(1)> Hello <b>World</b>';
    var clean = DOMPurify.sanitize(dirty);
    // Result: ' Hello <b>World</b>'
    document.getElementById('output').innerHTML = clean;
});
```

```javascript
// Allow only specific tags
var clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
    ALLOWED_ATTR: ['class']
});
```

**Exam focus:**
- DOMPurify is the correct tool when you must allow **some** HTML but need to strip dangerous parts
- Never use `innerHTML = userInput` without DOMPurify (or equivalent) when the input contains HTML
- DOMPurify runs client-side — server-side sanitization is still required independently

---

### Server-Side Validation Best Practices

```php
// Type casting (simple but effective for numeric IDs)
$productId = (int) $this->request->getParam('product_id');

// Whitelist validation
$allowedStatuses = ['pending', 'processing', 'complete', 'canceled'];
$status = $this->request->getParam('status');
if (!in_array($status, $allowedStatuses, true)) {
    throw new \InvalidArgumentException('Invalid order status.');
}

// Using Magento's request object (already does basic filtering)
$param = $this->request->getParam('name'); // returns null if not set
$params = $this->request->getParams();     // all params as array
```

---

## 5. reCAPTCHA Configuration

### Overview

Adobe Commerce integrates Google reCAPTCHA to protect forms from bots. Three types are supported:

| Type | UI | How It Works | Best For |
|---|---|---|---|
| **v2 Checkbox** | "I'm not a robot" checkbox | User clicks; may show image challenge | Login, registration |
| **v2 Invisible** | No visible widget | Score-based; challenge appears only if suspicious | Checkout, newsletter |
| **v3** | No user interaction | Pure score-based (0.0–1.0) | High-traffic forms |

**Exam focus:**
- reCAPTCHA v3 **never** shows a challenge — it assigns a score and you define a threshold
- v2 Invisible shows a challenge only when the score is low
- v2 Checkbox always shows the checkbox widget

---

### Configuration Location

**Admin:** Stores → Configuration → Security → Google reCAPTCHA Storefront / Admin

```xml
<!-- config.xml — default values -->
<default>
    <recaptcha_frontend>
        <type>recaptcha_v3</type>             <!-- recaptcha, invisible, recaptcha_v3 -->
        <score_threshold>0.5</score_threshold> <!-- v3 only: 0.0 (bot) to 1.0 (human) -->
        <public_key>YOUR_SITE_KEY</public_key>
        <private_key>YOUR_SECRET_KEY</private_key>
        <size>normal</size>     <!-- normal | compact (v2 only) -->
        <theme>light</theme>    <!-- light | dark (v2 only) -->
    </recaptcha_frontend>
</default>
```

---

### Per-Form Configuration

Each form can independently enable/disable reCAPTCHA and choose its type:

| Form | Admin Path |
|---|---|
| Customer Login | `recaptcha_frontend/type_for/customer_login` |
| Customer Registration | `recaptcha_frontend/type_for/customer_create` |
| Forgot Password | `recaptcha_frontend/type_for/customer_forgot_password` |
| Contact Us | `recaptcha_frontend/type_for/contact` |
| Newsletter Subscription | `recaptcha_frontend/type_for/newsletter` |
| Product Review | `recaptcha_frontend/type_for/product_review` |
| Checkout (PayPal) | `recaptcha_frontend/type_for/place_order` |
| Admin Login | `recaptcha_backend/type_for/user_login` |

**Exam focus:**
- Each form type has its own config path — they are **independent**
- Disabling reCAPTCHA for one form does not affect others
- Admin forms use `recaptcha_backend`; storefront forms use `recaptcha_frontend`

---

### Programmatic reCAPTCHA Validation

```php
use Magento\ReCaptchaValidationApi\Api\ValidatorInterface;
use Magento\ReCaptchaUi\Model\IsCaptchaEnabledInterface;

class ContactController implements HttpPostActionInterface
{
    public function __construct(
        private readonly ValidatorInterface $captchaValidator,
        private readonly IsCaptchaEnabledInterface $isCaptchaEnabled,
        private readonly \Magento\Framework\App\RequestInterface $request
    ) {}

    public function execute(): \Magento\Framework\Controller\ResultInterface
    {
        if ($this->isCaptchaEnabled->isCaptchaEnabledFor('contact')) {
            $reCaptchaResponse = $this->request->getParam('g-recaptcha-response', '');
            $validationResult = $this->captchaValidator->isValid($reCaptchaResponse, []);

            if (!$validationResult->isValid()) {
                // Handle failure
                foreach ($validationResult->getErrors() as $error) {
                    // $error->getMessage()
                }
            }
        }
        // ... process contact form
    }
}
```

---

## 6. Input Validation: Laminas\Validator & ACL

### Laminas\Validator (formerly Zend_Validate)

Adobe Commerce uses Laminas validators for server-side data validation. They return detailed error messages and support chaining.

```php
use Laminas\Validator\EmailAddress;
use Laminas\Validator\StringLength;
use Laminas\Validator\NotEmpty;
use Laminas\Validator\ValidatorChain;

// Single validator
$emailValidator = new EmailAddress();
if (!$emailValidator->isValid($email)) {
    $errors = $emailValidator->getMessages(); // array of error messages
}

// Validator chain
$chain = new ValidatorChain();
$chain->attach(new NotEmpty());
$chain->attach(new StringLength(['min' => 2, 'max' => 100]));
$chain->attach(new EmailAddress());

if (!$chain->isValid($userEmail)) {
    foreach ($chain->getMessages() as $message) {
        echo $message . PHP_EOL;
    }
}
```

---

### Common Laminas Validators in Commerce

```php
use Laminas\Validator\Between;
use Laminas\Validator\Digits;
use Laminas\Validator\Regex;
use Laminas\Validator\Uri;
use Laminas\Validator\CreditCard;
use Laminas\Validator\Ip;

// Numeric range
$between = new Between(['min' => 1, 'max' => 100, 'inclusive' => true]);

// Digits only
$digits = new Digits();

// Regex pattern
$regex = new Regex(['pattern' => '/^[a-zA-Z0-9_-]+$/']);

// URL validation
$uri = new Uri(['allowRelative' => false]);

// IP address
$ip = new Ip(['allowipv6' => true]);
```

**Exam focus:**
- `isValid()` returns `bool`; `getMessages()` returns `array` of human-readable error strings
- Validators throw no exceptions — always check return value of `isValid()`
- `ValidatorChain` stops at first failure by default; set `setBreakChainOnFailure(false)` to collect all errors

---

### Magento Input Validation via `\Magento\Framework\Validator`

```php
use Magento\Framework\Validator\Factory as ValidatorFactory;

class ProductValidator
{
    public function __construct(
        private readonly ValidatorFactory $validatorFactory
    ) {}

    public function validate(array $data): bool
    {
        $validator = $this->validatorFactory->createValidator('product', 'save');
        if (!$validator->isValid($data)) {
            throw new \Magento\Framework\Validator\Exception(
                new \Magento\Framework\Phrase(implode(', ', $validator->getMessages()))
            );
        }
        return true;
    }
}
```

---

### ACL (Access Control List) — Admin Resource Permissions

ACL controls which admin users can access which resources. Every custom admin controller and API endpoint must declare and check ACL resources.

#### Defining ACL Resources in `acl.xml`

```xml
<!-- <Module>/etc/acl.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Acl/etc/acl.xsd">
    <acl>
        <resources>
            <resource id="Magento_Backend::admin">
                <resource id="Magento_Backend::content">
                    <resource id="Vendor_Module::manage"
                              title="Manage My Resource"
                              translate="title"
                              sortOrder="10" />
                    <resource id="Vendor_Module::view"
                              title="View My Resource"
                              translate="title"
                              sortOrder="20" />
                    <resource id="Vendor_Module::delete"
                              title="Delete My Resource"
                              translate="title"
                              sortOrder="30" />
                </resource>
            </resource>
        </resources>
    </acl>
</config>
```

#### Protecting a Controller with ACL

```php
// Admin controller — must implement _isAllowed()
class Index extends \Magento\Backend\App\Action
{
    // Declare the required ACL resource constant
    const ADMIN_RESOURCE = 'Vendor_Module::manage';

    public function execute(): \Magento\Framework\Controller\ResultInterface
    {
        $resultPage = $this->resultPageFactory->create();
        $resultPage->setActiveMenu('Vendor_Module::manage');
        return $resultPage;
    }

    // _isAllowed() is inherited from \Magento\Backend\App\Action
    // It checks $this->_authorization->isAllowed(static::ADMIN_RESOURCE)
    // Override only for custom logic:
    protected function _isAllowed(): bool
    {
        return $this->_authorization->isAllowed('Vendor_Module::manage')
            || $this->_authorization->isAllowed('Vendor_Module::view');
    }
}
```

#### Declaring ACL for REST API Endpoints

```xml
<!-- <Module>/etc/webapi.xml -->
<route url="/V1/vendor-module/items" method="GET">
    <service class="Vendor\Module\Api\ItemRepositoryInterface" method="getList"/>
    <resources>
        <resource ref="Vendor_Module::view"/>
    </resources>
</route>

<route url="/V1/vendor-module/items/:id" method="DELETE">
    <service class="Vendor\Module\Api\ItemRepositoryInterface" method="deleteById"/>
    <resources>
        <resource ref="Vendor_Module::delete"/>
    </resources>
</route>
```

**Exam focus:**
- `ADMIN_RESOURCE` constant in an admin controller is **the recommended way** to declare required permission
- `_isAllowed()` in `\Magento\Backend\App\Action` uses `ADMIN_RESOURCE` by default
- ACL resources must be registered in `acl.xml` before they can be used
- REST API endpoints use `<resource ref="..."/>` in `webapi.xml`
- Anonymous access: `<resource ref="anonymous"/>` — no authentication required
- Self access: `<resource ref="self"/>` — authenticated customer accessing own data

---

## 7. Secure HTTP Headers

### Overview

Secure HTTP response headers instruct browsers to enforce additional security policies. These complement CSP and protect against common attack vectors.

```
+-------------------------------+------------------------------------------+
| Header                        | Protection Against                       |
+-------------------------------+------------------------------------------+
| X-Frame-Options               | Clickjacking                             |
| Strict-Transport-Security     | Protocol downgrade, MITM attacks         |
| X-Content-Type-Options        | MIME sniffing attacks                    |
| X-XSS-Protection              | Reflected XSS (legacy browsers)          |
| Referrer-Policy               | Information leakage via Referer header   |
| Permissions-Policy            | Browser feature abuse                    |
+-------------------------------+------------------------------------------+
```

---

### `X-Frame-Options`

Prevents the page from being embedded in an `<iframe>` on another domain, blocking **clickjacking**.

| Directive | Behaviour |
|---|---|
| `DENY` | Page cannot be framed by any origin |
| `SAMEORIGIN` | Page can only be framed by the same origin |
| `ALLOW-FROM uri` | Deprecated; use CSP `frame-ancestors` instead |

**Configuration in Commerce (`nginx.conf` or `.htaccess`):**

```nginx
# nginx
add_header X-Frame-Options "SAMEORIGIN" always;
```

```apache
# Apache .htaccess
Header always set X-Frame-Options "SAMEORIGIN"
```

**CSP equivalent (preferred modern approach):**

```
Content-Security-Policy: frame-ancestors 'self' https://trusted.example.com;
```

**Exam focus:**
- `ALLOW-FROM` is **not** supported in modern browsers — use CSP `frame-ancestors` directive instead
- Commerce Admin sets `X-Frame-Options: SAMEORIGIN` by default
- `frame-ancestors` in CSP **overrides** `X-Frame-Options` in supporting browsers

---

### `Strict-Transport-Security` (HSTS)

Forces browsers to use HTTPS for all future connections to the domain for a specified duration.

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

| Directive | Effect |
|---|---|
| `max-age=31536000` | Cache for 1 year (365 days × 86400 seconds) |
| `includeSubDomains` | Apply to all subdomains |
| `preload` | Submit to browser preload lists (permanent HTTPS enforcement) |

```nginx
# nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

**Exam focus:**
- HSTS is **only** sent over HTTPS — it has no effect on HTTP responses
- `preload` requires prior submission to [https://hstspreload.org](https://hstspreload.org) — it is not automatic
- Setting `max-age=0` removes the HSTS policy from the browser cache

---

### `X-Content-Type-Options`

Prevents browsers from **MIME-type sniffing** — guessing the content type from the content rather than the declared `Content-Type` header.

```
X-Content-Type-Options: nosniff
```

This has only one valid value: `nosniff`.

```nginx
add_header X-Content-Type-Options "nosniff" always;
```

**Exam focus:**
- `nosniff` is the **only** valid value
- Prevents browsers from executing a `.txt` file as JavaScript, for example
- Always set this header on all responses

---

### `X-XSS-Protection` (Legacy)

An older header that activated the browser's built-in XSS filter. **Deprecated and potentially harmful** in modern browsers.

```
X-XSS-Protection: 0  # Recommended: disable the filter entirely
```

**Exam focus:**
- Modern guidance (OWASP) recommends setting `X-XSS-Protection: 0` to disable the filter, as it can introduce vulnerabilities
- Rely on CSP instead for XSS protection

---

### `Referrer-Policy`

Controls how much referrer information is included in requests.

```
Referrer-Policy: strict-origin-when-cross-origin
```

| Value | Behaviour |
|---|---|
| `no-referrer` | Never send Referer header |
| `same-origin` | Send full URL only for same-origin requests |
| `strict-origin-when-cross-origin` | Full URL same-origin; origin-only cross-origin |
| `unsafe-url` | Always send full URL (never use) |

---

### Configuring Secure Headers in Adobe Commerce

**Via `env.php` or custom nginx/Apache config:**

```php
// app/etc/env.php — not typical for headers; use server config instead
```

```xml
<!-- For Admin panel hardening — Magento\Backend\App\Response\HeaderProvider -->
<!-- Custom header provider via DI: -->
```

```xml
<!-- di.xml — adding a custom secure header -->
<type name="Magento\Framework\HTTP\PhpEnvironment\Response">
    <plugin name="addSecureHeaders"
            type="Vendor\Security\Plugin\AddSecureHeadersPlugin"
            sortOrder="10"/>
</type>
```

```php
// Plugin to add security headers
namespace Vendor\Security\Plugin;

class AddSecureHeadersPlugin
{
    public function beforeSendResponse(
        \Magento\Framework\HTTP\PhpEnvironment\Response $subject
    ): void {
        $subject->setHeader('X-Content-Type-Options', 'nosniff', true);
        $subject->setHeader('Referrer-Policy', 'strict-origin-when-cross-origin', true);
        $subject->setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()', true);
    }
}
```

**Exam focus:**
- `X-Frame-Options: SAMEORIGIN` is set by default in Commerce Admin
- `X-Content-Type-Options: nosniff` should be set on all responses
- HSTS should only be configured **after** you are committed to HTTPS — it cannot be easily undone
- Commerce 2.4 introduced configurable security headers via Admin: Stores → Config → Security

---

## 8. Practice Exercise Notes

### Checking CSP Headers on Local CE/EE

```bash
# Using curl to inspect CSP headers (storefront)
curl -sI https://local.magento.test/ | grep -i "content-security-policy"

# Check both CSP headers (enforcement + report-only)
curl -sI https://local.magento.test/ | grep -i "content-security"

# Check Admin panel CSP headers (requires admin session — use browser DevTools instead)
# In Chrome: DevTools -> Network -> select page request -> Response Headers
```

```bash
# Check all security-relevant headers at once
curl -sI https://local.magento.test/ | grep -iE \
  "content-security-policy|x-frame-options|strict-transport|x-content-type|x-xss-protection"
```

**Expected output on a default Commerce installation:**

```
content-security-policy-report-only: font-src ... ; script-src ... 'nonce-xxxx' ...
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
```

---

### Inspecting `csp_whitelist.xml` for a Known Extension

```bash
# Find all csp_whitelist.xml files in the codebase
find vendor/ app/code/ -name "csp_whitelist.xml" | sort

# Inspect a specific extension (example: Magento_Paypal)
cat vendor/magento/module-paypal/etc/csp_whitelist.xml

# Count total whitelist entries across all modules
grep -r "type=\"host\"" vendor/magento/ --include="csp_whitelist.xml" | wc -l

# Find which module whitelists a specific domain
grep -r "google-analytics.com" vendor/ app/code/ --include="csp_whitelist.xml"
```

**Example output of a real extension's `csp_whitelist.xml`:**

```xml
<!-- vendor/magento/module-paypal/etc/csp_whitelist.xml (simplified) -->
<csp_whitelist>
    <policies>
        <policy id="script-src">
            <values>
                <value id="paypal-js" type="host">https://www.paypal.com</value>
                <value id="paypalobjects" type="host">https://www.paypalobjects.com</value>
            </values>
        </policy>
        <policy id="frame-src">
            <values>
                <value id="paypal-frame" type="host">https://www.paypal.com</value>
                <value id="paypal-sandbox" type="host">https://www.sandbox.paypal.com</value>
            </values>
        </policy>
        <policy id="img-src">
            <values>
                <value id="paypalobjects-img" type="host">https://www.paypalobjects.com</value>
            </values>
        </policy>
    </policies>
</csp_whitelist>
```

---

### EE vs CE CSP Differences

| Feature | CE (Community) | EE (Enterprise) |
|---|---|---|
| CSP enforcement mode | Available | Available |
| Payment method CSP entries | Fewer (basic methods) | More (Braintree, etc.) |
| B2B module CSP entries | Not included | Included |
| Page Builder CSP entries | Not included | Included (many iframe sources) |

**Exam focus:**
- Page Builder (EE) requires more permissive CSP due to embedded media/maps/videos
- EE has more `csp_whitelist.xml` files due to additional modules
- The **mechanism** is identical — only the number of whitelisted entries differs

---

## Quick-Reference Checklist

### CSP
- [ ] `csp_whitelist.xml` lives in `<Module>/etc/` and is **merged** across all modules
- [ ] `type="host"` — allows a specific host; `type="hash"` — allows by hash; `type="nonce"` — nonce-based
- [ ] **Report-Only mode** (`Content-Security-Policy-Report-Only`): logs violations, blocks nothing
- [ ] **Enforcement mode** (`Content-Security-Policy`): actively blocks disallowed resources
- [ ] `report_only = 1` in config = Report-Only; `report_only = 0` = Enforcement
- [ ] Nonces are generated per-request via `CspNonceProvider::generateNonce()`
- [ ] Nonces must be output with `escapeHtmlAttr()` in templates
- [ ] `'unsafe-inline'` defeats CSP — use nonces instead
- [ ] `frame-ancestors` CSP directive is the modern replacement for `X-Frame-Options: ALLOW-FROM`

### Output Escaping
- [ ] `escapeHtml()` — between HTML tags; strips all tags unless allowed-tags array is passed
- [ ] `escapeHtmlAttr()` — inside HTML attribute values; stricter than `escapeHtml()`
- [ ] `escapeUrl()` — in `href`, `src`, `action` attributes; blocks `javascript:` protocol
- [ ] `escapeJs()` — inside JavaScript string literals (between quotes)
- [ ] `$escaper` is the injected instance in templates (Commerce 2.4+); `$block->escapeX()` also valid
- [ ] `/* @noEscape */` suppresses automated escaping warnings — use sparingly with justification
- [ ] For JSON data in JS, use `json_encode()` with `JSON_HEX_TAG` flags, not `escapeJs()`

### Form Keys / CSRF
- [ ] Form key is a session-bound, random token stored in session and submitted with POST forms
- [ ] `\Magento\Framework\Data\Form\FormKey::getFormKey()` generates the token
- [ ] `\Magento\Framework\Data\Form\FormKey\Validator::validate(RequestInterface)` returns `bool`
- [ ] Always validate **before** processing any POST data in custom controllers
- [ ] AJAX POST requests must include `form_key` (from `customerData.get('form_key')()`)
- [ ] REST API uses token-based auth — **no form key required**

### Input Sanitization
- [ ] `filter_var($val, FILTER_SANITIZE_*)` — mutates value; `FILTER_VALIDATE_*` — validates, returns false
- [ ] `FILTER_SANITIZE_STRING` is deprecated in PHP 8.1
- [ ] DOMPurify — client-side JS library for sanitizing HTML to prevent DOM XSS
- [ ] `DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [...] })` for selective HTML allowance
- [ ] Server-side validation is always required independently of client-side validation
- [ ] Type-cast early: `(int)`, `(float)`, `(bool)` for numeric params

### reCAPTCHA
- [ ] Three types: **v2 Checkbox** (always shows widget), **v2 Invisible** (conditional challenge), **v3** (score only)
- [ ] v3 score range: 0.0 (bot) to 1.0 (human); default threshold 0.5
- [ ] Storefront config: `recaptcha_frontend`; Admin config: `recaptcha_backend`
- [ ] Each form type has its own config path — independent enable/disable
- [ ] `ValidatorInterface::isValid()` returns a `ValidationResultInterface` (not a bool)
- [ ] `IsCaptchaEnabledInterface::isCaptchaEnabledFor('form_type')` checks if enabled

### Laminas\Validator & ACL
- [ ] `isValid()` returns `bool`; `getMessages()` returns array of error strings
- [ ] `ValidatorChain` stops at first failure by default
- [ ] ACL resources declared in `<Module>/etc/acl.xml`
- [ ] Admin controllers use `const ADMIN_RESOURCE = 'Vendor_Module::resource_id'`
- [ ] `_isAllowed()` in `\Magento\Backend\App\Action` checks `ADMIN_RESOURCE` by default
- [ ] REST endpoints declare ACL via `<resource ref="..."/>` in `webapi.xml`
- [ ] `ref="anonymous"` = no auth; `ref="self"` = customer accessing own data

### Secure Headers
- [ ] `X-Frame-Options: SAMEORIGIN` — prevents clickjacking; set by default in Commerce Admin
- [ ] `X-Frame-Options: DENY` — stricter; no framing allowed from any origin
- [ ] `ALLOW-FROM` is **deprecated** — use `Content-Security-Policy: frame-ancestors` instead
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` — HSTS
- [ ] HSTS only sent over HTTPS; `preload` requires prior registration at hstspreload.org
- [ ] Set `max-age=0` to **remove** HSTS from browser cache
- [ ] `X-Content-Type-Options: nosniff` — prevents MIME sniffing; only value is `nosniff`
- [ ] `X-XSS-Protection: 0` — modern recommendation: **disable** the legacy XSS filter
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` — safe default
- [ ] Headers can be added via nginx/Apache config or a DI plugin on `Response`

### Practice Commands
- [ ] `curl -sI https://local/ | grep -i "content-security"` — check CSP headers
- [ ] `find vendor/ app/code/ -name "csp_whitelist.xml"` — locate all whitelist files
- [ ] `grep -r "type=\"host\"" vendor/magento/ --include="csp_whitelist.xml"` — count entries
- [ ] `cat vendor/magento/module-paypal/etc/csp_whitelist.xml` — inspect specific extension
