# Scope, hoisting, closure, `this`, prototype chain

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Scope quyết định nơi identifier được resolve; lexical scope xác định lúc viết code, không phải khi gọi function.
- `var` hoist và function-scoped; `let`/`const` block-scoped, tồn tại trong TDZ trước khai báo.
- Closure giữ lexical environment cần thiết sau khi outer function kết thúc; hữu ích nhưng có thể giữ memory lâu.
- `this` phụ thuộc call-site; arrow function không có `this` riêng mà capture lexical `this`.
- Prototype chain là cơ chế delegation khi đọc property; `class` là syntax trên prototype-based model.

## 2. Khái niệm cốt lõi

JavaScript tạo execution context với lexical environment. Khi resolve tên, engine tìm local binding rồi đi lên outer lexical environment chain. `var` được tạo ở function/global scope và khởi tạo `undefined`; `let`/`const` binding được tạo khi vào scope nhưng chưa thể truy cập trước declaration (Temporal Dead Zone). Function declaration thường có thể gọi trước vị trí khai báo trong scope; function expression phụ thuộc binding của biến chứa nó.

Closure xảy ra khi function dùng binding từ outer scope. Function không nhất thiết copy giá trị; nó giữ reference tới environment binding, nên biến mutable thay đổi vẫn được quan sát. Closure hữu ích cho encapsulation, callback và factory; nhưng timer/listener có thể giữ object graph lớn. Gỡ listener/clear timer khi lifecycle kết thúc.

`this` trong regular function được xác định bởi call-site: `obj.method()` bind `this` là obj; gọi detached function thường mất receiver (strict mode là `undefined`); `call/apply/bind` đặt receiver tường minh; `new` tạo instance binding. Arrow function lấy `this` từ lexical scope và không thể rebind bằng `call`/`bind`. Callback truyền vào library cần hiểu library gọi callback thế nào.

Object có internal prototype; property lookup đi qua prototype chain đến `null`. `Object.create(proto)` tạo object với prototype xác định; `class Child extends Parent` nối prototype instance và constructor. Method đặt trên prototype được chia sẻ; field instance thường riêng mỗi object. `Object.hasOwn()` phân biệt own property với inherited property. Không dùng prototype làm nơi chứa state mutable chung không chủ ý.

## 3. Code ví dụ

Factory dưới đây tạo private state bằng closure và dùng arrow callback để giữ lexical `this`.

```js
function createCounter() {
	let value = 0;
	return {
		increment() { return ++value; },
		current() { return value; },
	};
}

class SearchPanel {
	constructor(root) {
		this.root = root;
		root.addEventListener('click', (event) => {
			if (event.target.closest('[data-search]')) this.search();
		});
	}
	search() { console.log('search'); }
}

const counter = createCounter();
console.log(counter.increment(), counter.current()); // 1 1
```

Trong UI thực tế, giữ reference tới listener để remove khi panel bị dispose. Closure encapsulation không tự quản lý lifecycle.

## 4. Trade-off & Best practices

- Dùng `const` mặc định cho binding không reassign, `let` khi cần; không chọn theo “immutable value” vì object bên trong vẫn mutable.
- Khai báo biến gần nơi dùng, tránh dựa vào hoisting để làm control flow khó đọc.
- Dùng arrow cho callback cần lexical `this`; dùng regular method/function khi caller phải cung cấp receiver.
- Với event listener, timer, subscription dài hạn, cung cấp cleanup/dispose để closure không giữ state cũ.
- Ưu tiên composition thay đổi prototype runtime; dùng `Object.create(null)` cho dictionary key nếu cần tránh prototype inheritance.
- Dùng `Object.hasOwn()` khi kiểm tra own keys; không dùng `in` nếu không muốn inherited property.
- Khi debug, kiểm tra call-site và prototype chain thực tế, không suy luận `this` từ nơi function được định nghĩa.

## 5. Lỗi thường gặp / Pitfalls

- Gọi lexical scope là dynamic scope; nơi function được gọi không đổi outer lexical environment.
- Gán `const object = ...` rồi cho rằng object immutable.
- Dùng arrow làm object method khi cần `this` trỏ object; arrow capture outer `this`.
- Destructure method khỏi object rồi gọi rời, làm mất receiver.
- Dùng `for (var i...)` với async callback và nhận cùng giá trị cuối; `let` tạo binding theo iteration.
- Gán vào `prototype` để lưu state per-instance khiến mọi instance chia sẻ cùng object.
- Quên cleanup listener/closure và giữ DOM node/model trong memory.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Closure giữ gì sau khi outer function return?</b></summary>

Nó giữ lexical bindings cần để function chạy; reference còn sống có thể giữ object graph và memory.

</details>

<details>
<summary><b>Q2. `this` trong arrow function là gì?</b></summary>

Arrow không tạo `this` riêng; nó capture lexical `this`. `call`, `apply`, `bind` không thay đổi giá trị này.

</details>

<details>
<summary><b>Q3. TDZ khác hoisting thế nào?</b></summary>

Binding `let`/`const` được tạo khi vào scope nhưng không thể truy cập trước declaration; TDZ mô tả khoảng đó. Hoisting không phải chuyển source line.

</details>

<details>
<summary><b>Q4. Property lookup đi qua prototype chain ra sao?</b></summary>

Engine kiểm tra own property trước, rồi lần lượt prototype tới `null`. Method prototype được chia sẻ, field instance thường nằm trên instance.

</details>

<details>
<summary><b>Q5. Vì sao method detached dễ mất `this`?</b></summary>

`this` của regular function phụ thuộc call-site. Gọi `const fn = obj.method; fn()` không còn receiver `obj`; bind hoặc wrapper arrow giữ receiver.

</details>

## 7. Ứng dụng vào CV

- Refactor event/listener lifecycle để dispose closure đúng lúc, giảm retained DOM memory **[A]%** trong phiên sử dụng dài **[N] phút**.
- Thiết kế API object bằng prototype methods và lexical state rõ ràng, giảm lỗi callback mất receiver **[A]%** qua **[N]** flows.

## 8. Tài liệu tham khảo

- [MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)
- [MDN: `this`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
- [MDN: Prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
- [ECMAScript Language Specification](https://tc39.es/ecma262/)

