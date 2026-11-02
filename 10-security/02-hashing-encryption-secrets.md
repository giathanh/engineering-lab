# Password hashing, encryption, secrets management

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Passwords cần one-way slow password hashing (Argon2id/bcrypt/scrypt), không encryption hoặc fast hash như SHA-256 thuần.
- Encryption có key để decrypt; hashing không có thao tác decrypt, nhưng password yếu vẫn có thể bị dò bằng offline guessing và dùng verification/constant-time library APIs.
- AEAD modes (AES-GCM/ChaCha20-Poly1305) bảo vệ confidentiality + integrity; nonce/IV uniqueness và key management rất quan trọng.
- Secrets phải tách khỏi source code/logs, least-privilege, rotate, audit access và hạn chế lifetime/scope.
- Password hash parameters cần benchmark theo server budget và nâng cấp/rehash dần khi verify.

## 2. Khái niệm cốt lõi

Password hashing nhận password cùng salt random per credential, dùng memory/CPU-hard KDF để làm offline guessing đắt. Ưu tiên Argon2id khi hỗ trợ; scrypt là lựa chọn thay thế khi không có Argon2id. bcrypt chủ yếu phù hợp legacy/compatibility và thường chỉ xử lý tối đa 72 byte password; phải kiểm soát giới hạn theo thư viện, không âm thầm truncate. Salt không bí mật; pepper là server-side secret bổ sung nhưng cần key rotation/recovery policy. Store algorithm/parameters cùng hash để verify/migrate. Fast hash được thiết kế tối ưu throughput, nên không phù hợp passwords.

Encryption chuyển plaintext thành ciphertext bằng key; symmetric encryption nhanh và cần key distribution/protection. Asymmetric crypto hỗ trợ key agreement/signatures but not password storage. AEAD (authenticated encryption with associated data) xác thực ciphertext và metadata; không dùng unauthenticated encryption tùy tiện. Nonce/IV phải unique theo requirements của algorithm/key; reuse AES-GCM nonce có thể phá confidentiality/integrity.

Secrets lifecycle: generate bằng CSPRNG, store trong secret manager/KMS, inject runtime, grant least privilege, rotate/revoke, audit usage và avoid exposure trong CI/log/crash dumps. Environment variables phổ biến nhưng có thể lộ qua process inspection/dumps; dùng orchestrator secret mounts/managed identity theo platform threat model. Key encryption keys (KEK) trong KMS có thể envelope-encrypt data keys.

## 3. Code ví dụ

PHP password hashing/verification dùng built-in API, lưu hash string đầy đủ trong DB. Hai phase dưới đây là đăng ký và đăng nhập; khi đăng nhập thật phải đọc hash đã lưu của user, không hash lại để so sánh chuỗi.

```php
<?php
declare(strict_types=1);

$hash = password_hash($password, PASSWORD_ARGON2ID);
// PHP 8 throws ValueError/Error on hashing failure; Argon2 support depends on the build.

// Login: $hash is loaded from the credential store.
if (!password_verify($submittedPassword, $hash)) {
	throw new RuntimeException('Invalid credentials');
}

if (password_needs_rehash($hash, PASSWORD_ARGON2ID)) {
	$hash = password_hash($submittedPassword, PASSWORD_ARGON2ID);
	// Persist the upgraded hash after successful verification.
}
```

## 4. Trade-off & Best practices

- Chọn Argon2id params theo benchmark trên production-class hardware; cap request concurrency để hash cost không trở thành DoS vector.
- Never log/store plaintext password; rate limit login/reset, generic errors và secure reset token lifecycle.
- Dùng vetted crypto libraries/AEAD APIs; tách encryption key và encrypted data, version key IDs để rotation.
- Nonce generation/uniqueness cần theo algorithm requirements; authentication tag verification trước khi dùng plaintext.
- Lưu secrets trong manager/KMS, scope per service/environment, short-lived credentials/managed identity nếu có.
- Rotate keys/secrets có overlap procedure, audit, incident revocation và dependent service rollout.
- Scan git history/artifacts/images for accidental secrets; revoke immediately if exposed, xóa commit không đủ.
- Incident response cho key exposure cần xác định thời gian/phạm vi, revoke credential, rotate dependent systems, kiểm tra audit logs và thông báo theo policy. Rewriting repository history giảm discoverability nhưng không thu hồi copies/forks/build artifacts.
- Với encrypted data, lưu key version/metadata cạnh ciphertext và test decryption trong restore drills. Rotation thường dùng envelope encryption: KMS bảo vệ data keys, cho phép rewrap keys mà không phải tải toàn bộ dataset vào một maintenance window.

## 5. Lỗi thường gặp / Pitfalls

- Hash passwords bằng SHA-256/MD5 hoặc encrypt để “có thể khôi phục”.
- Salt cố định/global hoặc tự thiết kế password hash scheme.
- Dùng AES-GCM lặp nonce với cùng key.
- Hardcode secret trong repo, Docker image, frontend bundle hoặc logs.
- Rotate key nhưng không hỗ trợ decrypt/re-encrypt old data, làm mất dữ liệu.
- Dùng weak KDF parameters hoặc tăng cost mà không xem CPU saturation/DoS risk.
- So sánh MAC/signatures bằng ordinary string comparison thay constant-time API.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Password hashing khác encryption?</b></summary>

Hash là one-way verification với salt/KDF cost cao; encryption có key để decrypt. Password authentication không cần khôi phục plaintext nên dùng hashing.

</details>

<details>
<summary><b>Q2. Salt có cần giữ bí mật?</b></summary>

Không; salt unique/random ngăn rainbow-table/precomputed attacks và khiến cùng password tạo hash khác. Pepper nếu dùng là secret riêng.

</details>

<details>
<summary><b>Q3. AEAD cung cấp gì?</b></summary>

Confidentiality và integrity/authenticity cho ciphertext cùng associated data. Nonce/key requirements phải tuân đúng algorithm.

</details>

<details>
<summary><b>Q4. Khi nào rehash password?</b></summary>

Sau successful verify nếu `password_needs_rehash` báo parameters/algorithm cũ; upgrade hash mà không cần reset password.

</details>

<details>
<summary><b>Q5. Secrets rotation tốt cần gì?</b></summary>

Key IDs/versioning, overlap rollout, audit/access controls, dependent services update, revocation plan và test recovery/decryption.

</details>

## 7. Ứng dụng vào CV

- Nâng password hashing sang Argon2id với calibrated parameters và rehash-on-login, giảm risk yếu KDF mà giữ login p95 dưới **[A] ms**.
- Chuyển secrets sang managed KMS/secret manager với rotation/audit, loại bỏ **[N]** long-lived credentials khỏi deploy artifacts.

## 8. Tài liệu tham khảo

- [PHP: Password Hashing](https://www.php.net/manual/en/book.password.php)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [NIST SP 800-57: Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)
