<template>
  <mars-dialog v-model:visible="isActivate" title="机型管理" icon="drone" custom-class="aircraft-management-panel" :draggable="true" width="1100" height="700" top="90" left="80">
    <!-- 统计信息 -->
    <div class="stats-panel">
      <div class="stat-item total">
        <div class="label">机型总数</div>
        <div class="value">{{ stats.totalCount }}</div>
      </div>
      <div class="stat-item active">
        <div class="label">启用中</div>
        <div class="value">{{ stats.activeCount }}</div>
      </div>
      <div class="stat-item inactive">
        <div class="label">已禁用</div>
        <div class="value">{{ stats.inactiveCount }}</div>
      </div>
    </div>

    <!-- 顶部工具栏 -->
    <div class="aircraft-toolbar">
      <div class="search-controls">
        <mars-input v-model="searchKeyword" placeholder="搜索机型名称或编码..." style="width: 300px" @change="handleSearch">
          <template #prefix>
            <mars-icon icon="search" :width="16" />
          </template>
        </mars-input>
        <mars-button @click="handleSearch" type="primary">
          <mars-icon icon="search" :width="16" />
          搜索
        </mars-button>
      </div>

      <div class="action-controls">
        <mars-button @click="handleAdd" type="primary">
          <mars-icon icon="plus" :width="16" />
          新增机型
        </mars-button>
        <mars-button @click="handleRefresh">
          <mars-icon icon="refresh" :width="16" />
          刷新
        </mars-button>
        <a-dropdown v-if="selectedRowKeys.length > 0">
          <template #overlay>
            <a-menu>
              <a-menu-item @click="handleBatchStatus(1)">批量启用</a-menu-item>
              <a-menu-item @click="handleBatchStatus(0)">批量禁用</a-menu-item>
              <a-menu-item @click="handleBatchDelete" style="color: #ff4d4f">批量删除</a-menu-item>
            </a-menu>
          </template>
          <mars-button>
            批量操作
            <mars-icon icon="down" :width="16" />
          </mars-button>
        </a-dropdown>
      </div>
    </div>

    <!-- 机型列表表格 -->
    <div class="aircraft-table-container">
      <mars-table
        :columns="tableColumns"
        :data-source="aircraftList"
        :pagination="paginationConfig"
        :loading="loading"
        :row-selection="rowSelection"
        row-key="id"
        :scroll="{ x: 1300 }" 
        @change="handleTableChange"
      >
        <!-- 图片列自定义渲染 -->
        <template #imageUrl="{ record }">
          <img 
            v-if="record.imageUrl" 
            :src="record.imageUrl" 
            style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px" 
            alt="机型图片"
          />
          <mars-icon v-else icon="drone" :width="30" color="#999" />
        </template>

        <!-- 状态列自定义渲染 -->
        <template #status="{ record }">
          <span :class="`status-tag ${record.status === 1 ? 'active' : 'inactive'}`">
            {{ record.status === 1 ? "启用" : "禁用" }}
          </span>
        </template>

        <!-- 操作列自定义渲染 -->
        <template #action="{ record }">
          <div class="action-buttons">
            <mars-button size="small" type="primary" @click="handleEdit(record)"> 编辑 </mars-button>
            <mars-button size="small" type="danger" @click="handleDelete(record)"> 删除 </mars-button>
            <mars-button size="small" @click="handleToggleStatus(record)">
              {{ record.status === 1 ? "禁用" : "启用" }}
            </mars-button>
          </div>
        </template>
      </mars-table>
    </div>

    <!-- 新增/编辑机型弹窗 -->
    <AircraftForm v-model:visible="formVisible" :aircraft-data="currentAircraft" :is-edit="isEditMode" @success="handleFormSuccess" />

    <!-- 删除确认弹窗 -->
    <mars-dialog title="确认删除" v-model:visible="deleteVisible" width="400" height="160" top="420" left="450" custom-class="delete-confirm-dialog">
      <div class="delete-content">
        <p>确定要删除机型 "{{ deleteTarget?.modelName }}" 吗？</p>
        <p style="color: #ff4d4f; font-size: 12px">注意：删除后将无法恢复，且关联的航线和任务可能受到影响。</p>
      </div>

      <template #footer>
        <div class="delete-dialog-footer" style="display: flex; justify-content: center; gap: 12px; width: 100%; padding-bottom: 10px;">
          <mars-button @click="deleteVisible = false">取消</mars-button>
          <mars-button type="danger" @click="confirmDelete" :loading="deleteLoading"> 确认 </mars-button>
        </div>
      </template>
    </mars-dialog>
  </mars-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue"
