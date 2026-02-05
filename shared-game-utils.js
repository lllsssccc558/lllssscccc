/**
 * 遊戲共用工具庫 - 錯誤處理和可訪問性支援
 * 適用於所有HTML5遊戲
 */

// ==================== 錯誤處理工具 ====================

class GameErrorHandler {
    constructor(gameName = '未知遊戲') {
        this.gameName = gameName;
        this.errors = [];
        this.maxErrors = 50; // 最大錯誤記錄數
        this.initialized = false;
    }

    // 初始化錯誤處理
    init() {
        if (this.initialized) return;
        
        // 全局錯誤處理
        window.addEventListener('error', (event) => {
            this.handleError(event.error || event.message, 'window.error');
        });

        // 未處理的Promise拒絕
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, 'unhandledrejection');
        });

        // Canvas渲染錯誤處理
        this.patchCanvasMethods();

        // 遊戲循環錯誤處理
        this.patchRequestAnimationFrame();

        this.initialized = true;
        console.log(`[${this.gameName}] 錯誤處理已初始化`);
    }

    // 處理錯誤
    handleError(error, source = 'unknown') {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            game: this.gameName,
            source: source,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        };

        // 添加到錯誤列表
        this.errors.push(errorInfo);
        if (this.errors.length > this.maxErrors) {
            this.errors.shift(); // 移除最舊的錯誤
        }

        // 控制台輸出
        console.error(`[${this.gameName}] 錯誤 (${source}):`, error);

        // 可以在此處添加錯誤報告邏輯
        // 例如: this.reportToServer(errorInfo);

        return errorInfo;
    }

    // 修補Canvas方法以防止崩潰
    patchCanvasMethods() {
        const originalFillRect = CanvasRenderingContext2D.prototype.fillRect;
        const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
        const originalClearRect = CanvasRenderingContext2D.prototype.clearRect;

        CanvasRenderingContext2D.prototype.fillRect = function(...args) {
            try {
                return originalFillRect.apply(this, args);
            } catch (error) {
                console.warn('Canvas fillRect 錯誤，嘗試恢復:', error);
                try {
                    this.clearRect(0, 0, this.canvas.width, this.canvas.height);
                } catch (e) {
                    // 忽略清理錯誤
                }
            }
        };

        CanvasRenderingContext2D.prototype.drawImage = function(...args) {
            try {
                return originalDrawImage.apply(this, args);
            } catch (error) {
                console.warn('Canvas drawImage 錯誤:', error);
            }
        };

        CanvasRenderingContext2D.prototype.clearRect = function(...args) {
            try {
                return originalClearRect.apply(this, args);
            } catch (error) {
                console.warn('Canvas clearRect 錯誤:', error);
            }
        };
    }

    // 修補requestAnimationFrame以捕獲循環錯誤
    patchRequestAnimationFrame() {
        const originalRequestAnimationFrame = window.requestAnimationFrame;
        window.requestAnimationFrame = (callback) => {
            return originalRequestAnimationFrame((timestamp) => {
                try {
                    callback(timestamp);
                } catch (error) {
                    this.handleError(error, 'requestAnimationFrame');
                }
            });
        };
    }

    // 獲取錯誤統計
    getErrorStats() {
        return {
            total: this.errors.length,
            recent: this.errors.slice(-10),
            bySource: this.errors.reduce((acc, error) => {
                acc[error.source] = (acc[error.source] || 0) + 1;
                return acc;
            }, {})
        };
    }

    // 清除錯誤記錄
    clearErrors() {
        this.errors = [];
    }
}

// ==================== 可訪問性工具 ====================

class GameAccessibility {
    constructor() {
        this.initialized = false;
    }

    // 初始化可訪問性支援
    init() {
        if (this.initialized) return;

        // 為所有按鈕添加ARIA標籤
        this.addButtonAccessibility();

        // 為所有圖片添加alt屬性
        this.addImageAccessibility();

        // 添加鍵盤導航支援
        this.addKeyboardNavigation();

        // 添加高對比度模式檢測
        this.detectHighContrastMode();

        this.initialized = true;
        console.log('遊戲可訪問性支援已初始化');
    }

    // 為按鈕添加可訪問性屬性
    addButtonAccessibility() {
        document.querySelectorAll('button').forEach(button => {
            if (!button.hasAttribute('aria-label')) {
                const label = this.getButtonLabel(button);
                button.setAttribute('aria-label', label);
            }

            // 添加焦點樣式
            if (!button.classList.contains('has-focus-style')) {
                button.classList.add('has-focus-style');
                const style = document.createElement('style');
                style.textContent = `
                    button.has-focus-style:focus {
                        outline: 3px solid #4CAF50 !important;
                        outline-offset: 2px !important;
                        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3) !important;
                    }
                `;
                document.head.appendChild(style);
            }
        });
    }

