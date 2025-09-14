/**
 * 空域申请模块类型定义
 */

// 任务状态类型
export type TaskStatus = 'pending' | 'approved' | 'rejected' | 'completed'

// 航点信息
export interface Waypoint {
  lng: number
  lat: number
  alt: number
}

// 航线信息
export interface RouteInfo {
  id: string
  name: string
  altitude: number
  speed: number
  description?: string
  createdAt: string
  waypoints: Waypoint[]
}

// 审核信息
export interface AuditInfo {
  auditTime?: string
  auditor?: string
  comment?: string
}

// 空域申请任务
export interface AirspaceTask {
  id: string
  name: string
  startTime: string
  routeId: string
  routeName?: string
  algorithm: string
  status: TaskStatus
  description?: string
  createdAt: string
  updatedAt?: string
  auditInfo?: AuditInfo
  routeInfo?: RouteInfo
}

// 任务表单数据
export interface AirspaceTaskForm {
  name: string
  startTime: any // dayjs对象或null
  routeId: string
  algorithm: string
  description?: string
}

// 任务搜索参数
export interface TaskSearchParams {
  page?: number
  size?: number
  status?: TaskStatus
  keyword?: string
  startDate?: string
  endDate?: string
}

// API响应数据结构
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 分页响应数据
export interface PageResponse<T> {
  records: T[]
  total: number
  current: number
  size: number
  pages: number
}

// 任务统计信息
export interface TaskStatistics {
  total: number
  pending: number
  approved: number
  rejected: number
  completed: number
}
