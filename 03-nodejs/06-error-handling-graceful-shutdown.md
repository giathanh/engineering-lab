# Error handling (sync/async, unhandledRejection, graceful shutdown)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Phân biệt lỗi dự kiến (validation, not found, timeout) với lỗi vận hành/bug; chuyển lỗi qua boundary phù hợp và không làm lộ nội bộ.
- `try/catch` bắt lỗi đồng bộ trong block và Promise được `await`; callback async cần truyền error hoặc chuyển thành Promise.
- `unhandledRejection` là tín hiệu lỗi cần xử lý ở cấp process/observability, không phải chỗ để tiếp tục phục vụ như bình thường sau lỗi không xác định.
- `uncaughtException` thường cho thấy process có thể ở trạng thái không tin cậy: log đồng bộ tối thiểu, thoát có kiểm soát và để supervisor khởi động lại.
- Graceful shutdown: ngừng nhận traffic, drain request, đóng consumer/connection pool, giới hạn thời gian rồi exit.

## 2. Khái niệm cốt lõi

Lỗi nên được phân loại theo khả năng phục hồi và boundary. Lỗi nghiệp vụ như input invalid hoặc resource không tồn tại được chuyển thành kết quả HTTP tương ứng. Lỗi transient bên ngoài có thể retry có giới hạn nếu thao tác idempotent. Lỗi programmer/invariant violation thường cần fail fast và cảnh báo.

Trong Promise chain, rejection không được xử lý sẽ lan đến handler kế tiếp; `await` ném rejection vào `try/catch`. Tuy nhiên, `try/catch` không bắt exception xảy ra trong callback chạy sau đó nếu callback không được nối vào Promise hiện tại. Tại boundary callback-based, dùng API Promise hoặc bọc callback đúng cách.

`uncaughtException` handler ngăn Node thoát mặc định, nhưng không bảo đảm heap/invariants còn an toàn. Node docs khuyến nghị dùng handler để cleanup đồng bộ cuối cùng rồi shutdown, còn restart do external monitor thực hiện. `unhandledRejection` policy có thể thay đổi theo phiên bản/runtime flags; ứng dụng nên có logging và chính sách rõ thay vì dựa vào default.

Graceful shutdown là giao thức của ứng dụng và hạ tầng. Khi nhận `SIGTERM`, service đánh dấu readiness false, dừng accept request mới, chờ request đang chạy trong deadline, đóng queue consumer và DB connections, rồi thoát. Deadline phải nhỏ hơn termination grace period của container/process manager.

## 3. Code ví dụ

Ví dụ HTTP server nhỏ minh họa readiness và idempotent shutdown. Production server cần thêm drain behavior/framework hooks cho request đang chạy.

```js
import { createServer } from 'node:http';

const server = createServer((request, response) => {
	if (request.url === '/ready' && !shuttingDown) {
		response.writeHead(200).end('ready');
		return;
	}
	response.writeHead(shuttingDown ? 503 : 200).end('ok');
});

let shuttingDown = false;
server.listen(3000);

async function shutdown(signal) {
	if (shuttingDown) return;
	shuttingDown = true;
	console.log(`Received ${signal}; draining server`);

	const forceExit = setTimeout(() => process.exit(1), 10_000);
	forceExit.unref();

	server.close((error) => {
		clearTimeout(forceExit);
		if (error) {
			console.error(error);
			process.exitCode = 1;
		}
	});
}

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
```

Không gọi `process.exit()` ngay sau khi set `process.exitCode`; `exit()` cắt ngang I/O đang pending. `server.close()` ngừng accept kết nối mới và callback hoàn tất khi server đã đóng theo semantics của API; resource khác phải được đóng riêng.

## 4. Trade-off & Best practices

