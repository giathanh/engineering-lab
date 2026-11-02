# OWASP Top 10 (SQLi, XSS, CSRF, SSRF, IDOR…) + cách phòng tránh trong PHP/Node/React/Vue

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- OWASP Top 10 là awareness taxonomy, không phải checklist đầy đủ hay certification; threat modeling và secure defaults vẫn cần.
- SQLi: parameterized queries; XSS: context-aware output encoding, safe DOM APIs, CSP defense-in-depth.
- CSRF: cookie/session requests cần token/SameSite/origin checks; authorization phải kiểm tra từng object/action để tránh IDOR.
- SSRF: allowlist destinations, egress controls, redirect/DNS/IP validation và metadata-service protections.
- Validate at boundaries, least privilege, dependency patching, secrets hygiene, logging và security tests xuyên stack.

## 2. Khái niệm cốt lõi

Bài dùng **OWASP Top 10:2025** (đối chiếu ngày 02/11/2026):

| Mã | Nhóm rủi ro |
|---|---|
| A01 | Broken Access Control |
| A02 | Security Misconfiguration |
| A03 | Software Supply Chain Failures |
| A04 | Cryptographic Failures |
| A05 | Injection |
| A06 | Insecure Design |
| A07 | Authentication Failures |
| A08 | Software or Data Integrity Failures |
| A09 | Security Logging and Alerting Failures |
| A10 | Mishandling of Exceptional Conditions |

SQLi, XSS, CSRF, SSRF và IDOR là các kiểu lỗ hổng, không phải năm mục độc lập trong Top 10. Không dùng thứ tự/mã của bản 2021 cho bản 2025; SSRF được gộp vào Broken Access Control. A10 nhấn mạnh xử lý lỗi/điều kiện bất thường an toàn: không fail-open authorization, không nuốt lỗi rồi báo thành công, cleanup tài nguyên và kiểm soát resource exhaustion.

Broken access control/IDOR: user đổi identifier để truy cập object không thuộc quyền. Kiểm tra authorization ở server/data layer với principal + object + action; UUID khó đoán không phải authorization. Injection xảy ra khi data trở thành code/query; parameterize values, không ghép SQL/shell/template. XSS là untrusted content thực thi trong browser context; encode theo HTML/attribute/JS/URL context và tránh `innerHTML`.

CSRF lợi dụng browser tự gửi ambient cookies; dùng SameSite, CSRF token/origin checks, không thay đổi state qua GET. SSRF xảy ra khi server fetch URL do user kiểm soát; allowlist scheme/host, kiểm tra DNS/IP sau resolution và redirect, block private/metadata ranges bằng egress firewall. CORS không phải auth; nó điều khiển browser script đọc cross-origin response.

Secure design áp dụng threat modeling (assets, trust boundaries, attackers, abuse cases), least privilege, defense in depth và fail-safe defaults. UI validation chỉ UX; server phải validate/authenticate/authorize. Security logging cần event useful nhưng không lưu credentials/PII; incident response cần traceable request IDs.

## 3. Code ví dụ

Parameterized SQL tránh ghép input vào query; authorize object separately. PHP PDO example chạy với DSN phù hợp.

```php
<?php
declare(strict_types=1);

$statement = $pdo->prepare(
	'SELECT id, name FROM projects WHERE id = :id AND owner_id = :owner_id'
);
$statement->execute(['id' => $projectId, 'owner_id' => $currentUserId]);
$project = $statement->fetch(PDO::FETCH_ASSOC);

if ($project === false) {
	http_response_code(404); // Avoid disclosing whether another user's object exists.
}
```

## 4. Trade-off & Best practices

- Validate input shape/length/range at boundaries; encode output by context. Validation alone không neutralize stored XSS.
- Dùng ORM/parameterized query, allowlist identifiers/sort fields và least-privilege DB credentials.
- Centralize authorization policies và test ownership/tenant boundaries trên API, background jobs và admin paths.
- CSRF tokens, SameSite cookies, Origin/Referer validation và safe HTTP methods cần kết hợp theo client architecture.
- SSRF defense ở cả application egress và network layer; allowlist trusted targets, kiểm tra redirects và DNS rebinding risk.
- Cập nhật dependencies/images, pin lockfiles, scan CI/SBOM và review permissions/scripts.
- Security headers/CSP, rate limits, secure cookie flags, secrets rotation và audit logging làm defense-in-depth.
- Threat model nên được cập nhật khi thêm trust boundary, upload/import feature, webhook, AI/tool integration hoặc admin workflow. Ghi abuse cases cùng security owner/review date để controls không chỉ tồn tại trong checklist ban đầu.

## 5. Lỗi thường gặp / Pitfalls

- Coi UUID/random IDs là access control.
- Dùng CORS để “bảo vệ API” khỏi non-browser clients.
- Escape HTML một lần rồi reuse string ở JS/URL/attribute context khác.
- CSRF token thiếu trên mutation endpoints hoặc GET có side effect.
- SSRF allowlist hostname nhưng không chặn redirect tới private IP.
- Log authorization headers, passwords, tokens hoặc full sensitive request bodies.
- Dùng OWASP Top 10 như danh sách kiểm tra duy nhất mà bỏ threat model/business logic.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. IDOR là gì?</b></summary>

Authorization flaw khi user truy cập object bằng cách thay identifier. Server phải kiểm tra ownership/permission cho mỗi object/action; ID khó đoán không đủ.

</details>

<details>
<summary><b>Q2. CORS có ngăn request cross-site không?</b></summary>

CORS chủ yếu điều khiển browser cho phép JavaScript đọc response; nó không chặn curl/server clients và không thay authentication/CSRF controls.

</details>

<details>
<summary><b>Q3. SQL parameterization giải quyết gì?</b></summary>

Giữ user values tách khỏi SQL syntax để database xử lý như data. Identifiers/sort fragments thường cần allowlist vì không parameterize như values.

</details>

<details>
<summary><b>Q4. CSRF và XSS khác gì?</b></summary>

CSRF khiến browser gửi authenticated request ngoài ý muốn; XSS cho attacker script chạy trong origin. XSS thường có thể đánh bại nhiều CSRF defenses.

</details>

<details>
<summary><b>Q5. SSRF defense cần gì ngoài URL validation?</b></summary>

Allowlist destination, resolve/check IP, xử lý redirects, restrict schemes và egress network; DNS/rebinding/proxy behavior phải tính đến.

</details>

## 7. Ứng dụng vào CV

- Triển khai object-level authorization và parameterized queries cho **[N]** endpoints, loại bỏ **[A]** IDOR/Injection findings.
- Thêm SSRF egress policy/CSP/security headers và security tests, giảm high-severity findings **[A]%** qua **[B] releases**.

## 8. Tài liệu tham khảo

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)


- [OWASP Top 10:2025 — danh sách chính thức](https://top10.owasp.org/2025/)
