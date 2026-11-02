# Virtual DOM, reconciliation, Fiber, key

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- React render tạo description (element tree) từ props/state; reconciliation so sánh tree mới với tree trước để quyết định host mutations.
- Virtual DOM không đảm bảo nhanh hơn mọi DOM code; lợi ích nằm ở declarative model, batching và consistent update semantics.
- Fiber biểu diễn unit of work giúp scheduler chia/ưu tiên render; render phase có thể bị interrupt/restart, commit phase áp dụng thay đổi đồng bộ.
- State identity phụ thuộc component type, position và key; key ổn định giúp React map sibling elements giữa các lần render.
- Index key hoặc random key làm state gắn nhầm item/reset state, đặc biệt khi reorder/insert/delete.

## 2. Khái niệm cốt lõi

JSX compile thành React element descriptions, không phải DOM node. Khi state/props đổi, React gọi component để tạo output mới rồi reconcile element tree. React tối ưu bằng heuristics thay vì tìm tree edit distance tối ưu tổng quát. Cùng type ở cùng vị trí thường được reuse; khác type thường unmount/mount subtree. Host renderer (React DOM/native) quyết định cách commit changes.

Fiber là data structure cho mỗi component/host node cùng scheduling metadata, parent/child/sibling links, lanes/priority và effect flags. Concurrent rendering cho phép React bắt đầu work, yield, tiếp tục hoặc bỏ work cũ nếu update mới ưu tiên hơn. Render phase phải pure: side effects ở render có thể chạy lại và gây bug. Commit phase áp dụng DOM mutations, refs và layout effects; passive effects (`useEffect`) được flush riêng sau commit, không nhất thiết trước browser paint; commit không bị interrupt giữa chừng như render work.

Keys disambiguate sibling identity khi list thay đổi. Key chỉ cần unique trong sibling set, không phải toàn app. React dùng key cùng element type và vị trí để quyết định component instance/state có được reuse. Stable database ID thường tốt; index chỉ an toàn cho list tĩnh không reorder/insert/remove. Random key mỗi render buộc remount, mất local state và DOM continuity.

## 3. Code ví dụ

Dùng stable key từ domain ID để state/input đi theo đúng record khi sắp xếp lại.

```jsx
function TodoList({ todos }) {
	return (
		<ul>
			{todos.map((todo) => (
				<li key={todo.id}>
					<input defaultValue={todo.title} />
				</li>
			))}
		</ul>
	);
}
```

Nếu dùng `key={index}`, input state của row có thể gắn với vị trí thay vì todo sau reorder. Nếu muốn reset form có chủ đích khi đổi entity, dùng key entity ở component boundary thay vì random key.

## 4. Trade-off & Best practices

- Giữ render pure và tránh mutate props/state; React có thể render component nhiều lần hoặc bỏ kết quả render chưa commit.
- Dùng stable keys theo identity domain; index key chỉ cho collection bất biến về thứ tự và membership.
- Đặt component boundary theo state ownership/independent update, không chỉ để “giảm số dòng”.
- Đo bằng React Profiler và browser performance tools; virtual DOM diff không loại bỏ cost của render logic, layout, paint hay network.
- Chuyển side effects sang effects/event handlers phù hợp; không gửi request, mutate global hoặc generate random IDs trong render.
- Không giả định mỗi state update tạo một DOM mutation; batching/reconciliation có thể gộp nhiều updates.
- Với expensive list, cân nhắc virtualization; keys đúng không giải quyết chi phí tạo hàng chục nghìn elements.

## 5. Lỗi thường gặp / Pitfalls

- Gọi Virtual DOM là bản copy DOM hoàn chỉnh được cập nhật theo từng DOM node mỗi lần.
- Tạo side effects trong render rồi thấy chúng chạy hai lần trong development Strict Mode.
- Dùng index/random key, gây state mismatch hoặc remount toàn bộ subtree.
- Dùng key unique toàn app trong khi yêu cầu chỉ là unique giữa siblings; hoặc duplicate key trong cùng list.
- Nghĩ Fiber đồng nghĩa mọi render đều chạy song song; JavaScript component code vẫn thực thi trên thread, scheduler chỉ quản lý work/yield.
- Chuyển component type inline trong parent render, khiến identity thay đổi và subtree remount.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Reconciliation là gì?</b></summary>

Quá trình so sánh element descriptions giữa các lần render để quyết định giữ, update, thêm hoặc remove component/host nodes dựa trên type, position và key.

</details>

<details>
<summary><b>Q2. Fiber giải quyết vấn đề gì?</b></summary>

Biểu diễn render work thành units có metadata/priority để React có thể yield, ưu tiên update và bỏ work cũ trước commit. Nó không làm component code tự chạy trên nhiều JS threads.

</details>

<details>
<summary><b>Q3. Vì sao key cần stable?</b></summary>

Key giúp giữ identity giữa các renders. Stable key đảm bảo state/focus gắn với item đúng khi siblings được reorder hoặc thay đổi.

</details>

<details>
<summary><b>Q4. Render phase khác commit phase?</b></summary>

Render tính cây output và có thể bị restart/abandon; commit áp dụng host mutations, refs và layout effects; passive effects được flush sau commit. Render phải pure vì không đảm bảo chạy đúng một lần.

</details>

<details>
<summary><b>Q5. Virtual DOM có luôn nhanh hơn thao tác DOM thủ công?</b></summary>

Không. Nó cung cấp programming model và tối ưu phù hợp; direct DOM update có thể nhanh hơn microbenchmark nhưng khó maintain/coordinate. Đo workload thật.

</details>

## 7. Ứng dụng vào CV

- Sửa identity/key strategy cho **[N]** dynamic lists, giảm lost-input/state bugs **[A]%** và cải thiện thời gian render p95 **[B]%**.
- Tách render-pure components và profile commit hotspots, giảm unnecessary work **[A]%** trong **[screen/workflow]**.

## 8. Tài liệu tham khảo

- [React: Render and Commit](https://react.dev/learn/render-and-commit)
- [React: Rendering Lists](https://react.dev/learn/rendering-lists)
- [React: State as a Snapshot](https://react.dev/learn/state-as-a-snapshot)
- [React: Keeping Components Pure](https://react.dev/learn/keeping-components-pure)

