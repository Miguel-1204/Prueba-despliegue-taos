import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

export const initMediaPipe = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
  );

  try {
    const landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU'
      },
      outputFaceBlendshapes: false,
      runningMode: 'VIDEO',
      numFaces: 1
    });
    return landmarker;
  } catch (gpuError) {
    console.warn('GPU FaceLandmarker falló, intentando CPU...', gpuError);
    const landmarkerCPU = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'CPU'
      },
      outputFaceBlendshapes: false,
      runningMode: 'VIDEO',
      numFaces: 1
    });
    return landmarkerCPU;
  }
};

export const detectForVideo = (faceLandmarker, video, startTimeMs) => {
  return faceLandmarker.detectForVideo(video, startTimeMs);
};
