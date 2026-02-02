import { AxiosRequestConfig, AxiosAdapter } from 'axios'
import * as aircraftController from './mock/controllers/aircraft'
import * as routeController from './mock/controllers/route'
import * as workOrderController from './mock/controllers/work-order'
import * as personnelController from './mock/controllers/personnel'
import * as flightTaskController from './mock/controllers/flight-task'

// 路由表定义
// Key: URL path
// Value: Controller function
const routes: Record<string, (config: AxiosRequestConfig) => Promise<any>> = {
    // Aircraft URLs
    '/aircraft/list': aircraftController.getAircraftList,
    '/aircraft/active-options': aircraftController.activeOptions,
    '/aircraft/stats': aircraftController.stats,
    '/aircraft/create': aircraftController.create,
    '/aircraft/update': aircraftController.update,
    '/aircraft/delete': aircraftController.remove,
    '/aircraft/batch-delete': aircraftController.batchRemove,
    '/aircraft/batch-status': aircraftController.batchStatus,

    // Route URLs
    '/route/list': routeController.getList,
    '/route/save': routeController.saveRoute,
    '/route/delete': routeController.deleteRoute,
    '/route/batch-delete': routeController.batchDelete,

    // Work Order URLs
    '/work-order/list': workOrderController.getList,
    '/work-order/create': workOrderController.createWorkOrder,
    '/work-order/update': workOrderController.updateWorkOrder,
    '/work-order/dispatch': workOrderController.dispatchWorkOrder,
    '/work-order/delete': workOrderController.deleteWorkOrder,
    '/work-order/stats': workOrderController.getStats,

    // Personnel URLs
    '/personnel/pilot/list': personnelController.getList,
    '/personnel/pilot/status': personnelController.updateStatus,
    '/personnel/pilot/stats': personnelController.getStats,

    // Flight Task URLs
    '/flight-task/list': flightTaskController.getList,
    '/flight-task/create': flightTaskController.create,
    '/flight-task/status': flightTaskController.updateStatus,
    '/flight-task/delete': flightTaskController.remove,
    '/flight-task/update-route': flightTaskController.updateRoute
}

const mockAdapter: AxiosAdapter = async (config) => {
    // 获取请求路径 (去除 baseURL)
    let url = config.url || ''
    if (config.baseURL && url.startsWith(config.baseURL)) {
        url = url.slice(config.baseURL.length)
    }
    // 简单处理：去除可能的 query string (Mock Controller 从 config.params 读取参数)
    const path = url.split('?')[0]

    // 匹配路由
    const handler = routes[path]

    if (handler) {
        console.log(`[Mock API] ${config.method?.toUpperCase()} ${path}`, config)
        try {
            const responseData = await handler(config)
            return {
                data: responseData,
                status: responseData.code === 200 ? 200 : 500,
                statusText: responseData.code === 200 ? 'OK' : 'Error',
                headers: {},
                config,
                request: {}
            }
        } catch (e: any) {
            return {
                data: { code: 500, msg: e.message },
                status: 500,
                statusText: 'Internal Server Error',
                headers: {},
                config,
                request: {}
            }
        }
    }

    const error = new Error(`Mock 404: No handler for ${path}`) as any
    error.config = config
    error.code = 'ERR_NOT_FOUND'
    return Promise.reject(error)
}

export default mockAdapter
