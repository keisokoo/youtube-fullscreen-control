import ClickDrag from "./DragAndZoom/ClickDrag"

function main() {
  let video: HTMLElement | null = null
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
    video = getYoutubeVideo()
    if (!video) return
    if (!video.parentElement) return
    const parentElement = video.parentElement
    dragZoom = new ClickDrag(video, parentElement, {
      before: () => {
        observer.disconnect()
      },
      after: () => {
        observer.observe(targetNode, config)
      },
    })
    if (document.fullscreenElement) {
      observer.observe(targetNode, config)
      window.addEventListener("keydown", dragZoom.onKeyDown)
      video.addEventListener("timeupdate", dragZoom.onTimeUpdate)
      if (parentElement) {
        parentElement.addEventListener("mousedown", dragZoom.onMouseDown)
        parentElement.addEventListener("wheel", dragZoom.onWheel)
      }
    } else {
      observer.disconnect()
      video.style.transform = ""
      window.removeEventListener("keydown", dragZoom.onKeyDown)
      video.removeEventListener("timeupdate", dragZoom.onTimeUpdate)
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
