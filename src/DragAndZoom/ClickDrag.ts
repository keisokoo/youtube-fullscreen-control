import Drag from "./Drag"

const isKeyOf = <T extends object>(obj: T, value: any): value is keyof T => {
  return (
    !!value &&
    (Object.keys(obj) as Array<keyof T>).some(
      (item) => item === (value as keyof T)
    )
  )
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
const ShortCutList = ["LoopStart", "LoopEnd", "ResetLoop"] as const
const SpecialShortCutList = {
  BracketLeft: "LoopStart",
  BracketRight: "LoopEnd",
  Backslash: "ResetLoop",
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
        this.transformVideo("Reset")
      },
    },
    {
      text: "Rotate",
      onAction: (e: MouseEvent) => {
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
        this.transformVideo("HCover")
      },
    },
    {
      text: "VCover",
      onAction: (e: MouseEvent) => {
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
        this.filterVideo("ResetContrast")
      },
      children: [
        {
          text: "+",
          onAction: (e: MouseEvent) => this.filterVideo("AddContrast"),
        },
        {
          text: "-",
          onAction: (e: MouseEvent) => this.filterVideo("SubtractContrast"),
        },
      ],
    },
    {
      text: "Brightness",
      filter: "brightness",
      onAction: (e: MouseEvent) => {
        this.filterVideo("ResetBrightness")
      },
      children: [
        {
          text: "+",
          onAction: (e: MouseEvent) => this.filterVideo("AddBrightness"),
        },
        {
          text: "-",
          onAction: (e: MouseEvent) => this.filterVideo("SubtractBrightness"),
        },
      ],
    },
    {
      text: "Saturate",
      filter: "saturate",
      onAction: (e: MouseEvent) => {
        this.filterVideo("ResetSaturate")
      },
      children: [
        {
          text: "+",
          onAction: (e: MouseEvent) => this.filterVideo("AddSaturate"),
        },
        {
          text: "-",
          onAction: (e: MouseEvent) => this.filterVideo("SubtractSaturate"),
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
      on.onclick = () => {
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
      this.loopTime.start = video.currentTime
      this.createTip("start", (this.loopTime.start / video.duration) * 100)
    }
    if (runCode === "LoopEnd") {
      if (this.loopTime.start && this.loopTime.start > video.currentTime) return
      this.loopTime.end = video.currentTime
      this.createTip("end", (this.loopTime.end / video.duration) * 100)
    }
    if (runCode === "ResetLoop") {
      this.loopTime = { start: null, end: null }
      this.deleteTip("all")
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
      if (isKeyOf(ControlKeyList, eCode)) {
        this.transformVideo(ControlKeyList[eCode])
      } else if (isKeyOf(SpecialShortCutList, eCode)) {
        this.controlVideo(SpecialShortCutList[eCode])
      } else if (e.code === "KeyZ") {
        this.toggleFog()
      }
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
  onMouseDown = (event: MouseEvent) => {
    if (!this.checkFog()) {
      return
    }
    event.stopPropagation()
    this.ts = this.getPosition()
    if (event.button === 2) {
      event.preventDefault()
      this.transformVideo("Reset")
      return
    }
    cancelAnimationFrame(this.inertiaAnimationFrame)
    if (event.button !== 0) return
    const currentTarget = document.querySelector(".ytf-fog") as HTMLElement
    if (currentTarget) currentTarget.style.cursor = "grabbing"
    this.isDrag = true
    this.isScale = false
    this.startPoint = {
      x: event.pageX,
      y: event.pageY,
    }
    this.previousPosition = {
      x: this.ts.translate.x,
      y: this.ts.translate.y,
    }
    this.velocity = { x: 0, y: 0 }
    const eventTarget = this.eventElement ?? this.targetElement
    eventTarget.addEventListener("mousemove", this.onMove, { passive: true })
    eventTarget.addEventListener("mouseup", this.onEnd)
    eventTarget.addEventListener("mouseleave", this.onEnd)
  }
  private onMove = (event: MouseEvent) => {
    if (!this.checkFog()) return
    if (!this.targetElement) return
    // 중첩 실행 문제 (성능) 해결 :: 굳이 할 필요없음.
    let func = this.eventElement
      ? this.eventElement.ontouchmove
      : this.targetElement.ontouchmove
    this.targetElement.ontouchmove = null

    const x = event.pageX
    const y = event.pageY
    const oldX = this.ts.translate.x
    const oldY = this.ts.translate.y
    const isInvert = false
    const invert = isInvert ? 1 : -1
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
    // 핀치 이벤트
    // 중첩 실행 문제 (성능) 해결 :: 굳이 할 필요없음.
    if (this.eventElement) {
      this.eventElement.ontouchmove = func
    } else {
      this.targetElement.ontouchmove = func
    }
  }
  toggleStatus = (event: MouseEvent) => {
    if (event.button === 1) {
      this.toggleFog()
    }
  }
  private onEnd = (event: MouseEvent) => {
    if (!this.checkFog()) return
    event.stopPropagation()
    event.preventDefault()
    const currentTarget = document.querySelector(".ytf-fog") as HTMLElement
    if (currentTarget) currentTarget.style.cursor = ""
    const eventTarget = this.eventElement ?? this.targetElement
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
