import { success, fail, delay } from '@/api/mock-utils'
import type { FlightTask } from '@/api/services/flight-task'

const STORAGE_KEY = "uav_flight_tasks_v2"

const normalizeTaskStatus = (status?: FlightTask['status']) => {
    const allowed = ['pending', 'ready', 'executing', 'completed', 'failed', 'blocked']
    return allowed.includes(status as string) ? status : 'pending'
}

const normalizeTask = (task: FlightTask) => {
    return {
        ...task,
        status: normalizeTaskStatus(task.status),
        airspaceStatus: task.airspaceStatus || 'pending'
    }
}

// 初始化默认数据 - 尝试从旧 localStorage 迁移或使用空数组
const loadData = (): FlightTask[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) { return JSON.parse(stored).map(normalizeTask) }

        // 尝试迁移旧数据
        const oldStored = localStorage.getItem("uav_tasks")
        if (oldStored) {
            const oldTasks = JSON.parse(oldStored)
            const newTasks = oldTasks.map((t: any) => ({
                ...t,
                status: normalizeTaskStatus(t.status),
                airspaceStatus: t.airspaceStatus || 'pending',
                updatedAt: t.createdAt
            }))
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks))
            return newTasks
        }
    } catch (e) {
        console.error(e)
    }
    return []
}

const saveData = (data: FlightTask[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

let dataList = loadData()

const AIRSPACE_STORAGE_KEY = "uav_airspace_tasks"

const formatDateTime = (date = new Date()) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const syncAirspaceApplication = (task: FlightTask) => {
    try {
        const stored = localStorage.getItem(AIRSPACE_STORAGE_KEY)
        const list = stored ? JSON.parse(stored) : []
        const exists = list.find((item: any) => String(item.taskId) === String(task.id))
        if (exists) {
            return
        }
        const now = formatDateTime()
        const airspaceTask = {
            id: `airspace_${Date.now()}`,
            taskId: task.id,
            name: task.name,
            startTime: now,
            routeName: task.routeName || "未指定航线",
            routeId: task.routeId || "pending",
            algorithm: "general_person_vehicle_detection",
            status: "pending",
            createdAt: now,
            description: task.description || ""
        }
        list.unshift(airspaceTask)
        localStorage.setItem(AIRSPACE_STORAGE_KEY, JSON.stringify(list))
    } catch (e) {
        console.error("自动创建空域申请失败", e)
    }
}

export const getList = async (config: any) => {
    await delay(300)
    dataList = loadData().map(normalizeTask)
    saveData(dataList)
    const { keyword, status } = config.params || {}

    let result = [...dataList]

    if (status) {
        result = result.filter(item => item.status === status)
    }

    if (keyword) {
        const k = keyword.toLowerCase()
        result = result.filter(item => item.name.toLowerCase().includes(k))
    }

    // 倒序
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return success(result)
}

export const create = async (config: any) => {
    await delay(500)
    const body = JSON.parse(config.data)

    const newTask: FlightTask = {
        ...body,
        id: String(Date.now()),
        status: 'pending',
        airspaceStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }

    dataList.unshift(normalizeTask(newTask))
    saveData(dataList)
    syncAirspaceApplication(newTask)
    return success(newTask)
}

export const updateStatus = async (config: any) => {
    await delay(300)
    const { id, status } = JSON.parse(config.data)
    const idx = dataList.findIndex(i => i.id === id)

    if (idx !== -1) {
        dataList[idx].status = status
        dataList[idx].updatedAt = new Date().toISOString()
        saveData(dataList)
        return success(null)
    }
    return fail('任务不存在')
}

export const remove = async (config: any) => {
    await delay(300)
    const { id } = JSON.parse(config.data)
    dataList = dataList.filter(i => i.id !== id)
    saveData(dataList)
    return success(null)
}

export const updateRoute = async (config: any) => {
    await delay(300)
    const { id, routeId, routeName } = JSON.parse(config.data)
    const idx = dataList.findIndex(i => i.id === id)

    if (idx !== -1) {
        dataList[idx].routeId = routeId
        dataList[idx].routeName = routeName
        dataList[idx].updatedAt = new Date().toISOString()
        saveData(dataList)
        return success(null)
    }
    return fail('任务不存在')
}
