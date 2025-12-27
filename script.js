const swordNames = {
    0: "철덩이", 1: "녹슨 검", 2: "잘 갈린 검", 3: "단검", 
    4: "일륜도", 5: "낫", 6: "양날검", 7: "자연의 검", 
    8: "번개의 검", 9: "우주의 검", 10: "얼음의 검", 
    11: "용암의 검", 12: "엑스칼리버", 
    "white13": "백날개의 인도자", "black13": "흑날개의 약탈자",
    "white14": "순백의 대천사", "black14": "칠흑의 대악마",
    "white15": "★천상의 성검★", "black15": "★멸망의 마검★",
    "hidden": "★공허의 눈★"
};

let gold = 10000; // 시작 골드 1만G 설정 완료
let level = 0;
let branch = null;
let isHidden = false;
let protectScrolls = 0;

// DOM 캐싱
const swordImg = document.getElementById('sword-img');
const bgLayer = document.getElementById('bg-layer');
const swordNameText = document.getElementById('sword-name');
const levelTag = document.getElementById('level-tag');
const goldDisplays = document.querySelectorAll('.gold-val');
const logContent = document.getElementById('log-content');
const flashOverlay = document.getElementById('flash-overlay');
const enhanceBtn = document.getElementById('enhance-btn');
const branchUI = document.getElementById('branch-ui');

// 경제 밸런스 로직 (강화비 감소 반영)
function getEconomy(lvl) {
    // 0~9강까지는 매우 저렴하게, 10강부터 상승
    let cost = 30 + (lvl * 50); 
    if (lvl >= 10) cost = 800 + Math.pow(lvl - 9, 2.8) * 200;
    
    // 판매가는 레벨에 따라 지수적 상승
    let price = Math.floor(20 * Math.pow(2.0, (lvl === 0 ? 0 : lvl)));
    if (branch) price = Math.floor(price * 2);
    
    return { cost: Math.floor(cost), price: Math.floor(price) };
}

function updateUI() {
    let currentKey = isHidden ? "hidden" : (branch && level >= 13 ? branch + level : level);
    const { cost, price } = getEconomy(level);

    // 이미지 파일이 png인지 jpg인지 꼭 확인하세요!
    if(swordImg) swordImg.src = `images/sword${currentKey}.png`; 
    if(swordNameText) swordNameText.innerText = swordNames[currentKey] || "미지의 무기";
    if(levelTag) levelTag.innerText = isHidden ? "HIDDEN" : `+${level}`;
    
    goldDisplays.forEach(el => el.innerText = gold.toLocaleString());
    
    // 안전한 요소 접근 (ID가 없을 경우 대비)
    const costEl = document.getElementById('enhance-cost');
    const priceEl = document.getElementById('sell-price');
    const protEl = document.getElementById('protect-count');
    
    if(costEl) costEl.innerText = cost.toLocaleString();
    if(priceEl) priceEl.innerText = price.toLocaleString();
    if(protEl) protEl.innerText = protectScrolls;
    
    enhanceBtn.disabled = (gold < cost || level >= 15);

    if (level === 12 && !branch) {
        enhanceBtn.classList.add('hidden');
        branchUI.classList.remove('hidden');
    } else {
        enhanceBtn.classList.remove('hidden');
        branchUI.classList.add('hidden');
    }

    if (level >= 15) enhanceBtn.innerText = "최종 단계 도달";
}

function addLog(msg, color = "#ccc") {
    logContent.innerHTML = `<div style="color: ${color}">> ${msg}</div>` + logContent.innerHTML;
}

function tryEnhance() {
    const { cost } = getEconomy(level);
    if (gold < cost) return;
    gold -= cost;

    if (level === 14 && Math.random() < 0.001) {
        isHidden = true; level = 15;
        addLog("전설을 넘어선 공허의 힘이 깨어났습니다!", "#ff00ff");
        updateUI(); return;
    }

    let successRate = Math.max(7, 100 - (level * 8));
    if (level >= 10) successRate = 20;
    if (level >= 13) successRate = 10;

    if (Math.random() * 100 < successRate) {
        level++;
        addLog(`강화 성공! (+${level})`, "#f1c40f");
        showFlash('white');
    } else {
        showFlash('rgba(255,0,0,0.3)');
        if (level >= 10) {
            if (protectScrolls > 0) {
                protectScrolls--;
                addLog("보호권이 무기를 지켜냈습니다!", "#3498db");
            } else {
                level = 0; branch = null; isHidden = false;
                addLog("무기가 파괴되었습니다!", "#ff4444");
                document.body.classList.add('shake');
                setTimeout(()=> document.body.classList.remove('shake'), 300);
            }
        } else {
            addLog("강화 실패. 다행히 무사합니다.");
        }
    }
    updateUI();
}

function showFlash(color) {
    flashOverlay.style.opacity = '1';
    flashOverlay.style.backgroundColor = color;
    setTimeout(()=> flashOverlay.style.opacity = '0', 100);
}

function chooseBranch(type) {
    const branchCost = 5000;
    if (gold < branchCost) return alert("진화 재료비(5,000G)가 부족합니다!");

    if (confirm(`${type === 'white' ? '백날개' : '흑날개'}의 운명을 선택하시겠습니까?`)) {
        gold -= branchCost;
        branch = type;
        level = 13;
        addLog(`진화 성공! ${swordNames[branch+level]}이(가) 탄생했습니다.`, type === 'white' ? '#fff' : '#a29bfe');
        updateUI();
    }
}

// 전역 함수로 설정 (HTML의 onclick에서 호출 가능하게)
window.buyItem = function(type, price) {
    if (gold < price) return alert("골드가 부족합니다.");
    gold -= price;
    if (type === 'protect') protectScrolls++;
    addLog("보호권을 구매했습니다.");
    updateUI();
}

window.sellSword = function() {
    const { price } = getEconomy(level);
    if (level === 0) return alert("기본 무기는 팔 수 없습니다.");
    if (confirm(`${price.toLocaleString()} G에 판매하시겠습니까?`)) {
        gold += price; level = 0; branch = null; isHidden = false;
        addLog("무기를 판매했습니다.");
        updateUI();
    }
}

// 이벤트 리스너
enhanceBtn.addEventListener('click', tryEnhance);
document.getElementById('white-btn').addEventListener('click', () => chooseBranch('white'));
document.getElementById('black-btn').addEventListener('click', () => chooseBranch('black'));
document.getElementById('go-shop-btn').addEventListener('click', () => {
    document.getElementById('main-ui').classList.add('hidden');
    document.getElementById('shop-ui').classList.remove('hidden');
    bgLayer.style.opacity = "0";
});
document.getElementById('exit-shop-btn').addEventListener('click', () => {
    document.getElementById('shop-ui').classList.add('hidden');
    document.getElementById('main-ui').classList.remove('hidden');
    bgLayer.style.opacity = "1";
});

updateUI();