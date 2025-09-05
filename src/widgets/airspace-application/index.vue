<template>
  <mars-dialog title="空域申请" icon="file-text" custom-class="airspace-application-panel" :draggable="true" width="1200" height="800" top="60" left="120">
    <!-- 顶部工具栏 -->
    <div class="airspace-toolbar">
      <div class="status-tabs">
        <mars-button 
          v-for="status in statusList" 
          :key="status.value"
          :type="activeStatus === status.value ? 'primary' : 'default'"
          @click="handleStatusChange(status.value)"
        >
          {{ status.label }}
          <span class="count">({{ getTaskCountByStatus(status.value) }})</span>
        </mars-button>
      </div>

      <div class="action-controls">
        <mars-button @click="handleAddTask" type="primary">
          <mars-icon icon="plus" :width="16" />
          申请新任务
        </mars-button>
        <mars-button @click="handleRefresh">
          <mars-icon icon="refresh" :width="16" />
          刷新
        </mars-button>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="task-list-container">
      <mars-table
        :columns="tableColumns"
        :data-source="filteredTasks"
        :pagination="paginationConfig"
        :loading="loading"
        row-key="id"
        @change="handleTableChange"
      >
        <!-- 状态列自定义渲染 -->
        <template #status="{ record }">
          <span :class="`status-tag ${getStatusClass(record.status)}`">
            {{ getStatusText(record.status) }}
          </span>
        </template>

        <!-- 航线列自定义渲染 -->
        <template #routeName="{ record }">
          <span>{{ record.routeName || '-' }}</span>
          <mars-icon 
            v-if="record.routeName" 
            icon="eye" 
            :width="14" 
            style="margin-left: 8px; cursor: pointer; color: #1890ff;"
            @click="previewRoute(record)"
          />
        </template>

        <!-- 操作列自定义渲染 -->
        <template #action="{ record }">
          <div class="action-buttons">
            <mars-button size="small" @click="handleViewDetail(record)">查看</mars-button>
            <mars-button 
              v-if="record.status === 'pending'" 
              size="small" 
              type="primary" 
              @click="handleEdit(record)"
            >
              编辑
            </mars-button>
            <mars-button 
              v-if="record.status === 'pending'" 
              size="small" 
              type="danger" 
              @click="handleDelete(record)"
            >
              删除
            </mars-button>
          </div>
        </template>
      </mars-table>
    </div>

    <!-- 新增/编辑任务弹窗 -->
         <mars-dialog 
       v-model:visible="formVisible" 
       :title="isEditMode ? '编辑任务' : '申请新任务'" 
       width="600" 
       height="500"
       top="150" 
       left="300"
       custom-class="task-form-dialog"
     >
       <div class="task-form">
         <a-form layout="vertical" :model="taskForm">
           <a-form-item label="任务名称" required>
             <a-input 
               v-model:value="taskForm.name" 
               placeholder="请输入任务名称"
               :maxlength="50"
             />
           </a-form-item>

           <a-form-item label="任务执行开始时间" required>
             <a-date-picker 
               v-model:value="taskForm.startTime"
               show-time
               format="YYYY-MM-DD HH:mm:ss"
               placeholder="请选择执行时间"
               style="width: 100%"
             />
           </a-form-item>

           <a-form-item label="飞行航线" required>
             <a-select 
               v-model:value="taskForm.routeId"
               placeholder="请选择航线"
               :loading="routeLoading"
               style="width: 100%"
               @change="handleRouteChange"
             >
               <a-select-option 
                 v-for="route in availableRoutes" 
                 :key="route.id" 
                 :value="route.id"
               >
                 {{ route.name }} ({{ route.waypoints?.length || 0 }}个航点)
               </a-select-option>
             </a-select>
             <div v-if="selectedRoute" class="route-info">
               <small>
                 飞行高度：{{ selectedRoute.altitude }}米 | 
                 速度：{{ selectedRoute.speed }}m/s | 
                 航点数：{{ selectedRoute.waypoints?.length || 0 }}
               </small>
             </div>
           </a-form-item>

           <a-form-item label="任务说明">
             <a-textarea 
               v-model:value="taskForm.description"
               placeholder="请输入任务说明（可选）"
               :rows="4"
               :maxlength="200"
             />
           </a-form-item>
         </a-form>
       </div>

      <template #footer>
        <div class="form-footer">
          <mars-button @click="formVisible = false">取消</mars-button>
          <mars-button type="primary" @click="handleSubmit" :loading="submitLoading">
            {{ isEditMode ? '更新' : '提交申请' }}
          </mars-button>
        </div>
      </template>
    </mars-dialog>

    <!-- 任务详情弹窗 -->
    <mars-dialog 
      v-model:visible="detailVisible" 
      title="任务详情" 
      width="800" 
      height="600"
      top="100" 
      left="200"
      custom-class="task-detail-dialog"
    >
      <div v-if="currentTask" class="task-detail">
        <div class="detail-section">
          <h3>基本信息</h3>
          <div class="detail-row">
            <span class="label">任务名称：</span>
            <span class="value">{{ currentTask.name }}</span>
          </div>
          <div class="detail-row">
            <span class="label">任务状态：</span>
            <span :class="`status-tag ${getStatusClass(currentTask.status)}`">
              {{ getStatusText(currentTask.status) }}
            </span>
          </div>
          <div class="detail-row">
            <span class="label">申请时间：</span>
            <span class="value">{{ formatDateTime(currentTask.createdAt) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">执行时间：</span>
            <span class="value">{{ formatDateTime(currentTask.startTime) }}</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>航线信息</h3>
          <div class="detail-row">
            <span class="label">航线名称：</span>
            <span class="value">{{ currentTask.routeName || '-' }}</span>
          </div>
          <div v-if="currentTask.routeInfo" class="route-detail">
            <div class="detail-row">
              <span class="label">飞行高度：</span>
              <span class="value">{{ currentTask.routeInfo.altitude }}米</span>
            </div>
            <div class="detail-row">
              <span class="label">飞行速度：</span>
              <span class="value">{{ currentTask.routeInfo.speed }}m/s</span>
            </div>
            <div class="detail-row">
              <span class="label">航点数量：</span>
              <span class="value">{{ currentTask.routeInfo.waypoints?.length || 0 }}个</span>
            </div>
          </div>
        </div>

        <div v-if="currentTask.description" class="detail-section">
          <h3>任务说明</h3>
          <div class="description">{{ currentTask.description }}</div>
        </div>

        <div v-if="currentTask.auditInfo" class="detail-section">
          <h3>审核信息</h3>
          <div class="detail-row">
            <span class="label">审核状态：</span>
            <span :class="`status-tag ${getStatusClass(currentTask.status)}`">
              {{ getStatusText(currentTask.status) }}
            </span>
          </div>
          <div v-if="currentTask.auditInfo.auditTime" class="detail-row">
            <span class="label">审核时间：</span>
            <span class="value">{{ formatDateTime(currentTask.auditInfo.auditTime) }}</span>
          </div>
          <div v-if="currentTask.auditInfo.auditor" class="detail-row">
            <span class="label">审核人：</span>
            <span class="value">{{ currentTask.auditInfo.auditor }}</span>
          </div>
          <div v-if="currentTask.auditInfo.comment" class="detail-row">
            <span class="label">审核意见：</span>
            <span class="value">{{ currentTask.auditInfo.comment }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <mars-button @click="detailVisible = false">关闭</mars-button>
      </template>
    </mars-dialog>
  </mars-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue"
import { useWidget } from "@mars/common/store/widget"
import { $message } from "@mars/components/mars-ui"
import dayjs from "dayjs"
import type { AirspaceTask, AirspaceTaskForm, TaskStatus, RouteInfo } from "./types/index"

// Widget相关
const { currentWidget } = useWidget()

// 响应式数据
const loading = ref(false)
const routeLoading = ref(false)
const submitLoading = ref(false)
const taskList = ref<AirspaceTask[]>([])
const availableRoutes = ref<RouteInfo[]>([])
const activeStatus = ref<TaskStatus | 'all'>('all')
const formVisible = ref(false)
const detailVisible = ref(false)
const isEditMode = ref(false)
const currentTask = ref<AirspaceTask | null>(null)

// 表单数据
const taskForm = reactive({
  name: '',
  startTime: null as any,
  routeId: '',
  description: ''
})

// 状态列表
const statusList = [
  { label: '全部', value: 'all' as const },
  { label: '待审核', value: 'pending' as const },
  { label: '审核通过', value: 'approved' as const },
  { label: '已结束', value: 'completed' as const }
]

// 分页配置
const paginationConfig = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

// 表格列配置
const tableColumns = [
  {
    title: "任务名称",
    dataIndex: "name",
    key: "name",
    width: 200
  },
  {
    title: "执行时间", 
    dataIndex: "startTime",
    key: "startTime",
    width: 180,
    customRender: ({ text }: any) => formatDateTime(text)
  },
  {
    title: "航线名称",
    dataIndex: "routeName", 
    key: "routeName",
    width: 150,
    slots: { customRender: "routeName" }
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status", 
    width: 120,
    slots: { customRender: "status" }
  },
  {
    title: "申请时间",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 180,
    customRender: ({ text }: any) => formatDateTime(text)
  },
  {
    title: "操作",
    key: "action",
    width: 200,
    fixed: "right",
    slots: { customRender: "action" }
  }
]

// 计算属性
const filteredTasks = computed(() => {
  if (activeStatus.value === 'all') {
    return taskList.value
  }
  return taskList.value.filter(task => task.status === activeStatus.value)
})

const selectedRoute = computed(() => {
  return availableRoutes.value.find(route => route.id === taskForm.routeId)
})

// 监听器
watch(() => taskForm.routeId, () => {
  // 当选择航线时，可以在这里做一些处理
})

// 生命周期
onMounted(() => {
  loadTaskList()
  loadAvailableRoutes()
})

// 方法
const loadTaskList = async () => {
  try {
    loading.value = true
    // 模拟API调用 - 这里需要替换为实际的API
    const mockTasks: AirspaceTask[] = [
      {
        id: '1',
        name: '测试巡检任务1',
        startTime: '2024-12-20 09:00:00',
        routeId: 'route_1',
        routeName: '测试航线1',
        status: 'pending',
        description: '这是一个测试巡检任务',
        createdAt: '2024-12-18 10:30:00',
                 routeInfo: {
           id: 'route_1',
           name: '测试航线1',
           altitude: 100,
           speed: 15,
           createdAt: '2024-12-10 10:00:00',
           waypoints: [
             { lng: 114.305, lat: 30.593, alt: 100 },
             { lng: 114.315, lat: 30.603, alt: 100 }
           ]
         }
      },
      {
        id: '2', 
        name: '环境监测任务',
        startTime: '2024-12-19 14:00:00',
        routeId: 'route_2',
        routeName: '监测航线A',
        status: 'approved',
        description: '环境监测专用任务',
        createdAt: '2024-12-17 15:20:00',
        auditInfo: {
          auditTime: '2024-12-18 09:00:00',
          auditor: '张三',
          comment: '审核通过，可以执行'
        },
                 routeInfo: {
           id: 'route_2',
           name: '监测航线A', 
           altitude: 120,
           speed: 12,
           createdAt: '2024-12-12 14:30:00',
           waypoints: [
             { lng: 114.31, lat: 30.59, alt: 120 }
           ]
         }
      },
      {
        id: '3',
        name: '应急响应任务',
        startTime: '2024-12-16 08:00:00', 
        routeId: 'route_3',
        routeName: '应急航线B',
        status: 'completed',
        description: '应急情况响应任务',
        createdAt: '2024-12-15 16:45:00',
        auditInfo: {
          auditTime: '2024-12-15 18:00:00',
          auditor: '李四',
          comment: '紧急任务，优先执行'
        },
                 routeInfo: {
           id: 'route_3',
           name: '应急航线B',
           altitude: 80,
           speed: 20,
           createdAt: '2024-12-14 09:15:00',
           waypoints: [
             { lng: 114.32, lat: 30.60, alt: 80 }
           ]
         }
      }
    ]
    
    taskList.value = mockTasks
    paginationConfig.total = mockTasks.length
    
  } catch (error) {
    console.error("加载任务列表失败:", error)
    $message("加载任务列表失败", "error")
  } finally {
    loading.value = false
  }
}

const loadAvailableRoutes = async () => {
  try {
    routeLoading.value = true
    // 模拟从路径规划模块获取航线数据
    // 这里需要与route-planning和route-management模块集成
    const mockRoutes: RouteInfo[] = [
      {
        id: 'route_1',
        name: '测试航线1',
        altitude: 100,
        speed: 15,
        description: '用于测试的航线',
        createdAt: '2024-12-10 10:00:00',
        waypoints: [
          { lng: 114.305, lat: 30.593, alt: 100 },
          { lng: 114.315, lat: 30.603, alt: 100 }
        ]
      },
      {
        id: 'route_2', 
        name: '监测航线A',
        altitude: 120,
        speed: 12,
        description: '环境监测专用航线',
        createdAt: '2024-12-12 14:30:00',
        waypoints: [
          { lng: 114.31, lat: 30.59, alt: 120 },
          { lng: 114.32, lat: 30.60, alt: 120 },
          { lng: 114.33, lat: 30.61, alt: 120 }
        ]
      },
      {
        id: 'route_3',
        name: '应急航线B', 
        altitude: 80,
        speed: 20,
        description: '应急响应航线',
        createdAt: '2024-12-14 09:15:00',
        waypoints: [
          { lng: 114.32, lat: 30.60, alt: 80 },
          { lng: 114.34, lat: 30.62, alt: 80 }
        ]
      }
    ]
    
    availableRoutes.value = mockRoutes
    
  } catch (error) {
    console.error("加载航线列表失败:", error)
    $message("加载航线列表失败", "error")
  } finally {
    routeLoading.value = false
  }
}

const handleStatusChange = (status: TaskStatus | 'all') => {
  activeStatus.value = status
  paginationConfig.current = 1
}

const handleRefresh = () => {
  loadTaskList()
  loadAvailableRoutes()
}

const handleAddTask = () => {
  resetForm()
  isEditMode.value = false
  formVisible.value = true
}

const handleEdit = (task: AirspaceTask) => {
  taskForm.name = task.name
  taskForm.startTime = task.startTime ? dayjs(task.startTime) : null
  taskForm.routeId = task.routeId
  taskForm.description = task.description || ''
  currentTask.value = task
  isEditMode.value = true
  formVisible.value = true
}

const handleViewDetail = (task: AirspaceTask) => {
  currentTask.value = task
  detailVisible.value = true
}

const handleDelete = async (task: AirspaceTask) => {
  // 这里应该显示确认对话框
  try {
    // 模拟删除API调用
    $message("删除成功", "success")
    loadTaskList()
  } catch (error) {
    console.error("删除失败:", error)
    $message("删除失败", "error")
  }
}

const handleSubmit = async () => {
  // 表单验证
  if (!taskForm.name.trim()) {
    $message("请输入任务名称", "warning")
    return
  }
  if (!taskForm.startTime) {
    $message("请选择执行时间", "warning")  
    return
  }
  if (!taskForm.routeId) {
    $message("请选择航线", "warning")
    return
  }

  try {
    submitLoading.value = true
    
    // 准备提交的数据
    const submitData = {
      ...taskForm,
      startTime: taskForm.startTime && typeof taskForm.startTime.format === 'function' 
        ? taskForm.startTime.format('YYYY-MM-DD HH:mm:ss') 
        : ''
    }
    
    // 模拟API调用
    if (isEditMode.value) {
      // 更新任务
      console.log("更新任务:", submitData)
      $message("更新成功", "success")
    } else {
      // 创建新任务
      console.log("创建任务:", submitData)
      $message("申请提交成功", "success")
    }
    
    formVisible.value = false
    loadTaskList()
    
  } catch (error) {
    console.error("提交失败:", error)
    $message("提交失败", "error")
  } finally {
    submitLoading.value = false
  }
}

const handleRouteChange = (routeId: string) => {
  // 当选择航线时的处理
  console.log("选择航线:", routeId)
}

const handleTableChange = (pagination: any) => {
  paginationConfig.current = pagination.current
  paginationConfig.pageSize = pagination.pageSize
}

const previewRoute = (task: AirspaceTask) => {
  // 预览航线 - 这里可以调用地图显示功能
  console.log("预览航线:", task)
  $message("航线预览功能开发中", "info")
}

const resetForm = () => {
  taskForm.name = ''
  taskForm.startTime = null
  taskForm.routeId = ''
  taskForm.description = ''
  currentTask.value = null
}

// 工具函数
const getTaskCountByStatus = (status: TaskStatus | 'all'): number => {
  if (status === 'all') {
    return taskList.value.length
  }
  return taskList.value.filter(task => task.status === status).length
}

const getStatusClass = (status: TaskStatus): string => {
  const classMap = {
    pending: 'pending',
    approved: 'approved', 
    rejected: 'rejected',
    completed: 'completed'
  }
  return classMap[status] || 'pending'
}

const getStatusText = (status: TaskStatus): string => {
  const textMap = {
    pending: '待审核',
    approved: '审核通过',
    rejected: '审核拒绝', 
    completed: '已结束'
  }
  return textMap[status] || '未知'
}

const formatDateTime = (dateString: string): string => {
    if (!dateString) { return '-' }
  return new Date(dateString).toLocaleString('zh-CN')
}
</script>

<style lang="less" scoped>
.airspace-application-panel {
  .airspace-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 16px;
    background: var(--mars-control-bg);
    border-radius: 4px;

    .status-tabs {
      display: flex;
      gap: 8px;
      
      .mars-button {
        .count {
          margin-left: 4px;
          font-weight: normal;
        }
      }
    }

    .action-controls {
      display: flex;
      gap: 8px;
    }
  }

  .task-list-container {
    height: calc(100% - 100px);
    overflow: auto;

    .status-tag {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      
      &.pending {
        background: #fff7e6;
        color: #fa8c16;
        border: 1px solid #ffd591;
      }
      
      &.approved {
        background: #f6ffed;
        color: #52c41a;
        border: 1px solid #b7eb8f;
      }
      
      &.rejected {
        background: #fff2f0;
        color: #ff4d4f;
        border: 1px solid #ffccc7;
      }
      
      &.completed {
        background: #f0f0f0;
        color: #666;
        border: 1px solid #d9d9d9;
      }
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }
  }
}

.task-form-dialog {
  .task-form {
    .route-info {
      margin-top: 8px;
      color: #666;
      font-size: 12px;
    }
  }
  
  .form-footer {
    display: flex;
    justify-content: center;
    gap: 12px;
  }
}

.task-detail-dialog {
  .task-detail {
    .detail-section {
      margin-bottom: 24px;
      
      h3 {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f0f0f0;
      }
      
      .detail-row {
        display: flex;
        margin-bottom: 12px;
        
        .label {
          width: 120px;
          color: #666;
          flex-shrink: 0;
        }
        
        .value {
          flex: 1;
          word-break: break-all;
        }
      }
      
      .description {
        padding: 12px;
        background: #f9f9f9;
        border-radius: 4px;
        line-height: 1.6;
      }
      
      .route-detail {
        margin-left: 20px;
        padding-left: 16px;
        border-left: 2px solid #f0f0f0;
      }
    }
  }
}
</style>
