# Authentication: session vs JWT, OAuth2, OIDC, refresh token, SSO

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- Authentication xác định principal; authorization quyết định principal được phép làm gì trên resource/action.
- Server-side session dễ revoke centrally; JWT access token stateless verification nhưng khó revoke và cần kiểm soát audience/expiry/key rotation.
- OAuth 2.0 là authorization framework; OpenID Connect (OIDC) bổ sung identity layer/ID token.
- Browser public clients nên dùng Authorization Code + PKCE; tránh implicit/password grants theo modern guidance.
- Refresh token cần rotation/reuse detection, secure storage và revocation; token payload decode được không đồng nghĩa đã xác thực.

## 2. Khái niệm cốt lõi

Session flow: server tạo opaque random session ID, lưu session state phía server, gửi cookie `Secure`, `HttpOnly`, `SameSite` theo use case. Server revoke/rotate session thuận tiện; cần session store, CSRF defenses cho cookie-authenticated requests và session fixation prevention.

JWT gồm header/payload/signature, thường JWS; payload base64url encoded, không encrypted. Verify signature bằng allowlisted algorithm/key, `iss`, `aud`, `exp`, `nbf` và token purpose. Access tokens ngắn hạn giảm exposure; revocation cần denylist/introspection/short TTL. Key rotation cần `kid` resolution an toàn, không tin key URL từ token tùy tiện.

OAuth2 flow cấp access token để client gọi resource server; OIDC thêm ID token về authentication claims, issuer/audience/nonce validation. Authorization Code + PKCE bảo vệ code exchange cho public clients; `state` ràng buộc request/response để chống CSRF; chống authorization-server mix-up còn cần kiểm tra issuer và ràng buộc đúng authorization server/redirect URI. `nonce` ràng buộc OIDC ID token với login request. SSO thường dựa OIDC/SAML IdP, không phải tự phát hành một JWT dùng mọi nơi.

Refresh token thường sống lâu hơn access token, chỉ gửi tới authorization server và cần lưu an toàn. Với public client, RFC 9700 yêu cầu rotation hoặc sender-constraining để phát hiện replay; dưới đây mô tả phương án rotation. Nếu token cũ được reuse, revoke token family/session. Authorization cần object-level checks (tenant/ownership), role/scope chỉ là một phần policy. Client UI hiding không phải access control.

## 3. Code ví dụ

Verify JWT bằng thư viện `jose` với algorithm, issuer và audience được allowlist; secret phải lấy từ secure config.

```js
import { jwtVerify } from 'jose';

const secretValue = process.env.JWT_SECRET;
if (!secretValue) throw new Error('JWT_SECRET is required');
const token = process.env.JWT_TOKEN; // In an API, read the bearer token from the request.
if (!token) throw new Error('JWT_TOKEN is required');

const key = new TextEncoder().encode(secretValue);
if (key.byteLength < 32) throw new Error('HS256 requires at least 32 random key bytes');
const { payload } = await jwtVerify(token, key, {
	algorithms: ['HS256'],
	requiredClaims: ['exp', 'sub'],
	issuer: 'https://auth.example.test',
	audience: 'orders-api',
});

if (typeof payload.sub !== 'string') throw new Error('Invalid subject');
```

Trong production ưu tiên asymmetric signing khi nhiều resource servers chỉ cần verify; validate scopes/tenant/authorization riêng sau token verification. HS256 key phải được sinh ngẫu nhiên bằng CSPRNG với ít nhất 256 bit entropy; kiểm tra độ dài không chứng minh entropy. Secret/key rotation và error responses cần policy. `exp` phải được yêu cầu rõ vì verifier thường chỉ kiểm tra expiry nếu claim có mặt.

## 4. Trade-off & Best practices

- Chọn session cho first-party browser apps cần revocation/session management; chọn JWT khi distributed verification/mobile/API needs justify token complexity.
- Dùng access token ngắn hạn, audience-scoped và least privilege; không nhồi PII/secret vào JWT payload.
- Cookie auth cần CSRF mitigation; bearer token cần bảo vệ khỏi XSS/token exfiltration. Threat model cả hai.
- OIDC client validate signature, issuer, audience, expiry, nonce và state; không dùng ID token như API access token.
- Rotate/revoke refresh tokens và detect reuse; không log bearer tokens hoặc authorization headers.
- Authorize mỗi resource/action ở server, tenant boundary và data access layer; test IDOR cases.
- Dùng mature OAuth/OIDC libraries/provider; tránh tự triển khai crypto/token parsing.

## 5. Lỗi thường gặp / Pitfalls

- Decode JWT base64 rồi tin claims mà không verify signature.
- Chấp nhận `alg` từ token không allowlist hoặc bỏ kiểm tra issuer/audience.
- Dùng ID token gọi resource API hoặc access token làm identity proof sai context.
- Lưu long-lived refresh/access tokens trong localStorage không threat-model.
- Không rotate session ID sau login/privilege change.
- Chỉ kiểm role ở frontend/route guard, quên ownership/tenant-level authorization.
- Dùng refresh token nhiều lần mà không phát hiện reuse hoặc revoke family.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. OAuth2 khác OIDC?</b></summary>

OAuth2 giải quyết delegated authorization; OIDC thêm identity layer, ID token và standardized user claims/authentication flow.

</details>

<details>
<summary><b>Q2. JWT stateless có nghĩa không cần storage?</b></summary>

Verification có thể không cần session lookup, nhưng revoke/refresh/session tracking vẫn cần state nếu yêu cầu; stateless trade-off là khó thu hồi tức thì.

</details>

<details>
<summary><b>Q3. PKCE giải quyết gì?</b></summary>

Ràng buộc authorization code với verifier do client tạo, giảm nguy cơ code interception ở public clients không giữ được client secret.

</details>

<details>
<summary><b>Q4. Refresh token rotation phát hiện gì?</b></summary>

Reuse token cũ sau khi đã rotate có thể chỉ ra token theft; server revoke token family/session và yêu cầu reauthentication.

</details>

<details>
<summary><b>Q5. Cookie session và bearer token khác CSRF risk?</b></summary>

Browser tự gửi cookie nên CSRF protection cần thiết; bearer token do JS/client gắn header ít bị classic CSRF hơn nhưng dễ bị XSS exfiltration.

</details>

## 7. Ứng dụng vào CV

- Thiết kế OIDC Authorization Code + PKCE/refresh rotation cho **[N]** clients, giảm account/session incidents **[A]%**.
- Bổ sung object-level authorization và tenant checks cho **[N]** API operations, loại bỏ IDOR findings trong security review.

## 8. Tài liệu tham khảo

- [OAuth 2.0 Security Best Current Practice (RFC 9700)](https://www.rfc-editor.org/rfc/rfc9700)
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)
- [OWASP: Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [jose: JavaScript JOSE library](https://github.com/panva/jose)

- [RFC 9700: OAuth 2.0 Security BCP](https://www.rfc-editor.org/rfc/rfc9700.html)

- [jose: JWTVerifyOptions](https://github.com/panva/jose/blob/main/docs/jwt/verify/interfaces/JWTVerifyOptions.md)
