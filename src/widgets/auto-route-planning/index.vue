<template>
  <mars-dialog title="自动航线规划" top="100px" width="1400px" height="750px" :visible="isActivate">
    <div class="auto-route-planning">
      <a-tabs v-model:activeKey="activeTab" type="card">
        <!-- 选项卡1: 北斗网格可视化 -->
        <a-tab-pane key="beidou" tab="北斗网格可视化">
          <div class="tab-content">
            <a-row :gutter="16">
              <!-- 左侧参数设置 -->
              <a-col :xs="24" :md="8">
                <a-card title="北斗网格参数" size="small" class="form-card">
                  <a-form layout="vertical">
                    <a-row :gutter="8">
                      <a-col :xs="24" :sm="12">
                        <a-form-item label="最小经度">
                          <a-input-number v-model:value="params.minLon" :step="0.001" style="width: 100%" />
                        </a-form-item>
                      </a-col>
                      <a-col :xs="24" :sm="12">
                        <a-form-item label="最大经度">
                          <a-input-number v-model:value="params.maxLon" :step="0.001" style="width: 100%" />
                        </a-form-item>
                      </a-col>
                    </a-row>
                    <a-row :gutter="8">
                      <a-col :xs="24" :sm="12">
                        <a-form-item label="最小纬度">
                          <a-input-number v-model:value="params.minLat" :step="0.001" style="width: 100%" />
                        </a-form-item>
                      </a-col>
                      <a-col :xs="24" :sm="12">
                        <a-form-item label="最大纬度">
                          <a-input-number v-model:value="params.maxLat" :step="0.001" style="width: 100%" />
                        </a-form-item>
                      </a-col>
                    </a-row>
                    <a-form-item label="网格层级">
                      <a-select v-model:value="params.level" style="width: 100%">
                        <a-select-option v-for="i in 11" :key="i-1" :value="i-1">Level {{ i-1 }} ({{ getLevelDesc(i-1) }})</a-select-option>
                      </a-select>
                    </a-form-item>
                    <a-form-item label="垂直层数">
                      <a-input-number v-model:value="params.zLayers" :min="1" :max="20" style="width: 100%" />
                    </a-form-item>
                    <div style="margin-top: 10px;">
                      <a-space direction="vertical" style="width: 100%;">
                        <a-button type="primary" @click="generateBeidouGrid" :loading="loading" block size="large">
                          生成北斗网格
                        </a-button>
                        <a-button @click="clearGrid" block>
                          清除网格显示
                        </a-button>
                      </a-space>
                    </div>
                  </a-form>
                </a-card>
                
                <a-card title="快速定位" size="small" style="margin-top: 16px;">
                  <a-button type="dashed" @click="resetToWuwei" block>
                    📍 重置回中心区域 (无为)
                  </a-button>
                </a-card>
              </a-col>
              
              <!-- 右侧展示 -->
              <a-col :xs="24" :md="16">
                <a-card title="网格状态" size="small" class="info-card">
                  <div v-if="gridGenerated">
                    <a-result status="success" title="网格已成功渲染">
                      <template #extra>
                        <a-descriptions bordered size="small" :column="2">
                          <a-descriptions-item label="网格层级">Level {{ params.level }}</a-descriptions-item>
                          <a-descriptions-item label="网格总数">{{ gridCount }}</a-descriptions-item>
                          <a-descriptions-item label="覆盖范围" :span="2">
                            {{ params.minLon.toFixed(3) }}E, {{ params.minLat.toFixed(3) }}N 至 {{ params.maxLon.toFixed(3) }}E, {{ params.maxLat.toFixed(3) }}N
                          </a-descriptions-item>
                        </a-descriptions>
                        <div style="margin-top: 20px">
                           <a-button type="primary" @click="flyToGrid">🎯 飞行到网格视角</a-button>
                        </div>
                      </template>
                    </a-result>
                  </div>
                  <div v-else class="empty-placeholder">
                    <a-empty description="暂未生成网格，请在左侧设置参数并发起生成" />
                  </div>
                </a-card>
              </a-col>
            </a-row>
          </div>
        </a-tab-pane>

        <!-- 选项卡2: 智能避障规划 -->
        <a-tab-pane key="smart" tab="智能避障规划">
          <div class="tab-content">
            <a-row :gutter="16">
              <a-col :xs="24" :md="8">
                <a-card title="避障参数设置" size="small" class="form-card">
                  <a-form layout="vertical">
                    <a-divider orientation="left" plain>航点设置</a-divider>
                    <a-form-item label="起点坐标 (Lng, Lat)">
                      <a-space>
                        <a-input-number v-model:value="smartParams.startLng" :step="0.001" placeholder="经度" style="width: 100px" />
                        <a-input-number v-model:value="smartParams.startLat" :step="0.001" placeholder="纬度" style="width: 100px" />
                      </a-space>
                    </a-form-item>
                    <a-form-item label="终点坐标 (Lng, Lat)">
                      <a-space>
                        <a-input-number v-model:value="smartParams.endLng" :step="0.001" placeholder="经度" style="width: 100px" />
                        <a-input-number v-model:value="smartParams.endLat" :step="0.001" placeholder="纬度" style="width: 100px" />
                      </a-space>
                    </a-form-item>
                    
                    <a-divider orientation="left" plain>模拟环境</a-divider>
                    <a-form-item label="障碍物密度">
                      <a-radio-group v-model:value="smartParams.obsCount" button-style="solid">
                        <a-radio-button :value="3">低</a-radio-button>
                        <a-radio-button :value="6">中</a-radio-button>
                        <a-radio-button :value="12">高</a-radio-button>
                      </a-radio-group>
                    </a-form-item>
                    
                    <div style="margin-top: 20px;">
                      <a-space direction="vertical" style="width: 100%;">
                        <a-button type="primary" ghost @click="generateObstacles" block>
                          🛡️ 随机生成障碍物
                        </a-button>
                        <a-button type="primary" @click="runSmartPlanning" block size="large">
                          🚀 开始路径规划 (避障)
                        </a-button>
                        <a-button type="danger" ghost @click="handleClearMap" block>
                          🧹 清除地图覆盖物
                        </a-button>
                      </a-space>
                    </div>
                  </a-form>
                </a-card>
              </a-col>
              
              <a-col :xs="24" :md="16">
                <a-card title="避障分析结果" size="small" class="info-card">
                  <div v-if="smartPlanningResult" style="padding: 20px;">
                    <a-alert message="规划成功" type="success" show-icon />
                    <div style="margin-top: 16px;">
                      <a-descriptions bordered size="small" :column="1">
                        <a-descriptions-item label="避障算法">几何绕行算法 (Geometric Detour)</a-descriptions-item>
                        <a-descriptions-item label="路径状态">
                          <a-tag color="green">已避开所有动态障碍区</a-tag>
                        </a-descriptions-item>
                        <a-descriptions-item label="航程成本">
                           {{ smartPlanningResult.distance }} 米
                        </a-descriptions-item>
                      </a-descriptions>
                    </div>
                  </div>
                  <div v-else class="empty-placeholder">
                    <p>点击按钮生成障碍物，系统将自动基于起点终点计算最优避障路径。</p>
                  </div>
                </a-card>
              </a-col>
            </a-row>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </mars-dialog>
