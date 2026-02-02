import { success, fail, delay } from '@/api/mock-utils'
import type { Pilot } from '@/api/services/personnel'

const STORAGE_KEY = "uav_pilots"

const defaultPilots: Pilot[] = [
    {
        id: "pilot-001",
        name: "张伟",
        level: "Expert",
        licenseNo: "UAV-2023-8888",
        status: "idle",
        flightHours: 1250,
        phone: "13800000001",
        avatar: "/img/avatar/pilot1.png"
    },
    {
        id: "pilot-002",
        name: "李娜",
        level: "L3",
        licenseNo: "UAV-2023-8889",
        status: "busy",
        flightHours: 890,
        phone: "13800000002"
    },
    {
        id: "pilot-003",
        name: "王强",
        level: "L2",
        licenseNo: "UAV-2024-0012",
        status: "leave",
        flightHours: 320,
        phone: "13800000003"
    },
    {
        id: "pilot-004",
        name: "赵敏",
        level: "L3",
        licenseNo: "UAV-2023-6621",
        status: "idle",
        flightHours: 650,
        phone: "13800000004"
    }
]

const loadData = (): Pilot[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) { return JSON.parse(stored) }
    } catch (e) {
        console.error(e)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPilots))
    return defaultPilots
}

const saveData = (data: Pilot[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const dataList = loadData()

export const getList = async (config: any) => {
    await delay(300)
    const { keyword, status } = config.params || {}

    let result = [...dataList]

    if (status) {
        result = result.filter(item => item.status === status)
    }

    if (keyword) {
        const k = keyword.toLowerCase()
        result = result.filter(item =>
            item.name.includes(k) ||
            item.licenseNo.toLowerCase().includes(k)
        )
    }

    return success(result)
}

export const updateStatus = async (config: any) => {
    await delay(300)
    const { id, status } = JSON.parse(config.data)

    const index = dataList.findIndex(i => i.id === id)
    if (index !== -1) {
        dataList[index] = { ...dataList[index], status }
        saveData(dataList)
        return success(null)
    }
    return fail('人员不存在')
}

export const getStats = async () => {
    await delay(200)
    const total = dataList.length
    const idle = dataList.filter(i => i.status === 'idle').length
    const busy = dataList.filter(i => i.status === 'busy').length
    const leave = dataList.filter(i => i.status === 'leave').length

    return success({ total, idle, busy, leave })
}
