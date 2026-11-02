# Design patterns: Singleton, Factory, Strategy, Observer, Decorator, Adapter, Repository, DI

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Design pattern là tên gọi cho cách giải quyết vấn đề cấu trúc lặp lại; pattern không thay thế việc hiểu constraint và domain.
- Strategy thay đổi thuật toán/hành vi qua contract; Factory tập trung tạo object; Adapter chuyển interface; Decorator bổ sung behavior theo lớp.
- Observer/Event giúp publisher phát thông báo mà không biết consumer; cần quản lý lifecycle, ordering, retry và delivery semantics.
- Repository tách persistence khỏi domain/application khi abstraction đó có ích; không nhất thiết bọc mọi ORM call.
- Singleton có thể gây global state và test coupling; DI là cách quản lý dependency graph, không bắt buộc phải có container.

## 2. Khái niệm cốt lõi

Pattern thường được chia thành creational, structural và behavioral. Giá trị của pattern là tạo vocabulary và chỉ ra trade-off, không phải mục tiêu “dùng càng nhiều càng tốt”. Pattern không xử lý được boundary sai, domain model yếu hay concurrency semantics thiếu rõ ràng.

- **Singleton** giới hạn một instance/access point trong một scope. Hữu ích với resource có lifecycle thật sự duy nhất, nhưng global accessor che dependency và gây state shared giữa test/request. Trong server, “một instance” cần định nghĩa theo process, container hay toàn cluster.
- **Factory** đóng gói quyết định tạo implementation phù hợp với input/configuration. Tránh để caller biết constructor phức tạp hoặc class cụ thể.
- **Strategy** đóng gói các thuật toán thay thế được sau cùng một contract, như cách tính phí theo loại khách hàng.
- **Observer** cho nhiều subscriber nhận event mà publisher không phụ thuộc trực tiếp. Event nội bộ đồng bộ khác message broker: delivery, ordering, durability và retry không mặc nhiên giống nhau.
- **Decorator** bọc một component cùng contract để thêm logging, caching, retry hoặc authorization. Thứ tự decorator có thể đổi semantics.
- **Adapter** chuyển interface hiện có sang interface mà client mong muốn, hữu ích khi tích hợp vendor/legacy API.
- **Repository** cung cấp abstraction cho việc lấy/lưu aggregate hoặc domain data. Nó hữu ích khi bảo vệ domain khỏi persistence details, nhưng có thể trùng lặp khả năng query của ORM.
- **Dependency Injection (DI)** truyền dependency từ composition root thay vì tự tạo bên trong consumer. Constructor injection thường thể hiện dependency rõ nhất.

## 3. Code ví dụ

Ví dụ Strategy: chính sách giao hàng có thể thay theo loại mà không nhồi điều kiện vào checkout. Code chạy bằng Node.js 22+.

```js
const deliveryStrategies = {
	standard: (weightKg) => 5 + weightKg * 1.2,
	express: (weightKg) => 12 + weightKg * 2.5,
};

export function calculateDeliveryFee(weightKg, service) {
	if (!Number.isFinite(weightKg) || weightKg < 0) throw new RangeError('Invalid weight');
	const strategy = Object.hasOwn(deliveryStrategies, service)
		? deliveryStrategies[service]
		: undefined;
	if (!strategy) throw new RangeError(`Unsupported service: ${service}`);
	return strategy(weightKg);
}

console.log(calculateDeliveryFee(2, 'express')); // 17
```

Trong ứng dụng thật, strategy có thể là class/function được inject từ config; nếu chỉ có một chính sách ổn định, bảng function này là đủ. Không cần hierarchy chỉ để “đúng pattern”.

## 4. Trade-off & Best practices

