<template>
  <mars-dialog :visible="true" width="330" right="10" top="200">
    <div class="f-mb">
      <a-row :gutter="[0, 10]">
        <a-col :span="8">飞行视角:</a-col>
        <a-col :span="16">
          <mars-select class="w-full" @change="changeSelect" v-model:value="formState.select" :options="selectOptions"> </mars-select>
        </a-col>

        <a-col v-show="formState.showFollowedX === '1'" :span="8" title="距离飞行对象的水平距离，单位：米">视角距离:</a-col>
        <a-col v-show="formState.showFollowedX === '1'" :span="16">
          <mars-input-number class="w-full" @change="changeFollowed" v-model:value="formState.followedX" :step="1" />
        </a-col>

        <a-col v-show="formState.showFollowedZ === '1'" :span="8" title="距离飞行对象的高度，单位：米">视角高度:</a-col>
        <a-col v-show="formState.showFollowedZ === '1'" :span="16">
          <mars-input-number @change="changeFollowed" v-model:value="formState.followedZ" :step="1" />
        </a-col>

        <a-col v-show="formState.select === 'dy'" :span="8" title="偏离飞行对象的高度，单位：米">高度偏移值:</a-col>
        <a-col v-show="formState.select === 'dy'" :span="16">
          <mars-input-number @change="changeFollowed" v-model:value="formState.offsetZ" :step="1" />
        </a-col>

        <a-col v-show="formState.select === 'dy'" :span="8" title="偏离飞行对象的横向值，单位：米">横向偏移值:</a-col>
        <a-col v-show="formState.select === 'dy'" :span="16">
          <mars-input-number @change="changeFollowed" v-model:value="formState.offsetY" :step="1" />
        </a-col>

        <a-col v-show="formState.select === 'dy'" :span="8" title="偏离飞行对象的前后值，单位：米">前后偏移值:</a-col>
        <a-col v-show="formState.select === 'dy'" :span="16">
          <mars-input-number @change="changeFollowed" v-model:value="formState.offsetX" :step="1" />
        </a-col>
      </a-row>
    </div>

    <div class="f-mb">
      <a-row :gutter="[0, 10]">
        <a-col :span="8">heading值:</a-col>
        <a-col :span="5">
          <mars-switch v-model:checked="formState.customHeading" @change="changeAutoHeading" />
        </a-col>
        <a-col :span="6" v-if="formState.customHeading">
          <mars-slider class="sliderlen" @change="updateHeading" v-model:value="formState.slideHeadingStep" :min="0" :max="360" :step="0.01" />
        </a-col>
        <a-col :span="8" v-if="!formState.customHeading"> 根据路线自动 </a-col>
      </a-row>
    </div>

    <div class="f-mb">
      <a-row :gutter="[0, 10]">
        <a-col :span="8">pitch值:</a-col>
        <a-col :span="5">
          <mars-switch v-model:checked="formState.customPitch" @change="changeAutoPitch" />
        </a-col>
        <a-col :span="6" v-if="formState.customPitch">
          <mars-slider class="sliderlen" @change="updatePitch" v-model:value="formState.slidePitchStep" :min="0" :max="360" :step="0.01" />
        </a-col>
        <a-col :span="8" v-if="!formState.customPitch"> 根据路线自动 </a-col>
      </a-row>
    </div>

    <div class="f-mb">
      <a-row :gutter="[0, 10]">
        <a-col :span="8">roll值:</a-col>
        <a-col :span="5">
          <mars-switch v-model:checked="formState.customRoll" @change="changeAutoRoll" />
        </a-col>
        <a-col :span="6" v-if="formState.customRoll">
          <mars-slider class="sliderlen" @change="updateRoll" v-model:value="formState.slideRollStep" :min="0" :max="360" :step="0.01" />
        </a-col>
        <a-col :span="8" v-if="!formState.customRoll"> 根据路线自动 </a-col>
      </a-row>
    </div>

    <div class="f-mb f-tac">
      <div class="play-control">
        <mars-button class="start-btn" v-show="!formState.isStart" @click="btnStart">开始</mars-button>
        <mars-button class="pause-btn" v-show="formState.isStart && !formState.isPause" @click="btnPause">暂停</mars-button>
        <mars-button class="proceed-btn" v-show="formState.isStart && formState.isPause" @click="btnProceed">继续</mars-button>
        <mars-button class="stop-btn" v-show="formState.isStart" @click="btnStop">停止</mars-button>
      </div>
    </div>
  </mars-dialog>
  <fixedRoute-info />
</template>

<script setup lang="ts">
import FixedRouteInfo from "./fixedRoute-info.vue"

import { reactive, ref, onMounted } from "vue"
import * as mapWork from "./map.js"
import useLifecycle from "@mars/common/uses/use-lifecycle"
import { useWidget } from "@mars/common/store/widget"

// 启用map.ts生命周期
useLifecycle(mapWork)
// Widget状态管理
const { activate, currentWidget } = useWidget()

