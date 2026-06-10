const fs = require('fs');
const path = require('path');

const directoryPath = __dirname;
fs.readdir(directoryPath, (err, files) => {
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  }
  files.forEach((file) => {
    if (path.extname(file) === '.html') {
      const filePath = path.join(directoryPath, file);
      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;
      if (content.includes('href="blog.html"')) {
        console.log(`Updating links in: ${file}`);
        content = content.replace(/href="blog\.html"/g, 'href="blogs/index.html"');
        updated = true;
      }
      if (content.includes('href="blog-details.html"')) {
        console.log(`Updating blog details link in: ${file}`);
        content = content.replace(/href="blog-details\.html"/g, 'href="blogs/index.html"');
        updated = true;
      }
      if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  });
});
