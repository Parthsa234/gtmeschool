/* GTME.School v3 — interactions. Everything readable is visible without JS; JS adds motion. */
(function(){
  var d=document, w=window, root=d.documentElement;
  root.classList.add('js');
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s,c){return (c||d).querySelector(s)}
  function $$(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))}
  var vh = function(){return w.innerHeight||root.clientHeight};

  /* mobile nav + dropdown */
  var mnav=$('#mnav'), burger=$('.burger');
  if(burger&&mnav){
    burger.addEventListener('click',function(){mnav.hidden=false;burger.setAttribute('aria-expanded','true');d.body.style.overflow='hidden';var c=$('.close',mnav);c&&c.focus()});
    function closeNav(){mnav.hidden=true;burger.setAttribute('aria-expanded','false');d.body.style.overflow=''}
    $$('.close, a',mnav).forEach(function(el){el.addEventListener('click',closeNav)});
    d.addEventListener('keydown',function(e){if(e.key==='Escape'&&!mnav.hidden)closeNav()});
  }
  $$('.dd>button').forEach(function(b){b.addEventListener('click',function(){var p=b.parentNode;var o=p.classList.toggle('open');b.setAttribute('aria-expanded',o)})});
  d.addEventListener('click',function(e){$$('.dd.open').forEach(function(dd){if(!dd.contains(e.target)){dd.classList.remove('open');$('button',dd).setAttribute('aria-expanded','false')}})});

  /* in-view helper */
  function onView(els,fn,opts){
    if(!('IntersectionObserver' in w)){els.forEach(fn);return}
    var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){fn(en.target);io.unobserve(en.target)}})},opts||{rootMargin:'0px 0px -6% 0px',threshold:0});
    els.forEach(function(el){io.observe(el)});
  }
  function below(el){return el.getBoundingClientRect().top>vh()*0.92}

  /* reveal (observer-driven; one cheap fallback pass, no per-frame layout reads) */
  var pending=[];
  if(!reduce){
    pending=$$('.rv, .facade').filter(below);
    pending.forEach(function(el){el.classList.add('pre')});
    onView(pending,function(el){el.classList.remove('pre')},{rootMargin:'0px 0px -4% 0px',threshold:0});
  }
  function sweep(){if(!pending.length)return;var lim=vh();pending=pending.filter(function(el){if(!el.classList.contains('pre'))return false;if(el.getBoundingClientRect().top<lim){el.classList.remove('pre');return false}return true})}
  w.addEventListener('hashchange',function(){setTimeout(sweep,80)});
  w.addEventListener('load',function(){setTimeout(sweep,300)});

  /* hero chalkboard drawing */
  var seq=$$('[data-d]');
  if(seq.length&&!reduce){
    seq.forEach(function(el){el.style.animationDelay=el.getAttribute('data-d')+'s';el.classList.add('go')});
  }

  /* counters */
  var counters=$$('[data-count]');
  if(!reduce){
    counters.filter(below).forEach(function(el){
      var target=parseFloat(el.getAttribute('data-count')), dec=(el.getAttribute('data-count').split('.')[1]||'').length;
      var pre=el.getAttribute('data-pre')||'', suf=el.getAttribute('data-suf')||'';
      var fin=el.textContent;
      el.textContent=pre+(0).toFixed(dec)+suf;
      onView([el],function(){
        var t0=null,dur=1400;
        function step(t){if(!t0)t0=t;var p=Math.min((t-t0)/dur,1);var e=1-Math.pow(1-p,3);el.textContent=pre+(target*e).toLocaleString('en-IN',{minimumFractionDigits:dec,maximumFractionDigits:dec})+suf;if(p<1)requestAnimationFrame(step);else el.textContent=fin}
        requestAnimationFrame(step);
      });
    });
  }

  /* bars */
  var bars=$$('.bar .tr i, .ba .seg');
  if(!reduce){
    var bb=bars.filter(below);
    bb.forEach(function(i){i.dataset.w=i.style.width;i.style.width='0%'});
    onView(bb,function(i){setTimeout(function(){i.style.width=i.dataset.w},60)});
  }

  /* seating plan */
  var seating=$('.seating');
  if(seating){
    var seats=$$('.seat[data-on]',seating);
    function fill(){seats.forEach(function(s,k){setTimeout(function(){s.classList.add('on')},reduce?0:k*70)})}
    if(reduce||!below(seating)) fill(); else onView([seating],fill);
  }

  /* geometry cache: measured on load/resize only, so scrolling never forces layout */
  function absTop(el){var t=0;while(el){t+=el.offsetTop;el=el.offsetParent}return t}
  var strip=$('.periods'), links=[], secs=[], tops=[], sc=null, cur=-1;
  if(strip){links=$$('a',strip);secs=links.map(function(a){return $(a.getAttribute('href'))});sc=$('.scroller',strip)}
  var ps=$('.plan-sec'), psTop=0, psH=0, corrW=0, rooms=[], walker=null, corr=null, ticks=[], stepLbl=null, pinned=false, lastN=-1;
  function measure(){
    tops=secs.map(function(s){return s?absTop(s):1e9});
    if(ps){psTop=absTop(ps);psH=ps.offsetHeight;corrW=corr?corr.clientWidth:0}
  }
  function spy(y){
    if(!strip)return;
    var line=y+vh()*0.3, idx=0;
    for(var k=0;k<tops.length;k++){if(tops[k]<line)idx=k}
    if(idx!==cur){cur=idx;links.forEach(function(a,k){a.classList.toggle('on',k===idx)});
      var a=links[idx]; if(a&&sc){sc.scrollLeft=a.offsetLeft-sc.clientWidth/2+a.clientWidth/2}}
  }
  function light(n){if(n===lastN)return;lastN=n;rooms.forEach(function(r){r.classList.toggle('lit',+r.dataset.step<=n)});ticks.forEach(function(t,k){t.classList.toggle('on',k<n)});if(stepLbl){var r=rooms.filter(function(x){return +x.dataset.step===n})[0];stepLbl.textContent=r?r.dataset.name:'Start at the entrance hall'}}
  function plan(y){
    if(!pinned)return;
    var total=psH-vh(); var p=Math.min(Math.max((y-psTop)/(total||1),0),1);
    light(Math.min(7,Math.floor(p*7.6)));
    if(walker)walker.style.transform='translate3d('+(Math.min(p*1.08,1)*corrW)+'px,0,0)';
  }
  if(ps){
    rooms=$$('.plan [data-step]',ps); walker=$('.walker',ps); corr=$('.corr',ps); ticks=$$('.plan-prog i',ps); stepLbl=$('.plan-step',ps);
    var mq=w.matchMedia('(min-width:1001px) and (min-height:700px)');
    function setup(){
      pinned=mq.matches&&!reduce; ps.classList.toggle('pinned',pinned); lastN=-1;
      if(!pinned){ if(reduce)light(7); else {light(0); rooms.forEach(function(r){onView([r],function(){r.classList.add('lit')})})} }
      measure(); plan(w.pageYOffset);
    }
    setup(); mq.addEventListener&&mq.addEventListener('change',setup);
  }
  measure();
  var ticking=false;
  function frame(){ticking=false;var y=w.pageYOffset;spy(y);plan(y);sweep()}
  w.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(frame)}},{passive:true});
  var rt;function remeasure(){clearTimeout(rt);rt=setTimeout(function(){measure();frame()},120)}
  w.addEventListener('resize',remeasure); w.addEventListener('load',remeasure);
  if('ResizeObserver' in w){new ResizeObserver(remeasure).observe(d.body)}
  frame();

  /* lockers (tap) */
  $$('.locker .tg').forEach(function(b){b.addEventListener('click',function(){var l=b.parentNode;var o=l.classList.toggle('open');b.setAttribute('aria-expanded',o)})});

  /* filters */
  $$('.filters').forEach(function(f){
    var grid=$(f.getAttribute('data-for'));
    $$('button',f).forEach(function(b){b.addEventListener('click',function(){
      $$('button',f).forEach(function(x){x.setAttribute('aria-pressed','false')});b.setAttribute('aria-pressed','true');
      var k=b.dataset.f; $$('[data-tags]',grid).forEach(function(c){c.hidden=!(k==='all'||c.dataset.tags.indexOf(k)>-1)});
    })});
  });

  /* lightbox */
  var lb=null;
  $$('[data-zoom]').forEach(function(b){b.addEventListener('click',function(){
    var src=b.getAttribute('data-zoom'), cap=b.getAttribute('data-cap')||'';
    if(!lb){lb=d.createElement('div');lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.innerHTML='<button type="button" aria-label="Close">×</button><figure><img alt=""><figcaption></figcaption></figure>';d.body.appendChild(lb);
      lb.addEventListener('click',function(e){if(e.target===lb||e.target.tagName==='BUTTON')lb.hidden=true});
      d.addEventListener('keydown',function(e){if(e.key==='Escape'&&lb)lb.hidden=true});}
    $('img',lb).src=src;$('img',lb).alt=cap;$('figcaption',lb).textContent=cap;lb.hidden=false;$('button',lb).focus();
  })});

  /* video testimonials */
  $$('.screen .play').forEach(function(b){b.addEventListener('click',function(){
    var s=b.parentNode, v=d.createElement('video');
    v.src=s.dataset.src; v.controls=true; v.playsInline=true; v.preload='auto'; v.poster=s.dataset.poster;
    s.innerHTML=''; s.appendChild(v); var p=v.play(); if(p&&p.catch)p.catch(function(){});
    $$('.screen video').forEach(function(o){if(o!==v)o.pause()});
  })});

  /* countdowns */
  $$('[data-deadline]').forEach(function(el){
    var t=new Date(el.getAttribute('data-deadline')).getTime(), now=Date.now();
    var days=Math.ceil((t-now)/864e5);
    var mode=el.getAttribute('data-mode')||'days';
    if(days<0){el.textContent=el.getAttribute('data-past')||'Closed';return}
    if(mode==='num'){el.textContent=days}
    else el.textContent=days===1?'1 day left':days+' days left';
  });

  /* launchpad clinic checklist */
  var cl=$('.clinics');
  if(cl){
    var boxes=$$('input[type=checkbox]',cl), bar=$('.progress .tr i'), out=$('.progress .cnt');
    function upd(){var n=boxes.filter(function(b){return b.checked}).length;boxes.forEach(function(b){b.closest('.clinic').classList.toggle('done',b.checked)});if(bar)bar.style.width=(n/boxes.length*100)+'%';if(out)out.textContent=n+' of '+boxes.length+' machines shipped'}
    boxes.forEach(function(b){b.addEventListener('change',upd)}); upd();
  }

  /* EMI calculator */
  var emi=$('#emi');
  if(emi){
    function calc(){var p=+($('input[name=emi-prog]:checked',emi)||{}).value||350000;var m=+($('input[name=emi-mo]:checked',emi)||{}).value||12;
      $('#emi-out').textContent='₹'+Math.round(p/m).toLocaleString('en-IN');$('#emi-note').textContent='per month over '+m+' months, on ₹'+p.toLocaleString('en-IN')+', before the financing partner’s fee'}
    $$('input',emi).forEach(function(i){i.addEventListener('change',calc)}); calc();
  }

  /* rung quiz */
  var qz=$('#quiz');
  if(qz){
    var R={
      launchpad:['Launchpad','₹24,999 + GST','Build the six machines yourself, with a 90-minute live clinic every week where your table goes on screen. Credited in full to Operator within 21 days.','launchpad.html','See Launchpad'],
      operator:['Operator Cohort','₹3.5L · $4,000','Ship all six machines on a live account, on a deadline, with a cohort. Demo Day in week eight. Application and a call first.','#apply','Apply for Cohort 2'],
      lieutenant:['Lieutenant','₹5.3L · $6,000','Operator plus weekly 1:1 co-builds with Nish on your own agency or company pipeline. Eight seats a cohort.','#apply','Talk to Nish'],
      teams:['SDR Team Program','₹2.5–4L per team','A private cohort for up to ten reps on your accounts. Every rep ships a live campaign; you get a Monday scoreboard.','teams.html','See the team program']
    };
    function pick(){
      var who=(($('input[name=q-who]:checked',qz)||{}).value), hrs=(($('input[name=q-hrs]:checked',qz)||{}).value), want=(($('input[name=q-want]:checked',qz)||{}).value);
      var k='launchpad';
      if(who==='lead')k='teams';
      else if(who==='founder'&&want==='ship')k='lieutenant';
      else if(want==='ship'&&hrs==='8')k='operator';
      else if(want==='ship'&&hrs!=='8')k='launchpad';
      var r=R[k];$('#q-name').textContent=r[0];$('#q-price').textContent=r[1];$('#q-why').textContent=r[2];var a=$('#q-go');a.href=r[3];a.firstChild.nodeValue=r[4]+' ';
    }
    $$('input',qz).forEach(function(i){i.addEventListener('change',pick)}); pick();
  }

  /* forms → email draft (no backend) */
  $$('form[data-mail]').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      if(!f.checkValidity()){f.reportValidity();return}
      var lines=[];$$('input,select,textarea',f).forEach(function(i){if(!i.name)return;if((i.type==='radio'||i.type==='checkbox')&&!i.checked)return;var lab=i.getAttribute('data-l')||i.name;lines.push(lab+': '+i.value)});
      var url='mailto:hello@gtme.school?subject='+encodeURIComponent(f.getAttribute('data-mail'))+'&body='+encodeURIComponent(lines.join('\n'));
      var ok=$('.okmsg',f.parentNode); if(ok)ok.hidden=false;
      try{w.location.href=url}catch(err){}
    });
  });

  /* copy buttons */
  $$('[data-copy]').forEach(function(b){b.addEventListener('click',function(){
    var t=$(b.getAttribute('data-copy')); if(!t)return; var txt=t.innerText;
    function done(){var o=b.textContent;b.textContent='Copied';setTimeout(function(){b.textContent=o},1600)}
    function sel(){var r=d.createRange();r.selectNodeContents(t);var s=w.getSelection();s.removeAllRanges();s.addRange(r);b.textContent='Selected, press Ctrl/Cmd+C'}
    try{navigator.clipboard.writeText(txt).then(done,sel)}catch(err){sel()}
  })});

  /* article: reading bar + toc */
  var rb=$('.readbar i'), art=$('.prose');
  if(rb&&art){
    var tl=$$('.toc a'), hs=tl.map(function(a){return $(a.getAttribute('href'))}).filter(Boolean);
    function rd(){var r=art.getBoundingClientRect();var p=Math.min(Math.max((vh()*0.3-r.top)/(r.height-vh()*0.4),0),1);rb.style.width=(p*100)+'%';
      var idx=-1;hs.forEach(function(h,k){if(h.getBoundingClientRect().top<vh()*0.3)idx=k});tl.forEach(function(a,k){a.classList.toggle('on',k===idx)})}
    w.addEventListener('scroll',rd,{passive:true}); rd();
  }
})();