// 监听Widget激活事件，处理参数传递 (如从任务管理跳转过来)
currentWidget.onUpdate((widget: any) => {
  if (widget && widget.data) {
    if (widget.data.route) {
       console.log('接收到飞行任务数据:', widget.data)
       // 延迟一点为了确保地图加载完成
       setTimeout(() => {
         mapWork.updateRoutePaths(widget.data.route)
       }, 500)
    }
  }
})

onMounted(() => {
  if (mapWork.fixedRoute?.info) {
    // 初始显示
  }
  
  // 监听外部数据更新
  if (currentWidget) {
    currentWidget.onUpdate((data: any) => {
      console.log("flight-demo received data:", data)
      if (data.routeData) {
        mapWork.updateRoutePaths(data.routeData)
      }
    })
  }
})

interface FormState {
  isStart: boolean
  isPause: boolean
  showFollowedX: string
  showFollowedZ: string
  select: string
  followedX: number
  followedZ: number
  offsetZ: number
  offsetY: number
  offsetX: number
  customHeading: boolean
  slideHeadingStep: number
  customPitch: boolean
  slidePitchStep: number
  customRoll: boolean
  slideRollStep: number
}

const formState = reactive<FormState>({
  isStart: false,
  isPause: false,
  select: "",
  showFollowedX: "1",
  showFollowedZ: "",
  followedX: 0,
  followedZ: 0,
  offsetZ: 0,
  offsetY: 0,
  offsetX: 0,
  customHeading: false,
  slideHeadingStep: 0,
  customPitch: false,
  slidePitchStep: 0,
  customRoll: false,
  slideRollStep: 0
})

// 按钮事件
const btnStart = () => {
  mapWork.showIndexNumPoint() // 显示数字点位标识
  mapWork.fixedRoute.start() // 启动飞行
  udpateState()
}

const btnPause = () => {
  mapWork.fixedRoute.pause()
  udpateState()
}

const btnProceed = () => {
  mapWork.fixedRoute.proceed()
  udpateState()
}

const btnStop = () => {
  mapWork.fixedRoute.stop()
  mapWork.hideIndexNumPoint() // 隐藏数字点位标识
  udpateState()
}

function udpateState() {
  setTimeout(() => {
    formState.isStart = mapWork.fixedRoute.isStart
    formState.isPause = mapWork.fixedRoute.isPause
  }, 100)
}

// 下拉菜单
const selectOptions = ref([
  {
    value: "",
    label: "自由视角"
  },
  {
    value: "gs",
    label: "跟随视角"
  },
  {
    value: "dy",
    label: "锁定第一视角"
  },
  {
    value: "sd",
    label: "锁定上帝视角"
  }
])
const changeSelect = () => {
  formState.showFollowedX = ""
  formState.showFollowedZ = ""

  switch (formState.select) {
    case "gs": //
      formState.showFollowedX = "1"
      break
    case "dy": // 锁定第一视角
      formState.showFollowedX = "1"
      formState.showFollowedZ = "1"

      formState.followedX = 200
      formState.followedZ = 50
      formState.offsetZ = 0
      formState.offsetY = 0
      formState.offsetX = 0

      break
    case "sd": {
      // 锁定上帝视角
      formState.showFollowedZ = "1"
      const followedZ = Number(formState.followedZ)
      if (followedZ < 500) {
        formState.followedZ = 500
      }
      break
    }

    default:
      break
  }
  mapWork.updateCameraSetting(formState)
}
const changeFollowed = () => {
  mapWork.updateCameraSetting(formState)
}

const changeAutoHeading = () => {
  if (formState.customHeading) {
    mapWork.fixedRoute.model.heading = formState.slideHeadingStep
  } else {
    mapWork.fixedRoute.model.heading = undefined
  }
}

const updateHeading = () => {
  mapWork.fixedRoute.model.heading = formState.slideHeadingStep
}

const changeAutoPitch = () => {
  if (formState.customPitch) {
    mapWork.fixedRoute.model.pitch = formState.slidePitchStep
  } else {
    mapWork.fixedRoute.model.pitch = undefined
  }
}

const updatePitch = () => {
  mapWork.fixedRoute.model.pitch = formState.slidePitchStep
}

const changeAutoRoll = () => {
  if (formState.customPitch) {
    mapWork.fixedRoute.model.roll = formState.slideRollStep
  } else {
    mapWork.fixedRoute.model.roll = undefined
  }
}

const updateRoll = () => {
  mapWork.fixedRoute.model.roll = formState.slideRollStep
}
</script>

<style scoped lang="less">
.play-control {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 20px;

  .start-btn {
    flex: 1;
  }

  .pause-btn,
  .proceed-btn,
  .stop-btn {
    flex: 1;
  }
}

.f-mb {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
}

.ant-form-item .ant-select,
.sliderlen {
  width: 100%;
}

:deep(.mars-dialog-content) {
  padding-top: 10px;
}
</style>
