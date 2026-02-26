//GLOBAL STATE
let isConnected = false;
let currentAccount = null;
let isConnecting = false;
let _metamaskListenerBound = false;


document.addEventListener('DOMContentLoaded', function(){
	// Mobile nav toggle
	const menuBtn = document.getElementById("menu-btn");
	const navLinks = document.getElementById("nav-links");
	const menuBtnIcon = menuBtn.querySelector("i");

	menuBtn.addEventListener("click", (e) => {
		e.stopPropagation();
		navLinks.classList.toggle("open");

		const isOpen = navLinks.classList.contains("open");
		menuBtnIcon.setAttribute("class", isOpen ? "ri-close-line" : "ri-menu-line");
	});

	navLinks.addEventListener("click", (e) => {
		const targetIsNavAction = !!e.target.closest('a, button');
		if (!targetIsNavAction) return;
		navLinks.classList.remove("open");
		menuBtnIcon.setAttribute("class", "ri-menu-line");
	});

	// Simple hero slider with cycle counter to auto-scroll to next section once
	const header = document.querySelector('.site-header');
	const slider = document.querySelector('.hero-slider');
	if(header){
		const checkHeader = ()=> {
			const shouldAdd = window.scrollY > 10;
			header.classList.toggle('scrolled', shouldAdd);
		};
		checkHeader();
		window.addEventListener('scroll', checkHeader);
	}
	if(slider){
		const slides = slider.querySelectorAll('.slide');
		let idx = 0;
		let cycles = 0;
		let autoScrolled = false;
		const interval = parseInt(slider.dataset.interval,10) || 5000;
		function go(i){
			idx = (i + slides.length) % slides.length;
			slider.style.transform = `translateX(-${idx * 100}%)`;
			
			if(idx === 0){
				cycles++;
				
				if(cycles >= 1 && !autoScrolled){
					autoScrolled = true;
					setTimeout(()=>{
						const next = document.querySelector('#features');
						if(next){ next.scrollIntoView({behavior:'smooth'}); }
					}, 600);
				}
			}
		}
		let timer = setInterval(()=> go(idx+1), interval);
		// Pause on hover
		slider.addEventListener('mouseenter', ()=> clearInterval(timer));
		slider.addEventListener('mouseleave', ()=> timer = setInterval(()=> go(idx+1), interval));
	}

	// Lightbox for products
	const lightbox = document.getElementById('lightbox');
	const lightboxImg = document.getElementById('lightbox-img');
	const lightboxCaption = document.getElementById('lightbox-caption');
	const lightboxClose = document.getElementById('lightbox-close');

	function openLightbox(src, caption){
		lightboxImg.src = src;
		lightboxCaption.innerHTML = caption || '';
		lightbox.setAttribute('aria-hidden','false');
		lightbox.style.display = 'flex';
		lightbox.style.visibility = 'visible';
		lightbox.style.opacity = '1';
		lightbox.style.pointerEvents = 'auto';
		lightbox.style.zIndex = '99999';
	}
	function closeLightbox(){
		lightboxClose.blur();
		lightbox.setAttribute('aria-hidden','true');
		lightboxImg.src = '';
		lightbox.style.display = '';
		lightbox.style.visibility = '';
		lightbox.style.opacity = '';
		lightbox.style.pointerEvents = '';
		lightbox.style.zIndex = '';
	}

	document.querySelectorAll('.view-btn').forEach(btn=>{
		btn.addEventListener('click', ()=>{
			console.log('View button clicked', btn);
			const card = btn.closest('.card');
			const src = card.dataset.img || card.querySelector('img').src;
			const productName = card.querySelector('h4')?.textContent || '';
			const productDesc = card.querySelector('.products-desc')?.textContent || '';
			const fullCaption = `<span class="lightbox-title">${productName}</span>` + (productDesc ? `<span class="lightbox-desc">${productDesc}</span>` : '');
			console.log('Opening lightbox with src:', src, 'caption:', fullCaption);
			openLightbox(src, fullCaption);
			console.log('Lightbox aria-hidden:', lightbox.getAttribute('aria-hidden'));
		});
	});

	lightboxClose.addEventListener('click', closeLightbox);
	lightbox.addEventListener('click', e=>{ if(e.target === lightbox) closeLightbox(); });
	document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeLightbox(); });

	// Map card overlay: open lightbox or follow location link
	(function(){
		const mapCards = document.querySelectorAll('.map-card');
		if(!mapCards || mapCards.length === 0) return;
		mapCards.forEach(card => {
			const img = card.querySelector('img');
			const viewBtn = card.querySelector('.map-view');
			const linkEl = card.querySelector('.map-link');

			if(viewBtn && img){
				viewBtn.addEventListener('click', (e)=>{
					e.stopPropagation();
					openLightbox(img.src, img.alt || '');
				});
			}

			// allow pressing Enter/Space on the view button for accessibility
			if(viewBtn){
				viewBtn.addEventListener('keydown', (e)=>{
					if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); viewBtn.click(); }
				});
			}

			// link element uses native anchor; just ensure it has target
			if(linkEl){
				linkEl.addEventListener('click', (e)=>{
					
				});
			}
		});
	})();

	// PRODUCTS PAGING FOR TABLET: group every 4 cards into a horizontal page (2 columns x 2 rows)
	(function(){
		const mq = window.matchMedia('(max-width: 768px)');
		let resizeTimer = null;

		function buildPages() {
			const grid = document.querySelector('#products .products-grid');
			if(!grid) return;
			if(grid.dataset.paged === 'true') return; // already paged

			const cards = Array.from(grid.querySelectorAll('.card'));
			if(cards.length === 0) return;

			// hide original grid but keep it in DOM so we can restore later
			const originalDisplay = window.getComputedStyle(grid).display || 'flex';
			grid.dataset._origDisplay = originalDisplay;
			grid.style.display = 'none';
			grid.dataset.paged = 'true';

			// create pages container
			const pagesContainer = document.createElement('div');
			pagesContainer.className = 'products-pages';
			pagesContainer.style.display = 'flex';
			pagesContainer.style.gap = '14px';
			pagesContainer.style.overflowX = 'hidden';
			pagesContainer.style.scrollSnapType = 'x mandatory';
			pagesContainer.style.scrollBehavior = 'smooth';
			pagesContainer.style.padding = '0 10px';

			// build pages grouping 4 cards per page (2 columns x 2 rows)
			for (let i = 0; i < cards.length; i += 4) {
				const page = document.createElement('div');
				page.className = 'products-page';
				page.style.minWidth = '100%';
				page.style.boxSizing = 'border-box';
				page.style.display = 'grid';
				page.style.gridTemplateColumns = 'repeat(2, 1fr)';
				page.style.gridAutoRows = 'auto';
				page.style.gap = '14px';
				page.style.scrollSnapAlign = 'start';

				for (let j = 0; j < 4 && (i + j) < cards.length; j++) {
					page.appendChild(cards[i + j]); // moves node from grid into page
				}
				pagesContainer.appendChild(page);
			}

			// insert after the original grid
			grid.parentNode.insertBefore(pagesContainer, grid.nextSibling);

			// enable pointer dragging similar to carousel
			(function enableDrag(el){
				let isDown=false, startX=0, startScroll=0;
				el.style.touchAction = 'pan-y';
				el.addEventListener('pointerdown', (e)=>{ isDown=true; startX=e.clientX; startScroll=el.scrollLeft; el.setPointerCapture && el.setPointerCapture(e.pointerId); el.classList.add('dragging'); });
				el.addEventListener('pointermove', (e)=>{ if(!isDown) return; const dx = e.clientX - startX; el.scrollLeft = startScroll - dx; });
				['pointerup','pointercancel','pointerleave'].forEach(ev=> el.addEventListener(ev, ()=>{ if(!isDown) return; isDown=false; el.classList.remove('dragging'); }));
			})(pagesContainer);
		}

		function destroyPages() {
			const grid = document.querySelector('#products .products-grid');
			if(!grid) return;
			if(grid.dataset.paged !== 'true') return;

			const pagesContainer = grid.nextElementSibling && grid.nextElementSibling.classList && grid.nextElementSibling.classList.contains('products-pages') ? grid.nextElementSibling : null;
			if(!pagesContainer) {
				
				grid.style.display = grid.dataset._origDisplay || '';
				delete grid.dataset.paged;
				return;
			}

			// move cards back into original grid in document order
			const cards = Array.from(pagesContainer.querySelectorAll('.card'));
			cards.forEach(c => grid.appendChild(c));

			// remove pages container and show grid
			pagesContainer.parentNode.removeChild(pagesContainer);
			grid.style.display = grid.dataset._origDisplay || '';
			delete grid.dataset.paged;
			delete grid.dataset._origDisplay;
		}

		function handleResize(){
			if(resizeTimer) clearTimeout(resizeTimer);
			resizeTimer = setTimeout(()=>{
				if(window.innerWidth <= 768) buildPages(); else destroyPages();
			}, 150);
		}

		// run on load and resize
		if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>{ if(window.innerWidth <= 768) buildPages(); }); else if(window.innerWidth <= 768) buildPages();
		window.addEventListener('resize', handleResize);
	})();
	
	(function(){
		const mediaWrap = document.querySelector('.hero-media');
		if(!mediaWrap) return;
		const cards = Array.from(mediaWrap.querySelectorAll('.fan-card'));
		if(cards.length < 3) return; 


		let order = [0,1,2];
		const changeDelay = 4200; 

		function applyPositions(){
			cards.forEach(c=> c.classList.remove('pos-left','pos-center','pos-right'));
			cards[order[0]].classList.add('pos-left');
			cards[order[1]].classList.add('pos-center');
			cards[order[2]].classList.add('pos-right');
		}

		applyPositions();

		function rotateOnce(){
			order.unshift(order.pop());
			applyPositions();
		}

		let fanTimer = setInterval(rotateOnce, changeDelay);
		mediaWrap.addEventListener('mouseenter', ()=> clearInterval(fanTimer));
		mediaWrap.addEventListener('mouseleave', ()=> fanTimer = setInterval(rotateOnce, changeDelay));
	})();

	// Hero-badge toggle: show/hide item badges
	(function(){
		const badge = document.getElementById('hero-badge');
		const list = document.getElementById('hero-badges');
		if(!badge || !list) return;
		function open(){
			list.classList.add('open');
			badge.setAttribute('aria-expanded','true');
			list.setAttribute('aria-hidden','false');
		}
		function close(){
			list.classList.remove('open');
			badge.setAttribute('aria-expanded','false');
			list.setAttribute('aria-hidden','true');
		}
		badge.addEventListener('click', (e)=>{
			if(list.classList.contains('open')) close(); else open();
		});
		// close when clicking outside
		document.addEventListener('click', (e)=>{
			if(!list.classList.contains('open')) return;
			if(badge.contains(e.target) || list.contains(e.target)) return;
			close();
		});
		document.addEventListener('keydown', e=>{ if(e.key === 'Escape') close(); });

		// Handle item-badge clicks for filtering
		const itemBadges = list.querySelectorAll('.item-badge');
		itemBadges.forEach(badgeBtn => {
			badgeBtn.addEventListener('click', (e) => {
				const filterValue = badgeBtn.getAttribute('data-filter');
				const cards = document.querySelectorAll('#products .products-grid .card');
				
				cards.forEach(card => {
					const category = card.getAttribute('data-category');
					if (category === filterValue) {
						card.style.display = '';
					} else {
						card.style.display = 'none';
					}
				});
				
				close();
				// Scroll to products section
				const productsSection = document.getElementById('products');
				if (productsSection) {
					productsSection.scrollIntoView({ behavior: 'smooth' });
				}
			});
		});
	})();
	// check metamask on load (safe to call even if provider missing)
	try{ checkConnection(); }catch(e){}
	

	//SEARCH TOGGLE
	(function(){
		const wrap = document.getElementById('headerSearchWrap');
		const toggle = document.getElementById('searchToggle');
		const box = document.getElementById('headerSearch');
		const input = document.getElementById('headerSearchInput');
		const clearBtn = document.getElementById('headerSearchClear');
		if(!wrap || !toggle || !box || !input) return;

		function applyFilter(v){
			const q = (v||'').trim().toLowerCase();
			const cards = document.querySelectorAll('#products .products-grid .card');
			cards.forEach(c=>{
				const title = (c.querySelector('h4')?.textContent || '').toLowerCase();
				c.style.display = q === '' || title.indexOf(q) !== -1 ? '' : 'none';
			});
		}

		toggle.addEventListener('click', (e)=>{
			e.stopPropagation();
			// If the search box is currently hidden, open and focus it.
			const isHidden = box.getAttribute('aria-hidden') === 'true';
			if(isHidden){
				box.setAttribute('aria-hidden','false');
				setTimeout(()=> input.focus(), 50);
				return;
			}
			// If box already open and there's a query, try to find & scroll to the product.
			const q = (input.value || '').trim();
			if(q){
				findAndScroll(q);
				return;
			}
			// otherwise hide and clear
			box.setAttribute('aria-hidden','true');
			input.value = ''; applyFilter('');
		});

		input.addEventListener('input', (e)=>{
			applyFilter(e.target.value);
			if(clearBtn) clearBtn.style.display = e.target.value.trim() ? '' : 'none';
		});

		// Pressing Enter will jump to the first matching product card
		input.addEventListener('keydown', (e)=>{
			if(e.key === 'Enter'){
				e.preventDefault();
				const q = (input.value || '').trim();
				if(q) findAndScroll(q);
			}
		});

		clearBtn?.addEventListener('click', (e)=>{ e.stopPropagation(); input.value=''; applyFilter(''); clearBtn.style.display='none'; input.focus(); });

		// find first matching product card by title and scroll to it (smooth)
		function findAndScroll(q){
			const s = (q||'').trim().toLowerCase();
			if(!s) return;
			const cards = document.querySelectorAll('#products .products-grid .card');
			for(const c of cards){
				const title = (c.querySelector('h4')?.textContent || '').toLowerCase();
				if(title.indexOf(s) !== -1){
					
					c.scrollIntoView({ behavior: 'smooth', block: 'center' });
					c.classList.add('search-highlight');
					setTimeout(()=> c.classList.remove('search-highlight'), 2000);
					return;
				}
			}
			// no match: brief input feedback
			input.classList.add('not-found');
			setTimeout(()=> input.classList.remove('not-found'), 700);
		}

		document.addEventListener('click', (e)=>{
			if(box.getAttribute('aria-hidden') === 'false' && !wrap.contains(e.target)){
				box.setAttribute('aria-hidden','true'); input.value=''; applyFilter(''); if(clearBtn) clearBtn.style.display='none';
			}
		});
	})();
});


