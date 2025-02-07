require('dotenv').config(); // For local testing; remove or configure as needed in production

const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const app = express();

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL;       // e.g., "https://your-project.supabase.co"
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Your Supabase anon key
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set.');
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Use express.json() to parse JSON request bodies
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the custom.html file at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'custom.html'));
});

// POST endpoint to create a new URL record (custom alias creation)
app.post('/api/create', async (req, res) => {
  const { original_url, custom_alias } = req.body;
  console.log(`Creating alias: ${custom_alias} for URL: ${original_url}`);

  try {
    // Call the Supabase RPC function to create a custom link.
    // This assumes you have created a function named "create_custom_link" in your Supabase SQL.
    const { data, error } = await supabase.rpc('create_custom_link', {
      p_original_url: original_url,
      p_custom_alias: custom_alias
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ data });
  } catch (err) {
    console.error('Unexpected error in /api/create:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET endpoint to handle alias redirection dynamically via Supabase
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

// Start the server if run directly (for local testing). When deployed on Vercel, export the app.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} else {
  module.exports = app;
}
