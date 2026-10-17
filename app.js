(function(){
"use strict";
var CITY={"Toshkent":[41.30,69.24],"Samarqand":[39.65,66.96],"Buxoro":[39.77,64.42],"Farg‘ona":[40.38,71.78],"Andijon":[40.78,72.34],"Namangan":[41.00,71.67],"Nukus":[42.46,59.61],"Qarshi":[38.86,65.79],"Termiz":[37.22,67.28],"Urganch":[41.55,60.63],"Jizzax":[40.12,67.84],"Navoiy":[40.10,65.37],"Guliston":[40.49,68.78],"Qo‘qon":[40.53,70.94]};
var NAMES=Object.keys(CITY);
var TRUCKS=["Tentli","Refrijerator","Izotermik","Ochiq platforma","Samosval","Sisterna","Konteyner"];
var MON=["yan","fev","mar","apr","may","iyn","iyl","avg","sen","okt","noy","dek"];
var LABEL={open:"Ochiq",offered:"Taklif kelgan",assigned:"Haydovchi tanlandi",transit:"Yo‘lda",done:"Yetkazildi"};
var ROLE={shipper:"Yuk egasi",driver:"Haydovchi",admin:"Administrator"};
var KEY="yukbor.v2",SKEY="yukbor.session";

function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function money(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g," ")}
function rid(){return Math.random().toString(36).slice(2,9)}
function dist(a,b){
  var p=CITY[a],q=CITY[b]; if(!p||!q||a===b) return 0;
  var r=Math.PI/180,dl=(q[0]-p[0])*r,dn=(q[1]-p[1])*r;
  var h=Math.sin(dl/2)*Math.sin(dl/2)+Math.cos(p[0]*r)*Math.cos(q[0]*r)*Math.sin(dn/2)*Math.sin(dn/2);
  return Math.max(10,Math.round(2*6371*Math.asin(Math.sqrt(h))*1.25/10)*10);
}
function iso(n){var d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function dateLabel(s){
  var a=s.split("-").map(Number),t=new Date(),base=new Date(t.getFullYear(),t.getMonth(),t.getDate()),x=new Date(a[0],a[1]-1,a[2]);
  var diff=Math.round((x-base)/864e5);
  if(diff===0) return "Bugun"; if(diff===1) return "Ertaga";
  return a[2]+"-"+MON[a[1]-1];
}
function timeLabel(ms){var d=new Date(ms);return d.getDate()+"-"+MON[d.getMonth()]+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")}

/* ---------- accounts ---------- */
function cyrb53(str,seed){
  var h1=0xdeadbeef^seed,h2=0x41c6ce57^seed;
  for(var i=0,ch;i<str.length;i++){ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
  h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return (4294967296*(2097151&h2)+(h1>>>0)).toString(36);
}
function hashPw(pw,salt){var h=pw+"|"+salt;for(var i=0;i<40;i++)h=cyrb53(h,i);return h}
function keyOf(s){s=String(s||"").trim().toLowerCase();if(!s)return"";if(s.indexOf("@")>-1)return s;var d=s.replace(/\D/g,"");return d.length>=9?d.slice(-9):s}
function keysFor(phone,email){return [keyOf(phone),keyOf(email)].filter(Boolean)}

function seed(){
  var n=0,day=864e5,hour=36e5;
  function U(id,role,name,phone,email,pw,ago,x){var salt=rid();return Object.assign({id:id,role:role,name:name,phone:phone,email:email,keys:keysFor(phone,email),salt:salt,hash:hashPw(pw,salt),blocked:false,created:Date.now()-ago*day,demo:true},x||{})}
  function O(d,name,price,note,x){return Object.assign({id:"o"+(++n),driverId:d,userId:"u"+d,name:name,price:price,note:note,accepted:false},x||{})}
  var users=[
    U("u-admin","admin","Administrator","","admin@yukbor.uz","admin123",60,{pwDefault:true}),
    U("us1","shipper","Demo yuk egasi","+998 91 000 00 03","shipper@demo.uz","demo123",30),
    U("us2","shipper","Nodira Q.","+998 91 000 00 02","","x"+rid(),24),
    U("us3","shipper","Malika T.","+998 91 000 00 05","","x"+rid(),18),
    U("us4","shipper","Sardor B.","+998 91 000 00 04","","x"+rid(),12),
    U("us5","shipper","Hamid Neft Savdo","+998 91 000 00 09","","x"+rid(),9)
  ];
  var dd=[
    {id:"d1",name:"Bahodir A.",plate:"01 A 482 BA",truck:"Tentli",cap:20,base:"Toshkent",routes:["Samarqand","Buxoro","Navoiy"],rating:4.8,trips:214,verified:true,avail:true,phone:"+998 90 000 00 01"},
    {id:"d2",name:"Jasur T.",plate:"30 B 117 CA",truck:"Samosval",cap:25,base:"Samarqand",routes:["Toshkent","Termiz","Qarshi"],rating:4.6,trips:156,verified:true,avail:true,phone:"+998 90 000 00 02"},
    {id:"d3",name:"Dilshod R.",plate:"40 D 903 EA",truck:"Izotermik",cap:8,base:"Farg‘ona",routes:["Toshkent","Andijon","Namangan"],rating:4.9,trips:302,verified:true,avail:true,phone:"+998 90 000 00 03"},
    {id:"d4",name:"Rustam K.",plate:"20 A 276 AA",truck:"Refrijerator",cap:12,base:"Urganch",routes:["Toshkent","Nukus"],rating:4.7,trips:98,verified:true,avail:true,phone:"+998 90 000 00 04"},
    {id:"d5",name:"Otabek S.",plate:"80 B 555 DA",truck:"Ochiq platforma",cap:22,base:"Buxoro",routes:["Navoiy","Toshkent","Qarshi"],rating:4.5,trips:121,verified:false,avail:false,phone:"+998 90 000 00 05"},
    {id:"d6",name:"Sherzod M.",plate:"60 C 340 FA",truck:"Tentli",cap:15,base:"Andijon",routes:["Toshkent","Farg‘ona","Namangan"],rating:4.4,trips:67,verified:true,avail:true,phone:"+998 90 000 00 06"},
    {id:"d7",name:"Azamat N.",plate:"01 C 618 KA",truck:"Sisterna",cap:22,base:"Toshkent",routes:["Qarshi","Termiz","Buxoro"],rating:4.7,trips:143,verified:true,avail:true,phone:"+998 90 000 00 07"}
  ];
  var drivers=dd.map(function(d,i){
    users.push(U("u"+d.id,"driver",d.name,d.phone,d.id==="d1"?"driver@demo.uz":"",d.id==="d1"?"demo123":"x"+rid(),20-i*2));
    d.userId="u"+d.id;return d;
  });
  var loads=[
    {id:"l1",ownerId:"us2",from:"Toshkent",to:"Samarqand",cargo:"Qurilish g‘ishti, 18 paddon",weight:18,truck:"Tentli",price:5200000,date:iso(2),phone:"+998 91 000 00 02",status:"open",offers:[O("d1","Bahodir A.",5000000,"Ertaga ertalab yuklashga tayyor."),O("d6","Sherzod M.",5400000,"Yo‘lda ikkinchi yuk olaman, shuning uchun biroz yuqori.")]},
    {id:"l2",ownerId:"us3",from:"Farg‘ona",to:"Toshkent",cargo:"Quritilgan mevalar, 600 quti",weight:6,truck:"Izotermik",price:2400000,date:iso(1),phone:"+998 91 000 00 05",status:"open",offers:[O("d3","Dilshod R.",2300000,"Haroratni +8° da ushlab turaman.")]},
    {id:"l3",ownerId:"us1",from:"Buxoro",to:"Toshkent",cargo:"Paxta tolasi toylari",weight:20,truck:"Tentli",price:7800000,date:iso(3),phone:"+998 91 000 00 03",status:"open",offers:[O("d5","Otabek S.",7600000,"Buxoroda turibman, istalgan vaqt yuklayman."),O("d1","Bahodir A.",8100000,"Qaytishda Navoiydan o‘taman.")]},
    {id:"l4",ownerId:"us4",from:"Toshkent",to:"Nukus",cargo:"Maishiy texnika, 40 ta",weight:8,truck:"Tentli",price:9600000,date:iso(4),phone:"+998 91 000 00 04",status:"assigned",offers:[O("d4","Rustam K.",9400000,"Nukusga qaytayotgan edim.",{accepted:true})]},
    {id:"l5",ownerId:"us3",from:"Andijon",to:"Toshkent",cargo:"Sut mahsulotlari",weight:10,truck:"Refrijerator",price:4100000,date:iso(0),phone:"+998 91 000 00 05",status:"transit",offers:[O("d3","Dilshod R.",4100000,"Yuklangan, yo‘ldaman.",{accepted:true})]},
    {id:"l6",ownerId:"us1",from:"Samarqand",to:"Termiz",cargo:"Bug‘doy, 24 tonna",weight:24,truck:"Samosval",price:6900000,date:iso(2),phone:"+998 91 000 00 03",status:"open",offers:[O("d2","Jasur T.",6700000,"Samosvalim bo‘sh, ertaga chiqaman.")]},
    {id:"l7",ownerId:"us2",from:"Toshkent",to:"Urganch",cargo:"Mebel jihozlari",weight:12,truck:"Tentli",price:11500000,date:iso(5),phone:"+998 91 000 00 02",status:"open",offers:[O("d4","Rustam K.",11000000,"Urganchga qaytaman, shu kuni chiqaman.")]},
    {id:"l8",ownerId:"us4",from:"Navoiy",to:"Toshkent",cargo:"Mineral o‘g‘it",weight:25,truck:"Ochiq platforma",price:5800000,date:iso(-2),phone:"+998 91 000 00 04",status:"done",offers:[O("d5","Otabek S.",5700000,"Yetkazdim.",{accepted:true})]},
    {id:"l9",ownerId:"us5",from:"Toshkent",to:"Qarshi",cargo:"Benzin, AI-92",weight:22,truck:"Sisterna",price:8400000,date:iso(1),phone:"+998 91 000 00 09",status:"open",offers:[]},
    {id:"l10",ownerId:"us3",from:"Namangan",to:"Toshkent",cargo:"Konserva mahsulotlari, 24 paddon",weight:14,truck:"Tentli",price:3600000,date:iso(3),phone:"+998 91 000 00 05",status:"open",offers:[]}
  ];
  return {
    users:users,loads:loads,drivers:drivers,invites:[],seq:100,
    messages:[
      {id:"m1",name:"Aziza",contact:"+998 93 000 00 11",text:"Yuk joylash uchun to‘lov bormi? Va haydovchilar qanday tekshiriladi?",at:Date.now()-3*hour,read:false,userId:null},
      {id:"m2",name:"Komil",contact:"komil@example.uz",text:"Termiz yo‘nalishida sisterna haydovchilar kerak.",at:Date.now()-30*hour,read:true,userId:null}
    ],
    log:[
      {at:Date.now()-2*hour,text:"Yangi yuk joylandi: Toshkent → Qarshi"},
      {at:Date.now()-5*hour,text:"Yangi taklif: Rustam K. — Toshkent → Urganch"},
      {at:Date.now()-day,text:"Haydovchi tanlandi: Toshkent → Nukus"},
      {at:Date.now()-2*day,text:"Yuk yetkazildi: Navoiy → Toshkent"}
    ],
    settings:{registration:true,autoVerify:false,banner:""}
  };
}
var S=(function(){try{var r=localStorage.getItem(KEY);if(r){var p=JSON.parse(r);if(p&&p.users&&p.loads&&p.drivers&&p.settings)return p}}catch(e){}return seed()})();
var sessionId=(function(){try{return localStorage.getItem(SKEY)||null}catch(e){return null}})();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function saveSession(){try{if(sessionId)localStorage.setItem(SKEY,sessionId);else localStorage.removeItem(SKEY)}catch(e){}}
function uid(p){S.seq=(S.seq||100)+1;return p+S.seq+rid().slice(0,3)}
function log(text){S.log.unshift({at:Date.now(),text:text});S.log=S.log.slice(0,30)}
function userById(id){return S.users.filter(function(u){return u.id===id})[0]}
function cur(){var u=userById(sessionId);return (u&&!u.blocked)?u:null}
function loadById(id){return S.loads.filter(function(l){return l.id===id})[0]}
function driverById(id){return S.drivers.filter(function(d){return d.id===id})[0]}
function myDriver(){var u=cur();return u?S.drivers.filter(function(d){return d.userId===u.id})[0]:null}
function isBlocked(id){var u=userById(id);return !!(u&&u.blocked)}
function userName(id){var u=userById(id);return u?u.name:"—"}
function stKey(l){return (l.status==="open"&&l.offers.length)?"offered":l.status}
function findByKeys(keys,exceptId){return S.users.filter(function(u){return u.id!==exceptId&&u.keys.some(function(k){return keys.indexOf(k)>-1})})[0]}
function opts(list,ph,sel){return (ph!==null?'<option value="">'+ph+'</option>':'')+list.map(function(v){return '<option'+(v===sel?' selected':'')+'>'+esc(v)+'</option>'}).join("")}
function routeChecks(id,sel){return '<div class="checks" id="'+id+'">'+NAMES.map(function(n){return '<label class="check"><input type="checkbox" value="'+esc(n)+'"'+((sel||[]).indexOf(n)>-1?' checked':'')+'> '+esc(n)+'</label>'}).join("")+'</div>'}
function fieldVal(id){return ($("#"+id).value||"").trim()}
function validEmail(s){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)}
function phoneOk(s){return s.replace(/\D/g,"").length>=9}

/* ---------- ui state ---------- */
var view="loads",authMode="login",regRole="shipper",authNote="",pending=null,ctab="",atab="overview",adminAdd=false,adminNote="";
var F={from:"",to:"",truck:"",status:"open",sort:"new",maxw:""},DF={base:"",truck:"",route:"",avail:true},AF={q:"",role:"",status:"",flag:""};
var lastFocus=null,openId=null,ARM={},revealed={};
var toastTimer;
function toast(msg){var t=$("#toast");t.textContent=msg;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.hidden=true},2800)}
function copy(text){
  var fail=function(){toast("Matnni belgilab nusxalang")};
  try{ if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){toast("Nusxalandi")},fail);return} }catch(e){}
  fail();
}
function ab(key,act,label,cls,attrs){return '<button class="btn small'+(ARM[key]?' danger':'')+(cls?' '+cls:'')+'" data-act="'+act+'" data-arm="'+key+'" '+(attrs||'')+'>'+(ARM[key]?'Tasdiqlang':label)+'</button>'}

