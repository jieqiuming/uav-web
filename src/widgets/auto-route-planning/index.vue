<template>
  <mars-dialog title="自动航线规划 - 北斗网格码可视化" top="100px" width="1400px" height="700px" :visible="isActivate">
    <div class="auto-route-planning" style="height: 640px; overflow: hidden;">
      <a-row :gutter="16" style="height: 100%;">
        <!-- 左侧参数设置 -->
        <a-col :span="8" style="height: 100%;">
          <a-card title="北斗网格参数" size="small" style="height: 400px; overflow-y: auto;">
            <a-form layout="vertical">
              <a-form-item label="最小经度">
                <a-input-number v-model:value="params.minLon" :step="0.001" style="width: 100%" />
              </a-form-item>
              <a-form-item label="最大经度">
                <a-input-number v-model:value="params.maxLon" :step="0.001" style="width: 100%" />
              </a-form-item>
              <a-form-item label="最小纬度">
                <a-input-number v-model:value="params.minLat" :step="0.001" style="width: 100%" />
              </a-form-item>
              <a-form-item label="最大纬度">
                <a-input-number v-model:value="params.maxLat" :step="0.001" style="width: 100%" />
              </a-form-item>
              <a-form-item label="网格层级">
                <a-select v-model:value="params.level" style="width: 100%">
                  <a-select-option v-for="i in 11" :key="i-1" :value="i-1">Level {{ i-1 }}</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="垂直层数">
                <a-input-number v-model:value="params.zLayers" :min="1" :max="10" style="width: 100%" />
              </a-form-item>
              <div style="text-align: center; margin-top: 20px;">
                <a-space direction="vertical" style="width: 100%;">
                  <a-button 
                    type="primary" 
                    @click="generateBeidouGrid" 
                    :loading="loading"
                    size="large"
                    block
                  >
                    生成北斗网格
                  </a-button>
                  <a-button 
                    v-if="gridGenerated" 
                    @click="clearGrid" 
                    size="large"
                    block
                  >
                    清除网格
                  </a-button>
                </a-space>
              </div>
            </a-form>
          </a-card>
          
          <!-- 快捷操作 -->
          <a-card title="快捷操作" size="small" style="margin-top: 16px; height: 200px;" v-if="gridGenerated">
            <a-space direction="vertical" style="width: 100%;">
              <a-button type="primary" @click="flyToGrid" block>
                🎯 飞行到网格区域
              </a-button>
              <a-button @click="clearGrid" block>
                🗑️ 清除网格
              </a-button>
            </a-space>
          </a-card>
        </a-col>
        
        <!-- 右侧状态显示 -->
        <a-col :span="16" style="height: 100%;">
          <a-card title="操作说明" size="small" style="margin-bottom: 16px;">
            <a-alert 
              message="北斗网格码可视化" 
              description="设置左侧参数后点击生成北斗网格，网格将直接显示在项目的全局三维地球上，无需额外地图窗口。"
              type="info" 
              show-icon 
            />
          </a-card>

          <!-- 主内容区域 - 固定大小 -->
          <a-card title="网格状态与操作" size="small" style="height: 500px; overflow-y: auto;">
            <!-- 网格生成加载提示 -->
            <div v-if="loading" style="text-align: center; padding: 40px;">
              <a-spin size="large" tip="正在生成北斗网格..." />
              <p style="margin-top: 16px; color: #666;">请查看全局三维地球...</p>
            </div>
            
            <!-- 网格信息显示 -->
            <div v-else-if="gridGenerated" style="padding: 20px;">
              <a-descriptions title="当前网格信息" bordered size="small">
                <a-descriptions-item label="网格层级">Level {{ params.level }}</a-descriptions-item>
                <a-descriptions-item label="网格数量">{{ gridCount }} 个</a-descriptions-item>
                <a-descriptions-item label="垂直层数">{{ params.zLayers }} 层</a-descriptions-item>
                <a-descriptions-item label="经度范围" :span="2">{{ params.minLon.toFixed(3) }}° ~ {{ params.maxLon.toFixed(3) }}°</a-descriptions-item>
                <a-descriptions-item label="纬度范围" :span="2">{{ params.minLat.toFixed(3) }}° ~ {{ params.maxLat.toFixed(3) }}°</a-descriptions-item>
                <a-descriptions-item label="显示状态" :span="3">
                  <a-tag color="success">✅ 已在全局三维地球上显示</a-tag>
                </a-descriptions-item>
              </a-descriptions>
              
              <div style="margin-top: 20px; text-align: center;">
                <a-space>
                  <a-button type="primary" @click="flyToGrid">
                    🎯 飞行到网格区域
                  </a-button>
                  <a-button @click="clearGrid">
                    🗑️ 清除网格
                  </a-button>
                </a-space>
              </div>
            </div>

            <!-- 使用说明 - 默认显示 -->
            <div v-else style="padding: 20px;">
              <h4 style="margin-bottom: 20px;">使用步骤</h4>
              <a-steps direction="vertical" size="small" :current="0">
                <a-step title="使用全局地图" description="✅ 直接使用项目的三维地球">
                  <template #icon>
                    <div style="color: #52c41a;">🌍</div>
                  </template>
                </a-step>
                <a-step title="设置网格参数" description="在左侧调整经纬度范围、层级等参数">
                  <template #icon>
                    <div style="color: #1890ff;">⚙️</div>
                  </template>
                </a-step>
                <a-step title="生成网格可视化" description="点击生成北斗网格按钮，在三维地球上查看效果">
                  <template #icon>
                    <div style="color: #722ed1;">🎯</div>
                  </template>
                </a-step>
              </a-steps>
              
              <div style="margin-top: 30px; padding: 20px; background: #f5f5f5; border-radius: 6px;">
                <h5 style="margin-bottom: 10px;">💡 提示</h5>
                <p style="margin: 0; color: #666;">网格将直接显示在项目的全局三维地球上，生成后可以通过飞行按钮快速定位到网格区域。</p>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </mars-dialog>
