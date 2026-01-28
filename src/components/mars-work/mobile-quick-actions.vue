<template>
  <div class="mobile-quick-actions" v-if="isMobile">
    <div class="action-btn takeoff-btn" @click="handleTakeoff">
      <mars-icon icon="take-off" width="24" color="#fff" />
      <span class="label">一键起飞</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'

const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const handleTakeoff = () => {
  message.loading('正在执行起飞前检查...', 1)
  setTimeout(() => {
    message.success('指令已发送：一键起飞执行中')
    // 这里可以触发实际的业务逻辑或事件总线
  }, 1000)
}
</script>

<style scoped lang="less">
.mobile-quick-actions {
  position: absolute;
  /* 位于屏幕右侧，工具栏和搜索框下方，留出足够间距 */
  right: 15px;
  bottom: 250px; /* 避开底部可能的其他控件 */
  z-index: 99;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.action-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid rgba(255, 255, 255, 0.2);

  &:active {
    transform: scale(0.95);
    background: linear-gradient(135deg, #096dd9 0%, #0050b3 100%);
  }

  .mars-icon {
    margin-bottom: 2px;
  }

  .label {
    font-size: 10px;
    color: #fff;
    line-height: 1;
    transform: scale(0.9);
  }
}

.takeoff-btn {
  /* 特殊强调样式 */
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(24, 144, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0);
  }
}
</style>
