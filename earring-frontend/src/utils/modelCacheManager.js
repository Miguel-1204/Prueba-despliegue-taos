import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

class ModelCacheManager {
  constructor() {
    this.cache = new Map(); // path -> Promise<gltf>
    this.loader = new GLTFLoader();
  }

  /**
   * Carga un modelo GLTF y almacena en caché la Promesa de carga.
   * Si el modelo ya está cargado o en proceso de carga, devuelve la Promesa de la caché.
   * @param {string} path - La ruta o URL del modelo GLB.
   * @returns {Promise<object>} - Promesa que resuelve al objeto gltf original.
   */
  loadModel(path) {
    if (!path) return Promise.reject(new Error('Path is required'));

    let promise = this.cache.get(path);
    if (!promise) {
      promise = new Promise((resolve, reject) => {
        this.loader.load(
          path,
          (gltf) => {
            resolve(gltf);
          },
          undefined,
          (error) => {
            reject(error);
          }
        );
      });
      this.cache.set(path, promise);
    }
    return promise;
  }

  /**
   * Libera todos los recursos WebGL (geometrías, materiales y texturas) de la caché.
   */
  clear() {
    for (const promise of this.cache.values()) {
      promise
        .then((gltf) => {
          if (gltf && gltf.scene) {
            gltf.scene.traverse((child) => {
              if (child.isMesh) {
                child.geometry?.dispose();
                if (Array.isArray(child.material)) {
                  child.material.forEach((mat) => this.disposeMaterial(mat));
                } else if (child.material) {
                  this.disposeMaterial(child.material);
                }
              }
            });
          }
        })
        .catch(() => {
          // Ignorar errores para modelos que no se pudieron cargar
        });
    }
    this.cache.clear();
  }

  disposeMaterial(material) {
    // Liberar texturas asociadas al material
    for (const key of Object.keys(material)) {
      const value = material[key];
      if (value && typeof value.dispose === 'function' && value.isTexture) {
        value.dispose();
      }
    }
    material.dispose();
  }
}

export const modelCache = new ModelCacheManager();
