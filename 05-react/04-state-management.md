# State management: Context, Redux Toolkit, Zustand, React Query/TanStack Query

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- Phân loại state trước khi chọn tool: local UI, shared client state, URL state, form state và server/cache state có lifecycle khác nhau.
- Context truyền value qua subtree; mọi consumer có thể re-render khi provider value identity đổi, nên không phải global store miễn phí.
- Redux Toolkit cung cấp predictable centralized updates, middleware/devtools và RTK Query; Zustand đơn giản với selector-based subscriptions.
- TanStack Query quản lý server state: cache, request lifecycle, dedupe, invalidation/refetch; không thay thế mọi client state.
- Tránh duplicate sources of truth; derived state nên tính từ canonical state, không đồng bộ bằng nhiều effects.

## 2. Khái niệm cốt lõi

State management là vấn đề ownership, update semantics, consistency và lifecycle, không chỉ chọn thư viện. Local state nên ở component nếu một nơi dùng; URL query params phù hợp filter/search cần share/bookmark; form libraries quản lý dirty/validation; server state là snapshot có thể stale và cần sync với remote source.

Context giải quyết dependency propagation, không phải state update optimization. Provider value thường object mới mỗi render; consumers nhận context update và re-render. Tách contexts theo concern, memoize value khi measured cần, hoặc dùng external store selector. Context phù hợp theme/auth configuration nhỏ; store phù hợp frequent granular updates.

Redux Toolkit dùng slices/reducers, Immer cho phép viết update mutation-like nhưng tạo immutable result. Middleware xử lý async/side effects; RTK Query tích hợp data fetching/cache. Zustand cung cấp store nhỏ, selector subscriptions và middleware ecosystem. TanStack Query tập trung server state: query keys, stale/cache times, invalidation, mutations, optimistic updates và retry. Cache là bản sao có consistency policy, không phải source of truth.

## 3. Code ví dụ

TanStack Query mutation invalidates query key sau khi server cập nhật; cần query client provider ở app root.

```jsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function RenameProject({ projectId }) {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: (name) => updateProject(projectId, { name }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
	});

	return (
		<button disabled={mutation.isPending} onClick={() => mutation.mutate('New name')}>
			{mutation.isPending ? 'Saving…' : 'Rename'}
		</button>
	);
}
```

Invalidate đúng scope để tránh stale detail/list; optimistic update cần rollback nếu mutation thất bại và xử lý race giữa concurrent writes.

## 4. Trade-off & Best practices

- Chọn tool theo update frequency, selector needs, persistence, devtools, team familiarity và SSR/hydration requirements.
- Giữ server state trong query cache, client interaction state trong local/store; không copy query result sang Redux/context nếu không có reason.
- Định nghĩa query keys ổn định và hierarchical để invalidate có chủ đích; cache key phải bao gồm mọi input ảnh hưởng dữ liệu/tenant.
- Tách Context providers theo change frequency; value object/function identity có thể trigger consumers.
- Chuẩn hóa Redux state cho relational entities; selectors derive view data, reducers giữ invariant và side effects ở middleware/thunks.
- Persist ít state nhất có thể; version/migrate persisted schema và không lưu secret nhạy cảm trong browser state storage.
- Optimistic updates chỉ khi rollback/conflict semantics được thiết kế; nếu không, invalidate/refetch đơn giản hơn.

## 5. Lỗi thường gặp / Pitfalls

- Đưa toàn bộ state vào Context khiến mọi consumer render theo mọi update.
- Lưu cùng server entity ở query cache, Redux và component state, tạo stale divergence.
- Query key thiếu filter/tenant/locale, cache nhầm response giữa inputs.
- Tự fetch trong effect rồi phải tự xử lý dedupe, stale response, retries, loading/error/cache lifecycle.
- Optimistic update không snapshot/rollback cache hoặc không xử lý concurrent mutation order.
- Persist access tokens/user secrets vào client store/localStorage mà không threat-model XSS.
- Chọn thư viện vì phổ biến mà không xét SSR, bundle, team competency và workload.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Client state khác server state thế nào?</b></summary>

Client state do UI sở hữu; server state là cache của dữ liệu remote, có stale/invalidation/refetch/error lifecycle. Server state cần consistency policy riêng.

</details>

<details>
<summary><b>Q2. Context có phải global state manager?</b></summary>

Context truyền value qua tree nhưng không cung cấp selector/cache/async lifecycle mặc định. Update provider có thể re-render consumers; hợp config/shared state ít đổi.

</details>

<details>
<summary><b>Q3. Redux Toolkit khác Zustand?</b></summary>

RTK có conventions/reducers, middleware và ecosystem lớn cho centralized flows; Zustand nhẹ với store/selectors. Chọn theo complexity, governance và debugging needs.

</details>

<details>
<summary><b>Q4. TanStack Query thay Redux không?</b></summary>

Không theo nghĩa tổng quát. Nó quản lý server/cache state; app vẫn có thể cần client state store hoặc local state.

</details>

<details>
<summary><b>Q5. Vì sao tránh duplicate source of truth?</b></summary>

Mỗi bản sao cần đồng bộ và conflict resolution; stale state sinh bug. Giữ canonical owner và derive view state khi có thể.

</details>

## 7. Ứng dụng vào CV

- Tách server cache khỏi UI state bằng query layer và selectors, giảm duplicate fetch **[A]%** và stale-data incidents **[B]%**.
- Thiết kế normalized store cho **[N]** workflows, giảm invalid state transitions **[A]%** và cải thiện debugging/replay time **[B]%**.

## 8. Tài liệu tham khảo

- [React: Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Zustand documentation](https://zustand.docs.pmnd.rs/)
- [TanStack Query documentation](https://tanstack.com/query/latest/docs/framework/react/overview)
