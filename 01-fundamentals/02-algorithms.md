# Thuật toán hay hỏi: sort, search, two pointers, sliding window, BFS/DFS, DP cơ bản

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- Trước khi code, làm rõ input constraints, output, duplicate/null behavior, thứ tự và giới hạn memory; các constraints thường quyết định thuật toán.
- Binary search cần invariant chính xác; two pointers/sliding window thường tận dụng dữ liệu có thứ tự hoặc điều kiện cửa sổ đơn điệu.
- BFS tìm đường ít cạnh nhất trong graph không trọng số; DFS phù hợp traversal, cycle/component và backtracking.
- Dynamic programming (DP) tái sử dụng overlapping subproblems; bài tối ưu cần optimal substructure, còn DP cũng giải bài đếm/kiểm tra tồn tại; xác định state, transition, base case, thứ tự tính.
- Sort/search không chỉ là chọn tên thuật toán: cân nhắc stability, memory, comparator, worst-case và việc input đã gần có thứ tự hay chưa.

## 2. Khái niệm cốt lõi

Quy trình giải bài: xác định mô hình dữ liệu → viết brute force đúng → tính complexity → tìm tính chất giúp giảm công việc → chứng minh invariant → kiểm tra boundary. Brute force là baseline hữu ích để đối chiếu test, không phải thất bại.

Sorting phổ biến: merge sort O(n log n) worst-case với memory phụ O(n), stable; heapsort O(n log n), in-place nhưng không stable; quicksort trung bình O(n log n), worst O(n²) nếu pivot xấu, dù implementation thực tế thường có safeguard. Thuật toán built-in sort phụ thuộc runtime: V8 dùng Timsort cho Array, còn ECMAScript yêu cầu stable sort từ ES2019 nhưng không quy định thuật toán hay complexity. JavaScript `sort()` mutate array và mặc định so sánh dạng string; sort số cần comparator như `(a, b) => a - b`. Dùng `toSorted()` khi cần tạo array mới trên runtime hỗ trợ. Stability quan trọng khi sort nhiều tiêu chí tuần tự.

Binary search yêu cầu predicate đơn điệu hoặc array sorted. Chọn interval `[low, high)` hay inclusive rồi duy trì invariant từ đầu đến cuối. Tránh midpoint overflow trong ngôn ngữ fixed-width bằng `low + (high - low) / 2`; trong JavaScript Number, giới hạn integer chính xác cũng cần lưu ý.

Two pointers dùng hai index tiến có quy luật, ví dụ pair sum trên sorted array hoặc merge hai chuỗi. Sliding window là biến thể giữ một interval liên tiếp; thường O(n) khi mỗi pointer chỉ tiến về phía trước. Với cửa sổ co/giãn theo điều kiện tổng, không áp dụng máy móc khi có số âm: điều kiện “tăng cửa sổ làm sum tăng” có thể không còn đúng.

BFS dùng queue với enqueue/dequeue amortized O(1), duyệt theo lớp, complexity O(V + E) với adjacency list; trong JavaScript có thể dùng array và con trỏ head thay vì `shift()` lặp lại; phù hợp shortest path trên graph unweighted. DFS dùng recursion hoặc explicit stack; recursion có thể tràn stack trên graph sâu. DP mô hình hóa bài toán theo state: Fibonacci là ví dụ đơn giản, nhưng interview thường cần chứng minh state đủ thông tin để quyết định bước tiếp theo.

## 3. Code ví dụ

Sliding window tính tổng lớn nhất của mảng con liên tiếp độ dài `k`, với input số nguyên và `1 <= k <= values.length`.

```js
function maxWindowSum(values, k) {
	if (!Number.isInteger(k) || k < 1 || k > values.length) {
		throw new RangeError('k must be between 1 and values.length');
	}

	let windowSum = 0;
	for (let index = 0; index < k; index++) windowSum += values[index];
	let best = windowSum;

	for (let right = k; right < values.length; right++) {
		windowSum += values[right] - values[right - k]; // Add incoming, remove outgoing.
		best = Math.max(best, windowSum);
	}
	return best;
}

console.log(maxWindowSum([2, -1, 4, 3, -2], 2)); // 7
```

Mỗi phần tử được thêm/bỏ tối đa một lần nên O(n) thời gian, O(1) bộ nhớ. Invariant là `windowSum` luôn bằng tổng của đúng k phần tử kết thúc tại `right`.

## 4. Trade-off & Best practices

