# ES6+ features quan trọng, immutability, deep vs shallow copy

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~8 phút

## 1. Tóm tắt nhanh (TL;DR)

- Destructuring, spread/rest, optional chaining, nullish coalescing, modules và async syntax giúp diễn đạt intent; hiểu semantics quan trọng hơn ghi nhớ cú pháp.
- `const` khóa binding, không khóa object; shallow copy chỉ tạo object/array mới ở tầng ngoài.
- Nested reference có thể bị mutate qua cả bản gốc và bản copy; immutable update phải copy dọc đường tới node thay đổi.
- `structuredClone` hỗ trợ nhiều built-in/circular references nhưng không clone functions hay mọi custom class semantics.
- Immutability giúp reasoning/change detection nhưng copy lớn liên tục có memory/time cost.

## 2. Khái niệm cốt lõi

ES6+ đưa vào `let/const`, arrow functions, template literals, destructuring, rest/spread, modules, classes, Promise và generators; các phiên bản sau thêm optional chaining (`?.`), nullish coalescing (`??`) và logical assignment. `structuredClone` là Web/platform API có trong các runtime hỗ trợ, không phải cú pháp hay built-in được ECMAScript định nghĩa. `||` dùng truthiness nên `0`, `false`, `''` có thể fallback; `??` chỉ fallback khi null/undefined.

Object/array trong JavaScript là reference values. `const settings = {}` ngăn reassign biến `settings`, nhưng cho phép `settings.theme = ...`. Spread `{...source}`/`[...items]` tạo shallow copy: nested objects vẫn cùng reference. Immutable update phải copy mọi parent node trên path, giữ các nhánh không đổi bằng structural sharing. Deep clone bằng JSON stringify/parse làm mất property `undefined`/function, biến Date thành string, Map/Set thành `{}`, `NaN`/`Infinity` thành `null`; BigInt và circular graph thì làm `JSON.stringify` ném `TypeError`.

`structuredClone(value)` clone nhiều built-in như Date, Map, Set, typed arrays và hỗ trợ circular references; một số object transferable có thể chuyển ownership. Nó không clone functions và không bảo toàn mọi class prototype/behavior theo mong muốn. Deep clone cũng có cost O(size) và không phù hợp cho mọi state update.

Immutability thường là convention/discipline; `Object.freeze` shallow và không recursively freeze nested objects. Framework/state libraries có thể dùng proxies/structural sharing. Mục tiêu là thay đổi được quan sát rõ, không phải cấm mọi mutation nội bộ: mutable local accumulator có thể hiệu quả nếu không thoát ra ngoài.

## 3. Code ví dụ

Immutable update chỉ copy các object trên path `user.preferences.theme`; nhánh còn lại được chia sẻ an toàn nếu không mutate.

```js
const state = {
	user: { name: 'Ada', preferences: { theme: 'light' } },
	notifications: [],
};

const nextState = {
	...state,
	user: {
		...state.user,
		preferences: { ...state.user.preferences, theme: 'dark' },
	},
};

console.log(state.user.preferences.theme); // light
console.log(nextState.user.preferences.theme); // dark
console.log(nextState.notifications === state.notifications); // true
```

## 4. Trade-off & Best practices

- Dùng `??` cho fallback khi chỉ null/undefined; dùng `||` khi mọi falsy value đều cần fallback.
- Dùng shallow copy có chọn lọc cho state updates; tránh clone toàn cây lớn nếu chỉ đổi một leaf.
- Dùng `structuredClone` khi cần deep clone dữ liệu cloneable và semantics phù hợp; không dùng JSON clone như giải pháp tổng quát.
- Giữ mutation cục bộ trong function nếu không chia sẻ; immutable boundary cần thiết cho change detection, concurrency hoặc history/debugging.
- Cẩn thận spread object input không tin cậy vào config/authorization state; chỉ copy field allowlist.
- Tách read-only type (TypeScript `Readonly`) với runtime immutability (`Object.freeze`); một bên compile-time, một bên runtime và đều có giới hạn.
- Profile allocation và render/update churn trước khi thêm persistent data structure/library.

## 5. Lỗi thường gặp / Pitfalls

- Dùng `const` rồi nghĩ nested data không thể đổi.
- Copy outer array rồi mutate nested object, vô tình đổi cả original state.
- Dùng spread trên object chứa prototype/getters và nghĩ nó clone class instance đầy đủ.
- Deep clone bằng JSON làm mất Date/Map/undefined hoặc lỗi circular references.
- `Object.freeze` outer object rồi tin nested objects cũng frozen.
- Copy nguyên state tree cho mọi update gây GC pressure và unnecessary renders.
- Dùng `||` để default giá trị hợp lệ như `0` hoặc empty string.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Shallow copy khác deep copy?</b></summary>

Shallow copy tạo container mới nhưng giữ references tới nested values; deep copy clone sâu hơn theo semantics của công cụ, thường tốn O(size) và có giới hạn loại dữ liệu.

</details>

<details>
<summary><b>Q2. Spread syntax có clone object không?</b></summary>

Object spread sao chép enumerable own properties, còn array spread tiêu thụ iterator của nguồn; cả hai tạo container mới ở tầng ngoài; không clone prototypes, nested references hoặc mọi property descriptors.

</details>

<details>
<summary><b>Q3. `structuredClone` có clone mọi thứ?</b></summary>

Không. Nó hỗ trợ structured-cloneable types, không clone functions và không bảo toàn mọi custom class behavior.

</details>

<details>
<summary><b>Q4. Khi nào mutation vẫn hợp lý?</b></summary>

Trong local scope không chia sẻ, như accumulator/performance-sensitive transform, nếu mutation không phá contract bên ngoài. Immutable boundary giúp reasoning; không phải mọi biến đều cần persistent copy.

</details>

<details>
<summary><b>Q5. `Object.freeze` có deep freeze không?</b></summary>

Không, mặc định chỉ ngăn thay đổi own properties của object hiện tại; nested objects vẫn mutable trừ khi freeze đệ quy.

</details>

## 7. Ứng dụng vào CV

- Tối ưu state update bằng structural sharing cho **[N]** entities, giảm allocations/re-renders **[A]%** và p95 interaction latency **[B]%**.
- Chuẩn hóa immutable boundaries cho event payload/configuration, giảm lỗi mutation ngoài ý muốn **[A]%** trên **[N]** consumers.

## 8. Tài liệu tham khảo

- [MDN: `structuredClone`](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone)
- [MDN: Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
- [MDN: Nullish coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)
- [Redux: Immutable update patterns](https://redux.js.org/usage/structuring-reducers/immutable-update-patterns)

