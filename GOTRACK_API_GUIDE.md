# Hướng dẫn API gps.gotrack.vn (đang đục)

> File này ghi lại chi tiết bộ API của **gps.gotrack.vn** để tham chiếu khi tích hợp vào hệ thống của mình. Cập nhật dần mỗi khi đục thêm endpoint mới.

---

## 1. Thông tin chung

| Mục | Giá trị |
|---|---|
| **Base URL** | `https://gps.gotrack.vn/api` |
| **Origin frontend** | `https://gps5g.com` |
| **Content-Type** | `application/json` |
| **Auth** | Token trong header (xem mục 3) |
| **CORS** | `access-control-allow-origin: *` → gọi trực tiếp từ browser được |

### Header chung gửi kèm mọi request

```
Content-Type: application/json
accept: application/json
device-type: c79cca2bd64d45d980ea92d2fe27bb86
origin: https://gps5g.com
referer: https://gps5g.com/
```

- `device-type` là **device fingerprint** do client sinh ra (UUID 32 ký tự hex không dấu gạch). Có vẻ server không kiểm nghiêm, mình có thể dùng 1 giá trị cố định.
- Không cần gửi `cookie`. Xác thực hoàn toàn qua **token** (xem dưới).

---

## 2. Envelope response chuẩn

**Mọi response** của server đều có cùng khung này:

```json
{
  "timestamp": 0,
  "status": 200,
  "datetime": "2026-04-24 10:03:51",
  "message": "User authenticated successfully.",
  "messageCode": "AUTH__SUCCESS",
  "result": { ... }
}
```

| Field | Ý nghĩa |
|---|---|
| `timestamp` | Epoch ms (thường = 0, có vẻ không dùng) |
| `status` | **HTTP-like status** trong body (200 = OK). Đây là field cần check, không chỉ dựa vào HTTP status. |
| `datetime` | Giờ server trả response, format `yyyy-MM-dd HH:mm:ss` (giờ Việt Nam) |
| `message` | Thông báo con người đọc được (EN hoặc rỗng) |
| `messageCode` | **Mã lỗi/thành công cho code xử lý**, ví dụ `AUTH__SUCCESS`, `AUTH__FAIL` |
| `result` | **Payload thực sự**. Có thể là object, array, hoặc null. |

👉 **Quy tắc xử lý:** luôn check `status === 200` trước, nếu fail thì đọc `messageCode` để map sang logic ứng dụng.

---

## 3. Authentication & Token

### 3.1 Dạng token

Sau khi login thành công, server trả token dạng:

```
117948_9e3bb5c808364fa694b85b93f8f375ca
```

Token gồm **2 phần nối nhau bằng dấu `_`**:

| Phần | Ví dụ | Ý nghĩa |
|---|---|---|
| `uid` | `117948` | **User ID của chính user đang login.** Nhiều API dùng làm query param (`parentId`, `userId`…) |
| `sessionKey` | `9e3bb5c808364fa694b85b93f8f375ca` | Chuỗi 32 ký tự hex ngẫu nhiên, server sinh ra cho mỗi phiên |

> 💡 **Mẹo**: từ token có thể **tách uid ngay không cần gọi API khác**:
> ```js
> const uid = token.split('_')[0]; // "117948"
> ```

### 3.2 Cách gửi token ✅ ĐÃ XÁC NHẬN

Gửi **raw token, KHÔNG có prefix `Bearer`**:

```http
authorization: 117948_9e3bb5c808364fa694b85b93f8f375ca
```

(xác nhận bằng cách dump Request Headers từ gps5g.com gốc ngày 2026-04-24)

### 3.3 Header `device-type` chỉ dùng cho LOGIN

Server whitelist CORS header như sau:

```
access-control-allow-headers: X-Requested-With, Content-Type, Authorization,
                              Gps.App.Version, Origin, Accept, ...
```

⚠️ **Không có `device-type`** trong danh sách này. Nghĩa là:
- **Login** (`/auth/login`): **BẮT BUỘC** gửi `device-type` (server login chấp nhận riêng)
- **Tất cả API khác sau login**: **KHÔNG được gửi** `device-type`, gửi vào là browser chặn do CORS preflight fail

