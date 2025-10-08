import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calculator, BarChart3, Target, Globe } from 'lucide-react';
import CurrencyCalculator from '../CurrencyCalculator';
import ETFHealthPredictor from '../ETFHealthPredictor';
import ETFGainsPredictor from '../ETFGainsPredictor';
import NewsAnalyzer from '../NewsAnalyzer'; 

const tools = [
    {
    id: 'news-analyzer',
    name: 'News & Sentiment Analyzer',
    icon: Globe,
    component: NewsAnalyzer,
    description: 'Global market sentiment and news'
  },
  {
    id: 'etf-predictor',
    name: 'ETF Health Predictor',
    icon: BarChart3,
    component: ETFHealthPredictor,
    description: 'AI-powered ETF predictions'
  },
  {
    id: 'etf-gains',
    name: 'ETF Gains Predictor',
    icon: Target,
    component: ETFGainsPredictor,
    description: 'Personalized investment projections'
  },
  {
    id: 'currency-arbitrage',
    name: 'Currency Arbitrage',
    icon: TrendingUp,
    component: CurrencyCalculator,
    description: 'Real-time arbitrage opportunities'
  }
];

function LiveToolsSection() {
  const [activeTool, setActiveTool] = useState('news-analyzer');

  const ActiveComponent = tools.find(tool => tool.id === activeTool)?.component;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="bg-[#1a2f5c]/50 rounded-2xl p-6 sm:p-8 md:p-12 w-full mx-auto"
    >
      <motion.h1
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent mb-8"
      >
        Live Tools
      </motion.h1>

      {/* Tool Selector - Optimized for single row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <motion.button
              key={tool.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTool(tool.id)}
              className={`flex flex-col lg:flex-row items-center gap-2 lg:gap-3 px-3 lg:px-6 py-3 lg:py-4 rounded-xl transition-all duration-300 text-center lg:text-left ${
                activeTool === tool.id
                  ? 'bg-blue-600/30 border border-blue-500/50 text-white shadow-lg'
                  : 'bg-[#0d2242] border border-blue-500/20 text-gray-300 hover:bg-blue-500/10 hover:border-blue-500/30'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${activeTool === tool.id ? 'text-blue-400' : 'text-gray-400'}`} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-m lg:text-base truncate">{tool.name}</div>
                <div className="text-[12px] text-gray-400 block truncate">{tool.description}</div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Active Tool Component */}
      <motion.div
        key={activeTool}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {ActiveComponent && <ActiveComponent />}
      </motion.div>
    </motion.div>
  );
}

export default LiveToolsSection;