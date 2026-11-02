# Composition API vs Options API, composables

> Mức độ: ⭐⭐ trung bình | Thời gian đọc: ~8 phút

## 1. Tóm tắt nhanh (TL;DR)

- Options API tổ chức component theo `data`, `computed`, `methods`, lifecycle hooks; dễ định hướng với component nhỏ và người mới.
- Composition API tổ chức logic theo concern trong `setup`/`<script setup>`, tăng reuse qua composables và type inference tốt.
- Cả hai dùng chung Vue reactivity/runtime; Composition API không mặc định nhanh hơn Options API.
- Composable là function tạo/sử dụng reactive state/effects; mỗi call thường có state instance riêng trừ khi module intentionally singleton.
- Chọn API theo component complexity, team convention và reuse; có thể trộn ở migration nhưng tránh trùng ownership.

## 2. Khái niệm cốt lõi

Options API đặt lifecycle/method/computed/data ở các sections khác nhau. Component đơn giản dễ scan, nhưng logic của một concern có thể bị tách giữa options; mixins từng giải quyết reuse nhưng gây implicit name collisions, dependencies khó discover và merge order khó hiểu.

Composition API cung cấp `setup()`/`<script setup>` để viết logic JavaScript/TypeScript trực tiếp với refs, computed, watchers và lifecycle hooks. Có thể group theo concern (search, pagination, subscription) rồi extract thành composables. `setup` chạy một lần mỗi component instance; render vẫn chạy theo updates. `<script setup>` compiler sugar giúp expose bindings cho template và type inference.

Composable convention đặt tên `useX`, trả object có refs/functions để consumer destructure mà giữ reactivity. Nó không phải global store mặc định: mỗi call tạo state/side effects riêng. Nếu cần chia sẻ state, dùng module-level singleton có lifecycle rõ, provide/inject, Pinia hoặc external store. SSR cần tránh module singleton mutable data giữa requests.

## 3. Code ví dụ

Composable quản lý search query và kết quả, cleanup request khi query đổi/unmount.

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

function useSearch() {
	const query = ref('')
	const results = ref<string[]>([])

	watch(query, async (value, _oldValue, onCleanup) => {
		const controller = new AbortController()
		onCleanup(() => controller.abort())
		if (!value.trim()) { results.value = []; return }
		const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`, { signal: controller.signal })
		results.value = await response.json() as string[]
	})

	return { query, results }
}

const { query, results } = useSearch()
</script>
```

Production code should validate response shape and handle network errors; composable owns cancellation but application decides error UI.

## 4. Trade-off & Best practices

- Options API hợp component đơn giản, convention-driven team; Composition API hợp logic nhiều concern, TypeScript nặng và reusable behavior.
- Extract composable khi có behavior cohesive/reuse; không tách mọi vài dòng thành function để tránh indirection.
- Composable nên expose minimal refs/actions và document side effects, ownership, SSR constraints.
- Trả refs khi caller cần destructure; trả plain object derived values có thể làm người dùng nhầm mất reactivity.
- Dùng lifecycle hooks trong setup context; composable nên được gọi đồng bộ trong setup để Vue associate cleanup với instance.
- Với shared cross-component state, chọn Pinia/provide/inject theo scope; không biến module singleton thành global mutable state tùy tiện.
- Migration có thể incrementally chuyển mixins sang composables; giữ public props/events contract ổn định.
- Migration có thể incrementally chuyển mixins sang composables; giữ public props/events contract ổn định.
- Khi review composable, kiểm tra nó có side effect lúc gọi hay chỉ expose command; call order và lifecycle ownership nên thể hiện rõ. Với SSR, mọi mutable state theo user phải thuộc request/app instance, không module singleton.

## 5. Lỗi thường gặp / Pitfalls

- Nghĩ Composition API thay đổi reactivity engine hoặc luôn nhanh hơn Options API.
- Destructure plain values khỏi composable rồi mất reactivity.
- Gọi composable trong async callback sau khi setup context không còn active, khiến lifecycle cleanup không được gắn đúng.
- Tạo module-level mutable refs trong SSR, làm state user này rò sang request user khác.
- Chuyển mixin thành composable nhưng giữ hidden global dependencies/name coupling.
- Dùng một composable duy nhất chứa API, cache, UI state và side effects không cùng responsibility.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Composition API giải quyết hạn chế nào của Options API?</b></summary>

Cho group logic theo concern và reuse bằng composables, cải thiện TypeScript inference; không thay đổi runtime reactivity model.

</details>

<details>
<summary><b>Q2. Mỗi lần gọi composable có share state?</b></summary>

Thông thường không; mỗi call tạo refs/effects riêng. Shared module-level state, Pinia hoặc provide/inject cần được thiết kế riêng.

</details>

<details>
<summary><b>Q3. Composable khác mixin thế nào?</b></summary>

Composable là function explicit trả API, dependencies được truyền/nhìn thấy và không merge tên vào component scope như mixin.

</details>

<details>
<summary><b>Q4. Vì sao trả refs từ composable?</b></summary>

Consumer destructure vẫn giữ ref connection; trả plain primitive snapshot sẽ mất auto-update nếu không được wrapped.

</details>

<details>
<summary><b>Q5. Composable có cần gọi trong setup không?</b></summary>

Composable dùng lifecycle/watch cần được gọi khi component setup context active để Vue đăng ký cleanup đúng instance. Pure utility functions không có constraint đó.

</details>

## 7. Ứng dụng vào CV

- Chuyển **[N]** mixins thành composables explicit, giảm naming collisions **[A]%** và cải thiện type coverage lên **[B]%**.
- Tái sử dụng search/pagination composables trên **[N]** views, giảm duplicated async lifecycle code **[A]%**.

## 8. Tài liệu tham khảo

- [Vue: Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Vue: Composables](https://vuejs.org/guide/reusability/composables.html)
- [Vue: `<script setup>`](https://vuejs.org/api/sfc-script-setup.html)