### 3.4 Thời hạn token

Field `expiredAt` trả về trong login = **đúng 24h** sau thời điểm login. Sau thời điểm đó phải login lại.

---

## 4. Endpoint: `POST /auth/login`

### Request

```http
POST https://gps.gotrack.vn/api/auth/login
Content-Type: application/json
device-type: c79cca2bd64d45d980ea92d2fe27bb86
```

```json
{
  "username": "dailycap2",
  "password": "123456",
  "code": null,
  "type": 3,
  "tokenFireBase": null,
  "appId": "Mr2n4FaCO8XdS7K6x4sHbIT6L+Gumltq7dy/EW0eIXQ="
}
```

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `username` | string | ✅ | Tên đăng nhập |
| `password` | string | ✅ | Plain text — server hash phía backend |
| `code` | string/null | ❌ | OTP / captcha code (khi bật 2FA) |
| `type` | int | ✅ | **3** = web. Các giá trị khác: có thể 1=Android, 2=iOS (chưa confirm) |
| `tokenFireBase` | string/null | ❌ | FCM token để nhận push, web để null |
| `appId` | string | ✅ | Fingerprint app/device (chuỗi base64, cố định cho 1 thiết bị) |

### Response thành công

```json
{
  "timestamp": 0,
  "status": 200,
  "datetime": "2026-04-24 10:03:51",
  "message": "User authenticated successfully.",
  "messageCode": "AUTH__SUCCESS",
  "result": {
    "pageMain": "/map/online",
    "token": "117948_9e3bb5c808364fa694b85b93f8f375ca",
    "username": "dailycap2",
    "expiredAt": "2026-04-25 10:03:51"
  }
}
```

| Field trong `result` | Ý nghĩa |
|---|---|
| `pageMain` | URL trang chủ mà user này được cấu hình mở sau khi login (vd `/map/online`, `/dashboard`…) |
| `token` | `<uid>_<sessionKey>` — lưu vào `localStorage` để gửi kèm các request sau |
| `username` | Echo lại username (dùng để hiển thị) |
| `expiredAt` | Hạn dùng token, format `yyyy-MM-dd HH:mm:ss` |

### Biến cần lưu sau login

```js
uid        = 117948                                  // tách từ token
token      = "117948_9e3bb5c808364fa694b85b93f8f375ca"
username   = "dailycap2"
pageMain   = "/map/online"
expiredAt  = "2026-04-25 10:03:51"
```

---

## 5. Endpoint: `GET /users/get-child-users`

Lấy **danh sách user con** của 1 user cha (dùng trong mô hình **đại lý - đại lý con - khách hàng** phân cấp).

### Request

```http
GET https://gps.gotrack.vn/api/users/get-child-users?parentId=117948&pageNo=1&pageSize=20
Authorization: Bearer 117948_9e3bb5c808364fa694b85b93f8f375ca
device-type: c79cca2bd64d45d980ea92d2fe27bb86
```

### Query params

| Param | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `parentId` | int | bắt buộc | **UID của user cha** cần lấy danh sách con. Thường = uid của chính mình (lấy từ token). |
| `pageNo` | int | 1 | Trang, bắt đầu từ 1 |
| `pageSize` | int | 20 | Số bản ghi mỗi trang |

### Response

```json
{
  "timestamp": 0,
  "status": 200,
  "datetime": "2026-04-24 10:18:13",
  "message": "",
  "messageCode": "",
  "result": {
    "content": [ /* array user con */ ],
    "totalRecord": 5
  }
}
```

- `result.content` — mảng user con ở trang hiện tại
- `result.totalRecord` — **tổng số user con** (để tính số trang: `ceil(totalRecord / pageSize)`)

### Chi tiết 1 user trong `content[]`

Nhóm theo ý nghĩa để dễ hiểu:

#### 🔹 Định danh & quan hệ cây

