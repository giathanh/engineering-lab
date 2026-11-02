# Scalability: horizontal/vertical, load balancer, stateless

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Vertical scaling tăng resources một node; horizontal scaling thêm instances, tăng capacity/reliability nhưng cần coordination/statelessness.
- Load balancer phân phối traffic theo health/capacity; L4 routes connections, L7 hiểu HTTP/application metadata.
- Stateless app instances dễ scale/replace; state cần externalize hoặc affinity được thiết kế rõ.
- Autoscaling cần signal/threshold/cooldown/capacity warm-up; scaling phản ứng sau demand spike, không thay capacity planning.
- Bottleneck có thể chuyển sang DB, cache, queue hoặc downstream; scale app không scale toàn hệ thống.

## 2. Khái niệm cốt lõi

Vertical scaling ít thay đổi application architecture, giảm network hops, nhưng có ceiling, noisy-neighbor/cloud cost và single-node failure risk. Horizontal scaling thêm replicas, có thể tăng aggregate throughput và availability nếu workload partitionable; cần load balancing, shared/external state, idempotency, distributed coordination và deploy strategy.

L4 load balancer route TCP/UDP connections theo IP/port, ít hiểu app semantics. L7 reverse proxy đọc HTTP host/path/headers, hỗ trợ TLS termination, routing, retries, compression và request limits. Algorithms gồm round robin, least connections, weighted, consistent hashing; sticky sessions giữ client vào instance nhưng làm skew/failover phức tạp. Health checks cần phân biệt liveness (process còn sống) và readiness (có thể nhận traffic); deep dependency checks quá nhạy có thể làm tất cả instances bị eject cùng lúc.

Stateless không có nghĩa không có state; nó có nghĩa instance không phải nơi duy nhất giữ state cần thiết cho request tiếp theo. Session/cache/file cần shared store/object storage hoặc affinity có rationale. Autoscaling dựa CPU, queue depth, latency hoặc custom metrics; scale-down drain connections, queue work và warm/cold start cần xét. Capacity headroom cho deploy/failover để N-1 capacity đủ đáp ứng degraded mode.

## 3. Code ví dụ

Nginx upstream dùng least-connections cơ bản (do có least_conn); production cần health checks/TLS/timeout phù hợp platform/version.

```nginx
upstream app_servers {
	least_conn;
	server app-1:8080 max_fails=3 fail_timeout=10s;
	server app-2:8080 max_fails=3 fail_timeout=10s;
}

server {
	listen 80;
	location / {
		proxy_connect_timeout 2s;
		proxy_read_timeout 30s;
		proxy_pass http://app_servers;
	}
}
```

Timeouts cần phối hợp end-to-end deadline và proxy buffering; retry unsafe request có thể duplicate side effects.

## 4. Trade-off & Best practices

- Scale bottleneck đã đo; benchmark one-node vertical limit và horizontal efficiency/cost trước khi chọn.
- Externalize session/job state, dùng object storage cho files và shared cache/database có consistency policy.
- Định nghĩa readiness/liveness riêng, graceful drain, connection keepalive và termination grace period.
- Autoscale theo leading indicator (queue depth/requests) cùng CPU/memory, có cooldown và max capacity để tránh oscillation.
- Test instance loss, zone loss, noisy dependency và rolling deploy; đảm bảo remaining capacity đủ degraded SLO.
- Tránh sticky sessions trừ khi cần, và có session recovery/failover.
- Load test từ edge đến DB/cache, tính connection multiplication và retry amplification.
- Capacity planning tính cả deploy/maintenance: rolling rollout có thể chạy old/new versions song song, còn failover làm traffic dồn vào phần capacity còn lại. Xác định graceful degradation (ví dụ tắt analytics trước checkout) và test với traffic mix tương tự production.

## 5. Lỗi thường gặp / Pitfalls

- Scale web tier làm DB connection count tăng vượt capacity.
- Health check phụ thuộc mọi downstream, khiến outage dependency làm toàn cluster bị loại khỏi LB.
- Autoscaler phản ứng trễ, queue backlog tăng nhanh hơn warm-up time.
- Retry ở nhiều tầng nhân request load khi backend đang quá tải.
- Sticky session gây hot instance và giảm failover flexibility.
- Không drain persistent connections/WebSockets khi deploy.
- Coi active instances count là availability metric mà không theo dõi request success/latency.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Horizontal scaling cần điều kiện gì?</b></summary>

Workload có thể phân phối, state không phụ thuộc local instance hoặc có shared/partitioned state, và downstream capacity/coordination đủ đáp ứng.

</details>

<details>
<summary><b>Q2. L4 và L7 load balancer khác gì?</b></summary>

L4 phân phối transport connections; L7 hiểu protocol/application fields như host/path/headers và có thể áp dụng routing/policies HTTP.

</details>

<details>
<summary><b>Q3. Liveness khác readiness?</b></summary>

Liveness cho biết process cần restart hay không; readiness cho biết có nhận traffic được không. Tách chúng tránh restart healthy process vì downstream tạm lỗi.

</details>

<details>
<summary><b>Q4. Stateless app có state không?</b></summary>

Có, nhưng request không phụ thuộc local memory độc quyền; state cần tồn tại được externalize hoặc partition/route có chủ đích.

</details>

<details>
<summary><b>Q5. Vì sao autoscaling không thay capacity planning?</b></summary>

Scale có propagation/startup delay, quota/cost limits và downstream capacity constraints. Cần headroom, load shedding và failover plan.

</details>

## 7. Ứng dụng vào CV

- Scale stateless API tier từ **[A] lên [B] replicas** với graceful drain, tăng throughput **[C]%** và giữ p99 dưới **[D] ms**.
- Thiết kế readiness/autoscaling theo queue/latency, giảm recovery time **[A]%** khi mất một availability zone.

## 8. Tài liệu tham khảo

- [NGINX: Load Balancing](https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/)
- [AWS: Elastic Load Balancing](https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html)
- [Kubernetes: Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)
- [Google SRE: Handling Overload](https://sre.google/sre-book/handling-overload/)
