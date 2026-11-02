# Browser: DOM, event delegation, rendering pipeline (reflow/repaint), Web APIs, storage

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- DOM là object tree do browser parse/maintain; JavaScript đọc/ghi DOM qua Web APIs, không phải HTML string thuần.
- Event bubbling cho phép delegation: gắn listener trên ancestor, xác định target bằng `closest`, hỗ trợ nodes động.
- Style/layout/paint/composite là các bước rendering; DOM/style read-write xen kẽ có thể trigger forced synchronous layout.
- `requestAnimationFrame` phù hợp visual updates; `IntersectionObserver`, `ResizeObserver` tránh polling thủ công.
- localStorage/sessionStorage đồng bộ và lưu string; IndexedDB async cho structured data lớn; không lưu secret nhạy cảm trong JS-readable storage.

## 2. Khái niệm cốt lõi

Browser parse HTML thành DOM, CSS thành CSSOM/style data, tính layout/geometry, paint pixels rồi composite layers. Không phải mọi DOM change đều gây full reflow: browser có thể batch style/layout, chỉ repaint hoặc composite tùy property. Thay width/height/top thường ảnh hưởng layout; transform/opacity có thể composite-only nhưng không tuyệt đối, cần profile. Đọc geometry sau khi ghi style có thể buộc synchronous layout và làm main thread stall.

DOM event model gồm capture, target và bubble phases. Event delegation tận dụng bubbling để xử lý nhiều child hoặc nodes được thêm sau mà không gắn handler từng node. `event.target` có thể là descendant sâu; `closest()` giúp tìm control cần xử lý và cần xác nhận nó còn nằm trong root. Shadow DOM có retargeting/composed path semantics riêng.

Web APIs gồm Fetch, URL, History, WebSocket, observers, storage, workers; mỗi API có permission/lifecycle/security constraints. Browser main thread chạy JS và rendering; long task làm input/render trễ. Web Worker giúp CPU computation nền nhưng không truy cập DOM trực tiếp, giao tiếp qua messages/structured clone hoặc transferable objects.

`localStorage` tồn tại qua browser sessions theo origin, `sessionStorage` theo tab/session; cả hai synchronous, quota nhỏ và chỉ lưu strings. IndexedDB async, transactional và phù hợp structured data lớn/offline. Cookies tự gửi theo request tùy flags/domain/path, nên dùng cho server session với `HttpOnly`, `Secure`, `SameSite` khi phù hợp. XSS có thể đọc local/session storage; lưu access token trong JS-readable storage làm tăng impact.

## 3. Code ví dụ

Delegation cho danh sách action động; selector và action allowlist giữ handler có kiểm soát.

```js
const list = document.querySelector('[data-action-list]');

list?.addEventListener('click', (event) => {
	if (!(event.target instanceof Element)) return;
	const button = event.target.closest('button[data-action]');
	if (!button || !list.contains(button)) return;

	switch (button.dataset.action) {
		case 'remove':
			button.closest('[data-row]')?.remove();
			break;
		default:
			break;
	}
});
```

## 4. Trade-off & Best practices

- Dùng text nodes/`textContent` cho untrusted text; tránh ghép input vào `innerHTML` nếu không sanitize theo context.
- Gộp DOM writes, đọc layout trước rồi mutate; với animation dùng `requestAnimationFrame` và ưu tiên transform/opacity khi phù hợp.
- Dùng event delegation cho danh sách lớn/dynamic children; listener trực tiếp đơn giản hơn cho ít elements và lifecycle rõ.
- Dùng `IntersectionObserver` cho lazy loading/visibility thay vì scroll handler liên tục; throttle/debounce nếu cần event liên tục.
- Chọn storage theo semantics, quota và security; không lưu secrets/PII nếu threat model không chấp nhận JS access.
- Dùng Web Worker cho CPU-bound tasks lớn, transfer ArrayBuffer khi phù hợp; serialization cũng có cost.
- Profile bằng Performance panel, Long Tasks, layout shifts và real-device measurements; tránh giả định một browser engine đại diện mọi nơi.

## 5. Lỗi thường gặp / Pitfalls

- Gọi `getBoundingClientRect()` sau mỗi style mutation, tạo layout thrashing.
- Dùng `innerHTML` với untrusted input gây XSS.
- Giả định event target luôn chính là button; click có thể vào icon/span bên trong.
- Không remove global listeners/observers khi component unmount, gây leak hoặc duplicate callbacks.
- Dùng localStorage cho data lớn hoặc gọi liên tục trên main thread, gây jank.
- Dùng `requestAnimationFrame` cho background timer cần chạy khi tab hidden; browser có thể throttle/pause.
- Nghĩ Web Worker có thể truy cập `document` hoặc chia sẻ object graph trực tiếp.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Reflow/layout khác repaint thế nào?</b></summary>

Layout tính geometry/position; repaint vẽ pixels khi style/visual changes. Layout change thường kéo theo paint, nhưng compositor có thể xử lý một số transforms độc lập.

</details>

<details>
<summary><b>Q2. Event delegation lợi ích gì?</b></summary>

Ít listeners hơn, hoạt động với child nodes thêm sau và tập trung lifecycle ở ancestor. Cần xử lý target/closest, propagation và containment chính xác.

</details>

<details>
<summary><b>Q3. Vì sao layout thrashing xảy ra?</b></summary>

Đọc layout sau khi style/DOM write buộc browser đồng bộ flush style/layout; lặp write-read làm browser tính toán nhiều lần. Batch reads rồi writes.

</details>

<details>
<summary><b>Q4. Chọn localStorage hay IndexedDB?</b></summary>

localStorage nhỏ, synchronous key-string store; IndexedDB async/transactional, phù hợp dữ liệu lớn/offline. Security exposure theo origin cần tính đến cả hai.

</details>

<details>
<summary><b>Q5. Vì sao không lưu secret trong localStorage?</b></summary>

JavaScript cùng origin có thể đọc; XSS có thể lấy token. Cookie HttpOnly giảm khả năng đọc bằng JS nhưng cần CSRF/SameSite strategy và vẫn phải bảo vệ XSS.

</details>

<details>
<summary><b>Q6. Khi nào cần Web Worker?</b></summary>

Khi profiling cho thấy CPU-bound task đủ lớn gây main-thread jank. Worker không truy cập DOM; message/clone/transfer có overhead.

</details>

## 7. Ứng dụng vào CV

- Giảm forced layout và chuyển delegated event handling cho **[N]** interactive rows, cải thiện p95 interaction latency **[A]%**.
- Chuyển parsing/search CPU-bound sang Worker và lazy-load qua IntersectionObserver, giảm long tasks **[A]%** trên thiết bị mục tiêu.

## 8. Tài liệu tham khảo

- [MDN: Event bubbling and delegation](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling)
- [web.dev: Rendering performance](https://web.dev/articles/rendering-performance)
- [MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [MDN: Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
