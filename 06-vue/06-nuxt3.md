# Nuxt 3: SSR, rendering modes, data fetching

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Nuxt 3 xây trên Vue/Nitro, cung cấp file-based routing, SSR/SSG/hybrid rendering, server routes và auto-import conventions.
- `useFetch`/`useAsyncData` tích hợp data fetching với SSR payload/hydration để hạn chế request trùng khi client hydrate.
- Rendering mode nên chọn theo route/content freshness: prerender public content, SSR personalized/dynamic, hybrid qua route rules.
- Server/client boundary ảnh hưởng secrets, browser APIs và serialization; không đưa server credential vào payload/client bundle.
- Cache, ISR/SWR và route rules cần khai báo theo phiên bản/runtime/deployment adapter, test cùng CDN/platform thật.

## 2. Khái niệm cốt lõi

Nuxt file-based routing dùng `pages/`, layouts và middleware; Nitro xây server output/adapters và hỗ trợ server API routes trong `server/api`. Universal rendering chạy page code server để tạo HTML rồi hydrate trên browser; SPA/client-only rendering giảm server rendering nhưng ảnh hưởng initial content/SEO. Prerender (`nuxi generate`) tạo static output, hợp content ổn định; hybrid cho phép route rules khác nhau.

`useFetch`/`useAsyncData` tạo async data state (`data`, `pending`, `error`, `refresh`) và serialize kết quả cần thiết vào payload để hydration không fetch lại không cần thiết. `useAsyncData` phù hợp arbitrary async function; key xác định data instance/cache identity. Fetch wrapper có thể share server credentials, nhưng phải kiểm soát forwarding headers/cookies để không leak request context. `server/api` code chạy server; composables/pages có thể universal nên chỉ truy cập browser APIs trong client lifecycle.

SSR yêu cầu output server/client tương thích để hydration. Non-deterministic values (Date/random/locale) hoặc browser-only conditional markup có thể mismatch. Route rules có thể chọn prerender, SSR, cache/SWR theo adapter; semantics không hoàn toàn giống nhau trên mọi host. Nitro deployment target ảnh hưởng filesystem, streaming, edge APIs và persistent state.

## 3. Code ví dụ

Nuxt page lấy route param và dữ liệu bằng `useAsyncData`; API response cần validate khi data boundary không tin cậy.

```vue
<script setup lang="ts">
const route = useRoute()
const productId = computed(() => String(route.params.id))

const { data: product, pending, error } = await useAsyncData(
	() => `product:${productId.value}`,
	() => $fetch(`/api/products/${encodeURIComponent(productId.value)}`),
)
</script>

<template>
	<p v-if="pending">Loading…</p>
	<p v-else-if="error">Unable to load product.</p>
	<h1 v-else>{{ product?.name }}</h1>
</template>
```

Key factory giúp phân biệt data theo route ID; với route changes Nuxt có thể refetch theo key/source. Không serialize secret hoặc raw upstream payload thừa vào page payload.

## 4. Trade-off & Best practices

- Prerender public/static pages; SSR cho personalized/fresh content; route rules chọn hybrid theo route và hosting support.
- Dùng `useFetch` cho HTTP endpoint và `useAsyncData` cho async logic; stable unique keys cho parallel instances.
- Tách server-only modules/secrets, validate inputs ở server route và authorize từng request.
- Dùng Nuxt payload/hydration-aware composables thay `onMounted(fetch)` cho data cần SSR/initial HTML.
- Cache public responses có TTL/SWR; không cache user-specific responses công khai. Test cache invalidation sau mutation.
- Xử lý loading/error/empty states và cancellation/stale routes; không chỉ trả `null` khi fetch fail.
- Kiểm tra output trên adapter production, headers/proxy, cold starts, streaming và URL base path.

## 5. Lỗi thường gặp / Pitfalls

- Gọi `window`/`localStorage` trong code chạy server.
- Dùng `$fetch` tùy tiện trong mounted hook gây request duplicate sau hydration.
- `useAsyncData` key static cho data phụ thuộc route/user, trả nhầm cache entry.
- Serialize API tokens/private data vào payload có thể tải về browser.
- Coi `routeRules` cache semantics giống nhau trên Node server, static hosting và edge adapter.
- Hydration mismatch do Date/locale/random hoặc auth-dependent markup không đồng bộ.
- Gọi `useFetch` nhiều lần với option/key không rõ ownership, gây cache collision hoặc duplicate requests.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Nuxt universal rendering hoạt động thế nào?</b></summary>

Page render trên server thành HTML/payload; client nhận kết quả rồi hydrate event/reactivity. Cần giữ server/client output nhất quán.

</details>

<details>
<summary><b>Q2. `useFetch` khác gọi `$fetch` trực tiếp?</b></summary>

`useFetch` tích hợp async state, SSR payload và hydration semantics; `$fetch` là request utility. Trong component SSR, gọi `$fetch` tùy tiện có thể fetch lại khi hydrate.

</details>

<details>
<summary><b>Q3. Khi nào prerender thay SSR?</b></summary>

Khi content có thể tạo lúc build và freshness/cá nhân hóa không yêu cầu server render mỗi request. Static output giảm server cost, đổi lại cần rebuild/revalidation strategy.

</details>

<details>
<summary><b>Q4. Nuxt server routes có tự authorize?</b></summary>

Không. Mỗi API route phải authenticate/authorize và validate input; UI route middleware chỉ là UX/navigation guard.

</details>

<details>
<summary><b>Q5. Nguyên nhân hydration mismatch phổ biến?</b></summary>

Server/client khác dữ liệu/time/locale, browser-only branches hoặc random values. Đưa dữ liệu deterministic qua payload và defer browser-only UI đến client boundary.

</details>

## 7. Ứng dụng vào CV

- Chuyển **[N]** routes sang hybrid prerender/SSR theo freshness requirements, giảm TTFB **[A]%** và origin compute **[B]%**.
- Chuẩn hóa `useAsyncData` keys, payload validation và server authorization, giảm duplicate API calls **[A]%** và hydration errors **[B]%**.

## 8. Tài liệu tham khảo

- [Nuxt 3: Rendering Modes](https://nuxt.com/docs/3.x/guide/concepts/rendering)
- [Nuxt 3: Data Fetching](https://nuxt.com/docs/3.x/getting-started/data-fetching)
- [Nuxt 3: Route Rules](https://nuxt.com/docs/3.x/guide/concepts/rendering#hybrid-rendering)
- [Nuxt 3: Server Directory](https://nuxt.com/docs/3.x/guide/directory-structure/server)
