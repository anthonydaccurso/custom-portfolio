import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, RefreshCw, Calculator, DollarSign, Target, ChevronDown, Crosshair, Activity, PiggyBank } from 'lucide-react';

interface ExchangeRates { [key: string]: number; }
interface ArbitrageResult { initialAmount: number; afterFirst: number; afterSecond: number; finalUSD: number; profit: number; profitPercentage: number; path: string[]; }
interface TradingThresholds { firstThreshold: number; secondThreshold: number; thirdThreshold: number; }
interface PredictionModel { dailyOpportunityRate: number; monthlyOpportunities: number; yearlyOpportunities: number; averageHoldTime: number; volatilityFactor: number; }
interface CurrencyOption { code: string; name: string; symbol: string; }
interface APYRates { [key: string]: number; }
interface RealTimeAnalytics { marketEfficiency: number; spreadAnalysis: number; liquidityScore: number; riskFactor: number; lastUpdate: Date; }

const currencyOptions: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' }, { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' }, { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' }, { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }, { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' }, { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' }, { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' }, { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' }, { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' }, { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' }, { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' }
];

// WISE APY
const wiseAPYRates: APYRates = { USD: 3.92, GBP: 2.62, EUR: 1.00 };

// (kept) volatility/opportunity maps used only for projections, not for rate fetching
const currencyVolatilityMap: { [key: string]: number } = {
  USD: 0.008, MXN: 0.025, GBP: 0.012, EUR: 0.010, JPY: 0.014, CAD: 0.011, AUD: 0.018, CHF: 0.009,
  CNY: 0.008, INR: 0.022, BRL: 0.035, KRW: 0.028, SGD: 0.008, HKD: 0.003, NOK: 0.016, SEK: 0.015,
  DKK: 0.010, PLN: 0.020, CZK: 0.018, HUF: 0.025
};

const currencyPairOpportunityRates: { [key: string]: number } = {
  'USD-MXN': 0.12, 'USD-GBP': 0.08, 'USD-EUR': 0.07, 'USD-JPY': 0.09, 'USD-CAD': 0.06, 'USD-AUD': 0.11,
  'USD-CHF': 0.05, 'USD-CNY': 0.04, 'USD-INR': 0.15, 'USD-BRL': 0.18, 'USD-KRW': 0.14, 'USD-SGD': 0.04,
  'USD-HKD': 0.02, 'USD-NOK': 0.10, 'USD-SEK': 0.09, 'USD-DKK': 0.06, 'USD-PLN': 0.13, 'USD-CZK': 0.12,
  'USD-HUF': 0.16, 'MXN-GBP': 0.14, 'MXN-EUR': 0.13, 'GBP-EUR': 0.08, 'EUR-JPY': 0.10, 'GBP-JPY': 0.11,
  'AUD-JPY': 0.13, 'CAD-JPY': 0.10, 'CHF-JPY': 0.09, 'JPY-EUR': 0.10, 'JPY-GBP': 0.11, 'EUR-GBP': 0.08,
  'BRL-USD': 0.18, 'INR-USD': 0.15, 'KRW-USD': 0.14, 'PLN-USD': 0.13, 'CZK-USD': 0.12, 'HUF-USD': 0.16,
  'NOK-USD': 0.10, 'SEK-USD': 0.09, 'DKK-USD': 0.06, 'SGD-USD': 0.04, 'HKD-USD': 0.02, 'CNY-USD': 0.04,
  'CHF-USD': 0.05, 'AUD-USD': 0.11, 'CAD-USD': 0.06, 'JPY-USD': 0.09, 'EUR-USD': 0.07, 'GBP-USD': 0.08,
  'MXN-USD': 0.12
};

/* ---------------- REAL-TIME ONLY: multi-provider fetch ---------------- */
const withTimeout = <T,>(p: Promise<T>, ms = 6000) =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(v => { clearTimeout(t); resolve(v); }).catch(e => { clearTimeout(t); reject(e); });
  });

const toUSDBased = (base: string, rates: Record<string, number>): ExchangeRates => {
  if (base === 'USD') return rates;
  // convert base->X to USD->X using USD rate
  if (!rates['USD']) return {};
  const out: ExchangeRates = {};
  Object.keys(rates).forEach(k => {
    if (k === 'USD') return;
    out[k] = rates[k] / rates['USD']; // (base->k) / (base->USD) = USD->k
  });
  return out;
};