</template>

<script setup lang="ts">
import { ref, inject, watch, onUnmounted, reactive } from 'vue'
import { useWidget } from '@mars/common/store/widget'
import { message } from 'ant-design-vue'
import * as mars3d from "mars3d"
import * as mapWork from "./map"

// Widget状态管理
const { isActivate } = useWidget()

// 获取全局地图实例
const getMapInstance = inject<() => any>("getMapInstance")

// 选项卡状态
const activeTab = ref("beidou")

// 北斗网格参数 (适配无为 118.318, 31.367)
const params = ref({
  minLon: 118.28,
  maxLon: 118.35,
  minLat: 31.34,
  maxLat: 31.40,
  level: 5,
  zLayers: 3
})

// 智能避障参数
const smartParams = reactive({
  startLng: 118.30,
  startLat: 31.35,
  endLng: 118.33,
  endLat: 31.38,
  obsCount: 6
})

// 状态
const gridGenerated = ref(false)
const loading = ref(false)
const gridCount = ref(0)
const smartPlanningResult = ref<any>(null)

// mars3d相关变量
let map: any = null
let viewer: any = null
let gridPrimitive: any = null

// 初始化地图工作逻辑
mapWork.onMounted(inject<() => any>("getMapInstance")!())

// 获取描述
const getLevelDesc = (level: number) => {
  const descs = ["洲际级", "国家级", "省级", "市级", "区县级", "街道级", "社区级", "建筑级", "房间级", "分米级", "厘米级"]
  return descs[level] || '未知'
}

