# GraphQL: schema, resolver, N+1 (DataLoader), so sánh REST

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- GraphQL schema định nghĩa types, fields, arguments và operations; resolver map field requests tới data sources.
- Client chọn fields và nested graph; flexibility giảm over/under-fetching nhưng tăng query cost/authorization complexity.
- N+1 xuất hiện khi resolver fetch relation riêng cho từng parent; DataLoader batch + cache trong request scope.
- GraphQL không tự nhanh hơn REST; cần query depth/complexity limits, pagination, persisted queries và observability.
- Authorization nên được enforce trong data/service layer theo object/field, không chỉ ẩn field trên schema.

## 2. Khái niệm cốt lõi

Schema-first hoặc code-first đều tạo GraphQL type system: object, scalar, enum, interface, union, input object. Query đọc, Mutation thay đổi, Subscription stream events; operation cần validation/authorization/execution trước resolver. Resolver được gọi theo field tree, parent result đi xuống child resolvers. Nullability (`T` vs `T!`) quyết định error propagation: lỗi non-null field có thể bubble tới parent nullable boundary.

GraphQL cho client điều khiển selection set, nhưng server vẫn cần enforce field-level access, pagination và cost. Một query nested sâu/rộng có thể tạo nhiều DB/API operations. Depth limit không đủ nếu field có high cardinality; complexity budget nên gắn cost/arguments. Persisted/allowlisted queries giảm arbitrary query surface cho first-party clients, nhưng không thay auth.

N+1: resolver lấy list N posts rồi mỗi `author` resolver query riêng. DataLoader gom keys trong một event-loop turn thành batch query và map result về đúng thứ tự; cache thường request-scoped để không leak tenant/auth data giữa requests. DataLoader không thay indexing/query design và có thể cần chunk batch khi key count lớn.

REST resource endpoints, HTTP caching/CDN và operational simplicity thường tốt cho public/simple APIs; GraphQL hữu ích cho nhiều clients cần shape dữ liệu khác nhau hoặc graph relationships. Có thể kết hợp GraphQL gateway/federation, nhưng schema ownership/versioning/error semantics phức tạp.

## 3. Code ví dụ

Resolver dùng DataLoader để batch author lookup; minh họa generic GraphQL server contract.

```js
const resolvers = {
	Post: {
		author: (post, _args, { loaders }) => loaders.authorById.load(post.authorId),
	},
};

function createLoaders(repository) {
	return {
		authorById: new DataLoader(async (ids) => {
			const authors = await repository.findByIds(ids);
			const byId = new Map(authors.map((author) => [author.id, author]));
			return ids.map((id) => byId.get(id) ?? null); // Preserve input order.
		}),
	};
}
```

Tạo loaders per request với auth/tenant context; DataLoader batch function phải trả đúng số phần tử theo thứ tự keys.

## 4. Trade-off & Best practices

- Thiết kế schema theo client/domain concepts, không expose DB tables trực tiếp.
- Batch resolver access bằng DataLoader hoặc join/project query; instrument resolver-level latency and query counts.
- Áp dụng pagination bắt buộc cho lists, max depth/complexity, rate limit và request timeout.
- Authorization ở service/repository theo object/field; query có thể request nested private field sâu.
- Định nghĩa error policy: GraphQL có thể trả `data` một phần cùng `errors`; clients phải xử lý path/error codes.
- Dùng persisted queries/caching phù hợp; POST query bodies không tự nhận HTTP CDN cache như GET.
- Federation/schema stitching chỉ khi team/domain boundaries justify operational complexity.

## 5. Lỗi thường gặp / Pitfalls

- Dùng DataLoader singleton toàn process, cache dữ liệu user/tenant giữa requests.
- Chỉ giới hạn query depth, nhưng cho phép list arguments không giới hạn hoặc resolver cost lớn.
- Return ORM entities nguyên trạng làm lộ fields/authorization gaps.
- Nhầm GraphQL validation error với partial execution errors.
- Tạo resolver gọi downstream service tuần tự cho từng item.
- Versioning schema bằng cách xóa field ngay thay vì deprecation/consumer migration.
- Nghĩ client chọn fields đồng nghĩa server không thể overfetch internally.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. DataLoader giải quyết gì?</b></summary>

Batch và memoize key loads trong request scope để giảm N+1. Batch function phải map kết quả đúng thứ tự và loader không được chia sẻ auth-sensitive cache giữa requests.

</details>

<details>
<summary><b>Q2. GraphQL có thay REST hoàn toàn?</b></summary>

Không. REST đơn giản cho resource/cache semantics; GraphQL hữu ích khi clients cần flexible graph selection. Có thể coexist theo use case.

</details>

<details>
<summary><b>Q3. Non-null error propagation là gì?</b></summary>

Nếu resolver của non-null field lỗi/null, error bubble tới parent; nếu parent cũng non-null tiếp tục bubble đến nullable boundary, có thể null hóa phần lớn data.

</details>

<details>
<summary><b>Q4. Vì sao depth limit chưa đủ?</b></summary>

Shallow query vẫn có thể request list khổng lồ hoặc expensive fields. Cần complexity/cost analysis và pagination limits.

</details>

<details>
<summary><b>Q5. DataLoader cache có scope nào?</b></summary>

Thường per request để dedupe loads trong operation và giữ auth/tenant isolation. Cache lâu hơn cần explicit invalidation/security design.

</details>

## 7. Ứng dụng vào CV

- Loại bỏ resolver N+1 bằng request-scoped DataLoaders, giảm DB round trips **[A]%** và p95 GraphQL latency **[B]%**.
- Triển khai query complexity/pagination policies cho **[N]** clients, ngăn resource-exhaustion queries mà vẫn giữ flexible schema.

## 8. Tài liệu tham khảo

- [GraphQL Learn](https://graphql.org/learn/)
- [GraphQL Specification](https://spec.graphql.org/)
- [DataLoader](https://github.com/graphql/dataloader)
- [Apollo Server: Performance and caching](https://www.apollographql.com/docs/apollo-server/performance/caching)
