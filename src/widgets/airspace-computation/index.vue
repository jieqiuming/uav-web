<template>
  <mars-dialog v-model:visible="isActivate" title="空域计算 - 智能分析" :width="1400" :height="750" top="100px" left="100px">
    <div class="airspace-computation">
      <a-tabs v-model:activeKey="activeTab">
        <!-- 核心功能：航线冲突分析 -->
        <a-tab-pane key="analysis" tab="航线冲突分析">
          <div class="analysis-panel">
            <a-row :gutter="16">
              <a-col :span="8">
                <a-card title="分析设置" size="small">
                  <a-form layout="vertical">
                    <a-form-item label="选择航线">
                      <a-select 
                        v-model:value="selectedRouteId" 
                        placeholder="请选择要分析的航线"
                        style="width: 100%"
                      >
                        <a-select-option v-for="route in routeOptions" :key="route.id" :value="route.id">
                          {{ route.name }}
                        </a-select-option>
                      </a-select>
                    </a-form-item>
                    
                    <a-form-item label="分析项">
                      <a-checkbox-group v-model:value="analysisItems" style="width: 100%">
                        <a-row>
                          <a-col :span="24"><a-checkbox value="zone">禁飞区冲突检测</a-checkbox></a-col>
                          <a-col :span="24"><a-checkbox value="height">高度限制检测</a-checkbox></a-col>
                        </a-row>
                      </a-checkbox-group>
                    </a-form-item>

                    <a-button type="primary" block @click="runAnalysis" :loading="analyzing">
                      开始分析
                    </a-button>
                  </a-form>
                </a-card>

                <a-card title="分析结果" size="small" style="margin-top: 16px">
                  <div v-if="!analysisResult" class="empty-result">
                    <a-empty description="请选择航线并运行分析" />
                  </div>
                  <div v-else class="result-content">
                    <a-alert
                      :type="analysisResult.length > 0 ? 'error' : 'success'"
                      :message="analysisResult.length > 0 ? `发现 ${analysisResult.length} 处冲突` : '检测通过，航线安全'"
                      show-icon
                      style="margin-bottom: 16px"
                    />

                    <div style="max-height: 250px; overflow-y: auto;">
                      <a-list item-layout="horizontal" :data-source="analysisResult" v-if="analysisResult.length > 0">
                        <template #renderItem="{ item }">
                          <a-list-item>
                            <a-list-item-meta :description="item.description">
                              <template #title>
                                <span style="color: #ff4d4f">
                                  <mars-icon icon="attention" width="14"/> 
                                  {{ item.zoneName }}
                                </span>
                              </template>
                            </a-list-item-meta>
                          </a-list-item>
                        </template>
                      </a-list>
                    </div>
                  </div>
                </a-card>
              </a-col>
              <a-col :span="16">
                 <a-card title="空域状态说明" size="small">
                   <a-descriptions bordered size="small" :column="1">
                     <a-descriptions-item label="当前区域">安徽省无为市中心城区</a-descriptions-item>
                     <a-descriptions-item label="红色覆盖">静态禁飞区（行政、工业敏感区）</a-descriptions-item>
                     <a-descriptions-item label="检测算法">球面几何碰撞检测 (Spherical Collision)</a-descriptions-item>
                   </a-descriptions>
                   <div style="margin-top: 10px; padding: 10px; background: #fffbe6; border: 1px solid #ffe58f; border-radius: 4px;">
                     <p style="font-size: 12px; color: #856404; margin-bottom: 0;">
                       <b>小贴士：</b> 分析完成后，地图将自动根据航点位置进行染色。红色点表示该航点处于禁飞区范围内或超过了局部高度限制。
                     </p>
                   </div>
                 </a-card>
              </a-col>
            </a-row>
          </div>
        </a-tab-pane>

        <!-- Tab 2: AI算法库 (完整版本) -->
        <a-tab-pane key="algorithms" tab="AI算法库">
          <div class="algorithms-panel">
            <div class="header-section">
              <div class="filter-section">
                <span>过滤分类：</span>
                <a-select v-model:value="selectedCategory" style="width: 150px; margin-right: 20px">
                  <a-select-option value="all">全部算法</a-select-option>
                  <a-select-option value="infrastructure">基础设施</a-select-option>
                  <a-select-option value="safety">安全检测</a-select-option>
                  <a-select-option value="environment">环境监测</a-select-option>
                  <a-select-option value="traffic">交通相关</a-select-option>
                </a-select>
                <a-input-search
                  v-model:value="searchKeyword"
                  placeholder="搜索算法..."
                  style="width: 250px"
                />
              </div>
            </div>

            <div class="algorithms-grid">
              <div
                v-for="algorithm in filteredAlgorithms"
                :key="algorithm.id"
                class="algorithm-card"
                :class="{ expanded: expandedCards[algorithm.id] }"
                @click="toggleCard(algorithm.id)"
              >
                <div class="card-header">
                  <div class="algorithm-image">
                    <img :src="algorithm.imagePath" :alt="algorithm.name" />
                    <div class="category-tag">{{ getCategoryText(algorithm.category) }}</div>
                  </div>
                  <div class="algorithm-info">
                    <h4>{{ algorithm.name }}</h4>
                    <p class="description">{{ algorithm.description }}</p>
                    <div class="meta-info">
                      <span class="accuracy">
                        <mars-icon icon="check" width="14" />
                        准确率: {{ algorithm.accuracy }}
                      </span>
                    </div>
                  </div>
                  <div class="card-actions">
                    <a-button type="primary" size="small" @click.stop="selectAlgorithm(algorithm)"> 选择 </a-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </mars-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from "vue"
