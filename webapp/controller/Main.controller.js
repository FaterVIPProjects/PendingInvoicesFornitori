sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"org/fater/app/util/formatter",
	'sap/ui/model/Filter',
	"sap/ui/model/Sorter",	
	'sap/ui/core/Fragment',
	'sap/m/MessageBox'
], function(Controller, formatter, Filter, Sorter, Fragment, MessageBox) {
	"use strict";

	return Controller.extend("org.fater.app.controller.Main", {
		
		formatter: formatter,

		onInit : function(){
			this._arrayFilterWidth = ["23%", "23%", "15%", "12%", "12%", "15%"];
			var filterBar = this.getView().byId("supplierFilterBar");
			var content = filterBar.getContent()[1];
			for (var i = 0; content.getContent()[i]; i++){
				content.getContent()[i].setProperty("width", this._arrayFilterWidth[i]);
			}		
		},
		
		handleFilterDialogClosed: function(oEvent){
			var filterBar = this.getView().byId("supplierFilterBar");
			var content = filterBar.getContent()[1];
			var indexContent = 0;
			for (var i = 0; filterBar.getAllFilterItems()[i] && content.getContent()[indexContent]; i++){
				if (filterBar.getAllFilterItems()[i].getVisibleInFilterBar()){
					content.getContent()[indexContent].setProperty("width", this._arrayFilterWidth[i + 1]);
					indexContent++;
				}
			}
		},		
		
		onAfterRendering : function(){
			var oView = this.getView();
			var oModel = oView.getModel();
			var oTempModel = oView.getModel("tempModel");
			var associatedSupplier = [];	
			var supplierName = "FOR_0000852";
			
			try {
				var userShell = sap.ushell.Container.getService("UserInfo").getUser();
				supplierName = userShell.getId().toUpperCase();
			} catch ( err ) {}
			
			var aFilters = [ new Filter(
					"UserPortal",
					sap.ui.model.FilterOperator.EQ, 
					supplierName
				)];
			oView.setBusy(true);
			var sPath = "/SupplierSet";
			var	mParameters = {
				filters : aFilters,
                success : function (oDataSupplier) {
					
					var Supplier = oDataSupplier.results[0];
					var formattedSupplier = {};
					formattedSupplier.supplierName = Supplier.Name1;
					formattedSupplier.Lifnr = Supplier.Lifnr;						
					formattedSupplier.supplierId = Supplier.SupplierId;
					formattedSupplier.paymentConditions = Supplier.PaymentCondition;
					formattedSupplier.SuspInvoices = [];
					formattedSupplier.visible = false;
					associatedSupplier.push(formattedSupplier);
				
					//Retrieve Parent Supplier and push on Associated Supplier
					aFilters = [ new Filter(
						"SupplierId",
						sap.ui.model.FilterOperator.EQ, 
						formattedSupplier.supplierId
					)];						
					
					//Retrieve Child Suppliers
					sPath = "/SupplierAssociatedSet";
					mParameters = {
						filters : aFilters,
		                urlParameters:{
		               		"$expand" : "Supplier"
		                },				
		                success : function (oData) {
							
							for (var i = 0; oData.results[i]; i++){
								Supplier = oData.results[i].Supplier;
								formattedSupplier = {};
								formattedSupplier.supplierName = Supplier.Name1;
								formattedSupplier.supplierId = Supplier.Lifnr;
								formattedSupplier.paymentConditions = Supplier.PaymentCondition;
								formattedSupplier.SuspInvoices = [];
								formattedSupplier.visible = false;
								associatedSupplier.push(formattedSupplier);
							}
							oTempModel.setProperty(
								"/AssociatedSuppliers",
								associatedSupplier
							);
							
							oModel.setProperty(
								"/filters/suppliers",
								associatedSupplier
							);
							oView.setBusy(false);
		                },
		                error: function (oError) {
		                    jQuery.sap.log.info("Odata Error occured");
		                    oView.setBusy(false);
		                }
		            };
		            oView.setBusy(true);
					oView.getModel("oDataModel").read(sPath, mParameters);
					
                },
                error: function (oError) {
                    jQuery.sap.log.info("Odata Error occured");
                    oView.setBusy(false);
                }
            };
            oView.setBusy(true);
			oView.getModel("oDataModel").read(sPath, mParameters);
			
		},	

		_handleSuggest: function(oEvent){
			var sTerm = oEvent.getParameter("suggestValue"); 
			var aFilters = []; 
			if (sTerm.length >= 3) { 
				aFilters.push(new Filter("supplierName", sap.ui.model.FilterOperator.Contains, sTerm)); 					
				oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
			} else {
				return null;
			}			
		},
		
		handleSuggestionSelected: function(oEvent){
			
			// Retrieve selected items
			var aSelectedItem = oEvent.getParameter("selectedItem");
			var oModel = this.getView().getModel();
			
			if (aSelectedItem) {
				
				var suppliersToken = oModel.getProperty("/filters/suppliers");
				
				var splittedKey = aSelectedItem.getKey().split("/");
				var supplierId = splittedKey[0];
				var paymentConditions = splittedKey[1];
				
				for (var i = 0; suppliersToken[i]; i++){
					if (suppliersToken[i].supplierId === supplierId){
						var oBundle = this.getResourceBundle();
						MessageBox.error(
							oBundle.getText("alreadySelectedSupplier")
						);	
						//Su Fiori questa parte di codice non è necessaria
/*						var supplierFilterInput = this.getView().byId("supplierFilterInput");
						var tokens = supplierFilterInput.getTokens();
						supplierFilterInput.removeToken(tokens[tokens.length - 1].getId());*/
						return;
					}
				}
				
				// Remove possible valueState Error
				var oSupplierInput = this.getView().byId("supplierFilterInput");
				oSupplierInput.setValueState(sap.ui.core.ValueState.None);			
					
				var oSelectedSupplier = {
					"supplierName" : aSelectedItem.getText(),
					"supplierId" : supplierId,
					"paymentConditions" : paymentConditions,
					"visible" : false
				};
				suppliersToken.push(oSelectedSupplier);
			}
			
			// Refresh model so that SAPUI5 refreshes bindings
			oModel.refresh();			
		},

		/**
		 * Manage value help dialog window opening
		 */ 
		handleSupplierValueHelpPress: function(oEvent){
			
			// create value help dialog
			if (!this._valueHelpDialog) {
				this._valueHelpDialog = sap.ui.xmlfragment(
					"org.fater.app.view.fragment.InputAssistedDialog",
					this
				);
				//Change type toolbar buttons
				var dialog = this._valueHelpDialog._dialog;
				dialog.getButtons()[0].setType("Accept");
				dialog.getButtons()[1].setType("Reject");				
				this.getView().addDependent(this._valueHelpDialog);
			}
 
			// open value help dialog filtered by the old search
			if (this._supplierSearch) {
				this._valueHelpDialog.open(this._supplierSearch);				
			} else {
				this._valueHelpDialog.open();				
			}
		},
		
		_handleSupplierValueHelpSearch : function (oEvent) {
			this._supplierSearch = oEvent.getParameter("value");
			var oFilter = new Filter(
				"supplierName",
				sap.ui.model.FilterOperator.Contains, 
				this._supplierSearch
			);
			oEvent.getSource().getBinding("items").filter([oFilter]);				
		},
 
		_handleSupplierLiveChangeSearch : function(oEvent) {
			var sValue = oEvent.getParameter("value");
			if (sValue.length < 3){
				oEvent.getSource().setNoDataText(this.getTranslation("atLeast3CharError"));
			} else {
				oEvent.getSource().setNoDataText("");
			}
		},
 
		_handleSupplierValueHelpClose : function (oEvent) {
			
			// Retrieve selected items
			var aSelectedItems = oEvent.getParameter("selectedContexts");
			var oModel = this.getView().getModel();
			
			if (aSelectedItems && aSelectedItems.length > 0) { //At least one supplier was selected by the user
				var oSupplierInput = this.getView().byId("supplierFilterInput");
				oModel.setProperty("/filters/suppliers",[]);
					
				for (var i in aSelectedItems){
					/* 
					* Iterate selected suppliers and add them to the model
					* (indirect binding will update graphic control's tokens)
					*/
					var oSelectedSupplier = aSelectedItems[i].getObject();
					oSelectedSupplier.visible = false;
					var alreadySelectedSuppliers = oModel.getProperty("/filters/suppliers");
					var alreadySelected = false;
					for (var j = 0; alreadySelectedSuppliers[j]; j++){
						if (alreadySelectedSuppliers[j].supplierId === oSelectedSupplier.supplierId){
							alreadySelected = true;
						}
					} 
					if (!alreadySelected){
						alreadySelectedSuppliers.push(oSelectedSupplier);
					}
				}
				
				// Remove possible valueState Error
				oSupplierInput.setValueState(sap.ui.core.ValueState.None);
				
			}
			
			// Refresh model so that SAPUI5 refreshes bindings
			oModel.refresh();
			
			this._valueHelpDialog.unbindAggregation("items");
		},
		
		_handleDeleteSupplierToken: function(oEvent) {
/*			if (this.noAddToken){
				if (oEvent.getParameter("type") === "tokensChanged"){
					this.noAddToken = false;
				}
				return;
			}*/
			
/*			if (oEvent.getParameter("type") === "tokensChanged"){
				return;
			}

			if (this._tokensChangeEventCheck){
				this._tokensChangeEventCheck = false;
				return;
			}		*/	

			if (oEvent.getParameter("type") === "removed"){			
				var oModel = this.getView().getModel();
				var supplierKey = oEvent.getParameter("token").getKey();
				var splittedKey = supplierKey.split("/");
				var supplierId = splittedKey[0];
				var supplierTokenArray = oModel.getProperty("/filters/suppliers");		
			
				oModel.setProperty(
					"/filters/suppliers", 
					$.grep(supplierTokenArray, 
						function(e){ 
							return e.supplierId !== supplierId;
						}
					)
				);				
			}
			
/*			if (oEvent.getParameter("type") === "added"){
					
				var paymentConditions = splittedKey[1];
				
				for (var i = 0; supplierTokenArray[i]; i++){
					if (supplierTokenArray[i].supplierId === supplierId){
						var oBundle = this.getResourceBundle();
						MessageBox.error(
							oBundle.getText("alreadySelectedSupplier")
						);	*/
						//Su Fiori questa parte di codice non è necessaria
/*						var supplierFilterInput = this.getView().byId("supplierFilterInput");
						var tokens = supplierFilterInput.getTokens();
						supplierFilterInput.removeToken(tokens[tokens.length - 1].getId());
						return;
					}
				} */
				
				// Remove possible valueState Error
/*				var oSupplierInput = this.getView().byId("supplierFilterInput");
				oSupplierInput.setValueState(sap.ui.core.ValueState.None);			
					
				var oSelectedSupplier = {
					"supplierName" : oEvent.getParameter("token").getText(),
					"supplierId" : supplierId,
					"paymentConditions" : paymentConditions,
					"visible" : false
				};
				supplierTokenArray.push(oSelectedSupplier);*/
				
				// Refresh model so that SAPUI5 refreshes bindings
				//oModel.refresh();				
//			}
		},		
		
		_eraseDatePickerValueStates: function(){
			var oDP1 = this.getView().byId("filterLowerBoundDatePicker"),
				oDP2 = this.getView().byId("filterUpperBoundDatePicker");
			
			oDP1.setValueState(sap.ui.core.ValueState.None);
			oDP2.setValueState(sap.ui.core.ValueState.None);
		},
		
		handleDatePickerChange:function (oEvent){
			var oDP = oEvent.getSource();
			var bValid = oEvent.getParameter("valid");			
			var oSelectedDate = oDP.getDateValue();
			this._eraseDatePickerValueStates();
			
			if (bValid) {
				oDP.setValueState(sap.ui.core.ValueState.None);
			} else {
				oDP.setValueState(sap.ui.core.ValueState.Error);
				return;
			}
			
			var sPath = "/filters/";
			var oModel = this.getView().getModel();
			var oBundle = this.getResourceBundle();
			
			if(oDP.getId().toLowerCase().indexOf("lower") !== -1){
				// check if lower date is greater than upper date
				var oUpperDate = oModel.getProperty("/filters/upperBoundDate");
				
				if (oUpperDate && (oSelectedDate > oUpperDate)){
					MessageBox.error(
						oBundle.getText("dateAreNotValidErrorMessage")
					);
					oDP.setValueState(sap.ui.core.ValueState.Error);
				}
				
				sPath += "lowerBoundDate";
			}
			else{
				// check if upper date is lower than lower date
				var oLowerDate = oModel.getProperty("/filters/lowerBoundDate");
				
				if (oLowerDate && (oSelectedDate < oLowerDate)){
					MessageBox.error(
						oBundle.getText("dateAreNotValidErrorMessage")
					);
					
					oDP.setValueState(sap.ui.core.ValueState.Error);
				}
				sPath += "upperBoundDate";
			}
			
			oModel.setProperty(sPath, oSelectedDate);
		},
		
		onFilterBarReset: function (oEvent){
			var oModel = this.getView().getModel();
			var oDefaultFilters = JSON.parse(JSON.stringify(oModel.getProperty("/defaultFilters")));
			
			oModel.setProperty("/filters", oDefaultFilters);
			this._eraseDatePickerValueStates();
			
		},
		
		_checkIfAllIsOK: function(){
			var oView = this.getView();
			
			var oDP1 = oView.byId("filterLowerBoundDatePicker"),
				oDP2 = oView.byId("filterUpperBoundDatePicker"),
				oDP1Date = new Date(oDP1.getValue()),
				today = new Date();
				
			if ( oDP1.getValue() !== undefined && oDP1Date > today){
				oDP1.setValueState("Error");
			}	
				
			return	(oDP1.getValueState() !== sap.ui.core.ValueState.Error) && 
					(oDP2.getValueState() !== sap.ui.core.ValueState.Error) &&
					(oDP1.getValue() !== undefined || oDP1Date <= today);
		},

		onFilterBarSearch: function (oEvent){
			this.onFilterBarSearchConfirm(oEvent);
			
			//CONFIRM DIALOG NO LONGER NEEDED	
/*			var that = this,
				oView = this.getView(),
				oModel = oView.getModel(),
				oDateFrom			= oModel.getProperty("/filters/lowerBoundDate"),
				oDateTo 			= oModel.getProperty("/filters/upperBoundDate");*/
				
/*			if (!oDateFrom || !oDateTo){
				var dialog = new sap.m.Dialog({
					title: that.getTranslation("warning"),
					type: 'Message',
					content: new sap.m.Text({ 
						text: that.getTranslation("confirmNoDateMessage"), 
						textAlign: "Center"
					}),
					beginButton: new sap.m.Button({
						type: "Accept",
						text: that.getTranslation("confirm"),
						press: function () {
							dialog.close();
							that.onFilterBarSearchConfirm(oEvent);
						}
					}),
					endButton: new sap.m.Button({
						type: "Reject",
						text: that.getTranslation("cancel"),
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function() {
						dialog.destroy();
					}
				});
	 
				dialog.open();			
			} else {
				this.onFilterBarSearchConfirm(oEvent);
			}*/
		},
		
		onFilterBarSearchConfirm: function (oEvent){
			var oView = this.getView();
			var that = this;
			var oSupplierInput = oView.byId("supplierFilterInput");
			oSupplierInput.setValueState(sap.ui.core.ValueState.None);
			
			var oModel = oView.getModel(),
				oTempModel = oView.getModel("tempModel"),
				oBundle = this.getResourceBundle();
			
			// Retrieve all query parameters
			var aSuppliers 			= oModel.getProperty("/filters/suppliers"),
				oDateFrom			= oModel.getProperty("/filters/lowerBoundDate"),
				oDateTo 			= oModel.getProperty("/filters/upperBoundDate"),
				sInvNumber			= oModel.getProperty("/filters/invoiceNumber");
			
			if (aSuppliers.length === 0) {
				MessageBox.error(
					oBundle.getText("noSupplierSelectedErrorMessage")
				);
				oSupplierInput.setValueState(sap.ui.core.ValueState.Error);
				return;
			}
			
			if (!this._checkIfAllIsOK()){
				MessageBox.error(
					oBundle.getText("unableToProceedErrorMessage")
				);
				return;
			}
			
			var aFilters = [];
			
			// Iterate through selected suppliers to retrieve IDs
			var aSupplierIDs = [];
			for (var j in aSuppliers){
				aSupplierIDs.push(new sap.ui.model.Filter("supplierId", sap.ui.model.FilterOperator.EQ, aSuppliers[j].supplierId));
			}
			aSupplierIDs = new sap.ui.model.Filter(aSupplierIDs, false);
			aFilters.push(aSupplierIDs);
			
			if (oDateFrom && oDateTo){
				oDateTo.setHours(oDateTo.getHours() + 12);
				oDateFrom.setHours(oDateFrom.getHours() + 12);					
				var oDateFilter = new sap.ui.model.Filter({
				   path: "docDate",
				   operator: sap.ui.model.FilterOperator.BT,
				   value1: oDateFrom,
				   value2: oDateTo
				});
				aFilters.push(oDateFilter);
			} else {
				if (oDateFrom){
					oDateFrom.setHours(oDateFrom.getHours() + 12);
					var oDateFromFilter = new sap.ui.model.Filter("docDate", sap.ui.model.FilterOperator.GE, oDateFrom);
					aFilters.push(oDateFromFilter);
				}
				
				if (oDateTo){
					oDateTo.setHours(oDateTo.getHours() + 12);
					var oDateToFilter = new sap.ui.model.Filter("docDate", sap.ui.model.FilterOperator.LE, oDateTo);
					aFilters.push(oDateToFilter);
				}				
			}
			
			if (sInvNumber){
				var sInvNumberFilter = new sap.ui.model.Filter("docNumber", sap.ui.model.FilterOperator.EQ, sInvNumber);
				aFilters.push(sInvNumberFilter);
			}
			
			if (oDateFromFilter || oDateToFilter || sInvNumberFilter){
				aFilters = [new sap.ui.model.Filter(aFilters, true)];				
			}
			
			// Disable user interactions
			oView.setBusy(true);
			oTempModel.setProperty("/dataLoaded",false);
			
			var sPath = "/SuspInvoiceSet";
			var	mParameters = {
				filters : aFilters,
                success : function (oData) {
                	var aInvoices = aSuppliers;
					for(var x = 0; aInvoices[x]; x++){ 
						aInvoices[x].visible = false;
						aInvoices[x].SuspInvoices = [];
						
						//Used for space at the end of the tables
						if (x  === aInvoices.length -  1){
							aInvoices[x].lastSupplier = true;
						} else {
							aInvoices[x].lastSupplier = false;
						}
						
                		for (var i = 0; oData.results[i]; i++){
							var sSupplierId = oData.results[i];
							if (sSupplierId.supplierId === aInvoices[x].supplierId){
								aInvoices[x].SuspInvoices.push(sSupplierId);
								aInvoices[x].visible = true;
							} 
						}
						
						//save documents count
						aInvoices[x].documentsCount = aInvoices[x].SuspInvoices.length;						
                	}
                	
                	// Create text for no data supplier
                	var text = "";
                	var noInvoicesSupplierNumber = 0;
					for(var y = 0; aInvoices[y]; y++){ 
						if (!aInvoices[y].SuspInvoices || aInvoices[y].SuspInvoices.length === 0){
							text = text + aInvoices[y].supplierName + ", ";
							noInvoicesSupplierNumber++;
						}
					}
					
					if (text.length > 0){
						text = text.substr(0, text.length - 2);
						if (noInvoicesSupplierNumber === 1){
							MessageBox.information(
								oBundle.getText("noInvoicesSingleSupplierMessage", [text])
							);							
						} else {
							MessageBox.information(
								oBundle.getText("noInvoicesMessage") + ": " + text
							);
						} 						
					}
					
					if (oData.results.length > 0){
						oTempModel.setProperty("/documentsCount", oData.results.length);
						that.getView().byId("supplierFilterBar").setFilterBarExpanded(false);
					}
					
					if (oDateTo){
						oDateTo.setHours(oDateTo.getHours() - 12);	
					}
					if (oDateFrom){
						oDateFrom.setHours(oDateFrom.getHours() - 12);
					}					
                	
					oModel.setProperty(
						"/invoices",
						aInvoices
					);
					
					oTempModel.setProperty(
						"/config/dataLoaded",
						true
					);                	
					oView.setBusy(false);
                },
                error: function (oError) {
                    jQuery.sap.log.info("Odata Error occured");
                    oView.setBusy(false);
                }
            };
            oView.setBusy(true);
			oView.getModel("oPTModel").read(sPath, mParameters);				
		},
		
		onTablePersonalizationButtonPressed: function(oEvent){
			this._selectedHeaderPersoTable = oEvent.getSource().getParent().getParent();
			var grid = oEvent.getSource().getParent().getParent().getParent();
			this._selectedPersoTable = grid.getContent()[1].getContent()[0];			
			if (!this._personalizationDialog){
				this._personalizationDialog = sap.ui.xmlfragment(
					"org.fater.app.view.fragment.TablePersonalizationDialog",
					this
				);
				this.getView().addDependent(this._personalizationDialog);
			}
			
			// this._personalizationDialog.setMultiSelect(true);
			this._personalizationDialog.getButtons()[0].setType("Accept");
			this._personalizationDialog.open();
		},
		
		handleTablePersonalizationDialogOKButtonPress: function(oEvent){
			var items = this._personalizationDialog.getContent()[0].getItems();
			for (var i = 0; items[i]; i++){
				if (items[i].getSelected()){
					this._selectedHeaderPersoTable.getColumns()[i].setVisible(true);
					this._selectedPersoTable.getColumns()[i].setVisible(true);
				} else {
					this._selectedHeaderPersoTable.getColumns()[i].setVisible(false);
					this._selectedPersoTable.getColumns()[i].setVisible(false);
				}
			}
			this._personalizationDialog.close();
		},

		onTableSortingButtonPressed: function (oEvent){
			var grid = oEvent.getSource().getParent().getParent().getParent();
			this._selectedSortTable = grid.getContent()[1].getContent()[0];
			this._getDialog().open("sort");
		},
		
		_getDialog : function () {
			if (!this._oTableVSDialog) {
				this._oTableVSDialog = sap.ui.xmlfragment("org.fater.app.view.fragment.ViewSettingsDialog", this);
				this.getView().addDependent(this._oTableVSDialog);
			}
			return this._oTableVSDialog;
		},	
		
		_handleSortConfirm: function(oEvent){
			var oBinding = this._selectedSortTable.getBinding("items");
			var sortItem = oEvent.getParameter("sortItem").getKey();
			var aSorters = [];
			var sOrder = oEvent.getParameter("sortDescending");
			var sorter = new Sorter(sortItem, sOrder);
			if (sortItem === "amount"){
				sorter.fnCompare = function(value1, value2){
					var value1Float = parseFloat(value1);
					var value2Float = parseFloat(value2);
					if (value1.indexOf("-") !== -1){
						value1Float = -value1Float;
					}
					if (value2.indexOf("-") !== -1){
						value2Float = -value2Float;
					}					
					if(value1Float < value2Float){ 
						return -1;
					}
					if(value1Float === value2Float){
						return 0;
					} 
					if(value1Float > value2Float){ 
						return 1;
					}           
				};
			}
			aSorters.push(sorter);
			oBinding.sort(aSorters);
		},
		
		/**
		 * CSV Export
		 */
		onExcelExportButtonPressed: function(oEvent){
			var oButton = oEvent.getSource();
			
			var oContext = oButton.getBindingContext();
			var oSupplier = oContext.getObject();
			
			var sSupplierName		= oSupplier.supplierName,
				sSupplierId 		= oSupplier.supplierId,
				sPaymentConditions	= oSupplier.paymentConditions,
				aLines				= oSupplier.SuspInvoices,
				
				sReportTitle = "Report " + sSupplierName + " (" + sSupplierId + ")";
			
			var sCSV = this._generateCSVData(
				sSupplierName,
				sSupplierId,
				sPaymentConditions,
				aLines,
				sReportTitle
			);
			
			this._downloadCSVFile(sReportTitle, sCSV);
		},
		
		_generateCSVData: function(sSupplierName, sSupplierId, sPaymentConditions, aLines, sReportTitle){
			
			var sCSV = "",
				oBundle = this.getResourceBundle();
			
		    //Set Report title in first row or line
		    sCSV += sReportTitle + '\r\n';
		    sCSV += oBundle.getText("paymentConditionLabel") + ": " + sPaymentConditions + '\r\n\n';
		
		    //Generate the Header of line items table structure
	        var row = "";
	        
            row +=	oBundle.getText("docNumberLabel")			+ ";" +
					oBundle.getText("documentDateLabel")		+ ";" +
					oBundle.getText("docAmountLabel")			+ ";" +
					""	/* Empty column header for currency*/	+ ";" +
					oBundle.getText("docStatusLabel")			+ ";" +
					oBundle.getText("docAgentLabel");
	
	        //append Label row with line break
	        sCSV += row + '\r\n';
		    
		    //1st loop is to extract each row
		    for (var i = 0; i < aLines.length; i++) {
		        
				var dateType = new sap.ui.model.type.Date();
		        var date = dateType.formatValue(aLines[i].docDate, "string");
				var change = [];
		        var sInternalType = "string";
		        var amount1 = new sap.ui.model.type.Currency({showMeasure: false});
		        var notFormattedAmount = aLines[i].amount;
				if (notFormattedAmount.substr(notFormattedAmount.length - 1) === "-"){
					var formattedAmount = "-" + notFormattedAmount.substr(0, notFormattedAmount.length - 1);
				} else {
					var formattedAmount	= notFormattedAmount;					
				}			        
		        change.push(formattedAmount);
		        change.push("EUR");
		        var amount = amount1.formatValue(change, sInternalType);
		        
		        //var status = formatter.statusFormatter(aLines[i].status);
		        var status = this.getTranslation("inProcess");
		        
		        row = "";
		        row +=	((aLines[i].docNumber)			?	aLines[i].docNumber				:	" ")	+ ";" +
						((date) 						?	date							:	" ")	+ ";" +
						((amount)						?	amount							:	" ")	+ ";" +
						((aLines[i].currency)			?	aLines[i].currency				:	" ")	+ ";" +
						((status)						?	status							:	" ")	+ ";" +
						((aLines[i].agent)				?	aLines[i].agent					:	" ");
						
		        // row.slice(0, row.length - 1);
		        
		        //add a line break after each row
		        sCSV += row + '\r\n';
		    }
		
		    if (sCSV === "") {        
		        MessageBox.error("Invalid data");
		        return;
		    }   
		    
		    return sCSV;
		},
		
		/**
		 * CSV Download
		 */
		_downloadCSVFile: function(sReportTitle,sCSV){
			//Generate a file name
		    //this will remove the blank-spaces from the title and replace it with an underscore
		    var sFileName = sReportTitle.replace(/ /g,"_");   
		    
		    //Initialize file format you want csv or xls
		    var uri = 'data:text/csv;charset=utf-8,' + escape(sCSV);
		    
		    // Now the little tricky part.
		    // you can use either>> window.open(uri);
		    // but this will not work in some browsers
		    // or you will not get the correct file extension    
		    
		    //this trick will generate a temp <a /> tag
		    var link = document.createElement("a");    
		    link.href = uri;
		    
		    //set the visibility hidden so it will not effect on your web-layout
		    link.style = "visibility:hidden";
		    link.download = sFileName + ".csv";
		    
		    //this part will append the anchor tag and remove it after automatic click
		    document.body.appendChild(link);
		    link.click();
		    document.body.removeChild(link);
		},
		
		/**
		 * Export all suppliers' details to CSV
		 */
		onExportAllPress: function (oEvent){
		 	
		 	var oModel		 = this.getView().getModel(),
		 		oBundle 	 = this.getResourceBundle(),
		 		sCSV		 = "",
		 		sReportTitle = "";
		 	
		 	var aData = oModel.getProperty("/invoices");
		 	
		 	if (!aData){
		 		MessageBox.error(
					oBundle.getText("noDataToExportErrorMessage")
				);
				
				return;
		 	}
		 	
		 	for (var i in aData){
		 		
		 		var oSupplier = aData[i],
		 			
		 			aLines = oSupplier.SuspInvoices,
		 			sSupplierId = oSupplier.supplierId,
		 			sSupplierName = oSupplier.supplierName,
		 			sPaymentConditions = oSupplier.paymentConditions;
		 			
	 			sReportTitle = "Report " + sSupplierName + " (" + sSupplierId + ")";
		 		
		 		sCSV += this._generateCSVData(sSupplierName, sSupplierId, sPaymentConditions, aLines, sReportTitle);
		 		
		 		if (i < (aData.length - 1)){
		 			sCSV += "\r\n\r\n";
		 		}
		 	}
		 	
		 	sReportTitle = "All_Reports";
		 	
		 	this._downloadCSVFile(sReportTitle, sCSV);
		},
		
		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
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
		},
		
		_getRouter: function() {
			return sap.ui.core.UIComponent.getRouterFor(this);
		}		
	});

});