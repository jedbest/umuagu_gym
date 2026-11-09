const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyX68zoviOnfHOGZLUQeYgUawDoLQaD4iliWbn57qb2a3DgMOzKQfWw8NvC-uJTJ0J3/exec";
const PRICES = {
  Nsukka: {
    'Daily Without Coaching': 2500,
    'Weekly Without Coaching': 7000,
    '2 Weeks Without Coaching': 13000,
    '2 Weeks With Coaching': 43000,
    'Monthly Without Coaching': 20000,
    'Monthly With Coaching': 70000,
    '3 Months Without Coaching': 55000,
    '6 Months Without Coaching': 100000
  },
  Enugu: {
    'Daily Without Coaching': 2000,
    'Weekly Without Coaching': 5000,
    '2 Weeks Without Coaching': 10000,
    '2 Weeks With Coaching': 40000,
    'Monthly Without Coaching': 17000,
    'Monthly With Coaching': 67000,
    '3 Months Without Coaching': 36000,
    '6 Months Without Coaching': 70000
  }
};
let selectedPlan = ""; // <-- THE TRUTH - what user actually clicked

function getBranch(){ return document.getElementById('branch')?.value || document.getElementById('addBranch')?.value || 'Nsukka'; }
function getPriceForPlan(plan, branch){ 
  branch = branch || getBranch(); 
  return (PRICES[branch] && PRICES[branch][plan]) || 0; 
}
function getDynamicPriceForBranch(days, isWith, branch){
  // For custom days in registration - use Nsukka/Enugu dynamic breakdown
  var P = PRICES[branch||'Nsukka'];
  // Build dynamic from base prices
  var d = P['Daily Without Coaching'] || 2500;
  var w = P['Weekly Without Coaching'] || 7000;
  var w2 = P['2 Weeks Without Coaching'] || 13000;
  // For With, fallback to Without if Enugu has no With
  var w2With = P['2 Weeks With Coaching'] || w2;
  var mo = P['Monthly Without Coaching'] || 20000;
  var moWith = P['Monthly With Coaching'] || mo;
  var t = P['3 Months Without Coaching'] || 55000;
  var s = P['6 Months Without Coaching'] || 100000;
  var dd = isWith ? d : d; // Enugu has no With, so use Without
  var ww = isWith ? w : w;
  var ww2 = isWith ? w2With : w2;
  var mmo = isWith ? moWith : mo;
  if(days===1) return dd;
  if(days===7) return ww;
  if(days===14) return ww2;
  if(days===30) return mmo;
  if(days===90) return t;
  if(days===180) return s;
  var price=0, rem=days;
  if(rem>=180){price+=Math.floor(rem/180)*s;rem%=180;}
  if(rem>=90){price+=Math.floor(rem/90)*t;rem%=90;}
  if(rem>=30){price+=Math.floor(rem/30)*mmo;rem%=30;}
  if(rem>=14){price+=Math.floor(rem/14)*ww2;rem%=14;}
  if(rem>=7){price+=Math.floor(rem/7)*ww;rem%=7;}
  price+=rem*dd;
  return price;
}
const cleanPhone = (p) => String(p).replace(/[^0-9]/g,'').slice(-10);

function updateOpenStatus(){
  const el = document.getElementById('openStatus') || document.getElementById('status') || document.querySelector('.open-status');
  if(!el) return;
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  const time = hour + min/60;
  const isOpen = (time >= 7 && time <= 21);
  if(isOpen){
    el.innerHTML = "🟢 Open Now";
    el.style.color = "#a6ff00";
  } else {
    let next = "";
    if(time < 7) next = "Opens 7AM today";
    else next = "Opens 7AM tomorrow";
    el.innerHTML = `🔴 Closed - ${next}`;
    el.style.color = "red";
  }
}
updateOpenStatus();
setInterval(updateOpenStatus, 60000);

