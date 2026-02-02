import request from '@/api/request'

export interface WorkOrder {
    id: string
    no: string // 工单号
    type: 'inspection' | 'repair' | 'rescue' // 巡检 | 维修 | 救援
    status: 'pending' | 'processing' | 'completed' | 'cancelled' // 待处理 | 处理中 | 已完成 | 已取消
    priority: 'low' | 'medium' | 'high' | 'critical' // 优先级
    title: string
    description: string
    location: {
        lng: number
        lat: number
        address?: string
    }
    flightTaskId?: string // 关联的飞行任务ID
    aircraftId?: string
    pilotId?: string // 暂留，后续关联人员模块
    createdAt: string
    updatedAt: string
}

export interface CreateWorkOrderDTO {
    type: WorkOrder['type']
    priority: WorkOrder['priority']
    title: string
    description: string
    location: WorkOrder['location']
}

export interface WorkOrderQueryParams {
    status?: string
    type?: string
    keyword?: string
}

const BASE_URL = '/work-order'

// 获取工单列表
export const getWorkOrders = (params?: WorkOrderQueryParams) =>
    request.get<WorkOrder[]>(`${BASE_URL}/list`, { params })

// 获取工单详情
export const getWorkOrder = (id: string) =>
    request.get<WorkOrder>(`${BASE_URL}/detail`, { params: { id } })

// 创建工单
export const createWorkOrder = (data: CreateWorkOrderDTO) =>
    request.post<WorkOrder>(`${BASE_URL}/create`, data)

// 更新工单
export const updateWorkOrder = (data: Partial<WorkOrder>) =>
    request.post<WorkOrder>(`${BASE_URL}/update`, data)

// 派单 (关联飞行资源)
export const dispatchWorkOrder = (id: string, dispatchData: { aircraftId: string, pilotId?: string }) =>
    request.post<WorkOrder>(`${BASE_URL}/dispatch`, { id, ...dispatchData })

// 删除工单
export const deleteWorkOrder = (id: string) =>
    request.post<void>(`${BASE_URL}/delete`, { id })

// 统计信息
export const getWorkOrderStats = () =>
    request.get<any>(`${BASE_URL}/stats`)
