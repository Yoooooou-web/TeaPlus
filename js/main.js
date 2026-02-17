document.addEventListener('DOMContentLoaded', () => {
const maskedBg = document.querySelector('.masked-bg');
const header = document.querySelector('.header');
const hint = document.querySelector('.scroll-hint');
let hintLocked = false; // 状态锁
const hintBtn = document.getElementById('hintBtn');
let menuOpen = false;
const topBtn = document.querySelector('.top');
let headerAnimationFinished = false;
let disableWheel = false;
let animationFinished = false; // 手机动画是否完成（或用户触发了点击）
const logoMenu = document.querySelector('.logo_menu');
const menuList = document.querySelector('.logo_menu_list');
const heroText = document.querySelector('.hero-text');
const slider = document.querySelector('.tya_type');
const progress = document.querySelector('.tya_progress_inner');



let scale = 1;
let intentCount = 0;
const INTENT_THRESHOLD = 6; // 连续滚 6 次才放行
const maxScale = 20;
const minScale = 1;
const greenFadeStart = 1;
const greenFadeEnd = 4;












// 页面滚动时显示/隐藏按钮
window.addEventListener('scroll', updateTopBtn);

// 点击回顶部，保证生效
topBtn.addEventListener('click', () => {

    // 1. 移除滚轮劫持
    window.removeEventListener('wheel', onWheel);

    // 2. 强制回到顶部（兼容写法）
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // 3. 等滚动稳定后再恢复
    setTimeout(() => {
        window.addEventListener('wheel', onWheel, { passive: false });
    }, 500);
});

function updateTopBtn() {
    // 桌面端 TOP 显示条件：
    // 1. 页面滚动超过 300px
    // 2. 或者 scale > minScale
    // 否则隐藏
    if (window.pageYOffset > 300 || scale > minScale) {
        topBtn.classList.add('show');
    } else {
        topBtn.classList.remove('show');
    }

    // 特殊处理：动画完成后缩小回最小 scale，隐藏 TOP
    if (headerAnimationFinished && scale <= minScale && window.pageYOffset <= 300) {
        topBtn.classList.remove('show');
    }
}








if (hintBtn && hint) {
    hintBtn.addEventListener('click', () => {
        menuOpen = !menuOpen;
        hint.classList.toggle('open', menuOpen);
    });
}




function updateGreenOpacity(scale) {
    let opacity;

    if (scale <= greenFadeStart) {
        opacity = 1;
    } else if (scale >= greenFadeEnd) {
        opacity = 0;
    } else {
        const progress =
            (scale - greenFadeStart) / (greenFadeEnd - greenFadeStart);
        opacity = 1 - progress;
    }

    maskedBg.style.setProperty('--green-opacity', opacity);
}

function updateMaskSize() {
    const size = `${200 * scale}px ${200 * scale}px`;
    maskedBg.style.setProperty('--mask-size', size);
    updateGreenOpacity(scale);
}

/* 新增：初始化函数 */
function initMaskScale() {
    if (window.innerWidth <= 767) {
        scale = 0.5;   // 手机端初始
    } else {
        scale = 1;     // 桌面端初始
    }
    updateMaskSize();
}

function getZoomSpeed(currentScale) {
    const baseSpeed = 2; // 阻尼强度  滚轮输入 → 视觉变化之间的“传动比”

    const distanceToMax = Math.abs(maxScale - currentScale);
    const distanceToMin = Math.abs(currentScale - minScale);
    const distance = Math.min(distanceToMax, distanceToMin);

    // 距离越小，速度越慢（最小 0.15）
    return Math.max(0.15, baseSpeed * (distance / 4));
}

function isHeaderAtTop(tolerance = 2) { // 允许误差 2px
    return Math.abs(header.getBoundingClientRect().top) <= tolerance;
}

function showHint() {
    hint.style.opacity = 1;
    hint.classList.add('active');
}

function hideHint() {
    hint.style.opacity = 0;
    hint.classList.remove('active');
    hint.classList.remove('open'); // 收起菜单
    menuOpen = false;

    hint.style.setProperty('--offset', '0px');
}






function onWheel(event) {
    const zoomSpeed = getZoomSpeed(scale);

    // ↓ 向下滚动
    if (event.deltaY > 0) {
        if (isHeaderAtTop()) {
            if (scale < maxScale) {
                event.preventDefault();
                scale = Math.min(maxScale, scale + zoomSpeed);
                updateMaskSize();
                intentCount = 0;
                hideHint();
                hintLocked = false;
            } else {
                intentCount++;
                if (!hintLocked) {
                    showHint();
                    hintLocked = true;
                    headerAnimationFinished = true;
                    updateTopBtn();

                    if (heroText) {
                        heroText.classList.add("show");
                    }
                }
                if (intentCount < INTENT_THRESHOLD) {
                    event.preventDefault();
                } else {
                    return; // 明确：完全放行
                }
            }
        }
    }

    // ↑ 向上滚动
    if (event.deltaY < 0 && isHeaderAtTop() && scale > minScale) {
        event.preventDefault();
        scale = Math.max(minScale, scale - zoomSpeed);
        updateMaskSize();
        intentCount = 0;
        hideHint();
        hintLocked = false;

        // 立即隐藏 TOP，只要 scale 开始缩小
        if (scale < maxScale) {
            topBtn.classList.remove('show');
        }

        if (heroText) {
            heroText.classList.remove("show");
        }
    }

}


// window.addEventListener('wheel', onWheel, { passive: false });
if (window.innerWidth > 767) { // 桌面端才保留滚轮
    window.addEventListener('wheel', onWheel, { passive: false });
}


/* 初始化 */
initMaskScale();
/* resize */
window.addEventListener('resize', initMaskScale);






/*------------------------------
スマートフォン 
------------------------------*/

    if (window.innerWidth <= 767) { // 手机端

        // 阻止滚动，直到动画完成
        window.addEventListener('touchmove', (e) => {
            if (!animationFinished) {
                e.preventDefault();
            }
        }, { passive: false });
        
        let animating = false; // 动画锁

        maskedBg.addEventListener('click', () => {
            if (animating) return;
            animating = true;

            const duration = 1000; // 总动画时长
            const steps = 30;      // 动画步数
            const startScale = scale; // 当前 scale
            const stepScale = (maxScale - startScale) / steps;
            let currentStep = 0;

            const anim = setInterval(() => {
                scale = startScale + stepScale * currentStep; // 保证闭包里 scale 正确
                updateMaskSize(); // 每步更新蒙版
                currentStep++;
                if (currentStep > steps) { // 动画结束后
                    clearInterval(anim);
                    scale = maxScale; // 最终保证 scale 是最大值
                    updateMaskSize();
                    if (logoMenu) {
                        logoMenu.classList.add("show");
                    }
                    if (heroText) {
                        heroText.classList.add("show");
                    }
                    headerAnimationFinished = true;
                    updateTopBtn();
                    animating = false; // 释放锁
                    animationFinished = true; // 动画完成
                }
            }, duration / steps);
        });
    }




    // 图片滑块进度
    function updateProgress() {
    const slider = document.querySelector('.tya_type');
    const progressContainer = document.querySelector('.tya_progress');
    const progress = document.querySelector('.tya_progress_inner');

    if (!slider || !progress || !progressContainer) return;

    const scrollWidth = slider.scrollWidth;   // 总内容宽度
    const clientWidth = slider.clientWidth;   // 可视宽度
    const scrollLeft = slider.scrollLeft;     // 当前滚动

    // 动态计算滑块宽度（可视比例）
    const percentVisible = clientWidth / scrollWidth;
    progress.style.width = `${Math.max(percentVisible * 100, 5)}%`; // 最小 5%

    // 滑块位置百分比
    const maxScroll = scrollWidth - clientWidth;
    const percentScrolled = maxScroll > 0 ? scrollLeft / maxScroll : 0;

    // 最大移动距离 = 容器宽度 - 滑块宽度
    const progressWidth = progressContainer.getBoundingClientRect().width;
    const sliderWidth = progress.getBoundingClientRect().width;
    const maxMove = progressWidth - sliderWidth;

    progress.style.transform = `translateX(${percentScrolled * maxMove}px)`;
    }

  
    slider.addEventListener('scroll', updateProgress);



});