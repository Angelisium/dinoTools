// ==UserScript==
// @name			dinoTools
// @version			0.1
// @description		<3
// @author			Angelisium
// @match			http://en.dinorpg.com/*
// @match			http://es.dinorpg.com/*
// @match			http://www.dinorpg.com/*
// @grant			none
// ==/UserScript==

function decodeURL(str) {
	return decodeURIComponent(str.split("+").join(" "));
}

function urlDecode(str) {
	let obj = {};
	str.split('&').forEach(a=> {
		let b = a.split('=');
		if(b.length>1) obj[b.shift()] = decodeURL(b.join('='));
	}); return obj;
}

class haxeUnserializer {
	constructor(str) {
		this.buffer= str;
		this.length= str.length;
		this.cache= [];
		this.scache= [];
		this.pos= 0;
		this.unserialized= this.unserialize();
	}
	unserialize() {
		let a= this.buffer[this.pos++],
			b= {
				a: 'readArray',
				d: 'readFloat',
				f: 'readFalse',
				i: 'readDigits',
				j: 'readEnum',
				k: 'readNaN',
				l: 'readList',
				m: 'readNegativeInfinity',
				n: 'readNull',
				o: 'readObject',
				p: 'readPositiveInfinity',
				r: 'readCache',
				t: 'readTrue',
				u: 'readMultipleNull',
				v: 'readDate',
				x: 'readError',
				y: 'readString',
				z: 'readZero',
				R: 'readStringCache'
			};
		if(b.hasOwnProperty(a)) {
			return this[b[a]]();
		} else {
			throw `Invalid char "${this.buffer[this.pos-1]}" (${this.buffer.charCodeAt(this.pos-1)}) at position ${this.pos-1}`;
		}
	}
	readArray() {
		let a= [];
		while(true) {
			let b= this.buffer[this.pos];
			if(b==="h") {
				this.pos++;
				break;
			} else if(b==="u") {
				a= a.concat(this.unserialize());
			} else {
				a.push(this.unserialize());
			}
		}
		this.cache.push(a);
		return a;
	}
	readFloat() {
		let a= this.pos;
		while(true) {
			if(["+", ",", "-", ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "e", "E"].indexOf(this.buffer[this.pos])<0) break;
			this.pos++;
		}
		return parseFloat(this.buffer.slice(a, this.pos));
	}
	readFalse() {
		return false;
	}
	readDigits() {
		let a= 0,
		b= (this.buffer[this.pos]==='-')?(this.pos++,true):false;
		while(true) {
			let c= this.buffer[this.pos];
			if(['0','1','2','3','4','5','6','7','8','9'].indexOf(c)<0) break; else {
				a= (a*10)+parseInt(c);
				this.pos++;
			}
		}
		return (b)?(a*-1):a;
	}
	readEnum() {
		let a= this.unserialize(),
			b= (this.pos++, this.readDigits()),
			c= (this.pos++, this.readDigits()),
			d= [];
		while (0<c--) {
			d.push(this.unserialize());
		}
		this.cache.push(`${a}.${b}(${d.join(', ')})`);
		return `${a}.${b}(${d.join(', ')})`;
	}
	readNaN() {
		return Math.NaN;
	}
	readList() {
		let a= [];
		while(true) {
			let b= this.buffer[this.pos];
			if(b==="h") {
				this.pos++;
				break;
			} else {
				a.push(this.unserialize());
			}
		}
		this.cache.push(a);
		return a;
	}
	readNegativeInfinity() {
		return Math.NEGATIVE_INFINITY;
	}
	readNull() {
		return null;
	}
	readObject() {
		let a= {};
		while(true){
			if(this.pos>=this.length) throw "Invalid object"; else if(this.buffer[this.pos]==="g") break; else {
				let b= this.unserialize();
				if(["number","string"].indexOf(typeof b)<0) throw "Invalid object key"; else {
					let c= this.unserialize();
					a[b]= c;
				}
			}
		} this.pos++;
		this.cache.push(a);
		return a;
	}
	readPositiveInfinity() {
		return Math.POSITIVE_INFINITY;
	}
	readCache() {
		let a= this.readDigits();
		if(a<0||a>this.cache.length) throw "Invalid reference";
		return this.cache[a];
	}
	readTrue() {
		return true;
	}
	readMultipleNull() {
		let a= [],
		b= this.readDigits();
		for(let c=0;c<b;c++) {
			a.push(null);
		}
		return a;
	}
	readDate() {
		let a= this.pos;
		this.pos+= 19;
		return new Date(this.buffer.slice(a, this.pos));
	}
	readError() {
		throw this.unserialize();
	}
	readString() {
		let a= this.readDigits();
		if(this.buffer[this.pos++]!==":"||(this.length-this.pos)<a) throw "Invalid string length";
		else {
			let b= decodeURL(this.buffer.slice(this.pos, (this.pos+=a)));
			this.scache.push(b);
			return b;
		}
	}
	readZero() {
		return 0;
	}
	readStringCache() {
		let a= this.readDigits();
		if(a<0||a>this.scache.length) throw "Invalid string reference";
		return this.scache[a];
	}
}

