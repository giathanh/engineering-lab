# Testing pyramid: unit/integration/e2e, TDD, mocking

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Unit/integration/e2e là các scope khác nhau; pyramid là heuristic về feedback cost, không phải quota test cố định.
- Unit tests nhanh cho logic; integration tests xác nhận boundaries (DB, queue, framework); e2e ít hơn cho critical user journeys.
- TDD red-green-refactor giúp làm rõ behavior/feedback loop, nhưng không đảm bảo design tốt nếu test chỉ theo implementation.
- Mock external boundaries, không mock mọi collaborator; test với dependency thật cho behavior/contract quan trọng.
- Determinism, isolation, useful assertions và CI feedback time quan trọng hơn coverage percentage đơn lẻ.

## 2. Khái niệm cốt lõi

Test pyramid đặt nhiều fast tests ở dưới, ít integration tests ở giữa và ít end-to-end tests ở trên do cost/runtime/flakiness tăng. Modern systems có thể dùng testing trophy/diamond; quyết định phụ thuộc architecture. Unit test tốt kiểm domain transformations/invariants; integration test kiểm query, serialization, broker contract; e2e kiểm flow xuyên browser/service thật.

TDD cycle: red (viết failing test cho behavior), green (code tối thiểu để pass), refactor (cải thiện design với safety net). Test trước buộc requirement cụ thể, nhưng có thể dẫn tới overfitting implementation nếu test private methods. BDD examples giúp PO/engineers thống nhất behavior nhưng không cần mọi test viết theo Gherkin.

Test doubles gồm dummy/stub/fake/mock/spy. Mock expectations kiểm interaction; nếu mock tất cả, test có thể pass dù integration contract sai. Fake database/cache hữu ích cho unit tests nhưng không thay test trên real engine khi SQL/transaction semantics quan trọng. Contract tests xác minh consumer/provider assumptions mà không phải deploy mọi dependency trong mỗi run.

Coverage đo executed lines/branches, không đo assertion quality. Mutation testing thử khả năng test bắt lỗi bằng cách sửa code có chủ đích; hữu ích chọn lọc vì cost. Flaky tests giảm trust và khiến team rerun thay vì điều tra.

## 3. Code ví dụ

Ví dụ TDD cho pure function: test boundary rồi implement function nhỏ.

```ts
export function clamp(value: number, min: number, max: number): number {
	if (min > max) throw new RangeError('min must not exceed max');
	return Math.min(max, Math.max(min, value));
}

// Test intent: below range -> min; within range -> unchanged; above -> max.
```

Test runner cụ thể sẽ assert các trường hợp trên; test error case cũng bảo vệ input invariant. Pure function không cần mock.

## 4. Trade-off & Best practices

- Chọn test scope theo risk/failure cost; integration test DB write paths và e2e critical journeys, không ép mọi behavior qua browser.
- TDD hữu ích cho domain logic, bug reproduction và unclear requirements; exploratory prototyping đôi khi cần spike trước rồi viết tests.
- Mock network/cloud/clock boundaries; ưu tiên real DB/container cho query, migrations, locking và transaction behavior.
- Test public behavior/contracts, tên test mô tả intent; giữ setup nhỏ và data deterministic.
- Chạy fast suite theo commit, full e2e/nightly nếu cost lớn; quarantine flake có owner/deadline, không bỏ qua vô thời hạn.
- Dùng coverage trend để tìm vùng chưa kiểm tra; đánh giá mutation/branch cases thay vì đặt 100% line coverage làm mục tiêu.
- Xác định test data/cleanup, parallel safety, timezone/locale/random seeds và external service isolation.

## 5. Lỗi thường gặp / Pitfalls

- Viết test sau implementation rồi chỉ assert code hiện có.
- Test brittle private details, refactor implementation là test fail dù behavior đúng.
- Mock repository sâu tới mức không bắt schema/SQL bugs.
- Dùng sleep/real network/shared mutable fixture gây flakiness.
- Tăng test retry để che non-determinism.
- Chỉ nhìn line coverage mà bỏ error paths/invariants.
- Dồn quá nhiều assertions/unrelated behaviors vào một test lớn khó chẩn đoán.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Khi nào unit vs integration test?</b></summary>

Unit cho pure policy/logic với feedback nhanh; integration cho contracts giữa module/DB/queue/framework nơi behavior thật quan trọng.

</details>

<details>
<summary><b>Q2. TDD có luôn tốt hơn?</b></summary>

Không tuyệt đối. Nó hữu ích khi behavior rõ/testable và feedback nhanh; với exploration/unknown APIs có thể spike trước rồi viết behavior tests.

</details>

<details>
<summary><b>Q3. Mock quá nhiều gây vấn đề gì?</b></summary>

Tests phản ánh mock setup thay vì system contract, bỏ lỡ integration incompatibility và trở nên coupled implementation.

</details>

<details>
<summary><b>Q4. Coverage 100% chứng minh gì?</b></summary>

Code paths đã chạy theo metric tool; không chứng minh assertions bắt mọi lỗi hay test behavior có ý nghĩa.

</details>

<details>
<summary><b>Q5. Flaky tests xử lý thế nào?</b></summary>

Phân loại race/time/network/shared state, tạo deterministic reproduction, sửa root cause và theo dõi pass rate; không hide bằng retry vô hạn.

</details>

## 7. Ứng dụng vào CV

- Thiết kế testing pyramid cho **[N]** services, giảm defect escape **[A]%** và CI feedback từ **[B] xuống [C] phút**.
- Áp dụng TDD/contract tests cho **[critical workflow]**, giảm regression **[A]%** qua **[N] releases**.

## 8. Tài liệu tham khảo

- [Martin Fowler: Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Kent Beck: Test-Driven Development](https://www.oreilly.com/library/view/test-driven-development/0321146530/)
- [Google Testing Blog](https://testing.googleblog.com/)
- [Martin Fowler: Test Double](https://martinfowler.com/bliki/TestDouble.html)
