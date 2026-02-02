import { ApiResponse, success, fail, delay } from '@/api/mock-utils'

const STORAGE_KEY = "uav_routes"

interface RouteModel {
    id: string | number
    name: string
    positions: any[]
    [key: string]: any
}

// 默认空数据，或者可以预置一些测试航线
const defaultRoutes: RouteModel[] = [
    {
        id: 1715421234567,
        name: "测试航线A",
        positions: [[117.2, 31.8, 100], [117.22, 31.82, 120]],
        distance: 3500,
        estimatedTime: 15,
        createdAt: "2024-05-11T10:00:00Z"
    }
]

const loadData = (): RouteModel[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) { return JSON.parse(stored) }
    } catch (e) { console.error(e) }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultRoutes))
    return defaultRoutes
}

const saveData = (data: RouteModel[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

let dataList = loadData()

export const getList = async () => {
    await delay(300)
    return success(dataList)
}

export const saveRoute = async (config: any) => {
    await delay(500)
    const body = JSON.parse(config.data)
    const newRoute = {
        ...body,
        id: body.id || Date.now(),
        updatedAt: new Date().toISOString()
    }

    // 如果 ID 存在则更新，否则新增
    const idx = dataList.findIndex(i => String(i.id) === String(newRoute.id))
    if (idx !== -1) {
        dataList[idx] = newRoute
    } else {
        dataList.push(newRoute)
    }
    saveData(dataList)
    return success(newRoute)
}

export const deleteRoute = async (config: any) => {
    await delay(300)
    const id = config.params?.id || JSON.parse(config.data || '{}').id
    dataList = dataList.filter(i => String(i.id) !== String(id))
    saveData(dataList)
    return success(null)
}

export const batchDelete = async (config: any) => {
    await delay(400)
    const ids = JSON.parse(config.data) // expect array of ids
    dataList = dataList.filter(i => !ids.includes(i.id))
    saveData(dataList)
    return success(null)
}