| Field | Kiểu | Ví dụ | Ý nghĩa |
|---|---|---|---|
| `id` | string | `"175404"` | **UID** của user con |
| `parentId` | string | `"117948"` | UID cha trực tiếp |
| `path` | string | `"117948,"` | **Đường đi từ root** tới user này, các uid cách nhau bằng `,`. Dùng query con cháu nhiều cấp. |
| `pathRelative` | string | `""` | Tương tự path nhưng tính từ 1 mốc nào đó (có thể là "từ user đang login") |
| `aliasId` | string | `"0"` | Alias (0 = chưa đặt) |
| `roleId` | string | `"10"` | **Vai trò**. Phỏng đoán: 1=super, 10=đại lý, 20=user thường… (cần map thêm) |
| `type` | string | `"1"` | Loại user: `1`=cá nhân/đại lý, có thể có 2=doanh nghiệp (cần confirm) |
| `distributorId` | int | `545` | ID nhà phân phối (nhóm đại lý cùng 1 chuỗi) |

#### 🔹 Thông tin cá nhân

| Field | Ý nghĩa |
|---|---|
| `username` | Tên đăng nhập (login) |
| `name` | Tên hiển thị |
| `surname` | Họ |
| `email` / `emailVerify` | Email / trạng thái verify email |
| `phone` / `phoneVerify` | Số ĐT / trạng thái verify |
| `description` | Ghi chú |
| `address` | Địa chỉ |
| `taxCode` | Mã số thuế |
| `avatarUrl` | Object chứa URL avatar (khi có) |

#### 🔹 Trạng thái

| Field | Giá trị | Ý nghĩa |
|---|---|---|
| `status` | `"1"` / `"0"` | 1 = đang hoạt động, 0 = khoá |
| `active` | `"1"` / `"0"` | 1 = đã kích hoạt tài khoản |
| `enable2fa` | `0` / `1` | Có bật 2FA không |
| `isCheckProfile` | `0` / `1` | Có yêu cầu review profile không |
| `loginApprove` | `0` / `1` | Cần phê duyệt khi login ở thiết bị mới |
| `maxSession` | int | Số session đồng thời tối đa (0 = không giới hạn) |

#### 🔹 Thống kê thiết bị / card (đại lý)

| Field | Ý nghĩa |
|---|---|
| `stockDevice` | Số thiết bị trong kho (chưa gán) |
| `totalDevice` | Tổng thiết bị quản lý |
| `totalUser` | Tổng số user con (đệ quy) |
| `currentCard` | Số card thường đang giữ |
| `currentCardOem` | Số card OEM đang giữ |
| `currentLongCard` / `currentLongCardOem` | Card dài hạn (thường / OEM) |
| `currentCardImport` | Card nhập khẩu |
| `currentPoint` | Điểm tích luỹ |

> **Card** ở đây là **thẻ thời hạn sử dụng dịch vụ GPS** (gia hạn 1 năm, 3 năm…). Đại lý mua card từ tổng để bán/gia hạn cho khách.

#### 🔹 Cấu hình hiển thị (locale)

| Field | Ví dụ | Ý nghĩa |
|---|---|---|
| `timezone` | `"Asia/Ho_Chi_Minh"` | Múi giờ |
| `timezoneNumber` | `420` | Offset phút (+07:00 = 420) |
| `language` | `"vi"` | Ngôn ngữ UI |
| `unitDistance` | `"mile"` / `"km"` | Đơn vị độ dài |
| `unitVolume` | `"litre"` / `"gallon"` | Đơn vị thể tích (nhiên liệu) |
| `unitTemperature` | `"celsius"` / `"fahrenheit"` | Đơn vị nhiệt độ |
| `unitWeight` | `"kilogram"` / `"pound"` | Đơn vị khối lượng |
| `dateFormat` | `"d/m/Y"` | Format ngày (PHP-style) |
| `timeFormat` | `"H:m:s"` | Format giờ |
| `weekFirstDay` | `"1"` | Ngày đầu tuần (1 = thứ 2, 0 = chủ nhật) |
| `decimalSeprerator` | `","` | Dấu phân tách thập phân (`,` VN, `.` EN) — chú ý typo gốc: *"Seprerator"* |
| `markerStyle` | `"html"` | Kiểu marker trên bản đồ |
| `carSorting` | `""` | Rule sắp xếp xe trên list |
| `currencyUnit` | `""` | Đơn vị tiền tệ |

