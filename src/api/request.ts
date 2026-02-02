import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { message } from 'ant-design-vue'

import mockAdapter from './mock-adapter'

// 基础配置
const config: AxiosRequestConfig = {
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
}

class Request {
    private instance: AxiosInstance

    constructor(options: AxiosRequestConfig) {
        // 挂载 Mock Adapter
        const mockOptions = { ...options, adapter: mockAdapter }
        this.instance = axios.create(mockOptions)

        // 请求拦截器
        this.instance.interceptors.request.use(
            (config) => {
                // 在这里添加 token 逻辑
                const token = localStorage.getItem('token')
                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`
                }
                return config
            },
            (error) => {
                return Promise.reject(error)
            }
        )

        // 响应拦截器
        this.instance.interceptors.response.use(
            (response: AxiosResponse) => {
                const { code, msg, data } = response.data
                // 假设 200 为成功
                if (code === 200) {
                    return data
                } else {
                    message.error(msg || '请求失败')
                    return Promise.reject(new Error(msg || 'Error'))
                }
            },
            (error) => {
                message.error(error.message || '网络异常')
                return Promise.reject(error)
            }
        )
    }

    // 封装常用方法
    get<T = any>(url: string, params?: any): Promise<T> {
        return this.instance.get(url, { params })
    }

    post<T = any>(url: string, data?: any): Promise<T> {
        return this.instance.post(url, data)
    }
}

const request = new Request(config)

export default request
