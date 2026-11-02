# Reliability: retry, circuit breaker, idempotency, observability (log/metric/trace)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Reliability là đáp ứng SLO qua failure; redundancy không giúp nếu shared dependency/failure mode không được nhận diện.
- Retry chỉ transient failures, có deadline, backoff+jitter, retry budget và idempotency; nhiều layers retry gây amplification.
- Circuit breaker tạm ngừng gọi dependency lỗi; bulkhead/load shedding giới hạn blast radius.
- Logs, metrics, traces trả lời câu hỏi khác nhau; correlation/trace context cần đi xuyên service và queue.
- SLI/SLO/error budget biến reliability thành quyết định vận hành/feature trade-off; alert theo user impact.

## 2. Khái niệm cốt lõi

Timeout giới hạn chờ, nhưng operation server có thể tiếp tục; deadline propagation chia tổng budget giữa hops. Retry hữu ích với transient/network errors, nhưng nếu backend overload nó tăng load. Exponential backoff+jitter giảm synchronized retries; retry budget/circuit breaker/load shedding giữ hệ thống ổn định. Không retry non-idempotent operations trừ khi có idempotency key.

Circuit breaker có closed (pass calls), open (fail fast), half-open (thử recovery requests) states. Threshold/window, open duration và probe count cần tune theo traffic; breaker không phải cách sửa bug permanent. Bulkhead phân lập thread pool/connection pool/queue theo dependency để một failure không chiếm toàn resource. Fallback phải bảo toàn semantics, không trả dữ liệu sai như thành công.

Observability: logs ghi event/context; metrics là time-series aggregate cho alert/trend; traces nối spans qua request graph để tìm latency/causality. Cardinality cao (user ID, raw URL) làm metrics đắt; dùng logs/traces cho detail và metrics label bounded. SLI đo user-visible latency/availability/error; SLO đặt target/time window, error budget guide release risk. Alerts cần actionable, deduplicated và tied to symptoms.

## 3. Code ví dụ

Retry có bounded attempts, exponential backoff+jitter cho operation idempotent; production nên nhận AbortSignal/deadline.

```ts
async function retry<T>(operation: () => Promise<T>, isTransient: (error: unknown) => boolean, attempts = 3): Promise<T> {
	if (!Number.isInteger(attempts) || attempts < 1) throw new RangeError('Invalid attempts');
	for (let attempt = 0; ; attempt++) {
		try {
			return await operation();
		} catch (error) {
			if (attempt + 1 >= attempts || !isTransient(error)) throw error;
			const baseMs = 100 * 2 ** attempt;
			const delayMs = baseMs * (0.5 + Math.random()); // Jitter reduces synchronized retries.
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}
}
```

## 4. Trade-off & Best practices

- Propagate absolute deadline or remaining budget; avoid independent long timeouts at each hop.
- Retry at one well-defined layer, classify errors, cap attempts/total time and emit retry metrics.
- Circuit-break only dependency calls with meaningful health signal; use half-open probes and avoid breaker flapping.
- Bulkhead per dependency/tenant/workload; queue bounds and load shedding prevent unbounded memory.
- Define SLI from user outcome (successful requests/latency), SLO with window and exclusions documented.
- Trace context through HTTP, jobs and message headers; avoid sensitive data in baggage/logs.
- Alert on SLO burn rate/user symptoms; keep dashboards for diagnosis and test failure drills.
- Failure drills có thể bắt đầu ở staging/game day: tắt dependency, inject latency, fill queue hoặc revoke credential trong scope có kiểm soát. Đo detection/mitigation, verify rollback and recovery, rồi cập nhật runbooks; không chaos-test production nếu blast radius chưa được giới hạn.
- Khi full functionality không thể duy trì, thiết kế graceful degradation theo thứ tự ưu tiên: reject low-value work, serve stale-but-safe data, preserve critical writes và expose degraded status. Đây là business decision cần PO/operations agreement, không nên để từng service tự fallback tùy ý.

## 5. Lỗi thường gặp / Pitfalls


- Retry every error at client, gateway, service and SDK layers, multiplying traffic.
- Retry non-idempotent operation after timeout, duplicate charge/order.
- Circuit breaker open threshold too aggressive, rejecting healthy traffic or flapping.
- Fallback returns stale/incorrect data without marking degraded semantics.
- Metrics use unbounded IDs causing cardinality explosion.
- Logs lack correlation IDs or include tokens/PII.
- Alert on CPU alone while user-facing errors/latency already breach SLO.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Retry cần điều kiện gì?</b></summary>

Transient error, bounded attempts/deadline, backoff+jitter and idempotent operation or dedupe. Permanent failures should fail fast.

</details>

<details>
<summary><b>Q2. Circuit breaker khác retry?</b></summary>

Retry thử lại operation; breaker ngăn gọi dependency đang unhealthy trong một khoảng và cho probe recovery. Chúng bổ trợ nhưng không thay nhau.

</details>

<details>
<summary><b>Q3. Vì sao cần bulkhead?</b></summary>

Giới hạn tài nguyên/queue theo dependency/workload để một slow component không chiếm toàn bộ workers/connections.

</details>

<details>
<summary><b>Q4. SLI/SLO khác SLA?</b></summary>

SLI là measurement; SLO là internal target; SLA là external commitment thường gắn consequence/credit. SLO nên dẫn alert/error-budget decisions.

</details>

<details>
<summary><b>Q5. Metrics khác logs/traces?</b></summary>

Metrics tổng hợp trends/alerts; logs ghi discrete events; traces theo request path và timing qua components. Kết hợp để phát hiện và điều tra.

</details>

## 7. Ứng dụng vào CV

- Áp dụng retry budget/circuit breaker/bulkheads cho **[N]** dependencies, giảm cascading failures **[A]%**.
- Xây SLO dashboards/tracing và burn-rate alerts, giảm MTTR từ **[A] xuống [B] phút**.

## 8. Tài liệu tham khảo

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
- [Google SRE: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [AWS Builders' Library: Timeouts, retries, and backoff](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)