    // 獲取按鈕標籤
    getButtonLabel(button) {
        // 嘗試從不同來源獲取標籤
        return button.getAttribute('aria-label') ||
               button.textContent.trim() ||
               button.getAttribute('title') ||
               button.id ||
               '按鈕';
    }

    // 為圖片添加可訪問性屬性
    addImageAccessibility() {
        document.querySelectorAll('img').forEach(img => {
            if (!img.hasAttribute('alt')) {
                const alt = img.getAttribute('aria-label') ||
                           img.getAttribute('title') ||
                           img.id ||
                           '遊戲圖片';
                img.setAttribute('alt', alt);
            }
        });
    }

    // 添加鍵盤導航支援
    addKeyboardNavigation() {
        // 為遊戲區域添加鍵盤導航
        const gameContainers = document.querySelectorAll('canvas, .game-container, .game-area');
        gameContainers.forEach(container => {
            if (!container.hasAttribute('tabindex')) {
                container.setAttribute('tabindex', '0');
                container.setAttribute('role', 'application');
            }

            if (!container.hasAttribute('aria-label')) {
                const label = container.getAttribute('aria-label') ||
                             container.id ||
                             '遊戲區域';
                container.setAttribute('aria-label', label);
            }
        });

        // 添加鍵盤快捷鍵說明
        this.addKeyboardShortcutsHelp();
    }

