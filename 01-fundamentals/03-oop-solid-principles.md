# OOP, SOLID, DRY/KISS/YAGNI, composition vs inheritance

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- OOP tổ chức state và behavior quanh object; encapsulation bảo vệ invariant, polymorphism cho phép thay implementation qua contract.
- SOLID là heuristic để quản lý coupling/change, không phải checklist áp dụng máy móc.
- Composition thường linh hoạt hơn inheritance khi hành vi có thể thay đổi độc lập; inheritance phù hợp quan hệ subtype thực sự theo Liskov Substitution Principle.
- DRY giảm duplication của knowledge; KISS giảm complexity; YAGNI tránh xây abstraction/feature chưa có nhu cầu.
- Ưu tiên dependency inversion vào abstraction ở boundary, nhưng abstraction cũng có chi phí và cần xuất phát từ biến động thực tế.

## 2. Khái niệm cốt lõi

Encapsulation không chỉ là private fields; đó là bảo đảm object chỉ chuyển giữa các trạng thái hợp lệ qua API. Abstraction ẩn chi tiết không cần thiết cho caller. Polymorphism cho phép cùng một contract có nhiều implementation. Inheritance tái sử dụng code nhưng đồng thời tạo coupling giữa lớp cha-con và ràng buộc behavioral substitution.

SOLID gồm:

- **SRP**: module có một nhóm lý do thay đổi gắn kết, không có nghĩa mỗi class chỉ một method.
- **OCP**: mở rộng behavior mà hạn chế sửa code ổn định; đạt qua composition/strategy khi có trục biến đổi thật.
- **LSP**: subtype thay thế base type mà không phá kỳ vọng contract, pre/postcondition hay invariant.
- **ISP**: interface nhỏ theo nhu cầu consumer, tránh buộc caller phụ thuộc method không dùng.
- **DIP**: policy cấp cao không phụ thuộc chi tiết cấp thấp; cả hai dựa vào abstraction phù hợp.

DRY nhắm tới duplication của knowledge/rule, không phải mọi dòng code giống nhau. Hai đoạn code giống cú pháp nhưng thuộc hai domain rule khác nhau có thể cần tách; ngược lại, cùng một invariant bị sao chép nhiều nơi nên có một nguồn sự thật. KISS là chọn thiết kế dễ hiểu nhất đáp ứng nhu cầu. YAGNI trì hoãn capability chưa được xác nhận, không phải cớ bỏ qua thiết kế có khả năng mở rộng hợp lý.

Composition ghép object nhỏ để tạo behavior, giúp thay collaborator và test dễ hơn. Inheritance có thể phù hợp hierarchy ổn định, nhưng subclass dễ phụ thuộc protected state, template method và lifecycle ngầm. Câu hỏi quan trọng không phải “code reuse bằng cách nào?” mà là “behavior nào biến đổi, contract nào cần giữ, ai sở hữu invariant?”.

## 3. Code ví dụ

Ví dụ dùng composition và dependency injection: service phụ thuộc contract dạng function, dễ thay gateway trong test mà không cần kế thừa.

```js
export function createOrderService({ paymentGateway, orderRepository }) {
	return {
		async place(order) {
			if (order.items.length === 0) throw new Error('Order must contain items');
			const payment = await paymentGateway.charge(order.total, order.currency);
			return orderRepository.save({ ...order, paymentId: payment.id });
		},
	};
}

// Production injects real adapters; a unit test can inject deterministic fakes.
```

Service sở hữu policy “đơn phải có items” và orchestration; gateway/repository là chi tiết bên ngoài. Không cần tạo interface/class riêng nếu JavaScript function/object contract đã đủ; abstraction nên phản ánh boundary thực, không phải nghi thức.

## 4. Trade-off & Best practices