import { useWidget } from "@mars/common/store/widget"
import AircraftForm from "./components/AircraftForm.vue"
import { $message } from "@mars/components/mars-ui"
import * as aircraftApi from "@/api/services/aircraft" // Updated import
import type { AircraftModel, AircraftSearchParams, AircraftStats } from "./types/index"
import { Modal } from "ant-design-vue"

const { isActivate } = useWidget()

// 状态变量
const loading = ref(false)
const aircraftList = ref<AircraftModel[]>([])
const stats = ref<AircraftStats>({ totalCount: 0, activeCount: 0, inactiveCount: 0, manufacturerStats: [] })
const searchKeyword = ref("")
const selectedRowKeys = ref<number[]>([])

// 弹窗控制
const formVisible = ref(false)
const deleteVisible = ref(false)
const deleteLoading = ref(false)
const currentAircraft = ref<AircraftModel | null>(null)
const deleteTarget = ref<AircraftModel | null>(null)
const isEditMode = ref(false)

// 搜索参数
const searchParams = computed<AircraftSearchParams>(() => ({
  keyword: searchKeyword.value,
  page: paginationConfig.current,
  pageSize: paginationConfig.pageSize
}))

// 分页配置
const paginationConfig = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true
})

// 行选择配置
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: number[]) => {
    selectedRowKeys.value = keys
  }
}))

// 表格列配置
const tableColumns = [
  { title: "图片", dataIndex: "imageUrl", key: "imageUrl", slots: { customRender: "imageUrl" }, width: 80 },
  { title: "机型名称", dataIndex: "modelName", key: "modelName", width: 150 },
  { title: "编码", dataIndex: "modelCode", key: "modelCode", width: 120 },
  { title: "机型类型", dataIndex: "modelType", key: "modelType", width: 100 },
  { title: "最大载重(kg)", dataIndex: "maxPayload", key: "maxPayload", width: 120 },
  { title: "最大航程(km)", dataIndex: "maxRange", key: "maxRange", width: 120 },
  { title: "最大飞行时长(min)", dataIndex: "maxFlightTime", key: "maxFlightTime", width: 150 },
  { title: "状态", dataIndex: "status", key: "status", slots: { customRender: "status" }, width: 80 },
  { title: "操作", key: "action", slots: { customRender: "action" }, width: 200, fixed: "right" }
]

// 方法
const loadAircraftList = async () => {
  try {
    loading.value = true
    const response = await aircraftApi.getAircraftList(searchParams.value)
    // Interceptor 已经解包了 data，直接使用 response
    aircraftList.value = response.records
    paginationConfig.total = response.total
    loadStats()
  } catch (error) {
    console.error("加载机型列表失败:", error)
    $message("加载机型列表失败", "error")
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await aircraftApi.getAircraftStats()
    stats.value = res // Interceptor 已经解包了 data
  } catch (error) {
    console.error("加载统计失败", error)
  }
}

const handleSearch = () => {
  paginationConfig.current = 1
  loadAircraftList()
}
// ... (后面代码逻辑基本不需要变，因为其他方法主要是 void 或者不依赖返回值结构)

const handleRefresh = () => {
  searchKeyword.value = ""
  paginationConfig.current = 1
  loadAircraftList()
}

const handleAdd = () => {
  currentAircraft.value = null
  isEditMode.value = false
  formVisible.value = true
}

const handleEdit = (aircraft: AircraftModel) => {
  currentAircraft.value = { ...aircraft }
  isEditMode.value = true
  formVisible.value = true
}

const handleDelete = (aircraft: AircraftModel) => {
  deleteTarget.value = aircraft
  deleteVisible.value = true
}

const confirmDelete = async () => {
  if (!deleteTarget.value) {
    return
  }

  try {
    deleteLoading.value = true
    await aircraftApi.deleteAircraft(deleteTarget.value.id)
    $message("删除成功", "success")
    deleteVisible.value = false
    loadAircraftList()
  } catch (error) {
    console.error("删除失败:", error)
    $message("删除失败", "error")
  } finally {
    deleteLoading.value = false
  }
}

const handleToggleStatus = async (aircraft: AircraftModel) => {
  try {
    const newStatus = aircraft.status === 1 ? 0 : 1
    await aircraftApi.updateAircraftStatus(aircraft.id, newStatus)
    $message(`${newStatus === 1 ? "启用" : "禁用"}成功`, "success")
    loadAircraftList()
  } catch (error) {
    console.error("状态更新失败:", error)
    $message("状态更新失败", "error")
  }
}

