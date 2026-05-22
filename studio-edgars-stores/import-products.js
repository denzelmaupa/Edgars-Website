const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { getCliClient } = require('sanity/cli');

const client = getCliClient().withConfig({
  token: 'skMX6VSwCVPDSnhCkHbDzUZo15dIIVYDORx0zNvG5XtxcjwqRhNlCjXEbZlxXUs2S6czd6W5iDWckIPZ5Y80sW1996YN24TnzsPRyPgn3Us3iMDp6P4v4cCJsCV0wD5sXOMYiKPpqaaLX9vFtZnJFZ8BxZJLfOlHFEvuT6trwDZISdaW6xOV',
  useCdn: false
});

const PAGES = [
  { file: 'ladieswear.html', category: 'Ladies' },
  { file: 'menswear.html', category: 'Men' },
  { file: 'kidswear.html', category: 'Kids' },
  { file: 'underwear.html', category: 'Underwear' },
  { file: 'homewear.html', category: 'Home' },
  { file: 'beauty_products.html', category: 'Beauty' }
];

async function uploadImage(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) {
      console.warn(`[Warning] Image file not found: ${imagePath}`);
      return null;
    }
    console.log(`Uploading image: ${imagePath}`);
    const asset = await client.assets.upload('image', fs.createReadStream(imagePath), {
      filename: path.basename(imagePath)
    });
    return asset;
  } catch (error) {
    console.error(`Error uploading image ${imagePath}:`, error);
    return null;
  }
}

async function run() {
  console.log('Starting product import from static HTML files into Sanity...');
  
  for (const page of PAGES) {
    const filePath = path.resolve(__dirname, '..', page.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Page file not found: ${filePath}`);
      continue;
    }
    
    console.log(`\n========================================`);
    console.log(`Parsing page: ${page.file} for category: "${page.category}"`);
    console.log(`========================================`);
    
    const htmlContent = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(htmlContent);
    
    const products = [];
    
    // Select all potential product card wrappers
    $('.prd').each((i, el) => {
      const brand = $(el).find('.prd-tag a').text().trim();
      const title = $(el).find('.prd-title a').text().trim();
      
      let imgSrc = $(el).find('.prd-img img').attr('data-srcset') || $(el).find('.prd-img img').attr('src');
      if (!imgSrc) return;
      
      // Clean up multiple sizes in responsive data-srcset if present
      if (imgSrc.includes(' ')) {
        imgSrc = imgSrc.split(' ')[0].trim();
      }
      
      if (brand && title && imgSrc && !imgSrc.includes('product-placeholder.png')) {
        // Dedup title and category in our parser array
        const isDuplicate = products.some(p => p.title.toLowerCase() === title.toLowerCase());
        if (!isDuplicate) {
          products.push({ brand, title, imgSrc });
        }
      }
    });
    
    console.log(`Found ${products.length} unique static products on ${page.file}`);
    
    for (const prod of products) {
      const slug = prod.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      // Check if product already exists in Sanity for this category to prevent double imports
      const query = `*[_type == "product" && title == $title && category == $category][0]`;
      const params = { title: prod.title, category: page.category };
      const existing = await client.fetch(query, params);
      
      if (existing) {
        console.log(`-> Product already exists in Sanity: "${prod.title}" (${page.category}). Skipping.`);
        continue;
      }
      
      const fullImgPath = path.resolve(__dirname, '..', prod.imgSrc);
      const asset = await uploadImage(fullImgPath);
      if (!asset) {
        console.warn(`-> Failed to upload image for: "${prod.title}". Skipping creation.`);
        continue;
      }
      
      const doc = {
        _type: 'product',
        title: prod.title,
        slug: {
          _type: 'slug',
          current: slug
        },
        brand: prod.brand,
        category: page.category,
        image: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: asset._id
          }
        }
      };
      
      try {
        const result = await client.create(doc);
        console.log(`-> Successfully imported product: "${result.title}" [ID: ${result._id}]`);
      } catch (err) {
        console.error(`-> Failed to create product document for "${prod.title}":`, err);
      }
    }
  }
  
  console.log('\n========================================');
  console.log('All imports completed successfully!');
  console.log('========================================');
}

run().catch(console.error);