- Bắt đầu từ điểm biến động hoặc dependency khó thay; áp dụng pattern nhỏ nhất làm thay đổi đó dễ kiểm soát.
- Giữ composition root tập trung việc wiring. Consumer khai báo dependency; factory/container khởi tạo adapter cụ thể.
- Dùng event khi publisher và subscriber cần tách thời điểm/ownership, nhưng định nghĩa schema, ownership, idempotency, ordering và error handling.
- Decorator hữu ích cho cross-cutting behavior; ghi rõ order và tránh xếp nhiều lớp vô hình khiến debug khó.
- Repository nên biểu diễn nhu cầu domain/application (load/save/query cụ thể), không nhất thiết expose generic CRUD cho mọi entity.
- Singleton chỉ khi uniqueness/lifecycle là requirement; tránh dùng như shortcut để chia sẻ state toàn cục.

## 5. Lỗi thường gặp / Pitfalls

- Chọn pattern trước khi hiểu vấn đề, tạo abstraction thừa và thêm indirection.
- Singleton giữ mutable state trong server nhiều request, gây rò rỉ dữ liệu giữa tenant/request hoặc test.
- Factory biến thành switch khổng lồ với mọi loại logic; phân tách registry/plugin khi có nhu cầu thực.
- Observer không unsubscribe, gây listener leak hoặc xử lý event lặp; synchronous observer có thể block publisher.
- Retry Decorator lặp side effect không idempotent hoặc retry lỗi không transient.
- Repository bọc ORM một-một nhưng không tạo boundary; abstraction làm mất query capability cần thiết.
- Dùng DI container làm service locator để resolve tùy ý trong code, che dependency thực của class.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Strategy khác Factory thế nào?</b></summary>

Strategy thay đổi hành vi/thuật toán sau khi object được tạo; Factory đóng gói quyết định tạo object/implementation nào. Chúng có thể kết hợp nhưng giải quyết hai vấn đề khác nhau.

</details>

<details>
<summary><b>Q2. Khi nào Singleton gây vấn đề?</b></summary>

Khi trở thành global mutable state hoặc hidden dependency, gây test order coupling, concurrency issue và khó scale state qua nhiều process. Xác định scope và lifecycle trước khi dùng.

</details>

<details>
<summary><b>Q3. Event nội bộ khác message broker thế nào?</b></summary>

Event nội bộ thường cùng process, không có durability/replay mặc định; broker có thể cung cấp persistence, delivery/retry semantics và consumer độc lập. Cần nêu rõ guarantees thay vì gọi cả hai chung là event-driven.

</details>

<details>
<summary><b>Q4. Repository có phải luôn cần khi dùng ORM?</b></summary>

Không. Dùng khi boundary persistence/domain đáng giá hoặc cần thay/kiểm soát query behavior. Một wrapper chỉ chuyển tiếp ORM APIs có thể thêm abstraction mà không giảm coupling.

</details>

<details>
<summary><b>Q5. Decorator có thứ tự quan trọng không?</b></summary>

Có. Logging nằm trong retry sẽ ghi từng attempt; logging nằm ngoài retry thường chỉ bao quanh toàn operation; cache ngoài authorization có thể làm lộ dữ liệu nếu key/scope sai. Thứ tự là một phần semantics.

</details>

<details>
<summary><b>Q6. DI container và Dependency Injection có đồng nghĩa?</b></summary>

Không. DI là truyền dependency từ bên ngoài; container là công cụ tự động wiring. Có thể dùng constructor/function injection thủ công không cần container.

</details>

## 7. Ứng dụng vào CV

- Áp dụng Strategy/Factory để mở rộng **[N]** payment/delivery rules mà không sửa core flow, giảm lead time thêm provider từ **[A] ngày xuống [B] giờ**.
- Tách persistence và vendor API qua adapter/repository boundaries, giảm coupling trong **[N]** service và rút ngắn thời gian migration **[A]%**.

## 8. Tài liệu tham khảo

- [Refactoring.Guru: Design Patterns](https://refactoring.guru/design-patterns)
- [Martin Fowler: Dependency Injection](https://martinfowler.com/articles/injection.html)
- [Microsoft: Dependency injection guidelines](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection-guidelines)
- [Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com/)

