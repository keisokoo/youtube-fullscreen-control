import Drag from "./Drag"

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
type ControlEvent = (controlName: ControlNameType) => void

type allowAngle = 0 | 90 | 180 | 270 | -90 | -180 | -270
const VideoControlList = {
  BracketLeft: "LoopStart",
  BracketRight: "LoopEnd",
  Backslash: "ResetLoop",
} as const
class ClickDrag extends Drag {
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
  private createTip = (type: "start" | "end", percent: number) => {
    if (document.querySelector(`.ytf-loop-tip-${type}`)) {
      document.querySelector(`.ytf-loop-tip-${type}`)!.remove()
    }
    const parentElement = document.querySelector(".ytp-progress-bar")
    if (!parentElement) return
    const div = document.createElement("div")
    div.classList.add(`ytf-loop-tip-${type}`)
    div.classList.add(`ytf-loop-tip`)
    div.style.position = "absolute"
    div.style.zIndex = "200"
    div.style.height = "100%"
    div.style.top = "0px"
    div.style.width = "4px"
    div.style.left = percent + "%"
    div.style.transform = "translateX(-50%)"
    div.style.backgroundColor = "#ffdc00"
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
  private controlVideo = (
    el: HTMLVideoElement,
    controlName: keyof typeof VideoControlList
  ) => {
    const runCode = VideoControlList[controlName]
    if (runCode === "LoopStart") {
      if (this.loopTime.end && this.loopTime.end < el.currentTime) return
      this.loopTime.start = el.currentTime
      this.createTip("start", (this.loopTime.start / el.duration) * 100)
    }
    if (runCode === "LoopEnd") {
      if (this.loopTime.start && this.loopTime.start > el.currentTime) return
      this.loopTime.end = el.currentTime
      this.createTip("end", (this.loopTime.end / el.duration) * 100)
    }
    if (runCode === "ResetLoop") {
      this.loopTime = { start: null, end: null }
      this.deleteTip("all")
    }
  }
  private isVideoControlCode = (
    value: string
  ): value is keyof typeof VideoControlList => {
    return (
      !!value &&
      (
        Object.keys(VideoControlList) as Array<keyof typeof VideoControlList>
      ).some((item) => item === (value as keyof typeof VideoControlList))
    )
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
  private transformVideo: ControlEvent = (controlName) => {
    let currentPosition = this.getPosition()
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
  private isNumberPadCode = (value: string): value is ControlCode => {
    return value !== undefined && NumberPadList.includes(value as any)
  }
  private getYoutubeVideo() {
    const video = document.querySelector(
      "video:not(#video-preview-container video)"
    ) as HTMLVideoElement
    return video
  }
  onKeyDown = (e: KeyboardEvent) => {
    const video = this.getYoutubeVideo()
    if (e.altKey && video) {
      const eCode = e.code
      if (this.isNumberPadCode(eCode)) {
        this.transformVideo(NumberToControlName[eCode])
      } else if (this.isVideoControlCode(eCode)) {
        this.controlVideo(video, eCode)
      }
    }
  }
  onMouseDown = (event: MouseEvent) => {
    if (!event.altKey) return
    this.ts = this.getPosition()
    if (event.button === 1) {
      event.preventDefault()
      this.ts.rotate = this.toggleRotation(this.ts.rotate)
      this.setTransform()
      return
    }

    cancelAnimationFrame(this.inertiaAnimationFrame)
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
    if (!event.altKey) return
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
      Math.abs(this.velocity.x) > this.threshold ||
      Math.abs(this.velocity.y) > this.threshold
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
  private onEnd = (event: MouseEvent) => {
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
    if (!event.altKey) return
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
