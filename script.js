const swordNames = {
    0: "철덩이", 1: "녹슨 검", 2: "잘 갈린 검", 3: "단검", 
    4: "일륜도", 5: "낫", 6: "양날검", 7: "신성한 검", 
    8: "번개의 검", 9: "우주의 검", 10: "용암의 검", 
    11: "얼음의 검", 12: "한계의 검", // 12강 이름 변경
    "white13": "백날개의 인도자", "black13": "흑날개의 약탈자",
    "white14": "순백의 대천사", "black14": "칠흑의 대악마",
    "white15": "★천상의 성검★", "black15": "★멸망의 마검★",
    "hidden": "★공허의 눈★"
};

let gold = 3000;
let level = 0;
let branch = null; // 'white' 또는 'black' 저장
let isHidden = false;
let protectScrolls = 0;

const swordImg = document.getElementById('sword-img');
const bgLayer = document.getElementById('bg-layer');
const swordNameText = document.getElementById('sword-name');
const levelTag = document.getElementById('level-tag');
const goldDisplays = document.querySelectorAll('.gold-val');
const logContent = document.getElementById('log-content');
const flashOverlay = document.getElementById('flash-overlay');
const enhanceBtn = document.getElementById('enhance-btn');
const branchUI = document.getElementById('branch-ui');

function getEconomy(lvl) {
    let cost = 30 + (lvl * 60);
    if (lvl >= 10) cost = 800 + Math.pow(lvl - 9, 2.8) * 400;
    let price = Math.floor(20 * Math.pow(2.0, (lvl === 0 ? 0 : lvl)));
    // 분기 이후 가격 대폭 상승
    if (branch) price = Math.floor(price * 1.5);
    return { cost: Math.floor(cost), price: Math.floor(price) };
}

function updateUI() {
    let currentKey = isHidden ? "hidden" : (branch && level >= 13 ? branch + level : level);
    const { cost, price } = getEconomy(level);

    if(swordImg) swordImg.src = `images/sword${currentKey}.png`;
    if(swordNameText) swordNameText.innerText = swordNames[currentKey] || "미지의 칼날";
    if(levelTag) levelTag.innerText = isHidden ? "HIDDEN" : `+${level}`;
    
    goldDisplays.forEach(el => el.innerText = gold.toLocaleString());
    document.getElementById('enhance-cost').innerText = cost.toLocaleString();
    document.getElementById('sell-price').innerText = price.toLocaleString();
    document.getElementById('protect-count').innerText = protectScrolls;
    
    // 버튼 비활성화 로직
    enhanceBtn.disabled = (gold < cost || level >= 15);

    // [중요] 12강 분기점 로직
    if (level === 12 && !branch) {
        enhanceBtn.classList.add('hidden');
        branchUI.classList.remove('hidden');
    } else {
        enhanceBtn.classList.remove('hidden');
        branchUI.classList.add('hidden');
    }

    // 최종 단계
    if (level >= 15) {
        enhanceBtn.innerText = "궁극의 단계 도달";
        enhanceBtn.disabled = true;
    } else {
        enhanceBtn.innerHTML = `강화하기 <span class="sub-text">(<span id="enhance-cost">${cost.toLocaleString()}</span> G)</span>`;
    }
}

function addLog(msg, color = "#ccc") {
    logContent.innerHTML = `<div style="color: ${color}">> ${msg}</div>` + logContent.innerHTML;
}

// 일반 강화 로직
function tryEnhance() {
    const { cost } = getEconomy(level);
    if (gold < cost) return;
    gold -= cost;

    // 히든 확률 (14강 -> 15강 시 0.1%)
    if (level === 14 && Math.random() < 0.001) {
        isHidden = true; level = 15;
        addLog("운명을 거스르는 자... 히든 검이 등장했습니다!", "#ff00ff");
        updateUI(); return;
    }

    let successRate = 100 - (level * 8);
    if (level >= 10) successRate = 20;
    if (level >= 13) successRate = 10;

    if (Math.random() * 100 < successRate) {
        level++;
        addLog(`강화 성공! (+${level})`, "#f1c40f");
        flashOverlay.style.opacity = '1';
        flashOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
        setTimeout(()=> flashOverlay.style.opacity = '0', 100);
    } else {
        if (level >= 10) {
            if (protectScrolls > 0) {
                protectScrolls--;
                addLog("보호권이 파괴를 막아냈습니다!", "#3498db");
            } else {
                level = 0; branch = null; isHidden = false;
                addLog("파괴되었습니다. 다시 처음부터 시작하십시오.", "#ff4444");
            }
        } else {
            addLog("강화에 실패했습니다.");
        }
    }
    updateUI();
}

// [특수 기능] 분기 선택 함수
function chooseBranch(type) {
    const branchCost = 5000; // 분기 선택 비용 (특수 재료비)
    if (gold < branchCost) {
        alert("재료를 구매할 골드가 부족합니다! (5,000 G 필요)");
        return;
    }

    if (confirm(`${type === 'white' ? '순백의 깃털' : '칠흑의 조각'}을 사용하여 진화하시겠습니까?`)) {
        gold -= branchCost;
        branch = type;
        level = 13; // 즉시 13강으로 진화
        addLog(`${type === 'white' ? '백날개' : '흑날개'}의 힘이 검에 깃들었습니다!`, type === 'white' ? '#fff' : '#a29bfe');
        updateUI();
    }
}

// 상점 함수들
window.buyItem = function(type, price) {
    if (gold < price) return alert("자금이 부족합니다.");
    gold -= price;
    if (type === 'protect') protectScrolls++;
    addLog("보호권을 획득했습니다.");
    updateUI();
}

window.sellSword = function() {
    const { price } = getEconomy(level);
    if (level === 0) return alert("철덩이는 팔 수 없습니다.");
    gold += price; level = 0; branch = null; isHidden = false;
    addLog(`무기를 팔아 ${price.toLocaleString()} G를 얻었습니다.`);
    updateUI();
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