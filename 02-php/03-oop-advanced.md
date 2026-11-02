# OOP nâng cao: interface, abstract, trait, late static binding, magic methods, closures

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Interface mô tả contract; abstract class chia sẻ implementation/state có chủ đích; trait tái sử dụng method nhưng không tạo subtype contract.
- Late static binding (`static::`) giữ class thực tế được gọi qua inheritance; `self::` bind theo class nơi method được định nghĩa.
- Magic methods tích hợp object với PHP syntax/runtime, nhưng contract ẩn và side effect làm code khó debug nếu lạm dụng.
- Closure có thể capture biến theo value/reference; arrow function tự capture biến ngoài theo value, còn closure thường khai báo `use` rõ ràng.
- Dùng composition/DI khi behavior biến đổi độc lập; trait nên nhỏ, cohesive và tránh state ẩn.

## 2. Khái niệm cốt lõi

Interface là abstraction cho caller: class implement phải cung cấp method contract, có thể implement nhiều interface. Abstract class có thể giữ invariant/state và method dùng chung, nhưng PHP chỉ cho kế thừa một class. Chọn interface khi muốn khả năng thay implementation; abstract class khi có quan hệ base thực sự và behavior chung ổn định.

Trait là cơ chế reuse implementation bằng compile-time composition. Trait có thể khai báo property/method và dùng `insteadof`/`as` để xử lý conflict; nó không phải object, không tạo polymorphic boundary riêng. Nhiều trait chứa state hoặc override hook khiến class cuối khó hiểu thứ tự behavior.

`self::` truy cập member theo class lexical nơi code nằm; `static::` dùng late static binding, resolve class thực tế ở runtime. `parent::` gọi implementation của parent. Điều này quan trọng với factory method, fluent static API và template method trong hierarchy. Static dispatch không thay thế composition nếu subclasses có nhiều trục biến đổi.

Magic methods như `__get`, `__set`, `__call`, `__invoke`, `__serialize` được runtime gọi trong tình huống đặc biệt. Chúng hữu ích cho proxy/interoperability, nhưng làm static analysis và autocomplete kém rõ, có thể biến typo thành property access hợp lệ. PHP 8+ có type constraints/visibility rules rõ hơn, nhưng vẫn nên dùng public methods/property khai báo tường minh cho domain API.

Closure là object `Closure`, có thể truyền như callable. Anonymous function dùng `use ($x)` để capture snapshot value hoặc `use (&$x)` để capture reference; arrow function `fn($y) => $x + $y` capture outer variables theo value. `$this` trong closure phụ thuộc context/binding; static closure không bind `$this` và hữu ích khi không cần object scope. Closure giữ captured object sống lâu hơn, cần lưu ý trong callback/event loop.

## 3. Code ví dụ

Ví dụ late static binding cho factory method; `static` return type cho phép subclass trả về instance subtype. Chạy được với PHP 8.3+.

```php
<?php
declare(strict_types=1);

abstract class Record
{
	public static function make(): static
	{
		return new static(); // Resolve the called class, not only this base class.
	}
}

final class Invoice extends Record {}

$invoice = Invoice::make();
var_dump($invoice instanceof Invoice); // bool(true)
```

Nếu thay `new static()` bằng `new self()`, PHP cố khởi tạo class khai báo `Record` và ném `Error` vì đây là abstract class; nó không tạo `Invoice`. Với base class concrete, `new self()` tạo base instance và còn có thể vi phạm return type `static` khi gọi từ subclass. Với domain behavior phức tạp, ưu tiên injected factory/service thay vì static factory phụ thuộc inheritance.

## 4. Trade-off & Best practices

- Thiết kế interface theo consumer role; interface nhỏ giảm coupling và cho phép fake/test adapter.
- Abstract class dùng để chia sẻ invariant ổn định; tránh base class chứa nhiều protected mutable state mà subclass phải hiểu nội bộ.
- Giữ trait stateless hoặc state rõ ràng; tránh trait phụ thuộc tên property/method không khai báo trong contract.
- Magic method chỉ dùng ở boundary cần framework/proxy interoperability; public behavior nghiệp vụ nên có method typed, dễ tìm và refactor.
- Dùng closure để đóng gói callback/strategy; capture tối thiểu, tránh giữ `$this` hoặc object graph lớn trong queue dài hạn.
- Dùng `static` return type/late binding khi factory inheritance có ý nghĩa; không lạm dụng static utility làm global dependency.
- Kiểm tra variance: parameter có thể contravariant, return covariant theo rules PHP; thay đổi signature cần giữ substitutability.

## 5. Lỗi thường gặp / Pitfalls

- Nhầm trait với interface và kỳ vọng trait tạo polymorphism/contract.
- Dùng `self::` trong base method nhưng mong subclass override static member được resolve.
- Thêm nhiều trait có method/property trùng tên, khiến precedence và alias trở thành logic khó theo dõi.
- Dùng `__get` để che property không tồn tại hoặc typo; lỗi chỉ xuất hiện muộn khi runtime.
- Capture biến bằng reference trong closure callback dài hạn, tạo shared mutable state ngoài dự kiến.
- Tạo abstract base class chỉ để reuse vài dòng, khóa hierarchy và làm các implementation không liên quan phụ thuộc nhau.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Interface khác abstract class?</b></summary>

Interface định nghĩa contract để nhiều implementation thay thế nhau; abstract class có thể chia sẻ state/implementation và là một nhánh kế thừa đơn. Dùng abstraction theo nhu cầu caller và reuse.

</details>

<details>
<summary><b>Q2. Trait khác composition object thế nào?</b></summary>

Trait ghép method vào class khi compile, không có identity/lifecycle riêng; composition object ủy quyền qua collaborator runtime và tạo boundary thay thế rõ hơn.

</details>

<details>
<summary><b>Q3. `self::` và `static::` khác nhau ra sao?</b></summary>

`self::` bind theo class định nghĩa code; `static::` dùng late static binding theo class được gọi cuối cùng. `parent::` gọi implementation của parent.

</details>

<details>
<summary><b>Q4. Khi nào nên dùng magic methods?</b></summary>

Khi cần tích hợp một protocol/runtime behavior như serialization hoặc proxy, có contract rõ và test. Không dùng để thay API domain tường minh vì giảm discoverability và static analysis.

</details>

<details>
<summary><b>Q5. Closure capture value/reference khác nhau?</b></summary>

`use ($x)` giữ giá trị được capture tại thời điểm tạo closure; `use (&$x)` chia sẻ biến qua reference nên thay đổi hai chiều. Arrow function tự capture outer variables theo value.

</details>

<details>
<summary><b>Q6. Vì sao static closure hữu ích?</b></summary>

Nó không bind `$this`, làm dependency rõ và tránh giữ object instance ngoài ý muốn trong callback sống lâu. Dùng khi closure không cần instance scope.

</details>

## 7. Ứng dụng vào CV

- Tách contract và implementation qua interface/DI, giảm coupling giữa **[N]** adapter và rút thời gian thay vendor từ **[A] ngày xuống [B] giờ**.
- Loại bỏ magic access/trait state ẩn trên **[module]**, cải thiện static-analysis coverage lên **[A]%** và giảm regression **[B]%**.

## 8. Tài liệu tham khảo

- [PHP: Object Interfaces](https://www.php.net/manual/en/language.oop5.interfaces.php)
- [PHP: Traits](https://www.php.net/manual/en/language.oop5.traits.php)
- [PHP: Late Static Bindings](https://www.php.net/manual/en/language.oop5.late-static-bindings.php)
- [PHP: Anonymous functions](https://www.php.net/manual/en/functions.anonymous.php)
