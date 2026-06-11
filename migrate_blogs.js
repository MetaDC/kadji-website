const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const BASE_URL = 'https://kadji.co.in';
const PROJECT_ID = 'kadji-blogs';
const BLOGS_DIR = path.join(__dirname, 'blogs');
const IMAGES_DIR = path.join(__dirname, 'assets', 'blogs');
const SCRATCH_DATA_PATH = '/Users/diwizon/.gemini/antigravity-ide/brain/d715cbbe-2198-4e5d-a736-d4d6e2a4dd0f/scratch/raw_blogs.json';

// Helper to map Firestore fields from REST format
function mapFirestoreFields(fields) {
  const result = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value.stringValue !== undefined) {
      result[key] = value.stringValue;
    } else if (value.integerValue !== undefined) {
      result[key] = parseInt(value.integerValue, 10);
    } else if (value.doubleValue !== undefined) {
      result[key] = parseFloat(value.doubleValue);
    } else if (value.booleanValue !== undefined) {
      result[key] = value.booleanValue;
    } else if (value.timestampValue !== undefined) {
      result[key] = value.timestampValue;
    } else if (value.arrayValue !== undefined) {
      result[key] = (value.arrayValue.values || []).map(val => {
        if (val.stringValue !== undefined) return val.stringValue;
        if (val.mapValue !== undefined) return mapFirestoreFields(val.mapValue.fields || {});
        return val;
      });
    } else if (value.mapValue !== undefined) {
      result[key] = mapFirestoreFields(value.mapValue.fields || {});
    }
  }
  return result;
}

// Slugify helper
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[“”"'‘’`]/g, '') // strip quotes
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, ''); // trim hyphens
}

// Extractor for short description (HTML tags stripped, truncated to 150 chars)
function extractShortDescription(html) {
  if (!html) return '';
  const text = html
    .replace(/<[^>]+>/g, ' ') // strip tags
    .replace(/\s+/g, ' ')     // normalize spaces
    .trim();
  if (text.length <= 150) return text;
  return text.substring(0, 150) + '...';
}

// Extractor for full meta description (HTML tags stripped, not truncated)
function extractFullDescription(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ') // strip tags
    .replace(/\s+/g, ' ')     // normalize spaces
    .trim();
}

// Helper to download a file
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// Helper to get extension from URL or content type
function getExtensionFromUrl(url) {
  try {
    const decoded = decodeURIComponent(url);
    const pathname = new URL(decoded).pathname;
    const parts = pathname.split('.');
    if (parts.length > 1) {
      const ext = parts[parts.length - 1].split('?')[0].split('#')[0].toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
        return ext;
      }
    }
  } catch (e) {
    // ignore
  }
  return 'webp';
}

