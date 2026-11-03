# Laravel core: service container, service provider, facade, middleware, request lifecycle

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Laravel HTTP lifecycle bắt đầu từ public entry point, bootstrap application/container, nhận request qua kernel/router/middleware, gọi controller rồi serialize response.
- Service container resolve constructor dependencies, quản lý binding/lifecycle và cho phép thay implementation ở composition boundary.
- Service provider là nơi đăng ký binding trong `register()` và setup phụ thuộc framework sau đó trong `boot()`.
- Facade là proxy tĩnh đến service trong container; tiện gọi nhưng có thể che dependency nếu dùng trong domain logic.
- Middleware tạo pipeline trước/sau request, phù hợp cross-cutting concerns; thứ tự middleware ảnh hưởng semantics và security.

## 2. Khái niệm cốt lõi

Laravel front controller (`public/index.php`) nạp Composer autoloader và bootstrap app từ `bootstrap/app.php`. Application bootstraps providers/configuration, rồi request đi qua HTTP kernel pipeline, global middleware, router, route middleware, controller/action, middleware xử lý response trên đường về, gửi response (`$response->send()`) rồi chạy terminable middleware (`terminate`). Exact internal methods thay đổi theo phiên bản, nhưng mental model quan trọng là dependency graph được container compose và request đi qua pipeline.

Container có thể tự resolve concrete class qua reflection khi constructor dependencies cũng resolve được (autowiring). Interface cần binding rõ ràng. `bind` tạo instance mới mỗi lần resolve; `singleton` giữ instance trong container; scoped lifecycle của framework phù hợp state theo request/job trong long-lived workers nếu được quản lý đúng. Không dùng singleton cho state mutable theo user/request.

Service provider chia registration (`register`) và bootstrapping (`boot`). Register nên bind services, không phụ thuộc provider khác đã boot; boot phù hợp đăng ký hooks/routes/events cần framework đã sẵn. Với Laravel 11, providers của ứng dụng được khai báo trong `bootstrap/providers.php`, còn cấu hình middleware thường đi qua `bootstrap/app.php`.

Facade cung cấp static-looking API nhưng resolve object từ container. Nó thuận tiện cho framework-level services và test có facade fakes, nhưng dependency không hiện ra constructor nên domain services dễ thành service locator. Middleware nhận request và continuation, có thể short-circuit hoặc post-process response; authentication, throttling, tracing là ví dụ boundary concerns.

## 3. Code ví dụ

Binding interface vào implementation trong provider và constructor injection ở consumer. Các class `PaymentGateway`/`StripePaymentGateway` là application types.

```php
<?php
// In a service provider's register() method:
$this->app->bind(
	PaymentGateway::class,
	StripePaymentGateway::class,
);

// Laravel resolves this dependency when constructing the controller.
final class CheckoutController
{
	public function __construct(private PaymentGateway $gateway) {}
}
```

Trong app Laravel 11, đăng ký provider trong `bootstrap/providers.php` nếu provider không được auto-discover. Binding nên phản ánh lifecycle: stateless adapter thường singleton-safe, request-specific context không nên giữ trong singleton.

## 4. Trade-off & Best practices

- Ưu tiên constructor injection cho application/domain services để dependency rõ và unit test đơn giản; dùng Facade ở framework boundary khi convention tăng readability.
- Chọn `bind`, `singleton`, `scoped` theo lifetime thật; test nhiều request/job trên cùng worker để phát hiện state leak.
- Giữ provider tập trung vào composition/configuration, không nhồi business logic vào `boot()`.
- Middleware nên có một concern và thứ tự được kiểm tra: authentication trước authorization, request ID trước logging, body parsing trước validation.
- Dùng route model binding tiện lợi nhưng authorization vẫn phải thực hiện; existence không đồng nghĩa quyền truy cập.
- Tách response mapping/error handling ở boundary và không để framework request/response types lan sâu vào domain nếu cần framework independence.
- Test container bindings và lifecycle đặc biệt khi dùng package, queue workers hoặc Octane.

## 5. Lỗi thường gặp / Pitfalls

- Binding interface không đúng namespace/token, khiến container không resolve hoặc resolve implementation sai.
- Gọi service có side effect trong `register()`/`boot()` khiến boot order khó đoán.
- Lưu authenticated user/request data trong singleton, gây cross-request leakage trên long-running worker.
- Lạm dụng Facade trong business logic, khiến dependency hidden và test phải mock global facade state.
- Nhầm route model binding với authorization, dẫn đến IDOR.
- Thay middleware ordering mà không test authentication, session, CSRF, CORS và exception behavior.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Service container làm gì?</b></summary>

Container quản lý bindings và xây dependency graph khi resolve service. Nó hỗ trợ inversion of control, nhưng không tự quyết định architecture hay ranh giới module.

</details>

<details>
<summary><b>Q2. `bind` khác `singleton` và `scoped`?</b></summary>

`bind` thường resolve instance mới; `singleton` giữ instance trong app/container lifecycle; `scoped` tái sử dụng trong scope hiện tại rồi flush khi scope kết thúc. Long-running worker cần lifecycle phù hợp.

</details>

<details>
<summary><b>Q3. Nên đặt code ở `register()` hay `boot()`?</b></summary>

Đăng ký container bindings trong `register`; `boot` cho setup cần providers/framework đã đăng ký. Tránh resolve dependency phụ thuộc boot order trong register.

</details>

<details>
<summary><b>Q4. Facade có phải static method thật?</b></summary>

Facade dùng static syntax nhưng forward đến service trong container. Điều này tiện dụng nhưng có thể che dependency và lifecycle.

</details>

<details>
<summary><b>Q5. Middleware phù hợp loại logic nào?</b></summary>

Cross-cutting request concerns như auth, rate limit, tracing và transformations. Business rules riêng của use case thường nên ở application/domain service.

</details>

<details>
<summary><b>Q6. Vì sao Laravel app cần test trên Octane/worker mode?</b></summary>

Container/process sống qua nhiều request/job; state hoặc singleton không reset có thể rò sang request sau dù code đúng trong PHP-FPM request-per-process assumptions.

</details>

## 7. Ứng dụng vào CV

- Chuẩn hóa container bindings và middleware pipeline trên **[N]** Laravel services, giảm thời gian thay provider tích hợp từ **[A] ngày xuống [B] giờ**.
- Phát hiện và loại bỏ request-scoped state khỏi singleton bindings, giảm lỗi cross-request **[A]%** khi chạy long-lived workers.

## 8. Tài liệu tham khảo

- [Laravel 11: Service Container](https://laravel.com/docs/11.x/container)
- [Laravel 11: Service Providers](https://laravel.com/docs/11.x/providers)
- [Laravel 11: Request Lifecycle](https://laravel.com/docs/11.x/lifecycle)
- [Laravel 11: Middleware](https://laravel.com/docs/11.x/middleware)