/* ---------- header ---------- */
function inviteOpen(i){var l=loadById(i.loadId);return !!(l&&l.status==="open"&&!l.offers.some(function(o){return o.driverId===i.driverId}))}
function renderHeader(){
  var u=cur(),tabs=[["loads","Yuklar"],["drivers","Haydovchilar"]],badge={};
  if(u&&u.role==="shipper"){tabs.push(["cabinet","Kabinet"]);badge.cabinet=S.loads.filter(function(l){return l.ownerId===u.id&&l.status==="open"&&l.offers.length}).length}
  if(u&&u.role==="driver"){tabs.push(["cabinet","Kabinet"]);var d=myDriver();badge.cabinet=d?S.invites.filter(function(i){return i.driverId===d.id&&inviteOpen(i)}).length:0}
  if(u&&u.role==="admin"){tabs.push(["admin","Admin panel"]);badge.admin=S.messages.filter(function(m){return !m.read}).length}
  tabs.push(["contact","Aloqa"]);
  $("#hdr-tabs").innerHTML=tabs.map(function(t){return '<button class="tab" data-act="tab" data-v="'+t[0]+'" aria-selected="'+(view===t[0])+'">'+t[1]+(badge[t[0]]?'<span class="count">'+badge[t[0]]+'</span>':'')+'</button>'}).join("");
  var h="";
  if(!u) h='<button class="btn small hdr" data-act="auth" data-m="login">Kirish</button><button class="btn small primary" data-act="auth" data-m="register">Ro‘yxatdan o‘tish</button>';
  else{
    if(u.role==="shipper") h+='<button class="btn small primary" data-act="tab" data-v="post">+ Yuk joylash</button>';
    h+='<button class="userchip" data-act="tab" data-v="'+(u.role==="admin"?"admin":"cabinet")+'" aria-label="Kabinet: '+esc(u.name)+'"><span class="av">'+esc(u.name.charAt(0).toUpperCase())+'</span><span class="nm">'+esc(u.name)+'</span></button><button class="btn small hdr" data-act="logout">Chiqish</button>';
  }
  $("#hdr-acts").innerHTML=h;
}
function renderBanner(){var b=S.settings.banner;$("#banner").hidden=!b;$("#banner-text").textContent=b||""}

/* ---------- loads ---------- */
function statusMatch(l){
  if(F.status==="all") return true;
  if(F.status==="open") return l.status==="open";
  if(F.status==="active") return l.status==="assigned"||l.status==="transit";
  return l.status==="done";
}
function filteredLoads(){
  var a=S.loads.filter(function(l){
    return !isBlocked(l.ownerId)&&(!F.from||l.from===F.from)&&(!F.to||l.to===F.to)&&(!F.truck||l.truck===F.truck)&&(!F.maxw||l.weight<=Number(F.maxw))&&statusMatch(l);
  });
  if(F.sort==="price") a.sort(function(x,y){return x.price-y.price});
  if(F.sort==="weight") a.sort(function(x,y){return y.weight-x.weight});
  if(F.sort==="date") a.sort(function(x,y){return x.date<y.date?-1:x.date>y.date?1:0});
  return a;
}
function routeHtml(l){return '<div class="route"><span>'+esc(l.from)+'</span><i class="arrow" aria-hidden="true"></i><span>'+esc(l.to)+'</span></div>'}
function loadCard(l){
  var k=dist(l.from,l.to),st=stKey(l),u=cur(),mine=u&&l.ownerId===u.id;
  return '<article class="card load" tabindex="0" role="button" data-act="open-load" data-id="'+l.id+'" aria-label="'+esc(l.from)+' dan '+esc(l.to)+' ga, batafsil">'+
    '<div class="load-top"><span class="pill '+st+'">'+LABEL[st]+'</span><span class="date">'+dateLabel(l.date)+'</span></div>'+
    routeHtml(l)+'<p class="cargo">'+esc(l.cargo)+'</p>'+
    '<div class="chips"><span class="chip mono">'+l.weight+' t</span><span class="chip">'+esc(l.truck)+'</span><span class="chip mono">~'+k+' km</span>'+(mine?'<span class="verified me">Sizniki</span>':'')+'</div>'+
    '<div class="load-bot"><div><div class="price mono">'+money(l.price)+' <small>so‘m</small></div><div class="ppk">'+money(Math.round(l.price/k/10)*10)+' so‘m/km</div></div>'+
    '<span class="offers">'+l.offers.length+' taklif</span></div></article>';
}
function renderLoads(){
  var a=filteredLoads();
  $("#loads-count").textContent=a.length+" ta yuk topildi";
  $("#loads-list").innerHTML=a.length?a.map(loadCard).join(""):'<div class="empty" style="grid-column:1/-1"><h3>Yuk topilmadi</h3><p>Shu filtr bo‘yicha yuk yo‘q. Boshqa shahar yoki mashina turini tanlang.</p><button class="btn" data-act="clear-filters">Filtrni tozalash</button></div>';
}

