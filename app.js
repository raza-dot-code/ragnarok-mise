'use strict';
const root=document.documentElement;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches||Boolean(navigator.connection?.saveData);
let userPausedFilm=false;
let filmInView=true;
const film=document.querySelector('#hero-film');
const filmPause=document.querySelector('#film-pause');
const motionToggle=document.querySelector('#motion-toggle');
const filmDialog=document.querySelector('#film-dialog');
const fullFilm=document.querySelector('#full-film');
function syncFilmButton(){const p=film.paused;filmPause.innerHTML=`<span aria-hidden="true">${p?'▶':'Ⅱ'}</span> ${p?'Play':'Pause'} film`;filmPause.setAttribute('aria-label',`${p?'Play':'Pause'} background film`);}
function playBackground(){if(!paused&&!userPausedFilm&&filmInView&&!document.hidden&&!filmDialog.open)film.play().catch(syncFilmButton);}
function setMotion(value){paused=value;root.classList.toggle('motion-paused',value);motionToggle.setAttribute('aria-pressed',String(value));motionToggle.setAttribute('aria-label',`${value?'Resume':'Pause'} decorative motion`);motionToggle.innerHTML=`<span aria-hidden="true">${value?'▶':'Ⅱ'}</span>`;if(value)film.pause();else playBackground();}
film.addEventListener('play',syncFilmButton);film.addEventListener('pause',syncFilmButton);film.addEventListener('error',syncFilmButton);
setMotion(paused);motionToggle.addEventListener('click',()=>setMotion(!paused));reduced.addEventListener('change',e=>setMotion(e.matches));
filmPause.addEventListener('click',()=>{if(film.paused){userPausedFilm=false;film.play().catch(syncFilmButton);}else{userPausedFilm=true;film.pause();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)film.pause();else playBackground();});
document.querySelector('.film-open').addEventListener('click',()=>{filmDialog.showModal();document.body.classList.add('dialog-open');film.pause();fullFilm.play().catch(()=>{});});
filmDialog.querySelector('.dialog-close').addEventListener('click',()=>filmDialog.close());
filmDialog.addEventListener('close',()=>{fullFilm.pause();document.body.classList.remove('dialog-open');playBackground();});
filmDialog.addEventListener('click',e=>{const r=filmDialog.getBoundingClientRect();if(e.target===filmDialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))filmDialog.close();});

const menu=document.querySelector('.menu-toggle');const mobileNav=document.querySelector('#mobile-nav');
function closeMenu(){mobileNav.hidden=true;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open menu');}
menu.addEventListener('click',()=>{const open=mobileNav.hidden;mobileNav.hidden=!open;menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu');});
mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mobileNav.hidden){closeMenu();menu.focus();}});
matchMedia('(min-width: 851px)').addEventListener('change',e=>{if(e.matches)closeMenu();});

const gallery=document.querySelector('#service-gallery');const previous=document.querySelector('#gallery-prev');const next=document.querySelector('#gallery-next');
function galleryState(){const max=gallery.scrollWidth-gallery.clientWidth;const ratio=max>1?Math.max(0,Math.min(1,gallery.scrollLeft/max)):0;previous.disabled=gallery.scrollLeft<4;next.disabled=gallery.scrollLeft>max-4;document.querySelector('.gallery-count').textContent=`0${Math.round(ratio*2)+1} — 03`;document.querySelector('.gallery-track i').style.transform=`translateX(${ratio*200}%)`;}
function moveGallery(direction){const width=gallery.querySelector('.service-card').getBoundingClientRect().width;gallery.scrollBy({left:direction*(width+30),behavior:paused?'auto':'smooth'});}
previous.addEventListener('click',()=>moveGallery(-1));next.addEventListener('click',()=>moveGallery(1));gallery.addEventListener('scroll',galleryState,{passive:true});window.addEventListener('resize',galleryState,{passive:true});
gallery.addEventListener('keydown',e=>{if(e.target!==gallery)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();moveGallery(e.key==='ArrowRight'?1:-1);}});
let dragging=false,startX=0,startScroll=0;
gallery.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('button,a'))return;dragging=true;startX=e.clientX;startScroll=gallery.scrollLeft;gallery.classList.add('grabbing');gallery.setPointerCapture(e.pointerId);e.preventDefault();});
gallery.addEventListener('pointermove',e=>{if(dragging)gallery.scrollLeft=startScroll+startX-e.clientX;});
function endDrag(){dragging=false;gallery.classList.remove('grabbing');}
gallery.addEventListener('pointerup',endDrag);gallery.addEventListener('pointercancel',endDrag);gallery.addEventListener('lostpointercapture',endDrag);galleryState();

