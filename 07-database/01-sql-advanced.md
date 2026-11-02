# SQL nâng cao: JOIN, subquery, window function, CTE, GROUP BY

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- SQL khai báo kết quả mong muốn; optimizer chọn execution plan dựa statistics, indexes, cardinality và cost estimates.
- JOIN kết hợp rows theo predicate; filter ở `ON` hay `WHERE` khác nhau với outer joins.
- `GROUP BY` thu gọn rows thành groups; window functions tính trên partition nhưng giữ từng row.
- CTE đặt tên subquery cho readability/recursion; không mặc định là materialized hay tối ưu hơn subquery ở mọi DB/version.
- NULL biểu diễn unknown/missing; so sánh dùng three-valued logic, cần `IS NULL`, `COALESCE` và thiết kế semantics cẩn thận.

## 2. Khái niệm cốt lõi

Relational query xử lý bag/multiset semantics trong phần lớn trường hợp: duplicates có thể tồn tại nếu không dùng DISTINCT. Inner join chỉ giữ rows match; left join giữ mọi left rows và fill NULL phía không match. Đặt điều kiện bảng phải trong `WHERE` sau left join có thể biến nó thành effective inner join vì NULL bị loại. Nêu rõ join cardinality (one-to-one/one-to-many/many-to-many) giúp phát hiện row multiplication.

`GROUP BY` tạo một row cho mỗi group; aggregate như `COUNT`, `SUM`, `AVG` hoạt động trên group. `HAVING` filter sau aggregate, còn `WHERE` filter trước group. Window function (`row_number`, `rank`, `sum over`) giữ các rows, cho phép ranking/running totals theo partition/order. `ROWS` vs `RANGE` frame semantics có thể thay đổi kết quả, nhất là peers/ties.

CTE (`WITH`) giúp tách query thành bước có tên và hỗ trợ recursive hierarchy. Optimizer có thể inline/materialize tùy database/version/keyword; CTE không tự đảm bảo execution một lần hoặc nhanh hơn. Subquery có thể correlated, chạy logic theo outer row nhưng optimizer có thể decorrelate. `EXISTS` thường diễn đạt semi-join; chọn dựa semantics và plan, không folklore.

NULL khiến `NULL = NULL` không true mà unknown; `WHERE` chỉ giữ predicate true. `COUNT(*)` đếm rows, `COUNT(column)` bỏ NULL; `NOT IN` với subquery chứa NULL có thể trả kết quả bất ngờ, `NOT EXISTS` thường an toàn hơn. Transaction/consistency semantics gắn với query nhưng thuộc bài riêng.

## 3. Code ví dụ

Top 3 order mới nhất theo từng customer bằng window function; cú pháp chạy trên PostgreSQL và MySQL 8+.

```sql
WITH ranked_orders AS (
	SELECT
		customer_id,
		id,
		total,
		created_at,
		ROW_NUMBER() OVER (
			PARTITION BY customer_id
			ORDER BY created_at DESC, id DESC
		) AS position
	FROM orders
	WHERE status = 'paid'
)
SELECT customer_id, id, total, created_at
FROM ranked_orders
WHERE position <= 3
ORDER BY customer_id, created_at DESC, id DESC;
```

Tie-breaker `id` làm ordering deterministic. Nếu cần đồng hạng theo created_at, bỏ id khỏi ORDER BY bên trong window, rồi chọn RANK (hạng có khoảng trống) hoặc DENSE_RANK (ba mức timestamp khác nhau). Giữ id trong window sẽ khiến mọi row có hạng riêng nếu id unique; outer ORDER BY vẫn có thể dùng id để output ổn định.

## 4. Trade-off & Best practices

- Viết query theo business result và cardinality; kiểm tra duplicates trước khi thêm DISTINCT để che join lỗi.
- Dùng `EXISTS` khi chỉ cần kiểm tra presence; aggregate/window khi cần ranking/summary trên nhiều rows.
- Chọn tie-break ordering ổn định cho pagination/ranking; SQL không bảo đảm order nếu thiếu `ORDER BY`.
- CTE/subquery giúp readability; xem `EXPLAIN` nếu query critical, đặc biệt khi CTE được materialize hoặc lặp scans.
- Dùng explicit column list thay `SELECT *` trong APIs/large joins để giảm IO, tránh schema coupling.
- Xử lý NULL theo domain rule; nullable columns nên có semantics rõ, không dùng sentinel tùy tiện.
- Parameterize values để tránh SQL injection; values không thay được identifiers/order keywords, các phần đó cần allowlist.

## 5. Lỗi thường gặp / Pitfalls

- Filter bên phải trong `WHERE` làm mất NULL rows của `LEFT JOIN`.
- Aggregate sau join one-to-many nhân đôi totals/counts.
- Dùng `NOT IN` với nullable subquery và nhận empty results do three-valued logic.
- Tin thứ tự output tự nhiên không cần `ORDER BY`.
- Dùng `COUNT(column)` khi muốn đếm mọi rows, nhưng cột có NULL.
- Window frame mặc định không khớp ý định running aggregate/tie handling.
- Tách CTE mà cho rằng optimizer luôn materialize hoặc luôn inline.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. `WHERE` khác `HAVING`?</b></summary>

`WHERE` lọc rows trước grouping/aggregation; `HAVING` lọc groups sau aggregate. Dùng WHERE sớm khi predicate không phụ thuộc aggregate.

</details>

<details>
<summary><b>Q2. Window function khác GROUP BY?</b></summary>

Window function tính aggregate/rank theo partition nhưng giữ từng input row; GROUP BY thu gọn thành một row mỗi group.

</details>

<details>
<summary><b>Q3. Vì sao LEFT JOIN thành INNER JOIN?</b></summary>

Điều kiện ở WHERE yêu cầu giá trị bên phải không NULL; rows unmatched bị loại. Đưa predicate phù hợp vào ON nếu muốn giữ mọi left rows.

</details>

<details>
<summary><b>Q4. `COUNT(*)` khác `COUNT(col)`?</b></summary>

`COUNT(*)` đếm mọi row; `COUNT(col)` chỉ đếm giá trị non-NULL.

</details>

<details>
<summary><b>Q5. Tại sao `NOT IN` có thể bất ngờ?</b></summary>

Nếu subquery chứa NULL, so sánh tạo UNKNOWN theo three-valued logic và WHERE loại các rows đó. `NOT EXISTS` diễn đạt anti-join rõ hơn.

</details>

## 7. Ứng dụng vào CV

- Tái cấu trúc reporting queries bằng window functions/CTEs, giảm query time từ **[A] giây xuống [B] ms** trên **[N] rows**.
- Loại bỏ join multiplication và NULL logic bugs, cải thiện accuracy báo cáo **[A]%** cho **[N]** dashboards.

## 8. Tài liệu tham khảo

- [PostgreSQL: Window Functions](https://www.postgresql.org/docs/current/tutorial-window.html)
- [PostgreSQL: Table Expressions](https://www.postgresql.org/docs/current/queries-table-expressions.html)
- [MySQL: Window Functions](https://dev.mysql.com/doc/refman/8.4/en/window-functions.html)
- [Use The Index, Luke: SQL](https://use-the-index-luke.com/sql)

- [PostgreSQL: Window Functions và peer groups](https://www.postgresql.org/docs/current/functions-window.html)