/* ---------- drivers ---------- */
function filteredDrivers(){
  return S.drivers.filter(function(d){
    return !isBlocked(d.userId)&&(!DF.base||d.base===DF.base)&&(!DF.truck||d.truck===DF.truck)&&(!DF.route||d.routes.indexOf(DF.route)>-1||d.base===DF.route)&&(!DF.avail||d.avail);
  });
}
function driverCard(d,cabinet){
  var u=cur(),mine=u&&d.userId===u.id,invited=S.invites.some(function(i){return i.driverId===d.id&&S.loads.some(function(l){return l.id===i.loadId&&u&&l.ownerId===u.id})});
  var shown=u&&revealed["d"+d.id],act="";
  if(shown) act+='<span class="phone">'+esc(d.phone)+'</span><button class="btn small" data-act="copy" data-t="'+esc(d.phone)+'">Nusxalash</button>';
  else act+='<button class="btn small" data-act="'+(u?'reveal':'gate-auth')+'" data-k="d'+d.id+'">Raqamni ko‘rish</button>';
  if(mine&&!cabinet) act+='<button class="btn small" data-act="tab" data-v="cabinet">Kabinetim</button>';
  else if(!mine&&(!u||u.role==="shipper")) act+=invited?'<button class="btn small" disabled>Taklif yuborildi</button>':'<button class="btn small primary" data-act="invite" data-id="'+d.id+'">Yuk taklif qilish</button>';
  return '<article class="card driver">'+
    '<div class="driver-top"><div><h3>'+esc(d.name)+(d.verified?' <span class="verified">Tasdiqlangan</span>':'')+(mine?' <span class="verified me">Siz</span>':'')+'</h3>'+
    '<div class="row" style="margin-top:6px"><span class="plate">'+esc(d.plate)+'</span></div></div>'+
    '<span class="pill '+(d.avail?'open':'done')+'">'+(d.avail?'Bo‘sh':'Band')+'</span></div>'+
    '<dl class="facts"><div><dt>Mashina</dt><dd>'+esc(d.truck)+'</dd></div><div><dt>Sig‘im</dt><dd class="mono">'+d.cap+' t</dd></div>'+
    '<div><dt>Turgan joyi</dt><dd>'+esc(d.base)+'</dd></div><div><dt>Reyting</dt><dd class="mono">'+Number(d.rating).toFixed(1)+' · '+d.trips+' reys</dd></div></dl>'+
    '<div class="chips">'+d.routes.map(function(r){return '<span class="chip">'+esc(r)+'</span>'}).join("")+'</div>'+
    '<div class="actions">'+act+'</div></article>';
}
function renderDrivers(){
  var a=filteredDrivers();
  $("#drivers-count").textContent=a.length+" ta haydovchi";
  $("#drivers-list").innerHTML=a.length?a.map(function(d){return driverCard(d)}).join(""):'<div class="empty" style="grid-column:1/-1"><h3>Haydovchi topilmadi</h3><p>Filtrni kengaytiring yoki “Faqat bo‘shlari” belgisini olib tashlang.</p></div>';
}

/* ---------- modal ---------- */
function openModal(title,html){
  lastFocus=document.activeElement;
  $("#sheet-title").textContent=title;$("#sheet-body").innerHTML=html;
  $("#overlay").hidden=false;document.body.style.overflow="hidden";
  var x=$(".xbtn");if(x)x.focus();
}
function closeModal(){
  if($("#overlay").hidden) return;
  $("#overlay").hidden=true;document.body.style.overflow="";openId=null;
  if(lastFocus&&lastFocus.focus){try{lastFocus.focus()}catch(e){}}
}
function openLoad(id,keepFocus){
  var l=loadById(id);if(!l)return;
  openId=id;
  var u=cur(),owner=u&&l.ownerId===u.id,adm=u&&u.role==="admin",drv=(u&&u.role==="driver")?myDriver():null;
  var k=dist(l.from,l.to),st=stKey(l);
  var idx={open:0,offered:0,assigned:1,transit:2,done:3}[st];
  var steps=["Joylandi","Tanlandi","Yo‘lda","Yetkazildi"];
  var h='<div class="row"><span class="pill '+st+'">'+LABEL[st]+'</span><span class="date">Yuklash: '+dateLabel(l.date)+'</span>'+(owner?'<span class="verified me">Sizniki</span>':'')+'</div>'+
    routeHtml(l)+
    '<ol class="steps" aria-label="Yuk holati">'+steps.map(function(s,i){return '<li class="'+(i<idx?'done':i===idx?'now':'')+'">'+s+'</li>'}).join("")+'</ol>'+
    '<dl class="facts"><div><dt>Yuk</dt><dd>'+esc(l.cargo)+'</dd></div><div><dt>Og‘irlik</dt><dd class="mono">'+l.weight+' t</dd></div>'+
    '<div><dt>Mashina turi</dt><dd>'+esc(l.truck)+'</dd></div><div><dt>Masofa</dt><dd class="mono">~'+k+' km</dd></div>'+
    '<div><dt>Narx</dt><dd class="mono">'+money(l.price)+' so‘m</dd></div><div><dt>Kilometriga</dt><dd class="mono">'+money(Math.round(l.price/k/10)*10)+' so‘m</dd></div>'+
    '<div><dt>Yuk egasi</dt><dd>'+esc(userName(l.ownerId))+'</dd></div></dl>';
  var offers=l.offers.slice().sort(function(a,b){return a.price-b.price});
  h+='<div><h3 class="lbl" style="margin-bottom:8px">Takliflar ('+offers.length+')</h3>';
  if(!offers.length) h+='<p class="subtle">Hali taklif yo‘q.</p>';
  else h+='<div class="stack">'+offers.map(function(o){
    var me=u&&o.userId===u.id;
    return '<div class="offer'+(o.accepted?' acc':'')+'"><div><b>'+esc(o.name)+'</b>'+(me?' <span class="verified me">Siz</span>':'')+(o.accepted?' <span class="verified">Tanlangan</span>':'')+'</div>'+
      '<div class="row"><span class="mono">'+money(o.price)+' so‘m</span>'+((owner&&l.status==="open")?'<button class="btn small primary" data-act="accept" data-l="'+l.id+'" data-o="'+o.id+'">Qabul qilish</button>':'')+(adm?'<button class="btn small danger" data-act="del-offer" data-l="'+l.id+'" data-o="'+o.id+'">O‘chirish</button>':'')+'</div>'+
      (o.note?'<div class="note">'+esc(o.note)+'</div>':'')+'</div>'}).join("")+'</div>';
  h+='</div>';
  if(owner&&l.status==="assigned") h+='<button class="btn primary" data-act="advance" data-l="'+l.id+'">Yuk yuklandi, yo‘lga chiqdi</button>';
  if(owner&&l.status==="transit") h+='<button class="btn primary" data-act="advance" data-l="'+l.id+'">Yetkazildi deb belgilash</button>';
  if(adm){
    h+='<div class="stack"><span class="lbl">Administrator boshqaruvi</span><div class="row"><select class="input" style="width:auto" data-adm="status" data-id="'+l.id+'" aria-label="Holat">'+["open","assigned","transit","done"].map(function(s){return '<option value="'+s+'"'+(l.status===s?' selected':'')+'>'+LABEL[s]+'</option>'}).join("")+'</select>'+ab("del-load:"+l.id,"del-load","Yukni o‘chirish","","data-id=\""+l.id+"\"")+'</div></div>';
  }
  if(!owner&&!adm&&l.status==="open"){
    if(!u) h+='<div class="note-box">Taklif berish uchun haydovchi sifatida kiring. <button class="btn small" data-act="gate-auth" style="margin-left:8px">Kirish</button></div>';
    else if(u.role==="shipper") h+='<p class="subtle">Taklif berish haydovchi hisobi uchun. Siz yuk egasi sifatida kirgansiz.</p>';
    else if(u.role==="driver"){
      if(!drv) h+='<p class="subtle">Taklif berish uchun avval kabinetda mashina ma‘lumotlarini to‘ldiring.</p>';
      else if(l.offers.some(function(o){return o.driverId===drv.id})) h+='<p class="subtle">Siz bu yukka taklif yuborgansiz.</p>';
      else h+='<form class="form" style="grid-template-columns:1fr 1fr;max-width:none" data-form="offer" data-l="'+l.id+'" novalidate><h3 class="lbl full">Taklif berish</h3>'+
        '<div class="field"><label for="o-price">Narxingiz (so‘m)</label><input class="input mono" id="o-price" type="number" min="100000" step="50000" inputmode="numeric" value="'+l.price+'"></div>'+
        '<div class="field"><label for="o-note">Izoh</label><input class="input" id="o-note" maxlength="140" placeholder="Qachon yuklay olasiz?"></div>'+
        '<div class="full err" id="o-err" role="alert"></div><div class="full"><button class="btn primary" type="submit">Taklif yuborish</button></div></form>';
    }
  }
  var key="l"+l.id;
  if(!u) h+='<div class="row"><button class="btn small" data-act="gate-auth">Yuk egasining raqamini ko‘rish uchun kiring</button></div>';
  else h+='<div class="row">'+(revealed[key]?'<span class="phone">'+esc(l.phone)+'</span><button class="btn small" data-act="copy" data-t="'+esc(l.phone)+'">Nusxalash</button>':'<button class="btn small" data-act="reveal" data-k="'+key+'" data-l="'+l.id+'">Yuk egasining raqamini ko‘rish</button>')+'</div>';
  if(keepFocus){$("#sheet-title").textContent=l.from+" → "+l.to;$("#sheet-body").innerHTML=h}
  else openModal(l.from+" → "+l.to,h);
}
function openInvite(did){
  var d=driverById(did),u=cur();if(!d)return;
  if(!u) return gate("Haydovchiga yuk taklif qilish uchun yuk egasi sifatida kiring.",null);
  if(u.role!=="shipper") return toast("Yuk taklif qilish yuk egalari uchun");
  var mine=S.loads.filter(function(l){return l.ownerId===u.id&&l.status==="open"});
  var h;
  if(!mine.length) h='<p>Taklif yuborish uchun avval ochiq yuk joylashingiz kerak.</p><div><button class="btn primary" data-act="close-go-post">Yuk joylash</button></div>';
  else h='<p class="subtle">'+esc(d.name)+' ga qaysi yukni taklif qilmoqchisiz?</p><div class="stack">'+mine.map(function(l){return '<div class="card line">'+routeHtml(l)+'<button class="btn small primary" data-act="send-invite" data-d="'+d.id+'" data-l="'+l.id+'">Yuborish</button></div>'}).join("")+'</div>';
  openModal("Yuk taklif qilish",h);
}

