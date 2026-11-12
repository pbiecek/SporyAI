(function(){
  var root=document.documentElement;
  root.classList.add('js');

  /* ----- language ----- */
  var titles={pl:'Spory o AI',en:'DISPUTES OVER AI'};
  function setLang(l,save){
    if(l!=='pl'&&l!=='en')l='pl';
    root.setAttribute('data-lang',l);root.setAttribute('lang',l);
    document.title=titles[l];
    document.querySelectorAll('[data-set-lang]').forEach(function(b){
      b.setAttribute('aria-pressed',String(b.getAttribute('data-set-lang')===l));
    });
    if(save){try{localStorage.setItem('spory-lang',l)}catch(e){}}
    update(true);
  }
  var initial=null;
  try{initial=new URLSearchParams(location.search).get('lang')}catch(e){}
  if(!initial){try{initial=localStorage.getItem('spory-lang')}catch(e){}}
  if(!initial){initial=(navigator.language||'pl').toLowerCase().indexOf('pl')===0?'pl':'en'}
  document.querySelectorAll('[data-set-lang]').forEach(function(b){
    b.addEventListener('click',function(){setLang(b.getAttribute('data-set-lang'),true)});
  });

  /* ----- reveal on scroll ----- */
  var items=[].slice.call(document.querySelectorAll('.reveal'));
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}});
    },{rootMargin:'0px 0px -12% 0px',threshold:.12});
    items.forEach(function(el){io.observe(el)});
  }else{items.forEach(function(el){el.classList.add('is-in')})}

  /* ----- balance of the dispute, one gauge shared by all episodes ----- */
  var needle=document.getElementById('needle');
  var track=needle.parentNode;
  var eps=[].slice.call(document.querySelectorAll('.ep')).map(function(el){
    var stops=[].slice.call(el.querySelectorAll('[data-pos]'));
    var marks=stops.map(function(s){
      var m=document.createElement('span');m.className='gauge__mark';
      m.style.left=(50+parseFloat(s.getAttribute('data-pos'))*42)+'%';
      m.style.display='none';
      track.insertBefore(m,needle);return m;
    });
    return {el:el,id:el.getAttribute('data-ep'),stops:stops,marks:marks};
  });
  var current='',ticking=false;
  function update(force){
    var line=window.innerHeight*.62,e=0,idx=-1;
    eps.forEach(function(ep,i){if(ep.el.getBoundingClientRect().top<line)e=i});
    var ep=eps[e];
    ep.stops.forEach(function(s,i){if(s.getBoundingClientRect().top<line)idx=i});
    var key=e+':'+idx;
    if(key===current&&!force)return;
    current=key;
    root.setAttribute('data-ep',ep.id);
    var lang=root.getAttribute('data-lang');
    if(idx<0){
      needle.style.left='50%';needle.removeAttribute('data-side');needle.textContent='start';
    }else{
      var s=ep.stops[idx],pos=parseFloat(s.getAttribute('data-pos'));
      needle.style.left=(50+pos*42)+'%';
      if(pos===0)needle.removeAttribute('data-side');
      else needle.setAttribute('data-side',pos<0?'doubt':'hope');
      needle.textContent=s.getAttribute('data-label')||s.getAttribute('data-label-'+lang);
    }
    eps.forEach(function(x,k){x.marks.forEach(function(m,i){
      m.style.display=k===e?'':'none';
      m.classList.toggle('is-on',k===e&&i<idx);
    })});
  }
  window.addEventListener('scroll',function(){
    if(ticking)return;ticking=true;
    requestAnimationFrame(function(){ticking=false;update(false)});
  },{passive:true});
  window.addEventListener('resize',function(){update(true)});

  /* ----- krok po kroku: spacja, strzałki, PageUp/PageDown, przyciski ----- */
  /* Części opowieści: plansze początkowe, plansze tytułowe, każdy głos (razem ze zdaniem narratora nad nim), finały. */
  var stepEls=[].slice.call(document.querySelectorAll('.intro__hero, .intro__body, .opening, .voice, .finale'));
  function barH(){return document.querySelector('.bar').getBoundingClientRect().height}
  function stepTop(el){
    var target=el,pad=0;
    if(el.classList.contains('voice')){
      var p=el.previousElementSibling;
      while(p&&p.classList.contains('aside')){
        if(p.offsetParent!==null){target=p;pad=parseFloat(getComputedStyle(p).paddingTop)*.6}
        p=p.previousElementSibling;
      }
    }
    var y=target.getBoundingClientRect().top+window.pageYOffset+pad;
    if(el.classList.contains('intro__hero')||el.classList.contains('intro__body'))y-=barH();
    else if(!el.classList.contains('opening'))y-=barH()+12;
    return Math.max(0,Math.round(y));
  }
  function go(dir){
    var y=window.pageYOffset,tops=stepEls.map(stepTop),max=document.documentElement.scrollHeight-window.innerHeight,dest=null,i;
    if(dir>0){for(i=0;i<tops.length;i++){if(tops[i]>y+4){dest=tops[i];break}}if(dest===null)dest=max}
    else{for(i=tops.length-1;i>=0;i--){if(tops[i]<y-4){dest=tops[i];break}}if(dest===null)dest=0}
    var calm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({top:Math.min(dest,max),behavior:calm?'auto':'smooth'});
  }
  document.addEventListener('keydown',function(e){
    if(e.altKey||e.ctrlKey||e.metaKey)return;
    var tag=(e.target&&e.target.tagName||'').toLowerCase();
    if(tag==='input'||tag==='textarea'||tag==='select')return;
    var k=e.key,onControl=(tag==='button'||tag==='a');
    if(k===' '||k==='Spacebar'){if(onControl)return;e.preventDefault();go(e.shiftKey?-1:1)}
    else if(k==='ArrowDown'||k==='ArrowRight'||k==='PageDown'){e.preventDefault();go(1)}
    else if(k==='ArrowUp'||k==='ArrowLeft'||k==='PageUp'){e.preventDefault();go(-1)}
  });
  document.querySelectorAll('[data-step]').forEach(function(b){
    b.addEventListener('click',function(){go(parseInt(b.getAttribute('data-step'),10));b.blur()});
  });

  setLang(initial,false);
})();
