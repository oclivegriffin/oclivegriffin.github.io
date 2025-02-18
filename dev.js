import chokidar from 'chokidar';
import { convertMarkdownIndex } from './convert_md.js';
import express from 'express';
import fs from 'fs';


// Create express app
const app = express();
const PORT = 3000;

// Serve static files from htdocs
app.use(express.static('htdocs'));

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// Watch for changes in markdown files and config files
const sourceFiles = JSON.parse(fs.readFileSync('./content/publish_index.json')).map(entry => entry.source);

const watcher = chokidar.watch(sourceFiles)

convertMarkdownIndex()
    .then(() => console.log(`Converted all files`))
    .catch((e) => console.error(`Error converting`, e));

watcher.on('change', (path) => {
    console.log(`File ${path} has been changed`);
    convertMarkdownIndex()
        .then(() => console.log(`Converted all files`))
        .catch((e) => console.error(`Error converting`, e));
}); 