<template>
  <mars-dialog 
    v-model:visible="isActivate" 
    title="空域申请" 
    :width="1200"
    :height="700"
    top="100px"
    left="150px"
  >
    <div class="airspace-application">
      <div class="header-section">
        <h3>飞行任务申请</h3>
        <div class="filter-section">
          <span>状态筛选：</span>
          <a-select v-model:value="filterStatus" style="width: 120px; margin-right: 20px;">
            <a-select-option value="all">全部</a-select-option>
            <a-select-option value="pending">待审核</a-select-option>
            <a-select-option value="approved">审核通过</a-select-option>
            <a-select-option value="completed">已结束</a-select-option>
          </a-select>
          <a-button type="primary" @click="showAddForm">申请新任务</a-button>
        </div>
      </div>

      <div class="table-section">
        <a-table 
          :columns="columns" 
          :data-source="tableData" 
          :pagination="pagination"
          rowKey="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'algorithm'">
              <span>{{ getAlgorithmText(record.algorithm) }}</span>
            </template>
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                {{ getStatusText(record.status) }}
              </a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <a-space>
                <a-button size="small" @click="viewDetail(record)">查看</a-button>
                <a-button size="small" type="primary" v-if="record.status === 'pending'" @click="editTask(record)">编辑</a-button>
                <a-button size="small" danger v-if="record.status === 'pending'" @click="deleteTask(record)">删除</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 新增任务弹窗 -->
      <a-modal v-model:open="addFormVisible" title="申请新任务" width="600px" @ok="handleSubmit" @cancel="handleCancel">
        <a-form :model="formData" layout="vertical">
          <a-form-item label="任务名称">
            <a-input v-model:value="formData.name" placeholder="请输入任务名称" />
          </a-form-item>
          <a-form-item label="执行时间">
            <a-date-picker v-model:value="formData.startTime" show-time placeholder="请选择执行时间" style="width: 100%" />
          </a-form-item>
          <a-form-item label="飞行航线">
            <a-select v-model:value="formData.routeId" placeholder="请选择航线">
              <a-select-option value="route1">北区巡检航线</a-select-option>
              <a-select-option value="route2">南区巡检航线</a-select-option>
              <a-select-option value="route3">应急响应航线</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="执行算法">
            <a-select v-model:value="formData.algorithm" placeholder="请选择执行算法">
              <a-select-option value="drainage_cover_detection">高速排水沟盖板缺失检测算法</a-select-option>
              <a-select-option value="isolation_fence_damage_detection">高速隔离栏破损检测算法</a-select-option>
              <a-select-option value="urban_garbage_detection">城市垃圾堆检测算法</a-select-option>
              <a-select-option value="safety_helmet_recognition">安全帽识别算法</a-select-option>
              <a-select-option value="engineering_vehicle_detection">工程车辆检测算法</a-select-option>
              <a-select-option value="road_crack_detection">道路裂纹检测算法</a-select-option>
              <a-select-option value="fire_smoke_detection">烟火检测算法</a-select-option>
              <a-select-option value="general_person_vehicle_detection">通用人车检测算法</a-select-option>
              <a-select-option value="water_target_detection">水上目标检测算法</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="任务描述">
            <a-textarea v-model:value="formData.description" rows="3" placeholder="请输入任务描述" />
          </a-form-item>
        </a-form>
      </a-modal>
    </div>
  </mars-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useWidget } from '@mars/common/store/widget'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

// Widget状态管理
const { isActivate } = useWidget()

// 筛选状态
const filterStatus = ref('all')

// 定义接口
interface Task {
  id: string
  name: string
  startTime: string
  routeName: string
  routeId: string
  algorithm: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  createdAt: string
  description: string
}

// 本地存储Key
const STORAGE_KEY = 'uav_airspace_tasks'

// 表格数据
const allTasks = ref<Task[]>([])

const tableData = computed(() => {
  if (filterStatus.value === 'all') {
    return allTasks.value
  }
  return allTasks.value.filter(task => task.status === filterStatus.value)
})

// 加载数据
const loadTasks = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      allTasks.value = JSON.parse(stored)
    } else {
      // 初始化模拟数据
      allTasks.value = [
        {
          id: '1',
          name: '北区日常巡检任务',
          startTime: '2024-01-15 09:00:00',
          routeName: '北区巡检航线',
          routeId: 'route1',
          algorithm: 'road_crack_detection',
          status: 'pending',
          createdAt: '2024-01-10 14:30:00',
          description: '对北区进行日常巡检'
        },
        {
          id: '2', 
          name: '南区应急响应任务',
          startTime: '2024-01-16 10:30:00',
          routeName: '南区巡检航线',
          routeId: 'route2',
          algorithm: 'fire_smoke_detection',
          status: 'approved',
          createdAt: '2024-01-11 16:45:00',
          description: '南区发生紧急情况，需要无人机响应'
        }
      ]
      saveTasks()
    }
  } catch (e) {
    console.error('Failed to load tasks', e)
  }
}

