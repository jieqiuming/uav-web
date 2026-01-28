<template>
  <mars-dialog v-model:visible="isActivate" title="飞行任务管理" width="800" right="200" top="100">
    <div class="task-management">
      <div class="toolbar">
        <mars-button type="primary" @click="showCreateModal">创建任务</mars-button>
        <mars-button @click="loadTasks">刷新</mars-button>
      </div>

      <mars-table
        :columns="columns"
        :data-source="taskList"
        row-key="id"
        :pagination="{ pageSize: 5 }"
        bordered
      >
        <template #action="{ record }">
          <a-space>
            <a-button type="link" size="small" @click="executeTask(record)">执行</a-button>
            <a-button type="link" size="small" danger @click="deleteTask(record.id)">删除</a-button>
          </a-space>
        </template>
      </mars-table>

      <!-- 创建任务弹窗 -->
      <mars-dialog
        v-model:visible="isModalVisible"
        title="创建新任务"
        width="500"
        :footer="null"
        custom-class="create-task-modal"
      >
        <a-form layout="vertical" :model="formState" @finish="handleCreate">
          <a-form-item label="任务名称" name="name" :rules="[{ required: true, message: '请输入任务名称' }]">
            <mars-input v-model:value="formState.name" placeholder="请输入任务名称" />
          </a-form-item>

          <a-form-item label="选择机型" name="aircraftId" :rules="[{ required: true, message: '请选择机型' }]">
            <mars-select
              v-model:value="formState.aircraftId"
              :options="aircraftOptions"
              placeholder="请选择执飞无人机"
            />
          </a-form-item>

          <a-form-item label="选择航线" name="routeId" :rules="[{ required: true, message: '请选择航线' }]">
            <mars-select
              v-model:value="formState.routeId"
              :options="routeOptions"
              placeholder="请选择预定航线"
            />
          </a-form-item>

          <a-form-item label="任务描述" name="description">
            <mars-textarea v-model:value="formState.description" :rows="3" />
          </a-form-item>

          <div class="form-footer text-right">
            <a-space>
              <mars-button @click="isModalVisible = false">取消</mars-button>
              <mars-button type="primary" html-type="submit">创建</mars-button>
            </a-space>
          </div>
        </a-form>
      </mars-dialog>
    </div>
  </mars-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import * as mapWork from "./map.js"
import useLifecycle from "@mars/common/uses/use-lifecycle"
import { useWidget } from "@mars/common/store/widget"
import { message } from "ant-design-vue"
import dayjs from "dayjs"
import * as aircraftApi from "@mars/widgets/aircraft-management/api/aircraft"

useLifecycle(mapWork)
const { isActivate, activate, disable } = useWidget()

// 状态定义
const taskList = ref<any[]>([])
const isModalVisible = ref(false)
const aircraftOptions = ref<any[]>([])
const routeOptions = ref<any[]>([])

// 本地存储Key
const STORAGE_KEY = "uav_tasks"

const formState = reactive({
  name: "",
  aircraftId: undefined,
  routeId: undefined,
  description: ""
})

const columns = [
  { title: "任务名称", dataIndex: "name", key: "name" },
  { title: "机型", dataIndex: "aircraftName", key: "aircraftName" },
  { title: "航线", dataIndex: "routeName", key: "routeName" },
  { title: "创建时间", dataIndex: "createdAt", key: "createdAt" },
  { title: "操作", key: "action", slots: { customRender: "action" }, width: 150 }
]

// 加载数据 (机型、航线、任务)
const loadData = async () => {
  // 1. 加载机型 (通过API确保数据初始化)
  try {
    const res = await aircraftApi.getActiveAircraftOptions()
    if (res && res.data) {
       aircraftOptions.value = res.data
    }
  } catch (e) {
    console.error("加载机型失败", e)
  }

  // 2. 加载航线
  try {
    const routes = JSON.parse(localStorage.getItem("uav_routes") || "[]")
    routeOptions.value = routes.map((r: any) => ({
      value: r.id,
      label: r.name,
      origin: r
    }))
  } catch (e) {
    console.error("加载航线失败", e)
  }

  // 3. 加载任务
  loadTasks()
}

const loadTasks = () => {
   try {
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    taskList.value = tasks
  } catch (e) {
    console.error("加载任务列表失败", e)
  }
}

const saveTasks = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(taskList.value))
}

const showCreateModal = () => {
  isModalVisible.value = true
  // 重置表单
  formState.name = ""
  formState.aircraftId = undefined
  formState.routeId = undefined
  formState.description = ""
}

const handleCreate = () => {
  if (!formState.name || !formState.aircraftId || !formState.routeId) {
    message.error("请填写完整信息")
    return
  }

  // 获取关联名称
  const aircraft = aircraftOptions.value.find(a => a.value === formState.aircraftId)
  const route = routeOptions.value.find(r => r.value === formState.routeId)

  const newTask = {
    id: Date.now().toString(),
    name: formState.name,
    aircraftId: formState.aircraftId,
    aircraftName: aircraft?.label || "未知机型",
    routeId: formState.routeId,
    routeName: route?.label || "未知航线",
    description: formState.description,
    createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    status: "pending"
  }

  taskList.value.unshift(newTask)
  saveTasks()
  
  message.success("任务创建成功")
  isModalVisible.value = false
}

const executeTask = (record: any) => {
  message.loading("正在启动飞行任务...", 1)
  
  // 获取完整的航线数据
  const route = routeOptions.value.find(r => r.value === record.routeId)?.origin
  
  if (!route) {
    message.error("关联的航线数据已丢失，无法执行")
    return
  }

  // 补全机型名称到航线数据中(用于显示)
  route.aircraftName = record.aircraftName

  // 启动演练前先关闭任务管理列表，防止遮挡
  disable("task-management")

  // 跳转到飞行演示模块
  activate({
    name: "flight-demo",
    data: {
      action: "start_task",
      route: route,
      taskId: record.id
    }
  })
}

const deleteTask = (id: string) => {
  taskList.value = taskList.value.filter(t => t.id !== id)
  saveTasks()
  message.success("任务删除成功")
}

onMounted(() => {
  loadData()
})
</script>



<style scoped lang="less">
.task-management {
  padding: 10px;
  
  .toolbar {
    margin-bottom: 16px;
    display: flex;
    gap: 10px;
  }
}
</style>
