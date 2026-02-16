const logoMenu = document.querySelector('.logo_menu');
const menuList = document.querySelector('.logo_menu_list');



if (logoMenu) {
    logoMenu.addEventListener('click', (e) => {
        logoMenu.classList.toggle('open');
        e.stopPropagation(); // 🔥 阻止事件冒泡，不触发 document 点击
    });

    // 点击页面其他地方收起菜单
    document.addEventListener('click', () => {
        logoMenu.classList.remove('open');
    });
}


// 点击菜单内部不关闭
if (menuList) {
    menuList.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