// CHECK CONNECTION ON PAGE LOAD

// Helper: get injected provider (MetaMask or legacy web3)
function getEthereumProvider() {
	if (typeof window.ethereum !== 'undefined') return window.ethereum;
	if (typeof window.web3 !== 'undefined' && window.web3.currentProvider) return window.web3.currentProvider;
	return null;
}

// Move header search into hero on small screens so it scrolls with the page
document.addEventListener('DOMContentLoaded', function(){
	const wrap = document.getElementById('headerSearchWrap');
	const headerInner = document.querySelector('.site-header .header-inner');
	const heroInner = document.querySelector('.hero-inner');
	if(!wrap || !headerInner || !heroInner) return;

	const mq = window.matchMedia('(max-width: 480px)');
	function handleMove(e){
		const matches = e.matches !== undefined ? e.matches : mq.matches;
		if(matches){
			if(!heroInner.contains(wrap)) heroInner.appendChild(wrap);
			
			wrap.style.position = 'absolute';
			wrap.style.left = '25%';
			wrap.style.top = '105%';
			wrap.style.transform = 'translateX(80%)';
			wrap.style.zIndex = '200';
		} else {
			if(!headerInner.contains(wrap)) headerInner.appendChild(wrap);
			wrap.style.position = '';
			wrap.style.left = '';
			wrap.style.top = '';
			wrap.style.transform = '';
			wrap.style.zIndex = '';
		}
	}
	handleMove(mq);
	if(mq.addEventListener) mq.addEventListener('change', handleMove); else mq.addListener(handleMove);
});

