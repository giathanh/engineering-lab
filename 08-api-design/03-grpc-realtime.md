# gRPC & realtime (WebSocket, SSE, polling)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- gRPC dùng Protocol Buffers contract và thường chạy trên HTTP/2; hỗ trợ unary, server/client/bidirectional streaming.
- Protobuf nhỏ/typed và code-generated, nhưng schema evolution cần field-number discipline và browser/proxy compatibility planning.
- WebSocket là full-duplex channel; SSE là one-way server-to-client trên HTTP; polling đơn giản nhưng latency/traffic cao hơn.
- Realtime cần auth, reconnect/backoff, heartbeat, ordering, duplicate handling, fan-out và connection draining.
- Chọn transport theo interaction pattern, client support, observability và operations—not benchmark alone.

## 2. Khái niệm cốt lõi

gRPC service/method được định nghĩa bằng `.proto`; protoc/plugin sinh client/server stubs. Unary giống request-response; streaming giữ HTTP/2 stream mở. Protobuf dùng field numbers trong wire format, nên không reuse number đã xóa; optional/default/presence semantics phải cân nhắc khi update schema. gRPC status codes/trailers biểu diễn errors; deadlines propagate xuống downstream và cancellation cần được tôn trọng.

HTTP/2 multiplexing cho nhiều RPC trên connection, nhưng browser-native gRPC thường cần gRPC-Web/proxy vì framing/trailers restrictions. Load balancer cần hỗ trợ long-lived HTTP/2 streams, health checks và graceful connection draining. Streaming tạo backpressure/flow-control concerns; consumer chậm phải không khiến memory vô hạn tăng.

WebSocket qua HTTP/1.1 dùng Upgrade handshake; HTTP/2/3 có extended CONNECT khi được hỗ trợ. Sau handshake, giao tiếp dùng persistent bidirectional frames; client/server đều chủ động gửi. SSE dùng `text/event-stream`, browser tự reconnect, hỗ trợ event IDs/replay nếu server lưu cursor. Long polling giữ request đến khi có update rồi client gọi lại. Polling dễ cache/deploy và thường đủ cho updates ít frequent; realtime channels tăng connection/fan-out/operations complexity.

## 3. Code ví dụ

Protocol definition cho unary lookup và server stream; giữ field numbers ổn định qua versions.

```proto
syntax = "proto3";

package catalog.v1;

service Catalog {
	rpc GetProduct(GetProductRequest) returns (Product);
	rpc WatchInventory(WatchInventoryRequest) returns (stream InventoryUpdate);
}

message GetProductRequest { string product_id = 1; }
message Product { string id = 1; string name = 2; }
message WatchInventoryRequest { string warehouse_id = 1; }
message InventoryUpdate { string product_id = 1; int32 available = 2; }
```

## 4. Trade-off & Best practices

- Dùng gRPC cho internal typed service-to-service communication/streaming khi toolchain hỗ trợ; REST/JSON dễ inspect và browser/public client compatibility hơn.
- Propagate deadlines/cancellation; bound stream buffers và message sizes.
- Version Protobuf additively, reserve removed field numbers/names, tránh đổi wire type/incompatible semantics.
- WebSocket cho bidirectional low-latency interaction; SSE cho one-way updates; polling cho low frequency/simplicity/fallback.
- Thiết kế reconnect exponential backoff+jitter, event cursor/dedup, heartbeat, auth refresh và tenant authorization.
- Drain persistent connections trong deploy, xử lý reconnect storm và load distribution.
- Instrument active connections, message rates, lag, disconnect reasons, stream duration và backpressure.
- Tách connection lifetime khỏi user session lifetime: token expiry/revocation có thể xảy ra khi socket vẫn mở. Khi deploy, gửi close/reconnect hint có backoff và resume cursor để clients không tạo connection storm hoặc mất update.
- Với browser clients, kiểm tra gRPC-Web proxy compatibility, CORS/preflight và trailer-to-header mapping; không giả định native gRPC streaming hoạt động trực tiếp qua mọi browser/CDN. Một protocol fallback có thể cần thiết cho public APIs.

## 5. Lỗi thường gặp / Pitfalls

- Reuse Protobuf field number sau khi xóa, khiến old/new clients parse sai.
- Không set deadline, để RPC treo và giữ resource downstream.
- Nghĩ HTTP/2 tự bảo đảm app-level flow control cho mọi streaming buffers.
- WebSocket auth chỉ lúc handshake nhưng không revalidate token/session expiry hoặc channel permissions.
- Reconnect không jitter tạo thundering herd sau deploy/network outage.
- SSE không lưu event ID/replay nhưng kỳ vọng client reconnect không mất event.
- Scale WebSocket instances mà không có shared pub/sub/fan-out strategy.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. gRPC khác REST thế nào?</b></summary>

gRPC dùng schema/protobuf codegen, HTTP/2 và streaming APIs; REST/JSON thường dễ browser/debug/cache integration hơn. Chọn theo client ecosystem, contract and operations.

</details>

<details>
<summary><b>Q2. Khi nào dùng server streaming?</b></summary>

Khi server trả incremental updates cho một request, như feed/progress. Cần deadline, flow control, reconnect/resume và bounded buffering.

</details>

<details>
<summary><b>Q3. WebSocket hay SSE?</b></summary>

WebSocket cho hai chiều; SSE cho server-to-client qua HTTP đơn giản hơn. Nếu updates thưa, polling có thể vận hành rẻ hơn.

</details>

<details>
<summary><b>Q4. Vì sao gRPC cần deadlines?</b></summary>

Giới hạn request lifetime, giải phóng resource và propagate cancellation xuyên service graph. Timeout riêng lẻ không có deadline end-to-end gây work vô ích.

</details>

<details>
<summary><b>Q5. Protobuf compatibility cần bảo đảm gì?</b></summary>

Thay đổi additive, không reuse field numbers, reserve removed fields và kiểm thử old/new client-server combinations.

</details>

## 7. Ứng dụng vào CV

- Triển khai gRPC streaming với deadline/backpressure cho **[N]** service clients, giảm payload overhead **[A]%** và p95 latency **[B]%**.
- Thiết kế reconnect/replay/fan-out cho **[N]** realtime connections, giảm event loss **[A]%** khi rolling deploy.

## 8. Tài liệu tham khảo

- [gRPC Documentation](https://grpc.io/docs/)
- [Protocol Buffers: Updating a Message Type](https://protobuf.dev/programming-guides/proto3/#updating)
- [MDN: WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

