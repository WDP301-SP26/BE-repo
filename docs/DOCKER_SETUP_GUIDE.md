# WDP391 Backend - Docker Setup Guide

## 📦 Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đã cài đặt
- Port 3000 và 5432 không bị chiếm dụng

---

## 🚀 Quick Start (Khởi chạy nhanh)

### 1. Copy environment file

```bash
cp .env.example .env
```

### 2. Cập nhật file `.env`

Mở file `.env` và cập nhật các giá trị:

```env
# Database
POSTGRES_USER=wdp391
POSTGRES_PASSWORD=wdp391password
POSTGRES_DB=wdp391_db
DATABASE_URL="postgresql://wdp391:wdp391password@localhost:5432/wdp391_db?schema=public"

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters-long-change-in-production
JWT_EXPIRES_IN=7d

# GitHub OAuth (optional - để trống nếu chưa setup)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Jira OAuth (optional - để trống nếu chưa setup)
JIRA_CLIENT_ID=
JIRA_CLIENT_SECRET=
JIRA_CALLBACK_URL=http://localhost:3000/api/auth/jira/callback

# Frontend
FRONTEND_URL=http://localhost:5173

# Server
PORT=3000
NODE_ENV=development
```

### 3. Start Docker Containers

```bash
docker-compose up -d
```

**Giải thích:**

- `-d`: Chạy ở background (detached mode)
- Docker sẽ tự động:
  - Pull PostgreSQL 15 image
  - Build NestJS API image
  - Tạo network riêng cho 2 services
  - Khởi động database trước, sau đó khởi động API

### 4. Chạy Prisma Migrations

```bash
# Vào container API
docker exec -it wdp391-api sh

# Trong container, chạy migration
npx prisma migrate deploy

# Hoặc nếu muốn reset database
npx prisma migrate reset --force

# Exit container
exit
```

### 5. Truy cập ứng dụng

- **API**: http://localhost:3000
- **Swagger docs**: http://localhost:3000/api
- **Health check**: http://localhost:3000/health

---

## 🔧 Development Commands

### Xem logs

```bash
# Xem tất cả logs
docker-compose logs -f

# Chỉ xem logs của API
docker-compose logs -f api

# Chỉ xem logs của PostgreSQL
docker-compose logs -f postgres
```

### Restart services

```bash
# Restart tất cả
docker-compose restart

# Restart chỉ API
docker-compose restart api
```

### Stop và xóa containers

```bash
# Stop
docker-compose stop

# Stop và xóa containers (giữ lại data)
docker-compose down

# Stop và xóa containers + volumes (XÓA DATABASE)
docker-compose down -v
```

### Rebuild image sau khi sửa code

```bash
# Rebuild và restart
docker-compose up -d --build

# Hoặc rebuild cụ thể API service
docker-compose build api
docker-compose up -d api
```

### Truy cập vào container

```bash
# Vào container API
docker exec -it wdp391-api sh

# Vào container PostgreSQL
docker exec -it wdp391-postgres psql -U wdp391 -d wdp391_db
```

---

## 🗄️ Database Management

### Connect PostgreSQL từ host machine

```bash
psql "postgresql://wdp391:wdp391password@localhost:5432/wdp391_db"
```

### Hoặc dùng GUI tools:

**DBeaver / TablePlus / pgAdmin:**

- Host: `localhost`
- Port: `5432`
- Database: `wdp391_db`
- Username: `wdp391`
- Password: `wdp391password`

### Prisma Studio (Recommended)

```bash
# Từ host machine
npx prisma studio

# Hoặc từ container
docker exec -it wdp391-api npx prisma studio
```

Mở: http://localhost:5555

---

## 🐛 Troubleshooting

### Lỗi: Port 3000 đã được sử dụng

```bash
# Tìm process đang dùng port 3000
lsof -ti:3000 | xargs kill -9

# Hoặc đổi port trong docker-compose.yml
ports:
  - "3001:3000"  # Dùng port 3001 thay vì 3000
```

### Lỗi: Port 5432 đã được sử dụng

Bạn có PostgreSQL đang chạy trên máy. Option:

**Option 1: Dừng PostgreSQL local**

```bash
# macOS
brew services stop postgresql

# Linux
sudo systemctl stop postgresql
```

**Option 2: Đổi port**

```yaml
# Trong docker-compose.yml
postgres:
  ports:
    - '5433:5432' # Dùng port 5433
```

Nhớ cập nhật `DATABASE_URL` trong `.env`:

```
DATABASE_URL="postgresql://wdp391:wdp391password@localhost:5433/wdp391_db?schema=public"
```

### Container API không start

```bash
# Xem logs chi tiết
docker-compose logs api

# Thường do:
# 1. Lỗi syntax trong code
# 2. Database chưa ready
# 3. Missing environment variables
```

### Database connection failed

```bash
# Check PostgreSQL đã ready chưa
docker-compose logs postgres | grep "ready to accept connections"

# Phải thấy dòng này 2 lần mới ok
```

### Xóa và setup lại từ đầu

```bash
# Xóa tất cả (container + volumes)
docker-compose down -v

# Xóa images
docker rmi wdp391-api
docker rmi postgres:15-alpine

# Pull và build lại
docker-compose up -d --build
```

---

## 📚 Advanced Usage

### Chạy commands trong container

```bash
# Generate Prisma client
docker exec wdp391-api npx prisma generate

# Run tests
docker exec wdp391-api npm test

# Install package mới
docker exec wdp391-api npm install <package-name>

# Sau đó rebuild image
docker-compose build api
docker-compose up -d api
```

### Backup Database

```bash
# Backup
docker exec wdp391-postgres pg_dump -U wdp391 wdp391_db > backup.sql

# Restore
cat backup.sql | docker exec -i wdp391-postgres psql -U wdp391 -d wdp391_db
```

### Production Build

```bash
# Build production image
docker build -t wdp391-api:prod -f Dockerfile .

# Run với production settings
docker run -d \
  --name wdp391-api-prod \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="your_prod_db_url" \
  wdp391-api:prod
```

---

## 🎯 Testing Workflow

1. **Start containers**

   ```bash
   docker-compose up -d
   ```

2. **Run migrations**

   ```bash
   docker exec -it wdp391-api npx prisma migrate deploy
   ```

3. **Open Swagger**

   ```
   http://localhost:3000/api
   ```

4. **Test APIs** (xem file `docs/SWAGGER_TESTING_GUIDE.md`)

5. **View database**

   ```bash
   npx prisma studio
   ```

6. **Check logs khi có lỗi**
   ```bash
   docker-compose logs -f api
   ```

---

## 🔄 CI/CD Notes

File `docker-compose.yml` này dành cho **local development**.

Khi deploy lên production (AWS, Azure, GCP):

- Dùng riêng database service (RDS, Cloud SQL, etc.)
- Build production Dockerfile riêng
- Sử dụng environment variables từ secrets manager
- Setup load balancer và auto-scaling

---

## ✅ Checklist

- [ ] Docker Desktop đã cài và chạy
- [ ] File `.env` đã được tạo và cấu hình
- [ ] `docker-compose up -d` thành công
- [ ] Migrations đã chạy (`npx prisma migrate deploy`)
- [ ] Swagger UI mở được tại http://localhost:3000/api
- [ ] Test POST /auth/register thành công
- [ ] Prisma Studio mở được (optional)
- [ ] Đã setup GitHub/Jira OAuth (nếu cần)

---

**Xong! 🎉 Bây giờ bạn có thể bắt đầu test API trên Swagger.**

Xem hướng dẫn chi tiết: `docs/SWAGGER_TESTING_GUIDE.md`