// Helper: bind listeners for accounts/chain changes (idempotent)
function bindMetamaskListeners(provider) {
	if (_metamaskListenerBound || !provider || !provider.on) return;
	try {
		provider.on('accountsChanged', (accs) => {
			if (!accs || accs.length === 0) {
				currentAccount = null; isConnected = false;

				const btn = document.getElementById('metamask');
				const content = document.getElementById('contentMetamask');
				content && content.classList.remove('show');
				btn && btn.classList.remove('active');
			} else { currentAccount = accs[0]; isConnected = true; }
			updateAllButton();
		});

		provider.on('chainChanged', (chainId) => {
			console.log('[MetaMask] chainChanged', chainId);
			
		});

		provider.on && provider.on('disconnect', (err) => {
			console.log('[MetaMask] disconnected', err);
			currentAccount = null; isConnected = false; updateAllButton();
			const btn = document.getElementById('metamask');
			const content = document.getElementById('contentMetamask');
			content && content.classList.remove('show');
			btn && btn.classList.remove('active');
		});

		_metamaskListenerBound = true;
	} catch (e) {
		console.debug('[MetaMask] bind listeners failed', e && e.message);
	}
}

async function checkConnection() {
	const provider = getEthereumProvider();
	if (!provider) return;
	try {
		// try to get accounts; don't hang forever
		console.log('[MetaMask] checkConnection: requesting eth_accounts');
		const start = Date.now();
		const accounts = await Promise.race([
			provider.request({ method: 'eth_accounts' }),
			new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))
		]);
		const took = Date.now() - start;
		console.log('[MetaMask] checkConnection: returned', accounts, 'took', took + 'ms');
		if (Array.isArray(accounts) && accounts.length > 0) {
			currentAccount = accounts[0];
			isConnected = true;
			updateAllButton();
		}
		
		bindMetamaskListeners(provider);
	} catch (err) {
	
		console.debug('[MetaMask] checkConnection error:', err && err.message);
	}
}




// CONNECT METAMASK
async function connectMetamask(buttonId) {
	const btn = document.getElementById(buttonId) || document.getElementById('metamask');
	if (!btn) return;
	const text = btn.querySelector('span') || btn;
	const content = document.getElementById('contentMetamask');

	if (isConnected) {
		if (content) content.classList.add('show');
		return;
	}

	if (isConnecting) return;

	const provider = getEthereumProvider();
	if (!provider) {
		const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
		const isFileProtocol = window.location.protocol === 'file:';
		const ua = navigator.userAgent || '';
		// If running from file://, extensions are typically not injected — advise serving over HTTP
		if (isFileProtocol) {
			alert('MetaMask tidak terdeteksi. Anda membuka file lokal (file://) sehingga ekstensi biasanya tidak diinject by browser. Coba jalankan halaman lewat server lokal (mis. `npx http-server` atau live server) dan muat ulang.');
			console.warn('[MetaMask] page loaded via file:// — extension may not inject window.ethereum');
			return;
		}

		// Desktop but provider missing — give a concise diagnostic instead of immediately redirecting to download
		if (!isMobile) {
			const likelyChromium = /Chrome|Chromium|Edg|Brave/i.test(ua);
			const likelyFirefox = /Firefox/i.test(ua);
			let msg = 'MetaMask extension tidak terdeteksi di browser ini.';
			msg += '\n\nPastikan: ';
			msg += '\n- Ekstensi MetaMask sudah terpasang dan diaktifkan.';
			msg += '\n- Jika Anda menggunakan browser berbasis Chromium/Firefox, cek ikon ekstensi dan izinkan untuk situs ini.';
			if (likelyChromium) msg += '\n- Browser terdeteksi: Chromium-based.';
			if (likelyFirefox) msg += '\n- Browser terdeteksi: Firefox.';
			msg += '\n\nJika belum terpasang, Anda dapat mengunjungi halaman download MetaMask.';
			if (confirm(msg + '\n\nBuka halaman download MetaMask sekarang?')) {
				window.open('https://metamask.io/download.html', '_blank');
			}
			console.warn('[MetaMask] provider not found and user prompted to install/enable extension');
			return;
		}

		// Mobile: redirect to MetaMask mobile app link
		window.location.href = 'https://metamask.app.link/dapp/' + window.location.href.replace(/^https?:\/\//, '');
		return;
	}

	try { if (text) text.textContent = 'Connecting...'; } catch(e){}
	if (btn && btn.setAttribute) btn.setAttribute('disabled','');
	isConnecting = true;

	try {
		console.log('[MetaMask] connectMetamask: requesting eth_requestAccounts');
		const startReq = Date.now();
		const accounts = await Promise.race([
			provider.request({ method: 'eth_requestAccounts' }),
			new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 30000))
		]);
		const tookReq = Date.now() - startReq;
		console.log('[MetaMask] connectMetamask: returned', accounts, 'took', tookReq + 'ms');
		if (!accounts || accounts.length === 0) throw new Error('no_accounts');
		currentAccount = accounts[0];
		isConnected = true;
		updateAllButton();
		if (content) {
			content.classList.add('show');
		}
		if (btn && btn.classList) btn.classList.add('active');

		
		bindMetamaskListeners(provider);
	} catch (error) {
		const msg = error && error.message ? error.message.toLowerCase() : '';
		if (msg.includes('user rejected') || msg.includes('user denied') || msg.includes('rejected')) {
			
		} else if (msg.includes('timeout')) {
			alert('MetaMask did not respond. Please try again.');
		} else {
			console.error('MetaMask connect error:', error);
			alert('Failed to connect to MetaMask. Check console for details.');
		}
		try { if (text) text.textContent = 'Connect'; } catch(e){}
	} finally {
		isConnecting = false;
		if (btn && btn.removeAttribute) btn.removeAttribute('disabled');
	}
}

