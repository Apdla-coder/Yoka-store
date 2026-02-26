/**
 * Yoka Store — تحميل إعدادات الموقع (الشحن، الدفع) من Supabase
 * يُستخدم في cart.html و checkout.html
 */
window.SITE_SETTINGS = {
  shipping_fee: 25,
  free_shipping_min: 200,
  payment_visa: true,
  payment_apple: true,
  payment_cod: true,
  payment_instapay: true,
  payment_ewallet: true,
  instapay_link: '',
  ewallet_number: '',
  cloudinary_cloud_name: '',
  cloudinary_upload_preset: ''
};

async function loadSiteSettings() {
  if (!window.supabaseClient) return window.SITE_SETTINGS;
  try {
    const { data, error } = await window.supabaseClient.from('site_settings').select('key, value');
    if (error) throw error;
    (data || []).forEach(({ key, value }) => {
      if (key === 'shipping_fee') window.SITE_SETTINGS.shipping_fee = parseFloat(value) || 25;
      else if (key === 'free_shipping_min') window.SITE_SETTINGS.free_shipping_min = parseFloat(value) || 200;
      else if (key === 'payment_visa') window.SITE_SETTINGS.payment_visa = value === '1' || value === 'true';
      else if (key === 'payment_apple') window.SITE_SETTINGS.payment_apple = value === '1' || value === 'true';
      else if (key === 'payment_cod') window.SITE_SETTINGS.payment_cod = value === '1' || value === 'true';
      else if (key === 'payment_instapay') window.SITE_SETTINGS.payment_instapay = value === '1' || value === 'true';
      else if (key === 'payment_ewallet') window.SITE_SETTINGS.payment_ewallet = value === '1' || value === 'true';
      else if (key === 'instapay_link') window.SITE_SETTINGS.instapay_link = value || '';
      else if (key === 'ewallet_number') window.SITE_SETTINGS.ewallet_number = value || '';
      else if (key === 'cloudinary_cloud_name') window.SITE_SETTINGS.cloudinary_cloud_name = value || '';
      else if (key === 'cloudinary_upload_preset') window.SITE_SETTINGS.cloudinary_upload_preset = value || '';
    });
  } catch (e) { console.warn('Site settings load failed:', e); }
  return window.SITE_SETTINGS;
}