</template>

<script setup lang="ts">
import { ref, inject, watch, onUnmounted } from 'vue'
import { useWidget } from '@mars/common/store/widget'
import { message } from 'ant-design-vue'
import * as mars3d from "mars3d"

// Widget状态管理
const { isActivate } = useWidget()

// 获取全局地图实例
const getMapInstance = inject<() => any>("getMapInstance")

// 参数（使用newBeidou.html中的默认值）
const params = ref({
  minLon: 113.8953,
  maxLon: 113.995234,
  minLat: 29.753575,
  maxLat: 29.831474,
  level: 5,
  zLayers: 5
})

// 状态
const gridGenerated = ref(false)
const loading = ref(false)
const gridCount = ref(0)

// mars3d相关变量
let map: any = null
let viewer: any = null
let gridPrimitive: any = null

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

// 监听组件激活
watch(isActivate, (newVal) => {
  console.log('自动航线规划组件激活状态:', newVal)
  if (!newVal) {
    console.log('组件关闭，清理网格...')
    clearGrid(false)
  }
}, { immediate: true })

// 获取全局地图实例
const getGlobalMap = () => {
  if (!map && getMapInstance) {
    map = getMapInstance()
    if (map && map.viewer) {
      viewer = map.viewer
      console.log('获取全局地图实例成功:', map)
      return true
    }
  }
  return map && viewer
}

// 生成北斗网格（完全基于newBeidou.html的算法）
const generateBeidouGrid = async () => {
  console.log('开始生成北斗网格...')
  
  // 获取全局地图实例
  if (!getGlobalMap()) {
    message.error('无法获取全局地图实例，请稍后重试')
    return
  }
  
  loading.value = true
  
  try {
    
    // 清除旧网格
    if (gridPrimitive) {
      viewer.scene.primitives.remove(gridPrimitive)
      gridPrimitive = null
    }
    
    // 生成网格数据
    const gridData = generateGridData(params.value)
    console.log('网格数据生成完成:', gridData)
    
    // 创建网格图元
    gridPrimitive = createGridPrimitive(gridData)
    viewer.scene.primitives.add(gridPrimitive)
    
    // 飞行到网格区域
    map.flyToExtent({
      xmin: params.value.minLon,
      ymin: params.value.minLat,
      xmax: params.value.maxLon,
      ymax: params.value.maxLat
    })
    
    gridCount.value = gridData.gridInfo.rows * gridData.gridInfo.cols * gridData.gridInfo.layers
    gridGenerated.value = true
    
    message.success(`北斗网格生成成功！共 ${gridCount.value} 个网格单元`)
  } catch (error) {
    console.error('网格生成失败:', error)
    message.error(`网格生成失败: ${error instanceof Error ? error.message : '请重试'}`)
  } finally {
    loading.value = false
  }
}