// Depth-based path adjuster for navigation, CSS, and JS links
function adjustPaths(html, depth) {
  const prefix = '../'.repeat(depth);
  let result = html;
  
  // Adjust src and href for assets/
  result = result.replace(/(src|href|data-src)=["'](assets\/[^"']+)["']/g, (match, attr, path) => {
    return `${attr}="${prefix}${path}"`;
  });
  
  // Adjust formstyle/formscript etc
  result = result.replace(/(src|href)=["'](form(style|script)\.(css|js))["']/g, (match, attr, file) => {
    return `${attr}="${prefix}${file}"`;
  });

  // Adjust css url() backgrounds
  result = result.replace(/url\((['"]?)(assets\/[^'"\)]+)\1\)/g, (match, quote, path) => {
    return `url(${quote}${prefix}${path}${quote})`;
  });
  
  // Adjust HTML page links
  result = result.replace(/href=["']([^"']+\.html)(#?[^"']*)["']/g, (match, page, hash) => {
    if (page.startsWith('http') || page.startsWith('//') || page.startsWith('mailto:') || page.startsWith('tel:')) {
      return match;
    }
    if (page === 'blog.html') {
      return `href="${prefix}blog.html${hash}"`;
    }
    if (page === 'blog-details.html') {
      return `href="${prefix}blog.html"`;
    }
    return `href="${prefix}${page}${hash}"`;
  });

  return result;
}

// Helper to recursively delete files/folders
function deleteFolderRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

// Helper to restore blog.html links in all root html files
function restoreNavLinks() {
  console.log("Restoring blog.html links in root HTML files...");
  const directoryPath = __dirname;
  const files = fs.readdirSync(directoryPath);
  files.forEach((file) => {
    if (path.extname(file) === '.html' && file !== 'blog.html' && file !== 'blog-details.html') {
      const filePath = path.join(directoryPath, file);
      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;
      if (content.includes('href="blogs/index.html"')) {
        content = content.replaceAll('href="blogs/index.html"', 'href="blog.html"');
        updated = true;
      }
      if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  Restored link in: ${file}`);
      }
    }
  });
}

// Helper to clean inline styles exported from external editors (like Google Docs)
function cleanHtmlStyles(html) {
  if (!html) return '';
  return html.replace(/style\s*=\s*(["'])(.*?)\1/gi, (match, quote, styleContent) => {
    const properties = styleContent.split(';');
    const cleanedProperties = [];
    for (let prop of properties) {
      prop = prop.trim();
      if (!prop) continue;
      const colonIndex = prop.indexOf(':');
      if (colonIndex === -1) continue;
      const key = prop.substring(0, colonIndex).trim().toLowerCase();
      const value = prop.substring(colonIndex + 1).trim().toLowerCase();
      
      // Filter out properties that override theme typography, colors, or structure
      if (key === 'font-family') continue;
      if (key === 'font-size') continue;
      if (key === 'color' && (value === '#000000' || value === 'black' || value === '#111111' || value === '#222222' || value === '#333333')) continue;
      if (key === 'background-color' && value === 'transparent') continue;
      if (key === 'white-space') continue;
      if (key === 'vertical-align') continue;
      if (key === 'text-decoration' && value === 'none') continue;
      if (key === 'font-variant') continue;
      if (key === 'font-style' && value === 'normal') continue;
      if (key === 'font-weight' && (value === '400' || value === 'normal')) continue;
      if (key === 'line-height') continue;
      if (key === 'margin-top' || key === 'margin-bottom') continue;
      
      cleanedProperties.push(prop);
    }
    if (cleanedProperties.length === 0) {
      return '';
    }
    return `style="${cleanedProperties.join('; ')}"`;
  });
}

async function main() {
  console.log("Starting static blog migration...");
  
  // Clean up existing folders/files first to ensure fresh state
  if (fs.existsSync(BLOGS_DIR)) {
    console.log("Cleaning old blogs directory...");
    deleteFolderRecursive(BLOGS_DIR);
  }
  fs.mkdirSync(BLOGS_DIR, { recursive: true });
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  // 1. Load data
  let rawData;
  if (fs.existsSync(SCRATCH_DATA_PATH)) {
    console.log("Loading cached Firestore data...");
    rawData = JSON.parse(fs.readFileSync(SCRATCH_DATA_PATH, 'utf8'));
  } else {
    console.log("Fetching live Firestore data...");
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
    const query = { structuredQuery: { from: [{ collectionId: 'Blogs' }] } };
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });
    rawData = await response.json();
  }
  
  const documents = rawData.filter(item => item.document);
  console.log(`Loaded ${documents.length} blog documents.`);
  
  // 2. Parse and map blogs
  const blogsMap = {};
  const blogsList = [];
  
  for (const doc of documents) {
    const rawFields = doc.document.fields;
    const blogData = mapFirestoreFields(rawFields);
    
    if (blogData.htmlString) {
      blogData.htmlString = cleanHtmlStyles(blogData.htmlString);
    }
    
    blogData.id = blogData.id || doc.document.name.split('/').pop();
    blogData.createdAt = blogData.createdAt || new Date().toISOString();
    blogData.isVisible = blogData.isVisible !== false; // Default true
    
    if (blogData.isVisible) {
      const slug = slugify(blogData.metaTitle || blogData.permalink || blogData.title || blogData.id);
      blogData.slug = slug;
      blogsMap[blogData.id] = blogData;
      blogsList.push(blogData);
    }
  }
  
  // Sort blogs by date descending
  blogsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // 3. Load Templates
  const blogDetailsTemplatePath = path.join(__dirname, 'blog-details.html');
  const blogListTemplatePath = path.join(__dirname, 'blog.html');
  
  if (!fs.existsSync(blogDetailsTemplatePath)) {
    throw new Error("blog-details.html template not found!");
  }
  if (!fs.existsSync(blogListTemplatePath)) {
    throw new Error("blog.html template not found!");
  }
  
  const detailsTemplate = fs.readFileSync(blogDetailsTemplatePath, 'utf8');
  const listTemplate = fs.readFileSync(blogListTemplatePath, 'utf8');
  
  // 4. Process each blog
  console.log("Processing and downloading assets for individual blogs...");
  const compiledBlogs = [];
  
  for (const blog of blogsList) {
    const slug = blog.slug;
    const blogFolder = path.join(BLOGS_DIR, slug);
    
    if (!fs.existsSync(blogFolder)) {
      fs.mkdirSync(blogFolder, { recursive: true });
    }
    
    console.log(`Processing blog: ${blog.metaTitle} (slug: ${slug})`);
    
    // Download thumbnail/cover to /assets/blogs/<slug>-cover.<ext>
    const coverExt = getExtensionFromUrl(blog.thumbnail || 'cover.webp');
    const coverLocalName = `${slug}-cover.${coverExt}`;
    const coverDest = path.join(IMAGES_DIR, coverLocalName);
    
    if (blog.thumbnail) {
      try {
        console.log(`Downloading cover image to ${coverDest}...`);
        await downloadFile(blog.thumbnail, coverDest);
      } catch (err) {
        console.error(`Failed to download cover for ${slug}:`, err.message);
      }
    }
    
    // Download other images in content to /assets/blogs/<slug>-img-<index>.<ext>
    const imageMapping = {};
    const imagesToDownload = blog.imagesLinks || [];
    let imgIdx = 1;
    for (const imgUrl of imagesToDownload) {
      if (!imgUrl) continue;
      try {
        const imgExt = getExtensionFromUrl(imgUrl);
        const imgName = `${slug}-img-${imgIdx}.${imgExt}`;
        const imgDest = path.join(IMAGES_DIR, imgName);
        console.log(`Downloading body image to ${imgDest}...`);
        await downloadFile(imgUrl, imgDest);
        imageMapping[imgUrl] = imgName;
        imgIdx++;
      } catch (err) {
        console.error(`Failed to download image ${imgUrl}:`, err.message);
      }
    }
    
    // Replace content images inside htmlString with relative path from /blogs/<slug>/index.html
    // relative path is ../../assets/blogs/<filename>
    let updatedHtml = blog.htmlString || '';
    for (const [remoteUrl, localName] of Object.entries(imageMapping)) {
      const escapedUrl = remoteUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapedUrl, 'g');
      updatedHtml = updatedHtml.replace(regex, `../../assets/blogs/${localName}`);
    }
    
    // Ensure all images are lazy-loaded
    updatedHtml = updatedHtml.replace(/<img\s([^>]*)/gi, (match, attributes) => {
      if (!/loading=/i.test(attributes)) {
        return `<img loading="lazy" ${attributes}`;
      }
      return match;
    });
    
    // Generate other blogs sidebar HTML
    let sidebarHtml = '';
    const otherBlogsRefs = blog.otherBlogs || [];
    const actualOtherBlogs = otherBlogsRefs
      .map(ref => blogsMap[ref.id])
      .filter(Boolean)
      .slice(0, 3);
      
    const sidebarSource = actualOtherBlogs.length > 0 ? actualOtherBlogs : blogsList.filter(b => b.id !== blog.id).slice(0, 3);
    
    for (const other of sidebarSource) {
      const otherDate = new Date(other.createdAt).toDateString().split(" ").slice(1).join(" ");
      const otherExt = getExtensionFromUrl(other.thumbnail || 'cover.webp');
      const otherCover = `${other.slug}-cover.${otherExt}`;
      sidebarHtml += `
        <div class="blog-block blog-block--style6 mb-25">
          <div class="blog-block__img">
            <a class="blog-block__img__link" href="../${other.slug}/">
              <img class="rounded-2" src="../../assets/blogs/${otherCover}" alt="Blog" style="width:90px;height:90px;object-fit: cover;" loading="lazy">
            </a>
          </div>
          <div class="blog-block__content">
            <span class="blog-block__meta">${otherDate}</span>
            <h4 class="blog-block__heading mb-0">
              <a href="../${other.slug}/" style="font-size:18px;">
                ${other.metaTitle || other.title}
              </a>
            </h4>
          </div>
        </div>
      `;
    }
    
    // Generate Tags HTML
    let tagsHtml = '';
    const tags = blog.tags || [];
    for (const tag of tags) {
      tagsHtml += `<a>${tag}</a>\n`;
    }
    
    // Compile single blog HTML template
    let depth2Html = detailsTemplate;
    
    // 1. Remove Firebase scripts safely
    depth2Html = depth2Html.replace(/<script\s+defer\s+src="https:\/\/www\.gstatic\.com\/firebasejs\/10\.12\.0\/firebase-app-compat\.js"><\/script>/gi, '');
    depth2Html = depth2Html.replace(/<script\s+defer\s+src="https:\/\/www\.gstatic\.com\/firebasejs\/10\.12\.0\/firebase-firestore-compat\.js"><\/script>/gi, '');
    depth2Html = depth2Html.replace(/<script>\s*\/\/\s*Function to get query parameter[^]*?<\/script>/gi, '');
    
    // 2. Adjust assets/links to depth=2
    depth2Html = adjustPaths(depth2Html, 2);
    
    // 3. Inject Title, Meta and Canonical
    const formattedDate = new Date(blog.createdAt).toDateString().split(" ").slice(1).join(" ");
    const fullDescription = extractFullDescription(blog.htmlString);
    const shortDescription = extractShortDescription(blog.htmlString);
    
    depth2Html = depth2Html.replace(/<title>[^<]*<\/title>/i, `<title>${blog.metaTitle} | Kadji Care</title>`);
    depth2Html = depth2Html.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${BASE_URL}/blogs/${slug}/" />`);
    
    // Replace description meta if it exists, otherwise add it
    if (/<meta name="description"/i.test(depth2Html)) {
      depth2Html = depth2Html.replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${fullDescription}" />`);
    } else {
      depth2Html = depth2Html.replace('</head>', `  <meta name="description" content="${fullDescription}" />\n</head>`);
    }
    
    // Open Graph updates
    depth2Html = depth2Html.replace(/<meta property="og:title"[^>]*>/gi, `<meta property="og:title" content="${blog.metaTitle}" />`);
    depth2Html = depth2Html.replace(/<meta property="og:description"[^>]*>/gi, `<meta property="og:description" content="${fullDescription}" />`);
    depth2Html = depth2Html.replace(/<meta property="og:image"[^>]*>/gi, `<meta property="og:image" content="${BASE_URL}/assets/blogs/${coverLocalName}" />`);
    depth2Html = depth2Html.replace(/<meta property="og:url"[^>]*>/gi, `<meta property="og:url" content="${BASE_URL}/blogs/${slug}/" />`);
    
    // Twitter updates
    depth2Html = depth2Html.replace(/<meta name="twitter:title"[^>]*>/gi, `<meta name="twitter:title" content="${blog.metaTitle}" />`);
    depth2Html = depth2Html.replace(/<meta name="twitter:description"[^>]*>/gi, `<meta name="twitter:description" content="${fullDescription}" />`);
    depth2Html = depth2Html.replace(/<meta name="twitter:image"[^>]*>/gi, `<meta name="twitter:image" content="${BASE_URL}/assets/blogs/${coverLocalName}" />`);
    
    // 4. Inject Static Content into placeholders (using relative path to single images folder `../images/`)
    depth2Html = depth2Html.replace(/id="page-title">[^<]*/i, `id="page-title">${blog.metaTitle}`);
    depth2Html = depth2Html.replace(/id="blog-title"[^>]*>[^]*?<\/h3>/i, `id="blog-title" style="font-size: 24px; margin-top: 10px"><a href="./">${blog.metaTitle}</a></h3>`);
    depth2Html = depth2Html.replace(/id="blog-date">[^<]*/i, `id="blog-date">${formattedDate}`);
    depth2Html = depth2Html.replace(/id="blog-thumb"[^>]*>[^]*?<\/a>/i, `id="blog-thumb" style="height: auto"><img src="../../assets/blogs/${coverLocalName}" alt="blog" loading="lazy"></a>`);
    depth2Html = depth2Html.replace(/id="blog-content">[^]*?<\/div>/i, `id="blog-content">${updatedHtml}</div>`);
    depth2Html = depth2Html.replace(/id="blog-sides">[^]*?<\/div>/i, `id="blog-sides">${sidebarHtml}</div>`);
    depth2Html = depth2Html.replace(/id="blog-tags">[^]*?<\/div>/i, `id="blog-tags">${tagsHtml}</div>`);
    
    // Fix page header background image
    depth2Html = depth2Html.replace(/class="page-header__bg"[^>]*>/i, `class="page-header__bg" style="background-image: url('../../assets/blogs/${coverLocalName}');">`);
    
    // Save individual blog index.html
    fs.writeFileSync(path.join(blogFolder, 'index.html'), depth2Html, 'utf8');
    
    // Track for listing card generation
    compiledBlogs.push({
      title: blog.metaTitle,
      slug: slug,
      fullDesc: fullDescription,
      shortDesc: shortDescription,
      coverImageName: coverLocalName,
      createdAt: blog.createdAt
    });
  }
  
  // 5. Generate statically baked blog listing page /blog.html (at root!)
  console.log("Generating static blog listing page `/blog.html` at the root...");
  let listHtml = listTemplate;
  
  // Remove Firebase scripts safely
  listHtml = listHtml.replace(/<script\s+defer\s+src="https:\/\/www\.gstatic\.com\/firebasejs\/10\.12\.0\/firebase-app-compat\.js"><\/script>/gi, '');
  listHtml = listHtml.replace(/<script\s+defer\s+src="https:\/\/www\.gstatic\.com\/firebasejs\/10\.12\.0\/firebase-firestore-compat\.js"><\/script>/gi, '');
  listHtml = listHtml.replace(/<script>\s*document\.addEventListener\("DOMContentLoaded",\s*function\s*\(\)\s*\{\s*const\s*firebaseConfig[^]*?<\/script>/gi, '');
  
  // Adjust paths to depth 0 (since blog.html is at root)
  listHtml = adjustPaths(listHtml, 0);
  
  // Compile the HTML for all blog cards statically!
  let blogCardsHtml = '';
  for (const blog of compiledBlogs) {
    const ms = Date.parse(blog.createdAt);
    const dateStr = ms ? new Date(ms).toDateString().split(" ").slice(1).join(" ") : "";
    
    blogCardsHtml += `
      <div class="col-md-6 col-lg-4 blog-style" data-title="${blog.title.toLowerCase()}" data-description="${blog.fullDesc.toLowerCase()}">
        <div class="blog-card wow fadeInUp" data-wow-duration='1500ms' data-wow-delay='000ms'>
          <a href="./blogs/${blog.slug}/" class="blog-card__image">
            <img src="assets/blogs/${blog.coverImageName}" alt="Blog" class="img-height" loading="lazy">
          </a>
          <div class="blog-card__content" style="background-image: url('assets/images/blog/blog-bg-1-1.webp');">
            <h3 class="blog-card__title">
              <a href="./blogs/${blog.slug}/">${blog.title}</a>
            </h3>
            <p class="blog-card__text" style="margin-top: 10px; margin-bottom: 15px; font-size: 14px; color: #555; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${blog.shortDesc}
            </p>
            <div class="blog-card-bottom">
              <a href="./blogs/${blog.slug}/" class="blog-card__link">
                <span class="blog-card__link__back"><span class="icon-duble-arrow"></span>Read More</span>
              </a>
              <span class="blog-block__meta">${dateStr}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Inject the statically generated cards directly into the row container
  listHtml = listHtml.replace(/<div class="row gutter-y-30" id="blogs-list">[^]*?<\/div>/i, `<div class="row gutter-y-30" id="blogs-list">${blogCardsHtml}</div>`);
  
  // Inject static vanilla JS search filtering logic
  const searchScript = `
    <script>
      document.addEventListener("DOMContentLoaded", function () {
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
          searchInput.addEventListener("input", function (event) {
            const keyword = event.target.value.trim().toLowerCase();
            const cards = document.querySelectorAll(".blog-style");
            
            cards.forEach((card) => {
              const title = card.getAttribute("data-title") || "";
              const desc = card.getAttribute("data-description") || "";
              
              if (!keyword || title.includes(keyword) || desc.includes(keyword)) {
                card.style.display = "";
              } else {
                card.style.display = "none";
              }
            });
          });
        }
      });
    </script>
  `;
  listHtml = listHtml.replace('</body>', `${searchScript}\n</body>`);
  
  // Save listing page
  fs.writeFileSync(path.join(__dirname, 'blog.html'), listHtml, 'utf8');
  console.log("Saved static listing page blog.html.");
  
  // 6. Update sitemap.xml
  console.log("Updating sitemap.xml...");
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    let sitemap = fs.readFileSync(sitemapPath, 'utf8');
    
    // Parse current urls
    const urlPattern = /<url>[^]*?<\/url>/g;
    const urls = sitemap.match(urlPattern) || [];
    
    const cleanUrls = [];
    const urlsSeen = new Set();
    
    for (const urlStr of urls) {
      const locMatch = urlStr.match(/<loc>([^<]+)<\/loc>/);
      if (locMatch) {
        const loc = locMatch[1];
        if (loc.endsWith('blog.html') || loc.endsWith('blog-details.html')) {
          continue;
        }
        cleanUrls.push(urlStr);
        urlsSeen.add(loc);
      }
    }
    
    // Add blog.html (root listing page)
    const blogIndexLoc = `${BASE_URL}/blog.html`;
    if (!urlsSeen.has(blogIndexLoc)) {
      const today = new Date().toISOString().split('T')[0];
      cleanUrls.push(`  <url>\n    <loc>${blogIndexLoc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>`);
    }
    
    // Add individual blog URLs
    for (const blog of compiledBlogs) {
      const blogLoc = `${BASE_URL}/blogs/${blog.slug}/`;
      if (!urlsSeen.has(blogLoc)) {
        const today = new Date(blog.createdAt).toISOString().split('T')[0];
        cleanUrls.push(`  <url>\n    <loc>${blogLoc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`);
      }
    }
    
    const sitemapOutput = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${cleanUrls.join('\n')}\n</urlset>`;
    fs.writeFileSync(sitemapPath, sitemapOutput, 'utf8');
    console.log("Saved sitemap.xml.");
  }
  
  // 7. Update robots.txt
  console.log("Updating robots.txt...");
  const robotsPath = path.join(__dirname, 'robots.txt');
  const robotsContent = `User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml\n`;
  fs.writeFileSync(robotsPath, robotsContent, 'utf8');
  console.log("Saved robots.txt.");
  
  // 8. Restore links back to blog.html in other pages
  restoreNavLinks();
  
  console.log("Migration completed successfully!");
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
