import * as mars3d from "mars3d"

export let map // mars3d.Map三维地图对象

// 初始化地图业务，生命周期钩子函数（必须）
export function onMounted(mapInstance) {
    map = mapInstance // 记录map
}

// 释放当前地图业务的生命周期函数
export function onUnmounted() {
    map = null
}
