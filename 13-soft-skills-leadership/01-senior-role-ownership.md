# Vai trò senior: ownership, technical decision, trade-off

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Senior ownership là chịu trách nhiệm outcome từ problem framing tới vận hành, không đồng nghĩa làm mọi việc hoặc trở thành bottleneck.
- Technical decisions cân requirements, constraints, uncertainty, reversibility, cost, risk và team capability.
- Good ownership làm trade-offs explicit, giao tiếp sớm, phối hợp stakeholders và tạo đường rollback/measurement.
- Influence qua dữ liệu, prototypes, documentation và trust; disagreement không biến thành quyền lực chức danh.
- Senior nâng năng lực team bằng delegation, guardrails và shared context, không “hero mode”.

## 2. Khái niệm cốt lõi

Ownership bắt đầu bằng outcome: user/business problem, success metric, reliability/security boundaries, operational owner. Senior không chỉ nhận ticket và code; họ làm rõ ambiguity, phát hiện dependency/risk, xác định release/rollback/monitoring và theo dõi sau ship. Ownership khác individual heroics: hệ thống phải có owner/team, runbook, tests và handoff để không phụ thuộc một người.

Decision quality phụ thuộc context và reversibility. Reversible choices có thể thử nhỏ và đo; irreversible/high-blast-radius choices cần broader review, staged rollout và evidence. So sánh options theo criteria: user impact, latency/availability, security, cost, migration effort, failure modes, team skill và opportunity cost. Không tối ưu chỉ cho code elegance.

Decision process: frame problem/constraints, gather evidence, invite dissent, state recommendation and rejected alternatives, record owner/date/conditions to revisit. Khi có bất đồng, phân biệt facts, assumptions và preferences; đặt timebox để quyết định. Sau quyết định, disagree-and-commit không có nghĩa im lặng trước safety risk; escalation cần dữ liệu và respectful path.

Senior cần communicate ở nhiều độ cao: one-line outcome cho leadership, trade-offs/risk cho peers, implementation detail cho team. Delegation chia ownership theo bounded scope với context, success criteria, check-in points và support; không dump vague tasks. Failure analysis tập trung system/process, không quy blame cá nhân.

## 3. Code ví dụ

Decision record ngắn làm rõ quyết định, constraints và revisit triggers.

```md
## Decision: use cursor pagination for the activity feed

Status: Accepted
Context: Feed grows beyond the tested offset range; stable traversal matters.
Options: offset pagination, cursor pagination, precomputed feed.
Decision: Cursor pagination ordered by (created_at, id).
Trade-offs: No arbitrary page jumps; stable traversal and bounded query cost.
Revisit when: Product requires random page access or query SLO is missed.
Owner: Activity team
```

## 4. Trade-off & Best practices

- Kết nối technical work với user/business metric và explicit risk, không chỉ “refactor cho sạch”.
- Chọn smallest reversible experiment khi uncertainty cao; dùng staged rollout/feature flags cho blast radius lớn.
- Record rationale/assumptions/owner, không document mọi implementation detail bất biến.
- Tìm feedback sớm từ security/operations/product; late review làm architecture decisions khó đảo.
- Delegate outcomes với boundaries và coaching availability; để người nhận sở hữu solution design.
- Escalate khi risk vượt authority/time budget, đưa options và recommendation thay chỉ nêu vấn đề.
- Đo sau ship: SLO, adoption, support tickets, cost, rollback rate; cập nhật quyết định khi evidence đổi.
- Khi nhiều teams cần cùng decision, đặt decision owner và deadline review rõ ràng để consultation không biến thành veto-by-silence. Sau khi quyết định, chia nhỏ rollout và chia sẻ rationale để các team phụ thuộc có thể tự đưa ra decisions nhất quán.

## 5. Lỗi thường gặp / Pitfalls

- “Senior solves everything” khiến team phụ thuộc một người và knowledge silo.
- Quyết định dựa vào preferred stack, không nêu requirements/alternatives.
- Over-document reversible implementation detail nhưng không record irreversible trade-off.
- Chờ certainty tuyệt đối rồi làm lỡ opportunity hoặc dùng deadline để bỏ risk review.
- Delegate task nhưng giữ mọi decisions/review lại ở senior.
- Nhầm ownership với blame khi incident xảy ra.
- Không revisit assumption khi traffic/team/product thay đổi.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Senior ownership khác task completion?</b></summary>

Ownership theo outcome end-to-end: clarify, design, delivery, rollout, monitoring và learning. Task completion chỉ là một phần.

</details>

<details>
<summary><b>Q2. Khi trade-off không có lựa chọn hoàn hảo?</b></summary>

Đặt criteria/constraints rõ, lượng hóa impact/uncertainty, chọn option fit hiện tại và nêu trigger để revisit.

</details>

<details>
<summary><b>Q3. Xử lý bất đồng technical thế nào?</b></summary>

Tách facts/assumptions, lắng nghe requirements, so sánh options theo shared criteria, timebox và record decision/risks.

</details>

<details>
<summary><b>Q4. Làm sao tránh trở thành bottleneck?</b></summary>

Chia ownership, document context, automate guardrails, delegate decisions có boundary và tạo review capacity cho team.

</details>

<details>
<summary><b>Q5. Khi nào cần escalate?</b></summary>

Khi risk/customer/security/compliance vượt authority hoặc deadline, và team không thể giải quyết qua normal decision path; mang theo impact/options.

</details>

## 7. Ứng dụng vào CV

- Dẫn dắt **[initiative]** từ discovery tới rollout, đạt **[metric]** và giảm **[risk/cost] [A]%**.
- Phân quyền ownership cho **[N]** engineers qua guardrails/ADRs, giảm dependency bottlenecks **[A]%** và delivery lead time **[B]%**.

## 8. Tài liệu tham khảo

- [Staff Engineer: Leadership beyond the management track](https://staffeng.com/book)
- [Google SRE: Managing Incidents](https://sre.google/sre-book/managing-incidents/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [GitLab: Engineering leadership](https://handbook.gitlab.com/handbook/engineering/)

