const swordNames = { 
    0: "철덩이", 1: "녹슨 검", 5: "전투용 장검", 10: "빛나는 기사의 검", 12: "운명의 칼날", 
    "13_1": "백날개의 인도자", "14_1": "성스러운 빛의 검", "15_1": "★천상의 성검★",
    "13_2": "흑날개의 약탈자", "14_2": "심연의 그림자", "15_2": "★멸망의 마검★"
};

let gold = 10000;
let level = 0;
let branchType = ""; // "1" 은 백날개, "2" 는 흑날개
let protectScrolls = 0;
let charms = 0;
let isEnhancing = false;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration, vol) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}

const sfx = {
    hammer: () => playSound(140, 'square', 0.15, 0.15),
    success: () => { playSound(523, 'sine', 0.4, 0.1); playSound(659, 'sine', 0.5, 0.1); },
    fail: () => playSound(80, 'sawtooth', 0.4, 0.2)
};

function updateUI() {
    // 이미지 경로 및 이름 결정 로직 (수정됨)
    let currentKey = level;
    if (level >= 13 && branchType !== "") {
        currentKey = `${level}_${branchType}`; // 예: 13_1, 14_1...
    }

    const imgEl = document.getElementById('sword-img');
    imgEl.src = `images/sword${currentKey}.png`; // images/sword13_1.png 형태
    imgEl.onerror = () => { imgEl.style.opacity = '0.3'; };
    imgEl.onload = () => { imgEl.style.opacity = '1'; };

    document.getElementById('sword-name').innerText = swordNames[currentKey] || `검 +${level}`;
    document.getElementById('level-tag').innerText = `+${level}`;
    document.querySelectorAll('.gold-val').forEach(el => el.innerText = gold.toLocaleString());
    document.getElementById('enhance-cost').innerText = (30 + (level * 60)).toLocaleString();
    document.getElementById('sell-price').innerText = Math.floor(20 * Math.pow(2.0, level)).toLocaleString();
    document.getElementById('protect-count').innerText = protectScrolls;
    document.getElementById('charm-count').innerText = charms;

    if (level === 12 && branchType === "") {
        document.getElementById('enhance-btn').classList.add('hidden');
        document.getElementById('branch-ui').classList.remove('hidden');
    } else {
        document.getElementById('enhance-btn').classList.remove('hidden');
        document.getElementById('branch-ui').classList.add('hidden');
    }
}

async function startEnhance() {
    if (isEnhancing) return;
    const cost = 30 + (level * 60);
    if (gold < cost) return alert("골드가 부족합니다!");

    isEnhancing = true;
    gold -= cost;
    updateUI();

    document.getElementById('enhance-btn').disabled = true;
    document.getElementById('status-msg').classList.remove('hidden');
    
    for(let i=0; i<3; i++) {
        await new Promise(r => setTimeout(r, 600));
        sfx.hammer();
        document.getElementById('sword-wrapper').style.transform = "translateY(15px)";
        setTimeout(() => document.getElementById('sword-wrapper').style.transform = "translateY(0)", 100);
    }

    await new Promise(r => setTimeout(r, 600));
    
    let baseRate = (level < 10) ? 0.65 : 0.25;
    if (level >= 13) baseRate = 0.1;
    
    let bonusRate = 0;
    if (charms > 0) {
        charms--;
        bonusRate = 0.15;
        addLog("🍀 행운의 부적 사용! 성공 확률 증가.");
    }

    const success = Math.random() < (baseRate + bonusRate);
    
    if (success) {
        level++;
        sfx.success();
        showVFX('success');
        addLog(`강화 성공! (+${level})`, "#f1c40f");
    } else {
        sfx.fail();
        if (level >= 10) {
            if (protectScrolls > 0) {
                protectScrolls--;
                addLog("📜 보호권으로 무기 파괴를 막았습니다!");
            } else {
                level = 0; branchType = "";
                showVFX('fail');
                addLog("무기가 파괴되었습니다...", "#e74c3c");
            }
        } else {
            showVFX('fail');
            addLog("강화에 실패했습니다.");
        }
    }

    document.getElementById('status-msg').classList.add('hidden');
    document.getElementById('enhance-btn').disabled = false;
    isEnhancing = false;
    updateUI();
}

function showVFX(type) {
    const sword = document.getElementById('sword-wrapper');
    const flash = document.getElementById('flash-overlay');
    const body = document.getElementById('body');

    if (type === 'success') {
        sword.classList.add('success-anim');
        flash.style.opacity = "0.7";
        setTimeout(() => { sword.classList.remove('success-anim'); flash.style.opacity = "0"; }, 500);
    } else {
        body.classList.add('fail-shake');
        setTimeout(() => body.classList.remove('fail-shake'), 400);
    }
}

function addLog(msg, color = "#fff") {
    const log = document.getElementById('log-content');
    log.innerHTML = `<div style="color:${color}">> ${msg}</div>` + log.innerHTML;
}

window.buyItem = (type, price) => {
    if(gold >= price) {
        gold -= price;
        if(type === 'protect') protectScrolls++;
        if(type === 'charm') charms++;
        updateUI();
    } else alert("골드가 부족합니다.");
};

window.sellSword = () => {
    if(level === 0) return alert("기본 무기는 팔 수 없습니다.");
    const price = Math.floor(20 * Math.pow(2.0, level));
    gold += price; level = 0; branchType = "";
    addLog(`무기를 ${price.toLocaleString()}G에 판매했습니다.`);
    updateUI();
};

document.getElementById('enhance-btn').onclick = startEnhance;
document.getElementById('white-btn').onclick = () => { branchType = "1"; level = 13; updateUI(); };
document.getElementById('black-btn').onclick = () => { branchType = "2"; level = 13; updateUI(); };
document.getElementById('go-shop-btn').onclick = () => document.getElementById('shop-ui').classList.remove('hidden');
document.getElementById('exit-shop-btn').onclick = () => document.getElementById('shop-ui').classList.add('hidden');

window.onload = () => {
    updateUI();
    setTimeout(() => document.getElementById('loading-spinner').classList.add('fade-out'), 1500);
};