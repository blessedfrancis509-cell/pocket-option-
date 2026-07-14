/**
 * Pocket Option Chart Module
 * Uses TradingView Lightweight Charts with exact PO color scheme
 * 
 * PO uses a custom PixiJS-based WebGL chart engine internally.
 * We use TradingView Lightweight Charts as the closest open-source equivalent,
 * styled to match PO's exact visual appearance.
 * 
 * PO Chart Colors (Dark Blue theme, from platform/main.js):
 *   Candle Up:     #45b734
 *   Candle Down:   #ff3e1f
 *   Background:    #1b222f
 *   Grid:          rgba(115, 130, 153, 0.25)
 *   Text:          #888A95
 *   Call Line:     #49A744
 *   Put Line:      #FC380A
 *   Value Point:   #00b6f9
 *   Dead Line:     rgba(74, 118, 168, 0.8)
 *   Expiration:    rgba(74, 118, 168, 0.5)
 *   Price BG:      #32364F
 */

class POChart {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = {
            layout: {
                background: { color: '#1b222f' },
                textColor: '#888A95',
                fontSize: 11,
                fontFamily: 'Open Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
            grid: {
                vertLines: { color: 'rgba(115, 130, 153, 0.15)', style: 0, visible: true },
                horzLines: { color: 'rgba(115, 130, 153, 0.15)', style: 0, visible: true },
            },
            crosshair: {
                mode: 0,
                vertLine: {
                    color: 'rgba(74, 118, 168, 0.8)',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#32364F',
                },
                horzLine: {
                    color: 'rgba(74, 118, 168, 0.8)',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#32364F',
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(115, 130, 153, 0.2)',
                scaleMargins: { top: 0.08, bottom: 0.08 },
                autoScale: true,
                mode: 0,
            },
            timeScale: {
                borderColor: 'rgba(115, 130, 153, 0.2)',
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 5,
                barSpacing: 8,
                fixLeftEdge: false,
                fixRightEdge: true,
                minBarSpacing: 3,
            },
            handleScroll: { vertTouchDrag: false },
            ...options,
        };

        this.chart = null;
        this.series = {
            candles: null,
            line: null,
            bars: null,
        };
        this.currentChartType = 'candles';
        this.currentSymbol = 'EURUSD_otc';
        this.currentTimeframe = 60;
        this.data = [];
        this.tickInterval = null;
        this.isLoading = false;

        this.listeners = new Map();
    }

    async init() {
        await this.loadScript();
        this.createChart();
        this.generateInitialData();
        this.startLiveTick();
    }

    async loadScript() {
        if (window.LightweightCharts) return;
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://unpkg.com/lightweight-charts@4.1.2/dist/lightweight-charts.standalone.production.js';
            s.onload = () => resolve();
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    createChart() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = '';

        this.chart = LightweightCharts.createChart(container, {
            ...this.options,
            width: container.clientWidth,
            height: container.clientHeight,
        });

        this.series.candles = this.chart.addCandlestickSeries({
            upColor: '#45b734',
            downColor: '#ff3e1f',
            borderVisible: false,
            wickUpColor: '#45b734',
            wickDownColor: '#ff3e1f',
            priceFormat: { type: 'price', precision: 5, minMove: 0.00001 },
        });

        this.series.line = this.chart.addLineSeries({
            color: '#4a76a8',
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 3,
            crosshairMarkerBorderColor: '#00b6f9',
            crosshairMarkerBackgroundColor: '#00b6f9',
            priceFormat: { type: 'price', precision: 5, minMove: 0.00001 },
        });
        this.series.line.applyOptions({ visible: false });

        this.series.bars = this.chart.addBarSeries({
            upColor: '#45b734',
            downColor: '#ff3e1f',
            borderVisible: false,
            wickUpColor: '#45b734',
            wickDownColor: '#ff3e1f',
            priceFormat: { type: 'price', precision: 5, minMove: 0.00001 },
        });
        this.series.bars.applyOptions({ visible: false });

        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(container);
    }

    setChartType(type) {
        this.currentChartType = type;
        Object.values(this.series).forEach(s => {
            if (s) s.applyOptions({ visible: false });
        });

        switch (type) {
            case 'line':
                this.series.line.applyOptions({ visible: true });
                this.series.line.setData(this.data.map(d => ({ time: d.time, value: d.close })));
                break;
            case 'bars':
                this.series.bars.applyOptions({ visible: true });
                this.series.bars.setData(this.data);
                break;
            case 'heiken-ashi':
                this.series.candles.applyOptions({ visible: true });
                this.series.candles.setData(this.convertToHeikenAshi(this.data));
                break;
            case 'candles':
            default:
                this.series.candles.applyOptions({ visible: true });
                this.series.candles.setData(this.data);
                break;
        }
    }

    convertToHeikenAshi(candleData) {
        if (!candleData.length) return [];
        const ha = [];
        let haOpen = (candleData[0].open + candleData[0].close) / 2;

        for (let i = 0; i < candleData.length; i++) {
            const c = candleData[i];
            const haClose = (c.open + c.high + c.low + c.close) / 4;
            if (i === 0) {
                haOpen = (c.open + c.close) / 2;
            }
            const haHigh = Math.max(c.high, haOpen, haClose);
            const haLow = Math.min(c.low, haOpen, haClose);
            ha.push({ time: c.time, open: haOpen, high: haHigh, low: haLow, close: haClose });
            haOpen = (haOpen + haClose) / 2;
        }
        return ha;
    }

