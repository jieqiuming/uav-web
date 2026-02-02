import { ApiResponse, success, fail, delay } from '@/api/mock-utils'
import type { AircraftModel, AircraftSearchParams } from '@/widgets/aircraft-management/types'

const STORAGE_KEY = "uav_aircrafts"

// 默认数据 (简略版，避免文件过大，完整版可从原文件复制) :TODO 需要复制完整默认数据吗？
// 为了演示完整性，这里保留部分关键数据，实际场景通常在初始化时加载一次
const defaultAircraftData: AircraftModel[] = [
    {
        id: 1,
        modelName: "DJI Mini 3 Pro",
        manufacturer: "DJI",
        modelCode: "DJI-MINI3PRO",
        maxFlightTime: 34,
        maxFlightDistance: 12,
        maxAltitude: 120,
        maxSpeed: 16,
        payloadCapacity: 0.249,
        batteryCapacity: 2453,
        specifications: {
            weight: 249,
            dimensions: { length: 145, width: 90, height: 62, wingspan: 245 },
            camera: { resolution: "4K/60fps", zoomRange: "3x", gimbalType: "3轴机械云台" }
        },
        imageUrl: "/img/thumbnail/basemap/google_img.png",
        status: 1,
        createdAt: "2024-01-15T10:30:00Z",
        updatedAt: "2024-01-15T10:30:00Z",
        createdBy: "admin"
    }
    // ... 其他数据在第一次运行时会从 localStorage 读取，如果 localStorage 为空则使用这个数组
    // 为节省代码量，这里仅作为示例，真实逻辑中应确保 localStorage 有数据
]

// Helper: load/save
const loadData = (): AircraftModel[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) { return JSON.parse(stored) }
    } catch (e) {
        console.error(e)
    }
    // Initialize if empty
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAircraftData))
    return defaultAircraftData
}

const saveData = (data: AircraftModel[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

let dataList = loadData()

// Controllers
export const getAircraftList = async (config: any): Promise<ApiResponse<any>> => {
    await delay(500)
    const params = config.params || {}

    let list = [...dataList]

    // Keyword
    if (params.keyword) {
        const kw = params.keyword.toLowerCase()
        list = list.filter(item =>
            item.modelName.toLowerCase().includes(kw) ||
            item.modelCode.toLowerCase().includes(kw)
        )
    }

    // Status
    if (params.status !== undefined && params.status !== '') {
        const s = Number(params.status)
        list = list.filter(item => item.status === s)
    }

    // Pagination
    const page = Number(params.page) || 1
    const size = Number(params.size) || 10
    const total = list.length

    const records = list.slice((page - 1) * size, page * size)

    return success({
        records,
        total,
        current: page,
        size,
        pages: Math.ceil(total / size)
    })
}

export const activeOptions = async () => {
    await delay(200)
    const options = dataList
        .filter(item => item.status === 1)
        .map(item => ({ value: item.id, label: item.modelName, modelCode: item.modelCode }))
    return success(options)
}

export const stats = async () => {
    await delay(300)
    const total = dataList.length
    const active = dataList.filter(i => i.status === 1).length

    const map = new Map<string, number>()
    dataList.forEach(i => {
        if (i.manufacturer) { map.set(i.manufacturer, (map.get(i.manufacturer) || 0) + 1) }
    })

    return success({
        totalCount: total,
        activeCount: active,
        inactiveCount: total - active,
        manufacturerStats: Array.from(map.entries()).map(([k, v]) => ({ manufacturer: k, count: v }))
    })
}

export const create = async (config: any) => {
    await delay(800)
    const body = JSON.parse(config.data)

    if (dataList.some(i => i.modelCode === body.modelCode)) {
        return fail('机型编码已存在')
    }

    const newItem = {
        ...body,
        id: Date.now(), // simple ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }

    dataList.unshift(newItem)
    saveData(dataList)
    return success(newItem)
}

export const update = async (config: any) => {
    await delay(600)
    const body = JSON.parse(config.data)
    const id = body.id

    const idx = dataList.findIndex(i => i.id === id)
    if (idx === -1) { return fail('机型不存在') }

    // check code unique
    if (body.modelCode && dataList.some(i => i.id !== id && i.modelCode === body.modelCode)) {
        return fail('机型编码重复')
    }

    dataList[idx] = { ...dataList[idx], ...body, updatedAt: new Date().toISOString() }
    saveData(dataList)
    return success(dataList[idx])
}

export const remove = async (config: any) => {
    await delay(400)
    const { id } = config.params || JSON.parse(config.data || '{}')
    // Support delete via url param or body, assuming id is passed somehow. 
    // Standard axios get params or post body. For delete usually params or url path.
    // In this simple mock, we'll try to parse from params.id

    const targetId = Number(id)
    const idx = dataList.findIndex(i => i.id === targetId)
    if (idx !== -1) {
        dataList.splice(idx, 1)
        saveData(dataList)
        return success(null)
    }
    return fail('机型不存在')
}

export const batchRemove = async (config: any) => {
    const ids = JSON.parse(config.data) // expect array of ids
    dataList = dataList.filter(i => !ids.includes(i.id))
    saveData(dataList)
    return success(null)
}

export const batchStatus = async (config: any) => {
    const { ids, status } = JSON.parse(config.data)
    dataList.forEach(i => {
        if (ids.includes(i.id)) {
            i.status = status
            i.updatedAt = new Date().toISOString()
        }
    })
    saveData(dataList)
    return success(null)
}
