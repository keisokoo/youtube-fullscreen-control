import ClickDrag from "./DragAndZoom/ClickDrag"

function main() {
  let video: HTMLElement | null = null
  let dragZoom: ClickDrag | null = null
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
    video = getYoutubeVideo()
    if (!video) return
    if (!video.parentElement) return
    const parentElement = video.parentElement
    dragZoom = new ClickDrag(video, parentElement)
    //   parentElement!,
    //   video,
    //   () => {
    //     observer.disconnect()
    //   },
    //   (x, y, scale) => {
    //     const currentPosition = getCurrentPosition()
    //     setTransformString(video, x, y, scale, currentPosition.rotation)
    //     observer.observe(targetNode, config)
    //   },
    //   (x, y, scale) => {
    //     const currentPosition = getCurrentPosition()
    //     setTransformString(video, x, y, scale, currentPosition.rotation)
    //   }
    // )
    if (document.fullscreenElement) {
      // observer.observe(targetNode, config)
      window.addEventListener("keydown", keyEvent)
      video.addEventListener("timeupdate", timeupdate)
      if (parentElement) {
        parentElement.addEventListener("mousedown", dragZoom.onMouseDown)
        parentElement.addEventListener("wheel", dragZoom.onWheel)
      }
    } else {
      observer.disconnect()
      window.removeEventListener("keydown", keyEvent)
      video.removeEventListener("timeupdate", timeupdate)
      if (parentElement) {
        parentElement.removeEventListener("mousedown", dragZoom.onMouseDown)
        parentElement.removeEventListener("wheel", dragZoom.onWheel)
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
