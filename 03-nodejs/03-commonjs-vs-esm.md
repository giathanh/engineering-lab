# Module system: CommonJS vs ESM

> Mức độ: ⭐⭐⭐ senior | Thời gian đọc: ~8 phút

## 1. Tóm tắt nhanh (TL;DR)

- CommonJS (CJS) dùng `require`/`module.exports`, được thiết kế cho loading đồng bộ; ECMAScript Modules (ESM) dùng `import`/`export` với cấu trúc tĩnh và hỗ trợ top-level `await`.
- Trong Node.js, `type` trong `package.json` và phần mở rộng file quyết định cách Node diễn giải module; `.mjs` luôn ESM, `.cjs` luôn CJS.
- ESM import/export tĩnh giúp phân tích dependency trước khi thực thi; CJS `require()` có thể gọi có điều kiện trong runtime.
- Hai hệ module có interoperability nhưng khác semantics về cache, `this`, resolution và loading async. Chọn một chuẩn cho application mới, đặt boundary rõ khi tích hợp package cũ.

## 2. Khái niệm cốt lõi

CommonJS là module system của Node truyền thống. Mỗi file được bọc trong function, có `exports`, `require`, `module`, `__filename` và `__dirname`; `require()` resolve và thực thi module đồng bộ lần đầu, sau đó trả về giá trị đã cache. `exports` ban đầu chỉ là alias của `module.exports`; gán `exports = value` không thay thế export thực sự.

ESM là chuẩn module của JavaScript. Các import/export được phân tích tĩnh, binding được live (giá trị export có thể cập nhật nhưng binding vẫn giữ liên kết), và module có thể dùng top-level `await`. Dependency graph được tải/khởi tạo theo quy tắc ESM thay vì chỉ gọi hàm đồng bộ như CJS.

Node xác định format bằng phần mở rộng (`.mjs`/`.cjs`) và trường `type` trong `package.json`: `.mjs` luôn là ESM, `.cjs` luôn là CJS; `.js` theo `type` của package scope gần nhất. Với package mới, khai báo rõ `"type": "module"` nếu dùng ESM để tooling và runtime nhất quán.

Resolution của ESM hỗ trợ `import` tương đối với phần mở rộng file rõ ràng, ví dụ `./helper.js`; CJS có quy tắc tìm kiếm legacy như thử phần mở rộng và `index` trong một số trường hợp. ESM không có sẵn `__dirname`/`__filename`; có thể tạo URL-based path bằng `fileURLToPath(import.meta.url)`. `createRequire(import.meta.url)` là cầu nối có chủ đích khi ESM cần tải dependency CJS.

Interoperability không có nghĩa hai định dạng hoàn toàn thay thế nhau. ESM có thể import CJS, thường nhận `module.exports` làm default export; named exports suy đoán từ CJS có thể không đáng tin với export động. CJS có thể `import()` ESM bất đồng bộ; không nên giả định `require()` synchronous sẽ tải mọi ESM package. Kiểm tra `exports` map trong `package.json`, vì package có thể cung cấp entry point khác nhau cho `import` và `require`.

## 3. Code ví dụ

Đặt đoạn sau trong file `.mjs` hoặc package có `"type": "module"`. Ví dụ dùng `node:fs/promises` theo kiểu ESM:

```js
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFile);

try {
	const contents = await readFile(join(currentDirectory, 'package.json'), 'utf8');
	console.log(JSON.parse(contents).name);
} catch (error) {
	console.error('Cannot read package metadata:', error.message);
	process.exitCode = 1;
}
```

Tương đương trong CJS sẽ dùng `const { readFile } = require('node:fs/promises')` và callback/Promise trong function; không viết top-level `await` trong CJS. Tránh trộn lẫn `module.exports` với ESM `export` trong cùng một file vì mỗi file có đúng một module format.

## 4. Trade-off & Best practices