#### 🔹 Session / thời hạn

| Field | Ý nghĩa |
|---|---|
| `startTime` / `endTime` | Khoảng thời gian tài khoản được phép sử dụng (null = không giới hạn) |
| `pageMain` | Trang mặc định sau khi login |
| `createdAt` | Thời điểm tạo tài khoản |

#### 🔹 Cây phân cấp

| Field | Ý nghĩa |
|---|---|
| `hasChild` | `true` nếu user này còn có con → có thể gọi đệ quy `get-child-users?parentId=<id>` |
| `key` | Chưa rõ, luôn rỗng trong mẫu |

---

---

## 5b. Endpoint: `GET /users/search-child-users`

Tìm kiếm nhanh user cấp dưới theo từ khoá (username, tên, alias). Khác `get-child-users` ở chỗ **trả mảng phẳng, không phân trang**.

### Request

```http
GET https://gps.gotrack.vn/api/users/search-child-users?searchText=bap&isAlias=true
authorization: 117948_9e3bb5c808364fa694b85b93f8f375ca
```

### Query params

| Param | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `searchText` | string | ✅ | Từ khoá. Match 1 phần (LIKE `%bap%`) trên `username`, `name`, có thể cả `alias` khi `isAlias=true`. |
| `isAlias` | boolean | ❌ | `true` = tìm cả trong danh sách alias; `false` = chỉ user chính |

### Response

```json
{
  "timestamp": 0,
  "status": 200,
  "datetime": "2026-04-24 10:44:34",
  "message": "",
  "messageCode": "",
  "result": [
    { /* user object — giống schema trong mục 5 */ }
  ]
}
```

- `result` là **array** user, **không có phân trang** (không có `content`, không có `totalRecord`). Server có thể đã giới hạn số kết quả tối đa (chưa test).
- Schema 1 user **giống hệt** `get-child-users` → xem mục 5 để tra field.

### Khi nào dùng cái nào

| Nhu cầu | Endpoint |
|---|---|
| Liệt kê toàn bộ cây có phân trang | `get-child-users` |
| Ô tìm kiếm nhanh (autocomplete, "bạn muốn tìm user nào?") | `search-child-users` |

---

---

## 5c. Endpoint: `GET /settings/devices`

**Endpoint quan trọng nhất** — liệt kê **thiết bị GPS (xe)** thuộc 1 user. Đây là entity lõi của hệ thống, response rất dày (80+ field/thiết bị).

### Request

```http
GET https://gps.gotrack.vn/api/settings/devices
  ?pageNo=1
  &pageSize=20
  &userId=120464
  &name=70B1-118.64
  &subAccount=false
  &distributorNearest=true
  &simPackage=false
  &serviceIds=
authorization: 117948_9e3bb5c808364fa694b85b93f8f375ca
```

### Query params

| Param | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `userId` | int | ✅ | UID của user sở hữu thiết bị. Có thể là chính mình (lấy từ token) hoặc UID của 1 user con (lấy từ `get-child-users`). |
| `pageNo` | int | ❌ | Trang, default 1 |
| `pageSize` | int | ❌ | Mặc định 20 |
| `name` | string | ❌ | Lọc theo tên thiết bị (`LIKE %...%`). Để trống = tất cả. |
| `subAccount` | bool | ❌ | `true` = gộp cả thiết bị của các sub-account; `false` = chỉ user này |
| `distributorNearest` | bool | ❌ | Có vẻ dùng để server join thông tin distributor gần nhất vào response |
| `simPackage` | bool | ❌ | Filter thiết bị có gói SIM |
| `serviceIds` | CSV | ❌ | Lọc theo ID các gói dịch vụ. Để trống = tất cả. |

