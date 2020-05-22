//META{"name":"CopyUtils","website":"https://github.com/Montarex23/BD-Plugins/tree/master/Plugins/CopyUtils","source":"https://raw.githubusercontent.com/Montarex23/BD-Plugins/master/Plugins/CopyUtils/CopyUtils.plugin.js"}*//

const { clipboard } = require('electron')
const { findAllModules: fa, findModule: fm, findModuleByDisplayName: fdm, monkeyPatch, showToast, React, ReactDOM } = BdApi

class CopyUtils {
	getName() { return "CopyUtils" }
	getVersion() { return "1.0.1" }
	getAuthor() { return "Montarex23 & Juby210" }
	getDescription() { return "Allows you to copy useful things." }
	getRawUrl() { return "https://raw.githubusercontent.com/Montarex23/BD-Plugins/master/Plugins/CopyUtils/CopyUtils.plugin.js" }

	getSettingsPanel () {
		let set = document.createElement('div')
		let el = React.createElement(fdm('SwitchItem'), { value: this.loadData('spacesInsteadOfDashes') }, 'Spaces instead of dashes.')
		el.props.onChange = () => this.toggleSetting(el._owner.stateNode, 'spacesInsteadOfDashes')
		ReactDOM.render(el, set)
		return set
	}

	start () {
		this.unpatch = []
		this.labels = {
			copy:      "Copy",
			link:      "Link",
			name:      "Name",
			topic:     "Topic",
			avatarURL: "Avatar URL",
			mention:   "Mention",
			tag:       "Tag",
			iconURL:   "Icon URL",
			dmID:      "DM Channel ID",

			copy_success: "Copied"
		}

		// Discord Modules
		const { chosenLocale } = fm(m => m.Messages)
		const { API_HOST } = fm(m => m.API_HOST)
		const { MenuItem } = fm(m => m.MenuGroup && m.MenuItem)

		if (chosenLocale == "pl") {
			this.labels = Object.assign(this.labels, {
				copy:      "Kopiuj",
				name:      "Nazwę",
				topic:     "Temat",
				avatarURL: "Link do avataru",
				mention:   "Wzmiankę",
				iconURL:   "Link do ikony",
				dmID:      "ID Kanału DM",

				copy_success: "Skopiowano"
			})
		}

		// Channel Context Menu(s)
		const channelComponents = ['ChannelListTextChannelContextMenu', 'ChannelListVoiceChannelContextMenu', 'GroupDMContextMenu']
		channelComponents.forEach(displayName => {
			fa(m => m.default && m.default.displayName == displayName).forEach(m => {
				this.unpatch.push(monkeyPatch(m, 'default', { after: b => {
					const c = b.methodArguments[0].channel
					b.returnValue.props.children.push(React.createElement(MenuItem, {
						id: 'copy-utils',
						label: this.labels.copy
					}, React.createElement(MenuItem, {
						action: () => this.copy(`https://${API_HOST}/channels/${c.guild_id || '@me'}/${c.id}`),
						id: 'cu-link',
						label: this.labels.link
					}), React.createElement(MenuItem, {
						action: () => this.copy(this.loadData('spacesInsteadOfDashes') ? c.name.replace(/-/g, ' ') : c.name),
						id: 'cu-name',
						label: this.labels.name
					}), c.topic ? React.createElement(MenuItem, {
						action: () => this.copy(c.topic),
						id: 'cu-topic',
						label: this.labels.topic
					}) : null, React.createElement(MenuItem, {
						action: () => this.copy(`<#${c.id}>`),
						id: 'cu-mention',
						label: this.labels.mention
					})))
				}}))
				m.default.displayName = displayName
			})
		})

		// User Context Menu(s)
		const userComponents = ['DMUserContextMenu', 'GroupDMUserContextMenu', 'GuildChannelUserContextMenu']
		userComponents.forEach(displayName => {
			const m = fm(m => m.default && m.default.displayName == displayName)
			this.unpatch.push(monkeyPatch(m, 'default', { after: b => {
				const u = b.methodArguments[0].user
				b.returnValue.props.children.props.children.push(React.createElement(MenuItem, {
					id: 'copy-utils',
					label: this.labels.copy
				}, u.avatar ? React.createElement(MenuItem, {
					action: () => this.copy(u.avatarURL.replace('size=128', 'size=2048')),
					id: 'cu-avatar',
					label: this.labels.avatarURL
				}) : null, React.createElement(MenuItem, {
					action: () => this.copy(`<@${u.id}>`),
					id: 'cu-mention',
					label: this.labels.mention
				}), React.createElement(MenuItem, {
					action: () => this.copy(u.tag),
					id: 'cu-tag',
					label: this.labels.tag
				}), displayName == 'DMUserContextMenu' ? React.createElement(MenuItem, {
					action: () => this.copy(b.methodArguments[0].channel.id),
					id: 'cu-dmid',
					label: this.labels.dmID
				}) : null))
			}}))
			m.default.displayName = displayName
		})

		// Guild Context Menu
		const GuildContextMenu = fm(m => m.default && m.default.displayName == 'GuildContextMenu')
		this.unpatch.push(monkeyPatch(GuildContextMenu, 'default', { after: b => {
			const g = b.methodArguments[0].guild
			b.returnValue.props.children.push(React.createElement(MenuItem, {
				id: 'copy-utils',
				label: this.labels.copy
			}, g.icon ? React.createElement(MenuItem, {
				action: () => this.copy(g.getIconURL('png').replace('size=128', 'size=2048')),
				id: 'cu-icon',
				label: this.labels.iconURL
			}) : null, React.createElement(MenuItem, {
				action: () => this.copy(g.name),
				id: 'cu-name',
				label: this.labels.name
			})))
		}}))
		GuildContextMenu.default.displayName = 'GuildContextMenu'

        if (window.ZeresPluginLibrary) {
            window.ZeresPluginLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), this.getRawUrl())
        } else if (window.BDFDB) {
            if (!window.PluginUpdates) window.PluginUpdates = { plugins: {} }
            window.PluginUpdates.plugins[this.getRawUrl()] = { name: this.getName(), raw: this.getRawUrl(), version: this.getVersion() }
            window.BDFDB.PluginUtils.checkUpdate(this.getName(), this.getRawUrl())
        }
	}

	stop () {
		if(this.unpatch) this.unpatch.forEach(u => u())
	}

	loadData(s) {
		return BdApi.loadData(this.getName(), s)
	}

	toggleSetting(node, s) {
		BdApi.saveData(this.getName(), s, !this.loadData(s))
		if(node) {
			node.settingsPanel.parentElement.removeChild(node.settingsPanel)
			node.forceUpdate()
		}
	}

	copy(text) {
		clipboard.write({ text })
		this.showCopyToast()
	}
	showCopyToast() {
		showToast(this.labels.copy_success, { type: 'success' })
	}
}
