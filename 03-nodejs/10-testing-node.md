# Testing Node (Jest/Vitest, supertest)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Unit test kiểm tra logic cô lập; integration test xác nhận hợp đồng giữa module/dependency; HTTP/API test kiểm tra observable behavior qua request-response.
- Chọn Node built-in test runner khi muốn ít dependency; Jest có ecosystem rộng; Vitest phù hợp với workflow Vite/ESM và tốc độ tốt. Không có framework nào tự làm test đáng tin.
- Test behavior và boundary, không khóa quá chặt implementation detail; mock external systems ở ranh giới, không mock mọi collaborator.
- Test async phải `await` Promise hoặc hoàn tất callback rõ ràng; nếu không, test có thể pass trước khi assertion chạy.
- Test ổn định cần isolation, dữ liệu deterministic, cleanup tài nguyên, fake clock có kiểm soát và tránh phụ thuộc thứ tự chạy.

## 2. Khái niệm cốt lõi

Test pyramid là heuristic: nhiều unit test nhanh, một lượng integration test, ít end-to-end test chậm hơn. Với backend Node, integration test với database/queue thật trong container thường bắt được migration, transaction và query behavior mà mock không thể xác nhận. Nên giữ test ở đúng tầng để lỗi có thông tin và thời gian feedback hợp lý.

Node tích hợp test runner qua `node:test` và assertion `node:assert/strict`. Jest và Vitest bổ sung mocking, snapshot, reporting và plugin ecosystem. Chọn dựa trên module format, transform TypeScript, coverage, watch mode, CI parallelism và mức tương thích thư viện. Đừng đổi runner chỉ vì benchmark tổng quát.

Mock giúp cô lập side effect, nhưng mock quá nhiều làm test xác nhận chính mock thay vì behavior. Ưu tiên inject dependency hoặc fake nhỏ ở boundary như HTTP client/clock; với database, cân nhắc database test thật. Contract test hữu ích khi nhiều service cùng phụ thuộc API/schema.

Test HTTP có thể gọi handler qua framework injection hoặc khởi tạo server ephemeral rồi dùng Supertest/fetch. Supertest kiểm tra status, header và body mà không cần bind cổng cố định trong nhiều setup. Integration test nên quản lý fixture và cleanup trong `beforeEach`/`afterEach`; không chia sẻ mutable state giữa test.

## 3. Code ví dụ

Ví dụ dùng runner tích hợp, chạy trực tiếp với `node --test`. Test cả kết quả thành công và lỗi nghiệp vụ bằng function thuần.

```js
// pricing.mjs
export function totalWithTax(subtotal, rate) {
	if (!Number.isFinite(subtotal) || subtotal < 0) throw new RangeError('Invalid subtotal');
	if (!Number.isFinite(rate) || rate < 0) throw new RangeError('Invalid tax rate');
	return Math.round(subtotal * (1 + rate) * 100) / 100;
}
```

```js
// pricing.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { totalWithTax } from './pricing.mjs';

test('calculates total including tax', () => {
	assert.equal(totalWithTax(100, 0.1), 110);
});

test('rejects invalid subtotal', () => {
	assert.throws(() => totalWithTax(-1, 0.1), { name: 'RangeError' });
});
```

Phép tính number/Math.round ở đây là ví dụ test đơn giản, không phải money model production; với tiền cần minor units/decimal và rounding policy.

HTTP integration có thể dùng Supertest với `request(app)` khi framework export app mà không listen; với API chạy thật, test cần port ephemeral và teardown server trong `finally` để không giữ process mở.

## 4. Trade-off & Best practices

- Dùng built-in runner cho suite nhẹ và ít abstraction; chọn Jest/Vitest nếu cần ecosystem, transform, watch/reporting cụ thể. Pin version và giữ config tối thiểu.
- Test public behavior: output, status, side effects quan trọng và error contract. Tránh assert thứ tự gọi nội bộ nếu không phải contract.
- Mock network/cloud boundary, nhưng có integration test với dependency thật (hoặc container) cho query, serialization, retry và transaction behavior.
- Tách unit/integration/e2e scripts để CI có thể chạy nhanh feedback trước và chạy suite đầy đủ sau. Đặt timeout dựa trên workload thay vì tăng vô hạn.
- Test concurrency/idempotency cho queue/transaction flows; dùng unique test data và isolation phù hợp để parallel CI không xung đột.
- Với thời gian, inject clock hoặc fake timers; luôn restore timer/environment/mock trong teardown.
- Đo coverage để tìm vùng chưa kiểm tra, nhưng không tối ưu phần trăm bằng assertion không có giá trị.

## 5. Lỗi thường gặp / Pitfalls

- Quên `await` Promise/assertion hoặc không trả Promise trong test, khiến test pass sớm.
- Test dùng chung singleton/cache/database row nên pass riêng lẻ nhưng fail khi parallel hoặc chạy theo thứ tự khác.
- Mock toàn bộ repository/ORM, làm mất khả năng phát hiện lỗi query, mapping và transaction.
- Dùng snapshot khổng lồ không review diff, che khuất thay đổi API ngoài ý muốn.
- Không đóng HTTP server, timer, worker hoặc pool khiến Jest/Vitest báo open handles/CI treo.
- Retry test flakey thay vì tìm race, timezone, random seed, network hoặc cleanup thiếu.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Khi nào viết unit test, integration test và e2e?</b></summary>

Unit test cho logic nhỏ nhanh; integration test cho hợp đồng giữa module và dependency quan trọng; e2e cho một số luồng người dùng/API xuyên hệ thống. Chọn tầng tạo tín hiệu tốt với chi phí hợp lý.

</details>

<details>
<summary><b>Q2. Jest, Vitest hay `node:test`?</b></summary>

Dựa vào module format, transform, ecosystem, coverage và workflow team. `node:test` giảm dependency; Jest mature ecosystem; Vitest tích hợp tốt với Vite. Kiểm chứng trên project thực thay vì chọn theo hype.

</details>

<details>
<summary><b>Q3. Khi nào nên mock database?</b></summary>

Mock ở unit test khi cần kiểm tra logic tương tác; nhưng giữ integration test với DB thật/container để xác nhận query, schema, transaction và driver behavior.

</details>

<details>
<summary><b>Q4. Làm sao giảm flaky async tests?</b></summary>

Await toàn bộ async work, tránh sleep tùy tiện, đồng bộ hóa theo event/condition, cô lập state, kiểm soát clock/random và cleanup resource.

</details>

<details>
<summary><b>Q5. Supertest dùng để kiểm tra gì?</b></summary>

Gửi HTTP request đến app/server trong test và assert status, headers, body. Nó phù hợp kiểm thử API contract; không thay thế test logic hay end-to-end qua deployment thật.

</details>

<details>
<summary><b>Q6. Coverage 100% có chứng minh chất lượng?</b></summary>

Không. Coverage cho biết code đã chạy, không chứng minh assertion bắt đúng lỗi. Cần test case có ý nghĩa, boundary/error scenarios và contract cần bảo vệ.

</details>

## 7. Ứng dụng vào CV

- Xây dựng test pyramid cho **[N]** Node services với unit/integration/API suites, giảm escaped defects **[A]%** và thời gian CI từ **[B] xuống [C] phút**.
- Thay flaky shared fixtures bằng isolated test data và deterministic async setup, nâng tỷ lệ pass ổn định từ **[A]% lên [B]%**.

## 8. Tài liệu tham khảo

- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [Jest documentation](https://jestjs.io/docs/getting-started)
- [Vitest documentation](https://vitest.dev/guide/)
- [Supertest](https://github.com/ladjs/supertest)
