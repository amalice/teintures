import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vdlxzugpwrqtuqrgexyh.supabase.co'; // Ex: https://ton-projet.supabase.co
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkbHh6dWdwd3JxdHVxcmdleHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjY3MjMsImV4cCI6MjA5NDI0MjcyM30.nkDVyN27egmh8wo9UBLi2pwYuRG6JsQT0QeIQs-6iE4'; // Récupérée dans Supabase > Settings > API

export const supabase = createClient(supabaseUrl, supabaseKey);