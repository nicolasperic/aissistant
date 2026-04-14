# Day 15 — External Integrations: SaaS Services & Data Flow

## Study Notes for Adobe Commerce Developer Professional/Expert Certification

---

## Table of Contents

1. [Adobe Commerce SaaS Services Overview](#1-adobe-commerce-saas-services-overview)
2. [Data Sync Mechanism: SaaSExport Modules & FeedInterface](#2-data-sync-mechanism-saasexport-modules--feedinterface)
3. [Customizing Feed Data: Plugins on Exporters & Custom Feed Attributes](#3-customizing-feed-data-plugins-on-exporters--custom-feed-attributes)
4. [Catalog-Export Pipeline: Data Flow & Extension Points](#4-catalog-export-pipeline-data-flow--extension-points)
5. [ScpeSaas — Storefront Services Connector Configuration](#5-scpesaas--storefront-services-connector-configuration)
6. [API Mesh (Adobe API Mesh)](#6-api-mesh-adobe-api-mesh)
7. [Commerce Eventing for SaaS Triggers](#7-commerce-eventing-for-saas-triggers)
8. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Adobe Commerce SaaS Services Overview

### What Are Commerce SaaS Services?

Adobe Commerce SaaS services are **cloud-hosted, managed microservices** that extend Commerce storefront capabilities without running computation on the Commerce application server. They communicate with the Commerce backend through a **SaaS Data Export** pipeline and expose their own APIs (GraphQL) to the storefront.

```
+-------------------------+        SaaS Export        +-------------------+
|  Adobe Commerce         |  ---------------------->  |  Adobe SaaS       |
|  (on-prem / cloud)      |  (Feed data via cron)     |  Services Cloud   |
|                         |                           |                   |
|  - Catalog              |  <----------------------  |  - Catalog Svc    |
|  - Products             |  (GraphQL queries from    |  - Live Search    |
|  - Customers            |   storefront/API Mesh)    |  - Prod Recs      |
+-------------------------+                           +-------------------+
         ^
         |
  Storefront (PWA/Luma/Edge Delivery)
  queries SaaS GraphQL directly
```

### The Three Core SaaS Services

#### 1.1 Catalog Service

- Provides a **high-performance GraphQL API** for product data queries
- Replaces slow, database-heavy Commerce GraphQL product queries
- Returns **pre-indexed, denormalized** product data (attributes, prices, variants, images)
- Used by storefronts to retrieve PDP (Product Detail Page) and PLP (Product Listing Page) data
- Supports **complex product types**: configurable, bundle, grouped

**Exam focus:** Catalog Service does NOT write back to Commerce — it is **read-only** from the storefront perspective. Data flows **one-way** from Commerce → SaaS.

#### 1.2 Product Recommendations

- AI/ML-powered recommendation units (e.g., "Also Viewed," "Trending," "Similar")
- Powered by **Adobe Sensei** (machine learning layer)
- Recommendations are displayed via **recommendation units** placed using Page Builder or manually coded blocks
- Requires **behavioral data collection** via `magento/product-recommendations-admin` and the data collection JS snippet
- Recommendation types: `viewed-viewed`, `viewed-bought`, `bought-bought`, `more-like-this`, `visual-similarity`, `trending`, `most-purchased`, `most-added-to-cart`, `most-viewed`

**Exam focus:** Product Recommendations requires **both** catalog sync AND behavioral event data to function properly. No events = no training data = generic/empty recommendations.

#### 1.3 Live Search

- SaaS-based **search engine** replacing Elasticsearch/OpenSearch for storefronts
- Uses Commerce catalog data synced to the SaaS index
- Exposes a **GraphQL API** (`productSearch` query) consumed by the storefront
- Features: **faceted search**, **synonyms**, **search merchandising rules**, **query suggestions** (type-ahead)
- Admin panel for managing synonyms, rules, and facets under **Marketing > Live Search**

**Exam focus:** Live Search requires the `magento/live-search` metapackage AND catalog data must be fully synced before results appear. Partial sync = missing products in search.

### Service Dependency Summary Table

| Service | Requires Catalog Sync | Requires Behavioral Events | Storefront API |
|---|---|---|---|
| Catalog Service | Yes | No | GraphQL (`products`, `refineProduct`) |
| Live Search | Yes | Optional (for ranking) | GraphQL (`productSearch`, `suggestions`) |
| Product Recommendations | Yes | Yes (for training) | GraphQL (`recommendations`) |

---

## 2. Data Sync Mechanism: SaaSExport Modules & FeedInterface

### 2.1 Architecture Overview

The SaaS Data Export system is the **backbone** of all Commerce SaaS services. It collects data from Commerce, serializes it into **feed payloads**, and transmits it to the Adobe SaaS endpoint.

```
Commerce DB / Entity Events
          |
          v
+--------------------+
|  Feed Collector    |  <-- collects changed/full entity data
|  (Indexer / Cron)  |
+--------------------+
          |
          v
+--------------------+
|  Feed Serializer   |  <-- transforms to SaaS schema
|  (FeedInterface)   |
+--------------------+
          |
          v
+--------------------+
|  HTTP Transmitter  |  <-- sends to Adobe SaaS endpoint via REST
|  (SaasClient)      |
+--------------------+
          |
          v
    Adobe SaaS Cloud
```

### 2.2 Key Modules

| Module | Package | Purpose |
|---|---|---|
| `Magento_SaaSCatalog` | `magento/saas-catalog` | Catalog entity feeds |
| `Magento_DataExporter` | `magento/data-exporter` | Core feed framework |
| `Magento_SaaSCommon` | `magento/saas-common` | SaaS connector, HTTP client |
| `Magento_ProductsOverride` | part of data-exporter | Product feed overrides |
| `Magento_ServicesConnector` | `magento/services-connector` | Auth & environment config |

### 2.3 FeedInterface

Every feed in the SaaS export system implements `\Magento\DataExporter\Model\Indexer\FeedIndexer` and is configured around the `FeedInterface`:

```php
<?php
namespace Magento\DataExporter\Model\Indexer;

interface FeedInterface
{
    /**
     * Get feed metadata
     */
    public function getFeedMetadata(): \Magento\DataExporter\Model\Indexer\FeedIndexMetadata;

    /**
     * Get feed data for given IDs
     */
    public function getFeedSince(string $timestamp): array;

    /**
     * Mark feed items as deleted
     */
    public function markRemoved(array $ids): void;
}
```

**Exam focus:** `FeedInterface` is the contract all feed implementations must satisfy. The `getFeedSince()` method is used for **incremental sync** (delta), while full resync uses all IDs.

### 2.4 Feed Metadata Configuration (XML)

Feeds are registered via `et_schema.xml` (Data Exporter schema) and `di.xml`:

```xml
<!-- app/code/Vendor/Module/etc/et_schema.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_DataExporter:etc/et_schema.xsd">
    <record name="ProductFeed">
        <field name="sku" type="string"/>
        <field name="name" type="string"/>
        <field name="price" type="float"/>
        <field name="categories" type="string" repeated="true"/>
        <!-- custom fields added here -->
    </record>
</config>
```

### 2.5 Cron-Based Sync Jobs

SaaS Export relies on **cron jobs** for data synchronization:

| Cron Job | Group | Purpose |
|---|---|---|
| `commerce_data_export_products_feed` | `saas_data_exporter` | Sync product feed changes |
| `commerce_data_export_categories_feed` | `saas_data_exporter` | Sync category feed changes |
| `commerce_data_export_prices_feed` | `saas_data_exporter` | Sync price feed (runs more frequently) |
| `commerce_data_export_product_attributes_feed` | `saas_data_exporter` | Sync attribute metadata |
| `resync` variant for each | `saas_data_exporter` | Full resync on demand |

**Exam focus:** Cron group is `saas_data_exporter`. Missing or stuck cron = stale SaaS data. Always verify cron is running when debugging sync issues.

### 2.6 CLI Commands for Sync

```bash
# Check sync status / diagnose
bin/magento saas:resync --feed=products
bin/magento saas:resync --feed=categories
bin/magento saas:resync --feed=prices
bin/magento saas:resync --feed=productattributes
bin/magento saas:resync --feed=productoverrides

# Check what feeds are registered
bin/magento saas:resync --list

# Full resync (use with caution on large catalogs)
bin/magento indexer:reindex catalog_data_exporter_products
bin/magento indexer:reindex catalog_data_exporter_categories
bin/magento indexer:reindex catalog_data_exporter_product_attributes
```

**Exam focus:** `saas:resync` is the go-to CLI command for forcing data into SaaS. Know which feeds correspond to which data types.

### 2.7 Indexer-Based Collection

Data Exporter uses **Magento Indexers** as the collection trigger:

```xml
<!-- indexer.xml -->
<indexer id="catalog_data_exporter_products"
         view_id="catalog_data_exporter_products"
         class="Magento\DataExporter\Model\Indexer\FeedIndexer"
         primary="sku">
    <title translate="true">Catalog Data Exporter Products</title>
    <description translate="true">Collects product data for SaaS export</description>
</indexer>
```

When a product is saved, the indexer marks it for re-collection. The cron job then picks up changes and transmits them.

---

## 3. Customizing Feed Data: Plugins on Exporters & Custom Feed Attributes

### 3.1 Why Customize Feeds?

You may need to:
- Add **custom product attributes** to feed data (so they appear in Live Search facets or Catalog Service queries)
- **Transform** existing values before sending to SaaS
- **Filter** certain products from being synced
- Add **business-specific metadata** not in Commerce core

### 3.2 Plugin Approach on Feed Processors

The primary extension point is **plugins on the feed processor/collector classes**:

```php
<?php
namespace Vendor\Module\Plugin;

use Magento\CatalogDataExporter\Model\Provider\Product\ProductShortDescription;

class AddCustomAttributeToFeedPlugin
{
    /**
     * After plugin on the product data provider
     */
    public function afterGet(
        ProductShortDescription $subject,
        array $result,
        array $value
    ): array {
        foreach ($result as &$item) {
            // Add custom attribute to feed payload
            $item['customAttribute'] = $this->getCustomValue($item['sku'] ?? '');
        }
        return $result;
    }

    private function getCustomValue(string $sku): string
    {
        // fetch custom data, e.g., from ERP, custom table, etc.
        return 'custom_value_for_' . $sku;
    }
}
```

```xml
<!-- di.xml -->
<type name="Magento\CatalogDataExporter\Model\Provider\Product\ProductShortDescription">
    <plugin name="vendor_module_add_custom_attribute"
            type="Vendor\Module\Plugin\AddCustomAttributeToFeedPlugin"
            sortOrder="100"/>
</type>
```

### 3.3 Custom Feed Attribute via et_schema.xml Extension

To add a new field to the product feed schema:

```xml
<!-- app/code/Vendor/Module/etc/et_schema.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_DataExporter:etc/et_schema.xsd">
    <record name="ProductFeed">
        <!-- Extend existing ProductFeed record with new field -->
        <field name="erpProductCode" type="string" provider="Vendor\Module\Model\Provider\ErpProductCodeProvider"/>
    </record>
</config>
```

### 3.4 Creating a Custom Data Provider

```php
<?php
namespace Vendor\Module\Model\Provider;

use Magento\DataExporter\Model\Indexer\FeedIndexMetadata;

class ErpProductCodeProvider
{
    private \Vendor\Module\Model\ErpCodeRepository $erpCodeRepository;

    public function __construct(
        \Vendor\Module\Model\ErpCodeRepository $erpCodeRepository
    ) {
        $this->erpCodeRepository = $erpCodeRepository;
    }

    /**
     * Called by DataExporter framework to collect field data
     *
     * @param array $values - array of ['sku' => '...', 'storeViewCode' => '...']
     * @return array - array of ['sku' => '...', 'storeViewCode' => '...', 'erpProductCode' => '...']
     */
    public function get(array $values): array
    {
        $skus = array_column($values, 'sku');
        $erpCodes = $this->erpCodeRepository->getBySkus($skus);

        return array_map(function ($item) use ($erpCodes) {
            $item['erpProductCode'] = $erpCodes[$item['sku']] ?? '';
            return $item;
        }, $values);
    }
}
```

**Exam focus:** Custom providers are registered in `et_schema.xml` using the `provider` attribute on a `<field>`. The provider's `get()` method receives batched values for performance.

### 3.5 Attribute Visibility for Live Search Facets

For a Commerce product attribute to appear as a Live Search facet, it must be:

1. Set as **searchable** (`is_searchable = 1`)
2. Set as **filterable in search** (`is_filterable_in_search = 1`)
3. Synced through the **product attributes feed** (`catalog_data_exporter_product_attributes`)

**Exam focus:** Attribute configuration in Admin → Stores → Attributes → Product drives what shows up as Live Search facets. Not all attributes sync by default — only those marked appropriately.

---

## 4. Catalog-Export Pipeline: Data Flow & Extension Points

### 4.1 Full Pipeline Diagram

```
Product Save / Mass Action / Import
             |
             v
    +------------------+
    |  Indexer Mview   |  Tracks changed entity IDs
    |  (changelog)     |
    +------------------+
             |
             v
    +------------------+
    |  FeedIndexer     |  Reads changed IDs from changelog
    |  (cron trigger)  |
    +------------------+
             |
             v
    +------------------+
    |  Feed Collector  |  Runs each field Provider
    |  (et_schema)     |  Assembles full feed record
    +------------------+
             |
             v
    +------------------+
    |  Feed Serializer |  Converts PHP array -> JSON payload
    +------------------+
             |
             v
    +------------------+
    |  SaasClient      |  HTTP POST to SaaS endpoint
    |  (REST API)      |  Authenticated via API Key
    +------------------+
             |
             v
    Adobe SaaS Data Ingestion Layer
             |
             v
    SaaS Search Index / Catalog Index
```

### 4.2 Key Classes in the Pipeline

| Class | Namespace | Role |
|---|---|---|
| `FeedIndexer` | `Magento\DataExporter\Model\Indexer` | Orchestrates collection & submission |
| `Exporter` | `Magento\DataExporter\Model` | Collects data using Providers |
| `FeedMetadata` | `Magento\DataExporter\Model\Indexer` | Feed configuration (table, feed name) |
| `SaaSClient` (HttpClient) | `Magento\ServicesConnector\Model` | Authenticated HTTP client to SaaS |
| `MetadataResolver` | `Magento\DataExporter\Model` | Resolves et_schema to provider classes |

### 4.3 Feed Tables in Database

Exported feed data is **persisted locally** in feed tables before and after transmission:

| Table | Feed |
|---|---|
| `catalog_data_exporter_products` | Products feed |
| `catalog_data_exporter_categories` | Categories feed |
| `catalog_data_exporter_product_attributes` | Product attributes feed |
| `catalog_data_exporter_prices` | Prices feed |

**Exam focus:** These tables act as a **local cache/queue** of what has been sent to SaaS. You can query them to debug what data was actually transmitted.

```sql
-- Check product feed data for a specific SKU
SELECT * FROM catalog_data_exporter_products WHERE sku = 'MY-SKU-001';

-- Check feed status flags
SELECT sku, is_deleted, modified_at FROM catalog_data_exporter_products 
WHERE modified_at > '2024-01-01' LIMIT 20;
```

### 4.4 Extension Points Summary

| Extension Point | What to Use | When |
|---|---|---|
| Add new field to feed | `et_schema.xml` + Provider class | Need new data in SaaS payload |
| Modify existing field value | Plugin on Provider class | Transform/override existing field |
| Filter records from sync | Plugin on `FeedIndexer` or `Exporter` | Exclude products conditionally |
| Change sync frequency | Custom cron schedule in `crontab.xml` | Tune sync timing |
| Add entirely new feed | New `FeedInterface` + `et_schema.xml` + Indexer | Custom data type to SaaS |

---

## 5. ScpeSaas — Storefront Services Connector Configuration

### 5.1 What is ServicesConnector / ScpeSaas?

**`magento/services-connector`** (also referred to as **ScpeSaas** — *Storefront Commerce Platform Extension SaaS*) is the **authentication and configuration layer** that connects Commerce to Adobe's SaaS infrastructure.

It manages:
- **API Keys** (Production & Sandbox)
- **Data Space / Environment** selection (Production vs. Non-Production SaaS spaces)
- **IMS Organization** binding
- Endpoint URL resolution

### 5.2 Configuration Location

**Admin → Stores → Configuration → Services → Commerce Services Connector**

Key configuration fields:

| Field | Description |
|---|---|
| **Production API Key** | Authenticates Commerce to SaaS (production environment) |
| **Sandbox API Key** | For staging/development environments |
| **SaaS Data Space** (Project & Space) | Routes data to correct SaaS tenant/index |
| **IMS Organization ID** | Adobe IMS org (auto-populated after API key validation) |

### 5.3 Environment-Level Configuration

```xml
<!-- app/etc/config.php or via bin/magento config:set -->
<!-- Programmatic configuration for CI/CD pipelines -->
```

```bash
# Set via CLI (useful for CI/CD)
bin/magento config:set services_connector/services_connector/api_key "YOUR_PRODUCTION_KEY"
bin/magento config:set services_connector/services_connector/sandbox_api_key "YOUR_SANDBOX_KEY"

# Verify connection
bin/magento saas:resync --dry-run --feed=products
```

### 5.4 SaaS Data Space Concept

```
Adobe Commerce Instance
        |
        | (API Key authentication)
        v
+---------------------------+
|  Commerce Services SaaS   |
|                           |
|  Project: "My Store"      |
|  +---------------------+  |
|  | Space: Production   |  |  <-- Production catalog index
|  +---------------------+  |
|  +---------------------+  |
|  | Space: Staging      |  |  <-- Staging catalog index
|  +---------------------+  |
+---------------------------+
```

**Exam focus:** Each **SaaS Data Space** is an **isolated index**. Production and non-production spaces are completely separate — syncing to the wrong space will cause missing data in the storefront. This is a common misconfiguration issue.

### 5.5 Verifying Connector Health

```bash
# Check if services connector can authenticate
bin/magento services:usage

# Look for connector status in logs
grep -i "saas" var/log/system.log | tail -50

# Check feed transmission logs
tail -f var/log/commerce-data-export.log
```

**Exam focus:** The `services-connector` module handles **mutual authentication** — both the API key AND the SaaS Data Space ID must match. Mismatch causes HTTP 401/403 on feed transmission.

---

## 6. API Mesh (Adobe API Mesh)

### 6.1 What Is Adobe API Mesh?

Adobe API Mesh is a **cloud-based GraphQL gateway** (part of Adobe Developer App Builder / IO Runtime) that:
- **Aggregates multiple APIs** (Commerce GraphQL, SaaS GraphQL, third-party APIs) into a **single GraphQL endpoint**
- Enables **transformation** and **composition** of data from multiple sources
- Reduces storefront complexity (one endpoint instead of many)
- Runs in **Adobe's edge network** (not on Commerce server)

```
Storefront / PWA / Mobile App
              |
              | (single GraphQL query)
              v
+-----------------------------+
|     Adobe API Mesh          |
|  (GraphQL Federation)       |
|                             |
|  Source 1: Commerce GQL     |
|  Source 2: Live Search GQL  |
|  Source 3: Catalog Svc GQL  |
|  Source 4: 3rd Party REST   |
|  Source 5: Custom API       |
+-----------------------------+
     |     |     |     |
     v     v     v     v
  Comm  LiveSrch  CatSvc  ERP
```

### 6.2 Mesh Configuration File

API Mesh is configured via a **JSON mesh configuration file** (`mesh.json`):

```json
{
  "meshConfig": {
    "sources": [
      {
        "name": "Commerce",
        "handler": {
          "graphql": {
            "endpoint": "https://my-store.example.com/graphql"
          }
        }
      },
      {
        "name": "LiveSearch",
        "handler": {
          "graphql": {
            "endpoint": "https://catalog-service.adobe.io/graphql",
            "operationHeaders": {
              "Magento-Store-View-Code": "{context.headers['magento-store-view-code']}",
              "Magento-Website-Code": "{context.headers['magento-website-code']}",
              "Magento-Store-Code": "{context.headers['magento-store-code']}",
              "x-api-key": "my-api-key",
              "Magento-Environment-Id": "my-environment-id"
            }
          }
        }
      },
      {
        "name": "ThirdPartyREST",
        "handler": {
          "openapi": {
            "source": "https://api.third-party.com/openapi.json"
          }
        }
      }
    ],
    "transforms": [
      {
        "filterSchema": {
          "filters": [
            "Query.!adminToken",
            "Mutation.!createCustomerV2"
          ]
        }
      },
      {
        "rename": {
          "renames": [
            {
              "from": {
                "type": "Query",
                "field": "products"
              },
              "to": {
                "type": "Query",
                "field": "commerceProducts"
              }
            }
          ]
        }
      }
    ],
    "additionalTypeDefs": "extend type ProductInterface { erpCode: String }",
    "additionalResolvers": [
      {
        "targetTypeName": "ProductInterface",
        "targetFieldName": "erpCode",
        "sourceName": "ThirdPartyREST",
        "sourceTypeName": "Query",
        "sourceFieldName": "getErpCode",
        "requiredSelectionSet": "{ sku }",
        "sourceArgs": {
          "sku": "{root.sku}"
        },
        "result": "code"
      }
    ]
  }
}
```

**Exam focus:** The `mesh.json` file is the core configuration. Know the structure: `sources` (data origins), `transforms` (schema modifications), `additionalTypeDefs` (schema extensions), `additionalResolvers` (field-level resolvers from other sources).

### 6.3 API Mesh CLI (Adobe I/O CLI)

```bash
# Install Adobe I/O CLI and API Mesh plugin
npm install -g @adobe/aio-cli
aio plugins:install @adobe/aio-cli-plugin-api-mesh

# Authenticate
aio auth:login

# Create a new mesh
aio api-mesh:create mesh.json

# Update existing mesh
aio api-mesh:update mesh.json

# Get mesh details (endpoint URL)
aio api-mesh:get

# Delete mesh
aio api-mesh:delete
```

### 6.4 Transformation Rules

API Mesh supports several transform types:

| Transform | Purpose | Example Use Case |
|---|---|---|
| `filterSchema` | Remove types/fields from merged schema | Hide internal/admin queries |
| `rename` | Rename types or fields | Resolve naming conflicts |
| `prefix` | Add prefix to all types from a source | Avoid type name collisions |
| `encapsulate` | Wrap source schema in a namespace | Isolate source schemas |
| `typeResolvers` | Custom field resolvers | Join data across sources |
| `additionalTypeDefs` | Add new types/fields | Extend merged schema |
| `additionalResolvers` | Resolve new fields from other sources | Cross-source data joining |

### 6.5 Headers Forwarding Pattern

Live Search and Catalog Service require specific headers:

```json
{
  "name": "CatalogService",
  "handler": {
    "graphql": {
      "endpoint": "https://catalog-service.adobe.io/graphql",
      "operationHeaders": {
        "Magento-Store-View-Code": "{context.headers['store']}",
        "Magento-Website-Code": "{context.headers['website']}",
        "Magento-Store-Code": "{context.headers['storeCode']}",
        "Magento-Customer-Group": "{context.headers['customerGroup']}",
        "x-api-key": "{env.API_KEY}",
        "Magento-Environment-Id": "{env.ENVIRONMENT_ID}"
      }
    }
  }
}
```

**Exam focus:** Headers like `Magento-Store-View-Code`, `Magento-Environment-Id`, and `x-api-key` are **required** for SaaS GraphQL endpoints to return store-scoped data. Missing these headers = empty responses or errors.

### 6.6 Environment Variables in Mesh

```json
{
  "meshConfig": {
    "sources": [...],
    "files": [
      {
        "path": "./secrets.json",
        "content": "{\"API_KEY\": \"my-real-key\"}"
      }
    ]
  }
}
```

Or reference `{env.VARIABLE_NAME}` in mesh config, set via:

```bash
aio api-mesh:update mesh.json --env API_KEY=my-key
```

---

## 7. Commerce Eventing for SaaS Triggers

### 7.1 What Is Adobe Commerce Eventing?

**Adobe I/O Events for Adobe Commerce** allows Commerce to **emit events** to Adobe I/O Event infrastructure when business events occur (product saved, order placed, customer created, etc.). These events can trigger:
- **SaaS service refreshes**
- **App Builder actions** (serverless functions)
- **Third-party webhooks**
- **Custom business logic** in the cloud

```
Commerce Event occurs (e.g., product.updated)
              |
              v
+---------------------------+
|  Adobe Commerce Eventing  |
|  (IO Events module)       |
+---------------------------+
              |
              | (HTTP to Adobe I/O Events)
              v
+---------------------------+
|  Adobe I/O Events         |
|  (Event Bus / Journal)    |
+---------------------------+
         |          |
         v          v
  App Builder    Third-Party
  Action         Webhook
```

### 7.2 Key Module: `Magento_AdobeIoEventsClient`

```bash
# Install the eventing module
composer require magento/commerce-eventing

# Configure
bin/magento events:create-event-provider \
  --label="My Store Events" \
  --description="Commerce events from production store"

# Subscribe to events
bin/magento events:subscribe observer.catalog_product_save_after \
  --fields="sku" \
  --fields="name" \
  --fields="price"
```

### 7.3 Event Registration in Module

```xml
<!-- app/code/Vendor/Module/etc/io_events.xml -->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_AdobeCommerceEventsClient:etc/io_events.xsd">
    <event name="observer.catalog_product_save_after">
        <fields>
            <field name="sku"/>
            <field name="name"/>
            <field name="price"/>
            <field name="status"/>
            <field name="visibility"/>
        </fields>
    </event>
    <event name="observer.sales_order_place_after">
        <fields>
            <field name="increment_id"/>
            <field name="customer_email"/>
            <field name="grand_total"/>
        </fields>
    </event>
</config>
```

**Exam focus:** Events in `io_events.xml` define **what data** is included in the event payload. Fields listed are **whitelisted** — only these fields are sent (security by design). You cannot send arbitrary object data without explicit field declaration.

### 7.4 Conditional Events (Rules-Based)

```xml
<event name="observer.catalog_product_save_after">
    <fields>
        <field name="sku"/>
        <field name="status"/>
    </fields>
    <rules>
        <rule>
            <field>status</field>
            <operator>equal</operator>
            <value>1</value>
        </rule>
    </rules>
</event>
```

**Exam focus:** Rules filter events **before transmission** — events that don't match rules are not sent to Adobe I/O. This reduces unnecessary event traffic.

### 7.5 Event Types: Observer vs. Plugin Events

| Type | Prefix | Example | When to Use |
|---|---|---|---|
| Observer Events | `observer.` | `observer.catalog_product_save_after` | Standard Magento events |
| Plugin Events | `plugin.` | `plugin.magento.catalog.api.product_repository_interface.save` | Non-event method calls |

### 7.6 App Builder Integration for SaaS Triggers

```javascript
// App Builder action (Node.js) triggered by Commerce event
const { Core } = require('@adobe/aio-sdk');

async function main(params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });
  
  // Parse Commerce event payload
  const eventData = params.data?.value;
  const sku = eventData?.sku;
  
  logger.info(`Product updated: ${sku}`);
  
  // Trigger SaaS resync for specific product
  // (e.g., call Commerce API to trigger indexer for this SKU)
  await triggerSaasResync(sku, params);
  
  return { statusCode: 200, body: { message: `Resync triggered for ${sku}` } };
}

async function triggerSaasResync(sku, params) {
  const axios = require('axios');
  return axios.post(
    `${params.COMMERCE_BASE_URL}/rest/V1/saas/resync`,
    { sku },
    { headers: { Authorization: `Bearer ${params.COMMERCE_ADMIN_TOKEN}` } }
  );
}

module.exports = { main };
```

### 7.7 Eventing Configuration in Admin

**Admin → System → Events → Adobe I/O Events Configuration**

| Setting | Description |
|---|---|
| Enabled | Toggle Commerce Eventing on/off |
| Merchant ID | Adobe Commerce instance identifier |
| Environment ID | Matches the SaaS Data Space environment |
| Event Provider ID | Adobe I/O Event Provider (created via CLI or Admin) |
| Batch Size | Number of events per HTTP call to I/O Events |
| Schedule | Cron schedule for event queue processing |

**Exam focus:** Commerce Eventing uses a **queue + cron** mechanism, NOT real-time HTTP. Events are queued in the Commerce DB and transmitted on a cron schedule. Real-time appearance depends on cron frequency.

### 7.8 Debugging Eventing

```bash
# View event queue
bin/magento events:list

# Check subscribed events
bin/magento events:list:all

# Test event emission
bin/magento events:fire observer.catalog_product_save_after \
  --data='{"sku":"TEST-001","name":"Test Product"}'

# View event logs
tail -f var/log/adobe-io-events-client.log
```

---

## Quick-Reference Checklist

### Adobe Commerce SaaS Services
- [ ] **Three core services**: Catalog Service (read-only product data), Live Search (search engine), Product Recommendations (AI/ML)
- [ ] Catalog Service uses GraphQL queries: `products`, `refineProduct`
- [ ] Live Search uses GraphQL queries: `productSearch`, `suggestions`
- [ ] Product Recommendations requires BOTH catalog sync AND behavioral event data
- [ ] All SaaS services are **read-only from storefront** — data flows one-way Commerce → SaaS
- [ ] Live Search replaces Elasticsearch/OpenSearch — they cannot run simultaneously

### Data Sync Mechanism
- [ ] Core module: `magento/data-exporter` provides `FeedInterface`, `FeedIndexer`, `Exporter`
- [ ] **Cron group**: `saas_data_exporter` — must be running for sync to work
- [ ] CLI command: `bin/magento saas:resync --feed=<feedname>` for forced resync
- [ ] Feed names: `products`, `categories`, `prices`, `productattributes`, `productoverrides`
- [ ] `getFeedSince()` = incremental/delta sync; full resync collects all IDs
- [ ] Local feed tables: `catalog_data_exporter_products`, `catalog_data_exporter_categories`, etc.
- [ ] Data flow: Indexer mview → FeedIndexer → Collectors/Providers → Serializer → SaasClient → SaaS

### Customizing Feed Data
- [ ] New feed fields defined in `et_schema.xml` with `provider` attribute pointing to Provider class
- [ ] Provider class must implement `get(array $values): array` method
- [ ] Providers receive **batched** values (not one at a time) for performance
- [ ] Plugins on existing Provider classes modify/extend existing feed fields
- [ ] Attributes need `is_searchable` and `is_filterable_in_search` flags for Live Search facets
- [ ] Product attribute feed must be resynced after attribute changes

### Catalog-Export Pipeline Extension Points
- [ ] Add field: `et_schema.xml` + Provider class
- [ ] Modify existing field: Plugin on Provider
- [ ] Filter records: Plugin on `FeedIndexer` or `Exporter`
- [ ] New feed type: New `FeedInterface` impl + `et_schema.xml` + Indexer definition

### ServicesConnector (ScpeSaas)
- [ ] Module: `magento/services-connector`
- [ ] Admin location: **Stores → Configuration → Services → Commerce Services Connector**
- [ ] Two API keys: Production and Sandbox — both must be configured
- [ ] **SaaS Data Space** = isolated SaaS index; wrong space = missing storefront data
- [ ] Production vs. Non-Production spaces are completely separate data indexes
- [ ] HTTP 401/403 on sync = API key or Data Space ID mismatch

### API Mesh
- [ ] API Mesh is a **cloud-based GraphQL gateway** running in Adobe's edge network (NOT on Commerce server)
- [ ] Config file: `mesh.json` with sections: `sources`, `transforms`, `additionalTypeDefs`, `additionalResolvers`
- [ ] Source handler types: `graphql` (for GQL APIs), `openapi` (for REST APIs)
- [ ] Transforms: `filterSchema`, `rename`, `prefix`, `encapsulate`, `additionalTypeDefs`, `additionalResolvers`
- [ ] Required SaaS headers: `Magento-Store-View-Code`, `Magento-Environment-Id`, `x-api-key`, `Magento-Website-Code`
- [ ] CLI: `aio api-mesh:create`, `aio api-mesh:update`, `aio api-mesh:get`
- [ ] `additionalResolvers` = cross-source field joins (e.g., enrich Commerce product with ERP data)
- [ ] Environment variables referenced as `{env.VAR_NAME}` in mesh config

### Commerce Eventing
- [ ] Module: `magento/commerce-eventing` provides `Magento_AdobeIoEventsClient`
- [ ] Events configured in `io_events.xml` with explicit field whitelisting
- [ ] Two event prefixes: `observer.` (Magento events) and `plugin.` (method-level events)
- [ ] Events use **queue + cron** — NOT real-time HTTP transmission
- [ ] Rules in `io_events.xml` filter events BEFORE sending (reduces unnecessary traffic)
- [ ] CLI: `bin/magento events:subscribe`, `bin/magento events:fire`, `bin/magento events:list`
- [ ] Event Provider must be created: `bin/magento events:create-event-provider`
- [ ] Events can trigger App Builder actions for custom SaaS sync logic
- [ ] Debugging: `var/log/adobe-io-events-client.log`

### Common Exam Scenarios / Troubleshooting
- [ ] **Products missing in Live Search?** → Check cron running, check `saas:resync --feed=products`, check SaaS Data Space config
- [ ] **Attribute not showing as facet?** → Check `is_filterable_in_search` flag, resync `productattributes` feed
- [ ] **Recommendations showing generic results?** → Behavioral events not being collected; check JS snippet
- [ ] **API Mesh returning empty product data?** → Missing required headers (`Magento-Store-View-Code`, `x-api-key`, etc.)
- [ ] **Events not reaching App Builder?** → Check cron for event queue processing, check `events:list` for subscriptions
- [ ] **HTTP 401 on feed sync?** → API key mismatch or wrong SaaS Data Space selected
