# Viết tài liệu kỹ thuật, RFC/ADR

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~8 phút

## 1. Tóm tắt nhanh (TL;DR)

- Technical writing làm shared context bền vững, giảm repeated explanation và decision ambiguity.
- RFC mở discussion cho proposal/alternatives; ADR ghi một architectural decision đã chọn cùng context/consequences.
- Audience, decision needed, status, owner và expiry/revisit trigger cần rõ ngay đầu tài liệu.
- Viết theo problem/evidence/options/trade-offs/recommendation, không biến doc thành dump implementation details.
- Tài liệu cần versioning, review, discoverability và lifecycle; stale docs có thể dẫn tới quyết định hoặc thao tác sai; cần đánh dấu trạng thái và owner cập nhật.

## 2. Khái niệm cốt lõi

RFC thường là proposal trước quyết định; mời stakeholder review, ghi open questions, comments và acceptance criteria. ADR ghi decision/status/context/options/consequences sau khi thống nhất; supersede ADR cũ thay vì sửa history như thể quyết định chưa từng khác. Design docs chi tiết system behavior/interfaces/operations; runbooks tập trung actionable recovery steps; API docs phục vụ consumers.

Audience determines depth: leadership cần impact/cost/risk, implementers cần interfaces/migration/tests, operators cần failure/alerts/rollback. Good document starts with summary and decision request, defines terms, links evidence, states assumptions, shows alternatives and consequences. Diagrams cần legend/data flow/trust boundaries, không phải decoration.

Review process cần timebox và decision owner. Comments phân biệt blocking question, suggestion và editorial. RFC status (draft/review/accepted/rejected/superseded) giúp readers biết authority. ADR concise, immutable after accepted except corrections; new evidence tạo ADR mới. Docs-as-code có PR/review/versioning, nhưng phải đảm bảo non-engineering audience access.

## 3. Code ví dụ

ADR template ngắn cho decision có trade-offs.

```md
# ADR-012: Store report exports in object storage

Status: Accepted
Date: 2026-11-02

## Context
Exports exceed application worker memory and need short-lived download links.

## Decision
Write files to private object storage and issue expiring signed URLs.

## Consequences
Workers stream uploads; retention lifecycle is automated; download access is audited.
We accept provider coupling and must test key rotation and expiry behavior.
```

## 4. Trade-off & Best practices

- RFC cho broad/high-impact changes; ADR cho durable decision; small reversible implementation choices có thể chỉ cần PR notes.
- Đưa recommendation/decision request lên đầu, chi tiết theo progressive disclosure.
- Ghi rejected alternatives và why, operational/security consequences, rollout/rollback and revisit triggers.
- Link metrics, prototypes, threat models, migrations và owners; phân biệt facts với assumptions.
- Keep docs close to code/schema when possible; assign owner/review date cho long-lived operational docs.
- Dùng diagrams cho interactions/data flow, text/table cho constraints/options; cung cấp accessible source.
- Khi decision đổi, create superseding record and update indexes/links.
- Với RFC dài, dùng staged review: trước tiên xác nhận problem/constraints, sau đó review options, cuối cùng chốt rollout details. Cách này phát hiện bất đồng về mục tiêu trước khi team tranh luận implementation; unresolved questions được gắn owner/date thay vì biến thành prose không kết luận.
- Viết câu chủ động, định nghĩa acronyms lần đầu và tách normative requirements khỏi examples. Một diagram nên có owner/source và mô tả failure paths; nếu không, người đọc dễ coi happy-path drawing là guarantee. User test docs bằng người ngoài team giúp phát hiện jargon hoặc missing setup context.

## 5. Lỗi thường gặp / Pitfalls

- Viết RFC mà không nêu decision needed/owner/deadline, discussion kéo dài vô hạn.
- Chỉ trình bày preferred option, không ghi alternatives/consequences.
- ADR không cập nhật status/superseded links sau khi architecture đổi.
- Tài liệu quá dài nhưng thiếu summary/next action/audience fit.
- Diagrams không versioned hoặc khác code, tạo false source of truth.
- Dùng documentation thay conversation hoặc coi consensus là mọi người phải đồng ý.
- Runbook mô tả architecture nhưng không có executable recovery steps/verification.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. RFC khác ADR?</b></summary>

RFC là proposal để thảo luận trước decision; ADR ghi quyết định đã chọn, context và consequences để future teams hiểu.

</details>

<details>
<summary><b>Q2. ADR nên chứa gì?</b></summary>

Status/date, context, decision, alternatives và consequences/trade-offs; có thể thêm owner/revisit trigger/links.

</details>

<details>
<summary><b>Q3. Khi nào cần RFC?</b></summary>

Thay đổi cross-team/high-risk/irreversible cần input trước implementation hoặc nhiều constraints cần thống nhất.

</details>

<details>
<summary><b>Q4. Làm sao giữ docs khỏi stale?</b></summary>

Owner, docs-as-code/review hooks, links near code, automated checks where possible và explicit lifecycle/retirement.

</details>

<details>
<summary><b>Q5. Decision có cần unanimous consensus?</b></summary>

Không. Có decision owner sau consultation; record dissent/risk and decision rationale, rồi commit vào execution trừ safety/legal blockers.

</details>

## 7. Ứng dụng vào CV

- Viết RFC/ADR cho **[N]** cross-team decisions, rút ngắn decision cycle **[A]%** và giảm repeated integration misunderstandings **[B]%**.
- Chuẩn hóa runbooks cho **[N]** services, giảm recovery time **[A]%** và escalation toil **[B] giờ/quý**.

## 8. Tài liệu tham khảo

- [Michael Nygard: Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [MADR: Markdown Any Decision Records](https://adr.github.io/madr/)
- [Google Engineering Practices: Documentation](https://developers.google.com/tech-writing)
- [Diátaxis Documentation Framework](https://diataxis.fr/)
