<template>
  <a-modal
    v-model:open="localVisible"
    title="飞行报告详情"
    :width="1500"
    :style="{ maxWidth: '95vw' }"
    :footer="null"
    @cancel="handleClose"
  >
    <div class="report-viewer">
      <a-spin :spinning="loading" tip="加载报告内容中...">
        <div v-if="reportData" class="report-content">
          <!-- 报告头部信息 -->
          <div class="report-header">
            <h2>{{ reportData.taskInfo.taskName }} - 飞行报告</h2>
            <div class="report-meta">
              <a-tag color="blue">{{ getAlgorithmText(reportData.taskInfo.algorithm) }}</a-tag>
              <span class="meta-item">执行时间: {{ reportData.taskInfo.executionTime }}</span>
              <span class="meta-item">飞行时长: {{ reportData.taskInfo.duration }}</span>
            </div>
          </div>

          <!-- 报告内容区域 -->
          <div class="report-body">
            <a-tabs v-model:activeKey="activeTab" type="card">
              <!-- 任务概览 -->
              <a-tab-pane key="overview" tab="任务概览">
                <div class="overview-section">
                  <a-row :gutter="24">
                    <a-col :span="12">
                      <div class="info-card">
                        <h4>任务信息</h4>
                        <div class="info-item">
                          <label>任务名称:</label>
                          <span>{{ reportData.taskInfo.taskName }}</span>
                        </div>
                        <div class="info-item">
                          <label>执行算法:</label>
                          <span>{{ getAlgorithmText(reportData.taskInfo.algorithm) }}</span>
                        </div>
                        <div class="info-item">
                          <label>飞行航线:</label>
                          <span>{{ reportData.taskInfo.flightRoute }}</span>
                        </div>
                        <div class="info-item">
                          <label>操作员:</label>
                          <span>{{ reportData.taskInfo.operator }}</span>
                        </div>
                        <div class="info-item">
                          <label>天气条件:</label>
                          <span>{{ reportData.taskInfo.weather }}</span>
                        </div>
                      </div>
                    </a-col>
                    <a-col :span="12">
                      <div class="info-card">
                        <h4>飞行数据</h4>
                        <div class="info-item">
                          <label>起飞时间:</label>
                          <span>{{ reportData.flightData.takeoffTime }}</span>
                        </div>
                        <div class="info-item">
                          <label>降落时间:</label>
                          <span>{{ reportData.flightData.landingTime }}</span>
                        </div>
                        <div class="info-item">
                          <label>最大飞行高度:</label>
                          <span>{{ reportData.flightData.maxAltitude }}</span>
                        </div>
                        <div class="info-item">
                          <label>总飞行距离:</label>
                          <span>{{ reportData.flightData.totalDistance }}</span>
                        </div>
                        <div class="info-item">
                          <label>平均速度:</label>
                          <span>{{ reportData.flightData.averageSpeed }}</span>
                        </div>
                        <div class="info-item">
                          <label>电池消耗:</label>
                          <span>{{ reportData.flightData.batteryUsage }}</span>
                        </div>
                      </div>
                    </a-col>
                  </a-row>
                </div>
              </a-tab-pane>

              <!-- 算法结果 -->
              <a-tab-pane key="results" tab="算法结果">
                <div class="results-section">
                  <div class="info-card">
                    <h4>检测结果统计</h4>
                    <a-row :gutter="24">
                      <a-col :span="6">
                        <a-statistic
                          title="总图像数"
                          :value="reportData.algorithmResults.totalImages"
                          suffix="张"
                        />
                      </a-col>
                      <a-col :span="6">
                        <a-statistic
                          title="已处理图像"
                          :value="reportData.algorithmResults.processedImages"
                          suffix="张"
                        />
                      </a-col>
                      <a-col :span="6">
                        <a-statistic
                          title="检测到目标"
                          :value="reportData.algorithmResults.detectedObjects"
                          suffix="个"
                        />
                      </a-col>
                      <a-col :span="6">
                        <a-statistic
                          title="检测准确率"
                          :value="parseFloat(reportData.algorithmResults.accuracy)"
                          precision="1"
                          suffix="%"
                        />
                      </a-col>
                    </a-row>
                    <div class="processing-time">
                      <label>算法处理时间:</label>
                      <span>{{ reportData.algorithmResults.processingTime }}</span>
                    </div>
                  </div>
                </div>
              </a-tab-pane>

              <!-- 报告内容 -->
              <a-tab-pane key="content" tab="详细报告">
                <div class="markdown-content">
                  <div v-html="renderedMarkdown" class="markdown-body"></div>
                </div>
              </a-tab-pane>

              <!-- 附件 -->
              <a-tab-pane key="attachments" tab="附件">
                <div class="attachments-section">
                  <div v-if="reportData.attachments.length > 0">
                    <a-list
                      :data-source="reportData.attachments"
                      item-layout="horizontal"
                    >
                      <template #renderItem="{ item }">
                        <a-list-item>
                          <template #actions>
                            <a-button type="link" @click="downloadAttachment(item)">下载</a-button>
                          </template>
                          <a-list-item-meta>
                            <template #title>
                              <span>{{ item.name }}</span>
                            </template>
                            <template #description>
                              类型: {{ item.type }} | 大小: {{ item.size }}
                            </template>
                          </a-list-item-meta>
                        </a-list-item>
                      </template>
                    </a-list>
                  </div>
                  <a-empty v-else description="暂无附件" />
                </div>
              </a-tab-pane>
            </a-tabs>
          </div>

          <!-- 报告操作按钮 -->
          <div class="report-actions">
            <a-space>
              <a-button type="primary" @click="downloadReport">
                <mars-icon icon="download" width="16" />
                下载完整报告
              </a-button>
              <a-button @click="printReport">
                <mars-icon icon="printer" width="16" />
                打印报告
              </a-button>
              <a-button @click="handleClose">关闭</a-button>
            </a-space>
          </div>
        </div>
      </a-spin>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { marked } from 'marked'
