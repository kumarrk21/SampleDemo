({
    doInit: function(cmp, evt, helper) {
        cmp.set('v.pricingData', {});
        cmp.set('v.skuList', new Array());
        cmp.set('v.rplsku', {});
        var accountId = cmp.get('v.accountId');
        if(accountId != null && accountId != ''){
            helper.getAccountInfo(cmp,evt,accountId,true);
        }
        helper.getInitData(cmp, evt);
    },


    filterAccounts: function(cmp, evt, helper) {
        var filterValue = cmp.find('_account').getElement().value;
        if(_.size(filterValue)>0){
            $A.util.addClass(cmp.find("_accountLookup"), "slds-is-open");
            $A.util.addClass(cmp.find("_body"), "slds-hide");
            $A.util.addClass(cmp.find("_leadLookup"), "slds-hide");
        }else{
            $A.util.removeClass(cmp.find("_accountLookup"), "slds-is-open");
            $A.util.removeClass(cmp.find("_body"), "slds-hide");
            $A.util.removeClass(cmp.find("_leadLookup"), "slds-hide");
        }
        cmp.set('v.accFilter',filterValue);
    },

    getAccountList: function(cmp,evt,helper){
        helper.gatAccountList(cmp,evt);
    },

    addSku: function(cmp, evt, helper) {
        helper.addSku(cmp, evt);
    },

    getPrice: function(cmp, evt, helper) {
        var skuList = cmp.get('v.skuList');
        _.forEach(skuList, function(item) {
            item.showPrice = 'slds-show';
        })
        cmp.set('v.skuList', skuList);
    },

    getPDF: function(cmp, evt, helper) {
        var pdfClickedEvent = $A.get("e.c:PriceRightGetPDF");
        pdfClickedEvent.fire();
    },

    getAccountInfo: function(cmp, evt, helper) {
        var target;
        if (evt.getSource) {
            target = evt.getSource();
        } else {
            target = evt.target.id;
        }
        helper.getAccountInfo(cmp, evt,target,true);
    },

    getAccountInfoFromLead:function(cmp,evt,helper){
        var selectElem = cmp.find('_pmSelect').getElement();
        helper.getAccountInfo(cmp, evt,selectElem.value,false);
    },

    updSkuItem: function(cmp, evt, helper) {
        var skuList = cmp.get('v.skuList');
        _.forEach(skuList, function(item) {
            item.extPrice = item.newPrice * item.qty;
            item.impact = (item.currPrice - item.newPrice) * item.qty;
        })
        cmp.set('v.skuList', skuList);
    },

    openMenu: function(cmp, evt, helper) {
        if (cmp.get('v.menuAlreadyOpen')) {
            $A.util.removeClass(cmp.find("_menu"), "slds-is-open");
            cmp.set('v.menuAlreadyOpen', false);
        } else {
            $A.util.addClass(cmp.find("_menu"), "slds-is-open");
            cmp.set('v.menuAlreadyOpen', true);
        }

    },

    goMain:function(cmp,evt,helper){
    	$A.util.removeClass(cmp.find("_container"), "slds-hide");
    	$A.util.addClass(cmp.find("_pdfContainer"), "slds-hide");
    },

    checkSkus:function(cmp,evt,helper){
        var skuList = cmp.get('v.skuList');
        var pricingData = cmp.get('v.pricingData');
        pricingData.skuList = skuList;
        cmp.set('v.pricingData',pricingData);
        console.log('Pricing Data', pricingData);
        if(skuList.length>0){
            $A.util.removeClass(cmp.find("_closeSection"), "slds-hide");
        }else{
            $A.util.addClass(cmp.find("_closeSection"), "slds-hide");

        }
    },

    getMaster:function(cmp,evt,helper){
        
        
        if( (typeof sforce != 'undefined') && (sforce !=null)){
            sforce.one.navigateToURL('https://www.staples.com');
        }else{
            window.open('https://www.staples.com','_blank');
        }
        
        //var masterAcc = Math.floor(Math.random()*100000);
        //console.log('Master Account is', masterAcc);
        //cmp.set('v.masterAcc', masterAcc);

    },

    submit:function(cmp,evt,helper){
        helper.submit(cmp,evt);
    },

    deletesku: function(cmp, evt, helper) {
        var target;
        if (evt.getSource) {
            target = evt.getSource();
        } else {
            target = evt.target.id;
        }
        console.log('target is', target);
        var skuList = cmp.get('v.skuList');
        var filteredList = _.remove(skuList,function(item){
        						return item.skuId == target;
        					})
        cmp.set('v.skuList',skuList);

    },

    replacesku:function(cmp,evt,helper){
        var target;
        if (evt.getSource) {
            target = evt.getSource();
        } else {
            target = evt.target.id;
        }
        
        var skuList = cmp.get('v.skuList');
        var rplsku = _.find(skuList,function(item){
                        return item.skuId == target;
                    })
        cmp.set('v.rplsku',rplsku);

        $A.util.removeClass(cmp.find("_skuModal"), "slds-hide");
    },

    confirmReplaceSku:function(cmp,evt,hepler){
        var rplsku = cmp.get('v.rplsku');
        var skuList = cmp.get('v.skuList');
        var idx = _.findIndex(skuList,function(item){
                        return item.skuId == rplsku.skuId;
                       });
        if(idx>=0){
            skuList[idx] = rplsku.rplSku;
        }
        cmp.set('v.skuList',skuList);
        $A.util.addClass(cmp.find("_skuModal"), "slds-hide");

    },

    cancelReplaceSku:function(cmp,evt,helper){
        cmp.set('v.rplsku',{});
        $A.util.addClass(cmp.find("_skuModal"), "slds-hide");
    }
})