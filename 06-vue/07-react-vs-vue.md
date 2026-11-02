# So sánh React vs Vue (câu hỏi rất hay gặp)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- React là UI library xoay quanh JavaScript functions/elements và explicit state updates; Vue là progressive framework với template compiler và reactive proxy system.
- React thường re-run component functions để tính output; Vue track property dependencies và scheduler component effects, nhưng không framework nào tránh render cost nếu architecture kém.
- React ecosystem cho phép chọn router/state/data tools; Vue cung cấp conventions chính thức như Router/Pinia, giảm quyết định nhưng tăng ecosystem coupling.
- TypeScript, SSR, performance và accessibility đều khả thi ở cả hai; so sánh theo workload, team skill, migration path và operational needs.
- Không chọn bằng microbenchmark đơn lẻ; sản phẩm, bundle, developer experience và hiring/onboarding quan trọng hơn.

## 2. Khái niệm cốt lõi

React dùng JSX/JavaScript composition; state update làm component function render lại, reconciliation xác định host changes. Hooks đặt state/effects trong component identity và rules về thứ tự. Vue template compile thành render functions, Proxy reactivity track dependencies để scheduler cập nhật component/effect liên quan; Composition API cung cấp refs/computed/watch và composables.

Hai model có trade-offs. React explicit render model giúp behavior gần JavaScript và ecosystem rộng, nhưng stale closures, effect lifecycle và state ownership cần hiểu kỹ. Vue template/compiler tối ưu static/dynamic regions và reactivity ergonomics, nhưng refs/proxies/destructuring/auto-unwrapping cần nắm semantics. React Compiler nếu được bật có thể tự memo hóa một số patterns; Vue compiler tối ưu template nhưng không miễn phí cho DOM lớn.

React ecosystem thường chọn router, form, state/cache libraries theo nhu cầu; Next.js là framework full-stack phổ biến. Vue có Vue Router, Pinia và Nuxt tích hợp conventions. Điều này ảnh hưởng upgrade coordination, hiring, debugging và consistency. Cả hai hỗ trợ SSR/hydration, server/client boundaries (qua framework), code splitting, streaming/hybrid rendering theo ecosystem.

## 3. Code ví dụ

Cùng một derived full name thể hiện state model. React dùng render calculation; Vue dùng computed cached theo dependencies.

```jsx
// React
function Name({ first, last }) {
	const fullName = `${first} ${last}`;
	return <span>{fullName}</span>;
}
```

```vue
<!-- Vue -->
<script setup>
import { computed, ref } from 'vue'
const first = ref('Ada')
const last = ref('Lovelace')
const fullName = computed(() => `${first.value} ${last.value}`)
</script>
<template><span>{{ fullName }}</span></template>
```

Trong React, derived calculation chạy trong render và thường không cần effect/state; Vue computed cache khi dependency không đổi. Với phép tính rẻ, cả hai đều có thể giữ code đơn giản.

## 4. Trade-off & Best practices

- Chọn dựa trên team familiarity, existing codebase, hiring, package ecosystem, SSR/deployment strategy và product roadmap.
- Định nghĩa architecture conventions trước: routing, server-state, forms, component boundaries, error handling và testing.
- Benchmark production-like screens: input latency, bundle/network, list size, hydration và memory trên thiết bị mục tiêu.
- Trong React, giữ render pure, effect purposeful và state gần owner; trong Vue, hiểu proxy/ref identity, cleanup watchers và avoid deep watchers không cần.
- Dùng accessibility semantics và component testing giống nhau ở mọi framework; framework không tự bảo đảm accessible UI.
- Với migration, chuyển theo route/component boundary, giữ API contract và thiết lập interoperability thay big-bang rewrite.
- Cân nhắc framework full-stack (Next/Nuxt) cùng rendering/cache semantics, không chỉ compare client component API.

## 5. Lỗi thường gặp / Pitfalls

- Nói Vue “luôn nhanh hơn” vì fine-grained reactivity hoặc React “luôn linh hoạt hơn” mà không đo workload.
- So sánh framework core nhưng bỏ qua SSR framework/build tooling/hosting stack đang dùng.
- Chuyển framework để giải vấn đề organization/process hoặc database bottleneck.
- Mang mental model hooks sang Vue/refs hoặc proxy auto-unwrapping sang React, gây subtle bugs.
- Tái sử dụng component architecture cứng giữa framework khác nhau mà không xét conventions/accessibility.
- Viết benchmark synthetic bỏ qua bundle, hydration, network và developer workflow.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. React và Vue khác nhau cốt lõi ở reactivity model nào?</b></summary>

React component function reruns theo state/props update rồi reconcile; Vue Proxy tracks dependency reads và triggers effects/components liên quan. Cả hai vẫn cần thiết kế state/render tốt.

</details>

<details>
<summary><b>Q2. Vue computed tương đương `useMemo` không?</b></summary>

Cùng cache derived calculation theo dependencies ở mức khái niệm, nhưng dependency tracking và lifecycle semantics khác. Không thay thế trực tiếp trong mọi design.

</details>

<details>
<summary><b>Q3. Vì sao chọn framework không chỉ dựa performance?</b></summary>

Team expertise, ecosystem, hiring, migration, SSR/deployment, accessibility và maintenance cost ảnh hưởng tổng thể nhiều hơn microbenchmark.

</details>

<details>
<summary><b>Q4. Có thể migrate từng phần không?</b></summary>

Có, theo route/island/boundary nếu app shell và shared contracts được thiết kế. Cần đo bundle duplication và maintainability của hai runtime song song.

</details>

<details>
<summary><b>Q5. Reactivity framework có tự ngăn unnecessary work?</b></summary>

Không. React compiler/profiling hoặc Vue compiler/proxy dependency tracking chỉ tối ưu một phần; data flow, list size, DOM/layout và network vẫn quyết định UX.

</details>

## 7. Ứng dụng vào CV

- Đánh giá và chọn React/Vue stack theo **[criteria]**, giảm onboarding time **[A]%** và delivery lead time **[B]%** cho **[N]** engineers.
- Migrate **[N]** routes/components theo boundary strategy, giảm bundle/interaction latency **[A]%** mà không gián đoạn release.

## 8. Tài liệu tham khảo

- [React: Thinking in React](https://react.dev/learn/thinking-in-react)
- [Vue: Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [React Compiler](https://react.dev/learn/react-compiler)
- [Vue: Performance](https://vuejs.org/guide/best-practices/performance.html)
