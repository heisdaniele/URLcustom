// Route to handle custom alias redirection dynamically via Supabase
app.get('/:alias', async (req, res) => {
  const alias = req.params.alias;
  console.log(`Received alias: ${alias}`);
  
  try {
    // Use maybeSingle() so that if no record is found, it returns null rather than throwing an error
    const { data, error } = await supabase
      .from('urls')
      .select('original_url')
      .eq('short_url', alias)
      .maybeSingle();

    if (error) {
      console.log(`Error while fetching alias: ${error.message}`);
      return res.status(500).send('Internal Server Error');
    }
    
    if (!data) {
      console.log(`Alias not found: ${alias}`);
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
