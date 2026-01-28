<template>
  <mars-dialog v-model:visible="isActivate" right="10" bottom="60" width="360">
    <div class="flight-dashboard" style="min-height: 200px">
      <!-- 进度条 -->
      <div class="progress-section">
        <div class="progress-bar-container">
          <div class="p-label" style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; color: #aaa;">
            <span>任务进度</span>
            <span>{{ formState.percent }}%</span>
          </div>
          <a-progress :percent="formState.percent" :show-info="false" stroke-color="#52c41a" trail-color="rgba(255,255,255,0.1)" />
        </div>
      </div>
      
      <!-- 仪表盘区域 -->
      <div class="dashboard-instruments">
        <InstrumentPanel 
          :speed="formState.speed" 
          :altitude="formState.altitude" 
          :pitch="formState.pitch" 
          :roll="formState.roll" 
          :heading="formState.heading"
        />
      </div>

      <!-- 数据统计区域 -->
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-value">{{ formState.td_length || '0米' }}</div>
          <div class="stat-label">已飞距离</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ formState.td_times || '00:00:00' }}</div>
          <div class="stat-label">已飞时间</div>
        </div>
        <div class="stat-box secondary">
          <div class="stat-value small">{{ formState.td_alllength || '0米' }}</div>
          <div class="stat-label">总距离</div>
        </div>
        <div class="stat-box secondary">
          <div class="stat-value small">{{ formState.td_alltimes || '00:00:00' }}</div>
          <div class="stat-label">预计总时</div>
        </div>
      </div>
    
      <!-- 位置信息（折叠或简化显示）-->
      <div class="position-bar">
        <div class="pos-item">
          <mars-icon icon="local" width="14" color="#1890ff"/>
          <span>{{ formState.td_jd ? Number(formState.td_jd).toFixed(6) : '-' }}, {{ formState.td_wd ? Number(formState.td_wd).toFixed(6) : '-' }}</span>
        </div>
        <div class="pos-item">
          <mars-icon icon="send-plane" width="14" color="#1890ff"/>
          <span>AGL: {{ formState.td_gd || '0米' }}</span>
        </div>
      </div>
    </div>
  </mars-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, defineProps, defineEmits, onUnmounted } from "vue"
import { useWidget } from "@mars/common/store/widget"
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
})

onUnmounted(() => {
  if (eventHandlerRoam) {
    mapWork.eventTarget.off("roamLineChange", eventHandlerRoam)
  }
  if (eventHandlerEnd) {
    mapWork.eventTarget.off("endRoam", eventHandlerEnd)
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
.flight-dashboard {
  padding: 0 5px;
  background: rgba(19, 24, 35, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 4px;
  padding-top: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  position: relative;
  
  .progress-section {
    margin-bottom: 20px;
    background: rgba(0,0,0,0.2);
    padding: 10px;
    border-radius: 4px;
  }
  
  .dashboard-instruments {
    margin-bottom: 20px;
    background: rgba(0,0,0,0.3);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 15px;
    
    .stat-box {
      background: rgba(0,0,0,0.4);
      padding: 15px 10px;
      border-radius: 4px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.05);
      
      .stat-value {
        font-size: 20px;
        font-weight: 600;
        color: #fff;
        line-height: 1.2;
        margin-bottom: 4px;
        font-family: "Helvetica Neue", Arial, sans-serif;
        
        &.small {
          font-size: 16px;
          color: #ccc;
        }
      }
      
      .stat-label {
        font-size: 12px;
        color: #999;
      }
      
      &.secondary {
        background: rgba(0,0,0,0.2);
      }
    }
  }
  
  .position-bar {
    display: flex;
    justify-content: space-between;
    background: rgba(0,0,0,0.2);
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    color: #bbb;
    
    .pos-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}
</style>