import { useWidget } from "@mars/common/store/widget"
import useLifecycle from "@mars/common/uses/use-lifecycle"
import { message } from "ant-design-vue"
import * as mapWork from "./map"
import type { AlgorithmInfo } from "./types"

// 启用 map.js 生命周期
useLifecycle(mapWork)

const { isActivate, activate } = useWidget()

// 状态
const activeTab = ref("analysis")
const routeOptions = ref<any[]>([])
const selectedRouteId = ref<string | undefined>(undefined)
const analysisItems = ref(["zone", "height"])
const analyzing = ref(false)
const analysisResult = ref<any[] | null>(null)

// 算法筛选状态
const selectedCategory = ref("all")
const searchKeyword = ref("")
const expandedCards = ref<Record<string, boolean>>({})

// 模拟航线数据（如果 localStorage 没有）
const mockRoutes = [
  { id: '1', name: '无为中心城区巡检', waypoints: [[118.31, 31.36, 150], [118.315, 31.365, 150], [118.32, 31.37, 200]] },
  { id: '2', name: '无为西侧工业园航线', waypoints: [[118.28, 31.34, 100], [118.33, 31.372, 300]] }
]

// 算法库数据
const algorithms = ref<AlgorithmInfo[]>([
  {
    id: "drainage_cover_detection",
    name: "高速排水沟盖板缺失检测算法",
    description: "基于深度学习的排水沟盖板缺失智能检测",
    imagePath: "/img/algo/高速排水沟盖板缺失检测算法.png",
    category: "infrastructure",
    accuracy: "95.2%",
    processingTime: "2-3秒",
    applicableScenarios: ["高速公路巡检"]
  },
  {
    id: "isolation_fence_damage_detection",
    name: "高速隔离栏破损检测算法",
    description: "自动识别高速公路隔离栏隐患",
    imagePath: "/img/algo/高速隔离栏破损检测算法.png",
    category: "infrastructure",
    accuracy: "93.8%",
    processingTime: "1-2秒",
    applicableScenarios: ["设施维护"]
  },
  {
    id: "fire_smoke_detection",
    name: "烟火检测算法",
    description: "快速识别早期火灾烟雾",
    imagePath: "/img/algo/烟火检测算法.png",
    category: "safety",
    accuracy: "98.7%",
    processingTime: "1秒",
    applicableScenarios: ["森林防火"]
  },
  {
    id: "safety_helmet_recognition",
    name: "安全帽识别算法",
    description: "实时检测工作人员安全合规",
    imagePath: "/img/algo/安全帽识别算法.png",
    category: "safety",
    accuracy: "97.1%",
    processingTime: "1秒",
    applicableScenarios: ["施工工地"]
  }
])

const loadRoutes = () => {
  try {
    const routes = JSON.parse(localStorage.getItem("uav_routes") || "[]")
    routeOptions.value = routes.length > 0 ? routes : mockRoutes
    if (routeOptions.value.length > 0) {
      selectedRouteId.value = routeOptions.value[0].id
    }
  } catch (e) {
    routeOptions.value = mockRoutes
  }
}

const runAnalysis = () => {
  if (!selectedRouteId.value) {
    message.warning("请先选择一条航线")
    return
  }

  const route = routeOptions.value.find(r => r.id === selectedRouteId.value)
  if (!route) {
    return
  }

  analyzing.value = true
  
  setTimeout(() => {
    const conflicts = mapWork.analyzeRouteConflict(route)
    analysisResult.value = conflicts
    analyzing.value = false
    
    if (conflicts.length > 0) {
      message.error(`分析完成：检测到 ${conflicts.length} 处空间冲突！`)
    } else {
      message.success("分析完成：航线符合安全要求")
    }
  }, 1000)
}

const filteredAlgorithms = computed(() => {
  return algorithms.value.filter(a => {
    const matchCat = selectedCategory.value === "all" || a.category === selectedCategory.value
    const matchKey = !searchKeyword.value || a.name.includes(searchKeyword.value)
    return matchCat && matchKey
  })
})

const getCategoryText = (category: string) => {
  const map: any = { infrastructure: "基础设施", safety: "安全检测", environment: "环境监测", traffic: "交通相关" }
  return map[category] || category
}

const toggleCard = (id: string) => {
  expandedCards.value[id] = !expandedCards.value[id]
}

const selectAlgorithm = (algo: any) => {
  activate({
    name: "airspace-application",
    data: { action: "add_task", algorithm: algo.id }
  })
}

onMounted(() => {
  loadRoutes()
})
</script>

<style scoped lang="less">
.airspace-computation {
  padding: 10px;
  height: 100%;
  overflow-y: auto;
}

.analysis-panel {
  margin-top: 10px;
}

.algorithms-panel {
  padding: 10px;
}

.header-section {
  display: flex;
  margin-bottom: 20px;
  justify-content: space-between;
}

.algorithms-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.algorithm-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(24, 144, 255, 0.1);
    border-color: #1890ff;
  }

  .card-header {
    display: flex;
    align-items: flex-start;
  }

  .algorithm-image {
    position: relative;
    width: 100px;
    height: 70px;
    margin-right: 16px;
    flex-shrink: 0;
    img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }
    .category-tag { position: absolute; top: 2px; right: 2px; background: #1890ff; color: #fff; font-size: 10px; padding: 0 4px; border-radius: 2px; }
  }

  .algorithm-info {
    flex: 1;
    h4 { margin: 0 0 4px; font-size: 15px; color: #fff; }
    .description { font-size: 12px; color: #aaa; margin-bottom: 8px; line-height: 1.4; }
    .meta-info { font-size: 11px; .accuracy { color: #52c41a; } }
  }
}

.empty-result {
  padding: 40px 0;
  text-align: center;
}
</style>
