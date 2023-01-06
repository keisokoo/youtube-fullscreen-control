import Drag from "./Drag"
const toHHMMSS = (secondsTime: number) => {
  if (!Number(secondsTime) || !secondsTime) return "00:00"
  let sec_num = Number(secondsTime.toFixed(0))
  let hours: number = Math.floor(sec_num / 3600)
  let minutes: number = Math.floor((sec_num - hours * 3600) / 60)
  let seconds: number = sec_num - hours * 3600 - minutes * 60
  return `${hours ? String(hours).padStart(2, "0") + ":" : ""}${String(
    minutes
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}
const isKeyOf = <T extends object>(obj: T, value: any): value is keyof T => {
  return (
    !!value &&
    (Object.keys(obj) as Array<keyof T>).some(
      (item) => item === (value as keyof T)
    )
  )
}

const isTouchEvent = (event: any): event is TouchEvent => {
  return "touches" in event
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
  "Cover",
  "VCover",
  "HCover",
  "Center",
] as const
type ControlNameType = typeof ControlTypeList[number]

const FilterTypeList = [
  "AddContrast",
  "ResetContrast",
  "SubtractContrast",
  "AddBrightness",
  "ResetBrightness",
  "SubtractBrightness",
  "AddSaturate",
  "ResetSaturate",
  "SubtractSaturate",
] as const
type FilterNameType = typeof FilterTypeList[number]

const ControlKeyList = {
  KeyW: "Up",
  KeyA: "Left",
  KeyS: "Down",
  KeyD: "Right",
  KeyE: "ZoomIn",
  KeyQ: "ZoomOut",
  KeyR: "RotationPlus",
  Backquote: "Reset",
} as const
type ControlKeyCode = keyof typeof ControlKeyList

const NumberPadList = {
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
} as const
type NumberKeyCode = keyof typeof NumberPadList
type NumberCode = typeof NumberPadList[keyof typeof NumberPadList]

type ControlEvent = (controlName: ControlNameType) => void

type allowAngle = 0 | 90 | 180 | 270 | -90 | -180 | -270
const ShortCutList = ["LoopStart", "LoopEnd", "ResetLoop", "Playback"] as const
const SpecialShortCutList = {
  BracketLeft: "LoopStart",
  BracketRight: "LoopEnd",
  Backslash: "ResetLoop",
  Playback: "Playback",
} as const
const ShiftSpecialShortCutList = {
  KeyA: "LoopStart",
  KeyS: "LoopEnd",
  KeyD: "ResetLoop",
} as const
class ClickDrag extends Drag {
  controlElementList = [
    {
      text: "Initial",
      onAction: (e: MouseEvent) => {
        e.stopPropagation()
        this.transformVideo("Reset")
      },
    },
    {
      text: "Rotate",
      onAction: (e: MouseEvent) => {
        e.stopPropagation()
        this.transformVideo("RotationPlus")
      },
    },
    {
      text: "Empty",
      onAction: (e: MouseEvent) => {},
    },
    {
      text: "HCover",
      onAction: (e: MouseEvent) => {
        e.stopPropagation()
        this.transformVideo("HCover")
      },
    },
    {
      text: "VCover",
      onAction: (e: MouseEvent) => {
        e.stopPropagation()
        this.transformVideo("VCover")
      },
    },
    {
      text: "Empty",
      onAction: (e: MouseEvent) => {},
    },
    {
      text: "Contrast",
      filter: "contrast",
      onAction: (e: MouseEvent) => {
        e.stopPropagation()
        this.filterVideo("ResetContrast")
      },
      children: [
        {
          text: "+",
          onAction: (e: MouseEvent) => {
            e.stopPropagation()
            this.filterVideo("AddContrast")
          },
        },
        {
          text: "-",
          onAction: (e: MouseEvent) => {
            e.stopPropagation()
            this.filterVideo("SubtractContrast")
          },
        },
      ],
    },
    {
      text: "Brightness",
      filter: "brightness",
      onAction: (e: MouseEvent) => {
        e.stopPropagation()
        this.filterVideo("ResetBrightness")
      },
      children: [
        {
          text: "+",
          onAction: (e: MouseEvent) => {
            e.stopPropagation()
            this.filterVideo("AddBrightness")
          },
        },
        {
          text: "-",
          onAction: (e: MouseEvent) => {
            e.stopPropagation()
            this.filterVideo("SubtractBrightness")
          },
        },
      ],
    },
    {
      text: "Saturate",
      filter: "saturate",
      onAction: (e: MouseEvent) => {
        e.stopPropagation()
        this.filterVideo("ResetSaturate")
      },
      children: [
        {
          text: "+",
          onAction: (e: MouseEvent) => {
            e.stopPropagation()
            this.filterVideo("AddSaturate")
          },
        },
        {
          text: "-",
          onAction: (e: MouseEvent) => {
            e.stopPropagation()
            this.filterVideo("SubtractSaturate")
          },
        },
      ],
    },
    {
      text: "Empty",
      onAction: (e: MouseEvent) => {},
    },
    {
      text: "Close",
      onAction: (e: MouseEvent) => {
        e.stopPropagation()
        this.toggleFog()
      },
    },
  ]
  onTimeUpdate = (e: Event) => {
    const videoElement = e.currentTarget as HTMLVideoElement
    if (!this.loopTime) return
    if (
      typeof this.loopTime.start === "number" &&
      typeof this.loopTime.end === "number"
    ) {
      if (videoElement.currentTime < this.loopTime.start) {
        videoElement.pause()
        videoElement.currentTime = this.loopTime.start
        videoElement.play()
      } else if (videoElement.currentTime > this.loopTime.end) {
        videoElement.pause()
        videoElement.currentTime = this.loopTime.start
        videoElement.play()
      }
    }
  }
  private checkFog = () => {
    const fog = document.querySelector(".ytf-fog")
    return !!fog
  }
  toggleFog = (remove?: boolean) => {
    const wrap = document.querySelector("#player-theater-container")
    if (!wrap) return
    const fog = document.querySelector(".ytf-fog")
    if (fog) {
      wrap.classList.remove("fog")
      fog.remove()
    } else if (!remove) {
      wrap.classList.add("fog")
      const div = document.createElement("div")
      const on = document.createElement("div")
      on.classList.add("ytf-fog-on")
      on.onclick = (e) => {
        e.stopPropagation()
        if (div.classList.contains("active")) {
          div.classList.remove("active")
        } else {
          div.classList.add("active")
        }
      }
      div.classList.add("ytf-fog")
      div.appendChild(on)
      const controlDiv = document.createElement("div")
      controlDiv.classList.add(`ytf-control`)
      this.controlElementList.forEach((item) => {
        const controlItem = document.createElement("div")
        if (item.children) {
          controlItem.classList.add("ytf-button-row")
          const titleItem = document.createElement("div")
          const spanItem = document.createElement("span")
          spanItem.classList.add(`ytf-${item.filter}`)
          titleItem.classList.add("ytf-button")
          titleItem.classList.add("ytf-title")
          titleItem.textContent = item.text
          titleItem.onclick = item.onAction
          spanItem.textContent = String(
            Math.floor(this.filter[item.filter] * 100) / 100
          )
          titleItem.appendChild(spanItem)
          controlItem.appendChild(titleItem)
          item.children.forEach((child) => {
            const childItem = document.createElement("div")
            childItem.classList.add("ytf-button")
            childItem.classList.add("ytf-child")
            childItem.textContent = child.text
            childItem.onclick = child.onAction
            controlItem.appendChild(childItem)
          })
        } else {
          controlItem.classList.add("ytf-button")
          controlItem.textContent = item.text
          if (item.text !== "Empty") {
            controlItem.onclick = item.onAction
          } else {
            controlItem.classList.add("empty")
          }
        }
        controlDiv.appendChild(controlItem)
      })
      div.appendChild(controlDiv)
      wrap.appendChild(div)
    }
  }
  private createTip = (type: "start" | "end", percent: number) => {
    if (document.querySelector(`.ytf-loop-tip-${type}`)) {
      document.querySelector(`.ytf-loop-tip-${type}`)!.remove()
    }
    const parentElement = document.querySelector(".ytp-progress-bar")
    if (!parentElement) return
    const div = document.createElement("div")
    div.classList.add(`ytf-loop-tip-${type}`)
    div.classList.add(`ytf-loop-tip`)
    div.style.left = percent + "%"
    parentElement.appendChild(div)
  }
  deleteTip = (type: "start" | "end" | "all") => {
    if (type === "all") {
      const divList = document.querySelectorAll(".ytf-loop-tip")
      divList.forEach((el) => el.remove())
      return
    }
    const div = document.querySelector(`.ytf-loop-tip-${type}`)
    if (!div) return
    div.remove()
  }
  private controlVideo = (runCode: typeof ShortCutList[number]) => {
    const video = this.getYoutubeVideo()
    if (runCode === "LoopStart") {
      if (this.loopTime.end && this.loopTime.end < video.currentTime) return
      if (this.loopTime.start) {
        this.loopTime.start = null
        this.deleteTip("start")
        return
      }
      this.loopTime.start = video.currentTime
      this.createTip("start", (this.loopTime.start / video.duration) * 100)
    }
    if (runCode === "LoopEnd") {
      if (this.loopTime.start && this.loopTime.start > video.currentTime) return
      if (this.loopTime.end) {
        this.loopTime.end = null
        this.deleteTip("end")
        return
      }
      this.loopTime.end = video.currentTime
      this.createTip("end", (this.loopTime.end / video.duration) * 100)
    }
    if (runCode === "ResetLoop") {
      this.loopTime = { start: null, end: null }
      this.deleteTip("all")
    }
    if (runCode === "Playback") {
      if (video.paused) {
        video.play()
      } else {
        video.pause()
      }
    }
  }
  private stringCheck = (target: string, value: string) => {
    return target.includes(value)
  }
  private isInAllowAngle = (value: number): value is allowAngle => {
    const allowAngleList: allowAngle[] = [0, 90, 180, 270, -90, -180, -270]
    return allowAngleList.includes(Number(value) as allowAngle)
  }
  private translateWithRotation = (
    angle: number,
    direction: ControlNameType,
    nextX: number,
    nextY: number,
    nextScale: number
  ) => {
    if (this.isInAllowAngle(angle)) {
      if (this.stringCheck(direction, "Left")) {
        nextX -= 10 * nextScale
      }
      if (this.stringCheck(direction, "Right")) {
        nextX += 10 * nextScale
      }
      if (this.stringCheck(direction, "Up")) {
        nextY -= 10 * nextScale
      }
      if (this.stringCheck(direction, "Down")) {
        nextY += 10 * nextScale
      }
    }
    return {
      nextX,
      nextY,
    }
  }
  private filterVideo = (filterAction: FilterNameType) => {
    if (filterAction.includes("Brightness")) {
      if (filterAction.includes("Add")) {
        this.filter.brightness += 0.02
      } else if (filterAction.includes("Subtract")) {
        this.filter.brightness -= 0.02
      } else {
        this.filter.brightness = 1
      }
    }
    if (filterAction.includes("Contrast")) {
      if (filterAction.includes("Add")) {
        this.filter.contrast += 0.02
      } else if (filterAction.includes("Subtract")) {
        this.filter.contrast -= 0.02
      } else {
        this.filter.contrast = 1
      }
    }
    if (filterAction.includes("Saturate")) {
      if (filterAction.includes("Add")) {
        this.filter.saturate += 0.02
      } else if (filterAction.includes("Subtract")) {
        this.filter.saturate -= 0.02
      } else {
        this.filter.saturate = 1
      }
    }
    this.setFilter()
  }
  private transformVideo: ControlEvent = (controlName) => {
    const currentPosition = this.getPosition()
    const video = this.getYoutubeVideo()
    const videoBounding = video.getBoundingClientRect()
    let nextScale = currentPosition.scale
    let nextX = currentPosition.translate.x
    let nextY = currentPosition.translate.y
    let nextAngle = currentPosition.rotate
    if (controlName === "ZoomIn") {
      nextScale = currentPosition.scale + 0.1
    }
    if (controlName === "ZoomOut") {
      nextScale = currentPosition.scale - 0.1
    }
    if (controlName === "ZoomReset") {
      nextScale = 1
    }
    const next = this.translateWithRotation(
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
    if (controlName === "HCover") {
      nextX = 0
      nextY = 0
      nextScale = window.innerWidth / (videoBounding.width / this.ts.scale)
    }
    if (controlName === "VCover") {
      nextX = 0
      nextY = 0
      nextScale = window.innerHeight / (videoBounding.height / this.ts.scale)
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
      nextAngle = nextAngle < 0 ? nextAngle + 360 : nextAngle
      if (Math.abs(nextAngle) === 0) nextAngle = 0
    }
    this.ts = {
      rotate: nextAngle,
      scale: nextScale,
      translate: {
        x: nextX,
        y: nextY,
      },
    }
    this.setTransform()
  }
  private getYoutubeVideo() {
    const video = document.querySelector(
      "video:not(#video-preview-container video)"
    ) as HTMLVideoElement
    return video
  }
  private handleControl(eCode: string) {
    if (isKeyOf(ControlKeyList, eCode)) {
      this.transformVideo(ControlKeyList[eCode])
    } else if (isKeyOf(SpecialShortCutList, eCode)) {
      this.controlVideo(SpecialShortCutList[eCode])
    } else if (eCode === "KeyZ") {
      this.toggleFog()
    }
  }
  onKeyDown = (e: KeyboardEvent) => {
    const video = this.getYoutubeVideo()
    if (video) {
      const eCode = e.code
      if (e.altKey) {
        if (isKeyOf(NumberPadList, eCode) && e.altKey) {
          this.transformVideo(NumberPadList[eCode])
        }
        return
      }
      if (e.shiftKey) {
        if (isKeyOf(ShiftSpecialShortCutList, eCode) && e.shiftKey) {
          this.controlVideo(ShiftSpecialShortCutList[eCode])
        }
        return
      }
      if (e.metaKey) {
        return
      }
      if (e.ctrlKey) {
        return
      }
      this.handleControl(eCode)
    }
  }
  onKeyUp = (e: KeyboardEvent) => {
    const video = this.getYoutubeVideo()
  }
  disableContextMenu = (event: MouseEvent) => {
    if (!this.checkFog()) return
    if (event.preventDefault != undefined) event.preventDefault()
    if (event.stopPropagation != undefined) event.stopPropagation()
  }
  startMousePosition = {
    left: 0,
    right: 0,
  }
  videoTimeline = {
    currentTime: 0,
    duration: 0,
  }
  seekThreshold = 64
  nextVideoTime = 0
  isSeek = false
  isPausedBeforeSeek = false
  ballControl: { keyCode: string; label: string } | null = null
  private createTimeline = (event: MouseEvent) => {
    const fog = document.querySelector(".ytf-fog")
    const before = document.querySelector(".ytf-timeCircle")
    if (before) before.remove()
    if (fog) {
      const timeCircle = document.createElement("div")
      const timeCircleSpan = document.createElement("span")
      const circleTimeline = document.createElement("div")
      circleTimeline.classList.add("ytf-circle-timeline")
      timeCircle.classList.add("ytf-timeCircle")
      timeCircle.style.width = this.seekThreshold * 2 + "px"
      timeCircle.style.height = this.seekThreshold * 2 + "px"
      timeCircle.style.top = event.pageY + "px"
      timeCircle.style.left = event.pageX + "px"
      timeCircle.appendChild(circleTimeline)
      timeCircle.appendChild(timeCircleSpan)
      fog.appendChild(timeCircle)
    }
  }
  getDirection = (coords: [number, number]) => {
    const directions = (Math.atan2(coords[1], coords[0]) / Math.PI) * 180 + 180
    if (directions >= 45 && directions < 135) {
      return "up"
    } else if (directions >= 135 && directions < 225) {
      return "right"
    } else if (directions >= 225 && directions < 315) {
      return "down"
    } else {
      return "left"
    }
  }
  onMouseDown = (event: MouseEvent | TouchEvent) => {
    if (!this.checkFog()) {
      return false
    }
    if (
      isTouchEvent(event) &&
      (event.target as HTMLElement).classList.contains("ytf-fog-on")
    ) {
      event.stopPropagation()
      const div = document.querySelector(".ytf-fog")
      if (!div) return
      if (div.classList.contains("active")) {
        div.classList.remove("active")
      } else {
        div.classList.add("active")
      }
      return
    }

    if (event.preventDefault != undefined) event.preventDefault()
    if (event.stopPropagation != undefined) event.stopPropagation()
    const eventTarget = this.eventElement ?? this.targetElement
    this.ts = this.getPosition()
    if (!isTouchEvent(event) && event.button === 2) {
      this.startPoint = {
        x: event.pageX,
        y: event.pageY,
      }
      this.createTimeline(event)
      const video = this.getYoutubeVideo()
      this.isPausedBeforeSeek = video.paused
      this.startMousePosition = {
        left: event.pageX,
        right: window.innerWidth - event.pageX,
      }
      this.videoTimeline = {
        currentTime: video.currentTime,
        duration: video.duration,
      }
      this.isSeek = true
      this.nextVideoTime = video.currentTime
      eventTarget.addEventListener("mousemove", this.moveSeek, {
        passive: true,
      })
      eventTarget.addEventListener("mouseup", this.endSeek)
      eventTarget.addEventListener("mouseleave", this.endSeek)

      return
    }
    cancelAnimationFrame(this.inertiaAnimationFrame)
    if (isTouchEvent(event) && event.touches.length === 1) {
      this.startPoint = {
        x: event.touches[0].pageX,
        y: event.touches[0].pageY,
      }
      eventTarget.addEventListener("touchmove", this.onMove, { passive: true })
      eventTarget.addEventListener("touchend", this.onEnd)
    } else if (!isTouchEvent(event) && event.button === 0) {
      this.startPoint = {
        x: event.pageX,
        y: event.pageY,
      }
      eventTarget.addEventListener("mousemove", this.onMove, { passive: true })
      eventTarget.addEventListener("mouseup", this.onEnd)
      eventTarget.addEventListener("mouseleave", this.onEnd)
    }
    const currentTarget = document.querySelector(".ytf-fog") as HTMLElement
    if (currentTarget) currentTarget.style.cursor = "grabbing"
    this.isDrag = true
    this.isSeek = false
    this.isScale = false
    this.previousPosition = {
      x: this.ts.translate.x,
      y: this.ts.translate.y,
    }
    this.velocity = { x: 0, y: 0 }
  }
  moveSeek = (event: MouseEvent) => {
    if (!this.checkFog()) return
    if (!this.targetElement) return
    const video = this.getYoutubeVideo()
    const x = event.pageX
    const y = event.pageY
    const xDiff = x - this.startPoint.x
    const yDiff = y - this.startPoint.y
    const directions = this.getDirection([xDiff, yDiff])
    if (this.isSeek) {
      const currentTarget = document.querySelector(".ytf-fog") as HTMLElement
      const currentLeft = x - this.startMousePosition.left
      const currentTop = y - this.startPoint.y
      if (currentTop < -this.seekThreshold && directions === "up") {
        if (currentTarget) currentTarget.style.cursor = "n-resize"
        this.ballControl = {
          keyCode: "Backquote",
          label: "Reset",
        }
      } else if (currentTop > this.seekThreshold && directions === "down") {
        if (currentTarget) currentTarget.style.cursor = "s-resize"
        this.ballControl = {
          keyCode: "Playback",
          label: video.paused ? "Play" : "Pause",
        }
      } else if (currentLeft < -this.seekThreshold && directions === "left") {
        if (currentTarget) currentTarget.style.cursor = "w-resize"
        // left
        const calculateX = x - this.startMousePosition.left + this.seekThreshold

        const leftPercent =
          (this.startMousePosition.left - this.seekThreshold + calculateX) /
          (this.startMousePosition.left - this.seekThreshold)
        this.nextVideoTime = this.videoTimeline.currentTime * leftPercent
      } else if (currentLeft > this.seekThreshold && directions === "right") {
        if (currentTarget) currentTarget.style.cursor = "e-resize"
        const calculateX = x - this.startMousePosition.left - this.seekThreshold
        // right
        const rightPercent =
          1 -
          (this.startMousePosition.right - this.seekThreshold - calculateX) /
            (this.startMousePosition.right - this.seekThreshold)
        this.nextVideoTime =
          this.videoTimeline.currentTime +
          (this.videoTimeline.duration - this.videoTimeline.currentTime) *
            rightPercent
      } else {
        if (currentTarget) currentTarget.style.cursor = ""
        this.nextVideoTime = this.videoTimeline.currentTime
        this.ballControl = null
      }
      if (
        this.nextVideoTime &&
        this.nextVideoTime !== this.videoTimeline.currentTime
      ) {
        if (!video.paused) video.pause()
        video.currentTime = this.nextVideoTime
      } else if (
        video.paused &&
        this.videoTimeline.currentTime !== video.currentTime
      ) {
        video.currentTime = this.videoTimeline.currentTime
        this.nextVideoTime = this.videoTimeline.currentTime
        if (!this.isPausedBeforeSeek) {
          video.play()
        }
      }
      const timeCircleSpan = document.querySelector(".ytf-timeCircle > span")
      const circleTimeline = document.querySelector(
        ".ytf-circle-timeline"
      ) as HTMLElement
      if (timeCircleSpan)
        timeCircleSpan.textContent =
          this.ballControl?.label ?? toHHMMSS(this.nextVideoTime)
      if (circleTimeline)
        circleTimeline.style.width =
          String((this.nextVideoTime / this.videoTimeline.duration) * 100) + "%"
    }
  }
  endSeek = () => {
    this.isSeek = false
    const eventTarget = this.eventElement ?? this.targetElement
    const currentTarget = document.querySelector(".ytf-fog") as HTMLElement
    if (currentTarget) currentTarget.style.cursor = ""

    const timeCircle = document.querySelector(".ytf-timeCircle")
    if (timeCircle) timeCircle.remove()

    if (this.nextVideoTime) {
      const video = this.getYoutubeVideo()
      if (video.paused && !this.isPausedBeforeSeek) {
        video.play()
      }
    }
    if (this.ballControl) {
      this.handleControl(this.ballControl.keyCode)
      this.ballControl = null
    }
    eventTarget.removeEventListener("mousemove", this.moveSeek)
    eventTarget.removeEventListener("mouseup", this.endSeek)
    eventTarget.removeEventListener("mouseleave", this.endSeek)
  }
  private onMove = (event: MouseEvent | TouchEvent) => {
    if (!this.checkFog()) return
    if (!this.targetElement) return
    const x = isTouchEvent(event) ? event.touches[0].pageX : event.pageX
    const y = isTouchEvent(event) ? event.touches[0].pageY : event.pageY
    const oldX = this.ts.translate.x
    const oldY = this.ts.translate.y
    const isInvert = false
    const invert = isInvert ? 1 : -1
    if (this.isDrag) {
      this.ts.translate.x =
        this.previousPosition.x + invert * (-x + this.startPoint.x)
      this.ts.translate.y =
        this.previousPosition.y + invert * (-y + this.startPoint.y)
      this.ts.translate = this.restrictXY(this.ts.translate)
      this.setTransform()

      this.velocity = {
        x: this.ts.translate.x - oldX,
        y: this.ts.translate.y - oldY,
      }
      if (
        Math.abs(this.previousPosition.x - this.ts.translate.x) >
          this.threshold ||
        Math.abs(this.previousPosition.y - this.ts.translate.x) > this.threshold
      )
        this.dragged = true
    }
  }
  toggleStatus = (event: MouseEvent) => {
    if (event.button === 1) {
      if (event.preventDefault != undefined) event.preventDefault()
      if (event.stopPropagation != undefined) event.stopPropagation()
      this.toggleFog()
      event.cancelBubble = false
      return false
    }
  }
  private onEnd = (event: MouseEvent | TouchEvent) => {
    if (!this.checkFog()) return
    event.stopPropagation()
    event.preventDefault()

    const currentTarget = document.querySelector(".ytf-fog") as HTMLElement
    if (currentTarget) currentTarget.style.cursor = ""
    const eventTarget = this.eventElement ?? this.targetElement
    eventTarget.removeEventListener("touchmove", this.onMove)
    eventTarget.removeEventListener("touchend", this.onEnd)
    eventTarget.removeEventListener("mousemove", this.onMove)
    eventTarget.removeEventListener("mouseup", this.onEnd)
    eventTarget.removeEventListener("mouseleave", this.onEnd)

    cancelAnimationFrame(this.inertiaAnimationFrame)
    if (this.dragged && this.isDrag) {
      this.dragFinish()
    }
    this.dragged = false
    this.isDrag = false
    this.isScale = false
  }
  onWheel = (event: WheelEvent) => {
    if (!this.checkFog()) return
    if (!this.targetElement) return
    event.preventDefault()
    this.ts = this.getPosition()

    let func = this.eventElement
      ? this.eventElement.onwheel
      : this.targetElement.onwheel
    this.targetElement.onwheel = null

    let rec = this.targetElement.getBoundingClientRect()
    let pointerX = (event.clientX - rec.left) / this.ts.scale
    let pointerY = (event.clientY - rec.top) / this.ts.scale

    let delta = event.deltaY * -1
    if (this.ts.scale === this.maxScale && delta > 0) {
      return
    }
    const beforeTargetSize = {
      w: Math.round(rec.width / this.ts.scale),
      h: Math.round(rec.height / this.ts.scale),
    }
    const factor = this.factor * this.ts.scale
    this.ts.scale = delta > 0 ? this.ts.scale + factor : this.ts.scale - factor
    this.ts.scale = Math.min(
      Math.max(this.minScale, this.ts.scale),
      this.maxScale
    )

    let m = delta > 0 ? factor / 2 : -(factor / 2)
    if (this.ts.scale <= this.minScale && delta < 0) {
      return
    }

    this.ts.translate.x += -pointerX * m * 2 + beforeTargetSize.w * m
    this.ts.translate.y += -pointerY * m * 2 + beforeTargetSize.h * m
    this.ts.translate = this.restrictXY(this.ts.translate)
    this.setTransform()
    if (this.eventElement) {
      this.eventElement.onwheel = func
    } else {
      this.targetElement.onwheel = func
    }
  }
}
export default ClickDrag
