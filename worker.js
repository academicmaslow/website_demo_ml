importScripts('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/ort.min.js');

ort.env.wasm.numThreads = 1;
ort.env.wasm.simd = false;

ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';

let session = null;

function preprocessImage(imageData) {
    const width = 224;
    const height = 224;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];
    const out = new Float32Array(3 * width * height);
    for (let i = 0; i < width * height; i++) {
        out[i] = (pixels[i * 4] / 255.0 - mean[0]) / std[0];
        out[i + width * height] = (pixels[i * 4 + 1] / 255.0 - mean[1]) / std[1];
        out[i + 2 * width * height] = (pixels[i * 4 + 2] / 255.0 - mean[2]) / std[2];
    }
    return out;
}

self.onmessage = async (e) => {
    const { type, payload } = e.data;

    if (type === 'INIT') {
        try {
            self.postMessage({ type: 'STATUS', payload: 'Загрузка модели...' });
            
            const response = await fetch('./models/mobilenet_v3_small_enhancer.onnx');
            if (!response.ok) {
                throw new Error(`HTTP ошибка: ${response.status} ${response.statusText}`);
            }
            
            const modelBuffer = await response.arrayBuffer();
            session = await ort.InferenceSession.create(modelBuffer);
            
            self.postMessage({ type: 'STATUS', payload: 'Модель загружена!' });
        } catch (err) {
            self.postMessage({ type: 'ERROR', payload: String(err) });
        }
    }

    if (type === 'RUN' && session) {
        try {
            self.postMessage({ type: 'STATUS', payload: 'Анализ...' });
            const input = preprocessImage(payload.imageData);
            const tensor = new ort.Tensor('float32', input, [1, 3, 224, 224]);
            const results = await session.run({ [session.inputNames[0]]: tensor });
            const out = results[session.outputNames[0]].data;
            self.postMessage({
                type: 'RESULT',
                payload: { brightness: out[0], contrast: out[1], color: out[2] }
            });
        } catch (err) {
            self.postMessage({ type: 'ERROR', payload: String(err) });
        }
    }
};