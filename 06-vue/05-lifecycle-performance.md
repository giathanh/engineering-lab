# Lifecycle, virtual DOM, compiler optimization, performance

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Vue lifecycle hooks gắn setup/mount/update/unmount của component với DOM/render lifecycle; cleanup subscriptions/timers khi unmount.
- Virtual DOM mô tả output; Vue compiler phân tích template để hoist static nodes, patch dynamic regions và generate efficient render functions.
- Reactivity scheduler batch updates; DOM sau state mutation cần `nextTick()` nếu đọc ngay trong cùng call stack.
- Stable props/keys, computed derivation và list virtualization thường có tác động lớn hơn micro-optimization template.
- Đo production build và browser performance; không giả định component rerender tương đương full DOM repaint.

## 2. Khái niệm cốt lõi

Lifecycle chính gồm setup, beforeMount/mounted, beforeUpdate/updated, beforeUnmount/unmounted; Composition API expose tương ứng `onMounted`, `onUpdated`, `onUnmounted`. `setup` chạy mỗi instance trước mount; `onMounted` DOM hiện diện nhưng không đồng nghĩa toàn bộ async child/Suspense đã hoàn tất. `onUnmounted` là nơi dọn timers, event listeners, observers và subscriptions.

Vue template compiler biết phần nào static/dynamic. Static hoisting tạo node reuse; patch flags mô tả dynamic properties cần update; block tree theo dõi dynamic children để tránh diff toàn subtree. Runtime vẫn cần virtual DOM và diff cho dynamic behavior. Compiler macros (`v-once`, `v-memo`) có thể skip work khi assumptions đúng, nhưng memo condition sai sẽ làm UI stale.

State update được scheduler batch; DOM patch xảy ra sau synchronous code. `await nextTick()` chờ DOM update flush trước khi đo geometry/focus. Lifecycle `updated` không nên mutate state liên tục vì có thể tạo update loop. `KeepAlive` cache component instance và có activated/deactivated lifecycle; unmount cleanup không chạy khi chỉ deactivated.

## 3. Code ví dụ

Component tạo observer sau mount và cleanup lúc unmount. `nextTick` bảo đảm DOM đã reflect state trước khi focus.

```vue
<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

const ready = ref(false)
const target = ref<HTMLElement | null>(null)
let observer: ResizeObserver | undefined

onMounted(() => {
	if (target.value) observer = new ResizeObserver(() => console.log('resized'))
	if (target.value) observer?.observe(target.value)
})

async function showAndFocus() {
	ready.value = true
	await nextTick()
	target.value?.focus()
}

onUnmounted(() => observer?.disconnect())
</script>

<template>
	<button @click="showAndFocus">Show</button>
	<input v-if="ready" ref="target" />
</template>
```

## 4. Trade-off & Best practices

- Dùng `onMounted` cho browser-only APIs; SSR setup không có `window/document`, cần guard hoặc client-only boundary.
- Dọn mọi external resources trong `onUnmounted`; với `KeepAlive`, xử lý `onActivated`/`onDeactivated` nếu resource phải pause/resume.
- Dùng computed cho derived values, stable keys cho lists và giữ props ổn định để tránh unnecessary child updates.
- Dùng `nextTick` chỉ khi thật sự cần DOM đã update; không chèn await sau mỗi state mutation.
- Virtualize large collections; compiler hoisting không xóa cost của hàng nghìn DOM nodes.
- Dùng `v-once` cho content bất biến; `v-memo` chỉ khi dependency list đầy đủ và đã profile.
- Đo Vue Devtools performance, browser flame chart, layout/paint và memory trên production build.
- Đo Vue Devtools performance, browser flame chart, layout/paint và memory trên production build.
- Component virtualization cần preserve keyboard focus khi item unmount/remount; test screen reader labels, scroll restoration và dynamic row heights. Với virtual list, cache measurement có thể thành stale sau font/viewport changes nên cần invalidation strategy.

## 5. Lỗi thường gặp / Pitfalls

- Truy cập DOM trong setup/SSR trước mount.
- Dùng `onUpdated` mutate state phụ thuộc chính render, tạo vòng lặp.
- Quên cleanup observer/timer/listener khi unmount hoặc deactivated cached component.
- Đọc DOM ngay sau state mutation mà chưa `nextTick`.
- Dùng `v-once`/`v-memo` trong subtree có dependency thay đổi.
- Dùng key index khi list reorder khiến component state reuse sai.
- Kỳ vọng compiler optimization thay thế kiến trúc list/windowing hoặc network/data optimization.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Khi nào DOM update hoàn tất sau đổi ref?</b></summary>

Vue batch update qua scheduler; `nextTick()` đợi flush kế tiếp trước khi đọc DOM đã cập nhật.

</details>

<details>
<summary><b>Q2. Vue compiler tối ưu template thế nào?</b></summary>

Hoist static nodes, đánh dấu dynamic props bằng patch flags và tạo block tree để runtime chỉ diff vùng thay đổi.

</details>

<details>
<summary><b>Q3. `onUnmounted` có luôn chạy khi route ẩn?</b></summary>

Không nếu component được cache/deactivate bởi KeepAlive; dùng activated/deactivated hooks cho lifecycle đó.

</details>

<details>
<summary><b>Q4. Khi nào dùng `v-memo`?</b></summary>

Khi profiler chỉ ra subtree render lặp đắt và dependency memo có thể liệt kê đầy đủ. Điều kiện thiếu có thể giữ UI stale.

</details>

<details>
<summary><b>Q5. Vì sao list virtualization vẫn cần?</b></summary>

Compiler tối ưu diff nhưng không loại bỏ DOM/layout/accessibility cost của quá nhiều nodes. Virtualization giới hạn số items mounted.

</details>

## 7. Ứng dụng vào CV

- Cleanup lifecycle cho **[N]** observers/subscriptions và tối ưu dynamic lists, giảm memory growth **[A]%** và update latency **[B]%**.
- Dùng Vue compiler/profiler evidence để giảm component update work **[A]%** trên **[screen]** mà vẫn giữ interaction behavior.

## 8. Tài liệu tham khảo

- [Vue: Lifecycle Hooks](https://vuejs.org/guide/essentials/lifecycle.html)
- [Vue: Rendering Mechanism](https://vuejs.org/guide/extras/rendering-mechanism.html)
- [Vue: `nextTick`](https://vuejs.org/api/general.html#nexttick)
- [Vue: Performance](https://vuejs.org/guide/best-practices/performance.html)

