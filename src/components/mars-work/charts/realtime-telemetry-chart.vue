<template>
  <div class="chart-container" ref="chartRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, markRaw } from "vue"
import * as echarts from "echarts"

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null
let timer: any = null

// 模拟数据队列
const dataQueueAttributes = {
  times: [] as string[],
  altitude: [] as number[],
  speed: [] as number[]
}
const MAX_POINTS = 50

const initData = () => {
  const now = new Date()
  for (let i = 0; i < MAX_POINTS; i++) {
    dataQueueAttributes.times.push(
      new Date(now.getTime() - (MAX_POINTS - i) * 1000).toLocaleTimeString()
    )
    dataQueueAttributes.altitude.push(0)
    dataQueueAttributes.speed.push(0)
  }
}

const initChart = () => {
  if (!chartRef.value) {
    return
  }

  chartInstance = markRaw(echarts.init(chartRef.value))
  
  const option = {
    tooltip: {
      trigger: "axis"
    },
    legend: {
      data: ["高度(m)", "速度(km/h)"],
      textStyle: { color: "#ccc" },
      top: 0
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
      top: 30
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: dataQueueAttributes.times,
      axisLabel: { show: false }, // 隐藏X轴标签避免重叠
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } }
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.05)" } },
      axisLabel: { color: "#ccc" }
    },
    series: [
      {
        name: "高度(m)",
        type: "line",
        smooth: true,
        symbol: "none",
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(255, 215, 0, 0.3)" },
            { offset: 1, color: "rgba(255, 215, 0, 0)" }
          ])
        },
        lineStyle: { color: "#ffd700" },
        data: dataQueueAttributes.altitude
      },
      {
        name: "速度(km/h)",
        type: "line",
        smooth: true,
        symbol: "none",
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(0, 193, 222, 0.3)" },
            { offset: 1, color: "rgba(0, 193, 222, 0)" }
          ])
        },
        lineStyle: { color: "#00c1de" },
        data: dataQueueAttributes.speed
      }
    ]
  }

  chartInstance.setOption(option)
}

const updateData = () => {
  const now = new Date()
  const timeStr = now.toLocaleTimeString()
  
  // 移除旧数据
  dataQueueAttributes.times.shift()
  dataQueueAttributes.altitude.shift()
  dataQueueAttributes.speed.shift()
  
  // 生成模拟新数据
  const newAlt = 100 + Math.random() * 20
  const newSpeed = 40 + Math.random() * 10
  
  dataQueueAttributes.times.push(timeStr)
  dataQueueAttributes.altitude.push(Number(newAlt.toFixed(1)))
  dataQueueAttributes.speed.push(Number(newSpeed.toFixed(1)))
  
  if (chartInstance) {
    chartInstance.setOption({
      xAxis: {
        data: dataQueueAttributes.times
      },
      series: [
        { data: dataQueueAttributes.altitude },
        { data: dataQueueAttributes.speed }
      ]
    })
  }
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  initData()
  initChart()
  timer = setInterval(updateData, 1000)
  window.addEventListener("resize", handleResize)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
  window.removeEventListener("resize", handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 200px;
}
</style>
