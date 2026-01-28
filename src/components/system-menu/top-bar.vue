<template>
  <div class="top-bar">
    <div class="top-bar-content">
      <!-- 汉堡菜单按钮 (仅移动端显示) -->
      <div class="hamburger-btn" @click="toggleMobileMenu">
        <mars-icon :icon="showMobileMenu ? 'close' : 'hamburger-button'" width="30"></mars-icon>
      </div>

      <!-- 桌面端左侧菜单 -->
      <div class="menu-section left-menu desktop-menu">
        <!-- 设备清单下拉菜单 -->
        <div class="custom-dropdown" @mouseenter="showDeviceDropdown = true" @mouseleave="showDeviceDropdown = false">
          <div class="menu-item" :class="{ active: isDeviceActive }">
            <mars-icon icon="system" width="25"></mars-icon>
            <span>设备清单</span>
          </div>
          <div v-show="showDeviceDropdown" class="custom-dropdown-menu">
            <div class="sub-menu-item" @click="handleSubMenuClick('personal-device')">
              <mars-icon icon="user" width="20"></mars-icon>
              <span>个人设备</span>
            </div>
            <div class="sub-menu-item" @click="handleSubMenuClick('public-device')">
              <mars-icon icon="drone-one" width="20"></mars-icon>
              <span>公有设备</span>
            </div>
          </div>
        </div>

        <!-- 航线规划下拉菜单 -->
        <div class="custom-dropdown" @mouseenter="showRouteDropdown = true" @mouseleave="showRouteDropdown = false">
          <div class="menu-item" :class="{ active: isRouteActive }">
            <mars-icon icon="switch-track" width="25"></mars-icon>
            <span>航线规划</span>
          </div>
          <div v-show="showRouteDropdown" class="custom-dropdown-menu">
            <div class="sub-menu-item" @click="handleSubMenuClick('route-management')">
              <mars-icon icon="switch-track" width="20"></mars-icon>
              <span>航线管理</span>
            </div>
            <div class="sub-menu-item" @click="handleSubMenuClick('manual-route')">
              <mars-icon icon="clothes-gloves" width="20"></mars-icon>
              <span>手动航线规划</span>
            </div>
            <div class="sub-menu-item" @click="handleSubMenuClick('auto-route')">
              <mars-icon icon="assembly-line" width="20"></mars-icon>
              <span>自动航线规划</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 中间标题 -->
      <div class="title">无为低空云平台</div>
      
      <!-- 桌面端右侧菜单 -->
      <div class="menu-section right-menu desktop-menu">
        <!-- 业务管理下拉菜单 (合并项) -->
        <div class="custom-dropdown" @mouseenter="showBusinessDropdown = true" @mouseleave="showBusinessDropdown = false">
          <div class="menu-item" :class="{ active: isBusinessActive }">
            <mars-icon icon="briefcase" width="25"></mars-icon>
            <span>业务管理</span>
          </div>
          <div v-show="showBusinessDropdown" class="custom-dropdown-menu">
            <div class="sub-menu-item" @click="handleSubMenuClick('airspace-application')">
              <mars-icon icon="file-text" width="20"></mars-icon>
              <span>空域申请</span>
            </div>
            <div class="sub-menu-item" @click="handleSubMenuClick('airspace-calculation')">
              <mars-icon icon="calculator" width="20"></mars-icon>
              <span>空域计算</span>
            </div>
            <div class="sub-menu-item" @click="handleSubMenuClick('flight-report')">
              <mars-icon icon="file-text-one" width="20"></mars-icon>
              <span>飞行报告</span>
            </div>
          </div>
        </div>

        <!-- 指挥大屏 -->
        <div class="menu-item dashboard-btn" @click="handleMenuClick('dashboard')">
          <mars-icon icon="monitor" width="25"></mars-icon>
          <span>指挥大屏</span>
        </div>
      </div>

      <!-- 移动端侧滑菜单 -->
      <div class="mobile-menu-drawer" :class="{ open: showMobileMenu }">
        <div class="drawer-content">
          <div class="mobile-menu-group">
            <div class="group-title">设备管理</div>
            <div class="mobile-menu-item" @click="handleSubMenuClick('personal-device')">个人设备</div>
            <div class="mobile-menu-item" @click="handleSubMenuClick('public-device')">公有设备</div>
          </div>
          <div class="mobile-menu-group">
            <div class="group-title">航线规划</div>
            <div class="mobile-menu-item" @click="handleSubMenuClick('route-management')">航线管理</div>
            <div class="mobile-menu-item" @click="handleSubMenuClick('manual-route')">手动规划</div>
            <div class="mobile-menu-item" @click="handleSubMenuClick('auto-route')">自动规划</div>
          </div>
          <div class="mobile-menu-group">
             <div class="group-title">业务功能</div>
             <div class="mobile-menu-item" @click="handleMenuClick('airspace-application')">空域申请</div>
             <div class="mobile-menu-item" @click="handleMenuClick('airspace-calculation')">空域计算</div>
             <div class="mobile-menu-item" @click="handleMenuClick('flight-report')">飞行报告</div>
          </div>
          <div class="mobile-menu-group">
             <div class="mobile-menu-item highlight" @click="handleMenuClick('dashboard')">切换到指挥大屏</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from "vue"