- Viết brute force trước nếu giúp hiểu semantics, sau đó tối ưu dựa trên constraints và chứng minh complexity.
- Binary search: nêu invariant (ví dụ vùng còn khả năng chứa answer), xử lý duplicate và biên rỗng; test `0`, `1`, answer đầu/cuối, không tồn tại.
- BFS/DFS: dùng visited khi graph có cycle; xác định directed/undirected và xử lý node không liên thông. Với BFS shortest path, đánh dấu visited khi enqueue để tránh queue trùng.
- DP: đặt tên state theo nghĩa nghiệp vụ, viết recurrence trước code; thử memoized recursion trước rồi bottom-up/space optimization nếu cần.
- Với sort comparator, bảo đảm thứ tự nhất quán/transitive và xử lý equality; dùng comparator thay vì tự trừ giá trị nếu có nguy cơ overflow ở ngôn ngữ số nguyên fixed-width.
- Trình bày cả thời gian và memory, bao gồm output, call stack và cấu trúc phụ.

## 5. Lỗi thường gặp / Pitfalls

- Binary search cập nhật `low = mid` hoặc `high = mid` sai với interval, gây vòng lặp vô hạn.
- Dùng sliding window co/giãn dựa vào tổng cho dữ liệu âm khi điều kiện đơn điệu không tồn tại; cửa sổ độ dài cố định như ví dụ vẫn dùng được với số âm.
- BFS không đánh dấu visited đúng lúc nên node được enqueue nhiều lần; hoặc dùng DFS để tìm shortest path unweighted.
- DP state thiếu biến quyết định tương lai, dẫn đến recurrence sai dù code có vẻ hợp lý.
- Đệ quy sâu trên input lớn gây stack overflow; chuyển sang stack/queue iterative khi cần.
- Chỉ test happy path, bỏ empty input, duplicates, boundary k, disconnected graph và cycle.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Khi nào dùng BFS thay vì DFS?</b></summary>

BFS khi cần shortest path theo số cạnh trong graph không trọng số hoặc duyệt theo tầng. DFS phù hợp traversal, cycle/component và backtracking; với trọng số dương cần thuật toán như Dijkstra.

</details>

<details>
<summary><b>Q2. Điều kiện để dùng binary search?</b></summary>

Phải có thứ tự hoặc predicate đơn điệu giúp loại bỏ một nửa không gian tìm kiếm mỗi bước. Nêu rõ interval và invariant để tránh lỗi biên.

</details>

<details>
<summary><b>Q3. Sliding window khác two pointers thế nào?</b></summary>

Sliding window giữ một đoạn liên tiếp và cập nhật trạng thái khi biên di chuyển; two pointers là pattern rộng hơn, có thể cùng hướng hoặc hai đầu và không nhất thiết đại diện cửa sổ liên tiếp.

</details>

<details>
<summary><b>Q4. DP cần những tính chất nào?</b></summary>

Có các subproblem lặp lại và recurrence cho phép xây đáp án từ state nhỏ. Optimal substructure cần cho DP tối ưu; DP đếm số cách hoặc kiểm tra tồn tại không nhất thiết có mục tiêu tối ưu. Cần xác định state đủ thông tin, transition, base case và thứ tự tính.

</details>

<details>
<summary><b>Q5. Stability của sorting có ý nghĩa gì?</b></summary>

Phần tử bằng nhau giữ relative order ban đầu. Hữu ích khi sort nhiều key qua nhiều lượt hoặc khi order trước đó mang ý nghĩa.

</details>

<details>
<summary><b>Q6. Làm sao giảm lỗi off-by-one khi binary search?</b></summary>

Chọn một interval convention, phát biểu invariant, chứng minh mỗi nhánh giữ invariant và đảm bảo interval giảm. Test biên rỗng, một phần tử, đầu/cuối và duplicate.

</details>

## 7. Ứng dụng vào CV

- Tối ưu truy vấn tìm kiếm/ghép dữ liệu từ O(n²) xuống O(n log n) bằng sorting và two pointers, rút runtime batch **[A]%** trên **[N] records**.
- Thiết kế BFS/DP cho **[feature]**, giảm thời gian phản hồi từ **[A] ms xuống [B] ms** trong khi giữ memory dưới **[C] MB**.

## 8. Tài liệu tham khảo

- [MIT OpenCourseWare: Introduction to Algorithms](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/)
- [CP-Algorithms](https://cp-algorithms.com/)
- [VisuAlgo](https://visualgo.net/en)
- [MDN: Array.prototype.sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)


- [V8: Stable Array.prototype.sort](https://v8.dev/features/stable-sort)
