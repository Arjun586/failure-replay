# @replayos/node

The official Node.js SDK for [ReplayOS](https://github.com/Arjun586/ReplayOS). 

Zero-config OpenTelemetry tracing, dependency mapping, and incident observability for distributed microservices. Drop this into your application to instantly visualize request flows, database queries, and cascading failures in real-time.

![npm version](https://img.shields.io/npm/v/@replayos/node.svg)
![license](https://img.shields.io/npm/l/@replayos/node.svg)

## Features
* **Zero-Config Instrumentation:** Automatically hooks into Express, HTTP, Postgres, Redis, MongoDB, and dozens of other standard Node.js libraries.
* **Fail-Safe Design:** Operates silently in the background. If your ReplayOS backend is unreachable, the SDK drops traces rather than crashing your production application.
* **Distributed Tracing:** Automatically propagates context across microservice boundaries (HTTP headers) to build complete end-to-end trace graphs.

---

## Installation

Install the SDK via npm:
```bash
npm install @replayos/node
