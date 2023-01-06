import ClickDrag from "./DragAndZoom/ClickDrag"
import "./index.scss"

function main() {
  let video: HTMLElement | null = null
  let parentElement: HTMLElement | null = null
  let dragZoom: ClickDrag | null = null
  const targetNode = document.body
  const config = { attributes: true, childList: true, subtree: true }

  let timeout: NodeJS.Timeout

  function getYoutubeVideo() {
    const video = document.querySelector(
      "video:not(#video-preview-container video)"
    ) as HTMLVideoElement
    return video
  }
  function initPosition(observer?: MutationObserver) {
    observer?.disconnect()
    dragZoom?.loadTransform()
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
  const fullScreenEvent = (e: Event) => {
    if (!video) {
      video = getYoutubeVideo()
    }
    if (!parentElement) {
      if (!video) return
      if (!video.closest("#player-theater-container")) return
      parentElement = video.closest("#player-theater-container")! as HTMLElement
    }
    if (!dragZoom) {
      if (!video) return
      if (!parentElement) return
      dragZoom = new ClickDrag(video, parentElement, {
        before: () => {
          observer.disconnect()
        },
        after: () => {
          observer.observe(targetNode, config)
        },
      })
    }
    if (document.fullscreenElement) {
      observer.observe(targetNode, config)
      window.addEventListener("keydown", dragZoom.onKeyDown)
      window.addEventListener("keyup", dragZoom.onKeyUp)
      video.addEventListener("timeupdate", dragZoom.onTimeUpdate)
      if (parentElement) {
        parentElement.addEventListener(
          "contextmenu",
          dragZoom.disableContextMenu
        )
        parentElement.addEventListener("touchstart", dragZoom.onMouseDown)
        parentElement.addEventListener("mousedown", dragZoom.onMouseDown)
        parentElement.addEventListener("mousedown", dragZoom.toggleStatus)
        parentElement.addEventListener("wheel", dragZoom.onWheel)
      }
    } else {
      observer.disconnect()
      dragZoom.toggleFog(true)
      video.style.transform = ""
      window.removeEventListener("keydown", dragZoom.onKeyDown)
      window.removeEventListener("keyup", dragZoom.onKeyUp)
      if (video) video.removeEventListener("timeupdate", dragZoom.onTimeUpdate)
      if (parentElement) {
        parentElement.removeEventListener(
          "contextmenu",
          dragZoom.disableContextMenu
        )
        parentElement.removeEventListener("touchstart", dragZoom.onMouseDown)
        parentElement.removeEventListener("mousedown", dragZoom.toggleStatus)
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
