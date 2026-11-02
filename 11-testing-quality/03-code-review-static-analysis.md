# Code review, linting, static analysis (PHPStan/Psalm, ESLint), CI quality gates

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Code review ưu tiên correctness, security, maintainability và behavior risk; style/mechanical checks nên tự động hóa.
- Lint phát hiện style/pattern issues; static analysis kiểm tra type/control-flow mà không cần execute; tests xác nhận runtime behavior.
- PHPStan/Psalm và ESLint/TypeScript nên chạy locally/CI với baseline/migration strategy cho legacy code.
- CI quality gates cần fast feedback, deterministic dependencies, required checks và artifact/test reports.
- Review size nhỏ, context rõ, constructive comments và explicit ownership giúp giảm cycle time mà vẫn giữ quality.

## 2. Khái niệm cốt lõi

Review là risk assessment/collaboration, không phải approve syntax. Reviewer tập trung logic/edge cases, data integrity, auth, concurrency, error handling, API compatibility, migrations/rollback và observability. Author cung cấp context, testing evidence và trade-offs. Nits nên phân biệt blocking vs suggestion.

Lint thường parse AST và áp rules; static analysis infer types/paths, bắt nullability, unreachable code, invalid calls, taint-like flows tùy tool. PHPStan/Psalm levels/stubs/generics help; ESLint type-aware rules cần TypeScript parser/project config. Static analysis không chứng minh business correctness và có false positives; suppressions cần reason/owner.

CI pipeline nên chạy format/lint/typecheck/unit trước rồi integration/e2e/security scans. Required checks protect merge; cache dependencies nhưng khóa versions/lockfiles. Test reports/artifacts cần có links, flaky policy và failure ownership. Quality gates cân bằng defect risk với feedback time; flaky gate làm team mất niềm tin.

## 3. Code ví dụ

GitHub Actions quality gate cho PHP và TypeScript; command names phụ thuộc package/composer scripts của repository.

```yaml
name: quality
on: [pull_request]
jobs:
	checks:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v4
			- uses: actions/setup-node@v4
				with: { node-version: 22, cache: npm }
			- run: npm ci
			- run: npm run lint
			- run: npm run typecheck
			- run: npm test -- --run
```

Pin third-party actions to reviewed immutable SHAs where organization policy requires it; use separate PHP matrix/job and least-privilege workflow permissions.

## 4. Trade-off & Best practices

- Tự động hóa formatting/lint to remove subjective review churn; humans review architecture/behavior and risk.
- Bắt đầu static analysis ở level có adoption, lập baseline debt và ratchet stricter over time; không blanket-ignore whole folders.
- Đặt fast deterministic checks trước expensive suites; parallelize independent jobs but report one clear failure cause.
- Review diff nhỏ, mô tả intent/alternatives/testing; author self-review whitespace/generated files trước request.
- Comments cụ thể, giải thích risk/reason; phân loại blocking, suggestion, question để tránh ambiguity.
- CI use immutable lockfiles, minimal permissions, secret isolation for fork PRs and protected deployment environments.
- Track change failure rate, review cycle time, flakiness and defect escape—không dùng LOC/review comments làm quota.
- Track change failure rate, review cycle time, flakiness and defect escape—không dùng LOC/review comments làm quota.
- Với monorepo, chạy checks theo affected packages nhưng giữ periodic full validation để phát hiện dependency graph gaps. Lock tool versions, cache key theo lockfile và report baseline changes để CI không âm thầm trượt quality threshold.
- Với monorepo, chạy checks theo affected packages nhưng giữ periodic full validation để phát hiện dependency graph gaps. Lock tool versions, cache key theo lockfile và report baseline changes để CI không âm thầm trượt quality threshold.
- Mọi suppression nên gắn lý do, owner và expiry/remediation link; nếu tool tạo nhiều false positives, sửa rule/config hoặc upstream typing thay vì thêm ignore pattern rộng. Review findings theo risk giúp static analysis trở thành feedback channel thay vì gate hình thức.

## 5. Lỗi thường gặp / Pitfalls

- Reviewer tập trung formatting trong khi bỏ sót auth/data races/migration risks.
- CI gate flaky hoặc chậm đến mức developers bypass.
- Static analysis baseline suppresses new findings cùng lỗi cũ mà không có ratchet.
- Review comments mang tính phán xét/không actionable hoặc yêu cầu preference như blocker.
- Workflow PR từ fork được cấp secrets/write permissions không cần thiết.
- Chỉ chạy tests trên local environment khác CI/production runtime.
- Dùng coverage/lint pass như bằng chứng feature đúng.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Code review nên ưu tiên gì?</b></summary>

Correctness, security, data integrity, compatibility and operability. Style được formatter/linter xử lý để con người tập trung risk.

</details>

<details>
<summary><b>Q2. Static analysis khác tests?</b></summary>

Static analysis suy luận source paths/types mà không execute; tests chạy behavior trên inputs/fixtures. Chúng bổ sung nhau.

</details>

<details>
<summary><b>Q3. Quản lý legacy static-analysis debt ra sao?</b></summary>

Tạo baseline, không cho findings mới tăng, fix theo module/risk và nâng strictness dần; suppress có reason/owner/expiry khi cần.

</details>

<details>
<summary><b>Q4. Làm sao rút ngắn review cycle mà không hạ quality?</b></summary>

Diff nhỏ, clear context/risks, automated checks, reviewer ownership/rotation và explicit priority. Track latency và defect escape.

</details>

<details>
<summary><b>Q5. CI workflow security cần gì?</b></summary>

Least-privilege permissions, fork secrets isolation, pinned dependencies/actions, protected deploy environments và artifact provenance.

</details>

## 7. Ứng dụng vào CV

- Thiết lập PHPStan/Psalm/ESLint quality gates theo ratchet cho **[N]** repositories, giảm escaped defects **[A]%**.
- Tối ưu CI/review workflow, giảm median PR cycle time từ **[A] giờ xuống [B] giờ** trong khi giữ change failure rate ổn định.

## 8. Tài liệu tham khảo

- [PHPStan](https://phpstan.org/user-guide/getting-started)
- [Psalm](https://psalm.dev/docs/)
- [ESLint](https://eslint.org/docs/latest/)
- [Google Engineering Practices: Code Review](https://google.github.io/eng-practices/review/)