const handleBatchDelete = () => {
  if (selectedRowKeys.value.length === 0) {
    return
  }
  
  Modal.confirm({
    title: "确认批量删除",
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 个机型吗？此操作不可恢复。`,
    okType: "danger",
    onOk: async () => {
      try {
        await aircraftApi.batchDeleteAircraft(selectedRowKeys.value)
        $message("批量删除成功", "success")
        selectedRowKeys.value = []
        loadAircraftList()
      } catch (error) {
        $message("批量删除失败", "error")
      }
    }
  })
}

const handleBatchStatus = (status: number) => {
  if (selectedRowKeys.value.length === 0) {
    return
  }

  Modal.confirm({
    title: status === 1 ? "确认批量启用" : "确认批量禁用",
    content: `确定要${status === 1 ? "启用" : "禁用"}选中的 ${selectedRowKeys.value.length} 个机型吗？`,
    onOk: async () => {
      try {
        await aircraftApi.batchUpdateAircraftStatus(selectedRowKeys.value, status)
        $message("批量更新状态成功", "success")
        selectedRowKeys.value = []
        loadAircraftList()
      } catch (error) {
        $message("批量更新状态失败", "error")
      }
    }
  })
}

const handleTableChange = (pagination: any) => {
  paginationConfig.current = pagination.current
  paginationConfig.pageSize = pagination.pageSize
  loadAircraftList()
}

const handleFormSuccess = () => {
  formVisible.value = false
  loadAircraftList()
}

onMounted(() => {
  loadAircraftList()
})
</script>

<style lang="less" scoped>
.aircraft-management-panel {
  .aircraft-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap; /* 允许换行 */
    gap: 10px; /* 增加 gap 处理换行后的间距 */
    margin-bottom: 16px;
    padding: 16px;
    background: var(--mars-control-bg);
    border-radius: 4px;

    .search-controls {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .action-controls {
      display: flex;
      gap: 8px;
    }
  }

  /* 移动端适配 */
  @media (max-width: 768px) {
    .aircraft-toolbar {
       flex-direction: column;
       align-items: stretch;
       
       .search-controls {
         width: 100%;
         .mars-input {
           width: 100% !important; /* 强制搜索框满宽 */
         }
       }
       
       .action-controls {
         justify-content: space-between;
         margin-top: 10px;
       }
    }
  }

  .stats-panel {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    flex-wrap: wrap; /* 允许换行 */
    
    .stat-item {
      flex: 1;
      min-width: 100px; /* 防止无限缩小 */
      background: var(--mars-control-bg);
      padding: 16px;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      
      .label {
        font-size: 14px;
        color: var(--mars-text-color-secondary);
      }
      
      .value {
        font-size: 24px;
        font-weight: bold;
        color: var(--mars-text-color);
      }
      
      &.active .value {
        color: #52c41a;
      }
      
      &.inactive .value {
        color: #ff4d4f;
      }
    }
  }

  .aircraft-table-container {
    height: calc(100% - 80px);
    overflow: auto;

    // 表格深色主题样式
    :deep(.mars-table),
    :deep(.ant-table) {
      background: transparent;
      
      .ant-table-thead > tr > th {
        background: rgba(0, 0, 0, 0.2);
        color: rgba(255, 255, 255, 0.85);
        font-weight: 500;
        font-size: 13px;
        padding: 10px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        
        &::before {
          display: none !important;
        }
      }
      
      .ant-table-tbody > tr > td {
        padding: 10px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.85);
        font-size: 13px;
      }
      
      .ant-table-tbody > tr:hover > td {
        background: rgba(24, 144, 255, 0.08);
      }
    }

    .status-tag {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;

      &.active {
        background: #52c41a;
        color: #fff;
        border: none;
      }

      &.inactive {
        background: #ff4d4f;
        color: #fff;
        border: none;
      }
    }

    .action-buttons {
      display: flex;
      gap: 4px;
      flex-wrap: nowrap;
      
      :deep(.mars-button) {
        padding: 0 8px;
        font-size: 12px;
      }
    }
  }

  :deep(.delete-confirm-dialog .mars-dialog__footer) {
    justify-content: center !important;
    padding-left: 0 !important;
  }

  .delete-dialog-footer {
    display: flex;
    justify-content: center;
    gap: 12px;
    width: 100%;
  }

  .delete-content {
    padding: 10px 0;
    
    p {
      margin: 12px 0;
      line-height: 1.6;
      
      &:first-child {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 16px;
      }
      
      &:last-child {
        margin-top: 16px;
        margin-bottom: 8px;
      }
    }
  }
}
</style>

