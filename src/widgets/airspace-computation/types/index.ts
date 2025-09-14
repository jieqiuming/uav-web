// AI算法信息接口
export interface AlgorithmInfo {
  id: string
  name: string
  description: string
  imagePath: string
  category: string
  accuracy?: string
  processingTime?: string
  applicableScenarios: string[]
}

// 算法类别
export enum AlgorithmCategory {
  INFRASTRUCTURE = 'infrastructure', // 基础设施
  SAFETY = 'safety', // 安全检测
  ENVIRONMENT = 'environment', // 环境监测
  TRAFFIC = 'traffic' // 交通相关
}

// 算法展示卡片状态
export interface AlgorithmCardState {
  selected: boolean
  expanded: boolean
}
