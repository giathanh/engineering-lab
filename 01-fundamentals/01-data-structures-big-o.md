# Data structures & Big-O thường gặp (array, hash map, tree, heap, graph)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Big-O mô tả tốc độ tăng của thời gian hoặc bộ nhớ theo kích thước input, không phải số mili giây cố định.
- Array/list tối ưu truy cập theo index; hash map tối ưu lookup trung bình; tree giữ cấu trúc thứ tự; heap tối ưu lấy min/max; graph mô hình hóa quan hệ tổng quát.
- Phân biệt worst-case, average-case và amortized complexity. Append của dynamic array thường amortized O(1), dù đôi lúc phải resize O(n).
- Chọn cấu trúc theo thao tác nóng, thứ tự, memory overhead, tính ổn định và invariant cần duy trì.
- Big-O tốt không tự động nhanh hơn: constant factor, locality, allocation và kích thước dữ liệu thực tế đều ảnh hưởng.

## 2. Khái niệm cốt lõi

Big-O là cận tiệm cận khi input $n$ tăng. Bỏ qua constant và thành phần bậc thấp: $3n^2 + 5n + 2$ là O($n^2$). Khi phân tích code, xác định đơn vị input, số lần lặp lồng nhau, chi phí thao tác bên trong và memory phụ. Hai vòng lặp nối tiếp thường O(n), còn lồng nhau thường O(n²), nhưng vòng lặp trong chạy log n thì là O(n log n).

| Cấu trúc | Truy cập/tìm kiếm | Thêm/xóa phổ biến | Điểm cần nhớ |
|---|---:|---:|---|
| Dynamic array | index O(1), tìm value O(n) | cuối amortized O(1), giữa O(n) | contiguous, locality tốt, resize có thể copy |
| Hash map | trung bình O(1), worst O(n) | trung bình O(1) | cần hash/equality đúng; tốn bucket/metadata |
| Balanced BST | O(log n) | O(log n) | giữ thứ tự; tree không cân bằng có thể O(n) |
| Binary heap | top O(1), tìm tùy ý O(n) | push/pop O(log n) | phù hợp priority queue, không phải sorted array |
| Graph adjacency list | duyệt O(V + E) | tùy cấu trúc | hợp graph thưa; adjacency matrix tốn O(V²) |

Hash map ánh xạ key qua hash function vào bucket. Collision được xử lý bằng chiến lược nội bộ; nếu hash distribution xấu, thao tác có thể suy giảm. Key phải có equality/hash semantics ổn định trong thời gian lưu. Tree có invariant về thứ tự và cân bằng; AVL/Red-Black tree bảo đảm chiều cao logarithmic. Heap chỉ bảo đảm quan hệ cha-con theo priority, không sắp xếp toàn bộ phần tử.

Amortized analysis tính chi phí trung bình trên chuỗi thao tác, không phải xác suất. Dynamic array tăng capacity theo cấp số nhân: một lần append gây resize O(n), nhưng tổng chi phí n lần append là O(n), nên mỗi append amortized O(1). Space complexity cũng cần xét: recursive DFS có thể dùng O(depth) stack; BFS có thể giữ frontier lớn O(V).

## 3. Code ví dụ

Ví dụ dùng hash map để đếm tần suất trong một lượt, thay vì lặp lại `filter` cho mỗi giá trị. Chạy được bằng Node.js 22+.

```js
function frequencies(values) {
	const counts = new Map();
	for (const value of values) {
		counts.set(value, (counts.get(value) ?? 0) + 1);
	}
	return counts;
}

console.log([...frequencies(['a', 'b', 'a'])]);
// [['a', 2], ['b', 1]]
```

Với n phần tử, cách này trung bình O(n) thời gian và O(k) bộ nhớ cho k key riêng biệt. Cách tạo `new Set(values).map(value => values.filter(...))` có thể lên O(n²). Tuy nhiên, nếu input quá lớn không vừa memory, cần streaming count, partition hoặc external aggregation thay vì giữ toàn bộ map.

## 4. Trade-off & Best practices

