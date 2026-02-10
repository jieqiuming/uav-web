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
        waypoints: [[117.2, 31.8, 100], [117.22, 31.82, 120]],
        positions: [[117.2, 31.8, 100], [117.22, 31.82, 120]],
        distance: 3500,
        estimatedTime: 15,
        airspaceStatus: "pending",
        createdAt: "2024-05-11T10:00:00Z"
    }
]

const normalizeRoute = (route: RouteModel) => {
    const waypoints = route.waypoints || route.positions || []
    const positions = route.positions || route.waypoints || []
    return {
        ...route,
        waypoints,
        positions,
        airspaceStatus: route.airspaceStatus || "pending"
    }
}

const loadData = (): RouteModel[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored).map(normalizeRoute)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
            return parsed
        }
    } catch (e) { console.error(e) }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultRoutes))
    return defaultRoutes.map(normalizeRoute)
}

const saveData = (data: RouteModel[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

let dataList = loadData()

export const getList = async () => {
    await delay(300)
    dataList = dataList.map(normalizeRoute)
    saveData(dataList)
    return success(dataList)
}

export const saveRoute = async (config: any) => {
    await delay(500)
    const body = JSON.parse(config.data)
    const idx = dataList.findIndex(i => String(i.id) === String(body.id))
    const existing = idx !== -1 ? dataList[idx] : null
    const newRoute = normalizeRoute({
        ...existing,
        ...body,
        id: body.id || Date.now(),
        createdAt: body.createdAt || existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    })

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
