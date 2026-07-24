import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const MAX_CACHE_SIZE = 1;
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

class ModelCacheManager {
  constructor() {
    this.cache = new Map(); // path -> Promise<gltf>
    this.loader = new GLTFLoader();
    try {
      // Configurar DRACOLoader para soportar glTFs con mallas Draco comprimidas.
      // Usamos el CDN oficial de decoders; si prefieres servir localmente coloca
      // los archivos decoder en /public/draco/ y ajusta setDecoderPath('/draco/').
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
      this.loader.setDRACOLoader(dracoLoader);
    } catch (e) {
      // No crítico: continuar sin soporte DRACO si falla la inicialización
      console.warn('No se pudo inicializar DRACOLoader:', e);
    }
  }

  /**
   * Carga un modelo GLTF y almacena en caché la Promesa de carga.
   * Si el modelo ya está cargado o en proceso de carga, devuelve la Promesa de la caché.
   * @param {string} path - La ruta o URL del modelo GLB.
   * @returns {Promise<object>} - Promesa que resuelve al objeto gltf original.
   */
  loadModel(path) {
    if (!path) return Promise.reject(new Error('Path is required'));

    const existing = this.cache.get(path);
    if (existing) {
      // Mover a final para marcar como recientemente usado
      this.cache.delete(path);
      this.cache.set(path, existing);
      if (isDev) {
        console.log(`Cache Size: ${this.cache.size} / ${MAX_CACHE_SIZE}`);
        console.log(`Modelo recuperado: ${path}`);
      }
      return existing;
    }

    const promise = new Promise((resolve, reject) => {
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
    this.evictIfNeeded();

    if (isDev) {
      console.log(`Cache Size: ${this.cache.size} / ${MAX_CACHE_SIZE}`);
      console.log(`Modelo agregado: ${path}`);
    }

    return promise;
  }

  evictIfNeeded() {
    while (this.cache.size > MAX_CACHE_SIZE) {
      const lruKey = this.cache.keys().next().value;
      const lruValue = this.cache.get(lruKey);
      if (lruKey && lruValue) {
        this.disposeCacheEntry(lruKey, lruValue);
        if (isDev) {
          console.log(`Modelo eliminado (LRU): ${lruKey}`);
          console.log(`Cache Size: ${this.cache.size} / ${MAX_CACHE_SIZE}`);
        }
      } else {
        this.cache.delete(lruKey);
      }
    }
  }

  disposeCacheEntry(path, promise) {
    this.cache.delete(path);
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
        // Ignorar errores al liberar modelos no cargados correctamente.
      });
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
    if (!material) return;

    const textureKeys = [
      'map',
      'normalMap',
      'roughnessMap',
      'metalnessMap',
      'emissiveMap',
      'alphaMap',
      'aoMap',
      'displacementMap',
      'lightMap',
      'specularMap',
      'envMap'
    ];

    textureKeys.forEach((key) => {
      const texture = material[key];
      if (texture && typeof texture.dispose === 'function') {
        texture.dispose();
      }
    });

    for (const key of Object.keys(material)) {
      const value = material[key];
      if (value && typeof value.dispose === 'function' && value.isTexture) {
        value.dispose();
      }
    }

    material.dispose?.();
  }
}

export const modelCache = new ModelCacheManager();
