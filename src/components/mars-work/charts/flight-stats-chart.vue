<template>
  <div class="chart-container" ref="chartRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, markRaw } from "vue"
import * as echarts from "echarts"

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) {
    return
  }
  
  chartInstance = markRaw(echarts.init(chartRef.value))
  
  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      axisLabel: { color: "#ccc" },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } }
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#ccc" },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.05)" } }
    },
    series: [
      {
        name: "任务架次",
        type: "bar",
        data: [12, 18, 15, 22, 25, 10, 8],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#00c1de" },
            { offset: 1, color: "rgba(0, 193, 222, 0.1)" }
          ])
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  initChart()
  window.addEventListener("resize", handleResize)
})

onUnmounted(() => {
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
