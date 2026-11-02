# Next.js: SSR/SSG/ISR/RSC, App Router, caching, SEO

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- App Router tổ chức route theo `app/`, hỗ trợ nested layouts, Server Components mặc định, loading/error boundaries và route handlers.
- SSR/dynamic rendering tạo response theo request; static generation tạo trước; ISR revalidate nội dung theo policy. RSC là component/data model, không phải một rendering mode thay thế mọi mode.
- Caching ở Next.js có nhiều lớp (request/data/full route/client router); defaults đổi theo version, nên khai báo policy và kiểm tra docs đúng version.
- `'use client'` tạo client boundary; giữ data access/secrets ở server và chỉ truyền serializable props cần thiết.
- SEO cần metadata đúng route, canonical/robots, status code và nội dung HTML phù hợp; performance cần đo Core Web Vitals thật.

## 2. Khái niệm cốt lõi

App Router dùng filesystem routing: `page` tạo route, `layout` chia sẻ UI/state theo segment, `loading` tạo Suspense fallback, `error` tạo error boundary client, `not-found` xử lý resource không tồn tại. Route Handlers cung cấp HTTP endpoints trong app. Server Components là mặc định ở App Router; Client Components cần directive và có bundle/hydration cost.

Rendering mode được quyết định bởi data/request dependencies, route config và framework version. Static generation phù hợp nội dung ổn định; SSR/dynamic phù hợp dữ liệu cá nhân/request-specific; ISR revalidate static data sau interval hoặc trigger. Explicit `fetch` cache/revalidate policy làm intent rõ hơn. Next.js version mới đã thay đổi caching defaults qua nhiều release; không sao chép assumptions cũ mà phải xác nhận docs/runtime của project.

Data cache, full route cache, router cache và browser/CDN cache là lớp khác nhau. Invalidation (`revalidateTag`, `revalidatePath` tùy version) cần gắn vào mutation ownership; cache key phải phân biệt auth/tenant khi dữ liệu cá nhân. Server-side fetch có thể không dùng browser cache semantics. Streaming/Suspense gửi shell và phần data sẵn có trước, nhưng boundary UX và error behavior cần thiết kế.

## 3. Code ví dụ

Server Component page với params dạng Promise (App Router hiện đại) và fetch policy rõ ràng; URL/API phụ thuộc app.

```tsx
type Product = { id: string; name: string };

export default async function ProductPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const response = await fetch(`https://api.example.test/products/${id}`, {
		next: { revalidate: 60 },
	});
	if (!response.ok) throw new Error('Unable to load product');

	const product = (await response.json()) as Product;
	return <h1>{product.name}</h1>;
}
```

Ở production, validate response schema thay vì chỉ assertion, handle not-found/status theo UX và dùng server-side credential an toàn. Với user-specific data, không dùng shared cache trừ khi cache key/isolation được bảo đảm.

## 4. Trade-off & Best practices

- Chọn static/ISR cho public content cần scale/CDN; dynamic rendering cho personalized/fresh data với chi phí server latency.
- Đặt `'use client'` tại component cần interactivity, truyền data tối thiểu và giữ secret/query access server-side.
- Khai báo `cache`/`revalidate` policy tường minh; test invalidation sau mutation và kiểm tra cache scope/version.
- Dùng nested layouts để giữ UI persistent; boundary placement ảnh hưởng loading, error recovery và navigation state.
- Tối ưu waterfall bằng parallel data fetching nơi độc lập, streaming khi UX có thể hiển thị partial content.
- Tạo metadata per route, canonical URLs, sitemap/robots và status codes đúng; không render nội dung SEO quan trọng chỉ sau client fetch nếu cần crawlability.
- Kiểm tra bundle, hydration, image/font optimization và Core Web Vitals trên deployed build/CDN.

## 5. Lỗi thường gặp / Pitfalls

- Dùng caching assumptions của Next.js version khác với project hiện tại.
- Cache dữ liệu cá nhân như shared public data, gây cross-user disclosure.
- Gắn `'use client'` ở layout/root khiến bundle nặng và mất server-only benefits.
- Dùng server component để import browser API hoặc hook state/effect.
- Fetch cùng data tuần tự dù requests độc lập, tạo server waterfall.
- Nhầm `generateStaticParams`/ISR với real-time data; stale window phải phù hợp product semantics.
- Assertion `as Product` mà không validate API response runtime.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. RSC khác SSR/SSG thế nào?</b></summary>

RSC là component execution/payload model; SSR tạo HTML per request và SSG pre-render HTML. Một app có thể kết hợp Server Components với static/streamed/dynamic rendering.

</details>

<details>
<summary><b>Q2. ISR phù hợp khi nào?</b></summary>

Public content có thể stale trong một khoảng cho phép nhưng cần cập nhật mà không rebuild toàn site. Chọn revalidation và invalidation theo freshness requirement.

</details>

<details>
<summary><b>Q3. Những lớp cache chính cần phân biệt?</b></summary>

Request/data cache, route output cache, router/client cache, CDN/browser cache. Mỗi lớp có key, TTL và invalidation semantics riêng.

</details>

<details>
<summary><b>Q4. Vì sao version-specific docs quan trọng?</b></summary>

Next.js thay đổi default cache/rendering behavior giữa releases. Config đúng ở version cũ có thể tạo freshness/performance/security issues ở version mới.

</details>

<details>
<summary><b>Q5. Khi nào đặt Client Component boundary?</b></summary>

Tại subtree cần state/effects/browser APIs/event handlers. Boundary càng cao thì càng nhiều modules/JS phải gửi xuống client.

</details>

<details>
<summary><b>Q6. Caching dữ liệu user cần lưu ý gì?</b></summary>

Không để response chia sẻ giữa users/tenants. Dùng cache policy/key isolation đúng và tránh cache credential/private data ở layer công khai.

</details>

## 7. Ứng dụng vào CV

- Chuyển **[N]** public routes sang static/ISR và streaming boundaries, cải thiện LCP **[A]%** và giảm origin requests **[B]%**.
- Thiết kế user-scoped cache/invalidation sau mutation, giảm stale-data incidents **[A]%** mà không ảnh hưởng tenant isolation.

## 8. Tài liệu tham khảo

- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js: Caching](https://nextjs.org/docs/app/deep-dive/caching)
- [Google Search Central: SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
