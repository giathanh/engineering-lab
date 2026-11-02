# Git nâng cao: branching strategy, rebase vs merge, conventional commits

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~8 phút

## 1. Tóm tắt nhanh (TL;DR)

- Git lưu content-addressed snapshots/objects; branch chỉ là movable reference, commit graph định nghĩa ancestry.
- Merge giữ lịch sử nhánh và tạo merge commit khi cần; rebase replay commits lên base mới, rewrite commit IDs.
- Rebase local unpublished branch để lịch sử gọn; không rewrite shared history nếu chưa phối hợp.
- Trunk-based/small PR giảm integration risk; GitFlow hợp release cadence cụ thể nhưng thêm long-lived branches.
- Conventional Commits chuẩn hóa intent/changelog/version automation; message phải mô tả change, không thay review.

## 2. Khái niệm cốt lõi

Commit tham chiếu tree snapshot và parent commit(s); Git không lưu diff như trạng thái duy nhất, dù packfiles tối ưu storage. Branch là ref tới commit; HEAD thường trỏ branch hoặc detached commit. Merge tạo ancestry thể hiện hai histories hợp nhất. Rebase lấy commits từ branch, replay lên base mới và tạo IDs khác vì parent/content metadata thay đổi. Fast-forward merge chỉ di chuyển ref khi target là ancestor.

Merge hữu ích khi cần preserve integration history, public/shared branch hoặc audit branch context. Rebase tạo linear history dễ đọc/bisect nhưng rewrite commits và có thể giải conflict lặp lại. `--force-with-lease` an toàn hơn force push mù nhưng vẫn cần coordination. `reflog` ghi ref movements local, hữu ích phục hồi commit mất reference; không thay remote backup.

Branch strategy: trunk-based giữ branches ngắn và feature flags; GitHub flow dùng branch/PR/main deploy; GitFlow có develop/release/hotfix lanes cho release cadence. Long-lived branches tạo merge conflicts/integration delay. Conventional Commit format thường `type(scope): description`; breaking changes cần `!`/footer theo convention repo.

## 3. Code ví dụ

Quy trình rebase local feature branch lên main, kiểm tra trước khi cập nhật remote shared branch.

```bash
git fetch origin
git switch feature/order-export
git rebase origin/main
# Only if rebase stops with conflicts: resolve, then stage the resolved files.
# git add <resolved-files>
# git rebase --continue
# To abandon an in-progress rebase: git rebase --abort
git status
git log --oneline --graph --decorate -12
```

Nếu branch đã publish/shared, phối hợp trước rewrite; khi được chấp thuận dùng `git push --force-with-lease`, không dùng force push mù.

## 4. Trade-off & Best practices

- Giữ commits nhỏ, logical, tests liên quan; `git bisect`/revert hữu ích khi lịch sử rõ.
- Rebase unpublished work; merge khi preserving shared integration history quan trọng.
- Dùng `--force-with-lease` chỉ khi rewrite branch được phép, bảo vệ remote updates của người khác.
- Tạo short-lived branches/feature flags, review nhỏ và merge thường xuyên để giảm divergence.
- Commit generated files/lockfiles theo policy; không commit secrets/build artifacts ngoài chủ đích.
- Conventional Commits hữu ích cho automation; giữ project convention và message nêu behavior change.
- Dùng signed commits/tags hoặc protected branches theo supply-chain/governance requirements.
- Khi history gặp sự cố, `git bisect` tìm commit gây regression bằng test/command tự động; `git reflog` có thể khôi phục ref vừa reset/rebase. Trước thao tác destructive, tạo branch/tag backup để recovery không phụ thuộc vào reflog retention.
- Chọn `revert` khi cần undo một commit đã chia sẻ vì nó tạo commit ngược, giữ history audit; `reset` di chuyển branch ref và phù hợp local unpublished work. Khi conflict, đọc cả base/ours/theirs và chạy tests liên quan thay vì chọn một phía chỉ để Git báo clean.

## 5. Lỗi thường gặp / Pitfalls

- Rebase branch đã người khác dựa vào, buộc họ reconcile history.
- Dùng `git reset --hard`/force push mà không xác nhận state hoặc backup.
- Squash mọi commit làm mất useful bisect/audit context; policy tùy repository.
- Commit generated/vendor/secrets files do staging toàn bộ thiếu kiểm tra.
- Resolve conflict theo compile pass mà bỏ business semantics của hai nhánh.
- Dùng branch strategy phức tạp hơn release/team needs.
- Nghĩ reflog tồn tại vĩnh viễn hoặc sync remote; retention local có giới hạn.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Merge khác rebase?</b></summary>

Merge kết hợp histories và giữ parent graph; rebase replay commits lên base mới, rewrite IDs để tạo tuyến tính. Chọn theo shared-history/audit needs.

</details>

<details>
<summary><b>Q2. Khi nào không nên rebase?</b></summary>

Khi commits đã được chia sẻ/consumed bởi người khác hoặc policy yêu cầu preserve integration graph, trừ khi phối hợp rewrite.

</details>

<details>
<summary><b>Q3. `--force-with-lease` bảo vệ gì?</b></summary>

Nó từ chối push nếu remote ref đã thay đổi khác expected value, giảm nguy cơ ghi đè update mới của người khác; không làm rewrite tự động an toàn.

</details>

<details>
<summary><b>Q4. Trunk-based development cần gì?</b></summary>

Branches ngắn, integration liên tục, CI nhanh, feature flags và rollback/deploy discipline để main luôn releasable.

</details>

<details>
<summary><b>Q5. Conventional Commits mang lại gì?</b></summary>

Machine-readable intent cho changelog/version automation; chất lượng phụ thuộc convention và commit message chính xác.

</details>

## 7. Ứng dụng vào CV

- Chuyển team sang short-lived branches/required CI checks, giảm merge lead time **[A]%** và conflict resolution effort **[B]%**.
- Chuẩn hóa commit/release automation theo Conventional Commits, giảm manual release preparation từ **[A] giờ xuống [B] phút**.

## 8. Tài liệu tham khảo

- [Pro Git Book](https://git-scm.com/book/en/v2)
- [Git: Rebase](https://git-scm.com/docs/git-rebase)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Atlassian: Git branching workflows](https://www.atlassian.com/git/tutorials/comparing-workflows)

