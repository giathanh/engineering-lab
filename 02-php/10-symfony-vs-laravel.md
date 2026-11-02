# (Tùy chọn) Symfony: so sánh với Laravel, DI component

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Laravel là full-stack framework ưu tiên developer productivity, conventions và tích hợp sản phẩm; Symfony là framework/component ecosystem với cấu hình và component boundaries rõ.
- Cả hai dùng Composer, HTTP abstractions, dependency injection, routing, middleware/event concepts; chúng khác defaults, lifecycle và style hơn là “một framework tốt tuyệt đối”.
- Symfony components được dùng độc lập trong nhiều hệ thống, kể cả Laravel; Laravel cũng có thể chạy với Symfony HTTP components.
- Chọn theo team experience, domain, ecosystem, operational constraints và migration cost; benchmark/convention cần gắn workload cụ thể.
- DI container/autowiring giảm wiring thủ công nhưng cần explicit boundaries, lifecycle và compile/config validation.

## 2. Khái niệm cốt lõi

Laravel cung cấp convention-led application structure, Eloquent ORM, service providers, facades, queues, scheduler, Blade và tích hợp first-party. Mục tiêu là giảm decision overhead và đưa developer từ feature tới production nhanh. Trade-off là nhiều behavior đi qua convention/facade/magic, nên cần hiểu framework lifecycle, query behavior và state khi dùng long-running workers.

Symfony cung cấp reusable components (HttpFoundation, HttpKernel, DependencyInjection, Console, EventDispatcher, Serializer, Messenger, v.v.) và full-stack framework với bundle/configuration ecosystem. Symfony container compile service graph, hỗ trợ autowiring/autoconfiguration nhưng production container thường được compile/cache. Cấu hình có thể explicit hơn, learning curve lớn hơn; đổi lại componentization và control phù hợp hệ thống có integration/domain boundaries phức tạp.

Hai hệ sinh thái không hoàn toàn loại trừ nhau: Laravel dùng một số Symfony components; Symfony components có thể dùng trong app thuần PHP hoặc framework khác. “Symfony DI component” là container library, không đồng nghĩa phải dùng full Symfony framework. Tương tự, Laravel container có thể dùng cho package/app cần convention Laravel.

## 3. Code ví dụ

Ví dụ service constructor-injected có thể hoạt động trong cả hai framework sau khi container đăng ký/auto-wire class. Đây là business service độc lập, không phụ thuộc facade hay request global.

```php
<?php
declare(strict_types=1);

final class InvoiceService
{
	public function __construct(private InvoiceRepository $invoices) {}

	public function findForCustomer(int $invoiceId, int $customerId): Invoice
	{
		return $this->invoices->findOwnedBy($invoiceId, $customerId);
	}
}
```

Trong Symfony, service có thể được autowired theo type và cấu hình service resource; trong Laravel, container resolve constructor dependencies và interface cần binding nếu không có concrete mapping. Authorization vẫn nên được kiểm tra rõ ở application/policy boundary, không dựa vào framework container.

## 4. Trade-off & Best practices

- Chọn Laravel khi conventions, Eloquent/queues/integrations và tốc độ delivery phù hợp; chọn Symfony khi component flexibility/configuration hoặc ecosystem hiện tại đem lại giá trị đo được.
- Đánh giá hiring pool, onboarding, ecosystem package, support horizon, upgrade cadence và chi phí vận hành; tránh chọn theo benchmark hoặc sở thích cá nhân duy nhất.
- Giữ domain/application services framework-light tại nơi cần khả năng test/reuse; không tách mọi thứ khỏi framework nếu tạo thêm boilerplate không có giá trị.
- Dùng DI cho boundary và dependencies có thể thay; tránh service locator, hidden global access và container resolution tùy tiện trong domain.
- Với migration, có thể thay từng boundary bằng Symfony components hoặc migrate route/module có kiểm soát thay vì rewrite big-bang.
- Profile request/query/serialization trong cùng deployment; framework overhead thường nhỏ hơn database, network và thiết kế workload.

## 5. Lỗi thường gặp / Pitfalls

- So sánh Laravel và Symfony như hai lựa chọn không thể kết hợp, bỏ qua shared Symfony components.
- Chọn framework chỉ theo tốc độ benchmark “hello world” hoặc số lượng abstraction.
- Autowire mọi class không kiểm soát, vô tình đăng ký service/lifecycle quá rộng hoặc mơ hồ.
- Chuyển framework nhưng giữ nguyên architecture coupling, chỉ đổi cú pháp mà không giảm migration risk.
- Đánh giá Laravel Facade hoặc Symfony Bundle theo stereotype, không dựa trên cách dùng và boundary thực tế.
- Không test container compilation/configuration trong CI, để lỗi wiring chỉ xuất hiện khi deploy.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Khác biệt định hướng chính giữa Laravel và Symfony?</b></summary>

Laravel ưu tiên convention và integrated developer experience; Symfony cung cấp component ecosystem/configuration rõ và control cao. Cả hai đều có thể xây hệ thống lớn; fit phụ thuộc team/domain/operations.

</details>

<details>
<summary><b>Q2. Dùng Symfony components trong Laravel được không?</b></summary>

Được nếu package/version tương thích; Laravel đã dùng nhiều Symfony components. Nên dùng component khi nó giải quyết boundary cụ thể và không tạo hai nguồn abstraction chồng lặp.

</details>

<details>
<summary><b>Q3. Autowiring có thay thế configuration không?</b></summary>

Không hoàn toàn. Autowiring suy ra dependency từ type, nhưng interface mapping, scalar config, lifecycle và alias vẫn cần cấu hình rõ.

</details>

<details>
<summary><b>Q4. Khi nào nên chọn framework-neutral service?</b></summary>

Khi business policy cần test/reuse độc lập hoặc framework migration có likelihood/cost đáng kể. Không cần loại bỏ mọi framework integration khỏi app.

</details>

<details>
<summary><b>Q5. Vì sao container compile/cache quan trọng?</b></summary>

Compile graph/config vào deployment giúp giảm runtime discovery và phát hiện wiring error sớm. Cache phải được build/invalidate đồng bộ với deploy.

</details>

<details>
<summary><b>Q6. Đo hiệu năng framework thế nào?</b></summary>

Dùng endpoint/workload thực, cùng PHP/OPcache/database/network/config, đo throughput và latency percentile. Tách bootstrap, query, serialization và I/O trước khi kết luận.

</details>

## 7. Ứng dụng vào CV

- Thiết kế framework-neutral application boundary cho **[N]** modules, cho phép migrate/tích hợp component mà không rewrite domain logic, giảm migration effort **[A]%**.
- Chuẩn hóa DI/container compilation và CI wiring tests, giảm lỗi cấu hình production **[A]%** qua **[B] lần release**.

## 8. Tài liệu tham khảo

- [Symfony Components](https://symfony.com/components)
- [Symfony Dependency Injection](https://symfony.com/doc/current/components/dependency_injection.html)
- [Laravel Service Container](https://laravel.com/docs/11.x/container)
- [Laravel: Using Symfony Components](https://laravel.com/docs/11.x/requests)

