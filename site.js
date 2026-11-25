const settings = {execution:'sequential',action:'authored',policy:'authored',review:'human'};
const configurations={
 execution:{sequential:['Standard sequential','Established turn order','Participants act in an established sequence.'],reactive:['Reactive sequential','Updated decision context','Later participants can respond to newly available evidence.'],simultaneous:['Simultaneous','Shared resolution barrier','Collect decisions before resolving the batch.']},
 action:{authored:['Authored operations','Select from the available operation catalog.'],assisted:['Intent interpretation','Map expressed intent to supported operations.'],generative:['Novel action attempts','Evaluate attempts outside the catalog under configured policy.']},
 policy:{authored:['Authored consequences','Resolve effects through authored logic.'],assisted:['Declared-gap generation','Models fill explicitly declared gaps.'],generative:['Generated proposals','Propose effects within the configured authority envelope.']},
 review:{human:['Director review','Approval is required for generated effects.'],limited:['Automatic within limits','Commit only effects that satisfy explicit automatic bounds.'],automatic:['Automatic review','Authorized generated effects follow the automatic commit path.']}
};
function setText(id,value){document.getElementById(id).textContent=value;}
function updateProfile(){const e=configurations.execution[settings.execution], a=configurations.action[settings.action], p=configurations.policy[settings.policy]; const generated=settings.policy!=='authored'||settings.action==='generative'; const r=generated?configurations.review[settings.review]:['Runtime validation','Generated-effect review applies only when a generated proposal is required.'];setText('profile-title',e[0]);setText('profile-summary',`${a[0]} · ${p[0]}.`);setText('flow-execution',e[1]);setText('detail-execution',e[2]);for(const [key,values] of [['action',a],['policy',p],['review',r]]){setText('flow-'+key,values[0]);setText('detail-'+key,values[1]);}}
for(const button of document.querySelectorAll('.axis-choice')){button.addEventListener('click',()=>{const {axis,value}=button.dataset;settings[axis]=value;for(const option of document.querySelectorAll(`.axis-choice[data-axis="${axis}"]`))option.setAttribute('aria-pressed',String(option===button));updateProfile();});}
updateProfile();

const canvas = document.querySelector('#system-graph');
const field = canvas.parentElement;
const context = canvas.getContext('2d');

function drawSystemGraph() {
  const bounds = field.getBoundingClientRect();
  const {width, height} = bounds;
  if (!width || !height) return;
  const density = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * density);
  canvas.height = Math.round(height * density);
  context.setTransform(density, 0, 0, density, 0, 0);
  context.strokeStyle = '#7da9ce13';
  context.lineWidth = 1;
  context.beginPath();
  for (let x = 14.5; x < width; x += 26) { context.moveTo(x,0); context.lineTo(x,height); }
  for (let y = 14.5; y < height; y += 26) { context.moveTo(0,y); context.lineTo(width,y); }
  context.stroke();
  const project = (x,y) => {
    const z = 1.25 * Math.exp(-((x+.8)**2+(y-1.1)**2)/7) + .64*Math.sin(.98*x+.29*y)*Math.cos(.68*y);
    return [width*(.51+(x-y)*.064),height*(.60+(x+y)*.035-z*.11)];
  };
  for (let g=-6;g<=6;g+=.55) {
    for (const transpose of [false,true]) {
      context.beginPath();
      for (let t=-6;t<=6;t+=.18) {
        const [x,y] = transpose ? project(t,g) : project(g,t);
        if (t===-6) context.moveTo(x,y); else context.lineTo(x,y);
      }
      context.strokeStyle = '#52b7d614'; context.stroke();
    }
  }
  const port = (node, edge) => {
    const r=node.getBoundingClientRect();
    return [r.left-bounds.left+r.width/2, (edge==='top'?r.top:r.bottom)-bounds.top];
  };
  const layers = Array.from(field.querySelectorAll('.architecture-layer'), row=>Array.from(row.querySelectorAll('.arch-node')));
  function connectRows(from,to,color) {
    const ends=from.map(n=>port(n,'bottom'));
    const starts=to.map(n=>port(n,'top'));
    const elbow=(Math.max(...ends.map(p=>p[1]))+Math.min(...starts.map(p=>p[1])))/2;
    const all=[...ends,...starts];
    context.strokeStyle=color; context.lineWidth=1.2;
    context.beginPath();
    context.moveTo(Math.min(...all.map(p=>p[0])),elbow);
    context.lineTo(Math.max(...all.map(p=>p[0])),elbow);
    for (const [x,y] of all) {context.moveTo(x,y);context.lineTo(x,elbow);}
    context.stroke();
    context.fillStyle=color;
    for (const [x] of all) context.fillRect(x-1.5,elbow-1.5,3,3);
  }
  for(let i=0;i<layers.length-1;i++) connectRows(i===0?[layers[0][1]]:layers[i],layers[i+1],i===3?'#7e9fc7':'#83e4ef');
  const lib=field.querySelector('.library').getBoundingClientRect();
  const scenario=field.querySelector('.scenario').getBoundingClientRect();
  context.strokeStyle='#83e4ef'; context.beginPath();
  context.moveTo(lib.right-bounds.left,(lib.top+lib.bottom)/2-bounds.top);
  context.lineTo(scenario.left-bounds.left,(scenario.top+scenario.bottom)/2-bounds.top);
  context.stroke();
}
if (context) {
  if ('ResizeObserver' in window) new ResizeObserver(drawSystemGraph).observe(field);
  else window.addEventListener('resize',drawSystemGraph);
  drawSystemGraph();
}

