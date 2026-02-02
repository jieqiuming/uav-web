/**
 * Mock 辅助工具
 * 用于模拟后端响应延迟和数据结构
 */

export interface ApiResponse<T> {
    code: number
    msg: string
    data: T
}

// 模拟延迟
export const delay = (ms: number = 500) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// 包装成功响应
export const success = <T>(data: T, msg: string = 'success'): ApiResponse<T> => {
    return {
        code: 200,
        msg,
        data
    }
}

// 包装失败响应
export const fail = (msg: string = 'fail', code: number = 500): ApiResponse<null> => {
    return {
        code,
        msg,
        data: null
    }
}
