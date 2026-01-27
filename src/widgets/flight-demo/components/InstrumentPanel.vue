<template>
  <div class="instrument-panel">
    <!-- 速度表 -->
    <div class="instrument speed">
      <div class="label">SPEED</div>
      <div class="value">{{ Math.round(speed) }}</div>
      <div class="unit">km/h</div>
      <svg class="gauge" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" stroke="#333" stroke-width="5" fill="none" />
        <path d="M 50 50 L 50 10" stroke="#00ff00" stroke-width="2" :transform="`rotate(${(speed / 200) * 270 - 135}, 50, 50)`" />
      </svg>
    </div>

    <!-- 姿态仪 (人工地平仪) -->
    <div class="instrument attitude">
      <div class="horizon-container">
        <div class="horizon" :style="horizonStyle">
          <div class="sky"></div>
          <div class="ground"></div>
          <div class="line"></div>
        </div>
        <div class="reference-plane">
          <svg viewBox="0 0 100 100">
             <path d="M 10 50 L 40 50 L 50 60 L 60 50 L 90 50" stroke="#ffff00" stroke-width="2" fill="none" />
          </svg>
        </div>
      </div>
      <div class="value-overlay">
        <div>R: {{ Math.round(roll) }}°</div>
        <div>P: {{ Math.round(pitch) }}°</div>
      </div>
    </div>

    <!-- 高度表 -->
    <div class="instrument altitude">
      <div class="label">ALT</div>
      <div class="value">{{ Math.round(altitude) }}</div>
      <div class="unit">m</div>
      <svg class="gauge" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" stroke="#333" stroke-width="5" fill="none" />
        <path d="M 50 50 L 50 10" stroke="#00ffff" stroke-width="2" :transform="`rotate(${(altitude % 1000 / 1000) * 360}, 50, 50)`" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

interface Props {
  speed?: number
  altitude?: number
  pitch?: number // 俯仰角 -90 ~ 90
  roll?: number // 翻滚角 -180 ~ 180
  heading?: number
}

const props = withDefaults(defineProps<Props>(), {
  speed: 0,
  altitude: 0,
  pitch: 0,
  roll: 0,
  heading: 0
})

const horizonStyle = computed(() => {
  // Pitch moves the horizon up/down. Roll rotates it.
  // Simple approximation: 1 degree pitch = 1% translation (adjustable)
  const translateY = props.pitch * 2 
  return {
    transform: `rotate(${-props.roll}deg) translateY(${translateY}%)`
  }
})
</script>

<style scoped lang="less">
.instrument-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 10px 0;
}

.instrument {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  
  .label {
    font-size: 10px;
    color: #aaa;
    position: absolute;
    top: 20px;
  }
  
  .value {
    font-size: 20px;
    font-weight: bold;
    z-index: 2;
  }
  
  .unit {
    font-size: 10px;
    position: absolute;
    bottom: 20px;
    color: #aaa;
  }
  
  .gauge {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}

.attitude {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #555;
  background: #333;
  position: relative;
  
  .horizon-container {
    width: 100%;
    height: 100%;
    position: relative;
  }
  
  .horizon {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    transition: transform 0.1s;
    
    .sky {
      width: 100%;
      height: 200%;
      background: #00bfff;
      position: absolute;
      bottom: 50%;
      left: 0;
    }
    
    .ground {
      width: 100%;
      height: 200%;
      background: #8b4513; // Brown
      position: absolute;
      top: 50%;
      left: 0;
    }
    
    .line {
      width: 100%;
      height: 2px;
      background: white;
      position: absolute;
      top: 50%;
      left: 0;
      margin-top: -1px;
    }
  }
  
  .reference-plane {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
  }
  
  .value-overlay {
    position: absolute;
    bottom: 5px;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: space-around;
    font-size: 10px;
    text-shadow: 1px 1px 2px black;
    z-index: 20;
  }
}
</style>
