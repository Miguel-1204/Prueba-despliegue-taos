import * as THREE from 'three';

export const initThreeRenderer = (canvas) => {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(
    canvas.clientWidth / -2,
    canvas.clientWidth / 2,
    canvas.clientHeight / 2,
    canvas.clientHeight / -2,
    0.1,
    1000
  );
  camera.position.set(0, 0, 100);
  camera.lookAt(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 100, 100);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffffff, 0.5);
  pointLight.position.set(0, -100, 100);
  scene.add(pointLight);

  return { renderer, scene, camera };
};

export const applyGroupOpacity = (group, opacity) => {
  if (!group) return;
  group.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material.transparent = opacity < 100;
      child.material.opacity = opacity / 100;
    }
  });
};

const disposeNode = (node) => {
  if (node.geometry) node.geometry.dispose();
  if (node.material) {
    if (Array.isArray(node.material)) {
      node.material.forEach((mat) => mat.dispose());
    } else {
      node.material.dispose();
    }
  }
};

export const loadAccessoryModel = async ({
  scene,
  glbPath,
  earringOpacity,
  setThreeReady,
  setLoadingModel,
  setModelError,
  leftEarringRef,
  rightEarringRef,
  threeScaleBaseRef
}) => {
  setLoadingModel(true);
  setModelError('');
  setThreeReady(false);

  if (leftEarringRef.current) {
    scene.remove(leftEarringRef.current);
    leftEarringRef.current.traverse(disposeNode);
    leftEarringRef.current = null;
  }
  if (rightEarringRef.current) {
    scene.remove(rightEarringRef.current);
    rightEarringRef.current.traverse(disposeNode);
    rightEarringRef.current = null;
  }

  try {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();

    await new Promise((resolve, reject) => {
      loader.load(
        glbPath,
        (gltf) => {
          const original = gltf.scene;
          const box = new THREE.Box3().setFromObject(original);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);

          original.position.sub(center);
          original.position.y -= size.y / 2;
          original.rotation.set(-Math.PI / 2, 0, 0);

          const leftGroup = new THREE.Group();
          leftGroup.add(original);

          const rightGroup = new THREE.Group();
          const mirrored = original.clone(true);
          mirrored.scale.x = -1;
          rightGroup.add(mirrored);

          const baseScale = 1 / maxDim;
          threeScaleBaseRef.current = baseScale;
          leftGroup.scale.setScalar(baseScale);
          rightGroup.scale.set(baseScale, baseScale, baseScale);

          scene.add(leftGroup);
          scene.add(rightGroup);

          leftEarringRef.current = leftGroup;
          rightEarringRef.current = rightGroup;

          applyGroupOpacity(leftGroup, earringOpacity);
          applyGroupOpacity(rightGroup, earringOpacity);

          setThreeReady(true);
          setLoadingModel(false);
          resolve();
        },
        undefined,
        (error) => reject(error)
      );
    });
  } catch (err) {
    console.error('Error cargando el modelo 3D:', err);
    setModelError('Error al cargar este modelo 3D.');
    setLoadingModel(false);
  }
};
