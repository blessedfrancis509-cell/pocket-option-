const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
        // Cache HTML files briefly
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// SPA fallback: serve index.html for any unmatched route
app.get('*', (req, res) => {
    // Check if the requested path maps to an actual file
    const filePath = path.join(__dirname, 'public', req.path);
    const fs = require('fs');
    
    // If it's a directory, try to serve index.html from it
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        const indexPath = path.join(filePath, 'index.html');
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }
    
    // Default to main index
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pocket Option clone running on port ${PORT}`);
});
