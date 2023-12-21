/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export default class PbtaItemSheet extends ItemSheet {
	constructor(...args) {
		super(...args);
		if (this.item.type === "playbook") {
			this.options.classes.push("playbook");
		}
	}

	/** @override */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["pbta", "sheet", "item"],
			width: 450,
			height: 400,
			tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "details" }]
		});
	}

	/* -------------------------------------------- */

	/** @override */
	get template() {
		const path = "systems/pbta/templates/items";
		return `${path}/${this.item.type}-sheet.html`;
	}

	/* -------------------------------------------- */

	/** @override */
	async getData() {
		const source = this.item.toObject();
		const context = {
			actor: this.actor,
			item: this.item,
			source: source.system,
			system: this.item.system,

			effects: this.item.effects.map((e) => foundry.utils.deepClone(e)),
			owner: this.item.isOwner,
			limited: this.item.limited,
			options: this.options,
			editable: this.isEditable,
			cssClass: this.isEditable ? "editable" : "locked",
			flags: this.item.flags,
			isGM: game.user.isGM
		};

		// Add playbooks.
		context.playbooks = await game.pbta.utils.getPlaybooks();

		// Handle rich text fields.
		const enrichmentOptions = {
			rollData: this.item?.getRollData() ?? {},
			relativeTo: this.actor
		};

		if (context.system?.description) {
			context.system.description = await TextEditor.enrichHTML(context.system.description, enrichmentOptions);
		}

		const sheetConfig = game.pbta.sheetConfig;
		if (this.item.type === "move" || this.item.type === "npcMove") {
			if (this.item.type === "move") {
				context.system.stats = {};
				if (this.actor?.system?.stats) {
					const stats = foundry.utils.duplicate(this.actor?.system?.stats);
					context.system.stats = stats;
				} else if (Object.keys(sheetConfig?.actorTypes || {}).length) {
					const validCharacterType = Object.entries(sheetConfig.actorTypes)
						.find(([k, v]) => [k, v?.baseType].includes("character") && v.stats);
					if (validCharacterType) {
						context.system.stats = foundry.utils.duplicate(validCharacterType[1].stats);
					}
				}
				context.system.stats.prompt = {label: game.i18n.localize("PBTA.Prompt")};
				if (Object.keys(context.system.stats).length > 1) {
					context.system.stats.ask = {label: game.i18n.localize("PBTA.Ask")};
				}
				context.system.stats.formula = {label: game.i18n.localize("PBTA.Formula")};

				if (context.system?.choices) {
					context.system.choices = await TextEditor.enrichHTML(context.system.choices, enrichmentOptions);
				}
			} else if (this.item.type === "npcMove") {
				context.system.rollExample = sheetConfig?.rollFormula ?? "2d6";
			}
			context.system.moveTypes = {};
			if (this.actor?.system?.moveTypes) {
				const moveTypes = foundry.utils.duplicate(this.actor?.system?.moveTypes);
				context.system.moveTypes = moveTypes;
			} else if (Object.keys(sheetConfig?.actorTypes || {}).length) {
				const validCharacterType = Object.entries(sheetConfig.actorTypes)
					.find(([k, v]) => [k, v?.baseType].includes("character") && v.moveTypes);
				if (validCharacterType) {
					context.system.moveTypes = foundry.utils.duplicate(validCharacterType[1].moveTypes);
				}
			}
			if (Object.keys(context.system.moveTypes) && context.system.moveType) {
				if (context.system.moveTypes[context.system.moveType].playbook) {
					context.isPlaybookMove = true;
				}
			}

			for (let [key, moveResult] of Object.entries(context.system.moveResults)) {
				context.system.moveResults[key].rangeName = `system.moveResults.${key}.value`;
				context.system.moveResults[key].value =
					await TextEditor.enrichHTML(moveResult.value, enrichmentOptions);
			}
		} else if (this.item.type === "equipment") {
			context.system.equipmentTypes = sheetConfig?.actorTypes[this.actor?.baseType]?.equipmentTypes ?? null;
		}

		return context;
	}

	/* -------------------------------------------- */

	/** @override */
	async activateListeners(html) {
		super.activateListeners(html);
		if (this.item.type === "equipment") {
			this._tagify(html);
		}
		html.find(".regenerate-slug").on("click", this._onItemRegenerateSlug.bind(this));
	}

	_onItemRegenerateSlug(event) {
		event.preventDefault();
		this.item.update({ "system.slug": this.item.name.slugify() });
	}

	/**
	 * Add tagging widget.
	 * @param {HTMLElement} html
	 */
	async _tagify(html) {
		let $input = html.find('input[name="system.tags"]');
		if ($input.length > 0) {
			if (!this.isEditable) {
				$input.attr("readonly", true);
			}
			const whitelist = game.pbta.utils.getTagList(this.item, "item");

			// init Tagify script on the above inputs
			new Tagify($input[0], {
				whitelist,
				dropdown: {
					maxItems: 20,           // <- mixumum allowed rendered suggestions
					classname: "tags-look", // <- custom classname for this dropdown, so it could be targeted
					enabled: 0,             // <- show suggestions on focus
					closeOnSelect: false    // <- do not hide the suggestions dropdown once an item has been selected
				}
			});
		}
	}
}
