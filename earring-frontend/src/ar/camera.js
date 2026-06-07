export const startCamera = async ({
  videoRef,
  setCameraActive,
  setCameraError,
  initMediaPipe
}) => {
  setCameraError('');
  try {
    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }

    setCameraActive(true);
    await initMediaPipe();
    return stream;
  } catch (err) {
    console.error('Error al acceder a la cámara:', err);
    setCameraError('No pudimos acceder a tu cámara. Asegúrate de otorgar permisos o intenta en otro navegador.');
    setCameraActive(false);
    return null;
  }
};

export const stopCamera = ({
  requestRef,
  streamRef,
  videoRef,
  setCameraActive,
  setFaceDetected,
  smoothedLeftRef,
  smoothedRightRef,
  smoothedScaleRef
}) => {
  if (requestRef.current) {
    cancelAnimationFrame(requestRef.current);
  }
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }
  if (videoRef.current) {
    videoRef.current.srcObject = null;
  }
  setCameraActive(false);
  setFaceDetected(false);
  smoothedLeftRef.current = null;
  smoothedRightRef.current = null;
  smoothedScaleRef.current = null;
};
