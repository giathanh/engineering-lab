# Caching: các chiến lược (cache-aside, write-through…), CDN, cache invalidation

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Cache giảm latency/load bằng cách giữ derived/copy data gần consumer; cache không thay source of truth.
- Cache-aside, read-through, write-through, write-behind khác ownership, freshness và failure semantics.
- Invalidation/versioning, TTL, cache stampede, hot keys và stale reads thường khó hơn thao tác get/set.
- CDN cache public content theo key/headers/TTL; personalized content cần cache isolation để tránh data leakage.
- Đo hit ratio cùng origin latency, stale/error rate, eviction và memory; hit ratio cao không đồng nghĩa UX tốt.

## 2. Khái niệm cốt lõi

Cache-aside: application đọc cache, miss thì query source, set cache. Đơn giản và chỉ cache data được đọc; concurrent misses tạo stampede. Read-through đặt cache layer thực hiện load. Write-through ghi source/cache đồng bộ, tăng write latency nhưng giảm stale window. Write-behind ghi cache rồi flush async, tăng throughput nhưng có data-loss/reordering risk nếu cache fail.

Consistency models: TTL-only chấp nhận stale trong window; explicit invalidation giảm stale nhưng cần cover mọi write paths; versioned keys tránh delete race nhưng tạo cleanup/old-version concerns. Negative caching lưu “not found” ngắn để giảm repeated misses. Cache stampede xử lý bằng single-flight/lock, request coalescing, TTL jitter, stale-while-revalidate. Lock có lease/owner failure modes.

Cache key phải gồm mọi dimension ảnh hưởng response (tenant, locale, permission, filter). Cache value cần version/schema policy. CDN cache dựa URL, headers, cache-control, vary, cookies/query config; `private`/`no-store` cho data nhạy cảm theo semantics. Multi-layer cache khiến invalidation order và observability phức tạp.

## 3. Code ví dụ

Cache-aside với TTL và cache miss handling; pseudocode TypeScript tương ứng với Redis-backed client.

```ts
async function getProduct(id: string): Promise<Product | null> {
	const key = `product:v2:${id}`;
	const cached = await cache.get(key);
	if (cached !== null) return JSON.parse(cached) as Product;

	const product = await repository.findById(id);
	if (product) await cache.set(key, JSON.stringify(product), { ttlSeconds: 300 });
	return product;
}
```

Production cần validate cached schema, namespace tenant khi dữ liệu scope-specific, tránh JSON parse failures lặp và xử lý cache outage theo policy. Cache miss không nên tạo unbounded concurrent DB loads.

## 4. Trade-off & Best practices

- Đặt freshness SLO per dataset; chọn TTL/invalidation theo business tolerance.
- Cache derived read models khi compute/query cost cao; không cache data ít reuse hoặc invalidation cost cao nếu latency không đáng kể.
- Version key/schema, dùng TTL jitter và single-flight cho hot keys.
- Cache-aside fallback khi cache down cần giới hạn DB concurrency để tránh stampede.
- Dùng CDN cho public static/cacheable responses; kiểm tra `Cache-Control`, `Vary`, cookies/auth headers và purge policy.
- Cache key include tenant/locale/permissions; không assume URL đủ phân biệt personalized output.
- Theo dõi hit/miss, origin latency, stale age, evictions, hot keys và cache error rate.
- Theo dõi hit/miss, origin latency, stale age, evictions, hot keys và cache error rate.
- Không cache kết quả chỉ vì query chậm: kiểm tra index/plan và giảm dữ liệu trước để tránh thêm invalidation surface. Với dữ liệu cần freshness nghiêm ngặt, dùng cache có version/ETag hoặc bypass; xác định behavior khi cache backend unavailable thay vì để từng caller tự quyết.
- Không cache kết quả chỉ vì query chậm: kiểm tra index/plan và giảm dữ liệu trước để tránh thêm invalidation surface. Với dữ liệu cần freshness nghiêm ngặt, dùng cache có version/ETag hoặc bypass; xác định behavior khi cache backend unavailable thay vì để từng caller tự quyết.
- Khi cache phục vụ nhiều layers, ghi lại owner và invalidation path cho từng key family. Thêm test cho stale/expired entries và deploy schema changes để phát hiện trường hợp rolling versions cùng đọc một cache namespace.

## 5. Lỗi thường gặp / Pitfalls

- Invalidate một key nhưng quên list/search/derived caches cùng data.
- Cache stale permission-sensitive data cross-user/tenant.
- Stampede khi TTL đồng loạt hết; cache outage làm DB quá tải.
- Dùng write-behind cho dữ liệu cần durability mà không có journal/recovery.
- Chỉ tối ưu hit ratio mà không kiểm tra payload stale hoặc origin response speed.
- Không version cached objects, deployments parse format cũ/mới không tương thích.
- Purge CDN quá rộng hoặc quên CDN cache auth/cookie-sensitive responses.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Cache-aside khác write-through?</b></summary>

Cache-aside app tự load/set khi miss; write-through ghi cache đồng bộ cùng source path. Khác nhau về write latency, ownership và stale behavior.

</details>

<details>
<summary><b>Q2. Cache stampede là gì?</b></summary>

Nhiều requests cùng miss/expire key và đồng thời tải origin. Coalescing, locks, jitter hoặc stale serving giảm load burst.

</details>

<details>
<summary><b>Q3. Vì sao hit ratio không đủ?</b></summary>

Cache hit vẫn có thể trả stale/wrong-scope data; hit ratio không phản ánh user latency, origin cost, eviction hay correctness.

</details>

<details>
<summary><b>Q4. Cache key cần gì?</b></summary>

Mọi input ảnh hưởng representation/access: entity ID, tenant, locale, filters, permissions/version. Thiếu dimension gây wrong result/data leakage.

</details>

<details>
<summary><b>Q5. Cache outage xử lý thế nào?</b></summary>

Chọn fail-open/closed theo data/risk; giới hạn origin concurrency, circuit-break/cache bypass policy, alert và tránh retry storm.

</details>

## 7. Ứng dụng vào CV

- Thiết kế cache-aside/versioned invalidation cho **[N]** endpoints, giảm p95 latency **[A]%** và DB load **[B]%**.
- Giảm cache stampede bằng single-flight/TTL jitter, giữ origin CPU dưới **[A]%** khi hot-key expiry.

## 8. Tài liệu tham khảo

- [AWS: Caching best practices](https://aws.github.io/builders-library/caching-challenges-and-strategies/)
- [Cloudflare: Cache-Control](https://developers.cloudflare.com/cache/concepts/cache-control/)
- [Redis: Client-side caching](https://redis.io/docs/latest/develop/reference/client-side-caching/)
- [Google SRE: Caching](https://sre.google/sre-book/handling-overload/)