import { message } from "ant-design-vue"
import { useWidget } from "@mars/common/store/widget"

// 顶部栏组件
const { activate, disable, isActivate } = useWidget()
const setViewMode = inject<((mode: string) => void)>("setViewMode")

// 响应式状态，跟踪菜单激活状态
const menuStates = ref({
  menu1Active: false
})

// 控制下拉菜单显示
const showDeviceDropdown = ref(false)
const showRouteDropdown = ref(false)
const showBusinessDropdown = ref(false) // 新增
const showMobileMenu = ref(false)

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

// 计算属性，实时获取widget状态
// 设备清单菜单激活状态（如果有任何子项激活则高亮）
const isDeviceActive = computed(() => {
  return isActivate("aircraft-management")
  // 后续可添加个人设备的widget检测
})

// 航线规划菜单激活状态（如果有任何子项激活则高亮）
const isRouteActive = computed(() => {
  return isActivate("route-management") || isActivate("route-planning")
})

// 业务管理菜单激活状态 (合并后的)
const isBusinessActive = computed(() => {
  return isActivate("airspace-application") || 
         isActivate("airspace-computation") || 
         isActivate("flight-report")
})

// 菜单点击处理函数
const handleMenuClick = (menuType: string) => {
  console.log("点击菜单:", menuType)
  showMobileMenu.value = false
  
  switch (menuType) {
    case "airspace-application":
      console.log("点击空域申请")
      activate({ name: "airspace-application" })
      break
    case "airspace-calculation":
      console.log("点击空域计算")
      activate({ name: "airspace-computation" })
      break
    case "flight-report":
      console.log("点击飞行报告")
      activate({ name: "flight-report" })
      break
    case "dashboard":
      console.log("切换到指挥大屏")
      if (setViewMode) {
        setViewMode("dashboard")
      }
      break
    default:
      console.log("未知菜单类型:", menuType)
  }
}

// 子菜单点击处理函数
const handleSubMenuClick = (subMenuType: string) => {
  console.log("点击子菜单:", subMenuType)
  
  // 点击子菜单项后关闭相关下拉菜单和移动端菜单
  showDeviceDropdown.value = false
  showRouteDropdown.value = false
  showBusinessDropdown.value = false
  showMobileMenu.value = false
  
  switch (subMenuType) {
    // 设备清单子菜单
    case "personal-device":
      console.log("点击个人设备")
      activate({ name: "aircraft-management" })
      break
    case "public-device":
      console.log("点击公有设备")
      activate({ name: "aircraft-management" })
      break
    
    // 航线规划子菜单
    case "route-management":
      console.log("点击航线管理")
      activate({ name: "route-management" })
      break
    case "manual-route":
      console.log("点击手动航线规划")
      activate({ name: "route-planning" })
      break
    case "auto-route":
      console.log("点击自动航线规划")
      activate({ name: "auto-route-planning" })
      break
      
    // 业务管理子菜单
    case "airspace-application":
      activate({ name: "airspace-application" })
      break
    case "airspace-calculation":
      activate({ name: "airspace-computation" })
      break
    case "flight-report":
      activate({ name: "flight-report" })
      break
    
    default:
      console.log("未知子菜单类型:", subMenuType)
  }
}
</script>