// 重置到无为
const resetToWuwei = () => {
  params.value = {
    minLon: 118.28,
    maxLon: 118.35,
    minLat: 31.34,
    maxLat: 31.40,
    level: 5,
    zLayers: 3
  }
}

// 清除网格函数
const clearGrid = (showMessage = true) => {
  if (gridPrimitive && viewer) {
    viewer.scene.primitives.remove(gridPrimitive)
    gridPrimitive = null
    gridGenerated.value = false
    if (showMessage) {
      message.success('网格已清除')
    }
  }
}

// 避障相关的地图操作
const generateObstacles = () => {
  const center = { lng: (smartParams.startLng + smartParams.endLng) / 2, lat: (smartParams.startLat + smartParams.endLat) / 2 }
  mapWork.generateObstacles(center, smartParams.obsCount)
  message.success('已随机生成障碍物环境')
}

const runSmartPlanning = () => {
  const start = [smartParams.startLng, smartParams.startLat, 300]
  const end = [smartParams.endLng, smartParams.endLat, 300]
  
  const points = mapWork.generateSmartPath(start, end)
  
  // 模拟计算结果
  smartPlanningResult.value = {
    points,
    distance: (mars3d.MeasureUtil.getDistance(points)).toFixed(2)
  }
}

const handleClearMap = () => {
  mapWork.clearAll()
  smartPlanningResult.value = null
  message.info('地图已清空')
}

// 监听组件激活
watch(isActivate, (newVal) => {
  if (!newVal) {
    clearGrid(false)
  }
}, { immediate: true })

// 获取全局地图实例
const getGlobalMap = () => {
  if (!map && getMapInstance) {
    map = getMapInstance()
    if (map && map.viewer) {
      viewer = map.viewer
      return true
    }
  }
  return map && viewer
}

// 生成北斗网格
const generateBeidouGrid = async () => {
  if (!getGlobalMap()) {
    message.error('地图未准备就绪')
    return
  }
  
  loading.value = true
  try {
    if (gridPrimitive) {
      viewer.scene.primitives.remove(gridPrimitive)
      gridPrimitive = null
    }
    
    const gridData = generateGridData(params.value)
    gridPrimitive = createGridPrimitive(gridData)
    viewer.scene.primitives.add(gridPrimitive)
    
    map.flyToExtent({
      xmin: params.value.minLon,
      ymin: params.value.minLat,
      xmax: params.value.maxLon,
      ymax: params.value.maxLat
    })
    
    gridCount.value = gridData.gridInfo.rows * gridData.gridInfo.cols * gridData.gridInfo.layers
    gridGenerated.value = true
    message.success(`生成成功，共 ${gridCount.value} 个网格`)
  } catch (error) {
    message.error('生成失败')
  } finally {
    loading.value = false
  }
}

