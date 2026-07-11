import * as THREE from 'three';

/**
 * Centra, escala y configura un modelo para las orejas izquierda y derecha.
 * @param {THREE.Group} modelScene - La escena del modelo GLTF (ya clonada).
 * @returns {object} - Objeto con { leftModel, rightModel, scaleFactor }
 */
export function prepareModelClones(modelScene) {
  // 1. Calcular caja delimitadora y centro
  const box = new THREE.Box3().setFromObject(modelScene);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);

  // 2. Determinar factor de escala basado en altura objetivo (40 unidades)
  const heightVal = size.y > 0 ? size.y : (size.x > 0 ? size.x : 1);
  const scaleFactor = 40 / heightVal;

  // 3. Preparar modelo izquierdo (usamos el clon original y lo configuramos)
  const leftModel = modelScene;
  leftModel.position.set(-center.x, -box.max.y, -center.z);
  leftModel.rotation.set(0, Math.PI, 0);
  configureMeshProperties(leftModel);

  // 4. Preparar modelo derecho (clonamos para independizar el espejo)
  const rightModel = modelScene.clone(true);
  rightModel.position.set(-center.x, -box.max.y, -center.z);
  rightModel.rotation.set(0, Math.PI, 0);
  rightModel.scale.x *= -1; // Espejar horizontalmente para la oreja derecha
  configureMeshProperties(rightModel);

  return { leftModel, rightModel, scaleFactor };
}

/**
 * Configura las propiedades de renderizado de las mallas del modelo (sombras, profundidad)
 * @param {THREE.Object3D} model
 */
export function configureMeshProperties(model) {
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = false;
      if (child.material) {
        child.material.depthWrite = true;
        child.material.depthTest = true;
        child.material.needsUpdate = true;
      }
    }
  });
}

/**
 * Crea un cubo marcador de posición (fallback si falla la carga del modelo)
 * @param {number} colorVal - Color hexadecimal del cubo.
 * @returns {THREE.Mesh}
 */
export function createPlaceholderCube(colorVal) {
  const geometry = new THREE.BoxGeometry(20, 20, 20);
  const material = new THREE.MeshStandardMaterial({
    color: colorVal,
    metalness: 0.8,
    roughness: 0.2,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.isPlaceholder = true; // Etiqueta para saber que debe liberarse manualmente
  return mesh;
}