<style lang="less" scoped>
/* 引入自定义字体 */
@font-face {
  font-family: 'YouSheBiaoTiHei';
  src: url('/fonts/YouSheBiaoTiHei.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  height: 80px;
  // background-image: url('/img/tietu/topbar.png');
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  /* 添加模糊背景效果 */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  /* 添加半透明背景增强对比度 */
  background-color: rgba(0, 0, 0, 0.2);
  background-blend-mode: overlay;
}

.top-bar-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5px;
}

.title {
  flex: 0 0 auto;
  min-width: 400px;
  font-size: 65px;
  background: linear-gradient(to bottom, #ffffff 0%, #6E99BE 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 2px;
  font-family: 'YouSheBiaoTiHei', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  text-align: center;
  position: relative;
  z-index: 1;
  /* 添加文字轮廓和阴影增强可读性 */
  filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.8)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  /* 文字描边效果 */
  -webkit-text-stroke: 0.5px rgba(0, 0, 0, 0.3);
}

/* 菜单区域样式 - 确保左右两侧均衡 */
.menu-section {
  display: flex;
  align-items: center;
  flex: 1 1 0; /* 确保两侧占用相同的基础空间 */
  padding: 0 10px;
  min-width: 0; /* 防止flex项目溢出 */
}

.left-menu {
  justify-content: flex-start;
  gap: 15px; /* 减少菜单之间间距 */
  padding-right: 25px; /* 增加与标题的距离 */
}

.right-menu {
  justify-content: flex-end;
  gap: 20px; /* 调整间距保持平衡 */
  padding-left: 25px; /* 与左侧对称 */
}

/* 菜单项样式 */
.menu-item {
  position: relative;
  background-image: url('/img/tietu/menu.png');
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  padding: 8px 25px; /* 增加内底距 */
  min-width: auto; /* 移除固定宽度，改为自适应 */
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* 自适应并防止过窄 */
.menu-section .menu-item,
.menu-section .custom-dropdown {
  min-width: auto;
  padding: 0; /* padding 由内部 menu-item 控制，或在 dropdown 上处理 */
  flex: 0 0 auto;
}

/* 修正 custom-dropdown 的布局 */
.menu-section .custom-dropdown .menu-item {
     padding: 8px 35px; /* 稍微宽一点 */
}

/* 右侧菜单项 - 自适应 */
.right-menu .menu-item {
  min-width: auto;
  padding: 8px 25px;
  flex: 0 0 auto;
}

.menu-item > * {
  display: flex;
  align-items: center;
}

.menu-item:hover {
  transform: scale(1.05);
  filter: brightness(1.2);
}


.menu-item.active span {
  color: #00ffff;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
}

.menu-item .mars-icon {
  color: #ffffff;
  filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.8));
  vertical-align: middle;
  line-height: 1;
}

.menu-item.active .mars-icon {
  color: #00ffff;
  filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.8));
}

