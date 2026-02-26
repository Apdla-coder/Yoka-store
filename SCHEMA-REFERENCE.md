# مرجع هيكل قاعدة البيانات — Yoka Store

هذا الملف يوثّق الهيكل الفعلي لقاعدة البيانات في Supabase.

---

## جدول `orders`

| العمود | النوع | Nullable | الوصف |
|--------|-------|----------|-------|
| id | uuid | NO | المفتاح الأساسي |
| user_id | uuid | YES | مرجع لمستخدم مسجّل |
| order_number | text | NO | رقم الطلب (يُولَّد تلقائياً) |
| status | text | YES | pending, shipping, done, cancel |
| payment_method | text | YES | طريقة الدفع |
| payment_id | text | YES | معرف الدفع |
| transaction_id | text | YES | معرف المعاملة |
| **subtotal** | numeric | **NO** | المجموع قبل الخصم |
| **total** | numeric | **NO** | المجموع النهائي |
| total_amount | numeric | YES | مبلغ الطلب |
| discount_amount | numeric | YES | قيمة الخصم |
| shipping_cost | numeric | YES | تكلفة الشحن |
| customer_name | text | YES | اسم العميل |
| customer_email | text | YES | البريد |
| customer_phone | text | YES | الهاتف |
| city | text | YES | المدينة |
| area | text | YES | المنطقة |
| address | text | NO | العنوان |
| shipping_address | jsonb | YES | عنوان الشحن (JSON) |
| notes | text | YES | ملاحظات |
| created_at | timestamptz | YES | تاريخ الإنشاء |
| updated_at | timestamptz | YES | تاريخ التحديث |

---

## جدول `order_items`

| العمود | النوع | Nullable | الوصف |
|--------|-------|----------|-------|
| id | uuid | NO | المفتاح الأساسي |
| order_id | uuid | YES | مرجع الطلب |
| product_id | uuid | YES | مرجع المنتج |
| **product_name** | text | **NO** | اسم المنتج (snapshot) |
| product_image | text | YES | صورة المنتج |
| quantity | integer | NO | الكمية |
| price_at_time | numeric | NO | السعر وقت الطلب |
| created_at | timestamptz | YES | تاريخ الإنشاء |

---

## ملاحظات للـ Checkout

عند إدراج طلب جديد، يجب إرسال:

**orders:**
- `customer_name`, `customer_phone`, `customer_email`, `city`, `area`, `address`
- `subtotal`, `total`, `total_amount` (نفس القيمة عند عدم وجود خصم)
- `payment_method`, `status: 'pending'`

**order_items:**
- `order_id`, `product_id`, `product_name`, `product_image`, `quantity`, `price_at_time`
