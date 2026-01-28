import * as mars3d from "mars3d"

let map // 地图对象
let graphicLayer // 矢量图层对象
let obstacles = [] // 障碍物数据

/**
 * 初始化地图业务
 */
export function onMounted(mapInstance) {
    map = mapInstance
    graphicLayer = new mars3d.layer.GraphicLayer()
    map.addLayer(graphicLayer)
}

/**
 * 释放地图业务
 */
export function onUnmounted() {
    clearAll()
    map.removeLayer(graphicLayer)
    graphicLayer = null
    map = null
}

/**
 * 清除所有绘制内容
 */
export function clearAll() {
    graphicLayer.clear()
    obstacles = []
}

/**
 * 随机生成障碍物（模拟）
 */
export function generateObstacles(center, count = 5) {
    clearAll()

    // 基于中心点随机生成
    for (let i = 0; i < count; i++) {
        const lat = center.lat + (Math.random() - 0.5) * 0.02
        const lng = center.lng + (Math.random() - 0.5) * 0.02
        const radius = 200 + Math.random() * 300

        // 绘制红色圆柱体作为障碍
        const graphic = new mars3d.graphic.CylinderEntity({
            position: [lng, lat, 0],
            style: {
                length: 300 + Math.random() * 200, // 高度
                topRadius: radius,
                bottomRadius: radius,
                color: "#ff0000",
                opacity: 0.6,
                outline: true
            },
            attr: { id: i, type: "obstacle" }
        })

        graphicLayer.addGraphic(graphic)
        obstacles.push({ center: [lng, lat], radius })
    }
}

/**
 * 生成智能避障路径（模拟算法）
 * 简单的原理：如果直连路径碰到障碍，就在障碍物旁边插值生成绕行点
 */
export function generateSmartPath(start, end) {
    const points = []
    points.push(start)

    // 1. 检查直连线段是否穿过障碍物
    // 简化模拟：只检测中间点，如果碰到障碍，就往北/南偏移
    const centerLat = (start[1] + end[1]) / 2
    const centerLng = (start[0] + end[0]) / 2

    let collision = false
    let detourPoint = null

    for (const obs of obstacles) {
        const dist = mars3d.MeasureUtil.getDistance([centerLng, centerLat], obs.center)
        if (dist < obs.radius + 100) { // 简单碰撞判断
            collision = true
            // 简单的绕行策略：向北偏移 0.015 度 (约1.5km)
            detourPoint = [centerLng, centerLat + 0.015, 300]
            break
        }
    }

    if (collision && detourPoint) {
        // 插入绕行点
        points.push(detourPoint)

        // 绘制辅助线说明避障
        const debugLine = new mars3d.graphic.PolylineEntity({
            positions: [start, [centerLng, centerLat, 0], end],
            style: {
                width: 2,
                color: "#ff0000", // 红色虚线表示原计划路径
                lineType: "dash"
            }
        })
        graphicLayer.addGraphic(debugLine)
    }

    points.push(end)

    // 绘制最终路径
    const routeGraphic = new mars3d.graphic.PolylineEntity({
        positions: points,
        style: {
            width: 5,
            color: "#00ff00", // 绿色表示智能路径
            clampToGround: false,
            materialType: mars3d.MaterialType.LineFlow,
            materialOptions: {
                image: "img/textures/line-color-yellow.png",
                speed: 10
            }
        }
    })
    graphicLayer.addGraphic(routeGraphic)

    // 自动飞行观看
    map.flyToPositions(points, { pitch: -45 })

    return points
}

export const mapWork = {
    clearAll,
    generateObstacles,
    generateSmartPath
}