- Dùng custom error type hoặc error code ổn định; giữ `cause` khi wrap lỗi để trace nguyên nhân. Không trả stack trace hay SQL/config ra client.
- Đặt error boundary ở request handler, queue consumer, scheduler và process. Log context có correlation ID nhưng redact secrets/PII.
- Retry chỉ lỗi transient, có backoff+jitter, deadline và giới hạn attempts; tránh retry lỗi validation hoặc không idempotent.
- Cài handler process-level để quan sát và shutdown có chủ đích. Restart bằng orchestrator/supervisor, kết hợp health checks và crash loop alert.
- Shutdown phải idempotent; đặt deadline toàn cục, dừng nguồn công việc mới trước khi đóng dependency. Test shutdown khi đang xử lý request và khi DB/queue chậm.

## 5. Lỗi thường gặp / Pitfalls

- `try/catch` quanh hàm đăng ký callback rồi kỳ vọng bắt lỗi ném sau đó.
- Bỏ `.catch()` ở Promise khởi chạy nền, tạo unhandled rejection không được giám sát.
- Bắt `uncaughtException`, log rồi tiếp tục chạy với state không chắc chắn.
- Retry vô hạn hoặc retry đồng bộ tất cả request, tạo retry storm khi dependency đang lỗi.
- Gọi `process.exit(0)` ngay khi nhận SIGTERM, làm mất request, log hoặc message chưa ack.
- Chỉ đóng HTTP server mà quên consumer, timer, WebSocket, DB pool và telemetry exporter.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. `try/catch` có bắt được mọi lỗi async không?</b></summary>

Không. Nó bắt rejection được `await` trong try và lỗi đồng bộ trong block. Callback độc lập hoặc Promise không await cần cơ chế xử lý riêng.

</details>

<details>
<summary><b>Q2. Nên làm gì khi có `uncaughtException`?</b></summary>

Ghi nhận lỗi và cleanup đồng bộ tối thiểu rồi kết thúc process với exit code khác 0; supervisor restart. Nếu đã gắn uncaughtException handler, chỉ đặt process.exitCode không bảo đảm thoát vì server/timer còn có thể giữ event loop sống. Có thể dùng uncaughtExceptionMonitor để quan sát mà giữ hành vi crash mặc định. Không coi process là khỏe mạnh để tiếp tục xử lý traffic.

</details>

<details>
<summary><b>Q3. `unhandledRejection` nên được dùng ra sao?</b></summary>

Phòng tránh bằng cách nối handler cho mọi Promise nền; process handler là lớp quan sát/shutdown cuối cùng. Không dựa vào handler để nuốt lỗi và tiếp tục bình thường.

</details>

<details>
<summary><b>Q4. Trình tự graceful shutdown chuẩn?</b></summary>

Mark unready, ngừng nhận công việc mới, drain request/consumer đang chạy, đóng dependency, flush telemetry trong deadline, rồi exit. Hành vi cần khớp với orchestrator.

</details>

<details>
<summary><b>Q5. Khi nào retry là nguy hiểm?</b></summary>

Khi side effect không idempotent, retry không có deadline/backoff, hoặc dependency đang overload. Dùng idempotency key/outbox nếu phù hợp và giới hạn retry budget.

</details>

<details>
<summary><b>Q6. Vì sao tránh `process.exit()` trong luồng lỗi thông thường?</b></summary>

Nó thoát ngay, có thể cắt log và I/O pending. Đặt `process.exitCode`, đóng resource và để event loop kết thúc tự nhiên.

</details>

## 7. Ứng dụng vào CV

- Chuẩn hóa graceful shutdown cho **[N]** Node services, giảm message bị xử lý trùng/mất trong deploy từ **[A] xuống [B] mỗi tháng**.
- Thiết kế retry budget, error classification và correlation logging, giảm MTTR incident dependency timeout từ **[A] xuống [B] phút**.

## 8. Tài liệu tham khảo

- [Node.js Process: `uncaughtException` and rejections](https://nodejs.org/api/process.html)
- [Node.js HTTP: `server.close`](https://nodejs.org/api/http.html#serverclosecallback)
- [Node.js: Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
- [Kubernetes: Pod lifecycle and termination](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