// 生成北斗网格数据（基于newBeidou.html的算法）
const generateGridData = (params: any) => {
  // 步长表（与 newBeidou.html 完全一致）
  const levels = {
    0: { lon_step: 6, lat_step: 4, height_step: 1000 },
    1: { lon_step: 0.5, lat_step: 0.5, height_step: 500 },
    2: { lon_step: 0.25, lat_step: 1 / 6, height_step: 250 },
    3: { lon_step: 0.25 / 15, lat_step: (1 / 6) / 10, height_step: 125 },
    4: { lon_step: (0.25 / 15) / 15, lat_step: ((1 / 6) / 10) / 15, height_step: 62.5 },
    5: { lon_step: (0.25 / 15) / 15 / 2, lat_step: ((1 / 6) / 10) / 15 / 2, height_step: 31.25 },
    6: { lon_step: (0.25 / 15) / 15 / 2 / 8, lat_step: ((1 / 6) / 10) / 15 / 2 / 8, height_step: 15.625 },
    7: { lon_step: (0.25 / 15) / 15 / 2 / 8 / 8, lat_step: ((1 / 6) / 10) / 15 / 2 / 8 / 8, height_step: 7.8125 },
    8: { lon_step: (0.25 / 15) / 15 / 2 / 8 / 8 / 8, lat_step: ((1 / 6) / 10) / 15 / 2 / 8 / 8 / 8, height_step: 3.90625 },
    9: { lon_step: (0.25 / 15) / 15 / 2 / 8 / 8 / 8 / 8, lat_step: ((1 / 6) / 10) / 15 / 2 / 8 / 8 / 8 / 8, height_step: 1.953125 },
    10: { lon_step: (0.25 / 15) / 15 / 2 / 8 / 8 / 8 / 8 / 8, lat_step: ((1 / 6) / 10) / 15 / 2 / 8 / 8 / 8 / 8 / 8, height_step: 0.9765625 }
  }
  
  const { lon_step, lat_step, height_step } = levels[params.level] || levels[5]
  const Z_LAYERS = params.zLayers
  
  // 计算行列号
  const lon_begin = Math.floor(params.minLon / lon_step)
  const lon_end = Math.floor(params.maxLon / lon_step)
  const lat_begin = Math.floor(params.minLat / lat_step)
  const lat_end = Math.floor(params.maxLat / lat_step)
  
  const COLS = lon_end - lon_begin + 1
  const ROWS = lat_end - lat_begin + 1
  
  console.log('网格计算参数:', {
    level: params.level,
    lon_step,
    lat_step,
    height_step,
    lon_begin,
    lon_end,
    lat_begin,
    lat_end,
    COLS,
    ROWS,
    Z_LAYERS
  })
  
  // 生成顶点
  const positions = []
  const indices = []
  
  // 顶点：先 x-y 平面，再 z 方向堆叠
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
  
  // 索引：先同一层的横竖线，再层间竖线
  const stride = ROWS * COLS
  for (let z = 0; z < Z_LAYERS; z++) {
    const base = z * stride
    // 横线
    for (let r = 0; r < ROWS; r++) {
      const rowStart = base + r * COLS
      for (let c = 0; c < COLS - 1; c++) {
        indices.push(rowStart + c, rowStart + c + 1)
      }
    }
    // 竖线
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS - 1; r++) {
        indices.push(base + r * COLS + c, base + (r + 1) * COLS + c)
      }
    }
  }
  // 层间竖线
  for (let z = 0; z < Z_LAYERS - 1; z++) {
    const base0 = z * stride
    const base1 = (z + 1) * stride
    for (let i = 0; i < stride; i++) {
      indices.push(base0 + i, base1 + i)
    }
  }
  
  console.log('生成顶点数:', positions.length, '索引数:', indices.length)
  
  return {
    positions,
    indices,
    gridInfo: {
      rows: ROWS,
      cols: COLS,
      layers: Z_LAYERS,
      level: params.level
    }
  }
}

// 创建网格图元（使用mars3d.Cesium，与newBeidou.html逻辑一致）
const createGridPrimitive = (data: any) => {
  const geometry = new mars3d.Cesium.Geometry({
    attributes: {
      position: new mars3d.Cesium.GeometryAttribute({
        componentDatatype: mars3d.Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: new Float64Array(data.positions.flatMap(p => [p.x, p.y, p.z]))
      })
    } as any,
    indices: new Uint32Array(data.indices),
    primitiveType: mars3d.Cesium.PrimitiveType.LINES,
    boundingSphere: mars3d.Cesium.BoundingSphere.fromPoints(data.positions)
  })
  
  return new mars3d.Cesium.Primitive({
    geometryInstances: new mars3d.Cesium.GeometryInstance({
      geometry,
      attributes: {
        color: mars3d.Cesium.ColorGeometryInstanceAttribute.fromColor(mars3d.Cesium.Color.GRAY)
      }
    }),
    appearance: new mars3d.Cesium.PolylineColorAppearance(),
    asynchronous: false
  })
}

// 飞行到网格
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

// 组件卸载时清理网格
onUnmounted(() => {
  clearGrid(false)
  map = null
  viewer = null
})
</script>

<style scoped>
.auto-route-planning {
  padding: 20px;
}
</style>
