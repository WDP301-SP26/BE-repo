# 🚀 Hướng Dẫn Chạy Project (Dành cho Member mới)

## 1. Cài Đặt Ban Đầu (Làm 1 lần duy nhất)

Sau khi clone code về, bạn hãy làm các bước này:

1. **Copy file môi trường:** Tạo file `.env` từ file mẫu (hoặc copy nội dung từ bạn của bạn).
2. **Cài đặt thư viện:**
   ```bash
   npm install
   ```
3. **Mở Database (Dùng Docker):**
   ```bash
   docker run -d \
     --name postgres-dev \
     -e POSTGRES_USER=admin \
     -e POSTGRES_PASSWORD=123456 \
     -e POSTGRES_DB=wdp391_db \
     -p 5432:5432 \
     postgres:15-alpine
   ```
4. **Đồng bộ Database (Quan trọng):** Lệnh này sẽ tạo các bảng (Table) vào database mới của bạn.
   ```bash
   npx prisma db push
   ```

---

## 2. Cách Xem Dữ Liệu (Phần bạn cần)

Đây là cách để bạn xem tổng quan toàn bộ Data trong máy mình một cách trực quan nhất (giống Excel):

1. **Mở Prisma Studio:**
   ```bash
   npx prisma studio
   ```
2. **Truy cập link:** 👉 **[http://localhost:5556](http://localhost:5556)**

_(Tại đây bạn có thể xem các bảng User, SocialAccount... và thêm/sửa/xoá dữ liệu trực tiếp)._

---

## 3. Chạy Server & Test API

1. **Chạy server (Watch mode):**
   ```bash
   npm run start:dev
   ```
2. **Xem tài liệu API (Swagger):** 👉 **[http://localhost:3000/api](http://localhost:3000/api)**

---

## 4. Các Lệnh Hữu Ích Khác

- **`docker ps`**: Xem database có đang chạy không.
- **`npx prisma generate`**: Chạy lại nếu bạn thấy lỗi liên quan đến code Prisma.
- **`docker start postgres-dev`**: Chạy lại database nếu bạn lỡ tắt máy/tắt Docker.
- **`lsof -i :3000` & `kill -9 <PID>`**: Fix lỗi port 3000 bị bận.
