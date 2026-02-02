import request from '@/api/request'

export interface Pilot {
    id: string
    name: string
    level: 'L1' | 'L2' | 'L3' | 'Expert'
    licenseNo: string
    status: 'idle' | 'busy' | 'leave'
    flightHours: number
    avatar?: string
    phone?: string
    teamId?: string
}

export interface PersonnelSearchParams {
    keyword?: string
    status?: string
}

const BASE_URL = '/personnel'

// 获取飞手列表
export const getPilotList = (params?: PersonnelSearchParams) =>
    request.get<Pilot[]>(`${BASE_URL}/pilot/list`, { params })

// 更新飞手状态
export const updatePilotStatus = (id: string, status: Pilot['status']) =>
    request.post<void>(`${BASE_URL}/pilot/status`, { id, status })

// 获取统计信息
export const getPilotStats = () =>
    request.get<any>(`${BASE_URL}/pilot/stats`)
