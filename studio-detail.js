'use strict';
window.studioWebURL=function(value,host){
 try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&(!host||u.hostname===host||u.hostname.endsWith('.'+host))?u.href:'';}catch{return '';}
};
window.studioImage=function(s){
 const value=s.image_data||'';
 const safe=/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(value)?value:'';
 return safe?'<img src="'+escapeHTML(safe)+'" alt="'+escapeHTML((s.image_kind==='illustration'?'Illustration for ':'')+s.name)+'" loading="lazy">':'<span class="studio-monogram" aria-hidden="true">'+escapeHTML(s.name.split(/\s+/).slice(0,2).map(w=>w[0]).join(''))+'</span>';
};
window.createStudioDetail=function({entries,select,favorites,draw}){
 const host=document.createElement('section');host.id='studio-detail';host.hidden=true;host.setAttribute('aria-label','Studio details');document.querySelector('.studios-content').append(host);
 let currentId=null;
 function back(){host.hidden=true;document.body.classList.remove('viewing-studio');document.querySelector('#studio-results').hidden=false;history.replaceState(null,'',location.pathname+location.search);requestAnimationFrame(()=>document.querySelector('[data-select="'+currentId+'"]')?.focus());}
 function external(url,label,cls=''){return '<a class="'+cls+'" href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer">'+label+' <span aria-hidden="true">&#8599;</span></a>';}
 function display(id,push=true){
  const s=entries.find(s=>s.id===id);if(!s)return;currentId=id;
  if(push&&location.hash!=='#studio-'+id)history.pushState(null,'','#studio-'+id);
  document.querySelector('#studio-results').hidden=true;host.hidden=false;document.body.classList.add('viewing-studio');
  const fb=studioWebURL(s.facebook,'facebook.com'),ig=studioWebURL(s.instagram,'instagram.com');
  const phone=(s.phone||'').replace(/[^\d+]/g,'');const canCall=/^\+?\d{7,15}$/.test(phone);
  const directions=s.point?'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(s.point.join(',')):'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(s.name+' '+(s.address||s.city));
  const source=s.listing_source, sourceURL=studioWebURL(source?.contact_url), pinURL=studioWebURL(source?.pin_url);
  host.innerHTML='<header class="detail-heading"><button class="detail-back" id="detail-back">&#8592; Back to studios</button><p class="eyebrow">'+escapeHTML(s.city)+' &middot; CAVITE</p><h1 tabindex="-1">'+escapeHTML(s.name)+'</h1><p class="detail-address">'+escapeHTML(s.address||s.city)+'</p><div class="detail-tools"><button id="detail-save" aria-pressed="'+favorites.has(id)+'">'+(favorites.has(id)?'Saved Studio':'Save Studio')+'</button><button id="detail-share">Copy link</button></div></header>'+
  '<div class="detail-left"><div class="detail-cover">'+studioImage(s)+'<span class="detail-cover-caption">'+escapeHTML(s.name)+'</span></div><section class="detail-about"><h2>A little about the studio</h2><p>'+escapeHTML(s.description||'Contact the studio to learn more about its lash services and appointments.')+'</p>'+(Number(s.is_demo)?'<p>Sample listing</p>':'')+'</section><section class="detail-services"><h2>Explore their lash styles</h2><div class="detail-tags">'+s.specialties.map(t=>'<span>'+escapeHTML(t)+'</span>').join('')+'</div><p>Contact the studio for availability and pricing.</p></section></div>'+
  '<aside class="detail-right"><section class="detail-contact"><p class="eyebrow">PLAN YOUR VISIT</p><h2>Let&#39;s get in touch</h2><div class="contact-row"><span>Cellphone</span>'+(canCall?'<a href="tel:'+phone+'">'+escapeHTML(s.phone)+'</a>':escapeHTML(s.phone||'Not provided'))+'</div><div class="contact-row"><span>Facebook</span>'+(fb?external(fb,'Visit Facebook page'):escapeHTML(s.facebook||'Not provided'))+'</div>'+(ig?'<div class="contact-row"><span>Instagram</span>'+external(ig,'Visit Instagram')+'</div>':'')+'<div class="contact-row"><span>Studio address</span><p>'+escapeHTML(s.address||s.city)+'</p></div><div class="detail-contact-actions">'+(canCall?'<a class="contact-primary" href="tel:'+phone+'">Call studio</a>':'')+(fb?external(fb,'Facebook','contact-secondary'):'')+'</div></section><section class="detail-location"><h2>Find your way here</h2><p>'+(s.point?'Open directions to the listed studio pin.':'An exact pin has not been provided. Search the published address on Maps.')+'</p>'+external(directions,s.point?'Get directions':'Search address','directions-link')+'<button id="detail-map" '+(!s.point?'disabled':'')+'>View pin on LashMatch</button>'+(sourceURL?'<p class="detail-source">Contact details: '+external(sourceURL,escapeHTML(source.contact_label||'Studio booking page'))+'. Checked '+escapeHTML(source.checked)+'.</p>':'')+(pinURL?'<p class="detail-source">Pin source: '+external(pinURL,'Public directory listing')+'. Confirm the entrance with the studio before travelling.</p>':'')+'</section></aside>';
  document.querySelector('#detail-back').onclick=back;
  document.querySelector('#detail-map').onclick=()=>{back();select(id);document.querySelector('#studio-map').scrollIntoView({block:'center'});};
  document.querySelector('#detail-save').onclick=async e=>{const button=e.currentTarget;button.disabled=true;const next=new Set(favorites);next.has(id)?next.delete(id):next.add(id);try{await SavedItems.save('studios',user.id,[...next]);favorites.clear();next.forEach(x=>favorites.add(x));button.textContent=favorites.has(id)?'Saved Studio':'Save Studio';button.setAttribute('aria-pressed',String(favorites.has(id)));draw();}catch(error){toast(error.message);}finally{button.disabled=false;}};
  document.querySelector('#detail-share').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);toast('Studio link copied.');}catch{toast('Copy the address from your browser to share this studio.');}};
  host.scrollTop=0;host.querySelector('h1').focus();
 }
 addEventListener('popstate',()=>{const match=location.hash.match(/^#studio-(\d+)$/);if(match)display(Number(match[1]),false);else back();});return display;
};