- Bắt đầu từ workload: đọc theo index nhiều thì array; membership/count thì Set/Map; lấy phần tử ưu tiên liên tục thì heap; truy vấn theo range/order thì balanced tree hoặc database index.
- Ước lượng n và memory budget. Hash map cho lookup trung bình nhanh nhưng metadata/boxing có thể đắt hơn linear scan trên collection rất nhỏ.
- Đặt tên rõ cho complexity của public operation và kiểm tra complexity thực sự của thư viện/runtime được dùng.
- Với graph, adjacency list phù hợp graph thưa; matrix giúp kiểm tra cạnh O(1) nhưng chiếm O(V²). Chọn representation theo mật độ và thao tác chính.
- Đo benchmark với dữ liệu đại diện, warm-up runtime, nhiều lần chạy và profiling allocation. Tránh tối ưu dựa trên microbenchmark thiếu kiểm soát.
- Khi thiết kế API, cân nhắc invariant: sorted array cho binary search cần chi phí giữ thứ tự khi insert; heap cho top-k không cung cấp thứ tự đầy đủ.

## 5. Lỗi thường gặp / Pitfalls

- Nói hash lookup luôn O(1), bỏ qua collision, resize, key cost và worst-case.
- Nhầm tìm kiếm trong balanced BST với mọi binary tree; tree lệch có thể suy biến thành linked list.
- Xem append dynamic array là O(1) worst-case thay vì amortized O(1).
- Phân tích thuật toán chỉ theo thời gian mà quên recursive stack, output, cache và allocation.
- Dùng heap rồi kỳ vọng lấy phần tử bất kỳ hoặc duyệt theo thứ tự đã sắp; heap chỉ đảm bảo phần tử ưu tiên ở root.
- Dùng Big-O để kết luận hiệu năng cho input nhỏ mà không tính constant, locality hoặc chi phí tạo object.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. O(n) và amortized O(1) khác nhau thế nào?</b></summary>

O(n) mô tả một thao tác có chi phí tăng tuyến tính; amortized O(1) nghĩa là chi phí trung bình trên chuỗi thao tác bị chặn hằng số, dù một số thao tác riêng lẻ đắt hơn.

</details>

<details>
<summary><b>Q2. Khi nào hash map không phải lựa chọn tốt?</b></summary>

Khi cần thứ tự/range query, memory overhead quá cao, key khó hash ổn định hoặc collection nhỏ đến mức linear scan đơn giản hơn.

</details>

<details>
<summary><b>Q3. Heap và balanced BST khác nhau ở đâu?</b></summary>

Heap tối ưu xem/lấy min hoặc max với O(log n) update nhưng không hỗ trợ tìm tùy ý có thứ tự. Balanced BST hỗ trợ lookup, insert, delete theo key O(log n) và iteration có thứ tự.

</details>

<details>
<summary><b>Q4. Khi nào dùng adjacency list thay matrix?</b></summary>

Graph thưa và cần duyệt neighbor thường xuyên: list có memory O(V + E). Matrix phù hợp graph dày hoặc cần kiểm tra có cạnh giữa hai node thường xuyên với O(1), đổi lại O(V²) memory.

</details>

<details>
<summary><b>Q5. Vì sao Big-O không đủ để chọn implementation?</b></summary>

Big-O bỏ constant và hành vi runtime/hardware. Với n nhỏ, cache locality và allocation có thể khiến thuật toán bậc cao hơn chạy nhanh; cần benchmark trên workload thực.

</details>

<details>
<summary><b>Q6. Phân tích complexity của hai vòng lặp lồng nhau thế nào?</b></summary>

Không kết luận máy móc là O(n²); xem số vòng thực tế. Nếu inner loop giảm n theo một nửa thì tổng có thể O(n log n); nếu mỗi cặp được duyệt thì O(n²).

</details>

## 7. Ứng dụng vào CV

- Thay lookup lặp O(n²) bằng index Map cho pipeline xử lý **[N]** records, giảm runtime từ **[A] phút xuống [B] giây** và giữ memory trong **[C] GB**.
- Thiết kế priority queue/graph representation phù hợp cho **[feature]**, cải thiện throughput **[A]%** khi dữ liệu tăng từ **[B] lên [C] phần tử**.

## 8. Tài liệu tham khảo

- [Big-O notation (OpenDSA)](https://opendsa-server.cs.vt.edu/ODSA/Books/Everything/html/AnalIntro.html)
- [MDN: Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
- [MIT OpenCourseWare: Introduction to Algorithms](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/)
- [Open Data Structures](https://opendatastructures.org/)
