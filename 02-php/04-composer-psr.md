# Composer, autoloading PSR-4, các PSR quan trọng (PSR-1/4/7/12/15)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Composer giải quyết dependency graph, version constraints, lockfile, autoloading và package scripts; `composer.lock` quyết định dependency versions có thể tái lập.
- PSR-4 ánh xạ namespace prefix sang thư mục; autoload optimized/classmap giúp production không phải dò file lặp lại.
- PSR-1/12 thống nhất coding style; PSR-7 mô hình hóa HTTP messages immutable; PSR-15 định nghĩa middleware và request handler contract.
- `require` khai báo dependency runtime, `require-dev` dành cho tooling/test; `install` theo lockfile, `update` giải lại constraint và có thể thay nhiều package.
- SemVer constraints là khoảng tương thích được khai báo, không bảo đảm package thực sự không có breaking change.

## 2. Khái niệm cốt lõi

Composer đọc `composer.json`, giải constraint thành dependency graph và lưu kết quả cụ thể vào `composer.lock`. Ứng dụng thường commit cả hai file; library thường commit `composer.json` và để consumer resolve lock riêng. `composer install` cài đúng lock đã khóa nếu có; `composer update` chạy solver lại trong khoảng constraint, nên nên update có chủ đích và review diff. `composer.lock` của root project không được dùng như lock bắt buộc cho consumer library.

Autoload PSR-4 ánh xạ namespace prefix, ví dụ `App\\` tới `src/`. Khi class `App\\Domain\\Order` được yêu cầu, loader đổi phần namespace còn lại thành path tương ứng. Prefix cần có trailing namespace separator để tránh match nhầm; nhiều path cho một prefix có thể được cấu hình nhưng cần nhất quán. Composer có thể generate autoloader optimized (`-o`) thành classmap; authoritative classmap nhanh hơn nhưng class mới tạo runtime/dynamic không có trong map sẽ không được resolve.

PSR-1 yêu cầu naming/structure cơ bản; PSR-12 quy định coding style. PSR-7 mô hình hóa request/response/URI/stream với immutable-style methods: thay header thường trả message mới, không mutate object cũ. PSR-15 định nghĩa `RequestHandlerInterface` và `MiddlewareInterface` cho pipeline HTTP framework-agnostic. PSR chỉ định nghĩa contract, không bắt buộc implementation; bridge/adapter giúp nối framework khác nhau.

## 3. Code ví dụ

Cấu hình package tối giản và cách chạy autoload. Đặt class `App\Service\Greeter` trong `src/Service/Greeter.php`; `composer dump-autoload` sẽ generate loader.

```json
{
	"require": { "php": ">=8.3" },
	"autoload": { "psr-4": { "App\\": "src/" } }
}
```

```php
<?php
require __DIR__ . '/vendor/autoload.php';

$greeter = new App\Service\Greeter();
echo $greeter->greet('Ada'), PHP_EOL;
```

Trong project thực tế, `composer validate --strict` kiểm tra metadata, `composer install` cài theo lockfile và `composer dump-autoload -o` tối ưu loader cho production. Không sửa file trong `vendor/`; nâng cấp thông qua constraint và lockfile.

## 4. Trade-off & Best practices

- Pin PHP/platform requirement trong `config.platform` khi cần giải dependency tương thích production; vẫn phải chạy test trên PHP runtime thực tế.
- Giữ constraint đủ rộng để consumer giải dependency nhưng có policy update và CI matrix; app nên dựa lockfile để reproducibility.
- Phân biệt package library và application: library thường không commit lock; application nên commit lock.
- Chạy `composer install --no-dev --classmap-authoritative` hoặc `-o` phù hợp deployment và autoload model; authoritative không hợp dynamic class generation nếu chưa map.
- Giữ package scripts deterministic; tránh script install chạy code tùy ý trong môi trường có secret/quyền cao.
- Dùng PSR để giảm coupling ở boundaries; không cần ép mọi class nội bộ phải implement PSR nếu contract không mang lợi ích.
- Review security advisories, package maintenance, transitive dependencies và license policy; `composer audit` là một lớp kiểm tra, không phải security guarantee.

## 5. Lỗi thường gặp / Pitfalls

- Không commit `composer.lock` cho application, khiến production/CI resolve versions khác nhau.
- Chạy `composer update` toàn bộ trong hotfix nhỏ mà không review thay đổi transitive packages.
- PSR-4 namespace/case không khớp tên file; máy local case-insensitive có thể che lỗi production Linux.
- Dùng `require-dev` cho dependency cần trong runtime, khiến production install `--no-dev` bị thiếu package.
- Sửa trực tiếp `vendor/` hoặc `vendor/composer/autoload_*`; các thay đổi sẽ bị ghi đè.
- Nhầm PSR-7 immutable object với native PHP mutable object; bỏ return value của `withHeader()` nên header không đổi.
- Dùng classmap authoritative trong ứng dụng plugin/dynamic class mà không bổ sung classmap.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. `composer install` khác `composer update` thế nào?</b></summary>

`install` cài versions từ lockfile; `update` giải lại dependency constraints và ghi versions mới vào lockfile. Update nên được review/test như một thay đổi dependency riêng.

</details>

<details>
<summary><b>Q2. PSR-4 autoload hoạt động ra sao?</b></summary>

Namespace prefix được map tới thư mục; phần namespace còn lại trở thành đường dẫn file theo convention. Composer generate loader để resolve class khi được dùng.

</details>

<details>
<summary><b>Q3. Vì sao app commit lockfile nhưng library thường không?</b></summary>

Application cần cài tái lập một dependency graph cụ thể. Library cần để mỗi consumer giải graph phù hợp với dependency khác của họ; lockfile library không điều khiển graph của consumer.

</details>

<details>
<summary><b>Q4. PSR-7 message immutable có ý nghĩa gì?</b></summary>

Method như `withHeader()` trả message mới thay vì mutate instance; caller phải giữ return value. Điều này giúp middleware composition dễ dự đoán.

</details>

<details>
<summary><b>Q5. `require-dev` dùng cho gì?</b></summary>

Dependency chỉ cần trong development/test/quality tooling. Production có thể cài `--no-dev`; dependency runtime phải nằm trong `require`.

</details>

<details>
<summary><b>Q6. Có thể coi SemVer constraint là bảo đảm không breaking?</b></summary>

Không tuyệt đối. Constraint thể hiện policy tương thích kỳ vọng; package có thể vi phạm hoặc có behavioral breaking change không bị type/API check phát hiện. Lockfile, changelog và test vẫn cần thiết.

</details>

## 7. Ứng dụng vào CV

- Chuẩn hóa Composer lock/install và PSR-4 autoload cho **[N]** PHP services, giảm lỗi khác biệt dependency giữa môi trường **[A]%**.
- Tách HTTP middleware theo PSR-15/PSR-7 boundary, tái sử dụng authentication/logging trên **[N]** ứng dụng và giảm duplication **[A]%**.

## 8. Tài liệu tham khảo

- [Composer documentation](https://getcomposer.org/doc/)
- [PSR-4: Autoloader](https://www.php-fig.org/psr/psr-4/)
- [PSR-7: HTTP Message Interface](https://www.php-fig.org/psr/psr-7/)
- [PSR-15: HTTP Server Request Handlers](https://www.php-fig.org/psr/psr-15/)
- [PHP-FIG: PSR-12](https://www.php-fig.org/psr/psr-12/)

