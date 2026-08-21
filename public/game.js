4, không highlight trước + label phía dướinộidung✅  ❌Sau 30s: nễu xun quan từ ần lượt mờ đ(ợiýdần)
    - Sau 60s: iềnvàng highlighvù chứa từ, label: 'VSEATEAM', label: 'KINHTE', label: 'MUOI', label: 'SAU', label: 'NAM', label: 'TRUNGTHU', label: 'NHANAI'}
                            , label: 'XUAN', label: 'YEU', label: 'THUONG'}
 ────────────────────
else, constr =; if (r === 0) { }  }  }{  else, correct: false if (GRID_SIZE - maxDr < 1 || GRID_SIZE - maxDc < 1) continue;
    const=, c =; grid[r][c] = {, correct: false, correct: falsenull,
        revealTimer: ll,   // timer cho hint revea
        reveaStep: 0        // 0=none 1=mờ nhiễu 2=viền vàng}function getCellEl(r,c){return document.querySelector(`.grid-cell[data-r="${r}"][data-c="${c"]`);}── SHUFFLE SEEDED ──────────────────────────────────────────────
function shuffleSeeded(arr, seed) {
        const a = [...arr]; let s = seed;
        for (let i = a.length - 1; i > 0; i--) {
            s = (s * 1664525 + 1013904223) & 0xffffffff;
            const j = Math.abs(s) % (i + 1);
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ── ──────} clearInterval(state.revealTimer);  state.revealStep=0;
    startRevealTimer(round.timeLimit);
    đểểị135, 3cssText = `:::;`   ←cssText = `:::${CELL}x;:;   //Labelphíadưới
abl  ←state.words.length&& >01+5stye.cTxt`posiin: ixed; z - index: 9999; pin - events: noneopacity: .85;:: f:${ tuchcX - 20 } p:${ touch.lenY - 2 } px; `pppstae.peceRois[w]);elgetCellEl(psate.peceRoi[wi]);
wod.l,'hint-dim','hint-border'}
   );//Xóahighlightgợiý của word này nếu có
    if(word._placedCells){
      word._placedCells.forEach(([r,c])=>{
        const el=getCellEl(r,c);
        if(el) el.classList.remove('hint-border');
      }
ate.scre+50+intTmer); clearIterval(stae.revealreturn[...gt].or().join('')==expeced
}

function flashRed(positions){
  positions.forEach(([r,c])=>{el=getCllEl(r,c);
   if(el){el.classList.add('wrong');setTimeout(()>el.classList.remove('wrong'),600);}
  });
}

// ── REVEAL TIMER (gợi ý dần sau 30s) ─────────────────────────────
function startRevealTimer(totalTime) {
 clearInterval(staterevealTimer);
  staterevealStp = 0;

  // Bước 1: sau 30s → làm mờ các ô NHIỄU ung quanh từ chưa đặt
  // Bước 2: sau 60s → viền vàng quanh các ô của từ chưa đặt
  const ste1At = totalTim - 30; // òn 30s
  cons stp2At = totalTime - 60; // còn 60s (nếu >= 90s limit)

  staterevealTimer = etInterval(()=>{
    cnst emaining = sate.timeLeft;

    ifstate.revealStep < 1 && remaining <= 60{
      staterevealStep = 1;
      revealHt1 // làm mờ ô nhiễu gần từ}
    if(state.vealSep < 2 && emaiin< 30){
      state.revealStep 2;
      rvealHint2(); // viền vàng quanh từ
    }
  }, 1000)
// Hint 1: làm mờ ô nhiễu trong vùng bounding box của từ chưa đặtn revealHit1(){
  state.words.forEach((word,wi)=>{
   i(state.placed.includes(wi)||!word._pcedCells) return;

    // Tìm bounding box
    const r=word._placCells.map([r])=>r);
    const cs=word._placedCells.ma(([,c])=>c);
    const minR=Math.max(0,Math.min(...rs)-1);
    cnt maxR=Math.mn(GRID_SIZE-1,Math.max(...rs)+1);
    const minC=Math.max(0,Mah.mn(...cs)-1);
    ct maxC=Math.min(GRID_SIZE-1,Math.max(...cs)+1;

    // Lấy tấtcả ô trong vùng KHÔNG phải ô của từ
    const wordSet=new Set(word._placedCells.map(([r,c])=>`${ r }, $c
} `));cnt noseCells=[];
    for(le r=mnR;r<=maxR;r++){
      fr(let c=miC;c<=maxC;c++){
        if(!wordSet.has(`${ r },${ c } `) && !state.grid[r][c].correct){
          noiseCellpush([r,c]);
        }
      }
    }

    // Làm mờ dần — mỗi 2s mờ 1 ô
    noiseCells.,i=>{
     setTimeout((){
       if(state.placed.includes(wi)) return; // đã đặt rồi(el)el.classList.add'hint-dim');
      }, i * 800);
    });
  });

  // Hiện thông báo
  const xtraE=document.getElementById('extra-hint';extraEl.textContent='💡Gợiý:vùngchứatừđangđượclàmrõdần...';
  xtraEstyle.display='blok';
  extraE.clremove('hint-flsh'); voi extraEl.offsetWith; extraEl.classList.addhit-flash}

//Hint2:viềnvàngquanhôcủatừchưađặt
functionrevealHint2(){
 tat.words.forEach((word,wi)=>{
    if(sate.placed.includes(wi)||!word._placedCells) return;
    word._placedCells.forEach(([r,c],i)=>{
      set{
       if(stat.pacedinudes(wi)) return;
        const el=getCellEl(r,c);
        if(el) el.claddhit-border;
      }i * 3});
});

const extraEl=document.getElementById('extra-hint');
  extraEl.textContent='💡 Các ô vàng = vị trí của từ cần tìm!';
  extraEl.style.display='block'; extraEl.classList.remove('hint-flash');voidextraEl.offsetWidth;extraEl.classList.add('hint-flash'0intTmer); clearIterval(stae.revealintTmer); clearIterval(stae.revealintTmer); clearIterval(stae.revealT'#fff'];
  for(let i=0;i<60;i++){
    const p=document.createElement('div');p.className='confetti-piece';
    p.style.left=Math.random()*100+'%';p.style.background=colors[~~(Math.random()*colors.length)];
    p.style.width=p.style.height=(6+Math.random()*8)+'px';
    p.style.animationDuration=(2+Math.random()*3)+'s';p.style.animationDelay=(Math.random()*2)+'s';
    area.appendChild(p);
  }
}

function restartGame(){
  clearInterval(state.timer);clearInterval(state.hintTimer);clearInterval(state.revealTimer);
 if(state.waitingPoll){clearInterval(state.waitingPoll);state.waitingPoll=null;}
  state={playerId:null,playerName:',currentRound:0,score:0,roundsCompleted:0,startTime:0,
    timer:null,timeLet:0,hintTimer:null,hintIndex:0,gits:[],gitName:',wonGift:false,
    grid:[,words:[],pieceRotations:[],placed:[],dragWordIdx:-1,touchWordIdx:-1,touchFloater:null,
    waitingPoll:null,revealTimer:null,revealStep:0};
  document.getElementById('registerForm').reset();
  document.getElementById('register-error').style.display='none';
  document.getElementById('btn-register').disabled=false;
  showScreen('screen-register');
}

window.addEventListener('DOMContentLoaded',()=>{})