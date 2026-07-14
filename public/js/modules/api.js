/**
 * Pocket Option API Module
 * Complete mock backend simulating real Pocket Option API
 */

class POAPI {
    constructor() {
        this.token = localStorage.getItem('po_token') || null;
        this.user = JSON.parse(localStorage.getItem('po_user') || 'null');
        this.listeners = new Map();
        this.initDemoData();
    }
    
    initDemoData() {
        if (!localStorage.getItem('po_balances')) {
            localStorage.setItem('po_balances', JSON.stringify({
                demo: 10000.00,
                real: 0.00,
                currency: 'USD'
            }));
        }
        if (!localStorage.getItem('po_trades')) {
            localStorage.setItem('po_trades', JSON.stringify([]));
        }
        if (!localStorage.getItem('po_transactions')) {
            localStorage.setItem('po_transactions', JSON.stringify([]));
        }
        if (!localStorage.getItem('po_users')) {
            localStorage.setItem('po_users', JSON.stringify([]));
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ============ AUTH ============
    
    async register(data) {
        await this.delay(1000);
        
        const users = JSON.parse(localStorage.getItem('po_users') || '[]');
        if (users.find(u => u.email === data.email)) {
            throw new Error('Email already registered');
        }
        
        const user = {
            id: 'user_' + Date.now(),
            email: data.email,
            password: btoa(data.password),
            firstName: data.firstName,
            lastName: data.lastName,
            country: data.country || 'US',
            currency: data.currency || 'USD',
            isVerified: false,
            kycStatus: 'pending',
            createdAt: new Date().toISOString(),
            balances: { demo: 10000, real: 0, currency: data.currency || 'USD' }
        };
        
        users.push(user);
        localStorage.setItem('po_users', JSON.stringify(users));
        
        return this.login(data.email, data.password);
    }
    
    async login(email, password) {
        await this.delay(800);
        
        const users = JSON.parse(localStorage.getItem('po_users') || '[]');
        const user = users.find(u => u.email === email && atob(u.password) === password);
        
        if (!user) throw new Error('Invalid email or password');
        
        this.token = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.user = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            country: user.country,
            currency: user.currency,
            balances: user.balances,
            isVerified: user.isVerified,
            kycStatus: user.kycStatus
        };
        
        localStorage.setItem('po_token', this.token);
        localStorage.setItem('po_user', JSON.stringify(this.user));
        
        this.emit('auth:login', this.user);
        return { user: this.user, token: this.token };
    }
    
    async logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('po_token');
        localStorage.removeItem('po_user');
        this.emit('auth:logout');
    }
    
    async restoreSession() {
        return this.user;
    }
    
    isAuthenticated() {
        return !!this.token && !!this.user;
    }
    
    // ============ BALANCE ============
    
    getBalances() {
        return JSON.parse(localStorage.getItem('po_balances') || '{\"demo\":10000,\"real\":0,\"currency\":\"USD\"}');
    }
    
    updateBalance(accountType, amount) {
        const balances = this.getBalances();
        balances[accountType] = Math.max(0, (balances[accountType] || 0) + amount);
        localStorage.setItem('po_balances', JSON.stringify(balances));
        
        if (this.user) {
            this.user.balances = balances;
            localStorage.setItem('po_user', JSON.stringify(this.user));
        }
        
        this.emit('balance:update', balances);
        return balances;
    }
    
    async switchAccount(type) {
        this.emit('account:switch', type);
        return this.getBalances();
    }
    
    // ============ TRADING ============
    
    getCurrentPrice(symbol) {
        const basePrices = {
            'EURUSD_otc': 1.08500, 'GBPUSD_otc': 1.26500, 'USDJPY_otc': 149.500,
            'AUDUSD_otc': 0.65500, 'USDCAD_otc': 1.35500, 'EURGBP_otc': 0.85500,
            'BTCUSD': 43500, 'ETHUSD': 2350, 'XAUUSD': 2050, 'USOIL': 75
        };
        const base = basePrices[symbol] || 1.0000;
        return base + (Math.random() - 0.5) * (base > 100 ? 1 : (base > 10 ? 0.01 : 0.0002));
    }
    
