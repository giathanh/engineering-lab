# Clean Code & Refactoring (code smell, kỹ thuật refactor)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Clean code tối ưu cho khả năng đọc, thay đổi và vận hành của team; không đồng nghĩa với code ngắn hoặc abstraction nhiều.
- Code smell là tín hiệu cần điều tra, không phải bằng chứng rằng phải refactor theo một công thức.
- Refactor thay đổi cấu trúc nhưng giữ behavior quan sát được; thêm/sửa behavior là bước riêng để giảm rủi ro.
- Refactor an toàn dựa trên test phù hợp, diff nhỏ, bước kiểm tra thường xuyên và khả năng rollback.
- Ưu tiên thay đổi tại boundary có chi phí cao nhất: duplication của business rule, module coupling, naming mơ hồ, function dài và side effect ẩn.

## 2. Khái niệm cốt lõi

Maintainability là khả năng hiểu, sửa, test và vận hành code trong tương lai. Readability phụ thuộc context và naming, không chỉ style guide. Một abstraction tốt làm domain concept rõ hơn; abstraction sai làm người đọc phải đi qua nhiều file mới hiểu một phép biến đổi đơn giản.

Smell thường gặp: **Long Method** (nhiều lý do/thao tác), **Feature Envy** (logic dùng dữ liệu object khác nhiều hơn dữ liệu của nó), **Shotgun Surgery** (một thay đổi phải sửa nhiều nơi), **Divergent Change** (một module thay vì nhiều lý do), **Primitive Obsession** (dùng primitive thay cho concept có invariant), **Duplicated Knowledge** (một business rule có nhiều nguồn sự thật). Smell gợi câu hỏi; đôi khi code lặp được chủ ý để domain khác nhau tiến hóa độc lập.

Refactoring catalog gồm Extract Function/Module, Rename, Inline, Move Function, Replace Conditional with Polymorphism, Introduce Parameter Object và Encapsulate Variable. Chọn thao tác nhỏ có feedback nhanh. Test không cần bao phủ mọi implementation detail nhưng cần bảo vệ contract, edge case và side effect quan trọng. Nếu legacy code chưa có test, characterization test ghi lại behavior hiện tại trước khi đổi.

Quy trình an toàn thường là: xác định behavior cần giữ → thêm/điều chỉnh test → thực hiện một phép refactor nhỏ → chạy test/lint/typecheck → xem diff → lặp. Với migration lớn, dùng strangler/expand-contract: thêm đường mới, chuyển traffic/dữ liệu từng bước, rồi xóa đường cũ sau khi đo được.

## 3. Code ví dụ

Ví dụ tách quyết định discount khỏi một hàm xử lý đơn hàng, đặt tên thể hiện domain rule. Hàm chạy trên Node.js 22+.

```js
function discountRateFor(customer) {
	if (customer.isMember && customer.yearsActive >= 3) return 0.15;
	if (customer.isMember) return 0.1;
	return 0;
}

export function finalPrice(subtotal, customer) {
	if (!Number.isFinite(subtotal) || subtotal < 0) throw new RangeError('Invalid subtotal');
	return subtotal * (1 - discountRateFor(customer));
}
```

Refactor bước đầu chỉ extract named function, chưa thay đổi policy. Test các boundary (member/non-member, năm hoạt động 2/3) để xác nhận behavior. Sau đó mới cân nhắc strategy nếu chính sách thực sự có nhiều biến thể độc lập.

## 4. Trade-off & Best practices

