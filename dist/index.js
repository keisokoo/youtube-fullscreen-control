"use strict";
function main() {
    const targetNode = document.body;
    const config = { attributes: true, childList: true, subtree: true };
    let loopTime = { start: null, end: null };
    let timeout;
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
    ];
    const VideoControlList = {
        BracketLeft: "LoopStart",
        BracketRight: "LoopEnd",
        Backslash: "ResetLoop",
    };
    const isVideoControlCode = (value) => {
        return (!!value &&
            Object.keys(VideoControlList).some((item) => item === value));
    };
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
        "KeyH",
        "KeyJ",
        "KeyK",
        "KeyL",
        "Equal",
        "Minus",
        "Digit0",
        "Semicolon",
        "KeyO",
        "KeyI",
        "Quote",
    ];
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
        const video = document.querySelector("video:not(#video-preview-container video)");
        return video;
    }
    function getCurrentPosition() {
        const currentPositionString = localStorage.getItem("currentPosition");
        if (currentPositionString) {
            const currentPosition = JSON.parse(currentPositionString);
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
        const currentPosition = getCurrentPosition();
        observer?.disconnect();
        const video = getYoutubeVideo();
        setTransformString(video, currentPosition.x, currentPosition.y, currentPosition.scale, currentPosition.rotation);
    }
    const stringCheck = (target, value) => {
        return target.includes(value);
    };
    const controlVideo = (el, controlName) => {
        const runCode = VideoControlList[controlName];
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
    };
    const isInAllowAngle = (value) => {
        const allowAngleList = [0, 90, 180, 270, -90, -180, -270];
        return allowAngleList.includes(Number(value));
    };
    const translateWithRotation = (angle, direction, nextX, nextY, nextScale) => {
        if (isInAllowAngle(angle)) {
            if (stringCheck(direction, rotationVariation[angle]["Left"])) {
                nextX -= 10 * nextScale;
            }
            if (stringCheck(direction, rotationVariation[angle]["Right"])) {
                nextX += 10 * nextScale;
            }
            if (stringCheck(direction, rotationVariation[angle]["Up"])) {
                nextY -= 10 * nextScale;
            }
            if (stringCheck(direction, rotationVariation[angle]["Down"])) {
                nextY += 10 * nextScale;
            }
        }
        return {
            nextX,
            nextY,
        };
    };
    const transformVideo = (el, currentPosition, controlName) => {
        let nextScale = currentPosition.scale;
        let nextX = currentPosition.x;
        let nextY = currentPosition.y;
        let nextAngle = currentPosition.rotation;
        if (controlName === "ZoomIn") {
            nextScale = currentPosition.scale + 0.1;
        }
        if (controlName === "ZoomOut") {
            nextScale = currentPosition.scale - 0.1;
        }
        if (controlName === "ZoomReset") {
            nextScale = 1;
        }
        const next = translateWithRotation(nextAngle, controlName, nextX, nextY, nextScale);
        nextX = next.nextX;
        nextY = next.nextY;
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
    const isNumberPadCode = (value) => {
        return value !== undefined && NumberPadList.includes(value);
    };
    function setTransformString(el, tx, ty, sc, rt) {
        const configs = {
            x: tx,
            y: ty,
            scale: sc,
            rotation: rt,
        };
        localStorage.setItem("currentPosition", JSON.stringify(configs));
        el.style.transform = `translate(${tx ?? 0}px,${ty ?? 0}px) scale(${sc ?? 1})`;
        const parentElement = el.parentElement;
        if (parentElement) {
            parentElement.style.transform = `rotate(${rt}deg)`;
            parentElement.style.width = `100%`;
            parentElement.style.height = `100%`;
        }
    }
    function getPositionByMatrix(el) {
        const matrix = new WebKitCSSMatrix(window.getComputedStyle(el).transform);
        const angleX = getCurrentPosition().rotation;
        return {
            x: matrix.m41,
            y: matrix.m42,
            scale: matrix.m11,
            rotation: angleX,
        };
    }
    function keyEvent(e) {
        const video = getYoutubeVideo();
        if (e.altKey && video) {
            const eCode = e.code;
            if (isNumberPadCode(eCode)) {
                transformVideo(video, getPositionByMatrix(video), NumberToControlName[eCode]);
            }
            else if (isVideoControlCode(eCode)) {
                controlVideo(video, eCode);
            }
        }
    }
    const callback = (mutationList, observer) => {
        for (const mutation of mutationList) {
            if (mutation.target.nodeName === "VIDEO" && document.fullscreenElement) {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    initPosition(observer);
                    observer.observe(targetNode, config);
                }, 500);
            }
        }
    };
    const observer = new MutationObserver(callback);
    function timeupdate(e) {
        const videoElement = e.currentTarget;
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
    const fullScreenEvent = (e) => {
        if (document.fullscreenElement) {
            observer.observe(targetNode, config);
            window.addEventListener("keydown", keyEvent);
            const video = getYoutubeVideo();
            video.style.transition = "0.3s";
            video.addEventListener("timeupdate", timeupdate);
        }
        else {
            observer.disconnect();
            window.removeEventListener("keydown", keyEvent);
            const video = getYoutubeVideo();
            video.style.transition = "";
            video.removeEventListener("timeupdate", timeupdate);
        }
    };
    const fullScreenEventList = [
        "fullscreenchange",
        "webkitfullscreenchange",
        "mozfullscreenchange",
        "msfullscreenchange",
    ];
    fullScreenEventList.forEach((eventType) => {
        document.removeEventListener(eventType, fullScreenEvent);
        document.addEventListener(eventType, fullScreenEvent, false);
    });
}
main();
