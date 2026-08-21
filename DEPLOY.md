# Hướng dẫn Deploy VSEATeam Word Search

## Kiến trúc

```
GitHub Pages (alprotrle.xyz)     Laragon / Hosting PHP
┌────────────────────────┐       ┌──────────────────────────┐
│ public/index.html      │──────▶│ api/game.php             │
│ public/admin.html      │       │ api/admin.php            │
│ public/game.js         │       │ MySQL: vsea_game         │
│ public/admin.js        │       └──────────────────────────┘
│ public/style.css       │
│ public/admin.css       │
└────────────────────────┘
```

---

## BƯỚC 1: Cài PHP backend lên Laragon

1. Mở thư mục `www` của Laragon (thường ở `C:\laragon\www`)
2. Tạo folder `vsea_game` và copy toàn bộ thư mục `api/` vào đó:
   ```
   C:\laragon\www\vsea_game\api\
     config.php
     game.php
     admin.php
     install.php
     .htaccess
   ```
3. Bật Laragon (Apache + MySQL)
4. Truy cập `http://localhost/vsea_game/api/install.php` để tạo database
5. **XÓA file install.php sau khi chạy xong!**

---

## BƯỚC 2: Public Laragon ra internet

**Dùng ngrok (đơn giản nhất):**
```bash
ngrok http 80
# Sẽ cho URL kiểu: https://abc123.ngrok.io
```

Sau đó sửa `public/game.js` và `public/admin.js`:
```js
const API = 'https://abc123.ngrok.io/vsea_game';
```

**Hoặc dùng VPS/hosting PHP:**
- Upload thư mục `api/` lên hosting
- Trỏ subdomain `api.alprotrle.xyz` vào hosting đó

---

## BƯỚC 3: Deploy frontend lên GitHub Pages

1. Sửa `API` trong `game.js` và `admin.js` thành URL backend thật
2. Commit và push lên GitHub:
   ```bash
   git add public/
   git commit -m "Update API URL for production"
   git push
   ```
3. Vào GitHub repo → Settings → Pages → Source: Deploy from branch `main`, folder `/public`
4. Truy cập: `https://trung32kj.github.io/vsea_game`

---

## BƯỚC 4: Gắn tên miền alprotrle.xyz

1. Trong GitHub Pages settings → Custom domain → nhập `alprotrle.xyz`
2. Vào DNS quản lý domain, thêm:
   ```
   Type: A
   Name: @
   Value: 185.199.108.153
          185.199.109.153
          185.199.110.153
          185.199.111.153
   ```
   Hoặc:
   ```
   Type: CNAME
   Name: www
   Value: trung32kj.github.io
   ```
3. Chờ ~10 phút để DNS cập nhật

---

## Tài khoản mặc định

- **Admin:** `admin` / `admin123`
- Đổi mật khẩu sau khi deploy!

---

## Lưu ý CORS

Trong `api/config.php`, thêm domain của bạn vào `$allowed_origins`:
```php
$allowed_origins = [
    'https://alprotrle.xyz',
    'https://www.alprotrle.xyz',
    'https://trung32kj.github.io',
];
```