### Response envelope

```json
{
  "status": 200,
  "messageCode": "DEVICE__GET_LIST_SUCCESS",
  "result": {
    "content": [ /* array device */ ],
    "totalRecord": 1
  }
}
```

### Schema 1 device trong `content[]`

Phân nhóm cho dễ đọc:

#### 🔹 Định danh & phân loại

| Field | Kiểu | Ví dụ | Ý nghĩa |
|---|---|---|---|
| `id` | int | `530126` | **ID thiết bị** (PK trong DB) |
| `imei` | string | `"861385071160504"` | IMEI (chip GPS) |
| `typeDevice` | int | `121` | Mã loại thiết bị (lookup ra hãng, model) |
| `typeName` | string | `"INET02"` | Tên loại thiết bị dạng human |
| `name` | string | `"70B1-118.64"` | Tên hiển thị (thường = biển số) |
| `numberPlate` | string | `""` | Biển số chính thức |
| `machineCode` / `machineCodeSearch` | string | `""` / `"70B111864"` | Mã máy (normalised để search) |
| `vinNumber` / `frameNumber` | string | `""` | Số khung, VIN |
| `icon` | int | `5` | Icon ID trên bản đồ |
| `iconAdvancedJson` | any | `null` | Cấu hình icon nâng cao (custom icon) |
| `avatar` | object | `{name, url}` | Ảnh đại diện thiết bị |

#### 🔹 Chủ sở hữu & phân cấp

| Field | Ý nghĩa |
|---|---|
| `userId` / `userName` | Chủ thiết bị (user chính) |
| `userId2` / `userName2` | Chủ thứ 2 (thường giống user chính) |
| `nameUser` | Tên hiển thị của chủ |
| `userPhone` | SĐT chủ |
| `distributorId` / `distributorName` | Nhà phân phối (vd `"Công Ty TNHH ĐT VT Thiên Phương"`) |
| `groupId` | Nhóm xe trong tài khoản |
| `deviceGroupData` | Chuỗi config nhóm (`"20"`) |
| `createByUser` / `modifiedBy` | User tạo / sửa gần nhất |
| `createdAt` / `updatedAt` | Timestamp tạo/sửa |

#### 🔹 Trạng thái

| Field | Giá trị | Ý nghĩa |
|---|---|---|
| `active` | 0/1 | Đang kích hoạt dịch vụ |
| `status` | 0/1 | Trạng thái thiết bị (0 = offline?) |
| `statusName` | string | `"NORMAL"` / các giá trị khác |
| `inputFlag` | int | Cờ trạng thái input |

#### 🔹 Dịch vụ / gia hạn (card)

| Field | Ý nghĩa |
|---|---|
| `serviceId` | ID gói dịch vụ hiện tại (`4` = Bike) |
| `serviceExpire` | Ngày hết hạn dịch vụ (null = chưa kích hoạt?) |
| `userDue` | Hạn thanh toán của chủ |
| `lastService` | **Object chi tiết** gói gần nhất: `{id, name:"Bike", storageDuration:3, serviceDuration:12 (tháng), pointImport:20, pointExtend:20, ...}` |
| `usingTollFee` | Có dùng dịch vụ thu phí không (0/1) |
| `activeWarranty` / `warrantyActiveDate` / `warrantyExpiredDate` | Bảo hành |

#### 🔹 SIM / connectivity

| Field | Ý nghĩa |
|---|---|
| `simno` | Số SIM (MSISDN) |
| `simType` | Loại SIM (0/1/2…) |
| `simName` | Tên gói SIM |
| `ccid` / `ccidOrigin` | Số serial SIM (CCID). `ccidOrigin` = CCID gốc khi lắp |
| `ccidUpdated` | Epoch khi CCID thay đổi gần nhất |
| `ccidExist` | Có CCID không (0/1) |
| `isCheckCcid` | Có check CCID khớp không |
| `fwVersion` | **Firmware của thiết bị** (`"2269B04V01A7670M5A_SDK_..."`) |

