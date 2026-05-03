import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const flashcards = [
  {
    question: "What are the two broad categories of shipping methods in Magento 2, and how do they differ in rate calculation?",
    answer: "Offline carriers (Flat Rate, Free Shipping, Table Rate, In-Store Pickup) calculate rates locally with no external API calls and require no account credentials. Online/real-time carriers (UPS, FedEx, USPS, DHL) call external APIs to return live rates based on weight, dimensions, origin, and destination, requiring valid account credentials.",
    hint: "Think about whether the carrier needs to 'phone home' to get a price.",
    topic: "Shipping Methods",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 8 — Shipping Methods & Carriers"
  },
  {
    question: "At what scope is the origin (shipping) address configurable in Magento 2, and what happens if the origin ZIP is missing?",
    answer: "The origin address is configurable at Default and Website scope (showInDefault=1, showInWebsite=1, but NOT showInStore). If the origin ZIP is missing or incorrect, real-time carriers (UPS, FedEx, USPS, DHL) may return no rates at all.",
    hint: "Different websites can have different warehouses, but store views within a website share the same origin.",
    topic: "Shipping Configuration",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 8 — Shipping Methods & Carriers"
  },
  {
    question: "What is the critical difference between Flat Rate 'Per Order' and 'Per Item' types?",
    answer: "Per Order charges a single fixed rate regardless of how many items are in the cart. Per Item multiplies the configured rate by the total number of items in the cart (not unique products). For example, 3 items at $5.00 Flat Rate: Per Order = $5.00, Per Item = $15.00.",
    hint: "Per Item counts quantity, not distinct SKUs.",
    topic: "Flat Rate Shipping",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 8 — Shipping Methods & Carriers"
  },
  {
    question: "When is the Free Shipping minimum order amount checked — before or after discounts are applied?",
    answer: "The minimum order amount is checked AFTER discounts are applied. A $60 cart with a $15 coupon has an effective subtotal of $45. If the Free Shipping minimum is $50, Free Shipping will NOT be available because $45 < $50.",
    hint: "This is one of the most common exam traps — the coupon reduces the effective subtotal before the threshold check.",
    topic: "Free Shipping",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 8 — Shipping Methods & Carriers"
  },
  {
    question: "What are the three condition options for Table Rate shipping, and what happens if the CSV column headers don't match the selected condition?",
    answer: "The three conditions are: Weight vs. Destination, Price vs. Destination, and # of Items vs. Destination. If the CSV column headers don't match the selected condition in Admin, a silent failure occurs — no rates are shown to the customer, with no error message displayed.",
    hint: "The word 'silent' is key — Magento doesn't tell you the CSV is wrong.",
    topic: "Table Rate Shipping",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 8 — Shipping Methods & Carriers"
  },
  {
    question: "In Table Rate CSV files, what must be used to represent 'any value' for Country, Region, or ZIP — and what is NOT acceptable?",
    answer: "The asterisk wildcard (*) must be used to represent 'any value.' Blank/empty cells are NOT treated as wildcards and will cause the row to be ignored, resulting in no rates for those destinations.",
    hint: "A star means 'match everything'; leaving it empty means 'match nothing.'",
    topic: "Table Rate Shipping",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 8 — Shipping Methods & Carriers"
  },
  {
    question: "What are the two different mechanisms for offering free shipping in Magento, and how do they differ in scope?",
    answer: "1) Free Shipping Method (Delivery Methods config) — a dedicated $0 shipping method that appears when cart subtotal meets a minimum, applying to the entire order. 2) Cart Price Rule with free shipping action — uses flexible rule conditions (coupons, segments, product matching) and can set an existing carrier's method to $0. A Cart Rule does NOT create a new shipping method — it modifies an existing one.",
    hint: "One is a standalone method; the other piggybacks on existing carriers.",
    topic: "Free Shipping",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 8 — Shipping Methods & Carriers"
  },
  {
    question: "What is the difference between Cart Price Rule free shipping scopes: 'For matching items only' vs 'For shipment with matching items'?",
    answer: "'For matching items only' makes only the matching items' shipping free — other items in the cart still incur shipping costs. 'For shipment with matching items' makes the entire shipment free if ANY item in it matches the rule conditions.",
    hint: "One is partial (just those items), the other is all-or-nothing for the whole shipment.",
    topic: "Free Shipping Cart Rules",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 8 — Shipping Methods & Carriers"
  },
  {
    question: "Is Multi-Address Checkout available in Magento Open Source, and how does it create orders?",
    answer: "Yes, Multi-Address Checkout is available in BOTH Open Source and Commerce — the module-multishipping has OSL-3.0 license. It creates a single order with multiple shipping addresses and multiple shipments, not multiple separate orders. Each address gets its own independent shipping method selection.",
    hint: "Common misconception — it's NOT EE-only. One order, many addresses.",
    topic: "Multi-Address Checkout",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 8 — Shipping Methods & Carriers"
  },
  {
    question: "What four credentials does FedEx require for integration, and does FedEx have a native Sandbox Mode toggle in Magento?",
    answer: "FedEx requires four credentials: Account ID, Meter Number, Key, and Password. Yes, FedEx has a native Sandbox Mode toggle in the Admin configuration, allowing testing without real charges.",
    hint: "FedEx needs four keys to the door, and yes, there's a built-in test mode.",
    topic: "Real-Time Carriers",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 8 — Shipping Methods & Carriers"
  },
  {
    question: "At what scope is Table Rate configuration managed, and what must you do after importing a CSV?",
    answer: "Table Rate configuration is website-scoped. Different websites can have completely different rate tables. After importing a CSV, you must Save Config for the changes to take effect. Also, the import must be done at website scope, not global scope.",
    hint: "Website-level, not global. And don't forget to click Save!",
    topic: "Table Rate Shipping",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 8 — Shipping Methods & Carriers"
  },
  {
    question: "What happens to the shipping step at checkout if a cart contains ONLY virtual products?",
    answer: "If a cart contains only virtual products (downloadable, services), the shipping step is SKIPPED entirely at checkout. No shipping methods are displayed, and a shipping address may not be required.",
    hint: "No physical goods = nothing to ship = no shipping step.",
    topic: "Shipping Methods",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 8 — Shipping Methods & Carriers"
  },
  {
    question: "Why might UPS or FedEx show 'no rates available' for certain products, even though the carrier is properly configured?",
    answer: "Products are missing the weight attribute value. All real-time carriers require products to have weight configured. Without weight, the carrier API cannot calculate rates and returns no results.",
    hint: "No weight on the product = the carrier can't calculate how much to charge for shipping.",
    topic: "Real-Time Carriers",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 8 — Shipping Methods & Carriers"
  },
  {
    question: "What happens when a customer's billing country is NOT in the 'Ship to Specific Countries' list for a shipping method?",
    answer: "The shipping method is simply hidden from checkout — no error message is displayed. The customer will not see the method as an option at all.",
    hint: "It vanishes silently — no error, just gone.",
    topic: "Shipping Zones",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 8 — Shipping Methods & Carriers"
  },
  {
    question: "How does UPS Destination Type (Residential vs Commercial) affect shipping pricing?",
    answer: "Setting the UPS Destination Type to Residential typically results in higher shipping costs compared to Commercial. Negotiated Rates must be enabled in both the UPS account settings AND Magento configuration to work.",
    hint: "Home delivery costs more than shipping to a business.",
    topic: "Real-Time Carriers",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 8 — Shipping Methods & Carriers"
  },
  {
    question: "What is the difference between 'Authorize Only' and 'Authorize and Capture' payment actions in Magento?",
    answer: "Authorize Only creates a reservation (hold) at the bank but does NOT move money and does NOT auto-create an invoice. The merchant must manually create an invoice in Admin, which triggers the actual capture. Authorize and Capture immediately moves money in one step and automatically creates an invoice at order placement.",
    hint: "Authorize Only = hold funds, invoice later to capture. Authorize and Capture = charge now, invoice auto-created.",
    topic: "Payment Actions",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 9 — Payment Methods & Processing"
  },
  {
    question: "What triggers the actual fund capture when a payment method is set to 'Authorize Only'?",
    answer: "Creating an invoice manually in Admin (Sales > Orders > [Order] > Invoice > Submit Invoice) triggers the actual capture and moves funds from the customer's bank to the merchant.",
    hint: "The invoice creation IS the capture trigger — no invoice, no money movement.",
    topic: "Payment Actions",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 9 — Payment Methods & Processing"
  },
  {
    question: "What four payment methods does Braintree support in Magento, and what are its three required API credentials?",
    answer: "Braintree supports: Credit/Debit Cards, PayPal (through Braintree), Venmo, and ACH Direct Debit. Required credentials: Merchant ID, Public Key, and Private Key (from the Braintree dashboard).",
    hint: "Cards, PayPal, Venmo, ACH — four ways to pay. Three keys to set up.",
    topic: "Braintree",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 9 — Payment Methods & Processing"
  },
  {
    question: "What is the primary business benefit of 3D Secure (3DS2) authentication, and who bears chargeback liability?",
    answer: "The primary benefit is liability shift. When 3DS2 authentication is used and fraud occurs, the chargeback liability shifts from the merchant to the card-issuing bank. Without 3DS2, the merchant pays the chargeback.",
    hint: "It's all about who pays when fraud happens — with 3DS2, the bank takes the hit.",
    topic: "3D Secure",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 9 — Payment Methods & Processing"
  },
  {
    question: "What is the difference between 3DS2 'frictionless flow' and 'challenge flow'?",
    answer: "Frictionless flow occurs for low-risk transactions where the customer is approved without any additional action needed — it's invisible to the customer. Challenge flow is triggered for high-risk transactions and requires the customer to verify their identity via OTP, push notification, or password/PIN.",
    hint: "Low risk = no extra steps. High risk = prove who you are.",
    topic: "3D Secure",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 9 — Payment Methods & Processing"
  },
  {
    question: "What does PCI DSS say about CVV storage, and how does Magento Vault handle card data?",
    answer: "PCI DSS absolutely prohibits storing CVV anywhere — not in the database, logs, or session beyond the transaction. Magento Vault stores payment tokens (non-sensitive references), NOT actual card numbers. The real card data (PAN) is stored at the gateway (e.g., Braintree), and Magento only keeps the token in the vault_payment_token table.",
    hint: "CVV = never stored, ever. Card numbers = stored at the gateway, not in Magento.",
    topic: "PCI DSS Compliance",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 9 — Payment Methods & Processing"
  },
  {
    question: "When does Zero Subtotal Checkout activate, and what controls whether an invoice is auto-created?",
    answer: "Zero Subtotal Checkout activates ONLY when the order total is exactly $0.00 (from 100% coupons, gift cards, store credit, or reward points). Even $0.01 remaining requires a normal payment method. The 'Automatically Invoice All Items' setting controls whether an invoice is created immediately.",
    hint: "Exactly zero — not almost zero. And there's a toggle for auto-invoicing.",
    topic: "Zero Subtotal Checkout",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 9 — Payment Methods & Processing"
  },
  {
    question: "How do payment method country restrictions work — are they based on billing or shipping address?",
    answer: "Payment method country restrictions are based on the BILLING address country, not the shipping address. If a customer's billing country is not in the allowed list, the payment method does not appear at checkout — no error is shown.",
    hint: "Billing, not shipping — it's about where the money comes from.",
    topic: "Payment Restrictions",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 9 — Payment Methods & Processing"
  },
  {
    question: "What distinguishes PayPal Express Checkout from PayPal Payments Standard?",
    answer: "PayPal Express Checkout offers shortcut buttons on the product page, cart, and mini-cart (bypassing normal checkout), supports in-context checkout (modal overlay), and has billing agreement support. PayPal Payments Standard always fully redirects the customer off-site to PayPal's hosted page, has no shortcut buttons, and is the simplest setup with highest PCI scope reduction.",
    hint: "Express = shortcuts + in-context overlay. Standard = full redirect, simpler but less seamless.",
    topic: "PayPal Methods",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 9 — Payment Methods & Processing"
  },
  {
    question: "What is the difference between tokenization and storing raw card numbers, and where are Vault tokens stored?",
    answer: "Tokenization replaces sensitive card data with a non-sensitive token that the gateway can exchange for real card data. Card details are sent directly to the gateway via JS SDK (never touching the Magento server), and the gateway returns a token. Vault tokens are stored in the vault_payment_token table. The actual card number (PAN) stays at the gateway.",
    hint: "Token = safe reference. Real card data lives at the gateway, never in Magento's database.",
    topic: "Tokenization & Vault",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 9 — Payment Methods & Processing"
  },
  {
    question: "What is Purchase Order (PO) payment, and how does it differ from online payment methods?",
    answer: "Purchase Order is a B2B deferred/offline payment method where the customer submits a PO number as a promise to pay later (typically via net terms like Net 30). No payment gateway is contacted — the PO number is stored in the order. The merchant fulfills the order and the customer pays within agreed terms. In B2B module context, credit limits can auto-approve or block PO orders.",
    hint: "Trust-based B2B payment — pay me later, here's my PO number.",
    topic: "Purchase Order Payment",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 9 — Payment Methods & Processing"
  },
  {
    question: "What is the difference between Cash on Delivery (COD) and other offline payment methods regarding payment timing?",
    answer: "COD is the only offline method where payment occurs AFTER shipment — the customer pays the delivery driver in cash upon receiving the order. All other offline methods (Check/MO, Bank Transfer) require payment before or during order processing. COD orders can move to processing/shipped status before payment is confirmed.",
    hint: "COD = pay when it arrives. Everything else = pay before it ships.",
    topic: "Offline Payments",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 9 — Payment Methods & Processing"
  },
  {
    question: "How does 3DS2 threshold amount work in Braintree's Magento configuration?",
    answer: "The threshold amount setting allows low-value transactions below the threshold to skip 3DS2 verification (reducing friction and cart abandonment), while transactions above the threshold always require 3DS2 authentication. It can also be configured for specific countries only.",
    hint: "Small purchases skip the extra step; big purchases require identity verification.",
    topic: "3D Secure Configuration",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 9 — Payment Methods & Processing"
  },
  {
    question: "For offline payment methods like Check/Money Order, how are invoices created and what is the order status flow?",
    answer: "For all offline methods, invoices must be created manually — there is no automatic invoice creation. The flow is: Order placed (status: Pending) → Merchant receives payment offline → Merchant updates order in Admin → Invoice created manually → Order fulfillment begins. No gateway communication occurs at any point.",
    hint: "Everything is manual — no gateway, no auto-invoice, no auto-status change.",
    topic: "Offline Payment Workflow",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 9 — Payment Methods & Processing"
  },
  {
    question: "Are partial invoices possible with Authorize Only, and how does this differ from Authorize and Capture?",
    answer: "Yes, with Authorize Only you can create multiple partial invoices against a single authorization (if the gateway supports it), capturing portions of the total amount over time. With Authorize and Capture, this is not possible — the full amount is charged immediately at order placement in a single transaction.",
    hint: "Auth Only = capture in pieces. Auth+Capture = all at once, no splitting.",
    topic: "Partial Capture",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 9 — Payment Methods & Processing"
  },
  {
    question: "What are the four default customer groups in Magento, and what is special about Group ID 0?",
    answer: "The four default groups are: NOT LOGGED IN (ID 0), General (ID 1), Wholesale (ID 2), and Retailer (ID 3). Group ID 0 ('NOT LOGGED IN') is used for guest/anonymous visitors — it controls guest pricing. You can set group-specific prices or price rules that only apply to unauthenticated shoppers by targeting this group.",
    hint: "Zero = guests. Remember the IDs: 0, 1, 2, 3.",
    topic: "Customer Groups",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 10 — Customer Groups, Segments & Account Features"
  },
  {
    question: "What is the fundamental difference between Customer Groups and Customer Segments?",
    answer: "Customer Groups are static, manually assigned (or via VAT rules), available in both CE and EE. Each customer belongs to exactly one group. Customer Segments are dynamic, condition-based groupings available only in EE. A customer can belong to multiple segments simultaneously. Groups affect tax class and pricing; Segments do NOT affect tax class — they're used for content/promo targeting.",
    hint: "Groups = one per customer, static, tax. Segments = many per customer, dynamic, targeting.",
    topic: "Groups vs Segments",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 10 — Customer Groups, Segments & Account Features"
  },
  {
    question: "In what four places are Customer Segments used in Adobe Commerce (EE)?",
    answer: "Customer Segments are used in: 1) Dynamic Blocks (targeted CMS banners), 2) Catalog Price Rules, 3) Cart Price Rules, and 4) Related Product Rules. They serve as a targeting mechanism for personalizing content and promotions.",
    hint: "Blocks, catalog rules, cart rules, and related products — four uses for segments.",
    topic: "Customer Segments",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 10 — Customer Groups, Segments & Account Features"
  },
  {
    question: "How does segment evaluation work — is it real-time or deferred?",
    answer: "Segment evaluation is lazy/deferred, NOT real-time. Segments are re-evaluated only when trigger events occur: customer login, account creation, order placement, cart add/remove, address update, admin manual refresh, or cron job execution. A segment does not update instantly when a condition changes.",
    hint: "Segments don't watch you constantly — they check when something happens.",
    topic: "Segment Evaluation",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 10 — Customer Groups, Segments & Account Features"
  },
  {
    question: "How does the Wishlist feature differ between Magento Open Source (CE) and Adobe Commerce (EE)?",
    answer: "CE supports only a single wishlist per customer with no custom name. EE supports multiple unlimited wishlists, each with a custom name, and allows moving items between wishlists. Both editions support sharing wishlists by email and adding items to cart from the wishlist.",
    hint: "CE = one list. EE = as many as you want, each with its own name.",
    topic: "Wishlist CE vs EE",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 10 — Customer Groups, Segments & Account Features"
  },
  {
    question: "When multiple price types apply to a product (regular, special, group, tier), which one does Magento use?",
    answer: "Magento always applies the LOWEST applicable price. For example, if Regular = $100, Special = $85, Group Price (Wholesale) = $80, and Tier Price (qty 10+) = $75, then a Wholesale customer buying 10+ units sees $75.",
    hint: "Lowest price always wins — Magento picks the best deal for the customer.",
    topic: "Price Resolution",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 10 — Customer Groups, Segments & Account Features"
  },
  {
    question: "What are the two types of group pricing on a product, and where are they configured?",
    answer: "Group prices can be set as either a Fixed dollar amount (e.g., $8.00) or a Discount percentage (e.g., 15% off regular price). They are configured at Catalog > Products > [Edit Product] > Advanced Pricing, where you specify the customer group, quantity, and price type.",
    hint: "Fixed = exact dollar price. Discount = percentage off. Both under Advanced Pricing.",
    topic: "Group Pricing",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 10 — Customer Groups, Segments & Account Features"
  },
  {
    question: "Can Customer Segments target guest/anonymous visitors, and how does this work?",
    answer: "Yes, when a segment's 'Apply To' setting is set to 'Visitors and Registered Customers' or 'Visitors' only, it can match guest users based on current session/cart data (items in cart, cart subtotal, coupon applied). However, historical order conditions cannot match guests since they have no order history.",
    hint: "Guests can match via what's in their cart right now, but not past purchases.",
    topic: "Customer Segments",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 10 — Customer Groups, Segments & Account Features"
  },
  {
    question: "Is Catalog Permissions available in Magento Open Source (CE), and what does it do?",
    answer: "No, Catalog Permissions is an EE-only feature. It restricts category and product browsing based on customer group — it can hide categories entirely, restrict adding to cart, or redirect to a login page. In CE, all customers see all published catalog content.",
    hint: "Hiding categories by group = EE only. CE shows everything to everyone.",
    topic: "Catalog Permissions",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 10 — Customer Groups, Segments & Account Features"
  },
  {
    question: "What is automatic customer group assignment via VAT validation, and which editions support it?",
    answer: "Magento can automatically assign customers to groups based on VAT ID validation (common in EU markets): valid domestic VAT → group X, valid intra-EU VAT → group Y, invalid VAT → group Z. This feature is available in both CE and EE. It is NOT the same as EE's segment-based rules.",
    hint: "VAT auto-assignment = both editions. Don't confuse with Segments (EE only).",
    topic: "Customer Group Assignment",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 10 — Customer Groups, Segments & Account Features"
  },
  {
    question: "Which customer account features are EE-exclusive versus available in both CE and EE?",
    answer: "Both CE and EE: Order History (with reorder), Address Book, Wishlist (single in CE), Newsletter Subscriptions, Downloadable Products, Stored Payment Methods. EE-exclusive: Reward Points, Store Credit, Gift Cards, Gift Registry, Multiple Wishlists, Returns (RMA).",
    hint: "Loyalty/rewards and returns = EE only. Basic account management = both.",
    topic: "Account Features",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 10 — Customer Groups, Segments & Account Features"
  },
  {
    question: "What is RMA (Return Merchandise Authorization), and which edition supports it?",
    answer: "RMA is a full returns management system (EE-only, module-rma has proprietary license). Customers submit return requests from their account, admin approves/denies, return shipping labels are generated, and refund/exchange is processed. In CE, returns must be handled manually outside the platform. The 'Returns' section only appears in the customer account if RMA is enabled on an Adobe Commerce installation.",
    hint: "Returns button in customer account = EE. CE has no built-in returns workflow.",
    topic: "RMA",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 10 — Customer Groups, Segments & Account Features"
  },
  {
    question: "How do Dynamic Blocks differ from static CMS blocks in Magento?",
    answer: "Static CMS Blocks (CE + EE) contain fixed HTML/widget content placed via {{block id=\"...\"}}. Dynamic Blocks (EE only, formerly 'Banners') display content dynamically based on Customer Segments and/or Cart Price Rules — different customers see different content. Dynamic Blocks require both EE license and Customer Segments to be truly useful.",
    hint: "Static = same for everyone. Dynamic = personalized by segment. Both EE-only features work together.",
    topic: "Dynamic Blocks",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 10 — Customer Groups, Segments & Account Features"
  },
  {
    question: "Do Customer Segments affect tax class calculations?",
    answer: "No, Customer Segments do NOT affect tax class. Only Customer Groups affect tax calculation. Segments are used exclusively for content targeting (Dynamic Blocks) and promotional targeting (Catalog/Cart Price Rules, Related Product Rules). The tax class is determined solely by the customer's assigned group.",
    hint: "Tax = Groups only. Targeting/personalization = Segments.",
    topic: "Segments vs Groups",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 10 — Customer Groups, Segments & Account Features"
  },
  {
    question: "How many environments does Adobe Commerce Cloud Pro provide, and what is the production SLA?",
    answer: "Cloud Pro provides 10 total environments: 8 integration environments for dev/feature branch testing, 1 dedicated staging cluster that mirrors production topology, and 1 dedicated production cluster with HA and auto-scaling. The production SLA is 99.99% uptime.",
    hint: "8 + 1 + 1 = 10 environments. Four nines SLA.",
    topic: "Cloud Pro",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 12 — Hosting Options & Service Add-ons"
  },
  {
    question: "How does Cloud Starter differ from Cloud Pro in terms of environments and architecture?",
    answer: "Cloud Starter has 4 total environments (2 integration + 1 staging + 1 production) versus Pro's 10. Starter's staging runs on shared infrastructure (NOT a dedicated cluster like Pro). Starter uses a simplified single-cluster model with no auto-scaling. However, Starter DOES include Fastly CDN, same as Pro.",
    hint: "Starter = 4 envs, shared staging, no auto-scaling. Pro = 10 envs, dedicated staging, auto-scaling.",
    topic: "Cloud Starter vs Pro",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 12 — Hosting Options & Service Add-ons"
  },
  {
    question: "What is the critical architectural difference between Cloud Pro and Cloud Starter — beyond just 'more resources'?",
    answer: "Cloud Pro uses separate, dedicated HA clusters for production and staging with multi-node architecture (web, DB, cache, search nodes) and auto-scaling. Cloud Starter uses a simplified single-cluster model. They are fundamentally different architectures — Pro is NOT simply a 'bigger' Starter.",
    hint: "Pro = dedicated HA clusters with multiple nodes. Starter = single cluster, all-in-one.",
    topic: "Cloud Architecture",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 12 — Hosting Options & Service Add-ons"
  },
  {
    question: "In the on-premises deployment model, who is responsible for security patches, scaling, and backups?",
    answer: "In on-premises, the customer is responsible for ALL infrastructure concerns: security patches, server hardware, OS management, database admin, CDN, scaling, uptime/monitoring, and backups. Adobe only provides the software license and support. There is no Adobe-managed SLA for infrastructure.",
    hint: "On-prem = you own everything. Adobe just gives you the software and answers questions.",
    topic: "On-Premises Hosting",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 12 — Hosting Options & Service Add-ons"
  },
  {
    question: "What is Adobe Commerce Managed Services, and how does it differ from Cloud Pro?",
    answer: "Managed Services is Adobe-hosted but uses a dedicated managed hosting model (not PaaS). Adobe provisions and manages dedicated infrastructure with a support SLA, handles OS patching, security, backups, and monitoring. Unlike Cloud Pro (PaaS with git-based CI/CD and auto-scaling), Managed Services uses traditional deployment with deeper server access and more customization flexibility.",
    hint: "Managed Services = Adobe runs your on-prem-style setup. Cloud Pro = Adobe runs a PaaS platform.",
    topic: "Managed Services",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 12 — Hosting Options & Service Add-ons"
  },
  {
    question: "What does Live Search do, and does it run alongside native Elasticsearch?",
    answer: "Live Search is a SaaS add-on that replaces (not supplements) native Elasticsearch/OpenSearch search with Adobe's SaaS-powered search. It provides instant search-as-you-type, faceted search from admin, merchandising rules, and synonyms management. When enabled, Elasticsearch is no longer used for storefront search. It requires a separate subscription.",
    hint: "Live Search replaces, not supplements. Elasticsearch goes dormant when Live Search is on.",
    topic: "Live Search",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 12 — Hosting Options & Service Add-ons"
  },
  {
    question: "What powers Product Recommendations, and what is the 'cold-start' challenge?",
    answer: "Product Recommendations is powered by Adobe Sensei AI/ML. It offers types like Most Viewed, Trending, Viewed This/Bought That, and personalized recommendations. The cold-start challenge means new storefronts need sufficient catalog and behavioral event data before recommendations work accurately — there's a warm-up period needed.",
    hint: "AI needs data to learn from — a brand new store has nothing to recommend yet.",
    topic: "Product Recommendations",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 12 — Hosting Options & Service Add-ons"
  },
  {
    question: "What is Catalog Service, and is it a replacement for the Admin catalog management UI?",
    answer: "Catalog Service is a SaaS add-on that exposes catalog data via a high-performance GraphQL API designed for headless/composable storefronts. It syncs catalog data in near-real-time from Commerce to Adobe's SaaS infrastructure. It is NOT a replacement for Admin catalog management — it's a read-only performance API for decoupled frontends.",
    hint: "Fast read-only API for headless frontends — you still manage products in Admin.",
    topic: "Catalog Service",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 12 — Hosting Options & Service Add-ons"
  },
  {
    question: "What is App Builder, and what is its key architectural principle?",
    answer: "Adobe Developer App Builder is a serverless, cloud-native framework for building custom Commerce extensions and integrations. Its key principle is out-of-process extensibility — custom code runs on Adobe I/O Runtime (Apache OpenWhisk), not inside Commerce's PHP application. Commerce core code is never modified. It responds to Commerce events like order placed or product updated.",
    hint: "Build extensions WITHOUT touching Commerce core PHP — serverless, out-of-process.",
    topic: "App Builder",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 12 — Hosting Options & Service Add-ons"
  },
  {
    question: "What is API Mesh, and how does it differ from App Builder?",
    answer: "API Mesh is a managed GraphQL gateway that combines multiple APIs (Commerce, third-party, custom) into a single unified GraphQL endpoint. It supports GraphQL, REST, and OpenAPI spec sources. App Builder is for custom business logic and extensions (event-driven). API Mesh is for API aggregation/stitching. Both are serverless and Adobe-managed.",
    hint: "API Mesh = combine multiple APIs into one endpoint. App Builder = custom business logic.",
    topic: "API Mesh",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 12 — Hosting Options & Service Add-ons"
  },
  {
    question: "What is ACaaS (Adobe Commerce as a Cloud Service), and how does it differ from Cloud Pro?",
    answer: "ACaaS is Adobe's next-generation composable commerce model where the entire Commerce platform is delivered as managed SaaS microservices (Catalog Service, Order Service, Checkout Service, etc.) — not a monolithic PaaS application. Merchants don't manage any servers, clusters, or deployment pipelines. It's architecturally distinct from Cloud Pro (PaaS monolith).",
    hint: "ACaaS = SaaS microservices, composable. Cloud Pro = PaaS monolith. Fundamentally different.",
    topic: "ACaaS",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 12 — Hosting Options & Service Add-ons"
  },
  {
    question: "What is Payment Services SaaS add-on, and how does it handle PCI compliance?",
    answer: "Payment Services is an Adobe-managed payment processing SaaS (powered by PayPal/Braintree infrastructure) supporting credit/debit cards, PayPal, Venmo, Apple Pay, and Google Pay. A key benefit is that Adobe/PayPal manages PCI DSS compliance for the payment gateway layer — the merchant doesn't need to independently manage it. It's NOT the same as the legacy Braintree extension that ships natively.",
    hint: "Adobe handles PCI for you — that's the big selling point over self-managed gateways.",
    topic: "Payment Services",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 12 — Hosting Options & Service Add-ons"
  },
  {
    question: "Is Fastly CDN exclusive to Cloud Pro, or does Cloud Starter also include it?",
    answer: "Fastly CDN is included in BOTH Cloud Pro and Cloud Starter — it is not exclusive to Pro. Fastly handles full-page caching, DDoS protection, WAF, and image optimization. The key differences between Pro and Starter are dedicated HA clusters, auto-scaling, and environment count — not Fastly availability.",
    hint: "Both get Fastly. The real Pro advantages are HA clusters and auto-scaling.",
    topic: "Cloud Infrastructure",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 12 — Hosting Options & Service Add-ons"
  },
  {
    question: "What is Content Staging & Preview, and which edition provides it?",
    answer: "Content Staging (EE-only) allows merchants to schedule future changes to products, categories, CMS pages, CMS blocks, catalog price rules, and cart price rules, then preview exactly how the store will look at any future date/time. It introduces staging database tables and version records. The Staging Dashboard is under Content > Staging > Dashboard. Open Source has NO scheduling capability natively.",
    hint: "Schedule future content/price changes and preview them — the flagship EE feature.",
    topic: "Content Staging",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 11 — Adobe Commerce EE vs Open Source Key Differences"
  },
  {
    question: "What are the three types of Gift Cards in Adobe Commerce (EE), and is this product type available in Open Source?",
    answer: "Gift Card is an EE-only product type with three subtypes: Virtual (email delivery only), Physical (mailed, no email), and Combined (both email and physical delivery). Gift Cards do NOT exist in Open Source — they only appear in the product type dropdown in EE installations.",
    hint: "Three flavors: virtual, physical, combined. Only on the EE menu.",
    topic: "Gift Cards",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 11 — Adobe Commerce EE vs Open Source Key Differences"
  },
  {
    question: "What is the difference between manual Related Products (CE) and Related Product Rules (EE)?",
    answer: "In CE, merchants manually assign related, up-sell, and cross-sell products on each product's edit page — a static, per-product assignment. In EE, Related Product Rules automatically generate these associations based on attribute matching rules (e.g., show accessories for all laptops in a brand). Automated rules are EE-only; manual assignment works in both editions.",
    hint: "Manual = pick each product by hand (CE+EE). Rules = automatic matching by attributes (EE only).",
    topic: "Related Product Rules",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 11 — Adobe Commerce EE vs Open Source Key Differences"
  },
  {
    question: "Is Page Builder available in Magento Open Source (CE), and what is the one content type that requires EE?",
    answer: "Yes, Page Builder ships bundled with both CE and EE since Magento 2.4 — it is NOT a separate Marketplace download. The only content type within Page Builder that requires EE is the Dynamic Block content type, because Dynamic Blocks themselves are EE-only.",
    hint: "Page Builder = both editions since 2.4. Dynamic Block widget inside it = EE only.",
    topic: "Page Builder",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 11 — Adobe Commerce EE vs Open Source Key Differences"
  },
  {
    question: "What is CMS Hierarchy, and which edition provides it?",
    answer: "CMS Hierarchy (EE-only) allows CMS pages to be organized into a tree hierarchy with parent-child relationships, enabling automatic navigation menus and prev/next links between CMS pages. The admin path is Content > Elements > Hierarchy. In CE, CMS pages are flat with no hierarchical organization.",
    hint: "Tree of CMS pages with navigation = EE. Flat, unrelated pages = CE.",
    topic: "CMS Hierarchy",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 11 — Adobe Commerce EE vs Open Source Key Differences"
  },
  {
    question: "What is Visual Merchandiser, and how does it differ from CE category product sorting?",
    answer: "Visual Merchandiser (EE-only) provides a drag-and-drop interface for sorting products within categories, plus rules-based automatic sorting by price, color, stock status, or custom attributes. In CE, category product sorting is done only via a manual Position number field — no drag-and-drop and no automated rules.",
    hint: "Drag-and-drop + auto-sort rules = EE. Typing position numbers manually = CE.",
    topic: "Visual Merchandiser",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 11 — Adobe Commerce EE vs Open Source Key Differences"
  },
  {
    question: "What five features make up the B2B Suite in Adobe Commerce, and is any part available in Open Source?",
    answer: "The B2B Suite (entirely EE-only) includes: 1) Company Accounts with roles/permissions/credit, 2) Shared Catalog with custom pricing per company, 3) Negotiable Quotes for price negotiation, 4) Requisition Lists for repeat ordering, and 5) Quick Order for SKU-based ordering. No B2B features are available in Open Source.",
    hint: "Company, Shared Catalog, Quotes, Requisition Lists, Quick Order — all EE, zero CE.",
    topic: "B2B Suite",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 11 — Adobe Commerce EE vs Open Source Key Differences"
  },
  {
    question: "What are the four SaaS add-on services for Adobe Commerce, and are they included with the EE license?",
    answer: "The four SaaS add-ons are: Live Search (replaces native search), Product Recommendations (AI-powered by Adobe Sensei), Payment Services (Adobe-managed payment processing), and Catalog Service (high-performance GraphQL API for headless). None are included in any license — they all require a separate SaaS subscription.",
    hint: "Four SaaS services, all sold separately — not bundled with CE or EE.",
    topic: "SaaS Add-Ons",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 11 — Adobe Commerce EE vs Open Source Key Differences"
  },
  {
    question: "Is MSI (Multi-Source Inventory) an EE-only feature?",
    answer: "No, MSI is NOT EE-only — this is the #1 most common exam trap. MSI was introduced in Magento 2.3.0 and ships with BOTH Open Source (CE) and Commerce (EE). It allows products to be stocked across multiple physical sources with reservation-based inventory deduction.",
    hint: "MSI = both editions since 2.3. If the exam says MSI is EE-only, that's wrong.",
    topic: "MSI",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 11 — Adobe Commerce EE vs Open Source Key Differences"
  },
  {
    question: "What distinguishes Reward Points from Store Credit in Adobe Commerce, and which edition supports them?",
    answer: "Both are EE-only. Reward Points are earned through customer activity (purchases, registration, reviews, newsletter signup) with configurable expiry and exchange rates, redeemed at checkout. Store Credit is a balance directly assigned by the admin to a customer account — it's not earned through activity. Both appear as payment options at checkout.",
    hint: "Points = earned by the customer. Credit = given by the admin. Both EE-only.",
    topic: "Loyalty Features",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 11 — Adobe Commerce EE vs Open Source Key Differences"
  },
  {
    question: "What distinguishes Requisition Lists (EE) from Wishlists (CE+EE)?",
    answer: "Wishlists are consumer-focused save-for-later lists available in both CE (single) and EE (multiple). Requisition Lists are B2B/EE-only features that allow buyers to save named lists of frequently ordered products optimized for repeat purchasing — items can be added to cart from the list with one click. A single buyer can have multiple requisition lists.",
    hint: "Wishlist = consumer, 'I want this someday.' Requisition List = B2B, 'I order this every month.'",
    topic: "Requisition Lists",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 11 — Adobe Commerce EE vs Open Source Key Differences"
  },
  {
    question: "What is the 'Schedule New Update' button, and why is it significant for identifying editions?",
    answer: "The 'Schedule New Update' button appears on product, category, and CMS page edit screens ONLY in Adobe Commerce (EE). It allows scheduling future content/price changes via Content Staging. This button does NOT exist in Open Source (CE), making it a definitive visual indicator of which edition is installed.",
    hint: "See 'Schedule New Update'? You're in EE. Don't see it? You're in CE.",
    topic: "Content Staging",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 11 — Adobe Commerce EE vs Open Source Key Differences"
  },
  {
    question: "Is Advanced Reporting an EE-exclusive feature?",
    answer: "No, Advanced Reporting (Reports > Business Intelligence > Advanced Reporting) is available in BOTH CE and EE. The module-analytics has OSL-3.0 license. It requires an active data sync to Adobe's reporting service. Both editions also have basic sales/product/customer reports.",
    hint: "Advanced Reporting = both editions. Don't mark it as EE-only on the exam.",
    topic: "Reporting",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 11 — Adobe Commerce EE vs Open Source Key Differences"
  },
  {
    question: "How are URL keys generated in Adobe Commerce, and what separator character is used?",
    answer: "URL keys are auto-generated from the product name when saved. Spaces become hyphens, characters are lowercased, and special characters are stripped. For example, 'Men's Running Shoe - Size 10' becomes 'mens-running-shoe-size-10'. Hyphens are used as separators, NOT underscores. URL keys must be unique per store view.",
    hint: "Product name → lowercase + hyphens + no special chars. Always hyphens, never underscores.",
    topic: "URL Structure",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 13 — SEO Fundamentals in Adobe Commerce"
  },
  {
    question: "What is the default URL suffix in Adobe Commerce, and why is removing it after launch risky?",
    answer: "The default URL suffix is .html for both products and categories (configured separately). Removing it after launch changes every existing URL, breaking bookmarks, backlinks, and search engine indexes unless 301 redirects are in place. It's one of the most dangerous post-launch changes — requires comprehensive redirect management.",
    hint: ".html is the default. Removing it post-launch = every URL breaks without redirects.",
    topic: "URL Suffix",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 13 — SEO Fundamentals in Adobe Commerce"
  },
  {
    question: "What happens when 'Use Categories Path for Product URLs' is enabled and a product belongs to multiple categories?",
    answer: "Each category the product is assigned to generates its own URL (e.g., /men/footwear/shoe.html, /sale/shoe.html, /new-arrivals/shoe.html). All URLs serve the same product page, creating a duplicate content issue. The canonical URL mechanism is the primary mitigation for this problem.",
    hint: "More categories = more URLs = more duplicate content risk. Canonical tags are the fix.",
    topic: "Category Path URLs",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 13 — SEO Fundamentals in Adobe Commerce"
  },
  {
    question: "What are canonical URLs, and must they be enabled separately for products and categories?",
    answer: "Canonical URLs (<link rel='canonical' href='...'>) tell search engines which version of a URL is authoritative, preventing duplicate content penalties. In Adobe Commerce, they must be enabled separately for products AND categories under Stores > Config > Catalog > SEO. The canonical for a product with category paths typically points to the direct URL without the category path.",
    hint: "Two toggles — one for products, one for categories. They don't turn on together.",
    topic: "Canonical URLs",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 13 — SEO Fundamentals in Adobe Commerce"
  },
  {
    question: "Where is the XML sitemap generated in Adobe Commerce Admin, and what content types does it include?",
    answer: "The sitemap is generated at Marketing > SEO & Search > Site Map. It includes products, categories, and CMS pages — each independently configurable for frequency (daily/weekly/monthly) and priority (0.0-1.0). It can also include product images. Automatic regeneration is available via the sitemap_generate cron job.",
    hint: "Marketing > SEO & Search > Site Map. Three content types, each with their own frequency/priority.",
    topic: "XML Sitemap",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 13 — SEO Fundamentals in Adobe Commerce"
  },
  {
    question: "What triggers automatic URL rewrite creation when a product URL key changes?",
    answer: "A 301 permanent redirect from the old URL to the new URL is automatically created ONLY if the 'Create Permanent Redirect for old URL Key' checkbox is enabled on the product edit page (Search Engine Optimization section). Rewrites are stored in the url_rewrite table and managed at Marketing > SEO & Search > URL Rewrites.",
    hint: "There's a checkbox — if it's unchecked, no redirect, and the old URL just 404s.",
    topic: "URL Rewrites",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 13 — SEO Fundamentals in Adobe Commerce"
  },
  {
    question: "What is the difference between a 301 and 302 redirect in terms of SEO?",
    answer: "A 301 redirect is permanent and passes link equity (SEO value) from the old URL to the new URL — search engines transfer ranking signals. A 302 redirect is temporary and does NOT pass link equity — search engines keep indexing the original URL. Use 301 for permanent URL changes and 302 for temporary campaigns.",
    hint: "301 = permanent, passes SEO juice. 302 = temporary, keeps the old URL's ranking.",
    topic: "URL Redirects",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 13 — SEO Fundamentals in Adobe Commerce"
  },
  {
    question: "Does Adobe Commerce natively generate hreflang tags for multilingual stores?",
    answer: "No, Adobe Commerce does NOT natively generate hreflang tags in a robust, automatic way. Implementation requires third-party extensions (e.g., Amasty, Mageplaza), custom theme/module development, or sitemap-based hreflang configuration. The x-default value is used for the fallback language version, and hreflang tags must be reciprocal.",
    hint: "Need hreflang? You'll need an extension or custom code — Magento doesn't do it out of the box.",
    topic: "Hreflang",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 13 — SEO Fundamentals in Adobe Commerce"
  },
  {
    question: "What structured data format does Adobe Commerce natively output for products — JSON-LD or microdata?",
    answer: "Adobe Commerce outputs basic microdata (HTML attributes) natively — specifically aggregateRating (from review module) and image itemprop. It does NOT output JSON-LD Product schema natively. For complete Product schema with offers, availability, and reviews, most stores require third-party extensions or custom modules.",
    hint: "Native = basic microdata only. Full JSON-LD schema needs an extension.",
    topic: "Structured Data",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 13 — SEO Fundamentals in Adobe Commerce"
  },
  {
    question: "Where is robots.txt managed in Adobe Commerce Admin, and at what scope does it operate?",
    answer: "Robots.txt is managed at Content > Design > Configuration > [select scope] > Search Engine Robots. It operates at website scope (not store view), meaning a single robots.txt configuration applies to all store views within a website. The Sitemap directive is NOT included by default — it can be auto-added via XML Sitemap settings.",
    hint: "Content > Design > Configuration. Website scope, not store view. Sitemap line must be added.",
    topic: "Robots.txt",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 13 — SEO Fundamentals in Adobe Commerce"
  },
  {
    question: "Does Adobe Commerce automatically collapse redirect chains when URL keys change multiple times?",
    answer: "No, Adobe Commerce does NOT automatically collapse redirect chains. Each URL key change creates a new rewrite, so chains can accumulate (v1 → v2 → v3). Each hop wastes crawl budget and dilutes link equity. Periodic cleanup of the url_rewrite table is a necessary maintenance task.",
    hint: "Chains grow with each rename. You need to manually fix old redirects to point directly to the final URL.",
    topic: "URL Rewrite Chains",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 13 — SEO Fundamentals in Adobe Commerce"
  },
  {
    question: "What is the meta tag auto-generation mask feature, and what variables are available?",
    answer: "Under Stores > Config > Catalog > Catalog > Product Fields Auto-Generation, you can define templates for auto-generating meta tags using variables: {{name}} (product name), {{sku}} (product SKU), and {{description}} (product description). There is NO {{store_name}} variable — store name appending must be configured separately via Page Title Separator and Default Title settings.",
    hint: "Three variables: name, sku, description. No store_name — that's a common gotcha.",
    topic: "Meta Tags",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 13 — SEO Fundamentals in Adobe Commerce"
  },
  {
    question: "What is the purpose of the robots.txt 'Disallow: /*?' directive in Adobe Commerce's default configuration?",
    answer: "The 'Disallow: /*?' directive blocks all URLs containing query strings from being crawled. This prevents search engines from indexing filtered/sorted category pages (e.g., ?color=red&price=50-100), which would create massive duplicate content issues. It's included in the default robots.txt configuration.",
    hint: "Query strings = filtered pages = duplicate content. Block them all with /*?",
    topic: "Robots.txt",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 13 — SEO Fundamentals in Adobe Commerce"
  },
  {
    question: "Are URL keys globally unique across all store views, or scoped per store view?",
    answer: "URL keys are scoped to the store view. The same product can have different URL keys in different store views (important for multilingual stores). A URL key must be unique WITHIN a store view but can be repeated across different store views.",
    hint: "Same product, different store views, different URL keys — perfect for translations.",
    topic: "URL Key Scope",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 13 — SEO Fundamentals in Adobe Commerce"
  },
  {
    question: "What is the difference between 'By Percentage of the Original Price' and 'To Percentage of the Original Price' in Catalog Price Rules?",
    answer: "'By Percentage' subtracts that percentage from the price (20% off $100 = $80). 'To Percentage' sets the price to that percentage of the original (75% of $100 = $75). This is a common exam trap.",
    hint: "'By' means discount by that amount; 'To' means set the price to that fraction.",
    topic: "Promotions",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 2 — Pricing, Promotions & Catalog Price Rules"
  },
  {
    question: "Do Catalog Price Rules require reindexing to take effect?",
    answer: "Yes. Catalog Price Rules are index-based and require reindexing (catalogrule_rule and catalogrule_product indexers) or clicking 'Apply Rules' in admin. Cart Price Rules, by contrast, are evaluated at runtime and do NOT require reindexing.",
    hint: "One is pre-computed and stored; the other is calculated on the fly.",
    topic: "Promotions",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 2 — Pricing, Promotions & Catalog Price Rules"
  },
  {
    question: "What happens when a higher-priority Cart Price Rule has 'Stop Further Rules Processing' enabled and a customer enters a valid coupon for a lower-priority rule?",
    answer: "The customer's coupon will NOT apply. 'Stop Further Rules Processing' on a higher-priority rule blocks ALL lower-priority cart rules, including coupon-based ones. The coupon may show as 'not valid or not applicable.'",
    hint: "Priority takes precedence over coupon validity — it is a hard stop.",
    topic: "Promotions",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 2 — Pricing, Promotions & Catalog Price Rules"
  },
  {
    question: "In a Cart Price Rule with 'Buy X Get Y Free' action, what does the 'Discount Amount' field represent?",
    answer: "The Discount Amount field represents Y — the number of free items the customer receives, not a dollar amount or percentage. The cheapest qualifying items in the cart are made free.",
    hint: "It is a quantity of free items, not a monetary value.",
    topic: "Promotions",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 2 — Pricing, Promotions & Catalog Price Rules"
  },
  {
    question: "Does Special Price always take precedence over Catalog Price Rules?",
    answer: "No. The system applies both and displays the lower of the two. If a Catalog Price Rule produces a price of $80 and the Special Price is $85, the Catalog Rule price of $80 wins. The lowest applicable price always prevails.",
    hint: "It is not about precedence hierarchy but about which number is actually smaller.",
    topic: "Pricing",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 2 — Pricing, Promotions & Catalog Price Rules"
  },
  {
    question: "Where is Group Price stored in Magento 2's database?",
    answer: "Group Price is stored in the same tier_price table as regular tier prices, as a tier price entry with qty = 1 for a specific customer group. There is no separate 'group_price' database table in Magento 2 (unlike Magento 1).",
    hint: "It is technically just a tier price at quantity one.",
    topic: "Pricing",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 2 — Pricing, Promotions & Catalog Price Rules"
  },
  {
    question: "What does 'lower priority number' mean for Catalog Price Rules?",
    answer: "A lower priority number means higher priority — the rule runs first. Priority 1 applies before Priority 10. Rules apply sequentially, and each rule operates on the already-discounted price from earlier rules, not the original price.",
    hint: "Think of it like first place: number 1 goes first.",
    topic: "Promotions",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 2 — Pricing, Promotions & Catalog Price Rules"
  },
  {
    question: "What is the key difference between Catalog Price Rule conditions and Cart Price Rule conditions?",
    answer: "Catalog Price Rule conditions can only match product attributes and categories. Cart Price Rule conditions have access to richer data including cart subtotal, total qty, shipping method, payment method, address fields, and product attributes.",
    hint: "Catalog rules know about products; cart rules know about the entire shopping session.",
    topic: "Promotions",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 2 — Pricing, Promotions & Catalog Price Rules"
  },
  {
    question: "When MAP (Minimum Advertised Price) is enabled and a product has an MSRP set, what appears on catalog/category pages?",
    answer: "The 'Add to Cart' button is shown instead of the price on catalog pages. The actual selling price is only revealed based on the 'Display Actual Price' setting (On Gesture, In Cart, or Before Order Confirmation). Discounts still apply to the actual price — MAP only controls display.",
    hint: "MAP hides the price from public view but does not change the actual selling price.",
    topic: "Pricing",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 2 — Pricing, Promotions & Catalog Price Rules"
  },
  {
    question: "What happens to a Special Price when no From/To dates are set?",
    answer: "A Special Price with no dates is always active — it applies immediately and indefinitely. The From Date blank means active now; the To Date blank means it never expires. Time zone evaluation uses the store's configured time zone.",
    hint: "Blank dates mean no time restriction at all.",
    topic: "Pricing",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 2 — Pricing, Promotions & Catalog Price Rules"
  },
  {
    question: "How do multiple Catalog Price Rules stack when applied sequentially?",
    answer: "Each rule operates on the already-discounted price from the previous rule, not the original price. For example, Rule A (10% off $100 = $90) then Rule B ($5 off $90 = $85). The 'To Fixed Amount' action uses min(amount, current price) — it can only lower, never raise.",
    hint: "Each rule sees the result of the prior rule as its starting point.",
    topic: "Promotions",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 2 — Pricing, Promotions & Catalog Price Rules"
  },
  {
    question: "Can coupon codes be used with Catalog Price Rules?",
    answer: "No. Coupon codes are only available in Cart Price Rules. Catalog Price Rules apply automatically to all qualifying products based on conditions — they have no coupon code mechanism. Cart Price Rules support No Coupon (auto-applied), Specific Coupon, or Auto Generated codes.",
    hint: "Catalog rules affect displayed prices before add-to-cart; coupons are a cart-level concept.",
    topic: "Promotions",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 2 — Pricing, Promotions & Catalog Price Rules"
  },
  {
    question: "What are the three options for the Free Shipping field in a Cart Price Rule?",
    answer: "No (no free shipping), For matching items only (only items matching the conditions get free shipping), and For shipment with matching items (entire shipment is free if any item matches the conditions).",
    hint: "The scope ranges from none, to per-item, to the entire shipment.",
    topic: "Promotions",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 2 — Pricing, Promotions & Catalog Price Rules"
  },
  {
    question: "Which three attribute input types can be used as configurable product axes in Magento 2?",
    answer: "Dropdown, Visual Swatch, and Text Swatch. These are the only input types that support configurable product variations. Text fields, multiselect, and other types cannot be used.",
    hint: "Think about the types that allow single-value selection and can be rendered visually on the PDP.",
    topic: "Product Types",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 1 — Product Types & Catalog Management"
  },
  {
    question: "Where is inventory tracked for a Configurable product in Magento 2?",
    answer: "Inventory is tracked exclusively on the child Simple products. The parent Configurable product's qty field is ignored — setting qty on the parent has no effect on stock availability.",
    hint: "The parent is essentially a shell; the real sellable items are its children.",
    topic: "Inventory Management",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 1 — Product Types & Catalog Management"
  },
  {
    question: "What happens when a customer adds items from a Grouped product to the cart?",
    answer: "Each associated Simple product is added as a separate line item in the cart. There is no single grouped line item — the customer pays for each product at its own price independently.",
    hint: "Unlike Bundle products, Grouped products do not create a single combined cart entry.",
    topic: "Product Types",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 1 — Product Types & Catalog Management"
  },
  {
    question: "What is the difference between Dynamic Pricing and Fixed Pricing on a Bundle product?",
    answer: "Dynamic Pricing calculates the final price as the sum of selected component prices (bundle base = $0). Fixed Pricing uses a manually set base price plus optional selection adjustments (fixed $ or % of base). These are independent of the Dynamic/Fixed SKU setting.",
    hint: "One derives from children, the other starts with its own base price.",
    topic: "Bundle Products",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 1 — Product Types & Catalog Management"
  },
  {
    question: "What does Max Downloads = 0 mean for a Downloadable product in Magento 2?",
    answer: "Max Downloads = 0 means unlimited downloads, not zero downloads. The customer can download the file as many times as they want. Setting it to 1 would limit them to a single download.",
    hint: "Zero is the 'no limit' value, which is counterintuitive.",
    topic: "Product Types",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 1 — Product Types & Catalog Management"
  },
  {
    question: "What scope must a product attribute have to be used as a configurable product axis?",
    answer: "The attribute must have Global scope. Website-scoped and Store View-scoped attributes cannot be used as configurable axes, even if they have the correct input type (Dropdown/Swatch).",
    hint: "Configurable variations must be consistent across the entire installation.",
    topic: "Attributes",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 1 — Product Types & Catalog Management"
  },
  {
    question: "What happens to checkout when a cart contains only Virtual products?",
    answer: "The shipping step is completely skipped during checkout. If even one physical product is added to the cart, the shipping step displays normally for the entire order.",
    hint: "No physical goods means no shipping address or method is needed.",
    topic: "Product Types",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 1 — Product Types & Catalog Management"
  },
  {
    question: "Can a Simple product be a child of multiple Configurable products simultaneously?",
    answer: "Yes. A Simple product can be associated as a child of multiple Configurable products and can also be sold standalone. Child simples are typically set to 'Not Visible Individually' to avoid duplicate catalog listings.",
    hint: "Visibility settings control whether the child appears independently in search and catalog.",
    topic: "Product Types",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 1 — Product Types & Catalog Management"
  },
  {
    question: "What happens if you change a product's Attribute Set after creation?",
    answer: "Changing a product's Attribute Set is allowed, but it will remove attribute values that are not present in the new set. This is a destructive operation that can cause data loss for non-matching attributes.",
    hint: "Attributes exclusive to the old set lose their stored values permanently.",
    topic: "Attributes",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 1 — Product Types & Catalog Management"
  },
  {
    question: "What is the default price scope for the Price attribute in Magento 2?",
    answer: "The Price attribute has Website scope by default, meaning each website can have different product prices. SKU, by contrast, is Global scope. Price scope can be changed to Global in Catalog configuration.",
    hint: "This allows multi-currency or region-based pricing across different websites.",
    topic: "Attributes",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 1 — Product Types & Catalog Management"
  },
  {
    question: "How does Customizable Options differ from Configurable product variations?",
    answer: "Customizable Options (e.g., engraving text, file uploads) add a price delta to the base product without creating new SKUs. Configurable product variations use separate child Simple products, each with its own distinct SKU and inventory.",
    hint: "One modifies the existing product; the other resolves to a different product entirely.",
    topic: "Product Types",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 1 — Product Types & Catalog Management"
  },
  {
    question: "What determines whether a Bundle product is in stock or out of stock?",
    answer: "A Bundle product is out of stock if any required component option has no in-stock selections available. Optional components being out of stock do not prevent the bundle from being purchased.",
    hint: "Required vs optional is the key distinction for bundle availability.",
    topic: "Bundle Products",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 1 — Product Types & Catalog Management"
  },
  {
    question: "Does a Grouped product have its own price field in the admin?",
    answer: "No. A Grouped product has no group-level price field — it is grayed out or absent in the admin form. Each associated Simple product retains its own individual price. There is no way to set a single group price.",
    hint: "If a merchant wants one combined price, they should use a Bundle with Fixed pricing instead.",
    topic: "Product Types",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 1 — Product Types & Catalog Management"
  },
  {
    question: "How is downloadable link access controlled in Magento 2?",
    answer: "Downloadable link access is controlled by download count (Max Downloads per link, 0 = unlimited) and order status (links become available when the order reaches the configured status, default: Invoiced). There is no time-based link expiry setting.",
    hint: "There are only two control mechanisms — count and order status — no calendar-based expiration.",
    topic: "Product Types",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 1 — Product Types & Catalog Management"
  },
  {
    question: "On a Bundle product with Dynamic Price = Yes, what happens to the Price field in the admin?",
    answer: "The Price field is disabled (grayed out) because the price is automatically calculated from the sum of selected component prices. You must set Dynamic Price = No (Fixed) to manually enter a base price on the bundle.",
    hint: "Dynamic pricing means the system calculates it — manual entry is blocked.",
    topic: "Bundle Products",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 1 — Product Types & Catalog Management"
  },
  {
    question: "What are the four biggest EE-only feature differentiators to memorize for the exam?",
    answer: "1) Content Staging & Preview (schedule future changes and preview them), 2) Customer Segments (dynamic rule-based customer grouping), 3) Visual Merchandiser (drag-and-drop category product sorting), 4) RMA/Returns (built-in return merchandise authorization workflow).",
    hint: "Staging, Segments, Visual Merch, RMA — the 'big four' of EE exclusivity.",
    topic: "CE vs EE Overview",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 14 — Practice Test #2 + Week 2 Review"
  },
  {
    question: "In Cloud infrastructure, what two separate purposes does Redis serve?",
    answer: "Redis is used for two separate purposes in Magento: 1) cache backend (storing full-page cache and other cache types), and 2) session storage (storing customer session data). These are typically configured as separate Redis instances or databases.",
    hint: "One Redis for cache, another for sessions — two jobs, often two instances.",
    topic: "Cloud Infrastructure",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 14 — Practice Test #2 + Week 2 Review"
  },
  {
    question: "How does the CMS router fit into Magento's routing order?",
    answer: "The CMS router (Magento\\Cms\\Controller\\Router) runs AFTER the Standard router and BEFORE the Default (404) router. Standard module routes always take precedence over CMS page url_key matches. If no standard route matches, the CMS router queries the database for matching url_key values.",
    hint: "Standard routes first, then CMS checks, then 404. CMS never overrides a module route.",
    topic: "CMS Routing",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 14 — Practice Test #2 + Week 2 Review"
  },
  {
    question: "What are the three CMS directive syntaxes for including content, and how do they differ?",
    answer: "1) {{block id=\"identifier\"}} — includes a static CMS block by its identifier. 2) {{widget type=\"ClassName\" param=\"value\"}} — renders a widget instance with configurable parameters. 3) {{media url=\"wysiwyg/image.jpg\"}} — generates a URL relative to the media base URL for WYSIWYG-uploaded images. Other directives include {{var}}, {{store url}}, and {{trans}}.",
    hint: "block = static content, widget = dynamic PHP class, media = image URLs.",
    topic: "CMS Directives",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 14 — Practice Test #2 + Week 2 Review"
  },
  {
    question: "What are the seven product types in Magento, and which one is EE-only?",
    answer: "The seven product types are: Simple, Configurable, Grouped, Bundle, Virtual, Downloadable (all available in both CE and EE), and Gift Card (EE-only, with Virtual/Physical/Combined subtypes). Gift Card is the ONLY product type exclusive to Adobe Commerce.",
    hint: "Six types for everyone, one (Gift Card) only for EE. Six + one = seven.",
    topic: "Product Types",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 14 — Practice Test #2 + Week 2 Review"
  },
  {
    question: "What is the EAV model, and what are the five value tables for catalog products?",
    answer: "EAV (Entity-Attribute-Value) stores product attributes across separate tables by data type rather than as columns on one table. The five value tables are: catalog_product_entity_varchar (name, meta_title), catalog_product_entity_int (status, visibility), catalog_product_entity_decimal (price, weight), catalog_product_entity_text (description), and catalog_product_entity_datetime (special dates).",
    hint: "Five types: varchar, int, decimal, text, datetime — one table per data type.",
    topic: "EAV Model",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 14 — Practice Test #2 + Week 2 Review"
  },
  {
    question: "What happens to attribute values when you change a product's attribute set?",
    answer: "Changing a product's attribute set removes data for attributes that exist in the old set but NOT in the new set. Attributes that are shared between both sets retain their values. This is a destructive operation — data is lost for non-shared attributes.",
    hint: "Shared attributes keep data. Non-shared attributes lose data. Not reversible.",
    topic: "Attribute Sets",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 14 — Practice Test #2 + Week 2 Review"
  },
  {
    question: "What is category ID 1 in Magento, and what is its role versus category ID 2?",
    answer: "Category ID 1 is the hidden system root — the true root of the entire category tree, never displayed to customers. Category ID 2 is the default store root category — its children form the navigation menu. Each store view can have a different root category assigned, but all sit under ID 1.",
    hint: "ID 1 = invisible master root. ID 2 = the actual store root whose children you see in nav.",
    topic: "Category Architecture",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 14 — Practice Test #2 + Week 2 Review"
  },
  {
    question: "Why does EE use 'row_id' instead of 'entity_id' as the primary key in catalog_product_entity?",
    answer: "In EE, catalog_product_entity uses row_id as the primary key (instead of entity_id) to support Content Staging. Each scheduled update creates a new row with the same entity_id but a different row_id, allowing multiple versions of the same product to exist simultaneously. In CE, row_id = entity_id (they're the same).",
    hint: "row_id enables version history for Staging — same product, multiple scheduled versions.",
    topic: "EE Database Schema",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 14 — Practice Test #2 + Week 2 Review"
  },
  {
    question: "On Adobe Commerce Cloud, how is application deployment triggered, and which tools manage it?",
    answer: "On Commerce Cloud, deployment is triggered by 'git push' which initiates an automated build/deploy pipeline. The ece-tools package manages build and deploy hooks (running setup:upgrade, di:compile, static-content:deploy automatically). The magento-cloud CLI manages environments. You do NOT manually run bin/magento commands after deployment.",
    hint: "git push = deploy. ece-tools = automation. No manual setup:upgrade on Cloud.",
    topic: "Cloud Deployment",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 14 — Practice Test #2 + Week 2 Review"
  },
  {
    question: "What is the Product Visibility setting 'Not Visible Individually' used for?",
    answer: "Visibility value 1 ('Not Visible Individually') means the product doesn't appear in catalog listings or search results. It's typically used for simple products that serve as children of configurable products — they shouldn't show up as standalone items since customers interact with them through the parent configurable product.",
    hint: "Hide child simple products — they exist only as options of their configurable parent.",
    topic: "Product Visibility",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 14 — Practice Test #2 + Week 2 Review"
  },
  {
    question: "What is the key difference between how Varnish and Fastly are used across deployment models?",
    answer: "Fastly CDN is natively integrated into Adobe Commerce Cloud (both Pro and Starter) — it handles FPC, DDoS protection, WAF, and image optimization. Varnish is the FPC option for on-premises deployments, where the merchant must configure and manage it themselves. Both are available in CE and EE, but Fastly is Cloud-specific while Varnish is self-managed.",
    hint: "Cloud = Fastly (managed for you). On-prem = Varnish (you manage it).",
    topic: "Caching Infrastructure",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 14 — Practice Test #2 + Week 2 Review"
  },
  {
    question: "When the exam asks about 'grouping customers dynamically,' which feature is the answer, and when it asks about 'tiered pricing by customer type'?",
    answer: "Dynamic customer grouping = Customer Segments (EE-only) — automatic, condition-based grouping that evaluates in real-time based on order history, cart contents, demographics, etc. Tiered pricing by customer type = Customer Groups (both CE and EE) — static assignment that drives tax class and group-specific product pricing.",
    hint: "Dynamic targeting = Segments (EE). Pricing tiers = Groups (both). Know which word maps to which.",
    topic: "Exam Strategy",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 14 — Practice Test #2 + Week 2 Review"
  },
  {
    question: "What is the Free Shipping minimum order amount trap that commonly appears on exams?",
    answer: "The trap is that the minimum order amount is checked AFTER discounts are applied. Exam question: 'A customer has a $65 cart and applies a $20 coupon. Free Shipping minimum is $50. What happens?' Answer: Free Shipping is NOT available because $65 - $20 = $45, which is below the $50 minimum. Only paid shipping methods are shown.",
    hint: "Always subtract the coupon before comparing to the threshold. Post-discount total is what matters.",
    topic: "Free Shipping Exam Trap",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 14 — Practice Test #2 + Week 2 Review"
  },
  {
    question: "What is the difference between a CMS Block's Title and its Identifier?",
    answer: "The Block Title is an admin-only label not rendered on the frontend. The Identifier is the machine-readable ID used when referencing the block in code, layout XML, or widget directives. The Identifier must be unique per store view scope.",
    hint: "One is for humans in the admin; the other is for the system to locate the block.",
    topic: "CMS Blocks",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 5 — Content Management: Pages, Blocks & Widgets"
  },
  {
    question: "What happens when you edit a CMS Block that is embedded in multiple pages?",
    answer: "The change is globally applied to every page, widget instance, and layout where that block is placed. This is the most common source of unintended frontend changes. Use separate blocks or store-view-specific blocks when content should differ per placement.",
    hint: "Shared blocks mean shared changes — there is no per-placement override.",
    topic: "CMS Blocks",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 5 — Content Management: Pages, Blocks & Widgets"
  },
  {
    question: "How do you create a custom email template in Magento 2?",
    answer: "You cannot edit system default templates directly. You must load a default template, save it as a new custom template (Marketing > Email Templates), then assign the custom template in the appropriate configuration section (e.g., Stores > Config > Sales > Sales Emails).",
    hint: "Clone first, customize second, assign third.",
    topic: "Email Templates",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 5 — Content Management: Pages, Blocks & Widgets"
  },
  {
    question: "What is the Full Width layout in CMS Pages designed for?",
    answer: "The Full Width layout (cms-full-width.xml) is specifically designed for Page Builder content types and renders content edge-to-edge. It is provided by the module-page-builder module and is available in both CE and EE since Magento 2.4.0.",
    hint: "It goes beyond the standard container width for visual content builders.",
    topic: "CMS Pages",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 5 — Content Management: Pages, Blocks & Widgets"
  },
  {
    question: "What is the scope of Layout Update XML entered in a CMS Page's Design tab?",
    answer: "Layout Update XML entered in the Design tab of a CMS Page is scoped only to that specific page. It does not affect the global layout or any other page in the system.",
    hint: "It is a per-page override, not a site-wide change.",
    topic: "CMS Pages",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 5 — Content Management: Pages, Blocks & Widgets"
  },
  {
    question: "Are Dynamic Blocks available in Magento Open Source?",
    answer: "No. Dynamic Blocks (formerly called Banners) require Adobe Commerce EE. They use Customer Segments for targeting, which is also an EE-only feature. Magento Open Source only has standard CMS Static Blocks that show the same content to all visitors.",
    hint: "Personalization based on customer segments is a premium feature.",
    topic: "Dynamic Blocks",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 5 — Content Management: Pages, Blocks & Widgets"
  },
  {
    question: "What is the difference between a Widget shortcode and a Widget Instance?",
    answer: "A Widget shortcode ({{widget type=\"...\" ...}}) is embedded directly in the content field of a CMS Page or Block. A Widget Instance is configured through Content > Widgets in admin and placed on layout handles/containers globally without editing page content.",
    hint: "One lives inside content; the other is configured separately and injected via layout.",
    topic: "Widgets",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 5 — Content Management: Pages, Blocks & Widgets"
  },
  {
    question: "Where are email header and footer wrapper templates configured in Magento 2?",
    answer: "Header and footer email wrappers are configured in Content > Design > Configuration (per-store design config grid, under Transactional Emails section), NOT in Stores > Configuration > General > Design. They are auto-included in every transactional email via the {{template config_path=\"...\"}} directive.",
    hint: "Look under Content > Design, not Stores > Configuration.",
    topic: "Email Templates",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 5 — Content Management: Pages, Blocks & Widgets"
  },
  {
    question: "What identifier does the {{widget}} shortcode use versus layout XML when referencing a CMS Block?",
    answer: "The {{widget}} shortcode uses the numeric database ID (block_id) of the CMS Block. Layout XML uses the string Identifier. This is an important distinction when embedding blocks through different methods.",
    hint: "Numeric ID for shortcodes; string identifier for XML.",
    topic: "CMS Blocks",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 5 — Content Management: Pages, Blocks & Widgets"
  },
  {
    question: "Is Page Builder available in Magento Open Source?",
    answer: "Yes. Page Builder has been available in both Magento Open Source (CE) and Adobe Commerce (EE) since version 2.4.0. It is enabled at Stores > Config > General > Content Management > Advanced Content Tools. It replaced the basic WYSIWYG editor for CMS content editing.",
    hint: "It was originally EE-only but was included in Open Source starting with 2.4.",
    topic: "Page Builder",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 5 — Content Management: Pages, Blocks & Widgets"
  },
  {
    question: "Under which Page Builder content type category do Banner and Slider belong?",
    answer: "Banner and Slider are Media content types. The Page Builder categories are: Layout (Row, Column, Tab), Elements (Text, Heading, Buttons, Divider, HTML Code), Media (Image, Video, Banner, Slider, Map), and Add Content (Block, Dynamic Block, Products).",
    hint: "They display visual media, not layout structure or text elements.",
    topic: "Page Builder",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 5 — Content Management: Pages, Blocks & Widgets"
  },
  {
    question: "How does the URL Key field work for CMS Pages?",
    answer: "The URL Key generates the page URL (e.g., 'about-us' becomes /about-us). It does not include a leading slash — Magento handles the base URL prefix automatically. If left blank, the URL key is auto-generated from the page title. URL rewrites handle redirects when the key changes.",
    hint: "No slash prefix; Magento builds the full URL path for you.",
    topic: "CMS Pages",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 5 — Content Management: Pages, Blocks & Widgets"
  },
  {
    question: "What directives are available in Magento email templates?",
    answer: "Email templates support {{var order.field}} for variables, {{store url=\"path\"}} for store URLs, {{if condition}}...{{/if}} for conditionals, {{trans \"text\"}} for translation, and {{template config_path=\"...\"}} for including header/footer wrappers.",
    hint: "Double curly braces with keywords like var, store, if, trans, and template.",
    topic: "Email Templates",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 5 — Content Management: Pages, Blocks & Widgets"
  },
  {
    question: "What is the difference between cache:clean and cache:flush in Magento 2?",
    answer: "cache:clean removes only Magento-managed cache entries by tag, leaving other applications' cache data intact. cache:flush wipes the entire cache storage backend, which can affect other applications sharing the same Redis or Memcached instance. cache:clean is safer for production.",
    hint: "One is surgical; the other is a complete wipe of the storage layer.",
    topic: "Cache Management",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 4 — Store Maintenance & Admin Tools"
  },
  {
    question: "What are the two indexer modes in Magento 2, and which is recommended for production?",
    answer: "Update on Save (realtime) reindexes immediately when an entity is saved — suitable for development. Update by Schedule uses mview changelog tables processed by cron — recommended for production and large catalogs because it batches changes efficiently.",
    hint: "Real-time is instant but costly; scheduled is batched and cron-driven.",
    topic: "Indexers",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 4 — Store Maintenance & Admin Tools"
  },
  {
    question: "Where is the maintenance mode flag stored in Magento 2?",
    answer: "Maintenance mode creates a flag file at var/.maintenance.flag. IP whitelisting is stored in var/.maintenance.ip. These are filesystem files, not database settings or env.php entries.",
    hint: "Look in the var/ directory for dot-prefixed files.",
    topic: "Maintenance Mode",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 4 — Store Maintenance & Admin Tools"
  },
  {
    question: "How should you fix stale report data in Magento 2?",
    answer: "Use Reports > Refresh Statistics in the admin to refresh aggregated report data. This is NOT fixed by clearing cache or reindexing — reports use their own aggregated tables (like sales_order_aggregated_created) that must be refreshed separately.",
    hint: "Reports have their own refresh mechanism independent of cache and indexers.",
    topic: "Reports",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 4 — Store Maintenance & Admin Tools"
  },
  {
    question: "What are the unique identifiers used for matching during Import in Magento 2?",
    answer: "Products are matched by SKU and Customers are matched by email address. These are the unique keys used to determine whether to add, update, replace, or delete records during CSV import operations.",
    hint: "Each entity type has one specific field that identifies existing records.",
    topic: "Import/Export",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 4 — Store Maintenance & Admin Tools"
  },
  {
    question: "What are the three URL redirect types available for URL Rewrites in Magento 2?",
    answer: "301 Permanent (passes link equity, tells search engines to update index), 302 Temporary (no link equity transfer, search engines keep old URL), and No redirect (internal forward where the browser URL does not change, no HTTP redirect sent).",
    hint: "Two are HTTP redirects with different SEO implications; one is an invisible server-side forward.",
    topic: "URL Rewrites",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 4 — Store Maintenance & Admin Tools"
  },
  {
    question: "Is the Admin backup tool recommended for production backups in Magento 2?",
    answer: "No. The built-in backup tool (System > Tools > Backups) has been deprecated since Magento 2.3. Adobe recommends using external backup solutions such as mysqldump, cloud provider snapshots, or Percona XtraBackup for production environments.",
    hint: "The feature still exists in the admin but is officially deprecated.",
    topic: "Backup",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 4 — Store Maintenance & Admin Tools"
  },
  {
    question: "What happens if cron is not running in Magento 2?",
    answer: "Without cron, scheduled catalog price rules will not apply, order/transactional emails may not send, indexers in schedule mode will not update, sitemaps will not regenerate, and newsletter queues will not process. Many critical functions depend on cron.",
    hint: "Cron is the heartbeat of Magento's automated processes.",
    topic: "Cron",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 4 — Store Maintenance & Admin Tools"
  },
  {
    question: "Is the Admin Action Log feature available in Magento Open Source?",
    answer: "No. Admin Action Logs (System > Action Logs) is an Enterprise Edition (Adobe Commerce) only feature provided by the Magento_Logging module. Magento Open Source only has var/log/ files for system logging, with no admin activity audit trail.",
    hint: "It tracks who changed what, when, and from which IP — but only in the paid edition.",
    topic: "Admin Tools",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 4 — Store Maintenance & Admin Tools"
  },
  {
    question: "What are the three Import behaviors available in Magento 2?",
    answer: "Add/Update (inserts new records and updates existing ones matched by SKU or email), Replace (completely replaces the matched record), and Delete (removes matched records). You should always run 'Check Data' validation before importing.",
    hint: "Think of it as insert/update, overwrite, or remove.",
    topic: "Import/Export",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 4 — Store Maintenance & Admin Tools"
  },
  {
    question: "Does setup:upgrade automatically enable maintenance mode in Magento 2?",
    answer: "No. In Magento 2.4.8-p3, setup:upgrade does NOT auto-enable maintenance mode (only setup:install does). Best practice is to manually run bin/magento maintenance:enable before setup:upgrade on production to prevent customers from seeing errors during the upgrade.",
    hint: "Install toggles it automatically; upgrade requires manual action.",
    topic: "Maintenance Mode",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 4 — Store Maintenance & Admin Tools"
  },
  {
    question: "What are the main admin navigation sections in Magento 2?",
    answer: "There are 9 primary sections: Dashboard, Catalog, Sales, Customers, Marketing, Content, Reports, Stores, and System. Each section contains sub-menus for specific functions like Products (Catalog), Orders (Sales), and Cache Management (System).",
    hint: "Nine top-level menu items organize all admin functionality.",
    topic: "Admin Tools",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 4 — Store Maintenance & Admin Tools"
  },
  {
    question: "Which three indexer status values exist in Magento 2?",
    answer: "Ready (index is up to date), Processing (reindex is currently running), and Reindex Required (data is stale and needs reindexing). A status of 'Reindex Required' means the storefront may be showing outdated prices, stock, or search results.",
    hint: "Green, yellow, red — current, in-progress, or stale.",
    topic: "Indexers",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 4 — Store Maintenance & Admin Tools"
  },
  {
    question: "What is a Quote in Magento 2 and when does it become an Order?",
    answer: "The shopping cart is technically a Quote object in the database. It only becomes an Order after the customer successfully completes checkout and clicks Place Order. At that point, the Quote is converted to a sales_order record and marked inactive.",
    hint: "The database entity behind the cart has a different name than what customers see.",
    topic: "Order Lifecycle",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 3 — Customer Journey & Order Lifecycle"
  },
  {
    question: "What two conditions must both be met for an order to reach the 'Complete' state?",
    answer: "The order must be fully invoiced AND fully shipped. Both actions are required — a partial shipment or partial invoice alone will not move the order to Complete. It remains in Processing until both are fully done.",
    hint: "Payment captured plus goods dispatched — both must cover all items.",
    topic: "Order Lifecycle",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 3 — Customer Journey & Order Lifecycle"
  },
  {
    question: "What is the difference between the 'Closed' and 'Canceled' order states?",
    answer: "Closed means a credit memo (refund) was issued against the order. Canceled means the order was voided before fulfillment. Canceled is irreversible — you cannot un-cancel an order. To handle a completed order, you must use a Credit Memo, not cancellation.",
    hint: "One involves money going back; the other means the order never proceeded.",
    topic: "Order Lifecycle",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 3 — Customer Journey & Order Lifecycle"
  },
  {
    question: "Can a shipment be created before an invoice in Magento 2?",
    answer: "Yes. Shipments can be created independently of invoices — there is no code requiring an invoice before shipping. The canShip() method checks item quantities, hold status, and virtual status, but NOT invoice existence.",
    hint: "Invoicing and shipping are parallel workflows, not sequential dependencies.",
    topic: "Order Lifecycle",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 3 — Customer Journey & Order Lifecycle"
  },
  {
    question: "What prerequisite must exist before a Credit Memo can be created?",
    answer: "The order must be invoiced (payment captured) before a credit memo can be created. You cannot create a credit memo on an uninvoiced order because canCreditmemo() checks getTotalPaid(). The credit memo changes the order state to Closed.",
    hint: "You cannot refund money that was never captured.",
    topic: "Order Lifecycle",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 3 — Customer Journey & Order Lifecycle"
  },
  {
    question: "What is the difference between Order State and Order Status in Magento 2?",
    answer: "State is a system-level, hard-coded code that drives business logic (e.g., 'new', 'processing', 'complete'). Status is an admin-customizable display label mapped to a State. Multiple statuses can map to one state. You can create new statuses but cannot create new states.",
    hint: "One is fixed in code; the other is a configurable label.",
    topic: "Order Lifecycle",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 3 — Customer Journey & Order Lifecycle"
  },
  {
    question: "What does the 'Return to Stock' checkbox do on a Credit Memo, and is it automatic?",
    answer: "The 'Return to Stock' checkbox adds refunded item quantities back to inventory. It is NOT automatic — it must be manually checked by the admin. If left unchecked, the inventory quantity is not restored even though the refund is processed.",
    hint: "Refunding money and restoring stock are two separate actions.",
    topic: "Order Lifecycle",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 3 — Customer Journey & Order Lifecycle"
  },
  {
    question: "At which scope level are customer accounts managed in Magento 2?",
    answer: "Customer accounts are scoped to the Website level. A customer who registers on Website A cannot log in to Website B unless account sharing is specifically configured. This also means base currency and pricing are Website-scoped.",
    hint: "The second level in the Global > Website > Store > Store View hierarchy.",
    topic: "Store Scope",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 3 — Customer Journey & Order Lifecycle"
  },
  {
    question: "What happens when a guest completes checkout and later registers with the same email?",
    answer: "Magento will link the historical guest orders to the newly created account. The guest order can be associated with the account, making it visible in the customer's My Account > My Orders section.",
    hint: "Email address is the linking key between guest orders and accounts.",
    topic: "Customer Journey",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 3 — Customer Journey & Order Lifecycle"
  },
  {
    question: "What does the Reorder function do in Magento 2?",
    answer: "The Reorder function adds the same items from a previous order back to the shopping cart. It does NOT re-place the order. Stock availability and current prices are re-evaluated at the time of reorder, so quantities or prices may differ from the original.",
    hint: "It is a cart population shortcut, not an order duplication.",
    topic: "Customer Journey",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 3 — Customer Journey & Order Lifecycle"
  },
  {
    question: "When do downloadable product links become available to the customer?",
    answer: "Download links are activated after the order is invoiced (payment captured), not just after order placement. They appear in My Account > My Downloadable Products. The order must reach the configured status (default: Invoiced) for links to become accessible.",
    hint: "Payment must be confirmed before digital goods are delivered.",
    topic: "Order Lifecycle",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 3 — Customer Journey & Order Lifecycle"
  },
  {
    question: "How many checkout steps does Magento 2 use, and what are they?",
    answer: "Magento 2 uses a two-step One-Page Checkout: Step 1 is Shipping (address and method selection), and Step 2 is Review & Payment (payment method and order placement). This replaced the six-step process from Magento 1.",
    hint: "It looks like one page but has two distinct stages.",
    topic: "Customer Journey",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 3 — Customer Journey & Order Lifecycle"
  },
  {
    question: "What are the three Invoice capture modes and when is each available?",
    answer: "Capture Online sends a real-time capture request to the payment gateway (only for online methods). Capture Offline records payment without contacting the gateway (for offline methods like Check/Money Order). Not Capture creates an invoice record but marks payment as pending.",
    hint: "Online methods talk to the gateway; offline methods just record locally.",
    topic: "Order Lifecycle",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 3 — Customer Journey & Order Lifecycle"
  },
  {
    question: "What is the difference between Adjustment Fee and Adjustment Refund on a Credit Memo?",
    answer: "Adjustment Fee is a deduction from the refund amount (like a restocking fee — reduces what the customer gets back). Adjustment Refund is an addition to the refund amount (increases what the customer gets back beyond the item cost).",
    hint: "Fee takes away from the refund; Refund adds to it.",
    topic: "Order Lifecycle",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 3 — Customer Journey & Order Lifecycle"
  },
  {
    question: "What is an Anchor category and what two things does it enable?",
    answer: "An Anchor category (Is Anchor = Yes in Display Settings) enables layered navigation filters on the category page AND causes the category to display products from all its child/subcategories. Non-anchor categories show no layered nav and only display their directly assigned products.",
    hint: "It pulls subcategory products up and adds filter sidebar panels.",
    topic: "Layered Navigation",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 6 — Layered Navigation, Search & Customers"
  },
  {
    question: "What is the difference between 'Filterable (with results)' and 'Filterable (no results)' for layered navigation?",
    answer: "'Filterable (with results)' only shows a filter option if at least one product matches — better UX. 'Filterable (no results)' shows all filter options even if zero products match that value, which provides consistency but can confuse shoppers.",
    hint: "One hides empty options; the other always shows everything.",
    topic: "Layered Navigation",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 6 — Layered Navigation, Search & Customers"
  },
  {
    question: "Which attribute input types can be used in layered navigation?",
    answer: "Only Dropdown, Multiple Select, Yes/No, and Price attribute types support layered navigation. Text Field, Text Area, Date, and Media Image types cannot be used in layered navigation filters.",
    hint: "It needs discrete, selectable values — not free-form text.",
    topic: "Layered Navigation",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 6 — Layered Navigation, Search & Customers"
  },
  {
    question: "What is the correct admin path for Search Synonyms in Magento 2?",
    answer: "Marketing > SEO & Search > Search Synonyms. A common exam distractor places it under Stores > Configuration > Catalog or Catalog > Search Terms, but those are incorrect. Synonyms are store-view scoped and support only two-way (grouped) synonyms in the admin.",
    hint: "It is under Marketing, not Catalog or Stores.",
    topic: "Search",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 6 — Layered Navigation, Search & Customers"
  },
  {
    question: "What is the significance of Customer Group 0 (NOT LOGGED IN) in Magento 2?",
    answer: "Group 0 — NOT LOGGED IN — is a real customer group that applies to all guest/unauthenticated visitors. It is used for guest pricing rules, tax class assignments for guests, and cart price rules targeting guests. It is not the absence of a group.",
    hint: "Guests are not ungrouped; they belong to a specific group with ID zero.",
    topic: "Customer Groups",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 6 — Layered Navigation, Search & Customers"
  },
  {
    question: "What is the difference between Search Suggestions and Search Recommendations in Magento 2?",
    answer: "Search Suggestions provide 'did you mean?' spelling corrections for misspelled queries. Search Recommendations show popular or related search terms based on search history. They are distinct features with separate enable/count controls in Catalog Search configuration.",
    hint: "One corrects typos; the other suggests trending terms.",
    topic: "Search",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 6 — Layered Navigation, Search & Customers"
  },
  {
    question: "Can a customer belong to more than one Customer Group at a time?",
    answer: "No. A customer can belong to only one customer group at a time. Changing a customer's group immediately affects their pricing, tax treatment, and which promotional rules apply to them. For more granular targeting, Adobe Commerce EE offers Customer Segments.",
    hint: "It is a one-to-one relationship, unlike segments which are many-to-many.",
    topic: "Customer Groups",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 6 — Layered Navigation, Search & Customers"
  },
  {
    question: "What search engine does Magento 2.4.6+ recommend, and what happened to MySQL search?",
    answer: "OpenSearch is the recommended search engine from Magento 2.4.6+. MySQL search was completely removed in Magento 2.4. Elasticsearch 7 is still supported but being phased out. An external search engine is now required.",
    hint: "The open-source fork of Elasticsearch became the preferred option.",
    topic: "Search",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 6 — Layered Navigation, Search & Customers"
  },
  {
    question: "Is Multiple Wishlists available in Magento Open Source?",
    answer: "No. Multiple Wishlists is an Adobe Commerce (EE) only feature that must be explicitly enabled in configuration. Magento Open Source supports exactly one wishlist per customer. In both editions, wishlists require a customer account — guests cannot use them.",
    hint: "CE gets one; EE can have many named lists per customer.",
    topic: "Wishlist",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 6 — Layered Navigation, Search & Customers"
  },
  {
    question: "What does enabling 'Need to Confirm' do for newsletter subscriptions?",
    answer: "It enables double opt-in — when a visitor subscribes, a confirmation email is sent and the subscription is not activated until they click the confirmation link. The subscriber status shows as 'Not Activated' until confirmed. This is important for GDPR compliance.",
    hint: "The subscriber must take an additional action after signing up.",
    topic: "Newsletter",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 6 — Layered Navigation, Search & Customers"
  },
  {
    question: "What three price range calculation modes are available for layered navigation?",
    answer: "Automatic (Equalize Product Counts) creates variable-width buckets with roughly equal products per bucket. Automatic (Equalize Price Ranges) creates equal-width buckets regardless of product distribution. Manual allows the admin to set a fixed step value (e.g., $100 increments).",
    hint: "Equal products per bucket, equal price width per bucket, or admin-defined fixed steps.",
    topic: "Layered Navigation",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 6 — Layered Navigation, Search & Customers"
  },
  {
    question: "Can popular search terms be redirected to a specific URL?",
    answer: "Yes. In Marketing > SEO & Search > Search Terms, admin can configure a search term with a redirect URL, sending customers who search for that term to a specific page. This is useful for promotions or directing searches to curated landing pages.",
    hint: "Search terms can be mapped to any destination, not just search results.",
    topic: "Search",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 6 — Layered Navigation, Search & Customers"
  },
  {
    question: "What are the four domain sections tested on the AD0-E712 exam and their approximate weights?",
    answer: "Magento Open Source Core Features (49%, ~25 questions), Digital Marketing & eCommerce Fundamentals (24%, ~12 questions), Adobe Commerce Basics (14%, ~7 questions), and Compliance/Security Basics (13%, ~6 questions). Core Features is by far the heaviest section.",
    hint: "Nearly half the exam focuses on one domain.",
    topic: "Exam Structure",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 7 — Practice Test #1 + Week 1 Review"
  },
  {
    question: "What is the passing score for the AD0-E712 exam?",
    answer: "The passing score is 68%, which means 34 correct answers out of 50 questions. The exam allows 110 minutes and costs $180 USD.",
    hint: "Just over two-thirds correct is the threshold.",
    topic: "Exam Structure",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 7 — Practice Test #1 + Week 1 Review"
  },
  {
    question: "Why can Dynamic Price bundle products NOT support special prices, tier prices, or catalog price rules?",
    answer: "Dynamic Price bundles derive their total from the sum of selected component prices — the bundle itself has no editable base price. Since special prices, tier prices, and catalog rules need to apply to a product's own price field, they only work on Fixed Price bundles which have a manually set base price.",
    hint: "No base price to discount means no place for these pricing features to attach.",
    topic: "Bundle Products",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 7 — Practice Test #1 + Week 1 Review"
  },
  {
    question: "Where do cross-sell products appear versus up-sell products in Magento 2?",
    answer: "Cross-sell products appear on the shopping cart page as complementary items. Up-sell products appear on the product detail page (PDP) as more expensive alternatives. Related Products also appear on the PDP as alternative options.",
    hint: "Cross-sells suggest additions at cart time; up-sells suggest upgrades while browsing.",
    topic: "Digital Marketing",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 7 — Practice Test #1 + Week 1 Review"
  },
  {
    question: "What is Cookie Restriction Mode and what does it do?",
    answer: "Cookie Restriction Mode is Magento's built-in GDPR cookie consent mechanism. When enabled, Magento does not store non-essential cookies until the customer accepts. A banner is shown, and only after acceptance is the user_allowed_save_cookie cookie set.",
    hint: "It prevents tracking cookies until explicit consent is given.",
    topic: "Compliance",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 7 — Practice Test #1 + Week 1 Review"
  },
  {
    question: "Does Magento store full credit card numbers?",
    answer: "No. Magento uses tokenization — payment tokens (references to card data stored at the payment gateway) are saved in the vault_payment_token table. Full card numbers are never stored in the Magento database, which helps with PCI compliance.",
    hint: "Tokens are safe references, not the actual sensitive data.",
    topic: "Compliance",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 7 — Practice Test #1 + Week 1 Review"
  },
  {
    question: "What is the difference between an HTML sitemap and an XML sitemap?",
    answer: "An HTML sitemap is a frontend page designed for human navigation, helping visitors find content. An XML sitemap is a file (typically /sitemap.xml) generated by cron for search engine bots, containing URLs with frequency and priority metadata for indexing.",
    hint: "One is for people clicking links; the other is for search crawlers.",
    topic: "SEO",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 7 — Practice Test #1 + Week 1 Review"
  },
  {
    question: "What is the Persistent Shopping Cart feature and who can use it?",
    answer: "Persistent Shopping Cart saves a registered customer's cart contents across browser sessions using a cookie, so items are not lost when the session expires. It is only available to registered (logged-in) customers — guests do not benefit from cart persistence.",
    hint: "Logged-in users get their cart remembered; guests start fresh each session.",
    topic: "Customer Journey",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 7 — Practice Test #1 + Week 1 Review"
  },
  {
    question: "Where is the custom Admin URL configured in Magento 2?",
    answer: "The Admin URL is configured in app/etc/env.php under the 'backend' > 'frontName' key, or during installation. It should be changed from the default /admin for security purposes. This is not configurable through the Admin UI.",
    hint: "It is a server-side configuration file, not an admin panel setting.",
    topic: "Security",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 7 — Practice Test #1 + Week 1 Review"
  },
  {
    question: "How is a Tax Rule constructed in Magento 2?",
    answer: "A Tax Rule combines three components: Customer Tax Class (from customer group), Product Tax Class (assigned to the product), and Tax Zone/Rate (defined by country, state, and ZIP code). All three must match for the tax rule to apply to a transaction.",
    hint: "Three dimensions intersect: who is buying, what they are buying, and where it is going.",
    topic: "Tax",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 7 — Practice Test #1 + Week 1 Review"
  },
  {
    question: "What CMS page URL key serves as the 404 Not Found page in Magento 2?",
    answer: "The 404 page is a CMS page with the URL key 'no-route'. The home page URL key is configurable in Stores > Configuration > General > Web > Default Pages > CMS Home Page (default: 'home').",
    hint: "It is not called '404' — it uses a routing-related name.",
    topic: "CMS Pages",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 7 — Practice Test #1 + Week 1 Review"
  },
  {
    question: "Are GDPR data deletion and data export features available in Magento Open Source?",
    answer: "No. GDPR data deletion requests and data export (portability) features are Adobe Commerce (EE) only. Magento Open Source does not include these built-in compliance tools, though custom extensions could add similar functionality.",
    hint: "Privacy compliance tools are a premium feature.",
    topic: "Compliance",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 7 — Practice Test #1 + Week 1 Review"
  },
  {
    question: "What does the 'Use to Create Configurable Product' attribute setting do?",
    answer: "When set to Yes on a Dropdown, Visual Swatch, or Text Swatch attribute with Global scope, it allows that attribute to be used as a configurable product axis for creating product variations. Without this setting enabled, the attribute cannot be selected during the 'Create Configurations' workflow.",
    hint: "It is the third requirement alongside input type and scope.",
    topic: "Attributes",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 7 — Practice Test #1 + Week 1 Review"
  },
  {
    question: "What is the Mview (Materialized View) system used for in Magento indexing?",
    answer: "Mview is the change-tracking mechanism used by the 'Update by Schedule' indexer mode. It tracks entity changes in database changelog tables and processes them in batches via cron, rather than reindexing immediately on every save. This is more performant for large catalogs.",
    hint: "It is the engine behind scheduled indexing that watches for changes between cron runs.",
    topic: "Indexers",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 7 — Practice Test #1 + Week 1 Review"
  },
  {
    question: "What is the maximum number of products that can be compared by default in Magento 2?",
    answer: "Up to 4 products can be compared by default (configurable). The comparison list is session-based and not saved across sessions by default. A Recently Compared widget can show previous comparisons.",
    hint: "A small number that fits in a side-by-side table layout.",
    topic: "Customer Journey",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 7 — Practice Test #1 + Week 1 Review"
  },
  {
    question: "What is the admin navigation path to configure Google Analytics in Magento?",
    answer: "Admin → Stores → Configuration → Sales → Google API → Google Analytics",
    hint: "It's under the Sales section of Configuration",
    topic: "Google Analytics Integration",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 15 — Google Analytics, GTM & Email Marketing"
  },
  {
    question: "What is the difference between how UA and GA4 structure ecommerce purchase data in the data layer?",
    answer: "UA uses nested structure with ecommerce.purchase.actionField and ecommerce.purchase.products[], while GA4 uses a flat structure with ecommerce.transaction_id and ecommerce.items[] at the top level.",
    hint: "Think about nesting vs flat, and products[] vs items[]",
    topic: "Google Analytics Data Layer",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 15 — Google Analytics, GTM & Email Marketing"
  },
  {
    question: "Where must the Google Tag Manager snippet be placed in the HTML for full functionality?",
    answer: "GTM must be placed in BOTH the <head> (JavaScript tag, immediately after opening <head>) and <body> (noscript iframe, immediately after opening <body>).",
    hint: "Two locations are required — one for JS-enabled browsers, one for fallback",
    topic: "Google Tag Manager",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 15 — Google Analytics, GTM & Email Marketing"
  },
  {
    question: "In Adobe Commerce (EE), how is GTM configured in the admin panel?",
    answer: "Via the Account Type dropdown in the existing GA/GA4 config sections: Stores → Configuration → Sales → Google API → Google Analytics → Account type: 'Google Tag Manager', then entering the Container ID. This is provided by the proprietary module-google-tag-manager (EE only).",
    hint: "It's not a separate GTM section — it's a dropdown within existing GA config",
    topic: "Google Tag Manager",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 15 — Google Analytics, GTM & Email Marketing"
  },
  {
    question: "Does native Magento automatically fire GA4 ecommerce events (view_item, add_to_cart, purchase, etc.) when you enter a GA4 Measurement ID?",
    answer: "No. The native config only injects the gtag.js script and fires basic pageview tracking. Full GA4 ecommerce events require either GTM with custom GA4 Event tags or a third-party extension.",
    hint: "Native GA4 support is partial — think about what requires additional setup",
    topic: "Google Analytics GA4",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 15 — Google Analytics, GTM & Email Marketing"
  },
  {
    question: "What does the 'Need to Confirm' setting do in Magento's newsletter configuration?",
    answer: "It enables double opt-in for newsletter subscriptions. When set to Yes, subscribers receive a confirmation email and must click to verify before being added to the list. This is important for GDPR compliance.",
    hint: "Think about subscription verification and EU privacy law",
    topic: "Email Marketing - Newsletter",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 15 — Google Analytics, GTM & Email Marketing"
  },
  {
    question: "What is the difference between Magento's Persistent Shopping Cart and abandoned cart emails?",
    answer: "Persistent Shopping Cart saves/restores cart contents when a logged-in customer returns, but does NOT send any emails. It merely preserves the cart state. Abandoned cart emails require either Adobe Commerce Email Reminders (logged-in only) or a third-party tool like Klaviyo or Dotdigital.",
    hint: "One restores silently, the other proactively contacts the customer",
    topic: "Abandoned Cart",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 15 — Google Analytics, GTM & Email Marketing"
  },
  {
    question: "Can native Magento recover guest abandoned carts with email reminders?",
    answer: "No. Guest customers have no stored identity/email in Magento until they complete checkout. Native Email Reminders (EE only) only work for logged-in customers. Guest cart recovery requires third-party tools like Klaviyo, Dotdigital, or Mailchimp, which capture the email at the first checkout step.",
    hint: "Think about what information Magento has about guest users",
    topic: "Abandoned Cart",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 15 — Google Analytics, GTM & Email Marketing"
  },
  {
    question: "Are Customer Segments available in Magento Open Source (CE)?",
    answer: "No. Customer Segments are an Adobe Commerce (Enterprise) feature only. Magento Open Source has customer groups (static) but NOT condition-based dynamic segments.",
    hint: "Think about edition-specific features",
    topic: "Customer Segmentation",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 15 — Google Analytics, GTM & Email Marketing"
  },
  {
    question: "What is the 'Anonymize IP' setting in Magento's Google Analytics configuration?",
    answer: "It is a GDPR-related toggle that appends anonymize_ip: true to the GA tag call, which tells Google Analytics to anonymize the last octet of the user's IP address before storage. It is found under Stores → Configuration → Sales → Google API → Google Analytics.",
    hint: "Related to EU privacy compliance for analytics tracking",
    topic: "Google Analytics GDPR",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 15 — Google Analytics, GTM & Email Marketing"
  },
  {
    question: "What must be true about GTM Custom Event trigger names?",
    answer: "GTM Custom Event trigger names must exactly match the 'event' property value pushed to window.dataLayer. They are case-sensitive — for example, 'purchase' and 'Purchase' would be treated as different events.",
    hint: "Think about case sensitivity and matching",
    topic: "Google Tag Manager",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 15 — Google Analytics, GTM & Email Marketing"
  },
  {
    question: "What is the naming convention for GA4 ecommerce event names?",
    answer: "GA4 event names use snake_case (e.g., add_to_cart, begin_checkout, add_shipping_info, add_payment_info). These are Google's reserved event names and must match exactly for automatic reporting in GA4 dashboards.",
    hint: "Think about the underscore convention and reserved names",
    topic: "Google Analytics GA4",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 15 — Google Analytics, GTM & Email Marketing"
  },
  {
    question: "How does GDPR differ from CAN-SPAM regarding consent for email marketing?",
    answer: "GDPR requires explicit opt-in consent before sending marketing emails (newsletter checkboxes must NOT be pre-checked). CAN-SPAM uses an opt-out model (unsubscribe from unwanted email) but doesn't require prior consent. Both require an unsubscribe mechanism.",
    hint: "One requires permission first, the other allows sending with an exit option",
    topic: "Email Compliance",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 15 — Google Analytics, GTM & Email Marketing"
  },
  {
    question: "What must happen before the GTM container script loads on a page?",
    answer: "The window.dataLayer array should be initialized before the GTM snippet loads: window.dataLayer = window.dataLayer || []; If not initialized first, events pushed before GTM initialization may be lost.",
    hint: "Think about the order of JavaScript initialization",
    topic: "Google Tag Manager",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 15 — Google Analytics, GTM & Email Marketing"
  },
  {
    question: "What must fire before any GA4 Event tags in GTM?",
    answer: "A GA4 Configuration tag must exist and fire on All Pages before any GA4 Event tags fire. The Event tags reference the Configuration tag.",
    hint: "Think about the prerequisite tag that loads the GA4 measurement library",
    topic: "Google Tag Manager",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 15 — Google Analytics, GTM & Email Marketing"
  },
  {
    question: "What is GTIN and why is it important for Google Shopping product feeds?",
    answer: "GTIN (Global Trade Item Number) is a product's barcode (UPC, EAN, ISBN, JAN). It is required for any branded product that has a manufacturer-assigned barcode. Omitting GTIN for a branded product that has one results in product disapproval in Google Merchant Center.",
    hint: "Think about barcode identification and product feed validation",
    topic: "Google Shopping Feeds",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 16 — Shopping Feeds, Social Plugins & eCommerce Features"
  },
  {
    question: "What are the core required attributes for a Google Merchant Center product feed?",
    answer: "The core required attributes are: id, title, description, link, image_link, price, availability, condition, and either gtin/mpn with brand. Price must include currency code (e.g., '79.99 USD'), and availability must exactly match: 'in stock', 'out of stock', 'preorder', or 'backorder'.",
    hint: "Nine essential fields — think product identification, pricing, and status",
    topic: "Google Shopping Feeds",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 16 — Shopping Feeds, Social Plugins & eCommerce Features"
  },
  {
    question: "What is item_group_id in a Google Shopping feed and when should it be used?",
    answer: "item_group_id groups product variants (different colors/sizes) under one parent product. All variants share the same item_group_id. Without it, Google cannot group variants and may show duplicate listings for the same product.",
    hint: "Think about how configurable products with multiple options should appear in Shopping results",
    topic: "Google Shopping Feeds",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 16 — Shopping Feeds, Social Plugins & eCommerce Features"
  },
  {
    question: "Can native Magento CSV product export produce a Google-ready shopping feed?",
    answer: "No. Native Magento CSV export (System > Data Transfer > Export) outputs standard Magento attribute names, not Google-formatted column headers. It requires manual column mapping or a dedicated feed extension to handle attribute mapping and scheduling.",
    hint: "Think about attribute name differences between Magento and Google",
    topic: "Product Feed Generation",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 16 — Shopping Feeds, Social Plugins & eCommerce Features"
  },
  {
    question: "How do Magento product attributes map to Google Shopping feed fields?",
    answer: "Key mappings: sku → id, name → title, manufacturer → brand, ean/upc → gtin, is_in_stock (1/0) → availability ('in stock'/'out of stock'). Price must have currency appended (79.99 USD), and link must be constructed as base URL + url_key.",
    hint: "Think about the Magento field names vs Google's expected field names",
    topic: "Product Feed Mapping",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 16 — Shopping Feeds, Social Plugins & eCommerce Features"
  },
  {
    question: "What is the primary benefit of social login plugins for ecommerce stores?",
    answer: "Social login reduces registration friction by eliminating form-filling. Users can register/login with existing Google, Facebook, or Apple accounts in fewer steps, leading to higher registration and conversion rates at checkout.",
    hint: "Think about removing barriers to account creation",
    topic: "Social Login",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 16 — Shopping Feeds, Social Plugins & eCommerce Features"
  },
  {
    question: "What privacy considerations apply to social login under GDPR?",
    answer: "Social login data (name, email, profile photo) counts as personal data under GDPR. Social login must be disclosed in the Privacy Policy, users must be able to disconnect social login, and the store should never store OAuth access tokens long-term — only the returned profile data.",
    hint: "Think about data from third-party providers as personal data",
    topic: "Social Login Compliance",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 16 — Shopping Feeds, Social Plugins & eCommerce Features"
  },
  {
    question: "What is a wishlist's value as a marketing and conversion tool?",
    answer: "Wishlists serve as: a deferred cart (one-click purchase later), viral marketing tool (share with friends/family as gift guides), trigger for behavioral email campaigns (price drops, back-in-stock alerts), and an intent signal for inventory planning. Multiple wishlists are available in Adobe Commerce only.",
    hint: "Think beyond saving items — consider sharing, email triggers, and analytics",
    topic: "Wishlist Conversion",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 16 — Shopping Feeds, Social Plugins & eCommerce Features"
  },
  {
    question: "How does the Compare Products feature work in Magento, and which attributes appear in the comparison?",
    answer: "Only attributes with 'Comparable on Storefront' = Yes (is_comparable property) appear in the comparison table. Compare data is stored in the session (not persistent). The feature is always enabled — there is no admin toggle to disable it or configure a max number of products.",
    hint: "Think about attribute-level settings and session storage",
    topic: "Compare Products",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 16 — Shopping Feeds, Social Plugins & eCommerce Features"
  },
  {
    question: "What are the most common reasons products get disapproved in Google Merchant Center?",
    answer: "The most common disapproval reasons are: invalid GTIN (wrong check digit or fake), price mismatch between feed and landing page, broken image URL (404 or requires authentication), invalid availability value (case matters — 'In Stock' instead of 'in stock'), and HTML tags in the description field.",
    hint: "Think about data accuracy and format strictness",
    topic: "Google Merchant Center",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 16 — Shopping Feeds, Social Plugins & eCommerce Features"
  },
  {
    question: "What is Feedonomics and when would you use it?",
    answer: "Feedonomics is an enterprise-grade, multi-channel feed management tool supporting 100+ shopping channels. It provides full-service data transformation with rules, conditional logic, and enrichment. It's best for large retailers needing automated data quality checks and managed feed optimization across Google, Facebook, Amazon, and more.",
    hint: "Think enterprise, multi-channel, managed service",
    topic: "Feed Management Tools",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 16 — Shopping Feeds, Social Plugins & eCommerce Features"
  },
  {
    question: "What are the requirements for Facebook/Meta Dynamic Ads to work correctly?",
    answer: "Dynamic ads require: 1) Meta Pixel installed with ViewContent, AddToCart, and Purchase events, 2) A product catalog in Meta Commerce Manager with matching product IDs, and 3) A dynamic ad template. Product IDs in pixel events must exactly match catalog id values — mismatches prevent correct personalization.",
    hint: "Three components must work together, with ID matching being critical",
    topic: "Facebook Dynamic Ads",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 16 — Shopping Feeds, Social Plugins & eCommerce Features"
  },
  {
    question: "What does the 'Scheduled Fetch' upload method mean for Google Merchant Center?",
    answer: "Scheduled Fetch is when Google Merchant Center automatically fetches your product feed from a public URL on a set schedule (daily is recommended). It's the most common method for production use. The Content API is used for real-time inventory/price sync.",
    hint: "GMC pulls the feed from you, rather than you pushing it",
    topic: "Google Merchant Center",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 16 — Shopping Feeds, Social Plugins & eCommerce Features"
  },
  {
    question: "What is the Persistent Shopping Cart feature's requirement for customers?",
    answer: "Persistent Shopping Cart requires the customer to be logged in or have 'Remember Me' active. Guest carts are stored in sessions and are NOT persistent. The feature saves cart contents across sessions, devices, and time periods, but does not send any emails.",
    hint: "Think about authentication requirements and what it does NOT do",
    topic: "Persistent Shopping Cart",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 16 — Shopping Feeds, Social Plugins & eCommerce Features"
  },
  {
    question: "What does GDPR's Right to Erasure mean in the context of Adobe Commerce, and why can't you simply delete orders?",
    answer: "Right to Erasure means anonymizing the customer's personal data (name, email, address, phone) in order records, NOT deleting the orders. Orders must be retained because businesses are legally required to keep transaction records for financial auditing and tax reporting (typically 7 years). The order amount, date, line items, and tax data are preserved — only PII is scrubbed.",
    hint: "Think about the difference between anonymization and deletion, and why financial records must be kept",
    topic: "GDPR Right to Erasure",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 17 — Privacy Law & Payment Security Basics"
  },
  {
    question: "What is the exact admin path to enable Cookie Restriction Mode in Adobe Commerce?",
    answer: "Admin → Stores → Configuration → General → Web → Default Cookie Settings → Cookie Restriction Mode = Yes",
    hint: "It's under the General section, not under Customers or Marketing",
    topic: "Cookie Consent",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 17 — Privacy Law & Payment Security Basics"
  },
  {
    question: "What is the name of the cookie that tracks user consent in Adobe Commerce's Cookie Restriction Mode?",
    answer: "user_allowed_save_cookie — it is set when the user clicks OK on the consent banner. Its value is JSON-encoded allowed cookie groups, and its lifetime is controlled by cookie_restriction_lifetime config (default 31536000 seconds = 1 year).",
    hint: "The cookie name describes what the user has allowed",
    topic: "Cookie Consent",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 17 — Privacy Law & Payment Security Basics"
  },
  {
    question: "How do GDPR and CCPA differ in their consent models?",
    answer: "GDPR is an opt-in model: businesses need lawful basis (usually consent) BEFORE processing personal data. CCPA is an opt-out model: businesses can collect and process data by default, but must allow consumers to opt-out of the SALE of their personal data via a 'Do Not Sell My Personal Information' link.",
    hint: "One requires permission first, the other allows default collection with an exit option",
    topic: "GDPR vs CCPA",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 17 — Privacy Law & Payment Security Basics"
  },
  {
    question: "What SAQ type applies to a merchant using PayPal Standard where the customer is redirected to PayPal to pay?",
    answer: "SAQ A — the simplest compliance level. It applies because the payment page is fully outsourced to PayPal's PCI-certified environment. The merchant's systems never receive, process, or store cardholder data.",
    hint: "Think about who handles the card data — the merchant or the payment provider",
    topic: "PCI DSS SAQ Types",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 17 — Privacy Law & Payment Security Basics"
  },
  {
    question: "What is the difference between PCI SAQ A and SAQ A-EP?",
    answer: "SAQ A applies when payment is fully outsourced via redirect or hosted iframe — the merchant's page cannot impact payment security. SAQ A-EP applies when the merchant's own page controls payment form elements (even if card data goes directly to the processor via JS), because the page could be compromised to steal card data. SAQ A has ~22 questions; SAQ A-EP has ~191.",
    hint: "Think about whether the merchant's page can be compromised to affect payment security",
    topic: "PCI DSS SAQ Types",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 17 — Privacy Law & Payment Security Basics"
  },
  {
    question: "Can CVV/CVC ever be stored, even in encrypted form, after a transaction is authorized?",
    answer: "No — absolutely not. PCI DSS explicitly prohibits storing CVV/CVV2/CVC/CID even if encrypted, after transaction authorization is complete. This is a hard prohibition with no exceptions. Full magnetic stripe data and PIN/PIN blocks are also prohibited. The solution is tokenization — the payment provider stores a token that can be recharged.",
    hint: "This is an absolute rule with zero exceptions",
    topic: "PCI DSS Data Storage",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 17 — Privacy Law & Payment Security Basics"
  },
  {
    question: "What minimum TLS version is required for PCI DSS compliance?",
    answer: "TLS 1.2 or higher. TLS 1.0 and TLS 1.1 must be disabled. SSL in any version must be disabled. This is configured at the server level (Apache/Nginx), not in Magento's admin config.",
    hint: "Think about the version number that became mandatory after June 2018",
    topic: "PCI DSS TLS Requirements",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 17 — Privacy Law & Payment Security Basics"
  },
  {
    question: "What cookies are always allowed (essential/exempt) even when Cookie Restriction Mode is enabled?",
    answer: "Session cookie (PHPSESSID), cart/quote cookies, and store/currency/language preference cookies are always allowed as they are essential. Analytics, marketing, and personalization cookies are blocked until the user consents.",
    hint: "Think about what's strictly necessary for the store to function",
    topic: "Cookie Consent",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 17 — Privacy Law & Payment Security Basics"
  },
  {
    question: "How should the Privacy Policy be integrated into the checkout flow in Adobe Commerce?",
    answer: "Through the Terms and Conditions (checkout agreements) feature. Enable it at Stores → Configuration → Sales → Checkout → Options → Enable Terms and Conditions = Yes, then create a condition that links to the Privacy Policy CMS page under Stores → Terms and Conditions. There is no dedicated 'Privacy Policy' config section in checkout.",
    hint: "It uses the checkout agreements feature, not a dedicated privacy setting",
    topic: "Privacy Policy Integration",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 17 — Privacy Law & Payment Security Basics"
  },
  {
    question: "What are the two primary strategies to minimize PCI DSS scope for an ecommerce merchant?",
    answer: "1) Hosted Payment Pages (redirect): customer is redirected to the payment provider's PCI-certified page to enter card details. 2) Tokenization (hosted fields/JS SDK): card number is entered in a provider-hosted iframe, exchanged for a token server-side. In both cases, the merchant never handles actual card data.",
    hint: "Both strategies keep card data off the merchant's systems",
    topic: "PCI DSS Scope Reduction",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 17 — Privacy Law & Payment Security Basics"
  },
  {
    question: "What is the admin path for configuring HTTPS/secure URLs in Adobe Commerce?",
    answer: "Stores → Configuration → General → Web → Secure (Base URLs). Key settings include Base URL (Secure), Use Secure URLs on Storefront, Use Secure URLs in Admin, Enable HTTP Strict Transport Security (HSTS), and Upgrade Insecure Requests.",
    hint: "Under General > Web, look for the Secure section",
    topic: "HTTPS Configuration",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 17 — Privacy Law & Payment Security Basics"
  },
  {
    question: "Where does the CCPA require the 'Do Not Sell My Personal Information' link to be placed?",
    answer: "The CCPA requires this link to be placed on the homepage, the privacy policy page, and any page where personal information is collected.",
    hint: "Think about multiple required placements across the site",
    topic: "CCPA Compliance",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 17 — Privacy Law & Payment Security Basics"
  },
  {
    question: "What are the seven key data subject rights under GDPR?",
    answer: "1) Right to Access, 2) Right to Erasure (Right to be Forgotten), 3) Right to Data Portability, 4) Right to Rectification, 5) Right to Restriction of Processing, 6) Right to Object, 7) Right to be Informed. Data Portability requires providing data in machine-readable format (JSON/CSV).",
    hint: "Seven rights — think access, delete, export, correct, restrict, object, inform",
    topic: "GDPR Rights",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 17 — Privacy Law & Payment Security Basics"
  },
  {
    question: "Where is the custom admin path stored in Adobe Commerce, and how is it set?",
    answer: "The custom admin path is stored in app/etc/env.php under the 'backend' → 'frontName' key. It can be set via CLI: bin/magento setup:config:set --backend-frontname='my_secret_admin_path'. It is a deploy-time config, not stored in the database or config.php.",
    hint: "Think about the environment configuration file, not the database",
    topic: "Admin Security",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 18 — Security Aspects & Accessibility"
  },
  {
    question: "Can Two-Factor Authentication (2FA) be disabled via the Adobe Commerce admin panel in version 2.4.x?",
    answer: "No. 2FA is mandatory in Adobe Commerce 2.4.x and cannot be disabled through the admin UI. It can only be disabled via CLI: bin/magento module:disable Magento_TwoFactorAuth (for development environments only, never production).",
    hint: "Think about what requires CLI intervention vs admin panel settings",
    topic: "Two-Factor Authentication",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 18 — Security Aspects & Accessibility"
  },
  {
    question: "What are the four supported 2FA providers in Adobe Commerce out of the box?",
    answer: "1) Google Authenticator (TOTP), 2) Duo Security (push notification/TOTP), 3) Authy (TOTP), 4) U2F hardware keys (Yubikey and others).",
    hint: "Think about TOTP apps, push notifications, and hardware keys",
    topic: "Two-Factor Authentication",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 18 — Security Aspects & Accessibility"
  },
  {
    question: "What is the admin path for configuring reCAPTCHA, and how are storefront and admin reCAPTCHA related?",
    answer: "reCAPTCHA is configured at Stores → Configuration → Security → Google reCAPTCHA. Storefront and admin panel reCAPTCHA are configured separately with independent toggles — enabling it on the admin login is a separate configuration from storefront forms.",
    hint: "Two separate configurations under the same Security section",
    topic: "reCAPTCHA",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 18 — Security Aspects & Accessibility"
  },
  {
    question: "What forms support reCAPTCHA natively in Adobe Commerce?",
    answer: "Storefront: Customer Login, Customer Registration, Forgot Password, Contact Us, Newsletter Subscription, Checkout (Place Order), Coupon Code (Cart), Product Reviews. Admin: Admin Login and Admin Forgot Password.",
    hint: "Think about all the forms where bot protection matters — both customer-facing and admin",
    topic: "reCAPTCHA",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 18 — Security Aspects & Accessibility"
  },
  {
    question: "What is Content Security Policy (CSP) in Adobe Commerce, and where are whitelist entries configured?",
    answer: "CSP controls which external resources (scripts, styles, images, fonts) a browser is permitted to load, preventing XSS attacks. Whitelist entries are configured in csp_whitelist.xml files within each module's etc/ directory. CSP was introduced in Adobe Commerce 2.3.5.",
    hint: "Think about an XML file per module that controls allowed external resources",
    topic: "Content Security Policy",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 18 — Security Aspects & Accessibility"
  },
  {
    question: "What are the two CSP modes in Adobe Commerce, and which is the default?",
    answer: "Report-Only mode (logs violations but does not block them) and Restrict/Enforce mode (actively blocks unauthorized resources). Default is report-only (config value = 1). Switching to enforce mode requires CLI (bin/magento config:set) — there is no admin UI toggle.",
    hint: "One mode just logs, the other actually blocks — the safer one is the default",
    topic: "Content Security Policy",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 18 — Security Aspects & Accessibility"
  },
  {
    question: "What is HSTS and how does it protect against attacks?",
    answer: "HSTS (HTTP Strict Transport Security) is a response header that instructs browsers to always use HTTPS for the domain for a specified duration. It protects against SSL stripping attacks because once a browser receives the HSTS header, it refuses non-HTTPS connections even before a redirect fires. It only works when delivered over HTTPS.",
    hint: "Think about browser-enforced HTTPS — the browser remembers to always use HTTPS",
    topic: "Transport Security",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 18 — Security Aspects & Accessibility"
  },
  {
    question: "What are the four WCAG 2.1 principles (POUR acronym)?",
    answer: "Perceivable (information must be presentable to all users' senses), Operable (UI must be navigable by all users), Understandable (content and UI behavior must be understandable), Robust (content must work with current and future user agents including assistive technologies).",
    hint: "P-O-U-R — four pillars of web accessibility",
    topic: "WCAG Accessibility",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 18 — Security Aspects & Accessibility"
  },
  {
    question: "What WCAG conformance level is the legal standard for ADA compliance in US ecommerce?",
    answer: "WCAG 2.1 Level AA. The ADA itself doesn't specify a technical standard, but courts and the DOJ have adopted WCAG 2.1 Level AA as the de facto compliance benchmark. Level A is the minimum, Level AA is the legal standard, and Level AAA is aspirational (not required).",
    hint: "Not the minimum level (A), not the aspirational level (AAA), but the middle one",
    topic: "ADA Compliance",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 18 — Security Aspects & Accessibility"
  },
  {
    question: "What is the minimum color contrast ratio required by WCAG 2.1 AA for normal text and large text?",
    answer: "Normal text (under 18pt or under 14pt bold) requires a minimum contrast ratio of 4.5:1. Large text (18pt+ or 14pt bold+) requires a minimum of 3:1. UI components and graphical objects also require 3:1.",
    hint: "Two different ratios — the smaller text needs higher contrast",
    topic: "WCAG Color Contrast",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 18 — Security Aspects & Accessibility"
  },
  {
    question: "What is the PCI DSS timeline for applying critical security patches?",
    answer: "Critical patches (CVSS 9.0-10.0) must be applied as soon as available, within 30 days. High severity (CVSS 7.0-8.9) should be applied within 30 days. Medium/low severity patches should be applied within 30-90 days.",
    hint: "Think about the urgency levels — critical means fast, not 90 days",
    topic: "Security Patch Management",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 18 — Security Aspects & Accessibility"
  },
  {
    question: "Where are admin password/lockout settings configured in Adobe Commerce?",
    answer: "Stores → Configuration → Advanced → Admin → Security. Key settings include Maximum Login Failures to Lockout Account (default: 6), Lockout Time in minutes (default: 30), Password Lifetime in days (default: 90), and Add Secret Key to URLs. Note: these are admin-specific — customer password settings are under Customers → Customer Configuration → Password Options.",
    hint: "Under Advanced > Admin, not under Customers",
    topic: "Admin Security Settings",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 18 — Security Aspects & Accessibility"
  },
  {
    question: "How is IP whitelisting for the admin panel implemented in Commerce Cloud?",
    answer: "Through Fastly Edge ACLs or server-level firewall rules. There is no native Magento admin UI option for IP whitelisting. For on-premise deployments, it's configured at the web server level (Nginx location block or Apache .htaccess directives).",
    hint: "Think infrastructure/CDN level, not Magento admin settings",
    topic: "Admin Security",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 18 — Security Aspects & Accessibility"
  },
  {
    question: "What are the six price levels in Magento's pricing waterfall, in order?",
    answer: "1) Regular Price (base catalog price), 2) Special Price (date-range override), 3) Tier Price (quantity-break discounts per customer group), 4) Group Price (legacy — stored as Tier Price with qty=1 in M2), 5) Catalog Price Rule (condition-based, applied to catalog layer), 6) Cart Price Rule (applied at checkout). The lowest of Special/Tier/Catalog Rule wins at catalog layer; Cart Rules apply after.",
    hint: "Six levels — catalog-layer resolution first, then cart-layer discounts",
    topic: "Pricing Hierarchy",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 20 — Weak Area Drill + Final Cheat Sheet"
  },
  {
    question: "How does Group Price work in Magento 2 compared to Magento 1?",
    answer: "In Magento 2, Group Price is stored as a Tier Price with qty = 1. There is no separate 'Group Price' field in the Admin UI — it was folded into the Tier Price functionality. You can set a price for a specific customer group by creating a tier price with quantity = 1 for that group.",
    hint: "No separate field in M2 — it's a special case of another pricing feature",
    topic: "Pricing Hierarchy",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 20 — Weak Area Drill + Final Cheat Sheet"
  },
  {
    question: "What is the difference between an order State and an order Status in Magento?",
    answer: "States are hard-coded system constants in PHP (Order.php) that cannot be changed. Statuses are admin-configurable labels mapped to one or more states (created in Stores → Order Status). You can add custom statuses and assign them to existing states, but you cannot create new states.",
    hint: "One is immutable code, the other is a configurable label",
    topic: "Order Management",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 20 — Weak Area Drill + Final Cheat Sheet"
  },
  {
    question: "What are the 8 core order states in Magento, and what triggers each?",
    answer: "new (order placed, payment not confirmed), pending_payment (awaiting payment gateway confirmation), processing (invoice created/payment captured), complete (all items shipped + invoiced), closed (complete then fully refunded via credit memo), canceled (order canceled), holded (manual admin hold), payment_review (fraud check pending).",
    hint: "Eight states covering the full lifecycle from placement to completion or cancellation",
    topic: "Order States",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 20 — Weak Area Drill + Final Cheat Sheet"
  },
  {
    question: "What is the difference between 'complete' and 'closed' order states, and can you cancel a complete order?",
    answer: "Complete means all items are shipped and invoiced. Closed means the order was complete and then fully refunded via credit memo. You CANNOT cancel a complete order — you must issue a credit memo, which moves it to closed. Canceled means the order was never fulfilled.",
    hint: "Think about the difference between never fulfilled vs fulfilled then refunded",
    topic: "Order States",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 20 — Weak Area Drill + Final Cheat Sheet"
  },
  {
    question: "What are the seven product types in Magento, and which is EE-only?",
    answer: "Simple, Configurable, Grouped, Bundle, Virtual, Downloadable, and Gift Card. Gift Card is natively available in Adobe Commerce (EE) only. Key distinctions: Configurable stock lives on child simples, Grouped items are added to cart separately, Bundle can have Fixed or Dynamic pricing.",
    hint: "Six available in both editions, one is enterprise-exclusive",
    topic: "Product Types",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 20 — Weak Area Drill + Final Cheat Sheet"
  },
  {
    question: "What are the requirements for configurable product attributes in Magento?",
    answer: "Configurable attributes must use Global scope and be of input type Dropdown or Visual/Text Swatch. The configurable product itself has no stock quantity — inventory is tracked at the child simple product level. Each child simple represents a unique combination of attribute values.",
    hint: "Think about scope and input type restrictions for the parent product's variation attributes",
    topic: "Configurable Products",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 20 — Weak Area Drill + Final Cheat Sheet"
  },
  {
    question: "What is the difference between Fixed and Dynamic pricing for Bundle products?",
    answer: "Dynamic pricing: the bundle's price is calculated as the sum of all selected child product prices. Fixed pricing: the bundle has a base price, and each option adds or subtracts from that base. Dynamic pricing shows the range (e.g., 'From $99'), while Fixed pricing shows the base price with option adjustments.",
    hint: "One calculates from children, the other starts with a base and adjusts",
    topic: "Bundle Products",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 20 — Weak Area Drill + Final Cheat Sheet"
  },
  {
    question: "Name five features that are exclusive to Adobe Commerce (EE) and not available in Magento Open Source (CE).",
    answer: "EE-only features include: B2B module (Companies, Quotes, Requisition Lists, Purchase Orders, Shared Catalogs), Content Staging (scheduling CMS/product updates), Customer Segments, Catalog Permissions (per category/group), RMA (Returns), Dynamic Blocks, Scheduled Import/Export, Reward Points, native Gift Cards, native GTM integration, Store Credit, and Email Reminders.",
    hint: "Think about B2B, staging, segmentation, and advanced marketing features",
    topic: "CE vs EE Features",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 20 — Weak Area Drill + Final Cheat Sheet"
  },
  {
    question: "What is the difference between Adobe Commerce Cloud Starter and Cloud Pro?",
    answer: "Starter: 4 environments (master + 3 branches), single-node per environment, no dedicated staging, no RabbitMQ. Pro: Integration branches + dedicated Staging + dedicated Production (3-node HA cluster), includes RabbitMQ, dedicated Elasticsearch nodes, automated backups, multi-region capable. Both include Fastly CDN and WAF.",
    hint: "Compare environment count, node architecture, and included services",
    topic: "Hosting Options",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 20 — Weak Area Drill + Final Cheat Sheet"
  },
  {
    question: "How do Catalog Price Rules get applied in Magento, and what is 'Stop Further Rules Processing'?",
    answer: "Catalog Price Rules run via cron (catalogrule_apply_all — daily at 1 AM). Changes are NOT instant in CE without manual reindex. The 'Stop Further Rules Processing' checkbox prevents lower-priority rules from applying — it's the mechanism to prevent price rule stacking. Lower priority number = higher priority.",
    hint: "Think about cron-based application and rule stacking prevention",
    topic: "Catalog Price Rules",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 20 — Weak Area Drill + Final Cheat Sheet"
  },
  {
    question: "Does Magento natively generate hreflang tags for multi-language stores?",
    answer: "No. Magento does NOT natively generate hreflang tags — this requires a third-party extension. Hreflang tags use BCP 47 language codes (e.g., en-US, fr-FR), must be bidirectional (each page references all alternates), and should include x-default for the fallback version.",
    hint: "This SEO feature for multi-language sites requires additional tools",
    topic: "SEO - Hreflang",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 20 — Weak Area Drill + Final Cheat Sheet"
  },
  {
    question: "What are the eight GDPR rights, and what is the 72-hour rule?",
    answer: "The 8 rights: 1) Right to be Informed, 2) Right of Access, 3) Right to Rectification, 4) Right to Erasure, 5) Right to Restrict Processing, 6) Right to Data Portability, 7) Right to Object, 8) Rights related to Automated Decision-Making. The 72-hour rule requires businesses to notify the supervisory authority within 72 hours of discovering a data breach.",
    hint: "Eight rights plus a critical breach notification timeline",
    topic: "GDPR Rights",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 20 — Weak Area Drill + Final Cheat Sheet"
  },
  {
    question: "What is the difference between 'Authorize Only' and 'Authorize and Capture' payment actions in Magento?",
    answer: "Authorize Only reserves the funds on the customer's card but does not capture them until an invoice is created. Authorize and Capture immediately captures the payment at the time of order placement. Authorize Only is commonly used when merchants want to verify stock before capturing payment.",
    hint: "Think about when the money actually moves — at order time or at invoice time",
    topic: "Payment Methods",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 20 — Weak Area Drill + Final Cheat Sheet"
  },
  {
    question: "What is the exam weight breakdown for the four sections of the AD0-E712 exam?",
    answer: "Section 1: Core Features = 49% (~29 questions), Section 2: Commerce Basics = 14% (~8 questions), Section 3: Digital Marketing = 24% (~14 questions), Section 4: Compliance = 13% (~8 questions). Total: 60 questions, 105 minutes, 68% passing score (~41 correct).",
    hint: "Core Features is nearly half the exam",
    topic: "Exam Blueprint",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 19 — Full Exam Simulation #3"
  },
  {
    question: "What two files are required as the minimum for a valid Magento theme?",
    answer: "theme.xml (declares theme title, parent theme, and preview image) and registration.php (registers the theme with Magento using ComponentRegistrar). The registration.php path format must include the area prefix: 'frontend/Vendor/theme-name'.",
    hint: "One XML declaration file and one PHP registration file",
    topic: "Theme Architecture",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 19 — Full Exam Simulation #3"
  },
  {
    question: "What is the theme inheritance fallback chain in Magento?",
    answer: "Custom Theme → Parent Theme (e.g., Luma) → Magento/blank → lib/web (global library assets). Files are resolved from most specific to most generic. Layout XML files are merged (not overridden), while template .phtml files override (first match wins).",
    hint: "Four levels from most specific to most generic, with different behavior for layouts vs templates",
    topic: "Theme Inheritance",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 19 — Full Exam Simulation #3"
  },
  {
    question: "What happens if no <parent> tag is declared in theme.xml?",
    answer: "The theme has no fallback to any other theme — it does NOT automatically inherit from Magento/blank. The <parent> tag must be explicitly set for inheritance to work. Magento/blank itself has no parent.",
    hint: "There's no automatic fallback — it must be explicitly declared",
    topic: "Theme Architecture",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 19 — Full Exam Simulation #3"
  },
  {
    question: "What is the difference between <block> and <container> in Magento layout XML?",
    answer: "Blocks have a class attribute and can have templates; they generate output. Containers hold blocks but have no template or class of their own — they are structural wrappers. <block> and <container> declare new elements, while <referenceBlock> and <referenceContainer> modify existing elements.",
    hint: "One renders content, the other is just a structural wrapper",
    topic: "Layout XML",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 19 — Full Exam Simulation #3"
  },
  {
    question: "What is the correct directory naming convention for overriding a module's template in a theme?",
    answer: "Use underscore notation: Magento_Catalog/templates/ (not Magento/Catalog/templates/). For example, to override vendor/magento/module-catalog/view/frontend/templates/product/view/form.phtml, place it at app/design/frontend/Vendor/theme/Magento_Catalog/templates/product/view/form.phtml.",
    hint: "Think underscore between vendor and module name, not slash",
    topic: "Template Overriding",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 19 — Full Exam Simulation #3"
  },
  {
    question: "What is the difference between RequireJS 'map' and 'mixins' in Magento?",
    answer: "map: { '*': { 'ModuleA': 'ModuleB' } } completely replaces ModuleA with ModuleB — ModuleA is never loaded. Mixins (config.mixins) wraps a module — the original still loads and _super() calls the original methods. Use map for full replacement, mixins for extending behavior.",
    hint: "One replaces entirely, the other wraps and extends",
    topic: "RequireJS Configuration",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 19 — Full Exam Simulation #3"
  },
  {
    question: "What is the difference between data-mage-init and x-magento-init in Magento?",
    answer: "data-mage-init must be placed directly on the element as an HTML attribute. x-magento-init can be placed in a <script type='text/x-magento-init'> tag anywhere on the page and target any CSS selector. Use '*' as the selector to apply to the entire document. Both use RequireJS module paths.",
    hint: "One is inline on the element, the other can target any selector from anywhere",
    topic: "JavaScript Initialization",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 19 — Full Exam Simulation #3"
  },
  {
    question: "What is the difference between cache:clean and cache:flush in Magento?",
    answer: "cache:clean removes valid cache entries (specific cache types only). cache:flush destroys the entire cache storage including third-party caches. Use clean during development for specific cache types; use flush when you need a complete reset.",
    hint: "One is surgical, the other is a full wipe",
    topic: "Cache Management",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 19 — Full Exam Simulation #3"
  },
  {
    question: "How do Magento's developer mode and production mode differ regarding static files?",
    answer: "In developer mode, static files are generated on-the-fly (symlinked from source) — no deploy needed. In production mode, setup:static-content:deploy must be run explicitly after any static file changes. Forgetting to deploy in production is a common mistake.",
    hint: "One auto-generates, the other requires manual deployment",
    topic: "Magento Modes",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 19 — Full Exam Simulation #3"
  },
  {
    question: "What are the escape methods available in Magento .phtml templates and when should each be used?",
    answer: "escapeHtml() for HTML output (most common), escapeUrl() for URLs, escapeHtmlAttr() for HTML attributes, escapeJs() for JavaScript strings, escapeCss() for CSS. Using the wrong method (e.g., escapeHtml on a URL) is a common exam trick question.",
    hint: "Five methods, each for a specific output context — using the wrong one is always incorrect",
    topic: "Template Security",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 19 — Full Exam Simulation #3"
  },
  {
    question: "What is the difference between Catalog Price Rules and Cart Price Rules?",
    answer: "Catalog Price Rules are applied before the cart (at the product listing/detail level), show as reduced prices, don't support coupon codes, and are based on product conditions. Cart Price Rules are applied at checkout/cart, appear as discount line items, support coupon codes, and are based on cart conditions. Both support customer group filtering.",
    hint: "One changes the displayed price, the other creates a discount at checkout",
    topic: "Pricing Rules",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 19 — Full Exam Simulation #3"
  },
  {
    question: "How does Magento prevent duplicate content from products appearing in multiple categories?",
    answer: "Through canonical tags: <link rel='canonical' href='...primary-product-url...'/>.  Enable at Stores → Config → Catalog → Search Engine Optimization for both products and categories. Canonical for categories points to the root category page (no filter params). Other solutions like 301 redirects or NOINDEX would break navigation or remove from index entirely.",
    hint: "A specific HTML meta tag that points to the primary URL — not redirects or blocking",
    topic: "SEO Canonical Tags",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 19 — Full Exam Simulation #3"
  },
  {
    question: "What is the configurable scope for store configuration values in Magento, and what is the override order?",
    answer: "Default (global) < Website < Store < Store View (most specific). Values at lower (more specific) scopes override parent scopes. For example, a Store View setting overrides the same setting at Default, Website, or Store level.",
    hint: "Four levels from broadest to most specific — the most specific wins",
    topic: "Store Hierarchy",
    examCode: "AD0-E712",
    studyNoteTitle: "Day 19 — Full Exam Simulation #3"
  }
];

async function main() {
  console.log("Seeding AD0-E712 flashcards...");
  let created = 0;
  let skipped = 0;

  for (const fc of flashcards) {
    // Find the study note by title and certCode
    const studyNote = await prisma.studyNote.findFirst({
      where: { title: fc.studyNoteTitle, certCode: "AD0-E712" }
    });

    if (!studyNote) {
      console.log(`  ⚠ Study note not found: ${fc.studyNoteTitle}`);
      skipped++;
      continue;
    }

    // Check for duplicate
    const existing = await prisma.flashcard.findFirst({
      where: { question: fc.question, studyNoteId: studyNote.id }
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.flashcard.create({
      data: {
        question: fc.question,
        answer: fc.answer,
        hint: fc.hint,
        topic: fc.topic,
        examCode: fc.examCode,
        studyNoteId: studyNote.id
      }
    });
    created++;
  }

  console.log(`Done! Created: ${created}, Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
