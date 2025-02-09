const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();

// Configure middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'https://ur-lcustom.vercel.app'
  ],
  methods: ['GET', 'POST']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials');
}

// Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

// Routes

// Serve the custom.html page at the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'custom.html'));
});

// API endpoint to create a custom URL
app.post('/api/create', async (req, res) => {
  try {
    // Destructure the required fields; note: we removed ip_info since it's not used in RPC
    const { original_url, custom_alias } = req.body;
    
    if (!original_url || !custom_alias) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    // Call the Supabase RPC function to create a custom URL
    const { data, error } = await supabase.rpc('create_custom_link_custom', {
      p_original_url: original_url,
      p_alias: custom_alias
    });

    if (error) {
      console.error('Supabase RPC Error:', error);
      return res.status(error.code === '23505' ? 409 : 500).json({
        error: error.code === '23505' 
          ? 'Alias already exists' 
          : 'Creation failed'
      });
    }

    // Return the created URL details, including the full short URL
    res.status(201).json({
      data: {
        ...data,
        short_url: `${req.headers.host}/${custom_alias}`
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Redirect endpoint for custom URLs
app.get('/:alias', async (req, res) => {
  try {
    const { alias } = req.params;
    
    // Look up the custom URL by its alias
    const { data, error } = await supabase
      .from('custom_urls')
      .select('original_url, id')
      .eq('custom_alias', alias)
      .single();

    if (error || !data) {
      return res.status(404).send(`
        <h1>Link not found</h1>
        <p>The requested short URL does not exist</p>
      `);
    }

    // Extract IP and device information from the request headers
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const deviceType = /mobile/i.test(userAgent) ? 'Mobile' : 'Desktop';

    // For location, you can later integrate a server-side IP lookup;
    // for now, we'll set it as 'Unknown'
    const location = 'Unknown';

    // Insert a new click event into the click_events table
    const { error: clickError } = await supabase
      .from('click_events')
      .insert({
        url_id: data.id,
        url_type: 'custom',
        location: location,
        device_type: deviceType
      });

    if (clickError) {
      console.error('Error inserting click event:', clickError);
    }

    // Redirect to the original URL
    res.redirect(data.original_url);
  } catch (error) {
    console.error('Redirect Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Supabase connected to: ${supabaseUrl}`);
});