/* ---------- auth ---------- */
function gate(note,target){authNote=note||"";pending=target||null;authMode="login";closeModal();setView("auth")}
function renderAuth(){
  $("#form-login").hidden=authMode!=="login";$("#form-register").hidden=authMode!=="register";
  $$("[data-act=auth-mode]").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.m===authMode))});
  $$("[data-act=reg-role]").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.r===regRole))});
  $("#r-driver").hidden=regRole!=="driver";
  var n=$("#auth-note"),closed=authMode==="register"&&!S.settings.registration;
  var msg=closed?"Ro‘yxatdan o‘tish vaqtincha yopiq. Administrator bilan Aloqa bo‘limi orqali bog‘laning.":authNote;
  n.hidden=!msg;n.textContent=msg;n.className="note-box"+(closed?" warn":"");
  $("#r-submit").disabled=closed;
  $("#auth-info").innerHTML='<h2 class="h3" style="margin:0">'+(authMode==="login"?"Hisobingizga kiring":"Hisob yarating")+'</h2>'+
    '<h3 class="lbl">Yuk egasi</h3><p class="subtle">Yuk joylaydi, takliflarni solishtiradi, haydovchini tanlaydi va yuk holatini kuzatadi.</p>'+
    '<h3 class="lbl">Haydovchi</h3><p class="subtle">Mashinasini ro‘yxatga qo‘yadi, yuklarga narx taklif qiladi va yuk egalaridan taklif oladi.</p>'+
    '<p class="subtle" style="margin-top:12px">Hisoblar shu brauzerda saqlanadi. Bu namuna, haqiqiy to‘lov yoki hujjat so‘ralmaydi.</p>';
}
function startSession(u,target){
  sessionId=u.id;saveSession();pending=null;authNote="";
  toast("Xush kelibsiz, "+u.name);
  setView(target||(u.role==="admin"?"admin":"cabinet"));
}
function doLogin(){
  var k=keyOf(fieldVal("l-login")),pw=$("#l-pass").value,err=$("#l-err");
  var u=S.users.filter(function(x){return x.keys.indexOf(k)>-1})[0];
  if(!k||!pw) return err.textContent="Telefon yoki pochta va parolni kiriting.";
  if(!u||u.hash!==hashPw(pw,u.salt)) return err.textContent="Login yoki parol noto‘g‘ri.";
  if(u.blocked) return err.textContent="Hisobingiz bloklangan. Aloqa bo‘limi orqali administratorga yozing.";
  err.textContent="";$("#form-login").reset();
  log("Kirdi: "+u.name+" ("+ROLE[u.role]+")");save();
  startSession(u,pending);
}
function newUser(role,name,phone,email,pw){
  var salt=rid();
  return {id:uid("u"),role:role,name:name,phone:phone,email:email.toLowerCase(),keys:keysFor(phone,email),salt:salt,hash:hashPw(pw,salt),blocked:false,created:Date.now()};
}
function newDriver(userId,name,phone,x){
  return Object.assign({id:uid("d"),userId:userId,name:name,plate:"",truck:"Tentli",cap:10,base:"Toshkent",routes:[],rating:5,trips:0,verified:!!S.settings.autoVerify,avail:true,phone:phone},x||{});
}
function doRegister(){
  var err=$("#r-err");
  if(!S.settings.registration) return err.textContent="Ro‘yxatdan o‘tish vaqtincha yopiq.";
  var name=fieldVal("r-name"),phone=fieldVal("r-phone"),email=fieldVal("r-email"),pw=$("#r-pass").value,pw2=$("#r-pass2").value;
  if(name.length<2) return err.textContent="Ismingizni yozing.";
  if(!phoneOk(phone)) return err.textContent="Telefon raqamini to‘liq kiriting.";
  if(email&&!validEmail(email)) return err.textContent="Pochta manzili noto‘g‘ri yozilgan.";
  if(pw.length<6) return err.textContent="Parol kamida 6 belgidan iborat bo‘lsin.";
  if(pw!==pw2) return err.textContent="Parollar bir xil emas.";
  var extra=null;
  if(regRole==="driver"){
    var plate=fieldVal("r-plate").toUpperCase(),cap=Number($("#r-cap").value),routes=$$("#r-routes input:checked").map(function(i){return i.value});
    if(plate.length<6) return err.textContent="Davlat raqamini yozing, masalan 01 A 123 BA.";
    if(!(cap>0)||cap>40) return err.textContent="Yuk sig‘imini tonnada kiriting.";
    if(!routes.length) return err.textContent="Kamida bitta shahar belgilang.";
    extra={plate:plate,truck:$("#r-truck").value,cap:cap,base:$("#r-base").value,routes:routes};
  }
  if(!$("#r-terms").checked) return err.textContent="Davom etish uchun shartlarga rozilik bering.";
  var keys=keysFor(phone,email);
  if(findByKeys(keys)) return err.textContent="Bu telefon yoki pochta bilan hisob mavjud. Kirishni tanlang.";
  err.textContent="";
  var u=newUser(regRole,name,phone,email,pw);S.users.push(u);
  if(extra) S.drivers.unshift(newDriver(u.id,name,phone,extra));
  log("Yangi foydalanuvchi: "+name+" ("+ROLE[regRole]+")");save();
  $("#form-register").reset();
  ctab="";startSession(u,pending);
}

