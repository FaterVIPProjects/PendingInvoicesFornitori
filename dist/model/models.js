sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function(JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function() {
			
			var oModel = new JSONModel(Device);
			
			oModel.setDefaultBindingMode("OneWay");
			
			return oModel;
			
		},
		
		createJSONModel: function (){
			
			var oFilters = {
				suppliers: [],
				lowerBound: "",
				lowerBoundDate: null,
				upperBound: "",
				upperBoundDate: null,
				invoiceNumber: "",
				partite: 0,
				partiteAperte: true,
				partitePareggiate: true
			};
			
			var oModel = new JSONModel({
				suppliers: [],
				
				defaultFilters: JSON.parse(JSON.stringify(oFilters)), /* Backup copy for filters reset */
				
				filters: JSON.parse(JSON.stringify(oFilters)),
				
				invoices: []
			});
			
			oModel.setSizeLimit(99999999);			
			return oModel;
		},
		
		createTempModel: function(){
			
			var sLanguage = sap.ui.getCore().getConfiguration().getLanguage(),
				bIsItalian = sLanguage.indexOf("it") !== -1,
				sRootPah = jQuery.sap.getModulePath("org.fater.pendinginvoicessupplier");
			
			var oBundle = jQuery.sap.resources({
				url : sRootPah + "/i18n/i18n.properties", 
				locale: sLanguage
			});
			
			var oModel = new JSONModel({
				config: {
					datePickerValueFormat: (bIsItalian) ? "dd-MM-yyyy" : "yyyy-MM-dd",
					dataLoaded: false
				},
				tableColumns:[
					{
						name: oBundle.getText("docNumberLabel"),
						selected: true,
						visible: false
					},
					{
						name: oBundle.getText("documentDateLabel"),
						selected: true,
						visible: true
					},
										{
						name: oBundle.getText("docDueDate"),
						selected: true,
						visible:true
					},
					{
						name: oBundle.getText("docAmountLabel"),
						selected: true,
						visible: true
					},
					{
						name: oBundle.getText("docStatusLabel"),
						selected: true,
						visible: true
					},
					{
						name: oBundle.getText("docAgentLabel"),
						selected: true,
						visible: true
					},
					{
						name: oBundle.getText("docAgentEmail"),
						selected: true,
						visible:true
					}
				],
				sortItems:[
					{
						name: oBundle.getText("docNumberLabel"),
						selected: true,
						key: "docNumber"
					},
					{
						name: oBundle.getText("documentDateLabel"),
						selected: false,
						key: "docDate"
					},
					{
						name: oBundle.getText("docDueDate"),
						selected: false,
						key: "dueDate"
					},
					{
						name: oBundle.getText("docAmountLabel"),
						selected: false,
						key: "amount"
					},
					{
						name: oBundle.getText("docStatusLabel"),
						selected: false,
						key: "status"
					},
					{
						name: oBundle.getText("docAgentLabel"),
						selected: false,
						key: "agent"
					},
					{
						name: oBundle.getText("docAgentEmail"),
						selected: false,
						key: "eMail"
					}
				]	
				
			});
			
			return oModel;
		}
	};

});