.dashboard-btn {
  border: 1px solid #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.dashboard-btn span, 
.dashboard-btn .mars-icon {
  color: #ffd700 !important;
}

.dashboard-btn:hover {
  background: rgba(255, 215, 0, 0.1);
}

.menu-item span {
  font-family: 'YouSheBiaoTiHei', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  font-size: 28px;
  color: #ffffff;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  z-index: 2;
  position: relative;
  line-height: 1;
  vertical-align: middle;
}

/* 自定义下拉菜单样式 */
.custom-dropdown {
  position: relative;
}

.custom-dropdown-menu {
  position: absolute;
  top: calc(100% + 0px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  padding: 8px 0;
  min-width: 150px;
  background: transparent;
  /* 添加毛玻璃效果 */
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  /* 添加半透明背景增强对比度 */
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

/* 子菜单项样式 */
.sub-menu-item {
  position: relative;
  background-image: url('/img/tietu/menu.png');
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  padding: 6px 12px;
  min-width: 120px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 4px;
}

.sub-menu-item:last-child {
  margin-bottom: 0;
}

.sub-menu-item:hover {
  transform: scale(1.05);
  filter: brightness(1.2);
}

.sub-menu-item .mars-icon {
  color: #ffffff;
  filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.8));
  vertical-align: middle;
  line-height: 1;
}

.sub-menu-item span {
  font-family: 'YouSheBiaoTiHei', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  font-size: 22px;
  color: #ffffff;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  z-index: 2;
  position: relative;
  line-height: 1;
  vertical-align: middle;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .menu-item {
    min-width: 120px;
    padding: 6px 12px;
    height: 40px;
    gap: 6px;
  }
  
  .left-menu .menu-item,
  .left-menu .custom-dropdown {
    min-width: 230px;
  }
  
  .left-menu {
    gap: 12px;
    padding-right: 20px;
  }
  
  .right-menu .menu-item {
    min-width: 150px;
  }
  
  .right-menu {
    gap: 15px;
    padding-left: 20px;
  }
  
  .menu-item .mars-icon {
    width: 20px;
  }
  
  .menu-item span {
    font-size: 24px;
  }
  
  .title {
    min-width: 350px;
    font-size: 45px;
  }
  
  .sub-menu-item {
    min-width: 100px;
    padding: 5px 10px;
    height: 30px;
    gap: 5px;
  }
  
  .sub-menu-item .mars-icon {
    width: 16px;
  }
  
  .sub-menu-item span {
    font-size: 18px;
  }
}

@media (max-width: 768px) {
  .top-bar {
    height: 60px;
  }
  
  .title {
    font-size: 30px;
    letter-spacing: 1px;
    min-width: 280px;
  }
  
  .menu-section {
    gap: 5px;
    padding: 0 8px;
  }
  
  .top-bar-content {
    padding: 0 15px;
  }
  
  .menu-item {
    min-width: 90px;
    padding: 4px 8px;
    height: 35px;
    gap: 4px;
  }
  
  .left-menu .menu-item,
  .left-menu .custom-dropdown {
    min-width: 180px;
  }
  
  .right-menu .menu-item {
    min-width: 120px;
  }
  
  .right-menu {
    gap: 12px;
  }
  
  .left-menu {
    gap: 10px;
    padding-right: 15px;
  }
  
  .right-menu {
    padding-left: 15px;
  }
  
  .menu-item .mars-icon {
    width: 18px;
  }
  
  .menu-item span {
    font-size: 18px;
  }
  
  .sub-menu-item {
    min-width: 80px;
    padding: 4px 8px;
    height: 28px;
    gap: 4px;
  }
  
  .sub-menu-item .mars-icon {
    width: 14px;
  }
  
  .sub-menu-item span {
    font-size: 16px;
  }
}

/* 汉堡菜单样式 */
.hamburger-btn {
  display: none; // 默认隐藏
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10002;
  cursor: pointer;
  color: #fff;
}

.mobile-menu-drawer {
  position: fixed;
  top: 0;
  left: -100%;
  width: 280px;
  height: 100vh;
  background: rgba(10, 20, 40, 0.95);
  backdrop-filter: blur(20px);
  z-index: 10000;
  transition: left 0.3s ease;
  padding-top: 80px; /* 给顶部工具栏留位置 */
  box-shadow: 2px 0 10px rgba(0,0,0,0.5);
  
  &.open {
    left: 0;
  }
  
  .drawer-content {
    padding: 20px;
    height: 100%;
    overflow-y: auto;
  }
  
  .mobile-menu-group {
    margin-bottom: 25px;
    
    .group-title {
      font-size: 14px;
      color: #00c1de;
      margin-bottom: 10px;
      font-weight: bold;
      padding-bottom: 5px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .mobile-menu-item {
      padding: 12px 10px;
      color: #ddd;
      font-size: 16px;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.2s;
      
      &:hover {
         background: rgba(255,255,255,0.1);
         color: #fff;
      }

      &.highlight {
        color: #ffd700;
        font-weight: bold;
      }
    }
  }
}

/* 屏幕宽度小于 1024px 时启用汉堡菜单 */
@media (max-width: 1024px) {
  .desktop-menu {
    display: none !important; // 隐藏桌面端菜单
  }
  
  .hamburger-btn {
    display: block; // 显示汉堡按钮
  }
  
  .title {
    font-size: 32px;
    min-width: auto;
    width: 100%;
    padding-left: 60px; // 防止被汉堡按钮遮挡
  }
}
</style>
