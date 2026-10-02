import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

// Single instance singleton promise for loading COCO-SSD model once
let modelPromise = null;
function loadModelWithTimeout(timeoutMs = 6000) {
  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        await tf.setBackend("webgl").catch(() => tf.setBackend("cpu"));
        await tf.ready();
      } catch (e) {
        console.warn("TFJS backend ready warning:", e);
      }

      const loadPromise = cocoSsd.load({ base: "lite_mobilenet_v2" });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Model load timeout")), timeoutMs)
      );

      return Promise.race([loadPromise, timeoutPromise]);
    })().catch((err) => {
      modelPromise = null;
      throw err;
    });
  }
  return modelPromise;
}

const PHONE_LABELS = new Set(["cell phone"]);
const PERSON_LABEL = "person";
const DETECTION_INTERVAL_MS = 400; // Optimized cycle (~400ms)
const NO_FACE_GRACE_TICKS = 2; // 2 frames (~0.8s) of no-person before flagging
const PHONE_CONFIRM_TICKS = 2; // Require 2 consecutive frames (~0.8s) before flagging phone
const PHONE_SCORE_THRESHOLD = 0.50; // Configurable phone confidence threshold
const VIOLATION_COOLDOWN_MS = 4000; // 4s violation cooldown timer

// Calculate IoU (Intersection over Union) for two bounding boxes [x, y, w, h]
function computeIoU(boxA, boxB) {
  if (!boxA || !boxB) return 0;
  const [xA, yA, wA, hA] = boxA;
  const [xB, yB, wB, hB] = boxB;

  const xOverlap = Math.max(0, Math.min(xA + wA, xB + wB) - Math.max(xA, xB));
  const yOverlap = Math.max(0, Math.min(yA + hA, yB + hB) - Math.max(yA, yB));
  const intersection = xOverlap * yOverlap;

  const areaA = wA * hA;
  const areaB = wB * hB;
  const union = areaA + areaB - intersection;

  return union > 0 ? intersection / union : 0;
}

// Skin-tone fallback detector
function detectPresenceFallback(video) {
  if (!video || video.readyState < 2) return { personCount: 1 };
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 80;
    canvas.height = 60;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { personCount: 1 };

    ctx.drawImage(video, 0, 0, 80, 60);
    const data = ctx.getImageData(0, 0, 80, 60).data;
    let skinPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (r > 45 && g > 35 && b > 15 && max - min > 12 && Math.abs(r - g) > 12 && r > g && r > b) {
        skinPixels++;
      }
    }
    const skinRatio = skinPixels / (80 * 60);
    return { personCount: skinRatio > 0.02 ? 1 : 0 };
  } catch {
    return { personCount: 1 };
  }
}