// UPDATE ALL BUTTONS
function updateAllButton() {
	["metamask"].forEach((id) => {
		const span = document.getElementById(id)?.querySelector("span");
		if (!span) return;

		if (!currentAccount) {
			span.textContent = "Connect";
		} else { 
			const shortAddress = currentAccount.slice(0, 6) + "..." + currentAccount.slice(-4);
			span.textContent = shortAddress;
		}
	});
}

// EVENT LISTENER BUTTON
document.getElementById("metamask")?.addEventListener("click", (e) => {
	e.stopPropagation();
	const btn = e.currentTarget;
	const content = document.getElementById('contentMetamask');

	// Only show/toggle the attached content when already connected
	if (isConnected) {
		if(content) content.classList.toggle('show');
		if(btn && btn.classList) btn.classList.toggle('active');
		return;
	}

	// If not connected, start connection flow but DO NOT show the content yet
	if (!isConnecting) {
		connectMetamask("metamask");
	}
});

document.getElementById("balanceMetamask")?.addEventListener("click", (e) => {
	e.stopPropagation();
	if (typeof fetchAndDisplayBalance === 'function') fetchAndDisplayBalance();
});


// CLOSE CONTENT JIKA KLIK LUAR
document.addEventListener("click", (e) => {
	["metamask"].forEach((id) =>{
		const btn = document.getElementById(id);
		const contentId = id === "metamask" ? "contentMetamask" : null;
		const content = document.getElementById(contentId);

		if (!btn || !content) return;

		// sembunyikan content hanya jika klik di luar tombol
		if (!btn.contains(e.target) && !content.contains(e.target)) {
			content.classList.remove("show");
			btn.classList.remove('active');
		}
	});
});


// CONTENT ACTIONS
// open metamask Portfolio in a new tab
function openMetaMaskPortfolio() {
	const url = 'https://portfolio.metamask.io';
	window.open(url, '_blank');
}

// Redirect helpers for Send and Swap: warn user then redirect to MetaMask
function fetchSend() {
	if (!confirm('Anda akan dialihkan ke MetaMask Portfolio untuk melakukan Send (kirim). Lanjutkan?')) return;
	try {
		window.open('https://portfolio.metamask.io', '_blank');
	} catch (err) {
		console.error('fetchSend error', err);
		alert('Gagal mengarahkan ke MetaMask Portfolio (lihat console).');
	}
}

function fetchSwap() {
	if (!confirm('Anda akan dialihkan ke MetaMask Portfolio untuk melakukan Swap. Lanjutkan?')) return;
	try {
		window.open('https://portfolio.metamask.io', '_blank');
	} catch (err) {
		console.error('fetchSwap error', err);
		alert('Gagal mengarahkan ke MetaMask Portfolio (lihat console).');
	}
}


// Show/hide landing content cards (balance, wallet, history, products)

function showOverlayById(id) {
	if (!id) return;
	
	document.querySelectorAll('.landing-balance').forEach(el => el.classList.remove('active'));
	const el = document.getElementById(id);
	if (el) {
		el.classList.add('active');
		
		const header = document.querySelector('.site-header');
		const headerHeight = header ? header.getBoundingClientRect().height : 0;
		const rect = el.getBoundingClientRect();
		const targetY = window.scrollY + rect.top - headerHeight - 12; 
		window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
		
		el.setAttribute('tabindex', '-1');
		el.focus({ preventScroll: true });
	}
}

function closeContent() {
	document.querySelectorAll('.landing-balance').forEach(el => el.classList.remove('active'));
}

// Show Buy Products card and render its content
function showBuyProducts() {
	console.debug('[Buy] showBuyProducts called');
	try {
		// render current products into the card
		try { renderBuyProductsContent(); } catch (err) { console.error('[Buy] render error', err); }

		// display the buyProducts card using existing overlay helper
		showOverlayById('buyProducts');

		// force focus and active class for accessibility and to avoid CSS hiding issues
		const card = document.getElementById('buyProducts');
		if (card) {
			card.classList.add('active');
			card.setAttribute('tabindex', '-1');
			try { card.focus({ preventScroll: true }); } catch (e) {}
		}

		// ensure the MetaMask dropdown is closed when opening the card
		const dropdown = document.getElementById('contentMetamask');
		if (dropdown) dropdown.classList.remove('show');
		const mmBtn = document.getElementById('metamask');
		if (mmBtn) mmBtn.classList.remove('active');

		console.debug('[Buy] buyProducts card shown');
	} catch (e) {
		console.error('[Buy] showBuyProducts failed', e);
	}
}

// wire close buttons for each card
document.getElementById('closeBalance')?.addEventListener('click', (e) => { e.stopPropagation(); closeContent(); });
document.getElementById('closeWallet')?.addEventListener('click', (e) => { e.stopPropagation(); closeContent(); });
document.getElementById('closeHistory')?.addEventListener('click', (e) => { e.stopPropagation(); closeContent(); });
document.getElementById('closeProducts')?.addEventListener('click', (e) => { e.stopPropagation(); closeContent(); });

// Buy Products card: Open on OpenSea, Open in MetaMask (open card / deep link), Close
document.getElementById('openOpenseaBuy')?.addEventListener('click', (e) => {
	e.stopPropagation();
	try {
		
		const productsArr = JSON.parse(localStorage.getItem('products') || '[]');
		const savedContract = (localStorage.getItem('productKeyOrContract') || '').trim();

		if (Array.isArray(productsArr) && productsArr.length > 0) {
			const prod = productsArr[0];
			if (prod && prod.openseaUrl) {
				window.open(prod.openseaUrl, '_blank');
				return;
			}
		}

		if (savedContract) {
			const url = `https://opensea.io/search?query=${encodeURIComponent(savedContract)}`;
			window.open(url, '_blank');
			return;
		}

		alert('No product or contract configured to open on OpenSea. Add a product or save a contract first.');
	} catch (err) {
		console.error('openOpenseaBuy error', err);
		alert('Failed to open OpenSea (see console).');
	}
});

document.getElementById('openMetamaskBuy')?.addEventListener('click', (e) => {
	e.stopPropagation();
	try {
		window.open('https://portfolio.metamask.io', '_blank');
	} catch (err) {
		console.error('openMetamaskBuy error', err);
		alert('Failed to open MetaMask Portfolio (see console).');
	}
});

document.getElementById('closeBuyStatic')?.addEventListener('click', (e) => { e.stopPropagation(); closeContent(); });

// refresh balance when user clicks the refresh button inside the balance card
document.getElementById('refreshBalance')?.addEventListener('click', (e) => {
	e.stopPropagation();
	fetchAndDisplayBalance();
});

// WALLET BALANCE CARD
function handleContentClick(e) {
	const btn = e.target.closest('button');
	if (!btn) return;
	const action = btn.dataset && btn.dataset.action;
	if (!action) return;
	e.stopPropagation();
	console.log('[DEBUG] content action', action);

	switch(action) { 
			case 'view-balance':
			fetchAndDisplayBalance()
			break;
		case 'view-address':
			displayWalletAddress();
			break;
		case 'view-history':
			fetchTransactionHistory();
			break;
		case 'buy-products':
			showBuyProducts();
			break;
		case 'send':
			fetchSend();
			break;
		case 'swap':
				fetchSwap();
				break;
		case 'network':
			displayNetwork();
			break;
		case 'disconnect':
			disconnectWallet();
			break;
		default:
			break;
	}

	// close only the MetaMask dropdown (keep landing cards visible)
	const dropdown = document.getElementById('contentMetamask');
	if (dropdown) dropdown.classList.remove('show');
	const mmBtn = document.getElementById('metamask');
	if (mmBtn) mmBtn.classList.remove('active');
}

