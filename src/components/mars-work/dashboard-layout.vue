<template>
  <div class="dashboard-layout">
    <!-- 顶部标题栏 -->
    <div class="dashboard-header">
      <div class="header-left">
        <div class="time">{{ currentTime }}</div>
      </div>
      <div class="header-center">
        <div class="title">无为低空飞行指挥中心</div>
        <div class="subtitle">Wuwei Low-Altitude Flight Command Center</div>
      </div>
      <div class="header-right">
        <a-button type="primary" ghost class="exit-btn" @click="$emit('exit')">退出指挥模式</a-button>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="dashboard-body">
      <!-- 左侧面板 -->
      <div class="panel panel-left">
        <div class="panel-header">任务监控</div>
        <div class="panel-content">
          <!-- 预留插槽 -->
          <slot name="left"></slot>
          <div class="placeholder-content" v-if="!$slots.left">
            <div class="mock-card">
              <div class="card-title">正在执行任务</div>
              <div class="card-num success">3</div>
            </div>
            <div class="mock-card">
              <div class="card-title">待命机队</div>
              <div class="card-num normal">12</div>
            </div>
            
            <!-- 实时遥测图表 -->
            <div class="chart-box">
              <div class="chart-title">实时飞行遥测</div>
              <RealtimeTelemetryChart />
            </div>

            <div class="mock-list">
              <div class="list-item" v-for="i in 5" :key="i">
                <span class="status-dot"></span>
                <span class="task-name">自主巡检任务 #{{ 202400 + i }}</span>
                <span class="task-time">10:{{ 15 + i*2 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间区域 (透出地图) -->
      <div class="panel-center"></div>

      <!-- 右侧面板 -->
      <div class="panel panel-right">
        <div class="panel-header">实时数据</div>
        <div class="panel-content">
          <slot name="right"></slot>
          <div class="placeholder-content" v-if="!$slots.right">
             <div class="chart-box" style="height: 240px;">
               <div class="chart-title">本周飞行架次统计</div>
               <FlightStatsChart />
             </div>
             
             <div class="chart-box">
               <div class="chart-title">违规告警统计</div>
               <div class="mock-chart line"></div>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部栏 -->
    <div class="dashboard-footer">
      <div class="footer-scroller">
        <span class="alert-tag">系统公告</span>
        <span class="scroll-text">今日无为南部区域有雷阵雨，请注意飞行安全... 10:30:00 # UAV-003 已完成自主巡检任务...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import FlightStatsChart from './charts/flight-stats-chart.vue'
import RealtimeTelemetryChart from './charts/realtime-telemetry-chart.vue'

const currentTime = ref('')
let timer: any = null

const updateTime = () => {
  currentTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss dddd')
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped lang="less">
.dashboard-layout {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; // 让鼠标操作穿透到地图
  z-index: 999;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at center, transparent 30%, rgba(0, 5, 20, 0.8) 90%);
  color: #fff;
  font-family: "Helvetica Neue", "Microsoft YaHei", sans-serif;

  * {
    pointer-events: auto; // 恢复UI元素的交互
  }
}

.dashboard-header {
  height: 80px;
  background: url('/img/bg/header-bg.png') no-repeat center bottom; 
  background-size: 100% 100%;
  // 如果没有背景图，用渐变模拟
  background-image: linear-gradient(to bottom, rgba(10, 30, 60, 0.9), rgba(10, 30, 60, 0.4));
  border-bottom: 2px solid #00c1de;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;

  .header-left {
    width: 300px;
    .time { font-size: 18px; color: #00c1de; font-weight: bold; }
  }

  .header-center {
    text-align: center;
    .title {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 4px;
      text-shadow: 0 0 10px #00c1de;
      background: linear-gradient(to bottom, #ffffff, #00c1de);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .subtitle {
      font-size: 10px;
      color: #7d9ebd;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
  }

  .header-right {
     width: 300px;
     text-align: right;
  }
}

.dashboard-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 20px;
  gap: 20px;
}

.panel {
  width: 380px;
  background: rgba(8, 18, 38, 0.7);
  border: 1px solid rgba(0, 193, 222, 0.3);
  box-shadow: 0 0 20px rgba(0, 193, 222, 0.1) inset;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(4px);
  
  .panel-header {
    height: 40px;
    line-height: 40px;
    padding-left: 20px;
    background: linear-gradient(to right, rgba(0, 193, 222, 0.2), transparent);
    font-size: 16px;
    font-weight: bold;
    color: #00c1de;
    border-left: 4px solid #00c1de;
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
  }
}

.panel-center {
  flex: 1;
  pointer-events: none; // 中间区域完全透传给地图
}

.dashboard-footer {
  height: 40px;
  background: rgba(0, 20, 40, 0.8);
  border-top: 1px solid rgba(0, 193, 222, 0.3);
  display: flex;
  align-items: center;
  padding: 0 20px;

  .alert-tag {
    background: #ff4d4f;
    color: #fff;
    padding: 2px 8px;
    border-radius: 2px;
    font-size: 12px;
    margin-right: 15px;
    font-weight: bold;
  }

  .scroll-text {
    color: #00c1de;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

// 占位内容的简单样式
.mock-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 15px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .card-title { color: #ccc; }
  .card-num { font-size: 24px; font-weight: bold; }
  .success { color: #52c41a; }
  .normal { color: #1890ff; }
}

.mock-list {
  margin-top: 20px;
  .list-item { 
    display: flex; 
    align-items: center; 
    padding: 10px 0; 
    border-bottom: 1px dashed rgba(255,255,255,0.1);
    color: #bbb;
    font-size: 13px;
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #52c41a; margin-right: 10px; }
    .task-name { flex: 1; }
  }
}

.chart-box {
  height: 200px;
  background: rgba(0,0,0,0.2);
  margin-bottom: 20px;
  padding: 10px;
  
  .chart-title { color: #aaa; margin-bottom: 10px; font-size: 12px;}
  .mock-chart { 
    height: 150px; 
    &.bar { 
      background: repeating-linear-gradient(90deg, #1890ff 0 10px, transparent 0 20px); 
      opacity: 0.5;
    }
    &.line {
       background: linear-gradient(to top right, transparent 49%, #00c1de 50%, transparent 51%);
    }
  }
}
</style>
