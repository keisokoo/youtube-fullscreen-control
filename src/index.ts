function main() {
  /** Drag and Zoom (Wheel zoom with Pinch Zoom)
   *
   * 변경되는 엘리먼트 css에 transform-origin: 0 0; 필요
   */
  interface DraggableElementType {
    // 감속 속도
    deceleration: number
    // 관성 최대 값
    maximumInertia: number
    // 휠 줌 단위
    factor: number
    minScale: number
    maxScale: number
    delta: number
    scaleStart: number
    currentScale: number
    startCurrentScale: number
    inertiaAnimationFrame: number
    // 제한 영역
    maxBounding: CoordsProps
    zoomPoint: CoordsProps
    zoomTarget: CoordsProps
    zoomCenterPosition: CoordsProps
    dragStart: CoordsProps
    dragLast: CoordsProps
    currentPosition: CoordsProps
    velocity: CoordsProps
    pinchCenter: CoordsProps
    targetSize: TargetSize
    debounceStartTime: number | null
    debounceTimeout: NodeJS.Timeout | null
    scaleAble: boolean
    dragAble: boolean
    dragged: boolean
    threshold: number
  }
  interface CoordsProps {
    x: number
    y: number
  }
  interface TargetSize {
    width: number
    height: number
  }
  class DragZoom {
    dragRef: DraggableElementType = {
      deceleration: 0.9,
      maximumInertia: 40,
      factor: 0.1,
      minScale: 0.5,
      maxScale: 20,
      delta: 0,
      scaleStart: 0,
      currentScale: 1,
      startCurrentScale: 1,
      inertiaAnimationFrame: -1,
      maxBounding: { x: 0, y: 0 },
      zoomPoint: { x: 0, y: 0 },
      zoomTarget: { x: 0, y: 0 },
      zoomCenterPosition: { x: 0, y: 0 },
      dragStart: { x: 0, y: 0 },
      dragLast: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      pinchCenter: { x: 0, y: 0 },
      targetSize: { width: 0, height: 0 },
      debounceStartTime: null,
      debounceTimeout: null,
      scaleAble: false,
      dragAble: false,
      dragged: false,
      threshold: 1,
    }
    callback?: (event: any) => void
    constructor(
      private wrapElement: HTMLElement,
      private dragAndZoomElement: HTMLElement,
      private beforeStart?: () => void,
      private afterEnd?: (x: number, y: number, scale: number) => void,
      private updatePosition?: (x: number, y: number, scale: number) => void,
      config?: {
        callback?: (event: any) => void
        dragRef?: DraggableElementType
      }
    ) {
      if (config?.dragRef) this.dragRef = config.dragRef
      if (config?.callback) this.callback = config.callback
    }

    handleZoomWithCurrentPoint = () => {
      if (this.dragRef.debounceStartTime) {
        this.dragRef.debounceStartTime = null
      }
      const offset = this.wrapElement.getBoundingClientRect()

      this.dragRef.zoomPoint.x = this.dragRef.zoomCenterPosition.x - offset.left
      this.dragRef.zoomPoint.y = this.dragRef.zoomCenterPosition.y - offset.top
      // ? 줌인 할 위치
      this.dragRef.zoomTarget.x =
        (this.dragRef.zoomPoint.x - this.dragRef.currentPosition.x) /
        this.dragRef.currentScale
      this.dragRef.zoomTarget.y =
        (this.dragRef.zoomPoint.y - this.dragRef.currentPosition.y) /
        this.dragRef.currentScale

      // ? 줌 인 크기 this.dragRef.minScale ~ this.dragRef.maxScale

      this.dragRef.currentScale = Math.max(
        this.dragRef.minScale,
        Math.min(
          this.dragRef.maxScale,
          this.dragRef.currentScale + this.dragRef.delta * this.dragRef.factor
        )
      )
      const currentX =
        -this.dragRef.zoomTarget.x * this.dragRef.currentScale +
        this.dragRef.zoomPoint.x
      const currentY =
        -this.dragRef.zoomTarget.y * this.dragRef.currentScale +
        this.dragRef.zoomPoint.y
      const limitedBound = this.maxBound(currentX, currentY)
      this.dragRef.currentPosition = { x: limitedBound.x, y: limitedBound.y }
      if (!this.dragAndZoomElement) return
      this.dragAndZoomElement.style.transform = `translate(${this.dragRef.currentPosition.x}px,${this.dragRef.currentPosition.y}px) scale(${this.dragRef.currentScale})`

      if (this.afterEnd)
        this.afterEnd(
          this.dragRef.currentPosition.x,
          this.dragRef.currentPosition.y,
          this.dragRef.currentScale
        )
    }
    wheelZoomEvent = (e: WheelEvent) => {
      if (this.beforeStart) this.beforeStart()
      if (!e.shiftKey) return
      cancelAnimationFrame(this.dragRef.inertiaAnimationFrame)
      if (!this.dragRef.debounceStartTime) {
        this.dragRef.debounceStartTime = +new Date()
      }
      const currentPositionString = localStorage.getItem("currentPosition")
      if (currentPositionString) {
        const currentPosition = JSON.parse(currentPositionString)
        if (isCurrentPosition(currentPosition)) {
          this.dragRef.currentPosition = {
            x: currentPosition.x,
            y: currentPosition.y,
          }
          this.dragRef.currentScale = currentPosition.scale
        }
      }

      let wheelDelta = (e.deltaX ?? e.deltaY) * -1
      this.dragRef.delta = Math.max(-1, Math.min(1, wheelDelta))
      this.dragRef.zoomCenterPosition = {
        x: e.pageX,
        y: e.pageY,
      }
      this.dragRef.startCurrentScale = Math.max(
        this.dragRef.minScale,
        Math.min(
          this.dragRef.maxScale,
          this.dragRef.currentScale + this.dragRef.delta * this.dragRef.factor
        )
      )
      const leftTime = Math.max(
        40 - (+new Date() - this.dragRef.debounceStartTime),
        0
      )

      if (this.dragRef.debounceTimeout) {
        clearTimeout(this.dragRef.debounceTimeout)
      }
      this.dragRef.debounceTimeout = setTimeout(() => {
        this.dragRef.inertiaAnimationFrame = requestAnimationFrame(
          this.handleZoomWithCurrentPoint
        )
      }, leftTime)
    }

    capSpeed = (value: number) => {
      let res = 0

      if (Math.abs(value) > this.dragRef.maximumInertia) {
        res = this.dragRef.maximumInertia
        res *= value < 0 ? -1 : 1
        return res
      }

      return value
    }
    update = () => {
      if (!this.dragAndZoomElement) return
      this.dragRef.velocity.x =
        this.dragRef.velocity.x * this.dragRef.deceleration
      this.dragRef.velocity.y =
        this.dragRef.velocity.y * this.dragRef.deceleration

      this.dragRef.velocity.x = Math.round(this.dragRef.velocity.x * 10) / 10
      this.dragRef.velocity.y = Math.round(this.dragRef.velocity.y * 10) / 10

      this.dragRef.currentPosition.x = Math.round(
        this.dragRef.currentPosition.x + this.dragRef.velocity.x
      )
      this.dragRef.currentPosition.y = Math.round(
        this.dragRef.currentPosition.y + this.dragRef.velocity.y
      )
      const reAssignedPosition = this.maxBound(
        this.dragRef.currentPosition.x,
        this.dragRef.currentPosition.y
      )
      if (!reAssignedPosition) return
      this.dragRef.currentPosition = reAssignedPosition
      this.dragAndZoomElement.style.transform = `translate(${this.dragRef.currentPosition.x}px,${this.dragRef.currentPosition.y}px) scale(${this.dragRef.currentScale})`
      if (
        Math.floor(Math.abs(this.dragRef.velocity.x)) !== 0 ||
        Math.floor(Math.abs(this.dragRef.velocity.y)) !== 0
      ) {
        if (this.updatePosition)
          this.updatePosition(
            this.dragRef.currentPosition.x,
            this.dragRef.currentPosition.y,
            this.dragRef.currentScale
          )
        this.dragRef.inertiaAnimationFrame = requestAnimationFrame(this.update)
      } else {
        if (this.afterEnd)
          this.afterEnd(
            this.dragRef.currentPosition.x,
            this.dragRef.currentPosition.y,
            this.dragRef.currentScale
          )
      }
    }
    finish = () => {
      const limitedBound = this.maxBound(
        this.dragRef.velocity.x,
        this.dragRef.velocity.y
      )
      this.dragRef.velocity = {
        x: this.capSpeed(limitedBound.x),
        y: this.capSpeed(limitedBound.y),
      }

      if (limitedBound.x !== 0 || limitedBound.y !== 0) {
        this.dragRef.inertiaAnimationFrame = requestAnimationFrame(this.update)
      } else {
        if (this.afterEnd)
          this.afterEnd(
            this.dragRef.currentPosition.x,
            this.dragRef.currentPosition.y,
            this.dragRef.currentScale
          )
      }
    }
    maxBound = (x: number, y: number) => {
      if (!this.dragAndZoomElement) return { x, y }
      this.dragRef.maxBounding.x = window.innerWidth / 2
      this.dragRef.maxBounding.y = window.innerHeight / 2
      const imageBound = this.dragAndZoomElement.getBoundingClientRect()

      if (x > this.dragRef.maxBounding.x) x = this.dragRef.maxBounding.x
      if (y > this.dragRef.maxBounding.y) y = this.dragRef.maxBounding.y

      if (
        x <
        (imageBound.width - window.innerWidth + this.dragRef.maxBounding.x) * -1
      ) {
        x =
          (imageBound.width - window.innerWidth + this.dragRef.maxBounding.x) *
          -1
      }
      if (
        y <
        (imageBound.height - window.innerHeight + this.dragRef.maxBounding.y) *
          -1
      ) {
        y =
          (imageBound.height -
            window.innerHeight +
            this.dragRef.maxBounding.y) *
          -1
      }
      return { x, y }
    }
    initPosition = () => {
      this.dragRef.currentPosition = { x: 0, y: 0 }
      this.dragRef.currentScale = 1
      this.dragAndZoomElement.style.transform = `translate(${this.dragRef.currentPosition.x}px,${this.dragRef.currentPosition.y}px) scale(${this.dragRef.currentScale})`
    }
    updateScrollPos = (x: number, y: number) => {
      if (!this.dragAndZoomElement) return
      const oldX = this.dragRef.currentPosition.x
      const oldY = this.dragRef.currentPosition.y
      const invertMovement = false
      const invert = invertMovement ? 1 : -1
      this.dragRef.currentPosition.x =
        this.dragRef.dragLast.x + invert * (-x + this.dragRef.dragStart.x)
      this.dragRef.currentPosition.y =
        this.dragRef.dragLast.y + invert * (-y + this.dragRef.dragStart.y)

      const reAssignedPosition = this.maxBound(
        this.dragRef.currentPosition.x,
        this.dragRef.currentPosition.y
      )
      if (!reAssignedPosition) return
      this.dragRef.currentPosition = reAssignedPosition

      this.dragAndZoomElement.style.transform = `translate(${this.dragRef.currentPosition.x}px,${this.dragRef.currentPosition.y}px) scale(${this.dragRef.currentScale})`

      this.dragRef.velocity = {
        x: this.dragRef.currentPosition.x - oldX,
        y: this.dragRef.currentPosition.y - oldY,
      }
    }
    updateScale = (firstTouch: Touch, secondTouch: Touch) => {
      const dist = Math.hypot(
        firstTouch.clientX - secondTouch.clientX,
        firstTouch.clientY - secondTouch.clientY
      )
      const pinchCenterX = (firstTouch.clientX + secondTouch.clientX) / 2
      const pinchCenterY = (firstTouch.clientY + secondTouch.clientY) / 2

      const offset = this.wrapElement.getBoundingClientRect()

      this.dragRef.zoomPoint.x = pinchCenterX - offset.left
      this.dragRef.zoomPoint.y = pinchCenterY - offset.top

      this.dragRef.targetSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      }
      if (!this.dragRef.targetSize) return
      const mapDist = Math.hypot(
        this.dragRef.targetSize.width * this.dragRef.currentScale,
        this.dragRef.targetSize.height * this.dragRef.currentScale
      )

      this.dragRef.zoomTarget.x =
        (this.dragRef.zoomPoint.x - this.dragRef.currentPosition.x) /
        this.dragRef.currentScale
      this.dragRef.zoomTarget.y =
        (this.dragRef.zoomPoint.y - this.dragRef.currentPosition.y) /
        this.dragRef.currentScale

      const scale =
        ((mapDist * dist) / this.dragRef.scaleStart / mapDist) *
        this.dragRef.startCurrentScale
      this.dragRef.currentScale = Math.min(
        Math.max(this.dragRef.minScale, scale),
        this.dragRef.maxScale
      )

      const currentX =
        -this.dragRef.zoomTarget.x * this.dragRef.currentScale +
        this.dragRef.zoomPoint.x
      const currentY =
        -this.dragRef.zoomTarget.y * this.dragRef.currentScale +
        this.dragRef.zoomPoint.y
      const limitedBound = this.maxBound(currentX, currentY)
      this.dragRef.currentPosition = { x: limitedBound.x, y: limitedBound.y }

      if (!this.dragAndZoomElement) return
      this.dragAndZoomElement.style.transform = `translate(${this.dragRef.currentPosition.x}px,${this.dragRef.currentPosition.y}px) scale(${this.dragRef.currentScale})`
    }
    // onMouseMove
    draggingMouse = (event: any) => {
      event.stopPropagation()
      if (this.dragRef.dragAble) {
        const endPoint = {
          x: event.pageX,
          y: event.pageY,
        }
        let dragDiff = {
          x: Math.abs(this.dragRef.dragStart.x - endPoint.x),
          y: Math.abs(this.dragRef.dragStart.y - endPoint.y),
        }
        if (
          dragDiff.x > this.dragRef.threshold ||
          dragDiff.y > this.dragRef.threshold
        ) {
          this.dragRef.dragged = true
        }

        this.updateScrollPos(event.pageX, event.pageY)
      }
    }
    // onTouchMove
    draggingTouch = (event: any) => {
      event.stopPropagation()
      if (
        this.dragRef.scaleAble &&
        event.changedTouches[0] &&
        event.changedTouches[1]
      ) {
        this.dragRef.dragged = true
        this.updateScale(event.changedTouches[0], event.changedTouches[1])
      } else if (this.dragRef.dragAble) {
        const endPoint = {
          x: event.changedTouches[0].pageX,
          y: event.changedTouches[0].pageY,
        }

        let dragDiff = {
          x: Math.abs(this.dragRef.dragStart.x - endPoint.x),
          y: Math.abs(this.dragRef.dragStart.y - endPoint.y),
        }
        if (
          dragDiff.x > this.dragRef.threshold ||
          dragDiff.y > this.dragRef.threshold
        ) {
          this.dragRef.dragged = true
        }
        // ? 맵 이동
        this.updateScrollPos(
          event.changedTouches[0].pageX,
          event.changedTouches[0].pageY
        )
      }
    }
    // onMouseUp, onTouchEnd or leave event
    dragEventEnd = (event: any) => {
      if ((event.target as any).classList.contains("disable-drag")) return
      event.stopPropagation()
      this.wrapElement.removeEventListener("touchmove", this.draggingTouch)
      this.wrapElement.removeEventListener("touchend", this.dragEventEnd)
      this.wrapElement.removeEventListener("mousemove", this.draggingMouse)
      this.wrapElement.removeEventListener("mouseup", this.dragEventEnd)
      this.wrapElement.removeEventListener("mouseleave", this.dragEventEnd)

      cancelAnimationFrame(this.dragRef.inertiaAnimationFrame)

      if (this.dragRef.scaleAble) {
        this.dragRef.scaleAble = false
        this.dragRef.startCurrentScale = this.dragRef.currentScale
        if (this.afterEnd)
          this.afterEnd(
            this.dragRef.currentPosition.x,
            this.dragRef.currentPosition.y,
            this.dragRef.currentScale
          )
      } else if (this.dragRef.dragAble) {
        this.dragRef.dragAble = false
        this.finish()
      }

      if (!this.dragRef.dragged && this.callback) {
        this.callback(event)
      }
    }
    // onMouseDown, onTouchStart
    isTouchEvent = (event: any): event is TouchEvent => {
      return event.touches !== undefined
    }
    dragEvent = (event: TouchEvent | MouseEvent) => {
      if ((event.target as any).classList.contains("disable-drag")) return
      if (!event.shiftKey) return
      cancelAnimationFrame(this.dragRef.inertiaAnimationFrame)
      if (this.beforeStart) this.beforeStart()
      const currentPositionString = localStorage.getItem("currentPosition")
      if (currentPositionString) {
        const currentPosition = JSON.parse(currentPositionString)
        if (isCurrentPosition(currentPosition)) {
          this.dragRef.currentPosition = {
            x: currentPosition.x,
            y: currentPosition.y,
          }
          this.dragRef.currentScale = currentPosition.scale
        }
      }
      const startPoint = this.isTouchEvent(event)
        ? {
            x: event.touches[0].pageX,
            y: event.touches[0].pageY,
          }
        : {
            x: event.pageX,
            y: event.pageY,
          }

      this.dragRef.dragStart = {
        x: startPoint.x,
        y: startPoint.y,
      }
      this.dragRef.dragLast = {
        x: this.dragRef.currentPosition.x,
        y: this.dragRef.currentPosition.y,
      }
      if (event.type === "touchstart") {
        this.wrapElement.addEventListener("touchmove", this.draggingTouch)
        this.wrapElement.addEventListener("touchend", this.dragEventEnd)
      }
      if (event.type === "mousedown") {
        this.wrapElement.addEventListener("mousemove", this.draggingMouse)
        this.wrapElement.addEventListener("mouseup", this.dragEventEnd)
        this.wrapElement.addEventListener("mouseleave", this.dragEventEnd)
      }
      if (this.isTouchEvent(event)) {
        if (event.touches?.length === 1) {
          this.dragRef.dragAble = true
          this.dragRef.velocity = { x: 0, y: 0 }
          this.dragRef.dragged = false
        }
        if (event.touches?.length === 2) {
          this.dragRef.scaleAble = true
          this.dragRef.dragAble = false
          const dist = Math.hypot(
            event.touches[0].pageX - event.touches[1].pageX,
            event.touches[0].pageY - event.touches[1].pageY
          )
          this.dragRef.scaleStart = dist
          this.dragRef.startCurrentScale = this.dragRef.currentScale
        }
      } else if (event.button === 0) {
        this.dragRef.dragAble = true
        this.dragRef.velocity = { x: 0, y: 0 }
        this.dragRef.dragged = false
      }
    }
  }

  const targetNode = document.body
  const config = { attributes: true, childList: true, subtree: true }
  type LoopTimeType = { start: number | null; end: number | null }
  // let loopTime: LoopTimeType = { start: 137.316625, end: 141.1 }
  let loopTime: LoopTimeType = { start: null, end: null }
  let timeout: NodeJS.Timeout
  type CurrentPosition = {
    x: number
    y: number
    scale: number
    rotation: number
  }
  const ControlTypeList = [
    "RotationPlus",
    "RotationMinus",
    "ZoomReset",
    "ZoomIn",
    "ZoomOut",
    "Reset",
    "LeftDown",
    "Down",
    "RightDown",
    "Left",
    "PositionReset",
    "Right",
    "LeftUp",
    "Up",
    "RightUp",
  ] as const
  type ControlNameType = typeof ControlTypeList[number]
  const VideoControlList = {
    BracketLeft: "LoopStart",
    BracketRight: "LoopEnd",
    Backslash: "ResetLoop",
  } as const
  const isVideoControlCode = (
    value: string
  ): value is keyof typeof VideoControlList => {
    return (
      !!value &&
      (
        Object.keys(VideoControlList) as Array<keyof typeof VideoControlList>
      ).some((item) => item === (value as keyof typeof VideoControlList))
    )
  }
  const NumberPadList = [
    "NumpadMultiply",
    "NumpadDivide",
    "NumpadDecimal",
    "NumpadAdd",
    "NumpadSubtract",
    "Numpad0",
    "Numpad1",
    "Numpad2",
    "Numpad3",
    "Numpad4",
    "Numpad5",
    "Numpad6",
    "Numpad7",
    "Numpad8",
    "Numpad9",

    "KeyH", // left
    "KeyJ", // down
    "KeyK", // up
    "KeyL", // right

    "Equal", // plus
    "Minus", // minus
    "Digit0", // zoom reset
    "Semicolon", // position reset

    "KeyO", // rotation
    "KeyI", // rotation
    "Quote", // reset all
  ] as const
  type ControlCode = typeof NumberPadList[number]
  type ControlEvent = (
    el: HTMLVideoElement,
    currentPosition: CurrentPosition,
    controlName: ControlNameType
  ) => void
  const NumberToControlName = {
    NumpadDecimal: "ZoomReset",
    NumpadAdd: "ZoomIn",
    NumpadSubtract: "ZoomOut",
    Numpad0: "Reset",
    Numpad1: "LeftDown",
    Numpad2: "Down",
    Numpad3: "RightDown",
    Numpad4: "Left",
    Numpad5: "PositionReset",
    Numpad6: "Right",
    Numpad7: "LeftUp",
    Numpad8: "Up",
    Numpad9: "RightUp",
    NumpadMultiply: "RotationPlus",
    NumpadDivide: "RotationMinus",
    KeyH: "Left",
    KeyJ: "Down",
    KeyK: "Up",
    KeyL: "Right",
    Equal: "ZoomIn",
    Minus: "ZoomOut",
    Digit0: "ZoomReset",
    Semicolon: "PositionReset",
    KeyO: "RotationPlus",
    KeyI: "RotationMinus",
    Quote: "Reset",
  } as {
    [key in ControlCode]: ControlNameType
  }
  function isCurrentPosition(value: any): value is CurrentPosition {
    return (
      !!value &&
      typeof value === "object" &&
      "x" in value &&
      "y" in value &&
      "scale" in value &&
      "rotation" in value
    )
  }
  function getYoutubeVideo() {
    const video = document.querySelector(
      "video:not(#video-preview-container video)"
    ) as HTMLVideoElement
    return video
  }
  function getCurrentPosition(): CurrentPosition {
    const currentPositionString = localStorage.getItem("currentPosition")
    if (currentPositionString) {
      const currentPosition = JSON.parse(currentPositionString)
      if (isCurrentPosition(currentPosition)) {
        return currentPosition
      } else {
        return { x: 0, y: 0, scale: 1, rotation: 0 }
      }
    } else {
      return { x: 0, y: 0, scale: 1, rotation: 0 }
    }
  }
  function initPosition(observer?: MutationObserver) {
    const currentPosition = getCurrentPosition()
    observer?.disconnect()
    const video = getYoutubeVideo()
    setTransformString(
      video,
      currentPosition.x,
      currentPosition.y,
      currentPosition.scale,
      currentPosition.rotation
    )
  }
  const stringCheck = (target: string, value: string) => {
    return target.includes(value)
  }
  const controlVideo = (
    el: HTMLVideoElement,
    controlName: keyof typeof VideoControlList
  ) => {
    const runCode = VideoControlList[controlName]
    if (runCode === "LoopStart") {
      if (loopTime.end && loopTime.end < el.currentTime) return
      loopTime.start = el.currentTime
    }
    if (runCode === "LoopEnd") {
      if (loopTime.start && loopTime.start > el.currentTime) return
      loopTime.end = el.currentTime
    }
    if (runCode === "ResetLoop") {
      loopTime = { start: null, end: null }
    }
  }
  type FourDirections = "Left" | "Right" | "Up" | "Down"
  type allowAngle = 0 | 90 | 180 | 270 | -90 | -180 | -270
  const rotationVariation = {
    0: {
      Left: "Left",
      Down: "Down",
      Right: "Right",
      Up: "Up",
    },
    90: {
      Left: "Up",
      Down: "Left",
      Right: "Down",
      Up: "Right",
    },
    "-90": {
      Left: "Down",
      Down: "Right",
      Right: "Up",
      Up: "Left",
    },
    180: {
      Left: "Right",
      Down: "Up",
      Right: "Left",
      Up: "Down",
    },
    "-180": {
      Left: "Right",
      Down: "Up",
      Right: "Left",
      Up: "Down",
    },
    270: {
      Left: "Down",
      Down: "Right",
      Right: "Up",
      Up: "Left",
    },
    "-270": {
      Left: "Up",
      Down: "Left",
      Right: "Down",
      Up: "Right",
    },
  } as { [key in allowAngle]: { [key in FourDirections]: FourDirections } }
  const isInAllowAngle = (value: number): value is allowAngle => {
    const allowAngleList: allowAngle[] = [0, 90, 180, 270, -90, -180, -270]
    return allowAngleList.includes(Number(value) as allowAngle)
  }
  const translateWithRotation = (
    angle: number,
    direction: ControlNameType,
    nextX: number,
    nextY: number,
    nextScale: number
  ) => {
    if (isInAllowAngle(angle)) {
      if (stringCheck(direction, rotationVariation[angle]["Left"])) {
        nextX -= 10 * nextScale
      }
      if (stringCheck(direction, rotationVariation[angle]["Right"])) {
        nextX += 10 * nextScale
      }
      if (stringCheck(direction, rotationVariation[angle]["Up"])) {
        nextY -= 10 * nextScale
      }
      if (stringCheck(direction, rotationVariation[angle]["Down"])) {
        nextY += 10 * nextScale
      }
    }
    return {
      nextX,
      nextY,
    }
  }
  const transformVideo: ControlEvent = (el, currentPosition, controlName) => {
    let nextScale = currentPosition.scale
    let nextX = currentPosition.x
    let nextY = currentPosition.y
    let nextAngle = currentPosition.rotation
    if (controlName === "ZoomIn") {
      nextScale = currentPosition.scale + 0.1
    }
    if (controlName === "ZoomOut") {
      nextScale = currentPosition.scale - 0.1
    }
    if (controlName === "ZoomReset") {
      nextScale = 1
    }
    const next = translateWithRotation(
      nextAngle,
      controlName,
      nextX,
      nextY,
      nextScale
    )
    nextX = next.nextX
    nextY = next.nextY
    if (controlName === "PositionReset") {
      nextX = 0
      nextY = 0
    }
    if (controlName === "Reset") {
      nextX = 0
      nextY = 0
      nextScale = 1
      nextAngle = 0
    }
    if (controlName === "RotationPlus") {
      nextAngle += 90
      nextAngle = nextAngle % 360
    }
    if (controlName === "RotationMinus") {
      nextAngle -= 90
      nextAngle = nextAngle % 360
      if (Math.abs(nextAngle) === 0) nextAngle = 0
    }
    setTransformString(el, nextX, nextY, nextScale, nextAngle)
  }

  const isNumberPadCode = (value: string): value is ControlCode => {
    return value !== undefined && NumberPadList.includes(value as any)
  }
  function setTransformString(
    el: HTMLVideoElement,
    tx: number,
    ty: number,
    sc: number,
    rt: number
  ) {
    const configs = {
      x: tx,
      y: ty,
      scale: sc,
      rotation: rt,
    } as CurrentPosition
    localStorage.setItem("currentPosition", JSON.stringify(configs))
    el.style.transform = `translate(${tx ?? 0}px,${ty ?? 0}px) scale(${
      sc ?? 1
    })`
    const parentElement = el.parentElement
    if (parentElement) {
      parentElement.style.transform = `rotate(${rt}deg)`
      parentElement.style.width = `100%`
      parentElement.style.height = `100%`
    }
  }
  function getPositionByMatrix(el: HTMLVideoElement): CurrentPosition {
    const matrix = new WebKitCSSMatrix(window.getComputedStyle(el).transform)
    const angleX = getCurrentPosition().rotation
    return {
      x: matrix.m41,
      y: matrix.m42,
      scale: matrix.m11,
      rotation: angleX,
    }
  }
  function keyEvent(e: KeyboardEvent) {
    const video = getYoutubeVideo()
    if (e.altKey && video) {
      const eCode = e.code
      if (isNumberPadCode(eCode)) {
        transformVideo(
          video,
          getPositionByMatrix(video),
          NumberToControlName[eCode]
        )
      } else if (isVideoControlCode(eCode)) {
        controlVideo(video, eCode)
      }
    }
  }
  const callback = (
    mutationList: MutationRecord[],
    observer: MutationObserver
  ) => {
    for (const mutation of mutationList) {
      if (mutation.target.nodeName === "VIDEO" && document.fullscreenElement) {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          initPosition(observer)
          observer.observe(targetNode, config)
        }, 500)
      }
    }
  }
  const observer = new MutationObserver(callback)
  function timeupdate(e: Event) {
    const videoElement = e.currentTarget as HTMLVideoElement
    if (
      typeof loopTime.start === "number" &&
      typeof loopTime.end === "number"
    ) {
      if (videoElement.currentTime < loopTime.start) {
        videoElement.pause()
        videoElement.currentTime = loopTime.start
        videoElement.play()
      } else if (videoElement.currentTime > loopTime.end) {
        videoElement.pause()
        videoElement.currentTime = loopTime.start
        videoElement.play()
      }
    }
  }
  const fullScreenEvent = (e: Event) => {
    const video = getYoutubeVideo()
    const parentElement = video.parentElement
    const dragZoom = new DragZoom(
      parentElement!,
      video,
      () => {
        observer.disconnect()
      },
      (x, y, scale) => {
        const currentPosition = getCurrentPosition()
        setTransformString(video, x, y, scale, currentPosition.rotation)
        observer.observe(targetNode, config)
      },
      (x, y, scale) => {
        const currentPosition = getCurrentPosition()
        setTransformString(video, x, y, scale, currentPosition.rotation)
      }
    )
    if (document.fullscreenElement) {
      observer.observe(targetNode, config)
      window.addEventListener("keydown", keyEvent)
      video.style.transformOrigin = "0 0"
      video.addEventListener("timeupdate", timeupdate)
      if (parentElement) {
        parentElement.style.transformOrigin = "0 0"
        parentElement.addEventListener("mousedown", dragZoom.dragEvent)
        parentElement.addEventListener("wheel", dragZoom.wheelZoomEvent)
      }
    } else {
      observer.disconnect()
      window.removeEventListener("keydown", keyEvent)
      video.style.transformOrigin = ""
      video.removeEventListener("timeupdate", timeupdate)
      if (parentElement) {
        parentElement.style.transformOrigin = ""
        parentElement.removeEventListener("mousedown", dragZoom.dragEvent)
        parentElement.removeEventListener("wheel", dragZoom.wheelZoomEvent)
      }
    }
  }
  const fullScreenEventList = [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "msfullscreenchange",
  ]
  fullScreenEventList.forEach((eventType) => {
    document.removeEventListener(eventType, fullScreenEvent)
    document.addEventListener(eventType, fullScreenEvent, false)
  })
}
main()