// Screenshot carousel. Original PNG files are retained for the enlarged view.
(() => {
  const gallery=document.querySelector('.gallery');
  if(!gallery) return;
  const thumbs=[...gallery.querySelectorAll('.gallery-thumb')];
  const image=document.getElementById('gallery-image');
  const expand=document.getElementById('gallery-expand');
  const dialog=document.getElementById('gallery-dialog');
  const play=document.getElementById('gallery-play');
  const caption=document.getElementById('gallery-caption');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let index=0, playing=!reduced.matches, hover=false, focused=false, visible=false, timer;
  const count=()=>`${String(index+1).padStart(2,'0')} / ${String(thumbs.length).padStart(2,'0')}`;
  function schedule(){
    clearTimeout(timer);
    if(playing && visible && !document.hidden && !hover && !focused && !dialog.open) timer=setTimeout(()=>{show(index+1);},7500);
  }
  function show(i){
    index=(i+thumbs.length)%thumbs.length;
    const d=thumbs[index].dataset;
    image.src=d.src; image.alt=d.alt; expand.href=d.src;
    image.classList.remove('reveal'); void image.offsetWidth; image.classList.add('reveal');
    setText('gallery-title',d.title);setText('gallery-description',d.description);setText('gallery-count',count());
    thumbs.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===index)));
    if(dialog.open){const full=document.getElementById('lightbox-image');full.src=d.src;full.alt=d.alt;setText('lightbox-title',d.title);setText('lightbox-count',count());}
    schedule();
  }
  function updatePlay(){play.textContent=playing?'Ⅱ':'▶';play.setAttribute('aria-label',playing?'Pause slideshow':'Play slideshow');caption.setAttribute('aria-live',playing?'off':'polite');schedule();}
  function manual(i){playing=false;updatePlay();show(i);}
  thumbs.forEach((b,i)=>b.addEventListener('click',()=>manual(i)));
  document.getElementById('gallery-prev').addEventListener('click',()=>manual(index-1));
  document.getElementById('gallery-next').addEventListener('click',()=>manual(index+1));
  play.addEventListener('click',()=>{playing=!playing;updatePlay();});
  gallery.addEventListener('mouseenter',()=>{hover=true;schedule();});
  gallery.addEventListener('mouseleave',()=>{hover=false;schedule();});
  gallery.addEventListener('focusin',()=>{focused=true;schedule();});
  gallery.addEventListener('focusout',e=>{if(!gallery.contains(e.relatedTarget)){focused=false;schedule();}});
  gallery.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();manual(index+(e.key==='ArrowRight'?1:-1));}});
  expand.addEventListener('click',e=>{if(typeof dialog.showModal!=='function')return;e.preventDefault();dialog.showModal();show(index);document.getElementById('lightbox-close').focus();});
  document.getElementById('lightbox-close').addEventListener('click',()=>dialog.close());
  document.getElementById('lightbox-prev').addEventListener('click',()=>manual(index-1));
  document.getElementById('lightbox-next').addEventListener('click',()=>manual(index+1));
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();manual(index+(e.key==='ArrowRight'?1:-1));}});
  dialog.addEventListener('close',()=>{expand.focus();schedule();});
  document.addEventListener('visibilitychange',schedule);
  reduced.addEventListener('change',()=>{if(reduced.matches)playing=false;updatePlay();});
  if('IntersectionObserver' in window){new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:0.15}).observe(gallery);}else{visible=true;}
  updatePlay();
})();
