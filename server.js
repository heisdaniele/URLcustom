const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

// Initialize Express app
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

// Validate environment variables before initializing Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials - check environment variables');
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'custom.html'));
});

app.post('/api/create', async (req, res) => {
  try {
    const { original_url, custom_alias } = req.body;
    
    if (!original_url || !custom_alias) {
      return res.status(400).json({ 
        error: 'Missing required fields: original_url and custom_alias' 
      });
    }

    const { data, error } = await supabase.rpc('create_custom_link', {
      p_original_url: original_url,
      p_alias: custom_alias
    });

    if (error) {
      console.error('Supabase RPC Error:', error);
      return res.status(409).json({ 
        error: error.message,
        code: error.code || 'CONFLICT'
      });
    }

    res.status(201).json({
      data: {
        ...data,
        short_url: `${req.headers.host}/${custom_alias}`
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

app.get('/:alias', async (req, res) => {
  try {
    const { alias } = req.params;
    
    const { data, error } = await supabase
      .from('urls')
      .select('original_url')
      .eq('short_url', alias)
      .single();

    if (error || !data) {
      return res.status(404).send(`
        <h1>Link not found</h1>
        <p>The requested short URL does not exist</p>
      `);
    }

    // Update click count
    await supabase
      .from('urls')
      .update({ click_count: supabase.rpc('increment') })
      .eq('short_url', alias);

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// Export for Vercel
module.exports = app;

// Local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Supabase connected to: ${supabaseUrl}`);
  });
}