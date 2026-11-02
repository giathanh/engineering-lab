# Re-render & tối ưu hiệu năng (memo, profiler, code splitting, lazy, Suspense)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Re-render là React gọi component để tính output mới; không đồng nghĩa DOM update, browser layout hay repaint.
- Tìm bottleneck bằng React Profiler/browser Performance, tối ưu theo interaction/SLO thay vì thêm memoization đại trà.
- `memo`, `useMemo`, `useCallback` giảm work khi identity/props ổn định và có cost thật; React Compiler có thể tự memo hóa khi project bật compiler.
- Code splitting giảm tải ban đầu; `lazy`/Suspense cần loading/error boundaries và không giải quyết mọi data-fetching semantics.
- Tối ưu thường bắt đầu bằng state locality, list virtualization, giảm expensive calculations và bundle analysis.

## 2. Khái niệm cốt lõi

State update ở component thường làm component render lại; parent render cũng thường gọi child components trừ khi boundary/optimization ngăn. React reconcile output để quyết định host mutations. Component gọi lại không có nghĩa DOM thay đổi; DOM update cũng không đồng nghĩa layout toàn trang.

`React.memo` so sánh props (shallow by default) để có thể skip render khi props unchanged. Inline object/function tạo identity mới mỗi render nên có thể làm memo boundary mất tác dụng; nhưng giữ mọi function bằng `useCallback` cũng có overhead/complexity. `useMemo` cache calculation result khi dependencies bằng `Object.is`; correctness phải không phụ thuộc cache. React Compiler nếu được cấu hình có thể tự tối ưu một số patterns, nhưng vẫn cần render purity và profiling.

Code splitting chia bundle theo route/feature; `lazy(() => import(...))` tải component khi cần và Suspense boundary render fallback trong lúc chờ. Error boundary xử lý load/render failure. Prefetch/preload có thể giảm perceived latency nhưng tăng bandwidth/competition. Virtualization render subset visible items, giảm DOM/React work ở list lớn, đổi lại focus/accessibility/scroll measurement phức tạp.

## 3. Code ví dụ

Ví dụ lazy-load phần báo cáo chỉ khi route được dùng; đặt Suspense boundary gần vùng có fallback hợp lý.

```jsx
import { lazy, Suspense } from 'react';

const ReportsPage = lazy(() => import('./ReportsPage.js'));

export function ReportsRoute() {
	return (
		<Suspense fallback={<p role="status">Loading reports…</p>}>
			<ReportsPage />
		</Suspense>
	);
}
```

## 4. Trade-off & Best practices

- Profile production-like builds với interactions đại diện; development Strict Mode/DevTools có overhead và render behavior khác.
- Giữ state gần nơi dùng, tách context lớn thành state slices/selectors hoặc external store subscriptions khi measured fan-out cao.
- Dùng `memo` cho component render đắt hoặc props ổn định; tránh custom comparator sai khiến UI stale.
- Dùng `useMemo` cho calculation đo được hoặc stable identity cần thiết; đừng memo hóa primitive/cheap code theo thói quen.
- Chia bundle theo route/rare features, theo dõi bundle analyzer và tránh tạo quá nhiều chunks gây network waterfall.
- Đặt Suspense boundaries theo UX loading states; phối hợp Error Boundaries và retry strategy cho chunk load failure.
- Với list lớn, virtualization và pagination thường hiệu quả hơn chỉ memo từng row.

## 5. Lỗi thường gặp / Pitfalls

- Gọi mọi component invocation là DOM re-render hoặc browser repaint.
- Thêm `useCallback` khắp nơi mà child không memoized/consumer không cần identity.
- Dùng `memo` nhưng truyền object/function mới mỗi lần và ngạc nhiên vì không skip.
- Custom equality comparator bỏ qua prop quan trọng, tạo stale output/handler.
- Dùng lazy loading nhưng tạo spinner toàn trang kéo dài hoặc không có error boundary.
- Tối ưu interaction không đo bằng production build/profiler.
- React Compiler được bật nhưng code impure/side-effect render làm compiler không thể tối ưu an toàn.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Re-render có luôn cập nhật DOM?</b></summary>

Không. React gọi component và reconcile output; nếu host tree không đổi thì có thể không cần DOM mutation. Browser paint/layout là bước riêng.

</details>

<details>
<summary><b>Q2. Khi nào dùng `React.memo`?</b></summary>

Khi component render tốn kém, parent thường render nhưng props ổn định và Profiler cho thấy đáng tối ưu. Nó không phải semantic guarantee và custom compare có cost.

</details>

<details>
<summary><b>Q3. Suspense tự fetch mọi data không?</b></summary>

Suspense là coordination boundary cho nguồn suspend-compatible/framework integrations. Một Promise fetch tùy tiện trong effect không tự làm Suspense fallback hoạt động.

</details>

<details>
<summary><b>Q4. Code splitting ảnh hưởng gì ngoài bundle size?</b></summary>

Giảm initial bytes nhưng thêm request/chunk latency, cache invalidation và failure modes. Cần chunk theo route/feature và theo dõi waterfall.

</details>

<details>
<summary><b>Q5. Vì sao state locality cải thiện performance?</b></summary>

State update chỉ ảnh hưởng subtree sở hữu state gần đó, giảm render propagation và context fan-out mà không cần memo hóa mọi node.

</details>

## 7. Ứng dụng vào CV

- Profile và tối ưu **[screen]** bằng state locality, virtualization và lazy chunks, giảm interaction p95 từ **[A] ms xuống [B] ms**.
- Giảm initial JavaScript bundle **[A]%** bằng route-level splitting trong khi giữ route transition dưới **[B] ms** trên mạng mục tiêu.

## 8. Tài liệu tham khảo

- [React: `memo`](https://react.dev/reference/react/memo)
- [React: Profiler](https://react.dev/reference/react/Profiler)
- [React: `lazy`](https://react.dev/reference/react/lazy)
- [React Compiler](https://react.dev/learn/react-compiler)

