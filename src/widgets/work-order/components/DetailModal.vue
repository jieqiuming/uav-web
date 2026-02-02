<template>
  <a-modal
    :visible="visible"
    :footer="null"
    @cancel="handleCancel"
    width="720px"
    :bodyStyle="{ padding: 0 }"
    class="detail-modal"
  >
    <template #title>
      <div class="modal-header">
        <span class="modal-title">工单详情</span>
        <a-tag v-if="workOrder" :color="getStatusColor(workOrder.status)">
          {{ getStatusLabel(workOrder.status) }}
        </a-tag>
      </div>
    </template>

    <div class="detail-container" v-if="workOrder">
      <!-- 顶部信息条 -->
      <div class="header-bar">
        <div class="order-info">
          <div class="order-no">{{ workOrder.no }}</div>
          <div class="order-title">{{ workOrder.title }}</div>
        </div>
        <div class="order-meta">
          <a-tag :color="getTypeColor(workOrder.type)">{{ getTypeLabel(workOrder.type) }}</a-tag>
          <span :class="['priority-badge', workOrder.priority]">
            {{ getPriorityLabel(workOrder.priority) }}
          </span>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="content-area">
        <!-- 左侧信息 -->
        <div class="info-panel">
          <div class="panel-section">
            <div class="section-header">
              <span class="section-icon">📋</span>
              <span>基本信息</span>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <label>创建时间</label>
                <span>{{ formatDate(workOrder.createdAt) }}</span>
              </div>
              <div class="info-item">
                <label>更新时间</label>
                <span>{{ formatDate(workOrder.updatedAt) }}</span>
              </div>
              <div class="info-item full">
                <label>位置</label>
                <span v-if="workOrder.location">
                  {{ workOrder.location.address || `${workOrder.location.lng.toFixed(4)}, ${workOrder.location.lat.toFixed(4)}` }}
                </span>
                <span v-else class="empty">未设置</span>
              </div>
            </div>
          </div>

          <div class="panel-section">
            <div class="section-header">
              <span class="section-icon">📝</span>
              <span>描述说明</span>
            </div>
            <div class="description-box">
              {{ workOrder.description || '暂无描述' }}
            </div>
          </div>
        </div>

        <!-- 右侧资源 -->
        <div class="resource-panel">
          <div class="panel-section">
            <div class="section-header">
              <span class="section-icon">🚁</span>
              <span>关联资源</span>
            </div>
            <div class="resource-list">
              <div class="resource-item">
                <div class="resource-icon aircraft">✈</div>
                <div class="resource-info">
                  <div class="resource-label">执行无人机</div>
                  <div class="resource-value">
                    {{ workOrder.aircraftId ? `设备 #${workOrder.aircraftId.slice(-6)}` : '未分配' }}
                  </div>
                </div>
              </div>
              <div class="resource-item">
                <div class="resource-icon pilot">👤</div>
                <div class="resource-info">
                  <div class="resource-label">执行飞手</div>
                  <div class="resource-value">
                    {{ workOrder.pilotId ? `飞手 #${workOrder.pilotId.slice(-4)}` : '未分配' }}
                  </div>
                </div>
              </div>
              <div class="resource-item">
                <div class="resource-icon task">📋</div>
                <div class="resource-info">
                  <div class="resource-label">关联飞行任务</div>
                  <div class="resource-value" v-if="linkedTask">
                    <span class="task-name">{{ linkedTask.name }}</span>
                    <a-tag :color="getTaskStatusColor(linkedTask.status)" size="small">
                      {{ getTaskStatusLabel(linkedTask.status) }}
                    </a-tag>
                  </div>
                  <div class="resource-value empty" v-else-if="loadingTask">
                    加载中...
                  </div>
                  <div class="resource-value empty" v-else>暂无关联任务</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="footer-actions">
        <a-button @click="handleCancel">关闭</a-button>
        <a-button 
          v-if="workOrder.status === 'pending'" 
          type="primary" 
          @click="handleEdit"
        >
          编辑工单
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { WorkOrder } from "@/api/services/work-order"
import * as flightTaskApi from "@/api/services/flight-task"
import type { FlightTask } from "@/api/services/flight-task"

const props = defineProps<{
  visible: boolean
  workOrder: WorkOrder | null
}>()

