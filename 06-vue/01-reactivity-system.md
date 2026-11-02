# Reactivity system Vue 3 (Proxy, ref vs reactive, computed, watch/watchEffect)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Vue 3 dùng Proxy để intercept get/set trên reactive objects, track dependencies khi effect chạy và trigger effect khi dependency đổi.
- `ref` bọc value qua `.value`, phù hợp primitive hoặc thay object; `reactive` tạo proxy cho object và nested values.
- `computed` là derived state lazy/cached theo dependencies; `watch` phản ứng có chọn lọc, `watchEffect` tự track dependencies đồng bộ khi chạy.
- Destructure property từ `reactive` có thể mất connection tới proxy; dùng `toRefs`/`toRef` khi cần giữ reactivity.
- Watcher cần cleanup cho async/resource side effects; dùng `flush` mode và deep watch có chủ đích vì có cost.

## 2. Khái niệm cốt lõi

Vue reactivity có dependency graph. Khi effect/template/computed đọc property, Proxy `get` track effect theo target/key; khi property mutate, `set` trigger các effect liên quan. Scheduler batch update để tránh DOM patch mỗi assignment. `ref` dùng getter/setter `.value` để track primitive/object reference; trong template, ref thường auto-unwrap, trong JS cần `.value`. `reactive` proxy object và nested object khi truy cập; identity proxy khác raw object, nên tránh trộn raw/proxy làm key hoặc mutate raw bypass tracking.

`computed` tạo effect lazy: chỉ evaluate khi đọc và dependency invalidated; cache kết quả đến lần đọc tiếp theo. Dùng computed cho pure derivation, không đặt side effect. `watch(source, callback)` track source tường minh, truyền old/new value và hỗ trợ `immediate`, `deep`, `flush`. `watchEffect` chạy ngay, auto-track những gì được đọc trong synchronous execution; dependencies sau `await` có thể không được track theo cùng cách vì tracking chỉ trong lúc effect sync chạy.

Vue 3.5 hỗ trợ destructure reactive props trong `<script setup>` được compiler biến đổi để giữ reactivity; điều này không đồng nghĩa mọi destructuring từ object `reactive()` tự reactive. `toRefs` tạo refs liên kết tới properties. `shallowRef`/`shallowReactive` giảm deep conversion cho large immutable structures/external objects, nhưng cần trigger/replace top-level rõ ràng. `markRaw`/`toRaw` dùng có chủ đích ở interop, không như performance default.

## 3. Code ví dụ

`computed` giữ full name derived; `watch` thực hiện side effect cụ thể khi query đổi và abort request cũ.

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const firstName = ref('Ada')
const lastName = ref('Lovelace')
const fullName = computed(() => `${firstName.value} ${lastName.value}`)
const query = ref('')

watch(query, async (value, _oldValue, onCleanup) => {
	const controller = new AbortController()
	onCleanup(() => controller.abort())
	if (!value.trim()) return
	try {
		const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`, { signal: controller.signal })
		if (!response.ok) throw new Error(`Search failed: ${response.status}`)
	} catch (error) {
		if (!controller.signal.aborted) console.error('Search failed', error)
	}
})
</script>
```

## 4. Trade-off & Best practices

- Dùng `ref` khi value thay toàn bộ hoặc là primitive; dùng `reactive` cho cohesive object state cần mutate nhiều property. Đừng chọn theo rule máy móc.
- Dùng computed cho derived values, watcher cho side effects/synchronization; không duplicate computed result thành state mutable.
- Chọn watch source tường minh khi chỉ một số dependency cần trigger; dùng `watchEffect` cho effect nhỏ, dependency tự nhiên và dễ thấy.
- Deep watch có thể traverse tree lớn và callback nhận cùng object reference cho nested mutations; ưu tiên watch field cụ thể hoặc immutable replacement.
- Chọn `flush: 'post'` khi cần DOM sau update; `flush: 'sync'` có thể bỏ batching và gây nhiều runs.
- Cleanup timers, subscriptions, fetches; tránh async stale writes bằng abort/token version.
- Dùng shallow APIs cho large immutable/external data khi measured, không bọc toàn bộ app trong `toRaw`/`markRaw`.

## 5. Lỗi thường gặp / Pitfalls

- Destructure `const { count } = reactiveState` rồi kỳ vọng `count` tự cập nhật.
- Dùng `reactive()` cho primitive hoặc quên `.value` trong script khi dùng ref.
- Đặt side effect trong computed getter khiến cache/scheduler semantics khó đoán.
- Deep-watch toàn bộ store chỉ để theo dõi một field.
- Tạo watcher trong async callback ngoài setup scope mà không tự stop, hoặc quên cleanup external resources. Watcher tạo đồng bộ trong setup thường được Vue tự stop khi unmount.
- So sánh raw object với proxy bằng identity rồi dùng làm key/Map key không nhất quán.
- Dùng `watchEffect` async và nghĩ dependencies sau await vẫn được auto-track như synchronous reads.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Proxy reactivity track và trigger thế nào?</b></summary>

Getter track active effect theo target/key; setter trigger các effect phụ thuộc khi value thay đổi. Scheduler batch effects và component updates.

</details>

<details>
<summary><b>Q2. `ref` khác `reactive`?</b></summary>

`ref` bọc một value qua `.value`, phù hợp primitive và reference replacement; `reactive` proxy object và properties. Template auto-unwrap refs theo context.

</details>

<details>
<summary><b>Q3. `computed` khác `watch`?</b></summary>

Computed là derived value lazy/cached; watch chạy callback side effect khi source đổi. Không dùng watch để tái tạo giá trị có thể derive trực tiếp.

</details>

<details>
<summary><b>Q4. Vì sao destructuring reactive object mất reactivity?</b></summary>

Destructure primitive property lấy giá trị hiện tại thành local binding, không còn đi qua proxy getter. `toRef`/`toRefs` giữ liên kết property.

</details>

<details>
<summary><b>Q5. Khi nào dùng shallowRef?</b></summary>

Khi giữ large immutable/external object mà chỉ top-level replacement cần trigger, giảm deep proxy overhead. Nested mutation không tự trigger.

</details>

## 7. Ứng dụng vào CV

- Tối ưu reactivity cho dataset **[N]** records bằng computed selectors và shallow boundaries, giảm update time **[A]%**.
- Chuẩn hóa watcher cleanup/cancellation cho **[N]** async search flows, loại bỏ stale results **[A]%**.

## 8. Tài liệu tham khảo

- [Vue 3: Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Vue 3: Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [Vue 3: Watchers](https://vuejs.org/guide/essentials/watchers.html)
- [Vue 3: Reactivity API](https://vuejs.org/api/reactivity-core.html)