/* ---------- cabinet ---------- */
function renderCabinet(){
  var u=cur(),el=$("#cab-body");
  if(!u||u.role==="admin"){el.innerHTML="";return}
  var tabs=u.role==="shipper"?[["loads","Yuklarim"],["profile","Profil"]]:[["offers","Takliflar"],["truck","Mashinam"],["profile","Profil"]];
  if(!tabs.some(function(t){return t[0]===ctab}))ctab=tabs[0][0];
  var h='<div class="page-head"><div><h2>Salom, '+esc(u.name)+'</h2><p>'+ROLE[u.role]+' kabineti</p></div>'+(u.role==="shipper"?'<button class="btn primary" data-act="tab" data-v="post">+ Yangi yuk</button>':'')+'</div>';
  h+='<div class="subtabs" role="tablist">'+tabs.map(function(t){return '<button class="subtab" data-act="ctab" data-t="'+t[0]+'" aria-selected="'+(ctab===t[0])+'">'+t[1]+'</button>'}).join("")+'</div>';
  if(ctab==="loads") h+=cabLoads(u);
  else if(ctab==="offers") h+=cabOffers(u);
  else if(ctab==="truck") h+=cabTruck(u);
  else h+=cabProfile(u);
  el.innerHTML=h;
}
function cabLoads(u){
  var mine=S.loads.filter(function(l){return l.ownerId===u.id});
  var c={open:0,transit:0,done:0};mine.forEach(function(l){if(l.status==="open")c.open++;if(l.status==="transit")c.transit++;if(l.status==="done")c.done++});
  var h='<div class="stats"><div class="stat"><span class="lbl">Jami yuk</span><b>'+mine.length+'</b></div><div class="stat"><span class="lbl">Ochiq</span><b>'+c.open+'</b></div><div class="stat"><span class="lbl">Yo‘lda</span><b>'+c.transit+'</b></div><div class="stat"><span class="lbl">Yetkazilgan</span><b>'+c.done+'</b></div></div>';
  if(!mine.length) return h+'<div class="empty"><h3>Hali yuk yo‘q</h3><p>Birinchi yukni joylang, haydovchilar taklif yuboradi.</p><button class="btn primary" data-act="tab" data-v="post">Yuk joylash</button></div>';
  return h+'<div class="stack">'+mine.map(function(l){var st=stKey(l);return '<div class="card line">'+routeHtml(l)+'<span class="pill '+st+'">'+LABEL[st]+'</span><span class="offers">'+l.offers.length+' taklif</span><span class="row"><button class="btn small" data-act="open-load" data-id="'+l.id+'">Ochish</button>'+ab("del-load:"+l.id,"del-load","O‘chirish","","data-id=\""+l.id+"\"")+'</span></div>'}).join("")+'</div>';
}
function cabOffers(u){
  var d=myDriver(),h="";
  if(!d) return '<div class="empty"><h3>Mashina ma‘lumoti yo‘q</h3><p>Taklif berish uchun mashinangizni qo‘shing.</p><button class="btn primary" data-act="ctab" data-t="truck">Mashinani to‘ldirish</button></div>';
  var inv=S.invites.filter(function(i){return i.driverId===d.id&&inviteOpen(i)});
  h+='<h3 class="h3" style="margin-top:0">Sizga taklif qilingan yuklar</h3>';
  h+=inv.length?'<div class="stack">'+inv.map(function(i){var l=loadById(i.loadId);return '<div class="card line">'+routeHtml(l)+'<span class="mono">'+money(l.price)+' so‘m</span><button class="btn small primary" data-act="open-load" data-id="'+l.id+'">Taklif berish</button></div>'}).join("")+'</div>':'<div class="empty"><p>Hozircha taklif yo‘q. Yuk egalari sizni Haydovchilar bo‘limidan topadi.</p></div>';
  var offered=S.loads.filter(function(l){return l.offers.some(function(o){return o.driverId===d.id})});
  h+='<h3 class="h3">Bergan takliflarim</h3>';
  h+=offered.length?'<div class="stack">'+offered.map(function(l){var o=l.offers.filter(function(x){return x.driverId===d.id})[0];var s=o.accepted?'Qabul qilindi':(l.status==="open"?'Kutilmoqda':'Boshqa haydovchi tanlandi');var cl=o.accepted?'open':(l.status==="open"?'offered':'done');return '<div class="card line">'+routeHtml(l)+'<span class="mono">'+money(o.price)+' so‘m</span><span class="pill '+cl+'">'+s+'</span><button class="btn small" data-act="open-load" data-id="'+l.id+'">Ochish</button></div>'}).join("")+'</div>':'<div class="empty"><p>Siz hali taklif bermadingiz.</p><button class="btn" data-act="tab" data-v="loads">Yuklarni ko‘rish</button></div>';
  return h;
}
function cabTruck(u){
  var d=myDriver();
  if(!d){d=newDriver(u.id,u.name,u.phone);S.drivers.unshift(d);save()}
  return '<div class="two"><div>'+driverCard(d,true)+'</div>'+
  '<form class="card form one" data-form="truck" novalidate>'+
    '<div class="field"><label for="tk-plate">Davlat raqami</label><input class="input mono" id="tk-plate" maxlength="14" value="'+esc(d.plate)+'" placeholder="01 A 123 BA"></div>'+
    '<div class="field"><label for="tk-truck">Mashina turi</label><select class="input" id="tk-truck">'+opts(TRUCKS,null,d.truck)+'</select></div>'+
    '<div class="field"><label for="tk-cap">Yuk sig‘imi (tonna)</label><input class="input mono" id="tk-cap" type="number" min="1" max="40" step="0.5" value="'+d.cap+'"></div>'+
    '<div class="field"><label for="tk-base">Hozir turgan joyi</label><select class="input" id="tk-base">'+opts(NAMES,null,d.base)+'</select></div>'+
    '<div class="field"><label for="tk-phone">Telefon</label><input class="input mono" id="tk-phone" type="tel" maxlength="20" value="'+esc(d.phone)+'"></div>'+
    '<div class="field"><span class="lbl">Qatnaydigan shaharlar</span>'+routeChecks("tk-routes",d.routes)+'</div>'+
    '<div class="err" id="tk-err" role="alert"></div>'+
    '<div class="row"><button class="btn primary" type="submit">Saqlash</button><button type="button" class="btn" data-act="toggle-avail" data-id="'+d.id+'">'+(d.avail?'Bandman deb belgilash':'Bo‘shman deb belgilash')+'</button></div>'+
  '</form></div>';
}
function passwordForm(){
  return '<form class="card form one" data-form="password" novalidate><h3 class="lbl">Parolni almashtirish</h3>'+
    '<div class="field"><label for="pw-old">Joriy parol</label><input class="input" id="pw-old" type="password" autocomplete="current-password" maxlength="60"></div>'+
    '<div class="field"><label for="pw-new">Yangi parol</label><input class="input" id="pw-new" type="password" autocomplete="new-password" maxlength="60"></div>'+
    '<div class="field"><label for="pw-new2">Yangi parolni takrorlang</label><input class="input" id="pw-new2" type="password" autocomplete="new-password" maxlength="60"></div>'+
    '<div class="err" id="pw-err" role="alert"></div><div><button class="btn primary" type="submit">Parolni yangilash</button></div></form>';
}
function cabProfile(u){
  return '<div class="two"><form class="card form one" data-form="profile" novalidate><h3 class="lbl">Shaxsiy ma‘lumotlar</h3>'+
    '<div class="field"><label for="pf-name">Ism</label><input class="input" id="pf-name" maxlength="40" value="'+esc(u.name)+'"></div>'+
    '<div class="field"><label for="pf-phone">Telefon</label><input class="input mono" id="pf-phone" type="tel" maxlength="20" value="'+esc(u.phone)+'"></div>'+
    '<div class="field"><label for="pf-email">Pochta</label><input class="input" id="pf-email" type="email" maxlength="60" value="'+esc(u.email)+'"></div>'+
    '<div class="err" id="pf-err" role="alert"></div><div><button class="btn primary" type="submit">Saqlash</button></div></form>'+
    '<div class="stack">'+passwordForm()+
    '<div class="card stack"><h3 class="lbl">Hisobni o‘chirish</h3><p class="subtle">Hisob, yuklar, takliflar va mashina ma‘lumoti butunlay o‘chadi.</p><div>'+ab("del-account","del-account","Hisobni o‘chirish")+'</div></div></div></div>';
}

