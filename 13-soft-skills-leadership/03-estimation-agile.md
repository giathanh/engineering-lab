# Estimation, làm việc với PO/BA, Agile/Scrum

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~8 phút

## 1. Tóm tắt nhanh (TL;DR)

- Estimate là forecast dưới uncertainty, không phải promise hay performance commitment.
- Chia work thành outcomes/slices nhỏ, nêu assumptions/dependencies/risk và update khi evidence thay đổi.
- Story points đo relative effort trong team context; không so velocity giữa teams hoặc dùng làm productivity target.
- PO/BA phối hợp làm rõ user value, acceptance criteria, edge cases và scope trade-offs.
- Agile là feedback/adaptation loop; ceremony không thay delivery discipline, product discovery hay engineering quality.

## 2. Khái niệm cốt lõi

Estimate cố dự đoán effort/duration/uncertainty; commitment là quyết định chấp nhận outcome/deadline. Tách chúng tránh false precision và pressure làm giảm risk disclosure. Three-point estimates (optimistic/most likely/pessimistic), confidence ranges và historical throughput hữu ích hơn một con số chính xác giả. Estimate lớn báo hiệu cần discovery/slicing.

Planning poker/story points relative size team-specific; velocity chỉ hỗ trợ forecasting cùng team/conditions, không đo individual productivity. Cycle time/throughput có thể forecast probabilistically khi work items nhỏ và history ổn định. Include testing, review, rollout, migration, observability and operational tasks.

PO quyết định product priority/value; BA giúp phân tích business rules/processes; engineers làm rõ feasibility/risks. Trong Scrum Guide 2020, Definition of Done là commitment của Increment; Definition of Ready, story points, planning poker và velocity không phải yêu cầu bắt buộc của Scrum. Scrum có ba accountabilities: Developers, Product Owner và Scrum Master; BA là chức danh có thể tồn tại trong tổ chức, không phải accountability riêng của Scrum. Sprint Goal là commitment của Sprint Backlog; scope có thể được thương lượng lại khi học thêm mà không làm mất Sprint Goal. Scrum events tạo cadence inspection/adaptation; Kanban visualizes WIP/flow. WIP limits giảm context switching và expose bottlenecks.

## 3. Code ví dụ

Breakdown forecast với range và assumptions làm visible uncertainty.

```text
Outcome: export tenant report
Slice 1: define CSV contract + authorization        1–2 days
Slice 2: query/projection + pagination              2–4 days
Slice 3: async job + object storage + expiry         2–5 days
Slice 4: tests, monitoring, rollout                  1–3 days
Assumptions: < 1M rows per tenant; existing worker capacity available.
Risks: large exports may require partitioned files; compliance retention unknown.
Next step: validate volume/retention with product and security before commitment.
```

## 4. Trade-off & Best practices

- Estimate ranges/confidence and identify unknowns; use spike/prototype to reduce high-impact uncertainty.
- Slice vertical user value into deployable increments; avoid technical tasks that hide end-to-end risk.
- Update forecasts when scope/data changes; communicate impact/options early, not only at deadline.
- Use velocity for team planning within stable context, not cross-team comparison or individual targets.
- Pair with PO/BA on examples, edge cases, acceptance criteria and out-of-scope decisions.
- Limit WIP and track cycle time/blockers; delivery predictability comes from flow and small batches.
- Reserve capacity for incidents/maintenance only with explicit historical data and prioritization.
- Forecasts nên được cập nhật theo actual throughput/blocked time, không “correct” estimates retrospectively để trông chính xác hơn. So sánh actual với assumptions giúp team cải thiện planning mà không biến forecast miss thành đánh giá cá nhân.
- Khi dependencies ngoài team chưa rõ, tách discovery/decision deadline khỏi implementation forecast và ghi owner cần phản hồi. Nếu scope có thể giảm, thống nhất minimum releasable slice với PO trước; không âm thầm bỏ testing, security hoặc rollout tasks để giữ một date giả.
- Retrospectives nên chọn một systemic improvement có owner/experiment trong iteration kế tiếp thay tạo danh sách dài. Forecast review nhìn vào work mix, interruption và blocked time; velocity tăng/giảm tự nó không chứng minh team productivity hay chất lượng tốt hơn.

## 5. Lỗi thường gặp / Pitfalls



- Give exact date before discovery and treat it as contract regardless of scope change.
- Estimate only coding time, omit review, QA, migration, rollout and support.
- Convert story points to hours globally or use velocity as developer KPI.
- Hide uncertainty to appear confident; risks surface late as surprise delay.
- Start too many tasks, increasing context switching and unfinished work.
- Ceremony-heavy Scrum without working increments/customer feedback.
- Blame individuals for forecast misses instead of examining assumptions/dependencies.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Estimate khác commitment?</b></summary>

Estimate là forecast với uncertainty; commitment là decision to deliver scope/outcome under constraints. A good forecast states assumptions/confidence.

</details>

<details>
<summary><b>Q2. Story points dùng thế nào?</b></summary>

Relative team-local sizing for planning, combined with historical throughput. Not hours or cross-team/individual productivity metric.

</details>

<details>
<summary><b>Q3. Khi estimate quá lớn?</b></summary>

Clarify scope, split vertical slices, identify unknowns and run a timeboxed spike when it reduces important uncertainty.

</details>

<details>
<summary><b>Q4. Báo delay với PO ra sao?</b></summary>

Communicate early with evidence, cause/uncertainty, user impact and options (scope/date/capacity trade-offs), giữ Definition of Done và yêu cầu an toàn đã thống nhất, then update forecast.

</details>

<details>
<summary><b>Q5. Agile có nghĩa không cần plan?</b></summary>

Không. Agile plans iteratively and adapts to evidence; it still needs goals, priorities, risks and working agreements.

</details>

## 7. Ứng dụng vào CV

- Thiết lập flow-based planning và work slicing cho **[N]** teams, tăng forecast accuracy **[A]%** và giảm cycle time **[B]%**.
- Làm rõ acceptance criteria/dependencies với PO/BA trước sprint, giảm carry-over **[A]%** qua **[N]** iterations.

## 8. Tài liệu tham khảo

- [The Scrum Guide](https://scrumguides.org/scrum-guide.html)
- [Kanban Guide](https://kanbanguides.org/english/)
- [Agile Manifesto](https://agilemanifesto.org/)
- [Martin Fowler: Story Points](https://martinfowler.com/bliki/StoryPoint.html)
