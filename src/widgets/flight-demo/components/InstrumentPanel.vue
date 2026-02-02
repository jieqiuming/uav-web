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
    <div class="instrument attitude-wrapper">
      <div class="attitude-indicator">
        <div class="horizon-container">
          <div class="horizon" :style="horizonStyle">
            <div class="sky"></div>
            <div class="ground"></div>
            <div class="horizon-line"></div>
          </div>
          <!-- 固定参考线 -->
          <svg class="reference-plane" viewBox="0 0 100 100">
            <path d="M 15 50 L 38 50 L 50 58 L 62 50 L 85 50" stroke="#ff9900" stroke-width="2.5" fill="none" />
            <circle cx="50" cy="50" r="3" fill="#ff9900" />
          </svg>
          <!-- 刻度圈 -->
          <svg class="scale-ring" viewBox="0 0 100 100">
            <line x1="50" y1="5" x2="50" y2="10" stroke="#fff" stroke-width="1.5" />
            <line x1="5" y1="50" x2="10" y2="50" stroke="#fff" stroke-width="1.5" />
            <line x1="90" y1="50" x2="95" y2="50" stroke="#fff" stroke-width="1.5" />
            <line x1="50" y1="90" x2="50" y2="95" stroke="#fff" stroke-width="1.5" />
          </svg>
        </div>
      </div>
      <!-- R/P 值显示在外部 -->
      <div class="attitude-values">
        <span class="att-badge roll">R: {{ Math.round(roll) }}°</span>
        <span class="att-badge pitch">P: {{ Math.round(pitch) }}°</span>
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
  justify-content: space-around;
  align-items: center;
  width: 100%;
  padding: 8px 5px;
}

.instrument {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  
  .label {
    font-size: 9px;
    color: #aaa;
    position: absolute;
    top: 14px;
  }
  
  .value {
    font-size: 16px;
    font-weight: bold;
    z-index: 2;
  }
  
  .unit {
    font-size: 8px;
    position: absolute;
    bottom: 14px;
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

// 姿态仪包装器
.attitude-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: auto !important;
  height: auto !important;
  
  .attitude-indicator {
    width: 85px;
    height: 85px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid #444;
    box-shadow: 0 0 8px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.3);
    background: #1a1a1a;
    position: relative;
    
    .horizon-container {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      border-radius: 50%;
    }
    
    .horizon {
      width: 150%;
      height: 150%;
      position: absolute;
      left: -25%;
      top: -25%;
      transition: transform 0.1s ease-out;
      
      .sky {
        width: 100%;
        height: 50%;
        background: linear-gradient(to bottom, #0066cc 0%, #00aaff 100%);
        position: absolute;
        top: 0;
        left: 0;
      }
      
      .ground {
        width: 100%;
        height: 50%;
        background: linear-gradient(to bottom, #8B5A2B 0%, #5D3A1A 100%);
        position: absolute;
        bottom: 0;
        left: 0;
      }
      
      .horizon-line {
        width: 100%;
        height: 2px;
        background: #fff;
        position: absolute;
        top: 50%;
        left: 0;
        margin-top: -1px;
        box-shadow: 0 0 4px rgba(255,255,255,0.5);
      }
    }
    
    .reference-plane {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10;
      pointer-events: none;
    }
    
    .scale-ring {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 11;
      pointer-events: none;
    }
  }
  
  // R/P 值徽章
  .attitude-values {
    display: flex;
    gap: 6px;
    margin-top: 5px;
    
    .att-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Consolas', monospace;
      
      &.roll {
        background: rgba(0, 150, 255, 0.3);
        color: #4fc3f7;
        border: 1px solid rgba(0, 150, 255, 0.4);
      }
      
      &.pitch {
        background: rgba(255, 150, 0, 0.3);
        color: #ffb74d;
        border: 1px solid rgba(255, 150, 0, 0.4);
      }
    }
  }
}
</style>