#### 🔹 Phương tiện / vận tải

| Field | Ý nghĩa |
|---|---|
| `vehicleType` | Loại xe (1 = bike/mô tô?) |
| `transportType` / `transportTypeQcvn` | Loại hình vận tải (theo QCVN) |
| `businessType` | Mô hình kinh doanh |
| `fuelType` | Loại nhiên liệu |
| `capacityWeight` / `capacityPassenger` | Tải trọng / số chỗ |
| `coefficient` | Hệ số hiệu chuẩn |
| `odometer` / `odoEngine` | Đồng hồ km / giờ máy tích luỹ |
| `isGovernment` / `governmentId` | Cờ & ID xe thuộc cơ quan nhà nước |
| `qcvn` | Tuân thủ QCVN 31 (xe hợp đồng) hay không |

#### 🔹 Tài xế

| `driverId` · `driverName` · `driverCode` · `phoneDriver` — thông tin tài xế gán cho xe này |

#### 🔹 Cấu hình kỹ thuật — `extensions`

```json
{
  "engine": 1,              // có đo engine
  "minSpeed": 0,            // ngưỡng tốc độ tối thiểu để tính di chuyển
  "timeZone": 0,            // offset riêng cho device
  "radiusStop": 100,        // bán kính coi là dừng (m)
  "timeoutGprs": 20,        // timeout gửi GPRS (s)
  "isThirdParty": 0,
  "timeoutCamera": 60,
  "consumptionRate": 0.0,   // nhiên liệu / km
  "minStopDuration": 600,   // dừng >= 10 phút mới ghi nhận (s)
  "consumptionRateHour": 1.0
}
```

#### 🔹 Cảnh báo — `notification.events[]`

Mỗi item: `{ type, value, active }`. Các `type` đã thấy:

| `type` | `value` = | Ý nghĩa |
|---|---|---|
| `over_speed` | km/h | Vượt tốc độ (vd 80 km/h) |
| `forgot_ignition` | giây | Quên tắt máy (vd 180s) |

> Có thể còn các `type` khác khi khai thác thêm (over_stop, fuel_drop, door_open, geofence…)

#### 🔹 Input / output — `ioSetting[]`

Mảng 20 item: `input1..input15`, `odo1..odo5`. Mỗi item:

```json
{ "key":"input1", "basic":false, "value":"input1", "active":false }
```

- `key` = tên chuẩn của chân vật lý trên thiết bị
- `value` = alias người dùng đặt (vd `"RS232-1"` cho input5/6/7 = cổng serial)
- `active` = có dùng hay không
- `basic` = cờ input cơ bản (đã có sẵn) hay custom

#### 🔹 Tín hiệu lắp đặt — `installSignal`

```json
{
  "air":false, "door":false, "rfid":false, "engine":true,
  "battery":false, "ignition":true, "externalPower":false,
  "todayDistance":true
}
```

Cho biết các tín hiệu nào **thực sự đang kết nối & hoạt động**. Dùng để hiển thị icon/trạng thái trên UI (vd có ignition + engine = đang chạy máy).

#### 🔹 Khác

| Field | Ý nghĩa |
|---|---|
| `sensors` | Mảng cảm biến (nhiên liệu, nhiệt độ…) — rỗng trong ví dụ |
| `hasBattery` / `hasCamera` | Thiết bị có pin phụ / camera không |
| `sortOrder` | Thứ tự sắp xếp |
| `oemId` | Nếu là thiết bị OEM custom |
| `reserveId` | ID đặt trước (reservation) |
| `description` / `descAdmin` | Mô tả khách / nội bộ |
| `isSell` / `sellAt` / `sellUpdated` | Đã bán chưa, bán khi nào |
| `isDebug` / `isTest` | Cờ debug/test |
| `isCorridor` | Gán vào corridor/hành lang? |

### Biến auto-capture đáng chú ý

Sau khi gọi API này, các biến sẽ được lưu:

