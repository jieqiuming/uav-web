<template>
  <ConfigProvider :locale="locale">
    <div class="mars-main-view" id="mars-main-view">
      <!-- 标准模式：顶部栏 -->
      <top-bar v-show="viewMode === 'standard'" />
      
      <!-- 地图容器 (始终存在，作为最底层背景) -->
      <div id="centerDiv" class="centerDiv-container">
        <mars-map :url="configUrl" :options="mapOptions" @onload="marsOnload" />
      </div>

      <!-- 标准模式：Widget 弹窗 -->
      <template v-if="loaded && viewMode === 'standard'">
        <template v-for="comp in widgets" :key="comp.key">
          <mars-widget v-if="openAtStart.includes(comp.name) && comp.visible" v-model:visible="comp.visible" :widget="comp" />
        </template>
      </template>

      <!-- 大屏模式：Dashboard 布局 -->
      <dashboard-layout v-if="viewMode === 'dashboard'" @exit="setViewMode('standard')" />
      
      <!-- 移动端专属：快捷操作浮窗 -->
      <mobile-quick-actions />
    </div>
  </ConfigProvider>
</template>

<script setup lang="ts">
/**
 * 渲染主入口
 * @copyright 武汉大学 mars3d.cn
 * @author 贪肯奇 2022-02-19
 */
import zhCN from "ant-design-vue/es/locale/zh_CN"
import { computed, provide, ref } from "vue"
import { ConfigProvider } from "ant-design-vue"
import { useWidgetStore } from "@mars/common/store/widget"
import MarsMap from "@mars/components/mars-work/mars-map.vue"
import MarsWidget from "./widget.vue"
import TopBar from "@mars/components/system-menu/top-bar.vue"
import DashboardLayout from "./dashboard-layout.vue"
import MobileQuickActions from "./mobile-quick-actions.vue" // 新增
import { logInfo } from "@mars/utils/mars-util"

const locale = zhCN

const widgetStore = useWidgetStore()

const widgets = computed(() => widgetStore.state.widgets)
const openAtStart = computed(() => widgetStore.state.openAtStart)

const props = withDefaults(
  defineProps<{
    mapOptions?: any
    url?: string
  }>(),
  {
    mapOptions: () => ({}),
    url: null
  }
)
const configUrl = props.url ?? `${process.env.BASE_URL}config/config.json?time=${new Date().getTime()}`

let mapInstance: any = null
provide("getMapInstance", () => {
  return mapInstance
})

const emit = defineEmits(["mapLoaded"])

const loaded = ref(false)
const marsOnload = (map: any) => {
  logInfo("map构造完成", map)
  mapInstance = map

  // 移动端交互优化
  if (window.innerWidth <= 768) {
    console.log("检测到移动端，正在优化地图手势...")
    const controller = map.scene.screenSpaceCameraController
    
    // 降低缩放灵敏度 (默认为 5.0)，避免双指一捏就飞太远
    controller.zoomFactor = 2.0
    
    // 增加惯性，手感更顺滑
    // controller.inertiaTranslate = 0.9;
    // controller.inertiaZoom = 0.9;
    
    // 限制最小最大缩放距离，防止视角穿模或迷失
    controller.minimumZoomDistance = 50
    
    // 确保开启倾斜 (默认是开启的，但明确一下)
    controller.enableTilt = true
  }

  emit("mapLoaded", mapInstance)
  loaded.value = true
}

// 视图模式管理
const viewMode = ref("standard") // standard | dashboard
const setViewMode = (mode: string) => {
  viewMode.value = mode
}
provide("viewMode", viewMode)
provide("setViewMode", setViewMode)
</script>

<style lang="less" scoped>
.mars-main-view {
  height: 100%;
  width: 100%;
  position: relative;
}
.centerDiv-container {
  background-color: var(--mars-base-bg) !important;
  color: var(--mars-text-color) !important;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
</style>
