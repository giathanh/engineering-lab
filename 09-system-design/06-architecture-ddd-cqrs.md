# Kiến trúc: Clean Architecture, Hexagonal, DDD cơ bản, CQRS, Event Sourcing

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- Clean/Hexagonal architectures đảo hướng dependency: domain/application policy không phụ thuộc framework/database; adapters implement ports.
- DDD tập trung ubiquitous language, bounded contexts, entities/value objects và aggregate invariants.
- CQRS tách write model và read model khi access patterns/scale/consistency justify; không bắt buộc phải dùng event sourcing.
- Event Sourcing lưu events làm source of truth, đòi hỏi schema evolution, replay, projections, snapshots và privacy/retention strategy.
- Kiến trúc là trade-off về change cost; layers/patterns không tự tạo maintainability nếu boundaries không khớp domain.

## 2. Khái niệm cốt lõi

Clean Architecture/Hexagonal đều đặt business rules ở trong, adapters/frameworks/databases ở ngoài. Dependency direction hướng inward; port là interface/contract cần thiết cho policy, adapter là implementation như SQL repository/HTTP client. Composition root nối implementation. Mục tiêu là thay đổi infrastructure ít ảnh hưởng core rules, không nhất thiết framework-free toàn bộ code.

DDD ubiquitous language giúp domain experts và engineers dùng cùng terms. Bounded context xác định meaning/model boundary; cùng từ “Account” có thể khác semantics ở Billing và Identity. Entity có identity/lifecycle; Value Object được định nghĩa bởi value, thường immutable. Aggregate là consistency boundary với root kiểm invariant và transaction scope; tránh aggregate lớn khiến lock/contention/network writes tăng.

CQRS tách command model (validate/update state) khỏi query/read model (optimized views). Có thể cùng database/schema ban đầu; async projection tạo eventual consistency/read lag cần hiển thị. Event Sourcing ghi append-only domain events thay current state, rebuild projections bằng replay. Events là historical facts, không commands; schema evolution/upcasting, deterministic handlers, event ordering, snapshots, replay throughput, PII deletion/GDPR và operational tooling là chi phí lớn.

## 3. Code ví dụ

Value Object enforce money currency/amount invariant; domain logic không phụ thuộc ORM.

```ts
type Currency = 'USD' | 'EUR';

class Money {
	readonly minorUnits: number;
	readonly currency: Currency;

	constructor(minorUnits: number, currency: Currency) {
		if (!Number.isSafeInteger(minorUnits)) throw new RangeError('Invalid amount');
		this.minorUnits = minorUnits;
		this.currency = currency;
		Object.freeze(this);
	}

	add(other: Money): Money {
		if (other.currency !== this.currency) throw new Error('Currency mismatch');
		return new Money(this.minorUnits + other.minorUnits, this.currency);
	}
}
```

TypeScript readonly chỉ ngăn gán qua type checking; ví dụ còn dùng Object.freeze để khóa các own properties ở runtime. Freeze chỉ shallow, nhưng hai field ở đây đều primitive. Validate currency tại boundary nếu dữ liệu đến từ JSON/JavaScript. Production money model cần rounding/exchange-rate policy; đây là ví dụ domain invariant, không phải full accounting implementation.

## 4. Trade-off & Best practices

- Dùng ports/adapters cho external boundaries và policy có khả năng biến động; tránh interface cho mọi pure function.
- Bounded context nhỏ với domain language/data ownership rõ; context mapping ở integration boundaries.
- Aggregate transaction scope giữ invariant; entity khác aggregate giao tiếp qua IDs/domain events, không load giant object graph.
- CQRS chỉ khi read/write models có nhu cầu khác biệt rõ; bắt đầu synchronous/same DB nếu đủ.
- Event Sourcing khi history/audit/replay/domain events là requirement cốt lõi, không chỉ vì cần event bus.
- Với projections, theo dõi lag, idempotent handlers, rebuild/checkpoint và versioned event schema.
- Đừng để aggregates thay thế application workflow orchestration: use case có thể điều phối nhiều aggregates nhưng invariants cục bộ vẫn thuộc từng aggregate root. Integration events chỉ phát sau commit và không nên leak internal domain model.
- Thực thi privacy/retention legally; immutable event log có thể cần crypto-shredding/tokenization thay xóa event đơn giản.

## 5. Lỗi thường gặp / Pitfalls

- Tạo nhiều layer/interface nhưng dependency vẫn hướng ra ngoài hoặc business logic nằm trong ORM/framework.
- DDD chỉ là rename table thành Aggregate mà không enforce invariants/boundaries.
- Aggregate quá lớn hoặc repository trả toàn bộ graph cho mọi use case.
- Dùng CQRS + Event Sourcing cho CRUD domain không có replay/history needs.
- Mutate past events hoặc replay handler không deterministic.
- Không có projection rebuild, schema upcasting, event versioning hoặc lag monitoring.
- Nghĩ architecture pattern tự đảm bảo team ownership/maintainability.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Hexagonal Architecture là gì?</b></summary>

Core policy giao tiếp qua ports; infrastructure adapters implement ports. Dependency direction hướng vào core, cho phép thay adapter mà không đổi business rules.

</details>

<details>
<summary><b>Q2. Bounded context giải quyết gì?</b></summary>

Định nghĩa boundary nơi model/terms có meaning nhất quán. Integration giữa contexts cần explicit contracts/mapping thay shared universal model.

</details>

<details>
<summary><b>Q3. Aggregate root chịu trách nhiệm gì?</b></summary>

Enforce invariants trong consistency boundary và là entry point cho mutation. Boundary quá rộng làm contention/cost tăng.

</details>

<details>
<summary><b>Q4. CQRS có cần Event Sourcing?</b></summary>

Không. Có thể tách command/query models với cùng source database; Event Sourcing là quyết định lưu events làm source of truth riêng.

</details>

<details>
<summary><b>Q5. Event Sourcing có trade-off gì?</b></summary>

Replay/history/audit mạnh, nhưng event schema/versioning, projections, snapshots, operational complexity và privacy deletion trở nên khó.

</details>

## 7. Ứng dụng vào CV

- Tách domain policy khỏi persistence/framework qua ports/adapters cho **[N]** use cases, giảm test setup **[A]%** và migration effort **[B]%**.
- Xây CQRS projections/event replay cho **[domain]**, giảm reporting latency **[A]%** với projection lag dưới **[B] giây**.

## 8. Tài liệu tham khảo

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Martin Fowler: Bounded Context](https://martinfowler.com/bliki/BoundedContext.html)
- [Martin Fowler: CQRS](https://martinfowler.com/bliki/CQRS.html)
- [Martin Fowler: Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
