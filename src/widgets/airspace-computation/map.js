import * as mars3d from "mars3d"

let map // 地图对象
let graphicLayer // 矢量图层对象
let restrictedZones = [] // 禁飞区数据

/**
 * 初始化地图业务，生命周期钩子函数（必须）
 * 框架在地图渲染完成后自动调用该函数
 * @param {mars3d.Map} mapInstance 地图对象
 * @returns {void} 无
 */
export function onMounted(mapInstance) {
    map = mapInstance // 记录map
    graphicLayer = new mars3d.layer.GraphicLayer()
    map.addLayer(graphicLayer)

    // 初始化禁飞区
    initRestrictedZones()
}

/**
 * 释放地图业务，生命周期钩子函数（必须）
 * 框架在组件销毁时自动调用该函数
 * @returns {void} 无
 */
export function onUnmounted() {
    map.removeLayer(graphicLayer)
    graphicLayer = null
    map = null
}

// 初始化模拟禁飞区
function initRestrictedZones() {
    // 清除旧数据
    graphicLayer.clear()
    restrictedZones = []

    // 模拟禁飞区1：圆形（无为市政府附近模拟）
    const zone1 = new mars3d.graphic.CircleEntity({
        position: [118.311, 31.365, 0],
        style: {
            radius: 400,
            height: 250,
            color: "#ff0000",
            opacity: 0.3,
            outline: true,
            outlineColor: "#ff0000",
            label: {
                text: "禁飞区 A (核心政务区)",
                font_size: 18,
                color: "#ffffff",
                distanceDisplayCondition: true,
                distanceDisplayCondition_far: 50000,
                distanceDisplayCondition_near: 0
            }
        },
        attr: { id: "zone1", name: "核心政务禁飞区" }
    })
    graphicLayer.addGraphic(zone1)
    restrictedZones.push(zone1)

    // 模拟禁飞区2：多边形（工业园模拟）
    const zone2 = new mars3d.graphic.PolygonEntity({
        positions: [
            [118.325, 31.375],
            [118.330, 31.375],
            [118.330, 31.370],
            [118.325, 31.370]
        ],
        style: {
            height: 200,
            color: "#ff0000",
            opacity: 0.3,
            outline: true,
            outlineColor: "#ff0000",
            label: {
                text: "禁飞区 B (工业生产区)",
                font_size: 18,
                color: "#ffffff"
            }
        },
        attr: { id: "zone2", name: "工业生产禁飞区" }
    })
    graphicLayer.addGraphic(zone2)
    restrictedZones.push(zone2)

    console.log("模拟禁飞区初始化完成", restrictedZones.length)
}

/**
 * 绘制并分析航线冲突
 * @param {Object} routeData 航线数据
 * @returns {Array} 冲突检测结果列表
 */
export function analyzeRouteConflict(routeData) {
    if (!routeData || !routeData.waypoints) {
        return []
    }

    // 1. 绘制航线（用于视觉确认）
    const positions = routeData.waypoints.map(p => {
        // 兼容数组 [lng, lat, alt] 或对象 {lng, lat, alt}
        return Array.isArray(p) ? p : [p.lng, p.lat, p.alt]
    })

    // 清除之前的航线
    const oldRoute = graphicLayer.getGraphicById("currentRoute")
    if (oldRoute) {
        graphicLayer.removeGraphic(oldRoute)
    }

    const routeGraphic = new mars3d.graphic.PolylineEntity({
        id: "currentRoute",
        positions,
        style: {
            width: 5,
            color: "#3388ff",
            clampToGround: false
        }
    })
    graphicLayer.addGraphic(routeGraphic)

    // 飞行定位到航线
    routeGraphic.flyTo()

    // 2. 执行冲突检测
    const conflicts = []

    // 简单的几何检测：检查航线点是否在禁飞区内
    // 注意：这只是一个简化的点检测，严谨的检测应该做线段与多边形的相交检测
    positions.forEach((pos, index) => {
        const point = mars3d.LngLatPoint.parse(pos)

        restrictedZones.forEach(zone => {
            let isInside = false

            // 针对不同类型的禁飞区做判断
            if (zone.type === "circle") {
                const distance = mars3d.MeasureUtil.getDistance([point.lng, point.lat], zone.position)
                if (distance <= zone.style.radius) {
                    isInside = true
                }
            } else if (zone.type === "polygon") {
                // 使用 mars3d 内置的多边形包含判断
                // 注意：PolyUtil.isInPoly 需要传入点坐标和多边形坐标数组
                const polyPositions = zone.positions
                isInside = mars3d.PolyUtil.isInPoly([point.lng, point.lat], polyPositions)
            }

            // 同时也需要检查高度（简化起见，假设禁飞区从地面0到设定高度）
            // 如果点的高度 < 禁飞区高度，且平面坐标在范围内，则冲突
            if (isInside) {
                const zoneHeight = zone.style.height || 100
                if (point.alt <= zoneHeight) {
                    conflicts.push({
                        waypointIndex: index + 1,
                        zoneName: zone.attr.name,
                        description: `航点 ${index + 1} 进入 ${zone.attr.name} (高度限制 ${zoneHeight}m)`
                    })
                }
            }
        })
    })

    return conflicts
}

// 导出方法供 Vue 调用
export const mapWork = {
    analyzeRouteConflict
}