function showPage(pageId, el){
  document.querySelectorAll('.page, section').forEach(p=> p.style.display='none');
  const target = document.getElementById(pageId);
  if(target) target.style.display='block';
  document.querySelectorAll('.bottom-nav button').forEach(b=> b.classList.remove('active'));
  if(el){
    el.classList.add('active');
  } else {
    document.querySelectorAll('.bottom-nav button').forEach(b=>{
      if(b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${pageId}'`)){
        b.classList.add('active');
      }
    });
  }
  window.scrollTo(0,0);
}

function selectPlan(card,val,branch){
  document.querySelectorAll('.plan-card').forEach(c=>c.classList.remove('selected'));
  if(card) card.classList.add('selected');
  selectedPlan = val; // save it, never let updatePlanOptions erase it
  if(branch){
    document.getElementById('branch').value = branch;
    updatePlanOptions();
  }
  const ps = document.getElementById('planSelect');
  if(ps) ps.value = val;
  updateAmount();
  showPage('register');
  // Double-check after page shows - because showPage can reset selects
  setTimeout(()=>{
    const ps2 = document.getElementById('planSelect');
    if(ps2) ps2.value = selectedPlan;
    updateAmount();
  }, 50);
}

function updateAmount(){
  const v=document.getElementById('planSelect').value;
  const branch = getBranch();
  const price = getPriceForPlan(v, branch);
  const el=document.getElementById('showAmount');
  if(el) el.textContent = price ? '₦'+price.toLocaleString() : 'Select plan';
}
function updatePlanOptions(){
  const branch = getBranch();
  const planSelect = document.getElementById('planSelect');
  if(!planSelect) return;
  // Use selectedPlan if it belongs to this branch, otherwise keep current dropdown
  const want = selectedPlan && PRICES[branch] && PRICES[branch][selectedPlan] ? selectedPlan : planSelect.value;
  planSelect.innerHTML = '<option value="">Select plan</option>';
  const list = PRICES[branch] || PRICES.Nsukka;
  for(let plan in list){
    const opt = document.createElement('option');
    opt.value = plan;
    opt.textContent = plan + ' - ₦' + list[plan].toLocaleString();
    planSelect.appendChild(opt);
  }
  if(list[want]){ planSelect.value = want; selectedPlan = want; }
  updateAmount();
}

function getDaysFromPlan(plan){
  const p = plan.toLowerCase();
  if(p.includes("daily")) return 1;
  if(p.includes("weekly") &&!p.includes("2")) return 7;
  if(p.includes("2 week") || p.includes("2weeks") || p.includes("two week")) return 14;
  if(p.includes("monthly") || p.includes("month") &&!p.includes("3") &&!p.includes("6")) return 30;
  if(p.includes("monthly") || p.includes("month") &&!p.includes("3") &&!p.includes("6")) return 30;
  if(p.includes("3 month") || p.includes("3months") || p.includes("three month")) return 90;
  if(p.includes("6 month") || p.includes("6months") || p.includes("six month")) return 180;
  return 30;
}

function isWithCoaching(plan){
  return String(plan||"").toLowerCase().indexOf("with coaching")>-1;
}

// FIXED: exact days addition, no timezone shift
function getExpiry(plan, fromDate = new Date()){
  const d = new Date(fromDate);
  d.setHours(0,0,0,0);
  const days = getDaysFromPlan(plan);
  const newD = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  return newD.toISOString().split('T')[0];
}

function parseDateCheck(s){
  if(!s) return null;
  const str = String(s).trim();
  if(str.includes('T') || str.match(/^\d{4}-\d{2}-\d{2}/)){
    const d = new Date(str); 
    if(!isNaN(d)){ d.setHours(0,0,0,0); return d; }
  }
  if(str.includes('/')){
    const p=str.split('/');
    if(p.length===3){
      const d=new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0]));
      if(!isNaN(d)){ d.setHours(0,0,0,0); return d; }
    }
  }
  const d=new Date(str); 
  if(!isNaN(d)){ d.setHours(0,0,0,0); return d; }
  return null;
}

