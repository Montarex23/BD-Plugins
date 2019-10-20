//META{"name":"BetterNotes","website":"https://github.com/polop2301/BD-Plugins/tree/master/Plugins/BetterNotes","source":"https://raw.githubusercontent.com/polop2301/BD-Plugins/master/Plugins/BetterNotes/BetterNotes.plugin.js"}*//

class BetterNotes {
	getName () {return "BetterNotes";} 

	getVersion () {return "0.0.1";}

	getAuthor () {return "Montarex23";}

	getDescription () {return "Displays first line of notes next to nickname.";}

	getRawUrl () {return "https://raw.githubusercontent.com/polop2301/BD-Plugins/master/Plugins/BetterNotes/BetterNotes.plugin.js";}

	constructor () {
		

		this.patchModules = {
			"MessageUsername":"componentDidMount"
		};
	}

	initConstructor () {
		this.css = `
			.BN-Note {
				position: relative;
				background-size: contain;
				background-position: center;
				background-repeat: no-repeat;
				display: inline-flex;
				align-items: center;
				justify-content: center;
				margin: 0 5px !important;
			}`;


		this.requestedusers = {};
		this.loadedusers = {};	
	}

	getSettingsPanel () {
		if (!global.BDFDB || typeof BDFDB != "object" || !BDFDB.loaded || !this.started) return;
		this.showColorSettings();
	}


	load () {}

	start () {
		if (!global.BDFDB) global.BDFDB = {myPlugins:{}};
		if (global.BDFDB && global.BDFDB.myPlugins && typeof global.BDFDB.myPlugins == "object") global.BDFDB.myPlugins[this.getName()] = this;
		var libraryScript = document.querySelector('head script#BDFDBLibraryScript');
		if (!libraryScript || (performance.now() - libraryScript.getAttribute("date")) > 600000) {
			if (libraryScript) libraryScript.remove();
			libraryScript = document.createElement("script");
			libraryScript.setAttribute("id", "BDFDBLibraryScript");
			libraryScript.setAttribute("type", "text/javascript");
			libraryScript.setAttribute("src", "https://mwittrien.github.io/BetterDiscordAddons/Plugins/BDFDB.js");
			libraryScript.setAttribute("date", performance.now());
			libraryScript.addEventListener("load", () => {this.initialize();});
			document.head.appendChild(libraryScript);
			this.libLoadTimeout = setTimeout(() => {
				libraryScript.remove();
				BDFDB.LibraryRequires.request("https://mwittrien.github.io/BetterDiscordAddons/Plugins/BDFDB.js", (error, response, body) => {
					if (body) {
						libraryScript = document.createElement("script");
						libraryScript.setAttribute("id", "BDFDBLibraryScript");
						libraryScript.setAttribute("type", "text/javascript");
						libraryScript.setAttribute("date", performance.now());
						libraryScript.innerText = body;
						document.head.appendChild(libraryScript);
					}
					this.initialize();
				});
			}, 15000);
		}
		else if (global.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) this.initialize();
		this.startTimeout = setTimeout(() => {this.initialize();}, 30000);
	}

	initialize () {
		if (global.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
			if (this.started) return;
			BDFDB.loadMessage(this);

			BDFDB.WebModules.forceAllUpdates(this);
		}
		else {
			console.error(`%c[${this.getName()}]%c`, 'color: #3a71c1; font-weight: 700;', '', 'Fatal Error: Could not load BD functions!');
		}
	}

	stop () {
		if (global.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
			BDFDB.removeEles(".BN-Notes");
			BDFDB.unloadMessage(this);
		}
	}


	// begin of own functions

	processMessageUsername (instance, wrapper, returnvalue) {
		
		let message = BDFDB.getReactValue(instance, "props.message");
		if (message) {
			this.addToWrapper(message.author, wrapper)
		}
	}

	addToWrapper (info, wrapper) {
		BDFDB.removeEles(wrapper.querySelectorAll(".BN-Notes"));
		let header = BDFDB.getParentEle(BDFDB.dotCN.userpopoutheader, wrapper);
		let notewrapper = BDFDB.htmlToElement(`<span class="BN-Notes"></span>`);
		let col = BDFDB.loadData("color", this, "settings");
		let note = BdApi.findModuleByProps('getNote').getNote(info.id);
		note = note.split('\n')[0]
		let divnote = BDFDB.htmlToElement(`<div class="BN-Note" style="color:${col}">${note}</div>`);
		notewrapper.appendChild(divnote);
		
		if (notewrapper.firstChild) {
			if (header) {
				header.firstElementChild.appendChild(notewrapper);
				let popout = header.parentElement.parentElement;
				if (popout.style.transform.indexOf("translateY(-1") == -1) {
					let arect = BDFDB.getRects(document.querySelector(BDFDB.dotCN.appmount)), prect = BDFDB.getRects(popout);
					popout.style.setProperty("top", (prect.y + prect.height > arect.height ? (arect.height - prect.height) : prect.y) + "px");
				}
			}
			else {
				wrapper.insertBefore(notewrapper, wrapper.querySelector(".owner-tag,.TRE-tag,svg[name=MobileDevice]"));
			}
		}
	}
	
	showColorSettings () {
		let col = BDFDB.loadData("color", this, "settings");
		BDFDB.openModal(this, {
			size: "SMALL",
			header: "Color",
			subheader: "Change note color",
			children: [
				BDFDB.React.createElement(BDFDB.LibraryComponents.FormComponents.FormItem, {
					title: "Pick",
					className: BDFDB.disCN.marginbottom20,
					children: [
						BDFDB.React.createElement(BDFDB.LibraryComponents.ColorSwatches, {
							color: col,
							number: 1
						})
					]
				})
			],
			buttons: [{
				contents: BDFDB.LanguageUtils.LanguageStrings.SAVE,
				color: "BRAND",
				close: true,
				click: modal => {
					let inheritcolorinput = modal.querySelector(".input-inheritcolor " + BDFDB.dotCN.switchinner);

					let color = BDFDB.getSwatchColor(modal, 1);
					if (color != null && !BDFDB.isObject(color)) {
						if (color[0] < 30 && color[1] < 30 && color[2] < 30) color = BDFDB.colorCHANGE(color, 30);
						else if (color[0] > 225 && color[1] > 225 && color[2] > 225) color = BDFDB.colorCHANGE(color, -30);
					}
					
					if (color != null) {
						BDFDB.saveData("color", color, this, "settings");
						BDFDB.WebModules.forceAllUpdates(this);
					}
				}
			}]
		});
	}
}