    generateInitialData() {
        const now = Math.floor(Date.now() / 1000);
        const base = this.getBasePrice(this.currentSymbol);
        let price = base;
        const precision = base > 100 ? 1 : 5;
        this.data = [];

        for (let i = 400; i >= 0; i--) {
            const time = now - i * this.currentTimeframe;
            const vol = this.getVolatility(this.currentSymbol);
            const change = (Math.random() - 0.5) * vol * 2;

            const open = price;
            const close = open * (1 + change);
            const high = Math.max(open, close) * (1 + Math.random() * vol * 0.4);
            const low = Math.min(open, close) * (1 - Math.random() * vol * 0.4);

            this.data.push({
                time,
                open: Number(open.toFixed(precision)),
                high: Number(high.toFixed(precision)),
                low: Number(low.toFixed(precision)),
                close: Number(close.toFixed(precision)),
            });
            price = close;
        }

        this.series.candles.setData(this.data);
    }

    startLiveTick() {
        if (this.tickInterval) clearInterval(this.tickInterval);
        this.tickInterval = setInterval(() => this.addTick(), 1000);
    }

    addTick() {
        if (!this.data.length) return;
        const last = this.data[this.data.length - 1];
        const vol = this.getVolatility(this.currentSymbol);
        const precision = this.getBasePrice(this.currentSymbol) > 100 ? 1 : 5;

        const change = (Math.random() - 0.5) * vol;
        const newClose = last.close * (1 + change);
        const newHigh = Math.max(last.high, newClose);
        const newLow = Math.min(last.low, newClose);

        this.data[this.data.length - 1] = {
            ...last,
            high: Number(newHigh.toFixed(precision)),
            low: Number(newLow.toFixed(precision)),
            close: Number(newClose.toFixed(precision)),
        };

        const visible = this.getVisibleSeries();
        if (this.currentChartType === 'heiken-ashi') {
            visible.setData(this.convertToHeikenAshi(this.data));
        } else if (this.currentChartType === 'line') {
            visible.setData(this.data.map(d => ({ time: d.time, value: d.close })));
        } else {
            visible.setData(this.data);
        }

        this.emit('tick', this.data[this.data.length - 1]);
    }

    addNewCandle() {
        if (!this.data.length) return;
        const last = this.data[this.data.length - 1];
        const vol = this.getVolatility(this.currentSymbol);
        const precision = this.getBasePrice(this.currentSymbol) > 100 ? 1 : 5;

        const newCandle = {
            time: last.time + this.currentTimeframe,
            open: last.close,
            high: Number((last.close * (1 + Math.random() * vol * 0.2)).toFixed(precision)),
            low: Number((last.close * (1 - Math.random() * vol * 0.2)).toFixed(precision)),
            close: Number((last.close * (1 + (Math.random() - 0.5) * vol)).toFixed(precision)),
        };
        newCandle.high = Math.max(newCandle.high, newCandle.open, newCandle.close);
        newCandle.low = Math.min(newCandle.low, newCandle.open, newCandle.close);

        this.data.push(newCandle);
        if (this.data.length > 500) this.data.shift();

        const visible = this.getVisibleSeries();
        if (this.currentChartType === 'heiken-ashi') {
            visible.setData(this.convertToHeikenAshi(this.data));
        } else {
            visible.setData(this.data);
        }
    }

    getVisibleSeries() {
        return this.series[this.currentChartType === 'heiken-ashi' ? 'candles' : this.currentChartType] || this.series.candles;
    }

    setSymbol(symbol) {
        this.currentSymbol = symbol;
        this.generateInitialData();
        this.setChartType(this.currentChartType);
        this.emit('symbol:change', symbol);
    }

    setTimeframe(tf) {
        this.currentTimeframe = tf;
        this.generateInitialData();
        this.setChartType(this.currentChartType);
        this.emit('timeframe:change', tf);
    }

    getCurrentPrice() {
        if (!this.data.length) return 0;
        return this.data[this.data.length - 1].close;
    }

    getBasePrice(symbol) {
        const prices = {
            'EURUSD_otc': 1.08500, 'GBPUSD_otc': 1.26500, 'USDJPY_otc': 149.500,
            'AUDUSD_otc': 0.65500, 'USDCAD_otc': 1.35500, 'EURGBP_otc': 0.85500,
            'EURJPY_otc': 162.500, 'BTCUSD': 43500, 'ETHUSD': 2350,
            'XAUUSD': 2050, 'USOIL': 75,
        };
        return prices[symbol] || 1.00000;
    }

    getVolatility(symbol) {
        const vols = {
            'EURUSD_otc': 0.0003, 'GBPUSD_otc': 0.0004, 'USDJPY_otc': 0.03,
            'AUDUSD_otc': 0.0003, 'USDCAD_otc': 0.0003, 'EURGBP_otc': 0.0003,
            'BTCUSD': 30, 'ETHUSD': 10, 'XAUUSD': 2, 'USOIL': 0.5,
        };
        return vols[symbol] || 0.0003;
    }

    getPrecision() {
        return this.getBasePrice(this.currentSymbol) > 100 ? 1 : 5;
    }

    resize() {
        const container = document.getElementById(this.containerId);
        if (container && this.chart) {
            this.chart.applyOptions({
                width: container.clientWidth,
                height: container.clientHeight,
            });
        }
    }

    destroy() {
        if (this.tickInterval) clearInterval(this.tickInterval);
        if (this.resizeObserver) this.resizeObserver.disconnect();
        if (this.chart) {
            this.chart.remove();
            this.chart = null;
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) this.listeners.set(event, []);
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const cbs = this.listeners.get(event);
            const idx = cbs.indexOf(callback);
            if (idx > -1) cbs.splice(idx, 1);
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(cb => cb(data));
        }
    }
}

window.POChart = POChart;
if (typeof module !== 'undefined') module.exports = POChart;