```
content[0].id            = 530126       ← dùng cho API device-detail, tracking…
content[0].imei          = 861385071160504
content[0].userId        = 120464       ← dùng cho các API khác cần userId
content[0].distributorId = 255
content[0].groupId       = 0
content[0].serviceId     = 4
```

### Gợi ý workflow

```
1. Login
2. get-child-users   → chọn 1 user con (vd garahoailinh, id=120464)
3. settings/devices  → userId=120464 → danh sách xe của user đó
4. Với mỗi device.id → gọi API chi tiết / tracking / lệnh điều khiển
```

---

## 6. Biến "chìa khoá" cần lưu & tái sử dụng

Những biến này xuất hiện lặp lại ở nhiều endpoint, nên lưu toàn cục (mình đã auto-capture trong `index2.html`):

| Biến | Lấy từ | Dùng ở |
|---|---|---|
| `token` | `POST /auth/login` → `result.token` | Header `Authorization` mọi request sau |
| `uid` (current user) | Tách `token.split('_')[0]` | `?parentId=<uid>`, `?userId=<uid>`… |
| `pageMain` | login → `result.pageMain` | Redirect sau login |
| `expiredAt` | login → `result.expiredAt` | Check token còn hạn trước khi gọi |
| `distributorId` | user object → `distributorId` | Lọc theo nhà phân phối |
| `roleId` | user object → `roleId` | Check quyền UI |
| `childId` | `get-child-users` → `content[].id` | Drill down cây (recursive) |
| `path` | user object → `path` | Query con cháu nhiều cấp |

---

## 7. Flow sử dụng mẫu

```
┌─────────────┐
│ 1. Login    │  POST /auth/login
│             │  → lưu token, tách uid
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 2. Cây user │  GET /users/get-child-users?parentId=<uid>
│             │  → lấy danh sách đại lý con
└──────┬──────┘
       │  với mỗi child có hasChild=true → đệ quy
       ▼
┌─────────────┐
│ 3. Drill    │  GET /users/get-child-users?parentId=<child.id>
│             │
└─────────────┘
```

---

## 8. TODO — các API tiếp theo cần đục

- [x] ~~Tìm kiếm user con~~ → `GET /users/search-child-users`
- [x] ~~Danh sách thiết bị~~ → `GET /settings/devices`
- [ ] Chi tiết 1 thiết bị: `GET /settings/devices/{id}` (?)
- [ ] Vị trí real-time (từ trang /map/online): có thể WebSocket
- [ ] Profile user hiện tại: `GET /users/profile` hoặc `/auth/profile` (?)
- [ ] Vị trí online real-time: liên quan trang `/map/online` (có thể dùng WebSocket)
- [ ] Lịch sử di chuyển / tracking history
- [ ] Danh sách nhóm xe (`/groups`)
- [ ] Thống kê card / điểm gia hạn
- [ ] Logout: `POST /auth/logout`

> Khi đục thêm endpoint nào, paste request + response vào đây để mình cập nhật tiếp phần tương ứng.

---

## 9. Ví dụ code cURL

### Login

```bash
curl -X POST 'https://gps.gotrack.vn/api/auth/login' \
  -H 'Content-Type: application/json' \
  -H 'device-type: c79cca2bd64d45d980ea92d2fe27bb86' \
  -H 'origin: https://gps5g.com' \
  -d '{
    "username": "dailycap2",
    "password": "123456",
    "code": null,
    "type": 3,
    "tokenFireBase": null,
    "appId": "Mr2n4FaCO8XdS7K6x4sHbIT6L+Gumltq7dy/EW0eIXQ="
  }'
```

### Get child users

```bash
curl 'https://gps.gotrack.vn/api/users/get-child-users?parentId=117948&pageNo=1&pageSize=20' \
  -H 'authorization: 117948_9e3bb5c808364fa694b85b93f8f375ca' \
  -H 'origin: https://gps5g.com'
```

> ⚠️ KHÔNG có `Bearer`, KHÔNG có `device-type` cho các request sau login.

---

*Last update: 2026-04-24. Cập nhật file này mỗi lần đục thêm 1 endpoint mới.*