document.getElementById('contentMetamask')?.addEventListener('click', handleContentClick);

// Direct bind for history button to ensure hint shows when opened from dropdown
document.getElementById('historyMetamask')?.addEventListener('click', (e) => {
	e.stopPropagation();
	const hint = document.getElementById('historyHint');
	if (hint) hint.style.display = '';
	try { fetchTransactionHistory(); } catch (err) { console.error('fetchTransactionHistory direct bind error', err); }
	const dropdown = document.getElementById('contentMetamask'); if (dropdown) dropdown.classList.remove('show');
	const mmBtn = document.getElementById('metamask'); if (mmBtn) mmBtn.classList.remove('active');
});

// Direct fallback: if delegation doesn't trigger, ensure the Buy button opens the Buy Products UI
document.getElementById('productsMetamask')?.addEventListener('click', (e) => {
	e.stopPropagation();
	console.debug('[Buy] productsMetamask clicked fallback');
	try { showBuyProducts(); } catch (err) { console.error('showBuyProducts fallback error', err); }
	const dropdown = document.getElementById('contentMetamask');
	if (dropdown) dropdown.classList.remove('show');
	const mmBtn = document.getElementById('metamask');
	if (mmBtn) mmBtn.classList.remove('active');
});

//show message using existing wallet card when wallet not connected
function showWalletPrompt() {
	const walletAddrEl = document.getElementById('walletAddress');
	const walletCard = document.getElementById('walletCard');
	if (walletAddrEl && walletCard) { 
		walletAddrEl.textContent = 'Please connect your MetaMask wallet to view your address.';
		showOverlayById('walletCard');
	}else {
		alert('Please connect your MetaMask wallet to view your address.');
	}
}

// function to fetch and display MetaMask balance
async function fetchAndDisplayBalance() {
	console.log('fetchAndDisplayBalance called');

	if (!isConnected || !currentAccount) {
		console.error('MetaMask is not connected or currentAccount is null');
		showWalletPrompt();
		return;
	}

	// show loading on refresh button if present and set interim text
	const refreshBtn = document.getElementById('refreshBalance');
	const ethEl = document.getElementById('ethBalance');
	if (ethEl) ethEl.textContent = 'Loading...';
	if (refreshBtn) {
		refreshBtn.classList.add('loading');
		refreshBtn.disabled = true;
	}

	try {
		console.log('Fetching balance for account:', currentAccount);
		const provider = getEthereumProvider();
		if (!provider) throw new Error('no_provider');

		const balance = await provider.request({ method: 'eth_getBalance', params: [currentAccount, 'latest'] });

		// balance is a hex string like '0x123...'
		let ethBalanceStr = null;

		if (typeof ethers !== 'undefined' && ethers.utils && typeof ethers.utils.formatEther === 'function') {
			try {
				ethBalanceStr = ethers.utils.formatEther(balance);
			} catch (e) {
				console.warn('ethers.formatEther failed, falling back to BigInt formatter', e);
				ethBalanceStr = null;
			}
		}

		// fallback: format hex wei to ether using BigInt arithmetic
		if (ethBalanceStr === null) {
			try {
				const wei = BigInt(balance.toString());
				const WEI_IN_ETH = 1000000000000000000n;
				const integer = wei / WEI_IN_ETH;
				const remainder = wei % WEI_IN_ETH;
				const frac = Number((remainder * 10000n) / WEI_IN_ETH);
				ethBalanceStr = integer.toString() + '.' + frac.toString().padStart(4, '0');
			} catch (e) {
				console.error('Failed to parse balance fallback:', e);
				throw e;
			}
		}

		console.log('Balance fetched:', ethBalanceStr);
		if (ethEl) ethEl.textContent = parseFloat(ethBalanceStr).toFixed(4);

		// ensure the balance card is visible
		const balanceCard = document.getElementById('balanceCard');
		if (balanceCard) {
			showOverlayById('balanceCard');
			console.log('Balance card displayed');
		} else {
			console.error('Balance card element not found');
		}
	} catch (error) {
		console.error('Error fetching balance:', error);
		if (error && error.message === 'no_provider') {
			showWalletPrompt();
		} else {
			alert('Failed to fetch balance. Please try again');
		}
	} finally {
		if (refreshBtn) {
			refreshBtn.classList.remove('loading');
			refreshBtn.disabled = false;
		}
	}
}

// WALLET ADDRESS CARD

function displayWalletAddress() {
	if (!isConnected || !currentAccount) {
		showWalletPrompt();
		return;
	}
	const walletAddrEl = document.getElementById('walletAddress');
	if (walletAddrEl) {
		walletAddrEl.textContent = currentAccount;
	}
	showOverlayById('walletCard');
}

// copy wallet address to clipboard and show temporary feedback
document.getElementById('copyWallet')?.addEventListener('click', async (e) => {
	e.stopPropagation();
	if (!currentAccount) {
		showWalletPrompt();
		return;
	}
	try {
		await navigator.clipboard.writeText(currentAccount);
		const btn = document.getElementById('copyWallet');
		const orig = btn.textContent;
		btn.textContent = 'Copied';
		setTimeout(() => { btn.textContent = orig; }, 1600);
	} catch (err) {
		console.error('Copy failed', err);
		alert('Failed to copy address.');
	}
});

// open etherscan from wallet card
document.getElementById('openEtherscan')?.addEventListener('click', (e) => {
	e.stopPropagation();
	if (!currentAccount) { showWalletPrompt(); return; }
	const url = `https://etherscan.io/address/${currentAccount}`;
	window.open(url, '_blank');
});


// TRANSACTION HISTORY CARD

function shortenAddress(addr) {
	if (!addr) return '';
	return addr.slice(0,6) + '...' + addr.slice(-4);
}

function formatWeiToEth(weiHex) {
	try {
		const wei = BigInt(weiHex.toString());
		const WEI_IN_ETH = 1000000000000000000n;
		const integer = wei / WEI_IN_ETH;
		const remainder = wei % WEI_IN_ETH;
		const frac = Number((remainder * 1000000n) / WEI_IN_ETH); // 6 decimals
		return integer.toString() + '.' + frac.toString().padStart(6, '0');
	} catch (e) {
		return '0';
	}
}

