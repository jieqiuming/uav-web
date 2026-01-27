<template>
  <mars-dialog :visible="true" right="10" :top="props.top" :bottom="props.top ? null : 60" width="330">
    <div class="percent">
      <a-progress :percent="formState.percent" size="small" color="#fff" />
    </div>
    
    <!-- 仪表盘 -->
    <div class="dashboard-container">
      <InstrumentPanel 
        :speed="formState.speed" 
        :altitude="formState.altitude" 
        :pitch="formState.pitch" 
        :roll="formState.roll" 
        :heading="formState.heading"
      />
    </div>

    <div class="already">
      <a-space>
        <div class="already-length">
          <p class="mars-text">{{ formState.td_length }}</p>
          <p>已飞行长度</p>
        </div>

        <div class="already-time">
          <p class="mars-text">{{ formState.td_times }}</p>
          <p>已飞行时间</p>
        </div>
      </a-space>

    </div>

    <div class="postions">
      <a-space>
        <div class="postions-lng">
          <p class="mars-text">{{ formState.td_jd }}</p>
          <p>经度</p>
        </div>

        <div class="postions-lat">
          <p class="mars-text">{{ formState.td_wd }}</p>
          <p>纬度</p>
        </div>

        <div class="postions-alt">
          <p class="mars-text">{{ formState.td_gd }}</p>
          <p>飞行高程</p>
        </div>
      </a-space>

    </div>

    <div class="all">
      <div class="all-length">
        <p class="mars-text">{{ formState.td_alllength }}</p>
        <p>总长度</p>
      </div>
      <div class="all-time">
        <p class="mars-text">{{ formState.td_alltimes }}</p>
        <p>总时长</p>
      </div>
    </div>

  </mars-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive } from "vue"
import type { UnwrapRef } from "vue"
import * as mapWork from "./map"
import InstrumentPanel from "./components/InstrumentPanel.vue"

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

// mapWork是map.js内定义的所有对象， 在项目中使用时可以改为import方式使用:  import * as mapWork from './map.js'

// const mars3d = mapWork.mars3d
// const Cesium = mapWork.Cesium

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


const props = withDefaults(
  defineProps<{
    top: string
  }>(),
  {
    top: null
  }
)


onMounted(() => {
  if (mapWork.fixedRoute?.info) {
    showInfo(mapWork.fixedRoute.info)
  }
  mapWork.eventTarget.on("roamLineChange", (item: any) => {
    showInfo(item)
  })

  mapWork.eventTarget.on("endRoam", (item: any) => {
    showInfo(mapWork.fixedRoute.info)
  })

})

function showInfo(item: any) {
  let val = Math.ceil((item.distance * 100) / item.distance_all)
  if (val < 1) {
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
  formState.speed = item.speed || 0 // item可能不直接包含speed，需确认
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
:deep(.info-view) {
  width: 200px;
  top: auto !important;
  bottom: 60px;
  overflow-y: hidden;
  z-index: 0 !important;
}

:deep(.ant-progress) {
  .ant-progress-outer {
    .ant-progress-inner {
      background-color: rgba(231, 231, 231, 0.15) !important;
    }
  }

  .ant-progress-text {
    color: #fff;
  }
}

.percent {
  width: 300px;
  height: 30px;
  line-height: 30px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);

  .ant-progress {
    width: 274px;
    margin-left: 10px;
  }
}

.already {
  margin-top: 10px;
  width: 300px;

  .already-length,
  .already-time {
    width: 146px;
    height: 60px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.2);
    text-align: center;


  }
}

.postions {
  margin-top: 10px;
  width: 300px;

  .postions-lng,
  .postions-lat,
  .postions-alt {
    width: 95px;
    height: 60px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.2);
    text-align: center;
  }
}

.all {
  display: flex;
  justify-content: space-around;
  height: 60px;
  width: 300px;
  margin-top: 10px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
}

.mars-text {
  display: inline-block;
  margin-top: 10px;
}
</style>
