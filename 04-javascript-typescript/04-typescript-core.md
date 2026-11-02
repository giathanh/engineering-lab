# TypeScript: generics, utility types, type narrowing, conditional/mapped types

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- TypeScript kiểm tra tĩnh trước runtime; annotations bị erase và không validate network/JSON input.
- Generics giữ quan hệ giữa input/output type; constraint giới hạn operations mà không mất thông tin cụ thể.
- Narrowing biến union thành subtype qua control flow, discriminant, `in`, `typeof`, `instanceof` hoặc custom type guards.
- Utility/mapped/conditional types giúp biến đổi type nhưng có thể làm API khó đọc nếu lồng quá sâu.
- Dùng discriminated unions và `unknown` ở boundary; tránh `any`/type assertion vì chúng tắt guarantees.

## 2. Khái niệm cốt lõi

TypeScript structural type system so sánh shape thay vì nominal identity. Interface/type aliases mô tả contract; excess property checks bắt một số object literal nhưng không phải exact-object guarantee ở mọi assignment. Type compatibility phụ thuộc property/method variance rules và compiler options. Runtime không còn type metadata mặc định, nên validate dữ liệu bên ngoài bằng schema/parser.

Generic parameter bảo toàn mối liên hệ giữa các vị trí: `function first<T>(items: T[]): T | undefined`. Constraint `T extends { id: string }` cho phép truy cập `id` nhưng vẫn giữ subtype. Defaults và inference giảm call-site annotations. `keyof`, indexed access (`T[K]`), mapped types (`{ [K in keyof T]: ... }`) và conditional types (`T extends U ? X : Y`) tạo utility types linh hoạt. `infer` trích type bên trong conditional type.

Narrowing dùng control flow analysis. Discriminated union có literal tag giúp exhaustive switch; `never` ở nhánh default phát hiện case thiếu khi union mở rộng. `unknown` buộc narrowing trước sử dụng; `any` lan truyền unsafety. Type guard (`value is T`) là lời hứa của programmer; sai implementation không được compiler chứng minh.

`Readonly`, `Partial`, `Pick`, `Omit`, `Record`, `ReturnType`, `Parameters`, `Awaited` là utility types thường dùng. `satisfies` kiểm tra expression tương thích mà vẫn giữ type inference cụ thể hơn so với ép annotation rộng. Type-level programming nên phục vụ API ergonomics; compile time, error readability và editor performance cũng là chi phí.

## 3. Code ví dụ

Generic result type với discriminant giúp caller xử lý lỗi mà không dùng exception cho mọi expected outcome.

```ts
type Result<T, E> =
	| { ok: true; value: T }
	| { ok: false; error: E };

function mapResult<T, U, E>(result: Result<T, E>, map: (value: T) => U): Result<U, E> {
	if (!result.ok) return result;
	return { ok: true, value: map(result.value) };
}

const output = mapResult({ ok: true, value: 42 }, (value) => value.toString());
```

## 4. Trade-off & Best practices

- Dùng generics khi cần bảo toàn type relationship; nếu chỉ dùng `T` một lần, abstraction có thể không cần thiết.
- Model state bằng discriminated unions để loại invalid combinations; tránh nhiều boolean flags có trạng thái mâu thuẫn.
- Narrow `unknown` từ API/JSON bằng runtime schema trước khi chuyển vào domain; TypeScript compile không thay validation.
- Dùng `satisfies` cho config constants cần validate keys nhưng giữ literal inference.
- Ưu tiên mapped type có tên rõ; trích conditional type dài thành aliases để diagnostics dễ đọc.
- Bật `strict`, `strictNullChecks`, `noImplicitAny`; tránh `as` trừ khi boundary có invariant được xác nhận/test.
- Dùng `readonly`/readonly arrays để thể hiện API không mutate; nhớ đây là compile-time/shallow ở nhiều cấu trúc.

## 5. Lỗi thường gặp / Pitfalls

- Nghĩ interface validate object khi nhận từ JSON/network; type system bị erase.
- Dùng `any` để vượt lỗi compiler rồi truyền unsound value sâu vào hệ thống.
- Ép `as SomeType` thay vì kiểm tra shape/status; assertion không convert/validate runtime object.
- Conditional types phức tạp tạo union explosion và error messages khó đọc.
- Lạm dụng utility types khi literal union đủ đơn giản và tương thích serialization tốt hơn.
- Quên exhaustive check nên thêm union case mới mà handler cũ im lặng bỏ qua.
- Dùng generic quá rộng khiến API khó dùng hơn function overload/concrete type.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Generic khác `any` thế nào?</b></summary>

Generic giữ type relationship xuyên suốt API và được caller suy luận; `any` tắt checking, cho phép thao tác không an toàn và lan ra kết quả.

</details>

<details>
<summary><b>Q2. Structural typing nghĩa là gì?</b></summary>

Hai type tương thích nếu shape members phù hợp theo rules của TypeScript, không cần cùng tên declaration. Điều này tăng flexibility nhưng đôi khi cần nominal branding.

</details>

<details>
<summary><b>Q3. `unknown` khác `any`?</b></summary>

`unknown` nhận mọi value nhưng phải narrow trước khi dùng; `any` cho phép mọi thao tác không kiểm tra. Dùng `unknown` ở trust boundary.

</details>

<details>
<summary><b>Q4. `satisfies` khác type annotation?</b></summary>

`satisfies` kiểm tra expression tương thích với constraint nhưng giữ inference cụ thể hơn; annotation thường widen biến thành declared type.

</details>

<details>
<summary><b>Q5. Exhaustive union check làm thế nào?</b></summary>

Dùng discriminated union và switch trên tag; ở default gán value cho `never` để compiler báo khi union có case chưa được xử lý.

</details>

## 7. Ứng dụng vào CV

- Chuẩn hóa API contracts bằng strict TypeScript, discriminated unions và runtime validation tại **[N]** boundaries, giảm runtime type errors **[A]%**.
- Xây generic data-access/result abstractions giữ type-safe relations, giảm casts `any` từ **[A] xuống [B]** trong **[N] modules**.

## 8. Tài liệu tham khảo

- [TypeScript Handbook: Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript Handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Handbook: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript 4.9: `satisfies`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)
