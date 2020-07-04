// ==UserScript==
// @name         dinoTools
// @version      0.6
// @description  <3
// @author       Angelisium
// @match        http://en.dinorpg.com/*
// @match        http://es.dinorpg.com/*
// @match        http://www.dinorpg.com/*
// @grant        unsafeWindow
// ==/UserScript==

function html_generator(a) {
    if(!a.node) throw `Uncaught SyntaxError: unknown nodeName`;
    let b = document.createElement(a.node);
    delete a.node;
    if(a.text) {
        b.appendChild(document.createTextNode(a.text));
        delete a.text;
    }
    if(a.children) {
        for(let c of a.children) {
            b.appendChild(html_generator(c));
        }
        delete a.children;
    }
    for(let c in a) {
        b.setAttribute(c, a[c]);
    } return b;
}

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

async function Gather_verif(a) {
    let item = document.querySelectorAll('#dinoToolGather .sel'),
        logs = document.querySelector('#log');
    if(item.length===a._clicks) {
        logs.innerText+= `\n${a._txt_wait}`;
        let tab = [];
        item.forEach(z=> {
            tab.push(z.getAttribute('data-loy'));
            z.removeAttribute('data-loy');
            z.setAttribute('class', 'cel');
        });
        let reponse = await fetch(`${window.location.origin}${a._url}l${tab.join('')}h`).then(rep=>rep.text()),
            data = new haxeUnserializer(reponse).unserialized;
        if(data.length>0) {
            logs.innerText+= `\n${a._txt_success}`;
            while(data.length>0) {
                let rec = data.shift();
                logs.innerText+= `\n${rec._name}`;
            }
        } else {
            logs.innerText+= `\n${a._txt_fail}`;
        }
    }
}

