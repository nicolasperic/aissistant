import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const flashcards = [
  {
    question: "What is the difference between `<sequence>` in module.xml and `require` in composer.json regarding dependency enforcement?",
    answer: "`<sequence>` only controls module load order and does not prevent installation if the listed module is absent. `require` in composer.json is a hard dependency — Composer will refuse to install or update if the required package is missing.",
    hint: "One is enforced by Composer, the other is just an ordering hint.",
    topic: "Apr 11 — Architecture Overview + Module System",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 1 — Architecture Overview + Module System"
  },
  {
    question: "Where do layout XML files reside, and why would placing them under `etc/frontend/` be architecturally wrong?",
    answer: "Layout XML files reside in `view/frontend/layout/` (or `view/adminhtml/layout/`). The `etc/` directory tree is exclusively for configuration XML (DI, routes, events, etc.) — placing layout files there would violate Magento's separation of configuration and presentation.",
    hint: "The etc/ tree and the view/ tree serve different purposes.",
    topic: "Apr 11 — Architecture Overview + Module System",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 1 — Architecture Overview + Module System"
  },
  {
    question: "What is the routing mechanism used by the `webapi_rest` and `graphql` areas — and how does it differ from the frontend standard router?",
    answer: "`webapi_rest` routes requests to service contract interfaces (not MVC controllers) via a REST router matching `/rest/V1/<endpoint>`. GraphQL uses a single `/graphql` endpoint and routes via resolver class mappings — neither uses the standard MVC controller dispatch.",
    hint: "No Action.php classes are involved in REST or GraphQL routing.",
    topic: "Apr 11 — Architecture Overview + Module System",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 1 — Architecture Overview + Module System"
  },
  {
    question: "How does `<sequence>` transitivity work, and why does it matter for plugin ordering?",
    answer: "Sequence is transitive: if Module A sequences after Module B, and Module B sequences after Module C, then A loads after C. This means A's plugins will be outer to both B's and C's plugins when sortOrder values are equal.",
    hint: "Chain the dependencies: A → B → C means A loads last of the three.",
    topic: "Apr 11 — Architecture Overview + Module System",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 1 — Architecture Overview + Module System"
  },
  {
    question: "When two plugins target the same method with equal `sortOrder`, which plugin occupies the outer position?",
    answer: "The plugin belonging to the module loaded later in sequence order occupies the outer position, meaning its `before` runs first and its `after` runs last. `sortOrder` is the primary key; sequence is the tiebreaker.",
    hint: "Think about which module wins the 'wrapping' position when sort order is tied.",
    topic: "Apr 11 — Architecture Overview + Module System",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 1 — Architecture Overview + Module System"
  },
  {
    question: "What happens to a module if its `registration.php` is missing or broken, even if `module.xml` is present?",
    answer: "The module is completely invisible to Magento. `registration.php` is the entry point that tells the `ComponentRegistrar` the module exists; without it, no module files are discovered regardless of other configuration.",
    hint: "Think of registration.php as the module's 'handshake' with the framework.",
    topic: "Apr 11 — Architecture Overview + Module System",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 1 — Architecture Overview + Module System"
  },
  {
    question: "Which areas does an observer registered in `etc/events.xml` (global, not area-scoped) fire in?",
    answer: "It fires in ALL areas — frontend, adminhtml, webapi_rest, webapi_soap, graphql, and crontab. To restrict an observer to a specific area, place `events.xml` inside the corresponding area subdirectory (e.g., `etc/frontend/events.xml`).",
    hint: "Global config is the foundation for every area.",
    topic: "Apr 11 — Architecture Overview + Module System",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 1 — Architecture Overview + Module System"
  },
  {
    question: "When should a module be listed in `<sequence>` but NOT in `composer.json` require, and when is omitting it from require architecturally risky?",
    answer: "A module should be in `<sequence>` but not `require` only when the integration is genuinely optional — the depending module must function correctly even if the sequenced module is absent. If the module MUST exist for correct behavior, it must also be in `composer.json` require to enforce installation.",
    hint: "Ask: can my module work at all without the other module installed?",
    topic: "Apr 11 — Architecture Overview + Module System",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 1 — Architecture Overview + Module System"
  },
  {
    question: "Why was `setup_version` removed from modern `module.xml`, and what replaced it?",
    answer: "`setup_version` was replaced by declarative schema via `db_schema.xml`. Modern core modules (2.4.x+) do not include `setup_version` in `module.xml` because schema changes are declared descriptively rather than through versioned install/upgrade scripts.",
    hint: "Think declarative vs. imperative database schema management.",
    topic: "Apr 11 — Architecture Overview + Module System",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 1 — Architecture Overview + Module System"
  },
  {
    question: "Why can the same `frontName` (e.g., 'catalog') exist in both `etc/frontend/routes.xml` and `etc/adminhtml/routes.xml` without conflict?",
    answer: "Because they register to different router IDs — `standard` for frontend and `admin` for adminhtml. The router context isolates them so there is no collision.",
    hint: "Focus on the `router id` attribute, not the frontName value.",
    topic: "Apr 11 — Architecture Overview + Module System",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 1 — Architecture Overview + Module System"
  },
  {
    question: "What is the architectural consequence of placing a plugin in global `etc/di.xml` instead of an area-specific di.xml?",
    answer: "The plugin will execute in every area, including REST, SOAP, GraphQL, and cron — loading unnecessary logic and potentially interfering with contexts where it has no relevance. Always scope plugins to the minimum required area.",
    hint: "Consider what happens during a REST API call if a block-related plugin is globally registered.",
    topic: "Apr 11 — Architecture Overview + Module System",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 1 — Architecture Overview + Module System"
  },
  {
    question: "What causes `registration.php` to execute on every Magento request?",
    answer: "The `autoload.files` entry in `composer.json` lists `registration.php`, causing Composer's autoloader to execute it on every request as part of class autoloading initialization.",
    hint: "Look at the autoload section of composer.json, not the bootstrap directly.",
    topic: "Apr 11 — Architecture Overview + Module System",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 1 — Architecture Overview + Module System"
  },
  {
    question: "In what order does Magento merge di.xml files, and which takes precedence when there is a conflict?",
    answer: "Global `etc/di.xml` files are loaded first (in sequence order across all modules), then area-specific `etc/<area>/di.xml` files are merged on top. The area-specific configuration wins any conflict — it never replaces the global config, it merges over it.",
    hint: "Think 'foundation first, area overrides on top.'",
    topic: "Apr 11 — Architecture Overview + Module System",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 1 — Architecture Overview + Module System"
  },
  {
    question: "What exception type and message does Magento throw when a circular sequence dependency is detected?",
    answer: "Magento throws a `\\LogicException` with the message `\"Circular sequence reference from '<parent>' to '<child>'\"`, raised in `Magento\\Framework\\Module\\ModuleList\\Loader` during module list loading — not exclusively at compile time.",
    hint: "It's not a LocalizedException, and it's not limited to setup:di:compile.",
    topic: "Apr 11 — Architecture Overview + Module System",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 1 — Architecture Overview + Module System"
  },
  {
    question: "What is the correct file for declaring cron job definitions within a module, and which file should NOT be used for this purpose?",
    answer: "Cron job definitions belong in the module's own `etc/crontab.xml`. `cron_groups.xml` is NOT used for individual job declarations — it belongs to `Magento_Cron` for defining cron group infrastructure.",
    hint: "One file declares the jobs, the other declares the groups — they live in different places.",
    topic: "Apr 11 — Architecture Overview + Module System",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 1 — Architecture Overview + Module System"
  },
  {
    question: "Why is it architecturally impossible to declare a plugin on a virtualType?",
    answer: "A virtualType has no PHP class file. The interceptor generator works by reflecting on a real PHP class and extending it — with no PHP class to reflect or extend, no Interceptor can be generated.",
    hint: "Consider what the DI compiler needs in order to generate an Interceptor.php.",
    topic: "Apr 12 — Dependency Injection Deep Dive",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 2 — Dependency Injection Deep Dive"
  },
  {
    question: "Can plugins be declared on private or protected methods, and how do you prevent a public method from being plugged?",
    answer: "No — only public, non-final methods can be intercepted. Marking a method as 'final' prevents plugin interference because the Interceptor cannot override final methods.",
    hint: "Two PHP visibility/modifier keywords are relevant here.",
    topic: "Apr 12 — Dependency Injection Deep Dive",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 2 — Dependency Injection Deep Dive"
  },
  {
    question: "Why should stateful entity models (e.g., Product, Order) be non-shared, and what is the prescribed pattern?",
    answer: "Shared (singleton) instances persist state across operations, risking data contamination between requests. The prescribed pattern is to use a Factory to create a fresh instance per operation.",
    hint: "Consider what happens if the same Product object is reused across two different requests.",
    topic: "Apr 12 — Dependency Injection Deep Dive",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 2 — Dependency Injection Deep Dive"
  },
  {
    question: "What are the THREE legitimate use cases where directly using ObjectManager is acceptable?",
    answer: "Auto-generated Factories, auto-generated Proxies, and test infrastructure (e.g., integration tests using Bootstrap::getObjectManager()). These are the only acceptable cases.",
    hint: "Two of the three are auto-generated files that developers don't write manually.",
    topic: "Apr 12 — Dependency Injection Deep Dive",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 2 — Dependency Injection Deep Dive"
  },
  {
    question: "What does a 'before' plugin method return to modify arguments, and what does it return to leave arguments unchanged?",
    answer: "Return an array of the (modified) arguments to replace them. Return null to leave the original arguments unchanged. The return type is ?array.",
    hint: "There are only two meaningful return values for a before plugin.",
    topic: "Apr 12 — Dependency Injection Deep Dive",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 2 — Dependency Injection Deep Dive"
  },
  {
    question: "In what order does a generated Interceptor's constructor call ___init() relative to parent::__construct()?",
    answer: "___init() is called BEFORE parent::__construct() in the Interceptor constructor. This initializes the plugin chain before the original class is set up.",
    hint: "Think about which must be ready first: the interception infrastructure or the parent object.",
    topic: "Apr 12 — Dependency Injection Deep Dive",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 2 — Dependency Injection Deep Dive"
  },
  {
    question: "What interface do generated Proxy classes implement, and what is the consequence for plugins?",
    answer: "Proxies implement NoninterceptableInterface. As a result, plugins cannot be applied to proxy objects — the proxy delegates to the real object, which may itself have interceptors.",
    hint: "The name of the interface is a strong hint about what it prevents.",
    topic: "Apr 12 — Dependency Injection Deep Dive",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 2 — Dependency Injection Deep Dive"
  },
  {
    question: "What is the correct Magento 2 solution for a circular constructor dependency between ClassA and ClassB?",
    answer: "Inject one of the classes as a Proxy (e.g., ClassB\\Proxy). The proxy defers ClassB's construction until its first method call, breaking the circular instantiation chain. Setter injection is NOT supported.",
    hint: "The answer involves lazy loading, not restructuring the dependency.",
    topic: "Apr 12 — Dependency Injection Deep Dive",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 2 — Dependency Injection Deep Dive"
  },
  {
    question: "How are array <argument> values handled when multiple di.xml files declare the same argument name?",
    answer: "Array arguments are MERGED across di.xml files, not replaced. Using xsi:type=\"null\" on an array item effectively removes that item from the resolved array.",
    hint: "This differs from how scalar arguments behave — one wins, the other doesn't.",
    topic: "Apr 12 — Dependency Injection Deep Dive",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 2 — Dependency Injection Deep Dive"
  },
  {
    question: "What is the key distinction between using <preference> and a plugin when you only need to modify one or two methods of a core class?",
    answer: "A plugin is safer — it augments specific methods and composes with other plugins. A preference replaces the entire class, conflicts with other preferences for the same interface, and is harder to maintain with third-party compatibility.",
    hint: "Think about what happens when two extensions both try to change the same class.",
    topic: "Apr 12 — Dependency Injection Deep Dive",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 2 — Dependency Injection Deep Dive"
  },
  {
    question: "Which di.xml file has the LOWEST override priority, and what overrides it?",
    answer: "app/etc/di.xml has the lowest priority. All module-level etc/di.xml files override it, and area-specific files (e.g., etc/frontend/di.xml) override those.",
    hint: "Think about the order files are loaded and which ones 'win' in a merge conflict.",
    topic: "Apr 12 — Dependency Injection Deep Dive",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 2 — Dependency Injection Deep Dive"
  },
  {
    question: "What is the execution order for 'before' plugins vs 'after' plugins when sortOrder values differ?",
    answer: "Before plugins execute in ascending sortOrder (lowest first). After plugins execute in descending sortOrder (highest first — reverse of before), because around plugins are nested with the lowest sortOrder as the outermost wrapper.",
    hint: "Before and after order are mirrors of each other due to how around plugins nest.",
    topic: "Apr 12 — Dependency Injection Deep Dive",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 2 — Dependency Injection Deep Dive"
  },
  {
    question: "Does replacing a class via <preference> disable plugins declared on the original interface or class?",
    answer: "No. Plugins are on the interceptor chain, not the class itself. Replacing a class with <preference> does NOT disable plugins on the original interface or class.",
    hint: "Think about where in the resolution chain plugins are attached.",
    topic: "Apr 12 — Dependency Injection Deep Dive",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 2 — Dependency Injection Deep Dive"
  },
  {
    question: "When multiple modules declare a <preference> for the same interface, which one wins?",
    answer: "The last loaded module wins, controlled by the <sequence> declaration in module.xml.",
    hint: "Consider how Magento determines module load order.",
    topic: "Apr 12 — Dependency Injection Deep Dive",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 2 — Dependency Injection Deep Dive"
  },
  {
    question: "What does xsi:type=\"object\" shared=\"false\" in a di.xml <argument> do, and how does it relate to the type-level shared setting?",
    answer: "It overrides the type-level shared setting for that specific injection point only, instructing the ObjectManager to create a new instance each time this particular argument is resolved rather than returning the singleton.",
    hint: "The argument-level setting takes precedence over the type-level setting for that one injection.",
    topic: "Apr 12 — Dependency Injection Deep Dive",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 2 — Dependency Injection Deep Dive"
  },
  {
    question: "What does `shared='false'` on an observer declaration in `events.xml` control, and what is the default behavior?",
    answer: "`shared='false'` causes Magento to instantiate a new observer object each time the event is dispatched. The default is `shared='true'` (singleton) — the same observer instance is reused across all dispatches.",
    hint: "This mirrors the object manager's shared vs. non-shared instance concept.",
    topic: "Apr 13 — Plugin System + Events vs Observers",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 3 — Plugin System + Events vs Observers"
  },
  {
    question: "An observer registered in `etc/frontend/events.xml` versus `etc/events.xml` — what is the functional difference, and which file should you use if logic must run in both frontend and REST API contexts?",
    answer: "Observers in `etc/frontend/events.xml` fire only in the frontend area; `etc/events.xml` is global and fires in all areas. For logic that must run in both frontend and REST API, use `etc/events.xml` (global scope) unless the behavior must differ per area.",
    hint: "Scope determines which Magento area (request context) triggers the observer.",
    topic: "Apr 13 — Plugin System + Events vs Observers",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 3 — Plugin System + Events vs Observers"
  },
  {
    question: "What happens when an around plugin fails to call `$proceed()` in all code paths?",
    answer: "The plugin chain breaks silently — no exception is thrown, no log entry is created by default, and all subsequent plugins plus the original method are never executed.",
    hint: "'Silent' is the key word — Magento has no automatic safeguard here.",
    topic: "Apr 13 — Plugin System + Events vs Observers",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 3 — Plugin System + Events vs Observers"
  },
  {
    question: "A before plugin must return what type, and what does returning `null` mean?",
    answer: "A before plugin must return `?array` (nullable array). Returning `null` leaves the original arguments unchanged (no-op), while returning `['modified_value']` replaces the corresponding argument.",
    hint: "The return type is NOT the individual scalar value — it wraps args in a collection.",
    topic: "Apr 13 — Plugin System + Events vs Observers",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 3 — Plugin System + Events vs Observers"
  },
  {
    question: "When two plugins targeting the same method share the same `sortOrder`, what determines which plugin is the outer wrapper?",
    answer: "Module sequence (load order from `module.xml` `<sequence>` declarations) is the tiebreaker. The module loaded later in sequence becomes the outer plugin. There is no alphabetical sorting logic involved.",
    hint: "It's about when the module loads, not what the module is named.",
    topic: "Apr 13 — Plugin System + Events vs Observers",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 3 — Plugin System + Events vs Observers"
  },
  {
    question: "In what order do before/around pre-execution phases and after/around post-execution phases execute relative to sortOrder?",
    answer: "Before and around pre-execution phases run in ascending sortOrder order. After and around post-execution phases unwind in descending (reverse) sortOrder order, creating a proper wrapping stack.",
    hint: "Think of it like nested function calls — the outermost opens first and closes last.",
    topic: "Apr 13 — Plugin System + Events vs Observers",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 3 — Plugin System + Events vs Observers"
  },
  {
    question: "List all five categories of methods/classes that cannot be intercepted by plugins.",
    answer: "(1) `__construct`, (2) `final` methods, (3) `static` methods, (4) non-public methods (`protected`/`private`), and (5) methods of `final` classes. These restrictions are enforced by PHP's object model and Magento's interceptor generation.",
    hint: "Consider what constraints PHP's subclassing mechanism imposes on the generated Interceptor class.",
    topic: "Apr 13 — Plugin System + Events vs Observers",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 3 — Plugin System + Events vs Observers"
  },
  {
    question: "Why must an around plugin's argument list after `Closure $proceed` exactly match the original method's signature?",
    answer: "A mismatch causes a PHP fatal error at runtime (not at compile time). The arguments must be forwarded to `$proceed($arg1, $arg2, ...)` identically to how the original method expects them.",
    hint: "The interceptor passes arguments dynamically — PHP only catches the type mismatch when the code actually executes.",
    topic: "Apr 13 — Plugin System + Events vs Observers",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 3 — Plugin System + Events vs Observers"
  },
  {
    question: "When should you use an event/observer instead of a plugin, architecturally speaking?",
    answer: "Use an event/observer for pure side effects (fire-and-forget reactions like sending email or logging) where return value modification is not needed and multiple decoupled modules need to react independently. Use plugins when you must control return values, modify input arguments, or guarantee execution order.",
    hint: "Ask: does the calling code need to use a modified result, or is this a notification?",
    topic: "Apr 13 — Plugin System + Events vs Observers",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 3 — Plugin System + Events vs Observers"
  },
  {
    question: "What is the correct way to disable a core observer from another module, and what attribute must you match exactly?",
    answer: "Add an `<observer>` entry with `disabled='true'` in your module's `events.xml`, matching the exact `name` attribute of the core observer. The scope of your `events.xml` must also match the scope where the original observer is declared (e.g., global vs. frontend).",
    hint: "Magento merges observer config by the `name` attribute — it's the key, not the `instance` class.",
    topic: "Apr 13 — Plugin System + Events vs Observers",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 3 — Plugin System + Events vs Observers"
  },
  {
    question: "Can an observer modify the return value of the method that dispatched its event? Why or why not?",
    answer: "No. The `execute(Observer $observer)` method returns nothing (void), so there is no mechanism for an observer to pass a modified value back to the dispatching code.",
    hint: "Look at the ObserverInterface contract — what does execute() return?",
    topic: "Apr 13 — Plugin System + Events vs Observers",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 3 — Plugin System + Events vs Observers"
  },
  {
    question: "What is the architectural reason to prefer a plugin over an observer when you need to throw an exception to block an operation (e.g., prevent saving a product with no SKU)?",
    answer: "Observers are for reactions, not gate-keeping — using observers to throw exceptions is an anti-pattern. Plugins (before or around) are the correct mechanism because they execute synchronously within the method call chain and can halt execution predictably.",
    hint: "Think about the intended design role of each mechanism.",
    topic: "Apr 13 — Plugin System + Events vs Observers",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 3 — Plugin System + Events vs Observers"
  },
  {
    question: "If a plugin is declared targeting an interface rather than a concrete class in `di.xml`, which classes are affected?",
    answer: "All classes that implement that interface are intercepted. Every concrete implementation gets the plugin applied through its generated interceptor.",
    hint: "Consider how Magento's DI resolves interface bindings at compile time.",
    topic: "Apr 13 — Plugin System + Events vs Observers",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 3 — Plugin System + Events vs Observers"
  },
  {
    question: "Why does Magento's coding standard recommend preferring before and after plugins over around plugins?",
    answer: "Around plugins carry the risk of silently breaking the plugin chain if `$proceed()` is not called in every code path. Before and after plugins have no such risk, add less overhead, and make intent clearer. Use around only when you genuinely need to wrap behavior on both sides of the original call or need to short-circuit it.",
    hint: "What catastrophic silent failure can only happen with one of the three plugin types?",
    topic: "Apr 13 — Plugin System + Events vs Observers",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 3 — Plugin System + Events vs Observers"
  },
  {
    question: "What does an after plugin's second parameter represent, and what is its return type?",
    answer: "The second parameter is `$result` — the return value of the intercepted method, NOT the original input arguments. The after plugin must return the (possibly modified) result, typed to match the intercepted method's return type.",
    hint: "Think about when in the execution lifecycle the after plugin runs — the original method has already completed.",
    topic: "Apr 13 — Plugin System + Events vs Observers",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 3 — Plugin System + Events vs Observers"
  },
  {
    question: "When deprecating a service contract method, what three requirements must the @deprecated annotation satisfy?",
    answer: "It must include the version number when deprecated (@deprecated X.Y.Z), a @see reference to the replacement method, and the deprecated method must still function correctly until the next major version.",
    hint: "Think: version, replacement reference, and backward compatibility obligation.",
    topic: "Apr 14 — Service Contracts, Repositories & Extension Attributes",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 4 — Service Contracts, Repositories & Extension Attributes"
  },
  {
    question: "Why must Api/Data/ interfaces use typed getter/setter methods instead of magic getData()/setData() patterns?",
    answer: "Typed getters with @return docblocks enable REST/GraphQL schema auto-generation via docblock reflection, provide IDE autocomplete and type safety, and make objects mockable in unit tests. Magic string-key methods produce no schema and cannot be reliably serialized.",
    hint: "Consider what the REST layer needs to generate a predictable JSON schema.",
    topic: "Apr 14 — Service Contracts, Repositories & Extension Attributes",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 4 — Service Contracts, Repositories & Extension Attributes"
  },
  {
    question: "In extension_attributes.xml, what does the <join> directive enable, and when must it be present?",
    answer: "The <join> directive provides JoinProcessorInterface with the JOIN clause definition (reference table, fields). It must be present for extensionAttributesJoinProcessor->process() to automatically add the JOIN when getList() is called, enabling filtering on extension attribute fields.",
    hint: "Without this directive, the JoinProcessor has no information about how to join your table.",
    topic: "Apr 14 — Service Contracts, Repositories & Extension Attributes",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 4 — Service Contracts, Repositories & Extension Attributes"
  },
  {
    question: "What does the @api annotation on a class or interface actually enforce, and what does it NOT do?",
    answer: "@api is a documentation/policy contract signaling stable public API status, enforced by code review and static analysis tools. It does NOT make the class final, prevent extension, or enforce anything at PHP runtime.",
    hint: "It is a promise, not a PHP language construct.",
    topic: "Apr 14 — Service Contracts, Repositories & Extension Attributes",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 4 — Service Contracts, Repositories & Extension Attributes"
  },
  {
    question: "What is the difference between getTotalCount() and count(getItems()) on a SearchResultsInterface object?",
    answer: "getTotalCount() returns the total number of matching records before pagination; count(getItems()) returns only the count of items on the current page. Using count(getItems()) as total count is a bug that breaks pagination.",
    hint: "One number is needed for the 'showing X of Y' display; the other is just the page size.",
    topic: "Apr 14 — Service Contracts, Repositories & Extension Attributes",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 4 — Service Contracts, Repositories & Extension Attributes"
  },
  {
    question: "What is the implication of the identity map cache in a repository like ProductRepository?",
    answer: "Calling getById(x) twice returns the same object instance. Mutating the returned object mutates the cached copy, potentially causing subtle bugs if the object is modified without being saved.",
    hint: "Repositories store previously loaded entities to avoid redundant queries.",
    topic: "Apr 14 — Service Contracts, Repositories & Extension Attributes",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 4 — Service Contracts, Repositories & Extension Attributes"
  },
  {
    question: "When should you use a <preference> vs. a plugin to extend an existing repository's behaviour?",
    answer: "Use an after plugin — multiple modules can each add plugins without conflict. Using <preference> means only one preference can win, causing conflicts if multiple modules try to replace the same repository.",
    hint: "Think about what happens when two independent modules both need to extend the same class.",
    topic: "Apr 14 — Service Contracts, Repositories & Extension Attributes",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 4 — Service Contracts, Repositories & Extension Attributes"
  },
  {
    question: "What is the architectural difference between Extension Attributes and EAV attributes in terms of storage?",
    answer: "Extension attributes are NOT EAV — they require your own dedicated join table and explicit JOIN logic. EAV attributes use dynamic eav_attribute and value tables with no schema change required.",
    hint: "One system forces you to design your own table; the other stores data dynamically.",
    topic: "Apr 14 — Service Contracts, Repositories & Extension Attributes",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 4 — Service Contracts, Repositories & Extension Attributes"
  },
  {
    question: "How does the REST API determine JSON serialization types for @api interface methods, given that core @api interfaces have no PHP return type hints?",
    answer: "The REST API layer uses PHPDoc reflection to read @return docblock annotations — not PHP type declarations — to determine serialization types. Missing or 'mixed' @return annotations break REST serialization.",
    hint: "Look at what the REST layer reads at runtime, not what PHP enforces at compile time.",
    topic: "Apr 14 — Service Contracts, Repositories & Extension Attributes",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 4 — Service Contracts, Repositories & Extension Attributes"
  },
  {
    question: "Which Magento exception types map to HTTP 400 Bad Request via ErrorProcessor?",
    answer: "All LocalizedException subclasses except NoSuchEntityException and AuthorizationException/AuthenticationException — including CouldNotSaveException, CouldNotDeleteException, StateException, and InputException — map to 400 Bad Request.",
    hint: "The key criterion is whether the exception extends LocalizedException but is not the 404 or 401 special cases.",
    topic: "Apr 14 — Service Contracts, Repositories & Extension Attributes",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 4 — Service Contracts, Repositories & Extension Attributes"
  },
  {
    question: "What HTTP status code does AuthorizationException map to in Magento's REST ErrorProcessor, and why is this an exam trap?",
    answer: "AuthorizationException maps to 401 Unauthorized, not 403 Forbidden. Candidates often assume authorization failures map to 403.",
    hint: "Check the HTTP semantics: 401 is about authentication/authorization in Magento's mapping.",
    topic: "Apr 14 — Service Contracts, Repositories & Extension Attributes",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 4 — Service Contracts, Repositories & Extension Attributes"
  },
  {
    question: "Why does a repository's getById() throw NoSuchEntityException instead of returning null when an entity is not found?",
    answer: "The service contract guarantees either a valid object or an explicit exception. Returning null is ambiguous and causes the REST API layer to serialize an empty response instead of a proper HTTP 404.",
    hint: "The REST layer converts specific exception types to HTTP status codes automatically.",
    topic: "Apr 14 — Service Contracts, Repositories & Extension Attributes",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 4 — Service Contracts, Repositories & Extension Attributes"
  },
  {
    question: "What must a repository's getList() implementation explicitly call before applying SearchCriteria to the collection, and why?",
    answer: "It must call extensionAttributesJoinProcessor->process($collection) before loading or filtering the collection, so extension attribute tables are JOINed into the query enabling filtering and data population.",
    hint: "Without this call, extension attribute fields are invisible to the SQL query.",
    topic: "Apr 14 — Service Contracts, Repositories & Extension Attributes",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 4 — Service Contracts, Repositories & Extension Attributes"
  },
  {
    question: "What is the difference between SearchCriteriaBuilder's addFilter() and addFilters([f1, f2]) in terms of FilterGroup creation?",
    answer: "addFilter() creates a new FilterGroup for each call (AND logic with previous filters); addFilters([f1, f2]) places both filters in the same FilterGroup (OR logic between them).",
    hint: "One call, one group — but how many filters per group determines OR vs AND.",
    topic: "Apr 14 — Service Contracts, Repositories & Extension Attributes",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 4 — Service Contracts, Repositories & Extension Attributes"
  },
  {
    question: "Filters placed in the SAME FilterGroup vs. different FilterGroups in SearchCriteria produce what logical operators?",
    answer: "Filters in the same FilterGroup produce OR logic; filters in different FilterGroups produce AND logic.",
    hint: "Think of a group as a single parenthesized OR clause, combined with other groups via AND.",
    topic: "Apr 14 — Service Contracts, Repositories & Extension Attributes",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 4 — Service Contracts, Repositories & Extension Attributes"
  },
  {
    question: "In webapi.xml, what must the 'class' attribute in <service> point to, and where must it reside?",
    answer: "It must point to a PHP interface (not a concrete class) located under the module's Api/ directory. A method not declared in an Api/ interface is never exposed via REST regardless of webapi.xml entries.",
    hint: "Think about service contracts and the specific directory convention.",
    topic: "Apr 15 — REST & GraphQL API Design",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 5 — REST & GraphQL API Design"
  },
  {
    question: "What does ref=\"self\" enforce in webapi.xml, and which token types does it apply to?",
    answer: "It restricts a caller to accessing only their own customer data, enforced at the framework level before the service is called. It applies only to customer tokens — admin and integration tokens bypass it entirely.",
    hint: "Consider who can be blocked by this setting and who can't.",
    topic: "Apr 15 — REST & GraphQL API Design",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 5 — REST & GraphQL API Design"
  },
  {
    question: "How does Magento map a PHP getter on an Api/Data/ interface to a JSON key in the REST response?",
    answer: "DataObjectHelper automatically strips the 'get' prefix and converts the remainder to snake_case. For example, getExtensionAttributes() becomes 'extension_attributes' in JSON — no annotation is required.",
    hint: "Think about the naming convention transformation applied to getter method names.",
    topic: "Apr 15 — REST & GraphQL API Design",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 5 — REST & GraphQL API Design"
  },
  {
    question: "An ERP pushes 10,000 product price updates nightly using synchronous REST POST calls in a loop. What is the correct API mode and URL pattern to recommend?",
    answer: "Use /rest/async/bulk/V1/products with arrays of operations per request. This decouples processing from the HTTP lifecycle via RabbitMQ and avoids timeouts, unlike sync calls or single-async which creates 10,000 separate queue messages.",
    hint: "Consider which mode handles mass data operations as an array payload.",
    topic: "Apr 15 — REST & GraphQL API Design",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 5 — REST & GraphQL API Design"
  },
  {
    question: "Why can async REST endpoints not be used for GET requests?",
    answer: "The async/queue model publishes write operations to a message queue and returns a bulk UUID — there is no mechanism to return fetched data to the caller. Async is architecturally write-operations only.",
    hint: "Think about how the queue model delivers results back to the requester.",
    topic: "Apr 15 — REST & GraphQL API Design",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 5 — REST & GraphQL API Design"
  },
  {
    question: "What are the default expiry times for admin tokens and customer tokens, and which authentication mechanism is non-expiring?",
    answer: "Admin tokens expire after 4 hours and customer tokens after 1 hour by default. OAuth 1.0a integration tokens are non-expiring (valid until revoked), making them correct for long-running machine-to-machine integrations.",
    hint: "Think about which mechanism is suited for a permanent ERP connection.",
    topic: "Apr 15 — REST & GraphQL API Design",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 5 — REST & GraphQL API Design"
  },
  {
    question: "What is the correct way to add a new GraphQL query from a custom module without modifying core files?",
    answer: "Use 'extend type Query { ... }' in your module's etc/schema.graphqls. This merges at schema compilation time without touching vendor files, equivalent to a non-invasive di.xml plugin pattern.",
    hint: "There is a specific GraphQL keyword that merges rather than replaces.",
    topic: "Apr 15 — REST & GraphQL API Design",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 5 — REST & GraphQL API Design"
  },
  {
    question: "What is the method signature difference between ResolverInterface and BatchResolverInterface, and what is the critical parameter order distinction?",
    answer: "ResolverInterface: resolve(Field $field, $context, ResolveInfo $info, ?array $value, ?array $args). BatchResolverInterface: resolve(ContextInterface $context, Field $field, array $requests): BatchResponse — context is the FIRST parameter, not second.",
    hint: "Focus on which parameter comes first and the return type.",
    topic: "Apr 15 — REST & GraphQL API Design",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 5 — REST & GraphQL API Design"
  },
  {
    question: "What methods does BatchRequestItemInterface expose, and which method does it notably NOT have?",
    answer: "It provides getValue(): ?array (parent data), getArgs(): ?array, and getInfo(): ResolveInfo. It does NOT have getContext() — context is passed as the first parameter to BatchResolverInterface::resolve() instead.",
    hint: "Think about where context comes from in a batch resolver versus where you might mistakenly look for it.",
    topic: "Apr 15 — REST & GraphQL API Design",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 5 — REST & GraphQL API Design"
  },
  {
    question: "When should a GraphQL field resolver implement BatchResolverInterface instead of ResolverInterface?",
    answer: "When the field appears on a type that can be part of a list (e.g., items { custom_field }). Without batching, each item triggers a separate query (N+1 problem); BatchResolverInterface collects all requests and issues one batch query.",
    hint: "Think about where this field appears in the query structure — top-level vs. inside a collection.",
    topic: "Apr 15 — REST & GraphQL API Design",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 5 — REST & GraphQL API Design"
  },
  {
    question: "What does the @typeResolver directive on a GraphQL interface do, and which Magento class uses it for products?",
    answer: "It specifies a PHP class that determines the concrete GraphQL type at runtime for polymorphic interfaces. For products, Magento uses ProductInterfaceTypeResolverComposite to resolve whether a product is SimpleProduct, ConfigurableProduct, etc.",
    hint: "Think about how GraphQL handles a field that could return different concrete types.",
    topic: "Apr 15 — REST & GraphQL API Design",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 5 — REST & GraphQL API Design"
  },
  {
    question: "If a @resolver directive in schema.graphqls references an interface rather than a concrete class, what additional configuration is required?",
    answer: "A <preference> entry in di.xml is required to map the interface to its concrete implementation. If the directive points directly to a concrete class, di.xml wiring is optional since the object manager can instantiate it directly.",
    hint: "Think about how Magento's dependency injection handles interface-to-class binding.",
    topic: "Apr 15 — REST & GraphQL API Design",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 5 — REST & GraphQL API Design"
  },
  {
    question: "For the @cache directive on a GraphQL query to activate FPC caching, what two conditions must be met?",
    answer: "The request must be sent via HTTP GET, and the query must include @cache(cacheIdentity: \"...\") pointing to a cache identity provider class. The directive has no effect on POST requests.",
    hint: "One condition is in the schema file; the other is about the HTTP method used.",
    topic: "Apr 15 — REST & GraphQL API Design",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 5 — REST & GraphQL API Design"
  },
  {
    question: "Why is validating customer ownership inside the service implementation architecturally inferior to using ref=\"self\"?",
    answer: "It couples security logic to business logic and forces every implementation to repeat the same guard. ref=\"self\" enforces ownership declaratively at the framework layer before the service is even invoked.",
    hint: "Think about separation of concerns and where security checks belong.",
    topic: "Apr 15 — REST & GraphQL API Design",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 5 — REST & GraphQL API Design"
  },
  {
    question: "What happens to FPC/Varnish caching if a PWA sends all GraphQL requests (both queries and mutations) via HTTP POST?",
    answer: "All responses bypass FPC entirely because Varnish does not cache POST requests per HTTP spec. This means even identical product/category queries hit the application on every request — a major performance anti-pattern.",
    hint: "Consider what HTTP method Varnish will and won't cache by spec.",
    topic: "Apr 15 — REST & GraphQL API Design",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 5 — REST & GraphQL API Design"
  },
  {
    question: "What are the two architectural scenarios where DB Queue is preferred over RabbitMQ?",
    answer: "DB Queue is preferred for Magento Open Source (RabbitMQ not available), low-volume processing (under ~500 messages/hour), or when transactional consistency with MySQL is required. RabbitMQ is required for high volume, parallel consumers, or dead-letter queue support.",
    hint: "Think about what capabilities RabbitMQ adds that MySQL-based polling cannot provide.",
    topic: "Apr 16 — Request Flow, Routing & External Integrations",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 6 — Request Flow, Routing & External Integrations"
  },
  {
    question: "What are the correct sortOrder values for the four frontend area routers in Magento 2?",
    answer: "URL Rewrite Router = 20, Standard/Base Router = 30, CMS Router = 60, Default/404 Router = 100. The Admin Router (sortOrder 10) exists only in the adminhtml area.",
    hint: "Remember: URL Rewrite runs before Standard, not after.",
    topic: "Apr 16 — Request Flow, Routing & External Integrations",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 6 — Request Flow, Routing & External Integrations"
  },
  {
    question: "Why must the URL Rewrite Router (sortOrder 20) run before the Standard Router (sortOrder 30)?",
    answer: "The URL Rewrite Router rewrites $request->setPathInfo() and issues a Forward so the Standard Router can then match the rewritten path. If Standard ran first, it would 404 on pretty URLs like /my-product.html before rewriting could occur.",
    hint: "Think about what happens when /my-product.html hits the Standard Router before rewriting.",
    topic: "Apr 16 — Request Flow, Routing & External Integrations",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 6 — Request Flow, Routing & External Integrations"
  },
  {
    question: "What is the key behavioral difference between _forward and _redirect in terms of HTTP requests and browser URL?",
    answer: "_forward mutates the Request object and re-enters the dispatch loop — 1 HTTP request, URL unchanged. _redirect sends a 302 response causing the browser to make a new request — 2 HTTP requests, URL changes.",
    hint: "Consider what the browser's address bar shows after each operation.",
    topic: "Apr 16 — Request Flow, Routing & External Integrations",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 6 — Request Flow, Routing & External Integrations"
  },
  {
    question: "Why must _redirect (not _forward) be used after a POST form submission?",
    answer: "Because of the Post/Redirect/Get (PRG) pattern. Using _forward after a POST keeps the POST state in browser history, so a refresh resubmits the form. A redirect causes the browser to GET the next page, preventing double-submission.",
    hint: "Think about what happens when a user presses the browser's Back or Refresh button.",
    topic: "Apr 16 — Request Flow, Routing & External Integrations",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 6 — Request Flow, Routing & External Integrations"
  },
  {
    question: "Which ResultFactory type should be used for an AJAX endpoint returning cart item count, and why is TYPE_PAGE wrong for this use case?",
    answer: "TYPE_JSON should be used — it auto-encodes data and sets Content-Type: application/json. TYPE_PAGE loads the entire layout XML rendering pipeline, which is expensive and architecturally inappropriate for AJAX responses.",
    hint: "Consider the cost of loading layout handles, blocks, and templates for a simple JSON response.",
    topic: "Apr 16 — Request Flow, Routing & External Integrations",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 6 — Request Flow, Routing & External Integrations"
  },
  {
    question: "Which ResultFactory type is correct for serving a PDF invoice download, and what makes it suitable?",
    answer: "TYPE_RAW is correct. It bypasses all layout processing, giving full control over response headers (e.g., Content-Type: application/pdf, Content-Disposition) and binary response body content.",
    hint: "Think about what type gives you a blank response canvas with no layout system involvement.",
    topic: "Apr 16 — Request Flow, Routing & External Integrations",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 6 — Request Flow, Routing & External Integrations"
  },
  {
    question: "Where are custom routers registered, and what is the critical contract the match() method must fulfill?",
    answer: "Custom routers are registered in di.xml as items in the Magento\\Framework\\App\\RouterList argument — NOT in routes.xml. The match() method must return null if the URL does not belong to this router; returning anything else stops the entire router chain.",
    hint: "Confusing routes.xml with di.xml is a common exam trap. Also consider what happens if match() never returns null.",
    topic: "Apr 16 — Request Flow, Routing & External Integrations",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 6 — Request Flow, Routing & External Integrations"
  },
  {
    question: "How many arguments does ActionFactory::create() accept in a custom router implementation?",
    answer: "Exactly one argument — the fully qualified class name string. There is no second $data array parameter. The request is mutated via setModuleName()/setControllerName()/setActionName() before calling create().",
    hint: "Check the actual ActionFactory::create() signature in the framework source.",
    topic: "Apr 16 — Request Flow, Routing & External Integrations",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 6 — Request Flow, Routing & External Integrations"
  },
  {
    question: "What is the functional difference between communication.xml and queue.xml in Magento's message queue system?",
    answer: "communication.xml defines the topic name and its data type contract. queue.xml defines how messages on that topic are consumed — the queue name, connection type (db or amqp), handler class::method, and maxMessages. Both are required for async processing.",
    hint: "One defines the 'what', the other defines the 'how and where'.",
    topic: "Apr 16 — Request Flow, Routing & External Integrations",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 6 — Request Flow, Routing & External Integrations"
  },
  {
    question: "What happens to async messages if the queue:consumers:start process is not running?",
    answer: "Messages accumulate in the queue unprocessed indefinitely. HTTP requests that publish messages still return 200 (the publish succeeds), but the actual background work never executes. This is a deployment configuration issue, not a code bug.",
    hint: "The publisher's success does not depend on whether a consumer is active.",
    topic: "Apr 16 — Request Flow, Routing & External Integrations",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 6 — Request Flow, Routing & External Integrations"
  },
  {
    question: "Why is maxMessages set on queue consumers, and what happens when the limit is reached?",
    answer: "maxMessages prevents memory leaks in long-running PHP processes. When the limit is reached, the consumer process exits cleanly. On Adobe Commerce Cloud, supervisord automatically restarts it so processing continues.",
    hint: "Think about long-running PHP process memory behavior over thousands of message iterations.",
    topic: "Apr 16 — Request Flow, Routing & External Integrations",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 6 — Request Flow, Routing & External Integrations"
  },
  {
    question: "On Adobe Commerce Cloud, how are RabbitMQ consumers managed, and why is this architecturally different from DB queue consumers?",
    answer: "RabbitMQ consumers on Cloud are long-running processes managed by supervisord, which auto-restarts them on failure. They are NOT cron jobs. DB queue consumers can be run as cron jobs since they exit when the queue is empty (consumers_wait_for_messages=0).",
    hint: "Consider the process lifecycle model: persistent daemon vs. periodic job.",
    topic: "Apr 16 — Request Flow, Routing & External Integrations",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 6 — Request Flow, Routing & External Integrations"
  },
  {
    question: "When should Adobe I/O Events be chosen over a message queue for external system notification?",
    answer: "Use I/O Events for outbound notifications to external systems (ERP, CRM, App Builder) when near-real-time push delivery is needed. Message queues are for internal async deferral within Magento. Using a queue to notify an external system introduces unnecessary coupling.",
    hint: "The key distinction is internal vs. external, and push vs. poll.",
    topic: "Apr 16 — Request Flow, Routing & External Integrations",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 6 — Request Flow, Routing & External Integrations"
  },
  {
    question: "What does Bootstrap's role of setting the area code determine at runtime?",
    answer: "The area code set by Bootstrap determines which DI configuration (di.xml), layout XML files, and translations are loaded for the request. Using the wrong area code is a common misconfiguration that causes plugins, layouts, or translations to not apply.",
    hint: "Consider all three types of configuration that are area-scoped in Magento.",
    topic: "Apr 16 — Request Flow, Routing & External Integrations",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 6 — Request Flow, Routing & External Integrations"
  },
  {
    question: "Which interface must a ViewModel implement, and what methods does it require?",
    answer: "ViewModels must implement `Magento\\Framework\\View\\Element\\Block\\ArgumentInterface`. It is an empty marker interface — it imposes no required methods. (Note: there is no `ViewModelInterface` in the Magento framework.)",
    hint: "It's a marker — its purpose is identification, not method enforcement.",
    topic: "Apr 18 — UI Components, Layout XML & ViewModel Pattern",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 8 — UI Components, Layout XML & ViewModel Pattern"
  },
  {
    question: "Does injecting a ViewModel via Layout XML require a `di.xml` entry, and what DI features does the ViewModel still support?",
    answer: "No `di.xml` entry is required for basic injection — the class name in `xsi:type=\"object\"` is resolved directly by the ObjectManager. However, ViewModels are fully DI-managed and support preferences, plugins, and virtual types.",
    hint: "Direct class name resolution vs. explicit wiring — and full DI participation.",
    topic: "Apr 18 — UI Components, Layout XML & ViewModel Pattern",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 8 — UI Components, Layout XML & ViewModel Pattern"
  },
  {
    question: "What is the purpose of the `as` attribute on a `<block>` declaration, and how does it differ from the `name` attribute?",
    answer: "`as` is the alias used by the parent template when calling `$block->getChildHtml('alias')` — it is scoped to the parent-child relationship. `name` is the globally unique identifier for the block within the entire layout tree for that request and is used by `referenceBlock` and other directives.",
    hint: "One is for parent-child template calls; the other is globally unique across the whole page.",
    topic: "Apr 18 — UI Components, Layout XML & ViewModel Pattern",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 8 — UI Components, Layout XML & ViewModel Pattern"
  },
  {
    question: "What is the difference between the base DataProvider class for listing components vs. form components, including their fully-qualified class names?",
    answer: "Listing DataProviders extend `Magento\\Framework\\View\\Element\\UiComponent\\DataProvider\\DataProvider`, which implements the full SearchCriteria pattern. Form DataProviders extend `Magento\\Ui\\DataProvider\\AbstractDataProvider` and override `getData()` to return keyed entity arrays.",
    hint: "One is in the Framework namespace; the other is in the Ui module namespace.",
    topic: "Apr 18 — UI Components, Layout XML & ViewModel Pattern",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 8 — UI Components, Layout XML & ViewModel Pattern"
  },
  {
    question: "What is the behavioral difference between `remove` and `display=\"false\"` in Layout XML regarding block instantiation and reversibility?",
    answer: "`remove` permanently eliminates the block for the entire request — it is never instantiated, and no subsequent layout handle can restore it. `display=\"false\"` keeps the block instantiated in the tree but suppresses output; it can be toggled back to visible via PHP or a later handle.",
    hint: "Think about which one still runs the PHP constructor and which one is truly irreversible.",
    topic: "Apr 18 — UI Components, Layout XML & ViewModel Pattern",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 8 — UI Components, Layout XML & ViewModel Pattern"
  },
  {
    question: "What is the earliest safe point in a block's lifecycle to call `$this->getLayout()->getBlock()`, and why can't the constructor be used?",
    answer: "`_prepareLayout()` is the earliest safe point because the block has already been added to the layout tree. In the constructor, the block may not yet be attached to the layout, making layout lookups unreliable.",
    hint: "Think about the order: instantiation happens before the block joins the tree.",
    topic: "Apr 18 — UI Components, Layout XML & ViewModel Pattern",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 8 — UI Components, Layout XML & ViewModel Pattern"
  },
  {
    question: "In Layout XML, what is the correct XML structure for passing a ViewModel to a block, and how is it accessed in the template?",
    answer: "Wrap arguments in `<arguments>` (plural), then use `<argument name=\"view_model\" xsi:type=\"object\">Vendor\\Module\\ViewModel\\MyViewModel</argument>`. In the template, access it via `$block->getData('view_model')`.",
    hint: "Remember the plural wrapper is specific to layout XML, not ui_component XML.",
    topic: "Apr 18 — UI Components, Layout XML & ViewModel Pattern",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 8 — UI Components, Layout XML & ViewModel Pattern"
  },
  {
    question: "When `referenceBlock` targets a block that does not exist for the current layout handle, what happens?",
    answer: "It silently fails — no exception is thrown. This is a common source of bugs in third-party modules where the block name is misspelled or the block is not present on that page type.",
    hint: "Magento's layout system is tolerant of missing references in a particular way.",
    topic: "Apr 18 — UI Components, Layout XML & ViewModel Pattern",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 8 — UI Components, Layout XML & ViewModel Pattern"
  },
  {
    question: "What is the critical syntax difference between arguments in Layout XML files vs. UI Component XML files?",
    answer: "Layout XML uses `<arguments>` (plural) as an outer wrapper with `<argument>` tags inside. UI Component XML uses `<argument>` directly on the component element (no wrapper) with `<item>` tags for nested values. Mixing these syntaxes is the #1 UI Component error.",
    hint: "One uses a plural wrapper; the other goes straight to the element with nested items.",
    topic: "Apr 18 — UI Components, Layout XML & ViewModel Pattern",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 8 — UI Components, Layout XML & ViewModel Pattern"
  },
  {
    question: "What does `definition.xml` do in the UI Component system, where is it located, and how do you extend it in a custom module?",
    answer: "`definition.xml` maps UI component type names (e.g., `<listing>`, `<column>`) to their PHP classes. It lives at `view/base/ui_component/etc/definition.xml` in `Magento_Ui`. To register custom component types, place your `definition.xml` in your module's `view/base/ui_component/etc/` directory.",
    hint: "It's a registry — component names in ui_component XML are not arbitrary strings.",
    topic: "Apr 18 — UI Components, Layout XML & ViewModel Pattern",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 8 — UI Components, Layout XML & ViewModel Pattern"
  },
  {
    question: "What three locations must share the exact same name string for DataProvider wiring in a UI Component listing to work correctly?",
    answer: "(1) The `name` attribute on the `<dataSource>` element in the ui_component XML, (2) the key in the `CollectionFactory` `collections` array in `di.xml`, and (3) the `name` constructor argument passed to the DataProvider class. A mismatch in any of these breaks the wiring silently.",
    hint: "Think of it as a three-way contract — all three sides must match.",
    topic: "Apr 18 — UI Components, Layout XML & ViewModel Pattern",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 8 — UI Components, Layout XML & ViewModel Pattern"
  },
  {
    question: "Which base class should a custom Grid Collection extend, and what does this give you?",
    answer: "It should extend `Magento\\Framework\\View\\Element\\UiComponent\\DataProvider\\SearchResult`. This provides SearchCriteria-based filtering, sorting, and pagination out of the box, integrated with the UI Component framework.",
    hint: "It's in the DataProvider namespace of the Framework, not the Ui module.",
    topic: "Apr 18 — UI Components, Layout XML & ViewModel Pattern",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 8 — UI Components, Layout XML & ViewModel Pattern"
  },
  {
    question: "What is the architectural purpose of `AddFieldToCollectionInterface` and `AddFilterToCollectionInterface`, and in which namespace do they live?",
    answer: "These strategy interfaces allow third-party modules to add columns or filters to an existing DataProvider's collection via `di.xml` without modifying the core DataProvider class. They live in the `Magento\\Ui\\DataProvider` namespace — NOT in `Magento\\Framework`.",
    hint: "This is an extension point; the namespace is the Ui module, not the Framework module.",
    topic: "Apr 18 — UI Components, Layout XML & ViewModel Pattern",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 8 — UI Components, Layout XML & ViewModel Pattern"
  },
  {
    question: "Why are UI Components inappropriate for standard frontend catalog or CMS pages, and what should be used instead?",
    answer: "UI Components require KnockoutJS and RequireJS and are designed for admin grids/forms with two-way data binding. Frontend catalog and CMS pages should use Blocks + Templates + ViewModels, which are server-side rendered and don't carry the KnockoutJS dependency overhead.",
    hint: "Consider the JavaScript dependency and the primary environment each system was designed for.",
    topic: "Apr 18 — UI Components, Layout XML & ViewModel Pattern",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 8 — UI Components, Layout XML & ViewModel Pattern"
  },
  {
    question: "What must you override in a Block subclass to prevent showing incorrect cached output to different customer groups, and what should it return?",
    answer: "Override `getCacheKeyInfo()` and include dimensions like customer group ID, store ID, and relevant URL parameters in the returned array. The cache system uses this array to generate a unique cache key per variation.",
    hint: "The method name contains the word 'key' — think about what makes each customer's view unique.",
    topic: "Apr 18 — UI Components, Layout XML & ViewModel Pattern",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 8 — UI Components, Layout XML & ViewModel Pattern"
  },
  {
    question: "What are the only acceptable places in Adobe Commerce production code where the Object Manager may be called directly?",
    answer: "Factory classes, Proxy classes, test bootstrap files, and app/bootstrap.php. In all other production code, dependencies must be injected via constructor injection through the DI system.",
    hint: "There are exactly four exceptions — they're all infrastructure-level, not business logic.",
    topic: "Apr 17 — Practice Test #1 + Gap Analysis",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 7 — Practice Test #1 + Gap Analysis"
  },
  {
    question: "When a before() plugin returns null versus returns an array, what is the behavioral difference?",
    answer: "Returning null leaves the original method arguments unchanged. Returning an array replaces the arguments passed to the original method with the values in that array. The return type must be ?array (nullable).",
    hint: "The return type signature itself is a clue — it's nullable for a reason.",
    topic: "Apr 17 — Practice Test #1 + Gap Analysis",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 7 — Practice Test #1 + Gap Analysis"
  },
  {
    question: "For a method intercepted by three plugins with sortOrder 10, 20, and 30, in what order do the after() plugins execute relative to the before() plugins?",
    answer: "Before plugins execute in ascending sortOrder (10→20→30), then the original method runs, then after plugins execute in reverse order (30→20→10), unwinding like a stack.",
    hint: "Think of it as a Russian nesting doll — what goes in last comes out first.",
    topic: "Apr 17 — Practice Test #1 + Gap Analysis",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 7 — Practice Test #1 + Gap Analysis"
  },
  {
    question: "Why can a plugin NOT be applied to another plugin's generated Interceptor class?",
    answer: "Generated Interceptor classes implement NoninterceptableInterface, which explicitly prevents further plugin interception. Plugins cannot intercept other plugins.",
    hint: "There's a specific interface name that enforces this restriction.",
    topic: "Apr 17 — Practice Test #1 + Gap Analysis",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 7 — Practice Test #1 + Gap Analysis"
  },
  {
    question: "An around() plugin that always calls $proceed() with no conditional logic and no modification of arguments or return value is considered what, and what should be used instead?",
    answer: "It is a code smell (anti-pattern). An after() plugin should be used instead, as around() carries performance overhead and risks breaking the plugin chain if $proceed() is accidentally omitted.",
    hint: "If you're not short-circuiting execution, you don't need the most powerful tool.",
    topic: "Apr 17 — Practice Test #1 + Gap Analysis",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 7 — Practice Test #1 + Gap Analysis"
  },
  {
    question: "In Adobe Commerce, what is the ONLY architecturally correct way to wire a heavy dependency that may never be called in a given request, and how is it declared?",
    answer: "Use a Proxy class, declared in di.xml by appending \\Proxy to the class name in the argument definition. It defers instantiation until the dependency is actually accessed. Session objects must always be injected via Proxy.",
    hint: "Think about 'deferred instantiation' — the opposite of eager loading.",
    topic: "Apr 17 — Practice Test #1 + Gap Analysis",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 7 — Practice Test #1 + Gap Analysis"
  },
  {
    question: "Where must the IdentityInterface cache identity class be registered for a GraphQL resolver, and what is the exact mechanism?",
    answer: "It must be registered via the @cache directive in the schema.graphqls file using @cache(cacheIdentity: \"Vendor\\\\Module\\\\Model\\\\Resolver\\\\Cache\\\\IdentityClass\"). It is NOT wired through di.xml arguments.",
    hint: "Look at the schema definition file, not the DI configuration file.",
    topic: "Apr 17 — Practice Test #1 + Gap Analysis",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 7 — Practice Test #1 + Gap Analysis"
  },
  {
    question: "What is the behavioral difference between calling addFilter() multiple times on a SearchCriteriaBuilder versus calling addFilters() with an array?",
    answer: "Multiple addFilter() calls each create a new FilterGroup, and groups are combined with AND logic. addFilters(array) places all filters in the same FilterGroup, combining them with OR logic within the group.",
    hint: "The difference is whether filters share a group or each get their own group.",
    topic: "Apr 17 — Practice Test #1 + Gap Analysis",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 7 — Practice Test #1 + Gap Analysis"
  },
  {
    question: "When two modules both declare a preference for the same interface in their di.xml files, which preference wins and what determines load order?",
    answer: "The last module loaded wins. Load order is determined by sequence declarations in module.xml, not alphabetical order. This conflict is why preferences should be avoided when a plugin would suffice.",
    hint: "The resolution mechanism is the same as CSS specificity — last declaration wins, and order is controlled by dependencies.",
    topic: "Apr 17 — Practice Test #1 + Gap Analysis",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 7 — Practice Test #1 + Gap Analysis"
  },
  {
    question: "What is a Virtual Type in Magento DI, and what are its two key limitations compared to a real PHP class?",
    answer: "A Virtual Type is a configuration-only variant of an existing class created entirely in di.xml with no PHP file. It cannot be extended in PHP (it's a config construct only) and exists only in the compiled DI output.",
    hint: "It lives in XML, not in a .php file — that tells you what it can and can't do.",
    topic: "Apr 17 — Practice Test #1 + Gap Analysis",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 7 — Practice Test #1 + Gap Analysis"
  },
  {
    question: "What is the key architectural distinction between Extension Attributes and Custom Attributes (EAV) in Adobe Commerce?",
    answer: "Custom Attributes are EAV-based, apply to catalog/customer entities, have EAV query overhead, and can be admin-configurable. Extension Attributes apply to ANY entity with a service contract, are stored in custom tables, and are defined via extension_attributes.xml to expose developer-added fields through the API.",
    hint: "One is for store admins to configure; the other is for developers to extend the API.",
    topic: "Apr 17 — Practice Test #1 + Gap Analysis",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 7 — Practice Test #1 + Gap Analysis"
  },
  {
    question: "In what area code do CLI commands run by default, and what must a developer do if the CLI command requires frontend context?",
    answer: "CLI commands run in the global area by default. If frontend context is needed, the developer must explicitly set the area code programmatically within the command.",
    hint: "The default area for command-line execution is not 'frontend' — it's the catch-all area.",
    topic: "Apr 17 — Practice Test #1 + Gap Analysis",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 7 — Practice Test #1 + Gap Analysis"
  },
  {
    question: "Why should a GraphQL mutation result NEVER be cached by Varnish or Fastly, and which schema directive prevents even a query from being cached?",
    answer: "Mutations are POST requests, and by HTTP specification POST requests are never cached by reverse proxies. To prevent a query from being cached, use @cache(cacheable: false) in schema.graphqls.",
    hint: "The answer lies in HTTP method semantics and a specific schema annotation.",
    topic: "Apr 17 — Practice Test #1 + Gap Analysis",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 7 — Practice Test #1 + Gap Analysis"
  },
  {
    question: "When should an Event/Observer be chosen over a Plugin to customize behavior, and what is the critical limitation that makes Observers unsuitable for price modification?",
    answer: "Use Event/Observer when the core already dispatches a relevant event and you only need side effects (logging, emails, indexing). Observers cannot modify the original method's return value, making them unsuitable for changing the price actually returned by getPrice().",
    hint: "Ask yourself: do I need to change what the method returns, or just react to what happened?",
    topic: "Apr 17 — Practice Test #1 + Gap Analysis",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 7 — Practice Test #1 + Gap Analysis"
  },
  {
    question: "Which EAV value table stores a product's `price` attribute, and which stores its `status` attribute?",
    answer: "`price` is stored in `catalog_product_entity_decimal`; `status` is stored in `catalog_product_entity_int`. The table is determined by the attribute's `backend_type`.",
    hint: "Think about the PHP/MySQL data types — decimal for money, integer for flags.",
    topic: "Apr 20 — EAV, Declarative Schema & Data Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 10 — EAV, Declarative Schema & Data Patches"
  },
  {
    question: "What does `backend_type = 'static'` mean for an EAV attribute, and give an example?",
    answer: "It means the attribute's value lives directly as a column in the entity table itself, not in any value table. Examples include `sku` and `created_at` in `catalog_product_entity`.",
    hint: "'Static' implies no separate value table row is needed.",
    topic: "Apr 20 — EAV, Declarative Schema & Data Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 10 — EAV, Declarative Schema & Data Patches"
  },
  {
    question: "Why do orders (`sales_order`) use flat tables instead of EAV, and how should custom data be added to orders?",
    answer: "Orders are immutable point-in-time snapshots that never need merchant-configurable attributes, so flat tables are used. Custom data must be added via extension attributes (a join table + plugin on the repository), not EAV.",
    hint: "Think 'snapshot' — and which mechanism works on non-EAV entities.",
    topic: "Apr 20 — EAV, Declarative Schema & Data Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 10 — EAV, Declarative Schema & Data Patches"
  },
  {
    question: "What method and class should you use to obtain the correct join field for catalog product tables in code that must work on both CE and EE?",
    answer: "Use `\\Magento\\Framework\\EntityManager\\MetadataPool::getMetadata(ProductInterface::class)->getLinkField()`, which returns `row_id` in EE and `entity_id` in CE.",
    hint: "There's a pool of metadata objects that abstract edition-specific field names.",
    topic: "Apr 20 — EAV, Declarative Schema & Data Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 10 — EAV, Declarative Schema & Data Patches"
  },
  {
    question: "What are the three required components to implement an extension attribute on an entity such as `OrderInterface`?",
    answer: "(1) Declare the attribute in `extension_attributes.xml`, (2) create a storage table via `db_schema.xml`, and (3) load/save the attribute via a plugin on the entity's repository (e.g., `OrderRepository::get()`). Magento does NOT auto-load extension attributes.",
    hint: "Declaration, storage, and loading — three distinct steps, none automatic.",
    topic: "Apr 20 — EAV, Declarative Schema & Data Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 10 — EAV, Declarative Schema & Data Patches"
  },
  {
    question: "What upgrade failure does `nullable=\"false\" default=\"\"` cause when adding a column to an existing table, and what are the correct alternatives?",
    answer: "MySQL strict mode (`STRICT_TRANS_TABLES`) rejects an empty string as a backfill value for existing rows, causing `setup:upgrade` to fail. The correct alternatives are `nullable=\"true\"` or providing a non-empty default such as `default=\"pending\"`.",
    hint: "Empty string + NOT NULL + rows already in the table = strict mode conflict.",
    topic: "Apr 20 — EAV, Declarative Schema & Data Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 10 — EAV, Declarative Schema & Data Patches"
  },
  {
    question: "What is the purpose of `db_schema_whitelist.json`, and what happens if a column is removed from `db_schema.xml` but was never added to the whitelist?",
    answer: "The whitelist tells Magento which schema elements a module owns, enabling safe drops. If a column was never in the whitelist, Magento will NOT drop it when it is removed from `db_schema.xml` — this is the intentional safe-failure mode.",
    hint: "Magento can only drop what it knows it created.",
    topic: "Apr 20 — EAV, Declarative Schema & Data Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 10 — EAV, Declarative Schema & Data Patches"
  },
  {
    question: "What command generates `db_schema_whitelist.json`, when must it be run relative to `setup:upgrade`, and must the file be committed?",
    answer: "Run `bin/magento setup:db-declaration:generate-whitelist --module-name=Vendor_Module` AFTER the table exists in the database (i.e., after the first `setup:upgrade`). Yes, the file must be committed to version control alongside `db_schema.xml`.",
    hint: "The command reads the current DB state — so the table must already exist.",
    topic: "Apr 20 — EAV, Declarative Schema & Data Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 10 — EAV, Declarative Schema & Data Patches"
  },
  {
    question: "How does Magento track whether a DataPatch has already been applied, and what happens if you rename the patch class?",
    answer: "Patches are tracked by their fully-qualified class name (FQCN) in the `patch_list` table's `patch_name` column. Renaming the class causes Magento to treat it as a new, never-run patch and execute it again — unless the old FQCN is listed in `getAliases()`.",
    hint: "Identity is by class name, not by content or hash.",
    topic: "Apr 20 — EAV, Declarative Schema & Data Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 10 — EAV, Declarative Schema & Data Patches"
  },
  {
    question: "Which methods of the DataPatch interface hierarchy are static vs. instance, and on which interfaces are they defined?",
    answer: "`getDependencies()` is **static**, defined on `DependentPatchInterface`. `apply()` and `getAliases()` are **instance** methods on `PatchInterface`. `revert()` is an instance method on the separate `PatchRevertableInterface`. None have PHP return type hints.",
    hint: "Only the ordering/dependency method is static.",
    topic: "Apr 20 — EAV, Declarative Schema & Data Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 10 — EAV, Declarative Schema & Data Patches"
  },
  {
    question: "Does `getDependencies()` in a DataPatch cause the listed patches to re-run if they were already applied?",
    answer: "No. `getDependencies()` guarantees execution ordering only — if the listed patches already exist in `patch_list`, they are satisfied without re-running. The current patch simply waits until all dependencies have been applied at least once.",
    hint: "'Already ran' counts as satisfied — no double execution.",
    topic: "Apr 20 — EAV, Declarative Schema & Data Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 10 — EAV, Declarative Schema & Data Patches"
  },
  {
    question: "How does declarative schema (`db_schema.xml`) differ from the legacy `InstallSchema`/`UpgradeSchema` approach?",
    answer: "Declarative schema is state-based: you declare the desired end state and Magento diffs the current DB against it to generate DDL. Legacy approach was step-based: imperative PHP code with version-gated if/else chains. No versioning or sequential upgrade scripts are needed with declarative schema.",
    hint: "Think 'what it should look like' vs. 'what steps to take.'",
    topic: "Apr 20 — EAV, Declarative Schema & Data Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 10 — EAV, Declarative Schema & Data Patches"
  },
  {
    question: "When should a custom entity use a flat table instead of EAV, and give a concrete example scenario?",
    answer: "Use a flat table when attributes are fixed by the developer and not merchant-configurable. Example: a 'Supplier' entity with known fields (name, email, phone, country, status) should be a flat table in `db_schema.xml` — EAV adds query complexity with no benefit when the attribute set never varies.",
    hint: "Ask: does a merchant need to add new attributes in the Admin, or are fields fixed in code?",
    topic: "Apr 20 — EAV, Declarative Schema & Data Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 10 — EAV, Declarative Schema & Data Patches"
  },
  {
    question: "In Magento EE staging, what are the data types and default values for `created_in` and `updated_in` columns on `catalog_product_entity`, and which module adds them?",
    answer: "`created_in` and `updated_in` are both `BIGINT UNSIGNED`; `created_in` defaults to `1` and `updated_in` defaults to `2147483647`. They are added by `module-catalog-staging`.",
    hint: "The far-future sentinel value for 'no end date' is a well-known Unix timestamp maximum.",
    topic: "Apr 20 — EAV, Declarative Schema & Data Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 10 — EAV, Declarative Schema & Data Patches"
  },
  {
    question: "In Magento EE with Content Staging, what is the difference between `row_id` and `entity_id` on `catalog_product_entity`, and why does joining on `entity_id` break?",
    answer: "`row_id` is the physical primary key (one per staging version); `entity_id` is the logical business identifier shared across all staging versions of the same product. Joining on `entity_id` returns duplicate or incorrect rows when multiple staging versions exist.",
    hint: "One product can have many rows in EE — what column is unique per row?",
    topic: "Apr 20 — EAV, Declarative Schema & Data Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 10 — EAV, Declarative Schema & Data Patches"
  },
  {
    question: "When a developer proposes using a plugin on QuoteManagement::placeOrder() to add a $3 surcharge, why is AbstractTotal + sales.xml the architecturally correct choice instead?",
    answer: "A plugin on placeOrder() bypasses the totals pipeline, so the surcharge won't appear in the cart UI, won't be tax-aware, and won't recalculate on cart edits or multi-address checkout. AbstractTotal integrates correctly with the totals pipeline, UI display, tax calculation, and multi-address scoping.",
    hint: "Ask whether the fee needs to appear in the checkout totals block and react to cart changes.",
    topic: "Apr 19 — Advanced Customization Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 9 — Advanced Customization Patterns"
  },
  {
    question: "In which namespace does CartItemProcessorInterface live, and in which DI argument is it registered?",
    answer: "It lives in Magento\\Quote\\Model\\Quote\\Item (NOT Magento\\Quote\\Api). Processors are registered in the cartItemProcessors array argument of Magento\\Quote\\Model\\Quote\\Item\\Repository.",
    hint: "Think Model layer, not Api layer — and Repository, not OptionsProcessor.",
    topic: "Apr 19 — Advanced Customization Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 9 — Advanced Customization Patterns"
  },
  {
    question: "Which two methods does CartItemProcessorInterface define, and what is the data-flow direction of each?",
    answer: "convertToBuyRequest() is inbound (REST write — converts API data into a buy-request DataObject) and processOptions() is outbound (REST read — populates extension attributes when cart items are returned via API).",
    hint: "One flows in when adding an item, the other flows out when reading items.",
    topic: "Apr 19 — Advanced Customization Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 9 — Advanced Customization Patterns"
  },
  {
    question: "Is AbstractTotal::collect() abstract or concrete, and what does its base implementation do?",
    answer: "It is concrete (not abstract). The base implementation resets the code-level amounts to zero and sets the current address and total on the object. You must call parent::collect() at the top of your override.",
    hint: "The class is named Abstract but that doesn't mean every method is abstract.",
    topic: "Apr 19 — Advanced Customization Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 9 — Advanced Customization Patterns"
  },
  {
    question: "What should fetch() return to suppress a custom total from the JS checkout totals display?",
    answer: "Return an empty array []. Returning null is wrong; the base class returns [] and the totals renderer ignores entries not present in the array.",
    hint: "Not null — an empty version of the normal return type.",
    topic: "Apr 19 — Advanced Customization Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 9 — Advanced Customization Patterns"
  },
  {
    question: "Why does reading $quote->getItemsCollection() inside collect() cause a double-counting bug in multi-address checkout?",
    answer: "In multi-address checkout, collect() is called once per shipping address. $quote->getItemsCollection() returns ALL items across all addresses each time, so items from previous addresses are counted again. The fix is to iterate $shippingAssignment->getItems() and guard with if(empty($items)){return $this;}.",
    hint: "The bug is silent — no exception, just inflated totals. Think about scope width.",
    topic: "Apr 19 — Advanced Customization Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 9 — Advanced Customization Patterns"
  },
  {
    question: "What are the correct default sort orders for shipping, discount, and tax totals in Magento's sales.xml?",
    answer: "discount=300, shipping=350, tax=450. (subtotal=100, grand_total=550.)",
    hint: "Shipping sits between discount and tax — remember the 50-point gaps.",
    topic: "Apr 19 — Advanced Customization Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 9 — Advanced Customization Patterns"
  },
  {
    question: "What does $capture=true mean in InvoiceOrderInterface::execute(), and what anti-pattern does this interface replace?",
    answer: "$capture=true triggers an online payment capture through the payment method's capture() command at invoice creation. It replaces the legacy $invoice->register() + $invoice->pay() pattern.",
    hint: "Think about the boolean flag's effect on the payment gateway, and what old model-level calls it superseded.",
    topic: "Apr 19 — Advanced Customization Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 9 — Advanced Customization Patterns"
  },
  {
    question: "When adding a plugin to InvoiceOrderInterface, should you target the interface or its concrete implementation class, and why?",
    answer: "Target the interface (Magento\\Sales\\Api\\InvoiceOrderInterface). This respects the service contract and ensures the plugin survives if Adobe Commerce swaps the underlying implementation class.",
    hint: "Service contract principle: depend on the abstraction, not the concretion.",
    topic: "Apr 19 — Advanced Customization Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 9 — Advanced Customization Patterns"
  },
  {
    question: "In a custom shipping carrier, what is the difference between returning false vs. returning an empty Result object from collectRates()?",
    answer: "Returning false hides the carrier entirely from the checkout. Returning an empty Result object displays the carrier but shows an error message to the customer.",
    hint: "One makes the carrier invisible; the other makes it visible but broken.",
    topic: "Apr 19 — Advanced Customization Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 9 — Advanced Customization Patterns"
  },
  {
    question: "How does Magento instantiate a custom shipping carrier — via di.xml or config.xml, and what key is used?",
    answer: "Via the model key in config.xml under carriers/[code]/model. This is not a di.xml preference; the carrier code in $_code must exactly match the config.xml and system.xml XML keys.",
    hint: "It's the same mechanism used for payment methods in CE — a specific XML key in configuration, not dependency injection.",
    topic: "Apr 19 — Advanced Customization Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 9 — Advanced Customization Patterns"
  },
  {
    question: "In EE Gateway architecture, does config.xml need a <model> key for the payment method, and what serves as the model instead?",
    answer: "No. EE payment methods have no <model> key in config.xml. The model is a virtualType of Magento\\Payment\\Model\\Method\\Adapter declared entirely in di.xml with a commandPool argument.",
    hint: "The facade is wired through di.xml alone — config.xml still holds active, title, payment_action but not the class reference.",
    topic: "Apr 19 — Advanced Customization Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 9 — Advanced Customization Patterns"
  },
  {
    question: "What is the role of ValueHandlerPool in EE Gateway payment architecture, and what does it replace from CE?",
    answer: "ValueHandlerPool provides payment method configuration values (e.g., can_authorize, can_capture flags) by delegating to a Config virtualType. It replaces the $_canAuthorize, $_canCapture etc. boolean flags used in CE's AbstractMethod subclasses.",
    hint: "Think of it as the EE equivalent of the CE capability flag properties, but externalised into DI configuration.",
    topic: "Apr 19 — Advanced Customization Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 9 — Advanced Customization Patterns"
  },
  {
    question: "What vault command keys must be present in an EE CommandPool to support stored-card payments, and where are these key names defined?",
    answer: "vault_authorize and/or vault_sale must be declared in the CommandPool commands array. The constants VAULT_AUTHORIZE_COMMAND and VAULT_SALE_COMMAND are defined on VaultPaymentInterface; their absence causes vault payments to fail silently.",
    hint: "Vault uses a separate method code and its own pipeline commands — missing them is a silent failure.",
    topic: "Apr 19 — Advanced Customization Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 9 — Advanced Customization Patterns"
  },
  {
    question: "Why is making a synchronous external HTTP call inside a sales_order_place_after observer architecturally wrong, and what is the correct pattern?",
    answer: "The database transaction for order creation remains open during observer execution. A slow or unavailable external service causes lock contention, browser timeouts, and potential duplicate orders. The correct pattern is to publish a lightweight message via PublisherInterface and handle the external call in a separate queue consumer process.",
    hint: "Think about what stays open during the observer and what happens to the customer's browser.",
    topic: "Apr 19 — Advanced Customization Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 9 — Advanced Customization Patterns"
  },
  {
    question: "What does `updated_in = 2147483647` signify in `catalog_product_entity`, and what constant defines this value?",
    answer: "It is the MAX_VERSION sentinel meaning the row is currently active with no defined expiry. It is defined by `VersionManager::MAX_VERSION = 2147483647`.",
    hint: "This value appears on rows that have no scheduled end to their active period.",
    topic: "Apr 21 — Staging & Preview (EE) + B2B Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 11 — Staging & Preview (EE) + B2B Architecture"
  },
  {
    question: "Does `EntityManagerInterface` exist in Magento's codebase, and how many arguments does `EntityManager::has()` accept?",
    answer: "`EntityManagerInterface` does NOT exist — `EntityManager` is a concrete class. `EntityManager::has()` accepts only ONE argument (`$entity`), with no `$identifier` or `$arguments` parameters.",
    hint: "Both facts are common exam traps about the EntityManager API.",
    topic: "Apr 21 — Staging & Preview (EE) + B2B Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 11 — Staging & Preview (EE) + B2B Architecture"
  },
  {
    question: "Does Quick Order in B2B bypass Shared Catalog visibility restrictions, allowing a buyer to order any SKU they know?",
    answer: "No. Quick Order enforces Shared Catalog visibility — SKUs not in the company's assigned Shared Catalog return an error, even if the buyer manually types the SKU. Quick Order creates a standard quote, not a separate data structure.",
    hint: "Catalog visibility rules apply regardless of the input method used to enter the SKU.",
    topic: "Apr 21 — Staging & Preview (EE) + B2B Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 11 — Staging & Preview (EE) + B2B Architecture"
  },
  {
    question: "What happens to a Negotiable Quote's `quote_id` relationship, and where is the final negotiated price stored?",
    answer: "A Negotiable Quote extends the standard `quote` by adding a parallel `negotiable_quote` record linked via `quote_id`. The negotiated price is stored in `negotiable_quote.negotiated_price_value` and overrides all catalog pricing at checkout.",
    hint: "The negotiable quote does not replace the quote — it sits alongside it.",
    topic: "Apr 21 — Staging & Preview (EE) + B2B Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 11 — Staging & Preview (EE) + B2B Architecture"
  },
  {
    question: "What are the two Shared Catalog types, their `type` column values, and the key rule about how many of each can exist?",
    answer: "**Custom** (`type=0`): assigned to specific companies; multiple can exist. **Public** (`type=1`): available to all guests and non-B2B customers; only one can exist per installation.",
    hint: "One type is exclusive (singular) while the other is not.",
    topic: "Apr 21 — Staging & Preview (EE) + B2B Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 11 — Staging & Preview (EE) + B2B Architecture"
  },
  {
    question: "In the B2B + EE full pricing precedence chain, does a Shared Catalog price override a standard tier price for the same customer group, even if the tier price is lower?",
    answer: "Yes. Shared Catalog price (priority 3) always overrides standard tier prices (priority 4) for the assigned customer group, even when the tier price would be cheaper. This is indexed, not evaluated at runtime.",
    hint: "This is explicitly called a 'critical trap' — the lower standard tier price does NOT win.",
    topic: "Apr 21 — Staging & Preview (EE) + B2B Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 11 — Staging & Preview (EE) + B2B Architecture"
  },
  {
    question: "In Adobe Commerce EE with Staging, which field serves as the auto-increment primary key in `catalog_product_entity`, and which field provides stable logical identity across all versions of the same product?",
    answer: "`row_id` is the auto-increment PK (unique per staged row); `entity_id` is the stable logical identity shared across all version rows for the same product.",
    hint: "Think about which identifier changes every time a new staging version is created versus which one stays constant.",
    topic: "Apr 21 — Staging & Preview (EE) + B2B Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 11 — Staging & Preview (EE) + B2B Architecture"
  },
  {
    question: "List the full 7-level pricing precedence chain for Adobe Commerce EE + B2B from highest to lowest priority.",
    answer: "1. Negotiable Quote price → 2. Cart Price Rule (stop further processing) → 3. Shared Catalog price → 4. Standard Tier Price → 5. Special Price → 6. Catalog Price Rule → 7. Base Price.",
    hint: "Negotiable Quote is always the absolute override at the top; base price is always the fallback at the bottom.",
    topic: "Apr 21 — Staging & Preview (EE) + B2B Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 11 — Staging & Preview (EE) + B2B Architecture"
  },
  {
    question: "How should CE/EE-compatible SQL be written when joining `catalog_product_entity` to attribute tables, to avoid hardcoding `row_id`?",
    answer: "Use `MetadataPool::getMetadata(ProductInterface::class)->getLinkField()`, which returns `row_id` in EE and `entity_id` in CE, making the join portable across editions.",
    hint: "There is a framework service specifically designed to abstract this field difference.",
    topic: "Apr 21 — Staging & Preview (EE) + B2B Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 11 — Staging & Preview (EE) + B2B Architecture"
  },
  {
    question: "What mechanism does the Staging module use to intercept entity persistence, and why does calling `ResourceModel::save()` directly break staging?",
    answer: "Staging registers version-aware operation implementations in `OperationPool` via di.xml. Direct `ResourceModel::save()` calls bypass OperationPool entirely, so no new `row_id` row is created and the staging version is not associated.",
    hint: "The interception is at the operation chain level, not via around plugins on EntityManager.",
    topic: "Apr 21 — Staging & Preview (EE) + B2B Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 11 — Staging & Preview (EE) + B2B Architecture"
  },
  {
    question: "Which class signs the staging preview URL, what data is hashed, and how long is the signature valid?",
    answer: "`RequestSigner` signs the URL by hashing `versionId,timestamp` (comma-joined) with SHA-256. The signature is valid for 3600 seconds (1 hour, hardcoded as `SIGNATURE_LIFETIME`).",
    hint: "It is not `UrlBuilder` that signs — and the hash inputs do NOT include storeId or startTime.",
    topic: "Apr 21 — Staging & Preview (EE) + B2B Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 11 — Staging & Preview (EE) + B2B Architecture"
  },
  {
    question: "What is the correct class name for the staging cron job that applies pending versions, and how frequently does it run?",
    answer: "`Magento\\Staging\\Model\\StagingApplier` (job name `staging_apply_version`) runs every minute (`* * * * *`). The class `Magento\\Staging\\Cron\\ApplyVersion` does not exist.",
    hint: "Be precise about the namespace — the wrong class name is a common exam trap.",
    topic: "Apr 21 — Staging & Preview (EE) + B2B Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 11 — Staging & Preview (EE) + B2B Architecture"
  },
  {
    question: "Is `end_time` stored as a column in the `staging_update` database table?",
    answer: "No. `end_time` is a virtual property on `UpdateInterface` used at the API level to create rollback updates — it has no corresponding column in `staging_update`.",
    hint: "Check what the DB schema actually stores versus what the PHP interface exposes.",
    topic: "Apr 21 — Staging & Preview (EE) + B2B Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 11 — Staging & Preview (EE) + B2B Architecture"
  },
  {
    question: "How are staging version IDs determined in `staging_update`, and is the `id` column auto-incremented by the database?",
    answer: "Version IDs are Unix timestamps of `start_time`, assigned manually by `UpdateRepository::getIdForEntity()`. The column is NOT auto-incremented (`$_isPkAutoIncrement = false`).",
    hint: "The version ID encodes timing information and is set programmatically, not by the DB engine.",
    topic: "Apr 21 — Staging & Preview (EE) + B2B Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 11 — Staging & Preview (EE) + B2B Architecture"
  },
  {
    question: "In EE, EAV attribute tables such as `catalog_product_entity_varchar` use which field as their foreign key — `entity_id` or `row_id`?",
    answer: "`row_id` is the FK used by EAV attribute tables in EE. Joining on `entity_id` returns incorrect or duplicate data when staging versions exist.",
    hint: "Consider which identifier is unique per row versus shared across versions.",
    topic: "Apr 21 — Staging & Preview (EE) + B2B Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 11 — Staging & Preview (EE) + B2B Architecture"
  },
  {
    question: "What does the `shared_index` attribute in `indexer.xml` do, and does `catalog_product_price` use it?",
    answer: "`shared_index` indicates that an indexer shares index tables with another indexer, preventing duplicate full reindexes. `catalog_product_price` does NOT use `shared_index`. An example of indexers that do use it: `catalog_category_product` and `catalog_product_category` both declare `shared_index=\"category_product\"`.",
    hint: "Think about which indexers would write to the same table and therefore shouldn't both run a full rebuild.",
    topic: "Apr 22 — Search, Indexing & Caching Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 12 — Search, Indexing & Caching Architecture"
  },
  {
    question: "Why are `catalogsearch_fulltext` and `catalog_category_product` independent indexers, and what is the architectural implication?",
    answer: "They are separate indexers with separate index tables and separate changelogs. A product appearing on category pages (via `catalog_category_product_index`) does not mean it appears in search results — `catalogsearch_fulltext` must be independently current. One being up-to-date does not imply the other is.",
    hint: "Consider the scenario where a new product appears in category browsing but not in search results.",
    topic: "Apr 22 — Search, Indexing & Caching Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 12 — Search, Indexing & Caching Architecture"
  },
  {
    question: "What is the difference between `bin/magento cache:clean` and `bin/magento cache:flush`, and which is preferred in production?",
    answer: "`cache:clean` clears the cache storage for Magento's managed cache types (forces regeneration) and is **preferred in production**. `cache:flush` destroys the entire underlying storage pool, which can evict caches from other applications sharing the same Redis instance.",
    hint: "One is surgical; the other is a wrecking ball affecting everything on shared infrastructure.",
    topic: "Apr 22 — Search, Indexing & Caching Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 12 — Search, Indexing & Caching Architecture"
  },
  {
    question: "How does `RemoteSynchronizedCache` determine whether to serve from L1 (local) or L2 (Redis), and does it eliminate Redis reads entirely?",
    answer: "It uses a hash-based versioning approach: each key has a corresponding `:hash` key in Redis. If L1's stored hash matches L2's hash, data is served from L1. If they differ, L2 is fetched and L1 is updated. It does NOT eliminate Redis reads — the hash check is still a lightweight Redis operation.",
    hint: "There is always at least one Redis operation per read — just not always a full data fetch.",
    topic: "Apr 22 — Search, Indexing & Caching Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 12 — Search, Indexing & Caching Architecture"
  },
  {
    question: "What are the two key architectural objections to using Live Search instead of self-hosted OpenSearch?",
    answer: "(1) Live Search requires an Adobe Commerce (EE) subscription — unavailable on Open Source. (2) Product data is synced to Adobe's cloud infrastructure, raising data residency and compliance concerns for regulated industries. Also, Live Search and OpenSearch/Elasticsearch cannot run simultaneously.",
    hint: "Think about licensing and where the data physically lives.",
    topic: "Apr 22 — Search, Indexing & Caching Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 12 — Search, Indexing & Caching Architecture"
  },
  {
    question: "As of Magento 2.4.8, what is the status of MySQL catalog search, and what is the required replacement?",
    answer: "MySQL catalog search is completely **removed** in Magento 2.4.8 — not deprecated, not optional. OpenSearch (or Elasticsearch) is required; any upgrade path must include deploying one of these search engines.",
    hint: "'Removed' is stronger language than 'deprecated' — this distinction matters for upgrade planning.",
    topic: "Apr 22 — Search, Indexing & Caching Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 12 — Search, Indexing & Caching Architecture"
  },
  {
    question: "Does `Magento\\Cms\\Model\\Page::getIdentities()` ever return the generic `cms_p` tag?",
    answer: "No. CMS Page `getIdentities()` always returns ONLY the specific entity tag (e.g., `['cms_p_3']`). The generic `cms_p` tag is never included in the Page model's `getIdentities()` output.",
    hint: "Compare this behavior to Product and Category, which do include the generic tag under certain conditions.",
    topic: "Apr 22 — Search, Indexing & Caching Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 12 — Search, Indexing & Caching Architecture"
  },
  {
    question: "Why is returning only the generic tag (e.g., `cat_p`) from `getIdentities()` architecturally incorrect, and what should be returned instead?",
    answer: "Returning only the generic tag causes ALL product pages to be invalidated on any single product save, causing cache thrash. The correct return is the entity-specific tag (e.g., `['cat_p_42']`), which invalidates only pages containing that specific product.",
    hint: "One extreme is too narrow (empty), the other is too broad — find the precise middle.",
    topic: "Apr 22 — Search, Indexing & Caching Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 12 — Search, Indexing & Caching Architecture"
  },
  {
    question: "What happens when a custom block's `getIdentities()` returns an empty array `[]` and FPC is enabled?",
    answer: "The page is cached with no product tags in the `X-Magento-Tags` header. When the associated product is saved, Magento invalidates by tag but the cached page has no matching tags, so it is never invalidated and serves stale data until TTL expiry.",
    hint: "Consider what the tag-based BAN/purge mechanism needs in order to target the correct cached pages.",
    topic: "Apr 22 — Search, Indexing & Caching Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 12 — Search, Indexing & Caching Architecture"
  },
  {
    question: "What is the effect of placing `cacheable=\"false\"` on a single block in a layout XML file?",
    answer: "One `cacheable=\"false\"` block anywhere in the layout tree makes the **entire page** uncacheable by FPC. This is a common performance bug where a single block disables full-page caching for an entire page type.",
    hint: "The impact is not scoped to the block itself — it propagates upward.",
    topic: "Apr 22 — Search, Indexing & Caching Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 12 — Search, Indexing & Caching Architecture"
  },
  {
    question: "Which method of ActionInterface is called by the MView cron, and which is called by `bin/magento indexer:reindex`?",
    answer: "`executeList(array $ids)` is called by the MView cron and receives the array of entity IDs from the changelog. `executeFull()` is called by `bin/magento indexer:reindex` for a full reindex.",
    hint: "One method handles partial re-indexing from a list; the other handles everything.",
    topic: "Apr 22 — Search, Indexing & Caching Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 12 — Search, Indexing & Caching Architecture"
  },
  {
    question: "What is the changelog table naming convention, and how many MySQL triggers does Magento create per subscribed table?",
    answer: "The changelog table name follows the pattern `{source_table}_cl`. Magento creates three triggers per subscribed table: `{table}_after_insert`, `{table}_after_update`, and `{table}_after_delete`.",
    hint: "Think about the three DML operations that can change data.",
    topic: "Apr 22 — Search, Indexing & Caching Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 12 — Search, Indexing & Caching Architecture"
  },
  {
    question: "In Update by Schedule mode, does Update on Save use MView triggers? Which mode exclusively uses MView?",
    answer: "Update on Save does NOT use MView or changelog tables — it indexes synchronously during the admin save. MView triggers and changelog tables are used exclusively in Update by Schedule mode.",
    hint: "Consider which mode requires cron to be running.",
    topic: "Apr 22 — Search, Indexing & Caching Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 12 — Search, Indexing & Caching Architecture"
  },
  {
    question: "Which three status values can appear in the `mview_state` table's `status` column, and what is the operational failure mode?",
    answer: "The three status values are `idle`, `working`, and `suspended`. If a cron job dies mid-index, the status can remain stuck at `working`, causing the next cron run to skip processing — a known operational failure mode.",
    hint: "One of the three values indicates an in-progress operation that may never complete.",
    topic: "Apr 22 — Search, Indexing & Caching Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 12 — Search, Indexing & Caching Architecture"
  },
  {
    question: "What must exactly match between indexer.xml and mview.xml, and what happens if it doesn't?",
    answer: "The `view_id` attribute in `indexer.xml` must exactly match the `id` attribute in `mview.xml`. If they don't match, the indexer receives no change notifications and behaves as if no changes occurred, even in Update by Schedule mode.",
    hint: "Think about the bridge that connects the indexer declaration to its change-tracking subscription.",
    topic: "Apr 22 — Search, Indexing & Caching Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 12 — Search, Indexing & Caching Architecture"
  },
  {
    question: "When extending core behavior in Adobe Commerce, why is a plugin architecturally preferred over a preference?",
    answer: "A preference replaces the entire class, breaking other plugins and creating full upgrade burden. A plugin wraps behavior without owning the class, composing cleanly with other extensions.",
    hint: "Think about what happens to other modules targeting the same class.",
    topic: "Apr 23 — Code Standards, SOLID & Testing Frameworks",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 13 — Code Standards, SOLID & Testing Frameworks"
  },
  {
    question: "Which annotation is required for API functional tests to load database fixtures, and how does it differ from integration test fixtures?",
    answer: "API functional tests use `@magentoApiDataFixture`, not `@magentoDataFixture`. Using the wrong annotation is a common exam trap.",
    hint: "The annotation name reflects the test type it belongs to.",
    topic: "Apr 23 — Code Standards, SOLID & Testing Frameworks",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 13 — Code Standards, SOLID & Testing Frameworks"
  },
  {
    question: "What is the difference between `createMock()` and `getMockBuilder()->onlyMethods([])->getMock()` in PHPUnit?",
    answer: "`createMock()` creates a full mock where all methods are stubbed and return null/default. `getMockBuilder()->onlyMethods(['method'])->getMock()` creates a partial mock where only the specified methods are overridden and all other methods execute real code.",
    hint: "One replaces all behavior; the other preserves real behavior except for named methods.",
    topic: "Apr 23 — Code Standards, SOLID & Testing Frameworks",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 13 — Code Standards, SOLID & Testing Frameworks"
  },
  {
    question: "What is the ISP-compliant way to add new data fields to an existing third-party module interface in Adobe Commerce?",
    answer: "Use extension attributes. Modifying the existing interface would force all existing implementors to add the method. Extension attributes are added via `extension_attributes.xml` and accessed through `ProductExtensionInterface` without touching the original interface.",
    hint: "Think about what mechanism Adobe Commerce provides specifically for adding data to existing interfaces.",
    topic: "Apr 23 — Code Standards, SOLID & Testing Frameworks",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 13 — Code Standards, SOLID & Testing Frameworks"
  },
  {
    question: "What constitutes an LSP violation when implementing a service contract interface in Adobe Commerce?",
    answer: "Throwing exception types not declared in the interface contract, returning incompatible types, or adding mandatory constructor dependencies that change observable behavior all violate LSP. Implementations must honor the full interface contract.",
    hint: "Focus on what the calling code expects versus what the implementation delivers.",
    topic: "Apr 23 — Code Standards, SOLID & Testing Frameworks",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 13 — Code Standards, SOLID & Testing Frameworks"
  },
  {
    question: "When should you write an integration test instead of a unit test for validating a custom module's di.xml configuration?",
    answer: "Always use an integration test for DI wiring. Unit tests manually construct classes and never read di.xml; only integration tests use the real DI container via `Bootstrap::getObjectManager()`, which resolves actual bindings.",
    hint: "Unit tests bypass the DI container entirely.",
    topic: "Apr 23 — Code Standards, SOLID & Testing Frameworks",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 13 — Code Standards, SOLID & Testing Frameworks"
  },
  {
    question: "What is the architectural reason for choosing an observer over a plugin when sending a notification email after a product is saved?",
    answer: "Email sending is a side effect decoupled from the save operation. An observer is the correct pattern for side effects — if the email fails it won't roll back the save, and it avoids adding latency to the save plugin chain.",
    hint: "Consider whether the side effect should be able to abort the primary operation.",
    topic: "Apr 23 — Code Standards, SOLID & Testing Frameworks",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 13 — Code Standards, SOLID & Testing Frameworks"
  },
  {
    question: "Why is placing business logic in a `.phtml` template forbidden, and what is the modern (2.2+) correct pattern?",
    answer: "Templates cannot be unit tested, mixing concerns creates security risks, and logic is untestable. The correct pattern is a ViewModel implementing `Magento\\Framework\\View\\Element\\Block\\ArgumentInterface`.",
    hint: "The interface name contains 'ArgumentInterface' and lives under Block.",
    topic: "Apr 23 — Code Standards, SOLID & Testing Frameworks",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 13 — Code Standards, SOLID & Testing Frameworks"
  },
  {
    question: "In Adobe Commerce, which forbidden pattern does using `$_POST['name']` in a controller represent, and what is the correct replacement?",
    answer: "It is direct superglobal access, a forbidden MEQP pattern. The correct approach is to inject `RequestInterface` and use `$this->request->getParam('name')` for security and testability.",
    hint: "Superglobals cannot be mocked and bypass request filtering.",
    topic: "Apr 23 — Code Standards, SOLID & Testing Frameworks",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 13 — Code Standards, SOLID & Testing Frameworks"
  },
  {
    question: "Why do `@api` interfaces in Adobe Commerce's `Api/` directory intentionally omit PHP type hints on parameters and return types?",
    answer: "Type contracts are expressed only in docblocks to maintain backwards compatibility. This is by design and is not an LSP violation.",
    hint: "Consider what adding/changing PHP type hints would do to existing implementations across minor releases.",
    topic: "Apr 23 — Code Standards, SOLID & Testing Frameworks",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 13 — Code Standards, SOLID & Testing Frameworks"
  },
  {
    question: "What does the `@api` annotation guarantee about an interface's stability, and what happens without it?",
    answer: "With `@api`, the interface is guaranteed not to break across minor releases (e.g., 2.4.x → 2.4.y). Without `@api`, Adobe Commerce may change the method signature in any minor release without it being a breaking change by their contract.",
    hint: "Think about semantic versioning and minor vs major release contracts.",
    topic: "Apr 23 — Code Standards, SOLID & Testing Frameworks",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 13 — Code Standards, SOLID & Testing Frameworks"
  },
  {
    question: "Why is using `ObjectManager::create()` inside a factory class NOT a violation of Adobe Commerce standards?",
    answer: "Factory classes must use ObjectManager to support virtual types configured in di.xml. If a factory bypassed ObjectManager, virtual type and preference configurations would be ignored.",
    hint: "Consider what DI feature only works through the ObjectManager at runtime.",
    topic: "Apr 23 — Code Standards, SOLID & Testing Frameworks",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 13 — Code Standards, SOLID & Testing Frameworks"
  },
  {
    question: "What is the correct base class for a non-controller integration test (e.g., testing a repository or service)?",
    answer: "`\\PHPUnit\\Framework\\TestCase` directly. `AbstractController` is reserved for frontend controller dispatch tests, and `AbstractBackendController` for admin controller tests.",
    hint: "Only controller-specific tests need the controller base classes.",
    topic: "Apr 23 — Code Standards, SOLID & Testing Frameworks",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 13 — Code Standards, SOLID & Testing Frameworks"
  },
  {
    question: "Why must `@magentoDbIsolation disabled` be used when integration-testing an order placement?",
    answer: "Order placement commits its own internal database transaction, so the default transactional rollback cannot wrap it. Disabling DB isolation allows the committed data to persist and be verified.",
    hint: "Think about what happens when the code under test uses its own transaction commits.",
    topic: "Apr 23 — Code Standards, SOLID & Testing Frameworks",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 13 — Code Standards, SOLID & Testing Frameworks"
  },
  {
    question: "Which MFTF command does NOT exist, and what is the correct alternative for executing a suite?",
    answer: "There is no `run:suite` command. The correct approach is `vendor/bin/mftf generate:suite SuiteName` to generate the suite, then run via `run:group` or PHPUnit directly.",
    hint: "Check the generate vs run distinction in MFTF.",
    topic: "Apr 23 — Code Standards, SOLID & Testing Frameworks",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 13 — Code Standards, SOLID & Testing Frameworks"
  },
  {
    question: "A single block in layout XML is marked `cacheable=\"false\"`. What is the effect on the page it belongs to?",
    answer: "The entire page becomes uncacheable — not just the block. Even one `cacheable=\"false\"` block prevents FPC from storing the full page response.",
    hint: "Think beyond the individual block — what does FPC cache?",
    topic: "Apr 25 — Performance Optimization + MSI Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 14 — Performance Optimization + MSI Architecture"
  },
  {
    question: "Which PHP API provides the accurate salable quantity in MSI (including reservation offsets and the out-of-stock threshold), and what is its method signature?",
    answer: "`GetProductSalableQtyInterface::execute(string $sku, int $stockId): float` returns the true available quantity by combining source item quantities with reservation offsets and applying the configured minimum qty threshold. `StockRegistry::getStockItemBySku()` reads the legacy table and must be avoided for accurate MSI stock.",
    hint: "The interface name literally describes what it returns — compare it to the legacy registry approach.",
    topic: "Apr 25 — Performance Optimization + MSI Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 14 — Performance Optimization + MSI Architecture"
  },
  {
    question: "Which interface must a custom Source Selection Algorithm implement, and how is it registered in di.xml?",
    answer: "Custom SSAs implement `Magento\\InventorySourceSelectionApi\\Model\\SourceSelectionInterface` (in the `Model/` namespace). Register it by adding an `<item>` to the `sourceSelectionMethods` array argument of `Magento\\InventorySourceSelectionApi\\Model\\SourceSelectionService` in di.xml. `Api/Data/SourceSelectionAlgorithmInterface` is a DTO and must NOT be implemented.",
    hint: "Distinguish between the algorithm interface and the DTO — they live in different namespaces.",
    topic: "Apr 25 — Performance Optimization + MSI Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 14 — Performance Optimization + MSI Architecture"
  },
  {
    question: "What is required to use the Distance Priority SSA in MSI, and what is its limitation compared to Priority SSA?",
    answer: "Distance SSA requires a Google Maps Distance Matrix API key to calculate distances from source lat/long to the shipping address. Unlike Priority SSA, it does not work offline without a custom implementation and has an external API dependency.",
    hint: "One SSA is purely configuration-based; the other needs an external service.",
    topic: "Apr 25 — Performance Optimization + MSI Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 14 — Performance Optimization + MSI Architecture"
  },
  {
    question: "Where is source priority stored in MSI, and which built-in SSA reads it?",
    answer: "Source priority is stored in `inventory_source_stock_link.priority` — NOT in `inventory_source`. The Priority SSA (`PriorityBasedAlgorithm`) reads this column to select sources in ascending priority order until the order quantity is fulfilled.",
    hint: "The priority belongs to the relationship between a stock and a source, not to the source itself.",
    topic: "Apr 25 — Performance Optimization + MSI Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 14 — Performance Optimization + MSI Architecture"
  },
  {
    question: "Why is the `inventory_reservation` table append-only, and how is an order cancellation represented in it?",
    answer: "Append-only design prevents UPDATE contention under high concurrency, provides a full audit trail, and avoids race conditions. A cancellation is recorded as a new positive entry equal in magnitude to the original negative reservation — the original row is never modified or deleted.",
    hint: "This is an event-sourcing pattern — think compensation, not correction.",
    topic: "Apr 25 — Performance Optimization + MSI Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 14 — Performance Optimization + MSI Architecture"
  },
  {
    question: "What is the Salable Quantity formula in MSI, and why is `inventory_source_item.quantity` alone insufficient?",
    answer: "Salable Qty = SUM(inventory_source_item.quantity for enabled sources linked to the stock) + SUM(inventory_reservation.quantity for that stock/SKU). Reservations are negative numbers representing pending orders, so `source_item.quantity` alone overstates available stock by ignoring those commitments.",
    hint: "Two tables must be combined; one holds physical stock, the other holds order commitments.",
    topic: "Apr 25 — Performance Optimization + MSI Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 14 — Performance Optimization + MSI Architecture"
  },
  {
    question: "When should you use a Repository instead of a Collection for fetching products, and what performance cost does the Repository add?",
    answer: "Use Repository when crossing module boundaries via service contracts or building APIs requiring stable interface contracts. The cost is full object hydration including extension attributes, which may trigger additional queries — making it unsuitable for bulk operations or tight loops over thousands of records.",
    hint: "Think API contract stability vs. raw query efficiency.",
    topic: "Apr 25 — Performance Optimization + MSI Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 14 — Performance Optimization + MSI Architecture"
  },
  {
    question: "What is the N+1 query problem in Magento collections, and which collection method prevents it for EAV attributes?",
    answer: "N+1 occurs when one query retrieves a list and then N individual queries load attributes for each item. Use `addAttributeToSelect(['name','price','sku'])` to eagerly load all needed EAV attributes in a single query.",
    hint: "High query COUNT with low individual time in MAGE_PROFILER output is the telltale sign.",
    topic: "Apr 25 — Performance Optimization + MSI Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 14 — Performance Optimization + MSI Architecture"
  },
  {
    question: "In EXPLAIN output, what do `type: ALL` and `Extra: Using filesort` each indicate, and what is the fix for each?",
    answer: "`type: ALL` means a full table scan — fix by adding an appropriate index. `Using filesort` means MySQL sorts results in memory/disk — fix by adding an index that covers the ORDER BY columns.",
    hint: "Each points to a missing index, but on different operations.",
    topic: "Apr 25 — Performance Optimization + MSI Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 14 — Performance Optimization + MSI Architecture"
  },
  {
    question: "What OPcache setting is required for production Magento, and what operational consequence does it create after a deployment?",
    answer: "`opcache.validate_timestamps=0` must be set so PHP never checks file mtimes on each request. After a deploy, you must manually restart PHP-FPM or call `opcache_reset()` because changed files will not be detected automatically.",
    hint: "There is a trade-off between performance and automatic change detection.",
    topic: "Apr 25 — Performance Optimization + MSI Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 14 — Performance Optimization + MSI Architecture"
  },
  {
    question: "Why must Xdebug be disabled in production, and what symptom does its accidental enablement cause?",
    answer: "Xdebug traces every function call, generates stack frames, and adds socket overhead, resulting in a 2–10× slowdown on every PHP request. A site that suddenly becomes 3–5× slower after a php.ini change is the classic exam scenario.",
    hint: "Consider the overhead type: it affects every request, not just during active debugging sessions.",
    topic: "Apr 25 — Performance Optimization + MSI Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 14 — Performance Optimization + MSI Architecture"
  },
  {
    question: "Which profiling tool is available ONLY on Magento Commerce Cloud Pro and measures transaction-level metrics (Apdex, throughput, error rate)?",
    answer: "New Relic APM. It is pre-configured on Cloud Pro with environment variables injected by the platform; it is not available on Cloud Starter in the same managed way.",
    hint: "Think managed platform vs. self-hosted, and transaction-level vs. function-level.",
    topic: "Apr 25 — Performance Optimization + MSI Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 14 — Performance Optimization + MSI Architecture"
  },
  {
    question: "Why does `cataloginventory_stock_item` still exist in MSI-enabled Magento, and why should new code avoid reading `qty` from it?",
    answer: "It is maintained by MSI observers for backward compatibility with third-party extensions and ERP integrations that read the legacy table. Its `qty` column reflects aggregated gross source quantities but does NOT subtract reservation offsets, so it overstates available stock for orders in progress.",
    hint: "Legacy tables serve old code; the correct API applies reservation math automatically.",
    topic: "Apr 25 — Performance Optimization + MSI Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 14 — Performance Optimization + MSI Architecture"
  },
  {
    question: "Where should session-dependent content (cart count, wishlist) be rendered to preserve FPC cacheability?",
    answer: "In customer-data JavaScript sections (the `customer-data` JS API), not in PHP blocks. This keeps the page FPC-cacheable while loading personalized data client-side.",
    hint: "Consider what happens when PHP renders private content vs. when JS fetches it after page load.",
    topic: "Apr 25 — Performance Optimization + MSI Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 14 — Performance Optimization + MSI Architecture"
  },
  {
    question: "What is the correct entry point interface for customizing order placement behavior via a plugin, and why should QuoteManagement not be overridden directly?",
    answer: "`CartManagementInterface::placeOrder($cartId, ?PaymentInterface $paymentMethod)` is the correct plugin target. Directly overriding `QuoteManagement` violates the Open/Closed Principle and breaks upgrade compatibility — plugins and observers preserve extensibility.",
    hint: "Always target the interface, not the implementation class.",
    topic: "Apr 26 — Scalability Patterns + Order Management Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 15 — Scalability Patterns + Order Management Architecture"
  },
  {
    question: "What is the default scope for customer accounts in Adobe Commerce, and what is the architectural risk of setting account sharing to 'Global'?",
    answer: "Customer accounts are scoped to the Website by default (`Stores > Config > Customer > Account Sharing`). Setting sharing to Global means a customer logged into Website A can view order history from Website B — a data privacy and compliance architectural risk.",
    hint: "Consider what cross-website visibility means for GDPR or multi-brand scenarios.",
    topic: "Apr 26 — Scalability Patterns + Order Management Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 15 — Scalability Patterns + Order Management Architecture"
  },
  {
    question: "What is the architectural difference between the deprecated application-level Split Database and the Cloud Pro infrastructure-level database split?",
    answer: "The deprecated split DB routed queries via application code in `env.php` and broke cross-database joins. Cloud Pro's infrastructure split is provisioned by Adobe at the infrastructure level — the application sees a single logical connection per concern and cross-DB joins are not an application concern.",
    hint: "One lives in code, the other lives in infrastructure provisioning.",
    topic: "Apr 26 — Scalability Patterns + Order Management Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 15 — Scalability Patterns + Order Management Architecture"
  },
  {
    question: "What is the correct way to prepare and register an invoice programmatically in Adobe Commerce 2.4.x?",
    answer: "Use `Magento\\Sales\\Model\\Service\\InvoiceService::prepareInvoice($order)` then call `$invoice->register()`. `InvoiceManagementInterface` does NOT have a `prepareInvoice()` method — using it is architecturally incorrect.",
    hint: "The method belongs to a Service class, not the Management interface.",
    topic: "Apr 26 — Scalability Patterns + Order Management Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 15 — Scalability Patterns + Order Management Architecture"
  },
  {
    question: "When enabling sticky sessions is required vs. when they must be disabled in a horizontally scaled Adobe Commerce environment?",
    answer: "Sticky sessions are required when using file-based PHP sessions (each node must serve the same user). Once Redis session storage is configured, sticky sessions must be disabled (round-robin load balancing is safe and preferred).",
    hint: "Think about what changes when session data moves off the local node.",
    topic: "Apr 26 — Scalability Patterns + Order Management Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 15 — Scalability Patterns + Order Management Architecture"
  },
  {
    question: "Which Adobe Commerce features are exclusive to EE (Adobe Commerce) and unavailable in CE (Open Source)?",
    answer: "EE-only features include: RMA (Returns), AsyncOrder, Shared Catalog, Gift Cards, Reward Points, Store Credits, Customer Segments, Order Archive, Customer Balance, and Advanced Reporting. The B2B module (Company Accounts, Purchase Orders, Negotiable Quotes) is an additional EE add-on.",
    hint: "If a scenario involves returns workflow, async checkout, or B2B catalog segmentation — check the edition first.",
    topic: "Apr 26 — Scalability Patterns + Order Management Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 15 — Scalability Patterns + Order Management Architecture"
  },
  {
    question: "What is the modern recommended approach for shared media storage in a horizontally scaled Adobe Commerce deployment, and what configuration key enables it?",
    answer: "Remote Storage using S3 or Azure Blob via the `remote_storage` key in `app/etc/env.php` is the modern recommended approach. NFS is the legacy approach and introduces I/O bottlenecks and a single point of failure.",
    hint: "The legacy approach uses a network mount; the modern approach uses object storage.",
    topic: "Apr 26 — Scalability Patterns + Order Management Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 15 — Scalability Patterns + Order Management Architecture"
  },
  {
    question: "What happens to the quote record when `CartManagementInterface::placeOrder()` is called, and why is this architecturally significant?",
    answer: "The quote is deactivated (`is_active = 0`) but not deleted. This is architecturally significant because it preserves the quote data to enable re-order functionality — and order prices are snapshots, so changing a product price after order placement does not affect the stored order total.",
    hint: "Think about what enables the 'Reorder' button in customer account.",
    topic: "Apr 26 — Scalability Patterns + Order Management Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 15 — Scalability Patterns + Order Management Architecture"
  },
  {
    question: "What command enables AsyncOrder processing, and where does it write the configuration?",
    answer: "`bin/magento setup:config:set --checkout-async=1` enables AsyncOrder. It writes to `env.php` under the `checkout/async` key — it is NOT set via `config:set` as a system config path.",
    hint: "AsyncOrder config lives in deployment config, not system config.",
    topic: "Apr 26 — Scalability Patterns + Order Management Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 15 — Scalability Patterns + Order Management Architecture"
  },
  {
    question: "Which layout handle governs ALL checkout UI customizations in Adobe Commerce, and what type of block is `checkout.root`?",
    answer: "`checkout_index_index.xml` is the single layout handle for all checkout UI changes — there is no separate handle per step. `checkout.root` is a block (`Magento\\Checkout\\Block\\Onepage`), so `<referenceBlock>` (not `<referenceContainer>`) must be used.",
    hint: "There's only one handle for the entire checkout page, and block vs. container matters for the XML tag.",
    topic: "Apr 26 — Scalability Patterns + Order Management Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 15 — Scalability Patterns + Order Management Architecture"
  },
  {
    question: "What is the difference between order states `closed` and `canceled` in Adobe Commerce?",
    answer: "`closed` means the order was fulfilled (invoiced and shipped) and then a credit memo was issued against it. `canceled` means the order was canceled before fulfillment occurred — it was never invoiced or shipped.",
    hint: "One state requires prior fulfillment; the other prevents it entirely.",
    topic: "Apr 26 — Scalability Patterns + Order Management Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 15 — Scalability Patterns + Order Management Architecture"
  },
  {
    question: "What is the distinction between order `state` and order `status` in Adobe Commerce, and which can merchants configure?",
    answer: "State is a system-level hardcoded constant (e.g., `processing`) controlled by application logic and immutable by merchants. Status is a merchant-configurable label mapped to a state — merchants can create multiple custom statuses and assign them to a single state.",
    hint: "One is for the system, one is for the merchant's storefront communication.",
    topic: "Apr 26 — Scalability Patterns + Order Management Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 15 — Scalability Patterns + Order Management Architecture"
  },
  {
    question: "Why was the Split Database feature deprecated in Adobe Commerce 2.4.0, and what is the recommended alternative for database scaling in 2.4.x?",
    answer: "Split DB was removed due to cross-database join impossibility, replication lag causing consistency issues, and high maintenance burden. The recommended 2.4.x alternative is MySQL read replicas combined with Redis caching and AsyncOrder (EE) to reduce write contention.",
    hint: "Modern cloud-native patterns replaced what the split DB tried to solve.",
    topic: "Apr 26 — Scalability Patterns + Order Management Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 15 — Scalability Patterns + Order Management Architecture"
  },
  {
    question: "What is the salable quantity formula in Adobe Commerce MSI, and when does physical source item quantity actually decrement?",
    answer: "Salable Qty = Physical Qty (inventory_source_item) + Sum of all reservations for that stock. Physical source item quantity decrements only at shipment creation, not at order placement.",
    hint: "Reservations affect salable qty immediately; physical stock follows fulfillment.",
    topic: "Apr 26 — Scalability Patterns + Order Management Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 15 — Scalability Patterns + Order Management Architecture"
  },
  {
    question: "In MSI's reservation model, what happens to the `inventory_reservation` table when an order is canceled?",
    answer: "A positive compensation reservation is appended to the table restoring salable quantity. No physical source item quantity changes — the reservation table is append-only and never updated or deleted.",
    hint: "MSI uses an event-sourcing pattern; think compensating entries, not rollbacks.",
    topic: "Apr 26 — Scalability Patterns + Order Management Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 15 — Scalability Patterns + Order Management Architecture"
  },
  {
    question: "In `webapi.xml`, what three special `resource ref` values are available, and what does each mean?",
    answer: "`anonymous` means no authentication required (public endpoint); `self` means a logged-in customer token that can only access their own data; a specific ACL resource ID (e.g., `Vendor_Module::resource_id`) requires an admin or integration token with that resource assigned.",
    hint: "Think about the three categories of API callers: unauthenticated, customer, and admin/integration.",
    topic: "Apr 27 — Security Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 16 — Security Architecture"
  },
  {
    question: "Why do REST API and GraphQL endpoints NOT require a form key for CSRF protection?",
    answer: "The `Authorization: Bearer <token>` header cannot be set by a cross-origin HTML form submission. Token-based authentication in headers is inherently CSRF-resistant because attackers cannot forge custom headers via form submissions, and CORS policies block unauthorized cross-origin XHR requests.",
    hint: "Consider what a cross-origin form submission can and cannot include.",
    topic: "Apr 27 — Security Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 16 — Security Architecture"
  },
  {
    question: "What is the architectural reason `addFieldToFilter()` is safe from SQL injection?",
    answer: "`addFieldToFilter()` uses a query builder pattern that keeps data and SQL structure completely separate via parameter binding — user data is never interpolated into the SQL string. It is safe by structure, not by sanitization.",
    hint: "The key distinction is parameterization vs. sanitization.",
    topic: "Apr 27 — Security Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 16 — Security Architecture"
  },
  {
    question: "Which escaper method must be used for URLs in `href`, `src`, or `action` attributes, and why can't `escapeHtml()` substitute for it?",
    answer: "`escapeUrl()` must be used for URL contexts because it strips dangerous protocols like `javascript:` and `data:`. `escapeHtml()` does NOT strip these protocols — a user-supplied URL containing `javascript:alert(1)` would pass through `escapeHtml()` unmodified and execute.",
    hint: "Think about what `escapeHtml()` converts vs. what it leaves intact.",
    topic: "Apr 27 — Security Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 16 — Security Architecture"
  },
  {
    question: "What does returning `null` vs. `true` from `validateForCsrf()` in `CsrfAwareActionInterface` mean?",
    answer: "Returning `null` means 'use default form key validation behavior.' Returning `true` bypasses CSRF validation entirely — appropriate only for programmatic/API endpoints receiving non-browser requests. Returning `false` forces validation failure.",
    hint: "Three return values, three behaviors — what does null mean in a nullable bool context here?",
    topic: "Apr 27 — Security Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 16 — Security Architecture"
  },
  {
    question: "What PCI data can NEVER be stored — even encrypted — and what data IS safe to store in `vault_payment_token.details`?",
    answer: "CVV/CVC, full magnetic stripe (track) data, and PIN can NEVER be stored even encrypted. Safe to store: card type, last 4 digits of PAN, expiration month/year, and the gateway token. The full 16-digit PAN must never appear in the `details` JSON.",
    hint: "The vault pattern exists specifically to keep the dangerous data at the gateway, not in Magento.",
    topic: "Apr 27 — Security Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 16 — Security Architecture"
  },
  {
    question: "What is the correct root element and schema URI for `csp_whitelist.xml`, and where does the file live?",
    answer: "The root element is `<csp_whitelist>` (not `<csp_whitelist.xml>`). The schema URI is `urn:magento:module:Magento_Csp:etc/csp_whitelist.xsd` (colon before `etc`, not a slash). The file lives at `Vendor/Module/etc/csp_whitelist.xml`.",
    hint: "The schema URI uses a colon as separator in one specific place that differs from other Magento URNs.",
    topic: "Apr 27 — Security Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 16 — Security Architecture"
  },
  {
    question: "When a third-party JavaScript fails to load due to CSP, what is the architecturally correct fix?",
    answer: "Add the CDN domain to the `script-src` policy in `csp_whitelist.xml` using `type=\"host\"` with the most specific host possible. Never disable CSP entirely or set it to report-only in production — that removes the entire protection layer.",
    hint: "Minimum necessary exception vs. disabling the control entirely.",
    topic: "Apr 27 — Security Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 16 — Security Architecture"
  },
  {
    question: "What does `Magento_Backend::all` represent in the ACL tree, and how does it differ from `Magento_Backend::admin`?",
    answer: "`Magento_Backend::admin` is the root of the ACL tree — all custom resources must be descendants of it. `Magento_Backend::all` is a direct child of `admin` and grants full admin access when assigned, because ACL inheritance means granting a parent grants all children.",
    hint: "One is the root, the other is the 'grant everything' shortcut just below the root.",
    topic: "Apr 27 — Security Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 16 — Security Architecture"
  },
  {
    question: "What are the config paths and default values for admin login lockout failures and lockout duration?",
    answer: "Max login failures: `admin/security/lockout_failures` (default: 6). Lockout period: `admin/security/lockout_threshold` (default: 30 minutes). Lockout state is tracked via `failures_num` and `lock_expires` columns in the `admin_user` table. Reset with `bin/magento admin:user:unlock <username>`.",
    hint: "Both paths start with `admin/security/` — one ends in `failures`, the other in `threshold`.",
    topic: "Apr 27 — Security Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 16 — Security Architecture"
  },
  {
    question: "Which directories in a Magento installation must be writable at runtime, and which must be read-only in production?",
    answer: "Writable: `var/`, `pub/media/`, `pub/static/`, `generated/`. Read-only in production: `app/code/`, `vendor/`, `lib/`. Modules must never write to `app/code/` or `vendor/` at runtime — runtime-generated content belongs in `var/` or `pub/media/`.",
    hint: "Separate 'code' directories from 'runtime state' directories.",
    topic: "Apr 27 — Security Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 16 — Security Architecture"
  },
  {
    question: "What is the `isAllowed()` call signature, and what common mistake causes it to silently fail?",
    answer: "`AuthorizationInterface::isAllowed()` requires the full resource ID string, e.g., `'Vendor_Module::manage_items'`. Passing only the suffix `'manage_items'` (without the module prefix) will NOT match any resource and will return false, causing an authorization failure.",
    hint: "The method needs the globally unique ID, not just the local name.",
    topic: "Apr 27 — Security Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 16 — Security Architecture"
  },
  {
    question: "In Adobe Commerce Cloud, what is the architectural significance of the read-only filesystem during the deploy phase?",
    answer: "The read-only filesystem enforces immutable deployments — code deployed from Git is exactly what runs in production, preventing runtime file modification attacks. Runtime state (cache, logs, sessions, uploads) must go to writable mounts declared in `.magento.app.yaml` (`var/`, `pub/media/`, etc.), not to code directories.",
    hint: "Immutability enables horizontal scaling and prevents a whole class of runtime attacks.",
    topic: "Apr 27 — Security Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 16 — Security Architecture"
  },
  {
    question: "What is the HTTP status code difference between a missing/invalid token and an authenticated-but-unauthorized REST request?",
    answer: "401 means not authenticated — the token is missing, invalid, or expired. 403 means authenticated but not authorized — the token is valid but the associated role or integration does not have the required ACL resource assigned.",
    hint: "Authentication vs. authorization produce different 4xx codes.",
    topic: "Apr 27 — Security Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 16 — Security Architecture"
  },
  {
    question: "What `escapeHtml()` second-parameter feature exists, and when is it appropriate to use it?",
    answer: "`escapeHtml($text, ['b', 'i', 'strong', 'em'])` accepts an array of allowed HTML tags as a second parameter, permitting those tags to render as markup instead of being escaped. It is only appropriate for admin-configured content from trusted sources — never for user-submitted frontend input.",
    hint: "Think about who controls the content: admin vs. anonymous user.",
    topic: "Apr 27 — Security Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 16 — Security Architecture"
  },
  {
    question: "On Pro plan, why can't a developer push code directly to the Staging or Production branch via git?",
    answer: "Staging and Production run on separate dedicated clusters not connected to the git-push pipeline used by integration environments. All changes must traverse the merge chain (integration → staging → production) to enforce testing, governance, and audit trails.",
    hint: "Think about cluster isolation and what 'dedicated' means architecturally.",
    topic: "Apr 28 — Adobe Commerce Cloud Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 17 — Adobe Commerce Cloud Architecture"
  },
  {
    question: "On a Pro plan, is `.magento.env.yaml` committed to git? How are its values managed instead?",
    answer: "No. On Pro, `.magento.env.yaml` is NOT committed to git. Environment variables are managed via `magento-cloud variable:set` (Cloud CLI) or the Project Web UI to keep environment-specific secrets out of source control.",
    hint: "Contrast this with how Starter plan handles the same file.",
    topic: "Apr 28 — Adobe Commerce Cloud Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 17 — Adobe Commerce Cloud Architecture"
  },
  {
    question: "What happens if `SCD_ON_DEMAND=true` is set in a production environment, and why is it an architectural problem?",
    answer: "Static content is generated on the first request after deployment, causing a multi-second latency spike for the first users. Under load this creates a thundering-herd problem. `SCD_ON_DEMAND=false` must be used in production so static content is pre-generated during the build phase.",
    hint: "Consider what 'on demand' means for the very first visitor after a deploy.",
    topic: "Apr 28 — Adobe Commerce Cloud Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 17 — Adobe Commerce Cloud Architecture"
  },
  {
    question: "During which deployment hook phase is the database unavailable, and what types of operations must therefore be moved to a later phase?",
    answer: "The **build hook** has no database or service access. Any DB-dependent operations — such as schema/data upgrades and config imports — must run in the **deploy hook** or later.",
    hint: "The build container is isolated; services aren't wired up yet.",
    topic: "Apr 28 — Adobe Commerce Cloud Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 17 — Adobe Commerce Cloud Architecture"
  },
  {
    question: "Why is running both the cache and session storage on a single Redis instance considered an architectural anti-pattern for production?",
    answer: "A cache flush (common operation) evicts session data, instantly logging out all users. Cache and sessions have different eviction requirements: cache uses LRU eviction, while sessions require a no-eviction policy. Two separate Redis instances solve both problems.",
    hint: "What happens to active user sessions when you flush the cache?",
    topic: "Apr 28 — Adobe Commerce Cloud Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 17 — Adobe Commerce Cloud Architecture"
  },
  {
    question: "What is required to upgrade OpenSearch/Elasticsearch from a major version (e.g., 1.x → 2.x) on Adobe Commerce Cloud, and why can't you simply update `services.yaml`?",
    answer: "A major version upgrade requires submitting an Adobe Support ticket. Major versions change index formats, require full catalog reindexing, and may have breaking index mapping changes — these are infrastructure-level operations that cannot be self-served by updating `services.yaml`.",
    hint: "Minor version bumps are self-service; major ones are not.",
    topic: "Apr 28 — Adobe Commerce Cloud Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 17 — Adobe Commerce Cloud Architecture"
  },
  {
    question: "What is the difference between setting a Cloud variable with the `env:` prefix versus without it?",
    answer: "A variable prefixed with `env:` is injected directly into `$_ENV` and accessed as `$_ENV['VAR_NAME']`. Without the prefix, the variable is only accessible by decoding the `MAGENTO_CLOUD_VARIABLES` base64-encoded JSON blob.",
    hint: "Third-party extensions that read `$_ENV` directly need a specific prefix.",
    topic: "Apr 28 — Adobe Commerce Cloud Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 17 — Adobe Commerce Cloud Architecture"
  },
  {
    question: "In the Cloud variable hierarchy, what is the correct precedence order from lowest to highest priority?",
    answer: "Project-level variables (lowest) → Environment-level variables → Sensitive variables (highest). Environment-level variables override project-level ones, and sensitive variables win over all.",
    hint: "More specific scope = higher precedence.",
    topic: "Apr 28 — Adobe Commerce Cloud Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 17 — Adobe Commerce Cloud Architecture"
  },
  {
    question: "What does a Cloud snapshot contain, and what is explicitly NOT included?",
    answer: "A snapshot contains a point-in-time database dump and the filesystem state of mounted volumes (var, pub/static, pub/media, app/etc). Application code is NOT included — it lives in git.",
    hint: "Think about what is stored on disk vs. what is version-controlled.",
    topic: "Apr 28 — Adobe Commerce Cloud Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 17 — Adobe Commerce Cloud Architecture"
  },
  {
    question: "What is the key Recovery Point Objective (RPO) advantage Pro Production has over Starter, and what feature enables it?",
    answer: "Pro Production supports **point-in-time recovery (PITR)**, giving an RPO of approximately 1 hour. Starter only has daily automated backups, yielding an RPO of approximately 24 hours.",
    hint: "One plan lets you restore to any moment, not just daily snapshots.",
    topic: "Apr 28 — Adobe Commerce Cloud Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 17 — Adobe Commerce Cloud Architecture"
  },
  {
    question: "How do Fastly surrogate keys (X-Magento-Tags) enable surgical cache invalidation, and what problem do they solve compared to a full cache purge?",
    answer: "Commerce sets the `X-Magento-Tags` header (e.g., `p_42,cat_1`) on responses; Fastly stores these as surrogate keys. When product 42 updates, only pages tagged `p_42` are purged — not the entire cache. This avoids the massive origin load spike caused by a full cache purge.",
    hint: "Tags let you target exactly which cached pages a data change affects.",
    topic: "Apr 28 — Adobe Commerce Cloud Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 17 — Adobe Commerce Cloud Architecture"
  },
  {
    question: "What is the architectural role of VCL snippets in Fastly, and what risk comes from uploading a full custom VCL instead?",
    answer: "VCL snippets are additive to Adobe's managed base VCL — they extend behavior without replacing it. Uploading a full custom VCL replaces the base VCL entirely, which breaks when Adobe updates its base VCL and is strongly discouraged.",
    hint: "Additive vs. replacement — which approach survives platform updates?",
    topic: "Apr 28 — Adobe Commerce Cloud Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 17 — Adobe Commerce Cloud Architecture"
  },
  {
    question: "What is the purpose of the `post_deploy` hook, and why can operations like cache warm-up NOT run in the `deploy` hook?",
    answer: "The `post_deploy` hook runs after the application is live and serving traffic, making it suitable for cache warm-up, smoke tests, and health checks. The `deploy` hook runs while the app is in maintenance mode (offline), so warming the cache then would be wasted before the app becomes accessible.",
    hint: "Consider the app's traffic state during each phase.",
    topic: "Apr 28 — Adobe Commerce Cloud Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 17 — Adobe Commerce Cloud Architecture"
  },
  {
    question: "Which configuration files should NEVER be committed to git in any Adobe Commerce Cloud project?",
    answer: "`app/etc/env.php` (generated by ece-tools at deploy time, never commit anywhere), `pub/static/*` (generated at build), `vendor/*` (installed by Composer), and on Pro, `.magento.env.yaml`. Committing any of these risks exposing secrets or causing environment conflicts.",
    hint: "Generated files and environment-specific secrets are the key categories.",
    topic: "Apr 28 — Adobe Commerce Cloud Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 17 — Adobe Commerce Cloud Architecture"
  },
  {
    question: "On Pro plan, even during an emergency hotfix, why should a developer still route the fix through integration and staging before production?",
    answer: "Staging and Production on Pro are dedicated clusters that cannot receive direct git pushes. Bypassing staging risks deploying untested code to production with no safety net. The correct emergency path is: hotfix branch → integration (test) → staging (verify) → production.",
    hint: "The cluster architecture physically enforces the chain; governance reasons reinforce it.",
    topic: "Apr 28 — Adobe Commerce Cloud Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 17 — Adobe Commerce Cloud Architecture"
  },
  {
    question: "What is the consequence of a custom module calling the database inside a constructor on Adobe Commerce Cloud?",
    answer: "The build phase has no database connection, so a constructor-level DB call causes a fatal error or silent failure during DI compilation, breaking the build. The fix is lazy/deferred DB access.",
    hint: "Consider what services are unavailable in the isolated build container.",
    topic: "Apr 29 — Deployment Pipeline, ECE-Tools & Quality Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 18 — Deployment Pipeline, ECE-Tools & Quality Patches"
  },
  {
    question: "What does getDependencies() do in the patch system, and which interface declares it?",
    answer: "getDependencies() is a static method declared by DependentPatchInterface (which PatchInterface extends). It returns an array of patch class names that must be applied before the current patch, ensuring correct application order.",
    hint: "This is the method that controls patch ordering — not the one that handles renames.",
    topic: "Apr 29 — Deployment Pipeline, ECE-Tools & Quality Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 18 — Deployment Pipeline, ECE-Tools & Quality Patches"
  },
  {
    question: "What is the default SCD strategy on Adobe Commerce Cloud, and why is the 'compact' strategy risky in production?",
    answer: "The default SCD strategy is 'quick', which generates a minimal file set and defers the rest. The 'compact' strategy uses symlinks for shared files — if the symlink target is missing after cleanup, assets break in production.",
    hint: "The riskiest strategy for production is the one that relies on filesystem references rather than copies.",
    topic: "Apr 29 — Deployment Pipeline, ECE-Tools & Quality Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 18 — Deployment Pipeline, ECE-Tools & Quality Patches"
  },
  {
    question: "Why is SCD_ON_DEMAND not recommended for Cloud production environments?",
    answer: "SCD_ON_DEMAND generates static content on the first request, imposing a first-user performance penalty. It is appropriate for Staging and Integration environments but not for Production.",
    hint: "Think about who pays the cost of generation when it's deferred to request time.",
    topic: "Apr 29 — Deployment Pipeline, ECE-Tools & Quality Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 18 — Deployment Pipeline, ECE-Tools & Quality Patches"
  },
  {
    question: "What is the purpose of setting 'composer-exit-on-patch-failure': true in composer.json when using cweagans/composer-patches?",
    answer: "Without this setting, a patch failure is silently ignored and broken or unpatched code is deployed. Setting it to true ensures a failed patch stops the build immediately, preventing silent defects.",
    hint: "The default behavior of cweagans on patch failure is the dangerous behavior you're overriding.",
    topic: "Apr 29 — Deployment Pipeline, ECE-Tools & Quality Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 18 — Deployment Pipeline, ECE-Tools & Quality Patches"
  },
  {
    question: "What is the key difference between QPT (Quality Patches Tool) and cweagans/composer-patches regarding who can create patches and how they are configured on Cloud?",
    answer: "QPT patches are Adobe-managed and configured via QUALITY_PATCHES in .magento.env.yaml; you cannot create your own QPT patches. cweagans applies your own custom or third-party patch files configured in composer.json.",
    hint: "One is Adobe's catalog, one is your own patch files — they also differ in where Cloud configuration lives.",
    topic: "Apr 29 — Deployment Pipeline, ECE-Tools & Quality Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 18 — Deployment Pipeline, ECE-Tools & Quality Patches"
  },
  {
    question: "In a Cloud rolling deploy on Pro, why must database schema changes be backward compatible, and what is the three-deploy pattern?",
    answer: "During a rolling deploy, old and new code run simultaneously on different nodes against the same database. To avoid errors, schema changes must be backward compatible. The three-deploy pattern is: Deploy 1 adds the new column, Deploy 2 migrates data and switches code, Deploy 3 removes the old column.",
    hint: "Consider what happens when Node 1 has new code but Nodes 2 and 3 still run old code against the updated schema.",
    topic: "Apr 29 — Deployment Pipeline, ECE-Tools & Quality Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 18 — Deployment Pipeline, ECE-Tools & Quality Patches"
  },
  {
    question: "Zero-downtime rolling deployment is available on which Adobe Commerce Cloud tier, and what is the key infrastructure enabling it?",
    answer: "Rolling deployment is available on Cloud Pro only (not Cloud Starter). It works via a 3-node production cluster where the load balancer routes traffic around each node as it receives and activates the new code.",
    hint: "The tier distinction is a common exam trap — one tier gets near-zero downtime, the other does not.",
    topic: "Apr 29 — Deployment Pipeline, ECE-Tools & Quality Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 18 — Deployment Pipeline, ECE-Tools & Quality Patches"
  },
  {
    question: "What is the correct Cloud approach when a developer needs to add a new third-party Composer package, and what command is dangerous to run?",
    answer: "Use 'composer require vendor/package' to add only the new package, then 'composer update vendor/package --with-dependencies' to resolve its deps. Running broad 'composer update' is dangerous because it may upgrade ECE-Tools dependencies and break the deployment infrastructure.",
    hint: "The dangerous command updates everything in composer.lock, not just the new package.",
    topic: "Apr 29 — Deployment Pipeline, ECE-Tools & Quality Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 18 — Deployment Pipeline, ECE-Tools & Quality Patches"
  },
  {
    question: "What is the correct action when a critical CVE isolated patch is available but the corresponding full security patch (e.g., -p1) has not yet been released?",
    answer: "Apply the isolated patch immediately via cweagans or QPT to meet PCI DSS SLA requirements. Plan the full patch upgrade when available. Waiting for the full patch risks a PCI compliance violation.",
    hint: "PCI SLA compliance drives the urgency — what is the smallest-scope fix you can apply right now?",
    topic: "Apr 29 — Deployment Pipeline, ECE-Tools & Quality Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 18 — Deployment Pipeline, ECE-Tools & Quality Patches"
  },
  {
    question: "What is the hook name for the post-deploy phase in .magento.app.yaml, and what is a critical behavioral difference between post-deploy failures and deploy failures?",
    answer: "The hook name is post_deploy (underscore, not hyphen). A failure in post-deploy does not take the site down because the site is already live when post-deploy runs, unlike a deploy-phase failure which can leave maintenance mode ON.",
    hint: "The naming is a syntax trap. The behavioral difference relates to site availability when each phase executes.",
    topic: "Apr 29 — Deployment Pipeline, ECE-Tools & Quality Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 18 — Deployment Pipeline, ECE-Tools & Quality Patches"
  },
  {
    question: "Why does moving SCD to the build phase reduce deployment downtime, and what architectural constraint makes this safe?",
    answer: "SCD does not require database access — it reads only from filesystem sources (theme files, vendor, config.php). Moving it to build eliminates SCD time from the maintenance window, since build phase has zero downtime.",
    hint: "Think about what SCD actually reads from, and which phase is the only one with actual site downtime.",
    topic: "Apr 29 — Deployment Pipeline, ECE-Tools & Quality Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 18 — Deployment Pipeline, ECE-Tools & Quality Patches"
  },
  {
    question: "Which writable mounts are unavailable during the Cloud build phase, and why does this matter?",
    answer: "Mounts such as var/ and pub/media/ are not available during build. Any code or process that writes to these paths during build will fail, and env.php does not contain DB credentials at build time.",
    hint: "The build produces an immutable artifact — think about what 'read-only filesystem' implies for runtime mounts.",
    topic: "Apr 29 — Deployment Pipeline, ECE-Tools & Quality Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 18 — Deployment Pipeline, ECE-Tools & Quality Patches"
  },
  {
    question: "What is the difference between DataPatchInterface and SchemaPatchInterface, and what shared method enforces idempotence?",
    answer: "DataPatchInterface handles DML/DQL operations (row inserts, data migrations); SchemaPatchInterface handles DDL operations (table/column changes). Both extend PatchInterface which declares apply() and getAliases(). Idempotence is enforced by the patch_list DB table — each patch runs exactly once.",
    hint: "One handles rows, one handles structure. Think about what prevents a patch from running twice after a rename.",
    topic: "Apr 29 — Deployment Pipeline, ECE-Tools & Quality Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 18 — Deployment Pipeline, ECE-Tools & Quality Patches"
  },
  {
    question: "What are the two ECE-Tools sub-commands that compose the build hook, and what does each one do?",
    answer: "ece-tools build:generate creates configuration files from environment variables, and ece-tools build:transfer moves the generated artifacts to the application's mount points. Both are invoked via their scenario XML files in the hooks configuration.",
    hint: "One creates config, one moves artifacts — think generate then transfer.",
    topic: "Apr 29 — Deployment Pipeline, ECE-Tools & Quality Patches",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 18 — Deployment Pipeline, ECE-Tools & Quality Patches"
  },
  {
    question: "What are the four steps of the correct production upgrade/deploy sequence, and why must `setup:upgrade` run before `setup:di:compile`?",
    answer: "1) `setup:upgrade` 2) `setup:di:compile` 3) `setup:static-content:deploy` 4) `cache:flush`. `setup:upgrade` must run first because it registers new modules and updates the DB schema — new classes referenced in DI config must exist before the compiler scans `di.xml` files.",
    hint: "Each step creates prerequisites for the next; consider what the compiler needs to exist before it runs.",
    topic: "Apr 30 — Configuration Management + Troubleshooting",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 19 — Configuration Management + Troubleshooting"
  },
  {
    question: "What is the correct first diagnostic step when a production site shows a white screen of death (WSOD), and why should you NOT clear cache first?",
    answer: "Check `var/log/exception.log` first — it contains the full stack trace identifying the root cause. Clearing cache before reading logs can destroy evidence and only masks symptoms, allowing the problem to recur.",
    hint: "The log-first principle: fix the root cause, not the symptom.",
    topic: "Apr 30 — Configuration Management + Troubleshooting",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 19 — Configuration Management + Troubleshooting"
  },
  {
    question: "How are sensitive configuration paths (e.g., payment gateway API keys) declared so they are excluded from `app:config:dump` output?",
    answer: "Sensitive paths are registered via `di.xml` by injecting an array of `path => '1'` items into the `sensitive` constructor argument of `Magento\\Config\\Model\\Config\\TypePool`. There is no `config_sensitive.xml` file type in Magento.",
    hint: "The mechanism uses dependency injection configuration, not a dedicated XML config file type.",
    topic: "Apr 30 — Configuration Management + Troubleshooting",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 19 — Configuration Management + Troubleshooting"
  },
  {
    question: "In Magento 2's three-layer configuration hierarchy, what is the correct priority order from lowest to highest?",
    answer: "Layer 1 (lowest): `config.xml` module defaults. Layer 2: `core_config_data` / Admin UI. Layer 3 (highest): Environment variables (`CONFIG__*` pattern or `env.php` `system` key).",
    hint: "Environment variables are set by the ops team and are meant to be impossible to override from the Admin UI.",
    topic: "Apr 30 — Configuration Management + Troubleshooting",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 19 — Configuration Management + Troubleshooting"
  },
  {
    question: "After running `app:config:dump`, why are certain Admin UI configuration fields locked/greyed out, and what is the architecturally correct way to override one of those values for a specific environment?",
    answer: "Values written to `config.php` take precedence over `core_config_data`, locking the Admin UI to enforce environment parity and prevent configuration drift. The architecturally correct override is to set a `CONFIG__*` environment variable (e.g., `CONFIG__DEFAULT__TRANS_EMAIL__IDENT_GENERAL__EMAIL`), which wins at the highest priority layer without altering `config.php`.",
    hint: "Think about the three-layer configuration hierarchy and which layer has the highest priority.",
    topic: "Apr 30 — Configuration Management + Troubleshooting",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 19 — Configuration Management + Troubleshooting"
  },
  {
    question: "Which file stores DB credentials and the encryption key, and is it ever written by `bin/magento app:config:dump`?",
    answer: "`env.php` stores DB credentials, the crypt key, cache/session config, and MAGE_MODE. It is never written by `app:config:dump` — it is created by the Magento installer or edited manually.",
    hint: "One of the two critical PHP config files is committed to VCS; the other is not.",
    topic: "Apr 30 — Configuration Management + Troubleshooting",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 19 — Configuration Management + Troubleshooting"
  },
  {
    question: "There is no `bin/magento cron:status` command. How do you check the status of cron jobs, and what table do you query for stuck jobs?",
    answer: "Query the `cron_schedule` database table directly. Stuck jobs can be identified with: `SELECT * FROM cron_schedule WHERE status = 'running' AND executed_at < NOW() - INTERVAL 1 HOUR;`. Available cron CLI commands are `cron:run`, `cron:install`, and `cron:remove` only.",
    hint: "The answer lies in the database, not in a CLI command.",
    topic: "Apr 30 — Configuration Management + Troubleshooting",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 19 — Configuration Management + Troubleshooting"
  },
  {
    question: "Why must `debug.log` be disabled in production, and what is the correct command to disable it?",
    answer: "Enabling `debug.log` in production is a security and performance risk — it can expose sensitive data in log output and fill disk space rapidly. Disable it with `bin/magento setup:config:set --enable-debug-logging=0`, which writes the `dev/debug/debug_logging` deployment config path to `env.php`.",
    hint: "This is a deployment config setting stored in `env.php`, not a system config value — consider which CLI command writes to that file.",
    topic: "Apr 30 — Configuration Management + Troubleshooting",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 19 — Configuration Management + Troubleshooting"
  },
  {
    question: "What is the difference between `bin/magento cache:clean` and `bin/magento cache:flush`, and which is preferred in most situations?",
    answer: "`cache:clean` removes only Magento-tagged cache entries, leaving non-Magento data in the cache storage intact. `cache:flush` empties the entire cache storage backend. `cache:clean` is preferred because it is less destructive; `cache:flush` is reserved for when the cache storage itself is corrupted.",
    hint: "One command is surgical; the other is nuclear.",
    topic: "Apr 30 — Configuration Management + Troubleshooting",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 19 — Configuration Management + Troubleshooting"
  },
  {
    question: "What is the security risk (beyond performance) of running Magento in `developer` mode on a production environment?",
    answer: "Developer mode displays full stack traces in the browser, exposing file paths, class names, and potentially sensitive data to end users. This is a security vulnerability, not merely a performance concern — an architect must cite both risks.",
    hint: "Stack traces reveal internal application structure visible to any site visitor.",
    topic: "Apr 30 — Configuration Management + Troubleshooting",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 19 — Configuration Management + Troubleshooting"
  },
  {
    question: "What is the architecturally correct logger interface to inject in a custom Magento module, and why should the concrete Monolog class never be injected directly?",
    answer: "Always inject `\\Psr\\Log\\LoggerInterface` (PSR-3). Injecting the concrete `Magento\\Framework\\Logger\\Monolog` class couples the module to a specific logging implementation, preventing the backend from being swapped and violating PSR-3 compliance.",
    hint: "This follows the Dependency Inversion Principle — depend on abstractions, not concretions.",
    topic: "Apr 30 — Configuration Management + Troubleshooting",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 19 — Configuration Management + Troubleshooting"
  },
  {
    question: "What does `generated/` contain, should it be committed to VCS, and how does its handling differ between developer and production modes?",
    answer: "`generated/` contains auto-generated interceptors (plugin wrappers), factories, proxies, and extension attribute interfaces. It must NOT be committed to VCS. In developer mode it is rebuilt automatically per-request; in production mode it must be pre-compiled via `setup:di:compile` before deployment.",
    hint: "Consider what 'build-time output' means for a version control strategy.",
    topic: "Apr 30 — Configuration Management + Troubleshooting",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 19 — Configuration Management + Troubleshooting"
  },
  {
    question: "When is a circular dependency in Magento DI detected — at compile time or at runtime — and how do you resolve it?",
    answer: "It is detected at **compile time** during `bin/magento setup:di:compile`. Resolution: inject `\\Vendor\\Module\\Model\\ClassName\\Proxy` instead of the class directly. The proxy defers instantiation until the first method call (lazy loading), breaking the dependency cycle.",
    hint: "The word 'Proxy' is a suffix you add to the class name in the constructor — Magento auto-generates it.",
    topic: "Apr 30 — Configuration Management + Troubleshooting",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 19 — Configuration Management + Troubleshooting"
  },
  {
    question: "What is the return type rule for an `after` plugin method, and what exception is thrown when it is violated?",
    answer: "An `after` plugin's return type must be compatible with the intercepted method's declared return type. Returning an incompatible type (e.g., `bool` when the original returns `?string`) causes a `TypeError` at runtime, logged in `exception.log` as a CRITICAL.",
    hint: "The generated interceptor enforces the original method's return type contract.",
    topic: "Apr 30 — Configuration Management + Troubleshooting",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 19 — Configuration Management + Troubleshooting"
  },
  {
    question: "What does the `--keep-generated` flag on `setup:upgrade` do, and why is it important in production?",
    answer: "It prevents `setup:upgrade` from deleting the `generated/` directory before running. Without it, Magento deletes `generated/` first, creating a window where interceptors don't exist and requests fail — causing avoidable downtime.",
    hint: "Think about what lives in `generated/` and what happens if those files are absent during a live request.",
    topic: "Apr 30 — Configuration Management + Troubleshooting",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 19 — Configuration Management + Troubleshooting"
  },
  {
    question: "In Magento's Architect Decision Framework, what is the priority order when two answers look technically valid on the exam?",
    answer: "The priority stack from highest to lowest is: (1) Extensibility / Open for extension (interface over concrete class), (2) Cloud-native solution (ECE/Adobe I/O over on-prem hacks), (3) Async over sync for non-critical paths, (4) Contract stability (API-level contracts over implementation), (5) Testability (injectable dependencies, no singletons). The exam never rewards 'it works' answers — it rewards maintainable, extensible, and upgrade-safe solutions.",
    hint: "Think about the five-level priority stack starting with extensibility at the top.",
    topic: "Architect Decision Framework",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 22 — Weak Section Deep Dive + Integration Patterns"
  },
  {
    question: "What is the difference between Extension Attributes and Custom Attributes (EAV) in Magento, and when should an architect choose each?",
    answer: "Extension Attributes are defined in extension_attributes.xml, are strongly typed, use join-based data loading, and are designed to extend core DTOs in the API layer. Custom Attributes (EAV) are stored in EAV tables, are generic key/value pairs with EAV performance penalties, and are for dynamic merchant-defined fields. Extension Attributes require a plugin on the repository (afterGet, afterGetList, beforeSave) to persist, while EAV attributes persist automatically through the EAV framework.",
    hint: "One is declared in XML and extends API data transfer objects; the other lives in EAV tables for merchant-configurable fields.",
    topic: "Service Contracts",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 22 — Weak Section Deep Dive + Integration Patterns"
  },
  {
    question: "Why can't plugins intercept certain types of methods and classes in Magento? List the restrictions.",
    answer: "Plugins cannot intercept: final methods, final classes, static methods, __construct (constructors), non-public methods (private/protected), and virtual types. This is because Magento's interceptor pattern generates a subclass (proxy) of the target class at compile time. Final classes/methods cannot be subclassed, static and non-public methods cannot be overridden through inheritance, and constructors are handled by the DI container before interception.",
    hint: "The interceptor pattern works by generating a subclass — think about what PHP prevents you from overriding in a subclass.",
    topic: "Plugins (Interceptors)",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 22 — Weak Section Deep Dive + Integration Patterns"
  },
  {
    question: "How do around plugins execute in terms of sort order, and what is the common exam trap regarding their execution?",
    answer: "Around plugins wrap in LIFO (Last In, First Out) order for the $proceed portion. Before plugins execute in ascending sortOrder (10, 20, 30), then the original method runs, then after plugins execute in descending sortOrder (30, 20, 10). The key trap is that around plugins that skip calling $proceed() break the entire plugin chain — all subsequent plugins and the original method are never executed. This is an anti-pattern unless explicitly required.",
    hint: "Think about nested function calls — the outermost wrapper has the lowest sortOrder but its $proceed wraps everything inside.",
    topic: "Plugins (Interceptors)",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 22 — Weak Section Deep Dive + Integration Patterns"
  },
  {
    question: "Why must GraphQL resolvers use service contracts instead of resource models directly, and what is required for GraphQL query caching?",
    answer: "GraphQL resolvers must use service contracts (repository interfaces) because they ensure proper plugin interception, caching via IdentityMap, typed exceptions, and maintain the formal API boundary between modules. For query caching, a cache identity class implementing IdentityInterface is required — it returns cache tags based on resolved data (e.g., product CACHE_TAG + ID). Without this class, query-level caching won't work. Mutations bypass HTTP cache automatically by design.",
    hint: "Resolvers sit at the API layer and must respect module boundaries. Caching requires something that returns cache tags per resolved entity.",
    topic: "GraphQL Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 22 — Weak Section Deep Dive + Integration Patterns"
  },
  {
    question: "Explain the MSI reservation system's approach to inventory management. Why does MSI never modify source_item quantity until shipment?",
    answer: "MSI uses compensating reservations — an append-only log in the inventory_reservation table. When an order is placed, a negative reservation is created (e.g., qty=-2, metadata='order:123'). When an order is shipped or cancelled, a positive compensation is appended (e.g., qty=+2, metadata='shipment:456'). Source item quantities are only deducted upon shipment. This is an eventually consistent pattern designed for scalability — it avoids row-level locks on source items during high-concurrency checkout scenarios.",
    hint: "Think append-only log with compensating entries, not direct quantity updates. It's an eventual consistency pattern.",
    topic: "MSI (Multi-Source Inventory)",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 22 — Weak Section Deep Dive + Integration Patterns"
  },
  {
    question: "What is the correct MSI API for checking salable quantity in a multi-source environment, and why is the legacy API wrong?",
    answer: "The correct API is GetProductSalableQtyInterface from magento/module-inventory-sales-api, combined with StockResolverInterface to map a website code to a stock ID. The legacy CatalogInventory\\Api\\StockStateInterface is the single-source API that does not account for multiple sources, stock aggregation across sources, or the reservation system. On the exam, if the store uses multiple sources, the correct API is always MSI's InventorySalesApi.",
    hint: "The legacy API only knows about a single stock source. The correct one lives in the inventory-sales-api package and requires resolving the website to a stock first.",
    topic: "MSI (Multi-Source Inventory)",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 22 — Weak Section Deep Dive + Integration Patterns"
  },
  {
    question: "What happens during the BUILD phase vs DEPLOY phase in Adobe Commerce Cloud, and what critical limitation exists during BUILD?",
    answer: "During BUILD: composer install, code compilation (di:compile), and static content deployment run — but there is NO database connection available, so any code that attempts DB access will fail. The filesystem is writable. During DEPLOY: the DB connection becomes available, setup:upgrade and cache:flush run, and maintenance mode is briefly active. Static content deploy happens in BUILD, not deploy — this is a very common exam question. POST-DEPLOY restores traffic and runs cache warmup and search indexing.",
    hint: "The critical limitation is about database connectivity. Think about which operations need the DB and which don't.",
    topic: "Cloud Deployment",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 22 — Weak Section Deep Dive + Integration Patterns"
  },
  {
    question: "Why must webhook controllers return 200 for already-processed events, and what are the four mandatory steps for a webhook receiver?",
    answer: "Returning a 4xx status for already-processed events triggers the sender to retry delivery, creating an infinite retry loop. The four mandatory steps are: (1) Validate the webhook signature immediately before any processing, (2) Check the idempotency key against persistent storage and return 200 if already processed, (3) Queue the processing — never process the webhook inline/synchronously in the controller, (4) Mark as processed only after the queue publish succeeds, using persistent storage (not memory) for the idempotency record.",
    hint: "External systems interpret non-2xx responses as failure and will retry. Think about the four steps: validate, check, queue, mark.",
    topic: "Integration Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 22 — Weak Section Deep Dive + Integration Patterns"
  },
  {
    question: "What is the difference between Adobe I/O Events and Native Webhooks in Adobe Commerce, and when should an architect choose each?",
    answer: "Adobe I/O Events are outbound async — Magento publishes events to Adobe's cloud messaging bus, and external systems (App Builder Runtime Actions) subscribe to them. They are fire-and-forget, ideal for non-blocking notifications like ERP sync. Native Webhooks are outbound sync — declared in webhooks.xml, Magento calls an external URL as a before/after plugin hook. When required='true', they can block execution. Use Native Webhooks for synchronous enrichment (e.g., fraud check before order placement with tight timeout), and Adobe I/O Events for async notifications.",
    hint: "One is async fire-and-forget through Adobe's cloud bus; the other is synchronous and can block execution when marked as required.",
    topic: "Integration Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 22 — Weak Section Deep Dive + Integration Patterns"
  },
  {
    question: "What is the #1 anti-pattern architects must catch in code review, and what is the correct alternative?",
    answer: "The #1 anti-pattern is making synchronous external API calls in the place_order critical path (checkout observer/plugin). If the external service (ERP, OMS, analytics) is slow or down, the customer's checkout times out, the order may not be placed, and revenue is lost. The correct approach is to publish a message to a queue (RabbitMQ/DB queue) in the observer, then process it asynchronously via a consumer. Only payment authorization, inventory reservation, and order record creation should be synchronous in checkout.",
    hint: "Think about what happens to checkout when an external HTTP call takes 5 seconds or the service is down entirely.",
    topic: "Anti-Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 22 — Weak Section Deep Dive + Integration Patterns"
  },
  {
    question: "Explain the three states of the Circuit Breaker pattern and how it prevents cascading failures in Magento integrations.",
    answer: "Closed state: normal operation, requests pass through to the external service. Open state: the service has exceeded the failure threshold, so requests are immediately rejected (fail fast) without attempting the call — this prevents thread starvation and cascading failures. Half-Open state: after a timeout period, one test request is allowed through; if it succeeds, the circuit returns to Closed; if it fails, it returns to Open. This pattern wraps all external API calls so that one failing service doesn't bring down the entire Commerce application.",
    hint: "Three states named after an electrical circuit. The middle state is about fast failure, and there's a recovery test state.",
    topic: "Integration Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 22 — Weak Section Deep Dive + Integration Patterns"
  },
  {
    question: "How does MAGENTO_CLOUD_RELATIONSHIPS work, and why should service connections never be hardcoded in Adobe Commerce Cloud?",
    answer: "MAGENTO_CLOUD_RELATIONSHIPS is a base64-encoded JSON variable that contains all service connection strings (MySQL, Redis, Elasticsearch/OpenSearch). ECE-Tools automatically parses this variable to generate app/etc/env.php with the correct DB credentials, Redis config, and search engine config. Service connections must never be hardcoded because Cloud environments dynamically provision services — the connection details change between environments and deployments. Sensitive values go in Cloud UI env vars or env.php, never in config.php or config.xml.",
    hint: "It's base64 encoded JSON containing dynamic service connection strings. Think about why hardcoding fails across multiple Cloud environments.",
    topic: "Cloud Environment Variables",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 22 — Weak Section Deep Dive + Integration Patterns"
  },
  {
    question: "In the Payment Provider Gateway framework, what is the correct modern approach to implementing a payment integration, and why is AbstractMethod deprecated?",
    answer: "The modern approach uses the Payment Provider Gateway framework — a pipeline of BuilderInterface (builds request arrays for the gateway), HTTP call via GatewayCommand, and HandlerInterface (processes gateway responses). This is extensible through DI: builders and handlers can be added or removed via di.xml configuration. AbstractMethod is deprecated (since 100.0.6) because it couples all payment operations into a single class, making it difficult to extend, test, and maintain. The pipeline approach separates concerns into composable, individually testable components.",
    hint: "Think pipeline: build request, send HTTP call, handle response — each step is a separate injectable class configured via DI.",
    topic: "Payment Integrations",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 22 — Weak Section Deep Dive + Integration Patterns"
  },
  {
    question: "Why should indexers always use 'schedule' mode in production, and what is the architectural impact of using 'realtime' mode?",
    answer: "In 'realtime' (Update on Save) mode, every product save triggers synchronous reindexing across all affected indexes, causing admin save operations to take 30-60 seconds on large catalogs and potentially serving inconsistent data during the reindex. Schedule mode (MView) records changes in changelog tables and processes deltas via cron (typically every minute). This makes admin saves return immediately and processes only changed entities. The tradeoff is up to 1 minute of latency before the index reflects changes, which is acceptable for most production scenarios.",
    hint: "One mode blocks the admin save while reindexing everything; the other records changes to a changelog and processes them asynchronously via cron.",
    topic: "Performance Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 22 — Weak Section Deep Dive + Integration Patterns"
  },
  {
    question: "When should an architect choose a Plugin vs an Event Observer vs a Preference for extending Magento functionality?",
    answer: "Use a Plugin when you need to modify method input arguments (before), modify return values (after), or conditionally skip execution (around) — it works on non-final public methods and multiple plugins can coexist via sortOrder. Use an Event Observer when you want to react to something that happened with zero coupling and don't need to modify the return value — multiple observers coexist naturally. Use a Preference ONLY for implementing a new concrete class for an interface defined in di.xml. Preference on a concrete class is a last resort because only one preference can win, silently breaking other modules that also override the same class.",
    hint: "Think about coupling level: observer is lowest, plugin is medium, preference is highest. Also consider whether you need to modify a return value.",
    topic: "Architecture Decision Records",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 23 — Architecture Decision Records + Catalog Pricing Deep Dive"
  },
  {
    question: "What is the architectural rule for Repository vs Collection usage across module boundaries, and when is Collection use justified?",
    answer: "Repository (service contract) is required for ALL cross-module data access — it returns DTOs/interfaces, is cacheable via IdentityMap, plugin-able, and uses SearchCriteriaInterface for filtering/sorting/pagination. Collections are an internal implementation detail and must NEVER cross module boundaries. Collection use is justified only for: bulk indexing operations, complex report queries, or performance-critical internal operations where DTO overhead would be significant. The key rule: Module A accessing Module B's data must always go through the Repository interface.",
    hint: "The formal API boundary uses interfaces and DTOs. The internal implementation uses collections. Think about which one can be intercepted and cached.",
    topic: "Repository vs Collection",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 23 — Architecture Decision Records + Catalog Pricing Deep Dive"
  },
  {
    question: "Describe the complete price waterfall in Magento and explain why catalog price rules and cart price rules are not interchangeable.",
    answer: "The price waterfall resolves in order: Regular Price -> Special Price (min) -> Tier Price (min, if qty threshold met) -> Group Price -> Catalog Price Rule (min). Each step takes the minimum of the current price and the new price. Catalog rules are applied at INDEX time, stored in catalog_product_index_price, and visible on PLP/PDP as crossed-out prices. Cart rules apply at CART time only, are never in the price index, and are only visible in the cart. If you need a discount visible on the product listing page, you MUST use a Catalog Price Rule.",
    hint: "Each step uses min(). One type is in the price index and shows on product pages; the other only appears when items are in the cart.",
    topic: "Catalog Pricing",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 23 — Architecture Decision Records + Catalog Pricing Deep Dive"
  },
  {
    question: "How does the catalog_product_index_price table scale, and why must an architect flag adding customer groups as a scaling concern?",
    answer: "The catalog_product_index_price table stores one row per product x customer group x website combination. For a store with 100,000 products, 10 customer groups, and 5 websites, that's 5,000,000 rows. Adding customer groups has a multiplicative effect on both index table size and reindex time. An architect must flag this when asked about scaling decisions because each new customer group multiplies the total rows by a factor proportional to the product count x website count, directly impacting reindex duration and query performance.",
    hint: "Think about the primary key: (entity_id, customer_group_id, website_id). Each new group multiplies the total rows.",
    topic: "Price Indexing",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 23 — Architecture Decision Records + Catalog Pricing Deep Dive"
  },
  {
    question: "Why do catalog price rules have a cron dependency, and what is the two-step process from rule creation to storefront price display?",
    answer: "When a catalog price rule is saved, it populates catalogrule_product (mapping rules to products/groups). The cron job catalogrule_apply_all (runs daily at 1am by default) or manual reindex populates catalogrule_product_price with calculated rule prices per product/date/website/group. Then the price indexer reads catalogrule_product_price and updates catalog_product_index_price.final_price. If the cron hasn't run after creating a rule, the price index won't reflect it — this is the most frequent source of 'my catalog rule isn't working' support issues.",
    hint: "Two tables are involved before the price index: one maps rules to products, the other calculates the actual rule prices. A cron job connects them.",
    topic: "Catalog Pricing",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 23 — Architecture Decision Records + Catalog Pricing Deep Dive"
  },
  {
    question: "What do final_price, min_price, max_price, and tier_price represent in the catalog_product_index_price table?",
    answer: "final_price is the winning price after all catalog-level discounts (special price, catalog rules) for qty=1 — this is what the customer sees on product pages. min_price is the absolute best possible price (best tier price combined with best catalog rule) — used for 'as low as' display on PLPs. max_price is the undiscounted regular price. tier_price is the best available tier price regardless of quantity threshold — stored separately so the frontend can show tiered pricing messaging. The actual price at checkout depends on cart quantity triggering tier thresholds.",
    hint: "Each column serves a different storefront display purpose: standard price, best possible price, original price, and quantity-based price.",
    topic: "Price Indexing",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 23 — Architecture Decision Records + Catalog Pricing Deep Dive"
  },
  {
    question: "Explain the difference between Varnish FPC and Redis FPC, and when should an architect recommend each?",
    answer: "Varnish operates at the reverse proxy layer — cached responses are served directly without PHP execution, making it 10-100x faster than Redis FPC. It supports ESI (Edge Side Includes) for hole-punching dynamic content blocks. Redis FPC operates at the application layer — PHP still runs but reads the cached page from Redis instead of rebuilding it. Varnish is recommended for all production environments (especially >100 req/min), while Redis FPC is acceptable for dev/staging or very low-traffic sites. Varnish requires SSL termination via Nginx/HAProxy in front.",
    hint: "One serves cached responses without touching PHP at all; the other still runs PHP but avoids page rendering. Think about which layer they operate at.",
    topic: "Caching Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 23 — Architecture Decision Records + Catalog Pricing Deep Dive"
  },
  {
    question: "Why can't Varnish cache checkout pages, and how does Magento handle dynamic content on otherwise cacheable pages?",
    answer: "Checkout pages contain private, session-specific data (cart contents, customer address, payment info) that must not be served to other users. They are excluded via cacheable='false' in layout XML or VCL exclusion rules. For cacheable pages with dynamic elements (cart count, customer name), Magento uses ESI (Edge Side Includes) for server-side hole-punching and AJAX-based private content via /customer/section/load/ (configured in sections.xml). Private content sections are NEVER cached by Varnish — they are fetched client-side after the cached page loads.",
    hint: "Session-specific data can't be shared between users. Dynamic blocks use two mechanisms: server-side ESI tags and client-side AJAX section loading.",
    topic: "Caching Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 23 — Architecture Decision Records + Catalog Pricing Deep Dive"
  },
  {
    question: "What makes switching from DB queue to RabbitMQ transport-agnostic in Magento, and which files need to change?",
    answer: "The topic definition in communication.xml is transport-agnostic — it only defines the topic name and data type. Publisher code and consumer handler code do not change when switching transports. Only queue_publisher.xml (connection name) and queue_topology.xml (exchange connection) need to be updated to change from 'db' to 'amqp'. This separation of concerns means the business logic in consumers is completely decoupled from the message transport infrastructure.",
    hint: "The topic is defined once and doesn't care about transport. Only the infrastructure configuration XML files change, not the PHP code.",
    topic: "Message Queue Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 23 — Architecture Decision Records + Catalog Pricing Deep Dive"
  },
  {
    question: "What is the N+1 query anti-pattern in Magento, and what is the architect-recommended solution?",
    answer: "The N+1 pattern occurs when code loads entities one at a time inside a loop — each iteration executes a separate database query (e.g., calling productRepository->getById() for each cart item). For N items, this produces N+1 queries (1 for the collection + N for individual loads). The solution is to use SearchCriteriaBuilder with an 'in' filter to bulk-load all entities in a single query, then iterate over the results. This is especially critical in checkout flows where the N+1 pattern directly impacts customer-facing response times.",
    hint: "Loading entities in a foreach loop creates one query per iteration. The fix involves loading all needed entities in one batch query.",
    topic: "Anti-Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 23 — Architecture Decision Records + Catalog Pricing Deep Dive"
  },
  {
    question: "What are the three tax calculation methods in Magento, and why is row-based recommended for most stores?",
    answer: "Unit-based calculates tax per item unit then multiplies by quantity. Row-based calculates tax on the line total (price x qty). Total-based calculates tax on the order total after all discounts. Row-based is recommended because it minimizes rounding discrepancies across line items. Unit-based can cause penny differences when order-level discounts interact with per-unit tax rounding — for example, a $9.99 item at 10% tax rounds to $1.00/unit, but 3 units' row total of $29.97 at 10% rounds differently. These penny differences accumulate across large orders.",
    hint: "The issue is about where rounding happens: per unit, per line, or per order total. The recommended approach reduces rounding errors across multiple line items.",
    topic: "Tax Calculation",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 23 — Architecture Decision Records + Catalog Pricing Deep Dive"
  },
  {
    question: "How do Shared Catalog and Negotiable Quote pricing interact in Adobe Commerce EE, and what is the price authority hierarchy?",
    answer: "The price authority hierarchy from highest to lowest is: (1) Negotiable Quote price (manually set by sales rep, highest priority), (2) Catalog price from index (includes catalog rules, tier prices, special prices, Shared Catalog prices), (3) Cart Price Rules (lowest priority). Shared Catalog creates a dedicated customer group with catalog-specific pricing that overrides standard tier prices. Negotiable Quote prices are NOT stored in the price index — they live in quote snapshot tables. When a quote converts to an order, the negotiated price is locked regardless of subsequent catalog changes.",
    hint: "Sales rep manual price beats everything. Shared Catalog works through customer groups. The negotiated price lives outside the price index.",
    topic: "Enterprise Edition Pricing",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 23 — Architecture Decision Records + Catalog Pricing Deep Dive"
  },
  {
    question: "What is Fixed Product Tax (FPT) and how does it differ from traditional tax rates in Magento?",
    answer: "FPT is a fixed dollar amount surcharge added to a product regardless of quantity or customer group — used for regulatory fees like environmental fees or mattress recycling fees. Unlike percentage-based tax rates, FPT is NOT reduced by discounts (catalog or cart rules). It appears as a separate line item in the cart and can be configured to be included in or added to the displayed price. FPT is not a tax calculation — it's a fixed surcharge that exists outside the normal price waterfall.",
    hint: "It's a fixed dollar amount, not a percentage. Think environmental or recycling fees that don't change with discounts or quantities.",
    topic: "Tax Calculation",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 23 — Architecture Decision Records + Catalog Pricing Deep Dive"
  },
  {
    question: "When a requirement contradicts the standard price waterfall (e.g., 'wholesale price but never lower than special price'), what is the correct architectural approach?",
    answer: "The standard price waterfall always takes the minimum at each step — you cannot make a catalog rule 'win' over a special price if the special price is lower. When a requirement contradicts this built-in behavior, the answer is a custom price calculation using a plugin on the price calculation method, not a creative combination of standard price types. Trying to force standard catalog rules, tier prices, or special prices to behave contrary to the min() waterfall will fail. The exam tests whether you recognize when standard tools are insufficient.",
    hint: "The waterfall always picks the lowest price at each step. If the requirement needs a higher price to win, no standard configuration can achieve this.",
    topic: "Catalog Pricing",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 23 — Architecture Decision Records + Catalog Pricing Deep Dive"
  },
  {
    question: "Why should an architect use the anti-pattern detection approach for ObjectManager direct use, and what is the only legitimate exception?",
    answer: "Direct ObjectManager use bypasses the DI container entirely: dependencies become hidden (not visible in constructor), classes cannot be substituted in tests, plugins/interceptors are bypassed (the proxy pattern is skipped), and virtual types and compile-time optimization are broken. The only legitimate exception is in framework-generated classes: factory classes, proxies, and interceptors generated by bin/magento setup:di:compile. These are framework infrastructure concerns, not application code. All application code must use constructor injection.",
    hint: "Four things break: visibility, testability, interceptability, and compile-time optimization. Only auto-generated framework classes are exempt.",
    topic: "Anti-Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 23 — Architecture Decision Records + Catalog Pricing Deep Dive"
  },
  {
    question: "What is the architectural significance of Content Staging's row_id vs entity_id change in Adobe Commerce EE?",
    answer: "In EE, row_id replaces entity_id as the primary key of entity tables (e.g., catalog_product_entity). entity_id identifies the product permanently and never changes, while row_id identifies a specific version of that product (one per staging update). All EAV attribute tables use row_id as the foreign key in EE. The created_in and updated_in Unix timestamps define each version's validity window. Custom modules that use entity_id as a direct FK to product tables will break staging because they won't be version-aware.",
    hint: "The PK changed from the entity identifier to the version identifier. EAV foreign keys follow the PK. Think about what breaks when you hardcode the old FK.",
    topic: "EE vs CE",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 24 — EE vs CE Feature Matrix + Architect Scenarios Drill"
  },
  {
    question: "How does Shared Catalog work internally at the implementation level, and why is this architecturally important?",
    answer: "Shared Catalog internally creates a dedicated customer group for each catalog and uses category permissions (catalogpermissions index) to control product visibility. When a company is assigned to a shared catalog, its customers are assigned to the corresponding customer group. This means Shared Catalog pricing equals customer group pricing at the implementation level. This is architecturally important because it leverages existing infrastructure (customer groups, tier prices, category permissions) rather than creating a parallel pricing system, but it also means adding shared catalogs multiplies the price index size.",
    hint: "It reuses two existing Magento mechanisms: one for pricing and one for visibility. Each catalog creates its own instance of the first mechanism.",
    topic: "B2B Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 24 — EE vs CE Feature Matrix + Architect Scenarios Drill"
  },
  {
    question: "What is the architectural tradeoff of Async Order (Magento_AsyncOrder), and how does it relate to the CAP theorem?",
    answer: "Async Order publishes order placement to a message queue and returns an immediate 202 Accepted response. The tradeoff is availability vs. consistency (CAP theorem): you gain higher throughput and faster user response (availability), but accept the risk of overselling in the window between order receipt and stock deduction (consistency). Deferred stock updates mean inventory lock contention is avoided during high-concurrency checkout, but the system is eventually consistent rather than strongly consistent. The exam tests whether you can identify this specific tradeoff.",
    hint: "Think CAP theorem: which two properties does async order prioritize, and which one does it sacrifice?",
    topic: "Async Order Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 24 — EE vs CE Feature Matrix + Architect Scenarios Drill"
  },
  {
    question: "Explain why 503 errors after deployment are a Varnish health check timing issue and not an application error. What are the solutions?",
    answer: "After deployment, PHP-FPM restarts and the app server needs warmup time. Varnish's health check probe fires during this window and fails, marking the backend as SICK. All subsequent requests return 503 until enough probe checks pass (threshold of window). With interval=5s and threshold=3, that's at minimum 15 seconds of downtime after the app is ready. Solutions include: (1) adjusting probe parameters (shorter interval, lower threshold), (2) blue/green deployment where traffic switches only after the new environment is verified healthy, (3) cache warmup before disabling maintenance mode.",
    hint: "The app IS working — the proxy just hasn't confirmed it yet. The math involves probe interval x threshold = minimum recovery time.",
    topic: "Varnish Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 24 — EE vs CE Feature Matrix + Architect Scenarios Drill"
  },
  {
    question: "What causes entire FPC invalidation on every product save, and how should the identities() method be correctly implemented?",
    answer: "The root cause is blocks returning generic cache tags (e.g., 'cat_p' for all products) instead of specific entity tags (e.g., 'cat_p_123' for product ID 123). When any product is saved, the generic tag invalidates ALL pages containing ANY product block. The correct identities() implementation must return specific entity tags like CACHE_TAG . '_' . $this->getId(). Varnish uses BAN requests based on X-Magento-Tags response headers to do targeted invalidation — generic tags defeat this granular purging mechanism. An empty identities() array means the block is never invalidated (stale data risk).",
    hint: "The cache tag must include the specific entity ID, not just the entity type. Think about what Varnish's BAN regex matches against.",
    topic: "Cache Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 24 — EE vs CE Feature Matrix + Architect Scenarios Drill"
  },
  {
    question: "What is the difference between Customer Segments and Related Products Rules (Target Rules) in EE, and what is the performance risk of Customer Segments?",
    answer: "Customer Segments dynamically group customers based on real-time evaluated conditions (order history, cart contents, location) and are used by banners, cart price rules, and target rules. Target Rules automatically populate Related/Up-Sell/Cross-Sell blocks based on configurable rules instead of manual assignment. The performance risk: segments are evaluated per-session, so too many complex segments with a large customer base cause slow page loads. Segment membership is cached in customer_segment_customer table and stored in the customer session, with cron and observer patterns keeping it updated.",
    hint: "One groups customers dynamically; the other automates product merchandising. The performance risk is about per-session evaluation overhead.",
    topic: "Customer Segments",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 24 — EE vs CE Feature Matrix + Architect Scenarios Drill"
  },
  {
    question: "How does Live Search differ architecturally from native OpenSearch/Elasticsearch in Adobe Commerce?",
    answer: "Live Search is a SaaS subscription that completely replaces native OpenSearch/Elasticsearch. Product data is synced via the Magento_DataExporter module to Adobe's cloud, where the search index is maintained externally. Search queries are served via GraphQL API from Adobe's cloud, not from your infrastructure. It requires: EE license, SaaS data space provisioned separately, API keys configured in Commerce Services Connector, and saas-export + live-search modules installed. Key distinction: Live Search is NOT bundled with EE — it requires a separate subscription and data leaves your instance (PCI/data residency implications).",
    hint: "The search index lives entirely in Adobe's cloud, not on your servers. It requires three things beyond an EE license.",
    topic: "Live Search",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 24 — EE vs CE Feature Matrix + Architect Scenarios Drill"
  },
  {
    question: "What is the difference between RMA and Credit Memo in Adobe Commerce, and why is this distinction architecturally important?",
    answer: "An RMA (Return Merchandise Authorization) is a workflow/process for managing the physical return of goods — it tracks the request, approval, shipping label generation, and receipt of returned items. A Credit Memo is the financial document that reverses the payment. They are separate but linked: an RMA can result in a credit memo, but they are not the same thing. This distinction is architecturally important because the RMA has its own state machine (Pending, Authorized, Received, Approved, etc.) and involves carrier API integration for shipping labels, while the credit memo is purely a financial transaction.",
    hint: "One is a physical goods workflow with its own state machine; the other is a financial document. They are linked but serve different purposes.",
    topic: "EE Features",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 24 — EE vs CE Feature Matrix + Architect Scenarios Drill"
  },
  {
    question: "How does MView (Materialized View) architecture work for delta indexing, and what are the changelog tables?",
    answer: "MView uses database triggers on source tables (e.g., catalog_product_entity) to automatically record changes in changelog tables named {entity_table}_cl (e.g., catalog_product_cl). Each changelog entry contains a version_id and entity_id. A cron job (running every minute) reads the changelog, processes only the changed entities (delta reindex), and updates the index tables. This avoids full reindexing on every save. The key advantage is that admin saves return immediately since the trigger only writes a small changelog entry, and the heavy indexing work happens asynchronously via cron.",
    hint: "Database triggers capture changes into _cl tables. A cron job reads only the changed entity IDs and processes just those — not the entire catalog.",
    topic: "Indexer Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 24 — EE vs CE Feature Matrix + Architect Scenarios Drill"
  },
  {
    question: "In an architect scenario where a merchant processes 50,000 orders/day with 500/minute peak, why is RabbitMQ the correct queue choice over DB queue?",
    answer: "At 500 orders/minute, DB queue's polling-based approach creates significant database load and latency (poll interval adds up to 5 seconds per message). DB queue has no native Dead Letter Queue (DLQ) support for failed messages, limited consumer scaling, and no message ordering guarantees. RabbitMQ provides: high throughput (tens of thousands/min), guaranteed per-queue message ordering, built-in DLQ via Dead Letter Exchange for retry handling, configurable message TTL, horizontal consumer scaling, and a management UI for monitoring. For high-volume production scenarios, RabbitMQ is always the correct answer.",
    hint: "Consider throughput capacity, failure handling (DLQ), consumer scaling, and the overhead of polling a database at 500 messages per minute.",
    topic: "Message Queue Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 24 — EE vs CE Feature Matrix + Architect Scenarios Drill"
  },
  {
    question: "What is the Decorator pattern approach for extending a final class in Magento, and when should it be used over a plugin?",
    answer: "When a class is final, plugins cannot intercept it because Magento's interceptor pattern generates a subclass (which final prevents). The Decorator pattern wraps the original class: create a new class implementing the same interface, inject the original class via DI, delegate all method calls to the original while adding your custom behavior (e.g., logging). Register via preference on the interface (not the concrete class). Use Decorator when: the target class is final, you need to add cross-cutting concerns like logging or caching, or you want cleaner separation than an around plugin provides.",
    hint: "You can't subclass a final class, but you can wrap it. Implement the same interface, inject the original, and delegate with additions.",
    topic: "Design Patterns",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 24 — EE vs CE Feature Matrix + Architect Scenarios Drill"
  },
  {
    question: "What are the four queue configuration XML files in Magento, what does each do, and what is the most common cause of 'consumer not processing messages'?",
    answer: "The four files are: (1) communication.xml — defines topics and their data types (transport-agnostic), (2) queue_topology.xml — defines exchanges and bindings (maps topics to queues), (3) queue_consumer.xml — defines consumers, their handlers, and connection type, (4) queue_publisher.xml — defines publisher connections (optional override). The most common cause of consumers not processing messages is a missing communication.xml topic definition or a missing queue_topology.xml binding. All four files must work together — a topic must be defined before it can be bound, published to, or consumed from.",
    hint: "Four XML files form a chain: define the topic, bind it to a queue, configure the consumer, and optionally configure the publisher. Missing any link breaks the chain.",
    topic: "Message Queue Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 24 — EE vs CE Feature Matrix + Architect Scenarios Drill"
  },
  {
    question: "How does Reward Points differ from Store Credit architecturally, and what is important about the Reward Points storage model?",
    answer: "Reward Points uses a ledger/transaction system — every earning and redemption event creates a row in magento_reward_history with balance adjustments. Points have exchange rates (e.g., 100 points = $1) and optional expiry dates. Store Credit is a per-customer balance (magento_customerbalance) that directly represents a dollar amount, tracked in magento_customerbalance_history. The key architectural difference: Reward Points are code-bound with complex rules (earning on purchases, registration, reviews), while Store Credit is account-bound and typically given as refund alternatives. Both are EE-only but the ledger model matters for auditing and rollback scenarios.",
    hint: "One is a points ledger with exchange rates and earning rules; the other is a direct dollar balance tied to a customer account.",
    topic: "EE Features",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 24 — EE vs CE Feature Matrix + Architect Scenarios Drill"
  },
  {
    question: "How is Page Builder content stored in Magento, and why does this matter for migration and programmatic content manipulation?",
    answer: "Page Builder content is stored as structured HTML with data-content-type attributes embedded in the HTML string within the content field of cms_block or cms_page tables. It is NOT stored as JSON or in a separate table. This matters because: (1) migrating content requires parsing HTML with specific data attributes rather than deserializing structured data, (2) programmatic manipulation requires HTML DOM parsing rather than simple JSON operations, (3) content portability between environments depends on the HTML structure being preserved exactly. This is a CE vs EE distinction — CE only has basic TinyMCE WYSIWYG.",
    hint: "It's HTML with special data attributes in the same field that normally holds CMS content — not a separate structured format.",
    topic: "Page Builder",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 24 — EE vs CE Feature Matrix + Architect Scenarios Drill"
  },
  {
    question: "In Magento 2's plugin system, what happens when an around plugin skips calling $proceed()?",
    answer: "When an around plugin skips $proceed(), it breaks the entire plugin chain for all lower-priority plugins. The original method never executes, and no subsequent around, before (already queued), or after plugins in the chain will fire. This is architecturally dangerous and should only be used as a last resort.",
    hint: "Think about what $proceed() represents in the chain — it's not just the original method.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 25 — Practice Test #5 + Final Cheat Sheet"
  },
  {
    question: "When two plugins have the same sortOrder value, how does Magento determine which runs first?",
    answer: "Magento resolves equal sortOrder by module load sequence — the order in which modules are loaded based on their sequence declarations in module.xml and composer dependency resolution. This is NOT alphabetical by module name. In production code, always set explicit and unique sortOrder values to avoid ambiguity.",
    hint: "The tiebreaker relates to how modules are registered, not their names.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 25 — Practice Test #5 + Final Cheat Sheet"
  },
  {
    question: "What is the difference between custom_attributes and extension_attributes in the Magento REST API response?",
    answer: "custom_attributes in the API response represent EAV attributes — scalar values stored in entity value tables (e.g., catalog_product_entity_varchar). extension_attributes represent developer-defined data attached via extension_attributes.xml, backed by custom tables or computed values. They are different extensibility mechanisms operating at different layers.",
    hint: "One is a database storage pattern, the other is an API/interface-level extension mechanism.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 25 — Practice Test #5 + Final Cheat Sheet"
  },
  {
    question: "In Magento's Full Page Cache (FPC), how does cache tag-based invalidation work when a product is saved?",
    answer: "When a product is saved, the afterSave() method triggers CacheContext to register the entity's cache tags (e.g., cat_p_{productId}). Varnish or the built-in FPC then purges only pages tagged with that specific identifier via the X-Magento-Tags response header. This is the scalable invalidation mechanism — far superior to flushing an entire cache type.",
    hint: "The response header that carries these identifiers is key to how Varnish knows which pages to purge.",
    topic: "Performance",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 25 — Practice Test #5 + Final Cheat Sheet"
  },
  {
    question: "Why must setup:upgrade run in the deploy phase (not the build phase) on Adobe Commerce Cloud?",
    answer: "setup:upgrade executes schema patches and data patches that require a database connection. During the build phase, no database or external services (Redis, Elasticsearch) are available. Running DB-dependent commands in the build phase causes connection errors and pipeline failures. This is an architectural constraint of the Cloud deployment model.",
    hint: "Consider what resources are available in each deployment phase.",
    topic: "Cloud",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 25 — Practice Test #5 + Final Cheat Sheet"
  },
  {
    question: "Explain the MSI reservation pattern: why are rows in inventory_reservation never updated or deleted?",
    answer: "The inventory_reservation table uses an append-only (event sourcing/CQRS) pattern. Reservations are created with negative quantity on order placement and compensated with positive quantity on shipment or cancellation. This eliminates row-level locking on inventory tables during high-concurrency checkout, preventing the deadlocks that plagued pre-MSI Magento.",
    hint: "Think about what happens to database row locks when multiple customers check out simultaneously.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 25 — Practice Test #5 + Final Cheat Sheet"
  },
  {
    question: "What are the five factors that compose the X-Magento-Cache-Id for GraphQL response caching?",
    answer: "The X-Magento-Cache-Id is a SHA-256 hash of five context factors registered via CacheIdFactorProviderInterface: store code (StoreProvider), currency code (CurrencyProvider), customer group ID (CustomerGroupProvider), customer tax rate (CustomerTaxRateProvider), and authentication state (IsLoggedInProvider). A random salt from env.php is also included in the hash.",
    hint: "These are registered as factor providers in etc/graphql/di.xml across several modules.",
    topic: "Performance",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 25 — Practice Test #5 + Final Cheat Sheet"
  },
  {
    question: "In Magento's price waterfall, at what level do catalog price rules vs. cart price rules operate, and how does this affect the final price?",
    answer: "Catalog price rules operate at the catalog level — they are pre-calculated in the catalogrule_product_price table and combined with base price, special price, and tier price to determine the final catalog price (the minimum of all four). Cart price rules operate at the quote/totals level, applied after the catalog price is determined, via total collectors defined in sales.xml.",
    hint: "One is pre-computed and stored in a dedicated table; the other runs during cart total collection.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 25 — Practice Test #5 + Final Cheat Sheet"
  },
  {
    question: "What conditions must ALL be true for a Magento order to reach the 'complete' state?",
    answer: "An order reaches the 'complete' state only when it has BOTH a shipment AND an invoice created for all items. If only an invoice exists (payment captured but not shipped), or only a shipment exists, the order remains in the 'processing' state. This is a common exam scenario where partial fulfillment keeps the order in processing.",
    hint: "Two separate fulfillment documents must both exist for the state transition to occur.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 25 — Practice Test #5 + Final Cheat Sheet"
  },
  {
    question: "Why are virtual types in Magento's DI system considered compile-time constructs, and what are their limitations?",
    answer: "Virtual types create a named configuration variant of an existing PHP class without generating a new PHP file. They exist only in the DI container configuration, resolved at compile time by setup:di:compile. You cannot instantiate a virtual type with the 'new' keyword or use it outside the DI container. They are ideal for creating different configurations of the same service class.",
    hint: "Think about what happens if you try to reference the virtual type name directly in PHP code.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 25 — Practice Test #5 + Final Cheat Sheet"
  },
  {
    question: "Which Magento order states allow cancellation, and what is the correct approach for handling refunds on completed orders?",
    answer: "Orders can only be canceled from three states: 'new', 'pending_payment', and 'processing'. Once an order reaches 'complete' or 'closed' state, cancellation is not possible. For completed orders, the only mechanism is issuing a credit memo (refund), which transitions the order to the 'closed' state. The 'holded' state also cannot be canceled — the order must be un-held first.",
    hint: "Terminal states and the complete state each have specific constraints on available actions.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 25 — Practice Test #5 + Final Cheat Sheet"
  },
  {
    question: "When should you choose an API Functional test vs. MFTF vs. an Integration test for a custom REST endpoint in Magento?",
    answer: "A custom REST endpoint should be tested with an API Functional test, which validates HTTP contracts, response structure, status codes, and authentication flows without needing a browser. MFTF requires a browser and is for UI workflows. Integration tests are for testing service + model + DB interactions. Unit tests cannot test HTTP layer concerns. The architectural answer is always API Functional for endpoint contract validation.",
    hint: "Consider which test type can validate HTTP method, status codes, and response structure without a browser.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 25 — Practice Test #5 + Final Cheat Sheet"
  },
  {
    question: "What is the recommended SCD (Static Content Deploy) strategy for Adobe Commerce Cloud production, and why?",
    answer: "The recommended strategy is to run SCD during the build phase with SCD_ON_DEMAND=false and SCD_STRATEGY=quick. This pre-generates all static files before deployment begins, resulting in a smaller maintenance window during the deploy phase. The 'quick' strategy (default) deploys only active themes for efficiency. SCD_ON_DEMAND=true causes latency spikes on first request per asset after deploy.",
    hint: "Think about which deployment phase has no services but does have a writable filesystem.",
    topic: "Cloud",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 25 — Practice Test #5 + Final Cheat Sheet"
  },
  {
    question: "Which features are exclusive to Adobe Commerce EE and NOT available in the Open Source (CE) edition? Name at least 6.",
    answer: "EE-only features include: Content Staging (scheduled entity updates), Customer Segments (dynamic targeting), RMA (Return Merchandise Authorization), B2B modules (Company Accounts, Shared Catalogs, Negotiable Quotes, Requisition Lists), Gift Cards, Reward Points, Store Credit, Visual Merchandiser, Admin Action Log, Target Rules, and the Distance-based MSI Source Selection Algorithm.",
    hint: "Think about features related to B2B, scheduled content, loyalty programs, and advanced merchandising.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 25 — Practice Test #5 + Final Cheat Sheet"
  },
  {
    question: "In Magento's DI system, why are plugins architecturally preferred over preferences for modifying behavior, and when is a preference the only option?",
    answer: "Plugins are preferred because they stack — multiple modules can add plugins to the same method without conflict, each with guaranteed execution order via sortOrder. Preferences do a full class substitution, and when two modules declare a preference for the same interface, only the last one in load order wins, breaking the other. A preference is the only option when you need to intercept a final method or final class, which cannot be pluginized.",
    hint: "Consider what happens when two third-party modules both need to modify the same class.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 25 — Practice Test #5 + Final Cheat Sheet"
  },
  {
    question: "In the context of EE Content Staging, what is the difference between row_id and entity_id, and why does this matter for custom extensions?",
    answer: "In EE, row_id is the physical primary key that identifies a specific temporal version of an entity, while entity_id is the logical business identity shared across all versions. Custom extensions must join on row_id (not entity_id) to avoid returning duplicate rows for each staging version. In CE, row_id does not exist — entity_id serves as both physical and logical key. EE-compatible extensions must handle this difference.",
    hint: "Think about what happens when one product has multiple scheduled versions stored in the same table.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 26 — Exam Eve: Light Review"
  },
  {
    question: "Why does setting cacheable='false' on a single layout block have such a dramatic performance impact?",
    answer: "When any single block in a layout has cacheable='false', the ENTIRE page is excluded from Full Page Cache (FPC) — not just that block. Every request to that URL hits the full PHP/application stack. The correct architectural pattern for personalized content is private content sections (customer-data JS loaded via AJAX after page render) or ESI (Edge Side Includes), which preserve FPC for the page.",
    hint: "FPC operates at the page level, not the block level — one bad actor affects everything.",
    topic: "Performance",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 26 — Exam Eve: Light Review"
  },
  {
    question: "Why is observer execution order not guaranteed in Magento, and what is the correct alternative when execution order matters?",
    answer: "Observer execution order depends on the XML merge order of events.xml files across modules, which is influenced by module load sequence but is NOT formally guaranteed by the framework contract. If two operations must execute in a specific sequence, the architecturally correct approach is to use plugins (which have explicit sortOrder guarantees) or combine the logic into a single observer. Observers should always be designed as independent and idempotent.",
    hint: "Compare the ordering mechanisms available to plugins vs. observers in their XML declarations.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 26 — Exam Eve: Light Review"
  },
  {
    question: "In MSI, why does source_item.quantity NOT decrease when an order is placed, and when does it actually decrease?",
    answer: "source_item.quantity represents the physical/on-hand quantity and only decreases when a shipment is created (physical deduction from the warehouse). When an order is placed, a reservation with negative quantity is inserted into the append-only inventory_reservation table as a 'soft hold'. Saleable quantity is calculated as source_item.qty + SUM(reservation quantities). This design avoids row-level locking on inventory during high-traffic checkout.",
    hint: "Consider the difference between a physical warehouse count and what's available to sell online.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 26 — Exam Eve: Light Review"
  },
  {
    question: "What is the architectural reason SCD_ON_DEMAND=true is considered an anti-pattern for production environments?",
    answer: "With SCD_ON_DEMAND=true, static assets are not pre-generated during build/deploy. Instead, each asset is compiled on its first request, causing 3-8 second latency spikes for every CSS/JS file after a deployment. The first visitor sees an unstyled or broken page. In production, SCD should run during the build phase (SCD_ON_DEMAND=false) so all assets are ready before the site goes live, ensuring consistent response times.",
    hint: "Think about what the first customer experiences after each deployment.",
    topic: "Cloud",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 26 — Exam Eve: Light Review"
  },
  {
    question: "Why must extensionAttributesJoinProcessor->process($collection) be called explicitly in a repository's getList() method?",
    answer: "The ExtensionAttributesJoinProcessor reads all extension_attributes.xml declarations for an entity interface and adds the necessary SQL JOINs to the collection. Without this explicit call, extension attributes from other modules return null silently — no exception is thrown, causing silent data loss. This is a separate concern from CollectionProcessor which handles SearchCriteria (filters, sorting, pagination). Both must be injected and called.",
    hint: "Consider what happens when Module B adds an extension attribute to your entity but you never join its table.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 26 — Exam Eve: Light Review"
  },
  {
    question: "In Magento's architectural decision hierarchy, why is a plugin preferred over a preference, and an event observer preferred over a plugin for cross-cutting concerns?",
    answer: "Plugins are preferred over preferences because plugins stack (multiple modules can plugin the same method via sortOrder), while preferences do full class substitution — the last one in load order wins, breaking other modules' customizations. Event observers are preferred for cross-cutting concerns because they provide loose coupling: the observed class doesn't need to know about observers, and multiple independent modules can react without interfering with each other.",
    hint: "Consider what happens to upgrade safety and module coexistence with each approach.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 26 — Exam Eve: Light Review"
  },
  {
    question: "What is the correct way to add custom data to a product's REST API response without modifying core code?",
    answer: "The correct approach is to use extension attributes: declare the attribute in extension_attributes.xml for ProductInterface, then implement an after plugin on the product repository's getById/getList methods to load your custom data and set it on the extension attributes object. This maintains the API contract, is type-safe, discoverable, and backward compatible. Using preferences on ProductRepository or magic setData() are architecturally inferior approaches.",
    hint: "The solution involves two parts: an XML declaration and a plugin for data loading.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 26 — Exam Eve: Light Review"
  },
  {
    question: "How does Magento's architectural decision framework rank the priorities when evaluating competing solutions on the exam?",
    answer: "The hierarchy is: (1) backward compatibility / API contracts, (2) Single Responsibility Principle, (3) cacheability preservation, (4) scalability (no N+1 queries, no full-table scans, no row locks), (5) correct extension point usage (plugin vs. observer vs. preference), (6) reversibility (can it be disabled without data loss). The 'architecturally superior' answer has no significant downside within the scenario constraints.",
    hint: "The first priority relates to whether the solution will survive a Magento upgrade.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 26 — Exam Eve: Light Review"
  },
  {
    question: "Why does GraphQL GET enable FPC caching while POST does not, and what are the requirements for a GraphQL query to be cached?",
    answer: "This is an HTTP-level constraint: Varnish and CDNs never cache POST requests per the HTTP specification. For a GraphQL GET query to be cached, ALL of these must be true: HTTP method is GET, no Authorization header is present, the query schema uses the @cache directive with a cacheIdentity class, the response includes an X-Magento-Cache-Id header, and Varnish VCL is configured for GraphQL. Authenticated requests bypass cache regardless of method.",
    hint: "This constraint comes from the HTTP specification itself, not from Magento configuration.",
    topic: "Performance",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 26 — Exam Eve: Light Review"
  },
  {
    question: "What is the correct pattern for displaying personalized content on a Magento storefront without breaking Full Page Cache?",
    answer: "The correct patterns are: (1) Private content sections — the page is served from FPC, then JavaScript fetches customer-specific data from /customer/section/load via AJAX after page render; (2) ESI (Edge Side Includes) — Varnish serves the cached page and fetches the personalized block separately; (3) Depersonalize the page entirely. Using cacheable='false' is WRONG as it eliminates FPC for the entire page URL.",
    hint: "The page should be served from cache first, with personalization applied client-side afterward.",
    topic: "Performance",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 26 — Exam Eve: Light Review"
  },
  {
    question: "In a scenario where a custom module works correctly in CE but returns duplicate product data in EE, what is the most likely root cause?",
    answer: "The most likely root cause is that the module joins to catalog_product_entity using entity_id instead of row_id. In EE with Content Staging enabled, multiple rows exist per entity_id (one per staging version), so joining on entity_id returns duplicate rows. The fix is to join on row_id in EE, or use Magento's EntityManager which handles the abstraction. The code must be conditional or isolated in an EE-specific module since row_id doesn't exist in CE.",
    hint: "Content Staging stores multiple temporal versions of the same entity in the same table.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 26 — Exam Eve: Light Review"
  },
  {
    question: "What are the three SCD_STRATEGY options in Adobe Commerce Cloud, and which is recommended for production?",
    answer: "The three strategies are: 'quick' (default) — deploys only active themes, fastest and recommended for production; 'standard' — generates full copies for all locales and themes, slowest but most complete; 'compact' — uses symlinks to minimize disk usage, suitable for dev/test environments only. The 'quick' strategy is the Cloud production default because it balances build time with completeness by skipping inactive themes.",
    hint: "One uses symlinks, one deploys everything, and the default is optimized for active themes only.",
    topic: "Cloud",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 26 — Exam Eve: Light Review"
  },
  {
    question: "Why should Magento service layer code inject interfaces (Service Contracts) rather than concrete classes, and what pattern should be used for data retrieval?",
    answer: "Injecting interfaces provides testability (mock the interface in unit tests), replaceability (swap implementations via di.xml without code changes), and upgrade safety (concrete classes may change between versions but interfaces maintain backward compatibility). For data retrieval, the Repository pattern with SearchCriteria should be used over direct ResourceModel or Collection queries in the service layer, as it respects the service contract abstraction.",
    hint: "Consider what happens to your code when a Magento upgrade changes the internal implementation of a concrete class.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 26 — Exam Eve: Light Review"
  },
  {
    question: "How do the MSI reservation CLI commands work, and what is the correct command namespace?",
    answer: "The correct commands are inventory:reservation:list-inconsistencies (shows unresolved reservation mismatches where saleable qty doesn't match expected values) and inventory:reservation:create-compensations (creates compensating entries with opposite-sign quantities to resolve inconsistencies). Note the singular 'reservation' in the namespace, not 'reservations'. There is no 'cleanup' command — compensation is done by appending new rows, never by deleting existing ones.",
    hint: "The commands follow the append-only philosophy — they add entries rather than remove them.",
    topic: "Architecture",
    examCode: "AD0-E722",
    studyNoteTitle: "Day 26 — Exam Eve: Light Review"
  }
];

async function main() {
  console.log("Seeding AD0-E722 flashcards...");
  let created = 0;
  let skipped = 0;

  for (const fc of flashcards) {
    const studyNote = await prisma.studyNote.findFirst({
      where: { title: fc.studyNoteTitle, certCode: "AD0-E722" }
    });

    if (!studyNote) {
      console.log(`  ⚠ Study note not found: ${fc.studyNoteTitle}`);
      skipped++;
      continue;
    }

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