    // 添加鍵盤快捷鍵說明
    addKeyboardShortcutsHelp() {
        // 可以在遊戲中顯示鍵盤快捷鍵說明
        const shortcuts = {
            '空格鍵': '開始/暫停遊戲',
            'ESC鍵': '返回/退出',
            '方向鍵': '移動控制',
            'P鍵': '暫停遊戲',
            'R鍵': '重新開始'
        };

        // 創建快捷鍵說明元素（可選）
        const helpElement = document.createElement('div');
        helpElement.className = 'keyboard-shortcuts-help';
        helpElement.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 10000;
            display: none;
        `;
        helpElement.innerHTML = '<strong>鍵盤快捷鍵</strong><br>' +
            Object.entries(shortcuts).map(([key, desc]) => `${key}: ${desc}`).join('<br>');
        document.body.appendChild(helpElement);

        // 添加切換顯示的快捷鍵 (F1)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                helpElement.style.display = helpElement.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    // 檢測高對比度模式
    detectHighContrastMode() {
        // 檢測Windows高對比度模式
        const mediaQuery = window.matchMedia('(forced-colors: active)');
        if (mediaQuery.matches) {
            document.documentElement.classList.add('high-contrast-mode');
            this.applyHighContrastStyles();
        }

        // 監聽變化
        mediaQuery.addEventListener('change', (e) => {
            if (e.matches) {
                document.documentElement.classList.add('high-contrast-mode');
                this.applyHighContrastStyles();
            } else {
                document.documentElement.classList.remove('high-contrast-mode');
                this.removeHighContrastStyles();
            }
        });
    }

    // 應用高對比度樣式
    applyHighContrastStyles() {
        const style = document.createElement('style');
        style.id = 'high-contrast-styles';
        style.textContent = `
            .high-contrast-mode {
                --hc-text: white !important;
                --hc-bg: black !important;
                --hc-border: white !important;
            }
            
            .high-contrast-mode * {
                color: var(--hc-text) !important;
                background-color: var(--hc-bg) !important;
                border-color: var(--hc-border) !important;
            }
            
            .high-contrast-mode canvas {
                border: 3px solid white !important;
            }
        `;
        document.head.appendChild(style);
    }

    // 移除高對比度樣式
    removeHighContrastStyles() {
        const style = document.getElementById('high-contrast-styles');
        if (style) {
            style.remove();
        }
    }

    // 添加螢幕閱讀器通知
    announceToScreenReader(message, priority = 'polite') {
        // 創建或使用現有的aria-live區域
        let liveRegion = document.getElementById('screen-reader-announcements');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'screen-reader-announcements';
            liveRegion.setAttribute('aria-live', priority);
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.cssText = 'position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;';
            document.body.appendChild(liveRegion);
        }

        // 更新內容以觸發螢幕閱讀器
        liveRegion.textContent = message;

        // 清除內容以便下次更新
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }
}

// ==================== 性能監控工具 ====================

class GamePerformanceMonitor {
    constructor(gameName = '未知遊戲') {
        this.gameName = gameName;
        this.metrics = {
            fps: [],
            memory: [],
            loadTime: null
        };
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.initialized = false;
    }

    // 初始化性能監控
    init() {
        if (this.initialized) return;

        // 記錄加載時間
        this.metrics.loadTime = performance.now();

        // 開始FPS監控
        this.startFPSMonitoring();

        // 開始內存監控（如果可用）
        if (performance.memory) {
            this.startMemoryMonitoring();
        }

        this.initialized = true;
        console.log(`[${this.gameName}] 性能監控已初始化`);
    }

    // 開始FPS監控
    startFPSMonitoring() {
        const measureFPS = () => {
            this.frameCount++;
            const currentTime = performance.now();
            const elapsed = currentTime - this.lastTime;

            if (elapsed >= 1000) { // 每秒計算一次
                const fps = Math.round((this.frameCount * 1000) / elapsed);
                this.metrics.fps.push(fps);

                // 保持最近60個記錄
                if (this.metrics.fps.length > 60) {
                    this.metrics.fps.shift();
                }

                // 重置計數器
                this.frameCount = 0;
                this.lastTime = currentTime;

                // 低FPS警告
                if (fps < 30) {
                    console.warn(`[${this.gameName}] 低FPS警告: ${fps}`);
                }
            }

            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);
    }

    // 開始內存監控
    startMemoryMonitoring() {
        setInterval(() => {
            try {
                const memory = performance.memory;
                this.metrics.memory.push({
                    usedJSHeapSize: memory.usedJSHeapSize,
                    totalJSHeapSize: memory.totalJSHeapSize,
                    jsHeapSizeLimit: memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                });

                // 保持最近60個記錄
                if (this.metrics.memory.length > 60) {
                    this.metrics.memory.shift();
                }

                // 內存使用警告
                const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
                if (usageRatio > 0.8) {
                    console.warn(`[${this.gameName}] 高內存使用警告: ${Math.round(usageRatio * 100)}%`);
                }
            } catch (error) {
                // 忽略內存監控錯誤
            }
        }, 5000); // 每5秒檢查一次
    }

    // 獲取性能報告
    getPerformanceReport() {
        const fps = this.metrics.fps;
        const avgFPS = fps.length > 0 ? 
            Math.round(fps.reduce((a, b) => a + b, 0) / fps.length) : 0;
        
        const minFPS = fps.length > 0 ? Math.min(...fps) : 0;
        const maxFPS = fps.length > 0 ? Math.max(...fps) : 0;

        return {
            game: this.gameName,
            loadTime: this.metrics.loadTime,
            currentFPS: fps.length > 0 ? fps[fps.length - 1] : 0,
            averageFPS: avgFPS,
            minFPS: minFPS,
            maxFPS: maxFPS,
            fpsSamples: fps.length,
            memorySamples: this.metrics.memory.length,
            lastMemory: this.metrics.memory.length > 0 ? 
                this.metrics.memory[this.metrics.memory.length - 1] : null
        };
    }

    // 獲取性能建議
    getPerformanceSuggestions() {
        const report = this.getPerformanceReport();
        const suggestions = [];

        if (report.averageFPS < 30) {
            suggestions.push('遊戲FPS較低，建議降低圖形質量或關閉其他應用程式');
        }

        if (report.averageFPS < 20) {
            suggestions.push('遊戲FPS非常低，可能影響遊戲體驗');
        }

        if (report.lastMemory && report.lastMemory.usedJSHeapSize > 500 * 1024 * 1024) {
            suggestions.push('遊戲內存使用較高，建議定期重啟遊戲');
        }

        return suggestions;
    }
}

// ==================== 導出工具實例 ====================

// 創建全局工具實例
window.GameUtils = {
    ErrorHandler: GameErrorHandler,
    Accessibility: GameAccessibility,
    PerformanceMonitor: GamePerformanceMonitor,
    
    // 快速初始化所有工具
    initAll(gameName = 'HTML5遊戲') {
        const errorHandler = new GameErrorHandler(gameName);
        const accessibility = new GameAccessibility();
        const performanceMonitor = new GamePerformanceMonitor(gameName);
        
        errorHandler.init();
        accessibility.init();
        performanceMonitor.init();
        
        return {
            errorHandler,
            accessibility,
            performanceMonitor
        };
    }
};

// 自動初始化（如果頁面加載完成）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('遊戲共用工具庫已加載，使用 window.GameUtils.initAll() 初始化');
    });
} else {
    console.log('遊戲共用工具庫已加載，使用 window.GameUtils.initAll() 初始化');
}