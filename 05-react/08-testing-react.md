# Testing React (React Testing Library, MSW)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- React Testing Library (RTL) khuyến khích test theo hành vi user và accessibility semantics thay vì component internals.
- Test user-visible states: loading, success, empty, error, validation, permissions và async transitions.
- MSW mock network ở HTTP boundary, giữ fetch/client code thật để test request/response contract.
- `user-event` mô phỏng interaction thực tế tốt hơn dispatch event thủ công; luôn await async interactions/assertions.
- Component tests không thay thế integration/e2e; giữ suite deterministic, cleanup mocks/timers/server sau từng test.

## 2. Khái niệm cốt lõi

RTL render component trong DOM-like environment và truy vấn theo accessible role/label/name, gần cách user và assistive technology quan sát. `getBy` kỳ vọng element tồn tại ngay; `queryBy` trả null để kiểm tra absence; `findBy` chờ async element xuất hiện. `waitFor` lặp assertion đến khi thành công/timeout, không nên dùng để bọc mọi thứ hoặc chờ bằng sleep.

Test nên thao tác qua UI contract: type, click, submit, keyboard, inspect status/text. Tránh test state hooks, private methods, implementation snapshots lớn. `userEvent.setup()` tạo interaction session với focus/keyboard semantics; fake timers có thể xung đột với user-event nếu không cấu hình clock.

MSW intercepts network request ở browser/Node boundary. Test handler cho response/error/delay, giữ application fetch layer và serialization thật. Có thể dùng `setupServer` trong Node tests hoặc browser worker; reset handlers sau test để tránh leakage. Với React Query/router/context, tạo test wrapper/provider riêng mỗi test để isolate caches/state.

## 3. Code ví dụ

Test form tương tác với RTL và user-event; component `LoginForm` được kiểm tra qua label/status chứ không inspect hooks.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

it('shows validation feedback for an empty email', async () => {
	const user = userEvent.setup();
	render(<LoginForm onSubmit={vi.fn()} />);

	await user.click(screen.getByRole('button', { name: /sign in/i }));

	expect(await screen.findByRole('alert')).toHaveTextContent(/email is required/i);
});
```

Trong Jest thay `vi.fn()` bằng `jest.fn()`; test runner cần jsdom và setup matchers phù hợp. MSW handler nên mock endpoint mà form dùng để cover loading/success/error network states.

## 4. Trade-off & Best practices

- Query theo role/name/label trước; `data-testid` dùng khi semantics không cung cấp selector ổn định.
- Test observable behavior và important edge states; tránh assert exact DOM tree/implementation details.
- Dùng MSW cho HTTP boundary thay mock `fetch` global để giữ request construction/response parsing thật.
- Khởi tạo providers/cache mới mỗi test; cleanup automatically hoặc explicit, reset MSW handlers/mocks/timers.
- Async: await `user` calls, dùng `findBy` cho appearance và `waitFor` cho condition không gắn element query.
- Test keyboard/focus và accessible name cho custom controls; screenshot tests không thay behavior/accessibility tests.
- Giữ component tests nhanh; các luồng auth/navigation/backend thật thuộc integration/e2e suite.
- Giữ component tests nhanh; các luồng auth/navigation/backend thật thuộc integration/e2e suite.
- Test Strict Mode và cleanup behavior khi component subscribe/tạo resource; development có thể chạy setup-cleanup thêm để phát hiện effect không đối xứng.
- Với async UI, assert transition theo user-visible state thay vì chờ implementation-specific request; MSW có thể mô phỏng latency/error để xác minh pending và retry UX.

## 5. Lỗi thường gặp / Pitfalls

- Dùng `getBy` cho element xuất hiện bất đồng bộ, gây race/flaky failure.
- Gọi `fireEvent` cho mọi interaction dù cần focus/keyboard behavior đầy đủ.
- Mock implementation internals hoặc `useState`, khiến test không phản ánh user contract.
- Không reset MSW handlers, query cache hoặc mock state khiến test phụ thuộc thứ tự.
- `waitFor` callback có side effect chạy nhiều lần, gây double submit.
- Dùng snapshot khổng lồ; diff khó review và test brittle.
- Không test error/loading state trong async UI, để regression chỉ xuất hiện khi network chậm/lỗi.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. RTL triết lý test gì?</b></summary>

Test component như user tương tác qua accessible DOM, không dựa vào implementation details. Điều này giúp test sống qua refactor nhưng vẫn bắt regression behavior.

</details>

<details>
<summary><b>Q2. `getBy`, `queryBy`, `findBy` khác gì?</b></summary>

`getBy` throw khi không có; `queryBy` trả null phù hợp absence; `findBy` trả Promise và retry tới khi element xuất hiện hoặc timeout.

</details>

<details>
<summary><b>Q3. MSW khác mock `fetch` thế nào?</b></summary>

MSW intercept tại network boundary, giữ code xây request/parse response thật; mock fetch thay trực tiếp implementation và dễ bỏ sót integration behavior.

</details>

<details>
<summary><b>Q4. Khi nào dùng `waitFor`?</b></summary>

Khi cần đợi condition async không có query `findBy` tương ứng. Callback phải chỉ assert, không tạo side effect vì có thể chạy nhiều lần.

</details>

<details>
<summary><b>Q5. Vì sao test hook internals thường brittle?</b></summary>

Hook implementation là detail; test qua UI/API contract bắt behavior và cho phép refactor cách quản lý state mà không sửa test không cần thiết.

</details>

## 7. Ứng dụng vào CV

- Thiết lập RTL/MSW test patterns cho **[N]** React workflows, giảm UI regressions **[A]%** và flakiness **[B]%**.
- Bổ sung keyboard/accessibility behavior tests cho design system, tăng coverage luồng trọng yếu từ **[A]% lên [B]%**.

## 8. Tài liệu tham khảo

- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library: user-event](https://testing-library.com/docs/user-event/intro/)
- [MSW documentation](https://mswjs.io/docs/)
- [Testing Library: Queries](https://testing-library.com/docs/queries/about/)
