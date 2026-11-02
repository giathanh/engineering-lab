# Memory leak, profiling, debugging Node

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Memory leak là dữ liệu không còn cần thiết nhưng vẫn reachable từ GC roots; heap usage tăng theo thời gian/traffic là tín hiệu, không phải chẩn đoán cuối cùng.
- Theo dõi `heapUsed`, `external`, `arrayBuffers`, RSS, GC và request throughput; Buffer/native allocation có thể làm RSS tăng mà heap JS không tăng tương ứng.
- Heap snapshot giúp so sánh retaining paths; CPU profile, allocation sampling và `--inspect` giúp xác định loại vấn đề khác nhau.
- Snapshot có thể chứa secrets/PII và gây pause/memory spike; thu thập có kiểm soát, bảo vệ artifact và tránh tạo trên instance nhạy cảm tùy tiện.
- Sửa nguyên nhân giữ reference (listener, cache, timer, closure, queue) và xác nhận bằng load test sau fix.

## 2. Khái niệm cốt lõi

V8 dùng garbage collector để thu hồi object không còn reachable. Leak thường không phải “GC hỏng”, mà là một đường tham chiếu ngoài ý muốn từ root còn sống: global map, closure của timer, event listener không remove, cache không giới hạn hoặc queue producer nhanh hơn consumer.

Node có nhiều vùng memory. `heapUsed` là JS heap đang dùng; `heapTotal` là heap V8 đã cấp; `external` phản ánh memory native gắn với object JS; `arrayBuffers` gồm memory của ArrayBuffer/Buffer; RSS là tổng resident memory process. Một server có thể giữ heap ổn định nhưng RSS tăng do Buffer/native allocations hoặc fragmentation.

Quy trình chẩn đoán:

1. Tạo baseline và tái hiện workload đủ lâu, ghi memory theo thời gian cùng request rate.
2. Xác định heap hay external/RSS tăng; kiểm tra GC và giới hạn container.
3. Thu hai heap snapshots ở trạng thái tương đương, so sánh số lượng/retained size và tìm retaining path.
4. Dùng CPU profile nếu vấn đề là CPU; allocation sampling nếu cần tìm nơi cấp phát; heap snapshot nếu cần lý do object còn sống.
5. Sửa, chạy soak/load test và xác nhận đường memory ổn định sau nhiều chu kỳ GC.

## 3. Code ví dụ

Đo memory định kỳ bằng API built-in. Chỉ log metrics có sampling/aggregation trong service production; log mỗi giây có thể tạo noise.

```js
import { memoryUsage } from 'node:process';

const reportMemory = () => {
	const usage = memoryUsage();
	console.log({
		heapUsedMiB: Math.round(usage.heapUsed / 1024 / 1024),
		externalMiB: Math.round(usage.external / 1024 / 1024),
		arrayBuffersMiB: Math.round(usage.arrayBuffers / 1024 / 1024),
		rssMiB: Math.round(usage.rss / 1024 / 1024),
	});
};

const timer = setInterval(reportMemory, 10_000);
timer.unref();
```

Leak kinh điển là listener được thêm lặp lại nhưng không gỡ. Sửa bằng lifecycle rõ ràng: giữ reference đến handler, remove listener khi owner đóng; với cache, áp dụng giới hạn kích thước/TTL và eviction thay vì object map vô hạn.

## 4. Trade-off & Best practices

- Dùng metrics để phát hiện xu hướng, snapshot để giải thích object retained, CPU profile để xác định hot path. Chọn công cụ theo giả thuyết.
- Tái hiện gần production nhưng dùng dữ liệu đã scrub; heap snapshot và core dump có thể chứa thông tin nhạy cảm.
- Chạy profiling trên replica/canary hoặc thời điểm kiểm soát. Snapshot lớn có thể làm process pause, tiêu thụ thêm memory hoặc bị OOM.
- Thiết kế cache, listener, timer và queue có owner/lifecycle; mọi collection giữ dữ liệu lâu dài phải có giới hạn hoặc chính sách eviction.
- Trong container, đặt heap limit và memory limit có khoảng đệm cho native memory; không đặt `--max-old-space-size` bằng toàn bộ container memory.
- Debug leak bằng workload ổn định, warm-up, nhiều chu kỳ GC và so sánh retained size, không chỉ nhìn một lần RSS.

## 5. Lỗi thường gặp / Pitfalls

- Kết luận leak từ một lần tăng heap trong lúc traffic tăng; V8 giữ heap đã cấp để tái sử dụng.
- Chỉ xem `heapUsed`, bỏ qua Buffer/external memory hoặc RSS.
- Tạo snapshot production không đánh giá tác động, làm instance bị pause/OOM hoặc làm lộ dữ liệu trong artifact.
- Dùng `global.gc()` như cách chữa; explicit GC có thể dùng trong controlled diagnostic với `--expose-gc`, nhưng không thay thế lifecycle fix.
- Thêm cache để “tăng tốc” mà không có max size, TTL hoặc eviction.
- Dùng weak references như giải pháp mặc định; chúng không đảm bảo thời điểm cleanup và làm semantics khó dự đoán.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Heap tăng có đồng nghĩa memory leak không?</b></summary>

Không. Có thể do traffic tăng, warm-up, cache chủ đích hoặc V8 giữ heap đã cấp. Cần quan sát sau GC/qua workload ổn định và tìm object retained không mong muốn.

</details>

<details>
<summary><b>Q2. `heapUsed` và RSS khác nhau thế nào?</b></summary>

`heapUsed` là phần heap JS đang dùng; RSS là memory resident tổng của process gồm heap, native, code và các vùng khác. Buffer/native leak có thể làm RSS tăng riêng.

</details>

<details>
<summary><b>Q3. Heap snapshot trả lời câu hỏi gì?</b></summary>

Nó cho biết object nào đang tồn tại và retaining path giữ chúng reachable. Snapshot nên được so sánh theo workload tương đương và xử lý như dữ liệu nhạy cảm.

</details>

<details>
<summary><b>Q4. Các nguồn leak Node phổ biến?</b></summary>

Listener/timer không cleanup, global collection, cache vô hạn, closure giữ object lớn, queue không giới hạn và Buffer/native resource bị giữ lại.

</details>

<details>
<summary><b>Q5. Khi nào dùng CPU profile thay vì heap snapshot?</b></summary>

CPU profile dùng tìm hàm tiêu tốn CPU/hot path; heap snapshot tìm object retained. Allocation sampling giúp xác định allocation churn, kể cả khi không có leak.

</details>

<details>
<summary><b>Q6. Làm sao chứng minh leak đã được sửa?</b></summary>

Chạy cùng soak/load profile trước và sau, quan sát heap/external/RSS qua nhiều chu kỳ GC, kiểm tra retained objects và xác nhận latency/throughput không thoái lui.

</details>

## 7. Ứng dụng vào CV

- Phân tích retaining paths và giới hạn cache/listener lifecycle, giảm RSS của service từ **[A] GB xuống [B] GB** sau **[N] giờ** tải ổn định.
- Thiết lập memory/GC dashboards và cảnh báo theo container budget, giảm sự cố OOM **[A]%** và thời gian điều tra từ **[B] xuống [C] phút**.

## 8. Tài liệu tham khảo

- [Node.js Process: `process.memoryUsage()`](https://nodejs.org/api/process.html#processmemoryusage)
- [Node.js: Debugging](https://nodejs.org/en/learn/getting-started/debugging)
- [Chrome DevTools: Heap snapshots](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots)
- [V8: Garbage collection](https://v8.dev/blog/trash-talk)

