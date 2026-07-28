import './style.css';

const worker = new Worker(
    new URL('./worker/inference.worker.ts', import.meta.url),
    { type: 'module' }
);

const fileInput = document.getElementById('file-input') as HTMLInputElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const resultEl = document.getElementById('result') as HTMLDivElement;
const previewImg = document.getElementById('preview') as HTMLImageElement;

worker.onmessage = (e) => {
    const { type, payload } = e.data;
    if (type === 'STATUS') {
        statusEl.textContent = payload;
        statusEl.style.color = '#333';
    }
    if (type === 'ERROR') {
        statusEl.textContent = 'Ошибка: ' + payload;
        statusEl.style.color = 'red';
    }
    if (type === 'RESULT') {
        statusEl.textContent = 'Готово!';
        statusEl.style.color = 'green';
        resultEl.innerHTML =
            '<h3>Параметры коррекции:</h3>' +
            '<p>Яркость: <b>' + payload.brightness.toFixed(3) + '</b></p>' +
            '<p>Контраст: <b>' + payload.contrast.toFixed(3) + '</b></p>' +
            '<p>Цветность: <b>' + payload.color.toFixed(3) + '</b></p>';
    }
};

window.addEventListener('DOMContentLoaded', () => {
    worker.postMessage({ type: 'INIT' });
});

fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    resultEl.innerHTML = '';
    statusEl.textContent = 'Чтение файла...';
    const reader = new FileReader();
    reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            previewImg.src = img.src;
            previewImg.style.display = 'block';
            const c = document.createElement('canvas');
            c.width = 224; c.height = 224;
            const ctx = c.getContext('2d')!;
            ctx.drawImage(img, 0, 0, 224, 224);
            const imageData = ctx.getImageData(0, 0, 224, 224);
            worker.postMessage({ type: 'RUN', payload: { imageData } }, [imageData.data.buffer]);
        };
        img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
});
