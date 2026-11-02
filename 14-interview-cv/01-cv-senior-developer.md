# Cấu trúc CV senior dev (impact-based, metrics, STAR) + mẫu bullet points

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~8 phút

## 1. Tóm tắt nhanh (TL;DR)

- CV senior cho thấy scope, ownership, technical judgment và measurable outcomes; không phải danh sách technologies đã chạm.
- Bullet mạnh theo cấu trúc action + problem/scope + approach + impact, dùng số liệu có thể giải thích và xác minh.
- Tailor summary/skills/experience theo role; ATS-friendly format, headings rõ và dates consistent.
- Nêu leadership/mentoring/operations cùng implementation; tránh claim “architected” nếu chỉ thực hiện task nhỏ.
- Không bịa metrics; dùng range, proxy metrics hoặc qualitative outcome có evidence khi số chính xác không có.

## 2. Khái niệm cốt lõi

CV cần giúp recruiter/hiring manager trả lời nhanh: seniority fit, domain relevance, impact, scope và evidence. Phần đầu có name/contact, role headline, concise summary (2–4 lines), core skills có chọn lọc. Experience reverse-chronological, mỗi role gồm company/title/dates/context và 3–6 impact bullets. Education/certifications/projects chỉ chiếm diện tích tương xứng với relevance.

Impact bullet có thể dùng: “Led [scope] by [approach], improving [metric] from [baseline] to [result] for [users/system]”. Metrics có thể là latency, throughput, error rate, cost, revenue, deployment frequency, MTTR, team onboarding, incident count. Gắn baseline/period/cohort để con số có ý nghĩa. Nếu metric confidential, dùng percentage/range hoặc relative scale mà vẫn chính xác.

Senior evidence gồm problem framing, architecture trade-offs, cross-team decisions, production ownership, incident learning, security/reliability, mentoring and delivery outcomes. “Used Kubernetes/React/AWS” chỉ keyword; kết nối tool với decision/result. ATS đọc text structure dễ hơn columns/icons/graphics; PDF text selectable, section titles conventional, no skill bars. Keyword tailor trung thực, không keyword-stuff.

## 3. Code ví dụ

Rewrite bullet từ responsibility thành impact, không tự tạo số liệu.

```text
Before: Responsible for improving API performance and maintaining the service.

After: Profiled the order API, replaced per-row lookups with batched queries, and
reduced p95 latency from [measured baseline] to [measured result] across [traffic scope].
```

Chỉ điền metrics có thể giải thích nguồn đo, time period và contribution cá nhân/team.

## 4. Trade-off & Best practices

- Giữ CV thường 1–2 trang theo career stage/market; signal density quan trọng hơn page count.
- Tailor headline/summary/top bullets cho role requirements, giữ employment facts chính xác.
- Dùng verbs cụ thể (designed, migrated, reduced, launched, mentored) và mô tả personal contribution rõ trong team outcome.
- Có thể nhóm skill theo languages/frameworks/platforms nhưng chỉ giữ tools có thể thảo luận sâu.
- Giải thích career transitions/gaps ngắn gọn nếu recruiter cần context; tránh narrative phòng thủ.
- Review spelling, dates, links, PDF accessibility and plain-text parsing; nhờ người khác scan 20 giây xem message chính.
- Chuẩn bị story/evidence cho mọi metric và technical claim trong CV.
- Chuẩn bị story/evidence cho mọi metric và technical claim trong CV.
- Mỗi bullet nên có một chủ thể và một outcome chính; nếu bullet chứa nhiều technologies, tách phần implementation khỏi impact. Dùng date format thống nhất, link portfolio chỉ khi chứa work có thể chia sẻ công khai, và giữ bản plain-text để kiểm tra thứ tự parse của ATS.

## 5. Lỗi thường gặp / Pitfalls

- Dùng duty statements (“worked on”, “responsible for”) không có outcome.
- Ghi số liệu không có source/baseline hoặc credit toàn team thành cá nhân.
- Dùng buzzwords “scalable, robust, innovative” không evidence.
- Liệt kê toàn bộ stack trong một skill cloud, kể cả technology chỉ thử vài giờ.
- Dùng layout nhiều cột/graphics làm ATS parse sai contact/experience.
- Viết summary chung chung không phản ánh target role.
- Nêu confidential details, customer names hoặc architecture secrets.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. CV senior khác CV mid-level ở đâu?</b></summary>

Thể hiện ownership/scope, trade-offs, reliability/operations, influence và outcomes; không chỉ nhiều năm hoặc danh sách tool.

</details>

<details>
<summary><b>Q2. Nếu không có metrics chính xác thì sao?</b></summary>

Không bịa. Tìm proxy có thể xác minh như runtime logs, ticket volume, deploy time; nếu không có, mô tả scope/outcome định tính cụ thể.

</details>

<details>
<summary><b>Q3. Làm sao mô tả team achievement?</b></summary>

Nêu kết quả team và contribution cá nhân cụ thể (decision, subsystem, coordination), không nhận công của người khác.

</details>

<details>
<summary><b>Q4. Có nên tailor CV cho từng job?</b></summary>

Có, điều chỉnh summary/order/keywords dựa role thật, nhưng giữ facts nhất quán và không thêm skill không thể chứng minh.

</details>

<details>
<summary><b>Q5. Skill section nên dài bao nhiêu?</b></summary>

Đủ để scan relevant capabilities; bullets trong experience mới là evidence. Không cần liệt kê mọi tool từng dùng.

</details>

## 7. Ứng dụng vào CV

- Tái cấu trúc **[N]** experience bullets theo scope/action/impact, tăng recruiter response rate từ **[A]% lên [B]%**.
- Làm nổi bật production ownership/mentoring/architecture outcomes, rút ngắn screening-to-interview conversion **[A]%**.

## 8. Tài liệu tham khảo

- [MIT CAPD: Resume guide](https://capd.mit.edu/resources/resumes/)
- [Harvard: Resume and cover letter guide](https://careerservices.fas.harvard.edu/resources/create-a-resume-cv-or-cover-letter/)
- [Google: Use metrics in your resume](https://www.google.com/about/careers/applications/how-we-hire/)
- [Europass CV](https://europa.eu/europass/en/create-europass-cv)