/* ---------- admin ---------- */
function renderAdmin(){
  var u=cur(),el=$("#admin-body");
  if(!u||u.role!=="admin"){el.innerHTML="";return}
  var unread=S.messages.filter(function(m){return !m.read}).length;
  var tabs=[["overview","Umumiy"],["users","Foydalanuvchilar"],["loads","Yuklar"],["drivers","Haydovchilar"],["messages","Xabarlar"+(unread?" ("+unread+")":"")],["settings","Sozlamalar"]];
  var h='<div class="page-head"><div><h2>Admin panel</h2><p>Saytdagi barcha ma‘lumotlar boshqaruvi</p></div></div>';
  h+='<div class="subtabs" role="tablist">'+tabs.map(function(t){return '<button class="subtab" data-act="atab" data-t="'+t[0]+'" aria-selected="'+(atab===t[0])+'">'+t[1]+'</button>'}).join("")+'</div>';
  if(atab==="overview") h+=aOverview(u);
  else if(atab==="settings") h+=aSettings(u);
  else{
    h+=aToolbar();
    h+='<div id="a-list"></div>';
  }
  el.innerHTML=h;
  if($("#a-list"))renderAdminList();
}
function bars(obj,order){
  var max=1;order.forEach(function(k){if((obj[k]||0)>max)max=obj[k]});
  return '<div class="bars">'+order.map(function(k){var v=obj[k]||0;return '<div class="bar"><span>'+esc(LABEL[k]||k)+'</span><div class="tr"><i style="width:'+Math.round(v/max*100)+'%"></i></div><b class="mono">'+v+'</b></div>'}).join("")+'</div>';
}
function aOverview(u){
  var L=S.loads,st={open:0,assigned:0,transit:0,done:0},tr={},offersN=0;
  L.forEach(function(l){st[l.status]++;tr[l.truck]=(tr[l.truck]||0)+1;offersN+=l.offers.length});
  var h="";
  if(u.pwDefault) h+='<div class="note-box warn">Administrator paroli hali standart holatda. Sozlamalar bo‘limida uni almashtiring.</div>';
  var stats=[["Foydalanuvchilar",S.users.length],["Yuklar",L.length],["Ochiq yuklar",st.open],["Yo‘lda",st.transit],["Haydovchilar",S.drivers.length],["Takliflar",offersN],["Yangi xabarlar",S.messages.filter(function(m){return !m.read}).length]];
  h+='<div class="stats">'+stats.map(function(s){return '<div class="stat"><span class="lbl">'+s[0]+'</span><b>'+s[1]+'</b></div>'}).join("")+'</div>';
  h+='<div class="cols"><div class="card"><h3 class="lbl" style="margin-bottom:12px">Yuklar holati</h3>'+bars(st,["open","assigned","transit","done"])+'</div>'+
     '<div class="card"><h3 class="lbl" style="margin-bottom:12px">Mashina turi bo‘yicha yuklar</h3>'+bars(tr,TRUCKS)+'</div></div>';
  h+='<div class="card" style="margin-top:16px"><h3 class="lbl" style="margin-bottom:12px">So‘nggi harakatlar</h3><ul class="logl">'+(S.log.length?S.log.slice(0,10).map(function(x){return '<li><time>'+timeLabel(x.at)+'</time><span>'+esc(x.text)+'</span></li>'}).join(""):'<li><span class="subtle">Hozircha yozuv yo‘q.</span></li>')+'</ul></div>';
  return h;
}
function aToolbar(){
  var h='<div class="toolbar"><div class="field"><label for="a-q">Qidirish</label><input class="input" id="a-q" data-af="q" value="'+esc(AF.q)+'" placeholder="Ism, shahar, telefon"></div>';
  if(atab==="users") h+='<div class="field"><label for="a-role">Rol</label><select class="input" id="a-role" data-af="role"><option value="">Hammasi</option>'+Object.keys(ROLE).map(function(r){return '<option value="'+r+'"'+(AF.role===r?' selected':'')+'>'+ROLE[r]+'</option>'}).join("")+'</select></div><button class="btn primary" data-act="adm-add">'+(adminAdd?'Yopish':'+ Foydalanuvchi qo‘shish')+'</button>';
  if(atab==="loads") h+='<div class="field"><label for="a-status">Holati</label><select class="input" id="a-status" data-af="status"><option value="">Hammasi</option>'+["open","assigned","transit","done"].map(function(s){return '<option value="'+s+'"'+(AF.status===s?' selected':'')+'>'+LABEL[s]+'</option>'}).join("")+'</select></div>';
  if(atab==="drivers") h+='<div class="field"><label for="a-flag">Tasdiq</label><select class="input" id="a-flag" data-af="flag"><option value="">Hammasi</option><option value="yes"'+(AF.flag==="yes"?' selected':'')+'>Tasdiqlangan</option><option value="no"'+(AF.flag==="no"?' selected':'')+'>Tasdiqlanmagan</option></select></div>';
  h+='</div>';
  if(atab==="users"&&adminNote) h+='<div class="note-box">'+adminNote+'</div>';
  if(atab==="users"&&adminAdd) h+='<form class="card form" data-form="admin-user" novalidate style="margin-bottom:16px"><h3 class="lbl full">Yangi foydalanuvchi</h3>'+
    '<div class="field"><label for="au-name">Ism</label><input class="input" id="au-name" maxlength="40"></div>'+
    '<div class="field"><label for="au-role">Rol</label><select class="input" id="au-role"><option value="shipper">Yuk egasi</option><option value="driver">Haydovchi</option><option value="admin">Administrator</option></select></div>'+
    '<div class="field"><label for="au-phone">Telefon</label><input class="input mono" id="au-phone" type="tel" maxlength="20"></div>'+
    '<div class="field"><label for="au-email">Pochta</label><input class="input" id="au-email" type="email" maxlength="60"></div>'+
    '<div class="field full"><label for="au-pass">Parol (kamida 6 belgi)</label><input class="input" id="au-pass" maxlength="60"></div>'+
    '<div class="full err" id="au-err" role="alert"></div><div class="full"><button class="btn primary" type="submit">Qo‘shish</button></div></form>';
  return h;
}
function match(q,arr){q=q.trim().toLowerCase();if(!q)return true;return arr.join(" ").toLowerCase().indexOf(q)>-1}
function renderAdminList(){
  var el=$("#a-list");if(!el)return;
  var me=cur(),h="";
  if(atab==="users"){
    var a=S.users.filter(function(x){return (!AF.role||x.role===AF.role)&&match(AF.q,[x.name,x.phone,x.email])});
    h=a.length?'<div class="tw"><table><thead><tr><th>Foydalanuvchi</th><th>Rol</th><th>Qo‘shilgan</th><th>Holat</th><th>Amallar</th></tr></thead><tbody>'+a.map(function(x){
      var self=x.id===me.id;
      return '<tr><td><b>'+esc(x.name)+'</b>'+(self?' <span class="verified me">Siz</span>':'')+'<br><span class="subtle mono">'+esc(x.email||x.phone)+'</span></td><td>'+ROLE[x.role]+'</td><td class="mono">'+timeLabel(x.created).split(" ")[0]+'</td><td><span class="pill '+(x.blocked?'transit':'open')+'">'+(x.blocked?'Bloklangan':'Faol')+'</span></td><td><div class="tacts">'+
        (self?'<span class="subtle">—</span>':'<button class="btn small" data-act="block" data-id="'+x.id+'">'+(x.blocked?'Faollashtirish':'Bloklash')+'</button><button class="btn small" data-act="resetpw" data-id="'+x.id+'">Parolni tiklash</button>'+ab("del-user:"+x.id,"del-user","O‘chirish","","data-id=\""+x.id+"\""))+'</div></td></tr>'}).join("")+'</tbody></table></div>':'<div class="empty"><p>Foydalanuvchi topilmadi.</p></div>';
  }
  if(atab==="loads"){
    var b=S.loads.filter(function(l){return (!AF.status||l.status===AF.status)&&match(AF.q,[l.from,l.to,l.cargo,userName(l.ownerId)])});
    h=b.length?'<div class="tw"><table><thead><tr><th>Marshrut</th><th>Yuk</th><th>Yuk egasi</th><th>Narx</th><th>Holat</th><th>Taklif</th><th>Amallar</th></tr></thead><tbody>'+b.map(function(l){
      return '<tr><td><b>'+esc(l.from)+' → '+esc(l.to)+'</b><br><span class="subtle mono">'+dateLabel(l.date)+'</span></td><td>'+esc(l.cargo)+'<br><span class="subtle mono">'+l.weight+' t · '+esc(l.truck)+'</span></td><td>'+esc(userName(l.ownerId))+'</td><td class="mono">'+money(l.price)+'</td>'+
        '<td><select class="input" style="width:auto" data-adm="status" data-id="'+l.id+'" aria-label="Holat">'+["open","assigned","transit","done"].map(function(s){return '<option value="'+s+'"'+(l.status===s?' selected':'')+'>'+LABEL[s]+'</option>'}).join("")+'</select></td><td class="mono">'+l.offers.length+'</td>'+
        '<td><div class="tacts"><button class="btn small" data-act="open-load" data-id="'+l.id+'">Ochish</button>'+ab("del-load:"+l.id,"del-load","O‘chirish","","data-id=\""+l.id+"\"")+'</div></td></tr>'}).join("")+'</tbody></table></div>':'<div class="empty"><p>Yuk topilmadi.</p></div>';
  }
  if(atab==="drivers"){
    var c=S.drivers.filter(function(d){return (!AF.flag||(AF.flag==="yes")===d.verified)&&match(AF.q,[d.name,d.plate,d.base,d.truck,d.phone])});
    h=c.length?'<div class="tw"><table><thead><tr><th>Haydovchi</th><th>Mashina</th><th>Turgan joyi</th><th>Tasdiq</th><th>Holat</th><th>Amallar</th></tr></thead><tbody>'+c.map(function(d){
      return '<tr><td><b>'+esc(d.name)+'</b><br><span class="plate">'+esc(d.plate||"—")+'</span></td><td>'+esc(d.truck)+'<br><span class="subtle mono">'+d.cap+' t</span></td><td>'+esc(d.base)+'</td>'+
        '<td><span class="pill '+(d.verified?'open':'done')+'">'+(d.verified?'Tasdiqlangan':'Kutilmoqda')+'</span></td><td><span class="pill '+(d.avail?'open':'done')+'">'+(d.avail?'Bo‘sh':'Band')+'</span></td>'+
        '<td><div class="tacts"><button class="btn small" data-act="verify" data-id="'+d.id+'">'+(d.verified?'Tasdiqni olish':'Tasdiqlash')+'</button><button class="btn small" data-act="toggle-avail" data-id="'+d.id+'">'+(d.avail?'Band':'Bo‘sh')+'</button>'+ab("del-driver:"+d.id,"del-driver","O‘chirish","","data-id=\""+d.id+"\"")+'</div></td></tr>'}).join("")+'</tbody></table></div>':'<div class="empty"><p>Haydovchi topilmadi.</p></div>';
  }
  if(atab==="messages"){
    var m=S.messages.filter(function(x){return match(AF.q,[x.name,x.contact,x.text])});
    h=m.length?'<div class="stack">'+m.map(function(x){return '<div class="card msg'+(x.read?'':' unread')+'"><div class="line"><b>'+esc(x.name)+'</b><span class="date">'+timeLabel(x.at)+'</span></div><span class="phone" style="align-self:flex-start">'+esc(x.contact)+'</span><p>'+esc(x.text)+'</p><div class="tacts"><button class="btn small" data-act="msg-read" data-id="'+x.id+'">'+(x.read?'O‘qilmagan deb belgilash':'O‘qildi')+'</button>'+ab("del-msg:"+x.id,"del-msg","O‘chirish","","data-id=\""+x.id+"\"")+'</div></div>'}).join("")+'</div>':'<div class="empty"><h3>Xabar yo‘q</h3><p>Aloqa formasi orqali kelgan xabarlar shu yerda ko‘rinadi.</p></div>';
  }
  el.innerHTML=h;
}
function aSettings(u){
  var exp=JSON.stringify({users:S.users.map(function(x){return {id:x.id,role:x.role,name:x.name,phone:x.phone,email:x.email,blocked:x.blocked}}),loads:S.loads,drivers:S.drivers,messages:S.messages},null,1);
  var h="";
  if(u.pwDefault) h+='<div class="note-box warn">Administrator paroli hali standart holatda. Quyida almashtiring.</div>';
  h+='<div class="cols"><form class="card form one" data-form="settings" novalidate><h3 class="lbl">Sayt sozlamalari</h3>'+
    '<div class="field"><label for="st-banner">E‘lon (barcha sahifalar tepasida)</label><input class="input" id="st-banner" maxlength="140" value="'+esc(S.settings.banner)+'" placeholder="Bo‘sh qoldirsangiz yashiriladi"></div>'+
    '<label class="switch"><input type="checkbox" id="st-reg"'+(S.settings.registration?' checked':'')+'> <span>Yangi foydalanuvchilar ro‘yxatdan o‘ta olsin</span></label>'+
    '<label class="switch"><input type="checkbox" id="st-auto"'+(S.settings.autoVerify?' checked':'')+'> <span>Yangi haydovchilar avtomatik tasdiqlansin</span></label>'+
    '<div><button class="btn primary" type="submit">Saqlash</button></div></form>'+passwordForm()+'</div>';
  h+='<div class="card stack" style="margin-top:16px"><h3 class="lbl">Ma‘lumotlarni nusxalash</h3><textarea class="input exp" id="st-export" readonly>'+esc(exp)+'</textarea><div class="row"><button class="btn small" data-act="copy-export">JSON nusxalash</button>'+ab("reset-all","reset-all","Namunaviy ma‘lumotlarni tiklash")+'</div><p class="subtle">Tiklash barcha foydalanuvchi, yuk va xabarlarni boshlang‘ich namunaga qaytaradi.</p></div>';
  return h;
}

