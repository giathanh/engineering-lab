# Xử lý incident, postmortem, technical debt

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Incident response ưu tiên safety/customer impact, restore service và communication; root-cause analysis diễn ra sau stabilization.
- Incident roles (commander, operations, communications) giảm confusion và parallelize work.
- Blameless postmortem tìm contributing conditions/system gaps, không gán lỗi cá nhân; actions cần owner/priority/due date.
- Technical debt là future change cost/risk; ghi debt bằng impact/evidence, budget và repayment strategy.
- Repeated incidents, toil, unsupported dependencies và missing tests có thể là debt cần ưu tiên vì chúng tăng risk/customer harm.

## 2. Khái niệm cốt lõi

Incident management flow: detect/declare, assess severity/scope, assign roles, mitigate/restore, communicate status, resolve and follow-up. Mitigation (rollback/feature disable/failover) ưu tiên khôi phục user impact; permanent fix có thể đến sau. Preserve evidence/logs and avoid destructive debugging. Status updates state impact, what changed, next update time; do not speculate as fact.

Blameless postmortem không có nghĩa no accountability; focus on why system allowed action/outcome, incentives, signals, guardrails and context available at time. Timeline includes detection, decisions, mitigations and recovery. Contributing factors can be multiple; “human error” is not root cause. Action items should be specific, measurable, owned and prioritized by risk; track completion and validate effectiveness.

Technical debt is deliberate or accidental shortcut that increases future cost/risk. Debt register should link to code/service, impact evidence (change lead time, incidents, support toil), remediation size and risk of not paying. Interest accrues as repeated work/defects. Strategies include opportunistic cleanup, scheduled capacity, dedicated remediation, upgrade program or migration. Business priority changes; quantify debt in user/operational terms.

## 3. Code ví dụ

Incident update template giữ thông tin hữu ích, không kết luận sớm.

```text
Status: Investigating / Mitigating / Monitoring / Resolved
Impact: Which users, regions, operations, and since when
Current evidence: Confirmed facts only
Mitigation: Actions taken and observed result
Owner: Incident commander / communications / operations
Next update: Timestamp and channel
```

## 4. Trade-off & Best practices

- Severity based on user/business impact, data/security risk and scope; define escalation/on-call boundaries in advance.
- Use one incident commander, explicit roles, shared timeline and one source of truth.
- Mitigate safely, record commands/changes and communicate at predictable intervals.
- Postmortem within a useful timeframe, invite cross-functional contributors and distinguish facts/interpretations.
- Actions reduce likelihood, detection time or blast radius; add owner, due date, priority and verification signal.
- Debt prioritization compare repayment cost with incident probability/impact, feature delay and operational toil.
- Technical debt review nên gắn với planning cadence: service owner cập nhật risk evidence, product/engineering thống nhất capacity và team đo interest đã giảm chưa. Debt không có owner hoặc không còn impact nên được reassess/retire thay vì giữ mãi trong backlog.
- Incident commander điều phối shared understanding, không nhất thiết là người debug sâu nhất; operations lead thực hiện mitigation, communications lead cập nhật stakeholders. Tách roles ngăn một engineer vừa thay đổi production vừa phải trả lời nhiều kênh và mất situational awareness.
- Track action/debt closure and repeat incidents; avoid “all tech debt” bucket without outcome/owner.

## 5. Lỗi thường gặp / Pitfalls

- Debugging in parallel without incident command or shared timeline.
- Waiting for complete root cause before restoring service.
- Public updates with unsupported certainty or no next-update time.
- Postmortem action list with no owners/deadlines or only “be more careful”.
- Blameless language interpreted as avoiding accountability for follow-through.
- Ignoring debt until rewrite, or paying low-risk debt while critical incident risk persists.
- Closing incident without validating recovery metrics/backlog/data consistency.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Ưu tiên đầu tiên trong incident?</b></summary>

Protect users/data and restore service safely; establish severity, roles and communication. Root cause analysis follows stabilization.

</details>

<details>
<summary><b>Q2. Blameless postmortem nghĩa là gì?</b></summary>

Phân tích system conditions and decisions with context, not shame individuals; still assign concrete owners/actions and accountability for improvement.

</details>

<details>
<summary><b>Q3. Làm sao đo postmortem effectiveness?</b></summary>

Action completion/verification, recurrence, time-to-detect/recover, blast radius and SLO impact—not document count.

</details>

<details>
<summary><b>Q4. Ưu tiên technical debt thế nào?</b></summary>

Estimate interest/risk using incidents, change friction, security/end-of-life and toil; compare remediation cost against product opportunity.

</details>

<details>
<summary><b>Q5. Khi nào rollback?</b></summary>

Khi change correlates with material impact and rollback is safe; account for data/schema side effects and prefer mitigation that reduces impact quickly.

</details>

## 7. Ứng dụng vào CV

- Điều phối **[N]** production incidents với defined roles/status cadence, giảm MTTR **[A]%** và repeat incidents **[B]%**.
- Ưu tiên remediation backlog theo risk/interest, giảm on-call toil **[A] giờ/tháng** và security exposure **[B]%**.

## 8. Tài liệu tham khảo

- [Google SRE: Incident Management](https://sre.google/sre-book/managing-incidents/)
- [Google SRE: Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)
- [PagerDuty Incident Response Documentation](https://response.pagerduty.com/)
- [Martin Fowler: Technical Debt](https://martinfowler.com/bliki/TechnicalDebt.html)

