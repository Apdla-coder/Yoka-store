/**
 * Yoka Store — رفع الصور عبر Cloudinary
 * يتطلب: cloudinary_cloud_name و cloudinary_upload_preset من site_settings
 */
async function uploadToCloudinary(file) {
  const cloudName = window.SITE_SETTINGS?.cloudinary_cloud_name;
  const preset = window.SITE_SETTINGS?.cloudinary_upload_preset;
  if (!cloudName || !preset) {
    throw new Error('يرجى إعداد Cloudinary من لوحة التحكم (الإعدادات > الدفع)');
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل رفع الصورة');
  }
  const data = await res.json();
  return data.secure_url;
}
