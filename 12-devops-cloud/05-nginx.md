# Nginx: reverse proxy, load balancing, caching

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~8 phút

## 1. Tóm tắt nhanh (TL;DR)

- Nginx event-driven worker model xử lý nhiều connections với non-blocking I/O; dùng như web server, reverse proxy, TLS terminator, load balancer và cache.
- Reverse proxy route client traffic tới upstreams, che internal topology và áp dụng timeouts/headers/buffering.
- Load balancing algorithms gồm round-robin, least connections, IP hash/consistent hashing tùy module/config.
- Proxy cache cần cache key, bypass rules, `Cache-Control`, auth/cookie semantics và invalidation rõ.
- Timeouts, body limits, keepalive, health/observability và graceful reload ảnh hưởng reliability trực tiếp.

## 2. Khái niệm cốt lõi

Nginx master quản lý worker processes; workers dùng event loop để multiplex connections. Reverse proxy nhận client request rồi gửi upstream; client chỉ thấy Nginx. `proxy_set_header` truyền host/client/protocol metadata; trusted proxy chain phải cấu hình để app không tin forwarded headers do attacker gửi.

Upstream groups định nghĩa backend servers và balancing; default round-robin. `least_conn` phù hợp connection duration khác nhau; hash giúp affinity nhưng có hot spots. Passive failure detection (`max_fails`, `fail_timeout`) không thay application health/readiness. Keepalive upstream giảm connection setup nhưng cần limits.

Proxy buffering tách tốc độ client/upstream; buffering large responses dùng memory/temp files, streaming endpoints có thể cần tắt/điều chỉnh. `client_max_body_size`, connect/read/send timeouts giới hạn resource. `proxy_read_timeout` là gap giữa reads, không phải absolute request deadline.

Cache key thường gồm scheme/host/URI/query; cookies/auth có thể làm response private. Dùng `Cache-Control`, bypass/no-cache rules, stale policy và purge/version keys. TLS termination tập trung cert management nhưng cần encryption/re-auth giữa Nginx và upstream theo trust boundary. HTTP/2/3 support phụ thuộc build/version/platform.

## 3. Code ví dụ

Reverse proxy upstream với forwarded headers, keepalive và timeouts.

```nginx
upstream api_backend {
	least_conn;
	server api-1:8080 max_fails=3 fail_timeout=10s;
	server api-2:8080 max_fails=3 fail_timeout=10s;
	keepalive 32;
}

server {
	listen 443 ssl;
	server_name api.example.com;
	client_max_body_size 10m;

	location / {
		proxy_set_header Host $host;
		proxy_set_header X-Forwarded-Proto $scheme;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_connect_timeout 2s;
		proxy_read_timeout 30s;
		proxy_pass http://api_backend;
	}
}
```

Backend phải trust forwarded headers chỉ từ proxy network; production TLS certificate/config omitted ở ví dụ.

## 4. Trade-off & Best practices

- Định nghĩa upstream timeouts nhỏ hơn end-to-end deadline và align retries ở một layer để tránh amplification.
- Set body/header limits, buffering/temp storage và connection limits theo workload.
- Chỉ trust forwarded headers từ known proxies; reset/overwrite client-supplied values tại edge.
- Cache chỉ public/cacheable responses; bypass auth/cookies khi response personalized và include required vary dimensions.
- Dùng graceful reload, config test (`nginx -t`) trước reload và version-controlled config.
- Monitor active connections, upstream latency/status, retries, 4xx/5xx, cache hit/miss, temp disk and worker resource use.
- Monitor active connections, upstream latency/status, retries, 4xx/5xx, cache hit/miss, temp disk and worker resource use.
- Xác định request ID tại edge và propagate xuyên upstream; không tin ID do client tự cấp nếu dùng để correlate security audit. Access logs có thể gồm query parameters chứa dữ liệu nhạy cảm, nên redact/omit fields và đặt retention theo policy.
- Nginx retries cần giới hạn attempts, timeout và status codes; retrying non-idempotent methods có thể thực thi side effects hai lần. Với streaming responses, buffering và retry behavior phải được thử trên endpoint thực thay vì áp một config toàn cục.
- Với WebSocket/SSE, cấu hình HTTP version/upgrade headers, buffering, idle timeout và connection draining phù hợp.

## 5. Lỗi thường gặp / Pitfalls

- Tin `X-Forwarded-For` từ mọi client, làm bypass IP allowlists/audit.
- Cache responses có Set-Cookie/Authorization mà không bypass, gây data leakage.
- Dùng `proxy_read_timeout` như total request deadline.
- Không cấu hình `client_max_body_size`, cho phép upload vượt resource budget.
- Proxy WebSocket/SSE với buffering/idle timeouts không phù hợp.
- Retry upstream ở nhiều layers tạo duplicate writes/overload.
- Reload config lỗi nhưng chưa test syntax, làm mất traffic/reload failed.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Reverse proxy làm gì?</b></summary>

Nhận request thay backend, route upstream, áp TLS/policies/buffering/load balancing và che topology. Trust boundary/forwarded headers cần cấu hình an toàn.

</details>

<details>
<summary><b>Q2. `least_conn` khác round-robin?</b></summary>

Least-connections chọn upstream có ít active connections; hữu ích khi request duration khác nhau. Round-robin đơn giản và thường đủ nếu workload đều.

</details>

<details>
<summary><b>Q3. Vì sao proxy cache có thể leak data?</b></summary>

Key/bypass rules có thể không phân biệt user/auth/cookie context, khiến shared cache trả private response cho client khác.

</details>

<details>
<summary><b>Q4. `proxy_read_timeout` đo gì?</b></summary>

Khoảng thời gian chờ giữa các reads từ upstream, không phải deadline tổng cho toàn request.

</details>

<details>
<summary><b>Q5. Vì sao forwarded headers phải trust có chọn lọc?</b></summary>

Client có thể tự gửi header giả; chỉ proxy đã xác thực nên được phép cung cấp origin/client metadata tin cậy.

</details>

## 7. Ứng dụng vào CV

- Tuning Nginx proxy/buffering/keepalive cho **[N]** upstreams, giảm p95 edge latency **[A]%** và 5xx **[B]%**.
- Chuẩn hóa cache bypass/TLS/forwarded-header policies cho **[N]** routes, đóng **[A]** security findings.

## 8. Tài liệu tham khảo

- [NGINX Admin Guide](https://docs.nginx.com/nginx/admin-guide/)
- [NGINX: Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [NGINX: Load Balancing](https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/)
- [NGINX: Proxy Cache](https://docs.nginx.com/nginx/admin-guide/content-cache/content-caching/)