(function() {
	'use strict';
	document.querySelectorAll('embed').forEach(a=> {
		let name = a.getAttribute('name'),
			data = urlDecode(a.getAttribute('flashvars'));
		if(name.startsWith('map')) {
			let mapvar = new haxeUnserializer(data.data),
				gbox = document.createElement('div');
			gbox.setAttribute('id', 'map');
			gbox.setAttribute('style', 'display:none');
			gbox.innerHTML = `<div style="
										position:fixed;
										z-index:2;
										top:0px;
										left:0px;
										bottom:0px;
										right:0px;
										background-color:#cc855738;
										display:flex;
										flex-direction:column;
										flex-wrap:wrap;
										justify-content:center;
										align-content:center;
										align-items:center">
											<div style="
													 position:relative;
													 border:1px solid #874b2e;
													 outline:2px solid #cc8557;
													 display:flex">
														<img src="http://data.en.dinorpg.com/img/map/zone_roydin.jpg?v=4">
														<img onclick="this.parentElement.parentElement.parentElement.setAttribute('style','display:none')"
															 src="http://en.dinorpg.com/img/forum/smiley/cross.gif"
															 style="position:absolute;top:-12px;right:-10px;cursor:pointer">
											</div>
							 </div>`;
			document.body.appendChild(gbox);
			mapvar.unserialized._places.forEach(b=> {
				let inf = b._inf.split(':');
				document.querySelector("#map > div > div").innerHTML+= `<a href="${window.location.origin}${data.goto}${b._id}"
																		   id="map_${b._id}"
																		   onmouseover="mt.js.Tip.show(this,'<div class=\\u0027content\\u0027>${/'/gi[Symbol.replace](b._name, '\\u0027')}</div>','smallTip')"
																		   style="position:absolute;top:${inf[1]}px;left:${inf[0]}px"
																		   onmouseout="mt.js.Tip.hide()">
																				<img src="${window.location.origin}/img/forum/smiley/map_${inf[2]}.gif">
																		</a>`;
			});
			mapvar.unserialized._nexts.forEach(b=> {
				let c = document.querySelector(`#map_${b._id}`);
				c.style.filter = "drop-shadow(1px 0px 0 #fff) drop-shadow(0px 1px 0 #fff) drop-shadow(0px -1px 0 #fff) drop-shadow(-1px 0px 0 #fff)";
				c.firstElementChild.style.filter = "drop-shadow(white 0px 0px 1px)";
				c.setAttribute("onmouseover", `mt.js.Tip.show(this,'<div class=\\u0027content\\u0027>${/'/gi[Symbol.replace](b._text, '\\u0027')}</div>','smallTip')`);
			});
			a.outerHTML = `<a class="button" onclick="document.querySelector('#map').removeAttribute('style');" style="margin:5px auto;text-align:center;line-height:20px">Map</a>`;
		}
	});
})();
