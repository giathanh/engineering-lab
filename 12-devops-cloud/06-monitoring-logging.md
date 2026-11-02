# Monitoring & logging (Prometheus, Grafana, ELK, Sentry)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Metrics cho trends/alerts, logs cho event details, traces cho causal request path; correlation IDs nối chúng lại.
- RED (Rate, Errors, Duration) hữu ích cho services; USE (Utilization, Saturation, Errors) cho resources.
- Prometheus scrape/time-series + PromQL; Grafana visualize/alert; ELK/OpenSearch index/search logs; Sentry error aggregation/release context.
- Alert theo user-impact SLI/SLO và actionable symptoms; cardinality/retention/cost là design concerns.
- Structured logs, redaction, sampling và trace context giúp điều tra mà không lộ PII/secrets.

## 2. Khái niệm cốt lõi

Metrics là numeric time series với labels; histograms/summary đo distributions. Với latency, histogram buckets cho percentile aggregation qua instances tốt hơn average; cardinality tăng theo label combinations. Không dùng user IDs/request IDs làm metric labels. Prometheus pull-scrape model, exporters/instrumentation, recording/alerting rules và retention; Grafana query/visualize diverse sources.

Logs là discrete events, nên structured JSON fields (timestamp, severity, service, version, trace_id, operation) giúp query. ELK stack (Elasticsearch/Logstash/Kibana) hoặc OpenSearch pipeline ingest/index/search; indexing mọi field/long retention tăng cost. PII/tokens cần redact trước shipping, access/retention controls.

Distributed tracing tạo trace spans qua services, queue and DB calls. W3C Trace Context propagates traceparent; sampling controls cost, tail-based sampling giữ anomalous traces. Sentry groups exceptions/releases/users context và source maps; không nên gửi raw secrets/PII. OpenTelemetry standardizes APIs/SDK/exporters.

SLI measures user outcome; SLO target/time window; alerting on burn rates captures fast/slow budget consumption. Dashboards support diagnosis; alerts page humans only when action needed. Monitoring infrastructure itself needs availability, quota, cardinality and ingestion-loss observability.

## 3. Code ví dụ

Prometheus alert rule cho high error ratio; labels bounded và threshold cần tune theo traffic/SLO.

```yaml
groups:
	- name: api-slo
		rules:
			- alert: HighApiErrorRate
				expr: |
					sum(rate(http_requests_total{status=~"5.."}[5m]))
					/ sum(rate(http_requests_total[5m])) > 0.02
				for: 10m
				labels:
					severity: page
				annotations:
					summary: API error ratio exceeds 2%
```

Low traffic may make ratio noisy; combine minimum request volume and multi-window burn-rate checks.

## 4. Trade-off & Best practices

- Instrument RED at service boundaries and USE for CPU/memory/disk/network/queue saturation.
- Use histogram buckets aligned to SLO thresholds; keep labels bounded and remove high-cardinality dimensions.
- Emit structured logs with correlation/trace IDs, redact at source, and define retention/access policies.
- Propagate trace context across HTTP/messages; sample normal traffic but preserve error/slow traces under budget.
- Alert on SLO burn/customer symptoms; include owner, runbook, dashboard and clear action.
- Separate dashboards for service health, dependencies, capacity and business signals; avoid metric vanity.
- Track ingestion drop rates, scrape failures, storage retention and alert delivery health.
- Track ingestion drop rates, scrape failures, storage retention and alert delivery health.
- Thiết kế dashboard theo câu hỏi: user đang gặp gì, dependency nào gây ra và change nào vừa deploy. Tách overview khỏi diagnostic panels, dùng annotations cho releases/incidents và link trace từ exemplar/log để rút ngắn path điều tra.
- Alert fatigue giảm khi deduplicate theo service/region, group correlated symptoms và page theo burn-rate windows. Non-paging alerts vẫn cần ticket/owner nhưng không nên làm nhiễu on-call; diễn tập alert delivery để chắc chắn escalation channel hoạt động.
- Alert fatigue giảm khi deduplicate theo service/region, group correlated symptoms và page theo burn-rate windows. Non-paging alerts vẫn cần ticket/owner nhưng không nên làm nhiễu on-call; diễn tập alert delivery để chắc chắn escalation channel hoạt động.
- Mỗi alert nên link runbook chỉ rõ safe mitigation, verification queries và escalation owner; dashboards không nên yêu cầu người trực nhớ metric names. Sau incident, rà lại liệu signal có phát hiện đúng user impact và liệu sampling/retention có giữ đủ evidence.

## 5. Lỗi thường gặp / Pitfalls

- Label metrics by user/request ID, causing cardinality explosion.
- Alert on every exception/CPU spike without SLO impact/action.
- Log secrets, authorization headers, payment data or full request bodies.
- Use average latency to hide tail latency.
- Trace context lost at async queue boundaries, preventing end-to-end correlation.
- Sample away every error/slow trace or retain all traces without cost control.
- Build dashboards without alert/runbook ownership.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Metrics/logs/traces khác nhau thế nào?</b></summary>

Metrics aggregate numeric trends/alerts; logs capture individual events/context; traces show causal timing across request components.

</details>

<details>
<summary><b>Q2. Cardinality cao gây gì?</b></summary>

Nhiều unique label combinations tăng RAM/storage/index/query cost và có thể làm monitoring system unavailable.

</details>

<details>
<summary><b>Q3. RED và USE?</b></summary>

RED: request rate, errors, duration cho services; USE: utilization, saturation, errors cho resources. Chúng là heuristic, không thay domain SLO.

</details>

<details>
<summary><b>Q4. Vì sao percentile cần histogram?</b></summary>

Histograms cho phép aggregate latency distribution qua instances; average che tail và local percentiles không thể tổng hợp chính xác.

</details>

<details>
<summary><b>Q5. Alert tốt cần gì?</b></summary>

User-impact threshold, actionable response, owner/runbook, low noise và delivery monitoring. Alert chỉ quan sát mà không cần hành động nên là dashboard.

</details>

## 7. Ứng dụng vào CV

- Xây RED/SLO dashboards, trace propagation và burn-rate alerts cho **[N]** services, giảm MTTR **[A]%**.
- Giảm metrics cardinality/log ingestion cost **[A]%** bằng label/redaction/retention policy mà vẫn giữ incident signal.

## 8. Tài liệu tham khảo

- [Prometheus Documentation](https://prometheus.io/docs/introduction/overview/)
- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Google SRE: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