export function useProctoringCamera({ onViolation, enabled = true }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const modelRef = useRef(null);
  
  // Mutex lock to prevent overlapping detection frames
  const isInferringRef = useRef(false);
  
  const useFallbackRef = useRef(false);
  const noFaceTicksRef = useRef(0);
  const phoneTicksRef = useRef(0);
  const prevPhoneBoxRef = useRef(null);
  const lastViolationAtRef = useRef({});

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [modelStatus, setModelStatus] = useState("loading"); // loading | ready | fallback | error
  const [faceDetected, setFaceDetected] = useState(true);
  const [personCount, setPersonCount] = useState(1);
  const [phoneFlag, setPhoneFlag] = useState(false);

  const fireViolation = useCallback(
    (key, message) => {
      const now = Date.now();
      const last = lastViolationAtRef.current[key] || 0;
      if (now - last < VIOLATION_COOLDOWN_MS) return;
      lastViolationAtRef.current[key] = now;
      onViolation?.(message);
    },
    [onViolation]
  );

  // Acquire the webcam at standard 640x480 resolution
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);
        setCameraError(null);
      } catch (err) {
        if (cancelled) return;
        setCameraActive(false);
        setCameraError(
          err?.name === "NotAllowedError"
            ? "Camera permission denied. Please allow camera access to continue this proctored session."
            : "Could not access a camera on this device."
        );
        fireViolation("camera-denied", "Camera access unavailable — session flagged for manual review");
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [enabled, fireViolation]);

  // Load COCO-SSD model once
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setModelStatus("loading");

    loadModelWithTimeout(6000)
      .then((model) => {
        if (cancelled) return;
        modelRef.current = model;
        useFallbackRef.current = false;
        setModelStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("TensorFlow model loading fallback activated:", err?.message || err);
        useFallbackRef.current = true;
        setModelStatus("fallback");
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Detection loop with Mutex, IoU, 2-frame verification & 4s cooldown
  useEffect(() => {
    if (!enabled || !cameraActive) return;
    if (modelStatus !== "ready" && modelStatus !== "fallback") return;

    async function tick() {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      if (isInferringRef.current) return;

      // Acquire Mutex lock
      isInferringRef.current = true;

      try {
        let people = [];
        let phones = [];

        if (!useFallbackRef.current && modelRef.current) {
          try {
            const predictions = await modelRef.current.detect(video);
            people = predictions.filter((p) => p.class === PERSON_LABEL && p.score >= 0.50);
            phones = predictions.filter((p) => PHONE_LABELS.has(p.class) && p.score >= PHONE_SCORE_THRESHOLD);

            const canvas = canvasRef.current;
            if (canvas && video.videoWidth) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext("2d");
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              predictions.forEach((p) => {
                const isPhone = PHONE_LABELS.has(p.class);
                const isPerson = p.class === PERSON_LABEL;
                if (isPhone && p.score < PHONE_SCORE_THRESHOLD) return;
                if (isPerson && p.score < 0.45) return;
                if (!isPhone && !isPerson) return;
                const [x, y, w, h] = p.bbox;
                ctx.strokeStyle = isPhone ? "#ef4444" : "#22c55e";
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, w, h);
                ctx.fillStyle = isPhone ? "#ef4444" : "#22c55e";
                ctx.font = "14px monospace";
                ctx.fillText(`${p.class} ${Math.round(p.score * 100)}%`, x + 4, y > 18 ? y - 6 : y + 16);
              });
            }
          } catch (e) {
            console.warn("Detection frame error, switching to fallback:", e);
            useFallbackRef.current = true;
          }
        }

        if (useFallbackRef.current) {
          const res = detectPresenceFallback(video);
          people = res.personCount > 0 ? [{ class: PERSON_LABEL, score: 0.9 }] : [];
          phones = [];
        }

        // 1. Phone Detection with IoU consistency + 2-frame verification
        if (phones.length > 0) {
          const currentPhoneBox = phones[0].bbox;
          // Verify IoU consistency if previous frame also had a box
          const iou = prevPhoneBoxRef.current ? computeIoU(prevPhoneBoxRef.current, currentPhoneBox) : 1.0;
          
          if (iou >= 0.20 || !prevPhoneBoxRef.current) {
            phoneTicksRef.current += 1;
          } else {
            phoneTicksRef.current = 1;
          }
          prevPhoneBoxRef.current = currentPhoneBox;
        } else {
          phoneTicksRef.current = 0;
          prevPhoneBoxRef.current = null;
        }

        const confirmedPhone = phoneTicksRef.current >= PHONE_CONFIRM_TICKS;
        setPhoneFlag(confirmedPhone);
        if (confirmedPhone) {
          fireViolation("phone", "Mobile phone detected near workspace");
        }

        // 2. Multiple Persons Detection
        setPersonCount(people.length);
        if (people.length > 1) {
          fireViolation("multi-face", `Multiple people detected in frame (${people.length})`);
        }

        // 3. Person Absence Detection (No face)
        if (people.length === 0) {
          noFaceTicksRef.current += 1;
          if (noFaceTicksRef.current >= NO_FACE_GRACE_TICKS) {
            setFaceDetected(false);
            fireViolation("no-face", "No person detected in camera frame");
          }
        } else {
          noFaceTicksRef.current = 0;
          setFaceDetected(true);
        }
      } finally {
        // Release Mutex lock
        isInferringRef.current = false;
      }
    }

    tick();
    intervalRef.current = setInterval(tick, DETECTION_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [enabled, cameraActive, modelStatus, fireViolation]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  return {
    videoRef,
    canvasRef,
    cameraActive,
    cameraError,
    modelStatus,
    faceDetected,
    personCount,
    phoneFlag,
    stop,
  };
}
