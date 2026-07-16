/**
 * Pocket Option Chart Module — Custom Canvas Rendering
 * Exact visual replica of PO's PixiJS WebGL chart engine.
 * No TradingView, no external libraries. Pure HTML5 Canvas.
 *
 * PO Chart Colors (Dark-Blue theme, from platform/main.js):
 *   Canvas BG:      #1e2229
 *   Candle Up:      #45b734
 *   Candle Down:    #ff3e1f
 *   Grid Lines:     rgba(115, 130, 153, 0.25)
 *   Grid Text:      #888A95
 *   Grid Text Alt:  #a2a4ac
 *   Price Line:     #4a76a8
 *   Price Dot:      #00b6f9
 *   Crosshair:      rgba(74, 118, 168, 0.8)
 *   Value BG:       #32364F
 *   Call Line:      #49A744
 *   Put Line:       #FC380A
 *   Deadline Line:  rgba(74, 118, 168, 0.8)
 *   Expiration:     rgba(74, 118, 168, 0.5)
 *   Candle Values:  #7e91a7
 *   Min/Max BG:     rgba(50, 54, 79, 0.45)
 *   Min/Max Text:   #74869F
 */

class POChart {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = options;

        this.canvas = null;
        this.ctx = null;
        this.dpr = window.devicePixelRatio || 1;

        // Chart dimensions
        this.width = 0;
        this.height = 0;
        this.padding = { top: 10, right: 60, bottom: 30, left: 0 };
        this.rightScaleWidth = 55;

        // Colors — exact PO dark-blue theme
        this.colors = {
            background: '#1e2229',
            gridLines: 'rgba(115, 130, 153, 0.18)',
            gridText: '#888A95',
            gridTextAlt: '#a2a4ac',
            candleUp: '#45b734',
            candleDown: '#ff3e1f',
            wickUp: '#45b734',
            wickDown: '#ff3e1f',
            priceLine: '#4a76a8',
            priceDot: '#00b6f9',
            priceDotGlow: 'rgba(0, 182, 249, 0.3)',
            valueBg: '#32364F',
            valueText: '#ffffff',
            crosshair: 'rgba(74, 118, 168, 0.8)',
            crosshairLabel: '#32364F',
            lineColor: '#4a76a8',
            lineGradTop: 'rgba(74, 118, 168, 0.4)',
            lineGradBottom: 'rgba(74, 118, 168, 0.05)',
            callLine: '#49A744',
            putLine: '#FC380A',
            deadlineLine: 'rgba(74, 118, 168, 0.8)',
            expirationLine: 'rgba(74, 118, 168, 0.5)',
            deadlineText: '#86a3c5',
            candleValues: '#7e91a7',
            minMaxBg: 'rgba(50, 54, 79, 0.55)',
            minMaxText: '#74869F',
            borderColor: 'rgba(115, 130, 153, 0.15)',
        };

        // Data
        this.data = [];
        this.currentChartType = 'candles'; // 'candles' | 'line' | 'bars' | 'heiken-ashi'
        this.currentSymbol = 'EURUSD_otc';
        this.currentTimeframe = 60;
        this.tickInterval = null;

        // Viewport — how many candles visible, scroll offset
        this.visibleBars = 80;
        this.scrollOffset = 0;
        this.barSpacing = 0;

        // Mouse state
        this.mouseX = -1;
        this.mouseY = -1;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartOffset = 0;

        // Animation
        this.animFrame = null;
        this.needsRedraw = true;

        // Price range
        this.priceMin = 0;
        this.priceMax = 0;
        this.priceRange = 0;

