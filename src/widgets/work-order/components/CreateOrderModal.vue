<template>
  <a-modal
    :visible="visible"
    :title="isEditMode ? '编辑工单' : '新建工单'"
    @ok="handleOk"
    @cancel="handleCancel"
    :confirmLoading="confirmLoading"
    width="600px"
  >
    <a-form layout="vertical" :model="formState" ref="formRef">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="工单类型" name="type" :rules="[{ required: true, message: '请选择类型' }]">
            <a-select v-model:value="formState.type">
              <a-select-option value="inspection">例行巡检</a-select-option>
              <a-select-option value="repair">故障报修</a-select-option>
              <a-select-option value="rescue">紧急救援</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="优先级" name="priority" :rules="[{ required: true, message: '请选择优先级' }]">
            <a-select v-model:value="formState.priority">
              <a-select-option value="low">低</a-select-option>
              <a-select-option value="medium">中</a-select-option>
              <a-select-option value="high">高</a-select-option>
              <a-select-option value="critical">紧急</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="工单标题" name="title" :rules="[{ required: true, message: '请输入标题' }]">
        <a-input v-model:value="formState.title" placeholder="例如：变电站2号塔巡检" />
      </a-form-item>

      <a-form-item label="位置地点" name="address" :rules="[{ required: true, message: '请输入地址' }]">
        <a-input v-model:value="formState.address" placeholder="详细地址或坐标描述" />
      </a-form-item>
      
      <a-form-item label="描述说明" name="description">
        <a-textarea v-model:value="formState.description" :rows="4" placeholder="请输入工单详细描述..." />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import * as workOrderApi from "@/api/services/work-order"
import type { WorkOrder } from "@/api/services/work-order"

const props = defineProps<{
  visible: boolean
  editData?: WorkOrder | null
}>()

const emit = defineEmits(['update:visible', 'success'])

const isEditMode = ref(false)
const confirmLoading = ref(false)
const formRef = ref()

const formState = reactive({
  id: '',
  type: 'inspection',
  priority: 'medium',
  title: '',
  description: '',
  address: '',
  lng: 117.2,
  lat: 31.8
})

// Watch for editData changes
watch(() => props.editData, (data) => {
  if (data) {
    isEditMode.value = true
    formState.id = data.id
    formState.type = data.type
    formState.priority = data.priority
    formState.title = data.title
    formState.description = data.description || ''
    formState.address = data.location?.address || ''
    formState.lng = data.location?.lng || 117.2
    formState.lat = data.location?.lat || 31.8
  }
}, { immediate: true })

// Reset form when opening for new
watch(() => props.visible, (val) => {
  if (val && !props.editData) {
    isEditMode.value = false
    formState.id = ''
    formState.type = 'inspection'
    formState.priority = 'medium'
    formState.title = ''
    formState.description = ''
    formState.address = ''
  }
})

const handleOk = async () => {
  try {
    await formRef.value.validate()
    confirmLoading.value = true
    
    const payload = {
      ...formState,
      type: formState.type as any,
      priority: formState.priority as any,
      location: {
        lng: formState.lng,
        lat: formState.lat,
        address: formState.address
      }
    }
    
    if (isEditMode.value) {
      await workOrderApi.updateWorkOrder(payload)
    } else {
      await workOrderApi.createWorkOrder(payload)
    }
    
    emit('success')
  } catch (e) {
    // validation failed or api error
  } finally {
    confirmLoading.value = false
  }
}

const handleCancel = () => {
  emit('update:visible', false)
}
</script>
