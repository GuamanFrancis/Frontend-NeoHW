import axios from 'axios';

async function test() {
  const query = 'AMD Ryzen 5 5600X box png';
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;

  try {
    console.log(`Searching Bing Images for: "${query}"`);
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });

    const html = res.data;
    // Try matching both raw and html entities encoded formats
    const regex1 = /"murl":"(http[^"]+)"/g;
    const regex2 = /murl&quot;:&quot;(http[^&]+)&quot;/g;
    
    let matches = [];
    let match;
    
    while ((match = regex1.exec(html)) !== null) {
      matches.push(match[1]);
    }
    
    if (matches.length === 0) {
      while ((match = regex2.exec(html)) !== null) {
        matches.push(match[1]);
      }
    }

    console.log(`Found ${matches.length} image URLs:`);
    matches.slice(0, 8).forEach((imgUrl, idx) => {
      console.log(`${idx + 1}. ${imgUrl}`);
    });
  } catch (err) {
    console.error('Error searching Bing:', err.message);
  }
}

test();
