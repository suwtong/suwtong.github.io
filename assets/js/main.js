/**
 * CPU架构学习平台 - 主JavaScript文件
 * 版本: 2.0
 * 更新: 2026-03-09
 */

// ===================================
// 移动端菜单切换
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            
            // 切换汉堡图标动画
            this.classList.toggle('active');
        });
        
        // 点击外部关闭菜单
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
        
        // 点击菜单项后关闭菜单
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });
    }
});

// ===================================
// 平滑滚动
// ===================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===================================
// 阅读进度追踪
// ===================================
const ReadingProgress = {
    // 获取所有进度数据
    getAll: function() {
        const data = localStorage.getItem('readingProgress');
        return data ? JSON.parse(data) : {};
    },
    
    // 获取单篇文章进度
    get: function(articleId) {
        const all = this.getAll();
        return all[articleId] || { read: false, progress: 0, lastRead: null };
    },
    
    // 保存文章进度
    save: function(articleId, progress) {
        const all = this.getAll();
        all[articleId] = {
            ...progress,
            lastRead: new Date().toISOString()
        };
        localStorage.setItem('readingProgress', JSON.stringify(all));
    },
    
    // 标记为已读
    markAsRead: function(articleId) {
        this.save(articleId, { read: true, progress: 100 });
    },
    
    // 更新阅读进度
    updateProgress: function(articleId, percent) {
        const current = this.get(articleId);
        this.save(articleId, {
            read: percent >= 90,
            progress: percent
        });
    }
};

// ===================================
// 文章页面滚动进度
// ===================================
if (document.querySelector('.article')) {
    let articleId = window.location.pathname.split('/').pop().replace('.html', '');
    
    // 创建进度条
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress-bar';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #667eea, #764ba2);
        z-index: 1000;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);
    
    // 更新进度
    function updateReadingProgress() {
        const article = document.querySelector('.article');
        if (!article) return;
        
        const windowHeight = window.innerHeight;
        const documentHeight = article.offsetHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const articleTop = article.offsetTop;
        
        const progress = Math.min(
            100,
            Math.max(0, ((scrollTop - articleTop + windowHeight) / documentHeight) * 100)
        );
        
        progressBar.style.width = progress + '%';
        
        // 保存进度
        if (progress > 0) {
            ReadingProgress.updateProgress(articleId, Math.round(progress));
        }
    }
    
    window.addEventListener('scroll', updateReadingProgress);
    updateReadingProgress();
}

// ===================================
// 显示阅读状态
// ===================================
function displayReadingStatus() {
    const articleCards = document.querySelectorAll('[data-article-id]');
    
    articleCards.forEach(card => {
        const articleId = card.dataset.articleId;
        const status = ReadingProgress.get(articleId);
        
        // 添加已读标记
        if (status.read) {
            const badge = document.createElement('span');
            badge.className = 'read-status completed';
            badge.textContent = '✓ 已读';
            card.querySelector('.article-card-footer')?.appendChild(badge);
        } else if (status.progress > 0) {
            const badge = document.createElement('span');
            badge.className = 'read-status';
            badge.textContent = `阅读进度 ${status.progress}%`;
            card.querySelector('.article-card-footer')?.appendChild(badge);
        }
    });
}

// 页面加载时显示阅读状态
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', displayReadingStatus);
} else {
    displayReadingStatus();
}

// ===================================
// 代码复制功能
// ===================================
document.querySelectorAll('pre code').forEach(block => {
    const button = document.createElement('button');
    button.className = 'copy-code-btn';
    button.textContent = '复制';
    button.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        padding: 4px 12px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.2s;
    `;
    
    const pre = block.parentElement;
    pre.style.position = 'relative';
    pre.appendChild(button);
    
    pre.addEventListener('mouseenter', () => {
        button.style.opacity = '1';
    });
    
    pre.addEventListener('mouseleave', () => {
        button.style.opacity = '0';
    });
    
    button.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(block.textContent);
            button.textContent = '已复制!';
            setTimeout(() => {
                button.textContent = '复制';
            }, 2000);
        } catch (err) {
            console.error('复制失败:', err);
        }
    });
});

// ===================================
// 返回顶部按钮
// ===================================
const backToTop = document.createElement('button');
backToTop.className = 'back-to-top';
backToTop.innerHTML = '↑';
backToTop.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 24px;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 999;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
`;

document.body.appendChild(backToTop);

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        backToTop.style.opacity = '1';
        backToTop.style.visibility = 'visible';
    } else {
        backToTop.style.opacity = '0';
        backToTop.style.visibility = 'hidden';
    }
});

backToTop.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// ===================================
// 图片懒加载
// ===================================
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img.lazy').forEach(img => {
        imageObserver.observe(img);
    });
}

// ===================================
// 主题切换（深色模式）- 预留功能
// ===================================
const ThemeManager = {
    current: localStorage.getItem('theme') || 'light',
    
    toggle: function() {
        this.current = this.current === 'light' ? 'dark' : 'light';
        this.apply();
    },
    
    apply: function() {
        document.documentElement.setAttribute('data-theme', this.current);
        localStorage.setItem('theme', this.current);
    },
    
    init: function() {
        this.apply();
    }
};

// 初始化主题
ThemeManager.init();

// ===================================
// 性能监控
// ===================================
if ('PerformanceObserver' in window) {
    // 监控最大内容绘制 (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
    });
    
    try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
        // 浏览器不支持
    }
}

// ===================================
// 工具函数
// ===================================
const Utils = {
    // 防抖
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 节流
    throttle: function(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // 格式化日期
    formatDate: function(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
};

// 导出到全局
window.ReadingProgress = ReadingProgress;
window.ThemeManager = ThemeManager;
window.Utils = Utils;

console.log('🎓 CPU架构学习平台已加载');
