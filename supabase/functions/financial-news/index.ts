const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface NewsSource {
  name: string;
  url: string;
  category: string;
}

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  category: 'market' | 'crypto' | 'economy' | 'earnings' | 'geopolitical';
  tickers: string[];
}

// Real news sources for each category
const NEWS_SOURCES: NewsSource[] = [
  // Market News
  { name: 'MarketWatch', url: 'https://www.marketwatch.com/rss/topstories', category: 'market' },
  { name: 'Yahoo Finance', url: 'https://feeds.finance.yahoo.com/rss/2.0/headline', category: 'market' },
  { name: 'Seeking Alpha', url: 'https://seekingalpha.com/market_currents.xml', category: 'market' },
  { name: 'The Motley Fool', url: 'https://www.fool.com/feeds/index.aspx', category: 'market' },
  { name: 'Benzinga', url: 'https://www.benzinga.com/feed', category: 'market' },
  
  // Crypto News
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'crypto' },
  { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss', category: 'crypto' },
  { name: 'CryptoSlate', url: 'https://cryptoslate.com/feed/', category: 'crypto' },
  { name: 'Decrypt', url: 'https://decrypt.co/feed', category: 'crypto' },
  { name: 'The Block', url: 'https://www.theblockcrypto.com/rss.xml', category: 'crypto' },
  
  // Economy News
  { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews', category: 'economy' },
  { name: 'Bloomberg Economics', url: 'https://feeds.bloomberg.com/economics/news.rss', category: 'economy' },
  { name: 'Financial Times', url: 'https://www.ft.com/rss/home/us', category: 'economy' },
  { name: 'Wall Street Journal', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', category: 'economy' },
  { name: 'CNBC Economics', url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html', category: 'economy' },
  
  // Earnings News
  { name: 'Earnings Whispers', url: 'https://www.earningswhispers.com/rss/earnings', category: 'earnings' },
  { name: 'Zacks Earnings', url: 'https://www.zacks.com/rss/earnings.xml', category: 'earnings' },
  { name: 'StreetInsider Earnings', url: 'https://www.streetinsider.com/rss_earnings.php', category: 'earnings' },
  { name: 'TheStreet Earnings', url: 'https://www.thestreet.com/rss/earnings', category: 'earnings' },
  { name: 'Investor\'s Business Daily', url: 'https://www.investors.com/feed/', category: 'earnings' },
  
  // Geopolitical News
  { name: 'Reuters World', url: 'https://feeds.reuters.com/Reuters/worldNews', category: 'geopolitical' },
  { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', category: 'geopolitical' },
  { name: 'Associated Press', url: 'https://feeds.apnews.com/rss/apf-topnews', category: 'geopolitical' },
  { name: 'Foreign Affairs', url: 'https://www.foreignaffairs.com/rss.xml', category: 'geopolitical' },
  { name: 'Politico', url: 'https://www.politico.com/rss/politicopicks.xml', category: 'geopolitical' }
];

// Create fetch with timeout
function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId);
  });
}

