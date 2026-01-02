# Hướng dẫn sử dụng Loki & Grafana để xem logs

## Tổng quan
Hệ thống logging tập trung sử dụng **Loki** (log aggregation) và **Grafana** (visualization) để thu thập và hiển thị logs từ tất cả các microservices.

## Kiến trúc
```
Backend Services → Loki → Grafana
```

- **Backend Services**: Gửi logs qua HTTP đến Loki thông qua `loki-logback-appender`
- **Loki**: Thu thập và lưu trữ logs
- **Grafana**: Truy vấn và hiển thị logs từ Loki

## Bước 1: Khởi động Loki và Grafana

```bash
# Khởi động các container
docker-compose up -d loki grafana

# Kiểm tra trạng thái
docker-compose ps
```

Các service sẽ chạy trên:
- **Loki**: http://localhost:3100
- **Grafana**: http://localhost:3000

## Bước 2: Đăng nhập Grafana

1. Mở trình duyệt và truy cập: http://localhost:3000
2. Đăng nhập với:
   - **Username**: `admin`
   - **Password**: `admin123`

## Bước 3: Kiểm tra Loki Datasource

1. Vào **Configuration** (biểu tượng bánh răng) → **Data Sources**
2. Bạn sẽ thấy **Loki** đã được cấu hình tự động
3. Click vào **Loki** → Click **Test** để kiểm tra kết nối

## Bước 4: Xem logs trong Grafana

### Sử dụng Explore

1. Click vào biểu tượng **Explore** (la bàn) ở menu bên trái
2. Chọn **Loki** làm datasource
3. Sử dụng các query sau để xem logs:

#### Xem tất cả logs:
```logql
{app=~".+"}
```

#### Xem logs của service cụ thể:
```logql
{app="gateway-service"}
{app="user-service"}
{app="products-service"}
{app="notification-service"}
{app="chat-service"}
```

#### Xem logs theo level:
```logql
{app="gateway-service", level="ERROR"}
{app="user-service", level="WARN"}
{level=~"ERROR|WARN"}  # ERROR hoặc WARN
```

#### Xem logs có chứa text cụ thể:
```logql
{app="gateway-service"} |= "exception"
{app="user-service"} |= "error" |= "database"
```

#### Xem logs không chứa text:
```logql
{app="gateway-service"} != "health"
```

#### Lọc logs theo JSON field:
```logql
{app="gateway-service"} | json | class="gateway.controller.UserController"
```

### Các LogQL Functions hữu ích

#### Đếm số lượng logs:
```logql
count_over_time({app="gateway-service"}[5m])
```

#### Rate (số logs per second):
```logql
rate({app="gateway-service"}[5m])
```

#### Logs theo host:
```logql
{app="gateway-service"} | json | host="my-hostname"
```

## Bước 5: Tạo Dashboard

### Tạo Dashboard đơn giản

1. Click vào **+** → **Create Dashboard**
2. Click **Add new panel**
3. Trong Query editor, chọn **Loki** và nhập query:
   ```logql
   {app=~".+"}
   ```
4. Ở phần Visualization, chọn **Logs**
5. Click **Apply** để lưu panel
6. Click **Save dashboard** (biểu tượng đĩa mềm)

### Tạo panel thống kê lỗi

1. Thêm panel mới
2. Query:
   ```logql
   sum(count_over_time({level="ERROR"}[5m])) by (app)
   ```
3. Visualization: **Bar Chart** hoặc **Time series**

### Tạo panel cho từng service

```logql
# Panel cho Gateway
{app="gateway-service"} |= ""

# Panel cho User Service
{app="user-service"} |= ""

# Panel cho Products Service
{app="products-service"} |= ""
```

## Bước 6: Khởi động Backend Services

```bash
# Từ thư mục backend
cd backend

# Build project
mvn clean install

# Chạy từng service (terminal riêng cho mỗi service)
cd gateway && mvn spring-boot:run
cd user && mvn spring-boot:run
cd products && mvn spring-boot:run
cd notification && mvn spring-boot:run
cd chat && mvn spring-boot:run
```

## Kiểm tra Logs

Sau khi khởi động services, bạn sẽ thấy:
1. **Console logs**: Hiển thị trực tiếp trên terminal (màu sắc)
2. **Loki logs**: Được gửi đến Loki (có thể xem trong Grafana)

## Cấu hình nâng cao

### Thay đổi Loki URL

Nếu Loki chạy ở địa chỉ khác, cập nhật trong `application.yml`:

```yaml
logging:
  loki:
    url: http://loki-server:3100/loki/api/v1/push
```

### Tắt Loki logging (nếu cần)

Trong `logback-spring.xml`, comment dòng:
```xml
<!-- <appender-ref ref="ASYNC_LOKI"/> -->
```

### Thay đổi log level

Trong `application.yml`:
```yaml
logging:
  level:
    com.auction: DEBUG
    gateway: DEBUG
```

## Troubleshooting

### Lỗi "structured metadata is disallowed"

Nếu gặp lỗi:
```
Loki responded with non-success status 400... includes structured metadata, but this feature is disallowed
```

**Giải pháp**: File `monitoring/loki/loki-config.yaml` đã được cấu hình với `allow_structured_metadata: true`. 

Khởi động lại Loki:
```bash
docker-compose restart loki
# Hoặc
docker-compose down loki
docker-compose up -d loki
```

### Không thấy logs trong Grafana

1. Kiểm tra Loki đang chạy:
   ```bash
   docker-compose ps loki
   curl http://localhost:3100/ready
   ```

2. Kiểm tra backend service có kết nối được Loki không:
   - Xem console logs có lỗi kết nối
   - Kiểm tra URL Loki trong logback-spring.xml

3. Kiểm tra datasource trong Grafana:
   - Configuration → Data Sources → Loki → Test

### Logs bị chậm

- Tăng `queueSize` trong AsyncAppender (logback-spring.xml):
  ```xml
  <queueSize>2000</queueSize>
  ```

### Quá nhiều logs

- Giảm log level xuống INFO hoặc WARN:
  ```xml
  <root level="WARN">
  ```

## Tips & Best Practices

1. **Label Strategy**: Sử dụng labels hợp lý (app, level, host) để query nhanh
2. **Time Range**: Giới hạn time range khi query để tránh quá tải
3. **Filters**: Sử dụng filters để lọc logs không cần thiết
4. **Dashboards**: Tạo dashboards riêng cho từng service
5. **Alerts**: Thiết lập alerts cho ERROR logs quan trọng

## Các Links hữu ích

- Grafana UI: http://localhost:3000
- Loki API: http://localhost:3100
- LogQL Documentation: https://grafana.com/docs/loki/latest/logql/
- Loki4j Documentation: https://github.com/loki4j/loki-logback-appender
