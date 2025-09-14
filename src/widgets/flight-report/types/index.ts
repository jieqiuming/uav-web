// 飞行报告状态
export enum FlightReportStatus {
  PENDING = 'pending',     // 待生成
  GENERATING = 'generating', // 生成中
  COMPLETED = 'completed',   // 已完成
  FAILED = 'failed'        // 生成失败
}

// 飞行报告基本信息
export interface FlightReport {
  id: string
  taskName: string         // 飞行任务名称
  executionTime: string    // 执行时间
  flightRoute: string      // 飞行航线
  algorithm: string        // 执行的算法
  status: FlightReportStatus // 报告状态
  createdAt: string        // 创建时间
  updatedAt?: string       // 更新时间
  reportContent?: string   // 报告内容（markdown格式）
  fileSize?: string        // 文件大小
  duration?: string        // 飞行时长
}

// 飞行报告详细内容
export interface FlightReportDetail {
  id: string
  taskInfo: {
    taskName: string
    executionTime: string
    flightRoute: string
    algorithm: string
    operator: string
    weather: string
    duration: string
  }
  flightData: {
    takeoffTime: string
    landingTime: string
    maxAltitude: string
    totalDistance: string
    averageSpeed: string
    batteryUsage: string
  }
  algorithmResults: {
    totalImages: number
    processedImages: number
    detectedObjects: number
    accuracy: string
    processingTime: string
  }
  summary: string
  recommendations: string[]
  attachments: {
    name: string
    type: string
    size: string
    url: string
  }[]
}

// 搜索和筛选参数
export interface FlightReportSearchParams {
  keyword?: string
  status?: FlightReportStatus
  algorithm?: string
  dateRange?: [string, string]
  page?: number
  pageSize?: number
}