const fetchFrankfurter = async (): Promise<ExchangeRates> => {
  const r = await withTimeout(fetch('https://api.frankfurter.app/latest?from=USD', { cache: 'no-store' }));
  const d = await r.json(); // {base, rates}
  return toUSDBased(d.base, d.rates);
};
const fetchExchangerateHost = async (): Promise<ExchangeRates> => {
  const r = await withTimeout(fetch('https://api.exchangerate.host/latest?base=USD', { cache: 'no-store' }));
  const d = await r.json();
  return toUSDBased(d.base, d.rates);
};
const fetchOpenER = async (): Promise<ExchangeRates> => {
  const r = await withTimeout(fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' }));
  const d = await r.json(); // { base_code, rates }
  return toUSDBased(d.base_code || 'USD', d.rates);
};

const fetchers: Array<() => Promise<ExchangeRates>> = [
  fetchFrankfurter,
  fetchExchangerateHost,
  fetchOpenER,
];

const medianMerge = (samples: ExchangeRates[]): ExchangeRates => {
  const keys = new Set<string>();
  samples.forEach(s => Object.keys(s).forEach(k => keys.add(k)));
  const out: ExchangeRates = {};
  keys.forEach(k => {
    const arr = samples.map(s => s[k]).filter(v => typeof v === 'number' && isFinite(v));
    if (!arr.length) return;
    arr.sort((a, b) => a - b);
    const mid = Math.floor(arr.length / 2);
    out[k] = arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  });
  return out;
};
/* --------------------------------------------------------------------- */

function CurrencyCalculator() {
  const [allRates, setAllRates] = useState<ExchangeRates>({});
  const [selectedCurrencies, setSelectedCurrencies] = useState({
    from1: 'USD', to1: 'MXN', from2: 'MXN', to2: 'GBP', from3: 'GBP', to3: 'USD'
  });
  const [selectedAPYCurrency, setSelectedAPYCurrency] = useState<string>('USD');
  const [initialAmount, setInitialAmount] = useState<number>(1000);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [arbitrageResult, setArbitrageResult] = useState<ArbitrageResult | null>(null);
  const [thresholdResult, setThresholdResult] = useState<ArbitrageResult | null>(null);
  const [thresholds, setThresholds] = useState<TradingThresholds>({ firstThreshold: 18.95, secondThreshold: 25.50, thirdThreshold: 1.38 });
  const [predictionModel, setPredictionModel] = useState<PredictionModel>({ dailyOpportunityRate: 0.12, monthlyOpportunities: 1.4, yearlyOpportunities: 16.8, averageHoldTime: 2.8, volatilityFactor: 1.0 });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [marketTrend, setMarketTrend] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  const [volatilityIndex, setVolatilityIndex] = useState<number>(0.5);
  const [realTimeAnalytics, setRealTimeAnalytics] = useState<RealTimeAnalytics>({ marketEfficiency: 94.2, spreadAnalysis: 0.035, liquidityScore: 89, riskFactor: 0.42, lastUpdate: new Date() });

  const getValueColor = (value: number): string => {
    if (value > 0.01) return 'text-green-400';
    if (value < -0.01) return 'text-red-400';
    return 'text-gray-400';
  };

  const fetchExchangeRates = async () => {
    setLoading(true);
    try {
      const settled = await Promise.allSettled(fetchers.map(f => f()));
      const good = settled.filter((s): s is PromiseFulfilledResult<ExchangeRates> => s.status === 'fulfilled').map(s => s.value);
      if (good.length === 0) throw new Error('All live providers failed');
      const consolidated = medianMerge(good);

      // keep only currencies you display
      const keep = ['MXN','GBP','EUR','JPY','CAD','AUD','CHF','CNY','INR','BRL','KRW','SGD','HKD','NOK','SEK','DKK','PLN','CZK','HUF'];
      const filtered: ExchangeRates = {};
      keep.forEach(k => { if (typeof consolidated[k] === 'number') filtered[k] = consolidated[k]; });

      setAllRates(filtered);
      setLastUpdated(new Date());

      // recompute downstream
      const nowArb = calculateArbitrageImmediate(initialAmount, filtered);
      setArbitrageResult(nowArb);
      const nowThr = calculateThresholdArbitrageImmediate(initialAmount, thresholds);
      setThresholdResult(nowThr);
      updatePredictionModel(filtered);
      updateRealTimeAnalytics();
      calculateMarketMetrics(filtered);
    } catch (e) {
      console.error(e);
      alert('Live rates unavailable from all providers. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  // -------- calculations (unchanged from your version) ----------
  const getExchangeRate = (from: string, to: string, rates: ExchangeRates): number => {
    if (from === 'USD') return rates[to] || 1;
    if (to === 'USD') return 1 / (rates[from] || 1);
    return (rates[to] || 1) / (rates[from] || 1);
  };
  const getCurrentRatesFromData = (rates: ExchangeRates) => {
    const firstRate = getExchangeRate(selectedCurrencies.from1, selectedCurrencies.to1, rates);
    const secondRate = (selectedCurrencies.to3 === 'None' || selectedCurrencies.from3 === 'None') ? 1 : getExchangeRate(selectedCurrencies.from2, selectedCurrencies.to2, rates);
    const thirdRate = (selectedCurrencies.to3 === 'None' || selectedCurrencies.from3 === 'None')
      ? getExchangeRate(selectedCurrencies.from3 === 'None' ? selectedCurrencies.to1 : selectedCurrencies.from3, 'USD', rates)
      : getExchangeRate(selectedCurrencies.from3, selectedCurrencies.to3, rates);
    return { firstRate, secondRate, thirdRate };
  };
  const getCurrentRates = () => getCurrentRatesFromData(allRates);

  const calculateArbitrageImmediate = (amount: number, rates: ExchangeRates): ArbitrageResult => {
    const { firstRate, secondRate, thirdRate } = getCurrentRatesFromData(rates);
    const afterFirst = amount * firstRate;
    const afterSecond = (selectedCurrencies.to3 === 'None' || selectedCurrencies.from3 === 'None') ? afterFirst : afterFirst * secondRate;
    const finalUSD = (selectedCurrencies.to3 === 'None' || selectedCurrencies.from3 === 'None') ? afterSecond / firstRate : afterSecond * thirdRate;
    const profit = finalUSD - amount;
    const profitPercentage = (profit / amount) * 100;
    const path = (selectedCurrencies.to3 === 'None' || selectedCurrencies.from3 === 'None')
      ? [selectedCurrencies.from1, selectedCurrencies.to1, selectedCurrencies.from1]
      : [selectedCurrencies.from1, selectedCurrencies.to1, selectedCurrencies.to2, selectedCurrencies.to3];
    return { initialAmount: amount, afterFirst, afterSecond, finalUSD, profit, profitPercentage, path };
  };
  const calculateThresholdArbitrageImmediate = (amount: number, t: TradingThresholds): ArbitrageResult => {
    const afterFirst = amount * t.firstThreshold;
    const afterSecond = (selectedCurrencies.to3 === 'None' || selectedCurrencies.from3 === 'None') ? afterFirst : afterFirst / t.secondThreshold;
    const finalUSD = (selectedCurrencies.to3 === 'None' || selectedCurrencies.from3 === 'None') ? afterSecond / t.firstThreshold : afterSecond * t.thirdThreshold;
    const profit = finalUSD - amount;
    const profitPercentage = (profit / amount) * 100;
    const path = (selectedCurrencies.to3 === 'None' || selectedCurrencies.from3 === 'None')
      ? [selectedCurrencies.from1, selectedCurrencies.to1, selectedCurrencies.from1]
      : [selectedCurrencies.from1, selectedCurrencies.to1, selectedCurrencies.to2, selectedCurrencies.to3];
    return { initialAmount: amount, afterFirst, afterSecond, finalUSD, profit, profitPercentage, path };
  };

  const getCurrencyPairKey = (from: string, to: string): string => {
    const p1 = `${from}-${to}`, p2 = `${to}-${from}`;
    if (currencyPairOpportunityRates[p1]) return p1;
    if (currencyPairOpportunityRates[p2]) return p2;
    return 'USD-EUR';
  };
  const calculateCombinedVolatility = (): number => {
    const cs = [selectedCurrencies.from1, selectedCurrencies.to1];
    if (selectedCurrencies.to3 !== 'None' && selectedCurrencies.from3 !== 'None') cs.push(selectedCurrencies.to2, selectedCurrencies.to3);
    const uniq = [...new Set(cs)];
    const total = uniq.reduce((s, c) => s + (currencyVolatilityMap[c] || 0.015), 0);
    return total / uniq.length;
  };
  const calculateCombinedOpportunityRate = (): number => {
    const twoWay = selectedCurrencies.to3 === 'None' || selectedCurrencies.from3 === 'None';
    if (twoWay) {
      const key = getCurrencyPairKey(selectedCurrencies.from1, selectedCurrencies.to1);
      return currencyPairOpportunityRates[key] || 0.10;
    }
    const r1 = currencyPairOpportunityRates[getCurrencyPairKey(selectedCurrencies.from1, selectedCurrencies.to1)] || 0.08;
    const r2 = currencyPairOpportunityRates[getCurrencyPairKey(selectedCurrencies.from2, selectedCurrencies.to2)] || 0.08;
    const r3 = currencyPairOpportunityRates[getCurrencyPairKey(selectedCurrencies.from3, selectedCurrencies.to3)] || 0.08;
    return (r1 + r2 + r3) / 3 * 0.75;
  };
  const updatePredictionModel = (rates: ExchangeRates) => {
    const vol = calculateCombinedVolatility();
    const base = calculateCombinedOpportunityRate();
    const marketMult = marketTrend === 'bullish' ? 1.2 : marketTrend === 'bearish' ? 0.8 : 1.0;
    const volMult = (1 + vol * 10) * marketMult;
    setPredictionModel({
      dailyOpportunityRate: base * volMult,
      monthlyOpportunities: 1.4,
      yearlyOpportunities: 16.8,
      averageHoldTime: (selectedCurrencies.to3 === 'None' || selectedCurrencies.from3 === 'None') ? 1.5 : 2.8,
      volatilityFactor: volMult
    });
  };
  const calculateRealisticGains = (dailyProfit: number, model: PredictionModel) => {
    const base = calculateCombinedOpportunityRate();
    const vol = calculateCombinedVolatility();
    const marketMult = marketTrend === 'bullish' ? 1.2 : marketTrend === 'bearish' ? 0.8 : 1.0;
    const daily = Math.abs(dailyProfit) * base * marketMult * (1 + vol * 5);
    return { daily, monthly: daily * model.monthlyOpportunities, yearly: daily * model.yearlyOpportunities };
  };
  const calculateArbitrage = (amount: number, rates: ExchangeRates) => setArbitrageResult(calculateArbitrageImmediate(amount, rates));
  const calculateThresholdArbitrage = (amount: number, t: TradingThresholds) => setThresholdResult(calculateThresholdArbitrageImmediate(amount, t));
  const calculateAPYGains = (amount: number, currency: string) => ({ yearlyGain: (amount * (wiseAPYRates[currency] || 0)) / 100, apyRate: wiseAPYRates[currency] || 0 });

  const handleRefresh = () => { fetchExchangeRates(); };

  const handleCurrencyChange = (position: string, currency: string) => {
    setSelectedCurrencies(prev => {
      const n = { ...prev, [position]: currency } as any;
      if (position === 'to1') n.from2 = currency;
      else if (position === 'to2') n.from3 = currency;
      return n;
    });
    setOpenDropdown(null);
  };

  const updateRealTimeAnalytics = () => {
    setRealTimeAnalytics(prev => {
      const efficiencyChange = (Math.random() - 0.5) * 0.5;
      const spreadChange = (Math.random() - 0.5) * 0.002;
      const liquidityChange = (Math.random() - 0.5) * 1;
      const riskChange = (Math.random() - 0.5) * 0.02;
      return {
        marketEfficiency: Math.max(92, Math.min(98, prev.marketEfficiency + efficiencyChange)),
        spreadAnalysis: Math.max(0.02, Math.min(0.05, prev.spreadAnalysis + spreadChange)),
        liquidityScore: Math.max(85, Math.min(95, prev.liquidityScore + liquidityChange)),
        riskFactor: Math.max(0.3, Math.min(0.6, prev.riskFactor + riskChange)),
        lastUpdate: new Date()
      };
    });
  };

  const calculateMarketMetrics = (rates: ExchangeRates) => {
    const majors = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
    let totalDev = 0, trend = 0;
    const ranges: Record<string, [number, number]> = {
      EUR: [0.85, 0.95], GBP: [0.70, 0.80], JPY: [140, 160], CAD: [1.25, 1.40], AUD: [1.45, 1.60]
    };
    majors.forEach(c => {
      const r = rates[c], range = ranges[c];
      if (!r || !range) return;
      const mid = (range[0] + range[1]) / 2;
      totalDev += Math.abs(r - mid) / mid;
      trend += r > mid ? 0.1 : -0.1;
    });
    const avgVol = totalDev / majors.length;
    setVolatilityIndex(Math.min(1, avgVol * 10));
    setMarketTrend(trend > 0.2 ? 'bullish' : trend < -0.2 ? 'bearish' : 'neutral');
  };

  const checkThresholdOpportunity = () => {
    if (!allRates || Object.keys(allRates).length === 0) return null;
    const { firstRate, secondRate, thirdRate } = getCurrentRates();
    const firstReady = firstRate >= thresholds.firstThreshold;
    const secondReady = (selectedCurrencies.to3 === 'None' || selectedCurrencies.from3 === 'None') || (1 / secondRate) >= thresholds.secondThreshold;
    const thirdReady = (selectedCurrencies.to3 === 'None' || selectedCurrencies.from3 === 'None') || thirdRate >= thresholds.thirdThreshold;
    return { firstReady, secondReady, thirdReady, allReady: firstReady && secondReady && thirdReady };
  };

  useEffect(() => {
    fetchExchangeRates();
    const id = setInterval(() => updateRealTimeAnalytics(), 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Object.keys(allRates).length) {
      calculateArbitrage(initialAmount, allRates);
      updatePredictionModel(allRates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAmount, allRates, selectedCurrencies]);

  useEffect(() => { calculateThresholdArbitrage(initialAmount, thresholds); }, [initialAmount, thresholds, selectedCurrencies]);

  useEffect(() => {
    const close = () => setOpenDropdown(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const opportunity = checkThresholdOpportunity();
  const currentGains = arbitrageResult ? calculateRealisticGains(arbitrageResult.profit, predictionModel) : null;
  const thresholdGains = thresholdResult ? calculateRealisticGains(thresholdResult.profit, predictionModel) : null;
  const { firstRate, secondRate, thirdRate } = getCurrentRates();
  const selectedAPY = calculateAPYGains(initialAmount, selectedAPYCurrency);

  const CurrencyDropdown = ({ value, onChange, position, includeNone = false, label }:{
    value: string; onChange: (currency: string) => void; position: string; includeNone?: boolean; label: string;
  }) => {
    const isOpen = openDropdown === position;
    const options = includeNone ? [{ code: 'None', name: '2-way arbitrage', symbol: '' }, ...currencyOptions] : currencyOptions;
    const selectedOption = options.find(opt => opt.code === value);
    return (
      <div className="relative flex-1">
        <label htmlFor={`currency-${position}`} className="block text-xs text-gray-400 mb-1">{label}</label>
        <button
          id={`currency-${position}`}
          onClick={(e) => { e.stopPropagation(); setOpenDropdown(isOpen ? null : position); }}
          className="w-full px-3 py-2 bg-[#0d2242] text-white rounded text-sm border border-blue-500/30 focus:border-blue-400 focus:outline-none flex items-center justify-between"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={`Select ${label} currency`}
        >
          <span>{selectedOption?.code || value}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#0d2242] border border-blue-500/30 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto" role="listbox" aria-label={`${label} currency options`}>
            {options.map((option) => (
              <button
                key={option.code}
                onClick={(e) => { e.stopPropagation(); onChange(option.code); }}
                className="w-full px-3 py-2 text-left text-white hover:bg-blue-500/20 transition-colors text-sm"
                role="option"
                aria-selected={value === option.code}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{option.code}</span>
                  <span className="text-gray-400 text-xs ml-2">{(wiseAPYRates as any)[option.code] ? `${(wiseAPYRates as any)[option.code]}% APY` : ''}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const MarketIndicator = () => (
    <div className="bg-[#0d2242] rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-300">Market Conditions</span>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          marketTrend === 'bullish' ? 'bg-green-900/30 text-green-400' :
          marketTrend === 'bearish' ? 'bg-red-900/30 text-red-400' :
          'bg-yellow-900/30 text-yellow-400'
        }`}>
          {marketTrend.toUpperCase()}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Volatility Index:</span>
          <span className="text-blue-300">{(volatilityIndex * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div className="bg-blue-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${volatilityIndex * 100}%` }} />
        </div>
      </div>
    </div>
  );

  const TradingPath = ({ path }: { path: string[] }) => (
    <div className="bg-[#0d2242] rounded-lg p-3 mb-3">
      <h3 className="text-sm font-medium text-gray-300 mb-2">Trading Path</h3>
      <div className="flex items-center justify-center space-x-2 text-xs">
        {path.map((currency, index) => (
          <React.Fragment key={index}>
            <span className={`px-2 py-1 rounded ${
              index === 0 ? 'bg-blue-900/30 text-blue-300' :
              index === path.length - 1 ? 'bg-green-900/30 text-green-300' :
              'bg-gray-700/30 text-gray-300'
            }`}>
              {currency}
            </span>
            {index < path.length - 1 && (
              <span className="text-gray-500">→</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const WISEAPYBox = () => (
    <div className="bg-[#0d2242] rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <PiggyBank className="w-4 h-4 text-blue-400" />
        WISE App Savings APY
      </h3>
      <div className="relative">
        <label htmlFor="apy-currency-select" className="block text-xs text-gray-400 mb-1">Select Currency</label>
        <button
          id="apy-currency-select"
          onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'apy-currency' ? null : 'apy-currency'); }}
          className="w-full px-3 py-2 bg-[#1a2f5c] text-white rounded text-sm border border-blue-500/30 focus:border-blue-400 focus:outline-none flex items-center justify-between"
          aria-expanded={openDropdown === 'apy-currency'}
          aria-haspopup="listbox"
          aria-label="Select APY currency"
        >
          <span>{selectedAPYCurrency}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'apy-currency' ? 'rotate-180' : ''}`} />
        </button>
        {openDropdown === 'apy-currency' && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a2f5c] border border-blue-500/30 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto" role="listbox" aria-label="APY currency options">
            {currencyOptions.map((option) => (
              <button
                key={option.code}
                onClick={(e) => { e.stopPropagation(); setSelectedAPYCurrency(option.code); setOpenDropdown(null); }}
                className="w-full px-3 py-2 text-left text-white hover:bg-blue-500/20 transition-colors text-sm"
                role="option"
                aria-selected={selectedAPYCurrency === option.code}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{option.code}</span>
                  <span className="text-gray-400 text-xs ml-2">
                    {wiseAPYRates[option.code] ? `${wiseAPYRates[option.code]}% APY` : '0% APY'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Balance:</span>
          <span className="text-white font-mono">${initialAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">APY Rate:</span>
          <span className={getValueColor(selectedAPY.apyRate)}>
            {selectedAPY.apyRate.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Yearly Gain:</span>
          <span className={getValueColor(selectedAPY.yearlyGain)}>
            ${selectedAPY.yearlyGain.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );

  const RealTimeAnalyticsBox = () => (
    <div className="bg-[#0d2242] rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Activity className="w-4 h-4 text-blue-400" />
        Real-Time Analytics
      </h3>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between"><span className="text-gray-400">Market Efficiency:</span><span className="text-blue-300 font-mono">{realTimeAnalytics.marketEfficiency.toFixed(1)}%</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Spread Analysis:</span><span className="text-blue-300 font-mono">{(realTimeAnalytics.spreadAnalysis * 100).toFixed(2)}%</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Liquidity Score:</span><span className="text-blue-300 font-mono">{realTimeAnalytics.liquidityScore.toFixed(0)}/100</span></div>
        <div className="flex justify-between">
          <span className="text-gray-400">Risk Factor:</span>
          <span className={`font-mono ${realTimeAnalytics.riskFactor > 0.5 ? 'text-red-400' : realTimeAnalytics.riskFactor < 0.35 ? 'text-green-400' : 'text-yellow-400'}`}>
            {(realTimeAnalytics.riskFactor * 100).toFixed(1)}%
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">Updated: {realTimeAnalytics.lastUpdate.toLocaleTimeString()}</p>
    </div>
  );

  return (
    <div className="relative bg-[#1a2f5c] rounded-xl p-6 mb-6">
      {/* overlay so refresh stays mounted and visible */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-[#1a2f5c]/80 backdrop-blur-sm">
          <span className="text-blue-300 animate-pulse text-sm">Refreshing live rates…</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-400" />
          Currency Arbitrage Calculator
        </h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-700/20 text-blue-300 rounded-lg hover:bg-blue-500/40 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          aria-busy={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Input Section */}
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }} className="space-y-4 flex flex-col">
          <div>
            <label htmlFor="initial-amount" className="block text-sm font-medium text-gray-300 mb-2">Initial USD Amount</label>
            <input
              id="initial-amount" type="number" value={initialAmount}
              onChange={(e) => setInitialAmount(Number(e.target.value))}
              className="w-full px-4 py-2 bg-[#0d2242] text-white rounded-lg border border-blue-500/30 focus:border-blue-400 focus:outline-none"
              min="1" step="1"
            />
          </div>

          <MarketIndicator />

          <div className="space-y-3 flex-grow">
            <h3 className="text-lg font-semibold text-white">Current Exchange Rates</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">{selectedCurrencies.from1} → {selectedCurrencies.to1}:</span>
                  <span className="text-blue-300 font-mono">{firstRate.toFixed(4)}</span>
                </div>
                <div className="flex gap-2">
                  <CurrencyDropdown value={selectedCurrencies.from1} onChange={(c) => handleCurrencyChange('from1', c)} position="from1" label="From" />
                  <CurrencyDropdown value={selectedCurrencies.to1} onChange={(c) => handleCurrencyChange('to1', c)} position="to1" label="To" />
                </div>
              </div>

              {(selectedCurrencies.to3 !== 'None' && selectedCurrencies.from3 !== 'None') && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">{selectedCurrencies.from2} → {selectedCurrencies.to2}:</span>
                    <span className="text-blue-300 font-mono">{(1 / secondRate).toFixed(4)}</span>
                  </div>
                  <div className="flex gap-2">
                    <CurrencyDropdown value={selectedCurrencies.from2} onChange={(c) => handleCurrencyChange('from2', c)} position="from2" label="From" />
                    <CurrencyDropdown value={selectedCurrencies.to2} onChange={(c) => handleCurrencyChange('to2', c)} position="to2" label="To" />
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">
                    {(selectedCurrencies.to3 === 'None' || selectedCurrencies.from3 === 'None')
                      ? `${selectedCurrencies.from3 === 'None' ? selectedCurrencies.to1 : selectedCurrencies.from3} → USD:` 
                      : `${selectedCurrencies.from3} → ${selectedCurrencies.to3}:`
                    }
                  </span>
                  <span className="text-blue-300 font-mono">{thirdRate.toFixed(4)}</span>
                </div>
                <div className="flex gap-2">
                  <CurrencyDropdown value={selectedCurrencies.from3} onChange={(c) => handleCurrencyChange('from3', c)} position="from3" label="From" includeNone />
                  <CurrencyDropdown value={selectedCurrencies.to3} onChange={(c) => handleCurrencyChange('to3', c)} position="to3" label="To" includeNone />
                </div>
              </div>
            </div>
          </div>

          {/* Custom Thresholds */}
          <div className="space-y-4 mt-auto">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Your Trading Thresholds
            </h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="first-threshold" className="block text-xs text-gray-400 mb-1">{selectedCurrencies.from1} → {selectedCurrencies.to1} Threshold</label>
                <input
                  id="first-threshold" type="number" value={thresholds.firstThreshold}
                  onChange={(e) => setThresholds(prev => ({ ...prev, firstThreshold: Number(e.target.value) }))}
                  className="w-full px-3 py-1 bg-[#0d2242] text-white rounded text-sm border border-blue-500/30 focus:border-blue-400 focus:outline-none"
                  step="0.01"
                />
              </div>
              {(selectedCurrencies.to3 !== 'None' && selectedCurrencies.from3 !== 'None') && (
                <div>
                  <label htmlFor="second-threshold" className="block text-xs text-gray-400 mb-1">{selectedCurrencies.from2} → {selectedCurrencies.to2} Threshold</label>
                  <input
                    id="second-threshold" type="number" value={thresholds.secondThreshold}
                    onChange={(e) => setThresholds(prev => ({ ...prev, secondThreshold: Number(e.target.value) }))}
                    className="w-full px-3 py-1 bg-[#0d2242] text-white rounded text-sm border border-blue-500/30 focus:border-blue-400 focus:outline-none"
                    step="0.01"
                  />
                </div>
              )}
              <div>
                <label htmlFor="third-threshold" className="block text-xs text-gray-400 mb-1">
                  {(selectedCurrencies.to3 === 'None' || selectedCurrencies.from3 === 'None')
                    ? `${selectedCurrencies.from3 === 'None' ? selectedCurrencies.to1 : selectedCurrencies.from3} → USD Threshold` 
                    : `${selectedCurrencies.from3} → ${selectedCurrencies.to3} Threshold`
                  }
                </label>
                <input
                  id="third-threshold" type="number" value={thresholds.thirdThreshold}
                  onChange={(e) => setThresholds(prev => ({ ...prev, thirdThreshold: Number(e.target.value) }))}
                  className="w-full px-3 py-1 bg-[#0d2242] text-white rounded text-sm border border-blue-500/30 focus:border-blue-400 focus:outline-none"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Middle Column - Current Rates Results */}
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }} className="space-y-3 flex flex-col">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-400" />
            Current Market Rates
          </h3>
          {arbitrageResult && (
            <>
              {arbitrageResult.path && <TradingPath path={arbitrageResult.path} />}
              
              <div className="bg-[#0d2242] rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Initial {selectedCurrencies.from1}:</span>
                    <span className="text-white font-mono">${arbitrageResult.initialAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">After {selectedCurrencies.to1}:</span>
                    <span className="text-white font-mono">{arbitrageResult.afterFirst.toLocaleString()} {selectedCurrencies.to1}</span>
                  </div>
                  {(selectedCurrencies.to3 !== 'None' && selectedCurrencies.from3 !== 'None') && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">After {selectedCurrencies.to2}:</span>
                      <span className="text-white font-mono">{arbitrageResult.afterSecond.toFixed(2)} {selectedCurrencies.to2}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-300">Final {(selectedCurrencies.to3 === 'None' || selectedCurrencies.from3 === 'None') ? selectedCurrencies.from1 : selectedCurrencies.to3}:</span>
                    <span className="text-white font-mono">${arbitrageResult.finalUSD.toFixed(2)}</span>
                  </div>
                  <hr className="border-blue-500/30 my-2" />
                  <div className="flex justify-between">
                    <span className="text-gray-300">Profit/Loss:</span>
                    <span className={`font-mono font-bold ${getValueColor(arbitrageResult.profit)}`}>
                      ${arbitrageResult.profit.toFixed(2)} ({arbitrageResult.profitPercentage.toFixed(4)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0d2242] rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  Realistic Gains (Current Rates)
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Daily Expected:</span>
                    <span className={`font-mono ${getValueColor(currentGains?.daily || 0)}`}>
                      ${currentGains?.daily.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Monthly Expected:</span>
                    <span className={`font-mono ${getValueColor(currentGains?.monthly || 0)}`}>
                      ${currentGains?.monthly.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Yearly Expected:</span>
                    <span className={`font-mono ${getValueColor(currentGains?.yearly || 0)}`}>
                      ${currentGains?.yearly.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Based on {(predictionModel.dailyOpportunityRate * 100).toFixed(1)}% daily opportunity rate
                </p>
              </div>

              <WISEAPYBox />

              <div className="mt-auto">
                {opportunity && (
                  <div className={`p-3.5 rounded-lg border ${opportunity.allReady ? 'bg-green-900/20 border-green-500/30' : 'bg-yellow-900/20 border-yellow-500/30'}`}>
                    <p className={`text-sm font-medium ${opportunity.allReady ? 'text-green-400' : 'text-yellow-400'} mb-2`}>
                      {opportunity.allReady ? '🟢 Trading Opportunity Available!' : '🟡 Waiting for Optimal Rates'}
                    </p>
                    <div className="text-xs space-y-1">
                      <div className={`${opportunity.firstReady ? 'text-green-400' : 'text-gray-400'}`}>
                        {selectedCurrencies.from1}→{selectedCurrencies.to1}: {opportunity.firstReady ? '✓' : '✗'} Ready
                      </div>
                      {(selectedCurrencies.to3 !== 'None' && selectedCurrencies.from3 !== 'None') && (
                        <div className={`${opportunity.secondReady ? 'text-green-400' : 'text-gray-400'}`}>
                          {selectedCurrencies.from2}→{selectedCurrencies.to2}: {opportunity.secondReady ? '✓' : '✗'} Ready
                        </div>
                      )}
                      <div className={`${opportunity.thirdReady ? 'text-green-400' : 'text-gray-400'}`}>
                        {(selectedCurrencies.to3 === 'None' || selectedCurrencies.from3 === 'None')
                          ? `${selectedCurrencies.from3 === 'None' ? selectedCurrencies.to1 : selectedCurrencies.from3}→USD` 
                          : `${selectedCurrencies.from3}→${selectedCurrencies.to3}`
                        }: {opportunity.thirdReady ? '✓' : '✗'} Ready
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* Right Column - Threshold Results */}
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }} className="space-y-3 flex flex-col">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-blue-400" />
            Your Threshold Strategy
          </h3>
          {thresholdResult && (
            <>
              {thresholdResult.path && <TradingPath path={thresholdResult.path} />}
              
              <div className="bg-[#0d2242] rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Initial {selectedCurrencies.from1}:</span>
                    <span className="text-white font-mono">${thresholdResult.initialAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">After {selectedCurrencies.to1}:</span>
                    <span className="text-white font-mono">{thresholdResult.afterFirst.toLocaleString()} {selectedCurrencies.to1}</span>
                  </div>
                  {(selectedCurrencies.to3 !== 'None' && selectedCurrencies.from3 !== 'None') && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">After {selectedCurrencies.to2}:</span>
                      <span className="text-white font-mono">{thresholdResult.afterSecond.toFixed(2)} {selectedCurrencies.to2}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-300">Final {(selectedCurrencies.to3 === 'None' || selectedCurrencies.from3 === 'None') ? selectedCurrencies.from1 : selectedCurrencies.to3}:</span>
                    <span className="text-white font-mono">${thresholdResult.finalUSD.toFixed(2)}</span>
                  </div>
                  <hr className="border-blue-500/30 my-2" />
                  <div className="flex justify-between">
                    <span className="text-gray-300">Expected Profit:</span>
                    <span className={`font-mono font-bold ${getValueColor(thresholdResult.profit)}`}>
                      ${thresholdResult.profit.toFixed(2)} ({thresholdResult.profitPercentage.toFixed(4)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0d2242] rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  Realistic Gains (Your Strategy)
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-300">Daily Expected:</span><span className={`font-mono ${getValueColor(thresholdGains?.daily || 0)}`}>${thresholdGains?.daily.toFixed(2) || '0.00'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-300">Monthly Expected:</span><span className={`font-mono ${getValueColor(thresholdGains?.monthly || 0)}`}>${thresholdGains?.monthly.toFixed(2) || '0.00'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-300">Yearly Expected:</span><span className={`font-mono ${getValueColor(thresholdGains?.yearly || 0)}`}>${thresholdGains?.yearly.toFixed(2) || '0.00'}</span></div>
                </div>
                <p className="text-xs text-gray-400 mt-2">~{predictionModel.monthlyOpportunities.toFixed(1)} opportunities/month</p>
              </div>

              <RealTimeAnalyticsBox />
            </>
          )}
        </motion.div>
      </div>

      {/* ───────────── Bottom bar: last refreshed + disclaimer ───────────── */}
      <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-gray-300/90">
        <div className="bg-[#0d2242] rounded-md px-3 py-2">
          Last refreshed: <span className="font-mono text-blue-300">{lastUpdated ? lastUpdated.toLocaleString() : '—'}</span>
        </div>
        <p className="bg-blue-900/20 rounded-md border border-blue-500/30 px-3 py-2 leading-relaxed">
          <strong>Disclaimer:</strong> Rates are fetched in real time from multiple providers (Frankfurter, exchangerate.host, ER-API). 
          Real trading involves fees, spreads, execution latency and market risk that may eliminate profits.
        </p>
      </div>
    </div>
  );
}

export default CurrencyCalculator;