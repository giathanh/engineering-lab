# Engineering Lab – Ôn tập Senior Fullstack (PHP · Node.js · React/Vue)

Bộ tài liệu ôn tập kiến thức cần và đủ của một Senior Developer để đi phỏng vấn và cập nhật CV.

## Cách dùng

1. Mỗi bài là một file markdown, viết theo [template chuẩn](_templates/topic-template.md).
2. Nội dung chi tiết được tạo bằng AI theo [prompt mẫu](_templates/ai-prompt.md).
3. Ôn xong bài nào: tự trả lời phần **Câu hỏi phỏng vấn** không nhìn đáp án, rồi tick `[x]` bên dưới.

## Xem dạng HTML & deploy Vercel

```bash
npm install
npm run build      # sinh site HTML vào dist/ (mở dist/index.html để xem)
npm run dev        # build + chạy local server
```

- Nguồn nội dung là các file `.md`; README này quyết định thứ tự/tiêu đề bài trên site.
- Deploy: push repo lên GitHub → import vào Vercel (đã có `vercel.json`), hoặc chạy `npx vercel --prod`.

**Thứ tự ưu tiên viết/ôn:** 14 (CV/Interview) → 03 Node.js → 02 PHP → 05/06 React/Vue → 04 JS/TS → 07 Database → 09 System Design → 08 API → 10 Security → còn lại

Tổng: **14 module · 93 bài**.

## Mục lục