/* ---------- views ---------- */
function renderPost(){
  var u=cur(),ok=!!(u&&u.role==="shipper");
  $("#form-load").hidden=!ok;$("#post-gate").hidden=ok;
  if(ok&&!$("#p-phone").value) $("#p-phone").value=u.phone||"";
}
function setView(v){
  var u=cur();
  if((v==="cabinet"&&(!u||u.role==="admin"))||(v==="admin"&&(!u||u.role!=="admin"))){if(!u){authNote="Kabinetga kirish uchun hisobingizga kiring.";authMode="login";v="auth"}else v=(u.role==="admin"?"admin":"loads")}
  if(v==="post"&&(!u||u.role!=="shipper")){
    if(!u){authNote="Yuk joylash uchun yuk egasi sifatida kiring yoki ro‘yxatdan o‘ting.";pending="post";authMode="login";v="auth"}
  }
  ARM={};view=v;
  ["loads","drivers","post","cabinet","admin","auth","contact"].forEach(function(n){$("#v-"+n).hidden=(n!==v)});
  if(v==="loads")renderLoads();
  if(v==="drivers")renderDrivers();
  if(v==="post")renderPost();
  if(v==="cabinet")renderCabinet();
  if(v==="admin")renderAdmin();
  if(v==="auth")renderAuth();
  if(v==="contact"&&u){if(!$("#c-name").value)$("#c-name").value=u.name;if(!$("#c-phone").value)$("#c-phone").value=u.phone||u.email}
  renderHeader();renderBanner();
  window.scrollTo(0,0);
}
function refresh(){
  renderHeader();renderBanner();renderLoads();renderDrivers();
  if(view==="cabinet")renderCabinet();
  if(view==="admin")renderAdmin();
  if(view==="post")renderPost();
  if(openId&&!$("#overlay").hidden)openLoad(openId,true);
}

/* ---------- actions ---------- */
function updateCalc(){
  var f=$("#p-from").value,t=$("#p-to").value,p=Number($("#p-price").value),el=$("#p-calc");
  if(!f||!t||f===t){el.textContent="Masofa: ikki xil shahar tanlang";return}
  var k=dist(f,t);
  el.textContent="Masofa: ~"+k+" km"+(p>0?" · "+money(Math.round(p/k/10)*10)+" so‘m/km":"");
}
function removeLoad(id){S.loads=S.loads.filter(function(l){return l.id!==id});S.invites=S.invites.filter(function(i){return i.loadId!==id})}
function fixAssigned(){S.loads.forEach(function(l){if((l.status==="assigned"||l.status==="transit")&&!l.offers.some(function(o){return o.accepted}))l.status="open"})}
function removeDriver(id){S.loads.forEach(function(l){l.offers=l.offers.filter(function(o){return o.driverId!==id})});S.invites=S.invites.filter(function(i){return i.driverId!==id});S.drivers=S.drivers.filter(function(d){return d.id!==id});fixAssigned()}
function removeUser(id){
  S.loads.filter(function(l){return l.ownerId===id}).forEach(function(l){removeLoad(l.id)});
  S.drivers.filter(function(d){return d.userId===id}).forEach(function(d){removeDriver(d.id)});
  S.users=S.users.filter(function(x){return x.id!==id});
}
function submitLoad(){
  var u=cur();if(!u||u.role!=="shipper")return;
  var f=fieldVal("p-from"),t=fieldVal("p-to"),c=fieldVal("p-cargo"),w=Number($("#p-weight").value),p=Number($("#p-price").value),dt=$("#p-date").value,ph=fieldVal("p-phone"),err=$("#p-err");
  if(f===t) return err.textContent="Qayerdan va qayerga shaharlari bir xil bo‘lmasin.";
  if(c.length<3) return err.textContent="Yuk nomini yozing.";
  if(!(w>0)||w>40) return err.textContent="Og‘irlikni 0 dan 40 tonnagacha kiriting.";
  if(!(p>=100000)) return err.textContent="Narxni so‘mda kiriting (kamida 100 000).";
  if(!dt) return err.textContent="Yuklash sanasini tanlang.";
  if(!phoneOk(ph)) return err.textContent="Telefon raqamini to‘liq kiriting.";
  err.textContent="";
  var l={id:uid("l"),ownerId:u.id,from:f,to:t,cargo:c,weight:w,truck:$("#p-truck").value,price:p,date:dt,phone:ph,status:"open",offers:[]};
  S.loads.unshift(l);log("Yangi yuk joylandi: "+f+" → "+t);save();
  $("#form-load").reset();$("#p-date").value=iso(1);$("#p-from").value="Toshkent";$("#p-to").value="Samarqand";updateCalc();
  toast("Yuk joylandi");ctab="loads";setView("cabinet");openLoad(l.id);
}
function submitOffer(form){
  var u=cur(),d=myDriver(),l=loadById(form.dataset.l),p=Number($("#o-price").value),note=fieldVal("o-note"),err=$("#o-err");
  if(!u||!d||!l) return;
  if(!(p>=100000)) return err.textContent="Narxni so‘mda kiriting.";
  l.offers.push({id:uid("o"),driverId:d.id,userId:u.id,name:d.name,price:p,note:note,accepted:false});
  log("Yangi taklif: "+d.name+" — "+l.from+" → "+l.to);save();toast("Taklif yuborildi");refresh();
}
function submitContact(){
  var n=fieldVal("c-name"),c=fieldVal("c-phone"),m=fieldVal("c-msg"),err=$("#c-err"),ok=$("#c-ok");
  ok.hidden=true;
  if(n.length<2) return err.textContent="Ismingizni yozing.";
  if(c.length<5) return err.textContent="Telefon yoki pochtangizni yozing.";
  if(m.length<5) return err.textContent="Xabaringizni yozing.";
  err.textContent="";
  var u=cur();
  S.messages.unshift({id:uid("m"),name:n,contact:c,text:m,at:Date.now(),read:false,userId:u?u.id:null});
  log("Yangi xabar: "+n);save();
  $("#form-contact").reset();
  ok.textContent=n+", xabaringiz qabul qilindi. Javobni "+c+" manziliga yuboramiz.";ok.hidden=false;renderHeader();
}
function submitProfile(){
  var u=cur(),n=fieldVal("pf-name"),ph=fieldVal("pf-phone"),em=fieldVal("pf-email"),err=$("#pf-err");
  if(n.length<2) return err.textContent="Ismingizni yozing.";
  if(!phoneOk(ph)) return err.textContent="Telefon raqamini to‘liq kiriting.";
  if(em&&!validEmail(em)) return err.textContent="Pochta manzili noto‘g‘ri yozilgan.";
  var keys=keysFor(ph,em);
  if(findByKeys(keys,u.id)) return err.textContent="Bu telefon yoki pochta boshqa hisobda ishlatilgan.";
  u.name=n;u.phone=ph;u.email=em.toLowerCase();u.keys=keys;
  var d=myDriver();if(d){d.name=n;d.phone=ph}
  S.loads.forEach(function(l){if(l.ownerId===u.id)l.phone=ph});
  save();toast("Profil saqlandi");refresh();
}
function submitPassword(){
  var u=cur(),o=$("#pw-old").value,n=$("#pw-new").value,n2=$("#pw-new2").value,err=$("#pw-err");
  if(u.hash!==hashPw(o,u.salt)) return err.textContent="Joriy parol noto‘g‘ri.";
  if(n.length<6) return err.textContent="Yangi parol kamida 6 belgidan iborat bo‘lsin.";
  if(n!==n2) return err.textContent="Yangi parollar bir xil emas.";
  u.salt=rid();u.hash=hashPw(n,u.salt);u.pwDefault=false;u.demo=false;
  log("Parol yangilandi: "+u.name);save();toast("Parol yangilandi");refresh();
}
function submitTruck(){
  var d=myDriver(),pl=fieldVal("tk-plate").toUpperCase(),cap=Number($("#tk-cap").value),ph=fieldVal("tk-phone"),err=$("#tk-err");
  var routes=$$("#tk-routes input:checked").map(function(i){return i.value});
  if(pl.length<6) return err.textContent="Davlat raqamini yozing, masalan 01 A 123 BA.";
  if(!(cap>0)||cap>40) return err.textContent="Yuk sig‘imini tonnada kiriting.";
  if(!routes.length) return err.textContent="Kamida bitta shahar belgilang.";
  if(!phoneOk(ph)) return err.textContent="Telefon raqamini to‘liq kiriting.";
  d.plate=pl;d.truck=$("#tk-truck").value;d.cap=cap;d.base=$("#tk-base").value;d.routes=routes;d.phone=ph;
  save();toast("Mashina ma‘lumoti saqlandi");refresh();
}
function submitAdminUser(){
  var name=fieldVal("au-name"),role=$("#au-role").value,phone=fieldVal("au-phone"),email=fieldVal("au-email"),pw=$("#au-pass").value,err=$("#au-err");
  if(name.length<2) return err.textContent="Ismni yozing.";
  if(!phone&&!email) return err.textContent="Telefon yoki pochta kerak.";
  if(phone&&!phoneOk(phone)) return err.textContent="Telefon raqamini to‘liq kiriting.";
  if(email&&!validEmail(email)) return err.textContent="Pochta manzili noto‘g‘ri.";
  if(pw.length<6) return err.textContent="Parol kamida 6 belgidan iborat bo‘lsin.";
  if(findByKeys(keysFor(phone,email))) return err.textContent="Bu telefon yoki pochta bilan hisob mavjud.";
  var u=newUser(role,name,phone,email,pw);S.users.push(u);
  if(role==="driver") S.drivers.unshift(newDriver(u.id,name,phone));
  log("Administrator foydalanuvchi qo‘shdi: "+name);save();adminAdd=false;adminNote="";toast("Foydalanuvchi qo‘shildi");refresh();
}
function submitSettings(){
  S.settings.banner=fieldVal("st-banner");S.settings.registration=$("#st-reg").checked;S.settings.autoVerify=$("#st-auto").checked;
  log("Sayt sozlamalari yangilandi");save();toast("Sozlamalar saqlandi");refresh();
}

