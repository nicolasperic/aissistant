# Magento 2 Multi-site / Multi-store Architecture
## Study Notes — Day 3 | Week 1: Architecture

---

## Table of Contents

1. [Hierarchy: Global → Website → Store → Store View](#1-hierarchy-global--website--store--store-view)
2. [Configuration Scopes and Cascading](#2-configuration-scopes-and-cascading)
3. [Multiple Websites on a Single Instance](#3-multiple-websites-on-a-single-instance)
4. [Shared vs Isolated Resources](#4-shared-vs-isolated-resources)
5. [URL Handling: Domains and Base URLs per Scope](#5-url-handling-domains-and-base-urls-per-scope)
6. [Constraints: Shared DB, Indexer Scope, Cache Scope](#6-constraints-shared-db-indexer-scope-cache-scope)
7. [Practice Lab Walkthrough](#7-practice-lab-walkthrough)
8. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Hierarchy: Global → Website → Store → Store View

### 1.1 The Four-Level Scope Model

Magento 2 organises everything around a four-level tree. Every configuration value, every product assignment, and every customer record lives at exactly one level of this tree.

```
Global (Default)
|
+-- Website A                  (e.g. US store, currency USD)
|   |
|   +-- Store A1               (e.g. Main Catalog)
|   |   +-- Store View A1-EN   (English)
|   |   +-- Store View A1-FR   (French)
|   |
|   +-- Store A2               (e.g. Outlet Catalog)
|       +-- Store View A2-EN   (English)
|
+-- Website B                  (e.g. EU store, currency EUR)
    |
    +-- Store B1
        +-- Store View B1-DE   (German)
        +-- Store View B1-EN   (English)
```

**Exam focus:**
- The hierarchy is **Global > Website > Store > Store View** — four levels, not three.
- Each level *inherits* from its parent unless explicitly overridden.
- "Store" in admin UI = **Store Group** in code (`store_group` table). "Store View" = what code calls a **Store** (`store` table).

### 1.2 What Each Level Controls

| Level | DB Table | Primary Role | Example |
|---|---|---|---|
| **Global (Default)** | *(no row — coded defaults)* | Baseline fallback for all config | Default timezone, default currency |
| **Website** | `store_website` | Payment methods, price scope, customer accounts | Different payment gateways per region |
| **Store (Group)** | `store_group` | Root category, product catalog | Different catalog per brand |
| **Store View** | `store` | Language, locale, CMS content | EN/FR/DE translations |

### 1.3 Key Entities and Their Scope

```
Entity             Scope               Notes
-----------------  ------------------  ------------------------------------
Configuration      Global/Website/     core_config_data table
                   Store/Store View
Products           Global (assigned    Price can be website-scope
                   to websites)        (catalog/price/scope setting)
Categories         Global (root        Each Store Group has ONE root cat
                   per store group)
Customers          Website             customer_entity.website_id
Orders             Website             sales_order.store_id (store view)
CMS Pages/Blocks   Store View          Can be shared via "All Store Views"
```

**Exam focus:**
- A product is *assigned* to one or more websites but exists once in the DB.
- A customer account belongs to a **website**, not a store view — this is why customers cannot automatically log in across websites unless "Share Customer Accounts" = Global.
- Orders are recorded at **store view** level (`store_id`), but reporting is typically rolled up per website.

---

## 2. Configuration Scopes and Cascading

### 2.1 The `core_config_data` Table

Every admin configuration value is stored in one table:

```sql
SELECT scope, scope_id, path, value
FROM   core_config_data
WHERE  path = 'general/locale/code'
ORDER  BY scope, scope_id;
```

Example result:

```
scope        scope_id  path                    value
-----------  --------  ----------------------  ---------
default      0         general/locale/code     en_US
websites     2         general/locale/code     de_DE
stores       4         general/locale/code     fr_FR
```

**Exam focus:**
- `scope` column values: `default`, `websites`, `stores` (never "store_view" — the column value is `stores`).
- `scope_id` = 0 for `default`, the website ID for `websites`, the store-view ID for `stores`.
- If no row exists at a narrower scope, Magento walks up the tree until it finds a value (or uses the XML `<default>` value from `config.xml`).

### 2.2 Cascade Resolution Order

```
Resolution (most specific wins):
  1. stores   / <store_view_id>    <- most specific
  2. websites / <website_id>
  3. default  / 0
  4. config.xml <default> node     <- absolute fallback
```

**Exam focus:**
- This is a *waterfall* — the first non-null match wins, no merging of arrays.
- Programmatically, `ScopeConfigInterface::getValue($path, $scopeType, $scopeCode)` performs this lookup.

### 2.3 Reading Config in Code

```php
<?php
// Inject via constructor
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Store\Model\ScopeInterface;

class Example
{
    public function __construct(
        private readonly ScopeConfigInterface $scopeConfig
    ) {}

    public function getLocale(int $storeId): string
    {
        return $this->scopeConfig->getValue(
            'general/locale/code',            // config path
            ScopeInterface::SCOPE_STORE,      // 'stores'
            $storeId                          // scope ID or code
        );
    }
}
```

**Scope type constants in `ScopeInterface`:**

| Constant | String value | Use case |
|---|---|---|
| `SCOPE_STORE` | `'stores'` | Store view context |
| `SCOPE_STORES` | `'stores'` | Alias — same value |
| `SCOPE_WEBSITE` | `'websites'` | Website context |
| `SCOPE_WEBSITES` | `'websites'` | Alias |

### 2.4 The "Use Default / Use Website" Checkbox

In **Admin → Stores → Configuration**, every field has a checkbox:

```
[ ] Use Default   (shown at website scope)
[ ] Use Website   (shown at store-view scope)
```

- **Checked** = inherit from parent scope (the row in `core_config_data` is *deleted* for this scope).
- **Unchecked + saved** = an explicit row is written for this scope, overriding the parent.

**Exam focus:**
- Deleting the row (via "Use Default") is how inheritance is *re-enabled*. There is no "inherit" flag in the DB — absence of a row = inheritance.
- The scope switcher dropdown in Admin (top-left) must be set to the correct website/store view before you can see or change scope-specific values.

### 2.5 Setting Config Programmatically

```php
<?php
use Magento\Framework\App\Config\Storage\WriterInterface;
use Magento\Store\Model\ScopeInterface;

$this->configWriter->save(
    'general/locale/code',          // path
    'de_DE',                        // value
    ScopeInterface::SCOPE_WEBSITES, // scope
    2                               // scope_id (website ID)
);
```

After programmatic writes, flush config cache:

```bash
bin/magento cache:clean config
```

---

## 3. Multiple Websites on a Single Instance

### 3.1 Environment Variable Approach

Magento decides which website/store view to load by reading two environment variables set by the web server:

| Variable | Values | Description |
|---|---|---|
| `MAGE_RUN_TYPE` | `website` or `store` | Determines which entity to bootstrap |
| `MAGE_RUN_CODE` | e.g. `base`, `us_website` | The `code` column from `store_website` or `store` table |

**Exam focus:**
- `MAGE_RUN_TYPE=website` → Magento loads by `store_website.code`.
- `MAGE_RUN_TYPE=store` → Magento loads by `store.code` (store view code).
- These variables are **set per virtual host** in the web server config, not in Magento admin.

### 3.2 nginx Configuration (Multi-site)

```nginx
# /etc/nginx/sites-available/magento-us.conf
server {
    listen 80;
    server_name us.example.com;
    set $MAGE_ROOT /var/www/magento;
    root $MAGE_ROOT/pub;

    # Pass environment variables to PHP-FPM
    fastcgi_param MAGE_RUN_TYPE website;
    fastcgi_param MAGE_RUN_CODE us_website;

    include /var/www/magento/nginx.conf.sample;
}

# /etc/nginx/sites-available/magento-eu.conf
server {
    listen 80;
    server_name eu.example.com;
    set $MAGE_ROOT /var/www/magento;
    root $MAGE_ROOT/pub;

    fastcgi_param MAGE_RUN_TYPE website;
    fastcgi_param MAGE_RUN_CODE eu_website;

    include /var/www/magento/nginx.conf.sample;
}
```

**Exam focus:**
- `fastcgi_param` sets the variable for PHP-FPM processes.
- Both virtual hosts point to the **same Magento document root** (`pub/`).
- The `nginx.conf.sample` file shipped with Magento must be *included*, not duplicated.

### 3.3 Apache Configuration (Multi-site)

```apache
# /etc/apache2/sites-available/magento-us.conf
<VirtualHost *:80>
    ServerName us.example.com
    DocumentRoot /var/www/magento/pub

    SetEnv MAGE_RUN_TYPE "website"
    SetEnv MAGE_RUN_CODE "us_website"

    <Directory /var/www/magento/pub>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>

# /etc/apache2/sites-available/magento-eu.conf
<VirtualHost *:80>
    ServerName eu.example.com
    DocumentRoot /var/www/magento/pub

    SetEnv MAGE_RUN_TYPE "website"
    SetEnv MAGE_RUN_CODE "eu_website"

    <Directory /var/www/magento/pub>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

**Exam focus:**
- Apache uses `SetEnv`, nginx uses `fastcgi_param`.
- `AllowOverride All` is required for `.htaccess` to work, which is how Magento handles rewrites in Apache.

### 3.4 Alternative: `index.php` Bootstrap Override

For local development or when modifying the web server isn't an option, you can set the variables directly in `pub/index.php` (not recommended for production):

```php
<?php
// pub/index.php - ADD before bootstrap
$_SERVER['MAGE_RUN_TYPE'] = 'website';
$_SERVER['MAGE_RUN_CODE'] = 'us_website';
```

Or use a separate entry point:

```php
<?php
// pub/us_index.php
use Magento\Framework\App\Bootstrap;
require __DIR__ . '/../app/bootstrap.php';

$params = $_SERVER;
$params[Bootstrap::INIT_PARAM_FILESYSTEM_DIR_PATHS] = /* ... */;
$params[\Magento\Store\Model\StoreManager::PARAM_RUN_CODE] = 'us_website';
$params[\Magento\Store\Model\StoreManager::PARAM_RUN_TYPE] = 'website';

$bootstrap = Bootstrap::create(BP, $params);
$app = $bootstrap->createApplication(\Magento\Framework\App\Http::class);
$bootstrap->run($app);
```

### 3.5 Locating Website/Store Codes

```sql
-- Find website codes
SELECT website_id, code, name FROM store_website;

-- Find store view codes
SELECT store_id, code, name, website_id FROM store;

-- Find store group names
SELECT group_id, name, root_category_id, website_id FROM store_group;
```

---

## 4. Shared vs Isolated Resources

### 4.1 What Is ALWAYS Shared (Single DB Instance)

```
Shared Across ALL Websites/Stores:
+------------------------------------------+
| - Product catalog (catalog_product_*)    |
| - Category tree (catalog_category_*)     |
| - Attribute sets and attributes          |
| - CMS pages/blocks (with store filter)   |
| - Configuration (core_config_data)       |
| - Admin users                            |
| - Tax rules and rates                    |
| - Coupons / Cart Price Rules             |
| - URL rewrites (url_rewrite table)       |
+------------------------------------------+
```

**Exam focus:**
- Products exist **once** in the DB and are *assigned* to websites via `catalog_product_website` join table.
- A product's attribute values can differ per store view (e.g., name, description in different languages) stored in EAV `_varchar`, `_text` etc. tables with a `store_id` column.

### 4.2 Website-Scoped Resources

```
Scoped to Website:
+------------------------------------------+
| - Customer accounts (customer_entity)    |
|   .website_id links to store_website     |
| - Inventory (if website-scope pricing)   |
| - Price (if catalog/price/scope=website) |
+------------------------------------------+
```

### 4.3 Store-View-Scoped Resources

```
Scoped to Store View:
+------------------------------------------+
| - Orders (sales_order.store_id)          |
| - Quotes (quote.store_id)                |
| - Invoices, Shipments, Credit Memos      |
| - Product attribute values (EAV store_id)|
| - CMS content (store_id filter)          |
+------------------------------------------+
```

### 4.4 Customer Sharing Configuration

Navigate to: **Admin → Stores → Configuration → Customers → Customer Configuration → Account Sharing Options**

| Setting | Behaviour |
|---|---|
| **Global** | One customer account works across ALL websites. `customer_entity.website_id` = 0 (or first) |
| **Per Website** *(default)* | Customer accounts are isolated per website. Same email can register on both websites |

**Exam focus:**
- Default is **Per Website** (isolated).
- Global sharing means the email address must be unique across all websites.
- Switching from Per Website to Global after data exists can cause duplicate email conflicts — requires data cleanup.

### 4.5 Product Assignment to Websites

```php
<?php
// Assigning a product to websites programmatically
use Magento\Catalog\Api\ProductRepositoryInterface;

$product = $this->productRepository->get('SKU-001');
$product->setWebsiteIds([1, 2]); // Website IDs
$this->productRepository->save($product);
```

```sql
-- Check product-to-website assignments
SELECT p.sku, w.code AS website_code
FROM   catalog_product_entity p
JOIN   catalog_product_website cpw ON p.entity_id = cpw.product_id
JOIN   store_website w ON cpw.website_id = w.website_id;
```

---

## 5. URL Handling: Domains and Base URLs per Scope

### 5.1 Base URL Configuration per Scope

Base URLs are configured at **website** or **store view** scope:

**Admin → Stores → Configuration → General → Web → Base URLs**

```
Path:                              web/unsecure/base_url
Path (secure):                     web/secure/base_url

Examples per scope:
  default  / 0  -> https://default.example.com/
  websites / 1  -> https://us.example.com/
  websites / 2  -> https://eu.example.com/
  stores   / 3  -> https://eu.example.com/de/   (subfolder approach)
```

**Exam focus:**
- Base URLs are stored in `core_config_data` — they cascade like any other config.
- Setting a base URL at website scope overrides the default for all store views under that website.
- You can use **sub-paths** (e.g., `/en/`, `/de/`) instead of separate domains — this still requires web server config to pass `MAGE_RUN_CODE` correctly.

### 5.2 URL Rewrite Table

```sql
-- Structure of url_rewrite
SELECT request_path, target_path, store_id, entity_type
FROM   url_rewrite
WHERE  store_id IN (1, 2)
LIMIT  10;
```

**Exam focus:**
- Every store view has its **own URL rewrites**. A product with two store views has (at minimum) two rows in `url_rewrite`.
- URL rewrites are store-view scoped — changing the URL key in store view 1 does not affect store view 2.
- `store_id = 0` in `url_rewrite` = applies to all store views (rare, used for CMS pages set to "All Store Views").

### 5.3 Domain Strategies Compared

```
Strategy 1: Separate Domains
  us.example.com  -> MAGE_RUN_CODE=us_website
  eu.example.com  -> MAGE_RUN_CODE=eu_website
  Pros: Clear separation, easy SSL cert per domain
  Cons: More DNS/SSL management

Strategy 2: Sub-paths on same domain
  example.com/us/ -> MAGE_RUN_CODE=us_website  (or store_view)
  example.com/eu/ -> MAGE_RUN_CODE=eu_website
  Pros: Single domain, simpler SSL
  Cons: nginx rewrite rules more complex, store code in URL

Strategy 3: Sub-domains
  us.example.com  -> website
  eu.example.com  -> website
  fr.eu.example.com -> store view
  Pros: Flexible hierarchy
  Cons: Wildcard SSL cert needed
```

### 5.4 nginx Sub-path Approach

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/magento/pub;

    location /us/ {
        fastcgi_param MAGE_RUN_TYPE website;
        fastcgi_param MAGE_RUN_CODE us_website;
        # ... fastcgi_pass, etc.
    }

    location /eu/ {
        fastcgi_param MAGE_RUN_TYPE website;
        fastcgi_param MAGE_RUN_CODE eu_website;
    }
}
```

### 5.5 The `{store_code}` in URLs (Optional)

Magento can prepend the store view code to all URLs:

**Admin → Stores → Configuration → General → Web → URL Options → Add Store Code to URLs = Yes**

```
Result:
  https://example.com/en_us/catalog/product/view/id/1
  https://example.com/de_de/catalog/product/view/id/1
```

**Exam focus:**
- When "Add Store Code to URLs" = Yes, Magento reads the store code from the URL path — `MAGE_RUN_CODE` from the web server becomes optional for sub-path setups.
- This setting is stored in `web/url/use_store` config path.
- Not recommended with separate domains (creates ugly URLs like `us.example.com/us_website/...`).

---

## 6. Constraints: Shared DB, Indexer Scope, Cache Scope

### 6.1 Shared Database Tables — Key Constraints

Since all websites share **one database** (standard CE/EE setup):

```
Constraint 1: Flat Catalog
  - catalog_product_flat_<store_id> - one table per store view
  - catalog_category_flat_store_<store_id> - one per store view
  - Adding more store views = more flat tables = more disk/query load

Constraint 2: URL Rewrites
  - url_rewrite grows linearly with (products x store_views)
  - 10,000 products x 5 store views = 50,000+ rewrite rows minimum
  - Can become a performance bottleneck

Constraint 3: EAV Attribute Values
  - catalog_product_entity_varchar, _text, _int etc.
  - One row per (attribute, store_id, entity_id)
  - More store views = proportionally more rows
```

**Exam focus:**
- There is **no native multi-DB split** per website in standard Magento 2 CE. Magento Commerce (EE) had "split database" for sales/checkout, but this was deprecated in 2.4.2.
- All websites share the same indexer infrastructure and the same cache pool.

### 6.2 Indexer Scope

```
Indexer               Scope Behaviour
--------------------  -----------------------------------------------
catalog_product_flat  Per store view - flat table per store view
catalog_category_flat Per store view - flat table per store view
catalogsearch         Per store view - index built per store view
catalogrule_product   Global - one pass over all websites
inventory             Global - shared stock (or per source in MSI)
url_rewrite           Global run, but rows are store_view scoped
```

**Exam focus:**
- Running `bin/magento indexer:reindex` indexes ALL store views in one operation — you cannot scope it to one website natively.
- The more store views, the longer reindexing takes.
- Flat catalog index creates `catalog_product_flat_1`, `catalog_product_flat_2`, etc. (one per store view).

### 6.3 Cache Scope

```
Cache Key Components:
  - Page cache (Varnish/built-in): includes store_id in cache key
  - Block cache (layout cache): includes store_id, locale
  - Config cache: global (one serialized config tree, all scopes merged)
  - Full Page Cache: cached per store view (different X-Magento-Tags)
```

```bash
# Flush cache for all scopes simultaneously (no per-website flush natively)
bin/magento cache:flush

# Specific cache types
bin/magento cache:clean full_page config block_html
```

**Exam focus:**
- The **config cache** stores the **merged** config for all scopes in one cache entry. Flushing it causes Magento to rebuild config for ALL scopes on next request.
- **Full page cache (FPC)** entries are tagged with `store_<id>` — but native cache:clean does not support per-store-view flush. You need Varnish BAN requests or custom tooling.
- Adding a new store view **invalidates** the config and layout caches.

### 6.4 Split Database (EE Historical — Deprecated)

```
NOTE: Deprecated since Magento 2.4.2 (Adobe Commerce)
Was available in Magento Commerce only:

  Default DB   -> catalog, configuration
  Sales DB     -> sales_order, quote, invoice tables
  Checkout DB  -> quote, address tables

Deprecated because:
  - Operational complexity
  - Incompatible with many extensions
  - Modern alternatives: read replicas, horizontal scaling
```

### 6.5 MSI (Multi-Source Inventory) and Multi-site

```
MSI introduces Stock-to-Website assignment:

  Stock A (US Stock)  -> assigned to Website: us_website
    Source: US Warehouse

  Stock B (EU Stock)  -> assigned to Website: eu_website
    Source: EU Warehouse

  Result: us.example.com shows US inventory
          eu.example.com shows EU inventory
```

**Exam focus:**
- In MSI, a **Stock** is assigned to one or more websites.
- A **Source** is a physical warehouse/location.
- The Default Stock (assigned to Default Website) is the fallback.
- Without MSI customisation, inventory is global (same qty shown everywhere).

---

## 7. Practice Lab Walkthrough

### 7.1 Create a Second Website, Store, and Store View

**Step 1: Create the second Website**
```
Admin → Stores → All Stores → Create Website
  Name: Second Website
  Code: second_website    <- used in MAGE_RUN_CODE
  Sort Order: 10
[Save Website]
```

**Step 2: Create a Store (Store Group)**
```
Admin → Stores → All Stores → Create Store
  Website: Second Website    <- parent
  Name: Second Store
  Root Category: Default Category  (or create a new one)
  Sort Order: 10
[Save Store]
```

**Step 3: Create a Store View**
```
Admin → Stores → All Stores → Create Store View
  Store: Second Store        <- parent
  Name: Second Store View EN
  Code: second_en            <- used in MAGE_RUN_CODE when type=store
  Status: Enabled
  Sort Order: 10
[Save Store View]
```

**Step 4: Verify in DB**
```sql
SELECT * FROM store_website;
SELECT * FROM store_group;
SELECT * FROM store;
```

### 7.2 Observe Configuration Scoping in Admin

**Step 1: Set a website-scope override**
```
Admin → Stores → Configuration
  [Scope Switcher] -> Select: Second Website

  General → General → Locale Options:
    Locale:     [ ] Use Default  -> change to "German (Germany)"
    Timezone:   [ ] Use Default  -> change to "Europe/Berlin"
[Save Config]
```

**Step 2: Observe the DB change**
```sql
SELECT scope, scope_id, path, value
FROM   core_config_data
WHERE  path IN ('general/locale/code', 'general/locale/timezone')
ORDER  BY scope, scope_id;

-- You should see:
-- default / 0  / general/locale/code  / en_US
-- websites / 2 / general/locale/code  / de_DE
```

**Step 3: Restore inheritance (Use Default)**
```
Admin → Stores → Configuration
  [Scope Switcher] -> Select: Second Website

  General → General → Locale Options:
    Locale: [x] Use Default   <- check the box
[Save Config]

-- The websites/2/general/locale/code row is now DELETED from core_config_data
```

### 7.3 Configure Base URLs for Second Website

```
Admin → Stores → Configuration
  [Scope Switcher] -> Select: Second Website

  General → Web → Base URLs:
    Base URL:         http://second.localhost/
    Base Link URL:    http://second.localhost/

  General → Web → Base URLs (Secure):
    Base URL:         http://second.localhost/
[Save Config]
```

### 7.4 Test with hosts file (local dev)

```bash
# /etc/hosts
127.0.0.1  magento.localhost
127.0.0.1  second.localhost
```

**nginx local override:**
```nginx
server {
    listen 80;
    server_name second.localhost;
    root /var/www/magento/pub;

    fastcgi_param MAGE_RUN_TYPE website;
    fastcgi_param MAGE_RUN_CODE second_website;

    include /var/www/magento/nginx.conf.sample;
}
```

### 7.5 Assign a Product to the Second Website

```
Admin → Catalog → Products -> [Select Product]
  Product in Websites tab:
    [x] Main Website
    [x] Second Website   <- check this
[Save]
```

```sql
-- Verify
SELECT pw.website_id, sw.code, p.sku
FROM   catalog_product_website pw
JOIN   store_website sw ON pw.website_id = sw.website_id
JOIN   catalog_product_entity p ON pw.product_id = p.entity_id
WHERE  p.sku = 'your-sku';
```

### 7.6 CLI Commands Reference

```bash
# List all websites/stores/store views
bin/magento store:list

# Verify store configuration
bin/magento config:show --scope=websites --scope-code=second_website general/locale/code

# Set config via CLI
bin/magento config:set --scope=websites --scope-code=second_website general/locale/code de_DE

# Flush config after changes
bin/magento cache:clean config

# Reindex after adding store view
bin/magento indexer:reindex
```

**Exam focus:**
- `bin/magento store:list` lists store views (not websites).
- `config:set --scope=websites --scope-code=<code>` uses the **code** not the ID.
- `config:show` without scope shows the effective value at default scope.

---

## Architecture Decision Reference

### When to Use Multiple Websites vs Multiple Store Views

```
Use Multiple WEBSITES when:
  - Different customer databases needed (separate login)
  - Different payment gateways
  - Different pricing scope (website-level prices)
  - Different product catalogs (different root categories still
    possible per Store Group)
  - Different domains with truly isolated customer experience
  - Different MSI stock assignments

Use Multiple STORE VIEWS when:
  - Same products, different languages/translations
  - Same customer base, multiple locales
  - A/B testing content
  - Minor regional variations (date format, currency display)

Use Multiple STORE GROUPS (Stores) when:
  - Different root categories under same website
  - Different catalog navigation within same website
  - Brand separation within same customer base
```

---

## Quick-Reference Checklist

### Hierarchy and Scopes
- [ ] Four levels: **Global → Website → Store (Group) → Store View** — in that order
- [ ] "Store" in admin UI = `store_group` table; "Store View" = `store` table
- [ ] Config is stored in `core_config_data` with columns: `scope`, `scope_id`, `path`, `value`
- [ ] `scope` values in DB: `default`, `websites`, `stores` (NOT "store_view")
- [ ] `scope_id` = 0 for `default`, website_id for `websites`, store_id for `stores`
- [ ] Cascade order: stores > websites > default > config.xml fallback (most specific wins)
- [ ] **Absence of a row = inherit from parent** — "Use Default" checkbox deletes the row
- [ ] Scope-check: `ScopeConfigInterface::getValue($path, ScopeInterface::SCOPE_STORE, $storeId)`

### Multi-Website Setup
- [ ] `MAGE_RUN_TYPE` = `website` or `store`; `MAGE_RUN_CODE` = the `code` column from DB
- [ ] nginx: `fastcgi_param MAGE_RUN_TYPE website;` inside server block
- [ ] Apache: `SetEnv MAGE_RUN_TYPE "website"` inside VirtualHost block
- [ ] Both virtual hosts point to the **same `pub/` document root**
- [ ] `MAGE_RUN_TYPE=website` resolves via `store_website.code`; `=store` via `store.code`

### Shared vs Isolated Resources
- [ ] Products are **global** — assigned to websites via `catalog_product_website`
- [ ] Customers are **website-scoped** — `customer_entity.website_id`
- [ ] Orders are **store-view scoped** — `sales_order.store_id`
- [ ] CMS pages/blocks are store-view scoped (can be "All Store Views")
- [ ] Customer sharing: **Per Website** (default) or **Global** — set in admin config
- [ ] Product EAV attribute values can have per-store-view overrides (name, description, etc.)

### URL Handling
- [ ] Base URLs stored in `core_config_data` at website or store scope
- [ ] Config paths: `web/unsecure/base_url`, `web/secure/base_url`
- [ ] `url_rewrite` table is store-view scoped — one entry per product per store view
- [ ] "Add Store Code to URLs" (`web/url/use_store`) prepends store view code to all URLs
- [ ] Three domain strategies: separate domains, sub-paths, sub-domains
- [ ] Sub-path approach: `MAGE_RUN_CODE` can be set via nginx location blocks

### Constraints and Performance
- [ ] **No native per-website DB isolation** in CE (EE split DB deprecated in 2.4.2)
- [ ] Flat catalog creates `catalog_product_flat_<store_id>` per store view
- [ ] `url_rewrite` grows as `products × store_views` — can be a bottleneck
- [ ] `bin/magento indexer:reindex` is global — cannot scope to one website natively
- [ ] Config cache is global (one merged tree for all scopes) — flush affects all sites
- [ ] FPC entries are tagged per store view but no native per-store-view flush command
- [ ] MSI: Stocks are assigned to Websites; Sources are physical warehouse locations

### CLI Quick Reference
- [ ] `bin/magento store:list` — lists store views
- [ ] `bin/magento config:set --scope=websites --scope-code=<code> <path> <value>`
- [ ] `bin/magento config:show --scope=websites --scope-code=<code> <path>`
- [ ] `bin/magento cache:clean config` — flush config after scope changes
- [ ] `bin/magento indexer:reindex` — reindex all (required after new store view)

### Common Exam Gotchas
- [ ] "Store" (admin) ≠ "Store" (code) — admin "Store" = code `store_group`
- [ ] Adding a store view requires re-indexing and cache flush
- [ ] Customer email uniqueness: per-website by default; globally unique when sharing = Global
- [ ] Price scope (global vs website) is set in **Catalog → Configuration → Price** — affects whether prices are shared or can differ per website
- [ ] `scope_id=0` in `core_config_data` = **default scope**, not website ID 0 (which doesn't exist)
- [ ] The **scope switcher** in admin must be changed to see/edit website or store-view specific values — at "Default Config" you only see global defaults