- Refactor gần nơi đang thay đổi (Boy Scout rule có giới hạn) nhưng giữ scope commit rõ; tránh dọn toàn repo trong một feature.
- Dùng tên domain cụ thể thay vì generic `Manager`, `Helper`, `Processor`; function nên nêu intent và tránh side effect ngầm.
- Chia function theo concept hoặc decision boundary, không chỉ theo số dòng. Quá nhiều tiny wrappers có thể che flow.
- Khi duplication là cùng business rule, tạo một nguồn sự thật; khi chỉ giống cú pháp, cân nhắc giữ riêng để tránh coupling giữa domain độc lập.
- Với database/API migrations, dùng backward-compatible expand-contract và observability để xác nhận không còn consumer cũ trước khi remove.
- Chọn test theo risk: unit cho pure logic, integration cho persistence/IO contract, characterization cho legacy behavior. Không cần bắt đầu refactor lớn khi không thể xác định behavior cần giữ.
- Đánh giá thành công bằng thay đổi dễ hơn (lead time, defect rate, coupling) chứ không theo số file/class được tạo.

## 5. Lỗi thường gặp / Pitfalls

- Refactor đồng thời với thay đổi behavior, khiến khi test fail khó biết nguyên nhân nằm đâu.
- “Clean up” đổi public API/schema hoặc semantics mà không có migration plan.
- Tạo abstraction chỉ để giảm vài dòng duplication, làm call graph phức tạp hơn.
- Viết test khóa implementation (assert method calls nội bộ) khiến refactor nhỏ phải sửa nhiều test.
- Dùng format/lint thay cho review behavior; code đẹp về style vẫn có thể sai invariant.
- Refactor diện rộng khi production bug đang cần fix, không chia bước nhỏ và không có rollback point.
- Bỏ qua observability khi thay algorithm/data flow; test pass không bảo đảm tải production tương đương.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Refactoring khác feature development thế nào?</b></summary>

Refactoring thay đổi cấu trúc mà giữ behavior quan sát được; feature thay đổi behavior. Tách hai loại thay đổi giúp test/review và rollback rõ hơn.

</details>

<details>
<summary><b>Q2. Code smell có nghĩa chắc chắn phải refactor?</b></summary>

Không. Smell là tín hiệu để đánh giá cost thay đổi, frequency và coupling. Nếu không làm code khó sửa hoặc rủi ro cao, refactor có thể chưa đáng.

</details>

<details>
<summary><b>Q3. Refactor legacy code chưa có test ra sao?</b></summary>

Ghi nhận behavior quan trọng bằng characterization/integration tests, chọn một boundary nhỏ, thay đổi từng bước và quan sát production metrics. Không giả định behavior hiện tại là đúng nhưng cần biết phần nào đang được consumer phụ thuộc.

</details>

<details>
<summary><b>Q4. Khi nào nên giữ duplication?</b></summary>

Khi hai đoạn giống syntax nhưng thuộc knowledge/domain khác nhau và có khả năng thay đổi độc lập. Tránh gom chúng thành abstraction buộc release/coupling chung.

</details>

<details>
<summary><b>Q5. Đánh giá refactor có thành công không bằng gì?</b></summary>

Kiểm tra behavior giữ nguyên, test/deploy risk, khả năng thay đổi tiếp theo và metrics như lead time, defect rate, số nơi cần sửa. Số dòng giảm không phải thước đo đủ.

</details>

<details>
<summary><b>Q6. Làm migration lớn mà không big-bang thế nào?</b></summary>

Dùng expand-contract/strangler: thêm contract mới tương thích, chuyển consumer theo bước, đo kết quả, rồi ngừng và xóa đường cũ khi đã xác nhận không còn traffic.

</details>

## 7. Ứng dụng vào CV

- Refactor **[module/system]** theo các bước nhỏ có characterization tests, giảm thời gian triển khai thay đổi từ **[A] ngày xuống [B] giờ** mà không tăng escaped defects.
- Loại bỏ duplicated business rules trên **[N]** service, giảm inconsistency **[A]%** và số regression liên quan từ **[B] xuống [C] mỗi quý**.

## 8. Tài liệu tham khảo

- [Martin Fowler: Refactoring](https://martinfowler.com/books/refactoring.html)
- [Martin Fowler: Code Smell](https://martinfowler.com/bliki/CodeSmell.html)
- [Google Engineering Practices: Small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html)
- [Martin Fowler: Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html)
