# Security riêng Node (prototype pollution, dependency audit, ReDoS)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Node security bắt đầu từ trust boundaries: validate dữ liệu, encode output theo context, giới hạn tài nguyên và thiết kế least privilege.
- Prototype pollution thường phát sinh khi merge/assign object không an toàn; dùng schema allowlist, object không prototype khi phù hợp và cập nhật dependency.
- ReDoS là cạn CPU do regex có thời gian chạy tăng mạnh với input được chọn; giới hạn input và tránh pattern có backtracking nguy hiểm.
- Quản lý dependency bằng lockfile, audit/scan có policy, cập nhật chủ động và kiểm soát lifecycle scripts.
- Không dùng `eval`, `Function`, shell command ghép chuỗi từ input; secret không được hardcode hoặc log.

## 2. Khái niệm cốt lõi

Node server thường xử lý dữ liệu không tin cậy qua HTTP, queue, file và dependency. Threat model cần xác định attacker có thể kiểm soát field nào, giới hạn kích thước/thời gian ra sao, và quyền process có thể bị ảnh hưởng đến đâu.

Prototype pollution xảy ra khi dữ liệu ngoài tác động đến prototype chain (ví dụ qua thao tác merge sâu thiếu kiểm soát), làm thay đổi cách code đọc property của object. Hệ quả tùy ứng dụng: thay đổi cấu hình logic, bypass kiểm tra hoặc hành vi ngoài dự kiến. Phòng thủ cốt lõi là validate theo schema, chỉ chấp nhận key cho phép, cập nhật thư viện merge/parser, không dùng object từ request như cấu hình tin cậy. `Object.create(null)` có thể hữu ích cho dictionary key-value, nhưng không thay thế validation.

ReDoS khai thác regex có backtracking lớn; một chuỗi dài được chọn lọc có thể khiến một lần `RegExp.test` chiếm event loop. Hạn chế độ dài, dùng regex đơn giản hoặc parser tuyến tính, kiểm tra pattern bằng công cụ review/static analysis; với input không tin cậy, cân nhắc regex engine có giới hạn hoặc chạy trong worker với timeout.

Supply-chain risk gồm dependency bị lỗ hổng, package bị chiếm quyền, typosquatting và install script chạy lúc cài. `npm audit` là tín hiệu chứ không phải chứng nhận an toàn; đánh giá severity, exploitability, đường phụ thuộc và cách update. Lockfile giúp cài lặp lại, nhưng không làm dependency tự an toàn.

## 3. Code ví dụ

Ví dụ validate dữ liệu theo allowlist trước khi tạo object domain. Với schema production, dùng validator đã được duyệt và giới hạn body size ở HTTP server.

```js
function parseProfile(input) {
	if (input === null || typeof input !== 'object' || Array.isArray(input)) {
		throw new TypeError('Profile must be an object');
	}

	const allowedKeys = new Set(['displayName', 'locale']);
	for (const key of Object.keys(input)) {
		if (!allowedKeys.has(key)) throw new TypeError(`Unexpected field: ${key}`);
	}

	if (typeof input.displayName !== 'string' || input.displayName.length > 80) {
		throw new TypeError('Invalid displayName');
	}

	// Construct a fresh object rather than merging untrusted keys into configuration.
	return { displayName: input.displayName, locale: input.locale ?? 'en' };
}
```

## 4. Trade-off & Best practices

- Validate cấu trúc, kiểu, range, độ dài và số lượng phần tử tại ingress; reject sớm để giảm CPU/memory tiêu hao.
- Dùng `execFile`/`spawn` với arguments array thay vì shell string khi gọi process; vẫn phải validate executable và arguments.
- Đặt body/header/upload size limit, timeout, rate limit và concurrency limit. Mục tiêu là kiểm soát resource exhaustion, không chỉ lọc payload.
- Pin dependency bằng lockfile, review diff khi update, dùng scanner trong CI và ưu tiên bản vá có risk phù hợp. Hạn chế quyền token/build runner.
- Quản lý secrets qua secret store/environment injection, rotate khi nghi ngờ lộ; redaction ở logs/traces.
- Bảo vệ HTTP bằng TLS, security headers và cookie/session policy phù hợp; thêm authorization check ở từng resource/action để tránh IDOR.

## 5. Lỗi thường gặp / Pitfalls

- Dùng `Object.assign`/deep merge trực tiếp với object không tin cậy rồi tin rằng TypeScript type đã lọc field.
- Regex validation chạy trên chuỗi vô giới hạn trong main event loop.
- Dùng `eval` hoặc template-generated code cho dữ liệu đầu vào.
- Ghép input vào shell command hoặc path mà không kiểm soát; dùng API argument array và kiểm tra path traversal.
- Chạy `npm audit fix --force` không review breaking changes hoặc dùng audit output như một checklist đầy đủ.
- Log request body, authorization header, password/reset token hoặc secret khi debug.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Prototype pollution là gì và phòng ngừa ở đâu?</b></summary>

Input có thể làm thay đổi prototype chain qua thao tác object thiếu an toàn. Phòng ngừa bằng allowlist/schema validation, thư viện cập nhật và không deep-merge dữ liệu không tin cậy vào config/domain objects.

</details>

<details>
<summary><b>Q2. ReDoS ảnh hưởng Node server ra sao?</b></summary>

Regex backtracking đắt chạy đồng bộ trên event loop có thể chặn cả process. Giới hạn input, review pattern và dùng giải pháp có complexity/timeout được kiểm soát.

</details>

<details>
<summary><b>Q3. `npm audit` có đảm bảo dependency an toàn?</b></summary>

Không. Nó đối chiếu advisory đã biết; không phát hiện mọi lỗ hổng hay package bị chiếm quyền. Cần lockfile, review, cập nhật, provenance/policy và kiểm soát quyền cài đặt.

</details>

<details>
<summary><b>Q4. Làm sao giảm rủi ro command injection?</b></summary>

Không gọi shell khi không cần; dùng `execFile`/`spawn` với executable cố định và argument array, validate từng giá trị và giới hạn quyền process.

</details>

<details>
<summary><b>Q5. Dependency có lifecycle script tạo rủi ro gì?</b></summary>

Script có thể chạy code trong môi trường install/CI với quyền sẵn có. Giảm quyền token, review package changes, chỉ cho phép scripts cần thiết và dùng build environment cô lập.

</details>

<details>
<summary><b>Q6. Vì sao cần giới hạn body size dù đã validate schema?</b></summary>

Parser phải tiêu thụ tài nguyên trước hoặc trong validation. Giới hạn kích thước, timeout và concurrency giúp chống resource exhaustion trước khi business logic bắt đầu.

</details>

## 7. Ứng dụng vào CV

- Thêm schema validation, payload limits và dependency policy cho **[N]** Node services, giảm security findings mức high **[A]%** qua **[B] release**.
- Loại bỏ regex có rủi ro và command construction không an toàn, giảm incident do input độc hại từ **[A] xuống [B]**.

## 8. Tài liệu tham khảo

- [Node.js Security Best Practices](https://nodejs.org/en/learn/getting-started/security-best-practices)
- [OWASP: Prototype Pollution Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html)
- [OWASP: Regular Expression Denial of Service](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS)
- [npm audit documentation](https://docs.npmjs.com/cli/commands/npm-audit)
