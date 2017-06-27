// AS - FIX bug #009: Creazione del file di utility

sap.ui.define([

], function() {
	"use strict";

	return {
		getTotal: function(invoices) {
			if (!invoices) {
				return "";
			}
			var total = 0;
			var change = [];
			var sInternalType = "string";
			var amount1 = new sap.ui.model.type.Currency({
				showMeasure: false
			});

			for (var i = 0; invoices[i]; i++) {
				if (invoices[i].amount.substr(invoices[i].amount.length - 1) === "-") {
					var amount = invoices[i].amount.substr(0, invoices[i].amount.length - 1);
					total -= parseFloat(amount, 10);
				} else {
					total += parseFloat(invoices[i].amount, 10);
				}
			}

			change.push(total);
			var currency;
			if (invoices[0])
				currency = invoices[0].currency;
			else
				currency = 'EUR';
			change.push(currency);
			return amount1.formatValue(change, sInternalType) + " " + currency;
		},

		splitSuppliersForCurrency: function(aInvoices) {
			// FIX AS: SPLIT DOCUMENTI PER DIVISA
			var newSuppliers = [];
			if (aInvoices.length > 0) {
				for (var x = 0; aInvoices[x]; x++) {
					var currentSupplier = aInvoices[x];
					var invoices = currentSupplier.SuspInvoices;
					if (invoices && invoices.length > 0) {
						currentSupplier.SuspInvoices = [];
						var currentCurrency = invoices[0].currency;
						for (var y = 0; invoices[y]; y++) {
							var currency = invoices[y].currency;
							if (currency === currentCurrency) {
								currentSupplier.SuspInvoices.push(invoices[y]);
							} else {
								currentSupplier.currency = currentCurrency;
								currentSupplier.documentsCount = currentSupplier.SuspInvoices.length;
								newSuppliers.push(currentSupplier);
								currentCurrency = currency;

								var newSupplier = jQuery.extend(true, {}, currentSupplier);
								var newInvoices = [];
								newInvoices.push(invoices[y]);
								newSupplier.SuspInvoices = newInvoices;
								currentSupplier = newSupplier;
							}
						}
						currentSupplier.currency = currentCurrency;
						currentSupplier.documentsCount = currentSupplier.SuspInvoices.length;
						newSuppliers.push(currentSupplier);
					} else {
						currentSupplier.currency = currentCurrency;
						currentSupplier.documentsCount = currentSupplier.SuspInvoices.length;
						newSuppliers.push(currentSupplier);
					}
				}
			}

			return newSuppliers;
		}
	};
});