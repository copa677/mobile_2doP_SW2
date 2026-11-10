import { Paths, Directory, File, DownloadTask, DownloadProgress } from 'expo-file-system';
import { ModelInfo } from '@/types/reports';

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'qwen3-1.7b',
    name: 'Qwen3 1.7B Instruct (Q4_K_M)',
    sizeMB: 1050,
    recommended: true,
    filename: 'qwen3-1.7b-instruct-q4_k_m.gguf',
    downloadUrl: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
    description: 'Máximo equilibrio para Function Calling, encadenamiento de reportes y redacción de análisis ejecutivos.',
  },
  {
    id: 'qwen3-0.6b',
    name: 'Qwen3 0.6B Instruct (Q4_K_M)',
    sizeMB: 390,
    recommended: false,
    filename: 'qwen3-0.6b-instruct-q4_k_m.gguf',
    downloadUrl: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf',
    description: 'Modo ultraligero y rápido para teléfonos con poca memoria RAM o batería baja.',
  },
];

let activeDownloadTask: DownloadTask | null = null;

function getModelsDirectory(): Directory {
  const modelsDir = new Directory(Paths.document, 'models');
  if (!modelsDir.exists) {
    modelsDir.create();
  }
  return modelsDir;
}

export async function isModelDownloaded(filename: string): Promise<{ exists: boolean; sizeBytes: number; uri: string }> {
  try {
    const modelsDir = getModelsDirectory();
    const file = new File(modelsDir, filename);
    return {
      exists: file.exists,
      sizeBytes: file.exists ? (file.size ?? 0) : 0,
      uri: file.uri,
    };
  } catch (err) {
    return { exists: false, sizeBytes: 0, uri: '' };
  }
}

export function startModelDownload(
  model: ModelInfo,
  onProgress: (progress: { fraction: number; downloadedMB: number; totalMB: number }) => void
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const modelsDir = getModelsDirectory();
      const targetFile = new File(modelsDir, model.filename);

      activeDownloadTask = new DownloadTask(model.downloadUrl, targetFile);

      activeDownloadTask.addListener('progress', (downloadProgress: DownloadProgress) => {
        const total = downloadProgress.totalBytes;
        const current = downloadProgress.bytesWritten;
        const fraction = total > 0 ? current / total : 0;
        onProgress({
          fraction: Math.min(Math.max(fraction, 0), 1),
          downloadedMB: Math.round((current / (1024 * 1024)) * 10) / 10,
          totalMB: Math.round((total / (1024 * 1024)) * 10) / 10 || model.sizeMB,
        });
      });

      const resultFile = await activeDownloadTask.downloadAsync();
      activeDownloadTask = null;

      if (resultFile && resultFile.exists) {
        resolve(resultFile.uri);
      } else {
        reject(new Error('La descarga se canceló o no finalizó correctamente'));
      }
    } catch (e) {
      activeDownloadTask = null;
      reject(e);
    }
  });
}

export async function cancelCurrentDownload(): Promise<void> {
  if (activeDownloadTask) {
    try {
      activeDownloadTask.cancel();
    } catch (err) {
      console.warn('Error cancelando descarga:', err);
    }
    activeDownloadTask = null;
  }
}

export async function deleteModelFile(filename: string): Promise<void> {
  try {
    const modelsDir = getModelsDirectory();
    const file = new File(modelsDir, filename);
    if (file.exists) {
      file.delete();
    }
  } catch (err) {
    console.warn('Error eliminando archivo de modelo:', err);
  }
}
