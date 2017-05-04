sap.ui.define([
	], function () {
		"use strict";

		return {
			
			totalFormatter: function(invoices){
				if (!invoices){
					return "";
				}
				var total = 0;
				var change = [];
		        var sInternalType = "string";
		        var amount1 = new sap.ui.model.type.Currency({showMeasure: false});
		        
				for(var i = 0; invoices[i]; i++){
					if (invoices[i].amount.substr(invoices[i].amount.length - 1) === "-"){
						var amount = invoices[i].amount.substr(0, invoices[i].amount.length - 1);
						total -= parseFloat(amount, 10);
					} else {
						total += parseFloat(invoices[i].amount, 10);						
					}					
				}
        
		        change.push(total);
		        change.push("EUR");
	            return this.getTranslation("total") + ": " + amount1.formatValue(change, sInternalType);				
			},
			
			totalFooterFormatter: function(invoices){
				if (!invoices){
					return "";
				}
				var total = 0;
				var change = [];
		        var sInternalType = "string";
		        var amount1 = new sap.ui.model.type.Currency({showMeasure: false});
		        
				for(var i = 0; invoices[i]; i++){
					if (invoices[i].amount.substr(invoices[i].amount.length - 1) === "-"){
						var amount = invoices[i].amount.substr(0, invoices[i].amount.length - 1);
						total -= parseFloat(amount, 10);
					} else {
						total += parseFloat(invoices[i].amount, 10);						
					}					
				}
        
		        change.push(total);
		        change.push("EUR");
	            return amount1.formatValue(change, sInternalType);				
			},	
			
			totalColorFooterFormatter: function(invoices){
				if (!invoices){
					return "";
				}
				var total = 0;
		        
				for(var i = 0; invoices[i]; i++){
					if (invoices[i].amount.substr(invoices[i].amount.length - 1) === "-"){
						var amount = invoices[i].amount.substr(0, invoices[i].amount.length - 1);
						total -= parseFloat(amount, 10);
					} else {
						total += parseFloat(invoices[i].amount, 10);						
					}					
				}

				if (total > 0) {
					return "Success";
				} else {
					return "Error";
				}
			},				
			
			numberStateFormatter: function(invoices){
				if (!invoices){
					return "Success";
				}
				var total = 0;
		        
				for(var i = 0; invoices[i]; i++){
					if (invoices[i].amount.substr(invoices[i].amount.length - 1) === "-"){
						var amount = invoices[i].amount.substr(0, invoices[i].amount.length - 1);
						total -= parseFloat(amount, 10);
					} else {
						total += parseFloat(invoices[i].amount, 10);						
					}					
				}
        
        		if (total > 0){
        			return "Success";
        		} else {
        			return "Error";
        		}
			},				
			
			statusFormatter : function(status){
				switch (status){
					case "REGIS":
//						return this.getTranslation("registered");
						return this.getTranslation("inProcess");

					case "PRERE":
//						return this.getTranslation("preRegistered");
						return this.getTranslation("inProcess");
						
					default :
						return this.getTranslation("inProcess");
//						return "";
				}
			}, 
			
			getResourceBundle: function () {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle();
			},
			
			/**
			 * Get the translation for sKey
			 * @public
			 * @param {string} sKey the translation key
			 * @param {array} aParameters translation paramets (can be null)
			 * @returns {string} The translation of sKey
			 */
			getTranslation: function (sKey, aParameters) {
				if( aParameters === undefined || aParameters === null ) {
					return this.getResourceBundle().getText(sKey);
				} else {
					return this.getResourceBundle().getText(sKey, aParameters);
				}
			}			
		};
	}
);