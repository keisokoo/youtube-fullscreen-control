function main() {
    var targetNode = document.body;
    var config = { attributes: true, childList: true, subtree: true };
    // let loopTime: LoopTimeType = { start: 137.316625, end: 141.1 }
    var loopTime = { start: null, end: null };
    var timeout = -1;
    var ControlTypeList = [
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
    ];
    var VideoControlList = {
        BracketLeft: "LoopStart",
        BracketRight: "LoopEnd",
        Backslash: "ResetLoop"
    };
    var isVideoControlCode = function (value) {
        return (!!value &&
            Object.keys(VideoControlList).some(function (item) { return item === value; }));
    };
    var NumberPadList = [
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
    ];
    var NumberToControlName = {
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
        NumpadDivide: "RotationMinus"
    };
    function isCurrentPosition(value) {
        return (!!value &&
            typeof value === "object" &&
            "x" in value &&
            "y" in value &&
            "scale" in value &&
            "rotation" in value);
    }
    function getYoutubeVideo() {
        var video = document.querySelector("video:not(#video-preview-container video)");
        return video;
    }
    function getCurrentPosition() {
        var currentPositionString = localStorage.getItem("currentPosition");
        if (currentPositionString) {
            var currentPosition = JSON.parse(currentPositionString);
            if (isCurrentPosition(currentPosition)) {
                return currentPosition;
            }
            else {
                return { x: 0, y: 0, scale: 1, rotation: 0 };
            }
        }
        else {
            return { x: 0, y: 0, scale: 1, rotation: 0 };
        }
    }
    function initPosition(observer) {
        var currentPosition = getCurrentPosition();
        observer === null || observer === void 0 ? void 0 : observer.disconnect();
        var video = getYoutubeVideo();
        setTransformString(video, currentPosition.x, currentPosition.y, currentPosition.scale, currentPosition.rotation);
    }
    var stringCheck = function (target, value) {
        return target.includes(value);
    };
    var controlVideo = function (el, controlName) {
        var runCode = VideoControlList[controlName];
        if (runCode === "LoopStart") {
            if (loopTime.end && loopTime.end < el.currentTime)
                return;
            loopTime.start = el.currentTime;
        }
        if (runCode === "LoopEnd") {
            if (loopTime.start && loopTime.start > el.currentTime)
                return;
            loopTime.end = el.currentTime;
        }
        if (runCode === "ResetLoop") {
            loopTime = { start: null, end: null };
        }
    };
    var transformVideo = function (el, currentPosition, controlName) {
        var nextScale = currentPosition.scale;
        var nextX = currentPosition.x;
        var nextY = currentPosition.y;
        var nextAngle = currentPosition.rotation;
        if (controlName === "ZoomIn") {
            nextScale = currentPosition.scale + 0.1;
        }
        if (controlName === "ZoomOut") {
            nextScale = currentPosition.scale - 0.1;
        }
        if (controlName === "ZoomReset") {
            nextScale = 1;
        }
        if (stringCheck(controlName, "Left")) {
            nextX -= 10 * nextScale;
        }
        if (stringCheck(controlName, "Right")) {
            nextX += 10 * nextScale;
        }
        if (stringCheck(controlName, "Up")) {
            nextY -= 10 * nextScale;
        }
        if (stringCheck(controlName, "Down")) {
            nextY += 10 * nextScale;
        }
        if (controlName === "PositionReset") {
            nextX = 0;
            nextY = 0;
        }
        if (controlName === "Reset") {
            nextX = 0;
            nextY = 0;
            nextScale = 1;
            nextAngle = 0;
        }
        if (controlName === "RotationPlus") {
            nextAngle += 90;
            nextAngle = nextAngle % 360;
        }
        if (controlName === "RotationMinus") {
            nextAngle -= 90;
            nextAngle = nextAngle % 360;
            if (Math.abs(nextAngle) === 0)
                nextAngle = 0;
        }
        setTransformString(el, nextX, nextY, nextScale, nextAngle);
    };
    var isNumberPadCode = function (value) {
        return value !== undefined && NumberPadList.includes(value);
    };
    function setTransformString(el, tx, ty, sc, rt) {
        var configs = { x: tx, y: ty, scale: sc, rotation: rt };
        localStorage.setItem("currentPosition", JSON.stringify(configs));
        el.style.transform = "translate(".concat(tx !== null && tx !== void 0 ? tx : 0, "px,").concat(ty !== null && ty !== void 0 ? ty : 0, "px) scale(").concat(sc !== null && sc !== void 0 ? sc : 1, ")");
        el.parentElement.style.transform = "rotate(".concat(rt, "deg)");
        el.parentElement.style.width = "100%";
        el.parentElement.style.height = "100%";
    }
    function getPositionByMatrix(el) {
        var matrix = new WebKitCSSMatrix(window.getComputedStyle(el).transform);
        var parentMatrix = new WebKitCSSMatrix(window.getComputedStyle(el.parentElement).transform);
        var angleX = getCurrentPosition().rotation;
        return { x: matrix.m41, y: matrix.m42, scale: matrix.m11, rotation: angleX };
    }
    function keyEvent(e) {
        var video = getYoutubeVideo();
        if (e.altKey && video) {
            var eCode = e.code;
            if (isNumberPadCode(eCode)) {
                transformVideo(video, getPositionByMatrix(video), NumberToControlName[eCode]);
            }
            else if (isVideoControlCode(eCode)) {
                controlVideo(video, eCode);
            }
        }
    }
    var callback = function (mutationList, observer) {
        for (var _i = 0, mutationList_1 = mutationList; _i < mutationList_1.length; _i++) {
            var mutation = mutationList_1[_i];
            if (mutation.target.nodeName === "VIDEO" && document.fullscreenElement) {
                clearTimeout(timeout);
                timeout = setTimeout(function () {
                    initPosition(observer);
                    observer.observe(targetNode, config);
                }, 500);
            }
        }
    };
    var observer = new MutationObserver(callback);
    function timeupdate(e) {
        var videoElement = e.currentTarget;
        if (typeof loopTime.start === "number" &&
            typeof loopTime.end === "number") {
            if (videoElement.currentTime < loopTime.start) {
                videoElement.pause();
                videoElement.currentTime = loopTime.start;
                videoElement.play();
            }
            else if (videoElement.currentTime > loopTime.end) {
                videoElement.pause();
                videoElement.currentTime = loopTime.start;
                videoElement.play();
            }
        }
    }
    var fullScreenEvent = function (e) {
        if (document.fullscreenElement) {
            observer.observe(targetNode, config);
            window.addEventListener("keydown", keyEvent);
            var video = getYoutubeVideo();
            video.addEventListener("timeupdate", timeupdate);
        }
        else {
            observer.disconnect();
            window.removeEventListener("keydown", keyEvent);
            var video = getYoutubeVideo();
            video.removeEventListener("timeupdate", timeupdate);
        }
    };
    var fullScreenEventList = [
        "fullscreenchange",
        "webkitfullscreenchange",
        "mozfullscreenchange",
        "msfullscreenchange",
    ];
    fullScreenEventList.forEach(function (eventType) {
        document.removeEventListener(eventType, fullScreenEvent);
        document.addEventListener(eventType, fullScreenEvent, false);
    });
}
main();
