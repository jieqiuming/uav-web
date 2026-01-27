<template>
  <mars-dialog :visible="true" title="飞行任务管理" width="800" right="200" top="100">
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
import * as aircraftApi from "../aircraft-management/api/aircraft"

useLifecycle(mapWork)
const { activate } = useWidget()

// 状态定义
const taskList = ref([])
const isModalVisible = ref(false)
const aircraftOptions = ref([])
const routeOptions = ref([])

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

onMounted(() => {
  loadTasks()
  loadOptions()
})

const loadTasks = () => {
  const tasks = JSON.parse(localStorage.getItem("uav_tasks") || "[]")
  taskList.value = tasks
}

const loadOptions = async () => {
  // 加载机型
  try {
    const res = await aircraftApi.getActiveAircraftOptions()
    aircraftOptions.value = res.data.map(item => ({
      label: `${item.label} (${item.modelCode})`,
      value: item.value
    }))
  } catch (e) {
    console.error("加载机型失败", e)
  }

  // 加载航线 (从localStorage)
  const routes = JSON.parse(localStorage.getItem("uav_routes") || "[]")
  routeOptions.value = routes.map(route => ({
    label: route.name,
    value: route.id,
    routeData: route // 保存完整数据备用
  }))
}

const showCreateModal = () => {
  formState.name = ""
  formState.aircraftId = undefined
  formState.routeId = undefined
  formState.description = ""
  isModalVisible.value = true
}

const handleCreate = () => {
  const newTask = {
    id: Date.now(),
    name: formState.name,
    aircraftId: formState.aircraftId,
    routeId: formState.routeId,
    description: formState.description,
    createdAt: new Date().toLocaleString(),
    status: "pending",
    // 冗余存储名称，方便显示
    aircraftName: aircraftOptions.value.find(o => o.value === formState.aircraftId)?.label,
    routeName: routeOptions.value.find(o => o.value === formState.routeId)?.label
  }

  const tasks = JSON.parse(localStorage.getItem("uav_tasks") || "[]")
  tasks.unshift(newTask)
  localStorage.setItem("uav_tasks", JSON.stringify(tasks))
  
  message.success("任务创建成功")
  isModalVisible.value = false
  loadTasks()
}

const deleteTask = (id: number) => {
  const tasks = JSON.parse(localStorage.getItem("uav_tasks") || "[]")
  const newTasks = tasks.filter((t: any) => t.id !== id)
  localStorage.setItem("uav_tasks", JSON.stringify(newTasks))
  loadTasks()
  message.success("删除成功")
}

const executeTask = (task: any) => {
  const routes = JSON.parse(localStorage.getItem("uav_routes") || "[]")
  const route = routes.find((r: any) => r.id === task.routeId)
  
  if (!route) {
    message.error("关联的航线数据不存在")
    return
  }
  
  // 激活仿真演示插件，并传入航线数据
  if ((window as any).mars3d) { 
     const { activate, updateWidget } = useWidget()
     activate("flight-demo")
     setTimeout(() => {
        updateWidget("flight-demo", { routeData: route, aircraftId: task.aircraftId })
     }, 100)
     message.success(`任务启动：${task.name}`)
  } else {
     message.warning("未检测到地图环境")
  }
}
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