/* ---------- events ---------- */
document.addEventListener("click",function(e){
  var t=e.target.closest("[data-act]");
  if(!t){ if(e.target.id==="overlay") closeModal(); return }
  var a=t.dataset.act,k=t.dataset.arm;
  if(k){
    if(!ARM[k]){ARM={};ARM[k]=true;refresh();return}
    ARM={};
  } else if(Object.keys(ARM).length){ARM={};if(a!=="tab"&&a!=="auth")refresh()}
  var u=cur();
  switch(a){
    case "tab": closeModal();setView(t.dataset.v);break;
    case "auth": closeModal();authMode=t.dataset.m||"login";authNote="";pending=null;setView("auth");break;
    case "auth-mode": authMode=t.dataset.m;renderAuth();break;
    case "reg-role": regRole=t.dataset.r;renderAuth();break;
    case "demo-fill": $("#l-login").value=t.dataset.r==="driver"?"driver@demo.uz":"shipper@demo.uz";$("#l-pass").value="demo123";$("#l-err").textContent="";break;
    case "logout": sessionId=null;saveSession();closeModal();ctab="";revealed={};toast("Hisobdan chiqdingiz");setView("loads");break;
    case "gate-auth": gate("Davom etish uchun kiring yoki ro‘yxatdan o‘ting.",null);break;
    case "scroll-results": renderLoads();$("#results").scrollIntoView({behavior:"smooth",block:"start"});break;
    case "clear-filters": F={from:"",to:"",truck:"",status:"open",sort:"new",maxw:""};$("#f-from").value="";$("#f-to").value="";$("#f-truck").value="";$("#f-status").value="open";$("#f-sort").value="new";$("#f-maxw").value="";renderLoads();break;
    case "open-load": openLoad(t.dataset.id);break;
    case "close": closeModal();break;
    case "close-go-post": closeModal();setView("post");break;
    case "reveal": if(!u){gate("Raqamlarni ko‘rish uchun kiring.",null);break} revealed[t.dataset.k]=true;refresh();break;
    case "copy": copy(t.dataset.t);break;
    case "copy-export": copy($("#st-export").value);break;
    case "accept":
      var l=loadById(t.dataset.l);if(!l||!u||l.ownerId!==u.id)break;
      l.offers.forEach(function(o){o.accepted=(o.id===t.dataset.o)});l.status="assigned";
      log("Haydovchi tanlandi: "+l.from+" → "+l.to);save();toast("Haydovchi tanlandi");refresh();break;
    case "advance":
      var l2=loadById(t.dataset.l);if(!l2||!u||l2.ownerId!==u.id)break;
      l2.status=(l2.status==="assigned")?"transit":"done";
      log((l2.status==="transit"?"Yuk yo‘lga chiqdi: ":"Yuk yetkazildi: ")+l2.from+" → "+l2.to);save();
      toast(l2.status==="transit"?"Yuk yo‘lda":"Yuk yetkazildi");refresh();break;
    case "invite": openInvite(t.dataset.id);break;
    case "send-invite":
      if(!u||u.role!=="shipper")break;
      if(!S.invites.some(function(i){return i.driverId===t.dataset.d&&i.loadId===t.dataset.l}))S.invites.push({id:uid("i"),driverId:t.dataset.d,loadId:t.dataset.l,by:u.id,at:Date.now()});
      log("Haydovchiga taklif yuborildi: "+userName(driverById(t.dataset.d).userId));save();closeModal();toast("Taklif yuborildi");refresh();break;
    case "toggle-avail":
      var d=driverById(t.dataset.id);if(!d||!u||(d.userId!==u.id&&u.role!=="admin"))break;
      d.avail=!d.avail;save();refresh();break;
    case "ctab": ctab=t.dataset.t;renderCabinet();break;
    case "atab": atab=t.dataset.t;AF={q:"",role:"",status:"",flag:""};adminAdd=false;adminNote="";renderAdmin();break;
    case "adm-add": adminAdd=!adminAdd;renderAdmin();break;
    case "del-load":
      if(!u)break;var dl=loadById(t.dataset.id);if(!dl||(dl.ownerId!==u.id&&u.role!=="admin"))break;
      removeLoad(dl.id);log("Yuk o‘chirildi: "+dl.from+" → "+dl.to);save();if(openId===dl.id)closeModal();toast("Yuk o‘chirildi");refresh();break;
    case "del-offer":
      if(!u||u.role!=="admin")break;var ol=loadById(t.dataset.l);ol.offers=ol.offers.filter(function(o){return o.id!==t.dataset.o});fixAssigned();save();refresh();break;
    case "block":
      if(!u||u.role!=="admin")break;var bu=userById(t.dataset.id);if(!bu||bu.id===u.id)break;
      bu.blocked=!bu.blocked;log((bu.blocked?"Bloklandi: ":"Faollashtirildi: ")+bu.name);save();toast(bu.blocked?"Foydalanuvchi bloklandi":"Foydalanuvchi faollashtirildi");refresh();break;
    case "resetpw":
      if(!u||u.role!=="admin")break;var ru=userById(t.dataset.id);if(!ru)break;
      var tmp="yb"+Math.floor(100000+Math.random()*899999);ru.salt=rid();ru.hash=hashPw(tmp,ru.salt);ru.demo=false;
      log("Parol tiklandi: "+ru.name);save();adminNote="Vaqtinchalik parol ("+esc(ru.name)+"): <b class=\"mono\">"+tmp+"</b>. Foydalanuvchiga yuboring, u kirgach o‘zgartirsin.";renderAdmin();break;
    case "del-user":
      if(!u||u.role!=="admin"||t.dataset.id===u.id)break;
      var du=userById(t.dataset.id);if(!du)break;removeUser(du.id);log("Foydalanuvchi o‘chirildi: "+du.name);save();toast("Foydalanuvchi o‘chirildi");refresh();break;
    case "del-driver":
      if(!u||u.role!=="admin")break;removeDriver(t.dataset.id);save();toast("Haydovchi o‘chirildi");refresh();break;
    case "verify":
      if(!u||u.role!=="admin")break;var vd=driverById(t.dataset.id);vd.verified=!vd.verified;log((vd.verified?"Tasdiqlandi: ":"Tasdiq olindi: ")+vd.name);save();refresh();break;
    case "msg-read":
      if(!u||u.role!=="admin")break;var mm=S.messages.filter(function(x){return x.id===t.dataset.id})[0];if(mm){mm.read=!mm.read;save();refresh()}break;
    case "del-msg":
      if(!u||u.role!=="admin")break;S.messages=S.messages.filter(function(x){return x.id!==t.dataset.id});save();refresh();break;
    case "del-account":
      if(!u||u.role==="admin")break;var nm=u.name;removeUser(u.id);log("Hisob o‘chirildi: "+nm);save();sessionId=null;saveSession();toast("Hisobingiz o‘chirildi");setView("loads");break;
    case "reset-all":
      if(!u||u.role!=="admin")break;S=seed();revealed={};save();if(!userById(sessionId)){sessionId=null;saveSession()}toast("Namunaviy ma‘lumotlar tiklandi");refresh();break;
  }
});
document.addEventListener("keydown",function(e){
  if(e.key==="Escape") closeModal();
  if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches('[role="button"][data-act]')){e.preventDefault();e.target.click()}
});
document.addEventListener("submit",function(e){
  var f=e.target.closest("form[data-form]");if(!f)return;
  e.preventDefault();
  switch(f.dataset.form){
    case "login":doLogin();break;
    case "register":doRegister();break;
    case "load":submitLoad();break;
    case "offer":submitOffer(f);break;
    case "contact":submitContact();break;
    case "profile":submitProfile();break;
    case "password":submitPassword();break;
    case "truck":submitTruck();break;
    case "admin-user":submitAdminUser();break;
    case "settings":submitSettings();break;
  }
});
document.addEventListener("input",function(e){
  var el=e.target;
  if(el.dataset&&el.dataset.filter){F[el.dataset.filter]=el.value;renderLoads()}
  if(el.dataset&&el.dataset.dfilter){DF[el.dataset.dfilter]=(el.type==="checkbox")?el.checked:el.value;renderDrivers()}
  if(el.dataset&&el.dataset.af){AF[el.dataset.af]=el.value;renderAdminList()}
  if(el.id==="p-from"||el.id==="p-to"||el.id==="p-price") updateCalc();
});
document.addEventListener("change",function(e){
  var el=e.target;
  if(el.dataset&&el.dataset.adm==="status"){
    var u=cur();if(!u||u.role!=="admin")return;
    var l=loadById(el.dataset.id);if(!l)return;
    l.status=el.value;
    if(l.status==="open") l.offers.forEach(function(o){o.accepted=false});
    if((l.status==="assigned"||l.status==="transit"||l.status==="done")&&!l.offers.some(function(o){return o.accepted})&&l.offers.length){l.offers.slice().sort(function(a,b){return a.price-b.price})[0].accepted=true}
    log("Holat o‘zgardi ("+LABEL[l.status]+"): "+l.from+" → "+l.to);save();toast("Holat yangilandi");refresh();
  }
});

/* ---------- init ---------- */
$("#f-from").innerHTML=opts(NAMES,"Hammasi");
$("#f-to").innerHTML=opts(NAMES,"Hammasi");
$("#f-truck").innerHTML=opts(TRUCKS,"Hammasi");
$("#d-f-base").innerHTML=opts(NAMES,"Hammasi");
$("#d-f-truck").innerHTML=opts(TRUCKS,"Hammasi");
$("#d-f-route").innerHTML=opts(NAMES,"Hammasi");
$("#p-from").innerHTML=opts(NAMES,null,"Toshkent");
$("#p-to").innerHTML=opts(NAMES,null,"Samarqand");
$("#p-truck").innerHTML=opts(TRUCKS,null);
$("#r-truck").innerHTML=opts(TRUCKS,null);
$("#r-base").innerHTML=opts(NAMES,null,"Toshkent");
$("#r-routes").innerHTML=NAMES.map(function(n){return '<label class="check"><input type="checkbox" value="'+esc(n)+'"> '+esc(n)+'</label>'}).join("");
$("#p-date").value=iso(1);
$("#p-date").min=iso(0);
updateCalc();
if(sessionId&&!cur()){sessionId=null;saveSession()}
refresh();
})();