class haxeUnserializer {
    constructor(str) {
        this.buffer= str;
        this.length= str.length;
        this.cache= [];
        this.scache= []; //cache pour les strings
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
            //voir si je peut obtimiser la condition
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
            //voir si je peut obtimiser la condition
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

unsafeWindow.haxeUnserializer = haxeUnserializer;

(function init() {
    'use strict';
    document.querySelectorAll('embed').forEach(a=> {
        let name = a.getAttribute('name'),
            data = urlDecode(a.getAttribute('flashvars'));
        if(name.startsWith('map')) {
            let mapvar = new haxeUnserializer(data.data);
            document.body.appendChild(html_generator({
                node: 'div',
                id: 'map',
                style: 'display:none',
                children: [{
                    node: 'div',
                    style: [
                        'position: fixed', 'z-index: 2', 'top: 0px', 'left: 0px',
                        'bottom: 0px', 'right: 0px', 'background-color: #cc855738',
                        'display: flex', 'flex-direction: column', 'flex-wrap: wrap',
                        'justify-content: center', 'align-content: center',
                        'align-items: center'
                    ].join(';'),
                    children: [{
                        node: 'div',
                        style: [
                            'position: relative', 'border: 1px solid #874b2e',
                            'outline: 2px solid #cc8557', 'display: flex'
                        ].join(';'),
                        children: [{
                            node: 'img',
                            src: data.map
                        },{
                            node: 'img',
                            onclick: "this.parentElement.parentElement.parentElement.setAttribute('style','display:none')",
                            src: `${window.location.origin}/img/forum/smiley/cross.gif`,
                            style: [
                                'position: absolute', 'top: -12px',
                                'right: -10px', 'cursor: pointer'
                            ].join(';')
                        }]
                    }]
                }]
            }));
            mapvar.unserialized._places.forEach(b=> {
                let inf = b._inf.split(':');
                document.querySelector("#map > div > div").appendChild(html_generator({
                    node: 'a',
                    href: `${window.location.origin}${data.goto}${b._id}`,
                    id: `map_${b._id}`,
                    onmouseover: `mt.js.Tip.show(this,'<div class=\\u0027content\\u0027>${/'/gi[Symbol.replace](b._name, '\\u0027')}</div>','smallTip')`,
                    style: [
                        'position: absolute', `top: ${inf[1]}px`,
                        `left: ${inf[0]}px`
                    ].join(';'),
                    onmouseout: 'mt.js.Tip.hide()',
                    children: [{
                        node: 'img',
                        src: `https://raw.githubusercontent.com/Angelisium/dinoTools/master/image/${inf[2]}.png`
                    }]
                }));
            });
            mapvar.unserialized._nexts.forEach(b=> {
                let c = document.querySelector(`#map_${b._id}`);
                c.style.filter = "drop-shadow(1px 0px 0 #fff) drop-shadow(0px 1px 0 #fff) drop-shadow(0px -1px 0 #fff) drop-shadow(-1px 0px 0 #fff)";
                c.firstElementChild.style.filter = "drop-shadow(white 0px 0px 1px)";
                c.setAttribute("onmouseover", `mt.js.Tip.show(this,'<div class=\\u0027content\\u0027>${/'/gi[Symbol.replace](b._text, '\\u0027')}</div>','smallTip')`);
            });
            a.outerHTML = `<a class="button" onclick="document.querySelector('#map').removeAttribute('style');" style="margin:5px auto;text-align:center;line-height:20px">Map</a>`;
            document.querySelector('#map').addEventListener('contextmenu', async function(eVe) {
                if(eVe.target.parentNode.nodeName==="A"&&eVe.target.getAttribute('style')!=null) {
                    eVe.preventDefault();
                    var observer = new MutationObserver((eVe)=> {init(); observer.disconnect();document.querySelector('#map').removeAttribute('style')});
                    observer.observe(document.querySelector('#dinozPanel'), {childList: true});
                    let a = await fetch(eVe.target.parentNode.getAttribute('href')).then(a=>a.text());
                    document.querySelector("#map").remove();
                    document.querySelector("#dinozPanel li:nth-child(1) a").click();
                }
            });
        } else if(name.startsWith('title_')) {
            let title = {
                node: 'h3',
                id: `title_dinoTools`,
                text: data.title
            };
            if(data.sub) {
                title.children = [{
                    node: 'span',
                    style: [
                        'color: #a5512d', 'text-shadow: initial',
                        'margin-left: 5px'
                    ].join(';'),
                    text: data.sub
                }];
            }
            a.parentElement.appendChild(html_generator(title));
            a.outerHTML = [
                '<style>h3#title_dinoTools {',
                    'color: #71b703;', 'font-size: 19px;', 'text-shadow: 1px 0px #FDF1BF, 0px 1px #FDF1BF, -1px 0px #FDF1BF, 0px -1px #FDF1BF, 0px -1px 2px #B25D21;',
                    'line-height: 28px;', 'margin-left: 12px',
                '} h3#title_dinoTools:before {',
                    `content: "${data.title}";`, 'position: absolute;',
                    'z-index: 1;', 'color: #9cd305;', 'clip-path: polygon(0% 60%, 100% 60%, 100% 100%, 0 100%);', 'text-shadow: none',
                '} h3#title_dinoTools:first-letter {',
                    'color: inherit;', 'font-size: inherit',
                '}</style>'
            ].join('');
        } else if(name.startsWith('levelup')) {
            a.parentElement.parentElement.setAttribute('style', 'display:none');
            unsafeWindow.toggleView();
        } else if(name.startsWith('gather')) {
            let gathervar = new haxeUnserializer(data.data),
                undata = gathervar.unserialized,
                gathhtml = html_generator({
                    node: 'div',
                    id: 'dinoToolGather',
                    children: [{
                        node: 'style',
                        text: [
                            '#dinoToolGather {',
                                'display: flex;',
                                'flex-direction: row;',
                                'flex-wrap: wrap;',
                                'justify-content: flex-start;',
                                'align-content: flex-start;',
                                'align-items: flex-start;',
                                'border: 4px solid #b86737;',
                                'box-shadow: 0 5px #792b01;',
                                'margin: 15px;',
                                `max-width: ${25*undata._size}px;`,
                                'background-color: #7eb400;',
                            '} div.cel {',
                                'display: inline-block;',
                                'height: 25px;',
                                'width: 25px;',
                                'background-color: #cb914b;',
                            '} div.dam {',
                                'background-color: #be7d3a;',
                            '} div.cel:not([data-loy]) {',
                                'background-color: transparent;',
                            '} div.sel, div.cel[data-loy]:hover {',
                                'box-shadow: inset 1px 1px #e2ce87, inset -1px -1px #e2ce87;',
                                'cursor: pointer;',
                            '} pre#log {',
                                'margin: 5px 12px;',
                                'width: auto;',
                                'background-color: #bc683c;',
                                'border: 1px solid #ff9f22;',
                                'padding: 5px',
                            '}'
                        ].join('')
                    }]
                });
            let rcl = [
                ['', ' dam'],
                [' dam', '']
            ];
            for(let y=0;y<undata._size;y++) {
                for(let x=0;x<undata._size;x++) {
                    let cel = {
                        node: 'div',
                        class: 'cel'
                    };
                    if(!undata._d[x]||!undata._d[x][y]||undata._d[x][y]!==true) {
                        cel['data-loy'] = `oy4%3A%255Fxi${x}y4%3A%255Fyi${y}g`;
                        cel.class+= rcl[x%2][y%2];
                    }
                    gathhtml.appendChild(html_generator(cel));
                }
            }
            a.parentElement.parentElement.parentElement.appendChild(html_generator({
                node: 'pre',
                id: 'log',
                text: `_clicks: ${undata._clicks}`
            }));
            a.parentElement.parentElement.replaceWith(gathhtml);
            document.querySelector('#dinoToolGather').addEventListener('click', function(eVe) {
                let loy = eVe.target.getAttribute('data-loy');
                if(loy) {
                    if(eVe.target.classList.contains('sel')) {
                        eVe.target.classList.remove('sel');
                    } else {
                        eVe.target.classList.add('sel');
                        Gather_verif(undata);
                    }
                }
            });
        } else {
            console.log(a, name, data);
        }
    });
})();