- Với dự án mới, ESM thường là lựa chọn phù hợp vì theo chuẩn JavaScript, hỗ trợ static analysis và tương thích hệ sinh thái hiện tại. CJS vẫn hợp lý khi bảo trì ứng dụng/package legacy hoặc tooling còn phụ thuộc nó.
- Đặt `"type": "module"` ở package scope phù hợp; dùng `.cjs` cho script/tooling cần CJS. Tránh đổi format toàn repo mà không kiểm kê test runner, config files và dependency.
- Giữ import specifier explicit và dùng `node:` prefix cho built-in modules để đọc code rõ ràng.
- Khi publish package hỗ trợ hai định dạng, kiểm thử cả hai entry points và khai báo `exports` map có chủ đích. Bảo đảm TypeScript declarations khớp API ở cả hai nhánh.
- Dùng `import()` khi cần lazy load hoặc nạp ESM từ CJS; nhớ rằng đây là bất đồng bộ và có thể ảnh hưởng ranh giới API.

## 5. Lỗi thường gặp / Pitfalls

- Nhầm `exports = value` với `module.exports = value`; biểu thức đầu chỉ đổi biến local, không đổi export.
- Thiếu phần mở rộng ở relative ESM import, khiến module hoạt động ở bundler nhưng lỗi khi chạy trực tiếp Node.
- Chuyển package sang ESM nhưng quên config files, test runner, script build hoặc consumer vẫn gọi `require`.
- Giả định named export từ CJS luôn được nhận diện chính xác; interop có thể phụ thuộc cách CJS gán exports.
- Tạo hai bản build CJS/ESM nhưng chúng giữ state singleton riêng, dẫn đến hai instance registry/cache nếu cả hai được nạp trong cùng process.
- Tự ghép đường dẫn bằng `process.cwd()` thay cho vị trí module, khiến code phụ thuộc thư mục khởi chạy.

## 6. Câu hỏi phỏng vấn

<details>
<summary><b>Q1. Khác biệt quan trọng nhất giữa CJS và ESM?</b></summary>

CJS dùng `require` đồng bộ và export qua object; ESM có import/export tĩnh, live bindings, async-capable loading và top-level `await`. Khác biệt này ảnh hưởng resolution, interop và tooling.

</details>

<details>
<summary><b>Q2. Node xác định `.js` là ESM hay CJS thế nào?</b></summary>

Node dựa vào package scope và trường `type`; `.mjs` và `.cjs` luôn chỉ định format tương ứng. Khai báo tường minh giúp tránh phụ thuộc cấu hình mơ hồ.

</details>

<details>
<summary><b>Q3. Vì sao ESM import cần phần mở rộng?</b></summary>

ESM resolution của Node không dùng toàn bộ hành vi extension guessing legacy của CJS. Viết specifier chính xác giúp runtime và môi trường deploy tìm đúng module.

</details>

<details>
<summary><b>Q4. Có thể dùng CJS và ESM cùng dự án không?</b></summary>

Có, qua `.cjs`/`.mjs`, `import()` và `createRequire`, nhưng nên xác định boundary rõ và test cả hai đường. Tránh vô tình tạo hai bản stateful package trong process.

</details>

<details>
<summary><b>Q5. `import` và `require` có cùng cache semantics không?</b></summary>

Không nên giả định như vậy. CJS cache theo resolved filename; ESM có module map theo URL. Resolution và graph loading khác nhau, nên interop/state có thể bất ngờ.

</details>

<details>
<summary><b>Q6. Khi nào nên dùng `createRequire`?</b></summary>

Khi ESM cần tải dependency hoặc config CJS qua cơ chế `require` đồng bộ, chẳng hạn một file cấu hình cũ. Dùng như adapter có chủ đích, không làm kiểu module chính.

</details>

## 7. Ứng dụng vào CV

- Chuyển **[N]** package/service từ CommonJS sang ESM, chuẩn hóa build và test cho dual entry points, giảm lỗi tích hợp module **[A]%** trong các lần phát hành.
- Thiết kế `exports` map và migration boundary cho hệ thống **[N]** consumer, rút ngắn thời gian nâng cấp runtime từ **[A] xuống [B] ngày**.

## 8. Tài liệu tham khảo

- [Node.js: ECMAScript modules](https://nodejs.org/api/esm.html)
- [Node.js: CommonJS modules](https://nodejs.org/api/modules.html)
- [Node.js packages and `exports`](https://nodejs.org/api/packages.html)
- [MDN: JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
