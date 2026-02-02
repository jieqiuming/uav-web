<template>
  <mars-dialog v-model:visible="dialogVisible" width="900" right="50" top="80" bottom="60">
    <template #title>
      <div class="dialog-header">
        <div class="dialog-title">
          <span>工单管理</span>
          <span class="title-tip">Work Order System</span>
        </div>
        <a-button type="text" class="close-btn" @click="handleClose">
          <template #icon><CloseOutlined /></template>
        </a-button>
      </div>
    </template>

    <div class="work-order-container">
      <!-- 顶部统计卡片 -->
      <div class="stat-cards">
        <div class="stat-card total">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">总工单</div>
        </div>
        <div class="stat-card pending">
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">待处理</div>
        </div>
        <div class="stat-card processing">
          <div class="stat-value">{{ stats.processing }}</div>
          <div class="stat-label">执行中</div>
        </div>
        <div class="stat-card completed">
          <div class="stat-value">{{ stats.completed }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="left-actions">
          <a-button type="primary" @click="showCreateModal">
            <template #icon><PlusOutlined /></template>
            新建工单
          </a-button>
          <a-divider type="vertical" style="height: 24px; margin: 0 8px;" />
          <div class="status-filter">
            <a-radio-group v-model:value="currentStatus" @change="handleStatusChange" size="small">
              <a-radio-button value="">全部</a-radio-button>
              <a-radio-button value="pending">待处理</a-radio-button>
              <a-radio-button value="processing">执行中</a-radio-button>
              <a-radio-button value="completed">已完成</a-radio-button>
            </a-radio-group>
          </div>
        </div>
        <div class="right-actions">
          <a-input-search
            v-model:value="searchKeyword"
            placeholder="搜索工单号/标题"
            @search="loadData"
            style="width: 200px"
            allowClear
          />
          <a-button @click="loadData" title="刷新">
            <template #icon><ReloadOutlined /></template>
          </a-button>
          <a-button @click="handleClose" title="关闭">
            <template #icon><CloseOutlined /></template>
          </a-button>
        </div>
      </div>

      <!-- 工单列表 -->
      <div class="order-list">
        <a-table 
          :dataSource="workOrders" 
          :columns="columns" 
          :loading="loading"
          rowKey="id"
          :pagination="{ pageSize: 6 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'no'">
              <span class="order-no">{{ record.no }}</span>
            </template>
            
            <template v-if="column.key === 'type'">
              <a-tag :color="getTypeColor(record.type)">{{ getTypeLabel(record.type) }}</a-tag>
            </template>
            
            <template v-if="column.key === 'priority'">
              <span :class="['priority-tag', record.priority]">
                 {{ getPriorityLabel(record.priority) }}
              </span>
            </template>
            
            <template v-if="column.key === 'status'">
               <a-badge :status="getStatusBadge(record.status)" :text="getStatusLabel(record.status)" />
            </template>
            
            <template v-if="column.key === 'action'">
              <a-space>
                <a-button type="link" size="small" @click="viewDetail(record)">详情</a-button>
                <a-button 
                  v-if="record.status === 'pending'" 
                  type="link" 
                  size="small" 
                  @click="showDispatchModal(record)"
                >
                  派单
                </a-button>
                <a-popconfirm
                  title="确定取消该工单吗？"
                  @confirm="handleDelete(record.id)"
                >
                  <a-button v-if="record.status !== 'processing'" type="link" size="small" danger>删除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
    </div>

    <!-- 新建/编辑工单弹窗 -->
    <create-order-modal 
      v-model:visible="createModalVisible"
      :edit-data="editOrderData"
      @success="handleCreateSuccess"
    />

    <!-- 派单弹窗 -->
    <dispatch-modal
      v-model:visible="dispatchModalVisible"
      :work-order="selectedOrder"
      @success="handleDispatchSuccess"
    />

    <!-- 详情弹窗 -->
    <detail-modal
      v-model:visible="detailModalVisible"
      :work-order="selectedOrder"
      @edit="handleEditFromDetail"
    />

  </mars-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue"
import { useWidget } from "@mars/common/store/widget"
import { message } from "ant-design-vue"
import { 
  PlusOutlined, 
  ReloadOutlined,
  CloseOutlined
} from "@ant-design/icons-vue"
import * as workOrderApi from "@/api/services/work-order"
import type { WorkOrder } from "@/api/services/work-order"
import CreateOrderModal from "./components/CreateOrderModal.vue"
import DispatchModal from "./components/DispatchModal.vue"
import DetailModal from "./components/DetailModal.vue"

const { currentWidget, disable } = useWidget()

// 计算属性控制弹窗显示
const dialogVisible = computed({
  get: () => currentWidget?.visible ?? false,
  set: (val: boolean) => {
    if (!val) {
      disable('work-order')
    }
  }
})

// 状态
const loading = ref(false)
const workOrders = ref<WorkOrder[]>([])
const stats = ref({ total: 0, pending: 0, processing: 0, completed: 0 })
const currentStatus = ref("")
const searchKeyword = ref("")

// 弹窗控制
const createModalVisible = ref(false)
const dispatchModalVisible = ref(false)
const detailModalVisible = ref(false)
const selectedOrder = ref<WorkOrder | null>(null)
const editOrderData = ref<WorkOrder | null>(null)

// 表格列定义 - 自适应宽度
const columns = [
  { title: '工单号', key: 'no', width: 150 },
  { title: '标题', dataIndex: 'title', ellipsis: true, minWidth: 150 },
  { title: '类型', key: 'type', width: 70, align: 'center' },
  { title: '状态', key: 'status', width: 80, align: 'center' },
  { title: '优先级', key: 'priority', width: 65, align: 'center' },
  { title: '创建时间', dataIndex: 'createdAt', width: 150, customRender: ({ text }) => new Date(text).toLocaleString() },
  { title: '操作', key: 'action', width: 140, align: 'center', fixed: 'right' }
]

onMounted(() => {
  loadData()
  loadStats()
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await workOrderApi.getWorkOrders({
      status: currentStatus.value,
      keyword: searchKeyword.value
    })
    workOrders.value = res || []
  } catch (e) {
    console.error(e)
    message.error('加载工单列表失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await workOrderApi.getWorkOrderStats()
    stats.value = res
  } catch (e) {
    console.error(e)
  }
}

const handleStatusChange = () => {
  loadData()
}

const handleClose = () => {
  disable('work-order')
}

const showCreateModal = () => {
  editOrderData.value = null
  createModalVisible.value = true
}

const handleEditFromDetail = (order: WorkOrder) => {
  editOrderData.value = order
  createModalVisible.value = true
}

const handleCreateSuccess = () => {
  const isEdit = !!editOrderData.value
  createModalVisible.value = false
  editOrderData.value = null
  message.success(isEdit ? '工单更新成功' : '工单创建成功')
  loadData()
  loadStats()
}

const showDispatchModal = (record: WorkOrder) => {
  selectedOrder.value = record
  dispatchModalVisible.value = true
}

const handleDispatchSuccess = () => {
  dispatchModalVisible.value = false
  message.success('派单成功')
  loadData()
  loadStats()
}

const handleDelete = async (id: string) => {
  try {
    await workOrderApi.deleteWorkOrder(id)
    message.success('删除成功')
    loadData()
    loadStats()
  } catch (e) {
    message.error('删除失败')
  }
}

const viewDetail = (record: WorkOrder) => {
  selectedOrder.value = record
  detailModalVisible.value = true
}

// 辅助函数
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

const getStatusBadge = (status: string) => {
  const map: any = { pending: 'warning', processing: 'processing', completed: 'success', cancelled: 'default' }
  return map[status] || 'default'
}

const getPriorityLabel = (p: string) => {
  const map: any = { low: '低', medium: '中', high: '高', critical: '紧急' }
  return map[p] || p
}
</script>

<style scoped lang="less">
.work-order-container {
  padding: 16px;
  height: 100%;
  min-height: 550px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(0, 20, 40, 0.3);

  // 统计卡片 - 简洁紧凑
  .stat-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    
    .stat-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 12px 16px;
      border-radius: 6px;
      text-align: center;
      border-left: 3px solid;
      transition: all 0.2s;
      
      &:hover {
        background: rgba(255, 255, 255, 0.08);
        transform: translateY(-1px);
      }
      
      .stat-value {
        font-size: 28px;
        font-weight: 600;
        color: #fff;
        line-height: 1.2;
      }
      .stat-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        margin-top: 4px;
        letter-spacing: 1px;
      }
      
      &.total { border-left-color: #1890ff; .stat-value { color: #1890ff; } }
      &.pending { border-left-color: #faad14; .stat-value { color: #faad14; } }
      &.processing { border-left-color: #52c41a; .stat-value { color: #52c41a; } }
      &.completed { border-left-color: #8c8c8c; .stat-value { color: #8c8c8c; } }
    }
  }

  // 工具栏 - 清晰分组
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    
    .left-actions {
      display: flex;
      align-items: center;
      gap: 0;
    }
    
    .status-filter {
      :deep(.ant-radio-group) {
        display: flex;
        gap: 4px;
        
        .ant-radio-button-wrapper {
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          padding: 0 12px;
          height: 28px;
          line-height: 26px;
          font-size: 12px;
          
          &:hover {
            color: #1890ff;
            border-color: #1890ff;
          }
          
          &.ant-radio-button-wrapper-checked {
            background: #1890ff;
            border-color: #1890ff;
            color: #fff;
          }
          
          &::before {
            display: none;
          }
        }
      }
    }
    
    .right-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  
  // 表格区域
  .order-list {
    flex: 1;
    overflow: auto;
    
    :deep(.ant-table) {
      background: transparent;
      
      .ant-table-thead > tr > th {
        background: rgba(0, 0, 0, 0.2);
        color: rgba(255, 255, 255, 0.85);
        font-weight: 500;
        font-size: 13px;
        padding: 10px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        
        // 移除表头列之间的分隔线
        &::before {
          display: none !important;
        }
      }
      
      .ant-table-tbody > tr > td {
        padding: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.85);
        font-size: 13px;
      }
      
      .ant-table-tbody > tr:hover > td {
        background: rgba(24, 144, 255, 0.08);
      }
      
      // 操作按钮样式
      .ant-space {
        flex-wrap: nowrap;
        gap: 0 !important;
      }
      
      .ant-btn-link {
        padding: 0 6px;
        font-size: 12px;
      }
    }
    
    .order-no {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 12px;
      color: #40a9ff;
      letter-spacing: 0.5px;
    }
    
    .priority-tag {
      display: inline-block;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 3px;
      font-weight: 500;
      text-align: center;
      min-width: 40px;
      
      &.critical { color: #fff; background: #f5222d; }
      &.high { color: #fff; background: #fa541c; }
      &.medium { color: #fff; background: #faad14; }
      &.low { color: #fff; background: #52c41a; }
    }
  }
}

// 标题样式
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 0;
  
  .dialog-title {
    display: flex;
    align-items: baseline;
    gap: 10px;
    
    .title-tip {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.4);
      font-weight: normal;
    }
  }
  
  .close-btn {
    color: rgba(255, 255, 255, 0.6);
    padding: 4px 8px;
    height: auto;
    
    &:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>