- Đặt invariant gần nơi sở hữu state; tránh public mutable fields làm mọi caller có thể tạo trạng thái vô hiệu.
- Tách policy khỏi I/O và framework ở mức cần thiết; inject clock, transport hoặc repository khi chúng là trục biến đổi/test boundary.
- Dùng inheritance khi subtype đáp ứng contract base trong mọi trạng thái hợp lệ. Nếu subclass phải ném “không hỗ trợ” cho method base, interface/base có thể quá rộng.
- Không tạo interface cho mọi class mặc định. Tạo abstraction khi có nhiều implementation, boundary cần thay thế, hoặc test isolation mang giá trị thực.
- Refactor duplication sau khi hiểu domain semantics; “rule giống nhau” cần một owner, “code giống nhau” chưa chắc là cùng knowledge.
- Áp dụng SOLID theo chi phí thay đổi: modularity hữu ích khi thay đổi có xác suất/thực tế, còn abstraction sớm làm code khó theo dõi.

## 5. Lỗi thường gặp / Pitfalls

- Hiểu SRP là “một class chỉ làm một việc” mà không xác định actor/reason for change.
- Tạo abstraction/interface cho mọi implementation, dẫn đến indirection không mang lợi ích.
- Dùng inheritance chỉ để tái sử dụng vài dòng, tạo coupling và fragile base class.
- Gọi mọi đoạn lặp là vi phạm DRY, rồi gom hai domain rule khác nhau vào helper chung khó thay đổi.
- Nhầm DIP với việc mọi thứ phải dùng interface; dependency inversion là hướng phụ thuộc về policy, không nhất thiết thêm ceremony.
- Áp dụng OCP bằng plugin framework tổng quát cho một trường hợp đơn giản, làm tăng mental model và maintenance cost.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. SRP thực sự nói về điều gì?</b></summary>

Một module nên có trách nhiệm gắn với một nhóm actor/reason for change. Không phải giới hạn số method; mục tiêu là thay đổi từ một concern không kéo theo concern khác.

</details>

<details>
<summary><b>Q2. Khi nào composition tốt hơn inheritance?</b></summary>

Khi behavior cần thay độc lập, có nhiều chiều biến thể hoặc subtype không thực sự thỏa contract base. Composition giảm coupling hierarchy nhưng có thể cần wiring tường minh.

</details>

<details>
<summary><b>Q3. Giải thích LSP bằng dấu hiệu vi phạm.</b></summary>

Subtype không thể thay base mà caller vẫn đúng kỳ vọng, ví dụ subtype siết precondition hoặc bỏ behavior base. Khi đó model/interface nên được chia lại.

</details>

<details>
<summary><b>Q4. DRY khác “tránh mọi duplication” thế nào?</b></summary>

DRY tập trung vào một knowledge/rule có nhiều nguồn sự thật. Code trùng hình thức nhưng thuộc business rule khác nhau có thể thay đổi độc lập và không nên bị ép dùng chung.

</details>

<details>
<summary><b>Q5. Dependency Injection có luôn cần container?</b></summary>

Không. Constructor/function parameter là DI. Container chỉ hữu ích khi composition graph đủ lớn; container cũng thêm cấu hình và runtime indirection cần kiểm soát.

</details>

<details>
<summary><b>Q6. Làm sao cân bằng OCP với YAGNI?</b></summary>

Tách điểm biến động đã biết và có cost thay đổi cao; không xây extension point cho giả định chưa có nhu cầu. Thiết kế nhỏ, refactor khi có evidence.

</details>

## 7. Ứng dụng vào CV

- Tách orchestration khỏi framework và payment/storage adapters theo composition, giảm thời gian thêm payment provider mới từ **[A] ngày xuống [B] giờ**.
- Refactor **[N]** module có nhiều lý do thay đổi thành boundary rõ theo SOLID, giảm regression liên quan coupling **[A]%** qua **[B] release**.

## 8. Tài liệu tham khảo

- [Martin Fowler: Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html)
- [Robert C. Martin: The Liskov Substitution Principle](https://web.archive.org/web/20150905084153/http://www.objectmentor.com/resources/articles/lsp.pdf)
- [Martin Fowler: Refactoring](https://martinfowler.com/books/refactoring.html)
- [SOLID principles (Microsoft Learn)](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/architectural-principles)