// 网格计算逻辑与 Primitive 创建逻辑 (保持不变，仅合并进来)
const generateGridData = (params: any) => {
  const levels: any = {
    0: { lon_step: 6, lat_step: 4, height_step: 1000 },
    1: { lon_step: 0.5, lat_step: 0.5, height_step: 500 },
    2: { lon_step: 0.25, lat_step: 1 / 6, height_step: 250 },
    3: { lon_step: 0.25 / 15, lat_step: (1 / 6) / 10, height_step: 125 },
    4: { lon_step: (0.25 / 15) / 15, lat_step: ((1 / 6) / 10) / 15, height_step: 62.5 },
    5: { lon_step: (0.25 / 15) / 15 / 2, lat_step: ((1 / 6) / 10) / 15 / 2, height_step: 31.25 }
  }
  
  const { lon_step, lat_step, height_step } = levels[params.level] || levels[5]
  const Z_LAYERS = params.zLayers
  const lon_begin = Math.floor(params.minLon / lon_step)
  const lon_end = Math.floor(params.maxLon / lon_step)
  const lat_begin = Math.floor(params.minLat / lat_step)
  const lat_end = Math.floor(params.maxLat / lat_step)
  
  const COLS = lon_end - lon_begin + 1
  const ROWS = lat_end - lat_begin + 1
  const positions = []
  const indices = []
  
  for (let z = 0; z < Z_LAYERS; z++) {
    const h = z * height_step
    for (let r = 0; r < ROWS; r++) {
      const lat = (lat_begin + r) * lat_step
      for (let c = 0; c < COLS; c++) {
        const lon = (lon_begin + c) * lon_step
        positions.push(mars3d.Cesium.Cartesian3.fromDegrees(lon, lat, h))
      }
    }
  }
  
  const stride = ROWS * COLS
  for (let z = 0; z < Z_LAYERS; z++) {
    const base = z * stride
    for (let r = 0; r < ROWS; r++) {
      const rowStart = base + r * COLS
      for (let c = 0; c < COLS - 1; c++) { indices.push(rowStart + c, rowStart + c + 1) }
    }
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS - 1; r++) { indices.push(base + r * COLS + c, base + (r + 1) * COLS + c) }
    }
  }
  for (let z = 0; z < Z_LAYERS - 1; z++) {
    const base0 = z * stride
    const base1 = (z + 1) * stride
    for (let i = 0; i < stride; i++) { indices.push(base0 + i, base1 + i) }
  }
  
  return { positions, indices, gridInfo: { rows: ROWS, cols: COLS, layers: Z_LAYERS, level: params.level } }
}

const createGridPrimitive = (data: any) => {
  const geometry = new mars3d.Cesium.Geometry({
    attributes: {
      position: new mars3d.Cesium.GeometryAttribute({
        componentDatatype: mars3d.Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: new Float64Array(data.positions.flatMap((p: any) => [p.x, p.y, p.z]))
      })
    },
    indices: new Uint32Array(data.indices),
    primitiveType: mars3d.Cesium.PrimitiveType.LINES,
    boundingSphere: mars3d.Cesium.BoundingSphere.fromPoints(data.positions)
  } as any)
  
  return new mars3d.Cesium.Primitive({
    geometryInstances: new mars3d.Cesium.GeometryInstance({
      geometry,
      attributes: { color: mars3d.Cesium.ColorGeometryInstanceAttribute.fromColor(mars3d.Cesium.Color.DARKGREY) }
    }),
    appearance: new mars3d.Cesium.PolylineColorAppearance(),
    asynchronous: false
  })
}

const flyToGrid = () => {
  if (map) {
    map.flyToExtent({
      xmin: params.value.minLon,
      ymin: params.value.minLat,
      xmax: params.value.maxLon,
      ymax: params.value.maxLat
    })
  }
}

onUnmounted(() => {
  clearGrid(false)
  mapWork.onUnmounted()
})
</script>

<style scoped lang="less">
.auto-route-planning {
  padding: 10px;
  height: 100%;
}
.tab-content {
  margin-top: 10px;
}
.form-card {
  height: calc(100% - 20px);
}
.info-card {
  height: 520px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.empty-placeholder {
  text-align: center;
  color: #999;
  padding: 40px;
}
</style>