// 保存数据
const saveTasks = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allTasks.value))
}

// 表格列配置
const columns = [
  {
    title: '任务名称',
    dataIndex: 'name',
    key: 'name',
    width: 200
  },
  {
    title: '执行时间',
    dataIndex: 'startTime', 
    key: 'startTime',
    width: 180
  },
  {
    title: '航线名称',
    dataIndex: 'routeName',
    key: 'routeName', 
    width: 150
  },
  {
    title: '执行算法',
    dataIndex: 'algorithm',
    key: 'algorithm',
    width: 200
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120
  },
  {
    title: '申请时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180
  },
  {
    title: '操作',
    key: 'action',
    width: 200
  }
]

// 分页配置
const pagination = computed(() => ({
  total: tableData.value.length,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
}))

// 新增表单相关
const addFormVisible = ref(false)
const formData = ref({
  name: '',
  startTime: null as any,
  routeId: undefined,
  algorithm: undefined,
  description: ''
})

// 状态相关方法
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    completed: 'default'
  }
  return colors[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待审核',
    approved: '审核通过',
    rejected: '已驳回',
    completed: '已结束'
  }
  return texts[status] || status
}

// 算法相关方法（复用，实际项目建议提取为常量）
const getAlgorithmText = (algorithm: string) => {
  const algorithms: Record<string, string> = {
    drainage_cover_detection: '高速排水沟盖板缺失检测算法',
    isolation_fence_damage_detection: '高速隔离栏破损检测算法',
    urban_garbage_detection: '城市垃圾堆检测算法',
    safety_helmet_recognition: '安全帽识别算法',
    engineering_vehicle_detection: '工程车辆检测算法',
    road_crack_detection: '道路裂纹检测算法',
    fire_smoke_detection: '烟火检测算法',
    general_person_vehicle_detection: '通用人车检测算法',
    water_target_detection: '水上目标检测算法'
  }
  return algorithms[algorithm] || algorithm
}

// 航线名称映射（模拟）
const getRouteName = (routeId: string) => {
  const routes: Record<string, string> = {
    route1: '北区巡检航线',
    route2: '南区巡检航线',
    route3: '应急响应航线'
  }
  return routes[routeId] || routeId
}

// 事件处理方法
const showAddForm = () => {
  addFormVisible.value = true
}

const handleSubmit = () => {
  if (!formData.value.name || !formData.value.startTime || !formData.value.routeId || !formData.value.algorithm) {
    message.error('请填写完整信息')
    return
  }

  const newTask: Task = {
    id: Date.now().toString(),
    name: formData.value.name,
    startTime: dayjs(formData.value.startTime).format('YYYY-MM-DD HH:mm:ss'),
    routeName: getRouteName(formData.value.routeId as unknown as string),
    routeId: formData.value.routeId as unknown as string,
    algorithm: formData.value.algorithm as unknown as string,
    status: 'pending',
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    description: formData.value.description
  }

  allTasks.value.unshift(newTask)
  saveTasks()

  message.success('任务申请成功！')
  addFormVisible.value = false
  resetForm()
}

const handleCancel = () => {
  addFormVisible.value = false
  resetForm()
}

const resetForm = () => {
  formData.value = {
    name: '',
    startTime: null,
    routeId: undefined,
    algorithm: undefined,
    description: ''
  }
}

const viewDetail = (record: Task) => {
  message.info(`查看任务：${record.name}`)
  // TODO: 显示详情弹窗
}

const editTask = (record: Task) => {
  // 简化的编辑：仅允许撤回或修改描述（模拟）
  message.info(`编辑功能开发中：${record.name}`)
}

const deleteTask = (record: Task) => {
  allTasks.value = allTasks.value.filter(t => t.id !== record.id)
  saveTasks()
  message.success(`删除任务成功：${record.name}`)
}

// 模拟审核通过（仅用于演示）
const approveTask = (record: Task) => {
  record.status = 'approved'
  saveTasks()
  message.success('任务已审核通过')
}

// 模拟驳回（仅用于演示）
const rejectTask = (record: Task) => {
  record.status = 'rejected'
  saveTasks()
  message.warning('任务已驳回')
}

onMounted(() => {
  loadTasks()
  console.log('空域申请模块加载完成，数据已同步')
})
</script>

<style scoped>
.airspace-application {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.header-section h3 {
  margin: 0;
  color: #1890ff;
}

.filter-section {
  display: flex;
  align-items: center;
}

.filter-section span {
  margin-right: 10px;
  color: #666;
}

.table-section {
  margin-top: 20px;
}
</style>