function profilePicked(input){
  const el=document.getElementById('profileName');
  const label=document.getElementById('profileLabel');
  if(el && input.files[0]){
    const file = input.files[0];
    el.textContent = "✅ " + file.name;
    if(file.type.startsWith('image/')){
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          // Compress to 300x300 JPEG 0.6 (~15KB) for Sheet + Drive
          const canvas = document.createElement('canvas');
          canvas.width = 300; canvas.height = 300;
          const ctx = canvas.getContext('2d');
          const size = Math.min(img.width, img.height);
          const x = (img.width - size)/2;
          const y = (img.height - size)/2;
          ctx.drawImage(img, x, y, size, size, 0, 0, 300, 300);
          const compressed = canvas.toDataURL('image/jpeg', 0.6);
          
          label.innerHTML = `<img src="${compressed}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid #a6ff00"><br>✅ Photo ready`;
          
          // Save BOTH formats
          localStorage.setItem('tempProfilePic', compressed); // for preview
          localStorage.setItem('tempProfilePicForSheet', compressed); // for Sheet upload
          
          console.log('Photo compressed:', Math.round(compressed.length/1024)+'KB - ready to upload');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
}

let camStream = null;

async function openCamera(){
  try{
    const video = document.getElementById('camPreview');
    const btnCap = document.getElementById('btnCapture');
    const btnClose = document.getElementById('btnCloseCam');
    const btnOpen = document.getElementById('btnOpenCam');
    
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
    video.srcObject = camStream;
    video.style.display = "block";
    btnCap.style.display = "block";
    btnClose.style.display = "block";
    btnOpen.style.display = "none";
    document.getElementById('profilePreview').style.display = "none";
  }catch(e){
    alert("Camera not allowed: "+e.message);
  }
}

function closeCamera(){
  const video = document.getElementById('camPreview');
  if(camStream){
    camStream.getTracks().forEach(t=>t.stop());
    camStream=null;
  }
  video.style.display="none";
  document.getElementById('btnCapture').style.display="none";
  document.getElementById('btnCloseCam').style.display="none";
  document.getElementById('btnOpenCam').style.display="block";
}

function capturePhoto(){
  const video = document.getElementById('camPreview');
  const canvas = document.getElementById('camCanvas');
  const preview = document.getElementById('profilePreview');
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video,0,0);
  const dataUrl = canvas.toDataURL('image/jpeg',0.85);
  
  preview.src = dataUrl;
  preview.style.display = "block";
  document.getElementById('profileName').textContent = "✅ Photo captured";
  localStorage.setItem('tempProfilePic', dataUrl);
  
  // also create a file object for upload
  fetch(dataUrl).then(res=>res.blob()).then(blob=>{
    const file = new File([blob],"camera.jpg",{type:"image/jpeg"});
    const dt = new DataTransfer();
    dt.items.add(file);
    document.getElementById('profilePic').files = dt.files;
  });
  
  closeCamera();
}

// keep your old profilePicked but make it show preview too
const oldProfilePicked = profilePicked;
profilePicked = function(input){
  const el=document.getElementById('profileName');
  const preview=document.getElementById('profilePreview');
  if(input.files[0]){
    el.textContent = "✅ " + input.files[0].name;
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.style.display = "block";
      localStorage.setItem('tempProfilePic', e.target.result);
    };
    reader.readAsDataURL(input.files[0]);
  }
}

