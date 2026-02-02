import request from '@/api/request'

export interface FlightTask {
    id: string
    name: string
    aircraftId: string
    aircraftName: string
    routeId: string
    routeName: string
    description?: string
    workOrderId?: string // 关联工单
    workOrderNo?: string
    pilotId?: string // 关联飞手
    pilotName?: string
    status: 'pending' | 'executing' | 'completed' | 'failed'
    createdAt: string
    updatedAt: string
}

export interface FlightTaskSearchParams {
    keyword?: string
    status?: string
}

const BASE_URL = '/flight-task'

// 获取任务列表
export const getFlightTaskList = (params?: FlightTaskSearchParams) =>
    request.get<FlightTask[]>(`${BASE_URL}/list`, { params })

// 创建任务
export const createFlightTask = (data: Partial<FlightTask>) =>
    request.post<FlightTask>(`${BASE_URL}/create`, data)

// 更新任务状态
export const updateFlightTaskStatus = (id: string, status: FlightTask['status']) =>
    request.post<void>(`${BASE_URL}/status`, { id, status })

// 删除任务
export const deleteFlightTask = (id: string) =>
    request.post<void>(`${BASE_URL}/delete`, { id })

// 关联工单和飞行任务
export const linkWorkOrder = (taskId: string, workOrderId: string) =>
    request.post<void>(`${BASE_URL}/link-work-order`, { taskId, workOrderId })

// 更新任务航线
export const updateFlightTaskRoute = (id: string, routeId: string, routeName: string) =>
    request.post<void>(`${BASE_URL}/update-route`, { id, routeId, routeName })
