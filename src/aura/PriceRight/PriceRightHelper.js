({
    getInitData: function(cmp,evt) {
        var apexMethod = cmp.get('c.getInitData');
        apexMethod.setParam('leadId',cmp.get('v.leadId'));
        apexMethod.setParam('accountId',cmp.get('v.accountId'));
        apexMethod.setCallback(this, function(response) {
            var state = response.getState();
            if (state == 'SUCCESS') {
                var ret = JSON.parse(response.getReturnValue());
                if(ret.success){
                	var initData = JSON.parse(ret.message);
                    console.log('InitData is', initData);
                	cmp.set('v.mmOptions',initData.mmOptions);
                    var pricingData = cmp.get('v.pricingData');
                    pricingData.leadData = initData.pricingLead;
                    cmp.set('v.pricingData',pricingData);
                	console.log('InitData is', initData);
                }else{
                	this.throwError("Error getting mid market options " + response.ret.message);
                	console.log(ret.message)
                }
            } else {
            	this.throwError("Error getting mid market options " + response.getError());
            	console.log(response.getError());
            }
        });
        $A.enqueueAction(apexMethod);
    },

    addSku:function(cmp,evt){
    	this.showSpinner(cmp);
    	var apexMethod = cmp.get('c.getSku');
    	//var skuId = cmp.find('_sku').get("v.value");
    	var findSkuElem = cmp.find('_sku').getElement();
    	apexMethod.setParam('skuId',findSkuElem.value);
    	apexMethod.setCallback(this, function(response) {
    		this.hideSpinner(cmp);
            var state = response.getState();
            if (state == 'SUCCESS') {
                var ret = JSON.parse(response.getReturnValue());
                if(ret.success){
                	var sku = JSON.parse(ret.message);
                	var skuList = cmp.get('v.skuList');

                	skuList.push(sku);
                	cmp.set('v.skuList', skuList);
                	cmp.set('v.sku','');
                	findSkuElem.value = '';
                	console.log('InitData is', skuList);
                }else{
                	this.throwError("Error getting mid market options " + response.ret.message);
                	console.log(ret.message)
                }
            } else {
            	this.throwError("Error getting mid market options " + response.getError());
            	console.log(response.getError());
            }
        });
        $A.enqueueAction(apexMethod);


    },


    gatAccountList:function(cmp,evt){
        this.showSpinner(cmp);
        var apexMethod = cmp.get('c.getAccounts');
        var accName = escape(cmp.get('v.accFilter'));
        apexMethod.setParam('accName',accName);
        apexMethod.setCallback(this, function(response) {
            this.hideSpinner(cmp);
            var state = response.getState();
            if (state == 'SUCCESS') {
                var ret = JSON.parse(response.getReturnValue());
                if(ret.success){
                    var accountList = JSON.parse(ret.message);
                    cmp.set('v.accountList', accountList);
                    console.log('account list', accountList);
                    $A.util.addClass(cmp.find("_lookupPattern"), "slds-hide");
                    $A.util.removeClass(cmp.find("_lookupList"), "slds-hide");
                }else{
                    this.throwError("Error getting Account Info " + response.ret.message);
                    console.log(ret.message)
                }
            } else {
                this.throwError("Error getting Account Info " + response.getError());
                console.log(response.getError());
            }
        });
        $A.enqueueAction(apexMethod);

    },

    getAccountInfo:function(cmp,evt,accId,accountExists){
    	this.showSpinner(cmp);
    	var apexMethod = cmp.get('c.getSelectAccountInfo');
    	apexMethod.setParam('accId',accId);
    	apexMethod.setCallback(this, function(response) {
    		this.hideSpinner(cmp);
            var state = response.getState();
            if (state == 'SUCCESS') {
                var ret = JSON.parse(response.getReturnValue());
                if(ret.success){
                	var selectedAcc = JSON.parse(ret.message);
                	cmp.set('v.selectedAcc', selectedAcc);
                	cmp.set('v.skuList', new Array());
                    if(accountExists){
                        var pricingData = cmp.get('v.pricingData');
                        pricingData.accountData = selectedAcc;
                         cmp.set('v.pricingData',pricingData);
                         console.log('Pricing data is', pricingData);
                         try{
                            cmp.find('_account').getElement().value = selectedAcc.Name;
                         }catch(e){
                            
                         }
                         
                    }
                    console.log('selected accont is', selectedAcc);
                    $A.util.removeClass(cmp.find("_accountLookup"), "slds-is-open");
                    $A.util.removeClass(cmp.find("_body"), "slds-hide");
                    $A.util.removeClass(cmp.find("_leadLookup"), "slds-hide");
                    $A.util.removeClass(cmp.find("_lookupPattern"), "slds-hide");
                    $A.util.addClass(cmp.find("_lookupList"), "slds-hide");
                }else{
                	this.throwError("Error getting Account Info " + response.ret.message);
                	console.log(ret.message)
                }
            } else {
            	this.throwError("Error getting Account Info " + response.getError());
            	console.log(response.getError());
            }
        });
        $A.enqueueAction(apexMethod);

    },

    submit:function(cmp,evt){
        this.showSpinner(cmp);
        var pricingData = escape(JSON.stringify(cmp.get('v.pricingData')));
        var leadId = cmp.get('v.leadId');
        var apexMethod = cmp.get('c.postData');
        apexMethod.setParam('accountId',cmp.get('v.accountId'));
        apexMethod.setParam('leadId',cmp.get('v.leadId'));
        apexMethod.setParam('tData',pricingData);
        apexMethod.setParam('createSR',cmp.find('_createSR').getElement().checked);

        apexMethod.setCallback(this, function(response) {
            this.hideSpinner(cmp);
            var state = response.getState();
            if (state == 'SUCCESS') {
                var ret = JSON.parse(response.getReturnValue());
                if(ret.success){
                    var oppId = JSON.parse(ret.message);
                    
                    if( (typeof sforce != 'undefined') && (sforce !=null)){
                            /*
                            var toastEvent = $A.get("e.force:showToast");
                                toastEvent.setParams({
                                "title": "Success!",
                                "message": "Opportunity Created Successfully"
                            });

                            toastEvent.fire();
                            */
                            sforce.one.navigateToSObject(oppId);
                    }else{
                            window.open('/'+oppId,'_blank');
                    }
                }else{
                    this.throwError("Error getting Account Info " + response.ret.message);
                    console.log(ret.message)
                }
            } else {
                this.throwError("Error getting Account Info " + response.getError());
                console.log(response.getError());
            }
        });
        $A.enqueueAction(apexMethod);
    },


    hideSpinner:function(cmp){
    	$A.util.addClass(cmp.find("_spinner"), "slds-hide");
    },

    showSpinner:function(cmp){
    	$A.util.removeClass(cmp.find("_spinner"), "slds-hide");
    },

    throwError:function(errText){
    	throw new Error(errText);
    }


})