import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { initMediaPipe, detectForVideo } from '../ar/mediaPipe';
import { startCamera, stopCamera } from '../ar/camera';
import { initThreeRenderer, loadAccessoryModel, applyGroupOpacity } from '../ar/threeRenderer';
import {
  computeEarAccessoryPose,
  smoothPosition,
  computeVelocity,
  computeSwing
} from '../ar/accessories';

export function useArSimulator({
  videoRef,
  canvasRef,
  selectedProduct,
  earringSizeOffset,
  earringOpacity,
  showMirrorEarring,
  earringAxisRotation,
  earringYAxisRotation,
  earringXAxisRotation,
  earringOffsetX,
  earringOffsetY,
  earringOffsetZ
}) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [threeInitialized, setThreeInitialized] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [modelError, setModelError] = useState('');
  const [threeReady, setThreeReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  const streamRef = useRef(null);
  const requestRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const threeRendererRef = useRef(null);
  const threeSceneRef = useRef(null);
  const threeCameraRef = useRef(null);
  const leftEarringRef = useRef(null);
  const rightEarringRef = useRef(null);
  const threeScaleBaseRef = useRef(1);
  const prevLeftAnchorRef = useRef(null);
  const prevRightAnchorRef = useRef(null);
  const smoothedLeftRef = useRef(null);
  const smoothedRightRef = useRef(null);
  const smoothedScaleRef = useRef(null);

  const applySmoothing = (prev, current, alpha = 0.4) => {
    if (!prev) return current;
    return {
      x: prev.x + alpha * (current.x - prev.x),
      y: prev.y + alpha * (current.y - prev.y)
    };
  };

  const initThree = useCallback(async () => {
    if (!canvasRef.current || threeRendererRef.current) return;

    const { renderer, scene, camera } = initThreeRenderer(canvasRef.current);
    threeRendererRef.current = renderer;
    threeSceneRef.current = scene;
    threeCameraRef.current = camera;
    setThreeInitialized(true);
  }, [canvasRef]);

  const initMediaPipeModel = useCallback(async () => {
    if (faceLandmarkerRef.current) return;
    setIsModelLoading(true);
    try {
      faceLandmarkerRef.current = await initMediaPipe();
      setModelLoaded(true);
    } catch (err) {
      console.error('Error al cargar MediaPipe:', err);
      setCameraError('No pudimos cargar el modelo de Inteligencia Artificial para el filtro.');
    } finally {
      setIsModelLoading(false);
    }
  }, []);

  const handleStartCamera = useCallback(async () => {
    const stream = await startCamera({
      videoRef,
      setCameraActive,
      setCameraError,
      initMediaPipe: initMediaPipeModel
    });
    if (stream) {
      streamRef.current = stream;
    }
  }, [videoRef, initMediaPipeModel]);

  const handleStopCamera = useCallback(() => {
    stopCamera({
      requestRef,
      streamRef,
      videoRef,
      setCameraActive,
      setFaceDetected,
      smoothedLeftRef,
      smoothedRightRef,
      smoothedScaleRef
    });
  }, [videoRef]);

  const handleLoadAccessory = useCallback(async (glbPath) => {
    if (!threeSceneRef.current) return;
    await loadAccessoryModel({
      scene: threeSceneRef.current,
      glbPath,
      earringOpacity,
      setThreeReady,
      setLoadingModel,
      setModelError,
      leftEarringRef,
      rightEarringRef,
      threeScaleBaseRef
    });
  }, [earringOpacity]);

  useEffect(() => {
    handleStartCamera();
    return () => {
      handleStopCamera();
    };
  }, [handleStartCamera, handleStopCamera]);

  useEffect(() => {
    if (cameraActive && modelLoaded) {
      initThree();
    }
  }, [cameraActive, modelLoaded, initThree]);

  useEffect(() => {
    if (threeInitialized && selectedProduct && selectedProduct.glbPath) {
      handleLoadAccessory(selectedProduct.glbPath);
    }
  }, [threeInitialized, selectedProduct, handleLoadAccessory]);

  useEffect(() => {
    if (threeReady) {
      applyGroupOpacity(leftEarringRef.current, earringOpacity);
      applyGroupOpacity(rightEarringRef.current, earringOpacity);
    }
  }, [earringOpacity, threeReady]);

  const renderLoop = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !faceLandmarkerRef.current) {
      requestRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (width > 0 && height > 0 && (canvas.width !== width || canvas.height !== height)) {
      canvas.width = width;
      canvas.height = height;
      if (threeRendererRef.current) {
        threeRendererRef.current.setSize(width, height, false);
      }
      if (threeCameraRef.current) {
        const cam = threeCameraRef.current;
        cam.left = -width / 2;
        cam.right = width / 2;
        cam.top = height / 2;
        cam.bottom = -height / 2;
        cam.updateProjectionMatrix();
      }
    }

    if (video.readyState >= 2) {
      const startTimeMs = performance.now();
      const results = detectForVideo(faceLandmarkerRef.current, video, startTimeMs);

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        setFaceDetected(true);
        const landmarks = results.faceLandmarks[0];

        const faceTop = landmarks[10];
        const faceBottom = landmarks[152];
        const dx = faceBottom.x - faceTop.x;
        const dy = faceBottom.y - faceTop.y;
        const faceHeightRaw = Math.sqrt(dx * dx + dy * dy);

        const currentScale = applySmoothing(
          { x: smoothedScaleRef.current, y: 0 },
          { x: faceHeightRaw, y: 0 },
          0.2
        ).x;
        smoothedScaleRef.current = currentScale;

        const baseSize = currentScale * Math.min(width, height) * 0.25;
        const finalEarringSize = Math.max(20, baseSize + earringSizeOffset);

        const {
          rawLeftLobe,
          rawRightLobe,
          leftEarVisible,
          rightEarVisible,
          earLineAngle,
          faceYaw,
          facePitch
        } = computeEarAccessoryPose({
          landmarks,
          width,
          height,
          currentScale
        });

        const smoothLeft = smoothPosition(smoothedLeftRef.current, rawLeftLobe, 0.35);
        const smoothRight = smoothPosition(smoothedRightRef.current, rawRightLobe, 0.35);
        smoothedLeftRef.current = smoothLeft;
        smoothedRightRef.current = smoothRight;

        const prevLeft = prevLeftAnchorRef.current;
        const prevRight = prevRightAnchorRef.current;
        const leftVelocity = computeVelocity(prevLeft, smoothLeft);
        const rightVelocity = computeVelocity(prevRight, smoothRight);

        const leftSwing = computeSwing(leftVelocity);
        const rightSwing = computeSwing(rightVelocity);

        const axisRotationRad = THREE.MathUtils.degToRad(earringAxisRotation);
        const axisYRotationRad = THREE.MathUtils.degToRad(earringYAxisRotation);
        const axisXRotationRad = THREE.MathUtils.degToRad(earringXAxisRotation);

        if (leftEarringRef.current) {
          leftEarringRef.current.position.set(
            smoothLeft.x - width / 2 + earringOffsetX + leftSwing.x,
            height / 2 - smoothLeft.y + earringOffsetY + leftSwing.y,
            smoothLeft.z + earringOffsetZ + leftSwing.z
          );
          leftEarringRef.current.rotation.set(
            axisXRotationRad,
            faceYaw + axisYRotationRad,
            earLineAngle + axisRotationRad
          );
          leftEarringRef.current.visible = showMirrorEarring && leftEarVisible;
          const scaleValue = threeScaleBaseRef.current * finalEarringSize;
          leftEarringRef.current.scale.set(scaleValue, scaleValue, scaleValue);
        }

        if (rightEarringRef.current) {
          rightEarringRef.current.position.set(
            smoothRight.x - width / 2 + earringOffsetX + rightSwing.x,
            height / 2 - smoothRight.y + earringOffsetY + rightSwing.y,
            smoothRight.z + earringOffsetZ + rightSwing.z
          );
          rightEarringRef.current.rotation.set(
            axisXRotationRad,
            faceYaw + axisYRotationRad,
            earLineAngle + axisRotationRad
          );
          rightEarringRef.current.visible = rightEarVisible;
          const scaleValue = threeScaleBaseRef.current * finalEarringSize;
          rightEarringRef.current.scale.set(scaleValue, scaleValue, scaleValue);
        }

        prevLeftAnchorRef.current = { ...smoothLeft };
        prevRightAnchorRef.current = { ...smoothRight };
      } else {
        setFaceDetected(false);
        if (leftEarringRef.current) leftEarringRef.current.visible = false;
        if (rightEarringRef.current) rightEarringRef.current.visible = false;
      }
    }

    if (threeRendererRef.current && threeSceneRef.current && threeCameraRef.current) {
      threeRendererRef.current.render(threeSceneRef.current, threeCameraRef.current);
    }

    requestRef.current = requestAnimationFrame(renderLoop);
  }, [
    videoRef,
    canvasRef,
    earringSizeOffset,
    earringOpacity,
    showMirrorEarring,
    earringAxisRotation,
    earringYAxisRotation,
    earringXAxisRotation,
    earringOffsetX,
    earringOffsetY,
    earringOffsetZ
  ]);

  useEffect(() => {
    if (cameraActive && modelLoaded) {
      requestRef.current = requestAnimationFrame(renderLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [cameraActive, modelLoaded, renderLoop]);

  return {
    cameraActive,
    cameraError,
    faceDetected,
    isModelLoading,
    modelLoaded,
    threeInitialized,
    loadingModel,
    modelError,
    threeReady,
    startCamera: handleStartCamera,
    stopCamera: handleStopCamera
  };
}
