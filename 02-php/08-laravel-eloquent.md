# Laravel Eloquent: relationships, N+1, eager loading, query scope, transaction

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- Eloquent model là Active Record: object đại diện row và cung cấp query/persistence API; tiện nhưng có thể kéo persistence concerns vào domain.
- N+1 xảy ra khi query collection rồi lazy-load relation từng record; eager loading (`with`) gom query theo relation, không nhất thiết là một SQL JOIN.
- Projection (`select`), indexes, pagination/chunking và query count cần đi cùng eager loading để kiểm soát payload và memory.
- Local/global scopes đóng gói query constraints; global scope có thể ẩn filter và cần cẩn trọng với admin/reporting paths.
- `DB::transaction` bảo vệ nhiều thao tác DB atomic; side effect bên ngoài nên sau commit/outbox, không giả định DB rollback được email/API.

## 2. Khái niệm cốt lõi

Eloquent relationship methods trả relation/query builder và định nghĩa foreign/local keys. Truy cập property như `$post->comments` có thể lazy-load; truy cập method `$post->comments()` cho phép compose query. Lazy loading dễ đọc nhưng vòng lặp collection có thể tạo N+1: 1 query posts + N query authors. Eager loading `Post::with('author')->get()` thường chạy query gốc và query relation bằng `WHERE IN`; nested relations cần chỉ định rõ.

Eager loading tránh N+1 nhưng không bảo đảm query tối ưu: có thể nạp quá nhiều cột, relation collection lớn, hoặc lặp dữ liệu nếu dùng joins. `withCount`, `withExists`, aggregate queries và constrained eager loads giúp lấy đúng dữ liệu. `Model::preventLazyLoading()` trong development/test có thể làm lộ truy cập ngầm; production policy tùy workload/version.

Scopes đóng gói reusable constraints. Local scopes tường minh tại call site; global scopes tự động áp dụng, ví dụ soft deletes/tenant filter, nhưng có thể bị `withoutGlobalScope` bỏ qua. Multi-tenant security cần enforce ở architecture, không dựa vào developer nhớ gọi scope thủ công.

Transaction bảo đảm atomicity/isolation theo database semantics. Eloquent `DB::transaction()` rollback khi exception thoát closure; retry attempts có thể được cấu hình với deadlock handling. Không giữ transaction dài khi gọi network. Event/model observers và jobs có timing cụ thể; dispatch external side effect trước commit có thể khiến consumer đọc dữ liệu chưa commit hoặc gửi notification dù rollback.

## 3. Code ví dụ

Model `Post`/`Comment` có quan hệ hasMany; query chọn đúng columns và lấy comment count mà không tải toàn bộ comments.

```php
<?php
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Post extends Model
{
	public function comments(): HasMany
	{
		return $this->hasMany(Comment::class);
	}
}

// Query in a controller/service; the model has a comments_count attribute.
$posts = Post::query()
	->select(['id', 'title'])
	->withCount('comments')
	->latest()
	->paginate(25);
```

Nếu eager-load relation thay vì dùng count, giữ foreign/local keys cần thiết trong projection để Eloquent match models. `paginate` trả total count query; với dataset rất lớn và infinite scroll, `cursorPaginate` có thể hiệu quả hơn nếu sort key phù hợp/indexed.

## 4. Trade-off & Best practices

- Bật query logging/Debugbar/Telescope cục bộ và theo dõi query count/duration ở staging; đừng tối ưu chỉ dựa số lượng query, xem rows, indexes và payload.
- Eager load relation cần cho view/API; dùng constrained eager loading, `withCount`, `select` để giảm data transfer.
- Dùng pagination và `chunkById`/`lazyById` cho batch lớn; tránh `get()` toàn bộ table và offset pagination với dataset lớn thay đổi liên tục.
- Định nghĩa scopes rõ, test tenant/soft-delete boundaries, tránh global scope có hidden behavior trong path nhạy cảm.
- Giữ transaction ngắn; phát event/job sau commit (`afterCommit`) hoặc dùng outbox cho reliable cross-system side effects.
- Khi transaction có retry, callback có thể chạy lại; chỉ chứa thao tác DB idempotent hoặc kiểm soát side effect riêng.
- Dùng raw SQL/query builder khi cần query phức tạp/performance, nhưng parameterize input và giữ business semantics/test coverage.

## 5. Lỗi thường gặp / Pitfalls

- Dùng `$posts->each(fn ($post) => $post->author)` làm N+1 trên collection.
- Eager-load quan hệ lớn mà không constrain, đổi nhiều query nhỏ thành memory blow-up.
- Bỏ foreign key khỏi `select` rồi relation hydration không match được.
- Gọi `withoutGlobalScopes()` thiếu authorization/tenant constraints.
- Gửi email/dispatch event trong transaction trước commit rồi rollback DB.
- Gọi external API trong transaction, giữ lock/connection lâu và tạo retry duplication.
- Dùng `chunk()` với cập nhật cột sắp xếp khiến record bị bỏ/đọc lặp; chọn cursor strategy phù hợp.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. N+1 là gì và eager loading xử lý ra sao?</b></summary>

Một query lấy N parent rồi mỗi parent lazy-load relation riêng, tạo 1+N queries. Eager loading batch-load relation theo key set; vẫn cần kiểm tra payload/query plan.

</details>

<details>
<summary><b>Q2. `with()` có luôn tạo JOIN?</b></summary>

Không. Eloquent thường chạy query parent và query relation riêng, sau đó hydrate/match models. Join có trade-off duplicate rows và aggregate semantics.

</details>

<details>
<summary><b>Q3. Khi nào dùng `withCount`?</b></summary>

Khi cần số lượng relation nhưng không cần load toàn bộ models; database tính aggregate hiệu quả hơn kéo collection lên PHP.

</details>

<details>
<summary><b>Q4. Local scope khác global scope?</b></summary>

Local scope được gọi tường minh; global scope tự áp dụng cho query model và có thể gây behavior ẩn hoặc bị bypass. Tenant/security rules cần test ở mọi access path.

</details>

<details>
<summary><b>Q5. Vì sao side effect nên after commit?</b></summary>

Consumer bên ngoài không tham gia DB transaction. Nếu side effect chạy trước commit, nó có thể thấy dữ liệu chưa tồn tại hoặc xảy ra dù transaction rollback.

</details>

<details>
<summary><b>Q6. `chunk` hay cursor pagination?</b></summary>

Chunk phù hợp batch xử lý với memory giới hạn; cursor pagination dùng keyset để duyệt dataset lớn ổn định hơn offset. Chọn theo ordering, khả năng mutation và index.

</details>

## 7. Ứng dụng vào CV

- Loại bỏ N+1 và tối ưu projection/index trên **[N]** API endpoints, giảm query count **[A]%** và p95 latency từ **[B] ms xuống [C] ms**.
- Chuyển side effects sang after-commit/outbox cho checkout flow, giảm notification lệch trạng thái **[A]%** qua **[B] giao dịch/ngày**.

## 8. Tài liệu tham khảo

- [Laravel 11: Eloquent Relationships](https://laravel.com/docs/11.x/eloquent-relationships)
- [Laravel 11: Eloquent](https://laravel.com/docs/11.x/eloquent)
- [Laravel 11: Database Transactions](https://laravel.com/docs/11.x/database#database-transactions)
- [Laravel 11: Queues and after commit](https://laravel.com/docs/11.x/queues#jobs-and-database-transactions)

