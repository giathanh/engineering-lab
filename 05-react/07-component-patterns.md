# Patterns: compound components, HOC, render props, controlled/uncontrolled form

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Compound components chia một widget thành các pieces phối hợp qua context; phù hợp API declarative như Tabs/Menu.
- Controlled component nhận value/state từ parent; uncontrolled component sở hữu state và expose ref/default value.
- Render props và HOC là patterns reuse logic lâu đời; custom hooks thường là lựa chọn trực tiếp hơn cho logic stateful hiện đại.
- Pattern tốt giữ accessibility, state ownership và API contract rõ; tránh tạo abstraction chỉ để giảm vài dòng.
- Component API cần định nghĩa controlled/uncontrolled transitions, defaulting và behavior khi prop chuyển đổi.

## 2. Khái niệm cốt lõi

Compound components cho phép consumer ghép subcomponents theo composition nhưng chia sẻ state qua context. Pattern hữu ích khi root owns selection/open state, children khai báo trigger/panel. Trade-off: dependency ngầm vào provider, validation khi subcomponent dùng ngoài root, và API linh hoạt hơn nhưng khó type nếu quá generic.

HOC nhận component và trả component mới, thường thêm concern như authorization/analytics. Nó có thể tạo wrapper layers, prop name collisions, ref forwarding/displayName complexity. Render props truyền function để caller quyết định rendering; linh hoạt nhưng nesting/callback identity có thể khó đọc. Custom hooks chia sẻ logic mà không thêm component tree node, nhưng không chia sẻ state tự động.

Controlled form input dùng `value`/`checked` cùng `onChange`; parent là source of truth, dễ validate/reset/sync nhưng có render/update overhead. Uncontrolled dùng `defaultValue` và DOM giữ state; ref đọc value khi submit, phù hợp tích hợp native form/library hoặc form lớn cần ít rerenders. Không trộn `value` controlled với `defaultValue` hoặc chuyển mode giữa vòng đời component.

## 3. Code ví dụ

Tabs compound components chia sẻ selected value; production cần bổ sung keyboard navigation và ARIA semantics đầy đủ.

```jsx
import { createContext, useContext } from 'react';

const TabsContext = createContext(null);

export function TabsRoot({ value, onValueChange, children }) {
	return (
		<TabsContext.Provider value={{ value, onValueChange }}>
			{children}
		</TabsContext.Provider>
	);
}

export function TabsTrigger({ value, children }) {
	const tabs = useContext(TabsContext);
	if (!tabs) throw new Error('TabsTrigger must be inside TabsRoot');
	return <button type="button" role="tab" aria-selected={tabs.value === value} onClick={() => tabs.onValueChange(value)}>{children}</button>;
}
```

## 4. Trade-off & Best practices

- Dùng controlled API khi parent cần điều khiển/serialize state; uncontrolled khi component độc lập và consumer chỉ cần initial value/ref.
- Compound component phù hợp API có subparts và shared coordination; nếu state/slots đơn giản, props composition có thể dễ hiểu hơn.
- Custom hook cho logic không cần shared visual structure; compound component khi markup composition cũng là một phần API.
- Với forms, giữ DOM semantics, labels, validation messages và keyboard support; không build custom controls trước khi cân nhắc native HTML.
- HOC chỉ dùng khi wrapper abstraction thực sự cần (cross-cutting component transformation); preserve displayName, ref và static properties nếu contract yêu cầu.
- Render props hữu ích khi caller cần custom rendering; tránh deep nesting và tạo callback mới nếu consumer phụ thuộc identity.
- Document whether controlled props can change, default values, callback timing và reset behavior.

## 5. Lỗi thường gặp / Pitfalls

- Component input nhận `value` lúc đầu rồi `undefined` sau đó, chuyển controlled/uncontrolled ngoài ý muốn.
- Compound child truy cập context null mà không báo lỗi rõ.
- Tái tạo HOC mỗi render khiến component identity đổi và subtree remount.
- HOC làm mất refs/static methods hoặc tạo prop collision.
- Dùng custom hook rồi kỳ vọng state được chia sẻ giữa các instances.
- Tự xây Tabs/Menu nhưng thiếu focus management, arrow keys, roles và ARIA relationships.
- Abstraction quá generic buộc consumer đọc implementation để hiểu prop interactions.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Controlled và uncontrolled component khác gì?</b></summary>

Controlled value thuộc parent và được cập nhật qua callback; uncontrolled state nằm trong DOM/component, parent thường đọc qua ref hoặc submit. Chọn theo ownership và integration needs.

</details>

<details>
<summary><b>Q2. Compound components giải quyết gì?</b></summary>

Cho consumer composition subparts trong một widget trong khi root chia sẻ state/context. Cần enforce provider boundary và accessibility behavior.

</details>

<details>
<summary><b>Q3. Custom hook khác render props?</b></summary>

Custom hook chia sẻ logic stateful không thêm tree node; render props chia sẻ logic và cho caller control rendering qua function, có thể tạo nesting.

</details>

<details>
<summary><b>Q4. Khi nào HOC vẫn hữu ích?</b></summary>

Khi cần transform/wrap component tại boundary như integration legacy hoặc inject capability xuyên component. Hook thường đơn giản hơn cho logic trong function components.

</details>

<details>
<summary><b>Q5. Vì sao không chuyển controlled input sang uncontrolled?</b></summary>

Ownership và update semantics khác nhau; chuyển mode có thể mất value/validation synchronization, phát warning và tạo behavior khó dự đoán.

</details>

## 7. Ứng dụng vào CV

- Thiết kế accessible compound components cho **[N]** form/navigation primitives, giảm duplicated interaction code **[A]%**.
- Chuẩn hóa controlled/uncontrolled API cho design system, giảm integration defects **[A]%** qua **[N]** consuming teams.

## 8. Tài liệu tham khảo

- [React: Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
- [React: Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [React: `createContext`](https://react.dev/reference/react/createContext)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

