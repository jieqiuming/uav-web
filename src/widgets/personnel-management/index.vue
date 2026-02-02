<template>
  <mars-dialog v-model:visible="isActivate" width="800" right="20" top="80" bottom="60">
    <template #title>
      <div class="dialog-header">
        <div class="dialog-title">
          <span>人员管理</span>
          <span class="title-tip">Personnel Management</span>
        </div>
        <a-button type="text" class="close-btn" @click="handleClose">
          <template #icon><CloseOutlined /></template>
        </a-button>
      </div>
    </template>

    <div class="personnel-container">
      <!-- 统计 -->
      <a-row :gutter="16" class="stats-row">
        <a-col :span="6">
          <a-card size="small" :bordered="false" class="stat-card">
            <template #title>总人数</template>
            <div class="stat-value">{{ stats.total }}</div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card size="small" :bordered="false" class="stat-card idle">
            <template #title>空闲</template>
            <div class="stat-value">{{ stats.idle }}</div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card size="small" :bordered="false" class="stat-card busy">
            <template #title>执行任务</template>
            <div class="stat-value">{{ stats.busy }}</div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card size="small" :bordered="false" class="stat-card leave">
            <template #title>休假</template>
            <div class="stat-value">{{ stats.leave }}</div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 列表 -->
      <div class="list-container">
        <div class="toolbar">
           <a-input-search
            v-model:value="keyword"
            placeholder="搜索姓名/执照号"
            style="width: 250px"
            @search="loadData"
          />
          <a-button @click="loadData">刷新</a-button>
        </div>
        
        <a-table 
          :dataSource="pilots" 
          :columns="columns" 
          :loading="loading"
          rowKey="id"
          :pagination="{ pageSize: 5 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'level'">
              <a-tag color="blue">{{ record.level }}</a-tag>
            </template>
            
            <template v-if="column.key === 'status'">
               <a-badge :status="getStatusBadge(record.status)" :text="getStatusText(record.status)" />
            </template>
            
            <template v-if="column.key === 'action'">
              <a-dropdown>
                <a-button size="small" type="link">状态变更 <DownOutlined /></a-button>
                <template #overlay>
                  <a-menu @click="({ key }) => handleStatusChange(record.id, key)">
                    <a-menu-item key="idle" :disabled="record.status === 'idle'">空闲</a-menu-item>
                    <a-menu-item key="busy" :disabled="record.status === 'busy'">执行任务</a-menu-item>
                    <a-menu-item key="leave" :disabled="record.status === 'leave'">休假</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </template>
          </template>
        </a-table>
      </div>
    </div>
  </mars-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWidget } from "@mars/common/store/widget"
import { message } from "ant-design-vue"
import { DownOutlined, CloseOutlined } from "@ant-design/icons-vue"
import * as personnelApi from "@/api/services/personnel"
import type { Pilot } from "@/api/services/personnel"

const { isActivate, disable } = useWidget()

const handleClose = () => {
  disable('personnel-management')
}

const loading = ref(false)
const pilots = ref<Pilot[]>([])
const stats = ref({ total: 0, idle: 0, busy: 0, leave: 0 })
const keyword = ref("")

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '等级', key: 'level' },
  { title: '执照编号', dataIndex: 'licenseNo' },
  { title: '累计飞行(h)', dataIndex: 'flightHours' },
  { title: '状态', key: 'status' },
  { title: '联系电话', dataIndex: 'phone' },
  { title: '操作', key: 'action' }
]

onMounted(() => {
  loadData()
  loadStats()
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await personnelApi.getPilotList({ keyword: keyword.value })
    pilots.value = res || []
  } catch (e) {
    message.error("加载列表失败")
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await personnelApi.getPilotStats()
    stats.value = res
  } catch (e) {}
}

const handleStatusChange = async (id: string, status: any) => {
  try {
    await personnelApi.updatePilotStatus(id, status)
    message.success("状态更新成功")
    loadData()
    loadStats()
  } catch (e) {
    message.error("更新失败")
  }
}

const getStatusBadge = (status: string) => {
  const map: any = { idle: 'success', busy: 'processing', leave: 'default' }
  return map[status] || 'default'
}

const getStatusText = (status: string) => {
   const map: any = { idle: '空闲待命', busy: '执行任务', leave: '休假/离岗' }
  return map[status] || status
}
</script>

<style scoped lang="less">
.personnel-container {
  padding: 15px;
  
  .stats-row {
    margin-bottom: 20px;
    
    .stat-card {
      text-align: center;
      background: #f5f5f5;
      
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #1890ff;
      }
      
      &.idle .stat-value { color: #52c41a; }
      &.busy .stat-value { color: #1890ff; }
      &.leave .stat-value { color: #999; }
    }
  }
  
  .toolbar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }
}

// 标题样式
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  
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
