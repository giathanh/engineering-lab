# Mentoring, code review văn hóa tốt

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Mentoring tăng khả năng tự giải quyết của mentee; không biến mentor thành người sửa hộ hoặc duyệt mọi quyết định.
- Điều chỉnh coaching style theo mục tiêu, experience và context; hỏi trước khi đưa solution.
- Code review tập trung correctness, security, maintainability và knowledge sharing; formatter/linter tự xử lý style.
- Feedback cụ thể, tôn trọng, gắn risk/reason; phân biệt blocker, suggestion và question.
- Review culture tốt có psychological safety, clear ownership, response-time expectations và escalation path cho blocker.

## 2. Khái niệm cốt lõi

Mentoring là quan hệ phát triển capability dài hạn; coaching tập trung giúp người khác tự tìm đáp án qua câu hỏi; sponsorship mở cơ hội/visibility. Senior có thể dùng cả ba. Bắt đầu bằng mục tiêu mentee, context và preferred support. Hỏi “bạn đã thử gì/đang cân nhắc option nào?” trước khi giải quyết thay. Pairing/live debugging tốt khi mentee giữ keyboard và giải thích reasoning.

Code review là quality gate lẫn collaboration. Author cung cấp problem/context/design/testing evidence; reviewer đọc diff theo risk model, xem tests/migrations/security/performance/operability. Review comment nên nói observation + impact + suggested path. “Why?”/“Consider…” không nên dùng passive-aggressive; mark blocking vs non-blocking. Reviewer accountable cho timely response; author accountable cho resolving/answering.

Psychological safety không có nghĩa bỏ standards; nó cho phép nêu uncertainty/incident sớm mà không sợ humiliation. Team conventions giúp giảm subjective debates: style automation, PR size, ownership, approval criteria. Review load cần rotate, avoid single gatekeeper và recognize invisible mentoring/review work.

## 3. Code ví dụ

Ví dụ review comment tập trung risk và đưa lựa chọn, không phán xét tác giả.

```text
Blocking: This update can run twice when the queue redelivers the job, so it may charge the customer twice.
Could we persist an idempotency key with the payment result and add a duplicate-delivery test?

Suggestion: The query shape is correct. A composite index on (tenant_id, created_at)
may avoid the sort at current volume; can we confirm with EXPLAIN before merging?
```

## 4. Trade-off & Best practices

- Agree mentoring goals, cadence, confidentiality boundaries và check-in; revisit if needs change.
- Use Socratic questions for learning, direct instruction for urgent safety/production risk; explain why.
- Review small diffs and signal risk categories; leave non-blocking suggestions distinct from merge blockers.
- Automate formatting/lint/type checks; reserve reviewer attention for semantics and long-term maintenance.
- Model respectful disagreement and admit reviewer uncertainty; invite domain experts/security when needed.
- Rotate review ownership, set response-time expectations and recognize mentoring as engineering work.
- For recurring feedback, pair live or document shared pattern rather than repeating comments ad hoc.
- Mentoring progress có thể đo bằng scope mentee tự sở hữu, quality of decisions, collaboration feedback và khả năng debug độc lập; không đo bằng số buổi pairing. Check-in hai chiều giúp mentor điều chỉnh support thay vì áp một curriculum chung cho mọi người.
- Agree một goal trong chu kỳ ngắn, ví dụ tự điều phối một design review hoặc on-call task với mentor backup. Sau đó debrief cả quyết định tốt, uncertainty và support nào còn thiếu; thay đổi ownership dần để người học có safe stretch assignment nhưng không phải chịu blast radius vượt năng lực/authority.

## 5. Lỗi thường gặp / Pitfalls

- Mentor takes over keyboard/design, mentee learns dependency rather than capability.
- Give unsolicited advice without understanding goal/context.
- Review tone attacks person, uses sarcasm or vague “this is bad”.
- Block on personal style preference rather than convention/risk.
- Approve code while ignoring test evidence/migrations/security because deadline is near.
- Senior becomes only reviewer, slows throughput and centralizes knowledge.
- Treat psychological safety as avoiding direct feedback; clear standards and kindness coexist.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Mentor khác sửa hộ thế nào?</b></summary>

Mentor giúp mentee xây reasoning/skills qua context, questions, pairing and feedback; sửa hộ nhanh đôi khi cần nhưng không thay learning plan.

</details>

<details>
<summary><b>Q2. Code review nên ưu tiên gì?</b></summary>

Correctness, security, data integrity, compatibility and operability. Style nên có automation; review comments phải actionable và phân rõ severity.

</details>

<details>
<summary><b>Q3. Xử lý bất đồng trong review?</b></summary>

Quay về contract/evidence/convention, nêu risk và alternatives; escalate owner/ADR khi không thống nhất trong timebox.

</details>

<details>
<summary><b>Q4. Làm sao cân tốc độ và review quality?</b></summary>

PR nhỏ, automation, reviewer rotation, clear risk checklist và service-level response targets; high-risk change có deeper review.

</details>

<details>
<summary><b>Q5. Psychological safety có nghĩa gì?</b></summary>

Team có thể nêu concerns/admit mistakes/ask questions mà không bị humiliation; vẫn giữ accountability và quality standards.

</details>

## 7. Ứng dụng vào CV

- Mentoring **[N]** engineers qua pairing/feedback plans, giúp họ independently own **[scope]** trong **[A] tháng**.
- Cải thiện PR review workflow, giảm median review time **[A]%** và escaped defects **[B]%** bằng automation/risk-based review.

## 8. Tài liệu tham khảo

- [Google Engineering Practices: Code Review](https://google.github.io/eng-practices/review/)
- [The Manager's Path](https://www.oreilly.com/library/view/the-managers-path/9781491973882/)
- [Staff Engineer: Mentoring](https://staffeng.com/guides/mentoring/)
- [Amy Edmondson: Psychological Safety](https://www.hbs.edu/faculty/Pages/item.aspx?num=29530)
