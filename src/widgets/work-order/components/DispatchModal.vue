<template>
  <a-modal
    :visible="visible"
    title="工单派发"
    @ok="handleOk"
    @cancel="handleCancel"
    :confirmLoading="confirmLoading"
  >
    <div class="dispatch-info" v-if="workOrder">
      <p>正在为工单 <strong>{{ workOrder.no }}</strong> 指派资源</p>
    </div>

    <a-form layout="vertical">
      <a-form-item label="选择无人机" required>
        <a-select v-model:value="selectedAircraft" placeholder="请选择可用无人机" :loading="loadingAircraft">
          <a-select-option v-for="ac in aircraftList" :key="ac.id" :value="ac.id">
            {{ ac.modelName }} ({{ ac.modelCode }}) {{ ac.status === 1 ? '- 可用' : '' }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="选择飞手" required>
        <a-select v-model:value="selectedPilot" placeholder="请选择飞手" :loading="loadingPilots">
           <a-select-option v-for="pilot in pilotList" :key="pilot.id" :value="pilot.id">
            {{ pilot.name }} ({{ pilot.level }}) - {{ getStatusText(pilot.status) }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="选择航线">
        <a-select v-model:value="selectedRoute" placeholder="请选择航线（可稍后规划）" :loading="loadingRoutes" allowClear>
          <a-select-option v-for="route in routeList" :key="route.id" :value="route.id">
            {{ route.name }} (约{{ route.distance ? (route.distance/1000).toFixed(1) : '?' }}km)
          </a-select-option>
        </a-select>
        <div class="route-tip">如暂无航线，可在任务创建后通过航线规划设置</div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import * as workOrderApi from "@/api/services/work-order"
import * as aircraftApi from "@/api/services/aircraft"
import * as personnelApi from "@/api/services/personnel"
import * as flightTaskApi from "@/api/services/flight-task"
import * as routeApi from "@/api/services/route"
import * as airspaceApi from "@/api/services/airspace"
import { message } from 'ant-design-vue'

const props = defineProps<{
  visible: boolean
  workOrder: any
}>()

const emit = defineEmits(['update:visible', 'success'])

const confirmLoading = ref(false)
const loadingAircraft = ref(false)
const loadingPilots = ref(false)
const loadingRoutes = ref(false)
const aircraftList = ref<any[]>([])
const pilotList = ref<any[]>([])
const routeList = ref<any[]>([])
const selectedAircraft = ref<string | undefined>(undefined)
const selectedPilot = ref<string | undefined>(undefined)
const selectedRoute = ref<string | undefined>(undefined)

watch(() => props.visible, (val) => {
  if (val) {
    loadAircraft()
    loadPilots()
    loadRoutes()
    selectedAircraft.value = undefined
    selectedPilot.value = undefined
    selectedRoute.value = undefined
  }
})

const loadAircraft = async () => {
  loadingAircraft.value = true
  try {
    const res = await aircraftApi.getAircraftList({ status: 1 }) // Filter active aircraft
    if (res && res.records) {
      aircraftList.value = res.records
    }
  } catch (e) {
    message.error("加载无人机列表失败")
  } finally {
    loadingAircraft.value = false
  }
}

const loadPilots = async () => {
  loadingPilots.value = true
  try {
    const res = await personnelApi.getPilotList({ status: 'idle' }) // Filter idle pilots
    pilotList.value = res || []
  } catch (e) {
    message.error("加载飞手列表失败")
  } finally {
    loadingPilots.value = false
  }
}

const loadRoutes = async () => {
  loadingRoutes.value = true
  try {
    const res = await routeApi.getRoutes()
    routeList.value = res || []
  } catch (e) {
    console.error("加载航线列表失败", e)
  } finally {
    loadingRoutes.value = false
  }
}

const handleOk = async () => {
  confirmLoading.value = true
  try {
    // 1. Dispatch Work Order
    await workOrderApi.dispatchWorkOrder(props.workOrder.id, {
      aircraftId: selectedAircraft.value,
      pilotId: selectedPilot.value
    })
    
    // 2. Update resource status
    await personnelApi.updatePilotStatus(selectedPilot.value, 'busy')
    
    // 3. Create linked Flight Task (Auto-generate)
    // Find names
    const aircraft = aircraftList.value.find(a => a.id === selectedAircraft.value)
    const pilot = pilotList.value.find(p => p.id === selectedPilot.value)
    const route = selectedRoute.value ? routeList.value.find(r => r.id === selectedRoute.value) : null
    
    const newTask = await flightTaskApi.createFlightTask({
      name: `${props.workOrder.title}-执行任务`,
      workOrderId: props.workOrder.id,
      workOrderNo: props.workOrder.no,
      aircraftId: selectedAircraft.value,
      aircraftName: aircraft?.modelName || 'Unknown',
      pilotId: selectedPilot.value,
      pilotName: pilot?.name,
      routeId: route?.id || 'pending',
      routeName: route?.name || '待规划航线',
      description: `基于工单 ${props.workOrder.no} 自动创建`,
      status: 'pending'
    })
    
    // 4. 自动创建空域申请
    if (route) {
      await airspaceApi.createAirspaceTask({
        name: `${props.workOrder.title}-空域申请`,
        startTime: new Date().toISOString(),
        routeName: route.name,
        routeId: route.id,
        algorithm: 'general_person_vehicle_detection',
        description: `基于工单 ${props.workOrder.no} 自动生成的空域申请`,
        flightTaskId: newTask?.id,
        workOrderId: props.workOrder.id
      })
    }
    
    emit('success')
  } catch (e) {
    message.error('派单失败')
  } finally {
    confirmLoading.value = false
  }
}

const handleCancel = () => {
  emit('update:visible', false)
}

const getStatusText = (status: string) => {
   const map: any = { idle: '空闲', busy: '忙碌', leave: '休假' }
  return map[status] || status
}
</script>

<style scoped>
.tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}
.route-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
