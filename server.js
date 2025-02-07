app.post('/api/create', async (req, res) => {
  const { original_url, custom_alias } = req.body;
  console.log(`Creating alias: ${custom_alias} for URL: ${original_url}`);

  try {
    // Corrected parameter name: p_custom_alias ➔ p_alias
    const { data, error } = await supabase.rpc('create_custom_link', {
      p_original_url: original_url,
      p_alias: custom_alias  // ✅ Fixed parameter name
    });

    if (error) {
      // Handle duplicate alias specifically
      if (error.code === '23505' || error.message.includes('duplicate_alias')) {
        return res.status(409).json({ 
          error: 'Alias already exists',
          code: 'DUPLICATE_ALIAS'
        });
      }
      
      console.error('Supabase RPC error:', error);
      return res.status(400).json({ 
        error: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      });
    }

    return res.status(201).json({ 
      data: {
        ...data,
        short_url: `${req.headers.host}/${custom_alias}`  // Return full short URL
      }
    });
    
  } catch (err) {
    console.error('Unexpected error in /api/create:', err);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      code: 'SERVER_ERROR'
    });
  }
});