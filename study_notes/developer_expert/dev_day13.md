# Day 13 — Message Queues
## Magento 2 Certified Professional Developer Study Notes

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Configuration Files](#2-configuration-files)
   - [queue_topology.xml](#21-queue_topologyxml)
   - [queue_publisher.xml](#22-queue_publisherxml)
   - [queue_consumer.xml](#23-queue_consumerxml)
3. [AMQP vs MySQL Queue Adapter](#3-amqp-vs-mysql-queue-adapter)
4. [Creating a New Queue — Full Wiring](#4-creating-a-new-queue--full-wiring)
5. [Existing Core Queues](#5-existing-core-queues)
6. [Consumer Execution](#6-consumer-execution)
7. [Error Handling](#7-error-handling)
8. [Cloud: Workers in .magento.app.yaml](#8-cloud-workers-in-magentoappyaml)
9. [Practice Exercise](#9-practice-exercise)
10. [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Architecture Overview

Magento's Message Queue Framework (MQF) provides **asynchronous communication** between system components. Messages are published to a topic, routed through an exchange to one or more queues, and consumed by handlers.

```
Publisher                  Broker / Transport                  Consumer
----------    publish    +------------------+    deliver    -----------
| PHP Code | ----------> |  Topic (routing) | -----------> | Handler  |
----------              |  Exchange        |               | (class)  |
                        |  Queue           |               -----------
                        +------------------+
```

### Key Concepts

| Term | Description |
|------|-------------|
| **Publisher** | PHP code that sends a message to a named topic |
| **Topic** | Logical channel name (e.g. `inventory.reservations.updateSalabilityStatus`) |
| **Exchange** | Routes messages from topic to one or more queues (AMQP concept; MySQL uses direct binding) |
| **Queue** | Durable storage holding messages until consumed |
| **Consumer** | Long-running process that polls the queue and dispatches to a Handler |
| **Handler** | PHP class/method that processes the message payload |

**Exam focus:**
- The flow is always **publisher → topic → exchange → queue → consumer → handler**
- Topics are named strings; one topic can fan out to multiple queues
- In MySQL mode, the "exchange" concept is simplified — each topic maps directly to one queue

---

## 2. Configuration Files

All three XML files live in `<Module>/etc/`. They work together — a missing link breaks the chain silently (no PHP error, message is dropped).

```
app/code/Vendor/Module/etc/
  queue_topology.xml    <- declares exchanges and bindings (queues)
  queue_publisher.xml   <- declares which exchange a topic publishes to
  queue_consumer.xml    <- declares which consumer reads which queue
```

**Exam focus:**
- All three files are **required** for a fully functional queue
- They are merged across all modules by the framework at bootstrap

---

### 2.1 `queue_topology.xml`

Defines **exchanges** and the **queues** bound to them. Think of this as the broker's routing table.

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/topology.xsd">

    <!--
        name        = exchange name (arbitrary, but must match publisher.xml)
        type        = "topic" (AMQP routing) or "direct"
        connection  = "db" (MySQL) | "amqp" (RabbitMQ)
    -->
    <exchange name="magento-db-exchange" type="topic" connection="db">

        <!--
            id          = unique binding identifier
            topic       = routing key (topic name, supports wildcards with AMQP)
            destinationType = "queue"
            destination = queue name (consumers listen here)
        -->
        <binding id="vendorModuleExampleBinding"
                 topic="vendor.module.example"
                 destinationType="queue"
                 destination="vendor.module.example.queue"/>

    </exchange>
</config>
```

**Exam focus:**
- `connection="db"` for MySQL (CE), `connection="amqp"` for RabbitMQ (EE/Cloud)
- The `destination` attribute is the **queue name** consumers will poll
- AMQP supports **wildcard** topic bindings (`#`, `*`); MySQL does not

---

### 2.2 `queue_publisher.xml`

Wires a **topic** to a **connection** and **exchange**. This is what the PHP publisher uses.

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/publisher.xsd">

    <!--
        topic = the topic name PHP code publishes to
    -->
    <publisher topic="vendor.module.example">
        <connection name="db"        <!-- matches connection in topology.xml -->
                    exchange="magento-db-exchange"  <!-- matches exchange name -->
                    disabled="false"/>
    </publisher>

</config>
```

**Exam focus:**
- `name="db"` → MySQL adapter; `name="amqp"` → RabbitMQ adapter
- A topic can have **multiple connections** declared (one active, others disabled)
- The `exchange` attribute must match a `name` in `queue_topology.xml`

---

### 2.3 `queue_consumer.xml`

Registers one or more **consumers** and maps them to queue names and handler classes.

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/consumer.xsd">

    <!--
        name            = consumer name (used in bin/magento queue:consumers:start <name>)
        queue           = queue name (must match destination in topology.xml)
        connection      = "db" | "amqp"
        consumerInstance= Magento\Framework\MessageQueue\Consumer (default) or custom
        handler         = "Vendor\Module\Model\Consumer::process" (class::method)
        maxMessages     = optional max before auto-exit (overridden by CLI --max-messages)
    -->
    <consumer name="vendorModuleExampleConsumer"
              queue="vendor.module.example.queue"
              connection="db"
              consumerInstance="Magento\Framework\MessageQueue\Consumer"
              handler="Vendor\Module\Model\ExampleConsumer::execute"
              maxMessages="100"/>

</config>
```

**Exam focus:**
- `name` is what you pass to `bin/magento queue:consumers:start`
- `handler` format is `ClassName::methodName` — the method receives the deserialized DTO
- `maxMessages` in XML is a default; CLI `--max-messages` overrides it

---

## 3. AMQP vs MySQL Queue Adapter

| Feature | MySQL (`db`) | AMQP / RabbitMQ (`amqp`) |
|---------|-------------|--------------------------|
| **Edition** | CE + EE | EE + Magento Cloud only |
| **Dependency** | No extra services | RabbitMQ broker required |
| **Transport** | `magento_queue_message` DB table | RabbitMQ server (TCP/AMQP protocol) |
| **Performance** | Lower throughput | High throughput, distributed |
| **Wildcard topics** | Not supported | Supported (`#`, `*`) |
| **Dead Letter Queues** | Manual workaround | Native RabbitMQ DLX support |
| **Message TTL / priorities** | Not supported | Supported |
| **Fanout / exchange types** | `topic` type only (direct mapping) | `fanout`, `direct`, `topic`, `headers` |
| **Connection name** | `"db"` | `"amqp"` |

**Exam focus:**
- MySQL adapter stores messages in the **`magento_queue_message`** and **`magento_queue_message_status`** tables
- AMQP requires the `magento/magento-cloud-components` or RabbitMQ extension
- CE installations **must** use `db` connection; they cannot use `amqp`
- On Magento Cloud (EE), RabbitMQ is the recommended and default broker

### MySQL Queue Tables

```sql
-- Messages waiting to be consumed
SELECT * FROM magento_queue_message;

-- Delivery status tracking
SELECT * FROM magento_queue_message_status;
-- status: 2 = new, 3 = in_progress, 4 = complete, 5 = retry, 6 = error
```

**Exam focus:**
- Status codes: `2` (new/open), `3` (in progress), `4` (complete), `5` (retry_required), `6` (error)

---

## 4. Creating a New Queue — Full Wiring

Below is a **complete, step-by-step** example for CE using the MySQL adapter.

### Step 1: Define the Data Transfer Object (DTO)

The message payload should be a typed PHP class. Use a **ServiceDataInterface** or simple serializable class.

```php
<?php
// app/code/Vendor/Module/Api/Data/ExampleMessageInterface.php
namespace Vendor\Module\Api\Data;

interface ExampleMessageInterface
{
    public function getOrderId(): int;
    public function getMessage(): string;
}
```

```php
<?php
// app/code/Vendor/Module/Model/Data/ExampleMessage.php
namespace Vendor\Module\Model\Data;

use Vendor\Module\Api\Data\ExampleMessageInterface;

class ExampleMessage implements ExampleMessageInterface
{
    private int $orderId;
    private string $message;

    public function getOrderId(): int { return $this->orderId; }
    public function setOrderId(int $orderId): void { $this->orderId = $orderId; }

    public function getMessage(): string { return $this->message; }
    public function setMessage(string $message): void { $this->message = $message; }
}
```

---

### Step 2: Register the Topic in `communication.xml`

`communication.xml` maps topic names to their **data types** (the DTO).

```xml
<!-- app/code/Vendor/Module/etc/communication.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Communication/etc/communication.xsd">

    <!--
        name     = topic name (must match publisher.xml and topology.xml)
        request  = fully-qualified class name of the DTO (or scalar type)
    -->
    <topic name="vendor.module.example"
           request="Vendor\Module\Api\Data\ExampleMessageInterface"/>

</config>
```

**Exam focus:**
- `communication.xml` is the **4th required file** — easy to forget!
- `request` must be an interface or class that Magento can serialize/deserialize
- Without `communication.xml`, the publisher will throw a "topic not found" exception

---

### Step 3: `queue_topology.xml`

```xml
<!-- app/code/Vendor/Module/etc/queue_topology.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/topology.xsd">

    <exchange name="magento-db-exchange" type="topic" connection="db">
        <binding id="vendorModuleExampleBinding"
                 topic="vendor.module.example"
                 destinationType="queue"
                 destination="vendor.module.example.queue"/>
    </exchange>

</config>
```

---

### Step 4: `queue_publisher.xml`

```xml
<!-- app/code/Vendor/Module/etc/queue_publisher.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/publisher.xsd">

    <publisher topic="vendor.module.example">
        <connection name="db" exchange="magento-db-exchange" disabled="false"/>
    </publisher>

</config>
```

---

### Step 5: `queue_consumer.xml`

```xml
<!-- app/code/Vendor/Module/etc/queue_consumer.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/consumer.xsd">

    <consumer name="vendorModuleExampleConsumer"
              queue="vendor.module.example.queue"
              connection="db"
              consumerInstance="Magento\Framework\MessageQueue\Consumer"
              handler="Vendor\Module\Model\ExampleConsumer::execute"/>

</config>
```

---

### Step 6: The Publisher (PHP)

Inject `\Magento\Framework\MessageQueue\PublisherInterface` and call `publish()`.

```php
<?php
// app/code/Vendor/Module/Model/ExamplePublisher.php
namespace Vendor\Module\Model;

use Magento\Framework\MessageQueue\PublisherInterface;
use Vendor\Module\Api\Data\ExampleMessageInterface;
use Vendor\Module\Api\Data\ExampleMessageInterfaceFactory;

class ExamplePublisher
{
    private PublisherInterface $publisher;
    private ExampleMessageInterfaceFactory $messageFactory;

    public function __construct(
        PublisherInterface $publisher,
        ExampleMessageInterfaceFactory $messageFactory
    ) {
        $this->publisher = $publisher;
        $this->messageFactory = $messageFactory;
    }

    public function publish(int $orderId, string $message): void
    {
        /** @var ExampleMessageInterface $msg */
        $msg = $this->messageFactory->create();
        $msg->setOrderId($orderId);
        $msg->setMessage($message);

        // publish(topicName, payload)
        $this->publisher->publish('vendor.module.example', $msg);
    }
}
```

---

### Step 7: The Consumer Handler (PHP)

```php
<?php
// app/code/Vendor/Module/Model/ExampleConsumer.php
namespace Vendor\Module\Model;

use Psr\Log\LoggerInterface;
use Vendor\Module\Api\Data\ExampleMessageInterface;

class ExampleConsumer
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    /**
     * Called by the Consumer framework with the deserialized DTO.
     * Method name must match the "handler" attribute in queue_consumer.xml
     */
    public function execute(ExampleMessageInterface $message): void
    {
        $this->logger->info(sprintf(
            '[ExampleConsumer] OrderId=%d | Message=%s',
            $message->getOrderId(),
            $message->getMessage()
        ));

        // Business logic here...
    }
}
```

**Exam focus:**
- The handler method signature must **type-hint the DTO interface** — Magento uses this for deserialization
- Throwing an exception inside the handler marks the message as `error` or triggers retry
- The consumer framework catches exceptions — your handler should not swallow them silently

---

### Step 8: di.xml (if needed)

If your DTO needs a virtual type or concrete class mapping, add it to `di.xml`:

```xml
<!-- app/code/Vendor/Module/etc/di.xml -->
<config>
    <preference for="Vendor\Module\Api\Data\ExampleMessageInterface"
                to="Vendor\Module\Model\Data\ExampleMessage"/>
</config>
```

---

### Step 9: Enable and Test

```bash
# Enable the module
bin/magento module:enable Vendor_Module
bin/magento setup:upgrade

# Verify consumer is registered
bin/magento queue:consumers:list

# Run the consumer (foreground, exits after 100 messages)
bin/magento queue:consumers:start vendorModuleExampleConsumer --max-messages=100

# Inspect MySQL queue tables
mysql -u root -p magento < "SELECT * FROM magento_queue_message;"
```

---

## 5. Existing Core Queues

Understanding built-in queues is essential for the exam. These appear in interview and certification scenarios.

### 5.1 Inventory Reservations

| Consumer Name | Topic | Purpose |
|---------------|-------|---------|
| `inventory.reservations.updateSalabilityStatus` | `inventory.reservations.updateSalabilityStatus` | Recalculates stock status (is_salable) after reservation changes |
| `inventory.mass.update` | `inventory.mass.update` | Bulk stock updates |
| `inventory.reservations.cleanup` | `inventory.reservations.cleanup` | Removes compensated reservations |

```bash
bin/magento queue:consumers:start inventory.reservations.updateSalabilityStatus
```

**Exam focus:**
- MSI (Multi-Source Inventory) relies heavily on queues for **reservation cleanup** and **salability updates**
- If these consumers don't run, stock statuses become stale

---

### 5.2 Async Orders

| Consumer Name | Topic | Purpose |
|---------------|-------|---------|
| `async.operations.all` | `async.operations.all` | Processes bulk API operations |
| `codegeneratorProcessor` | `codegen` | Gift card/coupon code generation |

**Exam focus:**
- Bulk REST API (`/async/bulk/V1/...`) writes to the queue; `async.operations.all` processes it
- Order status for async submissions is tracked in `magento_bulk` and `magento_operation` tables

---

### 5.3 Async API / Bulk Operations

```
Client (REST)
    |
    | POST /async/bulk/V1/products
    v
+----------------------------+
| BulkOperationManagement    |  <- writes operations to queue
+----------------------------+
    |
    v
Queue: async.operations.all
    |
    v
Consumer: async.operations.all
    |
    v
Handler: processes each operation, updates magento_operation status
```

```sql
-- Track bulk operation status
SELECT * FROM magento_bulk;
SELECT * FROM magento_operation WHERE bulk_uuid = '<uuid>';
-- operation_status: 1=open, 2=complete, 3=failed_retriably, 4=failed_not_retriably
```

---

## 6. Consumer Execution

### CLI Command Reference

```bash
# List all registered consumers
bin/magento queue:consumers:list

# Start a consumer (runs indefinitely by default)
bin/magento queue:consumers:start <consumerName>

# Start with options
bin/magento queue:consumers:start <consumerName> \
    --max-messages=1000 \      # exit after processing N messages
    --batch-size=100 \         # process N messages per batch (if consumer supports it)
    --single-thread \          # prevent multiple instances of this consumer
    --pid-file-path=/var/run/consumer.pid  # write PID to file
```

### Option Details

| Option | Description | Default |
|--------|-------------|---------|
| `--max-messages=N` | Stop consumer after N messages | Runs forever (or `maxMessages` from XML) |
| `--batch-size=N` | Number of messages per batch iteration | Consumer-specific |
| `--single-thread` | Uses a PID lock file to prevent duplicate consumers | Off |
| `--pid-file-path` | Path for the PID lock file | System temp dir |

**Exam focus:**
- Without `--max-messages`, the consumer runs as a **daemon** (never exits on its own)
- On production, consumers are managed by **cron** or **supervisord** (or Cloud workers)
- `--max-messages=0` means unlimited (same as omitting it)
- `--batch-size` is only effective if the consumer implementation supports batch processing

### Running via Cron (CE/on-premise)

```xml
<!-- etc/crontab.xml -->
<config>
    <group id="default">
        <job name="consumers_runner" instance="Magento\MessageQueue\Model\Cron\ConsumersRunner"
             method="run">
            <schedule>* * * * *</schedule>
        </job>
    </group>
</config>
```

**Exam focus:**
- `Magento\MessageQueue\Model\Cron\ConsumersRunner` reads consumer config from `queue_consumer_config` and starts consumers respecting `maxMessages` — this is the **cron-based approach** for CE

---

## 7. Error Handling

### Exception Flow in Consumers

```
Message received
    |
    v
Handler::execute()
    |
    +-- Success --> message marked COMPLETE (status 4)
    |
    +-- \Magento\Framework\MessageQueue\Exception\MessageLockException
    |       --> message remains OPEN (another consumer may pick it up)
    |
    +-- Any other Exception
            |
            +-- Is retry configured? --> YES --> status = RETRY (5), retry count++
            |                           NO  --> status = ERROR (6)
            |
            +-- Retry count exceeded --> status = ERROR (6)
                                         (moved to dead letter queue in AMQP)
```

### Dead Letter Queues (AMQP / RabbitMQ)

A **Dead Letter Exchange (DLX)** in RabbitMQ automatically routes failed messages to a separate queue for inspection.

```xml
<!-- queue_topology.xml with DLX (AMQP only) -->
<exchange name="magento-amqp-exchange" type="topic" connection="amqp">

    <!-- Main queue with DLX configured -->
    <binding id="mainBinding"
             topic="vendor.module.example"
             destinationType="queue"
             destination="vendor.module.example.queue">
        <arguments>
            <!-- Route failed messages to this exchange -->
            <argument name="x-dead-letter-exchange" xsi:type="string">
                magento-dl-exchange
            </argument>
        </arguments>
    </binding>

</exchange>

<!-- Dead letter exchange -->
<exchange name="magento-dl-exchange" type="topic" connection="amqp">
    <binding id="dlBinding"
             topic="vendor.module.example"
             destinationType="queue"
             destination="vendor.module.example.queue.dl"/>
</exchange>
```

**Exam focus:**
- Dead letter queues require **AMQP (RabbitMQ)** — not available with MySQL adapter
- MySQL adapter has no native DLQ — failed messages stay in `magento_queue_message_status` with `status=6`
- Messages move to DLQ when: rejected, TTL expires, or queue length exceeded

### Retry Logic (MySQL Adapter)

```php
// In your handler — throw a specific exception to trigger retry
use Magento\Framework\Exception\TemporaryStateExceptionInterface;

// Magento checks if exception implements this interface for retry eligibility
// Or configure via queue_consumer.xml maxMessages + cron cycling
```

**Exam focus:**
- MySQL adapter retry is controlled by consumer re-running (cron picks up `status=5` messages)
- AMQP retry uses RabbitMQ's `x-message-ttl` and DLX patterns or the `RetryableException`

---

## 8. Cloud: Workers in `.magento.app.yaml`

On **Magento Cloud (Adobe Commerce on Cloud Infrastructure)**, consumers are managed as **background workers** — not via cron or manual CLI.

### Configuration

```yaml
# .magento.app.yaml

# Define workers for queue consumers
workers:
    inventory:
        size: S                          # container size (S, M, L, XL)
        commands:
            start: |
                php bin/magento queue:consumers:start \
                  inventory.reservations.updateSalabilityStatus \
                  --max-messages=10000 \
                  --batch-size=100

    async-orders:
        size: S
        commands:
            start: |
                php bin/magento queue:consumers:start \
                  async.operations.all \
                  --max-messages=10000

    custom-consumer:
        size: S
        commands:
            start: |
                php bin/magento queue:consumers:start \
                  vendorModuleExampleConsumer \
                  --max-messages=10000
```

### Worker vs Cron

| Aspect | Cron-based (CE/on-premise) | Cloud Workers |
|--------|---------------------------|---------------|
| **Start mechanism** | `consumers_runner` cron job | Platform-managed daemon |
| **Restart on crash** | Next cron cycle | Automatic (platform restarts) |
| **Resource isolation** | Shares web container | Dedicated container per worker |
| **Config location** | `crontab.xml` + `env.php` | `.magento.app.yaml` |

**Exam focus:**
- Cloud workers restart **automatically** if the process crashes
- Each worker gets its own **dedicated container** — does not share resources with web/cron containers
- `size: S` is the smallest; choose based on processing needs
- Workers defined here are **separate from cron** — you should not duplicate consumer start in both
- `--max-messages` on Cloud workers causes the process to restart after N messages (preventing memory leaks)

### Disabling Cron Consumers on Cloud

When using Cloud workers, disable the cron-based consumer runner to prevent conflicts:

```php
// app/etc/env.php
'cron_consumers_runner' => [
    'cron_run' => false,   // disable cron-based consumer launching
    'max_messages' => 0,
    'consumers' => [],
],
```

**Exam focus:**
- Set `cron_run => false` in `env.php` when Cloud workers manage consumers
- Failing to do this results in **duplicate consumers** fighting over messages

---

## 9. Practice Exercise

### Goal: Implement publisher + consumer using MySQL adapter (CE)

#### File Structure

```
app/code/Vendor/QueueDemo/
  registration.php
  etc/
    module.xml
    communication.xml
    queue_topology.xml
    queue_publisher.xml
    queue_consumer.xml
    di.xml
  Api/Data/
    DemoMessageInterface.php
  Model/
    Data/
      DemoMessage.php
    DemoPublisher.php
    DemoConsumer.php
  Console/
    Command/
      PublishCommand.php
```

#### `registration.php`

```php
<?php
\Magento\Framework\Component\ComponentRegistrar::register(
    \Magento\Framework\Component\ComponentRegistrar::MODULE,
    'Vendor_QueueDemo',
    __DIR__
);
```

#### `etc/module.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="Vendor_QueueDemo" setup_version="1.0.0"/>
</config>
```

#### `etc/communication.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Communication/etc/communication.xsd">
    <topic name="vendor.queuedemo.process"
           request="Vendor\QueueDemo\Api\Data\DemoMessageInterface"/>
</config>
```

#### `etc/queue_topology.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/topology.xsd">
    <exchange name="magento-db-exchange" type="topic" connection="db">
        <binding id="vendorQueueDemoBinding"
                 topic="vendor.queuedemo.process"
                 destinationType="queue"
                 destination="vendor.queuedemo.process.queue"/>
    </exchange>
</config>
```

#### `etc/queue_publisher.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/publisher.xsd">
    <publisher topic="vendor.queuedemo.process">
        <connection name="db" exchange="magento-db-exchange" disabled="false"/>
    </publisher>
</config>
```

#### `etc/queue_consumer.xml`

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework-message-queue:etc/consumer.xsd">
    <consumer name="vendorQueueDemoConsumer"
              queue="vendor.queuedemo.process.queue"
              connection="db"
              consumerInstance="Magento\Framework\MessageQueue\Consumer"
              handler="Vendor\QueueDemo\Model\DemoConsumer::process"
              maxMessages="10"/>
</config>
```

#### Console Command to Publish

```php
<?php
// Console/Command/PublishCommand.php
namespace Vendor\QueueDemo\Console\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Vendor\QueueDemo\Model\DemoPublisher;

class PublishCommand extends Command
{
    private DemoPublisher $publisher;

    public function __construct(DemoPublisher $publisher)
    {
        $this->publisher = $publisher;
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->setName('vendor:queuedemo:publish')
             ->setDescription('Publish a test message to the queue');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->publisher->publish(42, 'Hello from the queue!');
        $output->writeln('<info>Message published to vendor.queuedemo.process</info>');
        return Command::SUCCESS;
    }
}
```

#### End-to-End Test Commands

```bash
# 1. Enable and setup
bin/magento module:enable Vendor_QueueDemo
bin/magento setup:upgrade

# 2. Verify consumer is listed
bin/magento queue:consumers:list
# Expected: vendorQueueDemoConsumer

# 3. Publish a message
bin/magento vendor:queuedemo:publish

# 4. Inspect the DB queue (message should be status=2 / open)
mysql -u root -p magento -e "SELECT * FROM magento_queue_message;"
mysql -u root -p magento -e "SELECT * FROM magento_queue_message_status;"

# 5. Start consumer and process the message
bin/magento queue:consumers:start vendorQueueDemoConsumer --max-messages=5

# 6. Verify in var/log/system.log
tail -f var/log/system.log | grep DemoConsumer

# 7. Verify message status changed to complete (status=4)
mysql -u root -p magento -e "SELECT * FROM magento_queue_message_status;"
```

---

## Quick-Reference Checklist

### Architecture
- [ ] Flow: **Publisher → Topic → Exchange → Queue → Consumer → Handler**
- [ ] Topic = logical routing key (string); Queue = physical storage
- [ ] Four required XML files: `communication.xml`, `queue_topology.xml`, `queue_publisher.xml`, `queue_consumer.xml`

### Configuration Files
- [ ] `communication.xml` maps **topic name → DTO type** (request attribute)
- [ ] `queue_topology.xml` defines **exchanges and queue bindings** (`connection`, `type`, `destination`)
- [ ] `queue_publisher.xml` maps **topic → connection + exchange**
- [ ] `queue_consumer.xml` maps **consumer name → queue + handler** (`handler="Class::method"`)
- [ ] Handler `connection` attribute must match `topology.xml` and `publisher.xml` connection name

### Adapters
- [ ] `connection="db"` = **MySQL adapter** — available in CE and EE
- [ ] `connection="amqp"` = **RabbitMQ** — EE and Cloud only
- [ ] MySQL stores messages in `magento_queue_message` and `magento_queue_message_status`
- [ ] MySQL status codes: 2=new, 3=in_progress, 4=complete, 5=retry, 6=error
- [ ] MySQL does NOT support wildcard topics, DLQ natively, or TTL

### Publisher
- [ ] Inject `\Magento\Framework\MessageQueue\PublisherInterface`
- [ ] Call `$publisher->publish('topic.name', $dtoObject)`
- [ ] DTO must match the `request` type in `communication.xml`

### Consumer
- [ ] Handler method must **type-hint the DTO interface** for deserialization
- [ ] `consumerInstance` defaults to `Magento\Framework\MessageQueue\Consumer`
- [ ] Throwing an exception = message marked error (or retry if retriable)

### CLI
- [ ] `bin/magento queue:consumers:list` — list all consumers
- [ ] `bin/magento queue:consumers:start <name>` — start a consumer
- [ ] `--max-messages=N` — exit after N messages (prevents memory leaks)
- [ ] `--batch-size=N` — messages per batch iteration
- [ ] `--single-thread` — prevents duplicate instances via PID lock

### Core Queues
- [ ] `inventory.reservations.updateSalabilityStatus` — MSI stock status updates
- [ ] `async.operations.all` — Bulk REST API processing
- [ ] Status tracked in `magento_bulk` and `magento_operation` tables

### Error Handling
- [ ] Dead Letter Queues require **AMQP only** — not available on MySQL adapter
- [ ] Configure DLQ via `x-dead-letter-exchange` argument in `queue_topology.xml`
- [ ] MySQL failed messages stay at `status=6` — manual cleanup required
- [ ] Retries: AMQP uses TTL+DLX; MySQL relies on consumer restart picking up `status=5`

### Cloud (Magento Commerce Cloud)
- [ ] Consumers defined as **workers** in `.magento.app.yaml` under `workers:` key
- [ ] Cloud workers get **dedicated containers** and auto-restart on crash
- [ ] Disable cron-based consumer runner in `env.php`: `'cron_run' => false`
- [ ] Set `--max-messages` on Cloud workers to force periodic restarts (memory management)
- [ ] RabbitMQ (AMQP) is the **default broker on Cloud** — MySQL adapter not typically used

### Practice Checklist
- [ ] Create all 4 XML config files with consistent topic/queue/exchange names
- [ ] Add `di.xml` preference for DTO interface → concrete class
- [ ] Verify consumer appears in `queue:consumers:list`
- [ ] Publish a message and verify row appears in `magento_queue_message`
- [ ] Start consumer and verify `status=4` (complete) in `magento_queue_message_status`
- [ ] Check `var/log/system.log` for handler output
