import React, { useState } from 'react';
import { Upload, TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle, Download, FileText, Database } from 'lucide-react';
import { Trade, Assignment, CompletedCycle, Analysis } from '../types/artifact';

const WheelStrategyAnalyzer = () => {
  const [xmlFiles, setXmlFiles] = useState<File[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Export Functions - Fixed for Artifact environment
  const exportToJSON = () => {
    if (!analysis) return;
    
    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: "1.0",
      portfolioStats: analysis.portfolioStats,
      assignments: analysis.assignments,
      completedCycles: analysis.completedCycles,
      currentHoldings: analysis.currentHoldings,
      stats: analysis.stats,
      metadata: {
        totalTradesProcessed: analysis.trades.length,
        analysisTimestamp: new Date().toISOString(),
        dataSource: xmlFiles.map(f => f.name).join(', ')
      }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    
    // Create a text area and copy to clipboard
    const textArea = document.createElement('textarea');
    textArea.value = dataStr;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    // Show success message
    setError(`JSON-Daten wurden in die Zwischenablage kopiert! Fügen Sie sie in eine neue Datei ein und speichern Sie als: wheel-strategy-analysis-${new Date().toISOString().split('T')[0]}.json`);
  };

  const exportToCSV = () => {
    if (!analysis || !analysis.completedCycles) return;
    
    const headers = [
      'Symbol', 'Assignment Date', 'Exit Date', 'Days Duration',
      'Assignment Price', 'Exit Price', 'Quantity',
      'Put Premiums', 'Call Premiums', 'Total Premiums',
      'Capital Gain/Loss', 'Total P&L', 'Invested Capital',
      'Total Return %', 'Annualized ROI %', 'Premium Yield %',
      'Capital Yield %', 'Daily Return %', 'Performance Category'
    ].join(',');
    
    const rows = analysis.completedCycles.map(cycle => [
      cycle.symbol,
      formatDate(cycle.assignmentDate),
      formatDate(cycle.exitDate),
      cycle.daysDuration,
      cycle.assignmentPrice,
      cycle.exitPrice,
      cycle.quantity,
      cycle.putPremiums,
      cycle.callPremiums,
      cycle.totalPremiums,
      cycle.capitalGainLoss,
      cycle.totalPnL,
      cycle.investedCapital,
      cycle.totalReturnPct.toFixed(2),
      cycle.annualizedROI.toFixed(2),
      cycle.premiumYield.toFixed(2),
      cycle.capitalYield.toFixed(2),
      cycle.dailyReturn.toFixed(4),
      cycle.performanceCategory
    ].join(','));
    
    const csvContent = [headers, ...rows].join('\n');
    
    // Copy to clipboard
    const textArea = document.createElement('textarea');
    textArea.value = csvContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    setError(`CSV-Daten wurden in die Zwischenablage kopiert! Fügen Sie sie in Excel/Google Sheets ein oder speichern Sie als: wheel-strategy-performance-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportToXML = () => {
    if (!analysis) return;
    
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<WheelStrategyAnalysis exportDate="${new Date().toISOString()}" version="1.0">
  <Metadata>
    <TotalTrades>${analysis.stats.totalTrades}</TotalTrades>
    <TotalAssignments>${analysis.stats.totalAssignments}</TotalAssignments>
    <CurrentPositions>${analysis.stats.currentPositions}</CurrentPositions>
    <DataSource>${xmlFiles.map(f => f.name).join(', ')}</DataSource>
  </Metadata>
  
  <PortfolioStats>
    <TotalPnL>${analysis.portfolioStats?.totalPnL || 0}</TotalPnL>
    <WinRate>${analysis.portfolioStats?.winRate || 0}</WinRate>
    <AvgReturnPerTrade>${analysis.portfolioStats?.avgReturnPerTrade || 0}</AvgReturnPerTrade>
    <TotalInvested>${analysis.portfolioStats?.totalInvested || 0}</TotalInvested>
  </PortfolioStats>
  
  <CurrentHoldings>
    ${analysis.currentHoldings.map(holding => `
    <Position>
      <Symbol>${holding.symbol}</Symbol>
      <AssignmentDate>${holding.assignmentDate}</AssignmentDate>
      <AssignmentPrice>${holding.assignmentPrice}</AssignmentPrice>
      <Quantity>${holding.quantity}</Quantity>
      <PutPremiums>${holding.putPremiums}</PutPremiums>
      <CallPremiums>${holding.callPremiums}</CallPremiums>
      <TotalPremiums>${holding.totalPremiums}</TotalPremiums>
      <EffectiveBreakEven>${holding.effectiveBreakEven}</EffectiveBreakEven>
    </Position>`).join('')}
  </CurrentHoldings>
  
  <CompletedCycles>
    ${(analysis.completedCycles || []).map(cycle => `
    <Cycle>
      <Symbol>${cycle.symbol}</Symbol>
      <AssignmentDate>${cycle.assignmentDate}</AssignmentDate>
      <ExitDate>${cycle.exitDate}</ExitDate>
      <DaysDuration>${cycle.daysDuration}</DaysDuration>
      <TotalPnL>${cycle.totalPnL}</TotalPnL>
      <TotalReturnPct>${cycle.totalReturnPct}</TotalReturnPct>
      <AnnualizedROI>${cycle.annualizedROI}</AnnualizedROI>
      <PerformanceCategory>${cycle.performanceCategory}</PerformanceCategory>
    </Cycle>`).join('')}
  </CompletedCycles>
</WheelStrategyAnalysis>`;
    
    // Copy to clipboard
    const textArea = document.createElement('textarea');
    textArea.value = xmlContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    setError(`XML-Daten wurden in die Zwischenablage kopiert! Fügen Sie sie in eine neue Datei ein und speichern Sie als: wheel-strategy-analysis-${new Date().toISOString().split('T')[0]}.xml`);
  };

  // Import Functions
  const importAnalysisData = async (file: File) => {
    try {
      const content = await readFileContent(file);
      
      if (file.name.endsWith('.json')) {
        const importedData = JSON.parse(content) as Analysis;
        
        // Merge with current analysis if exists
        if (analysis && importedData) {
          // Combine assignments and remove duplicates
          const combinedAssignments = [...(analysis.assignments || []), ...(importedData.assignments || [])]
            .filter((assignment, index, self) =>
              index === self.findIndex(a => 
                a.symbol === assignment.symbol && 
                a.assignmentDate === assignment.assignmentDate
              )
            );
          
          const combinedCompletedCycles = [...(analysis.completedCycles || []), ...(importedData.completedCycles || [])]
            .filter((cycle, index, self) =>
              index === self.findIndex(c => 
                c.symbol === cycle.symbol && 
                c.assignmentDate === cycle.assignmentDate &&
                c.exitDate === cycle.exitDate
              )
            );
          
          // Update analysis with merged data
          setAnalysis({
            ...analysis,
            assignments: combinedAssignments,
            completedCycles: combinedCompletedCycles,
            currentHoldings: combinedAssignments.filter(a => a.currentlyHeld),
            // Recalculate portfolio stats
            portfolioStats: {
              ...importedData.portfolioStats,
              totalCompletedCycles: combinedCompletedCycles.length,
              totalPnL: combinedCompletedCycles.reduce((sum, c) => sum + c.totalPnL, 0)
            }
          });
        } else {
          // Use imported data as is
          setAnalysis(importedData);
        }
        
        return true;
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(`Fehler beim Importieren: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  // XML Parser Function
  const parseXML = (xmlString: string): Trade[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    
    const tradeConfirms = doc.querySelectorAll('TradeConfirm');
    const trades: Trade[] = [];
    
    tradeConfirms.forEach(trade => {
      trades.push({
        symbol: trade.getAttribute('symbol'),
        underlyingSymbol: trade.getAttribute('underlyingSymbol'),
        assetCategory: trade.getAttribute('assetCategory'),
        buySell: trade.getAttribute('buySell'),
        quantity: parseFloat(trade.getAttribute('quantity') || '0'),
        price: parseFloat(trade.getAttribute('price') || '0'),
        proceeds: parseFloat(trade.getAttribute('proceeds') || '0'),
        tradeDate: trade.getAttribute('tradeDate'),
        strike: trade.getAttribute('strike'),
        expiry: trade.getAttribute('expiry'),
        putCall: trade.getAttribute('putCall'),
        commission: parseFloat(trade.getAttribute('commission') || '0')
      });
    });
    
    return trades;
  };

  // Assignment Detection Algorithm - Verbessert
  const detectAssignments = (trades: Trade[]): Assignment[] => {
    console.log('Analyzing trades:', trades.length);
    const assignments: Assignment[] = [];
    
    // Finde alle Aktien-Käufe
    const stockBuys = trades.filter(t => 
      t.assetCategory === 'STK' && 
      t.buySell === 'BUY' && 
      t.quantity > 0
    );
    
    console.log('Stock purchases found:', stockBuys.length);
    
    stockBuys.forEach(stockTrade => {
      console.log(`Analyzing stock purchase: ${stockTrade.symbol} on ${stockTrade.tradeDate}`);
      
      // Finde alle Trades für das gleiche Symbol
      const symbolTrades = trades.filter(t => 
        (t.symbol === stockTrade.symbol || t.underlyingSymbol === stockTrade.symbol) &&
        t.symbol !== null && t.symbol !== ''
      );
      
      console.log(`Found ${symbolTrades.length} trades for ${stockTrade.symbol}`);
      
      // Finde Put-Verkäufe (SELL PUT) vor oder am Assignment-Tag
      const putSales = symbolTrades.filter(t => 
        t.assetCategory === 'OPT' && 
        t.putCall === 'P' && 
        t.buySell === 'SELL' &&
        t.proceeds > 0 && // Positive proceeds = Prämie erhalten
        t.tradeDate && stockTrade.tradeDate && t.tradeDate <= stockTrade.tradeDate
      );
      
      console.log(`Found ${putSales.length} put sales for ${stockTrade.symbol}`);
      
      // Auch schaue nach Put-Käufen (BUY PUT) am Assignment-Tag (Assignment-Indikator)
      const putAssignments = symbolTrades.filter(t =>
        t.assetCategory === 'OPT' &&
        t.putCall === 'P' &&
        t.buySell === 'BUY' &&
        t.tradeDate === stockTrade.tradeDate &&
        t.proceeds === 0 // Assignment bei 0 Kosten
      );
      
      console.log(`Found ${putAssignments.length} put assignments for ${stockTrade.symbol}`);
      
      // Wenn Put-Sales oder Assignment-Pattern gefunden
      if (putSales.length > 0 || putAssignments.length > 0) {
        
        // Berechne erhaltene Put-Prämien
        const totalPutPremiums = putSales.reduce((sum, put) => {
          console.log(`Put sale: ${put.symbol} proceeds: ${put.proceeds}`);
          return sum + Math.abs(put.proceeds);
        }, 0);
        
        // Finde Call-Verkäufe nach dem Assignment
        const callSales = symbolTrades.filter(t =>
          t.assetCategory === 'OPT' &&
          t.putCall === 'C' &&
          t.buySell === 'SELL' &&
          t.proceeds > 0 &&
          t.tradeDate && stockTrade.tradeDate && t.tradeDate > stockTrade.tradeDate
        );
        
        const totalCallPremiums = callSales.reduce((sum, call) => {
          console.log(`Call sale: ${call.symbol} proceeds: ${call.proceeds}`);
          return sum + Math.abs(call.proceeds);
        }, 0);
        
        // Prüfe ob Aktie verkauft wurde (Call Assignment oder direkter Verkauf)
        const stockSales = symbolTrades.filter(t =>
          t.assetCategory === 'STK' &&
          t.buySell === 'SELL' &&
          t.tradeDate && stockTrade.tradeDate && t.tradeDate > stockTrade.tradeDate
        );
        
        const stockSale = stockSales.length > 0 ? stockSales[0] : null;
        
        const effectiveBreakEven = stockTrade.price - (totalPutPremiums + totalCallPremiums) / stockTrade.quantity;
        
        const assignment = {
          symbol: stockTrade.symbol,
          assignmentDate: stockTrade.tradeDate,
          assignmentPrice: stockTrade.price,
          quantity: stockTrade.quantity,
          putPremiums: totalPutPremiums,
          callPremiums: totalCallPremiums,
          totalPremiums: totalPutPremiums + totalCallPremiums,
          effectiveBreakEven: effectiveBreakEven,
          currentlyHeld: !stockSale,
          exitDate: stockSale?.tradeDate || null,
          exitPrice: stockSale?.price || null,
          relatedPuts: putSales,
          relatedCalls: callSales,
          putAssignments: putAssignments
        };
        
        console.log(`Assignment detected:`, assignment);
        assignments.push(assignment);
      }
    });
    
    console.log(`Total assignments found: ${assignments.length}`);
    return assignments;
  };

  // Completed Cycles Analysis - Erweitert für detaillierte Performance
  const analyzeCompletedCycles = (assignments: Assignment[]): CompletedCycle[] => {
    return assignments
      .filter(a => !a.currentlyHeld && a.exitPrice)
      .map(assignment => {
        // Kapitalgewinn/verlust durch Aktienverkauf
        const capitalGainLoss = ((assignment.exitPrice || 0) - assignment.assignmentPrice) * assignment.quantity;
        
        // Gesamte P&L = Prämien + Kapitalgewinn/verlust
        const totalPnL = assignment.totalPremiums + capitalGainLoss;
        
        // Investiertes Kapital
        const investedCapital = assignment.assignmentPrice * assignment.quantity;
        
        // Gesamtrendite in %
        const totalReturnPct = (totalPnL / investedCapital) * 100;
        
        // Zeitdauer des Zyklus
        const startDate = assignment.assignmentDate ? new Date(
          parseInt(assignment.assignmentDate.slice(0,4)), 
          parseInt(assignment.assignmentDate.slice(4,6))-1, 
          parseInt(assignment.assignmentDate.slice(6,8))
        ) : new Date();
        const endDate = assignment.exitDate ? new Date(
          parseInt(assignment.exitDate.slice(0,4)), 
          parseInt(assignment.exitDate.slice(4,6))-1, 
          parseInt(assignment.exitDate.slice(6,8))
        ) : new Date();
        const daysDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Annualisierte Rendite
        const annualizedROI = daysDuration > 0 ? (totalReturnPct * (365 / daysDuration)) : 0;
        
        // Performance-Kategorisierung
        let performanceCategory = 'Break-Even';
        if (totalPnL > investedCapital * 0.05) performanceCategory = 'Excellent';
        else if (totalPnL > investedCapital * 0.02) performanceCategory = 'Good';
        else if (totalPnL > 0) performanceCategory = 'Profitable';
        else if (totalPnL < 0) performanceCategory = 'Loss';
        
        // Prämien-Anteil an der Gesamtrendite
        const premiumContribution = assignment.totalPremiums / totalPnL * 100;
        const capitalContribution = capitalGainLoss / totalPnL * 100;
        
        return {
          ...assignment,
          capitalGainLoss,
          totalPnL,
          investedCapital,
          totalReturnPct,
          daysDuration,
          annualizedROI,
          performanceCategory,
          premiumContribution: isFinite(premiumContribution) ? premiumContribution : 0,
          capitalContribution: isFinite(capitalContribution) ? capitalContribution : 0,
          // Zusätzliche Metriken
          premiumYield: (assignment.totalPremiums / investedCapital) * 100,
          capitalYield: (capitalGainLoss / investedCapital) * 100,
          dailyReturn: daysDuration > 0 ? (totalReturnPct / daysDuration) : 0
        };
      })
      .sort((a, b) => {
        const dateA = a.exitDate ? new Date(
          parseInt(a.exitDate.slice(0,4)), 
          parseInt(a.exitDate.slice(4,6))-1, 
          parseInt(a.exitDate.slice(6,8))
        ) : new Date(0);
        const dateB = b.exitDate ? new Date(
          parseInt(b.exitDate.slice(0,4)), 
          parseInt(b.exitDate.slice(4,6))-1, 
          parseInt(b.exitDate.slice(6,8))
        ) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
  };

  // Helper function to read file content
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e.target?.error);
      reader.readAsText(file);
    });
  };

  // Process multiple files - Verbessert  
  const processFiles = async (files: File[]) => {
    setLoading(true);
    setError(null);
    
    try {
      let allTrades: Trade[] = [];
      
      for (const file of files) {
        console.log(`Processing file: ${file.name}`);
        const content = await readFileContent(file);
        const trades = parseXML(content);
        console.log(`Loaded ${trades.length} trades from ${file.name}`);
        allTrades = [...allTrades, ...trades];
      }
      
      console.log(`Total trades loaded: ${allTrades.length}`);
      
      // Remove duplicates
      const uniqueTrades = allTrades.filter((trade, index, self) =>
        index === self.findIndex(t => 
          t.symbol === trade.symbol && 
          t.tradeDate === trade.tradeDate && 
          t.proceeds === trade.proceeds &&
          t.buySell === trade.buySell &&
          t.quantity === trade.quantity
        )
      );
      
      console.log(`Unique trades after deduplication: ${uniqueTrades.length}`);
      
      // Debug: Zeige CRCL Trades
      const crclTrades = uniqueTrades.filter(t => 
        t.symbol === 'CRCL' || t.underlyingSymbol === 'CRCL'
      );
      console.log('CRCL trades found:', crclTrades);
      
      const assignments = detectAssignments(uniqueTrades);
      const completedCycles = analyzeCompletedCycles(assignments);
      
      // Portfolio-Performance Statistiken
      const portfolioStats = {
        totalCompletedCycles: completedCycles.length,
        winningTrades: completedCycles.filter(c => c.totalPnL > 0).length,
        losingTrades: completedCycles.filter(c => c.totalPnL < 0).length,
        winRate: completedCycles.length > 0 ? 
          (completedCycles.filter(c => c.totalPnL > 0).length / completedCycles.length) * 100 : 0,
        totalPnL: completedCycles.reduce((sum, c) => sum + c.totalPnL, 0),
        totalInvested: completedCycles.reduce((sum, c) => sum + c.investedCapital, 0),
        avgReturnPerTrade: completedCycles.length > 0 ? 
          completedCycles.reduce((sum, c) => sum + c.totalReturnPct, 0) / completedCycles.length : 0,
        avgDuration: completedCycles.length > 0 ?
          completedCycles.reduce((sum, c) => sum + c.daysDuration, 0) / completedCycles.length : 0,
        bestTrade: completedCycles.length > 0 ? 
          Math.max(...completedCycles.map(c => c.totalPnL)) : 0,
        worstTrade: completedCycles.length > 0 ? 
          Math.min(...completedCycles.map(c => c.totalPnL)) : 0
      };
      
      setAnalysis({
        trades: uniqueTrades,
        assignments,
        completedCycles,
        portfolioStats,
        currentHoldings: assignments.filter(a => a.currentlyHeld),
        stats: {
          totalTrades: uniqueTrades.length,
          totalAssignments: assignments.length,
          currentPositions: assignments.filter(a => a.currentlyHeld).length
        }
      });
      
    } catch (err) {
      console.error('Processing error:', err);
      setError(`Fehler beim Verarbeiten der Dateien: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop Handlers
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files) as File[];
    const xmlFiles = files.filter(file => file.name.endsWith('.xml'));
    const analysisFiles = files.filter(file => file.name.endsWith('.json'));
    
    // Process analysis files first
    if (analysisFiles.length > 0) {
      analysisFiles.forEach(file => {
        importAnalysisData(file);
      });
    }
    
    // Then process XML files  
    if (xmlFiles.length > 0) {
      setXmlFiles(xmlFiles);
      processFiles(xmlFiles);
    }
    
    if (xmlFiles.length === 0 && analysisFiles.length === 0) {
      setError('Bitte laden Sie XML-Dateien (IB Flex Queries) oder JSON-Dateien (Gespeicherte Analysen) hoch.');
    }
  };

  // File Upload Handler - Enhanced for Analysis Import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []) as File[];
    
    // Separate XML and JSON files
    const xmlFiles = files.filter(file => file.name.endsWith('.xml'));
    const analysisFiles = files.filter(file => file.name.endsWith('.json'));
    
    // Process analysis files first
    if (analysisFiles.length > 0) {
      analysisFiles.forEach(file => {
        importAnalysisData(file).then(success => {
          if (success) {
            console.log(`Successfully imported analysis from ${file.name}`);
          }
        });
      });
    }
    
    // Then process XML files
    if (xmlFiles.length > 0) {
      setXmlFiles(xmlFiles);
      processFiles(xmlFiles);
    }
    
    if (xmlFiles.length === 0 && analysisFiles.length === 0) {
      setError('Bitte wählen Sie XML-Dateien (IB Flex Queries) oder JSON-Dateien (Gespeicherte Analysen) aus.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(
      parseInt(dateString.slice(0,4)), 
      parseInt(dateString.slice(4,6))-1, 
      parseInt(dateString.slice(6,8))
    ).toLocaleDateString('de-DE');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Wheel Strategy Analyzer
          </h1>
          <p className="text-gray-600">
            Put-Assignment Tracking & Break-Even Analysis für Options Trading
          </p>
        </div>

        {/* File Upload with Drag & Drop */}
        <div 
          className={`bg-white rounded-lg p-6 shadow-lg mb-8 border-2 border-dashed transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex items-center space-x-4">
            <Upload className={`w-8 h-8 ${dragActive ? 'text-blue-600' : 'text-gray-600'}`} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                IB Flex Query XML Upload
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Laden Sie XML-Dateien (IB Flex Queries) oder JSON-Dateien (Gespeicherte Analysen) hoch
              </p>
              <input
                type="file"
                accept=".xml,.json"
                multiple
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
              />
            </div>
          </div>
          
          {xmlFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Hochgeladene Dateien:</h4>
              <div className="space-y-1">
                {xmlFiles.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {loading && (
            <div className="mt-4 flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Analysiere Daten...</span>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Export Functions */}
        {analysis && (
          <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Download className="w-5 h-5 mr-2 text-blue-600" />
              Analyse exportieren & speichern
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={exportToJSON}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Database className="w-4 h-4" />
                <span>JSON Export</span>
              </button>
              
              <button
                onClick={exportToCSV}
                className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>CSV Export</span>
              </button>
              
              <button
                onClick={exportToXML}
                className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>XML Export</span>
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">So funktioniert der Export:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div><strong>1. Button klicken:</strong> Daten werden in die Zwischenablage kopiert</div>
                <div><strong>2. Neue Datei erstellen:</strong> Texteditor/Notepad öffnen</div>
                <div><strong>3. Einfügen:</strong> Strg+V (Windows) oder Cmd+V (Mac)</div>
                <div><strong>4. Speichern:</strong> Mit vorgeschlagenem Dateinamen (.json/.csv/.xml)</div>
              </div>
            </div>
          </div>
        )}

        {analysis && (
          <>
            {/* Debug Information */}
            <div className="bg-gray-100 rounded-lg p-4 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Debug Info</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Trades geladen: {analysis.trades.length}</div>
                <div>Put-Assignments erkannt: {analysis.assignments.length}</div>
                <div>Aktuell gehaltene Positionen: {analysis.currentHoldings.length}</div>
                <div>CRCL Trades: {analysis.trades.filter(t => t.symbol === 'CRCL' || t.underlyingSymbol === 'CRCL').length}</div>
              </div>
            </div>

            {/* Portfolio Performance Summary */}
            {analysis.portfolioStats && analysis.completedCycles && analysis.completedCycles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Total P&L</div>
                      <div className={`text-2xl font-bold ${analysis.portfolioStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(analysis.portfolioStats.totalPnL)}
                      </div>
                    </div>
                    {analysis.portfolioStats.totalPnL >= 0 ? 
                      <TrendingUp className="w-8 h-8 text-green-500" /> : 
                      <TrendingDown className="w-8 h-8 text-red-500" />
                    }
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-lg">
                  <div className="text-sm text-gray-600">Win Rate</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {analysis.portfolioStats.winRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {analysis.portfolioStats.winningTrades}W / {analysis.portfolioStats.losingTrades}L
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-lg">
                  <div className="text-sm text-gray-600">Ø Return/Trade</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {analysis.portfolioStats.avgReturnPerTrade.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-500">
                    Ø {analysis.portfolioStats.avgDuration.toFixed(0)} Tage
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-lg">
                  <div className="text-sm text-gray-600">Best/Worst Trade</div>
                  <div className="text-sm font-bold text-green-600">
                    +{formatCurrency(analysis.portfolioStats.bestTrade)}
                  </div>
                  <div className="text-sm font-bold text-red-600">
                    {formatCurrency(analysis.portfolioStats.worstTrade)}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{analysis.stats.totalTrades}</div>
                <div className="text-sm text-gray-600">Trades Gesamt</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="text-2xl font-bold text-green-600">{analysis.stats.totalAssignments}</div>
                <div className="text-sm text-gray-600">Put Assignments</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{analysis.stats.currentPositions}</div>
                <div className="text-sm text-gray-600">Aktuelle Positionen</div>
              </div>
            </div>

            {/* Current Holdings */}
            {analysis.currentHoldings.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-green-600" />
                  Aktuelle Positionen - Break-Even Analysis
                </h3>
                <div className="space-y-4">
                  {analysis.currentHoldings.map((holding, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div>
                          <h4 className="font-bold text-xl text-gray-900">{holding.symbol}</h4>
                          <p className="text-sm text-gray-600">Assignment: {formatDate(holding.assignmentDate)}</p>
                          <p className="text-sm text-gray-600">{holding.quantity} Aktien @ {formatCurrency(holding.assignmentPrice)}</p>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600">Erhaltene Prämien</div>
                          <div className="font-semibold text-green-600">
                            Put: {formatCurrency(holding.putPremiums)}
                          </div>
                          <div className="font-semibold text-blue-600">
                            Call: {formatCurrency(holding.callPremiums)}
                          </div>
                          <div className="font-bold text-gray-900">
                            Gesamt: {formatCurrency(holding.totalPremiums)}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600">Break-Even Analysis</div>
                          <div className="font-bold text-red-600">
                            Break-Even: {formatCurrency(holding.effectiveBreakEven)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Prämie/Aktie: {formatCurrency(holding.totalPremiums / holding.quantity)}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600">Call-Empfehlung</div>
                          <div className="font-bold text-green-600">
                            Mindest-Strike: {formatCurrency(Math.ceil(holding.effectiveBreakEven))}
                          </div>
                          <div className="text-sm text-gray-600">
                            Sicher: {formatCurrency(Math.ceil(holding.effectiveBreakEven) + 5)}+
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Cycles - Erweiterte Performance Analyse */}
            {analysis.completedCycles && analysis.completedCycles.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                  Abgeschlossene Trades - Detaillierte Performance
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left">Symbol</th>
                        <th className="px-3 py-2 text-center">Zeitraum</th>
                        <th className="px-3 py-2 text-right">Investiert</th>
                        <th className="px-3 py-2 text-right">Prämien</th>
                        <th className="px-3 py-2 text-right">Kapital G/V</th>
                        <th className="px-3 py-2 text-right">Gesamt P&L</th>
                        <th className="px-3 py-2 text-right">Return %</th>
                        <th className="px-3 py-2 text-right">ROI (ann.)</th>
                        <th className="px-3 py-2 text-center">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.completedCycles.map((cycle, index) => (
                        <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium">{cycle.symbol}</td>
                          <td className="px-3 py-2 text-center">
                            <div className="text-xs">
                              {formatDate(cycle.assignmentDate)} →<br/>
                              {formatDate(cycle.exitDate)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {cycle.daysDuration} Tage
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-gray-600">
                            {formatCurrency(cycle.investedCapital)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="text-green-600 text-xs">
                              Put: {formatCurrency(cycle.putPremiums)}
                            </div>
                            <div className="text-blue-600 text-xs">
                              Call: {formatCurrency(cycle.callPremiums)}
                            </div>
                            <div className="font-semibold">
                              {formatCurrency(cycle.totalPremiums)}
                            </div>
                          </td>
                          <td className={`px-3 py-2 text-right font-medium ${cycle.capitalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(cycle.capitalGainLoss)}
                            <div className="text-xs text-gray-500">
                              ({cycle.capitalYield.toFixed(1)}%)
                            </div>
                          </td>
                          <td className={`px-3 py-2 text-right font-bold ${cycle.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(cycle.totalPnL)}
                          </td>
                          <td className={`px-3 py-2 text-right font-bold ${cycle.totalReturnPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {cycle.totalReturnPct.toFixed(2)}%
                          </td>
                          <td className={`px-3 py-2 text-right ${cycle.annualizedROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {cycle.annualizedROI.toFixed(1)}%
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              cycle.performanceCategory === 'Excellent' ? 'bg-green-100 text-green-800' :
                              cycle.performanceCategory === 'Good' ? 'bg-blue-100 text-blue-800' :
                              cycle.performanceCategory === 'Profitable' ? 'bg-yellow-100 text-yellow-800' :
                              cycle.performanceCategory === 'Loss' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {cycle.performanceCategory}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {cycle.dailyReturn.toFixed(3)}%/Tag
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Performance Insights */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Performance Insights:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-blue-800">Prämien-Strategie:</div>
                      <div className="text-blue-700">
                        Ø {((analysis.completedCycles.reduce((sum, c) => sum + c.premiumYield, 0) / analysis.completedCycles.length) || 0).toFixed(2)}% Prämien-Rendite
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-800">Timing-Analyse:</div>
                      <div className="text-blue-700">
                        Ø {analysis.portfolioStats.avgDuration.toFixed(0)} Tage Haltedauer
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-800">Risk-Reward:</div>
                      <div className="text-blue-700">
                        {analysis.portfolioStats.winRate.toFixed(0)}% Erfolgsquote bei Ø {analysis.portfolioStats.avgReturnPerTrade.toFixed(1)}% Return
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {analysis.assignments.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Alle Put-Assignments
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">Symbol</th>
                        <th className="px-4 py-2 text-left">Assignment Datum</th>
                        <th className="px-4 py-2 text-right">Assignment Preis</th>
                        <th className="px-4 py-2 text-right">Put Prämien</th>
                        <th className="px-4 py-2 text-right">Call Prämien</th>
                        <th className="px-4 py-2 text-right">Break-Even</th>
                        <th className="px-4 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.assignments.map((assignment, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="px-4 py-2 font-medium">{assignment.symbol}</td>
                          <td className="px-4 py-2">{formatDate(assignment.assignmentDate)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(assignment.assignmentPrice)}</td>
                          <td className="px-4 py-2 text-right text-green-600">{formatCurrency(assignment.putPremiums)}</td>
                          <td className="px-4 py-2 text-right text-blue-600">{formatCurrency(assignment.callPremiums)}</td>
                          <td className="px-4 py-2 text-right font-bold">{formatCurrency(assignment.effectiveBreakEven)}</td>
                          <td className="px-4 py-2 text-center">
                            {assignment.currentlyHeld ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Gehalten</span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Verkauft</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Instructions */}
        {!analysis && (
          <>
            {/* IB FlexQuery Setup Guide */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Interactive Brokers FlexQuery Setup
              </h3>
              
              <div className="space-y-4 text-amber-800">
                <div>
                  <h4 className="font-semibold mb-2">1. FlexQuery erstellen:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Login → Account Management → Reports → Flex Queries</li>
                    <li>Create New Flex Query → Activity Flex Query</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">2. Sections konfigurieren:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>✅ <strong>Trade Confirmations</strong> (NUR diese aktivieren!)</li>
                    <li>❌ Alle anderen Sections deaktivieren</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">3. Trade Confirmations Felder (ALLE erforderlich):</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-4 text-sm">
                    <div>• Symbol</div>
                    <div>• Underlying Symbol</div>
                    <div>• Asset Category</div>
                    <div>• Buy/Sell</div>
                    <div>• Quantity</div>
                    <div>• Price</div>
                    <div>• Proceeds</div>
                    <div>• Trade Date</div>
                    <div>• Strike</div>
                    <div>• Expiry</div>
                    <div>• Put/Call</div>
                    <div>• Commission</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">4. Delivery Configuration:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Format: <strong>XML</strong> (zwingend erforderlich)</li>
                    <li>Period: Custom Date Range (empfohlen: 1-2 Jahre)</li>
                    <li>Include Canceled Trades: <strong>No</strong></li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-amber-100 rounded text-sm text-amber-900">
                <strong>Wichtig:</strong> Das Tool benötigt NUR Trade Confirmations im XML-Format. 
                Andere Datentypen werden ignoriert.
              </div>
            </div>

            {/* How it works */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">So funktioniert die Analyse:</h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li><strong>Neue Analyse:</strong> Laden Sie XML-Dateien (IB Flex Queries) hoch</li>
                <li><strong>Fortschreibung:</strong> Laden Sie gespeicherte JSON-Analysen + neue XML-Dateien</li>
                <li><strong>Export:</strong> Speichern Sie Ihre Analyse als JSON für spätere Fortschreibung</li>
                <li><strong>CSV/XML:</strong> Exportieren Sie Performance-Daten für weitere Analysen</li>
                <li>Das System kombiniert automatisch alte und neue Daten ohne Duplikate</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WheelStrategyAnalyzer;