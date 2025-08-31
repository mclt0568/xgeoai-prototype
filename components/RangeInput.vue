<template>
  <div class="range-input" :style="cssValueRef" :class="{dragged}">
    <div class="structure">
      <div class="label" @mousedown="onLabelMouseDown">{{ props.label }}</div>
      <input ref="inputRef" @focus="selectAll" @mouseup.prevent @change="onTextChange" :value="format(valueRef)" />
      <span class="suffix">{{ props.suffix }}</span>
    </div>
    <div class="progress">
      <div class="bar"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>

// Props
const props = withDefaults(defineProps<{
  label?: string
  max?: number
  min?: number
  value?: number
  step?: number
  suffix?: string
  roundTo?: number | undefined
  format?: (n: number) => string
  parse?: (s: string) => number
}>(), {
  label: "",
  max: 1,
  min: 0,
  value: 0.5,
  step: 0.01,
  suffix: "%",
  format: (n: number) => `${Math.round(n * 100)}`,
  parse: (s: string) => (Number(s) / 100),
})

// textbox and value
const emit = defineEmits<{ (event: "update:value", value: number): void, (event: "release", value: number): void }>();
const valueRef: Ref<number> = ref(props.value);
const cssValueRef: Ref<string> = ref(computeCssValue(props.value));

function computeCssValue(value: number) {
  return "--value: " + String(Math.round((value * 100) / (props.max + props.min))) + "%;";
}

watch(() => props.value, (newVal) => {
  valueRef.value = newVal;
  cssValueRef.value = computeCssValue(newVal);
});

function onTextChange(event: Event) {
  const newValue = (event.target as HTMLInputElement).value;
  const parsedValue = props.parse(newValue);
  valueRef.value = parsedValue;
  const clamped = Math.min(props.max, Math.max(props.min, parsedValue));
  cssValueRef.value = computeCssValue(clamped);
  emit("update:value", clamped);
  emit("release", clamped);
}

function onRelease() {
  if (inputRef.value === null) return;
  
  const newValue = inputRef.value.value;
  const parsedValue = props.parse(newValue);
  valueRef.value = parsedValue;
  const clamped = Math.min(props.max, Math.max(props.min, parsedValue));
  cssValueRef.value = computeCssValue(clamped);
  emit("release", clamped);
}

// draggable logic
const dragged = ref(false);
let startX = 0;
let startValue = 0;

function onLabelMouseDown(event: MouseEvent) {
  dragged.value = true;
  startX = event.clientX;
  startValue = valueRef.value;

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}

function onMouseMove(event: MouseEvent) {
  const deltaX = event.clientX - startX;
  const sensitivity = props.step / 3; // tweak this to control drag speed
  const rawValue = startValue + deltaX * sensitivity;

  let newValue = rawValue;
  if (props.roundTo !== undefined) {
    const factor = 10 ** props.roundTo;
    newValue = Math.round(rawValue * factor) / factor;
  }
  
  // clamp between min and max
  const clamped = Math.min(props.max, Math.max(props.min, newValue));
  valueRef.value = clamped;
  cssValueRef.value = computeCssValue(clamped);
  emit("update:value", clamped);
}

function onMouseUp() {
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
  dragged.value = false;
  onRelease();
}

// input auto focus
const inputRef = ref<HTMLInputElement | null>(null);

function selectAll() {
  requestAnimationFrame(() => {
    inputRef.value?.select();
  });
}


</script>

<style lang="scss" scoped>
@use "~/assets/scss/variables" as *;

.range-input {
  box-sizing: border-box;
  border-radius: 5px;
  background: $background-secondary;
  width: 100%;
  height: 28px;
  border: solid 1px $background-secondary;
  position: relative;

  * {
    font-size: 14px;
  }

  &>div {
    position: absolute;
  }

  &:hover {
    border: solid 1px $border;
  }
  
  &:has(input:focus), &.dragged {
    // background: $background-interaction;
    border: solid 1px $accent-weak;
  }
}

.structure {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  display: flex;
  align-items: stretch;

  .label {
    padding: 4px 10px 6px 10px;
    color: $foreground-label;
    line-height: 100%;;
    user-select: none;
    cursor: ew-resize;
  }
  
  input {
    color: $foreground;
    background: transparent;
    border: 0;
    border-radius: 0;
    outline: none;
    flex: 1;
    width: 0px;
    height: calc(100% - 2px);
    text-align: right;
    padding: 0px 0px 2px 0px;
    padding-right: 4px;
    line-height: 100%;
  }

  .suffix {
    color: $foreground-label;
    user-select: none;
    padding: 4px 10px 6px 0px;
    line-height: 100%;;
  }
}

.progress {
  background: $accent;
  height: 3px;
  width: var(--value);
  left: 0;
  bottom: 0;
}
</style>