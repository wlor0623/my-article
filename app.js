const axios = require('axios');
const fs = require('fs');

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function fetchAllArticles() {
  const pageSize = 100;
  let allArticles = [];
  let currentPage = 1;
  let total = null;

  while (total === null || allArticles.length < total) {
    const config = {
      method: 'GET',
      url: `https://blog.csdn.net/community/home-api/v1/get-business-list?page=${currentPage}&size=${pageSize}&businessType=blog&orderby=&noMore=false&year=&month=&username=weixin_41961749`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7,ko;q=0.6',
        'Cache-Control': 'no-cache',
        'DNT': '1',
        'Pragma': 'no-cache',
        'Referer': 'https://blog.csdn.net/weixin_41961749?type=blog'
      }
    };

    try {
      console.log(`Fetching page ${currentPage}...`);
      const response = await axios.request(config);
      const { list, total: totalCount } = response.data.data;
      
      if (total === null) {
        total = totalCount;
        console.log(`Total articles: ${total}`);
      }

      allArticles = allArticles.concat(list);
      console.log(`Fetched ${allArticles.length}/${total} articles`);

      if (list.length < pageSize || allArticles.length >= total) {
        break;
      }

      currentPage++;
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error fetching page ${currentPage}:`, error.message);
      break;
    }
  }

  return allArticles;
}

async function generateReadme() {
  try {
    const articles = await fetchAllArticles();
    let markdownContent = '# CSDN Blog Articles\n\n![](https://profile-avatar.csdnimg.cn/5c957b67fd2e4b71aabf2a7f7660c59f_weixin_41961749.jpg!1)\n\n CSDN主页:https://blog.csdn.net/weixin_41961749\n\n';
    
    articles.forEach(article => {
      markdownContent += `## ${escapeHtml(article.title)}\n\n`;
      markdownContent += `- **Description**: ${escapeHtml(article.description) || 'No description'}\n`;
      markdownContent += `- **URL**: ${article.url}\n`;
      markdownContent += `- **Post Time**: ${article.postTime}\n`;
      if (article.tags && article.tags.length > 0) {
        markdownContent += `- **Tags**: ${article.tags.map(tag => escapeHtml(tag)).join(', ')}\n`;
      }
      markdownContent += '\n---\n\n';
    });

    fs.writeFileSync('README.md', markdownContent, 'utf8');
    console.log('README.md has been created successfully!');
  } catch (error) {
    console.error('Error generating README:', error);
  }
}

generateReadme();