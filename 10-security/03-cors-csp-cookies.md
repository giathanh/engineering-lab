# CORS, CSP, cookie flags (HttpOnly, Secure, SameSite)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- CORS là browser-enforced cross-origin response access policy, không phải authentication/firewall cho API.
- CSP giới hạn nguồn/behavior của content, giúp giảm impact XSS; rollout bằng report-only trước khi enforce.
- Session cookies nên dùng `Secure`, `HttpOnly`, `SameSite` phù hợp; cookie scope/expiry/domain/path cần tối thiểu.
- Credentialed CORS không thể dùng wildcard origin; allowlist chính xác và không reflect arbitrary Origin.
- Cookie-authenticated state-changing requests cần CSRF strategy; SameSite là defense-in-depth, không thay mọi checks.

## 2. Khái niệm cốt lõi

Origin là scheme + host + port. Browser CORS protocol kiểm tra response headers (`Access-Control-Allow-Origin`, methods/headers, credentials) trước khi expose response cho script. Simple requests có thể được gửi nhưng response bị browser chặn đọc; preflight OPTIONS hỏi quyền trước request không-simple. CORS không ngăn curl/server clients, cũng không quyết định user authorization.

Credentialed CORS cần origin cụ thể, `Access-Control-Allow-Credentials: true`, và `Vary: Origin` nếu response varies. Dynamic origin phải so với strict allowlist; reflect arbitrary origin cho phép attacker origin đọc response có credentials. Preflight caching giảm OPTIONS overhead nhưng cần policy rõ.

CSP header (Content-Security-Policy) định nghĩa allowed sources/directives: `default-src`, `script-src`, `object-src`, `base-uri`, `frame-ancestors`, `connect-src`. Nonce/hash-based strict CSP tốt hơn broad `unsafe-inline`; nonce phải random per response và gắn đúng script. `Content-Security-Policy-Report-Only` thu report trước enforce; report endpoints cần chống noise/sensitive leakage.

Cookie flags: `Secure` chỉ gửi qua HTTPS; `HttpOnly` ngăn JavaScript đọc cookie; `SameSite=Lax/Strict/None` kiểm soát cross-site sending (`None` yêu cầu Secure trên modern browsers). Cookie `Domain` rộng làm tăng subdomain exposure; host-only cookie/`__Host-` prefix giảm scope. Cookies bị tự động gửi nên CSRF cần token/origin checks khi appropriate. HttpOnly không chống XSS action-in-context.

## 3. Code ví dụ

Node HTTP response headers với explicit origin allowlist và secure session cookie. Origin check không thay authorization.

```js
const allowedOrigins = new Set(['https://app.example.com']);

function applyCors(request, response) {
	const origin = request.headers.origin;
	if (origin && allowedOrigins.has(origin)) {
		response.setHeader('Access-Control-Allow-Origin', origin);
		response.setHeader('Vary', 'Origin');
		response.setHeader('Access-Control-Allow-Credentials', 'true');
	}
}

response.setHeader('Set-Cookie', 'session=opaque; Path=/; Secure; HttpOnly; SameSite=Lax');
```

Production cần xử lý OPTIONS, allowlisted methods/headers, origin absence và framework/proxy header behavior nhất quán.

## 4. Trade-off & Best practices

- Chỉ allowlist origins cần thiết; tách dev/staging/prod, methods/headers minimal và credentials policy explicit.
- Dùng `Vary: Origin` khi response header thay đổi theo Origin để CDN/proxy không serve sai CORS metadata.
- CSP rollout report-only, sửa violations, rồi enforce; dùng nonce/hash và tránh broad `unsafe-eval/unsafe-inline`.
- Cookies host-only, narrow Path/Domain, Secure/HttpOnly/SameSite phù hợp; rotate session sau login/privilege change.
- CSRF token hoặc Origin/Referer checks cho cookie-based mutations; GET phải safe/idempotent về semantics.
- Không đặt access token/session identifiers trong URL, logs hoặc CSP reports.
- Test browser preflight, credentials, subdomains, proxies và production HTTPS behavior.
- Test browser preflight, credentials, subdomains, proxies và production HTTPS behavior.
- CORS/CSP reports có thể chứa URL hoặc metadata nhạy cảm, đồng thời bị attacker spam. Hạn chế payload/retention, rate-limit report endpoint và phân biệt violation thật với extension/browser noise trước khi paging.
- CORS/CSP reports có thể chứa URL hoặc metadata nhạy cảm, đồng thời bị attacker spam. Hạn chế payload/retention, rate-limit report endpoint và phân biệt violation thật với extension/browser noise trước khi paging.
- `SameSite` phân biệt site, không luôn đồng nghĩa origin; sibling subdomains có thể cùng site nhưng khác origin. Rà cookie domain và trusted subdomain ownership khi thiết kế CSRF/CORS, đặc biệt nếu user-controlled content được host ở subdomain.

## 5. Lỗi thường gặp / Pitfalls

- `Access-Control-Allow-Origin: *` cùng credentials.
- Reflect mọi `Origin` trong response mà không allowlist.
- Nghĩ CORS chặn non-browser clients hoặc thay server authz.
- Cookie `SameSite=None` nhưng thiếu `Secure`.
- Dùng `HttpOnly` như bảo vệ toàn diện khỏi XSS/CSRF.
- CSP có `unsafe-inline` rộng nên policy gần như không bảo vệ script injection.
- CDN cache response theo origin mà không `Vary: Origin`.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. CORS bảo vệ ai?</b></summary>

Browser user bảo vệ response read access của scripts theo origin policy. Nó không ngăn request server-to-server hoặc thay API authentication/authorization.

</details>

<details>
<summary><b>Q2. Preflight khi nào xảy ra?</b></summary>

Browser gửi OPTIONS trước một số cross-origin requests không thuộc simple request criteria, để server cho phép method/headers/credentials.

</details>

<details>
<summary><b>Q3. Vì sao credentialed CORS không dùng wildcard?</b></summary>

Browser yêu cầu origin cụ thể khi credentials enabled; wildcard có thể expose credentialed response nếu được reflect/serve sai.

</details>

<details>
<summary><b>Q4. SameSite thay CSRF token được không?</b></summary>

Không trong mọi trường hợp. SameSite giảm cross-site cookie sending nhưng browser compatibility/flows và same-site sibling threats cần xét; token/origin checks bổ sung defense.

</details>

<details>
<summary><b>Q5. CSP nonce phải thế nào?</b></summary>

Cryptographically random, unique per response và gắn đúng script/style; không reuse/có thể đoán. Nonce không an toàn nếu attacker kiểm soát markup và policy nguồn quá rộng.

</details>

## 7. Ứng dụng vào CV

- Thu hẹp CORS allowlist và triển khai CSP nonce/report-only rollout, giảm policy violations **[A]%** mà không break **[N]** integrations.
- Chuẩn hóa secure cookie/CSRF controls cho **[N]** applications, đóng **[A]** findings trong security review.

## 8. Tài liệu tham khảo

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP: CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)

