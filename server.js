const express = require('express');
const path = require('path');
const app = express();

// Middleware to serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the custom.html file at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'custom.html'));
});

// Route to handle custom alias redirection
app.get('/:alias', (req, res) => {
  const alias = req.params.alias;
  console.log(`Received alias: ${alias}`);
  
  // Here you could look up the alias in your database.
  // For testing, we simply redirect all aliases to your Vercel URL.
  if (alias) {
    const targetUrl = `https://ur-lcustom.vercel.app/${alias}`; // Replace with your Vercel URL
    console.log(`Redirecting to ${targetUrl}`);
    res.redirect(targetUrl);
  } else {
    console.log(`Alias not found`);
    res.status(404).send('Alias not found');
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});