const equipmentData=[{title:'THE COOKING LINE',src:'assets/kitchen.webp',alt:'Illustrative commercial kitchen cooking equipment'},{title:'REFRIGERATION',src:'assets/preparation.webp',alt:'Illustrative under-counter refrigeration at a professional preparation station'},{title:'WAREWASHING',src:'assets/kitchen.webp',alt:'Illustrative view of stainless steel commercial kitchen facilities'},{title:'PREPARATION',src:'assets/preparation.webp',alt:'Illustrative professional planetary mixer and preparation worktop'}];
const equipmentDetails=[...document.querySelectorAll('[data-equipment]')];
equipmentDetails.forEach((detail,index)=>detail.addEventListener('toggle',()=>{if(!detail.open)return;equipmentDetails.forEach(other=>{if(other!==detail)other.open=false;});const data=equipmentData[index];const photo=document.querySelector('#equipment-image');photo.src=data.src;photo.alt=data.alt;document.querySelector('#equipment-count').textContent=`0${index+1} / 04`;document.querySelector('#equipment-photo-title').textContent=data.title;const frame=document.querySelector('.equipment-photo');frame.classList.remove('switching');requestAnimationFrame(()=>frame.classList.add('switching'));}));

const requestForm=document.querySelector('#request-form');const stepOne=document.querySelector('#form-step-1');const stepTwo=document.querySelector('#form-step-2');const confirmation=document.querySelector('#request-confirmation');const detailsInput=document.querySelector('#request-details');
function setStep(number){stepOne.hidden=number!==1;stepTwo.hidden=number!==2;stepTwo.querySelectorAll('input').forEach(i=>i.disabled=number!==2);document.querySelector('#form-progress').textContent=`0${number} / 02`;}
setStep(1);
function startRequest(service,details=''){requestForm.hidden=false;confirmation.hidden=true;setStep(1);const radio=[...requestForm.querySelectorAll('[name=service]')].find(i=>i.value===service);if(radio)radio.checked=true;if(details)detailsInput.value=details;if(service==='Maintenance')requestForm.querySelector('[name=timing]').value='Planning ahead';document.querySelector('#request').scrollIntoView({behavior:paused?'auto':'smooth',block:'start'});detailsInput.focus({preventScroll:true});}
document.querySelectorAll('[data-request]').forEach(button=>button.addEventListener('click',()=>startRequest(button.dataset.request,button.dataset.detail?`${button.dataset.detail}: `:'')));
document.querySelector('#form-next').addEventListener('click',()=>{if(!detailsInput.reportValidity())return;setStep(2);stepTwo.querySelector('input').focus({preventScroll:true});});
document.querySelector('.form-back').addEventListener('click',()=>{setStep(1);detailsInput.focus({preventScroll:true});});
requestForm.addEventListener('submit',e=>{e.preventDefault();if(stepTwo.hidden){if(detailsInput.reportValidity())setStep(2);return;}if(!requestForm.reportValidity())return;const data=new FormData(requestForm);const entries=[['Service',data.get('service')],['Timing',data.get('timing')],['Equipment',data.get('details')],['Name',data.get('name')],['Email',data.get('email')]];if(data.get('venue'))entries.push(['Venue',data.get('venue')]);const summary=document.querySelector('#request-summary');summary.replaceChildren(...entries.flatMap(([label,value])=>{const dt=document.createElement('dt');const dd=document.createElement('dd');dt.textContent=label;dd.textContent=String(value);return[dt,dd];}));requestForm.hidden=true;confirmation.hidden=false;document.querySelector('#form-progress').textContent='PREVIEW';confirmation.setAttribute('tabindex','-1');confirmation.focus({preventScroll:true});});
document.querySelector('#edit-request').addEventListener('click',()=>{confirmation.hidden=true;requestForm.hidden=false;setStep(1);detailsInput.focus({preventScroll:true});});
document.querySelector('#clear-request').addEventListener('click',()=>{requestForm.reset();document.querySelector('#request-summary').replaceChildren();confirmation.hidden=true;requestForm.hidden=false;setStep(1);detailsInput.focus({preventScroll:true});});