// Parse RSS feed
async function parseRSSFeed(url: string, category: string, sourceName: string): Promise<NewsArticle[]> {
  try {
    console.log(`Fetching RSS feed from ${sourceName}: ${url}`);
    
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      }
    }, 8000);

    if (!response.ok) {
      console.error(`RSS fetch failed for ${sourceName}: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    
    // Simple XML parsing for RSS feeds
    const articles: NewsArticle[] = [];
    const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
    
    for (const itemXml of itemMatches.slice(0, 6)) { // Increased to 6 articles per source for larger sample
      try {
        const title = extractXMLContent(itemXml, 'title');
        const description = extractXMLContent(itemXml, 'description') || extractXMLContent(itemXml, 'summary');
        const link = extractXMLContent(itemXml, 'link') || extractXMLContent(itemXml, 'guid');
        const pubDate = extractXMLContent(itemXml, 'pubDate') || extractXMLContent(itemXml, 'published');
        
        if (title && link) {
          // Generate sentiment analysis
          const sentiment = analyzeSentiment(title + ' ' + (description || ''));
          
          // Extract potential tickers from title and description
          const tickers = extractTickers(title + ' ' + (description || ''));
          
          articles.push({
            title: cleanText(title),
            description: cleanText(description || title),
            url: link,
            source: sourceName,
            publishedAt: pubDate || new Date().toISOString(),
            sentiment: sentiment.label,
            sentimentScore: sentiment.score,
            category: category as any,
            tickers: tickers
          });
        }
      } catch (itemError) {
        console.warn(`Error parsing RSS item from ${sourceName}:`, itemError);
      }
    }
    
    console.log(`Successfully parsed ${articles.length} articles from ${sourceName}`);
    return articles;
    
  } catch (error) {
    console.error(`Error fetching RSS from ${sourceName}:`, error);
    return [];
  }
}

// Extract content from XML tags
function extractXMLContent(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';
}

// Clean text content
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Simple sentiment analysis
function analyzeSentiment(text: string): { label: 'positive' | 'negative' | 'neutral', score: number } {
  const positiveWords = ['gain', 'rise', 'up', 'bull', 'growth', 'profit', 'surge', 'rally', 'boost', 'strong', 'beat', 'exceed', 'outperform'];
  const negativeWords = ['fall', 'drop', 'down', 'bear', 'loss', 'decline', 'crash', 'plunge', 'weak', 'miss', 'underperform', 'concern'];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
    if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
  });
  
  const totalSentimentWords = positiveCount + negativeCount;
  
  if (totalSentimentWords === 0) {
    return { label: 'neutral', score: 50 };
  }
  
  const positiveRatio = positiveCount / totalSentimentWords;
  const score = positiveRatio * 100;
  
  if (score > 60) return { label: 'positive', score };
  if (score < 40) return { label: 'negative', score };
  return { label: 'neutral', score };
}

// Extract ticker symbols from text
function extractTickers(text: string): string[] {
  const tickerRegex = /\b[A-Z]{1,5}\b/g;
  const matches = text.match(tickerRegex) || [];
  
  // Filter out common words that aren't tickers
  const commonWords = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'HAD', 'BUT', 'WHAT', 'SO', 'UP', 'OUT', 'IF', 'ABOUT', 'WHO', 'GET', 'WHICH', 'GO', 'ME', 'WHEN', 'MAKE', 'CAN', 'LIKE', 'TIME', 'NO', 'JUST', 'HIM', 'KNOW', 'TAKE', 'PEOPLE', 'INTO', 'YEAR', 'YOUR', 'GOOD', 'SOME', 'COULD', 'THEM', 'SEE', 'OTHER', 'THAN', 'THEN', 'NOW', 'LOOK', 'ONLY', 'COME', 'ITS', 'OVER', 'THINK', 'ALSO', 'BACK', 'AFTER', 'USE', 'TWO', 'HOW', 'OUR', 'WORK', 'FIRST', 'WELL', 'WAY', 'EVEN', 'NEW', 'WANT', 'BECAUSE', 'ANY', 'THESE', 'GIVE', 'DAY', 'MOST', 'US'];
  
  return matches
    .filter(ticker => !commonWords.includes(ticker))
    .filter(ticker => ticker.length >= 2 && ticker.length <= 5)
    .slice(0, 3); // Limit to 3 tickers per article
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Fetching financial news from multiple sources...');
    
    // Fetch news from all sources in parallel
    const newsPromises = NEWS_SOURCES.map(source => 
      parseRSSFeed(source.url, source.category, source.name)
    );
    
    const newsResults = await Promise.allSettled(newsPromises);
    
    // Combine all successful results
    const allArticles: NewsArticle[] = [];
    newsResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      } else {
        console.warn(`Failed to fetch from ${NEWS_SOURCES[index].name}:`, result.reason);
      }
    });
    
    // Sort by publication date (newest first)
    allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    
    // Limit total articles to 150 for better sample size while maintaining performance
    const limitedArticles = allArticles.slice(0, 150);
    
    console.log(`Successfully fetched ${limitedArticles.length} articles from ${NEWS_SOURCES.length} sources`);
    
    return new Response(JSON.stringify({
      articles: limitedArticles,
      totalSources: NEWS_SOURCES.length,
      successfulSources: newsResults.filter(r => r.status === 'fulfilled').length,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    })
    
  } catch (error) {
    console.error('Financial news function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch financial news',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})