<template>
  <div class="fixedRoute-info-wrapper">
    <div class="flight-dashboard">
      <!-- 标题栏 -->
      <div class="dashboard-header">
        <span class="title">🛩️ 飞行监控</span>
        <span class="progress-text">{{ formState.percent }}%</span>
      </div>
      
      <!-- 进度条 -->
      <div class="progress-bar">
        <a-progress :percent="formState.percent" :show-info="false" stroke-color="#52c41a" trail-color="rgba(255,255,255,0.1)" size="small" />
      </div>
      
      <!-- 仪表盘区域 - 紧凑版 -->
      <div class="dashboard-instruments">
        <InstrumentPanel 
          :speed="formState.speed" 
          :altitude="formState.altitude" 
          :pitch="formState.pitch" 
          :roll="formState.roll" 
          :heading="formState.heading"
        />
      </div>

      <!-- 数据统计区域 - 横向排列 -->
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-value">{{ formState.td_length || '0m' }}</span>
          <span class="stat-label">已飞</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ formState.td_times || '0:00' }}</span>
          <span class="stat-label">时间</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ formState.td_alllength || '0m' }}</span>
          <span class="stat-label">总距</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ Math.round(formState.altitude) }}m</span>
          <span class="stat-label">高度</span>
        </div>
      </div>
    
      <!-- 坐标信息 -->
      <div class="position-bar">
        <span>📍 {{ formState.td_jd ? Number(formState.td_jd).toFixed(5) : '-' }}, {{ formState.td_wd ? Number(formState.td_wd).toFixed(5) : '-' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, defineProps, defineEmits, onUnmounted } from "vue"
import { useWidget } from "@mars/common/store/widget"
import { Modal } from "ant-design-vue"
import type { UnwrapRef } from "vue"
import * as mapWork from "./map.js"
import InstrumentPanel from "./components/InstrumentPanel.vue"

const { isActivate } = useWidget()

interface FormState {
  td_alllength: string
  td_length: string
  td_alltimes: string
  td_times: string
  td_jd: string
  td_wd: string
  td_gd: string
  percent: number
  speed: number
  altitude: number
  pitch: number
  roll: number
  heading: number
}

const formState: UnwrapRef<FormState> = reactive({
  td_alllength: "",
  td_length: "",
  td_alltimes: "",
  td_times: "",
  td_jd: "",
  td_wd: "",
  td_gd: "",
  percent: 0,
  speed: 0,
  altitude: 0,
  pitch: 0,
  roll: 0,
  heading: 0
})

const props = defineProps<{
  top?: string
}>()

let eventHandlerRoam: any
let eventHandlerEnd: any
let eventHandlerFlightEnd: any

onMounted(() => {
  console.log("FixedRouteInfo mounted", mapWork.fixedRoute)
  if (mapWork.fixedRoute?.info) {
    showInfo(mapWork.fixedRoute.info)
  }
  
  eventHandlerRoam = (item: any) => {
    showInfo(item)
  }
  mapWork.eventTarget.on("roamLineChange", eventHandlerRoam)

  eventHandlerEnd = (item: any) => {
     if (mapWork.fixedRoute?.info) {
        showInfo(mapWork.fixedRoute.info)
     }
  }
  mapWork.eventTarget.on("endRoam", eventHandlerEnd)
  
  // 飞行结束事件处理
  eventHandlerFlightEnd = (data: any) => {
    console.log("fixedRoute-info 收到飞行结束事件", data)
    formState.percent = 100
    
    // 显示完成反馈
    Modal.success({
      title: '飞行任务完成',
      content: `航线 "${data.name || '飞行任务'}" 已完成飞行\n` +
               `飞行距离: ${mapWork.formatDistance(data.distance)}\n` +
               `飞行时间: ${mapWork.formatTime(data.duration)}`,
      okText: '确定'
    })
  }
  mapWork.eventTarget.on("flightEnd", eventHandlerFlightEnd)
})

onUnmounted(() => {
  if (eventHandlerRoam) {
    mapWork.eventTarget.off("roamLineChange", eventHandlerRoam)
  }
  if (eventHandlerEnd) {
    mapWork.eventTarget.off("endRoam", eventHandlerEnd)
  }
  if (eventHandlerFlightEnd) {
    mapWork.eventTarget.off("flightEnd", eventHandlerFlightEnd)
  }
})

function showInfo(item: any) {
  let val = Math.ceil((item.distance * 100) / item.distance_all)
  if (val < 0) {
    val = 0
  }
  if (val > 100) {
    val = 100
  }
  formState.percent = val

  formState.td_jd = item.point?.lng
  formState.td_wd = item.point?.lat
  formState.td_gd = mapWork.formatDistance(item.point?.alt)
  formState.td_times = mapWork.formatTime(item.second)
  formState.td_alltimes = mapWork.formatTime(item.second_all)
  formState.td_length = mapWork.formatDistance(item.distance) || "0米"
  formState.td_alllength = mapWork.formatDistance(item.distance_all)
  
  // 更新仪表盘数据
  formState.speed = item.speed || 0 
  formState.altitude = item.point?.alt || 0
  formState.heading = item.heading || 0
  formState.pitch = item.pitch || 0
  formState.roll = item.roll || 0
}
</script>

<script lang="ts">
export default {
  name: "FixedRouteInfo"
}
</script>

<style scoped lang="less">
// 仪表盘容器定位 - 右下角
.fixedRoute-info-wrapper {
  position: fixed;
  right: 10px;
  bottom: 60px;
  width: 340px;
  z-index: 1000;
}

.flight-dashboard {
  background: rgba(15, 20, 30, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  // 标题栏
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    
    .title {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }
    
    .progress-text {
      font-size: 14px;
      font-weight: bold;
      color: #52c41a;
    }
  }
  
  // 进度条
  .progress-bar {
    margin-bottom: 10px;
  }
  
  // 仪表盘区域 - 紧凑
  .dashboard-instruments {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 10px;
    padding: 5px;
  }
  
  // 横向统计栏
  .stats-row {
    display: flex;
    align-items: center;
    justify-content: space-around;
    background: rgba(0, 0, 0, 0.25);
    border-radius: 6px;
    padding: 10px 8px;
    margin-bottom: 8px;
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .stat-value {
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        font-family: 'Consolas', monospace;
      }
      
      .stat-label {
        font-size: 10px;
        color: #888;
        margin-top: 2px;
      }
    }
    
    .stat-divider {
      width: 1px;
      height: 24px;
      background: rgba(255, 255, 255, 0.1);
    }
  }
  
  // 坐标栏
  .position-bar {
    background: rgba(0, 0, 0, 0.2);
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 11px;
    color: #888;
    text-align: center;
  }
}
</style>
