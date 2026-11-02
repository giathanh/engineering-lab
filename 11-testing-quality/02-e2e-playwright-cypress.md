# E2E: Playwright/Cypress

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- E2E kiểm tra luồng thực qua browser/UI và backend dependencies; dùng cho critical journeys, không thay unit/integration suites.
- Playwright hỗ trợ Chromium/Firefox/WebKit, isolated browser contexts, auto-waiting và multi-page; Cypress có interactive runner/component/e2e workflows và ecosystem riêng.
- Dùng accessible roles/labels hoặc stable test IDs; tránh brittle CSS selectors và fixed sleeps.
- Seed/reset test data, isolate users/tenants, intercept external boundaries và chạy test deterministically.
- Flakiness là bug test/system signal; trace/video/network artifacts giúp điều tra, retry chỉ là diagnostics.

## 2. Khái niệm cốt lõi

E2E test chạy browser thật hoặc browser automation, đi qua routing, frontend, network và backend path được chọn. Nó có fidelity cao nhưng tốn thời gian, setup/environment và dễ flaky do async/network/shared state. Critical path như login, checkout, permission boundary nên có một số tests; mọi validation branch không cần chạy full stack.

Playwright auto-waits cho actionability (visible/enabled/stable) và assertions retry; BrowserContext cô lập cookies/storage. Fixtures quản lý setup/teardown; trace viewer ghi snapshots/actions/network. Cypress chạy trong browser context với command chain/retry-ability, interactive debugging và network stubbing. Chọn theo browser matrix, team workflow, CI parallelism, component tests và ecosystem.

Reliable tests dùng deterministic data/API setup, unique test accounts, reset state và explicit waiting theo UI condition. Selector theo role/name mô tả user intent; `data-testid` ổn định khi semantics không có. Network intercept dùng cho third-party/unreliable services, nhưng critical integration vẫn cần tests thật riêng.

## 3. Code ví dụ

Playwright test checkout success với assertions user-visible; dữ liệu cart được seed qua API helper.

```ts
import { test, expect } from '@playwright/test';

test('customer completes checkout', async ({ page }) => {
	await page.goto('/checkout');
	await page.getByLabel('Email').fill('buyer@example.test');
	await page.getByRole('button', { name: 'Place order' }).click();

	await expect(page.getByRole('heading', { name: 'Order confirmed' })).toBeVisible();
	await expect(page.getByTestId('order-status')).toHaveText('Paid');
});
```

Test cần setup cart/payment sandbox và cleanup; không phụ thuộc real external payment. Assert key user outcome, không assert toàn bộ DOM snapshot.

## 4. Trade-off & Best practices

- Giữ E2E suite nhỏ tập trung critical user journeys, auth boundaries và integration risks.
- Dùng API/database fixtures để setup nhanh; vẫn kiểm tra UI flow từ entry point liên quan.
- Tránh fixed `waitForTimeout`; wait theo role/state/network condition có ownership.
- Isolate test data per worker, dùng idempotent cleanup và không chia sẻ account mutable.
- Dùng test retries để thu trace/flaky diagnostics, không coi retry pass là test healthy.
- CI chia shards, cache browser binaries, upload traces/screenshots khi failure và giữ test duration visible.
- Chạy browser/device matrix dựa support matrix; test accessibility/keyboard song song với happy paths.
- Phân biệt product defect với environment failure qua trace, console, request logs và browser version; CI images nên được version/pinned. Khi test flake chỉ xảy ra dưới parallel load, kiểm tra shared accounts, rate limits và test data cleanup trước khi tăng timeout.
- Artifact của failed run cần giữ trace/video vừa đủ để tái hiện nhưng redact credentials và user data. Quarantine một test chỉ là biện pháp ngắn hạn: gắn owner, issue và ngày gỡ quarantine để flaky test không biến thành suite mặc định bị bỏ qua.

## 5. Lỗi thường gặp / Pitfalls

- Selector CSS theo DOM implementation đổi thường xuyên.
- Test phụ thuộc order/shared database, chạy parallel thì fail.
- Fixed sleeps làm chậm suite và vẫn race dưới load.
- Stub mọi network trong mọi test nên không test integration; hoặc gọi external prod APIs làm test nondeterministic.
- Retry policy che flaky tests kéo dài nhiều tháng.
- E2E asserts internal implementation details, tạo maintenance burden.
- Test environment khác production auth/cookie/HTTPS behavior quá nhiều.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. E2E nên cover bao nhiêu?</b></summary>

Critical user journeys/risk boundaries, không mọi combinations. Unit/integration cover branch matrix nhanh hơn; E2E xác nhận end-to-end integration.

</details>

<details>
<summary><b>Q2. Vì sao dùng role selectors?</b></summary>

Chúng gần user/accessibility semantics và phát hiện controls thiếu accessible name. Test IDs dùng cho element không có semantic selector phù hợp.

</details>

<details>
<summary><b>Q3. Auto-waiting có loại bỏ flakiness không?</b></summary>

Không. Nó giảm timing races cho actionability/assertions nhưng shared data, external services, race conditions và unstable environment vẫn gây flake.

</details>

<details>
<summary><b>Q4. Khi nào intercept network?</b></summary>

Khi cần deterministic isolation khỏi third-party/rare failure hoặc kiểm tra UI states. Giữ separate integration tests cho API/backend contract quan trọng.

</details>

<details>
<summary><b>Q5. Playwright và Cypress chọn thế nào?</b></summary>

So sánh browser requirements, isolation, debugging, test runner model, ecosystem, team familiarity và CI cost qua pilot trên workflows thật.

</details>

## 7. Ứng dụng vào CV

- Xây Playwright/Cypress suite cho **[N]** critical journeys, giảm escaped UI defects **[A]%** và regression feedback xuống **[B] phút**.
- Loại bỏ shared fixtures/fixed waits, giảm E2E flakiness từ **[A]% xuống [B]%** trong CI shards.

## 8. Tài liệu tham khảo

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright: Best Practices](https://playwright.dev/docs/best-practices)
- [Cypress Documentation](https://docs.cypress.io/)
- [Testing Library: Guiding Principles](https://testing-library.com/docs/guiding-principles/)

