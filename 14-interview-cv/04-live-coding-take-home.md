# Live coding / take-home: cách tiếp cận, lỗi thường gặp

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- Live coding đánh giá problem solving, communication, correctness và collaboration—not chỉ tốc độ gõ.
- Clarify input/output/constraints, viết examples, baseline solution rồi optimize khi evidence yêu cầu.
- Test boundaries/empty/duplicates/errors; nói complexity và trade-offs rõ ràng.
- Take-home phải tôn trọng timebox, README/run/test instructions, scope decisions và known limitations.
- Không dùng hidden assistance/third-party code trái rules; hỏi clarification về allowed tools và expected effort.

## 2. Khái niệm cốt lõi

Live coding: dành phút đầu đọc prompt, hỏi ambiguities, confirm examples/constraints, discuss approach trước code. Viết function boundaries/types, incremental implementation, run tests/manual examples thường xuyên. Nếu mắc lỗi, nói diagnosis và sửa có chủ đích. Senior thể hiện không chỉ algorithm mà còn maintainability, failure assumptions, input validation và collaboration.

Algorithm question: brute force correctness trước; xác định complexity; tối ưu từ structure (hash map, sorting, two pointers, BFS/DP). Không tối ưu quá sớm nếu prompt còn mơ hồ. Communicate invariant, edge cases và test strategy. Nếu thiếu library/API nhớ exact, nói semantics và ask use docs.

Take-home: đọc rubric/time budget, chọn scope nhỏ nhất đáp ứng requirements, README prerequisites/setup/test, meaningful tests, error/loading states, security/validation, commit history rõ. Document trade-offs/future work, không giả vờ complete. Nếu timebox 4h thì không làm framework rewrite/production infra thừa.

## 3. Code ví dụ

Approach template trước khi implementation.

```text
1. Restate: input, output, error/empty behavior.
2. Constraints: n, ordering, duplicates, memory/time budget.
3. Example + edge cases: empty, one item, duplicate, boundary.
4. Approach: invariant/data structure + complexity.
5. Implement in small steps and run tests.
6. Review: names, types, error paths, security, cleanup.
```

## 4. Trade-off & Best practices

- Ask concise questions; nếu interviewer muốn proceed, state assumptions and continue.
- Think aloud enough to expose reasoning, not every keystroke; check in before making a major pivot.
- Use standard library and readable code; avoid clever constructs under time pressure.
- Test normal + boundary + failure paths; explain what remains untested if time ends.
- Prioritize correctness and clear contracts, then optimize if constraints indicate.
- Take-home deliverable: simple setup, runnable tests, sample env, no secrets, deterministic seed and concise design notes.
- Clarify allowed AI/docs/libraries, timebox, submission format and evaluation criteria; follow rules transparently.
- Trước khi nộp, chạy lại từ clean checkout theo README, xác nhận tests/build và kiểm tra diff không chứa credentials, debug output hoặc generated files ngoài yêu cầu. Ghi known limitations theo mức ảnh hưởng, không liệt kê mọi hypothetical future feature.

## 5. Lỗi thường gặp / Pitfalls

- Nếu interviewer gợi ý hướng khác, xác nhận requirement mới và giải thích bạn sẽ giữ hay đổi approach. Khả năng tiếp nhận feedback/điều chỉnh reasoning là một phần collaboration, không phải cuộc thi chứng minh solution ban đầu đúng.
- Để lại vài phút đọc lại code từ góc nhìn reviewer: tên biến, error path, boundary conditions và complexity. Một implementation ngắn dễ giải thích thường có giá trị hơn thêm abstraction chưa cần.

- Trước khi nộp, chạy lại từ clean checkout theo README, xác nhận tests/build và kiểm tra diff không chứa credentials, debug output hoặc generated files ngoài yêu cầu. Ghi known limitations theo mức ảnh hưởng, không liệt kê mọi hypothetical future feature.

- Code ngay trước khi clarify duplicates/null/error semantics.
- Im lặng lâu, không chia sẻ approach hoặc kiểm tra assumptions.
- Over-engineer abstraction/architecture chưa cần.
- Chỉ test happy path; bỏ off-by-one, empty input, failure/cleanup.
- Take-home không có README/setup/tests hoặc chứa secrets/generated junk.
- Bỏ quá nhiều giờ polish UI ngoài rubric và thiếu core functionality.
- Dùng AI/online solution trái policy hoặc không thể giải thích submitted code.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Nếu prompt mơ hồ thì làm gì?</b></summary>

Hỏi về constraints/output/errors; nếu không có thêm info, nêu assumption rõ và code theo assumption đó.

</details>

<details>
<summary><b>Q2. Nếu brute force vượt complexity?</b></summary>

Trình bày baseline correctness, xác định bottleneck và khai thác input property/data structure để tối ưu; nêu trade-off.

</details>

<details>
<summary><b>Q3. Nếu không biết API/library?</b></summary>

Nói semantics cần, dùng docs nếu allowed hoặc implement minimal safe alternative; không bịa API.

</details>

<details>
<summary><b>Q4. Nếu hết giờ trước khi hoàn thiện?</b></summary>

Giữ code compile/testable, nói phần hoàn thành, remaining risk và next steps; không che trạng thái.

</details>

<details>
<summary><b>Q5. Take-home nên đầu tư bao lâu?</b></summary>

Theo timebox/rubric đã clarify. Nộp vertical slice chất lượng và document scope thay vì làm không giới hạn.

</details>

## 7. Ứng dụng vào CV

- Hoàn thiện **[N]** take-home/live coding exercises có tests/README, giảm setup/debug time **[A]%** trong mock review.
- Chuẩn hóa interview checklist và communication practice, tăng completion rate mock challenge từ **[A]% lên [B]%**.

## 8. Tài liệu tham khảo

- [Pramp: Interview practice](https://www.pramp.com/)
- [LeetCode Interview Crash Course](https://leetcode.com/explore/interview/card/)
- [GitHub: Building good README files](https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- [Google: Technical interview preparation](https://careers.google.com/how-we-hire/)
