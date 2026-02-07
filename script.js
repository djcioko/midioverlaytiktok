const canvas = new fabric.Canvas('mainCanvas');
let webcamObject = null;

// --- MEMORIE LAYOUT ---
function saveLayout() {
    localStorage.setItem('tiktok_layout_config', JSON.stringify(canvas.toJSON()));
}

function loadLayout() {
    const saved = localStorage.getItem('tiktok_layout_config');
    if (saved) {
        canvas.loadFromJSON(saved, () => {
            canvas.renderAll();
            updateLayerList();
        });
    }
}

// --- MIDI & KEYBOARD ---
if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(onMIDISuccess, () => {
        document.getElementById('midiStatus').innerHTML = "MIDI Indisponibil";
    });
}

function onMIDISuccess(midiAccess) {
    document.getElementById('midiStatus').innerHTML = "✅ NOVATION CONECTAT";
    document.getElementById('midiStatus').classList.add('status-online');
    for (var input of midiAccess.inputs.values()) {
        input.onmidimessage = (msg) => {
            const [status, note, velocity] = msg.data;
            if (velocity > 0) triggerSlot(note - 35); 
        };
    }
}

window.addEventListener('keydown', (e) => {
    if (!isNaN(e.key)) triggerSlot(parseInt(e.key));
});

function triggerSlot(slotIndex) {
    const objects = canvas.getObjects();
    const target = objects[slotIndex - 1];
    if (target) {
        target.visible = !target.visible;
        // Efect animație la apariție
        if(target.visible) {
            target.set('opacity', 0);
            target.animate('opacity', 1, { duration: 200, onChange: canvas.renderAll.bind(canvas) });
        }
        canvas.renderAll();
        updateLayerList();
    }
}

// --- CAMERA AI (SHATTER EFFECT) ---
async function initCamera() {
    const selfie = new SelfieSegmentation({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
    });

    selfie.setOptions({ modelSelection: 1 });
    selfie.onResults((results) => {
        // Aici se procesează efectul Shatter pe masca AI
        // Momentan desenăm decupajul curat
        canvas.renderAll();
    });

    const videoElement = document.createElement('video');
    const camera = new Camera(videoElement, {
        onFrame: async () => { await selfie.send({image: videoElement}); },
        width: 640, height: 480
    });
    camera.start();
    alert("Camera a fost inițializată!");
}

// --- GESTIUNE STRATURI ---
document.getElementById('fileInput').onchange = function(e) {
    const files = e.target.files;
    for (let file of files) {
        const url = URL.createObjectURL(file);
        fabric.Image.fromURL(url, (img) => {
            img.scaleToWidth(200);
            canvas.add(img);
            updateLayerList();
            saveLayout();
        });
    }
};

function updateLayerList() {
    const list = document.getElementById('layerList');
    list.innerHTML = canvas.getObjects().map((obj, i) => 
        `<div>Slot ${i+1}: ${obj.visible ? '👁️ Activ' : '🌑 Ascuns'}</div>`
    ).join('');
}

function clearLayout() {
    if(confirm("Ștergi tot?")) {
        localStorage.removeItem('tiktok_layout_config');
        location.reload();
    }
}

canvas.on('object:modified', saveLayout);
loadLayout();
