import { ItemTemplateData } from "./templates/item.js";

export default class PlaybookData extends ItemTemplateData {
	static defineSchema() {
		return {
			description: new foundry.data.fields.HTMLField({ initial: "" }),
			slug: new foundry.data.fields.StringField({
				required: true,
				validate: (value) => {
					if (value !== value.slugify()) {
						return new foundry.data.validation.DataModelValidationFailure({
							unresolved: true,
							invalidValue: value,
							message: `${value} is not a valid slug`
						});
					}
				}
			}),
			actorType: new foundry.data.fields.StringField({ initial: "" }), // @todo MIGRATION TO SET A VALID DEFAULT
			stats: new foundry.data.fields.ObjectField(), // @todo MIGRATION TO SET A VALID DEFAULT BASED ON actorType
			statsDetail: new foundry.data.fields.StringField({ initial: "" }),
			attributes: new foundry.data.fields.ObjectField(), // @todo migration
			choiceSets: new foundry.data.fields.ArrayField(
				new foundry.data.fields.SchemaField({
					title: new foundry.data.fields.StringField({ initial: "", required: true }),
					// @todo consider HTMLField instead
					desc: new foundry.data.fields.StringField({ initial: "", required: true }),
					type: new foundry.data.fields.StringField({ initial: "multi", choices: ["single", "multi"] }),
					// optional: new foundry.data.fields.BooleanField({ initial: false }),
					repeatable: new foundry.data.fields.BooleanField({ initial: true }),
					choices: new foundry.data.fields.ArrayField(
						new foundry.data.fields.SchemaField({
							uuid: new foundry.data.fields.StringField({ initial: "", required: true }),
							img: new foundry.data.fields.StringField({ initial: null, nullable: true }),
							name: new foundry.data.fields.StringField({ initial: null, nullable: true }),
							granted: new foundry.data.fields.BooleanField({ initial: false }),
							advancement: new foundry.data.fields.NumberField({
								required: true, integer: true, min: 0, initial: 0, nullable: false
							})
						})
					),
					grantOn: new foundry.data.fields.NumberField({
						required: true, integer: true, min: 0, initial: 0, nullable: false
					}),
					advancement: new foundry.data.fields.NumberField({
						required: true, integer: true, min: 0, initial: 0, nullable: false
					})
				})
			)
		};
	}
}
