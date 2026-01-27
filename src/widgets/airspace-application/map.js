import * as mars3d from "mars3d"

export let map // mars3d.Map三维地图对象
let graphicLayer

// 初始化地图业务，生命周期钩子函数（必须）
export function onMounted(mapInstance) {
    map = mapInstance // 记录map
    graphicLayer = new mars3d.layer.GraphicLayer()
    map.addLayer(graphicLayer)
}

// 释放当前地图业务的生命周期函数
export function onUnmounted() {
    map.removeLayer(graphicLayer)
    graphicLayer = null
    map = null
}

// 绘制航线
export function drawRoute(routeData) {
    if (!graphicLayer) {
        return
    }

    graphicLayer.clear()

    if (!routeData || !routeData.waypoints || routeData.waypoints.length < 2) {
        return
    }

    const positions = routeData.waypoints.map(p => {
        // 兼容可能的数据格式: [lng, lat, alt] 或 {lng, lat, alt}
        if (Array.isArray(p)) {
            return p
        }
        return [p.lng, p.lat, p.alt]
    })

    const graphic = new mars3d.graphic.PolylineEntity({
        positions: positions,
        style: {
            width: 5,
            color: "#ff0000",
            opacity: 0.8,
            clampToGround: false,
            materialType: mars3d.MaterialType.LineFlow,
            materialOptions: {
                color: "#1890ff",
                image: "/img/textures/line-color.png",
                speed: 10
            }
        }
    })

    graphicLayer.addGraphic(graphic)

    // 飞到航线视角
    map.flyToPositions(positions, {
        padding: { top: 100, bottom: 100, left: 100, right: 100 }
    })
}
