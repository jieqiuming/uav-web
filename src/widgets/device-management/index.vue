<template>
  <mars-dialog :visible="true" title="设备管理" width="900" right="200" top="100">
    <div class="device-management">
      <div class="toolbar">
        <a-space>
          <mars-button type="primary" @click="showCreateModal">新增设备</mars-button>
          <mars-input-search
            v-model:value="searchText"
            placeholder="搜索设备名称/类型"
            style="width: 250px"
            @search="handleSearch"
          />
        </a-space>
      </div>

      <mars-table
        :columns="columns"
        :data-source="filteredData"
        row-key="id"
        :pagination="{ pageSize: 10 }"
        bordered
      >
        <template #status="{ text }">
           <a-tag :color="text === 'active' ? 'success' : 'default'">
             {{ text === 'active' ? '在线' : '离线' }}
           </a-tag>
        </template>
        <template #action="{ record }">
          <a-space>
            <a-button type="link" size="small" @click="editDevice(record)">编辑</a-button>
            <a-popconfirm title="确定要删除此设备吗?" @confirm="deleteDevice(record.id)">
               <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </mars-table>

      <!-- 新增/编辑弹窗 -->
      <mars-dialog
        v-model:visible="isModalVisible"
        :title="modalTitle"
        width="500"
        :footer="null"
      >
        <a-form layout="vertical" :model="formState" @finish="handleSubmit">
          <a-form-item label="设备名称" name="name" :rules="[{ required: true, message: '请输入设备名称' }]">
            <mars-input v-model:value="formState.name" placeholder="请输入设备名称" />
          </a-form-item>

          <a-form-item label="设备类型" name="type" :rules="[{ required: true, message: '请选择设备类型' }]">
            <mars-select
              v-model:value="formState.type"
              :options="typeOptions"
              placeholder="请选择设备类型"
            />
          </a-form-item>

          <a-form-item label="序列号" name="sn" :rules="[{ required: true, message: '请输入序列号' }]">
             <mars-input v-model:value="formState.sn" placeholder="唯一序列号" />
          </a-form-item>

          <a-form-item label="状态" name="status">
             <a-radio-group v-model:value="formState.status">
               <a-radio value="active">在线</a-radio>
               <a-radio value="inactive">离线</a-radio>
             </a-radio-group>
          </a-form-item>

          <div class="form-footer text-right">
            <a-space>
              <mars-button @click="isModalVisible = false">取消</mars-button>
              <mars-button type="primary" html-type="submit">仅保存</mars-button>
            </a-space>
          </div>
        </a-form>
      </mars-dialog>
    </div>
  </mars-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue"
import { message } from "ant-design-vue"
import dayjs from "dayjs"

// 状态定义
const deviceList = ref<any[]>([])
const isModalVisible = ref(false)
const searchText = ref("")
const editingId = ref<string | null>(null)

// 本地存储Key
const STORAGE_KEY = "uav_devices"

const typeOptions = [
  { label: "光电吊舱", value: "camera" },
  { label: "激光雷达", value: "lidar" },
  { label: "喊话器", value: "speaker" },
  { label: "地面站", value: "gcs" },
  { label: "RTK基站", value: "rtk" }
]

const formState = reactive({
  name: "",
  type: undefined,
  sn: "",
  status: "active"
})

const columns = [
  { title: "设备名称", dataIndex: "name", key: "name" },
  { title: "类型", dataIndex: "type", key: "type", customRender: ({ text }) => typeOptions.find(t=>t.value===text)?.label || text },
  { title: "序列号", dataIndex: "sn", key: "sn" },
  { title: "状态", dataIndex: "status", key: "status", slots: { customRender: "status" } },
  { title: "添加时间", dataIndex: "createdAt", key: "createdAt" },
  { title: "操作", key: "action", slots: { customRender: "action" }, width: 150 }
]

const filteredData = computed(() => {
  if (!searchText.value) return deviceList.value
  const lower = searchText.value.toLowerCase()
  return deviceList.value.filter(item => 
    item.name.toLowerCase().includes(lower) || 
    item.type.toLowerCase().includes(lower) ||
    item.sn.toLowerCase().includes(lower)
  )
})

const modalTitle = computed(() => editingId.value ? "编辑设备" : "新增设备")

// 加载数据
const loadDevices = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      deviceList.value = JSON.parse(stored)
    } else {
      // 初始模拟数据
      deviceList.value = [
        { id: "1", name: "H20T云台相机", type: "camera", sn: "CAM-001", status: "active", createdAt: "2024-01-01 10:00:00" },
        { id: "2", name: "机载喊话器", type: "speaker", sn: "SPK-102", status: "inactive", createdAt: "2024-01-05 14:00:00" }
      ]
      saveDevices()
    }
  } catch (e) {
    console.error("加载设备失败", e)
  }
}

const saveDevices = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deviceList.value))
}

const showCreateModal = () => {
  editingId.value = null
  resetForm()
  isModalVisible.value = true
}

const editDevice = (record: any) => {
  editingId.value = record.id
  formState.name = record.name
  formState.type = record.type
  formState.sn = record.sn
  formState.status = record.status
  isModalVisible.value = true
}

const resetForm = () => {
  formState.name = ""
  formState.type = undefined
  formState.sn = ""
  formState.status = "active"
}

const handleSubmit = () => {
  if (editingId.value) {
    // 编辑
    const index = deviceList.value.findIndex(item => item.id === editingId.value)
    if (index > -1) {
      deviceList.value[index] = {
        ...deviceList.value[index],
        ...formState,
        updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss")
      }
      message.success("更新成功")
    }
  } else {
    // 新增
    const newDevice = {
      id: Date.now().toString(),
      ...formState,
      createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss")
    }
    deviceList.value.unshift(newDevice)
    message.success("添加成功")
  }
  saveDevices()
  isModalVisible.value = false
}

const deleteDevice = (id: string) => {
  deviceList.value = deviceList.value.filter(item => item.id !== id)
  saveDevices()
  message.success("删除成功")
}
const handleSearch = () => {
  // filteredData auto updates
}

onMounted(() => {
  loadDevices()
})
</script>

<style scoped lang="less">
.device-management {
  padding: 10px;
  .toolbar {
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
  }
}
</style>
