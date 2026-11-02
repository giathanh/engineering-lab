# Pinia & state management, Vue Router (guards, lazy loading)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Pinia store gom shared client state, actions và derived getters; state vẫn reactive và cần được destructure đúng cách.
- Dùng `storeToRefs()` cho state/getters khi destructure; actions có thể lấy trực tiếp từ store.
- Router guards điều khiển navigation/auth flow, nhưng authorization phải được enforce ở server/API.
- Lazy route components giảm initial bundle; route params/query cần validate và không chứa secret.
- Tách server/cache state khỏi UI state; Pinia không tự cung cấp query cache invalidation semantics như data-fetching library.

## 2. Khái niệm cốt lõi

Pinia store có state, getters và actions. Store instance được tạo qua `defineStore` và gắn vào Pinia app; SSR cần tạo Pinia instance per request để tránh shared mutable state giữa users. Plugins có thể thêm persistence/devtools, nhưng persisted state cần schema version, hydration ordering và security review. Store nên đại diện cohesive domain state, không phải một global junk drawer.

Destructure trực tiếp `const { count } = store` lấy snapshot value và có thể mất reactivity. `storeToRefs(store)` trả refs cho state/getters; methods/actions destructure trực tiếp được. `mapState`/`mapActions` helpers hữu ích trong Options API. Actions là nơi thực hiện state transitions/async logic; side effects cần loading/error/cancellation semantics.

Vue Router quản lý route records, nested layouts, params/query, history mode và navigation guards. Global `beforeEach`, per-route `beforeEnter`, component guards xử lý UX/navigation policy. Guards có thể redirect/cancel navigation; không thay backend authorization. Lazy route component `() => import(...)` chia chunk. `meta` route chứa policy hints nhưng client metadata không phải security boundary.

## 3. Code ví dụ

Pinia store và component destructure state reactive an toàn.

```ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useCartStore = defineStore('cart', () => {
	const items = ref<{ id: string; quantity: number }[]>([])
	const totalItems = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
	function add(id: string) {
		const item = items.value.find((entry) => entry.id === id)
		if (item) item.quantity++
		else items.value.push({ id, quantity: 1 })
	}
	return { items, totalItems, add }
})
```

Trong component: `const cart = useCartStore(); const { items, totalItems } = storeToRefs(cart); const { add } = cart`. Đảm bảo Pinia được cài trên app trước khi gọi store.

## 4. Trade-off & Best practices

- Đưa state vào Pinia khi nhiều routes/components cùng cần hoặc cần centralized transitions; local state đủ cho component-local concerns.
- Giữ actions có tên domain, validate inputs và tránh logic side effect ẩn trong getters.
- Trong SSR, tạo store per app/request và serialize/hydrate state an toàn; tránh singleton module shared across requests.
- Router guards chỉ phục vụ navigation UX; server phải kiểm tra authorization cho mọi protected resource.
- Dùng lazy routes theo route boundaries; preload routes thường dùng khi metrics cho thấy lợi ích.
- Normalize query params và giữ filter/search state trong URL nếu cần deep-link/back-forward behavior.
- Quản lý async navigation/data loading, cancellation, stale route responses và error route UI.
- Quản lý async navigation/data loading, cancellation, stale route responses và error route UI.
- Nếu store persist vào storage, hydrate trước các routes phụ thuộc state nhưng không để hydration chặn public routes không cần auth. Version persisted schema và có fallback khi dữ liệu client cũ không parse được.

## 5. Lỗi thường gặp / Pitfalls

- Destructure Pinia state trực tiếp, mất reactivity.
- Dùng store như nơi chứa mọi dữ liệu, trộn server cache, form draft và transient UI state.
- Pinia singleton dùng chung SSR requests gây data leakage.
- Nghĩ guard `requiresAuth` bảo vệ API/backend.
- Lưu access token/secret vào persisted Pinia state mà không threat-model.
- Route lazy import sai path/chunk failure không có error handling/retry UX.
- Không validate route params trước khi gọi API hoặc dùng chúng làm trusted IDs.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Vì sao dùng `storeToRefs`?</b></summary>

Để destructure state/getters mà vẫn giữ ref/reactivity. Actions có thể lấy trực tiếp vì function không cần wrap thành ref.

</details>

<details>
<summary><b>Q2. Pinia có thay server-state library không?</b></summary>

Pinia quản lý shared client state; server data cần stale/cache/refetch/invalidation/retry semantics có thể cần query library hoặc layer riêng.

</details>

<details>
<summary><b>Q3. Navigation guard có đủ authorization không?</b></summary>

Không. Guard chạy ở client và có thể bypass; backend phải authorize mỗi operation/resource.

</details>

<details>
<summary><b>Q4. Pinia SSR cần chú ý gì?</b></summary>

Tạo Pinia instance per request, không reuse mutable singleton; serialize/hydrate state chống injection và đảm bảo data isolation.

</details>

<details>
<summary><b>Q5. Khi nào đưa filter vào URL?</b></summary>

Khi cần shareable/deep-linkable state và back/forward navigation. Cần parse/validate query, canonicalize và tránh nhét sensitive data.

</details>

## 7. Ứng dụng vào CV

- Chuẩn hóa domain stores và SSR isolation cho **[N]** Vue routes, giảm duplicate state bugs **[A]%**.
- Tối ưu route lazy loading và URL-driven filters, giảm initial bundle **[A]%** và cải thiện navigation completion **[B]%**.

## 8. Tài liệu tham khảo

- [Pinia: Core Concepts](https://pinia.vuejs.org/core-concepts/)
- [Pinia: SSR](https://pinia.vuejs.org/ssr/)
- [Vue Router: Navigation Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html)
- [Vue Router: Lazy Loading Routes](https://router.vuejs.org/guide/advanced/lazy-loading.html)
