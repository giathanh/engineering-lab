# Hooks chuyên sâu: useState, useEffect, useRef, useMemo, useCallback, custom hooks, rules

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- Hooks gắn state/effects vào component identity theo thứ tự gọi; chỉ gọi top-level trong function component/custom hook, trừ API use của React 19 như giải thích bên dưới.
- State là snapshot theo render; updater function dùng khi giá trị mới phụ thuộc giá trị trước hoặc có nhiều queued updates.
- `useEffect` đồng bộ với hệ thống bên ngoài sau commit; derived state/render calculation thường không cần effect.
- `useRef` giữ mutable value không trigger render; `useMemo`/`useCallback` là optimization, không phải semantic guarantee.
- Custom hook chia sẻ logic, không chia sẻ state instance trừ khi dùng external store/context.

## 2. Khái niệm cốt lõi

Ngoại lệ React 19: API `use` có thể gọi trong condition/loop, nhưng vẫn phải ở component/custom hook và không bọc trong try/catch. Quy tắc thứ tự dưới đây áp dụng cho hooks như useState/useEffect.

React associate hook state với component Fiber theo thứ tự hook calls. Nếu gọi trong condition/loop, vị trí hook lệch giữa render và React không thể map state đúng. Custom hooks tuân cùng rules và giúp gom stateful logic theo concern.

`useState` trả snapshot hiện tại của render. Gọi setter schedule update, không mutate biến đang capture trong closure. Functional updater (`setCount(c => c + 1)`) được xử lý trên queued state và phù hợp khi update phụ thuộc prior value. React có thể batch updates; render mới đọc snapshot mới.

Effects chạy sau commit để đồng bộ với external systems như subscriptions, DOM APIs, network lifecycle hoặc imperative widgets. Cleanup chạy trước effect tiếp theo khi dependencies đổi và lúc unmount. Dependency array là danh sách reactive values effect đọc; không phải nút tùy ý để “chạy một lần”. Nếu logic chỉ derive value từ props/state, tính trong render hoặc memo hóa khi đo được cần thiết. Fetch trong effect cần abort/ignore stale response để không ghi kết quả cũ.

`useRef` giữ object ổn định giữa renders, mutate `.current` không tạo render. Hợp cho DOM refs, timer IDs và mutable values không ảnh hưởng UI. `useMemo` cache calculation result; `useCallback` cache function identity. React có thể bỏ cache theo lifecycle; code correctness không được phụ thuộc vào chúng. `useEffectEvent` trong React 19.2 phù hợp tách event logic non-reactive đọc latest values khỏi effect synchronization, nhưng không dùng để né dependency thật.

## 3. Code ví dụ

Subscribe browser status bằng `useSyncExternalStore`, có cleanup và server snapshot nhất quán khi SSR/hydration.

```jsx
import { useSyncExternalStore } from 'react';

function subscribe(onChange) {
	window.addEventListener('online', onChange);
	window.addEventListener('offline', onChange);
	return () => {
		window.removeEventListener('online', onChange);
		window.removeEventListener('offline', onChange);
	};
}

const getSnapshot = () => navigator.onLine;
const getServerSnapshot = () => true;

function useOnlineStatus() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

Server và lần hydration đầu dùng snapshot `true`; sau đó React đọc trạng thái browser thật. `navigator.onLine` chỉ là tín hiệu network của browser, không chứng minh backend truy cập được.

## 4. Trade-off & Best practices

- Đặt state gần component sử dụng; lift state chỉ khi nhiều consumers thực sự cần đồng bộ.
- Viết effect theo một synchronization concern, khai báo dependencies đầy đủ và cleanup resource.
- Dùng updater function cho queued/async updates dựa trên prior state; không mutate state object/array.
- Dùng `useRef` cho dữ liệu mutable không render; nếu `.current` thay đổi phải phản ánh UI, dùng state/external store.
- Chỉ thêm `useMemo`/`useCallback` khi identity/calc cost có consumer hữu ích (memoized child, dependency); đo profiler.
- Custom hook đặt tên `use...`, expose API nhỏ và document lifecycle; hook call vẫn tạo state riêng cho mỗi consumer.
- Với subscription external store, cân nhắc `useSyncExternalStore` để hỗ trợ concurrent rendering và consistent snapshots.

## 5. Lỗi thường gặp / Pitfalls

- Gọi hook conditionally hoặc trong callback/event handler.
- Dùng `[]` để né dependency linter trong khi effect đọc props/state; stale closure tạo bug khó tái hiện.
- Dùng effect để tính derived state, tạo render thứ hai và state drift.
- Gọi setter rồi đọc state ngay trong cùng handler và kỳ vọng biến snapshot đã đổi.
- Dựa vào `useMemo` cache để bảo đảm correctness hoặc resource lifetime.
- Không cleanup event listener/subscription/timer; Strict Mode development có thể lộ setup/cleanup không đối xứng.
- Dùng custom hook rồi kỳ vọng hai consumer chia sẻ cùng local state tự động.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Vì sao Rules of Hooks quan trọng?</b></summary>

React map hook state theo thứ tự gọi trong component identity. Conditional/loop calls của useState/useEffect làm thứ tự thay đổi và state slot bị gán sai; riêng API use của React 19 cho phép condition/loop.

</details>

<details>
<summary><b>Q2. Khi nào cần functional state updater?</b></summary>

Khi giá trị mới phụ thuộc state trước đó hoặc nhiều updates có thể được queue/batch. Updater nhận queued state thay vì closure snapshot cũ.

</details>

<details>
<summary><b>Q3. `useEffect` dùng cho gì?</b></summary>

Đồng bộ component với hệ thống bên ngoài sau commit, như subscription/socket/imperative API. Không dùng làm cơ chế mặc định cho derived render data.

</details>

<details>
<summary><b>Q4. `useRef` khác state?</b></summary>

Ref object ổn định và mutate `.current` không trigger render; state setter schedule render. Dùng ref cho mutable data không trực tiếp quyết định UI.

</details>

<details>
<summary><b>Q5. `useMemo` có đảm bảo value giữ mãi không?</b></summary>

Không. Đây là performance optimization; React có thể discard cache. Correctness không được phụ thuộc memoization.

</details>

## 7. Ứng dụng vào CV

- Tách subscription/timer logic thành custom hooks có cleanup đối xứng, giảm leaked listeners **[A]%** trên **[N]** screens.
- Dùng React Profiler để memo hóa đúng bottleneck, giảm render time p95 **[A]%** mà không che stale-dependency bugs.

## 8. Tài liệu tham khảo

- [React: Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [React: Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- [React: State as a Snapshot](https://react.dev/learn/state-as-a-snapshot)
- [React: `useEffectEvent`](https://react.dev/reference/react/useEffectEvent)

- [React: useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- [React: use — ngoại lệ với condition/loop](https://react.dev/reference/react/use)
