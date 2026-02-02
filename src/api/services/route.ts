import request from '@/api/request'

export interface RouteModel {
    id: string | number
    name: string
    positions: any[]
    distance?: number
    estimatedTime?: number
    createdAt?: string
    updatedAt?: string
    [key: string]: any
}

// 获取航线列表
export const getRoutes = () =>
    request.get<RouteModel[]>('/route/list')

// 保存航线 (新增或更新)
export const saveRoute = (data: Partial<RouteModel>) =>
    request.post<RouteModel>('/route/save', data)

// 删除航线
export const deleteRoute = (id: string | number) =>
    request.post<void>('/route/delete', { id })

// 批量删除
export const batchDeleteRoutes = (ids: (string | number)[]) =>
    request.post<void>('/route/batch-delete', ids)
