import request from '@/api/request'

export interface AirspaceTask {
    id: string
    name: string
    startTime: string
    routeName: string
    routeId: string
    algorithm: string
    status: 'pending' | 'approved' | 'rejected' | 'completed'
    createdAt: string
    description: string
    // 关联字段
    flightTaskId?: string
    workOrderId?: string
}

const STORAGE_KEY = 'uav_airspace_tasks'

// 辅助函数：加载数据
const loadData = (): AirspaceTask[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (e) {
        console.error('加载空域申请数据失败', e)
    }
    return []
}

// 辅助函数：保存数据
const saveData = (data: AirspaceTask[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// 获取列表
export const getAirspaceTaskList = async (): Promise<AirspaceTask[]> => {
    return loadData()
}

// 创建空域申请
export const createAirspaceTask = async (data: Partial<AirspaceTask>): Promise<AirspaceTask> => {
    const tasks = loadData()

    const newTask: AirspaceTask = {
        id: Date.now().toString(),
        name: data.name || '未命名任务',
        startTime: data.startTime || new Date().toISOString(),
        routeName: data.routeName || '未知航线',
        routeId: data.routeId || '',
        algorithm: data.algorithm || 'general_person_vehicle_detection',
        status: 'pending',
        createdAt: new Date().toISOString(),
        description: data.description || '',
        flightTaskId: data.flightTaskId,
        workOrderId: data.workOrderId
    }

    tasks.unshift(newTask)
    saveData(tasks)

    return newTask
}

// 更新状态
export const updateAirspaceTaskStatus = async (id: string, status: AirspaceTask['status']): Promise<void> => {
    const tasks = loadData()
    const task = tasks.find(t => t.id === id)
    if (task) {
        task.status = status
        saveData(tasks)
    }
}

// 删除
export const deleteAirspaceTask = async (id: string): Promise<void> => {
    let tasks = loadData()
    tasks = tasks.filter(t => t.id !== id)
    saveData(tasks)
}

// 根据飞行任务ID查询
export const getAirspaceTaskByFlightTaskId = async (flightTaskId: string): Promise<AirspaceTask | null> => {
    const tasks = loadData()
    return tasks.find(t => t.flightTaskId === flightTaskId) || null
}
