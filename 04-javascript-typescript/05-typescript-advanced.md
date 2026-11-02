# TypeScript nâng cao: infer, declaration files, strict mode, tsconfig

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- `strict` là bộ compiler checks; bật dần ở legacy code bằng migration plan thay vì cast toàn bộ lỗi.
- `infer` trích type từ generic structure trong conditional types; declaration files mô tả API JavaScript cho compiler/consumer.
- `tsconfig` quyết định module resolution, target, strictness và project boundaries; khác bundler/runtime configuration.
- ESM/CJS interop, `exports` map và package `types`/`exports` fields phải tương thích với cách consumer resolve package.
- Type declarations cần phản ánh runtime truth; `.d.ts` sai tạo false confidence nguy hiểm hơn compile error.

## 2. Khái niệm cốt lõi

`strict: true` bật nhóm checks như `strictNullChecks`, `noImplicitAny`, strict function types và strict property initialization. Một số checks riêng cần cấu hình rõ. `useUnknownInCatchVariables` được bật theo `strict` từ TypeScript 4.4 (trừ khi override). `exactOptionalPropertyTypes` và `noUncheckedIndexedAccess` phải bật riêng, không nằm trong `strict`. Các check này có migration cost. Compiler flags nên là project contract, không copy ngẫu nhiên từ config khác.

Conditional types phân nhánh theo assignability; `infer` bind một type variable ở pattern. Ví dụ `type Element<T> = T extends readonly (infer U)[] ? U : never`. Distributive conditional types xảy ra khi naked type parameter bên trái `extends` gặp union; bọc `[T]` để tránh distribution khi cần kiểm tra union nguyên khối. Mapped types transform keys/modifiers; template literal types tạo string unions nhưng có thể làm compiler workload tăng.

`.d.ts` khai báo public types mà không có runtime implementation. Library authors nên export surface ổn định, khai báo generic/overloads chính xác và test types bằng consumer fixtures. Module resolution mode như `NodeNext`/`Node16` phản ánh Node ESM/CJS rules; `Bundler` phù hợp bundler nhưng có thể cho phép import mà Node runtime không resolve trực tiếp. `target` chỉ điều khiển syntax output khi emit; không tự polyfill Web APIs.

`paths` trong tsconfig chủ yếu ảnh hưởng TypeScript resolver; runtime/bundler/test runner cần cấu hình alias tương ứng. Project references hỗ trợ build lớn theo dependency graph, nhưng tăng cấu hình. `skipLibCheck` giảm thời gian compile nhưng có thể bỏ qua lỗi declaration trong dependency; không nên dùng để che declaration conflict lâu dài.

## 3. Code ví dụ

Conditional type dùng `infer` để lấy phần tử từ array readonly; ví dụ compile với TypeScript 5.x strict.

```ts
type ElementOf<T> = T extends readonly (infer Item)[] ? Item : never;

type Names = ElementOf<readonly ['Ada', 'Linus']>; // 'Ada' | 'Linus'
type Count = ElementOf<number[]>; // number

function first<T extends readonly unknown[]>(values: T): ElementOf<T> | undefined {
	return values[0] as ElementOf<T> | undefined;
}
```

Assertion trong helper bị giới hạn tại implementation; public callers giữ type inference. Với API phức tạp, ưu tiên overload hoặc generic signature trực tiếp nếu giảm cast và diagnostics.

## 4. Trade-off & Best practices

- Bật strict options theo lộ trình, đo migration và không biến code thành `as unknown as` chain.
- Chọn `module`/`moduleResolution` khớp runtime/package; kiểm thử package từ consumer project, không chỉ từ monorepo bundler.
- Viết `.d.ts` tối thiểu nhưng chính xác; test declaration bằng sample import, ESM/CJS consumers và supported TypeScript versions.
- Tránh `paths` alias không được mirror ở runtime; prefer package exports/workspace links khi cần module boundary thực.
- Dùng project references cho monorepo lớn khi build graph/ownership rõ; không bắt đầu với cấu hình phức tạp cho project nhỏ.
- Theo dõi compile time; simplify recursive conditional types, constrain generics và tránh combinatorial unions.
- Dùng `skipLibCheck`/target/lib có chủ đích; target thấp cần runtime polyfills riêng.

## 5. Lỗi thường gặp / Pitfalls

- Cho rằng `paths` tự rewrite import trong emitted JavaScript.
- Dùng `moduleResolution: bundler` rồi deploy package bằng Node mà chưa test Node resolution.
- Khai báo `.d.ts` exports không khớp package `exports` map hoặc default/named export runtime.
- `skipLibCheck` che hai version dependency declarations xung đột.
- Tạo recursive conditional type quá sâu gây `Type instantiation is excessively deep` hoặc editor freeze.
- Dùng `infer`/template literal types để biểu diễn logic runtime, dù types bị erase.
- Bật strict rồi thêm assertion hàng loạt, mất mục tiêu migration.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. `strict` bao gồm điều gì?</b></summary>

Đây là shorthand bật nhóm checks nghiêm ngặt như null checks, implicit any, function variance và property initialization. Có thể cấu hình thêm checks như unchecked indexed access riêng.

</details>

<details>
<summary><b>Q2. Distributive conditional type là gì?</b></summary>

Conditional type với naked type parameter phân phối qua từng union member. Bọc parameter trong tuple, như `[T] extends [U]`, để kiểm tra union tổng thể.

</details>

<details>
<summary><b>Q3. `paths` có đổi runtime import không?</b></summary>

Không mặc định. Nó hỗ trợ TypeScript resolution; bundler/runtime/test runner phải có alias mapping tương ứng hoặc emitted imports không chạy.

</details>

<details>
<summary><b>Q4. Khi nào cần declaration file?</b></summary>

Khi consumer cần type cho JavaScript library hoặc public API không được TypeScript emit declarations. Declaration phải được kiểm tra với runtime package exports.

</details>

<details>
<summary><b>Q5. `target` có polyfill API không?</b></summary>

Không. `target` điều khiển syntax transformation; `lib` cung cấp compile-time API declarations. Runtime cần API/polyfill thực tế.

</details>

<details>
<summary><b>Q6. `skipLibCheck` trade-off gì?</b></summary>

Giảm thời gian typecheck bằng bỏ qua kiểm tra declaration dependencies nhưng có thể che lỗi incompatibility. Dùng như tối ưu có chủ đích, không thay sửa dependency graph.

</details>

## 7. Ứng dụng vào CV

- Thiết kế package TS với NodeNext exports và declaration tests cho ESM/CJS consumers, giảm integration type errors **[A]%**.
- Migrate **[N]** packages sang strict mode theo module boundary, giảm `any`/unsafe assertions **[A]%** và duy trì build time dưới **[B] phút**.

## 8. Tài liệu tham khảo

- [TSConfig Reference](https://www.typescriptlang.org/tsconfig/)
- [TypeScript: Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [TypeScript: Module Resolution](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
- [TypeScript: Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)

- [TypeScript: useUnknownInCatchVariables](https://www.typescriptlang.org/tsconfig/useUnknownInCatchVariables.html)