import type { FlightReportDetail } from '../types'

// Props
interface Props {
  visible: boolean
  reportId?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  reportId: ''
})

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'download': [reportId: string]
}>()

// 响应式数据
const loading = ref(false)
const activeTab = ref('overview')
const reportData = ref<FlightReportDetail | null>(null)
const localVisible = ref(false)

// 计算属性
const renderedMarkdown = computed(() => {
  if (!reportData.value) { return '' }
  
  const markdownContent = generateMarkdownReport(reportData.value)
  return marked(markdownContent)
})

// 监听器
watch(() => props.visible, (newVisible) => {
  localVisible.value = newVisible
  if (newVisible && props.reportId) {
    loadReportData()
  }
})

watch(() => props.reportId, (newId) => {
  if (newId && props.visible) {
    loadReportData()
  }
})

watch(localVisible, (newVisible) => {
  emit('update:visible', newVisible)
})

// 方法
const loadReportData = async () => {
  if (!props.reportId) { return }
  
  loading.value = true
  try {
    // 模拟加载报告数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 这里应该调用API获取真实数据
    reportData.value = generateMockReportData(props.reportId)
  } catch (error) {
    message.error('加载报告失败')
  } finally {
    loading.value = false
  }
}

const getAlgorithmText = (algorithm: string) => {
  const algorithms = {
    drainage_cover_detection: '高速排水沟盖板缺失检测算法',
    isolation_fence_damage_detection: '高速隔离栏破损检测算法',
    urban_garbage_detection: '城市垃圾堆检测算法',
    safety_helmet_recognition: '安全帽识别算法',
    engineering_vehicle_detection: '工程车辆检测算法',
    road_crack_detection: '道路裂纹检测算法',
    fire_smoke_detection: '烟火检测算法',
    general_person_vehicle_detection: '通用人车检测算法',
    water_target_detection: '水上目标检测算法'
  }
  return algorithms[algorithm] || algorithm
}

const generateMarkdownReport = (data: FlightReportDetail): string => {
  return `# ${data.taskInfo.taskName} 飞行报告

## 执行摘要

本次飞行任务于 **${data.taskInfo.executionTime}** 执行完成，使用 **${getAlgorithmText(data.taskInfo.algorithm)}** 进行数据分析。飞行过程顺利，所有预定目标均已达成。

## 任务详情

### 基本信息
- **任务名称**: ${data.taskInfo.taskName}
- **执行时间**: ${data.taskInfo.executionTime}
- **飞行航线**: ${data.taskInfo.flightRoute}
- **执行算法**: ${getAlgorithmText(data.taskInfo.algorithm)}
- **操作员**: ${data.taskInfo.operator}
- **天气条件**: ${data.taskInfo.weather}
- **飞行时长**: ${data.taskInfo.duration}

### 飞行数据
- **起飞时间**: ${data.flightData.takeoffTime}
- **降落时间**: ${data.flightData.landingTime}
- **最大飞行高度**: ${data.flightData.maxAltitude}
- **总飞行距离**: ${data.flightData.totalDistance}
- **平均速度**: ${data.flightData.averageSpeed}
- **电池消耗**: ${data.flightData.batteryUsage}

## 算法检测结果

### 数据统计
- **总图像数**: ${data.algorithmResults.totalImages} 张
- **已处理图像**: ${data.algorithmResults.processedImages} 张
- **检测到目标**: ${data.algorithmResults.detectedObjects} 个
- **检测准确率**: ${data.algorithmResults.accuracy}
- **处理时间**: ${data.algorithmResults.processingTime}

### 结果分析

${data.summary}

## 建议与改进

${data.recommendations.map(rec => `- ${rec}`).join('\n')}

## 结论

本次飞行任务成功完成，达到预期目标。建议根据以上分析结果制定后续行动计划。

---
*报告生成时间: ${new Date().toLocaleString()}*`
}

