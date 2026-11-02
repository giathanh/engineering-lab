# Express vs NestJS vs Fastify: kiến trúc, middleware, DI trong NestJS

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Express tối giản, hệ sinh thái trưởng thành và linh hoạt; team phải tự thống nhất cấu trúc, validation, DI và error policy.
- Fastify chú trọng throughput, plugin encapsulation và schema-based validation/serialization; plugin lifecycle là một phần kiến trúc, không chỉ cú pháp route.
- NestJS là framework opinionated, thường dùng adapter Express hoặc Fastify; cung cấp module, controller, provider, DI và các abstraction cho ứng dụng lớn.
- Không chọn framework chỉ từ benchmark “hello world”; đo workload thật, plugin, validation, serialization, observability và năng lực vận hành.
- Nest DI có scope và lifecycle; singleton là mặc định phổ biến, request-scoped provider có thể tăng chi phí lan truyền theo dependency graph.

## 2. Khái niệm cốt lõi

Express tổ chức request bằng middleware chain: mỗi middleware gọi `next()`, kết thúc response, hoặc chuyển lỗi cho error middleware. Sự linh hoạt giúp tích hợp library dễ nhưng cũng làm cấu trúc giữa các team lệch nhau. Cần thống nhất thứ tự middleware, schema validation và boundary lỗi.

Fastify định nghĩa plugin encapsulation: decorator, hook và route có phạm vi theo cây plugin. Request lifecycle có hooks như `onRequest`, `preValidation`, `preHandler`, `onSend`; schema có thể dùng để validate input và serialize output. Schema vừa tăng hiệu năng vừa làm contract rõ, nhưng schema do người dùng cung cấp không đáng tin cần được review và không nên compile tùy tiện từ dữ liệu runtime.

NestJS đóng gói ứng dụng thành module với controller và provider. DI container resolve dependency qua token/module visibility; guard xử lý authorization, pipe transform/validation, interceptor bao quanh invocation, filter định dạng lỗi. Nest có thể chạy với Express adapter hoặc Fastify adapter, nhưng không phải mọi middleware/plugin đều tương thích nguyên trạng.

## 3. Code ví dụ

Ví dụ Fastify 5 tối giản với schema khai báo input/output. Cài `fastify` và chạy file ESM bằng Node 22.

```js
import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.post('/users', {
	schema: {
		body: {
			type: 'object',
			required: ['name'],
			additionalProperties: false,
			properties: { name: { type: 'string', minLength: 1 } },
		},
		response: {
			201: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
		},
	},
}, async (request, reply) => {
	return reply.code(201).send({ id: crypto.randomUUID(), name: request.body.name });
});

await app.listen({ port: 3000, host: '127.0.0.1' });
```

Với NestJS, cùng chức năng thường đi qua controller, DTO/pipe và service provider. Đặt business logic trong provider để có thể test độc lập và giữ controller mỏng; adapter là lựa chọn transport, không thay thế thiết kế domain.

## 4. Trade-off & Best practices

- Chọn Express khi cần tối giản, library compatibility rộng và team sẵn sàng thiết lập convention. Chọn Fastify khi schema/plugin model phù hợp và cần kiểm soát serialization/request lifecycle.
- Chọn NestJS khi quy mô team/codebase hưởng lợi từ module boundaries, DI và convention nhất quán. Với service nhỏ, abstraction có thể làm tăng learning curve và ceremony.
- Định nghĩa validation ở boundary, đóng schema (`additionalProperties: false` khi hợp lý), và serialize response theo allowlist.
- Tránh request-scoped dependency nếu không cần. Ưu tiên singleton stateless và truyền context tường minh; đo overhead của scope trong tải lớn.
- Benchmark endpoint thực với TLS, auth, logging, payload và database; dùng cùng cấu hình runtime và concurrency.
- Đóng gói capability theo module/plugin, không tạo “god module” hoặc middleware toàn cục khó hiểu thứ tự thực thi.

## 5. Lỗi thường gặp / Pitfalls

- So sánh framework chỉ bằng số request benchmark toy, bỏ qua database và serialization.
- Trong Express, quên gọi `next`, gọi hai lần, hoặc không chuyển rejection async theo pattern phiên bản/framework đang dùng.
- Trong Fastify, đăng ký plugin ngoài scope dự kiến hoặc truy cập decorator trước khi plugin được nạp.
- Trong NestJS, để provider thiếu module export/import, nhầm guard với middleware, hoặc dùng request scope cho toàn bộ graph.
- Tin rằng DTO TypeScript tự validate runtime; type bị xóa khi compile nên cần validation pipe/schema thực.
- Dùng schema response không khớp dữ liệu thực khiến field bị loại, hoặc vô tình serialize dữ liệu nhạy cảm do schema quá rộng.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Express và Fastify khác nhau ở định hướng nào?</b></summary>

Express tối giản và middleware-centric; Fastify xây quanh plugin encapsulation, lifecycle hooks và schema validation/serialization. Framework phù hợp phụ thuộc nhu cầu và ecosystem.

</details>

<details>
<summary><b>Q2. NestJS DI container giải quyết vấn đề gì?</b></summary>

Quản lý construction/lifecycle dependency và module boundaries, giảm coupling giữa controller/service/repository. Cần thiết kế token/scope rõ để tránh dependency graph phức tạp.

</details>

<details>
<summary><b>Q3. Vì sao TypeScript DTO không đủ để validate request?</b></summary>

TypeScript type bị xóa ở runtime. Phải chạy validation bằng schema/pipe và xử lý lỗi trước khi business logic nhận dữ liệu.

</details>

<details>
<summary><b>Q4. Khi nào request-scoped provider có ích?</b></summary>

Khi dependency thực sự cần state theo request, ví dụ context được gắn vào một graph. Nếu chỉ cần correlation ID, context truyền tường minh hoặc async context có thể rẻ hơn.

</details>

<details>
<summary><b>Q5. NestJS dùng Fastify có luôn nhanh hơn Express không?</b></summary>

Không thể kết luận chỉ từ adapter. Plugin, middleware compatibility, validation, workload và cấu hình quyết định; benchmark ứng dụng thực tế.

</details>

<details>
<summary><b>Q6. Làm sao giữ API contract an toàn?</b></summary>

Validate request tại boundary, reject field không mong muốn khi thích hợp, định nghĩa output schema/DTO rõ và test contract. Không dùng object database trực tiếp làm response.

</details>

## 7. Ứng dụng vào CV

- Chuẩn hóa **[N]** API modules bằng validation schema, DI boundaries và error policy, giảm lỗi dữ liệu production **[A]%** và thời gian onboard từ **[B] xuống [C] ngày**.
- Tối ưu request lifecycle và response serialization, nâng throughput **[A]%** ở p95 latency **[B] ms** trên workload đại diện.

## 8. Tài liệu tham khảo

- [Express documentation](https://expressjs.com/)
- [Fastify documentation](https://fastify.dev/docs/latest/)
- [NestJS fundamentals: providers and modules](https://docs.nestjs.com/providers)
- [NestJS Fastify adapter](https://docs.nestjs.com/techniques/performance)

