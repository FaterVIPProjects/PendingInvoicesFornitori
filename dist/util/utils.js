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
		}
	};
});