        // Event listeners
        this.listeners = new Map();
    }

    init() {
        this.createCanvas();
        this.generateInitialData();
        this.bindEvents();
        this.startLiveTick();
        this.startRenderLoop();
    }

    createCanvas() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = '';
        container.style.position = 'relative';
        container.style.overflow = 'hidden';

        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resize();
    }

    resize() {
        const container = document.getElementById(this.containerId);
        if (!container || !this.canvas) return;

        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);

        this.chartWidth = this.width - this.padding.left - this.rightScaleWidth;
        this.chartHeight = this.height - this.padding.top - this.padding.bottom;

        this.calculateBarWidth();
        this.markDirty();
    }

    calculateBarWidth() {
        const maxBarWidth = Math.max(2, (this.chartWidth / this.visibleBars) * 0.65);
        this.barWidth = Math.min(maxBarWidth, 12);
        this.barSpacing = this.chartWidth / this.visibleBars;
    }

    // ─── DATA GENERATION ──────────────────────────────────────────────

    generateInitialData() {
        const now = Math.floor(Date.now() / 1000);
        const base = this.getBasePrice(this.currentSymbol);
        let price = base;
        const precision = this.getPrecision();
        this.data = [];

        const totalCandles = this.visibleBars + 200;
        for (let i = totalCandles; i >= 0; i--) {
            const time = now - i * this.currentTimeframe;
            const vol = this.getVolatility(this.currentSymbol);
            const change = (Math.random() - 0.48) * vol * 2;

            const open = price;
            const close = open * (1 + change);
            const high = Math.max(open, close) * (1 + Math.random() * vol * 0.3);
            const low = Math.min(open, close) * (1 - Math.random() * vol * 0.3);

            this.data.push({
                time,
                open: Number(open.toFixed(precision)),
                high: Number(high.toFixed(precision)),
                low: Number(low.toFixed(precision)),
                close: Number(close.toFixed(precision)),
            });
            price = close;
        }

        this.scrollOffset = 0;
        this.markDirty();
    }

    addTick() {
        if (!this.data.length) return;
        const last = this.data[this.data.length - 1];
        const vol = this.getVolatility(this.currentSymbol);
        const precision = this.getPrecision();

        const change = (Math.random() - 0.48) * vol;
        const newClose = last.close * (1 + change);
        const newHigh = Math.max(last.high, newClose);
        const newLow = Math.min(last.low, newClose);

        this.data[this.data.length - 1] = {
            ...last,
            high: Number(newHigh.toFixed(precision)),
            low: Number(newLow.toFixed(precision)),
            close: Number(newClose.toFixed(precision)),
        };

        this.emit('tick', this.data[this.data.length - 1]);
        this.markDirty();
    }

    addNewCandle() {
        if (!this.data.length) return;
        const last = this.data[this.data.length - 1];
        const vol = this.getVolatility(this.currentSymbol);
        const precision = this.getPrecision();

        const newCandle = {
            time: last.time + this.currentTimeframe,
            open: last.close,
            high: 0, low: 0, close: 0,
        };
        newCandle.close = Number((last.close * (1 + (Math.random() - 0.48) * vol)).toFixed(precision));
        newCandle.high = Number(Math.max(newCandle.open, newCandle.close, last.close * (1 + Math.random() * vol * 0.15)).toFixed(precision));
        newCandle.low = Number(Math.min(newCandle.open, newCandle.close, last.close * (1 - Math.random() * vol * 0.15)).toFixed(precision));

        this.data.push(newCandle);
        if (this.data.length > 800) this.data.shift();
        this.markDirty();
    }

    startLiveTick() {
        if (this.tickInterval) clearInterval(this.tickInterval);
        let tickCount = 0;
        this.tickInterval = setInterval(() => {
            tickCount++;
            if (tickCount % this.currentTimeframe === 0) {
                this.addNewCandle();
            } else {
                this.addTick();
            }
        }, 1000);
    }

    // ─── RENDERING ────────────────────────────────────────────────────

    startRenderLoop() {
        const loop = () => {
            if (this.needsRedraw) {
                this.draw();
                this.needsRedraw = false;
            }
            this.animFrame = requestAnimationFrame(loop);
        };
        loop();
    }

    markDirty() {
        this.needsRedraw = true;
    }

    draw() {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, w, h);

        // Get visible data slice
        const totalVisible = this.data.length;
        const startIdx = Math.max(0, totalVisible - this.visibleBars - this.scrollOffset);
        const endIdx = Math.min(totalVisible - this.scrollOffset, totalVisible);
        const visible = this.data.slice(startIdx, endIdx);

        if (visible.length === 0) return;

        // Calculate price range from visible data
        let minPrice = Infinity, maxPrice = -Infinity;
        for (const c of visible) {
            if (c.low < minPrice) minPrice = c.low;
            if (c.high > maxPrice) maxPrice = c.high;
        }
        const pricePad = (maxPrice - minPrice) * 0.08 || 0.001;
        this.priceMin = minPrice - pricePad;
        this.priceMax = maxPrice + pricePad;
        this.priceRange = this.priceMax - this.priceMin;

        // Draw grid lines
        this.drawGrid(ctx, visible);

        // Draw chart based on type
        switch (this.currentChartType) {
            case 'line':
                this.drawLineChart(ctx, visible, startIdx);
                break;
            case 'bars':
                this.drawBarChart(ctx, visible, startIdx);
                break;
            case 'heiken-ashi':
                this.drawCandleChart(ctx, this.convertToHeikenAshi(visible), startIdx);
                break;
            default:
                this.drawCandleChart(ctx, visible, startIdx);
                break;
        }

        // Draw crosshair
        if (this.mouseX >= this.padding.left && this.mouseX <= this.chartWidth + this.padding.left &&
            this.mouseY >= this.padding.top && this.mouseY <= this.height - this.padding.bottom) {
            this.drawCrosshair(ctx, visible, startIdx);
        }

        // Draw current price line
        this.drawCurrentPriceLine(ctx, visible, startIdx);

        // Draw right price scale
        this.drawPriceScale(ctx);

        // Draw timeline
        this.drawTimeline(ctx, visible, startIdx);

        // Draw min/max labels
        this.drawMinMaxLabels(ctx, visible);
    }

    drawGrid(ctx, visible) {
        ctx.save();
        ctx.strokeStyle = this.colors.gridLines;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);

        // Horizontal grid lines — ~6 lines
        const numHLines = 6;
        const step = this.chartHeight / numHLines;
        for (let i = 0; i <= numHLines; i++) {
            const y = this.padding.top + i * step;
            ctx.beginPath();
            ctx.moveTo(this.padding.left, Math.round(y) + 0.5);
            ctx.lineTo(this.chartWidth + this.padding.left, Math.round(y) + 0.5);
            ctx.stroke();
        }

        // Vertical grid lines — every ~10 candles
        const numVLines = Math.floor(visible.length / 10);
        const vStep = this.chartWidth / visible.length;
        for (let i = 0; i < visible.length; i += 10) {
            const x = this.padding.left + i * vStep + vStep;
            ctx.beginPath();
            ctx.setLineDash([2, 3]);
            ctx.moveTo(Math.round(x) + 0.5, this.padding.top);
            ctx.lineTo(Math.round(x) + 0.5, this.padding.top + this.chartHeight);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.restore();
    }

    priceToY(price) {
        return this.padding.top + this.chartHeight * (1 - (price - this.priceMin) / this.priceRange);
    }

    indexToX(idx, totalVisible, startIdx) {
        const relativeIdx = idx;
        const vStep = this.chartWidth / totalVisible;
        return this.padding.left + relativeIdx * vStep + vStep / 2;
    }

    drawCandleChart(ctx, candles, startIdx) {
        const total = candles.length;
        const vStep = this.chartWidth / total;
        const bw = Math.max(1, Math.min(this.barWidth, vStep * 0.6));

        for (let i = 0; i < candles.length; i++) {
            const c = candles[i];
            const x = this.padding.left + i * vStep + vStep / 2;
            const isUp = c.close >= c.open;
            const color = isUp ? this.colors.candleUp : this.colors.candleDown;

            // Wick
            const wickX = Math.round(x) + 0.5;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(wickX, this.priceToY(c.high));
            ctx.lineTo(wickX, this.priceToY(c.low));
            ctx.stroke();

            // Body
            const bodyTop = this.priceToY(Math.max(c.open, c.close));
            const bodyBot = this.priceToY(Math.min(c.open, c.close));
            const bodyHeight = Math.max(1, bodyBot - bodyTop);

            ctx.fillStyle = color;
            ctx.fillRect(Math.round(x - bw / 2), Math.round(bodyTop), Math.round(bw), Math.round(bodyHeight));
        }
    }

    drawBarChart(ctx, candles, startIdx) {
        const total = candles.length;
        const vStep = this.chartWidth / total;
        const bw = Math.max(1, Math.min(this.barWidth, vStep * 0.6));

        ctx.lineWidth = 1;
        for (let i = 0; i < candles.length; i++) {
            const c = candles[i];
            const x = this.padding.left + i * vStep + vStep / 2;
            const isUp = c.close >= c.open;
            const color = isUp ? this.colors.candleUp : this.colors.candleDown;

            ctx.strokeStyle = color;
            ctx.fillStyle = color;

            // Vertical line (high to low)
            const wx = Math.round(x) + 0.5;
            ctx.beginPath();
            ctx.moveTo(wx, this.priceToY(c.high));
            ctx.lineTo(wx, this.priceToY(c.low));
            ctx.stroke();

            // Left tick (open)
            const openY = this.priceToY(c.open);
            ctx.beginPath();
            ctx.moveTo(wx - bw / 2, openY);
            ctx.lineTo(wx, openY);
            ctx.stroke();

            // Right tick (close)
            const closeY = this.priceToY(c.close);
            ctx.beginPath();
            ctx.moveTo(wx, closeY);
            ctx.lineTo(wx + bw / 2, closeY);
            ctx.stroke();
        }
    }

    drawLineChart(ctx, candles, startIdx) {
        if (candles.length < 2) return;
        const total = candles.length;
        const vStep = this.chartWidth / total;

        ctx.save();

        // Area fill gradient
        const grad = ctx.createLinearGradient(0, this.padding.top, 0, this.padding.top + this.chartHeight);
        grad.addColorStop(0, this.colors.lineGradTop);
        grad.addColorStop(1, this.colors.lineGradBottom);

        ctx.beginPath();
        ctx.moveTo(this.padding.left + vStep / 2, this.priceToY(candles[0].close));
        for (let i = 1; i < candles.length; i++) {
            const x = this.padding.left + i * vStep + vStep / 2;
            const y = this.priceToY(candles[i].close);
            ctx.lineTo(x, y);
        }
        // Fill under line
        const lastX = this.padding.left + (candles.length - 1) * vStep + vStep / 2;
        ctx.lineTo(lastX, this.padding.top + this.chartHeight);
        ctx.lineTo(this.padding.left + vStep / 2, this.padding.top + this.chartHeight);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Line itself
        ctx.beginPath();
        ctx.moveTo(this.padding.left + vStep / 2, this.priceToY(candles[0].close));
        for (let i = 1; i < candles.length; i++) {
            const x = this.padding.left + i * vStep + vStep / 2;
            const y = this.priceToY(candles[i].close);
            ctx.lineTo(x, y);
        }
        ctx.strokeStyle = this.colors.lineColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    drawCurrentPriceLine(ctx, visible, startIdx) {
        if (!visible.length) return;
        const lastCandle = visible[visible.length - 1];
        const price = lastCandle.close;
        const y = this.priceToY(price);
        const isUp = visible.length > 1 ? price >= visible[visible.length - 2].close : true;
        const priceColor = isUp ? this.colors.candleUp : this.colors.candleDown;

        ctx.save();

        // Dashed price line
        ctx.strokeStyle = this.colors.priceLine;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(this.padding.left, Math.round(y) + 0.5);
        ctx.lineTo(this.chartWidth + this.padding.left, Math.round(y) + 0.5);
        ctx.stroke();
        ctx.setLineDash([]);

        // Price label on right scale
        const labelW = 55;
        const labelH = 20;
        const labelX = this.chartWidth + this.padding.left + 2;
        const labelY = y - labelH / 2;

        ctx.fillStyle = this.colors.valueBg;
        this.roundRect(ctx, labelX, labelY, labelW, labelH, 3);
        ctx.fill();

        ctx.fillStyle = this.colors.valueText;
        ctx.font = '11px "Noto Sans", -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(price.toFixed(this.getPrecision()), labelX + labelW / 2, y);

        // Glowing dot at current price
        ctx.beginPath();
        ctx.arc(this.chartWidth + this.padding.left, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.priceDot;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(this.chartWidth + this.padding.left, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.priceDotGlow;
        ctx.fill();

        ctx.restore();
    }

    drawCrosshair(ctx, visible, startIdx) {
        const mx = this.mouseX;
        const my = this.mouseY;

        ctx.save();

        // Vertical line
        ctx.strokeStyle = this.colors.crosshair;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(mx, this.padding.top);
        ctx.lineTo(mx, this.padding.top + this.chartHeight);
        ctx.stroke();

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(this.padding.left, my);
        ctx.lineTo(this.chartWidth + this.padding.left, my);
        ctx.stroke();
        ctx.setLineDash([]);

        // Time label at bottom
        const vStep = this.chartWidth / visible.length;
        const candleIdx = Math.floor((mx - this.padding.left) / vStep);
        if (candleIdx >= 0 && candleIdx < visible.length) {
            const candle = visible[candleIdx];
            const timeStr = this.formatTime(candle.time);
            const labelW = 48;
            const labelH = 18;
            const lx = mx - labelW / 2;
            const ly = this.padding.top + this.chartHeight + 2;

            ctx.fillStyle = this.colors.crosshairLabel;
            this.roundRect(ctx, lx, ly, labelW, labelH, 3);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '10px "Noto Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(timeStr, mx, ly + labelH / 2);
        }

        // Price label on right
        const priceAtMouse = this.yToPrice(my);
        const plabelW = 55;
        const plabelH = 18;
        const plx = this.chartWidth + this.padding.left + 2;
        const ply = my - plabelH / 2;

        ctx.fillStyle = this.colors.crosshairLabel;
        this.roundRect(ctx, plx, ply, plabelW, plabelH, 3);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '11px "Noto Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(priceAtMouse.toFixed(this.getPrecision()), plx + plabelW / 2, my);

        ctx.restore();
    }

    drawPriceScale(ctx) {
        ctx.save();
        const numLabels = 6;
        const step = this.priceRange / numLabels;

        ctx.fillStyle = this.colors.gridText;
        ctx.font = '11px "Noto Sans", -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const x = this.chartWidth + this.padding.left + 8;

        for (let i = 0; i <= numLabels; i++) {
            const price = this.priceMin + step * i;
            const y = this.priceToY(price);
            ctx.fillText(price.toFixed(this.getPrecision()), x, y);
        }

        // Right border
        ctx.strokeStyle = this.colors.borderColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.chartWidth + this.padding.left + 0.5, this.padding.top);
        ctx.lineTo(this.chartWidth + this.padding.left + 0.5, this.padding.top + this.chartHeight);
        ctx.stroke();

        ctx.restore();
    }

    drawTimeline(ctx, visible, startIdx) {
        if (!visible.length) return;
        ctx.save();

        const y = this.padding.top + this.chartHeight + 22;
        ctx.fillStyle = this.colors.gridText;
        ctx.font = '10px "Noto Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const vStep = this.chartWidth / visible.length;
        for (let i = 0; i < visible.length; i += 10) {
            const x = this.padding.left + i * vStep + vStep / 2;
            const label = this.formatTimeShort(visible[i].time);
            ctx.fillText(label, x, y);
        }

        // Bottom border
        ctx.strokeStyle = this.colors.borderColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.padding.left, this.padding.top + this.chartHeight + 0.5);
        ctx.lineTo(this.chartWidth + this.padding.left, this.padding.top + this.chartHeight + 0.5);
        ctx.stroke();

        ctx.restore();
    }

    drawMinMaxLabels(ctx, visible) {
        if (visible.length < 2) return;

        let minIdx = 0, maxIdx = 0;
        let minP = Infinity, maxP = -Infinity;
        for (let i = 0; i < visible.length; i++) {
            if (visible[i].low < minP) { minP = visible[i].low; minIdx = i; }
            if (visible[i].high > maxP) { maxP = visible[i].high; maxIdx = i; }
        }

        const total = visible.length;
        const vStep = this.chartWidth / total;

        const drawLabel = (idx, price, text, isTop) => {
            const x = this.padding.left + idx * vStep + vStep / 2;
            const y = this.priceToY(price);
            const label = text + ' ' + price.toFixed(this.getPrecision());
            const tw = ctx.measureText(label).width;

            ctx.font = '10px "Noto Sans", sans-serif';
            const w = tw + 12;
            const h = 16;
            const lx = x - w / 2;
            const ly = isTop ? y - h - 4 : y + 4;

            ctx.fillStyle = this.colors.minMaxBg;
            this.roundRect(ctx, lx, ly, w, h, 3);
            ctx.fill();

            ctx.fillStyle = this.colors.minMaxText;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x, ly + h / 2);
        };

        ctx.save();
        drawLabel(minIdx, minP, 'Low', false);
        drawLabel(maxIdx, maxP, 'High', true);
        ctx.restore();
    }

    // ─── HEIKEN ASHI CONVERSION ───────────────────────────────────────

    convertToHeikenAshi(candleData) {
        if (!candleData.length) return [];
        const ha = [];
        let haOpen = (candleData[0].open + candleData[0].close) / 2;

        for (let i = 0; i < candleData.length; i++) {
            const c = candleData[i];
            const haClose = (c.open + c.high + c.low + c.close) / 4;
            if (i === 0) haOpen = (c.open + c.close) / 2;
            const haHigh = Math.max(c.high, haOpen, haClose);
            const haLow = Math.min(c.low, haOpen, haClose);
            ha.push({ time: c.time, open: haOpen, high: haHigh, low: haLow, close: haClose });
            haOpen = (haOpen + haClose) / 2;
        }
        return ha;
    }

    // ─── EVENTS ───────────────────────────────────────────────────────

    bindEvents() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;

            if (this.isDragging) {
                const dx = e.clientX - this.dragStartX;
                const candleDelta = Math.round(dx / this.barSpacing);
                this.scrollOffset = Math.max(0, this.dragStartOffset - candleDelta);
            }

            this.markDirty();
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mouseX = -1;
            this.mouseY = -1;
            this.markDirty();
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartOffset = this.scrollOffset;
            this.canvas.style.cursor = 'grabbing';
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            if (this.canvas) this.canvas.style.cursor = 'crosshair';
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 5 : -5;
            this.visibleBars = Math.max(20, Math.min(200, this.visibleBars + delta));
            this.calculateBarWidth();
            this.markDirty();
        }, { passive: false });

        this.canvas.style.cursor = 'crosshair';

        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(container);
    }

    // ─── HELPERS ──────────────────────────────────────────────────────

    yToPrice(y) {
        return this.priceMin + this.priceRange * (1 - (y - this.padding.top) / this.chartHeight);
    }

    formatTime(ts) {
        const d = new Date(ts * 1000);
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return h + ':' + m;
    }

    formatTimeShort(ts) {
        const d = new Date(ts * 1000);
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return h + ':' + m;
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // ─── PUBLIC API (same as before) ──────────────────────────────────

    setChartType(type) {
        this.currentChartType = type;
        this.markDirty();
    }

    setSymbol(symbol) {
        this.currentSymbol = symbol;
        this.generateInitialData();
        this.emit('symbol:change', symbol);
    }

    setTimeframe(tf) {
        this.currentTimeframe = tf;
        this.generateInitialData();
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
        return this.getBasePrice(this.currentSymbol) > 100 ? 2 : 5;
    }

    destroy() {
        if (this.tickInterval) clearInterval(this.tickInterval);
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        if (this.resizeObserver) this.resizeObserver.disconnect();
        this.canvas = null;
        this.ctx = null;
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