async function validateForm(e){
  e.preventDefault();
  const name=document.getElementById('fullName').value.trim();
  const phone=document.getElementById('phone').value.trim();
  const sess=document.getElementById('session').value;
 const plan = selectedPlan || document.getElementById('planSelect').value;
console.log('SUBMIT PLAN DEBUG: selectedPlan=', selectedPlan, 'dropdown=', document.getElementById('planSelect').value, 'final=', plan);
  const goal=document.getElementById('goal').value.trim();
  const email = document.getElementById('email')?.value.trim() || "";
  const profileInput = document.getElementById('profilePic');
  const profileFile = profileInput? profileInput.files[0] : null;
  const branchEl = document.getElementById('branch');
  const selectedBranch = branchEl ? branchEl.value : "";

  const payRadio = document.querySelector('input[name="pay"]:checked');
  const isNow = payRadio? payRadio.value === 'now' : false;

  const payMethod = isNow?'Pay Immediately':'Pay at Gym';
  const receiptInput = document.getElementById('receipt');
  const receiptFile = receiptInput? receiptInput.files[0] : null;
  const err=document.getElementById('errorMsg');
  const submitBtn = e.target.querySelector('button[type="submit"]');

    // === VALIDATION - show exactly what is missing ===
  let missing = [];
  if(!name) missing.push('Full Name');
  if(!phone) missing.push('Phone');
  if(!email) missing.push('Email');
  if(!selectedBranch) missing.push('Branch');
  if(!sess) missing.push('Preferred Session');
  if(!plan) missing.push('Plan');
  if(!goal) missing.push('Goal');
  const hasPhoto = !!profileFile || (!!localStorage.getItem('tempProfilePic') && document.getElementById('profilePreview')?.style.display === 'block' || document.getElementById('profileName')?.textContent.includes('✅'));
if(!hasPhoto) missing.push('Profile Photo');
  if(isNow && !receiptFile) missing.push('Receipt');

  if(missing.length > 0){
    err.textContent = '⚠️ Please fill: ' + missing.join(', ');
    err.style.display='block';
    err.scrollIntoView({behavior:'smooth', block:'center'});
    return false;
  }

  
  err.style.display='none';
  submitBtn.innerText = "Checking...";
  submitBtn.disabled = true;

  try{
    // === 1. CHECK EXISTING FOR EXTEND LOGIC - FIXED WITH BRANCH ===
    const checkRes = await fetch(SCRIPT_URL + "?phone=" + cleanPhone(phone) + "&branch=" + encodeURIComponent(selectedBranch) + "&t=" + Date.now(), { cache: "no-store" });
    const members = await checkRes.json();
    const existing = members && members.length>0 ? members[0] : null;

    let expiryDate = "";
    let isTopUp = false;

    if(existing){
      const existingBranch = String(existing.branch||"").toLowerCase().trim();
      const selectedLow = String(selectedBranch||"").toLowerCase().trim();
      const existingIsWith = isWithCoaching(existing.plan||"");
      const newIsWith = isWithCoaching(plan);

      // ONLY renew if SAME branch AND SAME coaching type
      if(existingBranch === selectedLow && existingIsWith === newIsWith){
        const exp = existing.expiryDate || existing.expiry || existing.originalExpiry || '';
        const expD = parseDateCheck(exp);
        const today = new Date(); today.setHours(0,0,0,0);

        if(expD && expD >= today){
          // ACTIVE - EXTEND
          isTopUp = true;
          expiryDate = getExpiry(plan, expD);
          submitBtn.innerText = "Extending...";
        } else {
          // EXPIRED - new expiry from today
          isTopUp = true; // still topup but from today
          expiryDate = getExpiry(plan, new Date());
        }
      } else {
        // DIFFERENT branch or different coaching -> NEW registration
        isTopUp = false;
        expiryDate = getExpiry(plan, new Date());
      }
    } else {
      // No existing for this branch -> NEW
      expiryDate = getExpiry(plan, new Date());
      isTopUp = false;
    }

    // === 2. CONTINUE REGISTRATION ===
    submitBtn.innerText = isTopUp? "Extending plan..." : "Processing...";
   let price = getPriceForPlan(plan, selectedBranch);

    let receiptObj = null;
    if(isNow && receiptFile){
      const base64 = await getBase64(receiptFile);
      receiptObj = { name: receiptFile.name, mime: receiptFile.type, data: base64 };
    }

    let profileObj = null;
    if(profileFile){
      const base64P = await getBase64(profileFile);
      profileObj = { name: profileFile.name, mime: profileFile.type, data: base64P };
    }

    const savedPhoto = localStorage.getItem('tempProfilePicForSheet') || localStorage.getItem('tempProfilePic') || '';
    const data = {
      name: name, phone: phone,
      branch: selectedBranch,
      email: email || `${cleanPhone(phone)}@ironcity.com`,
      session: sess, plan: plan, goal: goal, payMethod: payMethod,
      price: price, amount: price, expiry: expiryDate, receipt: receiptObj,
      isTopUp: isTopUp,
  ProfilePic: savedPhoto, // new format - string
  profilePic: savedPhoto ? {
    data: savedPhoto.split('base64,')[1],
    mime: 'image/jpeg',
    name: 'profile_'+phone+'.jpg'
  } : null // old format - object - send both to be safe

    };

    await fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(data) });
    localStorage.setItem('payMethod', payMethod);
    localStorage.setItem('plan', plan);
    localStorage.setItem('memberName', name);
    localStorage.setItem('memberPhone', phone);
    localStorage.setItem('memberExpiry', expiryDate);
    localStorage.setItem('memberBranch', selectedBranch);
   window.location.href = `thank_you.html?name=${encodeURIComponent(name)}&plan=${encodeURIComponent(plan)}&expiry=${encodeURIComponent(expiryDate)}&phone=${encodeURIComponent(phone)}&payMethod=${encodeURIComponent(payMethod)}&isTopUp=${isTopUp}&branch=${encodeURIComponent(selectedBranch)}`;

  } catch(err2){
    console.error(err2);
    err.textContent = '⚠️ Network error. Check internet and try again. '+err2.message;
    err.style.display='block';
    submitBtn.innerText = "SUBMIT REGISTRATION";
    submitBtn.disabled = false;
  }
  return false;
}

