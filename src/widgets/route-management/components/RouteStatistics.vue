<template>
  <div class="route-statistics">
    <h4>航线统计</h4>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon total">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.totalRoutes }}</div>
          <div class="stat-label">总航线数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon waypoints">📍</div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.totalWaypoints }}</div>
          <div class="stat-label">总航点数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon average">📈</div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.averageWaypoints }}</div>
          <div class="stat-label">平均航点数</div>
        </div>
      </div>
    </div>
    
    <div class="range-stats">
      <div class="range-item">
        <span class="range-label">高度范围:</span>
        <span class="range-value">{{ formatAltitudeRange }}</span>
      </div>
      <div class="range-item">
        <span class="range-label">速度范围:</span>
        <span class="range-value">{{ formatSpeedRange }}</span>
      </div>
    </div>
    
    <div class="quick-actions">
      <a-button size="small" type="link" @click="showDetails">
        查看详细统计
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import type { RouteStatistics } from "../types"

// Props
const props = defineProps<{
  statistics: RouteStatistics
}>()

// Emits
const emit = defineEmits<{
  showDetails: []
}>()

// 计算属性
const formatAltitudeRange = computed(() => {
  const { min, max } = props.statistics.altitudeRange
    if (min === 0 && max === 0) {
        return "无数据"
    }
  return min === max ? `${min}m` : `${min}m - ${max}m`
})

const formatSpeedRange = computed(() => {
  const { min, max } = props.statistics.speedRange
    if (min === 0 && max === 0) {
        return "无数据"
    }
  return min === max ? `${min}m/s` : `${min}m/s - ${max}m/s`
})

// 方法
const showDetails = () => {
  emit('showDetails')
}
</script>

<style scoped lang="less">
// 暗色主题变量
@text-primary: #e8edf3;
@text-secondary: #b8c5d6;
@text-muted: #8b9cb5;
@bg-card: rgba(255, 255, 255, 0.05);
@border-color: rgba(255, 255, 255, 0.1);
@accent-color: #1890ff;

.route-statistics {
  h4 {
    margin: 0 0 15px 0;
    font-size: 14px;
    color: @text-primary;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    margin-bottom: 15px;
    
    .stat-card {
      display: flex;
      align-items: center;
      background: @bg-card;
      border: 1px solid @border-color;
      border-radius: 8px;
      padding: 12px;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(24, 144, 255, 0.1);
        border-color: @accent-color;
      }
      
      .stat-icon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        margin-right: 12px;
        
        &.total {
          background: rgba(24, 144, 255, 0.2);
        }
        
        &.waypoints {
          background: rgba(82, 196, 26, 0.2);
        }
        
        &.average {
          background: rgba(250, 173, 20, 0.2);
        }
      }
      
      .stat-content {
        flex: 1;
        
        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: @text-primary;
          line-height: 1;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 11px;
          color: @text-muted;
        }
      }
    }
  }
  
  .range-stats {
    background: @bg-card;
    border: 1px solid @border-color;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 10px;
    
    .range-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .range-label {
        font-size: 12px;
        color: @text-muted;
      }
      
      .range-value {
        font-size: 12px;
        color: @text-primary;
        font-weight: 500;
      }
    }
  }
  
  .quick-actions {
    text-align: center;
    
    :deep(.ant-btn) {
      padding: 0;
      height: auto;
      font-size: 11px;
      color: @accent-color;
    }
  }
}
</style>