async function fetchTransactionHistory() {
	if (!isConnected || !currentAccount) { showWalletPrompt(); return; }

	const refreshBtn = document.getElementById('loadHistory');
	const listEl = document.getElementById('transactionList');
	const keyStatus = document.getElementById('etherscanKeyInput');
	if (listEl) listEl.innerHTML = '<li>Loading...</li>';
	if (refreshBtn) { refreshBtn.classList.add('loading'); refreshBtn.disabled = true; }

	try {
		// prefer localStorage key if user has configured it
		const localKey = localStorage.getItem('etherscanApiKey');
		const localProduct = localStorage.getItem('productKeyOrContract');
		const API_KEY = localKey || window.ETHERSCAN_API_KEY || window.ETHERSCAN_KEY || null;

		// ensure the history hint is visible when user opens the History card without a key
		const hintEl = document.getElementById('historyHint');
		if (!API_KEY && !localProduct && hintEl) {
			hintEl.style.display = '';
		}

		// if there's no API key and no saved contract/address, show a helpful message
		if (!API_KEY && !localProduct) {
			if (listEl) listEl.innerHTML = '<li>No History Configured</li>';
			showOverlayById('historyCard');
			return;
		}


		const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${currentAccount}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${API_KEY}`;
		const resp = await fetch(url);
		const data = await resp.json();
		if (!data || data.status !== '1' || !Array.isArray(data.result)) {
			if (listEl) listEl.innerHTML = '';
			showOverlayById('historyCard');
			return;
		}

		const txs = data.result;
		if (listEl) listEl.innerHTML = '';
		txs.forEach(tx => {
			const value = (typeof ethers !== 'undefined' && ethers.utils && ethers.utils.formatEther) ? (ethers.utils.formatEther(tx.value)) : formatWeiToEth(tx.value);
			const li = document.createElement('li');
			const time = tx.timeStamp ? new Date(tx.timeStamp * 1000).toLocaleString() : '';
			li.innerHTML = `<a href="https://etherscan.io/tx/${tx.hash}" target="_blank">${tx.hash.slice(0,10)}...${tx.hash.slice(-6)}</a> — ${parseFloat(value).toFixed(6)} ETH — ${tx.to ? 'to ' + shortenAddress(tx.to) : ''} — ${time}`;
			listEl.appendChild(li);
		});

		showOverlayById('historyCard');
	} catch (err) {
		console.error('fetchTransactionHistory error', err);
		if (listEl) listEl.innerHTML = '<li>Error loading history</li>';
		showOverlayById('historyCard');
	} finally {
		if (refreshBtn) { refreshBtn.classList.remove('loading'); refreshBtn.disabled = false; }
	}
}

// wire Load button to reload transactions
document.getElementById('loadHistory')?.addEventListener('click', (e) => { e.stopPropagation(); fetchTransactionHistory(); });

// save / clear etherscan API key from input inside history card
document.getElementById('saveEtherscanKey')?.addEventListener('click', (e) => {
	e.stopPropagation();
	const input = document.getElementById('etherscanKeyInput');
	if (!input) return;
	const val = input.value && input.value.trim();
	if (!val) {
		alert('Please enter a valid API key to save.');
		return;
	}
	// small ping to validate key
	const testUrl = `https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${val}`;
	fetch(testUrl).then(r=>r.json()).then(data=>{
			if (data && (data.result || data.status === '1')) {
			localStorage.setItem('etherscanApiKey', val);
			input.value = '';
			const hint = document.getElementById('historyHint');
			if (hint) hint.textContent = 'API key saved locally — click Load to load history.';
			
			const clearBtn = document.getElementById('clearEtherscanKey');
			if (clearBtn) clearBtn.style.display = '';
			
			updateHistoryHintVisibility();
			alert('Etherscan API key validated and saved to this browser.');
		} else {
			console.error('Etherscan validation failed', data);
			alert('API key validation failed. Please check the key and try again.');
		}
	}).catch(err=>{
		console.error('Etherscan ping failed', err);
		alert('Failed to validate API key (network or CORS error). Key not saved.');
	});
});

document.getElementById('clearEtherscanKey')?.addEventListener('click', (e) => {
	e.stopPropagation();
	localStorage.removeItem('etherscanApiKey');
	const hint = document.getElementById('historyHint');
	if (hint) hint.textContent = 'No API key configured. You can click "Open in Etherscan" to view the address on Etherscan.';
	const clearBtn = document.getElementById('clearEtherscanKey');
	if (clearBtn) clearBtn.style.display = 'none';
	// update hint visibility
	updateHistoryHintVisibility();
	alert('Saved Etherscan API key cleared from this browser.');
});

// on load, populate input placeholder if key exists
document.addEventListener('DOMContentLoaded', () => {
	const key = localStorage.getItem('etherscanApiKey');
	const input = document.getElementById('etherscanKeyInput');
	if (input && key) {
		input.placeholder = 'Saved API key present (will be used)';
	}
    
    const clearBtn = document.getElementById('clearEtherscanKey');
    if (clearBtn && key) clearBtn.style.display = '';
});

// HINT VISIBILITY HELPERS
function updateHistoryHintVisibility() {
	const localKey = localStorage.getItem('etherscanApiKey');
	const localProduct = localStorage.getItem('productKeyOrContract');
	const input = document.getElementById('etherscanKeyInput');
	const hint = document.getElementById('historyHint');
	const hasInput = input && input.value && input.value.trim().length > 0;
	if (hint) {
		if (localKey || localProduct || hasInput) {
			hint.style.display = 'none';
		} else {
			hint.style.display = '';
			hint.textContent = 'No history configured. Paste an API key or contract address to enable loading history.';
		}
	}
}

function updateProductHintVisibility() {
	const localKey = localStorage.getItem('productKeyOrContract');
	const input = document.getElementById('productKeyInput');
	const hint = document.getElementById('productHint');
	const cfg = document.getElementById('buyConfigureToggle');
	const hasInput = input && input.value && input.value.trim().length > 0;
	if (hint) {
		if (localKey || hasInput) {
			hint.style.display = 'none';
		} else {
			hint.style.display = '';
			hint.textContent = '*No API key and Contract Address configured. You can click "Open on Etherscan" to view the address on Etherscan.';
		}
	}
	// hide the configure area if a contract is saved
	if (cfg) {
		if (localKey) cfg.style.setProperty('display', 'none'); else cfg.style.removeProperty('display');
	}
}

// wire input events to hide hint when user types
document.getElementById('etherscanKeyInput')?.addEventListener('input', (e) => { updateHistoryHintVisibility(); });
const productKeyInputEl = document.getElementById('productKeyInput');
productKeyInputEl?.addEventListener('input', (e) => { updateProductHintVisibility(); });

// Save contract address locally when user presses Enter or when leaving the input
productKeyInputEl?.addEventListener('keydown', (e) => {
	if (e.key === 'Enter') {
		e.preventDefault();
		const v = (productKeyInputEl.value || '').trim();
		if (!v) return alert('Please enter a contract address to save.');
		localStorage.setItem('productKeyOrContract', v);
		updateProductHintVisibility();
		const savedHint = document.getElementById('productSavedHint');
		if (savedHint) {
			savedHint.style.display = 'inline-block';
			setTimeout(() => { savedHint.style.display = 'none'; }, 1200);
		}

		try { showBuyProducts(); renderBuyProductsContent(); } catch (err) { console.error('render after save error', err); }
		
		const cfg = document.getElementById('buyConfigureToggle'); if (cfg) cfg.style.setProperty('display', 'none');
	}
});

productKeyInputEl?.addEventListener('blur', (e) => {
	const v = (productKeyInputEl.value || '').trim();
	if (!v) return;
	localStorage.setItem('productKeyOrContract', v);
	updateProductHintVisibility();
	// hide configure UI after saving on blur
	const cfg = document.getElementById('buyConfigureToggle'); if (cfg) cfg.style.setProperty('display', 'none');
});

// initialize hint visibility on load
updateHistoryHintVisibility();
updateProductHintVisibility();


// BUY PRODUCTS
function renderBuyProductsContent() {
	let productsArr = [];
	try { productsArr = JSON.parse(localStorage.getItem('products') || '[]'); } catch (e) { productsArr = []; }
	const card = document.getElementById('buyProducts');
	if (!card) return;

	let content = card.querySelector('#buyProductsContent');
	if (!content) {
		content = document.createElement('div');
		content.id = 'buyProductsContent';
		content.style.marginTop = '8px';
		const ref = card.querySelector('#buyHintStatic');
		if (ref && ref.nextSibling) card.insertBefore(content, ref.nextSibling);
		else card.appendChild(content);
	}
	content.innerHTML = '';

	// configured contract display is handled separately under the Buy Products heading


	const ul = document.createElement('ul');
	ul.style.listStyle = 'none';
	ul.style.padding = '0';
	ul.style.margin = '0';

	productsArr.forEach((prod, idx) => {
		const li = document.createElement('li');
		li.style.display = 'flex';
		li.style.justifyContent = 'space-between';
		li.style.alignItems = 'center';
		li.style.margin = '6px 0';

		const info = document.createElement('span');
		info.textContent = `${prod.name} — ${Number(prod.price || 0)} ETH`;

		const controls = document.createElement('div');
		controls.style.display = 'flex';
		controls.style.gap = '8px';

		const amt = document.createElement('input');
		amt.type = 'number'; amt.min = '1'; amt.value = '1'; amt.style.width = '4.5rem';
		const buyBtn = document.createElement('button');
		buyBtn.className = 'refreshbtn';
		buyBtn.textContent = 'Buy';
		buyBtn.addEventListener('click', (e) => { e.stopPropagation(); buyProductHandler(idx, Number(amt.value) || 1, buyBtn); });

		controls.appendChild(amt);
		controls.appendChild(buyBtn);

		li.appendChild(info);
		li.appendChild(controls);
		ul.appendChild(li);
	});

	content.appendChild(ul);
}

// Purchase flow with UX improvements
async function buyProductHandler(productIndex, amount, btn) {
	try { btn.disabled = true; btn.textContent = 'Sending...'; } catch (e) {}
	try {
		let productsArr = [];
		try { productsArr = JSON.parse(localStorage.getItem('products') || '[]'); } catch (e) { productsArr = []; }
		const prod = productsArr[productIndex];
		if (!prod) return alert('Product not found');

		const savedContract = localStorage.getItem('productKeyOrContract');
		const advancedInput = document.getElementById('advancedContractInput');
		const contract = (savedContract || (advancedInput && advancedInput.value && advancedInput.value.trim()) || '').trim();
		if (!contract) return alert('Please configure a contract address in the input before buying.');

		const provider = getEthereumProvider();
		if (!provider) return alert('MetaMask not detected. Please install/enable MetaMask.');

		if (!currentAccount) {
			const accs = await provider.request({ method: 'eth_requestAccounts' });
			if (!accs || accs.length === 0) return alert('No account available.');
			currentAccount = accs[0]; isConnected = true; updateAllButton(); bindMetamaskListeners(provider);
		}

		const total = Number(prod.price || 0) * (amount || 1);
		if (!confirm(`Confirm purchase: ${amount} x ${prod.name} — total ${total} ETH ?`)) return;

		const valueHex = convertEthToWeiHex(total);
		await provider.request({ method: 'eth_sendTransaction', params: [{ from: currentAccount, to: contract, value: valueHex }] });
		alert('Transaction sent. Check your wallet for details.');
	} catch (err) {
		console.error('buyProductHandler error', err);
		alert('Failed to send transaction. See console for details.');
	} finally {
		try { btn.disabled = false; btn.textContent = 'Buy'; } catch (e) {}
	}
}

// Manage products: add/clear and load from contract
document.getElementById('manageProductsToggle')?.addEventListener('click', (e) => {
	e.stopPropagation();
	const el = document.getElementById('manageProducts');
	if (!el) return;
	el.classList.toggle('open');
});

document.getElementById('addProductBtn')?.addEventListener('click', (e) => {
	e.stopPropagation();
	const name = (document.getElementById('productNameInput')?.value || '').trim();
	const price = parseFloat((document.getElementById('productPriceInput')?.value || '') || '0');
	if (!name || !price) return alert('Please enter product name and price.');
	let p = [];
	try { p = JSON.parse(localStorage.getItem('products') || '[]'); } catch (err) { p = []; }
	p.push({ name: name, price: price });
	localStorage.setItem('products', JSON.stringify(p));
	document.getElementById('productNameInput').value = '';
	document.getElementById('productPriceInput').value = '';
	try { renderBuyProductsContent(); } catch (err) { console.error('render after add error', err); }
	alert('Product added');
});

document.getElementById('clearProductsBtn')?.addEventListener('click', (e) => {
	e.stopPropagation();
	if (!confirm('Clear all saved products?')) return;
	localStorage.removeItem('products');
	try { renderBuyProductsContent(); } catch (err) { console.error('render after clear error', err); }
});

document.getElementById('loadFromContractBtn')?.addEventListener('click', async (e) => {
	e.stopPropagation();
	const status = document.getElementById('loadContractStatus');
	status.textContent = 'Loading...';
	const abiText = (document.getElementById('abiInput')?.value || '').trim();
	const contractAddr = localStorage.getItem('productKeyOrContract') || (document.getElementById('productKeyInput')?.value || '').trim();
	if (!contractAddr) { status.textContent = 'No contract address saved.'; return; }
	if (!abiText) { status.textContent = 'Paste ABI JSON to call contract.'; return; }
	if (typeof window.ethers === 'undefined') {
		status.textContent = 'ethers.js not found. Include ethers to use this feature.';
		return;
	}
	try {
		const abi = JSON.parse(abiText);
		const provider = new ethers.providers.Web3Provider(window.ethereum);
		const contract = new ethers.Contract(contractAddr, abi, provider);
		if (typeof contract.getProducts === 'function') {
			const res = await contract.getProducts();
			if (Array.isArray(res)) {
				const mapped = res.map(r => ({ name: r.name || r[0] || 'Item', price: Number(r.price || r[1] || 0) }));
				localStorage.setItem('products', JSON.stringify(mapped));
				status.textContent = 'Loaded products from contract.';
				renderBuyProductsContent();
				return;
			}
		}
		status.textContent = 'Contract does not expose getProducts or returned unexpected format.';
	} catch (err) {
		console.error('loadFromContract error', err);
		status.textContent = 'Failed to load from contract (see console).';
	}
});


// NETWORK

// Supported networks for quick switch (chainId in hex)
const NETWORKS = [
	{ chainId: '0x1', name: 'Ethereum Mainnet' },
	{ chainId: '0x5', name: 'Goerli Testnet' },
	{ chainId: '0x89', name: 'Polygon (Mainnet)' },
	{ chainId: '0x13881', name: 'Mumbai (Polygon Testnet)' },
	{ chainId: '0x38', name: 'BSC (Binance Smart Chain)' },
	{ chainId: '0xa86a', name: 'Avalanche' }
];

// Map for adding networks if missing (minimal required fields)
const ADD_NETWORK_PARAMS = {
	'0x89': {
		chainId: '0x89',
		chainName: 'Polygon Mainnet',
		nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
		rpcUrls: ['https://polygon-rpc.com/'],
		blockExplorerUrls: ['https://polygonscan.com/']
	},
	'0x13881': {
		chainId: '0x13881',
		chainName: 'Mumbai Testnet',
		nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
		rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
		blockExplorerUrls: ['https://mumbai.polygonscan.com/']
	},
	'0x38': {
		chainId: '0x38',
		chainName: 'BSC Mainnet',
		nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
		rpcUrls: ['https://bsc-dataseed.binance.org/'],
		blockExplorerUrls: ['https://bscscan.com/']
	},
	'0xa86a': {
		chainId: '0xa86a',
		chainName: 'Avalanche C-Chain',
		nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
		rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
		blockExplorerUrls: ['https://snowtrace.io/']
	}
};

async function displayNetwork() {
	const provider = getEthereumProvider();
	if (!provider) { showWalletPrompt(); return; }
	try {
		const chainId = await provider.request({ method: 'eth_chainId' });
		const mapping = NETWORKS.find(n => n.chainId === chainId);
		const name = mapping ? mapping.name : `Unknown (${chainId})`;

		const currentEl = document.getElementById('currentNetwork');
		if (currentEl) currentEl.textContent = `Current network: ${name}`;

		// populate select
		const select = document.getElementById('networkSelect');
		if (select) {
			select.innerHTML = '';
			NETWORKS.forEach(n => {
				const opt = document.createElement('option');
				opt.value = n.chainId;
				opt.textContent = n.name + (n.chainId === chainId ? ' (current)' : '');
				if (n.chainId === chainId) opt.selected = true;
				select.appendChild(opt);
			});
		}

		showOverlayById('networkCard');
	} catch (err) {
		console.error('displayNetwork error', err);
		alert('Gagal membaca jaringan dari MetaMask. Pastikan wallet terhubung.');
	}
}

async function switchNetwork() {
	const provider = getEthereumProvider();
	if (!provider) { showWalletPrompt(); return; }
	const select = document.getElementById('networkSelect');
	if (!select) return alert('Network selector not found');
	const chainId = select.value;
	if (!chainId) return;
	if (!confirm('Anda akan meminta MetaMask untuk beralih jaringan. Lanjutkan?')) return;

	try {
		await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
		alert('Network switched.');
		// refresh display
		setTimeout(() => displayNetwork(), 800);
	} catch (err) {
		console.error('switchNetwork error', err);
		if (err && (err.code === 4902 || (err.data && err.data.originalError && err.data.originalError.code === 4902))) {
			const params = ADD_NETWORK_PARAMS[chainId];
			if (!params) return alert('Network not available to add programmatically. Please add it in your wallet manually.');
			try {
				await provider.request({ method: 'wallet_addEthereumChain', params: [params] });
				alert('Network added. Attempting to switch now...');
				await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
				setTimeout(() => displayNetwork(), 800);
			} catch (addErr) {
				console.error('addEthereumChain error', addErr);
				alert('Gagal menambahkan jaringan ke MetaMask. Cek konsol untuk detail.');
			}
		} else {
			alert('Gagal beralih jaringan. Cek konsol untuk detail.');
		}
	}
}

// wire network UI buttons
document.getElementById('switchNetworkBtn')?.addEventListener('click', (e) => { e.stopPropagation(); switchNetwork(); });
document.getElementById('closeNetwork')?.addEventListener('click', (e) => { e.stopPropagation(); closeContent(); });


// DISCONNECT

function disconnectWallet() {
	try {
		if (!confirm('Disconnect from MetaMask?')) return;

		// Clear local connection state
		currentAccount = null;
		isConnected = false;

		// Update UI: hide dropdowns, reset connect button
		const mmBtn = document.getElementById('metamask');
		const content = document.getElementById('contentMetamask');
		if (content) content.classList.remove('show');
		if (mmBtn) {
			mmBtn.classList.remove('active');
			const span = mmBtn.querySelector('span');
			if (span) span.textContent = 'Connect';
		}

		// remove any focused overlay cards
		closeContent();

		// Inform the user — note: MetaMask extension may still keep an authorized connection; to fully revoke, remove site access from MetaMask.
		alert('Disconnected locally. To fully revoke access, open MetaMask and remove site permissions for this site.');
	} catch (err) {
		console.error('disconnectWallet error', err);
		alert('Failed to disconnect cleanly. See console for details.');
	}
}


// PRODUCTS  SECTION: enable swipe/drag and arrow controls for .products-grid (desktop + mobile)
(function(){
	function initProductsCarousel(){
		const grid = document.querySelector('#products .products-grid');
		if(!grid) return;

		grid.style.touchAction = 'pan-y';

		let wrapper = grid.parentElement;
		if(!wrapper || !wrapper.classList || !wrapper.classList.contains('products-wrapper')){
			const container = document.createElement('div');
			container.className = 'products-wrapper';
			grid.parentNode.insertBefore(container, grid);
			container.appendChild(grid);
			wrapper = container;
		}

		let isDown = false, startX = 0, startScroll = 0, pointerId = null;

		if (window.PointerEvent) {
			grid.addEventListener('pointerdown', (e) => {
				isDown = true; pointerId = e.pointerId; grid.setPointerCapture(pointerId);
				startX = e.clientX; startScroll = grid.scrollLeft;
				grid.classList.add('dragging');
			});
			grid.addEventListener('pointermove', (e) => {
				if (!isDown) return;
				const dx = e.clientX - startX;
				grid.scrollLeft = startScroll - dx;
			});
			['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => grid.addEventListener(ev, (e) => {
				if (!isDown) return; isDown = false; try { grid.releasePointerCapture && grid.releasePointerCapture(pointerId); } catch (e) {}
				grid.classList.remove('dragging');
			}));
		} else {
			
			grid.addEventListener('mousedown', (e) => {
				isDown = true; startX = e.clientX; startScroll = grid.scrollLeft;
				grid.classList.add('dragging');
				e.preventDefault();
			});
			document.addEventListener('mousemove', (e) => {
				if (!isDown) return; const dx = e.clientX - startX; grid.scrollLeft = startScroll - dx;
			});
			document.addEventListener('mouseup', (e) => {
				if (!isDown) return; isDown = false; grid.classList.remove('dragging');
			});

			// touch fallback
			grid.addEventListener('touchstart', (e) => {
				if (e.touches.length !== 1) return; isDown = true; startX = e.touches[0].clientX; startScroll = grid.scrollLeft; grid.classList.add('dragging');
			});
			grid.addEventListener('touchmove', (e) => {
				if (!isDown) return; const dx = e.touches[0].clientX - startX; grid.scrollLeft = startScroll - dx;
			}, { passive: false });
			grid.addEventListener('touchend', (e) => { if (!isDown) return; isDown = false; grid.classList.remove('dragging'); });
		}

		// show/hide arrows based on scroll
		const prevBtn = wrapper.querySelector('.products-nav.prev');
		const nextBtn = wrapper.querySelector('.products-nav.next');
		function updateNav(){
			if(!prevBtn || !nextBtn) return;
			prevBtn.style.display = grid.scrollLeft > 8 ? '' : 'none';
			nextBtn.style.display = (grid.scrollLeft + grid.clientWidth) < (grid.scrollWidth - 8) ? '' : 'none';
		}
		grid.addEventListener('scroll', updateNav);
		window.addEventListener('resize', updateNav);
		updateNav();
	}

	if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initProductsCarousel); else initProductsCarousel();

})();