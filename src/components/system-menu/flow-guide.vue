<template>
  <div v-show="visible" class="flow-guide">
    <div class="flow-header">
      <div class="header-left">
        <span class="title">流程向导</span>
        <span class="subtitle">从准备到报告的最短路径</span>
      </div>
      <a-button size="small" type="text" class="close-btn" @click="$emit('close')">收起</a-button>
    </div>

    <div class="step-list">
      <div
        v-for="(step, index) in steps"
        :key="step.key"
        class="step-item"
        :class="{ active: isStepActive(step) }"
      >
        <div class="step-index">{{ index + 1 }}</div>
        <div class="step-body">
          <div class="step-title">{{ step.title }}</div>
          <div class="step-desc">{{ step.desc }}</div>
          <div class="step-actions">
            <a-button
              v-for="action in step.actions"
              :key="action.key"
              size="small"
              :type="action.primary ? 'primary' : 'default'"
              @click="runAction(action)"
            >
              {{ action.label }}
            </a-button>
            <a-button v-if="step.next" size="small" type="link" @click="goNext(step.next)">下一步</a-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from "vue"
import { useWidget } from "@mars/common/store/widget"

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(["close"])

const { activate, isActivate } = useWidget()
const setViewMode = inject<((mode: string) => void) | undefined>("setViewMode")

const steps = computed(() => [
  {
    key: "resource",
    title: "资源准备",
    desc: "完善机型、设备与人员信息，确保资源可用",
    activeWidgets: ["aircraft-management", "device-management", "personnel-management"],
    actions: [
      { key: "aircraft", label: "机型管理", widget: "aircraft-management", primary: true },
      { key: "device", label: "设备管理", widget: "device-management" },
      { key: "personnel", label: "人员管理", widget: "personnel-management" }
    ],
    next: "route"
  },
  {
    key: "route",
    title: "航线规划",
    desc: "创建或维护航线，并确保航线信息完整",
    activeWidgets: ["route-planning", "route-management", "auto-route-planning"],
    actions: [
      { key: "manual", label: "手动规划", widget: "route-planning", primary: true },
      { key: "auto", label: "自动规划", widget: "auto-route-planning" },
      { key: "manage", label: "航线管理", widget: "route-management" }
    ],
    next: "airspace-calc"
  },
  {
    key: "airspace-calc",
    title: "空域计算",
    desc: "进行航线冲突与高度限制检测",
    activeWidgets: ["airspace-computation"],
    actions: [{ key: "calc", label: "空域计算", widget: "airspace-computation", primary: true }],
    next: "work-order"
  },
  {
    key: "work-order",
    title: "工单与任务",
    desc: "创建工单与任务，并分配航线与人员",
    activeWidgets: ["work-order", "task-management"],
    actions: [
      { key: "work", label: "工单管理", widget: "work-order", primary: true },
      { key: "task", label: "任务管理", widget: "task-management" }
    ],
    next: "airspace-apply"
  },
  {
    key: "airspace-apply",
    title: "空域申请",
    desc: "提交空域申请并等待审批",
    activeWidgets: ["airspace-application"],
    actions: [{ key: "apply", label: "空域申请", widget: "airspace-application", primary: true }],
    next: "execute"
  },
  {
    key: "execute",
    title: "执行监控",
    desc: "执行任务并监控飞行过程",
    activeWidgets: ["flight-demo"],
    actions: [
      { key: "demo", label: "飞行演示", widget: "flight-demo", primary: true },
      { key: "dashboard", label: "指挥大屏", viewMode: "dashboard" }
    ],
    next: "report"
  },
  {
    key: "report",
    title: "报告归档",
    desc: "查看飞行报告并沉淀任务结果",
    activeWidgets: ["flight-report"],
    actions: [{ key: "report", label: "飞行报告", widget: "flight-report", primary: true }]
  }
])

const runAction = (action: any) => {
  if (action.widget) {
    activate({ name: action.widget })
    return
  }
  if (action.viewMode && setViewMode) {
    setViewMode(action.viewMode)
  }
}

const goNext = (nextKey: string) => {
  const target = steps.value.find((step: any) => step.key === nextKey)
  if (!target || target.actions.length === 0) {
    return
  }
  runAction(target.actions[0])
}

const isStepActive = (step: any) => {
  if (!step.activeWidgets) {
    return false
  }
  return step.activeWidgets.some((name: string) => isActivate(name))
}
</script>

<style scoped lang="less">
.flow-guide {
  position: absolute;
  top: 90px;
  left: 12px;
  width: 320px;
  max-height: calc(100vh - 140px);
  z-index: 9985;
  background: rgba(8, 18, 38, 0.85);
  border: 1px solid rgba(0, 193, 222, 0.35);
  border-radius: 10px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
  display: flex;
  flex-direction: column;
  color: #e8edf3;
}

.flow-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  .title {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 1px;
    color: #00c1de;
  }

  .subtitle {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.45);
    margin-top: 4px;
  }

  .close-btn {
    color: rgba(255, 255, 255, 0.6);
  }
}

.step-list {
  padding: 12px 10px 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;

  &.active {
    border-color: rgba(24, 144, 255, 0.8);
    background: rgba(24, 144, 255, 0.12);
  }
}

.step-index {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 193, 222, 0.2);
  color: #00c1de;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-top: 2px;
}

.step-body {
  flex: 1;

  .step-title {
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
  }

  .step-desc {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin: 4px 0 8px;
    line-height: 1.4;
  }

  .step-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
}

@media (max-width: 1024px) {
  .flow-guide {
    display: none;
  }
}
</style>
