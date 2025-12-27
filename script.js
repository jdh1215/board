const swordNames = { 0: "철덩이", 1: "녹슨 검", 5: "전투용 장검", 10: "빛나는 기사의 검", 12: "운명의 칼날", "white13": "백날개의 인도자", "black13": "흑날개의 약탈자" };

let gold = 10000;
let level = 0;
let branch = null;
let protectScrolls = 0;
let isEnhancing = false;

// --- SFX 함수 (사운드 파일 없이 소리 생성) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration, vol) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const sfx = {
    hammer: () => playSound(150, 'square', 0.2, 0.2), // 깡 (저음 박수형)
    success: () => { playSound(523, 'sine', 0.5, 0.1); playSound(659, 'sine', 0.6, 0.1); }, // 맑은 화음
    fail: () => playSound(100, 'sawtooth', 0.4, 0.2) // 파편 소리 (지직)
};

// --- 핵심 로직 ---
function updateUI() {
    const currentKey = branch && level >= 13 ? branch + level : level;
    document.getElementById('sword-img').src = `images/sword${currentKey}.png`;
    document.getElementById('sword-name').innerText = swordNames[currentKey] || `검 +${level}`;
    document.getElementById('level-tag').innerText = `+${level}`;
    document.querySelectorAll('.gold-val').forEach(el => el.innerText = gold.toLocaleString());
    document.getElementById('enhance-cost').innerText = (30 + (level * 60)).toLocaleString();
    document.getElementById('sell-price').innerText = Math.floor(20 * Math.pow(2.0, level)).toLocaleString();
    document.getElementById('protect-count').innerText = protectScrolls;

    if (level === 12 && !branch) {
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

    // 연출 시작
    document.getElementById('enhance-btn').disabled = true;
    document.getElementById('status-msg').classList.remove('hidden');
    
    // 망치질 3번 (깡! 깡! 깡!)
    for(let i=0; i<3; i++) {
        await new Promise(r => setTimeout(r, 500));
        sfx.hammer();
        document.getElementById('sword-wrapper').style.transform = "translateY(10px)";
        setTimeout(() => document.getElementById('sword-wrapper').style.transform = "translateY(0)", 100);
    }

    await new Promise(r => setTimeout(r, 500));
    
    // 결과 판정
    const success = Math.random() < (level < 10 ? 0.7 : 0.3);
    
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
                addLog("보호권으로 파괴를 면했습니다!");
            } else {
                level = 0; branch = null;
                showVFX('fail');
                addLog("무기가 파괴되었습니다...", "#e74c3c");
            }
        } else {
            showVFX('fail');
            addLog("강화 실패!");
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
        flash.style.opacity = "0.8";
        setTimeout(() => { sword.classList.remove('success-anim'); flash.style.opacity = "0"; }, 500);
    } else {
        body.classList.add('fail-shake');
        sword.classList.add('fail-blink');
        setTimeout(() => { body.classList.remove('fail-shake'); sword.classList.remove('fail-blink'); }, 500);
    }
}

function addLog(msg, color = "#fff") {
    const log = document.getElementById('log-content');
    log.innerHTML = `<div style="color:${color}">> ${msg}</div>` + log.innerHTML;
}

// 상점 및 이벤트 연결
document.getElementById('enhance-btn').onclick = startEnhance;
window.buyItem = (t, p) => { if(gold>=p){ gold-=p; if(t==='protect') protectScrolls++; updateUI(); } else alert("골드부족"); };
window.sellSword = () => { if(level===0)return; gold += Math.floor(20 * Math.pow(2.0, level)); level=0; branch=null; updateUI(); };
document.getElementById('white-btn').onclick = () => { branch='white'; level=13; updateUI(); };
document.getElementById('black-btn').onclick = () => { branch='black'; level=13; updateUI(); };
document.getElementById('go-shop-btn').onclick = () => document.getElementById('shop-ui').classList.remove('hidden');
document.getElementById('exit-shop-btn').onclick = () => document.getElementById('shop-ui').classList.add('hidden');

window.onload = () => {
    updateUI();
    setTimeout(() => document.getElementById('loading-spinner').classList.add('fade-out'), 1500);
};