    getPayout(symbol) {
        const payouts = {
            'EURUSD_otc': 85, 'GBPUSD_otc': 85, 'USDJPY_otc': 85,
            'AUDUSD_otc': 82, 'USDCAD_otc': 82, 'EURGBP_otc': 80,
            'BTCUSD': 90, 'ETHUSD': 88, 'XAUUSD': 85, 'USOIL': 83
        };
        return payouts[symbol] || 80;
    }
    
    async placeTrade(symbol, amount, direction, duration, type = 'turbo') {
        await this.delay(300);
        
        if (!this.user) throw new Error('Not authenticated');
        
        const balances = this.getBalances();
        const accountType = balances.demo > 0 ? 'demo' : 'real';
        
        if (balances[accountType] < amount) {
            throw new Error('Insufficient balance');
        }
        
        // Deduct amount immediately
        this.updateBalance(accountType, -amount);
        
        const trade = {
            id: 'trade_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            userId: this.user.id,
            symbol,
            amount,
            direction, // 'call' or 'put'
            duration, // seconds
            type, // 'turbo', 'classic'
            entryPrice: this.getCurrentPrice(symbol),
            status: 'active',
            openedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + duration * 1000).toISOString(),
            payout: amount * (1 + this.getPayout(symbol) / 100),
            profit: 0,
            accountType
        };
        
        const trades = this.getTrades();
        trades.unshift(trade);
        localStorage.setItem('po_trades', JSON.stringify(trades));
        
        // Resolve trade after duration
        this.resolveTrade(trade.id);
        
