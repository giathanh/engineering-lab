# Component communication: props/emit, provide/inject, slots, v-model

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~8 phút

## 1. Tóm tắt nhanh (TL;DR)

- Props truyền dữ liệu parent-to-child; child không mutate props mà emit event để parent sở hữu update.
- `v-model` là convention cho prop và update event; component có thể expose nhiều models với tên rõ.
- Slots cho parent điều khiển markup trong layout/behavior do child cung cấp; scoped slots truyền data ngược lên render scope.
- Provide/inject truyền dependency qua cây sâu, hữu ích cho plugin/form/tree components; cần typed keys và tránh hidden global state.
- Chọn communication channel theo ownership và coupling, không dùng global store cho mọi parent-child interaction.

## 2. Khái niệm cốt lõi

Props là input contract một chiều. Child nhận giá trị, có thể validate type/default, nhưng không nên mutate object prop để cập nhật parent; object vẫn là reference nên nested mutation kỹ thuật có thể xảy ra nhưng phá ownership và gây side effects khó trace. Emit event mô tả intent/fact để parent quyết định state transition. Event names/API cần ổn định và có payload semantics.

`v-model` compile thành prop + `update:propName` event; mặc định `modelValue`/`update:modelValue`. `defineModel()` trong Vue 3.4+ hỗ trợ syntax tiện lợi trong `<script setup>`, nhưng vẫn là two-way binding contract qua parent. Multiple models như `v-model:title` cần tránh API quá nhiều implicit update paths. Model modifiers có thể transform values.

Slots cho phép parent truyền template vào child. Default/named slots định nghĩa composition points; scoped slots cho child expose data (ví dụ row renderer) mà parent định nghĩa presentation. Provide/inject truyền data/capability theo ancestor-descendant tree, tránh prop drilling qua nhiều layers; coupling trở nên implicit nên dùng InjectionKey Symbol + TypeScript và scope rõ.

## 3. Code ví dụ

Child custom input nhận `modelValue` và emit update, không tự sở hữu canonical text.

```vue
<!-- SearchInput.vue -->
<script setup lang="ts">
defineProps<{ modelValue: string; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
	<label>
		{{ label }}
		<input :value="modelValue" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)">
	</label>
</template>
```

Parent dùng `<SearchInput v-model="query" label="Search" />`; `query` vẫn thuộc parent. Production component nên forward attrs/focus/error/disabled contracts rõ.

## 4. Trade-off & Best practices

- Dùng props/emits cho quan hệ gần và explicit; dùng provide/inject khi nhiều tầng trung gian không cần hiểu dữ liệu.
- Slots phù hợp custom rendering; giữ slots API có chủ đích để consumer không phụ thuộc mọi internals.
- Dùng `v-model` cho state editable có owner rõ; emit event có tên domain như `selected` khi action không phải generic value update.
- Typed `InjectionKey<T>` giúp compile-time contract và Symbol tránh collision; xử lý trường hợp inject thiếu bằng default/throw rõ.
- Không mutate nested prop; nếu cần draft editing, copy vào local state có sync/reset policy tường minh.
- Accessibility/semantic HTML vẫn thuộc trách nhiệm component contract; expose label/description/keyboard behavior.
- Với high-frequency cross-tree state, cân nhắc Pinia/external store thay provide mutable object không có lifecycle.
- Khi thiết kế component library, version props/events cùng accessibility behavior và document whether events fire before/after internal state changes. Consumer tests nên xác nhận public contract để implementation có thể refactor an toàn.

## 5. Lỗi thường gặp / Pitfalls

- Mutate props trực tiếp rồi khó xác định ai là owner.
- Emit event nhưng payload không stable hoặc không validate, tạo coupling theo implementation.
- Dùng provide/inject để chuyển mọi state thành hidden global-like dependency.
- Dùng slot không có fallback và khiến component mất semantics/accessibility.
- `v-model` tạo feedback loop giữa parent/child watchers hoặc normalize value không idempotent.
- Destructure inject/store object làm mất reactivity hoặc replace semantics.
- Tạo local editable copy nhưng không xử lý prop changes/reset, khiến UI stale.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Vì sao props one-way?</b></summary>

Một chiều tạo rõ ownership/data flow: parent sở hữu state, child emit intent. Nó giảm mutation ẩn và giúp debug state transitions.

</details>

<details>
<summary><b>Q2. `v-model` thực chất là gì?</b></summary>

Convention prop + `update:*` event; child đề nghị giá trị mới, parent cập nhật canonical state. Nó không xóa ownership boundary.

</details>

<details>
<summary><b>Q3. Khi nào dùng slots?</b></summary>

Khi child quản lý layout/behavior nhưng consumer cần customize rendered content. Scoped slots cung cấp child data để parent render.

</details>

<details>
<summary><b>Q4. Provide/inject trade-off gì?</b></summary>

Tránh prop drilling, nhưng dependency trở nên implicit và gắn cây component. Typed keys, narrow scope và defaults làm contract rõ hơn.

</details>

<details>
<summary><b>Q5. Child cần chỉnh prop phức tạp thì làm sao?</b></summary>

Emit updates nếu controlled; hoặc tạo local draft với policy rõ khi prop đổi/submit/cancel. Không mutate prop object lén lút.

</details>

## 7. Ứng dụng vào CV

- Chuẩn hóa props/events/v-model cho **[N]** form controls, giảm state ownership bugs **[A]%** và tăng reuse trên **[B] product flows**.
- Thay prop drilling bằng typed provide/inject boundary cho **[component tree]**, giảm coupling intermediate components **[A]%**.

## 8. Tài liệu tham khảo

- [Vue: Props](https://vuejs.org/guide/components/props.html)
- [Vue: Events](https://vuejs.org/guide/components/events.html)
- [Vue: Component v-model](https://vuejs.org/guide/components/v-model.html)
- [Vue: Provide / Inject](https://vuejs.org/guide/components/provide-inject.html)