const guide={Repair:{title:'Let’s start with a repair assessment.',copy:'A description of the fault and the equipment details will help shape a clear next step. Start with what you know.'},Maintenance:{title:'A care plan is a good starting point.',copy:'Bring your equipment list and preferred service window. We can use them to explore a practical maintenance scope.'},Diagnostics:{title:'First, a clearer picture.',copy:'Describe the symptoms, when they appear and whether the issue is recurring. A diagnostic assessment can help identify the cause.'}};
let guideSelection={service:'Repair',equipment:'Cooking equipment'};
document.querySelector('#finder-form').addEventListener('submit',e=>{e.preventDefault();guideSelection={service:document.querySelector('#finder-need').value,equipment:document.querySelector('#finder-equipment').value};const data=guide[guideSelection.service];document.querySelector('#finder-result-title').textContent=data.title;document.querySelector('#finder-result-copy').textContent=data.copy;document.querySelector('#finder-result-label').textContent=guideSelection.equipment.toUpperCase();document.querySelector('#finder-result').hidden=false;});
document.querySelector('#finder-request').addEventListener('click',()=>startRequest(guideSelection.service,`${guideSelection.equipment}: `));
const careChecks=[...document.querySelectorAll('[name=care-equipment]')];const careWindow=document.querySelector('#care-window');const buildPlan=document.querySelector('#build-plan');
function selectedEquipment(){return careChecks.filter(i=>i.checked).map(i=>i.value);}
function updateBrief(){const chosen=selectedEquipment();document.querySelector('#care-count').textContent=chosen.length;document.querySelector('#care-summary').textContent=chosen.length?chosen.join(' · '):'Choose at least one equipment area above.';document.querySelector('#care-time').textContent=`Preferred window: ${careWindow.value}`;buildPlan.disabled=chosen.length===0;}
careChecks.forEach(i=>i.addEventListener('change',updateBrief));careWindow.addEventListener('change',updateBrief);updateBrief();buildPlan.addEventListener('click',()=>{const selected=selectedEquipment();if(!selected.length)return;startRequest('Maintenance',`Care plan for: ${selected.join(', ')}. Preferred service window: ${careWindow.value}.`);});

if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('waiting');observer.unobserve(entry.target);}}),{threshold:.08,rootMargin:'0px 0px 20px 0px'});document.querySelectorAll('.reveal').forEach(el=>{el.classList.add('waiting');observer.observe(el);});root.classList.add('js-ready');const mediaObserver=new IntersectionObserver(entries=>{filmInView=entries[0].isIntersecting;if(filmInView)playBackground();else film.pause();},{threshold:.1});mediaObserver.observe(film);const chapterLinks=[...document.querySelectorAll('.chapter-nav a')];const chapterObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)chapterLinks.forEach(a=>a.classList.toggle('active',a.hash===`#${entry.target.id}`));}),{rootMargin:'-15% 0px -60% 0px'});chapterLinks.forEach(a=>chapterObserver.observe(document.querySelector(a.hash)));}
const stage=document.querySelector('#film-stage');const chapterNav=document.querySelector('.chapter-nav');let scrolling=false;
function scrollFrame(){chapterNav.classList.toggle('visible',scrollY>innerHeight*.85);if(!paused&&innerWidth>620){const rect=stage.getBoundingClientRect();if(rect.top<innerHeight&&rect.bottom>0){const p=Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight+rect.height)));const radius=Math.round(140-p*95);stage.style.borderRadius=`${radius}px ${radius}px 8px 8px`;}}scrolling=false;}
window.addEventListener('scroll',()=>{if(!scrolling){scrolling=true;requestAnimationFrame(scrollFrame);}},{passive:true});scrollFrame();
if(matchMedia('(pointer:fine) and (hover:hover)').matches)stage.addEventListener('pointermove',e=>{if(paused)return;const r=stage.getBoundingClientRect();stage.style.setProperty('--cx',`${e.clientX-r.left}px`);stage.style.setProperty('--cy',`${e.clientY-r.top}px`);},{passive:true});
