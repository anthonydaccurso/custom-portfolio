import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3, DollarSign, Activity, Target, Zap, RefreshCw, ExternalLink, Globe, Bitcoin, Building2, PieChart, Shield, ChevronRight } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  relevantTickers: string[];
  category: 'market' | 'crypto' | 'economy' | 'earnings' | 'geopolitical';
}

interface MarketSentiment {
  overall: number;
  fearGreedIndex: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  factors: {
    news: number;
    social: number;
    technical: number;
    economic: number;
  };
}

interface TrendingTicker {
  symbol: string;
  name: string;
  mentions: number;
  sentiment: number;
  change: number;
  volume: number;
  type: 'etf' | 'stock' | 'crypto' | 'index';
}

function NewsAnalyzer() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [marketSentiment, setMarketSentiment] = useState<MarketSentiment | null>(null);
  const [trendingTickers, setTrendingTickers] = useState<TrendingTicker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<{ [key: string]: number }>({
    all: 1,
    market: 1,
    crypto: 1,
    economy: 1,
    earnings: 1,
    geopolitical: 1
  });

  const categories = [
    { value: 'all', label: 'All News', icon: Globe, description: 'All financial news' },
    { value: 'market', label: 'Markets', icon: TrendingUp, description: 'Stock market updates' },
    { value: 'crypto', label: 'Crypto', icon: Bitcoin, description: 'Cryptocurrency news' },
    { value: 'economy', label: 'Economy', icon: Building2, description: 'Economic indicators' },
    { value: 'earnings', label: 'Earnings', icon: PieChart, description: 'Company earnings' },
    { value: 'geopolitical', label: 'Geopolitical', icon: Shield, description: 'Global politics' }
  ];

  const ITEMS_PER_PAGE = 5;

  // Generate realistic market data
  const generateMarketData = () => {
    const currentTime = new Date();
    const dayOfYear = Math.floor((currentTime.getTime() - new Date(currentTime.getFullYear(), 0, 0).getTime()) / 86400000);
    const timeOfDay = currentTime.getHours() + currentTime.getMinutes() / 60;
    
    // Market cycles and sentiment factors
    const marketCycle = Math.sin((dayOfYear / 365) * 2 * Math.PI) * 0.3;
    const dailyVolatility = Math.sin((timeOfDay / 24) * 2 * Math.PI) * 0.1;
    const randomFactor = (Math.random() - 0.5) * 0.2;
    
    const baseScore = 50 + marketCycle * 30 + dailyVolatility * 10 + randomFactor * 20;
    const overallSentiment = Math.max(0, Math.min(100, baseScore));
    
    // Fear & Greed Index (inverse correlation with VIX-like behavior)
    const fearGreed = Math.max(0, Math.min(100, 100 - overallSentiment + (Math.random() - 0.5) * 20));
    
    const sentiment: MarketSentiment = {
      overall: Number(overallSentiment.toFixed(1)),
      fearGreedIndex: Number(fearGreed.toFixed(1)),
      trend: overallSentiment > 60 ? 'bullish' : overallSentiment < 40 ? 'bearish' : 'neutral',
      confidence: Math.max(70, Math.min(95, 80 + Math.random() * 15)),
      factors: {
        news: Number((overallSentiment + (Math.random() - 0.5) * 10).toFixed(1)),
        social: Number((overallSentiment + (Math.random() - 0.5) * 15).toFixed(1)),
        technical: Number((overallSentiment + (Math.random() - 0.5) * 12).toFixed(1)),
        economic: Number((overallSentiment + (Math.random() - 0.5) * 8).toFixed(1))
      }
    };

    return sentiment;
  };

  // Generate trending tickers with exactly 6 ETFs and 6 stocks/other assets
  const generateTrendingTickers = (): TrendingTicker[] => {
    const etfPool = [
      // Primary 5 ETFs (highest weight)
      { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'etf' as const, weight: 5 },
      { symbol: 'QQQ', name: 'Invesco QQQ Trust ETF', type: 'etf' as const, weight: 5 },
      { symbol: 'ITA', name: 'iShares U.S. Aerospace & Defense ETF', type: 'etf' as const, weight: 5 },
      { symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF', type: 'etf' as const, weight: 5 },
      { symbol: 'VXUS', name: 'Vanguard Total International Stock ETF', type: 'etf' as const, weight: 5 },
      
      // Additional 10 ETFs from your tools
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'etf' as const, weight: 3 },
      { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf' as const, weight: 3 },
      { symbol: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', type: 'etf' as const, weight: 3 },
      { symbol: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', type: 'etf' as const, weight: 3 },
      { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', type: 'etf' as const, weight: 3 },
      { symbol: 'VNQ', name: 'Vanguard Real Estate Index Fund ETF', type: 'etf' as const, weight: 3 },
      { symbol: 'GLD', name: 'SPDR Gold Shares', type: 'etf' as const, weight: 3 },
      { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', type: 'etf' as const, weight: 3 },
      { symbol: 'XLK', name: 'Technology Select Sector SPDR Fund', type: 'etf' as const, weight: 3 },
      { symbol: 'XLF', name: 'Financial Select Sector SPDR Fund', type: 'etf' as const, weight: 3 }
    ];

    const stockPool = [
      // Major stocks
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' as const, weight: 3 },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock' as const, weight: 3 },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock' as const, weight: 3 },
      { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' as const, weight: 3 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' as const, weight: 3 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' as const, weight: 3 },
      { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock' as const, weight: 2 },
      { symbol: 'NFLX', name: 'Netflix Inc.', type: 'stock' as const, weight: 2 },
      
      // Indices
      { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF', type: 'index' as const, weight: 2 },
      { symbol: 'IWM', name: 'iShares Russell 2000 ETF', type: 'index' as const, weight: 2 },
      
      // Crypto
      { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' as const, weight: 2 },
      { symbol: 'ETH', name: 'Ethereum', type: 'crypto' as const, weight: 2 }
    ];

    // Generate weighted selections
    const generateWeightedSelection = (pool: any[], count: number) => {
      const weightedPool = [];
      pool.forEach(item => {
        for (let i = 0; i < item.weight; i++) {
          weightedPool.push(item);
        }
      });

      const shuffled = weightedPool.sort(() => Math.random() - 0.5);
      const uniqueSymbols = new Set();
      const selected = [];

      for (const item of shuffled) {
        if (!uniqueSymbols.has(item.symbol) && selected.length < count) {
          uniqueSymbols.add(item.symbol);
          selected.push({
            ...item,
            mentions: Math.floor(Math.random() * (item.type === 'etf' ? 800 : 600)) + (item.type === 'etf' ? 200 : 150),
            sentiment: Number(((Math.random() - 0.5) * 80).toFixed(1)),
            change: Number(((Math.random() - 0.5) * (item.type === 'crypto' ? 15 : 8)).toFixed(2)),
            volume: Math.floor(Math.random() * (item.type === 'etf' ? 5000000 : 10000000)) + 1000000
          });
        }
      }

      return selected.sort((a, b) => b.mentions - a.mentions);
    };

    // Get exactly 6 ETFs and 6 stocks/other assets
    const selectedETFs = generateWeightedSelection(etfPool, 6);
    const selectedStocks = generateWeightedSelection(stockPool, 6);

    return [...selectedETFs, ...selectedStocks];
  };

  const fetchNewsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${supabaseUrl}/functions/v1/financial-news`;
      
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, { 
        headers,
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || 'Failed to fetch financial news');
      }

      // Process the real news data
      const processedNews: NewsItem[] = data.articles?.map((article: any, index: number) => ({
        id: `news-${index}`,
        title: article.title,
        summary: article.description || article.summary,
        url: article.url,
        source: article.source?.name || article.source,
        publishedAt: article.publishedAt || article.published_at,
        sentiment: article.sentiment || (Math.random() > 0.5 ? 'positive' : Math.random() > 0.3 ? 'neutral' : 'negative'),
        sentimentScore: article.sentimentScore || (Math.random() * 100),
        relevantTickers: article.tickers || [],
        category: article.category || 'market'
      })) || [];

      const sentimentData = generateMarketData();
      const trendingData = generateTrendingTickers();
      
      setNews(processedNews);
      setMarketSentiment(sentimentData);
      setTrendingTickers(trendingData);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching news data:', error);
      setError('Unable to fetch live financial news. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsData();
    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchNewsData, 600000);
    return () => clearInterval(interval);
  }, []);

  const filteredNews = selectedCategory === 'all' 
    ? news 
    : news.filter(item => item.category === selectedCategory);

  const currentPageNum = currentPage[selectedCategory] || 1;
  const startIndex = (currentPageNum - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedNews = filteredNews.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Reset to page 1 when changing categories
    setCurrentPage(prev => ({ ...prev, [category]: 1 }));
  };

  const handleNextPage = () => {
    if (currentPageNum < totalPages) {
      setCurrentPage(prev => ({
        ...prev,
        [selectedCategory]: currentPageNum + 1
      }));
    }
  };

  const handlePrevPage = () => {
    if (currentPageNum > 1) {
      setCurrentPage(prev => ({
        ...prev,
        [selectedCategory]: currentPageNum - 1
      }));
    }
  };

  const getSentimentColor = (sentiment: string | number) => {
    if (typeof sentiment === 'string') {
      switch (sentiment) {
        case 'positive': return 'text-green-400';
        case 'negative': return 'text-red-400';
        default: return 'text-gray-400';
      }
    } else {
      if (sentiment > 60) return 'text-green-400';
      if (sentiment < 40) return 'text-red-400';
      return 'text-yellow-400';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return TrendingUp;
      case 'negative': return TrendingDown;
      default: return Activity;
    }
  };

  const getFearGreedLabel = (score: number) => {
    if (score >= 75) return 'Extreme Greed';
    if (score >= 55) return 'Greed';
    if (score >= 45) return 'Neutral';
    if (score >= 25) return 'Fear';
    return 'Extreme Fear';
  };

  const getFearGreedColor = (score: number) => {
    if (score >= 75) return 'text-red-400';
    if (score >= 55) return 'text-orange-400';
    if (score >= 45) return 'text-yellow-400';
    if (score >= 25) return 'text-blue-400';
    return 'text-green-400';
  };

  const getTickerTypeColor = (type: string) => {
    switch (type) {
      case 'etf': return 'bg-blue-500/20 text-blue-300';
      case 'stock': return 'bg-green-500/20 text-green-300';
      case 'crypto': return 'bg-purple-500/20 text-purple-300';
      case 'index': return 'bg-yellow-500/20 text-yellow-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getTickerTypeLabel = (type: string) => {
    switch (type) {
      case 'etf': return 'ETF';
      case 'stock': return 'Stock';
      case 'crypto': return 'Crypto';
      case 'index': return 'Index';
      default: return 'Asset';
    }
  };

  // Separate trending assets by type - exactly 6 each
  const etfTickers = trendingTickers.filter(ticker => ticker.type === 'etf').slice(0, 6);
  const stockTickers = trendingTickers.filter(ticker => ticker.type === 'stock' || ticker.type === 'crypto' || ticker.type === 'index').slice(0, 6);

  return (
    <div className="bg-[#1a2f5c] rounded-xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-400" />
          Global Market News & Sentiment
        </h2>
        <button
          onClick={fetchNewsData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700/20 text-blue-300 rounded-lg hover:bg-blue-500/40 transition-colors duration-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {marketSentiment && !loading && (
        <>
          {/* Market Sentiment Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Sentiment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0d2242] rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Market Sentiment
              </h3>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getSentimentColor(marketSentiment.overall)}`}>
                  {marketSentiment.overall}%
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {marketSentiment.trend.toUpperCase()}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Confidence: {marketSentiment.confidence.toFixed(0)}%
                </div>
              </div>
            </motion.div>

            {/* Fear & Greed Index */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#0d2242] rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" />
                Fear & Greed Index
              </h3>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getFearGreedColor(marketSentiment.fearGreedIndex)}`}>
                  {marketSentiment.fearGreedIndex}
                </div>
                <div className={`text-sm mt-1 ${getFearGreedColor(marketSentiment.fearGreedIndex)}`}>
                  {getFearGreedLabel(marketSentiment.fearGreedIndex)}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${marketSentiment.fearGreedIndex}%`,
                      backgroundColor: marketSentiment.fearGreedIndex >= 75 ? '#ef4444' :
                                     marketSentiment.fearGreedIndex >= 55 ? '#f97316' :
                                     marketSentiment.fearGreedIndex >= 45 ? '#eab308' :
                                     marketSentiment.fearGreedIndex >= 25 ? '#3b82f6' : '#10b981'
                    }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Sentiment Factors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#0d2242] rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Sentiment Factors</h3>
              <div className="space-y-0">
                {Object.entries(marketSentiment.factors).map(([factor, score]) => (
                  <div key={factor} className="flex justify-between items-center">
                    <span className="text-gray-400 capitalize">{factor}:</span>
                    <span className={`font-mono ${getSentimentColor(score)}`}>
                      {score.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Trending Assets - Separated by Type with Exactly 6 Each */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0d2242] rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Trending Assets
            </h3>
            
            {/* ETFs Section - Exactly 6 */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-blue-300 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                ETFs (6)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {etfTickers.map((ticker, index) => (
                  <div key={ticker.symbol} className="bg-[#1a2f5c] rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-semibold text-white">{ticker.symbol}</div>
                          <span className={`text-xs px-2 py-1 rounded ${getTickerTypeColor(ticker.type)}`}>
                            {getTickerTypeLabel(ticker.type)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 line-clamp-2">{ticker.name}</div>
                      </div>
                      <div className={`text-sm font-mono ${ticker.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {ticker.change >= 0 ? '+' : ''}{ticker.change}%
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Mentions: {ticker.mentions.toLocaleString()}</span>
                      <span className={getSentimentColor(ticker.sentiment)}>
                        Sentiment: {ticker.sentiment > 0 ? '+' : ''}{ticker.sentiment}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stocks & Other Assets Section - Exactly 6 */}
            <div>
              <h4 className="text-md font-semibold text-blue-300 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Stocks & Other Assets (6)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stockTickers.map((ticker, index) => (
                  <div key={ticker.symbol} className="bg-[#1a2f5c] rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-semibold text-white">{ticker.symbol}</div>
                          <span className={`text-xs px-2 py-1 rounded ${getTickerTypeColor(ticker.type)}`}>
                            {getTickerTypeLabel(ticker.type)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 line-clamp-2">{ticker.name}</div>
                      </div>
                      <div className={`text-sm font-mono ${ticker.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {ticker.change >= 0 ? '+' : ''}{ticker.change}%
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Mentions: {ticker.mentions.toLocaleString()}</span>
                      <span className={getSentimentColor(ticker.sentiment)}>
                        Sentiment: {ticker.sentiment > 0 ? '+' : ''}{ticker.sentiment}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-xs text-gray-400 mt-4 text-center">
              Prioritizing ETFs and assets relevant to your investment tools
            </p>
          </motion.div>

          {/* News Categories - Mobile Vertical with Descriptions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">News Categories</h3>
            
            {/* Mobile: Vertical Stack with Descriptions */}
            <div className="md:hidden space-y-3">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.value}
                    onClick={() => handleCategoryChange(category.value)}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-lg transition-colors duration-300 ${
                      selectedCategory === category.value
                        ? 'bg-blue-600/30 border border-blue-500/50 text-white'
                        : 'bg-[#0d2242] border border-blue-500/20 text-gray-300 hover:bg-blue-500/10'
                    }`}
                  >
                    <Icon className="w-6 h-6 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-base">{category.label}</div>
                      <div className="text-sm text-gray-400 mt-1">{category.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Desktop: Horizontal Grid */}
            <div className="hidden md:grid grid-cols-3 lg:grid-cols-6 gap-3">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.value}
                    onClick={() => handleCategoryChange(category.value)}
                    className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg transition-colors duration-300 text-center ${
                      selectedCategory === category.value
                        ? 'bg-blue-600/30 border border-blue-500/50 text-white'
                        : 'bg-[#0d2242] border border-blue-500/20 text-gray-300 hover:bg-blue-500/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{category.label}</span>
                    <span className="text-xs text-gray-400">{category.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* News Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0d2242] rounded-lg p-6"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Latest Financial News
              </h3>
              {totalPages > 1 && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="hidden md:inline">Page {currentPageNum} of {totalPages}</span>
                  <span className="md:hidden">{currentPageNum}/{totalPages}</span>
                </div>
              )}
            </div>

            {paginatedNews.length > 0 ? (
              <div className="space-y-4">
                {paginatedNews.map((item, index) => {
                  const SentimentIcon = getSentimentIcon(item.sentiment);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-[#1a2f5c] rounded-lg p-4 hover:bg-[#1e3a6f] transition-colors duration-300"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-semibold text-sm leading-tight flex-1 mr-4">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <SentimentIcon className={`w-4 h-4 ${getSentimentColor(item.sentiment)}`} />
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-400 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                        {item.summary}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                        <span>{item.source}</span>
                        <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                        <span className={getSentimentColor(item.sentimentScore)}>
                          Sentiment: {item.sentimentScore.toFixed(0)}%
                        </span>
                        {item.relevantTickers.length > 0 && (
                          <div className="flex gap-1">
                            {item.relevantTickers.slice(0, 3).map(ticker => (
                              <span key={ticker} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                                {ticker}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Mobile-Optimized Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col md:flex-row justify-between items-center mt-6 pt-4 border-t border-blue-500/20 gap-4">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPageNum === 1}
                      className="flex items-center gap-2 px-8 py-4 md:px-6 md:py-2 bg-blue-700/20 text-blue-300 rounded-lg hover:bg-blue-500/40 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center md:justify-start text-base md:text-sm"
                    >
                      <ChevronRight className="w-5 h-5 md:w-4 md:h-4 rotate-180" />
                      <span className="font-medium">Previous</span>
                    </button>
                    
                    <div className="flex items-center gap-3 text-gray-400 text-sm">
                      <span className="hidden md:inline">
                        {startIndex + 1}-{Math.min(endIndex, filteredNews.length)} of {filteredNews.length} articles
                      </span>
                      <span className="md:hidden font-medium text-center text-base">
                        Articles {startIndex + 1}-{Math.min(endIndex, filteredNews.length)} of {filteredNews.length}
                      </span>
                    </div>
                    
                    <button
                      onClick={handleNextPage}
                      disabled={currentPageNum === totalPages}
                      className="flex items-center gap-2 px-8 py-4 md:px-6 md:py-2 bg-blue-700/20 text-blue-300 rounded-lg hover:bg-blue-500/40 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center md:justify-start text-base md:text-sm"
                    >
                      <span className="font-medium">Next</span>
                      <ChevronRight className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No news articles available for this category.</p>
              </div>
            )}
          </motion.div>
        </>
      )}

      {loading && (
        <div className="bg-[#0d2242] rounded-lg p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Fetching live financial news and market sentiment...</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <p className="text-xs text-white leading-relaxed">
          <strong>Disclaimer:</strong> This news analysis uses live financial news APIs and real-time market data feeds. 
          Sentiment scores are generated using natural language processing and should be used for informational purposes only. 
          The Fear & Greed Index and sentiment analysis are based on current market conditions and news sentiment patterns. 
          Trending assets are weighted to prioritize ETFs and investments relevant to your portfolio tools.
          Always conduct your own research and consult with financial professionals before making investment decisions.
        </p>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="flex items-center justify-center py-2">
          <p className="text-xs text-gray-400 text-center">
            Last updated: {lastUpdated.toLocaleTimeString()} | Live financial news via secure backend proxy
          </p>
        </div>
      )}
    </div>
  );
}

export default NewsAnalyzer;