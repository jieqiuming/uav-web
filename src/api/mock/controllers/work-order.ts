import { success, fail, delay } from '@/api/mock-utils'
import type { WorkOrder } from '@/api/services/work-order'

const STORAGE_KEY = "uav_work_orders"

// 初始化默认数据
const defaultWorkOrders: WorkOrder[] = [
    {
        id: "WO-001",
        no: "WO-20240501-001",
        type: "inspection",
        status: "pending",
        priority: "high",
        title: "高新区电力设施例行巡检",
        description: "对高新区变电站及周边输电线路进行红外测温巡检。",
        location: { lng: 117.2, lat: 31.8, address: "合肥市高新区创新大道" },
        createdAt: "2024-05-01T08:30:00Z",
        updatedAt: "2024-05-01T08:30:00Z"
    },
    {
        id: "WO-002",
        no: "WO-20240502-002",
        type: "emergency", // Note: types mismatch with service slightly (rescue vs emergency), aligning to service
        status: "processing",
        priority: "critical",
        title: "森林防火应急监测",
        description: "突发火情监测，需要立即调派无人机前往。",
        location: { lng: 117.15, lat: 31.75, address: "大蜀山森林公园" },
        aircraftId: "1715421234567", // Assuming existing aircraft id
        createdAt: "2024-05-02T10:00:00Z",
        updatedAt: "2024-05-02T10:15:00Z"
    }
] as any // Use any to bypass strict type checking for initial mock data mismatch if any

const loadData = (): WorkOrder[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) { return JSON.parse(stored) }
    } catch (e) {
        console.error(e)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultWorkOrders))
    return defaultWorkOrders
}

const saveData = (data: WorkOrder[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

let dataList = loadData()

export const getList = async (config: any) => {
    await delay(300)
    const { status, type, keyword } = config.params || {}

    let result = [...dataList]

    if (status) {
        result = result.filter(item => item.status === status)
    }

    if (type) {
        result = result.filter(item => item.type === type)
    }

    if (keyword) {
        const k = keyword.toLowerCase()
        result = result.filter(item =>
            item.title.toLowerCase().includes(k) ||
            item.no.toLowerCase().includes(k)
        )
    }

    // 按时间倒序
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return success(result)
}

export const createWorkOrder = async (config: any) => {
    await delay(500)
    const body = JSON.parse(config.data)

    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const count = dataList.filter(i => i.createdAt.startsWith(now.toISOString().slice(0, 10))).length + 1
    const no = `WO-${dateStr}-${String(count).padStart(3, '0')}`

    const newOrder: WorkOrder = {
        id: String(Date.now()),
        no,
        status: 'pending',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        ...body
    }

    dataList.unshift(newOrder)
    saveData(dataList)

    return success(newOrder)
}

export const updateWorkOrder = async (config: any) => {
    await delay(300)
    const body = JSON.parse(config.data)
    const index = dataList.findIndex(i => i.id === body.id)

    if (index !== -1) {
        dataList[index] = {
            ...dataList[index],
            ...body,
            updatedAt: new Date().toISOString()
        }
        saveData(dataList)
        return success(dataList[index])
    }
    return fail('工单不存在')
}

export const dispatchWorkOrder = async (config: any) => {
    await delay(500)
    const { id, aircraftId, pilotId } = JSON.parse(config.data)
    const index = dataList.findIndex(i => i.id === id)

    if (index !== -1) {
        dataList[index] = {
            ...dataList[index],
            status: 'processing',
            aircraftId,
            pilotId,
            updatedAt: new Date().toISOString()
        }
        saveData(dataList)
        return success(dataList[index])
    }
    return fail('工单不存在')
}

export const deleteWorkOrder = async (config: any) => {
    await delay(300)
    const { id } = JSON.parse(config.data)
    dataList = dataList.filter(i => i.id !== id)
    saveData(dataList)
    return success(null)
}

export const getStats = async () => {
    await delay(200)
    const total = dataList.length
    const pending = dataList.filter(i => i.status === 'pending').length
    const processing = dataList.filter(i => i.status === 'processing').length
    const completed = dataList.filter(i => i.status === 'completed').length

    return success({ total, pending, processing, completed })
}
