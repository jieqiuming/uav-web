import request from '@/api/request'
import type {
    AircraftModel,
    AircraftSearchParams,
    PageResult,
    CreateAircraftDTO,
    UpdateAircraftDTO,
    AircraftModelOption,
    AircraftStats
} from '@/widgets/aircraft-management/types'

// 获取列表
export const getAircraftList = (params: AircraftSearchParams) =>
    request.get<PageResult<AircraftModel>>('/aircraft/list', params)

// 获取统计
export const getAircraftStats = () =>
    request.get<AircraftStats>('/aircraft/stats')

// 获取启用选项
export const getActiveAircraftOptions = () =>
    request.get<AircraftModelOption[]>('/aircraft/active-options')

// 创建
export const createAircraft = (data: CreateAircraftDTO) =>
    request.post<AircraftModel>('/aircraft/create', data)

// 更新
export const updateAircraft = (data: UpdateAircraftDTO) =>
    request.post<AircraftModel>('/aircraft/update', data)

// 状态更新 (使用 POST Body 传递)
export const updateAircraftStatus = (id: number, status: number) =>
    request.post<void>('/aircraft/batch-status', { ids: [id], status })

// 删除 (使用 params 传递 id)
export const deleteAircraft = (id: number) =>
    request.get<void>('/aircraft/delete', { id })

// 批量删除
export const batchDeleteAircraft = (ids: number[]) =>
    request.post<void>('/aircraft/batch-delete', ids)

// 批量状态更新
export const batchUpdateAircraftStatus = (ids: number[], status: number) =>
    request.post<void>('/aircraft/batch-status', { ids, status })
