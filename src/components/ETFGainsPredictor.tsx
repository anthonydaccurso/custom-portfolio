import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, Calendar, User, Target, DollarSign, ChevronDown, RefreshCw, X, Percent, Repeat } from 'lucide-react';

interface ETFData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  beta: number;
  dividendYield: number;
  volatility: number;
  expenseRatio: number;
  marketCap: number;
}

interface ETFWeight {
  symbol: string;
  weight: number;
}

interface PredictionResults {
  oneMonth: {
    expectedReturn: number;
    lowEstimate: number;
    highEstimate: number;
    confidence: number;
    totalValue: number;
    totalContributions: number;
  };
  oneYear: {
    expectedReturn: number;
    lowEstimate: number;
    highEstimate: number;
    confidence: number;
    totalValue: number;
    totalContributions: number;
  };
  toRetirement: {
    expectedReturn: number;
    lowEstimate: number;
    highEstimate: number;
    confidence: number;
    yearsToRetirement: number;
    compoundedValue: number;
    totalContributions: number;
    realReturn: number; // Inflation-adjusted
  };
}

type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly';

const ETF_OPTIONS = [
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust ETF' },
  { symbol: 'ITA', name: 'iShares U.S. Aerospace & Defense ETF' },
  { symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF' },
  { symbol: 'VXUS', name: 'Vanguard Total International Stock ETF' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF' },
  { symbol: 'VEA', name: 'Vanguard FTSE Developed Markets ETF' },
  { symbol: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF' },
  { symbol: 'BND', name: 'Vanguard Total Bond Market ETF' },
  { symbol: 'VNQ', name: 'Vanguard Real Estate Index Fund ETF' },
  { symbol: 'GLD', name: 'SPDR Gold Shares' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF' },
  { symbol: 'XLK', name: 'Technology Select Sector SPDR Fund' },
  { symbol: 'XLF', name: 'Financial Select Sector SPDR Fund' }
];

const PAYMENT_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly', description: '52 payments per year' },
  { value: 'biweekly', label: 'Bi-weekly', description: '26 payments per year' },
  { value: 'monthly', label: 'Monthly', description: '12 payments per year' }
];

function ETFGainsPredictor() {
  // Default values: Age 23, 0 invested, VTI 30%, QQQ 25%, ITA 25%, SCHD 10%, VXUS 10%
  // Default payment: $153.85 bi-weekly (equals $4,000 annually)
  const [selectedETFs, setSelectedETFs] = useState<ETFWeight[]>([
    { symbol: 'VTI', weight: 30 },
    { symbol: 'QQQ', weight: 25 },
    { symbol: 'ITA', weight: 25 },
    { symbol: 'SCHD', weight: 10 },
    { symbol: 'VXUS', weight: 10 }
  ]);
  const [userAge, setUserAge] = useState<string>('23');
  const [paymentAmount, setPaymentAmount] = useState<string>('153.85');
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('biweekly');
  const [etfData, setETFData] = useState<{ [key: string]: ETFData }>({});
  const [predictions, setPredictions] = useState<PredictionResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [frequencyDropdownOpen, setFrequencyDropdownOpen] = useState(false);

  // Convert string inputs to numbers for calculations
  const userAgeNum = Math.max(18, Math.min(80, parseInt(userAge) || 23));
  const paymentAmountNum = Math.max(0, parseFloat(paymentAmount) || 0);

  // Calculate annual contribution based on frequency
  const getAnnualContribution = () => {
    switch (paymentFrequency) {
      case 'weekly': return paymentAmountNum * 52;
      case 'biweekly': return paymentAmountNum * 26;
      case 'monthly': return paymentAmountNum * 12;
      default: return paymentAmountNum * 12;
    }
  };

  // Calculate number of payments per period
  const getPaymentsPerPeriod = (months: number) => {
    const paymentsPerMonth = {
      weekly: 52 / 12,
      biweekly: 26 / 12,
      monthly: 1
    };
    return Math.floor(months * paymentsPerMonth[paymentFrequency]);
  };

  // Realistic market conditions based on current economic environment
  const getMarketConditions = () => {
    const currentDate = new Date();
    const dayOfYear = Math.floor((currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / 86400000);
    
    // Current market environment (2025)
    const baseInflationRate = 2.8; // Current inflation environment
    const baseFedRate = 4.5; // Current Fed funds rate
    const marketVolatility = 0.18; // Current VIX-equivalent
    
    // Economic cycle adjustments
    const economicCycle = Math.sin((dayOfYear / 365) * 2 * Math.PI) * 0.5; // Annual economic cycle
    const marketSentiment = 0.1; // Slightly positive market sentiment
    
    return {
      inflationRate: baseInflationRate + economicCycle * 0.5,
      fedRate: baseFedRate + economicCycle * 0.3,
      marketVolatility: marketVolatility + Math.abs(economicCycle) * 0.05,
      economicGrowth: 2.2 + economicCycle * 0.8, // GDP growth rate
      marketSentiment
    };
  };

  const calculatePortfolioPredictions = (etfs: { [key: string]: ETFData }): PredictionResults => {
    const marketConditions = getMarketConditions();
    const yearsToRetirement = Math.max(1, 65 - userAgeNum);
    const annualContribution = getAnnualContribution();
    
    // Realistic historical returns based on actual ETF performance (2015-2024 averages)
    const historicalReturns = {
      'VTI': 0.105, 'SPY': 0.103, 'VOO': 0.103, // Broad market: ~10.3-10.5%
      'QQQ': 0.145, 'XLK': 0.138, // Tech: ~13.8-14.5% (higher volatility)
      'ITA': 0.087, 'XLF': 0.082, // Sector-specific: ~8.2-8.7%
      'SCHD': 0.092, // Dividend: ~9.2% (lower volatility)
      'VXUS': 0.058, 'VEA': 0.055, 'VWO': 0.065, // International: ~5.5-6.5%
      'BND': 0.028, 'TLT': 0.035, // Bonds: ~2.8-3.5%
      'VNQ': 0.078, // REITs: ~7.8%
      'GLD': 0.042 // Gold: ~4.2%
    };

    // Expense ratios (realistic values)
    const expenseRatios = {
      'VTI': 0.0003, 'SPY': 0.0945, 'VOO': 0.0003, 'QQQ': 0.0020,
      'ITA': 0.0040, 'SCHD': 0.0006, 'VXUS': 0.0008, 'VEA': 0.0005,
      'VWO': 0.0010, 'BND': 0.0003, 'VNQ': 0.0012, 'GLD': 0.0040,
      'TLT': 0.0015, 'XLK': 0.0010, 'XLF': 0.0010
    };

    // Calculate portfolio-weighted metrics
    let portfolioReturn = 0;
    let portfolioVolatility = 0;
    let portfolioBeta = 0;
    let portfolioExpenseRatio = 0;
    let portfolioDividendYield = 0;

    selectedETFs.forEach(({ symbol, weight }) => {
      const etf = etfs[symbol];
      if (etf) {
        const weightDecimal = weight / 100;
        const baseReturn = historicalReturns[symbol as keyof typeof historicalReturns] || 0.08;
        
        // Market condition adjustments (more conservative)
        const inflationAdjustment = -marketConditions.inflationRate * 0.003; // Inflation drag
        const rateAdjustment = -(marketConditions.fedRate - 2.0) * 0.002; // Rate sensitivity
        const sentimentAdjustment = marketConditions.marketSentiment * 0.01;
        
        const adjustedReturn = baseReturn + inflationAdjustment + rateAdjustment + sentimentAdjustment;
        
        portfolioReturn += adjustedReturn * weightDecimal;
        portfolioVolatility += etf.volatility * weightDecimal;
        portfolioBeta += etf.beta * weightDecimal;
        portfolioExpenseRatio += (expenseRatios[symbol as keyof typeof expenseRatios] || 0.005) * weightDecimal;
        portfolioDividendYield += etf.dividendYield * weightDecimal;
      }
    });

    // Diversification benefit (correlation adjustment)
    const diversificationFactor = selectedETFs.length > 1 ? 
      Math.sqrt(0.75 + (selectedETFs.length - 1) * 0.05) : 1.0; // Realistic correlation
    portfolioVolatility *= diversificationFactor;
    
    // Subtract expense ratio from returns
    portfolioReturn -= portfolioExpenseRatio;

    // Dollar Cost Averaging calculation function
    const calculateDCAValue = (months: number, monthlyReturn: number, monthlyVolatility: number) => {
      const paymentsPerMonth = {
        weekly: 52 / 12,
        biweekly: 26 / 12,
        monthly: 1
      };
      
      const paymentFreq = paymentsPerMonth[paymentFrequency];
      const totalPayments = Math.floor(months * paymentFreq);
      const paymentInterval = 1 / paymentFreq; // Fraction of month between payments
      
      let totalValue = 0;
      let totalContributions = 0;
      
      for (let i = 0; i < totalPayments; i++) {
        const monthsInvested = (i + 1) * paymentInterval;
        const timeRemaining = months - (i * paymentInterval);
        
        // Each payment grows for the remaining time
        const growthPeriods = timeRemaining;
        const compoundReturn = Math.pow(1 + monthlyReturn, growthPeriods);
        
        totalValue += paymentAmountNum * compoundReturn;
        totalContributions += paymentAmountNum;
      }
      
      // Calculate confidence intervals with DCA volatility reduction
      const dcaVolatilityReduction = Math.sqrt(totalPayments) / totalPayments; // DCA reduces volatility
      const adjustedVolatility = monthlyVolatility * dcaVolatilityReduction;
      
      const lowValue = totalValue * (1 - 1.96 * adjustedVolatility);
      const highValue = totalValue * (1 + 1.96 * adjustedVolatility);
      
      return {
        totalValue,
        totalContributions,
        gains: totalValue - totalContributions,
        lowEstimate: lowValue - totalContributions,
        highEstimate: highValue - totalContributions
      };
    };
    
    // One Month Prediction
    const monthlyReturn = portfolioReturn / 12;
    const monthlyVolatility = portfolioVolatility / Math.sqrt(12);
    
    const oneMonthResult = calculateDCAValue(1, monthlyReturn, monthlyVolatility);
    const oneMonth = {
      expectedReturn: oneMonthResult.gains,
      lowEstimate: oneMonthResult.lowEstimate,
      highEstimate: oneMonthResult.highEstimate,
      confidence: Math.max(60, Math.min(75, 70 - marketConditions.marketVolatility * 100)),
      totalValue: oneMonthResult.totalValue,
      totalContributions: oneMonthResult.totalContributions
    };

    // One Year Prediction
    const oneYearResult = calculateDCAValue(12, monthlyReturn, monthlyVolatility);
    const oneYear = {
      expectedReturn: oneYearResult.gains,
      lowEstimate: oneYearResult.lowEstimate,
      highEstimate: oneYearResult.highEstimate,
      confidence: Math.max(70, Math.min(85, 80 - marketConditions.marketVolatility * 80)),
      totalValue: oneYearResult.totalValue,
      totalContributions: oneYearResult.totalContributions
    };

    // To Retirement Prediction (compound growth with DCA)
    const longTermReturn = portfolioReturn * 0.92; // Slightly more conservative for long-term
    const realReturn = longTermReturn - marketConditions.inflationRate / 100; // Real return after inflation
    const longTermMonthlyReturn = longTermReturn / 12;
    const longTermMonthlyVolatility = portfolioVolatility / Math.sqrt(12);
    
    const retirementResult = calculateDCAValue(yearsToRetirement * 12, longTermMonthlyReturn, longTermMonthlyVolatility);
    
    const toRetirement = {
      expectedReturn: retirementResult.gains,
      lowEstimate: retirementResult.lowEstimate,
      highEstimate: retirementResult.highEstimate,
      confidence: Math.min(90, 75 + Math.log(yearsToRetirement) * 8),
      yearsToRetirement,
      compoundedValue: retirementResult.totalValue,
      totalContributions: retirementResult.totalContributions,
      realReturn: realReturn * 100 // Convert to percentage
    };

    return { oneMonth, oneYear, toRetirement };
  };

  const fetchETFData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const symbols = selectedETFs.map(etf => etf.symbol);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${supabaseUrl}/functions/v1/etf-data?symbols=${symbols.join(',')}`;
      
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, { headers, cache: 'no-cache' });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || 'Failed to fetch ETF data');
      }

      const processedETFs: { [key: string]: ETFData } = {};

      symbols.forEach(symbol => {
        const rawData = data[symbol];
        if (rawData) {
          // Calculate volatility from price history
          const prices = rawData.priceHistory?.map((p: any) => p.close) || [];
          let volatility = 0.15; // Default volatility
          
          if (prices.length > 10) {
            const returns = prices.slice(1).map((price: number, i: number) => (price - prices[i]) / prices[i]);
            const avgReturn = returns.reduce((sum: number, ret: number) => sum + ret, 0) / returns.length;
            const variance = returns.reduce((sum: number, ret: number) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
            volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
          }

          // Realistic expense ratios and market caps
          const expenseRatios = {
            'VTI': 0.03, 'SPY': 9.45, 'VOO': 0.03, 'QQQ': 0.20,
            'ITA': 0.40, 'SCHD': 0.06, 'VXUS': 0.08, 'VEA': 0.05,
            'VWO': 0.10, 'BND': 0.03, 'VNQ': 0.12, 'GLD': 0.40,
            'TLT': 0.15, 'XLK': 0.10, 'XLF': 0.10
          };

          processedETFs[symbol] = {
            symbol,
            name: ETF_OPTIONS.find(etf => etf.symbol === symbol)?.name || symbol,
            currentPrice: Number(rawData.price?.toFixed(2) || 0),
            change: Number(rawData.change?.toFixed(2) || 0),
            changePercent: Number(rawData.changePercent?.toFixed(2) || 0),
            beta: Number(rawData.beta?.toFixed(2) || 1.0),
            dividendYield: Number(rawData.dividendYield?.toFixed(2) || 0) || 1.8,
            volatility: Number(volatility.toFixed(3)),
            expenseRatio: expenseRatios[symbol as keyof typeof expenseRatios] || 0.50,
            marketCap: rawData.marketCap || 0
          };
        }
      });

      setETFData(processedETFs);
      
      // Calculate predictions
      if (Object.keys(processedETFs).length > 0) {
        const predictionResults = calculatePortfolioPredictions(processedETFs);
        setPredictions(predictionResults);
      }
      
    } catch (error) {
      console.error('Error fetching ETF data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch ETF data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchETFData();
  }, [selectedETFs]);

  useEffect(() => {
    if (Object.keys(etfData).length > 0) {
      const predictionResults = calculatePortfolioPredictions(etfData);
      setPredictions(predictionResults);
    }
  }, [userAge, paymentAmount, paymentFrequency, etfData]);

  const handleETFToggle = (symbol: string) => {
    setSelectedETFs(prev => {
      const exists = prev.find(etf => etf.symbol === symbol);
      if (exists) {
        // Remove ETF
        const newETFs = prev.filter(etf => etf.symbol !== symbol);
        // Redistribute weights equally
        const equalWeight = newETFs.length > 0 ? 100 / newETFs.length : 0;
        return newETFs.map(etf => ({ ...etf, weight: equalWeight }));
      } else {
        // Add ETF with equal weight distribution
        const newETFs = [...prev, { symbol, weight: 0 }];
        const equalWeight = 100 / newETFs.length;
        return newETFs.map(etf => ({ ...etf, weight: equalWeight }));
      }
    });
  };

  const handleWeightChange = (symbol: string, newWeight: number) => {
    setSelectedETFs(prev => {
      const updated = prev.map(etf => 
        etf.symbol === symbol ? { ...etf, weight: Math.max(0, Math.min(100, newWeight)) } : etf
      );
      
      // Ensure weights don't exceed 100%
      const totalWeight = updated.reduce((sum, etf) => sum + etf.weight, 0);
      if (totalWeight > 100) {
        const excess = totalWeight - 100;
        const otherETFs = updated.filter(etf => etf.symbol !== symbol);
        const reduction = excess / otherETFs.length;
        
        return updated.map(etf => 
          etf.symbol === symbol ? etf : { ...etf, weight: Math.max(0, etf.weight - reduction) }
        );
      }
      
      return updated;
    });
  };

  const getTotalWeight = () => {
    return selectedETFs.reduce((sum, etf) => sum + etf.weight, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (amount: number, contributions: number) => {
    if (contributions === 0) return '0.0%';
    const percentage = (amount / contributions) * 100;
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;
  };

  const getReturnColor = (amount: number) => {
    if (amount > 0) return 'text-green-400';
    if (amount < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="bg-[#1a2f5c] rounded-xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calculator className="w-6 h-6 text-blue-400" />
          ETF Gains Predictor
        </h2>
        <button
          onClick={fetchETFData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700/20 text-blue-300 rounded-lg hover:bg-blue-500/40 transition-colors duration-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* ETF Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Select ETFs (Multiple)</label>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full px-4 py-3 bg-[#0d2242] text-white rounded-lg border border-blue-500/30 focus:border-blue-400 focus:outline-none flex items-center justify-between"
            >
              <div className="text-left">
                <div className="font-semibold">
                  {selectedETFs.length === 1 
                    ? selectedETFs[0].symbol 
                    : `${selectedETFs.length} ETFs Selected`
                  }
                </div>
                <div className="text-xs text-gray-400">
                  {selectedETFs.length === 1 
                    ? ETF_OPTIONS.find(etf => etf.symbol === selectedETFs[0].symbol)?.name
                    : selectedETFs.map(etf => etf.symbol).join(', ')
                  }
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#0d2242] border border-blue-500/30 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {ETF_OPTIONS.map((etf) => (
                  <button
                    key={etf.symbol}
                    onClick={() => handleETFToggle(etf.symbol)}
                    className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between ${
                      selectedETFs.some(selected => selected.symbol === etf.symbol)
                        ? 'bg-blue-500/20 text-white'
                        : 'text-white hover:bg-blue-500/10'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{etf.symbol}</div>
                      <div className="text-xs text-gray-400">{etf.name}</div>
                    </div>
                    {selectedETFs.some(selected => selected.symbol === etf.symbol) && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Age Input - Fully typeable */}
        <div className="space-y-2">
          <label htmlFor="user-age" className="block text-sm font-medium text-gray-300 flex items-center gap-2">
            <User className="w-4 h-4" />
            Your Age
          </label>
          <input
            id="user-age"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={userAge}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              if (value === '' || (parseInt(value) >= 18 && parseInt(value) <= 80)) {
                setUserAge(value);
              }
            }}
            onBlur={() => {
              if (userAge === '') {
                setUserAge('23');
              } else {
                const num = parseInt(userAge) || 23;
                setUserAge(Math.max(18, Math.min(80, num)).toString());
              }
            }}
            placeholder="Enter your age (18-80)"
            className="w-full px-4 py-3 bg-[#0d2242] text-white rounded-lg border border-blue-500/30 focus:border-blue-400 focus:outline-none"
          />
          <p className="text-xs text-gray-400">
            Retirement age assumed at 65 ({Math.max(0, 65 - userAgeNum)} years to go)
          </p>
        </div>

        {/* Payment Frequency Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
            <Repeat className="w-4 h-4" />
            Payment Frequency
          </label>
          <div className="relative">
            <button
              onClick={() => setFrequencyDropdownOpen(!frequencyDropdownOpen)}
              className="w-full px-4 py-3 bg-[#0d2242] text-white rounded-lg border border-blue-500/30 focus:border-blue-400 focus:outline-none flex items-center justify-between"
            >
              <div className="text-left">
                <div className="font-semibold">
                  {PAYMENT_FREQUENCIES.find(f => f.value === paymentFrequency)?.label}
                </div>
                <div className="text-xs text-gray-400">
                  {PAYMENT_FREQUENCIES.find(f => f.value === paymentFrequency)?.description}
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${frequencyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {frequencyDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#0d2242] border border-blue-500/30 rounded-lg shadow-lg z-50">
                {PAYMENT_FREQUENCIES.map((freq) => (
                  <button
                    key={freq.value}
                    onClick={() => {
                      setPaymentFrequency(freq.value as PaymentFrequency);
                      setFrequencyDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left transition-colors ${
                      paymentFrequency === freq.value
                        ? 'bg-blue-500/20 text-white'
                        : 'text-white hover:bg-blue-500/10'
                    }`}
                  >
                    <div className="font-semibold">{freq.label}</div>
                    <div className="text-xs text-gray-400">{freq.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment Amount - Fully typeable */}
        <div className="space-y-2">
          <label htmlFor="payment-amount" className="block text-sm font-medium text-gray-300 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            {PAYMENT_FREQUENCIES.find(f => f.value === paymentFrequency)?.label} Payment
          </label>
          <input
            id="payment-amount"
            type="text"
            inputMode="decimal"
            value={paymentAmount}
            onChange={(e) => {
              let value = e.target.value.replace(/[^0-9.]/g, '');
              // Prevent multiple decimal points
              const parts = value.split('.');
              if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
              }
              // Limit to 2 decimal places
              if (parts[1] && parts[1].length > 2) {
                value = parts[0] + '.' + parts[1].substring(0, 2);
              }
              setPaymentAmount(value);
            }}
            onBlur={() => {
              if (paymentAmount === '') {
                setPaymentAmount('153.85');
              } else {
                const num = parseFloat(paymentAmount) || 0;
                setPaymentAmount(Math.max(0, num).toFixed(2));
              }
            }}
            placeholder={`Enter ${paymentFrequency} payment amount`}
            className="w-full px-4 py-3 bg-[#0d2242] text-white rounded-lg border border-blue-500/30 focus:border-blue-400 focus:outline-none"
          />
          <p className="text-xs text-gray-400">
            Annual: {formatCurrency(getAnnualContribution())}
          </p>
        </div>
      </div>

      {/* ETF Weights Configuration */}
      {selectedETFs.length > 1 && (
        <div className="bg-[#0d2242] rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Percent className="w-5 h-5 text-blue-400" />
            Portfolio Weights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedETFs.map(({ symbol, weight }) => (
              <div key={symbol} className="space-y-2">
                <label className="block text-sm text-gray-300">{symbol}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={weight.toFixed(1)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      const num = parseFloat(value) || 0;
                      handleWeightChange(symbol, num);
                    }}
                    className="flex-1 px-3 py-2 bg-[#1a2f5c] text-white rounded border border-blue-500/30 focus:border-blue-400 focus:outline-none"
                  />
                  <span className="text-gray-400 text-sm">%</span>
                  <button
                    onClick={() => handleETFToggle(symbol)}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm">
            <span className="text-gray-400">Total Weight: </span>
            <span className={`font-mono ${getTotalWeight() === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
              {getTotalWeight().toFixed(1)}%
            </span>
            {getTotalWeight() !== 100 && (
              <span className="text-yellow-400 ml-2">
                (Should equal 100%)
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {Object.keys(etfData).length > 0 && predictions && !loading && (
        <>
          {/* Portfolio Overview */}
          <div className="bg-[#0d2242] rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Portfolio Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Portfolio Beta:</span>
                <div className="text-white font-mono">
                  {selectedETFs.length > 0 ? 
                    (selectedETFs.reduce((sum, { symbol, weight }) => 
                      sum + (etfData[symbol]?.beta || 1) * (weight / 100), 0)).toFixed(2) :
                    '1.00'
                  }
                </div>
              </div>
              <div>
                <span className="text-gray-400">Avg Expense Ratio:</span>
                <div className="text-white font-mono">
                  {selectedETFs.length > 0 ? 
                    (selectedETFs.reduce((sum, { symbol, weight }) => 
                      sum + (etfData[symbol]?.expenseRatio || 0.5) * (weight / 100), 0)).toFixed(2) :
                    '0.00'
                  }%
                </div>
              </div>
              <div>
                <span className="text-gray-400">Dividend Yield:</span>
                <div className="text-white font-mono">
                  {selectedETFs.length > 0 ? 
                    (selectedETFs.reduce((sum, { symbol, weight }) => 
                      sum + (etfData[symbol]?.dividendYield || 0) * (weight / 100), 0)).toFixed(2) :
                    '0.00'
                  }%
                </div>
              </div>
              <div>
                <span className="text-gray-400">Risk Level:</span>
                <div className="text-white font-mono">
                  {selectedETFs.length > 0 ? 
                    (() => {
                      const avgBeta = selectedETFs.reduce((sum, { symbol, weight }) => 
                        sum + (etfData[symbol]?.beta || 1) * (weight / 100), 0);
                      return avgBeta < 0.8 ? 'Low' : avgBeta < 1.2 ? 'Medium' : 'High';
                    })() :
                    'Medium'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Predictions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1 Month Prediction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#0d2242] rounded-lg p-6"
            >
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                1 Month Outlook
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 text-sm">Expected Gain/Loss:</span>
                  <div className={`text-xl font-bold ${getReturnColor(predictions.oneMonth.expectedReturn)}`}>
                    {formatCurrency(predictions.oneMonth.expectedReturn)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatPercentage(predictions.oneMonth.expectedReturn, predictions.oneMonth.totalContributions)}
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Portfolio Value:</span>
                    <span className="text-white font-mono">
                      {formatCurrency(predictions.oneMonth.totalValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Contributions:</span>
                    <span className="text-blue-300 font-mono">
                      {formatCurrency(predictions.oneMonth.totalContributions)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Low Estimate:</span>
                    <span className={getReturnColor(predictions.oneMonth.lowEstimate)}>
                      {formatCurrency(predictions.oneMonth.lowEstimate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">High Estimate:</span>
                    <span className={getReturnColor(predictions.oneMonth.highEstimate)}>
                      {formatCurrency(predictions.oneMonth.highEstimate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Confidence:</span>
                    <span className="text-blue-300">{predictions.oneMonth.confidence.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 1 Year Prediction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#0d2242] rounded-lg p-6"
            >
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                1 Year Outlook
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 text-sm">Expected Gain/Loss:</span>
                  <div className={`text-xl font-bold ${getReturnColor(predictions.oneYear.expectedReturn)}`}>
                    {formatCurrency(predictions.oneYear.expectedReturn)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatPercentage(predictions.oneYear.expectedReturn, predictions.oneYear.totalContributions)}
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Portfolio Value:</span>
                    <span className="text-white font-mono">
                      {formatCurrency(predictions.oneYear.totalValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Contributions:</span>
                    <span className="text-blue-300 font-mono">
                      {formatCurrency(predictions.oneYear.totalContributions)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Low Estimate:</span>
                    <span className={getReturnColor(predictions.oneYear.lowEstimate)}>
                      {formatCurrency(predictions.oneYear.lowEstimate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">High Estimate:</span>
                    <span className={getReturnColor(predictions.oneYear.highEstimate)}>
                      {formatCurrency(predictions.oneYear.highEstimate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Confidence:</span>
                    <span className="text-blue-300">{predictions.oneYear.confidence.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* To Retirement Prediction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#0d2242] rounded-lg p-6"
            >
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                To Retirement ({predictions.toRetirement.yearsToRetirement} years)
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 text-sm">Total Portfolio Value:</span>
                  <div className="text-xl font-bold text-green-400">
                    {formatCurrency(predictions.toRetirement.compoundedValue)}
                  </div>
                  <div className="text-sm text-gray-400">
                    Total Gains: {formatCurrency(predictions.toRetirement.expectedReturn)}
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Contributions:</span>
                    <span className="text-blue-300 font-mono">
                      {formatCurrency(predictions.toRetirement.totalContributions)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Real Return (Inflation-Adj):</span>
                    <span className="text-blue-300">
                      {predictions.toRetirement.realReturn.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Conservative:</span>
                    <span className="text-yellow-400">
                      {formatCurrency(predictions.toRetirement.lowEstimate + predictions.toRetirement.totalContributions)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Optimistic:</span>
                    <span className="text-green-400">
                      {formatCurrency(predictions.toRetirement.highEstimate + predictions.toRetirement.totalContributions)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Confidence:</span>
                    <span className="text-blue-300">{predictions.toRetirement.confidence.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Disclaimer */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-xs text-white leading-relaxed">
              <strong>Disclaimer:</strong> These predictions use Dollar Cost Averaging (DCA) calculations based on historical data (2015-2024), current market conditions, and statistical models. 
              DCA reduces volatility risk by spreading investments over time. Calculations include realistic expense ratios, inflation adjustments, and correlation factors. 
              Actual returns may vary significantly. Past performance does not guarantee future results. 
              Consider consulting with a financial advisor before making investment decisions.
            </p>
          </div>
        </>
      )}

      {loading && (
        <div className="bg-[#0d2242] rounded-lg p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Analyzing market conditions and generating predictions...</p>
        </div>
      )}
    </div>
  );
}

export default ETFGainsPredictor;