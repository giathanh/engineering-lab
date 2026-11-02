# CI/CD pipeline, deployment strategy (blue-green, canary, rolling)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- CI tự động build/test/scan mỗi change; CD deploy artifact qua environments với approvals/policies và evidence.
- Build artifact một lần rồi promote cùng immutable digest qua environments; không rebuild khác nhau mỗi stage.
- Rolling deploy cập nhật instances theo batch; blue-green chuyển traffic giữa hai pools; canary tăng traffic dần theo metrics.
- Rollback code không luôn rollback schema/data; migrations cần expand-contract và backward compatibility.
- Deployment success là user-facing metrics ổn định, không chỉ command exit 0.

## 2. Khái niệm cốt lõi

Pipeline stages thường gồm checkout/lockfile install, lint/typecheck/unit, integration/security scans, package/image build, SBOM/signature, artifact registry, deploy staging, smoke/acceptance, progressive production rollout, observe và promote/rollback. Secrets/permissions cần scoped per job/environment. Supply-chain provenance chứng minh artifact source/build process.

Rolling deployment thay instances từng phần; capacity phải đủ trong lúc old/new cùng chạy, API/schema tương thích. Blue-green deploy song song environment mới rồi switch load balancer; rollback nhanh bằng switch ngược nhưng cần capacity gấp đôi và database compatibility. Canary gửi phần nhỏ traffic qua new version, so sánh error/latency/business metrics, rồi tăng hoặc rollback. Feature flags tách deploy code khỏi release behavior nhưng cần lifecycle/cleanup.

Database migrations là risk lớn: expand schema backward-compatible, deploy code đọc/ghi, backfill, switch consumers rồi contract sau khi old versions hết. Destructive change không thể rollback bằng image revert đơn giản. Health gates cần SLO thresholds, minimum sample size và auto-pause; false signals/low traffic cần manual decision.

## 3. Code ví dụ

Pipeline skeleton: test/build app, rồi build image từ cùng source commit ở job khác. Mỗi job có workspace riêng nên đều cần checkout; needs chỉ tạo dependency, không truyền files. Tag theo SHA giúp traceability nhưng vẫn có thể bị ghi đè; chỉ content digest là immutable.

```yaml
name: build
on: [push, pull_request]
permissions:
  contents: read
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm test -- --run
      - run: npm run build
  image:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t registry.example/app:${GITHUB_SHA} .
```

Ví dụ dừng ở build image cục bộ, chưa push/deploy. Production cần pin actions, push vào registry được kiểm soát, scan/sign và promote cùng image digest qua staging/production. Nếu muốn image chứa đúng dist đã test ở job verify, phải upload/download artifact giữa jobs và dùng Dockerfile đóng gói artifact đó; không tự giả định hai job chia sẻ output.

## 4. Trade-off & Best practices

- Keep pipeline fast and deterministic; parallelize independent jobs, cache safely and make failures actionable.
- Promote same signed artifact; separate build-time config from runtime secrets/configuration.
- Canary for risk-sensitive/high-traffic systems with automated health gates; blue-green when parallel capacity/switching fits; rolling for simple compatible services.
- Ensure N+1 capacity, graceful drain, backward-compatible API/schema and rollback/roll-forward runbook.
- Use progressive delivery with error-rate/latency/business SLOs; pause on insufficient traffic or noisy metrics.
- Pin dependencies/actions, minimize CI permissions, protect secrets from untrusted forks and isolate deploy credentials.
- Track change failure rate, deployment frequency, lead time and recovery time; no metric alone is team performance score.
- Pipeline failure cần distinguish code failure, flaky test, dependency outage và credential/config issue; mỗi loại có owner/remediation khác nhau. Sau deployment, smoke checks nên xác nhận critical user journey và data integrity, không chỉ readiness endpoint.
- Giữ deploy permissions tách khỏi build job khi có thể; chỉ trusted branch/environment mới được assume production role. Artifact attestations/SBOM hỗ trợ supply-chain review, còn deployment audit trail cần map digest tới source commit và approver.

## 5. Lỗi thường gặp / Pitfalls

- Build separately per environment so tested artifact differs from production.
- Tag image `latest` and lose traceability/rollback certainty.
- Canary traffic without comparing error/latency/business metrics or with too few samples.
- Roll back app code after incompatible DB migration and corrupt writes.
- Deploy all instances simultaneously, causing capacity drop or connection storm.
- CI credentials have broad cloud admin permissions/long-lived keys.
- Treat successful deploy command as proof of healthy release.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Rolling, blue-green, canary khác gì?</b></summary>

Rolling replaces instances incrementally; blue-green switches between parallel pools; canary exposes new version to small traffic cohort and expands based on signals.

</details>

<details>
<summary><b>Q2. Vì sao promote same artifact?</b></summary>

Đảm bảo artifact production chính là artifact đã test/scan, tăng reproducibility/provenance và giảm environment drift.

</details>

<details>
<summary><b>Q3. Canaries cần metric nào?</b></summary>

Error/latency/resource plus business outcomes and minimum sample size, segmented by version/cohort. Gate needs thresholds and auto-pause.

</details>

<details>
<summary><b>Q4. Database migration rollback ra sao?</b></summary>

Ưu tiên expand-contract, backward-compatible rollout và roll-forward fixes. Data-destructive migrations cần backup/restore/compensation plan riêng.

</details>

<details>
<summary><b>Q5. Feature flag thay deployment strategy không?</b></summary>

Không. Flag tách code deploy/release behavior nhưng cần progressive rollout, observability, fallback và cleanup lifecycle.

</details>

## 7. Ứng dụng vào CV

- Triển khai canary/automated SLO gates cho **[N]** services, giảm change failure rate **[A]%** và MTTR **[B]%**.
- Chuẩn hóa immutable artifact promotion/SBOM/signing, rút release lead time từ **[A] giờ xuống [B] phút**.

## 8. Tài liệu tham khảo

- [Google Cloud: CI/CD best practices](https://cloud.google.com/architecture/devops/devops-tech-continuous-delivery)
- [AWS: Blue/Green deployments](https://docs.aws.amazon.com/whitepapers/latest/blue-green-deployments/welcome.html)
- [GitHub Actions documentation](https://docs.github.com/actions)
- [SLSA Framework](https://slsa.dev/)

- [GitHub Actions: truyền artifacts giữa jobs](https://docs.github.com/en/actions/tutorials/store-and-share-data)
