/* התנהגות האתר — מתוך קובץ העיצוב המקורי, עם הגנות לעמודים בלי פתיחה */
(function(){
  var root=document.documentElement, page=document.getElementById('ct-page');
  if(!page) return;
  var motion=root.classList.contains('ct-motion');
  var desktop=matchMedia('(min-width:1100px)');
  var finePointer=matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- סליידר: כל השכבות מתחלפות יחד ---------- */
  var groups=[].slice.call(page.querySelectorAll('.ct-slides'));
  var total=groups.length?groups[0].children.length:0, cur=0, timer;
  var curEl=page.querySelector('.ct-counter__cur'), fill=page.querySelector('.ct-counter__fill');
  function show(i){
    groups.forEach(function(g){[].forEach.call(g.children,function(s,k){s.classList.toggle('is-active',k===i)})});
    if(curEl) curEl.textContent=('0'+(i+1)).slice(-2);
    if(fill){fill.style.animation='none';void fill.offsetWidth;fill.style.animation='';}
  }
  function next(){cur=(cur+1)%total;show(cur)}
  if(total) show(0);
  function startTimer(){if(!total) return;clearInterval(timer);timer=setInterval(next,6000)}
  document.addEventListener('visibilitychange',function(){document.hidden?clearInterval(timer):startTimer()});

  /* ---------- המלצות: סליידר + חלון חד מיושר לרקע ---------- */
  var tmBlock=page.querySelector('.ct-tm__block');
  if(tmBlock){
    var tmCards=[].slice.call(tmBlock.querySelectorAll('.ct-tm-card'));
    var tmTrack=tmBlock.querySelector('.ct-tm__track');
    var tmFill=page.querySelector('.ct-tm__progress-fill'), tmCur=page.querySelector('.ct-tm__cur');
    var prevB=page.querySelector('.ct-tm__arrow[data-dir="prev"]'), nextB=page.querySelector('.ct-tm__arrow[data-dir="next"]');
    var tmPending=false;
    var updateTm=function(){
      tmPending=false;
      var br=tmBlock.getBoundingClientRect(),bw=tmBlock.offsetWidth,bh=tmBlock.offsetHeight;
      var tr=tmTrack.getBoundingClientRect(),mid=tr.right-tr.width*.15,best=0,bd=1e9;
      tmCards.forEach(function(c,i){
        var r=c.getBoundingClientRect();
        c.style.setProperty('--ox',(r.left-br.left).toFixed(1));c.style.setProperty('--oy',c.offsetTop);
        c.style.setProperty('--sw',bw);c.style.setProperty('--sh',bh);
        var d=Math.abs(r.right-mid); if(d<bd){bd=d;best=i}
      });
      var max=tmTrack.scrollWidth-tmTrack.clientWidth, pos=Math.abs(tmTrack.scrollLeft);
      var prog=max>0?pos/max:1;
      if(tmFill) tmFill.style.setProperty('--tp',(.25+prog*.75).toFixed(3));
      if(tmCur) tmCur.textContent=('0'+(best+1)).slice(-2);
      if(prevB) prevB.disabled=pos<4;
      if(nextB) nextB.disabled=pos>max-4;
    };
    var reqTm=function(){if(!tmPending){tmPending=true;requestAnimationFrame(updateTm)}};
    updateTm(); addEventListener('resize',reqTm); addEventListener('load',reqTm);
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(reqTm);
    tmTrack.addEventListener('scroll',reqTm,{passive:true});
    var stepW=function(){var c=tmCards[0],g=parseFloat(getComputedStyle(tmTrack).columnGap)||0;return c.offsetWidth+g};
    /* RTL: "הבא" נע שמאלה */
    if(nextB) nextB.addEventListener('click',function(){tmTrack.scrollBy({left:-stepW(),behavior:'smooth'})});
    if(prevB) prevB.addEventListener('click',function(){tmTrack.scrollBy({left:stepW(),behavior:'smooth'})});
    tmTrack.addEventListener('keydown',function(e){
      if(e.key==='ArrowLeft'){e.preventDefault();tmTrack.scrollBy({left:-stepW(),behavior:'smooth'})}
      if(e.key==='ArrowRight'){e.preventDefault();tmTrack.scrollBy({left:stepW(),behavior:'smooth'})}
    });
    /* גרירה בעכבר */
    var down=false,sx=0,sl=0,moved=0;
    tmTrack.addEventListener('mousedown',function(e){down=true;moved=0;sx=e.clientX;sl=tmTrack.scrollLeft;e.preventDefault()});
    addEventListener('mousemove',function(e){
      if(!down) return; var dx=e.clientX-sx; moved=Math.max(moved,Math.abs(dx));
      if(moved>3) tmTrack.classList.add('is-drag');
      tmTrack.scrollLeft=sl-dx;
    });
    addEventListener('mouseup',function(){
      if(!down) return; down=false;
      var cur=tmTrack.scrollLeft; tmTrack.classList.remove('is-drag');
      /* הצמדה לכרטיס הקרוב */
      tmTrack.scrollLeft=cur; var w=stepW(); var target=Math.round(cur/w)*w;
      tmTrack.scrollTo({left:target,behavior:'smooth'});
    });
  }

  /* ---------- חוויית לקוחות: רשימה + פאנל ---------- */
  var xpPane=page.querySelector('.ct-xp__pane');
  if(xpPane){
    var xpRows=[].slice.call(xpPane.querySelectorAll('.ct-xp__row'));
    var xpBgs=[].slice.call(xpPane.querySelectorAll('.ct-xp__bg'));
    var xpC=xpPane.querySelector('.ct-xp__content'), xpQ=xpPane.querySelector('.ct-xp__quote'), xpW=xpPane.querySelector('.ct-xp__who'), xpN=xpPane.querySelector('.ct-xp__cnum');
    var xpCur=0, xpT=null, xpSwap=null, xpHover=false;
    var xpShow=function(i){
      if(i===xpCur && xpQ.innerHTML) return;
      xpCur=i;
      xpRows.forEach(function(r,k){r.classList.toggle('is-active',k===i)});
      xpBgs.forEach(function(b,k){b.classList.toggle('is-active',k===i)});
      xpC.classList.add('is-out'); xpC.classList.remove('is-lit');
      clearTimeout(xpSwap);
      xpSwap=setTimeout(function(){
        var row=xpRows[i];
        xpQ.innerHTML=row.querySelector('.ct-xp__q').innerHTML;
        xpW.textContent=row.querySelector('.ct-xp__name').textContent;
        xpN.textContent=('0'+(i+1)).slice(-2);
        xpC.classList.remove('is-out');
        setTimeout(function(){xpC.classList.add('is-lit')},350);
      },350);
      xpRestart();
    };
    var xpRestart=function(){clearInterval(xpT);xpT=setInterval(function(){if(!xpHover&&!document.hidden) xpShow((xpCur+1)%xpRows.length)},7000)};
    xpRows.forEach(function(r,i){
      var b=r.querySelector('.ct-xp__btn');
      b.addEventListener('click',function(){xpShow(i)});
      b.addEventListener('mouseenter',function(){if(desktop.matches) xpShow(i)});
      b.addEventListener('focus',function(){xpShow(i)});
    });
    xpPane.addEventListener('mouseenter',function(){xpHover=true;xpPane.classList.add('is-paused')});
    xpPane.addEventListener('mouseleave',function(){xpHover=false;xpPane.classList.remove('is-paused')});
    xpC.classList.add('is-lit'); xpRestart();
  }

  /* ---------- טופס ---------- */
  var form=page.querySelector('.ct-form');
  if(form){
    var wrap=form.parentElement;
    var check=function(inp){
      var f=inp.closest('.ct-field'); if(!f) return true;
      var v=inp.value.trim(), ok=true;
      if(inp.required&&!v) ok=false;
      else if(inp.type==='tel'&&v) ok=/^[0-9+\-\s]{9,15}$/.test(v)&&v.replace(/\D/g,'').length>=9;
      else if(inp.type==='email'&&v) ok=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      f.classList.toggle('is-error',!ok); return ok;
    };
    [].forEach.call(form.querySelectorAll('input,textarea'),function(inp){
      inp.addEventListener('blur',function(){if(inp.value) check(inp)});
      inp.addEventListener('input',function(){if(inp.closest('.ct-field.is-error')) check(inp)});
    });
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var ok=true,first=null;
      [].forEach.call(form.querySelectorAll('.ct-field input'),function(inp){if(!check(inp)){ok=false;first=first||inp}});
      if(!ok){first.focus({preventScroll:true});return}
      var btn=form.querySelector('button[type=submit]'); btn.classList.add('is-loading');
      /* כאן מחברים שליחה אמיתית (Webhook / Make / אלמנטור). ראו CT_FORM_ENDPOINT */
      var endpoint=window.CT_FORM_ENDPOINT;
      var finish=function(){btn.classList.remove('is-loading');wrap.style.minHeight=wrap.offsetHeight+'px';wrap.classList.add('is-sent');};
      if(endpoint){
        fetch(endpoint,{method:'POST',body:new FormData(form)}).then(finish,finish);
      } else setTimeout(finish,600);
    });
  }

  /* ---------- קישורי עוגן + חזרה למעלה ---------- */
  var goTo=function(el){
    if(window.__ctLenis) window.__ctLenis.scrollTo(el,{offset:0,duration:1.6});
    else el.scrollIntoView({behavior:'smooth',block:'start'});
  };
  [].forEach.call(page.querySelectorAll('a[href^="#"]'),function(a){
    var id=a.getAttribute('href').slice(1); if(!id) return;
    a.addEventListener('click',function(e){var el=document.getElementById(id); if(!el) return; e.preventDefault(); goTo(el);});
  });
  var upBtn=page.querySelector('.ct-foot__up');
  if(upBtn) upBtn.addEventListener('click',function(){goTo(document.getElementById('top')||document.body)});

  /* ---------- טעינה ---------- */
  var first=page.querySelector('.ct-slides--blur .ct-slide'), loaded=false, t0=Date.now();
  function ready(){
    if(loaded) return; loaded=true;
    setTimeout(function(){page.classList.add('is-loaded');startTimer()},Math.max(0,2150-(Date.now()-t0)));
  }
  if(!motion){page.classList.add('is-loaded');startTimer();window.__ctOk=true;return}
  if(!first||first.complete) ready(); else {first.addEventListener('load',ready);first.addEventListener('error',ready)}
  setTimeout(ready,2600);

  /* ---------- פיצול אותיות ---------- */
  [].forEach.call(page.querySelectorAll('[data-reveal="split"]'),function(el){
    var n=0;
    (function walk(node){
      [].slice.call(node.childNodes).forEach(function(c){
        if(c.nodeType===3){
          var frag=document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function(word){
            if(!word) return;
            if(!word.trim()){frag.appendChild(document.createTextNode(word));return}
            var w=document.createElement('span');w.className='w';w.setAttribute('aria-hidden','true');
            word.split('').forEach(function(ch){
              var s=document.createElement('span');s.className='ch';s.textContent=ch;s.style.setProperty('--i',n++);w.appendChild(s);
            });
            frag.appendChild(w);
          });
          node.replaceChild(frag,c);
        } else if(c.nodeType===1 && c.tagName!=='BR') walk(c);
      });
    })(el);
  });
  /* מילים למניפסט */
  var manWords=[], manText=page.querySelector('[data-words]'), manKeys=[];
  if(manText){
    (function walk(node){
      [].slice.call(node.childNodes).forEach(function(c){
        if(c.nodeType===3){
          var frag=document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function(t){
            if(!t) return;
            if(!t.trim()){frag.appendChild(document.createTextNode(t));return}
            var w=document.createElement('span');w.className='wd';w.textContent=t;frag.appendChild(w);manWords.push(w);
          });
          node.replaceChild(frag,c);
        } else if(c.nodeType===1) walk(c);
      });
    })(manText);
    manKeys=[].slice.call(manText.querySelectorAll('.ct-key')).map(function(k){var ws=k.querySelectorAll('.wd');return {el:k,last:ws[ws.length-1]}});
  }
  [].forEach.call(page.querySelectorAll('[data-reveal="fade"]'),function(el){
    [].forEach.call(el.children,function(c,i){c.style.setProperty('--i',i)});
  });

  /* ---------- ספירה (0 סופר אחורה מ-99) ---------- */
  function countUp(node,i){
    if(!node) return;
    var to=+node.dataset.count, from=to===0?99:0, dur=1900, start=null;
    node.textContent=from;
    setTimeout(function(){
      (function step(t){
        if(!start) start=t;
        var k=Math.min(1,(t-start)/dur), e=1-Math.pow(2,-10*k);
        node.textContent=Math.round(from+(to-from)*(k===1?1:e));
        if(k<1) requestAnimationFrame(step);
      })(performance.now());
      requestAnimationFrame(function s(t){});
    },200+i*140);
  }

  /* ---------- כניסות בגלילה ---------- */
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      var el=e.target; el.classList.add('is-in'); io.unobserve(el);
      if(el.dataset.reveal==='stat') countUp(el.querySelector('[data-count]'),+el.style.getPropertyValue('--i')||0);
      [].forEach.call(el.querySelectorAll('[data-reveal="fade"]'),function(c){c.classList.add('is-in')});
      setTimeout(function(){el.classList.add('is-done')},2600);
    });
  },{threshold:.18,rootMargin:'0px 0px -6% 0px'});
  [].forEach.call(page.querySelectorAll('[data-reveal]'),function(el){
    if(el.parentElement.closest('[data-reveal="wide"],[data-reveal="media"]')) return; // ייחשף עם ההורה
    io.observe(el);
  });

  /* ---------- גלילה: פרלקסה, יציאת הפתיחה, פס התקדמות ---------- */
  var hero=page.querySelector('.ct-hero'), heroText=page.querySelector('.ct-hero__text');
  var glass=page.querySelector('.ct-hero__glass'), bar=page.querySelector('.ct-progressbar');
  var px=[].slice.call(page.querySelectorAll('[data-parallax]'));
  var pxx=[].slice.call(page.querySelectorAll('[data-px]'));
  var mx=0,my=0,tx=0,ty=0;
  function frame(){
    var vh=innerHeight, y=scrollY||pageYOffset;
    var hs=Math.min(1,Math.max(0,y/vh));
    mx+=(tx-mx)*.06; my+=(ty-my)*.06;
    if(glass&&heroText) glass.style.background='rgba(250,250,250,'+(.2+hs*.45).toFixed(3)+')';
    var max=document.documentElement.scrollHeight-vh;
    if(bar) bar.style.setProperty('--sp',max>0?(y/max).toFixed(4):0);
    if(manText){
      var mr=manText.getBoundingClientRect();
      var mp=Math.min(1,Math.max(0,(vh*.82-mr.top)/(mr.height+vh*.3)));
      var lit=Math.round(mp*manWords.length*1.08);
      manWords.forEach(function(w,i){w.classList.toggle('is-lit',i<lit)});
      manKeys.forEach(function(k){k.el.classList.toggle('is-lit',k.last.classList.contains('is-lit'))});
    }
    pxx.forEach(function(el){
      var r=el.parentElement.getBoundingClientRect();
      if(r.bottom<-100||r.top>vh+100) return;
      var p=(r.top+r.height/2-vh/2)/vh;
      el.style.setProperty('--px',(Math.min(1,Math.max(0,p+.5))*50).toFixed(2)+'px');
    });
    px.forEach(function(el){
      var r=el.parentElement.getBoundingClientRect();
      if(r.bottom<-100||r.top>vh+100) return;
      var p=(r.top+r.height/2-vh/2)/vh;
      el.style.setProperty('--py',(p*-70*(+el.dataset.parallax||1)).toFixed(2)+'px');
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  /* טקסט הפתיחה סטטי: מעקב העכבר הוסר לבקשת הלקוחה */

  /* ---------- הטיה תלת-ממדית ---------- */
  if(finePointer){
    [].forEach.call(page.querySelectorAll('[data-tilt]'),function(el){
      el.addEventListener('mousemove',function(e){
        if(!el.classList.contains('is-done')) return;
        var r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        el.style.transform='perspective(900px) rotateY('+(x*10).toFixed(2)+'deg) rotateX('+(-y*10).toFixed(2)+'deg) scale(1.02)';
      });
      el.addEventListener('mouseleave',function(){el.style.transform=''});
    });
  }

  /* ---------- תמונה שעוקבת אחרי העכבר בשלבים ---------- */
  if(finePointer){
    [].forEach.call(page.querySelectorAll('.ct-step'),function(row){
      var box=row.querySelector('.ct-step__img'); if(!box) return;
      var x=0,y=0,tx=0,ty=0,on=false,raf=0,lastX=0;
      function tick(){
        x+=(tx-x)*.14; y+=(ty-y)*.14;
        var rot=Math.max(-12,Math.min(12,(tx-x)*.05));
        box.style.transform='translate3d('+(x-box.offsetWidth/2).toFixed(1)+'px,'+(y-box.offsetHeight/2).toFixed(1)+'px,0) rotate('+rot.toFixed(2)+'deg)';
        if(on||Math.abs(tx-x)>.5||Math.abs(ty-y)>.5) raf=requestAnimationFrame(tick); else raf=0;
      }
      row.addEventListener('mouseenter',function(e){
        if(!desktop.matches) return;
        var r=row.getBoundingClientRect(); tx=x=e.clientX-r.left; ty=y=e.clientY-r.top;
        on=true; box.classList.add('is-show'); if(!raf) raf=requestAnimationFrame(tick);
      });
      row.addEventListener('mousemove',function(e){
        var r=row.getBoundingClientRect(); tx=e.clientX-r.left; ty=e.clientY-r.top;
        if(!raf) raf=requestAnimationFrame(tick);
      });
      row.addEventListener('mouseleave',function(){on=false;box.classList.remove('is-show')});
    });
  }

  /* כפתורים: אפקט "מגנטי" (תזוזה לכיוון העכבר) הוסר — נשאר רק מילוי הצבע במעבר עכבר */

  /* ---------- סמן מותאם ---------- */
  var dot=page.querySelector('.ct-cursor'), ring=page.querySelector('.ct-cursor-ring');
  if(finePointer && dot){
    var cx=-100,cy=-100,rx=-100,ry=-100;
    addEventListener('mousemove',function(e){cx=e.clientX;cy=e.clientY;dot.classList.remove('is-hidden');ring.classList.remove('is-hidden')});
    document.addEventListener('mouseleave',function(){dot.classList.add('is-hidden');ring.classList.add('is-hidden')});
    (function loop(){
      rx+=(cx-rx)*.16; ry+=(cy-ry)*.16;
      dot.style.transform='translate3d('+cx+'px,'+cy+'px,0)';
      ring.style.transform='translate3d('+rx.toFixed(1)+'px,'+ry.toFixed(1)+'px,0)';
      requestAnimationFrame(loop);
    })();
    [].forEach.call(page.querySelectorAll('[data-view]'),function(el){
      el.addEventListener('mouseenter',function(){ring.setAttribute('data-label','לפרויקט');ring.classList.add('is-view')});
      el.addEventListener('mouseleave',function(){ring.classList.remove('is-view')});
    });
    [].forEach.call(page.querySelectorAll('.ct-media,.ct-card,.ct-gold,.ct-wide,.ct-hero__frame,.ct-tm-card,.ct-step,.ct-stat,.ct-post,a,button'),function(el){
      el.addEventListener('mouseenter',function(){ring.classList.add('is-hover')});
      el.addEventListener('mouseleave',function(){ring.classList.remove('is-hover')});
    });
  }

  /* ---------- גלילה חלקה ---------- */
  if(window.Lenis){
    try{
      var lenis=new Lenis({lerp:.09,smoothWheel:true}); window.__ctLenis=lenis;
      (function raf(t){lenis.raf(t);requestAnimationFrame(raf)})(0);
    }catch(err){}
  }
  window.__ctOk=true;
})();