const emit = defineEmits(['update:visible', 'edit'])

// 关联任务数据
const linkedTask = ref<FlightTask | null>(null)
const loadingTask = ref(false)

// 监听 visible 和 workOrder 变化，加载关联任务
watch([() => props.visible, () => props.workOrder?.id], async ([visible, orderId]) => {
  linkedTask.value = null
  if (visible && orderId) {
    loadingTask.value = true
    try {
      const result = await flightTaskApi.getFlightTaskList({})
      linkedTask.value = result.data.find((t: FlightTask) => t.workOrderId === orderId) || null
    } catch (e) {
      console.error('加载关联任务失败', e)
    } finally {
      loadingTask.value = false
    }
  }
}, { immediate: true })

const handleCancel = () => {
  emit('update:visible', false)
}

const handleEdit = () => {
  emit('edit', props.workOrder)
  emit('update:visible', false)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) { return '-' }
  return new Date(dateStr).toLocaleString()
}

const getTypeLabel = (type: string) => {
  const map: any = { inspection: '巡检', repair: '维修', rescue: '救援', emergency: '应急' }
  return map[type] || type
}

const getTypeColor = (type: string) => {
  const map: any = { inspection: 'blue', repair: 'orange', rescue: 'red', emergency: 'red' }
  return map[type] || 'default'
}

const getStatusLabel = (status: string) => {
  const map: any = { pending: '待处理', processing: '执行中', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

const getStatusColor = (status: string) => {
  const map: any = { pending: 'orange', processing: 'blue', completed: 'green', cancelled: 'default' }
  return map[status] || 'default'
}

const getPriorityLabel = (p: string) => {
  const map: any = { low: '低', medium: '中', high: '高', critical: '紧急' }
  return map[p] || p
}

// 任务状态映射
const getTaskStatusLabel = (status: string) => {
  const map: any = { pending: '待执行', executing: '执行中', completed: '已完成', failed: '失败' }
  return map[status] || status
}

const getTaskStatusColor = (status: string) => {
  const map: any = { pending: 'orange', executing: 'blue', completed: 'green', failed: 'red' }
  return map[status] || 'default'
}
</script>

<style scoped lang="less">
.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .modal-title {
    font-size: 16px;
    font-weight: 600;
  }
}

.detail-container {
  .header-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 24px;
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    color: #fff;
    
    .order-info {
      .order-no {
        font-family: 'Consolas', monospace;
        font-size: 13px;
        opacity: 0.85;
        margin-bottom: 6px;
      }
      .order-title {
        font-size: 18px;
        font-weight: 600;
      }
    }
    
    .order-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .priority-badge {
        padding: 3px 10px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: 500;
        
        &.critical { background: #f5222d; }
        &.high { background: #fa541c; }
        &.medium { background: #faad14; color: #333; }
        &.low { background: #52c41a; }
      }
    }
  }
  
  .content-area {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 20px;
    padding: 20px 24px;
    min-height: 280px;
    
    .panel-section {
      margin-bottom: 20px;
      
      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f0f0f0;
        
        .section-icon {
          font-size: 16px;
        }
      }
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      
      .info-item {
        &.full {
          grid-column: 1 / -1;
        }
        
        label {
          display: block;
          font-size: 12px;
          color: #999;
          margin-bottom: 4px;
        }
        
        span {
          font-size: 14px;
          color: #333;
        }
        
        .empty {
          color: #ccc;
        }
      }
    }
    
    .description-box {
      padding: 12px;
      background: #fafafa;
      border-radius: 6px;
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      min-height: 80px;
      white-space: pre-wrap;
    }
    
    .resource-panel {
      background: #f9f9f9;
      border-radius: 8px;
      padding: 16px;
      
      .resource-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .resource-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        background: #fff;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        
        .resource-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          
          &.aircraft { background: #e6f7ff; }
          &.pilot { background: #f6ffed; }
          &.task { background: #fff7e6; }
        }
        
        .resource-info {
          .resource-label {
            font-size: 12px;
            color: #999;
          }
          .resource-value {
            font-size: 14px;
            color: #333;
            font-weight: 500;
          }
        }
      }
    }
  }
  
  .footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid #f0f0f0;
    background: #fafafa;
  }
}
</style>
