# @replayos/node

The official Node.js SDK for [ReplayOS](https://github.com/Arjun586/ReplayOS). 

Zero-config OpenTelemetry tracing, dependency mapping, and incident observability for distributed microservices. Drop this into your application to instantly visualize request flows, database queries, and cascading failures in real-time.

![npm version](https://img.shields.io/npm/v/@replayos/node.svg)

## Features
* **Zero-Config Instrumentation:** Automatically hooks into Express, HTTP, Postgres, Redis, MongoDB, and dozens of other standard Node.js libraries.
* **Fail-Safe Design:** Operates silently in the background. If your ReplayOS backend is unreachable, the SDK drops traces rather than crashing your production application.
* **Distributed Tracing:** Automatically propagates context across microservice boundaries (HTTP headers) to build complete end-to-end trace graphs.

---

## Installation

Install the SDK via npm:
```bash
npm install @replayos/node
```

## Quick Start
Initialize the SDK at the very top of your entry file (e.g., index.js or server.ts). This must run before you require any other dependencies.


``` bash
const { ReplayOS } = require('@replayos/node');

ReplayOS.init({
    projectId: 'your-project-uuid', // Found in Project Settings
    ingestKey: 'your-ingest-key',   // Found in Project Settings
    serviceName: 'order-service'
});
```

##  API Reference
ReplayOS.init(options)
Starts the auto-instrumentation engine and connection to the ReplayOS ingest gateway.


| Option      | Type    | Default                                             | Description                         |
| ----------- | ------- | --------------------------------------------------- | ----------------------------------- |
| projectId   | string  | process.env.REPLAYOS_PROJECT_ID                     | Your Project ID.                    |
| ingestKey   | string  | process.env.REPLAYOS_INGEST_KEY                     | Your secret Ingest Key.             |
| serviceName | string  | process.env.REPLAYOS_SERVICE_NAME                   | Name for the dependency graph.      |
| ingestUrl   | string  | [http://localhost:5000/](http://localhost:5000/)... | Custom ingest endpoint.             |
| debug       | boolean | false                                               | Enables diagnostic console logging. |



## ReplayOS.recordError(error)
Manually marks the currently active span as failed. Use this inside try/catch blocks to ensure handled exceptions appear in your ReplayOS Timeline.

``` bash
try {
  await db.save();
} catch (err) {
  ReplayOS.recordError(err);
  throw err;
}
```


## ReplayOS.getTracer()
Returns the underlying OpenTelemetry tracer. Use this to create manual spans for specific business logic not captured by auto-instrumentation.

## ReplayOS.shutdown()
Returns a Promise that resolves once all pending traces are flushed to the server. Ideal for graceful shutdown sequences.

```bash
process.on('SIGTERM', async () => {
  await ReplayOS.shutdown();
  process.exit(0);
});
```

## Environment Variables
For better security, you can omit credentials from your code and use environment variables:

```bash
REPLAYOS_PROJECT_ID
REPLAYOS_INGEST_KEY
REPLAYOS_SERVICE_NAME
```