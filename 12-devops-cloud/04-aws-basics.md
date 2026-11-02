# Cloud cơ bản (AWS: EC2, S3, RDS, Lambda, CloudFront, SQS)

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~9 phút

## 1. Tóm tắt nhanh (TL;DR)

- AWS Region chứa nhiều Availability Zones; thiết kế HA qua AZs và disaster recovery qua Regions theo RTO/RPO.
- EC2 cung cấp VM compute; S3 object storage; RDS managed relational DB; Lambda event-driven compute; CloudFront CDN; SQS managed queue.
- IAM role/policy least privilege và workload identity ưu tiên hơn long-lived access keys.
- Shared Responsibility Model chia security responsibilities giữa AWS và customer; cấu hình identity/data/network/application vẫn thuộc customer.
- Cost là architectural constraint: requests, storage, data transfer, idle resources, logs và NAT/egress có thể chiếm lớn.

## 2. Khái niệm cốt lõi

Region là geographic area; AZ là fault-isolated location trong region. Multi-AZ giảm single-AZ outage risk nhưng không thay backup/PITR; multi-region cần replication/failover/data residency design. EC2 cho OS/runtime control và persistent workloads, đổi lại patching/instance lifecycle. Auto Scaling Groups replace unhealthy capacity; load balancer routes traffic.

S3 lưu objects trong buckets, có versioning, lifecycle, encryption, access policies và event notifications; không phải POSIX filesystem semantics mặc định. Public access block, bucket policies/IAM và presigned URLs cần scope kỹ. RDS quản lý engine/backups/patching options nhưng schema/query/index/credentials vẫn thuộc app team. Multi-AZ availability khác read replica scaling; replica lag/region behavior cần hiểu.

Lambda chạy function theo events với concurrency quotas, cold starts, execution/time/memory limits và integration retries. Idempotency quan trọng vì event delivery có thể duplicate. SQS Standard queue hướng at-least-once/best effort ordering; FIFO thêm ordering/dedup constraints. CloudFront edge cache giảm latency/origin load, nhưng cache key/headers/cookies invalidation cần thiết kế để tránh private data leakage.

IAM policy evaluate identity/resource policies, permissions boundaries, SCPs/session policies theo rules; least privilege và explicit deny matter. Prefer roles/STS credentials/managed identity, KMS for key management, CloudTrail audit and encryption at rest/in transit. Cost controls budgets/tags/rightsizing and data transfer awareness belong to design.

## 3. Code ví dụ

AWS SDK v3 tạo presigned S3 upload URL thời hạn ngắn; package cần `@aws-sdk/client-s3` và `@aws-sdk/s3-request-presigner`, identity lấy từ role chain.

```ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: process.env.AWS_REGION });
const uploadUrl = await getSignedUrl(
	s3,
	new PutObjectCommand({ Bucket: 'private-uploads', Key: 'tenant-42/file.bin' }),
	{ expiresIn: 300 },
);
```

Server phải authorize tenant/key, giới hạn content type/size qua policy/POST form phù hợp, và không public bucket để tiện upload.

## 4. Trade-off & Best practices

- Chọn EC2/ECS/EKS/Lambda theo workload duration, control, scaling pattern và operations skill.
- Dùng IAM roles/temporary credentials, least privilege, permission boundaries và CloudTrail; không hardcode keys.
- S3 private by default, encryption/versioning/lifecycle/retention policy theo data classification; test restore/version recovery.
- RDS connection pooling, backups/PITR, Multi-AZ/failover testing, read replicas và database engine tuning.
- Lambda concurrency/reserved limits, timeout, idempotency, DLQ/destinations và payload size limits.
- CloudFront cache public assets/content; define cache key, origin access control, invalidation and private response behavior.
- Tag resources, budgets/cost alerts, rightsize, review data transfer/log retention and unused resources.
- Tag resources, budgets/cost alerts, rightsize, review data transfer/log retention and unused resources.
- Với cross-account access, dùng role assumption và external ID/conditions phù hợp thay chia access keys. Tách dev/staging/prod accounts hạn chế blast radius; CloudTrail organization trails và config drift detection giúp điều tra thay đổi ngoài pipeline.

## 5. Lỗi thường gặp / Pitfalls

- Dùng access keys lâu dài trong source/.env/CI thay role federation.
- Public S3 bucket/ACL rộng hoặc presigned URL TTL quá dài.
- Nhầm Multi-AZ standby với read scaling/backup.
- Lambda retries duplicate side effects mà không idempotency; concurrency overwhelm DB.
- CloudFront cache key bỏ tenant/cookie dimension hoặc cache private response công khai.
- Không test restore/region failover vì “managed service đã backup”.
- Quên egress/data transfer/NAT/logging costs và tạo surprise bills.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Multi-AZ khác read replica?</b></summary>

Multi-AZ chủ yếu tăng availability/failover theo engine/service; read replica phục vụ read scaling/analytics với replication lag. Exact architecture phụ thuộc RDS engine/config.

</details>

<details>
<summary><b>Q2. Vì sao dùng IAM role thay access key?</b></summary>

Role cấp temporary credentials và giảm long-lived secret handling; policy least privilege và identity context dễ audit/rotate hơn.

</details>

<details>
<summary><b>Q3. SQS/Lambda có exactly-once không?</b></summary>

Không nên giả định end-to-end exactly-once; event có thể retry/duplicate. Consumer cần idempotency và DLQ/replay strategy.

</details>

<details>
<summary><b>Q4. CloudFront cache data riêng tư cần gì?</b></summary>

Cache key/policy phải phân biệt auth/tenant context hoặc tắt shared caching; origin access cần kiểm soát và purge policy rõ.

</details>

<details>
<summary><b>Q5. RTO và RPO là gì?</b></summary>

RTO là thời gian phục hồi mục tiêu; RPO là lượng dữ liệu mất tối đa theo thời gian. Backup/replication/failover design phải đáp ứng target đã định.

</details>

## 7. Ứng dụng vào CV

- Thiết kế role-based AWS access và private S3 upload flow cho **[N]** tenants, loại bỏ static credentials và giảm exposure risk **[A]%**.
- Tối ưu RDS/Lambda/CloudFront capacity/cost, giảm monthly spend **[A]%** trong khi đạt availability **[B]%**.

## 8. Tài liệu tham khảo

- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Amazon S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Amazon SQS Documentation](https://docs.aws.amazon.com/sqs/)
