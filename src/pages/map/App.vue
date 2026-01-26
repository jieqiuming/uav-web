<template>
  <a-config-provider :theme="{ algorithm: theme.darkAlgorithm }">
    <main-view @mapLoaded="mapLoaded" :url="sceneUrl" />
  </a-config-provider>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { theme, ConfigProvider } from "ant-design-vue"
import MainView from "@mars/components/mars-work/main-view.vue"
import { getQueryString } from "@mars/utils/mars-util"

const sceneUrl = computed(() => getQueryString("url"))
function mapLoaded(map: any) {
  // 地图构造完成
}
</script>

<style></style>