- [01 – Fundamentals (CS nền tảng)](#01-fundamentals)
- [02 – PHP](#02-php)
- [03 – Node.js](#03-nodejs)
- [04 – JavaScript & TypeScript](#04-javascript-typescript)
- [05 – React](#05-react)
- [06 – Vue](#06-vue)
- [07 – Database](#07-database)
- [08 – API Design](#08-api-design)
- [09 – System Design](#09-system-design)
- [10 – Security](#10-security)
- [11 – Testing & Quality](#11-testing-quality)
- [12 – DevOps & Cloud](#12-devops-cloud)
- [13 – Soft skills & Leadership (Senior-level)](#13-soft-skills-leadership)
- [14 – Interview & CV](#14-interview-cv)

<a id="01-fundamentals"></a>
### 01 – Fundamentals (CS nền tảng)

- [ ] [Data structures & Big-O thường gặp (array, hash map, tree, heap, graph)](01-fundamentals/01-data-structures-big-o.md)
- [ ] [Thuật toán hay hỏi: sort, search, two pointers, sliding window, BFS/DFS, DP cơ bản](01-fundamentals/02-algorithms.md)
- [ ] [OOP, SOLID, DRY/KISS/YAGNI, composition vs inheritance](01-fundamentals/03-oop-solid-principles.md)
- [ ] [Design patterns: Singleton, Factory, Strategy, Observer, Decorator, Adapter, Repository, DI](01-fundamentals/04-design-patterns.md)
- [ ] [Clean Code & Refactoring (code smell, kỹ thuật refactor)](01-fundamentals/05-clean-code-refactoring.md)
- [ ] [Networking: HTTP/1.1 vs 2 vs 3, TCP/UDP, DNS, TLS/HTTPS, WebSocket, SSE](01-fundamentals/06-networking.md)
- [ ] [Concurrency cơ bản: process/thread, async, race condition, deadlock, lock](01-fundamentals/07-concurrency-basics.md)

<a id="02-php"></a>
### 02 – PHP

- [ ] [PHP 8.x features (types, enums, readonly, match, attributes, fibers, named args, JIT)](02-php/01-php8-features.md)
- [ ] [Cơ chế chạy PHP: Zend Engine, OPcache, PHP-FPM, request lifecycle, shared-nothing](02-php/02-php-runtime-fpm-opcache.md)
- [ ] [OOP nâng cao: interface, abstract, trait, late static binding, magic methods, closures](02-php/03-oop-advanced.md)
- [ ] [Composer, autoloading PSR-4, các PSR quan trọng (PSR-1/4/7/12/15)](02-php/04-composer-psr.md)
- [ ] [Memory management, garbage collection, generators, xử lý file/data lớn](02-php/05-memory-gc-generators.md)
- [ ] [Error/Exception handling, logging](02-php/06-error-exception-logging.md)
- [ ] [Laravel core: service container, service provider, facade, middleware, request lifecycle](02-php/07-laravel-core.md)
- [ ] [Laravel Eloquent: relationships, N+1, eager loading, query scope, transaction](02-php/08-laravel-eloquent.md)
- [ ] [Laravel nâng cao: queue/job, event/listener, cache, scheduler, broadcasting, Octane](02-php/09-laravel-advanced.md)
- [ ] [(Tùy chọn) Symfony: so sánh với Laravel, DI component](02-php/10-symfony-vs-laravel.md)
- [ ] [Testing PHP: PHPUnit/Pest, mocking, feature test](02-php/11-testing-php.md)
- [ ] [Performance PHP & long-running (Swoole/RoadRunner/FrankenPHP)](02-php/12-performance-long-running.md)

<a id="03-nodejs"></a>
### 03 – Node.js

- [ ] [Event loop chi tiết (phases, microtask vs macrotask, process.nextTick, setImmediate)](03-nodejs/01-event-loop.md)
- [ ] [libuv, thread pool, non-blocking I/O, khi nào Node bị block](03-nodejs/02-libuv-non-blocking-io.md)
- [ ] [Module system: CommonJS vs ESM](03-nodejs/03-commonjs-vs-esm.md)
- [ ] [Streams, Buffer, backpressure](03-nodejs/04-streams-buffer.md)
- [ ] [Worker threads, child_process, cluster, scaling](03-nodejs/05-worker-threads-cluster.md)
- [ ] [Error handling (sync/async, unhandledRejection, graceful shutdown)](03-nodejs/06-error-handling-graceful-shutdown.md)
- [ ] [Express vs NestJS vs Fastify: kiến trúc, middleware, DI trong NestJS](03-nodejs/07-express-nestjs-fastify.md)
- [ ] [Memory leak, profiling, debugging Node](03-nodejs/08-memory-leak-profiling.md)
- [ ] [Security riêng Node (prototype pollution, dependency audit, ReDoS)](03-nodejs/09-node-security.md)
- [ ] [Testing Node (Jest/Vitest, supertest)](03-nodejs/10-testing-node.md)

<a id="04-javascript-typescript"></a>
### 04 – JavaScript & TypeScript

- [ ] [Scope, hoisting, closure, `this`, prototype chain](04-javascript-typescript/01-scope-closure-this-prototype.md)
- [ ] [Promise, async/await, error handling, Promise.all/allSettled/race/any](04-javascript-typescript/02-promise-async-await.md)
- [ ] [ES6+ features quan trọng, immutability, deep vs shallow copy](04-javascript-typescript/03-es6-immutability-copy.md)
- [ ] [TypeScript: generics, utility types, type narrowing, conditional/mapped types](04-javascript-typescript/04-typescript-core.md)
- [ ] [TypeScript nâng cao: infer, declaration files, strict mode, tsconfig](04-javascript-typescript/05-typescript-advanced.md)
- [ ] [Browser: DOM, event delegation, rendering pipeline (reflow/repaint), Web APIs, storage](04-javascript-typescript/06-browser-dom-rendering.md)

<a id="05-react"></a>
### 05 – React

- [ ] [Virtual DOM, reconciliation, Fiber, key](05-react/01-virtual-dom-reconciliation-fiber.md)
- [ ] [Hooks chuyên sâu: useState, useEffect, useRef, useMemo, useCallback, custom hooks, rules](05-react/02-hooks-deep-dive.md)
- [ ] [Re-render & tối ưu hiệu năng (memo, profiler, code splitting, lazy, Suspense)](05-react/03-rerender-performance.md)
- [ ] [State management: Context, Redux Toolkit, Zustand, React Query/TanStack Query](05-react/04-state-management.md)
- [ ] [React 18/19: concurrent rendering, transitions, Server Components, Actions, `use`](05-react/05-react-18-19.md)
- [ ] [Next.js: SSR/SSG/ISR/RSC, App Router, caching, SEO](05-react/06-nextjs.md)
- [ ] [Patterns: compound components, HOC, render props, controlled/uncontrolled form](05-react/07-component-patterns.md)
- [ ] [Testing React (React Testing Library, MSW)](05-react/08-testing-react.md)

<a id="06-vue"></a>
### 06 – Vue

- [ ] [Reactivity system Vue 3 (Proxy, ref vs reactive, computed, watch/watchEffect)](06-vue/01-reactivity-system.md)
- [ ] [Composition API vs Options API, composables](06-vue/02-composition-vs-options-api.md)
- [ ] [Component communication: props/emit, provide/inject, slots, v-model](06-vue/03-component-communication.md)
- [ ] [Pinia & state management, Vue Router (guards, lazy loading)](06-vue/04-pinia-vue-router.md)
- [ ] [Lifecycle, virtual DOM, compiler optimization, performance](06-vue/05-lifecycle-performance.md)
- [ ] [Nuxt 3: SSR, rendering modes, data fetching](06-vue/06-nuxt3.md)
- [ ] [So sánh React vs Vue (câu hỏi rất hay gặp)](06-vue/07-react-vs-vue.md)

<a id="07-database"></a>
### 07 – Database

- [ ] [SQL nâng cao: JOIN, subquery, window function, CTE, GROUP BY](07-database/01-sql-advanced.md)
- [ ] [Index: B-Tree, composite index, covering index, EXPLAIN, slow query](07-database/02-indexing-explain.md)
- [ ] [Transaction, ACID, isolation levels, locking, deadlock](07-database/03-transaction-isolation-locking.md)
- [ ] [Normalization vs denormalization, thiết kế schema](07-database/04-schema-design-normalization.md)
- [ ] [MySQL vs PostgreSQL – điểm khác biệt](07-database/05-mysql-vs-postgresql.md)
- [ ] [NoSQL: MongoDB, Redis (data types, use case, persistence), khi nào dùng](07-database/06-nosql-mongodb-redis.md)
- [ ] [Scaling DB: replication, sharding, partitioning, connection pool, CAP](07-database/07-scaling-database.md)

<a id="08-api-design"></a>
### 08 – API Design

- [ ] [REST best practices: naming, status code, versioning, pagination, idempotency](08-api-design/01-rest-best-practices.md)
- [ ] [GraphQL: schema, resolver, N+1 (DataLoader), so sánh REST](08-api-design/02-graphql.md)
- [ ] [gRPC & realtime (WebSocket, SSE, polling)](08-api-design/03-grpc-realtime.md)
- [ ] [Authentication: session vs JWT, OAuth2, OIDC, refresh token, SSO](08-api-design/04-authentication-authorization.md)
- [ ] [Rate limiting, API gateway, documentation (OpenAPI)](08-api-design/05-rate-limiting-gateway-openapi.md)

<a id="09-system-design"></a>
### 09 – System Design

- [ ] [Phương pháp trả lời câu hỏi system design (framework từng bước)](09-system-design/01-system-design-framework.md)
- [ ] [Scalability: horizontal/vertical, load balancer, stateless](09-system-design/02-scalability-load-balancing.md)
- [ ] [Caching: các chiến lược (cache-aside, write-through…), CDN, cache invalidation](09-system-design/03-caching-strategies.md)
- [ ] [Message queue & async: RabbitMQ, Kafka, SQS, event-driven](09-system-design/04-message-queue-event-driven.md)
- [ ] [Microservices vs Monolith (modular monolith), service communication, saga](09-system-design/05-microservices-vs-monolith.md)
- [ ] [Kiến trúc: Clean Architecture, Hexagonal, DDD cơ bản, CQRS, Event Sourcing](09-system-design/06-architecture-ddd-cqrs.md)
- [ ] [Reliability: retry, circuit breaker, idempotency, observability (log/metric/trace)](09-system-design/07-reliability-observability.md)
- [ ] [Case study: URL shortener, notification system, chat app, e-commerce checkout](09-system-design/08-case-studies.md)

<a id="10-security"></a>
### 10 – Security

- [ ] [OWASP Top 10 (SQLi, XSS, CSRF, SSRF, IDOR…) + cách phòng tránh trong PHP/Node/React/Vue](10-security/01-owasp-top-10.md)
- [ ] [Password hashing, encryption, secrets management](10-security/02-hashing-encryption-secrets.md)
- [ ] [CORS, CSP, cookie flags (HttpOnly, Secure, SameSite)](10-security/03-cors-csp-cookies.md)

<a id="11-testing-quality"></a>
### 11 – Testing & Quality

- [ ] [Testing pyramid: unit/integration/e2e, TDD, mocking](11-testing-quality/01-testing-pyramid-tdd.md)
- [ ] [E2E: Playwright/Cypress](11-testing-quality/02-e2e-playwright-cypress.md)
- [ ] [Code review, linting, static analysis (PHPStan/Psalm, ESLint), CI quality gates](11-testing-quality/03-code-review-static-analysis.md)

<a id="12-devops-cloud"></a>
### 12 – DevOps & Cloud

- [ ] [Git nâng cao: branching strategy, rebase vs merge, conventional commits](12-devops-cloud/01-git-advanced.md)
- [ ] [Docker & docker-compose; Kubernetes khái niệm cơ bản](12-devops-cloud/02-docker-kubernetes.md)
- [ ] [CI/CD pipeline, deployment strategy (blue-green, canary, rolling)](12-devops-cloud/03-cicd-deployment-strategies.md)
- [ ] [Cloud cơ bản (AWS: EC2, S3, RDS, Lambda, CloudFront, SQS)](12-devops-cloud/04-aws-basics.md)
- [ ] [Nginx: reverse proxy, load balancing, caching](12-devops-cloud/05-nginx.md)
- [ ] [Monitoring & logging (Prometheus, Grafana, ELK, Sentry)](12-devops-cloud/06-monitoring-logging.md)

<a id="13-soft-skills-leadership"></a>
### 13 – Soft skills & Leadership (Senior-level)

- [ ] [Vai trò senior: ownership, technical decision, trade-off](13-soft-skills-leadership/01-senior-role-ownership.md)
- [ ] [Mentoring, code review văn hóa tốt](13-soft-skills-leadership/02-mentoring-code-review-culture.md)
- [ ] [Estimation, làm việc với PO/BA, Agile/Scrum](13-soft-skills-leadership/03-estimation-agile.md)
- [ ] [Xử lý incident, postmortem, technical debt](13-soft-skills-leadership/04-incident-postmortem-tech-debt.md)
- [ ] [Viết tài liệu kỹ thuật, RFC/ADR](13-soft-skills-leadership/05-technical-writing-rfc-adr.md)

<a id="14-interview-cv"></a>
### 14 – Interview & CV

- [ ] [Cấu trúc CV senior dev (impact-based, metrics, STAR) + mẫu bullet points](14-interview-cv/01-cv-senior-developer.md)
- [ ] [Bộ câu hỏi behavioral + cách trả lời theo STAR](14-interview-cv/02-behavioral-questions-star.md)
- [ ] [Ngân hàng câu hỏi phỏng vấn kỹ thuật tổng hợp (theo module, có độ khó)](14-interview-cv/03-technical-question-bank.md)
- [ ] [Live coding / take-home: cách tiếp cận, lỗi thường gặp](14-interview-cv/04-live-coding-take-home.md)
- [ ] [Câu hỏi nên hỏi ngược nhà tuyển dụng, deal lương](14-interview-cv/05-reverse-questions-salary.md)
- [ ] [Kế hoạch ôn tập 4–6 tuần (lịch theo ngày)](14-interview-cv/06-study-schedule-4-6-weeks.md)
