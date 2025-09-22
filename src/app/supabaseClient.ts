import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qdzklqbqqjrxcoqxkiky.supabase.co';   // replace with your project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkemtscWJxcWpyeGNvcXhraWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjU4NDMsImV4cCI6MjA3NDEwMTg0M30.C9ozRZSa06i8ie6AfVRSFoNucWbNTRsjh-_qZ4zHk6g';                     // replace with anon key

export const supabase = createClient(supabaseUrl, supabaseKey);
