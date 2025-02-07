const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const app = express();

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL;       // e.g., "https://your-project.supabase.co"
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Your Supabase anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Middleware to serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the custom.html file at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'custom.html'));
});

// Route to handle custom alias redirection dynamically via Supabase
app.get('/:alias', async (req, res) => {
  const alias = req.params.alias;
  console.log(`Received alias: ${alias}`);
  
  try {
    // Query Supabase for the URL record that matches the alias (stored in short_url)
    const { data, error } = await supabase
      .from('urls')
      .select('original_url')
      .eq('short_url', alias)
      .single();

    if (error || !data) {
      console.log(`Alias not found or error occurred: ${error ? error.message : 'No data returned'}`);
      return res.status(404).send('Alias not found');
    }
    
    // Use the original_url from the table as the target for redirection
    const targetUrl = data.original_url;
    console.log(`Redirecting to ${targetUrl}`);
    return res.redirect(targetUrl);
  } catch (err) {
    console.error('Unexpected error while querying Supabase:', err);
    return res.status(500).send('Internal Server Error');
  }
});

// If this file is run directly (for local testing), start the server on port 3000.
// When deployed on Vercel, Vercel will import this file and use the exported app.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} else {
  module.exports = app;
}