        this.emit('trade:opened', trade);
        return trade;
    }
    
    async resolveTrade(tradeId) {
        const trades = this.getTrades();
        const trade = trades.find(t => t.id === tradeId);
        if (!trade || trade.status !== 'active') return;
        
        const waitTime = new Date(trade.expiresAt).getTime() - Date.now();
        await this.delay(Math.max(waitTime, 1000));
        
        // Re-fetch in case trade was modified
        const updatedTrades = this.getTrades();
        const updatedTrade = updatedTrades.find(t => t.id === tradeId);
        if (!updatedTrade || updatedTrade.status !== 'active') return;
        
        const currentPrice = this.getCurrentPrice(trade.symbol);
        const entryPrice = trade.entryPrice;
        
        let won = false;
        if (trade.direction === 'call') {
            won = currentPrice > entryPrice;
        } else {
            won = currentPrice < entryPrice;
        }
        
        updatedTrade.status = 'closed';
        updatedTrade.closePrice = currentPrice;
        updatedTrade.closedAt = new Date().toISOString();
        
        if (won) {
            updatedTrade.profit = updatedTrade.payout - updatedTrade.amount;
            updatedTrade.result = 'win';
            this.updateBalance(trade.accountType, updatedTrade.payout);
        } else {
            updatedTrade.profit = -updatedTrade.amount;
            updatedTrade.result = 'loss';
        }
        
        localStorage.setItem('po_trades', JSON.stringify(updatedTrades));
        this.emit('trade:closed', updatedTrade);
    }
    
    getTrades() {
        return JSON.parse(localStorage.getItem('po_trades') || '[]');
    }
    
    getTradeHistory(filters = {}) {
        let trades = this.getTrades();
        
        if (filters.status) trades = trades.filter(t => t.status === filters.status);
        if (filters.symbol) trades = trades.filter(t => t.symbol === filters.symbol);
        if (filters.from) trades = trades.filter(t => new Date(t.openedAt) >= new Date(filters.from));
        if (filters.to) trades = trades.filter(t => new Date(t.openedAt) <= new Date(filters.to));
        
        return trades;
    }
    
    // ============ DEPOSIT/WITHDRAWAL ============
    
    async deposit(amount, method) {
        await this.delay(1500);
        
        const txn = {
            id: 'txn_' + Date.now(),
            userId: this.user?.id,
            type: 'deposit',
            amount,
            currency: 'USD',
            method,
            status: 'completed',
            createdAt: new Date().toISOString()
        };
        
        this.addTransaction(txn);
        this.updateBalance('real', amount);
        
        this.emit('deposit:complete', txn);
        return txn;
    }
    
    async withdraw(amount, method, details) {
        await this.delay(2000);
        
        const balances = this.getBalances();
        if (balances.real < amount) throw new Error('Insufficient real balance');
        
        const txn = {
            id: 'txn_' + Date.now(),
            userId: this.user?.id,
            type: 'withdrawal',
            amount,
            currency: 'USD',
            method,
            details,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        this.addTransaction(txn);
        this.updateBalance('real', -amount);
        
        this.emit('withdrawal:requested', txn);
        return txn;
    }
    
    addTransaction(txn) {
        const transactions = this.getTransactions();
        transactions.unshift(txn);
        localStorage.setItem('po_transactions', JSON.stringify(transactions));
    }
    
    getTransactions() {
        return JSON.parse(localStorage.getItem('po_transactions') || '[]');
    }
    
    // ============ MARKET DATA ============
    
    getAssets() {
        return [
            { id: 'EURUSD_otc', name: 'EUR/USD (OTC)', type: 'forex', payout: 85, isOTC: true, icon: '💱' },
            { id: 'GBPUSD_otc', name: 'GBP/USD (OTC)', type: 'forex', payout: 85, isOTC: true, icon: '💱' },
            { id: 'USDJPY_otc', name: 'USD/JPY (OTC)', type: 'forex', payout: 85, isOTC: true, icon: '💱' },
            { id: 'AUDUSD_otc', name: 'AUD/USD (OTC)', type: 'forex', payout: 82, isOTC: true, icon: '💱' },
            { id: 'USDCAD_otc', name: 'USD/CAD (OTC)', type: 'forex', payout: 82, isOTC: true, icon: '💱' },
            { id: 'EURGBP_otc', name: 'EUR/GBP (OTC)', type: 'forex', payout: 80, isOTC: true, icon: '💱' },
            { id: 'BTCUSD', name: 'Bitcoin/USD', type: 'crypto', payout: 90, isOTC: false, icon: '₿' },
            { id: 'ETHUSD', name: 'Ethereum/USD', type: 'crypto', payout: 88, isOTC: false, icon: 'Ξ' },
            { id: 'XAUUSD', name: 'Gold/USD', type: 'commodity', payout: 85, isOTC: false, icon: '🥇' },
            { id: 'USOIL', name: 'Crude Oil', type: 'commodity', payout: 83, isOTC: false, icon: '🛢' }
        ];
    }
    
    getCandles(symbol, timeframe, count = 300) {
        const now = Math.floor(Date.now() / 1000);
        const basePrices = {
            'EURUSD_otc': 1.08500, 'GBPUSD_otc': 1.26500, 'USDJPY_otc': 149.500,
            'BTCUSD': 43500, 'ETHUSD': 2350, 'XAUUSD': 2050, 'USOIL': 75
        };
        const base = basePrices[symbol] || 1.0000;
        let price = base;
        const candles = [];
        
        for (let i = count; i >= 0; i--) {
            const time = now - (i * timeframe);
            const volatility = base > 100 ? 50 : (base > 10 ? 0.5 : 0.0005);
            const change = (Math.random() - 0.5) * volatility * 2;
            price += change;
            
            const open = price;
            const close = price + (Math.random() - 0.5) * volatility;
            const high = Math.max(open, close) + Math.random() * volatility * 0.5;
            const low = Math.min(open, close) - Math.random() * volatility * 0.5;
            
            candles.push({
                time: time,
                open: Number(open.toFixed(base > 100 ? 2 : 5)),
                high: Number(high.toFixed(base > 100 ? 2 : 5)),
                low: Number(low.toFixed(base > 100 ? 2 : 5)),
                close: Number(close.toFixed(base > 100 ? 2 : 5))
            });
            
            price = close;
        }
        
        return candles;
    }
    
    // ============ EVENTS ============
    
    on(event, callback) {
        if (!this.listeners.has(event)) this.listeners.set(event, []);
        this.listeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const idx = callbacks.indexOf(callback);
            if (idx > -1) callbacks.splice(idx, 1);
        }
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(cb => cb(data));
        }
    }
}

// Global instance
window.POAPI = new POAPI();
if (typeof module !== 'undefined') module.exports = POAPI;
