# Docker & docker-compose; Kubernetes khái niệm cơ bản

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~10 phút

## 1. Tóm tắt nhanh (TL;DR)

- Docker image là immutable layered filesystem/config; container là process isolation/runtime instance, không phải VM đầy đủ.
- Multi-stage builds giảm image size; non-root user, pinned base images, minimal packages và secret mounts giảm risk.
- Compose điều phối local multi-container development; Kubernetes quản lý desired state, scheduling, service discovery và rollout.
- Pod là smallest scheduling unit; Deployment quản lý replicas/rollouts; Service cung cấp stable networking; ConfigMap/Secret cung cấp config references.
- Probes, resources, requests/limits, graceful shutdown và readiness ảnh hưởng reliability/rollout hơn YAML syntax.

## 2. Khái niệm cốt lõi

Container chia sẻ host kernel nhưng dùng namespaces/cgroups cho isolation/resource limits; image layers content-addressable/cacheable. Container nên chạy một primary process, log ra stdout/stderr và externalize persistent state. Docker build context cần `.dockerignore`; secrets không bake vào image layers vì history/cache có thể giữ lại.

Multi-stage Dockerfile tách build tools khỏi runtime. Pin base image digest/tag policy, scan vulnerabilities, non-root, read-only filesystem/capabilities khi phù hợp. Compose định nghĩa local services/networks/volumes để lặp môi trường; không thay production orchestration.

Kubernetes control plane lưu desired state; controllers reconcile actual state. Scheduler đặt Pods; kubelet thực thi trên nodes. Deployment rollout tạo ReplicaSets; Service chọn pods qua labels; Ingress/Gateway expose HTTP. ConfigMaps không phải secret store; Kubernetes Secret base64-encoded by default, encryption at rest/RBAC cần cấu hình.

Readiness quyết định nhận traffic; liveness restart process; startup probe bảo vệ app khởi động chậm. Requests ảnh hưởng scheduling; limits có thể throttle CPU hoặc OOM memory. HPA scale dựa metrics; disruption budgets/anti-affinity giúp availability nhưng không thay capacity/zone planning.

## 3. Code ví dụ

Multi-stage image cho Node service; project cần có build script và `dist/server.js`.

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && addgroup -S app && adduser -S app -G app
COPY --from=build /app/dist ./dist
USER app
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

Không copy `.env`/credentials; inject runtime secrets từ secret manager/orchestrator.

## 4. Trade-off & Best practices

- Dùng deterministic builds, lockfiles, `.dockerignore`, multi-stage images và pinned base-image policy.
- Chạy non-root, minimal writable paths, resource limits, vulnerability scanning và signed/provenance artifacts.
- Compose cho local integration; Kubernetes khi cần orchestration/scale/rollouts phù hợp team/platform maturity.
- Set readiness/liveness/startup probes đúng semantics; `preStop`/SIGTERM drain và termination grace period hợp request duration.
- Resource requests phản ánh normal needs, limits theo overload protection; monitor throttling/OOM/restarts.
- Labels/selectors/namespaces/RBAC/network policies có ownership; Secret access tối thiểu và encryption at rest.
- Keep state external/persistent volumes deliberately; deploy rolling with backward-compatible app/schema versions.
- Ứng dụng container nên xử lý SIGTERM, ngừng nhận work mới, drain requests và flush dữ liệu trong termination grace period. Log ra stdout/stderr để platform thu thập; file log bên trong container thường biến mất khi pod bị replace.
- Không dùng floating base tag trong release build nếu cần reproducibility; pin digest hoặc update cadence có kiểm soát và rebuild để nhận security patches. Với multi-architecture deployments, kiểm tra image manifest và native dependencies trên target architecture.

## 5. Lỗi thường gặp / Pitfalls

- Copy secrets vào Dockerfile `ARG`/`ENV`, image history hoặc build cache.
- Chạy root trong container và mount host socket không cần thiết.
- Liveness probe check DB/network, restart healthy process khi dependency transient outage.
- Readiness probe quá nông, gửi traffic trước app sẵn sàng.
- CPU limit quá thấp gây throttling; memory limit thấp gây OOM kill.
- Kubernetes Secret xem như encrypted mặc định hoặc quyền RBAC quá rộng.
- Dùng Compose config như production high availability plan.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Container khác VM?</b></summary>

Container chia sẻ host kernel và cô lập process/filesystem/network bằng OS primitives; VM chạy guest OS/kernel riêng trên hypervisor.

</details>

<details>
<summary><b>Q2. Readiness khác liveness?</b></summary>

Readiness quyết định pod nhận traffic; liveness quyết định restart; startup probe cho thời gian khởi động. Failure semantics khác nhau.

</details>

<details>
<summary><b>Q3. Kubernetes Secret có an toàn mặc định?</b></summary>

Nội dung base64, không encryption. Cần encryption at rest, RBAC least privilege, secret manager integration và audit.

</details>

<details>
<summary><b>Q4. Requests và limits khác gì?</b></summary>

Requests dùng scheduling/resource reservation; limits đặt cap runtime (CPU throttling, memory OOM behavior). Tuning theo measurements.

</details>

<details>
<summary><b>Q5. Vì sao cần multi-stage image?</b></summary>

Build toolchain không cần trong runtime, giúp image nhỏ hơn, attack surface ít hơn và deploy/pull nhanh hơn.

</details>

## 7. Ứng dụng vào CV

- Giảm container image **[A]%** bằng multi-stage builds và tách build tools; chuyển runtime sang non-root, cải thiện deploy time **[B]%** và đóng **[C]** high-risk findings.
- Thiết kế Kubernetes probes/resources/rolling rollout cho **[N]** services, đạt availability **[A]%** khi deploy.

## 8. Tài liệu tham khảo

- [Docker Documentation](https://docs.docker.com/)
- [Docker: Build best practices](https://docs.docker.com/build/building/best-practices/)
- [Kubernetes Concepts](https://kubernetes.io/docs/concepts/)
- [Kubernetes: Probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)
