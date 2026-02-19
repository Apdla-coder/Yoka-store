// Supabase Client Configuration
// Replace these with your actual Supabase URL and anon key
const SUPABASE_URL = 'https://kjphbcapcvenizkxfrlv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqcGhiY2FwY3Zlbml6a3hmcmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjkyNDYsImV4cCI6MjA4NzAwNTI0Nn0.5lXAQGSlAzFI47SMj7a2EnDaFGsFHaqc3eklQ1pvFOY';

// supabase is the global from the CDN script; create client and expose it
if (typeof supabase !== 'undefined') {
  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.error('Supabase SDK not loaded. Add the script before supabase-client.js');
}