const generateMockReportData = (reportId: string): FlightReportDetail => {
  return {
    id: reportId,
    taskInfo: {
      taskName: '北区日常巡检任务',
      executionTime: '2024-01-15 09:00:00',
      flightRoute: '北区巡检航线',
      algorithm: 'road_crack_detection',
      operator: '张三',
      weather: '晴朗，微风3级',
      duration: '45分钟'
    },
    flightData: {
      takeoffTime: '09:00:15',
      landingTime: '09:45:22',
      maxAltitude: '120米',
      totalDistance: '15.6公里',
      averageSpeed: '25.5公里/小时',
      batteryUsage: '85%'
    },
    algorithmResults: {
      totalImages: 1250,
      processedImages: 1248,
      detectedObjects: 23,
      accuracy: '96.3',
      processingTime: '12分钟30秒'
    },
    summary: `本次道路裂纹检测任务中，共拍摄图像1250张，成功处理1248张图像。算法检测到23处潜在的道路裂纹，主要分布在北区主干道的3-5公里路段。检测结果显示，大部分裂纹为轻微表面裂纹，建议进行预防性维护。`,
    recommendations: [
      '建议对检测到的3处中等程度裂纹进行重点监控',
      '推荐在雨季前对轻微裂纹进行密封处理',
      '建议增加该路段的巡检频率至每月一次',
      '考虑在高温季节增加夜间巡检，以获得更准确的热成像数据'
    ],
    attachments: [
      { name: '检测结果图像包.zip', type: 'ZIP压缩包', size: '125.6MB', url: '#' },
      { name: '航迹轨迹数据.kml', type: 'KML文件', size: '2.3MB', url: '#' },
      { name: '详细检测报告.pdf', type: 'PDF文档', size: '8.9MB', url: '#' }
    ]
  }
}

const downloadReport = () => {
  emit('download', props.reportId!)
  message.success('报告下载已开始')
}

const downloadAttachment = (attachment: any) => {
  message.success(`开始下载: ${attachment.name}`)
  // 这里实现具体的下载逻辑
}

const printReport = () => {
  window.print()
}

const handleClose = () => {
  localVisible.value = false
  activeTab.value = 'overview'
}
</script>

<style scoped>
.report-viewer {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0 16px 16px 16px;
}

.report-header {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.report-header h2 {
  margin: 0 0 12px 0;
  color: #1890ff;
  font-size: 20px;
}

.report-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  color: #666;
  font-size: 14px;
}

.report-body {
  margin-bottom: 24px;
}

.overview-section,
.results-section {
  padding: 16px 0;
}

.info-card {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
}

.info-card h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-weight: 500;
  color: #666;
  min-width: 100px;
}

.info-item span {
  color: #333;
  text-align: right;
}

.processing-time {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.processing-time label {
  font-weight: 500;
  color: #666;
}

.markdown-content {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 24px;
}

.markdown-body {
  line-height: 1.6;
  color: #333;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3 {
  color: #1890ff;
  margin-top: 24px;
  margin-bottom: 16px;
}

.markdown-body h1 {
  font-size: 24px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 8px;
}

.markdown-body h2 {
  font-size: 20px;
}

.markdown-body h3 {
  font-size: 16px;
}

.markdown-body ul {
  padding-left: 20px;
}

.markdown-body li {
  margin-bottom: 4px;
}

.markdown-body strong {
  color: #1890ff;
  font-weight: 600;
}

.attachments-section {
  padding: 16px 0;
}

.report-actions {
  border-top: 1px solid #f0f0f0;
  padding: 16px 0 0 0;
  margin: 0 -8px 0 0;
  text-align: right;
  display: flex;
  justify-content: flex-end;
}

.report-actions .ant-space {
  flex-wrap: wrap;
  justify-content: flex-end;
  margin-right: 8px;
}

/* 打印样式 */
@media print {
  .report-actions {
    display: none;
  }
  
  .report-viewer {
    max-height: none;
    overflow: visible;
  }
}

/* 确保弹窗能够响应设置的宽度 */
:deep(.ant-modal) {
  max-width: 95vw !important;
}

:deep(.ant-modal-content) {
  width: 100% !important;
}
</style>