function togglePay(){
  const isNow = document.querySelector('input[name="pay"][value="now"]')?.checked;
  const box = document.getElementById('payNowBox');
  if(box) box.style.display = isNow? 'block' : 'none';
  document.getElementById('cardNow')?.classList.toggle('active', isNow);
  document.getElementById('cardGym')?.classList.toggle('active',!isNow);
}

function filePicked(input){
  const el=document.getElementById('fileName');
  if(el && input.files[0]) el.textContent = "✅ " + input.files[0].name;
}

function getBase64(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = ()=> resolve(reader.result.split(',')[1]);
    reader.onerror = e=> reject(e);
  });
}

let currentPlanBranch = 'Nsukka';
function switchPlanBranch(branch){
  currentPlanBranch = branch;
  document.getElementById('btnBranchNsukka').style.background = branch==='Nsukka' ? '#fff' : '#111';
  document.getElementById('btnBranchNsukka').style.color = branch==='Nsukka' ? '#000080' : '#fff';
  document.getElementById('btnBranchEnugu').style.background = branch==='Enugu' ? '#fff' : '#111';
  document.getElementById('btnBranchEnugu').style.color = branch==='Enugu' ? '#000080' : '#fff';
  const list = PRICES[branch];
  let html = '';
  for(let plan in list){
    const isPopular = plan.includes('Monthly With ') ? '<span class="badge">MOST POPULAR</span>' : (plan.includes('2 Weeks With ') ? '<span class="badge">BEGINNER FRIENDLY</span>' : '');
    const daysLabel = plan.replace(' Without Coaching','').replace(' With Coaching','');
    html += `<div class="card plan-card" onclick="selectPlan(this,'${plan}','${branch}')">${isPopular}<h3>${plan}</h3><div class="price">₦${list[plan].toLocaleString()} / ${daysLabel}</div></div>`;
  }
  document.getElementById('planList').innerHTML = html;
}
// Call on load
document.addEventListener('DOMContentLoaded', ()=>{ switchPlanBranch('Nsukka'); });